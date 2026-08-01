<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `cross_store_consistency`

Referencia exhaustiva de 16 operación(es) del módulo `cross_store_consistency`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `cross_store_consistency`
- **Controladores:** `CrossStoreAdminController`, `CrossStoreWorkerController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /admin/archive-jobs](#1-post-admin-archive-jobs) — Archivar por retención y purgar la copia caliente
2. [POST /admin/data-movement-jobs](#2-post-admin-data-movement-jobs) — Mover datos entre zonas de almacenamiento
3. [POST /admin/deletion-requests](#3-post-admin-deletion-requests) — Solicitar el borrado de un sujeto
4. [PATCH /admin/deletion-requests/{id}](#4-patch-admin-deletion-requests-id) — Cerrar la solicitud de borrado
5. [POST /admin/projections/dead-letters/{id}/replay](#5-post-admin-projections-dead-letters-id-replay) — Reprocesar una entrega de la cola muerta
6. [POST /admin/projections/definitions](#6-post-admin-projections-definitions) — Registrar la definición de proyección con sus suscripciones y su SLO
7. [POST /admin/projections/drift/{id}/repair-jobs](#7-post-admin-projections-drift-id-repair-jobs) — Encolar la reparación de una deriva
8. [POST /admin/reconciliation/runs](#8-post-admin-reconciliation-runs) — Registrar la corrida de reconciliación y abrir las derivas
9. [POST /workers/cache/invalidations](#9-post-workers-cache-invalidations) — Encolar la invalidación de caché
10. [POST /workers/deletion-requests/{id}/expand](#10-post-workers-deletion-requests-id-expand) — Expandir la solicitud a objetivos por store
11. [POST /workers/deletion-targets/{id}/executions](#11-post-workers-deletion-targets-id-executions) — Ejecutar el borrado en el store destino
12. [POST /workers/deletion-targets/{id}/verifications](#12-post-workers-deletion-targets-id-verifications) — Verificar la ausencia en el store
13. [GET /workers/deletion-targets/executed](#13-get-workers-deletion-targets-executed) — Listar objetivos ejecutados pendientes de verificación
14. [GET /workers/deletion-targets/pending](#14-get-workers-deletion-targets-pending) — Listar objetivos de borrado pendientes de ejecución
15. [POST /workers/projections/dead-letters](#15-post-workers-projections-dead-letters) — Mandar el intento fallido a la cola muerta
16. [POST /workers/projections/deliveries/process](#16-post-workers-projections-deliveries-process) — Registrar la entrega y avanzar el checkpoint

---

## 1. POST /admin/archive-jobs

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Archivar por retención y purgar la copia caliente
- **Operation ID:** `CrossStoreAdminController_archiveData`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreAdminController.archiveData](../../src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts)

### Descripción de negocio

La copia caliente sólo se purga si el manifiesto del archivo frío está confirmado.


### Descripción del sistema

NestJS resuelve `POST /admin/archive-jobs` en `CrossStoreAdminController_archiveData`. El controlador delega en `StorageMaintenanceService.archiveData`. Valida el body como `ArchiveDataDto` y consume `application/json`. El tipo de retorno estático es `Promise<ArchiveJobResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ArchiveDataDto`; los campos opcionales se omiten.

```http
POST /admin/archive-jobs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "datasetId": "00000000-0000-4000-8000-000000000001",
  "retentionCutoff": "2026-07-31T12:00:00.000Z",
  "archivedCount": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `DATA_GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `datasetId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `retentionCutoff` | Sí | `string` | formato `date-time` | Se archiva lo anterior a este corte | `2026-07-31T12:00:00.000Z` |
| `archiveManifestObjectId` | No | `string` | formato `uuid` | Manifiesto en el almacén frío. Sin él no se purga la copia caliente. | `00000000-0000-4000-8000-000000000001` |
| `archivedCount` | Sí | `string` | Sin restricción adicional declarada | Filas archivadas; cadena por ser bigint | `valor-ejemplo` |
| `deletedHotCount` | No | `string` | Sin restricción adicional declarada | Filas purgadas de la copia caliente; cadena por ser bigint | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/archive-jobs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "datasetId": "00000000-0000-4000-8000-000000000001",
  "retentionCutoff": "2026-07-31T12:00:00.000Z",
  "archiveManifestObjectId": "00000000-0000-4000-8000-000000000001",
  "archivedCount": "valor-ejemplo",
  "deletedHotCount": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ArchiveJobResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ArchiveJobResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "objectManifestId": "00000000-0000-4000-8000-000000000001",
  "recordCount": "valor-ejemplo",
  "lifecycleState": "valor-ejemplo",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `objectManifestId` | Sí | `string` | formato `uuid` | Identificador asociado a object manifest. | `00000000-0000-4000-8000-000000000001` |
| `recordCount` | Sí | `string` | Sin restricción adicional declarada | Versiones movidas a frío; cadena por ser bigint | `valor-ejemplo` |
| `lifecycleState` | Sí | `string` | Sin restricción adicional declarada | Ciclo de vida en el que queda el objeto | `valor-ejemplo` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si ese lote ya se había archivado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El corte de retención tiene que estar en el pasado. | Excepción explícita en src/modules/cross_store_consistency/services/storage-maintenance.service.ts |
| 422 | `PRECONDITION_FAILED` | No se purga la copia caliente sin el manifiesto del archivo frío confirmado. | Excepción explícita en src/modules/cross_store_consistency/services/storage-maintenance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/archive-jobs"
}
```

---

## 2. POST /admin/data-movement-jobs

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Mover datos entre zonas de almacenamiento
- **Operation ID:** `CrossStoreAdminController_moveData`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreAdminController.moveData](../../src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts)

### Descripción de negocio

Idempotente por la huella del lote; encola siempre la invalidación de caché.


### Descripción del sistema

NestJS resuelve `POST /admin/data-movement-jobs` en `CrossStoreAdminController_moveData`. El controlador delega en `StorageMaintenanceService.moveData`. Valida el body como `MoveDataDto` y consume `application/json`. El tipo de retorno estático es `Promise<MovementJobResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `MoveDataDto`; los campos opcionales se omiten.

```http
POST /admin/data-movement-jobs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "datasetId": "00000000-0000-4000-8000-000000000001",
  "sourcePlacementId": "00000000-0000-4000-8000-000000000001",
  "targetPlacementId": "00000000-0000-4000-8000-000000000001",
  "movementMode": "COPY",
  "manifestHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `datasetId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sourcePlacementId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `targetPlacementId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `movementMode` | Sí | `string` | valores: `COPY`, `MOVE` | Sin descripción específica en el contrato OpenAPI. | `COPY` |
| `manifestHash` | Sí | `string` | longitud máxima 200 | Huella del lote movido; garantiza idempotencia | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `collectionDefinitionId` | No | `string` | formato `uuid` | Colección cuyo esquema cambia en el destino | `00000000-0000-4000-8000-000000000001` |
| `fromSchemaVersion` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `toSchemaVersion` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `migrationStrategy` | No | `string` | valores: `IN_PLACE`, `DUAL_WRITE`, `BACKFILL` | Sin descripción específica en el contrato OpenAPI. | `IN_PLACE` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/data-movement-jobs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MovementJobResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MovementJobResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MovementJobResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MovementJobResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MovementJobResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MovementJobResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MovementJobResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MovementJobResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MovementJobResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MovementJobResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "schemaMigrationJobId": "00000000-0000-4000-8000-000000000001",
  "cacheInvalidationJobId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `schemaMigrationJobId` | No | `string` | formato `uuid` | Migración de esquema encolada, si procede | `00000000-0000-4000-8000-000000000001` |
| `cacheInvalidationJobId` | No | `string` | formato `uuid` | Invalidación de caché encolada | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si ese lote ya se había movido | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El emplazamiento de origen y el de destino no pueden ser el mismo. | Excepción explícita en src/modules/cross_store_consistency/services/storage-maintenance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/data-movement-jobs"
}
```

---

## 3. POST /admin/deletion-requests

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Solicitar el borrado de un sujeto
- **Operation ID:** `CrossStoreAdminController_requestDeletion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreAdminController.requestDeletion](../../src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts)

### Descripción de negocio

Exige base legal. Una sola solicitud viva por sujeto; el plazo se fija al crearla.


### Descripción del sistema

NestJS resuelve `POST /admin/deletion-requests` en `CrossStoreAdminController_requestDeletion`. El controlador delega en `DeletionService.requestDeletion`. Valida el body como `CrossStoreConsistencyRequestDeletionDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeletionRequestResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CrossStoreConsistencyRequestDeletionDto`; los campos opcionales se omiten.

```http
POST /admin/deletion-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "subjectType": "valor-ejemplo",
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "reasonCode": "CODIGO_EJEMPLO",
  "legalBasisCode": "CODIGO_EJEMPLO"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRIVACY_OFFICER`, `DPO`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `subjectType` | Sí | `string` | longitud máxima 100 | Qué clase de sujeto se borra | `valor-ejemplo` |
| `subjectId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reasonCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `legalBasisCode` | Sí | `string` | longitud máxima 100 | Base legal del borrado; sin ella no se acepta | `CODIGO_EJEMPLO` |
| `slaDays` | No | `number` | mínimo 1; máximo 365 | Días de plazo para cumplirlo; por omisión, 30 | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/deletion-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "subjectType": "valor-ejemplo",
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "reasonCode": "CODIGO_EJEMPLO",
  "legalBasisCode": "CODIGO_EJEMPLO",
  "slaDays": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DeletionRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeletionRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeletionRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeletionRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeletionRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeletionRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeletionRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeletionRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeletionRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeletionRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "state": "valor-ejemplo",
  "dueAt": "2026-07-31T12:00:00.000Z",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |
| `dueAt` | Sí | `string` | formato `date-time` | Fecha límite de cumplimiento | `2026-07-31T12:00:00.000Z` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si ya había una solicitud viva para el sujeto | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRIVACY_OFFICER, DPO, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/deletion-requests"
}
```

---

## 4. PATCH /admin/deletion-requests/{id}

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Cerrar la solicitud de borrado
- **Operation ID:** `CrossStoreAdminController_closeDeletionRequest`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreAdminController.closeDeletionRequest](../../src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts)

### Descripción de negocio

Sólo si todo objetivo está verificado ausente o bloqueado por retención legal. Todo bloqueado cierra como BLOCKED, no COMPLETED.

Contexto declarado en el controlador: UC-62-11 (cierre).

### Descripción del sistema

NestJS resuelve `PATCH /admin/deletion-requests/{id}` en `CrossStoreAdminController_closeDeletionRequest`. El controlador delega en `DeletionService.closeDeletionRequest`. Valida el body como `CloseDeletionRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<CloseDeletionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CloseDeletionRequestDto`; los campos opcionales se omiten.

```http
PATCH /admin/deletion-requests/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRIVACY_OFFICER`, `DPO`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `note` | No | `string` | longitud máxima 1000 | Nota de cierre; queda en el evento | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /admin/deletion-requests/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "note": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CloseDeletionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CloseDeletionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CloseDeletionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CloseDeletionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CloseDeletionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CloseDeletionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CloseDeletionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CloseDeletionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CloseDeletionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CloseDeletionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CloseDeletionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "state": "valor-ejemplo",
  "verifiedTargets": 1,
  "blockedTargets": 1,
  "pendingTargets": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |
| `verifiedTargets` | Sí | `number` | Sin restricción adicional declarada | Objetivos verificados ausentes | `1` |
| `blockedTargets` | Sí | `number` | Sin restricción adicional declarada | Objetivos bloqueados por retención legal | `1` |
| `pendingTargets` | Sí | `number` | Sin restricción adicional declarada | Objetivos que todavía no están verificados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRIVACY_OFFICER, DPO, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud de borrado no encontrada. | Excepción explícita en src/modules/cross_store_consistency/services/deletion.service.ts |
| 409 | `CONFLICT` | La solicitud ya está cerrada. | Excepción explícita en src/modules/cross_store_consistency/services/deletion.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La solicitud no tiene objetivos; expándela antes de cerrarla. | Excepción explícita en src/modules/cross_store_consistency/services/deletion.service.ts |
| 422 | `PRECONDITION_FAILED` | Quedan objetivos sin verificar; el borrado no está completo. | Excepción explícita en src/modules/cross_store_consistency/services/deletion.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/deletion-requests/{id}"
}
```

---

## 5. POST /admin/projections/dead-letters/{id}/replay

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Reprocesar una entrega de la cola muerta
- **Operation ID:** `CrossStoreAdminController_replayDeadLetter`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreAdminController.replayDeadLetter](../../src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts)

### Descripción de negocio

Conserva la clave de idempotencia del intento original: reprocesar no duplica.

Contexto declarado en el controlador: UC-62-04 (reproceso).

### Descripción del sistema

NestJS resuelve `POST /admin/projections/dead-letters/{id}/replay` en `CrossStoreAdminController_replayDeadLetter`. El controlador delega en `ProjectionDeliveryService.replayDeadLetter`. Valida el body como `ReplayDeadLetterDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReplayResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReplayDeadLetterDto`; los campos opcionales se omiten.

```http
POST /admin/projections/dead-letters/00000000-0000-4000-8000-000000000001/replay HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `payloadHash` | No | `string` | longitud máxima 200 | Hash del payload reprocesado | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/projections/dead-letters/00000000-0000-4000-8000-000000000001/replay HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "payloadHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReplayResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReplayResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReplayResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReplayResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReplayResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReplayResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReplayResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReplayResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReplayResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReplayResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReplayResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "attemptId": "00000000-0000-4000-8000-000000000001",
  "attemptNumber": 1,
  "idempotencyKey": "valor-ejemplo",
  "deadLetterState": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `attemptId` | Sí | `string` | formato `uuid` | Intento nuevo creado para el reproceso | `00000000-0000-4000-8000-000000000001` |
| `attemptNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de attempt number mantenido por la instancia. | `1` |
| `idempotencyKey` | Sí | `string` | Sin restricción adicional declarada | Clave de idempotencia conservada del intento original | `valor-ejemplo` |
| `deadLetterState` | Sí | `string` | Sin restricción adicional declarada | Valor de dead letter state mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Entrada de cola muerta no encontrada. | Excepción explícita en src/modules/cross_store_consistency/services/projection-delivery.service.ts |
| 404 | `NOT_FOUND` | Intento original no encontrado. | Excepción explícita en src/modules/cross_store_consistency/services/projection-delivery.service.ts |
| 409 | `CONFLICT` | La entrada de cola muerta ya no está abierta. | Excepción explícita en src/modules/cross_store_consistency/services/projection-delivery.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/projections/dead-letters/{id}/replay"
}
```

---

## 6. POST /admin/projections/definitions

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Registrar la definición de proyección con sus suscripciones y su SLO
- **Operation ID:** `CrossStoreAdminController_registerProjection`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreAdminController.registerProjection](../../src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts)

### Descripción de negocio

Origen y destino no pueden ser el mismo dataset: eso sería un bucle, no una proyección.


### Descripción del sistema

NestJS resuelve `POST /admin/projections/definitions` en `CrossStoreAdminController_registerProjection`. El controlador delega en `ProjectionDeliveryService.registerProjection`. Valida el body como `RegisterProjectionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ProjectionDefinitionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterProjectionDto`; los campos opcionales se omiten.

```http
POST /admin/projections/definitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sourceDatasetId` | Sí | `string` | formato `uuid` | Dataset canónico del que se proyecta | `00000000-0000-4000-8000-000000000001` |
| `targetDatasetId` | Sí | `string` | formato `uuid` | Dataset destino en el store secundario | `00000000-0000-4000-8000-000000000001` |
| `projectionVersion` | Sí | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `deliverySemantics` | No | `string` | valores: `AT_LEAST_ONCE`, `AT_MOST_ONCE`, `EXACTLY_ONCE` | Sin descripción específica en el contrato OpenAPI. | `AT_LEAST_ONCE` |
| `transformationRef` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `subscriptions` | Sí | `array<SubscriptionInputDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"sourceEventType":"valor-ejemplo","consumerCode":"CODIGO_EJEMPLO","targetBackendCode":"CODIGO_EJEMPLO","concurrencyLimit":1,"retryPolicyJson":{},"deadLetterEnabled":true}]` |
| `subscriptions[].sourceEventType` | Sí | `string` | longitud máxima 200 | Tipo de evento del outbox que suscribe | `valor-ejemplo` |
| `subscriptions[].consumerCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `subscriptions[].targetBackendCode` | Sí | `string` | longitud máxima 100 | Store destino al que proyecta | `CODIGO_EJEMPLO` |
| `subscriptions[].concurrencyLimit` | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `subscriptions[].retryPolicyJson` | No | `object` | Sin restricción adicional declarada | Política de reintento del consumidor | `{}` |
| `subscriptions[].deadLetterEnabled` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `slo` | No | `ConsistencySloInputDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"maxProjectionLagSeconds":1,"maxDriftRate":"valor-ejemplo","reconciliationIntervalMinutes":1,"alertPolicyCode":"CODIGO_EJEMPLO"}` |
| `slo.maxProjectionLagSeconds` | No | `number` | mínimo 0 | Retraso máximo tolerado de la proyección | `1` |
| `slo.maxDriftRate` | No | `string` | Sin restricción adicional declarada | Tasa máxima de deriva; cadena por ser numeric | `valor-ejemplo` |
| `slo.reconciliationIntervalMinutes` | No | `number` | mínimo 1 | Cada cuánto se reconcilia | `1` |
| `slo.alertPolicyCode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/projections/definitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ProjectionDefinitionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ProjectionDefinitionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ProjectionDefinitionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ProjectionDefinitionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ProjectionDefinitionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ProjectionDefinitionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ProjectionDefinitionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ProjectionDefinitionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ProjectionDefinitionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProjectionDefinitionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "projectionVersion": "valor-ejemplo",
  "state": "valor-ejemplo",
  "subscriptionIds": [
    "valor-ejemplo"
  ],
  "sloId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `projectionVersion` | Sí | `string` | Sin restricción adicional declarada | Valor de projection version mantenido por la instancia. | `valor-ejemplo` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |
| `subscriptionIds` | Sí | `array<string>` | formato `uuid` | Valor de subscription ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `sloId` | No | `string` | formato `uuid` | Identificador asociado a slo. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe esa versión de la definición de proyección. | Excepción explícita en src/modules/cross_store_consistency/services/projection-delivery.service.ts |
| 409 | `CONFLICT` | Dos suscripciones comparten el mismo tipo de evento y consumidor. | Excepción explícita en src/modules/cross_store_consistency/services/projection-delivery.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El dataset de origen y el de destino no pueden ser el mismo. | Excepción explícita en src/modules/cross_store_consistency/services/projection-delivery.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/projections/definitions"
}
```

---

## 7. POST /admin/projections/drift/{id}/repair-jobs

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Encolar la reparación de una deriva
- **Operation ID:** `CrossStoreAdminController_repairDrift`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreAdminController.repairDrift](../../src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts)

### Descripción de negocio

Recomputa desde el canónico. `DELETE_ORPHAN` sólo repara una deriva de tipo EXTRA.


### Descripción del sistema

NestJS resuelve `POST /admin/projections/drift/{id}/repair-jobs` en `CrossStoreAdminController_repairDrift`. El controlador delega en `ReconciliationService.repairDrift`. Valida el body como `RepairDriftDto` y consume `application/json`. El tipo de retorno estático es `Promise<RepairJobResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RepairDriftDto`; los campos opcionales se omiten.

```http
POST /admin/projections/drift/00000000-0000-4000-8000-000000000001/repair-jobs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "repairAction": "REPROJECT"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_GOVERNANCE_ADMIN`, `SYSTEM`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `repairAction` | Sí | `string` | valores: `REPROJECT`, `REINDEX`, `DELETE_ORPHAN` | Sin descripción específica en el contrato OpenAPI. | `REPROJECT` |
| `sourceAlias` | No | `string` | longitud máxima 200 | Alias de origen para el reindexado | `valor-ejemplo` |
| `targetIndex` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `targetSchemaVersion` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/projections/drift/00000000-0000-4000-8000-000000000001/repair-jobs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "repairAction": "REPROJECT",
  "sourceAlias": "valor-ejemplo",
  "targetIndex": "valor-ejemplo",
  "targetSchemaVersion": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RepairJobResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RepairJobResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RepairJobResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RepairJobResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RepairJobResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RepairJobResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RepairJobResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RepairJobResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RepairJobResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RepairJobResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RepairJobResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "repairAction": "valor-ejemplo",
  "status": "ok",
  "projectionDriftEventId": "00000000-0000-4000-8000-000000000001",
  "reindexJobId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `repairAction` | Sí | `string` | Sin restricción adicional declarada | Valor de repair action mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `projectionDriftEventId` | Sí | `string` | formato `uuid` | Identificador asociado a projection drift event. | `00000000-0000-4000-8000-000000000001` |
| `reindexJobId` | No | `string` | formato `uuid` | Job de reindexado creado, si procede | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si esa deriva ya tenía reparación | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_GOVERNANCE_ADMIN, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/projections/drift/{id}/repair-jobs"
}
```

---

## 8. POST /admin/reconciliation/runs

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Registrar la corrida de reconciliación y abrir las derivas
- **Operation ID:** `CrossStoreAdminController_runReconciliation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreAdminController.runReconciliation](../../src/modules/cross_store_consistency/controllers/cross-store-admin.controller.ts)

### Descripción de negocio

Compara el canónico contra la proyección. Deduplica las derivas mientras siga abierta la anterior.

Contexto declarado en el controlador: UC-62-05 + UC-62-06.

### Descripción del sistema

NestJS resuelve `POST /admin/reconciliation/runs` en `CrossStoreAdminController_runReconciliation`. El controlador delega en `ReconciliationService.runReconciliation`. Valida el body como `RunReconciliationDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReconciliationResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunReconciliationDto`; los campos opcionales se omiten.

```http
POST /admin/reconciliation/runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `RECONCILIATION_WORKER`, `DATA_GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `datasetId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sourceBackendCode` | Sí | `string` | longitud máxima 100 | Store canónico; siempre PostgreSQL | `CODIGO_EJEMPLO` |
| `targetBackendCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `reconciliationScopeJson` | No | `object` | Sin restricción adicional declarada | Qué abarca la corrida | `{}` |
| `items` | Sí | `array<ReconciliationItemDto>` | mínimo 1 elemento(s); máximo 5000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"canonicalEntityId":"00000000-0000-4000-8000-000000000001","canonicalVersion":"valor-ejemplo","targetDocumentId":"00000000-0000-4000-8000-000000000001","targetVersion":"valor-ejemplo","canonicalHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","targetHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","result":"MATCH"}]` |
| `items[].canonicalEntityId` | Sí | `string` | formato `uuid` | Entidad canónica comparada | `00000000-0000-4000-8000-000000000001` |
| `items[].canonicalVersion` | No | `string` | Sin restricción adicional declarada | Versión canónica; cadena por ser bigint | `valor-ejemplo` |
| `items[].targetDocumentId` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].targetVersion` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].canonicalHash` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `items[].targetHash` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `items[].result` | Sí | `string` | valores: `MATCH`, `DIVERGENT`, `MISSING`, `EXTRA` | Sin descripción específica en el contrato OpenAPI. | `MATCH` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/reconciliation/runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReconciliationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "missingCount": 1,
  "orphanCount": 1,
  "mismatchedCount": 1,
  "repairJobId": "00000000-0000-4000-8000-000000000001",
  "purgeJobId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `missingCount` | Sí | `number` | Sin restricción adicional declarada | Documentos que la fuente tiene y el vector no | `1` |
| `orphanCount` | Sí | `number` | Sin restricción adicional declarada | Documentos que el vector tiene y la fuente ya no | `1` |
| `mismatchedCount` | Sí | `number` | Sin restricción adicional declarada | Documentos presentes en ambos con contenido distinto | `1` |
| `repairJobId` | No | `string` | formato `uuid` | Job encolado para reparar lo que falta | `00000000-0000-4000-8000-000000000001` |
| `purgeJobId` | No | `string` | formato `uuid` | Job encolado para purgar los huérfanos | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, RECONCILIATION_WORKER, DATA_GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/reconciliation/runs"
}
```

---

## 9. POST /workers/cache/invalidations

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Encolar la invalidación de caché
- **Operation ID:** `CrossStoreWorkerController_invalidateCache`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreWorkerController.invalidateCache](../../src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts)

### Descripción de negocio

La clave incluye la versión de la entidad: una versión nueva sí encola otra purga.


### Descripción del sistema

NestJS resuelve `POST /workers/cache/invalidations` en `CrossStoreWorkerController_invalidateCache`. El controlador delega en `StorageMaintenanceService.invalidateCache`. Valida el body como `CrossStoreConsistencyInvalidateCacheDto` y consume `application/json`. El tipo de retorno estático es `Promise<CacheInvalidationResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CrossStoreConsistencyInvalidateCacheDto`; los campos opcionales se omiten.

```http
POST /workers/cache/invalidations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "datasetId": "00000000-0000-4000-8000-000000000001",
  "entityId": "00000000-0000-4000-8000-000000000001",
  "entityVersion": "valor-ejemplo",
  "cacheScope": "ENTITY"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MAINTENANCE_WORKER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `datasetId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `entityId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `entityVersion` | Sí | `string` | Sin restricción adicional declarada | Versión de la entidad; cadena por ser bigint | `valor-ejemplo` |
| `cacheScope` | Sí | `string` | valores: `ENTITY`, `DATASET`, `TENANT`, `SESSION` | Sin descripción específica en el contrato OpenAPI. | `ENTITY` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workers/cache/invalidations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "datasetId": "00000000-0000-4000-8000-000000000001",
  "entityId": "00000000-0000-4000-8000-000000000001",
  "entityVersion": "valor-ejemplo",
  "cacheScope": "ENTITY"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CacheInvalidationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CacheInvalidationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CacheInvalidationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CacheInvalidationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CacheInvalidationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CacheInvalidationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CacheInvalidationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CacheInvalidationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CacheInvalidationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CacheInvalidationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si esa versión y ámbito ya se habían encolado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MAINTENANCE_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workers/cache/invalidations"
}
```

---

## 10. POST /workers/deletion-requests/{id}/expand

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Expandir la solicitud a objetivos por store
- **Operation ID:** `CrossStoreWorkerController_expandDeletion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreWorkerController.expandDeletion](../../src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts)

### Descripción de negocio

Un objetivo con retención legal se registra igualmente y nace BLOCKED: dejarlo fuera haría creer que no existe.


### Descripción del sistema

NestJS resuelve `POST /workers/deletion-requests/{id}/expand` en `CrossStoreWorkerController_expandDeletion`. El controlador delega en `DeletionService.expandDeletion`. Valida el body como `ExpandDeletionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExpandDeletionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ExpandDeletionDto`; los campos opcionales se omiten.

```http
POST /workers/deletion-requests/00000000-0000-4000-8000-000000000001/expand HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `DELETION_WORKER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `targets` | Sí | `array<DeletionTargetInputDto>` | mínimo 1 elemento(s); máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"datasetId":"00000000-0000-4000-8000-000000000001","backendCode":"CODIGO_EJEMPLO","targetLocator":"valor-ejemplo","deletionMode":"HARD","blockedByLegalHold":false}]` |
| `targets[].datasetId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `targets[].backendCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `targets[].targetLocator` | Sí | `string` | longitud máxima 500 | Dónde está el dato dentro del store | `valor-ejemplo` |
| `targets[].deletionMode` | Sí | `string` | valores: `HARD`, `CRYPTO_SHRED`, `ANONYMIZE` | Sin descripción específica en el contrato OpenAPI. | `HARD` |
| `targets[].blockedByLegalHold` | No | `boolean` | Sin restricción adicional declarada | Si una retención legal impide borrarlo | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workers/deletion-requests/00000000-0000-4000-8000-000000000001/expand HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ExpandDeletionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExpandDeletionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExpandDeletionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExpandDeletionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExpandDeletionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExpandDeletionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExpandDeletionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExpandDeletionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExpandDeletionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExpandDeletionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExpandDeletionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "deletionRequestId": "00000000-0000-4000-8000-000000000001",
  "state": "valor-ejemplo",
  "targetsCreated": 1,
  "targetsSkipped": 1,
  "blockedByLegalHold": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `deletionRequestId` | Sí | `string` | formato `uuid` | Identificador asociado a deletion request. | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |
| `targetsCreated` | Sí | `number` | Sin restricción adicional declarada | Objetivos nuevos creados | `1` |
| `targetsSkipped` | Sí | `number` | Sin restricción adicional declarada | Objetivos que ya estaban declarados | `1` |
| `blockedByLegalHold` | Sí | `number` | Sin restricción adicional declarada | Objetivos bloqueados por retención legal | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, DELETION_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud de borrado no encontrada. | Excepción explícita en src/modules/cross_store_consistency/services/deletion.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La solicitud ya no admite expansión. | Excepción explícita en src/modules/cross_store_consistency/services/deletion.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workers/deletion-requests/{id}/expand"
}
```

---

## 11. POST /workers/deletion-targets/{id}/executions

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Ejecutar el borrado en el store destino
- **Operation ID:** `CrossStoreWorkerController_executeDeletion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreWorkerController.executeDeletion](../../src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts)

### Descripción de negocio

Un objetivo con retención legal no se toca. El acuse del proveedor es la evidencia.


### Descripción del sistema

NestJS resuelve `POST /workers/deletion-targets/{id}/executions` en `CrossStoreWorkerController_executeDeletion`. El controlador delega en `DeletionService.executeDeletion`. Valida el body como `ExecuteDeletionDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeletionExecutionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ExecuteDeletionDto`; los campos opcionales se omiten.

```http
POST /workers/deletion-targets/00000000-0000-4000-8000-000000000001/executions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `DELETION_WORKER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `providerReceipt` | No | `string` | longitud máxima 300 | Acuse del proveedor; evidencia del borrado | `valor-ejemplo` |
| `succeeded` | No | `boolean` | Sin restricción adicional declarada | Falso si el borrado en el proveedor falló | `true` |
| `errorCode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workers/deletion-targets/00000000-0000-4000-8000-000000000001/executions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "providerReceipt": "valor-ejemplo",
  "succeeded": true,
  "errorCode": "CODIGO_EJEMPLO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DeletionExecutionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeletionExecutionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeletionExecutionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeletionExecutionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DeletionExecutionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeletionExecutionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeletionExecutionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeletionExecutionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeletionExecutionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeletionExecutionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeletionExecutionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "attemptNumber": 1,
  "status": "ok",
  "targetState": "valor-ejemplo",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `attemptNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de attempt number mantenido por la instancia. | `1` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `targetState` | Sí | `string` | Sin restricción adicional declarada | Estado en el que queda el objetivo | `valor-ejemplo` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si ese borrado ya se había ejecutado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, DELETION_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objetivo de borrado no encontrado. | Excepción explícita en src/modules/cross_store_consistency/services/deletion.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El objetivo está bloqueado por retención legal; no se borra. | Excepción explícita en src/modules/cross_store_consistency/services/deletion.service.ts |
| 422 | `PRECONDITION_FAILED` | El objetivo no está en un estado que admita ejecución. | Excepción explícita en src/modules/cross_store_consistency/services/deletion.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workers/deletion-targets/{id}/executions"
}
```

---

## 12. POST /workers/deletion-targets/{id}/verifications

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Verificar la ausencia en el store
- **Operation ID:** `CrossStoreWorkerController_verifyDeletion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreWorkerController.verifyDeletion](../../src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts)

### Descripción de negocio

Con referencias residuales el objetivo vuelve a PENDING para reintentarse: la prueba de borrado no es un trámite.

Contexto declarado en el controlador: UC-62-11 (verificación).

### Descripción del sistema

NestJS resuelve `POST /workers/deletion-targets/{id}/verifications` en `CrossStoreWorkerController_verifyDeletion`. El controlador delega en `DeletionService.verifyDeletion`. Valida el body como `VerifyDeletionDto` y consume `application/json`. El tipo de retorno estático es `Promise<VerificationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `VerifyDeletionDto`; los campos opcionales se omiten.

```http
POST /workers/deletion-targets/00000000-0000-4000-8000-000000000001/verifications HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "verificationMethod": "QUERY_ABSENCE",
  "verifiedAbsent": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `DELETION_WORKER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `verificationMethod` | Sí | `string` | valores: `QUERY_ABSENCE`, `CHECKSUM`, `PROVIDER_RECEIPT` | Sin descripción específica en el contrato OpenAPI. | `QUERY_ABSENCE` |
| `verifiedAbsent` | Sí | `boolean` | Sin restricción adicional declarada | Si el dato ya no está en el store | `true` |
| `residualReferenceCount` | No | `number` | mínimo 0 | Referencias residuales encontradas | `0` |
| `evidenceObjectId` | No | `string` | formato `uuid` | Evidencia guardada en el almacén de objetos | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workers/deletion-targets/00000000-0000-4000-8000-000000000001/verifications HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "verificationMethod": "QUERY_ABSENCE",
  "verifiedAbsent": true,
  "residualReferenceCount": 0,
  "evidenceObjectId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<VerificationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<VerificationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<VerificationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<VerificationResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<VerificationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<VerificationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<VerificationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<VerificationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<VerificationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<VerificationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VerificationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "targetState": "valor-ejemplo",
  "requiresReexecution": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `targetState` | Sí | `string` | Sin restricción adicional declarada | Valor de target state mantenido por la instancia. | `valor-ejemplo` |
| `requiresReexecution` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si quedan referencias y hay que reintentar el borrado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, DELETION_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objetivo de borrado no encontrado. | Excepción explícita en src/modules/cross_store_consistency/services/deletion.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El objetivo tiene que estar ejecutado para poder verificarse. | Excepción explícita en src/modules/cross_store_consistency/services/deletion.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workers/deletion-targets/{id}/verifications"
}
```

---

## 13. GET /workers/deletion-targets/executed

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Listar objetivos ejecutados pendientes de verificación
- **Operation ID:** `CrossStoreWorkerController_listExecutedDeletionTargets`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreWorkerController.listExecutedDeletionTargets](../../src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts)

### Descripción de negocio

Listar objetivos ejecutados pendientes de verificación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Descubrimiento (Fase 4): objetivos `EXECUTED` listos para `verifications`. Misma razón que `listPendingDeletionTargets`.

### Descripción del sistema

NestJS resuelve `GET /workers/deletion-targets/executed` en `CrossStoreWorkerController_listExecutedDeletionTargets`. El controlador delega en `DeletionService.listExecutedTargets`. No recibe body. El tipo de retorno estático es `Promise<ExecutedDeletionTargetsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /workers/deletion-targets/executed?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `DELETION_WORKER`, `PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /workers/deletion-targets/executed?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ExecutedDeletionTargetsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ExecutedDeletionTargetsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ExecutedDeletionTargetsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ExecutedDeletionTargetsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ExecutedDeletionTargetsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ExecutedDeletionTargetsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExecutedDeletionTargetsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "targets": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "deletionRequestId": "00000000-0000-4000-8000-000000000001",
      "datasetId": "00000000-0000-4000-8000-000000000001",
      "backendCode": "CODIGO_EJEMPLO",
      "targetLocator": "valor-ejemplo",
      "deletionMode": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `targets` | Sí | `array<DeletionTargetSummaryDto>` | Sin restricción adicional declarada | Valor de targets mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","deletionRequestId":"00000000-0000-4000-8000-000000000001","datasetId":"00000000-0000-4000-8000-000000000001","backendCode":"CODIGO_EJEMPLO","targetLocator":"valor-ejemplo","deletionMode":"valor-ejemplo"}]` |
| `targets[].id` | Sí | `string` | formato `uuid` | Identificador único del objetivo. | `00000000-0000-4000-8000-000000000001` |
| `targets[].deletionRequestId` | Sí | `string` | formato `uuid` | Identificador asociado a deletion request. | `00000000-0000-4000-8000-000000000001` |
| `targets[].datasetId` | Sí | `string` | formato `uuid` | Identificador asociado a dataset. | `00000000-0000-4000-8000-000000000001` |
| `targets[].backendCode` | Sí | `string` | Sin restricción adicional declarada | Valor de backend code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `targets[].targetLocator` | Sí | `string` | Sin restricción adicional declarada | Valor de target locator mantenido por la instancia. | `valor-ejemplo` |
| `targets[].deletionMode` | Sí | `string` | Sin restricción adicional declarada | Valor de deletion mode mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, DELETION_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workers/deletion-targets/executed"
}
```

---

## 14. GET /workers/deletion-targets/pending

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Listar objetivos de borrado pendientes de ejecución
- **Operation ID:** `CrossStoreWorkerController_listPendingDeletionTargets`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreWorkerController.listPendingDeletionTargets](../../src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts)

### Descripción de negocio

Listar objetivos de borrado pendientes de ejecución. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Descubrimiento (Fase 4 del plan de corrección de workers): objetivos `PENDING` sin bloqueo, listos para `executions`. No es uno de los 14 UC del módulo — es la infraestructura de lectura que el propio README exige ("Concurrencia": "el barrido de objetivos pendientes... lo hace el worker antes de llamar"), en el mismo estilo que `GET /internal/notifications/pending` de `messaging`.

### Descripción del sistema

NestJS resuelve `GET /workers/deletion-targets/pending` en `CrossStoreWorkerController_listPendingDeletionTargets`. El controlador delega en `DeletionService.listPendingTargets`. No recibe body. El tipo de retorno estático es `Promise<PendingDeletionTargetsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /workers/deletion-targets/pending?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `DELETION_WORKER`, `PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /workers/deletion-targets/pending?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PendingDeletionTargetsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PendingDeletionTargetsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PendingDeletionTargetsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PendingDeletionTargetsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PendingDeletionTargetsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PendingDeletionTargetsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PendingDeletionTargetsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "targets": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "deletionRequestId": "00000000-0000-4000-8000-000000000001",
      "datasetId": "00000000-0000-4000-8000-000000000001",
      "backendCode": "CODIGO_EJEMPLO",
      "targetLocator": "valor-ejemplo",
      "deletionMode": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `targets` | Sí | `array<DeletionTargetSummaryDto>` | Sin restricción adicional declarada | Valor de targets mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","deletionRequestId":"00000000-0000-4000-8000-000000000001","datasetId":"00000000-0000-4000-8000-000000000001","backendCode":"CODIGO_EJEMPLO","targetLocator":"valor-ejemplo","deletionMode":"valor-ejemplo"}]` |
| `targets[].id` | Sí | `string` | formato `uuid` | Identificador único del objetivo. | `00000000-0000-4000-8000-000000000001` |
| `targets[].deletionRequestId` | Sí | `string` | formato `uuid` | Identificador asociado a deletion request. | `00000000-0000-4000-8000-000000000001` |
| `targets[].datasetId` | Sí | `string` | formato `uuid` | Identificador asociado a dataset. | `00000000-0000-4000-8000-000000000001` |
| `targets[].backendCode` | Sí | `string` | Sin restricción adicional declarada | Valor de backend code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `targets[].targetLocator` | Sí | `string` | Sin restricción adicional declarada | Valor de target locator mantenido por la instancia. | `valor-ejemplo` |
| `targets[].deletionMode` | Sí | `string` | Sin restricción adicional declarada | Valor de deletion mode mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, DELETION_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workers/deletion-targets/pending"
}
```

---

## 15. POST /workers/projections/dead-letters

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Mandar el intento fallido a la cola muerta
- **Operation ID:** `CrossStoreWorkerController_sendToDeadLetter`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreWorkerController.sendToDeadLetter](../../src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts)

### Descripción de negocio

El payload se preserva en el almacén de objetos para poder reprocesarlo.

Contexto declarado en el controlador: UC-62-04 (envío).

### Descripción del sistema

NestJS resuelve `POST /workers/projections/dead-letters` en `CrossStoreWorkerController_sendToDeadLetter`. El controlador delega en `ProjectionDeliveryService.sendToDeadLetter`. Valida el body como `SendToDeadLetterDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeadLetterResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SendToDeadLetterDto`; los campos opcionales se omiten.

```http
POST /workers/projections/dead-letters HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "projectionDeliveryAttemptId": "00000000-0000-4000-8000-000000000001",
  "reasonCode": "CODIGO_EJEMPLO"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `PROJECTION_WORKER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `projectionDeliveryAttemptId` | Sí | `string` | formato `uuid` | Intento fallido que se manda a la cola muerta | `00000000-0000-4000-8000-000000000001` |
| `reasonCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `payloadObjectId` | No | `string` | formato `uuid` | Payload preservado en el almacén de objetos | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workers/projections/dead-letters HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "projectionDeliveryAttemptId": "00000000-0000-4000-8000-000000000001",
  "reasonCode": "CODIGO_EJEMPLO",
  "payloadObjectId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DeadLetterResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeadLetterResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeadLetterResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeadLetterResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeadLetterResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeadLetterResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeadLetterResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeadLetterResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeadLetterResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeadLetterResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "state": "valor-ejemplo",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si ese intento ya estaba en la cola muerta | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, PROJECTION_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Intento de entrega no encontrado. | Excepción explícita en src/modules/cross_store_consistency/services/projection-delivery.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La suscripción no tiene cola muerta habilitada. | Excepción explícita en src/modules/cross_store_consistency/services/projection-delivery.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workers/projections/dead-letters"
}
```

---

## 16. POST /workers/projections/deliveries/process

- **Módulo:** `cross_store_consistency`
- **Etiqueta OpenAPI:** `cross_store_consistency`
- **Nombre:** Registrar la entrega y avanzar el checkpoint
- **Operation ID:** `CrossStoreWorkerController_processDelivery`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CrossStoreWorkerController.processDelivery](../../src/modules/cross_store_consistency/controllers/cross-store-worker.controller.ts)

### Descripción de negocio

El checkpoint sólo avanza si la escritura en el destino está confirmada durable, y nunca retrocede.

Contexto declarado en el controlador: UC-62-02 + UC-62-03.

### Descripción del sistema

NestJS resuelve `POST /workers/projections/deliveries/process` en `CrossStoreWorkerController_processDelivery`. El controlador delega en `ProjectionDeliveryService.processDelivery`. Valida el body como `ProcessDeliveryDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeliveryResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ProcessDeliveryDto`; los campos opcionales se omiten.

```http
POST /workers/projections/deliveries/process HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "projectionSubscriptionId": "00000000-0000-4000-8000-000000000001",
  "outboxEventId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "payloadHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "partitionKey": "valor-ejemplo",
  "sourcePosition": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `PROJECTION_WORKER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `projectionSubscriptionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `outboxEventId` | Sí | `string` | formato `uuid` | Evento del outbox que se proyecta | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `payloadHash` | Sí | `string` | longitud máxima 200 | Hash del payload; parte de la identidad del intento | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `partitionKey` | Sí | `string` | longitud máxima 200 | Clave de partición del checkpoint | `valor-ejemplo` |
| `sourcePosition` | Sí | `string` | Sin restricción adicional declarada | Posición en la fuente; cadena por ser bigint. Monótona creciente. | `valor-ejemplo` |
| `targetVersion` | No | `string` | longitud máxima 100 | Versión escrita en el destino | `valor-ejemplo` |
| `durableWriteConfirmed` | No | `boolean` | Sin restricción adicional declarada | Falso si la escritura en el destino falló; el intento queda FAILED | `true` |
| `errorCode` | No | `string` | longitud máxima 100 | Código de error si falló | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workers/projections/deliveries/process HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DeliveryResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeliveryResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeliveryResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeliveryResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeliveryResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeliveryResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeliveryResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeliveryResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeliveryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeliveryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "attemptNumber": 1,
  "status": "ok",
  "duplicate": true,
  "checkpointAdvanced": true,
  "sourcePosition": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `attemptNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de attempt number mantenido por la instancia. | `1` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si el evento ya se había aplicado con esa clave | `true` |
| `checkpointAdvanced` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si el checkpoint avanzó con esta entrega | `true` |
| `sourcePosition` | No | `string` | Sin restricción adicional declarada | Posición del checkpoint tras la entrega | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, PROJECTION_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Suscripción de proyección no encontrada. | Excepción explícita en src/modules/cross_store_consistency/services/projection-delivery.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La suscripción no está activa. | Excepción explícita en src/modules/cross_store_consistency/services/projection-delivery.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workers/projections/deliveries/process"
}
```

---

