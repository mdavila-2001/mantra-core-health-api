import { HttpStatus, Injectable } from '@nestjs/common';
import type { EntityName } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
  ResourceNotFoundException,
  SEED,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  TreatmentInformedConsentsRepository,
  ConsentEventsRepository,
  ConsentEvidenceRepository,
} from '../repositories';
import { ConsentEvidence, TreatmentInformedConsents } from '../entities';
import { CONS } from '../consent.concepts';
import { ConsentErrorReason } from '../consent.error-reasons';
import type { InformedConsentTargetType } from '../informed-consent.enums';
import { ClinicalReadService } from '../../clinical/services';
import { EncountersRepository } from '../../clinical/repositories';
import {
  MedicationRequests,
  Procedures,
  ServiceRequests,
} from '../../clinical/entities';
import { CarePlans } from '../../chart/entities';
import { Referrals } from '../../clinical_ext/entities';
import { ConsentEvidenceService } from './consent-evidence.service';
import type {
  ConsentEvidenceResponseDto,
  CreateTreatmentInformedConsentDto,
  ListTreatmentInformedConsentsQueryDto,
  PostEmergencyInformationDto,
  RecordTreatmentConsentEvidenceDto,
  TreatmentInformedConsentListDto,
  TreatmentInformedConsentResponseDto,
  WithdrawTreatmentInformedConsentDto,
} from '../dto';

/** Idioma de la información cuando no se declara (enmienda 1: default lógico). */
const DEFAULT_INFORMATION_LANGUAGE = 'es';

/**
 * Entidad que respalda cada `targetType`: todas tienen `patientProfileId`, que
 * es lo que permite verificar que el objeto consentido es del mismo paciente.
 */
/** Lo único que se lee del objeto consentido. */
interface ConsentTargetRow {
  /** Identificador. */
  id: string;
  /** Paciente titular. */
  patientProfileId: string;
}

const TARGET_ENTITIES: Record<
  InformedConsentTargetType,
  EntityName<ConsentTargetRow>
> = {
  MEDICATION_REQUEST: MedicationRequests,
  SERVICE_REQUEST: ServiceRequests,
  REFERRAL: Referrals,
  PROCEDURE: Procedures,
  CARE_PLAN: CarePlans,
};

/** Roles que conservan el camino administrativo original de UC-07-08. */
const ADMIN_ROLES = ['SECURITY_ADMIN', 'SUPERADMIN'];

/**
 * 400 de validación con `reason` estable.
 *
 * @param reason - Sub-código estable.
 * @param message - Texto para humanos.
 * @param fields - Campos implicados.
 * @returns La excepción.
 */
function invalid(
  reason: ConsentErrorReason,
  message: string,
  fields: string[],
): DomainException {
  return new DomainException(
    HttpStatus.BAD_REQUEST,
    ErrorCode.VALIDATION_FAILED,
    message,
    { fields },
    reason,
  );
}

/**
 * UC-07-08: consentimiento informado de tratamiento.
 *
 * v4263 lo vuelve **dirigido**: puede apuntar a una receta, una orden de
 * estudio, una derivación, un procedimiento o un plan de cuidados, con los
 * elementos de información que exige la norma, quién otorga y bajo qué
 * excepción legal. Se puede listar por paciente/objeto, leer y revocar; la
 * evidencia de firma se registra con el servicio de evidencia existente
 * (`consent.consent_evidence`) y se devuelve con cada consentimiento.
 *
 * La autoridad es la API: el paciente y el tenant salen del encuentro para el
 * profesional, y leer/escribir exige la misma base sobre la historia que el
 * resto del expediente (`ClinicalReadService`).
 */
@Injectable()
export class TreatmentInformedConsentsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param treatmentRepo - Consentimientos de tratamiento.
   * @param eventsRepo - Eventos append-only.
   * @param evidenceRepo - Lectura de evidencia.
   * @param evidenceService - Registro de evidencia (UC existente).
   * @param encounters - Encuentros clínicos.
   * @param clinicalRead - Autorización sobre la historia del paciente.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly treatmentRepo: TreatmentInformedConsentsRepository,
    private readonly eventsRepo: ConsentEventsRepository,
    private readonly evidenceRepo: ConsentEvidenceRepository,
    private readonly evidenceService: ConsentEvidenceService,
    private readonly encounters: EncountersRepository,
    private readonly clinicalRead: ClinicalReadService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(TreatmentInformedConsentsService.name);
  }

  /**
   * Entrada de `POST /consent/treatment-informed-consents`.
   *
   * `SECURITY_ADMIN` conserva el camino original (paciente y tenant del
   * cuerpo). Un profesional entra con el mismo criterio que la ruta por
   * encuentro (CL-77): el encuentro debe existir y ser del paciente del cuerpo,
   * el tenant sale del encuentro y escribir exige poder escribir la historia.
   *
   * @param dto - Cuerpo validado.
   * @param actor - Usuario autenticado.
   * @returns El consentimiento creado.
   */
  async create(
    dto: CreateTreatmentInformedConsentDto,
    actor: AuthenticatedUser,
  ): Promise<TreatmentInformedConsentResponseDto> {
    if (actor.roles.some((role) => ADMIN_ROLES.includes(role))) {
      return this.sign(dto, actor);
    }
    const encounter = await this.encounters.findById(
      this.em.fork(),
      dto.encounterId,
    );
    if (!encounter) {
      throw new ResourceNotFoundException(
        'Encuentro no encontrado',
        { encounterId: dto.encounterId },
        ConsentErrorReason.INFORMED_CONSENT_ENCOUNTER_NOT_FOUND,
      );
    }
    if (encounter.patientProfileId !== dto.patientProfileId) {
      throw invalid(
        ConsentErrorReason.INFORMED_CONSENT_ENCOUNTER_PATIENT_MISMATCH,
        'El encuentro no es del paciente indicado',
        ['patientProfileId', 'encounterId'],
      );
    }
    await this.clinicalRead.assertCanWriteHistory(
      encounter.patientProfileId,
      actor,
    );
    return this.sign({ ...dto, tenantId: encounter.tenantId }, actor);
  }

  /**
   * UC-07-08: firma el consentimiento informado de tratamiento.
   *
   * La autorización la resuelve quien llama (`create` o la ruta por
   * encuentro); acá se validan las reglas del contenido y del objeto
   * consentido.
   *
   * @param dto - Cuerpo validado (con el paciente y el tenant ya resueltos).
   * @param actor - Usuario autenticado.
   * @returns El consentimiento creado.
   */
  async sign(
    dto: CreateTreatmentInformedConsentDto,
    actor: AuthenticatedUser,
  ): Promise<TreatmentInformedConsentResponseDto> {
    this.logger.info(
      { operation: 'consent.treatment.sign', encounterId: dto.encounterId },
      'Signing treatment informed consent',
    );
    this.assertContentRules(dto);
    return this.em.transactional(async (tx) => {
      let target: ConsentTargetRow | null = null;
      if (dto.targetType && dto.targetId) {
        target = await this.assertTargetOfPatient(
          tx,
          dto.targetType,
          dto.targetId,
          dto.patientProfileId,
        );
      }
      const now = new Date();
      const consent = this.treatmentRepo.create(tx, {
        patientProfileId: dto.patientProfileId,
        tenantId: dto.tenantId ?? SEED.tenantId,
        encounterId: dto.encounterId,
        procedureCodeConceptId: dto.procedureCodeConceptId,
        informationVersion: dto.informationVersion,
        interpreterUserId: dto.interpreterUserId,
        witnessUserId: dto.witnessUserId,
        decisionConceptId:
          dto.decision === 'DECLINED'
            ? CONS.DECISION_DECLINED
            : CONS.DECISION_ACCEPTED,
        statusConceptId: CONS.TREATMENT_SIGNED,
        signedAt: now,
        targetType: dto.targetType,
        targetId: dto.targetId,
        targetLabel: dto.targetLabel,
        diagnosisText: dto.diagnosisText,
        purposeText: dto.purposeText,
        benefitsText: dto.benefitsText,
        risksText: dto.risksText,
        personalizedRisksText: dto.personalizedRisksText,
        alternativesText: dto.alternativesText,
        refusalConsequencesText: dto.refusalConsequencesText,
        patientQuestionsText: dto.patientQuestionsText,
        grantedBy: dto.grantedBy,
        representativeName: dto.representativeName,
        representativeDocument: dto.representativeDocument,
        representativeRelationship: dto.representativeRelationship,
        incapacityReason: dto.incapacityReason,
        informedByProfileId: dto.informedByProfileId,
        channel: dto.channel,
        exceptionType: dto.exceptionType,
        exceptionJustification: dto.exceptionJustification,
        witnessName: dto.witnessName,
        witnessDocument: dto.witnessDocument,
        informationLanguage:
          dto.informationLanguage ?? DEFAULT_INFORMATION_LANGUAGE,
        assentObtained: dto.assentObtained,
        assentNotes: dto.assentNotes,
        revocationRightInformed: dto.revocationRightInformed,
        actorUserId: actor.id,
      });
      if (
        dto.targetType === 'REFERRAL' &&
        dto.decision !== 'DECLINED' &&
        target
      ) {
        await this.linkReferral(tx, target as Referrals, consent.id, actor);
      }
      await tx.flush();

      this.eventsRepo.record(tx, {
        subjectTypeConceptId: CONS.SUBJECT_TREATMENT,
        subjectId: consent.id,
        eventTypeConceptId: CONS.EVENT_SIGNED,
        previousStatusConceptId: CONS.TREATMENT_DRAFT,
        newStatusConceptId: CONS.TREATMENT_SIGNED,
        recordedByUserId: actor.id,
      });

      this.logger.info(
        { operation: 'consent.treatment.sign', treatmentConsentId: consent.id },
        'Treatment informed consent signed',
      );
      return toResponse(consent, []);
    });
  }

  /**
   * Consentimientos de un paciente, opcionalmente por objeto consentido.
   *
   * @param query - Paciente y filtros.
   * @param actor - Usuario autenticado.
   * @returns Del más reciente al más antiguo, con su evidencia.
   * @throws ForbiddenException si no puede leer la historia del paciente.
   */
  async list(
    query: ListTreatmentInformedConsentsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<TreatmentInformedConsentListDto> {
    await this.clinicalRead.assertCanReadHistory(query.patientProfileId, actor);
    const em = this.em.fork();
    const rows = await this.treatmentRepo.findByPatient(em, {
      patientProfileId: query.patientProfileId,
      targetType: query.targetType,
      targetId: query.targetId,
    });
    const evidence = await this.evidenceRepo.findBySubjects(
      em,
      CONS.SUBJECT_TREATMENT,
      rows.map((row) => row.id),
    );
    return {
      items: rows.map((row) =>
        toResponse(
          row,
          evidence.filter((e) => e.subjectId === row.id),
        ),
      ),
    };
  }

  /**
   * Un consentimiento por id.
   *
   * @param id - Consentimiento.
   * @param actor - Usuario autenticado.
   * @returns El consentimiento con su evidencia.
   * @throws ResourceNotFoundException si no existe.
   * @throws ForbiddenException si no puede leer la historia del paciente.
   */
  async get(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<TreatmentInformedConsentResponseDto> {
    const em = this.em.fork();
    const row = await this.findOrFail(em, id);
    await this.clinicalRead.assertCanReadHistory(row.patientProfileId, actor);
    const evidence = await this.evidenceRepo.findBySubjects(
      em,
      CONS.SUBJECT_TREATMENT,
      [row.id],
    );
    return toResponse(row, evidence);
  }

  /**
   * Revoca un consentimiento (derecho del paciente a revocar en cualquier
   * momento). Deja `withdrawn_at`, el motivo, el estado revocado y el evento.
   *
   * @param id - Consentimiento.
   * @param dto - Motivo.
   * @param actor - Profesional autenticado.
   * @returns El consentimiento revocado.
   * @throws ConflictException si ya estaba revocado.
   */
  async withdraw(
    id: string,
    dto: WithdrawTreatmentInformedConsentDto,
    actor: AuthenticatedUser,
  ): Promise<TreatmentInformedConsentResponseDto> {
    this.logger.info(
      { operation: 'consent.treatment.withdraw', treatmentConsentId: id },
      'Withdrawing treatment informed consent',
    );
    return this.em.transactional(async (tx) => {
      const row = await this.findOrFail(tx, id);
      await this.clinicalRead.assertCanWriteHistory(
        row.patientProfileId,
        actor,
      );
      if (row.withdrawnAt) {
        throw new ConflictException(
          'El consentimiento ya estaba revocado',
          { treatmentConsentId: id },
          ConsentErrorReason.INFORMED_CONSENT_ALREADY_WITHDRAWN,
        );
      }
      const previousStatus = row.statusConceptId;
      const now = new Date();
      row.withdrawnAt = now;
      row.withdrawalReason = dto.reason;
      row.statusConceptId = CONS.TREATMENT_WITHDRAWN;
      touch(row, actor.id, now);
      // Una derivación no puede seguir mostrándose como consentida con un
      // consentimiento revocado: se desvincula en la misma transacción.
      const linked = await tx.find(Referrals, { informedConsentId: row.id });
      for (const referral of linked) {
        referral.informedConsentId = undefined;
        touch(referral, actor.id, now);
      }
      await tx.flush();

      this.eventsRepo.record(tx, {
        subjectTypeConceptId: CONS.SUBJECT_TREATMENT,
        subjectId: row.id,
        eventTypeConceptId: CONS.EVENT_WITHDRAWN,
        previousStatusConceptId: previousStatus,
        newStatusConceptId: CONS.TREATMENT_WITHDRAWN,
        recordedByUserId: actor.id,
      });
      const evidence = await this.evidenceRepo.findBySubjects(
        tx,
        CONS.SUBJECT_TREATMENT,
        [row.id],
      );
      return toResponse(row, evidence);
    });
  }

  /**
   * Cierra el caso de excepción `EMERGENCY`: constancia de cuándo se informó
   * al paciente (o a su representante) a posteriori.
   *
   * @param id - Consentimiento.
   * @param dto - Momento en que se informó.
   * @param actor - Profesional autenticado.
   * @returns El consentimiento actualizado.
   */
  async recordPostEmergencyInformation(
    id: string,
    dto: PostEmergencyInformationDto,
    actor: AuthenticatedUser,
  ): Promise<TreatmentInformedConsentResponseDto> {
    return this.em.transactional(async (tx) => {
      const row = await this.findOrFail(tx, id);
      await this.clinicalRead.assertCanWriteHistory(
        row.patientProfileId,
        actor,
      );
      if (row.exceptionType !== 'EMERGENCY') {
        throw new PreconditionFailedException(
          'La información posterior sólo aplica a la excepción de emergencia',
          { treatmentConsentId: id },
          ConsentErrorReason.INFORMED_CONSENT_NOT_EMERGENCY,
        );
      }
      if (row.postEmergencyInformedAt) {
        throw new ConflictException(
          'La información posterior a la emergencia ya estaba registrada',
          { treatmentConsentId: id },
          ConsentErrorReason.INFORMED_CONSENT_POST_EMERGENCY_ALREADY_INFORMED,
        );
      }
      const informedAt = new Date(dto.informedAt);
      const now = new Date();
      const floor = row.signedAt ?? row.createdAt;
      if (
        Number.isNaN(informedAt.getTime()) ||
        informedAt.getTime() > now.getTime() ||
        (floor && informedAt.getTime() < floor.getTime())
      ) {
        throw invalid(
          ConsentErrorReason.INFORMED_CONSENT_POST_EMERGENCY_DATE_INVALID,
          'La fecha debe ser posterior al consentimiento y no futura',
          ['informedAt'],
        );
      }
      row.postEmergencyInformedAt = informedAt;
      touch(row, actor.id, now);
      await tx.flush();
      const evidence = await this.evidenceRepo.findBySubjects(
        tx,
        CONS.SUBJECT_TREATMENT,
        [row.id],
      );
      return toResponse(row, evidence);
    });
  }

  /**
   * Registra evidencia (firma, documento escaneado…) del consentimiento
   * reutilizando `ConsentEvidenceService.record` con sujeto `TREATMENT`.
   *
   * @param id - Consentimiento.
   * @param dto - Evidencia sin el sujeto.
   * @param actor - Profesional autenticado.
   * @returns La fila de evidencia creada.
   */
  async recordEvidence(
    id: string,
    dto: RecordTreatmentConsentEvidenceDto,
    actor: AuthenticatedUser,
  ): Promise<ConsentEvidenceResponseDto> {
    const row = await this.findOrFail(this.em.fork(), id);
    await this.clinicalRead.assertCanWriteHistory(row.patientProfileId, actor);
    if (row.withdrawnAt) {
      throw new ConflictException(
        'El consentimiento está revocado',
        { treatmentConsentId: id },
        ConsentErrorReason.INFORMED_CONSENT_ALREADY_WITHDRAWN,
      );
    }
    return this.evidenceService.record(
      { ...dto, subjectType: 'TREATMENT', subjectId: row.id },
      actor,
    );
  }

  /**
   * Reglas del contenido que no se expresan con decoradores (400 + reason).
   *
   * @param dto - Cuerpo validado.
   */
  private assertContentRules(dto: CreateTreatmentInformedConsentDto): void {
    if (Boolean(dto.targetType) !== Boolean(dto.targetId)) {
      throw invalid(
        ConsentErrorReason.INFORMED_CONSENT_TARGET_INCOMPLETE,
        'targetType y targetId van juntos',
        ['targetType', 'targetId'],
      );
    }
    if (dto.exceptionType && !dto.exceptionJustification?.trim()) {
      throw invalid(
        ConsentErrorReason.INFORMED_CONSENT_EXCEPTION_UNJUSTIFIED,
        'Una excepción al consentimiento exige su justificación',
        ['exceptionJustification'],
      );
    }
    // Cualquier excepción (incluida PATIENT_WAIVER) exime de los textos
    // informativos, nunca de la decisión: `decision` sigue siendo obligatoria
    // en el DTO.
    if (dto.targetType && !dto.exceptionType) {
      const missing = (['purposeText', 'risksText', 'benefitsText'] as const)
        .filter((field) => !dto[field]?.trim())
        .map((field) => field as string);
      if (missing.length > 0) {
        throw invalid(
          ConsentErrorReason.INFORMED_CONSENT_INFORMATION_INCOMPLETE,
          'Falta información obligatoria para consentir',
          missing,
        );
      }
    }
    if (dto.grantedBy && dto.grantedBy !== 'PATIENT') {
      const missing = (
        ['representativeName', 'representativeRelationship'] as const
      )
        .filter((field) => !dto[field]?.trim())
        .map((field) => field as string);
      if (missing.length > 0) {
        throw invalid(
          ConsentErrorReason.INFORMED_CONSENT_REPRESENTATIVE_INCOMPLETE,
          'Falta identificar al representante',
          missing,
        );
      }
      // Otorga un representante: el titular es menor o no puede consentir. Se
      // deja constancia del asentimiento, obtenido o no, pero nunca se omite.
      if (typeof dto.assentObtained !== 'boolean') {
        throw invalid(
          ConsentErrorReason.INFORMED_CONSENT_ASSENT_REQUIRED,
          'Falta la constancia del asentimiento',
          ['assentObtained'],
        );
      }
    }
    if (
      dto.decision === 'ACCEPTED' &&
      dto.targetType &&
      dto.exceptionType !== 'EMERGENCY' &&
      dto.revocationRightInformed !== true
    ) {
      throw invalid(
        ConsentErrorReason.INFORMED_CONSENT_REVOCATION_RIGHT_NOT_INFORMED,
        'Falta la constancia de que se informó el derecho a revocar',
        ['revocationRightInformed'],
      );
    }
  }

  /**
   * El objeto consentido existe y es del mismo paciente.
   *
   * @param em - Contexto de persistencia.
   * @param targetType - Tipo de objeto.
   * @param targetId - Objeto.
   * @param patientProfileId - Paciente del consentimiento.
   */
  private async assertTargetOfPatient(
    em: EntityManager,
    targetType: InformedConsentTargetType,
    targetId: string,
    patientProfileId: string,
  ): Promise<ConsentTargetRow> {
    const target = await em.findOne(TARGET_ENTITIES[targetType], {
      id: targetId,
    });
    if (!target) {
      throw new ResourceNotFoundException(
        'El objeto consentido no existe',
        { targetType, targetId },
        ConsentErrorReason.INFORMED_CONSENT_TARGET_NOT_FOUND,
      );
    }
    if (target.patientProfileId !== patientProfileId) {
      throw invalid(
        ConsentErrorReason.INFORMED_CONSENT_TARGET_PATIENT_MISMATCH,
        'El objeto consentido es de otro paciente',
        ['targetId'],
      );
    }
    return target;
  }

  /**
   * Vincula la derivación consentida con este consentimiento aceptado
   * (`referrals.informed_consent_id`). Sólo pisa un vínculo vacío o uno que
   * ya no vale (revocado o no aceptado); uno vigente se respeta.
   *
   * @param em - Transacción en curso.
   * @param referral - Derivación objeto del consentimiento.
   * @param consentId - Consentimiento recién creado.
   * @param actor - Quien registra.
   */
  private async linkReferral(
    em: EntityManager,
    referral: Referrals,
    consentId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (referral.informedConsentId) {
      const current = await this.treatmentRepo.findById(
        em,
        referral.informedConsentId,
      );
      if (
        current &&
        !current.withdrawnAt &&
        current.decisionConceptId === CONS.DECISION_ACCEPTED
      ) {
        return;
      }
    }
    referral.informedConsentId = consentId;
    touch(referral, actor.id);
  }

  /**
   * @param em - Contexto de persistencia.
   * @param id - Consentimiento.
   * @returns La fila.
   * @throws ResourceNotFoundException si no existe.
   */
  private async findOrFail(
    em: EntityManager,
    id: string,
  ): Promise<TreatmentInformedConsents> {
    const row = await this.treatmentRepo.findById(em, id);
    if (!row) {
      throw new ResourceNotFoundException(
        'Consentimiento informado no encontrado',
        { treatmentConsentId: id },
        ConsentErrorReason.INFORMED_CONSENT_NOT_FOUND,
      );
    }
    return row;
  }
}

/**
 * Proyección pública de un consentimiento de tratamiento.
 *
 * @param row - Fila persistida.
 * @param evidence - Su evidencia en `consent.consent_evidence`.
 * @returns La respuesta del contrato.
 */
export function toResponse(
  row: TreatmentInformedConsents,
  evidence: ConsentEvidence[],
): TreatmentInformedConsentResponseDto {
  const signed = evidence.some(
    (e) =>
      Boolean(e.signatureId) ||
      Boolean(e.documentFileId) ||
      e.evidenceTypeConceptId === CONS.EVIDENCE_TYPE_SIGNATURE,
  );
  return {
    id: row.id,
    patientProfileId: row.patientProfileId,
    tenantId: row.tenantId,
    encounterId: row.encounterId,
    status: row.withdrawnAt ? 'WITHDRAWN' : 'ACTIVE',
    decision:
      row.decisionConceptId === CONS.DECISION_DECLINED
        ? 'DECLINED'
        : 'ACCEPTED',
    statusConceptId: row.statusConceptId,
    decisionConceptId: row.decisionConceptId,
    procedureCodeConceptId: row.procedureCodeConceptId,
    informationVersion: row.informationVersion,
    interpreterUserId: row.interpreterUserId,
    witnessUserId: row.witnessUserId,
    targetType: row.targetType,
    targetId: row.targetId,
    targetLabel: row.targetLabel,
    diagnosisText: row.diagnosisText,
    purposeText: row.purposeText,
    benefitsText: row.benefitsText,
    risksText: row.risksText,
    personalizedRisksText: row.personalizedRisksText,
    alternativesText: row.alternativesText,
    refusalConsequencesText: row.refusalConsequencesText,
    patientQuestionsText: row.patientQuestionsText,
    grantedBy: row.grantedBy,
    representativeName: row.representativeName,
    representativeDocument: row.representativeDocument,
    representativeRelationship: row.representativeRelationship,
    incapacityReason: row.incapacityReason,
    informedByProfileId: row.informedByProfileId,
    channel: row.channel,
    exceptionType: row.exceptionType,
    exceptionJustification: row.exceptionJustification,
    withdrawalReason: row.withdrawalReason,
    witnessName: row.witnessName,
    witnessDocument: row.witnessDocument,
    informationLanguage: row.informationLanguage,
    assentObtained: row.assentObtained,
    assentNotes: row.assentNotes,
    revocationRightInformed: row.revocationRightInformed,
    postEmergencyInformedAt: row.postEmergencyInformedAt,
    evidence: evidence.map((e) => ({
      id: e.id,
      evidenceTypeConceptId: e.evidenceTypeConceptId,
      capturedChannelConceptId: e.capturedChannelConceptId,
      recordedAt: e.recordedAt,
    })),
    signatureStatus: signed ? 'SIGNED' : 'PENDING',
    signedAt: row.signedAt,
    withdrawnAt: row.withdrawnAt,
    createdAt: row.createdAt,
  };
}
