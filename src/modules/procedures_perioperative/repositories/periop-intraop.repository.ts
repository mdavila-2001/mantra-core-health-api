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

export interface CreateImplantData {
  procedureCaseId: string;
  procedureId: string;
  implantDeviceId: string;
  implantRoleConceptId: string;
  bodySiteConceptId?: string;
  lateralityConceptId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateOperativeReportData {
  procedureCaseId: string;
  procedureId: string;
  reportVersion: number;
  authorProfileId: string;
  preoperativeDiagnosisText?: string;
  postoperativeDiagnosisText?: string;
  procedureDescription?: string;
  findingsText?: string;
  estimatedBloodLossMl?: string;
  drainsText?: string;
  complicationsText?: string;
  dispositionConceptId?: string;
  fileId?: string;
  statusConceptId: string;
}

/**
 * Acceso a la fase intra y postoperatoria: pasos, hallazgos, implantes,
 * dispositivos, medicación, muestras, reporte operatorio y PACU.
 */
@Injectable()
export class PeriopIntraopRepository {
  // --- Pasos y hallazgos (UC-53-08) ---

  createStep(
    em: EntityManager,
    data: {
      procedureCaseId: string;
      procedureId?: string;
      stepNumber: number;
      stepCodeConceptId: string;
      description: string;
      performedByProfileId?: string;
      startedAt?: Date;
      bodySiteConceptId?: string;
      lateralityConceptId?: string;
      statusConceptId: string;
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

  findStepById(em: EntityManager, id: string): Promise<OperativeSteps | null> {
    return em.findOne(OperativeSteps, { id });
  }

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
      procedureCaseId: string;
      operativeStepId?: string;
      findingCodeConceptId: string;
      findingText: string;
      bodySiteConceptId?: string;
      lateralityConceptId?: string;
      severityConceptId?: string;
      observationId?: string;
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

  createBodySite(
    em: EntityManager,
    data: {
      procedureId: string;
      bodySiteConceptId: string;
      lateralityConceptId?: string;
      roleConceptId: string;
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

  findBodySite(
    em: EntityManager,
    procedureId: string,
    bodySiteConceptId: string,
  ): Promise<ProcedureBodySites | null> {
    return em.findOne(ProcedureBodySites, { procedureId, bodySiteConceptId });
  }

  // --- Implantes y dispositivos (UC-53-09) ---

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
      procedureImplantId: string;
      identifierTypeConceptId: string;
      identifierValue: string;
      issuingSystem?: string;
      lotNumber?: string;
      serialNumber?: string;
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

  createDevice(
    em: EntityManager,
    data: {
      procedureId: string;
      deviceId: string;
      useRoleConceptId: string;
      lotNumber?: string;
      serialNumber?: string;
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

  createMedicationUse(
    em: EntityManager,
    data: {
      procedureCaseId: string;
      procedureId?: string;
      medicationAdministrationId: string;
      useRoleConceptId: string;
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

  createSpecimen(
    em: EntityManager,
    data: {
      procedureCaseId: string;
      procedureId: string;
      specimenId: string;
      specimenRoleConceptId: string;
      operativeStepId?: string;
      bodySiteConceptId?: string;
      orientationText?: string;
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
      procedureCaseId: string;
      procedureId?: string;
      complicationCodeConceptId: string;
      severityConceptId: string;
      relatednessConceptId: string;
      conditionId?: string;
      managementText?: string;
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

  createPacuStay(
    em: EntityManager,
    data: {
      procedureCaseId: string;
      careSpaceId: string;
      admittedByProfileId?: string;
      statusConceptId: string;
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
      pacuStayId: string;
      assessedByProfileId: string;
      aldreteScore?: number;
      painScore?: string;
      nauseaScore?: string;
      airwayStatusConceptId?: string;
      observationsJson?: unknown;
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

  createPostoperativeOrder(
    em: EntityManager,
    data: {
      procedureCaseId: string;
      serviceRequestId: string;
      orderRoleConceptId: string;
      startAt?: Date;
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

  createFollowup(
    em: EntityManager,
    data: {
      procedureCaseId: string;
      followupTypeConceptId: string;
      appointmentId?: string;
      dueAt?: Date;
      statusConceptId: string;
      instructionsText?: string;
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
