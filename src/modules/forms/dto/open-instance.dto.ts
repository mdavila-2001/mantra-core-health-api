import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /forms/instances` (UC-09-07). */
export class OpenInstanceDto {
  @ApiProperty({
    description: 'Recurso al que se adjunta el formulario',
    format: 'uuid',
  })
  @IsUUID()
  resourceId!: string;

  @ApiPropertyOptional({
    description: 'Tipo de recurso (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  resourceTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Contexto de tenant', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantContextId?: string;

  @ApiPropertyOptional({
    description: 'Versión publicada del set cuyo schema se congela',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  definitionSetVersionId?: string;

  @ApiPropertyOptional({
    description: 'Versión de schema explícita',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  schemaVersion?: number;
}
