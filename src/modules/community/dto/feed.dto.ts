import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNumberString,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';

/**
 * Cuerpo de `POST /internal/community/feed/rebuild` (UC-19-15). Worker de fan-out:
 * proyecta un post publicado al feed de sus seguidores.
 */
export class RebuildFeedDto {
  /**
   * Identificador asociado a source ref.
   */
  @ApiProperty({ description: 'Post fuente publicado', format: 'uuid' })
  @IsUUID()
  sourceRefId!: string;

  /**
   * Valor de follower profile ids mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Perfiles destinatarios (seguidores)',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  followerProfileIds!: string[];

  /**
   * Valor de origin mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Origen del item',
    enum: ['FOLLOWING', 'GROUP', 'TOPIC', 'SUGGESTED', 'PROMOTED'],
  })
  @IsOptional()
  @IsIn(['FOLLOWING', 'GROUP', 'TOPIC', 'SUGGESTED', 'PROMOTED'])
  origin?: 'FOLLOWING' | 'GROUP' | 'TOPIC' | 'SUGGESTED' | 'PROMOTED';
}

/** Una publicación pendiente de repartir, con sus destinatarios ya resueltos. */
export class FeedPendingItemDto {
  /** Publicación a repartir. */
  @ApiProperty({ description: 'Post publicado sin fan-out', format: 'uuid' })
  postId!: string;

  /** Perfil autor de la publicación. */
  @ApiProperty({ description: 'Perfil autor', format: 'uuid' })
  authorProfileId!: string;

  /**
   * Seguidores activos del autor.
   *
   * Puede venir vacío: el post existe pero nadie sigue a su autor. El worker
   * igual lo procesa para dejar registro del intento.
   */
  @ApiProperty({ description: 'Perfiles destinatarios', type: [String] })
  followerProfileIds!: string[];
}

/**
 * Respuesta de `GET /internal/community/feed/pending`.
 *
 * El «descubre lote» del fan-out: `rebuild` reparte un post a una lista dada, y
 * esta operación es la que arma esa lista para un worker que corre solo.
 */
export class FeedPendingResponseDto {
  /** Publicaciones pendientes del lote. */
  @ApiProperty({ type: [FeedPendingItemDto] })
  items!: FeedPendingItemDto[];
}

/**
 * Un ítem del feed pendiente de recalcular su 'rank_score', con las señales
 * crudas que el worker necesita para aplicar la fórmula (UC-19-16).
 */
export class FeedRankingPendingItemDto {
  /** Ítem de feed a puntuar. */
  @ApiProperty({ description: 'Ítem de feed', format: 'uuid' })
  feedItemId!: string;

  /** Publicación fuente del ítem. */
  @ApiProperty({ description: 'Post fuente', format: 'uuid' })
  postId!: string;

  /** Perfil dueño de este ítem del feed (el lector). */
  @ApiProperty({ description: 'Perfil dueño del feed', format: 'uuid' })
  ownerProfileId!: string;

  /** Perfil autor de la publicación fuente. */
  @ApiProperty({ description: 'Perfil autor', format: 'uuid' })
  authorProfileId!: string;

  /** Cuándo se creó el ítem del feed (ISO-8601). */
  @ApiProperty({ description: 'Alta del ítem' })
  itemCreatedAt!: string;

  /**
   * Cuándo se publicó el post fuente (ISO-8601), o 'null' si el post ya no
   * existe o nunca tuvo fecha de publicación.
   */
  @ApiProperty({ description: 'Publicación del post fuente', nullable: true })
  postPublishedAt!: string | null;

  /** Reacciones vigentes del post fuente. */
  @ApiProperty({ description: 'Reacciones del post' })
  reactionCount!: number;

  /** Comentarios vigentes del post fuente. */
  @ApiProperty({ description: 'Comentarios del post' })
  commentCount!: number;
}

/** Respuesta de 'GET /internal/community/feed/ranking/pending'. */
export class FeedRankingPendingResponseDto {
  /** Lote de ítems a puntuar. */
  @ApiProperty({ type: [FeedRankingPendingItemDto] })
  items!: FeedRankingPendingItemDto[];
}

/** Un puntaje recalculado, listo para aplicar. */
export class FeedRankingUpdateDto {
  /** Ítem de feed cuyo puntaje se aplica. */
  @ApiProperty({ description: 'Ítem de feed', format: 'uuid' })
  @IsUUID()
  feedItemId!: string;

  /**
   * Puntaje recalculado. Viaja como texto: la columna es 'numeric' y el
   * worker ya lo formateó con la precisión final — convertirlo a número acá
   * reintroduciría el redondeo de punto flotante que el texto evita.
   */
  @ApiProperty({ description: 'Nuevo rank_score, como texto decimal' })
  @IsNumberString()
  rankScore!: string;
}

/** Tope de ítems por lote de ranking, igual en `ranking/pending` y `ranking/apply`. */
export const FEED_RANKING_MAX_BATCH = 500;

/** Cuerpo de 'POST /internal/community/feed/ranking/apply' (UC-19-16). */
export class ApplyFeedRankingDto {
  /** Puntajes recalculados del lote. */
  @ApiProperty({
    type: [FeedRankingUpdateDto],
    maxItems: FEED_RANKING_MAX_BATCH,
  })
  @IsArray()
  @ArrayMaxSize(FEED_RANKING_MAX_BATCH)
  @ValidateNested({ each: true })
  @Type(() => FeedRankingUpdateDto)
  updates!: FeedRankingUpdateDto[];
}

/** Respuesta de 'POST /internal/community/feed/ranking/apply'. */
export class FeedRankingApplyResponseDto {
  /** Cuántos ítems se actualizaron de verdad. */
  @ApiProperty({ description: 'Ítems actualizados' })
  updated!: number;
}
