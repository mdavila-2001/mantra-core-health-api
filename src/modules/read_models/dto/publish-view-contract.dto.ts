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
  /**
   * Valor de field code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código del campo', example: 'display_name' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  fieldCode!: string;

  /**
   * Valor de source column mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Columna origen del read model',
    example: 'display_name',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  sourceColumn!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @ApiProperty({ description: 'Etiqueta visible' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  /**
   * Valor de data type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo técnico de dato',
    enum: DATA_TYPES as unknown as string[],
  })
  @IsIn(DATA_TYPES)
  dataType!: string;

  /**
   * Valor de format mask mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Máscara de formato' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  formatMask?: string;

  /**
   * Valor de sensitive mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Campo sensible (masking heredado)' })
  @IsOptional()
  @IsBoolean()
  sensitive?: boolean;

  /**
   * Identificador asociado a permission.
   */
  @ApiPropertyOptional({
    description: 'Permiso requerido para verlo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  permissionId?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiProperty({ description: 'Orden del campo' })
  @IsInt()
  @Min(0)
  ordinal!: number;
}

/** Opción de orden determinista. */
export class ViewSortOptionInputDto {
  /**
   * Valor de sort code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código de orden' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  sortCode!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @ApiProperty({ description: 'Etiqueta' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  /**
   * Valor de sort expression mantenido por la instancia.
   */
  @ApiProperty({ description: 'Expresión de orden', example: 'created_at' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  sortExpression!: string;

  /**
   * Valor de direction mantenido por la instancia.
   */
  @ApiProperty({ description: 'Dirección', enum: ['ASC', 'DESC'] })
  @IsIn(['ASC', 'DESC'])
  direction!: 'ASC' | 'DESC';

  /**
   * Valor de nulls mantenido por la instancia.
   */
  @ApiProperty({ description: 'Posición de nulos', enum: ['FIRST', 'LAST'] })
  @IsIn(['FIRST', 'LAST'])
  nulls!: 'FIRST' | 'LAST';

  /**
   * Valor de stable tie breaker expression mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tie-breaker estable',
    example: 'id ASC',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  stableTieBreakerExpression?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiProperty({ description: 'Orden' })
  @IsInt()
  @Min(0)
  ordinal!: number;
}

/** Acción de fila (allow-list de acciones). */
export class ViewActionInputDto {
  /**
   * Valor de action code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código de acción' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  actionCode!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @ApiProperty({ description: 'Etiqueta' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  /**
   * Valor de action type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de acción',
    enum: ['NAVIGATE', 'MUTATION'],
  })
  @IsIn(['NAVIGATE', 'MUTATION'])
  actionType!: 'NAVIGATE' | 'MUTATION';

  /**
   * Valor de route template mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Plantilla de ruta' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  routeTemplate?: string;

  /**
   * Identificador asociado a required permission.
   */
  @ApiPropertyOptional({ description: 'Permiso requerido', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requiredPermissionId?: string;

  /**
   * Valor de allowed states mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Estados de fila en los que aplica' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedStates?: string[];

  /**
   * Valor de idempotency required mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requiere idempotencia' })
  @IsOptional()
  @IsBoolean()
  idempotencyRequired?: boolean;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiProperty({ description: 'Orden' })
  @IsInt()
  @Min(0)
  ordinal!: number;
}

/** KPI del contrato de vista. */
export class ViewKpiInputDto {
  /**
   * Valor de kpi code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código del KPI' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  kpiCode!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @ApiProperty({ description: 'Etiqueta' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label!: string;

  /**
   * Valor de value column mantenido por la instancia.
   */
  @ApiProperty({ description: 'Columna del valor' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  valueColumn!: string;

  /**
   * Valor de comparison column mantenido por la instancia.
   */
  @ApiProperty({ description: 'Columna de comparación' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  comparisonColumn!: string;

  /**
   * Valor de format mask mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Máscara de formato' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  formatMask?: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiProperty({ description: 'Orden' })
  @IsInt()
  @Min(0)
  ordinal!: number;
}

/** Estado de UI (loading/empty/stale/error/forbidden). */
export class ViewStateInputDto {
  /**
   * Valor de state type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de estado',
    enum: ['LOADING', 'EMPTY', 'STALE', 'ERROR', 'FORBIDDEN'],
  })
  @IsIn(['LOADING', 'EMPTY', 'STALE', 'ERROR', 'FORBIDDEN'])
  stateType!: 'LOADING' | 'EMPTY' | 'STALE' | 'ERROR' | 'FORBIDDEN';

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ description: 'Título' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  /**
   * Valor de message mantenido por la instancia.
   */
  @ApiProperty({ description: 'Mensaje' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  message!: string;

  /**
   * Valor de retry allowed mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Permite reintentar' })
  @IsOptional()
  @IsBoolean()
  retryAllowed?: boolean;
}

/** Cuerpo de `POST /portals/{portal_code}/routes/{route_code}/views` (UC-30-02). */
export class PublishViewContractDto {
  // --- Superficie de portal (upsert) ---
  /**
   * Valor de portal name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre de la superficie de portal' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  portalName!: string;

  /**
   * Valor de portal type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo de portal', enum: ['INTERNAL', 'PUBLIC'] })
  @IsIn(['INTERNAL', 'PUBLIC'])
  portalType!: 'INTERNAL' | 'PUBLIC';

  // --- Ruta (upsert) ---
  /**
   * Valor de route pattern mantenido por la instancia.
   */
  @ApiProperty({ description: 'Patrón de la ruta', example: '/crm/accounts' })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  routePattern!: string;

  /**
   * Valor de page title mantenido por la instancia.
   */
  @ApiProperty({ description: 'Título de la página' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  pageTitle!: string;

  /**
   * Valor de requires patient context mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requiere contexto de paciente' })
  @IsOptional()
  @IsBoolean()
  requiresPatientContext?: boolean;

  /**
   * Valor de requires tenant context mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requiere contexto de tenant' })
  @IsOptional()
  @IsBoolean()
  requiresTenantContext?: boolean;

  // --- Vista ---
  /**
   * Identificador asociado a read model definition.
   */
  @ApiProperty({
    description: 'Definición de read model ACTIVE a servir',
    format: 'uuid',
  })
  @IsUUID()
  readModelDefinitionId!: string;

  /**
   * Valor de view code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código de la vista', example: 'account_list' })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  viewCode!: string;

  /**
   * Valor de view type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de vista',
    enum: ['TABLE', 'DASHBOARD', 'DETAIL'],
  })
  @IsIn(['TABLE', 'DASHBOARD', 'DETAIL'])
  viewType!: 'TABLE' | 'DASHBOARD' | 'DETAIL';

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Título de la vista' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  /**
   * Valor de supports cursor pagination mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Soporta paginación por cursor' })
  @IsOptional()
  @IsBoolean()
  supportsCursorPagination?: boolean;

  /**
   * Valor de supports export mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Soporta export' })
  @IsOptional()
  @IsBoolean()
  supportsExport?: boolean;

  // --- Colecciones hijas (allow-lists) ---
  /**
   * Valor de fields mantenido por la instancia.
   */
  @ApiProperty({ description: 'Campos de la vista', type: [ViewFieldInputDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ViewFieldInputDto)
  fields!: ViewFieldInputDto[];

  /**
   * Valor de sort options mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Opciones de orden',
    type: [ViewSortOptionInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViewSortOptionInputDto)
  sortOptions?: ViewSortOptionInputDto[];

  /**
   * Valor de actions mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Acciones de fila',
    type: [ViewActionInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViewActionInputDto)
  actions?: ViewActionInputDto[];

  /**
   * Valor de kpis mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'KPIs', type: [ViewKpiInputDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViewKpiInputDto)
  kpis?: ViewKpiInputDto[];

  /**
   * Valor de states mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Estados de UI',
    type: [ViewStateInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ViewStateInputDto)
  states?: ViewStateInputDto[];
}
