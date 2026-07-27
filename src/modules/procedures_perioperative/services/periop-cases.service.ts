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
import { PeriopCasesRepository } from '../repositories';
import {
  ScheduleCaseDto,
  CaseResponseDto,
  AddDiagnosesDto,
  DiagnosesResponseDto,
  AssignTeamMemberDto,
  TeamMemberResponseDto,
  CancelCaseDto,
  CancelCaseResponseDto,
  PostChargesDto,
  PostChargesResponseDto,
  type SurgicalCaseType,
  type CasePriority,
  type DiagnosisRole,
  type TeamRole,
  type CancellationCategory,
  type ChargeType,
} from '../dto';

const CASE_TYPE_CONCEPT: Readonly<Record<SurgicalCaseType, string>> = {
  ELECTIVE: CONCEPTS.CASE_TYPE_ELECTIVE,
  URGENT: CONCEPTS.CASE_TYPE_URGENT,
  EMERGENCY: CONCEPTS.CASE_TYPE_EMERGENCY,
};

const PRIORITY_CONCEPT: Readonly<Record<CasePriority, string>> = {
  ROUTINE: CONCEPTS.CASE_PRIORITY_ROUTINE,
  URGENT: CONCEPTS.CASE_PRIORITY_URGENT,
  STAT: CONCEPTS.CASE_PRIORITY_STAT,
};

const DIAGNOSIS_ROLE_CONCEPT: Readonly<Record<DiagnosisRole, string>> = {
  PRIMARY: CONCEPTS.DIAGNOSIS_ROLE_PRIMARY,
  SECONDARY: CONCEPTS.DIAGNOSIS_ROLE_SECONDARY,
  POSTOPERATIVE: CONCEPTS.DIAGNOSIS_ROLE_POSTOP,
};

const TEAM_ROLE_CONCEPT: Readonly<Record<TeamRole, string>> = {
  SURGEON: CONCEPTS.TEAM_ROLE_SURGEON,
  ASSISTANT: CONCEPTS.TEAM_ROLE_ASSISTANT,
  ANESTHESIOLOGIST: CONCEPTS.TEAM_ROLE_ANESTHESIOLOGIST,
  SCRUB_NURSE: CONCEPTS.TEAM_ROLE_SCRUB_NURSE,
  CIRCULATING_NURSE: CONCEPTS.TEAM_ROLE_CIRCULATING_NURSE,
};

const CANCELLATION_CATEGORY_CONCEPT: Readonly<
  Record<CancellationCategory, string>
> = {
  PATIENT: CONCEPTS.CANCEL_CATEGORY_PATIENT,
  FACILITY: CONCEPTS.CANCEL_CATEGORY_FACILITY,
  CLINICAL: CONCEPTS.CANCEL_CATEGORY_CLINICAL,
};

const CHARGE_TYPE_CONCEPT: Readonly<Record<ChargeType, string>> = {
  PROCEDURE: CONCEPTS.CHARGE_TYPE_PROCEDURE,
  IMPLANT: CONCEPTS.CHARGE_TYPE_IMPLANT,
  SUPPLY: CONCEPTS.CHARGE_TYPE_SUPPLY,
  OR_TIME: CONCEPTS.CHARGE_TYPE_OR_TIME,
};

/** Estados en los que el caso todavía ocupa el quirófano reservado. */
const BLOCKING_CASE_STATES: readonly string[] = [
  CONCEPTS.CASE_SCHEDULED,
  CONCEPTS.CASE_READY_FOR_SURGERY,
  CONCEPTS.SURGICAL_CASE_IN_PROGRESS,
];

/** Estados desde los que todavía se puede cancelar. */
const CANCELLABLE_CASE_STATES: readonly string[] = [
  CONCEPTS.CASE_SCHEDULED,
  CONCEPTS.CASE_READY_FOR_SURGERY,
  CONCEPTS.SURGICAL_CASE_IN_PROGRESS,
];

/**
 * Gobierno del caso quirúrgico: programación, diagnósticos y equipo,
 * cancelación y cargos (UC-53-01, 02, 13, 14).
 */
@Injectable()
export class PeriopCasesService {
  constructor(
    private readonly em: EntityManager,
    private readonly casesRepo: PeriopCasesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PeriopCasesService.name);
  }

  /**
   * UC-53-01: programar el caso y reservar el quirófano. El solape se comprueba
   * dentro de la transacción: dos casos en el mismo quirófano a la misma hora es
   * exactamente lo que no puede pasar.
   */
  async scheduleCase(
    dto: ScheduleCaseDto,
    actor: AuthenticatedUser,
  ): Promise<CaseResponseDto> {
    this.logger.info(
      {
        operation: 'periop.case.schedule',
        operatingRoomId: dto.operatingRoomId,
      },
      'Scheduling surgical case',
    );

    const scheduledStartAt = new Date(dto.scheduledStartAt);
    const scheduledEndAt = new Date(dto.scheduledEndAt);
    if (scheduledEndAt <= scheduledStartAt) {
      throw new PreconditionFailedException(
        'El caso debe terminar después de empezar',
        {
          scheduledStartAt: dto.scheduledStartAt,
          scheduledEndAt: dto.scheduledEndAt,
        },
      );
    }
    // Saltarse la programación electiva exige justificarlo: es lo que después
    // permite auditar por qué se antepuso un caso a otro.
    if (dto.caseType !== 'ELECTIVE' && !dto.urgencyReasonText) {
      throw new PreconditionFailedException(
        'Un caso urgente o de emergencia necesita justificar su urgencia',
        { caseType: dto.caseType },
      );
    }

    return this.em.transactional(async (tx) => {
      const overlapping = await this.casesRepo.findOverlappingCases(
        tx,
        dto.operatingRoomId,
        scheduledStartAt,
        scheduledEndAt,
        [...BLOCKING_CASE_STATES],
      );
      if (overlapping.length > 0) {
        throw new ConflictException(
          'El quirófano ya está reservado en esa franja',
          {
            operatingRoomId: dto.operatingRoomId,
            conflictingCaseId: overlapping[0].id,
          },
        );
      }

      const caseNumber = await this.nextCaseNumber(tx, dto.custodianTenantId);
      const surgicalCase = this.casesRepo.createCase(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        encounterId: dto.encounterId,
        serviceRequestId: dto.serviceRequestId,
        primaryProcedureId: dto.primaryProcedureId,
        caseNumber,
        caseTypeConceptId: CASE_TYPE_CONCEPT[dto.caseType],
        priorityConceptId: PRIORITY_CONCEPT[dto.priority],
        statusConceptId: CONCEPTS.CASE_SCHEDULED,
        surgicalSpecialtyConceptId: dto.surgicalSpecialtyConceptId,
        requestedByProfileId: dto.requestedByProfileId,
        primarySurgeonProfileId: dto.primarySurgeonProfileId,
        practiceSiteId: dto.practiceSiteId,
        operatingRoomId: dto.operatingRoomId,
        scheduledStartAt,
        scheduledEndAt,
        urgencyReasonText: dto.urgencyReasonText,
        actorUserId: actor.id,
      });

      // El caso nace ya con su primera transición registrada: el historial no
      // debe empezar a medias.
      this.casesRepo.createStatusHistory(tx, {
        procedureCaseId: surgicalCase.id,
        fromStatusConceptId: CONCEPTS.CASE_SCHEDULED,
        toStatusConceptId: CONCEPTS.CASE_SCHEDULED,
        changedByUserId: actor.id,
        reasonText: 'Programación inicial',
      });

      const milestone = this.casesRepo.createMilestone(tx, {
        procedureCaseId: surgicalCase.id,
        milestoneTypeConceptId: CONCEPTS.MILESTONE_SCHEDULED,
        plannedAt: scheduledStartAt,
        statusConceptId: CONCEPTS.MILESTONE_PLANNED,
      });

      this.casesRepo.createUtilizationEvent(tx, {
        operatingRoomId: dto.operatingRoomId,
        procedureCaseId: surgicalCase.id,
        eventTypeConceptId: CONCEPTS.OR_EVENT_RESERVED,
        recordedByUserId: actor.id,
      });

      // El cirujano principal es el primer miembro del equipo: un caso sin
      // cirujano asignado no tendría responsable.
      this.casesRepo.createTeamMember(tx, {
        procedureCaseId: surgicalCase.id,
        practitionerProfileId: dto.primarySurgeonProfileId,
        teamRoleConceptId: CONCEPTS.TEAM_ROLE_SURGEON,
        statusConceptId: CONCEPTS.TEAM_ASSIGNED,
        actorUserId: actor.id,
      });

      return {
        id: surgicalCase.id,
        caseNumber,
        statusConceptId: CONCEPTS.CASE_SCHEDULED,
        operatingRoomId: dto.operatingRoomId,
        milestoneId: milestone.id,
      };
    });
  }

  /**
   * UC-53-02: registrar los diagnósticos del caso. Sólo puede haber un
   * diagnóstico principal: con dos, la codificación y la facturación quedarían
   * sin criterio.
   */
  async addDiagnoses(
    caseId: string,
    dto: AddDiagnosesDto,
    actor: AuthenticatedUser,
  ): Promise<DiagnosesResponseDto> {
    this.logger.info(
      {
        operation: 'periop.case.diagnoses',
        caseId,
        count: dto.diagnoses.length,
      },
      'Adding case diagnoses',
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

      const existing = await this.casesRepo.findDiagnosesByCase(tx, caseId);
      const existingConditions = new Set(existing.map((d) => d.conditionId));
      const hasPrimary = existing.some(
        (d) => d.diagnosisRoleConceptId === CONCEPTS.DIAGNOSIS_ROLE_PRIMARY,
      );

      const incomingPrimary = dto.diagnoses.filter(
        (d) => d.role === 'PRIMARY',
      ).length;
      if (incomingPrimary > 1 || (incomingPrimary === 1 && hasPrimary)) {
        throw new ConflictException(
          'El caso sólo admite un diagnóstico principal',
          { caseId },
        );
      }

      const diagnosisIds: string[] = [];
      let skipped = 0;
      let sequenceNumber = existing.length;

      for (const diagnosis of dto.diagnoses) {
        if (existingConditions.has(diagnosis.conditionId)) {
          skipped += 1;
          continue;
        }
        sequenceNumber += 1;
        const created = this.casesRepo.createDiagnosis(tx, {
          procedureCaseId: caseId,
          conditionId: diagnosis.conditionId,
          diagnosisRoleConceptId: DIAGNOSIS_ROLE_CONCEPT[diagnosis.role],
          sequenceNumber,
          presentOnAdmission: diagnosis.presentOnAdmission ?? false,
        });
        existingConditions.add(diagnosis.conditionId);
        diagnosisIds.push(created.id);
      }

      touch(surgicalCase, actor.id);

      return { procedureCaseId: caseId, diagnosisIds, skipped };
    });
  }

  /** UC-53-02: asignar un miembro al equipo quirúrgico. */
  async assignTeamMember(
    caseId: string,
    dto: AssignTeamMemberDto,
    actor: AuthenticatedUser,
  ): Promise<TeamMemberResponseDto> {
    this.logger.info(
      { operation: 'periop.case.team', caseId, role: dto.role },
      'Assigning team member',
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

      const team = await this.casesRepo.findTeamByCase(tx, caseId);
      const alreadyIn = team.some(
        (m) =>
          m.practitionerProfileId === dto.practitionerProfileId &&
          m.teamRoleConceptId === TEAM_ROLE_CONCEPT[dto.role],
      );
      if (alreadyIn) {
        throw new ConflictException(
          'El profesional ya tiene ese rol en el caso',
          {
            caseId,
            practitionerProfileId: dto.practitionerProfileId,
          },
        );
      }

      const member = this.casesRepo.createTeamMember(tx, {
        procedureCaseId: caseId,
        practitionerProfileId: dto.practitionerProfileId,
        teamRoleConceptId: TEAM_ROLE_CONCEPT[dto.role],
        statusConceptId: CONCEPTS.TEAM_ASSIGNED,
        actorUserId: actor.id,
      });

      // Asignar el anestesiólogo al equipo lo deja también como responsable del
      // caso: es el dato que consulta el resto del flujo perioperatorio.
      if (
        dto.role === 'ANESTHESIOLOGIST' &&
        !surgicalCase.anesthesiologistProfileId
      ) {
        surgicalCase.anesthesiologistProfileId = dto.practitionerProfileId;
      }
      touch(surgicalCase, actor.id);

      return {
        id: member.id,
        procedureCaseId: caseId,
        statusConceptId: CONCEPTS.TEAM_ASSIGNED,
        teamSize: team.length + 1,
      };
    });
  }

  /**
   * UC-53-13: cancelar el caso. Liberar el quirófano en la misma transacción es
   * lo que impide que quede bloqueado por un caso que ya no va a ocurrir.
   */
  async cancelCase(
    caseId: string,
    dto: CancelCaseDto,
    actor: AuthenticatedUser,
  ): Promise<CancelCaseResponseDto> {
    this.logger.warn(
      { operation: 'periop.case.cancel', caseId, category: dto.category },
      'Cancelling surgical case',
    );

    return this.em.transactional(async (tx) => {
      const surgicalCase = await this.casesRepo.findCaseForUpdate(tx, caseId);
      if (!surgicalCase) {
        throw new ResourceNotFoundException('Caso quirúrgico no encontrado', {
          caseId,
        });
      }
      if (surgicalCase.statusConceptId === CONCEPTS.CASE_CANCELLED) {
        throw new ConflictException('El caso ya está cancelado', { caseId });
      }
      if (!CANCELLABLE_CASE_STATES.includes(surgicalCase.statusConceptId)) {
        throw new PreconditionFailedException(
          'El caso no admite cancelación en su estado actual',
          {
            caseId,
            statusConceptId: surgicalCase.statusConceptId,
          },
        );
      }

      const cancellation = this.casesRepo.createCancellation(tx, {
        procedureCaseId: caseId,
        cancellationReasonConceptId: dto.cancellationReasonConceptId,
        cancellationCategoryConceptId:
          CANCELLATION_CATEGORY_CONCEPT[dto.category],
        cancelledByUserId: actor.id,
        preventableConceptId: dto.preventable
          ? CONCEPTS.PREVENTABLE_YES
          : CONCEPTS.PREVENTABLE_NO,
        explanationText: dto.explanationText,
        rescheduleRequired: dto.rescheduleRequired ?? false,
      });

      this.casesRepo.createStatusHistory(tx, {
        procedureCaseId: caseId,
        fromStatusConceptId: surgicalCase.statusConceptId,
        toStatusConceptId: CONCEPTS.CASE_CANCELLED,
        changedByUserId: actor.id,
        reasonConceptId: dto.cancellationReasonConceptId,
        reasonText: dto.explanationText,
      });

      let operatingRoomReleased = false;
      if (surgicalCase.operatingRoomId) {
        this.casesRepo.createUtilizationEvent(tx, {
          operatingRoomId: surgicalCase.operatingRoomId,
          procedureCaseId: caseId,
          eventTypeConceptId: CONCEPTS.OR_EVENT_SLOT_RELEASED,
          delayReasonConceptId: dto.cancellationReasonConceptId,
          recordedByUserId: actor.id,
        });
        operatingRoomReleased = true;
      }

      surgicalCase.statusConceptId = CONCEPTS.CASE_CANCELLED;
      surgicalCase.cancellationReasonConceptId =
        dto.cancellationReasonConceptId;
      touch(surgicalCase, actor.id);

      return {
        id: caseId,
        statusConceptId: CONCEPTS.CASE_CANCELLED,
        cancellationId: cancellation.id,
        operatingRoomReleased,
      };
    });
  }

  /**
   * UC-53-14: generar los cargos y consolidar el uso real del quirófano. Sólo
   * un caso completado se factura: cobrar por lo que no se hizo sería el error.
   */
  async postCharges(
    caseId: string,
    dto: PostChargesDto,
    actor: AuthenticatedUser,
  ): Promise<PostChargesResponseDto> {
    this.logger.info(
      { operation: 'periop.case.charges', caseId, items: dto.items.length },
      'Posting case charges',
    );

    return this.em.transactional(async (tx) => {
      const surgicalCase = await this.casesRepo.findCaseForUpdate(tx, caseId);
      if (!surgicalCase) {
        throw new ResourceNotFoundException('Caso quirúrgico no encontrado', {
          caseId,
        });
      }
      if (surgicalCase.statusConceptId !== CONCEPTS.CASE_COMPLETED) {
        throw new PreconditionFailedException(
          'Sólo se factura un caso completado',
          {
            caseId,
            statusConceptId: surgicalCase.statusConceptId,
          },
        );
      }

      const existing = await this.casesRepo.findChargeItemsForUpdate(
        tx,
        caseId,
      );
      const alreadyPosted = existing.some(
        (item) => item.statusConceptId === CONCEPTS.CHARGE_POSTED,
      );
      if (alreadyPosted) {
        throw new ConflictException('El caso ya tiene cargos emitidos', {
          caseId,
        });
      }

      let totalAmount = 0;
      for (const item of dto.items) {
        const lineTotal = Number(item.quantity) * Number(item.unitPrice ?? '0');
        totalAmount += lineTotal;
        this.casesRepo.createChargeItem(tx, {
          procedureCaseId: caseId,
          procedureId: surgicalCase.primaryProcedureId,
          chargeItemTypeConceptId: CHARGE_TYPE_CONCEPT[item.chargeType],
          billableItemId: item.billableItemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          currencyCode: item.currencyCode,
          statusConceptId: CONCEPTS.CHARGE_POSTED,
          actorUserId: actor.id,
        });
      }

      let actualDurationSeconds: number | undefined;
      let scheduleVarianceSeconds: number | undefined;

      if (
        dto.consolidateUtilization !== false &&
        surgicalCase.operatingRoomId
      ) {
        if (surgicalCase.actualStartAt && surgicalCase.actualEndAt) {
          actualDurationSeconds = Math.round(
            (surgicalCase.actualEndAt.getTime() -
              surgicalCase.actualStartAt.getTime()) /
              1000,
          );
          // La desviación frente a lo programado es lo que mide si la agenda de
          // quirófano refleja la realidad.
          if (surgicalCase.scheduledStartAt && surgicalCase.scheduledEndAt) {
            const scheduledSeconds = Math.round(
              (surgicalCase.scheduledEndAt.getTime() -
                surgicalCase.scheduledStartAt.getTime()) /
                1000,
            );
            scheduleVarianceSeconds = actualDurationSeconds - scheduledSeconds;
          }
        }

        this.casesRepo.createUtilizationEvent(tx, {
          operatingRoomId: surgicalCase.operatingRoomId,
          procedureCaseId: caseId,
          eventTypeConceptId: CONCEPTS.OR_EVENT_CASE_END,
          durationSeconds:
            actualDurationSeconds !== undefined
              ? String(actualDurationSeconds)
              : undefined,
          recordedByUserId: actor.id,
        });

        if (dto.turnoverSeconds !== undefined) {
          this.casesRepo.createUtilizationEvent(tx, {
            operatingRoomId: surgicalCase.operatingRoomId,
            procedureCaseId: caseId,
            eventTypeConceptId: CONCEPTS.OR_EVENT_TURNOVER,
            durationSeconds: String(dto.turnoverSeconds),
            recordedByUserId: actor.id,
          });
        }
      }

      return {
        procedureCaseId: caseId,
        charged: dto.items.length,
        totalAmount: totalAmount.toFixed(2),
        actualDurationSeconds,
        scheduleVarianceSeconds,
      };
    });
  }

  // --- Apoyo ---

  /** Número de caso correlativo por tenant. */
  private async nextCaseNumber(
    tx: EntityManager,
    custodianTenantId: string,
  ): Promise<string> {
    const total = await this.casesRepo.countCases(tx, custodianTenantId);
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const candidate = `CQ-${String(total + attempt).padStart(6, '0')}`;
      if (!(await this.casesRepo.findCaseByNumber(tx, candidate)))
        return candidate;
    }
    throw new ConflictException('No se pudo asignar número de caso', {
      custodianTenantId,
    });
  }
}
