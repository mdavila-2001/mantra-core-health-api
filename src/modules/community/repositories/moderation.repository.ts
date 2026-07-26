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

export interface CreateReportData {
  reporterUserId: string;
  targetTypeConceptId: string;
  targetId: string;
  reasonConceptId: string;
  detailText?: string;
  statusConceptId: string;
}

export interface CreateQueueData {
  tenantId?: string;
  contentTypeConceptId: string;
  contentRefId: string;
  sourceConceptId: string;
  contentReportId?: string;
  priorityConceptId?: string;
  mlScore?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateDecisionData {
  moderationQueueId: string;
  decisionConceptId: string;
  policyConceptId: string;
  rationaleText?: string;
  actionTakenConceptId?: string;
  decidedByUserId: string;
  actorUserId?: string;
}

export interface CreateStrikeData {
  subjectProfileId: string;
  moderationDecisionId: string;
  severityConceptId: string;
  points: number;
  expiresAt?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateAppealData {
  moderationDecisionId: string;
  appellantProfileId: string;
  reasonText: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de reportes, cola de moderación, decisiones, strikes y apelaciones. */
@Injectable()
export class ModerationRepository {
  // --- Reports ---
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

  findReportsByTarget(
    em: EntityManager,
    targetId: string,
  ): Promise<ContentReports[]> {
    return em.find(ContentReports, { targetId });
  }

  // --- Queue ---
  findQueueById(em: EntityManager, id: string): Promise<ModerationQueue | null> {
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
  findDecisionById(em: EntityManager, id: string): Promise<ModerationDecisions | null> {
    return em.findOne(ModerationDecisions, { id });
  }

  createDecision(em: EntityManager, data: CreateDecisionData): ModerationDecisions {
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
