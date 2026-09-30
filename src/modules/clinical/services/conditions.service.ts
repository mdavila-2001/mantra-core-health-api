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
import { ConditionsRepository, EncountersRepository } from '../repositories';
import {
  AttachFileToConditionDto,
  ChangeConditionClinicalStatusDto,
  CreateConditionDto,
  ConditionResponseDto,
} from '../dto';
import { Conditions } from '../entities';
import { ClinicalReadService } from './clinical-read.service';
// BR-14 (CL-07): un encuentro sellado no admite más escrituras que lo
// referencien. Archivo y servicio nuevos, independientes.
import { EncounterSealGuardService } from './encounter-seal-guard.service';
import { CLIN } from '../clinical.concepts';
import { AuditTrailService } from '../../audit/services';
import { HistoryRepository } from '../../audit/repositories';
import { AUD } from '../../audit/audit.concepts';
// ALV-033 (reemplazo de ALV-032): un archivo se liga a ESTE diagnóstico, no al
// paciente en general. `createLink` es el único punto de la app que escribe
// `common.file_links`; reusarlo evita una segunda forma de vincular archivos.
import { FilesService } from '../../common/services';
import { OwnerType, type FileLinkResponseDto } from '../../common/dto';

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
const CLINICAL_STATUS_TRANSITIONS: Readonly<Record<string, readonly string[]>> =
  {
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
   * @param encountersRepo - Coherencia paciente/custodio del encuentro (MCH-008.2).
   * @param auditTrail - Cadena WORM transversal (CAN-AUDIT-001).
   * @param historyRepo - Versionado append-only (`audit.conditions_history`).
   * @param logger - Valor de logger requerido por la operación.
   * @param filesService - Liga un archivo ya subido a esta condición (ALV-033).
   * @param clinicalRead - Política de escritura sobre la historia (MCH-007).
   * @param encounterSealGuard - Rechaza la escritura si el encuentro está sellado (BR-14/CL-07).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly conditionsRepo: ConditionsRepository,
    private readonly encountersRepo: EncountersRepository,
    private readonly auditTrail: AuditTrailService,
    private readonly historyRepo: HistoryRepository,
    private readonly logger: PinoLogger,
    private readonly filesService: FilesService,
    private readonly clinicalRead: ClinicalReadService,
    private readonly encounterSealGuard: EncounterSealGuardService,
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

  /**
   * MCH-008.2: el encuentro tiene que ser del mismo paciente y del mismo
   * custodio que la condición, no sólo existir.
   *
   * Antes se comprobaba únicamente la existencia del id: una condición del
   * paciente A podía colgar del encuentro de B, o de otro tenant, y la FK lo
   * aceptaba porque sólo demuestra existencia. El custodio que se compara es
   * `dto.custodianTenantId`, que el interceptor de tenant ya obligó a ser el
   * tenant activo del actor.
   *
   * Una referencia incoherente responde 404, igual que una inexistente —el
   * mismo criterio que `ObservationsService.assertReferencesBelongToPatient`
   * y que `ServiceRequestsService.checkDuplicate`—: distinguirlas le diría al
   * cliente que ese id existe en otra historia u otro tenant.
   */
  private async assertEncounterBelongsToPatient(
    tx: EntityManager,
    dto: CreateConditionDto,
  ): Promise<void> {
    if (!dto.encounterId) return;
    const encounter = await this.encountersRepo.findById(tx, dto.encounterId);
    if (
      !encounter ||
      encounter.patientProfileId !== dto.patientProfileId ||
      encounter.tenantId !== dto.custodianTenantId
    ) {
      throw new ResourceNotFoundException('Encuentro no encontrado', {
        encounterId: dto.encounterId,
      });
    }
    // BR-14 (CL-07): el encuentro tiene que seguir abierto para admitir un
    // diagnóstico nuevo contra él.
    await this.encounterSealGuard.assertEncounterWritable(tx, dto.encounterId);
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
      // El encuentro se valida antes que el duplicado: un encuentro ajeno no
      // debe enterarse, vía 409, de que el paciente ya tiene esa condición.
      await this.assertEncounterBelongsToPatient(tx, dto);

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
      await this.historyRepo.append(
        tx,
        CONDITION_HISTORY_ENTITY,
        condition.id,
        {
          operationConceptId: AUD.OPERATION_INSERT,
          dataSnapshot: this.snapshot(condition),
          changedByUserId: actor.id,
        },
      );

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
      const condition = await this.loadConditionForWrite(
        tx,
        conditionId,
        actor,
      );
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
      await this.historyRepo.append(
        tx,
        CONDITION_HISTORY_ENTITY,
        condition.id,
        {
          operationConceptId: AUD.OPERATION_UPDATE,
          // BR-14 (CL-10), decisión (b) — D-BR14-04: sin columna nueva en
          // `clinical.conditions` (sin DDL en la API), el motivo se guarda
          // dentro del registro append-only de `audit.conditions_history`.
          // `audit.conditions_history.data_snapshot` es jsonb de forma libre
          // (ver `HistoryRepository.append`): agregar una clave acá no exige
          // cambiar el modelo.
          dataSnapshot: {
            ...this.snapshot(condition),
            statusChangeReasonText: dto.reasonText,
          },
          changedByUserId: actor.id,
        },
      );

      this.logger.info(
        {
          operation: 'clinical.condition.change_status',
          conditionId,
          fromStatus,
          toStatus: dto.newClinicalStatusConceptId,
          // BR-14 (CL-10): nada de texto libre en el log — sólo ids y
          // conceptos (regla 90.2.7). El motivo va en la auditoría, no acá.
        },
        'Condition clinical status changed',
      );
      return this.toResponse(condition);
    });
  }

  /**
   * Liga un archivo ya subido a este diagnóstico (ALV-033, reemplazo de
   * ALV-032). El archivo se sube antes por separado
   * (`POST /common/files` → `POST /common/files/:id/versions`); esto sólo
   * registra a qué condición corresponde, no mueve bytes.
   *
   * Mismo umbral de autorización que registrar la condición (MCH-007): poder
   * escribir en la historia de su paciente. `create()` lo resuelve el guard,
   * que ve al paciente en el cuerpo; acá el paciente sólo se conoce cargando
   * la condición, así que lo resuelve el servicio.
   *
   * @param conditionId - La condición a la que se liga el archivo.
   * @param dto - El archivo ya subido.
   * @param actor - Quién liga el archivo.
   * @throws ResourceNotFoundException si la condición no existe.
   */
  async attachFile(
    conditionId: string,
    dto: AttachFileToConditionDto,
    actor: AuthenticatedUser,
  ): Promise<FileLinkResponseDto> {
    const condition = await this.loadConditionForWrite(
      this.em,
      conditionId,
      actor,
    );
    this.logger.info(
      {
        operation: 'clinical.condition.attach_file',
        conditionId,
        fileId: dto.fileId,
      },
      'Attaching file to condition',
    );
    return this.filesService.createLink(
      dto.fileId,
      { ownerType: OwnerType.CONDITION, ownerId: condition.id },
      actor,
    );
  }

  /**
   * Condición por id, sólo si el actor puede escribir en la historia de su
   * paciente (MCH-007). El paciente sale de la fila, nunca de la petición: las
   * mutaciones por id no traen paciente que el guard pueda evaluar.
   */
  private async loadConditionForWrite(
    tx: EntityManager,
    conditionId: string,
    actor: AuthenticatedUser,
  ): Promise<Conditions> {
    const condition = await this.loadConditionOrThrow(tx, conditionId);
    await this.clinicalRead.assertPuedeEscribirHistoria(
      condition.patientProfileId,
      actor,
    );
    return condition;
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
