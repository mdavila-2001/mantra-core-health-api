import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PolyglotStorageDataClassifications as DataClassifications,
  DatasetDefinitions,
  DatasetVersions,
  CollectionDefinitions,
  CollectionSchemaVersions,
  DataAccessPolicies,
} from '../entities';

/**
 * Acceso a los datasets gobernados de `polyglot_storage.*`: clasificaciones,
 * definiciones, versiones con huella de esquema, colecciones físicas con su
 * esquema versionado, y políticas de acceso al dato.
 */
@Injectable()
export class DatasetsRepository {
  // --- Clasificaciones (UC-54-02, 05, 09) ---

  /**
   * Obtiene find classification by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find classification by id conforme al contrato `Promise<DataClassifications | null>`.
   */
  findClassificationById(
    em: EntityManager,
    id: string,
  ): Promise<DataClassifications | null> {
    return em.findOne(DataClassifications, { id });
  }

  /**
   * Obtiene find classification by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find classification by code conforme al contrato `Promise<DataClassifications | null>`.
   */
  findClassificationByCode(
    em: EntityManager,
    code: string,
  ): Promise<DataClassifications | null> {
    return em.findOne(DataClassifications, { code });
  }

  // --- Definiciones (UC-54-02, 03, 04, 07, 08, 13) ---

  /**
   * Crea create dataset.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create dataset conforme al contrato `DatasetDefinitions`.
   */
  createDataset(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Valor de owning module code mantenido por la instancia.
       */
      owningModuleCode: string;
      /**
       * Identificador asociado a data classification.
       */
      dataClassificationId: string;
      /**
       * Valor de source of truth mantenido por la instancia.
       */
      sourceOfTruth: string;
      /**
       * Valor de canonical entity type mantenido por la instancia.
       */
      canonicalEntityType?: string;
      /**
       * Valor de lifecycle state mantenido por la instancia.
       */
      lifecycleState: string;
    },
  ): DatasetDefinitions {
    return em.create(
      DatasetDefinitions,
      {
        code: data.code,
        name: data.name,
        owningModuleCode: data.owningModuleCode,
        dataClassificationId: data.dataClassificationId,
        sourceOfTruth: data.sourceOfTruth,
        canonicalEntityType: data.canonicalEntityType,
        lifecycleState: data.lifecycleState,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find dataset by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find dataset by id conforme al contrato `Promise<DatasetDefinitions | null>`.
   */
  findDatasetById(
    em: EntityManager,
    id: string,
  ): Promise<DatasetDefinitions | null> {
    return em.findOne(DatasetDefinitions, { id });
  }

  /** Publicar una versión serializa sobre la definición: el número sale de un máximo. */
  findDatasetForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<DatasetDefinitions | null> {
    return em.findOne(
      DatasetDefinitions,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find dataset by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find dataset by code conforme al contrato `Promise<DatasetDefinitions | null>`.
   */
  findDatasetByCode(
    em: EntityManager,
    code: string,
  ): Promise<DatasetDefinitions | null> {
    return em.findOne(DatasetDefinitions, { code });
  }

  // --- Versiones (UC-54-02, 03, 04, 05) ---

  /**
   * Crea create dataset version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create dataset version conforme al contrato `DatasetVersions`.
   */
  createDatasetVersion(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a dataset definition.
       */
      datasetDefinitionId: string;
      /**
       * Valor de version mantenido por la instancia.
       */
      version: string;
      /**
       * Valor de schema fingerprint mantenido por la instancia.
       */
      schemaFingerprint: string;
      /**
       * Valor de compatibility mode mantenido por la instancia.
       */
      compatibilityMode: string;
      /**
       * Identificador asociado a schema document file.
       */
      schemaDocumentFileId?: string;
      /**
       * Valor de effective from mantenido por la instancia.
       */
      effectiveFrom: Date;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): DatasetVersions {
    return em.create(
      DatasetVersions,
      {
        datasetDefinitionId: data.datasetDefinitionId,
        version: data.version,
        schemaFingerprint: data.schemaFingerprint,
        compatibilityMode: data.compatibilityMode,
        schemaDocumentFileId: data.schemaDocumentFileId,
        effectiveFrom: data.effectiveFrom,
        state: data.state,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find dataset version by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find dataset version by id conforme al contrato `Promise<DatasetVersions | null>`.
   */
  findDatasetVersionById(
    em: EntityManager,
    id: string,
  ): Promise<DatasetVersions | null> {
    return em.findOne(DatasetVersions, { id });
  }

  /**
   * Obtiene find dataset version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param datasetDefinitionId - Identificador de dataset definition.
   * @param version - Valor de version requerido por la operación.
   * @returns Resultado de find dataset version conforme al contrato `Promise<DatasetVersions | null>`.
   */
  findDatasetVersion(
    em: EntityManager,
    datasetDefinitionId: string,
    version: string,
  ): Promise<DatasetVersions | null> {
    return em.findOne(DatasetVersions, { datasetDefinitionId, version });
  }

  /** Versión vigente del dataset, bloqueada: publicar otra la supersede. */
  findActiveDatasetVersionForUpdate(
    em: EntityManager,
    datasetDefinitionId: string,
    activeState: string,
  ): Promise<DatasetVersions | null> {
    return em.findOne(
      DatasetVersions,
      { datasetDefinitionId, state: activeState, effectiveTo: null },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Colecciones (UC-54-04, 05) ---

  /**
   * Crea create collection.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create collection conforme al contrato `CollectionDefinitions`.
   */
  createCollection(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a storage backend.
       */
      storageBackendId: string;
      /**
       * Identificador asociado a dataset definition.
       */
      datasetDefinitionId: string;
      /**
       * Valor de logical name mantenido por la instancia.
       */
      logicalName: string;
      /**
       * Valor de physical name pattern mantenido por la instancia.
       */
      physicalNamePattern?: string;
      /**
       * Valor de partitioning strategy mantenido por la instancia.
       */
      partitioningStrategy?: string;
      /**
       * Valor de tenant isolation mode mantenido por la instancia.
       */
      tenantIsolationMode?: string;
      /**
       * Valor de routing key expression mantenido por la instancia.
       */
      routingKeyExpression?: string;
      /**
       * Valor de shard key expression mantenido por la instancia.
       */
      shardKeyExpression?: string;
      /**
       * Valor de lifecycle state mantenido por la instancia.
       */
      lifecycleState: string;
    },
  ): CollectionDefinitions {
    return em.create(
      CollectionDefinitions,
      {
        storageBackendId: data.storageBackendId,
        datasetDefinitionId: data.datasetDefinitionId,
        logicalName: data.logicalName,
        physicalNamePattern: data.physicalNamePattern,
        partitioningStrategy: data.partitioningStrategy,
        tenantIsolationMode: data.tenantIsolationMode,
        routingKeyExpression: data.routingKeyExpression,
        shardKeyExpression: data.shardKeyExpression,
        lifecycleState: data.lifecycleState,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find collection by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find collection by id conforme al contrato `Promise<CollectionDefinitions | null>`.
   */
  findCollectionById(
    em: EntityManager,
    id: string,
  ): Promise<CollectionDefinitions | null> {
    return em.findOne(CollectionDefinitions, { id });
  }

  /** El nombre lógico es único dentro del backend. */
  findCollectionByName(
    em: EntityManager,
    storageBackendId: string,
    logicalName: string,
  ): Promise<CollectionDefinitions | null> {
    return em.findOne(CollectionDefinitions, { storageBackendId, logicalName });
  }

  /**
   * Crea create schema version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create schema version conforme al contrato `CollectionSchemaVersions`.
   */
  createSchemaVersion(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a collection definition.
       */
      collectionDefinitionId: string;
      /**
       * Identificador asociado a dataset version.
       */
      datasetVersionId: string;
      /**
       * Valor de schema version mantenido por la instancia.
       */
      schemaVersion: string;
      /**
       * Valor de validation mode mantenido por la instancia.
       */
      validationMode: string;
      /**
       * Valor de schema document json mantenido por la instancia.
       */
      schemaDocumentJson?: unknown;
      /**
       * Valor de migration strategy mantenido por la instancia.
       */
      migrationStrategy?: string;
      /**
       * Valor de effective from mantenido por la instancia.
       */
      effectiveFrom: Date;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): CollectionSchemaVersions {
    return em.create(
      CollectionSchemaVersions,
      {
        collectionDefinitionId: data.collectionDefinitionId,
        datasetVersionId: data.datasetVersionId,
        schemaVersion: data.schemaVersion,
        validationMode: data.validationMode,
        schemaDocumentJson: data.schemaDocumentJson,
        migrationStrategy: data.migrationStrategy,
        effectiveFrom: data.effectiveFrom,
        state: data.state,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find schema version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param collectionDefinitionId - Identificador de collection definition.
   * @param schemaVersion - Valor de schema version requerido por la operación.
   * @returns Resultado de find schema version conforme al contrato `Promise<CollectionSchemaVersions | null>`.
   */
  findSchemaVersion(
    em: EntityManager,
    collectionDefinitionId: string,
    schemaVersion: string,
  ): Promise<CollectionSchemaVersions | null> {
    return em.findOne(CollectionSchemaVersions, {
      collectionDefinitionId,
      schemaVersion,
    });
  }

  // --- Políticas de acceso al dato (UC-54-07) ---

  /**
   * Crea create access policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create access policy conforme al contrato `DataAccessPolicies`.
   */
  createAccessPolicy(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a dataset definition.
       */
      datasetDefinitionId: string;
      /**
       * Valor de purpose of use code mantenido por la instancia.
       */
      purposeOfUseCode: string;
      /**
       * Valor de principal type mantenido por la instancia.
       */
      principalType: string;
      /**
       * Valor de field policy json mantenido por la instancia.
       */
      fieldPolicyJson?: unknown;
      /**
       * Valor de row filter expression mantenido por la instancia.
       */
      rowFilterExpression?: string;
      /**
       * Valor de masking profile code mantenido por la instancia.
       */
      maskingProfileCode?: string;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): DataAccessPolicies {
    return em.create(
      DataAccessPolicies,
      {
        datasetDefinitionId: data.datasetDefinitionId,
        purposeOfUseCode: data.purposeOfUseCode,
        principalType: data.principalType,
        fieldPolicyJson: data.fieldPolicyJson,
        rowFilterExpression: data.rowFilterExpression,
        maskingProfileCode: data.maskingProfileCode,
        state: data.state,
      },
      { partial: true },
    );
  }

  /** Una política por dataset, propósito y tipo de principal. */
  findAccessPolicy(
    em: EntityManager,
    datasetDefinitionId: string,
    purposeOfUseCode: string,
    principalType: string,
  ): Promise<DataAccessPolicies | null> {
    return em.findOne(DataAccessPolicies, {
      datasetDefinitionId,
      purposeOfUseCode,
      principalType,
    });
  }
}
