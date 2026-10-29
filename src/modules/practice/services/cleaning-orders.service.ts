import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories';
import { DIR } from '../../directory/directory.concepts';
import { TenantMembershipsRepository } from '../../directory/repositories';
import type { HygieneCode } from '../domain/bed-status-v2';
import type {
  CleaningOrderPage,
  CleaningOrderView,
} from '../dto/care-space-ops.types';
import type {
  AssignCleaningOrderDto,
  CancelCleaningOrderDto,
  CleaningOrdersQueryDto,
  CreateCleaningOrderDto,
  FinishCleaningOrderDto,
  InspectCleaningOrderDto,
} from '../dto/care-space-ops.dto';
import { CleaningOrders } from '../entities';
import {
  assertRowVersion,
  RowVersionMismatchException,
} from '../http/row-version';
import {
  AXES,
  CLEANING_PRIORITIES,
  CLEANING_STATUSES,
  CLEANING_TRANSITIONS,
  CLEANING_TRIGGERS,
  CLEANING_TYPES,
  HYGIENE,
  INSPECTION_RESULTS,
  conceptIdOf,
  hasOperationalState,
} from '../ops-catalog';
import { OpsErrorReason } from '../practice-ops.error-reasons';
import { PRAC } from '../practice.concepts';
import { InfrastructureAccessService } from './infrastructure-access.service';
import { OPS_EVENTS, OpsEventsService } from './ops-events';
import {
  OpsRecorder,
  type ApplyResult,
  type AxisChange,
  type OpsContext,
} from './ops-recorder';
import { OpsSettingsReader } from './ops-settings';
import {
  ORDER_COLUMNS,
  isoOrNull,
  placeholders,
  toOrderRow,
  type OrderRow,
  type SpaceOpsRow,
  str,
} from './ops-rows';
import { isLifecycleActive, OpsStateService } from './ops-state';
import { practiceOutOfScope } from './practice-scope';
import { ref } from './structure-mapper';

/** Estados que cuentan como orden abierta. */
const OPEN_STATUS_IDS = [PRAC.CLN_PENDING, PRAC.CLN_IN_PROGRESS, PRAC.CLN_DONE];

/** Qué orden abrir sobre un espacio. */
export interface OpenOrderInput {
  /** Tipo de limpieza (`CLEAN_*`). */
  readonly typeCode: string;
  /** Disparador (`CLN_TRG_*`). */
  readonly triggerCode: string;
  /** Prioridad (`CLN_PRIO_*`). */
  readonly priorityCode: string;
  /** Id del hecho que la originó. */
  readonly sourceRefId?: string | null;
  /** Orden rechazada a la que reemplaza. */
  readonly previousOrderId?: string | null;
  /** Nota para quien limpia: queda en el evento A20 de higiene. */
  readonly note?: string | null;
  /** Limpieza terminal: fuerza el tipo y deja la bandera del espacio. */
  readonly terminal?: boolean;
  /** Higiene a la que lleva el espacio (por omisión, sucio; contaminado si ya lo estaba). */
  readonly hygiene?: 'HYG_DIRTY' | 'HYG_CONTAMINATED';
  /** Con una orden abierta, fallar en lugar de reutilizarla (el camino HTTP). */
  readonly failIfOpen?: boolean;
}

/** Resultado de {@link CleaningOrdersService.openOrder}. */
export interface OpenOrderResult {
  readonly order: OrderRow;
  readonly result: ApplyResult;
  /** Se creó una orden nueva. */
  readonly created: boolean;
  /** Se reutilizó la orden abierta y se la subió a terminal. */
  readonly escalated: boolean;
}

/** Foto de una orden para la historia. */
function snapshot(
  order: OrderRow,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return { ...order, ...extra };
}

/**
 * Órdenes de limpieza y su máquina de estados (CONTRATO-F2-F5 §F2.2/F2.3):
 *
 * `PENDING →(start) IN_PROGRESS →(finish) DONE →(inspect PASS) INSPECTED`; un
 * `inspect FAIL` rechaza la orden, abre otra pendiente (`INSPECTION_FAILED`) y deja
 * el espacio sucio. Cada paso mueve el **eje de higiene** del espacio (la única forma
 * de moverlo, con los eventos ADT) y deja su evento A20, su historia y su outbox.
 *
 * La cola no lleva datos de paciente. Quien terminó la limpieza no la inspecciona, y
 * la limpieza terminal sólo la inspecciona un supervisor.
 */
@Injectable()
export class CleaningOrdersService {
  /**
   * @param em - Contexto de persistencia.
   * @param access - Evaluador de roles y alcance.
   * @param state - Lectura del estado operativo.
   * @param recorder - Escritura de ejes, eventos A20 e historia.
   * @param events - Outbox.
   * @param historyRepo - Historia de las órdenes.
   * @param settings - Configuración `infra.*`.
   * @param memberships - Membresías (para validar al asignado).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly state: OpsStateService,
    private readonly recorder: OpsRecorder,
    private readonly events: OpsEventsService,
    private readonly historyRepo: HistoryRepository,
    private readonly settings: OpsSettingsReader,
    private readonly memberships: TenantMembershipsRepository,
  ) {}

  // ------------------------------------------------------------------ lectura

  /**
   * `GET /sites/:siteId/cleaning-orders`: la cola, sin datos de paciente. Quien tiene
   * alcance de unidad o espacio sólo ve las órdenes de lo que le toca.
   *
   * @param siteId - Establecimiento.
   * @param query - Filtros y cursor.
   * @param actor - Quien consulta.
   */
  async list(
    siteId: string,
    query: CleaningOrdersQueryDto,
    actor: AuthenticatedUser,
  ): Promise<CleaningOrderPage> {
    return this.em.transactional(async (tx) => {
      const grant = await this.access.assertCan(
        actor,
        'infra.cleaning.list',
        { siteId },
        tx,
      );
      const now = new Date();
      const statuses = query.status
        ? [this.codeOrFail(CLEANING_STATUSES, query.status, 'status')]
        : OPEN_STATUS_IDS;
      const params: unknown[] = [grant.tenantId, siteId, ...statuses];
      let where = `o.tenant_id = ? and o.practice_site_id = ? and o.status_concept_id in (${placeholders(statuses.length)})`;
      if (query.unitId) {
        where += ' and cs.clinical_unit_id = ?';
        params.push(query.unitId);
      }
      if (query.assignedTo === 'me') {
        where += ' and o.assigned_user_id = ?';
        params.push(actor.id);
      }
      if (query.priority) {
        where += ' and o.priority_concept_id = ?';
        params.push(
          this.codeOrFail(CLEANING_PRIORITIES, query.priority, 'priority'),
        );
      }
      const covered = await this.access.coveredSpaceIds(
        tx,
        grant,
        grant.actingRoles,
      );
      if (covered) {
        where +=
          ' and o.care_space_id in (select v::uuid from jsonb_array_elements_text(?::jsonb) v)';
        params.push(JSON.stringify([...covered]));
      }
      const limit = query.limit ?? 50;
      const offset = decodeOffset(query.cursor);
      const rows = await tx.execute<Record<string, unknown>[]>(
        `select ${ORDER_COLUMNS}, cs.code as space_code, cs.name as space_name
           from practice.cleaning_orders o
           join practice.care_spaces cs on cs.id = o.care_space_id
          where ${where}
          order by case o.priority_concept_id when ? then 0 when ? then 1 else 2 end,
                   o.requested_at, o.id
          limit ? offset ?`,
        [
          ...params,
          PRAC.CLN_PRIO_STAT,
          PRAC.CLN_PRIO_URGENT,
          limit + 1,
          offset,
        ],
      );
      const page = rows.slice(0, limit);
      return {
        items: page.map((raw) =>
          toOrderView(
            toOrderRow(raw),
            str(raw.space_code),
            str(raw.space_name),
            now,
          ),
        ),
        nextCursor: rows.length > limit ? encodeOffset(offset + limit) : null,
        generatedAt: now.toISOString(),
      };
    });
  }

  // ----------------------------------------------------------------- creación

  /**
   * `POST /sites/:siteId/cleaning-orders`: pide una limpieza a mano. El espacio queda
   * sucio (evento A20) y la orden en la cola.
   *
   * @param siteId - Establecimiento de la ruta.
   * @param dto - Espacio, tipo, prioridad y nota.
   * @param actor - Quien la pide.
   * @param requestId - Id de correlación.
   */
  async create(
    siteId: string,
    dto: CreateCleaningOrderDto,
    actor: AuthenticatedUser,
    requestId: string | undefined,
  ): Promise<CleaningOrderView> {
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const row = await this.state.loadSpace(
        tx,
        tenantId,
        dto.careSpaceId,
        true,
      );
      if (row.practiceSiteId !== siteId)
        throw practiceOutOfScope('Espacio no encontrado');
      const grant = await this.access.assertCan(
        actor,
        'infra.cleaning.create',
        { careSpaceId: row.id },
        tx,
      );
      const typeCode = this.codeOrFail(
        CLEANING_TYPES,
        dto.typeCode,
        'typeCode',
        true,
      );
      const priorityCode = this.codeOrFail(
        CLEANING_PRIORITIES,
        dto.priorityCode,
        'priorityCode',
        true,
      );
      this.assertOperable(row);
      if (row.terminalCleaningRequired && typeCode !== 'CLEAN_TERMINAL') {
        throw new PreconditionFailedException(
          'El espacio exige limpieza terminal: sólo se puede pedir una limpieza terminal',
          { careSpaceId: row.id, requiredType: 'CLEAN_TERMINAL' },
          OpsErrorReason.TERMINAL_CLEANING_REQUIRED,
        );
      }
      const ctx = this.context(
        tenantId,
        actor.id,
        requestId,
        grant.actingRoles,
        'CLEANING_ORDER_CREATED',
        'SRC_CLEANING',
      );
      const opened = await this.openOrder(
        tx,
        row,
        {
          typeCode,
          triggerCode: 'CLN_TRG_MANUAL',
          priorityCode,
          note: dto.note,
          terminal: typeCode === 'CLEAN_TERMINAL',
          failIfOpen: true,
        },
        ctx,
      );
      await tx.flush();
      return toOrderView(opened.order, row.code, row.name, new Date());
    });
  }

  // ------------------------------------------------------------ transiciones

  /**
   * `POST /cleaning-orders/:id/assign`.
   *
   * @param orderId - Orden.
   * @param dto - `userId` o `null` para desasignar.
   * @param expectedVersion - `If-Match` (`row_version` de la orden).
   * @param actor - Quien asigna.
   * @param requestId - Id de correlación.
   */
  async assign(
    orderId: string,
    dto: AssignCleaningOrderDto,
    expectedVersion: number,
    actor: AuthenticatedUser,
    requestId: string | undefined,
  ): Promise<CleaningOrderView> {
    return this.em.transactional(async (tx) => {
      const { order, space, grant, tenantId } = await this.loadForTransition(
        tx,
        orderId,
        actor,
        'infra.cleaning.assign',
      );
      assertRowVersion(order.rowVersion, expectedVersion);
      this.assertTransition(
        order,
        ['CLN_PENDING', 'CLN_IN_PROGRESS'],
        'CLN_PENDING',
      );
      const userId = dto.userId ?? null;
      if (userId) {
        const member = await this.memberships.findActiveByUserTenant(
          tx,
          userId,
          tenantId,
          DIR.MEMBERSHIP_ACTIVE,
        );
        if (!member) throw practiceOutOfScope('Usuario no encontrado');
      }
      const next = await this.updateOrder(
        tx,
        order,
        { assignedUserId: userId },
        actor.id,
      );
      await this.historyOf(tx, next, actor.id, tenantId, 'assign');
      await this.events.publish(tx, {
        type: OPS_EVENTS.cleaningAssigned,
        aggregateType: 'cleaning_order',
        aggregateId: order.id,
        tenantId,
        actorUserId: actor.id,
        requestId,
        uniqueRef: String(next.rowVersion),
        payload: {
          ...this.orderPayload(next),
          assignedUserId: userId,
          actingRoles: grant.actingRoles,
        },
      });
      await tx.flush();
      return toOrderView(next, space.code, space.name, new Date());
    });
  }

  /**
   * `POST /cleaning-orders/:id/start`: `PENDING → IN_PROGRESS`; el espacio pasa a
   * «limpiando». Dos operarios que la toman a la vez: gana el primero (el segundo
   * recibe 412/409).
   */
  async start(
    orderId: string,
    expectedVersion: number,
    actor: AuthenticatedUser,
    requestId: string | undefined,
  ): Promise<CleaningOrderView> {
    return this.em.transactional(async (tx) => {
      const { order, space, grant, tenantId } = await this.loadForTransition(
        tx,
        orderId,
        actor,
        'infra.cleaning.work',
      );
      assertRowVersion(order.rowVersion, expectedVersion);
      this.assertTransition(
        order,
        CLEANING_TRANSITIONS.start.from,
        CLEANING_TRANSITIONS.start.to,
      );
      const now = new Date();
      const next = await this.updateOrder(
        tx,
        order,
        {
          statusConceptId: PRAC.CLN_IN_PROGRESS,
          startedAt: now,
          startedByUserId: actor.id,
          assignedUserId: order.assignedUserId ?? actor.id,
          ...this.escalation(order, space),
        },
        actor.id,
        now,
      );
      const ctx = this.context(
        tenantId,
        actor.id,
        requestId,
        grant.actingRoles,
        'CLEANING_ORDER_STARTED',
        'SRC_CLEANING',
        order.id,
        now,
      );
      await this.recorder.applyChange(
        tx,
        space,
        { hygiene: { to: 'HYG_CLEANING' } },
        ctx,
      );
      await this.historyOf(tx, next, actor.id, tenantId, 'start');
      await this.publish(
        tx,
        OPS_EVENTS.cleaningStarted,
        next,
        actor.id,
        requestId,
        grant.actingRoles,
      );
      await tx.flush();
      return toOrderView(next, space.code, space.name, now);
    });
  }

  /** `POST /cleaning-orders/:id/finish`: `IN_PROGRESS → DONE`; el espacio queda limpio. */
  async finish(
    orderId: string,
    dto: FinishCleaningOrderDto,
    expectedVersion: number,
    actor: AuthenticatedUser,
    requestId: string | undefined,
  ): Promise<CleaningOrderView> {
    return this.em.transactional(async (tx) => {
      const { order, space, grant, tenantId } = await this.loadForTransition(
        tx,
        orderId,
        actor,
        'infra.cleaning.work',
      );
      assertRowVersion(order.rowVersion, expectedVersion);
      this.assertTransition(
        order,
        CLEANING_TRANSITIONS.finish.from,
        CLEANING_TRANSITIONS.finish.to,
      );
      const now = new Date();
      const next = await this.updateOrder(
        tx,
        order,
        {
          statusConceptId: PRAC.CLN_DONE,
          finishedAt: now,
          finishedByUserId: actor.id,
          ...this.escalation(order, space),
        },
        actor.id,
        now,
      );
      const ctx = this.context(
        tenantId,
        actor.id,
        requestId,
        grant.actingRoles,
        'CLEANING_ORDER_FINISHED',
        'SRC_CLEANING',
        order.id,
        now,
      );
      await this.recorder.applyChange(
        tx,
        space,
        { hygiene: { to: 'HYG_CLEAN', reasonText: dto.note ?? null } },
        ctx,
      );
      await this.historyOf(tx, next, actor.id, tenantId, 'finish');
      await this.publish(
        tx,
        OPS_EVENTS.cleaningFinished,
        next,
        actor.id,
        requestId,
        grant.actingRoles,
      );
      await tx.flush();
      return toOrderView(next, space.code, space.name, now);
    });
  }

  /**
   * `POST /cleaning-orders/:id/inspect`: `DONE → INSPECTED` (PASS) o `→ REJECTED` (FAIL).
   * Inspecciona otro usuario que el que terminó; la terminal, un supervisor. PASS deja
   * el espacio inspeccionado (y apaga la bandera de limpieza terminal); FAIL lo deja
   * sucio y abre una orden nueva.
   */
  async inspect(
    orderId: string,
    dto: InspectCleaningOrderDto,
    expectedVersion: number,
    actor: AuthenticatedUser,
    requestId: string | undefined,
  ): Promise<CleaningOrderView> {
    return this.em.transactional(async (tx) => {
      const { order, space, grant, tenantId } = await this.loadForTransition(
        tx,
        orderId,
        actor,
        'infra.cleaning.inspect',
      );
      const isTerminal =
        order.cleaningTypeConceptId ===
        conceptIdOf(CLEANING_TYPES, 'CLEAN_TERMINAL');
      let actingRoles = grant.actingRoles;
      // Con la bandera de limpieza terminal activa, inspeccionar es un acto de supervisor
      // aunque la orden no sea terminal: sin ese permiso no se toca la bandera.
      if (isTerminal || space.terminalCleaningRequired) {
        try {
          actingRoles = (
            await this.access.assertCan(
              actor,
              'infra.cleaning.inspect-terminal',
              { careSpaceId: space.id },
              tx,
            )
          ).actingRoles;
        } catch (error) {
          if (error instanceof InsufficientRoleException) {
            throw new InsufficientRoleException(
              'La limpieza terminal la inspecciona un supervisor',
              {
                requiredRoles: ['NURSE_SUPERVISOR', 'HOUSEKEEPING_SUPERVISOR'],
              },
              OpsErrorReason.TERMINAL_INSPECTION_REQUIRES_SUPERVISOR,
            );
          }
          throw error;
        }
      }
      assertRowVersion(order.rowVersion, expectedVersion);
      const pass = dto.result === 'PASS';
      const transition = pass
        ? CLEANING_TRANSITIONS.inspectPass
        : CLEANING_TRANSITIONS.inspectFail;
      this.assertTransition(order, transition.from, transition.to);
      const reason = dto.reasonText?.trim();
      if (!pass && !reason) {
        throw new PreconditionFailedException(
          'Rechazar una inspección exige el motivo',
          { orderId: order.id },
          OpsErrorReason.INSPECTION_REASON_REQUIRED,
        );
      }
      if (order.finishedByUserId && order.finishedByUserId === actor.id) {
        throw new PreconditionFailedException(
          'Quien terminó la limpieza no puede inspeccionarla',
          { orderId: order.id },
          OpsErrorReason.INSPECTION_BY_CLEANER_NOT_ALLOWED,
        );
      }
      // Una limpieza rutinaria no libera una cama que exige limpieza terminal (INV-28):
      // aprobarla no apagaría la bandera, así que se rechaza con el motivo claro.
      if (pass && space.terminalCleaningRequired && !isTerminal) {
        throw new PreconditionFailedException(
          'El espacio exige limpieza terminal: esta orden no lo es, no se aprueba',
          { orderId: order.id, requiredType: 'CLEAN_TERMINAL' },
          OpsErrorReason.TERMINAL_CLEANING_REQUIRED,
        );
      }

      const now = new Date();
      const next = await this.updateOrder(
        tx,
        order,
        {
          statusConceptId: pass ? PRAC.CLN_INSPECTED : PRAC.CLN_REJECTED,
          inspectedAt: now,
          inspectedByUserId: actor.id,
          inspectionResultConceptId: conceptIdOf(
            INSPECTION_RESULTS,
            pass ? 'CLN_INSPECT_PASS' : 'CLN_INSPECT_FAIL',
          ),
          rejectionReason: pass ? null : reason!,
        },
        actor.id,
        now,
      );
      const ctx = this.context(
        tenantId,
        actor.id,
        requestId,
        actingRoles,
        pass ? 'CLEANING_ORDER_INSPECTED' : 'CLEANING_ORDER_REJECTED',
        'SRC_CLEANING',
        order.id,
        now,
      );
      await this.historyOf(
        tx,
        next,
        actor.id,
        tenantId,
        pass ? 'inspect-pass' : 'inspect-fail',
      );
      if (pass) {
        await this.recorder.applyChange(
          tx,
          space,
          {
            hygiene: { to: 'HYG_INSPECTED' },
            // Sólo una limpieza terminal inspeccionada por un supervisor apaga la bandera.
            ...(isTerminal ? { terminalCleaningRequired: false } : {}),
          },
          ctx,
        );
        await this.publish(
          tx,
          OPS_EVENTS.cleaningInspected,
          next,
          actor.id,
          requestId,
          actingRoles,
        );
      } else {
        await this.publish(
          tx,
          OPS_EVENTS.cleaningRejected,
          next,
          actor.id,
          requestId,
          actingRoles,
          { reason },
        );
        await this.openOrder(
          tx,
          space,
          {
            typeCode:
              CLEANING_TYPES.byConceptId(order.cleaningTypeConceptId)?.code ??
              'CLEAN_ROUTINE',
            triggerCode: 'CLN_TRG_INSPECTION_FAILED',
            priorityCode:
              CLEANING_PRIORITIES.byConceptId(order.priorityConceptId)?.code ??
              'CLN_PRIO_ROUTINE',
            previousOrderId: order.id,
            sourceRefId: order.id,
            note: reason,
            terminal: isTerminal,
          },
          ctx,
        );
      }
      await tx.flush();
      return toOrderView(next, space.code, space.name, now);
    });
  }

  /** `POST /cleaning-orders/:id/cancel`: `PENDING|IN_PROGRESS → CANCELLED`, con motivo. */
  async cancel(
    orderId: string,
    dto: CancelCleaningOrderDto,
    expectedVersion: number,
    actor: AuthenticatedUser,
    requestId: string | undefined,
  ): Promise<CleaningOrderView> {
    return this.em.transactional(async (tx) => {
      const { order, space, grant, tenantId } = await this.loadForTransition(
        tx,
        orderId,
        actor,
        'infra.cleaning.cancel',
      );
      assertRowVersion(order.rowVersion, expectedVersion);
      this.assertTransition(
        order,
        CLEANING_TRANSITIONS.cancel.from,
        CLEANING_TRANSITIONS.cancel.to,
      );
      const reason = dto.reason?.trim();
      if (!reason) {
        throw new PreconditionFailedException(
          'Cancelar una orden exige el motivo',
          { orderId: order.id },
          OpsErrorReason.CLEANING_CANCEL_REASON_REQUIRED,
        );
      }
      const now = new Date();
      const wasInProgress = order.statusConceptId === PRAC.CLN_IN_PROGRESS;
      const next = await this.updateOrder(
        tx,
        order,
        { statusConceptId: PRAC.CLN_CANCELLED, cancelReason: reason },
        actor.id,
        now,
      );
      const ctx = this.context(
        tenantId,
        actor.id,
        requestId,
        grant.actingRoles,
        'CLEANING_ORDER_CANCELLED',
        'SRC_CLEANING',
        order.id,
        now,
      );
      if (wasInProgress) {
        await this.recorder.applyChange(
          tx,
          space,
          { hygiene: { to: 'HYG_DIRTY', reasonText: reason } },
          ctx,
        );
      }
      await this.historyOf(tx, next, actor.id, tenantId, 'cancel');
      await this.publish(
        tx,
        OPS_EVENTS.cleaningCancelled,
        next,
        actor.id,
        requestId,
        grant.actingRoles,
        { reason },
      );
      await tx.flush();
      return toOrderView(next, space.code, space.name, now);
    });
  }

  // -------------------------------------------------- uso interno (otros servicios)

  /**
   * Abre la orden de limpieza del espacio y deja su higiene al día, en **una** sola
   * subida de `ops_version`. Lo usan el alta manual, la marca de sucia/contaminada, el
   * fin de mantenimiento o de aislamiento, el rechazo de una inspección y el puerto.
   *
   * - Sin orden abierta: crea una `PENDING`. Si el espacio exige limpieza terminal, la
   *   orden es terminal aunque se pida otra cosa.
   * - Con una `PENDING`/`IN_PROGRESS`: la reutiliza y, si hace falta, la sube a terminal.
   * - Con una `DONE` sin inspeccionar: la cancela por reemplazo y crea otra.
   * - Con `failIfOpen`: 409 `CLEANING_ORDER_ALREADY_OPEN`.
   *
   * @param tx - Transacción del llamador.
   * @param row - El espacio, cargado en esta transacción.
   * @param input - Qué orden abrir.
   * @param ctx - Quién, con qué origen.
   * @param alsoApply - Otros cambios de ejes que van en la misma operación.
   */
  async openOrder(
    tx: EntityManager,
    row: SpaceOpsRow,
    input: OpenOrderInput,
    ctx: OpsContext,
    alsoApply: AxisChange = {},
  ): Promise<OpenOrderResult> {
    const now = ctx.now ?? new Date();
    const existingRows = await tx.execute<Record<string, unknown>[]>(
      `select ${ORDER_COLUMNS} from practice.cleaning_orders o
        where o.care_space_id = ? and o.tenant_id = ? and o.status_concept_id in (${placeholders(OPEN_STATUS_IDS.length)})
        for update`,
      [row.id, row.tenantId, ...OPEN_STATUS_IDS],
    );
    let existing = existingRows.length ? toOrderRow(existingRows[0]) : null;
    if (existing && input.failIfOpen) {
      throw new ConflictException(
        'El espacio ya tiene una orden de limpieza abierta',
        {
          cleaningOrderId: existing.id,
          status: CLEANING_STATUSES.byConceptId(existing.statusConceptId)?.code,
        },
        OpsErrorReason.CLEANING_ORDER_ALREADY_OPEN,
      );
    }

    const wantsTerminal =
      input.terminal === true ||
      input.typeCode === 'CLEAN_TERMINAL' ||
      row.terminalCleaningRequired;
    const terminalId = conceptIdOf(CLEANING_TYPES, 'CLEAN_TERMINAL');
    const hygiene =
      input.hygiene ??
      (row.hygieneStatusConceptId === PRAC.HYG_CONTAMINATED
        ? 'HYG_CONTAMINATED'
        : 'HYG_DIRTY');
    const change: AxisChange = {
      ...alsoApply,
      hygiene: { to: hygiene, reasonText: input.note ?? null },
      ...(wantsTerminal ? { terminalCleaningRequired: true } : {}),
    };

    // Una `DONE` sin inspeccionar queda superada por el nuevo hecho.
    if (existing && existing.statusConceptId === PRAC.CLN_DONE) {
      existing = await this.updateOrder(
        tx,
        existing,
        { statusConceptId: PRAC.CLN_CANCELLED, cancelReason: 'SUPERSEDED' },
        ctx.actorUserId,
        now,
      );
      await this.historyOf(
        tx,
        existing,
        ctx.actorUserId,
        row.tenantId,
        'supersede',
      );
      await this.publish(
        tx,
        OPS_EVENTS.cleaningCancelled,
        existing,
        ctx.actorUserId,
        ctx.requestId,
        ctx.actingRoles,
        {
          reason: 'SUPERSEDED',
        },
      );
      existing = null;
    }

    if (existing) {
      let order = existing;
      let escalated = false;
      if (wantsTerminal && existing.cleaningTypeConceptId !== terminalId) {
        order = await this.updateOrder(
          tx,
          existing,
          { cleaningTypeConceptId: terminalId },
          ctx.actorUserId,
          now,
        );
        await this.historyOf(
          tx,
          order,
          ctx.actorUserId,
          row.tenantId,
          'escalate-terminal',
        );
        escalated = true;
      }
      const result = await this.recorder.applyChange(tx, row, change, ctx);
      return { order, result, created: false, escalated };
    }

    const settings = await this.settings.forSite(tx, row.practiceSiteId);
    const typeCode = wantsTerminal ? 'CLEAN_TERMINAL' : input.typeCode;
    const priorityCode = input.priorityCode;
    const dueMinutes =
      settings.cleaningDueMinutes[priorityCode] ??
      settings.cleaningDueMinutes[priorityCode.replace('CLN_PRIO_', '')];
    const id = randomUUID();
    await tx.insert(CleaningOrders, {
      id,
      tenantId: row.tenantId,
      practiceSiteId: row.practiceSiteId,
      careSpaceId: row.id,
      clinicalUnitId: row.clinicalUnitId ?? undefined,
      cleaningTypeConceptId: conceptIdOf(CLEANING_TYPES, typeCode),
      triggerConceptId: conceptIdOf(CLEANING_TRIGGERS, input.triggerCode),
      sourceRefId: input.sourceRefId ?? undefined,
      previousOrderId: input.previousOrderId ?? undefined,
      priorityConceptId: conceptIdOf(CLEANING_PRIORITIES, priorityCode),
      statusConceptId: PRAC.CLN_PENDING,
      requestedAt: now,
      dueAt: dueMinutes
        ? new Date(now.getTime() + dueMinutes * 60_000)
        : undefined,
      createdAt: now,
      updatedAt: now,
      createdByUserId: ctx.actorUserId ?? undefined,
      updatedByUserId: ctx.actorUserId ?? undefined,
      rowVersion: 1,
    });
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select ${ORDER_COLUMNS} from practice.cleaning_orders o where o.id = ?`,
      [id],
    );
    const order = toOrderRow(rows[0]);
    const result = await this.recorder.applyChange(tx, row, change, {
      ...ctx,
      sourceRefId: ctx.sourceRefId ?? id,
    });
    await this.historyOf(
      tx,
      order,
      ctx.actorUserId,
      row.tenantId,
      'create',
      true,
    );
    await this.publish(
      tx,
      OPS_EVENTS.cleaningCreated,
      order,
      ctx.actorUserId,
      ctx.requestId,
      ctx.actingRoles,
    );
    return { order, result, created: true, escalated: false };
  }

  /**
   * Deshace la orden de limpieza que dejó un hecho de origen (un traslado que luego
   * se cancela) y devuelve la higiene al valor que tenía antes de ensuciarla.
   *
   * Sólo revierte una orden **que nadie empezó** (`PENDING`): una limpieza en curso
   * o terminada ya es trabajo hecho y no se deshace. La higiene anterior sale del
   * evento A20 que escribió el ensuciado (eje HYGIENE, mismo `source_ref_id`).
   *
   * @param tx - Transacción del llamador.
   * @param row - El espacio, cargado en esta transacción con bloqueo.
   * @param sourceRefId - Hecho que originó la orden (la ubicación de origen del traslado).
   * @param ctx - Quién, con qué origen.
   * @returns `reverted: false` si no hay una orden `PENDING` de ese hecho.
   */
  async revertBySource(
    tx: EntityManager,
    row: SpaceOpsRow,
    sourceRefId: string,
    ctx: OpsContext,
  ): Promise<{ reverted: boolean }> {
    const now = ctx.now ?? new Date();
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select ${ORDER_COLUMNS} from practice.cleaning_orders o
        where o.care_space_id = ? and o.tenant_id = ? and o.source_ref_id = ?
          and o.status_concept_id = ?
        for update`,
      [row.id, row.tenantId, sourceRefId, PRAC.CLN_PENDING],
    );
    if (rows.length === 0) return { reverted: false };
    const order = toOrderRow(rows[0]);
    const previous = await tx.execute<{ from_concept_id: string | null }[]>(
      `select e.from_concept_id
         from practice.care_space_status_events e
        where e.care_space_id = ? and e.tenant_id = ? and e.source_ref_id = ?
          and e.axis_concept_id = ?
        order by e.occurred_at desc, e.created_at desc
        limit 1`,
      [row.id, row.tenantId, sourceRefId, conceptIdOf(AXES, 'AXIS_HYGIENE')],
    );
    const previousCode = HYGIENE.byConceptId(previous[0]?.from_concept_id)
      ?.code as HygieneCode | undefined;
    const cancelled = await this.updateOrder(
      tx,
      order,
      { statusConceptId: PRAC.CLN_CANCELLED, cancelReason: 'SOURCE_REVERTED' },
      ctx.actorUserId,
      now,
    );
    await this.historyOf(
      tx,
      cancelled,
      ctx.actorUserId,
      row.tenantId,
      'revert-source',
    );
    await this.recorder.applyChange(
      tx,
      row,
      {
        hygiene: { to: previousCode ?? 'HYG_CLEAN', reasonText: null },
        terminalCleaningRequired: false,
      },
      ctx,
    );
    await this.publish(
      tx,
      OPS_EVENTS.cleaningCancelled,
      cancelled,
      ctx.actorUserId,
      ctx.requestId,
      ctx.actingRoles,
      { reason: 'SOURCE_REVERTED' },
    );
    return { reverted: true };
  }

  // --------------------------------------------------------------- auxiliares

  /** Carga la orden con su espacio (bloqueado) y autoriza la acción. */
  private async loadForTransition(
    tx: EntityManager,
    orderId: string,
    actor: AuthenticatedUser,
    action: string,
  ) {
    const tenantId = requireTenantId();
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select ${ORDER_COLUMNS} from practice.cleaning_orders o
        where o.id = ? and o.tenant_id = ? for update`,
      [orderId, tenantId],
    );
    if (rows.length === 0)
      throw practiceOutOfScope('Orden de limpieza no encontrada');
    const order = toOrderRow(rows[0]);
    const grant = await this.access.assertCan(
      actor,
      action,
      { careSpaceId: order.careSpaceId },
      tx,
    );
    const space = await this.state.loadSpace(
      tx,
      tenantId,
      order.careSpaceId,
      true,
    );
    return { order, space, grant, tenantId };
  }

  /**
   * Si el espacio exige limpieza terminal y la orden abierta no lo es, la sube a
   * terminal (INV-28): así la limpieza que se hace y se inspecciona es la correcta.
   */
  private escalation(
    order: OrderRow,
    space: SpaceOpsRow,
  ): { cleaningTypeConceptId?: string } {
    const terminalId = conceptIdOf(CLEANING_TYPES, 'CLEAN_TERMINAL');
    return space.terminalCleaningRequired &&
      order.cleaningTypeConceptId !== terminalId
      ? { cleaningTypeConceptId: terminalId }
      : {};
  }

  /** 409 si la orden no está en un estado desde el que se pueda pasar al destino. */
  private assertTransition(
    order: OrderRow,
    fromCodes: readonly string[],
    toCode: string,
  ): void {
    const current =
      CLEANING_STATUSES.byConceptId(order.statusConceptId)?.code ?? '';
    if (!fromCodes.includes(current)) {
      throw new ConflictException(
        `La orden no puede pasar de ${current} a ${toCode}`,
        { from: current, to: toCode },
        OpsErrorReason.CLEANING_ORDER_INVALID_TRANSITION,
      );
    }
  }

  /** El espacio tiene que estar activo y tener estado operativo. */
  private assertOperable(row: SpaceOpsRow): void {
    if (!hasOperationalState(row.formConceptId)) {
      throw new PreconditionFailedException(
        'Este espacio no tiene estado operativo',
        { careSpaceId: row.id },
        OpsErrorReason.SPACE_NOT_OPERABLE,
      );
    }
    if (!isLifecycleActive(row, new Date())) {
      throw new PreconditionFailedException(
        'El espacio no está activo',
        { careSpaceId: row.id },
        OpsErrorReason.SPACE_NOT_ACTIVE,
      );
    }
  }

  /** Código de una familia o 422 `OPS_CODE_INVALID`. */
  private codeOrFail(
    family: typeof CLEANING_TYPES,
    input: string,
    field: string,
    asCode = false,
  ): string {
    const entry = family.byInput(input);
    if (!entry) {
      throw new PreconditionFailedException(
        `Código inválido en ${field}`,
        { field, accepted: family.codes() },
        OpsErrorReason.OPS_CODE_INVALID,
      );
    }
    return asCode ? entry.code : entry.id;
  }

  private context(
    tenantId: string,
    actorUserId: string | null,
    requestId: string | undefined,
    actingRoles: readonly string[],
    action: string,
    source: OpsContext['source'],
    sourceRefId?: string,
    now?: Date,
  ): OpsContext {
    return {
      tenantId,
      actorUserId,
      requestId,
      actingRoles,
      action,
      source,
      sourceRefId,
      now,
    };
  }

  /** `UPDATE` nativo de la orden con compare-and-set sobre `row_version`. */
  private async updateOrder(
    tx: EntityManager,
    order: OrderRow,
    changes: Partial<
      Pick<
        OrderRow,
        | 'statusConceptId'
        | 'assignedUserId'
        | 'startedAt'
        | 'startedByUserId'
        | 'finishedAt'
        | 'finishedByUserId'
        | 'inspectedAt'
        | 'inspectedByUserId'
        | 'inspectionResultConceptId'
        | 'rejectionReason'
        | 'cancelReason'
        | 'cleaningTypeConceptId'
      >
    >,
    actorUserId: string | null,
    now: Date = new Date(),
  ): Promise<OrderRow> {
    const nextVersion = order.rowVersion + 1;
    const affected = await tx.nativeUpdate(
      CleaningOrders,
      { id: order.id, rowVersion: order.rowVersion },
      {
        ...changes,
        rowVersion: nextVersion,
        updatedAt: now,
        updatedByUserId: actorUserId ?? undefined,
      },
    );
    if (affected === 0) throw new RowVersionMismatchException();
    return { ...order, ...changes, rowVersion: nextVersion };
  }

  private async historyOf(
    tx: EntityManager,
    order: OrderRow,
    actorUserId: string | null,
    tenantId: string,
    step: string,
    first = false,
  ): Promise<void> {
    await this.historyRepo.append(tx, 'cleaning_orders', order.id, {
      operationConceptId: first ? AUD.OPERATION_INSERT : AUD.OPERATION_UPDATE,
      dataSnapshot: snapshot(order, { step }),
      changedByUserId: actorUserId ?? undefined,
      tenantId,
      firstRevision: first,
    });
  }

  private orderPayload(order: OrderRow): Record<string, unknown> {
    return {
      cleaningOrderId: order.id,
      careSpaceId: order.careSpaceId,
      siteId: order.practiceSiteId,
      type:
        CLEANING_TYPES.byConceptId(order.cleaningTypeConceptId)?.code ?? null,
      trigger:
        CLEANING_TRIGGERS.byConceptId(order.triggerConceptId)?.code ?? null,
      priority:
        CLEANING_PRIORITIES.byConceptId(order.priorityConceptId)?.code ?? null,
      status:
        CLEANING_STATUSES.byConceptId(order.statusConceptId)?.code ?? null,
      sourceRefId: order.sourceRefId,
      previousOrderId: order.previousOrderId,
      assignedUserId: order.assignedUserId,
      rowVersion: order.rowVersion,
    };
  }

  private async publish(
    tx: EntityManager,
    type: (typeof OPS_EVENTS)[keyof typeof OPS_EVENTS],
    order: OrderRow,
    actorUserId: string | null,
    requestId: string | null | undefined,
    actingRoles: readonly string[] | undefined,
    extra: Record<string, unknown> = {},
  ): Promise<void> {
    await this.events.publish(tx, {
      type,
      aggregateType: 'cleaning_order',
      aggregateId: order.id,
      tenantId: order.tenantId,
      actorUserId,
      requestId,
      uniqueRef: String(order.rowVersion),
      payload: {
        ...this.orderPayload(order),
        actingRoles: actingRoles ?? [],
        ...extra,
      },
    });
  }
}

/** Vista de una orden (sin datos de paciente). */
export function toOrderView(
  order: OrderRow,
  spaceCode: string,
  spaceName: string,
  now: Date,
): CleaningOrderView {
  return {
    id: order.id,
    careSpaceId: order.careSpaceId,
    careSpace: { code: spaceCode, name: spaceName },
    practiceSiteId: order.practiceSiteId,
    clinicalUnitId: order.clinicalUnitId,
    type: ref(CLEANING_TYPES.byConceptId(order.cleaningTypeConceptId)),
    trigger: ref(CLEANING_TRIGGERS.byConceptId(order.triggerConceptId)),
    priority: ref(CLEANING_PRIORITIES.byConceptId(order.priorityConceptId)),
    status: ref(CLEANING_STATUSES.byConceptId(order.statusConceptId)),
    sourceRefId: order.sourceRefId,
    previousOrderId: order.previousOrderId,
    requestedAt: order.requestedAt.toISOString(),
    dueAt: isoOrNull(order.dueAt),
    ageMinutes: Math.max(
      0,
      Math.floor((now.getTime() - order.requestedAt.getTime()) / 60_000),
    ),
    assignedUserId: order.assignedUserId,
    startedAt: isoOrNull(order.startedAt),
    startedByUserId: order.startedByUserId,
    finishedAt: isoOrNull(order.finishedAt),
    finishedByUserId: order.finishedByUserId,
    inspectedAt: isoOrNull(order.inspectedAt),
    inspectedByUserId: order.inspectedByUserId,
    inspectionResult: ref(
      INSPECTION_RESULTS.byConceptId(order.inspectionResultConceptId),
    ),
    rejectionReason: order.rejectionReason,
    cancelReason: order.cancelReason,
    rowVersion: order.rowVersion,
  };
}

/** Cursor de paginación por desplazamiento (opaco para el cliente). */
export function encodeOffset(offset: number): string {
  return Buffer.from(JSON.stringify({ o: offset }), 'utf8').toString(
    'base64url',
  );
}

/** Desplazamiento de un cursor; 0 si falta o no se entiende. */
export function decodeOffset(cursor: string | undefined): number {
  if (!cursor) return 0;
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    ) as { o?: unknown };
    const offset = Number(parsed.o);
    return Number.isInteger(offset) && offset >= 0 ? offset : 0;
  } catch {
    return 0;
  }
}
