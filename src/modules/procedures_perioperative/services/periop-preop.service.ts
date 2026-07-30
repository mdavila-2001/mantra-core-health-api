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
import { PeriopCasesRepository, PeriopPreopRepository } from '../repositories';
import {
  CreatePreopAssessmentDto,
  PreopAssessmentResponseDto,
  VerifyOrdersDto,
  VerifyOrdersResponseDto,
  SubmitChecklistPhaseDto,
  ChecklistPhaseResponseDto,
  CreateAnesthesiaPlanDto,
  AnesthesiaPlanResponseDto,
  ApprovePlanResponseDto,
  RecordAnesthesiaEventDto,
  AnesthesiaEventResponseDto,
  type FitnessStatus,
  type AsaClass,
  type RiskModel,
  type ChecklistPhase,
  type ResponseStatus,
  type AnesthesiaType,
  type AirwayPlan,
  type MallampatiClass,
  type AnesthesiaEventType,
  type ClinicalSeverity,
} from '../dto';

const FITNESS_CONCEPT: Readonly<Record<FitnessStatus, string>> = {
  FIT: CONCEPTS.FITNESS_FIT,
  FIT_WITH_CAUTION: CONCEPTS.FITNESS_FIT_WITH_CAUTION,
  UNFIT: CONCEPTS.FITNESS_UNFIT,
};

const ASA_CONCEPT: Readonly<Record<AsaClass, string>> = {
  I: CONCEPTS.ASA_I,
  II: CONCEPTS.ASA_II,
  III: CONCEPTS.ASA_III,
  IV: CONCEPTS.ASA_IV,
  V: CONCEPTS.ASA_V,
};

const RISK_MODEL_CONCEPT: Readonly<Record<RiskModel, string>> = {
  ASA: CONCEPTS.RISK_MODEL_ASA,
  RCRI: CONCEPTS.RISK_MODEL_RCRI,
  APFEL: CONCEPTS.RISK_MODEL_APFEL,
};

const PHASE_CONCEPT: Readonly<Record<ChecklistPhase, string>> = {
  SIGN_IN: CONCEPTS.PHASE_SIGN_IN,
  TIME_OUT: CONCEPTS.PHASE_TIME_OUT,
  SIGN_OUT: CONCEPTS.PHASE_SIGN_OUT,
};

const RESPONSE_STATUS_CONCEPT: Readonly<Record<ResponseStatus, string>> = {
  CONFIRMED: CONCEPTS.RESPONSE_CONFIRMED,
  NOT_APPLICABLE: CONCEPTS.RESPONSE_NOT_APPLICABLE,
  EXCEPTION: CONCEPTS.RESPONSE_EXCEPTION,
};

const ANESTHESIA_TYPE_CONCEPT: Readonly<Record<AnesthesiaType, string>> = {
  GENERAL: CONCEPTS.ANESTHESIA_GENERAL,
  REGIONAL: CONCEPTS.ANESTHESIA_REGIONAL,
  LOCAL: CONCEPTS.ANESTHESIA_LOCAL,
  SEDATION: CONCEPTS.ANESTHESIA_SEDATION,
};

const AIRWAY_PLAN_CONCEPT: Readonly<Record<AirwayPlan, string>> = {
  ETT: CONCEPTS.AIRWAY_PLAN_ETT,
  LMA: CONCEPTS.AIRWAY_PLAN_LMA,
  MASK: CONCEPTS.AIRWAY_PLAN_MASK,
};

const MALLAMPATI_CONCEPT: Readonly<Record<MallampatiClass, string>> = {
  I: CONCEPTS.MALLAMPATI_I,
  II: CONCEPTS.MALLAMPATI_II,
  III: CONCEPTS.MALLAMPATI_III,
  IV: CONCEPTS.MALLAMPATI_IV,
};

const ANESTHESIA_EVENT_CONCEPT: Readonly<Record<AnesthesiaEventType, string>> =
  {
    INDUCTION: CONCEPTS.ANES_EVENT_INDUCTION,
    INTUBATION: CONCEPTS.ANES_EVENT_INTUBATION,
    MEDICATION: CONCEPTS.ANES_EVENT_MEDICATION,
    VITALS: CONCEPTS.ANES_EVENT_VITALS,
    EMERGENCE: CONCEPTS.ANES_EVENT_EMERGENCE,
    COMPLICATION: CONCEPTS.ANES_EVENT_COMPLICATION,
  };

export const SEVERITY_CONCEPT: Readonly<Record<ClinicalSeverity, string>> = {
  ROUTINE: CONCEPTS.SEVERITY_ROUTINE,
  MINOR: CONCEPTS.SEVERITY_MINOR,
  MAJOR: CONCEPTS.SEVERITY_MAJOR,
  CRITICAL: CONCEPTS.SEVERITY_CRITICAL,
};

/** Hitos que crea cada evento de anestesia, cuando procede. */
const EVENT_MILESTONE: Readonly<Partial<Record<AnesthesiaEventType, string>>> =
  {
    INDUCTION: CONCEPTS.MILESTONE_ANESTHESIA_START,
    EMERGENCE: CONCEPTS.MILESTONE_EMERGENCE,
  };

/**
 * Fase preoperatoria: valoración con riesgo, verificación de órdenes, checklist
 * de seguridad y plan de anestesia con sus eventos (UC-53-03 … 07).
 */
@Injectable()
export class PeriopPreopService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param preopRepo - Valor de preop repo requerido por la operación.
   * @param casesRepo - Valor de cases repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly preopRepo: PeriopPreopRepository,
    private readonly casesRepo: PeriopCasesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PeriopPreopService.name);
  }

  /**
   * UC-53-03: valorar al paciente y calcular sus puntuaciones de riesgo. Las
   * puntuaciones son inmutables: se conservan con el modelo y su versión, para
   * que años después se sepa con qué se decidió.
   */
  async createAssessment(
    caseId: string,
    dto: CreatePreopAssessmentDto,
    actor: AuthenticatedUser,
  ): Promise<PreopAssessmentResponseDto> {
    this.logger.info(
      { operation: 'periop.preop.assess', caseId, fitness: dto.fitnessStatus },
      'Recording preoperative assessment',
    );

    // Valorar sin revisar alergias ni medicación deja fuera lo que más veces
    // provoca un incidente en quirófano.
    if (!dto.allergiesReviewed || !dto.medicationsReviewed) {
      throw new PreconditionFailedException(
        'La valoración exige revisar alergias y medicación',
        { caseId },
      );
    }

    return this.em.transactional(async (tx) => {
      const surgicalCase = await this.casesRepo.findCaseForUpdate(tx, caseId);
      if (!surgicalCase) {
        throw new ResourceNotFoundException('Caso quirúrgico no encontrado', {
          caseId,
        });
      }
      if (surgicalCase.statusConceptId === CONCEPTS.CASE_CANCELLED) {
        throw new PreconditionFailedException('El caso está cancelado', {
          caseId,
        });
      }

      const previous = await this.preopRepo.findAssessmentByCase(tx, caseId);
      if (previous) {
        throw new ConflictException(
          'El caso ya tiene valoración preoperatoria',
          {
            caseId,
            assessmentId: previous.id,
          },
        );
      }

      const assessment = this.preopRepo.createAssessment(tx, {
        procedureCaseId: caseId,
        assessmentTypeConceptId:
          dto.assessmentType === 'ANESTHESIA'
            ? CONCEPTS.PREOP_ASSESSMENT_ANESTHESIA
            : CONCEPTS.PREOP_ASSESSMENT_SURGICAL,
        assessedByProfileId: dto.assessedByProfileId,
        fitnessStatusConceptId: FITNESS_CONCEPT[dto.fitnessStatus],
        asaClassConceptId: dto.asaClass ? ASA_CONCEPT[dto.asaClass] : undefined,
        allergiesReviewed: dto.allergiesReviewed,
        medicationsReviewed: dto.medicationsReviewed,
        anticoagulationPlanText: dto.anticoagulationPlanText,
        fastingInstructionsText: dto.fastingInstructionsText,
        assessmentJson: dto.assessmentJson,
        statusConceptId: CONCEPTS.ASSESSMENT_COMPLETED,
        actorUserId: actor.id,
      });

      const riskScoreIds = (dto.riskScores ?? []).map(
        (score) =>
          this.preopRepo.createRiskScore(tx, {
            preoperativeAssessmentId: assessment.id,
            riskModelConceptId: RISK_MODEL_CONCEPT[score.model],
            modelVersion: score.modelVersion,
            scoreValue: score.scoreValue,
            riskCategoryConceptId: this.riskCategoryFor(score.scoreValue),
            inputsJson: score.inputsJson,
            interpretationText: score.interpretationText,
          }).id,
      );

      // Sólo un paciente apto alcanza el hito: declararlo despejado cuando no
      // lo está sería justo lo contrario de lo que el hito significa.
      let milestoneId: string | undefined;
      if (dto.fitnessStatus !== 'UNFIT') {
        const milestone = this.casesRepo.createMilestone(tx, {
          procedureCaseId: caseId,
          milestoneTypeConceptId: CONCEPTS.MILESTONE_PREOP_CLEARED,
          occurredAt: new Date(),
          statusConceptId: CONCEPTS.MILESTONE_REACHED,
          recordedByProfileId: dto.assessedByProfileId,
        });
        milestoneId = milestone.id;
      } else {
        this.logger.warn(
          { operation: 'periop.preop.assess', caseId },
          'Patient assessed as unfit for surgery',
        );
      }

      touch(surgicalCase, actor.id);

      return {
        id: assessment.id,
        fitnessStatusConceptId: FITNESS_CONCEPT[dto.fitnessStatus],
        riskScoreIds,
        milestoneId,
      };
    });
  }

  /**
   * UC-53-04: verificar órdenes preoperatorias. El caso pasa a listo sólo
   * cuando **todas** las obligatorias están verificadas: operar con una
   * pendiente es el riesgo que este paso existe para cerrar.
   */
  async verifyOrders(
    caseId: string,
    dto: VerifyOrdersDto,
    actor: AuthenticatedUser,
  ): Promise<VerifyOrdersResponseDto> {
    this.logger.info(
      {
        operation: 'periop.preop.verify-orders',
        caseId,
        orders: dto.orderIds.length,
      },
      'Verifying preoperative orders',
    );

    return this.em.transactional(async (tx) => {
      const surgicalCase = await this.casesRepo.findCaseForUpdate(tx, caseId);
      if (!surgicalCase) {
        throw new ResourceNotFoundException('Caso quirúrgico no encontrado', {
          caseId,
        });
      }
      if (surgicalCase.statusConceptId !== CONCEPTS.CASE_SCHEDULED) {
        throw new PreconditionFailedException(
          'Sólo un caso programado admite verificación de órdenes',
          { caseId, statusConceptId: surgicalCase.statusConceptId },
        );
      }

      const orders = await this.preopRepo.findOrdersByCaseForUpdate(tx, caseId);
      const byId = new Map(orders.map((o) => [o.id, o]));

      let verified = 0;
      for (const orderId of dto.orderIds) {
        const order = byId.get(orderId);
        if (!order) {
          throw new ResourceNotFoundException(
            'Orden preoperatoria no encontrada en el caso',
            {
              caseId,
              orderId,
            },
          );
        }
        if (order.statusConceptId === CONCEPTS.ORDER_VERIFIED) continue;
        order.statusConceptId = CONCEPTS.ORDER_VERIFIED;
        order.verifiedAt = new Date();
        order.verifiedByProfileId = dto.verifiedByProfileId;
        verified += 1;
      }

      const pendingMandatory = orders.filter(
        (o) => o.statusConceptId === CONCEPTS.ORDER_PENDING,
      ).length;

      let statusConceptId = surgicalCase.statusConceptId;
      if (pendingMandatory === 0 && orders.length > 0) {
        statusConceptId = CONCEPTS.CASE_READY_FOR_SURGERY;
        this.casesRepo.createStatusHistory(tx, {
          procedureCaseId: caseId,
          fromStatusConceptId: surgicalCase.statusConceptId,
          toStatusConceptId: statusConceptId,
          changedByUserId: actor.id,
          reasonText: 'Órdenes preoperatorias verificadas',
        });
        surgicalCase.statusConceptId = statusConceptId;
      }
      touch(surgicalCase, actor.id);

      return {
        procedureCaseId: caseId,
        verified,
        pendingMandatory,
        statusConceptId,
      };
    });
  }

  /**
   * UC-53-05: responder una fase del checklist quirúrgico. Las respuestas son
   * inmutables y la fase sólo se marca completa cuando todos sus ítems
   * obligatorios tienen respuesta.
   */
  async submitChecklistPhase(
    caseId: string,
    checklistId: string,
    dto: SubmitChecklistPhaseDto,
    actor: AuthenticatedUser,
  ): Promise<ChecklistPhaseResponseDto> {
    this.logger.info(
      { operation: 'periop.checklist.phase', caseId, phase: dto.phase },
      'Recording safety checklist phase',
    );

    for (const response of dto.responses) {
      // Marcar una excepción sin decir por qué vacía el propósito del checklist.
      if (response.status === 'EXCEPTION' && !response.exceptionReason) {
        throw new PreconditionFailedException(
          'Una respuesta de excepción necesita justificación',
          {
            itemId: response.itemId,
          },
        );
      }
    }

    return this.em.transactional(async (tx) => {
      const checklist = await this.preopRepo.findChecklistForUpdate(
        tx,
        checklistId,
      );
      if (!checklist) {
        throw new ResourceNotFoundException('Checklist no encontrado', {
          checklistId,
        });
      }
      if (checklist.procedureCaseId !== caseId) {
        throw new PreconditionFailedException(
          'El checklist pertenece a otro caso',
          {
            caseId,
            checklistId,
          },
        );
      }
      if (checklist.statusConceptId === CONCEPTS.CHECKLIST_COMPLETED) {
        throw new ConflictException('El checklist ya está completo', {
          checklistId,
        });
      }
      if (this.phaseCompletedAt(checklist, dto.phase)) {
        throw new ConflictException('La fase ya está completa', {
          checklistId,
          phase: dto.phase,
        });
      }

      const items = await this.preopRepo.findItemsByPhase(
        tx,
        checklist.checklistTypeConceptId,
        checklist.checklistVersion,
        PHASE_CONCEPT[dto.phase],
        CONCEPTS.STATE_ACTIVE,
      );
      if (items.length === 0) {
        throw new PreconditionFailedException(
          'La fase no tiene ítems definidos',
          {
            checklistId,
            phase: dto.phase,
          },
        );
      }
      const itemIds = new Set(items.map((i) => i.id));

      let recorded = 0;
      for (const response of dto.responses) {
        if (!itemIds.has(response.itemId)) {
          throw new PreconditionFailedException(
            'El ítem no pertenece a esta fase',
            {
              checklistId,
              itemId: response.itemId,
            },
          );
        }
        this.preopRepo.createResponse(tx, {
          surgicalSafetyChecklistId: checklistId,
          surgicalSafetyItemId: response.itemId,
          responseStatusConceptId: RESPONSE_STATUS_CONCEPT[response.status],
          responseBoolean: response.responseBoolean,
          responseText: response.responseText,
          respondedByProfileId: dto.respondedByProfileId,
          exceptionReason: response.exceptionReason,
        });
        recorded += 1;
      }

      const allResponses = await this.preopRepo.findResponsesByChecklist(
        tx,
        checklistId,
      );
      const answered = new Set([
        ...allResponses.map((r) => r.surgicalSafetyItemId),
        ...dto.responses.map((r) => r.itemId),
      ]);
      const mandatoryPending = items.filter(
        (i) => i.isMandatory && !answered.has(i.id),
      );
      const phaseCompleted = mandatoryPending.length === 0;

      let milestoneId: string | undefined;
      if (phaseCompleted) {
        const now = new Date();
        if (dto.phase === 'SIGN_IN') checklist.signInCompletedAt = now;
        if (dto.phase === 'TIME_OUT') {
          checklist.timeOutCompletedAt = now;
          // El time-out es el hito que autoriza empezar a operar.
          const milestone = this.casesRepo.createMilestone(tx, {
            procedureCaseId: caseId,
            milestoneTypeConceptId: CONCEPTS.MILESTONE_TIME_OUT,
            occurredAt: now,
            statusConceptId: CONCEPTS.MILESTONE_REACHED,
            recordedByProfileId: dto.respondedByProfileId,
          });
          milestoneId = milestone.id;
        }
        if (dto.phase === 'SIGN_OUT') checklist.signOutCompletedAt = now;

        if (
          checklist.signInCompletedAt &&
          checklist.timeOutCompletedAt &&
          checklist.signOutCompletedAt
        ) {
          checklist.statusConceptId = CONCEPTS.CHECKLIST_COMPLETED;
        }
      }
      checklist.updatedAt = new Date();

      return {
        checklistId,
        recorded,
        phaseCompleted,
        statusConceptId: checklist.statusConceptId,
        milestoneId,
      };
    });
  }

  /**
   * UC-53-06: registrar el plan de anestesia con su valoración de vía aérea.
   * Anticipar vía aérea difícil obliga a declarar el plan de rescate.
   */
  async createAnesthesiaPlan(
    caseId: string,
    dto: CreateAnesthesiaPlanDto,
    actor: AuthenticatedUser,
  ): Promise<AnesthesiaPlanResponseDto> {
    this.logger.info(
      {
        operation: 'periop.anesthesia.plan',
        caseId,
        anesthesiaType: dto.anesthesiaType,
      },
      'Drafting anesthesia plan',
    );

    if (
      dto.airwayAssessment.difficultAirwayExpected &&
      !dto.airwayAssessment.rescuePlanText
    ) {
      throw new PreconditionFailedException(
        'Una vía aérea difícil anticipada necesita plan de rescate',
        { caseId },
      );
    }

    return this.em.transactional(async (tx) => {
      const surgicalCase = await this.casesRepo.findCaseForUpdate(tx, caseId);
      if (!surgicalCase) {
        throw new ResourceNotFoundException('Caso quirúrgico no encontrado', {
          caseId,
        });
      }
      if (surgicalCase.statusConceptId === CONCEPTS.CASE_CANCELLED) {
        throw new PreconditionFailedException('El caso está cancelado', {
          caseId,
        });
      }

      const previous = await this.preopRepo.findAnesthesiaPlanByCase(
        tx,
        caseId,
      );
      if (previous) {
        throw new ConflictException('El caso ya tiene plan de anestesia', {
          caseId,
          planId: previous.id,
        });
      }

      const plan = this.preopRepo.createAnesthesiaPlan(tx, {
        procedureCaseId: caseId,
        anesthesiologistProfileId: dto.anesthesiologistProfileId,
        anesthesiaTypeConceptId: ANESTHESIA_TYPE_CONCEPT[dto.anesthesiaType],
        airwayPlanConceptId: dto.airwayPlan
          ? AIRWAY_PLAN_CONCEPT[dto.airwayPlan]
          : undefined,
        monitoringPlanJson: dto.monitoringPlanJson,
        medicationsPlanJson: dto.medicationsPlanJson,
        postoperativeAnalgesiaPlanText: dto.postoperativeAnalgesiaPlanText,
        statusConceptId: CONCEPTS.PLAN_DRAFT,
        actorUserId: actor.id,
      });

      const airway = this.preopRepo.createAirwayAssessment(tx, {
        anesthesiaPlanId: plan.id,
        assessedByProfileId: dto.airwayAssessment.assessedByProfileId,
        mallampatiConceptId: dto.airwayAssessment.mallampati
          ? MALLAMPATI_CONCEPT[dto.airwayAssessment.mallampati]
          : undefined,
        mouthOpeningMm: dto.airwayAssessment.mouthOpeningMm,
        thyromentalDistanceMm: dto.airwayAssessment.thyromentalDistanceMm,
        difficultAirwayExpected: dto.airwayAssessment.difficultAirwayExpected,
        rescuePlanText: dto.airwayAssessment.rescuePlanText,
      });

      if (dto.airwayAssessment.difficultAirwayExpected) {
        this.logger.warn(
          { operation: 'periop.anesthesia.plan', caseId },
          'Difficult airway anticipated for surgical case',
        );
      }

      return {
        id: plan.id,
        statusConceptId: CONCEPTS.PLAN_DRAFT,
        airwayAssessmentId: airway.id,
        difficultAirwayExpected: dto.airwayAssessment.difficultAirwayExpected,
      };
    });
  }

  /** UC-53-06: aprobar el plan y dejar al anestesiólogo asignado al caso. */
  async approveAnesthesiaPlan(
    caseId: string,
    planId: string,
    actor: AuthenticatedUser,
  ): Promise<ApprovePlanResponseDto> {
    this.logger.info(
      { operation: 'periop.anesthesia.approve', caseId, planId },
      'Approving anesthesia plan',
    );

    return this.em.transactional(async (tx) => {
      const plan = await this.preopRepo.findAnesthesiaPlanForUpdate(tx, planId);
      if (!plan) {
        throw new ResourceNotFoundException('Plan de anestesia no encontrado', {
          planId,
        });
      }
      if (plan.procedureCaseId !== caseId) {
        throw new PreconditionFailedException('El plan pertenece a otro caso', {
          caseId,
          planId,
        });
      }
      if (plan.statusConceptId === CONCEPTS.PLAN_APPROVED) {
        throw new ConflictException('El plan ya está aprobado', { planId });
      }

      const surgicalCase = await this.casesRepo.findCaseForUpdate(tx, caseId);
      if (!surgicalCase) {
        throw new ResourceNotFoundException('Caso quirúrgico no encontrado', {
          caseId,
        });
      }

      plan.statusConceptId = CONCEPTS.PLAN_APPROVED;
      plan.approvedAt = new Date();
      touch(plan, actor.id);

      surgicalCase.anesthesiologistProfileId = plan.anesthesiologistProfileId;
      touch(surgicalCase, actor.id);

      return {
        id: planId,
        statusConceptId: CONCEPTS.PLAN_APPROVED,
        anesthesiologistProfileId: plan.anesthesiologistProfileId,
      };
    });
  }

  /**
   * UC-53-07: anotar un evento intraoperatorio de anestesia. Es un log
   * append-only, y la inducción y el despertar dejan además su hito.
   */
  async recordAnesthesiaEvent(
    caseId: string,
    dto: RecordAnesthesiaEventDto,
    actor: AuthenticatedUser,
  ): Promise<AnesthesiaEventResponseDto> {
    this.logger.info(
      {
        operation: 'periop.anesthesia.event',
        caseId,
        eventType: dto.eventType,
      },
      'Recording anesthesia event',
    );

    return this.em.transactional(async (tx) => {
      const surgicalCase = await this.casesRepo.findCaseForUpdate(tx, caseId);
      if (!surgicalCase) {
        throw new ResourceNotFoundException('Caso quirúrgico no encontrado', {
          caseId,
        });
      }
      if (surgicalCase.statusConceptId === CONCEPTS.CASE_CANCELLED) {
        throw new PreconditionFailedException('El caso está cancelado', {
          caseId,
        });
      }

      const plan = await this.preopRepo.findAnesthesiaPlanByCase(tx, caseId);
      // Inducir anestesia sin plan aprobado es exactamente lo que el paso de
      // aprobación existe para impedir.
      if (
        dto.eventType === 'INDUCTION' &&
        plan?.statusConceptId !== CONCEPTS.PLAN_APPROVED
      ) {
        throw new PreconditionFailedException(
          'La inducción exige un plan de anestesia aprobado',
          { caseId },
        );
      }

      const severity = dto.severity ?? 'ROUTINE';
      const event = this.preopRepo.createAnesthesiaEvent(tx, {
        procedureCaseId: caseId,
        anesthesiaPlanId: plan?.id,
        occurredAt: new Date(dto.occurredAt),
        eventTypeConceptId: ANESTHESIA_EVENT_CONCEPT[dto.eventType],
        medicationAdministrationId: dto.medicationAdministrationId,
        observationId: dto.observationId,
        deviceId: dto.deviceId,
        performedByProfileId: dto.performedByProfileId,
        detailsJson: dto.detailsJson,
        severityConceptId: SEVERITY_CONCEPT[severity],
      });

      if (severity === 'MAJOR' || severity === 'CRITICAL') {
        this.logger.warn(
          {
            operation: 'periop.anesthesia.event',
            caseId,
            eventType: dto.eventType,
            severity,
          },
          'Severe anesthesia event recorded',
        );
      }

      let milestoneId: string | undefined;
      const milestoneType = EVENT_MILESTONE[dto.eventType];
      if (milestoneType) {
        const existing = await this.casesRepo.findMilestone(
          tx,
          caseId,
          milestoneType,
        );
        if (!existing) {
          const milestone = this.casesRepo.createMilestone(tx, {
            procedureCaseId: caseId,
            milestoneTypeConceptId: milestoneType,
            occurredAt: new Date(dto.occurredAt),
            statusConceptId: CONCEPTS.MILESTONE_REACHED,
            recordedByProfileId: dto.performedByProfileId,
          });
          milestoneId = milestone.id;
        }
      }

      // La inducción marca el inicio real del caso.
      if (dto.eventType === 'INDUCTION' && !surgicalCase.actualStartAt) {
        surgicalCase.actualStartAt = new Date(dto.occurredAt);
        surgicalCase.statusConceptId = CONCEPTS.SURGICAL_CASE_IN_PROGRESS;
        this.casesRepo.createStatusHistory(tx, {
          procedureCaseId: caseId,
          fromStatusConceptId: CONCEPTS.CASE_READY_FOR_SURGERY,
          toStatusConceptId: CONCEPTS.SURGICAL_CASE_IN_PROGRESS,
          changedByUserId: actor.id,
          reasonText: 'Inducción anestésica',
        });
        if (surgicalCase.operatingRoomId) {
          this.casesRepo.createUtilizationEvent(tx, {
            operatingRoomId: surgicalCase.operatingRoomId,
            procedureCaseId: caseId,
            eventTypeConceptId: CONCEPTS.OR_EVENT_CASE_START,
            recordedByUserId: actor.id,
          });
        }
        touch(surgicalCase, actor.id);
      }

      return {
        id: event.id,
        eventTypeConceptId: ANESTHESIA_EVENT_CONCEPT[dto.eventType],
        milestoneId,
      };
    });
  }

  // --- Apoyo ---

  /** Categoría de riesgo derivada de la puntuación, en la escala del modelo. */
  private riskCategoryFor(scoreValue: string): string {
    const value = Number(scoreValue);
    if (value <= 1) return CONCEPTS.RISK_CATEGORY_LOW;
    if (value <= 3) return CONCEPTS.RISK_CATEGORY_MODERATE;
    return CONCEPTS.RISK_CATEGORY_HIGH;
  }

  /**
   * Ejecuta la operación phase completed at.
   *
   * @param checklist - Valor de checklist requerido por la operación.
   * @param phase - Valor de phase requerido por la operación.
   * @returns Resultado de phase completed at conforme al contrato `Date | undefined`.
   */
  private phaseCompletedAt(
    checklist: {
      /**
       * Valor de sign in completed at mantenido por la instancia.
       */
      signInCompletedAt?: Date;
      /**
       * Valor de time out completed at mantenido por la instancia.
       */
      timeOutCompletedAt?: Date;
      /**
       * Valor de sign out completed at mantenido por la instancia.
       */
      signOutCompletedAt?: Date;
    },
    phase: ChecklistPhase,
  ): Date | undefined {
    if (phase === 'SIGN_IN') return checklist.signInCompletedAt;
    if (phase === 'TIME_OUT') return checklist.timeOutCompletedAt;
    return checklist.signOutCompletedAt;
  }
}
