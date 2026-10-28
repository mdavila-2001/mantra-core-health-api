import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches } from 'class-validator';
import {
  DATE_ONLY_PATTERN,
  MAX_RANGE_DAYS,
  MIN_COHORT,
} from '../insights.constants';
import { ANSWER_TYPE_CODES, type AnswerTypeCode } from '../surveys.concepts';

/** Granularidad de los puntos de la tendencia. */
export type InsightsTrendGranularity = 'DAY' | 'WEEK' | 'MONTH';

/** Parámetros de `GET /surveys/insights`. Todos opcionales. */
export class InsightsQueryDto {
  /** Primer día del periodo (inclusive), `YYYY-MM-DD`. */
  @ApiPropertyOptional({
    description: `Primer día del periodo, inclusive. Sólo fecha de día (YYYY-MM-DD, UTC); con hora se rechaza con 400. Se filtra por la fecha de emisión del cuestionario. Sin valor: 365 días antes de \`to\`.`,
    example: '2026-08-01',
    format: 'date',
  })
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'from debe ser una fecha YYYY-MM-DD' })
  from?: string;

  /** Último día del periodo (inclusive), `YYYY-MM-DD`. */
  @ApiPropertyOptional({
    description: `Último día del periodo, inclusive. Sólo fecha de día (YYYY-MM-DD, UTC). Debe ser igual o posterior a \`from\`; el periodo no puede pasar de ${MAX_RANGE_DAYS} días. Sin valor: hoy (UTC).`,
    example: '2026-10-28',
    format: 'date',
  })
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: 'to debe ser una fecha YYYY-MM-DD' })
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

  /**
   * `true` si hay respuestas pero menos de {@link MIN_COHORT}: `value` y los
   * conteos se omiten (0 / `null`) para no exponer respuestas sueltas.
   */
  @ApiPropertyOptional({
    description: `true si hay menos de ${MIN_COHORT} respuestas: no se calcula`,
  })
  suppressed?: boolean;
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

  /**
   * `true` si la pregunta tiene menos de {@link MIN_COHORT} respuestas: se
   * omiten `average`, `distribution` (vacía) y `optionCounts`; `n` se conserva.
   */
  @ApiPropertyOptional({
    description: `true si n < ${MIN_COHORT}: sin promedio, distribución ni opciones`,
  })
  suppressed?: boolean;

  /** Promedio. Sólo en preguntas SCALE con respuestas suficientes. */
  @ApiPropertyOptional({ description: 'Sólo SCALE no suprimida' })
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
  /**
   * Primer día del tramo (`YYYY-MM-DD`, UTC). Los tramos con menos de
   * {@link MIN_COHORT} respondidos se funden con el siguiente: ningún punto
   * muestra una respuesta suelta.
   */
  @ApiProperty({ example: '2026-10-05' })
  period!: string;

  /** Cuestionarios respondidos, de los emitidos en ese tramo. */
  @ApiProperty()
  answered!: number;

  /**
   * Promedio de satisfacción del tramo, sólo si lo sostienen al menos
   * {@link MIN_COHORT} respuestas. Sale de la pregunta de satisfacción global;
   * si el resumen no tiene ninguna, del promedio de las preguntas de escala 1-5.
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

/** Aviso de privacidad del resumen. */
export class InsightsPrivacyDto {
  /** Respondidas necesarias para mostrar cálculos. */
  @ApiProperty({ example: MIN_COHORT })
  minCohort!: number;

  /**
   * `true` si el alcance filtrado tiene menos respondidas que `minCohort`: sólo
   * vienen `totals` y `privacy`; el resto de los campos no se envía.
   */
  @ApiProperty()
  suppressed!: boolean;
}

/**
 * Resumen general de cómo le va al profesional, en agregado.
 *
 * **No contiene nada que identifique al paciente ni a la atención**: ni
 * `patient_profile_id`, ni `appointment_booking_id`, ni la hora de los envíos.
 * Con menos de {@link MIN_COHORT} respuestas en el alcance filtrado sólo
 * devuelve `totals` y `privacy.suppressed = true`.
 */
export class SurveyInsightsDto {
  /** Emitidos, respondidos y tasa. Siempre presente. */
  @ApiProperty({ type: InsightsTotalsDto })
  totals!: InsightsTotalsDto;

  /** Umbral de privacidad aplicado. Siempre presente. */
  @ApiProperty({ type: InsightsPrivacyDto })
  privacy!: InsightsPrivacyDto;

  /** NPS de la pregunta de recomendación. Ausente si `privacy.suppressed`. */
  @ApiPropertyOptional({ type: InsightsNpsDto })
  nps?: InsightsNpsDto;

  /** Una entrada por pregunta (o dimensión), con su `n`. Ausente si suprimido. */
  @ApiPropertyOptional({ type: [InsightsQuestionDto] })
  byQuestion?: InsightsQuestionDto[];

  /** Tendencia por tramos de fecha de emisión. Ausente si suprimido. */
  @ApiPropertyOptional({ type: [InsightsTrendPointDto] })
  trend?: InsightsTrendPointDto[];

  /** Granularidad de `trend`, según la amplitud del periodo. Ausente si suprimido. */
  @ApiPropertyOptional({ enum: ['DAY', 'WEEK', 'MONTH'] })
  trendGranularity?: InsightsTrendGranularity;

  /** Alertas de seguridad. Ausente si suprimido. */
  @ApiPropertyOptional({ type: InsightsSafetyAlertsDto })
  safetyAlerts?: InsightsSafetyAlertsDto;

  /**
   * Comentarios abiertos (tope 20), en un orden estable que no es
   * cronológico. Ausente si suprimido.
   */
  @ApiPropertyOptional({ type: [InsightsCommentDto] })
  comments?: InsightsCommentDto[];
}
