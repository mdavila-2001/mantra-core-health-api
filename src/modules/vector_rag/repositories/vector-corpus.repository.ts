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

export interface UpsertDocumentData {
  vectorCollectionId: string;
  sourceDocumentId: string;
  sourceVersionId: string;
  documentType?: string;
  language?: string;
  title?: string;
  contentHash: string;
  containsPhi: boolean;
  patientProfileId?: string;
  securityLabels: string[];
  purposeOfUseCodes: string[];
  lifecycleState: string;
}

export interface CreateChunkData {
  vectorDocumentId: string;
  chunkNumber: number;
  chunkTextRedacted: string;
  tokenCount: number;
  chunkHash: string;
  sectionPath?: string;
  metadata?: unknown;
}

export interface UpsertEmbeddingData {
  vectorChunkId: string;
  embeddingModelVersionId: string;
  embedding: string;
  embeddingHash: string;
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

  createDocument(em: EntityManager, data: UpsertDocumentData): VectorDocuments {
    return em.create(
      VectorDocuments,
      { ...data, createdAt: new Date() } as never,
      { partial: true },
    );
  }

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
    filter: { sourceDocumentId?: string; patientProfileId?: string },
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

  async deleteDocuments(em: EntityManager, ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    return em.nativeDelete(VectorDocuments, { id: { $in: ids } });
  }

  // --- Chunks (UC-59-05, 07, 08, 10) ---

  createChunk(em: EntityManager, data: CreateChunkData): VectorChunks {
    return em.create(
      VectorChunks,
      { ...data, createdAt: new Date() } as never,
      {
        partial: true,
      },
    );
  }

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

  findChunksByDocuments(
    em: EntityManager,
    documentIds: string[],
  ): Promise<VectorChunks[]> {
    if (documentIds.length === 0) return Promise.resolve([]);
    return em.find(VectorChunks, { vectorDocumentId: { $in: documentIds } });
  }

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

  createDeletionJob(
    em: EntityManager,
    data: {
      tenantId: string;
      patientProfileId?: string;
      sourceDocumentId?: string;
      deletionReason: string;
      status: string;
    },
  ): VectorDeletionJobs {
    return em.create(
      VectorDeletionJobs,
      { ...data, requestedAt: new Date() } as never,
      { partial: true },
    );
  }

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

  createReconciliationRun(
    em: EntityManager,
    data: {
      tenantId: string;
      vectorCollectionId: string;
      canonicalManifestHash: string;
      vectorManifestHash: string;
      missingCount: number;
      orphanCount: number;
      mismatchedCount: number;
      status: string;
      startedAt: Date;
      completedAt: Date;
    },
  ): VectorReconciliationRuns {
    return em.create(VectorReconciliationRuns, data as never, {
      partial: true,
    });
  }
}
