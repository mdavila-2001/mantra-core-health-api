import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Formato del artefacto que produce la corrida. */
export type OutputFormat = 'CSV' | 'XLSX' | 'PDF' | 'JSON';
const OUTPUT_FORMATS = ['CSV', 'XLSX', 'PDF', 'JSON'] as const;

// ---------------------------------------------------------------------------
// UC-39-01 · Fuente de datos
// ---------------------------------------------------------------------------

/** De dónde lee el reporte. */
export type SourceType = 'READ_MODEL' | 'VIEW';

/** Cuerpo de `POST /reporting/data-sources` (UC-39-01). */
export class CreateDataSourceDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ description: 'Código de la fuente, único', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ['READ_MODEL', 'VIEW'] })
  @IsIn(['READ_MODEL', 'VIEW'])
  sourceType!: SourceType;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Read model gobernado; obligatorio si el tipo es READ_MODEL',
  })
  @IsOptional()
  @IsUUID()
  readModelDefinitionId?: string;

  @ApiPropertyOptional({
    description: 'Vista de base de datos; obligatoria si el tipo es VIEW',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  viewName?: string;

  @ApiPropertyOptional({ description: 'Especificación de la fuente' })
  @IsOptional()
  @IsObject()
  specJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Reglas de seguridad por fila que la fuente impone a toda consulta',
  })
  @IsOptional()
  @IsObject()
  rowSecurityJson?: Record<string, unknown>;
}

export class DataSourceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-39-02 · Definición
// ---------------------------------------------------------------------------

/** Área a la que pertenece el reporte. */
export type ReportCategory = 'CLINICAL' | 'FINANCIAL' | 'OPERATIONAL';
const REPORT_CATEGORIES = ['CLINICAL', 'FINANCIAL', 'OPERATIONAL'] as const;

/** Agregación que aplica la columna. */
export type Aggregation = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
const AGGREGATIONS = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'] as const;

export class ReportParameterDto {
  @ApiProperty({ description: 'Código del parámetro', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Tipo técnico del valor', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  dataType!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Valor por defecto' })
  @IsOptional()
  @IsObject()
  defaultValueJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Conjunto de valores admitidos',
  })
  @IsOptional()
  @IsUUID()
  valueSetId?: string;
}

export class ReportColumnDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Etiqueta que se muestra', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  label!: string;

  @ApiPropertyOptional({ description: 'Expresión que calcula la columna' })
  @IsOptional()
  @IsString()
  expression?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  dataType?: string;

  @ApiPropertyOptional({ enum: AGGREGATIONS })
  @IsOptional()
  @IsIn(AGGREGATIONS)
  aggregation?: Aggregation;

  @ApiPropertyOptional({ description: 'Máscara de formato', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  formatMask?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

/** Cuerpo de `POST /reporting/definitions` (UC-39-02). */
export class CreateDefinitionDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ description: 'Código del reporte, único', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: REPORT_CATEGORIES })
  @IsOptional()
  @IsIn(REPORT_CATEGORIES)
  category?: ReportCategory;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  dataSourceId!: string;

  @ApiPropertyOptional({ description: 'Consulta que ejecuta el reporte' })
  @IsOptional()
  @IsObject()
  querySpecJson?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: OUTPUT_FORMATS, default: 'CSV' })
  @IsOptional()
  @IsIn(OUTPUT_FORMATS)
  defaultOutputFormat?: OutputFormat;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Permiso exigido para ejecutarlo; obligatorio si no es público',
  })
  @IsOptional()
  @IsUUID()
  requiredPermissionId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ type: [ReportParameterDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportParameterDto)
  parameters?: ReportParameterDto[];

  @ApiProperty({
    type: [ReportColumnDto],
    description: 'Columnas del reporte, al menos una',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReportColumnDto)
  columns!: ReportColumnDto[];
}

export class DefinitionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'La definición nace en borrador',
  })
  stateConceptId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  parameterIds!: string[];

  @ApiProperty({ type: [String], format: 'uuid' })
  columnIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-39-03 · Versión
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /reporting/definitions/{id}/versions/publish` (UC-39-03). */
export class PublishReportVersionDto {
  @ApiPropertyOptional({
    description: 'Qué cambió respecto de la versión anterior',
  })
  @IsOptional()
  @IsString()
  changeNote?: string;
}

export class ReportVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  version!: number;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda la definición',
  })
  definitionStateConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-39-04 · Ejecución
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /reporting/definitions/{id}/executions` (UC-39-04). */
export class CreateExecutionDto {
  @ApiPropertyOptional({
    description:
      'Valores de los parámetros, con la forma { "<código>": <valor> }',
  })
  @IsOptional()
  @IsObject()
  parametersJson?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: OUTPUT_FORMATS })
  @IsOptional()
  @IsIn(OUTPUT_FORMATS)
  outputFormat?: OutputFormat;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

export class ExecutionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', description: 'Versión con la que se ejecuta' })
  reportVersionId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  outputFormatConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-39-05 · Snapshot
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /reporting/executions/{id}/snapshot` (UC-39-05). */
export class MaterializeSnapshotDto {
  @ApiProperty({
    description: 'Ubicación del artefacto en el almacén de objetos',
  })
  @IsString()
  storageUri!: string;

  @ApiPropertyOptional({
    description: 'Hash del contenido, para deduplicar artefactos',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  contentHash?: string;

  @ApiPropertyOptional({ description: 'Filas del resultado' })
  @IsOptional()
  @IsInt()
  @Min(0)
  rowCount?: number;

  @ApiPropertyOptional({ description: 'Tamaño del artefacto en bytes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Archivo en `common.files`',
  })
  @IsOptional()
  @IsUUID()
  outputFileId?: string;

  @ApiPropertyOptional({ description: 'Días de retención del artefacto' })
  @IsOptional()
  @IsInt()
  @Min(1)
  retentionDays?: number;
}

export class SnapshotResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  reportExecutionId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda la ejecución',
  })
  executionStatusConceptId!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  expiresAt?: string;

  @ApiProperty({
    description: 'true si ya existía un artefacto con el mismo contenido',
  })
  contentDeduplicated!: boolean;
}

// ---------------------------------------------------------------------------
// UC-39-06 · Programación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /reporting/definitions/{id}/schedules` (UC-39-06). */
export class CreateScheduleDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'Expresión cron de cinco campos',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  cronExpression!: string;

  @ApiPropertyOptional({
    description: 'Zona horaria IANA',
    default: 'UTC',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  @ApiPropertyOptional({
    description: 'Parámetros fijos de cada corrida programada',
  })
  @IsOptional()
  @IsObject()
  parametersJson?: Record<string, unknown>;

  @ApiProperty({ enum: OUTPUT_FORMATS })
  @IsIn(OUTPUT_FORMATS)
  outputFormat!: OutputFormat;

  @ApiProperty({
    format: 'date-time',
    description:
      'Primera corrida. El cliente resuelve el cron; aquí se guarda el instante.',
  })
  @IsISO8601()
  firstRunAt!: string;
}

export class ScheduleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'date-time' })
  nextRunAt!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-39-07 · Tick del planificador
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /reporting/scheduler/tick` (UC-39-07). */
export class SchedulerTickDto {
  @ApiPropertyOptional({
    description: 'Programaciones a procesar por tick',
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  batchSize?: number;

  @ApiPropertyOptional({
    description:
      'Minutos hasta la siguiente corrida. El cálculo del cron vive fuera.',
    default: 1440,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  intervalMinutes?: number;
}

export class SchedulerTickResponseDto {
  @ApiProperty({ description: 'Programaciones vencidas tomadas en este tick' })
  scanned!: number;

  @ApiProperty({ description: 'Ejecuciones encoladas' })
  queued!: number;

  @ApiProperty({
    description: 'Programaciones omitidas por no tener versión publicada',
  })
  skipped!: number;

  @ApiProperty({ type: [String], format: 'uuid' })
  executionIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-39-08 · Distribución
// ---------------------------------------------------------------------------

export class DistributionRecipientDto {
  @ApiProperty({ enum: ['USER', 'ADDRESS'] })
  @IsIn(['USER', 'ADDRESS'])
  recipientType!: 'USER' | 'ADDRESS';

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Obligatorio si el tipo es USER',
  })
  @IsOptional()
  @IsUUID()
  recipientUserId?: string;

  @ApiPropertyOptional({
    description: 'Obligatorio si el tipo es ADDRESS',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  recipientAddress?: string;

  @ApiProperty({ format: 'uuid', description: 'Canal por el que se entrega' })
  @IsUUID()
  channelId!: string;
}

/** Cuerpo de `POST /reporting/executions/{id}/distributions` (UC-39-08). */
export class DispatchDistributionDto {
  @ApiPropertyOptional({
    type: [DistributionRecipientDto],
    description:
      'Destinatarios extra además de los suscritos a la programación',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DistributionRecipientDto)
  recipients?: DistributionRecipientDto[];
}

export class DispatchResponseDto {
  @ApiProperty({ format: 'uuid' })
  reportExecutionId!: string;

  @ApiProperty({ description: 'Distribuciones creadas en esta llamada' })
  created!: number;

  @ApiProperty({ description: 'Destinatarios omitidos por tener ya su fila' })
  skipped!: number;

  @ApiProperty({ type: [String], format: 'uuid' })
  distributionIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-39-09 · Suscripción
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /reporting/schedules/{id}/subscriptions` (UC-39-09). */
export class SubscribeDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Canal por el que se quiere recibir',
  })
  @IsUUID()
  channelId!: string;
}

export class SubscriptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  reportScheduleId!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({
    description: 'true si la suscripción ya existía y se reactivó',
  })
  reactivated!: boolean;
}

// ---------------------------------------------------------------------------
// UC-39-10 · Tablero
// ---------------------------------------------------------------------------

/** Naturaleza del widget. */
export type WidgetType = 'CHART' | 'TABLE' | 'METRIC';
const WIDGET_TYPES = ['CHART', 'TABLE', 'METRIC'] as const;

/** Forma del gráfico. */
export type Visualization = 'BAR' | 'LINE' | 'PIE';
const VISUALIZATIONS = ['BAR', 'LINE', 'PIE'] as const;

export class DashboardWidgetDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Reporte del que se alimenta el widget',
  })
  @IsOptional()
  @IsUUID()
  reportDefinitionId?: string;

  @ApiProperty({ enum: WIDGET_TYPES })
  @IsIn(WIDGET_TYPES)
  widgetType!: WidgetType;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({
    enum: VISUALIZATIONS,
    description: 'Obligatoria si el widget es CHART',
  })
  @IsOptional()
  @IsIn(VISUALIZATIONS)
  visualization?: Visualization;

  @ApiPropertyOptional({ description: 'Configuración del widget' })
  @IsOptional()
  @IsObject()
  configJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Posición en la retícula del tablero' })
  @IsOptional()
  @IsObject()
  positionJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /reporting/dashboards` (UC-39-10). */
export class CreateDashboardDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiProperty({ description: 'Código del tablero, único', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Retícula del tablero' })
  @IsOptional()
  @IsObject()
  layoutJson?: Record<string, unknown>;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requiredPermissionId?: string;

  @ApiProperty({
    type: [DashboardWidgetDto],
    description: 'Widgets del tablero, al menos uno',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DashboardWidgetDto)
  widgets!: DashboardWidgetDto[];
}

export class DashboardResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  widgetIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-39-11 · Reintento
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /reporting/executions/{id}/retry` (UC-39-11). */
export class RetryExecutionDto {
  @ApiPropertyOptional({
    default: false,
    description:
      'Reencolar también las distribuciones que dependían de la corrida',
  })
  @IsOptional()
  @IsBoolean()
  requeueDistributions?: boolean;
}

export class RetryExecutionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'Distribuciones devueltas a pendiente' })
  distributionsRequeued!: number;
}

// ---------------------------------------------------------------------------
// UC-39-12 · Deprecación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /reporting/definitions/{id}/deprecate` (UC-39-12). */
export class DeprecateDefinitionDto {
  @ApiProperty({ description: 'Por qué se deja de usar el reporte' })
  @IsString()
  reason!: string;
}

export class DeprecateDefinitionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  @ApiProperty({
    description: 'Programaciones suspendidas junto con la definición',
  })
  schedulesSuspended!: number;
}
