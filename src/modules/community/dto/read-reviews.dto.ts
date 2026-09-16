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

  /**
   * Cómo firma quien escribió, o `null` si la publicó como anónima.
   *
   * Sale del modo que el propio autor eligió al publicarla
   * (`reviewer_display_mode_concept_id`): con nombre real viaja su nombre, y
   * con modo anónimo viaja `null` — nunca el nombre «por si acaso». Es el
   * único dato del autor que sale de acá, y sale porque él decidió que
   * saliera; `reviewer_patient_profile_id` sigue sin publicarse, así que una
   * reseña anónima no se puede reconstruir desde esta respuesta.
   *
   * La pantalla que lo reciba en `null` dice «Paciente verificado», no el
   * nombre vacío.
   */
  @ApiPropertyOptional({ nullable: true })
  reviewerDisplayName?: string | null;

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

/**
 * Las reseñas de una ficha pública, con su promedio (P31).
 *
 * Es la misma página que `ServiceReviewPageDto` más las dos cifras de la
 * cabecera. Van juntas y no en dos peticiones porque la cabecera y la lista se
 * dibujan a la vez: pedirlas por separado deja la pantalla mostrando «4,6 de 5»
 * arriba y un hueco abajo, o al revés.
 *
 * **El promedio no se calcula sobre `items`.** Es el de TODAS las reseñas
 * publicadas del perfil, no el de la página que se está mirando: promediar la
 * primera página daría un número que cambia al pasar a la segunda.
 */
export class PublicProfileReviewsDto extends ServiceReviewPageDto {
  /**
   * Promedio de estrellas del perfil, con una decimal, o `null` si no tiene
   * ninguna reseña publicada.
   *
   * `null` y no `0`: cero estrellas es una calificación pésima y «todavía nadie
   * calificó» no lo es. Quien lo reciba tiene que decir «sin calificaciones».
   */
  @ApiPropertyOptional({ nullable: true, example: 4.6 })
  ratingAverage!: number | null;

  /** Cuántas reseñas publicadas tiene el perfil en total. */
  @ApiProperty()
  ratingCount!: number;
}
