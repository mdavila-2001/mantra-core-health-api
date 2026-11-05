import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { HealthIngestionService } from './health-ingestion.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { HealthDataErrorReason } from '../health_data.error-reasons';

const actor = { id: 'user-1', roles: ['INGESTION_WORKER'] };
const CONNECTION = '11111111-1111-1111-1111-111111111111';
const BATCH = '22222222-2222-2222-2222-222222222222';
const RECORD = '33333333-3333-3333-3333-333333333333';
const RESOURCE = '44444444-4444-4444-4444-444444444444';
const VERSION = '55555555-5555-5555-5555-555555555555';
const TYPE = '66666666-6666-6666-6666-666666666666';
const TENANT = '77777777-7777-7777-7777-777777777777';
const OTHER_TENANT = '88888888-8888-8888-8888-888888888888';
const SYSTEM = '99999999-9999-9999-9999-999999999999';

/**
 * Ejecuta cada método del servicio dentro del contexto de tenant, como lo hace
 * `TenantContextInterceptor` en una petición real.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant activo del contexto.
 * @returns Proxy que fija el tenant en cada llamada.
 */
function scoped<S extends object>(service: S, tenantId: string): S {
  return new Proxy(service, {
    get(target, key) {
      const value = (target as any)[key];
      return typeof value === 'function'
        ? (...args: unknown[]) =>
            runWithTenant(tenantId, () => value.apply(target, args))
        : value;
    },
  });
}

/**
 * Afirma que la promesa falla como "no existe": 404, el `reason` dado y sin `details`.
 *
 * @param promise - Operación bajo prueba.
 * @param reason - Sub-código esperado.
 */
async function expectNotAvailable(
  promise: Promise<unknown>,
  reason: HealthDataErrorReason,
): Promise<void> {
  const error: any = await promise.then(
    () => undefined,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  expect(error.getStatus()).toBe(404);
  expect(error.code).toBe('NOT_FOUND');
  expect(error.reason).toBe(reason);
  expect(error.details).toBeUndefined();
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const ingestionRepo = {
    findSourceSystemByCode: mockFn().mockResolvedValue(null),
    findSourceSystemById: mockFn().mockResolvedValue({
      id: SYSTEM,
      tenantId: TENANT,
    }),
    findConnectionById: mockFn().mockResolvedValue({
      id: CONNECTION,
      healthSourceSystemId: SYSTEM,
    }),
    createSourceSystem: mockFn(),
    createConnection: mockFn(),
    findConnectionForUpdate: mockFn(),
    createBatch: mockFn(() => ({ id: BATCH })),
    findBatchById: mockFn().mockResolvedValue({
      id: BATCH,
      tenantId: TENANT,
      healthSourceConnectionId: CONNECTION,
    }),
    findBatchForUpdate: mockFn(),
    findBatchByIdentifier: mockFn(() => Promise.resolve(null)),
    createRecord: mockFn(() => ({ id: RECORD })),
    findRecordById: mockFn(),
    findRecordForUpdate: mockFn(),
    findRecordBySource: mockFn(() => Promise.resolve(null)),
    findRecordsByBatch: mockFn(() => Promise.resolve([])),
  };
  const resourcesRepo = {
    createResource: mockFn(() => ({ id: RESOURCE })),
    findResourceByLogicalIdForUpdate: mockFn(() => Promise.resolve(null)),
    createResourceVersion: mockFn(() => ({ id: VERSION })),
    findLatestVersion: mockFn(() => Promise.resolve(null)),
  };
  const provenanceRepo = {
    createProvenanceRecord: mockFn(() => ({ id: 'provenance-1' })),
    createProvenanceTarget: mockFn(() => ({ id: 'target-1' })),
    createLineageEdge: mockFn(() => ({ id: 'edge-1' })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const raw = new HealthIngestionService(
    em as any,
    ingestionRepo,
    resourcesRepo as any,
    provenanceRepo,
    logger as any,
  );
  const service = scoped(raw, TENANT);
  return {
    service,
    rawService: raw,
    tx,
    ingestionRepo,
    resourcesRepo,
    provenanceRepo,
    logger,
  };
}

/**
 * Ejecuta la operación active connection.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de active connection conforme al contrato `any`.
 */
function activeConnection(overrides: Record<string, unknown> = {}): any {
  return {
    id: CONNECTION,
    healthSourceSystemId: SYSTEM,
    statusConceptId: CONCEPTS.STATE_ACTIVE,
    ...overrides,
  };
}

/**
 * Ejecuta la operación receiving batch.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de receiving batch conforme al contrato `any`.
 */
function receivingBatch(overrides: Record<string, unknown> = {}): any {
  return {
    id: BATCH,
    tenantId: TENANT,
    statusConceptId: CONCEPTS.BATCH_RECEIVING,
    ...overrides,
  };
}

/**
 * Ejecuta la operación queued record.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de queued record conforme al contrato `any`.
 */
function queuedRecord(overrides: Record<string, unknown> = {}): any {
  return {
    id: RECORD,
    healthIngestionBatchId: BATCH,
    resourceTypeConceptId: TYPE,
    processingStatusConceptId: CONCEPTS.RECORD_QUEUED,
    ...overrides,
  };
}

describe('HealthIngestionService', () => {
  describe('openBatch (UC-52-01)', () => {
    const dto: any = {
      healthSourceConnectionId: CONNECTION,
      batchIdentifier: 'BATCH-2026-07-20',
      ingestionModeConceptId: TYPE,
    };

    it('opens the batch and stamps the connection', async () => {
      const d = build();
      const connection = activeConnection();
      d.ingestionRepo.findConnectionForUpdate.mockResolvedValue(connection);

      const res = await d.service.openBatch(dto, actor);

      expect(res).toEqual({
        id: BATCH,
        batchIdentifier: 'BATCH-2026-07-20',
        statusConceptId: CONCEPTS.BATCH_RECEIVING,
        duplicate: false,
      });
      expect(connection.lastSuccessAt).toBeInstanceOf(Date);
    });

    it('does not reopen a batch that already exists', async () => {
      const d = build();
      d.ingestionRepo.findConnectionForUpdate.mockResolvedValue(
        activeConnection(),
      );
      d.ingestionRepo.findBatchByIdentifier.mockResolvedValue({
        id: 'batch-prev',
        statusConceptId: CONCEPTS.BATCH_COMPLETED,
      });

      const res = await d.service.openBatch(dto, actor);

      expect(res).toEqual({
        id: 'batch-prev',
        batchIdentifier: 'BATCH-2026-07-20',
        statusConceptId: CONCEPTS.BATCH_COMPLETED,
        duplicate: true,
      });
      expect(d.ingestionRepo.createBatch).not.toHaveBeenCalled();
    });

    it('refuses a connection that is not active', async () => {
      const d = build();
      d.ingestionRepo.findConnectionForUpdate.mockResolvedValue(
        activeConnection({ statusConceptId: CONCEPTS.STATE_REVOKED }),
      );

      await expect(
        d.service.openBatch(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the connection does not exist', async () => {
      const d = build();
      d.ingestionRepo.findConnectionForUpdate.mockResolvedValue(null);

      await expect(
        d.service.openBatch(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('recordIngestionRecord (UC-52-02)', () => {
    const dto: any = {
      sourceRecordIdentifier: 'Patient/123',
      resourceTypeConceptId: TYPE,
      payloadHash: 'hash-1',
    };

    it('queues the record for projection', async () => {
      const d = build();
      d.ingestionRepo.findBatchForUpdate.mockResolvedValue(receivingBatch());

      const res = await d.service.recordIngestionRecord(BATCH, dto);

      expect(res).toEqual({
        id: RECORD,
        processingStatusConceptId: CONCEPTS.RECORD_QUEUED,
        duplicate: false,
      });
      expect(d.ingestionRepo.createRecord).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          validationStatusConceptId: CONCEPTS.RECORD_VALIDATION_PENDING,
        }),
      );
    });

    it('does not queue the same record twice', async () => {
      const d = build();
      d.ingestionRepo.findBatchForUpdate.mockResolvedValue(receivingBatch());
      d.ingestionRepo.findRecordBySource.mockResolvedValue({
        id: 'record-prev',
        processingStatusConceptId: CONCEPTS.RECORD_PROJECTED,
      });

      const res = await d.service.recordIngestionRecord(BATCH, dto);

      expect(res.duplicate).toBe(true);
      expect(d.ingestionRepo.createRecord).not.toHaveBeenCalled();
    });

    it('refuses adding records to a closed batch', async () => {
      const d = build();
      d.ingestionRepo.findBatchForUpdate.mockResolvedValue(
        receivingBatch({ statusConceptId: CONCEPTS.BATCH_COMPLETED }),
      );

      await expect(
        d.service.recordIngestionRecord(BATCH, dto),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the batch does not exist', async () => {
      const d = build();
      d.ingestionRepo.findBatchForUpdate.mockResolvedValue(null);

      await expect(
        d.service.recordIngestionRecord(BATCH, dto),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('closeBatch (UC-52-02)', () => {
    it('reconciles the counters against the records table', async () => {
      const d = build();
      const batch = receivingBatch();
      d.ingestionRepo.findBatchForUpdate.mockResolvedValue(batch);
      d.ingestionRepo.findRecordsByBatch.mockResolvedValue([
        { id: 'a' },
        { id: 'b' },
      ]);

      const res = await d.service.closeBatch(BATCH, {
        recordsRejected: 1,
      });

      expect(res).toEqual({
        id: BATCH,
        statusConceptId: CONCEPTS.BATCH_COMPLETED,
        recordsReceived: '3',
        recordsAccepted: '2',
        recordsRejected: '1',
      });
      expect(batch.completedAt).toBeInstanceOf(Date);
    });

    it('closes an empty batch with zeroed counters', async () => {
      const d = build();
      d.ingestionRepo.findBatchForUpdate.mockResolvedValue(receivingBatch());

      const res = await d.service.closeBatch(BATCH, {});

      expect(res.recordsReceived).toBe('0');
      expect(res.recordsRejected).toBe('0');
    });

    it('refuses closing the batch twice', async () => {
      const d = build();
      d.ingestionRepo.findBatchForUpdate.mockResolvedValue(
        receivingBatch({ statusConceptId: CONCEPTS.BATCH_COMPLETED }),
      );

      await expect(
        d.service.closeBatch(BATCH, {} as any),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('fails when the batch does not exist', async () => {
      const d = build();
      d.ingestionRepo.findBatchForUpdate.mockResolvedValue(null);

      await expect(
        d.service.closeBatch(BATCH, {} as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('projectResource (UC-52-03)', () => {
    const dto: any = {
      healthIngestionRecordId: RECORD,
      logicalIdentifier: 'Patient/123',
      normalizedPayloadJson: { resourceType: 'Patient', id: '123' },
      custodianTenantId: TENANT,
    };

    it('creates the resource and its first version', async () => {
      const d = build();
      const record = queuedRecord();
      d.ingestionRepo.findRecordForUpdate.mockResolvedValue(record);

      const res = await d.service.projectResource(dto, actor);

      expect(res).toMatchObject({
        resourceId: RESOURCE,
        versionId: VERSION,
        versionNumber: 1,
        created: true,
        unchanged: false,
        provenanceRecordId: 'provenance-1',
      });
      expect(record.processingStatusConceptId).toBe(CONCEPTS.RECORD_PROJECTED);
      expect(record.canonicalResourceId).toBe(RESOURCE);
      expect(d.resourcesRepo.createResourceVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          changeTypeConceptId: CONCEPTS.RESOURCE_CHANGE_CREATE,
        }),
      );
    });

    it('versions an existing resource as an update superseding the previous version', async () => {
      const d = build();
      const resource: any = {
        id: RESOURCE,
        lifecycleStatusConceptId: CONCEPTS.RESOURCE_ACTIVE,
        custodianTenantId: TENANT,
      };
      d.ingestionRepo.findRecordForUpdate.mockResolvedValue(queuedRecord());
      d.resourcesRepo.findResourceByLogicalIdForUpdate.mockResolvedValue(
        resource,
      );
      d.resourcesRepo.findLatestVersion.mockResolvedValue({
        id: 'version-prev',
        versionNumber: 4,
        contentHash: 'otro-hash',
      });

      const res = await d.service.projectResource(dto, actor);

      expect(res.versionNumber).toBe(5);
      expect(res.created).toBe(false);
      expect(resource.currentVersionId).toBe(VERSION);
      expect(d.resourcesRepo.createResourceVersion).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          changeTypeConceptId: CONCEPTS.RESOURCE_CHANGE_UPDATE,
          supersedesVersionId: 'version-prev',
        }),
      );
    });

    it('does not version an identical payload', async () => {
      const d = build();
      const record = queuedRecord();
      d.ingestionRepo.findRecordForUpdate.mockResolvedValue(record);
      d.resourcesRepo.findResourceByLogicalIdForUpdate.mockResolvedValue({
        id: RESOURCE,
        lifecycleStatusConceptId: CONCEPTS.RESOURCE_ACTIVE,
      });
      const first = build();
      first.ingestionRepo.findRecordForUpdate.mockResolvedValue(queuedRecord());
      const projected = await first.service.projectResource(dto, actor);
      d.resourcesRepo.findLatestVersion.mockResolvedValue({
        id: 'version-prev',
        versionNumber: 4,
        contentHash: projected.contentHash,
      });

      const res = await d.service.projectResource(dto, actor);

      expect(res.unchanged).toBe(true);
      expect(res.versionId).toBeUndefined();
      expect(record.processingStatusConceptId).toBe(CONCEPTS.RECORD_PROJECTED);
      expect(d.resourcesRepo.createResourceVersion).not.toHaveBeenCalled();
    });

    it('hashes the payload regardless of key order', async () => {
      const d = build();
      d.ingestionRepo.findRecordForUpdate.mockResolvedValue(queuedRecord());

      const first = await d.service.projectResource(dto, actor);
      d.ingestionRepo.findRecordForUpdate.mockResolvedValue(queuedRecord());
      const second = await d.service.projectResource(
        {
          ...dto,
          normalizedPayloadJson: { id: '123', resourceType: 'Patient' },
        },
        actor,
      );

      expect(first.contentHash).toBe(second.contentHash);
    });

    it('writes provenance and a normalisation lineage edge', async () => {
      const d = build();
      d.ingestionRepo.findRecordForUpdate.mockResolvedValue(queuedRecord());

      await d.service.projectResource(dto, actor);

      expect(d.provenanceRepo.createProvenanceRecord).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ activityConceptId: CONCEPTS.PROV_INGEST }),
      );
      expect(d.provenanceRepo.createLineageEdge).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          sourceTypeConceptId: CONCEPTS.HD_ENTITY_INGESTION_RECORD,
          targetTypeConceptId: CONCEPTS.HD_ENTITY_RESOURCE_VERSION,
          transformationTypeConceptId: CONCEPTS.LINEAGE_NORMALIZE,
        }),
      );
    });

    it('refuses projecting a record that is not queued', async () => {
      const d = build();
      d.ingestionRepo.findRecordForUpdate.mockResolvedValue(
        queuedRecord({ processingStatusConceptId: CONCEPTS.RECORD_PROJECTED }),
      );

      await expect(
        d.service.projectResource(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('refuses projecting onto a retired resource', async () => {
      const d = build();
      d.ingestionRepo.findRecordForUpdate.mockResolvedValue(queuedRecord());
      d.resourcesRepo.findResourceByLogicalIdForUpdate.mockResolvedValue({
        id: RESOURCE,
        lifecycleStatusConceptId: CONCEPTS.RESOURCE_RETIRED,
      });

      await expect(
        d.service.projectResource(dto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('fails when the record does not exist', async () => {
      const d = build();
      d.ingestionRepo.findRecordForUpdate.mockResolvedValue(null);

      await expect(
        d.service.projectResource(dto, actor as any),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });

  describe('alcance por tenant (HD-02)', () => {
    const openDto: any = {
      healthSourceConnectionId: CONNECTION,
      batchIdentifier: 'BATCH-2026-07-20',
      ingestionModeConceptId: TYPE,
    };
    const projectDto: any = {
      healthIngestionRecordId: RECORD,
      logicalIdentifier: 'Patient/123',
      normalizedPayloadJson: { resourceType: 'Patient', id: '123' },
    };

    it('createSourceConnection toma el tenant del contexto e ignora el del cuerpo', async () => {
      const d = build();
      d.ingestionRepo.createSourceSystem.mockReturnValue({ id: SYSTEM });
      d.ingestionRepo.createConnection.mockReturnValue({
        id: CONNECTION,
        statusConceptId: CONCEPTS.STATE_ACTIVE,
      });

      await d.service.createSourceConnection(
        {
          tenantId: OTHER_TENANT,
          sourceSystemCode: 'HIS',
          sourceSystemName: 'HIS',
        } as any,
        actor as any,
      );

      expect(d.ingestionRepo.findSourceSystemByCode).toHaveBeenCalledWith(
        d.tx,
        TENANT,
        'HIS',
      );
      expect(d.ingestionRepo.createSourceSystem).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT }),
      );
    });

    it('openBatch persiste el tenant del contexto, no el del cuerpo', async () => {
      const d = build();
      d.ingestionRepo.findConnectionForUpdate.mockResolvedValue(
        activeConnection(),
      );
      await d.service.openBatch(
        { ...openDto, tenantId: OTHER_TENANT },
        actor as any,
      );
      expect(d.ingestionRepo.createBatch).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT }),
      );
    });

    it('openBatch con la conexión de otro tenant responde como inexistente y no crea el lote', async () => {
      const d = build();
      d.ingestionRepo.findConnectionForUpdate.mockResolvedValue(
        activeConnection(),
      );
      d.ingestionRepo.findSourceSystemById.mockResolvedValue({
        id: SYSTEM,
        tenantId: OTHER_TENANT,
      });
      await expectNotAvailable(
        d.service.openBatch(openDto, actor as any),
        HealthDataErrorReason.SOURCE_CONNECTION_NOT_AVAILABLE,
      );
      expect(d.ingestionRepo.createBatch).not.toHaveBeenCalled();
    });

    it('registrar o cerrar sobre el lote de otro tenant responde como inexistente', async () => {
      const d = build();
      const foreign = receivingBatch({ tenantId: OTHER_TENANT });
      d.ingestionRepo.findBatchForUpdate.mockResolvedValue(foreign);
      await expectNotAvailable(
        d.service.recordIngestionRecord(BATCH, {
          sourceRecordIdentifier: 'Patient/1',
          resourceTypeConceptId: TYPE,
          payloadHash: 'h',
        } as any),
        HealthDataErrorReason.INGESTION_BATCH_NOT_AVAILABLE,
      );
      await expectNotAvailable(
        d.service.closeBatch(BATCH, {} as any),
        HealthDataErrorReason.INGESTION_BATCH_NOT_AVAILABLE,
      );
      expect(d.ingestionRepo.createRecord).not.toHaveBeenCalled();
      expect(foreign.statusConceptId).toBe(CONCEPTS.BATCH_RECEIVING);
    });

    it('un lote ajeno y uno inexistente responden idéntico', async () => {
      const foreign = build();
      foreign.ingestionRepo.findBatchForUpdate.mockResolvedValue(
        receivingBatch({ tenantId: OTHER_TENANT }),
      );
      const missing = build();
      missing.ingestionRepo.findBatchForUpdate.mockResolvedValue(null);
      const a: any = await foreign.service
        .closeBatch(BATCH, {} as any)
        .catch((e: unknown) => e);
      const b: any = await missing.service
        .closeBatch(BATCH, {} as any)
        .catch((e: unknown) => e);
      expect(a.getResponse()).toEqual(b.getResponse());
    });

    it('projectResource usa el custodio del contexto e ignora custodianTenantId del cuerpo', async () => {
      const d = build();
      d.ingestionRepo.findRecordForUpdate.mockResolvedValue(queuedRecord());
      await d.service.projectResource(
        { ...projectDto, custodianTenantId: OTHER_TENANT },
        actor as any,
      );
      expect(
        d.resourcesRepo.findResourceByLogicalIdForUpdate,
      ).toHaveBeenCalledWith(d.tx, TENANT, TYPE, 'Patient/123');
      expect(d.resourcesRepo.createResource).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ custodianTenantId: TENANT }),
      );
      expect(d.provenanceRepo.createProvenanceRecord).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ custodianTenantId: TENANT }),
      );
    });

    it('projectResource sobre un registro cuyo lote es de otro tenant no crea versión ni procedencia', async () => {
      const d = build();
      d.ingestionRepo.findRecordForUpdate.mockResolvedValue(queuedRecord());
      d.ingestionRepo.findBatchById.mockResolvedValue({
        id: BATCH,
        tenantId: OTHER_TENANT,
        healthSourceConnectionId: CONNECTION,
      });
      await expectNotAvailable(
        d.service.projectResource(projectDto, actor as any),
        HealthDataErrorReason.INGESTION_RECORD_NOT_AVAILABLE,
      );
      expect(d.resourcesRepo.createResource).not.toHaveBeenCalled();
      expect(d.resourcesRepo.createResourceVersion).not.toHaveBeenCalled();
      expect(d.provenanceRepo.createProvenanceRecord).not.toHaveBeenCalled();
    });

    it('projectResource con un sistema de origen de otro tenant responde como inexistente', async () => {
      const d = build();
      d.ingestionRepo.findRecordForUpdate.mockResolvedValue(queuedRecord());
      d.ingestionRepo.findSourceSystemById.mockResolvedValue({
        id: SYSTEM,
        tenantId: OTHER_TENANT,
      });
      await expectNotAvailable(
        d.service.projectResource(
          { ...projectDto, sourceSystemId: SYSTEM },
          actor as any,
        ),
        HealthDataErrorReason.SOURCE_SYSTEM_NOT_AVAILABLE,
      );
      expect(d.resourcesRepo.createResource).not.toHaveBeenCalled();
    });

    it('projectResource con un sistema distinto al de la conexión del lote se rechaza (422)', async () => {
      const d = build();
      d.ingestionRepo.findRecordForUpdate.mockResolvedValue(queuedRecord());
      d.ingestionRepo.findConnectionById.mockResolvedValue({
        id: CONNECTION,
        healthSourceSystemId: 'otro-sistema',
      });
      const error: any = await d.service
        .projectResource(
          { ...projectDto, sourceSystemId: SYSTEM },
          actor as any,
        )
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(error.reason).toBe(HealthDataErrorReason.SOURCE_SYSTEM_MISMATCH);
      expect(d.resourcesRepo.createResource).not.toHaveBeenCalled();
    });

    it('sin tenant en el contexto la cadena de ingesta se rechaza (412) antes de tocar datos', async () => {
      const d = build();
      await expect(
        d.rawService.openBatch(openDto, actor as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.ingestionRepo.findConnectionForUpdate).not.toHaveBeenCalled();
    });
  });
});
