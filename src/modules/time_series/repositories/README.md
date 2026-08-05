# Repositorios — time_series

Dos repositorios propios, más uno prestado.

| Repositorio | Qué toca |
| --- | --- |
| `series-ingest.repository.ts` | escritura append-only sobre las doce series de medición |
| `timescale.repository.ts` | objetos del motor: hypertables, chunks, compresión, retención, agregados continuos y lectura de rango |
| `ObservationsRepository` (de `clinical`) | la observación que se crea al promover una vital (UC-58-03) |

El tercero no se duplica: es *stateless* —recibe el `EntityManager` como parámetro— y reutilizarlo
evita reimplementar el contrato de valor de una observación clínica en un módulo que no es el suyo.

## `series-ingest.repository.ts`

**No hay ningún `update*` ni `delete*`** salvo el enlace de promoción clínica, que escribe el
servicio sobre la entidad ya gestionada. Una serie temporal no se corrige en su sitio: se corrige
insertando un evento nuevo con `source_version` mayor (UC-58-12).

`ENTITY_BY_TABLE` traduce el nombre del dataset a la clase de entidad. Es lo que permite que el
dataset llegue como texto en la ruta sin que el texto acabe en una sentencia: o está en el mapa, o la
operación no existe.

`insertPoints` usa `em.create` por fila y **no** `insertMany`. `insertMany` no pasa por el ciclo de
vida de la unidad de trabajo, y aquí la transacción es lo que garantiza que el lote entra entero o no
entra.

Las tres búsquedas de duplicado —`findDeviceReadingBySequence`, `findAdsEvent`, `findVital`— son las
claves naturales que el caso de uso declara. Cada una existe porque su origen reenvía: el dispositivo
con conexión intermitente, el proveedor de publicidad con entrega *at-least-once*, y el worker que
reprocesa un evento ya consumido.

## `timescale.repository.ts`

Este repositorio compone SQL porque sus operaciones no son CRUD: `create_hypertable`,
`add_dimension`, `set_chunk_time_interval`, `compress_chunk`, `drop_chunks`,
`refresh_continuous_aggregate` y `time_bucket` son funciones del propio motor.

**Lista blanca en vez de bind.** Un identificador SQL no admite `?`, así que:

| Qué llega por la petición | Contra qué se comprueba |
| --- | --- |
| nombre de tabla | `TIMESERIES_TABLES` (`assertTable`) |
| nombre de rollup | `ROLLUPS` (`assertRollup`) |
| columna de espacio, de valor, de segmentación | `^[a-z_][a-z0-9_]{0,62}$` |
| función de agregación | `AGGREGATIONS`, más el mismo patrón |

Los valores —intervalos, rangos, tenant, serie, límites, número de particiones— **sí** van
parametrizados.

La columna de valor se entrecomilla al componer la agregación: varias series la llaman `count` o
`value`, que el analizador trata de forma especial según el contexto.

### `refreshContinuousAggregate` no recibe el contexto transaccional

Es deliberado y es la razón de que el método no acepte `tx`. `refresh_continuous_aggregate` es un
procedimiento que TimescaleDB **no permite llamar dentro de un bloque transaccional**: hace su propio
control de transacciones por bucket para no mantener bloqueada la tabla de origen. Pasarle el
contexto abortaría la llamada. El servicio lo llama con el `EntityManager` base, antes de abrir su
transacción.

### `ensureContinuousAggregate` crea `WITH NO DATA`

Materializar en la creación bloquearía la tabla de origen el tiempo que tarde en recorrer todo el
histórico. El refresco posterior lo hace por ventanas acotadas.

### `compress_chunk` lleva `if_not_compressed`

Para que el reintento de un worker no falle sobre un chunk que ya comprimió otro.

## Sin bloqueos, salvo uno

`findDeviceReadingForUpdate` es el único `FOR UPDATE` del módulo: la lectura cruda que se va a
normalizar, para no promoverla dos veces. Todo lo demás es `INSERT` sobre el chunk activo, y no
bloquea nada — es lo que permite que varios colectores escriban a la vez.
