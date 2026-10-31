import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../../common';
import { AUD } from '../../../../audit/audit.concepts';
import { OutboxService } from '../../../../messaging/services/outbox.service';
import { CareSpaceBlocks, type CareSpaces } from '../../../entities';
import { CareSpaceOpsRepository } from '../../../repositories';
import type {
  AvailabilityChangeDto,
  AvailabilityResultDto,
} from '../../../dto';
import {
  availabilityFromBlocks,
  judgeBlockRequest,
  kindsEndedBy,
  type AvailabilityAction,
} from '../../../domain/ops/availability-rules';
import {
  BLOCK_KIND,
  BLOCK_REASONS,
  codeFor,
  type BlockKindCode,
} from '../../../domain/ops/ops-catalog';
import { InfrastructureAccessService } from '../../infrastructure-access.service';
import { CareSpaceOpsCore, type ChangeContext } from '../care-space-ops-core';
import { OpsCellBuilder } from '../ops-cell-builder';
import { OPS_EVENTS, publishOpsEvent } from '../ops-events';
import {
  assertIfMatchOps,
  enforce,
  flushInfra,
  guardInfraWrite,
  opsError,
} from '../ops-errors';

/** Petición: actor, tenant y `requestId`. */
export interface OpsRequest {
  readonly actor: AuthenticatedUser;
  readonly tenantId: string;
  readonly requestId?: string;
}

/** Acción registrada que exige cada pedido. */
function actionKeyFor(action: AvailabilityAction, kindCode?: string): string {
  switch (action) {
    case 'start-maintenance':
      return 'f2.availability.maintenance';
    case 'close':
    case 'reopen':
      return 'f2.availability.admin';
    case 'block':
      return kindCode === 'BLOCK_ADMIN'
        ? 'f2.availability.admin'
        : 'f2.availability.clinical';
    default:
      return 'f2.availability.clinical';
  }
}

/** Próxima acción sugerida para un compromiso en conflicto. */
const NEXT_ACTION: Record<string, string> = {
  PROCEDURE_CASE: 'Reprogramar o mover el caso a otro quirófano',
  APPOINTMENT: 'Reprogramar la cita o cambiar el consultorio',
  BOOKING: 'Reprogramar la reserva',
};

/**
 * `POST /care-spaces/:id/availability` (CONTRATO-F2-F5 §F2.3): bloquear,
 * desbloquear, iniciar mantenimiento, cerrar o reabrir. Un bloqueo nuevo
 * pre-valida motivo, tipo, fecha estimada, ciclo de vida, ocupación, solape
 * (409 `BLOCK_OVERLAP`, la base es la red con `ex_care_space_blocks_time`) y
 * compromisos futuros (409 `FUTURE_COMMITMENTS_CONFLICT` sin
 * `acknowledgeConflicts`). Un bloqueo que ya empezó cambia la disponibilidad
 * (evento A20 + `status_changed`); uno programado lo aplica el tick.
 */
@Injectable()
export class ChangeAvailabilityUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly core: CareSpaceOpsCore,
    private readonly opsRepo: CareSpaceOpsRepository,
    private readonly cells: OpsCellBuilder,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * @param spaceId - Espacio.
   * @param dto - Pedido.
   * @param ifMatchOps - `If-Match-Ops`.
   * @param req - Actor, tenant y requestId.
   */
  execute(
    spaceId: string,
    dto: AvailabilityChangeDto,
    ifMatchOps: string | undefined,
    req: OpsRequest,
  ): Promise<AvailabilityResultDto> {
    return this.em.transactional(async (tx) => {
      const { target, roles } = await this.access.assertCan(
        req.actor,
        actionKeyFor(dto.action, dto.kindCode),
        { careSpaceId: spaceId },
        tx,
        req.tenantId,
      );
      await this.core.lock(tx, [spaceId]);
      const space = target.space as CareSpaces;
      await tx.refresh(space);
      assertIfMatchOps(ifMatchOps, space.opsVersion);
      const practiceId = target.site.practiceId;
      const now = new Date();
      const ctxBase: ChangeContext = {
        actor: req.actor,
        requestId: req.requestId,
        source: 'BLOCK',
      };

      const ended = kindsEndedBy(dto.action);
      if (ended.length > 0) {
        const open = (await this.opsRepo.openBlocks(tx, spaceId)).filter((b) =>
          ended.includes(codeFor(BLOCK_KIND, b.kindConceptId) as BlockKindCode),
        );
        const allowed = open.filter((b) =>
          codeFor(BLOCK_KIND, b.kindConceptId) === 'BLOCK_ADMIN'
            ? this.access.can(
                'f2.availability.admin',
                roles,
                target.isOperatingRoom,
              )
            : true,
        );
        if (allowed.length === 0) {
          if (open.length > 0)
            this.access.decide(
              'f2.availability.admin',
              roles,
              target.isOperatingRoom,
            );
          throw opsError('BLOCK_NOT_OPEN');
        }
        for (const block of allowed) {
          await this.endBlock(tx, block, space, now, req);
        }
        await this.reapply(tx, space, practiceId, {
          ...ctxBase,
          sourceRefId: allowed[0].id,
        });
        return {
          cell: await this.cells.cellFor(tx, space, practiceId),
          blockId: allowed[0].id,
        };
      }

      const snap = await this.core.snapshot(tx, space, practiceId);
      const startsAt = dto.startsAt ?? now;
      const verdict = judgeBlockRequest({
        action: dto.action,
        kindCode: dto.kindCode,
        reasonCode: dto.reasonCode,
        reasonText: dto.reasonText,
        expectedEndAt: dto.expectedEndAt ?? null,
        startsAt,
        lifecycle: snap.axes.lifecycle,
        occupancy: snap.occupancy.code,
      });
      enforce(verdict);
      const kind = verdict.ok
        ? (verdict.kind as BlockKindCode)
        : 'BLOCK_CLINICAL';
      const open = await this.opsRepo.openBlocks(tx, spaceId);
      const overlapping = open.find((b) => !b.endedAt || b.endedAt > startsAt);
      if (overlapping) {
        throw opsError('BLOCK_OVERLAP', { blockId: overlapping.id });
      }
      const commitments = await this.opsRepo.futureCommitments(
        tx,
        spaceId,
        startsAt,
        dto.expectedEndAt ?? null,
      );
      const conflicts = commitments.map((c) => ({
        kind: c.kind,
        id: c.id,
        startsAt: new Date(c.starts_at).toISOString(),
        nextAction: NEXT_ACTION[c.kind],
      }));
      if (conflicts.length > 0 && !dto.acknowledgeConflicts) {
        throw opsError('FUTURE_COMMITMENTS_CONFLICT', { conflicts });
      }
      const reason = BLOCK_REASONS[dto.reasonCode as string];
      const block = tx.create(
        CareSpaceBlocks,
        {
          tenantId: space.tenantId,
          careSpaceId: space.id,
          kindConceptId: BLOCK_KIND[kind],
          reasonConceptId: reason.id,
          reasonText: dto.reasonText,
          startsAt,
          expectedEndAt: dto.expectedEndAt,
          createdAt: now,
          updatedAt: now,
          createdByUserId: req.actor.id,
          updatedByUserId: req.actor.id,
        },
        { partial: true },
      );
      await flushInfra(tx);
      await this.core.appendHistory(
        tx,
        'block',
        block,
        AUD.OPERATION_INSERT,
        req.actor.id,
      );
      if (startsAt <= now) {
        await this.applyStarted(
          tx,
          block,
          space,
          practiceId,
          kind,
          dto.reasonCode as string,
          req,
        );
      }
      return {
        cell: await this.cells.cellFor(tx, space, practiceId),
        blockId: block.id,
        ...(conflicts.length > 0 ? { conflicts } : {}),
      };
    });
  }

  /**
   * Aplica un bloqueo que ya empezó: disponibilidad + `block_started`. Lo usa
   * también el tick para los programados.
   */
  async applyStarted(
    tx: EntityManager,
    block: CareSpaceBlocks,
    space: CareSpaces,
    practiceId: string,
    kind: BlockKindCode,
    reasonCode: string,
    req: Pick<OpsRequest, 'requestId'> & { actor?: { id: string } },
  ): Promise<void> {
    await guardInfraWrite(() =>
      publishOpsEvent(this.outbox, tx, OPS_EVENTS.blockStarted, {
        tenantId: space.tenantId,
        aggregateId: block.id,
        actorUserId: req.actor?.id,
        payload: {
          blockId: block.id,
          careSpaceId: space.id,
          siteId: space.practiceSiteId,
          kind,
          reasonCode,
          startsAt: block.startsAt.toISOString(),
          expectedEndAt: block.expectedEndAt?.toISOString() ?? null,
          requestId: req.requestId ?? null,
        },
      }),
    );
    await this.reapply(tx, space, practiceId, {
      actor: req.actor,
      requestId: req.requestId,
      source: 'BLOCK',
      sourceRefId: block.id,
      reasonId: block.reasonConceptId,
      reasonCode,
      reasonText: block.reasonText,
      expectedUntil: block.expectedEndAt,
    });
  }

  /**
   * Termina un bloqueo (fin efectivo ahora) con historia y `block_ended`.
   */
  async endBlock(
    tx: EntityManager,
    block: CareSpaceBlocks,
    space: CareSpaces,
    now: Date,
    req: Pick<OpsRequest, 'requestId'> & { actor?: { id: string } },
    note?: string,
  ): Promise<void> {
    block.endedAt = now < block.startsAt ? block.startsAt : now;
    block.endedByUserId = req.actor?.id;
    block.endNote = note;
    block.updatedAt = now;
    block.updatedByUserId = req.actor?.id;
    await flushInfra(tx);
    await this.core.appendHistory(
      tx,
      'block',
      block,
      AUD.OPERATION_UPDATE,
      req.actor?.id,
    );
    await guardInfraWrite(() =>
      publishOpsEvent(this.outbox, tx, OPS_EVENTS.blockEnded, {
        tenantId: space.tenantId,
        aggregateId: block.id,
        actorUserId: req.actor?.id,
        payload: {
          blockId: block.id,
          careSpaceId: space.id,
          siteId: space.practiceSiteId,
          kind: codeFor(BLOCK_KIND, block.kindConceptId) ?? null,
          endedAt: (block.endedAt as Date).toISOString(),
          requestId: req.requestId ?? null,
        },
      }),
    );
  }

  /**
   * Recalcula la disponibilidad con los bloqueos vigentes y la escribe si
   * cambió (A20 + `status_changed`).
   */
  async reapply(
    tx: EntityManager,
    space: CareSpaces,
    practiceId: string,
    ctx: ChangeContext,
  ): Promise<void> {
    const now = new Date();
    const open = await this.opsRepo.openBlocks(tx, space.id);
    const started = open.filter((b) => b.startsAt <= now);
    const kinds = started.map(
      (b) => codeFor(BLOCK_KIND, b.kindConceptId) as BlockKindCode,
    );
    const target = availabilityFromBlocks(kinds);
    const strongest = started.find(
      (b) =>
        (codeFor(BLOCK_KIND, b.kindConceptId) as BlockKindCode) ===
        this.kindFor(target),
    );
    const current = space.operationalStatusConceptId;
    const sameReason =
      strongest?.reasonConceptId === space.availabilityReasonConceptId;
    const changed =
      this.core.axesOf(space, 'OCC_FREE').availability !== target ||
      (strongest && !sameReason) ||
      !current;
    if (!changed) return;
    await this.core.changeAxis(tx, space, practiceId, 'AVAILABILITY', target, {
      ...ctx,
      reasonId: strongest?.reasonConceptId ?? null,
      reasonText: strongest?.reasonText ?? null,
      expectedUntil: strongest?.expectedEndAt ?? null,
      reasonCode: ctx.reasonCode ?? null,
    });
  }

  private kindFor(availability: string): BlockKindCode | null {
    switch (availability) {
      case 'SPACE_OP_CLOSED':
        return 'BLOCK_CLOSURE';
      case 'SPACE_OP_MAINTENANCE':
        return 'BLOCK_MAINTENANCE';
      case 'SPACE_OP_BLOCKED_ADMIN':
        return 'BLOCK_ADMIN';
      case 'SPACE_OP_BLOCKED_CLINICAL':
        return 'BLOCK_CLINICAL';
      default:
        return null;
    }
  }
}
