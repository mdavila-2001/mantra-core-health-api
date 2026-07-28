import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsUUID } from 'class-validator';

/** Cuerpo de `PUT /community/reactions` (UC-19-03, upsert 1x actor/objeto). */
export class ReactionDto {
  /**
   * Identificador asociado a actor profile.
   */
  @ApiProperty({ description: 'Perfil que reacciona', format: 'uuid' })
  @IsUUID()
  actorProfileId!: string;

  /**
   * Valor de reactable type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de objeto',
    enum: ['POST', 'COMMENT', 'REVIEW'],
  })
  @IsIn(['POST', 'COMMENT', 'REVIEW'])
  reactableType!: 'POST' | 'COMMENT' | 'REVIEW';

  /**
   * Identificador asociado a reactable ref.
   */
  @ApiProperty({ description: 'Id del objeto', format: 'uuid' })
  @IsUUID()
  reactableRefId!: string;

  /**
   * Valor de reaction type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de reacción',
    enum: ['LIKE', 'LOVE', 'INSIGHTFUL', 'CELEBRATE', 'SUPPORT'],
  })
  @IsIn(['LIKE', 'LOVE', 'INSIGHTFUL', 'CELEBRATE', 'SUPPORT'])
  reactionType!: 'LIKE' | 'LOVE' | 'INSIGHTFUL' | 'CELEBRATE' | 'SUPPORT';
}
