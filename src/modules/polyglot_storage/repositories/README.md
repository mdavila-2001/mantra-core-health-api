# Repositorios — polyglot_storage

Cuatro repositorios, agrupados por lo que se bloquea junto, no por tabla. Ninguno abre transacción:
todos reciben el `EntityManager` transaccional del servicio como primer parámetro.

| Repositorio | Tablas |
| --- | --- |
| `storage-backends.repository.ts` | `storage_backends`, `storage_backend_regions`, `storage_capabilities`, `store_health_checks` |
| `datasets.repository.ts` | `dataset_definitions`, `dataset_versions`, `collection_definitions`, `collection_schema_versions`, `data_access_policies`, `data_classifications` (sólo lectura) |
| `placements.repository.ts` | `dataset_placements`, `tenant_storage_bindings`, `storage_cost_snapshots`, `storage_integrity_policies` |
| `storage-policies.repository.ts` | `consistency_policies`, `residency_policies`, `replication_policies`, `retention_policies`, `encryption_profiles`, `key_rotation_policies` |

`data_classifications` vive con los datasets, no con las políticas, porque quien la lee es la
aprobación de colocación —y ésta ya tiene abierto el repositorio de datasets.

## Bloqueos

`FOR UPDATE` (`LockMode.PESSIMISTIC_WRITE`):

| Método | Por qué |
| --- | --- |
| `findDatasetForUpdate` | el número de versión sale de un máximo |
| `findActiveDatasetVersionForUpdate` | la vigente se supersede; dos vigentes a la vez es el fallo |
| `findPlacementForUpdate` | vincular, degradar o cuarentenar la colocación |
| `findBindingsByPrimaryForUpdate` | el failover les cambia el primario a todos |
| `findRegionForUpdate` | el chequeo de salud escribe el estado de la región |
| `findCostSnapshotForUpdate` | reconsolidar actualiza; sin bloqueo se duplicaría la fila |
| `findIntegrityPolicyForUpdate` | decide si la divergencia cuarentena |

`findPlacementsByRegionForUpdate` es el único con `PESSIMISTIC_PARTIAL_WRITE`
(`FOR UPDATE SKIP LOCKED`): degradar las colocaciones de una región caída es un barrido, y quedarse
esperando a una fila que alguien está editando retrasaría a todas las demás. La que se salta se
degradará en el siguiente chequeo.

## Append-only

`store_health_checks` sólo tiene `createHealthCheck`. Un histórico de salud que se puede editar deja
de ser evidencia de nada.

## Numéricos como texto

`estimated_cost`, `storage_bytes` y `object_count` son `numeric`/`bigint` en la base y viajan como
`string`. Se comparan con `BigInt(...)` cuando la comparación decide algo, no con `Number`.

## Convenciones

- `createdBy(actorUserId)` en cada `create*`; `touch(entity, actorUserId)` en cada mutación.
- Sin `flush()`: lo hace `em.transactional` al cerrar.
- Sin escrituras fuera del esquema `polyglot_storage`.
- Los `find*ByCode` sirven para la unicidad por código; los `find*ById` para resolver referencias.
