import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /community/moderation/queue/{queueId}/decision` (UC-19-09). */
export class ModerationDecisionDto {
  @ApiProperty({ description: 'Decisión', enum: ['REMOVED', 'RESTRICTED', 'WARNED', 'DISMISSED'] })
  @IsIn(['REMOVED', 'RESTRICTED', 'WARNED', 'DISMISSED'])
  decision!: 'REMOVED' | 'RESTRICTED' | 'WARNED' | 'DISMISSED';

  @ApiPropertyOptional({ description: 'Motivación de la decisión', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rationaleText?: string;

  @ApiPropertyOptional({ description: 'Perfil sancionado (si la decisión emite strike)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  subjectProfileId?: string;

  @ApiPropertyOptional({ description: 'Severidad del strike', enum: ['LOW', 'MEDIUM', 'HIGH'] })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  strikeSeverity?: 'LOW' | 'MEDIUM' | 'HIGH';
}
