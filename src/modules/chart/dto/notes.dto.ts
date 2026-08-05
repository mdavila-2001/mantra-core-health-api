import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Cuerpo de `POST /charts/notes` (UC-15-01): crea una nota y su versión 1 borrador. */
export class CreateNoteDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Perfil de paciente (profiles.patient_profiles)',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a author profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Perfil del clínico autor' })
  @IsUUID()
  authorProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Encuentro clínico asociado',
  })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a note type concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id del tipo de nota',
  })
  @IsOptional()
  @IsUUID()
  noteTypeConceptId?: string;

  /**
   * Identificador asociado a confidentiality concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id de confidencialidad',
  })
  @IsOptional()
  @IsUUID()
  confidentialityConceptId?: string;

  /**
   * Valor de chief complaint text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  chiefComplaintText?: string;

  /**
   * Valor de subjective text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Bloque S (subjetivo) del SOAP' })
  @IsOptional()
  @IsString()
  subjectiveText?: string;

  /**
   * Valor de objective text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Bloque O (objetivo) del SOAP' })
  @IsOptional()
  @IsString()
  objectiveText?: string;

  /**
   * Valor de assessment text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Bloque A (evaluación) del SOAP' })
  @IsOptional()
  @IsString()
  assessmentText?: string;

  /**
   * Valor de plan text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Bloque P (plan) del SOAP' })
  @IsOptional()
  @IsString()
  planText?: string;
}

/** Cuerpo de `PUT /charts/notes/{noteId}/versions` (UC-15-02): nueva versión borrador. */
export class AddVersionDto {
  /**
   * Identificador asociado a author profile.
   */
  @ApiProperty({ format: 'uuid', description: 'Perfil del clínico autor' })
  @IsUUID()
  authorProfileId!: string;

  /**
   * Valor de chief complaint text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  chiefComplaintText?: string;

  /**
   * Valor de subjective text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectiveText?: string;

  /**
   * Valor de objective text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objectiveText?: string;

  /**
   * Valor de assessment text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assessmentText?: string;

  /**
   * Valor de plan text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planText?: string;
}

/** Cuerpo de `POST .../versions/{versionId}/sign` (UC-15-03). */
export class SignVersionDto {
  /**
   * Identificador asociado a signer profile.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Perfil del firmante (autor o delegado)',
  })
  @IsUUID()
  signerProfileId!: string;

  /**
   * Valor de certificate thumbprint mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Huella del certificado usado en la firma',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  certificateThumbprint?: string;

  /**
   * Valor de signature value encrypted mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Valor de firma cifrado (opaco al backend)',
  })
  @IsOptional()
  @IsString()
  signatureValueEncrypted?: string;
}

/** Cuerpo de `POST .../versions/{versionId}/cosign` (UC-15-04). */
export class CosignVersionDto {
  /**
   * Identificador asociado a signer profile.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Perfil del cofirmante / supervisor',
  })
  @IsUUID()
  signerProfileId!: string;

  /**
   * Valor de certificate thumbprint mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  certificateThumbprint?: string;

  /**
   * Valor de signature value encrypted mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signatureValueEncrypted?: string;
}

/** Cuerpo de `POST /charts/notes/{noteId}/amendments` (UC-15-05). */
export class AmendNoteDto {
  /**
   * Identificador asociado a author profile.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Perfil del clínico que enmienda',
  })
  @IsUUID()
  authorProfileId!: string;

  /**
   * Valor de amendment reason text mantenido por la instancia.
   */
  @ApiProperty({ description: 'Motivo textual de la enmienda (obligatorio)' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  amendmentReasonText!: string;

  /**
   * Identificador asociado a amendment reason concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id del motivo de enmienda',
  })
  @IsOptional()
  @IsUUID()
  amendmentReasonConceptId?: string;

  /**
   * Valor de subjective text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectiveText?: string;

  /**
   * Valor de objective text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objectiveText?: string;

  /**
   * Valor de assessment text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assessmentText?: string;

  /**
   * Valor de plan text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planText?: string;
}

/** Cuerpo de `POST /charts/notes/versions/{versionId}/release` (UC-15-06). */
export class ReleaseVersionDto {
  /**
   * Valor de policy version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión de la política de liberación aplicada',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyVersion?: string;
}

/** Cuerpo de `POST /charts/notes/versions/{versionId}/withhold` (UC-15-07). */
export class WithholdVersionDto {
  /**
   * Identificador asociado a reason concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id del motivo de retención',
  })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;

  /**
   * Valor de policy version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión de la política de retención aplicada',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyVersion?: string;
}

/** Un hallazgo de examen físico dentro del batch de UC-15-08. */
export class ExamFindingInputDto {
  /**
   * Identificador asociado a body system concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id del sistema corporal',
  })
  @IsOptional()
  @IsUUID()
  bodySystemConceptId?: string;

  /**
   * Identificador asociado a finding concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concept id del hallazgo codificado',
  })
  @IsOptional()
  @IsUUID()
  findingConceptId?: string;

  /**
   * Valor de is normal mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'true si el hallazgo es normal' })
  @IsOptional()
  @IsBoolean()
  isNormal?: boolean;

  /**
   * Valor de finding text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  findingText?: string;
}

/** Cuerpo de `POST /charts/notes/versions/{versionId}/exam-findings` (UC-15-08). */
export class ExamFindingsDto {
  /**
   * Valor de findings mantenido por la instancia.
   */
  @ApiProperty({
    type: [ExamFindingInputDto],
    description: 'Batch de hallazgos',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExamFindingInputDto)
  findings!: ExamFindingInputDto[];

  /**
   * Valor de objective text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Texto objetivo sintetizado (solo si la versión sigue en DRAFT)',
  })
  @IsOptional()
  @IsString()
  objectiveText?: string;
}

/** Respuesta compartida de operaciones sobre una versión de nota. */
export class NoteVersionResponseDto {
  /**
   * Identificador asociado a note.
   */
  @ApiProperty({ format: 'uuid' })
  noteId!: string;

  /**
   * Identificador asociado a version.
   */
  @ApiProperty({ format: 'uuid' })
  versionId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Identificador asociado a lifecycle status concept.
   */
  @ApiProperty({
    description: 'Concept id del ciclo de vida de la cabecera',
    format: 'uuid',
  })
  lifecycleStatusConceptId!: string;

  /**
   * Identificador asociado a version status concept.
   */
  @ApiProperty({
    description: 'Concept id del estado de la versión',
    format: 'uuid',
  })
  versionStatusConceptId!: string;
}

/** Resultado del registro de hallazgos de examen físico (UC-15-08). */
export class ExamFindingsResultDto {
  /**
   * Identificador asociado a version.
   */
  @ApiProperty({ format: 'uuid' })
  versionId!: string;

  /**
   * Valor de recorded findings mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de hallazgos registrados' })
  recordedFindings!: number;
}

/** Resultado de una transición de liberación/retención (UC-15-06/07). */
export class ReleaseResultDto {
  /**
   * Identificador asociado a version.
   */
  @ApiProperty({ format: 'uuid' })
  versionId!: string;

  /**
   * Identificador asociado a release event.
   */
  @ApiProperty({ format: 'uuid' })
  releaseEventId!: string;

  /**
   * Identificador asociado a patient release status concept.
   */
  @ApiProperty({
    description: 'Concept id del estado de liberación de la cabecera',
    format: 'uuid',
  })
  patientReleaseStatusConceptId!: string;
}
