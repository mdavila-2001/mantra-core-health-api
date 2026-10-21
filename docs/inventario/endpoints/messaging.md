<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `messaging`

- **Bloque:** Integraciones y Contratos (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)
- **Operaciones:** 17 (17 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 1 · MEDIO 13 · BAJO 3
- **Tablas distintas que tocan:** 16
- **Respuestas de error y detalle contractual:** `openapi/endpoints/messaging.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/internal/event-deliveries/{id}/ack` | Registrar el acuse del consumidor sobre una entrega | MEDIO | 2 | SYSTEM, MESSAGING_ADMIN |
| 2 | POST | `/internal/events/{domainEventId}/dispatch` | Repartir el evento entre sus suscriptores | MEDIO | 8 | SYSTEM, MESSAGING_ADMIN |
| 3 | POST | `/internal/jobs/{id}/complete` | Cerrar el trabajo con éxito | MEDIO | 2 | SYSTEM, MESSAGING_ADMIN |
| 4 | POST | `/internal/jobs/{id}/fail` | Registrar el fallo del trabajo | MEDIO | 4 | SYSTEM, MESSAGING_ADMIN |
| 5 | POST | `/internal/notifications/{requestId}/deliver` | Registrar el intento de entrega ante el proveedor | MEDIO | 8 | SYSTEM, MESSAGING_ADMIN |
| 6 | GET | `/internal/notifications/pending` | Listar solicitudes de notificación listas para entregar | MEDIO | 3 | SYSTEM, MESSAGING_ADMIN |
| 7 | POST | `/internal/outbox/relay/run` | Reclamar y publicar un lote del outbox | MEDIO | 2 | SYSTEM, MESSAGING_ADMIN |
| 8 | POST | `/internal/queues/{code}/claim` | Reclamar un lote de trabajos de la cola | BAJO | 2 | SYSTEM, MESSAGING_ADMIN |
| 9 | POST | `/notifications/in-app/{id}/read` | Marcar una notificación in-app como leída | MEDIO | 2 | USER, MESSAGING_ADMIN |
| 10 | POST | `/notifications/in-app/read-all` | Marcar toda mi bandeja como leída | MEDIO | 2 | USER, MESSAGING_ADMIN |
| 11 | GET | `/notifications/me` | Mis notificaciones in-app | BAJO | 1 | USER, MESSAGING_ADMIN |
| 12 | GET | `/notifications/preferences/me` | Mis preferencias de notificación in-app | BAJO | 2 | USER, MESSAGING_ADMIN |
| 13 | PUT | `/notifications/preferences/me` | Guardar mis preferencias de notificación in-app | MEDIO | 3 | USER, MESSAGING_ADMIN |
| 14 | POST | `/notifications/requests` | Crear una solicitud de notificación | MEDIO | 5 | SYSTEM, MESSAGING_ADMIN |
| 15 | POST | `/queues/{code}/jobs` | Encolar un trabajo | MEDIO | 3 | SYSTEM, MESSAGING_ADMIN |
| 16 | POST | `/queues/dead-letter/{deadLetterJobId}/redrive` | Reencolar un trabajo desde la cola muerta | MEDIO | 4 | MESSAGING_ADMIN |
| 17 | POST | `/webhooks/providers/{providerCode}/receipts` | Conciliar el acuse de entrega que envía el proveedor | ALTO | 7 | pública |

---

## 1. POST /internal/event-deliveries/{id}/ack

- **Origen:** CONTRATO
- **Nombre:** Registrar el acuse del consumidor sobre una entrega
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingInternalController.ackDelivery` — `src/modules/messaging/controllers/messaging-internal.controller.ts:96`

### Qué es y para qué sirve (negocio)

Registrar el acuse del consumidor sobre una entrega. Caso de uso UC-35-04: Acuse de entrega del consumidor. Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/messaging/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /internal/event-deliveries/{id}/ack` la atiende `MessagingInternalController.ackDelivery` (src/modules/messaging/controllers/messaging-internal.controller.ts:96). Exige sesión con alguno de los roles SYSTEM, MESSAGING_ADMIN. Valida el cuerpo como `AckEventDeliveryDto` (2 campos, 1 obligatorio). Delega en `OutboxService.ackDelivery`. Actualiza messaging.event_deliveries. Lee messaging.event_deliveries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging-internal.controller.ts:96` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/messaging/controllers/messaging-internal.controller.ts:96` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.event_deliveries` | ESCRIBE | ACTUALIZA | POR_TIPO | MessagingInternalController.ackDelivery → OutboxService.ackDelivery | `src/modules/messaging/services/outbox.service.ts:575` |
| `messaging.event_deliveries` | LEE | LEE | DIRECTA | MessagingInternalController.ackDelivery → OutboxService.ackDelivery → OutboxRepository.findEventDeliveryForUpdate | `src/modules/messaging/repositories/outbox.repository.ts:325` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AckEventDeliveryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `outcome` | `string` | Sí | valores: HANDLED, FAILED | `@IsIn(EVENT_ACK_OUTCOMES)` | — | `src/modules/messaging/dto/messaging.dto.ts:231` |
| `errorText` | `string` | No | — | `@IsOptional()` `@IsString()` | Qué falló; obligatorio si el desenlace es fallo | `src/modules/messaging/dto/messaging.dto.ts:241` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "outcome": "HANDLED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "outcome": "HANDLED",
  "errorText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<EventDeliveryResponseDto>` · DTO `EventDeliveryResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/messaging/dto/messaging.dto.ts:252` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/messaging/dto/messaging.dto.ts:258` |
| `handledAt` | `string` | No | formato date-time | — | Valor de handled at mantenido por la instancia. | `src/modules/messaging/dto/messaging.dto.ts:264` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/messaging/controllers/messaging-internal.controller.spec.ts:73` |

### Flujos

_Se completa en la fase de flujos._

---

## 2. POST /internal/events/{domainEventId}/dispatch

- **Origen:** CONTRATO
- **Nombre:** Repartir el evento entre sus suscriptores
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingInternalController.dispatchEvent` — `src/modules/messaging/controllers/messaging-internal.controller.ts:79`

### Qué es y para qué sirve (negocio)

Repartir el evento entre sus suscriptores. Caso de uso UC-35-03: Despachar a suscriptores. Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/messaging/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /internal/events/{domainEventId}/dispatch` la atiende `MessagingInternalController.dispatchEvent` (src/modules/messaging/controllers/messaging-internal.controller.ts:79). Exige sesión con alguno de los roles SYSTEM, MESSAGING_ADMIN. Valida el cuerpo como `DispatchEventDto` (1 campo, 0 obligatorios). Delega en `OutboxService.dispatchEvent`. Crea filas en messaging.event_deliveries, messaging.queued_jobs. Lee messaging.domain_events, messaging.event_deliveries, messaging.event_subscriptions, messaging.message_queues, messaging.outbox_messages, messaging.queued_jobs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging-internal.controller.ts:79` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: domainEventId | `src/modules/messaging/controllers/messaging-internal.controller.ts:79` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | LEE | LEE | DIRECTA | MessagingInternalController.dispatchEvent → OutboxService.dispatchEvent → OutboxRepository.findDomainEventById | `src/modules/messaging/repositories/outbox.repository.ts:148` |
| `messaging.event_deliveries` | ESCRIBE | CREA | DIRECTA | MessagingInternalController.dispatchEvent → OutboxService.dispatchEvent → OutboxService.fanOutToSubscribers → OutboxRepository.createEventDelivery | `src/modules/messaging/repositories/outbox.repository.ts:291` |
| `messaging.event_deliveries` | LEE | LEE | DIRECTA | MessagingInternalController.dispatchEvent → OutboxService.dispatchEvent → OutboxService.fanOutToSubscribers → OutboxRepository.findEventDelivery | `src/modules/messaging/repositories/outbox.repository.ts:311` |
| `messaging.event_subscriptions` | LEE | LEE | DIRECTA | MessagingInternalController.dispatchEvent → OutboxService.dispatchEvent → OutboxService.fanOutToSubscribers → OutboxRepository.findActiveSubscriptions | `src/modules/messaging/repositories/outbox.repository.ts:250` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | MessagingInternalController.dispatchEvent → OutboxService.dispatchEvent → OutboxService.fanOutToSubscribers → OutboxService.enqueueSubscriberJob → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:72` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | MessagingInternalController.dispatchEvent → OutboxService.dispatchEvent → OutboxRepository.findOutboxByDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:202` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | MessagingInternalController.dispatchEvent → OutboxService.dispatchEvent → OutboxService.fanOutToSubscribers → OutboxService.enqueueSubscriberJob → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:96` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | MessagingInternalController.dispatchEvent → OutboxService.dispatchEvent → OutboxService.fanOutToSubscribers → OutboxService.enqueueSubscriberJob → QueuesRepository.findJobByDedupeKey | `src/modules/messaging/repositories/queues.repository.ts:127` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `domainEventId` | path | Sí | `string` | — |

### Cuerpo — DTO `DispatchEventDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `enqueueJobs` | `boolean` | No | — | `@IsOptional()` | Encolar además un job por suscripción en modo cola | `src/modules/messaging/dto/messaging.dto.ts:150` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "enqueueJobs": true
}
```

</details>

### Respuesta — `Promise<DispatchEventResponseDto>` · DTO `DispatchEventResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `domainEventId` | `string` | Sí | formato uuid | — | Identificador asociado a domain event. | `src/modules/messaging/dto/messaging.dto.ts:199` |
| `matched` | `number` | Sí | — | — | Suscripciones que casaron con el evento | `src/modules/messaging/dto/messaging.dto.ts:205` |
| `filteredOut` | `number` | Sí | — | — | Suscripciones descartadas por su filtro | `src/modules/messaging/dto/messaging.dto.ts:211` |
| `deliveries` | `array<DispatchedSubscriberDto>` | Sí | — | — | Valor de deliveries mantenido por la instancia. | `src/modules/messaging/dto/messaging.dto.ts:217` |
| `deliveries[].subscriptionId` | `string` | Sí | formato uuid | — | Identificador asociado a subscription. | `src/modules/messaging/dto/messaging.dto.ts:161` |
| `deliveries[].subscriberCode` | `string` | Sí | — | — | Valor de subscriber code mantenido por la instancia. | `src/modules/messaging/dto/messaging.dto.ts:167` |
| `deliveries[].deliveryId` | `string` | Sí | formato uuid | — | Identificador asociado a delivery. | `src/modules/messaging/dto/messaging.dto.ts:173` |
| `deliveries[].jobId` | `string` | No | formato uuid | — | Job encolado si el modo es cola | `src/modules/messaging/dto/messaging.dto.ts:182` |
| `deliveries[].duplicate` | `boolean` | Sí | — | — | true si la entrega ya existía y no se duplicó | `src/modules/messaging/dto/messaging.dto.ts:188` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/messaging/controllers/messaging-internal.controller.spec.ts:63` |

### Flujos

_Se completa en la fase de flujos._

---

## 3. POST /internal/jobs/{id}/complete

- **Origen:** CONTRATO
- **Nombre:** Cerrar el trabajo con éxito
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingInternalController.completeJob` — `src/modules/messaging/controllers/messaging-internal.controller.ts:126`

### Qué es y para qué sirve (negocio)

Cerrar el trabajo con éxito. Caso de uso UC-35-07: Completar job y liberar lock. Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/messaging/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /internal/jobs/{id}/complete` la atiende `MessagingInternalController.completeJob` (src/modules/messaging/controllers/messaging-internal.controller.ts:126). Exige sesión con alguno de los roles SYSTEM, MESSAGING_ADMIN. Valida el cuerpo como `CompleteJobDto` (2 campos, 1 obligatorio). Delega en `QueuesService.completeJob`. Actualiza messaging.queued_jobs. Lee messaging.queued_jobs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging-internal.controller.ts:126` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/messaging/controllers/messaging-internal.controller.ts:126` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.queued_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | MessagingInternalController.completeJob → QueuesService.completeJob | `src/modules/messaging/services/queues.service.ts:209` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | MessagingInternalController.completeJob → QueuesService.completeJob → QueuesRepository.findJobForUpdate | `src/modules/messaging/repositories/queues.repository.ts:149` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CompleteJobDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `workerId` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Worker que lo tiene reservado | `src/modules/messaging/dto/messaging.dto.ts:472` |
| `resultJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Resultado del handler | `src/modules/messaging/dto/messaging.dto.ts:480` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "workerId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "workerId": "00000000-0000-4000-8000-000000000001",
  "resultJson": {}
}
```

</details>

### Respuesta — `Promise<JobResponseDto>` · DTO `JobResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/messaging/dto/messaging.dto.ts:354` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/messaging/dto/messaging.dto.ts:360` |
| `duplicate` | `boolean` | Sí | — | — | true si ya había un job con esa clave y se devuelve el mismo | `src/modules/messaging/dto/messaging.dto.ts:368` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/messaging/controllers/messaging-internal.controller.spec.ts:93` |

### Flujos

_Se completa en la fase de flujos._

---

## 4. POST /internal/jobs/{id}/fail

- **Origen:** CONTRATO
- **Nombre:** Registrar el fallo del trabajo
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingInternalController.failJob` — `src/modules/messaging/controllers/messaging-internal.controller.ts:141`

### Qué es y para qué sirve (negocio)

Registrar el fallo del trabajo. Caso de uso UC-35-08: Reintento con backoff o cola muerta. Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/messaging/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /internal/jobs/{id}/fail` la atiende `MessagingInternalController.failJob` (src/modules/messaging/controllers/messaging-internal.controller.ts:141). Exige sesión con alguno de los roles SYSTEM, MESSAGING_ADMIN. Valida el cuerpo como `FailJobDto` (2 campos, 2 obligatorios). Delega en `QueuesService.failJob`. Crea filas en messaging.dead_letter_jobs. Actualiza messaging.queued_jobs. Lee messaging.message_queues, messaging.queued_jobs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging-internal.controller.ts:141` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/messaging/controllers/messaging-internal.controller.ts:141` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.dead_letter_jobs` | ESCRIBE | CREA | DIRECTA | MessagingInternalController.failJob → QueuesService.failJob → QueuesRepository.createDeadLetterJob | `src/modules/messaging/repositories/queues.repository.ts:219` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | MessagingInternalController.failJob → QueuesService.failJob → QueuesService.deadLetterQueueId → QueuesRepository.findQueueById | `src/modules/messaging/repositories/queues.repository.ts:83` |
| `messaging.queued_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | MessagingInternalController.failJob → QueuesService.failJob | `src/modules/messaging/services/queues.service.ts:252` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | MessagingInternalController.failJob → QueuesService.failJob → QueuesRepository.findJobForUpdate | `src/modules/messaging/repositories/queues.repository.ts:149` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `FailJobDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `workerId` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Worker que lo tiene reservado | `src/modules/messaging/dto/messaging.dto.ts:491` |
| `errorText` | `string` | Sí | — | `@IsString()` | Qué falló | `src/modules/messaging/dto/messaging.dto.ts:498` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "workerId": "00000000-0000-4000-8000-000000000001",
  "errorText": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "workerId": "00000000-0000-4000-8000-000000000001",
  "errorText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<FailJobResponseDto>` · DTO `FailJobResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/messaging/dto/messaging.dto.ts:509` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/messaging/dto/messaging.dto.ts:515` |
| `attempts` | `number` | Sí | — | — | Valor de attempts mantenido por la instancia. | `src/modules/messaging/dto/messaging.dto.ts:521` |
| `availableAt` | `string` | No | formato date-time | — | Cuándo se reintenta; ausente si agotó los intentos | `src/modules/messaging/dto/messaging.dto.ts:530` |
| `deadLetterJobId` | `string` | No | formato uuid | — | Entrada de cola muerta si agotó | `src/modules/messaging/dto/messaging.dto.ts:539` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/messaging/controllers/messaging-internal.controller.spec.ts:103` |

### Flujos

_Se completa en la fase de flujos._

---

## 5. POST /internal/notifications/{requestId}/deliver

- **Origen:** CONTRATO
- **Nombre:** Registrar el intento de entrega ante el proveedor
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingInternalController.deliverNotification` — `src/modules/messaging/controllers/messaging-internal.controller.ts:174`

### Qué es y para qué sirve (negocio)

Registrar el intento de entrega ante el proveedor. Caso de uso UC-35-11: Entrega multicanal. Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/messaging/README.md:25`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /internal/notifications/{requestId}/deliver` la atiende `MessagingInternalController.deliverNotification` (src/modules/messaging/controllers/messaging-internal.controller.ts:174). Exige sesión con alguno de los roles SYSTEM, MESSAGING_ADMIN. Valida el cuerpo como `DeliverNotificationDto` (9 campos, 1 obligatorio). Delega en `NotificationsService.deliverNotification`. Crea filas en messaging.in_app_notifications, messaging.notification_deliveries. Actualiza messaging.notification_requests. Lee messaging.message_channels, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging-internal.controller.ts:174` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: requestId | `src/modules/messaging/controllers/messaging-internal.controller.ts:174` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | MessagingInternalController.deliverNotification → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | MessagingInternalController.deliverNotification → NotificationsService.deliverNotification → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | MessagingInternalController.deliverNotification → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | MessagingInternalController.deliverNotification → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | MessagingInternalController.deliverNotification → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | MessagingInternalController.deliverNotification → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | MessagingInternalController.deliverNotification → NotificationsService.deliverNotification → NotificationsRepository.findRequestForUpdate | `src/modules/messaging/repositories/notifications.repository.ts:330` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | MessagingInternalController.deliverNotification → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `requestId` | path | Sí | `string` | — |

### Cuerpo — DTO `DeliverNotificationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `outcome` | `string` | Sí | valores: SENT, FAILED | `@IsIn(DELIVERY_ATTEMPT_OUTCOMES)` | Qué respondió el proveedor | `src/modules/messaging/dto/messaging.dto.ts:858` |
| `providerChannelConfigId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Configuración de proveedor usada | `src/modules/messaging/dto/messaging.dto.ts:869` |
| `providerMessageRef` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Referencia del mensaje en el proveedor | `src/modules/messaging/dto/messaging.dto.ts:881` |
| `errorCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/messaging/dto/messaging.dto.ts:890` |
| `errorText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/messaging/dto/messaging.dto.ts:898` |
| `costAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Coste del envío, como cadena decimal | `src/modules/messaging/dto/messaging.dto.ts:906` |
| `currencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/messaging/dto/messaging.dto.ts:914` |
| `subject` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Asunto del mensaje in-app | `src/modules/messaging/dto/messaging.dto.ts:926` |
| `bodyText` | `string` | No | — | `@IsOptional()` `@IsString()` | Cuerpo del mensaje in-app | `src/modules/messaging/dto/messaging.dto.ts:934` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "outcome": "SENT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<DeliverNotificationResponseDto>` · DTO `DeliverNotificationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `deliveryId` | `string` | Sí | formato uuid | — | Intento registrado | `src/modules/messaging/dto/messaging.dto.ts:945` |
| `attemptNumber` | `number` | Sí | — | — | Valor de attempt number mantenido por la instancia. | `src/modules/messaging/dto/messaging.dto.ts:951` |
| `deliveryStatusConceptId` | `string` | Sí | formato uuid | — | Estado del intento | `src/modules/messaging/dto/messaging.dto.ts:957` |
| `requestStatusConceptId` | `string` | Sí | formato uuid | — | Estado en el que queda la solicitud | `src/modules/messaging/dto/messaging.dto.ts:966` |
| `inAppNotificationId` | `string` | No | formato uuid | — | Notificación in-app creada | `src/modules/messaging/dto/messaging.dto.ts:975` |
| `duplicate` | `boolean` | Sí | — | — | true si ese intento ya estaba registrado | `src/modules/messaging/dto/messaging.dto.ts:981` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/messaging/controllers/messaging-internal.controller.spec.ts:115` |

### Flujos

_Se completa en la fase de flujos._

---

## 6. GET /internal/notifications/pending

- **Origen:** CONTRATO
- **Nombre:** Listar solicitudes de notificación listas para entregar
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingInternalController.listPendingNotifications` — `src/modules/messaging/controllers/messaging-internal.controller.ts:162`

### Qué es y para qué sirve (negocio)

Listar solicitudes de notificación listas para entregar. Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`GET /internal/notifications/pending` la atiende `MessagingInternalController.listPendingNotifications` (src/modules/messaging/controllers/messaging-internal.controller.ts:162). Exige sesión con alguno de los roles SYSTEM, MESSAGING_ADMIN. Delega en `NotificationsService.listDeliverable`. Actualiza messaging.notification_requests. Lee messaging.message_channels, messaging.notification_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging-internal.controller.ts:162` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.message_channels` | LEE | LEE | DIRECTA | MessagingInternalController.listPendingNotifications → NotificationsService.listDeliverable → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | MessagingInternalController.listPendingNotifications → NotificationsService.listDeliverable | `src/modules/messaging/services/notifications.service.ts:286` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | MessagingInternalController.listPendingNotifications → NotificationsService.listDeliverable → NotificationsRepository.findClaimableRequests | `src/modules/messaging/repositories/notifications.repository.ts:359` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PendingNotificationsResponseDto>` · DTO `PendingNotificationsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `requests` | `array<PendingNotificationRequestDto>` | Sí | — | — | Valor de requests mantenido por la instancia. | `src/modules/messaging/dto/messaging.dto.ts:841` |
| `requests[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/messaging/dto/messaging.dto.ts:791` |
| `requests[].channelId` | `string` | Sí | formato uuid | — | Identificador asociado a channel. | `src/modules/messaging/dto/messaging.dto.ts:797` |
| `requests[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/messaging/dto/messaging.dto.ts:803` |
| `requests[].payloadJson` | `object` | No | — | — | Carga de la solicitud | `src/modules/messaging/dto/messaging.dto.ts:809` |
| `requests[].recipientAddress` | `string` | No | — | — | Valor de recipient address mantenido por la instancia. | `src/modules/messaging/dto/messaging.dto.ts:815` |
| `requests[].recipientUserId` | `string` | No | formato uuid | — | Identificador asociado a recipient user. | `src/modules/messaging/dto/messaging.dto.ts:821` |
| `requests[].channelTypeConceptId` | `string` | No | formato uuid | — | Tipo del canal (correo, in-app…). Viaja con el lote porque el worker necesita saber si hay un tercero al que llamar **antes** de llamarlo: una notificación in-app no sale a ningún proveedor, y sin este dato el adaptador por defecto la marcaba `FAILED` con `PROVIDER_NOT_CONFIGURED` — un fallo inventado por preguntarle a un proveedor que para ese canal no tiene que existir. | `src/modules/messaging/dto/messaging.dto.ts:832` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/messaging/controllers/messaging-internal.controller.spec.ts:128` |

### Flujos

_Se completa en la fase de flujos._

---

## 7. POST /internal/outbox/relay/run

- **Origen:** CONTRATO
- **Nombre:** Reclamar y publicar un lote del outbox
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingInternalController.runRelay` — `src/modules/messaging/controllers/messaging-internal.controller.ts:67`

### Qué es y para qué sirve (negocio)

Reclamar y publicar un lote del outbox. Caso de uso UC-35-02: Reclamar y publicar mensajes (relay). Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/messaging/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /internal/outbox/relay/run` la atiende `MessagingInternalController.runRelay` (src/modules/messaging/controllers/messaging-internal.controller.ts:67). Exige sesión con alguno de los roles SYSTEM, MESSAGING_ADMIN. Valida el cuerpo como `RunOutboxRelayDto` (3 campos, 1 obligatorio). Delega en `OutboxService.runRelay`. Actualiza messaging.outbox_messages. Lee messaging.outbox_messages.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging-internal.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.outbox_messages` | ESCRIBE | ACTUALIZA | POR_TIPO | MessagingInternalController.runRelay → OutboxService.runRelay | `src/modules/messaging/services/outbox.service.ts:328` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | MessagingInternalController.runRelay → OutboxService.runRelay → OutboxRepository.claimPendingOutbox | `src/modules/messaging/repositories/outbox.repository.ts:217` |

### Cuerpo — DTO `RunOutboxRelayDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `workerId` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Identificador del worker que reclama el lote | `src/modules/messaging/dto/messaging.dto.ts:42` |
| `batchSize` | `number` | No | mínimo 1; máximo 500 | `@IsOptional()` `@IsInt()` `@Min(1)` | Tamaño del lote | `src/modules/messaging/dto/messaging.dto.ts:56` |
| `visibilityTimeoutSeconds` | `number` | No | mínimo 5 | `@IsOptional()` `@IsInt()` `@Min(5)` | Segundos que el lote queda reservado para este worker | `src/modules/messaging/dto/messaging.dto.ts:69` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "workerId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "workerId": "00000000-0000-4000-8000-000000000001",
  "batchSize": 50,
  "visibilityTimeoutSeconds": 60
}
```

</details>

### Respuesta — `Promise<OutboxRelayResponseDto>` · DTO `OutboxRelayResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `claimed` | `number` | Sí | — | — | Mensajes reclamados en este lote | `src/modules/messaging/dto/messaging.dto.ts:115` |
| `published` | `number` | Sí | — | — | Mensajes que pasaron a publicados | `src/modules/messaging/dto/messaging.dto.ts:121` |
| `exhausted` | `number` | Sí | — | — | Mensajes que agotaron sus intentos | `src/modules/messaging/dto/messaging.dto.ts:127` |
| `messages` | `array<RelayedMessageDto>` | Sí | — | — | Valor de messages mantenido por la instancia. | `src/modules/messaging/dto/messaging.dto.ts:133` |
| `messages[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/messaging/dto/messaging.dto.ts:80` |
| `messages[].domainEventId` | `string` | Sí | formato uuid | — | Identificador asociado a domain event. | `src/modules/messaging/dto/messaging.dto.ts:86` |
| `messages[].idempotencyKey` | `string` | Sí | — | — | Valor de idempotency key mantenido por la instancia. | `src/modules/messaging/dto/messaging.dto.ts:92` |
| `messages[].statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/messaging/dto/messaging.dto.ts:98` |
| `messages[].attempts` | `number` | Sí | — | — | Valor de attempts mantenido por la instancia. | `src/modules/messaging/dto/messaging.dto.ts:104` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/outbox-relay-race.int-spec.ts:67` |
| CONTROLADOR | `src/modules/messaging/controllers/messaging-internal.controller.spec.ts:53` |

### Flujos

_Se completa en la fase de flujos._

---

## 8. POST /internal/queues/{code}/claim

- **Origen:** CONTRATO
- **Nombre:** Reclamar un lote de trabajos de la cola
- **Bloque:** Integraciones y Contratos
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingInternalController.claimJobs` — `src/modules/messaging/controllers/messaging-internal.controller.ts:110`

### Qué es y para qué sirve (negocio)

Reclamar un lote de trabajos de la cola. Caso de uso UC-35-06: Reclamar jobs (SKIP LOCKED). Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/messaging/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /internal/queues/{code}/claim` la atiende `MessagingInternalController.claimJobs` (src/modules/messaging/controllers/messaging-internal.controller.ts:110). Exige sesión con alguno de los roles SYSTEM, MESSAGING_ADMIN. Valida el cuerpo como `ClaimJobsDto` (2 campos, 1 obligatorio). Delega en `QueuesService.claimJobs`. Lee messaging.message_queues, messaging.queued_jobs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging-internal.controller.ts:110` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.message_queues` | LEE | LEE | DIRECTA | MessagingInternalController.claimJobs → QueuesService.claimJobs → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:72` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | MessagingInternalController.claimJobs → QueuesService.claimJobs → QueuesRepository.claimReadyJobs | `src/modules/messaging/repositories/queues.repository.ts:171` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `code` | path | Sí | `string` | — |

### Cuerpo — DTO `ClaimJobsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `workerId` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Identificador del worker | `src/modules/messaging/dto/messaging.dto.ts:383` |
| `batchSize` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Cuántos jobs reclamar | `src/modules/messaging/dto/messaging.dto.ts:396` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "workerId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "workerId": "00000000-0000-4000-8000-000000000001",
  "batchSize": 10
}
```

</details>

### Respuesta — `Promise<ClaimJobsResponseDto>` · DTO `ClaimJobsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `queueId` | `string` | Sí | formato uuid | — | Identificador asociado a queue. | `src/modules/messaging/dto/messaging.dto.ts:445` |
| `jobs` | `array<ClaimedJobDto>` | Sí | — | — | Valor de jobs mantenido por la instancia. | `src/modules/messaging/dto/messaging.dto.ts:451` |
| `jobs[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/messaging/dto/messaging.dto.ts:407` |
| `jobs[].jobType` | `string` | Sí | — | — | Valor de job type mantenido por la instancia. | `src/modules/messaging/dto/messaging.dto.ts:413` |
| `jobs[].payloadJson` | `object` | Sí | — | — | Carga del trabajo | `src/modules/messaging/dto/messaging.dto.ts:419` |
| `jobs[].attempts` | `number` | Sí | — | — | Valor de attempts mantenido por la instancia. | `src/modules/messaging/dto/messaging.dto.ts:425` |
| `jobs[].lockExpiresAt` | `string` | Sí | formato date-time | — | Hasta cuándo el job es de este worker | `src/modules/messaging/dto/messaging.dto.ts:434` |
| `claimed` | `number` | Sí | — | — | Valor de claimed mantenido por la instancia. | `src/modules/messaging/dto/messaging.dto.ts:457` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/messaging/controllers/messaging-internal.controller.spec.ts:83` |

### Flujos

_Se completa en la fase de flujos._

---

## 9. POST /notifications/in-app/{id}/read

- **Origen:** CONTRATO
- **Nombre:** Marcar una notificación in-app como leída
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingController.markInAppRead` — `src/modules/messaging/controllers/messaging.controller.ts:180`

### Qué es y para qué sirve (negocio)

Marcar una notificación in-app como leída. Caso de uso UC-35-13: Marcar in-app como leída. Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/messaging/README.md:27`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /notifications/in-app/{id}/read` la atiende `MessagingController.markInAppRead` (src/modules/messaging/controllers/messaging.controller.ts:180). Exige sesión con alguno de los roles USER, MESSAGING_ADMIN. Delega en `NotificationsService.markInAppRead`. Actualiza messaging.in_app_notifications. Lee messaging.in_app_notifications.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: USER, MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging.controller.ts:180` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/messaging/controllers/messaging.controller.ts:180` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.in_app_notifications` | ESCRIBE | ACTUALIZA | POR_TIPO | MessagingController.markInAppRead → NotificationsService.markInAppRead | `src/modules/messaging/services/notifications.service.ts:664` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | MessagingController.markInAppRead → NotificationsService.markInAppRead → NotificationsRepository.findInAppForUpdate | `src/modules/messaging/repositories/notifications.repository.ts:745` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<InAppReadResponseDto>` · DTO `InAppReadResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/messaging/dto/messaging.dto.ts:1103` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/messaging/dto/messaging.dto.ts:1109` |
| `readAt` | `string` | Sí | formato date-time | — | Se conserva la primera lectura | `src/modules/messaging/dto/messaging.dto.ts:1118` |
| `alreadyRead` | `boolean` | Sí | — | — | true si ya estaba leída | `src/modules/messaging/dto/messaging.dto.ts:1124` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/messaging/controllers/messaging.controller.spec.ts:82` |

### Flujos

_Se completa en la fase de flujos._

---

## 10. POST /notifications/in-app/read-all

- **Origen:** CONTRATO
- **Nombre:** Marcar toda mi bandeja como leída
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingController.markAllInAppRead` — `src/modules/messaging/controllers/messaging.controller.ts:129`

### Qué es y para qué sirve (negocio)

Marcar toda mi bandeja como leída. Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /notifications/in-app/read-all` la atiende `MessagingController.markAllInAppRead` (src/modules/messaging/controllers/messaging.controller.ts:129). Exige sesión con alguno de los roles USER, MESSAGING_ADMIN. Delega en `NotificationsService.markAllInAppRead`. Actualiza messaging.in_app_notifications. Lee messaging.in_app_notifications.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: USER, MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging.controller.ts:129` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.in_app_notifications` | ESCRIBE | ACTUALIZA | POR_TIPO | MessagingController.markAllInAppRead → NotificationsService.markAllInAppRead | `src/modules/messaging/services/notifications.service.ts:824` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | MessagingController.markAllInAppRead → NotificationsService.markAllInAppRead → NotificationsRepository.findUnreadInApp | `src/modules/messaging/repositories/notifications.repository.ts:895` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MarkAllInAppReadResponseDto>` · DTO `MarkAllInAppReadResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `marked` | `number` | Sí | — | — | Cuántas se marcaron en esta pasada. | `src/modules/messaging/dto/in-app.dto.ts:147` |
| `unreadCount` | `number` | Sí | — | — | Cuántas quedan sin leer después de marcar. | `src/modules/messaging/dto/in-app.dto.ts:151` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 11. GET /notifications/me

- **Origen:** CONTRATO
- **Nombre:** Mis notificaciones in-app
- **Bloque:** Integraciones y Contratos
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingController.listMyNotifications` — `src/modules/messaging/controllers/messaging.controller.ts:108`

### Qué es y para qué sirve (negocio)

Mis notificaciones in-app. Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`GET /notifications/me` la atiende `MessagingController.listMyNotifications` (src/modules/messaging/controllers/messaging.controller.ts:108). Exige sesión con alguno de los roles USER, MESSAGING_ADMIN. Delega en `NotificationsService.listMine`. Lee messaging.in_app_notifications.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: USER, MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging.controller.ts:108` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | MessagingController.listMyNotifications → NotificationsService.listMine → NotificationsRepository.listInAppPage | `src/modules/messaging/repositories/notifications.repository.ts:810` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `unread` | query | No | `boolean` | Sólo las no leídas |
| `cursor` | query | No | `string` | Cursor de la página anterior |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<InAppNotificationPageDto>` · DTO `InAppNotificationPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<InAppNotificationDto>` | Sí | — | — | Las notificaciones de la página, de la más reciente a la más vieja. | `src/modules/messaging/dto/in-app.dto.ts:119` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la notificación. | `src/modules/messaging/dto/in-app.dto.ts:74` |
| `items[].category` | `object` | No | — | — | Categoría en el vocabulario del contrato (`CLINICAL`, `MESSAGES`…). Va resuelta y no como concept id: el front tendría que mantener una tabla de uuids para poder decir «clínica» en la pantalla de preferencias, y esa tabla se desincroniza el día que alguien vuelve a sembrar. | `src/modules/messaging/dto/in-app.dto.ts:84` |
| `items[].subject` | `string` | No | admite null | — | Título corto. | `src/modules/messaging/dto/in-app.dto.ts:88` |
| `items[].bodyText` | `string` | No | admite null | — | Cuerpo de una o dos líneas. | `src/modules/messaging/dto/in-app.dto.ts:92` |
| `items[].destination` | `NotificationDestinationDto` | No | — | — | A dónde lleva al abrirla, si lleva a algo. | `src/modules/messaging/dto/in-app.dto.ts:96` |
| `items[].destination.type` | `string` | No | — | — | Clase de objeto: PRESCRIPTION, CONVERSATION… | `src/modules/messaging/dto/in-app.dto.ts:63` |
| `items[].destination.id` | `string` | No | formato uuid | — | Identificador de ese objeto. | `src/modules/messaging/dto/in-app.dto.ts:67` |
| `items[].payloadJson` | `object` | No | — | — | Datos extra que la pantalla de destino quiera aprovechar. | `src/modules/messaging/dto/in-app.dto.ts:100` |
| `items[].unread` | `boolean` | Sí | — | — | `true` mientras siga sin leer. | `src/modules/messaging/dto/in-app.dto.ts:104` |
| `items[].availableAt` | `string` | Sí | formato date-time | — | Cuándo quedó disponible para el destinatario. | `src/modules/messaging/dto/in-app.dto.ts:108` |
| `items[].readAt` | `string` | No | formato date-time; admite null | — | Cuándo la leyó, si la leyó. | `src/modules/messaging/dto/in-app.dto.ts:112` |
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/messaging/dto/in-app.dto.ts:123` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/messaging/dto/in-app.dto.ts:127` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/messaging/dto/in-app.dto.ts:131` |
| `unreadCount` | `number` | Sí | — | — | Cuántas quedan sin leer **en total**, no en esta página. Viaja con cada página porque es el número del badge, y pedirlo aparte obligaría a la campana a hacer dos llamadas por cada tic de sondeo. | `src/modules/messaging/dto/in-app.dto.ts:140` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 12. GET /notifications/preferences/me

- **Origen:** CONTRATO
- **Nombre:** Mis preferencias de notificación in-app
- **Bloque:** Integraciones y Contratos
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingController.readMyPreferences` — `src/modules/messaging/controllers/messaging.controller.ts:148`

### Qué es y para qué sirve (negocio)

Mis preferencias de notificación in-app. Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`GET /notifications/preferences/me` la atiende `MessagingController.readMyPreferences` (src/modules/messaging/controllers/messaging.controller.ts:148). Exige sesión con alguno de los roles USER, MESSAGING_ADMIN. Delega en `NotificationsService.readMyPreferences`. Lee messaging.message_channels, messaging.recipient_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: USER, MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging.controller.ts:148` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.message_channels` | LEE | LEE | DIRECTA | MessagingController.readMyPreferences → NotificationsService.readMyPreferences → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | MessagingController.readMyPreferences → NotificationsService.readMyPreferences → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyPreferencesDto>` · DTO `MyPreferencesDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `categories` | `array<CategoryPreferenceDto>` | Sí | — | — | Decisión por categoría: **siempre las cuatro**, aunque nunca las tocó. | `src/modules/messaging/dto/in-app.dto.ts:234` |
| `categories[].category` | `string` | Sí | valores: CLINICAL, SCHEDULING, MESSAGES, SOCIAL | `@IsIn(NOTIFICATION_CATEGORIES)` | — | `src/modules/messaging/dto/in-app.dto.ts:193` |
| `categories[].optedIn` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/messaging/dto/in-app.dto.ts:198` |
| `quietHours` | `QuietHoursDto` | No | — | — | Ventana de silencio, o `null` si no configuró ninguna. | `src/modules/messaging/dto/in-app.dto.ts:238` |
| `quietHours.start` | `string` | No | patrón runtime /^([01]\d\|2[0-3]):[0-5]\d$/ | `@IsString()` `@Matches(/^([01]\d\|2[0-3]):[0-5]\d$/, { message: 'La hora de inicio debe tener el formato HH:mm', })` | — | `src/modules/messaging/dto/in-app.dto.ts:172` |
| `quietHours.end` | `string` | No | patrón runtime /^([01]\d\|2[0-3]):[0-5]\d$/ | `@IsString()` `@Matches(/^([01]\d\|2[0-3]):[0-5]\d$/, { message: 'La hora de fin debe tener el formato HH:mm', })` | — | `src/modules/messaging/dto/in-app.dto.ts:185` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 13. PUT /notifications/preferences/me

- **Origen:** CONTRATO
- **Nombre:** Guardar mis preferencias de notificación in-app
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingController.updateMyPreferences` — `src/modules/messaging/controllers/messaging.controller.ts:166`

### Qué es y para qué sirve (negocio)

Guardar mis preferencias de notificación in-app. Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`PUT /notifications/preferences/me` la atiende `MessagingController.updateMyPreferences` (src/modules/messaging/controllers/messaging.controller.ts:166). Exige sesión con alguno de los roles USER, MESSAGING_ADMIN. Valida el cuerpo como `UpdateMyPreferencesDto` (6 campos, 0 obligatorios). Delega en `NotificationsService.updateMyPreferences`. Crea filas en messaging.recipient_preferences. Lee messaging.message_channels, messaging.recipient_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: USER, MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging.controller.ts:166` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.message_channels` | LEE | LEE | DIRECTA | MessagingController.updateMyPreferences → NotificationsService.updateMyPreferences → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.recipient_preferences` | ESCRIBE | CREA | DIRECTA | MessagingController.updateMyPreferences → NotificationsService.updateMyPreferences → NotificationsRepository.createPreference | `src/modules/messaging/repositories/notifications.repository.ts:241` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | MessagingController.updateMyPreferences → NotificationsService.updateMyPreferences → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |

### Cuerpo — DTO `UpdateMyPreferencesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `categories` | `array<CategoryPreferenceDto>` | No | — | `@IsOptional()` `@ValidateNested({ each: true })` `@Type(() => CategoryPreferenceDto)` | — | `src/modules/messaging/dto/in-app.dto.ts:215` |
| `categories[].category` | `string` | No | valores: CLINICAL, SCHEDULING, MESSAGES, SOCIAL | `@IsIn(NOTIFICATION_CATEGORIES)` | — | `src/modules/messaging/dto/in-app.dto.ts:193` |
| `categories[].optedIn` | `boolean` | No | — | `@IsBoolean()` | — | `src/modules/messaging/dto/in-app.dto.ts:198` |
| `quietHours` | `QuietHoursDto` | No | admite null | `@IsOptional()` `@ValidateNested()` `@Type(() => QuietHoursDto)` | — | `src/modules/messaging/dto/in-app.dto.ts:227` |
| `quietHours.start` | `string` | No | — | — | — | sin fuente |
| `quietHours.end` | `string` | No | — | — | — | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "categories": [
    {
      "category": "CLINICAL",
      "optedIn": true
    }
  ],
  "quietHours": {
    "start": "22:00",
    "end": "07:00"
  }
}
```

</details>

### Respuesta — `Promise<MyPreferencesDto>` · DTO `MyPreferencesDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `categories` | `array<CategoryPreferenceDto>` | Sí | — | — | Decisión por categoría: **siempre las cuatro**, aunque nunca las tocó. | `src/modules/messaging/dto/in-app.dto.ts:234` |
| `categories[].category` | `string` | Sí | valores: CLINICAL, SCHEDULING, MESSAGES, SOCIAL | `@IsIn(NOTIFICATION_CATEGORIES)` | — | `src/modules/messaging/dto/in-app.dto.ts:193` |
| `categories[].optedIn` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/messaging/dto/in-app.dto.ts:198` |
| `quietHours` | `QuietHoursDto` | No | — | — | Ventana de silencio, o `null` si no configuró ninguna. | `src/modules/messaging/dto/in-app.dto.ts:238` |
| `quietHours.start` | `string` | No | patrón runtime /^([01]\d\|2[0-3]):[0-5]\d$/ | `@IsString()` `@Matches(/^([01]\d\|2[0-3]):[0-5]\d$/, { message: 'La hora de inicio debe tener el formato HH:mm', })` | — | `src/modules/messaging/dto/in-app.dto.ts:172` |
| `quietHours.end` | `string` | No | patrón runtime /^([01]\d\|2[0-3]):[0-5]\d$/ | `@IsString()` `@Matches(/^([01]\d\|2[0-3]):[0-5]\d$/, { message: 'La hora de fin debe tener el formato HH:mm', })` | — | `src/modules/messaging/dto/in-app.dto.ts:185` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 14. POST /notifications/requests

- **Origen:** CONTRATO
- **Nombre:** Crear una solicitud de notificación
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingController.createNotificationRequest` — `src/modules/messaging/controllers/messaging.controller.ts:82`

### Qué es y para qué sirve (negocio)

Crear una solicitud de notificación. Caso de uso UC-35-10: Solicitud consciente del consentimiento. Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/messaging/README.md:24`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /notifications/requests` la atiende `MessagingController.createNotificationRequest` (src/modules/messaging/controllers/messaging.controller.ts:82). Exige sesión con alguno de los roles SYSTEM, MESSAGING_ADMIN. Valida el cuerpo como `CreateNotificationRequestDto` (14 campos, 1 obligatorio). Delega en `NotificationsService.createRequest`. Crea filas en messaging.notification_requests. Lee messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging.controller.ts:82` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.message_channels` | LEE | LEE | DIRECTA | MessagingController.createNotificationRequest → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | MessagingController.createNotificationRequest → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | MessagingController.createNotificationRequest → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | MessagingController.createNotificationRequest → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | MessagingController.createNotificationRequest → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |

### Cuerpo — DTO `CreateNotificationRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `channelId` | `string` | Sí | formato uuid | `@IsUUID()` | Canal por el que se notifica | `src/modules/messaging/dto/messaging.dto.ts:609` |
| `recipientUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Destinatario interno | `src/modules/messaging/dto/messaging.dto.ts:617` |
| `recipientAddress` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Dirección de destino si el canal es externo | `src/modules/messaging/dto/messaging.dto.ts:629` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/messaging/dto/messaging.dto.ts:637` |
| `templateId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Plantilla publicada a usar | `src/modules/messaging/dto/messaging.dto.ts:648` |
| `domainEventId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Evento de dominio que la origina | `src/modules/messaging/dto/messaging.dto.ts:659` |
| `payloadJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Variables de la plantilla. PHI mínima. | `src/modules/messaging/dto/messaging.dto.ts:669` |
| `debounceKey` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Clave de rebote; colapsa notificaciones repetidas | `src/modules/messaging/dto/messaging.dto.ts:681` |
| `priority` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Menor gana | `src/modules/messaging/dto/messaging.dto.ts:690` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría (catálogo abierto) | `src/modules/messaging/dto/messaging.dto.ts:701` |
| `consentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Consentimiento vigente que la autoriza | `src/modules/messaging/dto/messaging.dto.ts:712` |
| `scheduledAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo debe salir | `src/modules/messaging/dto/messaging.dto.ts:723` |
| `relatedResourceType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/messaging/dto/messaging.dto.ts:732` |
| `relatedResourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/messaging/dto/messaging.dto.ts:740` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "channelId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<NotificationRequestResponseDto>` · DTO `NotificationRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/messaging/dto/messaging.dto.ts:751` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/messaging/dto/messaging.dto.ts:757` |
| `suppressed` | `boolean` | Sí | — | — | true si quedó suprimida por consentimiento o preferencia | `src/modules/messaging/dto/messaging.dto.ts:765` |
| `suppressionReason` | `string` | No | — | — | Por qué se suprimió | `src/modules/messaging/dto/messaging.dto.ts:771` |
| `debounced` | `boolean` | Sí | — | — | true si otra solicitud viva tenía la misma clave de rebote | `src/modules/messaging/dto/messaging.dto.ts:779` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/messaging/controllers/messaging.controller.spec.ts:70` |

### Flujos

_Se completa en la fase de flujos._

---

## 15. POST /queues/{code}/jobs

- **Origen:** CONTRATO
- **Nombre:** Encolar un trabajo
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingController.enqueueJob` — `src/modules/messaging/controllers/messaging.controller.ts:48`

### Qué es y para qué sirve (negocio)

Encolar un trabajo. Caso de uso UC-35-05: Encolar job con deduplicación. Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/messaging/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /queues/{code}/jobs` la atiende `MessagingController.enqueueJob` (src/modules/messaging/controllers/messaging.controller.ts:48). Exige sesión con alguno de los roles SYSTEM, MESSAGING_ADMIN. Valida el cuerpo como `EnqueueJobDto` (7 campos, 3 obligatorios). Delega en `QueuesService.enqueueJob`. Crea filas en messaging.queued_jobs. Lee messaging.message_queues, messaging.queued_jobs. Encola un trabajo calculado (code).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging.controller.ts:48` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.message_queues` | LEE | LEE | DIRECTA | MessagingController.enqueueJob → QueuesService.enqueueJob → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:72` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | MessagingController.enqueueJob → QueuesService.enqueueJob → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:96` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | MessagingController.enqueueJob → QueuesService.enqueueJob → QueuesRepository.findJobByDedupeKey | `src/modules/messaging/repositories/queues.repository.ts:127` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Trabajo encolado | calculado: `code` | `src/modules/messaging/controllers/messaging.controller.ts:61` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `code` | path | Sí | `string` | — |

### Cuerpo — DTO `EnqueueJobDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `jobType` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Tipo de trabajo que el handler reconoce | `src/modules/messaging/dto/messaging.dto.ts:282` |
| `dedupeKey` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | Clave de deduplicación; colapsa los encolados repetidos | `src/modules/messaging/dto/messaging.dto.ts:293` |
| `payloadJson` | `object` | Sí | — | `@IsObject()` | Carga del trabajo | `src/modules/messaging/dto/messaging.dto.ts:300` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/messaging/dto/messaging.dto.ts:308` |
| `priority` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Menor gana; por defecto, el de la cola | `src/modules/messaging/dto/messaging.dto.ts:320` |
| `maxAttempts` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Intentos máximos; por defecto, el de la cola | `src/modules/messaging/dto/messaging.dto.ts:332` |
| `availableAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo queda disponible | `src/modules/messaging/dto/messaging.dto.ts:343` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "jobType": "valor-ejemplo",
  "dedupeKey": "valor-ejemplo",
  "payloadJson": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<JobResponseDto>` · DTO `JobResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/messaging/dto/messaging.dto.ts:354` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/messaging/dto/messaging.dto.ts:360` |
| `duplicate` | `boolean` | Sí | — | — | true si ya había un job con esa clave y se devuelve el mismo | `src/modules/messaging/dto/messaging.dto.ts:368` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/messaging/controllers/messaging.controller.spec.ts:42` |

### Flujos

_Se completa en la fase de flujos._

---

## 16. POST /queues/dead-letter/{deadLetterJobId}/redrive

- **Origen:** CONTRATO
- **Nombre:** Reencolar un trabajo desde la cola muerta
- **Bloque:** Integraciones y Contratos
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `MessagingController.redriveDeadLetter` — `src/modules/messaging/controllers/messaging.controller.ts:65`

### Qué es y para qué sirve (negocio)

Reencolar un trabajo desde la cola muerta. Caso de uso UC-35-09: Reencolar desde cola muerta. Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/messaging/README.md:23`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /queues/dead-letter/{deadLetterJobId}/redrive` la atiende `MessagingController.redriveDeadLetter` (src/modules/messaging/controllers/messaging.controller.ts:65). Exige sesión con alguno de los roles MESSAGING_ADMIN. Valida el cuerpo como `RedriveDeadLetterDto` (2 campos, 1 obligatorio). Delega en `QueuesService.redriveDeadLetter`. Crea filas en messaging.queued_jobs. Lee messaging.dead_letter_jobs, messaging.message_queues, messaging.queued_jobs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: MESSAGING_ADMIN | `src/modules/messaging/controllers/messaging.controller.ts:65` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: deadLetterJobId | `src/modules/messaging/controllers/messaging.controller.ts:65` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.dead_letter_jobs` | LEE | LEE | DIRECTA | MessagingController.redriveDeadLetter → QueuesService.redriveDeadLetter → QueuesRepository.findDeadLetterJobById | `src/modules/messaging/repositories/queues.repository.ts:246` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | MessagingController.redriveDeadLetter → QueuesService.redriveDeadLetter → QueuesRepository.findQueueById | `src/modules/messaging/repositories/queues.repository.ts:83` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | MessagingController.redriveDeadLetter → QueuesService.redriveDeadLetter → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:96` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | MessagingController.redriveDeadLetter → QueuesService.redriveDeadLetter → QueuesRepository.findJobById | `src/modules/messaging/repositories/queues.repository.ts:138` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `deadLetterJobId` | path | Sí | `string` | — |

### Cuerpo — DTO `RedriveDeadLetterDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | — | `@IsString()` | Por qué se reencola: qué se corrigió | `src/modules/messaging/dto/messaging.dto.ts:553` |
| `dedupeKey` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Clave de deduplicación del job nuevo; por defecto se deriva del original | `src/modules/messaging/dto/messaging.dto.ts:566` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo",
  "dedupeKey": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<RedriveResponseDto>` · DTO `RedriveResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `jobId` | `string` | Sí | formato uuid | — | Job nuevo encolado | `src/modules/messaging/dto/messaging.dto.ts:577` |
| `deadLetterJobId` | `string` | Sí | formato uuid | — | Identificador asociado a dead letter job. | `src/modules/messaging/dto/messaging.dto.ts:583` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/messaging/dto/messaging.dto.ts:589` |
| `duplicate` | `boolean` | Sí | — | — | true si ese DLQ ya se había reencolado | `src/modules/messaging/dto/messaging.dto.ts:595` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/messaging/controllers/messaging.controller.spec.ts:56` |

### Flujos

_Se completa en la fase de flujos._

---

## 17. POST /webhooks/providers/{providerCode}/receipts

- **Origen:** CONTRATO
- **Nombre:** Conciliar el acuse de entrega que envía el proveedor
- **Bloque:** Integraciones y Contratos
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProviderWebhooksController.recordReceipt` — `src/modules/messaging/controllers/provider-webhooks.controller.ts:33`

### Qué es y para qué sirve (negocio)

Conciliar el acuse de entrega que envía el proveedor. Caso de uso UC-35-12: Conciliar acuse del proveedor. Dentro del módulo (descripción del modelo, en inglés): «Provides durable domain events, transactional outbox publication, subscriptions, generic worker queues, retries and dead-letter evidence.» Dominio: Integraciones y Contratos.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/messaging/README.md:26`) · MODELO (`Mantra Core Health Context/modules/diagram_35_messaging.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:33`)

### Cómo se atiende (sistema)

`POST /webhooks/providers/{providerCode}/receipts` la atiende `ProviderWebhooksController.recordReceipt` (src/modules/messaging/controllers/provider-webhooks.controller.ts:33). Es una ruta pública: no exige token. Valida el cuerpo como `ProviderReceiptDto` (6 campos, 2 obligatorios). Delega en `NotificationsService.recordProviderReceipt`. Crea filas en messaging.delivery_receipts. Actualiza messaging.notification_deliveries, messaging.notification_requests. Lee messaging.delivery_receipts, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/messaging/controllers/provider-webhooks.controller.ts:33` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.delivery_receipts` | ESCRIBE | CREA | DIRECTA | ProviderWebhooksController.recordReceipt → NotificationsService.recordProviderReceipt → NotificationsRepository.createReceipt | `src/modules/messaging/repositories/notifications.repository.ts:608` |
| `messaging.delivery_receipts` | LEE | LEE | DIRECTA | ProviderWebhooksController.recordReceipt → NotificationsService.recordProviderReceipt → NotificationsRepository.findReceipt | `src/modules/messaging/repositories/notifications.repository.ts:629` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ProviderWebhooksController.recordReceipt → NotificationsService.recordProviderReceipt → NotificationsRepository.findProviderByCode | `src/modules/messaging/repositories/notifications.repository.ts:423` |
| `messaging.notification_deliveries` | ESCRIBE | ACTUALIZA | POR_TIPO | ProviderWebhooksController.recordReceipt → NotificationsService.recordProviderReceipt | `src/modules/messaging/services/notifications.service.ts:589` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | ProviderWebhooksController.recordReceipt → NotificationsService.recordProviderReceipt → NotificationsRepository.findDeliveryByProviderRefForUpdate | `src/modules/messaging/repositories/notifications.repository.ts:571` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ProviderWebhooksController.recordReceipt → NotificationsService.recordProviderReceipt | `src/modules/messaging/services/notifications.service.ts:594` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | ProviderWebhooksController.recordReceipt → NotificationsService.recordProviderReceipt → NotificationsRepository.findRequestForUpdate | `src/modules/messaging/repositories/notifications.repository.ts:330` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `providerCode` | path | Sí | `string` | — |

### Cuerpo — DTO `ProviderReceiptDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `providerMessageRef` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | Referencia del mensaje en el proveedor | `src/modules/messaging/dto/messaging.dto.ts:999` |
| `receiptType` | `string` | Sí | valores: DELIVERED, BOUNCED, READ | `@IsIn(RECEIPT_TYPES)` | — | `src/modules/messaging/dto/messaging.dto.ts:1006` |
| `providerStatus` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Estado tal como lo nombra el proveedor | `src/modules/messaging/dto/messaging.dto.ts:1018` |
| `rawPayloadJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Cuerpo original del webhook | `src/modules/messaging/dto/messaging.dto.ts:1026` |
| `signature` | `string` | No | longitud máxima 512 | `@IsOptional()` `@IsString()` `@MaxLength(512)` | Firma HMAC-SHA256 (hex) del cuerpo original bajo el secreto del proveedor | `src/modules/messaging/dto/messaging.dto.ts:1039` |
| `occurredAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo ocurrió según el proveedor | `src/modules/messaging/dto/messaging.dto.ts:1050` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "providerMessageRef": "valor-ejemplo",
  "receiptType": "DELIVERED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "providerMessageRef": "valor-ejemplo",
  "receiptType": "DELIVERED",
  "providerStatus": "valor-ejemplo",
  "rawPayloadJson": {},
  "signature": "valor-ejemplo",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<ProviderReceiptResponseDto>` · DTO `ProviderReceiptResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `receiptId` | `string` | Sí | formato uuid | — | Identificador asociado a receipt. | `src/modules/messaging/dto/messaging.dto.ts:1061` |
| `deliveryId` | `string` | Sí | formato uuid | — | Identificador asociado a delivery. | `src/modules/messaging/dto/messaging.dto.ts:1067` |
| `deliveryStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a delivery status concept. | `src/modules/messaging/dto/messaging.dto.ts:1073` |
| `requestStatusConceptId` | `string` | Sí | formato uuid | — | Estado en el que queda la solicitud | `src/modules/messaging/dto/messaging.dto.ts:1082` |
| `duplicate` | `boolean` | Sí | — | — | true si el mismo acuse ya se había procesado | `src/modules/messaging/dto/messaging.dto.ts:1088` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/messaging/controllers/provider-webhooks.controller.spec.ts:38` |

### Flujos

_Se completa en la fase de flujos._

---

