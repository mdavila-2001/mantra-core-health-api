import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /orgext/data-boundaries` (UC-22-08). */
export class CreateDataBoundaryDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({
    description: 'Tenant al que aplica la frontera',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a boundary type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de frontera (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  boundaryTypeConceptId?: string;

  /**
   * Identificador asociado a data controller tenant.
   */
  @ApiProperty({ description: 'Tenant controlador de datos', format: 'uuid' })
  @IsUUID()
  dataControllerTenantId!: string;

  /**
   * Identificador asociado a data processor tenant.
   */
  @ApiPropertyOptional({
    description: 'Tenant procesador de datos',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dataProcessorTenantId?: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @ApiPropertyOptional({
    description: 'Jurisdicción (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  /**
   * Identificador asociado a residency region concept.
   */
  @ApiPropertyOptional({
    description: 'Región de residencia (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  residencyRegionConceptId?: string;

  /**
   * Identificador asociado a allowed purpose value set.
   */
  @ApiPropertyOptional({
    description: 'Value set de propósitos permitidos',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  allowedPurposeValueSetId?: string;

  /**
   * Valor de isolation schema name mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Nombre del schema de aislamiento',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  isolationSchemaName?: string;

  /**
   * Valor de isolation policy version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión de la política de aislamiento',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  isolationPolicyVersion?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Efectivo desde (ISO date-time); por defecto ahora',
  })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}
