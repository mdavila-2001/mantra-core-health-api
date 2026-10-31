<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `cross_store_consistency`

- **Bloque:** Datos y NoSQL (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)
- **Operaciones:** 16 (16 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 14 · BAJO 2
- **Tablas distintas que tocan:** 22
- **Respuestas de error y detalle contractual:** `openapi/endpoints/cross-store-consistency.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/admin/archive-jobs` | Archivar por retención y purgar la copia caliente | MEDIO | 7 | SYSTEM, DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 2 | POST | `/admin/data-movement-jobs` | Mover datos entre zonas de almacenamiento | MEDIO | 7 | DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 3 | POST | `/admin/deletion-requests` | Solicitar el borrado de un sujeto | MEDIO | 5 | PRIVACY_OFFICER, DPO, PLATFORM_ADMIN |
| 4 | PATCH | `/admin/deletion-requests/{id}` | Cerrar la solicitud de borrado | MEDIO | 6 | PRIVACY_OFFICER, DPO, PLATFORM_ADMIN |
| 5 | POST | `/admin/projections/dead-letters/{id}/replay` | Reprocesar una entrega de la cola muerta | MEDIO | 4 | DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 6 | POST | `/admin/projections/definitions` | Registrar la definición de proyección con sus suscripciones y su SLO | MEDIO | 6 | DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 7 | POST | `/admin/projections/drift/{id}/repair-jobs` | Encolar la reparación de una deriva | MEDIO | 8 | DATA_GOVERNANCE_ADMIN, SYSTEM, PLATFORM_ADMIN |
| 8 | POST | `/admin/reconciliation/runs` | Registrar la corrida de reconciliación y abrir las derivas | MEDIO | 8 | SYSTEM, RECONCILIATION_WORKER, DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 9 | POST | `/workers/cache/invalidations` | Encolar la invalidación de caché | MEDIO | 5 | SYSTEM, MAINTENANCE_WORKER, PLATFORM_ADMIN |
| 10 | POST | `/workers/deletion-requests/{id}/expand` | Expandir la solicitud a objetivos por store | MEDIO | 4 | SYSTEM, DELETION_WORKER, PLATFORM_ADMIN |
| 11 | POST | `/workers/deletion-targets/{id}/executions` | Ejecutar el borrado en el store destino | MEDIO | 5 | SYSTEM, DELETION_WORKER, PLATFORM_ADMIN |
| 12 | POST | `/workers/deletion-targets/{id}/verifications` | Verificar la ausencia en el store | MEDIO | 3 | SYSTEM, DELETION_WORKER, PLATFORM_ADMIN |
| 13 | GET | `/workers/deletion-targets/executed` | Listar objetivos ejecutados pendientes de verificación | BAJO | 1 | SYSTEM, DELETION_WORKER, PLATFORM_ADMIN |
| 14 | GET | `/workers/deletion-targets/pending` | Listar objetivos de borrado pendientes de ejecución | BAJO | 1 | SYSTEM, DELETION_WORKER, PLATFORM_ADMIN |
| 15 | POST | `/workers/projections/dead-letters` | Mandar el intento fallido a la cola muerta | MEDIO | 8 | SYSTEM, PROJECTION_WORKER, PLATFORM_ADMIN |
| 16 | POST | `/workers/projections/deliveries/process` | Registrar la entrega y avanzar el checkpoint | MEDIO | 10 | SYSTEM, PROJECTION_WORKER, PLATFORM_ADMIN |

---

## 1. POST /admin/archive-jobs

- **Origen:** CONTRATO
- **Nombre:** Archivar por retención y purgar la copia caliente
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreAdminController.archiveData` — `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:225`

### Qué es y para qué sirve (negocio)

Archivar por retención y purgar la copia caliente. Caso de uso UC-62-14: Archivado por retención. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/cross_store_consistency/README.md:72`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /admin/archive-jobs` la atiende `CrossStoreAdminController.archiveData` (src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:225). Exige sesión con alguno de los roles SYSTEM, DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `ArchiveDataDto` (6 campos, 4 obligatorios). Delega en `StorageMaintenanceService.archiveData`. Crea filas en cross_store_consistency.archive_jobs, cross_store_consistency.cache_invalidation_jobs, messaging.domain_events, messaging.outbox_messages. Actualiza cross_store_consistency.archive_jobs. Lee cross_store_consistency.archive_jobs, messaging.outbox_messages. Publica DataArchived.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:225` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.archive_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | CrossStoreAdminController.archiveData → StorageMaintenanceService.archiveData | `src/modules/cross_store_consistency/services/storage-maintenance.service.ts:260` |
| `cross_store_consistency.archive_jobs` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.archiveData → StorageMaintenanceService.archiveData → DeletionRepository.createArchiveJob | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:577` |
| `cross_store_consistency.archive_jobs` | LEE | LEE | DIRECTA | CrossStoreAdminController.archiveData → StorageMaintenanceService.archiveData → DeletionRepository.findArchiveJob | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:530` |
| `cross_store_consistency.cache_invalidation_jobs` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.archiveData → StorageMaintenanceService.archiveData → DeletionRepository.createCacheJob | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:408` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.archiveData → StorageMaintenanceService.archiveData → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.archiveData → StorageMaintenanceService.archiveData → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | CrossStoreAdminController.archiveData → StorageMaintenanceService.archiveData → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `DataArchived` | `src/modules/cross_store_consistency/services/storage-maintenance.service.ts:271` |

### Cuerpo — DTO `ArchiveDataDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1446` |
| `datasetId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1453` |
| `retentionCutoff` | `string` | Sí | formato date-time | `@IsISO8601()` | Se archiva lo anterior a este corte | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1463` |
| `archiveManifestObjectId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Manifiesto en el almacén frío. Sin él no se purga la copia caliente. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1475` |
| `archivedCount` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Filas archivadas; cadena por ser bigint | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1482` |
| `deletedHotCount` | `string` | No | — | `@IsOptional()` `@IsNumberString({ no_symbols: true })` | Filas purgadas de la copia caliente; cadena por ser bigint | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1492` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "datasetId": "00000000-0000-4000-8000-000000000001",
  "retentionCutoff": "2026-07-31T12:00:00.000Z",
  "archivedCount": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "datasetId": "00000000-0000-4000-8000-000000000001",
  "retentionCutoff": "2026-07-31T12:00:00.000Z",
  "archiveManifestObjectId": "00000000-0000-4000-8000-000000000001",
  "archivedCount": "valor-ejemplo",
  "deletedHotCount": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ArchiveJobResponseDto>` · DTO `ArchiveJobResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1503` |
| `objectManifestId` | `string` | Sí | formato uuid | — | Identificador asociado a object manifest. | sin fuente |
| `recordCount` | `string` | Sí | — | — | Versiones movidas a frío; cadena por ser bigint | sin fuente |
| `lifecycleState` | `string` | Sí | — | — | Ciclo de vida en el que queda el objeto | sin fuente |
| `duplicate` | `boolean` | Sí | — | — | true si ese lote ya se había archivado | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1533` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El corte de retención tiene que estar en el pasado.; PreconditionFailedException: No se purga la copia caliente sin el manifiesto del archivo frío confirmado. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `UC-62-14`

---

## 2. POST /admin/data-movement-jobs

- **Origen:** CONTRATO
- **Nombre:** Mover datos entre zonas de almacenamiento
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreAdminController.moveData` — `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:204`

### Qué es y para qué sirve (negocio)

Mover datos entre zonas de almacenamiento. Caso de uso UC-62-13: Movimiento entre zonas. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/cross_store_consistency/README.md:71`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /admin/data-movement-jobs` la atiende `CrossStoreAdminController.moveData` (src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:204). Exige sesión con alguno de los roles DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `MoveDataDto` (10 campos, 6 obligatorios). Delega en `StorageMaintenanceService.moveData`. Crea filas en cross_store_consistency.cache_invalidation_jobs, cross_store_consistency.data_movement_jobs, cross_store_consistency.schema_migration_jobs, messaging.domain_events, messaging.outbox_messages. Lee cross_store_consistency.data_movement_jobs, messaging.outbox_messages. Publica DataMovementRequested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:204` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.cache_invalidation_jobs` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.moveData → StorageMaintenanceService.moveData → DeletionRepository.createCacheJob | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:408` |
| `cross_store_consistency.data_movement_jobs` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.moveData → StorageMaintenanceService.moveData → DeletionRepository.createMovementJob | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:471` |
| `cross_store_consistency.data_movement_jobs` | LEE | LEE | DIRECTA | CrossStoreAdminController.moveData → StorageMaintenanceService.moveData → DeletionRepository.findMovementJob | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:424` |
| `cross_store_consistency.schema_migration_jobs` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.moveData → StorageMaintenanceService.moveData → DeletionRepository.createSchemaMigrationJob | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:514` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.moveData → StorageMaintenanceService.moveData → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.moveData → StorageMaintenanceService.moveData → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | CrossStoreAdminController.moveData → StorageMaintenanceService.moveData → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `DataMovementRequested` | `src/modules/cross_store_consistency/services/storage-maintenance.service.ts:166` |

### Cuerpo — DTO `MoveDataDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1315` |
| `datasetId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1322` |
| `sourcePlacementId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1329` |
| `targetPlacementId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1336` |
| `movementMode` | `string` | Sí | valores: COPY, MOVE | `@IsIn(MOVEMENT_MODES)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1343` |
| `manifestHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Huella del lote movido; garantiza idempotencia | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1354` |
| `collectionDefinitionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Colección cuyo esquema cambia en el destino | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1365` |
| `fromSchemaVersion` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1374` |
| `toSchemaVersion` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1383` |
| `migrationStrategy` | `string` | No | valores: IN_PLACE, DUAL_WRITE, BACKFILL | `@IsOptional()` `@IsIn(MIGRATION_STRATEGIES)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1391` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "datasetId": "00000000-0000-4000-8000-000000000001",
  "sourcePlacementId": "00000000-0000-4000-8000-000000000001",
  "targetPlacementId": "00000000-0000-4000-8000-000000000001",
  "movementMode": "COPY",
  "manifestHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "datasetId": "00000000-0000-4000-8000-000000000001",
  "sourcePlacementId": "00000000-0000-4000-8000-000000000001",
  "targetPlacementId": "00000000-0000-4000-8000-000000000001",
  "movementMode": "COPY",
  "manifestHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "collectionDefinitionId": "00000000-0000-4000-8000-000000000001",
  "fromSchemaVersion": "valor-ejemplo",
  "toSchemaVersion": "valor-ejemplo",
  "migrationStrategy": "IN_PLACE"
}
```

</details>

### Respuesta — `Promise<MovementJobResponseDto>` · DTO `MovementJobResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1402` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1408` |
| `schemaMigrationJobId` | `string` | No | formato uuid | — | Migración de esquema encolada, si procede | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1417` |
| `cacheInvalidationJobId` | `string` | No | formato uuid | — | Invalidación de caché encolada | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1426` |
| `duplicate` | `boolean` | Sí | — | — | Verdadero si ese lote ya se había movido | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1432` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El emplazamiento de origen y el de destino no pueden ser el mismo. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `UC-62-13`

---

## 3. POST /admin/deletion-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitar el borrado de un sujeto
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreAdminController.requestDeletion` — `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:161`

### Qué es y para qué sirve (negocio)

Solicitar el borrado de un sujeto. Caso de uso UC-62-08: Solicitud de borrado. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/cross_store_consistency/README.md:66`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /admin/deletion-requests` la atiende `CrossStoreAdminController.requestDeletion` (src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:161). Exige sesión con alguno de los roles PRIVACY_OFFICER, DPO, PLATFORM_ADMIN. Valida el cuerpo como `CrossStoreConsistencyRequestDeletionDto` (6 campos, 5 obligatorios). Delega en `DeletionService.requestDeletion`. Crea filas en cross_store_consistency.deletion_requests, messaging.domain_events, messaging.outbox_messages. Lee cross_store_consistency.deletion_requests, messaging.outbox_messages. Publica DeletionRequested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRIVACY_OFFICER, DPO, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:161` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.deletion_requests` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.requestDeletion → DeletionService.requestDeletion → DeletionRepository.createRequest | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:67` |
| `cross_store_consistency.deletion_requests` | LEE | LEE | DIRECTA | CrossStoreAdminController.requestDeletion → DeletionService.requestDeletion → DeletionRepository.findLiveRequestBySubject | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:103` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.requestDeletion → DeletionService.requestDeletion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.requestDeletion → DeletionService.requestDeletion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | CrossStoreAdminController.requestDeletion → DeletionService.requestDeletion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `DeletionRequested` | `src/modules/cross_store_consistency/services/deletion.service.ts:106` |

### Cuerpo — DTO `CrossStoreConsistencyRequestDeletionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:785` |
| `subjectType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Qué clase de sujeto se borra | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:793` |
| `subjectId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:800` |
| `reasonCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:808` |
| `legalBasisCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Base legal del borrado; sin ella no se acepta | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:819` |
| `slaDays` | `number` | No | mínimo 1; máximo 365 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(365)` | Días de plazo para cumplirlo; por omisión, 30 | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:833` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "subjectType": "valor-ejemplo",
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "reasonCode": "CODIGO_EJEMPLO",
  "legalBasisCode": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "subjectType": "valor-ejemplo",
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "reasonCode": "CODIGO_EJEMPLO",
  "legalBasisCode": "CODIGO_EJEMPLO",
  "slaDays": 1
}
```

</details>

### Respuesta — `Promise<DeletionRequestResponseDto>` · DTO `DeletionRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:844` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:850` |
| `dueAt` | `string` | Sí | formato date-time | — | Fecha límite de cumplimiento | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:859` |
| `duplicate` | `boolean` | Sí | — | — | Verdadero si ya había una solicitud viva para el sujeto | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:867` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `UC-62-08`

---

## 4. PATCH /admin/deletion-requests/{id}

- **Origen:** CONTRATO
- **Nombre:** Cerrar la solicitud de borrado
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreAdminController.closeDeletionRequest` — `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:182`

### Qué es y para qué sirve (negocio)

Cerrar la solicitud de borrado. Caso de uso UC-62-11: Verificación y cierre. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/cross_store_consistency/README.md:69`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`PATCH /admin/deletion-requests/{id}` la atiende `CrossStoreAdminController.closeDeletionRequest` (src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:182). Exige sesión con alguno de los roles PRIVACY_OFFICER, DPO, PLATFORM_ADMIN. Valida el cuerpo como `CloseDeletionRequestDto` (1 campo, 0 obligatorios). Delega en `DeletionService.closeDeletionRequest`. Crea filas en messaging.domain_events, messaging.outbox_messages. Actualiza cross_store_consistency.deletion_requests. Lee cross_store_consistency.deletion_requests, cross_store_consistency.deletion_targets, messaging.outbox_messages. Publica DeletionRequestClosed.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRIVACY_OFFICER, DPO, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:182` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:182` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.deletion_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | CrossStoreAdminController.closeDeletionRequest → DeletionService.closeDeletionRequest | `src/modules/cross_store_consistency/services/deletion.service.ts:492` |
| `cross_store_consistency.deletion_requests` | LEE | LEE | DIRECTA | CrossStoreAdminController.closeDeletionRequest → DeletionService.closeDeletionRequest → DeletionRepository.findRequestForUpdate | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:85` |
| `cross_store_consistency.deletion_targets` | LEE | LEE | DIRECTA | CrossStoreAdminController.closeDeletionRequest → DeletionService.closeDeletionRequest → DeletionRepository.findTargetsByRequest | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:195` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.closeDeletionRequest → DeletionService.closeDeletionRequest → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.closeDeletionRequest → DeletionService.closeDeletionRequest → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | CrossStoreAdminController.closeDeletionRequest → DeletionService.closeDeletionRequest → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `DeletionRequestClosed` | `src/modules/cross_store_consistency/services/deletion.service.ts:494` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CloseDeletionRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `note` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Nota de cierre; queda en el evento | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1198` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<CloseDeletionResponseDto>` · DTO `CloseDeletionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1209` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1215` |
| `verifiedTargets` | `number` | Sí | — | — | Objetivos verificados ausentes | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1221` |
| `blockedTargets` | `number` | Sí | — | — | Objetivos bloqueados por retención legal | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1227` |
| `pendingTargets` | `number` | Sí | — | — | Objetivos que todavía no están verificados | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1233` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud de borrado no encontrada. |
| 409 | `CONFLICT` | ConflictException: La solicitud ya está cerrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud no tiene objetivos; expándela antes de cerrarla.; PreconditionFailedException: Quedan objetivos sin verificar; el borrado no está completo. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `UC-62-11`

---

## 5. POST /admin/projections/dead-letters/{id}/replay

- **Origen:** CONTRATO
- **Nombre:** Reprocesar una entrega de la cola muerta
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreAdminController.replayDeadLetter` — `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:91`

### Qué es y para qué sirve (negocio)

Reprocesar una entrega de la cola muerta. Caso de uso UC-62-04: Cola muerta y reproceso. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/cross_store_consistency/README.md:62`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /admin/projections/dead-letters/{id}/replay` la atiende `CrossStoreAdminController.replayDeadLetter` (src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:91). Exige sesión con alguno de los roles DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `ReplayDeadLetterDto` (1 campo, 0 obligatorios). Delega en `ProjectionDeliveryService.replayDeadLetter`. Crea filas en cross_store_consistency.projection_delivery_attempts. Actualiza cross_store_consistency.projection_dead_letters. Lee cross_store_consistency.projection_dead_letters, cross_store_consistency.projection_delivery_attempts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:91` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:91` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.projection_dead_letters` | ESCRIBE | ACTUALIZA | POR_TIPO | CrossStoreAdminController.replayDeadLetter → ProjectionDeliveryService.replayDeadLetter | `src/modules/cross_store_consistency/services/projection-delivery.service.ts:463` |
| `cross_store_consistency.projection_dead_letters` | LEE | LEE | DIRECTA | CrossStoreAdminController.replayDeadLetter → ProjectionDeliveryService.replayDeadLetter → ProjectionRepository.findDeadLetterForUpdate | `src/modules/cross_store_consistency/repositories/projection.repository.ts:512` |
| `cross_store_consistency.projection_delivery_attempts` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.replayDeadLetter → ProjectionDeliveryService.replayDeadLetter → ProjectionRepository.createAttempt | `src/modules/cross_store_consistency/repositories/projection.repository.ts:366` |
| `cross_store_consistency.projection_delivery_attempts` | LEE | LEE | DIRECTA | CrossStoreAdminController.replayDeadLetter → ProjectionDeliveryService.replayDeadLetter → ProjectionRepository.findAttemptForUpdate | `src/modules/cross_store_consistency/repositories/projection.repository.ts:382` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ReplayDeadLetterDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `payloadHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash del payload reprocesado | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:474` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "payloadHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

</details>

### Respuesta — `Promise<ReplayResponseDto>` · DTO `ReplayResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `attemptId` | `string` | Sí | formato uuid | — | Intento nuevo creado para el reproceso | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:488` |
| `attemptNumber` | `number` | Sí | — | — | Valor de attempt number mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:494` |
| `idempotencyKey` | `string` | Sí | — | — | Clave de idempotencia conservada del intento original | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:502` |
| `deadLetterState` | `string` | Sí | — | — | Valor de dead letter state mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:508` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Entrada de cola muerta no encontrada.; ResourceNotFoundException: Intento original no encontrado. |
| 409 | `CONFLICT` | ConflictException: La entrada de cola muerta ya no está abierta. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `UC-62-04`

---

## 6. POST /admin/projections/definitions

- **Origen:** CONTRATO
- **Nombre:** Registrar la definición de proyección con sus suscripciones y su SLO
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreAdminController.registerProjection` — `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:69`

### Qué es y para qué sirve (negocio)

Registrar la definición de proyección con sus suscripciones y su SLO. Caso de uso UC-62-01: Definición, suscripciones y SLO. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/cross_store_consistency/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /admin/projections/definitions` la atiende `CrossStoreAdminController.registerProjection` (src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:69). Exige sesión con alguno de los roles DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `RegisterProjectionDto` (18 campos, 8 obligatorios). Delega en `ProjectionDeliveryService.registerProjection`. Crea filas en cross_store_consistency.projection_definitions, cross_store_consistency.projection_subscriptions, cross_store_consistency.store_consistency_slos. Actualiza cross_store_consistency.store_consistency_slos. Lee cross_store_consistency.projection_definitions, cross_store_consistency.store_consistency_slos.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.projection_definitions` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.registerProjection → ProjectionDeliveryService.registerProjection → ProjectionRepository.createDefinition | `src/modules/cross_store_consistency/repositories/projection.repository.ts:63` |
| `cross_store_consistency.projection_definitions` | LEE | LEE | DIRECTA | CrossStoreAdminController.registerProjection → ProjectionDeliveryService.registerProjection → ProjectionRepository.findDefinitionByVersion | `src/modules/cross_store_consistency/repositories/projection.repository.ts:76` |
| `cross_store_consistency.projection_subscriptions` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.registerProjection → ProjectionDeliveryService.registerProjection → ProjectionRepository.createSubscription | `src/modules/cross_store_consistency/repositories/projection.repository.ts:137` |
| `cross_store_consistency.store_consistency_slos` | ESCRIBE | ACTUALIZA | POR_TIPO | CrossStoreAdminController.registerProjection → ProjectionDeliveryService.registerProjection | `src/modules/cross_store_consistency/services/projection-delivery.service.ts:136` |
| `cross_store_consistency.store_consistency_slos` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.registerProjection → ProjectionDeliveryService.registerProjection → ProjectionRepository.createSlo | `src/modules/cross_store_consistency/repositories/projection.repository.ts:230` |
| `cross_store_consistency.store_consistency_slos` | LEE | LEE | DIRECTA | CrossStoreAdminController.registerProjection → ProjectionDeliveryService.registerProjection → ProjectionRepository.findSloForUpdate | `src/modules/cross_store_consistency/repositories/projection.repository.ts:183` |

### Cuerpo — DTO `RegisterProjectionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:147` |
| `sourceDatasetId` | `string` | Sí | formato uuid | `@IsUUID()` | Dataset canónico del que se proyecta | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:157` |
| `targetDatasetId` | `string` | Sí | formato uuid | `@IsUUID()` | Dataset destino en el store secundario | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:167` |
| `projectionVersion` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:175` |
| `deliverySemantics` | `string` | No | valores: AT_LEAST_ONCE, AT_MOST_ONCE, EXACTLY_ONCE | `@IsOptional()` `@IsIn(DELIVERY_SEMANTICS)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:183` |
| `transformationRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:192` |
| `subscriptions` | `array<SubscriptionInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => SubscriptionInputDto)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:202` |
| `subscriptions[].sourceEventType` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Tipo de evento del outbox que suscribe | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:51` |
| `subscriptions[].consumerCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:59` |
| `subscriptions[].targetBackendCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Store destino al que proyecta | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:67` |
| `subscriptions[].concurrencyLimit` | `number` | No | mínimo 1; máximo 100 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(100)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:77` |
| `subscriptions[].retryPolicyJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Política de reintento del consumidor | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:85` |
| `subscriptions[].deadLetterEnabled` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:93` |
| `slo` | `ConsistencySloInputDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => ConsistencySloInputDto)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:211` |
| `slo.maxProjectionLagSeconds` | `number` | No | mínimo 0 | `@IsInt()` `@Min(0)` | Retraso máximo tolerado de la proyección | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:109` |
| `slo.maxDriftRate` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Tasa máxima de deriva; cadena por ser numeric | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:119` |
| `slo.reconciliationIntervalMinutes` | `number` | No | mínimo 1 | `@IsInt()` `@Min(1)` | Cada cuánto se reconcilia | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:127` |
| `slo.alertPolicyCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:136` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "sourceDatasetId": "00000000-0000-4000-8000-000000000001",
  "targetDatasetId": "00000000-0000-4000-8000-000000000001",
  "projectionVersion": "valor-ejemplo",
  "subscriptions": [
    {
      "sourceEventType": "valor-ejemplo",
      "consumerCode": "CODIGO_EJEMPLO",
      "targetBackendCode": "CODIGO_EJEMPLO"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "sourceDatasetId": "00000000-0000-4000-8000-000000000001",
  "targetDatasetId": "00000000-0000-4000-8000-000000000001",
  "projectionVersion": "valor-ejemplo",
  "deliverySemantics": "AT_LEAST_ONCE",
  "transformationRef": "valor-ejemplo",
  "subscriptions": [
    {
      "sourceEventType": "valor-ejemplo",
      "consumerCode": "CODIGO_EJEMPLO",
      "targetBackendCode": "CODIGO_EJEMPLO",
      "concurrencyLimit": 1,
      "retryPolicyJson": {},
      "deadLetterEnabled": true
    }
  ],
  "slo": {
    "maxProjectionLagSeconds": 1,
    "maxDriftRate": "valor-ejemplo",
    "reconciliationIntervalMinutes": 1,
    "alertPolicyCode": "CODIGO_EJEMPLO"
  }
}
```

</details>

### Respuesta — `Promise<ProjectionDefinitionResponseDto>` · DTO `ProjectionDefinitionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:222` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:228` |
| `projectionVersion` | `string` | Sí | — | — | Valor de projection version mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:234` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:240` |
| `subscriptionIds` | `array<string>` | Sí | formato uuid | — | Valor de subscription ids mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:246` |
| `sloId` | `string` | No | formato uuid | — | Identificador asociado a slo. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:252` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe esa versión de la definición de proyección.; ConflictException: Dos suscripciones comparten el mismo tipo de evento y consumidor. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El dataset de origen y el de destino no pueden ser el mismo. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `UC-62-01`

---

## 7. POST /admin/projections/drift/{id}/repair-jobs

- **Origen:** CONTRATO
- **Nombre:** Encolar la reparación de una deriva
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreAdminController.repairDrift` — `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:139`

### Qué es y para qué sirve (negocio)

Encolar la reparación de una deriva. Caso de uso UC-62-07: Reparación de deriva. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/cross_store_consistency/README.md:65`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /admin/projections/drift/{id}/repair-jobs` la atiende `CrossStoreAdminController.repairDrift` (src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:139). Exige sesión con alguno de los roles DATA_GOVERNANCE_ADMIN, SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `RepairDriftDto` (4 campos, 1 obligatorio). Delega en `ReconciliationService.repairDrift`. Crea filas en cross_store_consistency.projection_repair_jobs, cross_store_consistency.reindex_jobs, messaging.domain_events, messaging.outbox_messages. Actualiza cross_store_consistency.projection_drift_events. Lee cross_store_consistency.projection_drift_events, cross_store_consistency.projection_repair_jobs, messaging.outbox_messages. Publica ProjectionRepairRequested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_GOVERNANCE_ADMIN, SYSTEM, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:139` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:139` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.projection_drift_events` | ESCRIBE | ACTUALIZA | POR_TIPO | CrossStoreAdminController.repairDrift → ReconciliationService.repairDrift | `src/modules/cross_store_consistency/services/reconciliation.service.ts:273` |
| `cross_store_consistency.projection_drift_events` | LEE | LEE | DIRECTA | CrossStoreAdminController.repairDrift → ReconciliationService.repairDrift → ReconciliationRepository.findDriftForUpdate | `src/modules/cross_store_consistency/repositories/reconciliation.repository.ts:232` |
| `cross_store_consistency.projection_repair_jobs` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.repairDrift → ReconciliationService.repairDrift → ReconciliationRepository.createRepairJob | `src/modules/cross_store_consistency/repositories/reconciliation.repository.ts:281` |
| `cross_store_consistency.projection_repair_jobs` | LEE | LEE | DIRECTA | CrossStoreAdminController.repairDrift → ReconciliationService.repairDrift → ReconciliationRepository.findRepairJobByKey | `src/modules/cross_store_consistency/repositories/reconciliation.repository.ts:246` |
| `cross_store_consistency.reindex_jobs` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.repairDrift → ReconciliationService.repairDrift → ReconciliationRepository.createReindexJob | `src/modules/cross_store_consistency/repositories/reconciliation.repository.ts:328` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.repairDrift → ReconciliationService.repairDrift → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.repairDrift → ReconciliationService.repairDrift → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | CrossStoreAdminController.repairDrift → ReconciliationService.repairDrift → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `ProjectionRepairRequested` | `src/modules/cross_store_consistency/services/reconciliation.service.ts:275` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RepairDriftDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `repairAction` | `string` | Sí | valores: REPROJECT, REINDEX, DELETE_ORPHAN | `@IsIn(REPAIR_ACTIONS)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:696` |
| `sourceAlias` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Alias de origen para el reindexado | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:708` |
| `targetIndex` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:717` |
| `targetSchemaVersion` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:726` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "repairAction": "REPROJECT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "repairAction": "REPROJECT",
  "sourceAlias": "valor-ejemplo",
  "targetIndex": "valor-ejemplo",
  "targetSchemaVersion": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<RepairJobResponseDto>` · DTO `RepairJobResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:737` |
| `repairAction` | `string` | Sí | — | — | Valor de repair action mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:743` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:749` |
| `projectionDriftEventId` | `string` | Sí | formato uuid | — | Identificador asociado a projection drift event. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:755` |
| `reindexJobId` | `string` | No | formato uuid | — | Job de reindexado creado, si procede | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:764` |
| `duplicate` | `boolean` | Sí | — | — | Verdadero si esa deriva ya tenía reparación | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:770` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Evento de deriva no encontrado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La deriva ya no está abierta.; PreconditionFailedException: Borrar el huérfano sólo repara una deriva de tipo EXTRA. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `UC-62-07`

---

## 8. POST /admin/reconciliation/runs

- **Origen:** CONTRATO
- **Nombre:** Registrar la corrida de reconciliación y abrir las derivas
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreAdminController.runReconciliation` — `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:113`

### Qué es y para qué sirve (negocio)

Registrar la corrida de reconciliación y abrir las derivas. Caso de uso UC-62-05: Corrida de reconciliación. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/cross_store_consistency/README.md:63`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /admin/reconciliation/runs` la atiende `CrossStoreAdminController.runReconciliation` (src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:113). Exige sesión con alguno de los roles SYSTEM, RECONCILIATION_WORKER, DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `RunReconciliationDto` (13 campos, 7 obligatorios). Delega en `ReconciliationService.runReconciliation`. Crea filas en cross_store_consistency.projection_drift_events, cross_store_consistency.reconciliation_items, cross_store_consistency.reconciliation_runs, messaging.domain_events, messaging.outbox_messages. Actualiza cross_store_consistency.reconciliation_runs. Lee cross_store_consistency.projection_drift_events, messaging.outbox_messages. Publica ProjectionDriftDetected.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, RECONCILIATION_WORKER, DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts:113` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.projection_drift_events` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.runReconciliation → ReconciliationService.runReconciliation → ReconciliationRepository.createDrift | `src/modules/cross_store_consistency/repositories/reconciliation.repository.ts:214` |
| `cross_store_consistency.projection_drift_events` | LEE | LEE | DIRECTA | CrossStoreAdminController.runReconciliation → ReconciliationService.runReconciliation → ReconciliationRepository.findOpenDrift | `src/modules/cross_store_consistency/repositories/reconciliation.repository.ts:163` |
| `cross_store_consistency.reconciliation_items` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.runReconciliation → ReconciliationService.runReconciliation → ReconciliationRepository.createItem | `src/modules/cross_store_consistency/repositories/reconciliation.repository.ts:127` |
| `cross_store_consistency.reconciliation_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | CrossStoreAdminController.runReconciliation → ReconciliationService.runReconciliation | `src/modules/cross_store_consistency/services/reconciliation.service.ts:148` |
| `cross_store_consistency.reconciliation_runs` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.runReconciliation → ReconciliationService.runReconciliation → ReconciliationRepository.createRun | `src/modules/cross_store_consistency/repositories/reconciliation.repository.ts:65` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.runReconciliation → ReconciliationService.runReconciliation → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | CrossStoreAdminController.runReconciliation → ReconciliationService.runReconciliation → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | CrossStoreAdminController.runReconciliation → ReconciliationService.runReconciliation → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `ProjectionDriftDetected` | `src/modules/cross_store_consistency/services/reconciliation.service.ts:132` |

### Cuerpo — DTO `RunReconciliationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:587` |
| `datasetId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:594` |
| `sourceBackendCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Store canónico; siempre PostgreSQL | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:605` |
| `targetBackendCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:613` |
| `reconciliationScopeJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Qué abarca la corrida | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:621` |
| `items` | `array<ReconciliationItemDto>` | Sí | mínimo 1 elemento(s); máximo 5000 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_RECONCILIATION_ITEMS)` `@ValidateNested({ each: true })` `@Type(() => ReconciliationItemDto)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:635` |
| `items[].canonicalEntityId` | `string` | Sí | formato uuid | `@IsUUID()` | Entidad canónica comparada | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:524` |
| `items[].canonicalVersion` | `string` | No | — | `@IsOptional()` `@IsNumberString({ no_symbols: true })` | Versión canónica; cadena por ser bigint | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:534` |
| `items[].targetDocumentId` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:543` |
| `items[].targetVersion` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:552` |
| `items[].canonicalHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:561` |
| `items[].targetHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:570` |
| `items[].result` | `string` | Sí | valores: MATCH, DIVERGENT, MISSING, EXTRA | `@IsIn(ITEM_RESULTS)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:577` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "datasetId": "00000000-0000-4000-8000-000000000001",
  "sourceBackendCode": "CODIGO_EJEMPLO",
  "targetBackendCode": "CODIGO_EJEMPLO",
  "items": [
    {
      "canonicalEntityId": "00000000-0000-4000-8000-000000000001",
      "result": "MATCH"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "datasetId": "00000000-0000-4000-8000-000000000001",
  "sourceBackendCode": "CODIGO_EJEMPLO",
  "targetBackendCode": "CODIGO_EJEMPLO",
  "reconciliationScopeJson": {},
  "items": [
    {
      "canonicalEntityId": "00000000-0000-4000-8000-000000000001",
      "canonicalVersion": "valor-ejemplo",
      "targetDocumentId": "00000000-0000-4000-8000-000000000001",
      "targetVersion": "valor-ejemplo",
      "canonicalHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "targetHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "result": "MATCH"
    }
  ]
}
```

</details>

### Respuesta — `Promise<ReconciliationResponseDto>` · DTO `ReconciliationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:646` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:652` |
| `missingCount` | `number` | Sí | — | — | Documentos que la fuente tiene y el vector no | sin fuente |
| `orphanCount` | `number` | Sí | — | — | Documentos que el vector tiene y la fuente ya no | sin fuente |
| `mismatchedCount` | `number` | Sí | — | — | Documentos presentes en ambos con contenido distinto | sin fuente |
| `repairJobId` | `string` | No | formato uuid | — | Job encolado para reparar lo que falta | sin fuente |
| `purgeJobId` | `string` | No | formato uuid | — | Job encolado para purgar los huérfanos | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La misma entidad canónica aparece dos veces en la corrida. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `UC-62-05`

---

## 9. POST /workers/cache/invalidations

- **Origen:** CONTRATO
- **Nombre:** Encolar la invalidación de caché
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreWorkerController.invalidateCache` — `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:209`

### Qué es y para qué sirve (negocio)

Encolar la invalidación de caché. Caso de uso UC-62-12: Invalidación de caché. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/cross_store_consistency/README.md:70`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /workers/cache/invalidations` la atiende `CrossStoreWorkerController.invalidateCache` (src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:209). Exige sesión con alguno de los roles SYSTEM, MAINTENANCE_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `CrossStoreConsistencyInvalidateCacheDto` (5 campos, 5 obligatorios). Delega en `StorageMaintenanceService.invalidateCache`. Crea filas en cross_store_consistency.cache_invalidation_jobs, messaging.domain_events, messaging.outbox_messages. Lee cross_store_consistency.cache_invalidation_jobs, messaging.outbox_messages. Publica CacheInvalidationRequested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MAINTENANCE_WORKER, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:209` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.cache_invalidation_jobs` | ESCRIBE | CREA | DIRECTA | CrossStoreWorkerController.invalidateCache → StorageMaintenanceService.invalidateCache → DeletionRepository.createCacheJob | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:408` |
| `cross_store_consistency.cache_invalidation_jobs` | LEE | LEE | DIRECTA | CrossStoreWorkerController.invalidateCache → StorageMaintenanceService.invalidateCache → DeletionRepository.findCacheJob | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:369` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | CrossStoreWorkerController.invalidateCache → StorageMaintenanceService.invalidateCache → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | CrossStoreWorkerController.invalidateCache → StorageMaintenanceService.invalidateCache → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | CrossStoreWorkerController.invalidateCache → StorageMaintenanceService.invalidateCache → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `CacheInvalidationRequested` | `src/modules/cross_store_consistency/services/storage-maintenance.service.ts:77` |

### Cuerpo — DTO `CrossStoreConsistencyInvalidateCacheDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1248` |
| `datasetId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1255` |
| `entityId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1262` |
| `entityVersion` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Versión de la entidad; cadena por ser bigint | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1269` |
| `cacheScope` | `string` | Sí | valores: ENTITY, DATASET, TENANT, SESSION | `@IsIn(CACHE_SCOPES)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1276` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "datasetId": "00000000-0000-4000-8000-000000000001",
  "entityId": "00000000-0000-4000-8000-000000000001",
  "entityVersion": "valor-ejemplo",
  "cacheScope": "ENTITY"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "datasetId": "00000000-0000-4000-8000-000000000001",
  "entityId": "00000000-0000-4000-8000-000000000001",
  "entityVersion": "valor-ejemplo",
  "cacheScope": "ENTITY"
}
```

</details>

### Respuesta — `Promise<CacheInvalidationResponseDto>` · DTO `CacheInvalidationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1287` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1293` |
| `duplicate` | `boolean` | Sí | — | — | Verdadero si esa versión y ámbito ya se habían encolado | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1301` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `UC-62-12`

---

## 10. POST /workers/deletion-requests/{id}/expand

- **Origen:** CONTRATO
- **Nombre:** Expandir la solicitud a objetivos por store
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreWorkerController.expandDeletion` — `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:109`

### Qué es y para qué sirve (negocio)

Expandir la solicitud a objetivos por store. Caso de uso UC-62-09: Expansión a objetivos. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/cross_store_consistency/README.md:67`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /workers/deletion-requests/{id}/expand` la atiende `CrossStoreWorkerController.expandDeletion` (src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:109). Exige sesión con alguno de los roles SYSTEM, DELETION_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `ExpandDeletionDto` (6 campos, 5 obligatorios). Delega en `DeletionService.expandDeletion`. Crea filas en cross_store_consistency.deletion_targets. Actualiza cross_store_consistency.deletion_requests. Lee cross_store_consistency.deletion_requests, cross_store_consistency.deletion_targets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, DELETION_WORKER, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:109` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:109` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.deletion_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | CrossStoreWorkerController.expandDeletion → DeletionService.expandDeletion | `src/modules/cross_store_consistency/services/deletion.service.ts:205` |
| `cross_store_consistency.deletion_requests` | LEE | LEE | DIRECTA | CrossStoreWorkerController.expandDeletion → DeletionService.expandDeletion → DeletionRepository.findRequestForUpdate | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:85` |
| `cross_store_consistency.deletion_targets` | ESCRIBE | CREA | DIRECTA | CrossStoreWorkerController.expandDeletion → DeletionService.expandDeletion → DeletionRepository.createTarget | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:169` |
| `cross_store_consistency.deletion_targets` | LEE | LEE | DIRECTA | CrossStoreWorkerController.expandDeletion → DeletionService.expandDeletion → DeletionRepository.findTarget | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:121` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ExpandDeletionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targets` | `array<DeletionTargetInputDto>` | Sí | mínimo 1 elemento(s); máximo 200 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_DELETION_TARGETS)` `@ValidateNested({ each: true })` `@Type(() => DeletionTargetInputDto)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:937` |
| `targets[].datasetId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:883` |
| `targets[].backendCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:891` |
| `targets[].targetLocator` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | Dónde está el dato dentro del store | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:902` |
| `targets[].deletionMode` | `string` | Sí | valores: HARD, CRYPTO_SHRED, ANONYMIZE | `@IsIn(DELETION_MODES)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:909` |
| `targets[].blockedByLegalHold` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si una retención legal impide borrarlo | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:920` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "targets": [
    {
      "datasetId": "00000000-0000-4000-8000-000000000001",
      "backendCode": "CODIGO_EJEMPLO",
      "targetLocator": "valor-ejemplo",
      "deletionMode": "HARD"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "targets": [
    {
      "datasetId": "00000000-0000-4000-8000-000000000001",
      "backendCode": "CODIGO_EJEMPLO",
      "targetLocator": "valor-ejemplo",
      "deletionMode": "HARD",
      "blockedByLegalHold": false
    }
  ]
}
```

</details>

### Respuesta — `Promise<ExpandDeletionResponseDto>` · DTO `ExpandDeletionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `deletionRequestId` | `string` | Sí | formato uuid | — | Identificador asociado a deletion request. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:948` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:954` |
| `targetsCreated` | `number` | Sí | — | — | Objetivos nuevos creados | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:960` |
| `targetsSkipped` | `number` | Sí | — | — | Objetivos que ya estaban declarados | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:966` |
| `blockedByLegalHold` | `number` | Sí | — | — | Objetivos bloqueados por retención legal | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:972` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud de borrado no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud ya no admite expansión. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `UC-62-09`

---

## 11. POST /workers/deletion-targets/{id}/executions

- **Origen:** CONTRATO
- **Nombre:** Ejecutar el borrado en el store destino
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreWorkerController.executeDeletion` — `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:150`

### Qué es y para qué sirve (negocio)

Ejecutar el borrado en el store destino. Caso de uso UC-62-10: Ejecución del borrado. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/cross_store_consistency/README.md:68`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /workers/deletion-targets/{id}/executions` la atiende `CrossStoreWorkerController.executeDeletion` (src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:150). Exige sesión con alguno de los roles SYSTEM, DELETION_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `ExecuteDeletionDto` (3 campos, 0 obligatorios). Delega en `DeletionService.executeDeletion`. Crea filas en cross_store_consistency.deletion_executions. Actualiza cross_store_consistency.deletion_executions, cross_store_consistency.deletion_targets. Lee cross_store_consistency.deletion_executions, cross_store_consistency.deletion_targets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, DELETION_WORKER, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:150` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:150` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.deletion_executions` | ESCRIBE | ACTUALIZA | POR_TIPO | CrossStoreWorkerController.executeDeletion → DeletionService.executeDeletion | `src/modules/cross_store_consistency/services/deletion.service.ts:347` |
| `cross_store_consistency.deletion_executions` | ESCRIBE | CREA | DIRECTA | CrossStoreWorkerController.executeDeletion → DeletionService.executeDeletion → DeletionRepository.createExecution | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:297` |
| `cross_store_consistency.deletion_executions` | LEE | LEE | DIRECTA | CrossStoreWorkerController.executeDeletion → DeletionService.executeDeletion → DeletionRepository.countExecutions | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:254` |
| `cross_store_consistency.deletion_targets` | ESCRIBE | ACTUALIZA | POR_TIPO | CrossStoreWorkerController.executeDeletion → DeletionService.executeDeletion | `src/modules/cross_store_consistency/services/deletion.service.ts:349` |
| `cross_store_consistency.deletion_targets` | LEE | LEE | DIRECTA | CrossStoreWorkerController.executeDeletion → DeletionService.executeDeletion → DeletionRepository.findTargetForUpdate | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:183` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ExecuteDeletionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `providerReceipt` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Acuse del proveedor; evidencia del borrado | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1055` |
| `succeeded` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Falso si el borrado en el proveedor falló | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1066` |
| `errorCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1075` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "providerReceipt": "valor-ejemplo",
  "succeeded": true,
  "errorCode": "CODIGO_EJEMPLO"
}
```

</details>

### Respuesta — `Promise<DeletionExecutionResponseDto>` · DTO `DeletionExecutionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1086` |
| `attemptNumber` | `number` | Sí | — | — | Valor de attempt number mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1092` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1098` |
| `targetState` | `string` | Sí | — | — | Estado en el que queda el objetivo | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1104` |
| `duplicate` | `boolean` | Sí | — | — | Verdadero si ese borrado ya se había ejecutado | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1112` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objetivo de borrado no encontrado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El objetivo está bloqueado por retención legal; no se borra.; PreconditionFailedException: El objetivo no está en un estado que admita ejecución. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `UC-62-10`

---

## 12. POST /workers/deletion-targets/{id}/verifications

- **Origen:** CONTRATO
- **Nombre:** Verificar la ausencia en el store
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreWorkerController.verifyDeletion` — `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:187`

### Qué es y para qué sirve (negocio)

Verificar la ausencia en el store. Caso de uso UC-62-11: Verificación y cierre. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/cross_store_consistency/README.md:69`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /workers/deletion-targets/{id}/verifications` la atiende `CrossStoreWorkerController.verifyDeletion` (src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:187). Exige sesión con alguno de los roles SYSTEM, DELETION_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `VerifyDeletionDto` (4 campos, 2 obligatorios). Delega en `DeletionService.verifyDeletion`. Crea filas en cross_store_consistency.deletion_verifications. Actualiza cross_store_consistency.deletion_targets. Lee cross_store_consistency.deletion_targets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, DELETION_WORKER, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:187` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:187` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.deletion_targets` | ESCRIBE | ACTUALIZA | POR_TIPO | CrossStoreWorkerController.verifyDeletion → DeletionService.verifyDeletion | `src/modules/cross_store_consistency/services/deletion.service.ts:409` |
| `cross_store_consistency.deletion_targets` | LEE | LEE | DIRECTA | CrossStoreWorkerController.verifyDeletion → DeletionService.verifyDeletion → DeletionRepository.findTargetForUpdate | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:183` |
| `cross_store_consistency.deletion_verifications` | ESCRIBE | CREA | DIRECTA | CrossStoreWorkerController.verifyDeletion → DeletionService.verifyDeletion → DeletionRepository.createVerification | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:331` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `VerifyDeletionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `verificationMethod` | `string` | Sí | valores: QUERY_ABSENCE, CHECKSUM, PROVIDER_RECEIPT | `@IsIn(VERIFICATION_METHODS)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1126` |
| `verifiedAbsent` | `boolean` | Sí | — | `@IsBoolean()` | Si el dato ya no está en el store | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1133` |
| `residualReferenceCount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Referencias residuales encontradas | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1146` |
| `evidenceObjectId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Evidencia guardada en el almacén de objetos | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1157` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "verificationMethod": "QUERY_ABSENCE",
  "verifiedAbsent": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "verificationMethod": "QUERY_ABSENCE",
  "verifiedAbsent": true,
  "residualReferenceCount": 0,
  "evidenceObjectId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VerificationResponseDto>` · DTO `VerificationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1168` |
| `targetState` | `string` | Sí | — | — | Valor de target state mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1174` |
| `requiresReexecution` | `boolean` | Sí | — | — | Verdadero si quedan referencias y hay que reintentar el borrado | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1183` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Objetivo de borrado no encontrado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El objetivo tiene que estar ejecutado para poder verificarse. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `UC-62-11`

---

## 13. GET /workers/deletion-targets/executed

- **Origen:** CONTRATO
- **Nombre:** Listar objetivos ejecutados pendientes de verificación
- **Bloque:** Datos y NoSQL
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreWorkerController.listExecutedDeletionTargets` — `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:175`

### Qué es y para qué sirve (negocio)

Listar objetivos ejecutados pendientes de verificación. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`GET /workers/deletion-targets/executed` la atiende `CrossStoreWorkerController.listExecutedDeletionTargets` (src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:175). Exige sesión con alguno de los roles SYSTEM, DELETION_WORKER, PLATFORM_ADMIN. Delega en `DeletionService.listExecutedTargets`. Lee cross_store_consistency.deletion_targets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, DELETION_WORKER, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:175` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.deletion_targets` | LEE | LEE | DIRECTA | CrossStoreWorkerController.listExecutedDeletionTargets → DeletionService.listExecutedTargets → DeletionRepository.findExecutedTargets | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:226` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ExecutedDeletionTargetsResponseDto>` · DTO `ExecutedDeletionTargetsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targets` | `array<DeletionTargetSummaryDto>` | Sí | — | — | Valor de targets mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1036` |
| `targets[].id` | `string` | Sí | formato uuid | — | Identificador único del objetivo. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:988` |
| `targets[].deletionRequestId` | `string` | Sí | formato uuid | — | Identificador asociado a deletion request. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:994` |
| `targets[].datasetId` | `string` | Sí | formato uuid | — | Identificador asociado a dataset. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1000` |
| `targets[].backendCode` | `string` | Sí | — | — | Valor de backend code mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1006` |
| `targets[].targetLocator` | `string` | Sí | — | — | Valor de target locator mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1012` |
| `targets[].deletionMode` | `string` | Sí | — | — | Valor de deletion mode mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1018` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `ctrl:CrossStoreWorkerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. GET /workers/deletion-targets/pending

- **Origen:** CONTRATO
- **Nombre:** Listar objetivos de borrado pendientes de ejecución
- **Bloque:** Datos y NoSQL
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreWorkerController.listPendingDeletionTargets` — `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:138`

### Qué es y para qué sirve (negocio)

Listar objetivos de borrado pendientes de ejecución. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`GET /workers/deletion-targets/pending` la atiende `CrossStoreWorkerController.listPendingDeletionTargets` (src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:138). Exige sesión con alguno de los roles SYSTEM, DELETION_WORKER, PLATFORM_ADMIN. Delega en `DeletionService.listPendingTargets`. Lee cross_store_consistency.deletion_targets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, DELETION_WORKER, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:138` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.deletion_targets` | LEE | LEE | DIRECTA | CrossStoreWorkerController.listPendingDeletionTargets → DeletionService.listPendingTargets → DeletionRepository.findPendingTargets | `src/modules/cross_store_consistency/repositories/deletion.repository.ts:211` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PendingDeletionTargetsResponseDto>` · DTO `PendingDeletionTargetsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targets` | `array<DeletionTargetSummaryDto>` | Sí | — | — | Valor de targets mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1027` |
| `targets[].id` | `string` | Sí | formato uuid | — | Identificador único del objetivo. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:988` |
| `targets[].deletionRequestId` | `string` | Sí | formato uuid | — | Identificador asociado a deletion request. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:994` |
| `targets[].datasetId` | `string` | Sí | formato uuid | — | Identificador asociado a dataset. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1000` |
| `targets[].backendCode` | `string` | Sí | — | — | Valor de backend code mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1006` |
| `targets[].targetLocator` | `string` | Sí | — | — | Valor de target locator mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1012` |
| `targets[].deletionMode` | `string` | Sí | — | — | Valor de deletion mode mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:1018` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `ctrl:CrossStoreWorkerController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /workers/projections/dead-letters

- **Origen:** CONTRATO
- **Nombre:** Mandar el intento fallido a la cola muerta
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreWorkerController.sendToDeadLetter` — `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:88`

### Qué es y para qué sirve (negocio)

Mandar el intento fallido a la cola muerta. Caso de uso UC-62-04: Cola muerta y reproceso. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/cross_store_consistency/README.md:62`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /workers/projections/dead-letters` la atiende `CrossStoreWorkerController.sendToDeadLetter` (src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:88). Exige sesión con alguno de los roles SYSTEM, PROJECTION_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `SendToDeadLetterDto` (3 campos, 2 obligatorios). Delega en `ProjectionDeliveryService.sendToDeadLetter`. Crea filas en cross_store_consistency.projection_dead_letters, messaging.domain_events, messaging.outbox_messages. Actualiza cross_store_consistency.projection_delivery_attempts. Lee cross_store_consistency.projection_dead_letters, cross_store_consistency.projection_delivery_attempts, cross_store_consistency.projection_subscriptions, messaging.outbox_messages. Publica ProjectionDeadLettered.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PROJECTION_WORKER, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:88` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.projection_dead_letters` | ESCRIBE | CREA | DIRECTA | CrossStoreWorkerController.sendToDeadLetter → ProjectionDeliveryService.sendToDeadLetter → ProjectionRepository.createDeadLetter | `src/modules/cross_store_consistency/repositories/projection.repository.ts:494` |
| `cross_store_consistency.projection_dead_letters` | LEE | LEE | DIRECTA | CrossStoreWorkerController.sendToDeadLetter → ProjectionDeliveryService.sendToDeadLetter → ProjectionRepository.findDeadLetterByAttempt | `src/modules/cross_store_consistency/repositories/projection.repository.ts:459` |
| `cross_store_consistency.projection_delivery_attempts` | ESCRIBE | ACTUALIZA | POR_TIPO | CrossStoreWorkerController.sendToDeadLetter → ProjectionDeliveryService.sendToDeadLetter | `src/modules/cross_store_consistency/services/projection-delivery.service.ts:362` |
| `cross_store_consistency.projection_delivery_attempts` | LEE | LEE | DIRECTA | CrossStoreWorkerController.sendToDeadLetter → ProjectionDeliveryService.sendToDeadLetter → ProjectionRepository.findAttemptForUpdate | `src/modules/cross_store_consistency/repositories/projection.repository.ts:382` |
| `cross_store_consistency.projection_subscriptions` | LEE | LEE | DIRECTA | CrossStoreWorkerController.sendToDeadLetter → ProjectionDeliveryService.sendToDeadLetter → ProjectionRepository.findSubscriptionById | `src/modules/cross_store_consistency/repositories/projection.repository.ts:165` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | CrossStoreWorkerController.sendToDeadLetter → ProjectionDeliveryService.sendToDeadLetter → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | CrossStoreWorkerController.sendToDeadLetter → ProjectionDeliveryService.sendToDeadLetter → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | CrossStoreWorkerController.sendToDeadLetter → ProjectionDeliveryService.sendToDeadLetter → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `ProjectionDeadLettered` | `src/modules/cross_store_consistency/services/projection-delivery.service.ts:374` |

### Cuerpo — DTO `SendToDeadLetterDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `projectionDeliveryAttemptId` | `string` | Sí | formato uuid | `@IsUUID()` | Intento fallido que se manda a la cola muerta | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:415` |
| `reasonCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:423` |
| `payloadObjectId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Payload preservado en el almacén de objetos | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:434` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "projectionDeliveryAttemptId": "00000000-0000-4000-8000-000000000001",
  "reasonCode": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "projectionDeliveryAttemptId": "00000000-0000-4000-8000-000000000001",
  "reasonCode": "CODIGO_EJEMPLO",
  "payloadObjectId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<DeadLetterResponseDto>` · DTO `DeadLetterResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:445` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:451` |
| `duplicate` | `boolean` | Sí | — | — | Verdadero si ese intento ya estaba en la cola muerta | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:459` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Intento de entrega no encontrado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La suscripción no tiene cola muerta habilitada. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `UC-62-04`

---

## 16. POST /workers/projections/deliveries/process

- **Origen:** CONTRATO
- **Nombre:** Registrar la entrega y avanzar el checkpoint
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrossStoreWorkerController.processDelivery` — `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:67`

### Qué es y para qué sirve (negocio)

Registrar la entrega y avanzar el checkpoint. Caso de uso UC-62-02: Entrega idempotente. Dentro del módulo (descripción del modelo, en inglés): «Guarantees that derived NoSQL/search/cache/vector/object projections can be rebuilt, reconciled, repaired and deleted without dual-write inconsistency.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/cross_store_consistency/README.md:60`) · MODELO (`Mantra Core Health Context/modules/diagram_62_cross_store_consistency.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /workers/projections/deliveries/process` la atiende `CrossStoreWorkerController.processDelivery` (src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:67). Exige sesión con alguno de los roles SYSTEM, PROJECTION_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `ProcessDeliveryDto` (9 campos, 6 obligatorios). Delega en `ProjectionDeliveryService.processDelivery`. Crea filas en cross_store_consistency.projection_checkpoints, cross_store_consistency.projection_consumers, cross_store_consistency.projection_delivery_attempts. Actualiza cross_store_consistency.projection_checkpoints, cross_store_consistency.projection_consumers, cross_store_consistency.projection_delivery_attempts. Lee cross_store_consistency.projection_checkpoints, cross_store_consistency.projection_consumers, cross_store_consistency.projection_delivery_attempts, cross_store_consistency.projection_subscriptions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PROJECTION_WORKER, PLATFORM_ADMIN | `src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `cross_store_consistency.projection_checkpoints` | ESCRIBE | ACTUALIZA | POR_TIPO | CrossStoreWorkerController.processDelivery → ProjectionDeliveryService.processDelivery → ProjectionDeliveryService.advanceCheckpoint | `src/modules/cross_store_consistency/services/projection-delivery.service.ts:517` |
| `cross_store_consistency.projection_checkpoints` | ESCRIBE | CREA | DIRECTA | CrossStoreWorkerController.processDelivery → ProjectionDeliveryService.processDelivery → ProjectionDeliveryService.advanceCheckpoint → ProjectionRepository.createCheckpoint | `src/modules/cross_store_consistency/repositories/projection.repository.ts:445` |
| `cross_store_consistency.projection_checkpoints` | LEE | LEE | DIRECTA | CrossStoreWorkerController.processDelivery → ProjectionDeliveryService.processDelivery → ProjectionDeliveryService.advanceCheckpoint → ProjectionRepository.findCheckpointForUpdate | `src/modules/cross_store_consistency/repositories/projection.repository.ts:402` |
| `cross_store_consistency.projection_consumers` | ESCRIBE | ACTUALIZA | POR_TIPO | CrossStoreWorkerController.processDelivery → ProjectionDeliveryService.processDelivery → ProjectionDeliveryService.touchConsumer | `src/modules/cross_store_consistency/services/projection-delivery.service.ts:539` |
| `cross_store_consistency.projection_consumers` | ESCRIBE | CREA | DIRECTA | CrossStoreWorkerController.processDelivery → ProjectionDeliveryService.processDelivery → ProjectionDeliveryService.touchConsumer → ProjectionRepository.createConsumer | `src/modules/cross_store_consistency/repositories/projection.repository.ts:285` |
| `cross_store_consistency.projection_consumers` | LEE | LEE | DIRECTA | CrossStoreWorkerController.processDelivery → ProjectionDeliveryService.processDelivery → ProjectionDeliveryService.touchConsumer → ProjectionRepository.findConsumerByCodeForUpdate | `src/modules/cross_store_consistency/repositories/projection.repository.ts:246` |
| `cross_store_consistency.projection_delivery_attempts` | ESCRIBE | ACTUALIZA | POR_TIPO | CrossStoreWorkerController.processDelivery → ProjectionDeliveryService.processDelivery | `src/modules/cross_store_consistency/services/projection-delivery.service.ts:264` |
| `cross_store_consistency.projection_delivery_attempts` | ESCRIBE | CREA | DIRECTA | CrossStoreWorkerController.processDelivery → ProjectionDeliveryService.processDelivery → ProjectionRepository.createAttempt | `src/modules/cross_store_consistency/repositories/projection.repository.ts:366` |
| `cross_store_consistency.projection_delivery_attempts` | LEE | LEE | DIRECTA | CrossStoreWorkerController.processDelivery → ProjectionDeliveryService.processDelivery → ProjectionRepository.findAttemptByIdempotencyKey | `src/modules/cross_store_consistency/repositories/projection.repository.ts:304` |
| `cross_store_consistency.projection_subscriptions` | LEE | LEE | DIRECTA | CrossStoreWorkerController.processDelivery → ProjectionDeliveryService.processDelivery → ProjectionRepository.findSubscriptionById | `src/modules/cross_store_consistency/repositories/projection.repository.ts:165` |

### Cuerpo — DTO `ProcessDeliveryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `projectionSubscriptionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:266` |
| `outboxEventId` | `string` | Sí | formato uuid | `@IsUUID()` | Evento del outbox que se proyecta | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:276` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:283` |
| `payloadHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash del payload; parte de la identidad del intento | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:294` |
| `partitionKey` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Clave de partición del checkpoint | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:305` |
| `sourcePosition` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Posición en la fuente; cadena por ser bigint. Monótona creciente. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:315` |
| `targetVersion` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Versión escrita en el destino | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:327` |
| `durableWriteConfirmed` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Falso si la escritura en el destino falló; el intento queda FAILED | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:339` |
| `errorCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código de error si falló | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:351` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "projectionSubscriptionId": "00000000-0000-4000-8000-000000000001",
  "outboxEventId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "payloadHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "partitionKey": "valor-ejemplo",
  "sourcePosition": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "projectionSubscriptionId": "00000000-0000-4000-8000-000000000001",
  "outboxEventId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "payloadHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "partitionKey": "valor-ejemplo",
  "sourcePosition": "valor-ejemplo",
  "targetVersion": "valor-ejemplo",
  "durableWriteConfirmed": true,
  "errorCode": "CODIGO_EJEMPLO"
}
```

</details>

### Respuesta — `Promise<DeliveryResponseDto>` · DTO `DeliveryResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:362` |
| `attemptNumber` | `number` | Sí | — | — | Valor de attempt number mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:368` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:374` |
| `duplicate` | `boolean` | Sí | — | — | Verdadero si el evento ya se había aplicado con esa clave | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:382` |
| `checkpointAdvanced` | `boolean` | Sí | — | — | Verdadero si el checkpoint avanzó con esta entrega | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:390` |
| `sourcePosition` | `string` | No | — | — | Posición del checkpoint tras la entrega | `src/modules/cross_store_consistency/dto/cross-store.dto.ts:398` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Suscripción de proyección no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La suscripción no está activa. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/cross_store_consistency.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 62 — Consistencia cross-store — etapa `UC-62-02`

---

