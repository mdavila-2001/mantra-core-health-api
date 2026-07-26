import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { MentionInputDto } from './post.dto';

/** Cuerpo de `POST /community/comments` (UC-19-02). */
export class CreateCommentDto {
  @ApiProperty({ description: 'Perfil autor del comentario', format: 'uuid' })
  @IsUUID()
  authorProfileId!: string;

  @ApiProperty({ description: 'Tipo de contenido comentado', enum: ['POST', 'COMMENT', 'REVIEW'] })
  @IsIn(['POST', 'COMMENT', 'REVIEW'])
  commentableType!: 'POST' | 'COMMENT' | 'REVIEW';

  @ApiProperty({ description: 'Id del contenido comentado', format: 'uuid' })
  @IsUUID()
  commentableRefId!: string;

  @ApiPropertyOptional({ description: 'Comentario padre (para respuesta anidada)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentCommentId?: string;

  @ApiProperty({ description: 'Texto del comentario', maxLength: 3000 })
  @IsString()
  @MinLength(1)
  @MaxLength(3000)
  bodyText!: string;

  @ApiPropertyOptional({ type: [MentionInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => MentionInputDto)
  mentions?: MentionInputDto[];
}
