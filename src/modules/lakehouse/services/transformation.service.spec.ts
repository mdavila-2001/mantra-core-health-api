import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { CONCEPTS } from '../../../common';
import { TransformationService } from './transformation.service';

const actor = { id: 'user-1', roles: ['SYSTEM'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const DEF_ID = '22222222-2222-2222-2222-222222222222';
const DATASET_ID = '33333333-3333-3333-3333-333333333333';
const SOURCE_DATASET_ID = '44444444-4444-4444-4444-444444444444';
const RUN_ID = '55555555-5555-5555-5555-555555555555';
const PROFILE_ID = '66666666-6666-6666-6666-666666666666';
const PURPOSE_ID = '77777777-7777-7777-7777-777777777777';

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
    files: [
      {
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
      state: 'active',
      targetDatasetId: DATASET_ID,
      sourceDatasetIds: [SOURCE_DATASET_ID],
    })),
    findLiveRunByTargetForUpdate: mockFn(async () => null),
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
      lifecycleState: 'active',
      dataLakeZoneId: 'zone-1',
      dataProductVersionId: 'ver-1',
    })),
    findDatasetForUpdate: mockFn(async () => ({
      id: DATASET_ID,
      lifecycleState: 'active',
      dataProductVersionId: 'ver-1',
    })),
    findZoneById: mockFn(async () => ({ id: 'zone-1', zoneType: 'curated' })),
    findActiveQualityRules: mockFn(async () => []),
  };
  const dataReleaseRepo = {
    findDeidProfileById: mockFn(async () => ({ id: PROFILE_ID })),
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
    service,
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
    const DTO = { tenantId: TENANT_ID, evaluatedRecordCount: '1000' } as any;

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
        { ...DTO, findings: [{ ruleCode: 'no-nulls', issueCount: '7' }] },
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
        lifecycleState: 'active',
        dataProductVersionId: 'ver-1',
      };
      d.catalogRepo.findDatasetForUpdate.mockResolvedValue(dataset);

      const result = await d.service.runQualityCheck(
        DATASET_ID,
        { ...DTO, findings: [{ ruleCode: 'no-nulls', issueCount: '1' }] },
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
        { ...DTO, findings: [{ ruleCode: 'no-nulls', issueCount: '5' }] },
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
        { ...DTO, findings: [{ ruleCode: 'no-nulls', issueCount: '9999' }] },
        actor,
      );

      expect(result.datasetQuarantined).toBe(false);
    });

    it('rechaza un hallazgo que cita una regla no activa', async () => {
      const d = build();

      await expect(
        d.service.runQualityCheck(
          DATASET_ID,
          { ...DTO, findings: [{ ruleCode: 'inventada', issueCount: '1' }] },
          actor,
        ),
      ).rejects.toThrow(/no está activa/);
    });
  });
});
