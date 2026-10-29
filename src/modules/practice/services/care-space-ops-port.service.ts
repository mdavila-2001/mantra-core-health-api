import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException, requireTenantId } from '../../../common';
import {
  CLEANING_PRIORITIES,
  CLEANING_TRIGGERS,
  OCCUPANCY,
  axisCodes,
} from '../ops-catalog';
import { OpsErrorReason } from '../practice-ops.error-reasons';
import {
  opsActorUserId,
  type BookingWindow,
  type CareSpaceOperationalState,
  type CareSpaceOpsPort,
  type MarkDirtyInput,
  type OccupancyChangeInput,
  type RevertDirtyInput,
} from './care-space-ops.port';
import { CleaningOrdersService } from './cleaning-orders.service';
import { OpsRecorder, type OpsContext } from './ops-recorder';
import { BLOCK_COLUMNS, toBlockRow } from './ops-rows';
import { OpsStateService, isLifecycleActive } from './ops-state';
import { BLOCK_KINDS } from '../ops-catalog';

/** Tipo de limpieza que corresponde a cada disparador. */
const TYPE_BY_TRIGGER: Readonly<Record<string, string>> = {
  CLN_TRG_DISCHARGE: 'CLEAN_DISCHARGE',
  CLN_TRG_TRANSFER: 'CLEAN_DISCHARGE',
  CLN_TRG_MANUAL: 'CLEAN_ROUTINE',
  CLN_TRG_ISOLATION_END: 'CLEAN_TERMINAL',
  CLN_TRG_CONTAMINATION: 'CLEAN_TERMINAL',
  CLN_TRG_MAINTENANCE_END: 'CLEAN_ROUTINE',
  CLN_TRG_OR_TURNOVER: 'CLEAN_OR_TURNOVER',
  CLN_TRG_INSPECTION_FAILED: 'CLEAN_ROUTINE',
};

/**
 * Implementación del puerto {@link CareSpaceOpsPort} que F3 (ADT) y F4 (quirófano)
 * llaman dentro de su transacción. No autoriza —quien llama ya autorizó su operación—
 * pero exige que el espacio sea del tenant del contexto.
 */
@Injectable()
export class CareSpaceOpsPortService implements CareSpaceOpsPort {
  /**
   * @param state - Lectura del estado operativo.
   * @param recorder - Escritura de ejes y eventos A20.
   * @param cleaning - Órdenes de limpieza.
   */
  constructor(
    private readonly state: OpsStateService,
    private readonly recorder: OpsRecorder,
    private readonly cleaning: CleaningOrdersService,
  ) {}

  async getOperationalState(
    tx: EntityManager,
    careSpaceId: string,
  ): Promise<CareSpaceOperationalState> {
    const row = await this.state.loadSpace(tx, requireTenantId(), careSpaceId);
    return this.state.stateOf(tx, row);
  }

  async markDirtyFromSource(
    tx: EntityManager,
    careSpaceId: string,
    input: MarkDirtyInput,
  ): Promise<{ cleaningOrderId: string }> {
    const tenantId = requireTenantId();
    const trigger = CLEANING_TRIGGERS.byInput(input.trigger);
    if (!trigger) this.invalid('trigger', input.trigger);
    const priority = CLEANING_PRIORITIES.byInput(input.priority ?? 'ROUTINE');
    if (!priority) this.invalid('priority', input.priority);
    const row = await this.state.loadSpace(tx, tenantId, careSpaceId, true);
    const ctx: OpsContext = {
      tenantId,
      actorUserId: opsActorUserId(input.actor),
      requestId: input.requestId,
      source:
        trigger.code === 'CLN_TRG_OR_TURNOVER' ? 'SRC_ROOM_EVENT' : 'SRC_ADT',
      sourceRefId: input.sourceRefId,
      action: 'MARK_DIRTY_FROM_SOURCE',
    };
    const opened = await this.cleaning.openOrder(
      tx,
      row,
      {
        typeCode: TYPE_BY_TRIGGER[trigger.code] ?? 'CLEAN_ROUTINE',
        triggerCode: trigger.code,
        priorityCode: priority.code,
        sourceRefId: input.sourceRefId,
        terminal: input.terminal,
      },
      ctx,
    );
    return { cleaningOrderId: opened.order.id };
  }

  async revertDirtyFromSource(
    tx: EntityManager,
    careSpaceId: string,
    input: RevertDirtyInput,
  ): Promise<{ reverted: boolean }> {
    const tenantId = requireTenantId();
    const row = await this.state.loadSpace(tx, tenantId, careSpaceId, true);
    return this.cleaning.revertBySource(tx, row, input.sourceRefId, {
      tenantId,
      actorUserId: opsActorUserId(input.actor),
      requestId: input.requestId,
      source: 'SRC_ADT',
      sourceRefId: input.sourceRefId,
      action: 'REVERT_DIRTY_FROM_SOURCE',
    });
  }

  async recordOccupancyChange(
    tx: EntityManager,
    careSpaceId: string,
    input: OccupancyChangeInput,
  ): Promise<void> {
    const tenantId = requireTenantId();
    const from = OCCUPANCY.byInput(input.from);
    const to = OCCUPANCY.byInput(input.to);
    if (!from) this.invalid('from', input.from);
    if (!to) this.invalid('to', input.to);
    const row = await this.state.loadSpace(tx, tenantId, careSpaceId, true);
    await this.recorder.recordOccupancy(
      tx,
      row,
      from.code as 'OCC_FREE',
      to.code as 'OCC_FREE',
      {
        tenantId,
        actorUserId: opsActorUserId(input.actor),
        requestId: input.requestId,
        source: 'SRC_ADT',
        sourceRefId: input.sourceRefId,
        action: 'OCCUPANCY_CHANGED',
      },
    );
  }

  async assertBookable(
    tx: EntityManager,
    careSpaceId: string,
    window: BookingWindow,
  ): Promise<void> {
    const tenantId = requireTenantId();
    const row = await this.state.loadSpace(tx, tenantId, careSpaceId);
    const now = new Date();
    const notBookable = (
      reason: string,
      details: Record<string, unknown>,
    ): never => {
      throw new PreconditionFailedException(
        'El espacio no se puede reservar en esa ventana',
        {
          careSpaceId,
          reason,
          start: window.start.toISOString(),
          end: window.end.toISOString(),
          ...details,
        },
        OpsErrorReason.SPACE_NOT_BOOKABLE,
      );
    };
    if (
      !isLifecycleActive(
        row,
        window.start.getTime() < now.getTime() ? now : window.start,
      )
    ) {
      notBookable('LIFECYCLE', {
        lifecycleStatusConceptId: row.statusConceptId,
      });
    }
    // Un bloqueo abierto termina en su fecha estimada para ventanas futuras; si esa fecha
    // ya pasó (vencido) o no tiene, sigue bloqueando hasta que alguien lo cierre.
    const blocks = await tx.execute<Record<string, unknown>[]>(
      `select ${BLOCK_COLUMNS} from practice.care_space_blocks b
        where b.care_space_id = ? and b.tenant_id = ? and b.cancelled_at is null
          and b.starts_at < ?
          and (
            coalesce(b.ended_at, case when b.expected_end_at > ? then b.expected_end_at end) is null
            or coalesce(b.ended_at, case when b.expected_end_at > ? then b.expected_end_at end) > ?
          )
        order by b.starts_at limit 1`,
      [careSpaceId, tenantId, window.end, now, now, window.start],
    );
    if (blocks.length) {
      const block = toBlockRow(blocks[0]);
      notBookable('BLOCK', {
        blockId: block.id,
        blockKind: BLOCK_KINDS.byConceptId(block.kindConceptId)?.code,
        blockStartsAt: block.startsAt.toISOString(),
        blockExpectedEndAt: block.expectedEndAt?.toISOString() ?? null,
      });
    }
    // Un espacio cerrado o bloqueado antes del modelo no tiene fila de bloqueo.
    const availability = axisCodes({
      operationalStatusConceptId: row.operationalStatusConceptId,
    }).availability;
    if (
      availability !== 'SPACE_OP_AVAILABLE' &&
      window.start.getTime() <= now.getTime()
    ) {
      notBookable('AVAILABILITY', { availability });
    }
  }

  private invalid(field: string, value: unknown): never {
    throw new PreconditionFailedException(
      `Valor inválido en ${field}`,
      { field, value },
      OpsErrorReason.OPS_CODE_INVALID,
    );
  }
}
