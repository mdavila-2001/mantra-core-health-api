import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  HealthSourceConnections,
  HealthIngestionBatches,
  HealthIngestionRecords,
} from '../entities';

export interface CreateBatchData {
  tenantId?: string;
  healthSourceConnectionId: string;
  batchIdentifier: string;
  ingestionModeConceptId: string;
  sourcePeriodStart?: Date;
  sourcePeriodEnd?: Date;
  payloadManifestFileId?: string;
  statusConceptId: string;
}

export interface CreateRecordData {
  healthIngestionBatchId: string;
  sourceRecordIdentifier: string;
  resourceTypeConceptId: string;
  sourceVersion?: string;
  sourceLastUpdatedAt?: Date;
  payloadHash: string;
  payloadFileId?: string;
  validationStatusConceptId: string;
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

  findBatchById(
    em: EntityManager,
    id: string,
  ): Promise<HealthIngestionBatches | null> {
    return em.findOne(HealthIngestionBatches, { id });
  }

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

  findRecordById(
    em: EntityManager,
    id: string,
  ): Promise<HealthIngestionRecords | null> {
    return em.findOne(HealthIngestionRecords, { id });
  }

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

  findRecordsByBatch(
    em: EntityManager,
    healthIngestionBatchId: string,
  ): Promise<HealthIngestionRecords[]> {
    return em.find(HealthIngestionRecords, { healthIngestionBatchId });
  }
}
