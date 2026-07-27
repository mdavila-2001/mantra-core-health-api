# Servicios — time_series

Cuatro servicios. Cada método público es un caso de uso completo dentro de un único
`em.transactional`, **salvo `refreshRollup`**, que documenta su excepción abajo.

| Servicio | UC | Qué hace |
| --- | --- | --- |
| `series-ingest.service.ts` | 01, 02, 10, 11, 12, 13 | ingesta append-only y backfill gobernado |
| `vital-normalization.service.ts` | 03 | normaliza y promueve al registro clínico |
| `timescale-admin.service.ts` | 04–08 | hypertables, compresión, retención y rollups |
| `series-query.service.ts` | 09 | rango con downsampling |

## SeriesIngestService

Las seis operaciones comparten forma: el lote entra entero o no entra, cada punto lleva su
`ingestion_id` y su `quality_state`, y la operación emite una métrica de pipeline con lo que hizo.

`recordPipelineMetric` es privado y lo llaman casi todas. Sin esa métrica no hay forma de saber si un
pipeline dejó de ingerir, porque la ausencia de datos y la ausencia de ingesta se parecen demasiado.

- `batchIngestPoints` (UC-58-01) — deduplica **por lote** en la clave de idempotencia del outbox: un
  colector que reintenta reenvía el lote entero.
- `ingestDeviceReadings` (UC-58-02) — descarta por secuencia y lo cuenta en `rowsSkipped`, no en
  `rowsIngested`. Si todo el lote era duplicado, no publica evento: no ha pasado nada nuevo.
- `batchIngestAdsEvents` (UC-58-10) — descarta por la clave del origen.
- `batchIngestMetrics` (UC-58-11) — **no emite métrica cuando el destino es
  `ingestion_pipeline_metric_series`**: se estaría midiendo a sí misma y cada lote generaría una fila
  más que a su vez habría que medir.
- `batchIngestLocationPings` (UC-58-13) — el `consentId` viaja en el evento publicado, para que quien
  proyecte pueda comprobar bajo qué permiso llegaron los datos.
- `governedBackfill` (UC-58-12) — valida la ventana y que **cada** corrección caiga dentro; inserta
  con `quality_state = backfill` y `source_version` nueva, sin tocar los originales; `warn` en el
  log, porque alterar histórico no debería pasar desapercibido.

## VitalNormalizationService

Es el único servicio del módulo que escribe fuera de `time_series`. El caso de uso declara
`clinical.observations — INSERT` en la misma transacción, y tiene que ser así: la vital y la
observación que la representa se confirman juntas, o quedaría una vital marcada como promovida
apuntando a una observación que no existe.

El orden es: idempotencia primero (devuelve la normalización previa sin volver a promover), después
la lectura cruda `FOR UPDATE`, después las dos comprobaciones que impiden que basura llegue al
registro clínico —lectura rechazada, lectura sin valor numérico—, y sólo entonces la escritura.

La promoción usa `CLIN.OBSERVATION_FINAL` y `CLIN.VALUE_TYPE_QUANTITY` del módulo clínico, no
conceptos propios: la observación que se crea aquí tiene que ser indistinguible de la que crearía
`clinical`.

## TimescaleAdminService

- `configureHypertable` / `updateHypertable` (UC-58-04) — idempotente por construcción. La dimensión
  de espacio no es opcional en la práctica: particionar sólo por tiempo mete a todos los tenants en
  el mismo chunk, y una consulta de un tenant acaba leyendo los datos de todos.
- `runCompression` (UC-58-05) — habilita la compresión con la segmentación declarada en
  `COMPRESSION_SEGMENTS`, lista los candidatos y comprime **hasta `maxChunks`**, uno a uno. Devuelve
  los que quedan para la siguiente pasada: sin eso, el worker no sabría si terminó.
- `applyRetention` (UC-58-06) — `warn` en el log. Descartar histórico es irreversible.
- `refreshRollup` (UC-58-07, 08) — ver abajo.

### La excepción a "un caso de uso, una transacción"

`refreshRollup` es la **segunda excepción deliberada del proyecto**, después de
`OutboxService.publishDomainEvent`.

`refresh_continuous_aggregate` no se puede llamar dentro de un bloque transaccional: TimescaleDB hace
su propio control de transacciones por bucket para no mantener bloqueada la tabla de origen mientras
materializa. Envolverlo abortaría la llamada.

Por eso va en dos tiempos:

1. `ensureContinuousAggregate` + `refreshContinuousAggregate` en autocommit, con el `EntityManager`
   base;
2. una transacción corta que cuenta los buckets, emite la métrica y publica el evento.

Si el proceso muere entre ambos, el agregado queda materializado —que es idempotente— y sólo se
pierde la métrica de esa pasada. Al revés (métrica sin materialización) sería mentir en el panel.

La validación de la ventana va **antes** del paso 1: rechazar una ventana invertida después de haber
tocado el motor no serviría de nada.

## SeriesQueryService

La decisión que define UC-58-09 es de dónde sale el dato. `pickRollup` sólo elige el agregado si:

- el bucket pedido llega al umbral de una hora, **y**
- la serie tiene agregado continuo, **y**
- el bucket es múltiplo exacto del bucket del agregado.

Lo tercero importa: pedir 90 minutos contra un agregado horario daría cubos que no cuadran con los
materializados, y el resultado no sería el que pidió el llamante sino uno parecido.

`intervalToSeconds` está exportado para poder probarlo aparte. `VALUE_COLUMN` mapea cada serie a su
columna numérica, y `null` significa que la serie sólo registra ocurrencias: ahí sólo `count` tiene
sentido, y pedir una media se rechaza en vez de devolver un número vacío de significado.

El `limit + 1` de la consulta es lo que permite saber si la respuesta está recortada sin hacer una
segunda consulta de conteo.

## Errores

`PreconditionFailedException` (422) para ventanas invertidas, correcciones fuera de ventana, lecturas
no normalizables, agregaciones imposibles y tablas que aún no son hypertable.
`ResourceNotFoundException` (404) para la lectura cruda que no existe.

## Logs

`operation: 'ts.<área>.<acción>'`. `warn` en backfill gobernado y retención. No se loguean valores de
medición, ni coordenadas, ni `raw_value`.
