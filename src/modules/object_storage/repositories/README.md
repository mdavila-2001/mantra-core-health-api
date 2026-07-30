# Repositorios de almacenamiento de objetos

Acceso a datos de `object_storage.*`. Sin lógica de negocio: sólo lecturas, escrituras y el modo de
bloqueo que cada operación necesita.

## Reparto

| Repositorio | Tablas | Por qué va junto |
| --- | --- | --- |
| `ObjectStorageRepository` | espacios, cargas, manifiestos, versiones, checksums, sobres de cifrado, ubicaciones, payloads grandes | El objeto y todo lo que lo constituye |
| `ObjectGovernanceRepository` | retenciones, retenciones legales, integridad, marcadores de borrado, manifiestos de archivado | Lo que decide si algo se puede borrar o mover |
| `DicomRepository` | estudio, serie, instancia y log de accesos | La jerarquía DICOM y su vigilancia |

La separación no es por tamaño: `ObjectGovernanceRepository` existe porque sus tablas responden a una
pregunta distinta —"¿puedo borrar esto?"— y las escriben actores distintos (cumplimiento, legal, el
worker de integridad) de los que suben ficheros.

## Lecturas con bloqueo

| Método | Modo | Por qué |
| --- | --- | --- |
| `findUploadForUpdate` | `FOR UPDATE` | Completar la carga la cierra y materializa la versión |
| `findManifestForUpdate` | `FOR UPDATE` | Versionar, retener, archivar y borrar mueven su ciclo de vida |
| `findManifestByLogicalIdForUpdate` | `FOR UPDATE` | Destino del upsert al completar la carga |
| `findStudyByUidForUpdate` / `findSeriesByUidForUpdate` | `FOR UPDATE` | Catalogar recalcula sus contadores |
| `findActiveRetentionLockForUpdate` | `FOR UPDATE` | Sólo puede haber una retención sin liberar |
| `findLegalHoldForUpdate` | `FOR UPDATE` | Liberar la cierra |
| `findChecksumForUpdate` | `FOR UPDATE` | La verificación actualiza su estado |
| `findPrimaryLocationForUpdate` | `FOR UPDATE` | La verificación marca la réplica |

El resto son lecturas simples: catálogo, comprobación de duplicados y resolución para servir, que no
debe frenar a quien sube.

## Consultas que llevan semántica

- **`findUploadByProviderId(namespace, providerUploadId)`** — la carga del proveedor no se inicia dos
  veces en el mismo espacio.
- **`findVersionBySha(manifest, sha256)`** — el mismo contenido no genera una segunda versión. Es la
  deduplicación por contenido del módulo.
- **`findManifestByLogicalIdForUpdate`** — clave lógica del objeto dentro de su espacio.
- **`findActiveRetentionLockForUpdate`** y **`findActiveLegalHolds`** filtran por `released_at IS
  NULL` y por estado activo: la invariante de "sólo uno vigente" vive en la consulta.
- **`findActiveLegalHoldsForVersions`** y **`findActiveRetentionLocks`** aceptan una lista: el
  archivado y el borrado por lotes preguntan por todas las versiones de una vez en lugar de una
  consulta por versión.
- **`findLargePayloadBySource`** — un payload por origen y tipo.
- **`findArchiveManifestByHash`** — el hash del lote hace idempotente el archivado.
- **`findDeletionMarker`** — pedir el borrado dos veces no abre un segundo expediente.
- **`findInstanceByUid`** — detecta el reingreso de la misma instancia DICOM.

## Inmutables

`createVersion`, `createIntegrityCheck` y `createAccessLog` sólo insertan. La versión es el contenido
que se guardó, la comprobación es la foto de un momento y el log de acceso es quién miró qué: los
tres dejarían de servir si se pudieran reescribir.

`createRetentionLock`, `createLegalHold`, `createDeletionMarker` y `createArchiveManifest` tampoco
tienen método de borrado — sólo el cierre explícito de un bloqueo desde el servicio
(`released_at`, `hold_state`).

## Auditoría

Estas tablas no tienen columnas `created_by_user_id`/`updated_by_user_id`, así que no usan
`createdBy()`. La trazabilidad va por otras vías: `placed_by_user_id` en la retención legal,
`principal_id` en el log de accesos, y el nivel `warn` de los logs para lo demás.

## Pruebas

Los repositorios no tienen suite propia; se ejercitan como dobles desde los tres servicios.
