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

  createPlacement(
    em: EntityManager,
    data: {
      datasetVersionId: string;
      storageBackendRegionId: string;
      collectionDefinitionId: string;
      placementRole: string;
      residencyPolicyId?: string;
      replicationPolicyId?: string;
      consistencyPolicyId?: string;
      encryptionProfileId?: string;
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

  findPlacementById(
    em: EntityManager,
    id: string,
  ): Promise<DatasetPlacements | null> {
    return em.findOne(DatasetPlacements, { id });
  }

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

  createBinding(
    em: EntityManager,
    data: {
      tenantId: string;
      datasetDefinitionId: string;
      primaryPlacementId: string;
      secondaryPlacementId?: string;
      tenantPartitionKey?: string;
      tenantEncryptionKeyRef?: string;
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
        tenantPartitionKey: data.tenantPartitionKey,
        tenantEncryptionKeyRef: data.tenantEncryptionKeyRef,
        state: data.state,
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

  createCostSnapshot(
    em: EntityManager,
    data: {
      storageBackendRegionId: string;
      tenantId?: string;
      datasetDefinitionId?: string;
      periodStart: Date;
      periodEnd: Date;
      storageBytes: string;
      readUnits: string;
      writeUnits: string;
      egressBytes: string;
      estimatedCost: string;
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

  createIntegrityPolicy(
    em: EntityManager,
    data: {
      datasetDefinitionId: string;
      hashAlgorithm: string;
      verificationIntervalHours: number;
      samplePercentage: string;
      compareWithCanonicalSource: boolean;
      quarantineOnMismatch: boolean;
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

  findIntegrityPolicy(
    em: EntityManager,
    datasetDefinitionId: string,
  ): Promise<StorageIntegrityPolicies | null> {
    return em.findOne(StorageIntegrityPolicies, { datasetDefinitionId });
  }
}
