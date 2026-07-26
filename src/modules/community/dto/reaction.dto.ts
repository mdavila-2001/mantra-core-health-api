import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';

/** Cuerpo de `PUT /community/reactions` (UC-19-03, upsert 1x actor/objeto). */
export class ReactionDto {
  @ApiProperty({ description: 'Perfil que reacciona', format: 'uuid' })
  @IsUUID()
  actorProfileId!: string;

  @ApiProperty({ description: 'Tipo de objeto', enum: ['POST', 'COMMENT', 'REVIEW'] })
  @IsIn(['POST', 'COMMENT', 'REVIEW'])
  reactableType!: 'POST' | 'COMMENT' | 'REVIEW';

  @ApiProperty({ description: 'Id del objeto', format: 'uuid' })
  @IsUUID()
  reactableRefId!: string;

  @ApiProperty({ description: 'Tipo de reacción', enum: ['LIKE', 'LOVE', 'INSIGHTFUL', 'CELEBRATE', 'SUPPORT'] })
  @IsIn(['LIKE', 'LOVE', 'INSIGHTFUL', 'CELEBRATE', 'SUPPORT'])
  reactionType!: 'LIKE' | 'LOVE' | 'INSIGHTFUL' | 'CELEBRATE' | 'SUPPORT';
}
