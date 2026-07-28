import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  AdsAccountsRepository,
  AdsCampaignsRepository,
  AdsDataRepository,
  AdsOptimizationRepository,
} from '../repositories';
import { ENTITY_TYPE_CONCEPT } from './ads-data.service';
import {
  CreateExperimentDto,
  ExperimentResponseDto,
  EvaluateRuleDto,
  EvaluateRuleResponseDto,
  RecordReviewEventDto,
  ReviewEventResponseDto,
  SubmitAppealDto,
  AppealResponseDto,
  IssueAdInvoiceDto,
  AdInvoiceResponseDto,
  SubmitLeadDto,
  LeadSubmissionResponseDto,
  type ObjectiveMetric,
  type PolicyCategory,
} from '../dto';

const OBJECTIVE_METRIC_CONCEPT: Readonly<Record<ObjectiveMetric, string>> = {
  CPA: CONCEPTS.METRIC_CPA,
  ROAS: CONCEPTS.METRIC_ROAS,
  CTR: CONCEPTS.METRIC_CTR,
};

const POLICY_CATEGORY_CONCEPT: Readonly<Record<PolicyCategory, string>> = {
  HEALTH: CONCEPTS.POLICY_CATEGORY_HEALTH,
  MISLEADING: CONCEPTS.POLICY_CATEGORY_MISLEADING,
  PROHIBITED: CONCEPTS.POLICY_CATEGORY_PROHIBITED,
};

const SEVERITY_CONCEPT: Readonly<Record<'LOW' | 'MEDIUM' | 'HIGH', string>> = {
  LOW: CONCEPTS.SEVERITY_LOW,
  MEDIUM: CONCEPTS.SEVERITY_MEDIUM,
  HIGH: CONCEPTS.SEVERITY_HIGH,
};

const REVIEW_EVENT_CONCEPT: Readonly<
  Record<'INITIAL' | 'RE_REVIEW' | 'APPEAL_DECISION', string>
> = {
  INITIAL: CONCEPTS.REVIEW_EVENT_INITIAL,
  RE_REVIEW: CONCEPTS.REVIEW_EVENT_RE_REVIEW,
  APPEAL_DECISION: CONCEPTS.REVIEW_EVENT_APPEAL_DECISION,
};

const REVIEW_STATUS_CONCEPT: Readonly<
  Record<'PENDING' | 'APPROVED' | 'DISAPPROVED', string>
> = {
  PENDING: CONCEPTS.REVIEW_PENDING,
  APPROVED: CONCEPTS.REVIEW_APPROVED,
  DISAPPROVED: CONCEPTS.REVIEW_DISAPPROVED,
};

const REVIEW_TO_EFFECTIVE: Readonly<
  Record<'PENDING' | 'APPROVED' | 'DISAPPROVED', string>
> = {
  PENDING: CONCEPTS.AD_EFFECTIVE_PENDING_REVIEW,
  APPROVED: CONCEPTS.AD_EFFECTIVE_ACTIVE,
  DISAPPROVED: CONCEPTS.AD_EFFECTIVE_DISAPPROVED,
};

const TOTAL_SPLIT_PERCENT = 100;

/**
 * Experimentos, reglas automatizadas, moderación, facturación de anuncios y
 * captura de leads (UC-43-10, 11, 12, 14, 15).
 */
@Injectable()
export class AdsOptimizationService {
  constructor(
    private readonly em: EntityManager,
    private readonly optimizationRepo: AdsOptimizationRepository,
    private readonly campaignsRepo: AdsCampaignsRepository,
    private readonly accountsRepo: AdsAccountsRepository,
    private readonly dataRepo: AdsDataRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(AdsOptimizationService.name);
  }

  /**
   * UC-43-10: crear el experimento y arrancar sus variantes. El reparto de
   * tráfico tiene que sumar 100 y llevar exactamente un control: sin control no
   * hay contra qué comparar, y con dos el resultado no significa nada.
   */
  async createExperiment(
    adAccountId: string,
    dto: CreateExperimentDto,
    actor: AuthenticatedUser,
  ): Promise<ExperimentResponseDto> {
    this.logger.info(
      {
        operation: 'ads.experiment.create',
        adAccountId,
        variants: dto.variants.length,
      },
      'Creating ad experiment',
    );

    const totalSplit = dto.variants.reduce(
      (sum, v) => sum + Number(v.trafficSplitPercent),
      0,
    );
    if (Math.abs(totalSplit - TOTAL_SPLIT_PERCENT) > 0.001) {
      throw new PreconditionFailedException(
        'El reparto de tráfico debe sumar 100',
        {
          totalSplit,
        },
      );
    }
    const controls = dto.variants.filter((v) => v.isControl).length;
    if (controls !== 1) {
      throw new PreconditionFailedException(
        'El experimento necesita exactamente un control',
        {
          controls,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const account = await this.accountsRepo.findAdAccountById(
        tx,
        adAccountId,
      );
      if (!account) {
        throw new ResourceNotFoundException(
          'Cuenta publicitaria no encontrada',
          { adAccountId },
        );
      }

      const experiment = this.optimizationRepo.createExperiment(tx, {
        adAccountId,
        name: dto.name,
        experimentTypeConceptId:
          dto.experimentType === 'AB_SPLIT'
            ? CONCEPTS.EXPERIMENT_AB_SPLIT
            : CONCEPTS.EXPERIMENT_CBO,
        objectiveMetricConceptId: OBJECTIVE_METRIC_CONCEPT[dto.objectiveMetric],
        hypothesis: dto.hypothesis,
        holdoutPercent: dto.holdoutPercent,
        startAt: dto.startAt ? new Date(dto.startAt) : undefined,
        endAt: dto.endAt ? new Date(dto.endAt) : undefined,
        statusConceptId: CONCEPTS.EXPERIMENT_SCHEDULED,
        actorUserId: actor.id,
      });

      const variantIds: string[] = [];
      let entitiesActivated = 0;

      for (const variant of dto.variants) {
        // Cada variante apunta a una entidad real: arrancar el experimento la
        // pone en marcha, y no puede arrancar lo que no existe.
        if (variant.variantRefType === 'CAMPAIGN') {
          const campaign = await this.campaignsRepo.findCampaignForUpdate(
            tx,
            variant.variantRefId,
          );
          if (!campaign) {
            throw new ResourceNotFoundException(
              'Campaña de la variante no encontrada',
              {
                variantRefId: variant.variantRefId,
              },
            );
          }
          if (campaign.statusConceptId === CONCEPTS.AD_STATUS_PAUSED) {
            campaign.statusConceptId = CONCEPTS.AD_STATUS_ACTIVE;
            touch(campaign, actor.id);
            entitiesActivated += 1;
          }
        } else {
          const adSet = await this.campaignsRepo.findAdSetForUpdate(
            tx,
            variant.variantRefId,
          );
          if (!adSet) {
            throw new ResourceNotFoundException(
              'Conjunto de la variante no encontrado',
              {
                variantRefId: variant.variantRefId,
              },
            );
          }
          if (adSet.statusConceptId === CONCEPTS.AD_STATUS_PAUSED) {
            adSet.statusConceptId = CONCEPTS.AD_STATUS_ACTIVE;
            touch(adSet, actor.id);
            entitiesActivated += 1;
          }
        }

        const created = this.optimizationRepo.createVariant(tx, {
          adExperimentId: experiment.id,
          name: variant.name,
          variantRefType: variant.variantRefType,
          variantRefId: variant.variantRefId,
          trafficSplitPercent: variant.trafficSplitPercent,
          isControl: variant.isControl,
          actorUserId: actor.id,
        });
        variantIds.push(created.id);
      }

      experiment.statusConceptId = CONCEPTS.EXPERIMENT_RUNNING;

      return {
        id: experiment.id,
        statusConceptId: CONCEPTS.EXPERIMENT_RUNNING,
        variantIds,
        entitiesActivated,
      };
    });
  }

  /**
   * UC-43-11: aplicar la acción de una regla sobre las entidades que el
   * evaluador determinó. El resultado se registra siempre, aunque no toque nada:
   * saber que la regla corrió y no encontró nada también es información.
   */
  async evaluateRule(
    ruleId: string,
    dto: EvaluateRuleDto,
    actor: AuthenticatedUser,
  ): Promise<EvaluateRuleResponseDto> {
    this.logger.info(
      {
        operation: 'ads.rule.evaluate',
        ruleId,
        matched: dto.matchedEntityIds.length,
      },
      'Evaluating automated rule',
    );

    return this.em.transactional(async (tx) => {
      const rule = await this.optimizationRepo.findRuleForUpdate(tx, ruleId);
      if (!rule) {
        throw new ResourceNotFoundException(
          'Regla automatizada no encontrada',
          { ruleId },
        );
      }
      if (!rule.isEnabled || rule.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('La regla no está habilitada', {
          ruleId,
        });
      }

      const actions: Array<Record<string, unknown>> = [];
      let entitiesAffected = 0;

      for (const entityId of dto.matchedEntityIds) {
        const applied = await this.applyRuleAction(
          tx,
          rule.scopeConceptId,
          rule.actionConceptId,
          entityId,
          dto,
          actor,
        );
        if (applied) {
          actions.push({ entityId, action: rule.actionConceptId });
          entitiesAffected += 1;
        }
      }

      const execution = this.optimizationRepo.createRuleExecution(tx, {
        automatedRuleId: ruleId,
        statusConceptId: CONCEPTS.RULE_RUN_SUCCEEDED,
        entitiesEvaluated: dto.matchedEntityIds.length,
        entitiesAffected,
        actionsJson: { actions },
        recordedByUserId: actor.id,
      });

      rule.lastEvaluatedAt = new Date();
      touch(rule, actor.id);

      return {
        ruleExecutionId: execution.id,
        entitiesEvaluated: dto.matchedEntityIds.length,
        entitiesAffected,
        statusConceptId: CONCEPTS.RULE_RUN_SUCCEEDED,
      };
    });
  }

  /**
   * UC-43-12: registrar el resultado de la revisión. Un rechazo abre infracción
   * y deja el anuncio como `disapproved`: no puede seguir entregando.
   */
  async recordReviewEvent(
    adId: string,
    dto: RecordReviewEventDto,
    actor: AuthenticatedUser,
  ): Promise<ReviewEventResponseDto> {
    this.logger.info(
      { operation: 'ads.review.record', adId, reviewStatus: dto.reviewStatus },
      'Recording ad review event',
    );

    return this.em.transactional(async (tx) => {
      // La plataforma reentrega sus webhooks: el identificador externo evita
      // abrir dos infracciones por el mismo rechazo.
      if (dto.externalReviewId) {
        const previous =
          await this.optimizationRepo.findReviewEventByExternalId(
            tx,
            dto.externalReviewId,
          );
        if (previous) {
          const ad = await this.campaignsRepo.findAdById(tx, adId);
          return {
            reviewEventId: previous.id,
            effectiveStatusConceptId:
              ad?.effectiveStatusConceptId ??
              CONCEPTS.AD_EFFECTIVE_PENDING_REVIEW,
            duplicate: true,
          };
        }
      }

      const ad = await this.campaignsRepo.findAdForUpdate(tx, adId);
      if (!ad) {
        throw new ResourceNotFoundException('Anuncio no encontrado', { adId });
      }

      const reviewEvent = this.optimizationRepo.createReviewEvent(tx, {
        adId,
        reviewEventTypeConceptId: REVIEW_EVENT_CONCEPT[dto.reviewEventType],
        reviewStatusConceptId: REVIEW_STATUS_CONCEPT[dto.reviewStatus],
        externalReviewId: dto.externalReviewId,
        reasonsJson: dto.reasonsJson,
        sourcePayloadHash: dto.sourcePayloadHash,
      });

      let violationId: string | undefined;
      if (dto.reviewStatus === 'DISAPPROVED') {
        if (!dto.policyCode || !dto.policyCategory || !dto.severity) {
          throw new PreconditionFailedException(
            'Un rechazo necesita código, categoría y severidad de la política',
            { adId },
          );
        }
        this.logger.warn(
          { operation: 'ads.review.record', adId, policyCode: dto.policyCode },
          'Ad disapproved by policy review',
        );
        const violation = this.optimizationRepo.createViolation(tx, {
          adId,
          adReviewEventId: reviewEvent.id,
          policyCode: dto.policyCode,
          policyCategoryConceptId: POLICY_CATEGORY_CONCEPT[dto.policyCategory],
          severityConceptId: SEVERITY_CONCEPT[dto.severity],
          explanation: dto.explanation,
          statusConceptId: CONCEPTS.VIOLATION_OPEN,
          actorUserId: actor.id,
        });
        violationId = violation.id;
      }

      if (dto.reviewStatus === 'APPROVED') {
        // Aprobar cierra las infracciones abiertas: es la plataforma diciendo
        // que ya no las considera vigentes.
        const open = await this.optimizationRepo.findOpenViolations(
          tx,
          adId,
          CONCEPTS.VIOLATION_OPEN,
        );
        for (const violation of open) {
          violation.statusConceptId = CONCEPTS.VIOLATION_RESOLVED;
          violation.resolvedAt = new Date();
          touch(violation, actor.id);
        }
      }

      const effectiveStatusConceptId = REVIEW_TO_EFFECTIVE[dto.reviewStatus];
      ad.effectiveStatusConceptId = effectiveStatusConceptId;
      ad.reviewFeedbackJson = dto.reasonsJson;
      touch(ad, actor.id);

      const adSet = await this.campaignsRepo.findAdSetById(tx, ad.adSetId);
      const campaign = adSet
        ? await this.campaignsRepo.findCampaignById(tx, adSet.campaignId)
        : null;
      if (campaign) {
        this.dataRepo.createDeliverySnapshot(tx, {
          adAccountId: campaign.adAccountId,
          entityTypeConceptId: ENTITY_TYPE_CONCEPT.AD,
          entityRefId: adId,
          effectiveStatusConceptId,
          reviewStatusConceptId: REVIEW_STATUS_CONCEPT[dto.reviewStatus],
          issuesJson: dto.reasonsJson,
          recordedByUserId: actor.id,
        });
      }

      return {
        reviewEventId: reviewEvent.id,
        violationId,
        effectiveStatusConceptId,
        duplicate: false,
      };
    });
  }

  /** UC-43-12: apelar una infracción abierta. Una infracción se apela una vez. */
  async submitAppeal(
    violationId: string,
    dto: SubmitAppealDto,
    actor: AuthenticatedUser,
  ): Promise<AppealResponseDto> {
    this.logger.info(
      { operation: 'ads.appeal.submit', violationId },
      'Submitting policy appeal',
    );

    return this.em.transactional(async (tx) => {
      const violation = await this.optimizationRepo.findViolationForUpdate(
        tx,
        violationId,
      );
      if (!violation) {
        throw new ResourceNotFoundException('Infracción no encontrada', {
          violationId,
        });
      }
      if (violation.statusConceptId !== CONCEPTS.VIOLATION_OPEN) {
        throw new PreconditionFailedException(
          'La infracción ya no está abierta',
          {
            violationId,
            statusConceptId: violation.statusConceptId,
          },
        );
      }

      const existing = await this.optimizationRepo.findAppealByViolation(
        tx,
        violationId,
      );
      if (existing) {
        throw new ConflictException('La infracción ya tiene una apelación', {
          violationId,
          appealId: existing.id,
        });
      }

      const appeal = this.optimizationRepo.createAppeal(tx, {
        adPolicyViolationId: violationId,
        submittedByUserId: actor.id,
        appealReason: dto.appealReason,
        evidenceFileId: dto.evidenceFileId,
        statusConceptId: CONCEPTS.APPEAL_SUBMITTED,
        actorUserId: actor.id,
      });

      return {
        id: appeal.id,
        adPolicyViolationId: violationId,
        statusConceptId: CONCEPTS.APPEAL_SUBMITTED,
      };
    });
  }

  /**
   * UC-43-14: emitir la factura del periodo agregando los rollups por campaña.
   * El total se **deriva** de las líneas: aceptarlo del cliente permitiría
   * cobrar algo distinto de lo consumido.
   */
  async issueInvoice(
    adAccountId: string,
    dto: IssueAdInvoiceDto,
    actor: AuthenticatedUser,
  ): Promise<AdInvoiceResponseDto> {
    this.logger.info(
      {
        operation: 'ads.invoice.issue',
        adAccountId,
        invoiceNumber: dto.invoiceNumber,
      },
      'Issuing ad invoice',
    );

    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    if (periodEnd <= periodStart) {
      throw new PreconditionFailedException(
        'El periodo debe terminar después de empezar',
        {
          periodStart: dto.periodStart,
          periodEnd: dto.periodEnd,
        },
      );
    }

    const duplicateNumber = await this.optimizationRepo.findInvoiceByNumber(
      this.em,
      dto.invoiceNumber,
    );
    if (duplicateNumber) {
      throw new ConflictException('Ya existe una factura con ese número', {
        invoiceNumber: dto.invoiceNumber,
      });
    }

    return this.em.transactional(async (tx) => {
      const account = await this.accountsRepo.findAdAccountForUpdate(
        tx,
        adAccountId,
      );
      if (!account) {
        throw new ResourceNotFoundException(
          'Cuenta publicitaria no encontrada',
          { adAccountId },
        );
      }

      const existing = await this.optimizationRepo.findInvoiceForPeriod(
        tx,
        adAccountId,
        periodStart,
        periodEnd,
      );
      if (existing) {
        throw new ConflictException('El periodo ya está facturado', {
          adAccountId,
          invoiceId: existing.id,
        });
      }

      const rollups = await this.dataRepo.findInsightsInPeriod(
        tx,
        adAccountId,
        CONCEPTS.AD_ENTITY_CAMPAIGN,
        periodStart,
        periodEnd,
      );
      if (rollups.length === 0) {
        throw new PreconditionFailedException(
          'No hay consumo registrado en el periodo',
          {
            adAccountId,
            periodStart: dto.periodStart,
            periodEnd: dto.periodEnd,
          },
        );
      }

      // Un periodo puede tener varias filas por campaña (una por día): la línea
      // de factura agrega todo el consumo de esa campaña.
      const byCampaign = new Map<
        string,
        { impressions: number; clicks: number; amount: number }
      >();
      for (const row of rollups) {
        const current = byCampaign.get(row.entityRefId) ?? {
          impressions: 0,
          clicks: 0,
          amount: 0,
        };
        current.impressions += Number(row.impressions ?? '0');
        current.clicks += Number(row.clicks ?? '0');
        current.amount += Number(row.spend ?? '0');
        byCampaign.set(row.entityRefId, current);
      }

      let subtotal = 0;
      for (const totals of byCampaign.values()) subtotal += totals.amount;
      const taxTotal = (subtotal * Number(dto.taxPercentage ?? '0')) / 100;
      const total = subtotal + taxTotal;

      const invoice = this.optimizationRepo.createInvoice(tx, {
        adAccountId,
        invoiceNumber: dto.invoiceNumber,
        periodStart,
        periodEnd,
        subtotal: this.round(subtotal),
        taxTotal: this.round(taxTotal),
        total: this.round(total),
        currencyConceptId: dto.currencyConceptId ?? account.currencyConceptId,
        statusConceptId: CONCEPTS.AD_INVOICE_ISSUED,
        actorUserId: actor.id,
      });

      for (const [campaignRefId, totals] of byCampaign) {
        this.optimizationRepo.createInvoiceLine(tx, {
          adInvoiceId: invoice.id,
          campaignRefId,
          impressions: String(totals.impressions),
          clicks: String(totals.clicks),
          amount: this.round(totals.amount),
          actorUserId: actor.id,
        });
      }

      // Intento de cobro REAL de la factura: se asienta el cargo por el total en
      // `ad_billing_events` (la tabla de cobros del módulo), dentro de la misma
      // transacción que la factura, referenciando el número de factura.
      //
      // La pasarela de pago es frontera de `payments` (stub deliberado): crear el
      // PaymentIntent y el asiento contable NO pertenecen a este módulo. Cuando
      // ese gateway confirme el cobro, poblará `ad_invoices.payment_intent_id` y
      // transicionará la factura a AD_INVOICE_PAID. Aquí no se inventa pasarela:
      // se deja registrado el cargo y la factura permanece AD_INVOICE_ISSUED.
      this.dataRepo.createBillingEvent(tx, {
        adAccountId,
        billingEventTypeConceptId: CONCEPTS.AD_BILLING_CHARGE,
        amount: this.round(total),
        currencyConceptId: dto.currencyConceptId ?? account.currencyConceptId,
        periodStart,
        periodEnd,
        externalBillingRef: dto.invoiceNumber,
        recordedByUserId: actor.id,
      });

      return {
        id: invoice.id,
        invoiceNumber: dto.invoiceNumber,
        subtotal: this.round(subtotal),
        taxTotal: this.round(taxTotal),
        total: this.round(total),
        lines: byCampaign.size,
        statusConceptId: CONCEPTS.AD_INVOICE_ISSUED,
      };
    });
  }

  /**
   * UC-43-15: recibir un lead del formulario y encolar su entrega al CRM. Las
   * respuestas se guardan cifradas y sólo se aceptan las que corresponden a una
   * pregunta del formulario.
   */
  async submitLead(
    leadFormId: string,
    dto: SubmitLeadDto,
    actor: AuthenticatedUser,
  ): Promise<LeadSubmissionResponseDto> {
    this.logger.info(
      { operation: 'ads.lead.submit', leadFormId },
      'Receiving lead form submission',
    );

    return this.em.transactional(async (tx) => {
      const form = await this.optimizationRepo.findLeadFormById(tx, leadFormId);
      if (!form) {
        throw new ResourceNotFoundException(
          'Formulario de leads no encontrado',
          { leadFormId },
        );
      }
      if (form.statusConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new PreconditionFailedException('El formulario no está activo', {
          leadFormId,
        });
      }

      const previous = await this.optimizationRepo.findSubmissionByExternalId(
        tx,
        leadFormId,
        dto.externalLeadId,
      );
      if (previous) {
        return {
          id: previous.id,
          processingStatusConceptId: previous.processingStatusConceptId,
          answersStored: 0,
          answersIgnored: 0,
          duplicate: true,
        };
      }

      const submission = this.optimizationRepo.createSubmission(tx, {
        tenantId: dto.tenantId,
        leadFormId,
        adId: dto.adId,
        adSetId: dto.adSetId,
        campaignId: dto.campaignId,
        externalLeadId: dto.externalLeadId,
        consentDirectiveId: dto.consentDirectiveId,
        processingStatusConceptId: CONCEPTS.LEAD_RECEIVED,
        rawPayloadHash: dto.rawPayloadHash,
        // La IP se guarda hasheada: identifica al interesado y no hace falta en claro.
        sourceIpHash: dto.sourceIp ? this.hash(dto.sourceIp) : undefined,
      });

      const questions = await this.optimizationRepo.findQuestionsByForm(
        tx,
        leadFormId,
      );
      const byKey = new Map(questions.map((q) => [q.questionKey, q]));

      let answersStored = 0;
      let answersIgnored = 0;
      for (const answer of dto.answers) {
        const question = byKey.get(answer.questionKey);
        if (!question) {
          answersIgnored += 1;
          continue;
        }
        this.optimizationRepo.createAnswer(tx, {
          leadSubmissionId: submission.id,
          leadFormQuestionId: question.id,
          answerTextEncrypted: answer.answer,
          normalizedValueHash: answer.answer
            ? this.hash(answer.answer.toLowerCase())
            : undefined,
        });
        answersStored += 1;
      }

      const missing = questions.filter(
        (q) =>
          q.isRequired &&
          !dto.answers.some((a) => a.questionKey === q.questionKey && a.answer),
      );
      if (missing.length > 0) {
        throw new PreconditionFailedException(
          'Faltan respuestas obligatorias del formulario',
          {
            leadFormId,
            missing: missing.map((q) => q.questionKey),
          },
        );
      }

      let deliveryEventId: string | undefined;
      if (form.destinationCrmPipelineId) {
        const attempts = await this.optimizationRepo.countDeliveryAttempts(
          tx,
          submission.id,
        );
        const delivery = this.optimizationRepo.createDeliveryEvent(tx, {
          leadSubmissionId: submission.id,
          destinationTypeConceptId: CONCEPTS.LEAD_DESTINATION_CRM,
          destinationReference: form.destinationCrmPipelineId,
          attemptNumber: attempts + 1,
          // La creación del lead en CRM la resuelve el outbox: aquí sólo se
          // encola el intento (ver README, sección Pendiente).
          resultConceptId: CONCEPTS.DELIVERY_QUEUED,
        });
        deliveryEventId = delivery.id;
      }

      return {
        id: submission.id,
        processingStatusConceptId: CONCEPTS.LEAD_RECEIVED,
        answersStored,
        answersIgnored,
        duplicate: false,
        deliveryEventId,
      };
    });
  }

  // --- Apoyo ---

  /** Aplica la acción de la regla sobre una entidad; devuelve si la cambió. */
  private async applyRuleAction(
    tx: EntityManager,
    scopeConceptId: string,
    actionConceptId: string,
    entityId: string,
    dto: EvaluateRuleDto,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    if (scopeConceptId === CONCEPTS.RULE_SCOPE_CAMPAIGN) {
      const campaign = await this.campaignsRepo.findCampaignForUpdate(
        tx,
        entityId,
      );
      if (!campaign) return false;
      if (actionConceptId === CONCEPTS.RULE_ACTION_PAUSE) {
        if (campaign.statusConceptId === CONCEPTS.AD_STATUS_PAUSED)
          return false;
        campaign.statusConceptId = CONCEPTS.AD_STATUS_PAUSED;
      } else if (actionConceptId === CONCEPTS.RULE_ACTION_ACTIVATE) {
        if (campaign.statusConceptId === CONCEPTS.AD_STATUS_ACTIVE)
          return false;
        campaign.statusConceptId = CONCEPTS.AD_STATUS_ACTIVE;
      } else if (actionConceptId === CONCEPTS.RULE_ACTION_ADJUST_BUDGET) {
        if (!dto.newDailyBudget) return false;
        campaign.dailyBudget = dto.newDailyBudget;
      } else {
        return false;
      }
      touch(campaign, actor.id);
      return true;
    }

    const adSet = await this.campaignsRepo.findAdSetForUpdate(tx, entityId);
    if (!adSet) return false;
    if (actionConceptId === CONCEPTS.RULE_ACTION_PAUSE) {
      if (adSet.statusConceptId === CONCEPTS.AD_STATUS_PAUSED) return false;
      adSet.statusConceptId = CONCEPTS.AD_STATUS_PAUSED;
    } else if (actionConceptId === CONCEPTS.RULE_ACTION_ACTIVATE) {
      if (adSet.statusConceptId === CONCEPTS.AD_STATUS_ACTIVE) return false;
      adSet.statusConceptId = CONCEPTS.AD_STATUS_ACTIVE;
    } else if (actionConceptId === CONCEPTS.RULE_ACTION_ADJUST_BUDGET) {
      if (!dto.newDailyBudget) return false;
      adSet.dailyBudget = dto.newDailyBudget;
    } else if (actionConceptId === CONCEPTS.RULE_ACTION_ADJUST_BID) {
      if (!dto.newBidAmount) return false;
      adSet.bidAmount = dto.newBidAmount;
    } else {
      return false;
    }
    touch(adSet, actor.id);
    return true;
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  /** Los importes se transportan como cadena decimal con 2 decimales. */
  private round(value: number): string {
    return value.toFixed(2);
  }
}
