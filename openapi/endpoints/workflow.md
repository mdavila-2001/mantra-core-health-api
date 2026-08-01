<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `workflow`

Referencia exhaustiva de 11 operación(es) del módulo `workflow`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `workflow`
- **Controladores:** `WorkflowDefinitionsController`, `WorkflowInstancesController`, `WorkflowTransitionsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /workflow/aggregates/{aggregateId}/transitions](#1-get-workflow-aggregates-aggregateid-transitions) — Historial de transiciones del agregado
2. [POST /workflow/aggregates/{aggregateId}/transitions/{commandCode}](#2-post-workflow-aggregates-aggregateid-transitions-commandcode) — Disparar una transición validada
3. [POST /workflow/aggregates/{aggregateId}/transitions/{eventId}/compensate](#3-post-workflow-aggregates-aggregateid-transitions-eventid-compensate) — Compensar una transición
4. [POST /workflow/aggregates/{aggregateId}/transitions/{eventId}/retry](#4-post-workflow-aggregates-aggregateid-transitions-eventid-retry) — Reintentar una transición cuyo efecto falló
5. [POST /workflow/instances](#5-post-workflow-instances) — Crear una instancia de workflow y sus tareas iniciales
6. [POST /workflow/instances/sweep-timeouts](#6-post-workflow-instances-sweep-timeouts) — Escalar las instancias con el plazo vencido
7. [POST /workflow/state-machines](#7-post-workflow-state-machines) — Registrar una definición de máquina de estado
8. [POST /workflow/state-machines/{id}/publish](#8-post-workflow-state-machines-id-publish) — Publicar la versión de la definición
9. [POST /workflow/state-machines/{id}/states](#9-post-workflow-state-machines-id-states) — Declarar los estados de la máquina
10. [POST /workflow/state-machines/{id}/transitions](#10-post-workflow-state-machines-id-transitions) — Declarar una transición con sus guardas y efectos
11. [POST /workflow/tasks/{id}/complete](#11-post-workflow-tasks-id-complete) — Completar una tarea de workflow

---

## 1. GET /workflow/aggregates/{aggregateId}/transitions

- **Módulo:** `workflow`
- **Etiqueta OpenAPI:** `workflow`
- **Nombre:** Historial de transiciones del agregado
- **Operation ID:** `WorkflowTransitionsController_getTransitionHistory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [WorkflowTransitionsController.getTransitionHistory](../../src/modules/workflow/controllers/workflow-transitions.controller.ts)

### Descripción de negocio

Lectura sobre tabla append-only; devuelve además el estado actual de la instancia.

Contexto declarado en el controlador: UC-32-11. Va antes que la ruta de disparo para leerse en el mismo bloque.

### Descripción del sistema

NestJS resuelve `GET /workflow/aggregates/{aggregateId}/transitions` en `WorkflowTransitionsController_getTransitionHistory`. El controlador delega en `TransitionExecutionService.getTransitionHistory`. No recibe body. El tipo de retorno estático es `Promise<TransitionHistoryResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `aggregateId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `machineCode` | query | No | `string` | longitud máxima 100 | Filtra por máquina de estado | `CODIGO_EJEMPLO` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `offset` | query | No | `number` | mínimo 0 | Sin descripción específica en OpenAPI. | `0` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /workflow/aggregates/00000000-0000-4000-8000-000000000001/transitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AUDITOR`, `COMPLIANCE_OFFICER`, `CLINICIAN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `aggregateId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /workflow/aggregates/00000000-0000-4000-8000-000000000001/transitions?machineCode=CODIGO_EJEMPLO&limit=50&offset=0 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TransitionHistoryResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<TransitionHistoryResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<TransitionHistoryResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<TransitionHistoryResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<TransitionHistoryResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<TransitionHistoryResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<TransitionHistoryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionHistoryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "aggregateId": "00000000-0000-4000-8000-000000000001",
  "transitions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fromStateConceptId": "00000000-0000-4000-8000-000000000001",
      "toStateConceptId": "00000000-0000-4000-8000-000000000001",
      "transitionCode": "CODIGO_EJEMPLO",
      "commandCode": "CODIGO_EJEMPLO",
      "actorUserId": "00000000-0000-4000-8000-000000000001",
      "reasonConceptId": "00000000-0000-4000-8000-000000000001",
      "reasonText": "Texto descriptivo de ejemplo",
      "correlationId": "00000000-0000-4000-8000-000000000001",
      "causationId": "00000000-0000-4000-8000-000000000001",
      "occurredAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "total": 1,
  "currentStateConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `aggregateId` | Sí | `string` | formato `uuid` | Identificador asociado a aggregate. | `00000000-0000-4000-8000-000000000001` |
| `transitions` | Sí | `array<TransitionHistoryEntryDto>` | Sin restricción adicional declarada | Valor de transitions mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","fromStateConceptId":"00000000-0000-4000-8000-000000000001","toStateConceptId":"00000000-0000-4000-8000-000000000001","transitionCode":"CODIGO_EJEMPLO","commandCode":"CODIGO_EJEMPLO","actorUserId":"00000000-0000-4000-8000-000000000001","reasonConceptId":"00000000-0000-4000-8000-000000000001","reasonText":"Texto descriptivo de ejemplo","correlationId":"00000000-0000-4000-8000-000000000001","causationId":"00000000-0000-4000-8000-000000000001","occurredAt":"2026-07-31T12:00:00.000Z"}]` |
| `transitions[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `transitions[].fromStateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a from state concept. | `00000000-0000-4000-8000-000000000001` |
| `transitions[].toStateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a to state concept. | `00000000-0000-4000-8000-000000000001` |
| `transitions[].transitionCode` | No | `string` | Sin restricción adicional declarada | Código de la transición aplicada | `CODIGO_EJEMPLO` |
| `transitions[].commandCode` | No | `string` | Sin restricción adicional declarada | Comando que la disparó | `CODIGO_EJEMPLO` |
| `transitions[].actorUserId` | Sí | `string` | formato `uuid` | Identificador asociado a actor user. | `00000000-0000-4000-8000-000000000001` |
| `transitions[].reasonConceptId` | No | `string` | formato `uuid` | Identificador asociado a reason concept. | `00000000-0000-4000-8000-000000000001` |
| `transitions[].reasonText` | No | `string` | Sin restricción adicional declarada | Valor de reason text mantenido por la instancia. | `Texto descriptivo de ejemplo` |
| `transitions[].correlationId` | No | `string` | formato `uuid` | Identificador asociado a correlation. | `00000000-0000-4000-8000-000000000001` |
| `transitions[].causationId` | No | `string` | formato `uuid` | Identificador asociado a causation. | `00000000-0000-4000-8000-000000000001` |
| `transitions[].occurredAt` | Sí | `string` | formato `date-time` | Valor de occurred at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Total de transiciones que cumplen el filtro | `1` |
| `currentStateConceptId` | No | `string` | formato `uuid` | Estado actual de la instancia asociada | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AUDITOR, COMPLIANCE_OFFICER, CLINICIAN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | No hay una máquina activa con ese código. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workflow/aggregates/{aggregateId}/transitions"
}
```

---

## 2. POST /workflow/aggregates/{aggregateId}/transitions/{commandCode}

- **Módulo:** `workflow`
- **Etiqueta OpenAPI:** `workflow`
- **Nombre:** Disparar una transición validada
- **Operation ID:** `WorkflowTransitionsController_triggerTransition`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [WorkflowTransitionsController.triggerTransition](../../src/modules/workflow/controllers/workflow-transitions.controller.ts)

### Descripción de negocio

Bloquea el agregado, evalúa las guardas en orden, mueve el estado y publica los efectos en el outbox, todo en la misma transacción.

Contexto declarado en el controlador: UC-32-05 (y UC-32-06 por la cabecera `Idempotency-Key`). El caso de uso escribe `transitions:{command_code}`; se publica como segmento aparte porque `path-to-regexp` v8 trata `:` como inicio de parámetro en cualquier posición del segmento.

### Descripción del sistema

NestJS resuelve `POST /workflow/aggregates/{aggregateId}/transitions/{commandCode}` en `WorkflowTransitionsController_triggerTransition`. El controlador delega en `TransitionExecutionService.triggerTransition`. Valida el body como `TriggerTransitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionEventResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `aggregateId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `commandCode` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |
| `idempotency-key` | header | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `Idempotency-Key` | header | No | `string` | Sin restricción adicional declarada | Obligatoria si la transición declara `idempotency_required`. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `TriggerTransitionDto`; los campos opcionales se omiten.

```http
POST /workflow/aggregates/00000000-0000-4000-8000-000000000001/transitions/CODIGO_EJEMPLO HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
idempotency-key: valor-ejemplo
Content-Type: application/json

{
  "machineCode": "CODIGO_EJEMPLO"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `BILLING_AGENT`, `SCHEDULER`, `SYSTEM`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `aggregateId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `machineCode` | Sí | `string` | longitud máxima 100 | Máquina de estado que gobierna el agregado | `CODIGO_EJEMPLO` |
| `actorTenantId` | No | `string` | formato `uuid` | Tenant en cuyo nombre actúa el llamante; queda en el evento de transición | `00000000-0000-4000-8000-000000000001` |
| `reasonConceptId` | No | `string` | formato `uuid` | Motivo del movimiento | `00000000-0000-4000-8000-000000000001` |
| `reasonText` | No | `string` | Sin restricción adicional declarada | Texto libre del motivo | `Texto descriptivo de ejemplo` |
| `expectedRowVersion` | No | `number` | formato `uuid`; mínimo 0 | Versión del agregado que vio el llamante; exigida si la transición usa bloqueo optimista | `1` |
| `correlationId` | No | `string` | formato `uuid` | Hilo de negocio al que pertenece | `00000000-0000-4000-8000-000000000001` |
| `causationId` | No | `string` | formato `uuid` | Evento que causó éste | `00000000-0000-4000-8000-000000000001` |
| `payloadJson` | No | `object` | Sin restricción adicional declarada | Datos del comando para las guardas | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workflow/aggregates/00000000-0000-4000-8000-000000000001/transitions/CODIGO_EJEMPLO HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
idempotency-key: valor-ejemplo
Idempotency-Key: valor-ejemplo
Content-Type: application/json

{
  "machineCode": "CODIGO_EJEMPLO",
  "actorTenantId": "00000000-0000-4000-8000-000000000001",
  "reasonConceptId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo",
  "expectedRowVersion": 1,
  "correlationId": "00000000-0000-4000-8000-000000000001",
  "causationId": "00000000-0000-4000-8000-000000000001",
  "payloadJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionEventResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionEventResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionEventResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionEventResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionEventResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionEventResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionEventResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionEventResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionEventResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionEventResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionEventResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "aggregateId": "00000000-0000-4000-8000-000000000001",
  "fromStateConceptId": "00000000-0000-4000-8000-000000000001",
  "toStateConceptId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "publishedEffects": 1,
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `aggregateId` | Sí | `string` | formato `uuid` | Identificador asociado a aggregate. | `00000000-0000-4000-8000-000000000001` |
| `fromStateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a from state concept. | `00000000-0000-4000-8000-000000000001` |
| `toStateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a to state concept. | `00000000-0000-4000-8000-000000000001` |
| `occurredAt` | Sí | `string` | formato `date-time` | Valor de occurred at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `publishedEffects` | Sí | `number` | Sin restricción adicional declarada | Eventos publicados en el outbox por los efectos de la transición | `1` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si la clave de idempotencia ya se había aplicado y se devuelve el resultado previo | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, BILLING_AGENT, SCHEDULER, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El agregado gobernado no existe. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 404 | `NOT_FOUND` | No hay una versión activa de esa máquina de estado. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 409 | `CONCURRENCY_CONFLICT` | El agregado cambió desde que el llamante lo leyó. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El comando no es aplicable desde el estado actual del agregado. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 422 | `PRECONDITION_FAILED` | Esta transición exige cabecera Idempotency-Key. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 422 | `PRECONDITION_FAILED` | Esta transición exige declarar el motivo. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 422 | `PRECONDITION_FAILED` | Esta transición exige enviar la versión del agregado que vio el llamante. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 422 | `PRECONDITION_FAILED` | guard.failureMessageKey ??           'La transición no cumple una guarda de la definición.' | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workflow/aggregates/{aggregateId}/transitions/{commandCode}"
}
```

---

## 3. POST /workflow/aggregates/{aggregateId}/transitions/{eventId}/compensate

- **Módulo:** `workflow`
- **Etiqueta OpenAPI:** `workflow`
- **Nombre:** Compensar una transición
- **Operation ID:** `WorkflowTransitionsController_compensateTransition`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [WorkflowTransitionsController.compensateTransition](../../src/modules/workflow/controllers/workflow-transitions.controller.ts)

### Descripción de negocio

Sólo si algún efecto declara compensación; registra un evento nuevo, no borra el original.


### Descripción del sistema

NestJS resuelve `POST /workflow/aggregates/{aggregateId}/transitions/{eventId}/compensate` en `WorkflowTransitionsController_compensateTransition`. El controlador delega en `TransitionExecutionService.compensateTransition`. Valida el body como `CompensateTransitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<CompensateTransitionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `aggregateId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `eventId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CompensateTransitionDto`; los campos opcionales se omiten.

```http
POST /workflow/aggregates/00000000-0000-4000-8000-000000000001/transitions/00000000-0000-4000-8000-000000000001/compensate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SAGA_ORCHESTRATOR`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `aggregateId`, `eventId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reasonText` | Sí | `string` | Sin restricción adicional declarada | Por qué se compensa | `Texto descriptivo de ejemplo` |
| `correlationId` | No | `string` | formato `uuid` | Saga a la que pertenece la compensación | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workflow/aggregates/00000000-0000-4000-8000-000000000001/transitions/00000000-0000-4000-8000-000000000001/compensate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reasonText": "Texto descriptivo de ejemplo",
  "correlationId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CompensateTransitionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CompensateTransitionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CompensateTransitionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CompensateTransitionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CompensateTransitionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CompensateTransitionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CompensateTransitionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CompensateTransitionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CompensateTransitionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CompensateTransitionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CompensateTransitionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "compensationEventId": "00000000-0000-4000-8000-000000000001",
  "originalEventId": "00000000-0000-4000-8000-000000000001",
  "restoredStateConceptId": "00000000-0000-4000-8000-000000000001",
  "publishedEffects": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `compensationEventId` | Sí | `string` | formato `uuid` | Evento de compensación registrado | `00000000-0000-4000-8000-000000000001` |
| `originalEventId` | Sí | `string` | formato `uuid` | Evento original que se revierte | `00000000-0000-4000-8000-000000000001` |
| `restoredStateConceptId` | Sí | `string` | formato `uuid` | Estado al que vuelve el agregado | `00000000-0000-4000-8000-000000000001` |
| `publishedEffects` | Sí | `number` | Sin restricción adicional declarada | Eventos de compensación publicados en el outbox | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SAGA_ORCHESTRATOR, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La transición original no existe para ese agregado. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 404 | `NOT_FOUND` | Máquina de estado no encontrada. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 404 | `NOT_FOUND` | El agregado gobernado no existe. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 409 | `CONFLICT` | El agregado ya no está en el estado que dejó la transición que se quiere compensar. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 409 | `CONCURRENCY_CONFLICT` | El agregado cambió durante la compensación. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La transición no declara compensación, así que no es reversible. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workflow/aggregates/{aggregateId}/transitions/{eventId}/compensate"
}
```

---

## 4. POST /workflow/aggregates/{aggregateId}/transitions/{eventId}/retry

- **Módulo:** `workflow`
- **Etiqueta OpenAPI:** `workflow`
- **Nombre:** Reintentar una transición cuyo efecto falló
- **Operation ID:** `WorkflowTransitionsController_retryTransition`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [WorkflowTransitionsController.retryTransition](../../src/modules/workflow/controllers/workflow-transitions.controller.ts)

### Descripción de negocio

Conserva la clave de idempotencia del original para no duplicar el efecto de negocio.


### Descripción del sistema

NestJS resuelve `POST /workflow/aggregates/{aggregateId}/transitions/{eventId}/retry` en `WorkflowTransitionsController_retryTransition`. El controlador delega en `TransitionExecutionService.retryTransition`. Valida el body como `RetryTransitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<RetryTransitionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `aggregateId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `eventId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RetryTransitionDto`; los campos opcionales se omiten.

```http
POST /workflow/aggregates/00000000-0000-4000-8000-000000000001/transitions/00000000-0000-4000-8000-000000000001/retry HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `aggregateId`, `eventId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `workflowInstanceId` | No | `string` | formato `uuid` | Instancia en `retry_scheduled` que vuelve a `running` | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workflow/aggregates/00000000-0000-4000-8000-000000000001/transitions/00000000-0000-4000-8000-000000000001/retry HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "workflowInstanceId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RetryTransitionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RetryTransitionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RetryTransitionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RetryTransitionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RetryTransitionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RetryTransitionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RetryTransitionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RetryTransitionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RetryTransitionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RetryTransitionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RetryTransitionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "retryEventId": "00000000-0000-4000-8000-000000000001",
  "originalEventId": "00000000-0000-4000-8000-000000000001",
  "idempotencyKey": "valor-ejemplo",
  "workflowInstanceId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `retryEventId` | Sí | `string` | formato `uuid` | Evento de reintento registrado | `00000000-0000-4000-8000-000000000001` |
| `originalEventId` | Sí | `string` | formato `uuid` | Identificador asociado a original event. | `00000000-0000-4000-8000-000000000001` |
| `idempotencyKey` | No | `string` | Sin restricción adicional declarada | Clave de idempotencia conservada del original, para no duplicar el efecto de negocio | `valor-ejemplo` |
| `workflowInstanceId` | No | `string` | formato `uuid` | Identificador asociado a workflow instance. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La transición original no existe para ese agregado. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 404 | `NOT_FOUND` | Instancia de workflow no encontrada. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La instancia no está en espera de reintento. | Excepción explícita en src/modules/workflow/services/transition-execution.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workflow/aggregates/{aggregateId}/transitions/{eventId}/retry"
}
```

---

## 5. POST /workflow/instances

- **Módulo:** `workflow`
- **Etiqueta OpenAPI:** `workflow`
- **Nombre:** Crear una instancia de workflow y sus tareas iniciales
- **Operation ID:** `WorkflowInstancesController_createInstance`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [WorkflowInstancesController.createInstance](../../src/modules/workflow/controllers/workflow-instances.controller.ts)

### Descripción de negocio

El estado inicial sale de la definición activa, no de la petición. Una sola instancia viva por (código, sujeto).


### Descripción del sistema

NestJS resuelve `POST /workflow/instances` en `WorkflowInstancesController_createInstance`. El controlador delega en `WorkflowInstancesService.createInstance`. Valida el body como `CreateWorkflowInstanceDto` y consume `application/json`. El tipo de retorno estático es `Promise<WorkflowInstanceResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateWorkflowInstanceDto`; los campos opcionales se omiten.

```http
POST /workflow/instances HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "workflowCode": "CODIGO_EJEMPLO",
  "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `BILLING_AGENT`, `SCHEDULER`, `SYSTEM`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `workflowCode` | Sí | `string` | longitud máxima 100 | Código de la máquina activa que gobierna el flujo | `CODIGO_EJEMPLO` |
| `subjectTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `subjectId` | Sí | `string` | formato `uuid` | Agregado sobre el que corre el flujo | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `currentStepCode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `contextJson` | No | `object` | Sin restricción adicional declarada | Contexto del flujo | `{}` |
| `dueAt` | No | `string` | formato `date-time` | Plazo de la instancia | `2026-07-31T12:00:00.000Z` |
| `tasks` | No | `array<WorkflowTaskInputDto>` | Sin restricción adicional declarada | Tareas de los pasos iniciales | `[{"taskCode":"CODIGO_EJEMPLO","taskTypeConceptId":"00000000-0000-4000-8000-000000000001","assignedUserId":"00000000-0000-4000-8000-000000000001","assignedRoleConceptId":"00000000-0000-4000-8000-000000000001","requiredPermissionId":"00000000-0000-4000-8000-000000000001","dueAt":"2026-07-31T12:00:00.000Z"}]` |
| `tasks[].taskCode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `tasks[].taskTypeConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tasks[].assignedUserId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tasks[].assignedRoleConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tasks[].requiredPermissionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tasks[].dueAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workflow/instances HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "workflowCode": "CODIGO_EJEMPLO",
  "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "currentStepCode": "CODIGO_EJEMPLO",
  "contextJson": {},
  "dueAt": "2026-07-31T12:00:00.000Z",
  "tasks": [
    {
      "taskCode": "CODIGO_EJEMPLO",
      "taskTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "assignedUserId": "00000000-0000-4000-8000-000000000001",
      "assignedRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "requiredPermissionId": "00000000-0000-4000-8000-000000000001",
      "dueAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<WorkflowInstanceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<WorkflowInstanceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<WorkflowInstanceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<WorkflowInstanceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<WorkflowInstanceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<WorkflowInstanceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<WorkflowInstanceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<WorkflowInstanceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<WorkflowInstanceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WorkflowInstanceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "workflowCode": "CODIGO_EJEMPLO",
  "currentStateConceptId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "taskIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `workflowCode` | Sí | `string` | Sin restricción adicional declarada | Valor de workflow code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `currentStateConceptId` | Sí | `string` | formato `uuid` | Estado inicial tomado de la definición | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `taskIds` | Sí | `array<string>` | formato `uuid` | Valor de task ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, BILLING_AGENT, SCHEDULER, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | No hay una versión activa de la máquina de estado para ese workflow. | Excepción explícita en src/modules/workflow/services/workflow-instances.service.ts |
| 409 | `CONFLICT` | Ya hay una instancia viva de ese workflow para el sujeto. | Excepción explícita en src/modules/workflow/services/workflow-instances.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La definición activa no declara estado inicial. | Excepción explícita en src/modules/workflow/services/workflow-instances.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workflow/instances"
}
```

---

## 6. POST /workflow/instances/sweep-timeouts

- **Módulo:** `workflow`
- **Etiqueta OpenAPI:** `workflow`
- **Nombre:** Escalar las instancias con el plazo vencido
- **Operation ID:** `WorkflowInstancesController_sweepTimeouts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [WorkflowInstancesController.sweepTimeouts](../../src/modules/workflow/controllers/workflow-instances.controller.ts)

### Descripción de negocio

Toma un lote con SKIP LOCKED para que dos barridos concurrentes se repartan la cola. Escalar no cancela.

Contexto declarado en el controlador: UC-32-10. Declarada antes que `instances` para que el segmento literal se resuelva antes que cualquier ruta paramétrica que se añada después.

### Descripción del sistema

NestJS resuelve `POST /workflow/instances/sweep-timeouts` en `WorkflowInstancesController_sweepTimeouts`. El controlador delega en `WorkflowInstancesService.sweepTimeouts`. Valida el body como `SweepTimeoutsDto` y consume `application/json`. El tipo de retorno estático es `Promise<SweepTimeoutsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SweepTimeoutsDto`; los campos opcionales se omiten.

```http
POST /workflow/instances/sweep-timeouts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `batchSize` | No | `number` | mínimo 1; máximo 500 | Cuántas instancias vencidas toma este barrido | `50` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workflow/instances/sweep-timeouts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "batchSize": 50
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SweepTimeoutsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SweepTimeoutsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SweepTimeoutsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SweepTimeoutsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SweepTimeoutsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SweepTimeoutsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SweepTimeoutsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SweepTimeoutsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SweepTimeoutsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SweepTimeoutsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "escalatedInstances": 1,
  "escalatedTasks": 1,
  "instanceIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `escalatedInstances` | Sí | `number` | Sin restricción adicional declarada | Instancias que quedaron escaladas | `1` |
| `escalatedTasks` | Sí | `number` | Sin restricción adicional declarada | Tareas que quedaron escaladas | `1` |
| `instanceIds` | Sí | `array<string>` | formato `uuid` | Valor de instance ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/workflow/instances/sweep-timeouts"
}
```

---

## 7. POST /workflow/state-machines

- **Módulo:** `workflow`
- **Etiqueta OpenAPI:** `workflow`
- **Nombre:** Registrar una definición de máquina de estado
- **Operation ID:** `WorkflowDefinitionsController_registerStateMachine`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [WorkflowDefinitionsController.registerStateMachine](../../src/modules/workflow/controllers/workflow-definitions.controller.ts)

### Descripción de negocio

Nace en borrador: todavía no tiene estados ni transiciones que recorrer.


### Descripción del sistema

NestJS resuelve `POST /workflow/state-machines` en `WorkflowDefinitionsController_registerStateMachine`. El controlador delega en `StateMachineDefinitionService.registerStateMachine`. Valida el body como `RegisterStateMachineDto` y consume `application/json`. El tipo de retorno estático es `Promise<StateMachineResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterStateMachineDto`; los campos opcionales se omiten.

```http
POST /workflow/state-machines HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "machineCode": "CODIGO_EJEMPLO",
  "aggregateSchemaName": "Nombre de ejemplo",
  "aggregateEntityName": "Nombre de ejemplo",
  "statusFieldName": "Nombre de ejemplo",
  "stateValueSetId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `WORKFLOW_ARCHITECT`, `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `machineCode` | Sí | `string` | longitud máxima 100 | Código único de la máquina | `CODIGO_EJEMPLO` |
| `aggregateSchemaName` | Sí | `string` | longitud máxima 63 | Esquema del agregado gobernado, p. ej. `clinical` | `Nombre de ejemplo` |
| `aggregateEntityName` | Sí | `string` | longitud máxima 63 | Tabla del agregado gobernado | `Nombre de ejemplo` |
| `statusFieldName` | Sí | `string` | longitud máxima 63 | Columna del agregado que guarda el estado | `Nombre de ejemplo` |
| `stateValueSetId` | Sí | `string` | formato `uuid` | Value set gobernado del que salen los estados (Módulo 04) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workflow/state-machines HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "machineCode": "CODIGO_EJEMPLO",
  "aggregateSchemaName": "Nombre de ejemplo",
  "aggregateEntityName": "Nombre de ejemplo",
  "statusFieldName": "Nombre de ejemplo",
  "stateValueSetId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<StateMachineResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StateMachineResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StateMachineResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StateMachineResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StateMachineResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<StateMachineResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StateMachineResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StateMachineResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StateMachineResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StateMachineResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "machineCode": "CODIGO_EJEMPLO",
  "versionNumber": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `machineCode` | Sí | `string` | Sin restricción adicional declarada | Valor de machine code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una máquina de estado con ese código. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
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
  "path": "/workflow/state-machines"
}
```

---

## 8. POST /workflow/state-machines/{id}/publish

- **Módulo:** `workflow`
- **Etiqueta OpenAPI:** `workflow`
- **Nombre:** Publicar la versión de la definición
- **Operation ID:** `WorkflowDefinitionsController_publishStateMachine`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [WorkflowDefinitionsController.publishStateMachine](../../src/modules/workflow/controllers/workflow-definitions.controller.ts)

### Descripción de negocio

Comprueba estado inicial, estado terminal y alcanzabilidad antes de dejar entrar agregados reales; retira la versión activa anterior.


### Descripción del sistema

NestJS resuelve `POST /workflow/state-machines/{id}/publish` en `WorkflowDefinitionsController_publishStateMachine`. El controlador delega en `StateMachineDefinitionService.publishStateMachine`. Valida el body como `PublishStateMachineDto` y consume `application/json`. El tipo de retorno estático es `Promise<PublishStateMachineResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishStateMachineDto`; los campos opcionales se omiten.

```http
POST /workflow/state-machines/00000000-0000-4000-8000-000000000001/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `WORKFLOW_ARCHITECT`, `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `effectiveFrom` | No | `string` | formato `date-time` | Desde cuándo rige; por omisión, ahora | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workflow/state-machines/00000000-0000-4000-8000-000000000001/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "effectiveFrom": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublishStateMachineResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PublishStateMachineResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PublishStateMachineResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PublishStateMachineResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PublishStateMachineResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PublishStateMachineResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PublishStateMachineResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PublishStateMachineResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PublishStateMachineResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PublishStateMachineResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublishStateMachineResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "retiredVersionId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `retiredVersionId` | No | `string` | formato `uuid` | Versión anterior que quedó retirada | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Máquina de estado no encontrada. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La definición ya no está en borrador. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 422 | `PRECONDITION_FAILED` | La definición debe tener exactamente un estado inicial para publicarse. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 422 | `PRECONDITION_FAILED` | La definición debe tener al menos un estado terminal para publicarse. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 422 | `PRECONDITION_FAILED` | Hay estados inalcanzables desde el estado inicial. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workflow/state-machines/{id}/publish"
}
```

---

## 9. POST /workflow/state-machines/{id}/states

- **Módulo:** `workflow`
- **Etiqueta OpenAPI:** `workflow`
- **Nombre:** Declarar los estados de la máquina
- **Operation ID:** `WorkflowDefinitionsController_defineStates`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [WorkflowDefinitionsController.defineStates](../../src/modules/workflow/controllers/workflow-definitions.controller.ts)

### Descripción de negocio

Exactamente un estado inicial, contando los que ya estuvieran declarados.


### Descripción del sistema

NestJS resuelve `POST /workflow/state-machines/{id}/states` en `WorkflowDefinitionsController_defineStates`. El controlador delega en `StateMachineDefinitionService.defineStates`. Valida el body como `DefineStatesDto` y consume `application/json`. El tipo de retorno estático es `Promise<DefineStatesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineStatesDto`; los campos opcionales se omiten.

```http
POST /workflow/state-machines/00000000-0000-4000-8000-000000000001/states HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "states": [
    {
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "stateCodeSnapshot": "CODIGO_EJEMPLO",
      "ordinal": 1
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `WORKFLOW_ARCHITECT`, `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `states` | Sí | `array<StateDefinitionDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"stateConceptId":"00000000-0000-4000-8000-000000000001","stateCodeSnapshot":"CODIGO_EJEMPLO","isInitial":false,"isTerminal":false,"allowsEdit":true,"ordinal":1}]` |
| `states[].stateConceptId` | Sí | `string` | formato `uuid` | Concepto de estado del value set | `00000000-0000-4000-8000-000000000001` |
| `states[].stateCodeSnapshot` | Sí | `string` | longitud máxima 100 | Código legible del estado, congelado | `CODIGO_EJEMPLO` |
| `states[].isInitial` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `states[].isTerminal` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `states[].allowsEdit` | No | `boolean` | Sin restricción adicional declarada | Si el agregado admite edición mientras está en este estado | `true` |
| `states[].ordinal` | Sí | `number` | mínimo 0 | Orden de presentación | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workflow/state-machines/00000000-0000-4000-8000-000000000001/states HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "states": [
    {
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "stateCodeSnapshot": "CODIGO_EJEMPLO",
      "isInitial": false,
      "isTerminal": false,
      "allowsEdit": true,
      "ordinal": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DefineStatesResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DefineStatesResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DefineStatesResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DefineStatesResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DefineStatesResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DefineStatesResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DefineStatesResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DefineStatesResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DefineStatesResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DefineStatesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DefineStatesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "stateMachineDefinitionId": "00000000-0000-4000-8000-000000000001",
  "stateIds": [
    "valor-ejemplo"
  ],
  "totalStates": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `stateMachineDefinitionId` | Sí | `string` | formato `uuid` | Identificador asociado a state machine definition. | `00000000-0000-4000-8000-000000000001` |
| `stateIds` | Sí | `array<string>` | formato `uuid` | Valor de state ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `totalStates` | Sí | `number` | Sin restricción adicional declarada | Total de estados definidos en la máquina | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Máquina de estado no encontrada. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 409 | `CONFLICT` | El estado ya está declarado en esta máquina. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo se pueden declarar estados sobre una definición en borrador. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 422 | `PRECONDITION_FAILED` | La máquina debe declarar exactamente un estado inicial. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workflow/state-machines/{id}/states"
}
```

---

## 10. POST /workflow/state-machines/{id}/transitions

- **Módulo:** `workflow`
- **Etiqueta OpenAPI:** `workflow`
- **Nombre:** Declarar una transición con sus guardas y efectos
- **Operation ID:** `WorkflowDefinitionsController_defineTransition`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [WorkflowDefinitionsController.defineTransition](../../src/modules/workflow/controllers/workflow-definitions.controller.ts)

### Descripción de negocio

El estado de origen no puede ser terminal.


### Descripción del sistema

NestJS resuelve `POST /workflow/state-machines/{id}/transitions` en `WorkflowDefinitionsController_defineTransition`. El controlador delega en `StateMachineDefinitionService.defineTransition`. Valida el body como `DefineTransitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransitionDefinitionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineTransitionDto`; los campos opcionales se omiten.

```http
POST /workflow/state-machines/00000000-0000-4000-8000-000000000001/transitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "transitionCode": "CODIGO_EJEMPLO",
  "fromStateConceptId": "00000000-0000-4000-8000-000000000001",
  "toStateConceptId": "00000000-0000-4000-8000-000000000001",
  "commandCode": "CODIGO_EJEMPLO",
  "requiredPermissionId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUseConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `WORKFLOW_ARCHITECT`, `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `transitionCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `fromStateConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `toStateConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `commandCode` | Sí | `string` | longitud máxima 100 | Comando que dispara la transición | `CODIGO_EJEMPLO` |
| `requiredPermissionId` | Sí | `string` | formato `uuid` | Permiso exigido al actor (Módulo 05) | `00000000-0000-4000-8000-000000000001` |
| `purposeOfUseConceptId` | Sí | `string` | formato `uuid` | Propósito de uso admitido | `00000000-0000-4000-8000-000000000001` |
| `idempotencyRequired` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `optimisticLockRequired` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `reasonRequired` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `transitionTimeoutSeconds` | No | `number` | mínimo 1 | Plazo tras el que la transición se considera vencida | `1` |
| `guards` | No | `array<TransitionGuardDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"guardCode":"CODIGO_EJEMPLO","guardTypeConceptId":"00000000-0000-4000-8000-000000000001","evaluationOrder":1,"expressionJson":{},"failureCode":"CODIGO_EJEMPLO","failureMessageKey":"valor-ejemplo"}]` |
| `guards[].guardCode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `guards[].guardTypeConceptId` | No | `string` | formato `uuid` | Tipo de guarda (expresión, permiso, estado) | `00000000-0000-4000-8000-000000000001` |
| `guards[].evaluationOrder` | No | `number` | mínimo 0 | Orden de evaluación; la primera que falla corta | `1` |
| `guards[].expressionJson` | No | `object` | Sin restricción adicional declarada | Expresión declarativa de la guarda | `{}` |
| `guards[].failureCode` | No | `string` | longitud máxima 100 | Código de fallo estable que se devuelve al rechazar | `CODIGO_EJEMPLO` |
| `guards[].failureMessageKey` | No | `string` | longitud máxima 200 | Clave del mensaje traducible | `valor-ejemplo` |
| `sideEffects` | No | `array<TransitionSideEffectDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"sideEffectCode":"CODIGO_EJEMPLO","sideEffectTypeConceptId":"00000000-0000-4000-8000-000000000001","executionModeConceptId":"00000000-0000-4000-8000-000000000001","executionOrder":1,"outboxEventType":"valor-ejemplo","actionSpecJson":{},"compensationSpecJson":{}}]` |
| `sideEffects[].sideEffectCode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `sideEffects[].sideEffectTypeConceptId` | No | `string` | formato `uuid` | Tipo de efecto (outbox, tarea, notificación) | `00000000-0000-4000-8000-000000000001` |
| `sideEffects[].executionModeConceptId` | No | `string` | formato `uuid` | Modo de ejecución (síncrono o asíncrono) | `00000000-0000-4000-8000-000000000001` |
| `sideEffects[].executionOrder` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `sideEffects[].outboxEventType` | No | `string` | longitud máxima 200 | Tipo de evento que se publica en el outbox al aplicar la transición | `valor-ejemplo` |
| `sideEffects[].actionSpecJson` | No | `object` | Sin restricción adicional declarada | Qué hace el efecto | `{}` |
| `sideEffects[].compensationSpecJson` | No | `object` | Sin restricción adicional declarada | Cómo se deshace; sin esto la transición no es compensable | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workflow/state-machines/00000000-0000-4000-8000-000000000001/transitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "transitionCode": "CODIGO_EJEMPLO",
  "fromStateConceptId": "00000000-0000-4000-8000-000000000001",
  "toStateConceptId": "00000000-0000-4000-8000-000000000001",
  "commandCode": "CODIGO_EJEMPLO",
  "requiredPermissionId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUseConceptId": "00000000-0000-4000-8000-000000000001",
  "idempotencyRequired": false,
  "optimisticLockRequired": false,
  "reasonRequired": false,
  "transitionTimeoutSeconds": 1,
  "guards": [
    {
      "guardCode": "CODIGO_EJEMPLO",
      "guardTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "evaluationOrder": 1,
      "expressionJson": {},
      "failureCode": "CODIGO_EJEMPLO",
      "failureMessageKey": "valor-ejemplo"
    }
  ],
  "sideEffects": [
    {
      "sideEffectCode": "CODIGO_EJEMPLO",
      "sideEffectTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "executionModeConceptId": "00000000-0000-4000-8000-000000000001",
      "executionOrder": 1,
      "outboxEventType": "valor-ejemplo",
      "actionSpecJson": {},
      "compensationSpecJson": {}
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransitionDefinitionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransitionDefinitionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransitionDefinitionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransitionDefinitionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransitionDefinitionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransitionDefinitionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransitionDefinitionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransitionDefinitionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransitionDefinitionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransitionDefinitionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransitionDefinitionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "transitionCode": "CODIGO_EJEMPLO",
  "guardCount": 1,
  "sideEffectCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `transitionCode` | Sí | `string` | Sin restricción adicional declarada | Valor de transition code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `guardCount` | Sí | `number` | Sin restricción adicional declarada | Guardas creadas | `1` |
| `sideEffectCount` | Sí | `number` | Sin restricción adicional declarada | Efectos creados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Máquina de estado no encontrada. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 409 | `CONFLICT` | Ya existe una transición con ese código en la máquina. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 409 | `CONFLICT` | Dos guardas comparten el mismo orden de evaluación. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 409 | `CONFLICT` | Dos efectos comparten el mismo orden de ejecución. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo se pueden declarar transiciones sobre una definición en borrador. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 422 | `PRECONDITION_FAILED` | El estado de origen no está declarado en esta máquina. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 422 | `PRECONDITION_FAILED` | Un estado terminal no puede tener transiciones de salida. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 422 | `PRECONDITION_FAILED` | El estado de destino no está declarado en esta máquina. | Excepción explícita en src/modules/workflow/services/state-machine-definition.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workflow/state-machines/{id}/transitions"
}
```

---

## 11. POST /workflow/tasks/{id}/complete

- **Módulo:** `workflow`
- **Etiqueta OpenAPI:** `workflow`
- **Nombre:** Completar una tarea de workflow
- **Operation ID:** `WorkflowInstancesController_completeTask`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [WorkflowInstancesController.completeTask](../../src/modules/workflow/controllers/workflow-instances.controller.ts)

### Descripción de negocio

Fija en la tarea quién la completó y, si se envía un comando, dispara la transición asociada.


### Descripción del sistema

NestJS resuelve `POST /workflow/tasks/{id}/complete` en `WorkflowInstancesController_completeTask`. El controlador delega en `WorkflowInstancesService.completeTask`. Valida el body como `CompleteTaskDto` y consume `application/json`. El tipo de retorno estático es `Promise<CompleteTaskResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CompleteTaskDto`; los campos opcionales se omiten.

```http
POST /workflow/tasks/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `BILLING_AGENT`, `SCHEDULER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `commandCode` | No | `string` | longitud máxima 100 | Comando de la máquina que dispara el completado, si lo hay | `CODIGO_EJEMPLO` |
| `nextStepCode` | No | `string` | longitud máxima 100 | Paso al que avanza la instancia | `CODIGO_EJEMPLO` |
| `nextDueAt` | No | `string` | formato `date-time` | Nuevo plazo de la instancia | `2026-07-31T12:00:00.000Z` |
| `resultJson` | No | `object` | Sin restricción adicional declarada | Resultado de la tarea, para el contexto de la instancia | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /workflow/tasks/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "commandCode": "CODIGO_EJEMPLO",
  "nextStepCode": "CODIGO_EJEMPLO",
  "nextDueAt": "2026-07-31T12:00:00.000Z",
  "resultJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CompleteTaskResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CompleteTaskResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CompleteTaskResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CompleteTaskResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CompleteTaskResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CompleteTaskResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CompleteTaskResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CompleteTaskResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CompleteTaskResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CompleteTaskResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CompleteTaskResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "taskId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "workflowInstanceId": "00000000-0000-4000-8000-000000000001",
  "currentStepCode": "CODIGO_EJEMPLO",
  "transitionEventId": "00000000-0000-4000-8000-000000000001",
  "remainingOpenTasks": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `taskId` | Sí | `string` | formato `uuid` | Identificador asociado a task. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `workflowInstanceId` | Sí | `string` | formato `uuid` | Identificador asociado a workflow instance. | `00000000-0000-4000-8000-000000000001` |
| `currentStepCode` | No | `string` | Sin restricción adicional declarada | Paso al que avanzó la instancia | `CODIGO_EJEMPLO` |
| `transitionEventId` | No | `string` | formato `uuid` | Transición disparada por el completado, si la tarea la tenía asociada | `00000000-0000-4000-8000-000000000001` |
| `remainingOpenTasks` | Sí | `number` | Sin restricción adicional declarada | Tareas que quedan abiertas en la instancia | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, BILLING_AGENT, SCHEDULER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Tarea de workflow no encontrada. | Excepción explícita en src/modules/workflow/services/workflow-instances.service.ts |
| 404 | `NOT_FOUND` | Instancia de workflow no encontrada. | Excepción explícita en src/modules/workflow/services/workflow-instances.service.ts |
| 404 | `NOT_FOUND` | No hay una versión activa de la máquina de estado para ese workflow. | Excepción explícita en src/modules/workflow/services/workflow-instances.service.ts |
| 409 | `CONFLICT` | La tarea está asignada a otro usuario. | Excepción explícita en src/modules/workflow/services/workflow-instances.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La tarea ya no está abierta. | Excepción explícita en src/modules/workflow/services/workflow-instances.service.ts |
| 422 | `PRECONDITION_FAILED` | La instancia ya no está viva; su tarea no puede completarse. | Excepción explícita en src/modules/workflow/services/workflow-instances.service.ts |
| 422 | `PRECONDITION_FAILED` | El comando no es aplicable desde el estado actual de la instancia. | Excepción explícita en src/modules/workflow/services/workflow-instances.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/workflow/tasks/{id}/complete"
}
```

---

