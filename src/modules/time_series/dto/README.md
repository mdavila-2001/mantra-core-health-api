# DTOs — time_series

Un solo archivo, `time-series.dto.ts`, con los cuerpos de entrada, la query de consulta y las
respuestas, más los anidados (`SeriesPointDto`, `DeviceReadingDto`, `AdsEventDto`,
`LocationPingDto`).

## `values` abierto y `@IsObject()`

`SeriesPointDto` lleva `time` y un `values` sin forma declarada. Las doce series tienen columnas
distintas, y el punto se ingiere en la que diga `dataset`: imponer una estructura aquí obligaría a
doce DTOs casi iguales, y cada columna nueva del modelo rompería el contrato.

Lo que **sí** está cerrado es el destino: `dataset` se valida con `@IsIn` contra
`BATCH_INGEST_DATASETS`, `METRIC_DATASETS`, `BACKFILLABLE_DATASETS` o `TIMESERIES_TABLES` según la
operación, y el repositorio traduce ese nombre a una clase de entidad. MikroORM descarta las claves
que no son columnas, así que un `values` con basura no la escribe.

## Topes en el propio DTO

`@ArrayMaxSize(MAX_BATCH_ROWS)` en los cuatro lotes. Un lote sin tope es una petición que puede tumbar
el proceso antes de llegar al servicio, y rechazarla en la validación cuesta menos que rechazarla
después de deserializar cien mil puntos.

`limit` de la consulta también se recorta —a `MAX_QUERY_POINTS`— pero eso se hace en el servicio, no
aquí: el tope vive junto a la consulta que lo consume.

## Lo que el cliente no puede decidir

- **`quality_state` y `validation_state`.** Los pone el servicio: `received` al ingerir, `validated`
  al normalizar, `backfill` al corregir. Aceptarlos por la petición permitiría marcar como validado
  algo que no pasó por la validación.
- **`source_version` del backfill.** Se deriva del instante de la corrección; si lo eligiera el
  llamante, podría hacer que una corrección pareciera anterior a lo que corrige.
- **El nombre de la columna a agregar.** Sale de `VALUE_COLUMN`, no de la query. Ese nombre acaba en
  una sentencia SQL.

## Números y rangos

`deviceSequence` es `bigint` y se valida con `@IsNumberString({ no_symbols: true })`: una secuencia
negativa no significa nada, y por encima de 2^53 un `number` pierde precisión, que es justo donde la
deduplicación empezaría a fallar.

`latitude` y `longitude` llevan `@Min`/`@Max` con los rangos reales. Una coordenada fuera de rango no
es un dato pobre: es un dato imposible, y guardarlo contamina cualquier consulta geoespacial
posterior.

`accuracyM` y `speedMps` llevan `@Min(0)`.

## `consentId` obligatorio

`BatchIngestLocationDto.consentId` es `@IsUUID()` sin `@IsOptional()`. La ubicación de una persona es
el dato más fácil de recoger sin darse cuenta de que hace falta permiso; hacerlo campo obligatorio de
la petición convierte el permiso en algo que no se puede omitir por descuido.

## `justification` obligatoria

Lo mismo en `GovernedBackfillDto`: una corrección de histórico sin motivo declarado es
indistinguible de una manipulación.

## Intervalos como texto

`chunkTimeInterval`, `olderThan` y `bucket` viajan como cadena (`1 day`, `30 days`, `5 minutes`)
porque así los expresa PostgreSQL y así se parametrizan (`?::interval`). El servicio de consulta
además los traduce a segundos con `intervalToSeconds` para decidir si puede usar un rollup, y ahí sí
rechaza lo que no sabe leer.

## Respuestas

`rowsIngested` y `rowsSkipped` van separados: el llamante necesita distinguir "no entró nada porque
ya estaba" de "no entró nada porque falló algo".

`QuerySeriesRangeResponseDto.source` dice de dónde salió el dato (`raw` o el nombre del rollup), y
`truncated` avisa de que hay más. Sin lo primero, un valor agregado no se puede interpretar; sin lo
segundo, una gráfica se corta sin decirlo.

`NormalizeReadingResponseDto.duplicate` distingue una normalización nueva de la devolución de una
anterior — que es lo que el worker necesita para saber si tiene que hacer algo más.
