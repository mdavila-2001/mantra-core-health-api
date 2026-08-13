import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DatasetPlacements,
  TenantStorageBindings,
  StorageCostSnapshots,
  StorageIntegrityPolicies,
} from '../entities';

/**
 * Acceso a las colocaciones de `polyglot_storage.*`: dónde vive cada versión de
 * dataset, qué tenant está atado a cuál, cuánto cuesta y con qué política se
 * verifica su integridad.
 */
@Injectable()
export class PlacementsRepository {
  // --- Colocaciones (UC-54-05, 08, 11, 13) ---

  /**
   * Crea create placement.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create placement conforme al contrato `DatasetPlacements`.
   */
  createPlacement(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a dataset version.
       */
      datasetVersionId: string;
      /**
       * Identificador asociado a storage backend region.
       */
      storageBackendRegionId: string;
      /**
       * Identificador asociado a collection definition.
       */
      collectionDefinitionId: string;
      /**
       * Valor de placement role mantenido por la instancia.
       */
      placementRole: string;
      /**
       * Identificador asociado a residency policy.
       */
      residencyPolicyId?: string;
      /**
       * Identificador asociado a replication policy.
       */
      replicationPolicyId?: string;
      /**
       * Identificador asociado a consistency policy.
       */
      consistencyPolicyId?: string;
      /**
       * Identificador asociado a encryption profile.
       */
      encryptionProfileId?: string;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): DatasetPlacements {
    return em.create(
      DatasetPlacements,
      {
        datasetVersionId: data.datasetVersionId,
        storageBackendRegionId: data.storageBackendRegionId,
        collectionDefinitionId: data.collectionDefinitionId,
        placementRole: data.placementRole,
        residencyPolicyId: data.residencyPolicyId,
        replicationPolicyId: data.replicationPolicyId,
        consistencyPolicyId: data.consistencyPolicyId,
        encryptionProfileId: data.encryptionProfileId,
        state: data.state,
        activatedAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find placement by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find placement by id conforme al contrato `Promise<DatasetPlacements | null>`.
   */
  findPlacementById(
    em: EntityManager,
    id: string,
  ): Promise<DatasetPlacements | null> {
    return em.findOne(DatasetPlacements, { id });
  }

  /**
   * Obtiene find placement for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find placement for update conforme al contrato `Promise<DatasetPlacements | null>`.
   */
  findPlacementForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<DatasetPlacements | null> {
    return em.findOne(
      DatasetPlacements,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Una colocación por versión, región y papel: aprobar dos veces no duplica. */
  findPlacement(
    em: EntityManager,
    datasetVersionId: string,
    storageBackendRegionId: string,
    placementRole: string,
  ): Promise<DatasetPlacements | null> {
    return em.findOne(DatasetPlacements, {
      datasetVersionId,
      storageBackendRegionId,
      placementRole,
    });
  }

  /** Colocaciones de la región, bloqueadas: el failover las degrada en bloque. */
  findPlacementsByRegionForUpdate(
    em: EntityManager,
    storageBackendRegionId: string,
    activeStates: string[],
  ): Promise<DatasetPlacements[]> {
    return em.find(
      DatasetPlacements,
      { storageBackendRegionId, state: { $in: activeStates } },
      { lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE },
    );
  }

  // --- Vínculos por tenant (UC-54-08, 11) ---

  /**
   * Crea create binding.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create binding conforme al contrato `TenantStorageBindings`.
   */
  createBinding(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a dataset definition.
       */
      datasetDefinitionId: string;
      /**
       * Identificador asociado a primary placement.
       */
      primaryPlacementId: string;
      /**
       * Identificador asociado a secondary placement.
       */
      secondaryPlacementId?: string;
      /**
       * Valor de tenant partition key mantenido por la instancia.
       */
      tenantPartitionKey?: string;
      /**
       * Valor de tenant encryption key ref mantenido por la instancia.
       */
      tenantEncryptionKeyRef?: string;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): TenantStorageBindings {
    return em.create(
      TenantStorageBindings,
      {
        tenantId: data.tenantId,
        datasetDefinitionId: data.datasetDefinitionId,
        primaryPlacementId: data.primaryPlacementId,
        secondaryPlacementId: data.secondaryPlacementId,
        // NOT NULL: sin clave explícita, la partición del tenant es su propio
        // identificador.
        tenantPartitionKey: data.tenantPartitionKey ?? data.tenantId,
        // NOT NULL: sin clave propia declarada, el binding usa la del backend,
        // que es lo que expresa la referencia vacía.
        tenantEncryptionKeyRef: data.tenantEncryptionKeyRef ?? '',
        state: data.state,
        // Columnas NOT NULL sin default en el esquema.
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Un vínculo por tenant y dataset: dos dejarían sin decidir dónde escribe. */
  findBinding(
    em: EntityManager,
    tenantId: string,
    datasetDefinitionId: string,
  ): Promise<TenantStorageBindings | null> {
    return em.findOne(TenantStorageBindings, { tenantId, datasetDefinitionId });
  }

  /** Vínculos que apuntan a la colocación caída: el failover les cambia el primario. */
  findBindingsByPrimaryForUpdate(
    em: EntityManager,
    primaryPlacementId: string,
  ): Promise<TenantStorageBindings[]> {
    return em.find(
      TenantStorageBindings,
      { primaryPlacementId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Costes (UC-54-12) ---

  /**
   * Crea create cost snapshot.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create cost snapshot conforme al contrato `StorageCostSnapshots`.
   */
  createCostSnapshot(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a storage backend region.
       */
      storageBackendRegionId: string;
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Identificador asociado a dataset definition.
       */
      datasetDefinitionId?: string;
      /**
       * Valor de period start mantenido por la instancia.
       */
      periodStart: Date;
      /**
       * Valor de period end mantenido por la instancia.
       */
      periodEnd: Date;
      /**
       * Valor de storage bytes mantenido por la instancia.
       */
      storageBytes: string;
      /**
       * Valor de read units mantenido por la instancia.
       */
      readUnits: string;
      /**
       * Valor de write units mantenido por la instancia.
       */
      writeUnits: string;
      /**
       * Valor de egress bytes mantenido por la instancia.
       */
      egressBytes: string;
      /**
       * Valor de estimated cost mantenido por la instancia.
       */
      estimatedCost: string;
      /**
       * Valor de currency code mantenido por la instancia.
       */
      currencyCode: string;
    },
  ): StorageCostSnapshots {
    return em.create(
      StorageCostSnapshots,
      {
        storageBackendRegionId: data.storageBackendRegionId,
        tenantId: data.tenantId,
        datasetDefinitionId: data.datasetDefinitionId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        storageBytes: data.storageBytes,
        readUnits: data.readUnits,
        writeUnits: data.writeUnits,
        egressBytes: data.egressBytes,
        estimatedCost: data.estimatedCost,
        currencyCode: data.currencyCode,
        // Columna NOT NULL sin default en el esquema.
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Instantánea del mismo ámbito y periodo, bloqueada. Es la clave de
   * idempotencia del consolidador: reconsolidar el mismo periodo actualiza en
   * lugar de duplicar el coste.
   */
  findCostSnapshotForUpdate(
    em: EntityManager,
    storageBackendRegionId: string,
    tenantId: string | undefined,
    datasetDefinitionId: string | undefined,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<StorageCostSnapshots | null> {
    return em.findOne(
      StorageCostSnapshots,
      {
        storageBackendRegionId,
        tenantId,
        datasetDefinitionId,
        periodStart,
        periodEnd,
      },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Integridad (UC-54-13) ---

  /**
   * Crea create integrity policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create integrity policy conforme al contrato `StorageIntegrityPolicies`.
   */
  createIntegrityPolicy(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a dataset definition.
       */
      datasetDefinitionId: string;
      /**
       * Valor de hash algorithm mantenido por la instancia.
       */
      hashAlgorithm: string;
      /**
       * Valor de verification interval hours mantenido por la instancia.
       */
      verificationIntervalHours: number;
      /**
       * Valor de sample percentage mantenido por la instancia.
       */
      samplePercentage: string;
      /**
       * Valor de compare with canonical source mantenido por la instancia.
       */
      compareWithCanonicalSource: boolean;
      /**
       * Valor de quarantine on mismatch mantenido por la instancia.
       */
      quarantineOnMismatch: boolean;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): StorageIntegrityPolicies {
    return em.create(
      StorageIntegrityPolicies,
      {
        datasetDefinitionId: data.datasetDefinitionId,
        hashAlgorithm: data.hashAlgorithm,
        verificationIntervalHours: data.verificationIntervalHours,
        samplePercentage: data.samplePercentage,
        compareWithCanonicalSource: data.compareWithCanonicalSource,
        quarantineOnMismatch: data.quarantineOnMismatch,
        state: data.state,
      },
      { partial: true },
    );
  }

  /** Una política de integridad por dataset. */
  findIntegrityPolicyForUpdate(
    em: EntityManager,
    datasetDefinitionId: string,
  ): Promise<StorageIntegrityPolicies | null> {
    return em.findOne(
      StorageIntegrityPolicies,
      { datasetDefinitionId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find integrity policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param datasetDefinitionId - Identificador de dataset definition.
   * @returns Resultado de find integrity policy conforme al contrato `Promise<StorageIntegrityPolicies | null>`.
   */
  findIntegrityPolicy(
    em: EntityManager,
    datasetDefinitionId: string,
  ): Promise<StorageIntegrityPolicies | null> {
    return em.findOne(StorageIntegrityPolicies, { datasetDefinitionId });
  }
}
