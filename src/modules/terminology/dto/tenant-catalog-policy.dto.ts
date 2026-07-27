import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Modos admitidos del catálogo efectivo de un tenant. */
export const CATALOG_MODES = ['INHERIT', 'SUBSET', 'EXTEND'] as const;
export type CatalogMode = (typeof CATALOG_MODES)[number];

/** Configuración de un concepto dentro del catálogo del tenant. */
export class TenantConceptConfigInputDto {
  @ApiProperty({ description: 'Concepto configurado', format: 'uuid' })
  @IsUUID()
  conceptId!: string;

  @ApiPropertyOptional({ default: true, description: 'Si el tenant lo ofrece' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Nombre con el que el tenant lo muestra; exige `allowAlias`',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  aliasDisplay?: string;

  @ApiPropertyOptional({ minimum: 0, description: 'Orden de presentación' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Valor por omisión del conjunto; sólo uno puede serlo',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

/**
 * Política de catálogo de un tenant (UC-03-12).
 *
 * Es un `PUT`: define la política del par `(tenant, conjunto de valores)` entera,
 * incluida la configuración de los conceptos que se envíen.
 */
export class UpsertTenantCatalogPolicyDto {
  @ApiProperty({
    description: 'Conjunto de valores sobre el que aplica',
    format: 'uuid',
  })
  @IsUUID()
  valueSetId!: string;

  @ApiPropertyOptional({ enum: CATALOG_MODES, default: 'INHERIT' })
  @IsOptional()
  @IsIn(CATALOG_MODES)
  mode?: CatalogMode;

  @ApiPropertyOptional({
    default: false,
    description: 'Si el tenant puede recortar el conjunto',
  })
  @IsOptional()
  @IsBoolean()
  allowSubset?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Si el tenant puede renombrar conceptos',
  })
  @IsOptional()
  @IsBoolean()
  allowAlias?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Si el tenant puede añadir conceptos locales',
  })
  @IsOptional()
  @IsBoolean()
  allowLocalConcepts?: boolean;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Desde cuándo rige',
  })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Hasta cuándo rige',
  })
  @IsOptional()
  @IsISO8601()
  validTo?: string;

  @ApiPropertyOptional({
    type: [TenantConceptConfigInputDto],
    description: 'Configuración por concepto',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TenantConceptConfigInputDto)
  concepts?: TenantConceptConfigInputDto[];
}

/** Respuesta de la política de catálogo del tenant. */
export class TenantCatalogPolicyResponseDto {
  @ApiProperty({ description: 'Id de la política' })
  id!: string;

  @ApiProperty({ description: 'Tenant al que pertenece' })
  tenantId!: string;

  @ApiProperty({ description: 'Conjunto de valores sobre el que aplica' })
  valueSetId!: string;

  @ApiPropertyOptional({ description: 'Modo del catálogo (concepto)' })
  modeConceptId?: string;

  @ApiProperty({ description: 'Configuraciones de concepto creadas' })
  conceptsCreated!: number;

  @ApiProperty({ description: 'Configuraciones de concepto actualizadas' })
  conceptsUpdated!: number;

  @ApiProperty({
    description: 'Verdadero si la política ya existía y se actualizó',
  })
  updated!: boolean;
}
