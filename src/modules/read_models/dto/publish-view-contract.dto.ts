import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

const DATA_TYPES = [
  'string',
  'text',
  'integer',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'time',
  'uuid',
  'json',
  'binary',
  'reference',
  'code',
] as const;

/** Campo del contrato de vista (allow-list de columnas). */
export class ViewFieldInputDto {
  @ApiProperty({ description: 'Código del campo', example: 'display_name' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  fieldCode!: string;

  @ApiProperty({ description: 'Columna origen del read model', example: 'display_name' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  sourceColumn!: string;

  @ApiProperty({ description: 'Etiqueta visible' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  @ApiProperty({ description: 'Tipo técnico de dato', enum: DATA_TYPES as unknown as string[] })
  @IsIn(DATA_TYPES as unknown as string[])
  dataType!: string;

  @ApiPropertyOptional({ description: 'Máscara de formato' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  formatMask?: string;

  @ApiPropertyOptional({ description: 'Campo sensible (masking heredado)' })
  @IsOptional()
  @IsBoolean()
  sensitive?: boolean;

  @ApiPropertyOptional({ description: 'Permiso requerido para verlo', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  permissionId?: string;

  @ApiProperty({ description: 'Orden del campo' })
  @IsInt()
  @Min(0)
  ordinal!: number;
}

/** Opción de orden determinista. */
export class ViewSortOptionInputDto {
  @ApiProperty({ description: 'Código de orden' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  sortCode!: string;

  @ApiProperty({ description: 'Etiqueta' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  @ApiProperty({ description: 'Expresión de orden', example: 'created_at' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  sortExpression!: string;

  @ApiProperty({ description: 'Dirección', enum: ['ASC', 'DESC'] })
  @IsIn(['ASC', 'DESC'])
  direction!: 'ASC' | 'DESC';

  @ApiProperty({ description: 'Posición de nulos', enum: ['FIRST', 'LAST'] })
  @IsIn(['FIRST', 'LAST'])
  nulls!: 'FIRST' | 'LAST';

  @ApiPropertyOptional({ description: 'Tie-breaker estable', example: 'id ASC' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  stableTieBreakerExpression?: string;

  @ApiProperty({ description: 'Orden' })
  @IsInt()
  @Min(0)
  ordinal!: number;
}

/** Acción de fila (allow-list de acciones). */
export class ViewActionInputDto {
  @ApiProperty({ description: 'Código de acción' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  actionCode!: string;

  @ApiProperty({ description: 'Etiqueta' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  @ApiProperty({ description: 'Tipo de acción', enum: ['NAVIGATE', 'MUTATION'] })
  @IsIn(['NAVIGATE', 'MUTATION'])
  actionType!: 'NAVIGATE' | 'MUTATION';

  @ApiPropertyOptional({ description: 'Plantilla de ruta' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  routeTemplate?: string;

  @ApiPropertyOptional({ description: 'Permiso requerido', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requiredPermissionId?: string;

  @ApiPropertyOptional({ description: 'Estados de fila en los que aplica' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedStates?: string[];

  @ApiPropertyOptional({ description: 'Requiere idempotencia' })
  @IsOptional()
  @IsBoolean()
  idempotencyRequired?: boolean;

  @ApiProperty({ description: 'Orden' })
  @IsInt()
  @Min(0)
  ordinal!: number;
}

/** KPI del contrato de vista. */
export class ViewKpiInputDto {
  @ApiProperty({ description: 'Código del KPI' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  kpiCode!: string;

  @ApiProperty({ description: 'Etiqueta' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  @ApiProperty({ description: 'Columna del valor' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  valueColumn!: string;

  @ApiProperty({ description: 'Columna de comparación' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  comparisonColumn!: string;

  @ApiPropertyOptional({ description: 'Máscara de formato' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  formatMask?: string;

  @ApiProperty({ description: 'Orden' })
  @IsInt()
  @Min(0)
  ordinal!: number;
}

/** Estado de UI (loading/empty/stale/error/forbidden). */
export class ViewStateInputDto {
  @ApiProperty({
    description: 'Tipo de estado',
    enum: ['LOADING', 'EMPTY', 'STALE', 'ERROR', 'FORBIDDEN'],
  })
  @IsIn(['LOADING', 'EMPTY', 'STALE', 'ERROR', 'FORBIDDEN'])
  stateType!: 'LOADING' | 'EMPTY' | 'STALE' | 'ERROR' | 'FORBIDDEN';

  @ApiProperty({ description: 'Título' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiProperty({ description: 'Mensaje' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message!: string;

  @ApiPropertyOptional({ description: 'Permite reintentar' })
  @IsOptional()
  @IsBoolean()
  retryAllowed?: boolean;
}

/** Cuerpo de `POST /portals/{portal_code}/routes/{route_code}/views` (UC-30-02). */
export class PublishViewContractDto {
  // --- Superficie de portal (upsert) ---
  @ApiProperty({ description: 'Nombre de la superficie de portal' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  portalName!: string;

  @ApiProperty({ description: 'Tipo de portal', enum: ['INTERNAL', 'PUBLIC'] })
  @IsIn(['INTERNAL', 'PUBLIC'])
  portalType!: 'INTERNAL' | 'PUBLIC';

  // --- Ruta (upsert) ---
  @ApiProperty({ description: 'Patrón de la ruta', example: '/crm/accounts' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  routePattern!: string;

  @ApiProperty({ description: 'Título de la página' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  pageTitle!: string;

  @ApiPropertyOptional({ description: 'Requiere contexto de paciente' })
  @IsOptional()
  @IsBoolean()
  requiresPatientContext?: boolean;

  @ApiPropertyOptional({ description: 'Requiere contexto de tenant' })
  @IsOptional()
  @IsBoolean()
  requiresTenantContext?: boolean;

  // --- Vista ---
  @ApiProperty({ description: 'Definición de read model ACTIVE a servir', format: 'uuid' })
  @IsUUID()
  readModelDefinitionId!: string;

  @ApiProperty({ description: 'Código de la vista', example: 'account_list' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  viewCode!: string;

  @ApiProperty({ description: 'Tipo de vista', enum: ['TABLE', 'DASHBOARD', 'DETAIL'] })
  @IsIn(['TABLE', 'DASHBOARD', 'DETAIL'])
  viewType!: 'TABLE' | 'DASHBOARD' | 'DETAIL';

  @ApiPropertyOptional({ description: 'Título de la vista' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Soporta paginación por cursor' })
  @IsOptional()
  @IsBoolean()
  supportsCursorPagination?: boolean;

  @ApiPropertyOptional({ description: 'Soporta export' })
  @IsOptional()
  @IsBoolean()
  supportsExport?: boolean;

  // --- Colecciones hijas (allow-lists) ---
  @ApiProperty({ description: 'Campos de la vista', type: [ViewFieldInputDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ViewFieldInputDto)
  fields!: ViewFieldInputDto[];

  @ApiPropertyOptional({ description: 'Opciones de orden', type: [ViewSortOptionInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViewSortOptionInputDto)
  sortOptions?: ViewSortOptionInputDto[];

  @ApiPropertyOptional({ description: 'Acciones de fila', type: [ViewActionInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViewActionInputDto)
  actions?: ViewActionInputDto[];

  @ApiPropertyOptional({ description: 'KPIs', type: [ViewKpiInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViewKpiInputDto)
  kpis?: ViewKpiInputDto[];

  @ApiPropertyOptional({ description: 'Estados de UI', type: [ViewStateInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViewStateInputDto)
  states?: ViewStateInputDto[];
}
