import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /community/moderation/queue/{queueId}/decision` (UC-19-09). */
export class ModerationDecisionDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Decisión',
    enum: ['REMOVED', 'RESTRICTED', 'WARNED', 'DISMISSED'],
  })
  @IsIn(['REMOVED', 'RESTRICTED', 'WARNED', 'DISMISSED'])
  decision!: 'REMOVED' | 'RESTRICTED' | 'WARNED' | 'DISMISSED';

  /**
   * Valor de rationale text mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Motivación de la decisión',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rationaleText?: string;

  /**
   * Identificador asociado a subject profile.
   */
  @ApiPropertyOptional({
    description: 'Perfil sancionado (si la decisión emite strike)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  subjectProfileId?: string;

  /**
   * Valor de strike severity mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Severidad del strike',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
  })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  strikeSeverity?: 'LOW' | 'MEDIUM' | 'HIGH';
}
