import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  GraphAccessScopes,
  GraphPathCache,
  GraphCommunities,
  GraphRiskScores,
  GraphRuleDefinitions,
  GraphRuleHits,
  GraphDeletionJobs,
} from '../entities';

/**
 * Gobierno del acceso al grafo y resultados de su analítica: alcances, caché de
 * rutas, comunidades, riesgo, reglas, hallazgos y jobs de borrado.
 */
@Injectable()
export class GraphAnalyticsRepository {
  // --- Alcances de acceso (UC-61-04, 05) ---

  /**
   * Obtiene find scope by code for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param scopeCode - Valor de scope code requerido por la operación.
   * @returns Resultado de find scope by code for update conforme al contrato `Promise<GraphAccessScopes | null>`.
   */
  findScopeByCodeForUpdate(
    em: EntityManager,
    tenantId: string,
    scopeCode: string,
  ): Promise<GraphAccessScopes | null> {
    return em.findOne(
      GraphAccessScopes,
      { tenantId, scopeCode },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find scope by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find scope by id conforme al contrato `Promise<GraphAccessScopes | null>`.
   */
  findScopeById(
    em: EntityManager,
    id: string,
  ): Promise<GraphAccessScopes | null> {
    return em.findOne(GraphAccessScopes, { id });
  }

  /**
   * Crea create scope.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create scope conforme al contrato `GraphAccessScopes`.
   */
  createScope(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Valor de scope code mantenido por la instancia.
       */
      scopeCode: string;
      /**
       * Valor de allowed node types mantenido por la instancia.
       */
      allowedNodeTypes: string[];
      /**
       * Valor de allowed relationship types mantenido por la instancia.
       */
      allowedRelationshipTypes: string[];
      /**
       * Valor de purpose of use codes mantenido por la instancia.
       */
      purposeOfUseCodes: string[];
      /**
       * Valor de max hops mantenido por la instancia.
       */
      maxHops: number;
      /**
       * Valor de requires patient context mantenido por la instancia.
       */
      requiresPatientContext: boolean;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): GraphAccessScopes {
    return em.create(GraphAccessScopes, data as never, { partial: true });
  }

  // --- Caché de rutas (UC-61-05, 10, 12) ---

  /**
   * Obtiene find cached path.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param key - Valor de key requerido por la operación.
   * @returns Resultado de find cached path conforme al contrato `Promise<GraphPathCache | null>`.
   */
  findCachedPath(
    em: EntityManager,
    key: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a start node.
       */
      startNodeId: string;
      /**
       * Identificador asociado a end node.
       */
      endNodeId: string;
      /**
       * Valor de relationship filter hash mantenido por la instancia.
       */
      relationshipFilterHash: string;
      /**
       * Valor de max hops mantenido por la instancia.
       */
      maxHops: number;
    },
  ): Promise<GraphPathCache | null> {
    return em.findOne(GraphPathCache, key);
  }

  /**
   * Crea create cached path.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create cached path conforme al contrato `GraphPathCache`.
   */
  createCachedPath(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a start node.
       */
      startNodeId: string;
      /**
       * Identificador asociado a end node.
       */
      endNodeId: string;
      /**
       * Valor de relationship filter hash mantenido por la instancia.
       */
      relationshipFilterHash: string;
      /**
       * Valor de max hops mantenido por la instancia.
       */
      maxHops: number;
      /**
       * Valor de path nodes mantenido por la instancia.
       */
      pathNodes: string[];
      /**
       * Valor de path edges mantenido por la instancia.
       */
      pathEdges: string[];
      /**
       * Valor de expires at mantenido por la instancia.
       */
      expiresAt: Date;
    },
  ): GraphPathCache {
    return em.create(
      GraphPathCache,
      { ...data, calculatedAt: new Date() } as never,
      { partial: true },
    );
  }

  /**
   * Entradas de caché que contienen alguna de las aristas dadas. Se resuelve en
   * memoria y no con un operador de array en SQL porque la caché es pequeña por
   * definición —tiene TTL— y así el módulo no depende de la sintaxis de arrays de
   * Postgres para una invalidación que tiene que ser obviamente correcta.
   */
  async deleteCachedPathsTouchingEdges(
    em: EntityManager,
    tenantId: string,
    edgeIds: string[],
  ): Promise<number> {
    if (edgeIds.length === 0) return 0;
    const entries = await em.find(GraphPathCache, { tenantId });
    const affected = entries.filter((entry) =>
      (entry.pathEdges ?? []).some((edgeId) => edgeIds.includes(edgeId)),
    );
    if (affected.length === 0) return 0;
    return em.nativeDelete(GraphPathCache, {
      id: { $in: affected.map((e) => e.id) },
    });
  }

  /**
   * Elimina o desactiva delete cached paths touching nodes.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param nodeIds - Valor de node ids requerido por la operación.
   * @returns Resultado de delete cached paths touching nodes conforme al contrato `Promise<number>`.
   */
  async deleteCachedPathsTouchingNodes(
    em: EntityManager,
    tenantId: string,
    nodeIds: string[],
  ): Promise<number> {
    if (nodeIds.length === 0) return 0;
    const entries = await em.find(GraphPathCache, { tenantId });
    const affected = entries.filter(
      (entry) =>
        nodeIds.includes(entry.startNodeId) ||
        nodeIds.includes(entry.endNodeId) ||
        (entry.pathNodes ?? []).some((nodeId) => nodeIds.includes(nodeId)),
    );
    if (affected.length === 0) return 0;
    return em.nativeDelete(GraphPathCache, {
      id: { $in: affected.map((e) => e.id) },
    });
  }

  // --- Comunidades (UC-61-06, 11) ---

  /**
   * Las comunidades de una versión de algoritmo se reemplazan enteras: una
   * detección parcial no es un resultado, y mezclar dos ejecuciones daría
   * comunidades que nunca coexistieron.
   */
  findCommunitiesByAlgorithm(
    em: EntityManager,
    tenantId: string,
    communityType: string,
    algorithmVersion: string,
  ): Promise<GraphCommunities[]> {
    return em.find(GraphCommunities, {
      tenantId,
      communityType,
      algorithmVersion,
    });
  }

  /**
   * Crea create community.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create community conforme al contrato `GraphCommunities`.
   */
  createCommunity(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Valor de community type mantenido por la instancia.
       */
      communityType: string;
      /**
       * Valor de algorithm version mantenido por la instancia.
       */
      algorithmVersion: string;
      /**
       * Valor de member node ids mantenido por la instancia.
       */
      memberNodeIds: string[];
      /**
       * Valor de score mantenido por la instancia.
       */
      score: number;
    },
  ): GraphCommunities {
    return em.create(
      GraphCommunities,
      { ...data, calculatedAt: new Date() } as never,
      { partial: true },
    );
  }

  /**
   * Elimina o desactiva delete communities.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Valor de ids requerido por la operación.
   * @returns Resultado de delete communities conforme al contrato `Promise<number>`.
   */
  async deleteCommunities(em: EntityManager, ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    return em.nativeDelete(GraphCommunities, { id: { $in: ids } });
  }

  /**
   * Obtiene find communities by tenant.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @returns Resultado de find communities by tenant conforme al contrato `Promise<GraphCommunities[]>`.
   */
  findCommunitiesByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<GraphCommunities[]> {
    return em.find(GraphCommunities, { tenantId });
  }

  // --- Riesgo (UC-61-07, 11, 12) ---

  /**
   * Obtiene find risk score for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param key - Valor de key requerido por la operación.
   * @returns Resultado de find risk score for update conforme al contrato `Promise<GraphRiskScores | null>`.
   */
  findRiskScoreForUpdate(
    em: EntityManager,
    key: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a node.
       */
      nodeId: string;
      /**
       * Valor de risk type mantenido por la instancia.
       */
      riskType: string;
      /**
       * Valor de model version mantenido por la instancia.
       */
      modelVersion: string;
    },
  ): Promise<GraphRiskScores | null> {
    return em.findOne(GraphRiskScores, key, {
      lockMode: LockMode.PESSIMISTIC_WRITE,
    });
  }

  /**
   * Crea create risk score.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create risk score conforme al contrato `GraphRiskScores`.
   */
  createRiskScore(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a node.
       */
      nodeId: string;
      /**
       * Valor de risk type mantenido por la instancia.
       */
      riskType: string;
      /**
       * Valor de score mantenido por la instancia.
       */
      score: number;
      /**
       * Valor de model version mantenido por la instancia.
       */
      modelVersion: string;
      /**
       * Valor de explanation redacted mantenido por la instancia.
       */
      explanationRedacted?: string;
      /**
       * Valor de expires at mantenido por la instancia.
       */
      expiresAt: Date;
    },
  ): GraphRiskScores {
    return em.create(
      GraphRiskScores,
      { ...data, calculatedAt: new Date() } as never,
      { partial: true },
    );
  }

  /** Puntajes de los nodos afectados; se caducan para forzar su recálculo. */
  findRiskScoresByNodesForUpdate(
    em: EntityManager,
    nodeIds: string[],
  ): Promise<GraphRiskScores[]> {
    if (nodeIds.length === 0) return Promise.resolve([]);
    return em.find(
      GraphRiskScores,
      { nodeId: { $in: nodeIds } },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Elimina o desactiva delete risk scores by nodes.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param nodeIds - Valor de node ids requerido por la operación.
   * @returns Resultado de delete risk scores by nodes conforme al contrato `Promise<number>`.
   */
  async deleteRiskScoresByNodes(
    em: EntityManager,
    nodeIds: string[],
  ): Promise<number> {
    if (nodeIds.length === 0) return 0;
    return em.nativeDelete(GraphRiskScores, { nodeId: { $in: nodeIds } });
  }

  // --- Reglas y hallazgos (UC-61-08, 09) ---

  /**
   * Obtiene find rule definition by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find rule definition by id conforme al contrato `Promise<GraphRuleDefinitions | null>`.
   */
  findRuleDefinitionById(
    em: EntityManager,
    id: string,
  ): Promise<GraphRuleDefinitions | null> {
    return em.findOne(GraphRuleDefinitions, { id });
  }

  /**
   * Hallazgo vivo del mismo patrón sobre el mismo nodo. Es la deduplicación que
   * impide que una regla que se evalúa cada hora genere veinticuatro alertas
   * idénticas al día del mismo caso.
   */
  findLiveHit(
    em: EntityManager,
    graphRuleDefinitionId: string,
    primaryNodeId: string,
    liveStatuses: string[],
  ): Promise<GraphRuleHits | null> {
    return em.findOne(GraphRuleHits, {
      graphRuleDefinitionId,
      primaryNodeId,
      status: { $in: liveStatuses },
    });
  }

  /**
   * Crea create hit.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create hit conforme al contrato `GraphRuleHits`.
   */
  createHit(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a graph rule definition.
       */
      graphRuleDefinitionId: string;
      /**
       * Identificador asociado a primary node.
       */
      primaryNodeId: string;
      /**
       * Valor de related node ids mantenido por la instancia.
       */
      relatedNodeIds: string[];
      /**
       * Valor de evidence edge ids mantenido por la instancia.
       */
      evidenceEdgeIds: string[];
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
    },
  ): GraphRuleHits {
    return em.create(
      GraphRuleHits,
      { ...data, detectedAt: new Date() } as never,
      { partial: true },
    );
  }

  /**
   * Obtiene find hit for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find hit for update conforme al contrato `Promise<GraphRuleHits | null>`.
   */
  findHitForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<GraphRuleHits | null> {
    return em.findOne(
      GraphRuleHits,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Jobs de borrado (UC-61-11, 12) ---

  /** Job vivo para la misma entidad; evita lanzar dos purgas del mismo nodo. */
  findActiveDeletionJob(
    em: EntityManager,
    tenantId: string,
    sourceEntityType: string,
    sourceEntityId: string,
    activeStatuses: string[],
  ): Promise<GraphDeletionJobs | null> {
    return em.findOne(GraphDeletionJobs, {
      tenantId,
      sourceEntityType,
      sourceEntityId,
      status: { $in: activeStatuses },
    });
  }

  /**
   * Crea create deletion job.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create deletion job conforme al contrato `GraphDeletionJobs`.
   */
  createDeletionJob(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Valor de source entity type mantenido por la instancia.
       */
      sourceEntityType: string;
      /**
       * Identificador asociado a source entity.
       */
      sourceEntityId: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
    },
  ): GraphDeletionJobs {
    return em.create(
      GraphDeletionJobs,
      {
        ...data,
        nodesDeleted: 0,
        edgesDeleted: 0,
        requestedAt: new Date(),
      } as never,
      { partial: true },
    );
  }

  /**
   * Obtiene find deletion job for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find deletion job for update conforme al contrato `Promise<GraphDeletionJobs | null>`.
   */
  findDeletionJobForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<GraphDeletionJobs | null> {
    return em.findOne(
      GraphDeletionJobs,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }
}
