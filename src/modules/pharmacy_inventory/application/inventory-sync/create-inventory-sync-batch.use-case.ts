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
import { PharmacyInventoryScopePolicy } from '../scope/pharmacy-inventory-scope.policy';

/** Ingiere un lote recibido con idempotencia por item. */
@Injectable()
export class CreateInventorySyncBatchUseCase {
  constructor(
    private readonly em: EntityManager,
    private readonly sync: SyncRepository,
    private readonly scope: PharmacyInventoryScopePolicy,
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
      // La conexión es de una farmacia del actor; los productos del lote, de esa
      // misma farmacia.
      const pharmacy = await this.scope.requireManagedConnection(
        tx,
        dto.pharmacyIntegrationConnectionId,
        actor,
      );
      for (const item of dto.items) {
        if (item.pharmacyProductId !== undefined) {
          await this.scope.requireProduct(tx, pharmacy, item.pharmacyProductId);
        }
      }

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
            // La clave no es de la farmacia: un ítem de otra no se devuelve.
            const existingBatch = await this.sync.findBatchById(
              tx,
              existing.pharmacyInventorySyncBatchId,
            );
            if (!existingBatch) throw this.scope.notAvailable();
            const owner = await this.scope.requireManagedConnection(
              tx,
              existingBatch.pharmacyIntegrationConnectionId,
              actor,
            );
            if (owner.pharmacyId !== pharmacy.pharmacyId) {
              throw this.scope.notAvailable();
            }
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
