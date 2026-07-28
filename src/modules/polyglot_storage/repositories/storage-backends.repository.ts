import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  StorageBackends,
  StorageBackendRegions,
  StorageCapabilities,
  StoreHealthChecks,
} from '../entities';

/**
 * Describe el contrato estructural de create backend data.
 */
export interface CreateBackendData {
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de backend type mantenido por la instancia.
   */
  backendType: string;
  /**
   * Valor de provider code mantenido por la instancia.
   */
  providerCode: string;
  /**
   * Valor de control plane endpoint mantenido por la instancia.
   */
  controlPlaneEndpoint?: string;
  /**
   * Valor de supports transactions mantenido por la instancia.
   */
  supportsTransactions: boolean;
  /**
   * Valor de supports ttl mantenido por la instancia.
   */
  supportsTtl: boolean;
  /**
   * Valor de supports encryption mantenido por la instancia.
   */
  supportsEncryption: boolean;
  /**
   * Valor de supports versioning mantenido por la instancia.
   */
  supportsVersioning: boolean;
  /**
   * Valor de supports worm mantenido por la instancia.
   */
  supportsWorm: boolean;
  /**
   * Valor de supports vector search mantenido por la instancia.
   */
  supportsVectorSearch: boolean;
  /**
   * Valor de supports full text mantenido por la instancia.
   */
  supportsFullText: boolean;
  /**
   * Valor de state mantenido por la instancia.
   */
  state: string;
}

/**
 * Acceso a los backends de `polyglot_storage.*`: motores de almacenamiento, sus
 * regiones, sus capacidades declaradas y sus comprobaciones de salud.
 */
@Injectable()
export class StorageBackendsRepository {
  // --- Backends (UC-54-01, 04) ---

  /**
   * Crea create backend.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create backend conforme al contrato `StorageBackends`.
   */
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

  /**
   * Obtiene find backend by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find backend by id conforme al contrato `Promise<StorageBackends | null>`.
   */
  findBackendById(
    em: EntityManager,
    id: string,
  ): Promise<StorageBackends | null> {
    return em.findOne(StorageBackends, { id });
  }

  /**
   * Obtiene find backend by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find backend by code conforme al contrato `Promise<StorageBackends | null>`.
   */
  findBackendByCode(
    em: EntityManager,
    code: string,
  ): Promise<StorageBackends | null> {
    return em.findOne(StorageBackends, { code });
  }

  // --- Regiones (UC-54-01, 05, 11) ---

  /**
   * Crea create region.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create region conforme al contrato `StorageBackendRegions`.
   */
  createRegion(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a storage backend.
       */
      storageBackendId: string;
      /**
       * Valor de region code mantenido por la instancia.
       */
      regionCode: string;
      /**
       * Valor de country code mantenido por la instancia.
       */
      countryCode: string;
      /**
       * Valor de jurisdiction code mantenido por la instancia.
       */
      jurisdictionCode?: string;
      /**
       * Valor de endpoint uri mantenido por la instancia.
       */
      endpointUri?: string;
      /**
       * Valor de is primary mantenido por la instancia.
       */
      isPrimary: boolean;
      /**
       * Valor de state mantenido por la instancia.
       */
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

  /**
   * Obtiene find region by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find region by id conforme al contrato `Promise<StorageBackendRegions | null>`.
   */
  findRegionById(
    em: EntityManager,
    id: string,
  ): Promise<StorageBackendRegions | null> {
    return em.findOne(StorageBackendRegions, { id });
  }

  /**
   * Obtiene find region.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param storageBackendId - Identificador de storage backend.
   * @param regionCode - Valor de region code requerido por la operación.
   * @returns Resultado de find region conforme al contrato `Promise<StorageBackendRegions | null>`.
   */
  findRegion(
    em: EntityManager,
    storageBackendId: string,
    regionCode: string,
  ): Promise<StorageBackendRegions | null> {
    return em.findOne(StorageBackendRegions, { storageBackendId, regionCode });
  }

  // --- Capacidades (UC-54-01, 04) ---

  /**
   * Crea create capability.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create capability conforme al contrato `StorageCapabilities`.
   */
  createCapability(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a storage backend.
       */
      storageBackendId: string;
      /**
       * Valor de capability code mantenido por la instancia.
       */
      capabilityCode: string;
      /**
       * Valor de capability version mantenido por la instancia.
       */
      capabilityVersion: string;
      /**
       * Valor de configuration json mantenido por la instancia.
       */
      configurationJson?: unknown;
      /**
       * Valor de verification status mantenido por la instancia.
       */
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

  /**
   * Obtiene find capability.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param storageBackendId - Identificador de storage backend.
   * @param capabilityCode - Valor de capability code requerido por la operación.
   * @param capabilityVersion - Valor de capability version requerido por la operación.
   * @returns Resultado de find capability conforme al contrato `Promise<StorageCapabilities | null>`.
   */
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
      /**
       * Identificador asociado a storage backend region.
       */
      storageBackendRegionId: string;
      /**
       * Valor de check type mantenido por la instancia.
       */
      checkType: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
      /**
       * Valor de latency ms mantenido por la instancia.
       */
      latencyMs?: number;
      /**
       * Valor de details json mantenido por la instancia.
       */
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
