import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  HealthSourceConnections,
  HealthIngestionBatches,
  HealthIngestionRecords,
} from '../entities';

/**
 * Describe el contrato estructural de create batch data.
 */
export interface CreateBatchData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a health source connection.
   */
  healthSourceConnectionId: string;
  /**
   * Valor de batch identifier mantenido por la instancia.
   */
  batchIdentifier: string;
  /**
   * Identificador asociado a ingestion mode concept.
   */
  ingestionModeConceptId: string;
  /**
   * Valor de source period start mantenido por la instancia.
   */
  sourcePeriodStart?: Date;
  /**
   * Valor de source period end mantenido por la instancia.
   */
  sourcePeriodEnd?: Date;
  /**
   * Identificador asociado a payload manifest file.
   */
  payloadManifestFileId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
}

/**
 * Describe el contrato estructural de create record data.
 */
export interface CreateRecordData {
  /**
   * Identificador asociado a health ingestion batch.
   */
  healthIngestionBatchId: string;
  /**
   * Valor de source record identifier mantenido por la instancia.
   */
  sourceRecordIdentifier: string;
  /**
   * Identificador asociado a resource type concept.
   */
  resourceTypeConceptId: string;
  /**
   * Valor de source version mantenido por la instancia.
   */
  sourceVersion?: string;
  /**
   * Valor de source last updated at mantenido por la instancia.
   */
  sourceLastUpdatedAt?: Date;
  /**
   * Valor de payload hash mantenido por la instancia.
   */
  payloadHash: string;
  /**
   * Identificador asociado a payload file.
   */
  payloadFileId?: string;
  /**
   * Identificador asociado a validation status concept.
   */
  validationStatusConceptId: string;
  /**
   * Identificador asociado a processing status concept.
   */
  processingStatusConceptId: string;
}

/**
 * Acceso a la ingesta de `health_data.*`: conexiones de origen, lotes y
 * registros crudos.
 */
@Injectable()
export class HealthIngestionRepository {
  // --- Conexión de origen (UC-52-01) ---

  /**
   * Conexión bloqueada: abrir un lote sella su `last_success_at`, y dos
   * aperturas simultáneas dejarían la marca de la que perdiera.
   */
  findConnectionForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<HealthSourceConnections | null> {
    return em.findOne(
      HealthSourceConnections,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Lotes (UC-52-01, 02) ---

  /**
   * Crea create batch.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create batch conforme al contrato `HealthIngestionBatches`.
   */
  createBatch(
    em: EntityManager,
    data: CreateBatchData,
  ): HealthIngestionBatches {
    return em.create(
      HealthIngestionBatches,
      {
        tenantId: data.tenantId,
        healthSourceConnectionId: data.healthSourceConnectionId,
        batchIdentifier: data.batchIdentifier,
        ingestionModeConceptId: data.ingestionModeConceptId,
        receivedAt: new Date(),
        sourcePeriodStart: data.sourcePeriodStart,
        sourcePeriodEnd: data.sourcePeriodEnd,
        payloadManifestFileId: data.payloadManifestFileId,
        statusConceptId: data.statusConceptId,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find batch by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find batch by id conforme al contrato `Promise<HealthIngestionBatches | null>`.
   */
  findBatchById(
    em: EntityManager,
    id: string,
  ): Promise<HealthIngestionBatches | null> {
    return em.findOne(HealthIngestionBatches, { id });
  }

  /**
   * Obtiene find batch for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find batch for update conforme al contrato `Promise<HealthIngestionBatches | null>`.
   */
  findBatchForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<HealthIngestionBatches | null> {
    return em.findOne(
      HealthIngestionBatches,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Un lote no se reabre: el mismo identificador en la misma conexión es el mismo lote. */
  findBatchByIdentifier(
    em: EntityManager,
    healthSourceConnectionId: string,
    batchIdentifier: string,
  ): Promise<HealthIngestionBatches | null> {
    return em.findOne(HealthIngestionBatches, {
      healthSourceConnectionId,
      batchIdentifier,
    });
  }

  // --- Registros (UC-52-02, 03) ---

  /**
   * Crea create record.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create record conforme al contrato `HealthIngestionRecords`.
   */
  createRecord(
    em: EntityManager,
    data: CreateRecordData,
  ): HealthIngestionRecords {
    return em.create(
      HealthIngestionRecords,
      {
        healthIngestionBatchId: data.healthIngestionBatchId,
        sourceRecordIdentifier: data.sourceRecordIdentifier,
        resourceTypeConceptId: data.resourceTypeConceptId,
        sourceVersion: data.sourceVersion,
        sourceLastUpdatedAt: data.sourceLastUpdatedAt,
        payloadHash: data.payloadHash,
        payloadFileId: data.payloadFileId,
        validationStatusConceptId: data.validationStatusConceptId,
        processingStatusConceptId: data.processingStatusConceptId,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find record by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find record by id conforme al contrato `Promise<HealthIngestionRecords | null>`.
   */
  findRecordById(
    em: EntityManager,
    id: string,
  ): Promise<HealthIngestionRecords | null> {
    return em.findOne(HealthIngestionRecords, { id });
  }

  /**
   * Obtiene find record for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find record for update conforme al contrato `Promise<HealthIngestionRecords | null>`.
   */
  findRecordForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<HealthIngestionRecords | null> {
    return em.findOne(
      HealthIngestionRecords,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Deduplica el reintento del worker: mismo lote, mismo registro y misma versión. */
  findRecordBySource(
    em: EntityManager,
    healthIngestionBatchId: string,
    sourceRecordIdentifier: string,
    sourceVersion?: string,
  ): Promise<HealthIngestionRecords | null> {
    return em.findOne(HealthIngestionRecords, {
      healthIngestionBatchId,
      sourceRecordIdentifier,
      sourceVersion,
    });
  }

  /**
   * Obtiene find records by batch.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param healthIngestionBatchId - Identificador de health ingestion batch.
   * @returns Resultado de find records by batch conforme al contrato `Promise<HealthIngestionRecords[]>`.
   */
  findRecordsByBatch(
    em: EntityManager,
    healthIngestionBatchId: string,
  ): Promise<HealthIngestionRecords[]> {
    return em.find(HealthIngestionRecords, { healthIngestionBatchId });
  }
}
