import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import type { AuthenticatedUser } from '../../../../common';
import { SyncRepository } from '../../infrastructure/repositories';
import type {
  CreateSyncBatchDto,
  SyncBatchResponseDto,
} from '../../presentation/dto';
import { PINV } from '../../domain/pharmacy_inventory.concepts';

/** Ingiere un lote recibido con idempotencia por item. */
@Injectable()
export class CreateInventorySyncBatchUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly sync: SyncRepository,
    private readonly logger: PinoLogger,
  ) {}

  execute(
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
      const batch = this.sync.createBatch(tx, {
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
        if (item.idempotencyKey) {
          const existing = await this.sync.findItemByIdempotencyKey(
            tx,
            item.idempotencyKey,
          );
          if (existing) {
            itemIds.push(existing.id);
            continue;
          }
        }

        const created = this.sync.createItem(tx, {
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
}
