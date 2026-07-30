# Repositorios — lakehouse

Tres repositorios propios, más uno prestado.

| Repositorio | Tablas |
| --- | --- |
| `lakehouse-catalog.repository.ts` | `data_lake_zones`, `lakehouse_catalogs`, `data_products`, `data_product_versions`, `lakehouse_quality_rules`, `lakehouse_datasets`, `lakehouse_schema_versions` |
| `lakehouse-runtime.repository.ts` | `transformation_definitions`, `transformation_runs`, `lakehouse_partitions`, `lakehouse_files`, `lakehouse_lineage_edges`, `lakehouse_quality_runs`, `lakehouse_quality_issues` |
| `research.repository.ts` | `research_projects`, `cohort_definitions`, `dataset_release_requests`, `dataset_release_manifests` |
| `DataReleaseRepository` (de `health_data`) | `health_deidentification_profiles`, `health_deidentification_runs` |

El cuarto no se duplica: es *stateless* —recibe el `EntityManager` como parámetro— y reutilizarlo
evita reimplementar el contrato de una corrida de de-identificación en un módulo que no es el suyo.

## Las claves naturales

La idempotencia del lakehouse se apoya en cinco búsquedas:

| Método | Clave | Qué impide |
| --- | --- | --- |
| `findPartitionByHash` | `(dataset, huella de partición)` | que reintentar la corrida duplique el lago |
| `findFileByHash` | `(partición, hash de contenido)` | registrar dos veces el mismo archivo |
| `findDatasetByTable` | `(catálogo, base, tabla)` | dos datasets sobre la misma tabla física |
| `findProductByCode` · `findProjectByCode` | `(tenant, código)` | que el upsert con id de ruta rompa la unicidad |
| `findSchemaByFingerprint` | `(dataset, huella)` | hacer creer que el contrato cambió cuando no lo hizo |

## Bloqueos

`FOR UPDATE` (`LockMode.PESSIMISTIC_WRITE`):

| Método | Por qué |
| --- | --- |
| `findProductForUpdate` · `findProjectForUpdate` | el upsert lee y escribe la misma fila |
| `findActiveProductVersionForUpdate` | publicar supersede a la vigente; dos activas es el fallo |
| `findDatasetForUpdate` | la corrida de calidad puede dejarlo en cuarentena |
| `findReleaseRequestForUpdate` | aprobar y revocar compiten |
| `findManifestByRequestForUpdate` | un manifiesto por solicitud, y hay que verlo antes de crear otro |

`findLiveRunByTargetForUpdate` es el único con `PESSIMISTIC_PARTIAL_WRITE` (`SKIP LOCKED`), y por el
mismo motivo que en `graph_intelligence`: **no** es una cola. El segundo disparo tiene que ver que ya
hay una corrida y rendirse; con un `FOR UPDATE` normal se bloquearía hasta que terminase la primera y
entonces abriría una segunda, que es lo que se quiere evitar.

## Append-only e inmutable

`lakehouse_files` y `lakehouse_lineage_edges` sólo tienen `create*` y lecturas.

- Un archivo del lago no se edita: si su contenido cambia, es otro archivo con otro hash.
- El linaje es el registro de qué produjo qué, y no se corrige.

`lakehouse_partitions` tampoco se reescribe: una corrección materializa una partición nueva. El
estado `superseded` existe para eso.

## Los `bigint` como cadena

`recordCount`, `sizeBytes`, `rowCount`, `inputRecordCount`, `outputRecordCount`,
`rejectedRecordCount`, `evaluatedRecordCount`, `failedRecordCount` e `issueCount` son `bigint` y
viajan como `string`. El servicio de transformación los suma con `BigInt`: por encima de 2^53 un
`number` pierde precisión, y en un lago con miles de millones de filas eso llega a pasar.

`threshold` es `numeric` y también viaja como cadena.

## `createProduct` y `createProject` aceptan `id`

Es deliberado y es la única forma de honrar a la vez el `UPSERT` que declara el caso de uso y el id
del agregado en la ruta. El servicio comprueba antes que el código no lo tenga otro agregado.

## Sin borrados

Ningún repositorio tiene `delete*`. En este módulo nada se borra: las versiones se supersede, los
datasets se cuarentenan o se retiran, los releases se expiran o se revocan, y la purga física del
objeto de-identificado es del módulo 60.
