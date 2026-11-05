import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS, runWithTenant } from '../../../common';
import { TransformationService } from './transformation.service';
import { LakehouseErrorReason } from '../lakehouse.error-reasons';

const actor = { id: 'user-1', roles: ['SYSTEM'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const DEF_ID = '22222222-2222-2222-2222-222222222222';
const DATASET_ID = '33333333-3333-3333-3333-333333333333';
const SOURCE_DATASET_ID = '44444444-4444-4444-4444-444444444444';
const RUN_ID = '55555555-5555-5555-5555-555555555555';
const PROFILE_ID = '66666666-6666-6666-6666-666666666666';
const PURPOSE_ID = '77777777-7777-7777-7777-777777777777';
const OTHER_TENANT_ID = '99999999-9999-9999-9999-999999999999';
const OBJECT_ID = '88888888-8888-8888-8888-888888888888';

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

/**
 * Ejecuta la operación partition.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de partition.
 */
function partition(overrides: any = {}) {
  return {
    partitionSpecHash: 'ph-1',
    recordCount: '100',
    sizeBytes: '1000',
    minEventAt: '2026-01-01T00:00:00.000Z',
    maxEventAt: '2026-01-31T23:59:59.000Z',
    sourcePartitionIds: ['sp-1'],
    files: [
      {
        objectManifestId: OBJECT_ID,
        fileFormat: 'parquet',
        rowCount: '100',
        sizeBytes: '1000',
        contentHash: 'fh-1',
      },
    ],
    ...overrides,
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const runtimeRepo = {
    findDefinitionById: mockFn(async () => ({
      id: DEF_ID,
      tenantId: TENANT_ID,
      state: 'active',
      targetDatasetId: DATASET_ID,
      sourceDatasetIds: [SOURCE_DATASET_ID],
    })),
    findLiveRunByTargetForUpdate: mockFn(async () => null),
    findRunById: mockFn(async () => ({ id: RUN_ID, tenantId: TENANT_ID })),
    findPartitionById: mockFn(async (_tx: any, id: string) => ({
      id,
      lakehouseDatasetId: id.startsWith('sp-') ? SOURCE_DATASET_ID : DATASET_ID,
    })),
    createRun: mockFn((_tx: any, data: any) => ({ id: RUN_ID, ...data })),
    findPartitionByHash: mockFn(async () => null),
    createPartition: mockFn((_tx: any, data: any) => ({
      id: 'part-1',
      ...data,
    })),
    findFileByHash: mockFn(async () => null),
    createFile: mockFn((_tx: any, data: any) => ({ id: 'file-1', ...data })),
    createLineageEdge: mockFn((_tx: any, data: any) => ({
      id: 'edge-1',
      ...data,
    })),
    createQualityRun: mockFn((_tx: any, data: any) => ({
      id: 'qrun-1',
      ...data,
    })),
    createQualityIssue: mockFn((_tx: any, data: any) => ({
      id: 'issue-1',
      ...data,
    })),
  };
  const catalogRepo = {
    findDatasetById: mockFn(async () => ({
      id: DATASET_ID,
      tenantId: TENANT_ID,
      lifecycleState: 'active',
      dataLakeZoneId: 'zone-1',
      dataProductVersionId: 'ver-1',
    })),
    findDatasetForUpdate: mockFn(async () => ({
      id: DATASET_ID,
      tenantId: TENANT_ID,
      lifecycleState: 'active',
      dataProductVersionId: 'ver-1',
    })),
    findZoneById: mockFn(async () => ({ id: 'zone-1', zoneType: 'curated' })),
    findActiveQualityRules: mockFn(async () => []),
  };
  const dataReleaseRepo = {
    findDeidProfileById: mockFn(async () => ({
      id: PROFILE_ID,
      tenantId: TENANT_ID,
    })),
    createDeidRun: mockFn((_tx: any, data: any) => ({ id: 'deid-1', ...data })),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new TransformationService(
    em as any,
    runtimeRepo as any,
    catalogRepo as any,
    dataReleaseRepo as any,
    outbox as any,
    logger as any,
  );
  return {
    service: inTenant(service, TENANT_ID),
    raw: service,
    em,
    tx,
    runtimeRepo,
    catalogRepo,
    dataReleaseRepo,
    outbox,
    logger,
  };
}

const RUN_DTO = {
  tenantId: TENANT_ID,
  inputRecordCount: '100',
  outputRecordCount: '100',
  partitions: [partition()],
} as any;

describe('TransformationService', () => {
  describe('runTransformation (UC-63-05 y 06)', () => {
    it('materializa la partición, el archivo y el linaje', async () => {
      const d = build();

      const result = await d.service.runTransformation(DEF_ID, RUN_DTO, actor);

      expect(result.partitionsCommitted).toBe(1);
      expect(result.filesWritten).toBe(1);
      expect(result.lineageEdges).toBe(1);
      expect(result.status).toBe('succeeded');
    });

    it('salta la partición cuya huella ya existe', async () => {
      const d = build();
      d.runtimeRepo.findPartitionByHash.mockResolvedValue({
        id: 'part-previa',
      });

      const result = await d.service.runTransformation(DEF_ID, RUN_DTO, actor);

      expect(result.partitionsCommitted).toBe(0);
      expect(result.partitionsSkipped).toBe(1);
      expect(d.runtimeRepo.createPartition).not.toHaveBeenCalled();
    });

    it('salta el archivo cuyo hash ya existe', async () => {
      const d = build();
      d.runtimeRepo.findFileByHash.mockResolvedValue({ id: 'file-previo' });

      const result = await d.service.runTransformation(DEF_ID, RUN_DTO, actor);

      expect(result.filesWritten).toBe(0);
      expect(d.runtimeRepo.createFile).not.toHaveBeenCalled();
    });

    it('devuelve la corrida viva en vez de abrir otra', async () => {
      const d = build();
      d.runtimeRepo.findLiveRunByTargetForUpdate.mockResolvedValue({
        id: 'run-previa',
        status: 'running',
      });

      const result = await d.service.runTransformation(DEF_ID, RUN_DTO, actor);

      expect(result.alreadyRunning).toBe(true);
      expect(d.runtimeRepo.createRun).not.toHaveBeenCalled();
    });

    it('registra una arista de linaje por partición fuente', async () => {
      const d = build();

      const result = await d.service.runTransformation(
        DEF_ID,
        {
          ...RUN_DTO,
          partitions: [partition({ sourcePartitionIds: ['sp-1', 'sp-2'] })],
        },
        actor,
      );

      expect(result.lineageEdges).toBe(2);
    });

    it('marcar fallo cierra la corrida como fallida', async () => {
      const d = build();

      const result = await d.service.runTransformation(
        DEF_ID,
        { ...RUN_DTO, failed: true },
        actor,
      );

      expect(result.status).toBe('failed');
    });

    it('rechaza una definición que no está activa', async () => {
      const d = build();
      d.runtimeRepo.findDefinitionById.mockResolvedValue({
        id: DEF_ID,
        tenantId: TENANT_ID,
        state: 'draft',
      });

      await expect(
        d.service.runTransformation(DEF_ID, RUN_DTO, actor),
      ).rejects.toThrow(/no está activa/);
    });

    it('rechaza escribir en un dataset en cuarentena', async () => {
      const d = build();
      d.catalogRepo.findDatasetById.mockResolvedValue({
        id: DATASET_ID,
        tenantId: TENANT_ID,
        lifecycleState: 'quarantined',
      });

      await expect(
        d.service.runTransformation(DEF_ID, RUN_DTO, actor),
      ).rejects.toThrow(/no está activo/);
    });
  });

  describe('ingestCurated (UC-63-07)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      targetDatasetId: DATASET_ID,
      deidentificationProfileId: PROFILE_ID,
      purposeConceptId: PURPOSE_ID,
      recordsProcessed: '500',
      partitions: [partition()],
    } as any;

    it('registra la corrida de de-identificación y materializa', async () => {
      const d = build();

      const result = await d.service.ingestCurated(DTO, actor);

      expect(result.deidentificationRunId).toBe('deid-1');
      expect(result.partitionsCommitted).toBe(1);
      expect(
        d.dataReleaseRepo.createDeidRun.mock.calls[0][1].statusConceptId,
      ).toBe(CONCEPTS.DEID_COMPLETED);
    });

    it('rechaza escribir fuera de la zona curated', async () => {
      const d = build();
      d.catalogRepo.findZoneById.mockResolvedValue({
        id: 'zone-1',
        zoneType: 'raw',
      });

      await expect(d.service.ingestCurated(DTO, actor)).rejects.toThrow(
        /zona curated/,
      );
    });

    it('rechaza un perfil de de-identificación inexistente', async () => {
      const d = build();
      d.dataReleaseRepo.findDeidProfileById.mockResolvedValue(null);

      await expect(d.service.ingestCurated(DTO, actor)).rejects.toThrow(
        /Perfil de de-identificación/,
      );
    });

    it('no registra linaje: la ingesta curada no viene de otro dataset del lago', async () => {
      const d = build();

      await d.service.ingestCurated(DTO, actor);

      expect(d.runtimeRepo.createLineageEdge).not.toHaveBeenCalled();
    });
  });

  describe('runQualityCheck (UC-63-08)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      evaluatedRecordCount: '1000',
      transformationRunId: RUN_ID,
    } as any;
    const finding = (overrides: any = {}) => ({
      ruleCode: 'no-nulls',
      issueCount: '1',
      partitionId: 'part-1',
      sampleObjectManifestId: OBJECT_ID,
      ...overrides,
    });

    /**
     * Ejecuta la operación with rule.
     *
     * @param d - Valor de d requerido por la operación.
     * @param overrides - Valor de overrides requerido por la operación.
     * @returns Resultado de with rule.
     */
    function withRule(d: ReturnType<typeof build>, overrides: any = {}) {
      d.catalogRepo.findActiveQualityRules.mockResolvedValue([
        {
          id: 'rule-1',
          ruleCode: 'no-nulls',
          severity: 'warning',
          ...overrides,
        },
      ]);
    }

    it('pasa cuando no hay hallazgos', async () => {
      const d = build();

      const result = await d.service.runQualityCheck(DATASET_ID, DTO, actor);

      expect(result.status).toBe('passed');
      expect(result.issuesOpened).toBe(0);
      expect(result.datasetQuarantined).toBe(false);
    });

    it('abre el hallazgo y suma los registros fallidos', async () => {
      const d = build();
      withRule(d);

      const result = await d.service.runQualityCheck(
        DATASET_ID,
        { ...DTO, findings: [finding({ issueCount: '7' })] },
        actor,
      );

      expect(result.status).toBe('failed');
      expect(result.issuesOpened).toBe(1);
      expect(result.failedRecordCount).toBe('7');
    });

    it('una regla bloqueante sin umbral cuarentena con una sola incidencia', async () => {
      const d = build();
      withRule(d, { severity: 'blocking' });
      const dataset = {
        id: DATASET_ID,
        tenantId: TENANT_ID,
        lifecycleState: 'active',
        dataProductVersionId: 'ver-1',
      };
      d.catalogRepo.findDatasetForUpdate.mockResolvedValue(dataset);

      const result = await d.service.runQualityCheck(
        DATASET_ID,
        { ...DTO, findings: [finding({ issueCount: '1' })] },
        actor,
      );

      expect(result.datasetQuarantined).toBe(true);
      expect(dataset.lifecycleState).toBe('quarantined');
      expect(d.logger.warn).toHaveBeenCalled();
    });

    it('una regla bloqueante con umbral no cuarentena por debajo de él', async () => {
      const d = build();
      withRule(d, { severity: 'blocking', threshold: '10' });

      const result = await d.service.runQualityCheck(
        DATASET_ID,
        { ...DTO, findings: [finding({ issueCount: '5' })] },
        actor,
      );

      expect(result.datasetQuarantined).toBe(false);
      expect(result.status).toBe('failed');
    });

    it('una regla de aviso no cuarentena aunque falle mucho', async () => {
      const d = build();
      withRule(d, { severity: 'warning' });

      const result = await d.service.runQualityCheck(
        DATASET_ID,
        { ...DTO, findings: [finding({ issueCount: '9999' })] },
        actor,
      );

      expect(result.datasetQuarantined).toBe(false);
    });

    it('rechaza un hallazgo que cita una regla no activa', async () => {
      const d = build();

      await expect(
        d.service.runQualityCheck(
          DATASET_ID,
          { ...DTO, findings: [finding({ ruleCode: 'inventada' })] },
          actor,
        ),
      ).rejects.toThrow(/no está activa/);
    });
  });
  describe('contrato mínimo y defaults (LAKE-02)', () => {
    const expectMissing = async (
      attempt: Promise<unknown>,
      fields: string[],
    ) => {
      await expect(attempt).rejects.toMatchObject({
        response: {
          code: 'VALIDATION_FAILED',
          reason: LakehouseErrorReason.LAKEHOUSE_REQUIRED_FIELD_MISSING,
          details: { fields },
        },
      });
    };

    it('una partición nueva sin ventana de eventos responde 400 catalogado y no persiste', async () => {
      const d = build();
      await expectMissing(
        d.service.runTransformation(
          DEF_ID,
          {
            ...RUN_DTO,
            partitions: [
              partition({ minEventAt: undefined, maxEventAt: undefined }),
            ],
          },
          actor,
        ),
        ['minEventAt', 'maxEventAt'],
      );
      expect(d.runtimeRepo.createPartition).not.toHaveBeenCalled();
    });

    it('una partición que ya existe no exige de nuevo la ventana de eventos', async () => {
      const d = build();
      d.runtimeRepo.findPartitionByHash.mockResolvedValue({ id: 'previa' });
      const result = await d.service.runTransformation(
        DEF_ID,
        {
          ...RUN_DTO,
          partitions: [
            partition({ minEventAt: undefined, maxEventAt: undefined }),
          ],
        },
        actor,
      );
      expect(result.partitionsSkipped).toBe(1);
    });

    it('un archivo nuevo sin objectManifestId responde 400 catalogado y no se crea', async () => {
      const d = build();
      await expectMissing(
        d.service.runTransformation(
          DEF_ID,
          {
            ...RUN_DTO,
            partitions: [
              partition({
                files: [
                  {
                    fileFormat: 'parquet',
                    rowCount: '1',
                    sizeBytes: '1',
                    contentHash: 'fh-x',
                  },
                ],
              }),
            ],
          },
          actor,
        ),
        ['objectManifestId'],
      );
      expect(d.runtimeRepo.createFile).not.toHaveBeenCalled();
    });

    it('un linaje sin partición de origen responde 400 catalogado', async () => {
      const d = build();
      await expectMissing(
        d.service.runTransformation(
          DEF_ID,
          {
            ...RUN_DTO,
            partitions: [partition({ sourcePartitionIds: [] })],
          },
          actor,
        ),
        ['sourcePartitionIds'],
      );
      expect(d.runtimeRepo.createLineageEdge).not.toHaveBeenCalled();
    });

    it('límite: payload mínimo documentado usa los defaults y persiste todos los campos NOT NULL', async () => {
      const d = build();
      await d.service.runTransformation(
        DEF_ID,
        {
          tenantId: TENANT_ID,
          inputRecordCount: '1',
          outputRecordCount: '1',
          partitions: [partition()],
        } as any,
        actor,
      );

      expect(d.runtimeRepo.createRun).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ sourceCheckpoint: '' }),
      );
      expect(d.runtimeRepo.createPartition).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          partitionValuesJson: {},
          minEventAt: new Date('2026-01-01T00:00:00.000Z'),
          maxEventAt: new Date('2026-01-31T23:59:59.000Z'),
        }),
      );
      expect(d.runtimeRepo.createFile).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          objectManifestId: OBJECT_ID,
          minMaxStatisticsJson: {},
        }),
      );
      expect(d.runtimeRepo.createLineageEdge).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          sourceDatasetId: SOURCE_DATASET_ID,
          sourcePartitionId: 'sp-1',
          targetPartitionId: 'part-1',
        }),
      );
    });

    it('la corrida de calidad sin transformationRunId responde 400 catalogado', async () => {
      const d = build();
      await expectMissing(
        d.service.runQualityCheck(
          DATASET_ID,
          { tenantId: TENANT_ID, evaluatedRecordCount: '10' } as any,
          actor,
        ),
        ['transformationRunId'],
      );
      expect(d.runtimeRepo.createQualityRun).not.toHaveBeenCalled();
    });

    it('un hallazgo sin partición ni muestra responde 400 catalogado y no abre incidencias', async () => {
      const d = build();
      await expectMissing(
        d.service.runQualityCheck(
          DATASET_ID,
          {
            tenantId: TENANT_ID,
            evaluatedRecordCount: '10',
            transformationRunId: RUN_ID,
            findings: [{ ruleCode: 'no-nulls', issueCount: '1' }],
          } as any,
          actor,
        ),
        ['partitionId', 'sampleObjectManifestId'],
      );
      expect(d.runtimeRepo.createQualityRun).not.toHaveBeenCalled();
      expect(d.runtimeRepo.createQualityIssue).not.toHaveBeenCalled();
    });
  });

  describe('aislamiento por tenant (LAKE-01)', () => {
    const outside = async (attempt: Promise<unknown>) => {
      const error: any = await attempt.catch((e) => e);
      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(
        LakehouseErrorReason.LAKEHOUSE_RESOURCE_OUTSIDE_TENANT,
      );
      expect(error.details).toBeUndefined();
      return error;
    };

    it('ejecutar la definición de otro tenant responde 404 uniforme, sin corrida ni evento', async () => {
      const d = build();
      d.runtimeRepo.findDefinitionById.mockResolvedValue({
        id: DEF_ID,
        tenantId: OTHER_TENANT_ID,
        state: 'active',
        targetDatasetId: DATASET_ID,
        sourceDatasetIds: [],
      });
      const foreign = await outside(
        d.service.runTransformation(DEF_ID, RUN_DTO, actor),
      );
      d.runtimeRepo.findDefinitionById.mockResolvedValue(null);
      const missing = await outside(
        d.service.runTransformation(DEF_ID, RUN_DTO, actor),
      );

      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(d.runtimeRepo.createRun).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
      expect(d.runtimeRepo.findDefinitionById).toHaveBeenCalledWith(
        d.tx,
        TENANT_ID,
        DEF_ID,
      );
    });

    it('un dataset de origen de otro tenant impide la corrida', async () => {
      const d = build();
      d.catalogRepo.findDatasetById.mockImplementation(
        async (_tx: any, _tenant: string, id: string) =>
          id === SOURCE_DATASET_ID
            ? null
            : {
                id: DATASET_ID,
                tenantId: TENANT_ID,
                lifecycleState: 'active',
              },
      );
      await outside(d.service.runTransformation(DEF_ID, RUN_DTO, actor));
      expect(d.runtimeRepo.createRun).not.toHaveBeenCalled();
      expect(d.runtimeRepo.createLineageEdge).not.toHaveBeenCalled();
    });

    it('una partición de origen que no es de los datasets de la definición no entra al linaje', async () => {
      const d = build();
      d.runtimeRepo.findPartitionById.mockResolvedValue({
        id: 'sp-ajena',
        lakehouseDatasetId: 'dataset-de-otro-tenant',
      });
      await outside(
        d.service.runTransformation(
          DEF_ID,
          {
            ...RUN_DTO,
            partitions: [partition({ sourcePartitionIds: ['sp-ajena'] })],
          },
          actor,
        ),
      );
      expect(d.runtimeRepo.createLineageEdge).not.toHaveBeenCalled();
    });

    it('rechaza un tenantId del cuerpo distinto del activo', async () => {
      const d = build();
      await expect(
        d.service.runTransformation(
          DEF_ID,
          { ...RUN_DTO, tenantId: OTHER_TENANT_ID },
          actor,
        ),
      ).rejects.toMatchObject({
        reason: LakehouseErrorReason.LAKEHOUSE_TENANT_MISMATCH,
      });
      expect(d.runtimeRepo.createRun).not.toHaveBeenCalled();
    });

    it('sin tenant activo no se ejecuta nada (TENANT_REQUIRED)', async () => {
      const d = build();
      await expect(
        d.raw.runTransformation(DEF_ID, RUN_DTO, actor),
      ).rejects.toMatchObject({ details: { reason: 'TENANT_REQUIRED' } });
      expect(d.runtimeRepo.findDefinitionById).not.toHaveBeenCalled();
    });

    it('ingerir en el dataset de otro tenant responde 404 uniforme y no escribe', async () => {
      const d = build();
      d.catalogRepo.findDatasetById.mockResolvedValue(null);
      await outside(
        d.service.ingestCurated(
          {
            tenantId: TENANT_ID,
            targetDatasetId: DATASET_ID,
            deidentificationProfileId: PROFILE_ID,
            purposeConceptId: PURPOSE_ID,
            recordsProcessed: '5',
            partitions: [partition()],
          } as any,
          actor,
        ),
      );
      expect(d.dataReleaseRepo.createDeidRun).not.toHaveBeenCalled();
      expect(d.runtimeRepo.createPartition).not.toHaveBeenCalled();
    });

    it('ingerir con el perfil de de-identificación de otro tenant responde 404 uniforme', async () => {
      const d = build();
      d.dataReleaseRepo.findDeidProfileById.mockResolvedValue({
        id: PROFILE_ID,
        tenantId: OTHER_TENANT_ID,
      });
      await outside(
        d.service.ingestCurated(
          {
            tenantId: TENANT_ID,
            targetDatasetId: DATASET_ID,
            deidentificationProfileId: PROFILE_ID,
            purposeConceptId: PURPOSE_ID,
            recordsProcessed: '5',
            partitions: [partition()],
          } as any,
          actor,
        ),
      );
      expect(d.dataReleaseRepo.createDeidRun).not.toHaveBeenCalled();
    });

    it('evaluar la calidad de un dataset de otro tenant no crea corrida ni cuarentena', async () => {
      const d = build();
      const foreign = {
        id: DATASET_ID,
        tenantId: OTHER_TENANT_ID,
        lifecycleState: 'active',
        dataProductVersionId: 'ver-1',
      };
      d.catalogRepo.findDatasetForUpdate.mockResolvedValue(foreign);
      await outside(
        d.service.runQualityCheck(
          DATASET_ID,
          {
            tenantId: TENANT_ID,
            evaluatedRecordCount: '10',
            transformationRunId: RUN_ID,
          } as any,
          actor,
        ),
      );
      expect(foreign.lifecycleState).toBe('active');
      expect(d.runtimeRepo.createQualityRun).not.toHaveBeenCalled();
      expect(d.catalogRepo.findDatasetForUpdate).toHaveBeenCalledWith(
        d.tx,
        TENANT_ID,
        DATASET_ID,
      );
    });

    it('una corrida de transformación de otro tenant no se puede evaluar', async () => {
      const d = build();
      d.runtimeRepo.findRunById.mockResolvedValue({
        id: RUN_ID,
        tenantId: OTHER_TENANT_ID,
      });
      await outside(
        d.service.runQualityCheck(
          DATASET_ID,
          {
            tenantId: TENANT_ID,
            evaluatedRecordCount: '10',
            transformationRunId: RUN_ID,
          } as any,
          actor,
        ),
      );
      expect(d.runtimeRepo.createQualityRun).not.toHaveBeenCalled();
    });

    it('un hallazgo sobre una partición de otro dataset responde 404 uniforme', async () => {
      const d = build();
      d.runtimeRepo.findPartitionById.mockResolvedValue({
        id: 'part-x',
        lakehouseDatasetId: 'otro-dataset',
      });
      await outside(
        d.service.runQualityCheck(
          DATASET_ID,
          {
            tenantId: TENANT_ID,
            evaluatedRecordCount: '10',
            transformationRunId: RUN_ID,
            findings: [
              {
                ruleCode: 'no-nulls',
                issueCount: '1',
                partitionId: 'part-x',
                sampleObjectManifestId: OBJECT_ID,
              },
            ],
          } as any,
          actor,
        ),
      );
      expect(d.runtimeRepo.createQualityRun).not.toHaveBeenCalled();
    });
  });
});
