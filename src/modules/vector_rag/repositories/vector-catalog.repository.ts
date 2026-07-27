import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  EmbeddingModelVersions,
  VectorCollections,
  VectorTenantBindings,
  RagAccessPolicies,
  EmbeddingJobs,
} from '../entities';

export interface CreateModelVersionData {
  providerCode: string;
  modelId: string;
  modelVersion: string;
  dimension: number;
  distanceMetric: string;
  tokenizerVersion: string;
  approvedForPhi: boolean;
  approvedAt: Date;
}

export interface CreateCollectionData {
  tenantId: string;
  code: string;
  name: string;
  dimension: number;
  distanceMetric: string;
  embeddingModelVersionId: string;
  containsPhi: boolean;
  accessPolicyId?: string;
  lifecycleState: string;
}

export interface CreatePolicyData {
  tenantId: string;
  code: string;
  allowedPrincipalTypes: string[];
  allowedPurposeCodes: string[];
  allowedSecurityLabels: string[];
  patientScopeRequired: boolean;
  consentRequired: boolean;
  fieldRedactionProfile?: string;
  state: string;
}

export interface CreateJobData {
  tenantId: string;
  vectorCollectionId: string;
  jobType: string;
  sourceScope: unknown;
  requestedByUserId: string;
  status: string;
  totalChunks: number;
}

/**
 * Catálogo gobernado de `vector_rag.*`: modelos de embedding aprobados,
 * colecciones vectoriales y su vínculo con el tenant, políticas de acceso RAG y la
 * cola de jobs de embedding.
 */
@Injectable()
export class VectorCatalogRepository {
  // --- Modelos de embedding (UC-59-01, 02, 11, 13) ---

  createModelVersion(
    em: EntityManager,
    data: CreateModelVersionData,
  ): EmbeddingModelVersions {
    return em.create(EmbeddingModelVersions, data as never, { partial: true });
  }

  findModelVersionById(
    em: EntityManager,
    id: string,
  ): Promise<EmbeddingModelVersions | null> {
    return em.findOne(EmbeddingModelVersions, { id });
  }

  /**
   * Bloquea el modelo mientras se valida su aprobación. Sin esto, una colección
   * podría crearse contra un modelo que se está retirando en la transacción de al
   * lado, y quedaría atada a algo que ya nadie debe usar.
   */
  findModelVersionForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<EmbeddingModelVersions | null> {
    return em.findOne(
      EmbeddingModelVersions,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findModelVersion(
    em: EntityManager,
    providerCode: string,
    modelId: string,
    modelVersion: string,
  ): Promise<EmbeddingModelVersions | null> {
    return em.findOne(EmbeddingModelVersions, {
      providerCode,
      modelId,
      modelVersion,
    });
  }

  // --- Colecciones (UC-59-02, 03, 04, 11, 13) ---

  createCollection(
    em: EntityManager,
    data: CreateCollectionData,
  ): VectorCollections {
    return em.create(VectorCollections, data as never, { partial: true });
  }

  findCollectionById(
    em: EntityManager,
    id: string,
  ): Promise<VectorCollections | null> {
    return em.findOne(VectorCollections, { id });
  }

  findCollectionForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<VectorCollections | null> {
    return em.findOne(
      VectorCollections,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findCollectionByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<VectorCollections | null> {
    return em.findOne(VectorCollections, { tenantId, code });
  }

  /** Colecciones atadas a una política; republicarla las vuelve a enlazar. */
  findCollectionsByPolicyForUpdate(
    em: EntityManager,
    accessPolicyId: string,
  ): Promise<VectorCollections[]> {
    return em.find(
      VectorCollections,
      { accessPolicyId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Colecciones que usan el modelo; se comprueban antes de retirarlo. */
  findCollectionsByModel(
    em: EntityManager,
    embeddingModelVersionId: string,
  ): Promise<VectorCollections[]> {
    return em.find(VectorCollections, { embeddingModelVersionId });
  }

  // --- Vínculos de tenant (UC-59-02, 13) ---

  createBinding(
    em: EntityManager,
    data: {
      tenantId: string;
      vectorCollectionId: string;
      namespace: string;
      encryptionProfileCode?: string;
      state: string;
    },
  ): VectorTenantBindings {
    return em.create(VectorTenantBindings, data as never, { partial: true });
  }

  findBindingByNamespace(
    em: EntityManager,
    namespace: string,
  ): Promise<VectorTenantBindings | null> {
    return em.findOne(VectorTenantBindings, { namespace });
  }

  findBindingsByCollectionForUpdate(
    em: EntityManager,
    vectorCollectionId: string,
  ): Promise<VectorTenantBindings[]> {
    return em.find(
      VectorTenantBindings,
      { vectorCollectionId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Políticas de acceso RAG (UC-59-03, 06, 07) ---

  createPolicy(em: EntityManager, data: CreatePolicyData): RagAccessPolicies {
    return em.create(RagAccessPolicies, data as never, { partial: true });
  }

  findPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<RagAccessPolicies | null> {
    return em.findOne(RagAccessPolicies, { id });
  }

  findPolicyByCodeForUpdate(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<RagAccessPolicies | null> {
    return em.findOne(
      RagAccessPolicies,
      { tenantId, code },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Jobs de embedding (UC-59-04, 05, 11, 12, 13) ---

  createJob(em: EntityManager, data: CreateJobData): EmbeddingJobs {
    return em.create(
      EmbeddingJobs,
      {
        ...data,
        completedChunks: 0,
        failedChunks: 0,
        createdAt: new Date(),
      } as never,
      { partial: true },
    );
  }

  findJobById(em: EntityManager, id: string): Promise<EmbeddingJobs | null> {
    return em.findOne(EmbeddingJobs, { id });
  }

  findJobForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<EmbeddingJobs | null> {
    return em.findOne(
      EmbeddingJobs,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Siguiente job de la cola, en orden de llegada y con `SKIP LOCKED`: dos workers
   * se reparten la cola en vez de pelearse por la misma fila.
   */
  findNextQueuedJobForUpdate(
    em: EntityManager,
    tenantId: string,
    queuedStatus: string,
  ): Promise<EmbeddingJobs | null> {
    return em.findOne(
      EmbeddingJobs,
      { tenantId, status: queuedStatus },
      {
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
        orderBy: { createdAt: 'ASC' },
      },
    );
  }

  /** Jobs vivos que dependen de la colección; bloquean retirar su modelo. */
  findActiveJobsByCollection(
    em: EntityManager,
    vectorCollectionId: string,
    activeStatuses: string[],
  ): Promise<EmbeddingJobs[]> {
    return em.find(EmbeddingJobs, {
      vectorCollectionId,
      status: { $in: activeStatuses },
    });
  }
}
