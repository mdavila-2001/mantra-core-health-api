import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PharmacyInventorySyncBatches,
  PharmacyInventorySyncItems,
} from '../entities';
import { createdBy } from '../../../common';

/** Datos de cabecera de un lote de sincronización ERP. */
export interface CreateSyncBatchData {
  /**
   * Identificador asociado a pharmacy integration connection.
   */
  pharmacyIntegrationConnectionId: string;
  /**
   * Identificador asociado a direction concept.
   */
  directionConceptId: string;
  /**
   * Valor de source batch identifier mantenido por la instancia.
   */
  sourceBatchIdentifier: string;
  /**
   * Valor de sync cursor before mantenido por la instancia.
   */
  syncCursorBefore?: string;
  /**
   * Valor de received at mantenido por la instancia.
   */
  receivedAt?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos de un item de sincronización. */
export interface CreateSyncItemData {
  /**
   * Identificador asociado a pharmacy inventory sync batch.
   */
  pharmacyInventorySyncBatchId: string;
  /**
   * Identificador asociado a pharmacy product.
   */
  pharmacyProductId?: string;
  /**
   * Valor de external product code mantenido por la instancia.
   */
  externalProductCode?: string;
  /**
   * Valor de external location code mantenido por la instancia.
   */
  externalLocationCode?: string;
  /**
   * Valor de external lot number mantenido por la instancia.
   */
  externalLotNumber?: string;
  /**
   * Valor de external quantity mantenido por la instancia.
   */
  externalQuantity?: string;
  /**
   * Identificador asociado a reconciliation status concept.
   */
  reconciliationStatusConceptId: string;
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  idempotencyKey?: string;
}

/** Acceso a datos de los lotes de sincronización ERP y sus items. */
@Injectable()
export class SyncRepository {
  /**
   * Obtiene find batch by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find batch by id conforme al contrato `Promise<PharmacyInventorySyncBatches | null>`.
   */
  findBatchById(
    em: EntityManager,
    id: string,
  ): Promise<PharmacyInventorySyncBatches | null> {
    return em.findOne(PharmacyInventorySyncBatches, { id });
  }

  /**
   * Obtiene find items.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param batchId - Identificador de batch.
   * @returns Resultado de find items conforme al contrato `Promise<PharmacyInventorySyncItems[]>`.
   */
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

  /**
   * Crea create batch.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create batch conforme al contrato `PharmacyInventorySyncBatches`.
   */
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

  /**
   * Crea create item.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create item conforme al contrato `PharmacyInventorySyncItems`.
   */
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
