import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import type { GraphAccessScopes, GraphNodes } from '../entities';
import {
  GraphAnalyticsRepository,
  GraphProjectionRepository,
} from '../repositories';
import { MAX_TRAVERSAL_NODES, PATH_CACHE_TTL_SECONDS } from '../constants';
import {
  DefineAccessScopeDto,
  UpdateAccessScopeDto,
  AccessScopeResponseDto,
  TraverseDto,
  TraverseResponseDto,
  FindPathDto,
  PathResponseDto,
} from '../dto';

/** Lo que un recorrido acumula mientras avanza. */
interface TraversalResult {
  /**
   * Valor de visited mantenido por la instancia.
   */
  visited: Map<
    string,
    {
      /**
       * Valor de node mantenido por la instancia.
       */
      node: GraphNodes; /**
       * Valor de depth mantenido por la instancia.
       */
      depth: number;
    }
  >;
  /**
   * Valor de edge count mantenido por la instancia.
   */
  edgeCount: number;
  /**
   * Valor de depth reached mantenido por la instancia.
   */
  depthReached: number;
  /**
   * Valor de truncated mantenido por la instancia.
   */
  truncated: boolean;
  /** Nodo padre de cada visitado, para reconstruir el camino. */
  parent: Map<
    string,
    {
      /**
       * Identificador asociado a node.
       */
      nodeId: string; /**
       * Identificador asociado a edge.
       */
      edgeId: string;
    }
  >;
}

/**
 * Alcance de acceso y recorrido del grafo (UC-61-04, 05).
 *
 * La regla que define este servicio: **el scoping se aplica dentro del recorrido,
 * no después**. Un nodo fuera de alcance no se visita, así que tampoco se
 * recorren sus aristas ni se llega a lo que hay detrás. Filtrar al final daría el
 * mismo listado pero habría revelado la topología por el camino.
 */
@Injectable()
export class GraphTraversalService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param analyticsRepo - Valor de analytics repo requerido por la operación.
   * @param projectionRepo - Valor de projection repo requerido por la operación.
   * @param outbox - Valor de outbox requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly analyticsRepo: GraphAnalyticsRepository,
    private readonly projectionRepo: GraphProjectionRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GraphTraversalService.name);
  }

  /** UC-61-04 (alta): definir el alcance de acceso al grafo. */
  async defineAccessScope(
    dto: DefineAccessScopeDto,
    actor: AuthenticatedUser,
  ): Promise<AccessScopeResponseDto> {
    return this.em.transactional(async (tx) => {
      const duplicate = await this.analyticsRepo.findScopeByCodeForUpdate(
        tx,
        dto.tenantId,
        dto.scopeCode,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe un alcance con ese código para el tenant.',
          {
            tenantId: dto.tenantId,
            scopeCode: dto.scopeCode,
          },
        );
      }

      const scope = this.analyticsRepo.createScope(tx, {
        tenantId: dto.tenantId,
        scopeCode: dto.scopeCode,
        allowedNodeTypes: dto.allowedNodeTypes,
        allowedRelationshipTypes: dto.allowedRelationshipTypes,
        purposeOfUseCodes: dto.purposeOfUseCodes,
        maxHops: dto.maxHops,
        requiresPatientContext: dto.requiresPatientContext === true,
        state: 'active',
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'GraphAccessScopeChanged',
        aggregateType: 'graph_intelligence.graph_access_scopes',
        aggregateId: scope.id,
        payloadJson: {
          scopeCode: scope.scopeCode,
          state: scope.state,
          maxHops: scope.maxHops,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'graph.scope.define',
          scopeId: scope.id,
          scopeCode: scope.scopeCode,
        },
        'Alcance de acceso al grafo definido',
      );

      return {
        id: scope.id,
        scopeCode: scope.scopeCode,
        maxHops: scope.maxHops,
        state: scope.state,
      };
    });
  }

  /**
   * UC-61-04 (cambio): ajustar el alcance.
   *
   * Cualquier cambio publica `GraphAccessScopeChanged`, también un simple cambio
   * de estado: las cachés de sesión guardan qué puede ver cada actor, y si no se
   * invalidan, suspender un alcance no suspendería nada hasta que expiraran solas.
   */
  async updateAccessScope(
    scopeId: string,
    dto: UpdateAccessScopeDto,
    actor: AuthenticatedUser,
  ): Promise<AccessScopeResponseDto> {
    return this.em.transactional(async (tx) => {
      const scope = await this.analyticsRepo.findScopeById(tx, scopeId);
      if (!scope) {
        throw new ResourceNotFoundException(
          'Alcance de acceso no encontrado.',
          { scopeId },
        );
      }

      if (dto.state) scope.state = dto.state;
      if (dto.allowedNodeTypes) scope.allowedNodeTypes = dto.allowedNodeTypes;
      if (dto.allowedRelationshipTypes) {
        scope.allowedRelationshipTypes = dto.allowedRelationshipTypes;
      }
      if (dto.purposeOfUseCodes)
        scope.purposeOfUseCodes = dto.purposeOfUseCodes;
      if (dto.maxHops !== undefined) scope.maxHops = dto.maxHops;
      if (dto.requiresPatientContext !== undefined) {
        scope.requiresPatientContext = dto.requiresPatientContext;
      }

      await this.outbox.publishDomainEvent(tx, {
        tenantId: scope.tenantId,
        eventType: 'GraphAccessScopeChanged',
        aggregateType: 'graph_intelligence.graph_access_scopes',
        aggregateId: scope.id,
        payloadJson: {
          scopeCode: scope.scopeCode,
          state: scope.state,
          maxHops: scope.maxHops,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        { operation: 'graph.scope.update', scopeId, state: scope.state },
        'Alcance de acceso al grafo actualizado',
      );

      return {
        id: scope.id,
        scopeCode: scope.scopeCode,
        maxHops: scope.maxHops,
        state: scope.state,
      };
    });
  }

  /** UC-61-05 (recorrido): explorar desde un nodo dentro del alcance. */
  async traverse(
    dto: TraverseDto,
    actor: AuthenticatedUser,
  ): Promise<TraverseResponseDto> {
    return this.em.transactional(async (tx) => {
      const scope = await this.requireActiveScope(tx, dto);
      const start = await this.requireStartNode(
        tx,
        dto.startNodeId,
        dto.tenantId,
        scope,
      );

      const result = await this.walk(tx, dto, scope, start);

      this.logger.info(
        {
          operation: 'graph.traverse',
          startNodeId: dto.startNodeId,
          scopeCode: dto.scopeCode,
          purposeOfUse: dto.purposeOfUse,
          nodes: result.visited.size,
          depthReached: result.depthReached,
        },
        'Recorrido del grafo ejecutado',
      );

      return {
        startNodeId: dto.startNodeId,
        nodes: [...result.visited.values()].map(({ node, depth }) => ({
          nodeId: node.nodeId,
          nodeType: node.nodeType,
          displayLabelRedacted: node.displayLabelRedacted,
          depth,
        })),
        edgeCount: result.edgeCount,
        depthReached: result.depthReached,
        truncated: result.truncated,
      };
    });
  }

  /**
   * UC-61-05 (ruta): buscar el camino entre dos nodos.
   *
   * La caché se consulta **después** de validar el alcance, nunca antes. Al revés,
   * un actor sin permiso recibiría de la caché una ruta que no tiene derecho a
   * ver, y el filtro de seguridad sería un adorno que sólo se aplica cuando falla
   * la caché.
   */
  async findPath(
    dto: FindPathDto,
    actor: AuthenticatedUser,
  ): Promise<PathResponseDto> {
    return this.em.transactional(async (tx) => {
      const scope = await this.requireActiveScope(tx, dto);
      const start = await this.requireStartNode(
        tx,
        dto.startNodeId,
        dto.tenantId,
        scope,
      );

      const maxHops = Math.min(dto.maxHops ?? scope.maxHops, scope.maxHops);
      const relationshipFilterHash = this.hashFilter(
        dto.relationshipFilter,
        scope,
      );

      const cached = await this.analyticsRepo.findCachedPath(tx, {
        tenantId: dto.tenantId,
        startNodeId: dto.startNodeId,
        endNodeId: dto.endNodeId,
        relationshipFilterHash,
        maxHops,
      });
      if (cached && cached.expiresAt > new Date()) {
        return {
          startNodeId: dto.startNodeId,
          endNodeId: dto.endNodeId,
          found: cached.pathNodes.length > 0,
          pathNodes: cached.pathNodes,
          pathEdges: cached.pathEdges,
          fromCache: true,
        };
      }

      const result = await this.walk(
        tx,
        { ...dto, maxHops },
        scope,
        start,
        dto.endNodeId,
      );

      const pathNodes: string[] = [];
      const pathEdges: string[] = [];
      if (result.visited.has(dto.endNodeId)) {
        let current = dto.endNodeId;
        pathNodes.unshift(current);
        while (current !== dto.startNodeId) {
          const step = result.parent.get(current);
          if (!step) break;
          pathEdges.unshift(step.edgeId);
          pathNodes.unshift(step.nodeId);
          current = step.nodeId;
        }
      }

      // Se cachea también el "no hay camino": recalcular una ausencia cuesta lo
      // mismo que calcular una presencia, y es la consulta que más se repite.
      if (!cached) {
        this.analyticsRepo.createCachedPath(tx, {
          tenantId: dto.tenantId,
          startNodeId: dto.startNodeId,
          endNodeId: dto.endNodeId,
          relationshipFilterHash,
          maxHops,
          pathNodes,
          pathEdges,
          expiresAt: new Date(Date.now() + PATH_CACHE_TTL_SECONDS * 1000),
        });
      } else {
        cached.pathNodes = pathNodes;
        cached.pathEdges = pathEdges;
        cached.calculatedAt = new Date();
        cached.expiresAt = new Date(Date.now() + PATH_CACHE_TTL_SECONDS * 1000);
      }

      this.logger.info(
        {
          operation: 'graph.path',
          startNodeId: dto.startNodeId,
          endNodeId: dto.endNodeId,
          found: pathNodes.length > 0,
          hops: Math.max(pathEdges.length, 0),
        },
        'Ruta del grafo calculada',
      );

      return {
        startNodeId: dto.startNodeId,
        endNodeId: dto.endNodeId,
        found: pathNodes.length > 0,
        pathNodes,
        pathEdges,
        fromCache: false,
      };
    });
  }

  // --- Piezas compartidas -------------------------------------------------

  /**
   * Recorrido en anchura con poda por seguridad.
   *
   * En cada nivel se piden todas las aristas salientes de una vez en vez de una
   * consulta por nodo: con un nodo muy conectado eso serían cientos de viajes a la
   * base para un solo salto.
   */
  private async walk(
    tx: EntityManager,
    dto: TraverseDto,
    scope: GraphAccessScopes,
    start: GraphNodes,
    stopAtNodeId?: string,
  ): Promise<TraversalResult> {
    const maxHops = Math.min(dto.maxHops ?? scope.maxHops, scope.maxHops);
    const relationshipTypes = this.effectiveRelationshipTypes(
      dto.relationshipFilter,
      scope,
    );

    const visited = new Map<
      string,
      {
        /**
         * Valor de node mantenido por la instancia.
         */
        node: GraphNodes; /**
         * Valor de depth mantenido por la instancia.
         */
        depth: number;
      }
    >([[start.nodeId, { node: start, depth: 0 }]]);
    const parent = new Map<
      string,
      {
        /**
         * Identificador asociado a node.
         */
        nodeId: string; /**
         * Identificador asociado a edge.
         */
        edgeId: string;
      }
    >();

    let frontier = [start.nodeId];
    let edgeCount = 0;
    let depthReached = 0;
    let truncated = false;

    for (let depth = 1; depth <= maxHops && frontier.length > 0; depth += 1) {
      const edges = await this.projectionRepo.findActiveEdgesFrom(
        tx,
        dto.tenantId,
        frontier,
        'active',
        relationshipTypes,
      );
      edgeCount += edges.length;

      const nextIds = edges
        .map((edge) => edge.toNodeId)
        .filter((nodeId) => !visited.has(nodeId));
      const uniqueNextIds = [...new Set(nextIds)];
      const nextNodes = await this.projectionRepo.findNodesByIds(
        tx,
        uniqueNextIds,
      );
      const nodeById = new Map(nextNodes.map((node) => [node.nodeId, node]));

      const nextFrontier: string[] = [];
      for (const edge of edges) {
        if (visited.has(edge.toNodeId)) continue;
        const node = nodeById.get(edge.toNodeId);
        // Poda por seguridad: un nodo fuera de alcance no se visita, así que
        // tampoco se recorre lo que hay detrás de él.
        if (!node || !this.isVisible(node, scope)) continue;

        if (visited.size >= MAX_TRAVERSAL_NODES) {
          truncated = true;
          break;
        }

        visited.set(node.nodeId, { node, depth });
        parent.set(node.nodeId, {
          nodeId: edge.fromNodeId,
          edgeId: edge.edgeId,
        });
        nextFrontier.push(node.nodeId);
        depthReached = depth;
      }

      if (truncated) break;
      if (stopAtNodeId && visited.has(stopAtNodeId)) break;
      frontier = nextFrontier;
    }

    return { visited, edgeCount, depthReached, truncated, parent };
  }

  /**
   * Ejecuta la operación require active scope.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param dto - Datos validados de la operación.
   * @returns Resultado de require active scope conforme al contrato `Promise<GraphAccessScopes>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  private async requireActiveScope(
    tx: EntityManager,
    dto: TraverseDto,
  ): Promise<GraphAccessScopes> {
    const scope = await this.analyticsRepo.findScopeByCodeForUpdate(
      tx,
      dto.tenantId,
      dto.scopeCode,
    );
    if (!scope) {
      throw new ResourceNotFoundException('Alcance de acceso no encontrado.', {
        scopeCode: dto.scopeCode,
      });
    }
    if (scope.state !== 'active') {
      throw new PreconditionFailedException(
        'El alcance de acceso no está activo.',
        {
          scopeCode: dto.scopeCode,
          state: scope.state,
        },
      );
    }
    if (!scope.purposeOfUseCodes.includes(dto.purposeOfUse)) {
      throw new PreconditionFailedException(
        'El alcance no admite ese propósito de uso.',
        { scopeCode: dto.scopeCode, purposeOfUse: dto.purposeOfUse },
      );
    }
    if (scope.requiresPatientContext && !dto.patientProfileId) {
      throw new PreconditionFailedException(
        'El alcance exige declarar el paciente del contexto.',
        { scopeCode: dto.scopeCode },
      );
    }
    return scope;
  }

  /**
   * Ejecuta la operación require start node.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param startNodeId - Identificador de start node.
   * @param tenantId - Identificador de tenant.
   * @param scope - Valor de scope requerido por la operación.
   * @returns Resultado de require start node conforme al contrato `Promise<GraphNodes>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  private async requireStartNode(
    tx: EntityManager,
    startNodeId: string,
    tenantId: string,
    scope: GraphAccessScopes,
  ): Promise<GraphNodes> {
    const node = await this.projectionRepo.findNodeById(tx, startNodeId);
    if (!node || node.tenantId !== tenantId) {
      throw new ResourceNotFoundException('Nodo de partida no encontrado.', {
        startNodeId,
      });
    }
    if (!this.isVisible(node, scope)) {
      throw new PreconditionFailedException(
        'El nodo de partida queda fuera del alcance de acceso.',
        { startNodeId, scopeCode: scope.scopeCode },
      );
    }
    return node;
  }

  /**
   * Obtiene is visible.
   *
   * @param node - Valor de node requerido por la operación.
   * @param scope - Valor de scope requerido por la operación.
   * @returns Resultado de is visible conforme al contrato `boolean`.
   */
  private isVisible(node: GraphNodes, scope: GraphAccessScopes): boolean {
    if (node.lifecycleState !== 'active') return false;
    return scope.allowedNodeTypes.includes(node.nodeType);
  }

  /**
   * El filtro pedido se **intersecta** con el del alcance, no lo sustituye: pedir
   * un tipo de relación que el alcance no permite no puede ampliarlo.
   */
  private effectiveRelationshipTypes(
    requested: string[] | undefined,
    scope: GraphAccessScopes,
  ): string[] {
    if (!requested || requested.length === 0)
      return scope.allowedRelationshipTypes;
    return requested.filter((type) =>
      scope.allowedRelationshipTypes.includes(type),
    );
  }

  /**
   * Hash del filtro efectivo, no del pedido: dos consultas con filtros distintos
   * que se reducen al mismo conjunto tras intersectar con el alcance son la misma
   * consulta, y deben compartir entrada de caché.
   */
  private hashFilter(
    requested: string[] | undefined,
    scope: GraphAccessScopes,
  ): string {
    const effective = this.effectiveRelationshipTypes(requested, scope);
    return createHash('sha256')
      .update([...effective].sort().join('|'))
      .digest('hex');
  }
}
