import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsOptional, IsUUID } from 'class-validator';

/**
 * Cuerpo de `POST /internal/community/feed/rebuild` (UC-19-15). Worker de fan-out:
 * proyecta un post publicado al feed de sus seguidores.
 */
export class RebuildFeedDto {
  @ApiProperty({ description: 'Post fuente publicado', format: 'uuid' })
  @IsUUID()
  sourceRefId!: string;

  @ApiProperty({
    description: 'Perfiles destinatarios (seguidores)',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  followerProfileIds!: string[];

  @ApiPropertyOptional({
    description: 'Origen del item',
    enum: ['FOLLOWING', 'GROUP', 'TOPIC', 'SUGGESTED', 'PROMOTED'],
  })
  @IsOptional()
  @IsIn(['FOLLOWING', 'GROUP', 'TOPIC', 'SUGGESTED', 'PROMOTED'])
  origin?: 'FOLLOWING' | 'GROUP' | 'TOPIC' | 'SUGGESTED' | 'PROMOTED';
}
