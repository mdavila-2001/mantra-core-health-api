import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Un adjunto multimedia del post. */
export class PostMediaInputDto {
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
    enum: ['IMAGE', 'VIDEO', 'DOCUMENT'],
  })
  @IsOptional()
  @IsString()
  mediaRole?: 'IMAGE' | 'VIDEO' | 'DOCUMENT';

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

/** Una mención a un perfil dentro del cuerpo. */
export class MentionInputDto {
  /**
   * Identificador asociado a mentioned profile.
   */
  @ApiProperty({ description: 'Perfil mencionado', format: 'uuid' })
  @IsUUID()
  mentionedProfileId!: string;

  /**
   * Valor de offset start mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  offsetStart?: number;

  /**
   * Valor de offset end mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  offsetEnd?: number;
}

/** Cuerpo de `POST /community/profiles/{profileId}/posts` (UC-19-01). */
export class CreatePostDto {
  /**
   * Valor de body text mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Texto del post (sin PHI identificable)',
    maxLength: 5000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  bodyText!: string;

  /**
   * Valor de post type mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tipo de post', enum: ['TEXT', 'POLL'] })
  @IsOptional()
  @IsString()
  postType?: 'TEXT' | 'POLL';

  /**
   * Valor de comments enabled mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Comentarios habilitados' })
  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;

  /**
   * Valor de media mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [PostMediaInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PostMediaInputDto)
  media?: PostMediaInputDto[];

  /**
   * Valor de hashtags mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [String], description: 'Hashtags (sin #)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  hashtags?: string[];

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
}
