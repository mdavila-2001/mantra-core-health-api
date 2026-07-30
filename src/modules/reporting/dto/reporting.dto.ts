import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código de la fuente, único', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de source type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['READ_MODEL', 'VIEW'] })
  @IsIn(['READ_MODEL', 'VIEW'])
  sourceType!: SourceType;

  /**
   * Identificador asociado a read model definition.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Read model gobernado; obligatorio si el tipo es READ_MODEL',
  })
  @IsOptional()
  @IsUUID()
  readModelDefinitionId?: string;

  /**
   * Valor de view name mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Vista de base de datos; obligatoria si el tipo es VIEW',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  viewName?: string;

  /**
   * Valor de spec json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Especificación de la fuente' })
  @IsOptional()
  @IsObject()
  specJson?: Record<string, unknown>;

  /**
   * Valor de row security json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Reglas de seguridad por fila que la fuente impone a toda consulta',
  })
  @IsOptional()
  @IsObject()
  rowSecurityJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para data source response.
 */
export class DataSourceResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a state concept.
   */
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

/**
 * Define el contrato validado para report parameter.
 */
export class ReportParameterDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código del parámetro', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de data type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo técnico del valor', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  dataType!: string;

  /**
   * Valor de required mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  /**
   * Valor de default value json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Valor por defecto' })
  @IsOptional()
  @IsObject()
  defaultValueJson?: Record<string, unknown>;

  /**
   * Identificador asociado a value set.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Conjunto de valores admitidos',
  })
  @IsOptional()
  @IsUUID()
  valueSetId?: string;
}

/**
 * Define el contrato validado para report column.
 */
export class ReportColumnDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @ApiProperty({ description: 'Etiqueta que se muestra', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  label!: string;

  /**
   * Valor de expression mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Expresión que calcula la columna' })
  @IsOptional()
  @IsString()
  expression?: string;

  /**
   * Valor de data type mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  dataType?: string;

  /**
   * Valor de aggregation mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: AGGREGATIONS })
  @IsOptional()
  @IsIn(AGGREGATIONS)
  aggregation?: Aggregation;

  /**
   * Valor de format mask mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Máscara de formato', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  formatMask?: string;

  /**
   * Valor de is visible mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}

/** Cuerpo de `POST /reporting/definitions` (UC-39-02). */
export class CreateDefinitionDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código del reporte, único', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Valor de category mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: REPORT_CATEGORIES })
  @IsOptional()
  @IsIn(REPORT_CATEGORIES)
  category?: ReportCategory;

  /**
   * Identificador asociado a data source.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  dataSourceId!: string;

  /**
   * Valor de query spec json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Consulta que ejecuta el reporte' })
  @IsOptional()
  @IsObject()
  querySpecJson?: Record<string, unknown>;

  /**
   * Valor de default output format mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: OUTPUT_FORMATS, default: 'CSV' })
  @IsOptional()
  @IsIn(OUTPUT_FORMATS)
  defaultOutputFormat?: OutputFormat;

  /**
   * Identificador asociado a required permission.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Permiso exigido para ejecutarlo; obligatorio si no es público',
  })
  @IsOptional()
  @IsUUID()
  requiredPermissionId?: string;

  /**
   * Valor de is public mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  /**
   * Valor de parameters mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [ReportParameterDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportParameterDto)
  parameters?: ReportParameterDto[];

  /**
   * Valor de columns mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para definition response.
 */
export class DefinitionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'La definición nace en borrador',
  })
  stateConceptId!: string;

  /**
   * Valor de parameter ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  parameterIds!: string[];

  /**
   * Valor de column ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  columnIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-39-03 · Versión
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /reporting/definitions/{id}/versions/publish` (UC-39-03). */
export class PublishReportVersionDto {
  /**
   * Valor de change note mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Qué cambió respecto de la versión anterior',
  })
  @IsOptional()
  @IsString()
  changeNote?: string;
}

/**
 * Define el contrato validado para report version response.
 */
export class ReportVersionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiProperty()
  version!: number;

  /**
   * Identificador asociado a definition state concept.
   */
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
  /**
   * Valor de parameters json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Valores de los parámetros, con la forma { "<código>": <valor> }',
  })
  @IsOptional()
  @IsObject()
  parametersJson?: Record<string, unknown>;

  /**
   * Valor de output format mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: OUTPUT_FORMATS })
  @IsOptional()
  @IsIn(OUTPUT_FORMATS)
  outputFormat?: OutputFormat;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}

/**
 * Define el contrato validado para execution response.
 */
export class ExecutionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a report version.
   */
  @ApiProperty({ format: 'uuid', description: 'Versión con la que se ejecuta' })
  reportVersionId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a output format concept.
   */
  @ApiProperty({ format: 'uuid' })
  outputFormatConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-39-05 · Snapshot
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /reporting/executions/{id}/snapshot` (UC-39-05). */
export class MaterializeSnapshotDto {
  /**
   * Valor de storage uri mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Ubicación del artefacto en el almacén de objetos',
  })
  @IsString()
  storageUri!: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Hash del contenido, para deduplicar artefactos',
  })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  contentHash?: string;

  /**
   * Valor de row count mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Filas del resultado' })
  @IsOptional()
  @IsInt()
  @Min(0)
  rowCount?: number;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tamaño del artefacto en bytes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;

  /**
   * Identificador asociado a output file.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Archivo en `common.files`',
  })
  @IsOptional()
  @IsUUID()
  outputFileId?: string;

  /**
   * Valor de retention days mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Días de retención del artefacto' })
  @IsOptional()
  @IsInt()
  @Min(1)
  retentionDays?: number;
}

/**
 * Define el contrato validado para snapshot response.
 */
export class SnapshotResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a report execution.
   */
  @ApiProperty({ format: 'uuid' })
  reportExecutionId!: string;

  /**
   * Identificador asociado a execution status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Estado en el que queda la ejecución',
  })
  executionStatusConceptId!: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  expiresAt?: string;

  /**
   * Valor de content deduplicated mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si ya existía un artefacto con el mismo contenido',
  })
  contentDeduplicated!: boolean;
}

// ---------------------------------------------------------------------------
// UC-39-06 · Programación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /reporting/definitions/{id}/schedules` (UC-39-06). */
@ApiSchema({ name: 'ReportingCreateScheduleDto' })
export class CreateScheduleDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de cron expression mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Expresión cron de cinco campos',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  cronExpression!: string;

  /**
   * Valor de time zone mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Zona horaria IANA',
    default: 'UTC',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;

  /**
   * Valor de parameters json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Parámetros fijos de cada corrida programada',
  })
  @IsOptional()
  @IsObject()
  parametersJson?: Record<string, unknown>;

  /**
   * Valor de output format mantenido por la instancia.
   */
  @ApiProperty({ enum: OUTPUT_FORMATS })
  @IsIn(OUTPUT_FORMATS)
  outputFormat!: OutputFormat;

  /**
   * Valor de first run at mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description:
      'Primera corrida. El cliente resuelve el cron; aquí se guarda el instante.',
  })
  @IsISO8601()
  firstRunAt!: string;
}

/**
 * Define el contrato validado para schedule response.
 */
export class ScheduleResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty()
  name!: string;

  /**
   * Valor de next run at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  nextRunAt!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-39-07 · Tick del planificador
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /reporting/scheduler/tick` (UC-39-07). */
export class SchedulerTickDto {
  /**
   * Valor de batch size mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Programaciones a procesar por tick',
    default: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  batchSize?: number;

  /**
   * Valor de interval minutes mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para scheduler tick response.
 */
export class SchedulerTickResponseDto {
  /**
   * Valor de scanned mantenido por la instancia.
   */
  @ApiProperty({ description: 'Programaciones vencidas tomadas en este tick' })
  scanned!: number;

  /**
   * Valor de queued mantenido por la instancia.
   */
  @ApiProperty({ description: 'Ejecuciones encoladas' })
  queued!: number;

  /**
   * Valor de skipped mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Programaciones omitidas por no tener versión publicada',
  })
  skipped!: number;

  /**
   * Valor de execution ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  executionIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-39-08 · Distribución
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para distribution recipient.
 */
export class DistributionRecipientDto {
  /**
   * Valor de recipient type mantenido por la instancia.
   */
  @ApiProperty({ enum: ['USER', 'ADDRESS'] })
  @IsIn(['USER', 'ADDRESS'])
  recipientType!: 'USER' | 'ADDRESS';

  /**
   * Identificador asociado a recipient user.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Obligatorio si el tipo es USER',
  })
  @IsOptional()
  @IsUUID()
  recipientUserId?: string;

  /**
   * Valor de recipient address mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Obligatorio si el tipo es ADDRESS',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  recipientAddress?: string;

  /**
   * Identificador asociado a channel.
   */
  @ApiProperty({ format: 'uuid', description: 'Canal por el que se entrega' })
  @IsUUID()
  channelId!: string;
}

/** Cuerpo de `POST /reporting/executions/{id}/distributions` (UC-39-08). */
export class DispatchDistributionDto {
  /**
   * Valor de recipients mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para dispatch response.
 */
export class DispatchResponseDto {
  /**
   * Identificador asociado a report execution.
   */
  @ApiProperty({ format: 'uuid' })
  reportExecutionId!: string;

  /**
   * Valor de created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Distribuciones creadas en esta llamada' })
  created!: number;

  /**
   * Valor de skipped mantenido por la instancia.
   */
  @ApiProperty({ description: 'Destinatarios omitidos por tener ya su fila' })
  skipped!: number;

  /**
   * Valor de distribution ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  distributionIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-39-09 · Suscripción
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /reporting/schedules/{id}/subscriptions` (UC-39-09). */
export class SubscribeDto {
  /**
   * Identificador asociado a channel.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Canal por el que se quiere recibir',
  })
  @IsUUID()
  channelId!: string;
}

/**
 * Define el contrato validado para subscription response.
 */
export class SubscriptionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a report schedule.
   */
  @ApiProperty({ format: 'uuid' })
  reportScheduleId!: string;

  /**
   * Valor de is active mantenido por la instancia.
   */
  @ApiProperty()
  isActive!: boolean;

  /**
   * Valor de reactivated mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para dashboard widget.
 */
export class DashboardWidgetDto {
  /**
   * Identificador asociado a report definition.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Reporte del que se alimenta el widget',
  })
  @IsOptional()
  @IsUUID()
  reportDefinitionId?: string;

  /**
   * Valor de widget type mantenido por la instancia.
   */
  @ApiProperty({ enum: WIDGET_TYPES })
  @IsIn(WIDGET_TYPES)
  widgetType!: WidgetType;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  title!: string;

  /**
   * Valor de visualization mantenido por la instancia.
   */
  @ApiPropertyOptional({
    enum: VISUALIZATIONS,
    description: 'Obligatoria si el widget es CHART',
  })
  @IsOptional()
  @IsIn(VISUALIZATIONS)
  visualization?: Visualization;

  /**
   * Valor de config json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Configuración del widget' })
  @IsOptional()
  @IsObject()
  configJson?: Record<string, unknown>;

  /**
   * Valor de position json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Posición en la retícula del tablero' })
  @IsOptional()
  @IsObject()
  positionJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /reporting/dashboards` (UC-39-10). */
export class CreateDashboardDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código del tablero, único', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Valor de layout json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Retícula del tablero' })
  @IsOptional()
  @IsObject()
  layoutJson?: Record<string, unknown>;

  /**
   * Identificador asociado a required permission.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requiredPermissionId?: string;

  /**
   * Valor de widgets mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para dashboard response.
 */
export class DashboardResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  /**
   * Valor de widget ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  widgetIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-39-11 · Reintento
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /reporting/executions/{id}/retry` (UC-39-11). */
export class RetryExecutionDto {
  /**
   * Valor de requeue distributions mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description:
      'Reencolar también las distribuciones que dependían de la corrida',
  })
  @IsOptional()
  @IsBoolean()
  requeueDistributions?: boolean;
}

/**
 * Define el contrato validado para retry execution response.
 */
export class RetryExecutionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de distributions requeued mantenido por la instancia.
   */
  @ApiProperty({ description: 'Distribuciones devueltas a pendiente' })
  distributionsRequeued!: number;
}

// ---------------------------------------------------------------------------
// UC-39-12 · Deprecación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /reporting/definitions/{id}/deprecate` (UC-39-12). */
export class DeprecateDefinitionDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Por qué se deja de usar el reporte' })
  @IsString()
  reason!: string;
}

/**
 * Define el contrato validado para deprecate definition response.
 */
export class DeprecateDefinitionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a state concept.
   */
  @ApiProperty({ format: 'uuid' })
  stateConceptId!: string;

  /**
   * Valor de schedules suspended mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Programaciones suspendidas junto con la definición',
  })
  schedulesSuspended!: number;
}
