import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ChartNoteItemDto } from './chart-read.dto';

/** Tamaño de página por defecto de `GET /charts/notes`. */
export const DEFAULT_NOTES_PAGE_SIZE = 50;

/** Tope máximo de página de `GET /charts/notes`. */
const MAX_NOTES_PAGE_SIZE = 100;

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
   * Perfil del clínico autor. Opcional (CL-20): el autor es el profesional de
   * la sesión; si viaja y difiere, la API responde 403.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Perfil del clínico autor. Se toma de la sesión; si viaja otro, 403',
  })
  @IsOptional()
  @IsUUID()
  authorProfileId?: string;

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
   * Perfil del clínico autor. Opcional (CL-20): sale de la sesión.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Perfil del clínico autor. Se toma de la sesión; si viaja otro, 403',
  })
  @IsOptional()
  @IsUUID()
  authorProfileId?: string;

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
   * Perfil del clínico que enmienda. Opcional (CL-20): sale de la sesión.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Perfil del clínico que enmienda. Se toma de la sesión; si viaja otro, 403',
  })
  @IsOptional()
  @IsUUID()
  authorProfileId?: string;

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

/**
 * Filtros y paginación del listado de notas de evolución (`GET /charts/notes`).
 *
 * `to` es **inclusivo**: la ventana se declara así en el `@ApiPropertyOptional`
 * porque la semántica no está unificada en el repo (insurance también la usa
 * inclusiva; otros módulos no la validan). El cursor es **opaco**: sale de
 * `encodeKeysetCursor` y se reenvía tal cual.
 */
export class ListChartNotesQueryDto {
  /**
   * Profesional cuyas notas se listan. Si no viene, se usa el de la sesión.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Perfil profesional autor; por defecto, el de la sesión',
  })
  @IsOptional()
  @IsUUID()
  practitionerId?: string;

  /** Filtra además por paciente, sin ampliar el alcance por profesional. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /** Desde (inclusive) sobre `header.created_at`, en ISO 8601. */
  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  /** Hasta (inclusive) sobre `header.created_at`, en ISO 8601. */
  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  /** Cursor opaco devuelto por la página anterior. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  /** Tamaño de página. */
  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_NOTES_PAGE_SIZE,
    default: DEFAULT_NOTES_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_NOTES_PAGE_SIZE)
  limit?: number;
}

/** Una fila del listado de notas: el ítem del expediente más su paciente. */
export class ChartNoteListItemDto extends ChartNoteItemDto {
  /**
   * Paciente de la nota. En el expediente lo trae el propio contexto de la
   * pantalla; en una colección por profesional hay que declararlo para poder
   * pintar la lista sin resolverlo aparte.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;
}

/** Página del listado de notas de evolución. */
export class ChartNotesListResponseDto {
  /** Filas de esta página. */
  @ApiProperty({ type: [ChartNoteListItemDto] })
  items!: ChartNoteListItemDto[];

  /** Cantidad devuelta en esta página. */
  @ApiProperty({ description: 'Cantidad devuelta en esta página' })
  count!: number;

  /** Tope aplicado a la consulta. */
  @ApiProperty({ description: 'Tope de resultados aplicado' })
  limit!: number;

  /** Cursor de continuación, o `null` si esta es la última página. */
  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Cursor opaco para la página siguiente; `null` sin más',
  })
  nextCursor!: string | null;
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
