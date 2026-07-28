import { ApiProperty } from '@nestjs/swagger';

/** Respuesta genérica que expone solo el id del recurso creado. */
export class IdResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ description: 'Identificador del recurso', format: 'uuid' })
  id!: string;
}

/** Respuesta de creación de perfil público. */
export class PublicProfileResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de slug mantenido por la instancia.
   */
  @ApiProperty()
  slug!: string;

  /**
   * Valor de display name mantenido por la instancia.
   */
  @ApiProperty()
  displayName!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;
}

/** Respuesta de publicación de post (UC-19-01). */
export class PostResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a author public profile.
   */
  @ApiProperty({ format: 'uuid' })
  authorPublicProfileId!: string;

  /**
   * Valor de publication status mantenido por la instancia.
   */
  @ApiProperty()
  publicationStatus!: string;

  /**
   * Valor de media count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de adjuntos persistidos' })
  mediaCount!: number;

  /**
   * Valor de hashtag count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de hashtags vinculados' })
  hashtagCount!: number;

  /**
   * Valor de published at mantenido por la instancia.
   */
  @ApiProperty({ type: String, nullable: true })
  publishedAt!: Date | null;
}

/** Respuesta de creación de comentario (UC-19-02). */
export class CommentResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a root comment.
   */
  @ApiProperty({ format: 'uuid', nullable: true })
  rootCommentId!: string | null;

  /**
   * Valor de thread depth mantenido por la instancia.
   */
  @ApiProperty()
  threadDepth!: number;
}

/** Respuesta de reacción (UC-19-03). */
export class ReactionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de created mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si se creó, false si se actualizó una existente',
  })
  created!: boolean;

  /**
   * Valor de reaction type mantenido por la instancia.
   */
  @ApiProperty()
  reactionType!: string;
}

/** Respuesta de envío de mensaje directo (UC-19-06). */
export class MessageResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a conversation.
   */
  @ApiProperty({ format: 'uuid' })
  conversationId!: string;

  /**
   * Valor de sent at mantenido por la instancia.
   */
  @ApiProperty({ type: String })
  sentAt!: Date;
}

/** Respuesta de marcado de leído (UC-19-07). */
export class ReadReceiptResponseDto {
  /**
   * Valor de receipts recorded mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de recibos de lectura registrados' })
  receiptsRecorded!: number;

  /**
   * Identificador asociado a last read message.
   */
  @ApiProperty({ format: 'uuid', nullable: true })
  lastReadMessageId!: string | null;
}

/** Respuesta de reporte de contenido (UC-19-08). */
export class ReportResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a moderation queue.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Entrada de cola de moderación asociada',
  })
  moderationQueueId!: string;
}

/** Respuesta de decisión de moderación (UC-19-09). */
export class ModerationDecisionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a strike.
   */
  @ApiProperty({
    format: 'uuid',
    nullable: true,
    description: 'Strike emitido, si aplica',
  })
  strikeId!: string | null;

  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty()
  decision!: string;
}

/** Respuesta de review verificada (UC-19-11); nunca expone verified_encounter_id. */
export class ReviewResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de overall rating mantenido por la instancia.
   */
  @ApiProperty()
  overallRating!: number;

  /**
   * Valor de verified mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la review quedó verificada' })
  verified!: boolean;

  /**
   * Valor de dimension count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de dimensiones puntuadas' })
  dimensionCount!: number;
}

/** Respuesta de creación de encuesta (bootstrap de UC-19-12). */
export class PollResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de option ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de las opciones creadas' })
  optionIds!: string[];
}

/** Respuesta de voto en encuesta (UC-19-12). */
export class VoteResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

/** Respuesta de unión a grupo (UC-19-13). */
export class GroupMembershipResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de join status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado de la membresía (activa o pendiente)' })
  joinStatus!: string;
}

/** Respuesta de reconstrucción de feed (UC-19-15). */
export class FeedRebuildResponseDto {
  /**
   * Valor de items created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de items de feed insertados' })
  itemsCreated!: number;
}
