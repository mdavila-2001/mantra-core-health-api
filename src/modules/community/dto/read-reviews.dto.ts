import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Puntuación de una dimensión concreta de la review. */
export class ReviewDimensionScoreDto {
  /** Concept id de la dimensión evaluada. */
  @ApiProperty({ format: 'uuid' })
  dimensionConceptId!: string;

  /** Puntuación otorgada. */
  @ApiProperty()
  score!: number;
}

/** Respuesta del profesional u organización a una review. */
export class ReviewResponseItemDto {
  /** Identificador de la respuesta. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Perfil que respondió. */
  @ApiProperty({ format: 'uuid' })
  responderPublicProfileId!: string;

  /** Texto de la respuesta. */
  @ApiProperty()
  responseText!: string;

  /** Cuándo se publicó. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  publishedAt?: Date | null;
}

/**
 * Una review publicada, tal como la ve el público.
 *
 * **Este DTO no expone `verified_encounter_id` ni `reviewer_patient_profile_id`,
 * y no es un olvido.** El primero identifica el encuentro clínico que respalda
 * la reseña: publicarlo diría que esa persona se atendió, ese día, con ese
 * profesional — un dato clínico que la reseña no tiene por qué revelar. El
 * segundo permitiría reconstruir quién escribió cada reseña aunque se haya
 * publicado como anónima. Lo que sí viaja es `verificationStatusConceptId`, que
 * es lo que la pantalla necesita para poner el sello de «paciente verificado»
 * sin decir de quién se trata.
 */
export class ServiceReviewDto {
  /** Identificador de la review. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Perfil calificado. */
  @ApiProperty({ format: 'uuid' })
  targetPublicProfileId!: string;

  /** Puntuación general. */
  @ApiProperty()
  overallRating!: number;

  /** Texto de la reseña. */
  @ApiPropertyOptional()
  reviewText?: string | null;

  /** Concept id del modo de presentación del autor (con nombre, anónimo). */
  @ApiPropertyOptional({ format: 'uuid' })
  reviewerDisplayModeConceptId?: string | null;

  /** Concept id del estado de verificación de la reseña. */
  @ApiProperty({ format: 'uuid' })
  verificationStatusConceptId!: string;

  /** Cuándo se publicó. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  publishedAt?: Date | null;

  /** Si fue editada, cuándo. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  editedAt?: Date | null;

  /** Puntuaciones por dimensión. */
  @ApiProperty({ type: [ReviewDimensionScoreDto] })
  dimensionScores!: ReviewDimensionScoreDto[];

  /** Respuestas del calificado. */
  @ApiProperty({ type: [ReviewResponseItemDto] })
  responses!: ReviewResponseItemDto[];
}

/** Página de reviews de un perfil (UC-19-11, cara de lectura). */
export class ServiceReviewPageDto {
  /** Reviews de la página. */
  @ApiProperty({ type: [ServiceReviewDto] })
  items!: ServiceReviewDto[];

  /** Cuántas trae esta página. */
  @ApiProperty()
  count!: number;

  /** Tope pedido. */
  @ApiProperty()
  limit!: number;

  /** Cursor de la página siguiente, o `null`. */
  @ApiPropertyOptional({ nullable: true })
  nextCursor!: string | null;
}
