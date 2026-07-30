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

/**
 * Describe el contrato estructural de create experiment data.
 */
export interface CreateExperimentData {
  /**
   * Identificador asociado a ad account.
   */
  adAccountId: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a experiment type concept.
   */
  experimentTypeConceptId: string;
  /**
   * Identificador asociado a objective metric concept.
   */
  objectiveMetricConceptId: string;
  /**
   * Valor de hypothesis mantenido por la instancia.
   */
  hypothesis?: string;
  /**
   * Valor de holdout percent mantenido por la instancia.
   */
  holdoutPercent?: string;
  /**
   * Valor de start at mantenido por la instancia.
   */
  startAt?: Date;
  /**
   * Valor de end at mantenido por la instancia.
   */
  endAt?: Date;
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
 * Describe el contrato estructural de create invoice data.
 */
export interface CreateInvoiceData {
  /**
   * Identificador asociado a ad account.
   */
  adAccountId: string;
  /**
   * Valor de invoice number mantenido por la instancia.
   */
  invoiceNumber: string;
  /**
   * Valor de period start mantenido por la instancia.
   */
  periodStart: Date;
  /**
   * Valor de period end mantenido por la instancia.
   */
  periodEnd: Date;
  /**
   * Valor de subtotal mantenido por la instancia.
   */
  subtotal: string;
  /**
   * Valor de tax total mantenido por la instancia.
   */
  taxTotal: string;
  /**
   * Valor de total mantenido por la instancia.
   */
  total: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
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
 * Describe el contrato estructural de create lead submission data.
 */
export interface CreateLeadSubmissionData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a lead form.
   */
  leadFormId: string;
  /**
   * Identificador asociado a ad.
   */
  adId?: string;
  /**
   * Identificador asociado a ad set.
   */
  adSetId?: string;
  /**
   * Identificador asociado a campaign.
   */
  campaignId?: string;
  /**
   * Identificador asociado a external lead.
   */
  externalLeadId: string;
  /**
   * Identificador asociado a consent directive.
   */
  consentDirectiveId?: string;
  /**
   * Identificador asociado a processing status concept.
   */
  processingStatusConceptId: string;
  /**
   * Valor de raw payload hash mantenido por la instancia.
   */
  rawPayloadHash?: string;
  /**
   * Valor de source ip hash mantenido por la instancia.
   */
  sourceIpHash?: string;
}

/**
 * Acceso a experimentos, reglas automatizadas, moderación, facturación de
 * anuncios y formularios de leads de `ads.*`.
 */
@Injectable()
export class AdsOptimizationRepository {
  // --- Experimentos (UC-43-10) ---

  /**
   * Crea create experiment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create experiment conforme al contrato `AdExperiments`.
   */
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

  /**
   * Obtiene find experiment for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find experiment for update conforme al contrato `Promise<AdExperiments | null>`.
   */
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

  /**
   * Crea create variant.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create variant conforme al contrato `ExperimentVariants`.
   */
  createVariant(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a ad experiment.
       */
      adExperimentId: string;
      /**
       * Valor de name mantenido por la instancia.
       */
      name: string;
      /**
       * Valor de variant ref type mantenido por la instancia.
       */
      variantRefType: string;
      /**
       * Identificador asociado a variant ref.
       */
      variantRefId: string;
      /**
       * Valor de traffic split percent mantenido por la instancia.
       */
      trafficSplitPercent: string;
      /**
       * Valor de is control mantenido por la instancia.
       */
      isControl: boolean;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find variants by experiment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param adExperimentId - Identificador de ad experiment.
   * @returns Resultado de find variants by experiment conforme al contrato `Promise<ExperimentVariants[]>`.
   */
  findVariantsByExperiment(
    em: EntityManager,
    adExperimentId: string,
  ): Promise<ExperimentVariants[]> {
    return em.find(ExperimentVariants, { adExperimentId });
  }

  // --- Reglas automatizadas (UC-43-11) ---

  /**
   * Obtiene find rule for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find rule for update conforme al contrato `Promise<AutomatedRules | null>`.
   */
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
      /**
       * Identificador asociado a automated rule.
       */
      automatedRuleId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de entities evaluated mantenido por la instancia.
       */
      entitiesEvaluated: number;
      /**
       * Valor de entities affected mantenido por la instancia.
       */
      entitiesAffected: number;
      /**
       * Valor de actions json mantenido por la instancia.
       */
      actionsJson?: unknown;
      /**
       * Valor de error text mantenido por la instancia.
       */
      errorText?: string;
      /**
       * Identificador asociado a recorded by user.
       */
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

  /**
   * Crea create review event.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create review event conforme al contrato `AdReviewEvents`.
   */
  createReviewEvent(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a ad.
       */
      adId: string;
      /**
       * Identificador asociado a review event type concept.
       */
      reviewEventTypeConceptId: string;
      /**
       * Identificador asociado a review status concept.
       */
      reviewStatusConceptId: string;
      /**
       * Identificador asociado a external review.
       */
      externalReviewId?: string;
      /**
       * Valor de reasons json mantenido por la instancia.
       */
      reasonsJson?: unknown;
      /**
       * Valor de source payload hash mantenido por la instancia.
       */
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

  /**
   * Crea create violation.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create violation conforme al contrato `AdPolicyViolations`.
   */
  createViolation(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a ad.
       */
      adId: string;
      /**
       * Identificador asociado a ad review event.
       */
      adReviewEventId?: string;
      /**
       * Valor de policy code mantenido por la instancia.
       */
      policyCode: string;
      /**
       * Identificador asociado a policy category concept.
       */
      policyCategoryConceptId: string;
      /**
       * Identificador asociado a severity concept.
       */
      severityConceptId: string;
      /**
       * Valor de explanation mantenido por la instancia.
       */
      explanation?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find violation for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find violation for update conforme al contrato `Promise<AdPolicyViolations | null>`.
   */
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

  /**
   * Crea create appeal.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create appeal conforme al contrato `AdPolicyAppeals`.
   */
  createAppeal(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a ad policy violation.
       */
      adPolicyViolationId: string;
      /**
       * Identificador asociado a submitted by user.
       */
      submittedByUserId?: string;
      /**
       * Valor de appeal reason mantenido por la instancia.
       */
      appealReason: string;
      /**
       * Identificador asociado a evidence file.
       */
      evidenceFileId?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find appeal by violation.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param adPolicyViolationId - Identificador de ad policy violation.
   * @returns Resultado de find appeal by violation conforme al contrato `Promise<AdPolicyAppeals | null>`.
   */
  findAppealByViolation(
    em: EntityManager,
    adPolicyViolationId: string,
  ): Promise<AdPolicyAppeals | null> {
    return em.findOne(AdPolicyAppeals, { adPolicyViolationId });
  }

  // --- Facturación (UC-43-14) ---

  /**
   * Crea create invoice.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create invoice conforme al contrato `AdInvoices`.
   */
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

  /**
   * Obtiene find invoice by number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param invoiceNumber - Valor de invoice number requerido por la operación.
   * @returns Resultado de find invoice by number conforme al contrato `Promise<AdInvoices | null>`.
   */
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

  /**
   * Crea create invoice line.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create invoice line conforme al contrato `AdInvoiceLines`.
   */
  createInvoiceLine(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a ad invoice.
       */
      adInvoiceId: string;
      /**
       * Identificador asociado a campaign ref.
       */
      campaignRefId: string;
      /**
       * Valor de description mantenido por la instancia.
       */
      description?: string;
      /**
       * Valor de impressions mantenido por la instancia.
       */
      impressions?: string;
      /**
       * Valor de clicks mantenido por la instancia.
       */
      clicks?: string;
      /**
       * Valor de amount mantenido por la instancia.
       */
      amount: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Obtiene find lead form by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find lead form by id conforme al contrato `Promise<LeadForms | null>`.
   */
  findLeadFormById(em: EntityManager, id: string): Promise<LeadForms | null> {
    return em.findOne(LeadForms, { id });
  }

  /**
   * Obtiene find questions by form.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param leadFormId - Identificador de lead form.
   * @returns Resultado de find questions by form conforme al contrato `Promise<LeadFormQuestions[]>`.
   */
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

  /**
   * Crea create submission.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create submission conforme al contrato `LeadSubmissions`.
   */
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
      /**
       * Identificador asociado a lead submission.
       */
      leadSubmissionId: string;
      /**
       * Identificador asociado a lead form question.
       */
      leadFormQuestionId: string;
      /**
       * Valor de answer text encrypted mantenido por la instancia.
       */
      answerTextEncrypted?: string;
      /**
       * Valor de normalized value hash mantenido por la instancia.
       */
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

  /**
   * Crea create delivery event.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create delivery event conforme al contrato `LeadDeliveryEvents`.
   */
  createDeliveryEvent(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a lead submission.
       */
      leadSubmissionId: string;
      /**
       * Identificador asociado a destination type concept.
       */
      destinationTypeConceptId: string;
      /**
       * Valor de destination reference mantenido por la instancia.
       */
      destinationReference?: string;
      /**
       * Valor de attempt number mantenido por la instancia.
       */
      attemptNumber: number;
      /**
       * Identificador asociado a result concept.
       */
      resultConceptId: string;
      /**
       * Valor de response reference mantenido por la instancia.
       */
      responseReference?: string;
      /**
       * Valor de retry at mantenido por la instancia.
       */
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

  /**
   * Ejecuta la operación count delivery attempts.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param leadSubmissionId - Identificador de lead submission.
   * @returns Resultado de count delivery attempts conforme al contrato `Promise<number>`.
   */
  countDeliveryAttempts(
    em: EntityManager,
    leadSubmissionId: string,
  ): Promise<number> {
    return em.count(LeadDeliveryEvents, { leadSubmissionId });
  }
}
