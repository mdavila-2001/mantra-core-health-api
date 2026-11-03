import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { VectorErrorReason } from '../vector_rag.error-reasons';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { EmbeddingPipelineService } from './embedding-pipeline.service';

const actor = { id: 'user-1', roles: ['RAG_COLLECTION_ADMIN'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const COLLECTION_ID = '22222222-2222-2222-2222-222222222222';
const MODEL_ID = '33333333-3333-3333-3333-333333333333';
const NEW_MODEL_ID = '44444444-4444-4444-4444-444444444444';
const JOB_ID = '55555555-5555-5555-5555-555555555555';
const DOC_ID = '66666666-6666-6666-6666-666666666666';
const VERSION_ID = '77777777-7777-7777-7777-777777777777';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const catalogRepo = {
    findCollectionById: mockFn(async () => collection()),
    findCollectionForUpdate: mockFn(async () => collection()),
    findModelVersionById: mockFn(async () => ({
      id: MODEL_ID,
      retiredAt: undefined,
    })),
    findModelVersionForUpdate: mockFn(async () => ({
      id: NEW_MODEL_ID,
      dimension: 3072,
      distanceMetric: 'cosine',
      approvedForPhi: true,
      retiredAt: undefined,
    })),
    findJobForUpdate: mockFn(async () => job()),
    createJob: mockFn((_tx: any, data: any) => ({ id: JOB_ID, ...data })),
    findQueuedJobs: mockFn(async () => []),
  };
  const corpusRepo = {
    findDocument: mockFn(async () => null),
    createDocument: mockFn((_tx: any, data: any) => ({ id: 'doc-1', ...data })),
    findChunkByHash: mockFn(async () => null),
    createChunk: mockFn((_tx: any, data: any) => ({
      id: `chunk-${data.chunkNumber}`,
      ...data,
    })),
    findEmbedding: mockFn(async () => null),
    createEmbedding: mockFn((_tx: any, data: any) => ({
      id: 'emb-1',
      ...data,
    })),
    findActiveDocumentsByCollection: mockFn(async () => []),
    findChunksByDocuments: mockFn(async () => []),
    findEmbeddingsByChunksAndModelForUpdate: mockFn(async () => []),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
    warn: mockFn(),
    error: mockFn(),
  };

  const service = new EmbeddingPipelineService(
    em as any,
    catalogRepo as any,
    corpusRepo as any,
    outbox as any,
    logger as any,
  );
  // Las operaciones exigen el tenant activo: estas pruebas actúan dentro de
  // TENANT_ID. `raw` conserva la operación sin contexto para probar otro tenant.
  const raw = service;
  const scoped = Object.create(raw) as typeof service;
  for (const name of [
    'queueEmbeddingJob',
    'runEmbeddingJob',
    'reEmbedCollection',
    'listQueuedJobs',
  ] as const) {
    (scoped as any)[name] = (...args: unknown[]) =>
      runWithTenant(TENANT_ID, () => (raw as any)[name](...args));
  }

  return {
    service: scoped,
    raw,
    em,
    tx,
    catalogRepo,
    corpusRepo,
    outbox,
    logger,
  };
}

/**
 * Ejecuta la operación collection.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de collection.
 */
function collection(overrides: any = {}) {
  return {
    id: COLLECTION_ID,
    tenantId: TENANT_ID,
    lifecycleState: 'active',
    embeddingModelVersionId: MODEL_ID,
    containsPhi: false,
    dimension: 1536,
    distanceMetric: 'cosine',
    ...overrides,
  };
}

/**
 * Ejecuta la operación job.
 *
 * @param overrides - Valor de overrides requerido por la operación.
 * @returns Resultado de job.
 */
function job(overrides: any = {}) {
  return {
    id: JOB_ID,
    tenantId: TENANT_ID,
    vectorCollectionId: COLLECTION_ID,
    status: 'queued',
    completedChunks: 0,
    failedChunks: 0,
    ...overrides,
  };
}

const RUN_DTO = {
  documents: [
    {
      sourceDocumentId: DOC_ID,
      sourceVersionId: VERSION_ID,
      contentHash: 'hash-doc',
      chunks: [
        {
          chunkNumber: 0,
          chunkTextRedacted: 'texto',
          tokenCount: 10,
          chunkHash: 'hash-chunk',
          embedding: '[0.1,0.2]',
          embeddingHash: 'hash-emb',
        },
      ],
    },
  ],
} as any;

describe('EmbeddingPipelineService', () => {
  describe('queueEmbeddingJob (UC-59-04)', () => {
    const DTO = { jobType: 'backfill', sourceScope: { docs: [DOC_ID] } } as any;

    it('encola en estado queued', async () => {
      const d = build();

      const result = await d.service.queueEmbeddingJob(
        COLLECTION_ID,
        DTO,
        actor,
      );

      expect(result.status).toBe('queued');
      expect(result.duplicate).toBe(false);
    });

    it('rechaza encolar sobre una colección no activa', async () => {
      const d = build();
      d.catalogRepo.findCollectionById.mockResolvedValue(
        collection({ lifecycleState: 'sealed' }),
      );

      await expect(
        d.service.queueEmbeddingJob(COLLECTION_ID, DTO, actor),
      ).rejects.toThrow(/no está activa/);
    });

    it('deriva la clave de idempotencia del alcance cuando no se envía', async () => {
      const d = build();

      await d.service.queueEmbeddingJob(COLLECTION_ID, DTO, actor);
      const derived =
        d.outbox.publishDomainEvent.mock.calls[0][1].idempotencyKey;

      await d.service.queueEmbeddingJob(COLLECTION_ID, DTO, actor);
      expect(d.outbox.publishDomainEvent.mock.calls[1][1].idempotencyKey).toBe(
        derived,
      );
    });

    it('usa la cabecera si llega', async () => {
      const d = build();

      await d.service.queueEmbeddingJob(
        COLLECTION_ID,
        DTO,
        actor,
        'clave-cliente',
      );

      expect(d.outbox.publishDomainEvent.mock.calls[0][1].idempotencyKey).toBe(
        'vector-job:clave-cliente',
      );
    });

    it('propaga el duplicado que reporta el outbox', async () => {
      const d = build();
      d.outbox.publishDomainEvent.mockResolvedValue({ duplicate: true });

      const result = await d.service.queueEmbeddingJob(
        COLLECTION_ID,
        DTO,
        actor,
      );

      expect(result.duplicate).toBe(true);
    });
  });

  describe('runEmbeddingJob (UC-59-05)', () => {
    it('crea documento, chunk y embedding en la misma pasada', async () => {
      const d = build();

      const result = await d.service.runEmbeddingJob(JOB_ID, RUN_DTO, actor);

      expect(result.documentsUpserted).toBe(1);
      expect(result.chunksCreated).toBe(1);
      expect(result.embeddingsCreated).toBe(1);
      expect(result.chunksSkipped).toBe(0);
    });

    it('reencuentra el documento por su versión fuente en vez de duplicarlo', async () => {
      const d = build();
      d.corpusRepo.findDocument.mockResolvedValue({ id: 'doc-previo' });

      const result = await d.service.runEmbeddingJob(JOB_ID, RUN_DTO, actor);

      expect(result.documentsUpserted).toBe(0);
      expect(d.corpusRepo.createDocument).not.toHaveBeenCalled();
    });

    it('reencuentra el chunk por su hash', async () => {
      const d = build();
      d.corpusRepo.findChunkByHash.mockResolvedValue({ id: 'chunk-previo' });

      const result = await d.service.runEmbeddingJob(JOB_ID, RUN_DTO, actor);

      expect(result.chunksCreated).toBe(0);
      expect(result.embeddingsCreated).toBe(1);
    });

    it('salta el chunk que ya tiene embedding para ese modelo', async () => {
      const d = build();
      d.corpusRepo.findEmbedding.mockResolvedValue({ id: 'emb-previo' });

      const result = await d.service.runEmbeddingJob(JOB_ID, RUN_DTO, actor);

      expect(result.embeddingsCreated).toBe(0);
      expect(result.chunksSkipped).toBe(1);
      expect(d.corpusRepo.createEmbedding).not.toHaveBeenCalled();
    });

    it('rechaza un documento con PHI en una colección que no lo admite', async () => {
      const d = build();

      await expect(
        d.service.runEmbeddingJob(
          JOB_ID,
          {
            documents: [{ ...RUN_DTO.documents[0], containsPhi: true }],
          } as any,
          actor,
        ),
      ).rejects.toThrow(/no admite datos de paciente/);
    });

    it('rechaza seguir si el modelo de la colección se retiró', async () => {
      const d = build();
      d.catalogRepo.findModelVersionById.mockResolvedValue({
        id: MODEL_ID,
        retiredAt: new Date(),
      });

      await expect(
        d.service.runEmbeddingJob(JOB_ID, RUN_DTO, actor),
      ).rejects.toThrow(/está retirado/);
    });

    it('marca el job failed sin tocar el corpus cuando el proveedor no calculó nada', async () => {
      const d = build();

      const result = await d.service.runEmbeddingJob(
        JOB_ID,
        { failed: true, errorCode: 'PROVIDER_NOT_CONFIGURED' },
        actor,
      );

      expect(result.status).toBe('failed');
      expect(result.documentsUpserted).toBe(0);
      expect(result.chunksCreated).toBe(0);
      expect(d.corpusRepo.createDocument).not.toHaveBeenCalled();
      expect(d.corpusRepo.createChunk).not.toHaveBeenCalled();
      expect(d.corpusRepo.createEmbedding).not.toHaveBeenCalled();
    });

    it('rechaza un job que ya terminó', async () => {
      const d = build();
      d.catalogRepo.findJobForUpdate.mockResolvedValue(
        job({ status: 'completed' }),
      );

      await expect(
        d.service.runEmbeddingJob(JOB_ID, RUN_DTO, actor),
      ).rejects.toThrow(/ya no está en cola/);
    });

    it('el lote final cierra el job y publica el evento', async () => {
      const d = build();
      const j = job();
      d.catalogRepo.findJobForUpdate.mockResolvedValue(j);

      const result = await d.service.runEmbeddingJob(
        JOB_ID,
        { ...RUN_DTO, finalBatch: true },
        actor,
      );

      expect(result.status).toBe('completed');
      expect(j.completedAt).toBeInstanceOf(Date);
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'EmbeddingJobCompleted' }),
      );
    });

    it('un lote intermedio deja el job en running sin publicar cierre', async () => {
      const d = build();

      const result = await d.service.runEmbeddingJob(JOB_ID, RUN_DTO, actor);

      expect(result.status).toBe('running');
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });
  });

  describe('listQueuedJobs (UC-59-05, descubrimiento)', () => {
    it('mapea los jobs en cola al DTO del worker', async () => {
      const d = build();
      d.catalogRepo.findQueuedJobs.mockResolvedValue([
        { id: JOB_ID, vectorCollectionId: COLLECTION_ID, jobType: 'backfill' },
      ]);

      const res = await d.service.listQueuedJobs(10);

      expect(d.catalogRepo.findQueuedJobs).toHaveBeenCalledWith(
        d.em,
        'queued',
        10,
        undefined,
      );
      expect(res.jobs).toEqual([
        { id: JOB_ID, vectorCollectionId: COLLECTION_ID, jobType: 'backfill' },
      ]);
    });

    it('usa el tamaño de lote por defecto si no se declara límite', async () => {
      const d = build();

      await d.service.listQueuedJobs();

      expect(d.catalogRepo.findQueuedJobs).toHaveBeenCalledWith(
        d.em,
        'queued',
        50,
        undefined,
      );
    });
  });

  describe('reEmbedCollection (UC-59-11)', () => {
    const DTO = { embeddingModelVersionId: NEW_MODEL_ID } as any;

    it('cambia el modelo y encola el job de re-embedding', async () => {
      const d = build();
      const c = collection();
      d.catalogRepo.findCollectionForUpdate.mockResolvedValue(c);

      const result = await d.service.reEmbedCollection(
        COLLECTION_ID,
        DTO,
        actor,
      );

      expect(c.embeddingModelVersionId).toBe(NEW_MODEL_ID);
      expect(c.dimension).toBe(3072);
      expect(result.embeddingJobId).toBe(JOB_ID);
      expect(d.catalogRepo.createJob.mock.calls[0][1].jobType).toBe('re_embed');
    });

    it('marca los embeddings anteriores como superados sin borrarlos', async () => {
      const d = build();
      d.corpusRepo.findActiveDocumentsByCollection.mockResolvedValue([
        { id: 'doc-1' },
      ]);
      d.corpusRepo.findChunksByDocuments.mockResolvedValue([{ id: 'chunk-1' }]);
      const embeddings = [
        { lifecycleState: 'active' },
        { lifecycleState: 'active' },
      ];
      d.corpusRepo.findEmbeddingsByChunksAndModelForUpdate.mockResolvedValue(
        embeddings,
      );

      const result = await d.service.reEmbedCollection(
        COLLECTION_ID,
        DTO,
        actor,
      );

      expect(embeddings.every((e) => e.lifecycleState === 'superseded')).toBe(
        true,
      );
      expect(result.supersededEmbeddings).toBe(2);
    });

    it('permite conservar los anteriores activos si se pide', async () => {
      const d = build();

      const result = await d.service.reEmbedCollection(
        COLLECTION_ID,
        { ...DTO, supersedePrevious: false },
        actor,
      );

      expect(result.supersededEmbeddings).toBe(0);
      expect(
        d.corpusRepo.findEmbeddingsByChunksAndModelForUpdate,
      ).not.toHaveBeenCalled();
    });

    it('rechaza migrar al modelo que ya usa', async () => {
      const d = build();

      await expect(
        d.service.reEmbedCollection(
          COLLECTION_ID,
          { embeddingModelVersionId: MODEL_ID } as any,
          actor,
        ),
      ).rejects.toThrow(/ya usa esa versión/);
    });

    it('rechaza migrar a un modelo retirado', async () => {
      const d = build();
      d.catalogRepo.findModelVersionForUpdate.mockResolvedValue({
        id: NEW_MODEL_ID,
        retiredAt: new Date(),
        approvedForPhi: true,
      });

      await expect(
        d.service.reEmbedCollection(COLLECTION_ID, DTO, actor),
      ).rejects.toThrow(/destino está retirado/);
    });

    it('rechaza migrar una colección con PHI a un modelo no aprobado', async () => {
      const d = build();
      d.catalogRepo.findCollectionForUpdate.mockResolvedValue(
        collection({ containsPhi: true }),
      );
      d.catalogRepo.findModelVersionForUpdate.mockResolvedValue({
        id: NEW_MODEL_ID,
        dimension: 3072,
        distanceMetric: 'cosine',
        approvedForPhi: false,
        retiredAt: undefined,
      });

      await expect(
        d.service.reEmbedCollection(COLLECTION_ID, DTO, actor),
      ).rejects.toThrow(/no está aprobado para datos de paciente/);
    });
  });

  describe('alcance de tenant (VEC-01)', () => {
    const OTHER_TENANT = '99999999-9999-9999-9999-999999999999';
    const DTO = { jobType: 'backfill', sourceScope: { docs: [DOC_ID] } } as any;

    /** Falla esperada: devuelve la excepción o lanza si no hubo. */
    async function failure(promise: Promise<unknown>) {
      try {
        await promise;
      } catch (error) {
        return error as ResourceNotFoundException;
      }
      throw new Error('debía rechazar');
    }

    it('Correcto: el administrador de A encola y re-embebe una colección de A', async () => {
      const d = build();

      const queued = await d.service.queueEmbeddingJob(
        COLLECTION_ID,
        DTO,
        actor,
      );
      const reEmbedded = await d.service.reEmbedCollection(
        COLLECTION_ID,
        { embeddingModelVersionId: NEW_MODEL_ID } as any,
        actor,
      );

      expect(queued.status).toBe('queued');
      expect(reEmbedded.vectorCollectionId).toBe(COLLECTION_ID);
      expect(d.catalogRepo.findCollectionById).toHaveBeenCalledWith(
        d.tx,
        COLLECTION_ID,
        TENANT_ID,
      );
      expect(d.catalogRepo.findCollectionForUpdate).toHaveBeenCalledWith(
        d.tx,
        COLLECTION_ID,
        TENANT_ID,
      );
      for (const [, data] of d.catalogRepo.createJob.mock.calls) {
        expect(data.tenantId).toBe(TENANT_ID);
      }
    });

    it('Límite: el worker de A que ejecuta un job de B recibe 404 y no escribe documentos ni vectores', async () => {
      const d = build();
      // El repositorio filtra por id + tenant: el job de B no se encuentra.
      d.catalogRepo.findJobForUpdate.mockResolvedValue(null);

      const error = await failure(
        d.service.runEmbeddingJob(JOB_ID, RUN_DTO, {
          id: 'worker-a',
          roles: ['EMBEDDING_WORKER'],
        } as any),
      );

      expect(error).toBeInstanceOf(ResourceNotFoundException);
      expect(error.reason).toBe(VectorErrorReason.RESOURCE_OUT_OF_SCOPE);
      expect(d.catalogRepo.findJobForUpdate).toHaveBeenCalledWith(
        d.tx,
        JOB_ID,
        TENANT_ID,
      );
      expect(d.corpusRepo.createDocument).not.toHaveBeenCalled();
      expect(d.corpusRepo.createChunk).not.toHaveBeenCalled();
      expect(d.corpusRepo.createEmbedding).not.toHaveBeenCalled();
    });

    it('un job de otro tenant que el repositorio devolviera igual se rechaza (defensa en profundidad)', async () => {
      const d = build();
      d.catalogRepo.findJobForUpdate.mockResolvedValue(
        job({ tenantId: OTHER_TENANT }),
      );

      const error = await failure(
        d.service.runEmbeddingJob(JOB_ID, RUN_DTO, actor),
      );

      expect(error.reason).toBe(VectorErrorReason.RESOURCE_OUT_OF_SCOPE);
      expect(d.corpusRepo.createDocument).not.toHaveBeenCalled();
    });

    it('Falla catalogada: la colección de B y un UUID inexistente responden exactamente igual', async () => {
      const ajena = build();
      ajena.catalogRepo.findCollectionById.mockResolvedValue(
        collection({ tenantId: OTHER_TENANT }),
      );
      const inexistente = build();
      inexistente.catalogRepo.findCollectionById.mockResolvedValue(null);

      const a = await failure(
        ajena.service.queueEmbeddingJob(COLLECTION_ID, DTO, actor),
      );
      const b = await failure(
        inexistente.service.queueEmbeddingJob(COLLECTION_ID, DTO, actor),
      );

      expect(a.getStatus()).toBe(404);
      expect(a.reason).toBe(VectorErrorReason.RESOURCE_OUT_OF_SCOPE);
      expect(a.details).toBeUndefined();
      expect(a.getResponse()).toEqual(b.getResponse());
      expect(ajena.catalogRepo.createJob).not.toHaveBeenCalled();
      expect(ajena.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('re-embeber la colección de otro tenant responde 404 y no la toca', async () => {
      const d = build();
      const foreign = collection({ tenantId: OTHER_TENANT });
      d.catalogRepo.findCollectionForUpdate.mockResolvedValue(foreign);

      const error = await failure(
        d.service.reEmbedCollection(
          COLLECTION_ID,
          { embeddingModelVersionId: NEW_MODEL_ID } as any,
          actor,
        ),
      );

      expect(error.reason).toBe(VectorErrorReason.RESOURCE_OUT_OF_SCOPE);
      expect(foreign.embeddingModelVersionId).toBe(MODEL_ID);
      expect(d.catalogRepo.createJob).not.toHaveBeenCalled();
    });

    it('SYSTEM sin tenant ejecuta el job de cualquier tenant y escribe con el tenant del job', async () => {
      const d = build();
      d.catalogRepo.findJobForUpdate.mockResolvedValue(
        job({ tenantId: OTHER_TENANT }),
      );
      d.catalogRepo.findCollectionById.mockResolvedValue(
        collection({ tenantId: OTHER_TENANT }),
      );

      const result = await d.raw.runEmbeddingJob(JOB_ID, RUN_DTO, {
        id: 'svc',
        roles: ['SYSTEM'],
      } as any);

      expect(result.embeddingsCreated).toBe(1);
      // Sin tenant de petición no se filtra el job, pero la colección sí se
      // busca en el tenant del job.
      expect(d.catalogRepo.findJobForUpdate).toHaveBeenCalledWith(
        d.tx,
        JOB_ID,
        undefined,
      );
      expect(d.catalogRepo.findCollectionById).toHaveBeenCalledWith(
        d.tx,
        COLLECTION_ID,
        OTHER_TENANT,
      );
    });

    it('un actor que no es SYSTEM y no tiene tenant activo falla cerrado (412)', async () => {
      const d = build();

      const error = await d.raw
        .runEmbeddingJob(JOB_ID, RUN_DTO, {
          id: 'worker-a',
          roles: ['EMBEDDING_WORKER'],
        } as any)
        .catch((e) => e);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(d.catalogRepo.findJobForUpdate).not.toHaveBeenCalled();
    });

    it('la cola de un actor con tenant se limita a ese tenant; la de SYSTEM cruza todos', async () => {
      const d = build();

      await d.service.listQueuedJobs(10, actor);
      await d.raw.listQueuedJobs(10, { id: 'svc', roles: ['SYSTEM'] } as any);

      expect(d.catalogRepo.findQueuedJobs).toHaveBeenNthCalledWith(
        1,
        d.em,
        'queued',
        10,
        TENANT_ID,
      );
      expect(d.catalogRepo.findQueuedJobs).toHaveBeenNthCalledWith(
        2,
        d.em,
        'queued',
        10,
        undefined,
      );
    });
  });
});
