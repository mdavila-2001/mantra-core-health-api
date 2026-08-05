import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { LakehouseCatalogService } from './lakehouse-catalog.service';

const actor = { id: 'user-1', roles: ['DATA_PLATFORM_ENGINEER'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const PRODUCT_ID = '22222222-2222-2222-2222-222222222222';
const VERSION_ID = '33333333-3333-3333-3333-333333333333';
const ZONE_ID = '44444444-4444-4444-4444-444444444444';
const CATALOG_ID = '55555555-5555-5555-5555-555555555555';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const catalogRepo = {
    findZoneByCode: mockFn(async () => null),
    findZoneById: mockFn(async () => ({
      id: ZONE_ID,
      zoneType: 'curated',
      state: 'active',
    })),
    createZone: mockFn((_tx: any, data: any) => ({ id: ZONE_ID, ...data })),
    findCatalogByCode: mockFn(async () => null),
    findCatalogById: mockFn(async () => ({
      id: CATALOG_ID,
      state: 'active',
      defaultFormat: 'parquet',
    })),
    createCatalog: mockFn((_tx: any, data: any) => ({
      id: CATALOG_ID,
      ...data,
    })),
    findProductForUpdate: mockFn(async () => null),
    findProductByCode: mockFn(async () => null),
    createProduct: mockFn((_tx: any, data: any) => ({
      id: data.id ?? PRODUCT_ID,
      ...data,
    })),
    findProductVersion: mockFn(async () => null),
    findProductVersionById: mockFn(async () => ({
      id: VERSION_ID,
      dataProductId: PRODUCT_ID,
      state: 'active',
    })),
    findActiveProductVersionForUpdate: mockFn(async () => null),
    createProductVersion: mockFn((_tx: any, data: any) => ({
      id: VERSION_ID,
      ...data,
    })),
    createQualityRule: mockFn((_tx: any, data: any) => ({
      id: 'rule-1',
      ...data,
    })),
    findDatasetByTable: mockFn(async () => null),
    createDataset: mockFn((_tx: any, data: any) => ({
      id: 'dataset-1',
      ...data,
    })),
    createSchemaVersion: mockFn((_tx: any, data: any) => ({
      id: 'schema-1',
      ...data,
    })),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new LakehouseCatalogService(
    em as any,
    catalogRepo as any,
    outbox as any,
    logger as any,
  );
  return { service, em, tx, catalogRepo, outbox, logger };
}

describe('LakehouseCatalogService', () => {
  describe('defineZone (UC-63-01)', () => {
    const DTO = { code: 'curated', name: 'Curada', zoneType: 'curated' } as any;

    it('crea la zona activa', async () => {
      const d = build();

      const result = await d.service.defineZone(DTO, actor);

      expect(result.state).toBe('active');
      expect(result.zoneType).toBe('curated');
    });

    it('rechaza un código repetido', async () => {
      const d = build();
      d.catalogRepo.findZoneByCode.mockResolvedValue({ id: 'otra' });

      await expect(d.service.defineZone(DTO, actor)).rejects.toThrow(
        /Ya existe una zona/,
      );
    });
  });

  describe('registerCatalog (UC-63-02)', () => {
    const DTO = {
      code: 'glue-main',
      catalogType: 'glue',
      metastoreUri: 'arn:x',
    } as any;

    it('crea el catálogo activo', async () => {
      const d = build();

      const result = await d.service.registerCatalog(DTO, actor);

      expect(result.state).toBe('active');
    });

    it('rechaza un código repetido', async () => {
      const d = build();
      d.catalogRepo.findCatalogByCode.mockResolvedValue({ id: 'otro' });

      await expect(d.service.registerCatalog(DTO, actor)).rejects.toThrow(
        /Ya existe un catálogo/,
      );
    });
  });

  describe('publishProductVersion (UC-63-03)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      code: 'encuentros',
      name: 'Encuentros',
      version: '1.0.0',
      contractSchemaJson: { fields: [] },
      qualityRules: [
        {
          ruleCode: 'no-nulls',
          dimension: 'completeness',
          severity: 'blocking',
        },
      ],
    } as any;

    it('crea el producto con el id de la ruta si no existía', async () => {
      const d = build();

      const result = await d.service.publishProductVersion(
        PRODUCT_ID,
        DTO,
        actor,
      );

      expect(d.catalogRepo.createProduct.mock.calls[0][1].id).toBe(PRODUCT_ID);
      expect(result.dataProductId).toBe(PRODUCT_ID);
      expect(result.state).toBe('active');
    });

    it('actualiza el producto existente y lo publica', async () => {
      const d = build();
      const product = {
        id: PRODUCT_ID,
        tenantId: TENANT_ID,
        code: 'encuentros',
        lifecycleState: 'draft',
        containsPhi: false,
      };
      d.catalogRepo.findProductForUpdate.mockResolvedValue(product);

      await d.service.publishProductVersion(
        PRODUCT_ID,
        { ...DTO, containsPhi: true },
        actor,
      );

      expect(product.lifecycleState).toBe('published');
      expect(product.containsPhi).toBe(true);
      expect(d.catalogRepo.createProduct).not.toHaveBeenCalled();
    });

    it('rechaza crear si el código ya lo tiene otro producto', async () => {
      const d = build();
      d.catalogRepo.findProductByCode.mockResolvedValue({
        id: 'otro-producto',
      });

      await expect(
        d.service.publishProductVersion(PRODUCT_ID, DTO, actor),
      ).rejects.toThrow(/con otro identificador/);
    });

    it('rechaza si el producto existente tiene otro código', async () => {
      const d = build();
      d.catalogRepo.findProductForUpdate.mockResolvedValue({
        id: PRODUCT_ID,
        tenantId: TENANT_ID,
        code: 'otro-codigo',
      });

      await expect(
        d.service.publishProductVersion(PRODUCT_ID, DTO, actor),
      ).rejects.toThrow(/otro código/);
    });

    it('supersede la versión vigente anterior', async () => {
      const d = build();
      const previous = { id: 'version-previa', state: 'active' };
      d.catalogRepo.findActiveProductVersionForUpdate.mockResolvedValue(
        previous,
      );

      const result = await d.service.publishProductVersion(
        PRODUCT_ID,
        DTO,
        actor,
      );

      expect(previous.state).toBe('superseded');
      expect((previous as any).effectiveTo).toBeInstanceOf(Date);
      expect(result.supersededVersionId).toBe('version-previa');
    });

    it('rechaza publicar dos veces la misma versión', async () => {
      const d = build();
      d.catalogRepo.findProductVersion.mockResolvedValue({ id: 'ya-existe' });

      await expect(
        d.service.publishProductVersion(PRODUCT_ID, DTO, actor),
      ).rejects.toThrow(/ya está publicada/);
    });

    it('crea las reglas de calidad del SLO', async () => {
      const d = build();

      const result = await d.service.publishProductVersion(
        PRODUCT_ID,
        DTO,
        actor,
      );

      expect(result.qualityRulesCreated).toBe(1);
      expect(d.catalogRepo.createQualityRule.mock.calls[0][1].state).toBe(
        'active',
      );
    });

    it('rechaza dos reglas con el mismo código', async () => {
      const d = build();

      await expect(
        d.service.publishProductVersion(
          PRODUCT_ID,
          {
            ...DTO,
            qualityRules: [
              { ruleCode: 'r', dimension: 'completeness', severity: 'info' },
              { ruleCode: 'r', dimension: 'accuracy', severity: 'info' },
            ],
          },
          actor,
        ),
      ).rejects.toThrow(/mismo código/);
    });
  });

  describe('registerDataset (UC-63-04)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      dataProductVersionId: VERSION_ID,
      dataLakeZoneId: ZONE_ID,
      lakehouseCatalogId: CATALOG_ID,
      databaseName: 'analytics',
      tableName: 'encounters',
      schemaJson: { fields: [] },
      schemaFingerprint: 'fp-1',
    } as any;

    it('crea el dataset con su esquema inicial', async () => {
      const d = build();

      const result = await d.service.registerDataset(DTO, actor);

      expect(result.lifecycleState).toBe('active');
      expect(result.schemaVersionId).toBe('schema-1');
      expect(
        d.catalogRepo.createSchemaVersion.mock.calls[0][1].schemaVersion,
      ).toBe(1);
    });

    it('toma el formato del catálogo si no se declara', async () => {
      const d = build();

      const result = await d.service.registerDataset(DTO, actor);

      expect(result.storageFormat).toBe('parquet');
    });

    it('rechaza una versión de producto superseded', async () => {
      const d = build();
      d.catalogRepo.findProductVersionById.mockResolvedValue({
        id: VERSION_ID,
        state: 'superseded',
      });

      await expect(d.service.registerDataset(DTO, actor)).rejects.toThrow(
        /ya no es la vigente/,
      );
    });

    it('rechaza una zona retirada', async () => {
      const d = build();
      d.catalogRepo.findZoneById.mockResolvedValue({
        id: ZONE_ID,
        state: 'retired',
      });

      await expect(d.service.registerDataset(DTO, actor)).rejects.toThrow(
        /zona no está activa/,
      );
    });

    it('rechaza un catálogo retirado', async () => {
      const d = build();
      d.catalogRepo.findCatalogById.mockResolvedValue({
        id: CATALOG_ID,
        state: 'retired',
      });

      await expect(d.service.registerDataset(DTO, actor)).rejects.toThrow(
        /catálogo no está activo/,
      );
    });

    it('rechaza registrar dos veces la misma tabla', async () => {
      const d = build();
      d.catalogRepo.findDatasetByTable.mockResolvedValue({ id: 'otro' });

      await expect(d.service.registerDataset(DTO, actor)).rejects.toThrow(
        /ya hay un dataset/i,
      );
    });
  });
});
