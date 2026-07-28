import { jest } from '@jest/globals';

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
  return { service, em, tx, corpusRepo, catalogRepo, outbox, logger };
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

      await d.service.propagateDeletion(
        {
          tenantId: TENANT_ID,
          patientProfileId: PATIENT_ID,
          deletionReason: 'patient_erasure',
        },
        actor,
      );

      expect(d.corpusRepo.findDocumentsForDeletion.mock.calls[0][1]).toEqual({
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
});
