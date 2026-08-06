import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

/** Tope de una página de notas. */
export const CHART_NOTES_MAX_LIMIT = 100;

/** Query de `GET /charts/patients/{patientProfileId}/notes`. */
export class ListPatientNotesQueryDto {
  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Restringir a las notas de un encuentro',
  })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Valor de limit mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: 25, maximum: CHART_NOTES_MAX_LIMIT })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(CHART_NOTES_MAX_LIMIT)
  limit?: number;

  /**
   * Desplazamiento de la página.
   */
  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

/**
 * Una nota en el listado del expediente.
 *
 * Trae la cabecera y lo justo de la versión vigente para poder pintar una lista
 * (motivo de consulta y si está firmada). El cuerpo completo se pide por
 * `GET /charts/notes/{noteId}`: devolver cinco campos de texto libre por cada
 * nota del historial haría de la lista una descarga.
 */
export class ChartNoteListItemDto {
  /**
   * Identificador de la nota (cabecera).
   */
  @ApiProperty({ format: 'uuid' })
  noteId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  encounterId!: string | null;

  /**
   * Identificador asociado a note type concept.
   */
  @ApiProperty({ format: 'uuid' })
  noteTypeConceptId!: string;

  /**
   * Identificador asociado a lifecycle status concept.
   */
  @ApiProperty({ format: 'uuid' })
  lifecycleStatusConceptId!: string;

  /**
   * Identificador asociado a confidentiality concept.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  confidentialityConceptId!: string | null;

  /**
   * Identificador de la versión vigente.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currentVersionId!: string | null;

  /**
   * Número de la versión vigente.
   */
  @ApiPropertyOptional({ nullable: true })
  currentVersionNumber!: number | null;

  /**
   * Autor de la versión vigente.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  authorProfileId!: string | null;

  /**
   * Motivo de consulta de la versión vigente.
   */
  @ApiPropertyOptional({ nullable: true })
  chiefComplaintText!: string | null;

  /**
   * Instante de la firma, si la versión vigente está firmada.
   */
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  signedAt!: string | null;

  /**
   * Identificador de la versión liberada al paciente, si la hay.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  currentReleasedVersionId!: string | null;

  /**
   * Instante de creación de la nota.
   */
  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}

/** Respuesta de `GET /charts/patients/{patientProfileId}/notes`. */
export class ListPatientNotesResponseDto {
  /**
   * Notas de esta página, de la más reciente a la más antigua.
   */
  @ApiProperty({ type: [ChartNoteListItemDto] })
  items!: ChartNoteListItemDto[];

  /**
   * Cantidad devuelta.
   */
  @ApiProperty()
  count!: number;

  /**
   * Tope aplicado.
   */
  @ApiProperty()
  limit!: number;

  /**
   * Desplazamiento aplicado.
   */
  @ApiProperty()
  offset!: number;
}

/** El cuerpo SOAP de una versión de la nota. */
export class ChartNoteVersionDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Número de versión.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Identificador asociado a author profile.
   */
  @ApiProperty({ format: 'uuid' })
  authorProfileId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Motivo de consulta.
   */
  @ApiPropertyOptional({ nullable: true })
  chiefComplaintText!: string | null;

  /**
   * Subjetivo.
   */
  @ApiPropertyOptional({ nullable: true })
  subjectiveText!: string | null;

  /**
   * Objetivo.
   */
  @ApiPropertyOptional({ nullable: true })
  objectiveText!: string | null;

  /**
   * Valoración.
   */
  @ApiPropertyOptional({ nullable: true })
  assessmentText!: string | null;

  /**
   * Plan.
   */
  @ApiPropertyOptional({ nullable: true })
  planText!: string | null;

  /**
   * Versión a la que reemplaza.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  supersedesVersionId!: string | null;

  /**
   * Identificador asociado a signed by profile.
   */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  signedByProfileId!: string | null;

  /**
   * Instante de la firma.
   */
  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  signedAt!: string | null;

  /**
   * Instante en que se registró.
   */
  @ApiProperty({ format: 'date-time' })
  recordedAt!: string;
}

/**
 * Respuesta de `GET /charts/notes/{noteId}`: la cabecera con su versión vigente
 * y el índice de versiones anteriores.
 *
 * Las versiones anteriores van sólo como índice —número, estado, firma— porque
 * el expediente es append-only y el historial completo de una nota vieja puede
 * ser largo; quien quiera una versión concreta la pide.
 */
export class ChartNoteDetailDto extends ChartNoteListItemDto {
  /**
   * Versión vigente, con su cuerpo completo.
   */
  @ApiPropertyOptional({ nullable: true, type: ChartNoteVersionDto })
  currentVersion!: ChartNoteVersionDto | null;

  /**
   * Índice de todas las versiones, de la más reciente a la más antigua.
   */
  @ApiProperty({ type: [ChartNoteVersionDto] })
  versions!: ChartNoteVersionDto[];
}
