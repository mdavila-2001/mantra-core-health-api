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
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ownerTeam?: string;
}

/** Clasificación de datos a garantizar (UPSERT por code). */
export class CatalogClassificationDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Rango de sensibilidad (mayor = más sensible)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  rank?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPii?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPhi?: boolean;

  @ApiPropertyOptional({ description: 'Reglas de manejo (JSON libre)' })
  @IsOptional()
  @IsObject()
  handlingRulesJson?: Record<string, unknown>;
}

/** Un campo del catálogo de la entidad. */
export class CatalogFieldDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  columnName!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPii?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPhi?: boolean;

  @ApiPropertyOptional({ description: 'Estrategia de enmascaramiento (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  maskingStrategyConceptId?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

/** Cuerpo de `POST /admin/governance/entity-registry` (UC-11-01). */
export class CatalogEntityDto {
  @ApiProperty({ type: CatalogDomainDto })
  @ValidateNested()
  @Type(() => CatalogDomainDto)
  domain!: CatalogDomainDto;

  @ApiProperty({ type: CatalogClassificationDto })
  @ValidateNested()
  @Type(() => CatalogClassificationDto)
  classification!: CatalogClassificationDto;

  @ApiProperty({ description: 'Esquema físico de la tabla', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  schemaName!: string;

  @ApiProperty({ description: 'Nombre físico de la tabla', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  tableName!: string;

  @ApiProperty()
  @IsBoolean()
  isAppendOnly!: boolean;

  @ApiProperty()
  @IsBoolean()
  isSoftDelete!: boolean;

  @ApiProperty()
  @IsBoolean()
  hasHistory!: boolean;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  historyTable?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  containsPii?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  containsPhi?: boolean;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ownerTeam?: string;

  @ApiProperty({ type: [CatalogFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogFieldDto)
  fields!: CatalogFieldDto[];
}

/** Respuesta del catálogo de entidad. */
export class EntityRegistryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  domainId!: string;

  @ApiProperty({ format: 'uuid' })
  classificationId!: string;

  @ApiProperty()
  schemaName!: string;

  @ApiProperty()
  tableName!: string;

  @ApiProperty({ type: [String], description: 'Ids de los campos catalogados' })
  fieldIds!: string[];
}

/** Cuerpo de `PATCH /admin/governance/field-registry/{id}` (UC-11-04). */
export class UpdateFieldRegistryDto {
  @ApiPropertyOptional({ description: 'Regla de anonimización a asignar', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  anonymizationRuleId?: string;

  @ApiPropertyOptional({ description: 'Estrategia de enmascaramiento (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  maskingStrategyConceptId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPii?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPhi?: boolean;
}
