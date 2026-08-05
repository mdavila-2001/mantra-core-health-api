import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  DataLakeZones,
  LakehouseCatalogs,
  DataProducts,
  DataProductVersions,
  LakehouseQualityRules,
  LakehouseDatasets,
  LakehouseSchemaVersions,
} from '../entities';

/**
 * Catálogo del lakehouse: zonas, metastores, productos de datos con su contrato
 * versionado, reglas de calidad derivadas del SLO, y los datasets físicos con su
 * esquema.
 */
@Injectable()
export class LakehouseCatalogRepository {
  // --- Zonas (UC-63-01, 04) ---

  /**
   * Crea create zone.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create zone conforme al contrato `DataLakeZones`.
   */
  createZone(
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
       * Valor de zone type mantenido por la instancia.
       */
      zoneType: string;
      /**
       * Identificador asociado a namespace.
       */
      namespaceId?: string;
      /**
       * Valor de encryption profile code mantenido por la instancia.
       */
      encryptionProfileCode?: string;
      /**
       * Valor de retention policy code mantenido por la instancia.
       */
      retentionPolicyCode?: string;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): DataLakeZones {
    return em.create(DataLakeZones, data as never, { partial: true });
  }

  /**
   * Obtiene find zone by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find zone by code conforme al contrato `Promise<DataLakeZones | null>`.
   */
  findZoneByCode(
    em: EntityManager,
    code: string,
  ): Promise<DataLakeZones | null> {
    return em.findOne(DataLakeZones, { code });
  }

  /**
   * Obtiene find zone by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find zone by id conforme al contrato `Promise<DataLakeZones | null>`.
   */
  findZoneById(em: EntityManager, id: string): Promise<DataLakeZones | null> {
    return em.findOne(DataLakeZones, { id });
  }

  // --- Catálogos / metastores (UC-63-02, 04) ---

  /**
   * Crea create catalog.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create catalog conforme al contrato `LakehouseCatalogs`.
   */
  createCatalog(
    em: EntityManager,
    data: {
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de catalog type mantenido por la instancia.
       */
      catalogType: string;
      /**
       * Valor de metastore uri mantenido por la instancia.
       */
      metastoreUri: string;
      /**
       * Valor de default format mantenido por la instancia.
       */
      defaultFormat?: string;
      /**
       * Valor de default compression mantenido por la instancia.
       */
      defaultCompression?: string;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): LakehouseCatalogs {
    return em.create(LakehouseCatalogs, data as never, { partial: true });
  }

  /**
   * Obtiene find catalog by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find catalog by code conforme al contrato `Promise<LakehouseCatalogs | null>`.
   */
  findCatalogByCode(
    em: EntityManager,
    code: string,
  ): Promise<LakehouseCatalogs | null> {
    return em.findOne(LakehouseCatalogs, { code });
  }

  /**
   * Obtiene find catalog by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find catalog by id conforme al contrato `Promise<LakehouseCatalogs | null>`.
   */
  findCatalogById(
    em: EntityManager,
    id: string,
  ): Promise<LakehouseCatalogs | null> {
    return em.findOne(LakehouseCatalogs, { id });
  }

  // --- Productos de datos (UC-63-03, 04, 08, 10) ---

  /**
   * Producto por su clave natural `(tenant, código)`. El caso de uso declara
   * `data_products — UPSERT`, así que el alta y la actualización comparten
   * operación y hace falta poder encontrarlo por lo que lo identifica de verdad.
   */
  findProductByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<DataProducts | null> {
    return em.findOne(DataProducts, { tenantId, code });
  }

  /**
   * Obtiene find product for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find product for update conforme al contrato `Promise<DataProducts | null>`.
   */
  findProductForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<DataProducts | null> {
    return em.findOne(
      DataProducts,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Crea create product.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create product conforme al contrato `DataProducts`.
   */
  createProduct(
    em: EntityManager,
    data: {
      /**
       * Identificador único de la instancia.
       */
      id?: string;
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Identificador asociado a owner team.
       */
      ownerTeamId?: string;
      /**
       * Valor de business purpose mantenido por la instancia.
       */
      businessPurpose?: string;
      /**
       * Valor de classification code mantenido por la instancia.
       */
      classificationCode?: string;
      /**
       * Valor de contains phi mantenido por la instancia.
       */
      containsPhi: boolean;
      /**
       * Valor de lifecycle state mantenido por la instancia.
       */
      lifecycleState: string;
    },
  ): DataProducts {
    return em.create(DataProducts, data as never, { partial: true });
  }

  // --- Versiones del producto (UC-63-03, 04, 10) ---

  /**
   * Crea create product version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create product version conforme al contrato `DataProductVersions`.
   */
  createProductVersion(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a data product.
       */
      dataProductId: string;
      /**
       * Valor de version mantenido por la instancia.
       */
      version: string;
      /**
       * Valor de contract schema json mantenido por la instancia.
       */
      contractSchemaJson?: unknown;
      /**
       * Valor de quality slo json mantenido por la instancia.
       */
      qualitySloJson?: unknown;
      /**
       * Valor de effective from mantenido por la instancia.
       */
      effectiveFrom: Date;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): DataProductVersions {
    return em.create(DataProductVersions, data as never, { partial: true });
  }

  /**
   * Obtiene find product version by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find product version by id conforme al contrato `Promise<DataProductVersions | null>`.
   */
  findProductVersionById(
    em: EntityManager,
    id: string,
  ): Promise<DataProductVersions | null> {
    return em.findOne(DataProductVersions, { id });
  }

  /**
   * Obtiene find product version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param dataProductId - Identificador de data product.
   * @param version - Valor de version requerido por la operación.
   * @returns Resultado de find product version conforme al contrato `Promise<DataProductVersions | null>`.
   */
  findProductVersion(
    em: EntityManager,
    dataProductId: string,
    version: string,
  ): Promise<DataProductVersions | null> {
    return em.findOne(DataProductVersions, { dataProductId, version });
  }

  /** La versión vigente, bloqueada: publicar una nueva la supersede. */
  findActiveProductVersionForUpdate(
    em: EntityManager,
    dataProductId: string,
    activeState: string,
  ): Promise<DataProductVersions | null> {
    return em.findOne(
      DataProductVersions,
      { dataProductId, state: activeState },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Reglas de calidad (UC-63-03, 08) ---

  /**
   * Crea create quality rule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create quality rule conforme al contrato `LakehouseQualityRules`.
   */
  createQualityRule(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a data product version.
       */
      dataProductVersionId: string;
      /**
       * Valor de rule code mantenido por la instancia.
       */
      ruleCode: string;
      /**
       * Valor de dimension mantenido por la instancia.
       */
      dimension: string;
      /**
       * Valor de expression mantenido por la instancia.
       */
      expression?: string;
      /**
       * Valor de severity mantenido por la instancia.
       */
      severity: string;
      /**
       * Valor de threshold mantenido por la instancia.
       */
      threshold?: string;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): LakehouseQualityRules {
    return em.create(LakehouseQualityRules, data as never, { partial: true });
  }

  /**
   * Obtiene find active quality rules.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param dataProductVersionId - Identificador de data product version.
   * @param activeState - Valor de active state requerido por la operación.
   * @returns Resultado de find active quality rules conforme al contrato `Promise<LakehouseQualityRules[]>`.
   */
  findActiveQualityRules(
    em: EntityManager,
    dataProductVersionId: string,
    activeState: string,
  ): Promise<LakehouseQualityRules[]> {
    return em.find(LakehouseQualityRules, {
      dataProductVersionId,
      state: activeState,
    });
  }

  /**
   * Obtiene find quality rule by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param dataProductVersionId - Identificador de data product version.
   * @param ruleCode - Valor de rule code requerido por la operación.
   * @returns Resultado de find quality rule by code conforme al contrato `Promise<LakehouseQualityRules | null>`.
   */
  findQualityRuleByCode(
    em: EntityManager,
    dataProductVersionId: string,
    ruleCode: string,
  ): Promise<LakehouseQualityRules | null> {
    return em.findOne(LakehouseQualityRules, {
      dataProductVersionId,
      ruleCode,
    });
  }

  // --- Datasets y esquemas (UC-63-04, 05, 07, 08) ---

  /**
   * Crea create dataset.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create dataset conforme al contrato `LakehouseDatasets`.
   */
  createDataset(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a data product version.
       */
      dataProductVersionId: string;
      /**
       * Identificador asociado a data lake zone.
       */
      dataLakeZoneId: string;
      /**
       * Identificador asociado a lakehouse catalog.
       */
      lakehouseCatalogId: string;
      /**
       * Valor de database name mantenido por la instancia.
       */
      databaseName: string;
      /**
       * Valor de table name mantenido por la instancia.
       */
      tableName: string;
      /**
       * Valor de storage format mantenido por la instancia.
       */
      storageFormat: string;
      /**
       * Valor de partition spec json mantenido por la instancia.
       */
      partitionSpecJson?: unknown;
      /**
       * Valor de source dataset code mantenido por la instancia.
       */
      sourceDatasetCode?: string;
      /**
       * Valor de lifecycle state mantenido por la instancia.
       */
      lifecycleState: string;
    },
  ): LakehouseDatasets {
    return em.create(LakehouseDatasets, data as never, { partial: true });
  }

  /**
   * Obtiene find dataset by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find dataset by id conforme al contrato `Promise<LakehouseDatasets | null>`.
   */
  findDatasetById(
    em: EntityManager,
    id: string,
  ): Promise<LakehouseDatasets | null> {
    return em.findOne(LakehouseDatasets, { id });
  }

  /**
   * Obtiene find dataset for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find dataset for update conforme al contrato `Promise<LakehouseDatasets | null>`.
   */
  findDatasetForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<LakehouseDatasets | null> {
    return em.findOne(
      LakehouseDatasets,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Clave natural de la tabla física: `(catálogo, base de datos, tabla)`. */
  findDatasetByTable(
    em: EntityManager,
    lakehouseCatalogId: string,
    databaseName: string,
    tableName: string,
  ): Promise<LakehouseDatasets | null> {
    return em.findOne(LakehouseDatasets, {
      lakehouseCatalogId,
      databaseName,
      tableName,
    });
  }

  /**
   * Crea create schema version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create schema version conforme al contrato `LakehouseSchemaVersions`.
   */
  createSchemaVersion(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a lakehouse dataset.
       */
      lakehouseDatasetId: string;
      /**
       * Valor de schema version mantenido por la instancia.
       */
      schemaVersion: number;
      /**
       * Valor de schema json mantenido por la instancia.
       */
      schemaJson?: unknown;
      /**
       * Valor de schema fingerprint mantenido por la instancia.
       */
      schemaFingerprint: string;
      /**
       * Valor de compatibility mode mantenido por la instancia.
       */
      compatibilityMode: string;
      /**
       * Valor de effective from mantenido por la instancia.
       */
      effectiveFrom: Date;
    },
  ): LakehouseSchemaVersions {
    return em.create(LakehouseSchemaVersions, data as never, { partial: true });
  }

  /**
   * Esquema por su huella. Dos versiones con el mismo `schema_fingerprint` son el
   * mismo esquema: registrar la segunda haría creer que el contrato cambió cuando
   * no lo hizo.
   */
  findSchemaByFingerprint(
    em: EntityManager,
    lakehouseDatasetId: string,
    schemaFingerprint: string,
  ): Promise<LakehouseSchemaVersions | null> {
    return em.findOne(LakehouseSchemaVersions, {
      lakehouseDatasetId,
      schemaFingerprint,
    });
  }
}
