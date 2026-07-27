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
  @ApiProperty({ description: 'Id del archivo (common.files)', format: 'uuid' })
  @IsUUID()
  fileId!: string;

  @ApiPropertyOptional({
    description: 'Rol del medio',
    enum: ['IMAGE', 'VIDEO', 'DOCUMENT'],
  })
  @IsOptional()
  @IsString()
  mediaRole?: 'IMAGE' | 'VIDEO' | 'DOCUMENT';

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  altText?: string;

  @ApiPropertyOptional({ description: 'Orden de despliegue' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;
}

/** Una mención a un perfil dentro del cuerpo. */
export class MentionInputDto {
  @ApiProperty({ description: 'Perfil mencionado', format: 'uuid' })
  @IsUUID()
  mentionedProfileId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  offsetStart?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  offsetEnd?: number;
}

/** Cuerpo de `POST /community/profiles/{profileId}/posts` (UC-19-01). */
export class CreatePostDto {
  @ApiProperty({
    description: 'Texto del post (sin PHI identificable)',
    maxLength: 5000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  bodyText!: string;

  @ApiPropertyOptional({ description: 'Tipo de post', enum: ['TEXT', 'POLL'] })
  @IsOptional()
  @IsString()
  postType?: 'TEXT' | 'POLL';

  @ApiPropertyOptional({ description: 'Comentarios habilitados' })
  @IsOptional()
  @IsBoolean()
  commentsEnabled?: boolean;

  @ApiPropertyOptional({ type: [PostMediaInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => PostMediaInputDto)
  media?: PostMediaInputDto[];

  @ApiPropertyOptional({ type: [String], description: 'Hashtags (sin #)' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  hashtags?: string[];

  @ApiPropertyOptional({ type: [MentionInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => MentionInputDto)
  mentions?: MentionInputDto[];
}
