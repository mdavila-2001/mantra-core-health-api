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

  findScopeById(
    em: EntityManager,
    id: string,
  ): Promise<GraphAccessScopes | null> {
    return em.findOne(GraphAccessScopes, { id });
  }

  createScope(
    em: EntityManager,
    data: {
      tenantId: string;
      scopeCode: string;
      allowedNodeTypes: string[];
      allowedRelationshipTypes: string[];
      purposeOfUseCodes: string[];
      maxHops: number;
      requiresPatientContext: boolean;
      state: string;
    },
  ): GraphAccessScopes {
    return em.create(GraphAccessScopes, data as never, { partial: true });
  }

  // --- Caché de rutas (UC-61-05, 10, 12) ---

  findCachedPath(
    em: EntityManager,
    key: {
      tenantId: string;
      startNodeId: string;
      endNodeId: string;
      relationshipFilterHash: string;
      maxHops: number;
    },
  ): Promise<GraphPathCache | null> {
    return em.findOne(GraphPathCache, key);
  }

  createCachedPath(
    em: EntityManager,
    data: {
      tenantId: string;
      startNodeId: string;
      endNodeId: string;
      relationshipFilterHash: string;
      maxHops: number;
      pathNodes: string[];
      pathEdges: string[];
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

  createCommunity(
    em: EntityManager,
    data: {
      tenantId: string;
      communityType: string;
      algorithmVersion: string;
      memberNodeIds: string[];
      score: number;
    },
  ): GraphCommunities {
    return em.create(
      GraphCommunities,
      { ...data, calculatedAt: new Date() } as never,
      { partial: true },
    );
  }

  async deleteCommunities(em: EntityManager, ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    return em.nativeDelete(GraphCommunities, { id: { $in: ids } });
  }

  findCommunitiesByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<GraphCommunities[]> {
    return em.find(GraphCommunities, { tenantId });
  }

  // --- Riesgo (UC-61-07, 11, 12) ---

  findRiskScoreForUpdate(
    em: EntityManager,
    key: {
      tenantId: string;
      nodeId: string;
      riskType: string;
      modelVersion: string;
    },
  ): Promise<GraphRiskScores | null> {
    return em.findOne(GraphRiskScores, key, {
      lockMode: LockMode.PESSIMISTIC_WRITE,
    });
  }

  createRiskScore(
    em: EntityManager,
    data: {
      tenantId: string;
      nodeId: string;
      riskType: string;
      score: number;
      modelVersion: string;
      explanationRedacted?: string;
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

  async deleteRiskScoresByNodes(
    em: EntityManager,
    nodeIds: string[],
  ): Promise<number> {
    if (nodeIds.length === 0) return 0;
    return em.nativeDelete(GraphRiskScores, { nodeId: { $in: nodeIds } });
  }

  // --- Reglas y hallazgos (UC-61-08, 09) ---

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

  createHit(
    em: EntityManager,
    data: {
      tenantId: string;
      graphRuleDefinitionId: string;
      primaryNodeId: string;
      relatedNodeIds: string[];
      evidenceEdgeIds: string[];
      status: string;
    },
  ): GraphRuleHits {
    return em.create(
      GraphRuleHits,
      { ...data, detectedAt: new Date() } as never,
      { partial: true },
    );
  }

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

  createDeletionJob(
    em: EntityManager,
    data: {
      tenantId: string;
      sourceEntityType: string;
      sourceEntityId: string;
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
