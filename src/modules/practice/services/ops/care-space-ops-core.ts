import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { touch, type AuthenticatedUser } from '../../../../common';
import { AUD } from '../../../audit/audit.concepts';
import { HistoryRepository } from '../../../audit/repositories';
import { CLIN } from '../../../clinical/clinical.concepts';
import { OutboxService } from '../../../messaging/services/outbox.service';
import {
  CareSpaceStatusEvents,
  CareSpaces,
  CleaningOrders,
  type CareSpaceBlocks,
} from '../../entities';
import { CareSpaceOpsRepository } from '../../repositories';
import {
  AVAILABILITY,
  AXIS,
  CLEANING_PRIORITY,
  CLEANING_STATUS,
  CLEANING_TRIGGER,
  CLEANING_TYPE,
  HYGIENE,
  ISOLATION,
  OCCUPANCY,
  SOURCE,
  codeFor,
  type AvailabilityCode,
  type AxisCode,
  type CleaningPriorityCode,
  type CleaningTriggerCode,
  type CleaningTypeCode,
  type HygieneCode,
  type IsolationCode,
  type OccupancyCode,
  type SourceCode,
} from '../../domain/ops/ops-catalog';
import {
  assignabilityViolations,
  v2CodeOf,
  type NotAssignableReason,
  type OperationalAxes,
  type OpsSettings,
  type V2BedStatus,
} from '../../domain/ops/bed-status-v2';
import { stateOf } from '../structure-input';
import { structureSnapshot } from '../structure-history';
import { OPS_EVENTS, publishOpsEvent } from './ops-events';
import { flushInfra, guardInfraWrite, opsError } from './ops-errors';

/** Configuración `infra.*` con sus valores por defecto. */
export interface InfraSettings extends OpsSettings {
  readonly hvacValidationMaxDays: number;
  readonly swapRequiresCleaning: boolean;
  readonly adtCancelWindowMinutes: number;
  readonly censusCloseGraceMinutes: number;
}

/** Ocupación derivada de un espacio. */
export interface OccupancyState {
  readonly code: OccupancyCode;
  readonly since: Date | null;
  readonly encounterId: string | null;
  readonly locationId: string | null;
}

/** Estado operativo completo de un espacio. */
export interface OperationalSnapshot {
  readonly axes: OperationalAxes;
  readonly occupancy: OccupancyState;
  readonly v2Code: V2BedStatus;
  readonly assignable: boolean;
  readonly violations: NotAssignableReason[];
  readonly settings: InfraSettings;
}

/** Contexto de un cambio (quién, por qué, de dónde). */
export interface ChangeContext {
  readonly actor?: Pick<AuthenticatedUser, 'id'>;
  readonly requestId?: string;
  readonly source: SourceCode;
  readonly sourceRefId?: string | null;
  readonly reasonId?: string | null;
  readonly reasonCode?: string | null;
  readonly reasonText?: string | null;
  readonly expectedUntil?: Date | null;
  readonly occurredAt?: Date;
  /** Origen explícito (eje OCCUPANCY: lo informa ADT). */
  readonly fromCode?: string;
  /** Otras columnas operativas que cambian junto con el eje. */
  readonly patch?: OpsPatch;
}

/**
 * Columnas operativas de `care_spaces` que escribe F2. Van por `nativeUpdate`
 * y no por la unidad de trabajo: el ORM incrementaría `row_version` (propiedad
 * `version`) y una limpieza chocaría con la edición de la estructura, que es
 * justo lo que `ops_version` separa (§F2.1).
 */
export interface OpsPatch {
  operationalStatusConceptId?: string;
  availabilityReasonConceptId?: string | null;
  availabilityExpectedUntil?: Date | null;
  availabilityChangedAt?: Date;
  hygieneStatusConceptId?: string;
  hygieneChangedAt?: Date;
  isolationConceptId?: string;
  isolationOrganismText?: string | null;
  isolationChangedAt?: Date;
  terminalCleaningRequired?: boolean;
}

/** Pedido de orden de limpieza. */
export interface CleaningOrderRequest {
  readonly type: CleaningTypeCode;
  readonly trigger: CleaningTriggerCode;
  readonly priority?: CleaningPriorityCode;
  readonly sourceRefId?: string | null;
  readonly previousOrderId?: string | null;
  readonly dueAt?: Date | null;
}

/** Claves de historia (`audit.<tabla>_history`). */
export const OPS_HISTORY = {
  space: 'care_spaces',
  block: 'care_space_blocks',
  cleaning: 'cleaning_orders',
} as const;

/** Lee un booleano/número de `practice_settings.value_json`. */
function settingValue<T extends boolean | number>(
  map: Map<string, unknown>,
  key: string,
  fallback: T,
): T {
  const raw = map.get(key);
  const value =
    raw && typeof raw === 'object' && 'value' in raw ? raw.value : raw;
  return typeof value === typeof fallback ? (value as T) : fallback;
}

/**
 * Colaborador compartido de los casos de uso de F2 y del puerto
 * `CareSpaceOpsPort`: estado operativo, cambio de un eje (columna +
 * `ops_version` + historia + evento A20 + outbox) y alta de órdenes de
 * limpieza. No decide permisos: eso lo hace el caso de uso antes de llamarlo.
 */
@Injectable()
export class CareSpaceOpsCore {
  /**
   * @param opsRepo - Lecturas de operación.
   * @param history - Historias `audit.*_history`.
   * @param outbox - Eventos de dominio.
   */
  constructor(
    private readonly opsRepo: CareSpaceOpsRepository,
    private readonly history: HistoryRepository,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * Bloquea las filas de los espacios (`SELECT … FOR UPDATE`, por id para no
   * interbloquear) dentro de la transacción del llamador.
   *
   * @param tx - Transacción.
   * @param ids - Espacios.
   */
  async lock(tx: EntityManager, ids: readonly string[]): Promise<void> {
    const sorted = [...new Set(ids)].sort();
    if (sorted.length === 0) return;
    await tx.execute(
      `SELECT id FROM practice.care_spaces WHERE id = ANY(?::uuid[]) ORDER BY id FOR UPDATE`,
      [`{${sorted.join(',')}}`],
      'all',
    );
  }

  /**
   * Configuración del establecimiento (`practice_settings`, claves `infra.*`).
   * Sin fila: inspección no exigida, validación HVAC de 365 días, intercambio
   * sin limpieza, ventana de anulación ADT de 120 min, gracia de censo 60 min.
   *
   * @param tx - Contexto.
   * @param practiceId - Práctica de la sede.
   */
  async settings(
    tx: EntityManager,
    practiceId: string,
  ): Promise<InfraSettings> {
    const map = await this.opsRepo.settings(tx, practiceId);
    return {
      inspectionRequired: settingValue(map, 'infra.inspection_required', false),
      hvacValidationMaxDays: settingValue(
        map,
        'infra.hvac_validation_max_days',
        365,
      ),
      swapRequiresCleaning: settingValue(
        map,
        'infra.swap_requires_cleaning',
        false,
      ),
      adtCancelWindowMinutes: settingValue(
        map,
        'infra.adt_cancel_window_minutes',
        120,
      ),
      censusCloseGraceMinutes: settingValue(
        map,
        'infra.census_close_grace_minutes',
        60,
      ),
    };
  }

  /**
   * Ocupación derivada de cada espacio (`encounter_locations` de cama).
   *
   * @param tx - Contexto.
   * @param spaceIds - Espacios.
   */
  async occupancy(
    tx: EntityManager,
    spaceIds: readonly string[],
  ): Promise<Map<string, OccupancyState>> {
    const rows = await this.opsRepo.occupancy(tx, spaceIds);
    const out = new Map<string, OccupancyState>();
    for (const row of rows) {
      const code: OccupancyCode =
        row.status_id === CLIN.LOCATION_ACTIVE
          ? 'OCC_OCCUPIED'
          : 'OCC_RESERVED';
      const prev = out.get(row.care_space_id);
      // Ocupada gana a reservada.
      if (prev?.code === 'OCC_OCCUPIED') continue;
      out.set(row.care_space_id, {
        code,
        since: row.period_start ? new Date(row.period_start) : null,
        encounterId: row.encounter_id,
        locationId: row.location_id,
      });
    }
    return out;
  }

  /**
   * Ejes de un espacio (NULL = AVAILABLE/CLEAN/NONE, los del backfill F2).
   *
   * @param space - Espacio.
   * @param occupancy - Ocupación derivada.
   * @param now - Referencia.
   */
  axesOf(
    space: CareSpaces,
    occupancy: OccupancyCode,
    now = new Date(),
  ): OperationalAxes {
    return {
      lifecycle: stateOf(space) ?? 'PLANNED',
      inValidity:
        (!space.validFrom || space.validFrom <= now) &&
        (!space.validTo || space.validTo > now),
      availability:
        codeFor(AVAILABILITY, space.operationalStatusConceptId) ??
        'SPACE_OP_AVAILABLE',
      hygiene: codeFor(HYGIENE, space.hygieneStatusConceptId) ?? 'HYG_CLEAN',
      isolation: codeFor(ISOLATION, space.isolationConceptId) ?? 'ISO_NONE',
      occupancy,
      terminalCleaningRequired: space.terminalCleaningRequired === true,
    };
  }

  /**
   * Estado operativo completo.
   *
   * @param tx - Contexto.
   * @param space - Espacio.
   * @param practiceId - Práctica de la sede.
   * @param occupancyOverride - Ocupación ya conocida (ADT en curso).
   */
  async snapshot(
    tx: EntityManager,
    space: CareSpaces,
    practiceId: string,
    occupancyOverride?: OccupancyState,
  ): Promise<OperationalSnapshot> {
    const settings = await this.settings(tx, practiceId);
    const occupancy = occupancyOverride ??
      (await this.occupancy(tx, [space.id])).get(space.id) ?? {
        code: 'OCC_FREE' as const,
        since: null,
        encounterId: null,
        locationId: null,
      };
    const axes = this.axesOf(space, occupancy.code);
    const violations = assignabilityViolations(axes, settings);
    return {
      axes,
      occupancy,
      v2Code: v2CodeOf(axes, settings),
      assignable: violations.length === 0,
      violations,
      settings,
    };
  }

  /**
   * Cambia un eje manual (o registra la ocupación): columna y su `*_changed_at`,
   * `ops_version` + 1, revisión en `audit.care_spaces_history`, evento A20 con
   * el v2 resultante y `practice.care_space.status_changed` en el outbox.
   * Un cambio a sí mismo no escribe nada y devuelve `null`.
   *
   * @param tx - Transacción.
   * @param space - Espacio (ya bloqueado con `lock`).
   * @param practiceId - Práctica de la sede.
   * @param axis - Eje.
   * @param to - Código destino.
   * @param ctx - Quién, por qué y de dónde.
   * @param occupancyOverride - Ocupación tras el cambio (eje OCCUPANCY o ADT).
   */
  async changeAxis(
    tx: EntityManager,
    space: CareSpaces,
    practiceId: string,
    axis: AxisCode,
    to: string,
    ctx: ChangeContext,
    occupancyOverride?: OccupancyState,
  ): Promise<CareSpaceStatusEvents | null> {
    const now = ctx.occurredAt ?? new Date();
    const before = await this.snapshot(
      tx,
      space,
      practiceId,
      occupancyOverride,
    );
    const from = this.currentCode(before, axis, ctx.fromCode);
    if (from === to && axis !== 'AVAILABILITY') return null;
    const patch: OpsPatch = { ...(ctx.patch ?? {}) };
    if (axis === 'AVAILABILITY') {
      if (from === to && !ctx.reasonId) return null;
      patch.operationalStatusConceptId = AVAILABILITY[to as AvailabilityCode];
      patch.availabilityReasonConceptId =
        to === 'SPACE_OP_AVAILABLE' ? null : (ctx.reasonId ?? null);
      patch.availabilityExpectedUntil =
        to === 'SPACE_OP_AVAILABLE' ? null : (ctx.expectedUntil ?? null);
      patch.availabilityChangedAt = now;
    } else if (axis === 'HYGIENE') {
      patch.hygieneStatusConceptId = HYGIENE[to as HygieneCode];
      patch.hygieneChangedAt = now;
    } else if (axis === 'ISOLATION') {
      patch.isolationConceptId = ISOLATION[to as IsolationCode];
      patch.isolationChangedAt = now;
    }
    await this.updateOps(tx, space, patch, ctx.actor?.id, now);
    await flushInfra(tx);
    const after = await this.snapshot(
      tx,
      space,
      practiceId,
      axis === 'OCCUPANCY'
        ? {
            ...(occupancyOverride ?? before.occupancy),
            code: to as OccupancyCode,
          }
        : occupancyOverride,
    );
    const event = tx.create(
      CareSpaceStatusEvents,
      {
        tenantId: space.tenantId,
        practiceSiteId: space.practiceSiteId,
        careSpaceId: space.id,
        axisConceptId: AXIS[axis],
        fromConceptId: this.conceptOf(axis, from),
        toConceptId: this.conceptOf(axis, to) as string,
        reasonConceptId: ctx.reasonId ?? undefined,
        reasonText: ctx.reasonText ?? undefined,
        expectedUntil: ctx.expectedUntil ?? undefined,
        v20116Code: after.v2Code,
        sourceConceptId: SOURCE[ctx.source],
        sourceRefId: ctx.sourceRefId ?? undefined,
        occurredAt: now,
        recordedByUserId: ctx.actor?.id,
        requestId: ctx.requestId,
        createdAt: now,
      },
      { partial: true },
    );
    await this.appendHistory(
      tx,
      'space',
      space,
      AUD.OPERATION_UPDATE,
      ctx.actor?.id,
    );
    await flushInfra(tx);
    await guardInfraWrite(() =>
      publishOpsEvent(this.outbox, tx, OPS_EVENTS.statusChanged, {
        tenantId: space.tenantId,
        aggregateId: space.id,
        actorUserId: ctx.actor?.id,
        payload: {
          careSpaceId: space.id,
          siteId: space.practiceSiteId,
          axis,
          from: from ?? null,
          to,
          v2Code: after.v2Code,
          reasonCode: ctx.reasonCode ?? null,
          reasonText: ctx.reasonText ?? null,
          expectedUntil: ctx.expectedUntil?.toISOString() ?? null,
          source: ctx.source,
          sourceRefId: ctx.sourceRefId ?? null,
          occurredAt: now.toISOString(),
          requestId: ctx.requestId ?? null,
          eventId: event.id,
          opsVersion: space.opsVersion,
        },
      }),
    );
    return event;
  }

  /**
   * Escribe columnas operativas del espacio con `ops_version + 1` sin tocar
   * `row_version`, y recarga la entidad.
   *
   * @param tx - Transacción.
   * @param space - Espacio (bloqueado).
   * @param patch - Columnas.
   * @param actorUserId - Actor.
   * @param now - Marca de tiempo.
   */
  async updateOps(
    tx: EntityManager,
    space: CareSpaces,
    patch: OpsPatch,
    actorUserId?: string,
    now = new Date(),
  ): Promise<void> {
    await tx.nativeUpdate(
      CareSpaces,
      { id: space.id },
      {
        ...patch,
        opsVersion: (space.opsVersion ?? 1) + 1,
        updatedAt: now,
        updatedByUserId: actorUserId,
      },
    );
    await tx.refresh(space);
  }

  /**
   * Abre una orden de limpieza y deja la higiene en `HYG_DIRTY` (salvo que ya
   * esté sucia o contaminada). Con una orden abierta: 409
   * `CLEANING_ORDER_ALREADY_OPEN` con la abierta, salvo `escalateOpen`
   * (contaminación), que la escala a TERMINAL y la devuelve.
   *
   * @param tx - Transacción.
   * @param space - Espacio (bloqueado).
   * @param practiceId - Práctica.
   * @param req - Tipo, disparador, prioridad.
   * @param ctx - Contexto del cambio.
   * @param options - `escalateOpen`, `reuseOpen` (ADT: devolver la abierta).
   */
  async openCleaningOrder(
    tx: EntityManager,
    space: CareSpaces,
    practiceId: string,
    req: CleaningOrderRequest,
    ctx: ChangeContext,
    options: { escalateOpen?: boolean; reuseOpen?: boolean } = {},
  ): Promise<{ order: CleaningOrders; created: boolean }> {
    let [open] = await this.opsRepo.openCleaningOrders(tx, [space.id]);
    const now = ctx.occurredAt ?? new Date();
    if (
      open &&
      (await this.supersedeIfDone(tx, space, practiceId, open, ctx, now))
    ) {
      open = undefined as unknown as CleaningOrders;
    }
    if (open) {
      if (options.escalateOpen && req.type === 'CLEAN_TERMINAL') {
        open.cleaningTypeConceptId = CLEANING_TYPE.CLEAN_TERMINAL;
        touch(open, ctx.actor?.id, now);
        await flushInfra(tx);
        await this.appendHistory(
          tx,
          'cleaning',
          open,
          AUD.OPERATION_UPDATE,
          ctx.actor?.id,
        );
        return { order: open, created: false };
      }
      if (options.reuseOpen) return { order: open, created: false };
      throw opsError('CLEANING_ORDER_ALREADY_OPEN', {
        openCleaningOrderId: open.id,
      });
    }
    const order = tx.create(
      CleaningOrders,
      {
        tenantId: space.tenantId,
        practiceSiteId: space.practiceSiteId,
        careSpaceId: space.id,
        clinicalUnitId: space.clinicalUnitId,
        cleaningTypeConceptId: CLEANING_TYPE[req.type],
        triggerConceptId: CLEANING_TRIGGER[req.trigger],
        sourceRefId: req.sourceRefId ?? undefined,
        previousOrderId: req.previousOrderId ?? undefined,
        priorityConceptId:
          CLEANING_PRIORITY[req.priority ?? 'CLN_PRIO_ROUTINE'],
        statusConceptId: CLEANING_STATUS.CLN_PENDING,
        requestedAt: now,
        dueAt: req.dueAt ?? undefined,
        createdAt: now,
        updatedAt: now,
        createdByUserId: ctx.actor?.id,
        updatedByUserId: ctx.actor?.id,
      },
      { partial: true },
    );
    await flushInfra(tx);
    await this.appendHistory(
      tx,
      'cleaning',
      order,
      AUD.OPERATION_INSERT,
      ctx.actor?.id,
    );
    await guardInfraWrite(() =>
      publishOpsEvent(this.outbox, tx, OPS_EVENTS.cleaningCreated, {
        tenantId: space.tenantId,
        aggregateId: order.id,
        actorUserId: ctx.actor?.id,
        payload: this.orderPayload(order, ctx),
      }),
    );
    const hygiene =
      codeFor(HYGIENE, space.hygieneStatusConceptId) ?? 'HYG_CLEAN';
    if (hygiene !== 'HYG_DIRTY' && hygiene !== 'HYG_CONTAMINATED') {
      await this.changeAxis(tx, space, practiceId, 'HYGIENE', 'HYG_DIRTY', {
        ...ctx,
        source: ctx.source === 'MANUAL' ? 'CLEANING' : ctx.source,
        sourceRefId: order.id,
      });
    }
    return { order, created: true };
  }

  /**
   * Una orden TERMINADA sin inspección pendiente (no exigida, no terminal)
   * sigue contando como abierta para el índice único del modelo; cuando hace
   * falta una orden nueva se la cierra como reemplazada (`CLN_CANCELLED`).
   *
   * @returns `true` si la reemplazó.
   */
  private async supersedeIfDone(
    tx: EntityManager,
    space: CareSpaces,
    practiceId: string,
    open: CleaningOrders,
    ctx: ChangeContext,
    now: Date,
  ): Promise<boolean> {
    if (open.statusConceptId !== CLEANING_STATUS.CLN_DONE) return false;
    if (open.cleaningTypeConceptId === CLEANING_TYPE.CLEAN_TERMINAL)
      return false;
    if (space.terminalCleaningRequired) return false;
    if ((await this.settings(tx, practiceId)).inspectionRequired) return false;
    open.statusConceptId = CLEANING_STATUS.CLN_CANCELLED;
    open.cancelReason =
      'Reemplazada por una orden nueva (sin inspección exigida)';
    touch(open, ctx.actor?.id, now);
    await flushInfra(tx);
    await this.appendHistory(
      tx,
      'cleaning',
      open,
      AUD.OPERATION_UPDATE,
      ctx.actor?.id,
    );
    await guardInfraWrite(() =>
      publishOpsEvent(this.outbox, tx, OPS_EVENTS.cleaningCancelled, {
        tenantId: space.tenantId,
        aggregateId: open.id,
        actorUserId: ctx.actor?.id,
        payload: this.orderPayload(open, ctx),
      }),
    );
    return true;
  }

  /**
   * Payload de evento de una orden (sin datos de paciente).
   *
   * @param order - Orden.
   * @param ctx - Contexto.
   */
  orderPayload(
    order: CleaningOrders,
    ctx: Pick<ChangeContext, 'requestId'>,
  ): Record<string, unknown> {
    return {
      cleaningOrderId: order.id,
      careSpaceId: order.careSpaceId,
      siteId: order.practiceSiteId,
      cleaningType: codeFor(CLEANING_TYPE, order.cleaningTypeConceptId) ?? null,
      trigger: codeFor(CLEANING_TRIGGER, order.triggerConceptId) ?? null,
      status: codeFor(CLEANING_STATUS, order.statusConceptId) ?? null,
      sourceRefId: order.sourceRefId ?? null,
      rowVersion: order.rowVersion,
      requestId: ctx.requestId ?? null,
    };
  }

  /**
   * Sella una revisión de espacio, bloqueo u orden con su tenant.
   *
   * @param tx - Transacción.
   * @param kind - Clave de `OPS_HISTORY`.
   * @param row - Fila ya persistida.
   * @param operationConceptId - `AUD.OPERATION_INSERT|UPDATE`.
   * @param actorUserId - Actor.
   */
  appendHistory(
    tx: EntityManager,
    kind: keyof typeof OPS_HISTORY,
    row: CareSpaces | CareSpaceBlocks | CleaningOrders,
    operationConceptId: string,
    actorUserId?: string,
  ): Promise<void> {
    return this.history.append(tx, OPS_HISTORY[kind], row.id, {
      operationConceptId,
      dataSnapshot: structureSnapshot(row),
      changedByUserId: actorUserId,
      tenantId: row.tenantId,
    });
  }

  private currentCode(
    snap: OperationalSnapshot,
    axis: AxisCode,
    fromCode?: string,
  ): string {
    switch (axis) {
      case 'AVAILABILITY':
        return snap.axes.availability;
      case 'HYGIENE':
        return snap.axes.hygiene;
      case 'ISOLATION':
        return snap.axes.isolation;
      default:
        return fromCode ?? snap.axes.occupancy;
    }
  }

  private conceptOf(
    axis: AxisCode,
    code: string | undefined,
  ): string | undefined {
    if (!code) return undefined;
    const table: Record<string, string> =
      axis === 'AVAILABILITY'
        ? AVAILABILITY
        : axis === 'HYGIENE'
          ? HYGIENE
          : axis === 'ISOLATION'
            ? ISOLATION
            : OCCUPANCY;
    return table[code];
  }
}
