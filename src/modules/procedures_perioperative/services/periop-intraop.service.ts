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
  PeriopCasesRepository,
  PeriopIntraopRepository,
} from '../repositories';
import { SEVERITY_CONCEPT } from './periop-preop.service';
import {
  CreateOperativeStepDto,
  OperativeStepResponseDto,
  RecordFindingDto,
  FindingResponseDto,
  RecordImplantDto,
  ImplantResponseDto,
  RecordMedicationUseDto,
  RecordSpecimenDto,
  SuppliesResponseDto,
  DraftOperativeReportDto,
  OperativeReportResponseDto,
  SignReportDto,
  SignReportResponseDto,
  AdmitToPacuDto,
  PacuStayResponseDto,
  RecordPacuAssessmentDto,
  PacuAssessmentResponseDto,
  DischargePacuDto,
  DischargePacuResponseDto,
  type Laterality,
  type ImplantRole,
  type ImplantIdentifierType,
  type MedicationUseRole,
  type SpecimenRole,
  type Disposition,
  type Relatedness,
} from '../dto';

const LATERALITY_CONCEPT: Readonly<Record<Laterality, string>> = {
  LEFT: CONCEPTS.LATERALITY_LEFT,
  RIGHT: CONCEPTS.LATERALITY_RIGHT,
  BILATERAL: CONCEPTS.LATERALITY_BILATERAL,
};

const IMPLANT_ROLE_CONCEPT: Readonly<Record<ImplantRole, string>> = {
  PRIMARY: CONCEPTS.IMPLANT_ROLE_PRIMARY,
  ADJUNCT: CONCEPTS.IMPLANT_ROLE_ADJUNCT,
};

const IDENTIFIER_TYPE_CONCEPT: Readonly<Record<ImplantIdentifierType, string>> =
  {
    UDI_DI: CONCEPTS.IDENTIFIER_UDI_DI,
    UDI_PI: CONCEPTS.IDENTIFIER_UDI_PI,
    SERIAL: CONCEPTS.IDENTIFIER_SERIAL,
  };

const MEDICATION_USE_CONCEPT: Readonly<Record<MedicationUseRole, string>> = {
  ANESTHESIA: CONCEPTS.MED_USE_ANESTHESIA,
  ANTIBIOTIC: CONCEPTS.MED_USE_ANTIBIOTIC,
  ANALGESIA: CONCEPTS.MED_USE_ANALGESIA,
};

const SPECIMEN_ROLE_CONCEPT: Readonly<Record<SpecimenRole, string>> = {
  BIOPSY: CONCEPTS.SPECIMEN_ROLE_BIOPSY,
  RESECTION: CONCEPTS.SPECIMEN_ROLE_RESECTION,
  CULTURE: CONCEPTS.SPECIMEN_ROLE_CULTURE,
};

const DISPOSITION_CONCEPT: Readonly<Record<Disposition, string>> = {
  PACU: CONCEPTS.DISPOSITION_PACU,
  ICU: CONCEPTS.DISPOSITION_ICU,
  WARD: CONCEPTS.DISPOSITION_WARD,
  HOME: CONCEPTS.DISPOSITION_HOME,
};

const RELATEDNESS_CONCEPT: Readonly<Record<Relatedness, string>> = {
  PROCEDURE: CONCEPTS.RELATEDNESS_PROCEDURE,
  ANESTHESIA: CONCEPTS.RELATEDNESS_ANESTHESIA,
  UNRELATED: CONCEPTS.RELATEDNESS_UNRELATED,
};

const ORDER_ROLE_CONCEPT: Readonly<
  Record<'LAB' | 'IMAGING' | 'CONSULT' | 'MEDICATION', string>
> = {
  LAB: CONCEPTS.ORDER_ROLE_LAB,
  IMAGING: CONCEPTS.ORDER_ROLE_IMAGING,
  CONSULT: CONCEPTS.ORDER_ROLE_CONSULT,
  MEDICATION: CONCEPTS.ORDER_ROLE_MEDICATION,
};

const FOLLOWUP_TYPE_CONCEPT: Readonly<Record<'WOUND_CHECK' | 'VISIT', string>> =
  {
    WOUND_CHECK: CONCEPTS.FOLLOWUP_WOUND_CHECK,
    VISIT: CONCEPTS.FOLLOWUP_VISIT,
  };

/** Puntuación de Aldrete a partir de la cual el paciente puede salir de PACU. */
const ALDRETE_DISCHARGE_THRESHOLD = 9;

/**
 * Fases intra y postoperatoria: pasos y hallazgos, implantes, insumos, reporte
 * operatorio y recuperación (UC-53-08 … 12).
 */
@Injectable()
export class PeriopIntraopService {
  constructor(
    private readonly em: EntityManager,
    private readonly intraopRepo: PeriopIntraopRepository,
    private readonly casesRepo: PeriopCasesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PeriopIntraopService.name);
  }

  /**
   * UC-53-08: registrar un paso operatorio. El número es correlativo dentro del
   * caso: el orden en que se hicieron las cosas es parte del registro clínico.
   */
  async createStep(
    caseId: string,
    dto: CreateOperativeStepDto,
    actor: AuthenticatedUser,
  ): Promise<OperativeStepResponseDto> {
    this.logger.info(
      { operation: 'periop.intraop.step', caseId },
      'Recording operative step',
    );

    return this.em.transactional(async (tx) => {
      const surgicalCase = await this.assertCaseInProgress(tx, caseId);

      const steps = await this.intraopRepo.findStepsByCase(tx, caseId);
      const stepNumber = steps.length + 1;

      const step = this.intraopRepo.createStep(tx, {
        procedureCaseId: caseId,
        procedureId: dto.procedureId ?? surgicalCase.primaryProcedureId,
        stepNumber,
        stepCodeConceptId: dto.stepCodeConceptId,
        description: dto.description,
        performedByProfileId: dto.performedByProfileId,
        bodySiteConceptId: dto.bodySiteConceptId,
        lateralityConceptId: dto.laterality
          ? LATERALITY_CONCEPT[dto.laterality]
          : undefined,
        statusConceptId: CONCEPTS.STEP_IN_PROGRESS,
        actorUserId: actor.id,
      });

      return {
        id: step.id,
        stepNumber,
        statusConceptId: CONCEPTS.STEP_IN_PROGRESS,
      };
    });
  }

  /**
   * UC-53-08: registrar un hallazgo. Es inmutable —lo que se vio en quirófano
   * no se reescribe— y su sitio anatómico se acumula en el procedimiento.
   */
  async recordFinding(
    caseId: string,
    dto: RecordFindingDto,
    actor: AuthenticatedUser,
  ): Promise<FindingResponseDto> {
    this.logger.info(
      { operation: 'periop.intraop.finding', caseId },
      'Recording operative finding',
    );

    return this.em.transactional(async (tx) => {
      const surgicalCase = await this.assertCaseInProgress(tx, caseId);

      if (dto.operativeStepId) {
        const step = await this.intraopRepo.findStepById(
          tx,
          dto.operativeStepId,
        );
        if (!step) {
          throw new ResourceNotFoundException('Paso operatorio no encontrado', {
            operativeStepId: dto.operativeStepId,
          });
        }
        if (step.procedureCaseId !== caseId) {
          throw new PreconditionFailedException(
            'El paso pertenece a otro caso',
            {
              caseId,
              operativeStepId: dto.operativeStepId,
            },
          );
        }
      }

      const finding = this.intraopRepo.createFinding(tx, {
        procedureCaseId: caseId,
        operativeStepId: dto.operativeStepId,
        findingCodeConceptId: dto.findingCodeConceptId,
        findingText: dto.findingText,
        bodySiteConceptId: dto.bodySiteConceptId,
        lateralityConceptId: dto.laterality
          ? LATERALITY_CONCEPT[dto.laterality]
          : undefined,
        severityConceptId: dto.severity
          ? SEVERITY_CONCEPT[dto.severity]
          : undefined,
        observationId: dto.observationId,
        recordedByProfileId: dto.recordedByProfileId,
      });

      // El sitio anatómico del hallazgo pasa a formar parte del procedimiento:
      // es lo que después permite codificarlo y facturarlo con lateralidad.
      let bodySiteRecorded = false;
      const procedureId = surgicalCase.primaryProcedureId;
      if (dto.bodySiteConceptId && procedureId) {
        const existing = await this.intraopRepo.findBodySite(
          tx,
          procedureId,
          dto.bodySiteConceptId,
        );
        if (!existing) {
          this.intraopRepo.createBodySite(tx, {
            procedureId,
            bodySiteConceptId: dto.bodySiteConceptId,
            lateralityConceptId: dto.laterality
              ? LATERALITY_CONCEPT[dto.laterality]
              : undefined,
            roleConceptId: CONCEPTS.BODY_SITE_ROLE_SECONDARY,
          });
          bodySiteRecorded = true;
        }
      }

      return { id: finding.id, procedureCaseId: caseId, bodySiteRecorded };
    });
  }

  /**
   * UC-53-09: registrar el implante con su trazabilidad. Al menos un
   * identificador es obligatorio: un implante sin UDI, lote ni serie no se
   * podría rastrear si el fabricante lo retira del mercado.
   */
  async recordImplant(
    caseId: string,
    dto: RecordImplantDto,
    actor: AuthenticatedUser,
  ): Promise<ImplantResponseDto> {
    this.logger.info(
      { operation: 'periop.intraop.implant', caseId },
      'Recording surgical implant',
    );

    return this.em.transactional(async (tx) => {
      await this.assertCaseInProgress(tx, caseId);

      const implant = this.intraopRepo.createImplant(tx, {
        procedureCaseId: caseId,
        procedureId: dto.procedureId,
        implantDeviceId: dto.implantDeviceId,
        implantRoleConceptId: IMPLANT_ROLE_CONCEPT[dto.implantRole],
        bodySiteConceptId: dto.bodySiteConceptId,
        lateralityConceptId: dto.laterality
          ? LATERALITY_CONCEPT[dto.laterality]
          : undefined,
        statusConceptId: CONCEPTS.IMPLANT_IMPLANTED,
        actorUserId: actor.id,
      });

      const identifierIds = dto.identifiers.map(
        (identifier) =>
          this.intraopRepo.createImplantIdentifier(tx, {
            procedureImplantId: implant.id,
            identifierTypeConceptId:
              IDENTIFIER_TYPE_CONCEPT[identifier.identifierType],
            identifierValue: identifier.identifierValue,
            issuingSystem: identifier.issuingSystem,
            lotNumber: identifier.lotNumber,
            serialNumber: identifier.serialNumber,
            expirationDate: identifier.expirationDate
              ? new Date(identifier.expirationDate)
              : undefined,
          }).id,
      );

      // El uso del dispositivo se registra aparte del implante: la trazabilidad
      // regulatoria pregunta por el dispositivo, no por el acto quirúrgico.
      const firstIdentifier = dto.identifiers[0];
      const device = this.intraopRepo.createDevice(tx, {
        procedureId: dto.procedureId,
        deviceId: dto.implantDeviceId,
        useRoleConceptId: CONCEPTS.DEVICE_USE_IMPLANT,
        lotNumber: firstIdentifier.lotNumber,
        serialNumber: firstIdentifier.serialNumber,
        udiCarrier: dto.udiCarrier,
      });

      return {
        id: implant.id,
        statusConceptId: CONCEPTS.IMPLANT_IMPLANTED,
        identifierIds,
        deviceUseId: device.id,
      };
    });
  }

  /** UC-53-10: registrar el uso de un medicamento durante la intervención. */
  async recordMedicationUse(
    caseId: string,
    dto: RecordMedicationUseDto,
    actor: AuthenticatedUser,
  ): Promise<SuppliesResponseDto> {
    this.logger.info(
      { operation: 'periop.intraop.medication', caseId, useRole: dto.useRole },
      'Recording medication use',
    );

    return this.em.transactional(async (tx) => {
      const surgicalCase = await this.assertCaseInProgress(tx, caseId);

      if (dto.operativeStepId) {
        const step = await this.intraopRepo.findStepById(
          tx,
          dto.operativeStepId,
        );
        if (!step || step.procedureCaseId !== caseId) {
          throw new PreconditionFailedException(
            'El paso no pertenece al caso',
            {
              caseId,
              operativeStepId: dto.operativeStepId,
            },
          );
        }
      }

      const use = this.intraopRepo.createMedicationUse(tx, {
        procedureCaseId: caseId,
        procedureId: dto.procedureId ?? surgicalCase.primaryProcedureId,
        medicationAdministrationId: dto.medicationAdministrationId,
        useRoleConceptId: MEDICATION_USE_CONCEPT[dto.useRole],
        operativeStepId: dto.operativeStepId,
      });

      return { id: use.id, procedureCaseId: caseId };
    });
  }

  /** UC-53-10: registrar una muestra tomada durante la intervención. */
  async recordSpecimen(
    caseId: string,
    dto: RecordSpecimenDto,
    actor: AuthenticatedUser,
  ): Promise<SuppliesResponseDto> {
    this.logger.info(
      {
        operation: 'periop.intraop.specimen',
        caseId,
        specimenRole: dto.specimenRole,
      },
      'Recording surgical specimen',
    );

    return this.em.transactional(async (tx) => {
      await this.assertCaseInProgress(tx, caseId);

      if (dto.operativeStepId) {
        const step = await this.intraopRepo.findStepById(
          tx,
          dto.operativeStepId,
        );
        if (!step || step.procedureCaseId !== caseId) {
          throw new PreconditionFailedException(
            'El paso no pertenece al caso',
            {
              caseId,
              operativeStepId: dto.operativeStepId,
            },
          );
        }
      }

      const specimen = this.intraopRepo.createSpecimen(tx, {
        procedureCaseId: caseId,
        procedureId: dto.procedureId,
        specimenId: dto.specimenId,
        specimenRoleConceptId: SPECIMEN_ROLE_CONCEPT[dto.specimenRole],
        operativeStepId: dto.operativeStepId,
        bodySiteConceptId: dto.bodySiteConceptId,
        orientationText: dto.orientationText,
        surgeonComment: dto.surgeonComment,
      });

      return { id: specimen.id, procedureCaseId: caseId };
    });
  }

  /**
   * UC-53-11: redactar el reporte operatorio. Cada versión es inmutable: se
   * escribe una nueva en vez de corregir la anterior, porque el reporte es
   * documento clínico y su historia importa.
   */
  async draftReport(
    caseId: string,
    dto: DraftOperativeReportDto,
    actor: AuthenticatedUser,
  ): Promise<OperativeReportResponseDto> {
    this.logger.info(
      { operation: 'periop.report.draft', caseId },
      'Drafting operative report',
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

      const last = await this.intraopRepo.findLastReport(tx, caseId);
      // Un reporte firmado no se edita: la corrección es una versión nueva.
      const reportVersion = (last?.reportVersion ?? 0) + 1;

      const report = this.intraopRepo.createReport(tx, {
        procedureCaseId: caseId,
        procedureId: dto.procedureId,
        reportVersion,
        authorProfileId: dto.authorProfileId,
        preoperativeDiagnosisText: dto.preoperativeDiagnosisText,
        postoperativeDiagnosisText: dto.postoperativeDiagnosisText,
        procedureDescription: dto.procedureDescription,
        findingsText: dto.findingsText,
        estimatedBloodLossMl: dto.estimatedBloodLossMl,
        drainsText: dto.drainsText,
        complicationsText: dto.complicationsText,
        dispositionConceptId: DISPOSITION_CONCEPT[dto.disposition],
        statusConceptId: CONCEPTS.OPERATIVE_REPORT_DRAFT,
      });

      const complicationIds = (dto.complications ?? []).map((complication) => {
        this.logger.warn(
          {
            operation: 'periop.report.draft',
            caseId,
            severity: complication.severity,
            relatedness: complication.relatedness,
          },
          'Surgical complication recorded',
        );
        return this.intraopRepo.createComplication(tx, {
          procedureCaseId: caseId,
          procedureId: dto.procedureId,
          complicationCodeConceptId: complication.complicationCodeConceptId,
          severityConceptId: SEVERITY_CONCEPT[complication.severity],
          relatednessConceptId: RELATEDNESS_CONCEPT[complication.relatedness],
          conditionId: complication.conditionId,
          managementText: complication.managementText,
          reportedByProfileId: dto.authorProfileId,
        }).id;
      });

      return {
        id: report.id,
        reportVersion,
        statusConceptId: CONCEPTS.OPERATIVE_REPORT_DRAFT,
        complicationIds,
      };
    });
  }

  /**
   * UC-53-11: firmar el reporte. Firmar cierra el caso: es el acto que declara
   * terminada la intervención con constancia de quién responde por ella.
   */
  async signReport(
    caseId: string,
    reportId: string,
    dto: SignReportDto,
    actor: AuthenticatedUser,
  ): Promise<SignReportResponseDto> {
    this.logger.info(
      { operation: 'periop.report.sign', caseId, reportId },
      'Signing operative report',
    );

    return this.em.transactional(async (tx) => {
      const report = await this.intraopRepo.findReportForUpdate(tx, reportId);
      if (!report) {
        throw new ResourceNotFoundException(
          'Reporte operatorio no encontrado',
          { reportId },
        );
      }
      if (report.procedureCaseId !== caseId) {
        throw new PreconditionFailedException(
          'El reporte pertenece a otro caso',
          {
            caseId,
            reportId,
          },
        );
      }
      if (report.statusConceptId === CONCEPTS.OPERATIVE_REPORT_SIGNED) {
        throw new ConflictException('El reporte ya está firmado', { reportId });
      }

      const surgicalCase = await this.casesRepo.findCaseForUpdate(tx, caseId);
      if (!surgicalCase) {
        throw new ResourceNotFoundException('Caso quirúrgico no encontrado', {
          caseId,
        });
      }

      report.statusConceptId = CONCEPTS.OPERATIVE_REPORT_SIGNED;
      report.signedAt = new Date();
      report.signatureId = dto.signatureId;
      if (dto.fileId) report.fileId = dto.fileId;

      const finishedAt = new Date();
      if (surgicalCase.statusConceptId !== CONCEPTS.CASE_COMPLETED) {
        this.casesRepo.createStatusHistory(tx, {
          procedureCaseId: caseId,
          fromStatusConceptId: surgicalCase.statusConceptId,
          toStatusConceptId: CONCEPTS.CASE_COMPLETED,
          changedByUserId: actor.id,
          reasonText: 'Reporte operatorio firmado',
        });
        surgicalCase.statusConceptId = CONCEPTS.CASE_COMPLETED;
        surgicalCase.actualEndAt = surgicalCase.actualEndAt ?? finishedAt;
        this.casesRepo.createMilestone(tx, {
          procedureCaseId: caseId,
          milestoneTypeConceptId: CONCEPTS.MILESTONE_CASE_END,
          occurredAt: finishedAt,
          statusConceptId: CONCEPTS.MILESTONE_REACHED,
        });
        touch(surgicalCase, actor.id);
      }

      return {
        id: reportId,
        statusConceptId: CONCEPTS.OPERATIVE_REPORT_SIGNED,
        caseStatusConceptId: surgicalCase.statusConceptId,
      };
    });
  }

  /** UC-53-12: admitir al paciente en recuperación. */
  async admitToPacu(
    caseId: string,
    dto: AdmitToPacuDto,
    actor: AuthenticatedUser,
  ): Promise<PacuStayResponseDto> {
    this.logger.info(
      { operation: 'periop.pacu.admit', caseId },
      'Admitting to PACU',
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

      const existing = await this.intraopRepo.findPacuStayByCase(tx, caseId);
      if (existing) {
        throw new ConflictException(
          'El caso ya tiene estancia en recuperación',
          {
            caseId,
            pacuStayId: existing.id,
          },
        );
      }

      const stay = this.intraopRepo.createPacuStay(tx, {
        procedureCaseId: caseId,
        careSpaceId: dto.careSpaceId,
        admittedByProfileId: dto.admittedByProfileId,
        statusConceptId: CONCEPTS.PACU_IN_RECOVERY,
        actorUserId: actor.id,
      });

      // La estancia deja rastro también en las ubicaciones del caso: es lo que
      // permite reconstruir por dónde pasó el paciente.
      const location = this.casesRepo.createLocation(tx, {
        procedureCaseId: caseId,
        careSpaceId: dto.careSpaceId,
        locationRoleConceptId: CONCEPTS.LOCATION_ROLE_PACU,
        startsAt: new Date(),
      });

      return {
        id: stay.id,
        statusConceptId: CONCEPTS.PACU_IN_RECOVERY,
        locationId: location.id,
      };
    });
  }

  /**
   * UC-53-12: anotar una valoración de recuperación. Informa si cumple el
   * criterio de alta, pero no da el alta: eso es un acto aparte y deliberado.
   */
  async recordPacuAssessment(
    stayId: string,
    dto: RecordPacuAssessmentDto,
    actor: AuthenticatedUser,
  ): Promise<PacuAssessmentResponseDto> {
    this.logger.info(
      { operation: 'periop.pacu.assess', stayId },
      'Recording PACU assessment',
    );

    return this.em.transactional(async (tx) => {
      const stay = await this.intraopRepo.findPacuStayForUpdate(tx, stayId);
      if (!stay) {
        throw new ResourceNotFoundException(
          'Estancia en recuperación no encontrada',
          { stayId },
        );
      }
      if (stay.statusConceptId === CONCEPTS.PACU_DISCHARGED) {
        throw new ConflictException('El paciente ya salió de recuperación', {
          stayId,
        });
      }

      const assessment = this.intraopRepo.createPacuAssessment(tx, {
        pacuStayId: stayId,
        assessedByProfileId: dto.assessedByProfileId,
        aldreteScore: dto.aldreteScore,
        painScore: dto.painScore,
        nauseaScore: dto.nauseaScore,
        airwayStatusConceptId:
          dto.airwayStatus === 'SUPPORTED'
            ? CONCEPTS.AIRWAY_STATUS_SUPPORTED
            : dto.airwayStatus === 'PATENT'
              ? CONCEPTS.AIRWAY_STATUS_PATENT
              : undefined,
        observationsJson: dto.observationsJson,
        criteriaJson: dto.criteriaJson,
      });

      const meetsDischargeCriteria =
        dto.aldreteScore !== undefined &&
        dto.aldreteScore >= ALDRETE_DISCHARGE_THRESHOLD;

      return { id: assessment.id, pacuStayId: stayId, meetsDischargeCriteria };
    });
  }

  /**
   * UC-53-12: dar el alta de recuperación. Exige una valoración que cumpla el
   * criterio: sacar al paciente sin ella es exactamente lo que la escala de
   * Aldrete existe para impedir.
   */
  async dischargeFromPacu(
    stayId: string,
    dto: DischargePacuDto,
    actor: AuthenticatedUser,
  ): Promise<DischargePacuResponseDto> {
    this.logger.info(
      {
        operation: 'periop.pacu.discharge',
        stayId,
        destination: dto.destination,
      },
      'Discharging from PACU',
    );

    return this.em.transactional(async (tx) => {
      const stay = await this.intraopRepo.findPacuStayForUpdate(tx, stayId);
      if (!stay) {
        throw new ResourceNotFoundException(
          'Estancia en recuperación no encontrada',
          { stayId },
        );
      }
      if (stay.statusConceptId === CONCEPTS.PACU_DISCHARGED) {
        throw new ConflictException('El paciente ya salió de recuperación', {
          stayId,
        });
      }

      const assessments = await this.intraopRepo.findAssessmentsByStay(
        tx,
        stayId,
      );
      const latest = assessments[0];
      if (!latest) {
        throw new PreconditionFailedException(
          'El alta de recuperación exige al menos una valoración',
          { stayId },
        );
      }
      if ((latest.aldreteScore ?? 0) < ALDRETE_DISCHARGE_THRESHOLD) {
        throw new PreconditionFailedException(
          'La última valoración no cumple el criterio de alta',
          { stayId, aldreteScore: latest.aldreteScore },
        );
      }

      const dischargedAt = new Date();
      stay.statusConceptId = CONCEPTS.PACU_DISCHARGED;
      stay.dischargedAt = dischargedAt;
      stay.dischargedByProfileId = dto.dischargedByProfileId;
      stay.dischargeDestinationConceptId = DISPOSITION_CONCEPT[dto.destination];
      stay.dischargeCriteriaMet = true;
      touch(stay, actor.id);

      const location = await this.casesRepo.findOpenLocation(
        tx,
        stay.procedureCaseId,
        CONCEPTS.LOCATION_ROLE_PACU,
      );
      if (location) location.endsAt = dischargedAt;

      let ordersCreated = 0;
      for (const order of dto.orders ?? []) {
        this.intraopRepo.createPostoperativeOrder(tx, {
          procedureCaseId: stay.procedureCaseId,
          serviceRequestId: order.serviceRequestId,
          orderRoleConceptId: ORDER_ROLE_CONCEPT[order.orderRole],
          startAt: dischargedAt,
          statusConceptId: CONCEPTS.ORDER_PENDING,
        });
        ordersCreated += 1;
      }

      let followupsCreated = 0;
      for (const followup of dto.followups ?? []) {
        this.intraopRepo.createFollowup(tx, {
          procedureCaseId: stay.procedureCaseId,
          followupTypeConceptId: FOLLOWUP_TYPE_CONCEPT[followup.followupType],
          appointmentId: followup.appointmentId,
          dueAt: followup.dueAt ? new Date(followup.dueAt) : undefined,
          statusConceptId: CONCEPTS.FOLLOWUP_SCHEDULED,
          instructionsText: followup.instructionsText,
          actorUserId: actor.id,
        });
        followupsCreated += 1;
      }

      return {
        id: stayId,
        statusConceptId: CONCEPTS.PACU_DISCHARGED,
        ordersCreated,
        followupsCreated,
      };
    });
  }

  // --- Apoyo ---

  /**
   * Un registro intraoperatorio exige que el caso esté realmente en curso:
   * anotar pasos, hallazgos o implantes en un caso que no ha empezado —o que ya
   * se cerró— produciría una historia clínica que no ocurrió.
   */
  private async assertCaseInProgress(tx: EntityManager, caseId: string) {
    const surgicalCase = await this.casesRepo.findCaseForUpdate(tx, caseId);
    if (!surgicalCase) {
      throw new ResourceNotFoundException('Caso quirúrgico no encontrado', {
        caseId,
      });
    }
    if (surgicalCase.statusConceptId !== CONCEPTS.SURGICAL_CASE_IN_PROGRESS) {
      throw new PreconditionFailedException('El caso no está en curso', {
        caseId,
        statusConceptId: surgicalCase.statusConceptId,
      });
    }
    return surgicalCase;
  }
}
