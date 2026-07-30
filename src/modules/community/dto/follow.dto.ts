import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /community/follows` (UC-19-05). */
export class CreateFollowDto {
  /**
   * Identificador asociado a follower profile.
   */
  @ApiProperty({ description: 'Perfil que sigue', format: 'uuid' })
  @IsUUID()
  followerProfileId!: string;

  /**
   * Valor de followable type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de objeto seguido',
    enum: ['PROFILE', 'TOPIC', 'HASHTAG', 'GROUP'],
  })
  @IsIn(['PROFILE', 'TOPIC', 'HASHTAG', 'GROUP'])
  followableType!: 'PROFILE' | 'TOPIC' | 'HASHTAG' | 'GROUP';

  /**
   * Identificador asociado a followable ref.
   */
  @ApiProperty({ description: 'Id del objeto seguido', format: 'uuid' })
  @IsUUID()
  followableRefId!: string;

  /**
   * Valor de notification level mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Nivel de notificación',
    enum: ['ALL', 'HIGHLIGHTS', 'NONE'],
  })
  @IsOptional()
  @IsIn(['ALL', 'HIGHLIGHTS', 'NONE'])
  notificationLevel?: 'ALL' | 'HIGHLIGHTS' | 'NONE';
}
