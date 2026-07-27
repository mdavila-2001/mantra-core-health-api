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
  @ApiProperty({
    description: 'Tenant al que aplica la frontera',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({
    description: 'Tipo de frontera (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  boundaryTypeConceptId?: string;

  @ApiProperty({ description: 'Tenant controlador de datos', format: 'uuid' })
  @IsUUID()
  dataControllerTenantId!: string;

  @ApiPropertyOptional({
    description: 'Tenant procesador de datos',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dataProcessorTenantId?: string;

  @ApiPropertyOptional({
    description: 'Jurisdicción (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  @ApiPropertyOptional({
    description: 'Región de residencia (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  residencyRegionConceptId?: string;

  @ApiPropertyOptional({
    description: 'Value set de propósitos permitidos',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  allowedPurposeValueSetId?: string;

  @ApiPropertyOptional({
    description: 'Nombre del schema de aislamiento',
    maxLength: 120,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  isolationSchemaName?: string;

  @ApiPropertyOptional({
    description: 'Versión de la política de aislamiento',
    maxLength: 40,
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  isolationPolicyVersion?: string;

  @ApiPropertyOptional({
    description: 'Efectivo desde (ISO date-time); por defecto ahora',
  })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}
