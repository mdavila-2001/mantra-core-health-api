import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  EmbeddingJobs,
  RagAccessPolicies,
  VectorCollections,
  VectorDeletionJobs,
  VectorReconciliationRuns,
} from '../entities';
import type {
  ListCollectionEmbeddingJobsQueryDto,
  ListCollectionReconciliationsQueryDto,
  ListCollectionsQueryDto,
  ListDeletionJobsQueryDto,
  ListEmbeddingJobsQueryDto,
  ListRagAccessPoliciesQueryDto,
  RagAccessPolicyItemDto,
  VectorCollectionItemDto,
  VectorDeletionJobItemDto,
  VectorEmbeddingJobItemDto,
  VectorReconciliationRunItemDto,
} from '../dto';

/**
 * Lecturas de colección de `vector_rag`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class VectorRagCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar colecciones vectoriales del tenant (V59-01).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listCollections(
    query: ListCollectionsQueryDto,
  ): Promise<PageResponseDto<VectorCollectionItemDto>> {
    return listTenantCollection(this.em.fork(), VectorCollections, {
      query,
      sortable: ['createdAt', 'name', 'code'],
      map: (row): VectorCollectionItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        code: row.code,
        name: row.name,
        dimension: row.dimension,
        distanceMetric: row.distanceMetric,
        embeddingModelVersionId: row.embeddingModelVersionId,
        containsPhi: row.containsPhi,
        accessPolicyId: row.accessPolicyId,
        lifecycleState: row.lifecycleState,
        createdAt: row.createdAt,
      }),
    });
  }

  /**
   * Listar trabajos de embedding de una colección del tenant (V59-02).
   *
   * @param id - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listCollectionEmbeddingJobs(
    id: string,
    query: ListCollectionEmbeddingJobsQueryDto,
  ): Promise<PageResponseDto<VectorEmbeddingJobItemDto>> {
    return listTenantCollection(this.em.fork(), EmbeddingJobs, {
      query,
      sortable: ['createdAt', 'completedAt'],
      where: definedFilters({ vectorCollectionId: id }),
      map: (row): VectorEmbeddingJobItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        vectorCollectionId: row.vectorCollectionId,
        jobType: row.jobType,
        sourceScope: row.sourceScope,
        requestedByUserId: row.requestedByUserId,
        status: row.status,
        totalChunks: row.totalChunks,
        completedChunks: row.completedChunks,
        failedChunks: row.failedChunks,
        createdAt: row.createdAt,
        completedAt: row.completedAt,
      }),
    });
  }

  /**
   * Listar conciliaciones de una colección del tenant (V59-04).
   *
   * @param id - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listCollectionReconciliations(
    id: string,
    query: ListCollectionReconciliationsQueryDto,
  ): Promise<PageResponseDto<VectorReconciliationRunItemDto>> {
    return listTenantCollection(this.em.fork(), VectorReconciliationRuns, {
      query,
      sortable: ['startedAt', 'completedAt'],
      where: definedFilters({ vectorCollectionId: id }),
      map: (row): VectorReconciliationRunItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        vectorCollectionId: row.vectorCollectionId,
        missingCount: row.missingCount,
        orphanCount: row.orphanCount,
        mismatchedCount: row.mismatchedCount,
        status: row.status,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
      }),
    });
  }

  /**
   * Listar políticas de acceso RAG del tenant (V59-06).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listRagAccessPolicies(
    query: ListRagAccessPoliciesQueryDto,
  ): Promise<PageResponseDto<RagAccessPolicyItemDto>> {
    return listTenantCollection(this.em.fork(), RagAccessPolicies, {
      query,
      sortable: ['code'],
      map: (row): RagAccessPolicyItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        code: row.code,
        allowedPrincipalTypes: row.allowedPrincipalTypes,
        allowedPurposeCodes: row.allowedPurposeCodes,
        allowedSecurityLabels: row.allowedSecurityLabels,
        patientScopeRequired: row.patientScopeRequired,
        consentRequired: row.consentRequired,
        fieldRedactionProfile: row.fieldRedactionProfile,
        state: row.state,
      }),
    });
  }

  /**
   * Listar trabajos de borrado vectorial del tenant (V59-10).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDeletionJobs(
    query: ListDeletionJobsQueryDto,
  ): Promise<PageResponseDto<VectorDeletionJobItemDto>> {
    return listTenantCollection(this.em.fork(), VectorDeletionJobs, {
      query,
      sortable: ['requestedAt'],
      map: (row): VectorDeletionJobItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        patientProfileId: row.patientProfileId,
        sourceDocumentId: row.sourceDocumentId,
        deletionReason: row.deletionReason,
        status: row.status,
        requestedAt: row.requestedAt,
        verifiedAt: row.verifiedAt,
      }),
    });
  }

  /**
   * Listar trabajos de embedding del tenant (V59-11).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listEmbeddingJobs(
    query: ListEmbeddingJobsQueryDto,
  ): Promise<PageResponseDto<VectorEmbeddingJobItemDto>> {
    return listTenantCollection(this.em.fork(), EmbeddingJobs, {
      query,
      sortable: ['createdAt', 'completedAt'],
      where: definedFilters({ vectorCollectionId: query.vectorCollectionId }),
      map: (row): VectorEmbeddingJobItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        vectorCollectionId: row.vectorCollectionId,
        jobType: row.jobType,
        sourceScope: row.sourceScope,
        requestedByUserId: row.requestedByUserId,
        status: row.status,
        totalChunks: row.totalChunks,
        completedChunks: row.completedChunks,
        failedChunks: row.failedChunks,
        createdAt: row.createdAt,
        completedAt: row.completedAt,
      }),
    });
  }
}
