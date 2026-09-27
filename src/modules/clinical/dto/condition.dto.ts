import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
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
