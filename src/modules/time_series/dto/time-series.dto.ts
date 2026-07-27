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

export class SeriesPointDto {
  @ApiProperty({ format: 'date-time', description: 'Instante de la medición' })
  @IsISO8601()
  time!: string;

  @ApiProperty({
    description:
      'Resto de columnas del punto, según el dataset al que se ingiere',
  })
  @IsObject()
  values!: Record<string, unknown>;
}

/** Cuerpo de `POST /ts/series/{seriesId}/points/batch-ingest` (UC-58-01). */
export class BatchIngestPointsDto {
  @ApiProperty({
    enum: BATCH_INGEST_DATASETS,
    description: 'Serie a la que se ingiere',
  })
  @IsIn(BATCH_INGEST_DATASETS)
  dataset!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    format: 'uuid',
    description:
      'Identificador del lote; el mismo lote reenviado no vuelve a entrar',
  })
  @IsUUID()
  ingestionId!: string;

  @ApiPropertyOptional({ maxLength: 50, default: '1' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  sourceVersion?: string;

  @ApiProperty({ type: [SeriesPointDto], maxItems: MAX_BATCH_ROWS })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_ROWS)
  @ValidateNested({ each: true })
  @Type(() => SeriesPointDto)
  points!: SeriesPointDto[];
}

export class BatchIngestResponseDto {
  @ApiProperty()
  seriesId!: string;

  @ApiProperty({ format: 'uuid' })
  ingestionId!: string;

  @ApiProperty({ description: 'Filas efectivamente insertadas' })
  rowsIngested!: number;

  @ApiProperty({
    description: 'Filas descartadas por ser duplicado del origen',
  })
  rowsSkipped!: number;
}

// ---------------------------------------------------------------------------
// UC-58-02 · Lectura de dispositivo médico
// ---------------------------------------------------------------------------

export class DeviceReadingDto {
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  time!: string;

  @ApiProperty({ maxLength: 100, description: 'Canal del dispositivo' })
  @IsString()
  @MaxLength(100)
  channelCode!: string;

  @ApiProperty({ description: 'Lectura tal como la emite el dispositivo' })
  @IsObject()
  rawValue!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Valor numérico extraído, si lo hay' })
  @IsOptional()
  @IsNumber()
  numericValue?: number;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unitCode?: string;

  @ApiPropertyOptional({
    description: 'Secuencia monótona por canal; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  deviceSequence?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Instante según el reloj del dispositivo',
  })
  @IsOptional()
  @IsISO8601()
  observedAtDevice?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;
}

/** Cuerpo de `POST /ts/devices/{deviceId}/readings/ingest` (UC-58-02). */
export class IngestDeviceReadingsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ingestionId!: string;

  @ApiPropertyOptional({
    maxLength: 100,
    description: 'Serie a la que pertenecen; por omisión, el dispositivo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  seriesId?: string;

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
  @ApiProperty({
    format: 'date-time',
    description: 'Instante de la lectura cruda',
  })
  @IsISO8601()
  time!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  seriesId!: string;

  @ApiProperty({
    maxLength: 100,
    description: 'Código de observación al que mapea el canal',
  })
  @IsString()
  @MaxLength(100)
  observationCode!: string;

  @ApiProperty({
    format: 'uuid',
    description:
      'Concepto del código de observación, necesario para promover a clinical',
  })
  @IsUUID()
  observationCodeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  unitCode!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Unidad como concepto, para la observación clínica',
  })
  @IsOptional()
  @IsUUID()
  unitConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'Si la medición es clínicamente significativa y debe promoverse',
  })
  @IsOptional()
  promoteToClinical?: boolean;
}

export class NormalizeReadingResponseDto {
  @ApiProperty()
  seriesId!: string;

  @ApiProperty()
  observationCode!: string;

  @ApiProperty()
  validationState!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Observación clínica creada al promover',
  })
  clinicallyPromotedObservationId?: string;

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
  @ApiProperty({ enum: TIMESERIES_TABLES })
  @IsIn(TIMESERIES_TABLES)
  table!: string;

  @ApiPropertyOptional({
    maxLength: 50,
    description: 'Anchura temporal del chunk, p. ej. `1 day` o `7 days`',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  chunkTimeInterval?: string;

  @ApiPropertyOptional({
    maxLength: 63,
    description: 'Columna de la dimensión de espacio, p. ej. `tenant_id`',
  })
  @IsOptional()
  @IsString()
  @MaxLength(63)
  spaceColumn?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 256, default: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(256)
  spacePartitions?: number;
}

/** Cuerpo de `PATCH /ts/admin/hypertables/{table}` (UC-58-04). */
export class UpdateHypertableDto {
  @ApiProperty({
    maxLength: 50,
    description: 'Nueva anchura temporal del chunk',
  })
  @IsString()
  @MaxLength(50)
  chunkTimeInterval!: string;
}

export class HypertableResponseDto {
  @ApiProperty()
  table!: string;

  @ApiPropertyOptional({
    description: 'Chunks existentes según el catálogo del motor',
  })
  chunkCount?: number;

  @ApiPropertyOptional()
  compressionEnabled?: boolean;

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
  @ApiProperty({ enum: TIMESERIES_TABLES })
  @IsIn(TIMESERIES_TABLES)
  table!: string;

  @ApiProperty({
    maxLength: 50,
    description: 'Comprime los chunks más antiguos que este intervalo',
  })
  @IsString()
  @MaxLength(50)
  olderThan!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Lote al que se atribuyen las métricas',
  })
  @IsUUID()
  batchId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  maxChunks?: number;
}

export class CompressionResponseDto {
  @ApiProperty()
  table!: string;

  @ApiProperty({ description: 'Chunks comprimidos en esta pasada' })
  chunksCompressed!: number;

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
  @ApiProperty({ enum: TIMESERIES_TABLES })
  @IsIn(TIMESERIES_TABLES)
  table!: string;

  @ApiProperty({
    maxLength: 50,
    description: 'Descarta los chunks más antiguos que este intervalo',
  })
  @IsString()
  @MaxLength(50)
  olderThan!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  batchId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({
    description: 'Por qué se aplica; queda en el log de la operación',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RetentionResponseDto {
  @ApiProperty()
  table!: string;

  @ApiProperty({ description: 'Chunks descartados' })
  chunksDropped!: number;

  @ApiProperty({ type: [String] })
  droppedChunks!: string[];
}

// ---------------------------------------------------------------------------
// UC-58-07 y 08 · Rollups
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /ts/admin/rollups/{name}/refresh` (UC-58-07, 08). */
export class RefreshRollupDto {
  @ApiProperty({
    format: 'date-time',
    description: 'Inicio de la ventana a materializar',
  })
  @IsISO8601()
  from!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Fin de la ventana, exclusivo',
  })
  @IsISO8601()
  to!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  batchId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;
}

export class RefreshRollupResponseDto {
  @ApiProperty({ enum: ROLLUP_NAMES })
  rollup!: string;

  @ApiProperty({ description: 'Buckets materializados en la ventana' })
  bucketsMaterialized!: number;

  @ApiProperty({ format: 'date-time' })
  from!: string;

  @ApiProperty({ format: 'date-time' })
  to!: string;
}

// ---------------------------------------------------------------------------
// UC-58-09 · Consulta de rango con downsampling
// ---------------------------------------------------------------------------

/** Query de `GET /ts/series/{seriesId}/query` (UC-58-09). */
export class QuerySeriesRangeDto {
  @ApiProperty({ enum: TIMESERIES_TABLES })
  @IsIn(TIMESERIES_TABLES)
  dataset!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  from!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  to!: string;

  @ApiProperty({
    maxLength: 50,
    description: 'Anchura del bucket, p. ej. `5 minutes` o `1 day`',
  })
  @IsString()
  @MaxLength(50)
  bucket!: string;

  @ApiPropertyOptional({ enum: AGGREGATIONS, default: 'avg' })
  @IsOptional()
  @IsIn(AGGREGATIONS)
  agg?: Aggregation;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_QUERY_POINTS, default: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class SeriesPointResponseDto {
  @ApiProperty({ format: 'date-time' })
  bucket!: string;

  @ApiPropertyOptional({ description: 'Valor agregado del bucket' })
  value!: number | null;

  @ApiProperty({ description: 'Muestras que entraron en el bucket' })
  samples!: number;
}

export class QuerySeriesRangeResponseDto {
  @ApiProperty()
  seriesId!: string;

  @ApiProperty({
    description: 'De dónde salió el dato: `raw` o el nombre del rollup',
  })
  source!: string;

  @ApiProperty({ type: [SeriesPointResponseDto] })
  points!: SeriesPointResponseDto[];

  @ApiProperty({
    description: 'Verdadero si la respuesta llegó al tope y hay más datos',
  })
  truncated!: boolean;
}

// ---------------------------------------------------------------------------
// UC-58-10 · Eventos de publicidad
// ---------------------------------------------------------------------------

export class AdsEventDto {
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  time!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  adAccountId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  campaignId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  adSetId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  adId?: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  eventName!: string;

  @ApiProperty({
    maxLength: 200,
    description: 'Identificador del origen; es la clave de deduplicación',
  })
  @IsString()
  @MaxLength(200)
  eventId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiPropertyOptional({ maxLength: 3 })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  dimensions?: Record<string, unknown>;
}

/** Cuerpo de `POST /ts/ads/events/batch-ingest` (UC-58-10). */
export class BatchIngestAdsDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ingestionId!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  seriesId?: string;

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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ingestionId!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  seriesId?: string;

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
  @ApiProperty({ enum: BACKFILLABLE_DATASETS })
  @IsIn(BACKFILLABLE_DATASETS)
  dataset!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  batchId!: string;

  @ApiProperty({
    description: 'Justificación de la corrección; sin ella no se aplica',
  })
  @IsString()
  justification!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Inicio de la ventana corregida',
  })
  @IsISO8601()
  windowFrom!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Fin de la ventana corregida',
  })
  @IsISO8601()
  windowTo!: string;

  @ApiProperty({ type: [SeriesPointDto], maxItems: MAX_BATCH_ROWS })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_ROWS)
  @ValidateNested({ each: true })
  @Type(() => SeriesPointDto)
  corrections!: SeriesPointDto[];
}

export class GovernedBackfillResponseDto {
  @ApiProperty()
  seriesId!: string;

  @ApiProperty({ description: 'Correcciones insertadas como eventos nuevos' })
  rowsBackfilled!: number;

  @ApiProperty({
    description: 'Versión de origen con la que entraron las correcciones',
  })
  sourceVersion!: string;
}

// ---------------------------------------------------------------------------
// UC-58-13 · Pings de ubicación
// ---------------------------------------------------------------------------

export class LocationPingDto {
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  time!: string;

  @ApiProperty({ maxLength: 50 })
  @IsString()
  @MaxLength(50)
  subjectType!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  subjectId!: string;

  @ApiProperty({ minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude!: number;

  @ApiProperty({ minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  altitudeM?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracyM?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  speedMps?: number;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  geohash?: string;
}

/** Cuerpo de `POST /ts/location/pings/batch-ingest` (UC-58-13). */
export class BatchIngestLocationDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  ingestionId!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  seriesId?: string;

  @ApiProperty({
    description:
      'Consentimiento vigente que ampara el registro de ubicación del sujeto',
    format: 'uuid',
  })
  @IsUUID()
  consentId!: string;

  @ApiProperty({ type: [LocationPingDto], maxItems: MAX_BATCH_ROWS })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BATCH_ROWS)
  @ValidateNested({ each: true })
  @Type(() => LocationPingDto)
  pings!: LocationPingDto[];
}
