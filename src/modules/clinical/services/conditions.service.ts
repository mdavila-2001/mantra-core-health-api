import { ForbiddenException, Injectable } from '@nestjs/common';
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
  ConditionItemDto,
  ConditionResponseDto,
  ConditionVerificationDto,
  ConditionVerificationEvidenceDto,
  DiagnosisEvidenceDto,
  VerifyConditionDto,
} from '../dto';
import { Conditions, DiagnosticReports, ServiceRequests } from '../entities';
import { ClinicalNoteHeaders } from '../../chart/entities';
import { VERIFICATION_SNAPSHOT_KEY } from './condition-verification';
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
 * Estados de verificación con los que puede nacer un diagnóstico. Refutado no
 * está: un diagnóstico no se registra ya descartado, se descarta después de
 * estudiarlo.
 */
const CREATION_VERIFICATION_STATUSES: readonly string[] = [
  CLIN.CONDITION_PROVISIONAL,
  CLIN.CONDITION_CONFIRMED,
];

/** Cursos clínicos del catálogo: lo único que la verificación acepta como curso. */
const CLINICAL_COURSES: readonly string[] = [
  CLIN.CONDITION_COURSE_ACUTE,
  CLIN.CONDITION_COURSE_CHRONIC,
  CLIN.CONDITION_COURSE_SUBACUTE,
  CLIN.CONDITION_COURSE_RECURRENT,
  CLIN.CONDITION_COURSE_UNKNOWN,
];

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
    // Antes de abrir la transacción: es una regla del cuerpo, no del paciente.
    if (
      dto.verificationStatusConceptId !== undefined &&
      !CREATION_VERIFICATION_STATUSES.includes(dto.verificationStatusConceptId)
    ) {
      throw new PreconditionFailedException(
        'Un diagnóstico se registra presuntivo o confirmado.',
        { field: 'verificationStatusConceptId' },
      );
    }
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
        verificationStatusConceptId:
          dto.verificationStatusConceptId ?? CLIN.CONDITION_CONFIRMED,
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
   * C3 / P41: confirma o refuta un diagnóstico presuntivo.
   *
   * ## Qué cambia
   *
   * - `CONFIRMED`: verificación confirmada y estado clínico activo; fija el
   *   inicio, el fin esperado y el curso si vienen. Un curso crónico se
   *   confirma **sin** fin esperado: lo crónico no se resuelve.
   * - `REFUTED`: verificación refutada y estado clínico inactivo. Inactivo y no
   *   activo a propósito: el alta rechaza un duplicado **activo** del mismo
   *   código, y un descartado no puede impedir registrar el diagnóstico si
   *   aparece de verdad más adelante.
   *
   * ## Qué exige (422, el espejo del diálogo del front)
   *
   * Motivo **o** evidencia; al confirmar, inicio (el del cuerpo o el que ya
   * tenía) y fin esperado salvo curso crónico, con el fin no anterior al
   * inicio. La evidencia tiene que ser **de este paciente**: una nota o un
   * estudio ajeno no respalda nada, y aceptarlo filtraría su existencia.
   *
   * ## Dónde queda la decisión
   *
   * En `audit.conditions_history`, bajo `verification` del `data_snapshot`
   * (decisión D-BR14-04: sin columna nueva). La lectura del resumen la toma de
   * la última revisión que la contiene.
   *
   * ## Autorización
   *
   * Como `change-status` y `attachments` (MCH-007): el paciente sólo se conoce
   * al cargar la condición, así que la política de escritura sobre la historia
   * la aplica el servicio, no `ClinicalRecordAccessGuard`.
   *
   * @param conditionId - El presuntivo a decidir.
   * @param dto - Resultado, motivo y/o evidencia, y fechas al confirmar.
   * @param actor - Profesional que decide; su perfil queda como autor.
   * @returns La condición entera, como la lista el resumen clínico.
   * @throws ResourceNotFoundException si la condición no existe.
   * @throws ForbiddenException si no puede escribir en la historia del
   *         paciente, o la sesión no tiene perfil profesional.
   * @throws ConflictException si la condición ya estaba confirmada o refutada.
   * @throws PreconditionFailedException si falta sustento, fechas, o la
   *         evidencia no es del paciente.
   */
  async verify(
    conditionId: string,
    dto: VerifyConditionDto,
    actor: AuthenticatedUser,
  ): Promise<ConditionItemDto> {
    this.logger.info(
      {
        operation: 'clinical.condition.verify',
        conditionId,
        outcome: dto.outcome,
      },
      'Verifying condition',
    );
    const decidedByProfileId = actor.practitionerProfileId;
    if (!decidedByProfileId) {
      throw new ForbiddenException(
        'La sesión no tiene un perfil profesional con el que decidir el diagnóstico.',
      );
    }
    return this.em.transactional(async (tx) => {
      const condition = await this.loadConditionForWrite(
        tx,
        conditionId,
        actor,
      );

      const actual = condition.verificationStatusConceptId;
      if (
        actual === CLIN.CONDITION_CONFIRMED ||
        actual === CLIN.CONDITION_REFUTED
      ) {
        throw new ConflictException(
          'Ese diagnóstico ya fue decidido: sólo un presuntivo se confirma o se rechaza',
          { conditionId, verificationStatus: actual },
        );
      }

      const reasonText = dto.reasonText?.trim() || undefined;
      if (reasonText === undefined && dto.basedOn === undefined) {
        throw new PreconditionFailedException(
          'Escribí el motivo o elegí una evidencia: al menos uno de los dos.',
          { conditionId, field: 'reasonText' },
        );
      }
      const basedOn = dto.basedOn
        ? await this.resolveEvidenceOfPatient(
            tx,
            dto.basedOn,
            condition.patientProfileId,
          )
        : null;

      const now = new Date();
      if (dto.outcome === 'CONFIRMED') {
        this.applyConfirmation(condition, dto, now);
      } else {
        // Refutado es terminal y cierra la condición: no hay enfermedad que
        // seguir. Inactiva, además, para no bloquear un alta futura del mismo
        // código (el duplicado se mide contra las activas).
        condition.verificationStatusConceptId = CLIN.CONDITION_REFUTED;
        condition.clinicalStatusConceptId = CLIN.CONDITION_INACTIVE;
        condition.resolvedAt = now;
      }
      touch(condition, actor.id);
      await tx.flush();

      const verification: ConditionVerificationDto = {
        outcome: dto.outcome,
        decidedAt: now.toISOString(),
        decidedByProfileId,
        reasonText: reasonText ?? null,
        basedOn,
      };

      await this.auditTrail.record(tx, actor, {
        action:
          dto.outcome === 'CONFIRMED'
            ? 'CONDITION_CONFIRMED'
            : 'CONDITION_REFUTED',
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
          dataSnapshot: {
            ...this.snapshot(condition),
            [VERIFICATION_SNAPSHOT_KEY]: verification,
          },
          changedByUserId: actor.id,
        },
      );

      this.logger.info(
        {
          operation: 'clinical.condition.verify',
          conditionId,
          outcome: dto.outcome,
          // Nada de texto libre en el log (regla 90.2.7): el motivo va en la
          // auditoría, no acá.
        },
        'Condition verified',
      );
      return this.toItem(condition, verification);
    });
  }

  /**
   * Aplica la confirmación sobre la condición, validando las fechas.
   *
   * @param condition - El presuntivo cargado.
   * @param dto - La decisión.
   * @param now - Instante de la decisión (el inicio no puede ser posterior).
   * @throws PreconditionFailedException si falta el inicio, el fin esperado
   *         (salvo crónico), o el fin es anterior al inicio.
   */
  private applyConfirmation(
    condition: Conditions,
    dto: VerifyConditionDto,
    now: Date,
  ): void {
    const onsetAt = dto.onsetAt ? new Date(dto.onsetAt) : condition.onsetAt;
    if (!onsetAt) {
      throw new PreconditionFailedException(
        'Indicá desde cuándo la persona presenta la condición.',
        { conditionId: condition.id, field: 'onsetAt' },
      );
    }
    if (onsetAt.getTime() > now.getTime()) {
      throw new PreconditionFailedException(
        'El inicio de la condición no puede ser futuro.',
        { conditionId: condition.id, field: 'onsetAt' },
      );
    }

    if (
      dto.clinicalCourseConceptId !== undefined &&
      !CLINICAL_COURSES.includes(dto.clinicalCourseConceptId)
    ) {
      throw new PreconditionFailedException(
        'El curso clínico no es uno del catálogo.',
        { conditionId: condition.id, field: 'clinicalCourseConceptId' },
      );
    }
    const course =
      dto.clinicalCourseConceptId ?? condition.clinicalCourseConceptId;
    const cronica = course === CLIN.CONDITION_COURSE_CHRONIC;

    // Una crónica no resuelve: el fin esperado se descarta aunque viniera en
    // el cuerpo o en el alta, igual que hace el diálogo al marcarla.
    let expectedResolutionAt: Date | undefined;
    if (!cronica) {
      expectedResolutionAt = dto.expectedResolutionAt
        ? new Date(dto.expectedResolutionAt)
        : condition.expectedResolutionAt;
      if (!expectedResolutionAt) {
        throw new PreconditionFailedException(
          'Indicá hasta cuándo se espera la condición, o marcala como crónica.',
          { conditionId: condition.id, field: 'expectedResolutionAt' },
        );
      }
      if (expectedResolutionAt.getTime() < onsetAt.getTime()) {
        throw new PreconditionFailedException(
          'El fin esperado no puede ser anterior al inicio.',
          { conditionId: condition.id, field: 'expectedResolutionAt' },
        );
      }
    }

    condition.verificationStatusConceptId = CLIN.CONDITION_CONFIRMED;
    condition.clinicalStatusConceptId = CLIN.CONDITION_ACTIVE;
    condition.onsetAt = onsetAt;
    condition.expectedResolutionAt = expectedResolutionAt;
    condition.clinicalCourseConceptId = course;
  }

  /**
   * La evidencia resuelta contra lo que el paciente tiene, o 422.
   *
   * Tiene que existir y ser del mismo paciente que la condición. Un
   * identificador ajeno responde igual que uno inexistente, para que la ruta
   * no sirva para averiguar qué notas o estudios tiene otra persona.
   *
   * Lo que se guarda es lo resuelto, no lo que vino: una nota trae su
   * consulta, y un informe nombra su orden. Así la lectura no tiene que volver
   * a cruzar nada. Es la misma regla que el simulador del front
   * (`diagnosis-verification.handlers.ts`).
   *
   * @param tx - Transacción activa.
   * @param evidence - La evidencia declarada.
   * @param patientProfileId - El paciente de la condición.
   * @returns La evidencia resuelta.
   * @throws PreconditionFailedException si falta el identificador que su clase
   *         exige, o alguno no existe o no es de este paciente.
   */
  private async resolveEvidenceOfPatient(
    tx: EntityManager,
    evidence: DiagnosisEvidenceDto,
    patientProfileId: string,
  ): Promise<ConditionVerificationEvidenceDto> {
    const invalida = (motivo: string): PreconditionFailedException =>
      new PreconditionFailedException(motivo, { field: 'basedOn' });

    if (evidence.kind === 'NOTE') {
      const nota = evidence.noteId
        ? await tx.findOne(ClinicalNoteHeaders, {
            id: evidence.noteId,
            patientProfileId,
          })
        : null;
      if (!nota) {
        throw invalida('La nota indicada no existe o no es de esta persona.');
      }
      return {
        kind: 'NOTE',
        noteId: nota.id,
        ...(nota.encounterId ? { encounterId: nota.encounterId } : {}),
      };
    }

    const informe = evidence.diagnosticReportId
      ? await tx.findOne(DiagnosticReports, {
          id: evidence.diagnosticReportId,
          patientProfileId,
        })
      : null;
    if (evidence.diagnosticReportId && !informe) {
      throw invalida('El informe indicado no existe o no es de esta persona.');
    }
    const ordenId = evidence.serviceRequestId ?? informe?.serviceRequestId;
    const orden = ordenId
      ? await tx.findOne(ServiceRequests, { id: ordenId, patientProfileId })
      : null;
    if (!orden) {
      throw invalida('La orden indicada no existe o no es de esta persona.');
    }
    return {
      kind: 'ANALYSIS',
      serviceRequestId: orden.id,
      ...(informe ? { diagnosticReportId: informe.id } : {}),
    };
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

  /**
   * La condición entera, con la misma forma que la lista del resumen clínico:
   * el front reemplaza la fila con lo que el servidor dice.
   */
  private toItem(
    condition: Conditions,
    verification: ConditionVerificationDto | null,
  ): ConditionItemDto {
    return {
      id: condition.id,
      codeConceptId: condition.codeConceptId,
      categoryConceptId: condition.categoryConceptId,
      clinicalStatusConceptId: condition.clinicalStatusConceptId,
      verificationStatusConceptId: condition.verificationStatusConceptId,
      severityConceptId: condition.severityConceptId,
      encounterId: condition.encounterId,
      clinicalCourseConceptId: condition.clinicalCourseConceptId,
      lateralityConceptId: condition.lateralityConceptId,
      onsetAt: condition.onsetAt,
      expectedResolutionAt: condition.expectedResolutionAt,
      resolvedAt: condition.resolvedAt,
      noteText: condition.noteText,
      verification,
      createdAt: condition.createdAt,
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
