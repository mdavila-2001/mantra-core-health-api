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

/**
 * Describe el contrato estructural de create case data.
 */
export interface CreateCaseData {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId: string;
  /**
   * Identificador asociado a encounter.
   */
  encounterId?: string;
  /**
   * Identificador asociado a service request.
   */
  serviceRequestId?: string;
  /**
   * Identificador asociado a primary procedure.
   */
  primaryProcedureId?: string;
  /**
   * Valor de case number mantenido por la instancia.
   */
  caseNumber: string;
  /**
   * Identificador asociado a case type concept.
   */
  caseTypeConceptId: string;
  /**
   * Identificador asociado a priority concept.
   */
  priorityConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a surgical specialty concept.
   */
  surgicalSpecialtyConceptId?: string;
  /**
   * Identificador asociado a requested by profile.
   */
  requestedByProfileId?: string;
  /**
   * Identificador asociado a primary surgeon profile.
   */
  primarySurgeonProfileId?: string;
  /**
   * Identificador asociado a practice site.
   */
  practiceSiteId?: string;
  /**
   * Identificador asociado a operating room.
   */
  operatingRoomId?: string;
  /**
   * Valor de scheduled start at mantenido por la instancia.
   */
  scheduledStartAt?: Date;
  /**
   * Valor de scheduled end at mantenido por la instancia.
   */
  scheduledEndAt?: Date;
  /**
   * Valor de urgency reason text mantenido por la instancia.
   */
  urgencyReasonText?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create charge item data.
 */
export interface CreateChargeItemData {
  /**
   * Identificador asociado a procedure case.
   */
  procedureCaseId: string;
  /**
   * Identificador asociado a procedure.
   */
  procedureId?: string;
  /**
   * Identificador asociado a charge item type concept.
   */
  chargeItemTypeConceptId: string;
  /**
   * Identificador asociado a billable item.
   */
  billableItemId: string;
  /**
   * Valor de quantity mantenido por la instancia.
   */
  quantity: string;
  /**
   * Valor de unit price mantenido por la instancia.
   */
  unitPrice?: string;
  /**
   * Valor de currency code mantenido por la instancia.
   */
  currencyCode?: string;
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
 * Acceso al caso quirúrgico y su gobierno: estado, hitos, diagnósticos, equipo,
 * ubicaciones, uso de quirófano, cancelaciones y cargos.
 */
@Injectable()
export class PeriopCasesRepository {
  // --- Caso (UC-53-01, UC-53-13) ---

  /**
   * Crea create case.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create case conforme al contrato `ProcedureCases`.
   */
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

  /**
   * Obtiene find case by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find case by id conforme al contrato `Promise<ProcedureCases | null>`.
   */
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

  /**
   * Obtiene find case by number.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param caseNumber - Valor de case number requerido por la operación.
   * @returns Resultado de find case by number conforme al contrato `Promise<ProcedureCases | null>`.
   */
  findCaseByNumber(
    em: EntityManager,
    caseNumber: string,
  ): Promise<ProcedureCases | null> {
    return em.findOne(ProcedureCases, { caseNumber });
  }

  /**
   * Ejecuta la operación count cases.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param custodianTenantId - Identificador de custodian tenant.
   * @returns Resultado de count cases conforme al contrato `Promise<number>`.
   */
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
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId: string;
      /**
       * Identificador asociado a from status concept.
       */
      fromStatusConceptId: string;
      /**
       * Identificador asociado a to status concept.
       */
      toStatusConceptId: string;
      /**
       * Identificador asociado a changed by user.
       */
      changedByUserId: string;
      /**
       * Identificador asociado a reason concept.
       */
      reasonConceptId?: string;
      /**
       * Valor de reason text mantenido por la instancia.
       */
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

  /**
   * Crea create milestone.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create milestone conforme al contrato `ProcedureCaseMilestones`.
   */
  createMilestone(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId: string;
      /**
       * Identificador asociado a milestone type concept.
       */
      milestoneTypeConceptId: string;
      /**
       * Valor de planned at mantenido por la instancia.
       */
      plannedAt?: Date;
      /**
       * Valor de occurred at mantenido por la instancia.
       */
      occurredAt?: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a recorded by profile.
       */
      recordedByProfileId?: string;
      /**
       * Valor de notes mantenido por la instancia.
       */
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

  /**
   * Obtiene find milestone.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param procedureCaseId - Identificador de procedure case.
   * @param milestoneTypeConceptId - Identificador de milestone type concept.
   * @returns Resultado de find milestone conforme al contrato `Promise<ProcedureCaseMilestones | null>`.
   */
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

  /**
   * Crea create diagnosis.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create diagnosis conforme al contrato `ProcedureCaseDiagnoses`.
   */
  createDiagnosis(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId: string;
      /**
       * Identificador asociado a condition.
       */
      conditionId: string;
      /**
       * Identificador asociado a diagnosis role concept.
       */
      diagnosisRoleConceptId: string;
      /**
       * Valor de sequence number mantenido por la instancia.
       */
      sequenceNumber: number;
      /**
       * Valor de present on admission mantenido por la instancia.
       */
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

  /**
   * Obtiene find diagnoses by case.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param procedureCaseId - Identificador de procedure case.
   * @returns Resultado de find diagnoses by case conforme al contrato `Promise<ProcedureCaseDiagnoses[]>`.
   */
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

  /**
   * Crea create team member.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create team member conforme al contrato `ProcedureCaseTeamMembers`.
   */
  createTeamMember(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId: string;
      /**
       * Identificador asociado a practitioner profile.
       */
      practitionerProfileId: string;
      /**
       * Identificador asociado a team role concept.
       */
      teamRoleConceptId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Crea create location.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create location conforme al contrato `ProcedureCaseLocations`.
   */
  createLocation(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId: string;
      /**
       * Identificador asociado a care space.
       */
      careSpaceId: string;
      /**
       * Identificador asociado a location role concept.
       */
      locationRoleConceptId: string;
      /**
       * Valor de starts at mantenido por la instancia.
       */
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

  /**
   * Crea create utilization event.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create utilization event conforme al contrato `OperatingRoomUtilizationEvents`.
   */
  createUtilizationEvent(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a operating room.
       */
      operatingRoomId: string;
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId?: string;
      /**
       * Identificador asociado a event type concept.
       */
      eventTypeConceptId: string;
      /**
       * Valor de duration seconds mantenido por la instancia.
       */
      durationSeconds?: string;
      /**
       * Identificador asociado a delay reason concept.
       */
      delayReasonConceptId?: string;
      /**
       * Identificador asociado a turnover category concept.
       */
      turnoverCategoryConceptId?: string;
      /**
       * Identificador asociado a recorded by user.
       */
      recordedByUserId?: string;
      /**
       * Valor de details json mantenido por la instancia.
       */
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

  /**
   * Crea create cancellation.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create cancellation conforme al contrato `ProcedureCancellations`.
   */
  createCancellation(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId: string;
      /**
       * Identificador asociado a cancellation reason concept.
       */
      cancellationReasonConceptId: string;
      /**
       * Identificador asociado a cancellation category concept.
       */
      cancellationCategoryConceptId?: string;
      /**
       * Identificador asociado a cancelled by user.
       */
      cancelledByUserId?: string;
      /**
       * Identificador asociado a preventable concept.
       */
      preventableConceptId?: string;
      /**
       * Valor de explanation text mantenido por la instancia.
       */
      explanationText?: string;
      /**
       * Valor de reschedule required mantenido por la instancia.
       */
      rescheduleRequired: boolean;
      /**
       * Identificador asociado a replacement case.
       */
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

  /**
   * Crea create charge item.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create charge item conforme al contrato `ProcedureChargeItems`.
   */
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

  /**
   * Obtiene find charge items for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param procedureCaseId - Identificador de procedure case.
   * @returns Resultado de find charge items for update conforme al contrato `Promise<ProcedureChargeItems[]>`.
   */
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
