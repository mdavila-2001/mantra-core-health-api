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

  // `definitionSetVersionId` ya no está: prometía «congelar el schema de la
  // versión publicada», pero `form_instances` no tiene dónde guardarlo
  // (diagram_09_forms.puml) y el servidor lo ignoraba con un 201. Ahora
  // responde 400 hasta que el modelo declare la columna.

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
