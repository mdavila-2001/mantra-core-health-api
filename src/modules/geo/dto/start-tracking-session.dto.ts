import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /geo/tracking-sessions` (UC-13-02). */
export class StartTrackingSessionDto {
  @ApiProperty({ description: 'Sujeto rastreado a seguir', format: 'uuid' })
  @IsUUID()
  trackedSubjectId!: string;

  @ApiPropertyOptional({ description: 'Concept id del propósito de la sesión', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  purposeConceptId?: string;

  @ApiPropertyOptional({ description: 'Tipo de recurso relacionado (p. ej. encounter/dispatch)' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  relatedResourceType?: string;

  @ApiPropertyOptional({ description: 'Id del recurso relacionado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  relatedResourceId?: string;
}
