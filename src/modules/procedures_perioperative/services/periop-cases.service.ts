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
  UpdateCaseDto,
  UpdateCaseResponseDto,
  ConfirmCaseResponseDto,
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
 * C-13 (CAN-INT-001): estado "borrador" del caso. Es el único en el que el
 * modelo REDESA todavía permite corregir el paciente de la intervención. El
 * sistema no tiene un estado DRAFT propio: el caso nace ya `CASE_SCHEDULED`, que
 * es su estado editable inicial (antes de que verificación de órdenes /
 * confirmación lo fijen). `CASE_READY_FOR_SURGERY` equivale a
 * "pendiente de confirmación" en adelante, y `SURGICAL_CASE_IN_PROGRESS` /
 * `CASE_COMPLETED` a "confirmado/iniciado", donde el cambio queda prohibido.
 */
const CASE_DRAFT_STATE: string = CONCEPTS.CASE_SCHEDULED;

/**
 * C-14 (CAN-INT-002): roles del equipo que exigen credencial profesional
 * vigente antes de confirmar o iniciar la intervención. Todos los roles
 * perioperatorios son clínicos y por tanto la exigen.
 */
const CREDENTIAL_REQUIRED_TEAM_ROLES: readonly string[] = [
  CONCEPTS.TEAM_ROLE_SURGEON,
  CONCEPTS.TEAM_ROLE_ASSISTANT,
  CONCEPTS.TEAM_ROLE_ANESTHESIOLOGIST,
  CONCEPTS.TEAM_ROLE_SCRUB_NURSE,
  CONCEPTS.TEAM_ROLE_CIRCULATING_NURSE,
];

/**
 * C-14 (CAN-INT-002): estados del miembro que acreditan una credencial
 * profesional VIGENTE/verificada. Fuente documentada: la vigencia autoritativa
 * de la credencial vive en `iam.authentication_credentials` / el perfil
 * profesional (`profiles`), fuera del alcance de este módulo. Aquí se usa el
 * estado de verificación del propio miembro del equipo
 * (`procedure_case_team_members.status_concept_id`) como fuente local: sólo
 * `TEAM_ACCEPTED` cuenta como vigente. Cualquier otro estado (asignado sin
 * aceptar/verificar) se trata como NO vigente (fail-closed).
 */
const CREDENTIAL_CURRENT_MEMBER_STATES: readonly string[] = [
  CONCEPTS.TEAM_ACCEPTED,
];

/** Estados del caso desde los que tiene sentido confirmarlo (C-14). */
const CONFIRMABLE_CASE_STATES: readonly string[] = [
  CONCEPTS.CASE_SCHEDULED,
  CONCEPTS.CASE_READY_FOR_SURGERY,
];

/**
 * Gobierno del caso quirúrgico: programación, diagnósticos y equipo,
 * cancelación y cargos (UC-53-01, 02, 13, 14).
 */
@Injectable()
export class PeriopCasesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param casesRepo - Valor de cases repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
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
   * C-13 (CAN-INT-001): modificar los datos del caso. El paciente de la
   * intervención sólo puede corregirse mientras el caso está en borrador
   * (`CASE_SCHEDULED`) y no arrastra dependencias (asignaciones de equipo más
   * allá del cirujano principal sembrado, ni diagnósticos/evidencias). Desde
   * "pendiente de confirmación" (`CASE_READY_FOR_SURGERY`) en adelante, cambiar
   * el paciente no se permite en la modificación general: el caso debe
   * cancelarse y crearse uno nuevo. Desde "confirmado/iniciado"
   * (`SURGICAL_CASE_IN_PROGRESS` / `CASE_COMPLETED`) está prohibido.
   */
  async updateCase(
    caseId: string,
    dto: UpdateCaseDto,
    actor: AuthenticatedUser,
  ): Promise<UpdateCaseResponseDto> {
    this.logger.info(
      { operation: 'periop.case.update', caseId },
      'Updating surgical case',
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

      let patientChanged = false;
      if (
        dto.patientProfileId &&
        dto.patientProfileId !== surgicalCase.patientProfileId
      ) {
        // C-13: el cambio de paciente sólo cabe con el caso en borrador.
        if (surgicalCase.statusConceptId !== CASE_DRAFT_STATE) {
          throw new PreconditionFailedException(
            'CAN-INT-001: el paciente de la intervención no puede cambiarse una vez confirmada; cancele el caso y cree uno nuevo',
            {
              code: 'CAN-INT-001',
              caseId,
              statusConceptId: surgicalCase.statusConceptId,
            },
          );
        }
        // C-13: aun en borrador, con consentimientos/asignaciones/evidencias ya
        // ligados al paciente actual, corregirlo dejaría esos datos huérfanos.
        if (await this.caseHasBlockingDependencies(tx, surgicalCase)) {
          throw new PreconditionFailedException(
            'CAN-INT-001: el paciente no puede cambiarse: el caso ya tiene asignaciones o evidencias asociadas',
            { code: 'CAN-INT-001', caseId },
          );
        }
        surgicalCase.patientProfileId = dto.patientProfileId;
        patientChanged = true;
      }

      if (dto.priority) {
        surgicalCase.priorityConceptId = PRIORITY_CONCEPT[dto.priority];
      }
      if (dto.urgencyReasonText !== undefined) {
        surgicalCase.urgencyReasonText = dto.urgencyReasonText;
      }
      if (dto.scheduledStartAt) {
        surgicalCase.scheduledStartAt = new Date(dto.scheduledStartAt);
      }
      if (dto.scheduledEndAt) {
        surgicalCase.scheduledEndAt = new Date(dto.scheduledEndAt);
      }
      if (
        surgicalCase.scheduledStartAt &&
        surgicalCase.scheduledEndAt &&
        surgicalCase.scheduledEndAt <= surgicalCase.scheduledStartAt
      ) {
        throw new PreconditionFailedException(
          'El caso debe terminar después de empezar',
          { caseId },
        );
      }

      touch(surgicalCase, actor.id);

      return {
        id: caseId,
        statusConceptId: surgicalCase.statusConceptId,
        patientProfileId: surgicalCase.patientProfileId,
        patientChanged,
      };
    });
  }

  /**
   * C-14 (CAN-INT-002): confirmar la intervención. Antes de fijar el equipo y
   * dejar el caso listo para operar, cada integrante que requiere credencial
   * profesional debe tenerla VIGENTE (verificada). Si alguno no la tiene, se
   * bloquea la transición (fail-closed) y se deja el gancho de notificación al
   * médico responsable y a la organización. Confirmar precede a INICIAR (la
   * inducción anestésica), por lo que este mismo control cubre ambos momentos.
   */
  async confirmCase(
    caseId: string,
    actor: AuthenticatedUser,
  ): Promise<ConfirmCaseResponseDto> {
    this.logger.info(
      { operation: 'periop.case.confirm', caseId },
      'Confirming surgical case',
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
      if (!CONFIRMABLE_CASE_STATES.includes(surgicalCase.statusConceptId)) {
        throw new PreconditionFailedException(
          'El caso no admite confirmación en su estado actual',
          { caseId, statusConceptId: surgicalCase.statusConceptId },
        );
      }

      const team = await this.casesRepo.findTeamByCase(tx, caseId);
      // C-14: cada integrante con rol que exige credencial debe estar vigente.
      const withoutCurrentCredential = team.filter(
        (member) =>
          CREDENTIAL_REQUIRED_TEAM_ROLES.includes(member.teamRoleConceptId) &&
          !CREDENTIAL_CURRENT_MEMBER_STATES.includes(member.statusConceptId),
      );
      if (withoutCurrentCredential.length > 0) {
        // Gancho de notificación: avisar al médico responsable del caso
        // (cirujano principal) y a la organización custodia de que la
        // confirmación se bloqueó por credenciales no vigentes. El envío real
        // (correo/evento) lo resolverá el módulo de notificaciones; aquí se deja
        // registrada la intención con los datos necesarios.
        this.logger.warn(
          {
            operation: 'periop.case.confirm.blocked',
            code: 'CAN-INT-002',
            caseId,
            custodianTenantId: surgicalCase.custodianTenantId,
            responsibleProfileId: surgicalCase.primarySurgeonProfileId,
            memberIds: withoutCurrentCredential.map((m) => m.id),
          },
          'Blocked case confirmation: team members without current professional credential',
        );
        throw new PreconditionFailedException(
          'CAN-INT-002: no puede confirmarse: hay integrantes del equipo sin credencial profesional vigente',
          {
            code: 'CAN-INT-002',
            caseId,
            membersWithoutCurrentCredential: withoutCurrentCredential.map(
              (m) => m.id,
            ),
          },
        );
      }

      let statusConceptId = surgicalCase.statusConceptId;
      if (statusConceptId === CONCEPTS.CASE_SCHEDULED) {
        statusConceptId = CONCEPTS.CASE_READY_FOR_SURGERY;
        this.casesRepo.createStatusHistory(tx, {
          procedureCaseId: caseId,
          fromStatusConceptId: surgicalCase.statusConceptId,
          toStatusConceptId: statusConceptId,
          changedByUserId: actor.id,
          reasonText: 'Confirmación: credenciales del equipo verificadas',
        });
        surgicalCase.statusConceptId = statusConceptId;
      }
      touch(surgicalCase, actor.id);

      return { id: caseId, statusConceptId, teamVerified: team.length };
    });
  }

  /**
   * C-13: ¿arrastra el caso dependencias que impiden reasignar el paciente?
   * Como los consentimientos y buena parte de la evidencia clínica viven en
   * otros módulos, aquí se comprueban las señales locales: asignaciones de
   * equipo más allá del cirujano principal sembrado al programar, y diagnósticos
   * ya registrados. Fail-closed: ante cualquiera de ellas, no se permite el
   * cambio.
   */
  private async caseHasBlockingDependencies(
    tx: EntityManager,
    surgicalCase: {
      /**
       * Identificador único de la instancia.
       */
      id: string; /**
       * Identificador asociado a primary surgeon profile.
       */
      primarySurgeonProfileId?: string;
    },
  ): Promise<boolean> {
    const team = await this.casesRepo.findTeamByCase(tx, surgicalCase.id);
    const extraAssignments = team.some(
      (member) =>
        member.practitionerProfileId !== surgicalCase.primarySurgeonProfileId,
    );
    if (extraAssignments) return true;

    const diagnoses = await this.casesRepo.findDiagnosesByCase(
      tx,
      surgicalCase.id,
    );
    return diagnoses.length > 0;
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
