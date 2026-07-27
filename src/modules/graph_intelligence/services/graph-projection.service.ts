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
import {
  GraphAnalyticsRepository,
  GraphProjectionRepository,
} from '../repositories';
import {
  ACTIVE_DELETION_STATUSES,
  BASE_CONFIDENCE,
  MAX_CONFIDENCE,
  MIN_CONFIDENCE,
} from '../constants';
import {
  UpsertNodeDto,
  NodeResponseDto,
  UpsertEdgeDto,
  EdgeResponseDto,
  StartProjectionRunDto,
  AdvanceProjectionRunDto,
  ProjectionRunResponseDto,
  ExpireEdgeDto,
  ExpireEdgeResponseDto,
  ReconcileSourceVersionDto,
  ReconcileResponseDto,
} from '../dto';

/**
 * Proyección del grafo (UC-61-01, 02, 03, 10, 12).
 *
 * **El grafo no es la fuente de verdad.** Todo lo de aquí se deriva de eventos de
 * Postgres, y de esa idea salen las dos reglas que estructuran el servicio: los
 * upsert son idempotentes por clave natural, y un evento que llega tarde nunca
 * pisa a uno posterior.
 */
@Injectable()
export class GraphProjectionService {
  constructor(
    private readonly em: EntityManager,
    private readonly projectionRepo: GraphProjectionRepository,
    private readonly analyticsRepo: GraphAnalyticsRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GraphProjectionService.name);
  }

  /**
   * UC-61-01: proyectar el nodo y sus identificadores.
   *
   * La **guarda de versión** es lo importante: los eventos llegan sin orden
   * garantizado, y aplicar uno viejo sobre uno nuevo devolvería el nodo a un
   * estado que ya no es el canónico. Cuando eso pasa se devuelve `stale: true` y
   * no se toca nada.
   *
   * Los identificadores entran **sólo hasheados**. El grafo indexa relaciones, no
   * documentos de identidad; guardar el valor en claro convertiría una proyección
   * analítica en una copia del padrón.
   */
  async upsertNode(
    dto: UpsertNodeDto,
    actor: AuthenticatedUser,
  ): Promise<NodeResponseDto> {
    return this.em.transactional(async (tx) => {
      const existing = await this.projectionRepo.findNodeBySourceForUpdate(
        tx,
        dto.tenantId,
        dto.sourceEntityType,
        dto.sourceEntityId,
      );

      if (
        existing &&
        BigInt(existing.sourceVersion) > BigInt(dto.sourceVersion)
      ) {
        return {
          id: existing.nodeId,
          nodeType: existing.nodeType,
          sourceVersion: existing.sourceVersion,
          lifecycleState: existing.lifecycleState,
          identifiersAdded: 0,
          stale: true,
        };
      }

      const node =
        existing ??
        this.projectionRepo.createNode(tx, {
          tenantId: dto.tenantId,
          nodeType: dto.nodeType,
          sourceEntityType: dto.sourceEntityType,
          sourceEntityId: dto.sourceEntityId,
          sourceVersion: dto.sourceVersion,
          displayLabelRedacted: dto.displayLabelRedacted,
          properties: dto.properties,
          securityLabels: dto.securityLabels ?? [],
          lifecycleState: 'active',
        });

      if (existing) {
        existing.nodeType = dto.nodeType;
        existing.sourceVersion = dto.sourceVersion;
        existing.displayLabelRedacted = dto.displayLabelRedacted;
        existing.properties = dto.properties;
        existing.securityLabels = dto.securityLabels ?? [];
        existing.lifecycleState = 'active';
        existing.updatedAt = new Date();
      }

      let identifiersAdded = 0;
      for (const identifier of dto.identifiers ?? []) {
        const duplicate = await this.projectionRepo.findIdentifier(
          tx,
          node.nodeId,
          identifier.identifierSystem,
          identifier.identifierValueHash,
        );
        if (duplicate) continue;

        this.projectionRepo.createIdentifier(tx, {
          nodeId: node.nodeId,
          identifierSystem: identifier.identifierSystem,
          identifierValueHash: identifier.identifierValueHash,
          identifierType: identifier.identifierType,
          isPrimary: identifier.isPrimary === true,
        });
        identifiersAdded += 1;
      }

      this.logger.info(
        {
          operation: 'graph.projection.node',
          nodeId: node.nodeId,
          sourceVersion: dto.sourceVersion,
          identifiersAdded,
        },
        'Nodo proyectado',
      );

      return {
        id: node.nodeId,
        nodeType: node.nodeType,
        sourceVersion: node.sourceVersion,
        lifecycleState: node.lifecycleState,
        identifiersAdded,
        stale: false,
      };
    });
  }

  /**
   * UC-61-02: proyectar la arista con su evidencia.
   *
   * La confianza no se recibe: **se calcula** como `base + Σ deltas`, acotada a
   * `[0,1]`. Dejar que el llamante la declarara permitiría afirmar una relación
   * con confianza 1 sin nada que la respalde, y las reglas de fraude la comparan
   * contra un umbral.
   *
   * La evidencia repetida se descarta por su hash: reprocesar el mismo evento no
   * puede subir la confianza dos veces.
   */
  async upsertEdge(
    dto: UpsertEdgeDto,
    actor: AuthenticatedUser,
  ): Promise<EdgeResponseDto> {
    return this.em.transactional(async (tx) => {
      const fromNode = await this.projectionRepo.findNodeById(
        tx,
        dto.fromNodeId,
      );
      const toNode = await this.projectionRepo.findNodeById(tx, dto.toNodeId);
      if (!fromNode || !toNode) {
        throw new PreconditionFailedException(
          'Los dos extremos de la arista tienen que estar proyectados antes que ella.',
          { fromNodeId: dto.fromNodeId, toNodeId: dto.toNodeId },
        );
      }
      if (
        fromNode.tenantId !== dto.tenantId ||
        toNode.tenantId !== dto.tenantId
      ) {
        throw new PreconditionFailedException(
          'Una arista no puede cruzar dos tenants.',
          { tenantId: dto.tenantId },
        );
      }

      const existing = await this.projectionRepo.findEdgeBySourceForUpdate(
        tx,
        dto.tenantId,
        dto.sourceEntityType,
        dto.sourceEntityId,
        dto.relationshipType,
      );

      const edge =
        existing ??
        this.projectionRepo.createEdge(tx, {
          tenantId: dto.tenantId,
          fromNodeId: dto.fromNodeId,
          toNodeId: dto.toNodeId,
          relationshipType: dto.relationshipType,
          directionality: dto.directionality ?? 'directed',
          effectiveFrom: dto.effectiveFrom
            ? new Date(dto.effectiveFrom)
            : new Date(),
          confidenceScore: BASE_CONFIDENCE,
          sourceEntityType: dto.sourceEntityType,
          sourceEntityId: dto.sourceEntityId,
          properties: dto.properties,
          lifecycleState: 'active',
        });

      if (existing) {
        existing.fromNodeId = dto.fromNodeId;
        existing.toNodeId = dto.toNodeId;
        existing.directionality = dto.directionality ?? existing.directionality;
        existing.properties = dto.properties;
        // Reproyectar una arista cerrada la reabre: el evento fuente dice que la
        // relación vuelve a existir.
        existing.lifecycleState = 'active';
        existing.effectiveTo = undefined;
      }

      let evidenceAdded = 0;
      for (const evidence of dto.evidence ?? []) {
        const duplicate = await this.projectionRepo.findEvidenceByHash(
          tx,
          edge.edgeId,
          evidence.evidenceHash,
        );
        if (duplicate) continue;

        this.projectionRepo.createEvidence(tx, {
          edgeId: edge.edgeId,
          evidenceType: evidence.evidenceType,
          sourceReference: evidence.sourceReference,
          evidenceHash: evidence.evidenceHash,
          observedAt: evidence.observedAt
            ? new Date(evidence.observedAt)
            : new Date(),
          confidenceDelta: evidence.confidenceDelta,
        });
        evidenceAdded += 1;
      }

      edge.confidenceScore = await this.recalculateConfidence(tx, edge.edgeId);

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'GraphEdgeProjected',
        aggregateType: 'graph_intelligence.graph_edges',
        aggregateId: edge.edgeId,
        payloadJson: {
          relationshipType: edge.relationshipType,
          fromNodeId: dto.fromNodeId,
          toNodeId: dto.toNodeId,
          confidenceScore: edge.confidenceScore,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'graph.projection.edge',
          edgeId: edge.edgeId,
          confidenceScore: edge.confidenceScore,
          evidenceAdded,
        },
        'Arista proyectada',
      );

      return {
        id: edge.edgeId,
        relationshipType: edge.relationshipType,
        confidenceScore: edge.confidenceScore,
        lifecycleState: edge.lifecycleState,
        evidenceAdded,
      };
    });
  }

  /**
   * UC-61-03 (arranque): abrir una corrida de proyección.
   *
   * Una sola corrida viva por definición. Dos a la vez sobre el mismo mapeo
   * escribirían los mismos nodos en desorden, y el checkpoint dejaría de decir
   * hasta dónde se ha proyectado de verdad.
   */
  async startProjectionRun(
    definitionId: string,
    dto: StartProjectionRunDto,
    actor: AuthenticatedUser,
  ): Promise<ProjectionRunResponseDto> {
    return this.em.transactional(async (tx) => {
      const definition = await this.projectionRepo.findDefinitionById(
        tx,
        definitionId,
      );
      if (!definition) {
        throw new ResourceNotFoundException(
          'Definición de proyección no encontrada.',
          {
            definitionId,
          },
        );
      }
      if (definition.state !== 'active') {
        throw new PreconditionFailedException(
          'La definición de proyección no está activa.',
          {
            definitionId,
            state: definition.state,
          },
        );
      }

      const running = await this.projectionRepo.findRunningRunForUpdate(
        tx,
        definitionId,
        'running',
      );
      if (running) {
        return {
          id: running.id,
          status: running.status,
          sourceCheckpoint: running.sourceCheckpoint,
          nodesWritten: running.nodesWritten,
          edgesWritten: running.edgesWritten,
          alreadyRunning: true,
        };
      }

      const run = this.projectionRepo.createRun(tx, {
        tenantId: definition.tenantId,
        graphProjectionDefinitionId: definitionId,
        status: 'running',
        sourceCheckpoint: dto.sourceCheckpoint,
        startedAt: new Date(),
      });

      this.logger.info(
        {
          operation: 'graph.projection.run-start',
          runId: run.id,
          definitionId,
        },
        'Corrida de proyección arrancada',
      );

      return {
        id: run.id,
        status: run.status,
        sourceCheckpoint: run.sourceCheckpoint,
        nodesWritten: run.nodesWritten,
        edgesWritten: run.edgesWritten,
        alreadyRunning: false,
      };
    });
  }

  /**
   * UC-61-03 (avance): mover el checkpoint de la corrida.
   *
   * El checkpoint es **monótono**: retrocederlo haría que la siguiente corrida
   * reprocesara eventos ya aplicados, y aunque los upsert son idempotentes, el
   * checkpoint dejaría de significar "hasta aquí está proyectado".
   */
  async advanceProjectionRun(
    runId: string,
    dto: AdvanceProjectionRunDto,
    actor: AuthenticatedUser,
  ): Promise<ProjectionRunResponseDto> {
    return this.em.transactional(async (tx) => {
      const run = await this.projectionRepo.findRunForUpdate(tx, runId);
      if (!run) {
        throw new ResourceNotFoundException(
          'Corrida de proyección no encontrada.',
          { runId },
        );
      }
      if (run.status !== 'running') {
        throw new PreconditionFailedException(
          'La corrida ya no está en marcha.',
          {
            runId,
            status: run.status,
          },
        );
      }
      if (
        run.sourceCheckpoint &&
        BigInt(dto.sourceCheckpoint) < BigInt(run.sourceCheckpoint)
      ) {
        throw new ConflictException('El checkpoint no puede retroceder.', {
          runId,
          current: run.sourceCheckpoint,
          incoming: dto.sourceCheckpoint,
        });
      }

      run.sourceCheckpoint = dto.sourceCheckpoint;
      run.nodesWritten = (
        BigInt(run.nodesWritten ?? '0') + BigInt(dto.nodesWritten ?? 0)
      ).toString();
      run.edgesWritten = (
        BigInt(run.edgesWritten ?? '0') + BigInt(dto.edgesWritten ?? 0)
      ).toString();

      if (dto.finalBatch === true || dto.failed === true) {
        run.status = dto.failed === true ? 'failed' : 'completed';
        run.completedAt = new Date();

        await this.outbox.publishDomainEvent(tx, {
          tenantId: run.tenantId,
          eventType: 'GraphProjectionRunFinished',
          aggregateType: 'graph_intelligence.graph_projection_runs',
          aggregateId: run.id,
          payloadJson: {
            status: run.status,
            sourceCheckpoint: run.sourceCheckpoint,
            nodesWritten: run.nodesWritten,
            edgesWritten: run.edgesWritten,
          },
          actorUserId: actor.id,
        });
      }

      this.logger.info(
        {
          operation: 'graph.projection.run-advance',
          runId,
          sourceCheckpoint: run.sourceCheckpoint,
          status: run.status,
        },
        'Corrida de proyección avanzada',
      );

      return {
        id: run.id,
        status: run.status,
        sourceCheckpoint: run.sourceCheckpoint,
        nodesWritten: run.nodesWritten,
        edgesWritten: run.edgesWritten,
        alreadyRunning: false,
      };
    });
  }

  /**
   * UC-61-10: expirar la arista y decaer su confianza.
   *
   * Expirar **no borra**: la relación existió, y el histórico tiene que poder
   * decirlo. Lo que cambia es que deja de recorrerse, porque el traversal filtra
   * por `lifecycle_state = 'active'`.
   *
   * Y se invalidan las rutas cacheadas que pasaban por ella: una ruta que usa una
   * arista cerrada es una ruta que ya no existe, y servirla de caché sería
   * responder con una red que no es la actual.
   */
  async expireEdge(
    edgeId: string,
    dto: ExpireEdgeDto,
    actor: AuthenticatedUser,
  ): Promise<ExpireEdgeResponseDto> {
    return this.em.transactional(async (tx) => {
      const edge = await this.projectionRepo.findEdgeForUpdate(tx, edgeId);
      if (!edge) {
        throw new ResourceNotFoundException('Arista no encontrada.', {
          edgeId,
        });
      }

      if (edge.lifecycleState !== 'active') {
        return {
          id: edge.edgeId,
          lifecycleState: edge.lifecycleState,
          confidenceScore: edge.confidenceScore,
          invalidatedPaths: 0,
          alreadyClosed: true,
        };
      }

      const duplicate = await this.projectionRepo.findEvidenceByHash(
        tx,
        edgeId,
        dto.evidenceHash,
      );
      if (!duplicate) {
        this.projectionRepo.createEvidence(tx, {
          edgeId,
          evidenceType: 'termination',
          sourceReference: dto.sourceReference,
          evidenceHash: dto.evidenceHash,
          observedAt: new Date(),
          confidenceDelta: dto.confidenceDelta ?? -0.5,
        });
      }

      edge.effectiveTo = new Date();
      edge.lifecycleState = dto.retired === true ? 'retired' : 'expired';
      edge.confidenceScore = await this.recalculateConfidence(tx, edgeId);

      const invalidatedPaths =
        await this.analyticsRepo.deleteCachedPathsTouchingEdges(
          tx,
          edge.tenantId,
          [edgeId],
        );

      await this.outbox.publishDomainEvent(tx, {
        tenantId: edge.tenantId,
        eventType: 'GraphEdgeExpired',
        aggregateType: 'graph_intelligence.graph_edges',
        aggregateId: edgeId,
        payloadJson: {
          lifecycleState: edge.lifecycleState,
          confidenceScore: edge.confidenceScore,
          invalidatedPaths,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'graph.edge.expire',
          edgeId,
          lifecycleState: edge.lifecycleState,
          invalidatedPaths,
        },
        'Arista expirada',
      );

      return {
        id: edge.edgeId,
        lifecycleState: edge.lifecycleState,
        confidenceScore: edge.confidenceScore,
        invalidatedPaths,
        alreadyClosed: false,
      };
    });
  }

  /**
   * UC-61-12: reconciliar la versión canónica.
   *
   * Tres efectos, y los tres tienen que ir juntos: se actualiza el nodo, se
   * invalidan las rutas que lo tocaban y se **caducan** sus puntajes de riesgo.
   * Lo último es lo menos evidente y lo más importante: un riesgo calculado sobre
   * una versión anterior del nodo sigue siendo un número creíble, y por eso hay
   * que forzar su recálculo en vez de dejarlo estar.
   *
   * Si el evento es un borrado, se abre el job de purga en vez de actualizar: el
   * grafo no decide borrar, lo hace porque la fuente ya borró.
   */
  async reconcileSourceVersion(
    dto: ReconcileSourceVersionDto,
    actor: AuthenticatedUser,
  ): Promise<ReconcileResponseDto> {
    return this.em.transactional(async (tx) => {
      const node = await this.projectionRepo.findNodeBySourceForUpdate(
        tx,
        dto.tenantId,
        dto.sourceEntityType,
        dto.sourceEntityId,
      );
      if (!node) {
        throw new ResourceNotFoundException('El nodo no está proyectado.', {
          sourceEntityType: dto.sourceEntityType,
          sourceEntityId: dto.sourceEntityId,
        });
      }

      if (BigInt(node.sourceVersion) > BigInt(dto.sourceVersion)) {
        return {
          nodeId: node.nodeId,
          stale: true,
          invalidatedPaths: 0,
          expiredRiskScores: 0,
        };
      }

      if (dto.deleted === true) {
        const active = await this.analyticsRepo.findActiveDeletionJob(
          tx,
          dto.tenantId,
          dto.sourceEntityType,
          dto.sourceEntityId,
          [...ACTIVE_DELETION_STATUSES],
        );
        const job =
          active ??
          this.analyticsRepo.createDeletionJob(tx, {
            tenantId: dto.tenantId,
            sourceEntityType: dto.sourceEntityType,
            sourceEntityId: dto.sourceEntityId,
            status: 'requested',
          });

        this.logger.warn(
          {
            operation: 'graph.reconcile.deleted',
            nodeId: node.nodeId,
            deletionJobId: job.id,
          },
          'La fuente borró la entidad; job de purga del grafo abierto',
        );

        return {
          nodeId: node.nodeId,
          stale: false,
          invalidatedPaths: 0,
          expiredRiskScores: 0,
          deletionJobId: job.id,
        };
      }

      node.sourceVersion = dto.sourceVersion;
      if (dto.displayLabelRedacted)
        node.displayLabelRedacted = dto.displayLabelRedacted;
      if (dto.properties) node.properties = dto.properties;
      if (dto.securityLabels) node.securityLabels = dto.securityLabels;
      node.updatedAt = new Date();

      const invalidatedPaths =
        await this.analyticsRepo.deleteCachedPathsTouchingNodes(
          tx,
          dto.tenantId,
          [node.nodeId],
        );

      const riskScores =
        await this.analyticsRepo.findRiskScoresByNodesForUpdate(tx, [
          node.nodeId,
        ]);
      const now = new Date();
      for (const score of riskScores) {
        score.expiresAt = now;
      }

      this.logger.info(
        {
          operation: 'graph.reconcile.version',
          nodeId: node.nodeId,
          sourceVersion: dto.sourceVersion,
          invalidatedPaths,
          expiredRiskScores: riskScores.length,
        },
        'Versión canónica reconciliada en el grafo',
      );

      return {
        nodeId: node.nodeId,
        stale: false,
        invalidatedPaths,
        expiredRiskScores: riskScores.length,
      };
    });
  }

  /**
   * Confianza = base + suma de los deltas de evidencia, acotada a `[0,1]`.
   *
   * Se recalcula desde la evidencia entera y no incrementalmente: sumar sobre el
   * valor guardado haría que un recorte en el tope se perdiera para siempre —una
   * vez que la suma pasa de 1, los deltas negativos posteriores partirían de 1 en
   * vez de del valor real acumulado—.
   */
  private async recalculateConfidence(
    tx: EntityManager,
    edgeId: string,
  ): Promise<number> {
    const evidence = await this.projectionRepo.findEvidenceByEdge(tx, edgeId);
    const total = evidence.reduce(
      (sum, item) => sum + (item.confidenceDelta ?? 0),
      BASE_CONFIDENCE,
    );
    return Math.min(MAX_CONFIDENCE, Math.max(MIN_CONFIDENCE, total));
  }
}
