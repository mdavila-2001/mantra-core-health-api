import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  HealthSourceConnections,
  HealthSourceSystems,
  HealthIngestionBatches,
  HealthIngestionRecords,
} from '../entities';
import { CONCEPTS } from '../../../common';

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

  /**
   * Sistema de origen por código dentro del tenant.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Tenant propietario.
   * @param code - Código del sistema.
   * @returns El sistema, si ya existe.
   */
  findSourceSystemByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<HealthSourceSystems | null> {
    return em.findOne(HealthSourceSystems, { tenantId, code });
  }

  /**
   * Da de alta el sistema de origen del que cuelgan las conexiones.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Identificación y clasificación del sistema.
   * @returns El sistema creado.
   */
  createSourceSystem(
    em: EntityManager,
    data: {
      /** Tenant propietario. */
      tenantId: string;
      /** Código único dentro del tenant. */
      code: string;
      /** Nombre legible. */
      name: string;
      /** Tipo de sistema. */
      sourceTypeConceptId: string;
      /** Nivel de confianza. */
      trustLevelConceptId: string;
    },
  ): HealthSourceSystems {
    const now = new Date();
    return em.create(
      HealthSourceSystems,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        sourceTypeConceptId: data.sourceTypeConceptId,
        trustLevelConceptId: data.trustLevelConceptId,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
    );
  }

  /**
   * Da de alta la conexión de origen: es lo que un lote de ingesta referencia.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Sistema del que cuelga y datos del extremo.
   * @returns La conexión creada, activa.
   */
  createConnection(
    em: EntityManager,
    data: {
      /** Sistema de origen del que cuelga. */
      healthSourceSystemId: string;
      /** Tipo de conexión. */
      connectionTypeConceptId: string;
      /** URI del extremo. */
      endpointUri: string;
    },
  ): HealthSourceConnections {
    const now = new Date();
    return em.create(
      HealthSourceConnections,
      {
        healthSourceSystemId: data.healthSourceSystemId,
        connectionTypeConceptId: data.connectionTypeConceptId,
        endpointUri: data.endpointUri,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
      { partial: true },
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
        // `created_at` es NOT NULL y sin default en el esquema: sin esta línea
        // abrir un lote fallaba SIEMPRE con 500 contra una base real, y no lo
        // veía ninguna prueba porque las unitarias simulan el `EntityManager`.
        // Mismo patrón que ya rompió `createOutboxMessage`.
        createdAt: new Date(),
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
        // Misma columna NOT NULL sin default que en el lote.
        createdAt: new Date(),
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
