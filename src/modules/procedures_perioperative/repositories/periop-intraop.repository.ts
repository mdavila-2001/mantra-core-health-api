import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  OperativeSteps,
  OperativeFindings,
  ProcedureBodySites,
  ProcedureImplants,
  ImplantIdentifiers,
  ProcedureDevices,
  ProcedureMedicationUses,
  ProcedureSpecimens,
  OperativeReports,
  ProcedureComplications,
  PacuStays,
  PacuAssessments,
  PostoperativeOrders,
  PostoperativeFollowups,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create implant data.
 */
export interface CreateImplantData {
  /**
   * Identificador asociado a procedure case.
   */
  procedureCaseId: string;
  /**
   * Identificador asociado a procedure.
   */
  procedureId: string;
  /**
   * Identificador asociado a implant device.
   */
  implantDeviceId: string;
  /**
   * Identificador asociado a implant role concept.
   */
  implantRoleConceptId: string;
  /**
   * Identificador asociado a body site concept.
   */
  bodySiteConceptId?: string;
  /**
   * Identificador asociado a laterality concept.
   */
  lateralityConceptId?: string;
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
 * Describe el contrato estructural de create operative report data.
 */
export interface CreateOperativeReportData {
  /**
   * Identificador asociado a procedure case.
   */
  procedureCaseId: string;
  /**
   * Identificador asociado a procedure.
   */
  procedureId: string;
  /**
   * Valor de report version mantenido por la instancia.
   */
  reportVersion: number;
  /**
   * Identificador asociado a author profile.
   */
  authorProfileId: string;
  /**
   * Valor de preoperative diagnosis text mantenido por la instancia.
   */
  preoperativeDiagnosisText?: string;
  /**
   * Valor de postoperative diagnosis text mantenido por la instancia.
   */
  postoperativeDiagnosisText?: string;
  /**
   * Valor de procedure description mantenido por la instancia.
   */
  procedureDescription?: string;
  /**
   * Valor de findings text mantenido por la instancia.
   */
  findingsText?: string;
  /**
   * Valor de estimated blood loss ml mantenido por la instancia.
   */
  estimatedBloodLossMl?: string;
  /**
   * Valor de drains text mantenido por la instancia.
   */
  drainsText?: string;
  /**
   * Valor de complications text mantenido por la instancia.
   */
  complicationsText?: string;
  /**
   * Identificador asociado a disposition concept.
   */
  dispositionConceptId?: string;
  /**
   * Identificador asociado a file.
   */
  fileId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
}

/**
 * Acceso a la fase intra y postoperatoria: pasos, hallazgos, implantes,
 * dispositivos, medicación, muestras, reporte operatorio y PACU.
 */
@Injectable()
export class PeriopIntraopRepository {
  // --- Pasos y hallazgos (UC-53-08) ---

  /**
   * Crea create step.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create step conforme al contrato `OperativeSteps`.
   */
  createStep(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId: string;
      /**
       * Identificador asociado a procedure.
       */
      procedureId?: string;
      /**
       * Valor de step number mantenido por la instancia.
       */
      stepNumber: number;
      /**
       * Identificador asociado a step code concept.
       */
      stepCodeConceptId: string;
      /**
       * Valor de description mantenido por la instancia.
       */
      description: string;
      /**
       * Identificador asociado a performed by profile.
       */
      performedByProfileId?: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt?: Date;
      /**
       * Identificador asociado a body site concept.
       */
      bodySiteConceptId?: string;
      /**
       * Identificador asociado a laterality concept.
       */
      lateralityConceptId?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): OperativeSteps {
    return em.create(
      OperativeSteps,
      {
        procedureCaseId: data.procedureCaseId,
        procedureId: data.procedureId,
        stepNumber: data.stepNumber,
        stepCodeConceptId: data.stepCodeConceptId,
        description: data.description,
        performedByProfileId: data.performedByProfileId,
        startedAt: data.startedAt ?? new Date(),
        bodySiteConceptId: data.bodySiteConceptId,
        lateralityConceptId: data.lateralityConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find step by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find step by id conforme al contrato `Promise<OperativeSteps | null>`.
   */
  findStepById(em: EntityManager, id: string): Promise<OperativeSteps | null> {
    return em.findOne(OperativeSteps, { id });
  }

  /**
   * Obtiene find step for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find step for update conforme al contrato `Promise<OperativeSteps | null>`.
   */
  findStepForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<OperativeSteps | null> {
    return em.findOne(
      OperativeSteps,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Pasos del caso en orden de ejecución. */
  findStepsByCase(
    em: EntityManager,
    procedureCaseId: string,
  ): Promise<OperativeSteps[]> {
    return em.find(
      OperativeSteps,
      { procedureCaseId },
      { orderBy: { stepNumber: 'ASC' } },
    );
  }

  /** Hallazgo inmutable: lo que se vio en el quirófano no se reescribe. */
  createFinding(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId: string;
      /**
       * Identificador asociado a operative step.
       */
      operativeStepId?: string;
      /**
       * Identificador asociado a finding code concept.
       */
      findingCodeConceptId: string;
      /**
       * Valor de finding text mantenido por la instancia.
       */
      findingText: string;
      /**
       * Identificador asociado a body site concept.
       */
      bodySiteConceptId?: string;
      /**
       * Identificador asociado a laterality concept.
       */
      lateralityConceptId?: string;
      /**
       * Identificador asociado a severity concept.
       */
      severityConceptId?: string;
      /**
       * Identificador asociado a observation.
       */
      observationId?: string;
      /**
       * Identificador asociado a recorded by profile.
       */
      recordedByProfileId?: string;
    },
  ): OperativeFindings {
    return em.create(
      OperativeFindings,
      {
        procedureCaseId: data.procedureCaseId,
        operativeStepId: data.operativeStepId,
        findingCodeConceptId: data.findingCodeConceptId,
        findingText: data.findingText,
        bodySiteConceptId: data.bodySiteConceptId,
        lateralityConceptId: data.lateralityConceptId,
        severityConceptId: data.severityConceptId,
        observationId: data.observationId,
        recordedByProfileId: data.recordedByProfileId,
        recordedAt: new Date(),
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create body site.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create body site conforme al contrato `ProcedureBodySites`.
   */
  createBodySite(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure.
       */
      procedureId: string;
      /**
       * Identificador asociado a body site concept.
       */
      bodySiteConceptId: string;
      /**
       * Identificador asociado a laterality concept.
       */
      lateralityConceptId?: string;
      /**
       * Identificador asociado a role concept.
       */
      roleConceptId: string;
      /**
       * Valor de description mantenido por la instancia.
       */
      description?: string;
    },
  ): ProcedureBodySites {
    return em.create(
      ProcedureBodySites,
      {
        procedureId: data.procedureId,
        bodySiteConceptId: data.bodySiteConceptId,
        lateralityConceptId: data.lateralityConceptId,
        roleConceptId: data.roleConceptId,
        description: data.description,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find body site.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param procedureId - Identificador de procedure.
   * @param bodySiteConceptId - Identificador de body site concept.
   * @returns Resultado de find body site conforme al contrato `Promise<ProcedureBodySites | null>`.
   */
  findBodySite(
    em: EntityManager,
    procedureId: string,
    bodySiteConceptId: string,
  ): Promise<ProcedureBodySites | null> {
    return em.findOne(ProcedureBodySites, { procedureId, bodySiteConceptId });
  }

  // --- Implantes y dispositivos (UC-53-09) ---

  /**
   * Crea create implant.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create implant conforme al contrato `ProcedureImplants`.
   */
  createImplant(em: EntityManager, data: CreateImplantData): ProcedureImplants {
    return em.create(
      ProcedureImplants,
      {
        procedureCaseId: data.procedureCaseId,
        procedureId: data.procedureId,
        implantDeviceId: data.implantDeviceId,
        implantRoleConceptId: data.implantRoleConceptId,
        bodySiteConceptId: data.bodySiteConceptId,
        lateralityConceptId: data.lateralityConceptId,
        implantedAt: new Date(),
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Identificador del implante: UDI, lote o serie. Trazabilidad regulatoria. */
  createImplantIdentifier(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure implant.
       */
      procedureImplantId: string;
      /**
       * Identificador asociado a identifier type concept.
       */
      identifierTypeConceptId: string;
      /**
       * Valor de identifier value mantenido por la instancia.
       */
      identifierValue: string;
      /**
       * Valor de issuing system mantenido por la instancia.
       */
      issuingSystem?: string;
      /**
       * Valor de lot number mantenido por la instancia.
       */
      lotNumber?: string;
      /**
       * Valor de serial number mantenido por la instancia.
       */
      serialNumber?: string;
      /**
       * Valor de expiration date mantenido por la instancia.
       */
      expirationDate?: Date;
    },
  ): ImplantIdentifiers {
    return em.create(
      ImplantIdentifiers,
      {
        procedureImplantId: data.procedureImplantId,
        identifierTypeConceptId: data.identifierTypeConceptId,
        identifierValue: data.identifierValue,
        issuingSystem: data.issuingSystem,
        lotNumber: data.lotNumber,
        serialNumber: data.serialNumber,
        expirationDate: data.expirationDate,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create device.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create device conforme al contrato `ProcedureDevices`.
   */
  createDevice(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure.
       */
      procedureId: string;
      /**
       * Identificador asociado a device.
       */
      deviceId: string;
      /**
       * Identificador asociado a use role concept.
       */
      useRoleConceptId: string;
      /**
       * Valor de lot number mantenido por la instancia.
       */
      lotNumber?: string;
      /**
       * Valor de serial number mantenido por la instancia.
       */
      serialNumber?: string;
      /**
       * Valor de udi carrier mantenido por la instancia.
       */
      udiCarrier?: string;
    },
  ): ProcedureDevices {
    return em.create(
      ProcedureDevices,
      {
        procedureId: data.procedureId,
        deviceId: data.deviceId,
        useRoleConceptId: data.useRoleConceptId,
        lotNumber: data.lotNumber,
        serialNumber: data.serialNumber,
        udiCarrier: data.udiCarrier,
        usedAt: new Date(),
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  // --- Medicación y muestras (UC-53-10) ---

  /**
   * Crea create medication use.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create medication use conforme al contrato `ProcedureMedicationUses`.
   */
  createMedicationUse(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId: string;
      /**
       * Identificador asociado a procedure.
       */
      procedureId?: string;
      /**
       * Identificador asociado a medication administration.
       */
      medicationAdministrationId: string;
      /**
       * Identificador asociado a use role concept.
       */
      useRoleConceptId: string;
      /**
       * Identificador asociado a operative step.
       */
      operativeStepId?: string;
    },
  ): ProcedureMedicationUses {
    return em.create(
      ProcedureMedicationUses,
      {
        procedureCaseId: data.procedureCaseId,
        procedureId: data.procedureId,
        medicationAdministrationId: data.medicationAdministrationId,
        useRoleConceptId: data.useRoleConceptId,
        operativeStepId: data.operativeStepId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create specimen.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create specimen conforme al contrato `ProcedureSpecimens`.
   */
  createSpecimen(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId: string;
      /**
       * Identificador asociado a procedure.
       */
      procedureId: string;
      /**
       * Identificador asociado a specimen.
       */
      specimenId: string;
      /**
       * Identificador asociado a specimen role concept.
       */
      specimenRoleConceptId: string;
      /**
       * Identificador asociado a operative step.
       */
      operativeStepId?: string;
      /**
       * Identificador asociado a body site concept.
       */
      bodySiteConceptId?: string;
      /**
       * Valor de orientation text mantenido por la instancia.
       */
      orientationText?: string;
      /**
       * Valor de surgeon comment mantenido por la instancia.
       */
      surgeonComment?: string;
    },
  ): ProcedureSpecimens {
    return em.create(
      ProcedureSpecimens,
      {
        procedureCaseId: data.procedureCaseId,
        procedureId: data.procedureId,
        specimenId: data.specimenId,
        specimenRoleConceptId: data.specimenRoleConceptId,
        operativeStepId: data.operativeStepId,
        bodySiteConceptId: data.bodySiteConceptId,
        orientationText: data.orientationText,
        surgeonComment: data.surgeonComment,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  // --- Reporte operatorio (UC-53-11) ---

  /**
   * Crea create report.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create report conforme al contrato `OperativeReports`.
   */
  createReport(
    em: EntityManager,
    data: CreateOperativeReportData,
  ): OperativeReports {
    return em.create(
      OperativeReports,
      {
        procedureCaseId: data.procedureCaseId,
        procedureId: data.procedureId,
        reportVersion: data.reportVersion,
        authorProfileId: data.authorProfileId,
        authoredAt: new Date(),
        preoperativeDiagnosisText: data.preoperativeDiagnosisText,
        postoperativeDiagnosisText: data.postoperativeDiagnosisText,
        procedureDescription: data.procedureDescription,
        findingsText: data.findingsText,
        estimatedBloodLossMl: data.estimatedBloodLossMl,
        drainsText: data.drainsText,
        complicationsText: data.complicationsText,
        dispositionConceptId: data.dispositionConceptId,
        fileId: data.fileId,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find report for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find report for update conforme al contrato `Promise<OperativeReports | null>`.
   */
  findReportForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<OperativeReports | null> {
    return em.findOne(
      OperativeReports,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Última versión del reporte del caso: de ella sale el número siguiente. */
  findLastReport(
    em: EntityManager,
    procedureCaseId: string,
  ): Promise<OperativeReports | null> {
    return em.findOne(
      OperativeReports,
      { procedureCaseId },
      { orderBy: { reportVersion: 'DESC' } },
    );
  }

  /** Complicación inmutable, con su relación causal declarada. */
  createComplication(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId: string;
      /**
       * Identificador asociado a procedure.
       */
      procedureId?: string;
      /**
       * Identificador asociado a complication code concept.
       */
      complicationCodeConceptId: string;
      /**
       * Identificador asociado a severity concept.
       */
      severityConceptId: string;
      /**
       * Identificador asociado a relatedness concept.
       */
      relatednessConceptId: string;
      /**
       * Identificador asociado a condition.
       */
      conditionId?: string;
      /**
       * Valor de management text mantenido por la instancia.
       */
      managementText?: string;
      /**
       * Identificador asociado a reported by profile.
       */
      reportedByProfileId?: string;
    },
  ): ProcedureComplications {
    return em.create(
      ProcedureComplications,
      {
        procedureCaseId: data.procedureCaseId,
        procedureId: data.procedureId,
        complicationCodeConceptId: data.complicationCodeConceptId,
        onsetAt: new Date(),
        severityConceptId: data.severityConceptId,
        relatednessConceptId: data.relatednessConceptId,
        conditionId: data.conditionId,
        managementText: data.managementText,
        reportedByProfileId: data.reportedByProfileId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  // --- PACU (UC-53-12) ---

  /**
   * Crea create pacu stay.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create pacu stay conforme al contrato `PacuStays`.
   */
  createPacuStay(
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
       * Identificador asociado a admitted by profile.
       */
      admittedByProfileId?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): PacuStays {
    return em.create(
      PacuStays,
      {
        procedureCaseId: data.procedureCaseId,
        careSpaceId: data.careSpaceId,
        admittedAt: new Date(),
        admittedByProfileId: data.admittedByProfileId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find pacu stay for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find pacu stay for update conforme al contrato `Promise<PacuStays | null>`.
   */
  findPacuStayForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<PacuStays | null> {
    return em.findOne(
      PacuStays,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find pacu stay by case.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param procedureCaseId - Identificador de procedure case.
   * @returns Resultado de find pacu stay by case conforme al contrato `Promise<PacuStays | null>`.
   */
  findPacuStayByCase(
    em: EntityManager,
    procedureCaseId: string,
  ): Promise<PacuStays | null> {
    return em.findOne(PacuStays, { procedureCaseId });
  }

  /** Valoración de recuperación: log; el alta se decide sobre la más reciente. */
  createPacuAssessment(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a pacu stay.
       */
      pacuStayId: string;
      /**
       * Identificador asociado a assessed by profile.
       */
      assessedByProfileId: string;
      /**
       * Valor de aldrete score mantenido por la instancia.
       */
      aldreteScore?: number;
      /**
       * Valor de pain score mantenido por la instancia.
       */
      painScore?: string;
      /**
       * Valor de nausea score mantenido por la instancia.
       */
      nauseaScore?: string;
      /**
       * Identificador asociado a airway status concept.
       */
      airwayStatusConceptId?: string;
      /**
       * Valor de observations json mantenido por la instancia.
       */
      observationsJson?: unknown;
      /**
       * Valor de criteria json mantenido por la instancia.
       */
      criteriaJson?: unknown;
    },
  ): PacuAssessments {
    return em.create(
      PacuAssessments,
      {
        pacuStayId: data.pacuStayId,
        assessedAt: new Date(),
        assessedByProfileId: data.assessedByProfileId,
        aldreteScore: data.aldreteScore,
        painScore: data.painScore,
        nauseaScore: data.nauseaScore,
        airwayStatusConceptId: data.airwayStatusConceptId,
        observationsJson: data.observationsJson,
        criteriaJson: data.criteriaJson,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Valoraciones de la estancia, de la más reciente a la más antigua. */
  findAssessmentsByStay(
    em: EntityManager,
    pacuStayId: string,
  ): Promise<PacuAssessments[]> {
    return em.find(
      PacuAssessments,
      { pacuStayId },
      { orderBy: { assessedAt: 'DESC' } },
    );
  }

  /**
   * Crea create postoperative order.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create postoperative order conforme al contrato `PostoperativeOrders`.
   */
  createPostoperativeOrder(
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
       * Valor de start at mantenido por la instancia.
       */
      startAt?: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
    },
  ): PostoperativeOrders {
    return em.create(
      PostoperativeOrders,
      {
        procedureCaseId: data.procedureCaseId,
        serviceRequestId: data.serviceRequestId,
        orderRoleConceptId: data.orderRoleConceptId,
        startAt: data.startAt,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /**
   * Crea create followup.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create followup conforme al contrato `PostoperativeFollowups`.
   */
  createFollowup(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a procedure case.
       */
      procedureCaseId: string;
      /**
       * Identificador asociado a followup type concept.
       */
      followupTypeConceptId: string;
      /**
       * Identificador asociado a appointment.
       */
      appointmentId?: string;
      /**
       * Valor de due at mantenido por la instancia.
       */
      dueAt?: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de instructions text mantenido por la instancia.
       */
      instructionsText?: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): PostoperativeFollowups {
    return em.create(
      PostoperativeFollowups,
      {
        procedureCaseId: data.procedureCaseId,
        followupTypeConceptId: data.followupTypeConceptId,
        appointmentId: data.appointmentId,
        dueAt: data.dueAt,
        statusConceptId: data.statusConceptId,
        instructionsText: data.instructionsText,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
