<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `messaging`

Referencia exhaustiva de 13 operación(es) del módulo `messaging`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `messaging`, `messaging-internal`, `messaging-webhooks`
- **Controladores:** `MessagingController`, `MessagingInternalController`, `ProviderWebhooksController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /internal/event-deliveries/{id}/ack](#1-post-internal-event-deliveries-id-ack) — Registrar el acuse del consumidor sobre una entrega
2. [POST /internal/events/{domainEventId}/dispatch](#2-post-internal-events-domaineventid-dispatch) — Repartir el evento entre sus suscriptores
3. [POST /internal/jobs/{id}/complete](#3-post-internal-jobs-id-complete) — Cerrar el trabajo con éxito
4. [POST /internal/jobs/{id}/fail](#4-post-internal-jobs-id-fail) — Registrar el fallo del trabajo
5. [POST /internal/notifications/{requestId}/deliver](#5-post-internal-notifications-requestid-deliver) — Registrar el intento de entrega ante el proveedor
6. [GET /internal/notifications/pending](#6-get-internal-notifications-pending) — Listar solicitudes de notificación listas para entregar
7. [POST /internal/outbox/relay/run](#7-post-internal-outbox-relay-run) — Reclamar y publicar un lote del outbox
8. [POST /internal/queues/{code}/claim](#8-post-internal-queues-code-claim) — Reclamar un lote de trabajos de la cola
9. [POST /notifications/in-app/{id}/read](#9-post-notifications-in-app-id-read) — Marcar una notificación in-app como leída
10. [POST /notifications/requests](#10-post-notifications-requests) — Crear una solicitud de notificación
11. [POST /queues/{code}/jobs](#11-post-queues-code-jobs) — Encolar un trabajo
12. [POST /queues/dead-letter/{deadLetterJobId}/redrive](#12-post-queues-dead-letter-deadletterjobid-redrive) — Reencolar un trabajo desde la cola muerta
13. [POST /webhooks/providers/{providerCode}/receipts](#13-post-webhooks-providers-providercode-receipts) — Conciliar el acuse de entrega que envía el proveedor

---

## 1. POST /internal/event-deliveries/{id}/ack

- **Módulo:** `messaging`
- **Etiqueta OpenAPI:** `messaging-internal`
- **Nombre:** Registrar el acuse del consumidor sobre una entrega
- **Operation ID:** `MessagingInternalController_ackDelivery`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MessagingInternalController.ackDelivery](../../src/modules/messaging/controllers/messaging-internal.controller.ts)

### Descripción de negocio

Registrar el acuse del consumidor sobre una entrega. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /internal/event-deliveries/{id}/ack` en `MessagingInternalController_ackDelivery`. El controlador delega en `OutboxService.ackDelivery`. Valida el body como `AckEventDeliveryDto` y consume `application/json`. El tipo de retorno estático es `Promise<EventDeliveryResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AckEventDeliveryDto`; los campos opcionales se omiten.

```http
POST /internal/event-deliveries/00000000-0000-4000-8000-000000000001/ack HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "outcome": "HANDLED"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MESSAGING_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `outcome` | Sí | `string` | valores: `HANDLED`, `FAILED` | Sin descripción específica en el contrato OpenAPI. | `HANDLED` |
| `errorText` | No | `string` | Sin restricción adicional declarada | Qué falló; obligatorio si el desenlace es fallo | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/event-deliveries/00000000-0000-4000-8000-000000000001/ack HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "outcome": "HANDLED",
  "errorText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<EventDeliveryResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EventDeliveryResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EventDeliveryResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EventDeliveryResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<EventDeliveryResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EventDeliveryResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EventDeliveryResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EventDeliveryResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EventDeliveryResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EventDeliveryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EventDeliveryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "handledAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `handledAt` | No | `string` | formato `date-time` | Valor de handled at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MESSAGING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Entrega no encontrada | Excepción explícita en src/modules/messaging/services/outbox.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un acuse fallido debe declarar qué falló | Excepción explícita en src/modules/messaging/services/outbox.service.ts |
| 422 | `PRECONDITION_FAILED` | La entrega ya está resuelta | Excepción explícita en src/modules/messaging/services/outbox.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/event-deliveries/{id}/ack"
}
```

---

## 2. POST /internal/events/{domainEventId}/dispatch

- **Módulo:** `messaging`
- **Etiqueta OpenAPI:** `messaging-internal`
- **Nombre:** Repartir el evento entre sus suscriptores
- **Operation ID:** `MessagingInternalController_dispatchEvent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MessagingInternalController.dispatchEvent](../../src/modules/messaging/controllers/messaging-internal.controller.ts)

### Descripción de negocio

Idempotente por suscripción: reintentar no duplica la entrega.


### Descripción del sistema

NestJS resuelve `POST /internal/events/{domainEventId}/dispatch` en `MessagingInternalController_dispatchEvent`. El controlador delega en `OutboxService.dispatchEvent`. Valida el body como `DispatchEventDto` y consume `application/json`. El tipo de retorno estático es `Promise<DispatchEventResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `domainEventId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DispatchEventDto`; los campos opcionales se omiten.

```http
POST /internal/events/00000000-0000-4000-8000-000000000001/dispatch HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MESSAGING_ADMIN`.
- Deben ser UUID válidos: `domainEventId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `enqueueJobs` | No | `boolean` | Sin restricción adicional declarada | Encolar además un job por suscripción en modo cola | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/events/00000000-0000-4000-8000-000000000001/dispatch HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "enqueueJobs": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DispatchEventResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DispatchEventResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DispatchEventResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DispatchEventResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DispatchEventResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DispatchEventResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DispatchEventResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DispatchEventResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DispatchEventResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DispatchEventResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DispatchEventResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "domainEventId": "00000000-0000-4000-8000-000000000001",
  "matched": 1,
  "filteredOut": 1,
  "deliveries": [
    {
      "subscriptionId": "00000000-0000-4000-8000-000000000001",
      "subscriberCode": "CODIGO_EJEMPLO",
      "deliveryId": "00000000-0000-4000-8000-000000000001",
      "jobId": "00000000-0000-4000-8000-000000000001",
      "duplicate": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `domainEventId` | Sí | `string` | formato `uuid` | Identificador asociado a domain event. | `00000000-0000-4000-8000-000000000001` |
| `matched` | Sí | `number` | Sin restricción adicional declarada | Suscripciones que casaron con el evento | `1` |
| `filteredOut` | Sí | `number` | Sin restricción adicional declarada | Suscripciones descartadas por su filtro | `1` |
| `deliveries` | Sí | `array<DispatchedSubscriberDto>` | Sin restricción adicional declarada | Valor de deliveries mantenido por la instancia. | `[{"subscriptionId":"00000000-0000-4000-8000-000000000001","subscriberCode":"CODIGO_EJEMPLO","deliveryId":"00000000-0000-4000-8000-000000000001","jobId":"00000000-0000-4000-8000-000000000001","duplicate":true}]` |
| `deliveries[].subscriptionId` | Sí | `string` | formato `uuid` | Identificador asociado a subscription. | `00000000-0000-4000-8000-000000000001` |
| `deliveries[].subscriberCode` | Sí | `string` | Sin restricción adicional declarada | Valor de subscriber code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `deliveries[].deliveryId` | Sí | `string` | formato `uuid` | Identificador asociado a delivery. | `00000000-0000-4000-8000-000000000001` |
| `deliveries[].jobId` | No | `string` | formato `uuid` | Job encolado si el modo es cola | `00000000-0000-4000-8000-000000000001` |
| `deliveries[].duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si la entrega ya existía y no se duplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MESSAGING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Evento de dominio no encontrado | Excepción explícita en src/modules/messaging/services/outbox.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El evento todavía no está publicado | Excepción explícita en src/modules/messaging/services/outbox.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/events/{domainEventId}/dispatch"
}
```

---

## 3. POST /internal/jobs/{id}/complete

- **Módulo:** `messaging`
- **Etiqueta OpenAPI:** `messaging-internal`
- **Nombre:** Cerrar el trabajo con éxito
- **Operation ID:** `MessagingInternalController_completeJob`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MessagingInternalController.completeJob](../../src/modules/messaging/controllers/messaging-internal.controller.ts)

### Descripción de negocio

Sólo lo cierra el worker que lo tiene reservado.


### Descripción del sistema

NestJS resuelve `POST /internal/jobs/{id}/complete` en `MessagingInternalController_completeJob`. El controlador delega en `QueuesService.completeJob`. Valida el body como `CompleteJobDto` y consume `application/json`. El tipo de retorno estático es `Promise<JobResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CompleteJobDto`; los campos opcionales se omiten.

```http
POST /internal/jobs/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "workerId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MESSAGING_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `workerId` | Sí | `string` | longitud máxima 200 | Worker que lo tiene reservado | `00000000-0000-4000-8000-000000000001` |
| `resultJson` | No | `object` | Sin restricción adicional declarada | Resultado del handler | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/jobs/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "workerId": "00000000-0000-4000-8000-000000000001",
  "resultJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `JobResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si ya había un job con esa clave y se devuelve el mismo | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MESSAGING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Trabajo no encontrado | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El trabajo no está en ejecución | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 422 | `PRECONDITION_FAILED` | El trabajo está reservado por otro worker | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/jobs/{id}/complete"
}
```

---

## 4. POST /internal/jobs/{id}/fail

- **Módulo:** `messaging`
- **Etiqueta OpenAPI:** `messaging-internal`
- **Nombre:** Registrar el fallo del trabajo
- **Operation ID:** `MessagingInternalController_failJob`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MessagingInternalController.failJob](../../src/modules/messaging/controllers/messaging-internal.controller.ts)

### Descripción de negocio

Reintenta con backoff exponencial, o va a cola muerta si agotó los intentos.


### Descripción del sistema

NestJS resuelve `POST /internal/jobs/{id}/fail` en `MessagingInternalController_failJob`. El controlador delega en `QueuesService.failJob`. Valida el body como `FailJobDto` y consume `application/json`. El tipo de retorno estático es `Promise<FailJobResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `FailJobDto`; los campos opcionales se omiten.

```http
POST /internal/jobs/00000000-0000-4000-8000-000000000001/fail HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "workerId": "00000000-0000-4000-8000-000000000001",
  "errorText": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MESSAGING_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `workerId` | Sí | `string` | longitud máxima 200 | Worker que lo tiene reservado | `00000000-0000-4000-8000-000000000001` |
| `errorText` | Sí | `string` | Sin restricción adicional declarada | Qué falló | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/jobs/00000000-0000-4000-8000-000000000001/fail HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "workerId": "00000000-0000-4000-8000-000000000001",
  "errorText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<FailJobResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FailJobResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FailJobResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FailJobResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<FailJobResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FailJobResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FailJobResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FailJobResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FailJobResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FailJobResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FailJobResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "attempts": 1,
  "availableAt": "2026-07-31T12:00:00.000Z",
  "deadLetterJobId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `attempts` | Sí | `number` | Sin restricción adicional declarada | Valor de attempts mantenido por la instancia. | `1` |
| `availableAt` | No | `string` | formato `date-time` | Cuándo se reintenta; ausente si agotó los intentos | `2026-07-31T12:00:00.000Z` |
| `deadLetterJobId` | No | `string` | formato `uuid` | Entrada de cola muerta si agotó | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MESSAGING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Trabajo no encontrado | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El trabajo no está en ejecución | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 422 | `PRECONDITION_FAILED` | El trabajo está reservado por otro worker | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/jobs/{id}/fail"
}
```

---

## 5. POST /internal/notifications/{requestId}/deliver

- **Módulo:** `messaging`
- **Etiqueta OpenAPI:** `messaging-internal`
- **Nombre:** Registrar el intento de entrega ante el proveedor
- **Operation ID:** `MessagingInternalController_deliverNotification`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MessagingInternalController.deliverNotification](../../src/modules/messaging/controllers/messaging-internal.controller.ts)

### Descripción de negocio

La llamada al proveedor la hace el worker fuera de esta transacción.


### Descripción del sistema

NestJS resuelve `POST /internal/notifications/{requestId}/deliver` en `MessagingInternalController_deliverNotification`. El controlador delega en `NotificationsService.deliverNotification`. Valida el body como `DeliverNotificationDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeliverNotificationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `requestId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DeliverNotificationDto`; los campos opcionales se omiten.

```http
POST /internal/notifications/00000000-0000-4000-8000-000000000001/deliver HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "outcome": "SENT"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MESSAGING_ADMIN`.
- Deben ser UUID válidos: `requestId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `outcome` | Sí | `string` | valores: `SENT`, `FAILED` | Qué respondió el proveedor | `SENT` |
| `providerChannelConfigId` | No | `string` | formato `uuid` | Configuración de proveedor usada | `00000000-0000-4000-8000-000000000001` |
| `providerMessageRef` | No | `string` | longitud máxima 300 | Referencia del mensaje en el proveedor | `valor-ejemplo` |
| `errorCode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `errorText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `costAmount` | No | `string` | Sin restricción adicional declarada | Coste del envío, como cadena decimal | `valor-ejemplo` |
| `currencyConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `subject` | No | `string` | longitud máxima 300 | Asunto del mensaje in-app | `valor-ejemplo` |
| `bodyText` | No | `string` | Sin restricción adicional declarada | Cuerpo del mensaje in-app | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/notifications/00000000-0000-4000-8000-000000000001/deliver HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "outcome": "SENT",
  "providerChannelConfigId": "00000000-0000-4000-8000-000000000001",
  "providerMessageRef": "valor-ejemplo",
  "errorCode": "CODIGO_EJEMPLO",
  "errorText": "valor-ejemplo",
  "costAmount": "valor-ejemplo",
  "currencyConceptId": "00000000-0000-4000-8000-000000000001",
  "subject": "valor-ejemplo",
  "bodyText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DeliverNotificationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeliverNotificationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeliverNotificationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeliverNotificationResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DeliverNotificationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeliverNotificationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeliverNotificationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeliverNotificationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeliverNotificationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeliverNotificationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeliverNotificationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "deliveryId": "00000000-0000-4000-8000-000000000001",
  "attemptNumber": 1,
  "deliveryStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "requestStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "inAppNotificationId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `deliveryId` | Sí | `string` | formato `uuid` | Intento registrado | `00000000-0000-4000-8000-000000000001` |
| `attemptNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de attempt number mantenido por la instancia. | `1` |
| `deliveryStatusConceptId` | Sí | `string` | formato `uuid` | Estado del intento | `00000000-0000-4000-8000-000000000001` |
| `requestStatusConceptId` | Sí | `string` | formato `uuid` | Estado en el que queda la solicitud | `00000000-0000-4000-8000-000000000001` |
| `inAppNotificationId` | No | `string` | formato `uuid` | Notificación in-app creada | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si ese intento ya estaba registrado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MESSAGING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud de notificación no encontrada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La notificación está suprimida | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La notificación ya no admite intentos | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal no tiene configuración de proveedor activa | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | Una notificación in-app necesita destinatario interno | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/notifications/{requestId}/deliver"
}
```

---

## 6. GET /internal/notifications/pending

- **Módulo:** `messaging`
- **Etiqueta OpenAPI:** `messaging-internal`
- **Nombre:** Listar solicitudes de notificación listas para entregar
- **Operation ID:** `MessagingInternalController_listPendingNotifications`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MessagingInternalController.listPendingNotifications](../../src/modules/messaging/controllers/messaging-internal.controller.ts)

### Descripción de negocio

Listar solicitudes de notificación listas para entregar. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Descubrimiento para el worker de notificaciones (Fase 1 del plan de corrección de workers): sin esto, `deliverNotification` no tenía forma de saber qué `requestId` llamar. No es uno de los 13 UC del módulo — es infraestructura de lectura que el propio "Pendiente" del README exigía.

### Descripción del sistema

NestJS resuelve `GET /internal/notifications/pending` en `MessagingInternalController_listPendingNotifications`. El controlador delega en `NotificationsService.listDeliverable`. No recibe body. El tipo de retorno estático es `Promise<PendingNotificationsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /internal/notifications/pending?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MESSAGING_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /internal/notifications/pending?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PendingNotificationsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PendingNotificationsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PendingNotificationsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PendingNotificationsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PendingNotificationsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PendingNotificationsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PendingNotificationsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "requests": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "channelId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "payloadJson": {
        "clave": "valor"
      },
      "recipientAddress": "valor-ejemplo",
      "recipientUserId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `requests` | Sí | `array<PendingNotificationRequestDto>` | Sin restricción adicional declarada | Valor de requests mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","channelId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","payloadJson":{"clave":"valor"},"recipientAddress":"valor-ejemplo","recipientUserId":"00000000-0000-4000-8000-000000000001"}]` |
| `requests[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `requests[].channelId` | Sí | `string` | formato `uuid` | Identificador asociado a channel. | `00000000-0000-4000-8000-000000000001` |
| `requests[].statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `requests[].payloadJson` | No | `object` | Sin restricción adicional declarada | Carga de la solicitud | `{"clave":"valor"}` |
| `requests[].recipientAddress` | No | `string` | Sin restricción adicional declarada | Valor de recipient address mantenido por la instancia. | `valor-ejemplo` |
| `requests[].recipientUserId` | No | `string` | formato `uuid` | Identificador asociado a recipient user. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MESSAGING_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/notifications/pending"
}
```

---

## 7. POST /internal/outbox/relay/run

- **Módulo:** `messaging`
- **Etiqueta OpenAPI:** `messaging-internal`
- **Nombre:** Reclamar y publicar un lote del outbox
- **Operation ID:** `MessagingInternalController_runRelay`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MessagingInternalController.runRelay](../../src/modules/messaging/controllers/messaging-internal.controller.ts)

### Descripción de negocio

`SKIP LOCKED`: varios relays corren a la vez sin estorbarse.


### Descripción del sistema

NestJS resuelve `POST /internal/outbox/relay/run` en `MessagingInternalController_runRelay`. El controlador delega en `OutboxService.runRelay`. Valida el body como `RunOutboxRelayDto` y consume `application/json`. El tipo de retorno estático es `Promise<OutboxRelayResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunOutboxRelayDto`; los campos opcionales se omiten.

```http
POST /internal/outbox/relay/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "workerId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MESSAGING_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `workerId` | Sí | `string` | longitud máxima 200 | Identificador del worker que reclama el lote | `00000000-0000-4000-8000-000000000001` |
| `batchSize` | No | `number` | mínimo 1; máximo 500 | Tamaño del lote | `50` |
| `visibilityTimeoutSeconds` | No | `number` | mínimo 5 | Segundos que el lote queda reservado para este worker | `60` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/outbox/relay/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "workerId": "00000000-0000-4000-8000-000000000001",
  "batchSize": 50,
  "visibilityTimeoutSeconds": 60
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OutboxRelayResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OutboxRelayResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OutboxRelayResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OutboxRelayResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OutboxRelayResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OutboxRelayResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OutboxRelayResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OutboxRelayResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OutboxRelayResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OutboxRelayResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "claimed": 1,
  "published": 1,
  "exhausted": 1,
  "messages": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "domainEventId": "00000000-0000-4000-8000-000000000001",
      "idempotencyKey": "valor-ejemplo",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "attempts": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `claimed` | Sí | `number` | Sin restricción adicional declarada | Mensajes reclamados en este lote | `1` |
| `published` | Sí | `number` | Sin restricción adicional declarada | Mensajes que pasaron a publicados | `1` |
| `exhausted` | Sí | `number` | Sin restricción adicional declarada | Mensajes que agotaron sus intentos | `1` |
| `messages` | Sí | `array<RelayedMessageDto>` | Sin restricción adicional declarada | Valor de messages mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","domainEventId":"00000000-0000-4000-8000-000000000001","idempotencyKey":"valor-ejemplo","statusConceptId":"00000000-0000-4000-8000-000000000001","attempts":1}]` |
| `messages[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `messages[].domainEventId` | Sí | `string` | formato `uuid` | Identificador asociado a domain event. | `00000000-0000-4000-8000-000000000001` |
| `messages[].idempotencyKey` | Sí | `string` | Sin restricción adicional declarada | Valor de idempotency key mantenido por la instancia. | `valor-ejemplo` |
| `messages[].statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `messages[].attempts` | Sí | `number` | Sin restricción adicional declarada | Valor de attempts mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MESSAGING_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/internal/outbox/relay/run"
}
```

---

## 8. POST /internal/queues/{code}/claim

- **Módulo:** `messaging`
- **Etiqueta OpenAPI:** `messaging-internal`
- **Nombre:** Reclamar un lote de trabajos de la cola
- **Operation ID:** `MessagingInternalController_claimJobs`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MessagingInternalController.claimJobs](../../src/modules/messaging/controllers/messaging-internal.controller.ts)

### Descripción de negocio

El tiempo de visibilidad devuelve a la rueda lo de un worker caído.


### Descripción del sistema

NestJS resuelve `POST /internal/queues/{code}/claim` en `MessagingInternalController_claimJobs`. El controlador delega en `QueuesService.claimJobs`. Valida el body como `ClaimJobsDto` y consume `application/json`. El tipo de retorno estático es `Promise<ClaimJobsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `code` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ClaimJobsDto`; los campos opcionales se omiten.

```http
POST /internal/queues/CODIGO_EJEMPLO/claim HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "workerId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MESSAGING_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `workerId` | Sí | `string` | longitud máxima 200 | Identificador del worker | `00000000-0000-4000-8000-000000000001` |
| `batchSize` | No | `number` | mínimo 1 | Cuántos jobs reclamar | `10` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/queues/CODIGO_EJEMPLO/claim HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "workerId": "00000000-0000-4000-8000-000000000001",
  "batchSize": 10
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ClaimJobsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ClaimJobsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ClaimJobsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ClaimJobsResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ClaimJobsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ClaimJobsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ClaimJobsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ClaimJobsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ClaimJobsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ClaimJobsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ClaimJobsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "queueId": "00000000-0000-4000-8000-000000000001",
  "jobs": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "jobType": "valor-ejemplo",
      "payloadJson": {
        "clave": "valor"
      },
      "attempts": 1,
      "lockExpiresAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "claimed": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `queueId` | Sí | `string` | formato `uuid` | Identificador asociado a queue. | `00000000-0000-4000-8000-000000000001` |
| `jobs` | Sí | `array<ClaimedJobDto>` | Sin restricción adicional declarada | Valor de jobs mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","jobType":"valor-ejemplo","payloadJson":{"clave":"valor"},"attempts":1,"lockExpiresAt":"2026-07-31T12:00:00.000Z"}]` |
| `jobs[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `jobs[].jobType` | Sí | `string` | Sin restricción adicional declarada | Valor de job type mantenido por la instancia. | `valor-ejemplo` |
| `jobs[].payloadJson` | Sí | `object` | Sin restricción adicional declarada | Carga del trabajo | `{"clave":"valor"}` |
| `jobs[].attempts` | Sí | `number` | Sin restricción adicional declarada | Valor de attempts mantenido por la instancia. | `1` |
| `jobs[].lockExpiresAt` | Sí | `string` | formato `date-time` | Hasta cuándo el job es de este worker | `2026-07-31T12:00:00.000Z` |
| `claimed` | Sí | `number` | Sin restricción adicional declarada | Valor de claimed mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MESSAGING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cola no encontrada | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cola no está activa | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/queues/{code}/claim"
}
```

---

## 9. POST /notifications/in-app/{id}/read

- **Módulo:** `messaging`
- **Etiqueta OpenAPI:** `messaging`
- **Nombre:** Marcar una notificación in-app como leída
- **Operation ID:** `MessagingController_markInAppRead`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MessagingController.markInAppRead](../../src/modules/messaging/controllers/messaging.controller.ts)

### Descripción de negocio

Idempotente: se conserva la primera lectura.


### Descripción del sistema

NestJS resuelve `POST /notifications/in-app/{id}/read` en `MessagingController_markInAppRead`. El controlador delega en `NotificationsService.markInAppRead`. No recibe body. El tipo de retorno estático es `Promise<InAppReadResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /notifications/in-app/00000000-0000-4000-8000-000000000001/read HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `USER`, `MESSAGING_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /notifications/in-app/00000000-0000-4000-8000-000000000001/read HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<InAppReadResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<InAppReadResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<InAppReadResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<InAppReadResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<InAppReadResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<InAppReadResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<InAppReadResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<InAppReadResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<InAppReadResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InAppReadResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "readAt": "2026-07-31T12:00:00.000Z",
  "alreadyRead": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `readAt` | Sí | `string` | formato `date-time` | Se conserva la primera lectura | `2026-07-31T12:00:00.000Z` |
| `alreadyRead` | Sí | `boolean` | Sin restricción adicional declarada | true si ya estaba leída | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: USER, MESSAGING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Notificación no encontrada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La notificación es de otro destinatario | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/notifications/in-app/{id}/read"
}
```

---

## 10. POST /notifications/requests

- **Módulo:** `messaging`
- **Etiqueta OpenAPI:** `messaging`
- **Nombre:** Crear una solicitud de notificación
- **Operation ID:** `MessagingController_createNotificationRequest`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MessagingController.createNotificationRequest](../../src/modules/messaging/controllers/messaging.controller.ts)

### Descripción de negocio

Sin consentimiento o sin opt-in queda registrada como suprimida, no se entrega.


### Descripción del sistema

NestJS resuelve `POST /notifications/requests` en `MessagingController_createNotificationRequest`. El controlador delega en `NotificationsService.createRequest`. Valida el body como `CreateNotificationRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<NotificationRequestResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateNotificationRequestDto`; los campos opcionales se omiten.

```http
POST /notifications/requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "channelId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MESSAGING_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `channelId` | Sí | `string` | formato `uuid` | Canal por el que se notifica | `00000000-0000-4000-8000-000000000001` |
| `recipientUserId` | No | `string` | formato `uuid` | Destinatario interno | `00000000-0000-4000-8000-000000000001` |
| `recipientAddress` | No | `string` | longitud máxima 300 | Dirección de destino si el canal es externo | `valor-ejemplo` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `templateId` | No | `string` | formato `uuid` | Plantilla publicada a usar | `00000000-0000-4000-8000-000000000001` |
| `domainEventId` | No | `string` | formato `uuid` | Evento de dominio que la origina | `00000000-0000-4000-8000-000000000001` |
| `payloadJson` | No | `object` | Sin restricción adicional declarada | Variables de la plantilla. PHI mínima. | `{}` |
| `debounceKey` | No | `string` | longitud máxima 300 | Clave de rebote; colapsa notificaciones repetidas | `valor-ejemplo` |
| `priority` | No | `number` | mínimo 0 | Menor gana | `5` |
| `categoryConceptId` | No | `string` | formato `uuid` | Categoría (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `consentId` | No | `string` | formato `uuid` | Consentimiento vigente que la autoriza | `00000000-0000-4000-8000-000000000001` |
| `scheduledAt` | No | `string` | formato `date-time` | Cuándo debe salir | `2026-07-31T12:00:00.000Z` |
| `relatedResourceType` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `relatedResourceId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /notifications/requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "channelId": "00000000-0000-4000-8000-000000000001",
  "recipientUserId": "00000000-0000-4000-8000-000000000001",
  "recipientAddress": "valor-ejemplo",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "templateId": "00000000-0000-4000-8000-000000000001",
  "domainEventId": "00000000-0000-4000-8000-000000000001",
  "payloadJson": {},
  "debounceKey": "valor-ejemplo",
  "priority": 5,
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "consentId": "00000000-0000-4000-8000-000000000001",
  "scheduledAt": "2026-07-31T12:00:00.000Z",
  "relatedResourceType": "valor-ejemplo",
  "relatedResourceId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<NotificationRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<NotificationRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<NotificationRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<NotificationRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<NotificationRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<NotificationRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<NotificationRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<NotificationRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<NotificationRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `NotificationRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "suppressed": true,
  "suppressionReason": "Texto descriptivo de ejemplo",
  "debounced": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `suppressed` | Sí | `boolean` | Sin restricción adicional declarada | true si quedó suprimida por consentimiento o preferencia | `true` |
| `suppressionReason` | No | `string` | Sin restricción adicional declarada | Por qué se suprimió | `Texto descriptivo de ejemplo` |
| `debounced` | Sí | `boolean` | Sin restricción adicional declarada | true si otra solicitud viva tenía la misma clave de rebote | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MESSAGING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Canal no encontrado | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La notificación necesita destinatario interno o dirección de destino | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal no está activo | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla no está publicada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla es de otro canal | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/notifications/requests"
}
```

---

## 11. POST /queues/{code}/jobs

- **Módulo:** `messaging`
- **Etiqueta OpenAPI:** `messaging`
- **Nombre:** Encolar un trabajo
- **Operation ID:** `MessagingController_enqueueJob`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MessagingController.enqueueJob](../../src/modules/messaging/controllers/messaging.controller.ts)

### Descripción de negocio

La clave de deduplicación colapsa los encolados repetidos del productor.


### Descripción del sistema

NestJS resuelve `POST /queues/{code}/jobs` en `MessagingController_enqueueJob`. El controlador delega en `QueuesService.enqueueJob`. Valida el body como `EnqueueJobDto` y consume `application/json`. El tipo de retorno estático es `Promise<JobResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `code` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EnqueueJobDto`; los campos opcionales se omiten.

```http
POST /queues/CODIGO_EJEMPLO/jobs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "jobType": "valor-ejemplo",
  "dedupeKey": "valor-ejemplo",
  "payloadJson": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `MESSAGING_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `jobType` | Sí | `string` | longitud máxima 200 | Tipo de trabajo que el handler reconoce | `valor-ejemplo` |
| `dedupeKey` | Sí | `string` | longitud máxima 300 | Clave de deduplicación; colapsa los encolados repetidos | `valor-ejemplo` |
| `payloadJson` | Sí | `object` | Sin restricción adicional declarada | Carga del trabajo | `{}` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `priority` | No | `number` | mínimo 0 | Menor gana; por defecto, el de la cola | `1` |
| `maxAttempts` | No | `number` | mínimo 1 | Intentos máximos; por defecto, el de la cola | `1` |
| `availableAt` | No | `string` | formato `date-time` | Cuándo queda disponible | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /queues/CODIGO_EJEMPLO/jobs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "jobType": "valor-ejemplo",
  "dedupeKey": "valor-ejemplo",
  "payloadJson": {},
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "priority": 1,
  "maxAttempts": 1,
  "availableAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<JobResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<JobResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `JobResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si ya había un job con esa clave y se devuelve el mismo | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, MESSAGING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Cola no encontrada | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cola no está activa | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/queues/{code}/jobs"
}
```

---

## 12. POST /queues/dead-letter/{deadLetterJobId}/redrive

- **Módulo:** `messaging`
- **Etiqueta OpenAPI:** `messaging`
- **Nombre:** Reencolar un trabajo desde la cola muerta
- **Operation ID:** `MessagingController_redriveDeadLetter`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MessagingController.redriveDeadLetter](../../src/modules/messaging/controllers/messaging.controller.ts)

### Descripción de negocio

La entrada de cola muerta se conserva: es la evidencia del fallo.


### Descripción del sistema

NestJS resuelve `POST /queues/dead-letter/{deadLetterJobId}/redrive` en `MessagingController_redriveDeadLetter`. El controlador delega en `QueuesService.redriveDeadLetter`. Valida el body como `RedriveDeadLetterDto` y consume `application/json`. El tipo de retorno estático es `Promise<RedriveResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `deadLetterJobId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RedriveDeadLetterDto`; los campos opcionales se omiten.

```http
POST /queues/dead-letter/00000000-0000-4000-8000-000000000001/redrive HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MESSAGING_ADMIN`.
- Deben ser UUID válidos: `deadLetterJobId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | Sin restricción adicional declarada | Por qué se reencola: qué se corrigió | `Texto descriptivo de ejemplo` |
| `dedupeKey` | No | `string` | longitud máxima 300 | Clave de deduplicación del job nuevo; por defecto se deriva del original | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /queues/dead-letter/00000000-0000-4000-8000-000000000001/redrive HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo",
  "dedupeKey": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RedriveResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RedriveResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RedriveResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RedriveResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RedriveResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RedriveResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RedriveResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RedriveResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RedriveResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RedriveResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RedriveResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "jobId": "00000000-0000-4000-8000-000000000001",
  "deadLetterJobId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `jobId` | Sí | `string` | formato `uuid` | Job nuevo encolado | `00000000-0000-4000-8000-000000000001` |
| `deadLetterJobId` | Sí | `string` | formato `uuid` | Identificador asociado a dead letter job. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si ese DLQ ya se había reencolado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MESSAGING_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Entrada de cola muerta no encontrada | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 404 | `NOT_FOUND` | Cola de destino no encontrada | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cola de destino no está activa | Excepción explícita en src/modules/messaging/services/queues.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/queues/dead-letter/{deadLetterJobId}/redrive"
}
```

---

## 13. POST /webhooks/providers/{providerCode}/receipts

- **Módulo:** `messaging`
- **Etiqueta OpenAPI:** `messaging-webhooks`
- **Nombre:** Conciliar el acuse de entrega que envía el proveedor
- **Operation ID:** `ProviderWebhooksController_recordReceipt`
- **Autenticación:** Pública
- **Implementación:** [ProviderWebhooksController.recordReceipt](../../src/modules/messaging/controllers/provider-webhooks.controller.ts)

### Descripción de negocio

Idempotente por entrega y tipo de acuse: los proveedores reentregan.


### Descripción del sistema

NestJS resuelve `POST /webhooks/providers/{providerCode}/receipts` en `ProviderWebhooksController_recordReceipt`. El controlador delega en `NotificationsService.recordProviderReceipt`. Valida el body como `ProviderReceiptDto` y consume `application/json`. El tipo de retorno estático es `Promise<ProviderReceiptResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `providerCode` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ProviderReceiptDto`; los campos opcionales se omiten.

```http
POST /webhooks/providers/CODIGO_EJEMPLO/receipts HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "providerMessageRef": "valor-ejemplo",
  "receiptType": "DELIVERED"
}
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `providerMessageRef` | Sí | `string` | longitud máxima 300 | Referencia del mensaje en el proveedor | `valor-ejemplo` |
| `receiptType` | Sí | `string` | valores: `DELIVERED`, `BOUNCED`, `READ` | Sin descripción específica en el contrato OpenAPI. | `DELIVERED` |
| `providerStatus` | No | `string` | longitud máxima 200 | Estado tal como lo nombra el proveedor | `valor-ejemplo` |
| `rawPayloadJson` | No | `object` | Sin restricción adicional declarada | Cuerpo original del webhook | `{}` |
| `signature` | No | `string` | longitud máxima 512 | Firma HMAC-SHA256 (hex) del cuerpo original bajo el secreto del proveedor | `valor-ejemplo` |
| `occurredAt` | No | `string` | formato `date-time` | Cuándo ocurrió según el proveedor | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /webhooks/providers/CODIGO_EJEMPLO/receipts HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "providerMessageRef": "valor-ejemplo",
  "receiptType": "DELIVERED",
  "providerStatus": "valor-ejemplo",
  "rawPayloadJson": {},
  "signature": "valor-ejemplo",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ProviderReceiptResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ProviderReceiptResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ProviderReceiptResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ProviderReceiptResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ProviderReceiptResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ProviderReceiptResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ProviderReceiptResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ProviderReceiptResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProviderReceiptResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "receiptId": "00000000-0000-4000-8000-000000000001",
  "deliveryId": "00000000-0000-4000-8000-000000000001",
  "deliveryStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "requestStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `receiptId` | Sí | `string` | formato `uuid` | Identificador asociado a receipt. | `00000000-0000-4000-8000-000000000001` |
| `deliveryId` | Sí | `string` | formato `uuid` | Identificador asociado a delivery. | `00000000-0000-4000-8000-000000000001` |
| `deliveryStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a delivery status concept. | `00000000-0000-4000-8000-000000000001` |
| `requestStatusConceptId` | Sí | `string` | formato `uuid` | Estado en el que queda la solicitud | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si el mismo acuse ya se había procesado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | Firma del acuse del proveedor inválida | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 404 | `NOT_FOUND` | No hay entrega con esa referencia de mensaje | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
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
  "path": "/webhooks/providers/{providerCode}/receipts"
}
```

---

