import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  INFORMED_CONSENT_CHANNELS,
  INFORMED_CONSENT_EXCEPTION_TYPES,
  INFORMED_CONSENT_GRANTED_BY,
  INFORMED_CONSENT_TARGET_TYPES,
  type InformedConsentChannel,
  type InformedConsentExceptionType,
  type InformedConsentGrantedBy,
  type InformedConsentStatus,
  type InformedConsentTargetType,
} from '../informed-consent.enums';

/** Respuesta de creación/consulta de un consentimiento. */
export class ConsentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Identificador asociado a processing purpose.
   */
  @ApiProperty({ format: 'uuid' })
  processingPurposeId!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una autorización HIPAA. */
export class HipaaAuthorizationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una objeción del paciente. */
export class PatientObjectionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Identificador asociado a restriction.
   */
  @ApiProperty({
    description: 'Restricción de privacidad creada (si aplica)',
    nullable: true,
  })
  restrictionId!: string | null;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una restricción de privacidad. */
export class PrivacyRestrictionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una base legal de procesamiento versionada. */
export class ProcessingLegalBasisResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a processing purpose.
   */
  @ApiProperty({ format: 'uuid' })
  processingPurposeId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Identificador asociado a superseded.
   */
  @ApiProperty({
    description: 'Versión anterior cerrada (si la había)',
    nullable: true,
  })
  supersededId!: string | null;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Una fila de evidencia del consentimiento de tratamiento (enmienda 1). */
export class TreatmentConsentEvidenceItemDto {
  /**
   * Identificador de la evidencia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Tipo de evidencia (concept id).
   */
  @ApiProperty({ format: 'uuid' })
  evidenceTypeConceptId!: string;

  /**
   * Canal de captura (concept id).
   */
  @ApiPropertyOptional({ format: 'uuid' })
  capturedChannelConceptId?: string;

  /**
   * Cuándo se registró.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  recordedAt!: Date;
}

/**
 * Respuesta de un consentimiento informado de tratamiento.
 *
 * v4266: `status` y `decision` pasan a ser legibles (`ACTIVE`/`WITHDRAWN`,
 * `ACCEPTED`/`DECLINED`); los concept ids siguen en `statusConceptId` y
 * `decisionConceptId`.
 */
export class TreatmentInformedConsentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Tenant propietario.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  tenantId?: string;

  /**
   * Encuentro en el que se registró.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  encounterId?: string;

  /**
   * Estado legible: `ACTIVE` mientras no se revoque, `WITHDRAWN` después.
   */
  @ApiProperty({ enum: ['ACTIVE', 'WITHDRAWN'] })
  status!: InformedConsentStatus;

  /**
   * Decisión del paciente.
   */
  @ApiProperty({ enum: ['ACCEPTED', 'DECLINED'] })
  decision!: 'ACCEPTED' | 'DECLINED';

  /**
   * Estado (concept id).
   */
  @ApiPropertyOptional({ format: 'uuid' })
  statusConceptId?: string;

  /**
   * Decisión (concept id).
   */
  @ApiPropertyOptional({ format: 'uuid' })
  decisionConceptId?: string;

  /**
   * Código de procedimiento (concept id).
   */
  @ApiPropertyOptional({ format: 'uuid' })
  procedureCodeConceptId?: string;

  /**
   * Versión del material informativo.
   */
  @ApiPropertyOptional()
  informationVersion?: string;

  /**
   * Intérprete presente.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  interpreterUserId?: string;

  /**
   * Testigo.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  witnessUserId?: string;

  /**
   * A qué se consiente.
   */
  @ApiPropertyOptional({ enum: INFORMED_CONSENT_TARGET_TYPES })
  targetType?: InformedConsentTargetType;

  /**
   * Objeto consentido.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  targetId?: string;

  /**
   * Instantánea legible de lo consentido.
   */
  @ApiPropertyOptional()
  targetLabel?: string;

  /**
   * Diagnóstico que lo motiva.
   */
  @ApiPropertyOptional()
  diagnosisText?: string;

  /**
   * Naturaleza y objetivo.
   */
  @ApiPropertyOptional()
  purposeText?: string;

  /**
   * Beneficios esperados.
   */
  @ApiPropertyOptional()
  benefitsText?: string;

  /**
   * Riesgos frecuentes y graves.
   */
  @ApiPropertyOptional()
  risksText?: string;

  /**
   * Riesgos personalizados.
   */
  @ApiPropertyOptional()
  personalizedRisksText?: string;

  /**
   * Alternativas.
   */
  @ApiPropertyOptional()
  alternativesText?: string;

  /**
   * Consecuencias de no aceptar.
   */
  @ApiPropertyOptional()
  refusalConsequencesText?: string;

  /**
   * Preguntas y respuestas.
   */
  @ApiPropertyOptional()
  patientQuestionsText?: string;

  /**
   * Quién otorga.
   */
  @ApiPropertyOptional({ enum: INFORMED_CONSENT_GRANTED_BY })
  grantedBy?: InformedConsentGrantedBy;

  /**
   * Nombre del representante.
   */
  @ApiPropertyOptional()
  representativeName?: string;

  /**
   * Documento del representante.
   */
  @ApiPropertyOptional()
  representativeDocument?: string;

  /**
   * Parentesco o calidad del representante.
   */
  @ApiPropertyOptional()
  representativeRelationship?: string;

  /**
   * Por qué no consiente el titular.
   */
  @ApiPropertyOptional()
  incapacityReason?: string;

  /**
   * Profesional que informa.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  informedByProfileId?: string;

  /**
   * Canal.
   */
  @ApiPropertyOptional({ enum: INFORMED_CONSENT_CHANNELS })
  channel?: InformedConsentChannel;

  /**
   * Excepción legal.
   */
  @ApiPropertyOptional({ enum: INFORMED_CONSENT_EXCEPTION_TYPES })
  exceptionType?: InformedConsentExceptionType;

  /**
   * Justificación de la excepción.
   */
  @ApiPropertyOptional()
  exceptionJustification?: string;

  /**
   * Motivo de la revocación.
   */
  @ApiPropertyOptional()
  withdrawalReason?: string;

  /**
   * Testigo externo.
   */
  @ApiPropertyOptional()
  witnessName?: string;

  /**
   * Documento del testigo externo.
   */
  @ApiPropertyOptional()
  witnessDocument?: string;

  /**
   * Idioma de la información.
   */
  @ApiPropertyOptional()
  informationLanguage?: string;

  /**
   * Asentimiento obtenido.
   */
  @ApiPropertyOptional()
  assentObtained?: boolean;

  /**
   * Notas del asentimiento.
   */
  @ApiPropertyOptional()
  assentNotes?: string;

  /**
   * Se informó el derecho a revocar.
   */
  @ApiPropertyOptional()
  revocationRightInformed?: boolean;

  /**
   * Cuándo se informó a posteriori tras la emergencia.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  postEmergencyInformedAt?: Date;

  /**
   * Evidencia registrada en `consent.consent_evidence` para este consentimiento.
   */
  @ApiProperty({ type: () => [TreatmentConsentEvidenceItemDto] })
  evidence!: TreatmentConsentEvidenceItemDto[];

  /**
   * `SIGNED` si hay evidencia de firma o documento; `PENDING` si no.
   */
  @ApiProperty({ enum: ['SIGNED', 'PENDING'] })
  signatureStatus!: 'SIGNED' | 'PENDING';

  /**
   * Cuándo se firmó.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  signedAt?: Date;

  /**
   * Cuándo se revocó.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  withdrawnAt?: Date;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Lista de consentimientos informados de tratamiento (v4266). */
export class TreatmentInformedConsentListDto {
  /**
   * Consentimientos, del más reciente al más antiguo.
   */
  @ApiProperty({ type: [TreatmentInformedConsentResponseDto] })
  items!: TreatmentInformedConsentResponseDto[];
}

/** Respuesta de una fila de evidencia inmutable. */
export class ConsentEvidenceResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a subject.
   */
  @ApiProperty({ format: 'uuid' })
  subjectId!: string;

  /**
   * Valor de recorded at mantenido por la instancia.
   */
  @ApiProperty()
  recordedAt!: Date;
}

/** Resultado genérico de una operación de estado (withdraw, revoke, resolve, amend). */
export class StatusResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}

/** Resultado del barrido de expiraciones (UC-07-11). */
export class ExpirationSweepResultDto {
  /**
   * Valor de expired consents mantenido por la instancia.
   */
  @ApiProperty({ description: 'Consentimientos expirados' })
  expiredConsents!: number;

  /**
   * Valor de expired authorizations mantenido por la instancia.
   */
  @ApiProperty({ description: 'Autorizaciones HIPAA expiradas' })
  expiredAuthorizations!: number;

  /**
   * Valor de expired restrictions mantenido por la instancia.
   */
  @ApiProperty({ description: 'Restricciones de privacidad expiradas' })
  expiredRestrictions!: number;
}
