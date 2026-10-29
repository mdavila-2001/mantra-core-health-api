import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
} from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories';
import { CONCEPTS } from '../../../common';
import type {
  CareSpaceBlockView,
  FutureCommitment,
} from '../dto/care-space-ops.types';
import { CareSpaceBlocks } from '../entities';
import { RowVersionMismatchException } from '../http/row-version';
import { CLIN } from '../../clinical/clinical.concepts';
import {
  BLOCK_KINDS,
  BLOCK_REASONS,
  KIND_TO_AVAILABILITY,
  axisCodes,
  conceptIdOf,
  type BlockKindCode,
} from '../ops-catalog';
import { OpsErrorReason } from '../practice-ops.error-reasons';
import { CleaningOrdersService } from './cleaning-orders.service';
import { OPS_EVENTS, OpsEventsService } from './ops-events';
import { OpsRecorder, type ApplyResult, type OpsContext } from './ops-recorder';
import {
  BLOCK_COLUMNS,
  isoOrNull,
  toBlockRow,
  type BlockRow,
  type SpaceOpsRow,
  str,
} from './ops-rows';
import { OpsStateService } from './ops-state';
import { ref } from './structure-mapper';

/** Un bloqueo ya validado, listo para crear. */
export interface NewBlockInput {
  readonly kind: BlockKindCode;
  readonly reasonConceptId: string;
  readonly reasonText: string | null;
  /** Inicio; si es futuro, `blocks-tick` lo aplica cuando llega. */
  readonly startsAt: Date;
  readonly expectedEndAt: Date | null;
  readonly workOrderRef: string | null;
  /** Reconoce los compromisos futuros y bloquea igual. */
  readonly acknowledgeConflicts: boolean;
  /** Buscar compromisos futuros en la ventana (no aplica a las camas hermanas de una cohorte). */
  readonly checkCommitments: boolean;
}

/** Resultado de crear un bloqueo. */
export interface CreatedBlock {
  readonly block: BlockRow;
  /** El bloqueo ya rige (empezó ahora); si no, queda programado. */
  readonly applied: boolean;
  readonly result: ApplyResult | null;
  readonly conflicts: FutureCommitment[];
}

/** Resultado de terminar o cancelar un bloqueo. */
export interface EndedBlock {
  readonly block: BlockRow;
  readonly result: ApplyResult | null;
  readonly cleaningOrderId: string | null;
}

/** ¿Rige el bloqueo hoy? Se deriva del estado del espacio: no hay columna «aplicado». */
export function isBlockApplied(
  block: BlockRow,
  availability: string,
  now: Date,
): boolean {
  if (block.endedAt || block.cancelledAt) return false;
  if (block.startsAt.getTime() > now.getTime()) return false;
  const kind = BLOCK_KINDS.byConceptId(block.kindConceptId)?.code as
    BlockKindCode | undefined;
  return kind !== undefined && KIND_TO_AVAILABILITY[kind] === availability;
}

/** Vista de un bloqueo. */
export function toBlockView(
  block: BlockRow,
  availability: string,
  now: Date,
): CareSpaceBlockView {
  return {
    id: block.id,
    careSpaceId: block.careSpaceId,
    kind: ref(BLOCK_KINDS.byConceptId(block.kindConceptId)),
    reason: ref(BLOCK_REASONS.byConceptId(block.reasonConceptId)),
    reasonText: block.reasonText,
    startsAt: block.startsAt.toISOString(),
    expectedEndAt: isoOrNull(block.expectedEndAt),
    endedAt: isoOrNull(block.endedAt),
    endedByUserId: block.endedByUserId,
    endNote: block.endNote,
    cancelledAt: isoOrNull(block.cancelledAt),
    cancelReason: block.cancelReason,
    workOrderRef: block.workOrderRef,
    applied: isBlockApplied(block, availability, now),
    overdue:
      !block.endedAt &&
      !block.cancelledAt &&
      block.expectedEndAt !== null &&
      block.expectedEndAt.getTime() < now.getTime(),
    createdAt: block.createdAt.toISOString(),
    createdByUserId: block.createdByUserId,
    rowVersion: block.rowVersion,
  };
}

/**
 * Ciclo de vida de los bloqueos (`care_space_blocks`): crear (con la ventana, la
 * ocupación y los compromisos futuros validados), aplicar, terminar y cancelar.
 *
 * Todo estado no disponible del espacio corresponde a **un** bloqueo abierto: lo
 * garantiza el `EXCLUDE ex_care_space_blocks_time` de la base (`BLOCK_OVERLAP`), que
 * la API pre-valida. El fin de un mantenimiento deja el espacio sucio y abre una
 * orden `MAINTENANCE_END` (regla B.5-25: limpiar antes de volver a uso).
 */
@Injectable()
export class CareSpaceBlocksService {
  /**
   * @param state - Lectura del estado operativo.
   * @param recorder - Escritura de ejes y eventos A20.
   * @param events - Outbox.
   * @param historyRepo - Historia de los bloqueos.
   * @param cleaning - Órdenes de limpieza.
   */
  constructor(
    private readonly state: OpsStateService,
    private readonly recorder: OpsRecorder,
    private readonly events: OpsEventsService,
    private readonly historyRepo: HistoryRepository,
    private readonly cleaning: CleaningOrdersService,
  ) {}

  /** Bloqueos de un espacio (por omisión, sólo los que no terminaron ni se cancelaron). */
  async list(
    tx: EntityManager,
    tenantId: string,
    careSpaceId: string,
    includeEnded: boolean,
  ): Promise<BlockRow[]> {
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select ${BLOCK_COLUMNS} from practice.care_space_blocks b
        where b.care_space_id = ? and b.tenant_id = ?
          ${includeEnded ? '' : 'and b.ended_at is null and b.cancelled_at is null'}
        order by b.starts_at desc, b.id`,
      [careSpaceId, tenantId],
    );
    return rows.map(toBlockRow);
  }

  /** Un bloqueo del tenant (bloqueado para actualizar), o `null`. */
  async find(
    tx: EntityManager,
    tenantId: string,
    blockId: string,
    lock = false,
  ): Promise<BlockRow | null> {
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select ${BLOCK_COLUMNS} from practice.care_space_blocks b
        where b.id = ? and b.tenant_id = ? ${lock ? 'for update' : ''}`,
      [blockId, tenantId],
    );
    return rows.length ? toBlockRow(rows[0]) : null;
  }

  /** El bloqueo abierto que rige hoy (empezó y no terminó), si hay. */
  async currentOpen(
    tx: EntityManager,
    tenantId: string,
    careSpaceId: string,
    now: Date,
  ): Promise<BlockRow | null> {
    const rows = await tx.execute<Record<string, unknown>[]>(
      `select ${BLOCK_COLUMNS} from practice.care_space_blocks b
        where b.care_space_id = ? and b.tenant_id = ?
          and b.ended_at is null and b.cancelled_at is null and b.starts_at <= ?
        order by b.starts_at desc limit 1 for update`,
      [careSpaceId, tenantId, now],
    );
    return rows.length ? toBlockRow(rows[0]) : null;
  }

  /**
   * Crea un bloqueo y, si empieza ahora, lo aplica al espacio.
   *
   * @param tx - Transacción.
   * @param row - El espacio, cargado `FOR UPDATE` en esta transacción.
   * @param input - El bloqueo ya validado.
   * @param ctx - Quién, con qué origen (`source` se fija a `SRC_BLOCK`).
   * @throws ConflictException (`BLOCK_OVERLAP`, `SPACE_OCCUPIED`, `FUTURE_COMMITMENTS_CONFLICT`).
   */
  async create(
    tx: EntityManager,
    row: SpaceOpsRow,
    input: NewBlockInput,
    ctx: OpsContext,
  ): Promise<CreatedBlock> {
    const now = ctx.now ?? new Date();
    const immediate = input.startsAt.getTime() <= now.getTime();

    const overlap = await tx.execute<{ id: string }[]>(
      `select id from practice.care_space_blocks
        where care_space_id = ? and cancelled_at is null
          and (ended_at is null or ended_at > ?) limit 1`,
      [row.id, input.startsAt],
    );
    if (overlap.length > 0) {
      throw new ConflictException(
        'El espacio ya tiene un bloqueo en ese período',
        { blockId: overlap[0].id },
        OpsErrorReason.BLOCK_OVERLAP,
      );
    }

    if (immediate) {
      const state = await this.state.stateOf(tx, row, now);
      if (state.occupancy !== 'OCC_FREE') {
        throw new ConflictException(
          'No se bloquea ni se cierra una cama ocupada o reservada',
          { occupancy: state.occupancy },
          OpsErrorReason.SPACE_OCCUPIED,
        );
      }
    }

    let conflicts: FutureCommitment[] = [];
    if (input.checkCommitments) {
      conflicts = await this.commitments(
        tx,
        row.id,
        input.startsAt.getTime() > now.getTime() ? input.startsAt : now,
        input.expectedEndAt,
      );
      if (conflicts.length > 0 && !input.acknowledgeConflicts) {
        throw new ConflictException(
          'Hay compromisos futuros en la ventana del bloqueo',
          { conflicts },
          OpsErrorReason.FUTURE_COMMITMENTS_CONFLICT,
        );
      }
    }

    const id = randomUUID();
    await tx.insert(CareSpaceBlocks, {
      id,
      tenantId: row.tenantId,
      careSpaceId: row.id,
      kindConceptId: conceptIdOf(BLOCK_KINDS, input.kind),
      reasonConceptId: input.reasonConceptId,
      reasonText: input.reasonText ?? undefined,
      startsAt: input.startsAt,
      expectedEndAt: input.expectedEndAt ?? undefined,
      workOrderRef: input.workOrderRef ?? undefined,
      createdAt: now,
      updatedAt: now,
      createdByUserId: ctx.actorUserId ?? undefined,
      updatedByUserId: ctx.actorUserId ?? undefined,
      rowVersion: 1,
    });
    const block = (await this.find(tx, row.tenantId, id))!;
    await this.historyOf(tx, block, ctx.actorUserId, 'create', true);

    let result: ApplyResult | null = null;
    if (immediate) {
      result = await this.applyToSpace(tx, row, block, ctx, now);
    }
    return { block, applied: immediate, result, conflicts };
  }

  /**
   * Aplica al espacio un bloqueo que ya empezó y publica `block_started`. Lo usa la
   * creación inmediata y `blocks-tick` para los programados.
   */
  async applyToSpace(
    tx: EntityManager,
    row: SpaceOpsRow,
    block: BlockRow,
    ctx: OpsContext,
    now: Date,
  ): Promise<ApplyResult> {
    const kind = BLOCK_KINDS.byConceptId(block.kindConceptId)!
      .code as BlockKindCode;
    const result = await this.recorder.applyChange(
      tx,
      row,
      {
        availability: {
          to: KIND_TO_AVAILABILITY[kind],
          reasonConceptId: block.reasonConceptId,
          expectedUntil: block.expectedEndAt,
          reasonText: block.reasonText,
        },
      },
      { ...ctx, source: 'SRC_BLOCK', sourceRefId: block.id, now },
    );
    await this.events.publish(tx, {
      type: OPS_EVENTS.blockStarted,
      aggregateType: 'care_space_block',
      aggregateId: block.id,
      tenantId: block.tenantId,
      actorUserId: ctx.actorUserId,
      requestId: ctx.requestId,
      uniqueRef: String(block.rowVersion),
      payload: {
        blockId: block.id,
        careSpaceId: block.careSpaceId,
        siteId: row.practiceSiteId,
        kind,
        reasonCode:
          BLOCK_REASONS.byConceptId(block.reasonConceptId)?.code ?? null,
        reasonText: block.reasonText,
        startsAt: block.startsAt.toISOString(),
        expectedEndAt: isoOrNull(block.expectedEndAt),
        workOrderRef: block.workOrderRef,
        v2Code: result.state.v2Code,
        actingRoles: ctx.actingRoles ?? [],
      },
    });
    return result;
  }

  /**
   * Termina un bloqueo que ya rige y devuelve el espacio a disponible. El fin de un
   * mantenimiento lo deja sucio y abre la orden `MAINTENANCE_END`.
   *
   * @throws ConflictException (`BLOCK_ALREADY_ENDED`).
   * @throws PreconditionFailedException (`AVAILABILITY_ACTION_INVALID`) si todavía no empezó.
   */
  async end(
    tx: EntityManager,
    row: SpaceOpsRow,
    block: BlockRow,
    note: string | null,
    ctx: OpsContext,
  ): Promise<EndedBlock> {
    const now = ctx.now ?? new Date();
    this.assertOpen(block);
    if (block.startsAt.getTime() > now.getTime()) {
      throw new PreconditionFailedException(
        'El bloqueo todavía no empezó: cancelalo en lugar de terminarlo',
        { blockId: block.id, startsAt: block.startsAt.toISOString() },
        OpsErrorReason.AVAILABILITY_ACTION_INVALID,
      );
    }
    const next = await this.updateBlock(
      tx,
      block,
      {
        endedAt: now,
        endedByUserId: ctx.actorUserId ?? undefined,
        endNote: note ?? undefined,
      },
      ctx.actorUserId,
      now,
    );
    const kind = BLOCK_KINDS.byConceptId(block.kindConceptId)!
      .code as BlockKindCode;
    const wasApplied =
      axisCodes({ operationalStatusConceptId: row.operationalStatusConceptId })
        .availability === KIND_TO_AVAILABILITY[kind];
    let result: ApplyResult | null = null;
    let cleaningOrderId: string | null = null;
    const release = {
      availability: {
        to: 'SPACE_OP_AVAILABLE' as const,
        reasonConceptId: null,
        expectedUntil: null,
        reasonText: note,
      },
    };
    const blockCtx: OpsContext = {
      ...ctx,
      source: 'SRC_BLOCK',
      sourceRefId: block.id,
      now,
    };
    if (wasApplied && kind === 'BLOCK_MAINTENANCE') {
      const opened = await this.cleaning.openOrder(
        tx,
        row,
        {
          typeCode: 'CLEAN_ROUTINE',
          triggerCode: 'CLN_TRG_MAINTENANCE_END',
          priorityCode: 'CLN_PRIO_ROUTINE',
          sourceRefId: block.id,
          note: 'Fin de mantenimiento: limpiar antes de volver a uso',
        },
        blockCtx,
        release,
      );
      result = opened.result;
      cleaningOrderId = opened.order.id;
    } else if (wasApplied) {
      result = await this.recorder.applyChange(tx, row, release, blockCtx);
    }
    await this.historyOf(tx, next, ctx.actorUserId, 'end');
    await this.events.publish(tx, {
      type: OPS_EVENTS.blockEnded,
      aggregateType: 'care_space_block',
      aggregateId: block.id,
      tenantId: block.tenantId,
      actorUserId: ctx.actorUserId,
      requestId: ctx.requestId,
      uniqueRef: String(next.rowVersion),
      payload: {
        blockId: block.id,
        careSpaceId: block.careSpaceId,
        siteId: row.practiceSiteId,
        kind,
        endedAt: now.toISOString(),
        note,
        cleaningOrderId,
        actingRoles: ctx.actingRoles ?? [],
      },
    });
    return { block: next, result, cleaningOrderId };
  }

  /** Cancela un bloqueo (programado o vigente) con motivo: no deja limpieza pendiente. */
  async cancel(
    tx: EntityManager,
    row: SpaceOpsRow,
    block: BlockRow,
    reason: string,
    ctx: OpsContext,
  ): Promise<EndedBlock> {
    const now = ctx.now ?? new Date();
    this.assertOpen(block);
    const next = await this.updateBlock(
      tx,
      block,
      { cancelledAt: now, cancelReason: reason },
      ctx.actorUserId,
      now,
    );
    const kind = BLOCK_KINDS.byConceptId(block.kindConceptId)!
      .code as BlockKindCode;
    const wasApplied =
      axisCodes({ operationalStatusConceptId: row.operationalStatusConceptId })
        .availability === KIND_TO_AVAILABILITY[kind] &&
      block.startsAt.getTime() <= now.getTime();
    let result: ApplyResult | null = null;
    if (wasApplied) {
      result = await this.recorder.applyChange(
        tx,
        row,
        {
          availability: {
            to: 'SPACE_OP_AVAILABLE',
            reasonConceptId: null,
            expectedUntil: null,
            reasonText: reason,
          },
        },
        { ...ctx, source: 'SRC_BLOCK', sourceRefId: block.id, now },
      );
    }
    await this.historyOf(tx, next, ctx.actorUserId, 'cancel');
    await this.events.publish(tx, {
      type: OPS_EVENTS.blockCancelled,
      aggregateType: 'care_space_block',
      aggregateId: block.id,
      tenantId: block.tenantId,
      actorUserId: ctx.actorUserId,
      requestId: ctx.requestId,
      uniqueRef: String(next.rowVersion),
      payload: {
        blockId: block.id,
        careSpaceId: block.careSpaceId,
        siteId: row.practiceSiteId,
        kind,
        cancelledAt: now.toISOString(),
        reason,
        actingRoles: ctx.actingRoles ?? [],
      },
    });
    return { block: next, result, cleaningOrderId: null };
  }

  /**
   * Compromisos futuros en la ventana de un bloqueo: casos quirúrgicos, citas y
   * reservas del espacio que se pisarían. Cada uno lleva su `nextAction`.
   *
   * @param tx - Transacción.
   * @param careSpaceId - Espacio.
   * @param from - Inicio de la ventana.
   * @param to - Fin estimado; `null` si es abierta.
   */
  async commitments(
    tx: EntityManager,
    careSpaceId: string,
    from: Date,
    to: Date | null,
  ): Promise<FutureCommitment[]> {
    const toClause = (column: string) => (to ? `and ${column} < ?` : '');
    const toParams = to ? [to] : [];
    const conflicts: FutureCommitment[] = [];

    const cases = await tx.execute<Record<string, unknown>[]>(
      `select pc.id, coalesce(pc.reserved_start_at, pc.scheduled_start_at) as starts_at
         from procedures_perioperative.procedure_cases pc
        where pc.operating_room_id = ?
          and pc.status_concept_id not in (?, ?)
          and coalesce(pc.reserved_end_at, pc.scheduled_end_at, pc.scheduled_start_at) > ?
          ${toClause('coalesce(pc.reserved_start_at, pc.scheduled_start_at)')}
        order by 2`,
      [
        careSpaceId,
        CONCEPTS.CASE_CANCELLED,
        CONCEPTS.CASE_COMPLETED,
        from,
        ...toParams,
      ],
    );
    for (const raw of cases) {
      conflicts.push({
        kind: 'PROCEDURE_CASE',
        id: str(raw.id),
        startsAt: new Date(str(raw.starts_at)).toISOString(),
        nextAction:
          'Reprogramar o cancelar el caso quirúrgico antes de bloquear el quirófano',
      });
    }

    const appointments = await tx.execute<Record<string, unknown>[]>(
      `select a.id, a.start_at from clinical.appointments a
        where a.care_space_id = ?
          and a.status_concept_id in (?, ?, ?)
          and a.end_at > ? ${toClause('a.start_at')}
        order by a.start_at`,
      [
        careSpaceId,
        CLIN.APPOINTMENT_PENDING,
        CLIN.APPOINTMENT_BOOKED,
        CLIN.APPOINTMENT_CHECKED_IN,
        from,
        ...toParams,
      ],
    );
    const appointmentIds = new Set<string>();
    for (const raw of appointments) {
      appointmentIds.add(str(raw.id));
      conflicts.push({
        kind: 'APPOINTMENT',
        id: str(raw.id),
        startsAt: new Date(str(raw.start_at)).toISOString(),
        nextAction: 'Reprogramar o cancelar la cita del espacio',
      });
    }

    const slots = await tx.execute<Record<string, unknown>[]>(
      `select s.appointment_id as id, s.start_at from scheduling.availability_slots s
        where s.care_space_id = ? and s.appointment_id is not null
          and s.end_at > ? ${toClause('s.start_at')}
        order by s.start_at`,
      [careSpaceId, from, ...toParams],
    );
    for (const raw of slots) {
      if (appointmentIds.has(str(raw.id))) continue;
      conflicts.push({
        kind: 'BOOKING',
        id: str(raw.id),
        startsAt: new Date(str(raw.start_at)).toISOString(),
        nextAction: 'Reprogramar o cancelar la reserva del espacio',
      });
    }
    return conflicts;
  }

  // --------------------------------------------------------------- auxiliares

  private assertOpen(block: BlockRow): void {
    if (block.endedAt || block.cancelledAt) {
      throw new ConflictException(
        'El bloqueo ya terminó o fue cancelado',
        {
          blockId: block.id,
          endedAt: isoOrNull(block.endedAt),
          cancelledAt: isoOrNull(block.cancelledAt),
        },
        OpsErrorReason.BLOCK_ALREADY_ENDED,
      );
    }
  }

  /** `UPDATE` nativo del bloqueo con compare-and-set sobre `row_version`. */
  private async updateBlock(
    tx: EntityManager,
    block: BlockRow,
    changes: Partial<
      Pick<
        BlockRow,
        'endedAt' | 'endedByUserId' | 'endNote' | 'cancelledAt' | 'cancelReason'
      >
    >,
    actorUserId: string | null,
    now: Date,
  ): Promise<BlockRow> {
    const nextVersion = block.rowVersion + 1;
    const affected = await tx.nativeUpdate(
      CareSpaceBlocks,
      { id: block.id, rowVersion: block.rowVersion },
      {
        ...changes,
        rowVersion: nextVersion,
        updatedAt: now,
        updatedByUserId: actorUserId ?? undefined,
      },
    );
    if (affected === 0) throw new RowVersionMismatchException();
    return { ...block, ...changes, rowVersion: nextVersion };
  }

  private async historyOf(
    tx: EntityManager,
    block: BlockRow,
    actorUserId: string | null,
    step: string,
    first = false,
  ): Promise<void> {
    await this.historyRepo.append(tx, 'care_space_blocks', block.id, {
      operationConceptId: first ? AUD.OPERATION_INSERT : AUD.OPERATION_UPDATE,
      dataSnapshot: { ...block, step },
      changedByUserId: actorUserId ?? undefined,
      tenantId: block.tenantId,
      firstRevision: first,
    });
  }
}
