<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `workflow`

- **Bloque:** Operaciones de Plataforma (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)
- **Operaciones:** 11 (11 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 10 · BAJO 1
- **Tablas distintas que tocan:** 10
- **Respuestas de error y detalle contractual:** `openapi/endpoints/workflow.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/workflow/aggregates/{aggregateId}/transitions` | Historial de transiciones del agregado | BAJO | 4 | AUDITOR, COMPLIANCE_OFFICER, CLINICIAN, PLATFORM_ADMIN |
| 2 | POST | `/workflow/aggregates/{aggregateId}/transitions/{commandCode}` | Disparar una transición validada | MEDIO | 9 | CLINICIAN, BILLING_AGENT, SCHEDULER, SYSTEM, PLATFORM_ADMIN |
| 3 | POST | `/workflow/aggregates/{aggregateId}/transitions/{eventId}/compensate` | Compensar una transición | MEDIO | 7 | SYSTEM, SAGA_ORCHESTRATOR, PLATFORM_ADMIN |
| 4 | POST | `/workflow/aggregates/{aggregateId}/transitions/{eventId}/retry` | Reintentar una transición cuyo efecto falló | MEDIO | 8 | SYSTEM, PLATFORM_ADMIN |
| 5 | POST | `/workflow/instances` | Crear una instancia de workflow y sus tareas iniciales | MEDIO | 8 | CLINICIAN, BILLING_AGENT, SCHEDULER, SYSTEM, PLATFORM_ADMIN |
| 6 | POST | `/workflow/instances/sweep-timeouts` | Escalar las instancias con el plazo vencido | MEDIO | 7 | SYSTEM, PLATFORM_ADMIN |
| 7 | POST | `/workflow/state-machines` | Registrar una definición de máquina de estado | MEDIO | 5 | WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 8 | POST | `/workflow/state-machines/{id}/publish` | Publicar la versión de la definición | MEDIO | 7 | WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 9 | POST | `/workflow/state-machines/{id}/states` | Declarar los estados de la máquina | MEDIO | 3 | WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 10 | POST | `/workflow/state-machines/{id}/transitions` | Declarar una transición con sus guardas y efectos | MEDIO | 6 | WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN |
| 11 | POST | `/workflow/tasks/{id}/complete` | Completar una tarea de workflow | MEDIO | 10 | CLINICIAN, BILLING_AGENT, SCHEDULER, PLATFORM_ADMIN |

---

## 1. GET /workflow/aggregates/{aggregateId}/transitions

- **Origen:** CONTRATO
- **Nombre:** Historial de transiciones del agregado
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `WorkflowTransitionsController.getTransitionHistory` — `src/modules/workflow/controllers/workflow-transitions.controller.ts:52`

### Qué es y para qué sirve (negocio)

Historial de transiciones del agregado. Caso de uso UC-32-11: Estado e historial. Dentro del módulo (descripción del modelo, en inglés): «Makes lifecycle rules executable and auditable.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/workflow/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_32_workflow.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /workflow/aggregates/{aggregateId}/transitions` la atiende `WorkflowTransitionsController.getTransitionHistory` (src/modules/workflow/controllers/workflow-transitions.controller.ts:52). Exige sesión con alguno de los roles AUDITOR, COMPLIANCE_OFFICER, CLINICIAN, PLATFORM_ADMIN. Delega en `TransitionExecutionService.getTransitionHistory`. Lee workflow.state_machine_definitions, workflow.state_transition_definitions, workflow.state_transition_events, workflow.workflow_instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AUDITOR, COMPLIANCE_OFFICER, CLINICIAN, PLATFORM_ADMIN | `src/modules/workflow/controllers/workflow-transitions.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: aggregateId | `src/modules/workflow/controllers/workflow-transitions.controller.ts:52` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `workflow.state_machine_definitions` | LEE | LEE | DIRECTA | WorkflowTransitionsController.getTransitionHistory → TransitionExecutionService.getTransitionHistory → StateMachinesRepository.findActiveMachineByCode | `src/modules/workflow/repositories/state-machines.repository.ts:330` |
| `workflow.state_transition_definitions` | LEE | LEE | DIRECTA | WorkflowTransitionsController.getTransitionHistory → TransitionExecutionService.getTransitionHistory → StateMachinesRepository.findTransitionById | `src/modules/workflow/repositories/state-machines.repository.ts:492` |
| `workflow.state_transition_events` | LEE | LEE | DIRECTA | WorkflowTransitionsController.getTransitionHistory → TransitionExecutionService.getTransitionHistory → WorkflowRuntimeRepository.findTransitionEventsByAggregate | `src/modules/workflow/repositories/workflow-runtime.repository.ts:260` |
| `workflow.workflow_instances` | LEE | LEE | DIRECTA | WorkflowTransitionsController.getTransitionHistory → TransitionExecutionService.getTransitionHistory → WorkflowRuntimeRepository.findInstanceByAggregate | `src/modules/workflow/repositories/workflow-runtime.repository.ts:372` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `aggregateId` | path | Sí | `string` | — |
| `machineCode` | query | No | `string` | Filtra por máquina de estado |
| `limit` | query | No | `number` | — |
| `offset` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TransitionHistoryResponseDto>` · DTO `TransitionHistoryResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `aggregateId` | `string` | Sí | formato uuid | — | Identificador asociado a aggregate. | `src/modules/workflow/dto/workflow.dto.ts:964` |
| `transitions` | `array<TransitionHistoryEntryDto>` | Sí | — | — | Valor de transitions mantenido por la instancia. | `src/modules/workflow/dto/workflow.dto.ts:970` |
| `transitions[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/workflow/dto/workflow.dto.ts:893` |
| `transitions[].fromStateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a from state concept. | `src/modules/workflow/dto/workflow.dto.ts:899` |
| `transitions[].toStateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a to state concept. | `src/modules/workflow/dto/workflow.dto.ts:905` |
| `transitions[].transitionCode` | `string` | No | — | — | Código de la transición aplicada | `src/modules/workflow/dto/workflow.dto.ts:911` |
| `transitions[].commandCode` | `string` | No | — | — | Comando que la disparó | `src/modules/workflow/dto/workflow.dto.ts:917` |
| `transitions[].actorUserId` | `string` | Sí | formato uuid | — | Identificador asociado a actor user. | `src/modules/workflow/dto/workflow.dto.ts:923` |
| `transitions[].reasonConceptId` | `string` | No | formato uuid | — | Identificador asociado a reason concept. | `src/modules/workflow/dto/workflow.dto.ts:929` |
| `transitions[].reasonText` | `string` | No | — | — | Valor de reason text mantenido por la instancia. | `src/modules/workflow/dto/workflow.dto.ts:935` |
| `transitions[].correlationId` | `string` | No | formato uuid | — | Identificador asociado a correlation. | `src/modules/workflow/dto/workflow.dto.ts:941` |
| `transitions[].causationId` | `string` | No | formato uuid | — | Identificador asociado a causation. | `src/modules/workflow/dto/workflow.dto.ts:947` |
| `transitions[].occurredAt` | `string` | Sí | formato date-time | — | Valor de occurred at mantenido por la instancia. | `src/modules/workflow/dto/workflow.dto.ts:953` |
| `total` | `number` | Sí | — | — | Total de transiciones que cumplen el filtro | `src/modules/workflow/dto/workflow.dto.ts:976` |
| `currentStateConceptId` | `string` | No | formato uuid | — | Estado actual de la instancia asociada | `src/modules/workflow/dto/workflow.dto.ts:985` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No hay una máquina activa con ese código. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/workflow.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 32 — Máquinas de estado y flujos entre dominios — etapa `UC-32-11`

---

## 2. POST /workflow/aggregates/{aggregateId}/transitions/{commandCode}

- **Origen:** CONTRATO
- **Nombre:** Disparar una transición validada
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `WorkflowTransitionsController.triggerTransition` — `src/modules/workflow/controllers/workflow-transitions.controller.ts:73`

### Qué es y para qué sirve (negocio)

Disparar una transición validada. Caso de uso UC-32-05: Disparar transición validada. Dentro del módulo (descripción del modelo, en inglés): «Makes lifecycle rules executable and auditable.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/workflow/README.md:46`) · MODELO (`Mantra Core Health Context/modules/diagram_32_workflow.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /workflow/aggregates/{aggregateId}/transitions/{commandCode}` la atiende `WorkflowTransitionsController.triggerTransition` (src/modules/workflow/controllers/workflow-transitions.controller.ts:73). Exige sesión con alguno de los roles CLINICIAN, BILLING_AGENT, SCHEDULER, SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `TriggerTransitionDto` (9 campos, 1 obligatorio). Delega en `TransitionExecutionService.triggerTransition`. Crea filas en messaging.domain_events, messaging.outbox_messages, workflow.state_transition_events. Lee messaging.outbox_messages, workflow.state_machine_definitions, workflow.state_transition_definitions, workflow.state_transition_events, workflow.transition_guards, workflow.transition_side_effects. Publica un evento calculado (effect.outboxEventType).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, BILLING_AGENT, SCHEDULER, SYSTEM, PLATFORM_ADMIN | `src/modules/workflow/controllers/workflow-transitions.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CABECERA | idempotency-key (obligatoria) | `contrato (parameters)` |
| CABECERA | Idempotency-Key (opcional) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: aggregateId | `src/modules/workflow/controllers/workflow-transitions.controller.ts:73` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | WorkflowTransitionsController.triggerTransition → TransitionExecutionService.triggerTransition → TransitionExecutionService.publishSideEffects → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | WorkflowTransitionsController.triggerTransition → TransitionExecutionService.triggerTransition → TransitionExecutionService.publishSideEffects → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | WorkflowTransitionsController.triggerTransition → TransitionExecutionService.triggerTransition → TransitionExecutionService.publishSideEffects → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `workflow.state_machine_definitions` | LEE | LEE | DIRECTA | WorkflowTransitionsController.triggerTransition → TransitionExecutionService.triggerTransition → TransitionExecutionService.requireActiveMachine → StateMachinesRepository.findActiveMachineByCode | `src/modules/workflow/repositories/state-machines.repository.ts:330` |
| `workflow.state_transition_definitions` | LEE | LEE | DIRECTA | WorkflowTransitionsController.triggerTransition → TransitionExecutionService.triggerTransition → StateMachinesRepository.findTransitionByCommand | `src/modules/workflow/repositories/state-machines.repository.ts:525` |
| `workflow.state_transition_events` | ESCRIBE | CREA | DIRECTA | WorkflowTransitionsController.triggerTransition → TransitionExecutionService.triggerTransition → WorkflowRuntimeRepository.createTransitionEvent | `src/modules/workflow/repositories/workflow-runtime.repository.ts:182` |
| `workflow.state_transition_events` | LEE | LEE | DIRECTA | WorkflowTransitionsController.triggerTransition → TransitionExecutionService.triggerTransition → WorkflowRuntimeRepository.findTransitionEventByIdempotencyKey | `src/modules/workflow/repositories/workflow-runtime.repository.ts:230` |
| `workflow.transition_guards` | LEE | LEE | DIRECTA | WorkflowTransitionsController.triggerTransition → TransitionExecutionService.triggerTransition → StateMachinesRepository.findGuardsByTransition | `src/modules/workflow/repositories/state-machines.repository.ts:578` |
| `workflow.transition_side_effects` | LEE | LEE | DIRECTA | WorkflowTransitionsController.triggerTransition → TransitionExecutionService.triggerTransition → TransitionExecutionService.publishSideEffects → StateMachinesRepository.findSideEffectsByTransition | `src/modules/workflow/repositories/state-machines.repository.ts:625` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `effect.outboxEventType` | `src/modules/workflow/services/transition-execution.service.ts:750` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `aggregateId` | path | Sí | `string` | — |
| `commandCode` | path | Sí | `string` | — |
| `idempotency-key` | header | Sí | `string` | — |
| `Idempotency-Key` | header | No | `string` | Obligatoria si la transición declara `idempotency_required`. |

### Cuerpo — DTO `TriggerTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `machineCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Máquina de estado que gobierna el agregado | `src/modules/workflow/dto/workflow.dto.ts:548` |
| `purposeOfUseConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Propósito de uso con el que se dispara el comando. Debe coincidir con el que exige la transición; si ésta lo exige y falta o difiere, 403 WORKFLOW_PURPOSE_NOT_ALLOWED | `src/modules/workflow/dto/workflow.dto.ts:560` |
| `actorTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant en cuyo nombre actúa el llamante; queda en el evento de transición | `src/modules/workflow/dto/workflow.dto.ts:572` |
| `reasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Motivo del movimiento | `src/modules/workflow/dto/workflow.dto.ts:580` |
| `reasonText` | `string` | No | — | `@IsOptional()` `@IsString()` | Texto libre del motivo | `src/modules/workflow/dto/workflow.dto.ts:588` |
| `expectedRowVersion` | `number` | No | formato uuid; mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Versión del agregado que vio el llamante; exigida si la transición usa bloqueo optimista | `src/modules/workflow/dto/workflow.dto.ts:601` |
| `correlationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Hilo de negocio al que pertenece | `src/modules/workflow/dto/workflow.dto.ts:612` |
| `causationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Evento que causó éste | `src/modules/workflow/dto/workflow.dto.ts:620` |
| `payloadJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Datos del comando para las guardas | `src/modules/workflow/dto/workflow.dto.ts:628` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "machineCode": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "machineCode": "CODIGO_EJEMPLO",
  "purposeOfUseConceptId": "00000000-0000-4000-8000-000000000001",
  "actorTenantId": "00000000-0000-4000-8000-000000000001",
  "reasonConceptId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo",
  "expectedRowVersion": 1,
  "correlationId": "00000000-0000-4000-8000-000000000001",
  "causationId": "00000000-0000-4000-8000-000000000001",
  "payloadJson": {}
}
```

</details>

### Respuesta — `Promise<TransitionEventResponseDto>` · DTO `TransitionEventResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/workflow/dto/workflow.dto.ts:639` |
| `aggregateId` | `string` | Sí | formato uuid | — | Identificador asociado a aggregate. | `src/modules/workflow/dto/workflow.dto.ts:645` |
| `fromStateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a from state concept. | `src/modules/workflow/dto/workflow.dto.ts:651` |
| `toStateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a to state concept. | `src/modules/workflow/dto/workflow.dto.ts:657` |
| `occurredAt` | `string` | Sí | formato date-time | — | Valor de occurred at mantenido por la instancia. | `src/modules/workflow/dto/workflow.dto.ts:663` |
| `publishedEffects` | `number` | Sí | — | — | Eventos publicados en el outbox por los efectos de la transición | `src/modules/workflow/dto/workflow.dto.ts:672` |
| `duplicate` | `boolean` | Sí | — | — | Verdadero si la clave de idempotencia ya se había aplicado y se devuelve el resultado previo | `src/modules/workflow/dto/workflow.dto.ts:681` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No hay una versión activa de esa máquina de estado.; ResourceNotFoundException: El agregado gobernado no existe. |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: El agregado cambió desde que el llamante lo leyó. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El comando no es aplicable desde el estado actual del agregado.; PreconditionFailedException: Esta transición exige cabecera Idempotency-Key.; PreconditionFailedException: Esta transición exige declarar el motivo.; PreconditionFailedException: Esta transición exige enviar la versión del agregado que vio el llamante.; PreconditionFailedException: {guard.failureMessageKey ?? 'La transición no cumple una gua…} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/workflow.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 32 — Máquinas de estado y flujos entre dominios — etapa `UC-32-05`

---

## 3. POST /workflow/aggregates/{aggregateId}/transitions/{eventId}/compensate

- **Origen:** CONTRATO
- **Nombre:** Compensar una transición
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `WorkflowTransitionsController.compensateTransition` — `src/modules/workflow/controllers/workflow-transitions.controller.ts:108`

### Qué es y para qué sirve (negocio)

Compensar una transición. Caso de uso UC-32-08: Compensar (saga). Dentro del módulo (descripción del modelo, en inglés): «Makes lifecycle rules executable and auditable.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/workflow/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_32_workflow.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /workflow/aggregates/{aggregateId}/transitions/{eventId}/compensate` la atiende `WorkflowTransitionsController.compensateTransition` (src/modules/workflow/controllers/workflow-transitions.controller.ts:108). Exige sesión con alguno de los roles SYSTEM, SAGA_ORCHESTRATOR, PLATFORM_ADMIN. Valida el cuerpo como `CompensateTransitionDto` (2 campos, 1 obligatorio). Delega en `TransitionExecutionService.compensateTransition`. Crea filas en messaging.domain_events, messaging.outbox_messages, workflow.state_transition_events. Lee messaging.outbox_messages, workflow.state_machine_definitions, workflow.state_transition_events, workflow.transition_side_effects. Publica TransitionCompensated, un evento calculado (`${effect.outboxEventType}.compensated`).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SAGA_ORCHESTRATOR, PLATFORM_ADMIN | `src/modules/workflow/controllers/workflow-transitions.controller.ts:108` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: aggregateId, eventId | `src/modules/workflow/controllers/workflow-transitions.controller.ts:108` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | WorkflowTransitionsController.compensateTransition → TransitionExecutionService.compensateTransition → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | WorkflowTransitionsController.compensateTransition → TransitionExecutionService.compensateTransition → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | WorkflowTransitionsController.compensateTransition → TransitionExecutionService.compensateTransition → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `workflow.state_machine_definitions` | LEE | LEE | DIRECTA | WorkflowTransitionsController.compensateTransition → TransitionExecutionService.compensateTransition → StateMachinesRepository.findMachineById | `src/modules/workflow/repositories/state-machines.repository.ts:292` |
| `workflow.state_transition_events` | ESCRIBE | CREA | DIRECTA | WorkflowTransitionsController.compensateTransition → TransitionExecutionService.compensateTransition → WorkflowRuntimeRepository.createTransitionEvent | `src/modules/workflow/repositories/workflow-runtime.repository.ts:182` |
| `workflow.state_transition_events` | LEE | LEE | DIRECTA | WorkflowTransitionsController.compensateTransition → TransitionExecutionService.compensateTransition → WorkflowRuntimeRepository.findTransitionEventById | `src/modules/workflow/repositories/workflow-runtime.repository.ts:216` |
| `workflow.transition_side_effects` | LEE | LEE | DIRECTA | WorkflowTransitionsController.compensateTransition → TransitionExecutionService.compensateTransition → StateMachinesRepository.findSideEffectsByTransition | `src/modules/workflow/repositories/state-machines.repository.ts:625` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `TransitionCompensated` | `src/modules/workflow/services/transition-execution.service.ts:394` |
| Evento de dominio | calculado: `\`${effect.outboxEventType}.compensated\`` | `src/modules/workflow/services/transition-execution.service.ts:411` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `aggregateId` | path | Sí | `string` | — |
| `eventId` | path | Sí | `string` | — |

### Cuerpo — DTO `CompensateTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reasonText` | `string` | Sí | — | `@IsString()` | Por qué se compensa | `src/modules/workflow/dto/workflow.dto.ts:695` |
| `correlationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Saga a la que pertenece la compensación | `src/modules/workflow/dto/workflow.dto.ts:706` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reasonText": "Texto descriptivo de ejemplo",
  "correlationId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<CompensateTransitionResponseDto>` · DTO `CompensateTransitionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `compensationEventId` | `string` | Sí | formato uuid | — | Evento de compensación registrado | `src/modules/workflow/dto/workflow.dto.ts:720` |
| `originalEventId` | `string` | Sí | formato uuid | — | Evento original que se revierte | `src/modules/workflow/dto/workflow.dto.ts:729` |
| `restoredStateConceptId` | `string` | Sí | formato uuid | — | Estado al que vuelve el agregado | `src/modules/workflow/dto/workflow.dto.ts:738` |
| `publishedEffects` | `number` | Sí | — | — | Eventos de compensación publicados en el outbox | `src/modules/workflow/dto/workflow.dto.ts:746` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La transición original no existe para ese agregado.; ResourceNotFoundException: Máquina de estado no encontrada.; ResourceNotFoundException: El agregado gobernado no existe. |
| 409 | `CONFLICT` | ConflictException: El agregado ya no está en el estado que dejó la transición que se quiere compensar. |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: El agregado cambió durante la compensación. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La transición no declara compensación, así que no es reversible. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/workflow.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 32 — Máquinas de estado y flujos entre dominios — etapa `UC-32-08`

---

## 4. POST /workflow/aggregates/{aggregateId}/transitions/{eventId}/retry

- **Origen:** CONTRATO
- **Nombre:** Reintentar una transición cuyo efecto falló
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `WorkflowTransitionsController.retryTransition` — `src/modules/workflow/controllers/workflow-transitions.controller.ts:136`

### Qué es y para qué sirve (negocio)

Reintentar una transición cuyo efecto falló. Caso de uso UC-32-09: Reintentar transición fallida. Dentro del módulo (descripción del modelo, en inglés): «Makes lifecycle rules executable and auditable.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/workflow/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_32_workflow.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /workflow/aggregates/{aggregateId}/transitions/{eventId}/retry` la atiende `WorkflowTransitionsController.retryTransition` (src/modules/workflow/controllers/workflow-transitions.controller.ts:136). Exige sesión con alguno de los roles SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `RetryTransitionDto` (1 campo, 0 obligatorios). Delega en `TransitionExecutionService.retryTransition`. Crea filas en messaging.domain_events, messaging.outbox_messages, workflow.state_transition_events. Actualiza workflow.workflow_instances. Lee messaging.outbox_messages, workflow.state_transition_events, workflow.transition_side_effects, workflow.workflow_instances. Publica un evento calculado (effect.outboxEventType).

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PLATFORM_ADMIN | `src/modules/workflow/controllers/workflow-transitions.controller.ts:136` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: aggregateId, eventId | `src/modules/workflow/controllers/workflow-transitions.controller.ts:136` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | WorkflowTransitionsController.retryTransition → TransitionExecutionService.retryTransition → TransitionExecutionService.publishSideEffects → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | WorkflowTransitionsController.retryTransition → TransitionExecutionService.retryTransition → TransitionExecutionService.publishSideEffects → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | WorkflowTransitionsController.retryTransition → TransitionExecutionService.retryTransition → TransitionExecutionService.publishSideEffects → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `workflow.state_transition_events` | ESCRIBE | CREA | DIRECTA | WorkflowTransitionsController.retryTransition → TransitionExecutionService.retryTransition → WorkflowRuntimeRepository.createTransitionEvent | `src/modules/workflow/repositories/workflow-runtime.repository.ts:182` |
| `workflow.state_transition_events` | LEE | LEE | DIRECTA | WorkflowTransitionsController.retryTransition → TransitionExecutionService.retryTransition → WorkflowRuntimeRepository.findTransitionEventById | `src/modules/workflow/repositories/workflow-runtime.repository.ts:216` |
| `workflow.transition_side_effects` | LEE | LEE | DIRECTA | WorkflowTransitionsController.retryTransition → TransitionExecutionService.retryTransition → TransitionExecutionService.publishSideEffects → StateMachinesRepository.findSideEffectsByTransition | `src/modules/workflow/repositories/state-machines.repository.ts:625` |
| `workflow.workflow_instances` | ESCRIBE | ACTUALIZA | POR_TIPO | WorkflowTransitionsController.retryTransition → TransitionExecutionService.retryTransition | `src/modules/workflow/services/transition-execution.service.ts:500` |
| `workflow.workflow_instances` | LEE | LEE | DIRECTA | WorkflowTransitionsController.retryTransition → TransitionExecutionService.retryTransition → WorkflowRuntimeRepository.findInstanceForUpdate | `src/modules/workflow/repositories/workflow-runtime.repository.ts:336` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `effect.outboxEventType` | `src/modules/workflow/services/transition-execution.service.ts:750` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `aggregateId` | path | Sí | `string` | — |
| `eventId` | path | Sí | `string` | — |

### Cuerpo — DTO `RetryTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `workflowInstanceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Instancia en `retry_scheduled` que vuelve a `running` | `src/modules/workflow/dto/workflow.dto.ts:764` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "workflowInstanceId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<RetryTransitionResponseDto>` · DTO `RetryTransitionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `retryEventId` | `string` | Sí | formato uuid | — | Evento de reintento registrado | `src/modules/workflow/dto/workflow.dto.ts:778` |
| `originalEventId` | `string` | Sí | formato uuid | — | Identificador asociado a original event. | `src/modules/workflow/dto/workflow.dto.ts:784` |
| `idempotencyKey` | `string` | No | — | — | Clave de idempotencia conservada del original, para no duplicar el efecto de negocio | `src/modules/workflow/dto/workflow.dto.ts:793` |
| `workflowInstanceId` | `string` | No | formato uuid | — | Identificador asociado a workflow instance. | `src/modules/workflow/dto/workflow.dto.ts:799` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La transición original no existe para ese agregado.; ResourceNotFoundException: Instancia de workflow no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La instancia no está en espera de reintento. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/workflow.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 32 — Máquinas de estado y flujos entre dominios — etapa `UC-32-09`

---

## 5. POST /workflow/instances

- **Origen:** CONTRATO
- **Nombre:** Crear una instancia de workflow y sus tareas iniciales
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `WorkflowInstancesController.createInstance` — `src/modules/workflow/controllers/workflow-instances.controller.ts:63`

### Qué es y para qué sirve (negocio)

Crear una instancia de workflow y sus tareas iniciales. Caso de uso UC-32-12: Crear instancia y tareas. Dentro del módulo (descripción del modelo, en inglés): «Makes lifecycle rules executable and auditable.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/workflow/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_32_workflow.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /workflow/instances` la atiende `WorkflowInstancesController.createInstance` (src/modules/workflow/controllers/workflow-instances.controller.ts:63). Exige sesión con alguno de los roles CLINICIAN, BILLING_AGENT, SCHEDULER, SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `CreateWorkflowInstanceDto` (14 campos, 4 obligatorios). Delega en `WorkflowInstancesService.createInstance`. Crea filas en messaging.domain_events, messaging.outbox_messages, workflow.workflow_instances, workflow.workflow_tasks. Lee messaging.outbox_messages, workflow.state_definitions, workflow.state_machine_definitions, workflow.workflow_instances. Publica WorkflowInstanceStarted.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, BILLING_AGENT, SCHEDULER, SYSTEM, PLATFORM_ADMIN | `src/modules/workflow/controllers/workflow-instances.controller.ts:63` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | WorkflowInstancesController.createInstance → WorkflowInstancesService.createInstance → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | WorkflowInstancesController.createInstance → WorkflowInstancesService.createInstance → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | WorkflowInstancesController.createInstance → WorkflowInstancesService.createInstance → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `workflow.state_definitions` | LEE | LEE | DIRECTA | WorkflowInstancesController.createInstance → WorkflowInstancesService.createInstance → StateMachinesRepository.findInitialState | `src/modules/workflow/repositories/state-machines.repository.ts:441` |
| `workflow.state_machine_definitions` | LEE | LEE | DIRECTA | WorkflowInstancesController.createInstance → WorkflowInstancesService.createInstance → StateMachinesRepository.findActiveMachineByCode | `src/modules/workflow/repositories/state-machines.repository.ts:330` |
| `workflow.workflow_instances` | ESCRIBE | CREA | DIRECTA | WorkflowInstancesController.createInstance → WorkflowInstancesService.createInstance → WorkflowRuntimeRepository.createInstance | `src/modules/workflow/repositories/workflow-runtime.repository.ts:293` |
| `workflow.workflow_instances` | LEE | LEE | DIRECTA | WorkflowInstancesController.createInstance → WorkflowInstancesService.createInstance → WorkflowRuntimeRepository.findLiveInstance | `src/modules/workflow/repositories/workflow-runtime.repository.ts:354` |
| `workflow.workflow_tasks` | ESCRIBE | CREA | DIRECTA | WorkflowInstancesController.createInstance → WorkflowInstancesService.createInstance → WorkflowRuntimeRepository.createTask | `src/modules/workflow/repositories/workflow-runtime.repository.ts:410` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `WorkflowInstanceStarted` | `src/modules/workflow/services/workflow-instances.service.ts:152` |

### Cuerpo — DTO `CreateWorkflowInstanceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `workflowCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código de la máquina activa que gobierna el flujo | `src/modules/workflow/dto/workflow.dto.ts:1055` |
| `subjectTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/workflow/dto/workflow.dto.ts:1062` |
| `subjectId` | `string` | Sí | formato uuid | `@IsUUID()` | Agregado sobre el que corre el flujo | `src/modules/workflow/dto/workflow.dto.ts:1072` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/workflow/dto/workflow.dto.ts:1079` |
| `currentStepCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/workflow/dto/workflow.dto.ts:1088` |
| `contextJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Contexto del flujo | `src/modules/workflow/dto/workflow.dto.ts:1096` |
| `dueAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Plazo de la instancia | `src/modules/workflow/dto/workflow.dto.ts:1107` |
| `tasks` | `array<WorkflowTaskInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => WorkflowTaskInputDto)` | Tareas de los pasos iniciales | `src/modules/workflow/dto/workflow.dto.ts:1120` |
| `tasks[].taskCode` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/workflow/dto/workflow.dto.ts:1002` |
| `tasks[].taskTypeConceptId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/workflow/dto/workflow.dto.ts:1009` |
| `tasks[].assignedUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/workflow/dto/workflow.dto.ts:1017` |
| `tasks[].assignedRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/workflow/dto/workflow.dto.ts:1025` |
| `tasks[].requiredPermissionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/workflow/dto/workflow.dto.ts:1033` |
| `tasks[].dueAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/workflow/dto/workflow.dto.ts:1041` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "workflowCode": "CODIGO_EJEMPLO",
  "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<WorkflowInstanceResponseDto>` · DTO `WorkflowInstanceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/workflow/dto/workflow.dto.ts:1131` |
| `workflowCode` | `string` | Sí | — | — | Valor de workflow code mantenido por la instancia. | `src/modules/workflow/dto/workflow.dto.ts:1137` |
| `currentStateConceptId` | `string` | Sí | formato uuid | — | Estado inicial tomado de la definición | `src/modules/workflow/dto/workflow.dto.ts:1146` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/workflow/dto/workflow.dto.ts:1152` |
| `taskIds` | `array<string>` | Sí | formato uuid | — | Valor de task ids mantenido por la instancia. | `src/modules/workflow/dto/workflow.dto.ts:1158` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No hay una versión activa de la máquina de estado para ese workflow. |
| 409 | `CONFLICT` | ConflictException: Ya hay una instancia viva de ese workflow para el sujeto. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La definición activa no declara estado inicial. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/workflow.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 32 — Máquinas de estado y flujos entre dominios — etapa `UC-32-12`

---

## 6. POST /workflow/instances/sweep-timeouts

- **Origen:** CONTRATO
- **Nombre:** Escalar las instancias con el plazo vencido
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `WorkflowInstancesController.sweepTimeouts` — `src/modules/workflow/controllers/workflow-instances.controller.ts:43`

### Qué es y para qué sirve (negocio)

Escalar las instancias con el plazo vencido. Caso de uso UC-32-10: Escalar por vencimiento. Dentro del módulo (descripción del modelo, en inglés): «Makes lifecycle rules executable and auditable.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/workflow/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_32_workflow.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /workflow/instances/sweep-timeouts` la atiende `WorkflowInstancesController.sweepTimeouts` (src/modules/workflow/controllers/workflow-instances.controller.ts:43). Exige sesión con alguno de los roles SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `SweepTimeoutsDto` (1 campo, 0 obligatorios). Delega en `WorkflowInstancesService.sweepTimeouts`. Crea filas en messaging.domain_events, messaging.outbox_messages. Actualiza workflow.workflow_instances, workflow.workflow_tasks. Lee messaging.outbox_messages, workflow.workflow_instances, workflow.workflow_tasks. Publica WorkflowTimedOut.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PLATFORM_ADMIN | `src/modules/workflow/controllers/workflow-instances.controller.ts:43` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | WorkflowInstancesController.sweepTimeouts → WorkflowInstancesService.sweepTimeouts → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | WorkflowInstancesController.sweepTimeouts → WorkflowInstancesService.sweepTimeouts → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | WorkflowInstancesController.sweepTimeouts → WorkflowInstancesService.sweepTimeouts → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `workflow.workflow_instances` | ESCRIBE | ACTUALIZA | POR_TIPO | WorkflowInstancesController.sweepTimeouts → WorkflowInstancesService.sweepTimeouts | `src/modules/workflow/services/workflow-instances.service.ts:382` |
| `workflow.workflow_instances` | LEE | LEE | DIRECTA | WorkflowInstancesController.sweepTimeouts → WorkflowInstancesService.sweepTimeouts → WorkflowRuntimeRepository.findDueInstancesForUpdate | `src/modules/workflow/repositories/workflow-runtime.repository.ts:389` |
| `workflow.workflow_tasks` | ESCRIBE | ACTUALIZA | POR_TIPO | WorkflowInstancesController.sweepTimeouts → WorkflowInstancesService.sweepTimeouts | `src/modules/workflow/services/workflow-instances.service.ts:397` |
| `workflow.workflow_tasks` | LEE | LEE | DIRECTA | WorkflowInstancesController.sweepTimeouts → WorkflowInstancesService.sweepTimeouts → WorkflowRuntimeRepository.findDueTasksByInstanceForUpdate | `src/modules/workflow/repositories/workflow-runtime.repository.ts:482` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `WorkflowTimedOut` | `src/modules/workflow/services/workflow-instances.service.ts:402` |

### Cuerpo — DTO `SweepTimeoutsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `batchSize` | `number` | No | mínimo 1; máximo 500 | `@IsOptional()` `@IsInt()` `@Min(1)` | Cuántas instancias vencidas toma este barrido | `src/modules/workflow/dto/workflow.dto.ts:820` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "batchSize": 50
}
```

</details>

### Respuesta — `Promise<SweepTimeoutsResponseDto>` · DTO `SweepTimeoutsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `escalatedInstances` | `number` | Sí | — | — | Instancias que quedaron escaladas | `src/modules/workflow/dto/workflow.dto.ts:831` |
| `escalatedTasks` | `number` | Sí | — | — | Tareas que quedaron escaladas | `src/modules/workflow/dto/workflow.dto.ts:837` |
| `instanceIds` | `array<string>` | Sí | formato uuid | — | Valor de instance ids mantenido por la instancia. | `src/modules/workflow/dto/workflow.dto.ts:843` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/workflow.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 32 — Máquinas de estado y flujos entre dominios — etapa `UC-32-10`

---

## 7. POST /workflow/state-machines

- **Origen:** CONTRATO
- **Nombre:** Registrar una definición de máquina de estado
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `WorkflowDefinitionsController.registerStateMachine` — `src/modules/workflow/controllers/workflow-definitions.controller.ts:47`

### Qué es y para qué sirve (negocio)

Registrar una definición de máquina de estado. Caso de uso UC-32-01: Registrar definición de máquina. Dentro del módulo (descripción del modelo, en inglés): «Makes lifecycle rules executable and auditable.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/workflow/README.md:42`) · MODELO (`Mantra Core Health Context/modules/diagram_32_workflow.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /workflow/state-machines` la atiende `WorkflowDefinitionsController.registerStateMachine` (src/modules/workflow/controllers/workflow-definitions.controller.ts:47). Exige sesión con alguno de los roles WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `RegisterStateMachineDto` (5 campos, 5 obligatorios). Delega en `StateMachineDefinitionService.registerStateMachine`. Crea filas en messaging.domain_events, messaging.outbox_messages, workflow.state_machine_definitions. Lee messaging.outbox_messages, workflow.state_machine_definitions. Publica StateMachineDefined.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/workflow/controllers/workflow-definitions.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | WorkflowDefinitionsController.registerStateMachine → StateMachineDefinitionService.registerStateMachine → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | WorkflowDefinitionsController.registerStateMachine → StateMachineDefinitionService.registerStateMachine → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | WorkflowDefinitionsController.registerStateMachine → StateMachineDefinitionService.registerStateMachine → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `workflow.state_machine_definitions` | ESCRIBE | CREA | DIRECTA | WorkflowDefinitionsController.registerStateMachine → StateMachineDefinitionService.registerStateMachine → StateMachinesRepository.createMachine | `src/modules/workflow/repositories/state-machines.repository.ts:264` |
| `workflow.state_machine_definitions` | LEE | LEE | DIRECTA | WorkflowDefinitionsController.registerStateMachine → StateMachineDefinitionService.registerStateMachine → StateMachinesRepository.findMachineByCode | `src/modules/workflow/repositories/state-machines.repository.ts:318` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `StateMachineDefined` | `src/modules/workflow/services/state-machine-definition.service.ts:95` |

### Cuerpo — DTO `RegisterStateMachineDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `machineCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código único de la máquina | `src/modules/workflow/dto/workflow.dto.ts:30` |
| `aggregateSchemaName` | `string` | Sí | longitud máxima 63 | `@IsString()` `@MaxLength(63)` | Esquema del agregado gobernado, p. ej. `clinical` | `src/modules/workflow/dto/workflow.dto.ts:41` |
| `aggregateEntityName` | `string` | Sí | longitud máxima 63 | `@IsString()` `@MaxLength(63)` | Tabla del agregado gobernado | `src/modules/workflow/dto/workflow.dto.ts:49` |
| `statusFieldName` | `string` | Sí | longitud máxima 63 | `@IsString()` `@MaxLength(63)` | Columna del agregado que guarda el estado | `src/modules/workflow/dto/workflow.dto.ts:60` |
| `stateValueSetId` | `string` | Sí | formato uuid | `@IsUUID()` | Value set gobernado del que salen los estados (Módulo 04) | `src/modules/workflow/dto/workflow.dto.ts:70` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "machineCode": "CODIGO_EJEMPLO",
  "aggregateSchemaName": "Nombre de ejemplo",
  "aggregateEntityName": "Nombre de ejemplo",
  "statusFieldName": "Nombre de ejemplo",
  "stateValueSetId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "machineCode": "CODIGO_EJEMPLO",
  "aggregateSchemaName": "Nombre de ejemplo",
  "aggregateEntityName": "Nombre de ejemplo",
  "statusFieldName": "Nombre de ejemplo",
  "stateValueSetId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<StateMachineResponseDto>` · DTO `StateMachineResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/workflow/dto/workflow.dto.ts:81` |
| `machineCode` | `string` | Sí | — | — | Valor de machine code mantenido por la instancia. | `src/modules/workflow/dto/workflow.dto.ts:87` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/workflow/dto/workflow.dto.ts:93` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/workflow/dto/workflow.dto.ts:99` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una máquina de estado con ese código. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/workflow.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 32 — Máquinas de estado y flujos entre dominios — etapa `UC-32-01`

---

## 8. POST /workflow/state-machines/{id}/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar la versión de la definición
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `WorkflowDefinitionsController.publishStateMachine` — `src/modules/workflow/controllers/workflow-definitions.controller.ts:111`

### Qué es y para qué sirve (negocio)

Publicar la versión de la definición. Caso de uso UC-32-04: Publicar/activar la versión. Dentro del módulo (descripción del modelo, en inglés): «Makes lifecycle rules executable and auditable.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/workflow/README.md:45`) · MODELO (`Mantra Core Health Context/modules/diagram_32_workflow.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /workflow/state-machines/{id}/publish` la atiende `WorkflowDefinitionsController.publishStateMachine` (src/modules/workflow/controllers/workflow-definitions.controller.ts:111). Exige sesión con alguno de los roles WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `PublishStateMachineDto` (1 campo, 0 obligatorios). Delega en `StateMachineDefinitionService.publishStateMachine`. Crea filas en messaging.domain_events, messaging.outbox_messages. Actualiza workflow.state_machine_definitions. Lee messaging.outbox_messages, workflow.state_definitions, workflow.state_machine_definitions, workflow.state_transition_definitions. Publica StateMachineVersionPublished.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/workflow/controllers/workflow-definitions.controller.ts:111` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/workflow/controllers/workflow-definitions.controller.ts:111` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | WorkflowDefinitionsController.publishStateMachine → StateMachineDefinitionService.publishStateMachine → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | WorkflowDefinitionsController.publishStateMachine → StateMachineDefinitionService.publishStateMachine → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | WorkflowDefinitionsController.publishStateMachine → StateMachineDefinitionService.publishStateMachine → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `workflow.state_definitions` | LEE | LEE | DIRECTA | WorkflowDefinitionsController.publishStateMachine → StateMachineDefinitionService.publishStateMachine → StateMachinesRepository.findStatesByMachine | `src/modules/workflow/repositories/state-machines.repository.ts:404` |
| `workflow.state_machine_definitions` | ESCRIBE | ACTUALIZA | POR_TIPO | WorkflowDefinitionsController.publishStateMachine → StateMachineDefinitionService.publishStateMachine | `src/modules/workflow/services/state-machine-definition.service.ts:472` |
| `workflow.state_machine_definitions` | LEE | LEE | DIRECTA | WorkflowDefinitionsController.publishStateMachine → StateMachineDefinitionService.publishStateMachine → StateMachinesRepository.findMachineForUpdate | `src/modules/workflow/repositories/state-machines.repository.ts:300` |
| `workflow.state_transition_definitions` | LEE | LEE | DIRECTA | WorkflowDefinitionsController.publishStateMachine → StateMachineDefinitionService.publishStateMachine → StateMachinesRepository.findTransitionsByMachine | `src/modules/workflow/repositories/state-machines.repository.ts:543` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `StateMachineVersionPublished` | `src/modules/workflow/services/state-machine-definition.service.ts:482` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishStateMachineDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `effectiveFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Desde cuándo rige; por omisión, ahora | `src/modules/workflow/dto/workflow.dto.ts:498` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "effectiveFrom": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<PublishStateMachineResponseDto>` · DTO `PublishStateMachineResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/workflow/dto/workflow.dto.ts:509` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/workflow/dto/workflow.dto.ts:515` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/workflow/dto/workflow.dto.ts:521` |
| `retiredVersionId` | `string` | No | formato uuid | — | Versión anterior que quedó retirada | `src/modules/workflow/dto/workflow.dto.ts:530` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Máquina de estado no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La definición ya no está en borrador.; PreconditionFailedException: La definición debe tener exactamente un estado inicial para publicarse.; PreconditionFailedException: La definición debe tener al menos un estado terminal para publicarse.; PreconditionFailedException: Hay estados inalcanzables desde el estado inicial. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/workflow.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 32 — Máquinas de estado y flujos entre dominios — etapa `UC-32-04`

---

## 9. POST /workflow/state-machines/{id}/states

- **Origen:** CONTRATO
- **Nombre:** Declarar los estados de la máquina
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `WorkflowDefinitionsController.defineStates` — `src/modules/workflow/controllers/workflow-definitions.controller.ts:68`

### Qué es y para qué sirve (negocio)

Declarar los estados de la máquina. Caso de uso UC-32-02: Declarar estados (inicial/terminal). Dentro del módulo (descripción del modelo, en inglés): «Makes lifecycle rules executable and auditable.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/workflow/README.md:43`) · MODELO (`Mantra Core Health Context/modules/diagram_32_workflow.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /workflow/state-machines/{id}/states` la atiende `WorkflowDefinitionsController.defineStates` (src/modules/workflow/controllers/workflow-definitions.controller.ts:68). Exige sesión con alguno de los roles WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `DefineStatesDto` (7 campos, 4 obligatorios). Delega en `StateMachineDefinitionService.defineStates`. Crea filas en workflow.state_definitions. Lee workflow.state_definitions, workflow.state_machine_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/workflow/controllers/workflow-definitions.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/workflow/controllers/workflow-definitions.controller.ts:68` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `workflow.state_definitions` | ESCRIBE | CREA | DIRECTA | WorkflowDefinitionsController.defineStates → StateMachineDefinitionService.defineStates → StateMachinesRepository.createState | `src/modules/workflow/repositories/state-machines.repository.ts:376` |
| `workflow.state_definitions` | LEE | LEE | DIRECTA | WorkflowDefinitionsController.defineStates → StateMachineDefinitionService.defineStates → StateMachinesRepository.findStatesByMachine | `src/modules/workflow/repositories/state-machines.repository.ts:404` |
| `workflow.state_machine_definitions` | LEE | LEE | DIRECTA | WorkflowDefinitionsController.defineStates → StateMachineDefinitionService.defineStates → StateMachinesRepository.findMachineForUpdate | `src/modules/workflow/repositories/state-machines.repository.ts:300` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DefineStatesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `states` | `array<StateDefinitionDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => StateDefinitionDto)` | — | `src/modules/workflow/dto/workflow.dto.ts:177` |
| `states[].stateConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto de estado del value set | `src/modules/workflow/dto/workflow.dto.ts:118` |
| `states[].stateCodeSnapshot` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código legible del estado, congelado | `src/modules/workflow/dto/workflow.dto.ts:129` |
| `states[].isInitial` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/workflow/dto/workflow.dto.ts:137` |
| `states[].isTerminal` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/workflow/dto/workflow.dto.ts:145` |
| `states[].allowsEdit` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si el agregado admite edición mientras está en este estado | `src/modules/workflow/dto/workflow.dto.ts:156` |
| `states[].ordinal` | `number` | Sí | mínimo 0 | `@IsInt()` `@Min(0)` | Orden de presentación | `src/modules/workflow/dto/workflow.dto.ts:164` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<DefineStatesResponseDto>` · DTO `DefineStatesResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `stateMachineDefinitionId` | `string` | Sí | formato uuid | — | Identificador asociado a state machine definition. | `src/modules/workflow/dto/workflow.dto.ts:188` |
| `stateIds` | `array<string>` | Sí | formato uuid | — | Valor de state ids mantenido por la instancia. | `src/modules/workflow/dto/workflow.dto.ts:194` |
| `totalStates` | `number` | Sí | — | — | Total de estados definidos en la máquina | `src/modules/workflow/dto/workflow.dto.ts:200` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Máquina de estado no encontrada. |
| 409 | `CONFLICT` | ConflictException: El estado ya está declarado en esta máquina. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se pueden declarar estados sobre una definición en borrador.; PreconditionFailedException: La máquina debe declarar exactamente un estado inicial. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/workflow.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 32 — Máquinas de estado y flujos entre dominios — etapa `UC-32-02`

---

## 10. POST /workflow/state-machines/{id}/transitions

- **Origen:** CONTRATO
- **Nombre:** Declarar una transición con sus guardas y efectos
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `WorkflowDefinitionsController.defineTransition` — `src/modules/workflow/controllers/workflow-definitions.controller.ts:90`

### Qué es y para qué sirve (negocio)

Declarar una transición con sus guardas y efectos. Caso de uso UC-32-03: Transición con guardas y efectos. Dentro del módulo (descripción del modelo, en inglés): «Makes lifecycle rules executable and auditable.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/workflow/README.md:44`) · MODELO (`Mantra Core Health Context/modules/diagram_32_workflow.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /workflow/state-machines/{id}/transitions` la atiende `WorkflowDefinitionsController.defineTransition` (src/modules/workflow/controllers/workflow-definitions.controller.ts:90). Exige sesión con alguno de los roles WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `DefineTransitionDto` (25 campos, 6 obligatorios). Delega en `StateMachineDefinitionService.defineTransition`. Crea filas en workflow.state_transition_definitions, workflow.transition_guards, workflow.transition_side_effects. Lee workflow.state_definitions, workflow.state_machine_definitions, workflow.state_transition_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: WORKFLOW_ARCHITECT, GOVERNANCE_ADMIN, PLATFORM_ADMIN | `src/modules/workflow/controllers/workflow-definitions.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/workflow/controllers/workflow-definitions.controller.ts:90` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `workflow.state_definitions` | LEE | LEE | DIRECTA | WorkflowDefinitionsController.defineTransition → StateMachineDefinitionService.defineTransition → StateMachinesRepository.findState | `src/modules/workflow/repositories/state-machines.repository.ts:424` |
| `workflow.state_machine_definitions` | LEE | LEE | DIRECTA | WorkflowDefinitionsController.defineTransition → StateMachineDefinitionService.defineTransition → StateMachinesRepository.findMachineForUpdate | `src/modules/workflow/repositories/state-machines.repository.ts:300` |
| `workflow.state_transition_definitions` | ESCRIBE | CREA | DIRECTA | WorkflowDefinitionsController.defineTransition → StateMachineDefinitionService.defineTransition → StateMachinesRepository.createTransition | `src/modules/workflow/repositories/state-machines.repository.ts:460` |
| `workflow.state_transition_definitions` | LEE | LEE | DIRECTA | WorkflowDefinitionsController.defineTransition → StateMachineDefinitionService.defineTransition → StateMachinesRepository.findTransitionByCode | `src/modules/workflow/repositories/state-machines.repository.ts:508` |
| `workflow.transition_guards` | ESCRIBE | CREA | DIRECTA | WorkflowDefinitionsController.defineTransition → StateMachineDefinitionService.defineTransition → StateMachinesRepository.createGuard | `src/modules/workflow/repositories/state-machines.repository.ts:556` |
| `workflow.transition_side_effects` | ESCRIBE | CREA | DIRECTA | WorkflowDefinitionsController.defineTransition → StateMachineDefinitionService.defineTransition → StateMachinesRepository.createSideEffect | `src/modules/workflow/repositories/state-machines.repository.ts:596` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DefineTransitionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `transitionCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/workflow/dto/workflow.dto.ts:353` |
| `fromStateConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/workflow/dto/workflow.dto.ts:360` |
| `toStateConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/workflow/dto/workflow.dto.ts:367` |
| `commandCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Comando que dispara la transición | `src/modules/workflow/dto/workflow.dto.ts:378` |
| `requiredPermissionId` | `string` | Sí | formato uuid | `@IsUUID()` | Permiso exigido al actor (Módulo 05) | `src/modules/workflow/dto/workflow.dto.ts:388` |
| `purposeOfUseConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Propósito de uso admitido | `src/modules/workflow/dto/workflow.dto.ts:395` |
| `idempotencyRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/workflow/dto/workflow.dto.ts:403` |
| `optimisticLockRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/workflow/dto/workflow.dto.ts:411` |
| `reasonRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/workflow/dto/workflow.dto.ts:419` |
| `transitionTimeoutSeconds` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Plazo tras el que la transición se considera vencida | `src/modules/workflow/dto/workflow.dto.ts:431` |
| `guards` | `array<TransitionGuardDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => TransitionGuardDto)` | — | `src/modules/workflow/dto/workflow.dto.ts:441` |
| `guards[].guardCode` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/workflow/dto/workflow.dto.ts:217` |
| `guards[].guardTypeConceptId` | `string` | No | formato uuid | `@IsUUID()` | Tipo de guarda (expresión, permiso, estado) | `src/modules/workflow/dto/workflow.dto.ts:227` |
| `guards[].evaluationOrder` | `number` | No | mínimo 0 | `@IsInt()` `@Min(0)` | Orden de evaluación; la primera que falla corta | `src/modules/workflow/dto/workflow.dto.ts:238` |
| `guards[].expressionJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Expresión declarativa de la guarda | `src/modules/workflow/dto/workflow.dto.ts:246` |
| `guards[].failureCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código de fallo estable que se devuelve al rechazar | `src/modules/workflow/dto/workflow.dto.ts:258` |
| `guards[].failureMessageKey` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Clave del mensaje traducible | `src/modules/workflow/dto/workflow.dto.ts:270` |
| `sideEffects` | `array<TransitionSideEffectDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => TransitionSideEffectDto)` | — | `src/modules/workflow/dto/workflow.dto.ts:451` |
| `sideEffects[].sideEffectCode` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/workflow/dto/workflow.dto.ts:283` |
| `sideEffects[].sideEffectTypeConceptId` | `string` | No | formato uuid | `@IsUUID()` | Tipo de efecto (outbox, tarea, notificación) | `src/modules/workflow/dto/workflow.dto.ts:293` |
| `sideEffects[].executionModeConceptId` | `string` | No | formato uuid | `@IsUUID()` | Modo de ejecución (síncrono o asíncrono) | `src/modules/workflow/dto/workflow.dto.ts:303` |
| `sideEffects[].executionOrder` | `number` | No | mínimo 0 | `@IsInt()` `@Min(0)` | — | `src/modules/workflow/dto/workflow.dto.ts:311` |
| `sideEffects[].outboxEventType` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Tipo de evento que se publica en el outbox al aplicar la transición | `src/modules/workflow/dto/workflow.dto.ts:324` |
| `sideEffects[].actionSpecJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Qué hace el efecto | `src/modules/workflow/dto/workflow.dto.ts:332` |
| `sideEffects[].compensationSpecJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Cómo se deshace; sin esto la transición no es compensable | `src/modules/workflow/dto/workflow.dto.ts:342` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "transitionCode": "CODIGO_EJEMPLO",
  "fromStateConceptId": "00000000-0000-4000-8000-000000000001",
  "toStateConceptId": "00000000-0000-4000-8000-000000000001",
  "commandCode": "CODIGO_EJEMPLO",
  "requiredPermissionId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUseConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<TransitionDefinitionResponseDto>` · DTO `TransitionDefinitionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/workflow/dto/workflow.dto.ts:462` |
| `transitionCode` | `string` | Sí | — | — | Valor de transition code mantenido por la instancia. | `src/modules/workflow/dto/workflow.dto.ts:468` |
| `guardCount` | `number` | Sí | — | — | Guardas creadas | `src/modules/workflow/dto/workflow.dto.ts:474` |
| `sideEffectCount` | `number` | Sí | — | — | Efectos creados | `src/modules/workflow/dto/workflow.dto.ts:480` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Máquina de estado no encontrada. |
| 409 | `CONFLICT` | ConflictException: Ya existe una transición con ese código en la máquina.; ConflictException: Dos guardas comparten el mismo orden de evaluación.; ConflictException: Dos efectos comparten el mismo orden de ejecución. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo se pueden declarar transiciones sobre una definición en borrador.; PreconditionFailedException: El estado de origen no está declarado en esta máquina.; PreconditionFailedException: Un estado terminal no puede tener transiciones de salida.; PreconditionFailedException: El estado de destino no está declarado en esta máquina. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/workflow.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 32 — Máquinas de estado y flujos entre dominios — etapa `UC-32-03`

---

## 11. POST /workflow/tasks/{id}/complete

- **Origen:** CONTRATO
- **Nombre:** Completar una tarea de workflow
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `WorkflowInstancesController.completeTask` — `src/modules/workflow/controllers/workflow-instances.controller.ts:84`

### Qué es y para qué sirve (negocio)

Completar una tarea de workflow. Caso de uso UC-32-13: Completar tarea. Dentro del módulo (descripción del modelo, en inglés): «Makes lifecycle rules executable and auditable.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/workflow/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_32_workflow.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /workflow/tasks/{id}/complete` la atiende `WorkflowInstancesController.completeTask` (src/modules/workflow/controllers/workflow-instances.controller.ts:84). Exige sesión con alguno de los roles CLINICIAN, BILLING_AGENT, SCHEDULER, PLATFORM_ADMIN. Valida el cuerpo como `CompleteTaskDto` (4 campos, 0 obligatorios). Delega en `WorkflowInstancesService.completeTask`. Crea filas en messaging.domain_events, messaging.outbox_messages, workflow.state_transition_events. Actualiza workflow.workflow_instances, workflow.workflow_tasks. Lee messaging.outbox_messages, workflow.state_machine_definitions, workflow.state_transition_definitions, workflow.workflow_instances, workflow.workflow_tasks. Publica WorkflowTaskCompleted.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, BILLING_AGENT, SCHEDULER, PLATFORM_ADMIN | `src/modules/workflow/controllers/workflow-instances.controller.ts:84` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/workflow/controllers/workflow-instances.controller.ts:84` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | WorkflowInstancesController.completeTask → WorkflowInstancesService.completeTask → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | WorkflowInstancesController.completeTask → WorkflowInstancesService.completeTask → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | WorkflowInstancesController.completeTask → WorkflowInstancesService.completeTask → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `workflow.state_machine_definitions` | LEE | LEE | DIRECTA | WorkflowInstancesController.completeTask → WorkflowInstancesService.completeTask → StateMachinesRepository.findActiveMachineByCode | `src/modules/workflow/repositories/state-machines.repository.ts:330` |
| `workflow.state_transition_definitions` | LEE | LEE | DIRECTA | WorkflowInstancesController.completeTask → WorkflowInstancesService.completeTask → StateMachinesRepository.findTransitionByCommand | `src/modules/workflow/repositories/state-machines.repository.ts:525` |
| `workflow.state_transition_events` | ESCRIBE | CREA | DIRECTA | WorkflowInstancesController.completeTask → WorkflowInstancesService.completeTask → WorkflowRuntimeRepository.createTransitionEvent | `src/modules/workflow/repositories/workflow-runtime.repository.ts:182` |
| `workflow.workflow_instances` | ESCRIBE | ACTUALIZA | POR_TIPO | WorkflowInstancesController.completeTask → WorkflowInstancesService.completeTask | `src/modules/workflow/services/workflow-instances.service.ts:250` |
| `workflow.workflow_instances` | LEE | LEE | DIRECTA | WorkflowInstancesController.completeTask → WorkflowInstancesService.completeTask → WorkflowRuntimeRepository.findInstanceForUpdate | `src/modules/workflow/repositories/workflow-runtime.repository.ts:336` |
| `workflow.workflow_tasks` | ESCRIBE | ACTUALIZA | POR_TIPO | WorkflowInstancesController.completeTask → WorkflowInstancesService.completeTask | `src/modules/workflow/services/workflow-instances.service.ts:246` |
| `workflow.workflow_tasks` | LEE | LEE | DIRECTA | WorkflowInstancesController.completeTask → WorkflowInstancesService.completeTask → WorkflowRuntimeRepository.findTaskForUpdate | `src/modules/workflow/repositories/workflow-runtime.repository.ts:449` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `WorkflowTaskCompleted` | `src/modules/workflow/services/workflow-instances.service.ts:313` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CompleteTaskDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `commandCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Comando de la máquina que dispara el completado, si lo hay | `src/modules/workflow/dto/workflow.dto.ts:1177` |
| `nextStepCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Paso al que avanza la instancia | `src/modules/workflow/dto/workflow.dto.ts:1189` |
| `nextDueAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Nuevo plazo de la instancia | `src/modules/workflow/dto/workflow.dto.ts:1200` |
| `resultJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Resultado de la tarea, para el contexto de la instancia | `src/modules/workflow/dto/workflow.dto.ts:1210` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "commandCode": "CODIGO_EJEMPLO",
  "nextStepCode": "CODIGO_EJEMPLO",
  "nextDueAt": "2026-07-31T12:00:00.000Z",
  "resultJson": {}
}
```

</details>

### Respuesta — `Promise<CompleteTaskResponseDto>` · DTO `CompleteTaskResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `taskId` | `string` | Sí | formato uuid | — | Identificador asociado a task. | `src/modules/workflow/dto/workflow.dto.ts:1221` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/workflow/dto/workflow.dto.ts:1227` |
| `workflowInstanceId` | `string` | Sí | formato uuid | — | Identificador asociado a workflow instance. | `src/modules/workflow/dto/workflow.dto.ts:1233` |
| `currentStepCode` | `string` | No | — | — | Paso al que avanzó la instancia | `src/modules/workflow/dto/workflow.dto.ts:1239` |
| `transitionEventId` | `string` | No | formato uuid | — | Transición disparada por el completado, si la tarea la tenía asociada | `src/modules/workflow/dto/workflow.dto.ts:1249` |
| `remainingOpenTasks` | `number` | Sí | — | — | Tareas que quedan abiertas en la instancia | `src/modules/workflow/dto/workflow.dto.ts:1255` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Tarea de workflow no encontrada.; ResourceNotFoundException: Instancia de workflow no encontrada.; ResourceNotFoundException: No hay una versión activa de la máquina de estado para ese workflow. |
| 409 | `CONFLICT` | ConflictException: La tarea está asignada a otro usuario. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La tarea ya no está abierta.; PreconditionFailedException: La instancia ya no está viva; su tarea no puede completarse.; PreconditionFailedException: El comando no es aplicable desde el estado actual de la instancia. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/workflow.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 32 — Máquinas de estado y flujos entre dominios — etapa `UC-32-13`

---

