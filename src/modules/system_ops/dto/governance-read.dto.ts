import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Tope y valor por omisión de los listados de lectura de gobierno. */
export const GOV_MAX_PAGE_SIZE = 200;
export const GOV_DEFAULT_PAGE_SIZE = 50;
/** Sin rango, la bitácora de cambios mira esta ventana: no tiene índice por fecha. */
export const GOV_CHANGE_LOG_WINDOW_DAYS = 30;

export const POLICY_TYPES = [
  'WRITE',
  'RETENTION',
  'ANONYMIZATION',
  'RESIDENCY',
] as const;
export type PolicyType = (typeof POLICY_TYPES)[number];

export const POLICY_SORTS = ['code', 'updatedAt'] as const;
export type PolicySort = (typeof POLICY_SORTS)[number];

export const SORT_ORDERS = ['asc', 'desc'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

const recortar = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Un código de concepto o de negocio: letras, dígitos y `_ . : -`. */
const CODIGO = /^[A-Za-z0-9_.:-]{1,100}$/;
/** Un schema o tabla de PostgreSQL. */
const IDENTIFICADOR = /^[A-Za-z0-9_]{1,63}$/;

/** Paginación por cursor opaco común a las lecturas de gobierno. */
export class GovPageQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    maximum: GOV_MAX_PAGE_SIZE,
    default: GOV_DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(GOV_MAX_PAGE_SIZE)
  limit?: number;

  @ApiPropertyOptional({
    maxLength: 600,
    description: '`nextCursor` de la página anterior',
  })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  cursor?: string;
}

export class PolicyListQueryDto extends GovPageQueryDto {
  @ApiPropertyOptional({ enum: POLICY_TYPES })
  @IsOptional()
  @IsIn(POLICY_TYPES)
  type?: PolicyType;

  @ApiPropertyOptional({
    description: 'Código del estado (concepto), p. ej. `ACTIVE`',
  })
  @IsOptional()
  @Matches(CODIGO)
  state?: string;

  @ApiPropertyOptional({
    maxLength: 120,
    description: 'Busca en código y nombre, sin mayúsculas',
  })
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ enum: POLICY_SORTS, default: 'code' })
  @IsOptional()
  @IsIn(POLICY_SORTS)
  sort?: PolicySort;

  @ApiPropertyOptional({ enum: SORT_ORDERS, default: 'asc' })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  order?: SortOrder;
}

export class PolicyParamDto {
  @ApiProperty({ enum: POLICY_TYPES })
  @IsIn(POLICY_TYPES)
  policyType!: PolicyType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;
}

export class ChangeLogQueryDto extends GovPageQueryDto {
  @ApiPropertyOptional({
    maxLength: 100,
    description:
      'Tipo de objeto cambiado (`entity_registry`, `write_policies`…)',
  })
  @IsOptional()
  @Transform(recortar)
  @Matches(IDENTIFICADOR)
  targetType?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Objeto cambiado' })
  @IsOptional()
  @IsUUID()
  targetId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Actor del cambio' })
  @IsOptional()
  @IsUUID()
  changedBy?: string;

  @ApiPropertyOptional({
    description: 'Desde (ISO 8601, incluido). Sin rango, los últimos 30 días',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Hasta (ISO 8601, excluido)' })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

export class EntityRegistryQueryDto extends GovPageQueryDto {
  @ApiPropertyOptional({ description: 'Schema de PostgreSQL' })
  @IsOptional()
  @Matches(IDENTIFICADOR)
  schema?: string;

  @ApiPropertyOptional({
    maxLength: 120,
    description: 'Busca en `schema.tabla`, sin mayúsculas',
  })
  @IsOptional()
  @Transform(recortar)
  @IsString()
  @MaxLength(120)
  q?: string;

  @ApiPropertyOptional({ description: 'Código del dominio de datos' })
  @IsOptional()
  @Matches(CODIGO)
  domain?: string;

  @ApiPropertyOptional({ description: 'Código de la clasificación' })
  @IsOptional()
  @Matches(CODIGO)
  classification?: string;

  @ApiPropertyOptional({
    description: 'Sólo las entidades marcadas (o no) como PII',
  })
  @IsOptional()
  // `enableImplicitConversion` convertiría "false" en `true`: se lee el valor crudo.
  @Transform(({ obj }: { obj: { containsPii?: unknown } }) =>
    obj.containsPii === 'true' || obj.containsPii === true
      ? true
      : obj.containsPii === 'false' || obj.containsPii === false
        ? false
        : obj.containsPii,
  )
  @IsBoolean()
  containsPii?: boolean;

  @ApiPropertyOptional({
    description: 'Sólo las entidades marcadas (o no) como PHI',
  })
  @IsOptional()
  @Transform(({ obj }: { obj: { containsPhi?: unknown } }) =>
    obj.containsPhi === 'true' || obj.containsPhi === true
      ? true
      : obj.containsPhi === 'false' || obj.containsPhi === false
        ? false
        : obj.containsPhi,
  )
  @IsBoolean()
  containsPhi?: boolean;
}

export class EntityIdParamDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;
}

// ---- respuestas --------------------------------------------------------------------------

export class PolicySummaryDto {
  @ApiProperty({ enum: POLICY_TYPES }) policyType!: string;
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() code!: string;
  @ApiPropertyOptional({ nullable: true }) name!: string | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Código del concepto de estado',
  })
  state!: string | null;
  @ApiProperty() version!: number;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt!: string;
}

export class PolicyPageDto {
  @ApiProperty({ type: [PolicySummaryDto] }) items!: PolicySummaryDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
  @ApiProperty({ enum: POLICY_SORTS }) sort!: string;
  @ApiProperty({ enum: SORT_ORDERS }) order!: string;
}

export class AppliedToItemDto {
  @ApiProperty() schemaName!: string;
  @ApiProperty() tableName!: string;
  @ApiPropertyOptional({ nullable: true }) columnName!: string | null;
}

export class AppliedToDto {
  @ApiProperty() total!: number;
  @ApiProperty({ type: [AppliedToItemDto] }) items!: AppliedToItemDto[];
  @ApiProperty() truncated!: boolean;
}

export class PolicyDetailDto extends PolicySummaryDto {
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) createdByUserId!:
    string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uuid' }) updatedByUserId!:
    string | null;
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'Ajustes propios del tipo de política (modos de escritura, plazos, técnica, jurisdicción…). Códigos de concepto, nunca ids; de una regla de anonimización sólo los nombres de sus parámetros',
  })
  settings!: Record<string, unknown>;
  @ApiProperty({ type: AppliedToDto }) appliedTo!: AppliedToDto;
}

export class ChangeLogEntryDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() targetType!: string;
  @ApiProperty({ format: 'uuid' }) targetId!: string;
  @ApiProperty({ description: 'Código del concepto de acción' })
  action!: string;
  @ApiProperty({ format: 'uuid' }) changedByUserId!: string;
  @ApiPropertyOptional({ nullable: true }) reason!: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) recordedAt!: string;
}

export class ChangeLogPageDto {
  @ApiProperty({ type: [ChangeLogEntryDto] }) items!: ChangeLogEntryDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
  @ApiProperty({ example: 'recorded_at desc, id desc' }) order!: string;
}

export class RegistryRefDto {
  @ApiProperty() code!: string;
  @ApiPropertyOptional({ nullable: true }) name!: string | null;
}

export class EntityRegistryItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() schemaName!: string;
  @ApiProperty() tableName!: string;
  @ApiPropertyOptional({ nullable: true, type: RegistryRefDto })
  domain!: RegistryRefDto | null;
  @ApiPropertyOptional({ nullable: true, type: RegistryRefDto })
  classification!: RegistryRefDto | null;
  @ApiPropertyOptional({ nullable: true }) ownerTeam!: string | null;
  @ApiPropertyOptional({ nullable: true, type: Boolean }) containsPii!:
    boolean | null;
  @ApiPropertyOptional({ nullable: true, type: Boolean }) containsPhi!:
    boolean | null;
  @ApiProperty() isAppendOnly!: boolean;
  @ApiProperty() isSoftDelete!: boolean;
  @ApiProperty() hasHistory!: boolean;
  @ApiPropertyOptional({ nullable: true }) retentionPolicyCode!: string | null;
  @ApiPropertyOptional({ nullable: true }) writePolicyCode!: string | null;
  @ApiProperty() fieldCount!: number;
  @ApiProperty() personalFieldCount!: number;
}

export class GovNotMeasuredDto {
  @ApiProperty() field!: string;
  @ApiProperty() reason!: string;
}

export class EntityRegistryPageDto {
  @ApiProperty({ type: [EntityRegistryItemDto] })
  items!: EntityRegistryItemDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
  @ApiProperty({ example: 'schema_name, table_name, id' }) order!: string;
  @ApiProperty({
    type: [GovNotMeasuredDto],
    description: 'Lo que se pidió y no tiene fuente (p. ej. registro vacío)',
  })
  notMeasured!: GovNotMeasuredDto[];
}

export class FieldRegistryItemDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() columnName!: string;
  @ApiPropertyOptional({ nullable: true }) classification!: string | null;
  @ApiPropertyOptional({ nullable: true, type: Boolean }) isPii!:
    boolean | null;
  @ApiPropertyOptional({ nullable: true, type: Boolean }) isPhi!:
    boolean | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'Código del concepto de enmascaramiento',
  })
  maskingStrategy!: string | null;
  @ApiPropertyOptional({ nullable: true }) anonymizationRuleCode!:
    string | null;
}

export class FieldRegistryPageDto {
  @ApiProperty({ type: [FieldRegistryItemDto] }) items!: FieldRegistryItemDto[];
  @ApiPropertyOptional({ nullable: true }) nextCursor!: string | null;
  @ApiProperty() limit!: number;
  @ApiProperty({ example: 'column_name, id' }) order!: string;
}
