/**
 * Constantes del módulo 58 (`time_series`).
 *
 * Este esquema **no** usa `*_concept_id`: sus columnas de estado (`quality_state`,
 * `validation_state`) son `varchar`, igual que en `object_storage` y
 * `polyglot_storage`. Una serie temporal de alto volumen inserta millones de filas
 * por día; resolver un concepto por fila añadiría una FK a `terminology` en cada
 * inserción de un flujo que existe precisamente para ser barato.
 *
 * Los valores van en minúsculas porque así los escribe el caso de uso
 * (`quality_state=received`, `validation_state=validated`). La comparación contra
 * la columna es literal.
 */

/** Estado de calidad con el que entra un punto en una serie. */
export const QUALITY_STATES = [
  'received',
  'validated',
  'rejected',
  'backfill',
] as const;
export type QualityState = (typeof QUALITY_STATES)[number];

/** Estado de validación clínica de una constante vital normalizada. */
export const VALIDATION_STATES = ['pending', 'validated', 'rejected'] as const;
export type ValidationState = (typeof VALIDATION_STATES)[number];

/** Etapa del pipeline que emite una métrica de ingesta. */
export const STAGE_CODES = [
  'ingest',
  'normalize',
  'compression',
  'retention',
  'rollup',
  'backfill',
] as const;
export type StageCode = (typeof STAGE_CODES)[number];

/** Códigos de métrica que emite este módulo, tal como los nombra el caso de uso. */
export const METRIC_CODES = {
  ROWS_INGESTED: 'rows_ingested',
  DEVICE_ROWS: 'device_rows',
  ADS_ROWS: 'ads_rows',
  LOCATION_ROWS: 'location_rows',
  ROWS_MATERIALIZED: 'rows_materialized',
  AUDIT_BUCKETS: 'audit_buckets',
  CHUNKS_COMPRESSED: 'chunks_compressed',
  CHUNKS_DROPPED: 'chunks_dropped',
  ROWS_BACKFILLED: 'rows_backfilled',
  VITALS_NORMALIZED: 'vitals_normalized',
} as const;

/** Pipeline al que se atribuyen las métricas que emite este módulo. */
export const PIPELINE_CODE = 'time-series';

/**
 * Las doce tablas de medición del esquema. Es la **lista blanca** que gobierna
 * toda operación administrativa: el nombre de tabla llega por la petición y un
 * identificador SQL no admite *bind*, así que sólo se acepta lo que está aquí.
 *
 * Coincide con `TIMESERIES_TABLES` de `src/orm/catalog/physical.catalog.ts`, que
 * es quien las convierte en hypertables al arrancar.
 */
export const TIMESERIES_TABLES = [
  'ads_delivery_event_series',
  'ai_runtime_metric_series',
  'application_tracking_series',
  'audit_access_metric_series',
  'device_raw_reading_series',
  'ingestion_pipeline_metric_series',
  'lab_analyzer_event_series',
  'location_ping_series',
  'normalized_vital_series',
  'payment_gateway_metric_series',
  'service_sli_series',
  'telemetry_event_series',
] as const;
export type TimeseriesTable = (typeof TIMESERIES_TABLES)[number];

/** Series que admiten ingesta genérica por lote (UC-58-01). */
export const BATCH_INGEST_DATASETS = [
  'device_raw_reading_series',
  'telemetry_event_series',
  'application_tracking_series',
  'audit_access_metric_series',
  'lab_analyzer_event_series',
  'payment_gateway_metric_series',
] as const;
export type BatchIngestDataset = (typeof BATCH_INGEST_DATASETS)[number];

/** Datasets de métricas de runtime y observabilidad (UC-58-11). */
export const METRIC_DATASETS = [
  'ai_runtime_metric_series',
  'ingestion_pipeline_metric_series',
  'service_sli_series',
] as const;
export type MetricDataset = (typeof METRIC_DATASETS)[number];

/** Series que admiten backfill gobernado (UC-58-12). */
export const BACKFILLABLE_DATASETS = [
  'device_raw_reading_series',
  'telemetry_event_series',
] as const;
export type BackfillableDataset = (typeof BACKFILLABLE_DATASETS)[number];

/**
 * Agregados continuos (rollups) que el caso de uso declara, con su definición.
 *
 * Se guardan aquí y no en una tabla porque **el modelo no declara ninguna tabla
 * de catálogo de rollups**: los nombres, el bucket y la agregación vienen escritos
 * en el propio caso de uso (UC-58-07 y UC-58-08). Ponerlos en la lista blanca es
 * lo que permite refrescarlos por nombre sin aceptar SQL del llamante.
 */
export const ROLLUPS = {
  continuous_sli_hourly: {
    source: 'service_sli_series',
    bucket: '1 hour',
    /** `sum(numerator)/sum(denominator) -> value`, por servicio y código de SLI. */
    definition: `
      SELECT time_bucket(INTERVAL '1 hour', time) AS bucket,
             tenant_id,
             service_id,
             sli_code,
             sum(numerator) AS numerator,
             sum(denominator) AS denominator,
             CASE WHEN sum(denominator) = 0 THEN NULL
                  ELSE sum(numerator) / sum(denominator) END AS value
        FROM time_series.service_sli_series
       GROUP BY bucket, tenant_id, service_id, sli_code`,
  },
  continuous_sli_daily: {
    source: 'service_sli_series',
    bucket: '1 day',
    definition: `
      SELECT time_bucket(INTERVAL '1 day', time) AS bucket,
             tenant_id,
             service_id,
             sli_code,
             sum(numerator) AS numerator,
             sum(denominator) AS denominator,
             CASE WHEN sum(denominator) = 0 THEN NULL
                  ELSE sum(numerator) / sum(denominator) END AS value
        FROM time_series.service_sli_series
       GROUP BY bucket, tenant_id, service_id, sli_code`,
  },
  continuous_audit_daily: {
    source: 'audit_access_metric_series',
    bucket: '1 day',
    /** Conteos diarios por tenant, tipo de objetivo y acción. */
    definition: `
      SELECT time_bucket(INTERVAL '1 day', time) AS bucket,
             tenant_id,
             target_type,
             action_code,
             sum(count) AS event_count
        FROM time_series.audit_access_metric_series
       GROUP BY bucket, tenant_id, target_type, action_code`,
  },
} as const;
export type RollupName = keyof typeof ROLLUPS;
export const ROLLUP_NAMES = Object.keys(ROLLUPS) as RollupName[];

/**
 * Columnas por las que se segmenta al comprimir cada serie, tal como las declara
 * el caso de uso (UC-58-05). Van a `timescaledb.compress_segmentby`, que es texto
 * dentro del `ALTER TABLE` y no admite bind: por eso son constantes y no entrada.
 */
export const COMPRESSION_SEGMENTS: Partial<Record<TimeseriesTable, string>> = {
  device_raw_reading_series: 'tenant_id, device_id, channel_code',
  normalized_vital_series: 'tenant_id, patient_profile_id, observation_code',
  telemetry_event_series: 'tenant_id, application_code',
  ads_delivery_event_series: 'tenant_id, ad_account_id',
  service_sli_series: 'tenant_id, service_id, sli_code',
  audit_access_metric_series: 'tenant_id, target_type, action_code',
  ai_runtime_metric_series: 'tenant_id, model_provider, model_id',
  location_ping_series: 'tenant_id, subject_type',
  application_tracking_series: 'tenant_id, application_code',
  lab_analyzer_event_series: 'tenant_id, analyzer_id',
  payment_gateway_metric_series: 'tenant_id, gateway_id',
  ingestion_pipeline_metric_series: 'tenant_id, pipeline_code, stage_code',
};

/** Funciones de agregación admitidas al consultar con downsampling (UC-58-09). */
export const AGGREGATIONS = ['avg', 'min', 'max', 'sum', 'count'] as const;
export type Aggregation = (typeof AGGREGATIONS)[number];

/**
 * Anchura de bucket a partir de la cual la consulta se sirve desde el rollup en
 * vez del dato crudo. Una hora es el bucket más fino que materializa
 * `continuous_sli_hourly`: pedir menos que eso obliga a leer el crudo.
 */
export const DOWNSAMPLING_THRESHOLD_SECONDS = 3600;

/** Tope de puntos que devuelve una consulta de rango. */
export const MAX_QUERY_POINTS = 5000;

/** Tope de filas por lote de ingesta. */
export const MAX_BATCH_ROWS = 5000;
