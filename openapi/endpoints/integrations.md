<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `integrations`

Referencia exhaustiva de 15 operación(es) del módulo `integrations`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `integrations-connections`, `integrations-messages`, `integrations-providers`, `integrations-webhooks`
- **Controladores:** `IntegrationsConnectionsController`, `IntegrationsMessagesController`, `IntegrationsProvidersController`, `IntegrationsWebhooksController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /integrations/connections/{id}:pause](#1-post-integrations-connections-id-pause) — Pausar una conexión en fallo (circuit breaker)
2. [POST /integrations/connections/{id}/credentials:rotate](#2-post-integrations-connections-id-credentials-rotate) — Rotar/expirar la credencial de una conexión
3. [POST /integrations/messages:outbound](#3-post-integrations-messages-outbound) — Encolar un mensaje saliente (idempotente)
4. [POST /integrations/messages/{id}:correlate](#4-post-integrations-messages-id-correlate) — Procesar callback/respuesta asíncrona del proveedor
5. [POST /integrations/messages/{id}:dead-letter](#5-post-integrations-messages-id-dead-letter) — Enviar a dead-letter tras agotar reintentos
6. [POST /integrations/messages/{id}:dispatch](#6-post-integrations-messages-id-dispatch) — Despachar un mensaje y registrar su respuesta
7. [POST /integrations/messages/{id}:retry](#7-post-integrations-messages-id-retry) — Programar un reintento con backoff exponencial
8. [GET /integrations/messages/pending-correlation](#8-get-integrations-messages-pending-correlation) — Listar mensajes entrantes RECEIVED listos para correlacionar
9. [GET /integrations/messages/pending-dispatch](#9-get-integrations-messages-pending-dispatch) — Listar mensajes QUEUED listos para despachar
10. [GET /integrations/messages/pending-retry](#10-get-integrations-messages-pending-retry) — Listar mensajes FAILED candidatos a reintento o dead-letter
11. [POST /integrations/providers](#11-post-integrations-providers) — Registrar un proveedor externo
12. [POST /integrations/providers/{id}/connections](#12-post-integrations-providers-id-connections) — Aprovisionar una conexión de tenant y su credencial
13. [POST /integrations/providers/{id}/endpoints](#13-post-integrations-providers-id-endpoints) — Publicar un endpoint versionado y su mapeo de campos
14. [POST /integrations/providers/{id}/webhook-subscriptions](#14-post-integrations-providers-id-webhook-subscriptions) — Gestionar (crear/actualizar) una suscripción de webhook
15. [POST /integrations/webhooks/inbound](#15-post-integrations-webhooks-inbound) — Recibir un mensaje entrante (idempotencia por firma)

---

## 1. POST /integrations/connections/{id}:pause

- **Módulo:** `integrations`
- **Etiqueta OpenAPI:** `integrations-connections`
- **Nombre:** Pausar una conexión en fallo (circuit breaker)
- **Operation ID:** `IntegrationsConnectionsController_pauseConnection`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationsConnectionsController.pauseConnection](../../src/modules/integrations/controllers/integrations-connections.controller.ts)

### Descripción de negocio

Pausar una conexión en fallo (circuit breaker). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integrations/connections/{id}:pause` en `IntegrationsConnectionsController_pauseConnection`. El controlador delega en `IntegrationsConnectionsService.pauseConnection`. No recibe body. El tipo de retorno estático es `Promise<PauseConnectionResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /integrations/connections/00000000-0000-4000-8000-000000000001:pause HTTP/1.1
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
POST /integrations/connections/00000000-0000-4000-8000-000000000001:pause HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PauseConnectionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PauseConnectionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PauseConnectionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PauseConnectionResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PauseConnectionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PauseConnectionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PauseConnectionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PauseConnectionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PauseConnectionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PauseConnectionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "connectionId": "00000000-0000-4000-8000-000000000001",
  "state": "00000000-0000-4000-8000-000000000001",
  "heldMessages": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `connectionId` | Sí | `string` | formato `uuid` | Identificador asociado a connection. | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | formato `uuid` | Concept id del estado resultante | `00000000-0000-4000-8000-000000000001` |
| `heldMessages` | Sí | `number` | Sin restricción adicional declarada | Nº de mensajes QUEUED retenidos (HELD) | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Conexión no encontrada | Excepción explícita en src/modules/integrations/services/integrations-connections.service.ts |
| 422 | `PRECONDITION_FAILED` | La conexión no está activa | Excepción explícita en src/modules/integrations/services/integrations-connections.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integrations/connections/{id}:pause"
}
```

---

## 2. POST /integrations/connections/{id}/credentials:rotate

- **Módulo:** `integrations`
- **Etiqueta OpenAPI:** `integrations-connections`
- **Nombre:** Rotar/expirar la credencial de una conexión
- **Operation ID:** `IntegrationsConnectionsController_rotateCredential`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationsConnectionsController.rotateCredential](../../src/modules/integrations/controllers/integrations-connections.controller.ts)

### Descripción de negocio

Rotar/expirar la credencial de una conexión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integrations/connections/{id}/credentials:rotate` en `IntegrationsConnectionsController_rotateCredential`. El controlador delega en `IntegrationsConnectionsService.rotateCredential`. Valida el body como `IntegrationsRotateCredentialDto` y consume `application/json`. El tipo de retorno estático es `Promise<CredentialRotationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IntegrationsRotateCredentialDto`; los campos opcionales se omiten.

```http
POST /integrations/connections/00000000-0000-4000-8000-000000000001/credentials:rotate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "secretRef": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `secretRef` | Sí | `string` | Sin restricción adicional declarada | Referencia al nuevo secreto en la bóveda externa | `valor-ejemplo` |
| `secretType` | No | `string` | valores: `API_KEY`, `OAUTH_TOKEN`, `HMAC` | Tipo del nuevo secreto (por defecto el de la credencial previa) | `API_KEY` |
| `expiresAt` | No | `string` | formato `date-time` | Expiración del nuevo secreto | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integrations/connections/00000000-0000-4000-8000-000000000001/credentials:rotate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "secretRef": "valor-ejemplo",
  "secretType": "API_KEY",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CredentialRotationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CredentialRotationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CredentialRotationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CredentialRotationResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CredentialRotationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CredentialRotationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CredentialRotationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CredentialRotationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CredentialRotationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CredentialRotationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CredentialRotationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "connectionId": "00000000-0000-4000-8000-000000000001",
  "credentialId": "00000000-0000-4000-8000-000000000001",
  "rotatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `connectionId` | Sí | `string` | formato `uuid` | Identificador asociado a connection. | `00000000-0000-4000-8000-000000000001` |
| `credentialId` | Sí | `string` | formato `uuid` | Identificador asociado a credential. | `00000000-0000-4000-8000-000000000001` |
| `rotatedAt` | Sí | `string` | formato `date-time` | Valor de rotated at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Conexión no encontrada | Excepción explícita en src/modules/integrations/services/integrations-connections.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La conexión no está activa | Excepción explícita en src/modules/integrations/services/integrations-connections.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integrations/connections/{id}/credentials:rotate"
}
```

---

## 3. POST /integrations/messages:outbound

- **Módulo:** `integrations`
- **Etiqueta OpenAPI:** `integrations-messages`
- **Nombre:** Encolar un mensaje saliente (idempotente)
- **Operation ID:** `IntegrationsMessagesController_enqueueOutbound`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationsMessagesController.enqueueOutbound](../../src/modules/integrations/controllers/integrations-messages.controller.ts)

### Descripción de negocio

Encolar un mensaje saliente (idempotente). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-12-05. Productor de negocio (usuario autenticado).

### Descripción del sistema

NestJS resuelve `POST /integrations/messages:outbound` en `IntegrationsMessagesController_enqueueOutbound`. El controlador delega en `IntegrationsMessagingService.enqueueOutbound`. Valida el body como `EnqueueOutboundDto` y consume `application/json`. El tipo de retorno estático es `Promise<OutboundMessageResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EnqueueOutboundDto`; los campos opcionales se omiten.

```http
POST /integrations/messages:outbound HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "connectionId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo",
  "requestPayloadJson": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `connectionId` | Sí | `string` | formato `uuid` | Conexión (ACTIVE) por la que se enviará | `00000000-0000-4000-8000-000000000001` |
| `endpointId` | No | `string` | formato `uuid` | Endpoint de integración a invocar | `00000000-0000-4000-8000-000000000001` |
| `idempotencyKey` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Clave de idempotencia provista por el productor | `valor-ejemplo` |
| `correlationId` | No | `string` | longitud máxima 200 | Correlación (por defecto la idempotency_key) | `00000000-0000-4000-8000-000000000001` |
| `requestPayloadJson` | Sí | `object` | Sin restricción adicional declarada | Payload de la petición saliente | `{}` |
| `headersJson` | No | `object` | Sin restricción adicional declarada | Cabeceras a enviar | `{}` |
| `sourceResourceType` | No | `string` | longitud máxima 100 | Tipo de recurso de negocio origen (polimórfico) | `valor-ejemplo` |
| `sourceResourceId` | No | `string` | formato `uuid` | Id del recurso de negocio origen | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integrations/messages:outbound HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "connectionId": "00000000-0000-4000-8000-000000000001",
  "endpointId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo",
  "correlationId": "00000000-0000-4000-8000-000000000001",
  "requestPayloadJson": {},
  "headersJson": {},
  "sourceResourceType": "valor-ejemplo",
  "sourceResourceId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<OutboundMessageResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OutboundMessageResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OutboundMessageResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OutboundMessageResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OutboundMessageResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OutboundMessageResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OutboundMessageResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OutboundMessageResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OutboundMessageResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OutboundMessageResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "correlationId": "00000000-0000-4000-8000-000000000001",
  "idempotent": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `correlationId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a correlation. | `00000000-0000-4000-8000-000000000001` |
| `idempotent` | Sí | `boolean` | Sin restricción adicional declarada | true si se devolvió una fila preexistente por idempotencia | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Conexión no encontrada | Excepción explícita en src/modules/integrations/services/integrations-messaging.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La conexión no está activa | Excepción explícita en src/modules/integrations/services/integrations-messaging.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integrations/messages:outbound"
}
```

---

## 4. POST /integrations/messages/{id}:correlate

- **Módulo:** `integrations`
- **Etiqueta OpenAPI:** `integrations-messages`
- **Nombre:** Procesar callback/respuesta asíncrona del proveedor
- **Operation ID:** `IntegrationsMessagesController_correlate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationsMessagesController.correlate](../../src/modules/integrations/controllers/integrations-messages.controller.ts)

### Descripción de negocio

Procesar callback/respuesta asíncrona del proveedor. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-12-10. Worker de correlación ({id} = mensaje entrante).

### Descripción del sistema

NestJS resuelve `POST /integrations/messages/{id}:correlate` en `IntegrationsMessagesController_correlate`. El controlador delega en `IntegrationsMessagingService.correlate`. No recibe body. El tipo de retorno estático es `Promise<CorrelateResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /integrations/messages/00000000-0000-4000-8000-000000000001:correlate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /integrations/messages/00000000-0000-4000-8000-000000000001:correlate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CorrelateResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CorrelateResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CorrelateResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CorrelateResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CorrelateResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CorrelateResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CorrelateResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CorrelateResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CorrelateResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CorrelateResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "inboundMessageId": "00000000-0000-4000-8000-000000000001",
  "outboundMessageId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `inboundMessageId` | Sí | `string` | formato `uuid` | Identificador asociado a inbound message. | `00000000-0000-4000-8000-000000000001` |
| `outboundMessageId` | Sí | `string` | formato `uuid` | Identificador asociado a outbound message. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del mensaje entrante | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Mensaje entrante no encontrado | Excepción explícita en src/modules/integrations/services/integrations-messaging.service.ts |
| 404 | `NOT_FOUND` | No hay mensaje saliente correlacionado | Excepción explícita en src/modules/integrations/services/integrations-messaging.service.ts |
| 422 | `PRECONDITION_FAILED` | El mensaje entrante no está en estado recibido | Excepción explícita en src/modules/integrations/services/integrations-messaging.service.ts |
| 422 | `PRECONDITION_FAILED` | El mensaje entrante no tiene correlación | Excepción explícita en src/modules/integrations/services/integrations-messaging.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integrations/messages/{id}:correlate"
}
```

---

## 5. POST /integrations/messages/{id}:dead-letter

- **Módulo:** `integrations`
- **Etiqueta OpenAPI:** `integrations-messages`
- **Nombre:** Enviar a dead-letter tras agotar reintentos
- **Operation ID:** `IntegrationsMessagesController_deadLetter`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationsMessagesController.deadLetter](../../src/modules/integrations/controllers/integrations-messages.controller.ts)

### Descripción de negocio

Enviar a dead-letter tras agotar reintentos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-12-08. Worker de reintentos.

### Descripción del sistema

NestJS resuelve `POST /integrations/messages/{id}:dead-letter` en `IntegrationsMessagesController_deadLetter`. El controlador delega en `IntegrationsMessagingService.deadLetter`. No recibe body. El tipo de retorno estático es `Promise<DeadLetterResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /integrations/messages/00000000-0000-4000-8000-000000000001:dead-letter HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /integrations/messages/00000000-0000-4000-8000-000000000001:dead-letter HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DeadLetterResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeadLetterResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeadLetterResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeadLetterResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DeadLetterResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeadLetterResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeadLetterResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeadLetterResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeadLetterResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeadLetterResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "messageId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "alreadyDeadLettered": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `messageId` | Sí | `string` | formato `uuid` | Identificador asociado a message. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado resultante | `00000000-0000-4000-8000-000000000001` |
| `alreadyDeadLettered` | Sí | `boolean` | Sin restricción adicional declarada | true si ya estaba en dead-letter (no-op idempotente) | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Mensaje no encontrado | Excepción explícita en src/modules/integrations/services/integrations-messaging.service.ts |
| 422 | `PRECONDITION_FAILED` | El mensaje no está en estado fallido | Excepción explícita en src/modules/integrations/services/integrations-messaging.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integrations/messages/{id}:dead-letter"
}
```

---

## 6. POST /integrations/messages/{id}:dispatch

- **Módulo:** `integrations`
- **Etiqueta OpenAPI:** `integrations-messages`
- **Nombre:** Despachar un mensaje y registrar su respuesta
- **Operation ID:** `IntegrationsMessagesController_dispatch`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationsMessagesController.dispatch](../../src/modules/integrations/controllers/integrations-messages.controller.ts)

### Descripción de negocio

Despachar un mensaje y registrar su respuesta. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-12-06. Worker de envío: el rol `SYSTEM` sólo lo firma `SystemApiClient`.

### Descripción del sistema

NestJS resuelve `POST /integrations/messages/{id}:dispatch` en `IntegrationsMessagesController_dispatch`. El controlador delega en `IntegrationsMessagingService.dispatch`. Valida el body como `DispatchMessageDto` y consume `application/json`. El tipo de retorno estático es `Promise<DispatchResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DispatchMessageDto`; los campos opcionales se omiten.

```http
POST /integrations/messages/00000000-0000-4000-8000-000000000001:dispatch HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

El body no declara campos documentables.

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integrations/messages/00000000-0000-4000-8000-000000000001:dispatch HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DispatchResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DispatchResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DispatchResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DispatchResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DispatchResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DispatchResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DispatchResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DispatchResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DispatchResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DispatchResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DispatchResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "isSuccess": true,
  "responseId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado resultante | `00000000-0000-4000-8000-000000000001` |
| `isSuccess` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is success mantenido por la instancia. | `true` |
| `responseId` | Sí | `string` | formato `uuid` | Identificador asociado a response. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Mensaje no encontrado | Excepción explícita en src/modules/integrations/services/integrations-messaging.service.ts |
| 404 | `NOT_FOUND` | Conexión no encontrada | Excepción explícita en src/modules/integrations/services/integrations-messaging.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El mensaje no está en cola | Excepción explícita en src/modules/integrations/services/integrations-messaging.service.ts |
| 422 | `PRECONDITION_FAILED` | El proveedor no tiene base_url configurada para el despacho | Excepción explícita en src/modules/integrations/services/integrations-messaging.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integrations/messages/{id}:dispatch"
}
```

---

## 7. POST /integrations/messages/{id}:retry

- **Módulo:** `integrations`
- **Etiqueta OpenAPI:** `integrations-messages`
- **Nombre:** Programar un reintento con backoff exponencial
- **Operation ID:** `IntegrationsMessagesController_retry`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationsMessagesController.retry](../../src/modules/integrations/controllers/integrations-messages.controller.ts)

### Descripción de negocio

Programar un reintento con backoff exponencial. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-12-07. Worker de reintentos.

### Descripción del sistema

NestJS resuelve `POST /integrations/messages/{id}:retry` en `IntegrationsMessagesController_retry`. El controlador delega en `IntegrationsMessagingService.retry`. No recibe body. El tipo de retorno estático es `Promise<RetryResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /integrations/messages/00000000-0000-4000-8000-000000000001:retry HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /integrations/messages/00000000-0000-4000-8000-000000000001:retry HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RetryResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RetryResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RetryResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RetryResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RetryResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RetryResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RetryResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RetryResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RetryResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RetryResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "messageId": "00000000-0000-4000-8000-000000000001",
  "attemptNumber": 1,
  "status": "00000000-0000-4000-8000-000000000001",
  "nextRetryAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `messageId` | Sí | `string` | formato `uuid` | Identificador asociado a message. | `00000000-0000-4000-8000-000000000001` |
| `attemptNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de attempt number mantenido por la instancia. | `1` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado resultante del mensaje | `00000000-0000-4000-8000-000000000001` |
| `nextRetryAt` | No | `string` | formato `date-time` | Valor de next retry at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Mensaje no encontrado | Excepción explícita en src/modules/integrations/services/integrations-messaging.service.ts |
| 422 | `PRECONDITION_FAILED` | El mensaje no está en estado fallido | Excepción explícita en src/modules/integrations/services/integrations-messaging.service.ts |
| 422 | `PRECONDITION_FAILED` | Se agotaron los reintentos (usar dead-letter) | Excepción explícita en src/modules/integrations/services/integrations-messaging.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integrations/messages/{id}:retry"
}
```

---

## 8. GET /integrations/messages/pending-correlation

- **Módulo:** `integrations`
- **Etiqueta OpenAPI:** `integrations-messages`
- **Nombre:** Listar mensajes entrantes RECEIVED listos para correlacionar
- **Operation ID:** `IntegrationsMessagesController_listPendingCorrelation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationsMessagesController.listPendingCorrelation](../../src/modules/integrations/controllers/integrations-messages.controller.ts)

### Descripción de negocio

Listar mensajes entrantes RECEIVED listos para correlacionar. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Descubrimiento para el worker de correlación (Fase 5): sin esto, `correlate` no tenía forma de saber qué `inboundMessageId` traer.

### Descripción del sistema

NestJS resuelve `GET /integrations/messages/pending-correlation` en `IntegrationsMessagesController_listPendingCorrelation`. El controlador delega en `IntegrationsMessagingService.listReceivedForCorrelation`. No recibe body. El tipo de retorno estático es `Promise<PendingCorrelationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /integrations/messages/pending-correlation?limit=1 HTTP/1.1
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
GET /integrations/messages/pending-correlation?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PendingCorrelationResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PendingCorrelationResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PendingCorrelationResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PendingCorrelationResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PendingCorrelationResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PendingCorrelationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PendingCorrelationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "messages": [
    {
      "id": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `messages` | Sí | `array<PendingCorrelationItemDto>` | Sin restricción adicional declarada | Valor de messages mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001"}]` |
| `messages[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integrations/messages/pending-correlation"
}
```

---

## 9. GET /integrations/messages/pending-dispatch

- **Módulo:** `integrations`
- **Etiqueta OpenAPI:** `integrations-messages`
- **Nombre:** Listar mensajes QUEUED listos para despachar
- **Operation ID:** `IntegrationsMessagesController_listPendingDispatch`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationsMessagesController.listPendingDispatch](../../src/modules/integrations/controllers/integrations-messages.controller.ts)

### Descripción de negocio

Listar mensajes QUEUED listos para despachar. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Descubrimiento para el worker de despacho (Fase 5 del plan de corrección de workers): sin esto, `dispatch` no tenía forma de saber qué `messageId` despachar.

### Descripción del sistema

NestJS resuelve `GET /integrations/messages/pending-dispatch` en `IntegrationsMessagesController_listPendingDispatch`. El controlador delega en `IntegrationsMessagingService.listQueuedForDispatch`. No recibe body. El tipo de retorno estático es `Promise<PendingDispatchResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /integrations/messages/pending-dispatch?limit=1 HTTP/1.1
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
GET /integrations/messages/pending-dispatch?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PendingDispatchResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PendingDispatchResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PendingDispatchResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PendingDispatchResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PendingDispatchResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PendingDispatchResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PendingDispatchResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "messages": [
    {
      "id": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `messages` | Sí | `array<PendingDispatchItemDto>` | Sin restricción adicional declarada | Valor de messages mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001"}]` |
| `messages[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integrations/messages/pending-dispatch"
}
```

---

## 10. GET /integrations/messages/pending-retry

- **Módulo:** `integrations`
- **Etiqueta OpenAPI:** `integrations-messages`
- **Nombre:** Listar mensajes FAILED candidatos a reintento o dead-letter
- **Operation ID:** `IntegrationsMessagesController_listPendingRetry`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationsMessagesController.listPendingRetry](../../src/modules/integrations/controllers/integrations-messages.controller.ts)

### Descripción de negocio

Listar mensajes FAILED candidatos a reintento o dead-letter. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Descubrimiento para el worker de reintentos (Fase 5): lista los mensajes `FAILED` con si ya agotaron `MAX_ATTEMPTS`, para que el worker decida entre `retry` y `deadLetter`.

### Descripción del sistema

NestJS resuelve `GET /integrations/messages/pending-retry` en `IntegrationsMessagesController_listPendingRetry`. El controlador delega en `IntegrationsMessagingService.listFailedForRetry`. No recibe body. El tipo de retorno estático es `Promise<PendingRetryResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /integrations/messages/pending-retry?limit=1 HTTP/1.1
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
GET /integrations/messages/pending-retry?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PendingRetryResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PendingRetryResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PendingRetryResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PendingRetryResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PendingRetryResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PendingRetryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PendingRetryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "messages": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "nextAttemptNumber": 1,
      "exhausted": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `messages` | Sí | `array<PendingRetryItemDto>` | Sin restricción adicional declarada | Valor de messages mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","nextAttemptNumber":1,"exhausted":true}]` |
| `messages[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `messages[].nextAttemptNumber` | Sí | `number` | Sin restricción adicional declarada | Número que tendría el próximo intento | `1` |
| `messages[].exhausted` | Sí | `boolean` | Sin restricción adicional declarada | true si el próximo intento excede MAX_ATTEMPTS: el worker debe | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integrations/messages/pending-retry"
}
```

---

## 11. POST /integrations/providers

- **Módulo:** `integrations`
- **Etiqueta OpenAPI:** `integrations-providers`
- **Nombre:** Registrar un proveedor externo
- **Operation ID:** `IntegrationsProvidersController_registerProvider`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationsProvidersController.registerProvider](../../src/modules/integrations/controllers/integrations-providers.controller.ts)

### Descripción de negocio

Registrar un proveedor externo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integrations/providers` en `IntegrationsProvidersController_registerProvider`. El controlador delega en `IntegrationsProvidersService.registerProvider`. Valida el body como `RegisterProviderDto` y consume `application/json`. El tipo de retorno estático es `Promise<ProviderResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterProviderDto`; los campos opcionales se omiten.

```http
POST /integrations/providers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "providerType": "LAB"
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
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único global del proveedor | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre legible del proveedor | `Nombre de ejemplo` |
| `providerType` | Sí | `string` | valores: `LAB`, `INSURER`, `GOV`, `GENERIC` | Tipo de proveedor | `LAB` |
| `baseUrl` | No | `string` | formato `uri`; longitud máxima 2048 | URL base de la API del proveedor | `https://example.com/recurso` |
| `authType` | No | `string` | valores: `OAUTH2`, `API_KEY`, `HMAC` | Tipo de autenticación | `OAUTH2` |
| `docUrl` | No | `string` | formato `uri`; longitud máxima 2048 | URL de documentación del proveedor | `https://example.com/recurso` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integrations/providers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "providerType": "LAB",
  "baseUrl": "https://example.com/recurso",
  "authType": "OAUTH2",
  "docUrl": "https://example.com/recurso"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ProviderResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProviderResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "state": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `state` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un proveedor con ese código | Excepción explícita en src/modules/integrations/services/integrations-providers.service.ts |
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
  "path": "/integrations/providers"
}
```

---

## 12. POST /integrations/providers/{id}/connections

- **Módulo:** `integrations`
- **Etiqueta OpenAPI:** `integrations-providers`
- **Nombre:** Aprovisionar una conexión de tenant y su credencial
- **Operation ID:** `IntegrationsProvidersController_provisionConnection`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationsProvidersController.provisionConnection](../../src/modules/integrations/controllers/integrations-providers.controller.ts)

### Descripción de negocio

Aprovisionar una conexión de tenant y su credencial. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integrations/providers/{id}/connections` en `IntegrationsProvidersController_provisionConnection`. El controlador delega en `IntegrationsConnectionsService.provisionConnection`. Valida el body como `ProvisionConnectionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ConnectionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ProvisionConnectionDto`; los campos opcionales se omiten.

```http
POST /integrations/providers/00000000-0000-4000-8000-000000000001/connections HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "secretType": "API_KEY",
  "secretRef": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Tenant propietario de la conexión | `00000000-0000-4000-8000-000000000001` |
| `environment` | No | `string` | valores: `SANDBOX`, `PRODUCTION` | Entorno | `SANDBOX` |
| `configJson` | No | `object` | Sin restricción adicional declarada | Configuración específica de la conexión | `{}` |
| `secretType` | Sí | `string` | valores: `API_KEY`, `OAUTH_TOKEN`, `HMAC` | Tipo del secreto inicial | `API_KEY` |
| `secretRef` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Referencia al secreto en la bóveda externa (no el secreto) | `valor-ejemplo` |
| `expiresAt` | No | `string` | formato `date-time` | Fecha de expiración del secreto | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integrations/providers/00000000-0000-4000-8000-000000000001/connections HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "environment": "SANDBOX",
  "configJson": {},
  "secretType": "API_KEY",
  "secretRef": "valor-ejemplo",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ConnectionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConnectionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "connectionId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `pharmacyId` | Sí | `string` | formato `uuid` | Identificador asociado a pharmacy. | `00000000-0000-4000-8000-000000000001` |
| `connectionId` | Sí | `string` | formato `uuid` | Identificador asociado a connection. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/integrations/services/integrations-connections.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El proveedor no está activo | Excepción explícita en src/modules/integrations/services/integrations-connections.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integrations/providers/{id}/connections"
}
```

---

## 13. POST /integrations/providers/{id}/endpoints

- **Módulo:** `integrations`
- **Etiqueta OpenAPI:** `integrations-providers`
- **Nombre:** Publicar un endpoint versionado y su mapeo de campos
- **Operation ID:** `IntegrationsProvidersController_publishEndpoint`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationsProvidersController.publishEndpoint](../../src/modules/integrations/controllers/integrations-providers.controller.ts)

### Descripción de negocio

Publicar un endpoint versionado y su mapeo de campos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integrations/providers/{id}/endpoints` en `IntegrationsProvidersController_publishEndpoint`. El controlador delega en `IntegrationsProvidersService.publishEndpoint`. Valida el body como `PublishEndpointDto` y consume `application/json`. El tipo de retorno estático es `Promise<EndpointResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishEndpointDto`; los campos opcionales se omiten.

```http
POST /integrations/providers/00000000-0000-4000-8000-000000000001/endpoints HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "operation": "valor-ejemplo",
  "version": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código del endpoint | `CODIGO_EJEMPLO` |
| `operation` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Operación lógica que expone | `valor-ejemplo` |
| `version` | Sí | `string` | longitud mínima 1; longitud máxima 50 | Versión del endpoint (única por proveedor) | `valor-ejemplo` |
| `httpMethod` | No | `string` | valores: `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Método HTTP | `GET` |
| `path` | No | `string` | longitud máxima 2048 | Ruta relativa del endpoint | `valor-ejemplo` |
| `requestSchemaJson` | No | `object` | Sin restricción adicional declarada | Esquema JSON de la petición | `{}` |
| `responseSchemaJson` | No | `object` | Sin restricción adicional declarada | Esquema JSON de la respuesta | `{}` |
| `timeoutMs` | No | `number` | mínimo 1 | Timeout en milisegundos | `1` |
| `mappings` | No | `array<FieldMappingDto>` | Sin restricción adicional declarada | Mapeos de campos publicados en la misma transacción | `[{"sourcePath":"valor-ejemplo","targetField":"valor-ejemplo","conceptMapId":"00000000-0000-4000-8000-000000000001","transformJson":{},"direction":"INBOUND"}]` |
| `mappings[].sourcePath` | No | `string` | longitud mínima 1; longitud máxima 300 | Ruta origen en el payload | `valor-ejemplo` |
| `mappings[].targetField` | No | `string` | longitud mínima 1; longitud máxima 300 | Campo destino en el esquema canónico | `valor-ejemplo` |
| `mappings[].conceptMapId` | No | `string` | formato `uuid` | Concept map aplicable | `00000000-0000-4000-8000-000000000001` |
| `mappings[].transformJson` | No | `object` | Sin restricción adicional declarada | Transformación declarativa | `{}` |
| `mappings[].direction` | No | `string` | valores: `INBOUND`, `OUTBOUND` | Dirección del mapeo | `INBOUND` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integrations/providers/00000000-0000-4000-8000-000000000001/endpoints HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "operation": "valor-ejemplo",
  "version": "valor-ejemplo",
  "httpMethod": "GET",
  "path": "valor-ejemplo",
  "requestSchemaJson": {},
  "responseSchemaJson": {},
  "timeoutMs": 1,
  "mappings": [
    {
      "sourcePath": "valor-ejemplo",
      "targetField": "valor-ejemplo",
      "conceptMapId": "00000000-0000-4000-8000-000000000001",
      "transformJson": {},
      "direction": "INBOUND"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EndpointResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EndpointResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EndpointResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EndpointResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<EndpointResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EndpointResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EndpointResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EndpointResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EndpointResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EndpointResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EndpointResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "providerId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "version": "valor-ejemplo",
  "state": "00000000-0000-4000-8000-000000000001",
  "mappingsCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `providerId` | Sí | `string` | formato `uuid` | Identificador asociado a provider. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `version` | Sí | `string` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `valor-ejemplo` |
| `state` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `mappingsCount` | Sí | `number` | Sin restricción adicional declarada | Nº de mapeos de campos creados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/integrations/services/integrations-providers.service.ts |
| 409 | `CONFLICT` | Ya existe un endpoint con esa versión para el proveedor | Excepción explícita en src/modules/integrations/services/integrations-providers.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El proveedor no está activo | Excepción explícita en src/modules/integrations/services/integrations-providers.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integrations/providers/{id}/endpoints"
}
```

---

## 14. POST /integrations/providers/{id}/webhook-subscriptions

- **Módulo:** `integrations`
- **Etiqueta OpenAPI:** `integrations-providers`
- **Nombre:** Gestionar (crear/actualizar) una suscripción de webhook
- **Operation ID:** `IntegrationsProvidersController_createWebhookSubscription`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IntegrationsProvidersController.createWebhookSubscription](../../src/modules/integrations/controllers/integrations-providers.controller.ts)

### Descripción de negocio

Gestionar (crear/actualizar) una suscripción de webhook. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integrations/providers/{id}/webhook-subscriptions` en `IntegrationsProvidersController_createWebhookSubscription`. El controlador delega en `IntegrationsProvidersService.createWebhookSubscription`. Valida el body como `IntegrationsCreateWebhookSubscriptionDto` y consume `application/json`. El tipo de retorno estático es `Promise<WebhookSubscriptionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IntegrationsCreateWebhookSubscriptionDto`; los campos opcionales se omiten.

```http
POST /integrations/providers/00000000-0000-4000-8000-000000000001/webhook-subscriptions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "eventType": "valor-ejemplo",
  "callbackUrl": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Tenant al que aplica la suscripción | `00000000-0000-4000-8000-000000000001` |
| `eventType` | Sí | `string` | longitud máxima 150 | Tipo de evento suscrito | `valor-ejemplo` |
| `callbackUrl` | Sí | `string` | Sin restricción adicional declarada | URL de callback (HTTPS obligatoria) | `valor-ejemplo` |
| `secretRef` | No | `string` | longitud máxima 200 | Referencia al secreto de verificación de firma | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integrations/providers/00000000-0000-4000-8000-000000000001/webhook-subscriptions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "eventType": "valor-ejemplo",
  "callbackUrl": "valor-ejemplo",
  "secretRef": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<WebhookSubscriptionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WebhookSubscriptionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "providerId": "00000000-0000-4000-8000-000000000001",
  "eventType": "valor-ejemplo",
  "state": "00000000-0000-4000-8000-000000000001",
  "updated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `providerId` | Sí | `string` | formato `uuid` | Identificador asociado a provider. | `00000000-0000-4000-8000-000000000001` |
| `eventType` | Sí | `string` | Sin restricción adicional declarada | Valor de event type mantenido por la instancia. | `valor-ejemplo` |
| `state` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `updated` | Sí | `boolean` | Sin restricción adicional declarada | true si se actualizó una suscripción existente | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/integrations/services/integrations-providers.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El proveedor no está activo | Excepción explícita en src/modules/integrations/services/integrations-providers.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/integrations/providers/{id}/webhook-subscriptions"
}
```

---

## 15. POST /integrations/webhooks/inbound

- **Módulo:** `integrations`
- **Etiqueta OpenAPI:** `integrations-webhooks`
- **Nombre:** Recibir un mensaje entrante (idempotencia por firma)
- **Operation ID:** `IntegrationsWebhooksController_receiveInbound`
- **Autenticación:** Pública
- **Implementación:** [IntegrationsWebhooksController.receiveInbound](../../src/modules/integrations/controllers/integrations-webhooks.controller.ts)

### Descripción de negocio

Recibir un mensaje entrante (idempotencia por firma). Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /integrations/webhooks/inbound` en `IntegrationsWebhooksController_receiveInbound`. El controlador delega en `IntegrationsWebhooksService.receiveInbound`. Valida el body como `InboundWebhookDto` y consume `application/json`. El tipo de retorno estático es `Promise<InboundMessageResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `InboundWebhookDto`; los campos opcionales se omiten.

```http
POST /integrations/webhooks/inbound HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "connectionId": "00000000-0000-4000-8000-000000000001",
  "payloadJson": {}
}
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `connectionId` | Sí | `string` | formato `uuid` | Conexión que identifica al tenant/proveedor | `00000000-0000-4000-8000-000000000001` |
| `endpointId` | No | `string` | formato `uuid` | Endpoint de integración asociado | `00000000-0000-4000-8000-000000000001` |
| `correlationId` | No | `string` | longitud máxima 200 | Correlación para casar con un mensaje saliente | `00000000-0000-4000-8000-000000000001` |
| `payloadJson` | Sí | `object` | Sin restricción adicional declarada | Payload entregado por el proveedor | `{}` |
| `signature` | No | `string` | longitud máxima 512 | Firma HMAC de la entrega (idempotencia) | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /integrations/webhooks/inbound HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "connectionId": "00000000-0000-4000-8000-000000000001",
  "endpointId": "00000000-0000-4000-8000-000000000001",
  "correlationId": "00000000-0000-4000-8000-000000000001",
  "payloadJson": {},
  "signature": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<InboundMessageResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<InboundMessageResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<InboundMessageResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<InboundMessageResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<InboundMessageResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<InboundMessageResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<InboundMessageResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InboundMessageResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si se de-duplicó una reentrega | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | Firma del webhook inválida | Excepción explícita en src/modules/integrations/services/integrations-webhooks.service.ts |
| 404 | `NOT_FOUND` | Conexión no encontrada | Excepción explícita en src/modules/integrations/services/integrations-webhooks.service.ts |
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
  "path": "/integrations/webhooks/inbound"
}
```

---

