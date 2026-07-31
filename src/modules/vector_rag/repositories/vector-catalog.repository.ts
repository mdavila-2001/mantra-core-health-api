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

/**
 * Describe el contrato estructural de create model version data.
 */
export interface CreateModelVersionData {
  /**
   * Valor de provider code mantenido por la instancia.
   */
  providerCode: string;
  /**
   * Identificador asociado a model.
   */
  modelId: string;
  /**
   * Valor de model version mantenido por la instancia.
   */
  modelVersion: string;
  /**
   * Valor de dimension mantenido por la instancia.
   */
  dimension: number;
  /**
   * Valor de distance metric mantenido por la instancia.
   */
  distanceMetric: string;
  /**
   * Valor de tokenizer version mantenido por la instancia.
   */
  tokenizerVersion: string;
  /**
   * Valor de approved for phi mantenido por la instancia.
   */
  approvedForPhi: boolean;
  /**
   * Valor de approved at mantenido por la instancia.
   */
  approvedAt: Date;
}

/**
 * Describe el contrato estructural de create collection data.
 */
export interface CreateCollectionData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Valor de dimension mantenido por la instancia.
   */
  dimension: number;
  /**
   * Valor de distance metric mantenido por la instancia.
   */
  distanceMetric: string;
  /**
   * Identificador asociado a embedding model version.
   */
  embeddingModelVersionId: string;
  /**
   * Valor de contains phi mantenido por la instancia.
   */
  containsPhi: boolean;
  /**
   * Identificador asociado a access policy.
   */
  accessPolicyId?: string;
  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  lifecycleState: string;
}

/**
 * Describe el contrato estructural de create policy data.
 */
export interface CreatePolicyData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de allowed principal types mantenido por la instancia.
   */
  allowedPrincipalTypes: string[];
  /**
   * Valor de allowed purpose codes mantenido por la instancia.
   */
  allowedPurposeCodes: string[];
  /**
   * Valor de allowed security labels mantenido por la instancia.
   */
  allowedSecurityLabels: string[];
  /**
   * Valor de patient scope required mantenido por la instancia.
   */
  patientScopeRequired: boolean;
  /**
   * Valor de consent required mantenido por la instancia.
   */
  consentRequired: boolean;
  /**
   * Valor de field redaction profile mantenido por la instancia.
   */
  fieldRedactionProfile?: string;
  /**
   * Valor de state mantenido por la instancia.
   */
  state: string;
}

/**
 * Describe el contrato estructural de create job data.
 */
export interface CreateJobData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a vector collection.
   */
  vectorCollectionId: string;
  /**
   * Valor de job type mantenido por la instancia.
   */
  jobType: string;
  /**
   * Valor de source scope mantenido por la instancia.
   */
  sourceScope: unknown;
  /**
   * Identificador asociado a requested by user.
   */
  requestedByUserId: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  status: string;
  /**
   * Valor de total chunks mantenido por la instancia.
   */
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

  /**
   * Crea create model version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create model version conforme al contrato `EmbeddingModelVersions`.
   */
  createModelVersion(
    em: EntityManager,
    data: CreateModelVersionData,
  ): EmbeddingModelVersions {
    return em.create(EmbeddingModelVersions, data as never, { partial: true });
  }

  /**
   * Obtiene find model version by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find model version by id conforme al contrato `Promise<EmbeddingModelVersions | null>`.
   */
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

  /**
   * Obtiene find model version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param providerCode - Valor de provider code requerido por la operación.
   * @param modelId - Identificador de model.
   * @param modelVersion - Valor de model version requerido por la operación.
   * @returns Resultado de find model version conforme al contrato `Promise<EmbeddingModelVersions | null>`.
   */
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

  /**
   * Crea create collection.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create collection conforme al contrato `VectorCollections`.
   */
  createCollection(
    em: EntityManager,
    data: CreateCollectionData,
  ): VectorCollections {
    return em.create(VectorCollections, data as never, { partial: true });
  }

  /**
   * Obtiene find collection by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find collection by id conforme al contrato `Promise<VectorCollections | null>`.
   */
  findCollectionById(
    em: EntityManager,
    id: string,
  ): Promise<VectorCollections | null> {
    return em.findOne(VectorCollections, { id });
  }

  /**
   * Obtiene find collection for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find collection for update conforme al contrato `Promise<VectorCollections | null>`.
   */
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

  /**
   * Obtiene find collection by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find collection by code conforme al contrato `Promise<VectorCollections | null>`.
   */
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

  /**
   * Crea create binding.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create binding conforme al contrato `VectorTenantBindings`.
   */
  createBinding(
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
       * Valor de namespace mantenido por la instancia.
       */
      namespace: string;
      /**
       * Valor de encryption profile code mantenido por la instancia.
       */
      encryptionProfileCode?: string;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): VectorTenantBindings {
    return em.create(VectorTenantBindings, data as never, { partial: true });
  }

  /**
   * Obtiene find binding by namespace.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param namespace - Valor de namespace requerido por la operación.
   * @returns Resultado de find binding by namespace conforme al contrato `Promise<VectorTenantBindings | null>`.
   */
  findBindingByNamespace(
    em: EntityManager,
    namespace: string,
  ): Promise<VectorTenantBindings | null> {
    return em.findOne(VectorTenantBindings, { namespace });
  }

  /**
   * Obtiene find bindings by collection for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param vectorCollectionId - Identificador de vector collection.
   * @returns Resultado de find bindings by collection for update conforme al contrato `Promise<VectorTenantBindings[]>`.
   */
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

  /**
   * Crea create policy.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create policy conforme al contrato `RagAccessPolicies`.
   */
  createPolicy(em: EntityManager, data: CreatePolicyData): RagAccessPolicies {
    return em.create(RagAccessPolicies, data as never, { partial: true });
  }

  /**
   * Obtiene find policy by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find policy by id conforme al contrato `Promise<RagAccessPolicies | null>`.
   */
  findPolicyById(
    em: EntityManager,
    id: string,
  ): Promise<RagAccessPolicies | null> {
    return em.findOne(RagAccessPolicies, { id });
  }

  /**
   * Obtiene find policy by code for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find policy by code for update conforme al contrato `Promise<RagAccessPolicies | null>`.
   */
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

  /**
   * Crea create job.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create job conforme al contrato `EmbeddingJobs`.
   */
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

  /**
   * Obtiene find job by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find job by id conforme al contrato `Promise<EmbeddingJobs | null>`.
   */
  findJobById(em: EntityManager, id: string): Promise<EmbeddingJobs | null> {
    return em.findOne(EmbeddingJobs, { id });
  }

  /**
   * Obtiene find job for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find job for update conforme al contrato `Promise<EmbeddingJobs | null>`.
   */
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

  /**
   * Lote de jobs en cola, para el descubrimiento del worker de embeddings
   * (UC-59-05): sin esto no había forma de listar qué `jobId` ejecutar. Cruza
   * todos los tenants a propósito (barrido `SYSTEM`); `runEmbeddingJob` vuelve
   * a bloquear la fila por su cuenta, así que una lectura sin lock aquí no
   * arriesga una carrera — dos ticks solapados que descubren el mismo job
   * simplemente hacen que el segundo choque con el guard de estado y falle
   * limpio (ver `EmbeddingPipelineService.runEmbeddingJob`).
   */
  findQueuedJobs(
    em: EntityManager,
    queuedStatus: string,
    limit: number,
  ): Promise<EmbeddingJobs[]> {
    return em.find(
      EmbeddingJobs,
      { status: queuedStatus },
      { orderBy: { createdAt: 'ASC' }, limit },
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
