import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChartDocumentFileItemDto } from './chart-read.dto';

/**
 * BR-15 (CL-30): una nota tal como la lee el **titular** en `GET
 * /charts/me/notes`.
 *
 * Deliberadamente **sin** campos internos: nada de `authorProfileId`
 * (identidad interna del profesional), `lifecycleStatusConceptId` (estado de
 * borrador) ni `currentVersionId` (la versión vigente, que puede no ser la
 * liberada). Sólo el contenido de la versión que el médico liberó
 * explícitamente — `MyChartNoteItemDto` no es un subconjunto de campos de
 * `ChartNoteItemDto`, es otra forma para otro lector.
 */
export class MyChartNoteItemDto {
  /**
   * Identificador de la nota (cabecera).
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Encuentro al que pertenece la nota.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  encounterId?: string;

  /**
   * Tipo de nota (concept id).
   */
  @ApiPropertyOptional({ format: 'uuid' })
  noteTypeConceptId?: string;

  /**
   * Motivo de consulta de la versión liberada.
   */
  @ApiPropertyOptional()
  chiefComplaintText?: string;

  /**
   * Subjetivo (SOAP) de la versión liberada.
   */
  @ApiPropertyOptional()
  subjectiveText?: string;

  /**
   * Objetivo (SOAP) de la versión liberada.
   */
  @ApiPropertyOptional()
  objectiveText?: string;

  /**
   * Evaluación (SOAP) de la versión liberada.
   */
  @ApiPropertyOptional()
  assessmentText?: string;

  /**
   * Plan (SOAP) de la versión liberada.
   */
  @ApiPropertyOptional()
  planText?: string;

  /**
   * Cuándo se liberó esta versión al paciente.
   */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  releasedAt?: Date;

  /**
   * Fecha de creación de la nota (cabecera).
   */
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Respuesta de `GET /charts/me/notes`. */
export class MyChartNoteListResponseDto {
  @ApiProperty({ type: [MyChartNoteItemDto] })
  items!: MyChartNoteItemDto[];

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  truncated!: boolean;
}

/**
 * BR-15 (CL-30): un documento tal como lo lee el **titular** en `GET
 * /charts/me/documents` — sólo si `patientVisibilityConceptId` es
 * "visible para el paciente"; nunca `confidentialityConceptId` restringida
 * ni un documento marcado sólo para el profesional.
 */
export class MyChartDocumentItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  encounterId?: string;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  categoryConceptId?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: [ChartDocumentFileItemDto] })
  files!: ChartDocumentFileItemDto[];
}

/** Respuesta de `GET /charts/me/documents`. */
export class MyChartDocumentListResponseDto {
  @ApiProperty({ type: [MyChartDocumentItemDto] })
  items!: MyChartDocumentItemDto[];

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  truncated!: boolean;
}
