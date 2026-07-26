import { ApiProperty } from '@nestjs/swagger';

/** Respuesta genérica que expone solo el id del recurso creado. */
export class IdResponseDto {
  @ApiProperty({ description: 'Identificador del recurso', format: 'uuid' })
  id!: string;
}

/** Respuesta de creación de perfil público. */
export class PublicProfileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  displayName!: string;

  @ApiProperty()
  status!: string;
}

/** Respuesta de publicación de post (UC-19-01). */
export class PostResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  authorPublicProfileId!: string;

  @ApiProperty()
  publicationStatus!: string;

  @ApiProperty({ description: 'Nº de adjuntos persistidos' })
  mediaCount!: number;

  @ApiProperty({ description: 'Nº de hashtags vinculados' })
  hashtagCount!: number;

  @ApiProperty({ type: String, nullable: true })
  publishedAt!: Date | null;
}

/** Respuesta de creación de comentario (UC-19-02). */
export class CommentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  rootCommentId!: string | null;

  @ApiProperty()
  threadDepth!: number;
}

/** Respuesta de reacción (UC-19-03). */
export class ReactionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'true si se creó, false si se actualizó una existente' })
  created!: boolean;

  @ApiProperty()
  reactionType!: string;
}

/** Respuesta de envío de mensaje directo (UC-19-06). */
export class MessageResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  @ApiProperty({ type: String })
  sentAt!: Date;
}

/** Respuesta de marcado de leído (UC-19-07). */
export class ReadReceiptResponseDto {
  @ApiProperty({ description: 'Nº de recibos de lectura registrados' })
  receiptsRecorded!: number;

  @ApiProperty({ format: 'uuid', nullable: true })
  lastReadMessageId!: string | null;
}

/** Respuesta de reporte de contenido (UC-19-08). */
export class ReportResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', description: 'Entrada de cola de moderación asociada' })
  moderationQueueId!: string;
}

/** Respuesta de decisión de moderación (UC-19-09). */
export class ModerationDecisionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', nullable: true, description: 'Strike emitido, si aplica' })
  strikeId!: string | null;

  @ApiProperty()
  decision!: string;
}

/** Respuesta de review verificada (UC-19-11); nunca expone verified_encounter_id. */
export class ReviewResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  overallRating!: number;

  @ApiProperty({ description: 'true si la review quedó verificada' })
  verified!: boolean;

  @ApiProperty({ description: 'Nº de dimensiones puntuadas' })
  dimensionCount!: number;
}

/** Respuesta de creación de encuesta (bootstrap de UC-19-12). */
export class PollResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: [String], description: 'Ids de las opciones creadas' })
  optionIds!: string[];
}

/** Respuesta de voto en encuesta (UC-19-12). */
export class VoteResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

/** Respuesta de unión a grupo (UC-19-13). */
export class GroupMembershipResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Estado de la membresía (activa o pendiente)' })
  joinStatus!: string;
}

/** Respuesta de reconstrucción de feed (UC-19-15). */
export class FeedRebuildResponseDto {
  @ApiProperty({ description: 'Nº de items de feed insertados' })
  itemsCreated!: number;
}
