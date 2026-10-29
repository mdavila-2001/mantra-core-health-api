import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories';
import type {
  AvailabilityCode,
  HygieneCode,
  IsolationCode,
  OccupancyCode,
  V2BedStatus,
} from '../domain/bed-status-v2';
import { CareSpaces, CareSpaceStatusEvents } from '../entities';
import { OpsVersionMismatchException } from '../http/ops-version';
import {
  AVAILABILITY,
  AXES,
  BLOCK_REASONS,
  HYGIENE,
  ISOLATION,
  OCCUPANCY,
  STATUS_SOURCES,
  conceptIdOf,
} from '../ops-catalog';
import type { CareSpaceOperationalState } from './care-space-ops.port';
import { OPS_EVENTS, OpsEventsService } from './ops-events';
import { isClinicalText, visibleText } from './ops-privacy';
import type { SpaceOpsRow } from './ops-rows';
import { OpsStateService } from './ops-state';
import { STRUCTURE_HISTORY, structureSnapshot } from './structure-history';

/** Origen del cambio de estado (código de `STATUS_SOURCES`). */
export type StatusSourceCode =
  | 'SRC_MANUAL'
  | 'SRC_ADT'
  | 'SRC_CLEANING'
  | 'SRC_BLOCK'
  | 'SRC_ROOM_EVENT'
  | 'SRC_SYSTEM';

/** Contexto de una operación sobre un espacio. */
export interface OpsContext {
  readonly tenantId: string;
  /** Quien lo hace; `null` si lo origina el sistema (worker, ADT automático). */
  readonly actorUserId: string | null;
  readonly requestId?: string | null;
  readonly source: StatusSourceCode;
  /** Id del bloqueo, de la orden o de la ubicación que originó el cambio. */
  readonly sourceRefId?: string | null;
  /** Roles con los que actuó (queda en el evento y en la historia). */
  readonly actingRoles?: readonly string[];
  /** Nombre de la operación, para la historia de la fila. */
  readonly action: string;
  /** Instante de la operación; por omisión, ahora. */
  readonly now?: Date;
}

/** Cambio de un conjunto de ejes en una sola operación (una sola subida de `ops_version`). */
export interface AxisChange {
  readonly availability?: {
    readonly to: AvailabilityCode;
    readonly reasonConceptId: string | null;
    readonly expectedUntil: Date | null;
    readonly reasonText: string | null;
  };
  readonly hygiene?: {
    readonly to: HygieneCode;
    readonly reasonText?: string | null;
  };
  readonly isolation?: {
    readonly to: IsolationCode;
    readonly organismText: string | null;
    readonly reasonText?: string | null;
  };
  readonly terminalCleaningRequired?: boolean;
}

/** Un evento A20 ya registrado. */
export interface RecordedEvent {
  readonly id: string;
  readonly axis: string;
  readonly from: string | null;
  readonly to: string;
  readonly v2Code: V2BedStatus;
}

/** Resultado de aplicar un cambio de ejes. */
export interface ApplyResult {
  /** El espacio ya actualizado. */
  readonly row: SpaceOpsRow;
  readonly state: CareSpaceOperationalState;
  readonly events: RecordedEvent[];
}

/** Lo necesario para insertar un evento de estado. */
interface EventSpec {
  readonly axisCode: string;
  readonly fromId: string | null;
  readonly toId: string;
  readonly fromCode: string | null;
  readonly toCode: string;
  readonly reasonConceptId?: string | null;
  readonly reasonText?: string | null;
  readonly expectedUntil?: Date | null;
}

const sameInstant = (a: Date | null, b: Date | null): boolean =>
  (a?.getTime() ?? null) === (b?.getTime() ?? null);

/**
 * Escribe los cambios de estado operativo: la fila del espacio (con
 * `ops_version` compare-and-set), los eventos A20 append-only, el outbox y la
 * historia, todo en la transacción del llamador (INV-26, INV-43).
 *
 * El `UPDATE` es nativo y **no** toca `row_version`: la edición de estructura y la
 * operación de camas no se pisan entre sí (CONTRATO-F2-F5 §F2.1).
 */
@Injectable()
export class OpsRecorder {
  /**
   * @param state - Lectura del estado operativo.
   * @param events - Outbox.
   * @param historyRepo - Historia de la fila.
   */
  constructor(
    private readonly state: OpsStateService,
    private readonly events: OpsEventsService,
    private readonly historyRepo: HistoryRepository,
  ) {}

  /**
   * Aplica un cambio de ejes al espacio.
   *
   * @param tx - Transacción de la operación.
   * @param row - El espacio, cargado dentro de esta transacción (idealmente `FOR UPDATE`).
   * @param change - Qué ejes cambian.
   * @param ctx - Quién, por qué origen y con qué petición.
   * @returns La fila nueva, el estado resultante y los eventos escritos; sin cambios, nada se escribe.
   * @throws OpsVersionMismatchException si otro cambió el espacio entre la lectura y la escritura.
   */
  async applyChange(
    tx: EntityManager,
    row: SpaceOpsRow,
    change: AxisChange,
    ctx: OpsContext,
  ): Promise<ApplyResult> {
    const now = ctx.now ?? new Date();
    const patch: Partial<SpaceOpsRow> = {};
    const specs: EventSpec[] = [];

    const availableId = conceptIdOf(AVAILABILITY, 'SPACE_OP_AVAILABLE');
    const currentAvailability = row.operationalStatusConceptId ?? availableId;
    if (change.availability) {
      const toId = conceptIdOf(AVAILABILITY, change.availability.to);
      const reason = change.availability.reasonConceptId;
      if (
        toId !== currentAvailability ||
        reason !== row.availabilityReasonConceptId ||
        !sameInstant(
          change.availability.expectedUntil,
          row.availabilityExpectedUntil,
        )
      ) {
        Object.assign(patch, {
          operationalStatusConceptId: toId,
          availabilityReasonConceptId: reason,
          availabilityExpectedUntil: change.availability.expectedUntil,
          availabilityChangedAt: now,
        });
        specs.push({
          axisCode: 'AXIS_AVAILABILITY',
          fromId: currentAvailability,
          toId,
          fromCode: AVAILABILITY.byConceptId(currentAvailability)?.code ?? null,
          toCode: change.availability.to,
          reasonConceptId: reason,
          reasonText: change.availability.reasonText,
          expectedUntil: change.availability.expectedUntil,
        });
      }
    }

    const currentHygiene =
      row.hygieneStatusConceptId ?? conceptIdOf(HYGIENE, 'HYG_CLEAN');
    if (change.hygiene) {
      const toId = conceptIdOf(HYGIENE, change.hygiene.to);
      if (toId !== currentHygiene) {
        Object.assign(patch, {
          hygieneStatusConceptId: toId,
          hygieneChangedAt: now,
        });
        specs.push({
          axisCode: 'AXIS_HYGIENE',
          fromId: currentHygiene,
          toId,
          fromCode: HYGIENE.byConceptId(currentHygiene)?.code ?? null,
          toCode: change.hygiene.to,
          reasonText: change.hygiene.reasonText ?? null,
        });
      }
    }

    const currentIsolation =
      row.isolationConceptId ?? conceptIdOf(ISOLATION, 'ISO_NONE');
    if (change.isolation) {
      const toId = conceptIdOf(ISOLATION, change.isolation.to);
      if (
        toId !== currentIsolation ||
        change.isolation.organismText !== row.isolationOrganismText
      ) {
        Object.assign(patch, {
          isolationConceptId: toId,
          isolationOrganismText: change.isolation.organismText,
          isolationChangedAt: now,
        });
        specs.push({
          axisCode: 'AXIS_ISOLATION',
          fromId: currentIsolation,
          toId,
          fromCode: ISOLATION.byConceptId(currentIsolation)?.code ?? null,
          toCode: change.isolation.to,
          reasonText: change.isolation.reasonText ?? null,
        });
      }
    }

    if (
      change.terminalCleaningRequired !== undefined &&
      change.terminalCleaningRequired !== row.terminalCleaningRequired
    ) {
      Object.assign(patch, {
        terminalCleaningRequired: change.terminalCleaningRequired,
      });
    }

    if (Object.keys(patch).length === 0) {
      return { row, state: await this.state.stateOf(tx, row, now), events: [] };
    }

    const next: SpaceOpsRow = {
      ...row,
      ...patch,
      opsVersion: row.opsVersion + 1,
    };
    const applied = await this.updateRow(tx, row, {
      ...(patch as Record<string, unknown>),
      ops_version: next.opsVersion,
      updated_at: now,
      updated_by_user_id: ctx.actorUserId,
    });
    const affected = applied ? 1 : 0;
    if (affected === 0) throw new OpsVersionMismatchException();

    const state = await this.state.stateOf(tx, next, now);
    const events: RecordedEvent[] = [];
    for (const spec of specs) {
      events.push(
        await this.writeEvent(tx, next, spec, state.v2Code, ctx, now),
      );
    }
    await this.appendRowHistory(tx, next, ctx);
    return { row: next, state, events };
  }

  /**
   * Registra un cambio de ocupación (eje OCCUPANCY). La ocupación la deriva
   * `encounter_locations`; acá queda el evento A20, el outbox y la subida de
   * `ops_version`, para que una edición operativa con versión vieja falle.
   *
   * @param tx - Transacción del llamador (F3).
   * @param row - El espacio, cargado en esta transacción.
   * @param from - Ocupación anterior.
   * @param to - Ocupación nueva.
   * @param ctx - Quién y por qué origen.
   */
  async recordOccupancy(
    tx: EntityManager,
    row: SpaceOpsRow,
    from: OccupancyCode,
    to: OccupancyCode,
    ctx: OpsContext,
  ): Promise<RecordedEvent | null> {
    if (from === to) return null;
    const now = ctx.now ?? new Date();
    const applied = await this.updateRow(tx, row, {
      ops_version: row.opsVersion + 1,
      updated_at: now,
    });
    const affected = applied ? 1 : 0;
    if (affected === 0) throw new OpsVersionMismatchException();
    const next: SpaceOpsRow = { ...row, opsVersion: row.opsVersion + 1 };
    const state = await this.state.stateOf(tx, next, now, to);
    return this.writeEvent(
      tx,
      next,
      {
        axisCode: 'AXIS_OCCUPANCY',
        fromId: conceptIdOf(OCCUPANCY, from),
        toId: conceptIdOf(OCCUPANCY, to),
        fromCode: from,
        toCode: to,
      },
      state.v2Code,
      ctx,
      now,
    );
  }

  /**
   * `UPDATE` de las columnas operativas con compare-and-set sobre `ops_version`.
   *
   * Es SQL directo a propósito: el `nativeUpdate` del ORM sube `row_version` en todo
   * `UPDATE` de una entidad versionada, y la operación de camas no debe moverla (la
   * edición de estructura usa `If-Match` sobre `row_version`; CONTRATO-F2-F5 §F2.1).
   *
   * @returns `true` si la fila seguía en la versión operativa leída.
   */
  private async updateRow(
    tx: EntityManager,
    row: SpaceOpsRow,
    columns: Record<string, unknown>,
  ): Promise<boolean> {
    const names: Record<string, string> = {
      operationalStatusConceptId: 'operational_status_concept_id',
      availabilityReasonConceptId: 'availability_reason_concept_id',
      availabilityExpectedUntil: 'availability_expected_until',
      availabilityChangedAt: 'availability_changed_at',
      hygieneStatusConceptId: 'hygiene_status_concept_id',
      hygieneChangedAt: 'hygiene_changed_at',
      terminalCleaningRequired: 'terminal_cleaning_required',
      isolationConceptId: 'isolation_concept_id',
      isolationOrganismText: 'isolation_organism_text',
      isolationChangedAt: 'isolation_changed_at',
    };
    const entries = Object.entries(columns)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [names[key] ?? key, value] as const);
    const updated = await tx.execute<{ id: string }[]>(
      `update practice.care_spaces set ${entries.map(([c]) => `${c} = ?`).join(', ')}
        where id = ? and tenant_id = ? and ops_version = ? returning id`,
      [
        ...entries.map(([, value]) => value),
        row.id,
        row.tenantId,
        row.opsVersion,
      ],
    );
    return updated.length > 0;
  }

  /** Inserta el evento A20 y publica `practice.care_space.status_changed`. */
  private async writeEvent(
    tx: EntityManager,
    row: SpaceOpsRow,
    spec: EventSpec,
    v2Code: V2BedStatus,
    ctx: OpsContext,
    now: Date,
  ): Promise<RecordedEvent> {
    const id = randomUUID();
    await tx.insert(CareSpaceStatusEvents, {
      id,
      tenantId: row.tenantId,
      practiceSiteId: row.practiceSiteId,
      careSpaceId: row.id,
      axisConceptId: conceptIdOf(AXES, spec.axisCode),
      fromConceptId: spec.fromId ?? undefined,
      toConceptId: spec.toId,
      reasonConceptId: spec.reasonConceptId ?? undefined,
      reasonText: spec.reasonText ?? undefined,
      expectedUntil: spec.expectedUntil ?? undefined,
      v20116Code: v2Code,
      sourceConceptId: conceptIdOf(STATUS_SOURCES, ctx.source),
      sourceRefId: ctx.sourceRefId ?? undefined,
      occurredAt: now,
      recordedByUserId: ctx.actorUserId ?? undefined,
      requestId: ctx.requestId ?? undefined,
      createdAt: now,
    });
    await this.events.publish(tx, {
      type: OPS_EVENTS.statusChanged,
      aggregateType: 'care_space',
      aggregateId: row.id,
      tenantId: row.tenantId,
      actorUserId: ctx.actorUserId,
      requestId: ctx.requestId,
      uniqueRef: id,
      payload: {
        careSpaceId: row.id,
        siteId: row.practiceSiteId,
        axis: spec.axisCode,
        from: spec.fromCode,
        to: spec.toCode,
        v2Code,
        reasonCode:
          BLOCK_REASONS.byConceptId(spec.reasonConceptId)?.code ?? null,
        // El outbox no lleva texto clínico: ni el motivo del aislamiento ni su organismo.
        reasonText: visibleText(
          spec.reasonText,
          isClinicalText(
            spec.axisCode,
            BLOCK_REASONS.byConceptId(spec.reasonConceptId)?.code,
          ),
          false,
        ),
        expectedUntil: spec.expectedUntil?.toISOString() ?? null,
        source: ctx.source,
        sourceRefId: ctx.sourceRefId ?? null,
        occurredAt: now.toISOString(),
        eventId: id,
        opsVersion: row.opsVersion,
        actingRoles: ctx.actingRoles ?? [],
      },
    });
    return {
      id,
      axis: spec.axisCode,
      from: spec.fromCode,
      to: spec.toCode,
      v2Code,
    };
  }

  /** Revisión de `audit.care_spaces_history` con la fila completa tras el cambio. */
  private async appendRowHistory(
    tx: EntityManager,
    row: SpaceOpsRow,
    ctx: OpsContext,
  ): Promise<void> {
    const entity = await tx.findOne(
      CareSpaces,
      { id: row.id },
      { refresh: true },
    );
    if (!entity) return;
    await this.historyRepo.append(tx, STRUCTURE_HISTORY.space, row.id, {
      operationConceptId: AUD.OPERATION_UPDATE,
      dataSnapshot: {
        // El organismo del aislamiento es dato clínico: no va a la historia genérica.
        ...structureSnapshot(entity),
        isolationOrganismText: undefined,
        opsAction: ctx.action,
        actingRoles: ctx.actingRoles ?? [],
      },
      changedByUserId: ctx.actorUserId ?? undefined,
      tenantId: row.tenantId,
    });
  }
}
