import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { ConditionsRepository } from '../repositories';
import {
  ChangeConditionClinicalStatusDto,
  CreateConditionDto,
  ConditionResponseDto,
} from '../dto';
import { Conditions } from '../entities';
import { CLIN } from '../clinical.concepts';
import { AuditTrailService } from '../../audit/services';
import { HistoryRepository } from '../../audit/repositories';
import { AUD } from '../../audit/audit.concepts';

/** Resource sellado en la cadena WORM para cada evento de condición (CAN-AUDIT-001). */
const CONDITION_AUDIT_ENTITY = 'condition';
/** Clave de `audit.conditions_history` en `HISTORY_REGISTRY`. */
const CONDITION_HISTORY_ENTITY = 'conditions';

/**
 * Patch v4.0.8: transiciones válidas de `clinicalStatusConceptId` (HL7
 * `condition-clinical`). `RECURRENCE`/`RELAPSE` son formas de estar activa de
 * nuevo —tras `RESOLVED` o `REMISSION` respectivamente— y no estados
 * terminales: por eso salen de ellas las mismas transiciones que de `ACTIVE`.
 * `RESOLVED` es terminal salvo `RECURRENCE` explícita; nunca automática.
 */
const CLINICAL_STATUS_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  [CLIN.CONDITION_ACTIVE]: [
    CLIN.CONDITION_INACTIVE,
    CLIN.CONDITION_REMISSION,
    CLIN.CONDITION_RESOLVED,
  ],
  [CLIN.CONDITION_RECURRENCE]: [
    CLIN.CONDITION_INACTIVE,
    CLIN.CONDITION_REMISSION,
    CLIN.CONDITION_RESOLVED,
  ],
  [CLIN.CONDITION_RELAPSE]: [
    CLIN.CONDITION_ACTIVE,
    CLIN.CONDITION_INACTIVE,
    CLIN.CONDITION_REMISSION,
    CLIN.CONDITION_RESOLVED,
  ],
  [CLIN.CONDITION_INACTIVE]: [CLIN.CONDITION_ACTIVE, CLIN.CONDITION_RESOLVED],
  [CLIN.CONDITION_REMISSION]: [
    CLIN.CONDITION_ACTIVE,
    CLIN.CONDITION_INACTIVE,
    CLIN.CONDITION_RELAPSE,
  ],
  [CLIN.CONDITION_RESOLVED]: [CLIN.CONDITION_RECURRENCE],
};

/**
 * UC-08-08: registro de condiciones/diagnósticos (activa + confirmada), y
 * Patch v4.0.8: transición de su estado clínico una vez registrada.
 *
 * Hasta el patch, una condición nacía activa y **no tenía a dónde ir**: no
 * había endpoint que la inactivara, resolviera o marcara en remisión, así que
 * la historia clínica acumulaba diagnósticos resueltos hace años listados
 * exactamente igual que los vigentes. `changeClinicalStatus` cierra ese hueco
 * con la máquina de {@link CLINICAL_STATUS_TRANSITIONS}, exige motivo (dato
 * regulado) y sella el cambio en la cadena WORM y en `audit.conditions_history`,
 * igual que hace la receta con `invalidate`/`replace`.
 */
@Injectable()
export class ConditionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param conditionsRepo - Valor de conditions repo requerido por la operación.
   * @param auditTrail - Cadena WORM transversal (CAN-AUDIT-001).
   * @param historyRepo - Versionado append-only (`audit.conditions_history`).
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly conditionsRepo: ConditionsRepository,
    private readonly auditTrail: AuditTrailService,
    private readonly historyRepo: HistoryRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ConditionsService.name);
  }

  /**
   * Condición activa del paciente con ese código, si ya está registrada.
   *
   * La expone `procedures_perioperative`, que declara el diagnóstico del caso
   * por código: cuando el clínico ya registró esa misma condición en consulta,
   * el caso quirúrgico debe apuntar a la que existe en vez de fallar.
   *
   * @param custodianTenantId - Tenant custodio de la historia.
   * @param patientProfileId - Paciente.
   * @param codeConceptId - Código de la condición.
   * @returns El id de la condición activa, o `null`.
   */
  async findActiveByCode(
    custodianTenantId: string,
    patientProfileId: string,
    codeConceptId: string,
  ): Promise<{ id: string } | null> {
    const found = await this.conditionsRepo.findActiveByCode(
      this.em,
      custodianTenantId,
      patientProfileId,
      codeConceptId,
      CLIN.CONDITION_ACTIVE,
    );
    return found ? { id: found.id } : null;
  }

  /** UC-08-08: registra una condición evitando duplicados activos por código. */
  async create(
    dto: CreateConditionDto,
    actor: AuthenticatedUser,
  ): Promise<ConditionResponseDto> {
    this.logger.info(
      {
        operation: 'clinical.condition.create',
        patientProfileId: dto.patientProfileId,
      },
      'Recording condition',
    );
    return this.em.transactional(async (tx) => {
      const existing = await this.conditionsRepo.findActiveByCode(
        tx,
        dto.custodianTenantId,
        dto.patientProfileId,
        dto.codeConceptId,
        CLIN.CONDITION_ACTIVE,
      );
      if (existing) {
        throw new ConflictException(
          'El paciente ya tiene esa condición activa',
          {
            patientProfileId: dto.patientProfileId,
            codeConceptId: dto.codeConceptId,
          },
        );
      }

      const condition = this.conditionsRepo.create(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        encounterId: dto.encounterId,
        codeConceptId: dto.codeConceptId,
        categoryConceptId: dto.categoryConceptId,
        clinicalStatusConceptId: CLIN.CONDITION_ACTIVE,
        verificationStatusConceptId: CLIN.CONDITION_CONFIRMED,
        severityConceptId: dto.severityConceptId,
        lateralityConceptId: dto.lateralityConceptId,
        clinicalCourseConceptId: dto.clinicalCourseConceptId,
        onsetAt: dto.onsetAt ? new Date(dto.onsetAt) : undefined,
        expectedResolutionAt: dto.expectedResolutionAt
          ? new Date(dto.expectedResolutionAt)
          : undefined,
        noteText: dto.noteText,
        recordedByUserId: actor.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.auditTrail.record(tx, actor, {
        action: 'CONDITION_RECORDED',
        entity: CONDITION_AUDIT_ENTITY,
        entityId: condition.id,
        tenantId: condition.custodianTenantId,
      });
      await this.historyRepo.append(tx, CONDITION_HISTORY_ENTITY, condition.id, {
        operationConceptId: AUD.OPERATION_INSERT,
        dataSnapshot: this.snapshot(condition),
        changedByUserId: actor.id,
      });

      this.logger.info(
        { operation: 'clinical.condition.create', conditionId: condition.id },
        'Condition recorded',
      );
      return this.toResponse(condition);
    });
  }

  /**
   * Patch v4.0.8: transiciona el estado clínico de una condición ya
   * registrada — ver {@link CLINICAL_STATUS_TRANSITIONS}.
   *
   * Una condición de curso crónico no puede pasar a `RESOLVED`: lo crónico no
   * "se resuelve" (sí puede quedar inactiva o en remisión). Fuera de esa regla,
   * la validación es sólo la máquina de estados; el motivo es siempre
   * obligatorio porque es el dato que después explica, en la auditoría, por qué
   * un diagnóstico dejó de contar como vigente.
   *
   * @param conditionId - Condición a transicionar.
   * @param dto - Estado destino y motivo (obligatorio).
   * @param actor - Quién hace el cambio.
   * @throws ResourceNotFoundException si la condición no existe.
   * @throws PreconditionFailedException si la transición no es válida desde el
   *         estado actual, o si intenta resolver una condición crónica.
   */
  async changeClinicalStatus(
    conditionId: string,
    dto: ChangeConditionClinicalStatusDto,
    actor: AuthenticatedUser,
  ): Promise<ConditionResponseDto> {
    this.logger.info(
      { operation: 'clinical.condition.change_status', conditionId },
      'Changing condition clinical status',
    );
    return this.em.transactional(async (tx) => {
      const condition = await this.loadConditionOrThrow(tx, conditionId);
      const fromStatus = condition.clinicalStatusConceptId;
      const allowed = fromStatus
        ? CLINICAL_STATUS_TRANSITIONS[fromStatus]
        : undefined;

      if (!allowed || !allowed.includes(dto.newClinicalStatusConceptId)) {
        throw new PreconditionFailedException(
          'Esa transición de estado clínico no es válida desde el estado actual',
          {
            conditionId,
            fromStatus: fromStatus ?? null,
            toStatus: dto.newClinicalStatusConceptId,
          },
        );
      }
      if (
        dto.newClinicalStatusConceptId === CLIN.CONDITION_RESOLVED &&
        condition.clinicalCourseConceptId === CLIN.CONDITION_COURSE_CHRONIC
      ) {
        throw new PreconditionFailedException(
          'Una condición de curso crónico no pasa a resuelta; marcala inactiva o en remisión',
          { conditionId },
        );
      }

      condition.clinicalStatusConceptId = dto.newClinicalStatusConceptId;
      if (dto.newClinicalStatusConceptId === CLIN.CONDITION_RESOLVED) {
        condition.resolvedAt = new Date();
      } else if (fromStatus === CLIN.CONDITION_RESOLVED) {
        // Sale de RESOLVED (única vía: RECURRENCE) — la fecha de resolución
        // anterior ya no describe el estado vigente de la condición.
        condition.resolvedAt = undefined;
      }
      touch(condition, actor.id);
      await tx.flush();

      await this.auditTrail.record(tx, actor, {
        action: 'CONDITION_STATUS_CHANGED',
        entity: CONDITION_AUDIT_ENTITY,
        entityId: condition.id,
        tenantId: condition.custodianTenantId,
      });
      await this.historyRepo.append(tx, CONDITION_HISTORY_ENTITY, condition.id, {
        operationConceptId: AUD.OPERATION_UPDATE,
        dataSnapshot: this.snapshot(condition),
        changedByUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'clinical.condition.change_status',
          conditionId,
          fromStatus,
          toStatus: dto.newClinicalStatusConceptId,
          reason: dto.reasonText,
        },
        'Condition clinical status changed',
      );
      return this.toResponse(condition);
    });
  }

  /** Condición por id, o `ResourceNotFoundException`. */
  private async loadConditionOrThrow(
    tx: EntityManager,
    conditionId: string,
  ): Promise<Conditions> {
    const condition = await this.conditionsRepo.findById(tx, conditionId);
    if (!condition) {
      throw new ResourceNotFoundException('Condición no encontrada', {
        conditionId,
      });
    }
    return condition;
  }

  /** Snapshot del contenido clínico, para `audit.conditions_history`. */
  private snapshot(condition: Conditions): Record<string, unknown> {
    return {
      codeConceptId: condition.codeConceptId,
      categoryConceptId: condition.categoryConceptId,
      clinicalStatus: condition.clinicalStatusConceptId,
      verificationStatus: condition.verificationStatusConceptId,
      severityConceptId: condition.severityConceptId,
      clinicalCourseConceptId: condition.clinicalCourseConceptId,
      onsetAt: condition.onsetAt,
      expectedResolutionAt: condition.expectedResolutionAt,
      resolvedAt: condition.resolvedAt,
    };
  }

  private toResponse(condition: Conditions): ConditionResponseDto {
    return {
      id: condition.id,
      patientProfileId: condition.patientProfileId,
      clinicalStatus: condition.clinicalStatusConceptId ?? null,
      verificationStatus: condition.verificationStatusConceptId ?? null,
      clinicalCourse: condition.clinicalCourseConceptId ?? null,
      createdAt: condition.createdAt,
    };
  }
}
