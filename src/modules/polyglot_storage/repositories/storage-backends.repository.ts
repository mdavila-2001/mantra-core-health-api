import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  StorageBackends,
  StorageBackendRegions,
  StorageCapabilities,
  StoreHealthChecks,
} from '../entities';

export interface CreateBackendData {
  code: string;
  name: string;
  backendType: string;
  providerCode: string;
  controlPlaneEndpoint?: string;
  supportsTransactions: boolean;
  supportsTtl: boolean;
  supportsEncryption: boolean;
  supportsVersioning: boolean;
  supportsWorm: boolean;
  supportsVectorSearch: boolean;
  supportsFullText: boolean;
  state: string;
}

/**
 * Acceso a los backends de `polyglot_storage.*`: motores de almacenamiento, sus
 * regiones, sus capacidades declaradas y sus comprobaciones de salud.
 */
@Injectable()
export class StorageBackendsRepository {
  // --- Backends (UC-54-01, 04) ---

  createBackend(em: EntityManager, data: CreateBackendData): StorageBackends {
    return em.create(
      StorageBackends,
      {
        code: data.code,
        name: data.name,
        backendType: data.backendType,
        providerCode: data.providerCode,
        controlPlaneEndpoint: data.controlPlaneEndpoint,
        supportsTransactions: data.supportsTransactions,
        supportsTtl: data.supportsTtl,
        supportsEncryption: data.supportsEncryption,
        supportsVersioning: data.supportsVersioning,
        supportsWorm: data.supportsWorm,
        supportsVectorSearch: data.supportsVectorSearch,
        supportsFullText: data.supportsFullText,
        state: data.state,
      },
      { partial: true },
    );
  }

  findBackendById(
    em: EntityManager,
    id: string,
  ): Promise<StorageBackends | null> {
    return em.findOne(StorageBackends, { id });
  }

  findBackendByCode(
    em: EntityManager,
    code: string,
  ): Promise<StorageBackends | null> {
    return em.findOne(StorageBackends, { code });
  }

  // --- Regiones (UC-54-01, 05, 11) ---

  createRegion(
    em: EntityManager,
    data: {
      storageBackendId: string;
      regionCode: string;
      countryCode: string;
      jurisdictionCode?: string;
      endpointUri?: string;
      isPrimary: boolean;
      state: string;
    },
  ): StorageBackendRegions {
    return em.create(
      StorageBackendRegions,
      {
        storageBackendId: data.storageBackendId,
        regionCode: data.regionCode,
        countryCode: data.countryCode,
        jurisdictionCode: data.jurisdictionCode,
        endpointUri: data.endpointUri,
        isPrimary: data.isPrimary,
        state: data.state,
      },
      { partial: true },
    );
  }

  findRegionById(
    em: EntityManager,
    id: string,
  ): Promise<StorageBackendRegions | null> {
    return em.findOne(StorageBackendRegions, { id });
  }

  findRegion(
    em: EntityManager,
    storageBackendId: string,
    regionCode: string,
  ): Promise<StorageBackendRegions | null> {
    return em.findOne(StorageBackendRegions, { storageBackendId, regionCode });
  }

  // --- Capacidades (UC-54-01, 04) ---

  createCapability(
    em: EntityManager,
    data: {
      storageBackendId: string;
      capabilityCode: string;
      capabilityVersion: string;
      configurationJson?: unknown;
      verificationStatus: string;
    },
  ): StorageCapabilities {
    return em.create(
      StorageCapabilities,
      {
        storageBackendId: data.storageBackendId,
        capabilityCode: data.capabilityCode,
        capabilityVersion: data.capabilityVersion,
        configurationJson: data.configurationJson,
        verificationStatus: data.verificationStatus,
      },
      { partial: true },
    );
  }

  findCapability(
    em: EntityManager,
    storageBackendId: string,
    capabilityCode: string,
    capabilityVersion: string,
  ): Promise<StorageCapabilities | null> {
    return em.findOne(StorageCapabilities, {
      storageBackendId,
      capabilityCode,
      capabilityVersion,
    });
  }

  // --- Salud (UC-54-11) ---

  /** Log append-only: una comprobación es la foto de un momento. */
  createHealthCheck(
    em: EntityManager,
    data: {
      storageBackendRegionId: string;
      checkType: string;
      status: string;
      latencyMs?: number;
      detailsJson?: unknown;
    },
  ): StoreHealthChecks {
    return em.create(
      StoreHealthChecks,
      {
        storageBackendRegionId: data.storageBackendRegionId,
        checkType: data.checkType,
        checkedAt: new Date(),
        status: data.status,
        latencyMs: data.latencyMs,
        detailsJson: data.detailsJson,
      },
      { partial: true },
    );
  }

  /** Región bloqueada: el failover la degrada y no debe cambiar mientras se decide. */
  findRegionForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<StorageBackendRegions | null> {
    return em.findOne(
      StorageBackendRegions,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }
}
