<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `telemetry`

Referencia exhaustiva de 13 operación(es) del módulo `telemetry`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `telemetry-consent`, `telemetry-events`, `telemetry-governance`
- **Controladores:** `TelemetryConsentController`, `TelemetryEventsController`, `TelemetryGovernanceController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /telemetry/activity-events](#1-post-telemetry-activity-events) — Capturar evento(s) de actividad consent-aware (batch)
2. [POST /telemetry/analytics-subjects](#2-post-telemetry-analytics-subjects) — Provisionar sujeto de analítica pseudónimo
3. [POST /telemetry/client-contexts](#3-post-telemetry-client-contexts) — Registrar contexto de cliente/dispositivo + journey
4. [POST /telemetry/conversion-events](#4-post-telemetry-conversion-events) — Registrar evento de conversión con atribución
5. [POST /telemetry/disclosure-acceptances](#5-post-telemetry-disclosure-acceptances) — Registrar aceptación de disclosure por usuario/sesión
6. [POST /telemetry/disclosure-versions](#6-post-telemetry-disclosure-versions) — Publicar versión de disclosure de tracking
7. [POST /telemetry/event-schemas](#7-post-telemetry-event-schemas) — Registrar esquema de evento de actividad (versionado)
8. [POST /telemetry/funnels](#8-post-telemetry-funnels) — Definir funnel y sus pasos
9. [POST /telemetry/session-journeys/{id}/close](#9-post-telemetry-session-journeys-id-close) — Cerrar journey de sesión y consolidar métricas
10. [POST /telemetry/tracking-consents](#10-post-telemetry-tracking-consents) — Otorgar consentimiento de tracking por propósito
11. [POST /telemetry/tracking-consents/{id}/withdraw](#11-post-telemetry-tracking-consents-id-withdraw) — Retirar consentimiento y desactivar sujeto (cascada)
12. [POST /telemetry/tracking-purposes](#12-post-telemetry-tracking-purposes) — Definir propósito de tracking y base legal
13. [POST /telemetry/web-vitals](#13-post-telemetry-web-vitals) — Registrar métricas Core Web Vitals por ruta (batch)

---

## 1. POST /telemetry/activity-events

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-events`
- **Nombre:** Capturar evento(s) de actividad consent-aware (batch)
- **Operation ID:** `TelemetryEventsController_captureActivityEvents`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryEventsController.captureActivityEvents](../../src/modules/telemetry/controllers/telemetry-events.controller.ts)

### Descripción de negocio

Capturar evento(s) de actividad consent-aware (batch). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/activity-events` en `TelemetryEventsController_captureActivityEvents`. El controlador delega en `TelemetryEventsService.captureActivityEvents`. Valida el body como `CaptureActivityEventsDto` y consume `application/json`. El tipo de retorno estático es `Promise<ActivityEventsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CaptureActivityEventsDto`; los campos opcionales se omiten.

```http
POST /telemetry/activity-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "events": [
    {
      "eventSchemaDefinitionId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `events` | Sí | `array<ActivityEventItemDto>` | mínimo 1 elemento(s); máximo 500 elemento(s) | Lote de eventos de actividad | `[{"eventSchemaDefinitionId":"00000000-0000-4000-8000-000000000001","eventName":"Nombre de ejemplo","eventIdempotencyKey":"valor-ejemplo","analyticsSubjectId":"00000000-0000-4000-8000-000000000001","userId":"00000000-0000-4000-8000-000000000001","sessionId":"00000000-0000-4000-8000-000000000001","sessionJourneyId":"00000000-0000-4000-8000-000000000001","tenantId":"00000000-0000-4000-8000-000000000001","portalTypeConceptId":"00000000-0000-4000-8000-000000000001","routeTemplate":"valor-ejemplo","occurredAt":"valor-ejemplo","correlationId":"00000000-0000-4000-8000-000000000001","properties":[{"propertyName":"Nombre de ejemplo","valueType":"STRING","valueString":"valor-ejemplo","valueNumber":1,"valueBoolean":true,"dataClassificationConceptId":"00000000-0000-4000-8000-000000000001"}]}]` |
| `events[].eventSchemaDefinitionId` | Sí | `string` | formato `uuid` | Esquema de evento activo | `00000000-0000-4000-8000-000000000001` |
| `events[].eventName` | No | `string` | longitud máxima 200 | Nombre del evento (override del esquema) | `Nombre de ejemplo` |
| `events[].eventIdempotencyKey` | No | `string` | longitud máxima 200 | Clave de idempotencia del evento | `valor-ejemplo` |
| `events[].analyticsSubjectId` | No | `string` | formato `uuid` | Sujeto de analítica pseudónimo | `00000000-0000-4000-8000-000000000001` |
| `events[].userId` | No | `string` | formato `uuid` | Usuario (para gate de consentimiento) | `00000000-0000-4000-8000-000000000001` |
| `events[].sessionId` | No | `string` | formato `uuid` | Sesión asociada | `00000000-0000-4000-8000-000000000001` |
| `events[].sessionJourneyId` | No | `string` | formato `uuid` | Journey de sesión existente a enlazar | `00000000-0000-4000-8000-000000000001` |
| `events[].tenantId` | No | `string` | formato `uuid` | Tenant | `00000000-0000-4000-8000-000000000001` |
| `events[].portalTypeConceptId` | No | `string` | formato `uuid` | Tipo de portal (concept id) | `00000000-0000-4000-8000-000000000001` |
| `events[].routeTemplate` | No | `string` | longitud máxima 300 | Plantilla de ruta (sin ids en claro) | `valor-ejemplo` |
| `events[].occurredAt` | No | `string` | Sin restricción adicional declarada | Instante de ocurrencia (ISO-8601) | `valor-ejemplo` |
| `events[].correlationId` | No | `string` | formato `uuid` | Correlation id | `00000000-0000-4000-8000-000000000001` |
| `events[].properties` | No | `array<ActivityEventPropertyDto>` | Sin restricción adicional declarada | Propiedades permitidas y minimizadas | `[{"propertyName":"Nombre de ejemplo","valueType":"STRING","valueString":"valor-ejemplo","valueNumber":1,"valueBoolean":true,"dataClassificationConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `events[].properties[].propertyName` | No | `string` | longitud máxima 200 | Nombre de la propiedad | `Nombre de ejemplo` |
| `events[].properties[].valueType` | No | `string` | valores: `STRING`, `NUMBER`, `BOOLEAN` | Tipo de valor | `STRING` |
| `events[].properties[].valueString` | No | `string` | longitud máxima 4000 | Valor string | `valor-ejemplo` |
| `events[].properties[].valueNumber` | No | `number` | Sin restricción adicional declarada | Valor numérico | `1` |
| `events[].properties[].valueBoolean` | No | `boolean` | Sin restricción adicional declarada | Valor booleano | `true` |
| `events[].properties[].dataClassificationConceptId` | No | `string` | formato `uuid` | Clasificación de dato (concept id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/activity-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "events": [
    {
      "eventSchemaDefinitionId": "00000000-0000-4000-8000-000000000001",
      "eventName": "Nombre de ejemplo",
      "eventIdempotencyKey": "valor-ejemplo",
      "analyticsSubjectId": "00000000-0000-4000-8000-000000000001",
      "userId": "00000000-0000-4000-8000-000000000001",
      "sessionId": "00000000-0000-4000-8000-000000000001",
      "sessionJourneyId": "00000000-0000-4000-8000-000000000001",
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "portalTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "routeTemplate": "valor-ejemplo",
      "occurredAt": "valor-ejemplo",
      "correlationId": "00000000-0000-4000-8000-000000000001",
      "properties": [
        {
          "propertyName": "Nombre de ejemplo",
          "valueType": "STRING",
          "valueString": "valor-ejemplo",
          "valueNumber": 1,
          "valueBoolean": true,
          "dataClassificationConceptId": "00000000-0000-4000-8000-000000000001"
        }
      ]
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ActivityEventsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "inserted": 1,
  "skipped": 1,
  "eventIds": [
    "valor-ejemplo"
  ],
  "sessionJourneyId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `inserted` | Sí | `number` | Sin restricción adicional declarada | Eventos insertados (consent-aware) | `1` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Eventos descartados por falta de consentimiento o reenvío | `1` |
| `eventIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de los eventos insertados | `["valor-ejemplo"]` |
| `sessionJourneyId` | No | `string` | formato `uuid` | Journey de sesión afectado | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Esquema de evento no encontrado | Excepción explícita en src/modules/telemetry/services/telemetry-events.service.ts |
| 404 | `NOT_FOUND` | Journey de sesión no encontrado | Excepción explícita en src/modules/telemetry/services/telemetry-events.service.ts |
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
  "path": "/telemetry/activity-events"
}
```

---

## 2. POST /telemetry/analytics-subjects

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-consent`
- **Nombre:** Provisionar sujeto de analítica pseudónimo
- **Operation ID:** `TelemetryConsentController_provisionSubject`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryConsentController.provisionSubject](../../src/modules/telemetry/controllers/telemetry-consent.controller.ts)

### Descripción de negocio

Provisionar sujeto de analítica pseudónimo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-28-06 (interno del worker de ingesta).

### Descripción del sistema

NestJS resuelve `POST /telemetry/analytics-subjects` en `TelemetryConsentController_provisionSubject`. El controlador delega en `TelemetryConsentService.provisionSubject`. Valida el body como `ProvisionAnalyticsSubjectDto` y consume `application/json`. El tipo de retorno estático es `Promise<AnalyticsSubjectResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ProvisionAnalyticsSubjectDto`; los campos opcionales se omiten.

```http
POST /telemetry/analytics-subjects HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `pseudonymousSubjectKey` | No | `string` | longitud máxima 200 | Clave pseudónima (HMAC). Si se omite se genera de forma determinista. | `valor-ejemplo` |
| `keyVersion` | No | `number` | mínimo 1 | Versión de la clave de derivación | `1` |
| `userId` | No | `string` | formato `uuid` | Usuario asociado (opcional) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Perfil de paciente asociado (opcional) | `00000000-0000-4000-8000-000000000001` |
| `createdFromConsentId` | No | `string` | formato `uuid` | Consentimiento que originó el sujeto | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/analytics-subjects HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pseudonymousSubjectKey": "valor-ejemplo",
  "keyVersion": 1,
  "userId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "createdFromConsentId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AnalyticsSubjectResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "pseudonymousSubjectKey": "valor-ejemplo",
  "keyVersion": 1,
  "reused": true,
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `pseudonymousSubjectKey` | Sí | `string` | Sin restricción adicional declarada | Clave pseudónima del sujeto | `valor-ejemplo` |
| `keyVersion` | No | `number` | Sin restricción adicional declarada | Valor de key version mantenido por la instancia. | `1` |
| `reused` | Sí | `boolean` | Sin restricción adicional declarada | true si el sujeto ya existía (idempotente) | `true` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/telemetry/analytics-subjects"
}
```

---

## 3. POST /telemetry/client-contexts

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-events`
- **Nombre:** Registrar contexto de cliente/dispositivo + journey
- **Operation ID:** `TelemetryEventsController_captureClientContext`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryEventsController.captureClientContext](../../src/modules/telemetry/controllers/telemetry-events.controller.ts)

### Descripción de negocio

Registrar contexto de cliente/dispositivo + journey. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/client-contexts` en `TelemetryEventsController_captureClientContext`. El controlador delega en `TelemetryEventsService.captureClientContext`. Valida el body como `CreateClientContextDto` y consume `application/json`. El tipo de retorno estático es `Promise<ClientContextResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateClientContextDto`; los campos opcionales se omiten.

```http
POST /telemetry/client-contexts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sessionJourneyId` | No | `string` | formato `uuid` | Journey de sesión existente a enlazar | `00000000-0000-4000-8000-000000000001` |
| `sessionId` | No | `string` | formato `uuid` | Sesión (se usa para crear el journey si no existe) | `00000000-0000-4000-8000-000000000001` |
| `analyticsSubjectId` | No | `string` | formato `uuid` | Sujeto de analítica | `00000000-0000-4000-8000-000000000001` |
| `portalTypeConceptId` | No | `string` | formato `uuid` | Tipo de portal (concept id) | `00000000-0000-4000-8000-000000000001` |
| `deviceTypeConceptId` | No | `string` | formato `uuid` | Tipo de dispositivo (concept id) | `00000000-0000-4000-8000-000000000001` |
| `osFamilyConceptId` | No | `string` | formato `uuid` | Familia de SO (concept id) | `00000000-0000-4000-8000-000000000001` |
| `browserFamilyConceptId` | No | `string` | formato `uuid` | Familia de navegador (concept id) | `00000000-0000-4000-8000-000000000001` |
| `appVersion` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `screenClass` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `viewportBucket` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `locale` | No | `string` | longitud máxima 20 | Sin descripción específica en el contrato OpenAPI. | `es-BO` |
| `timezoneOffsetMinutes` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `countryConceptId` | No | `string` | formato `uuid` | País (concept id) | `00000000-0000-4000-8000-000000000001` |
| `regionCoarse` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `ipPrefixHash` | No | `string` | longitud máxima 200 | Hash del prefijo de IP | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `userAgentHash` | No | `string` | longitud máxima 200 | Hash del user agent | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `isBot` | No | `boolean` | Sin restricción adicional declarada | Marcado como bot | `true` |
| `dataClassificationConceptId` | No | `string` | formato `uuid` | Clasificación de dato (concept id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/client-contexts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sessionJourneyId": "00000000-0000-4000-8000-000000000001",
  "sessionId": "00000000-0000-4000-8000-000000000001",
  "analyticsSubjectId": "00000000-0000-4000-8000-000000000001",
  "portalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "deviceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "osFamilyConceptId": "00000000-0000-4000-8000-000000000001",
  "browserFamilyConceptId": "00000000-0000-4000-8000-000000000001",
  "appVersion": "valor-ejemplo",
  "screenClass": "valor-ejemplo",
  "viewportBucket": "valor-ejemplo",
  "locale": "es-BO",
  "timezoneOffsetMinutes": 1,
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "regionCoarse": "valor-ejemplo",
  "ipPrefixHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "userAgentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "isBot": true,
  "dataClassificationConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ClientContextResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "sessionJourneyId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `sessionJourneyId` | Sí | `string` | formato `uuid` | Journey de sesión creado o enlazado | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Journey de sesión no encontrado | Excepción explícita en src/modules/telemetry/services/telemetry-events.service.ts |
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
  "path": "/telemetry/client-contexts"
}
```

---

## 4. POST /telemetry/conversion-events

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-events`
- **Nombre:** Registrar evento de conversión con atribución
- **Operation ID:** `TelemetryEventsController_recordConversion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryEventsController.recordConversion](../../src/modules/telemetry/controllers/telemetry-events.controller.ts)

### Descripción de negocio

Registrar evento de conversión con atribución. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/conversion-events` en `TelemetryEventsController_recordConversion`. El controlador delega en `TelemetryEventsService.recordConversion`. Valida el body como `CreateConversionEventDto` y consume `application/json`. El tipo de retorno estático es `Promise<ConversionEventResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateConversionEventDto`; los campos opcionales se omiten.

```http
POST /telemetry/conversion-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "funnelDefinitionId": "00000000-0000-4000-8000-000000000001",
  "analyticsSubjectId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `funnelDefinitionId` | Sí | `string` | formato `uuid` | Funnel activo alcanzado | `00000000-0000-4000-8000-000000000001` |
| `analyticsSubjectId` | Sí | `string` | formato `uuid` | Sujeto de analítica que convierte | `00000000-0000-4000-8000-000000000001` |
| `sessionJourneyId` | No | `string` | formato `uuid` | Journey de sesión asociado | `00000000-0000-4000-8000-000000000001` |
| `completionEventId` | No | `string` | formato `uuid` | Evento de actividad que completó el último paso | `00000000-0000-4000-8000-000000000001` |
| `attributionJson` | No | `object` | Sin restricción adicional declarada | Datos de atribución (JSON) | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/conversion-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "funnelDefinitionId": "00000000-0000-4000-8000-000000000001",
  "analyticsSubjectId": "00000000-0000-4000-8000-000000000001",
  "sessionJourneyId": "00000000-0000-4000-8000-000000000001",
  "completionEventId": "00000000-0000-4000-8000-000000000001",
  "attributionJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConversionEventResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "funnelDefinitionId": "00000000-0000-4000-8000-000000000001",
  "analyticsSubjectId": "00000000-0000-4000-8000-000000000001",
  "convertedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `funnelDefinitionId` | Sí | `string` | formato `uuid` | Identificador asociado a funnel definition. | `00000000-0000-4000-8000-000000000001` |
| `analyticsSubjectId` | Sí | `string` | formato `uuid` | Identificador asociado a analytics subject. | `00000000-0000-4000-8000-000000000001` |
| `convertedAt` | Sí | `string` | formato `date-time` | Valor de converted at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Funnel no encontrado | Excepción explícita en src/modules/telemetry/services/telemetry-events.service.ts |
| 404 | `NOT_FOUND` | Sujeto de analítica no encontrado | Excepción explícita en src/modules/telemetry/services/telemetry-events.service.ts |
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
  "path": "/telemetry/conversion-events"
}
```

---

## 5. POST /telemetry/disclosure-acceptances

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-consent`
- **Nombre:** Registrar aceptación de disclosure por usuario/sesión
- **Operation ID:** `TelemetryConsentController_acceptDisclosure`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryConsentController.acceptDisclosure](../../src/modules/telemetry/controllers/telemetry-consent.controller.ts)

### Descripción de negocio

Registrar aceptación de disclosure por usuario/sesión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/disclosure-acceptances` en `TelemetryConsentController_acceptDisclosure`. El controlador delega en `TelemetryConsentService.acceptDisclosure`. Valida el body como `CreateDisclosureAcceptanceDto` y consume `application/json`. El tipo de retorno estático es `Promise<DisclosureAcceptanceResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDisclosureAcceptanceDto`; los campos opcionales se omiten.

```http
POST /telemetry/disclosure-acceptances HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "trackingDisclosureVersionId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `trackingDisclosureVersionId` | Sí | `string` | formato `uuid` | Versión de disclosure aceptada | `00000000-0000-4000-8000-000000000001` |
| `userId` | No | `string` | formato `uuid` | Usuario que acepta (por defecto el autenticado) | `00000000-0000-4000-8000-000000000001` |
| `sessionId` | No | `string` | formato `uuid` | Sesión asociada | `00000000-0000-4000-8000-000000000001` |
| `ipPrefixHash` | No | `string` | longitud máxima 200 | Hash del prefijo de IP (sin PII en claro) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `userAgentHash` | No | `string` | longitud máxima 200 | Hash del user agent (sin PII en claro) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/disclosure-acceptances HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "trackingDisclosureVersionId": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "sessionId": "00000000-0000-4000-8000-000000000001",
  "ipPrefixHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "userAgentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DisclosureAcceptanceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "trackingDisclosureVersionId": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "acceptedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `trackingDisclosureVersionId` | Sí | `string` | formato `uuid` | Identificador asociado a tracking disclosure version. | `00000000-0000-4000-8000-000000000001` |
| `userId` | Sí | `string` | formato `uuid` | Identificador asociado a user. | `00000000-0000-4000-8000-000000000001` |
| `acceptedAt` | Sí | `string` | formato `date-time` | Valor de accepted at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión de disclosure no encontrada | Excepción explícita en src/modules/telemetry/services/telemetry-consent.service.ts |
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
  "path": "/telemetry/disclosure-acceptances"
}
```

---

## 6. POST /telemetry/disclosure-versions

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-governance`
- **Nombre:** Publicar versión de disclosure de tracking
- **Operation ID:** `TelemetryGovernanceController_publishDisclosure`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryGovernanceController.publishDisclosure](../../src/modules/telemetry/controllers/telemetry-governance.controller.ts)

### Descripción de negocio

Publicar versión de disclosure de tracking. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/disclosure-versions` en `TelemetryGovernanceController_publishDisclosure`. El controlador delega en `TelemetryGovernanceService.publishDisclosure`. Valida el body como `CreateDisclosureVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<DisclosureVersionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDisclosureVersionDto`; los campos opcionales se omiten.

```http
POST /telemetry/disclosure-versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "documentCode": "CODIGO_EJEMPLO"
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
| `documentCode` | Sí | `string` | longitud máxima 100 | Código del documento de disclosure | `CODIGO_EJEMPLO` |
| `versionNumber` | No | `number` | mínimo 1 | Número de versión | `1` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Jurisdicción (concept id) | `00000000-0000-4000-8000-000000000001` |
| `fileId` | No | `string` | formato `uuid` | Documento en object storage (file id) | `00000000-0000-4000-8000-000000000001` |
| `contentHash` | No | `string` | longitud máxima 200 | Hash del contenido del documento | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/disclosure-versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "documentCode": "CODIGO_EJEMPLO",
  "versionNumber": 1,
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "fileId": "00000000-0000-4000-8000-000000000001",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DisclosureVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "documentCode": "CODIGO_EJEMPLO",
  "versionNumber": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `documentCode` | Sí | `string` | Sin restricción adicional declarada | Valor de document code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe esa versión del documento | Excepción explícita en src/modules/telemetry/services/telemetry-governance.service.ts |
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
  "path": "/telemetry/disclosure-versions"
}
```

---

## 7. POST /telemetry/event-schemas

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-governance`
- **Nombre:** Registrar esquema de evento de actividad (versionado)
- **Operation ID:** `TelemetryGovernanceController_registerEventSchema`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryGovernanceController.registerEventSchema](../../src/modules/telemetry/controllers/telemetry-governance.controller.ts)

### Descripción de negocio

Registrar esquema de evento de actividad (versionado). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/event-schemas` en `TelemetryGovernanceController_registerEventSchema`. El controlador delega en `TelemetryGovernanceService.registerEventSchema`. Valida el body como `CreateEventSchemaDto` y consume `application/json`. El tipo de retorno estático es `Promise<EventSchemaResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateEventSchemaDto`; los campos opcionales se omiten.

```http
POST /telemetry/event-schemas HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "eventName": "Nombre de ejemplo",
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001"
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
| `eventName` | Sí | `string` | longitud máxima 200 | Nombre del evento de actividad | `Nombre de ejemplo` |
| `schemaVersion` | No | `number` | mínimo 1 | Versión del esquema | `1` |
| `purposeDefinitionId` | Sí | `string` | formato `uuid` | Propósito de tracking asociado (activo) | `00000000-0000-4000-8000-000000000001` |
| `portalTypeConceptId` | No | `string` | formato `uuid` | Tipo de portal (concept id) | `00000000-0000-4000-8000-000000000001` |
| `propertySchemaJson` | No | `object` | Sin restricción adicional declarada | JSON Schema de propiedades permitidas | `{}` |
| `prohibitedPropertyPatternsJson` | No | `object` | Sin restricción adicional declarada | Patrones de propiedades prohibidas (PHI/free-text) | `{}` |
| `piiClassificationConceptId` | No | `string` | formato `uuid` | Clasificación PII (concept id) | `00000000-0000-4000-8000-000000000001` |
| `phiAllowed` | No | `boolean` | Sin restricción adicional declarada | PHI permitido en el esquema | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/event-schemas HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "eventName": "Nombre de ejemplo",
  "schemaVersion": 1,
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "portalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "propertySchemaJson": {},
  "prohibitedPropertyPatternsJson": {},
  "piiClassificationConceptId": "00000000-0000-4000-8000-000000000001",
  "phiAllowed": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EventSchemaResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "eventName": "Nombre de ejemplo",
  "schemaVersion": 1,
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `eventName` | Sí | `string` | Sin restricción adicional declarada | Valor de event name mantenido por la instancia. | `Nombre de ejemplo` |
| `schemaVersion` | Sí | `number` | Sin restricción adicional declarada | Valor de schema version mantenido por la instancia. | `1` |
| `purposeDefinitionId` | Sí | `string` | formato `uuid` | Identificador asociado a purpose definition. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Propósito de tracking no encontrado | Excepción explícita en src/modules/telemetry/services/telemetry-governance.service.ts |
| 409 | `CONFLICT` | Ya existe un esquema con ese nombre y versión | Excepción explícita en src/modules/telemetry/services/telemetry-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El propósito de tracking no está activo | Excepción explícita en src/modules/telemetry/services/telemetry-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/telemetry/event-schemas"
}
```

---

## 8. POST /telemetry/funnels

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-governance`
- **Nombre:** Definir funnel y sus pasos
- **Operation ID:** `TelemetryGovernanceController_defineFunnel`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryGovernanceController.defineFunnel](../../src/modules/telemetry/controllers/telemetry-governance.controller.ts)

### Descripción de negocio

Definir funnel y sus pasos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/funnels` en `TelemetryGovernanceController_defineFunnel`. El controlador delega en `TelemetryGovernanceService.defineFunnel`. Valida el body como `CreateFunnelDto` y consume `application/json`. El tipo de retorno estático es `Promise<FunnelResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFunnelDto`; los campos opcionales se omiten.

```http
POST /telemetry/funnels HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "funnelCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "steps": [
    {
      "eventSchemaDefinitionId": "00000000-0000-4000-8000-000000000001"
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
| `funnelCode` | Sí | `string` | longitud máxima 100 | Código único del funnel | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Nombre del funnel | `Nombre de ejemplo` |
| `purposeDefinitionId` | Sí | `string` | formato `uuid` | Propósito de tracking activo | `00000000-0000-4000-8000-000000000001` |
| `portalTypeConceptId` | No | `string` | formato `uuid` | Tipo de portal (concept id) | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | No | `number` | mínimo 1 | Número de versión | `1` |
| `steps` | Sí | `array<FunnelStepDto>` | mínimo 1 elemento(s) | Pasos del funnel (>= 1) | `[{"stepNumber":1,"eventSchemaDefinitionId":"00000000-0000-4000-8000-000000000001","qualificationRuleJson":{}}]` |
| `steps[].stepNumber` | No | `number` | mínimo 1 | Número de paso (contiguo desde 1). Si se omite se asigna por orden. | `1` |
| `steps[].eventSchemaDefinitionId` | Sí | `string` | formato `uuid` | Esquema de evento que cualifica el paso | `00000000-0000-4000-8000-000000000001` |
| `steps[].qualificationRuleJson` | No | `object` | Sin restricción adicional declarada | Regla de cualificación (JSON) | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/funnels HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "funnelCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "portalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "steps": [
    {
      "stepNumber": 1,
      "eventSchemaDefinitionId": "00000000-0000-4000-8000-000000000001",
      "qualificationRuleJson": {}
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FunnelResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FunnelResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "funnelCode": "CODIGO_EJEMPLO",
  "versionNumber": 1,
  "stepCount": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `funnelCode` | Sí | `string` | Sin restricción adicional declarada | Valor de funnel code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `stepCount` | Sí | `number` | Sin restricción adicional declarada | Número de pasos definidos | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Propósito de tracking no encontrado | Excepción explícita en src/modules/telemetry/services/telemetry-governance.service.ts |
| 409 | `CONFLICT` | El código de funnel ya existe | Excepción explícita en src/modules/telemetry/services/telemetry-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Esquema de evento de un paso no existe | Excepción explícita en src/modules/telemetry/services/telemetry-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/telemetry/funnels"
}
```

---

## 9. POST /telemetry/session-journeys/{id}/close

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-events`
- **Nombre:** Cerrar journey de sesión y consolidar métricas
- **Operation ID:** `TelemetryEventsController_closeJourney`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryEventsController.closeJourney](../../src/modules/telemetry/controllers/telemetry-events.controller.ts)

### Descripción de negocio

Cerrar journey de sesión y consolidar métricas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/session-journeys/{id}/close` en `TelemetryEventsController_closeJourney`. El controlador delega en `TelemetryEventsService.closeJourney`. Valida el body como `CloseJourneyDto` y consume `application/json`. El tipo de retorno estático es `Promise<JourneyResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CloseJourneyDto`; los campos opcionales se omiten.

```http
POST /telemetry/session-journeys/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `exitEventId` | No | `string` | formato `uuid` | Evento de salida | `00000000-0000-4000-8000-000000000001` |
| `eventCount` | No | `number` | mínimo 0 | Conteo final de eventos (si el worker lo consolida) | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/session-journeys/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "exitEventId": "00000000-0000-4000-8000-000000000001",
  "eventCount": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
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
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Journey de sesión no encontrado | Excepción explícita en src/modules/telemetry/services/telemetry-events.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El journey ya está cerrado | Excepción explícita en src/modules/telemetry/services/telemetry-events.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/telemetry/session-journeys/{id}/close"
}
```

---

## 10. POST /telemetry/tracking-consents

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-consent`
- **Nombre:** Otorgar consentimiento de tracking por propósito
- **Operation ID:** `TelemetryConsentController_grantConsent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryConsentController.grantConsent](../../src/modules/telemetry/controllers/telemetry-consent.controller.ts)

### Descripción de negocio

Otorgar consentimiento de tracking por propósito. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/tracking-consents` en `TelemetryConsentController_grantConsent`. El controlador delega en `TelemetryConsentService.grantConsent`. Valida el body como `CreateTrackingConsentDto` y consume `application/json`. El tipo de retorno estático es `Promise<TrackingConsentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTrackingConsentDto`; los campos opcionales se omiten.

```http
POST /telemetry/tracking-consents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `purposeDefinitionId` | Sí | `string` | formato `uuid` | Propósito de tracking (requiere consentimiento) | `00000000-0000-4000-8000-000000000001` |
| `userId` | No | `string` | formato `uuid` | Usuario que consiente (por defecto el autenticado) | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Jurisdicción (concept id) | `00000000-0000-4000-8000-000000000001` |
| `consentVersion` | No | `string` | longitud máxima 50 | Versión del consentimiento | `valor-ejemplo` |
| `evidenceHash` | No | `string` | longitud máxima 200 | Hash de la evidencia de consentimiento | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/tracking-consents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "consentVersion": "valor-ejemplo",
  "evidenceHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TrackingConsentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "decisionConceptId": "00000000-0000-4000-8000-000000000001",
  "grantedAt": "2026-07-31T12:00:00.000Z",
  "withdrawnAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `userId` | Sí | `string` | formato `uuid` | Identificador asociado a user. | `00000000-0000-4000-8000-000000000001` |
| `purposeDefinitionId` | Sí | `string` | formato `uuid` | Identificador asociado a purpose definition. | `00000000-0000-4000-8000-000000000001` |
| `decisionConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a decision concept. | `00000000-0000-4000-8000-000000000001` |
| `grantedAt` | No | `string` | formato `date-time` | Valor de granted at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `withdrawnAt` | No | `string` | formato `date-time` | Valor de withdrawn at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Propósito de tracking no encontrado | Excepción explícita en src/modules/telemetry/services/telemetry-consent.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El propósito no requiere consentimiento | Excepción explícita en src/modules/telemetry/services/telemetry-consent.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/telemetry/tracking-consents"
}
```

---

## 11. POST /telemetry/tracking-consents/{id}/withdraw

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-consent`
- **Nombre:** Retirar consentimiento y desactivar sujeto (cascada)
- **Operation ID:** `TelemetryConsentController_withdrawConsent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryConsentController.withdrawConsent](../../src/modules/telemetry/controllers/telemetry-consent.controller.ts)

### Descripción de negocio

Retirar consentimiento y desactivar sujeto (cascada). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/tracking-consents/{id}/withdraw` en `TelemetryConsentController_withdrawConsent`. El controlador delega en `TelemetryConsentService.withdrawConsent`. No recibe body. El tipo de retorno estático es `Promise<TrackingConsentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /telemetry/tracking-consents/00000000-0000-4000-8000-000000000001/withdraw HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /telemetry/tracking-consents/00000000-0000-4000-8000-000000000001/withdraw HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TrackingConsentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "decisionConceptId": "00000000-0000-4000-8000-000000000001",
  "grantedAt": "2026-07-31T12:00:00.000Z",
  "withdrawnAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `userId` | Sí | `string` | formato `uuid` | Identificador asociado a user. | `00000000-0000-4000-8000-000000000001` |
| `purposeDefinitionId` | Sí | `string` | formato `uuid` | Identificador asociado a purpose definition. | `00000000-0000-4000-8000-000000000001` |
| `decisionConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a decision concept. | `00000000-0000-4000-8000-000000000001` |
| `grantedAt` | No | `string` | formato `date-time` | Valor de granted at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `withdrawnAt` | No | `string` | formato `date-time` | Valor de withdrawn at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Consentimiento no encontrado | Excepción explícita en src/modules/telemetry/services/telemetry-consent.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay un consentimiento vigente que retirar | Excepción explícita en src/modules/telemetry/services/telemetry-consent.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/telemetry/tracking-consents/{id}/withdraw"
}
```

---

## 12. POST /telemetry/tracking-purposes

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-governance`
- **Nombre:** Definir propósito de tracking y base legal
- **Operation ID:** `TelemetryGovernanceController_definePurpose`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryGovernanceController.definePurpose](../../src/modules/telemetry/controllers/telemetry-governance.controller.ts)

### Descripción de negocio

Definir propósito de tracking y base legal. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/tracking-purposes` en `TelemetryGovernanceController_definePurpose`. El controlador delega en `TelemetryGovernanceService.definePurpose`. Valida el body como `CreateTrackingPurposeDto` y consume `application/json`. El tipo de retorno estático es `Promise<TrackingPurposeResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTrackingPurposeDto`; los campos opcionales se omiten.

```http
POST /telemetry/tracking-purposes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
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
| `purposeCode` | Sí | `string` | longitud máxima 100 | Código único del propósito de tracking | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Nombre legible del propósito | `Nombre de ejemplo` |
| `purposeCategoryConceptId` | No | `string` | formato `uuid` | Categoría del propósito (concept id) | `00000000-0000-4000-8000-000000000001` |
| `legalBasisConceptId` | No | `string` | formato `uuid` | Base legal (concept id) | `00000000-0000-4000-8000-000000000001` |
| `requiresConsent` | No | `boolean` | Sin restricción adicional declarada | Requiere consentimiento explícito | `true` |
| `permitsMarketingUse` | No | `boolean` | Sin restricción adicional declarada | Permite uso de marketing | `true` |
| `permitsCrossTenantAggregation` | No | `boolean` | Sin restricción adicional declarada | Permite agregación cross-tenant | `true` |
| `defaultRetentionDays` | No | `number` | mínimo 0; máximo 36500 | Días de retención por defecto | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/tracking-purposes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "purposeCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "legalBasisConceptId": "00000000-0000-4000-8000-000000000001",
  "requiresConsent": true,
  "permitsMarketingUse": true,
  "permitsCrossTenantAggregation": true,
  "defaultRetentionDays": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TrackingPurposeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "purposeCode": "CODIGO_EJEMPLO",
  "versionNumber": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "requiresConsent": true,
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `purposeCode` | Sí | `string` | Sin restricción adicional declarada | Valor de purpose code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `requiresConsent` | Sí | `boolean` | Sin restricción adicional declarada | Requiere consentimiento | `true` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El código de propósito ya existe | Excepción explícita en src/modules/telemetry/services/telemetry-governance.service.ts |
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
  "path": "/telemetry/tracking-purposes"
}
```

---

## 13. POST /telemetry/web-vitals

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-events`
- **Nombre:** Registrar métricas Core Web Vitals por ruta (batch)
- **Operation ID:** `TelemetryEventsController_recordWebVitals`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryEventsController.recordWebVitals](../../src/modules/telemetry/controllers/telemetry-events.controller.ts)

### Descripción de negocio

Registrar métricas Core Web Vitals por ruta (batch). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/web-vitals` en `TelemetryEventsController_recordWebVitals`. El controlador delega en `TelemetryEventsService.recordWebVitals`. Valida el body como `RecordWebVitalsDto` y consume `application/json`. El tipo de retorno estático es `Promise<WebVitalsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordWebVitalsDto`; los campos opcionales se omiten.

```http
POST /telemetry/web-vitals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "metrics": [
    {
      "metric": "LCP",
      "metricValue": 1
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `metrics` | Sí | `array<WebVitalItemDto>` | mínimo 1 elemento(s); máximo 200 elemento(s) | Lote de métricas CWV | `[{"metric":"LCP","metricValue":1,"rating":"GOOD","routeTemplate":"valor-ejemplo","portalTypeConceptId":"00000000-0000-4000-8000-000000000001","userActivityEventId":"00000000-0000-4000-8000-000000000001","clientContextId":"00000000-0000-4000-8000-000000000001","sessionJourneyId":"00000000-0000-4000-8000-000000000001","analyticsSubjectId":"00000000-0000-4000-8000-000000000001"}]` |
| `metrics[].metric` | Sí | `string` | valores: `LCP`, `INP`, `FID`, `CLS`, `TTFB`, `FCP` | Métrica CWV | `LCP` |
| `metrics[].metricValue` | Sí | `number` | mínimo 0 | Valor de la métrica (>= 0) | `1` |
| `metrics[].rating` | No | `string` | valores: `GOOD`, `NEEDS_IMPROVEMENT`, `POOR` | Rating | `GOOD` |
| `metrics[].routeTemplate` | No | `string` | longitud máxima 300 | Plantilla de ruta | `valor-ejemplo` |
| `metrics[].portalTypeConceptId` | No | `string` | formato `uuid` | Tipo de portal (concept id) | `00000000-0000-4000-8000-000000000001` |
| `metrics[].userActivityEventId` | No | `string` | formato `uuid` | Evento de actividad relacionado | `00000000-0000-4000-8000-000000000001` |
| `metrics[].clientContextId` | No | `string` | formato `uuid` | Contexto de cliente | `00000000-0000-4000-8000-000000000001` |
| `metrics[].sessionJourneyId` | No | `string` | formato `uuid` | Journey de sesión | `00000000-0000-4000-8000-000000000001` |
| `metrics[].analyticsSubjectId` | No | `string` | formato `uuid` | Sujeto de analítica | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/web-vitals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "metrics": [
    {
      "metric": "LCP",
      "metricValue": 1,
      "rating": "GOOD",
      "routeTemplate": "valor-ejemplo",
      "portalTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "userActivityEventId": "00000000-0000-4000-8000-000000000001",
      "clientContextId": "00000000-0000-4000-8000-000000000001",
      "sessionJourneyId": "00000000-0000-4000-8000-000000000001",
      "analyticsSubjectId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WebVitalsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "inserted": 1,
  "ids": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `inserted` | Sí | `number` | Sin restricción adicional declarada | Valor de inserted mantenido por la instancia. | `1` |
| `ids` | Sí | `array<string>` | Sin restricción adicional declarada | Valor de ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Journey de sesión no encontrado | Excepción explícita en src/modules/telemetry/services/telemetry-events.service.ts |
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
  "path": "/telemetry/web-vitals"
}
```

---

