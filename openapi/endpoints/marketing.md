<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `marketing`

Referencia exhaustiva de 14 operación(es) del módulo `marketing`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `marketing`
- **Controladores:** `MarketingController`, `TrackedLinkRedirectController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /marketing/attribution/compute](#1-post-marketing-attribution-compute) — Calcular la atribución multi-touch de una conversión
2. [POST /marketing/campaigns](#2-post-marketing-campaigns) — Lanzar una campaña multicanal desde un segmento
3. [POST /marketing/campaigns/{id}/members/materialize](#3-post-marketing-campaigns-id-members-materialize) — Materializar la audiencia de la campaña desde su segmento
4. [POST /marketing/content-templates/{code}/versions](#4-post-marketing-content-templates-code-versions) — Publicar una versión de plantilla de contenido
5. [POST /marketing/enrollments/{id}/advance](#5-post-marketing-enrollments-id-advance) — Avanzar la inscripción al siguiente paso
6. [POST /marketing/enrollments/{id}/exit](#6-post-marketing-enrollments-id-exit) — Cerrar la inscripción por meta, baja o rebote
7. [POST /marketing/journeys](#7-post-marketing-journeys) — Crear un journey en borrador
8. [POST /marketing/journeys/{id}/activate](#8-post-marketing-journeys-id-activate) — Activar el journey e inscribir la cohorte inicial
9. [POST /marketing/journeys/{id}/steps](#9-post-marketing-journeys-id-steps) — Añadir pasos al journey
10. [POST /marketing/segments](#10-post-marketing-segments) — Crear un segmento y ligarlo a su read model
11. [POST /marketing/segments/{id}/refresh](#11-post-marketing-segments-id-refresh) — Recomputar la membresía del segmento
12. [POST /marketing/touchpoints](#12-post-marketing-touchpoints) — Registrar un touchpoint de marketing
13. [POST /marketing/tracked-links](#13-post-marketing-tracked-links) — Crear un enlace rastreable con parámetros UTM
14. [GET /r/{code}](#14-get-r-code) — Resolver un enlace rastreable y registrar el click

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
  "tenantId": "00000000-0000-4000-8000-000000000001",
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
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
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
| 404 | `NOT_FOUND` | Segmento no encontrado | Excepción explícita en src/modules/marketing/services/marketing-campaigns.service.ts |
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
| 404 | `NOT_FOUND` | Campaña no encontrada | Excepción explícita en src/modules/marketing/services/marketing-campaigns.service.ts |
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
  "tenantId": "00000000-0000-4000-8000-000000000001",
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
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
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
| 404 | `NOT_FOUND` | Inscripción no encontrada o en curso | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
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
| 404 | `NOT_FOUND` | Inscripción no encontrada | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
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

## 7. POST /marketing/journeys

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
  "tenantId": "00000000-0000-4000-8000-000000000001",
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
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
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
| 404 | `NOT_FOUND` | Segmento de entrada no encontrado | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
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

## 8. POST /marketing/journeys/{id}/activate

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
| 404 | `NOT_FOUND` | Journey no encontrado | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
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

## 9. POST /marketing/journeys/{id}/steps

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
| 404 | `NOT_FOUND` | Journey no encontrado | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
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

## 10. POST /marketing/segments

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
  "tenantId": "00000000-0000-4000-8000-000000000001",
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
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
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

## 11. POST /marketing/segments/{id}/refresh

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
| 404 | `NOT_FOUND` | Segmento no encontrado | Excepción explícita en src/modules/marketing/services/marketing-campaigns.service.ts |
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

## 12. POST /marketing/touchpoints

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

## 13. POST /marketing/tracked-links

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

## 14. GET /r/{code}

- **Módulo:** `marketing`
- **Etiqueta OpenAPI:** `marketing`
- **Nombre:** Resolver un enlace rastreable y registrar el click
- **Operation ID:** `TrackedLinkRedirectController_resolve`
- **Autenticación:** Pública
- **Implementación:** [TrackedLinkRedirectController.resolve](../../src/modules/marketing/controllers/tracked-link-redirect.controller.ts)

### Descripción de negocio

El contador se incrementa de forma atómica; el touchpoint sólo se registra si se identifica al miembro.

Contexto declarado en el controlador: UC-50-10. Ruta pública: quien hace click es el destinatario del mensaje, no un usuario con sesión. Devuelve el destino en vez de un 302 para que el cliente decida cómo redirigir; el click ya quedó contado.

### Descripción del sistema

NestJS resuelve `GET /r/{code}` en `TrackedLinkRedirectController_resolve`. El controlador delega en `MarketingJourneysService.registerClick`. No recibe body. El tipo de retorno estático es `Promise<TrackedLinkClickResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `code` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |
| `memberType` | query | No | `string` | valores: `CONTACT`, `PATIENT` | Sin descripción específica en OpenAPI. | `CONTACT` |
| `memberRefId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

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
GET /r/CODIGO_EJEMPLO?memberType=CONTACT&memberRefId=00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| `touchpointId` | No | `string` | formato `uuid` | Touchpoint del click; ausente si no se identificó al miembro | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Enlace no encontrado | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
| 422 | `PRECONDITION_FAILED` | El enlace no está activo | Excepción explícita en src/modules/marketing/services/marketing-journeys.service.ts |
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

