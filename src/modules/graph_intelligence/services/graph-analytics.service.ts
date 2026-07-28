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
  HIT_TRANSITIONS,
  LIVE_HIT_STATUSES,
  RISK_SCORE_TTL_SECONDS,
} from '../constants';
import {
  DetectCommunitiesDto,
  CommunitiesResponseDto,
  ComputeRiskScoresDto,
  RiskScoresResponseDto,
  EvaluateRuleDto,
  EvaluateRuleResponseDto,
  TriageRuleHitDto,
  RuleHitResponseDto,
  RequestGraphDeletionDto,
  GraphDeletionResponseDto,
} from '../dto';

const DEFAULT_ALERT_THRESHOLD = 0.8;

/**
 * Analítica del grafo y derecho al olvido (UC-61-06 … 09, 11).
 *
 * Este servicio **no calcula** comunidades ni riesgo: los recibe ya calculados
 * del worker de analítica. Lo que aporta es el versionado de los resultados, la
 * deduplicación de hallazgos y la purga completa cuando la fuente borra.
 */
@Injectable()
export class GraphAnalyticsService {
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
    this.logger.setContext(GraphAnalyticsService.name);
  }

  /**
   * UC-61-06: registrar las comunidades detectadas.
   *
   * El resultado de una versión de algoritmo **se reemplaza entero**. Una
   * detección parcial no es un resultado: mezclar dos ejecuciones daría
   * comunidades que nunca coexistieron, y nadie podría decir a cuál pertenece un
   * nodo.
   *
   * Las versiones anteriores conviven, que es lo que permite comparar cómo cambia
   * la red al cambiar el algoritmo.
   */
  async detectCommunities(
    dto: DetectCommunitiesDto,
    actor: AuthenticatedUser,
  ): Promise<CommunitiesResponseDto> {
    return this.em.transactional(async (tx) => {
      const previous = await this.analyticsRepo.findCommunitiesByAlgorithm(
        tx,
        dto.tenantId,
        dto.communityType,
        dto.algorithmVersion,
      );
      const replaced = await this.analyticsRepo.deleteCommunities(
        tx,
        previous.map((c) => c.id),
      );

      for (const community of dto.communities) {
        this.analyticsRepo.createCommunity(tx, {
          tenantId: dto.tenantId,
          communityType: dto.communityType,
          algorithmVersion: dto.algorithmVersion,
          memberNodeIds: community.memberNodeIds,
          score: community.score,
        });
      }

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'GraphCommunitiesDetected',
        aggregateType: 'graph_intelligence.graph_communities',
        aggregateId: dto.tenantId,
        payloadJson: {
          communityType: dto.communityType,
          algorithmVersion: dto.algorithmVersion,
          written: dto.communities.length,
          replaced,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'graph.analytics.communities',
          communityType: dto.communityType,
          algorithmVersion: dto.algorithmVersion,
          written: dto.communities.length,
          replaced,
        },
        'Comunidades del grafo registradas',
      );

      return {
        communityType: dto.communityType,
        algorithmVersion: dto.algorithmVersion,
        written: dto.communities.length,
        replaced,
      };
    });
  }

  /**
   * UC-61-07: registrar los puntajes de riesgo.
   *
   * Cada puntaje lleva `expires_at`. Un riesgo sin caducidad se queda pareciendo
   * actual para siempre, y un panel de fraude que muestra un número de hace tres
   * meses como si fuera de hoy es peor que no mostrar nada.
   *
   * Sólo se publica alerta por encima del umbral: publicar todos los puntajes
   * convertiría el canal de alertas en ruido y nadie miraría el que importa.
   */
  async computeRiskScores(
    dto: ComputeRiskScoresDto,
    actor: AuthenticatedUser,
  ): Promise<RiskScoresResponseDto> {
    return this.em.transactional(async (tx) => {
      const threshold = dto.alertThreshold ?? DEFAULT_ALERT_THRESHOLD;
      const expiresAt = new Date(Date.now() + RISK_SCORE_TTL_SECONDS * 1000);

      let created = 0;
      let updated = 0;
      let alerted = 0;

      for (const input of dto.scores) {
        const node = await this.projectionRepo.findNodeById(tx, input.nodeId);
        if (!node || node.tenantId !== dto.tenantId) {
          throw new ResourceNotFoundException(
            'Nodo no encontrado para ese tenant.',
            {
              nodeId: input.nodeId,
            },
          );
        }
        if (node.lifecycleState !== 'active') {
          throw new PreconditionFailedException(
            'No se puntúa un nodo que ya no está activo.',
            { nodeId: input.nodeId, lifecycleState: node.lifecycleState },
          );
        }

        const key = {
          tenantId: dto.tenantId,
          nodeId: input.nodeId,
          riskType: dto.riskType,
          modelVersion: dto.modelVersion,
        };
        const existing = await this.analyticsRepo.findRiskScoreForUpdate(
          tx,
          key,
        );

        if (existing) {
          existing.score = input.score;
          // Sin explicación nueva se conserva la anterior: la entidad no la declara
          // opcional, y vaciarla borraría el porqué de un puntaje que sigue vivo.
          if (input.explanationRedacted) {
            existing.explanationRedacted = input.explanationRedacted;
          }
          existing.calculatedAt = new Date();
          existing.expiresAt = expiresAt;
          updated += 1;
        } else {
          this.analyticsRepo.createRiskScore(tx, {
            ...key,
            score: input.score,
            explanationRedacted: input.explanationRedacted,
            expiresAt,
          });
          created += 1;
        }

        if (input.score >= threshold) {
          await this.outbox.publishDomainEvent(tx, {
            tenantId: dto.tenantId,
            eventType: 'GraphRiskScoreComputed',
            aggregateType: 'graph_intelligence.graph_risk_scores',
            aggregateId: input.nodeId,
            payloadJson: {
              nodeId: input.nodeId,
              riskType: dto.riskType,
              modelVersion: dto.modelVersion,
              score: input.score,
            },
            actorUserId: actor.id,
          });
          alerted += 1;
        }
      }

      this.logger.info(
        {
          operation: 'graph.analytics.risk',
          riskType: dto.riskType,
          modelVersion: dto.modelVersion,
          created,
          updated,
          alerted,
        },
        'Puntajes de riesgo del grafo registrados',
      );

      return {
        riskType: dto.riskType,
        modelVersion: dto.modelVersion,
        created,
        updated,
        alerted,
      };
    });
  }

  /**
   * UC-61-08: registrar los hallazgos de una regla.
   *
   * La deduplicación por `(regla, nodo principal)` mientras haya un hallazgo vivo
   * es lo que impide que una regla evaluada cada hora genere veinticuatro alertas
   * idénticas al día del mismo caso. Cuando el anterior se cierra, un patrón que
   * vuelve a darse **sí** abre uno nuevo: el histórico tiene que poder contar que
   * ocurrió otra vez.
   */
  async evaluateRule(
    ruleDefinitionId: string,
    dto: EvaluateRuleDto,
    actor: AuthenticatedUser,
  ): Promise<EvaluateRuleResponseDto> {
    return this.em.transactional(async (tx) => {
      const rule = await this.analyticsRepo.findRuleDefinitionById(
        tx,
        ruleDefinitionId,
      );
      if (!rule) {
        throw new ResourceNotFoundException(
          'Definición de regla no encontrada.',
          {
            ruleDefinitionId,
          },
        );
      }
      if (rule.state !== 'active') {
        throw new PreconditionFailedException(
          'La definición de regla no está activa.',
          {
            ruleDefinitionId,
            state: rule.state,
          },
        );
      }

      const scope = await this.analyticsRepo.findScopeByCodeForUpdate(
        tx,
        dto.tenantId,
        dto.scopeCode,
      );
      if (!scope || scope.state !== 'active') {
        throw new PreconditionFailedException(
          'La regla tiene que evaluarse bajo un alcance de acceso activo.',
          { scopeCode: dto.scopeCode },
        );
      }

      const hitIds: string[] = [];
      let duplicatesSkipped = 0;

      for (const match of dto.matches) {
        const live = await this.analyticsRepo.findLiveHit(
          tx,
          ruleDefinitionId,
          match.primaryNodeId,
          [...LIVE_HIT_STATUSES],
        );
        if (live) {
          duplicatesSkipped += 1;
          continue;
        }

        const hit = this.analyticsRepo.createHit(tx, {
          tenantId: dto.tenantId,
          graphRuleDefinitionId: ruleDefinitionId,
          primaryNodeId: match.primaryNodeId,
          relatedNodeIds: match.relatedNodeIds ?? [],
          evidenceEdgeIds: match.evidenceEdgeIds ?? [],
          status: 'open',
        });
        hitIds.push(hit.id);

        await this.outbox.publishDomainEvent(tx, {
          tenantId: dto.tenantId,
          eventType: 'GraphRuleHitDetected',
          aggregateType: 'graph_intelligence.graph_rule_hits',
          aggregateId: hit.id,
          payloadJson: {
            graphRuleDefinitionId: ruleDefinitionId,
            ruleType: rule.ruleType,
            severity: rule.severity,
            primaryNodeId: match.primaryNodeId,
            evidenceEdgeIds: match.evidenceEdgeIds ?? [],
          },
          actorUserId: actor.id,
        });
      }

      if (hitIds.length > 0) {
        this.logger.warn(
          {
            operation: 'graph.rule.hit',
            ruleDefinitionId,
            severity: rule.severity,
            hitsOpened: hitIds.length,
            duplicatesSkipped,
          },
          'Regla del grafo detectó hallazgos',
        );
      }

      return {
        graphRuleDefinitionId: ruleDefinitionId,
        severity: rule.severity,
        hitsOpened: hitIds.length,
        duplicatesSkipped,
        hitIds,
      };
    });
  }

  /**
   * UC-61-09: mover el hallazgo por su triage.
   *
   * Las transiciones son las de `HIT_TRANSITIONS`, y un hallazgo cerrado **no se
   * reabre**: si el patrón vuelve a darse, la regla genera uno nuevo, y así el
   * histórico conserva cuántas veces ocurrió en vez de un único registro
   * reabierto varias veces.
   */
  async triageRuleHit(
    hitId: string,
    dto: TriageRuleHitDto,
    actor: AuthenticatedUser,
  ): Promise<RuleHitResponseDto> {
    return this.em.transactional(async (tx) => {
      const hit = await this.analyticsRepo.findHitForUpdate(tx, hitId);
      if (!hit) {
        throw new ResourceNotFoundException('Hallazgo no encontrado.', {
          hitId,
        });
      }

      if (hit.status === dto.status) {
        return {
          id: hit.id,
          status: hit.status,
          resolvedAt: hit.resolvedAt?.toISOString(),
          unchanged: true,
        };
      }

      const allowed = HIT_TRANSITIONS[hit.status] ?? [];
      if (!allowed.includes(dto.status)) {
        throw new ConflictException(
          'Esa transición del hallazgo no está permitida.',
          {
            hitId,
            from: hit.status,
            to: dto.status,
          },
        );
      }

      hit.status = dto.status;
      if (dto.status === 'resolved' || dto.status === 'dismissed') {
        hit.resolvedAt = new Date();
      }

      await this.outbox.publishDomainEvent(tx, {
        tenantId: hit.tenantId,
        eventType: 'GraphRuleHitResolved',
        aggregateType: 'graph_intelligence.graph_rule_hits',
        aggregateId: hit.id,
        payloadJson: {
          status: hit.status,
          primaryNodeId: hit.primaryNodeId,
          resolutionNote: dto.resolutionNote ?? null,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        { operation: 'graph.rule.triage', hitId, status: hit.status },
        'Hallazgo del grafo movido en el triage',
      );

      return {
        id: hit.id,
        status: hit.status,
        resolvedAt: hit.resolvedAt?.toISOString(),
        unchanged: false,
      };
    });
  }

  /**
   * UC-61-11: propagar el borrado al grafo (derecho al olvido).
   *
   * El borrado en el grafo es **consecuencia** del borrado canónico, no una
   * decisión propia. Y es completo: nodo, identificadores hasheados, aristas
   * incidentes con su evidencia, puntajes de riesgo, rutas cacheadas y la
   * pertenencia a comunidades.
   *
   * Ese último punto es el que se olvida con más facilidad: un nodo borrado que
   * sigue en `member_node_ids[]` de una comunidad deja su identificador vivo en un
   * array, y el derecho al olvido no se cumple a medias.
   */
  async requestDeletion(
    dto: RequestGraphDeletionDto,
    actor: AuthenticatedUser,
  ): Promise<GraphDeletionResponseDto> {
    return this.em.transactional(async (tx) => {
      const active = await this.analyticsRepo.findActiveDeletionJob(
        tx,
        dto.tenantId,
        dto.sourceEntityType,
        dto.sourceEntityId,
        [...ACTIVE_DELETION_STATUSES],
      );
      if (active) {
        return {
          id: active.id,
          status: active.status,
          nodesDeleted: active.nodesDeleted ?? 0,
          edgesDeleted: active.edgesDeleted ?? 0,
          identifiersDeleted: 0,
          riskScoresDeleted: 0,
          communitiesUpdated: 0,
          invalidatedPaths: 0,
          duplicate: true,
        };
      }

      const job = this.analyticsRepo.createDeletionJob(tx, {
        tenantId: dto.tenantId,
        sourceEntityType: dto.sourceEntityType,
        sourceEntityId: dto.sourceEntityId,
        status: 'running',
      });

      const node = await this.projectionRepo.findNodeBySourceForUpdate(
        tx,
        dto.tenantId,
        dto.sourceEntityType,
        dto.sourceEntityId,
      );

      let nodesDeleted = 0;
      let edgesDeleted = 0;
      let identifiersDeleted = 0;
      let riskScoresDeleted = 0;
      let communitiesUpdated = 0;
      let invalidatedPaths = 0;

      if (node) {
        const nodeIds = [node.nodeId];

        invalidatedPaths =
          await this.analyticsRepo.deleteCachedPathsTouchingNodes(
            tx,
            dto.tenantId,
            nodeIds,
          );

        const edges = await this.projectionRepo.findEdgesTouchingNodes(
          tx,
          nodeIds,
        );
        const edgeIds = edges.map((edge) => edge.edgeId);
        // La evidencia antes que la arista: al revés quedaría evidencia apuntando
        // a una arista que ya no existe.
        await this.projectionRepo.deleteEvidenceByEdges(tx, edgeIds);
        edgesDeleted = await this.projectionRepo.deleteEdges(tx, edgeIds);

        riskScoresDeleted = await this.analyticsRepo.deleteRiskScoresByNodes(
          tx,
          nodeIds,
        );
        identifiersDeleted = await this.projectionRepo.deleteIdentifiersByNodes(
          tx,
          nodeIds,
        );

        const communities = await this.analyticsRepo.findCommunitiesByTenant(
          tx,
          dto.tenantId,
        );
        for (const community of communities) {
          const members = community.memberNodeIds ?? [];
          if (!members.includes(node.nodeId)) continue;
          community.memberNodeIds = members.filter(
            (memberId) => memberId !== node.nodeId,
          );
          communitiesUpdated += 1;
        }

        nodesDeleted = await this.projectionRepo.deleteNodes(tx, nodeIds);
      }

      job.status = 'verified';
      job.nodesDeleted = nodesDeleted;
      job.edgesDeleted = edgesDeleted;
      job.verifiedAt = new Date();

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'GraphEntityPurged',
        aggregateType: 'graph_intelligence.graph_deletion_jobs',
        aggregateId: job.id,
        payloadJson: {
          sourceEntityType: dto.sourceEntityType,
          sourceEntityId: dto.sourceEntityId,
          nodesDeleted,
          edgesDeleted,
          identifiersDeleted,
          riskScoresDeleted,
          communitiesUpdated,
        },
        actorUserId: actor.id,
      });

      this.logger.warn(
        {
          operation: 'graph.deletion.execute',
          deletionJobId: job.id,
          nodesDeleted,
          edgesDeleted,
          identifiersDeleted,
          communitiesUpdated,
        },
        'Entidad purgada del grafo',
      );

      return {
        id: job.id,
        status: job.status,
        nodesDeleted,
        edgesDeleted,
        identifiersDeleted,
        riskScoresDeleted,
        communitiesUpdated,
        invalidatedPaths,
        duplicate: false,
      };
    });
  }
}
