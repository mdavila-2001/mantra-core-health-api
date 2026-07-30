import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  VectorDocuments,
  VectorChunks,
  VectorEmbeddings,
  VectorDeletionJobs,
  VectorReconciliationRuns,
} from '../entities';

/**
 * Describe el contrato estructural de upsert document data.
 */
export interface UpsertDocumentData {
  /**
   * Identificador asociado a vector collection.
   */
  vectorCollectionId: string;
  /**
   * Identificador asociado a source document.
   */
  sourceDocumentId: string;
  /**
   * Identificador asociado a source version.
   */
  sourceVersionId: string;
  /**
   * Valor de document type mantenido por la instancia.
   */
  documentType?: string;
  /**
   * Valor de language mantenido por la instancia.
   */
  language?: string;
  /**
   * Valor de title mantenido por la instancia.
   */
  title?: string;
  /**
   * Valor de content hash mantenido por la instancia.
   */
  contentHash: string;
  /**
   * Valor de contains phi mantenido por la instancia.
   */
  containsPhi: boolean;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId?: string;
  /**
   * Valor de security labels mantenido por la instancia.
   */
  securityLabels: string[];
  /**
   * Valor de purpose of use codes mantenido por la instancia.
   */
  purposeOfUseCodes: string[];
  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  lifecycleState: string;
}

/**
 * Describe el contrato estructural de create chunk data.
 */
export interface CreateChunkData {
  /**
   * Identificador asociado a vector document.
   */
  vectorDocumentId: string;
  /**
   * Valor de chunk number mantenido por la instancia.
   */
  chunkNumber: number;
  /**
   * Valor de chunk text redacted mantenido por la instancia.
   */
  chunkTextRedacted: string;
  /**
   * Valor de token count mantenido por la instancia.
   */
  tokenCount: number;
  /**
   * Valor de chunk hash mantenido por la instancia.
   */
  chunkHash: string;
  /**
   * Valor de section path mantenido por la instancia.
   */
  sectionPath?: string;
  /**
   * Valor de metadata mantenido por la instancia.
   */
  metadata?: unknown;
}

/**
 * Describe el contrato estructural de upsert embedding data.
 */
export interface UpsertEmbeddingData {
  /**
   * Identificador asociado a vector chunk.
   */
  vectorChunkId: string;
  /**
   * Identificador asociado a embedding model version.
   */
  embeddingModelVersionId: string;
  /**
   * Valor de embedding mantenido por la instancia.
   */
  embedding: string;
  /**
   * Valor de embedding hash mantenido por la instancia.
   */
  embeddingHash: string;
  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  lifecycleState: string;
}

/**
 * Corpus vectorial: documentos, chunks, embeddings, y los dos procesos que lo
 * mantienen honesto —borrado propagado y reconciliación—.
 */
@Injectable()
export class VectorCorpusRepository {
  // --- Documentos (UC-59-05, 07, 10, 12) ---

  /**
   * Clave natural `(colección, documento fuente, versión fuente)`. Reprocesar el
   * mismo job tiene que reencontrar el documento, no crear uno nuevo: si no, cada
   * reintento duplicaría el corpus.
   */
  findDocument(
    em: EntityManager,
    vectorCollectionId: string,
    sourceDocumentId: string,
    sourceVersionId: string,
  ): Promise<VectorDocuments | null> {
    return em.findOne(VectorDocuments, {
      vectorCollectionId,
      sourceDocumentId,
      sourceVersionId,
    });
  }

  /**
   * Crea create document.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create document conforme al contrato `VectorDocuments`.
   */
  createDocument(em: EntityManager, data: UpsertDocumentData): VectorDocuments {
    return em.create(
      VectorDocuments,
      { ...data, createdAt: new Date() } as never,
      { partial: true },
    );
  }

  /**
   * Obtiene find document by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find document by id conforme al contrato `Promise<VectorDocuments | null>`.
   */
  findDocumentById(
    em: EntityManager,
    id: string,
  ): Promise<VectorDocuments | null> {
    return em.findOne(VectorDocuments, { id });
  }

  /**
   * Documentos alcanzados por un borrado. `SKIP LOCKED` porque el borrado es un
   * barrido: quedarse esperando a un documento que otro proceso está tocando
   * retrasaría todo el resto de la purga.
   */
  findDocumentsForDeletion(
    em: EntityManager,
    filter: {
      /**
       * Identificador asociado a source document.
       */
      sourceDocumentId?: string; /**
       * Identificador asociado a patient profile.
       */
      patientProfileId?: string;
    },
    limit: number,
  ): Promise<VectorDocuments[]> {
    const where: Record<string, unknown> = {};
    if (filter.sourceDocumentId)
      where.sourceDocumentId = filter.sourceDocumentId;
    if (filter.patientProfileId)
      where.patientProfileId = filter.patientProfileId;
    return em.find(VectorDocuments, where, {
      lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
      limit,
    });
  }

  /** Documentos activos de la colección, para el manifiesto de reconciliación. */
  findActiveDocumentsByCollection(
    em: EntityManager,
    vectorCollectionId: string,
    activeState: string,
  ): Promise<VectorDocuments[]> {
    return em.find(
      VectorDocuments,
      { vectorCollectionId, lifecycleState: activeState },
      { orderBy: { sourceDocumentId: 'ASC' } },
    );
  }

  /**
   * Elimina o desactiva delete documents.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Valor de ids requerido por la operación.
   * @returns Resultado de delete documents conforme al contrato `Promise<number>`.
   */
  async deleteDocuments(em: EntityManager, ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    return em.nativeDelete(VectorDocuments, { id: { $in: ids } });
  }

  // --- Chunks (UC-59-05, 07, 08, 10) ---

  /**
   * Crea create chunk.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create chunk conforme al contrato `VectorChunks`.
   */
  createChunk(em: EntityManager, data: CreateChunkData): VectorChunks {
    return em.create(
      VectorChunks,
      { ...data, createdAt: new Date() } as never,
      {
        partial: true,
      },
    );
  }

  /**
   * Obtiene find chunk by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find chunk by id conforme al contrato `Promise<VectorChunks | null>`.
   */
  findChunkById(em: EntityManager, id: string): Promise<VectorChunks | null> {
    return em.findOne(VectorChunks, { id });
  }

  /** Idempotencia del chunking: el mismo texto produce el mismo hash. */
  findChunkByHash(
    em: EntityManager,
    vectorDocumentId: string,
    chunkHash: string,
  ): Promise<VectorChunks | null> {
    return em.findOne(VectorChunks, { vectorDocumentId, chunkHash });
  }

  /**
   * Obtiene find chunks by documents.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param documentIds - Valor de document ids requerido por la operación.
   * @returns Resultado de find chunks by documents conforme al contrato `Promise<VectorChunks[]>`.
   */
  findChunksByDocuments(
    em: EntityManager,
    documentIds: string[],
  ): Promise<VectorChunks[]> {
    if (documentIds.length === 0) return Promise.resolve([]);
    return em.find(VectorChunks, { vectorDocumentId: { $in: documentIds } });
  }

  /**
   * Elimina o desactiva delete chunks.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Valor de ids requerido por la operación.
   * @returns Resultado de delete chunks conforme al contrato `Promise<number>`.
   */
  async deleteChunks(em: EntityManager, ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    return em.nativeDelete(VectorChunks, { id: { $in: ids } });
  }

  // --- Embeddings (UC-59-05, 07, 10, 11) ---

  /**
   * Clave `(chunk, versión de modelo)`. Es lo que hace idempotente el re-run y, a
   * la vez, permite que el embedding viejo y el nuevo convivan durante una
   * migración de modelo sin colisionar.
   */
  findEmbedding(
    em: EntityManager,
    vectorChunkId: string,
    embeddingModelVersionId: string,
  ): Promise<VectorEmbeddings | null> {
    return em.findOne(VectorEmbeddings, {
      vectorChunkId,
      embeddingModelVersionId,
    });
  }

  /**
   * Crea create embedding.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create embedding conforme al contrato `VectorEmbeddings`.
   */
  createEmbedding(
    em: EntityManager,
    data: UpsertEmbeddingData,
  ): VectorEmbeddings {
    return em.create(
      VectorEmbeddings,
      { ...data, generatedAt: new Date() } as never,
      { partial: true },
    );
  }

  /** Embeddings del modelo anterior en una colección; se retiran al re-embeber. */
  findEmbeddingsByChunksAndModelForUpdate(
    em: EntityManager,
    chunkIds: string[],
    embeddingModelVersionId: string,
  ): Promise<VectorEmbeddings[]> {
    if (chunkIds.length === 0) return Promise.resolve([]);
    return em.find(
      VectorEmbeddings,
      { vectorChunkId: { $in: chunkIds }, embeddingModelVersionId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Elimina o desactiva delete embeddings by chunks.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param chunkIds - Valor de chunk ids requerido por la operación.
   * @returns Resultado de delete embeddings by chunks conforme al contrato `Promise<number>`.
   */
  async deleteEmbeddingsByChunks(
    em: EntityManager,
    chunkIds: string[],
  ): Promise<number> {
    if (chunkIds.length === 0) return 0;
    return em.nativeDelete(VectorEmbeddings, {
      vectorChunkId: { $in: chunkIds },
    });
  }

  // --- Jobs de borrado (UC-59-10, 12) ---

  /**
   * Crea create deletion job.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create deletion job conforme al contrato `VectorDeletionJobs`.
   */
  createDeletionJob(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a patient profile.
       */
      patientProfileId?: string;
      /**
       * Identificador asociado a source document.
       */
      sourceDocumentId?: string;
      /**
       * Valor de deletion reason mantenido por la instancia.
       */
      deletionReason: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
    },
  ): VectorDeletionJobs {
    return em.create(
      VectorDeletionJobs,
      { ...data, requestedAt: new Date() } as never,
      { partial: true },
    );
  }

  /**
   * Obtiene find deletion job for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find deletion job for update conforme al contrato `Promise<VectorDeletionJobs | null>`.
   */
  findDeletionJobForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<VectorDeletionJobs | null> {
    return em.findOne(
      VectorDeletionJobs,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Reconciliación (UC-59-12) ---

  /**
   * Crea create reconciliation run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create reconciliation run conforme al contrato `VectorReconciliationRuns`.
   */
  createReconciliationRun(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a vector collection.
       */
      vectorCollectionId: string;
      /**
       * Valor de canonical manifest hash mantenido por la instancia.
       */
      canonicalManifestHash: string;
      /**
       * Valor de vector manifest hash mantenido por la instancia.
       */
      vectorManifestHash: string;
      /**
       * Valor de missing count mantenido por la instancia.
       */
      missingCount: number;
      /**
       * Valor de orphan count mantenido por la instancia.
       */
      orphanCount: number;
      /**
       * Valor de mismatched count mantenido por la instancia.
       */
      mismatchedCount: number;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt: Date;
      /**
       * Valor de completed at mantenido por la instancia.
       */
      completedAt: Date;
    },
  ): VectorReconciliationRuns {
    return em.create(VectorReconciliationRuns, data as never, {
      partial: true,
    });
  }
}
