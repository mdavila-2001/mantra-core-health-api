import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /community/follows` (UC-19-05). */
export class CreateFollowDto {
  @ApiProperty({ description: 'Perfil que sigue', format: 'uuid' })
  @IsUUID()
  followerProfileId!: string;

  @ApiProperty({ description: 'Tipo de objeto seguido', enum: ['PROFILE', 'TOPIC', 'HASHTAG', 'GROUP'] })
  @IsIn(['PROFILE', 'TOPIC', 'HASHTAG', 'GROUP'])
  followableType!: 'PROFILE' | 'TOPIC' | 'HASHTAG' | 'GROUP';

  @ApiProperty({ description: 'Id del objeto seguido', format: 'uuid' })
  @IsUUID()
  followableRefId!: string;

  @ApiPropertyOptional({ description: 'Nivel de notificación', enum: ['ALL', 'HIGHLIGHTS', 'NONE'] })
  @IsOptional()
  @IsIn(['ALL', 'HIGHLIGHTS', 'NONE'])
  notificationLevel?: 'ALL' | 'HIGHLIGHTS' | 'NONE';
}
