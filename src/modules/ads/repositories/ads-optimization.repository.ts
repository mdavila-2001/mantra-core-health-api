import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  AdExperiments,
  ExperimentVariants,
  AutomatedRules,
  RuleExecutions,
  AdReviewEvents,
  AdPolicyViolations,
  AdPolicyAppeals,
  AdInvoices,
  AdInvoiceLines,
  LeadForms,
  LeadFormQuestions,
  LeadSubmissions,
  LeadAnswers,
  LeadDeliveryEvents,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateExperimentData {
  adAccountId: string;
  name: string;
  experimentTypeConceptId: string;
  objectiveMetricConceptId: string;
  hypothesis?: string;
  holdoutPercent?: string;
  startAt?: Date;
  endAt?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateInvoiceData {
  adAccountId: string;
  invoiceNumber: string;
  periodStart: Date;
  periodEnd: Date;
  subtotal: string;
  taxTotal: string;
  total: string;
  currencyConceptId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateLeadSubmissionData {
  tenantId: string;
  leadFormId: string;
  adId?: string;
  adSetId?: string;
  campaignId?: string;
  externalLeadId: string;
  consentDirectiveId?: string;
  processingStatusConceptId: string;
  rawPayloadHash?: string;
  sourceIpHash?: string;
}

/**
 * Acceso a experimentos, reglas automatizadas, moderación, facturación de
 * anuncios y formularios de leads de `ads.*`.
 */
@Injectable()
export class AdsOptimizationRepository {
  // --- Experimentos (UC-43-10) ---

  createExperiment(
    em: EntityManager,
    data: CreateExperimentData,
  ): AdExperiments {
    return em.create(
      AdExperiments,
      {
        adAccountId: data.adAccountId,
        name: data.name,
        experimentTypeConceptId: data.experimentTypeConceptId,
        objectiveMetricConceptId: data.objectiveMetricConceptId,
        hypothesis: data.hypothesis,
        holdoutPercent: data.holdoutPercent,
        startAt: data.startAt,
        endAt: data.endAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findExperimentForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<AdExperiments | null> {
    return em.findOne(
      AdExperiments,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  createVariant(
    em: EntityManager,
    data: {
      adExperimentId: string;
      name: string;
      variantRefType: string;
      variantRefId: string;
      trafficSplitPercent: string;
      isControl: boolean;
      actorUserId?: string;
    },
  ): ExperimentVariants {
    return em.create(
      ExperimentVariants,
      {
        adExperimentId: data.adExperimentId,
        name: data.name,
        variantRefType: data.variantRefType,
        variantRefId: data.variantRefId,
        trafficSplitPercent: data.trafficSplitPercent,
        isControl: data.isControl,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findVariantsByExperiment(
    em: EntityManager,
    adExperimentId: string,
  ): Promise<ExperimentVariants[]> {
    return em.find(ExperimentVariants, { adExperimentId });
  }

  // --- Reglas automatizadas (UC-43-11) ---

  findRuleForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<AutomatedRules | null> {
    return em.findOne(
      AutomatedRules,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Ejecución de regla: log append-only de lo que se evaluó y lo que se tocó. */
  createRuleExecution(
    em: EntityManager,
    data: {
      automatedRuleId: string;
      statusConceptId: string;
      entitiesEvaluated: number;
      entitiesAffected: number;
      actionsJson?: unknown;
      errorText?: string;
      recordedByUserId?: string;
    },
  ): RuleExecutions {
    return em.create(
      RuleExecutions,
      {
        automatedRuleId: data.automatedRuleId,
        statusConceptId: data.statusConceptId,
        entitiesEvaluated: data.entitiesEvaluated,
        entitiesAffected: data.entitiesAffected,
        actionsJson: data.actionsJson,
        errorText: data.errorText,
        evaluatedAt: new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  // --- Moderación (UC-43-12) ---

  createReviewEvent(
    em: EntityManager,
    data: {
      adId: string;
      reviewEventTypeConceptId: string;
      reviewStatusConceptId: string;
      externalReviewId?: string;
      reasonsJson?: unknown;
      sourcePayloadHash?: string;
    },
  ): AdReviewEvents {
    return em.create(
      AdReviewEvents,
      {
        adId: data.adId,
        occurredAt: new Date(),
        reviewEventTypeConceptId: data.reviewEventTypeConceptId,
        reviewStatusConceptId: data.reviewStatusConceptId,
        externalReviewId: data.externalReviewId,
        reasonsJson: data.reasonsJson,
        sourcePayloadHash: data.sourcePayloadHash,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** El identificador externo hace idempotente la reentrega del webhook. */
  findReviewEventByExternalId(
    em: EntityManager,
    externalReviewId: string,
  ): Promise<AdReviewEvents | null> {
    return em.findOne(AdReviewEvents, { externalReviewId });
  }

  createViolation(
    em: EntityManager,
    data: {
      adId: string;
      adReviewEventId?: string;
      policyCode: string;
      policyCategoryConceptId: string;
      severityConceptId: string;
      explanation?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): AdPolicyViolations {
    return em.create(
      AdPolicyViolations,
      {
        adId: data.adId,
        adReviewEventId: data.adReviewEventId,
        policyCode: data.policyCode,
        policyCategoryConceptId: data.policyCategoryConceptId,
        severityConceptId: data.severityConceptId,
        explanation: data.explanation,
        statusConceptId: data.statusConceptId,
        detectedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findViolationForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<AdPolicyViolations | null> {
    return em.findOne(
      AdPolicyViolations,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Infracciones abiertas del anuncio: mientras haya una, no vuelve a entregar. */
  findOpenViolations(
    em: EntityManager,
    adId: string,
    openStatusConceptId: string,
  ): Promise<AdPolicyViolations[]> {
    return em.find(AdPolicyViolations, {
      adId,
      statusConceptId: openStatusConceptId,
    });
  }

  createAppeal(
    em: EntityManager,
    data: {
      adPolicyViolationId: string;
      submittedByUserId?: string;
      appealReason: string;
      evidenceFileId?: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): AdPolicyAppeals {
    return em.create(
      AdPolicyAppeals,
      {
        adPolicyViolationId: data.adPolicyViolationId,
        submittedAt: new Date(),
        submittedByUserId: data.submittedByUserId,
        appealReason: data.appealReason,
        evidenceFileId: data.evidenceFileId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findAppealByViolation(
    em: EntityManager,
    adPolicyViolationId: string,
  ): Promise<AdPolicyAppeals | null> {
    return em.findOne(AdPolicyAppeals, { adPolicyViolationId });
  }

  // --- Facturación (UC-43-14) ---

  createInvoice(em: EntityManager, data: CreateInvoiceData): AdInvoices {
    return em.create(
      AdInvoices,
      {
        adAccountId: data.adAccountId,
        invoiceNumber: data.invoiceNumber,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        subtotal: data.subtotal,
        taxTotal: data.taxTotal,
        total: data.total,
        currencyConceptId: data.currencyConceptId,
        statusConceptId: data.statusConceptId,
        issuedAt: new Date(),
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findInvoiceByNumber(
    em: EntityManager,
    invoiceNumber: string,
  ): Promise<AdInvoices | null> {
    return em.findOne(AdInvoices, { invoiceNumber });
  }

  /** Factura ya emitida para el periodo: emitir dos veces duplicaría la deuda. */
  findInvoiceForPeriod(
    em: EntityManager,
    adAccountId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<AdInvoices | null> {
    return em.findOne(AdInvoices, { adAccountId, periodStart, periodEnd });
  }

  createInvoiceLine(
    em: EntityManager,
    data: {
      adInvoiceId: string;
      campaignRefId: string;
      description?: string;
      impressions?: string;
      clicks?: string;
      amount: string;
      actorUserId?: string;
    },
  ): AdInvoiceLines {
    return em.create(
      AdInvoiceLines,
      {
        adInvoiceId: data.adInvoiceId,
        campaignRefId: data.campaignRefId,
        description: data.description,
        impressions: data.impressions,
        clicks: data.clicks,
        amount: data.amount,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  // --- Leads (UC-43-15) ---

  findLeadFormById(em: EntityManager, id: string): Promise<LeadForms | null> {
    return em.findOne(LeadForms, { id });
  }

  findQuestionsByForm(
    em: EntityManager,
    leadFormId: string,
  ): Promise<LeadFormQuestions[]> {
    return em.find(
      LeadFormQuestions,
      { leadFormId },
      { orderBy: { displayOrder: 'ASC' } },
    );
  }

  createSubmission(
    em: EntityManager,
    data: CreateLeadSubmissionData,
  ): LeadSubmissions {
    return em.create(
      LeadSubmissions,
      {
        tenantId: data.tenantId,
        leadFormId: data.leadFormId,
        adId: data.adId,
        adSetId: data.adSetId,
        campaignId: data.campaignId,
        externalLeadId: data.externalLeadId,
        submittedAt: new Date(),
        consentDirectiveId: data.consentDirectiveId,
        processingStatusConceptId: data.processingStatusConceptId,
        rawPayloadHash: data.rawPayloadHash,
        sourceIpHash: data.sourceIpHash,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** El identificador externo hace idempotente la reentrega del webhook. */
  findSubmissionByExternalId(
    em: EntityManager,
    leadFormId: string,
    externalLeadId: string,
  ): Promise<LeadSubmissions | null> {
    return em.findOne(LeadSubmissions, { leadFormId, externalLeadId });
  }

  /** Respuestas cifradas en reposo: nunca se guarda el texto en claro. */
  createAnswer(
    em: EntityManager,
    data: {
      leadSubmissionId: string;
      leadFormQuestionId: string;
      answerTextEncrypted?: string;
      normalizedValueHash?: string;
    },
  ): LeadAnswers {
    return em.create(
      LeadAnswers,
      {
        leadSubmissionId: data.leadSubmissionId,
        leadFormQuestionId: data.leadFormQuestionId,
        answerTextEncrypted: data.answerTextEncrypted,
        normalizedValueHash: data.normalizedValueHash,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  createDeliveryEvent(
    em: EntityManager,
    data: {
      leadSubmissionId: string;
      destinationTypeConceptId: string;
      destinationReference?: string;
      attemptNumber: number;
      resultConceptId: string;
      responseReference?: string;
      retryAt?: Date;
    },
  ): LeadDeliveryEvents {
    return em.create(
      LeadDeliveryEvents,
      {
        leadSubmissionId: data.leadSubmissionId,
        destinationTypeConceptId: data.destinationTypeConceptId,
        destinationReference: data.destinationReference,
        attemptedAt: new Date(),
        attemptNumber: data.attemptNumber,
        resultConceptId: data.resultConceptId,
        responseReference: data.responseReference,
        retryAt: data.retryAt,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  countDeliveryAttempts(
    em: EntityManager,
    leadSubmissionId: string,
  ): Promise<number> {
    return em.count(LeadDeliveryEvents, { leadSubmissionId });
  }
}
