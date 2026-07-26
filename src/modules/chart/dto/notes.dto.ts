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
  @ApiProperty({ format: 'uuid', description: 'Perfil de paciente (profiles.patient_profiles)' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid', description: 'Perfil del clínico autor' })
  @IsUUID()
  authorProfileId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Encuentro clínico asociado' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Concept id del tipo de nota' })
  @IsOptional()
  @IsUUID()
  noteTypeConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Concept id de confidencialidad' })
  @IsOptional()
  @IsUUID()
  confidentialityConceptId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  chiefComplaintText?: string;

  @ApiPropertyOptional({ description: 'Bloque S (subjetivo) del SOAP' })
  @IsOptional()
  @IsString()
  subjectiveText?: string;

  @ApiPropertyOptional({ description: 'Bloque O (objetivo) del SOAP' })
  @IsOptional()
  @IsString()
  objectiveText?: string;

  @ApiPropertyOptional({ description: 'Bloque A (evaluación) del SOAP' })
  @IsOptional()
  @IsString()
  assessmentText?: string;

  @ApiPropertyOptional({ description: 'Bloque P (plan) del SOAP' })
  @IsOptional()
  @IsString()
  planText?: string;
}

/** Cuerpo de `PUT /charts/notes/{noteId}/versions` (UC-15-02): nueva versión borrador. */
export class AddVersionDto {
  @ApiProperty({ format: 'uuid', description: 'Perfil del clínico autor' })
  @IsUUID()
  authorProfileId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  chiefComplaintText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectiveText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objectiveText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assessmentText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planText?: string;
}

/** Cuerpo de `POST .../versions/{versionId}/sign` (UC-15-03). */
export class SignVersionDto {
  @ApiProperty({ format: 'uuid', description: 'Perfil del firmante (autor o delegado)' })
  @IsUUID()
  signerProfileId!: string;

  @ApiPropertyOptional({ description: 'Huella del certificado usado en la firma' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  certificateThumbprint?: string;

  @ApiPropertyOptional({ description: 'Valor de firma cifrado (opaco al backend)' })
  @IsOptional()
  @IsString()
  signatureValueEncrypted?: string;
}

/** Cuerpo de `POST .../versions/{versionId}/cosign` (UC-15-04). */
export class CosignVersionDto {
  @ApiProperty({ format: 'uuid', description: 'Perfil del cofirmante / supervisor' })
  @IsUUID()
  signerProfileId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  certificateThumbprint?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signatureValueEncrypted?: string;
}

/** Cuerpo de `POST /charts/notes/{noteId}/amendments` (UC-15-05). */
export class AmendNoteDto {
  @ApiProperty({ format: 'uuid', description: 'Perfil del clínico que enmienda' })
  @IsUUID()
  authorProfileId!: string;

  @ApiProperty({ description: 'Motivo textual de la enmienda (obligatorio)' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  amendmentReasonText!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Concept id del motivo de enmienda' })
  @IsOptional()
  @IsUUID()
  amendmentReasonConceptId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subjectiveText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objectiveText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assessmentText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planText?: string;
}

/** Cuerpo de `POST /charts/notes/versions/{versionId}/release` (UC-15-06). */
export class ReleaseVersionDto {
  @ApiPropertyOptional({ description: 'Versión de la política de liberación aplicada' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyVersion?: string;
}

/** Cuerpo de `POST /charts/notes/versions/{versionId}/withhold` (UC-15-07). */
export class WithholdVersionDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Concept id del motivo de retención' })
  @IsOptional()
  @IsUUID()
  reasonConceptId?: string;

  @ApiPropertyOptional({ description: 'Versión de la política de retención aplicada' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyVersion?: string;
}

/** Un hallazgo de examen físico dentro del batch de UC-15-08. */
export class ExamFindingInputDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Concept id del sistema corporal' })
  @IsOptional()
  @IsUUID()
  bodySystemConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Concept id del hallazgo codificado' })
  @IsOptional()
  @IsUUID()
  findingConceptId?: string;

  @ApiPropertyOptional({ description: 'true si el hallazgo es normal' })
  @IsOptional()
  @IsBoolean()
  isNormal?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  findingText?: string;
}

/** Cuerpo de `POST /charts/notes/versions/{versionId}/exam-findings` (UC-15-08). */
export class ExamFindingsDto {
  @ApiProperty({ type: [ExamFindingInputDto], description: 'Batch de hallazgos' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExamFindingInputDto)
  findings!: ExamFindingInputDto[];

  @ApiPropertyOptional({ description: 'Texto objetivo sintetizado (solo si la versión sigue en DRAFT)' })
  @IsOptional()
  @IsString()
  objectiveText?: string;
}

/** Respuesta compartida de operaciones sobre una versión de nota. */
export class NoteVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  noteId!: string;

  @ApiProperty({ format: 'uuid' })
  versionId!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ description: 'Concept id del ciclo de vida de la cabecera', format: 'uuid' })
  lifecycleStatusConceptId!: string;

  @ApiProperty({ description: 'Concept id del estado de la versión', format: 'uuid' })
  versionStatusConceptId!: string;
}

/** Resultado del registro de hallazgos de examen físico (UC-15-08). */
export class ExamFindingsResultDto {
  @ApiProperty({ format: 'uuid' })
  versionId!: string;

  @ApiProperty({ description: 'Nº de hallazgos registrados' })
  recordedFindings!: number;
}

/** Resultado de una transición de liberación/retención (UC-15-06/07). */
export class ReleaseResultDto {
  @ApiProperty({ format: 'uuid' })
  versionId!: string;

  @ApiProperty({ format: 'uuid' })
  releaseEventId!: string;

  @ApiProperty({ description: 'Concept id del estado de liberación de la cabecera', format: 'uuid' })
  patientReleaseStatusConceptId!: string;
}
