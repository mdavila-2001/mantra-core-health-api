import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { OutboxService } from '../../../../messaging/services/outbox.service';
import { CareSpaces, PracticeSites } from '../../../entities';
import { CareSpaceOpsRepository } from '../../../repositories';
import type { BlocksTickResultDto } from '../../../dto';
import {
  BLOCK_KIND,
  BLOCK_REASONS,
  codeFor,
  type BlockKindCode,
} from '../../../domain/ops/ops-catalog';
import { CareSpaceOpsCore } from '../care-space-ops-core';
import { OPS_EVENTS, publishOpsEvent } from '../ops-events';
import { guardInfraWrite } from '../ops-errors';
import { ChangeAvailabilityUseCase } from './change-availability.use-case';

const REASON_CODE_BY_ID = new Map(
  Object.entries(BLOCK_REASONS).map(([c, r]) => [r.id, c]),
);

/**
 * `POST /internal/practice/blocks-tick` (SYSTEM, §F2.3): aplica los bloqueos
 * programados cuyo `starts_at` llegó y avisa `block_overdue` de los que
 * pasaron su fecha estimada sin terminar. Idempotente: un bloqueo ya aplicado
 * (`availability_changed_at >= starts_at`) no se vuelve a aplicar, y el aviso
 * de vencido tiene payload fijo (el outbox lo deduplica).
 */
@Injectable()
export class RunBlocksTickUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly opsRepo: CareSpaceOpsRepository,
    private readonly core: CareSpaceOpsCore,
    private readonly availability: ChangeAvailabilityUseCase,
    private readonly outbox: OutboxService,
  ) {}

  /** Corre el tick. */
  execute(): Promise<BlocksTickResultDto> {
    return this.em.transactional(async (tx) => {
      // Proceso del sistema: con RLS forzado necesita ver todos los tenants.
      await tx.execute("select set_config('app.system_context', 'true', true)");
      const { starting, overdue } = await this.opsRepo.dueBlocks(tx);
      let applied = 0;
      for (const block of starting) {
        await this.core.lock(tx, [block.careSpaceId]);
        const space = await tx.findOne(CareSpaces, { id: block.careSpaceId });
        if (!space) continue;
        if (
          space.availabilityChangedAt &&
          space.availabilityChangedAt >= block.startsAt
        )
          continue;
        const site = await tx.findOne(PracticeSites, {
          id: space.practiceSiteId,
        });
        if (!site) continue;
        await this.availability.applyStarted(
          tx,
          block,
          space,
          site.practiceId,
          codeFor(BLOCK_KIND, block.kindConceptId) as BlockKindCode,
          REASON_CODE_BY_ID.get(block.reasonConceptId) ?? 'BLOCK_RSN_OTHER',
          {},
        );
        applied += 1;
      }
      for (const block of overdue) {
        await guardInfraWrite(() =>
          publishOpsEvent(this.outbox, tx, OPS_EVENTS.blockOverdue, {
            tenantId: block.tenantId,
            aggregateId: block.id,
            payload: {
              blockId: block.id,
              careSpaceId: block.careSpaceId,
              expectedEndAt: block.expectedEndAt?.toISOString() ?? null,
            },
          }),
        );
      }
      return { applied, overdue: overdue.length };
    });
  }
}
