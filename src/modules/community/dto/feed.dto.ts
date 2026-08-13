import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsUUID } from 'class-validator';

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
