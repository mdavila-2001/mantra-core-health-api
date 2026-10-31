import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException, touch } from '../../../../../common';
import { AUD } from '../../../../audit/audit.concepts';
import { OutboxService } from '../../../../messaging/services/outbox.service';
import { CleaningOrders, type CareSpaces } from '../../../entities';
import { PRAC } from '../../../practice.concepts';
import type {
  CleaningOrderDto,
  CreateCleaningOrderDto,
  InspectCleaningOrderDto,
} from '../../../dto';
import {
  hygieneAfter,
  judgeCleaningTransition,
  judgeInspection,
  judgeManualCleaningType,
  type CleaningAction,
} from '../../../domain/ops/cleaning-rules';
import {
  CLEANING_STATUS,
  CLEANING_TRIGGER,
  CLEANING_TYPE,
  codeFor,
  type CleaningStatusCode,
  type CleaningTypeCode,
} from '../../../domain/ops/ops-catalog';
import { TERMINAL_INSPECTORS } from '../../../policies/infra-f2.policy';
import { assertIfMatch } from '../../structure-input';
import {
  InfrastructureAccessService,
  type ResolvedTarget,
} from '../../infrastructure-access.service';
import type { InfraRole } from '../../../domain/ops/infra-scope';
import { CareSpaceOpsCore } from '../care-space-ops-core';
import { CleaningOrderObservers } from '../cleaning-order-observers';
import { OpsCellBuilder } from '../ops-cell-builder';
import { OPS_EVENTS, publishOpsEvent, type OpsEventType } from '../ops-events';
import { enforce, flushInfra, guardInfraWrite } from '../ops-errors';
import type { OpsRequest } from './change-availability.use-case';

/**
 * `POST /sites/:siteId/cleaning-orders` (§F2.3): orden manual. 409
 * `CLEANING_ORDER_ALREADY_OPEN`; 422 `TERMINAL_CLEANING_REQUIRED` si se pide
 * otro tipo con la bandera terminal prendida.
 */
@Injectable()
export class CreateCleaningOrderUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly core: CareSpaceOpsCore,
    private readonly cells: OpsCellBuilder,
  ) {}

  /**
   * @param siteId - Sede de la ruta.
   * @param dto - Espacio, tipo y prioridad.
   * @param req - Actor, tenant y requestId.
   */
  execute(
    siteId: string,
    dto: CreateCleaningOrderDto,
    req: OpsRequest,
  ): Promise<CleaningOrderDto> {
    return this.em.transactional(async (tx) => {
      const { target } = await this.access.assertCan(
        req.actor,
        'f2.cleaning.create',
        { careSpaceId: dto.careSpaceId },
        tx,
        req.tenantId,
      );
      if (target.site.id !== siteId) {
        throw new ResourceNotFoundException('Espacio no encontrado', {
          spaceId: dto.careSpaceId,
        });
      }
      await this.core.lock(tx, [dto.careSpaceId]);
      const space = target.space as CareSpaces;
      await tx.refresh(space);
      enforce(
        judgeManualCleaningType(dto.typeCode, space.terminalCleaningRequired),
      );
      const { order } = await this.core.openCleaningOrder(
        tx,
        space,
        target.site.practiceId,
        {
          type: dto.typeCode,
          trigger: 'CLN_TRG_MANUAL',
          priority: dto.priorityCode,
        },
        {
          actor: req.actor,
          requestId: req.requestId,
          source: 'CLEANING',
          reasonText: dto.note,
        },
      );
      return this.cells.order(order, space);
    });
  }
}

/** Lo cargado de una orden para una transición. */
interface LoadedOrder {
  order: CleaningOrders;
  space: CareSpaces;
  target: ResolvedTarget;
  roles: Set<InfraRole>;
  from: CleaningStatusCode;
}

/**
 * Base de las cinco transiciones de una orden (`assign|start|finish|inspect|
 * cancel`): carga la orden del tenant (404), autoriza sobre su espacio,
 * bloquea el espacio, exige `If-Match` con la `row_version` de la orden (412 de
 * F1) y valida la transición (409 `CLEANING_ORDER_INVALID_TRANSITION`).
 */
@Injectable()
abstract class CleaningOrderTransition {
  protected abstract readonly action: CleaningAction;
  protected abstract readonly permission: string;

  constructor(
    protected readonly em: EntityManager,
    protected readonly access: InfrastructureAccessService,
    protected readonly core: CareSpaceOpsCore,
    protected readonly cells: OpsCellBuilder,
    protected readonly outbox: OutboxService,
    protected readonly observers: CleaningOrderObservers,
  ) {}

  protected async load(
    tx: EntityManager,
    orderId: string,
    ifMatch: string | undefined,
    req: OpsRequest,
    failed = false,
  ): Promise<LoadedOrder> {
    const found = await tx.findOne(CleaningOrders, { id: orderId });
    if (!found || found.tenantId !== req.tenantId) {
      throw new ResourceNotFoundException('Orden de limpieza no encontrada', {
        orderId,
      });
    }
    const { target, roles } = await this.access.assertCan(
      req.actor,
      this.permission,
      { careSpaceId: found.careSpaceId },
      tx,
      req.tenantId,
    );
    await this.core.lock(tx, [found.careSpaceId]);
    const order = (await tx.refresh(found)) as CleaningOrders;
    const space = target.space as CareSpaces;
    await tx.refresh(space);
    assertIfMatch(ifMatch, order.rowVersion);
    const from = codeFor(
      CLEANING_STATUS,
      order.statusConceptId,
    ) as CleaningStatusCode;
    enforce(judgeCleaningTransition(from, this.action, failed));
    return { order, space, target, roles, from };
  }

  /** Cierra la transición: versión, historia, evento y observadores. */
  protected async seal(
    tx: EntityManager,
    loaded: LoadedOrder,
    eventType: OpsEventType,
    req: OpsRequest,
  ): Promise<void> {
    const { order, space } = loaded;
    touch(order, req.actor.id);
    await flushInfra(tx);
    await this.core.appendHistory(
      tx,
      'cleaning',
      order,
      AUD.OPERATION_UPDATE,
      req.actor.id,
    );
    await guardInfraWrite(() =>
      publishOpsEvent(this.outbox, tx, eventType, {
        tenantId: space.tenantId,
        aggregateId: order.id,
        actorUserId: req.actor.id,
        payload: this.core.orderPayload(order, req),
      }),
    );
    await this.observers.notify(tx, {
      eventType,
      order,
      cleaningType: codeFor(
        CLEANING_TYPE,
        order.cleaningTypeConceptId,
      ) as CleaningTypeCode,
      actorUserId: req.actor.id,
      requestId: req.requestId,
    });
  }

  /** Mueve la higiene del espacio según la transición. */
  protected async moveHygiene(
    tx: EntityManager,
    loaded: LoadedOrder,
    req: OpsRequest,
    failed = false,
  ): Promise<void> {
    const to = hygieneAfter(this.action, failed);
    if (!to) return;
    await this.core.changeAxis(
      tx,
      loaded.space,
      loaded.target.site.practiceId,
      'HYGIENE',
      to,
      {
        actor: req.actor,
        requestId: req.requestId,
        source: 'CLEANING',
        sourceRefId: loaded.order.id,
      },
    );
  }
}

/** `POST /cleaning-orders/:id/assign {userId|null}`. */
@Injectable()
export class AssignCleaningOrderUseCase extends CleaningOrderTransition {
  protected readonly action = 'assign' as const;
  protected readonly permission = 'f2.cleaning.assign';

  /**
   * @param orderId - Orden.
   * @param userId - Asignado, o `null` para desasignar.
   * @param ifMatch - `If-Match` (row_version de la orden).
   * @param req - Actor, tenant y requestId.
   */
  execute(
    orderId: string,
    userId: string | null,
    ifMatch: string | undefined,
    req: OpsRequest,
  ): Promise<CleaningOrderDto> {
    return this.em.transactional(async (tx) => {
      const loaded = await this.load(tx, orderId, ifMatch, req);
      loaded.order.assignedUserId = userId ?? undefined;
      await this.seal(tx, loaded, OPS_EVENTS.cleaningAssigned, req);
      return this.cells.order(loaded.order, loaded.space);
    });
  }
}

/** `POST /cleaning-orders/:id/start`: PENDING → IN_PROGRESS, higiene CLEANING. */
@Injectable()
export class StartCleaningOrderUseCase extends CleaningOrderTransition {
  protected readonly action = 'start' as const;
  protected readonly permission = 'f2.cleaning.work';

  /**
   * @param orderId - Orden.
   * @param ifMatch - `If-Match`.
   * @param req - Actor, tenant y requestId.
   */
  execute(
    orderId: string,
    ifMatch: string | undefined,
    req: OpsRequest,
  ): Promise<CleaningOrderDto> {
    return this.em.transactional(async (tx) => {
      const loaded = await this.load(tx, orderId, ifMatch, req);
      const now = new Date();
      loaded.order.statusConceptId = CLEANING_STATUS.CLN_IN_PROGRESS;
      loaded.order.startedAt = now;
      loaded.order.startedByUserId = req.actor.id;
      loaded.order.assignedUserId ??= req.actor.id;
      await this.seal(tx, loaded, OPS_EVENTS.cleaningStarted, req);
      await this.moveHygiene(tx, loaded, req);
      return this.cells.order(loaded.order, loaded.space);
    });
  }
}

/** `POST /cleaning-orders/:id/finish {note?}`: IN_PROGRESS → DONE, higiene CLEAN. */
@Injectable()
export class FinishCleaningOrderUseCase extends CleaningOrderTransition {
  protected readonly action = 'finish' as const;
  protected readonly permission = 'f2.cleaning.work';

  /**
   * @param orderId - Orden.
   * @param ifMatch - `If-Match`.
   * @param req - Actor, tenant y requestId.
   */
  execute(
    orderId: string,
    ifMatch: string | undefined,
    req: OpsRequest,
  ): Promise<CleaningOrderDto> {
    return this.em.transactional(async (tx) => {
      const loaded = await this.load(tx, orderId, ifMatch, req);
      loaded.order.statusConceptId = CLEANING_STATUS.CLN_DONE;
      loaded.order.finishedAt = new Date();
      loaded.order.finishedByUserId = req.actor.id;
      await this.seal(tx, loaded, OPS_EVENTS.cleaningFinished, req);
      await this.moveHygiene(tx, loaded, req);
      return this.cells.order(loaded.order, loaded.space);
    });
  }
}

/**
 * `POST /cleaning-orders/:id/inspect {result, reasonText?}`. PASS → INSPECTED
 * e higiene INSPECTED (si la orden o el espacio exigen limpieza terminal, sólo
 * un supervisor la aprueba y apaga la bandera). FAIL → REJECTED, orden nueva
 * PENDING (`previous_order_id`, `CLN_TRG_INSPECTION_FAILED`) e higiene DIRTY.
 */
@Injectable()
export class InspectCleaningOrderUseCase extends CleaningOrderTransition {
  protected readonly action = 'inspect' as const;
  protected readonly permission = 'f2.cleaning.inspect';

  /**
   * @param orderId - Orden.
   * @param dto - Resultado.
   * @param ifMatch - `If-Match`.
   * @param req - Actor, tenant y requestId.
   */
  execute(
    orderId: string,
    dto: InspectCleaningOrderDto,
    ifMatch: string | undefined,
    req: OpsRequest,
  ): Promise<{ order: CleaningOrderDto; nextOrderId: string | null }> {
    return this.em.transactional(async (tx) => {
      const failed = dto.result === 'FAIL';
      const loaded = await this.load(tx, orderId, ifMatch, req, failed);
      const { order, space, roles } = loaded;
      const terminal =
        order.cleaningTypeConceptId === CLEANING_TYPE.CLEAN_TERMINAL ||
        space.terminalCleaningRequired;
      const supervisor = TERMINAL_INSPECTORS.some((r) => roles.has(r));
      enforce(
        judgeInspection({
          inspectorUserId: req.actor.id,
          finishedByUserId: order.finishedByUserId,
          failed,
          reasonText: dto.reasonText,
          terminal,
          inspectorIsSupervisor: supervisor,
        }),
      );
      const now = new Date();
      order.inspectedAt = now;
      order.inspectedByUserId = req.actor.id;
      order.inspectionResultConceptId = failed
        ? PRAC.CLN_INSPECTION_FAIL
        : PRAC.CLN_INSPECTION_PASS;
      let nextOrderId: string | null = null;
      if (failed) {
        order.statusConceptId = CLEANING_STATUS.CLN_REJECTED;
        order.rejectionReason = dto.reasonText;
        await this.seal(tx, loaded, OPS_EVENTS.cleaningRejected, req);
        const { order: next } = await this.core.openCleaningOrder(
          tx,
          space,
          loaded.target.site.practiceId,
          {
            type: codeFor(
              CLEANING_TYPE,
              order.cleaningTypeConceptId,
            ) as CleaningTypeCode,
            trigger: 'CLN_TRG_INSPECTION_FAILED',
            priority: 'CLN_PRIO_URGENT',
            previousOrderId: order.id,
            sourceRefId: order.id,
          },
          {
            actor: req.actor,
            requestId: req.requestId,
            source: 'CLEANING',
            reasonText: dto.reasonText,
          },
        );
        nextOrderId = next.id;
      } else {
        order.statusConceptId = CLEANING_STATUS.CLN_INSPECTED;
        await this.seal(tx, loaded, OPS_EVENTS.cleaningInspected, req);
        if (terminal && space.terminalCleaningRequired) {
          await this.core.updateOps(
            tx,
            space,
            { terminalCleaningRequired: false },
            req.actor.id,
          );
        }
      }
      await this.moveHygiene(tx, loaded, req, failed);
      return { order: this.cells.order(order, space), nextOrderId };
    });
  }
}

/** `POST /cleaning-orders/:id/cancel {reason}`. La higiene no cambia. */
@Injectable()
export class CancelCleaningOrderUseCase extends CleaningOrderTransition {
  protected readonly action = 'cancel' as const;
  protected readonly permission = 'f2.cleaning.cancel';

  /**
   * @param orderId - Orden.
   * @param reason - Motivo.
   * @param ifMatch - `If-Match`.
   * @param req - Actor, tenant y requestId.
   */
  execute(
    orderId: string,
    reason: string,
    ifMatch: string | undefined,
    req: OpsRequest,
  ): Promise<CleaningOrderDto> {
    return this.em.transactional(async (tx) => {
      const loaded = await this.load(tx, orderId, ifMatch, req);
      loaded.order.statusConceptId = CLEANING_STATUS.CLN_CANCELLED;
      loaded.order.cancelReason = reason;
      await this.seal(tx, loaded, OPS_EVENTS.cleaningCancelled, req);
      return this.cells.order(loaded.order, loaded.space);
    });
  }
}

/** Disparador de una orden (para el tick y los observadores). */
export function triggerCodeOf(order: CleaningOrders): string | undefined {
  return codeFor(CLEANING_TRIGGER, order.triggerConceptId);
}
