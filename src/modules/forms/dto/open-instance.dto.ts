import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

/** Cuerpo de `POST /forms/instances` (UC-09-07). */
export class OpenInstanceDto {
  /**
   * Identificador asociado a resource.
   */
  @ApiProperty({
    description: 'Recurso al que se adjunta el formulario',
    format: 'uuid',
  })
  @IsUUID()
  resourceId!: string;

  /**
   * Identificador asociado a resource type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de recurso (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  resourceTypeConceptId?: string;

  /**
   * Identificador asociado a tenant context.
   */
  @ApiPropertyOptional({ description: 'Contexto de tenant', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantContextId?: string;

  /**
   * Identificador asociado a definition set version.
   */
  @ApiPropertyOptional({
    description: 'Versión publicada del set cuyo schema se congela',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  definitionSetVersionId?: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión de schema explícita',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  schemaVersion?: number;
}
