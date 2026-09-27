import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Cuerpo de `POST /clinical/conditions` (UC-08-08). */
export class CreateConditionDto {
  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiProperty({
    description: 'Tenant custodio (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  custodianTenantId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Paciente (profiles.patient_profiles)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ description: 'Encuentro en curso', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a code concept.
   */
  @ApiProperty({
    description: 'Código de la condición/diagnóstico (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  codeConceptId!: string;

  /**
   * Identificador asociado a category concept.
   */
  @ApiPropertyOptional({
    description: 'Categoría (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  /**
   * Identificador asociado a severity concept.
   */
  @ApiPropertyOptional({
    description: 'Severidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  severityConceptId?: string;

  /**
   * Identificador asociado a laterality concept.
   */
  @ApiPropertyOptional({
    description: 'Lateralidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  lateralityConceptId?: string;

  /**
   * Identificador asociado a clinical course concept.
   */
  @ApiPropertyOptional({
    description:
      'Curso clínico: agudo/crónico/subagudo/recurrente (concept id). Sin declarar es un dato legítimo, no un olvido.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  clinicalCourseConceptId?: string;

  /**
   * Valor de onset at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Inicio de la condición',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  onsetAt?: string;

  /**
   * Valor de expected resolution at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Fecha esperada de resolución o próxima revisión. Sólo tiene sentido en curso agudo/subagudo.',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  expectedResolutionAt?: string;

  /**
   * Valor de note text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Hallazgos y justificación clínica (narrativa libre de quien registra; Patch v4.1.3)',
  })
  @IsOptional()
  @IsString()
  noteText?: string;
}

/** Cuerpo de `POST /clinical/conditions/:id/change-status` (Patch v4.0.8). */
export class ChangeConditionClinicalStatusDto {
  /**
   * Identificador asociado a new clinical status concept.
   */
  @ApiProperty({
    description:
      'Estado clínico destino (concept id de `condition-clinical-status`)',
    format: 'uuid',
  })
  @IsUUID()
  newClinicalStatusConceptId!: string;

  /**
   * Motivo del cambio de estado (BR-14/CL-10: obligatorio y acotado; vacío
   * responde 400).
   */
  @ApiProperty({
    description:
      'Motivo del cambio de estado (obligatorio, hasta 500 caracteres)',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reasonText!: string;
}

/** Respuesta tras registrar una condición. */
export class ConditionResponseDto {
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
   * Valor de clinical status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Estado clínico (concept id)',
    format: 'uuid',
    nullable: true,
  })
  clinicalStatus!: string | null;

  /**
   * Valor de verification status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Estado de verificación (concept id)',
    format: 'uuid',
    nullable: true,
  })
  verificationStatus!: string | null;

  /**
   * Valor de clinical course mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Curso clínico (concept id)',
    format: 'uuid',
    nullable: true,
  })
  clinicalCourse!: string | null;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/**
 * Cuerpo de `POST /clinical/conditions/:id/attachments` (ALV-033, reemplazo
 * de ALV-032). El archivo ya tiene que existir —se sube antes con
 * `POST /common/files`—; esto sólo lo liga a ESTE diagnóstico puntual, no al
 * paciente en general.
 */
export class AttachFileToConditionDto {
  /**
   * El archivo ya subido (`common.files.id`), pendiente de vincular.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  fileId!: string;
}

/** Decisión terminal sobre un diagnóstico presuntivo (C3 / P41). */
export const DIAGNOSIS_OUTCOMES = ['CONFIRMED', 'REFUTED'] as const;
/** Una de {@link DIAGNOSIS_OUTCOMES}. */
export type DiagnosisOutcome = (typeof DIAGNOSIS_OUTCOMES)[number];

/** Clases de evidencia que respaldan la decisión. */
export const DIAGNOSIS_EVIDENCE_KINDS = ['NOTE', 'ANALYSIS'] as const;
/** Una de {@link DIAGNOSIS_EVIDENCE_KINDS}. */
export type DiagnosisEvidenceKind = (typeof DIAGNOSIS_EVIDENCE_KINDS)[number];

/**
 * La evidencia que respalda la decisión: una nota clínica, o un análisis
 * (orden de estudio y/o su informe). Todos los identificadores tienen que ser
 * del mismo paciente que la condición; eso lo comprueba el servicio.
 */
export class DiagnosisEvidenceDto {
  /** `NOTE` exige `noteId`; `ANALYSIS`, orden o informe. */
  @ApiProperty({ enum: DIAGNOSIS_EVIDENCE_KINDS })
  @IsIn(DIAGNOSIS_EVIDENCE_KINDS)
  kind!: DiagnosisEvidenceKind;

  /** Nota clínica (`chart.clinical_note_headers`). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  noteId?: string;

  /** Encuentro en el que se tomó la decisión, si la nota cuelga de uno. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /** Orden de estudio (`clinical.service_requests`). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  serviceRequestId?: string;

  /** Informe del estudio (`clinical.diagnostic_reports`). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  diagnosticReportId?: string;
}

/**
 * Cuerpo de `POST /clinical/conditions/:id/verification` (C3 / P41): confirma
 * o refuta un diagnóstico presuntivo.
 *
 * Lo que la forma no puede expresar —motivo **o** evidencia; al confirmar,
 * inicio y fin esperado salvo curso crónico— lo valida el servicio y responde
 * 422, que es lo que el diálogo del front espeja.
 */
export class VerifyConditionDto {
  /** Confirmar o refutar. */
  @ApiProperty({ enum: DIAGNOSIS_OUTCOMES })
  @IsIn(DIAGNOSIS_OUTCOMES)
  outcome!: DiagnosisOutcome;

  /** Motivo de la decisión; se exige motivo o evidencia. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reasonText?: string;

  /** Evidencia que respalda la decisión; se exige motivo o evidencia. */
  @ApiPropertyOptional({ type: DiagnosisEvidenceDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DiagnosisEvidenceDto)
  basedOn?: DiagnosisEvidenceDto;

  /** Inicio; obligatorio al confirmar si la condición todavía no lo declara. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  onsetAt?: string;

  /** Fin esperado; obligatorio al confirmar salvo curso crónico. */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  expectedResolutionAt?: string;

  /** Curso clínico; un curso crónico se confirma sin fin esperado. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalCourseConceptId?: string;
}
