<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `polyglot_storage`

Referencia exhaustiva de 15 operación(es) del módulo `polyglot_storage`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `polyglot-finops`, `polyglot-governance`, `polyglot-ops`
- **Controladores:** `StorageFinOpsController`, `StorageGovernanceController`, `StorageOperationsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /finops/storage-cost-snapshots](#1-post-finops-storage-cost-snapshots) — Consolidar la instantánea de costes del periodo
2. [POST /governance/collections](#2-post-governance-collections) — Definir una colección física y su esquema versionado
3. [POST /governance/consistency-policies](#3-post-governance-consistency-policies) — Definir una política de consistencia
4. [POST /governance/datasets](#4-post-governance-datasets) — Definir un dataset gobernado con su versión inicial
5. [POST /governance/datasets/{id}/data-access-policies](#5-post-governance-datasets-id-data-access-policies) — Definir la política de acceso al dato del dataset
6. [POST /governance/datasets/{id}/versions](#6-post-governance-datasets-id-versions) — Publicar una versión nueva del dataset
7. [POST /governance/encryption-profiles](#7-post-governance-encryption-profiles) — Definir un perfil de cifrado con su política de rotación
8. [POST /governance/placements/{id}/failover](#8-post-governance-placements-id-failover) — Forzar el failover de una colocación
9. [POST /governance/placements/approve](#9-post-governance-placements-approve) — Aprobar una colocación respetando residencia y clasificación
10. [POST /governance/policies](#10-post-governance-policies) — Definir políticas de residencia, replicación y retención
11. [POST /governance/storage-backends](#11-post-governance-storage-backends) — Registrar un backend con sus regiones y capacidades
12. [POST /governance/tenants/{tenantId}/storage-bindings](#12-post-governance-tenants-tenantid-storage-bindings) — Vincular el tenant a su colocación
13. [POST /ops/integrity-policies](#13-post-ops-integrity-policies) — Definir la política de integridad del dataset
14. [POST /ops/integrity/{datasetId}/verify](#14-post-ops-integrity-datasetid-verify) — Verificar que la proyección cuadra con la fuente canónica
15. [POST /ops/store-health-checks](#15-post-ops-store-health-checks) — Registrar una comprobación de salud de la región

---

## 1. POST /finops/storage-cost-snapshots

- **Módulo:** `polyglot_storage`
- **Etiqueta OpenAPI:** `polyglot-finops`
- **Nombre:** Consolidar la instantánea de costes del periodo
- **Operation ID:** `StorageFinOpsController_consolidateCostSnapshot`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StorageFinOpsController.consolidateCostSnapshot](../../src/modules/polyglot_storage/controllers/storage-finops.controller.ts)

### Descripción de negocio

Idempotente por ámbito y periodo: reconsolidar actualiza, no duplica.


### Descripción del sistema

NestJS resuelve `POST /finops/storage-cost-snapshots` en `StorageFinOpsController_consolidateCostSnapshot`. El controlador delega en `StorageOperationsService.consolidateCostSnapshot`. Valida el body como `ConsolidateCostSnapshotDto` y consume `application/json`. El tipo de retorno estático es `Promise<CostSnapshotResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ConsolidateCostSnapshotDto`; los campos opcionales se omiten.

```http
POST /finops/storage-cost-snapshots HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "storageBackendRegionId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "periodEnd": "2026-07-31T12:00:00.000Z",
  "storageBytes": "valor-ejemplo",
  "readUnits": "valor-ejemplo",
  "writeUnits": "valor-ejemplo",
  "egressBytes": "valor-ejemplo",
  "estimatedCost": "valor-ejemplo",
  "currencyCode": "BOB"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `FINOPS_ANALYST`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `storageBackendRegionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `periodStart` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `periodEnd` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `storageBytes` | Sí | `string` | Sin restricción adicional declarada | Bytes almacenados; cadena por ser bigint | `valor-ejemplo` |
| `readUnits` | Sí | `string` | Sin restricción adicional declarada | Unidades de lectura; cadena por ser bigint | `valor-ejemplo` |
| `writeUnits` | Sí | `string` | Sin restricción adicional declarada | Unidades de escritura; cadena por ser bigint | `valor-ejemplo` |
| `egressBytes` | Sí | `string` | Sin restricción adicional declarada | Bytes de salida; cadena por ser bigint | `valor-ejemplo` |
| `estimatedCost` | Sí | `string` | Sin restricción adicional declarada | Coste estimado, como cadena decimal | `valor-ejemplo` |
| `currencyCode` | Sí | `string` | longitud máxima 10 | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `datasetDefinitionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /finops/storage-cost-snapshots HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "storageBackendRegionId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "periodEnd": "2026-07-31T12:00:00.000Z",
  "storageBytes": "valor-ejemplo",
  "readUnits": "valor-ejemplo",
  "writeUnits": "valor-ejemplo",
  "egressBytes": "valor-ejemplo",
  "estimatedCost": "valor-ejemplo",
  "currencyCode": "BOB",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CostSnapshotResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CostSnapshotResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CostSnapshotResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CostSnapshotResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CostSnapshotResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CostSnapshotResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CostSnapshotResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CostSnapshotResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CostSnapshotResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CostSnapshotResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "estimatedCost": "valor-ejemplo",
  "updated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `estimatedCost` | Sí | `string` | Sin restricción adicional declarada | Valor de estimated cost mantenido por la instancia. | `valor-ejemplo` |
| `updated` | Sí | `boolean` | Sin restricción adicional declarada | true si el periodo ya estaba consolidado y se actualizó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, FINOPS_ANALYST, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Región no encontrada | Excepción explícita en src/modules/polyglot_storage/services/storage-operations.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El periodo está invertido | Excepción explícita en src/modules/polyglot_storage/services/storage-operations.service.ts |
| 422 | `PRECONDITION_FAILED` | El periodo todavía no ha cerrado | Excepción explícita en src/modules/polyglot_storage/services/storage-operations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/finops/storage-cost-snapshots"
}
```

---

## 2. POST /governance/collections

- **Módulo:** `polyglot_storage`
- **Etiqueta OpenAPI:** `polyglot-governance`
- **Nombre:** Definir una colección física y su esquema versionado
- **Operation ID:** `StorageGovernanceController_defineCollection`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StorageGovernanceController.defineCollection](../../src/modules/polyglot_storage/controllers/storage-governance.controller.ts)

### Descripción de negocio

Exige dataset activo: no se ata almacenamiento a algo que aún puede cambiar.


### Descripción del sistema

NestJS resuelve `POST /governance/collections` en `StorageGovernanceController_defineCollection`. El controlador delega en `StorageGovernanceService.defineCollection`. Valida el body como `DefineCollectionDto` y consume `application/json`. El tipo de retorno estático es `Promise<CollectionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineCollectionDto`; los campos opcionales se omiten.

```http
POST /governance/collections HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "storageBackendId": "00000000-0000-4000-8000-000000000001",
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001",
  "logicalName": "Nombre de ejemplo",
  "datasetVersionId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo",
  "validationMode": "STRICT"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `storageBackendId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `datasetDefinitionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `logicalName` | Sí | `string` | longitud máxima 200 | Nombre lógico, único dentro del backend | `Nombre de ejemplo` |
| `datasetVersionId` | Sí | `string` | formato `uuid` | Versión del dataset que materializa | `00000000-0000-4000-8000-000000000001` |
| `schemaVersion` | Sí | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `validationMode` | Sí | `string` | valores: `STRICT`, `LENIENT` | Sin descripción específica en el contrato OpenAPI. | `STRICT` |
| `physicalNamePattern` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `partitioningStrategy` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `tenantIsolationMode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `routingKeyExpression` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `shardKeyExpression` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `schemaDocumentJson` | No | `object` | Sin restricción adicional declarada | Documento del esquema de la colección | `{}` |
| `migrationStrategy` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /governance/collections HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "storageBackendId": "00000000-0000-4000-8000-000000000001",
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001",
  "logicalName": "Nombre de ejemplo",
  "datasetVersionId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo",
  "validationMode": "STRICT",
  "physicalNamePattern": "Nombre de ejemplo",
  "partitioningStrategy": "valor-ejemplo",
  "tenantIsolationMode": "valor-ejemplo",
  "routingKeyExpression": "valor-ejemplo",
  "shardKeyExpression": "valor-ejemplo",
  "schemaDocumentJson": {},
  "migrationStrategy": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CollectionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CollectionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "dimension": 1,
  "distanceMetric": "valor-ejemplo",
  "lifecycleState": "valor-ejemplo",
  "bindingId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `dimension` | Sí | `number` | Sin restricción adicional declarada | Valor de dimension mantenido por la instancia. | `1` |
| `distanceMetric` | Sí | `string` | Sin restricción adicional declarada | Valor de distance metric mantenido por la instancia. | `valor-ejemplo` |
| `lifecycleState` | Sí | `string` | Sin restricción adicional declarada | Valor de lifecycle state mantenido por la instancia. | `valor-ejemplo` |
| `bindingId` | Sí | `string` | formato `uuid` | Vínculo del tenant creado con la colección | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Dataset no encontrado | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 404 | `NOT_FOUND` | Backend no encontrado | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 404 | `NOT_FOUND` | Versión del dataset no encontrada | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 409 | `CONFLICT` | El backend ya tiene una colección con ese nombre | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El dataset no está activo | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión pertenece a otro dataset | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/governance/collections"
}
```

---

## 3. POST /governance/consistency-policies

- **Módulo:** `polyglot_storage`
- **Etiqueta OpenAPI:** `polyglot-governance`
- **Nombre:** Definir una política de consistencia
- **Operation ID:** `StorageGovernanceController_defineConsistencyPolicy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StorageGovernanceController.defineConsistencyPolicy](../../src/modules/polyglot_storage/controllers/storage-governance.controller.ts)

### Descripción de negocio

Leer lo propio recién escrito obliga a tolerancia cero de lectura rancia.


### Descripción del sistema

NestJS resuelve `POST /governance/consistency-policies` en `StorageGovernanceController_defineConsistencyPolicy`. El controlador delega en `StorageGovernanceService.defineConsistencyPolicy`. Valida el body como `DefineConsistencyPolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<PolicyResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineConsistencyPolicyDto`; los campos opcionales se omiten.

```http
POST /governance/consistency-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "readConsistency": "valor-ejemplo",
  "writeConsistency": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `readConsistency` | Sí | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `writeConsistency` | Sí | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `conflictResolution` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `staleReadToleranceSeconds` | No | `number` | mínimo 0 | Debe ser 0 si se exige leer lo propio recién escrito | `0` |
| `requiresReadYourWrites` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /governance/consistency-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "readConsistency": "valor-ejemplo",
  "writeConsistency": "valor-ejemplo",
  "conflictResolution": "valor-ejemplo",
  "staleReadToleranceSeconds": 0,
  "requiresReadYourWrites": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PolicyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PolicyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "state": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una política de consistencia con ese código | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Exigir leer lo propio recién escrito obliga a tolerancia cero de lectura rancia | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/governance/consistency-policies"
}
```

---

## 4. POST /governance/datasets

- **Módulo:** `polyglot_storage`
- **Etiqueta OpenAPI:** `polyglot-governance`
- **Nombre:** Definir un dataset gobernado con su versión inicial
- **Operation ID:** `StorageGovernanceController_defineDataset`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StorageGovernanceController.defineDataset](../../src/modules/polyglot_storage/controllers/storage-governance.controller.ts)

### Descripción de negocio

Nace en borrador con la versión 1.0.0 en la misma transacción.


### Descripción del sistema

NestJS resuelve `POST /governance/datasets` en `StorageGovernanceController_defineDataset`. El controlador delega en `DatasetGovernanceService.defineDataset`. Valida el body como `DefineDatasetDto` y consume `application/json`. El tipo de retorno estático es `Promise<DatasetResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineDatasetDto`; los campos opcionales se omiten.

```http
POST /governance/datasets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "owningModuleCode": "CODIGO_EJEMPLO",
  "dataClassificationId": "00000000-0000-4000-8000-000000000001",
  "sourceOfTruth": "valor-ejemplo",
  "schemaFingerprint": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Código único del dataset | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `owningModuleCode` | Sí | `string` | longitud máxima 100 | Módulo dueño del dato | `CODIGO_EJEMPLO` |
| `dataClassificationId` | Sí | `string` | formato `uuid` | Clasificación que gobierna su tratamiento | `00000000-0000-4000-8000-000000000001` |
| `sourceOfTruth` | Sí | `string` | longitud máxima 100 | Dónde vive la verdad del dato | `valor-ejemplo` |
| `schemaFingerprint` | Sí | `string` | longitud máxima 200 | Huella del esquema inicial | `valor-ejemplo` |
| `canonicalEntityType` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `schemaDocumentFileId` | No | `string` | formato `uuid` | Documento del esquema | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /governance/datasets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "owningModuleCode": "CODIGO_EJEMPLO",
  "dataClassificationId": "00000000-0000-4000-8000-000000000001",
  "sourceOfTruth": "valor-ejemplo",
  "schemaFingerprint": "valor-ejemplo",
  "canonicalEntityType": "valor-ejemplo",
  "schemaDocumentFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DatasetResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DatasetResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "lifecycleState": "valor-ejemplo",
  "initialVersionId": "00000000-0000-4000-8000-000000000001",
  "initialVersion": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `lifecycleState` | Sí | `string` | Sin restricción adicional declarada | Valor de lifecycle state mantenido por la instancia. | `valor-ejemplo` |
| `initialVersionId` | Sí | `string` | formato `uuid` | Versión 1.0.0, creada en la misma transacción | `00000000-0000-4000-8000-000000000001` |
| `initialVersion` | Sí | `string` | Sin restricción adicional declarada | Valor de initial version mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Clasificación de datos no encontrada | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 409 | `CONFLICT` | Ya existe un dataset con ese código | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
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
  "path": "/governance/datasets"
}
```

---

## 5. POST /governance/datasets/{id}/data-access-policies

- **Módulo:** `polyglot_storage`
- **Etiqueta OpenAPI:** `polyglot-governance`
- **Nombre:** Definir la política de acceso al dato del dataset
- **Operation ID:** `StorageGovernanceController_defineAccessPolicy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StorageGovernanceController.defineAccessPolicy](../../src/modules/polyglot_storage/controllers/storage-governance.controller.ts)

### Descripción de negocio

Definir la política de acceso al dato del dataset. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /governance/datasets/{id}/data-access-policies` en `StorageGovernanceController_defineAccessPolicy`. El controlador delega en `DatasetGovernanceService.defineAccessPolicy`. Valida el body como `DefineAccessPolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccessPolicyResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineAccessPolicyDto`; los campos opcionales se omiten.

```http
POST /governance/datasets/00000000-0000-4000-8000-000000000001/data-access-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeOfUseCode": "CODIGO_EJEMPLO",
  "principalType": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `purposeOfUseCode` | Sí | `string` | longitud máxima 100 | Propósito de uso al que aplica | `CODIGO_EJEMPLO` |
| `principalType` | Sí | `string` | longitud máxima 100 | Tipo de principal al que aplica | `valor-ejemplo` |
| `fieldPolicyJson` | No | `object` | Sin restricción adicional declarada | Qué campos se ven y cuáles no | `{}` |
| `rowFilterExpression` | No | `string` | longitud máxima 1000 | Filtro de filas visibles | `valor-ejemplo` |
| `maskingProfileCode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /governance/datasets/00000000-0000-4000-8000-000000000001/data-access-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeOfUseCode": "CODIGO_EJEMPLO",
  "principalType": "valor-ejemplo",
  "fieldPolicyJson": {},
  "rowFilterExpression": "valor-ejemplo",
  "maskingProfileCode": "CODIGO_EJEMPLO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AccessPolicyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AccessPolicyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AccessPolicyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AccessPolicyResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AccessPolicyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AccessPolicyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AccessPolicyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AccessPolicyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AccessPolicyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AccessPolicyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccessPolicyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001",
  "state": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `datasetDefinitionId` | Sí | `string` | formato `uuid` | Identificador asociado a dataset definition. | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Dataset no encontrado | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 409 | `CONFLICT` | Ya existe una política para ese propósito y tipo de principal | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El dataset no está activo | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/governance/datasets/{id}/data-access-policies"
}
```

---

## 6. POST /governance/datasets/{id}/versions

- **Módulo:** `polyglot_storage`
- **Etiqueta OpenAPI:** `polyglot-governance`
- **Nombre:** Publicar una versión nueva del dataset
- **Operation ID:** `StorageGovernanceController_publishDatasetVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StorageGovernanceController.publishDatasetVersion](../../src/modules/polyglot_storage/controllers/storage-governance.controller.ts)

### Descripción de negocio

La anterior queda superseded; una sucesora debe declarar su compatibilidad.


### Descripción del sistema

NestJS resuelve `POST /governance/datasets/{id}/versions` en `StorageGovernanceController_publishDatasetVersion`. El controlador delega en `DatasetGovernanceService.publishDatasetVersion`. Valida el body como `PublishDatasetVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<DatasetVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishDatasetVersionDto`; los campos opcionales se omiten.

```http
POST /governance/datasets/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "version": "valor-ejemplo",
  "schemaFingerprint": "valor-ejemplo",
  "compatibilityMode": "NONE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `version` | Sí | `string` | longitud máxima 50 | Versión semántica nueva | `valor-ejemplo` |
| `schemaFingerprint` | Sí | `string` | longitud máxima 200 | Huella recalculada del esquema | `valor-ejemplo` |
| `compatibilityMode` | Sí | `string` | valores: `NONE`, `BACKWARD`, `FORWARD`, `FULL` | Sin descripción específica en el contrato OpenAPI. | `NONE` |
| `schemaDocumentFileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /governance/datasets/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "version": "valor-ejemplo",
  "schemaFingerprint": "valor-ejemplo",
  "compatibilityMode": "NONE",
  "schemaDocumentFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DatasetVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DatasetVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DatasetVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DatasetVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DatasetVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DatasetVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DatasetVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DatasetVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DatasetVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DatasetVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DatasetVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "version": "valor-ejemplo",
  "state": "valor-ejemplo",
  "datasetLifecycleState": "valor-ejemplo",
  "supersededVersionId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `version` | Sí | `string` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `valor-ejemplo` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |
| `datasetLifecycleState` | Sí | `string` | Sin restricción adicional declarada | Ciclo de vida en el que queda el dataset | `valor-ejemplo` |
| `supersededVersionId` | No | `string` | formato `uuid` | Versión que queda superseded | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Dataset no encontrado | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 409 | `CONFLICT` | El dataset ya tiene esa versión | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una versión que sucede a otra debe declarar su compatibilidad | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/governance/datasets/{id}/versions"
}
```

---

## 7. POST /governance/encryption-profiles

- **Módulo:** `polyglot_storage`
- **Etiqueta OpenAPI:** `polyglot-governance`
- **Nombre:** Definir un perfil de cifrado con su política de rotación
- **Operation ID:** `StorageGovernanceController_defineEncryptionProfile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StorageGovernanceController.defineEncryptionProfile](../../src/modules/polyglot_storage/controllers/storage-governance.controller.ts)

### Descripción de negocio

La referencia apunta al KMS; la clave nunca pasa por aquí.


### Descripción del sistema

NestJS resuelve `POST /governance/encryption-profiles` en `StorageGovernanceController_defineEncryptionProfile`. El controlador delega en `StorageGovernanceService.defineEncryptionProfile`. Valida el body como `DefineEncryptionProfileDto` y consume `application/json`. El tipo de retorno estático es `Promise<EncryptionProfileResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineEncryptionProfileDto`; los campos opcionales se omiten.

```http
POST /governance/encryption-profiles HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "algorithm": "valor-ejemplo",
  "keyManagementProvider": "valor-ejemplo",
  "keyReference": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `algorithm` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `keyManagementProvider` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `keyReference` | Sí | `string` | longitud máxima 300 | Referencia en el KMS. Nunca la clave. | `valor-ejemplo` |
| `envelopeEncryption` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `fieldLevelEncryption` | No | `boolean` | Sin restricción adicional declarada | Obligatorio si el dataset ligado contiene datos de paciente | `false` |
| `deterministicFieldsJson` | No | `object` | Sin restricción adicional declarada | Campos con cifrado determinista para poder buscarlos | `{}` |
| `rotationPolicy` | No | `RotationPolicyDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","rotationIntervalDays":1,"overlapDays":0,"reencryptExistingData":false,"emergencyRotationEnabled":false}` |
| `rotationPolicy.code` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `rotationPolicy.rotationIntervalDays` | No | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `rotationPolicy.overlapDays` | No | `number` | mínimo 0 | Días que conviven las dos claves | `0` |
| `rotationPolicy.reencryptExistingData` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `rotationPolicy.emergencyRotationEnabled` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /governance/encryption-profiles HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "algorithm": "valor-ejemplo",
  "keyManagementProvider": "valor-ejemplo",
  "keyReference": "valor-ejemplo",
  "envelopeEncryption": true,
  "fieldLevelEncryption": false,
  "deterministicFieldsJson": {},
  "rotationPolicy": {
    "code": "CODIGO_EJEMPLO",
    "rotationIntervalDays": 1,
    "overlapDays": 0,
    "reencryptExistingData": false,
    "emergencyRotationEnabled": false
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EncryptionProfileResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EncryptionProfileResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EncryptionProfileResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EncryptionProfileResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EncryptionProfileResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EncryptionProfileResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EncryptionProfileResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EncryptionProfileResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EncryptionProfileResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EncryptionProfileResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "state": "valor-ejemplo",
  "rotationPolicyId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |
| `rotationPolicyId` | No | `string` | formato `uuid` | Política de rotación creada o reutilizada | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un perfil de cifrado con ese código | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
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
  "path": "/governance/encryption-profiles"
}
```

---

## 8. POST /governance/placements/{id}/failover

- **Módulo:** `polyglot_storage`
- **Etiqueta OpenAPI:** `polyglot-governance`
- **Nombre:** Forzar el failover de una colocación
- **Operation ID:** `StorageGovernanceController_failoverPlacement`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StorageGovernanceController.failoverPlacement](../../src/modules/polyglot_storage/controllers/storage-governance.controller.ts)

### Descripción de negocio

Los vínculos con secundario mueven su primario; el resto se queda.


### Descripción del sistema

NestJS resuelve `POST /governance/placements/{id}/failover` en `StorageGovernanceController_failoverPlacement`. El controlador delega en `StorageOperationsService.failoverPlacement`. Valida el body como `FailoverPlacementDto` y consume `application/json`. El tipo de retorno estático es `Promise<FailoverResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `FailoverPlacementDto`; los campos opcionales se omiten.

```http
POST /governance/placements/00000000-0000-4000-8000-000000000001/failover HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | Sin restricción adicional declarada | Por qué se fuerza el failover | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /governance/placements/00000000-0000-4000-8000-000000000001/failover HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<FailoverResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FailoverResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FailoverResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FailoverResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<FailoverResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FailoverResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FailoverResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FailoverResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FailoverResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FailoverResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FailoverResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "placementId": "00000000-0000-4000-8000-000000000001",
  "state": "valor-ejemplo",
  "swappedBindings": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `placementId` | Sí | `string` | formato `uuid` | Identificador asociado a placement. | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |
| `swappedBindings` | Sí | `number` | Sin restricción adicional declarada | Vínculos cuyo primario se movió | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Colocación no encontrada | Excepción explícita en src/modules/polyglot_storage/services/storage-operations.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La colocación no está sirviendo tráfico | Excepción explícita en src/modules/polyglot_storage/services/storage-operations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/governance/placements/{id}/failover"
}
```

---

## 9. POST /governance/placements/approve

- **Módulo:** `polyglot_storage`
- **Etiqueta OpenAPI:** `polyglot-governance`
- **Nombre:** Aprobar una colocación respetando residencia y clasificación
- **Operation ID:** `StorageGovernanceController_approvePlacement`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StorageGovernanceController.approvePlacement](../../src/modules/polyglot_storage/controllers/storage-governance.controller.ts)

### Descripción de negocio

Residencia, clasificación, cifrado y aislamiento deben cumplirse a la vez.


### Descripción del sistema

NestJS resuelve `POST /governance/placements/approve` en `StorageGovernanceController_approvePlacement`. El controlador delega en `DatasetGovernanceService.approvePlacement`. Valida el body como `ApprovePlacementDto` y consume `application/json`. El tipo de retorno estático es `Promise<PlacementResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ApprovePlacementDto`; los campos opcionales se omiten.

```http
POST /governance/placements/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "datasetVersionId": "00000000-0000-4000-8000-000000000001",
  "storageBackendRegionId": "00000000-0000-4000-8000-000000000001",
  "collectionDefinitionId": "00000000-0000-4000-8000-000000000001",
  "residencyPolicyId": "00000000-0000-4000-8000-000000000001",
  "encryptionProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `datasetVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `storageBackendRegionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `collectionDefinitionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `residencyPolicyId` | Sí | `string` | formato `uuid` | Política de residencia a satisfacer | `00000000-0000-4000-8000-000000000001` |
| `encryptionProfileId` | Sí | `string` | formato `uuid` | Perfil de cifrado a aplicar | `00000000-0000-4000-8000-000000000001` |
| `replicationPolicyId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `consistencyPolicyId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `placementRole` | No | `string` | longitud máxima 50 | Papel de la colocación | `PRIMARY` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /governance/placements/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "datasetVersionId": "00000000-0000-4000-8000-000000000001",
  "storageBackendRegionId": "00000000-0000-4000-8000-000000000001",
  "collectionDefinitionId": "00000000-0000-4000-8000-000000000001",
  "residencyPolicyId": "00000000-0000-4000-8000-000000000001",
  "encryptionProfileId": "00000000-0000-4000-8000-000000000001",
  "replicationPolicyId": "00000000-0000-4000-8000-000000000001",
  "consistencyPolicyId": "00000000-0000-4000-8000-000000000001",
  "placementRole": "PRIMARY"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PlacementResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PlacementResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PlacementResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PlacementResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PlacementResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PlacementResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PlacementResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PlacementResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PlacementResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PlacementResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "state": "valor-ejemplo",
  "placementRole": "valor-ejemplo",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |
| `placementRole` | Sí | `string` | Sin restricción adicional declarada | Valor de placement role mantenido por la instancia. | `valor-ejemplo` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si la colocación ya estaba aprobada | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión del dataset no encontrada | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 404 | `NOT_FOUND` | Colección no encontrada | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 404 | `NOT_FOUND` | Región no encontrada | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 404 | `NOT_FOUND` | Política de residencia no encontrada | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 404 | `NOT_FOUND` | Perfil de cifrado no encontrado | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La versión del dataset no está activa | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 422 | `PRECONDITION_FAILED` | Un dataset con datos de paciente exige cifrado a nivel de campo | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 422 | `PRECONDITION_FAILED` | La política de residencia prohíbe ese país | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 422 | `PRECONDITION_FAILED` | El país de la región no está entre los permitidos por la residencia | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 422 | `PRECONDITION_FAILED` | La región no está entre las permitidas por la residencia | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/governance/placements/approve"
}
```

---

## 10. POST /governance/policies

- **Módulo:** `polyglot_storage`
- **Etiqueta OpenAPI:** `polyglot-governance`
- **Nombre:** Definir políticas de residencia, replicación y retención
- **Operation ID:** `StorageGovernanceController_defineStoragePolicies`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StorageGovernanceController.defineStoragePolicies](../../src/modules/polyglot_storage/controllers/storage-governance.controller.ts)

### Descripción de negocio

Las tres caras de la misma decisión sobre dónde vive el dato.


### Descripción del sistema

NestJS resuelve `POST /governance/policies` en `StorageGovernanceController_defineStoragePolicies`. El controlador delega en `StorageGovernanceService.defineStoragePolicies`. Valida el body como `DefineStoragePoliciesDto` y consume `application/json`. El tipo de retorno estático es `Promise<StoragePoliciesResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineStoragePoliciesDto`; los campos opcionales se omiten.

```http
POST /governance/policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `residency` | No | `ResidencyPolicyDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","allowedCountryCodes":["BO"],"forbiddenCountryCodes":["BO"],"allowedRegionCodes":["CODIGO_EJEMPLO"],"requiresInCountryBackup":false,"crossBorderTransferBasis":"valor-ejemplo"}` |
| `residency.code` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `residency.allowedCountryCodes` | No | `array<string>` | Sin restricción adicional declarada | Países donde sí puede residir | `["BO"]` |
| `residency.forbiddenCountryCodes` | No | `array<string>` | Sin restricción adicional declarada | Países donde no puede residir | `["BO"]` |
| `residency.allowedRegionCodes` | No | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["CODIGO_EJEMPLO"]` |
| `residency.requiresInCountryBackup` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `residency.crossBorderTransferBasis` | No | `string` | longitud máxima 200 | Base legal de la transferencia internacional | `valor-ejemplo` |
| `replication` | No | `ReplicationPolicyDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","replicaCount":1,"replicationMode":"valor-ejemplo","failoverMode":"valor-ejemplo","crossRegionEnabled":false,"maxReplicationLagSeconds":1}` |
| `replication.code` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `replication.replicaCount` | No | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `replication.replicationMode` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `replication.failoverMode` | No | `string` | longitud máxima 50 | Modo de reacción ante una región caída | `valor-ejemplo` |
| `replication.crossRegionEnabled` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `replication.maxReplicationLagSeconds` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `retention` | No | `RetentionPolicyDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","retentionDays":1,"deletionMode":"valor-ejemplo","archiveAfterDays":1,"legalHoldOverridesDeletion":true,"jurisdictionCode":"CODIGO_EJEMPLO"}` |
| `retention.code` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `retention.retentionDays` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `retention.deletionMode` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `retention.archiveAfterDays` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `retention.legalHoldOverridesDeletion` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `retention.jurisdictionCode` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /governance/policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "residency": {
    "code": "CODIGO_EJEMPLO",
    "allowedCountryCodes": [
      "BO"
    ],
    "forbiddenCountryCodes": [
      "BO"
    ],
    "allowedRegionCodes": [
      "CODIGO_EJEMPLO"
    ],
    "requiresInCountryBackup": false,
    "crossBorderTransferBasis": "valor-ejemplo"
  },
  "replication": {
    "code": "CODIGO_EJEMPLO",
    "replicaCount": 1,
    "replicationMode": "valor-ejemplo",
    "failoverMode": "valor-ejemplo",
    "crossRegionEnabled": false,
    "maxReplicationLagSeconds": 1
  },
  "retention": {
    "code": "CODIGO_EJEMPLO",
    "retentionDays": 1,
    "deletionMode": "valor-ejemplo",
    "archiveAfterDays": 1,
    "legalHoldOverridesDeletion": true,
    "jurisdictionCode": "CODIGO_EJEMPLO"
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<StoragePoliciesResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StoragePoliciesResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StoragePoliciesResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StoragePoliciesResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StoragePoliciesResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<StoragePoliciesResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StoragePoliciesResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StoragePoliciesResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StoragePoliciesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StoragePoliciesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "residencyPolicyId": "00000000-0000-4000-8000-000000000001",
  "replicationPolicyId": "00000000-0000-4000-8000-000000000001",
  "retentionPolicyId": "00000000-0000-4000-8000-000000000001",
  "created": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `residencyPolicyId` | No | `string` | formato `uuid` | Identificador asociado a residency policy. | `00000000-0000-4000-8000-000000000001` |
| `replicationPolicyId` | No | `string` | formato `uuid` | Identificador asociado a replication policy. | `00000000-0000-4000-8000-000000000001` |
| `retentionPolicyId` | No | `string` | formato `uuid` | Identificador asociado a retention policy. | `00000000-0000-4000-8000-000000000001` |
| `created` | Sí | `number` | Sin restricción adicional declarada | Políticas creadas en esta llamada | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una política de residencia con ese código | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 409 | `CONFLICT` | Ya existe una política de replicación con ese código | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 409 | `CONFLICT` | Ya existe una política de retención con ese código | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Hay que declarar al menos una política | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 422 | `PRECONDITION_FAILED` | Prohibir la réplica entre regiones exige declarar los países permitidos | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/governance/policies"
}
```

---

## 11. POST /governance/storage-backends

- **Módulo:** `polyglot_storage`
- **Etiqueta OpenAPI:** `polyglot-governance`
- **Nombre:** Registrar un backend con sus regiones y capacidades
- **Operation ID:** `StorageGovernanceController_registerBackend`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StorageGovernanceController.registerBackend](../../src/modules/polyglot_storage/controllers/storage-governance.controller.ts)

### Descripción de negocio

Nace registrado, no activo: declararlo no es haber comprobado que responde.


### Descripción del sistema

NestJS resuelve `POST /governance/storage-backends` en `StorageGovernanceController_registerBackend`. El controlador delega en `StorageGovernanceService.registerBackend`. Valida el body como `RegisterBackendDto` y consume `application/json`. El tipo de retorno estático es `Promise<BackendResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterBackendDto`; los campos opcionales se omiten.

```http
POST /governance/storage-backends HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "backendType": "valor-ejemplo",
  "providerCode": "CODIGO_EJEMPLO",
  "regions": [
    {
      "regionCode": "CODIGO_EJEMPLO",
      "countryCode": "BO"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Código único del backend | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `backendType` | Sí | `string` | longitud máxima 100 | Naturaleza del motor | `valor-ejemplo` |
| `providerCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `controlPlaneEndpoint` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regions` | Sí | `array<BackendRegionDto>` | mínimo 1 elemento(s) | Un backend sin región no puede alojar nada | `[{"regionCode":"CODIGO_EJEMPLO","countryCode":"BO","jurisdictionCode":"CODIGO_EJEMPLO","endpointUri":"valor-ejemplo","isPrimary":false}]` |
| `regions[].regionCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regions[].countryCode` | Sí | `string` | longitud máxima 10 | País donde reside físicamente el dato | `BO` |
| `regions[].jurisdictionCode` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `regions[].endpointUri` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `regions[].isPrimary` | No | `boolean` | Sin restricción adicional declarada | Sólo una región puede serlo | `false` |
| `capabilities` | No | `array<BackendCapabilityDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"capabilityCode":"CODIGO_EJEMPLO","capabilityVersion":"valor-ejemplo","configurationJson":{}}]` |
| `capabilities[].capabilityCode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `capabilities[].capabilityVersion` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `capabilities[].configurationJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `supportsTransactions` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `supportsTtl` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `supportsEncryption` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `supportsVersioning` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `supportsWorm` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `supportsVectorSearch` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `supportsFullText` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /governance/storage-backends HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "backendType": "valor-ejemplo",
  "providerCode": "CODIGO_EJEMPLO",
  "controlPlaneEndpoint": "valor-ejemplo",
  "regions": [
    {
      "regionCode": "CODIGO_EJEMPLO",
      "countryCode": "BO",
      "jurisdictionCode": "CODIGO_EJEMPLO",
      "endpointUri": "valor-ejemplo",
      "isPrimary": false
    }
  ],
  "capabilities": [
    {
      "capabilityCode": "CODIGO_EJEMPLO",
      "capabilityVersion": "valor-ejemplo",
      "configurationJson": {}
    }
  ],
  "supportsTransactions": false,
  "supportsTtl": false,
  "supportsEncryption": false,
  "supportsVersioning": false,
  "supportsWorm": false,
  "supportsVectorSearch": false,
  "supportsFullText": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BackendResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BackendResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BackendResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BackendResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BackendResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BackendResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BackendResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BackendResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BackendResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BackendResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "state": "valor-ejemplo",
  "regionIds": [
    "valor-ejemplo"
  ],
  "capabilityCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |
| `regionIds` | Sí | `array<string>` | formato `uuid` | Valor de region ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `capabilityCount` | Sí | `number` | Sin restricción adicional declarada | Capacidades registradas, todas pendientes de verificar | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un backend con ese código | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo una región puede ser la primaria | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 422 | `PRECONDITION_FAILED` | message | Excepción explícita en src/modules/polyglot_storage/services/storage-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/governance/storage-backends"
}
```

---

## 12. POST /governance/tenants/{tenantId}/storage-bindings

- **Módulo:** `polyglot_storage`
- **Etiqueta OpenAPI:** `polyglot-governance`
- **Nombre:** Vincular el tenant a su colocación
- **Operation ID:** `StorageGovernanceController_bindTenantStorage`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StorageGovernanceController.bindTenantStorage](../../src/modules/polyglot_storage/controllers/storage-governance.controller.ts)

### Descripción de negocio

Activa la colocación: sin vínculo no debe escribirse en el backend.


### Descripción del sistema

NestJS resuelve `POST /governance/tenants/{tenantId}/storage-bindings` en `StorageGovernanceController_bindTenantStorage`. El controlador delega en `DatasetGovernanceService.bindTenantStorage`. Valida el body como `BindTenantStorageDto` y consume `application/json`. El tipo de retorno estático es `Promise<TenantBindingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BindTenantStorageDto`; los campos opcionales se omiten.

```http
POST /governance/tenants/00000000-0000-4000-8000-000000000001/storage-bindings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001",
  "primaryPlacementId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `tenantId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `datasetDefinitionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `primaryPlacementId` | Sí | `string` | formato `uuid` | Colocación primaria, ya aprobada | `00000000-0000-4000-8000-000000000001` |
| `secondaryPlacementId` | No | `string` | formato `uuid` | Colocación de respaldo para el failover | `00000000-0000-4000-8000-000000000001` |
| `tenantPartitionKey` | No | `string` | longitud máxima 200 | Clave de partición del tenant | `valor-ejemplo` |
| `tenantEncryptionKeyRef` | No | `string` | longitud máxima 300 | Referencia de la clave del tenant en el KMS | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /governance/tenants/00000000-0000-4000-8000-000000000001/storage-bindings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001",
  "primaryPlacementId": "00000000-0000-4000-8000-000000000001",
  "secondaryPlacementId": "00000000-0000-4000-8000-000000000001",
  "tenantPartitionKey": "valor-ejemplo",
  "tenantEncryptionKeyRef": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TenantBindingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TenantBindingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TenantBindingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TenantBindingResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TenantBindingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TenantBindingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TenantBindingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TenantBindingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TenantBindingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TenantBindingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TenantBindingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "state": "valor-ejemplo",
  "primaryPlacementState": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |
| `primaryPlacementState` | Sí | `string` | Sin restricción adicional declarada | Estado en el que queda la colocación primaria | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Colocación primaria no encontrada | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 404 | `NOT_FOUND` | Colocación secundaria no encontrada | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 409 | `CONFLICT` | El tenant ya está vinculado a ese dataset | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La colocación primaria no está aprobada | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 422 | `PRECONDITION_FAILED` | La colocación secundaria no puede ser la misma que la primaria | Excepción explícita en src/modules/polyglot_storage/services/dataset-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/governance/tenants/{tenantId}/storage-bindings"
}
```

---

## 13. POST /ops/integrity-policies

- **Módulo:** `polyglot_storage`
- **Etiqueta OpenAPI:** `polyglot-ops`
- **Nombre:** Definir la política de integridad del dataset
- **Operation ID:** `StorageOperationsController_defineIntegrityPolicy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StorageOperationsController.defineIntegrityPolicy](../../src/modules/polyglot_storage/controllers/storage-operations.controller.ts)

### Descripción de negocio

Una por dataset: redefinirla la actualiza.


### Descripción del sistema

NestJS resuelve `POST /ops/integrity-policies` en `StorageOperationsController_defineIntegrityPolicy`. El controlador delega en `StorageOperationsService.defineIntegrityPolicy`. Valida el body como `DefineIntegrityPolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<IntegrityPolicyResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineIntegrityPolicyDto`; los campos opcionales se omiten.

```http
POST /ops/integrity-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001",
  "hashAlgorithm": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "verificationIntervalHours": 1,
  "samplePercentage": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `datasetDefinitionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `hashAlgorithm` | Sí | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `verificationIntervalHours` | Sí | `number` | mínimo 1 | Cada cuánto se verifica | `1` |
| `samplePercentage` | Sí | `string` | Sin restricción adicional declarada | Porcentaje de la muestra, como cadena decimal | `valor-ejemplo` |
| `compareWithCanonicalSource` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `quarantineOnMismatch` | No | `boolean` | Sin restricción adicional declarada | Cuarentenar la proyección si el hash no cuadra | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/integrity-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001",
  "hashAlgorithm": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "verificationIntervalHours": 1,
  "samplePercentage": "valor-ejemplo",
  "compareWithCanonicalSource": true,
  "quarantineOnMismatch": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IntegrityPolicyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IntegrityPolicyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IntegrityPolicyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IntegrityPolicyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IntegrityPolicyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IntegrityPolicyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IntegrityPolicyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IntegrityPolicyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IntegrityPolicyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IntegrityPolicyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "datasetDefinitionId": "00000000-0000-4000-8000-000000000001",
  "state": "valor-ejemplo",
  "updated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `datasetDefinitionId` | Sí | `string` | formato `uuid` | Identificador asociado a dataset definition. | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |
| `updated` | Sí | `boolean` | Sin restricción adicional declarada | true si la política ya existía y se actualizó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Dataset no encontrado | Excepción explícita en src/modules/polyglot_storage/services/storage-operations.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El porcentaje de muestra debe estar entre 0 y 100 | Excepción explícita en src/modules/polyglot_storage/services/storage-operations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/integrity-policies"
}
```

---

## 14. POST /ops/integrity/{datasetId}/verify

- **Módulo:** `polyglot_storage`
- **Etiqueta OpenAPI:** `polyglot-ops`
- **Nombre:** Verificar que la proyección cuadra con la fuente canónica
- **Operation ID:** `StorageOperationsController_verifyIntegrity`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StorageOperationsController.verifyIntegrity](../../src/modules/polyglot_storage/controllers/storage-operations.controller.ts)

### Descripción de negocio

No cuadrar cuarentena la colocación si la política lo ordena.


### Descripción del sistema

NestJS resuelve `POST /ops/integrity/{datasetId}/verify` en `StorageOperationsController_verifyIntegrity`. El controlador delega en `StorageOperationsService.verifyIntegrity`. Valida el body como `PolyglotStorageVerifyIntegrityDto` y consume `application/json`. El tipo de retorno estático es `Promise<VerifyIntegrityResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `datasetId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PolyglotStorageVerifyIntegrityDto`; los campos opcionales se omiten.

```http
POST /ops/integrity/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "placementId": "00000000-0000-4000-8000-000000000001",
  "canonicalHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "projectionHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `datasetId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `placementId` | Sí | `string` | formato `uuid` | Colocación cuya proyección se verifica | `00000000-0000-4000-8000-000000000001` |
| `canonicalHash` | Sí | `string` | longitud máxima 200 | Hash de la fuente canónica | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `projectionHash` | Sí | `string` | longitud máxima 200 | Hash calculado sobre la proyección | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/integrity/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "placementId": "00000000-0000-4000-8000-000000000001",
  "canonicalHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "projectionHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VerifyIntegrityResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<VerifyIntegrityResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<VerifyIntegrityResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<VerifyIntegrityResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<VerifyIntegrityResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<VerifyIntegrityResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<VerifyIntegrityResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<VerifyIntegrityResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<VerifyIntegrityResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<VerifyIntegrityResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VerifyIntegrityResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "placementId": "00000000-0000-4000-8000-000000000001",
  "matched": true,
  "placementState": "valor-ejemplo",
  "quarantined": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `placementId` | Sí | `string` | formato `uuid` | Identificador asociado a placement. | `00000000-0000-4000-8000-000000000001` |
| `matched` | Sí | `boolean` | Sin restricción adicional declarada | true si los dos hashes coinciden | `true` |
| `placementState` | Sí | `string` | Sin restricción adicional declarada | Estado en el que queda la colocación | `valor-ejemplo` |
| `quarantined` | Sí | `boolean` | Sin restricción adicional declarada | true si la política ordenó cuarentenarla | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El dataset no tiene política de integridad | Excepción explícita en src/modules/polyglot_storage/services/storage-operations.service.ts |
| 404 | `NOT_FOUND` | Colocación no encontrada | Excepción explícita en src/modules/polyglot_storage/services/storage-operations.service.ts |
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
  "path": "/ops/integrity/{datasetId}/verify"
}
```

---

## 15. POST /ops/store-health-checks

- **Módulo:** `polyglot_storage`
- **Etiqueta OpenAPI:** `polyglot-ops`
- **Nombre:** Registrar una comprobación de salud de la región
- **Operation ID:** `StorageOperationsController_recordHealthCheck`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [StorageOperationsController.recordHealthCheck](../../src/modules/polyglot_storage/controllers/storage-operations.controller.ts)

### Descripción de negocio

El failover automático sólo ocurre si la política de replicación lo autoriza.


### Descripción del sistema

NestJS resuelve `POST /ops/store-health-checks` en `StorageOperationsController_recordHealthCheck`. El controlador delega en `StorageOperationsService.recordHealthCheck`. Valida el body como `RecordHealthCheckDto` y consume `application/json`. El tipo de retorno estático es `Promise<HealthCheckResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordHealthCheckDto`; los campos opcionales se omiten.

```http
POST /ops/store-health-checks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "storageBackendRegionId": "00000000-0000-4000-8000-000000000001",
  "checkType": "valor-ejemplo",
  "status": "HEALTHY"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `storageBackendRegionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `checkType` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `string` | valores: `HEALTHY`, `DEGRADED`, `UNHEALTHY` | Sin descripción específica en el contrato OpenAPI. | `HEALTHY` |
| `latencyMs` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `detailsJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/store-health-checks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "storageBackendRegionId": "00000000-0000-4000-8000-000000000001",
  "checkType": "valor-ejemplo",
  "status": "HEALTHY",
  "latencyMs": 1,
  "detailsJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<HealthCheckResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<HealthCheckResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<HealthCheckResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<HealthCheckResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<HealthCheckResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<HealthCheckResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<HealthCheckResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<HealthCheckResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<HealthCheckResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HealthCheckResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "degradedPlacements": 1,
  "swappedBindings": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `degradedPlacements` | Sí | `number` | Sin restricción adicional declarada | Colocaciones que quedaron degradadas por esta comprobación | `1` |
| `swappedBindings` | Sí | `number` | Sin restricción adicional declarada | Vínculos de tenant cuyo primario se movió al secundario | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Región no encontrada | Excepción explícita en src/modules/polyglot_storage/services/storage-operations.service.ts |
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
  "path": "/ops/store-health-checks"
}
```

---

