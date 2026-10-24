import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  CacheInvalidationJobs,
  DataMovementJobs,
  DeletionRequests,
  ProjectionDeadLetters,
  ProjectionRepairJobs,
} from '../entities';
import type {
  CacheInvalidationJobItemDto,
  CrossStoreDeletionRequestItemDto,
  DataMovementJobItemDto,
  ListDataMovementJobsQueryDto,
  ListDeadLettersQueryDto,
  ListDeletionRequestsQueryDto,
  ListInvalidationsQueryDto,
  ListRepairJobsQueryDto,
  ListWorkerDeadLettersQueryDto,
  ListWorkerDeletionRequestsQueryDto,
  ProjectionDeadLetterItemDto,
  ProjectionRepairJobItemDto,
} from '../dto';

/**
 * Lecturas de colección de `cross_store_consistency`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class CrossStoreConsistencyCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar trabajos de movimiento de datos del tenant (V62-02).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDataMovementJobs(
    query: ListDataMovementJobsQueryDto,
  ): Promise<PageResponseDto<DataMovementJobItemDto>> {
    return listTenantCollection(this.em.fork(), DataMovementJobs, {
      query,
      sortable: ['startedAt', 'completedAt'],
      map: (row): DataMovementJobItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        datasetId: row.datasetId,
        sourcePlacementId: row.sourcePlacementId,
        targetPlacementId: row.targetPlacementId,
        movementMode: row.movementMode,
        status: row.status,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
      }),
    });
  }

  /**
   * Listar solicitudes de borrado del tenant (V62-03).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDeletionRequests(
    query: ListDeletionRequestsQueryDto,
  ): Promise<PageResponseDto<CrossStoreDeletionRequestItemDto>> {
    return listTenantCollection(this.em.fork(), DeletionRequests, {
      query,
      sortable: ['requestedAt'],
      map: (row): CrossStoreDeletionRequestItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        subjectType: row.subjectType,
        subjectId: row.subjectId,
        reasonCode: row.reasonCode,
        legalBasisCode: row.legalBasisCode,
        requestedByUserId: row.requestedByUserId,
        requestedAt: row.requestedAt,
        state: row.state,
        dueAt: row.dueAt,
      }),
    });
  }

  /**
   * Listar mensajes fallidos de proyección del tenant (V62-04).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDeadLetters(
    query: ListDeadLettersQueryDto,
  ): Promise<PageResponseDto<ProjectionDeadLetterItemDto>> {
    return listTenantCollection(this.em.fork(), ProjectionDeadLetters, {
      query,
      sortable: ['createdAt'],
      map: (row): ProjectionDeadLetterItemDto => ({
        id: row.id,
        projectionDeliveryAttemptId: row.projectionDeliveryAttemptId,
        tenantId: row.tenantId,
        reasonCode: row.reasonCode,
        payloadObjectId: row.payloadObjectId,
        state: row.state,
        createdAt: row.createdAt,
        resolvedAt: row.resolvedAt,
      }),
    });
  }

  /**
   * Listar trabajos de reparación de una deriva del tenant (V62-06).
   *
   * @param id - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listRepairJobs(
    id: string,
    query: ListRepairJobsQueryDto,
  ): Promise<PageResponseDto<ProjectionRepairJobItemDto>> {
    return listTenantCollection(this.em.fork(), ProjectionRepairJobs, {
      query,
      sortable: ['requestedAt', 'completedAt'],
      where: definedFilters({ projectionDriftEventId: id }),
      map: (row): ProjectionRepairJobItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        projectionDriftEventId: row.projectionDriftEventId,
        repairAction: row.repairAction,
        status: row.status,
        requestedAt: row.requestedAt,
        completedAt: row.completedAt,
      }),
    });
  }

  /**
   * Listar invalidaciones de caché del tenant (V62-08).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listInvalidations(
    query: ListInvalidationsQueryDto,
  ): Promise<PageResponseDto<CacheInvalidationJobItemDto>> {
    return listTenantCollection(this.em.fork(), CacheInvalidationJobs, {
      query,
      sortable: ['createdAt', 'completedAt'],
      map: (row): CacheInvalidationJobItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        datasetId: row.datasetId,
        entityId: row.entityId,
        entityVersion: row.entityVersion,
        cacheScope: row.cacheScope,
        status: row.status,
        createdAt: row.createdAt,
        completedAt: row.completedAt,
      }),
    });
  }

  /**
   * Listar solicitudes de borrado para workers del tenant (V62-09).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listWorkerDeletionRequests(
    query: ListWorkerDeletionRequestsQueryDto,
  ): Promise<PageResponseDto<CrossStoreDeletionRequestItemDto>> {
    return listTenantCollection(this.em.fork(), DeletionRequests, {
      query,
      sortable: ['requestedAt'],
      map: (row): CrossStoreDeletionRequestItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        subjectType: row.subjectType,
        subjectId: row.subjectId,
        reasonCode: row.reasonCode,
        legalBasisCode: row.legalBasisCode,
        requestedByUserId: row.requestedByUserId,
        requestedAt: row.requestedAt,
        state: row.state,
        dueAt: row.dueAt,
      }),
    });
  }

  /**
   * Listar mensajes fallidos de proyección para workers del tenant (V62-14).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listWorkerDeadLetters(
    query: ListWorkerDeadLettersQueryDto,
  ): Promise<PageResponseDto<ProjectionDeadLetterItemDto>> {
    return listTenantCollection(this.em.fork(), ProjectionDeadLetters, {
      query,
      sortable: ['createdAt'],
      map: (row): ProjectionDeadLetterItemDto => ({
        id: row.id,
        projectionDeliveryAttemptId: row.projectionDeliveryAttemptId,
        tenantId: row.tenantId,
        reasonCode: row.reasonCode,
        payloadObjectId: row.payloadObjectId,
        state: row.state,
        createdAt: row.createdAt,
        resolvedAt: row.resolvedAt,
      }),
    });
  }
}
