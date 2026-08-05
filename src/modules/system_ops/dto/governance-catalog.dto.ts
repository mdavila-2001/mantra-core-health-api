import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Dominio de datos a garantizar (UPSERT por code). */
export class CatalogDomainDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Valor de owner team mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ownerTeam?: string;
}

/** Clasificación de datos a garantizar (UPSERT por code). */
export class CatalogClassificationDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Valor de rank mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Rango de sensibilidad (mayor = más sensible)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  rank?: number;

  /**
   * Valor de is pii mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPii?: boolean;

  /**
   * Valor de is phi mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPhi?: boolean;

  /**
   * Valor de handling rules json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Reglas de manejo (JSON libre)' })
  @IsOptional()
  @IsObject()
  handlingRulesJson?: Record<string, unknown>;
}

/** Un campo del catálogo de la entidad. */
export class CatalogFieldDto {
  /**
   * Valor de column name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  columnName!: string;

  /**
   * Valor de is pii mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPii?: boolean;

  /**
   * Valor de is phi mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPhi?: boolean;

  /**
   * Identificador asociado a masking strategy concept.
   */
  @ApiPropertyOptional({
    description: 'Estrategia de enmascaramiento (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  maskingStrategyConceptId?: string;

  /**
   * Valor de notes mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

/** Cuerpo de `POST /admin/governance/entity-registry` (UC-11-01). */
export class CatalogEntityDto {
  /**
   * Valor de domain mantenido por la instancia.
   */
  @ApiProperty({ type: CatalogDomainDto })
  @ValidateNested()
  @Type(() => CatalogDomainDto)
  domain!: CatalogDomainDto;

  /**
   * Valor de classification mantenido por la instancia.
   */
  @ApiProperty({ type: CatalogClassificationDto })
  @ValidateNested()
  @Type(() => CatalogClassificationDto)
  classification!: CatalogClassificationDto;

  /**
   * Valor de schema name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Esquema físico de la tabla', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  schemaName!: string;

  /**
   * Valor de table name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre físico de la tabla', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  tableName!: string;

  /**
   * Valor de is append only mantenido por la instancia.
   */
  @ApiProperty()
  @IsBoolean()
  isAppendOnly!: boolean;

  /**
   * Valor de is soft delete mantenido por la instancia.
   */
  @ApiProperty()
  @IsBoolean()
  isSoftDelete!: boolean;

  /**
   * Valor de has history mantenido por la instancia.
   */
  @ApiProperty()
  @IsBoolean()
  hasHistory!: boolean;

  /**
   * Valor de history table mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  historyTable?: string;

  /**
   * Valor de contains pii mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  containsPii?: boolean;

  /**
   * Valor de contains phi mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  containsPhi?: boolean;

  /**
   * Valor de owner team mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ownerTeam?: string;

  /**
   * Valor de fields mantenido por la instancia.
   */
  @ApiProperty({ type: [CatalogFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogFieldDto)
  fields!: CatalogFieldDto[];
}

/** Respuesta del catálogo de entidad. */
export class EntityRegistryResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a domain.
   */
  @ApiProperty({ format: 'uuid' })
  domainId!: string;

  /**
   * Identificador asociado a classification.
   */
  @ApiProperty({ format: 'uuid' })
  classificationId!: string;

  /**
   * Valor de schema name mantenido por la instancia.
   */
  @ApiProperty()
  schemaName!: string;

  /**
   * Valor de table name mantenido por la instancia.
   */
  @ApiProperty()
  tableName!: string;

  /**
   * Valor de field ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Ids de los campos catalogados' })
  fieldIds!: string[];
}

/** Cuerpo de `PATCH /admin/governance/field-registry/{id}` (UC-11-04). */
export class UpdateFieldRegistryDto {
  /**
   * Identificador asociado a anonymization rule.
   */
  @ApiPropertyOptional({
    description: 'Regla de anonimización a asignar',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  anonymizationRuleId?: string;

  /**
   * Identificador asociado a masking strategy concept.
   */
  @ApiPropertyOptional({
    description: 'Estrategia de enmascaramiento (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  maskingStrategyConceptId?: string;

  /**
   * Valor de is pii mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPii?: boolean;

  /**
   * Valor de is phi mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPhi?: boolean;
}
