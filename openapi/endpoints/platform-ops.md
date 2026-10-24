<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `platform_ops`

Referencia exhaustiva de 20 operación(es) del módulo `platform_ops`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `platform-ops`, `platform-ops-collections`
- **Controladores:** `PlatformOpsCollectionsController`, `PlatformOpsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /ops/artifacts](#1-get-ops-artifacts) — Listar artefactos del tenant
2. [POST /ops/artifacts](#2-post-ops-artifacts) — Publicar un artefacto inmutable
3. [POST /ops/capacity-plans/{id}/measurements](#3-post-ops-capacity-plans-id-measurements) — Registrar una medición de capacidad
4. [GET /ops/change-requests](#4-get-ops-change-requests) — Listar solicitudes de cambio del tenant
5. [POST /ops/change-requests](#5-post-ops-change-requests) — Registrar una solicitud de cambio
6. [POST /ops/change-requests/{id}/approvals](#6-post-ops-change-requests-id-approvals) — Registrar la decisión del CAB
7. [GET /ops/deployments](#7-get-ops-deployments) — Listar despliegues del tenant
8. [POST /ops/deployments](#8-post-ops-deployments) — Ejecutar un despliegue
9. [POST /ops/deployments/{id}/rollback](#9-post-ops-deployments-id-rollback) — Revertir un despliegue
10. [POST /ops/error-budget/{policyId}/burn-events](#10-post-ops-error-budget-policyid-burn-events) — Registrar la quema del presupuesto de error
11. [POST /ops/health-checks/{id}/runs](#11-post-ops-health-checks-id-runs) — Registrar una corrida de health check
12. [GET /ops/incidents](#12-get-ops-incidents) — Listar incidentes de salud del tenant
13. [PATCH /ops/incidents/{id}](#13-patch-ops-incidents-id) — Mover el incidente, sumar respondientes y publicar comunicaciones
14. [POST /ops/incidents/{id}/postmortem](#14-post-ops-incidents-id-postmortem) — Abrir el postmortem del incidente resuelto
15. [POST /ops/readiness-reviews/{id}/complete](#15-post-ops-readiness-reviews-id-complete) — Cerrar la revisión de preparación con su decisión
16. [GET /ops/resilience-exercises](#16-get-ops-resilience-exercises) — Listar ejercicios de resiliencia del tenant
17. [POST /ops/resilience-exercises/{id}/complete](#17-post-ops-resilience-exercises-id-complete) — Cerrar un ejercicio de resiliencia
18. [POST /ops/runbook-executions](#18-post-ops-runbook-executions) — Registrar la ejecución de un runbook
19. [POST /ops/runbooks/{id}/versions](#19-post-ops-runbooks-id-versions) — Publicar una versión del runbook
20. [POST /ops/slo/{id}/measurements](#20-post-ops-slo-id-measurements) — Registrar la medición de una ventana del SLO

---

## 1. GET /ops/artifacts

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops-collections`
- **Nombre:** Listar artefactos del tenant
- **Operation ID:** `PlatformOpsCollectionsController_listArtifacts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsCollectionsController.listArtifacts](../../src/modules/platform_ops/controllers/platform-ops-collections.controller.ts)

### Descripción de negocio

Listar artefactos del tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: V46-02: listar artefactos del tenant.

### Descripción del sistema

NestJS resuelve `GET /ops/artifacts` en `PlatformOpsCollectionsController_listArtifacts`. El controlador delega en `PlatformOpsCollectionsService.listArtifacts`. No recibe body. El tipo de retorno estático es `Promise<ArtifactPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `page` | query | No | `number` | mínimo 1 | Página (1-based) | `1` |
| `pageSize` | query | No | `number` | mínimo 1; máximo 100 | Tamaño de página | `20` |
| `order` | query | No | `string` | valores: `ASC`, `DESC` | Sin descripción específica en OpenAPI. | `DESC` |
| `sortBy` | query | No | `string` | Sin restricción adicional declarada | Campo de ordenamiento. Debe ser un identificador de columna (letras, números, guión bajo); el servicio aplica además su propia allowlist de columnas ordenables | `createdAt` |
| `stateConceptId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /ops/artifacts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DEPLOY_PIPELINE`, `RELEASE_MANAGER`, `PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /ops/artifacts?page=1&pageSize=20&order=DESC&sortBy=createdAt&stateConceptId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ArtifactPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<ArtifactPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ArtifactPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ArtifactPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ArtifactPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ArtifactPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ArtifactPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "tenantId": {},
      "serviceComponentId": {},
      "producedByToolId": {},
      "artifactRef": "valor-ejemplo",
      "artifactTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "version": "valor-ejemplo",
      "semver": "valor-ejemplo",
      "gitRef": "valor-ejemplo",
      "commitSha": "valor-ejemplo",
      "storageUri": "valor-ejemplo",
      "fileId": {},
      "sizeBytes": 1,
      "isImmutable": true,
      "builtAt": "2026-07-31T12:00:00.000Z",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-07-31T12:00:00.000Z",
      "updatedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 1,
    "total": 1,
    "totalPages": 1
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `data` | Sí | `array<ArtifactItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","tenantId":{},"serviceComponentId":{},"producedByToolId":{},"artifactRef":"valor-ejemplo","artifactTypeConceptId":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","version":"valor-ejemplo","semver":"valor-ejemplo","gitRef":"valor-ejemplo","commitSha":"valor-ejemplo","storageUri":"valor-ejemplo","fileId":{},"sizeBytes":1,"isImmutable":true,"builtAt":"2026-07-31T12:00:00.000Z","stateConceptId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z"}]` |
| `data[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].tenantId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].serviceComponentId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].producedByToolId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].artifactRef` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].artifactTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `data[].version` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].semver` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].gitRef` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].commitSha` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].storageUri` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].fileId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].sizeBytes` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `data[].isImmutable` | No | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `data[].builtAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].stateConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `meta` | Sí | `PageMetaDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"page":1,"pageSize":1,"total":1,"totalPages":1}` |
| `meta.page` | Sí | `number` | Sin restricción adicional declarada | Página devuelta (1-based) | `1` |
| `meta.pageSize` | Sí | `number` | Sin restricción adicional declarada | Tamaño de página pedido | `1` |
| `meta.total` | Sí | `number` | Sin restricción adicional declarada | Total de filas que cumplen los filtros | `1` |
| `meta.totalPages` | Sí | `number` | Sin restricción adicional declarada | Total de páginas con ese tamaño | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DEPLOY_PIPELINE, RELEASE_MANAGER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/artifacts"
}
```

---

## 2. POST /ops/artifacts

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Publicar un artefacto inmutable
- **Operation ID:** `PlatformOpsController_publishArtifact`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.publishArtifact](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Direccionado por contenido: la misma referencia no se republica.


### Descripción del sistema

NestJS resuelve `POST /ops/artifacts` en `PlatformOpsController_publishArtifact`. El controlador delega en `OpsReleasesService.publishArtifact`. Valida el body como `PublishArtifactDto` y consume `application/json`. El tipo de retorno estático es `Promise<ArtifactResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishArtifactDto`; los campos opcionales se omiten.

```http
POST /ops/artifacts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "serviceComponentId": "00000000-0000-4000-8000-000000000001",
  "artifactRef": "valor-ejemplo",
  "artifactKind": "CONTAINER_IMAGE",
  "name": "Nombre de ejemplo",
  "version": "valor-ejemplo",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DEPLOY_PIPELINE`, `RELEASE_MANAGER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceComponentId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `producedByToolId` | No | `string` | formato `uuid` | Herramienta que lo construyó | `00000000-0000-4000-8000-000000000001` |
| `artifactRef` | Sí | `string` | longitud máxima 500 | Referencia única del artefacto | `valor-ejemplo` |
| `artifactKind` | Sí | `string` | valores: `CONTAINER_IMAGE`, `PACKAGE`, `BINARY`, `HELM_CHART`, `CONFIG_BUNDLE` | Sin descripción específica en el contrato OpenAPI. | `CONTAINER_IMAGE` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `version` | Sí | `string` | longitud máxima 100 | Versión publicada | `valor-ejemplo` |
| `semver` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `gitRef` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `commitSha` | No | `string` | longitud máxima 100 | SHA del commit | `valor-ejemplo` |
| `contentHash` | Sí | `string` | patrón runtime `/^[0-9a-f]{32,128}$/i` | Hash del contenido en hexadecimal; direcciona el artefacto | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `storageUri` | No | `string` | Sin restricción adicional declarada | URI del blob en almacenamiento de objetos | `valor-ejemplo` |
| `fileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sizeBytes` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `builtAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/artifacts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "serviceComponentId": "00000000-0000-4000-8000-000000000001",
  "producedByToolId": "00000000-0000-4000-8000-000000000001",
  "artifactRef": "valor-ejemplo",
  "artifactKind": "CONTAINER_IMAGE",
  "name": "Nombre de ejemplo",
  "version": "valor-ejemplo",
  "semver": "valor-ejemplo",
  "gitRef": "valor-ejemplo",
  "commitSha": "valor-ejemplo",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "storageUri": "valor-ejemplo",
  "fileId": "00000000-0000-4000-8000-000000000001",
  "sizeBytes": 1,
  "builtAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ArtifactResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "testRunId": "00000000-0000-4000-8000-000000000001",
  "artifactTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `testRunId` | Sí | `string` | formato `uuid` | Identificador asociado a test run. | `00000000-0000-4000-8000-000000000001` |
| `artifactTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a artifact type concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DEPLOY_PIPELINE, RELEASE_MANAGER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Componente no encontrado | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 404 | `NOT_FOUND` | Herramienta no encontrada | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 409 | `CONFLICT` | Ya existe un artefacto con esa referencia | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 409 | `CONFLICT` | El componente ya publicó esa versión | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La herramienta no está homologada | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/artifacts"
}
```

---

## 3. POST /ops/capacity-plans/{id}/measurements

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Registrar una medición de capacidad
- **Operation ID:** `PlatformOpsController_recordCapacityMeasurement`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.recordCapacityMeasurement](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Cruzar el guardrail declarado permite recomputar el plan en la misma operación.


### Descripción del sistema

NestJS resuelve `POST /ops/capacity-plans/{id}/measurements` en `PlatformOpsController_recordCapacityMeasurement`. El controlador delega en `OpsReliabilityService.recordCapacityMeasurement`. Valida el body como `RecordCapacityMeasurementDto` y consume `application/json`. El tipo de retorno estático es `Promise<CapacityMeasurementResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordCapacityMeasurementDto`; los campos opcionales se omiten.

```http
POST /ops/capacity-plans/00000000-0000-4000-8000-000000000001/measurements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "metric": "CPU",
  "observedValue": "valor-ejemplo",
  "capacityValue": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CAPACITY_PLANNER`, `SRE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `metric` | Sí | `string` | valores: `CPU`, `MEMORY`, `STORAGE`, `THROUGHPUT`, `CONNECTIONS` | Sin descripción específica en el contrato OpenAPI. | `CPU` |
| `observedValue` | Sí | `string` | Sin restricción adicional declarada | Valor observado, como cadena decimal | `valor-ejemplo` |
| `capacityValue` | Sí | `string` | Sin restricción adicional declarada | Capacidad disponible, como cadena decimal | `valor-ejemplo` |
| `measuredAt` | No | `string` | formato `date-time` | Cuándo se midió; por defecto, ahora | `2026-07-31T12:00:00.000Z` |
| `sourceReference` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `demandForecastJson` | No | `object` | Sin restricción adicional declarada | Previsión de demanda recalculada | `{}` |
| `scalingPolicyJson` | No | `object` | Sin restricción adicional declarada | Política de escalado recalculada | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/capacity-plans/00000000-0000-4000-8000-000000000001/measurements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "metric": "CPU",
  "observedValue": "valor-ejemplo",
  "capacityValue": "valor-ejemplo",
  "measuredAt": "2026-07-31T12:00:00.000Z",
  "sourceReference": "valor-ejemplo",
  "demandForecastJson": {},
  "scalingPolicyJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CapacityMeasurementResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "utilizationPercent": "valor-ejemplo",
  "guardrailCrossed": true,
  "planUpdated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `utilizationPercent` | Sí | `string` | Sin restricción adicional declarada | Utilización calculada en porcentaje, como cadena decimal | `valor-ejemplo` |
| `guardrailCrossed` | Sí | `boolean` | Sin restricción adicional declarada | true si la utilización cruzó el guardrail del plan | `true` |
| `planUpdated` | Sí | `boolean` | Sin restricción adicional declarada | true si el plan se recalculó en esta medición | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CAPACITY_PLANNER, SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Plan de capacidad no encontrado | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La capacidad debe ser mayor que cero | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | El plan de capacidad no está activo | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | La medición cae fuera del horizonte del plan | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/capacity-plans/{id}/measurements"
}
```

---

## 4. GET /ops/change-requests

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops-collections`
- **Nombre:** Listar solicitudes de cambio del tenant
- **Operation ID:** `PlatformOpsCollectionsController_listChangeRequests`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsCollectionsController.listChangeRequests](../../src/modules/platform_ops/controllers/platform-ops-collections.controller.ts)

### Descripción de negocio

Listar solicitudes de cambio del tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: V46-04: listar solicitudes de cambio del tenant.

### Descripción del sistema

NestJS resuelve `GET /ops/change-requests` en `PlatformOpsCollectionsController_listChangeRequests`. El controlador delega en `PlatformOpsCollectionsService.listChangeRequests`. No recibe body. El tipo de retorno estático es `Promise<ChangeRequestPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `page` | query | No | `number` | mínimo 1 | Página (1-based) | `1` |
| `pageSize` | query | No | `number` | mínimo 1; máximo 100 | Tamaño de página | `20` |
| `order` | query | No | `string` | valores: `ASC`, `DESC` | Sin descripción específica en OpenAPI. | `DESC` |
| `sortBy` | query | No | `string` | Sin restricción adicional declarada | Campo de ordenamiento. Debe ser un identificador de columna (letras, números, guión bajo); el servicio aplica además su propia allowlist de columnas ordenables | `createdAt` |
| `statusConceptId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /ops/change-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `RELEASE_MANAGER`, `PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /ops/change-requests?page=1&pageSize=20&order=DESC&sortBy=createdAt&statusConceptId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ChangeRequestPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<ChangeRequestPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ChangeRequestPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ChangeRequestPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ChangeRequestPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ChangeRequestPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ChangeRequestPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "tenantId": {},
      "serviceComponentId": "00000000-0000-4000-8000-000000000001",
      "deploymentId": {},
      "changeNumber": "valor-ejemplo",
      "title": "valor-ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "changeTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "riskLevelConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "requestedByUserId": {},
      "plannedStartAt": "2026-07-31T12:00:00.000Z",
      "plannedEndAt": "2026-07-31T12:00:00.000Z",
      "rollbackPlanText": "valor-ejemplo",
      "validationPlanText": "valor-ejemplo",
      "maintenanceWindowId": {},
      "implementedAt": "2026-07-31T12:00:00.000Z",
      "closedAt": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z",
      "updatedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 1,
    "total": 1,
    "totalPages": 1
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `data` | Sí | `array<ChangeRequestItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","tenantId":{},"serviceComponentId":"00000000-0000-4000-8000-000000000001","deploymentId":{},"changeNumber":"valor-ejemplo","title":"valor-ejemplo","description":"Texto descriptivo de ejemplo","changeTypeConceptId":"00000000-0000-4000-8000-000000000001","riskLevelConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","requestedByUserId":{},"plannedStartAt":"2026-07-31T12:00:00.000Z","plannedEndAt":"2026-07-31T12:00:00.000Z","rollbackPlanText":"valor-ejemplo","validationPlanText":"valor-ejemplo","maintenanceWindowId":{},"implementedAt":"2026-07-31T12:00:00.000Z","closedAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z"}]` |
| `data[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].tenantId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].serviceComponentId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].deploymentId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].changeNumber` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].title` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].description` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `data[].changeTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].riskLevelConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].statusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].requestedByUserId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].plannedStartAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].plannedEndAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].rollbackPlanText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].validationPlanText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].maintenanceWindowId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].implementedAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].closedAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `meta` | Sí | `PageMetaDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"page":1,"pageSize":1,"total":1,"totalPages":1}` |
| `meta.page` | Sí | `number` | Sin restricción adicional declarada | Página devuelta (1-based) | `1` |
| `meta.pageSize` | Sí | `number` | Sin restricción adicional declarada | Tamaño de página pedido | `1` |
| `meta.total` | Sí | `number` | Sin restricción adicional declarada | Total de filas que cumplen los filtros | `1` |
| `meta.totalPages` | Sí | `number` | Sin restricción adicional declarada | Total de páginas con ese tamaño | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: RELEASE_MANAGER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/change-requests"
}
```

---

## 5. POST /ops/change-requests

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Registrar una solicitud de cambio
- **Operation ID:** `PlatformOpsController_createChangeRequest`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.createChangeRequest](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Atarla a una ventana obliga a que el cambio quepa dentro de ella.


### Descripción del sistema

NestJS resuelve `POST /ops/change-requests` en `PlatformOpsController_createChangeRequest`. El controlador delega en `OpsReleasesService.createChangeRequest`. Valida el body como `CreateChangeRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<ChangeRequestResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateChangeRequestDto`; los campos opcionales se omiten.

```http
POST /ops/change-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "serviceComponentId": "00000000-0000-4000-8000-000000000001",
  "title": "valor-ejemplo",
  "changeType": "STANDARD",
  "risk": "LOW"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `RELEASE_MANAGER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceComponentId` | Sí | `string` | formato `uuid` | Componente afectado | `00000000-0000-4000-8000-000000000001` |
| `title` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `changeType` | Sí | `string` | valores: `STANDARD`, `NORMAL`, `EMERGENCY` | Sin descripción específica en el contrato OpenAPI. | `STANDARD` |
| `risk` | Sí | `string` | valores: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Sin descripción específica en el contrato OpenAPI. | `LOW` |
| `plannedStartAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `plannedEndAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `rollbackPlanText` | No | `string` | Sin restricción adicional declarada | Cómo se deshace el cambio si sale mal | `valor-ejemplo` |
| `validationPlanText` | No | `string` | Sin restricción adicional declarada | Cómo se comprueba que el cambio funcionó | `valor-ejemplo` |
| `maintenanceWindowId` | No | `string` | formato `uuid` | Ventana de mantenimiento a la que se ata | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/change-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "serviceComponentId": "00000000-0000-4000-8000-000000000001",
  "title": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "changeType": "STANDARD",
  "risk": "LOW",
  "plannedStartAt": "2026-07-31T12:00:00.000Z",
  "plannedEndAt": "2026-07-31T12:00:00.000Z",
  "rollbackPlanText": "valor-ejemplo",
  "validationPlanText": "valor-ejemplo",
  "maintenanceWindowId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ChangeRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "changeNumber": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `changeNumber` | Sí | `string` | Sin restricción adicional declarada | Número correlativo del cambio en el tenant | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: RELEASE_MANAGER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Componente no encontrado | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 404 | `NOT_FOUND` | Ventana de mantenimiento no encontrada | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 409 | `CONFLICT` | No se pudo asignar un número de cambio libre | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ventana planificada está invertida | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El componente no está activo | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana de mantenimiento está cerrada | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El cambio empieza antes que su ventana | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El cambio termina después que su ventana | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/change-requests"
}
```

---

## 6. POST /ops/change-requests/{id}/approvals

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Registrar la decisión del CAB
- **Operation ID:** `PlatformOpsController_recordApproval`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.recordApproval](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Quien solicita el cambio no lo aprueba, y los pasos se recorren en orden.


### Descripción del sistema

NestJS resuelve `POST /ops/change-requests/{id}/approvals` en `PlatformOpsController_recordApproval`. El controlador delega en `OpsReleasesService.recordApproval`. Valida el body como `RecordApprovalDto` y consume `application/json`. El tipo de retorno estático es `Promise<ApprovalResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordApprovalDto`; los campos opcionales se omiten.

```http
POST /ops/change-requests/00000000-0000-4000-8000-000000000001/approvals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "approvalStep": 1,
  "decision": "APPROVED"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CHANGE_APPROVER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `approvalStep` | Sí | `number` | mínimo 1 | Paso del recorrido de aprobación | `1` |
| `decision` | Sí | `string` | valores: `APPROVED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `decisionReason` | No | `string` | Sin restricción adicional declarada | Por qué se decide así | `Texto descriptivo de ejemplo` |
| `requiredApprovalSteps` | No | `number` | mínimo 1; máximo 5 | Pasos exigidos; por defecto, los pasos ya emitidos más éste | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/change-requests/00000000-0000-4000-8000-000000000001/approvals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "approvalStep": 1,
  "decision": "APPROVED",
  "decisionReason": "Texto descriptivo de ejemplo",
  "requiredApprovalSteps": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ApprovalResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "changeRequestId": "00000000-0000-4000-8000-000000000001",
  "changeStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "approvedSteps": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `changeRequestId` | Sí | `string` | formato `uuid` | Identificador asociado a change request. | `00000000-0000-4000-8000-000000000001` |
| `changeStatusConceptId` | Sí | `string` | formato `uuid` | Estado del cambio tras la decisión | `00000000-0000-4000-8000-000000000001` |
| `approvedSteps` | Sí | `number` | Sin restricción adicional declarada | Pasos aprobados hasta ahora | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CHANGE_APPROVER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud de cambio no encontrada | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 409 | `CONFLICT` | Ese aprobador ya votó en este paso | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La solicitud ya no admite decisiones | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | Quien solicita el cambio no puede aprobarlo | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El paso anterior todavía no está aprobado | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/change-requests/{id}/approvals"
}
```

---

## 7. GET /ops/deployments

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops-collections`
- **Nombre:** Listar despliegues del tenant
- **Operation ID:** `PlatformOpsCollectionsController_listDeployments`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsCollectionsController.listDeployments](../../src/modules/platform_ops/controllers/platform-ops-collections.controller.ts)

### Descripción de negocio

Listar despliegues del tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: V46-01: listar despliegues del tenant.

### Descripción del sistema

NestJS resuelve `GET /ops/deployments` en `PlatformOpsCollectionsController_listDeployments`. El controlador delega en `PlatformOpsCollectionsService.listDeployments`. No recibe body. El tipo de retorno estático es `Promise<DeploymentPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `page` | query | No | `number` | mínimo 1 | Página (1-based) | `1` |
| `pageSize` | query | No | `number` | mínimo 1; máximo 100 | Tamaño de página | `20` |
| `order` | query | No | `string` | valores: `ASC`, `DESC` | Sin descripción específica en OpenAPI. | `DESC` |
| `sortBy` | query | No | `string` | Sin restricción adicional declarada | Campo de ordenamiento. Debe ser un identificador de columna (letras, números, guión bajo); el servicio aplica además su propia allowlist de columnas ordenables | `createdAt` |
| `statusConceptId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /ops/deployments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `RELEASE_MANAGER`, `DEPLOY_PIPELINE`, `PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /ops/deployments?page=1&pageSize=20&order=DESC&sortBy=createdAt&statusConceptId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DeploymentPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<DeploymentPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<DeploymentPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<DeploymentPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<DeploymentPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<DeploymentPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeploymentPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "tenantId": {},
      "serviceComponentId": "00000000-0000-4000-8000-000000000001",
      "artifactId": "00000000-0000-4000-8000-000000000001",
      "environmentConceptId": "00000000-0000-4000-8000-000000000001",
      "deploymentNumber": "valor-ejemplo",
      "strategyConceptId": {},
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "deployedByUserId": {},
      "gitRef": "valor-ejemplo",
      "startedAt": "2026-07-31T12:00:00.000Z",
      "finishedAt": "2026-07-31T12:00:00.000Z",
      "isCurrent": true,
      "rollbackOfDeploymentId": {},
      "createdAt": "2026-07-31T12:00:00.000Z",
      "updatedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 1,
    "total": 1,
    "totalPages": 1
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `data` | Sí | `array<DeploymentItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","tenantId":{},"serviceComponentId":"00000000-0000-4000-8000-000000000001","artifactId":"00000000-0000-4000-8000-000000000001","environmentConceptId":"00000000-0000-4000-8000-000000000001","deploymentNumber":"valor-ejemplo","strategyConceptId":{},"statusConceptId":"00000000-0000-4000-8000-000000000001","deployedByUserId":{},"gitRef":"valor-ejemplo","startedAt":"2026-07-31T12:00:00.000Z","finishedAt":"2026-07-31T12:00:00.000Z","isCurrent":true,"rollbackOfDeploymentId":{},"createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z"}]` |
| `data[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].tenantId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].serviceComponentId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].artifactId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].environmentConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].deploymentNumber` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].strategyConceptId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].statusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].deployedByUserId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].gitRef` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].startedAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].finishedAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].isCurrent` | No | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `data[].rollbackOfDeploymentId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `meta` | Sí | `PageMetaDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"page":1,"pageSize":1,"total":1,"totalPages":1}` |
| `meta.page` | Sí | `number` | Sin restricción adicional declarada | Página devuelta (1-based) | `1` |
| `meta.pageSize` | Sí | `number` | Sin restricción adicional declarada | Tamaño de página pedido | `1` |
| `meta.total` | Sí | `number` | Sin restricción adicional declarada | Total de filas que cumplen los filtros | `1` |
| `meta.totalPages` | Sí | `number` | Sin restricción adicional declarada | Total de páginas con ese tamaño | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: RELEASE_MANAGER, DEPLOY_PIPELINE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/deployments"
}
```

---

## 8. POST /ops/deployments

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Ejecutar un despliegue
- **Operation ID:** `PlatformOpsController_createDeployment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.createDeployment](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Exige cambio aprobado, revisión de preparación con "go" en producción y ausencia de congelamiento.


### Descripción del sistema

NestJS resuelve `POST /ops/deployments` en `PlatformOpsController_createDeployment`. El controlador delega en `OpsReleasesService.createDeployment`. Valida el body como `CreateDeploymentDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeploymentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDeploymentDto`; los campos opcionales se omiten.

```http
POST /ops/deployments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "changeRequestId": "00000000-0000-4000-8000-000000000001",
  "artifactId": "00000000-0000-4000-8000-000000000001",
  "environment": "DEVELOPMENT",
  "strategy": "ROLLING"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `RELEASE_MANAGER`, `DEPLOY_PIPELINE`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `changeRequestId` | Sí | `string` | formato `uuid` | Cambio aprobado que lo habilita | `00000000-0000-4000-8000-000000000001` |
| `artifactId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `environment` | Sí | `string` | valores: `DEVELOPMENT`, `STAGING`, `PRODUCTION` | Sin descripción específica en el contrato OpenAPI. | `DEVELOPMENT` |
| `strategy` | Sí | `string` | valores: `ROLLING`, `BLUE_GREEN`, `CANARY`, `RECREATE` | Sin descripción específica en el contrato OpenAPI. | `ROLLING` |
| `gitRef` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `outcome` | No | `string` | valores: `SUCCEEDED`, `FAILED` | Desenlace si el pipeline ya terminó; si falta, queda en curso | `SUCCEEDED` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/deployments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "changeRequestId": "00000000-0000-4000-8000-000000000001",
  "artifactId": "00000000-0000-4000-8000-000000000001",
  "environment": "DEVELOPMENT",
  "strategy": "ROLLING",
  "gitRef": "valor-ejemplo",
  "outcome": "SUCCEEDED"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeploymentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "deploymentNumber": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "isCurrent": true,
  "supersededDeploymentId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `deploymentNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de deployment number mantenido por la instancia. | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `isCurrent` | Sí | `boolean` | Sin restricción adicional declarada | true si pasa a ser el despliegue vigente del entorno | `true` |
| `supersededDeploymentId` | No | `string` | formato `uuid` | Despliegue que deja de ser vigente | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: RELEASE_MANAGER, DEPLOY_PIPELINE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud de cambio no encontrada | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 404 | `NOT_FOUND` | Artefacto no encontrado | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 409 | `CONFLICT` | No se pudo asignar un número de despliegue libre | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El cambio no está aprobado | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El artefacto no está activo | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El artefacto pertenece a otro componente | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | Producción exige una revisión de preparación con decisión "go" | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | Los despliegues están congelados por agotamiento del error budget | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/deployments"
}
```

---

## 9. POST /ops/deployments/{id}/rollback

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Revertir un despliegue
- **Operation ID:** `PlatformOpsController_rollbackDeployment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.rollbackDeployment](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Crea un despliegue nuevo al artefacto estable anterior; el fallido queda revertido.


### Descripción del sistema

NestJS resuelve `POST /ops/deployments/{id}/rollback` en `PlatformOpsController_rollbackDeployment`. El controlador delega en `OpsReleasesService.rollbackDeployment`. Valida el body como `RollbackDeploymentDto` y consume `application/json`. El tipo de retorno estático es `Promise<RollbackResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RollbackDeploymentDto`; los campos opcionales se omiten.

```http
POST /ops/deployments/00000000-0000-4000-8000-000000000001/rollback HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SRE`, `RELEASE_MANAGER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | Sin restricción adicional declarada | Por qué se revierte | `Texto descriptivo de ejemplo` |
| `targetDeploymentId` | No | `string` | formato `uuid` | Despliegue estable al que volver; por defecto, el correcto anterior | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/deployments/00000000-0000-4000-8000-000000000001/rollback HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo",
  "targetDeploymentId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RollbackResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RollbackResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "deploymentNumber": "valor-ejemplo",
  "rolledBackDeploymentId": "00000000-0000-4000-8000-000000000001",
  "artifactId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Despliegue de reversión creado | `00000000-0000-4000-8000-000000000001` |
| `deploymentNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de deployment number mantenido por la instancia. | `valor-ejemplo` |
| `rolledBackDeploymentId` | Sí | `string` | formato `uuid` | Despliegue revertido | `00000000-0000-4000-8000-000000000001` |
| `artifactId` | Sí | `string` | formato `uuid` | Artefacto al que se vuelve | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SRE, RELEASE_MANAGER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Despliegue no encontrado | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 409 | `CONFLICT` | No se pudo asignar un número de despliegue libre | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El despliegue no está en un estado reversible | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El despliegue ya no es el vigente | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay un despliegue estable anterior al que volver | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El destino de la reversión es de otro componente o entorno | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/deployments/{id}/rollback"
}
```

---

## 10. POST /ops/error-budget/{policyId}/burn-events

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Registrar la quema del presupuesto de error
- **Operation ID:** `PlatformOpsController_recordBurnEvent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.recordBurnEvent](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Agotarlo con la política puesta a congelar bloquea los despliegues.


### Descripción del sistema

NestJS resuelve `POST /ops/error-budget/{policyId}/burn-events` en `PlatformOpsController_recordBurnEvent`. El controlador delega en `OpsReliabilityService.recordBurnEvent`. Valida el body como `RecordBurnEventDto` y consume `application/json`. El tipo de retorno estático es `Promise<BurnEventResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `policyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordBurnEventDto`; los campos opcionales se omiten.

```http
POST /ops/error-budget/00000000-0000-4000-8000-000000000001/burn-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "windowSeconds": "valor-ejemplo",
  "burnRate": "valor-ejemplo",
  "remainingBudgetPercent": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SRE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `policyId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `windowSeconds` | Sí | `string` | Sin restricción adicional declarada | Ventana evaluada en segundos; cadena por ser bigint | `valor-ejemplo` |
| `burnRate` | Sí | `string` | Sin restricción adicional declarada | Ritmo de consumo del presupuesto, como cadena decimal | `valor-ejemplo` |
| `remainingBudgetPercent` | Sí | `string` | Sin restricción adicional declarada | Presupuesto restante en porcentaje, como cadena decimal | `valor-ejemplo` |
| `actionTakenJson` | No | `object` | Sin restricción adicional declarada | Qué se hizo al detectarlo | `{}` |
| `healthIncidentId` | No | `string` | formato `uuid` | Incidente de fiabilidad asociado | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/error-budget/00000000-0000-4000-8000-000000000001/burn-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "windowSeconds": "valor-ejemplo",
  "burnRate": "valor-ejemplo",
  "remainingBudgetPercent": "valor-ejemplo",
  "actionTakenJson": {},
  "healthIncidentId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BurnEventResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "deploymentFreezeActive": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `severityConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a severity concept. | `00000000-0000-4000-8000-000000000001` |
| `deploymentFreezeActive` | Sí | `boolean` | Sin restricción adicional declarada | true si a partir de ahora los despliegues quedan congelados | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Política de error budget no encontrada | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La política no está activa | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | La política no tiene ninguna medición del objetivo sobre la que evaluar | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | El ritmo de quema no alcanza el umbral de aviso de la política | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/error-budget/{policyId}/burn-events"
}
```

---

## 11. POST /ops/health-checks/{id}/runs

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Registrar una corrida de health check
- **Operation ID:** `PlatformOpsController_recordHealthRun`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.recordHealthRun](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Alcanzar el umbral de fallos consecutivos abre el incidente, sin duplicarlo.


### Descripción del sistema

NestJS resuelve `POST /ops/health-checks/{id}/runs` en `PlatformOpsController_recordHealthRun`. El controlador delega en `OpsIncidentsService.recordHealthRun`. Valida el body como `RecordHealthRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<HealthRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordHealthRunDto`; los campos opcionales se omiten.

```http
POST /ops/health-checks/00000000-0000-4000-8000-000000000001/runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "PASS",
  "source": "SCHEDULER"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SRE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `PASS`, `WARN`, `FAIL`, `TIMEOUT`, `ERROR` | Sin descripción específica en el contrato OpenAPI. | `PASS` |
| `source` | Sí | `string` | valores: `SCHEDULER`, `PROBE`, `MANUAL` | Sin descripción específica en el contrato OpenAPI. | `SCHEDULER` |
| `latencyMs` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `httpStatus` | No | `number` | mínimo 100; máximo 599 | Sin descripción específica en el contrato OpenAPI. | `100` |
| `observedValue` | No | `string` | Sin restricción adicional declarada | Valor observado, como cadena para no perder precisión | `valor-ejemplo` |
| `message` | No | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `deploymentId` | No | `string` | formato `uuid` | Despliegue bajo el que se observa | `00000000-0000-4000-8000-000000000001` |
| `startedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `finishedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/health-checks/00000000-0000-4000-8000-000000000001/runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "PASS",
  "source": "SCHEDULER",
  "latencyMs": 1,
  "httpStatus": 100,
  "observedValue": "valor-ejemplo",
  "message": "valor-ejemplo",
  "deploymentId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "finishedAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HealthRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "consecutiveFailures": 1,
  "healthIncidentId": "00000000-0000-4000-8000-000000000001",
  "incidentOpened": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `consecutiveFailures` | Sí | `number` | Sin restricción adicional declarada | Fallos consecutivos acumulados tras esta corrida | `1` |
| `healthIncidentId` | No | `string` | formato `uuid` | Incidente abierto o ya vivo | `00000000-0000-4000-8000-000000000001` |
| `incidentOpened` | Sí | `boolean` | Sin restricción adicional declarada | true si esta corrida abrió el incidente | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Health check no encontrado | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El health check no está activo | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 422 | `PRECONDITION_FAILED` | El health check está deshabilitado | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/health-checks/{id}/runs"
}
```

---

## 12. GET /ops/incidents

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops-collections`
- **Nombre:** Listar incidentes de salud del tenant
- **Operation ID:** `PlatformOpsCollectionsController_listIncidents`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsCollectionsController.listIncidents](../../src/modules/platform_ops/controllers/platform-ops-collections.controller.ts)

### Descripción de negocio

Listar incidentes de salud del tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: V46-08: listar incidentes de salud del tenant.

### Descripción del sistema

NestJS resuelve `GET /ops/incidents` en `PlatformOpsCollectionsController_listIncidents`. El controlador delega en `PlatformOpsCollectionsService.listIncidents`. No recibe body. El tipo de retorno estático es `Promise<HealthIncidentPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `page` | query | No | `number` | mínimo 1 | Página (1-based) | `1` |
| `pageSize` | query | No | `number` | mínimo 1; máximo 100 | Tamaño de página | `20` |
| `order` | query | No | `string` | valores: `ASC`, `DESC` | Sin descripción específica en OpenAPI. | `DESC` |
| `sortBy` | query | No | `string` | Sin restricción adicional declarada | Campo de ordenamiento. Debe ser un identificador de columna (letras, números, guión bajo); el servicio aplica además su propia allowlist de columnas ordenables | `createdAt` |
| `statusConceptId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /ops/incidents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `INCIDENT_COMMANDER`, `SRE`, `PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /ops/incidents?page=1&pageSize=20&order=DESC&sortBy=createdAt&statusConceptId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<HealthIncidentPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<HealthIncidentPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<HealthIncidentPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<HealthIncidentPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<HealthIncidentPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<HealthIncidentPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HealthIncidentPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "tenantId": {},
      "serviceComponentId": "00000000-0000-4000-8000-000000000001",
      "healthCheckId": {},
      "incidentNumber": "valor-ejemplo",
      "severityConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "title": "valor-ejemplo",
      "detectedByRunId": {},
      "openedAt": "2026-07-31T12:00:00.000Z",
      "acknowledgedAt": "2026-07-31T12:00:00.000Z",
      "resolvedAt": "2026-07-31T12:00:00.000Z",
      "rootCauseText": "valor-ejemplo",
      "resolutionText": "valor-ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z",
      "updatedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 1,
    "total": 1,
    "totalPages": 1
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `data` | Sí | `array<HealthIncidentItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","tenantId":{},"serviceComponentId":"00000000-0000-4000-8000-000000000001","healthCheckId":{},"incidentNumber":"valor-ejemplo","severityConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","title":"valor-ejemplo","detectedByRunId":{},"openedAt":"2026-07-31T12:00:00.000Z","acknowledgedAt":"2026-07-31T12:00:00.000Z","resolvedAt":"2026-07-31T12:00:00.000Z","rootCauseText":"valor-ejemplo","resolutionText":"valor-ejemplo","createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z"}]` |
| `data[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].tenantId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].serviceComponentId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].healthCheckId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].incidentNumber` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].severityConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].statusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].title` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].detectedByRunId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].openedAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].acknowledgedAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].resolvedAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].rootCauseText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].resolutionText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `meta` | Sí | `PageMetaDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"page":1,"pageSize":1,"total":1,"totalPages":1}` |
| `meta.page` | Sí | `number` | Sin restricción adicional declarada | Página devuelta (1-based) | `1` |
| `meta.pageSize` | Sí | `number` | Sin restricción adicional declarada | Tamaño de página pedido | `1` |
| `meta.total` | Sí | `number` | Sin restricción adicional declarada | Total de filas que cumplen los filtros | `1` |
| `meta.totalPages` | Sí | `number` | Sin restricción adicional declarada | Total de páginas con ese tamaño | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: INCIDENT_COMMANDER, SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/incidents"
}
```

---

## 13. PATCH /ops/incidents/{id}

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Mover el incidente, sumar respondientes y publicar comunicaciones
- **Operation ID:** `PlatformOpsController_updateIncident`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.updateIncident](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Resolver exige causa raíz y descripción de la resolución.


### Descripción del sistema

NestJS resuelve `PATCH /ops/incidents/{id}` en `PlatformOpsController_updateIncident`. El controlador delega en `OpsIncidentsService.updateIncident`. Valida el body como `UpdateIncidentDto` y consume `application/json`. El tipo de retorno estático es `Promise<IncidentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateIncidentDto`; los campos opcionales se omiten.

```http
PATCH /ops/incidents/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "transition": "ACKNOWLEDGE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `INCIDENT_COMMANDER`, `SRE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `transition` | Sí | `string` | valores: `ACKNOWLEDGE`, `MITIGATE`, `RESOLVE`, `UPDATE` | `UPDATE` sólo añade sin mover el estado | `ACKNOWLEDGE` |
| `summary` | No | `string` | longitud máxima 1000 | Qué se apunta en el timeline | `valor-ejemplo` |
| `rootCauseText` | No | `string` | Sin restricción adicional declarada | Causa raíz; obligatoria al resolver | `valor-ejemplo` |
| `resolutionText` | No | `string` | Sin restricción adicional declarada | Cómo se resolvió; obligatoria al resolver | `valor-ejemplo` |
| `responders` | No | `array<IncidentResponderDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"userId":"00000000-0000-4000-8000-000000000001","role":"COMMANDER","acknowledged":true}]` |
| `responders[].userId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `responders[].role` | No | `string` | valores: `COMMANDER`, `OPERATIONS`, `COMMUNICATIONS`, `SCRIBE` | Sin descripción específica en el contrato OpenAPI. | `COMMANDER` |
| `responders[].acknowledged` | No | `boolean` | Sin restricción adicional declarada | true si el respondiente ya acusó recibo | `true` |
| `communications` | No | `array<IncidentCommunicationDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"type":"STATUS_UPDATE","audience":"INTERNAL","messageText":"valor-ejemplo","channelReference":"valor-ejemplo"}]` |
| `communications[].type` | No | `string` | valores: `STATUS_UPDATE`, `ESCALATION`, `RESOLUTION` | Sin descripción específica en el contrato OpenAPI. | `STATUS_UPDATE` |
| `communications[].audience` | No | `string` | valores: `INTERNAL`, `CUSTOMERS`, `REGULATORS` | Sin descripción específica en el contrato OpenAPI. | `INTERNAL` |
| `communications[].messageText` | No | `string` | longitud máxima 4000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `communications[].channelReference` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /ops/incidents/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "transition": "ACKNOWLEDGE",
  "summary": "valor-ejemplo",
  "rootCauseText": "valor-ejemplo",
  "resolutionText": "valor-ejemplo",
  "responders": [
    {
      "userId": "00000000-0000-4000-8000-000000000001",
      "role": "COMMANDER",
      "acknowledged": true
    }
  ],
  "communications": [
    {
      "type": "STATUS_UPDATE",
      "audience": "INTERNAL",
      "messageText": "valor-ejemplo",
      "channelReference": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IncidentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "addedResponderIds": [
    "valor-ejemplo"
  ],
  "communicationIds": [
    "valor-ejemplo"
  ],
  "timelineEventIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `addedResponderIds` | Sí | `array<string>` | formato `uuid` | Respondientes añadidos | `["valor-ejemplo"]` |
| `communicationIds` | Sí | `array<string>` | formato `uuid` | Comunicaciones publicadas | `["valor-ejemplo"]` |
| `timelineEventIds` | Sí | `array<string>` | formato `uuid` | Entradas de timeline creadas | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: INCIDENT_COMMANDER, SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Incidente no encontrado | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El incidente ya está resuelto | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 422 | `PRECONDITION_FAILED` | La transición no es válida desde el estado actual | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 422 | `PRECONDITION_FAILED` | Resolver exige causa raíz y descripción de la resolución | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/incidents/{id}"
}
```

---

## 14. POST /ops/incidents/{id}/postmortem

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Abrir el postmortem del incidente resuelto
- **Operation ID:** `PlatformOpsController_openPostmortem`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.openPostmortem](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Cada acción entra además al backlog de mejoras para su seguimiento.


### Descripción del sistema

NestJS resuelve `POST /ops/incidents/{id}/postmortem` en `PlatformOpsController_openPostmortem`. El controlador delega en `OpsIncidentsService.openPostmortem`. Valida el body como `OpenPostmortemDto` y consume `application/json`. El tipo de retorno estático es `Promise<PostmortemResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `OpenPostmortemDto`; los campos opcionales se omiten.

```http
POST /ops/incidents/00000000-0000-4000-8000-000000000001/postmortem HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "title": "valor-ejemplo",
  "ownerUserId": "00000000-0000-4000-8000-000000000001",
  "actionItems": [
    {
      "actionCode": "CODIGO_EJEMPLO",
      "description": "Texto descriptivo de ejemplo",
      "actionType": "PREVENTIVE",
      "ownerUserId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SRE`, `INCIDENT_COMMANDER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `title` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `ownerUserId` | Sí | `string` | formato `uuid` | Quién conduce el postmortem | `00000000-0000-4000-8000-000000000001` |
| `impactSummary` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `detectionSummary` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `responseSummary` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rootCauseSummary` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `contributingFactorsJson` | No | `object` | Sin restricción adicional declarada | Factores contribuyentes | `{}` |
| `lessonsLearned` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `actionItems` | Sí | `array<ActionItemDto>` | mínimo 1 elemento(s) | Un postmortem sin acciones no cambia nada | `[{"actionCode":"CODIGO_EJEMPLO","description":"Texto descriptivo de ejemplo","actionType":"PREVENTIVE","ownerUserId":"00000000-0000-4000-8000-000000000001","dueAt":"2026-07-31T12:00:00.000Z","priority":"MEDIUM"}]` |
| `actionItems[].actionCode` | Sí | `string` | longitud máxima 50 | Código de la acción, único en el postmortem | `CODIGO_EJEMPLO` |
| `actionItems[].description` | Sí | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `actionItems[].actionType` | Sí | `string` | valores: `PREVENTIVE`, `CORRECTIVE`, `DETECTIVE`, `PROCESS` | Sin descripción específica en el contrato OpenAPI. | `PREVENTIVE` |
| `actionItems[].ownerUserId` | Sí | `string` | formato `uuid` | Quién responde de la acción | `00000000-0000-4000-8000-000000000001` |
| `actionItems[].dueAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `actionItems[].priority` | No | `string` | valores: `LOW`, `MEDIUM`, `HIGH` | Sin descripción específica en el contrato OpenAPI. | `MEDIUM` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/incidents/00000000-0000-4000-8000-000000000001/postmortem HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "title": "valor-ejemplo",
  "ownerUserId": "00000000-0000-4000-8000-000000000001",
  "impactSummary": "valor-ejemplo",
  "detectionSummary": "valor-ejemplo",
  "responseSummary": "valor-ejemplo",
  "rootCauseSummary": "valor-ejemplo",
  "contributingFactorsJson": {},
  "lessonsLearned": "valor-ejemplo",
  "actionItems": [
    {
      "actionCode": "CODIGO_EJEMPLO",
      "description": "Texto descriptivo de ejemplo",
      "actionType": "PREVENTIVE",
      "ownerUserId": "00000000-0000-4000-8000-000000000001",
      "dueAt": "2026-07-31T12:00:00.000Z",
      "priority": "MEDIUM"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PostmortemResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "actionItemIds": [
    "valor-ejemplo"
  ],
  "improvementItemIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `actionItemIds` | Sí | `array<string>` | formato `uuid` | Valor de action item ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `improvementItemIds` | Sí | `array<string>` | formato `uuid` | Mejoras abiertas para seguimiento | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SRE, INCIDENT_COMMANDER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Incidente no encontrado | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 409 | `CONFLICT` | El incidente ya tiene postmortem | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El incidente todavía no está resuelto | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 422 | `PRECONDITION_FAILED` | El código de acción está repetido | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/incidents/{id}/postmortem"
}
```

---

## 15. POST /ops/readiness-reviews/{id}/complete

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Cerrar la revisión de preparación con su decisión
- **Operation ID:** `PlatformOpsController_completeReadinessReview`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.completeReadinessReview](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Un hallazgo crítico o alto sin resolver impide el "go".


### Descripción del sistema

NestJS resuelve `POST /ops/readiness-reviews/{id}/complete` en `PlatformOpsController_completeReadinessReview`. El controlador delega en `OpsPracticesService.completeReadinessReview`. Valida el body como `CompleteReadinessReviewDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReadinessReviewResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CompleteReadinessReviewDto`; los campos opcionales se omiten.

```http
POST /ops/readiness-reviews/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "GO",
  "improvementOwnerUserId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `RELEASE_MANAGER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `GO`, `NO_GO` | Sin descripción específica en el contrato OpenAPI. | `GO` |
| `resolvedFindings` | No | `array<ResolvedFindingDto>` | Sin restricción adicional declarada | Hallazgos que se cierran | `[{"findingId":"00000000-0000-4000-8000-000000000001","evidenceJson":{}}]` |
| `resolvedFindings[].findingId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `resolvedFindings[].evidenceJson` | No | `object` | Sin restricción adicional declarada | Evidencia del cierre | `{}` |
| `evidenceJson` | No | `object` | Sin restricción adicional declarada | Evidencia de la revisión | `{}` |
| `improvementOwnerUserId` | Sí | `string` | formato `uuid` | Quién responde de los hallazgos que quedan abiertos | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/readiness-reviews/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "GO",
  "resolvedFindings": [
    {
      "findingId": "00000000-0000-4000-8000-000000000001",
      "evidenceJson": {}
    }
  ],
  "evidenceJson": {},
  "improvementOwnerUserId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReadinessReviewResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "decisionConceptId": "00000000-0000-4000-8000-000000000001",
  "resolvedCount": 1,
  "improvementItemIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `decisionConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a decision concept. | `00000000-0000-4000-8000-000000000001` |
| `resolvedCount` | Sí | `number` | Sin restricción adicional declarada | Hallazgos cerrados en esta operación | `1` |
| `improvementItemIds` | Sí | `array<string>` | formato `uuid` | Mejoras abiertas por lo que queda | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: RELEASE_MANAGER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Revisión de preparación no encontrada | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 404 | `NOT_FOUND` | El hallazgo no pertenece a esta revisión | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 409 | `CONFLICT` | El hallazgo ya no está abierto | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La revisión no está en curso | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 422 | `PRECONDITION_FAILED` | Quedan hallazgos críticos o altos sin resolver | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/readiness-reviews/{id}/complete"
}
```

---

## 16. GET /ops/resilience-exercises

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops-collections`
- **Nombre:** Listar ejercicios de resiliencia del tenant
- **Operation ID:** `PlatformOpsCollectionsController_listResilienceExercises`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsCollectionsController.listResilienceExercises](../../src/modules/platform_ops/controllers/platform-ops-collections.controller.ts)

### Descripción de negocio

Listar ejercicios de resiliencia del tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: V46-11: listar ejercicios de resiliencia del tenant.

### Descripción del sistema

NestJS resuelve `GET /ops/resilience-exercises` en `PlatformOpsCollectionsController_listResilienceExercises`. El controlador delega en `PlatformOpsCollectionsService.listResilienceExercises`. No recibe body. El tipo de retorno estático es `Promise<ResilienceExercisePageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `page` | query | No | `number` | mínimo 1 | Página (1-based) | `1` |
| `pageSize` | query | No | `number` | mínimo 1; máximo 100 | Tamaño de página | `20` |
| `order` | query | No | `string` | valores: `ASC`, `DESC` | Sin descripción específica en OpenAPI. | `DESC` |
| `sortBy` | query | No | `string` | Sin restricción adicional declarada | Campo de ordenamiento. Debe ser un identificador de columna (letras, números, guión bajo); el servicio aplica además su propia allowlist de columnas ordenables | `createdAt` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /ops/resilience-exercises HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SRE`, `PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /ops/resilience-exercises?page=1&pageSize=20&order=DESC&sortBy=createdAt HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ResilienceExercisePageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<ResilienceExercisePageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ResilienceExercisePageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ResilienceExercisePageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ResilienceExercisePageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ResilienceExercisePageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResilienceExercisePageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "tenantId": {},
      "serviceComponentId": "00000000-0000-4000-8000-000000000001",
      "exerciseTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "scenarioName": "Nombre de ejemplo",
      "hypothesisText": "valor-ejemplo",
      "plannedAt": "2026-07-31T12:00:00.000Z",
      "startedAt": "2026-07-31T12:00:00.000Z",
      "endedAt": "2026-07-31T12:00:00.000Z",
      "resultConceptId": "00000000-0000-4000-8000-000000000001",
      "observedRtoSeconds": "valor-ejemplo",
      "observedRpoSeconds": "valor-ejemplo",
      "evidenceUri": "valor-ejemplo",
      "findingsJson": {
        "clave": "valor"
      },
      "createdAt": "2026-07-31T12:00:00.000Z",
      "updatedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 1,
    "total": 1,
    "totalPages": 1
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `data` | Sí | `array<ResilienceExerciseItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","tenantId":{},"serviceComponentId":"00000000-0000-4000-8000-000000000001","exerciseTypeConceptId":"00000000-0000-4000-8000-000000000001","scenarioName":"Nombre de ejemplo","hypothesisText":"valor-ejemplo","plannedAt":"2026-07-31T12:00:00.000Z","startedAt":"2026-07-31T12:00:00.000Z","endedAt":"2026-07-31T12:00:00.000Z","resultConceptId":"00000000-0000-4000-8000-000000000001","observedRtoSeconds":"valor-ejemplo","observedRpoSeconds":"valor-ejemplo","evidenceUri":"valor-ejemplo","findingsJson":{"clave":"valor"},"createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z"}]` |
| `data[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].tenantId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].serviceComponentId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].exerciseTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].scenarioName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `data[].hypothesisText` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].plannedAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].startedAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].endedAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].resultConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].observedRtoSeconds` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].observedRpoSeconds` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].evidenceUri` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].findingsJson` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"clave":"valor"}` |
| `data[].createdAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `meta` | Sí | `PageMetaDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"page":1,"pageSize":1,"total":1,"totalPages":1}` |
| `meta.page` | Sí | `number` | Sin restricción adicional declarada | Página devuelta (1-based) | `1` |
| `meta.pageSize` | Sí | `number` | Sin restricción adicional declarada | Tamaño de página pedido | `1` |
| `meta.total` | Sí | `number` | Sin restricción adicional declarada | Total de filas que cumplen los filtros | `1` |
| `meta.totalPages` | Sí | `number` | Sin restricción adicional declarada | Total de páginas con ese tamaño | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/resilience-exercises"
}
```

---

## 17. POST /ops/resilience-exercises/{id}/complete

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Cerrar un ejercicio de resiliencia
- **Operation ID:** `PlatformOpsController_completeResilienceExercise`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.completeResilienceExercise](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

El resultado se deriva de comparar lo observado con el objetivo de recuperación.


### Descripción del sistema

NestJS resuelve `POST /ops/resilience-exercises/{id}/complete` en `PlatformOpsController_completeResilienceExercise`. El controlador delega en `OpsPracticesService.completeResilienceExercise`. Valida el body como `CompleteResilienceExerciseDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResilienceExerciseResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CompleteResilienceExerciseDto`; los campos opcionales se omiten.

```http
POST /ops/resilience-exercises/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "startedAt": "2026-07-31T12:00:00.000Z",
  "endedAt": "2026-07-31T12:00:00.000Z",
  "observedRtoSeconds": "900",
  "improvementOwnerUserId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SRE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `startedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `endedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `observedRtoSeconds` | Sí | `string` | Sin restricción adicional declarada | Tiempo de recuperación observado en segundos; cadena por ser bigint | `900` |
| `observedRpoSeconds` | No | `string` | Sin restricción adicional declarada | Pérdida de datos observada en segundos; cadena por ser bigint | `300` |
| `evidenceUri` | No | `string` | Sin restricción adicional declarada | URI de la evidencia | `valor-ejemplo` |
| `findingsJson` | No | `object` | Sin restricción adicional declarada | Hallazgos del ejercicio | `{}` |
| `improvementOwnerUserId` | Sí | `string` | formato `uuid` | Quién responde de la mejora si se incumple el objetivo | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/resilience-exercises/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "startedAt": "2026-07-31T12:00:00.000Z",
  "endedAt": "2026-07-31T12:00:00.000Z",
  "observedRtoSeconds": "900",
  "observedRpoSeconds": "300",
  "evidenceUri": "valor-ejemplo",
  "findingsJson": {},
  "improvementOwnerUserId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResilienceExerciseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "resultConceptId": "00000000-0000-4000-8000-000000000001",
  "rtoBreached": true,
  "rpoBreached": true,
  "improvementItemId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `resultConceptId` | Sí | `string` | formato `uuid` | Resultado derivado de comparar con el objetivo | `00000000-0000-4000-8000-000000000001` |
| `rtoBreached` | Sí | `boolean` | Sin restricción adicional declarada | true si el RTO observado supera el objetivo | `true` |
| `rpoBreached` | Sí | `boolean` | Sin restricción adicional declarada | true si el RPO observado supera el objetivo | `true` |
| `improvementItemId` | No | `string` | formato `uuid` | Mejora abierta por el incumplimiento | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ejercicio de resiliencia no encontrado | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 409 | `CONFLICT` | El ejercicio ya está cerrado | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El ejercicio termina antes de empezar | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 422 | `PRECONDITION_FAILED` | El componente no tiene objetivo de recuperación vigente | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/resilience-exercises/{id}/complete"
}
```

---

## 18. POST /ops/runbook-executions

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Registrar la ejecución de un runbook
- **Operation ID:** `PlatformOpsController_recordRunbookExecution`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.recordRunbookExecution](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Si se ejecutó en un incidente, queda también en su timeline.


### Descripción del sistema

NestJS resuelve `POST /ops/runbook-executions` en `PlatformOpsController_recordRunbookExecution`. El controlador delega en `OpsPracticesService.recordRunbookExecution`. Valida el body como `RecordRunbookExecutionDto` y consume `application/json`. El tipo de retorno estático es `Promise<RunbookExecutionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordRunbookExecutionDto`; los campos opcionales se omiten.

```http
POST /ops/runbook-executions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "runbookVersionId": "00000000-0000-4000-8000-000000000001",
  "mode": "MANUAL",
  "result": "SUCCESS",
  "startedAt": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SRE`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `runbookVersionId` | Sí | `string` | formato `uuid` | Versión ejecutada | `00000000-0000-4000-8000-000000000001` |
| `mode` | Sí | `string` | valores: `MANUAL`, `ASSISTED`, `AUTOMATED` | Sin descripción específica en el contrato OpenAPI. | `MANUAL` |
| `result` | Sí | `string` | valores: `SUCCESS`, `PARTIAL`, `FAILED`, `ABORTED` | Sin descripción específica en el contrato OpenAPI. | `SUCCESS` |
| `startedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `endedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `healthIncidentId` | No | `string` | formato `uuid` | Incidente en el que se ejecutó | `00000000-0000-4000-8000-000000000001` |
| `changeRequestId` | No | `string` | formato `uuid` | Cambio en el que se ejecutó | `00000000-0000-4000-8000-000000000001` |
| `executionLogUri` | No | `string` | Sin restricción adicional declarada | URI del log de ejecución | `valor-ejemplo` |
| `outputJson` | No | `object` | Sin restricción adicional declarada | Salida de la ejecución | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/runbook-executions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "runbookVersionId": "00000000-0000-4000-8000-000000000001",
  "mode": "MANUAL",
  "result": "SUCCESS",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "endedAt": "2026-07-31T12:00:00.000Z",
  "healthIncidentId": "00000000-0000-4000-8000-000000000001",
  "changeRequestId": "00000000-0000-4000-8000-000000000001",
  "executionLogUri": "valor-ejemplo",
  "outputJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RunbookExecutionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "resultConceptId": "00000000-0000-4000-8000-000000000001",
  "timelineEventId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `resultConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a result concept. | `00000000-0000-4000-8000-000000000001` |
| `timelineEventId` | No | `string` | formato `uuid` | Entrada de timeline si la ejecución fue en un incidente | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión de runbook no encontrada | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 404 | `NOT_FOUND` | Incidente no encontrado | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ejecución termina antes de empezar | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/runbook-executions"
}
```

---

## 19. POST /ops/runbooks/{id}/versions

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Publicar una versión del runbook
- **Operation ID:** `PlatformOpsController_publishRunbookVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.publishRunbookVersion](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

La versión es inmutable y pasa a ser la vigente.


### Descripción del sistema

NestJS resuelve `POST /ops/runbooks/{id}/versions` en `PlatformOpsController_publishRunbookVersion`. El controlador delega en `OpsPracticesService.publishRunbookVersion`. Valida el body como `PublishRunbookVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<RunbookVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishRunbookVersionDto`; los campos opcionales se omiten.

```http
POST /ops/runbooks/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "contentMarkdown": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SRE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `contentMarkdown` | Sí | `string` | Sin restricción adicional declarada | Contenido del runbook en Markdown | `valor-ejemplo` |
| `automationDefinitionJson` | No | `object` | Sin restricción adicional declarada | Definición de la automatización asociada | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/runbooks/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "contentMarkdown": "valor-ejemplo",
  "automationDefinitionJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RunbookVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "runbookId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Número de versión, correlativo dentro del runbook | `1` |
| `runbookId` | Sí | `string` | formato `uuid` | Versión que pasa a ser la vigente del runbook | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Runbook no encontrado | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 409 | `CONFLICT` | Esa versión del runbook ya existe | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El runbook no está activo | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/runbooks/{id}/versions"
}
```

---

## 20. POST /ops/slo/{id}/measurements

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Registrar la medición de una ventana del SLO
- **Operation ID:** `PlatformOpsController_recordSloMeasurement`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.recordSloMeasurement](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Idempotente por fin de ventana: reintentar no duplica el histórico.


### Descripción del sistema

NestJS resuelve `POST /ops/slo/{id}/measurements` en `PlatformOpsController_recordSloMeasurement`. El controlador delega en `OpsReliabilityService.recordSloMeasurement`. Valida el body como `RecordSloMeasurementDto` y consume `application/json`. El tipo de retorno estático es `Promise<SloMeasurementResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordSloMeasurementDto`; los campos opcionales se omiten.

```http
POST /ops/slo/00000000-0000-4000-8000-000000000001/measurements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "windowStart": "2026-07-31T12:00:00.000Z",
  "windowEnd": "2026-07-31T12:00:00.000Z",
  "goodEvents": "valor-ejemplo",
  "totalEvents": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SRE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `windowStart` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `windowEnd` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `goodEvents` | Sí | `string` | Sin restricción adicional declarada | Eventos buenos de la ventana; cadena por ser bigint | `valor-ejemplo` |
| `totalEvents` | Sí | `string` | Sin restricción adicional declarada | Eventos totales de la ventana; cadena por ser bigint | `valor-ejemplo` |
| `sourceReference` | No | `string` | longitud máxima 500 | De dónde salieron los datos | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/slo/00000000-0000-4000-8000-000000000001/measurements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "windowStart": "2026-07-31T12:00:00.000Z",
  "windowEnd": "2026-07-31T12:00:00.000Z",
  "goodEvents": "valor-ejemplo",
  "totalEvents": "valor-ejemplo",
  "sourceReference": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SloMeasurementResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "attainedValue": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `attainedValue` | Sí | `string` | Sin restricción adicional declarada | Cumplimiento alcanzado, como cadena decimal | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si la ventana ya estaba medida y se devuelve la anterior | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objetivo de nivel de servicio no encontrado | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ventana de medición está invertida | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | Una ventana sin eventos no mide nada | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | Los eventos buenos no pueden superar a los totales | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | El objetivo no está activo | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana precede a la vigencia del objetivo | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana excede la vigencia del objetivo | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/slo/{id}/measurements"
}
```

---

