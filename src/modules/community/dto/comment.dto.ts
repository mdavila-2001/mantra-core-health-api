import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { MentionInputDto } from './post.dto';

/**
 * Un adjunto de comentario (REQ-01-011: imágenes, stickers y GIFs).
 *
 * Misma forma que `PostMediaInputDto`: `fileId` sale de
 * `POST /common/files/upload`, y `mediaRole` es el mismo enum salvo que acá
 * suma `STICKER` y `GIF` — un comentario no lleva video ni documento.
 */
export class CommentMediaInputDto {
  /**
   * Identificador asociado a file.
   */
  @ApiProperty({ description: 'Id del archivo (common.files)', format: 'uuid' })
  @IsUUID()
  fileId!: string;

  /**
   * Valor de media role mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Rol del medio',
    enum: ['IMAGE', 'STICKER', 'GIF'],
  })
  @IsOptional()
  // Mismo motivo que en `PostMediaInputDto`: un rol fuera del enum resolvería
  // `undefined` contra una columna NOT NULL y el `INSERT` moriría con un 500
  // en vez de un 400 legible.
  @IsIn(['IMAGE', 'STICKER', 'GIF'])
  mediaRole?: 'IMAGE' | 'STICKER' | 'GIF';

  /**
   * Valor de alt text mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  altText?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Orden de despliegue' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}

/** Cuerpo de `POST /community/comments` (UC-19-02). */
export class CreateCommentDto {
  /**
   * Identificador asociado a author profile.
   */
  @ApiProperty({ description: 'Perfil autor del comentario', format: 'uuid' })
  @IsUUID()
  authorProfileId!: string;

  /**
   * Valor de commentable type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de contenido comentado',
    enum: ['POST', 'COMMENT', 'REVIEW'],
  })
  @IsIn(['POST', 'COMMENT', 'REVIEW'])
  commentableType!: 'POST' | 'COMMENT' | 'REVIEW';

  /**
   * Identificador asociado a commentable ref.
   */
  @ApiProperty({ description: 'Id del contenido comentado', format: 'uuid' })
  @IsUUID()
  commentableRefId!: string;

  /**
   * Identificador asociado a parent comment.
   */
  @ApiPropertyOptional({
    description: 'Comentario padre (para respuesta anidada)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;

  /**
   * Valor de body text mantenido por la instancia.
   */
  @ApiProperty({ description: 'Texto del comentario', maxLength: 3000 })
  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  bodyText!: string;

  /**
   * Valor de mentions mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [MentionInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => MentionInputDto)
  mentions?: MentionInputDto[];

  /**
   * Adjuntos del comentario (REQ-01-011). Tope bajo y a propósito: un
   * comentario no es una publicación — cuatro adjuntos alcanzan para una
   * imagen, un sticker y un par de GIFs sin convertir el hilo en una galería.
   */
  @ApiPropertyOptional({ type: [CommentMediaInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => CommentMediaInputDto)
  media?: CommentMediaInputDto[];
}
