import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../../../common';
import { AUD } from '../../../../audit/audit.concepts';
import { OutboxService } from '../../../../messaging/services/outbox.service';
import { CareSpaceBlocks, type CareSpaces } from '../../../entities';
import type { CareSpaceBlockDto } from '../../../dto';
import {
  BLOCK_KIND,
  codeFor,
  type BlockKindCode,
} from '../../../domain/ops/ops-catalog';
import { InfrastructureAccessService } from '../../infrastructure-access.service';
import { CareSpaceOpsCore } from '../care-space-ops-core';
import { OpsCellBuilder } from '../ops-cell-builder';
import { OPS_EVENTS, publishOpsEvent } from '../ops-events';
import { flushInfra, guardInfraWrite, opsError } from '../ops-errors';
import {
  ChangeAvailabilityUseCase,
  type OpsRequest,
} from './change-availability.use-case';

/** Acción que exige terminar o cancelar un bloqueo de cada tipo. */
const ACTION_FOR_KIND: Record<BlockKindCode, string> = {
  BLOCK_CLINICAL: 'f2.availability.clinical',
  BLOCK_ADMIN: 'f2.availability.admin',
  BLOCK_CLOSURE: 'f2.availability.admin',
  BLOCK_MAINTENANCE: 'f2.availability.maintenance',
};

/** Carga un bloqueo del tenant y comprueba el permiso de su tipo. */
async function loadBlock(
  tx: EntityManager,
  access: InfrastructureAccessService,
  blockId: string,
  req: OpsRequest,
): Promise<{
  block: CareSpaceBlocks;
  space: CareSpaces;
  practiceId: string;
  kind: BlockKindCode;
}> {
  const block = await tx.findOne(CareSpaceBlocks, { id: blockId });
  if (!block || block.tenantId !== req.tenantId) {
    throw new ResourceNotFoundException('Bloqueo no encontrado', { blockId });
  }
  const kind =
    (codeFor(BLOCK_KIND, block.kindConceptId) as BlockKindCode) ??
    'BLOCK_CLINICAL';
  const { target } = await access.assertCan(
    req.actor,
    ACTION_FOR_KIND[kind],
    { careSpaceId: block.careSpaceId },
    tx,
    req.tenantId,
  );
  if (block.endedAt || block.cancelledAt) throw opsError('BLOCK_ALREADY_ENDED');
  return {
    block,
    space: target.space as CareSpaces,
    practiceId: target.site.practiceId,
    kind,
  };
}

/**
 * `POST /care-space-blocks/:id/end` (§F2.3). El fin de un mantenimiento abre
 * una orden `CLN_TRG_MAINTENANCE_END` (regla B.5-25: limpiar antes de volver a
 * uso).
 */
@Injectable()
export class EndBlockUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly core: CareSpaceOpsCore,
    private readonly availability: ChangeAvailabilityUseCase,
    private readonly cells: OpsCellBuilder,
  ) {}

  /**
   * @param blockId - Bloqueo.
   * @param note - Nota de cierre.
   * @param req - Actor, tenant y requestId.
   */
  execute(
    blockId: string,
    note: string | undefined,
    req: OpsRequest,
  ): Promise<{ block: CareSpaceBlockDto; cleaningOrderId: string | null }> {
    return this.em.transactional(async (tx) => {
      const { block, space, practiceId, kind } = await loadBlock(
        tx,
        this.access,
        blockId,
        req,
      );
      await this.core.lock(tx, [space.id]);
      await this.availability.endBlock(tx, block, space, new Date(), req, note);
      await this.availability.reapply(tx, space, practiceId, {
        actor: req.actor,
        requestId: req.requestId,
        source: 'BLOCK',
        sourceRefId: block.id,
      });
      let cleaningOrderId: string | null = null;
      if (kind === 'BLOCK_MAINTENANCE') {
        const { order } = await this.core.openCleaningOrder(
          tx,
          space,
          practiceId,
          {
            type: space.terminalCleaningRequired
              ? 'CLEAN_TERMINAL'
              : 'CLEAN_ROUTINE',
            trigger: 'CLN_TRG_MAINTENANCE_END',
            sourceRefId: block.id,
          },
          {
            actor: req.actor,
            requestId: req.requestId,
            source: 'BLOCK',
            sourceRefId: block.id,
          },
          { reuseOpen: true },
        );
        cleaningOrderId = order.id;
      }
      return { block: this.cells.block(block), cleaningOrderId };
    });
  }
}

/** `POST /care-space-blocks/:id/cancel` (§F2.3): un bloqueo que no debió existir. */
@Injectable()
export class CancelBlockUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly core: CareSpaceOpsCore,
    private readonly availability: ChangeAvailabilityUseCase,
    private readonly cells: OpsCellBuilder,
    private readonly outbox: OutboxService,
  ) {}

  /**
   * @param blockId - Bloqueo.
   * @param reason - Motivo.
   * @param req - Actor, tenant y requestId.
   */
  execute(
    blockId: string,
    reason: string,
    req: OpsRequest,
  ): Promise<CareSpaceBlockDto> {
    return this.em.transactional(async (tx) => {
      const { block, space, practiceId } = await loadBlock(
        tx,
        this.access,
        blockId,
        req,
      );
      await this.core.lock(tx, [space.id]);
      const now = new Date();
      block.cancelledAt = now;
      block.cancelReason = reason;
      block.updatedAt = now;
      block.updatedByUserId = req.actor.id;
      await flushInfra(tx);
      await this.core.appendHistory(
        tx,
        'block',
        block,
        AUD.OPERATION_UPDATE,
        req.actor.id,
      );
      await guardInfraWrite(() =>
        publishOpsEvent(this.outbox, tx, OPS_EVENTS.blockCancelled, {
          tenantId: space.tenantId,
          aggregateId: block.id,
          actorUserId: req.actor.id,
          payload: {
            blockId: block.id,
            careSpaceId: space.id,
            siteId: space.practiceSiteId,
            cancelledAt: now.toISOString(),
            requestId: req.requestId ?? null,
          },
        }),
      );
      await this.availability.reapply(tx, space, practiceId, {
        actor: req.actor,
        requestId: req.requestId,
        source: 'BLOCK',
        sourceRefId: block.id,
      });
      return this.cells.block(block);
    });
  }
}
