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

export interface CreatePreopAssessmentData {
  procedureCaseId: string;
  assessmentTypeConceptId: string;
  assessedByProfileId: string;
  fitnessStatusConceptId: string;
  asaClassConceptId?: string;
  airwayClassConceptId?: string;
  bleedingRiskConceptId?: string;
  allergiesReviewed: boolean;
  medicationsReviewed: boolean;
  anticoagulationPlanText?: string;
  fastingInstructionsText?: string;
  assessmentJson?: unknown;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateAnesthesiaPlanData {
  procedureCaseId: string;
  anesthesiologistProfileId: string;
  anesthesiaTypeConceptId: string;
  techniqueConceptId?: string;
  airwayPlanConceptId?: string;
  monitoringPlanJson?: unknown;
  medicationsPlanJson?: unknown;
  postoperativeAnalgesiaPlanText?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a la fase preoperatoria: valoración, puntuaciones de riesgo, órdenes,
 * checklist de seguridad y plan de anestesia con sus eventos.
 */
@Injectable()
export class PeriopPreopRepository {
  // --- Valoración preoperatoria (UC-53-03) ---

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
      preoperativeAssessmentId: string;
      riskModelConceptId: string;
      modelVersion: string;
      scoreValue: string;
      riskCategoryConceptId?: string;
      inputsJson?: unknown;
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

  createOrder(
    em: EntityManager,
    data: {
      procedureCaseId: string;
      serviceRequestId: string;
      orderRoleConceptId: string;
      requiredBeforeMilestoneConceptId: string;
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

  createChecklist(
    em: EntityManager,
    data: {
      procedureCaseId: string;
      checklistTypeConceptId: string;
      checklistVersion: string;
      statusConceptId: string;
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
      surgicalSafetyChecklistId: string;
      surgicalSafetyItemId: string;
      responseStatusConceptId: string;
      responseBoolean?: boolean;
      responseText?: string;
      respondedByProfileId?: string;
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
      anesthesiaPlanId: string;
      assessedByProfileId: string;
      mallampatiConceptId?: string;
      mouthOpeningMm?: string;
      thyromentalDistanceMm?: string;
      difficultAirwayExpected: boolean;
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
      procedureCaseId: string;
      anesthesiaPlanId?: string;
      occurredAt: Date;
      eventTypeConceptId: string;
      medicationAdministrationId?: string;
      observationId?: string;
      deviceId?: string;
      performedByProfileId?: string;
      detailsJson?: unknown;
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
