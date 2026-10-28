import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  INFORMED_CONSENT_CHANNELS,
  INFORMED_CONSENT_EXCEPTION_TYPES,
  INFORMED_CONSENT_GRANTED_BY,
  INFORMED_CONSENT_TARGET_TYPES,
  type InformedConsentChannel,
  type InformedConsentExceptionType,
  type InformedConsentGrantedBy,
  type InformedConsentTargetType,
} from '../informed-consent.enums';

/** Decisión del paciente sobre el tratamiento. */
export type TreatmentDecision = 'ACCEPTED' | 'DECLINED';

/**
 * Cuerpo de `POST /consent/treatment-informed-consents` (UC-07-08).
 *
 * v4266: el consentimiento puede ir **dirigido** a un objeto clínico concreto
 * (`targetType` + `targetId`) y llevar los elementos de información que exige
 * la norma. Todos los campos nuevos son opcionales (compatibilidad hacia
 * atrás); las reglas cruzadas (los dos de target o ninguno, información
 * mínima, excepción justificada, representante identificado) las valida el
 * servicio con un `reason` estable.
 */
export class CreateTreatmentInformedConsentDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Paciente titular (patient profile id)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiProperty({
    description: 'Encuentro clínico abierto (encounter id)',
    format: 'uuid',
  })
  @IsUUID()
  encounterId!: string;

  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Decisión del paciente',
    enum: ['ACCEPTED', 'DECLINED'],
  })
  @IsIn(['ACCEPTED', 'DECLINED'])
  decision!: TreatmentDecision;

  /**
   * Identificador asociado a procedure code concept.
   */
  @ApiPropertyOptional({
    description: 'Código de procedimiento (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  procedureCodeConceptId?: string;

  /**
   * Valor de information version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión del material informativo vigente',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  informationVersion?: string;

  /**
   * Identificador asociado a interpreter user.
   */
  @ApiPropertyOptional({
    description: 'Intérprete presente (user id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  interpreterUserId?: string;

  /**
   * Identificador asociado a witness user.
   */
  @ApiPropertyOptional({ description: 'Testigo (user id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  witnessUserId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant propietario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * A qué se consiente (va junto con targetId)
   */
  @ApiPropertyOptional({
    description: 'A qué se consiente (va junto con targetId)',
    enum: INFORMED_CONSENT_TARGET_TYPES,
  })
  @IsOptional()
  @IsIn(INFORMED_CONSENT_TARGET_TYPES)
  targetType?: InformedConsentTargetType;

  /**
   * Id del objeto consentido (receta, orden, derivación, procedimiento o plan).
   */
  @ApiPropertyOptional({
    description: 'Id del objeto consentido (va junto con targetType)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  targetId?: string;

  /**
   * Instantánea legible de lo consentido
   */
  @ApiPropertyOptional({
    description: 'Instantánea legible de lo consentido',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  targetLabel?: string;

  /**
   * Diagnóstico que lo motiva
   */
  @ApiPropertyOptional({
    description: 'Diagnóstico que lo motiva',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  diagnosisText?: string;

  /**
   * Naturaleza y objetivo del tratamiento, estudio o derivación
   */
  @ApiPropertyOptional({
    description: 'Naturaleza y objetivo del tratamiento, estudio o derivación',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  purposeText?: string;

  /**
   * Beneficios esperados
   */
  @ApiPropertyOptional({ description: 'Beneficios esperados', maxLength: 4000 })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  benefitsText?: string;

  /**
   * Riesgos frecuentes y graves / efectos adversos
   */
  @ApiPropertyOptional({
    description: 'Riesgos frecuentes y graves / efectos adversos',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  risksText?: string;

  /**
   * Riesgos personalizados del paciente
   */
  @ApiPropertyOptional({
    description: 'Riesgos personalizados del paciente',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  personalizedRisksText?: string;

  /**
   * Alternativas disponibles
   */
  @ApiPropertyOptional({
    description: 'Alternativas disponibles',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  alternativesText?: string;

  /**
   * Consecuencias previsibles de no aceptar
   */
  @ApiPropertyOptional({
    description: 'Consecuencias previsibles de no aceptar',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  refusalConsequencesText?: string;

  /**
   * Preguntas del paciente y respuestas
   */
  @ApiPropertyOptional({
    description: 'Preguntas del paciente y respuestas',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  patientQuestionsText?: string;

  /**
   * Quién otorga (por defecto el titular)
   */
  @ApiPropertyOptional({
    description: 'Quién otorga (por defecto el titular)',
    enum: INFORMED_CONSENT_GRANTED_BY,
  })
  @IsOptional()
  @IsIn(INFORMED_CONSENT_GRANTED_BY)
  grantedBy?: InformedConsentGrantedBy;

  /**
   * Nombre del representante (obligatorio si no otorga el titular)
   */
  @ApiPropertyOptional({
    description:
      'Nombre del representante (obligatorio si no otorga el titular)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  representativeName?: string;

  /**
   * Documento del representante (CI u otro)
   */
  @ApiPropertyOptional({
    description: 'Documento del representante (CI u otro)',
    maxLength: 60,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  representativeDocument?: string;

  /**
   * Parentesco o calidad del representante (obligatorio si no otorga el titular)
   */
  @ApiPropertyOptional({
    description:
      'Parentesco o calidad del representante (obligatorio si no otorga el titular)',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  representativeRelationship?: string;

  /**
   * Por qué no consiente el titular
   */
  @ApiPropertyOptional({
    description: 'Por qué no consiente el titular',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  incapacityReason?: string;

  /**
   * Profesional que informa (health practitioner profile id).
   */
  @ApiPropertyOptional({
    description: 'Profesional que informa (practitioner profile id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  informedByProfileId?: string;

  /**
   * Canal por el que se informó
   */
  @ApiPropertyOptional({
    description: 'Canal por el que se informó',
    enum: INFORMED_CONSENT_CHANNELS,
  })
  @IsOptional()
  @IsIn(INFORMED_CONSENT_CHANNELS)
  channel?: InformedConsentChannel;

  /**
   * Excepción legal al consentimiento
   */
  @ApiPropertyOptional({
    description: 'Excepción legal al consentimiento',
    enum: INFORMED_CONSENT_EXCEPTION_TYPES,
  })
  @IsOptional()
  @IsIn(INFORMED_CONSENT_EXCEPTION_TYPES)
  exceptionType?: InformedConsentExceptionType;

  /**
   * Justificación de la excepción (obligatoria si hay excepción)
   */
  @ApiPropertyOptional({
    description: 'Justificación de la excepción (obligatoria si hay excepción)',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  exceptionJustification?: string;

  /**
   * Testigo que no es usuario de la plataforma (p. ej. un familiar).
   */
  @ApiPropertyOptional({
    description: 'Testigo externo (nombre)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  witnessName?: string;

  /**
   * Documento del testigo externo.
   */
  @ApiPropertyOptional({
    description: 'Documento del testigo externo',
    maxLength: 60,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  witnessDocument?: string;

  /**
   * Idioma en que se brindó la información (por defecto `es`).
   */
  @ApiPropertyOptional({
    description: 'Idioma de la información (por defecto es)',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  informationLanguage?: string;

  /**
   * Asentimiento del menor o de la persona con discapacidad: obligatorio
   * (true/false) cuando otorga un representante.
   */
  @ApiPropertyOptional({
    description:
      'Asentimiento obtenido (obligatorio si otorga un representante)',
  })
  @IsOptional()
  @IsBoolean()
  assentObtained?: boolean;

  /**
   * Notas sobre el asentimiento.
   */
  @ApiPropertyOptional({
    description: 'Notas del asentimiento',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  assentNotes?: string;

  /**
   * Constancia de que se informó el derecho a revocar: obligatoria `true` para
   * un consentimiento ACCEPTED dirigido (salvo excepción EMERGENCY).
   */
  @ApiPropertyOptional({ description: 'Se informó el derecho a revocar' })
  @IsOptional()
  @IsBoolean()
  revocationRightInformed?: boolean;
}
