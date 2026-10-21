<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `automation`

- **Bloque:** Operaciones de Plataforma (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)
- **Operaciones:** 17 (17 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 17 · BAJO 0
- **Tablas distintas que tocan:** 17
- **Respuestas de error y detalle contractual:** `openapi/endpoints/automation.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/automation/agent-runs/{id}/approvals` | Solicitar aprobación y pausar la ejecución | MEDIO | 10 | SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN |
| 2 | POST | `/automation/agent-runs/{id}/record-automations/{recordAutomationId}/execute` | Ejecutar una automatización de registro con deduplicación | MEDIO | 8 | SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN |
| 3 | POST | `/automation/agent-runs/{id}/steps` | Registrar un paso de la traza del agente | MEDIO | 15 | SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN |
| 4 | POST | `/automation/agents` | Registrar un agente con su primera versión | MEDIO | 6 | AUTOMATION_ENGINEER, PLATFORM_ADMIN |
| 5 | POST | `/automation/agents/{id}/guardrails` | Adjuntar una política de guardrail a un agente | MEDIO | 7 | AI_GOVERNANCE_OFFICER, PLATFORM_ADMIN |
| 6 | POST | `/automation/agents/{id}/memory` | Persistir memoria del agente | MEDIO | 7 | SYSTEM, AGENT_RUNTIME, AUTOMATION_ENGINEER, PLATFORM_ADMIN |
| 7 | POST | `/automation/agents/{id}/versions/{versionId}/tool-bindings` | Enlazar herramientas a una versión del agente | MEDIO | 7 | AUTOMATION_ENGINEER, PLATFORM_ADMIN |
| 8 | POST | `/automation/agents/{id}/versions/publish` | Publicar una versión del agente | MEDIO | 7 | AUTOMATION_ENGINEER, PLATFORM_ADMIN |
| 9 | POST | `/automation/approvals/{id}/decide` | Decidir la aprobación y reanudar o abortar el run | MEDIO | 11 | CLINICAL_APPROVER, OPERATIONAL_APPROVER, PLATFORM_ADMIN |
| 10 | POST | `/automation/guardrails` | Definir una política de guardrail | MEDIO | 2 | AI_GOVERNANCE_OFFICER, PLATFORM_ADMIN |
| 11 | POST | `/automation/runs/{workflowRunId}/agent-runs` | Arrancar la ejecución de un agente dentro del run | MEDIO | 4 | SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN |
| 12 | POST | `/automation/runs/{workflowRunId}/finalize` | Cerrar la ejecución con el resumen de coste | MEDIO | 8 | SYSTEM, PLATFORM_ADMIN |
| 13 | POST | `/automation/tools` | Registrar una herramienta de agente | MEDIO | 5 | AUTOMATION_ENGINEER, PLATFORM_ADMIN |
| 14 | POST | `/automation/triggers` | Configurar un disparador de automatización | MEDIO | 6 | AUTOMATION_ENGINEER, PLATFORM_ADMIN |
| 15 | POST | `/automation/triggers/calendar/tick` | Evaluar los disparadores de calendario vencidos | MEDIO | 7 | SYSTEM |
| 16 | POST | `/automation/workflows` | Definir un workflow con sus pasos | MEDIO | 9 | AUTOMATION_ENGINEER, PLATFORM_ADMIN |
| 17 | POST | `/automation/workflows/{id}/runs` | Arrancar la ejecución de un workflow | MEDIO | 7 | SYSTEM, AUTOMATION_ENGINEER, PLATFORM_ADMIN |

---

## 1. POST /automation/agent-runs/{id}/approvals

- **Origen:** CONTRATO
- **Nombre:** Solicitar aprobación y pausar la ejecución
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AutomationOrchestrationController.requestApproval` — `src/modules/automation/controllers/automation-orchestration.controller.ts:158`

### Qué es y para qué sirve (negocio)

Solicitar aprobación y pausar la ejecución. Caso de uso UC-48-10: Pausar por guardrail. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/agent-runs/{id}/approvals` la atiende `AutomationOrchestrationController.requestApproval` (src/modules/automation/controllers/automation-orchestration.controller.ts:158). Exige sesión con alguno de los roles SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN. Valida el cuerpo como `AutomationRequestApprovalDto` (5 campos, 1 obligatorio). Delega en `AutomationExecutionService.requestApproval`. Crea filas en automation.automation_approvals, messaging.domain_events, messaging.outbox_messages. Actualiza automation.agent_runs, automation.workflow_runs. Lee automation.agent_runs, automation.agents, automation.automation_approvals, automation.workflow_runs, messaging.outbox_messages. Publica ApprovalRequested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN | `src/modules/automation/controllers/automation-orchestration.controller.ts:158` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/automation/controllers/automation-orchestration.controller.ts:158` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.agent_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | AutomationOrchestrationController.requestApproval → AutomationExecutionService.requestApproval → AutomationExecutionService.pauseForApproval | `src/modules/automation/services/automation-execution.service.ts:1125` |
| `automation.agent_runs` | LEE | LEE | DIRECTA | AutomationOrchestrationController.requestApproval → AutomationExecutionService.requestApproval → AutomationRunsRepository.findAgentRunForUpdate | `src/modules/automation/repositories/automation-runs.repository.ts:343` |
| `automation.agents` | LEE | LEE | DIRECTA | AutomationOrchestrationController.requestApproval → AutomationExecutionService.requestApproval → AgentsRepository.findAgentById | `src/modules/automation/repositories/agents.repository.ts:287` |
| `automation.automation_approvals` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.requestApproval → AutomationExecutionService.requestApproval → AutomationExecutionService.pauseForApproval → AutomationRunsRepository.createApproval | `src/modules/automation/repositories/automation-runs.repository.ts:444` |
| `automation.automation_approvals` | LEE | LEE | DIRECTA | AutomationOrchestrationController.requestApproval → AutomationExecutionService.requestApproval → AutomationRunsRepository.findPendingApprovalsByAgentRuns | `src/modules/automation/repositories/automation-runs.repository.ts:485` |
| `automation.workflow_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | AutomationOrchestrationController.requestApproval → AutomationExecutionService.requestApproval → AutomationExecutionService.pauseForApproval | `src/modules/automation/services/automation-execution.service.ts:1135` |
| `automation.workflow_runs` | LEE | LEE | DIRECTA | AutomationOrchestrationController.requestApproval → AutomationExecutionService.requestApproval → AutomationExecutionService.pauseForApproval → AutomationRunsRepository.findWorkflowRunForUpdate | `src/modules/automation/repositories/automation-runs.repository.ts:251` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.requestApproval → AutomationExecutionService.requestApproval → AutomationExecutionService.pauseForApproval → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.requestApproval → AutomationExecutionService.requestApproval → AutomationExecutionService.pauseForApproval → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AutomationOrchestrationController.requestApproval → AutomationExecutionService.requestApproval → AutomationExecutionService.pauseForApproval → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `ApprovalRequested` | `src/modules/automation/services/automation-execution.service.ts:1140` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AutomationRequestApprovalDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `approvalTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Qué clase de aprobación se pide | `src/modules/automation/dto/automation.dto.ts:1223` |
| `agentRunStepId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paso que quedó bloqueado | `src/modules/automation/dto/automation.dto.ts:1234` |
| `requestedActionJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Acción que el agente quiere ejecutar y está esperando | `src/modules/automation/dto/automation.dto.ts:1244` |
| `targetResourceType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/automation/dto/automation.dto.ts:1253` |
| `targetRefId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:1261` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "approvalTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "approvalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "agentRunStepId": "00000000-0000-4000-8000-000000000001",
  "requestedActionJson": {},
  "targetResourceType": "valor-ejemplo",
  "targetRefId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ApprovalResponseDto>` · DTO `ApprovalResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/automation/dto/automation.dto.ts:1272` |
| `changeRequestId` | `string` | Sí | formato uuid | — | Identificador asociado a change request. | sin fuente |
| `changeStatusConceptId` | `string` | Sí | formato uuid | — | Estado del cambio tras la decisión | sin fuente |
| `approvedSteps` | `number` | Sí | — | — | Pasos aprobados hasta ahora | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ejecución de agente no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ejecución del agente ya terminó; no admite aprobaciones. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-10`

---

## 2. POST /automation/agent-runs/{id}/record-automations/{recordAutomationId}/execute

- **Origen:** CONTRATO
- **Nombre:** Ejecutar una automatización de registro con deduplicación
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AutomationOrchestrationController.executeRecordAutomation` — `src/modules/automation/controllers/automation-orchestration.controller.ts:191`

### Qué es y para qué sirve (negocio)

Ejecutar una automatización de registro con deduplicación. Caso de uso UC-48-13: Escribir con dedupe. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:23`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/agent-runs/{id}/record-automations/{recordAutomationId}/execute` la atiende `AutomationOrchestrationController.executeRecordAutomation` (src/modules/automation/controllers/automation-orchestration.controller.ts:191). Exige sesión con alguno de los roles SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN. Valida el cuerpo como `ExecuteRecordAutomationDto` (2 campos, 1 obligatorio). Delega en `RecordAutomationService.executeRecordAutomation`. Crea filas en automation.agent_run_steps, messaging.domain_events, messaging.outbox_messages. Lee automation.agent_run_steps, automation.agent_runs, automation.agents, automation.record_automations, messaging.outbox_messages. Publica RecordAutomated.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN | `src/modules/automation/controllers/automation-orchestration.controller.ts:191` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, recordAutomationId | `src/modules/automation/controllers/automation-orchestration.controller.ts:191` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.agent_run_steps` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.executeRecordAutomation → RecordAutomationService.executeRecordAutomation → AutomationRunsRepository.createAgentRunStep | `src/modules/automation/repositories/automation-runs.repository.ts:378` |
| `automation.agent_run_steps` | LEE | LEE | DIRECTA | AutomationOrchestrationController.executeRecordAutomation → RecordAutomationService.executeRecordAutomation → AutomationRunsRepository.findMaxSequenceNo | `src/modules/automation/repositories/automation-runs.repository.ts:414` |
| `automation.agent_runs` | LEE | LEE | DIRECTA | AutomationOrchestrationController.executeRecordAutomation → RecordAutomationService.executeRecordAutomation → AutomationRunsRepository.findAgentRunForUpdate | `src/modules/automation/repositories/automation-runs.repository.ts:343` |
| `automation.agents` | LEE | LEE | DIRECTA | AutomationOrchestrationController.executeRecordAutomation → RecordAutomationService.executeRecordAutomation → AgentsRepository.findAgentById | `src/modules/automation/repositories/agents.repository.ts:287` |
| `automation.record_automations` | LEE | LEE | DIRECTA | AutomationOrchestrationController.executeRecordAutomation → RecordAutomationService.executeRecordAutomation → AutomationGovernanceRepository.findRecordAutomationForUpdate | `src/modules/automation/repositories/automation-governance.repository.ts:560` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.executeRecordAutomation → RecordAutomationService.executeRecordAutomation → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.executeRecordAutomation → RecordAutomationService.executeRecordAutomation → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AutomationOrchestrationController.executeRecordAutomation → RecordAutomationService.executeRecordAutomation → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `RecordAutomated` | `src/modules/automation/services/record-automation.service.ts:207` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `recordAutomationId` | path | Sí | `string` | — |

### Cuerpo — DTO `ExecuteRecordAutomationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `payloadJson` | `object` | Sí | — | `@IsObject()` | Datos de los que sale el registro, según el mapeo de la automatización | `src/modules/automation/dto/automation.dto.ts:1486` |
| `agentRunStepId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paso de la traza que ejecuta la escritura; si no se envía, se crea uno | `src/modules/automation/dto/automation.dto.ts:1498` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "payloadJson": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "payloadJson": {},
  "agentRunStepId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ExecuteRecordAutomationResponseDto>` · DTO `ExecuteRecordAutomationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetRecordId` | `string` | No | formato uuid | — | Registro escrito en el destino | `src/modules/automation/dto/automation.dto.ts:1512` |
| `written` | `boolean` | Sí | — | — | Falso si la clave de deduplicación ya existía | `src/modules/automation/dto/automation.dto.ts:1518` |
| `agentRunStepId` | `string` | Sí | formato uuid | — | Paso de traza que deja constancia de la escritura | `src/modules/automation/dto/automation.dto.ts:1527` |
| `draft` | `boolean` | Sí | — | — | Verdadero si el modo de escritura es borrador y no se tocó el destino | `src/modules/automation/dto/automation.dto.ts:1536` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ejecución de agente no encontrada.; ResourceNotFoundException: Automatización de registro no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ejecución del agente no está en marcha; no puede escribir registros.; PreconditionFailedException: La automatización de registro no está activa.; PreconditionFailedException: La automatización de registro pertenece a otro agente.; PreconditionFailedException: El agente no tiene identidad de servicio; su escritura no sería atribuible.; PreconditionFailedException: La automatización de registro no declara mapeo de campos.; PreconditionFailedException: El mapeo de campos tiene una regla que no se entiende.; PreconditionFailedException: El origen de un campo mapeado tiene que ser una ruta.; PreconditionFailedException: Una regla de mapeo tiene que declarar `from` o `value`.; PreconditionFailedException: Falta un campo obligatorio del mapeo.; PreconditionFailedException: La validación de la automatización exige un campo que no llegó.; PreconditionFailedException: Un modo de escritura `upsert` necesita una clave de deduplicación. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | — | InternalServerErrorException: La automatización de registro no produjo ninguna columna que escribir. |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-13`

---

## 3. POST /automation/agent-runs/{id}/steps

- **Origen:** CONTRATO
- **Nombre:** Registrar un paso de la traza del agente
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AutomationOrchestrationController.recordAgentStep` — `src/modules/automation/controllers/automation-orchestration.controller.ts:141`

### Qué es y para qué sirve (negocio)

Registrar un paso de la traza del agente. Caso de uso UC-48-09: Ejecución con traza. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/agent-runs/{id}/steps` la atiende `AutomationOrchestrationController.recordAgentStep` (src/modules/automation/controllers/automation-orchestration.controller.ts:141). Exige sesión con alguno de los roles SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN. Valida el cuerpo como `RecordAgentStepDto` (8 campos, 1 obligatorio). Delega en `AutomationExecutionService.recordAgentStep`. Crea filas en automation.agent_run_steps, automation.automation_approvals, messaging.domain_events, messaging.outbox_messages. Actualiza automation.agent_runs, automation.workflow_runs. Lee automation.agent_guardrails, automation.agent_run_steps, automation.agent_runs, automation.agent_tool_bindings, automation.agent_tools, automation.agents, automation.guardrail_policies, automation.workflow_runs y 1 más. Publica AgentStepRecorded, ApprovalRequested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN | `src/modules/automation/controllers/automation-orchestration.controller.ts:141` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/automation/controllers/automation-orchestration.controller.ts:141` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.agent_guardrails` | LEE | LEE | DIRECTA | AutomationOrchestrationController.recordAgentStep → AutomationExecutionService.recordAgentStep → AutomationExecutionService.findBlocker → AutomationGovernanceRepository.findEnabledGuardrailsByAgent | `src/modules/automation/repositories/automation-governance.repository.ts:337` |
| `automation.agent_run_steps` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.recordAgentStep → AutomationExecutionService.recordAgentStep → AutomationRunsRepository.createAgentRunStep | `src/modules/automation/repositories/automation-runs.repository.ts:378` |
| `automation.agent_run_steps` | LEE | LEE | DIRECTA | AutomationOrchestrationController.recordAgentStep → AutomationExecutionService.recordAgentStep → AutomationRunsRepository.findMaxSequenceNo | `src/modules/automation/repositories/automation-runs.repository.ts:414` |
| `automation.agent_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | AutomationOrchestrationController.recordAgentStep → AutomationExecutionService.recordAgentStep → AutomationExecutionService.pauseForApproval | `src/modules/automation/services/automation-execution.service.ts:1125` |
| `automation.agent_runs` | LEE | LEE | DIRECTA | AutomationOrchestrationController.recordAgentStep → AutomationExecutionService.recordAgentStep → AutomationRunsRepository.findAgentRunForUpdate | `src/modules/automation/repositories/automation-runs.repository.ts:343` |
| `automation.agent_tool_bindings` | LEE | LEE | DIRECTA | AutomationOrchestrationController.recordAgentStep → AutomationExecutionService.recordAgentStep → AutomationExecutionService.findBlocker → AgentsRepository.findBinding | `src/modules/automation/repositories/agents.repository.ts:466` |
| `automation.agent_tools` | LEE | LEE | DIRECTA | AutomationOrchestrationController.recordAgentStep → AutomationExecutionService.recordAgentStep → AutomationExecutionService.findBlocker → AgentsRepository.findToolById | `src/modules/automation/repositories/agents.repository.ts:415` |
| `automation.agents` | LEE | LEE | DIRECTA | AutomationOrchestrationController.recordAgentStep → AutomationExecutionService.recordAgentStep → AgentsRepository.findAgentById | `src/modules/automation/repositories/agents.repository.ts:287` |
| `automation.automation_approvals` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.recordAgentStep → AutomationExecutionService.recordAgentStep → AutomationExecutionService.pauseForApproval → AutomationRunsRepository.createApproval | `src/modules/automation/repositories/automation-runs.repository.ts:444` |
| `automation.guardrail_policies` | LEE | LEE | DIRECTA | AutomationOrchestrationController.recordAgentStep → AutomationExecutionService.recordAgentStep → AutomationExecutionService.findBlocker → AutomationGovernanceRepository.findGuardrailPolicyById | `src/modules/automation/repositories/automation-governance.repository.ts:259` |
| `automation.workflow_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | AutomationOrchestrationController.recordAgentStep → AutomationExecutionService.recordAgentStep → AutomationExecutionService.pauseForApproval | `src/modules/automation/services/automation-execution.service.ts:1135` |
| `automation.workflow_runs` | LEE | LEE | DIRECTA | AutomationOrchestrationController.recordAgentStep → AutomationExecutionService.recordAgentStep → AutomationExecutionService.pauseForApproval → AutomationRunsRepository.findWorkflowRunForUpdate | `src/modules/automation/repositories/automation-runs.repository.ts:251` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.recordAgentStep → AutomationExecutionService.recordAgentStep → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.recordAgentStep → AutomationExecutionService.recordAgentStep → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AutomationOrchestrationController.recordAgentStep → AutomationExecutionService.recordAgentStep → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `AgentStepRecorded` | `src/modules/automation/services/automation-execution.service.ts:409` |
| Evento de dominio | `ApprovalRequested` | `src/modules/automation/services/automation-execution.service.ts:1140` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordAgentStepDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `stepKindConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:1099` |
| `agentToolId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Herramienta invocada, si el paso la usa | `src/modules/automation/dto/automation.dto.ts:1110` |
| `thoughtText` | `string` | No | — | `@IsOptional()` `@IsString()` | Razonamiento del agente en este paso | `src/modules/automation/dto/automation.dto.ts:1118` |
| `toolInputJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/automation/dto/automation.dto.ts:1126` |
| `toolOutputJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/automation/dto/automation.dto.ts:1134` |
| `errorText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/automation/dto/automation.dto.ts:1142` |
| `occurredAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo ocurrió; por omisión, ahora | `src/modules/automation/dto/automation.dto.ts:1153` |
| `accruedCostAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Coste acumulado del run hasta este paso; cadena por ser numeric | `src/modules/automation/dto/automation.dto.ts:1164` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "stepKindConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "stepKindConceptId": "00000000-0000-4000-8000-000000000001",
  "agentToolId": "00000000-0000-4000-8000-000000000001",
  "thoughtText": "valor-ejemplo",
  "toolInputJson": {},
  "toolOutputJson": {},
  "errorText": "valor-ejemplo",
  "occurredAt": "2026-07-31T12:00:00.000Z",
  "accruedCostAmount": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<AgentStepResponseDto>` · DTO `AgentStepResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/automation/dto/automation.dto.ts:1175` |
| `sequenceNo` | `number` | Sí | — | — | Valor de sequence no mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:1181` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/automation/dto/automation.dto.ts:1187` |
| `approvalId` | `string` | No | formato uuid | — | Aprobación creada si el paso quedó bloqueado esperando decisión humana | `src/modules/automation/dto/automation.dto.ts:1197` |
| `paused` | `boolean` | Sí | — | — | Verdadero si el run quedó en pausa por este paso | `src/modules/automation/dto/automation.dto.ts:1205` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ejecución de agente no encontrada.; ResourceNotFoundException: Herramienta no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ejecución del agente no está en marcha; no admite pasos nuevos.; PreconditionFailedException: La herramienta no está enlazada a la versión que se está ejecutando.; PreconditionFailedException: El enlace deniega el uso de esa herramienta para esta versión.; PreconditionFailedException: La herramienta agotó su tope de llamadas para esta ejecución. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-09`

---

## 4. POST /automation/agents

- **Origen:** CONTRATO
- **Nombre:** Registrar un agente con su primera versión
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AgentCatalogController.registerAgent` — `src/modules/automation/controllers/agent-catalog.controller.ts:43`

### Qué es y para qué sirve (negocio)

Registrar un agente con su primera versión. Caso de uso UC-48-01: Registrar agente con su versión 1. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:11`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/agents` la atiende `AgentCatalogController.registerAgent` (src/modules/automation/controllers/agent-catalog.controller.ts:43). Exige sesión con alguno de los roles AUTOMATION_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `RegisterAgentDto` (14 campos, 5 obligatorios). Delega en `AgentCatalogService.registerAgent`. Crea filas en automation.agent_versions, automation.agents, messaging.domain_events, messaging.outbox_messages. Lee automation.agents, messaging.outbox_messages. Publica AgentRegistered.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AUTOMATION_ENGINEER, PLATFORM_ADMIN | `src/modules/automation/controllers/agent-catalog.controller.ts:43` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.agent_versions` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.registerAgent → AgentCatalogService.registerAgent → AgentsRepository.createAgentVersion | `src/modules/automation/repositories/agents.repository.ts:319` |
| `automation.agents` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.registerAgent → AgentCatalogService.registerAgent → AgentsRepository.createAgent | `src/modules/automation/repositories/agents.repository.ts:259` |
| `automation.agents` | LEE | LEE | DIRECTA | AgentCatalogController.registerAgent → AgentCatalogService.registerAgent → AgentsRepository.findAgentByCode | `src/modules/automation/repositories/agents.repository.ts:303` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.registerAgent → AgentCatalogService.registerAgent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.registerAgent → AgentCatalogService.registerAgent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AgentCatalogController.registerAgent → AgentCatalogService.registerAgent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `AgentRegistered` | `src/modules/automation/services/agent-catalog.service.ts:127` |

### Cuerpo — DTO `RegisterAgentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:33` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/automation/dto/automation.dto.ts:41` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/automation/dto/automation.dto.ts:49` |
| `agentTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:56` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/automation/dto/automation.dto.ts:64` |
| `defaultModelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:72` |
| `systemServiceComponentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:80` |
| `autonomyLevelConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Nivel de autonomía del agente | `src/modules/automation/dto/automation.dto.ts:87` |
| `actsAsUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Identidad de servicio con la que el agente actúa; obligatoria si no sólo sugiere | `src/modules/automation/dto/automation.dto.ts:99` |
| `promptTemplate` | `string` | Sí | — | `@IsString()` | Plantilla de prompt de la versión 1 | `src/modules/automation/dto/automation.dto.ts:106` |
| `modelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:114` |
| `modelParamsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/automation/dto/automation.dto.ts:122` |
| `inputSchemaJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/automation/dto/automation.dto.ts:130` |
| `outputSchemaJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/automation/dto/automation.dto.ts:138` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "agentTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "autonomyLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "promptTemplate": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "agentTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "description": "Texto descriptivo de ejemplo",
  "defaultModelConceptId": "00000000-0000-4000-8000-000000000001",
  "systemServiceComponentId": "00000000-0000-4000-8000-000000000001",
  "autonomyLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "actsAsUserId": "00000000-0000-4000-8000-000000000001",
  "promptTemplate": "valor-ejemplo",
  "modelConceptId": "00000000-0000-4000-8000-000000000001",
  "modelParamsJson": {},
  "inputSchemaJson": {},
  "outputSchemaJson": {}
}
```

</details>

### Respuesta — `Promise<AgentResponseDto>` · DTO `AgentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/automation/dto/automation.dto.ts:149` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:155` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un agente con ese código. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un agente que actúa necesita una identidad de servicio (`actsAsUserId`). |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-01`

---

## 5. POST /automation/agents/{id}/guardrails

- **Origen:** CONTRATO
- **Nombre:** Adjuntar una política de guardrail a un agente
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AgentCatalogController.attachGuardrail` — `src/modules/automation/controllers/agent-catalog.controller.ts:126`

### Qué es y para qué sirve (negocio)

Adjuntar una política de guardrail a un agente. Caso de uso UC-48-05: Guardrail y adjunción. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/agents/{id}/guardrails` la atiende `AgentCatalogController.attachGuardrail` (src/modules/automation/controllers/agent-catalog.controller.ts:126). Exige sesión con alguno de los roles AI_GOVERNANCE_OFFICER, PLATFORM_ADMIN. Valida el cuerpo como `AttachGuardrailDto` (2 campos, 1 obligatorio). Delega en `AgentCatalogService.attachGuardrail`. Crea filas en automation.agent_guardrails, messaging.domain_events, messaging.outbox_messages. Lee automation.agent_guardrails, automation.agents, automation.guardrail_policies, messaging.outbox_messages. Publica GuardrailAttached.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AI_GOVERNANCE_OFFICER, PLATFORM_ADMIN | `src/modules/automation/controllers/agent-catalog.controller.ts:126` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/automation/controllers/agent-catalog.controller.ts:126` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.agent_guardrails` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.attachGuardrail → AgentCatalogService.attachGuardrail → AutomationGovernanceRepository.createAgentGuardrail | `src/modules/automation/repositories/automation-governance.repository.ts:304` |
| `automation.agent_guardrails` | LEE | LEE | DIRECTA | AgentCatalogController.attachGuardrail → AgentCatalogService.attachGuardrail → AutomationGovernanceRepository.findAgentGuardrail | `src/modules/automation/repositories/automation-governance.repository.ts:329` |
| `automation.agents` | LEE | LEE | DIRECTA | AgentCatalogController.attachGuardrail → AgentCatalogService.attachGuardrail → AgentsRepository.findAgentForUpdate | `src/modules/automation/repositories/agents.repository.ts:292` |
| `automation.guardrail_policies` | LEE | LEE | DIRECTA | AgentCatalogController.attachGuardrail → AgentCatalogService.attachGuardrail → AutomationGovernanceRepository.findGuardrailPolicyById | `src/modules/automation/repositories/automation-governance.repository.ts:259` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.attachGuardrail → AgentCatalogService.attachGuardrail → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.attachGuardrail → AgentCatalogService.attachGuardrail → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AgentCatalogController.attachGuardrail → AgentCatalogService.attachGuardrail → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `GuardrailAttached` | `src/modules/automation/services/agent-catalog.service.ts:564` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AttachGuardrailDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `guardrailPolicyId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:593` |
| `isEnabled` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/automation/dto/automation.dto.ts:601` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "guardrailPolicyId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "guardrailPolicyId": "00000000-0000-4000-8000-000000000001",
  "isEnabled": true
}
```

</details>

### Respuesta — `Promise<AttachGuardrailResponseDto>` · DTO `AttachGuardrailResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/automation/dto/automation.dto.ts:612` |
| `agentId` | `string` | Sí | formato uuid | — | Identificador asociado a agent. | `src/modules/automation/dto/automation.dto.ts:618` |
| `guardrailPolicyId` | `string` | Sí | formato uuid | — | Identificador asociado a guardrail policy. | `src/modules/automation/dto/automation.dto.ts:624` |
| `isEnabled` | `boolean` | Sí | — | — | Valor de is enabled mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:630` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Agente no encontrado.; ResourceNotFoundException: Política de guardrail no encontrada. |
| 409 | `CONFLICT` | ConflictException: La política ya está adjunta a este agente. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La política de guardrail no está activa. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-05`

---

## 6. POST /automation/agents/{id}/memory

- **Origen:** CONTRATO
- **Nombre:** Persistir memoria del agente
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AgentCatalogController.upsertMemory` — `src/modules/automation/controllers/agent-catalog.controller.ts:139`

### Qué es y para qué sirve (negocio)

Persistir memoria del agente. Caso de uso UC-48-12: Persistir memoria. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/agents/{id}/memory` la atiende `AgentCatalogController.upsertMemory` (src/modules/automation/controllers/agent-catalog.controller.ts:139). Exige sesión con alguno de los roles SYSTEM, AGENT_RUNTIME, AUTOMATION_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `UpsertAgentMemoryDto` (7 campos, 3 obligatorios). Delega en `AgentCatalogService.upsertMemory`. Crea filas en automation.agent_memory, messaging.domain_events, messaging.outbox_messages. Actualiza automation.agent_memory. Lee automation.agent_memory, automation.agents, messaging.outbox_messages. Publica AgentMemoryUpserted.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, AGENT_RUNTIME, AUTOMATION_ENGINEER, PLATFORM_ADMIN | `src/modules/automation/controllers/agent-catalog.controller.ts:139` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/automation/controllers/agent-catalog.controller.ts:139` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.agent_memory` | ESCRIBE | ACTUALIZA | POR_TIPO | AgentCatalogController.upsertMemory → AgentCatalogService.upsertMemory | `src/modules/automation/services/agent-catalog.service.ts:638` |
| `automation.agent_memory` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.upsertMemory → AgentCatalogService.upsertMemory → AgentsRepository.createMemory | `src/modules/automation/repositories/agents.repository.ts:532` |
| `automation.agent_memory` | LEE | LEE | DIRECTA | AgentCatalogController.upsertMemory → AgentCatalogService.upsertMemory → AgentsRepository.findMemoryForUpdate | `src/modules/automation/repositories/agents.repository.ts:512` |
| `automation.agents` | LEE | LEE | DIRECTA | AgentCatalogController.upsertMemory → AgentCatalogService.upsertMemory → AgentsRepository.findAgentById | `src/modules/automation/repositories/agents.repository.ts:287` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.upsertMemory → AgentCatalogService.upsertMemory → AgentCatalogService.publishMemoryEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.upsertMemory → AgentCatalogService.upsertMemory → AgentCatalogService.publishMemoryEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AgentCatalogController.upsertMemory → AgentCatalogService.upsertMemory → AgentCatalogService.publishMemoryEvent → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `AgentMemoryUpserted` | `src/modules/automation/services/agent-catalog.service.ts:708` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpsertAgentMemoryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `scopeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:1378` |
| `scopeRefId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | A qué se refiere la memoria; obligatorio salvo en el ámbito global | `src/modules/automation/dto/automation.dto.ts:1390` |
| `memoryTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:1397` |
| `contentText` | `string` | Sí | — | `@IsString()` | — | `src/modules/automation/dto/automation.dto.ts:1404` |
| `embeddingRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia del embedding en el índice | `src/modules/automation/dto/automation.dto.ts:1416` |
| `importance` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Importancia relativa; cadena por ser numeric | `src/modules/automation/dto/automation.dto.ts:1426` |
| `expiresAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo caduca la memoria | `src/modules/automation/dto/automation.dto.ts:1437` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "scopeConceptId": "00000000-0000-4000-8000-000000000001",
  "memoryTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "contentText": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "scopeConceptId": "00000000-0000-4000-8000-000000000001",
  "scopeRefId": "00000000-0000-4000-8000-000000000001",
  "memoryTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "contentText": "valor-ejemplo",
  "embeddingRef": "valor-ejemplo",
  "importance": "valor-ejemplo",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<AgentMemoryResponseDto>` · DTO `AgentMemoryResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/automation/dto/automation.dto.ts:1448` |
| `agentId` | `string` | Sí | formato uuid | — | Identificador asociado a agent. | `src/modules/automation/dto/automation.dto.ts:1454` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/automation/dto/automation.dto.ts:1460` |
| `updated` | `boolean` | Sí | — | — | Verdadero si actualizó una memoria existente en vez de crearla | `src/modules/automation/dto/automation.dto.ts:1469` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Agente no encontrado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Fuera del ámbito global la memoria tiene que declarar a qué se refiere. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-12`

---

## 7. POST /automation/agents/{id}/versions/{versionId}/tool-bindings

- **Origen:** CONTRATO
- **Nombre:** Enlazar herramientas a una versión del agente
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AgentCatalogController.bindTools` — `src/modules/automation/controllers/agent-catalog.controller.ts:92`

### Qué es y para qué sirve (negocio)

Enlazar herramientas a una versión del agente. Caso de uso UC-48-04: Enlazar herramientas. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/agents/{id}/versions/{versionId}/tool-bindings` la atiende `AgentCatalogController.bindTools` (src/modules/automation/controllers/agent-catalog.controller.ts:92). Exige sesión con alguno de los roles AUTOMATION_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `BindToolsDto` (5 campos, 3 obligatorios). Delega en `AgentCatalogService.bindTools`. Crea filas en automation.agent_tool_bindings, messaging.domain_events, messaging.outbox_messages. Lee automation.agent_tool_bindings, automation.agent_tools, automation.agent_versions, messaging.outbox_messages. Publica AgentToolBound.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AUTOMATION_ENGINEER, PLATFORM_ADMIN | `src/modules/automation/controllers/agent-catalog.controller.ts:92` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, versionId | `src/modules/automation/controllers/agent-catalog.controller.ts:92` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.agent_tool_bindings` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.bindTools → AgentCatalogService.bindTools → AgentsRepository.createBinding | `src/modules/automation/repositories/agents.repository.ts:439` |
| `automation.agent_tool_bindings` | LEE | LEE | DIRECTA | AgentCatalogController.bindTools → AgentCatalogService.bindTools → AgentsRepository.findBinding | `src/modules/automation/repositories/agents.repository.ts:466` |
| `automation.agent_tools` | LEE | LEE | DIRECTA | AgentCatalogController.bindTools → AgentCatalogService.bindTools → AgentsRepository.findToolById | `src/modules/automation/repositories/agents.repository.ts:415` |
| `automation.agent_versions` | LEE | LEE | DIRECTA | AgentCatalogController.bindTools → AgentCatalogService.bindTools → AgentsRepository.findVersionById | `src/modules/automation/repositories/agents.repository.ts:349` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.bindTools → AgentCatalogService.bindTools → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.bindTools → AgentCatalogService.bindTools → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AgentCatalogController.bindTools → AgentCatalogService.bindTools → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `AgentToolBound` | `src/modules/automation/services/agent-catalog.service.ts:417` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `versionId` | path | Sí | `string` | — |

### Cuerpo — DTO `BindToolsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bindings` | `array<ToolBindingDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ToolBindingDto)` | — | `src/modules/automation/dto/automation.dto.ts:468` |
| `bindings[].agentToolId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:423` |
| `bindings[].scopeJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Recorte del alcance de la herramienta para esta versión | `src/modules/automation/dto/automation.dto.ts:433` |
| `bindings[].maxCallsPerRun` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Tope de llamadas por ejecución | `src/modules/automation/dto/automation.dto.ts:445` |
| `bindings[].permissionEffectConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Si el enlace permite o deniega la herramienta | `src/modules/automation/dto/automation.dto.ts:455` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "bindings": [
    {
      "agentToolId": "00000000-0000-4000-8000-000000000001",
      "permissionEffectConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "bindings": [
    {
      "agentToolId": "00000000-0000-4000-8000-000000000001",
      "scopeJson": {},
      "maxCallsPerRun": 1,
      "permissionEffectConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — `Promise<BindToolsResponseDto>` · DTO `BindToolsResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `agentVersionId` | `string` | Sí | formato uuid | — | Identificador asociado a agent version. | `src/modules/automation/dto/automation.dto.ts:479` |
| `bindingIds` | `array<string>` | Sí | formato uuid | — | Valor de binding ids mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:485` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: La versión no existe para ese agente.; ResourceNotFoundException: Herramienta no encontrada. |
| 409 | `CONFLICT` | ConflictException: La misma herramienta viene dos veces en el lote.; ConflictException: La herramienta ya está enlazada a esta versión. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La herramienta no está activa. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-04`

---

## 8. POST /automation/agents/{id}/versions/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar una versión del agente
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AgentCatalogController.publishAgentVersion` — `src/modules/automation/controllers/agent-catalog.controller.ts:59`

### Qué es y para qué sirve (negocio)

Publicar una versión del agente. Caso de uso UC-48-02: Publicar versión. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:12`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/agents/{id}/versions/publish` la atiende `AgentCatalogController.publishAgentVersion` (src/modules/automation/controllers/agent-catalog.controller.ts:59). Exige sesión con alguno de los roles AUTOMATION_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `PublishAgentVersionDto` (7 campos, 0 obligatorios). Delega en `AgentCatalogService.publishAgentVersion`. Crea filas en automation.agent_versions, messaging.domain_events, messaging.outbox_messages. Actualiza automation.agents. Lee automation.agent_versions, automation.agents, messaging.outbox_messages. Publica AgentVersionPublished.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AUTOMATION_ENGINEER, PLATFORM_ADMIN | `src/modules/automation/controllers/agent-catalog.controller.ts:59` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/automation/controllers/agent-catalog.controller.ts:59` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.agent_versions` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.publishAgentVersion → AgentCatalogService.publishAgentVersion → AgentsRepository.createAgentVersion | `src/modules/automation/repositories/agents.repository.ts:319` |
| `automation.agent_versions` | LEE | LEE | DIRECTA | AgentCatalogController.publishAgentVersion → AgentCatalogService.publishAgentVersion → AgentsRepository.findVersionById | `src/modules/automation/repositories/agents.repository.ts:349` |
| `automation.agents` | ESCRIBE | ACTUALIZA | POR_TIPO | AgentCatalogController.publishAgentVersion → AgentCatalogService.publishAgentVersion | `src/modules/automation/services/agent-catalog.service.ts:223` |
| `automation.agents` | LEE | LEE | DIRECTA | AgentCatalogController.publishAgentVersion → AgentCatalogService.publishAgentVersion → AgentsRepository.findAgentForUpdate | `src/modules/automation/repositories/agents.repository.ts:292` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.publishAgentVersion → AgentCatalogService.publishAgentVersion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.publishAgentVersion → AgentCatalogService.publishAgentVersion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AgentCatalogController.publishAgentVersion → AgentCatalogService.publishAgentVersion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `AgentVersionPublished` | `src/modules/automation/services/agent-catalog.service.ts:229` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishAgentVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `agentVersionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Versión en borrador que se publica; si no se envía, se crea una nueva | `src/modules/automation/dto/automation.dto.ts:195` |
| `promptTemplate` | `string` | No | — | `@IsOptional()` `@IsString()` | Plantilla de la versión nueva | `src/modules/automation/dto/automation.dto.ts:203` |
| `modelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:211` |
| `modelParamsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/automation/dto/automation.dto.ts:219` |
| `inputSchemaJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/automation/dto/automation.dto.ts:227` |
| `outputSchemaJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/automation/dto/automation.dto.ts:235` |
| `changelog` | `string` | No | — | `@IsOptional()` `@IsString()` | Qué cambia respecto a la versión anterior | `src/modules/automation/dto/automation.dto.ts:245` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "agentVersionId": "00000000-0000-4000-8000-000000000001",
  "promptTemplate": "valor-ejemplo",
  "modelConceptId": "00000000-0000-4000-8000-000000000001",
  "modelParamsJson": {},
  "inputSchemaJson": {},
  "outputSchemaJson": {},
  "changelog": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<AgentVersionResponseDto>` · DTO `AgentVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/automation/dto/automation.dto.ts:256` |
| `agentId` | `string` | Sí | formato uuid | — | Identificador asociado a agent. | `src/modules/automation/dto/automation.dto.ts:262` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:268` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/automation/dto/automation.dto.ts:274` |
| `currentVersion` | `number` | Sí | — | — | Versión vigente del agente tras publicar | `src/modules/automation/dto/automation.dto.ts:280` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Agente no encontrado.; ResourceNotFoundException: La versión no existe para ese agente. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión ya no está en borrador.; PreconditionFailedException: Para crear una versión nueva hace falta su plantilla de prompt. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-02`

---

## 9. POST /automation/approvals/{id}/decide

- **Origen:** CONTRATO
- **Nombre:** Decidir la aprobación y reanudar o abortar el run
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AutomationOrchestrationController.decideApproval` — `src/modules/automation/controllers/automation-orchestration.controller.ts:175`

### Qué es y para qué sirve (negocio)

Decidir la aprobación y reanudar o abortar el run. Caso de uso UC-48-11: Decidir y reanudar. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/approvals/{id}/decide` la atiende `AutomationOrchestrationController.decideApproval` (src/modules/automation/controllers/automation-orchestration.controller.ts:175). Exige sesión con alguno de los roles CLINICAL_APPROVER, OPERATIONAL_APPROVER, PLATFORM_ADMIN. Valida el cuerpo como `DecideApprovalDto` (2 campos, 1 obligatorio). Delega en `AutomationExecutionService.decideApproval`. Crea filas en automation.agent_run_steps, messaging.domain_events, messaging.outbox_messages. Actualiza automation.agent_runs, automation.automation_approvals, automation.workflow_runs. Lee automation.agent_run_steps, automation.agent_runs, automation.automation_approvals, automation.workflow_runs, messaging.outbox_messages. Publica ApprovalDecided.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICAL_APPROVER, OPERATIONAL_APPROVER, PLATFORM_ADMIN | `src/modules/automation/controllers/automation-orchestration.controller.ts:175` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/automation/controllers/automation-orchestration.controller.ts:175` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.agent_run_steps` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.decideApproval → AutomationExecutionService.decideApproval → AutomationRunsRepository.createAgentRunStep | `src/modules/automation/repositories/automation-runs.repository.ts:378` |
| `automation.agent_run_steps` | LEE | LEE | DIRECTA | AutomationOrchestrationController.decideApproval → AutomationExecutionService.decideApproval → AutomationRunsRepository.findMaxSequenceNo | `src/modules/automation/repositories/automation-runs.repository.ts:414` |
| `automation.agent_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | AutomationOrchestrationController.decideApproval → AutomationExecutionService.decideApproval | `src/modules/automation/services/automation-execution.service.ts:599` |
| `automation.agent_runs` | LEE | LEE | DIRECTA | AutomationOrchestrationController.decideApproval → AutomationExecutionService.decideApproval → AutomationRunsRepository.findAgentRunForUpdate | `src/modules/automation/repositories/automation-runs.repository.ts:343` |
| `automation.automation_approvals` | ESCRIBE | ACTUALIZA | POR_TIPO | AutomationOrchestrationController.decideApproval → AutomationExecutionService.decideApproval | `src/modules/automation/services/automation-execution.service.ts:591` |
| `automation.automation_approvals` | LEE | LEE | DIRECTA | AutomationOrchestrationController.decideApproval → AutomationExecutionService.decideApproval → AutomationRunsRepository.findApprovalForUpdate | `src/modules/automation/repositories/automation-runs.repository.ts:471` |
| `automation.workflow_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | AutomationOrchestrationController.decideApproval → AutomationExecutionService.decideApproval | `src/modules/automation/services/automation-execution.service.ts:627` |
| `automation.workflow_runs` | LEE | LEE | DIRECTA | AutomationOrchestrationController.decideApproval → AutomationExecutionService.decideApproval → AutomationRunsRepository.findWorkflowRunForUpdate | `src/modules/automation/repositories/automation-runs.repository.ts:251` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.decideApproval → AutomationExecutionService.decideApproval → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.decideApproval → AutomationExecutionService.decideApproval → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AutomationOrchestrationController.decideApproval → AutomationExecutionService.decideApproval → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `ApprovalDecided` | `src/modules/automation/services/automation-execution.service.ts:638` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DecideApprovalDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: approved, rejected | `@IsIn(['approved', 'rejected'])` | — | `src/modules/automation/dto/automation.dto.ts:1315` |
| `decisionNote` | `string` | No | — | `@IsOptional()` `@IsString()` | Por qué se aprueba o se rechaza | `src/modules/automation/dto/automation.dto.ts:1323` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "approved"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "approved",
  "decisionNote": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<DecideApprovalResponseDto>` · DTO `DecideApprovalResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/automation/dto/automation.dto.ts:1334` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/automation/dto/automation.dto.ts:1340` |
| `agentRunId` | `string` | Sí | formato uuid | — | Identificador asociado a agent run. | `src/modules/automation/dto/automation.dto.ts:1346` |
| `agentRunStatusConceptId` | `string` | Sí | formato uuid | — | Estado en el que queda el agent_run | `src/modules/automation/dto/automation.dto.ts:1355` |
| `resolutionStepId` | `string` | Sí | formato uuid | — | Paso de resolución añadido a la traza | `src/modules/automation/dto/automation.dto.ts:1364` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Aprobación no encontrada.; ResourceNotFoundException: Ejecución de agente no encontrada. |
| 409 | `CONFLICT` | ConflictException: La aprobación ya está decidida. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ejecución del agente no está en pausa. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-11`

---

## 10. POST /automation/guardrails

- **Origen:** CONTRATO
- **Nombre:** Definir una política de guardrail
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AgentCatalogController.defineGuardrail` — `src/modules/automation/controllers/agent-catalog.controller.ts:110`

### Qué es y para qué sirve (negocio)

Definir una política de guardrail. Caso de uso UC-48-05: Guardrail y adjunción. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/guardrails` la atiende `AgentCatalogController.defineGuardrail` (src/modules/automation/controllers/agent-catalog.controller.ts:110). Exige sesión con alguno de los roles AI_GOVERNANCE_OFFICER, PLATFORM_ADMIN. Valida el cuerpo como `DefineGuardrailDto` (8 campos, 4 obligatorios). Delega en `AgentCatalogService.defineGuardrail`. Crea filas en automation.guardrail_policies. Lee automation.guardrail_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AI_GOVERNANCE_OFFICER, PLATFORM_ADMIN | `src/modules/automation/controllers/agent-catalog.controller.ts:110` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.guardrail_policies` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.defineGuardrail → AgentCatalogService.defineGuardrail → AutomationGovernanceRepository.createGuardrailPolicy | `src/modules/automation/repositories/automation-governance.repository.ts:230` |
| `automation.guardrail_policies` | LEE | LEE | DIRECTA | AgentCatalogController.defineGuardrail → AgentCatalogService.defineGuardrail → AutomationGovernanceRepository.findGuardrailPolicyByCode | `src/modules/automation/repositories/automation-governance.repository.ts:273` |

### Cuerpo — DTO `DefineGuardrailDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:500` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/automation/dto/automation.dto.ts:508` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/automation/dto/automation.dto.ts:516` |
| `policyTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:523` |
| `ruleJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Regla declarativa de la política | `src/modules/automation/dto/automation.dto.ts:531` |
| `piiPhiHandlingConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cómo se trata el dato de paciente | `src/modules/automation/dto/automation.dto.ts:542` |
| `maxCostAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Tope de coste; cadena por ser numeric | `src/modules/automation/dto/automation.dto.ts:550` |
| `enforcementConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Bloquea, avisa o sólo registra | `src/modules/automation/dto/automation.dto.ts:560` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "policyTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "enforcementConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "policyTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "ruleJson": {},
  "piiPhiHandlingConceptId": "00000000-0000-4000-8000-000000000001",
  "maxCostAmount": "valor-ejemplo",
  "enforcementConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<GuardrailResponseDto>` · DTO `GuardrailResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/automation/dto/automation.dto.ts:571` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:577` |
| `isActive` | `boolean` | Sí | — | — | Valor de is active mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:583` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una política de guardrail con ese código. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una política de coste tiene que declarar su tope.; PreconditionFailedException: Una política de datos de paciente tiene que declarar cómo se tratan. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-05`

---

## 11. POST /automation/runs/{workflowRunId}/agent-runs

- **Origen:** CONTRATO
- **Nombre:** Arrancar la ejecución de un agente dentro del run
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AutomationOrchestrationController.startAgentRun` — `src/modules/automation/controllers/automation-orchestration.controller.ts:124`

### Qué es y para qué sirve (negocio)

Arrancar la ejecución de un agente dentro del run. Caso de uso UC-48-09: Ejecución con traza. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/runs/{workflowRunId}/agent-runs` la atiende `AutomationOrchestrationController.startAgentRun` (src/modules/automation/controllers/automation-orchestration.controller.ts:124). Exige sesión con alguno de los roles SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN. Valida el cuerpo como `StartAgentRunDto` (4 campos, 2 obligatorios). Delega en `AutomationExecutionService.startAgentRun`. Crea filas en automation.agent_runs. Lee automation.agent_versions, automation.agents, automation.workflow_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN | `src/modules/automation/controllers/automation-orchestration.controller.ts:124` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: workflowRunId | `src/modules/automation/controllers/automation-orchestration.controller.ts:124` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.agent_runs` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.startAgentRun → AutomationExecutionService.startAgentRun → AutomationRunsRepository.createAgentRun | `src/modules/automation/repositories/automation-runs.repository.ts:305` |
| `automation.agent_versions` | LEE | LEE | DIRECTA | AutomationOrchestrationController.startAgentRun → AutomationExecutionService.startAgentRun → AgentsRepository.findVersionById | `src/modules/automation/repositories/agents.repository.ts:349` |
| `automation.agents` | LEE | LEE | DIRECTA | AutomationOrchestrationController.startAgentRun → AutomationExecutionService.startAgentRun → AgentsRepository.findAgentById | `src/modules/automation/repositories/agents.repository.ts:287` |
| `automation.workflow_runs` | LEE | LEE | DIRECTA | AutomationOrchestrationController.startAgentRun → AutomationExecutionService.startAgentRun → AutomationRunsRepository.findWorkflowRunById | `src/modules/automation/repositories/automation-runs.repository.ts:237` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `workflowRunId` | path | Sí | `string` | — |

### Cuerpo — DTO `StartAgentRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `agentId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:1039` |
| `agentVersionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Versión concreta; por omisión, la publicada vigente del agente | `src/modules/automation/dto/automation.dto.ts:1051` |
| `taskTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:1058` |
| `inputJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/automation/dto/automation.dto.ts:1066` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "agentId": "00000000-0000-4000-8000-000000000001",
  "taskTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "agentId": "00000000-0000-4000-8000-000000000001",
  "agentVersionId": "00000000-0000-4000-8000-000000000001",
  "taskTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "inputJson": {}
}
```

</details>

### Respuesta — `Promise<AgentRunResponseDto>` · DTO `AgentRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/automation/dto/automation.dto.ts:1077` |
| `agentVersionId` | `string` | Sí | formato uuid | — | Identificador asociado a agent version. | `src/modules/automation/dto/automation.dto.ts:1083` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/automation/dto/automation.dto.ts:1089` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ejecución de workflow no encontrada.; ResourceNotFoundException: Agente no encontrado.; ResourceNotFoundException: La versión no existe para ese agente. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ejecución del workflow no está en marcha.; PreconditionFailedException: El agente no está activo.; PreconditionFailedException: Sólo se puede ejecutar una versión publicada del agente. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-09`

---

## 12. POST /automation/runs/{workflowRunId}/finalize

- **Origen:** CONTRATO
- **Nombre:** Cerrar la ejecución con el resumen de coste
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AutomationOrchestrationController.finalizeWorkflowRun` — `src/modules/automation/controllers/automation-orchestration.controller.ts:214`

### Qué es y para qué sirve (negocio)

Cerrar la ejecución con el resumen de coste. Caso de uso UC-48-14: Cerrar con resumen de coste. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:24`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/runs/{workflowRunId}/finalize` la atiende `AutomationOrchestrationController.finalizeWorkflowRun` (src/modules/automation/controllers/automation-orchestration.controller.ts:214). Exige sesión con alguno de los roles SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `FinalizeWorkflowRunDto` (2 campos, 0 obligatorios). Delega en `AutomationExecutionService.finalizeWorkflowRun`. Crea filas en messaging.domain_events, messaging.outbox_messages. Actualiza automation.agent_runs, automation.workflow_runs. Lee automation.agent_runs, automation.automation_approvals, automation.workflow_runs, messaging.outbox_messages. Publica WorkflowRunCompleted.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PLATFORM_ADMIN | `src/modules/automation/controllers/automation-orchestration.controller.ts:214` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: workflowRunId | `src/modules/automation/controllers/automation-orchestration.controller.ts:214` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.agent_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | AutomationOrchestrationController.finalizeWorkflowRun → AutomationExecutionService.finalizeWorkflowRun | `src/modules/automation/services/automation-execution.service.ts:732` |
| `automation.agent_runs` | LEE | LEE | DIRECTA | AutomationOrchestrationController.finalizeWorkflowRun → AutomationExecutionService.finalizeWorkflowRun → AutomationRunsRepository.findAgentRunsByWorkflowRunForUpdate | `src/modules/automation/repositories/automation-runs.repository.ts:361` |
| `automation.automation_approvals` | LEE | LEE | DIRECTA | AutomationOrchestrationController.finalizeWorkflowRun → AutomationExecutionService.finalizeWorkflowRun → AutomationRunsRepository.findPendingApprovalsByAgentRuns | `src/modules/automation/repositories/automation-runs.repository.ts:485` |
| `automation.workflow_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | AutomationOrchestrationController.finalizeWorkflowRun → AutomationExecutionService.finalizeWorkflowRun | `src/modules/automation/services/automation-execution.service.ts:748` |
| `automation.workflow_runs` | LEE | LEE | DIRECTA | AutomationOrchestrationController.finalizeWorkflowRun → AutomationExecutionService.finalizeWorkflowRun → AutomationRunsRepository.findWorkflowRunForUpdate | `src/modules/automation/repositories/automation-runs.repository.ts:251` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.finalizeWorkflowRun → AutomationExecutionService.finalizeWorkflowRun → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.finalizeWorkflowRun → AutomationExecutionService.finalizeWorkflowRun → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AutomationOrchestrationController.finalizeWorkflowRun → AutomationExecutionService.finalizeWorkflowRun → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `WorkflowRunCompleted` | `src/modules/automation/services/automation-execution.service.ts:756` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `workflowRunId` | path | Sí | `string` | — |

### Cuerpo — DTO `FinalizeWorkflowRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `failed` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Cierra el run como fallido aunque los agent_runs hayan terminado bien | `src/modules/automation/dto/automation.dto.ts:1555` |
| `errorText` | `string` | No | — | `@IsOptional()` `@IsString()` | Motivo del fallo | `src/modules/automation/dto/automation.dto.ts:1563` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "failed": false,
  "errorText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<FinalizeWorkflowRunResponseDto>` · DTO `FinalizeWorkflowRunResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/automation/dto/automation.dto.ts:1574` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/automation/dto/automation.dto.ts:1580` |
| `totalCostAmount` | `string` | Sí | — | — | Suma del coste de los agent_runs; cadena por ser numeric | `src/modules/automation/dto/automation.dto.ts:1588` |
| `closedAgentRuns` | `number` | Sí | — | — | Agent runs cerrados por esta llamada | `src/modules/automation/dto/automation.dto.ts:1594` |
| `alreadyFinalized` | `boolean` | Sí | — | — | Verdadero si el run ya estaba cerrado y no se tocó nada | `src/modules/automation/dto/automation.dto.ts:1602` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ejecución de workflow no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ejecución tiene aprobaciones pendientes y no puede cerrarse. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-14`

---

## 13. POST /automation/tools

- **Origen:** CONTRATO
- **Nombre:** Registrar una herramienta de agente
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AgentCatalogController.registerTool` — `src/modules/automation/controllers/agent-catalog.controller.ts:76`

### Qué es y para qué sirve (negocio)

Registrar una herramienta de agente. Caso de uso UC-48-03: Registrar herramienta. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/tools` la atiende `AgentCatalogController.registerTool` (src/modules/automation/controllers/agent-catalog.controller.ts:76). Exige sesión con alguno de los roles AUTOMATION_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `RegisterToolDto` (9 campos, 3 obligatorios). Delega en `AgentCatalogService.registerTool`. Crea filas en automation.agent_tools, messaging.domain_events, messaging.outbox_messages. Lee automation.agent_tools, messaging.outbox_messages. Publica AgentToolRegistered.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AUTOMATION_ENGINEER, PLATFORM_ADMIN | `src/modules/automation/controllers/agent-catalog.controller.ts:76` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.agent_tools` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.registerTool → AgentCatalogService.registerTool → AgentsRepository.createTool | `src/modules/automation/repositories/agents.repository.ts:388` |
| `automation.agent_tools` | LEE | LEE | DIRECTA | AgentCatalogController.registerTool → AgentCatalogService.registerTool → AgentsRepository.findToolByCode | `src/modules/automation/repositories/agents.repository.ts:426` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.registerTool → AgentCatalogService.registerTool → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AgentCatalogController.registerTool → AgentCatalogService.registerTool → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AgentCatalogController.registerTool → AgentCatalogService.registerTool → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `AgentToolRegistered` | `src/modules/automation/services/agent-catalog.service.ts:305` |

### Cuerpo — DTO `RegisterToolDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/automation/dto/automation.dto.ts:295` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/automation/dto/automation.dto.ts:303` |
| `toolTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:310` |
| `targetResource` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Recurso sobre el que opera la herramienta | `src/modules/automation/dto/automation.dto.ts:322` |
| `inputSchemaJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/automation/dto/automation.dto.ts:330` |
| `outputSchemaJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/automation/dto/automation.dto.ts:338` |
| `integrationEndpointId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Endpoint de integración; obligatorio si la herramienta es una llamada HTTP | `src/modules/automation/dto/automation.dto.ts:350` |
| `isWrite` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si la herramienta escribe | `src/modules/automation/dto/automation.dto.ts:361` |
| `requiresApproval` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si su uso exige aprobación humana | `src/modules/automation/dto/automation.dto.ts:372` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "toolTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "toolTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "targetResource": "valor-ejemplo",
  "inputSchemaJson": {},
  "outputSchemaJson": {},
  "integrationEndpointId": "00000000-0000-4000-8000-000000000001",
  "isWrite": false,
  "requiresApproval": false
}
```

</details>

### Respuesta — `Promise<ToolResponseDto>` · DTO `ToolResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/automation/dto/automation.dto.ts:383` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:389` |
| `isWrite` | `boolean` | Sí | — | — | Valor de is write mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:395` |
| `requiresApproval` | `boolean` | Sí | — | — | Valor de requires approval mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:401` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/automation/dto/automation.dto.ts:407` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una herramienta con ese código. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una herramienta de llamada HTTP necesita un endpoint de integración. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-03`

---

## 14. POST /automation/triggers

- **Origen:** CONTRATO
- **Nombre:** Configurar un disparador de automatización
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AutomationOrchestrationController.configureTrigger` — `src/modules/automation/controllers/automation-orchestration.controller.ts:75`

### Qué es y para qué sirve (negocio)

Configurar un disparador de automatización. Caso de uso UC-48-07: Disparador. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/triggers` la atiende `AutomationOrchestrationController.configureTrigger` (src/modules/automation/controllers/automation-orchestration.controller.ts:75). Exige sesión con alguno de los roles AUTOMATION_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `ConfigureTriggerDto` (10 campos, 4 obligatorios). Delega en `AutomationDefinitionService.configureTrigger`. Crea filas en automation.automation_triggers, messaging.domain_events, messaging.outbox_messages. Lee automation.automation_triggers, automation.workflows, messaging.outbox_messages. Publica TriggerRegistered.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AUTOMATION_ENGINEER, PLATFORM_ADMIN | `src/modules/automation/controllers/automation-orchestration.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.automation_triggers` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.configureTrigger → AutomationDefinitionService.configureTrigger → AutomationGovernanceRepository.createTrigger | `src/modules/automation/repositories/automation-governance.repository.ts:452` |
| `automation.automation_triggers` | LEE | LEE | DIRECTA | AutomationOrchestrationController.configureTrigger → AutomationDefinitionService.configureTrigger → AutomationGovernanceRepository.findTriggerByCode | `src/modules/automation/repositories/automation-governance.repository.ts:499` |
| `automation.workflows` | LEE | LEE | DIRECTA | AutomationOrchestrationController.configureTrigger → AutomationDefinitionService.configureTrigger → AutomationGovernanceRepository.findWorkflowById | `src/modules/automation/repositories/automation-governance.repository.ts:375` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.configureTrigger → AutomationDefinitionService.configureTrigger → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.configureTrigger → AutomationDefinitionService.configureTrigger → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AutomationOrchestrationController.configureTrigger → AutomationDefinitionService.configureTrigger → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `TriggerRegistered` | `src/modules/automation/services/automation-definition.service.ts:294` |

### Cuerpo — DTO `ConfigureTriggerDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:814` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/automation/dto/automation.dto.ts:822` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/automation/dto/automation.dto.ts:830` |
| `triggerTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:837` |
| `eventType` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Tipo de evento que suscribe; obligatorio para disparadores por evento | `src/modules/automation/dto/automation.dto.ts:850` |
| `targetResourceType` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/automation/dto/automation.dto.ts:859` |
| `conditionJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/automation/dto/automation.dto.ts:867` |
| `scheduleCron` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Expresión cron de 5 campos; obligatoria para disparadores por calendario | `src/modules/automation/dto/automation.dto.ts:880` |
| `workflowId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:887` |
| `campaignScheduleId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Calendario de campaña, si el cron viene de marketing | `src/modules/automation/dto/automation.dto.ts:898` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "triggerTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "workflowId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "triggerTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "eventType": "valor-ejemplo",
  "targetResourceType": "valor-ejemplo",
  "conditionJson": {},
  "scheduleCron": "valor-ejemplo",
  "workflowId": "00000000-0000-4000-8000-000000000001",
  "campaignScheduleId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<TriggerResponseDto>` · DTO `TriggerResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/automation/dto/automation.dto.ts:909` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:915` |
| `isEnabled` | `boolean` | Sí | — | — | Valor de is enabled mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:921` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/automation/dto/automation.dto.ts:927` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Workflow no encontrado. |
| 409 | `CONFLICT` | ConflictException: Ya existe un disparador con ese código. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se puede disparar un workflow archivado.; PreconditionFailedException: Un disparador por evento tiene que declarar qué evento suscribe.; PreconditionFailedException: Un disparador por calendario tiene que declarar su cron.; PreconditionFailedException: La expresión cron tiene que tener cinco campos. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-07`

---

## 15. POST /automation/triggers/calendar/tick

- **Origen:** CONTRATO
- **Nombre:** Evaluar los disparadores de calendario vencidos
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AutomationOrchestrationController.evaluateCalendarTriggers` — `src/modules/automation/controllers/automation-orchestration.controller.ts:91`

### Qué es y para qué sirve (negocio)

Evaluar los disparadores de calendario vencidos. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/triggers/calendar/tick` la atiende `AutomationOrchestrationController.evaluateCalendarTriggers` (src/modules/automation/controllers/automation-orchestration.controller.ts:91). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `EvaluateCalendarTriggersDto` (1 campo, 0 obligatorios). Delega en `AutomationExecutionService.evaluateCalendarTriggers`. Crea filas en automation.workflow_runs, messaging.domain_events, messaging.outbox_messages. Lee automation.automation_triggers, automation.workflow_runs, automation.workflows, messaging.outbox_messages. Publica WorkflowRunStarted.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/automation/controllers/automation-orchestration.controller.ts:91` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.automation_triggers` | LEE | LEE | DIRECTA | AutomationOrchestrationController.evaluateCalendarTriggers → AutomationExecutionService.evaluateCalendarTriggers → AutomationGovernanceRepository.findEnabledCalendarTriggers | `src/modules/automation/repositories/automation-governance.repository.ts:523` |
| `automation.workflow_runs` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.evaluateCalendarTriggers → AutomationExecutionService.evaluateCalendarTriggers → AutomationRunsRepository.createWorkflowRun | `src/modules/automation/repositories/automation-runs.repository.ts:207` |
| `automation.workflow_runs` | LEE | LEE | DIRECTA | AutomationOrchestrationController.evaluateCalendarTriggers → AutomationExecutionService.evaluateCalendarTriggers → AutomationRunsRepository.countRunsByWorkflow | `src/modules/automation/repositories/automation-runs.repository.ts:292` |
| `automation.workflows` | LEE | LEE | DIRECTA | AutomationOrchestrationController.evaluateCalendarTriggers → AutomationExecutionService.evaluateCalendarTriggers → AutomationGovernanceRepository.findWorkflowById | `src/modules/automation/repositories/automation-governance.repository.ts:375` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.evaluateCalendarTriggers → AutomationExecutionService.evaluateCalendarTriggers → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.evaluateCalendarTriggers → AutomationExecutionService.evaluateCalendarTriggers → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AutomationOrchestrationController.evaluateCalendarTriggers → AutomationExecutionService.evaluateCalendarTriggers → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `WorkflowRunStarted` | `src/modules/automation/services/automation-execution.service.ts:912` |

### Cuerpo — DTO `EvaluateCalendarTriggersDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `batchSize` | `number` | No | mínimo 1; máximo 500 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(500)` | Disparadores de calendario a evaluar por tick | `src/modules/automation/dto/automation.dto.ts:1622` |

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

### Respuesta — `Promise<EvaluateCalendarTriggersResponseDto>` · DTO `EvaluateCalendarTriggersResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `scanned` | `number` | Sí | — | — | Disparadores de calendario tomados en este tick | `src/modules/automation/dto/automation.dto.ts:1661` |
| `fired` | `number` | Sí | — | — | Ejecuciones de workflow arrancadas | `src/modules/automation/dto/automation.dto.ts:1667` |
| `skipped` | `number` | Sí | — | — | Disparadores evaluados que aún no vencían o cuyo workflow ya no está activo | `src/modules/automation/dto/automation.dto.ts:1676` |
| `firedTriggers` | `array<FiredTriggerDto>` | Sí | — | — | Valor de fired triggers mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:1682` |
| `firedTriggers[].triggerId` | `string` | Sí | formato uuid | — | Identificador asociado a trigger. | `src/modules/automation/dto/automation.dto.ts:1633` |
| `firedTriggers[].workflowRunId` | `string` | Sí | formato uuid | — | Identificador asociado a workflow run. | `src/modules/automation/dto/automation.dto.ts:1639` |
| `firedTriggers[].firedAt` | `string` | Sí | formato date-time | — | Marca del cron que disparó esta ejecución | `src/modules/automation/dto/automation.dto.ts:1648` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `ctrl:AutomationOrchestrationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /automation/workflows

- **Origen:** CONTRATO
- **Nombre:** Definir un workflow con sus pasos
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AutomationOrchestrationController.defineWorkflow` — `src/modules/automation/controllers/automation-orchestration.controller.ts:59`

### Qué es y para qué sirve (negocio)

Definir un workflow con sus pasos. Caso de uso UC-48-06: Workflow con pasos anidados. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/workflows` la atiende `AutomationOrchestrationController.defineWorkflow` (src/modules/automation/controllers/automation-orchestration.controller.ts:59). Exige sesión con alguno de los roles AUTOMATION_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `DefineWorkflowDto` (15 campos, 7 obligatorios). Delega en `AutomationDefinitionService.defineWorkflow`. Crea filas en automation.workflow_steps, automation.workflows, messaging.domain_events, messaging.outbox_messages. Actualiza automation.workflow_steps. Lee automation.agent_tools, automation.agents, automation.workflows, messaging.outbox_messages. Publica WorkflowDefined.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AUTOMATION_ENGINEER, PLATFORM_ADMIN | `src/modules/automation/controllers/automation-orchestration.controller.ts:59` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.agent_tools` | LEE | LEE | DIRECTA | AutomationOrchestrationController.defineWorkflow → AutomationDefinitionService.defineWorkflow → AgentsRepository.findToolById | `src/modules/automation/repositories/agents.repository.ts:415` |
| `automation.agents` | LEE | LEE | DIRECTA | AutomationOrchestrationController.defineWorkflow → AutomationDefinitionService.defineWorkflow → AgentsRepository.findAgentById | `src/modules/automation/repositories/agents.repository.ts:287` |
| `automation.workflow_steps` | ESCRIBE | ACTUALIZA | POR_TIPO | AutomationOrchestrationController.defineWorkflow → AutomationDefinitionService.defineWorkflow | `src/modules/automation/services/automation-definition.service.ts:181` |
| `automation.workflow_steps` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.defineWorkflow → AutomationDefinitionService.defineWorkflow → AutomationGovernanceRepository.createWorkflowStep | `src/modules/automation/repositories/automation-governance.repository.ts:403` |
| `automation.workflows` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.defineWorkflow → AutomationDefinitionService.defineWorkflow → AutomationGovernanceRepository.createWorkflow | `src/modules/automation/repositories/automation-governance.repository.ts:350` |
| `automation.workflows` | LEE | LEE | DIRECTA | AutomationOrchestrationController.defineWorkflow → AutomationDefinitionService.defineWorkflow → AutomationGovernanceRepository.findWorkflowByCode | `src/modules/automation/repositories/automation-governance.repository.ts:389` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.defineWorkflow → AutomationDefinitionService.defineWorkflow → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.defineWorkflow → AutomationDefinitionService.defineWorkflow → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AutomationOrchestrationController.defineWorkflow → AutomationDefinitionService.defineWorkflow → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `WorkflowDefined` | `src/modules/automation/services/automation-definition.service.ts:188` |

### Cuerpo — DTO `DefineWorkflowDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:721` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/automation/dto/automation.dto.ts:729` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/automation/dto/automation.dto.ts:737` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/automation/dto/automation.dto.ts:745` |
| `orchestrationTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:752` |
| `definitionJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/automation/dto/automation.dto.ts:760` |
| `steps` | `array<WorkflowStepDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => WorkflowStepDto)` | — | `src/modules/automation/dto/automation.dto.ts:770` |
| `steps[].stepCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/automation/dto/automation.dto.ts:647` |
| `steps[].stepTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:654` |
| `steps[].agentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:662` |
| `steps[].agentToolId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:670` |
| `steps[].onSuccessStepCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código del paso siguiente si éste sale bien | `src/modules/automation/dto/automation.dto.ts:682` |
| `steps[].onFailureStepCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código del paso siguiente si éste falla | `src/modules/automation/dto/automation.dto.ts:694` |
| `steps[].configJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/automation/dto/automation.dto.ts:702` |
| `steps[].ordinal` | `number` | Sí | mínimo 0 | `@IsInt()` `@Min(0)` | — | `src/modules/automation/dto/automation.dto.ts:710` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "orchestrationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "steps": [
    {
      "stepCode": "CODIGO_EJEMPLO",
      "stepTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "ordinal": 1
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "orchestrationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "definitionJson": {},
  "steps": [
    {
      "stepCode": "CODIGO_EJEMPLO",
      "stepTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "agentId": "00000000-0000-4000-8000-000000000001",
      "agentToolId": "00000000-0000-4000-8000-000000000001",
      "onSuccessStepCode": "CODIGO_EJEMPLO",
      "onFailureStepCode": "CODIGO_EJEMPLO",
      "configJson": {},
      "ordinal": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<WorkflowResponseDto>` · DTO `WorkflowResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/automation/dto/automation.dto.ts:781` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:787` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/automation/dto/automation.dto.ts:793` |
| `stepIds` | `array<string>` | Sí | formato uuid | — | Valor de step ids mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:799` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Agente referenciado por un paso no encontrado.; ResourceNotFoundException: Herramienta referenciada por un paso no encontrada. |
| 409 | `CONFLICT` | ConflictException: Ya existe un workflow de automatización con ese código.; ConflictException: Dos pasos comparten el mismo código. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un paso salta a otro que no está declarado en el workflow.; PreconditionFailedException: Un paso de llamada a agente tiene que declarar qué agente llama.; PreconditionFailedException: Un paso de llamada a herramienta tiene que declarar qué herramienta usa. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-06`

---

## 17. POST /automation/workflows/{id}/runs

- **Origen:** CONTRATO
- **Nombre:** Arrancar la ejecución de un workflow
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AutomationOrchestrationController.startWorkflowRun` — `src/modules/automation/controllers/automation-orchestration.controller.ts:107`

### Qué es y para qué sirve (negocio)

Arrancar la ejecución de un workflow. Caso de uso UC-48-08: Arrancar ejecución. Dentro del módulo (descripción del modelo, en inglés): «A governed layer that lets multiple AI agents (and deterministic bots) automate the capture, enrichment, validation and routing of information records across the platform — the "dynamic multi-agent automation layer" the clients asked for.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/automation/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_48_automation.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /automation/workflows/{id}/runs` la atiende `AutomationOrchestrationController.startWorkflowRun` (src/modules/automation/controllers/automation-orchestration.controller.ts:107). Exige sesión con alguno de los roles SYSTEM, AUTOMATION_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `StartWorkflowRunDto` (6 campos, 1 obligatorio). Delega en `AutomationExecutionService.startWorkflowRun`. Crea filas en automation.workflow_runs, messaging.domain_events, messaging.outbox_messages. Lee automation.automation_triggers, automation.workflow_runs, automation.workflows, messaging.outbox_messages. Publica WorkflowRunStarted.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, AUTOMATION_ENGINEER, PLATFORM_ADMIN | `src/modules/automation/controllers/automation-orchestration.controller.ts:107` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:253` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/automation/controllers/automation-orchestration.controller.ts:107` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:135` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `automation.automation_triggers` | LEE | LEE | DIRECTA | AutomationOrchestrationController.startWorkflowRun → AutomationExecutionService.startWorkflowRun → AutomationGovernanceRepository.findTriggerById | `src/modules/automation/repositories/automation-governance.repository.ts:485` |
| `automation.workflow_runs` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.startWorkflowRun → AutomationExecutionService.startWorkflowRun → AutomationRunsRepository.createWorkflowRun | `src/modules/automation/repositories/automation-runs.repository.ts:207` |
| `automation.workflow_runs` | LEE | LEE | DIRECTA | AutomationOrchestrationController.startWorkflowRun → AutomationExecutionService.startWorkflowRun → AutomationRunsRepository.findLiveRunByContext | `src/modules/automation/repositories/automation-runs.repository.ts:283` |
| `automation.workflows` | LEE | LEE | DIRECTA | AutomationOrchestrationController.startWorkflowRun → AutomationExecutionService.startWorkflowRun → AutomationGovernanceRepository.findWorkflowById | `src/modules/automation/repositories/automation-governance.repository.ts:375` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.startWorkflowRun → AutomationExecutionService.startWorkflowRun → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AutomationOrchestrationController.startWorkflowRun → AutomationExecutionService.startWorkflowRun → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:164` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AutomationOrchestrationController.startWorkflowRun → AutomationExecutionService.startWorkflowRun → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:188` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `WorkflowRunStarted` | `src/modules/automation/services/automation-execution.service.ts:222` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `StartWorkflowRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `triggerId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Disparador que originó la ejecución | `src/modules/automation/dto/automation.dto.ts:945` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/automation/dto/automation.dto.ts:953` |
| `triggerSourceConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | De dónde viene la ejecución: evento, calendario o mano | `src/modules/automation/dto/automation.dto.ts:963` |
| `inputJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/automation/dto/automation.dto.ts:971` |
| `contextRefType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Tipo del expediente sobre el que corre | `src/modules/automation/dto/automation.dto.ts:983` |
| `contextRefId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Expediente sobre el que corre | `src/modules/automation/dto/automation.dto.ts:994` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "triggerSourceConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "triggerId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "triggerSourceConceptId": "00000000-0000-4000-8000-000000000001",
  "inputJson": {},
  "contextRefType": "valor-ejemplo",
  "contextRefId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<WorkflowRunResponseDto>` · DTO `WorkflowRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/automation/dto/automation.dto.ts:1005` |
| `runNumber` | `string` | Sí | — | — | Valor de run number mantenido por la instancia. | `src/modules/automation/dto/automation.dto.ts:1011` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/automation/dto/automation.dto.ts:1017` |
| `duplicate` | `boolean` | Sí | — | — | Verdadero si ya había un run vivo para el mismo contexto | `src/modules/automation/dto/automation.dto.ts:1025` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Workflow no encontrado.; ResourceNotFoundException: Disparador no encontrado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El workflow está archivado.; PreconditionFailedException: El disparador está deshabilitado.; PreconditionFailedException: El disparador no pertenece a ese workflow. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/automation.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 48 — Automatización y orquestación multiagente — etapa `UC-48-08`

---

