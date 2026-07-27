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

  createZone(
    em: EntityManager,
    data: {
      code: string;
      name: string;
      zoneType: string;
      namespaceId?: string;
      encryptionProfileCode?: string;
      retentionPolicyCode?: string;
      state: string;
    },
  ): DataLakeZones {
    return em.create(DataLakeZones, data as never, { partial: true });
  }

  findZoneByCode(
    em: EntityManager,
    code: string,
  ): Promise<DataLakeZones | null> {
    return em.findOne(DataLakeZones, { code });
  }

  findZoneById(em: EntityManager, id: string): Promise<DataLakeZones | null> {
    return em.findOne(DataLakeZones, { id });
  }

  // --- Catálogos / metastores (UC-63-02, 04) ---

  createCatalog(
    em: EntityManager,
    data: {
      code: string;
      catalogType: string;
      metastoreUri: string;
      defaultFormat?: string;
      defaultCompression?: string;
      state: string;
    },
  ): LakehouseCatalogs {
    return em.create(LakehouseCatalogs, data as never, { partial: true });
  }

  findCatalogByCode(
    em: EntityManager,
    code: string,
  ): Promise<LakehouseCatalogs | null> {
    return em.findOne(LakehouseCatalogs, { code });
  }

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

  createProduct(
    em: EntityManager,
    data: {
      id?: string;
      tenantId: string;
      code: string;
      name: string;
      ownerTeamId?: string;
      businessPurpose?: string;
      classificationCode?: string;
      containsPhi: boolean;
      lifecycleState: string;
    },
  ): DataProducts {
    return em.create(DataProducts, data as never, { partial: true });
  }

  // --- Versiones del producto (UC-63-03, 04, 10) ---

  createProductVersion(
    em: EntityManager,
    data: {
      dataProductId: string;
      version: string;
      contractSchemaJson?: unknown;
      qualitySloJson?: unknown;
      effectiveFrom: Date;
      state: string;
    },
  ): DataProductVersions {
    return em.create(DataProductVersions, data as never, { partial: true });
  }

  findProductVersionById(
    em: EntityManager,
    id: string,
  ): Promise<DataProductVersions | null> {
    return em.findOne(DataProductVersions, { id });
  }

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

  createQualityRule(
    em: EntityManager,
    data: {
      dataProductVersionId: string;
      ruleCode: string;
      dimension: string;
      expression?: string;
      severity: string;
      threshold?: string;
      state: string;
    },
  ): LakehouseQualityRules {
    return em.create(LakehouseQualityRules, data as never, { partial: true });
  }

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

  createDataset(
    em: EntityManager,
    data: {
      tenantId: string;
      dataProductVersionId: string;
      dataLakeZoneId: string;
      lakehouseCatalogId: string;
      databaseName: string;
      tableName: string;
      storageFormat: string;
      partitionSpecJson?: unknown;
      sourceDatasetCode?: string;
      lifecycleState: string;
    },
  ): LakehouseDatasets {
    return em.create(LakehouseDatasets, data as never, { partial: true });
  }

  findDatasetById(
    em: EntityManager,
    id: string,
  ): Promise<LakehouseDatasets | null> {
    return em.findOne(LakehouseDatasets, { id });
  }

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

  createSchemaVersion(
    em: EntityManager,
    data: {
      lakehouseDatasetId: string;
      schemaVersion: number;
      schemaJson?: unknown;
      schemaFingerprint: string;
      compatibilityMode: string;
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
