import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /geo/tracking-sessions` (UC-13-02). */
export class StartTrackingSessionDto {
  /**
   * Identificador asociado a tracked subject.
   */
  @ApiProperty({ description: 'Sujeto rastreado a seguir', format: 'uuid' })
  @IsUUID()
  trackedSubjectId!: string;

  /**
   * Identificador asociado a purpose concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del propósito de la sesión',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  purposeConceptId?: string;

  /**
   * Valor de related resource type mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tipo de recurso relacionado (p. ej. encounter/dispatch)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  relatedResourceType?: string;

  /**
   * Identificador asociado a related resource.
   */
  @ApiPropertyOptional({
    description: 'Id del recurso relacionado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  relatedResourceId?: string;
}
