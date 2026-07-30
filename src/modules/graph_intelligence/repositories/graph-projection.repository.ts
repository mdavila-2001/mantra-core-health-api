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

/**
 * Describe el contrato estructural de upsert node data.
 */
export interface UpsertNodeData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de node type mantenido por la instancia.
   */
  nodeType: string;
  /**
   * Valor de source entity type mantenido por la instancia.
   */
  sourceEntityType: string;
  /**
   * Identificador asociado a source entity.
   */
  sourceEntityId: string;
  /**
   * Valor de source version mantenido por la instancia.
   */
  sourceVersion: string;
  /**
   * Valor de display label redacted mantenido por la instancia.
   */
  displayLabelRedacted: string;
  /**
   * Valor de properties mantenido por la instancia.
   */
  properties?: unknown;
  /**
   * Valor de security labels mantenido por la instancia.
   */
  securityLabels: string[];
  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  lifecycleState: string;
}

/**
 * Describe el contrato estructural de upsert edge data.
 */
export interface UpsertEdgeData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a from node.
   */
  fromNodeId: string;
  /**
   * Identificador asociado a to node.
   */
  toNodeId: string;
  /**
   * Valor de relationship type mantenido por la instancia.
   */
  relationshipType: string;
  /**
   * Valor de directionality mantenido por la instancia.
   */
  directionality: string;
  /**
   * Valor de effective from mantenido por la instancia.
   */
  effectiveFrom: Date;
  /**
   * Valor de confidence score mantenido por la instancia.
   */
  confidenceScore: number;
  /**
   * Valor de source entity type mantenido por la instancia.
   */
  sourceEntityType: string;
  /**
   * Identificador asociado a source entity.
   */
  sourceEntityId: string;
  /**
   * Valor de properties mantenido por la instancia.
   */
  properties?: unknown;
  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  lifecycleState: string;
}

/**
 * Describe el contrato estructural de create evidence data.
 */
export interface CreateEvidenceData {
  /**
   * Identificador asociado a edge.
   */
  edgeId: string;
  /**
   * Valor de evidence type mantenido por la instancia.
   */
  evidenceType: string;
  /**
   * Valor de source reference mantenido por la instancia.
   */
  sourceReference?: string;
  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  evidenceHash: string;
  /**
   * Valor de observed at mantenido por la instancia.
   */
  observedAt: Date;
  /**
   * Valor de confidence delta mantenido por la instancia.
   */
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

  /**
   * Obtiene find node by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find node by id conforme al contrato `Promise<GraphNodes | null>`.
   */
  findNodeById(em: EntityManager, id: string): Promise<GraphNodes | null> {
    return em.findOne(GraphNodes, { nodeId: id });
  }

  /**
   * Crea create node.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create node conforme al contrato `GraphNodes`.
   */
  createNode(em: EntityManager, data: UpsertNodeData): GraphNodes {
    return em.create(GraphNodes, { ...data, updatedAt: new Date() } as never, {
      partial: true,
    });
  }

  /**
   * Obtiene find nodes by ids.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Valor de ids requerido por la operación.
   * @returns Resultado de find nodes by ids conforme al contrato `Promise<GraphNodes[]>`.
   */
  findNodesByIds(em: EntityManager, ids: string[]): Promise<GraphNodes[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(GraphNodes, { nodeId: { $in: ids } });
  }

  /**
   * Elimina o desactiva delete nodes.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Valor de ids requerido por la operación.
   * @returns Resultado de delete nodes conforme al contrato `Promise<number>`.
   */
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

  /**
   * Crea create identifier.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create identifier conforme al contrato `GraphNodeIdentifiers`.
   */
  createIdentifier(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a node.
       */
      nodeId: string;
      /**
       * Valor de identifier system mantenido por la instancia.
       */
      identifierSystem: string;
      /**
       * Valor de identifier value hash mantenido por la instancia.
       */
      identifierValueHash: string;
      /**
       * Valor de identifier type mantenido por la instancia.
       */
      identifierType?: string;
      /**
       * Valor de is primary mantenido por la instancia.
       */
      isPrimary: boolean;
    },
  ): GraphNodeIdentifiers {
    return em.create(GraphNodeIdentifiers, data as never, { partial: true });
  }

  /**
   * Obtiene find identifiers by nodes.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param nodeIds - Valor de node ids requerido por la operación.
   * @returns Resultado de find identifiers by nodes conforme al contrato `Promise<GraphNodeIdentifiers[]>`.
   */
  findIdentifiersByNodes(
    em: EntityManager,
    nodeIds: string[],
  ): Promise<GraphNodeIdentifiers[]> {
    if (nodeIds.length === 0) return Promise.resolve([]);
    return em.find(GraphNodeIdentifiers, { nodeId: { $in: nodeIds } });
  }

  /**
   * Elimina o desactiva delete identifiers by nodes.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param nodeIds - Valor de node ids requerido por la operación.
   * @returns Resultado de delete identifiers by nodes conforme al contrato `Promise<number>`.
   */
  async deleteIdentifiersByNodes(
    em: EntityManager,
    nodeIds: string[],
  ): Promise<number> {
    if (nodeIds.length === 0) return 0;
    return em.nativeDelete(GraphNodeIdentifiers, { nodeId: { $in: nodeIds } });
  }

  // --- Aristas (UC-61-02, 05, 10, 11) ---

  /**
   * Obtiene find edge by source for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @param sourceEntityType - Valor de source entity type requerido por la operación.
   * @param sourceEntityId - Identificador de source entity.
   * @param relationshipType - Valor de relationship type requerido por la operación.
   * @returns Resultado de find edge by source for update conforme al contrato `Promise<GraphEdges | null>`.
   */
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

  /**
   * Obtiene find edge for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find edge for update conforme al contrato `Promise<GraphEdges | null>`.
   */
  findEdgeForUpdate(em: EntityManager, id: string): Promise<GraphEdges | null> {
    return em.findOne(
      GraphEdges,
      { edgeId: id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Crea create edge.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create edge conforme al contrato `GraphEdges`.
   */
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

  /**
   * Elimina o desactiva delete edges.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Valor de ids requerido por la operación.
   * @returns Resultado de delete edges conforme al contrato `Promise<number>`.
   */
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

  /**
   * Obtiene find evidence by hash.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param edgeId - Identificador de edge.
   * @param evidenceHash - Valor de evidence hash requerido por la operación.
   * @returns Resultado de find evidence by hash conforme al contrato `Promise<GraphEdgeEvidence | null>`.
   */
  findEvidenceByHash(
    em: EntityManager,
    edgeId: string,
    evidenceHash: string,
  ): Promise<GraphEdgeEvidence | null> {
    return em.findOne(GraphEdgeEvidence, { edgeId, evidenceHash });
  }

  /**
   * Obtiene find evidence by edge.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param edgeId - Identificador de edge.
   * @returns Resultado de find evidence by edge conforme al contrato `Promise<GraphEdgeEvidence[]>`.
   */
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

  /**
   * Elimina o desactiva delete evidence by edges.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param edgeIds - Valor de edge ids requerido por la operación.
   * @returns Resultado de delete evidence by edges conforme al contrato `Promise<number>`.
   */
  async deleteEvidenceByEdges(
    em: EntityManager,
    edgeIds: string[],
  ): Promise<number> {
    if (edgeIds.length === 0) return 0;
    return em.nativeDelete(GraphEdgeEvidence, { edgeId: { $in: edgeIds } });
  }

  // --- Definiciones y corridas de proyección (UC-61-03) ---

  /**
   * Obtiene find definition by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find definition by id conforme al contrato `Promise<GraphProjectionDefinitions | null>`.
   */
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

  /**
   * Obtiene find run for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find run for update conforme al contrato `Promise<GraphProjectionRuns | null>`.
   */
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

  /**
   * Crea create run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create run conforme al contrato `GraphProjectionRuns`.
   */
  createRun(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a graph projection definition.
       */
      graphProjectionDefinitionId: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
      /**
       * Valor de source checkpoint mantenido por la instancia.
       */
      sourceCheckpoint?: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
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
