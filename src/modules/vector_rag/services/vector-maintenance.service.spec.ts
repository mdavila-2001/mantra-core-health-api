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

import { VectorMaintenanceService } from './vector-maintenance.service';

const actor = { id: 'user-1', roles: ['DPO'] } as any;
const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const COLLECTION_ID = '22222222-2222-2222-2222-222222222222';
const DOC_A = '33333333-3333-3333-3333-333333333333';
const DOC_B = '44444444-4444-4444-4444-444444444444';
const PATIENT_ID = '55555555-5555-5555-5555-555555555555';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn() };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const corpusRepo = {
    createDeletionJob: mockFn((_tx: any, data: any) => ({
      id: 'del-1',
      ...data,
    })),
    findDocumentsForDeletion: mockFn(async () => []),
    hasPriorDeletionJob: mockFn(async () => false),
    findChunksByDocuments: mockFn(async () => []),
    deleteEmbeddingsByChunks: mockFn(async () => 0),
    deleteChunks: mockFn(async () => 0),
    deleteDocuments: mockFn(async () => 0),
    findActiveDocumentsByCollection: mockFn(async () => []),
    createReconciliationRun: mockFn((_tx: any, data: any) => ({
      id: 'run-1',
      ...data,
    })),
  };
  const catalogRepo = {
    findCollectionById: mockFn(async () => ({
      id: COLLECTION_ID,
      tenantId: TENANT_ID,
    })),
    createJob: mockFn((_tx: any, data: any) => ({ id: 'job-1', ...data })),
  };
  const outbox = {
    publishDomainEvent: mockFn(async () => ({ duplicate: false })),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new VectorMaintenanceService(
    em as any,
    corpusRepo as any,
    catalogRepo as any,
    outbox as any,
    logger as any,
  );
  // Las operaciones exigen el tenant activo: estas pruebas actúan dentro de
  // TENANT_ID. `raw` conserva la operación sin contexto para probar otro tenant.
  const raw = service;
  const scoped = Object.create(raw) as typeof service;
  for (const name of ['propagateDeletion', 'reconcileCollection'] as const) {
    (scoped as any)[name] = (...args: unknown[]) =>
      runWithTenant(TENANT_ID, () => (raw as any)[name](...args));
  }

  return {
    service: scoped,
    raw,
    em,
    tx,
    corpusRepo,
    catalogRepo,
    outbox,
    logger,
  };
}

describe('VectorMaintenanceService', () => {
  describe('propagateDeletion (UC-59-10)', () => {
    const DTO = {
      tenantId: TENANT_ID,
      sourceDocumentId: DOC_A,
      deletionReason: 'source_document_deleted',
    } as any;

    it('borra en orden: embeddings, chunks y documentos', async () => {
      const d = build();
      d.corpusRepo.findDocumentsForDeletion.mockResolvedValue([
        { id: 'doc-1' },
      ]);
      d.corpusRepo.findChunksByDocuments.mockResolvedValue([{ id: 'chunk-1' }]);
      d.corpusRepo.deleteEmbeddingsByChunks.mockResolvedValue(3);
      d.corpusRepo.deleteChunks.mockResolvedValue(1);
      d.corpusRepo.deleteDocuments.mockResolvedValue(1);

      const result = await d.service.propagateDeletion(DTO, actor);

      expect(result.embeddingsPurged).toBe(3);
      expect(result.chunksPurged).toBe(1);
      expect(result.documentsPurged).toBe(1);
      const order = [
        d.corpusRepo.deleteEmbeddingsByChunks.mock.invocationCallOrder[0],
        d.corpusRepo.deleteChunks.mock.invocationCallOrder[0],
        d.corpusRepo.deleteDocuments.mock.invocationCallOrder[0],
      ];
      expect(order).toEqual([...order].sort((a, b) => a - b));
    });

    it('marca verificado cuando la pasada no llenó el lote', async () => {
      const d = build();
      d.corpusRepo.findDocumentsForDeletion.mockResolvedValue([
        { id: 'doc-1' },
      ]);

      const result = await d.service.propagateDeletion(
        { ...DTO, batchSize: 10 },
        actor,
      );

      expect(result.verified).toBe(true);
      expect(result.status).toBe('verified');
    });

    it('no marca verificado si el lote se llenó: queda trabajo', async () => {
      const d = build();
      d.corpusRepo.findDocumentsForDeletion.mockResolvedValue([
        { id: 'a' },
        { id: 'b' },
      ]);

      const result = await d.service.propagateDeletion(
        { ...DTO, batchSize: 2 },
        actor,
      );

      expect(result.verified).toBe(false);
      expect(result.status).toBe('verifying');
    });

    it('acepta borrar por paciente', async () => {
      const d = build();
      d.corpusRepo.findDocumentsForDeletion.mockResolvedValue([
        { id: 'doc-1' },
      ]);

      await d.service.propagateDeletion(
        {
          tenantId: TENANT_ID,
          patientProfileId: PATIENT_ID,
          deletionReason: 'patient_erasure',
        },
        actor,
      );

      expect(d.corpusRepo.findDocumentsForDeletion.mock.calls[0][2]).toEqual({
        sourceDocumentId: undefined,
        patientProfileId: PATIENT_ID,
      });
    });

    it('rechaza un borrado que no declara qué borra', async () => {
      const d = build();

      await expect(
        d.service.propagateDeletion(
          { tenantId: TENANT_ID, deletionReason: 'patient_erasure' } as any,
          actor,
        ),
      ).rejects.toThrow(/qué se borra/);
    });

    it('avisa en el log y publica la purga', async () => {
      const d = build();
      d.corpusRepo.findDocumentsForDeletion.mockResolvedValue([
        { id: 'doc-1' },
      ]);

      await d.service.propagateDeletion(DTO, actor);

      expect(d.logger.warn).toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventType: 'VectorEmbeddingsPurged' }),
      );
    });
  });

  describe('reconcileCollection (UC-59-12)', () => {
    const DTO = {
      canonicalDocumentIds: [DOC_A, DOC_B],
      canonicalManifestHash: 'hash-canonico',
    } as any;

    it('sin deriva devuelve clean y no encola nada', async () => {
      const d = build();
      d.corpusRepo.findActiveDocumentsByCollection.mockResolvedValue([
        { id: 'v1', sourceDocumentId: DOC_A },
        { id: 'v2', sourceDocumentId: DOC_B },
      ]);

      const result = await d.service.reconcileCollection(
        COLLECTION_ID,
        DTO,
        actor,
      );

      expect(result.status).toBe('clean');
      expect(result.missingCount).toBe(0);
      expect(result.orphanCount).toBe(0);
      expect(result.repairJobId).toBeUndefined();
      expect(result.purgeJobId).toBeUndefined();
    });

    it('cuenta lo que falta y encola su reparación', async () => {
      const d = build();
      d.corpusRepo.findActiveDocumentsByCollection.mockResolvedValue([
        { id: 'v1', sourceDocumentId: DOC_A },
      ]);

      const result = await d.service.reconcileCollection(
        COLLECTION_ID,
        DTO,
        actor,
      );

      expect(result.missingCount).toBe(1);
      expect(result.status).toBe('drift_detected');
      expect(result.repairJobId).toBe('job-1');
      expect(d.catalogRepo.createJob.mock.calls[0][1].jobType).toBe(
        'incremental',
      );
    });

    it('cuenta los huérfanos y encola su purga', async () => {
      const d = build();
      d.corpusRepo.findActiveDocumentsByCollection.mockResolvedValue([
        { id: 'v1', sourceDocumentId: DOC_A },
        { id: 'v2', sourceDocumentId: DOC_B },
        { id: 'v3', sourceDocumentId: 'documento-que-ya-no-existe' },
      ]);

      const result = await d.service.reconcileCollection(
        COLLECTION_ID,
        DTO,
        actor,
      );

      expect(result.orphanCount).toBe(1);
      expect(result.purgeJobId).toBe('del-1');
      expect(
        d.corpusRepo.createDeletionJob.mock.calls[0][1].deletionReason,
      ).toBe('orphan_purge');
    });

    it('cuenta como descuadrado el documento con dos versiones activas', async () => {
      const d = build();
      d.corpusRepo.findActiveDocumentsByCollection.mockResolvedValue([
        { id: 'v1', sourceDocumentId: DOC_A },
        { id: 'v2', sourceDocumentId: DOC_A },
        { id: 'v3', sourceDocumentId: DOC_B },
      ]);

      const result = await d.service.reconcileCollection(
        COLLECTION_ID,
        DTO,
        actor,
      );

      expect(result.mismatchedCount).toBe(1);
      expect(result.status).toBe('drift_detected');
    });

    it('sin autoRepair informa la deriva pero no encola nada', async () => {
      const d = build();
      d.corpusRepo.findActiveDocumentsByCollection.mockResolvedValue([]);

      const result = await d.service.reconcileCollection(
        COLLECTION_ID,
        { ...DTO, autoRepair: false },
        actor,
      );

      expect(result.missingCount).toBe(2);
      expect(result.repairJobId).toBeUndefined();
      expect(d.catalogRepo.createJob).not.toHaveBeenCalled();
    });

    it('publica DriftDetected sólo cuando hay deriva', async () => {
      const d = build();
      d.corpusRepo.findActiveDocumentsByCollection.mockResolvedValue([
        { id: 'v1', sourceDocumentId: DOC_A },
        { id: 'v2', sourceDocumentId: DOC_B },
      ]);

      await d.service.reconcileCollection(COLLECTION_ID, DTO, actor);
      const eventTypes = d.outbox.publishDomainEvent.mock.calls.map(
        (c: any) => c[1].eventType,
      );

      expect(eventTypes).toContain('VectorReconciliationCompleted');
      expect(eventTypes).not.toContain('DriftDetected');
    });

    it('el hash del manifiesto vectorial no depende del orden de los documentos', async () => {
      const d1 = build();
      d1.corpusRepo.findActiveDocumentsByCollection.mockResolvedValue([
        { id: 'v1', sourceDocumentId: DOC_A },
        { id: 'v2', sourceDocumentId: DOC_B },
      ]);
      await d1.service.reconcileCollection(COLLECTION_ID, DTO, actor);

      const d2 = build();
      d2.corpusRepo.findActiveDocumentsByCollection.mockResolvedValue([
        { id: 'v2', sourceDocumentId: DOC_B },
        { id: 'v1', sourceDocumentId: DOC_A },
      ]);
      await d2.service.reconcileCollection(COLLECTION_ID, DTO, actor);

      expect(
        d1.corpusRepo.createReconciliationRun.mock.calls[0][1]
          .vectorManifestHash,
      ).toBe(
        d2.corpusRepo.createReconciliationRun.mock.calls[0][1]
          .vectorManifestHash,
      );
    });
  });

  describe('alcance de tenant del borrado (VEC-02)', () => {
    const OTHER_TENANT = '99999999-9999-9999-9999-999999999999';
    const DTO = {
      tenantId: TENANT_ID,
      sourceDocumentId: DOC_A,
      deletionReason: 'source_document_deleted',
    } as any;

    /** Falla esperada: devuelve la excepción o lanza si no hubo. */
    async function failure(promise: Promise<unknown>) {
      try {
        await promise;
      } catch (error) {
        return error as ResourceNotFoundException;
      }
      throw new Error('debía rechazar');
    }

    it('Correcto: la selección del borrado se acota al tenant antes de tocar la primera fila', async () => {
      const d = build();
      d.corpusRepo.findDocumentsForDeletion.mockResolvedValue([
        { id: 'doc-1' },
      ]);
      d.corpusRepo.findChunksByDocuments.mockResolvedValue([{ id: 'chunk-1' }]);
      d.corpusRepo.deleteEmbeddingsByChunks.mockResolvedValue(2);
      d.corpusRepo.deleteChunks.mockResolvedValue(1);
      d.corpusRepo.deleteDocuments.mockResolvedValue(1);

      const result = await d.service.propagateDeletion(DTO, actor);

      expect(d.corpusRepo.findDocumentsForDeletion).toHaveBeenCalledWith(
        d.tx,
        TENANT_ID,
        { sourceDocumentId: DOC_A, patientProfileId: undefined },
        expect.any(Number),
      );
      expect(d.corpusRepo.createDeletionJob).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: TENANT_ID }),
      );
      expect(result).toMatchObject({ documentsPurged: 1, verified: true });
    });

    it('Límite: con más documentos que el lote procesa sólo el lote y no da el borrado por verificado', async () => {
      const d = build();
      d.corpusRepo.findDocumentsForDeletion.mockResolvedValue([
        { id: 'doc-1' },
        { id: 'doc-2' },
      ]);
      d.corpusRepo.findChunksByDocuments.mockResolvedValue([]);

      const result = await d.service.propagateDeletion(
        { ...DTO, batchSize: 2 },
        actor,
      );

      expect(d.corpusRepo.findDocumentsForDeletion.mock.calls[0][3]).toBe(2);
      expect(result.verified).toBe(false);
      expect(result.status).toBe('verifying');
    });

    it('Límite: la continuación de un borrado ya pedido por el tenant puede llegar a «no queda nada» y verificarse', async () => {
      const d = build();
      d.corpusRepo.hasPriorDeletionJob.mockResolvedValue(true);

      const result = await d.service.propagateDeletion(DTO, actor);

      expect(result).toMatchObject({ documentsPurged: 0, verified: true });
    });

    it('Error: una referencia que sólo coincide con la de otro tenant responde 404 sin borrar, sin job y sin evento', async () => {
      const d = build();
      // El repositorio acota por colecciones del tenant: la de B no aparece.
      d.corpusRepo.findDocumentsForDeletion.mockResolvedValue([]);
      d.corpusRepo.hasPriorDeletionJob.mockResolvedValue(false);

      const error = await failure(d.service.propagateDeletion(DTO, actor));

      expect(error.getStatus()).toBe(404);
      expect(error.reason).toBe(VectorErrorReason.DELETION_TARGET_OUT_OF_SCOPE);
      expect(error.details).toBeUndefined();
      expect(d.corpusRepo.createDeletionJob).not.toHaveBeenCalled();
      expect(d.corpusRepo.deleteEmbeddingsByChunks).not.toHaveBeenCalled();
      expect(d.corpusRepo.deleteChunks).not.toHaveBeenCalled();
      expect(d.corpusRepo.deleteDocuments).not.toHaveBeenCalled();
      expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
    });

    it('Falla catalogada: pedir el borrado a nombre de otro tenant responde 404 antes de consultar nada', async () => {
      const d = build();

      const error = await failure(
        d.service.propagateDeletion({ ...DTO, tenantId: OTHER_TENANT }, actor),
      );

      expect(error.reason).toBe(VectorErrorReason.DELETION_TARGET_OUT_OF_SCOPE);
      expect(d.em.transactional).not.toHaveBeenCalled();
      expect(d.corpusRepo.findDocumentsForDeletion).not.toHaveBeenCalled();
      expect(d.corpusRepo.createDeletionJob).not.toHaveBeenCalled();
    });

    it('sin tenant activo un actor corriente falla cerrado (412) y no consulta', async () => {
      const d = build();

      const error = await d.raw
        .propagateDeletion(DTO, actor)
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(d.corpusRepo.findDocumentsForDeletion).not.toHaveBeenCalled();
    });

    it('SYSTEM sin tenant de petición borra en el tenant que declara el cuerpo', async () => {
      const d = build();
      d.corpusRepo.findDocumentsForDeletion.mockResolvedValue([
        { id: 'doc-1' },
      ]);

      await d.raw.propagateDeletion({ ...DTO, tenantId: OTHER_TENANT }, {
        id: 'svc',
        roles: ['SYSTEM'],
      } as any);

      expect(d.corpusRepo.findDocumentsForDeletion.mock.calls[0][1]).toBe(
        OTHER_TENANT,
      );
    });

    it('reconciliar la colección de otro tenant responde 404 y no crea jobs ni corridas', async () => {
      const d = build();
      d.catalogRepo.findCollectionById.mockResolvedValue({
        id: COLLECTION_ID,
        tenantId: OTHER_TENANT,
      });

      const error = await failure(
        d.service.reconcileCollection(
          COLLECTION_ID,
          { canonicalDocumentIds: [DOC_A], canonicalManifestHash: 'h' } as any,
          actor,
        ),
      );

      expect(error.reason).toBe(VectorErrorReason.RESOURCE_OUT_OF_SCOPE);
      expect(d.catalogRepo.createJob).not.toHaveBeenCalled();
      expect(d.corpusRepo.createReconciliationRun).not.toHaveBeenCalled();
      expect(d.corpusRepo.createDeletionJob).not.toHaveBeenCalled();
    });
  });
});
