# src/orm/bootstrap/layers — Las siete capas del DDL

El orden **no es una preferencia de estilo**: es una dependencia dura de PostgreSQL. Cada
eslabón se descubrió aplicando la secuencia contra una base vacía y viendo qué reventaba.

| # | Capa | Qué materializa | Por qué va aquí |
|---|---|---|---|
| 01 | `extensions` | pgcrypto, vector, timescaledb, pg_trgm | Una extensión aporta tipos. Sin `vector`, `CREATE TABLE ... (embedding vector)` falla con "type vector does not exist" |
| 02 | `schemas` | Los 57 esquemas del modelo | `CREATE TABLE iam.users` falla si no existe `iam`, y el mensaje culpa a la tabla |
| 03 | `types` | `terminology.technical_data_type` | Sin el enum, el DDL de tablas aborta a mitad con error 42704 y deja el esquema incompleto |
| 04 | `tables` | 1159 tablas y sus columnas | Contienen lo que se indexa y se referencia |
| 05 | `indexes` | 7313 índices secundarios | Incluyen los únicos a los que apuntan las FKs |
| 06 | `foreign-keys` | 5993 restricciones | Exigen origen y destino ya materializados |
| 07 | `physical` | 12 hypertables, índices HNSW | Transforman tablas que ya existen |

`index.ts` las ordena en tiempo de ejecución por el campo `order`, no por el orden del
array, para que reordenar los imports no cambie el comportamiento.

## Cómo escribir una capa nueva

Implementa `DdlLayer` (`../ddl-layer.contract.ts`) y añádela al array de `index.ts` con su
número. Dos propiedades son obligatorias:

1. **Idempotencia.** Se ejecuta en cada arranque de cada réplica; la segunda pasada no debe
   cambiar nada ni fallar.
2. **No destructividad.** Ninguna capa borra tablas, columnas ni datos. Una retirada del
   modelo se hace con una migración revisada, no automáticamente al desplegar.

El patrón que siguen todas para ser eficientes: **una lectura al catálogo de PostgreSQL,
diferencia en memoria, escritura solo de lo que falta**. Es la diferencia entre 10 ms y
varios miles de viajes de ida y vuelta en un arranque donde no hay nada que hacer.

## Notas por capa

**01 extensions.** `required: false` en casi todas: instalar una extensión exige privilegios
que el usuario de la aplicación no siempre tiene en PostgreSQL gestionado. Una capacidad
opcional que falta degrada, no tumba.

**03 types.** `CREATE TYPE` no admite `IF NOT EXISTS`, así que se consulta `pg_type` primero.
Para los tipos que ya existen se añaden con `ALTER TYPE ... ADD VALUE IF NOT EXISTS` los
valores que el modelo declara y la base no tiene. Nunca se eliminan valores. Reporta como
incidencia que el dominio de valores de `technical_data_type` es provisional.

**04 tables.** Es la capa más delicada. `safe: true` protege los datos pero **no** los
objetos de esquema: el generador sigue emitiendo `drop index` y `drop constraint` para todo
lo que existe en la base y no está en la metadata de las entidades, que en este proyecto son
los ~13 000 objetos del catálogo. `keepAdditiveStatements` los filtra; sin ese filtro la base
nunca convergería y cada despliegue abriría una ventana sin índices ni integridad
referencial. Además trocea en lotes de 200 para no agotar `max_locks_per_transaction`.

**05 indexes / 06 foreign-keys.** Ambas normalizan el nombre con `shortenIdentifier` antes de
comparar contra el catálogo de PostgreSQL. Ambas toleran fallos por lote: un índice único
que no se puede crear porque los datos ya lo violan se reporta y no impide arrancar.

**07 physical.** Distingue "falló y hay que mirarlo" de "no se puede todavía y ya sabemos por
qué" mediante `precondition` en el catálogo. Las 12 hypertables usan la condición previa para
que el informe diga la verdad: sin ella, cada arranque reportaría "12 objetos aplicados"
cuando no se ha tocado nada, y ese ruido enmascara el arranque en el que sí cambió algo.
