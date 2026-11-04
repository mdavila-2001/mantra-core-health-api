<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `marketing`

Referencia exhaustiva de 31 operación(es) del módulo `marketing`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `marketing`, `marketing-insights`
- **Controladores:** `InsightsFactsController`, `InsightsWorkflowController`, `InsightsWorkspaceController`, `MarketingController`, `TrackedLinkRedirectController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /marketing/attribution/compute](#1-post-marketing-attribution-compute) — Calcular la atribución multi-touch de una conversión
2. [POST /marketing/campaigns](#2-post-marketing-campaigns) — Lanzar una campaña multicanal desde un segmento
3. [POST /marketing/campaigns/{id}/members/materialize](#3-post-marketing-campaigns-id-members-materialize) — Materializar la audiencia de la campaña desde su segmento
4. [POST /marketing/content-templates/{code}/versions](#4-post-marketing-content-templates-code-versions) — Publicar una versión de plantilla de contenido
5. [POST /marketing/enrollments/{id}/advance](#5-post-marketing-enrollments-id-advance) — Avanzar la inscripción al siguiente paso
6. [POST /marketing/enrollments/{id}/exit](#6-post-marketing-enrollments-id-exit) — Cerrar la inscripción por meta, baja o rebote
7. [GET /marketing/insights/alert-rules](#7-get-marketing-insights-alert-rules) — Las siete reglas de alerta con su umbral y estado
8. [PATCH /marketing/insights/alert-rules/{code}](#8-patch-marketing-insights-alert-rules-code) — Enciende, apaga o cambia el umbral (1 a 500) de una regla
9. [GET /marketing/insights/alert-workflow](#9-get-marketing-insights-alert-workflow) — Estado, responsable e historial de las alertas que existen
10. [PUT /marketing/insights/alert-workflow/{fingerprint}](#10-put-marketing-insights-alert-workflow-fingerprint) — Cambia estado y/o responsable de una alerta (la crea la primera vez)
11. [GET /marketing/insights/campaign-facts](#11-get-marketing-insights-campaign-facts) — Hechos diarios por campaña y canal; lo que la fuente no reporta se declara en meta.notMeasured
12. [GET /marketing/insights/catalog](#12-get-marketing-insights-catalog) — Campañas (con sus canales y objetivos) e hitos de Insights
13. [GET /marketing/insights/notification-preferences](#13-get-marketing-insights-notification-preferences) — Preferencias de aviso del usuario (rowVersion 0 si no guardó nada)
14. [PUT /marketing/insights/notification-preferences](#14-put-marketing-insights-notification-preferences) — Guarda las preferencias de aviso del usuario (no se envía nada)
15. [GET /marketing/insights/reports](#15-get-marketing-insights-reports) — Historial de informes del usuario (máximo 12, el más nuevo primero)
16. [DELETE /marketing/insights/reports/{id}](#16-delete-marketing-insights-reports-id) — Borra un informe del usuario (idempotente)
17. [PUT /marketing/insights/reports/{id}](#17-put-marketing-insights-reports-id) — Guarda un informe en el historial (idempotente por id)
18. [GET /marketing/insights/saved-views](#18-get-marketing-insights-saved-views) — Vistas guardadas del usuario
19. [DELETE /marketing/insights/saved-views/{id}](#19-delete-marketing-insights-saved-views-id) — Borra una vista del usuario (idempotente)
20. [PUT /marketing/insights/saved-views/{id}](#20-put-marketing-insights-saved-views-id) — Guarda una vista con el id que manda el cliente (idempotente)
21. [GET /marketing/insights/user-preferences](#21-get-marketing-insights-user-preferences) — Preferencias de interfaz del usuario (rowVersion 0 si no guardó nada)
22. [PUT /marketing/insights/user-preferences](#22-put-marketing-insights-user-preferences) — Guarda las preferencias de interfaz del usuario
23. [POST /marketing/journeys](#23-post-marketing-journeys) — Crear un journey en borrador
24. [POST /marketing/journeys/{id}/activate](#24-post-marketing-journeys-id-activate) — Activar el journey e inscribir la cohorte inicial
25. [POST /marketing/journeys/{id}/steps](#25-post-marketing-journeys-id-steps) — Añadir pasos al journey
26. [POST /marketing/segments](#26-post-marketing-segments) — Crear un segmento y ligarlo a su read model
27. [POST /marketing/segments/{id}/refresh](#27-post-marketing-segments-id-refresh) — Recomputar la membresía del segmento
28. [POST /marketing/touchpoints](#28-post-marketing-touchpoints) — Registrar un touchpoint de marketing
29. [POST /marketing/tracked-links](#29-post-marketing-tracked-links) — Crear un enlace rastreable con parámetros UTM
30. [POST /marketing/tracked-links/{id}/recipient-tokens](#30-post-marketing-tracked-links-id-recipient-tokens) — Emitir el token de destinatario de un enlace rastreable
31. [GET /r/{code}](#31-get-r-code) — Resolver un enlace rastreable y registrar el click

---

## 1. POST /marketing/attribution/compute

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Calcular la atribución multi-touch de una conversión
- **Operation ID:** `MarketingController_computeAttribution`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MarketingController.computeAttribution](../../src/modules/marketing/controllers/marketing.controller.ts)

### Descripción de negocio

Recalcular reemplaza el reparto anterior del mismo modelo.


### Descripción del sistema

NestJS resuelve `POST /marketing/attribution/compute` en `MarketingController_computeAttribution`. El controlador delega en `MarketingJourneysService.computeAttribution`. Valida el body como `ComputeAttributionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ComputeAttributionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ComputeAttributionDto`; los campos opcionales se omiten.

```http
POST /marketing/attribution/compute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "conversionRefType": "opportunity",
  "conversionRefId": "00000000-0000-4000-8000-000000000001",
  "memberType": "CONTACT",
  "memberRefId": "00000000-0000-4000-8000-000000000001",
  "model": "LAST_TOUCH",
  "windowFrom": "2026-07-31T12:00:00.000Z",
  "windowTo": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MARKETING_MANAGER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `conversionRefType` | Sí | `string` | valores: `opportunity`, `enrollment`, `payment_intent`, `appointment_booking`, `order` | Sin descripción específica en el contrato OpenAPI. | `opportunity` |
| `conversionRefId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `memberType` | Sí | `string` | valores: `CONTACT`, `PATIENT` | Sin descripción específica en el contrato OpenAPI. | `CONTACT` |
| `memberRefId` | Sí | `string` | formato `uuid` | Miembro cuyo recorrido se atribuye | `00000000-0000-4000-8000-000000000001` |
| `model` | Sí | `string` | valores: `LAST_TOUCH`, `FIRST_TOUCH`, `LINEAR` | Sin descripción específica en el contrato OpenAPI. | `LAST_TOUCH` |
| `windowFrom` | Sí | `string` | formato `date-time` | Inicio de la ventana de atribución | `2026-07-31T12:00:00.000Z` |
| `windowTo` | Sí | `string` | formato `date-time` | Momento de la conversión | `2026-07-31T12:00:00.000Z` |
| `conversionValue` | No | `string` | Sin restricción adicional declarada | Valor de la conversión a repartir, como cadena decimal | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /marketing/attribution/compute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "conversionRefType": "opportunity",
  "conversionRefId": "00000000-0000-4000-8000-000000000001",
  "memberType": "CONTACT",
  "memberRefId": "00000000-0000-4000-8000-000000000001",
  "model": "LAST_TOUCH",
  "windowFrom": "2026-07-31T12:00:00.000Z",
  "windowTo": "2026-07-31T12:00:00.000Z",
  "conversionValue": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ComputeAttributionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ComputeAttributionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ComputeAttributionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ComputeAttributionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ComputeAttributionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ComputeAttributionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ComputeAttributionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ComputeAttributionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ComputeAttributionResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ComputeAttributionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ComputeAttributionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "conversionRefType": "valor-ejemplo",
  "conversionRefId": "00000000-0000-4000-8000-000000000001",
  "attributionModelConceptId": "00000000-0000-4000-8000-000000000001",
  "replaced": 1,
  "touches": [
    {
      "touchpointId": "00000000-0000-4000-8000-000000000001",
      "weight": "valor-ejemplo",
      "attributedValue": "valor-ejemplo",
      "positionConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `conversionRefType` | Sí | `string` | Sin restricción adicional declarada | Valor de conversion ref type mantenido por la instancia. | `valor-ejemplo` |
| `conversionRefId` | Sí | `string` | formato `uuid` | Identificador asociado a conversion ref. | `00000000-0000-4000-8000-000000000001` |
| `attributionModelConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a attribution model concept. | `00000000-0000-4000-8000-000000000001` |
| `replaced` | Sí | `number` | Sin restricción adicional declarada | Repartos previos del mismo modelo que se reemplazaron | `1` |
| `touches` | Sí | `array<AttributionTouchDto>` | Sin restricción adicional declarada | Valor de touches mantenido por la instancia. | `[{"touchpointId":"00000000-0000-4000-8000-000000000001","weight":"valor-ejemplo","attributedValue":"valor-ejemplo","positionConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `touches[].touchpointId` | Sí | `string` | formato `uuid` | Identificador asociado a touchpoint. | `00000000-0000-4000-8000-000000000001` |
| `touches[].weight` | Sí | `string` | Sin restricción adicional declarada | Peso del touchpoint; la suma del reparto es 1 | `valor-ejemplo` |
| `touches[].attributedValue` | No | `string` | Sin restricción adicional declarada | Valor atribuido a este touchpoint | `valor-ejemplo` |
| `touches[].positionConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a position concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MARKETING_MANAGER. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ventana de atribución es inválida | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay touchpoints del miembro en la ventana de atribución | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/attribution/compute"
}
```

---

## 2. POST /marketing/campaigns

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Lanzar una campaña multicanal desde un segmento
- **Operation ID:** `MarketingController_createCampaign`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MarketingController.createCampaign](../../src/modules/marketing/controllers/marketing.controller.ts)

### Descripción de negocio

Lanzar una campaña multicanal desde un segmento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /marketing/campaigns` en `MarketingController_createCampaign`. El controlador delega en `MarketingCampaignsService.createCampaign`. Valida el body como `CreateCampaignDto` y consume `application/json`. El tipo de retorno estático es `Promise<CampaignResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCampaignDto`; los campos opcionales se omiten.

```http
POST /marketing/campaigns HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "campaignType": "ONE_SHOT",
  "objective": "AWARENESS"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Opcional: el tenant sale del contexto autenticado; si se envía debe coincidir con él | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código de campaña, único por tenant | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `campaignType` | Sí | `string` | valores: `ONE_SHOT`, `RECURRING` | Sin descripción específica en el contrato OpenAPI. | `ONE_SHOT` |
| `objective` | Sí | `string` | valores: `AWARENESS`, `CONVERSION`, `RETENTION` | Sin descripción específica en el contrato OpenAPI. | `AWARENESS` |
| `channel` | No | `string` | valores: `EMAIL`, `SMS`, `PUSH` | Sin descripción específica en el contrato OpenAPI. | `EMAIL` |
| `segmentId` | No | `string` | formato `uuid` | Segmento del que sale la audiencia | `00000000-0000-4000-8000-000000000001` |
| `budgetAmount` | No | `string` | Sin restricción adicional declarada | Presupuesto como cadena decimal | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `promotionId` | No | `string` | formato `uuid` | Promoción asociada | `00000000-0000-4000-8000-000000000001` |
| `adCampaignRefId` | No | `string` | formato `uuid` | Campaña de ads equivalente | `00000000-0000-4000-8000-000000000001` |
| `startAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `endAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /marketing/campaigns HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "campaignType": "ONE_SHOT",
  "objective": "AWARENESS",
  "channel": "EMAIL",
  "segmentId": "00000000-0000-4000-8000-000000000001",
  "budgetAmount": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "promotionId": "00000000-0000-4000-8000-000000000001",
  "adCampaignRefId": "00000000-0000-4000-8000-000000000001",
  "startAt": "2026-07-31T12:00:00.000Z",
  "endAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CampaignResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CampaignResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CampaignResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CampaignResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CampaignResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CampaignResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CampaignResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CampaignResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CampaignResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CampaignResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CampaignResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una campaña con ese código | Excepción explícita en src/modules/marketing/services/marketing-campaigns.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La campaña debe terminar después de empezar | Excepción explícita en src/modules/marketing/services/marketing-campaigns.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/campaigns"
}
```

---

## 3. POST /marketing/campaigns/{id}/members/materialize

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Materializar la audiencia de la campaña desde su segmento
- **Operation ID:** `MarketingController_materializeMembers`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MarketingController.materializeMembers](../../src/modules/marketing/controllers/marketing.controller.ts)

### Descripción de negocio

Idempotente: repetir la llamada no duplica miembros.


### Descripción del sistema

NestJS resuelve `POST /marketing/campaigns/{id}/members/materialize` en `MarketingController_materializeMembers`. El controlador delega en `MarketingCampaignsService.materializeMembers`. Valida el body como `MaterializeMembersDto` y consume `application/json`. El tipo de retorno estático es `Promise<MaterializeMembersResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `MaterializeMembersDto`; los campos opcionales se omiten.

```http
POST /marketing/campaigns/00000000-0000-4000-8000-000000000001/members/materialize HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`, `SYSTEM`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `suppressedMemberRefIds` | No | `array<string>` | formato `uuid` | Miembros a suprimir (do-not-contact o preferencia de mensajería). Se excluyen de la audiencia. | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /marketing/campaigns/00000000-0000-4000-8000-000000000001/members/materialize HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "suppressedMemberRefIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MaterializeMembersResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MaterializeMembersResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MaterializeMembersResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MaterializeMembersResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MaterializeMembersResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MaterializeMembersResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MaterializeMembersResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MaterializeMembersResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MaterializeMembersResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MaterializeMembersResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<MaterializeMembersResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MaterializeMembersResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "campaignId": "00000000-0000-4000-8000-000000000001",
  "materialized": 1,
  "skipped": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `campaignId` | Sí | `string` | formato `uuid` | Identificador asociado a campaign. | `00000000-0000-4000-8000-000000000001` |
| `materialized` | Sí | `number` | Sin restricción adicional declarada | Miembros añadidos a la audiencia en esta llamada | `1` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Miembros omitidos por supresión o por estar ya materializados | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER, SYSTEM. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La campaña no admite materializar audiencia en su estado actual | Excepción explícita en src/modules/marketing/services/marketing-campaigns.service.ts |
| 422 | `PRECONDITION_FAILED` | La campaña no tiene segmento del que derivar audiencia | Excepción explícita en src/modules/marketing/services/marketing-campaigns.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/campaigns/{id}/members/materialize"
}
```

---

## 4. POST /marketing/content-templates/{code}/versions

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Publicar una versión de plantilla de contenido
- **Operation ID:** `MarketingController_publishTemplateVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MarketingController.publishTemplateVersion](../../src/modules/marketing/controllers/marketing.controller.ts)

### Descripción de negocio

La versión anterior queda archivada en la misma transacción.


### Descripción del sistema

NestJS resuelve `POST /marketing/content-templates/{code}/versions` en `MarketingController_publishTemplateVersion`. El controlador delega en `MarketingCampaignsService.publishTemplateVersion`. Valida el body como `PublishTemplateVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<TemplateVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `code` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishTemplateVersionDto`; los campos opcionales se omiten.

```http
POST /marketing/content-templates/CODIGO_EJEMPLO/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "channel": "EMAIL"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CONTENT_EDITOR`, `MARKETING_MANAGER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Opcional: el tenant sale del contexto autenticado; si se envía debe coincidir con él | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `channel` | Sí | `string` | valores: `EMAIL`, `SMS`, `PUSH` | Sin descripción específica en el contrato OpenAPI. | `EMAIL` |
| `languageConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `subject` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `bodyTemplate` | No | `string` | Sin restricción adicional declarada | Cuerpo con marcadores de variables | `valor-ejemplo` |
| `variablesJson` | No | `object` | Sin restricción adicional declarada | Variables declaradas por la plantilla | `{}` |
| `messagingTemplateId` | No | `string` | formato `uuid` | Plantilla equivalente en messaging | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /marketing/content-templates/CODIGO_EJEMPLO/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "channel": "EMAIL",
  "languageConceptId": "00000000-0000-4000-8000-000000000001",
  "subject": "valor-ejemplo",
  "bodyTemplate": "valor-ejemplo",
  "variablesJson": {},
  "messagingTemplateId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TemplateVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TemplateVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TemplateVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TemplateVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TemplateVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TemplateVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TemplateVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TemplateVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TemplateVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TemplateVersionResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<TemplateVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TemplateVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "version": 1,
  "archivedVersionId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Versión publicada | `1` |
| `archivedVersionId` | No | `string` | formato `uuid` | Versión archivada al publicar esta | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CONTENT_EDITOR, MARKETING_MANAGER. | Roles/tenant/guards de autorización |
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
  "path": "/marketing/content-templates/{code}/versions"
}
```

---

## 5. POST /marketing/enrollments/{id}/advance

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Avanzar la inscripción al siguiente paso
- **Operation ID:** `MarketingController_advanceEnrollment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MarketingController.advanceEnrollment](../../src/modules/marketing/controllers/marketing.controller.ts)

### Descripción de negocio

Ejecuta el paso actual (send/wait/branch) y mueve la inscripción.


### Descripción del sistema

NestJS resuelve `POST /marketing/enrollments/{id}/advance` en `MarketingController_advanceEnrollment`. El controlador delega en `MarketingJourneysService.advanceEnrollment`. Valida el body como `AdvanceEnrollmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<AdvanceEnrollmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AdvanceEnrollmentDto`; los campos opcionales se omiten.

```http
POST /marketing/enrollments/00000000-0000-4000-8000-000000000001/advance HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MARKETING_MANAGER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `branchTaken` | No | `boolean` | Sin restricción adicional declarada | Resultado de la condición cuando el paso actual es BRANCH: true toma la rama, false sigue el camino principal. | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /marketing/enrollments/00000000-0000-4000-8000-000000000001/advance HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "branchTaken": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AdvanceEnrollmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AdvanceEnrollmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AdvanceEnrollmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AdvanceEnrollmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AdvanceEnrollmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AdvanceEnrollmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AdvanceEnrollmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AdvanceEnrollmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AdvanceEnrollmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AdvanceEnrollmentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AdvanceEnrollmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AdvanceEnrollmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "enrollmentId": "00000000-0000-4000-8000-000000000001",
  "currentStepId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "touchpointId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `enrollmentId` | Sí | `string` | formato `uuid` | Identificador asociado a enrollment. | `00000000-0000-4000-8000-000000000001` |
| `currentStepId` | No | `string` | formato `uuid` | Paso en el que queda; ausente si terminó | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `touchpointId` | No | `string` | formato `uuid` | Touchpoint registrado cuando el paso ejecutado era SEND | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MARKETING_MANAGER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Paso actual no encontrado | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 409 | `CONFLICT` | La inscripción ya no está activa | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La inscripción no tiene paso actual | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 422 | `PRECONDITION_FAILED` | La espera del paso aún no ha vencido | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/enrollments/{id}/advance"
}
```

---

## 6. POST /marketing/enrollments/{id}/exit

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Cerrar la inscripción por meta, baja o rebote
- **Operation ID:** `MarketingController_exitEnrollment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MarketingController.exitEnrollment](../../src/modules/marketing/controllers/marketing.controller.ts)

### Descripción de negocio

Cerrar la inscripción por meta, baja o rebote. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /marketing/enrollments/{id}/exit` en `MarketingController_exitEnrollment`. El controlador delega en `MarketingJourneysService.exitEnrollment`. Valida el body como `ExitEnrollmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExitEnrollmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ExitEnrollmentDto`; los campos opcionales se omiten.

```http
POST /marketing/enrollments/00000000-0000-4000-8000-000000000001/exit HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "GOAL"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MARKETING_MANAGER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | valores: `GOAL`, `UNSUBSCRIBE`, `BOUNCE` | Sin descripción específica en el contrato OpenAPI. | `GOAL` |
| `campaignId` | No | `string` | formato `uuid` | Campaña cuyo miembro debe reflejar la salida (converted / unsubscribed / bounced) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /marketing/enrollments/00000000-0000-4000-8000-000000000001/exit HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "GOAL",
  "campaignId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ExitEnrollmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExitEnrollmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExitEnrollmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExitEnrollmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExitEnrollmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExitEnrollmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExitEnrollmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExitEnrollmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExitEnrollmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExitEnrollmentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ExitEnrollmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExitEnrollmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "enrollmentId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "exitReasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `enrollmentId` | Sí | `string` | formato `uuid` | Identificador asociado a enrollment. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `exitReasonConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a exit reason concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MARKETING_MANAGER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | La inscripción ya no está activa | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
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
  "path": "/marketing/enrollments/{id}/exit"
}
```

---

## 7. GET /marketing/insights/alert-rules

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Las siete reglas de alerta con su umbral y estado
- **Operation ID:** `InsightsWorkflowController_listRules`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsWorkflowController.listRules](../../src/modules/marketing/controllers/insights-workflow.controller.ts)

### Descripción de negocio

Las siete reglas de alerta con su umbral y estado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /marketing/insights/alert-rules` en `InsightsWorkflowController_listRules`. El controlador delega en `InsightsWorkflowService.listRules`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /marketing/insights/alert-rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`, `PLATFORM_ADMIN`, `DATA_PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /marketing/insights/alert-rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/insights/alert-rules"
}
```

---

## 8. PATCH /marketing/insights/alert-rules/{code}

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Enciende, apaga o cambia el umbral (1 a 500) de una regla
- **Operation ID:** `InsightsWorkflowController_patchRule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsWorkflowController.patchRule](../../src/modules/marketing/controllers/insights-workflow.controller.ts)

### Descripción de negocio

If-Match con el rowVersion es obligatorio (428 si falta, 412 si está vieja).


### Descripción del sistema

NestJS resuelve `PATCH /marketing/insights/alert-rules/{code}` en `InsightsWorkflowController_patchRule`. El controlador delega en `InsightsWorkflowService.patchRule`. Valida el body como `MarketingInsightsPatchAlertRuleDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `code` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |
| `If-Match` | header | Sí | `string` | Sin restricción adicional declarada | rowVersion leído | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `MarketingInsightsPatchAlertRuleDto`; los campos opcionales se omiten.

```http
PATCH /marketing/insights/alert-rules/CODIGO_EJEMPLO HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `DATA_PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `enabled` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `threshold` | No | `number` | mínimo 1; máximo 500 | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /marketing/insights/alert-rules/CODIGO_EJEMPLO HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "enabled": true,
  "threshold": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La regla de alerta no existe | Excepción explícita en src/modules/marketing/services/insights-workflow.service.ts |
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
  "path": "/marketing/insights/alert-rules/{code}"
}
```

---

## 9. GET /marketing/insights/alert-workflow

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Estado, responsable e historial de las alertas que existen
- **Operation ID:** `InsightsWorkflowController_listWorkflow`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsWorkflowController.listWorkflow](../../src/modules/marketing/controllers/insights-workflow.controller.ts)

### Descripción de negocio

Estado, responsable e historial de las alertas que existen. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /marketing/insights/alert-workflow` en `InsightsWorkflowController_listWorkflow`. El controlador delega en `InsightsWorkflowService.listWorkflow`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /marketing/insights/alert-workflow HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`, `PLATFORM_ADMIN`, `DATA_PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /marketing/insights/alert-workflow HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/insights/alert-workflow"
}
```

---

## 10. PUT /marketing/insights/alert-workflow/{fingerprint}

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Cambia estado y/o responsable de una alerta (la crea la primera vez)
- **Operation ID:** `InsightsWorkflowController_putWorkflow`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsWorkflowController.putWorkflow](../../src/modules/marketing/controllers/insights-workflow.controller.ts)

### Descripción de negocio

Upsert por fingerprint con el snapshot de la alerta detectada. Deja una fila en insights_alert_transitions solo si cambia el estado o el responsable. Sin If-Match en el alta; si la alerta ya existe, If-Match con su rowVersion o 412 MARKETING_INSIGHTS_VERSION_MISMATCH.


### Descripción del sistema

NestJS resuelve `PUT /marketing/insights/alert-workflow/{fingerprint}` en `InsightsWorkflowController_putWorkflow`. El controlador delega en `InsightsWorkflowService.putWorkflow`. Valida el body como `MarketingInsightsPutAlertWorkflowDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `fingerprint` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `If-Match` | header | No | `string` | Sin restricción adicional declarada | rowVersion leído | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `MarketingInsightsPutAlertWorkflowDto`; los campos opcionales se omiten.

```http
PUT /marketing/insights/alert-workflow/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "new",
  "ownerTeam": "marketing",
  "snapshot": {
    "severity": "critical",
    "title": "valor-ejemplo",
    "whatText": "valor-ejemplo",
    "detectedOn": "2026-10-29",
    "moduleCode": "campaigns",
    "priority": 1
  }
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...INSIGHTS_WRITE_ROLES`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `new`, `in_progress`, `resolved`, `dismissed` | Sin descripción específica en el contrato OpenAPI. | `new` |
| `ownerTeam` | Sí | `string` | valores: `marketing`, `innovation`, `product`, `communication`, `content`, `systems`, `direction`; admite null | Sin descripción específica en el contrato OpenAPI. | `marketing` |
| `note` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `snapshot` | Sí | `MarketingInsightsAlertSnapshotDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"severity":"critical","title":"valor-ejemplo","whatText":"valor-ejemplo","detectedOn":"2026-10-29","moduleCode":"campaigns","priority":1}` |
| `snapshot.severity` | Sí | `string` | valores: `critical`, `risk`, `anomaly`, `opportunity` | Sin descripción específica en el contrato OpenAPI. | `critical` |
| `snapshot.title` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `snapshot.whatText` | Sí | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `snapshot.detectedOn` | Sí | `string` | Sin restricción adicional declarada | Día de detección | `2026-10-29` |
| `snapshot.moduleCode` | Sí | `string` | longitud máxima 40 | Sin descripción específica en el contrato OpenAPI. | `campaigns` |
| `snapshot.priority` | Sí | `number` | mínimo 1; máximo 5 | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /marketing/insights/alert-workflow/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "status": "new",
  "ownerTeam": "marketing",
  "note": "valor-ejemplo",
  "snapshot": {
    "severity": "critical",
    "title": "valor-ejemplo",
    "whatText": "valor-ejemplo",
    "detectedOn": "2026-10-29",
    "moduleCode": "campaigns",
    "priority": 1
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...INSIGHTS_WRITE_ROLES. | Roles/tenant/guards de autorización |
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
  "path": "/marketing/insights/alert-workflow/{fingerprint}"
}
```

---

## 11. GET /marketing/insights/campaign-facts

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Hechos diarios por campaña y canal; lo que la fuente no reporta se declara en meta.notMeasured
- **Operation ID:** `InsightsFactsController_campaignFacts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsFactsController.campaignFacts](../../src/modules/marketing/controllers/insights-facts.controller.ts)

### Descripción de negocio

Hechos diarios por campaña y canal; lo que la fuente no reporta se declara en meta.notMeasured. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /marketing/insights/campaign-facts` en `InsightsFactsController_campaignFacts`. El controlador delega en `InsightsFactsService.campaignFacts`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | Sí | `string` | Sin restricción adicional declarada | Primer día (inclusive) | `2026-10-01` |
| `to` | query | Sí | `string` | Sin restricción adicional declarada | Último día (inclusive) | `2026-10-29` |
| `campaignIds` | query | No | `array<string>` | Sin restricción adicional declarada | Códigos de campaña (lista separada por comas) | `["valor-ejemplo"]` |
| `channels` | query | No | `array<string>` | Sin restricción adicional declarada | Canales (lista separada por comas) | `["instagram"]` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /marketing/insights/campaign-facts?from=2026-10-01&to=2026-10-29 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`, `PLATFORM_ADMIN`, `DATA_PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /marketing/insights/campaign-facts?from=2026-10-01&to=2026-10-29&campaignIds=valor-ejemplo&channels=instagram HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/insights/campaign-facts"
}
```

---

## 12. GET /marketing/insights/catalog

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Campañas (con sus canales y objetivos) e hitos de Insights
- **Operation ID:** `InsightsFactsController_catalog`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsFactsController.catalog](../../src/modules/marketing/controllers/insights-facts.controller.ts)

### Descripción de negocio

Campañas (con sus canales y objetivos) e hitos de Insights. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /marketing/insights/catalog` en `InsightsFactsController_catalog`. El controlador delega en `InsightsFactsService.catalog`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /marketing/insights/catalog HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`, `PLATFORM_ADMIN`, `DATA_PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /marketing/insights/catalog HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/insights/catalog"
}
```

---

## 13. GET /marketing/insights/notification-preferences

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Preferencias de aviso del usuario (rowVersion 0 si no guardó nada)
- **Operation ID:** `InsightsWorkspaceController_getNotificationPreferences`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsWorkspaceController.getNotificationPreferences](../../src/modules/marketing/controllers/insights-workspace.controller.ts)

### Descripción de negocio

Preferencias de aviso del usuario (rowVersion 0 si no guardó nada). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /marketing/insights/notification-preferences` en `InsightsWorkspaceController_getNotificationPreferences`. El controlador delega en `InsightsWorkspaceService.getNotificationPreferences`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /marketing/insights/notification-preferences HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`, `PLATFORM_ADMIN`, `DATA_PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /marketing/insights/notification-preferences HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/insights/notification-preferences"
}
```

---

## 14. PUT /marketing/insights/notification-preferences

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Guarda las preferencias de aviso del usuario (no se envía nada)
- **Operation ID:** `InsightsWorkspaceController_putNotificationPreferences`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsWorkspaceController.putNotificationPreferences](../../src/modules/marketing/controllers/insights-workspace.controller.ts)

### Descripción de negocio

Guarda las preferencias de aviso del usuario (no se envía nada). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /marketing/insights/notification-preferences` en `InsightsWorkspaceController_putNotificationPreferences`. El controlador delega en `InsightsWorkspaceService.putNotificationPreferences`. Valida el body como `MarketingInsightsPutNotificationPreferencesDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `If-Match` | header | No | `string` | Sin restricción adicional declarada | rowVersion leído; obligatorio si ya hay fila | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `MarketingInsightsPutNotificationPreferencesDto`; los campos opcionales se omiten.

```http
PUT /marketing/insights/notification-preferences HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "matrix": {
    "critical": [
      "app"
    ],
    "risk": [
      "app"
    ],
    "anomaly": [
      "app"
    ],
    "opportunity": [
      "app"
    ]
  },
  "frequency": "immediate",
  "digestHour": 1,
  "quietFrom": "22:00",
  "quietTo": "07:00",
  "quietExemptCritical": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...INSIGHTS_WRITE_ROLES`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `matrix` | Sí | `MarketingInsightsNotificationMatrixDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"critical":["app"],"risk":["app"],"anomaly":["app"],"opportunity":["app"]}` |
| `matrix.critical` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["app"]` |
| `matrix.risk` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["app"]` |
| `matrix.anomaly` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["app"]` |
| `matrix.opportunity` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["app"]` |
| `frequency` | Sí | `string` | valores: `immediate`, `daily_digest` | Sin descripción específica en el contrato OpenAPI. | `immediate` |
| `digestHour` | Sí | `number` | mínimo 0; máximo 23 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `quietFrom` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `22:00` |
| `quietTo` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `07:00` |
| `quietExemptCritical` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /marketing/insights/notification-preferences HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "matrix": {
    "critical": [
      "app"
    ],
    "risk": [
      "app"
    ],
    "anomaly": [
      "app"
    ],
    "opportunity": [
      "app"
    ]
  },
  "frequency": "immediate",
  "digestHour": 1,
  "quietFrom": "22:00",
  "quietTo": "07:00",
  "quietExemptCritical": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...INSIGHTS_WRITE_ROLES. | Roles/tenant/guards de autorización |
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
  "path": "/marketing/insights/notification-preferences"
}
```

---

## 15. GET /marketing/insights/reports

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Historial de informes del usuario (máximo 12, el más nuevo primero)
- **Operation ID:** `InsightsWorkspaceController_listReports`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsWorkspaceController.listReports](../../src/modules/marketing/controllers/insights-workspace.controller.ts)

### Descripción de negocio

Historial de informes del usuario (máximo 12, el más nuevo primero). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /marketing/insights/reports` en `InsightsWorkspaceController_listReports`. El controlador delega en `InsightsWorkspaceService.listReports`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /marketing/insights/reports HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`, `PLATFORM_ADMIN`, `DATA_PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /marketing/insights/reports HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/insights/reports"
}
```

---

## 16. DELETE /marketing/insights/reports/{id}

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Borra un informe del usuario (idempotente)
- **Operation ID:** `InsightsWorkspaceController_deleteReport`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsWorkspaceController.deleteReport](../../src/modules/marketing/controllers/insights-workspace.controller.ts)

### Descripción de negocio

Borra un informe del usuario (idempotente). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `DELETE /marketing/insights/reports/{id}` en `InsightsWorkspaceController_deleteReport`. El controlador delega en `InsightsWorkspaceService.deleteReport`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /marketing/insights/reports/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...INSIGHTS_WRITE_ROLES`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /marketing/insights/reports/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 204 | Operación completada sin cuerpo de respuesta. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...INSIGHTS_WRITE_ROLES. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/insights/reports/{id}"
}
```

---

## 17. PUT /marketing/insights/reports/{id}

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Guarda un informe en el historial (idempotente por id)
- **Operation ID:** `InsightsWorkspaceController_putReport`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsWorkspaceController.putReport](../../src/modules/marketing/controllers/insights-workspace.controller.ts)

### Descripción de negocio

Máximo 12 por usuario: el 13.º expulsa el más viejo.


### Descripción del sistema

NestJS resuelve `PUT /marketing/insights/reports/{id}` en `InsightsWorkspaceController_putReport`. El controlador delega en `InsightsWorkspaceService.putReport`. Valida el body como `MarketingInsightsPutReportDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `MarketingInsightsPutReportDto`; los campos opcionales se omiten.

```http
PUT /marketing/insights/reports/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "title": "valor-ejemplo",
  "type": "valor-ejemplo",
  "audience": "valor-ejemplo",
  "periodFrom": "2026-10-01",
  "periodTo": "2026-10-29",
  "campaignIds": [
    "valor-ejemplo"
  ],
  "channels": [
    "instagram"
  ],
  "sections": [
    "valor-ejemplo"
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...INSIGHTS_WRITE_ROLES`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `title` | Sí | `string` | longitud máxima 120 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `type` | Sí | `string` | longitud máxima 40 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `audience` | Sí | `string` | longitud máxima 40 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `periodFrom` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2026-10-01` |
| `periodTo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `2026-10-29` |
| `campaignIds` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `channels` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["instagram"]` |
| `sections` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /marketing/insights/reports/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "title": "valor-ejemplo",
  "type": "valor-ejemplo",
  "audience": "valor-ejemplo",
  "periodFrom": "2026-10-01",
  "periodTo": "2026-10-29",
  "campaignIds": [
    "valor-ejemplo"
  ],
  "channels": [
    "instagram"
  ],
  "sections": [
    "valor-ejemplo"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...INSIGHTS_WRITE_ROLES. | Roles/tenant/guards de autorización |
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
  "path": "/marketing/insights/reports/{id}"
}
```

---

## 18. GET /marketing/insights/saved-views

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Vistas guardadas del usuario
- **Operation ID:** `InsightsWorkspaceController_listSavedViews`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsWorkspaceController.listSavedViews](../../src/modules/marketing/controllers/insights-workspace.controller.ts)

### Descripción de negocio

Vistas guardadas del usuario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /marketing/insights/saved-views` en `InsightsWorkspaceController_listSavedViews`. El controlador delega en `InsightsWorkspaceService.listSavedViews`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /marketing/insights/saved-views HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`, `PLATFORM_ADMIN`, `DATA_PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /marketing/insights/saved-views HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/insights/saved-views"
}
```

---

## 19. DELETE /marketing/insights/saved-views/{id}

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Borra una vista del usuario (idempotente)
- **Operation ID:** `InsightsWorkspaceController_deleteSavedView`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsWorkspaceController.deleteSavedView](../../src/modules/marketing/controllers/insights-workspace.controller.ts)

### Descripción de negocio

Borra una vista del usuario (idempotente). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `DELETE /marketing/insights/saved-views/{id}` en `InsightsWorkspaceController_deleteSavedView`. El controlador delega en `InsightsWorkspaceService.deleteSavedView`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /marketing/insights/saved-views/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...INSIGHTS_WRITE_ROLES`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /marketing/insights/saved-views/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 204 | Operación completada sin cuerpo de respuesta. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...INSIGHTS_WRITE_ROLES. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/insights/saved-views/{id}"
}
```

---

## 20. PUT /marketing/insights/saved-views/{id}

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Guarda una vista con el id que manda el cliente (idempotente)
- **Operation ID:** `InsightsWorkspaceController_putSavedView`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsWorkspaceController.putSavedView](../../src/modules/marketing/controllers/insights-workspace.controller.ts)

### Descripción de negocio

El nombre es único por usuario: otro id con el mismo nombre responde 409 MARKETING_INSIGHTS_VIEW_NAME_TAKEN.


### Descripción del sistema

NestJS resuelve `PUT /marketing/insights/saved-views/{id}` en `InsightsWorkspaceController_putSavedView`. El controlador delega en `InsightsWorkspaceService.putSavedView`. Valida el body como `MarketingInsightsPutSavedViewDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `MarketingInsightsPutSavedViewDto`; los campos opcionales se omiten.

```http
PUT /marketing/insights/saved-views/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "url": "/insights/campaigns?c=c1&p=30d"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...INSIGHTS_WRITE_ROLES`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 60 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `url` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `/insights/campaigns?c=c1&p=30d` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /marketing/insights/saved-views/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Nombre de ejemplo",
  "url": "/insights/campaigns?c=c1&p=30d"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...INSIGHTS_WRITE_ROLES. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya tienes una vista guardada con ese nombre | Excepción explícita en src/modules/marketing/services/insights-workspace.service.ts |
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
  "path": "/marketing/insights/saved-views/{id}"
}
```

---

## 21. GET /marketing/insights/user-preferences

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Preferencias de interfaz del usuario (rowVersion 0 si no guardó nada)
- **Operation ID:** `InsightsWorkspaceController_getUserPreferences`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsWorkspaceController.getUserPreferences](../../src/modules/marketing/controllers/insights-workspace.controller.ts)

### Descripción de negocio

Preferencias de interfaz del usuario (rowVersion 0 si no guardó nada). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /marketing/insights/user-preferences` en `InsightsWorkspaceController_getUserPreferences`. El controlador delega en `InsightsWorkspaceService.getUserPreferences`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /marketing/insights/user-preferences HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`, `PLATFORM_ADMIN`, `DATA_PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /marketing/insights/user-preferences HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/insights/user-preferences"
}
```

---

## 22. PUT /marketing/insights/user-preferences

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing-insights`
- **Nombre:** Guarda las preferencias de interfaz del usuario
- **Operation ID:** `InsightsWorkspaceController_putUserPreferences`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InsightsWorkspaceController.putUserPreferences](../../src/modules/marketing/controllers/insights-workspace.controller.ts)

### Descripción de negocio

Guarda las preferencias de interfaz del usuario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /marketing/insights/user-preferences` en `InsightsWorkspaceController_putUserPreferences`. El controlador delega en `InsightsWorkspaceService.putUserPreferences`. Valida el body como `MarketingInsightsPutUserPreferencesDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `If-Match` | header | No | `string` | Sin restricción adicional declarada | rowVersion leído; obligatorio si ya hay fila | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `MarketingInsightsPutUserPreferencesDto`; los campos opcionales se omiten.

```http
PUT /marketing/insights/user-preferences HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "density": "comfortable",
  "theme": "system",
  "navCollapsed": true,
  "timezone": "America/La_Paz"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...INSIGHTS_WRITE_ROLES`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `density` | Sí | `string` | valores: `comfortable`, `compact` | Sin descripción específica en el contrato OpenAPI. | `comfortable` |
| `theme` | Sí | `string` | valores: `system`, `light`, `dark` | Sin descripción específica en el contrato OpenAPI. | `system` |
| `navCollapsed` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `timezone` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /marketing/insights/user-preferences HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "density": "comfortable",
  "theme": "system",
  "navCollapsed": true,
  "timezone": "America/La_Paz"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...INSIGHTS_WRITE_ROLES. | Roles/tenant/guards de autorización |
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
  "path": "/marketing/insights/user-preferences"
}
```

---

## 23. POST /marketing/journeys

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Crear un journey en borrador
- **Operation ID:** `MarketingController_createJourney`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MarketingController.createJourney](../../src/modules/marketing/controllers/marketing.controller.ts)

### Descripción de negocio

Crear un journey en borrador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /marketing/journeys` en `MarketingController_createJourney`. El controlador delega en `MarketingJourneysService.createJourney`. Valida el body como `CreateJourneyDto` y consume `application/json`. El tipo de retorno estático es `Promise<JourneyResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateJourneyDto`; los campos opcionales se omiten.

```http
POST /marketing/journeys HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "entryTrigger": "SEGMENT"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Opcional: el tenant sale del contexto autenticado; si se envía debe coincidir con él | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código del journey, único por tenant | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `entryTrigger` | Sí | `string` | valores: `SEGMENT`, `EVENT` | Sin descripción específica en el contrato OpenAPI. | `SEGMENT` |
| `entrySegmentId` | No | `string` | formato `uuid` | Segmento de entrada; obligatorio si el disparador es SEGMENT | `00000000-0000-4000-8000-000000000001` |
| `goalMetricConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `definitionJson` | No | `object` | Sin restricción adicional declarada | Definición completa del grafo, informativa | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /marketing/journeys HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "entryTrigger": "SEGMENT",
  "entrySegmentId": "00000000-0000-4000-8000-000000000001",
  "goalMetricConceptId": "00000000-0000-4000-8000-000000000001",
  "definitionJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<JourneyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `JourneyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "journeyStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "endedAt": "2026-07-31T12:00:00.000Z",
  "eventCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `journeyStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a journey status concept. | `00000000-0000-4000-8000-000000000001` |
| `endedAt` | No | `string` | formato `date-time` | Valor de ended at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `eventCount` | Sí | `number` | Sin restricción adicional declarada | Valor de event count mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un journey con ese código | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un journey con entrada por segmento necesita entrySegmentId | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/journeys"
}
```

---

## 24. POST /marketing/journeys/{id}/activate

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Activar el journey e inscribir la cohorte inicial
- **Operation ID:** `MarketingController_activateJourney`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MarketingController.activateJourney](../../src/modules/marketing/controllers/marketing.controller.ts)

### Descripción de negocio

Activar el journey e inscribir la cohorte inicial. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /marketing/journeys/{id}/activate` en `MarketingController_activateJourney`. El controlador delega en `MarketingJourneysService.activateJourney`. Valida el body como `ActivateJourneyDto` y consume `application/json`. El tipo de retorno estático es `Promise<ActivateJourneyResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ActivateJourneyDto`; los campos opcionales se omiten.

```http
POST /marketing/journeys/00000000-0000-4000-8000-000000000001/activate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `cohort` | No | `array<CohortMemberDto>` | Sin restricción adicional declarada | Cohorte inicial. Sin ella el journey se activa sin inscribir a nadie. | `[{"memberType":"CONTACT","memberRefId":"00000000-0000-4000-8000-000000000001"}]` |
| `cohort[].memberType` | No | `string` | valores: `CONTACT`, `PATIENT` | Sin descripción específica en el contrato OpenAPI. | `CONTACT` |
| `cohort[].memberRefId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /marketing/journeys/00000000-0000-4000-8000-000000000001/activate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "cohort": [
    {
      "memberType": "CONTACT",
      "memberRefId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ActivateJourneyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ActivateJourneyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ActivateJourneyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ActivateJourneyResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ActivateJourneyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ActivateJourneyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ActivateJourneyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ActivateJourneyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ActivateJourneyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ActivateJourneyResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ActivateJourneyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ActivateJourneyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "journeyId": "00000000-0000-4000-8000-000000000001",
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "enrolled": 1,
  "skipped": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `journeyId` | Sí | `string` | formato `uuid` | Identificador asociado a journey. | `00000000-0000-4000-8000-000000000001` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `enrolled` | Sí | `number` | Sin restricción adicional declarada | Inscripciones creadas | `1` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Miembros omitidos por tener ya una inscripción activa | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El journey ya no está en borrador | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un journey sin pasos no puede activarse | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/journeys/{id}/activate"
}
```

---

## 25. POST /marketing/journeys/{id}/steps

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Añadir pasos al journey
- **Operation ID:** `MarketingController_addSteps`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MarketingController.addSteps](../../src/modules/marketing/controllers/marketing.controller.ts)

### Descripción de negocio

Los pasos se encadenan en el orden recibido.


### Descripción del sistema

NestJS resuelve `POST /marketing/journeys/{id}/steps` en `MarketingController_addSteps`. El controlador delega en `MarketingJourneysService.addSteps`. Valida el body como `AddJourneyStepsDto` y consume `application/json`. El tipo de retorno estático es `Promise<JourneyStepsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddJourneyStepsDto`; los campos opcionales se omiten.

```http
POST /marketing/journeys/00000000-0000-4000-8000-000000000001/steps HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "steps": [
    {
      "stepCode": "CODIGO_EJEMPLO",
      "stepType": "SEND"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `steps` | Sí | `array<JourneyStepDto>` | mínimo 1 elemento(s) | Pasos en orden de ejecución | `[{"stepCode":"CODIGO_EJEMPLO","stepType":"SEND","channel":"EMAIL","contentTemplateId":"00000000-0000-4000-8000-000000000001","waitDurationMinutes":1,"conditionJson":{}}]` |
| `steps[].stepCode` | Sí | `string` | longitud máxima 100 | Identificador legible del paso dentro del journey | `CODIGO_EJEMPLO` |
| `steps[].stepType` | Sí | `string` | valores: `SEND`, `WAIT`, `BRANCH`, `GOAL`, `UPDATE`, `EXIT`, `WEBHOOK` | Sin descripción específica en el contrato OpenAPI. | `SEND` |
| `steps[].channel` | No | `string` | valores: `EMAIL`, `SMS`, `PUSH` | Sin descripción específica en el contrato OpenAPI. | `EMAIL` |
| `steps[].contentTemplateId` | No | `string` | formato `uuid` | Plantilla publicada; obligatoria en los pasos SEND | `00000000-0000-4000-8000-000000000001` |
| `steps[].waitDurationMinutes` | No | `number` | mínimo 1 | Espera en minutos; obligatoria en los pasos WAIT | `1` |
| `steps[].conditionJson` | No | `object` | Sin restricción adicional declarada | Condición de la rama; obligatoria en los pasos BRANCH | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /marketing/journeys/00000000-0000-4000-8000-000000000001/steps HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "steps": [
    {
      "stepCode": "CODIGO_EJEMPLO",
      "stepType": "SEND",
      "channel": "EMAIL",
      "contentTemplateId": "00000000-0000-4000-8000-000000000001",
      "waitDurationMinutes": 1,
      "conditionJson": {}
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<JourneyStepsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<JourneyStepsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<JourneyStepsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<JourneyStepsResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<JourneyStepsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<JourneyStepsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<JourneyStepsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<JourneyStepsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<JourneyStepsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<JourneyStepsResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<JourneyStepsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `JourneyStepsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "journeyId": "00000000-0000-4000-8000-000000000001",
  "stepIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `journeyId` | Sí | `string` | formato `uuid` | Identificador asociado a journey. | `00000000-0000-4000-8000-000000000001` |
| `stepIds` | Sí | `array<string>` | formato `uuid` | Pasos creados, en orden | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo un journey en borrador admite nuevos pasos | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 422 | `PRECONDITION_FAILED` | Un paso SEND necesita plantilla de contenido | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla del paso SEND no existe o no está publicada | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 422 | `PRECONDITION_FAILED` | Un paso WAIT necesita duración | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 422 | `PRECONDITION_FAILED` | Un paso BRANCH necesita condición | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/journeys/{id}/steps"
}
```

---

## 26. POST /marketing/segments

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Crear un segmento y ligarlo a su read model
- **Operation ID:** `MarketingController_createSegment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MarketingController.createSegment](../../src/modules/marketing/controllers/marketing.controller.ts)

### Descripción de negocio

Crear un segmento y ligarlo a su read model. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /marketing/segments` en `MarketingController_createSegment`. El controlador delega en `MarketingCampaignsService.createSegment`. Valida el body como `CreateSegmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<SegmentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateSegmentDto`; los campos opcionales se omiten.

```http
POST /marketing/segments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "segmentType": "DYNAMIC"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Opcional: el tenant sale del contexto autenticado; si se envía debe coincidir con él | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código del segmento, único por tenant | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `segmentType` | Sí | `string` | valores: `DYNAMIC`, `STATIC` | Sin descripción específica en el contrato OpenAPI. | `DYNAMIC` |
| `definitionJson` | No | `object` | Sin restricción adicional declarada | Definición ejecutable del segmento contra el read model | `{}` |
| `sourceReadModelId` | No | `string` | formato `uuid` | Read model del que se deriva la membresía | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /marketing/segments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "segmentType": "DYNAMIC",
  "definitionJson": {},
  "sourceReadModelId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SegmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SegmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SegmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SegmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SegmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SegmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SegmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SegmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SegmentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SegmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SegmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "stateConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un segmento con ese código | Excepción explícita en src/modules/marketing/services/marketing-campaigns.service.ts |
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
  "path": "/marketing/segments"
}
```

---

## 27. POST /marketing/segments/{id}/refresh

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Recomputar la membresía del segmento
- **Operation ID:** `MarketingController_refreshSegment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MarketingController.refreshSegment](../../src/modules/marketing/controllers/marketing.controller.ts)

### Descripción de negocio

El cuerpo trae la membresía completa: quien no aparece se da de baja.


### Descripción del sistema

NestJS resuelve `POST /marketing/segments/{id}/refresh` en `MarketingController_refreshSegment`. El controlador delega en `MarketingCampaignsService.refreshSegment`. Valida el body como `RefreshSegmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<RefreshSegmentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RefreshSegmentDto`; los campos opcionales se omiten.

```http
POST /marketing/segments/00000000-0000-4000-8000-000000000001/refresh HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "members": [
    {
      "memberType": "CONTACT",
      "memberRefId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`, `SYSTEM`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `members` | Sí | `array<SegmentMemberInputDto>` | Sin restricción adicional declarada | Membresía recomputada completa | `[{"memberType":"CONTACT","memberRefId":"00000000-0000-4000-8000-000000000001","score":"valor-ejemplo"}]` |
| `members[].memberType` | Sí | `string` | valores: `CONTACT`, `PATIENT` | Sin descripción específica en el contrato OpenAPI. | `CONTACT` |
| `members[].memberRefId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `members[].score` | No | `string` | Sin restricción adicional declarada | Puntuación del miembro como cadena decimal | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /marketing/segments/00000000-0000-4000-8000-000000000001/refresh HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "members": [
    {
      "memberType": "CONTACT",
      "memberRefId": "00000000-0000-4000-8000-000000000001",
      "score": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RefreshSegmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RefreshSegmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RefreshSegmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RefreshSegmentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RefreshSegmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RefreshSegmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RefreshSegmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RefreshSegmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RefreshSegmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RefreshSegmentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<RefreshSegmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RefreshSegmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "segmentId": "00000000-0000-4000-8000-000000000001",
  "added": 1,
  "removed": 1,
  "estimatedSize": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `segmentId` | Sí | `string` | formato `uuid` | Identificador asociado a segment. | `00000000-0000-4000-8000-000000000001` |
| `added` | Sí | `number` | Sin restricción adicional declarada | Miembros incorporados en este refresco | `1` |
| `removed` | Sí | `number` | Sin restricción adicional declarada | Miembros dados de baja por salir del segmento | `1` |
| `estimatedSize` | Sí | `number` | Sin restricción adicional declarada | Tamaño derivado del segmento tras el refresco | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER, SYSTEM. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El segmento no está activo | Excepción explícita en src/modules/marketing/services/marketing-campaigns.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/segments/{id}/refresh"
}
```

---

## 28. POST /marketing/touchpoints

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Registrar un touchpoint de marketing
- **Operation ID:** `MarketingController_recordTouchpoint`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MarketingController.recordTouchpoint](../../src/modules/marketing/controllers/marketing.controller.ts)

### Descripción de negocio

Log append-only; actualiza el estado del miembro de campaña cuando procede.


### Descripción del sistema

NestJS resuelve `POST /marketing/touchpoints` en `MarketingController_recordTouchpoint`. El controlador delega en `MarketingJourneysService.recordTouchpoint`. Valida el body como `RecordTouchpointDto` y consume `application/json`. El tipo de retorno estático es `Promise<TouchpointResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordTouchpointDto`; los campos opcionales se omiten.

```http
POST /marketing/touchpoints HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "memberType": "CONTACT",
  "memberRefId": "00000000-0000-4000-8000-000000000001",
  "touchType": "IMPRESSION",
  "channel": "EMAIL"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MARKETING_MANAGER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `memberType` | Sí | `string` | valores: `CONTACT`, `PATIENT` | Sin descripción específica en el contrato OpenAPI. | `CONTACT` |
| `memberRefId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `touchType` | Sí | `string` | valores: `IMPRESSION`, `OPEN`, `CLICK`, `VISIT`, `CONVERSION`, `REPLY` | Sin descripción específica en el contrato OpenAPI. | `IMPRESSION` |
| `channel` | Sí | `string` | valores: `EMAIL`, `SMS`, `PUSH` | Sin descripción específica en el contrato OpenAPI. | `EMAIL` |
| `campaignId` | No | `string` | formato `uuid` | Campaña de origen | `00000000-0000-4000-8000-000000000001` |
| `journeyId` | No | `string` | formato `uuid` | Journey de origen | `00000000-0000-4000-8000-000000000001` |
| `trackedLinkId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `contentTemplateId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `metadataJson` | No | `object` | Sin restricción adicional declarada | Metadatos del evento para analítica | `{}` |
| `occurredAt` | No | `string` | formato `date-time` | Cuándo ocurrió; por defecto, ahora | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /marketing/touchpoints HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "memberType": "CONTACT",
  "memberRefId": "00000000-0000-4000-8000-000000000001",
  "touchType": "IMPRESSION",
  "channel": "EMAIL",
  "campaignId": "00000000-0000-4000-8000-000000000001",
  "journeyId": "00000000-0000-4000-8000-000000000001",
  "trackedLinkId": "00000000-0000-4000-8000-000000000001",
  "contentTemplateId": "00000000-0000-4000-8000-000000000001",
  "metadataJson": {},
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TouchpointResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TouchpointResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TouchpointResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TouchpointResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TouchpointResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TouchpointResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TouchpointResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TouchpointResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TouchpointResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<TouchpointResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TouchpointResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "touchTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "memberStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `touchTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a touch type concept. | `00000000-0000-4000-8000-000000000001` |
| `memberStatusConceptId` | No | `string` | formato `uuid` | Estado al que pasó el miembro de campaña, si había campaña | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MARKETING_MANAGER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Enlace no encontrado | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El touchpoint necesita campaña o journey de origen | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/marketing/touchpoints"
}
```

---

## 29. POST /marketing/tracked-links

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Crear un enlace rastreable con parámetros UTM
- **Operation ID:** `MarketingController_createTrackedLink`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MarketingController.createTrackedLink](../../src/modules/marketing/controllers/marketing.controller.ts)

### Descripción de negocio

Crear un enlace rastreable con parámetros UTM. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /marketing/tracked-links` en `MarketingController_createTrackedLink`. El controlador delega en `MarketingJourneysService.createTrackedLink`. Valida el body como `CreateTrackedLinkDto` y consume `application/json`. El tipo de retorno estático es `Promise<TrackedLinkResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTrackedLinkDto`; los campos opcionales se omiten.

```http
POST /marketing/tracked-links HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "targetUrl": "https://example.com/recurso"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MARKETING_MANAGER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Código corto, único global | `CODIGO_EJEMPLO` |
| `targetUrl` | Sí | `string` | formato `uri` | Destino de la redirección | `https://example.com/recurso` |
| `campaignId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `utmSource` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `utmMedium` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `utmCampaign` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `utmContent` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /marketing/tracked-links HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "targetUrl": "https://example.com/recurso",
  "campaignId": "00000000-0000-4000-8000-000000000001",
  "utmSource": "valor-ejemplo",
  "utmMedium": "valor-ejemplo",
  "utmCampaign": "valor-ejemplo",
  "utmContent": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TrackedLinkResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TrackedLinkResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TrackedLinkResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TrackedLinkResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TrackedLinkResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TrackedLinkResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TrackedLinkResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TrackedLinkResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TrackedLinkResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<TrackedLinkResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TrackedLinkResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "targetUrl": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `targetUrl` | Sí | `string` | Sin restricción adicional declarada | Valor de target url mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MARKETING_MANAGER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un enlace con ese código | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
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
  "path": "/marketing/tracked-links"
}
```

---

## 30. POST /marketing/tracked-links/{id}/recipient-tokens

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Emitir el token de destinatario de un enlace rastreable
- **Operation ID:** `MarketingController_issueTrackedLinkToken`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MarketingController.issueTrackedLinkToken](../../src/modules/marketing/controllers/marketing.controller.ts)

### Descripción de negocio

El token es opaco, firmado, con vencimiento y ligado al enlace y al destinatario, que debe ser miembro de la campaña del enlace. El click público lo presenta como `?t=`.

Contexto declarado en el controlador: MKT-03: token que identifica al destinatario en el enlace público.

### Descripción del sistema

NestJS resuelve `POST /marketing/tracked-links/{id}/recipient-tokens` en `MarketingController_issueTrackedLinkToken`. El controlador delega en `MarketingJourneysService.issueTrackedLinkToken`. Valida el body como `IssueTrackedLinkTokenDto` y consume `application/json`. El tipo de retorno estático es `Promise<TrackedLinkTokenResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IssueTrackedLinkTokenDto`; los campos opcionales se omiten.

```http
POST /marketing/tracked-links/00000000-0000-4000-8000-000000000001/recipient-tokens HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "memberType": "CONTACT",
  "memberRefId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MARKETING_MANAGER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `memberType` | Sí | `string` | valores: `CONTACT`, `PATIENT` | Sin descripción específica en el contrato OpenAPI. | `CONTACT` |
| `memberRefId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ttlSeconds` | No | `number` | mínimo 60; máximo 2592000 | Sin descripción específica en el contrato OpenAPI. | `604800` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /marketing/tracked-links/00000000-0000-4000-8000-000000000001/recipient-tokens HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "memberType": "CONTACT",
  "memberRefId": "00000000-0000-4000-8000-000000000001",
  "ttlSeconds": 604800
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TrackedLinkTokenResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TrackedLinkTokenResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TrackedLinkTokenResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TrackedLinkTokenResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TrackedLinkTokenResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TrackedLinkTokenResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TrackedLinkTokenResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TrackedLinkTokenResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TrackedLinkTokenResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TrackedLinkTokenResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<TrackedLinkTokenResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TrackedLinkTokenResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "token": "valor-ejemplo",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `token` | Sí | `string` | Sin restricción adicional declarada | Se agrega al enlace público como `?t=<token>` | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | formato `date-time` | Momento en que el token deja de ser válido. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MARKETING_MANAGER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Enlace no encontrado | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 404 | `NOT_FOUND` | Destinatario no encontrado | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
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
  "path": "/marketing/tracked-links/{id}/recipient-tokens"
}
```

---

## 31. GET /r/{code}

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Resolver un enlace rastreable y registrar el click
- **Operation ID:** `TrackedLinkRedirectController_resolve`
- **Autenticación:** Pública
- **Implementación:** [TrackedLinkRedirectController.resolve](../../src/modules/marketing/controllers/tracked-link-redirect.controller.ts)

### Descripción de negocio

El contador se incrementa de forma atómica. El touchpoint sólo se registra si el click trae un token de destinatario firmado y vigente; el destinatario nunca se declara en parámetros públicos.

Contexto declarado en el controlador: UC-50-10. Ruta pública: quien hace click es el destinatario del mensaje, no un usuario con sesión. Devuelve el destino en vez de un 302 para que el cliente decida cómo redirigir; el click ya quedó contado.

### Descripción del sistema

NestJS resuelve `GET /r/{code}` en `TrackedLinkRedirectController_resolve`. El controlador delega en `MarketingJourneysService.registerClick`. No recibe body. El tipo de retorno estático es `Promise<TrackedLinkClickResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `code` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |
| `t` | query | No | `string` | Sin restricción adicional declarada | Token opaco emitido por POST /marketing/tracked-links/:id/recipient-tokens | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /r/CODIGO_EJEMPLO HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /r/CODIGO_EJEMPLO?t=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TrackedLinkClickResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<TrackedLinkClickResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<TrackedLinkClickResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<TrackedLinkClickResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<TrackedLinkClickResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<TrackedLinkClickResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TrackedLinkClickResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "targetUrl": "valor-ejemplo",
  "clickCount": "valor-ejemplo",
  "touchpointId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `targetUrl` | Sí | `string` | Sin restricción adicional declarada | Destino al que redirigir | `valor-ejemplo` |
| `clickCount` | Sí | `string` | Sin restricción adicional declarada | Clicks acumulados tras registrar este | `valor-ejemplo` |
| `touchpointId` | No | `string` | formato `uuid` | Touchpoint del click; ausente si el click no trae un token de destinatario válido | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Enlace no encontrado | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 422 | `PRECONDITION_FAILED` | El enlace no está activo | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 422 | `PRECONDITION_FAILED` | El token del enlace no es válido | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/r/{code}"
}
```

---

