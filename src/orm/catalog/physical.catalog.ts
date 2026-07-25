import type { PhysicalStatementSpec } from './catalog.types';

/**
 * Materialización física que MikroORM no puede derivar de la metadata de una
 * entidad.
 *
 * MikroORM sabe crear tablas, columnas, PK e índices. No sabe que
 * `time_series.normalized_vital_series` debe ser una *hypertable* de TimescaleDB
 * (una tabla particionada por tiempo con gestión automática de chunks), ni que
 * `vector_rag.vector_embeddings.embedding` necesita un índice HNSW para que una
 * búsqueda por similitud no degenere en un escaneo secuencial de todo el corpus.
 *
 * Estas sentencias corren en la última capa del arranque, cuando las tablas ya
 * existen, y todas son idempotentes.
 */

/** Los 12 flujos de medición del módulo 58; todos particionan por la columna `time`. */
const TIMESERIES_TABLES = [
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

/**
 * Conversión a hypertable.
 *
 * `migrate_data => TRUE` permite convertir una tabla que ya tiene filas (el caso
 * de un despliegue sobre una base existente); `if_not_exists => TRUE` hace que
 * la llamada sea inocua si la tabla ya es hypertable, que es el caso normal a
 * partir del segundo arranque.
 */
const hypertables: PhysicalStatementSpec[] = TIMESERIES_TABLES.map((table) => ({
  id: `hypertable:time_series.${table}`,
  description: `Particiona time_series.${table} por la columna time (TimescaleDB)`,
  requiresExtension: 'timescaledb',
  sql: `SELECT create_hypertable('time_series.${table}', 'time', if_not_exists => TRUE, migrate_data => TRUE)`,
  // La condición previa no es necesaria para la corrección -`if_not_exists`
  // ya hace la llamada inocua- sino para la honestidad del informe: sin ella,
  // cada arranque reportaría "12 objetos aplicados" cuando en realidad no se
  // ha tocado nada, y ese ruido enmascara el arranque en el que sí cambió algo.
  precondition: `SELECT NOT EXISTS (
                   SELECT 1 FROM timescaledb_information.hypertables
                    WHERE hypertable_schema = 'time_series'
                      AND hypertable_name = '${table}'
                 ) AS ok`,
  preconditionReason: `time_series.${table} ya es hypertable`,
  preconditionSeverity: 'info' as const,
}));

/**
 * Índices de similitud vectorial.
 *
 * HNSW (Hierarchical Navigable Small World) es el método de pgvector con mejor
 * relación recall/latencia para consultas ANN sobre corpus grandes. Se elige el
 * operador coseno (`vector_cosine_ops`) porque los embeddings del pipeline se
 * normalizan antes de persistirse, que es la métrica que asume el módulo 59.
 *
 * Este índice no se declara en el catálogo de índices general porque su
 * definición depende de un operador de clase que solo existe si la extensión
 * `vector` está instalada.
 */
const vectorIndexes: PhysicalStatementSpec[] = [
  {
    id: 'index:vector_rag.vector_embeddings.embedding',
    description:
      'Índice HNSW coseno sobre los embeddings del módulo 59 (búsqueda ANN)',
    requiresExtension: 'vector',
    sql:
      'CREATE INDEX IF NOT EXISTS ix_vector_embeddings_embedding_hnsw ' +
      'ON vector_rag.vector_embeddings USING hnsw (embedding vector_cosine_ops)',
    // Deuda conocida del modelo: la bóveda declara la columna como `vector`, sin
    // dimensión. pgvector admite esa forma para almacenar, pero no para indexar:
    // un índice HNSW necesita saber cuántas componentes tiene el vector. Fijar
    // aquí una dimensión (1536, 3072...) sería inventar una decisión que
    // pertenece al modelo y que además es irreversible sin recrear la tabla.
    //
    // Mientras el modelo no la declare, el índice se omite de forma explícita.
    // La consecuencia operativa es que la búsqueda por similitud funciona pero
    // recorre el corpus entero, lo cual es aceptable con volumen de desarrollo e
    // inaceptable en producción; por eso queda registrado en cada arranque.
    precondition: `SELECT atttypmod > 0 AS ok
                     FROM pg_attribute
                    WHERE attrelid = 'vector_rag.vector_embeddings'::regclass
                      AND attname = 'embedding'`,
    preconditionReason:
      'la columna vector_rag.vector_embeddings.embedding no declara dimensión; ' +
      'el modelo la define como "vector" sin tamaño y HNSW exige una dimensión fija',
  },
];

export const physicalCatalog: readonly PhysicalStatementSpec[] = [
  ...hypertables,
  ...vectorIndexes,
];
