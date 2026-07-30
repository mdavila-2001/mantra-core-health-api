import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ContentReports,
  ModerationQueue,
  ModerationDecisions,
  ModerationStrikes,
  ModerationAppeals,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create report data.
 */
export interface CreateReportData {
  /**
   * Identificador asociado a reporter user.
   */
  reporterUserId: string;
  /**
   * Identificador asociado a target type concept.
   */
  targetTypeConceptId: string;
  /**
   * Identificador asociado a target.
   */
  targetId: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId: string;
  /**
   * Valor de detail text mantenido por la instancia.
   */
  detailText?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
}

/**
 * Describe el contrato estructural de create queue data.
 */
export interface CreateQueueData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a content type concept.
   */
  contentTypeConceptId: string;
  /**
   * Identificador asociado a content ref.
   */
  contentRefId: string;
  /**
   * Identificador asociado a source concept.
   */
  sourceConceptId: string;
  /**
   * Identificador asociado a content report.
   */
  contentReportId?: string;
  /**
   * Identificador asociado a priority concept.
   */
  priorityConceptId?: string;
  /**
   * Valor de ml score mantenido por la instancia.
   */
  mlScore?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create decision data.
 */
export interface CreateDecisionData {
  /**
   * Identificador asociado a moderation queue.
   */
  moderationQueueId: string;
  /**
   * Identificador asociado a decision concept.
   */
  decisionConceptId: string;
  /**
   * Identificador asociado a policy concept.
   */
  policyConceptId: string;
  /**
   * Valor de rationale text mantenido por la instancia.
   */
  rationaleText?: string;
  /**
   * Identificador asociado a action taken concept.
   */
  actionTakenConceptId?: string;
  /**
   * Identificador asociado a decided by user.
   */
  decidedByUserId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create strike data.
 */
export interface CreateStrikeData {
  /**
   * Identificador asociado a subject profile.
   */
  subjectProfileId: string;
  /**
   * Identificador asociado a moderation decision.
   */
  moderationDecisionId: string;
  /**
   * Identificador asociado a severity concept.
   */
  severityConceptId: string;
  /**
   * Valor de points mantenido por la instancia.
   */
  points: number;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create appeal data.
 */
export interface CreateAppealData {
  /**
   * Identificador asociado a moderation decision.
   */
  moderationDecisionId: string;
  /**
   * Identificador asociado a appellant profile.
   */
  appellantProfileId: string;
  /**
   * Valor de reason text mantenido por la instancia.
   */
  reasonText: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de reportes, cola de moderación, decisiones, strikes y apelaciones. */
@Injectable()
export class ModerationRepository {
  // --- Reports ---
  /**
   * Crea create report.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create report conforme al contrato `ContentReports`.
   */
  createReport(em: EntityManager, data: CreateReportData): ContentReports {
    return em.create(
      ContentReports,
      {
        reporterUserId: data.reporterUserId,
        targetTypeConceptId: data.targetTypeConceptId,
        targetId: data.targetId,
        reasonConceptId: data.reasonConceptId,
        detailText: data.detailText,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find reports by target.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param targetId - Identificador de target.
   * @returns Resultado de find reports by target conforme al contrato `Promise<ContentReports[]>`.
   */
  findReportsByTarget(
    em: EntityManager,
    targetId: string,
  ): Promise<ContentReports[]> {
    return em.find(ContentReports, { targetId });
  }

  // --- Queue ---
  /**
   * Obtiene find queue by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find queue by id conforme al contrato `Promise<ModerationQueue | null>`.
   */
  findQueueById(
    em: EntityManager,
    id: string,
  ): Promise<ModerationQueue | null> {
    return em.findOne(ModerationQueue, { id });
  }

  /** Entrada de cola abierta para un contenido (dedup por content_ref). */
  findOpenQueueForContent(
    em: EntityManager,
    contentRefId: string,
    excludeResolvedStatusConceptId: string,
  ): Promise<ModerationQueue | null> {
    return em.findOne(ModerationQueue, {
      contentRefId,
      statusConceptId: { $ne: excludeResolvedStatusConceptId },
    });
  }

  /**
   * Crea create queue.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create queue conforme al contrato `ModerationQueue`.
   */
  createQueue(em: EntityManager, data: CreateQueueData): ModerationQueue {
    return em.create(
      ModerationQueue,
      {
        tenantId: data.tenantId,
        contentTypeConceptId: data.contentTypeConceptId,
        contentRefId: data.contentRefId,
        sourceConceptId: data.sourceConceptId,
        contentReportId: data.contentReportId,
        priorityConceptId: data.priorityConceptId,
        mlScore: data.mlScore,
        statusConceptId: data.statusConceptId,
        queuedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  // --- Decisions ---
  /**
   * Obtiene find decision by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find decision by id conforme al contrato `Promise<ModerationDecisions | null>`.
   */
  findDecisionById(
    em: EntityManager,
    id: string,
  ): Promise<ModerationDecisions | null> {
    return em.findOne(ModerationDecisions, { id });
  }

  /**
   * Crea create decision.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create decision conforme al contrato `ModerationDecisions`.
   */
  createDecision(
    em: EntityManager,
    data: CreateDecisionData,
  ): ModerationDecisions {
    return em.create(
      ModerationDecisions,
      {
        moderationQueueId: data.moderationQueueId,
        decisionConceptId: data.decisionConceptId,
        policyConceptId: data.policyConceptId,
        rationaleText: data.rationaleText,
        actionTakenConceptId: data.actionTakenConceptId,
        decidedByUserId: data.decidedByUserId,
        decidedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  // --- Strikes ---
  /**
   * Crea create strike.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create strike conforme al contrato `ModerationStrikes`.
   */
  createStrike(em: EntityManager, data: CreateStrikeData): ModerationStrikes {
    return em.create(
      ModerationStrikes,
      {
        subjectProfileId: data.subjectProfileId,
        moderationDecisionId: data.moderationDecisionId,
        severityConceptId: data.severityConceptId,
        points: data.points,
        expiresAt: data.expiresAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  // --- Appeals ---
  /**
   * Crea create appeal.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create appeal conforme al contrato `ModerationAppeals`.
   */
  createAppeal(em: EntityManager, data: CreateAppealData): ModerationAppeals {
    return em.create(
      ModerationAppeals,
      {
        moderationDecisionId: data.moderationDecisionId,
        appellantProfileId: data.appellantProfileId,
        reasonText: data.reasonText,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find open appeal for decision.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param moderationDecisionId - Identificador de moderation decision.
   * @param openStatusConceptId - Identificador de open status concept.
   * @returns Resultado de find open appeal for decision conforme al contrato `Promise<ModerationAppeals | null>`.
   */
  findOpenAppealForDecision(
    em: EntityManager,
    moderationDecisionId: string,
    openStatusConceptId: string,
  ): Promise<ModerationAppeals | null> {
    return em.findOne(ModerationAppeals, {
      moderationDecisionId,
      statusConceptId: openStatusConceptId,
    });
  }
}
