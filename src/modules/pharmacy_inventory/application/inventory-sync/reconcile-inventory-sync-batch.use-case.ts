import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import { SyncRepository } from '../../infrastructure/repositories';
import type { ReconcileResponseDto } from '../../presentation/dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';
import { reconcileSyncItem } from '../../domain/sync/reconciliation';

/** Reconcilia y cierra un lote recibido, sin modificar el stock directamente. */
@Injectable()
export class ReconcileInventorySyncBatchUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly sync: SyncRepository,
    private readonly logger: PinoLogger,
  ) {}

  execute(
    batchId: string,
    actor: AuthenticatedUser,
  ): Promise<ReconcileResponseDto> {
    this.logger.info(
      { operation: 'pharmacy_inventory.sync.reconcile', batchId },
      'Reconciling sync batch',
    );
    return this.em.transactional(async (tx) => {
      const batch = await this.sync.findBatchById(tx, batchId);
      if (!batch) {
        throw new ResourceNotFoundException(
          'Lote de sincronización no encontrado',
          { batchId },
        );
      }
      if (batch.statusConceptId !== PINV.BATCH_RECEIVED) {
        throw new PreconditionFailedException(
          'El lote no está en estado reconciliable',
          { batchId },
        );
      }

      const items = await this.sync.findItems(tx, batchId);
      let discrepancies = 0;
      for (const item of items) {
        const result = reconcileSyncItem(
          item.pharmacyProductId,
          item.externalQuantity,
        );
        item.reconciliationStatusConceptId = result.statusConceptId;
        if (result.normalizedQuantity !== undefined) {
          item.normalizedQuantity = result.normalizedQuantity;
        }
        if (result.errorCode !== undefined) {
          item.errorCode = result.errorCode;
          item.errorDetail = result.errorDetail;
          discrepancies += 1;
        }
      }

      batch.statusConceptId = PINV.BATCH_COMPLETED;
      batch.completedAt = new Date();
      batch.itemCount = items.length;
      touch(batch, actor.id);
      await tx.flush();
      return { batchId: batch.id, itemsProcessed: items.length, discrepancies };
    });
  }
}
