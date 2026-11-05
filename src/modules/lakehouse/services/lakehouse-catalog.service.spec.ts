import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { LakehouseCatalogService } from './lakehouse-catalog.service';
import { BadRequestException } from '@nestjs/common';
import { runWithTenant } from '../../../common';
import { LakehouseErrorReason } from '../lakehouse.error-reasons';

const actor = { id: 'user-1', roles: ['DATA_PLATFORM_ENGINEER'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const OTHER_TENANT_ID = '99999999-9999-9999-9999-999999999999';
/**
 * Ejecuta cada método del servicio con `tenant` como tenant activo del
 * contexto, igual que lo deja el interceptor en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenant - Tenant activo.
 * @returns Proxy que fija el contexto en cada llamada.
 */
function inTenant<T extends object>(service: T, tenant: string): T {
  return new Proxy(service, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenant, () => value.apply(target, args));
    },
  });
}

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
    findProductById: mockFn(async () => null),
    findProductByCode: mockFn(async () => null),
    createProduct: mockFn((_tx: any, data: any) => ({
      id: data.id ?? PRODUCT_ID,
      ...data,
    })),
    findProductVersion: mockFn(async () => null),
    findProductVersionInTenant: mockFn(async () => ({
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
  return {
    service: inTenant(service, TENANT_ID),
    raw: service,
    em,
    tx,
    catalogRepo,
    outbox,
    logger,
  };
}

describe('LakehouseCatalogService', () => {
  describe('defineZone (UC-63-01)', () => {
    const DTO = {
      code: 'curated',
      name: 'Curada',
      zoneType: 'curated',
      namespaceId: '66666666-6666-6666-6666-666666666666',
      encryptionProfileCode: 'aes-256',
      retentionPolicyCode: 'retain-7y',
    } as any;

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
      ownerTeamId: '77777777-7777-7777-7777-777777777777',
      businessPurpose: 'Análisis de encuentros',
      classificationCode: 'internal',
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
      d.catalogRepo.findProductVersionInTenant.mockResolvedValue({
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
  describe('contrato mínimo y defaults (LAKE-02)', () => {
    const zone = {
      code: 'curated',
      name: 'Curada',
      zoneType: 'curated',
      namespaceId: '66666666-6666-6666-6666-666666666666',
      encryptionProfileCode: 'aes-256',
      retentionPolicyCode: 'retain-7y',
    } as any;

    it.each(['namespaceId', 'encryptionProfileCode', 'retentionPolicyCode'])(
      'la zona sin %s responde 400 catalogado y no intenta persistir',
      async (field) => {
        const d = build();
        const attempt = d.service.defineZone(
          { ...zone, [field]: undefined },
          actor,
        );
        await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
        await expect(attempt).rejects.toMatchObject({
          response: {
            code: 'VALIDATION_FAILED',
            reason: LakehouseErrorReason.LAKEHOUSE_REQUIRED_FIELD_MISSING,
            details: { fields: [field] },
          },
        });
        expect(d.catalogRepo.createZone).not.toHaveBeenCalled();
        expect(d.tx.flush).not.toHaveBeenCalled();
      },
    );

    it('la zona con todos sus campos requeridos se crea con ellos', async () => {
      const d = build();
      await d.service.defineZone(zone, actor);
      expect(d.catalogRepo.createZone).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          namespaceId: zone.namespaceId,
          encryptionProfileCode: 'aes-256',
          retentionPolicyCode: 'retain-7y',
        }),
      );
    });

    it('el catálogo sin formato ni compresión usa los defaults de negocio', async () => {
      const d = build();
      await d.service.registerCatalog(
        {
          code: 'glue-main',
          catalogType: 'glue',
          metastoreUri: 'arn:x',
        } as any,
        actor,
      );
      expect(d.catalogRepo.createCatalog).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          defaultFormat: 'parquet',
          defaultCompression: 'snappy',
        }),
      );
    });

    it('el dataset sin partición ni origen declarados usa los defaults de negocio', async () => {
      const d = build();
      await d.service.registerDataset(
        {
          tenantId: TENANT_ID,
          dataProductVersionId: VERSION_ID,
          dataLakeZoneId: ZONE_ID,
          lakehouseCatalogId: CATALOG_ID,
          databaseName: 'analytics',
          tableName: 'encounters',
          schemaJson: { fields: [] },
          schemaFingerprint: 'fp-1',
        } as any,
        actor,
      );
      expect(d.catalogRepo.createDataset).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          partitionSpecJson: {},
          sourceDatasetCode: '',
        }),
      );
    });

    it('publicar sin contrato de esquema responde 400 catalogado', async () => {
      const d = build();
      await expect(
        d.service.publishProductVersion(
          PRODUCT_ID,
          {
            tenantId: TENANT_ID,
            code: 'encuentros',
            name: 'Encuentros',
            version: '1.0.0',
            ownerTeamId: '77777777-7777-7777-7777-777777777777',
            businessPurpose: 'x',
            classificationCode: 'internal',
          } as any,
          actor,
        ),
      ).rejects.toMatchObject({
        response: {
          reason: LakehouseErrorReason.LAKEHOUSE_REQUIRED_FIELD_MISSING,
          details: { fields: ['contractSchemaJson'] },
        },
      });
      expect(d.catalogRepo.createProduct).not.toHaveBeenCalled();
    });

    it('crear un producto sin dueño, propósito o clasificación responde 400 y lista lo que falta', async () => {
      const d = build();
      await expect(
        d.service.publishProductVersion(
          PRODUCT_ID,
          {
            tenantId: TENANT_ID,
            code: 'encuentros',
            name: 'Encuentros',
            version: '1.0.0',
            contractSchemaJson: { fields: [] },
          } as any,
          actor,
        ),
      ).rejects.toMatchObject({
        response: {
          reason: LakehouseErrorReason.LAKEHOUSE_REQUIRED_FIELD_MISSING,
          details: {
            fields: ['ownerTeamId', 'businessPurpose', 'classificationCode'],
          },
        },
      });
      expect(d.catalogRepo.createProduct).not.toHaveBeenCalled();
    });

    it('la versión sin SLO y la regla sin expresión ni umbral usan defaults', async () => {
      const d = build();
      await d.service.publishProductVersion(
        PRODUCT_ID,
        {
          tenantId: TENANT_ID,
          code: 'encuentros',
          name: 'Encuentros',
          version: '1.0.0',
          ownerTeamId: '77777777-7777-7777-7777-777777777777',
          businessPurpose: 'x',
          classificationCode: 'internal',
          contractSchemaJson: { fields: [] },
          qualityRules: [
            { ruleCode: 'r', dimension: 'completeness', severity: 'info' },
          ],
        } as any,
        actor,
      );
      expect(d.catalogRepo.createProductVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ qualitySloJson: {} }),
      );
      expect(d.catalogRepo.createQualityRule).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ expression: '', threshold: '0' }),
      );
    });
  });

  describe('aislamiento por tenant (LAKE-01)', () => {
    const datasetDto = {
      tenantId: TENANT_ID,
      dataProductVersionId: VERSION_ID,
      dataLakeZoneId: ZONE_ID,
      lakehouseCatalogId: CATALOG_ID,
      databaseName: 'analytics',
      tableName: 'encounters',
      schemaJson: { fields: [] },
      schemaFingerprint: 'fp-1',
    } as any;
    const productDto = {
      tenantId: TENANT_ID,
      code: 'encuentros',
      name: 'Encuentros',
      version: '1.0.0',
      ownerTeamId: '77777777-7777-7777-7777-777777777777',
      businessPurpose: 'x',
      classificationCode: 'internal',
      contractSchemaJson: { fields: [] },
    } as any;

    it('registrar un dataset sobre una versión de otro tenant responde 404 uniforme y no escribe', async () => {
      const d = build();
      d.catalogRepo.findProductVersionInTenant.mockResolvedValue(null);
      const foreign = await d.service
        .registerDataset(datasetDto, actor)
        .catch((e: any) => e);

      expect(foreign.getStatus()).toBe(404);
      expect(foreign.reason).toBe(
        LakehouseErrorReason.LAKEHOUSE_RESOURCE_OUTSIDE_TENANT,
      );
      expect(foreign.details).toBeUndefined();
      expect(d.catalogRepo.createDataset).not.toHaveBeenCalled();
      expect(d.catalogRepo.findProductVersionInTenant).toHaveBeenCalledWith(
        d.tx,
        TENANT_ID,
        VERSION_ID,
      );
    });

    it('rechaza un tenantId del cuerpo distinto del activo', async () => {
      const d = build();
      const attempt = d.service.registerDataset(
        { ...datasetDto, tenantId: OTHER_TENANT_ID },
        actor,
      );
      await expect(attempt).rejects.toMatchObject({
        reason: LakehouseErrorReason.LAKEHOUSE_TENANT_MISMATCH,
      });
      expect(d.catalogRepo.createDataset).not.toHaveBeenCalled();
    });

    it('sin tenant activo no se registra nada (TENANT_REQUIRED)', async () => {
      const d = build();
      await expect(
        d.raw.registerDataset(datasetDto, actor),
      ).rejects.toMatchObject({ details: { reason: 'TENANT_REQUIRED' } });
      await expect(
        d.raw.publishProductVersion(PRODUCT_ID, productDto, actor),
      ).rejects.toMatchObject({ details: { reason: 'TENANT_REQUIRED' } });
    });

    it('la duplicidad de tabla se busca dentro del tenant', async () => {
      const d = build();
      await d.service.registerDataset(datasetDto, actor);
      expect(d.catalogRepo.findDatasetByTable).toHaveBeenCalledWith(
        d.tx,
        TENANT_ID,
        CATALOG_ID,
        'analytics',
        'encounters',
      );
    });

    it('publicar sobre el id de un producto de otro tenant responde 404 uniforme y no toca la fila', async () => {
      const d = build();
      const foreignProduct = {
        id: PRODUCT_ID,
        tenantId: OTHER_TENANT_ID,
        code: 'encuentros',
        lifecycleState: 'draft',
        name: 'Ajeno',
      };
      d.catalogRepo.findProductById.mockResolvedValue(foreignProduct);

      const foreign = await d.service
        .publishProductVersion(PRODUCT_ID, productDto, actor)
        .catch((e: any) => e);

      expect(foreign.getStatus()).toBe(404);
      expect(foreign.reason).toBe(
        LakehouseErrorReason.LAKEHOUSE_RESOURCE_OUTSIDE_TENANT,
      );
      expect(foreign.details).toBeUndefined();
      expect(foreignProduct.lifecycleState).toBe('draft');
      expect(foreignProduct.name).toBe('Ajeno');
      expect(d.catalogRepo.findProductForUpdate).not.toHaveBeenCalled();
      expect(d.catalogRepo.createProduct).not.toHaveBeenCalled();
      expect(d.catalogRepo.createProductVersion).not.toHaveBeenCalled();
    });

    it('el producto propio se busca y se bloquea con el tenant activo', async () => {
      const d = build();
      await d.service.publishProductVersion(PRODUCT_ID, productDto, actor);
      expect(d.catalogRepo.findProductForUpdate).toHaveBeenCalledWith(
        d.tx,
        TENANT_ID,
        PRODUCT_ID,
      );
      expect(d.catalogRepo.findProductByCode).toHaveBeenCalledWith(
        d.tx,
        TENANT_ID,
        'encuentros',
      );
    });
  });
});
