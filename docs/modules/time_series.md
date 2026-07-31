<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/time_series/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `time_series`

**Fuente:** [`src/modules/time_series/README.md`](https://github.com/mdavila-2001/mantra-core-health-redesa-api/blob/master/src/modules/time_series/README.md)
· 2 controllers · 4 services · 2 repositories · 12 entidades · 1 DTO

---

# Módulo 58 — Series temporales de alto volumen y analítica de eventos

Doce flujos de medición append-only sobre TimescaleDB: ingesta por lote, normalización de lecturas de
dispositivo con promoción al registro clínico, administración física de las particiones (chunks,
compresión, retención), agregados continuos y consulta de rango con downsampling.

## Casos de uso cubiertos (13)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-58-01 | `POST /ts/series/:seriesId/points/batch-ingest` | Lote append-only de puntos |
| UC-58-02 | `POST /ts/devices/:deviceId/readings/ingest` | Lectura de dispositivo médico |
| UC-58-03 | `POST /ts/normalize/run` | Normalizar y promover a `clinical.observations` |
| UC-58-04 | `POST /ts/admin/hypertables` · `PATCH /ts/admin/hypertables/:table` | Hypertable y chunks |
| UC-58-05 | `POST /ts/admin/compression/run` | Comprimir chunks antiguos |
| UC-58-06 | `POST /ts/admin/retention/policies` | Descartar chunks fuera de ventana |
| UC-58-07 | `POST /ts/admin/rollups/:name/refresh` | Materializar agregado continuo |
| UC-58-08 | `POST /ts/admin/rollups/audit-daily/refresh` | Rollup de conteos de auditoría |
| UC-58-09 | `GET /ts/series/:seriesId/query` | Rango con downsampling |
| UC-58-10 | `POST /ts/ads/events/batch-ingest` | Eventos de publicidad con dedupe |
| UC-58-11 | `POST /ts/metrics/:dataset/batch-ingest` | Métricas de runtime y pipeline |
| UC-58-12 | `POST /ts/series/:seriesId/backfill/governed` | Corrección append-only gobernada |
| UC-58-13 | `POST /ts/location/pings/batch-ingest` | Pings de ubicación con consentimiento |

14 endpoints para 13 casos de uso: UC-58-04 tiene dos.

## Estados en `varchar`, en minúsculas

Como `object_storage` y `polyglot_storage`, este esquema no usa `*_concept_id`. Sus columnas de
estado (`quality_state`, `validation_state`) son `varchar` en minúsculas, tal como las escribe el
caso de uso. La razón aquí es de coste: una serie de alto volumen inserta millones de filas al día, y
resolver un concepto por fila añadiría una FK a `terminology` en cada inserción de un flujo que
existe precisamente para ser barato.

Todo vive en `constants/time-series.constants.ts`.

## Entidades sin `id`

Las doce series tienen clave primaria compuesta `(time, tenant_id, series_id)`, que es también la
clave de particionado. Un uuid sintético no aportaría nada: a una medición nunca se accede por
identificador, siempre por rango de tiempo y serie. Tampoco tienen `created_at`, `updated_at` ni
`row_version`: no hay nada que versionar en una fila que no se actualiza.

## Flujo general

```
INGESTA (append-only, el lote entra entero o no entra)
  series/:id/points/batch-ingest ──> quality_state = received
  devices/:id/readings/ingest ─────> UK (tenant, dispositivo, canal, secuencia) descarta el reenvío
  ads/events/batch-ingest ─────────> UK (tenant, cuenta, evento, nombre) descarta el reenvío
  metrics/:dataset/batch-ingest ───> ai_runtime · ingestion_pipeline · service_sli
  location/pings/batch-ingest ─────> exige consentimiento vigente
        └─ todas emiten una métrica en ingestion_pipeline_metric_series

NORMALIZACIÓN
  normalize/run ──> lee la cruda FOR UPDATE
                    ├─ ya normalizada ──────> devuelve la de antes
                    ├─ rechazada / sin valor > rechazo
                    └─ crea la vital validated
                         └─ promoteToClinical ──> INSERT en clinical.observations
                                                  + enlace en la vital, misma tx

ADMINISTRACIÓN FÍSICA
  admin/hypertables ────────> create_hypertable + dimensión de espacio + anchura de chunk
  admin/compression/run ────> comprime N chunks más antiguos que el umbral, uno a uno
  admin/retention/policies ─> drop_chunks (metadata, no fila a fila)
  admin/rollups/:name/refresh ─> ensure + refresh FUERA de transacción, después métrica

CONSULTA
  series/:id/query ──> bucket < 1 h  ó serie sin rollup ──> crudo
                       bucket múltiplo de 1 h / 1 día  ──> continuous_sli_hourly / _daily
```

## Reglas de negocio

- **Nada se actualiza en su sitio.** Una corrección es un evento nuevo con `source_version` mayor y
  `quality_state = backfill`. Un histórico reescribible deja de servir para responder "qué se sabía
  en ese momento", que es la pregunta que justifica guardarlo.
- **El `ingestion_id` marca el lote, no el punto.** Un colector que reintenta reenvía el lote entero,
  así que la deduplicación tiene que ser por lote.
- **El reenvío del dispositivo se descarta por secuencia**, y se cuenta aparte (`rowsSkipped`). Un
  dispositivo con conexión intermitente reenvía lo que no pudo confirmar; sin esto la misma lectura
  entraría dos veces y falsearía cualquier media.
- **El evento de publicidad trae su propio `event_id`** justamente para poder reenviarse. Contar dos
  veces una conversión falsea el coste por adquisición, que es lo que se factura.
- **Una lectura sin valor numérico no se normaliza.** Un `raw_value` que no se pudo interpretar no
  debe llegar al registro clínico como si se hubiera medido algo.
- **La normalización es idempotente por `(serie, instante, código)`.** Reprocesar el mismo evento
  —lo normal con entrega *at-least-once*— crearía una segunda observación del mismo hecho, y el
  historial del paciente mostraría dos tomas donde hubo una.
- **La vital y su observación clínica se confirman juntas.** Si no, quedaría una vital marcada como
  promovida apuntando a una observación que no existe.
- **La ubicación exige consentimiento** como campo obligatorio de la petición, no como comprobación
  aparte. Es el dato más fácil de recoger sin darse cuenta de que hace falta permiso, y el permiso
  viaja en el evento para que quien proyecte pueda comprobarlo.
- **El backfill exige justificación y ventana.** Una corrección sin motivo declarado es
  indistinguible de una manipulación, y una corrección fuera de la ventana aprobada no es la
  corrección que se aprobó.
- **Se comprime un chunk cada vez y con tope por pasada.** Comprimir reescribe el chunk entero;
  lanzarlo sobre todos los candidatos bloquearía la tabla el tiempo que dure, que es justo de lo que
  se trata de escapar. Y sólo lo más antiguo que el umbral: un chunk comprimido queda de sólo
  lectura, y una escritura tardía sobre él fallaría.
- **La retención descarta por metadata**, no fila a fila: cuesta lo mismo en una serie de mil
  millones de filas que en una de mil.
- **Los conteos de auditoría no sustituyen la auditoría.** `continuous_audit_daily` alimenta paneles;
  la cadena legal vive en `audit.audit_events` y la retención de este módulo no la toca.
- **El rollup sólo sirve la consulta si su bucket encaja.** Pedir 90 minutos contra un agregado
  horario daría cubos que no cuadran con los materializados: el resultado no sería el que se pidió
  sino uno parecido, y eso es peor que tardar más.
- **Una serie que sólo registra ocurrencias sólo admite `count`.** Devolver la media de algo que no
  tiene magnitud sería devolver un número sin significado.

## Las dos escrituras fuera del esquema

- **`clinical.observations`** (UC-58-03). El caso de uso la declara como parte de la misma
  transacción, y el módulo registra la entidad y reutiliza `ObservationsRepository` de `clinical` en
  vez de duplicar el contrato de valor de una observación.
- **El propio motor** (UC-58-04 … 09). Hypertables, chunks, compresión, retención y agregados
  continuos son objetos de TimescaleDB, no filas: se manipulan con sus funciones de catálogo.

## La excepción a "un caso de uso, una transacción"

`refreshRollup` (UC-58-07 y 08) es la **segunda excepción deliberada del proyecto**, después de
`OutboxService.publishDomainEvent`.

`refresh_continuous_aggregate` es un procedimiento que TimescaleDB no permite llamar dentro de un
bloque transaccional: hace su propio control de transacciones por bucket para no mantener bloqueada
la tabla de origen mientras materializa. Envolverlo abortaría la llamada.

Por eso la operación va en dos tiempos: refresco en autocommit y, después, una transacción corta que
cuenta los buckets, emite la métrica y publica el evento. Si el proceso muere entre ambos, el
agregado queda materializado —lo cual es idempotente— y sólo se pierde la métrica de esa pasada.

## Lista blanca en vez de bind

Los nombres de tabla, de rollup, de columna de agregación y de función de agregación llegan por la
petición y **no admiten `?`**: un identificador SQL no se parametriza. Todos se comprueban contra
listas cerradas del módulo (`TIMESERIES_TABLES`, `ROLLUPS`, `VALUE_COLUMN`, `AGGREGATIONS`,
`COMPRESSION_SEGMENTS`) antes de entrar en la sentencia. Los valores —intervalos, rangos, tenant,
serie, límites— sí van parametrizados.

## Permisos

`INGEST_GATEWAY`, `DEVICE` y `SYSTEM` ingieren. `SYSTEM` normaliza. `DATA_PLATFORM_ADMIN` administra
particiones, compresión, retención y rollups, y es el único que puede hacer backfill.
`ANALYST` consulta. `PLATFORM_ADMIN` cubre todo.

Ninguna ruta es pública.

## Concurrencia

`FOR UPDATE` sólo en un sitio: la lectura cruda que se va a normalizar, para no promoverla dos veces.
El resto de la ingesta es `INSERT` puro sobre el chunk activo, sin bloqueos: es lo que permite que
varios colectores escriban a la vez.

## Logs

`operation: 'ts.<área>.<acción>'`. Nivel `warn` en backfill gobernado y en retención —los dos
momentos en que se altera o se pierde histórico—. No se loguean valores de medición, ni coordenadas,
ni `raw_value`.

## Pruebas

`yarn test --testPathPatterns=modules/time_series` — 89 pruebas (18 ingesta + 8 normalización +
15 administración + 16 consulta + 18 del repositorio de Timescale + 14 de delegación de los dos
controladores).

## Divergencias con el caso de uso v3.9

- **Segmentos planos en vez de `:accion`.** El caso de uso escribe `points:batchIngest`,
  `readings:ingest`, `normalize:run`, `compression:run`, `{name}:refresh`, `backfill:governed`,
  `events:batchIngest`, `{dataset}:batchIngest`, `pings:batchIngest`. Nest 11 monta sobre
  `path-to-regexp` v8, que trata `:` como inicio de parámetro en cualquier posición del segmento. Se
  publican como segmentos separados.
- **UC-58-03 tiene endpoint público.** El caso de uso lo marca como *worker interno* pero también da
  la ruta `POST /ts/normalize:run`; se publica ésa, bajo rol `SYSTEM`, para que el worker pueda
  invocarla.
- **UC-58-06 no persiste la política.** El caso de uso habla de "definir/ejecutar política de
  retención", pero **el modelo no declara ninguna tabla de políticas de retención**. El endpoint
  ejecuta el descarte con la ventana recibida y lo registra; la política vigente no se guarda porque
  no hay dónde.

## Pendiente

- **Tabla de catálogo de políticas** de retención y compresión: no existe en el modelo, así que hoy
  cada llamada lleva su umbral. Cuando se declare, estos endpoints pasarían a leerla en vez de
  recibirla.
- **Definición de los agregados continuos en el modelo**: `continuous_sli_hourly`,
  `continuous_sli_daily` y `continuous_audit_daily` sólo están descritos en el texto del caso de uso.
  Aquí viven en `ROLLUPS`, dentro del módulo. Si el modelo los declara como objetos, esa constante
  sobra.
- **`redis_runtime.idempotency_entries` y `distributed_lock_entries`** (UC-58-01, 05, 12): aquí lo
  cubren las claves naturales y la clave de idempotencia del outbox. Ese esquema es del módulo 56,
  **sin asignar**.
- **Comprobación de consentimiento contra `consent.consents`** (UC-58-09, 13): el consentimiento se
  exige y se propaga, pero no se contrasta contra el módulo 07. Esa comprobación es de `authz` y
  `consent`, que son de la parte de Pablo.
- **`audit.audit_events` en la lectura de datos sensibles** (UC-58-09): el caso de uso pide registrar
  la consulta. El registro de auditoría es del módulo 06.
- **Re-materialización automática de los rollups afectados por un backfill** (UC-58-12): el evento
  `GovernedBackfillApplied` sale al outbox con la ventana; encadenar el refresco es del worker.
- **`lab_analyzer_event_series` y `payment_gateway_metric_series`** se pueden ingerir por
  `points/batch-ingest` y consultar, pero ningún caso de uso del módulo 58 les da un endpoint propio.

