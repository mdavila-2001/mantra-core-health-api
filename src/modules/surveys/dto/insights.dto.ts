import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsUUID } from 'class-validator';
import { ANSWER_TYPE_CODES, type AnswerTypeCode } from '../surveys.concepts';

/** Granularidad de los puntos de la tendencia. */
export type InsightsTrendGranularity = 'DAY' | 'WEEK' | 'MONTH';

/** Parámetros de `GET /surveys/insights`. Todos opcionales. */
export class InsightsQueryDto {
  /**
   * Inicio del periodo (inclusive). Una fecha sola (`2026-10-01`) vale desde las
   * 00:00 UTC de ese día.
   */
  @ApiPropertyOptional({
    description:
      'Inicio del periodo, inclusive (ISO 8601). Se filtra por la fecha de emisión del cuestionario. Sin valor: desde la primera emisión.',
    example: '2026-08-01',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  /**
   * Fin del periodo (inclusive). Una fecha sola (`2026-10-31`) incluye ese día
   * completo.
   */
  @ApiPropertyOptional({
    description:
      'Fin del periodo, inclusive (ISO 8601). Una fecha sola incluye todo ese día (UTC). Sin valor: hasta ahora.',
    example: '2026-10-28',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  /**
   * Servicio de salud (`billing.service_catalog.id`) al que se acota el resumen.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Acota el resumen a los cuestionarios emitidos por atenciones de este servicio del catálogo.',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;
}

/** Totales de emisión y respuesta del periodo. */
export class InsightsTotalsDto {
  /** Cuestionarios emitidos en el periodo. */
  @ApiProperty({ description: 'Cuestionarios emitidos en el periodo' })
  issued!: number;

  /** De esos, cuántos fueron respondidos. */
  @ApiProperty({ description: 'De los emitidos, cuántos fueron respondidos' })
  answered!: number;

  /** `answered / issued` entre 0 y 1; `null` si no se emitió ninguno. */
  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      'Tasa de respuesta como fracción entre 0 y 1 (0.62 = 62 %). `null` si no se emitió ninguno.',
  })
  responseRate!: number | null;
}

/** Net Promoter Score de la pregunta de recomendación (SCALE 0-10). */
export class InsightsNpsDto {
  /** %promotores − %detractores, en puntos de −100 a 100. */
  @ApiProperty({
    type: Number,
    nullable: true,
    description:
      '%(9-10) − %(0-6), de −100 a 100 con un decimal. `null` si nadie respondió la pregunta.',
  })
  value!: number | null;

  /** Respuestas 9-10. */
  @ApiProperty()
  promoters!: number;

  /** Respuestas 7-8. */
  @ApiProperty()
  passives!: number;

  /** Respuestas 0-6. */
  @ApiProperty()
  detractors!: number;

  /** Respuestas que sostienen el cálculo. */
  @ApiProperty()
  n!: number;
}

/** Cuántas respuestas tuvo un valor de una escala. */
export class InsightsScaleBucketDto {
  /** Valor de la escala. */
  @ApiProperty()
  value!: number;

  /** Respuestas con ese valor. */
  @ApiProperty()
  count!: number;
}

/** Cuántas veces se eligió una opción. */
export class InsightsOptionCountDto {
  /** Texto de la opción. */
  @ApiProperty()
  option!: string;

  /** Veces elegida. */
  @ApiProperty()
  count!: number;
}

/** Resumen de una pregunta (agrupada por dimensión o por texto). */
export class InsightsQuestionDto {
  /**
   * Una pregunta representativa del grupo (la más reciente). No es estable entre
   * versiones: sirve de clave de lista, no para consultar una pregunta.
   */
  @ApiProperty({ format: 'uuid' })
  questionId!: string;

  /** Enunciado de la pregunta representativa. */
  @ApiProperty()
  text!: string;

  /** Dimensión de la encuesta base, o `null` si es una pregunta propia. */
  @ApiProperty({ type: String, nullable: true })
  dimension!: string | null;

  /** Tipo de respuesta. */
  @ApiProperty({ enum: ANSWER_TYPE_CODES })
  answerType!: AnswerTypeCode;

  /** Respuestas contadas. Siempre presente; 0 si nadie respondió. */
  @ApiProperty()
  n!: number;

  /** Promedio. Sólo en preguntas SCALE con al menos una respuesta. */
  @ApiPropertyOptional({ description: 'Sólo SCALE con n > 0' })
  average?: number;

  /**
   * Distribución por valor, de `scaleMin` a `scaleMax` con ceros incluidos.
   * Vacía en las preguntas que no son SCALE.
   */
  @ApiProperty({ type: [InsightsScaleBucketDto] })
  distribution!: InsightsScaleBucketDto[];

  /**
   * Veces que se eligió cada opción. Sólo SINGLE_CHOICE, MULTIPLE_CHOICE y
   * BOOLEAN (`Sí` / `No`).
   */
  @ApiPropertyOptional({ type: [InsightsOptionCountDto] })
  optionCounts?: InsightsOptionCountDto[];
}

/** Un punto de la tendencia. */
export class InsightsTrendPointDto {
  /** Primer día del tramo (`YYYY-MM-DD`, UTC). */
  @ApiProperty({ example: '2026-10-05' })
  period!: string;

  /** Cuestionarios respondidos, de los emitidos en ese tramo. */
  @ApiProperty()
  answered!: number;

  /**
   * Promedio de satisfacción del tramo. Sale de la pregunta de satisfacción
   * global; si el resumen no tiene ninguna, del promedio de las preguntas de
   * escala 1-5.
   */
  @ApiPropertyOptional()
  average?: number;
}

/** Alertas de seguridad. */
export class InsightsSafetyAlertsDto {
  /** Respuestas «Sí, y deseo que ALOVIDA me contacte…». */
  @ApiProperty()
  n!: number;
}

/** Un comentario abierto, sin nada que identifique a quien lo escribió. */
export class InsightsCommentDto {
  /** Texto del comentario. */
  @ApiProperty()
  text!: string;

  /** Día del envío (`YYYY-MM-DD`, UTC). Nunca la hora. */
  @ApiProperty({ type: String, format: 'date', example: '2026-10-27' })
  submittedAt!: string;
}

/**
 * Resumen general de cómo le va al profesional, en agregado.
 *
 * **No contiene nada que identifique al paciente ni a la atención**: ni
 * `patient_profile_id`, ni `appointment_booking_id`, ni la hora de los envíos.
 */
export class SurveyInsightsDto {
  /** Emitidos, respondidos y tasa. */
  @ApiProperty({ type: InsightsTotalsDto })
  totals!: InsightsTotalsDto;

  /** NPS de la pregunta de recomendación. */
  @ApiProperty({ type: InsightsNpsDto })
  nps!: InsightsNpsDto;

  /** Una entrada por pregunta (o dimensión), con su `n`. */
  @ApiProperty({ type: [InsightsQuestionDto] })
  byQuestion!: InsightsQuestionDto[];

  /** Tendencia por tramos de fecha de emisión. */
  @ApiProperty({ type: [InsightsTrendPointDto] })
  trend!: InsightsTrendPointDto[];

  /** Granularidad de `trend`, según la amplitud del periodo. */
  @ApiProperty({ enum: ['DAY', 'WEEK', 'MONTH'] })
  trendGranularity!: InsightsTrendGranularity;

  /** Alertas de seguridad. */
  @ApiProperty({ type: InsightsSafetyAlertsDto })
  safetyAlerts!: InsightsSafetyAlertsDto;

  /** Comentarios abiertos, los más recientes primero (tope 100). */
  @ApiProperty({ type: [InsightsCommentDto] })
  comments!: InsightsCommentDto[];
}
