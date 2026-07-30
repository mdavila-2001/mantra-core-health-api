# Controladores — time_series

Dos controladores, 14 endpoints para 13 casos de uso. Delegan en un servicio; lo único que resuelven
por su cuenta es la validación de los segmentos de ruta contra las listas cerradas del módulo, porque
un `@Param` no pasa por `class-validator`.

## `/ts` — `SeriesController` (8)

| Método · ruta | UC | Código | Rol |
| --- | --- | --- | --- |
| `GET /ts/series/:seriesId/query` | 09 | 200 | `ANALYST`, `DATA_PLATFORM_ADMIN`, `SYSTEM`, `PLATFORM_ADMIN` |
| `POST /ts/series/:seriesId/points/batch-ingest` | 01 | 201 | `INGEST_GATEWAY`, `SYSTEM`, `PLATFORM_ADMIN` |
| `POST /ts/series/:seriesId/backfill/governed` | 12 | 201 | `DATA_PLATFORM_ADMIN`, `PLATFORM_ADMIN` |
| `POST /ts/devices/:deviceId/readings/ingest` | 02 | 201 | `INGEST_GATEWAY`, `DEVICE`, `SYSTEM`, `PLATFORM_ADMIN` |
| `POST /ts/normalize/run` | 03 | 201 | `SYSTEM`, `PLATFORM_ADMIN` |
| `POST /ts/ads/events/batch-ingest` | 10 | 201 | `INGEST_GATEWAY`, `SYSTEM`, `PLATFORM_ADMIN` |
| `POST /ts/metrics/:dataset/batch-ingest` | 11 | 201 | `INGEST_GATEWAY`, `SYSTEM`, `PLATFORM_ADMIN` |
| `POST /ts/location/pings/batch-ingest` | 13 | 201 | `INGEST_GATEWAY`, `SYSTEM`, `PLATFORM_ADMIN` |

**El backfill sólo lo puede hacer `DATA_PLATFORM_ADMIN`**, no el gateway de ingesta. Ingerir datos
nuevos y corregir datos pasados son operaciones distintas, y quien puede hacer lo primero no debería
poder hacer lo segundo por tener las mismas credenciales.

`seriesId` no lleva `ParseUUIDPipe`: `series_id` es `varchar` en el modelo, no un uuid.

## `/ts/admin` — `TimescaleAdminController` (6)

| Método · ruta | UC | Código | Rol |
| --- | --- | --- | --- |
| `POST /ts/admin/hypertables` | 04 | 201 | `DATA_PLATFORM_ADMIN`, `PLATFORM_ADMIN` |
| `PATCH /ts/admin/hypertables/:table` | 04 | 200 | ídem |
| `POST /ts/admin/compression/run` | 05 | 200 | `SYSTEM`, `DATA_PLATFORM_ADMIN`, `PLATFORM_ADMIN` |
| `POST /ts/admin/retention/policies` | 06 | 200 | ídem |
| `POST /ts/admin/rollups/audit-daily/refresh` | 08 | 200 | ídem |
| `POST /ts/admin/rollups/:name/refresh` | 07 | 200 | ídem |

`201` sólo en lo que crea algo (la hypertable). El resto son operaciones sobre objetos que ya
existen.

**Crear la hypertable y ajustar sus chunks es de administrador, no de sistema.** Comprimir, retener y
refrescar sí los hace `SYSTEM`, porque son las tres que corren programadas.

## Orden de declaración

`rollups/audit-daily/refresh` va **antes** que `rollups/:name/refresh`: un segmento literal que
también encaja con un parámetro tiene que resolverse primero, o nunca se alcanzaría.

En `SeriesController`, `GET series/:seriesId/query` va primero por legibilidad —queda junto a las
demás rutas de `series/`—, no por necesidad: es el único `GET`.

## Validación de los segmentos de ruta

`dataset`, `table` y `name` llegan como `@Param` y no pasan por `class-validator`. Los tres se
comprueban en el controlador contra `METRIC_DATASETS`, `TIMESERIES_TABLES` y `ROLLUP_NAMES`, y el
rechazo es un `400` **síncrono**: la petición no llega a abrir transacción ni a tocar el motor.

El repositorio vuelve a comprobarlo con su propia lista blanca. Es deliberado: el controlador da un
error legible al cliente, y el repositorio garantiza que ninguna otra vía de entrada pueda componer
una sentencia con un nombre que no esté en el catálogo.

## Rutas planas

El caso de uso escribe `points:batchIngest`, `readings:ingest`, `normalize:run`, `compression:run`,
`{name}:refresh`, `backfill:governed`, `events:batchIngest`, `{dataset}:batchIngest` y
`pings:batchIngest`. Nest 11 monta sobre `path-to-regexp` v8, que trata `:` como inicio de parámetro
en **cualquier** posición del segmento: `points:batchIngest` declararía un parámetro llamado
`batchIngest`. Se publican como segmentos separados.

## Actor

Todas las rutas de escritura reciben `@CurrentUser()`; va al `actorUserId` del evento de outbox.
`GET series/:seriesId/query` no lo pide: no escribe nada. El caso de uso pide además registrar la
lectura de datos sensibles en `audit.audit_events`, que es del módulo 06 (ver *Pendiente* en el
README del módulo).

## Pruebas

14 pruebas de delegación y validación de ruta en `time-series-controllers.spec.ts`.
