import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ValidateNested } from 'class-validator';
import {
  AGGREGATIONS,
  BACKFILLABLE_DATASETS,
  BATCH_INGEST_DATASETS,
  MAX_BATCH_ROWS,
  MAX_QUERY_POINTS,
  METRIC_DATASETS,
  ROLLUP_NAMES,
  TIMESERIES_TABLES,
  type Aggregation,
} from '../constants';

// ---------------------------------------------------------------------------
// UC-58-01 · Ingesta por lote de puntos
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para series point.
 */
export class SeriesPointDto {
  /**
   * Valor de time mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time', description: 'Instante de la medición' })
  @IsISO8601()
  time!: string;

  /**
   * Valor de values mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Resto de columnas del punto, según el dataset al que se ingiere',
  })
  @IsObject()
  values!: Record<string, unknown>;
}

/** Cuerpo de `POST /ts/series/{seriesId}/points/batch-ingest` (UC-58-01). */
export class BatchIngestPointsDto {
  /**
   * Valor de dataset mantenido por la instancia.
   */
  @ApiProperty({
    enum: BATCH_INGEST_DATASETS,
    description: 'Serie a la que se ingiere',
  })
  @IsIn(BATCH_INGEST_DATASETS)
  dataset!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a ingestion.
   */
  @ApiProperty({
    format: 'uuid',
    description:
      'Identificador del lote; el mismo lote reenviado no vuelve a entrar',
  })
  @IsUUID()
  ingestionId!: string;

  /**
   * Valor de source version mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 50, default: '1' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sourceVersion?: string;

  /**
   * Valor de points mantenido por la instancia.
   */
  @ApiProperty({ type: [SeriesPointDto], maxItems: MAX_BATCH_ROWS })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_ROWS)
  @ValidateNested({ each: true })
  @Type(() => SeriesPointDto)
  points!: SeriesPointDto[];
}

/**
 * Define el contrato validado para batch ingest response.
 */
export class BatchIngestResponseDto {
  /**
   * Identificador asociado a series.
   */
  @ApiProperty()
  seriesId!: string;

  /**
   * Identificador asociado a ingestion.
   */
  @ApiProperty({ format: 'uuid' })
  ingestionId!: string;

  /**
   * Valor de rows ingested mantenido por la instancia.
   */
  @ApiProperty({ description: 'Filas efectivamente insertadas' })
  rowsIngested!: number;

  /**
   * Valor de rows skipped mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Filas descartadas por ser duplicado del origen',
  })
  rowsSkipped!: number;
}

// ---------------------------------------------------------------------------
// UC-58-02 · Lectura de dispositivo médico
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para device reading.
 */
export class DeviceReadingDto {
  /**
   * Valor de time mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  time!: string;

  /**
   * Valor de channel code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100, description: 'Canal del dispositivo' })
  @IsString()
  @MaxLength(100)
  channelCode!: string;

  /**
   * Valor de raw value mantenido por la instancia.
   */
  @ApiProperty({ description: 'Lectura tal como la emite el dispositivo' })
  @IsObject()
  rawValue!: Record<string, unknown>;

  /**
   * Valor de numeric value mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Valor numérico extraído, si lo hay' })
  @IsOptional()
  @IsNumber()
  numericValue?: number;

  /**
   * Valor de unit code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unitCode?: string;

  /**
   * Valor de device sequence mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Secuencia monótona por canal; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  deviceSequence?: string;

  /**
   * Valor de observed at device mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Instante según el reloj del dispositivo',
  })
  @IsOptional()
  @IsISO8601()
  observedAtDevice?: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;
}

/** Cuerpo de `POST /ts/devices/{deviceId}/readings/ingest` (UC-58-02). */
export class IngestDeviceReadingsDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a ingestion.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ingestionId!: string;

  /**
   * Identificador asociado a series.
   */
  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Serie a la que pertenecen; por omisión, el dispositivo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  seriesId?: string;

  /**
   * Valor de readings mantenido por la instancia.
   */
  @ApiProperty({ type: [DeviceReadingDto], maxItems: MAX_BATCH_ROWS })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_ROWS)
  @ValidateNested({ each: true })
  @Type(() => DeviceReadingDto)
  readings!: DeviceReadingDto[];
}

// ---------------------------------------------------------------------------
// UC-58-03 · Normalizar y promover
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ts/normalize/run` (UC-58-03). */
export class NormalizeReadingDto {
  /**
   * Valor de time mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Instante de la lectura cruda',
  })
  @IsISO8601()
  time!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a series.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  seriesId!: string;

  /**
   * Valor de observation code mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 100,
    description: 'Código de observación al que mapea el canal',
  })
  @IsString()
  @MaxLength(100)
  observationCode!: string;

  /**
   * Identificador asociado a observation code concept.
   */
  @ApiProperty({
    format: 'uuid',
    description:
      'Concepto del código de observación, necesario para promover a clinical',
  })
  @IsUUID()
  observationCodeConceptId!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Valor de unit code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  unitCode!: string;

  /**
   * Identificador asociado a unit concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Unidad como concepto, para la observación clínica',
  })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Valor de promote to clinical mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description:
      'Si la medición es clínicamente significativa y debe promoverse',
  })
  @IsOptional()
  promoteToClinical?: boolean;
}

/**
 * Define el contrato validado para normalize reading response.
 */
export class NormalizeReadingResponseDto {
  /**
   * Identificador asociado a series.
   */
  @ApiProperty()
  seriesId!: string;

  /**
   * Valor de observation code mantenido por la instancia.
   */
  @ApiProperty()
  observationCode!: string;

  /**
   * Valor de validation state mantenido por la instancia.
   */
  @ApiProperty()
  validationState!: string;

  /**
   * Identificador asociado a clinically promoted observation.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Observación clínica creada al promover',
  })
  clinicallyPromotedObservationId?: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Verdadero si la lectura ya se había normalizado antes',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-58-04 · Hypertables y chunks
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ts/admin/hypertables` (UC-58-04). */
export class ConfigureHypertableDto {
  /**
   * Valor de table mantenido por la instancia.
   */
  @ApiProperty({ enum: TIMESERIES_TABLES })
  @IsIn(TIMESERIES_TABLES)
  table!: string;

  /**
   * Valor de chunk time interval mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 50,
    description: 'Anchura temporal del chunk, p. ej. `1 day` o `7 days`',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  chunkTimeInterval?: string;

  /**
   * Valor de space column mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 63,
    description: 'Columna de la dimensión de espacio, p. ej. `tenant_id`',
  })
  @IsOptional()
  @IsString()
  @MaxLength(63)
  spaceColumn?: string;

  /**
   * Valor de space partitions mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: 256, default: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(256)
  spacePartitions?: number;
}

/** Cuerpo de `PATCH /ts/admin/hypertables/{table}` (UC-58-04). */
export class UpdateHypertableDto {
  /**
   * Valor de chunk time interval mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 50,
    description: 'Nueva anchura temporal del chunk',
  })
  @IsString()
  @MaxLength(50)
  chunkTimeInterval!: string;
}

/**
 * Define el contrato validado para hypertable response.
 */
export class HypertableResponseDto {
  /**
   * Valor de table mantenido por la instancia.
   */
  @ApiProperty()
  table!: string;

  /**
   * Valor de chunk count mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Chunks existentes según el catálogo del motor',
  })
  chunkCount?: number;

  /**
   * Valor de compression enabled mantenido por la instancia.
   */
  @ApiPropertyOptional()
  compressionEnabled?: boolean;

  /**
   * Valor de space dimension added mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Verdadero si se declaró la dimensión de espacio',
  })
  spaceDimensionAdded!: boolean;
}

// ---------------------------------------------------------------------------
// UC-58-05 · Compresión
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ts/admin/compression/run` (UC-58-05). */
export class RunCompressionDto {
  /**
   * Valor de table mantenido por la instancia.
   */
  @ApiProperty({ enum: TIMESERIES_TABLES })
  @IsIn(TIMESERIES_TABLES)
  table!: string;

  /**
   * Valor de older than mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 50,
    description: 'Comprime los chunks más antiguos que este intervalo',
  })
  @IsString()
  @MaxLength(50)
  olderThan!: string;

  /**
   * Identificador asociado a batch.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Lote al que se atribuyen las métricas',
  })
  @IsUUID()
  batchId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de max chunks mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxChunks?: number;
}

/**
 * Define el contrato validado para compression response.
 */
export class CompressionResponseDto {
  /**
   * Valor de table mantenido por la instancia.
   */
  @ApiProperty()
  table!: string;

  /**
   * Valor de chunks compressed mantenido por la instancia.
   */
  @ApiProperty({ description: 'Chunks comprimidos en esta pasada' })
  chunksCompressed!: number;

  /**
   * Valor de remaining chunks mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    description: 'Chunks candidatos que quedaron para la siguiente',
  })
  remainingChunks!: string[];
}

// ---------------------------------------------------------------------------
// UC-58-06 · Retención
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ts/admin/retention/policies` (UC-58-06). */
export class ApplyRetentionDto {
  /**
   * Valor de table mantenido por la instancia.
   */
  @ApiProperty({ enum: TIMESERIES_TABLES })
  @IsIn(TIMESERIES_TABLES)
  table!: string;

  /**
   * Valor de older than mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 50,
    description: 'Descarta los chunks más antiguos que este intervalo',
  })
  @IsString()
  @MaxLength(50)
  olderThan!: string;

  /**
   * Identificador asociado a batch.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  batchId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Por qué se aplica; queda en el log de la operación',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * Define el contrato validado para retention response.
 */
export class RetentionResponseDto {
  /**
   * Valor de table mantenido por la instancia.
   */
  @ApiProperty()
  table!: string;

  /**
   * Valor de chunks dropped mantenido por la instancia.
   */
  @ApiProperty({ description: 'Chunks descartados' })
  chunksDropped!: number;

  /**
   * Valor de dropped chunks mantenido por la instancia.
   */
  @ApiProperty({ type: [String] })
  droppedChunks!: string[];
}

// ---------------------------------------------------------------------------
// UC-58-07 y 08 · Rollups
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ts/admin/rollups/{name}/refresh` (UC-58-07, 08). */
export class RefreshRollupDto {
  /**
   * Valor de from mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Inicio de la ventana a materializar',
  })
  @IsISO8601()
  from!: string;

  /**
   * Valor de to mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Fin de la ventana, exclusivo',
  })
  @IsISO8601()
  to!: string;

  /**
   * Identificador asociado a batch.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  batchId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;
}

/**
 * Define el contrato validado para refresh rollup response.
 */
export class RefreshRollupResponseDto {
  /**
   * Valor de rollup mantenido por la instancia.
   */
  @ApiProperty({ enum: ROLLUP_NAMES })
  rollup!: string;

  /**
   * Valor de buckets materialized mantenido por la instancia.
   */
  @ApiProperty({ description: 'Buckets materializados en la ventana' })
  bucketsMaterialized!: number;

  /**
   * Valor de from mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  from!: string;

  /**
   * Valor de to mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  to!: string;
}

// ---------------------------------------------------------------------------
// UC-58-09 · Consulta de rango con downsampling
// ---------------------------------------------------------------------------

/** Query de `GET /ts/series/{seriesId}/query` (UC-58-09). */
export class QuerySeriesRangeDto {
  /**
   * Valor de dataset mantenido por la instancia.
   */
  @ApiProperty({ enum: TIMESERIES_TABLES })
  @IsIn(TIMESERIES_TABLES)
  dataset!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de from mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  from!: string;

  /**
   * Valor de to mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  to!: string;

  /**
   * Valor de bucket mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 50,
    description: 'Anchura del bucket, p. ej. `5 minutes` o `1 day`',
  })
  @IsString()
  @MaxLength(50)
  bucket!: string;

  /**
   * Valor de agg mantenido por la instancia.
   */
  @ApiPropertyOptional({ enum: AGGREGATIONS, default: 'avg' })
  @IsOptional()
  @IsIn(AGGREGATIONS)
  agg?: Aggregation;

  /**
   * Valor de limit mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: MAX_QUERY_POINTS, default: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

/**
 * Define el contrato validado para series point response.
 */
export class SeriesPointResponseDto {
  /**
   * Valor de bucket mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  bucket!: string;

  /**
   * Valor de value mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Valor agregado del bucket' })
  value!: number | null;

  /**
   * Valor de samples mantenido por la instancia.
   */
  @ApiProperty({ description: 'Muestras que entraron en el bucket' })
  samples!: number;
}

/**
 * Define el contrato validado para query series range response.
 */
export class QuerySeriesRangeResponseDto {
  /**
   * Identificador asociado a series.
   */
  @ApiProperty()
  seriesId!: string;

  /**
   * Valor de source mantenido por la instancia.
   */
  @ApiProperty({
    description: 'De dónde salió el dato: `raw` o el nombre del rollup',
  })
  source!: string;

  /**
   * Valor de points mantenido por la instancia.
   */
  @ApiProperty({ type: [SeriesPointResponseDto] })
  points!: SeriesPointResponseDto[];

  /**
   * Valor de truncated mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Verdadero si la respuesta llegó al tope y hay más datos',
  })
  truncated!: boolean;
}

// ---------------------------------------------------------------------------
// UC-58-10 · Eventos de publicidad
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para ads event.
 */
export class AdsEventDto {
  /**
   * Valor de time mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  time!: string;

  /**
   * Identificador asociado a ad account.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  adAccountId!: string;

  /**
   * Identificador asociado a campaign.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  campaignId!: string;

  /**
   * Identificador asociado a ad set.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  adSetId?: string;

  /**
   * Identificador asociado a ad.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  adId?: string;

  /**
   * Valor de event name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  eventName!: string;

  /**
   * Identificador asociado a event.
   */
  @ApiProperty({
    maxLength: 200,
    description: 'Identificador del origen; es la clave de deduplicación',
  })
  @IsString()
  @MaxLength(200)
  eventId!: string;

  /**
   * Valor de value mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  value?: number;

  /**
   * Valor de currency code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  /**
   * Valor de dimensions mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  dimensions?: Record<string, unknown>;
}

/** Cuerpo de `POST /ts/ads/events/batch-ingest` (UC-58-10). */
export class BatchIngestAdsDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a ingestion.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ingestionId!: string;

  /**
   * Identificador asociado a series.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  seriesId?: string;

  /**
   * Valor de events mantenido por la instancia.
   */
  @ApiProperty({ type: [AdsEventDto], maxItems: MAX_BATCH_ROWS })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_ROWS)
  @ValidateNested({ each: true })
  @Type(() => AdsEventDto)
  events!: AdsEventDto[];
}

// ---------------------------------------------------------------------------
// UC-58-11 · Métricas de runtime
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ts/metrics/{dataset}/batch-ingest` (UC-58-11). */
export class BatchIngestMetricsDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a ingestion.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ingestionId!: string;

  /**
   * Identificador asociado a series.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  seriesId?: string;

  /**
   * Valor de points mantenido por la instancia.
   */
  @ApiProperty({ type: [SeriesPointDto], maxItems: MAX_BATCH_ROWS })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_ROWS)
  @ValidateNested({ each: true })
  @Type(() => SeriesPointDto)
  points!: SeriesPointDto[];
}

// ---------------------------------------------------------------------------
// UC-58-12 · Backfill gobernado
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ts/series/{seriesId}/backfill/governed` (UC-58-12). */
export class GovernedBackfillDto {
  /**
   * Valor de dataset mantenido por la instancia.
   */
  @ApiProperty({ enum: BACKFILLABLE_DATASETS })
  @IsIn(BACKFILLABLE_DATASETS)
  dataset!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a batch.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  batchId!: string;

  /**
   * Valor de justification mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Justificación de la corrección; sin ella no se aplica',
  })
  @IsString()
  justification!: string;

  /**
   * Valor de window from mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Inicio de la ventana corregida',
  })
  @IsISO8601()
  windowFrom!: string;

  /**
   * Valor de window to mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Fin de la ventana corregida',
  })
  @IsISO8601()
  windowTo!: string;

  /**
   * Valor de corrections mantenido por la instancia.
   */
  @ApiProperty({ type: [SeriesPointDto], maxItems: MAX_BATCH_ROWS })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_ROWS)
  @ValidateNested({ each: true })
  @Type(() => SeriesPointDto)
  corrections!: SeriesPointDto[];
}

/**
 * Define el contrato validado para governed backfill response.
 */
export class GovernedBackfillResponseDto {
  /**
   * Identificador asociado a series.
   */
  @ApiProperty()
  seriesId!: string;

  /**
   * Valor de rows backfilled mantenido por la instancia.
   */
  @ApiProperty({ description: 'Correcciones insertadas como eventos nuevos' })
  rowsBackfilled!: number;

  /**
   * Valor de source version mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Versión de origen con la que entraron las correcciones',
  })
  sourceVersion!: string;
}

// ---------------------------------------------------------------------------
// UC-58-13 · Pings de ubicación
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para location ping.
 */
export class LocationPingDto {
  /**
   * Valor de time mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  time!: string;

  /**
   * Valor de subject type mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  subjectType!: string;

  /**
   * Identificador asociado a subject.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  subjectId!: string;

  /**
   * Valor de latitude mantenido por la instancia.
   */
  @ApiProperty({ minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  /**
   * Valor de longitude mantenido por la instancia.
   */
  @ApiProperty({ minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  /**
   * Valor de altitude m mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  altitudeM?: number;

  /**
   * Valor de accuracy m mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracyM?: number;

  /**
   * Valor de speed mps mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speedMps?: number;

  /**
   * Valor de geohash mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  geohash?: string;
}

/** Cuerpo de `POST /ts/location/pings/batch-ingest` (UC-58-13). */
export class BatchIngestLocationDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a ingestion.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ingestionId!: string;

  /**
   * Identificador asociado a series.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  seriesId?: string;

  /**
   * Identificador asociado a consent.
   */
  @ApiProperty({
    description:
      'Consentimiento vigente que ampara el registro de ubicación del sujeto',
    format: 'uuid',
  })
  @IsUUID()
  consentId!: string;

  /**
   * Valor de pings mantenido por la instancia.
   */
  @ApiProperty({ type: [LocationPingDto], maxItems: MAX_BATCH_ROWS })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_ROWS)
  @ValidateNested({ each: true })
  @Type(() => LocationPingDto)
  pings!: LocationPingDto[];
}
