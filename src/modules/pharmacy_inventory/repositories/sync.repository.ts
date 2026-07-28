import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PharmacyInventorySyncBatches,
  PharmacyInventorySyncItems,
} from '../entities';
import { createdBy } from '../../../common';

/** Datos de cabecera de un lote de sincronización ERP. */
export interface CreateSyncBatchData {
  pharmacyIntegrationConnectionId: string;
  directionConceptId: string;
  sourceBatchIdentifier: string;
  syncCursorBefore?: string;
  receivedAt?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/** Datos de un item de sincronización. */
export interface CreateSyncItemData {
  pharmacyInventorySyncBatchId: string;
  pharmacyProductId?: string;
  externalProductCode?: string;
  externalLocationCode?: string;
  externalLotNumber?: string;
  externalQuantity?: string;
  reconciliationStatusConceptId: string;
  idempotencyKey?: string;
}

/** Acceso a datos de los lotes de sincronización ERP y sus items. */
@Injectable()
export class SyncRepository {
  findBatchById(
    em: EntityManager,
    id: string,
  ): Promise<PharmacyInventorySyncBatches | null> {
    return em.findOne(PharmacyInventorySyncBatches, { id });
  }

  findItems(
    em: EntityManager,
    batchId: string,
  ): Promise<PharmacyInventorySyncItems[]> {
    return em.find(PharmacyInventorySyncItems, {
      pharmacyInventorySyncBatchId: batchId,
    });
  }

  /** Item de sync previo con la misma clave de idempotencia (dedupe en retry). */
  findItemByIdempotencyKey(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<PharmacyInventorySyncItems | null> {
    return em.findOne(PharmacyInventorySyncItems, { idempotencyKey });
  }

  createBatch(
    em: EntityManager,
    data: CreateSyncBatchData,
  ): PharmacyInventorySyncBatches {
    return em.create(
      PharmacyInventorySyncBatches,
      {
        pharmacyIntegrationConnectionId: data.pharmacyIntegrationConnectionId,
        directionConceptId: data.directionConceptId,
        sourceBatchIdentifier: data.sourceBatchIdentifier,
        syncCursorBefore: data.syncCursorBefore,
        receivedAt: data.receivedAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createItem(
    em: EntityManager,
    data: CreateSyncItemData,
  ): PharmacyInventorySyncItems {
    return em.create(
      PharmacyInventorySyncItems,
      {
        pharmacyInventorySyncBatchId: data.pharmacyInventorySyncBatchId,
        pharmacyProductId: data.pharmacyProductId,
        externalProductCode: data.externalProductCode,
        externalLocationCode: data.externalLocationCode,
        externalLotNumber: data.externalLotNumber,
        externalQuantity: data.externalQuantity,
        reconciliationStatusConceptId: data.reconciliationStatusConceptId,
        idempotencyKey: data.idempotencyKey,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
