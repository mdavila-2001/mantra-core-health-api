import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PreoperativeAssessments,
  PreoperativeRiskScores,
  PreoperativeOrders,
  SurgicalSafetyChecklists,
  SurgicalSafetyItems,
  SurgicalSafetyResponses,
  AnesthesiaPlans,
  AnesthesiaAirwayAssessments,
  AnesthesiaEvents,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create preop assessment data.
 */
export interface CreatePreopAssessmentData {
  /**
   * Identificador asociado a procedure case.
   */
  procedureCaseId: string;
  /**
   * Identificador asociado a assessment type concept.
   */
  assessmentTypeConceptId: string;
  /**
   * Identificador asociado a assessed by profile.
   */
  assessedByProfileId: string;
  /**
   * Identificador asociado a fitness status concept.
   */
  fitnessStatusConceptId: string;
  /**
   * Identificador asociado a asa class concept.
   */
  asaClassConceptId?: string;
  /**
   * Identificador asociado a airway class concept.
   */
  airwayClassConceptId?: string;
  /**
   * Identificador asociado a bleeding risk concept.
   */
  bleedingRiskConceptId?: string;
  /**
   * Valor de allergies reviewed mantenido por la instancia.
   */
  allergiesReviewed: boolean;
  /**
   * Valor de medications reviewed mantenido por la instancia.
   */
  medicationsReviewed: boolean;
  /**
   * Valor de anticoagulation plan text mantenido por la instancia.
   */
  anticoagulationPlanText?: string;
  /**
   * Valor de fasting instructions text mantenido por la instancia.
   */
  fastingInstructionsText?: string;
  /**
   * Valor de assessment json mantenido por la instancia.
   */
  assessmentJson?: unknown;
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
 * Describe el contrato estructural de create anesthesia plan data.
 */
export interface CreateAnesthesiaPlanData {
  /**
   * Identificador asociado a procedure case.
   */
  procedureCaseId: string;
  /**
   * Identificador asociado a anesthesiologist profile.
   */
  anesthesiologistProfileId: string;
  /**
   * Identificador asociado a anesthesia type concept.
   */
  anesthesiaTypeConceptId: string;
  /**
   * Identificador asociado a technique concept.
   */
  techniqueConceptId?: string;
  /**
   * Identificador asociado a airway plan concept.
   */
  airwayPlanConceptId?: string;
  /**
   * Valor de monitoring plan json mantenido por la instancia.
   */
  monitoringPlanJson?: unknown;
  /**
   * Valor de medications plan json mantenido por la instancia.
   */
  medicationsPlanJson?: unknown;
  /**
   * Valor de postoperative analgesia plan text mantenido por la instancia.
   */
  postoperativeAnalgesiaPlanText?: string;
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
 * Acceso a la fase preoperatoria: valoración, puntuaciones de riesgo, órdenes,
 * checklist de seguridad y plan de anestesia con sus eventos.
 */
@Injectable()
export class PeriopPreopRepository {
  // --- Valoración preoperatoria (UC-53-03) ---

  /**
   * Crea create assessment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create assessment conforme al contrato `PreoperativeAssessments`.
   */
  createAssessment(
    em: EntityManager,
    data: CreatePreopAssessmentData,
  ): PreoperativeAssessments {
    return em.create(
      PreoperativeAssessments,
      {
        procedureCaseId: data.procedureCaseId,
        assessmentTypeConceptId: data.assessmentTypeConceptId,
        assessedByProfileId: data.assessedByProfileId,
        assessedAt: new Date(),
        fitnessStatusConceptId: data.fitnessStatusConceptId,
        asaClassConceptId: data.asaClassConceptId,
        airwayClassConceptId: data.airwayClassConceptId,
        bleedingRiskConceptId: data.bleedingRiskConceptId,
        allergiesReviewed: data.allergiesReviewed,
        medicationsReviewed: data.medicationsReviewed,
        anticoagulationPlanText: data.anticoagulationPlanText,
        fastingInstructionsText: data.fastingInstructionsText,
        assessmentJson: data.assessmentJson,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find assessment by case.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param procedureCaseId - Identificador de procedure case.
   * @returns Resultado de find assessment by case conforme al contrato `Promise<PreoperativeAssessments | null>`.
   */
  findAssessmentByCase(
    em: EntityManager,
    procedureCaseId: string,
  ): Promise<PreoperativeAssessments | null> {
    return em.findOne(PreoperativeAssessments, { procedureCaseId });
  }

  /** Puntuación de riesgo: inmutable, se calcula una vez y se conserva. */
  createRiskScore(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a preoperative assessment.
       */
      preoperativeAssessmentId: string;
      /**
       * Identificador asociado a risk model concept.
       */
      riskModelConceptId: string;
      /**
       * Valor de model version mantenido por la instancia.
       */
      modelVersion: string;
      /**
       * Valor de score value mantenido por la instancia.
       */
      scoreValue: string;
      /**
       * Identificador asociado a risk category concept.
       */
      riskCategoryConceptId?: string;
      /**
       * Valor de inputs json mantenido por la instancia.
       */
      inputsJson?: unknown;
      /**
       * Valor de interpretation text mantenido por la instancia.
       */
      interpretationText?: string;
    },
  ): PreoperativeRiskScores {
    return em.create(
      PreoperativeRiskScores,
      {
        preoperativeAssessmentId: data.preoperativeAssessmentId,
        riskModelConceptId: data.riskModelConceptId,
        modelVersion: data.modelVersion,
        scoreValue: data.scoreValue,
        riskCategoryConceptId: data.riskCategoryConceptId,
        inputsJson: data.inputsJson,
        interpretationText: data.interpretationText,
        calculatedAt: new Date(),
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  // --- Órdenes preoperatorias (UC-53-04) ---

  /**
   * Crea create order.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create order conforme al contrato `PreoperativeOrders`.
   */
  createOrder(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId: string;
      /**
       * Identificador asociado a service request.
       */
      serviceRequestId: string;
      /**
       * Identificador asociado a order role concept.
       */
      orderRoleConceptId: string;
      /**
       * Identificador asociado a required before milestone concept.
       */
      requiredBeforeMilestoneConceptId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
    },
  ): PreoperativeOrders {
    return em.create(
      PreoperativeOrders,
      {
        procedureCaseId: data.procedureCaseId,
        serviceRequestId: data.serviceRequestId,
        orderRoleConceptId: data.orderRoleConceptId,
        requiredBeforeMilestoneConceptId: data.requiredBeforeMilestoneConceptId,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Órdenes del caso, para lectura.
   *
   * Sin bloqueo, a diferencia de `findOrdersByCaseForUpdate`: consultar qué
   * queda pendiente antes de entrar a quirófano no debe frenar a quien esté
   * verificando otra orden en ese momento.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param procedureCaseId - Caso consultado.
   * @returns Las órdenes del caso.
   */
  findOrdersByCase(
    em: EntityManager,
    procedureCaseId: string,
  ): Promise<PreoperativeOrders[]> {
    return em.find(
      PreoperativeOrders,
      { procedureCaseId },
      { orderBy: { createdAt: 'ASC', id: 'ASC' } },
    );
  }

  /**
   * Órdenes del caso, bloqueadas: verificar una y decidir si el caso queda
   * listo para cirugía tiene que ver el conjunto completo sin cambios en medio.
   */
  findOrdersByCaseForUpdate(
    em: EntityManager,
    procedureCaseId: string,
  ): Promise<PreoperativeOrders[]> {
    return em.find(
      PreoperativeOrders,
      { procedureCaseId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Checklist de seguridad (UC-53-05) ---

  /**
   * Crea create checklist.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create checklist conforme al contrato `SurgicalSafetyChecklists`.
   */
  createChecklist(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId: string;
      /**
       * Identificador asociado a checklist type concept.
       */
      checklistTypeConceptId: string;
      /**
       * Valor de checklist version mantenido por la instancia.
       */
      checklistVersion: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a coordinator profile.
       */
      coordinatorProfileId?: string;
    },
  ): SurgicalSafetyChecklists {
    return em.create(
      SurgicalSafetyChecklists,
      {
        procedureCaseId: data.procedureCaseId,
        checklistTypeConceptId: data.checklistTypeConceptId,
        checklistVersion: data.checklistVersion,
        statusConceptId: data.statusConceptId,
        coordinatorProfileId: data.coordinatorProfileId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find checklist for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find checklist for update conforme al contrato `Promise<SurgicalSafetyChecklists | null>`.
   */
  findChecklistForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<SurgicalSafetyChecklists | null> {
    return em.findOne(
      SurgicalSafetyChecklists,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find checklist by case.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param procedureCaseId - Identificador de procedure case.
   * @returns Resultado de find checklist by case conforme al contrato `Promise<SurgicalSafetyChecklists | null>`.
   */
  findChecklistByCase(
    em: EntityManager,
    procedureCaseId: string,
  ): Promise<SurgicalSafetyChecklists | null> {
    return em.findOne(SurgicalSafetyChecklists, { procedureCaseId });
  }

  /** Ítems de la fase, en orden: son las preguntas que hay que responder. */
  findItemsByPhase(
    em: EntityManager,
    checklistTypeConceptId: string,
    checklistVersion: string,
    phaseConceptId: string,
    activeStateConceptId: string,
  ): Promise<SurgicalSafetyItems[]> {
    return em.find(
      SurgicalSafetyItems,
      {
        checklistTypeConceptId,
        checklistVersion,
        phaseConceptId,
        stateConceptId: activeStateConceptId,
      },
      { orderBy: { displayOrder: 'ASC' } },
    );
  }

  /**
   * Obtiene find item by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find item by id conforme al contrato `Promise<SurgicalSafetyItems | null>`.
   */
  findItemById(
    em: EntityManager,
    id: string,
  ): Promise<SurgicalSafetyItems | null> {
    return em.findOne(SurgicalSafetyItems, { id });
  }

  /** Respuesta inmutable: se anota, nunca se corrige. */
  createResponse(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a surgical safety checklist.
       */
      surgicalSafetyChecklistId: string;
      /**
       * Identificador asociado a surgical safety item.
       */
      surgicalSafetyItemId: string;
      /**
       * Identificador asociado a response status concept.
       */
      responseStatusConceptId: string;
      /**
       * Valor de response boolean mantenido por la instancia.
       */
      responseBoolean?: boolean;
      /**
       * Valor de response text mantenido por la instancia.
       */
      responseText?: string;
      /**
       * Identificador asociado a responded by profile.
       */
      respondedByProfileId?: string;
      /**
       * Valor de exception reason mantenido por la instancia.
       */
      exceptionReason?: string;
    },
  ): SurgicalSafetyResponses {
    return em.create(
      SurgicalSafetyResponses,
      {
        surgicalSafetyChecklistId: data.surgicalSafetyChecklistId,
        surgicalSafetyItemId: data.surgicalSafetyItemId,
        responseStatusConceptId: data.responseStatusConceptId,
        responseBoolean: data.responseBoolean,
        responseText: data.responseText,
        respondedByProfileId: data.respondedByProfileId,
        respondedAt: new Date(),
        exceptionReason: data.exceptionReason,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Respuestas del checklist: con ellas se sabe si la fase está completa. */
  findResponsesByChecklist(
    em: EntityManager,
    surgicalSafetyChecklistId: string,
  ): Promise<SurgicalSafetyResponses[]> {
    return em.find(SurgicalSafetyResponses, { surgicalSafetyChecklistId });
  }

  // --- Anestesia (UC-53-06, UC-53-07) ---

  /**
   * Crea create anesthesia plan.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create anesthesia plan conforme al contrato `AnesthesiaPlans`.
   */
  createAnesthesiaPlan(
    em: EntityManager,
    data: CreateAnesthesiaPlanData,
  ): AnesthesiaPlans {
    return em.create(
      AnesthesiaPlans,
      {
        procedureCaseId: data.procedureCaseId,
        anesthesiologistProfileId: data.anesthesiologistProfileId,
        anesthesiaTypeConceptId: data.anesthesiaTypeConceptId,
        techniqueConceptId: data.techniqueConceptId,
        airwayPlanConceptId: data.airwayPlanConceptId,
        monitoringPlanJson: data.monitoringPlanJson,
        medicationsPlanJson: data.medicationsPlanJson,
        postoperativeAnalgesiaPlanText: data.postoperativeAnalgesiaPlanText,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find anesthesia plan for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find anesthesia plan for update conforme al contrato `Promise<AnesthesiaPlans | null>`.
   */
  findAnesthesiaPlanForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<AnesthesiaPlans | null> {
    return em.findOne(
      AnesthesiaPlans,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find anesthesia plan by case.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param procedureCaseId - Identificador de procedure case.
   * @returns Resultado de find anesthesia plan by case conforme al contrato `Promise<AnesthesiaPlans | null>`.
   */
  findAnesthesiaPlanByCase(
    em: EntityManager,
    procedureCaseId: string,
  ): Promise<AnesthesiaPlans | null> {
    return em.findOne(AnesthesiaPlans, { procedureCaseId });
  }

  /** Valoración de vía aérea: inmutable, acompaña al plan. */
  createAirwayAssessment(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a anesthesia plan.
       */
      anesthesiaPlanId: string;
      /**
       * Identificador asociado a assessed by profile.
       */
      assessedByProfileId: string;
      /**
       * Identificador asociado a mallampati concept.
       */
      mallampatiConceptId?: string;
      /**
       * Valor de mouth opening mm mantenido por la instancia.
       */
      mouthOpeningMm?: string;
      /**
       * Valor de thyromental distance mm mantenido por la instancia.
       */
      thyromentalDistanceMm?: string;
      /**
       * Valor de difficult airway expected mantenido por la instancia.
       */
      difficultAirwayExpected: boolean;
      /**
       * Valor de rescue plan text mantenido por la instancia.
       */
      rescuePlanText?: string;
    },
  ): AnesthesiaAirwayAssessments {
    return em.create(
      AnesthesiaAirwayAssessments,
      {
        anesthesiaPlanId: data.anesthesiaPlanId,
        assessedAt: new Date(),
        assessedByProfileId: data.assessedByProfileId,
        mallampatiConceptId: data.mallampatiConceptId,
        mouthOpeningMm: data.mouthOpeningMm,
        thyromentalDistanceMm: data.thyromentalDistanceMm,
        difficultAirwayExpected: data.difficultAirwayExpected,
        rescuePlanText: data.rescuePlanText,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Evento intraoperatorio de anestesia: log append-only. */
  createAnesthesiaEvent(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId: string;
      /**
       * Identificador asociado a anesthesia plan.
       */
      anesthesiaPlanId?: string;
      /**
       * Valor de occurred at mantenido por la instancia.
       */
      occurredAt: Date;
      /**
       * Identificador asociado a event type concept.
       */
      eventTypeConceptId: string;
      /**
       * Identificador asociado a medication administration.
       */
      medicationAdministrationId?: string;
      /**
       * Identificador asociado a observation.
       */
      observationId?: string;
      /**
       * Identificador asociado a device.
       */
      deviceId?: string;
      /**
       * Identificador asociado a performed by profile.
       */
      performedByProfileId?: string;
      /**
       * Valor de details json mantenido por la instancia.
       */
      detailsJson?: unknown;
      /**
       * Identificador asociado a severity concept.
       */
      severityConceptId: string;
    },
  ): AnesthesiaEvents {
    return em.create(
      AnesthesiaEvents,
      {
        procedureCaseId: data.procedureCaseId,
        anesthesiaPlanId: data.anesthesiaPlanId,
        occurredAt: data.occurredAt,
        eventTypeConceptId: data.eventTypeConceptId,
        medicationAdministrationId: data.medicationAdministrationId,
        observationId: data.observationId,
        deviceId: data.deviceId,
        performedByProfileId: data.performedByProfileId,
        detailsJson: data.detailsJson,
        severityConceptId: data.severityConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }
}
