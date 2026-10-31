<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `integrations`

- **Bloque:** Integraciones y Contratos (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)
- **Operaciones:** 15 (15 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 2 · MEDIO 10 · BAJO 3
- **Tablas distintas que tocan:** 10
- **Respuestas de error y detalle contractual:** `openapi/endpoints/integrations.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/integrations/connections/{id}:pause` | Pausar una conexión en fallo (circuit breaker) | MEDIO | 3 | SECURITY_ADMIN |
| 2 | POST | `/integrations/connections/{id}/credentials:rotate` | Rotar/expirar la credencial de una conexión | MEDIO | 4 | SECURITY_ADMIN |
| 3 | POST | `/integrations/messages:outbound` | Encolar un mensaje saliente (idempotente) | ALTO | 3 | sesión (sin roles) |
| 4 | POST | `/integrations/messages/{id}:correlate` | Procesar callback/respuesta asíncrona del proveedor | MEDIO | 6 | SYSTEM, SECURITY_ADMIN |
| 5 | POST | `/integrations/messages/{id}:dead-letter` | Enviar a dead-letter tras agotar reintentos | MEDIO | 4 | SYSTEM, SECURITY_ADMIN |
| 6 | POST | `/integrations/messages/{id}:dispatch` | Despachar un mensaje y registrar su respuesta | MEDIO | 7 | SYSTEM, SECURITY_ADMIN |
| 7 | POST | `/integrations/messages/{id}:retry` | Programar un reintento con backoff exponencial | MEDIO | 4 | SYSTEM, SECURITY_ADMIN |
| 8 | GET | `/integrations/messages/pending-correlation` | Listar mensajes entrantes RECEIVED listos para correlacionar | BAJO | 2 | SYSTEM, SECURITY_ADMIN |
| 9 | GET | `/integrations/messages/pending-dispatch` | Listar mensajes QUEUED listos para despachar | BAJO | 2 | SYSTEM, SECURITY_ADMIN |
| 10 | GET | `/integrations/messages/pending-retry` | Listar mensajes FAILED candidatos a reintento o dead-letter | BAJO | 3 | SYSTEM, SECURITY_ADMIN |
| 11 | POST | `/integrations/providers` | Registrar un proveedor externo | MEDIO | 2 | SECURITY_ADMIN |
| 12 | POST | `/integrations/providers/{id}/connections` | Aprovisionar una conexión de tenant y su credencial | MEDIO | 3 | SECURITY_ADMIN |
| 13 | POST | `/integrations/providers/{id}/endpoints` | Publicar un endpoint versionado y su mapeo de campos | MEDIO | 4 | SECURITY_ADMIN |
| 14 | POST | `/integrations/providers/{id}/webhook-subscriptions` | Gestionar (crear/actualizar) una suscripción de webhook | MEDIO | 4 | SECURITY_ADMIN |
| 15 | POST | `/integrations/webhooks/inbound` | Recibir un mensaje entrante (idempotencia por firma) | ALTO | 4 | pública |

---

## 1. POST /integrations/connections/{id}:pause

- **Origen:** CONTRATO
- **Nombre:** Pausar una conexión en fallo (circuit breaker)
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationsConnectionsController.pauseConnection` — `src/modules/integrations/controllers/integrations-connections.controller.ts:62`

### Qué es y para qué sirve (negocio)

Pausar una conexión en fallo (circuit breaker). Dentro del módulo (descripción del modelo, en inglés): «The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_12_integrations.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integrations/connections/{id}:pause` la atiende `IntegrationsConnectionsController.pauseConnection` (src/modules/integrations/controllers/integrations-connections.controller.ts:62). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IntegrationsConnectionsService.pauseConnection`. Actualiza integrations.outbound_messages. Lee integrations.outbound_messages, integrations.provider_connections.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integrations/controllers/integrations-connections.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/integrations/controllers/integrations-connections.controller.ts:62` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integrations.outbound_messages` | ESCRIBE | ACTUALIZA | POR_TIPO | IntegrationsConnectionsController.pauseConnection → IntegrationsConnectionsService.pauseConnection → OutboundMessagesRepository.holdQueuedForConnection | `src/modules/integrations/repositories/outbound-messages.repository.ts:160` |
| `integrations.outbound_messages` | LEE | LEE | DIRECTA | IntegrationsConnectionsController.pauseConnection → IntegrationsConnectionsService.pauseConnection → OutboundMessagesRepository.holdQueuedForConnection | `src/modules/integrations/repositories/outbound-messages.repository.ts:155` |
| `integrations.provider_connections` | LEE | LEE | DIRECTA | IntegrationsConnectionsController.pauseConnection → IntegrationsConnectionsService.pauseConnection → ProviderConnectionsRepository.findByIdInScope | `src/modules/integrations/repositories/provider-connections.repository.ts:72` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PauseConnectionResultDto>` · DTO `PauseConnectionResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `connectionId` | `string` | Sí | formato uuid | — | Identificador asociado a connection. | `src/modules/integrations/dto/responses.dto.ts:342` |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado resultante | `src/modules/integrations/dto/responses.dto.ts:350` |
| `heldMessages` | `number` | Sí | — | — | Nº de mensajes QUEUED retenidos (HELD) | `src/modules/integrations/dto/responses.dto.ts:355` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La conexión no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integrations.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integrations/controllers/integrations-connections.controller.spec.ts:43` |

### Flujos

- Integraciones externas — etapa `ctrl:IntegrationsConnectionsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /integrations/connections/{id}/credentials:rotate

- **Origen:** CONTRATO
- **Nombre:** Rotar/expirar la credencial de una conexión
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationsConnectionsController.rotateCredential` — `src/modules/integrations/controllers/integrations-connections.controller.ts:44`

### Qué es y para qué sirve (negocio)

Rotar/expirar la credencial de una conexión. Dentro del módulo (descripción del modelo, en inglés): «The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_12_integrations.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integrations/connections/{id}/credentials:rotate` la atiende `IntegrationsConnectionsController.rotateCredential` (src/modules/integrations/controllers/integrations-connections.controller.ts:44). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `IntegrationsRotateCredentialDto` (3 campos, 1 obligatorio). Delega en `IntegrationsConnectionsService.rotateCredential`. Crea filas en integrations.provider_credentials. Actualiza integrations.provider_credentials. Lee integrations.provider_connections, integrations.provider_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integrations/controllers/integrations-connections.controller.ts:44` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/integrations/controllers/integrations-connections.controller.ts:44` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integrations.provider_connections` | LEE | LEE | DIRECTA | IntegrationsConnectionsController.rotateCredential → IntegrationsConnectionsService.rotateCredential → ProviderConnectionsRepository.findByIdInScope | `src/modules/integrations/repositories/provider-connections.repository.ts:72` |
| `integrations.provider_credentials` | ESCRIBE | ACTUALIZA | POR_TIPO | IntegrationsConnectionsController.rotateCredential → IntegrationsConnectionsService.rotateCredential | `src/modules/integrations/services/integrations-connections.service.ts:184` |
| `integrations.provider_credentials` | ESCRIBE | CREA | DIRECTA | IntegrationsConnectionsController.rotateCredential → IntegrationsConnectionsService.rotateCredential → ProviderCredentialsRepository.create | `src/modules/integrations/repositories/provider-credentials.repository.ts:65` |
| `integrations.provider_credentials` | LEE | LEE | DIRECTA | IntegrationsConnectionsController.rotateCredential → IntegrationsConnectionsService.rotateCredential → ProviderCredentialsRepository.findActiveByConnection | `src/modules/integrations/repositories/provider-credentials.repository.ts:51` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `IntegrationsRotateCredentialDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `secretRef` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Referencia al nuevo secreto en la bóveda externa | `src/modules/integrations/dto/rotate-credential.dto.ts:23` |
| `secretType` | `string` | No | valores: API_KEY, OAUTH_TOKEN, HMAC | `@IsOptional()` `@IsIn(['API_KEY', 'OAUTH_TOKEN', 'HMAC'])` | Tipo del nuevo secreto (por defecto el de la credencial previa) | `src/modules/integrations/dto/rotate-credential.dto.ts:35` |
| `expiresAt` | `string` | No | formato date-time | `@IsOptional()` `@IsString()` | Expiración del nuevo secreto | `src/modules/integrations/dto/rotate-credential.dto.ts:47` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "secretRef": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "secretRef": "valor-ejemplo",
  "secretType": "API_KEY",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<CredentialRotationResponseDto>` · DTO `CredentialRotationResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `connectionId` | `string` | Sí | formato uuid | — | Identificador asociado a connection. | `src/modules/integrations/dto/responses.dto.ts:58` |
| `credentialId` | `string` | Sí | formato uuid | — | Identificador asociado a credential. | `src/modules/integrations/dto/responses.dto.ts:62` |
| `rotatedAt` | `string` | Sí | formato date-time | — | Valor de rotated at mantenido por la instancia. | `src/modules/integrations/dto/responses.dto.ts:66` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La conexión no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integrations.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integrations/controllers/integrations-connections.controller.spec.ts:33` |

### Flujos

- Integraciones externas — etapa `ctrl:IntegrationsConnectionsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /integrations/messages:outbound

- **Origen:** CONTRATO
- **Nombre:** Encolar un mensaje saliente (idempotente)
- **Bloque:** Integraciones y Contratos
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationsMessagesController.enqueueOutbound` — `src/modules/integrations/controllers/integrations-messages.controller.ts:53`

### Qué es y para qué sirve (negocio)

Encolar un mensaje saliente (idempotente). Dentro del módulo (descripción del modelo, en inglés): «The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_12_integrations.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integrations/messages:outbound` la atiende `IntegrationsMessagesController.enqueueOutbound` (src/modules/integrations/controllers/integrations-messages.controller.ts:53). Exige sesión; el controlador no declara roles. Valida el cuerpo como `EnqueueOutboundDto` (8 campos, 3 obligatorios). Delega en `IntegrationsMessagingService.enqueueOutbound`. Crea filas en integrations.outbound_messages. Lee integrations.outbound_messages, integrations.provider_connections.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/integrations/controllers/integrations-messages.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integrations.outbound_messages` | ESCRIBE | CREA | DIRECTA | IntegrationsMessagesController.enqueueOutbound → IntegrationsMessagingService.enqueueOutbound → OutboundMessagesRepository.create | `src/modules/integrations/repositories/outbound-messages.repository.ts:120` |
| `integrations.outbound_messages` | LEE | LEE | DIRECTA | IntegrationsMessagesController.enqueueOutbound → IntegrationsMessagingService.enqueueOutbound → OutboundMessagesRepository.findByIdempotencyKey | `src/modules/integrations/repositories/outbound-messages.repository.ts:96` |
| `integrations.provider_connections` | LEE | LEE | DIRECTA | IntegrationsMessagesController.enqueueOutbound → IntegrationsMessagingService.enqueueOutbound → ProviderConnectionsRepository.findByIdInScope | `src/modules/integrations/repositories/provider-connections.repository.ts:72` |

### Cuerpo — DTO `EnqueueOutboundDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `connectionId` | `string` | Sí | formato uuid | `@IsUUID()` | Conexión (ACTIVE) por la que se enviará | `src/modules/integrations/dto/enqueue-outbound.dto.ts:21` |
| `endpointId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Endpoint de integración a invocar | `src/modules/integrations/dto/enqueue-outbound.dto.ts:32` |
| `idempotencyKey` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Clave de idempotencia provista por el productor | `src/modules/integrations/dto/enqueue-outbound.dto.ts:44` |
| `correlationId` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Correlación (por defecto la idempotency_key) | `src/modules/integrations/dto/enqueue-outbound.dto.ts:56` |
| `requestPayloadJson` | `object` | Sí | — | `@IsObject()` | Payload de la petición saliente | `src/modules/integrations/dto/enqueue-outbound.dto.ts:63` |
| `headersJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Cabeceras a enviar | `src/modules/integrations/dto/enqueue-outbound.dto.ts:71` |
| `sourceResourceType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Tipo de recurso de negocio origen (polimórfico) | `src/modules/integrations/dto/enqueue-outbound.dto.ts:83` |
| `sourceResourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del recurso de negocio origen | `src/modules/integrations/dto/enqueue-outbound.dto.ts:94` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "connectionId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo",
  "requestPayloadJson": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<OutboundMessageResponseDto>` · DTO `OutboundMessageResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integrations/dto/responses.dto.ts:104` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/integrations/dto/responses.dto.ts:109` |
| `correlationId` | `string` | Sí | — | — | Identificador asociado a correlation. | `src/modules/integrations/dto/responses.dto.ts:113` |
| `idempotent` | `boolean` | Sí | — | — | true si se devolvió una fila preexistente por idempotencia | `src/modules/integrations/dto/responses.dto.ts:120` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La clave de idempotencia ya está en uso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La conexión no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integrations.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integrations/controllers/integrations-messages.controller.spec.ts:43` |

### Flujos

- Integraciones externas — etapa `ctrl:IntegrationsMessagesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /integrations/messages/{id}:correlate

- **Origen:** CONTRATO
- **Nombre:** Procesar callback/respuesta asíncrona del proveedor
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationsMessagesController.correlate` — `src/modules/integrations/controllers/integrations-messages.controller.ts:169`

### Qué es y para qué sirve (negocio)

Procesar callback/respuesta asíncrona del proveedor. Dentro del módulo (descripción del modelo, en inglés): «The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_12_integrations.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integrations/messages/{id}:correlate` la atiende `IntegrationsMessagesController.correlate` (src/modules/integrations/controllers/integrations-messages.controller.ts:169). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `IntegrationsMessagingService.correlate`. Crea filas en integrations.message_responses. Actualiza integrations.inbound_messages, integrations.outbound_messages. Lee integrations.inbound_messages, integrations.outbound_messages, integrations.provider_connections.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/integrations/controllers/integrations-messages.controller.ts:169` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/integrations/controllers/integrations-messages.controller.ts:169` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integrations.inbound_messages` | ESCRIBE | ACTUALIZA | POR_TIPO | IntegrationsMessagesController.correlate → IntegrationsMessagingService.correlate | `src/modules/integrations/services/integrations-messaging.service.ts:474` |
| `integrations.inbound_messages` | LEE | LEE | DIRECTA | IntegrationsMessagesController.correlate → IntegrationsMessagingService.correlate → InboundMessagesRepository.findById | `src/modules/integrations/repositories/inbound-messages.repository.ts:58` |
| `integrations.message_responses` | ESCRIBE | CREA | DIRECTA | IntegrationsMessagesController.correlate → IntegrationsMessagingService.correlate → MessageResponsesRepository.create | `src/modules/integrations/repositories/message-responses.repository.ts:49` |
| `integrations.outbound_messages` | ESCRIBE | ACTUALIZA | POR_TIPO | IntegrationsMessagesController.correlate → IntegrationsMessagingService.correlate | `src/modules/integrations/services/integrations-messaging.service.ts:462` |
| `integrations.outbound_messages` | LEE | LEE | DIRECTA | IntegrationsMessagesController.correlate → IntegrationsMessagingService.correlate → OutboundMessagesRepository.findByCorrelationIdInConnection | `src/modules/integrations/repositories/outbound-messages.repository.ts:109` |
| `integrations.provider_connections` | LEE | LEE | DIRECTA | IntegrationsMessagesController.correlate → IntegrationsMessagingService.correlate → ProviderConnectionsRepository.findByIdInScope | `src/modules/integrations/repositories/provider-connections.repository.ts:72` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CorrelateResultDto>` · DTO `CorrelateResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `inboundMessageId` | `string` | Sí | formato uuid | — | Identificador asociado a inbound message. | `src/modules/integrations/dto/responses.dto.ts:218` |
| `outboundMessageId` | `string` | Sí | formato uuid | — | Identificador asociado a outbound message. | `src/modules/integrations/dto/responses.dto.ts:222` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del mensaje entrante | `src/modules/integrations/dto/responses.dto.ts:230` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No hay mensaje saliente correlacionado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El mensaje entrante no está en estado recibido; PreconditionFailedException: El mensaje entrante no tiene correlación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integrations.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integrations/controllers/integrations-messages.controller.spec.ts:68` |

### Flujos

- Integraciones externas — etapa `ctrl:IntegrationsMessagesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /integrations/messages/{id}:dead-letter

- **Origen:** CONTRATO
- **Nombre:** Enviar a dead-letter tras agotar reintentos
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationsMessagesController.deadLetter` — `src/modules/integrations/controllers/integrations-messages.controller.ts:136`

### Qué es y para qué sirve (negocio)

Enviar a dead-letter tras agotar reintentos. Dentro del módulo (descripción del modelo, en inglés): «The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_12_integrations.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integrations/messages/{id}:dead-letter` la atiende `IntegrationsMessagesController.deadLetter` (src/modules/integrations/controllers/integrations-messages.controller.ts:136). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `IntegrationsMessagingService.deadLetter`. Crea filas en integrations.message_retries. Lee integrations.message_retries, integrations.outbound_messages, integrations.provider_connections.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/integrations/controllers/integrations-messages.controller.ts:136` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/integrations/controllers/integrations-messages.controller.ts:136` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integrations.message_retries` | ESCRIBE | CREA | DIRECTA | IntegrationsMessagesController.deadLetter → IntegrationsMessagingService.deadLetter → MessageRetriesRepository.create | `src/modules/integrations/repositories/message-retries.repository.ts:73` |
| `integrations.message_retries` | LEE | LEE | DIRECTA | IntegrationsMessagesController.deadLetter → IntegrationsMessagingService.deadLetter → MessageRetriesRepository.maxAttempt | `src/modules/integrations/repositories/message-retries.repository.ts:57` |
| `integrations.outbound_messages` | LEE | LEE | DIRECTA | IntegrationsMessagesController.deadLetter → IntegrationsMessagingService.deadLetter → IntegrationsMessagingService.resolveMessageInScope → OutboundMessagesRepository.findById | `src/modules/integrations/repositories/outbound-messages.repository.ts:70` |
| `integrations.provider_connections` | LEE | LEE | DIRECTA | IntegrationsMessagesController.deadLetter → IntegrationsMessagingService.deadLetter → IntegrationsMessagingService.resolveMessageInScope → ProviderConnectionsRepository.findByIdInScope | `src/modules/integrations/repositories/provider-connections.repository.ts:72` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DeadLetterResultDto>` · DTO `DeadLetterResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `messageId` | `string` | Sí | formato uuid | — | Identificador asociado a message. | `src/modules/integrations/dto/responses.dto.ts:177` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado resultante | `src/modules/integrations/dto/responses.dto.ts:185` |
| `alreadyDeadLettered` | `boolean` | Sí | — | — | true si ya estaba en dead-letter (no-op idempotente) | `src/modules/integrations/dto/responses.dto.ts:192` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El mensaje no está en estado fallido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integrations.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integrations/controllers/integrations-messages.controller.spec.ts:62` |

### Flujos

- Integraciones externas — etapa `ctrl:IntegrationsMessagesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /integrations/messages/{id}:dispatch

- **Origen:** CONTRATO
- **Nombre:** Despachar un mensaje y registrar su respuesta
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationsMessagesController.dispatch` — `src/modules/integrations/controllers/integrations-messages.controller.ts:84`

### Qué es y para qué sirve (negocio)

Despachar un mensaje y registrar su respuesta. Dentro del módulo (descripción del modelo, en inglés): «The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_12_integrations.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integrations/messages/{id}:dispatch` la atiende `IntegrationsMessagesController.dispatch` (src/modules/integrations/controllers/integrations-messages.controller.ts:84). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Valida el cuerpo como `DispatchMessageDto` (0 campos, 0 obligatorios). Delega en `IntegrationsMessagingService.dispatch`. Crea filas en integrations.message_responses. Actualiza integrations.outbound_messages. Lee integrations.external_providers, integrations.integration_endpoints, integrations.outbound_messages, integrations.provider_connections, integrations.provider_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/integrations/controllers/integrations-messages.controller.ts:84` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/integrations/controllers/integrations-messages.controller.ts:84` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integrations.external_providers` | LEE | LEE | DIRECTA | IntegrationsMessagesController.dispatch → IntegrationsMessagingService.dispatch → ExternalProvidersRepository.findById | `src/modules/integrations/repositories/external-providers.repository.ts:58` |
| `integrations.integration_endpoints` | LEE | LEE | DIRECTA | IntegrationsMessagesController.dispatch → IntegrationsMessagingService.dispatch → IntegrationEndpointsRepository.findById | `src/modules/integrations/repositories/integration-endpoints.repository.ts:100` |
| `integrations.message_responses` | ESCRIBE | CREA | DIRECTA | IntegrationsMessagesController.dispatch → IntegrationsMessagingService.dispatch → MessageResponsesRepository.create | `src/modules/integrations/repositories/message-responses.repository.ts:49` |
| `integrations.outbound_messages` | ESCRIBE | ACTUALIZA | POR_TIPO | IntegrationsMessagesController.dispatch → IntegrationsMessagingService.dispatch | `src/modules/integrations/services/integrations-messaging.service.ts:244` |
| `integrations.outbound_messages` | LEE | LEE | DIRECTA | IntegrationsMessagesController.dispatch → IntegrationsMessagingService.dispatch → OutboundMessagesRepository.findById | `src/modules/integrations/repositories/outbound-messages.repository.ts:70` |
| `integrations.provider_connections` | LEE | LEE | DIRECTA | IntegrationsMessagesController.dispatch → IntegrationsMessagingService.dispatch → ProviderConnectionsRepository.findByIdInScope | `src/modules/integrations/repositories/provider-connections.repository.ts:72` |
| `integrations.provider_credentials` | LEE | LEE | DIRECTA | IntegrationsMessagesController.dispatch → IntegrationsMessagingService.dispatch → IntegrationsSecretsService.resolveActiveSecrets → ProviderCredentialsRepository.findActiveByConnection | `src/modules/integrations/repositories/provider-credentials.repository.ts:51` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DispatchMessageDto` · `application/json`

_El DTO no declara campos documentables, o no se pudo leer._

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

### Respuesta — `Promise<DispatchResultDto>` · DTO `DispatchResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integrations/dto/responses.dto.ts:128` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado resultante | `src/modules/integrations/dto/responses.dto.ts:136` |
| `isSuccess` | `boolean` | Sí | — | — | Valor de is success mantenido por la instancia. | `src/modules/integrations/dto/responses.dto.ts:140` |
| `responseId` | `string` | Sí | formato uuid | — | Identificador asociado a response. | `src/modules/integrations/dto/responses.dto.ts:144` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El mensaje no está en cola; PreconditionFailedException: El proveedor no tiene base_url configurada para el despacho; PreconditionFailedException: La conexión no tiene un secreto activo disponible; PreconditionFailedException: El cuerpo del despacho excede el tamaño permitido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integrations.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integrations/controllers/integrations-messages.controller.spec.ts:50` |

### Flujos

- Integraciones externas — etapa `ctrl:IntegrationsMessagesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /integrations/messages/{id}:retry

- **Origen:** CONTRATO
- **Nombre:** Programar un reintento con backoff exponencial
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationsMessagesController.retry` — `src/modules/integrations/controllers/integrations-messages.controller.ts:119`

### Qué es y para qué sirve (negocio)

Programar un reintento con backoff exponencial. Dentro del módulo (descripción del modelo, en inglés): «The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_12_integrations.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integrations/messages/{id}:retry` la atiende `IntegrationsMessagesController.retry` (src/modules/integrations/controllers/integrations-messages.controller.ts:119). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `IntegrationsMessagingService.retry`. Crea filas en integrations.message_retries. Lee integrations.message_retries, integrations.outbound_messages, integrations.provider_connections.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/integrations/controllers/integrations-messages.controller.ts:119` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/integrations/controllers/integrations-messages.controller.ts:119` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integrations.message_retries` | ESCRIBE | CREA | DIRECTA | IntegrationsMessagesController.retry → IntegrationsMessagingService.retry → MessageRetriesRepository.create | `src/modules/integrations/repositories/message-retries.repository.ts:73` |
| `integrations.message_retries` | LEE | LEE | DIRECTA | IntegrationsMessagesController.retry → IntegrationsMessagingService.retry → MessageRetriesRepository.maxAttempt | `src/modules/integrations/repositories/message-retries.repository.ts:57` |
| `integrations.outbound_messages` | LEE | LEE | DIRECTA | IntegrationsMessagesController.retry → IntegrationsMessagingService.retry → IntegrationsMessagingService.resolveMessageInScope → OutboundMessagesRepository.findById | `src/modules/integrations/repositories/outbound-messages.repository.ts:70` |
| `integrations.provider_connections` | LEE | LEE | DIRECTA | IntegrationsMessagesController.retry → IntegrationsMessagingService.retry → IntegrationsMessagingService.resolveMessageInScope → ProviderConnectionsRepository.findByIdInScope | `src/modules/integrations/repositories/provider-connections.repository.ts:72` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RetryResultDto>` · DTO `RetryResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `messageId` | `string` | Sí | formato uuid | — | Identificador asociado a message. | `src/modules/integrations/dto/responses.dto.ts:152` |
| `attemptNumber` | `number` | Sí | — | — | Valor de attempt number mantenido por la instancia. | `src/modules/integrations/dto/responses.dto.ts:156` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado resultante del mensaje | `src/modules/integrations/dto/responses.dto.ts:164` |
| `nextRetryAt` | `string` | No | formato date-time | — | Valor de next retry at mantenido por la instancia. | `src/modules/integrations/dto/responses.dto.ts:169` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El mensaje no está en estado fallido; PreconditionFailedException: Se agotaron los reintentos (usar dead-letter) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integrations.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integrations/controllers/integrations-messages.controller.spec.ts:56` |

### Flujos

- Integraciones externas — etapa `ctrl:IntegrationsMessagesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /integrations/messages/pending-correlation

- **Origen:** CONTRATO
- **Nombre:** Listar mensajes entrantes RECEIVED listos para correlacionar
- **Bloque:** Integraciones y Contratos
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationsMessagesController.listPendingCorrelation` — `src/modules/integrations/controllers/integrations-messages.controller.ts:156`

### Qué es y para qué sirve (negocio)

Listar mensajes entrantes RECEIVED listos para correlacionar. Dentro del módulo (descripción del modelo, en inglés): «The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_12_integrations.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`GET /integrations/messages/pending-correlation` la atiende `IntegrationsMessagesController.listPendingCorrelation` (src/modules/integrations/controllers/integrations-messages.controller.ts:156). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `IntegrationsMessagingService.listReceivedForCorrelation`. Lee integrations.inbound_messages, integrations.provider_connections.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/integrations/controllers/integrations-messages.controller.ts:156` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integrations.inbound_messages` | LEE | LEE | DIRECTA | IntegrationsMessagesController.listPendingCorrelation → IntegrationsMessagingService.listReceivedForCorrelation → InboundMessagesRepository.findReceived | `src/modules/integrations/repositories/inbound-messages.repository.ts:100` |
| `integrations.provider_connections` | LEE | LEE | DIRECTA | IntegrationsMessagesController.listPendingCorrelation → IntegrationsMessagingService.listReceivedForCorrelation → IntegrationsMessagingService.scopedConnectionIds → ProviderConnectionsRepository.findIdsByTenant | `src/modules/integrations/repositories/provider-connections.repository.ts:90` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PendingCorrelationResponseDto>` · DTO `PendingCorrelationResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `messages` | `array<PendingCorrelationItemDto>` | Sí | — | — | Valor de messages mantenido por la instancia. | `src/modules/integrations/dto/responses.dto.ts:334` |
| `messages[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integrations/dto/responses.dto.ts:322` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integrations.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integrations/controllers/integrations-messages.controller.spec.ts:101` |

### Flujos

- Integraciones externas — etapa `ctrl:IntegrationsMessagesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /integrations/messages/pending-dispatch

- **Origen:** CONTRATO
- **Nombre:** Listar mensajes QUEUED listos para despachar
- **Bloque:** Integraciones y Contratos
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationsMessagesController.listPendingDispatch` — `src/modules/integrations/controllers/integrations-messages.controller.ts:73`

### Qué es y para qué sirve (negocio)

Listar mensajes QUEUED listos para despachar. Dentro del módulo (descripción del modelo, en inglés): «The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_12_integrations.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`GET /integrations/messages/pending-dispatch` la atiende `IntegrationsMessagesController.listPendingDispatch` (src/modules/integrations/controllers/integrations-messages.controller.ts:73). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `IntegrationsMessagingService.listQueuedForDispatch`. Lee integrations.outbound_messages, integrations.provider_connections.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/integrations/controllers/integrations-messages.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integrations.outbound_messages` | LEE | LEE | DIRECTA | IntegrationsMessagesController.listPendingDispatch → IntegrationsMessagingService.listQueuedForDispatch → OutboundMessagesRepository.findQueuedForDispatch | `src/modules/integrations/repositories/outbound-messages.repository.ts:182` |
| `integrations.provider_connections` | LEE | LEE | DIRECTA | IntegrationsMessagesController.listPendingDispatch → IntegrationsMessagingService.listQueuedForDispatch → IntegrationsMessagingService.scopedConnectionIds → ProviderConnectionsRepository.findIdsByTenant | `src/modules/integrations/repositories/provider-connections.repository.ts:90` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PendingDispatchResponseDto>` · DTO `PendingDispatchResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `messages` | `array<PendingDispatchItemDto>` | Sí | — | — | Valor de messages mantenido por la instancia. | `src/modules/integrations/dto/responses.dto.ts:279` |
| `messages[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integrations/dto/responses.dto.ts:266` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integrations.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integrations/controllers/integrations-messages.controller.spec.ts:74` |

### Flujos

- Integraciones externas — etapa `ctrl:IntegrationsMessagesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. GET /integrations/messages/pending-retry

- **Origen:** CONTRATO
- **Nombre:** Listar mensajes FAILED candidatos a reintento o dead-letter
- **Bloque:** Integraciones y Contratos
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationsMessagesController.listPendingRetry` — `src/modules/integrations/controllers/integrations-messages.controller.ts:106`

### Qué es y para qué sirve (negocio)

Listar mensajes FAILED candidatos a reintento o dead-letter. Dentro del módulo (descripción del modelo, en inglés): «The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_12_integrations.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`GET /integrations/messages/pending-retry` la atiende `IntegrationsMessagesController.listPendingRetry` (src/modules/integrations/controllers/integrations-messages.controller.ts:106). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `IntegrationsMessagingService.listFailedForRetry`. Lee integrations.message_retries, integrations.outbound_messages, integrations.provider_connections.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/integrations/controllers/integrations-messages.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integrations.message_retries` | LEE | LEE | DIRECTA | IntegrationsMessagesController.listPendingRetry → IntegrationsMessagingService.listFailedForRetry → MessageRetriesRepository.maxAttempt | `src/modules/integrations/repositories/message-retries.repository.ts:57` |
| `integrations.outbound_messages` | LEE | LEE | DIRECTA | IntegrationsMessagesController.listPendingRetry → IntegrationsMessagingService.listFailedForRetry → OutboundMessagesRepository.findFailed | `src/modules/integrations/repositories/outbound-messages.repository.ts:204` |
| `integrations.provider_connections` | LEE | LEE | DIRECTA | IntegrationsMessagesController.listPendingRetry → IntegrationsMessagingService.listFailedForRetry → IntegrationsMessagingService.scopedConnectionIds → ProviderConnectionsRepository.findIdsByTenant | `src/modules/integrations/repositories/provider-connections.repository.ts:90` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PendingRetryResponseDto>` · DTO `PendingRetryResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `messages` | `array<PendingRetryItemDto>` | Sí | — | — | Valor de messages mantenido por la instancia. | `src/modules/integrations/dto/responses.dto.ts:314` |
| `messages[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integrations/dto/responses.dto.ts:287` |
| `messages[].nextAttemptNumber` | `number` | Sí | — | — | Número que tendría el próximo intento | `src/modules/integrations/dto/responses.dto.ts:292` |
| `messages[].exhausted` | `boolean` | Sí | — | — | true si el próximo intento excede MAX_ATTEMPTS: el worker debe | `src/modules/integrations/dto/responses.dto.ts:301` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integrations.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integrations/controllers/integrations-messages.controller.spec.ts:92` |

### Flujos

- Integraciones externas — etapa `ctrl:IntegrationsMessagesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. POST /integrations/providers

- **Origen:** CONTRATO
- **Nombre:** Registrar un proveedor externo
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationsProvidersController.registerProvider` — `src/modules/integrations/controllers/integrations-providers.controller.ts:53`

### Qué es y para qué sirve (negocio)

Registrar un proveedor externo. Dentro del módulo (descripción del modelo, en inglés): «The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_12_integrations.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integrations/providers` la atiende `IntegrationsProvidersController.registerProvider` (src/modules/integrations/controllers/integrations-providers.controller.ts:53). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RegisterProviderDto` (6 campos, 3 obligatorios). Delega en `IntegrationsProvidersService.registerProvider`. Crea filas en integrations.external_providers. Lee integrations.external_providers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integrations/controllers/integrations-providers.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integrations.external_providers` | ESCRIBE | CREA | DIRECTA | IntegrationsProvidersController.registerProvider → IntegrationsProvidersService.registerProvider → ExternalProvidersRepository.create | `src/modules/integrations/repositories/external-providers.repository.ts:77` |
| `integrations.external_providers` | LEE | LEE | DIRECTA | IntegrationsProvidersController.registerProvider → IntegrationsProvidersService.registerProvider → ExternalProvidersRepository.findByCode | `src/modules/integrations/repositories/external-providers.repository.ts:66` |

### Cuerpo — DTO `RegisterProviderDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único global del proveedor | `src/modules/integrations/dto/register-provider.dto.ts:24` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible del proveedor | `src/modules/integrations/dto/register-provider.dto.ts:33` |
| `providerType` | `string` | Sí | valores: LAB, INSURER, GOV, GENERIC | `@IsIn(['LAB', 'INSURER', 'GOV', 'GENERIC'])` | Tipo de proveedor | `src/modules/integrations/dto/register-provider.dto.ts:43` |
| `baseUrl` | `string` | No | formato uri; longitud máxima 2048 | `@IsOptional()` `@IsUrl({ require_tld: false })` `@MaxLength(2048)` | URL base de la API del proveedor | `src/modules/integrations/dto/register-provider.dto.ts:52` |
| `authType` | `string` | No | valores: OAUTH2, API_KEY, HMAC | `@IsOptional()` `@IsIn(['OAUTH2', 'API_KEY', 'HMAC'])` | Tipo de autenticación | `src/modules/integrations/dto/register-provider.dto.ts:63` |
| `docUrl` | `string` | No | formato uri; longitud máxima 2048 | `@IsOptional()` `@IsUrl({ require_tld: false })` `@MaxLength(2048)` | URL de documentación del proveedor | `src/modules/integrations/dto/register-provider.dto.ts:72` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "providerType": "LAB"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "providerType": "LAB",
  "baseUrl": "https://example.com/recurso",
  "authType": "OAUTH2",
  "docUrl": "https://example.com/recurso"
}
```

</details>

### Respuesta — `Promise<ProviderResponseDto>` · DTO `ProviderResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integrations/dto/responses.dto.ts:8` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/integrations/dto/responses.dto.ts:12` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/integrations/dto/responses.dto.ts:16` |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/integrations/dto/responses.dto.ts:21` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/integrations/dto/responses.dto.ts:25` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un proveedor con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integrations.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integrations/controllers/integrations-providers.controller.spec.ts:38` |

### Flujos

- Integraciones externas — etapa `ctrl:IntegrationsProvidersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /integrations/providers/{id}/connections

- **Origen:** CONTRATO
- **Nombre:** Aprovisionar una conexión de tenant y su credencial
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationsProvidersController.provisionConnection` — `src/modules/integrations/controllers/integrations-providers.controller.ts:70`

### Qué es y para qué sirve (negocio)

Aprovisionar una conexión de tenant y su credencial. Dentro del módulo (descripción del modelo, en inglés): «The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_12_integrations.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integrations/providers/{id}/connections` la atiende `IntegrationsProvidersController.provisionConnection` (src/modules/integrations/controllers/integrations-providers.controller.ts:70). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ProvisionConnectionDto` (6 campos, 2 obligatorios). Delega en `IntegrationsConnectionsService.provisionConnection`. Crea filas en integrations.provider_connections, integrations.provider_credentials. Lee integrations.external_providers.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integrations/controllers/integrations-providers.controller.ts:70` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/integrations/controllers/integrations-providers.controller.ts:70` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integrations.external_providers` | LEE | LEE | DIRECTA | IntegrationsProvidersController.provisionConnection → IntegrationsConnectionsService.provisionConnection → ExternalProvidersRepository.findById | `src/modules/integrations/repositories/external-providers.repository.ts:58` |
| `integrations.provider_connections` | ESCRIBE | CREA | DIRECTA | IntegrationsProvidersController.provisionConnection → IntegrationsConnectionsService.provisionConnection → ProviderConnectionsRepository.create | `src/modules/integrations/repositories/provider-connections.repository.ts:106` |
| `integrations.provider_credentials` | ESCRIBE | CREA | DIRECTA | IntegrationsProvidersController.provisionConnection → IntegrationsConnectionsService.provisionConnection → ProviderCredentialsRepository.create | `src/modules/integrations/repositories/provider-credentials.repository.ts:65` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ProvisionConnectionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Opcional: el tenant propietario sale del contexto autenticado; si se envía debe coincidir con él | `src/modules/integrations/dto/provision-connection.dto.ts:25` |
| `environment` | `string` | No | valores: SANDBOX, PRODUCTION | `@IsOptional()` `@IsIn(['SANDBOX', 'PRODUCTION'])` | Entorno | `src/modules/integrations/dto/provision-connection.dto.ts:36` |
| `configJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Configuración específica de la conexión | `src/modules/integrations/dto/provision-connection.dto.ts:46` |
| `secretType` | `string` | Sí | valores: API_KEY, OAUTH_TOKEN, HMAC | `@IsIn(['API_KEY', 'OAUTH_TOKEN', 'HMAC'])` | Tipo del secreto inicial | `src/modules/integrations/dto/provision-connection.dto.ts:56` |
| `secretRef` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Referencia al secreto en la bóveda externa (no el secreto) | `src/modules/integrations/dto/provision-connection.dto.ts:67` |
| `expiresAt` | `string` | No | formato date-time | `@IsOptional()` `@IsString()` | Fecha de expiración del secreto | `src/modules/integrations/dto/provision-connection.dto.ts:79` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "secretType": "API_KEY",
  "secretRef": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "environment": "SANDBOX",
  "configJson": {},
  "secretType": "API_KEY",
  "secretRef": "valor-ejemplo",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<ConnectionResponseDto>` · DTO `ConnectionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integrations/dto/responses.dto.ts:33` |
| `pharmacyId` | `string` | Sí | formato uuid | — | Identificador asociado a pharmacy. | sin fuente |
| `connectionId` | `string` | Sí | formato uuid; admite null | — | Conexión registrada en integraciones; nulo mientras la farmacia no tiene configurado su sistema externo. | sin fuente |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | sin fuente |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El proveedor no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integrations.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integrations/controllers/integrations-providers.controller.spec.ts:49` |

### Flujos

- Integraciones externas — etapa `ctrl:IntegrationsProvidersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /integrations/providers/{id}/endpoints

- **Origen:** CONTRATO
- **Nombre:** Publicar un endpoint versionado y su mapeo de campos
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationsProvidersController.publishEndpoint` — `src/modules/integrations/controllers/integrations-providers.controller.ts:90`

### Qué es y para qué sirve (negocio)

Publicar un endpoint versionado y su mapeo de campos. Dentro del módulo (descripción del modelo, en inglés): «The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_12_integrations.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integrations/providers/{id}/endpoints` la atiende `IntegrationsProvidersController.publishEndpoint` (src/modules/integrations/controllers/integrations-providers.controller.ts:90). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PublishEndpointDto` (14 campos, 3 obligatorios). Delega en `IntegrationsProvidersService.publishEndpoint`. Crea filas en integrations.integration_endpoints, integrations.integration_field_mappings. Lee integrations.external_providers, integrations.integration_endpoints.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integrations/controllers/integrations-providers.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/integrations/controllers/integrations-providers.controller.ts:90` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integrations.external_providers` | LEE | LEE | DIRECTA | IntegrationsProvidersController.publishEndpoint → IntegrationsProvidersService.publishEndpoint → ExternalProvidersRepository.findById | `src/modules/integrations/repositories/external-providers.repository.ts:58` |
| `integrations.integration_endpoints` | ESCRIBE | CREA | DIRECTA | IntegrationsProvidersController.publishEndpoint → IntegrationsProvidersService.publishEndpoint → IntegrationEndpointsRepository.createEndpoint | `src/modules/integrations/repositories/integration-endpoints.repository.ts:123` |
| `integrations.integration_endpoints` | LEE | LEE | DIRECTA | IntegrationsProvidersController.publishEndpoint → IntegrationsProvidersService.publishEndpoint → IntegrationEndpointsRepository.findByProviderAndVersion | `src/modules/integrations/repositories/integration-endpoints.repository.ts:109` |
| `integrations.integration_field_mappings` | ESCRIBE | CREA | DIRECTA | IntegrationsProvidersController.publishEndpoint → IntegrationsProvidersService.publishEndpoint → IntegrationEndpointsRepository.createFieldMapping | `src/modules/integrations/repositories/integration-endpoints.repository.ts:153` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishEndpointDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código del endpoint | `src/modules/integrations/dto/publish-endpoint.dto.ts:75` |
| `operation` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Operación lógica que expone | `src/modules/integrations/dto/publish-endpoint.dto.ts:84` |
| `version` | `string` | Sí | longitud mínima 1; longitud máxima 50 | `@IsString()` `@MinLength(1)` `@MaxLength(50)` | Versión del endpoint (única por proveedor) | `src/modules/integrations/dto/publish-endpoint.dto.ts:96` |
| `httpMethod` | `string` | No | valores: GET, POST, PUT, PATCH, DELETE | `@IsOptional()` `@IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])` | Método HTTP | `src/modules/integrations/dto/publish-endpoint.dto.ts:107` |
| `path` | `string` | No | longitud máxima 2048 | `@IsOptional()` `@IsString()` `@MaxLength(2048)` | Ruta relativa del endpoint | `src/modules/integrations/dto/publish-endpoint.dto.ts:116` |
| `requestSchemaJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Esquema JSON de la petición | `src/modules/integrations/dto/publish-endpoint.dto.ts:124` |
| `responseSchemaJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Esquema JSON de la respuesta | `src/modules/integrations/dto/publish-endpoint.dto.ts:132` |
| `timeoutMs` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Timeout en milisegundos | `src/modules/integrations/dto/publish-endpoint.dto.ts:141` |
| `mappings` | `array<FieldMappingDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => FieldMappingDto)` | Mapeos de campos publicados en la misma transacción | `src/modules/integrations/dto/publish-endpoint.dto.ts:154` |
| `mappings[].sourcePath` | `string` | No | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Ruta origen en el payload | `src/modules/integrations/dto/publish-endpoint.dto.ts:27` |
| `mappings[].targetField` | `string` | No | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Campo destino en el esquema canónico | `src/modules/integrations/dto/publish-endpoint.dto.ts:36` |
| `mappings[].conceptMapId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept map aplicable | `src/modules/integrations/dto/publish-endpoint.dto.ts:44` |
| `mappings[].transformJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Transformación declarativa | `src/modules/integrations/dto/publish-endpoint.dto.ts:52` |
| `mappings[].direction` | `string` | No | valores: INBOUND, OUTBOUND | `@IsOptional()` `@IsIn(['INBOUND', 'OUTBOUND'])` | Dirección del mapeo | `src/modules/integrations/dto/publish-endpoint.dto.ts:63` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "operation": "valor-ejemplo",
  "version": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<EndpointResponseDto>` · DTO `EndpointResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integrations/dto/responses.dto.ts:74` |
| `providerId` | `string` | Sí | formato uuid | — | Identificador asociado a provider. | `src/modules/integrations/dto/responses.dto.ts:78` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/integrations/dto/responses.dto.ts:82` |
| `version` | `string` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/integrations/dto/responses.dto.ts:86` |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/integrations/dto/responses.dto.ts:91` |
| `mappingsCount` | `number` | Sí | — | — | Nº de mapeos de campos creados | `src/modules/integrations/dto/responses.dto.ts:96` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe un endpoint con esa versión para el proveedor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El proveedor no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integrations.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integrations/controllers/integrations-providers.controller.spec.ts:60` |

### Flujos

- Integraciones externas — etapa `ctrl:IntegrationsProvidersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /integrations/providers/{id}/webhook-subscriptions

- **Origen:** CONTRATO
- **Nombre:** Gestionar (crear/actualizar) una suscripción de webhook
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationsProvidersController.createWebhookSubscription` — `src/modules/integrations/controllers/integrations-providers.controller.ts:110`

### Qué es y para qué sirve (negocio)

Gestionar (crear/actualizar) una suscripción de webhook. Dentro del módulo (descripción del modelo, en inglés): «The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_12_integrations.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integrations/providers/{id}/webhook-subscriptions` la atiende `IntegrationsProvidersController.createWebhookSubscription` (src/modules/integrations/controllers/integrations-providers.controller.ts:110). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `IntegrationsCreateWebhookSubscriptionDto` (4 campos, 2 obligatorios). Delega en `IntegrationsProvidersService.createWebhookSubscription`. Crea filas en integrations.webhook_subscriptions. Actualiza integrations.webhook_subscriptions. Lee integrations.external_providers, integrations.webhook_subscriptions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/integrations/controllers/integrations-providers.controller.ts:110` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/integrations/controllers/integrations-providers.controller.ts:110` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integrations.external_providers` | LEE | LEE | DIRECTA | IntegrationsProvidersController.createWebhookSubscription → IntegrationsProvidersService.createWebhookSubscription → ExternalProvidersRepository.findById | `src/modules/integrations/repositories/external-providers.repository.ts:58` |
| `integrations.webhook_subscriptions` | ESCRIBE | ACTUALIZA | POR_TIPO | IntegrationsProvidersController.createWebhookSubscription → IntegrationsProvidersService.createWebhookSubscription | `src/modules/integrations/services/integrations-providers.service.ts:243` |
| `integrations.webhook_subscriptions` | ESCRIBE | CREA | DIRECTA | IntegrationsProvidersController.createWebhookSubscription → IntegrationsProvidersService.createWebhookSubscription → WebhookSubscriptionsRepository.create | `src/modules/integrations/repositories/webhook-subscriptions.repository.ts:66` |
| `integrations.webhook_subscriptions` | LEE | LEE | DIRECTA | IntegrationsProvidersController.createWebhookSubscription → IntegrationsProvidersService.createWebhookSubscription → WebhookSubscriptionsRepository.findByLogicalKey | `src/modules/integrations/repositories/webhook-subscriptions.repository.ts:51` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `IntegrationsCreateWebhookSubscriptionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Opcional: la suscripción pertenece al tenant del contexto autenticado; si se envía debe coincidir con él | `src/modules/integrations/dto/webhook-subscription.dto.ts:24` |
| `eventType` | `string` | Sí | longitud mínima 1; longitud máxima 150 | `@IsString()` `@MinLength(1)` `@MaxLength(150)` | Tipo de evento suscrito | `src/modules/integrations/dto/webhook-subscription.dto.ts:33` |
| `callbackUrl` | `string` | Sí | longitud máxima 2048; patrón runtime /^https:\/\//i | `@Matches(/^https:\/\//i, { message: 'callbackUrl debe ser una URL HTTPS' })` `@MaxLength(2048)` | URL de callback (HTTPS obligatoria) | `src/modules/integrations/dto/webhook-subscription.dto.ts:41` |
| `secretRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia al secreto de verificación de firma | `src/modules/integrations/dto/webhook-subscription.dto.ts:53` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "eventType": "valor-ejemplo",
  "callbackUrl": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "eventType": "valor-ejemplo",
  "callbackUrl": "valor-ejemplo",
  "secretRef": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<WebhookSubscriptionResponseDto>` · DTO `WebhookSubscriptionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integrations/dto/responses.dto.ts:238` |
| `providerId` | `string` | Sí | formato uuid | — | Identificador asociado a provider. | `src/modules/integrations/dto/responses.dto.ts:242` |
| `eventType` | `string` | Sí | — | — | Valor de event type mantenido por la instancia. | `src/modules/integrations/dto/responses.dto.ts:246` |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/integrations/dto/responses.dto.ts:251` |
| `updated` | `boolean` | Sí | — | — | true si se actualizó una suscripción existente | `src/modules/integrations/dto/responses.dto.ts:258` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Proveedor no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El proveedor no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integrations.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/integrations/controllers/integrations-providers.controller.spec.ts:71` |

### Flujos

- Integraciones externas — etapa `ctrl:IntegrationsProvidersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /integrations/webhooks/inbound

- **Origen:** CONTRATO
- **Nombre:** Recibir un mensaje entrante (idempotencia por firma)
- **Bloque:** Integraciones y Contratos
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IntegrationsWebhooksController.receiveInbound` — `src/modules/integrations/controllers/integrations-webhooks.controller.ts:23`

### Qué es y para qué sirve (negocio)

Recibir un mensaje entrante (idempotencia por firma). Dentro del módulo (descripción del modelo, en inglés): «The foundation to connect with external providers — labs, insurers, pharmacies, government registries, payment and messaging services — recording every request, response and retry, all versioned for reliability and audit.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_12_integrations.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /integrations/webhooks/inbound` la atiende `IntegrationsWebhooksController.receiveInbound` (src/modules/integrations/controllers/integrations-webhooks.controller.ts:23). Es una ruta pública: no exige token. Valida el cuerpo como `InboundWebhookDto` (5 campos, 2 obligatorios). Delega en `IntegrationsWebhooksService.receiveInbound`. Crea filas en integrations.inbound_messages. Lee integrations.inbound_messages, integrations.provider_connections, integrations.provider_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/integrations/controllers/integrations-webhooks.controller.ts:23` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `integrations.inbound_messages` | ESCRIBE | CREA | DIRECTA | IntegrationsWebhooksController.receiveInbound → IntegrationsWebhooksService.receiveInbound → IntegrationsWebhooksService.persistInbound → InboundMessagesRepository.create | `src/modules/integrations/repositories/inbound-messages.repository.ts:118` |
| `integrations.inbound_messages` | LEE | LEE | DIRECTA | IntegrationsWebhooksController.receiveInbound → IntegrationsWebhooksService.receiveInbound → InboundMessagesRepository.findByConnectionAndSignature | `src/modules/integrations/repositories/inbound-messages.repository.ts:86` |
| `integrations.provider_connections` | LEE | LEE | DIRECTA | IntegrationsWebhooksController.receiveInbound → IntegrationsWebhooksService.receiveInbound → IntegrationsWebhooksService.persistInbound → ProviderConnectionsRepository.findById | `src/modules/integrations/repositories/provider-connections.repository.ts:54` |
| `integrations.provider_credentials` | LEE | LEE | DIRECTA | IntegrationsWebhooksController.receiveInbound → IntegrationsWebhooksService.receiveInbound → IntegrationsWebhooksService.persistInbound → IntegrationsSecretsService.resolveActiveSecrets → ProviderCredentialsRepository.findActiveByConnection | `src/modules/integrations/repositories/provider-credentials.repository.ts:51` |

### Cuerpo — DTO `InboundWebhookDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `connectionId` | `string` | Sí | formato uuid | `@IsUUID()` | Conexión que identifica al tenant/proveedor | `src/modules/integrations/dto/inbound-webhook.dto.ts:20` |
| `endpointId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Endpoint de integración asociado | `src/modules/integrations/dto/inbound-webhook.dto.ts:31` |
| `correlationId` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Correlación para casar con un mensaje saliente | `src/modules/integrations/dto/inbound-webhook.dto.ts:43` |
| `payloadJson` | `object` | Sí | — | `@IsObject()` | Payload entregado por el proveedor | `src/modules/integrations/dto/inbound-webhook.dto.ts:50` |
| `signature` | `string` | No | longitud máxima 512 | `@IsOptional()` `@IsString()` `@MaxLength(512)` | Firma HMAC de la entrega (idempotencia) | `src/modules/integrations/dto/inbound-webhook.dto.ts:62` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "connectionId": "00000000-0000-4000-8000-000000000001",
  "payloadJson": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "connectionId": "00000000-0000-4000-8000-000000000001",
  "endpointId": "00000000-0000-4000-8000-000000000001",
  "correlationId": "00000000-0000-4000-8000-000000000001",
  "payloadJson": {},
  "signature": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<InboundMessageResponseDto>` · DTO `InboundMessageResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/integrations/dto/responses.dto.ts:200` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/integrations/dto/responses.dto.ts:205` |
| `duplicate` | `boolean` | Sí | — | — | true si se de-duplicó una reentrega | `src/modules/integrations/dto/responses.dto.ts:210` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: Firma del webhook inválida |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conexión no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La conexión no tiene un secreto activo disponible |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/integrations.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Integraciones externas — etapa `ctrl:IntegrationsWebhooksController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

