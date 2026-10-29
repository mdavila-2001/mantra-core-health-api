import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { EntityManager } from '@mikro-orm/postgresql';
import { OpsContext } from './ops-recorder';
import { PRAC } from '../practice.concepts';
import { CareSpaceBlocksService } from './care-space-blocks.service';
import { OPS_EVENTS, OpsEventsService } from './ops-events';
import { BLOCK_COLUMNS, toBlockRow } from './ops-rows';
import { OpsStateService, isLifecycleActive } from './ops-state';
import { BLOCK_KINDS, BLOCK_REASONS } from '../ops-catalog';

/** Resultado de una pasada de `blocks-tick`. */
export interface BlocksTickResult {
  /** Bloqueos programados que llegaron a su hora y se aplicaron al espacio. */
  readonly applied: number;
  /** Bloqueos cuya hora llegó pero no se pudieron aplicar todavía (cama ocupada, espacio inactivo). */
  readonly deferred: number;
  /** Avisos `block_overdue` nuevos (la fecha estimada pasó y el bloqueo sigue abierto). */
  readonly overdue: number;
  /** Bloqueos que fallaron al aplicarse (se registran y la pasada sigue con los demás). */
  readonly failed: number;
}

/** Máximo de bloqueos que procesa una pasada de cada tipo. */
const BATCH_LIMIT = 200;

/**
 * Proceso periódico de los bloqueos (`POST /internal/practice/blocks-tick`, SYSTEM):
 *
 * 1. **Aplica** los bloqueos programados cuyo `starts_at` llegó. «Aplicado» no es una
 *    columna: se deriva del estado del espacio —un bloqueo que ya empezó, sigue
 *    abierto y cuyo espacio todavía figura como disponible, no está aplicado—.
 * 2. **Avisa** (`practice.care_space.block_overdue`) de los bloqueos abiertos cuya
 *    fecha estimada de fin ya pasó.
 *
 * Es idempotente: reaplicar no cambia nada y el aviso de vencido tiene una clave de
 * idempotencia por bloqueo y fecha estimada, así que no se repite.
 */
@Injectable()
export class CareSpaceBlocksTickService {
  /**
   * @param em - Contexto de persistencia.
   * @param state - Lectura del estado operativo.
   * @param blocks - Ciclo de vida de los bloqueos.
   * @param events - Outbox.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly state: OpsStateService,
    private readonly blocks: CareSpaceBlocksService,
    private readonly events: OpsEventsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CareSpaceBlocksTickService.name);
  }

  /**
   * Una pasada.
   *
   * @param now - Instante de la pasada (por omisión, ahora).
   */
  async run(now: Date = new Date()): Promise<BlocksTickResult> {
    let applied = 0;
    let deferred = 0;
    let overdue = 0;
    let failed = 0;

    const due = await this.em
      .fork()
      .execute<{ id: string; tenant_id: string; care_space_id: string }[]>(
        `select b.id, b.tenant_id, b.care_space_id
         from practice.care_space_blocks b
         join practice.care_spaces cs on cs.id = b.care_space_id
        where b.ended_at is null and b.cancelled_at is null and b.starts_at <= ?
          and (cs.operational_status_concept_id is null or cs.operational_status_concept_id = ?)
        order by b.starts_at limit ?`,
        [now, PRAC.SPACE_OP_AVAILABLE, BATCH_LIMIT],
      );
    for (const candidate of due) {
      // Un bloqueo que no se puede aplicar (dato inconsistente) no frena a los demás ni a
      // los de otros tenants: se registra con sus ids y la pasada sigue.
      const done = await this.applyOne(candidate, now).catch(
        (error: unknown) => {
          this.logger.error(
            {
              operation: 'practice.blocks_tick.apply',
              blockId: candidate.id,
              careSpaceId: candidate.care_space_id,
              errorName: error instanceof Error ? error.name : 'UnknownError',
            },
            'No se pudo aplicar el bloqueo programado',
          );
          return 'failed' as const;
        },
      );
      if (done === 'applied') applied += 1;
      else if (done === 'deferred') deferred += 1;
      else if (done === 'failed') failed += 1;
    }

    const late = await this.em.fork().execute<Record<string, unknown>[]>(
      `select ${BLOCK_COLUMNS} from practice.care_space_blocks b
        where b.ended_at is null and b.cancelled_at is null
          and b.starts_at <= ? and b.expected_end_at is not null and b.expected_end_at < ?
        order by b.expected_end_at limit ?`,
      [now, now, BATCH_LIMIT],
    );
    for (const raw of late) {
      const block = toBlockRow(raw);
      const published = await this.em.transactional(async (tx) =>
        this.events.publish(tx, {
          type: OPS_EVENTS.blockOverdue,
          aggregateType: 'care_space_block',
          aggregateId: block.id,
          tenantId: block.tenantId,
          actorUserId: null,
          uniqueRef: block.expectedEndAt!.toISOString(),
          payload: {
            blockId: block.id,
            careSpaceId: block.careSpaceId,
            kind: BLOCK_KINDS.byConceptId(block.kindConceptId)?.code ?? null,
            reasonCode:
              BLOCK_REASONS.byConceptId(block.reasonConceptId)?.code ?? null,
            startsAt: block.startsAt.toISOString(),
            expectedEndAt: block.expectedEndAt!.toISOString(),
            overdueMinutes: Math.floor(
              (now.getTime() - block.expectedEndAt!.getTime()) / 60_000,
            ),
          },
        }),
      );
      if (published) overdue += 1;
    }
    return { applied, deferred, overdue, failed };
  }

  /** Aplica un bloqueo programado en su propia transacción. */
  private async applyOne(
    candidate: { id: string; tenant_id: string; care_space_id: string },
    now: Date,
  ): Promise<'applied' | 'deferred' | 'skip'> {
    return this.em.transactional(async (tx) => {
      const row = await this.state.loadSpace(
        tx,
        String(candidate.tenant_id),
        String(candidate.care_space_id),
        true,
      );
      const rows = await tx.execute<Record<string, unknown>[]>(
        `select ${BLOCK_COLUMNS} from practice.care_space_blocks b where b.id = ? for update`,
        [candidate.id],
      );
      if (!rows.length) return 'skip' as const;
      const block = toBlockRow(rows[0]);
      // Otro proceso ya lo aplicó, lo terminó o lo canceló.
      if (block.endedAt || block.cancelledAt) return 'skip' as const;
      const current = await this.state.stateOf(tx, row, now);
      if (current.availability !== 'SPACE_OP_AVAILABLE') return 'skip' as const;
      if (!isLifecycleActive(row, now) || current.occupancy !== 'OCC_FREE')
        return 'deferred' as const;
      const ctx: OpsContext = {
        tenantId: block.tenantId,
        actorUserId: null,
        source: 'SRC_SYSTEM',
        action: 'BLOCK_TICK_APPLIED',
        now,
      };
      await this.blocks.applyToSpace(tx, row, block, ctx, now);
      await tx.flush();
      return 'applied' as const;
    });
  }
}
