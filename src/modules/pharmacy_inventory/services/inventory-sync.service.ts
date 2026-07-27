import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ResourceNotFoundException,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { SyncRepository } from '../repositories';
import {
  CreateSyncBatchDto,
  SyncBatchResponseDto,
  ReconcileResponseDto,
} from '../dto';
import { PINV } from '../pharmacy_inventory.concepts';

/**
 * Sincronización con ERP externo. La sync NUNCA sobrescribe stock directamente:
 * ingesta un lote (bootstrap) y luego lo reconcilia (UC-25-12), marcando cada
 * item como MATCHED o DISCREPANCY para resolución gobernada.
 */
@Injectable()
export class InventorySyncService {
  constructor(
    private readonly em: EntityManager,
    private readonly syncRepo: SyncRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InventorySyncService.name);
  }

  /** Bootstrap: ingresa un lote de sincronización en estado RECEIVED con items. */
  async createBatch(
    dto: CreateSyncBatchDto,
    actor: AuthenticatedUser,
  ): Promise<SyncBatchResponseDto> {
    this.logger.info(
      {
        operation: 'pharmacy_inventory.sync.create_batch',
        items: dto.items.length,
      },
      'Ingesting sync batch',
    );
    return this.em.transactional(async (tx) => {
      const batch = this.syncRepo.createBatch(tx, {
        pharmacyIntegrationConnectionId: dto.pharmacyIntegrationConnectionId,
        directionConceptId: PINV.SYNC_DIRECTION_INBOUND,
        sourceBatchIdentifier: dto.sourceBatchIdentifier,
        receivedAt: new Date(),
        statusConceptId: PINV.BATCH_RECEIVED,
        actorUserId: actor.id,
      });
      await tx.flush();

      const itemIds: string[] = [];
      for (const item of dto.items) {
        const created = this.syncRepo.createItem(tx, {
          pharmacyInventorySyncBatchId: batch.id,
          pharmacyProductId: item.pharmacyProductId,
          externalProductCode: item.externalProductCode,
          externalLocationCode: item.externalLocationCode,
          externalLotNumber: item.externalLotNumber,
          externalQuantity:
            item.externalQuantity != null
              ? String(item.externalQuantity)
              : undefined,
          reconciliationStatusConceptId: PINV.SYNC_ITEM_PENDING,
          idempotencyKey: item.idempotencyKey,
        });
        itemIds.push(created.id);
      }
      await tx.flush();

      return { id: batch.id, itemIds };
    });
  }

  /** UC-25-12: reconcilia un lote RECEIVED; clasifica items y cierra el lote. */
  async reconcile(
    batchId: string,
    actor: AuthenticatedUser,
  ): Promise<ReconcileResponseDto> {
    this.logger.info(
      { operation: 'pharmacy_inventory.sync.reconcile', batchId },
      'Reconciling sync batch',
    );
    return this.em.transactional(async (tx) => {
      const batch = await this.syncRepo.findBatchById(tx, batchId);
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

      const items = await this.syncRepo.findItems(tx, batchId);
      let discrepancies = 0;
      for (const item of items) {
        // Un item con producto mapeado se considera MATCHED; sin mapeo, DISCREPANCY.
        if (item.pharmacyProductId) {
          item.reconciliationStatusConceptId = PINV.SYNC_ITEM_MATCHED;
          item.normalizedQuantity = item.externalQuantity ?? '0';
        } else {
          item.reconciliationStatusConceptId = PINV.SYNC_ITEM_DISCREPANCY;
          item.errorCode = 'UNMAPPED_PRODUCT';
          item.errorDetail =
            'No se encontró un producto para el código externo';
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
