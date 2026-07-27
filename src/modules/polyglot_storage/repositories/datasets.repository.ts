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

  findClassificationById(
    em: EntityManager,
    id: string,
  ): Promise<DataClassifications | null> {
    return em.findOne(DataClassifications, { id });
  }

  findClassificationByCode(
    em: EntityManager,
    code: string,
  ): Promise<DataClassifications | null> {
    return em.findOne(DataClassifications, { code });
  }

  // --- Definiciones (UC-54-02, 03, 04, 07, 08, 13) ---

  createDataset(
    em: EntityManager,
    data: {
      code: string;
      name: string;
      owningModuleCode: string;
      dataClassificationId: string;
      sourceOfTruth: string;
      canonicalEntityType?: string;
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

  findDatasetByCode(
    em: EntityManager,
    code: string,
  ): Promise<DatasetDefinitions | null> {
    return em.findOne(DatasetDefinitions, { code });
  }

  // --- Versiones (UC-54-02, 03, 04, 05) ---

  createDatasetVersion(
    em: EntityManager,
    data: {
      datasetDefinitionId: string;
      version: string;
      schemaFingerprint: string;
      compatibilityMode: string;
      schemaDocumentFileId?: string;
      effectiveFrom: Date;
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

  findDatasetVersionById(
    em: EntityManager,
    id: string,
  ): Promise<DatasetVersions | null> {
    return em.findOne(DatasetVersions, { id });
  }

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

  createCollection(
    em: EntityManager,
    data: {
      storageBackendId: string;
      datasetDefinitionId: string;
      logicalName: string;
      physicalNamePattern?: string;
      partitioningStrategy?: string;
      tenantIsolationMode?: string;
      routingKeyExpression?: string;
      shardKeyExpression?: string;
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

  createSchemaVersion(
    em: EntityManager,
    data: {
      collectionDefinitionId: string;
      datasetVersionId: string;
      schemaVersion: string;
      validationMode: string;
      schemaDocumentJson?: unknown;
      migrationStrategy?: string;
      effectiveFrom: Date;
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

  createAccessPolicy(
    em: EntityManager,
    data: {
      datasetDefinitionId: string;
      purposeOfUseCode: string;
      principalType: string;
      fieldPolicyJson?: unknown;
      rowFilterExpression?: string;
      maskingProfileCode?: string;
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
