import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Tipos de política que el portal lista (una por tabla de `system_ops`). */
export const GOVERNANCE_POLICY_TYPES = [
  'WRITE',
  'RETENTION',
  'ANONYMIZATION',
  'CLASSIFICATION',
  'RESIDENCY',
] as const;
export type GovernancePolicyType = (typeof GOVERNANCE_POLICY_TYPES)[number];

/** Niveles de sensibilidad que cuentan como dato personal o secreto en el inventario. */
export const GOVERNANCE_PII_SENSITIVITIES = [
  'PERSONAL',
  'PHI_IDENTIFIER',
  'PHI_SENSITIVE',
  'PHI_SPECIAL',
  'CREDENTIAL',
] as const;

/** De dónde sale una fila del inventario de campos. */
export const GOVERNANCE_PII_SOURCES = ['CATALOG', 'REGISTRY', 'BOTH'] as const;

/** Tope de filas por página de los listados de gobierno. */
export const GOVERNANCE_MAX_PAGE_SIZE = 200;
/** Filas por página si el cliente no pide un tamaño. */
export const GOVERNANCE_DEFAULT_PAGE_SIZE = 50;

const sinEspacios = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Paginación por cursor común a los listados de gobierno. */
export class GovernancePageQueryDto {
  /** Cursor opaco de la página anterior (`nextCursor`). */
  @ApiPropertyOptional({
    description: 'Cursor opaco de `nextCursor`',
    maxLength: 600,
  })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  cursor?: string;

  /** Filas por página. */
  @ApiPropertyOptional({
    description: 'Filas por página',
    minimum: 1,
    maximum: GOVERNANCE_MAX_PAGE_SIZE,
    default: GOVERNANCE_DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(GOVERNANCE_MAX_PAGE_SIZE)
  limit?: number;
}

/** Filtros de `GET /admin/governance/policies`. */
export class ListGovernancePoliciesQueryDto extends GovernancePageQueryDto {
  /** Tipo de política. */
  @ApiPropertyOptional({ enum: GOVERNANCE_POLICY_TYPES })
  @IsOptional()
  @IsIn(GOVERNANCE_POLICY_TYPES)
  type?: GovernancePolicyType;

  /** Busca (sin tildes ni mayúsculas) en código y nombre. */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @Transform(sinEspacios)
  @IsString()
  @MaxLength(120)
  q?: string;
}

/** Filtros de `GET /admin/governance/pii-fields`. */
export class ListGovernancePiiFieldsQueryDto extends GovernancePageQueryDto {
  /** Busca (sin tildes ni mayúsculas) en esquema, tabla y columna. */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @Transform(sinEspacios)
  @IsString()
  @MaxLength(120)
  q?: string;

  /** Esquema exacto. */
  @ApiPropertyOptional({ maxLength: 80 })
  @IsOptional()
  @Matches(/^[A-Za-z0-9_]{1,80}$/)
  schema?: string;

  /** Nivel de sensibilidad que clasificó el catálogo. */
  @ApiPropertyOptional({ enum: GOVERNANCE_PII_SENSITIVITIES })
  @IsOptional()
  @IsIn(GOVERNANCE_PII_SENSITIVITIES)
  sensitivity?: (typeof GOVERNANCE_PII_SENSITIVITIES)[number];

  /** Qué fuente respalda la fila. */
  @ApiPropertyOptional({ enum: GOVERNANCE_PII_SOURCES })
  @IsOptional()
  @IsIn(GOVERNANCE_PII_SOURCES)
  source?: (typeof GOVERNANCE_PII_SOURCES)[number];
}

/** Una política en la lista. */
export class GovernancePolicySummaryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: GOVERNANCE_POLICY_TYPES }) type!: GovernancePolicyType;
  @ApiProperty() code!: string;
  @ApiProperty({ nullable: true, type: String }) name!: string | null;
  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Código del estado',
  })
  stateCode!: string | null;
  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Texto del estado',
  })
  stateLabel!: string | null;
  @ApiProperty({
    description:
      'Atributos escalares propios del tipo (modos de escritura, plazo de retención, etc.)',
    type: 'object',
    additionalProperties: true,
  })
  attributes!: Record<string, string | number | boolean | null>;
  @ApiProperty({ nullable: true, type: String, format: 'date-time' })
  updatedAt!: string | null;
}

/** Conteo de políticas por tipo, sobre el filtro entero (no sólo la página). */
export class GovernancePolicyTypeCountDto {
  @ApiProperty({ enum: GOVERNANCE_POLICY_TYPES }) type!: GovernancePolicyType;
  @ApiProperty() total!: number;
}

export class GovernancePolicyPageDto {
  @ApiProperty({ type: [GovernancePolicySummaryDto] })
  items!: GovernancePolicySummaryDto[];
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
  @ApiProperty({ description: 'Políticas que cumplen los filtros' })
  total!: number;
  @ApiProperty({ type: [GovernancePolicyTypeCountDto] })
  byType!: GovernancePolicyTypeCountDto[];
}

/** Destinos a los que se aplica una política. */
export class GovernanceAppliesToDto {
  @ApiProperty({ enum: ['ENTITY', 'FIELD', 'TENANT_BINDING'] })
  kind!: 'ENTITY' | 'FIELD' | 'TENANT_BINDING';
  @ApiProperty() total!: number;
  @ApiProperty({
    type: [String],
    description: 'Nombres calificados; recortada a 50',
  })
  items!: string[];
  @ApiProperty() truncated!: boolean;
}

/** Un cambio de gobierno registrado sobre la política (sin las fotos antes/después). */
export class GovernancePolicyChangeDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ nullable: true, type: String }) action!: string | null;
  @ApiProperty({ format: 'uuid' }) changedByUserId!: string;
  @ApiProperty({ nullable: true, type: String }) reason!: string | null;
  @ApiProperty({ format: 'date-time' }) recordedAt!: string;
}

export class GovernancePolicyDetailDto extends GovernancePolicySummaryDto {
  @ApiProperty({
    nullable: true,
    description:
      'Parámetros de la regla de anonimización o reglas de manejo de la clasificación; null si el tipo no los tiene',
  })
  configuration!: unknown;
  @ApiProperty({ type: [GovernanceAppliesToDto] })
  appliesTo!: GovernanceAppliesToDto[];
  @ApiProperty({ type: [GovernancePolicyChangeDto] })
  history!: GovernancePolicyChangeDto[];
}

/** Datos del registro de gobierno sobre un campo. */
export class GovernancePiiRegistryDto {
  @ApiProperty({ nullable: true, type: Boolean }) isPii!: boolean | null;
  @ApiProperty({ nullable: true, type: Boolean }) isPhi!: boolean | null;
  @ApiProperty({ nullable: true, type: String }) classification!: string | null;
  @ApiProperty({ nullable: true, type: String }) maskingStrategy!:
    string | null;
  @ApiProperty({ nullable: true, type: String }) anonymizationRule!:
    string | null;
}

export class GovernancePiiFieldDto {
  @ApiProperty() schemaName!: string;
  @ApiProperty() tableName!: string;
  @ApiProperty() columnName!: string;
  @ApiProperty({
    nullable: true,
    type: String,
    description:
      'Nivel que clasificó el catálogo; null si sólo lo marca el registro de gobierno',
  })
  sensitivity!: string | null;
  @ApiProperty({
    nullable: true,
    type: String,
    description: 'Estado de revisión de la ficha de la columna en el catálogo',
  })
  reviewStatus!: string | null;
  @ApiProperty({ enum: GOVERNANCE_PII_SOURCES })
  source!: (typeof GOVERNANCE_PII_SOURCES)[number];
  @ApiProperty({ nullable: true, type: GovernancePiiRegistryDto })
  registry!: GovernancePiiRegistryDto | null;
}

export class GovernancePiiSummaryDto {
  @ApiProperty({ description: 'Campos que cumplen los filtros' })
  fields!: number;
  @ApiProperty({ description: 'Tablas distintas entre esos campos' })
  tables!: number;
  @ApiProperty({ description: 'De ellos, con ficha aprobada en el catálogo' })
  approved!: number;
  @ApiProperty({
    description:
      'De ellos, sin ninguna regla de enmascarado ni anonimización en el registro',
  })
  withoutProtection!: number;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  bySensitivity!: Record<string, number>;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  bySource!: Record<string, number>;
}

export class GovernancePiiSourcesDto {
  @ApiProperty({
    description:
      'Columnas observadas en el catálogo de datos (cualquier sensibilidad)',
  })
  catalogColumns!: number;
  @ApiProperty({
    description: 'Campos dados de alta en el registro de gobierno',
  })
  registryFields!: number;
}

export class GovernancePiiPageDto {
  @ApiProperty({ type: [GovernancePiiFieldDto] })
  items!: GovernancePiiFieldDto[];
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
  @ApiProperty({ type: GovernancePiiSummaryDto })
  summary!: GovernancePiiSummaryDto;
  @ApiProperty({ type: GovernancePiiSourcesDto })
  sources!: GovernancePiiSourcesDto;
}
