import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ProcedureCases,
  ProcedureCaseStatusHistory,
  ProcedureCaseMilestones,
  ProcedureCaseDiagnoses,
  ProcedureCaseTeamMembers,
  ProcedureCaseLocations,
  OperatingRoomUtilizationEvents,
  ProcedureCancellations,
  ProcedureChargeItems,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateCaseData {
  custodianTenantId: string;
  patientProfileId: string;
  encounterId?: string;
  serviceRequestId?: string;
  primaryProcedureId?: string;
  caseNumber: string;
  caseTypeConceptId: string;
  priorityConceptId: string;
  statusConceptId: string;
  surgicalSpecialtyConceptId?: string;
  requestedByProfileId?: string;
  primarySurgeonProfileId?: string;
  practiceSiteId?: string;
  operatingRoomId?: string;
  scheduledStartAt?: Date;
  scheduledEndAt?: Date;
  urgencyReasonText?: string;
  actorUserId?: string;
}

export interface CreateChargeItemData {
  procedureCaseId: string;
  procedureId?: string;
  chargeItemTypeConceptId: string;
  billableItemId: string;
  quantity: string;
  unitPrice?: string;
  currencyCode?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso al caso quirúrgico y su gobierno: estado, hitos, diagnósticos, equipo,
 * ubicaciones, uso de quirófano, cancelaciones y cargos.
 */
@Injectable()
export class PeriopCasesRepository {
  // --- Caso (UC-53-01, UC-53-13) ---

  createCase(em: EntityManager, data: CreateCaseData): ProcedureCases {
    return em.create(
      ProcedureCases,
      {
        custodianTenantId: data.custodianTenantId,
        patientProfileId: data.patientProfileId,
        encounterId: data.encounterId,
        serviceRequestId: data.serviceRequestId,
        primaryProcedureId: data.primaryProcedureId,
        caseNumber: data.caseNumber,
        caseTypeConceptId: data.caseTypeConceptId,
        priorityConceptId: data.priorityConceptId,
        statusConceptId: data.statusConceptId,
        surgicalSpecialtyConceptId: data.surgicalSpecialtyConceptId,
        requestedByProfileId: data.requestedByProfileId,
        primarySurgeonProfileId: data.primarySurgeonProfileId,
        practiceSiteId: data.practiceSiteId,
        operatingRoomId: data.operatingRoomId,
        scheduledStartAt: data.scheduledStartAt,
        scheduledEndAt: data.scheduledEndAt,
        urgencyReasonText: data.urgencyReasonText,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findCaseById(em: EntityManager, id: string): Promise<ProcedureCases | null> {
    return em.findOne(ProcedureCases, { id });
  }

  /** Toda transición de estado del caso se hace con la fila bloqueada. */
  findCaseForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ProcedureCases | null> {
    return em.findOne(
      ProcedureCases,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  findCaseByNumber(
    em: EntityManager,
    caseNumber: string,
  ): Promise<ProcedureCases | null> {
    return em.findOne(ProcedureCases, { caseNumber });
  }

  countCases(em: EntityManager, custodianTenantId: string): Promise<number> {
    return em.count(ProcedureCases, { custodianTenantId });
  }

  /**
   * Casos que ocupan el quirófano en un rango. Reservar un quirófano ya ocupado
   * es el error que esta consulta existe para evitar.
   */
  findOverlappingCases(
    em: EntityManager,
    operatingRoomId: string,
    from: Date,
    to: Date,
    blockingStatusConceptIds: string[],
  ): Promise<ProcedureCases[]> {
    return em.find(ProcedureCases, {
      operatingRoomId,
      statusConceptId: { $in: blockingStatusConceptIds },
      scheduledStartAt: { $lt: to },
      scheduledEndAt: { $gt: from },
    });
  }

  /** Historial de estado: log append-only de toda transición del caso. */
  createStatusHistory(
    em: EntityManager,
    data: {
      procedureCaseId: string;
      fromStatusConceptId: string;
      toStatusConceptId: string;
      changedByUserId: string;
      reasonConceptId?: string;
      reasonText?: string;
    },
  ): ProcedureCaseStatusHistory {
    return em.create(
      ProcedureCaseStatusHistory,
      {
        procedureCaseId: data.procedureCaseId,
        fromStatusConceptId: data.fromStatusConceptId,
        toStatusConceptId: data.toStatusConceptId,
        changedAt: new Date(),
        changedByUserId: data.changedByUserId,
        reasonConceptId: data.reasonConceptId,
        reasonText: data.reasonText,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  // --- Hitos (UC-53-01, 03, 04, 05, 07) ---

  createMilestone(
    em: EntityManager,
    data: {
      procedureCaseId: string;
      milestoneTypeConceptId: string;
      plannedAt?: Date;
      occurredAt?: Date;
      statusConceptId: string;
      recordedByProfileId?: string;
      notes?: string;
    },
  ): ProcedureCaseMilestones {
    return em.create(
      ProcedureCaseMilestones,
      {
        procedureCaseId: data.procedureCaseId,
        milestoneTypeConceptId: data.milestoneTypeConceptId,
        plannedAt: data.plannedAt,
        occurredAt: data.occurredAt,
        statusConceptId: data.statusConceptId,
        recordedByProfileId: data.recordedByProfileId,
        notes: data.notes,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  findMilestone(
    em: EntityManager,
    procedureCaseId: string,
    milestoneTypeConceptId: string,
  ): Promise<ProcedureCaseMilestones | null> {
    return em.findOne(ProcedureCaseMilestones, {
      procedureCaseId,
      milestoneTypeConceptId,
    });
  }

  // --- Diagnósticos y equipo (UC-53-02) ---

  createDiagnosis(
    em: EntityManager,
    data: {
      procedureCaseId: string;
      conditionId: string;
      diagnosisRoleConceptId: string;
      sequenceNumber: number;
      presentOnAdmission: boolean;
    },
  ): ProcedureCaseDiagnoses {
    return em.create(
      ProcedureCaseDiagnoses,
      {
        procedureCaseId: data.procedureCaseId,
        conditionId: data.conditionId,
        diagnosisRoleConceptId: data.diagnosisRoleConceptId,
        sequenceNumber: data.sequenceNumber,
        presentOnAdmission: data.presentOnAdmission,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  findDiagnosesByCase(
    em: EntityManager,
    procedureCaseId: string,
  ): Promise<ProcedureCaseDiagnoses[]> {
    return em.find(
      ProcedureCaseDiagnoses,
      { procedureCaseId },
      { orderBy: { sequenceNumber: 'ASC' } },
    );
  }

  createTeamMember(
    em: EntityManager,
    data: {
      procedureCaseId: string;
      practitionerProfileId: string;
      teamRoleConceptId: string;
      statusConceptId: string;
      actorUserId?: string;
    },
  ): ProcedureCaseTeamMembers {
    return em.create(
      ProcedureCaseTeamMembers,
      {
        procedureCaseId: data.procedureCaseId,
        practitionerProfileId: data.practitionerProfileId,
        teamRoleConceptId: data.teamRoleConceptId,
        assignedAt: new Date(),
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Equipo del caso: de aquí sale si el rol ya está cubierto. */
  findTeamByCase(
    em: EntityManager,
    procedureCaseId: string,
  ): Promise<ProcedureCaseTeamMembers[]> {
    return em.find(ProcedureCaseTeamMembers, { procedureCaseId });
  }

  // --- Ubicaciones (UC-53-12) ---

  createLocation(
    em: EntityManager,
    data: {
      procedureCaseId: string;
      careSpaceId: string;
      locationRoleConceptId: string;
      startsAt: Date;
    },
  ): ProcedureCaseLocations {
    return em.create(
      ProcedureCaseLocations,
      {
        procedureCaseId: data.procedureCaseId,
        careSpaceId: data.careSpaceId,
        locationRoleConceptId: data.locationRoleConceptId,
        startsAt: data.startsAt,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Ubicación abierta del caso: cerrarla es lo que da la estancia real. */
  findOpenLocation(
    em: EntityManager,
    procedureCaseId: string,
    locationRoleConceptId: string,
  ): Promise<ProcedureCaseLocations | null> {
    return em.findOne(ProcedureCaseLocations, {
      procedureCaseId,
      locationRoleConceptId,
      endsAt: null,
    });
  }

  // --- Uso de quirófano (UC-53-01, 13, 14) ---

  createUtilizationEvent(
    em: EntityManager,
    data: {
      operatingRoomId: string;
      procedureCaseId?: string;
      eventTypeConceptId: string;
      durationSeconds?: string;
      delayReasonConceptId?: string;
      turnoverCategoryConceptId?: string;
      recordedByUserId?: string;
      detailsJson?: unknown;
    },
  ): OperatingRoomUtilizationEvents {
    return em.create(
      OperatingRoomUtilizationEvents,
      {
        operatingRoomId: data.operatingRoomId,
        procedureCaseId: data.procedureCaseId,
        eventTypeConceptId: data.eventTypeConceptId,
        occurredAt: new Date(),
        durationSeconds: data.durationSeconds,
        delayReasonConceptId: data.delayReasonConceptId,
        turnoverCategoryConceptId: data.turnoverCategoryConceptId,
        recordedByUserId: data.recordedByUserId,
        detailsJson: data.detailsJson,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  // --- Cancelación (UC-53-13) ---

  createCancellation(
    em: EntityManager,
    data: {
      procedureCaseId: string;
      cancellationReasonConceptId: string;
      cancellationCategoryConceptId?: string;
      cancelledByUserId?: string;
      preventableConceptId?: string;
      explanationText?: string;
      rescheduleRequired: boolean;
      replacementCaseId?: string;
    },
  ): ProcedureCancellations {
    return em.create(
      ProcedureCancellations,
      {
        procedureCaseId: data.procedureCaseId,
        cancelledAt: new Date(),
        cancellationReasonConceptId: data.cancellationReasonConceptId,
        cancellationCategoryConceptId: data.cancellationCategoryConceptId,
        cancelledByUserId: data.cancelledByUserId,
        preventableConceptId: data.preventableConceptId,
        explanationText: data.explanationText,
        rescheduleRequired: data.rescheduleRequired,
        replacementCaseId: data.replacementCaseId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  // --- Cargos (UC-53-14) ---

  createChargeItem(
    em: EntityManager,
    data: CreateChargeItemData,
  ): ProcedureChargeItems {
    return em.create(
      ProcedureChargeItems,
      {
        procedureCaseId: data.procedureCaseId,
        procedureId: data.procedureId,
        chargeItemTypeConceptId: data.chargeItemTypeConceptId,
        billableItemId: data.billableItemId,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        currencyCode: data.currencyCode,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Cargos del caso: de aquí sale si el periodo ya se facturó. */
  findChargeItemsByCase(
    em: EntityManager,
    procedureCaseId: string,
  ): Promise<ProcedureChargeItems[]> {
    return em.find(ProcedureChargeItems, { procedureCaseId });
  }

  findChargeItemsForUpdate(
    em: EntityManager,
    procedureCaseId: string,
  ): Promise<ProcedureChargeItems[]> {
    return em.find(
      ProcedureChargeItems,
      { procedureCaseId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }
}
