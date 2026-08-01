<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `read_models`

Referencia exhaustiva de 15 operación(es) del módulo `read_models`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `read-models`, `read-models-public`, `read-models-views`
- **Controladores:** `FrontendViewsController`, `PublicProjectionsController`, `ReadModelDefinitionsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /portals/{portalCode}/routes/{routeCode}/views](#1-post-portals-portalcode-routes-routecode-views) — Publicar el contrato de una vista de página
2. [GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/actions](#2-get-portals-portalcode-routes-routecode-views-viewcode-actions) — Derivar available_actions_json (estado + permiso + purpose)
3. [GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/data](#3-get-portals-portalcode-routes-routecode-views-viewcode-data) — Servir el read model al frontend (consent-aware, masking heredado)
4. [GET /public/{slug}](#4-get-public-slug) — Servir una proyección pública por slug
5. [GET /public/directory](#5-get-public-directory) — Servir el directorio público (solo campos aprobados)
6. [POST /read-models/{definitionId}/backfill](#6-post-read-models-definitionid-backfill) — Backfill inicial de una nueva materialized view
7. [POST /read-models/{definitionId}/invalidate](#7-post-read-models-definitionid-invalidate) — Invalidar y recomputar el read model tras cambio upstream
8. [POST /read-models/{definitionId}/reconcile](#8-post-read-models-definitionid-reconcile) — Reconciliar read model divergente contra la fuente canónica
9. [POST /read-models/{definitionId}/refresh](#9-post-read-models-definitionid-refresh) — Refrescar la materialized view (REFRESH CONCURRENTLY, manual)
10. [POST /read-models/definitions](#10-post-read-models-definitions) — Registrar y publicar un contrato de read model versionado
11. [DELETE /read-models/definitions/{id}](#11-delete-read-models-definitions-id) — Retirar una versión de read model (guarda de FK)
12. [POST /read-models/definitions/{id}/deprecate](#12-post-read-models-definitions-id-deprecate) — Deprecar una versión de read model
13. [POST /read-models/definitions/{schema}/{object}/versions](#13-post-read-models-definitions-schema-object-versions) — Versionar el esquema de un read model
14. [GET /read-models/health](#14-get-read-models-health) — Detectar y reportar staleness/degradación de las MV
15. [PUT /views/{frontendPageViewId}/preferences](#15-put-views-frontendpageviewid-preferences) — Guardar preferencias de vista del usuario

---

## 1. POST /portals/{portalCode}/routes/{routeCode}/views

- **Módulo:** `read_models`
- **Etiqueta OpenAPI:** `read-models-views`
- **Nombre:** Publicar el contrato de una vista de página
- **Operation ID:** `FrontendViewsController_publishViewContract`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FrontendViewsController.publishViewContract](../../src/modules/read_models/controllers/frontend-views.controller.ts)

### Descripción de negocio

Publicar el contrato de una vista de página. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /portals/{portalCode}/routes/{routeCode}/views` en `FrontendViewsController_publishViewContract`. El controlador delega en `FrontendViewsService.publishViewContract`. Valida el body como `PublishViewContractDto` y consume `application/json`. El tipo de retorno estático es `Promise<ViewContractResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `portalCode` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |
| `routeCode` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishViewContractDto`; los campos opcionales se omiten.

```http
POST /portals/CODIGO_EJEMPLO/routes/CODIGO_EJEMPLO/views HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "portalName": "Nombre de ejemplo",
  "portalType": "INTERNAL",
  "routePattern": "/crm/accounts",
  "pageTitle": "valor-ejemplo",
  "readModelDefinitionId": "00000000-0000-4000-8000-000000000001",
  "viewCode": "account_list",
  "viewType": "TABLE",
  "fields": [
    {
      "fieldCode": "display_name",
      "sourceColumn": "display_name",
      "label": "valor-ejemplo",
      "dataType": "string",
      "ordinal": 1
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `portalName` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre de la superficie de portal | `Nombre de ejemplo` |
| `portalType` | Sí | `string` | valores: `INTERNAL`, `PUBLIC` | Tipo de portal | `INTERNAL` |
| `routePattern` | Sí | `string` | longitud mínima 1; longitud máxima 300 | Patrón de la ruta | `/crm/accounts` |
| `pageTitle` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Título de la página | `valor-ejemplo` |
| `requiresPatientContext` | No | `boolean` | Sin restricción adicional declarada | Requiere contexto de paciente | `true` |
| `requiresTenantContext` | No | `boolean` | Sin restricción adicional declarada | Requiere contexto de tenant | `true` |
| `readModelDefinitionId` | Sí | `string` | formato `uuid` | Definición de read model ACTIVE a servir | `00000000-0000-4000-8000-000000000001` |
| `viewCode` | Sí | `string` | longitud mínima 1; longitud máxima 128 | Código de la vista | `account_list` |
| `viewType` | Sí | `string` | valores: `TABLE`, `DASHBOARD`, `DETAIL` | Tipo de vista | `TABLE` |
| `title` | No | `string` | longitud máxima 200 | Título de la vista | `valor-ejemplo` |
| `supportsCursorPagination` | No | `boolean` | Sin restricción adicional declarada | Soporta paginación por cursor | `true` |
| `supportsExport` | No | `boolean` | Sin restricción adicional declarada | Soporta export | `true` |
| `fields` | Sí | `array<ViewFieldInputDto>` | Sin restricción adicional declarada | Campos de la vista | `[{"fieldCode":"display_name","sourceColumn":"display_name","label":"valor-ejemplo","dataType":"string","formatMask":"valor-ejemplo","sensitive":true,"permissionId":"00000000-0000-4000-8000-000000000001","ordinal":1}]` |
| `fields[].fieldCode` | Sí | `string` | longitud mínima 1; longitud máxima 128 | Código del campo | `display_name` |
| `fields[].sourceColumn` | Sí | `string` | longitud mínima 1; longitud máxima 128 | Columna origen del read model | `display_name` |
| `fields[].label` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Etiqueta visible | `valor-ejemplo` |
| `fields[].dataType` | Sí | `string` | valores: `string`, `text`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `time`, `uuid`, `json`, `binary`, `reference`, `code` | Tipo técnico de dato | `string` |
| `fields[].formatMask` | No | `string` | longitud máxima 200 | Máscara de formato | `valor-ejemplo` |
| `fields[].sensitive` | No | `boolean` | Sin restricción adicional declarada | Campo sensible (masking heredado) | `true` |
| `fields[].permissionId` | No | `string` | formato `uuid` | Permiso requerido para verlo | `00000000-0000-4000-8000-000000000001` |
| `fields[].ordinal` | Sí | `number` | mínimo 0 | Orden del campo | `1` |
| `sortOptions` | No | `array<ViewSortOptionInputDto>` | Sin restricción adicional declarada | Opciones de orden | `[{"sortCode":"CODIGO_EJEMPLO","label":"valor-ejemplo","sortExpression":"created_at","direction":"ASC","nulls":"FIRST","stableTieBreakerExpression":"id ASC","ordinal":1}]` |
| `sortOptions[].sortCode` | No | `string` | longitud mínima 1; longitud máxima 128 | Código de orden | `CODIGO_EJEMPLO` |
| `sortOptions[].label` | No | `string` | longitud mínima 1; longitud máxima 200 | Etiqueta | `valor-ejemplo` |
| `sortOptions[].sortExpression` | No | `string` | longitud mínima 1; longitud máxima 200 | Expresión de orden | `created_at` |
| `sortOptions[].direction` | No | `string` | valores: `ASC`, `DESC` | Dirección | `ASC` |
| `sortOptions[].nulls` | No | `string` | valores: `FIRST`, `LAST` | Posición de nulos | `FIRST` |
| `sortOptions[].stableTieBreakerExpression` | No | `string` | longitud máxima 200 | Tie-breaker estable | `id ASC` |
| `sortOptions[].ordinal` | No | `number` | mínimo 0 | Orden | `1` |
| `actions` | No | `array<ViewActionInputDto>` | Sin restricción adicional declarada | Acciones de fila | `[{"actionCode":"CODIGO_EJEMPLO","label":"valor-ejemplo","actionType":"NAVIGATE","routeTemplate":"valor-ejemplo","requiredPermissionId":"00000000-0000-4000-8000-000000000001","allowedStates":["valor-ejemplo"],"idempotencyRequired":true,"ordinal":1}]` |
| `actions[].actionCode` | No | `string` | longitud mínima 1; longitud máxima 128 | Código de acción | `CODIGO_EJEMPLO` |
| `actions[].label` | No | `string` | longitud mínima 1; longitud máxima 200 | Etiqueta | `valor-ejemplo` |
| `actions[].actionType` | No | `string` | valores: `NAVIGATE`, `MUTATION` | Tipo de acción | `NAVIGATE` |
| `actions[].routeTemplate` | No | `string` | longitud máxima 300 | Plantilla de ruta | `valor-ejemplo` |
| `actions[].requiredPermissionId` | No | `string` | formato `uuid` | Permiso requerido | `00000000-0000-4000-8000-000000000001` |
| `actions[].allowedStates` | No | `array<string>` | Sin restricción adicional declarada | Estados de fila en los que aplica | `["valor-ejemplo"]` |
| `actions[].idempotencyRequired` | No | `boolean` | Sin restricción adicional declarada | Requiere idempotencia | `true` |
| `actions[].ordinal` | No | `number` | mínimo 0 | Orden | `1` |
| `kpis` | No | `array<ViewKpiInputDto>` | Sin restricción adicional declarada | KPIs | `[{"kpiCode":"CODIGO_EJEMPLO","label":"valor-ejemplo","valueColumn":"valor-ejemplo","comparisonColumn":"valor-ejemplo","formatMask":"valor-ejemplo","ordinal":1}]` |
| `kpis[].kpiCode` | No | `string` | longitud mínima 1; longitud máxima 128 | Código del KPI | `CODIGO_EJEMPLO` |
| `kpis[].label` | No | `string` | longitud mínima 1; longitud máxima 200 | Etiqueta | `valor-ejemplo` |
| `kpis[].valueColumn` | No | `string` | longitud mínima 1; longitud máxima 128 | Columna del valor | `valor-ejemplo` |
| `kpis[].comparisonColumn` | No | `string` | longitud mínima 1; longitud máxima 128 | Columna de comparación | `valor-ejemplo` |
| `kpis[].formatMask` | No | `string` | longitud máxima 200 | Máscara de formato | `valor-ejemplo` |
| `kpis[].ordinal` | No | `number` | mínimo 0 | Orden | `1` |
| `states` | No | `array<ViewStateInputDto>` | Sin restricción adicional declarada | Estados de UI | `[{"stateType":"LOADING","title":"valor-ejemplo","message":"valor-ejemplo","retryAllowed":true}]` |
| `states[].stateType` | No | `string` | valores: `LOADING`, `EMPTY`, `STALE`, `ERROR`, `FORBIDDEN` | Tipo de estado | `LOADING` |
| `states[].title` | No | `string` | longitud mínima 1; longitud máxima 200 | Título | `valor-ejemplo` |
| `states[].message` | No | `string` | longitud mínima 1; longitud máxima 500 | Mensaje | `valor-ejemplo` |
| `states[].retryAllowed` | No | `boolean` | Sin restricción adicional declarada | Permite reintentar | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /portals/CODIGO_EJEMPLO/routes/CODIGO_EJEMPLO/views HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "portalName": "Nombre de ejemplo",
  "portalType": "INTERNAL",
  "routePattern": "/crm/accounts",
  "pageTitle": "valor-ejemplo",
  "requiresPatientContext": true,
  "requiresTenantContext": true,
  "readModelDefinitionId": "00000000-0000-4000-8000-000000000001",
  "viewCode": "account_list",
  "viewType": "TABLE",
  "title": "valor-ejemplo",
  "supportsCursorPagination": true,
  "supportsExport": true,
  "fields": [
    {
      "fieldCode": "display_name",
      "sourceColumn": "display_name",
      "label": "valor-ejemplo",
      "dataType": "string",
      "formatMask": "valor-ejemplo",
      "sensitive": true,
      "permissionId": "00000000-0000-4000-8000-000000000001",
      "ordinal": 1
    }
  ],
  "sortOptions": [
    {
      "sortCode": "CODIGO_EJEMPLO",
      "label": "valor-ejemplo",
      "sortExpression": "created_at",
      "direction": "ASC",
      "nulls": "FIRST",
      "stableTieBreakerExpression": "id ASC",
      "ordinal": 1
    }
  ],
  "actions": [
    {
      "actionCode": "CODIGO_EJEMPLO",
      "label": "valor-ejemplo",
      "actionType": "NAVIGATE",
      "routeTemplate": "valor-ejemplo",
      "requiredPermissionId": "00000000-0000-4000-8000-000000000001",
      "allowedStates": [
        "valor-ejemplo"
      ],
      "idempotencyRequired": true,
      "ordinal": 1
    }
  ],
  "kpis": [
    {
      "kpiCode": "CODIGO_EJEMPLO",
      "label": "valor-ejemplo",
      "valueColumn": "valor-ejemplo",
      "comparisonColumn": "valor-ejemplo",
      "formatMask": "valor-ejemplo",
      "ordinal": 1
    }
  ],
  "states": [
    {
      "stateType": "LOADING",
      "title": "valor-ejemplo",
      "message": "valor-ejemplo",
      "retryAllowed": true
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ViewContractResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ViewContractResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ViewContractResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ViewContractResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ViewContractResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ViewContractResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ViewContractResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ViewContractResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ViewContractResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ViewContractResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ViewContractResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "portalSurfaceId": "00000000-0000-4000-8000-000000000001",
  "frontendRouteId": "00000000-0000-4000-8000-000000000001",
  "viewCode": "CODIGO_EJEMPLO",
  "fieldCount": 1,
  "actionCount": 1,
  "status": "ok"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Id de la vista de página | `00000000-0000-4000-8000-000000000001` |
| `portalSurfaceId` | Sí | `string` | formato `uuid` | Identificador asociado a portal surface. | `00000000-0000-4000-8000-000000000001` |
| `frontendRouteId` | Sí | `string` | formato `uuid` | Identificador asociado a frontend route. | `00000000-0000-4000-8000-000000000001` |
| `viewCode` | Sí | `string` | Sin restricción adicional declarada | Valor de view code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `fieldCount` | Sí | `number` | Sin restricción adicional declarada | Campos publicados | `1` |
| `actionCount` | Sí | `number` | Sin restricción adicional declarada | Acciones publicadas | `1` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Estado (concept id) | `ok` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Definición de read model no encontrada | Excepción explícita en src/modules/read_models/services/frontend-views.service.ts |
| 409 | `CONFLICT` | La vista ya existe en esa ruta | Excepción explícita en src/modules/read_models/services/frontend-views.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La definición de read model no está ACTIVE | Excepción explícita en src/modules/read_models/services/frontend-views.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/portals/{portalCode}/routes/{routeCode}/views"
}
```

---

## 2. GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/actions

- **Módulo:** `read_models`
- **Etiqueta OpenAPI:** `read-models-views`
- **Nombre:** Derivar available_actions_json (estado + permiso + purpose)
- **Operation ID:** `FrontendViewsController_deriveActions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FrontendViewsController.deriveActions](../../src/modules/read_models/controllers/frontend-views.controller.ts)

### Descripción de negocio

Derivar available_actions_json (estado + permiso + purpose). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/actions` en `FrontendViewsController_deriveActions`. El controlador delega en `FrontendViewsService.deriveAvailableActions`. No recibe body. El tipo de retorno estático es `Promise<AvailableActionDto[]>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `portalCode` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |
| `routeCode` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |
| `viewCode` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /portals/CODIGO_EJEMPLO/routes/CODIGO_EJEMPLO/views/CODIGO_EJEMPLO/actions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /portals/CODIGO_EJEMPLO/routes/CODIGO_EJEMPLO/views/CODIGO_EJEMPLO/actions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AvailableActionDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<AvailableActionDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<AvailableActionDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<AvailableActionDto[]>` | No |
| 404 | Consulta completada correctamente. | `Promise<AvailableActionDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<AvailableActionDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<AvailableActionDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AvailableActionDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "actionCode": "CODIGO_EJEMPLO",
    "label": "valor-ejemplo",
    "actionType": "valor-ejemplo",
    "enabled": true
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Portal no encontrado | Excepción explícita en src/modules/read_models/services/frontend-views.service.ts |
| 404 | `NOT_FOUND` | Ruta no encontrada | Excepción explícita en src/modules/read_models/services/frontend-views.service.ts |
| 404 | `NOT_FOUND` | Vista no encontrada | Excepción explícita en src/modules/read_models/services/frontend-views.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/portals/{portalCode}/routes/{routeCode}/views/{viewCode}/actions"
}
```

---

## 3. GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/data

- **Módulo:** `read_models`
- **Etiqueta OpenAPI:** `read-models-views`
- **Nombre:** Servir el read model al frontend (consent-aware, masking heredado)
- **Operation ID:** `FrontendViewsController_serveData`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FrontendViewsController.serveData](../../src/modules/read_models/controllers/frontend-views.controller.ts)

### Descripción de negocio

Servir el read model al frontend (consent-aware, masking heredado). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /portals/{portalCode}/routes/{routeCode}/views/{viewCode}/data` en `FrontendViewsController_serveData`. El controlador delega en `FrontendViewsService.serveData`. No recibe body. El tipo de retorno estático es `Promise<ServeViewDataResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `portalCode` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |
| `routeCode` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |
| `viewCode` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /portals/CODIGO_EJEMPLO/routes/CODIGO_EJEMPLO/views/CODIGO_EJEMPLO/data HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /portals/CODIGO_EJEMPLO/routes/CODIGO_EJEMPLO/views/CODIGO_EJEMPLO/data HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ServeViewDataResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ServeViewDataResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ServeViewDataResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ServeViewDataResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ServeViewDataResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ServeViewDataResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ServeViewDataResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ServeViewDataResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "frontendPageViewId": "00000000-0000-4000-8000-000000000001",
  "viewCode": "CODIGO_EJEMPLO",
  "fields": [
    {
      "fieldCode": "CODIGO_EJEMPLO",
      "label": "valor-ejemplo",
      "dataType": "valor-ejemplo",
      "masked": true
    }
  ],
  "data": [
    {
      "clave": "valor"
    }
  ],
  "availableActions": [
    {
      "actionCode": "CODIGO_EJEMPLO",
      "label": "valor-ejemplo",
      "actionType": "valor-ejemplo",
      "enabled": true
    }
  ],
  "nextCursor": "valor-ejemplo",
  "refreshedAt": "2026-07-31T12:00:00.000Z",
  "stalenessSeconds": 1,
  "generatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `frontendPageViewId` | Sí | `string` | formato `uuid` | Identificador asociado a frontend page view. | `00000000-0000-4000-8000-000000000001` |
| `viewCode` | Sí | `string` | Sin restricción adicional declarada | Valor de view code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `fields` | Sí | `array<ServedFieldDto>` | Sin restricción adicional declarada | Columnas servidas (con masking) | `[{"fieldCode":"CODIGO_EJEMPLO","label":"valor-ejemplo","dataType":"valor-ejemplo","masked":true}]` |
| `fields[].fieldCode` | Sí | `string` | Sin restricción adicional declarada | Valor de field code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `fields[].label` | Sí | `string` | Sin restricción adicional declarada | Valor de label mantenido por la instancia. | `valor-ejemplo` |
| `fields[].dataType` | Sí | `string` | Sin restricción adicional declarada | Valor de data type mantenido por la instancia. | `valor-ejemplo` |
| `fields[].masked` | Sí | `boolean` | Sin restricción adicional declarada | Enmascarado por sensibilidad/permiso | `true` |
| `data` | Sí | `array<object>` | Sin restricción adicional declarada | Filas del read model (proyección) | `[{"clave":"valor"}]` |
| `availableActions` | Sí | `array<AvailableActionDto>` | Sin restricción adicional declarada | Acciones disponibles derivadas | `[{"actionCode":"CODIGO_EJEMPLO","label":"valor-ejemplo","actionType":"valor-ejemplo","enabled":true}]` |
| `availableActions[].actionCode` | Sí | `string` | Sin restricción adicional declarada | Valor de action code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `availableActions[].label` | Sí | `string` | Sin restricción adicional declarada | Valor de label mantenido por la instancia. | `valor-ejemplo` |
| `availableActions[].actionType` | Sí | `string` | Sin restricción adicional declarada | Tipo de acción (concept id) | `valor-ejemplo` |
| `availableActions[].enabled` | Sí | `boolean` | Sin restricción adicional declarada | Habilitada para el estado + permisos del solicitante | `true` |
| `nextCursor` | No | `string` | admite null | Cursor de la siguiente página | `valor-ejemplo` |
| `refreshedAt` | No | `string` | formato `date-time`; admite null | Última materialización de la MV | `2026-07-31T12:00:00.000Z` |
| `stalenessSeconds` | Sí | `number` | Sin restricción adicional declarada | Antigüedad en segundos respecto a la última materialización | `1` |
| `generatedAt` | Sí | `string` | formato `date-time` | Marca de generación de la respuesta | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Portal no encontrado | Excepción explícita en src/modules/read_models/services/frontend-views.service.ts |
| 404 | `NOT_FOUND` | Ruta no encontrada | Excepción explícita en src/modules/read_models/services/frontend-views.service.ts |
| 404 | `NOT_FOUND` | Vista no encontrada | Excepción explícita en src/modules/read_models/services/frontend-views.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/portals/{portalCode}/routes/{routeCode}/views/{viewCode}/data"
}
```

---

## 4. GET /public/{slug}

- **Módulo:** `read_models`
- **Etiqueta OpenAPI:** `read-models-public`
- **Nombre:** Servir una proyección pública por slug
- **Operation ID:** `PublicProjectionsController_getBySlug`
- **Autenticación:** Pública
- **Implementación:** [PublicProjectionsController.getBySlug](../../src/modules/read_models/controllers/public-projections.controller.ts)

### Descripción de negocio

Servir una proyección pública por slug. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-30-10: detalle público por slug.

### Descripción del sistema

NestJS resuelve `GET /public/{slug}` en `PublicProjectionsController_getBySlug`. El controlador delega en `PublicProjectionsService.getBySlug`. No recibe body. El tipo de retorno estático es `Promise<PublicProjectionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `slug` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicProjectionResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicProjectionResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicProjectionResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicProjectionResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicProjectionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicProjectionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "slug": "valor-ejemplo",
  "records": [
    {
      "clave": "valor"
    }
  ],
  "refreshedAt": "2026-07-31T12:00:00.000Z",
  "generatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `slug` | Sí | `string` | Sin restricción adicional declarada | Slug o consulta pública resuelta | `valor-ejemplo` |
| `records` | Sí | `array<object>` | Sin restricción adicional declarada | Registros públicos aprobados | `[{"clave":"valor"}]` |
| `refreshedAt` | No | `string` | formato `date-time`; admite null | Última materialización de la MV pública | `2026-07-31T12:00:00.000Z` |
| `generatedAt` | Sí | `string` | formato `date-time` | Marca de generación de la respuesta | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/{slug}"
}
```

---

## 5. GET /public/directory

- **Módulo:** `read_models`
- **Etiqueta OpenAPI:** `read-models-public`
- **Nombre:** Servir el directorio público (solo campos aprobados)
- **Operation ID:** `PublicProjectionsController_searchDirectory`
- **Autenticación:** Pública
- **Implementación:** [PublicProjectionsController.searchDirectory](../../src/modules/read_models/controllers/public-projections.controller.ts)

### Descripción de negocio

Servir el directorio público (solo campos aprobados). Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-30-10: catálogo público de directorio (city/specialty).

### Descripción del sistema

NestJS resuelve `GET /public/directory` en `PublicProjectionsController_searchDirectory`. El controlador delega en `PublicProjectionsService.searchDirectory`. No recibe body. El tipo de retorno estático es `Promise<PublicProjectionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/directory HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/directory HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicProjectionResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicProjectionResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicProjectionResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicProjectionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicProjectionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "slug": "valor-ejemplo",
  "records": [
    {
      "clave": "valor"
    }
  ],
  "refreshedAt": "2026-07-31T12:00:00.000Z",
  "generatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `slug` | Sí | `string` | Sin restricción adicional declarada | Slug o consulta pública resuelta | `valor-ejemplo` |
| `records` | Sí | `array<object>` | Sin restricción adicional declarada | Registros públicos aprobados | `[{"clave":"valor"}]` |
| `refreshedAt` | No | `string` | formato `date-time`; admite null | Última materialización de la MV pública | `2026-07-31T12:00:00.000Z` |
| `generatedAt` | Sí | `string` | formato `date-time` | Marca de generación de la respuesta | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "RATE_LIMITED",
  "message": "Se exceden 300 solicitudes por 60 segundos para la instancia.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/directory"
}
```

---

## 6. POST /read-models/{definitionId}/backfill

- **Módulo:** `read_models`
- **Etiqueta OpenAPI:** `read-models`
- **Nombre:** Backfill inicial de una nueva materialized view
- **Operation ID:** `ReadModelDefinitionsController_backfill`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReadModelDefinitionsController.backfill](../../src/modules/read_models/controllers/read-model-definitions.controller.ts)

### Descripción de negocio

Backfill inicial de una nueva materialized view. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /read-models/{definitionId}/backfill` en `ReadModelDefinitionsController_backfill`. El controlador delega en `ReadModelDefinitionsService.backfill`. No recibe body. El tipo de retorno estático es `Promise<RefreshRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `definitionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /read-models/00000000-0000-4000-8000-000000000001/backfill HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `definitionId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /read-models/00000000-0000-4000-8000-000000000001/backfill HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RefreshRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "runId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "unchanged": true,
  "inputCount": 1,
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `runId` | Sí | `string` | formato `uuid` | Identificador asociado a run. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | No | `string` | formato `uuid` | Versión redactada, si hubo cambio | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | No | `number` | Sin restricción adicional declarada | Número de la versión redactada | `1` |
| `contentHash` | Sí | `string` | Sin restricción adicional declarada | Hash del contenido regenerado | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `unchanged` | Sí | `boolean` | Sin restricción adicional declarada | true si el contenido no cambió y no se redactó versión | `true` |
| `inputCount` | Sí | `number` | Sin restricción adicional declarada | Entradas de procedencia registradas | `1` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si la corrida ya existía con esa clave | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Read model no encontrado | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | La operación requiere una materialized view | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión está retirada | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | El nombre físico de la vista no es un identificador SQL válido | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/read-models/{definitionId}/backfill"
}
```

---

## 7. POST /read-models/{definitionId}/invalidate

- **Módulo:** `read_models`
- **Etiqueta OpenAPI:** `read-models`
- **Nombre:** Invalidar y recomputar el read model tras cambio upstream
- **Operation ID:** `ReadModelDefinitionsController_invalidate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReadModelDefinitionsController.invalidate](../../src/modules/read_models/controllers/read-model-definitions.controller.ts)

### Descripción de negocio

Invalidar y recomputar el read model tras cambio upstream. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /read-models/{definitionId}/invalidate` en `ReadModelDefinitionsController_invalidate`. El controlador delega en `ReadModelDefinitionsService.invalidate`. No recibe body. El tipo de retorno estático es `Promise<RefreshRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `definitionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /read-models/00000000-0000-4000-8000-000000000001/invalidate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `definitionId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /read-models/00000000-0000-4000-8000-000000000001/invalidate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RefreshRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "runId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "unchanged": true,
  "inputCount": 1,
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `runId` | Sí | `string` | formato `uuid` | Identificador asociado a run. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | No | `string` | formato `uuid` | Versión redactada, si hubo cambio | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | No | `number` | Sin restricción adicional declarada | Número de la versión redactada | `1` |
| `contentHash` | Sí | `string` | Sin restricción adicional declarada | Hash del contenido regenerado | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `unchanged` | Sí | `boolean` | Sin restricción adicional declarada | true si el contenido no cambió y no se redactó versión | `true` |
| `inputCount` | Sí | `number` | Sin restricción adicional declarada | Entradas de procedencia registradas | `1` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si la corrida ya existía con esa clave | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Read model no encontrado | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | La operación requiere una materialized view | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión está retirada | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | El nombre físico de la vista no es un identificador SQL válido | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/read-models/{definitionId}/invalidate"
}
```

---

## 8. POST /read-models/{definitionId}/reconcile

- **Módulo:** `read_models`
- **Etiqueta OpenAPI:** `read-models`
- **Nombre:** Reconciliar read model divergente contra la fuente canónica
- **Operation ID:** `ReadModelDefinitionsController_reconcile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReadModelDefinitionsController.reconcile](../../src/modules/read_models/controllers/read-model-definitions.controller.ts)

### Descripción de negocio

Reconciliar read model divergente contra la fuente canónica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-30-07. `SYSTEM` se añade junto al rol humano por la misma razón que en `health()`: el worker periódico llama este endpoint para cada definición `stale` que descubre.

### Descripción del sistema

NestJS resuelve `POST /read-models/{definitionId}/reconcile` en `ReadModelDefinitionsController_reconcile`. El controlador delega en `ReadModelDefinitionsService.reconcile`. No recibe body. El tipo de retorno estático es `Promise<RefreshRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `definitionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /read-models/00000000-0000-4000-8000-000000000001/reconcile HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `definitionId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /read-models/00000000-0000-4000-8000-000000000001/reconcile HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RefreshRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "runId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "unchanged": true,
  "inputCount": 1,
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `runId` | Sí | `string` | formato `uuid` | Identificador asociado a run. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | No | `string` | formato `uuid` | Versión redactada, si hubo cambio | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | No | `number` | Sin restricción adicional declarada | Número de la versión redactada | `1` |
| `contentHash` | Sí | `string` | Sin restricción adicional declarada | Hash del contenido regenerado | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `unchanged` | Sí | `boolean` | Sin restricción adicional declarada | true si el contenido no cambió y no se redactó versión | `true` |
| `inputCount` | Sí | `number` | Sin restricción adicional declarada | Entradas de procedencia registradas | `1` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si la corrida ya existía con esa clave | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Read model no encontrado | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | La operación requiere una materialized view | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión está retirada | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | El nombre físico de la vista no es un identificador SQL válido | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/read-models/{definitionId}/reconcile"
}
```

---

## 9. POST /read-models/{definitionId}/refresh

- **Módulo:** `read_models`
- **Etiqueta OpenAPI:** `read-models`
- **Nombre:** Refrescar la materialized view (REFRESH CONCURRENTLY, manual)
- **Operation ID:** `ReadModelDefinitionsController_refresh`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReadModelDefinitionsController.refresh](../../src/modules/read_models/controllers/read-model-definitions.controller.ts)

### Descripción de negocio

Refrescar la materialized view (REFRESH CONCURRENTLY, manual). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /read-models/{definitionId}/refresh` en `ReadModelDefinitionsController_refresh`. El controlador delega en `ReadModelDefinitionsService.refresh`. No recibe body. El tipo de retorno estático es `Promise<RefreshRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `definitionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /read-models/00000000-0000-4000-8000-000000000001/refresh HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `definitionId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /read-models/00000000-0000-4000-8000-000000000001/refresh HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RefreshRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "runId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "unchanged": true,
  "inputCount": 1,
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `runId` | Sí | `string` | formato `uuid` | Identificador asociado a run. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | No | `string` | formato `uuid` | Versión redactada, si hubo cambio | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | No | `number` | Sin restricción adicional declarada | Número de la versión redactada | `1` |
| `contentHash` | Sí | `string` | Sin restricción adicional declarada | Hash del contenido regenerado | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `unchanged` | Sí | `boolean` | Sin restricción adicional declarada | true si el contenido no cambió y no se redactó versión | `true` |
| `inputCount` | Sí | `number` | Sin restricción adicional declarada | Entradas de procedencia registradas | `1` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si la corrida ya existía con esa clave | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Read model no encontrado | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | La operación requiere una materialized view | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión está retirada | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | El nombre físico de la vista no es un identificador SQL válido | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/read-models/{definitionId}/refresh"
}
```

---

## 10. POST /read-models/definitions

- **Módulo:** `read_models`
- **Etiqueta OpenAPI:** `read-models`
- **Nombre:** Registrar y publicar un contrato de read model versionado
- **Operation ID:** `ReadModelDefinitionsController_createDefinition`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReadModelDefinitionsController.createDefinition](../../src/modules/read_models/controllers/read-model-definitions.controller.ts)

### Descripción de negocio

Registrar y publicar un contrato de read model versionado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /read-models/definitions` en `ReadModelDefinitionsController_createDefinition`. El controlador delega en `ReadModelDefinitionsService.createDefinition`. Valida el body como `CreateReadModelDefinitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReadModelDefinitionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateReadModelDefinitionDto`; los campos opcionales se omiten.

```http
POST /read-models/definitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "schemaName": "read_models",
  "objectName": "crm_account_360_v",
  "objectType": "VIEW",
  "dependencies": [
    {
      "sourceSchemaName": "billing",
      "sourceObjectName": "bills",
      "dependencyType": "TABLE"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `schemaName` | Sí | `string` | longitud mínima 1; longitud máxima 128 | Esquema físico | `read_models` |
| `objectName` | Sí | `string` | longitud mínima 1; longitud máxima 128; patrón runtime `/^[a-z0-9_]+$/` | Nombre del objeto | `crm_account_360_v` |
| `objectType` | Sí | `string` | valores: `VIEW`, `MATERIALIZED_VIEW` | Tipo de objeto físico | `VIEW` |
| `owningModule` | No | `string` | longitud máxima 128 | Módulo dueño del contrato | `valor-ejemplo` |
| `purposeText` | No | `string` | longitud máxima 2000 | Propósito legible del read model | `valor-ejemplo` |
| `refreshMode` | No | `string` | valores: `CONCURRENT`, `SCHEDULED` | Modo de refresh | `CONCURRENT` |
| `maximumStalenessSeconds` | No | `number` | mínimo 0 | Máxima antigüedad tolerada en segundos | `1` |
| `defaultPageSize` | No | `number` | mínimo 1 | Tamaño de página por defecto | `1` |
| `maximumPageSize` | No | `number` | mínimo 1 | Tamaño de página máximo | `1` |
| `stableCursorColumns` | No | `array<string>` | Sin restricción adicional declarada | Columnas de cursor estable (tie-breaker determinista) | `["valor-ejemplo"]` |
| `containsPii` | No | `boolean` | Sin restricción adicional declarada | La vista contiene PII | `true` |
| `containsPhi` | No | `boolean` | Sin restricción adicional declarada | La vista contiene PHI | `true` |
| `securityBarrierRequired` | No | `boolean` | Sin restricción adicional declarada | Requiere security barrier | `true` |
| `rowLevelSecurityRequired` | No | `boolean` | Sin restricción adicional declarada | Requiere row-level security | `true` |
| `versionNumber` | No | `number` | mínimo 1 | Número de versión inicial (por defecto 1) | `1` |
| `dependencies` | Sí | `array<ReadModelDependencyInputDto>` | Sin restricción adicional declarada | Dependencias upstream | `[{"sourceSchemaName":"billing","sourceObjectName":"bills","dependencyType":"TABLE","selectedColumns":["valor-ejemplo"],"filteringRuleSummary":"valor-ejemplo"}]` |
| `dependencies[].sourceSchemaName` | Sí | `string` | longitud mínima 1; longitud máxima 128 | Esquema de la fuente upstream | `billing` |
| `dependencies[].sourceObjectName` | Sí | `string` | longitud mínima 1; longitud máxima 128 | Objeto (tabla/vista) de la fuente upstream | `bills` |
| `dependencies[].dependencyType` | Sí | `string` | valores: `TABLE`, `VIEW` | Tipo de dependencia | `TABLE` |
| `dependencies[].selectedColumns` | No | `array<string>` | Sin restricción adicional declarada | Columnas seleccionadas de la fuente | `["valor-ejemplo"]` |
| `dependencies[].filteringRuleSummary` | No | `string` | longitud máxima 1000 | Resumen de la regla de filtrado | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /read-models/definitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "schemaName": "read_models",
  "objectName": "crm_account_360_v",
  "objectType": "VIEW",
  "owningModule": "valor-ejemplo",
  "purposeText": "valor-ejemplo",
  "refreshMode": "CONCURRENT",
  "maximumStalenessSeconds": 1,
  "defaultPageSize": 1,
  "maximumPageSize": 1,
  "stableCursorColumns": [
    "valor-ejemplo"
  ],
  "containsPii": true,
  "containsPhi": true,
  "securityBarrierRequired": true,
  "rowLevelSecurityRequired": true,
  "versionNumber": 1,
  "dependencies": [
    {
      "sourceSchemaName": "billing",
      "sourceObjectName": "bills",
      "dependencyType": "TABLE",
      "selectedColumns": [
        "valor-ejemplo"
      ],
      "filteringRuleSummary": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReadModelDefinitionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "schemaName": "Nombre de ejemplo",
  "objectName": "Nombre de ejemplo",
  "versionNumber": 1,
  "status": "ok",
  "definitionHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "dependencyCount": 1,
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `schemaName` | Sí | `string` | Sin restricción adicional declarada | Valor de schema name mantenido por la instancia. | `Nombre de ejemplo` |
| `objectName` | Sí | `string` | Sin restricción adicional declarada | Valor de object name mantenido por la instancia. | `Nombre de ejemplo` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Estado (concept id) | `ok` |
| `definitionHash` | Sí | `string` | Sin restricción adicional declarada | Hash del DDL/contrato | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `dependencyCount` | Sí | `number` | Sin restricción adicional declarada | Cantidad de dependencias declaradas | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe esa versión del read model | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
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
  "path": "/read-models/definitions"
}
```

---

## 11. DELETE /read-models/definitions/{id}

- **Módulo:** `read_models`
- **Etiqueta OpenAPI:** `read-models`
- **Nombre:** Retirar una versión de read model (guarda de FK)
- **Operation ID:** `ReadModelDefinitionsController_retire`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReadModelDefinitionsController.retire](../../src/modules/read_models/controllers/read-model-definitions.controller.ts)

### Descripción de negocio

Retirar una versión de read model (guarda de FK). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `DELETE /read-models/definitions/{id}` en `ReadModelDefinitionsController_retire`. El controlador delega en `ReadModelDefinitionsService.retire`. No recibe body. El tipo de retorno estático es `Promise<OperationResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /read-models/definitions/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /read-models/definitions/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OperationResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true,
  "status": "ok"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | Indica éxito | `true` |
| `status` | No | `string` | Sin restricción adicional declarada | Nuevo estado del recurso (concept id) | `ok` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Read model no encontrado | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | No se puede retirar: hay vistas apuntando a esta versión | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/read-models/definitions/{id}"
}
```

---

## 12. POST /read-models/definitions/{id}/deprecate

- **Módulo:** `read_models`
- **Etiqueta OpenAPI:** `read-models`
- **Nombre:** Deprecar una versión de read model
- **Operation ID:** `ReadModelDefinitionsController_deprecate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReadModelDefinitionsController.deprecate](../../src/modules/read_models/controllers/read-model-definitions.controller.ts)

### Descripción de negocio

Deprecar una versión de read model. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /read-models/definitions/{id}/deprecate` en `ReadModelDefinitionsController_deprecate`. El controlador delega en `ReadModelDefinitionsService.deprecate`. No recibe body. El tipo de retorno estático es `Promise<OperationResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /read-models/definitions/00000000-0000-4000-8000-000000000001/deprecate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /read-models/definitions/00000000-0000-4000-8000-000000000001/deprecate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OperationResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OperationResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true,
  "status": "ok"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | Indica éxito | `true` |
| `status` | No | `string` | Sin restricción adicional declarada | Nuevo estado del recurso (concept id) | `ok` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Read model no encontrado | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión ya está retirada | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/read-models/definitions/{id}/deprecate"
}
```

---

## 13. POST /read-models/definitions/{schema}/{object}/versions

- **Módulo:** `read_models`
- **Etiqueta OpenAPI:** `read-models`
- **Nombre:** Versionar el esquema de un read model
- **Operation ID:** `ReadModelDefinitionsController_createVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReadModelDefinitionsController.createVersion](../../src/modules/read_models/controllers/read-model-definitions.controller.ts)

### Descripción de negocio

Versionar el esquema de un read model. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /read-models/definitions/{schema}/{object}/versions` en `ReadModelDefinitionsController_createVersion`. El controlador delega en `ReadModelDefinitionsService.createVersion`. Valida el body como `CreateReadModelVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReadModelDefinitionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `schema` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `object` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateReadModelVersionDto`; los campos opcionales se omiten.

```http
POST /read-models/definitions/valor-ejemplo/valor-ejemplo/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "objectType": "VIEW",
  "dependencies": [
    {
      "sourceSchemaName": "billing",
      "sourceObjectName": "bills",
      "dependencyType": "TABLE"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `objectType` | Sí | `string` | valores: `VIEW`, `MATERIALIZED_VIEW` | Tipo de objeto físico | `VIEW` |
| `refreshMode` | No | `string` | valores: `CONCURRENT`, `SCHEDULED` | Modo de refresh | `CONCURRENT` |
| `maximumStalenessSeconds` | No | `number` | mínimo 0 | Máxima antigüedad tolerada en segundos | `1` |
| `purposeText` | No | `string` | longitud máxima 2000 | Propósito legible del read model | `valor-ejemplo` |
| `containsPii` | No | `boolean` | Sin restricción adicional declarada | La vista contiene PII | `true` |
| `containsPhi` | No | `boolean` | Sin restricción adicional declarada | La vista contiene PHI | `true` |
| `dependencies` | Sí | `array<ReadModelDependencyInputDto>` | Sin restricción adicional declarada | Dependencias upstream de la nueva versión | `[{"sourceSchemaName":"billing","sourceObjectName":"bills","dependencyType":"TABLE","selectedColumns":["valor-ejemplo"],"filteringRuleSummary":"valor-ejemplo"}]` |
| `dependencies[].sourceSchemaName` | Sí | `string` | longitud mínima 1; longitud máxima 128 | Esquema de la fuente upstream | `billing` |
| `dependencies[].sourceObjectName` | Sí | `string` | longitud mínima 1; longitud máxima 128 | Objeto (tabla/vista) de la fuente upstream | `bills` |
| `dependencies[].dependencyType` | Sí | `string` | valores: `TABLE`, `VIEW` | Tipo de dependencia | `TABLE` |
| `dependencies[].selectedColumns` | No | `array<string>` | Sin restricción adicional declarada | Columnas seleccionadas de la fuente | `["valor-ejemplo"]` |
| `dependencies[].filteringRuleSummary` | No | `string` | longitud máxima 1000 | Resumen de la regla de filtrado | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /read-models/definitions/valor-ejemplo/valor-ejemplo/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "objectType": "VIEW",
  "refreshMode": "CONCURRENT",
  "maximumStalenessSeconds": 1,
  "purposeText": "valor-ejemplo",
  "containsPii": true,
  "containsPhi": true,
  "dependencies": [
    {
      "sourceSchemaName": "billing",
      "sourceObjectName": "bills",
      "dependencyType": "TABLE",
      "selectedColumns": [
        "valor-ejemplo"
      ],
      "filteringRuleSummary": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReadModelDefinitionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReadModelDefinitionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "schemaName": "Nombre de ejemplo",
  "objectName": "Nombre de ejemplo",
  "versionNumber": 1,
  "status": "ok",
  "definitionHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "dependencyCount": 1,
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `schemaName` | Sí | `string` | Sin restricción adicional declarada | Valor de schema name mantenido por la instancia. | `Nombre de ejemplo` |
| `objectName` | Sí | `string` | Sin restricción adicional declarada | Valor de object name mantenido por la instancia. | `Nombre de ejemplo` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Estado (concept id) | `ok` |
| `definitionHash` | Sí | `string` | Sin restricción adicional declarada | Hash del DDL/contrato | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `dependencyCount` | Sí | `number` | Sin restricción adicional declarada | Cantidad de dependencias declaradas | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | No existe una versión previa del read model | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No hay una versión ACTIVE previa que respalde el corte de versión | Excepción explícita en src/modules/read_models/services/read-model-definitions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/read-models/definitions/{schema}/{object}/versions"
}
```

---

## 14. GET /read-models/health

- **Módulo:** `read_models`
- **Etiqueta OpenAPI:** `read-models`
- **Nombre:** Detectar y reportar staleness/degradación de las MV
- **Operation ID:** `ReadModelDefinitionsController_health`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ReadModelDefinitionsController.health](../../src/modules/read_models/controllers/read-model-definitions.controller.ts)

### Descripción de negocio

Detectar y reportar staleness/degradación de las MV. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-30-12. `SYSTEM` se añade junto al rol humano: el worker de reconciliación (Fase 4 del plan de corrección de workers) usa este mismo endpoint para descubrir qué definiciones están `stale` antes de llamar `reconcile`, igual que el resto de endpoints que ya sirven a un worker (`GRAPH_PROJECTION_WORKER`, `EMBEDDING_WORKER`, etc. ya incluyen `SYSTEM`).

### Descripción del sistema

NestJS resuelve `GET /read-models/health` en `ReadModelDefinitionsController_health`. El controlador delega en `ReadModelDefinitionsService.health`. No recibe body. El tipo de retorno estático es `Promise<ReadModelHealthResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /read-models/health HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /read-models/health HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReadModelHealthResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ReadModelHealthResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ReadModelHealthResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ReadModelHealthResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ReadModelHealthResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ReadModelHealthResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReadModelHealthResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "generatedAt": "2026-07-31T12:00:00.000Z",
  "items": [
    {
      "definitionId": "00000000-0000-4000-8000-000000000001",
      "schemaName": "Nombre de ejemplo",
      "objectName": "Nombre de ejemplo",
      "lastRefreshedAt": "2026-07-31T12:00:00.000Z",
      "stalenessSeconds": 1,
      "stale": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `generatedAt` | Sí | `string` | formato `date-time` | Valor de generated at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items` | Sí | `array<ReadModelHealthItemDto>` | Sin restricción adicional declarada | Valor de items mantenido por la instancia. | `[{"definitionId":"00000000-0000-4000-8000-000000000001","schemaName":"Nombre de ejemplo","objectName":"Nombre de ejemplo","lastRefreshedAt":"2026-07-31T12:00:00.000Z","stalenessSeconds":1,"stale":true}]` |
| `items[].definitionId` | Sí | `string` | formato `uuid` | Identificador asociado a definition. | `00000000-0000-4000-8000-000000000001` |
| `items[].schemaName` | Sí | `string` | Sin restricción adicional declarada | Valor de schema name mantenido por la instancia. | `Nombre de ejemplo` |
| `items[].objectName` | Sí | `string` | Sin restricción adicional declarada | Valor de object name mantenido por la instancia. | `Nombre de ejemplo` |
| `items[].lastRefreshedAt` | No | `string` | formato `date-time`; admite null | Valor de last refreshed at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `items[].stalenessSeconds` | Sí | `number` | Sin restricción adicional declarada | Valor de staleness seconds mantenido por la instancia. | `1` |
| `items[].stale` | Sí | `boolean` | Sin restricción adicional declarada | Excede maximum_staleness_seconds | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/read-models/health"
}
```

---

## 15. PUT /views/{frontendPageViewId}/preferences

- **Módulo:** `read_models`
- **Etiqueta OpenAPI:** `read-models-views`
- **Nombre:** Guardar preferencias de vista del usuario
- **Operation ID:** `FrontendViewsController_upsertPreferences`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FrontendViewsController.upsertPreferences](../../src/modules/read_models/controllers/frontend-views.controller.ts)

### Descripción de negocio

Guardar preferencias de vista del usuario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /views/{frontendPageViewId}/preferences` en `FrontendViewsController_upsertPreferences`. El controlador delega en `FrontendViewsService.upsertPreferences`. Valida el body como `UpsertViewPreferencesDto` y consume `application/json`. El tipo de retorno estático es `Promise<ViewPreferencesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `frontendPageViewId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpsertViewPreferencesDto`; los campos opcionales se omiten.

```http
PUT /views/00000000-0000-4000-8000-000000000001/preferences HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `frontendPageViewId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `visibleFields` | No | `array<string>` | Sin restricción adicional declarada | Campos visibles (subconjunto del allow-list del contrato) | `["valor-ejemplo"]` |
| `fieldOrder` | No | `array<string>` | Sin restricción adicional declarada | Orden de campos | `["valor-ejemplo"]` |
| `activeFilter` | No | `object` | Sin restricción adicional declarada | Filtros activos (mapa código -> valor) | `{}` |
| `sortCode` | No | `string` | longitud máxima 128 | Código de orden preferido | `CODIGO_EJEMPLO` |
| `density` | No | `string` | valores: `COMPACT`, `COMFORTABLE` | Densidad | `COMPACT` |
| `pageSize` | No | `number` | mínimo 1; máximo 500 | Tamaño de página preferido | `1` |
| `tenantId` | No | `string` | formato `uuid` | Tenant al que se asocia la preferencia | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /views/00000000-0000-4000-8000-000000000001/preferences HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "visibleFields": [
    "valor-ejemplo"
  ],
  "fieldOrder": [
    "valor-ejemplo"
  ],
  "activeFilter": {},
  "sortCode": "CODIGO_EJEMPLO",
  "density": "COMPACT",
  "pageSize": 1,
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ViewPreferencesResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ViewPreferencesResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ViewPreferencesResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ViewPreferencesResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ViewPreferencesResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ViewPreferencesResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ViewPreferencesResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ViewPreferencesResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ViewPreferencesResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ViewPreferencesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ViewPreferencesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "frontendPageViewId": "00000000-0000-4000-8000-000000000001",
  "created": true,
  "status": "ok"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `frontendPageViewId` | Sí | `string` | formato `uuid` | Identificador asociado a frontend page view. | `00000000-0000-4000-8000-000000000001` |
| `created` | Sí | `boolean` | Sin restricción adicional declarada | Se creó (true) o se actualizó (false) | `true` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Estado (concept id) | `ok` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Vista no encontrada | Excepción explícita en src/modules/read_models/services/frontend-views.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La vista no está ACTIVE | Excepción explícita en src/modules/read_models/services/frontend-views.service.ts |
| 422 | `PRECONDITION_FAILED` | visibleFields contiene columnas fuera del contrato | Excepción explícita en src/modules/read_models/services/frontend-views.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/views/{frontendPageViewId}/preferences"
}
```

---

