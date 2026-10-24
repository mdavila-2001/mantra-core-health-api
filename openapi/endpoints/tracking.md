<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `tracking`

Referencia exhaustiva de 14 operación(es) del módulo `tracking`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `tracking`, `tracking-collections`
- **Controladores:** `TrackingCollectionsController`, `TrackingController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /tracking/milestone-definitions](#1-get-tracking-milestone-definitions) — Listar definiciones de hito del tenant
2. [POST /tracking/milestone-definitions](#2-post-tracking-milestone-definitions) — Definir el catálogo de hitos esperados
3. [GET /tracking/shipments](#3-get-tracking-shipments) — Listar envíos del tenant
4. [POST /tracking/shipments/{id}/cancel](#4-post-tracking-shipments-id-cancel) — Cancelar el envío y cerrar el sujeto
5. [POST /tracking/shipments/{id}/delivery-proof](#5-post-tracking-shipments-id-delivery-proof) — Registrar la prueba de entrega y cerrar
6. [POST /tracking/shipments/{id}/dispatch](#6-post-tracking-shipments-id-dispatch) — Despachar el envío
7. [POST /tracking/shipments/{id}/eta/recompute](#7-post-tracking-shipments-id-eta-recompute) — Registrar una estimación de llegada
8. [POST /tracking/shipments/{id}/exception](#8-post-tracking-shipments-id-exception) — Marcar una excepción o reintento de entrega
9. [POST /tracking/shipments/{id}/handoffs](#9-post-tracking-shipments-id-handoffs) — Registrar el traspaso entre responsables
10. [POST /tracking/sla/scan](#10-post-tracking-sla-scan) — Barrer los compromisos de hito vencidos
11. [GET /tracking/trackable-subjects](#11-get-tracking-trackable-subjects) — Listar sujetos rastreables del tenant
12. [POST /tracking/trackable-subjects](#12-post-tracking-trackable-subjects) — Abrir un sujeto rastreable y su envío
13. [POST /tracking/trackable-subjects/{id}/events](#13-post-tracking-trackable-subjects-id-events) — Registrar un evento y avanzar el hito
14. [POST /tracking/webhooks/carriers/{carrierCode}](#14-post-tracking-webhooks-carriers-carriercode) — Ingerir el webhook del transportista

---

## 1. GET /tracking/milestone-definitions

- **Módulo:** `tracking`
- **Etiqueta OpenAPI:** `tracking-collections`
- **Nombre:** Listar definiciones de hito del tenant
- **Operation ID:** `TrackingCollectionsController_listMilestoneDefinitions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TrackingCollectionsController.listMilestoneDefinitions](../../src/modules/tracking/controllers/tracking-collections.controller.ts)

### Descripción de negocio

Listar definiciones de hito del tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: V37-06: listar definiciones de hito del tenant.

### Descripción del sistema

NestJS resuelve `GET /tracking/milestone-definitions` en `TrackingCollectionsController_listMilestoneDefinitions`. El controlador delega en `TrackingCollectionsService.listMilestoneDefinitions`. No recibe body. El tipo de retorno estático es `Promise<MilestoneDefinitionPageDto>`.

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
GET /tracking/milestone-definitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `TRACKING_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /tracking/milestone-definitions?page=1&pageSize=20&order=DESC&sortBy=createdAt&stateConceptId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MilestoneDefinitionPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<MilestoneDefinitionPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MilestoneDefinitionPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MilestoneDefinitionPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MilestoneDefinitionPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MilestoneDefinitionPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MilestoneDefinitionPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "tenantId": {},
      "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "milestoneStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "ordinal": 1,
      "isTerminal": true,
      "slaMinutes": 1,
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
| `data` | Sí | `array<MilestoneDefinitionItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","tenantId":{},"subjectTypeConceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","milestoneStatusConceptId":"00000000-0000-4000-8000-000000000001","ordinal":1,"isTerminal":true,"slaMinutes":1,"stateConceptId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z"}]` |
| `data[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].tenantId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].subjectTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `data[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `data[].milestoneStatusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].ordinal` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `data[].isTerminal` | No | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `data[].slaMinutes` | No | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: TRACKING_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tracking/milestone-definitions"
}
```

---

## 2. POST /tracking/milestone-definitions

- **Módulo:** `tracking`
- **Etiqueta OpenAPI:** `tracking`
- **Nombre:** Definir el catálogo de hitos esperados
- **Operation ID:** `TrackingController_defineMilestones`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TrackingController.defineMilestones](../../src/modules/tracking/controllers/tracking.controller.ts)

### Descripción de negocio

Sólo puede haber un hito terminal por tipo de sujeto.


### Descripción del sistema

NestJS resuelve `POST /tracking/milestone-definitions` en `TrackingController_defineMilestones`. El controlador delega en `TrackingService.defineMilestones`. Valida el body como `DefineMilestonesDto` y consume `application/json`. El tipo de retorno estático es `Promise<MilestonesResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineMilestonesDto`; los campos opcionales se omiten.

```http
POST /tracking/milestone-definitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "subjectType": "SPECIMEN",
  "milestones": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "milestoneStatus": "CREATED"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `TRACKING_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `subjectType` | Sí | `string` | valores: `SPECIMEN`, `ORDER`, `DEVICE` | Sin descripción específica en el contrato OpenAPI. | `SPECIMEN` |
| `milestones` | Sí | `array<MilestoneDefinitionDto>` | mínimo 1 elemento(s) | Hitos esperados en orden, al menos uno | `[{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","milestoneStatus":"CREATED","isTerminal":false,"slaMinutes":1}]` |
| `milestones[].code` | Sí | `string` | longitud máxima 100 | Código del hito, único por tipo de sujeto | `CODIGO_EJEMPLO` |
| `milestones[].name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `milestones[].milestoneStatus` | Sí | `string` | valores: `CREATED`, `PREPARING`, `IN_TRANSIT`, `HANDOFF`, `DELIVERED`, `CANCELLED` | Sin descripción específica en el contrato OpenAPI. | `CREATED` |
| `milestones[].isTerminal` | No | `boolean` | Sin restricción adicional declarada | Alcanzarlo cierra el seguimiento del sujeto | `false` |
| `milestones[].slaMinutes` | No | `number` | mínimo 1 | Minutos de compromiso para alcanzarlo | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tracking/milestone-definitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "subjectType": "SPECIMEN",
  "milestones": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "milestoneStatus": "CREATED",
      "isTerminal": false,
      "slaMinutes": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MilestonesResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MilestonesResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MilestonesResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MilestonesResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MilestonesResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MilestonesResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MilestonesResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MilestonesResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MilestonesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MilestonesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "milestoneIds": [
    "valor-ejemplo"
  ],
  "skipped": 1,
  "terminalCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `subjectTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a subject type concept. | `00000000-0000-4000-8000-000000000001` |
| `milestoneIds` | Sí | `array<string>` | formato `uuid` | Hitos creados, en orden | `["valor-ejemplo"]` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Hitos omitidos por tener ya ese código | `1` |
| `terminalCount` | Sí | `number` | Sin restricción adicional declarada | Hitos terminales declarados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: TRACKING_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El tipo de sujeto ya tiene hito terminal | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo puede haber un hito terminal | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tracking/milestone-definitions"
}
```

---

## 3. GET /tracking/shipments

- **Módulo:** `tracking`
- **Etiqueta OpenAPI:** `tracking-collections`
- **Nombre:** Listar envíos del tenant
- **Operation ID:** `TrackingCollectionsController_listShipments`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TrackingCollectionsController.listShipments](../../src/modules/tracking/controllers/tracking-collections.controller.ts)

### Descripción de negocio

Listar envíos del tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: V37-01: listar envíos del tenant.

### Descripción del sistema

NestJS resuelve `GET /tracking/shipments` en `TrackingCollectionsController_listShipments`. El controlador delega en `TrackingCollectionsService.listShipments`. No recibe body. El tipo de retorno estático es `Promise<ShipmentPageDto>`.

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
GET /tracking/shipments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `LOGISTICS_OPERATOR`, `TRACKING_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /tracking/shipments?page=1&pageSize=20&order=DESC&sortBy=createdAt&statusConceptId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ShipmentPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<ShipmentPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ShipmentPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ShipmentPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ShipmentPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ShipmentPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ShipmentPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "trackableSubjectId": "00000000-0000-4000-8000-000000000001",
      "carrierId": {},
      "tenantId": {},
      "shipmentNumber": "valor-ejemplo",
      "originAddressId": {},
      "destinationAddressId": {},
      "assignedCourierUserId": {},
      "trackedSubjectId": {},
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "dispatchedAt": "2026-07-31T12:00:00.000Z",
      "estimatedArrivalAt": "2026-07-31T12:00:00.000Z",
      "deliveredAt": "2026-07-31T12:00:00.000Z",
      "distanceM": "valor-ejemplo",
      "temperatureControlled": true,
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
| `data` | Sí | `array<ShipmentItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","trackableSubjectId":"00000000-0000-4000-8000-000000000001","carrierId":{},"tenantId":{},"shipmentNumber":"valor-ejemplo","originAddressId":{},"destinationAddressId":{},"assignedCourierUserId":{},"trackedSubjectId":{},"statusConceptId":"00000000-0000-4000-8000-000000000001","dispatchedAt":"2026-07-31T12:00:00.000Z","estimatedArrivalAt":"2026-07-31T12:00:00.000Z","deliveredAt":"2026-07-31T12:00:00.000Z","distanceM":"valor-ejemplo","temperatureControlled":true,"createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z"}]` |
| `data[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].trackableSubjectId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].carrierId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].tenantId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].shipmentNumber` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].originAddressId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].destinationAddressId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].assignedCourierUserId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].trackedSubjectId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].statusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].dispatchedAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].estimatedArrivalAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].deliveredAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].distanceM` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].temperatureControlled` | No | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: LOGISTICS_OPERATOR, TRACKING_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tracking/shipments"
}
```

---

## 4. POST /tracking/shipments/{id}/cancel

- **Módulo:** `tracking`
- **Etiqueta OpenAPI:** `tracking`
- **Nombre:** Cancelar el envío y cerrar el sujeto
- **Operation ID:** `TrackingController_cancelShipment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TrackingController.cancelShipment](../../src/modules/tracking/controllers/tracking.controller.ts)

### Descripción de negocio

Un envío entregado no se cancela.


### Descripción del sistema

NestJS resuelve `POST /tracking/shipments/{id}/cancel` en `TrackingController_cancelShipment`. El controlador delega en `TrackingService.cancelShipment`. Valida el body como `CancelShipmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<CancelShipmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CancelShipmentDto`; los campos opcionales se omiten.

```http
POST /tracking/shipments/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `LOGISTICS_OPERATOR`, `TRACKING_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | Sin restricción adicional declarada | Por qué se cancela | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tracking/shipments/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
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
| 200 | Operación completada correctamente. | `Promise<CancelShipmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CancelShipmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CancelShipmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CancelShipmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CancelShipmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CancelShipmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CancelShipmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CancelShipmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CancelShipmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CancelShipmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CancelShipmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "shipmentId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "subjectStateConceptId": "00000000-0000-4000-8000-000000000001",
  "eventId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `shipmentId` | Sí | `string` | formato `uuid` | Identificador asociado a shipment. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `subjectStateConceptId` | Sí | `string` | formato `uuid` | Estado en el que queda el sujeto | `00000000-0000-4000-8000-000000000001` |
| `eventId` | Sí | `string` | formato `uuid` | Identificador asociado a event. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: LOGISTICS_OPERATOR, TRACKING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Envío no encontrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 404 | `NOT_FOUND` | Sujeto rastreable no encontrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 409 | `CONFLICT` | El envío ya está cancelado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un envío entregado no se cancela | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tracking/shipments/{id}/cancel"
}
```

---

## 5. POST /tracking/shipments/{id}/delivery-proof

- **Módulo:** `tracking`
- **Etiqueta OpenAPI:** `tracking`
- **Nombre:** Registrar la prueba de entrega y cerrar
- **Operation ID:** `TrackingController_recordDeliveryProof`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TrackingController.recordDeliveryProof](../../src/modules/tracking/controllers/tracking.controller.ts)

### Descripción de negocio

La firma exige archivo de firma; la foto, foto.


### Descripción del sistema

NestJS resuelve `POST /tracking/shipments/{id}/delivery-proof` en `TrackingController_recordDeliveryProof`. El controlador delega en `TrackingService.recordDeliveryProof`. Valida el body como `RecordDeliveryProofDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeliveryProofResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordDeliveryProofDto`; los campos opcionales se omiten.

```http
POST /tracking/shipments/00000000-0000-4000-8000-000000000001/delivery-proof HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "proofType": "SIGNATURE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `COURIER`, `LOGISTICS_OPERATOR`, `TRACKING_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `proofType` | Sí | `string` | valores: `SIGNATURE`, `PHOTO` | Sin descripción específica en el contrato OpenAPI. | `SIGNATURE` |
| `recipientName` | No | `string` | longitud máxima 200 | Quién recibió | `Nombre de ejemplo` |
| `signatureFileId` | No | `string` | formato `uuid` | Firma capturada; obligatoria si el tipo es SIGNATURE | `00000000-0000-4000-8000-000000000001` |
| `photoFileId` | No | `string` | formato `uuid` | Foto de la entrega; obligatoria si el tipo es PHOTO | `00000000-0000-4000-8000-000000000001` |
| `latitude` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `longitude` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `locationText` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tracking/shipments/00000000-0000-4000-8000-000000000001/delivery-proof HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "proofType": "SIGNATURE",
  "recipientName": "Nombre de ejemplo",
  "signatureFileId": "00000000-0000-4000-8000-000000000001",
  "photoFileId": "00000000-0000-4000-8000-000000000001",
  "latitude": "valor-ejemplo",
  "longitude": "valor-ejemplo",
  "locationText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DeliveryProofResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeliveryProofResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeliveryProofResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeliveryProofResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DeliveryProofResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeliveryProofResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeliveryProofResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeliveryProofResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeliveryProofResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeliveryProofResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeliveryProofResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "shipmentId": "00000000-0000-4000-8000-000000000001",
  "shipmentStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "subjectStateConceptId": "00000000-0000-4000-8000-000000000001",
  "eventId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `shipmentId` | Sí | `string` | formato `uuid` | Identificador asociado a shipment. | `00000000-0000-4000-8000-000000000001` |
| `shipmentStatusConceptId` | Sí | `string` | formato `uuid` | Estado en el que queda el envío | `00000000-0000-4000-8000-000000000001` |
| `subjectStateConceptId` | Sí | `string` | formato `uuid` | Estado en el que queda el sujeto | `00000000-0000-4000-8000-000000000001` |
| `eventId` | Sí | `string` | formato `uuid` | Evento de entrega registrado | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: COURIER, LOGISTICS_OPERATOR, TRACKING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Envío no encontrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 404 | `NOT_FOUND` | Sujeto rastreable no encontrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 409 | `CONFLICT` | El envío ya está entregado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 409 | `CONFLICT` | El envío ya tiene prueba de entrega verificada | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una prueba por firma necesita el archivo de firma | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 422 | `PRECONDITION_FAILED` | Una prueba por foto necesita la foto | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 422 | `PRECONDITION_FAILED` | El envío no admite entrega en su estado actual | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tracking/shipments/{id}/delivery-proof"
}
```

---

## 6. POST /tracking/shipments/{id}/dispatch

- **Módulo:** `tracking`
- **Etiqueta OpenAPI:** `tracking`
- **Nombre:** Despachar el envío
- **Operation ID:** `TrackingController_dispatchShipment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TrackingController.dispatchShipment](../../src/modules/tracking/controllers/tracking.controller.ts)

### Descripción de negocio

Exige transportista o mensajero asignado.


### Descripción del sistema

NestJS resuelve `POST /tracking/shipments/{id}/dispatch` en `TrackingController_dispatchShipment`. El controlador delega en `TrackingService.dispatchShipment`. Valida el body como `DispatchShipmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<DispatchResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DispatchShipmentDto`; los campos opcionales se omiten.

```http
POST /tracking/shipments/00000000-0000-4000-8000-000000000001/dispatch HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `LOGISTICS_OPERATOR`, `TRACKING_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `locationText` | No | `string` | longitud máxima 300 | Dónde se despachó | `valor-ejemplo` |
| `assignedCourierUserId` | No | `string` | formato `uuid` | Mensajero que se hace cargo | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tracking/shipments/00000000-0000-4000-8000-000000000001/dispatch HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "locationText": "valor-ejemplo",
  "assignedCourierUserId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DispatchResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DispatchResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "eventId": "00000000-0000-4000-8000-000000000001",
  "dispatchedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `eventId` | Sí | `string` | formato `uuid` | Evento de despacho registrado | `00000000-0000-4000-8000-000000000001` |
| `dispatchedAt` | Sí | `string` | formato `date-time` | Valor de dispatched at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: LOGISTICS_OPERATOR, TRACKING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Envío no encontrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 404 | `NOT_FOUND` | Sujeto rastreable no encontrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El envío no está en preparación | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 422 | `PRECONDITION_FAILED` | El despacho necesita transportista o mensajero asignado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tracking/shipments/{id}/dispatch"
}
```

---

## 7. POST /tracking/shipments/{id}/eta/recompute

- **Módulo:** `tracking`
- **Etiqueta OpenAPI:** `tracking`
- **Nombre:** Registrar una estimación de llegada
- **Operation ID:** `TrackingController_recomputeEta`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TrackingController.recomputeEta](../../src/modules/tracking/controllers/tracking.controller.ts)

### Descripción de negocio

Histórico append-only; sólo la más reciente pasa al envío.


### Descripción del sistema

NestJS resuelve `POST /tracking/shipments/{id}/eta/recompute` en `TrackingController_recomputeEta`. El controlador delega en `TrackingService.recomputeEta`. Valida el body como `RecomputeEtaDto` y consume `application/json`. El tipo de retorno estático es `Promise<EtaResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecomputeEtaDto`; los campos opcionales se omiten.

```http
POST /tracking/shipments/00000000-0000-4000-8000-000000000001/eta/recompute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "estimatedArrivalAt": "2026-07-31T12:00:00.000Z",
  "method": "CARRIER"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `LOGISTICS_OPERATOR`, `TRACKING_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `estimatedArrivalAt` | Sí | `string` | formato `date-time` | Llegada estimada | `2026-07-31T12:00:00.000Z` |
| `method` | Sí | `string` | valores: `CARRIER`, `DISTANCE`, `MANUAL` | Sin descripción específica en el contrato OpenAPI. | `CARRIER` |
| `confidencePct` | No | `number` | mínimo 0; máximo 100 | Confianza de la estimación | `1` |
| `distanceM` | No | `string` | Sin restricción adicional declarada | Distancia restante en metros | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tracking/shipments/00000000-0000-4000-8000-000000000001/eta/recompute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "estimatedArrivalAt": "2026-07-31T12:00:00.000Z",
  "method": "CARRIER",
  "confidencePct": 1,
  "distanceM": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EtaResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EtaResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EtaResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EtaResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<EtaResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EtaResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EtaResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EtaResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EtaResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EtaResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EtaResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "shipmentId": "00000000-0000-4000-8000-000000000001",
  "estimatedArrivalAt": "2026-07-31T12:00:00.000Z",
  "applied": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Estimación registrada | `00000000-0000-4000-8000-000000000001` |
| `shipmentId` | Sí | `string` | formato `uuid` | Identificador asociado a shipment. | `00000000-0000-4000-8000-000000000001` |
| `estimatedArrivalAt` | Sí | `string` | formato `date-time` | Llegada estimada del envío | `2026-07-31T12:00:00.000Z` |
| `applied` | Sí | `boolean` | Sin restricción adicional declarada | true si esta estimación pasó a ser la vigente del envío | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, LOGISTICS_OPERATOR, TRACKING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Envío no encontrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El envío ya no admite estimaciones | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tracking/shipments/{id}/eta/recompute"
}
```

---

## 8. POST /tracking/shipments/{id}/exception

- **Módulo:** `tracking`
- **Etiqueta OpenAPI:** `tracking`
- **Nombre:** Marcar una excepción o reintento de entrega
- **Operation ID:** `TrackingController_recordException`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TrackingController.recordException](../../src/modules/tracking/controllers/tracking.controller.ts)

### Descripción de negocio

Sube la prioridad del sujeto y puede dejar constancia del intento fallido.


### Descripción del sistema

NestJS resuelve `POST /tracking/shipments/{id}/exception` en `TrackingController_recordException`. El controlador delega en `TrackingService.recordException`. Valida el body como `RecordExceptionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExceptionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordExceptionDto`; los campos opcionales se omiten.

```http
POST /tracking/shipments/00000000-0000-4000-8000-000000000001/exception HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `COURIER`, `LOGISTICS_OPERATOR`, `TRACKING_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | Sin restricción adicional declarada | Qué pasó | `Texto descriptivo de ejemplo` |
| `scheduleRetry` | No | `boolean` | Sin restricción adicional declarada | Se reprograma un nuevo intento de entrega | `false` |
| `locationText` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `photoFileId` | No | `string` | formato `uuid` | Foto del intento fallido; deja constancia del intento | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tracking/shipments/00000000-0000-4000-8000-000000000001/exception HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo",
  "scheduleRetry": false,
  "locationText": "valor-ejemplo",
  "photoFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExceptionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExceptionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "shipmentId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "eventId": "00000000-0000-4000-8000-000000000001",
  "failedAttemptProofId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `shipmentId` | Sí | `string` | formato `uuid` | Identificador asociado a shipment. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `priorityConceptId` | Sí | `string` | formato `uuid` | Prioridad a la que sube el sujeto | `00000000-0000-4000-8000-000000000001` |
| `eventId` | Sí | `string` | formato `uuid` | Identificador asociado a event. | `00000000-0000-4000-8000-000000000001` |
| `failedAttemptProofId` | No | `string` | formato `uuid` | Constancia del intento fallido | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: COURIER, LOGISTICS_OPERATOR, TRACKING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Envío no encontrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 404 | `NOT_FOUND` | Sujeto rastreable no encontrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El envío ya no admite excepciones | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tracking/shipments/{id}/exception"
}
```

---

## 9. POST /tracking/shipments/{id}/handoffs

- **Módulo:** `tracking`
- **Etiqueta OpenAPI:** `tracking`
- **Nombre:** Registrar el traspaso entre responsables
- **Operation ID:** `TrackingController_recordHandoff`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TrackingController.recordHandoff](../../src/modules/tracking/controllers/tracking.controller.ts)

### Descripción de negocio

Actualiza quién responde del envío en la misma transacción.


### Descripción del sistema

NestJS resuelve `POST /tracking/shipments/{id}/handoffs` en `TrackingController_recordHandoff`. El controlador delega en `TrackingService.recordHandoff`. Valida el body como `RecordHandoffDto` y consume `application/json`. El tipo de retorno estático es `Promise<HandoffResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordHandoffDto`; los campos opcionales se omiten.

```http
POST /tracking/shipments/00000000-0000-4000-8000-000000000001/handoffs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "handoffType": "PICKUP"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `LOGISTICS_OPERATOR`, `COURIER`, `TRACKING_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `handoffType` | Sí | `string` | valores: `PICKUP`, `TRANSFER`, `DROPOFF` | Sin descripción específica en el contrato OpenAPI. | `PICKUP` |
| `fromPartyType` | No | `string` | longitud máxima 100 | Tipo de quien entrega | `valor-ejemplo` |
| `fromPartyId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `toPartyType` | No | `string` | longitud máxima 100 | Tipo de quien recibe | `valor-ejemplo` |
| `toPartyId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `newCarrierId` | No | `string` | formato `uuid` | Transportista que pasa a ser responsable | `00000000-0000-4000-8000-000000000001` |
| `newCourierUserId` | No | `string` | formato `uuid` | Mensajero que pasa a ser responsable | `00000000-0000-4000-8000-000000000001` |
| `locationText` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `occurredAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tracking/shipments/00000000-0000-4000-8000-000000000001/handoffs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "handoffType": "PICKUP",
  "fromPartyType": "valor-ejemplo",
  "fromPartyId": "00000000-0000-4000-8000-000000000001",
  "toPartyType": "valor-ejemplo",
  "toPartyId": "00000000-0000-4000-8000-000000000001",
  "newCarrierId": "00000000-0000-4000-8000-000000000001",
  "newCourierUserId": "00000000-0000-4000-8000-000000000001",
  "locationText": "valor-ejemplo",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<HandoffResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<HandoffResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<HandoffResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<HandoffResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<HandoffResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<HandoffResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<HandoffResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<HandoffResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<HandoffResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<HandoffResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HandoffResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "shipmentId": "00000000-0000-4000-8000-000000000001",
  "eventId": "00000000-0000-4000-8000-000000000001",
  "carrierId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `shipmentId` | Sí | `string` | formato `uuid` | Identificador asociado a shipment. | `00000000-0000-4000-8000-000000000001` |
| `eventId` | Sí | `string` | formato `uuid` | Evento de traspaso registrado | `00000000-0000-4000-8000-000000000001` |
| `carrierId` | No | `string` | formato `uuid` | Transportista responsable tras el traspaso | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: LOGISTICS_OPERATOR, COURIER, TRACKING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Envío no encontrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 404 | `NOT_FOUND` | Transportista no encontrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El envío ya no admite traspasos | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 422 | `PRECONDITION_FAILED` | El transportista no está activo | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tracking/shipments/{id}/handoffs"
}
```

---

## 10. POST /tracking/sla/scan

- **Módulo:** `tracking`
- **Etiqueta OpenAPI:** `tracking`
- **Nombre:** Barrer los compromisos de hito vencidos
- **Operation ID:** `TrackingController_scanSla`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TrackingController.scanSla](../../src/modules/tracking/controllers/tracking.controller.ts)

### Descripción de negocio

Toma con SKIP LOCKED; el incumplimiento sube la prioridad del sujeto.


### Descripción del sistema

NestJS resuelve `POST /tracking/sla/scan` en `TrackingController_scanSla`. El controlador delega en `TrackingService.scanSla`. Valida el body como `ScanSlaDto` y consume `application/json`. El tipo de retorno estático es `Promise<ScanSlaResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ScanSlaDto`; los campos opcionales se omiten.

```http
POST /tracking/sla/scan HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `batchSize` | No | `number` | mínimo 1; máximo 1000 | Sujetos a revisar por barrido | `100` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tracking/sla/scan HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "batchSize": 100
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ScanSlaResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ScanSlaResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ScanSlaResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ScanSlaResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ScanSlaResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ScanSlaResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ScanSlaResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ScanSlaResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ScanSlaResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ScanSlaResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "scanned": 1,
  "breached": 1,
  "escalated": 1,
  "eventIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `scanned` | Sí | `number` | Sin restricción adicional declarada | Sujetos abiertos revisados | `1` |
| `breached` | Sí | `number` | Sin restricción adicional declarada | Sujetos con incumplimiento de compromiso detectado | `1` |
| `escalated` | Sí | `number` | Sin restricción adicional declarada | Sujetos cuya prioridad subió por el incumplimiento | `1` |
| `eventIds` | Sí | `array<string>` | formato `uuid` | Eventos de incumplimiento creados | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
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
  "path": "/tracking/sla/scan"
}
```

---

## 11. GET /tracking/trackable-subjects

- **Módulo:** `tracking`
- **Etiqueta OpenAPI:** `tracking-collections`
- **Nombre:** Listar sujetos rastreables del tenant
- **Operation ID:** `TrackingCollectionsController_listTrackableSubjects`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TrackingCollectionsController.listTrackableSubjects](../../src/modules/tracking/controllers/tracking-collections.controller.ts)

### Descripción de negocio

Listar sujetos rastreables del tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: V37-07: listar sujetos rastreables del tenant.

### Descripción del sistema

NestJS resuelve `GET /tracking/trackable-subjects` en `TrackingCollectionsController_listTrackableSubjects`. El controlador delega en `TrackingCollectionsService.listTrackableSubjects`. No recibe body. El tipo de retorno estático es `Promise<TrackableSubjectPageDto>`.

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
GET /tracking/trackable-subjects HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `TRACKING_ADMIN`, `LOGISTICS_OPERATOR`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /tracking/trackable-subjects?page=1&pageSize=20&order=DESC&sortBy=createdAt&stateConceptId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TrackableSubjectPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<TrackableSubjectPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<TrackableSubjectPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<TrackableSubjectPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<TrackableSubjectPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<TrackableSubjectPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TrackableSubjectPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "tenantId": {},
      "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "subjectRefType": "valor-ejemplo",
      "subjectRefId": "00000000-0000-4000-8000-000000000001",
      "trackingNumber": "valor-ejemplo",
      "currentStatusConceptId": {},
      "currentMilestoneId": {},
      "priorityConceptId": {},
      "openedAt": "2026-07-31T12:00:00.000Z",
      "closedAt": "2026-07-31T12:00:00.000Z",
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
| `data` | Sí | `array<TrackableSubjectItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","tenantId":{},"subjectTypeConceptId":"00000000-0000-4000-8000-000000000001","subjectRefType":"valor-ejemplo","subjectRefId":"00000000-0000-4000-8000-000000000001","trackingNumber":"valor-ejemplo","currentStatusConceptId":{},"currentMilestoneId":{},"priorityConceptId":{},"openedAt":"2026-07-31T12:00:00.000Z","closedAt":"2026-07-31T12:00:00.000Z","stateConceptId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z"}]` |
| `data[].id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].tenantId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].subjectTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].subjectRefType` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].subjectRefId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `data[].trackingNumber` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `data[].currentStatusConceptId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].currentMilestoneId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].priorityConceptId` | No | `object` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `data[].openedAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `data[].closedAt` | No | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: TRACKING_ADMIN, LOGISTICS_OPERATOR. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tracking/trackable-subjects"
}
```

---

## 12. POST /tracking/trackable-subjects

- **Módulo:** `tracking`
- **Etiqueta OpenAPI:** `tracking`
- **Nombre:** Abrir un sujeto rastreable y su envío
- **Operation ID:** `TrackingController_openSubject`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TrackingController.openSubject](../../src/modules/tracking/controllers/tracking.controller.ts)

### Descripción de negocio

El número de seguimiento es opaco: no deja deducir qué se transporta.


### Descripción del sistema

NestJS resuelve `POST /tracking/trackable-subjects` en `TrackingController_openSubject`. El controlador delega en `TrackingService.openSubject`. Valida el body como `OpenSubjectDto` y consume `application/json`. El tipo de retorno estático es `Promise<SubjectResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `OpenSubjectDto`; los campos opcionales se omiten.

```http
POST /tracking/trackable-subjects HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "subjectType": "SPECIMEN",
  "subjectRefType": "valor-ejemplo",
  "subjectRefId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `TRACKING_ADMIN`, `LOGISTICS_OPERATOR`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `subjectType` | Sí | `string` | valores: `SPECIMEN`, `ORDER`, `DEVICE` | Sin descripción específica en el contrato OpenAPI. | `SPECIMEN` |
| `subjectRefType` | Sí | `string` | longitud máxima 100 | Tipo de la entidad rastreada | `valor-ejemplo` |
| `subjectRefId` | Sí | `string` | formato `uuid` | Entidad rastreada | `00000000-0000-4000-8000-000000000001` |
| `carrierId` | No | `string` | formato `uuid` | Transportista asignado | `00000000-0000-4000-8000-000000000001` |
| `originAddressId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `destinationAddressId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `assignedCourierUserId` | No | `string` | formato `uuid` | Mensajero asignado | `00000000-0000-4000-8000-000000000001` |
| `temperatureControlled` | No | `boolean` | Sin restricción adicional declarada | El envío exige cadena de frío | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tracking/trackable-subjects HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "subjectType": "SPECIMEN",
  "subjectRefType": "valor-ejemplo",
  "subjectRefId": "00000000-0000-4000-8000-000000000001",
  "carrierId": "00000000-0000-4000-8000-000000000001",
  "originAddressId": "00000000-0000-4000-8000-000000000001",
  "destinationAddressId": "00000000-0000-4000-8000-000000000001",
  "assignedCourierUserId": "00000000-0000-4000-8000-000000000001",
  "temperatureControlled": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SubjectResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SubjectResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SubjectResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SubjectResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SubjectResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SubjectResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SubjectResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SubjectResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SubjectResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SubjectResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "trackingNumber": "valor-ejemplo",
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "currentStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "shipmentId": "00000000-0000-4000-8000-000000000001",
  "shipmentNumber": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `trackingNumber` | Sí | `string` | Sin restricción adicional declarada | Número de seguimiento, opaco y único | `valor-ejemplo` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `currentStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a current status concept. | `00000000-0000-4000-8000-000000000001` |
| `shipmentId` | Sí | `string` | formato `uuid` | Identificador asociado a shipment. | `00000000-0000-4000-8000-000000000001` |
| `shipmentNumber` | Sí | `string` | Sin restricción adicional declarada | Número del envío | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: TRACKING_ADMIN, LOGISTICS_OPERATOR. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Transportista no encontrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 409 | `CONFLICT` | La entidad ya tiene un seguimiento abierto | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 409 | `CONFLICT` | No se pudo generar un número de seguimiento libre | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 409 | `CONFLICT` | No se pudo asignar número de envío | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El transportista no está activo | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tracking/trackable-subjects"
}
```

---

## 13. POST /tracking/trackable-subjects/{id}/events

- **Módulo:** `tracking`
- **Etiqueta OpenAPI:** `tracking`
- **Nombre:** Registrar un evento y avanzar el hito
- **Operation ID:** `TrackingController_recordEvent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TrackingController.recordEvent](../../src/modules/tracking/controllers/tracking.controller.ts)

### Descripción de negocio

Log append-only; el hito terminal cierra el seguimiento.


### Descripción del sistema

NestJS resuelve `POST /tracking/trackable-subjects/{id}/events` en `TrackingController_recordEvent`. El controlador delega en `TrackingService.recordEvent`. Valida el body como `RecordEventDto` y consume `application/json`. El tipo de retorno estático es `Promise<EventResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordEventDto`; los campos opcionales se omiten.

```http
POST /tracking/trackable-subjects/00000000-0000-4000-8000-000000000001/events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "CREATED"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `LOGISTICS_OPERATOR`, `COURIER`, `TRACKING_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `CREATED`, `PREPARING`, `IN_TRANSIT`, `HANDOFF`, `DELIVERED`, `CANCELLED` | Sin descripción específica en el contrato OpenAPI. | `CREATED` |
| `milestoneCode` | No | `string` | longitud máxima 100 | Código del hito alcanzado; si se indica, mueve el hito actual | `CODIGO_EJEMPLO` |
| `source` | No | `string` | valores: `OPERATOR`, `CARRIER_WEBHOOK`, `COURIER_APP`, `SYSTEM` | Sin descripción específica en el contrato OpenAPI. | `OPERATOR` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `locationText` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `latitude` | No | `string` | Sin restricción adicional declarada | Latitud, como cadena decimal | `valor-ejemplo` |
| `longitude` | No | `string` | Sin restricción adicional declarada | Longitud, como cadena decimal | `valor-ejemplo` |
| `locationPingId` | No | `string` | formato `uuid` | Ping de localización que lo respalda | `00000000-0000-4000-8000-000000000001` |
| `occurredAt` | No | `string` | formato `date-time` | Cuándo ocurrió; por defecto, ahora | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tracking/trackable-subjects/00000000-0000-4000-8000-000000000001/events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "CREATED",
  "milestoneCode": "CODIGO_EJEMPLO",
  "source": "OPERATOR",
  "description": "Texto descriptivo de ejemplo",
  "locationText": "valor-ejemplo",
  "latitude": "valor-ejemplo",
  "longitude": "valor-ejemplo",
  "locationPingId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EventResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EventResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EventResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EventResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<EventResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EventResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EventResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EventResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EventResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EventResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EventResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "trackableSubjectId": "00000000-0000-4000-8000-000000000001",
  "currentStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "currentMilestoneId": "00000000-0000-4000-8000-000000000001",
  "subjectClosed": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `trackableSubjectId` | Sí | `string` | formato `uuid` | Identificador asociado a trackable subject. | `00000000-0000-4000-8000-000000000001` |
| `currentStatusConceptId` | Sí | `string` | formato `uuid` | Estado en el que queda el sujeto | `00000000-0000-4000-8000-000000000001` |
| `currentMilestoneId` | No | `string` | formato `uuid` | Hito alcanzado, si lo hubo | `00000000-0000-4000-8000-000000000001` |
| `subjectClosed` | Sí | `boolean` | Sin restricción adicional declarada | true si el hito alcanzado cierra el seguimiento | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: LOGISTICS_OPERATOR, COURIER, TRACKING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sujeto rastreable no encontrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 404 | `NOT_FOUND` | Hito no encontrado para el tipo de sujeto | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El seguimiento del sujeto está cerrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/tracking/trackable-subjects/{id}/events"
}
```

---

## 14. POST /tracking/webhooks/carriers/{carrierCode}

- **Módulo:** `tracking`
- **Etiqueta OpenAPI:** `tracking`
- **Nombre:** Ingerir el webhook del transportista
- **Operation ID:** `TrackingController_ingestCarrierWebhook`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TrackingController.ingestCarrierWebhook](../../src/modules/tracking/controllers/tracking.controller.ts)

### Descripción de negocio

Ruta pública: el transportista no presenta sesión. Idempotente por identificador del evento externo.


### Descripción del sistema

NestJS resuelve `POST /tracking/webhooks/carriers/{carrierCode}` en `TrackingController_ingestCarrierWebhook`. El controlador delega en `TrackingService.ingestCarrierWebhook`. Valida el body como `CarrierWebhookDto` y consume `application/json`. El tipo de retorno estático es `Promise<WebhookResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `carrierCode` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CarrierWebhookDto`; los campos opcionales se omiten.

```http
POST /tracking/webhooks/carriers/CODIGO_EJEMPLO HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "trackingNumber": "valor-ejemplo",
  "externalStatusCode": "CODIGO_EJEMPLO",
  "externalEventId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `trackingNumber` | Sí | `string` | longitud máxima 200 | Número de seguimiento que el transportista reporta | `valor-ejemplo` |
| `externalStatusCode` | Sí | `string` | longitud máxima 100 | Código de estado del transportista | `CODIGO_EJEMPLO` |
| `externalEventId` | Sí | `string` | longitud máxima 200 | Identificador del evento en el transportista; con él se deduplica | `00000000-0000-4000-8000-000000000001` |
| `occurredAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `locationText` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /tracking/webhooks/carriers/CODIGO_EJEMPLO HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "trackingNumber": "valor-ejemplo",
  "externalStatusCode": "CODIGO_EJEMPLO",
  "externalEventId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "locationText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<WebhookResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<WebhookResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<WebhookResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<WebhookResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<WebhookResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<WebhookResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<WebhookResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<WebhookResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<WebhookResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<WebhookResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WebhookResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "eventId": "00000000-0000-4000-8000-000000000001",
  "trackableSubjectId": "00000000-0000-4000-8000-000000000001",
  "currentStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `eventId` | No | `string` | formato `uuid` | Evento registrado; ausente si era duplicado | `00000000-0000-4000-8000-000000000001` |
| `trackableSubjectId` | Sí | `string` | formato `uuid` | Identificador asociado a trackable subject. | `00000000-0000-4000-8000-000000000001` |
| `currentStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a current status concept. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si el evento ya se había recibido | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Transportista no encontrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 404 | `NOT_FOUND` | Número de seguimiento desconocido | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
| 404 | `NOT_FOUND` | Sujeto rastreable no encontrado | Excepción explícita en src/modules/tracking/services/tracking.service.ts |
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
  "path": "/tracking/webhooks/carriers/{carrierCode}"
}
```

---

