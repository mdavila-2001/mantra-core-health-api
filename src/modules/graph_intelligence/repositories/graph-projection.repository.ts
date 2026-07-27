import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  GraphNodes,
  GraphNodeIdentifiers,
  GraphEdges,
  GraphEdgeEvidence,
  GraphProjectionDefinitions,
  GraphProjectionRuns,
} from '../entities';

export interface UpsertNodeData {
  tenantId: string;
  nodeType: string;
  sourceEntityType: string;
  sourceEntityId: string;
  sourceVersion: string;
  displayLabelRedacted: string;
  properties?: unknown;
  securityLabels: string[];
  lifecycleState: string;
}

export interface UpsertEdgeData {
  tenantId: string;
  fromNodeId: string;
  toNodeId: string;
  relationshipType: string;
  directionality: string;
  effectiveFrom: Date;
  confidenceScore: number;
  sourceEntityType: string;
  sourceEntityId: string;
  properties?: unknown;
  lifecycleState: string;
}

export interface CreateEvidenceData {
  edgeId: string;
  evidenceType: string;
  sourceReference?: string;
  evidenceHash: string;
  observedAt: Date;
  confidenceDelta: number;
}

/**
 * Proyección del grafo: nodos, sus identificadores hasheados, aristas, la
 * evidencia que las sostiene y las corridas que las escriben.
 *
 * **El grafo es una proyección, no la fuente de verdad.** Todo lo de aquí se
 * deriva de eventos de Postgres, y por eso cada `upsert` va acompañado de una
 * comprobación de versión: un evento que llega tarde no puede pisar uno posterior.
 */
@Injectable()
export class GraphProjectionRepository {
  // --- Nodos (UC-61-01, 05, 11, 12) ---

  /**
   * Clave natural del nodo: `(tenant, tipo de entidad fuente, id fuente)`. Es lo
   * que hace idempotente la proyección — el mismo evento reprocesado reencuentra
   * su nodo en vez de crear otro.
   */
  findNodeBySourceForUpdate(
    em: EntityManager,
    tenantId: string,
    sourceEntityType: string,
    sourceEntityId: string,
  ): Promise<GraphNodes | null> {
    return em.findOne(
      GraphNodes,
      { tenantId, sourceEntityType, sourceEntityId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findNodeById(em: EntityManager, id: string): Promise<GraphNodes | null> {
    return em.findOne(GraphNodes, { nodeId: id });
  }

  createNode(em: EntityManager, data: UpsertNodeData): GraphNodes {
    return em.create(GraphNodes, { ...data, updatedAt: new Date() } as never, {
      partial: true,
    });
  }

  findNodesByIds(em: EntityManager, ids: string[]): Promise<GraphNodes[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(GraphNodes, { nodeId: { $in: ids } });
  }

  async deleteNodes(em: EntityManager, ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    return em.nativeDelete(GraphNodes, { nodeId: { $in: ids } });
  }

  // --- Identificadores (UC-61-01, 11) ---

  /**
   * El identificador se busca por su **hash**, nunca por su valor: el módulo no
   * guarda documentos de identidad en claro, y buscar por el valor obligaría a
   * tenerlo.
   */
  findIdentifier(
    em: EntityManager,
    nodeId: string,
    identifierSystem: string,
    identifierValueHash: string,
  ): Promise<GraphNodeIdentifiers | null> {
    return em.findOne(GraphNodeIdentifiers, {
      nodeId,
      identifierSystem,
      identifierValueHash,
    });
  }

  createIdentifier(
    em: EntityManager,
    data: {
      nodeId: string;
      identifierSystem: string;
      identifierValueHash: string;
      identifierType?: string;
      isPrimary: boolean;
    },
  ): GraphNodeIdentifiers {
    return em.create(GraphNodeIdentifiers, data as never, { partial: true });
  }

  findIdentifiersByNodes(
    em: EntityManager,
    nodeIds: string[],
  ): Promise<GraphNodeIdentifiers[]> {
    if (nodeIds.length === 0) return Promise.resolve([]);
    return em.find(GraphNodeIdentifiers, { nodeId: { $in: nodeIds } });
  }

  async deleteIdentifiersByNodes(
    em: EntityManager,
    nodeIds: string[],
  ): Promise<number> {
    if (nodeIds.length === 0) return 0;
    return em.nativeDelete(GraphNodeIdentifiers, { nodeId: { $in: nodeIds } });
  }

  // --- Aristas (UC-61-02, 05, 10, 11) ---

  findEdgeBySourceForUpdate(
    em: EntityManager,
    tenantId: string,
    sourceEntityType: string,
    sourceEntityId: string,
    relationshipType: string,
  ): Promise<GraphEdges | null> {
    return em.findOne(
      GraphEdges,
      { tenantId, sourceEntityType, sourceEntityId, relationshipType },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findEdgeForUpdate(em: EntityManager, id: string): Promise<GraphEdges | null> {
    return em.findOne(
      GraphEdges,
      { edgeId: id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  createEdge(em: EntityManager, data: UpsertEdgeData): GraphEdges {
    return em.create(GraphEdges, data as never, { partial: true });
  }

  /**
   * Aristas salientes activas de un conjunto de nodos. Es el paso de un salto del
   * traversal: se piden todas las de un nivel a la vez en vez de una consulta por
   * nodo, que con un nodo muy conectado serían cientos.
   */
  findActiveEdgesFrom(
    em: EntityManager,
    tenantId: string,
    fromNodeIds: string[],
    activeState: string,
    relationshipTypes?: string[],
  ): Promise<GraphEdges[]> {
    if (fromNodeIds.length === 0) return Promise.resolve([]);
    const where: Record<string, unknown> = {
      tenantId,
      fromNodeId: { $in: fromNodeIds },
      lifecycleState: activeState,
    };
    if (relationshipTypes && relationshipTypes.length > 0) {
      where.relationshipType = { $in: relationshipTypes };
    }
    return em.find(GraphEdges, where);
  }

  /** Aristas incidentes a un nodo, en cualquier sentido: las que borra su purga. */
  findEdgesTouchingNodes(
    em: EntityManager,
    nodeIds: string[],
  ): Promise<GraphEdges[]> {
    if (nodeIds.length === 0) return Promise.resolve([]);
    return em.find(GraphEdges, {
      $or: [{ fromNodeId: { $in: nodeIds } }, { toNodeId: { $in: nodeIds } }],
    });
  }

  async deleteEdges(em: EntityManager, ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    return em.nativeDelete(GraphEdges, { edgeId: { $in: ids } });
  }

  // --- Evidencia (UC-61-02, 10) ---

  /**
   * Append-only. La evidencia es lo que justifica la confianza de una arista;
   * poder editarla convertiría la confianza en un número sin respaldo.
   */
  createEvidence(
    em: EntityManager,
    data: CreateEvidenceData,
  ): GraphEdgeEvidence {
    return em.create(GraphEdgeEvidence, data as never, { partial: true });
  }

  findEvidenceByHash(
    em: EntityManager,
    edgeId: string,
    evidenceHash: string,
  ): Promise<GraphEdgeEvidence | null> {
    return em.findOne(GraphEdgeEvidence, { edgeId, evidenceHash });
  }

  findEvidenceByEdge(
    em: EntityManager,
    edgeId: string,
  ): Promise<GraphEdgeEvidence[]> {
    return em.find(
      GraphEdgeEvidence,
      { edgeId },
      { orderBy: { observedAt: 'ASC' } },
    );
  }

  async deleteEvidenceByEdges(
    em: EntityManager,
    edgeIds: string[],
  ): Promise<number> {
    if (edgeIds.length === 0) return 0;
    return em.nativeDelete(GraphEdgeEvidence, { edgeId: { $in: edgeIds } });
  }

  // --- Definiciones y corridas de proyección (UC-61-03) ---

  findDefinitionById(
    em: EntityManager,
    id: string,
  ): Promise<GraphProjectionDefinitions | null> {
    return em.findOne(GraphProjectionDefinitions, { id });
  }

  /**
   * Corrida viva de la definición. `SKIP LOCKED` porque dos disparos concurrentes
   * no deben esperarse: el segundo tiene que ver que ya hay una corriendo y
   * rendirse, no bloquearse hasta que la primera termine.
   */
  findRunningRunForUpdate(
    em: EntityManager,
    graphProjectionDefinitionId: string,
    runningStatus: string,
  ): Promise<GraphProjectionRuns | null> {
    return em.findOne(
      GraphProjectionRuns,
      { graphProjectionDefinitionId, status: runningStatus },
      { lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE },
    );
  }

  findRunForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<GraphProjectionRuns | null> {
    return em.findOne(
      GraphProjectionRuns,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  createRun(
    em: EntityManager,
    data: {
      tenantId: string;
      graphProjectionDefinitionId: string;
      status: string;
      sourceCheckpoint?: string;
      startedAt: Date;
    },
  ): GraphProjectionRuns {
    return em.create(
      GraphProjectionRuns,
      { ...data, nodesWritten: '0', edgesWritten: '0' } as never,
      { partial: true },
    );
  }
}
