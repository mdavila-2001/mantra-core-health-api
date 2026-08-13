import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Una opción de la encuesta con su recuento real. */
export class PollOptionResultDto {
  /** Identificador de la opción. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Texto de la opción. */
  @ApiProperty()
  label!: string;

  /** Orden de presentación. */
  @ApiPropertyOptional()
  ordinal?: number | null;

  /**
   * Votos contados sobre `poll_votes`.
   *
   * No se devuelve `poll_options.vote_count`: ese contador es denormalizado y
   * si quedó desfasado, mostrarlo haría que los porcentajes de la pantalla no
   * sumen el total de la encuesta.
   */
  @ApiProperty()
  voteCount!: number;
}

/** Encuesta con sus opciones, recuentos y el voto del actor (UC-19-17). */
export class PollDetailDto {
  /** Identificador de la encuesta. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Publicación que la contiene. */
  @ApiProperty({ format: 'uuid' })
  postId!: string;

  /** Pregunta. */
  @ApiProperty()
  question!: string;

  /** Si admite marcar varias opciones. */
  @ApiProperty()
  allowsMultiple!: boolean;

  /** Cuándo cierra. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  closesAt?: Date | null;

  /** Concept id del estado (abierta, cerrada). */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /** Opciones con su recuento. */
  @ApiProperty({ type: [PollOptionResultDto] })
  options!: PollOptionResultDto[];

  /** Total de votos emitidos. */
  @ApiProperty()
  totalVotes!: number;

  /**
   * Opciones que votó el actor, si preguntó por sí mismo.
   *
   * Un arreglo vacío significa «no votó»; `undefined`, «no preguntó». La
   * distinción importa porque una encuesta de opción múltiple tiene que poder
   * marcar cada casilla elegida.
   */
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  actorVotedOptionIds?: string[];
}
