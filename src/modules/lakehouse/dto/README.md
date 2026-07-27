# DTOs — lakehouse

Un solo archivo, `lakehouse.dto.ts`, con los cuerpos de entrada, las respuestas y los anidados
(`QualityRuleDto`, `MaterializedPartitionDto`, `MaterializedFileDto`, `QualityFindingDto`).

## Todo el conteo va como cadena

`recordCount`, `sizeBytes`, `rowCount`, `inputRecordCount`, `outputRecordCount`,
`rejectedRecordCount`, `evaluatedRecordCount` e `issueCount` son `bigint` y se validan con
`@IsNumberString({ no_symbols: true })`. En un lago con miles de millones de filas, un `number` pierde
precisión por encima de 2^53 — y `no_symbols` porque un contador negativo no significa nada.

`threshold` es `numeric` y va con `@IsNumberString()` sin `no_symbols`: un umbral sí puede ser
decimal.

## Lo que el cliente no puede decidir

- **Los estados.** `state` de zonas, catálogos, versiones, cohortes; `lifecycleState` de productos y
  datasets; `status` de corridas, hallazgos y solicitudes. Todos los pone el servicio.
- **`schemaVersion` del dataset.** Es 1 en el alta.
- **`effectiveFrom` y `effectiveTo` de la versión del producto.** Son marcas del servidor: aceptarlas
  permitiría fechar una versión antes de la que supersede.
- **`expiresAt` del manifiesto.** Se deriva de `ttlDays` recortado a la aprobación ética. Lo más
  importante que este módulo no delega al cliente.
- **`requestedAt`, `detectedAt`, `createdAt`, `recordedAt`, `calculatedAt`.**

`RevokeDatasetReleaseDto.expired` sí se acepta, y es sólo un discriminador entre dos cierres: no
cambia lo que pasa, cambia cómo se audita.

## La estructura anidada de la corrida

`RunTransformationDto` → `partitions[]` → `files[]`. Es la forma del lago: una corrida escribe varias
particiones y cada partición varios archivos. Aplanarla obligaría a tres llamadas y a que el linaje y
el commit quedaran a medias entre ellas.

Los topes están en el DTO: `MAX_PARTITIONS_PER_RUN` y `MAX_FILES_PER_PARTITION`. Rechazar en la
validación cuesta menos que rechazar tras deserializar un lote enorme.

`sourcePartitionIds` es opcional dentro de la partición: con él, el linaje es por par de particiones;
sin él, por par de datasets. Las dos son linaje válido con distinta granularidad, y forzar la fina
haría inviable declarar una transformación que mezcla muchas particiones.

## `CuratedIngestionDto` reutiliza `MaterializedPartitionDto`

Porque materializar es lo mismo venga de una transformación o de una de-identificación. Lo que cambia
es la comprobación de zona y la corrida que se registra en `health_data`, no la forma del dato.

## Las listas cerradas

`zoneType`, `storageFormat`, `compatibilityMode`, `dimension`, `severity` y `fileFormat` van con
`@IsIn` contra las constantes del módulo. Un formato de almacenamiento inventado se descubriría al
leer la tabla, no al registrarla.

`classificationCode`, `purposeOfUseCode` y `encryptionProfileCode` son `@IsString()` libres: sus
catálogos son de otros módulos.

## `ttlDays` con tope

De 1 a 3650. El mínimo evita un release que caduca el mismo día que se concede —que es un release
inútil— y el máximo es un tope duro de diez años: cualquier plazo mayor casi seguro es un error de
tecleo, y aquí el error se paga en acceso a datos de pacientes.

En la práctica el plazo efectivo suele ser menor: el servicio lo recorta a la ventana ética.

## `contentHash` obligatorio

En `MaterializedFileDto` y en `ApproveDatasetReleaseDto`. Es lo que hace verificable el archivo y el
manifiesto: sin él, no hay forma de comprobar después que lo que se entregó es lo que se aprobó.

## Respuestas

`partitionsSkipped` (vs `partitionsCommitted`), `alreadyRunning`, `alreadyReleased` y
`alreadyClosed` existen porque en todos esos casos la operación pudo no hacer nada, y devolver `2xx`
sin decirlo dejaría al worker sin saber si tiene que reintentar.

`datasetQuarantined` es el aviso de que el dataset dejó de servirse — el llamante necesita saberlo
aunque él sólo pidiera evaluar la calidad.

`supersededVersionId` dice qué contrato dejó de regir, que es lo que un consumidor del producto tiene
que mirar.
