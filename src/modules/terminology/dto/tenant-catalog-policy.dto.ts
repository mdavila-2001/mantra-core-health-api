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
/**
 * Define el tipo de dominio catalog mode.
 */
export type CatalogMode = (typeof CATALOG_MODES)[number];

/** Configuración de un concepto dentro del catálogo del tenant. */
export class TenantConceptConfigInputDto {
  /**
   * Identificador asociado a concept.
   */
  @ApiProperty({ description: 'Concepto configurado', format: 'uuid' })
  @IsUUID()
  conceptId!: string;

  /**
   * Valor de enabled mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: true, description: 'Si el tenant lo ofrece' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  /**
   * Valor de alias display mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Nombre con el que el tenant lo muestra; exige `allowAlias`',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  aliasDisplay?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 0, description: 'Orden de presentación' })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;

  /**
   * Valor de is default mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a value set.
   */
  @ApiProperty({
    description: 'Conjunto de valores sobre el que aplica',
    format: 'uuid',
  })
  @IsUUID()
  valueSetId!: string;

  /**
   * Valor de mode mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: CATALOG_MODES, default: 'INHERIT' })
  @IsOptional()
  @IsIn(CATALOG_MODES)
  mode?: CatalogMode;

  /**
   * Valor de allow subset mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Si el tenant puede recortar el conjunto',
  })
  @IsOptional()
  @IsBoolean()
  allowSubset?: boolean;

  /**
   * Valor de allow alias mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Si el tenant puede renombrar conceptos',
  })
  @IsOptional()
  @IsBoolean()
  allowAlias?: boolean;

  /**
   * Valor de allow local concepts mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Si el tenant puede añadir conceptos locales',
  })
  @IsOptional()
  @IsBoolean()
  allowLocalConcepts?: boolean;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Desde cuándo rige',
  })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Hasta cuándo rige',
  })
  @IsOptional()
  @IsISO8601()
  validTo?: string;

  /**
   * Valor de concepts mantenido por la instancia.
   */
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
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ description: 'Id de la política' })
  id!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ description: 'Tenant al que pertenece' })
  tenantId!: string;

  /**
   * Identificador asociado a value set.
   */
  @ApiProperty({ description: 'Conjunto de valores sobre el que aplica' })
  valueSetId!: string;

  /**
   * Identificador asociado a mode concept.
   */
  @ApiPropertyOptional({ description: 'Modo del catálogo (concepto)' })
  modeConceptId?: string;

  /**
   * Valor de concepts created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Configuraciones de concepto creadas' })
  conceptsCreated!: number;

  /**
   * Valor de concepts updated mantenido por la instancia.
   */
  @ApiProperty({ description: 'Configuraciones de concepto actualizadas' })
  conceptsUpdated!: number;

  /**
   * Valor de updated mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Verdadero si la política ya existía y se actualizó',
  })
  updated!: boolean;
}
