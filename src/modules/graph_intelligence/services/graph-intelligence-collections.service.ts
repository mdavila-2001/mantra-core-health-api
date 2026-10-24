import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  GraphAccessScopes,
  GraphDeletionJobs,
  GraphProjectionRuns,
  GraphRuleHits,
} from '../entities';
import type {
  GraphAccessScopeItemDto,
  GraphDeletionJobItemDto,
  GraphProjectionRunItemDto,
  GraphRuleHitItemDto,
  ListAccessScopesQueryDto,
  ListDefinitionRunsQueryDto,
  ListDeletionJobsQueryDto,
  ListProjectionRunsQueryDto,
  ListRuleHitsQueryDto,
} from '../dto';

/**
 * Lecturas de colección de `graph_intelligence`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class GraphIntelligenceCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar alcances de acceso al grafo del tenant (V61-02).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listAccessScopes(
    query: ListAccessScopesQueryDto,
  ): Promise<PageResponseDto<GraphAccessScopeItemDto>> {
    return listTenantCollection(this.em.fork(), GraphAccessScopes, {
      query,
      sortable: [],
      map: (row): GraphAccessScopeItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        scopeCode: row.scopeCode,
        allowedNodeTypes: row.allowedNodeTypes,
        allowedRelationshipTypes: row.allowedRelationshipTypes,
        purposeOfUseCodes: row.purposeOfUseCodes,
        maxHops: row.maxHops,
        requiresPatientContext: row.requiresPatientContext,
        state: row.state,
      }),
    });
  }

  /**
   * Listar trabajos de borrado del grafo del tenant (V61-05).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDeletionJobs(
    query: ListDeletionJobsQueryDto,
  ): Promise<PageResponseDto<GraphDeletionJobItemDto>> {
    return listTenantCollection(this.em.fork(), GraphDeletionJobs, {
      query,
      sortable: ['requestedAt'],
      map: (row): GraphDeletionJobItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        sourceEntityType: row.sourceEntityType,
        sourceEntityId: row.sourceEntityId,
        status: row.status,
        nodesDeleted: row.nodesDeleted,
        edgesDeleted: row.edgesDeleted,
        requestedAt: row.requestedAt,
        verifiedAt: row.verifiedAt,
      }),
    });
  }

  /**
   * Listar ejecuciones de una proyección del tenant (V61-08).
   *
   * @param id - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDefinitionRuns(
    id: string,
    query: ListDefinitionRunsQueryDto,
  ): Promise<PageResponseDto<GraphProjectionRunItemDto>> {
    return listTenantCollection(this.em.fork(), GraphProjectionRuns, {
      query,
      sortable: ['startedAt', 'completedAt'],
      where: definedFilters({ graphProjectionDefinitionId: id }),
      map: (row): GraphProjectionRunItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        graphProjectionDefinitionId: row.graphProjectionDefinitionId,
        status: row.status,
        sourceCheckpoint: row.sourceCheckpoint,
        nodesWritten: row.nodesWritten,
        edgesWritten: row.edgesWritten,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
      }),
    });
  }

  /**
   * Listar ejecuciones de proyección del tenant (V61-09).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listProjectionRuns(
    query: ListProjectionRunsQueryDto,
  ): Promise<PageResponseDto<GraphProjectionRunItemDto>> {
    return listTenantCollection(this.em.fork(), GraphProjectionRuns, {
      query,
      sortable: ['startedAt', 'completedAt'],
      where: definedFilters({
        graphProjectionDefinitionId: query.graphProjectionDefinitionId,
      }),
      map: (row): GraphProjectionRunItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        graphProjectionDefinitionId: row.graphProjectionDefinitionId,
        status: row.status,
        sourceCheckpoint: row.sourceCheckpoint,
        nodesWritten: row.nodesWritten,
        edgesWritten: row.edgesWritten,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
      }),
    });
  }

  /**
   * Listar coincidencias de reglas del grafo del tenant (V61-11).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listRuleHits(
    query: ListRuleHitsQueryDto,
  ): Promise<PageResponseDto<GraphRuleHitItemDto>> {
    return listTenantCollection(this.em.fork(), GraphRuleHits, {
      query,
      sortable: ['detectedAt'],
      where: definedFilters({
        graphRuleDefinitionId: query.graphRuleDefinitionId,
      }),
      map: (row): GraphRuleHitItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        graphRuleDefinitionId: row.graphRuleDefinitionId,
        primaryNodeId: row.primaryNodeId,
        relatedNodeIds: row.relatedNodeIds,
        evidenceEdgeIds: row.evidenceEdgeIds,
        status: row.status,
        detectedAt: row.detectedAt,
        resolvedAt: row.resolvedAt,
      }),
    });
  }
}
