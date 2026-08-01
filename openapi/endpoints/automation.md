<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `automation`

Referencia exhaustiva de 17 operación(es) del módulo `automation`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `automation`
- **Controladores:** `AgentCatalogController`, `AutomationOrchestrationController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /automation/agent-runs/{id}/approvals](#1-post-automation-agent-runs-id-approvals) — Solicitar aprobación y pausar la ejecución
2. [POST /automation/agent-runs/{id}/record-automations/{recordAutomationId}/execute](#2-post-automation-agent-runs-id-record-automations-recordautomationid-execute) — Ejecutar una automatización de registro con deduplicación
3. [POST /automation/agent-runs/{id}/steps](#3-post-automation-agent-runs-id-steps) — Registrar un paso de la traza del agente
4. [POST /automation/agents](#4-post-automation-agents) — Registrar un agente con su primera versión
5. [POST /automation/agents/{id}/guardrails](#5-post-automation-agents-id-guardrails) — Adjuntar una política de guardrail a un agente
6. [POST /automation/agents/{id}/memory](#6-post-automation-agents-id-memory) — Persistir memoria del agente
7. [POST /automation/agents/{id}/versions/{versionId}/tool-bindings](#7-post-automation-agents-id-versions-versionid-tool-bindings) — Enlazar herramientas a una versión del agente
8. [POST /automation/agents/{id}/versions/publish](#8-post-automation-agents-id-versions-publish) — Publicar una versión del agente
9. [POST /automation/approvals/{id}/decide](#9-post-automation-approvals-id-decide) — Decidir la aprobación y reanudar o abortar el run
10. [POST /automation/guardrails](#10-post-automation-guardrails) — Definir una política de guardrail
11. [POST /automation/runs/{workflowRunId}/agent-runs](#11-post-automation-runs-workflowrunid-agent-runs) — Arrancar la ejecución de un agente dentro del run
12. [POST /automation/runs/{workflowRunId}/finalize](#12-post-automation-runs-workflowrunid-finalize) — Cerrar la ejecución con el resumen de coste
13. [POST /automation/tools](#13-post-automation-tools) — Registrar una herramienta de agente
14. [POST /automation/triggers](#14-post-automation-triggers) — Configurar un disparador de automatización
15. [POST /automation/triggers/calendar/tick](#15-post-automation-triggers-calendar-tick) — Evaluar los disparadores de calendario vencidos
16. [POST /automation/workflows](#16-post-automation-workflows) — Definir un workflow con sus pasos
17. [POST /automation/workflows/{id}/runs](#17-post-automation-workflows-id-runs) — Arrancar la ejecución de un workflow

---

## 1. POST /automation/agent-runs/{id}/approvals

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Solicitar aprobación y pausar la ejecución
- **Operation ID:** `AutomationOrchestrationController_requestApproval`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AutomationOrchestrationController.requestApproval](../../src/modules/automation/controllers/automation-orchestration.controller.ts)

### Descripción de negocio

Misma operación que dispara automáticamente el registro de un paso bloqueado.


### Descripción del sistema

NestJS resuelve `POST /automation/agent-runs/{id}/approvals` en `AutomationOrchestrationController_requestApproval`. El controlador delega en `AutomationExecutionService.requestApproval`. Valida el body como `AutomationRequestApprovalDto` y consume `application/json`. El tipo de retorno estático es `Promise<ApprovalResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AutomationRequestApprovalDto`; los campos opcionales se omiten.

```http
POST /automation/agent-runs/00000000-0000-4000-8000-000000000001/approvals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "approvalTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `AGENT_RUNTIME`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `approvalTypeConceptId` | Sí | `string` | formato `uuid` | Qué clase de aprobación se pide | `00000000-0000-4000-8000-000000000001` |
| `agentRunStepId` | No | `string` | formato `uuid` | Paso que quedó bloqueado | `00000000-0000-4000-8000-000000000001` |
| `requestedActionJson` | No | `object` | Sin restricción adicional declarada | Acción que el agente quiere ejecutar y está esperando | `{}` |
| `targetResourceType` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `targetRefId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/agent-runs/00000000-0000-4000-8000-000000000001/approvals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "approvalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "agentRunStepId": "00000000-0000-4000-8000-000000000001",
  "requestedActionJson": {},
  "targetResourceType": "valor-ejemplo",
  "targetRefId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ApprovalResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "changeRequestId": "00000000-0000-4000-8000-000000000001",
  "changeStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "approvedSteps": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `changeRequestId` | Sí | `string` | formato `uuid` | Identificador asociado a change request. | `00000000-0000-4000-8000-000000000001` |
| `changeStatusConceptId` | Sí | `string` | formato `uuid` | Estado del cambio tras la decisión | `00000000-0000-4000-8000-000000000001` |
| `approvedSteps` | Sí | `number` | Sin restricción adicional declarada | Pasos aprobados hasta ahora | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ejecución de agente no encontrada. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ejecución del agente ya terminó; no admite aprobaciones. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/agent-runs/{id}/approvals"
}
```

---

## 2. POST /automation/agent-runs/{id}/record-automations/{recordAutomationId}/execute

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Ejecutar una automatización de registro con deduplicación
- **Operation ID:** `AutomationOrchestrationController_executeRecordAutomation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AutomationOrchestrationController.executeRecordAutomation](../../src/modules/automation/controllers/automation-orchestration.controller.ts)

### Descripción de negocio

Escribe en el esquema de destino con la identidad de servicio del agente; la clave de deduplicación evita el registro repetido.


### Descripción del sistema

NestJS resuelve `POST /automation/agent-runs/{id}/record-automations/{recordAutomationId}/execute` en `AutomationOrchestrationController_executeRecordAutomation`. El controlador delega en `RecordAutomationService.executeRecordAutomation`. Valida el body como `ExecuteRecordAutomationDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExecuteRecordAutomationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `recordAutomationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ExecuteRecordAutomationDto`; los campos opcionales se omiten.

```http
POST /automation/agent-runs/00000000-0000-4000-8000-000000000001/record-automations/00000000-0000-4000-8000-000000000001/execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "payloadJson": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `AGENT_RUNTIME`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`, `recordAutomationId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `payloadJson` | Sí | `object` | Sin restricción adicional declarada | Datos de los que sale el registro, según el mapeo de la automatización | `{}` |
| `agentRunStepId` | No | `string` | formato `uuid` | Paso de la traza que ejecuta la escritura; si no se envía, se crea uno | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/agent-runs/00000000-0000-4000-8000-000000000001/record-automations/00000000-0000-4000-8000-000000000001/execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "payloadJson": {},
  "agentRunStepId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ExecuteRecordAutomationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExecuteRecordAutomationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExecuteRecordAutomationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExecuteRecordAutomationResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExecuteRecordAutomationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExecuteRecordAutomationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExecuteRecordAutomationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExecuteRecordAutomationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExecuteRecordAutomationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExecuteRecordAutomationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExecuteRecordAutomationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "targetRecordId": "00000000-0000-4000-8000-000000000001",
  "written": true,
  "agentRunStepId": "00000000-0000-4000-8000-000000000001",
  "draft": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `targetRecordId` | No | `string` | formato `uuid` | Registro escrito en el destino | `00000000-0000-4000-8000-000000000001` |
| `written` | Sí | `boolean` | Sin restricción adicional declarada | Falso si la clave de deduplicación ya existía | `true` |
| `agentRunStepId` | Sí | `string` | formato `uuid` | Paso de traza que deja constancia de la escritura | `00000000-0000-4000-8000-000000000001` |
| `draft` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si el modo de escritura es borrador y no se tocó el destino | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ejecución de agente no encontrada. | Excepción explícita en src/modules/automation/services/record-automation.service.ts |
| 404 | `NOT_FOUND` | Automatización de registro no encontrada. | Excepción explícita en src/modules/automation/services/record-automation.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ejecución del agente no está en marcha; no puede escribir registros. | Excepción explícita en src/modules/automation/services/record-automation.service.ts |
| 422 | `PRECONDITION_FAILED` | La automatización de registro no está activa. | Excepción explícita en src/modules/automation/services/record-automation.service.ts |
| 422 | `PRECONDITION_FAILED` | La automatización de registro pertenece a otro agente. | Excepción explícita en src/modules/automation/services/record-automation.service.ts |
| 422 | `PRECONDITION_FAILED` | El agente no tiene identidad de servicio; su escritura no sería atribuible. | Excepción explícita en src/modules/automation/services/record-automation.service.ts |
| 422 | `PRECONDITION_FAILED` | Un modo de escritura `upsert` necesita una clave de deduplicación. | Excepción explícita en src/modules/automation/services/record-automation.service.ts |
| 422 | `PRECONDITION_FAILED` | La automatización de registro no declara mapeo de campos. | Excepción explícita en src/modules/automation/services/record-automation.service.ts |
| 422 | `PRECONDITION_FAILED` | El mapeo de campos tiene una regla que no se entiende. | Excepción explícita en src/modules/automation/services/record-automation.service.ts |
| 422 | `PRECONDITION_FAILED` | El origen de un campo mapeado tiene que ser una ruta. | Excepción explícita en src/modules/automation/services/record-automation.service.ts |
| 422 | `PRECONDITION_FAILED` | Una regla de mapeo tiene que declarar `from` o `value`. | Excepción explícita en src/modules/automation/services/record-automation.service.ts |
| 422 | `PRECONDITION_FAILED` | Falta un campo obligatorio del mapeo. | Excepción explícita en src/modules/automation/services/record-automation.service.ts |
| 422 | `PRECONDITION_FAILED` | La validación de la automatización exige un campo que no llegó. | Excepción explícita en src/modules/automation/services/record-automation.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/agent-runs/{id}/record-automations/{recordAutomationId}/execute"
}
```

---

## 3. POST /automation/agent-runs/{id}/steps

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Registrar un paso de la traza del agente
- **Operation ID:** `AutomationOrchestrationController_recordAgentStep`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AutomationOrchestrationController.recordAgentStep](../../src/modules/automation/controllers/automation-orchestration.controller.ts)

### Descripción de negocio

Append-only. Si la herramienta exige aprobación o un guardrail bloquea, el paso queda a la espera y el run en pausa.

Contexto declarado en el controlador: UC-48-09 (traza) + UC-48-10 (pausa automática).

### Descripción del sistema

NestJS resuelve `POST /automation/agent-runs/{id}/steps` en `AutomationOrchestrationController_recordAgentStep`. El controlador delega en `AutomationExecutionService.recordAgentStep`. Valida el body como `RecordAgentStepDto` y consume `application/json`. El tipo de retorno estático es `Promise<AgentStepResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordAgentStepDto`; los campos opcionales se omiten.

```http
POST /automation/agent-runs/00000000-0000-4000-8000-000000000001/steps HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "stepKindConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `AGENT_RUNTIME`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `stepKindConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `agentToolId` | No | `string` | formato `uuid` | Herramienta invocada, si el paso la usa | `00000000-0000-4000-8000-000000000001` |
| `thoughtText` | No | `string` | Sin restricción adicional declarada | Razonamiento del agente en este paso | `valor-ejemplo` |
| `toolInputJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `toolOutputJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `errorText` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `occurredAt` | No | `string` | formato `date-time` | Cuándo ocurrió; por omisión, ahora | `2026-07-31T12:00:00.000Z` |
| `accruedCostAmount` | No | `string` | Sin restricción adicional declarada | Coste acumulado del run hasta este paso; cadena por ser numeric | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/agent-runs/00000000-0000-4000-8000-000000000001/steps HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AgentStepResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AgentStepResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AgentStepResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AgentStepResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AgentStepResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AgentStepResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AgentStepResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AgentStepResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AgentStepResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AgentStepResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AgentStepResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "sequenceNo": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "approvalId": "00000000-0000-4000-8000-000000000001",
  "paused": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `sequenceNo` | Sí | `number` | Sin restricción adicional declarada | Valor de sequence no mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `approvalId` | No | `string` | formato `uuid` | Aprobación creada si el paso quedó bloqueado esperando decisión humana | `00000000-0000-4000-8000-000000000001` |
| `paused` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si el run quedó en pausa por este paso | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ejecución de agente no encontrada. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 404 | `NOT_FOUND` | Herramienta no encontrada. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ejecución del agente no está en marcha; no admite pasos nuevos. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 422 | `PRECONDITION_FAILED` | La herramienta no está enlazada a la versión que se está ejecutando. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 422 | `PRECONDITION_FAILED` | El enlace deniega el uso de esa herramienta para esta versión. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 422 | `PRECONDITION_FAILED` | La herramienta agotó su tope de llamadas para esta ejecución. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/agent-runs/{id}/steps"
}
```

---

## 4. POST /automation/agents

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Registrar un agente con su primera versión
- **Operation ID:** `AgentCatalogController_registerAgent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AgentCatalogController.registerAgent](../../src/modules/automation/controllers/agent-catalog.controller.ts)

### Descripción de negocio

Agente y versión 1 nacen en borrador, en la misma transacción.


### Descripción del sistema

NestJS resuelve `POST /automation/agents` en `AgentCatalogController_registerAgent`. El controlador delega en `AgentCatalogService.registerAgent`. Valida el body como `RegisterAgentDto` y consume `application/json`. El tipo de retorno estático es `Promise<AgentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterAgentDto`; los campos opcionales se omiten.

```http
POST /automation/agents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "agentTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "autonomyLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "promptTemplate": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AUTOMATION_ENGINEER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `agentTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `defaultModelConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `systemServiceComponentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `autonomyLevelConceptId` | Sí | `string` | formato `uuid` | Nivel de autonomía del agente | `00000000-0000-4000-8000-000000000001` |
| `actsAsUserId` | No | `string` | formato `uuid` | Identidad de servicio con la que el agente actúa; obligatoria si no sólo sugiere | `00000000-0000-4000-8000-000000000001` |
| `promptTemplate` | Sí | `string` | Sin restricción adicional declarada | Plantilla de prompt de la versión 1 | `valor-ejemplo` |
| `modelConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `modelParamsJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `inputSchemaJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `outputSchemaJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/agents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AgentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AgentResponseDto`. Ejemplo completo derivado de ese DTO:

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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AUTOMATION_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un agente con ese código. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un agente que actúa necesita una identidad de servicio (`actsAsUserId`). | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/agents"
}
```

---

## 5. POST /automation/agents/{id}/guardrails

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Adjuntar una política de guardrail a un agente
- **Operation ID:** `AgentCatalogController_attachGuardrail`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AgentCatalogController.attachGuardrail](../../src/modules/automation/controllers/agent-catalog.controller.ts)

### Descripción de negocio

Adjuntar una política de guardrail a un agente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-48-05 (adjunción).

### Descripción del sistema

NestJS resuelve `POST /automation/agents/{id}/guardrails` en `AgentCatalogController_attachGuardrail`. El controlador delega en `AgentCatalogService.attachGuardrail`. Valida el body como `AttachGuardrailDto` y consume `application/json`. El tipo de retorno estático es `Promise<AttachGuardrailResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AttachGuardrailDto`; los campos opcionales se omiten.

```http
POST /automation/agents/00000000-0000-4000-8000-000000000001/guardrails HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "guardrailPolicyId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AI_GOVERNANCE_OFFICER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `guardrailPolicyId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `isEnabled` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/agents/00000000-0000-4000-8000-000000000001/guardrails HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "guardrailPolicyId": "00000000-0000-4000-8000-000000000001",
  "isEnabled": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AttachGuardrailResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AttachGuardrailResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AttachGuardrailResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AttachGuardrailResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AttachGuardrailResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AttachGuardrailResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AttachGuardrailResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AttachGuardrailResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AttachGuardrailResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AttachGuardrailResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AttachGuardrailResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "agentId": "00000000-0000-4000-8000-000000000001",
  "guardrailPolicyId": "00000000-0000-4000-8000-000000000001",
  "isEnabled": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `agentId` | Sí | `string` | formato `uuid` | Identificador asociado a agent. | `00000000-0000-4000-8000-000000000001` |
| `guardrailPolicyId` | Sí | `string` | formato `uuid` | Identificador asociado a guardrail policy. | `00000000-0000-4000-8000-000000000001` |
| `isEnabled` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is enabled mantenido por la instancia. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AI_GOVERNANCE_OFFICER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Agente no encontrado. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 404 | `NOT_FOUND` | Política de guardrail no encontrada. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 409 | `CONFLICT` | La política ya está adjunta a este agente. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La política de guardrail no está activa. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/agents/{id}/guardrails"
}
```

---

## 6. POST /automation/agents/{id}/memory

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Persistir memoria del agente
- **Operation ID:** `AgentCatalogController_upsertMemory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AgentCatalogController.upsertMemory](../../src/modules/automation/controllers/agent-catalog.controller.ts)

### Descripción de negocio

Upsert por (agente, ámbito, referencia, tipo); fuera del global la referencia es obligatoria.


### Descripción del sistema

NestJS resuelve `POST /automation/agents/{id}/memory` en `AgentCatalogController_upsertMemory`. El controlador delega en `AgentCatalogService.upsertMemory`. Valida el body como `UpsertAgentMemoryDto` y consume `application/json`. El tipo de retorno estático es `Promise<AgentMemoryResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpsertAgentMemoryDto`; los campos opcionales se omiten.

```http
POST /automation/agents/00000000-0000-4000-8000-000000000001/memory HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "scopeConceptId": "00000000-0000-4000-8000-000000000001",
  "memoryTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "contentText": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `AGENT_RUNTIME`, `AUTOMATION_ENGINEER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `scopeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `scopeRefId` | No | `string` | formato `uuid` | A qué se refiere la memoria; obligatorio salvo en el ámbito global | `00000000-0000-4000-8000-000000000001` |
| `memoryTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `contentText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `embeddingRef` | No | `string` | longitud máxima 200 | Referencia del embedding en el índice | `valor-ejemplo` |
| `importance` | No | `string` | Sin restricción adicional declarada | Importancia relativa; cadena por ser numeric | `valor-ejemplo` |
| `expiresAt` | No | `string` | formato `date-time` | Cuándo caduca la memoria | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/agents/00000000-0000-4000-8000-000000000001/memory HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AgentMemoryResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AgentMemoryResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AgentMemoryResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AgentMemoryResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AgentMemoryResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AgentMemoryResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AgentMemoryResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AgentMemoryResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AgentMemoryResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AgentMemoryResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AgentMemoryResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "agentId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "updated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `agentId` | Sí | `string` | formato `uuid` | Identificador asociado a agent. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `updated` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si actualizó una memoria existente en vez de crearla | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, AGENT_RUNTIME, AUTOMATION_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Agente no encontrado. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Fuera del ámbito global la memoria tiene que declarar a qué se refiere. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/agents/{id}/memory"
}
```

---

## 7. POST /automation/agents/{id}/versions/{versionId}/tool-bindings

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Enlazar herramientas a una versión del agente
- **Operation ID:** `AgentCatalogController_bindTools`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AgentCatalogController.bindTools](../../src/modules/automation/controllers/agent-catalog.controller.ts)

### Descripción de negocio

Lote atómico; sólo herramientas activas y sin enlaces repetidos.


### Descripción del sistema

NestJS resuelve `POST /automation/agents/{id}/versions/{versionId}/tool-bindings` en `AgentCatalogController_bindTools`. El controlador delega en `AgentCatalogService.bindTools`. Valida el body como `BindToolsDto` y consume `application/json`. El tipo de retorno estático es `Promise<BindToolsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BindToolsDto`; los campos opcionales se omiten.

```http
POST /automation/agents/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000001/tool-bindings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "bindings": [
    {
      "agentToolId": "00000000-0000-4000-8000-000000000001",
      "permissionEffectConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AUTOMATION_ENGINEER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`, `versionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `bindings` | Sí | `array<ToolBindingDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"agentToolId":"00000000-0000-4000-8000-000000000001","scopeJson":{},"maxCallsPerRun":1,"permissionEffectConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `bindings[].agentToolId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `bindings[].scopeJson` | No | `object` | Sin restricción adicional declarada | Recorte del alcance de la herramienta para esta versión | `{}` |
| `bindings[].maxCallsPerRun` | No | `number` | mínimo 1 | Tope de llamadas por ejecución | `1` |
| `bindings[].permissionEffectConceptId` | Sí | `string` | formato `uuid` | Si el enlace permite o deniega la herramienta | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/agents/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000001/tool-bindings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BindToolsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BindToolsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BindToolsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BindToolsResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BindToolsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BindToolsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BindToolsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BindToolsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BindToolsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BindToolsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BindToolsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "agentVersionId": "00000000-0000-4000-8000-000000000001",
  "bindingIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `agentVersionId` | Sí | `string` | formato `uuid` | Identificador asociado a agent version. | `00000000-0000-4000-8000-000000000001` |
| `bindingIds` | Sí | `array<string>` | formato `uuid` | Valor de binding ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AUTOMATION_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La versión no existe para ese agente. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 404 | `NOT_FOUND` | Herramienta no encontrada. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 409 | `CONFLICT` | La misma herramienta viene dos veces en el lote. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 409 | `CONFLICT` | La herramienta ya está enlazada a esta versión. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La herramienta no está activa. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/agents/{id}/versions/{versionId}/tool-bindings"
}
```

---

## 8. POST /automation/agents/{id}/versions/publish

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Publicar una versión del agente
- **Operation ID:** `AgentCatalogController_publishAgentVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AgentCatalogController.publishAgentVersion](../../src/modules/automation/controllers/agent-catalog.controller.ts)

### Descripción de negocio

Publica una versión en borrador o crea la siguiente y la publica. `current_version` es derivado.


### Descripción del sistema

NestJS resuelve `POST /automation/agents/{id}/versions/publish` en `AgentCatalogController_publishAgentVersion`. El controlador delega en `AgentCatalogService.publishAgentVersion`. Valida el body como `PublishAgentVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<AgentVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishAgentVersionDto`; los campos opcionales se omiten.

```http
POST /automation/agents/00000000-0000-4000-8000-000000000001/versions/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AUTOMATION_ENGINEER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `agentVersionId` | No | `string` | formato `uuid` | Versión en borrador que se publica; si no se envía, se crea una nueva | `00000000-0000-4000-8000-000000000001` |
| `promptTemplate` | No | `string` | Sin restricción adicional declarada | Plantilla de la versión nueva | `valor-ejemplo` |
| `modelConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `modelParamsJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `inputSchemaJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `outputSchemaJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `changelog` | No | `string` | Sin restricción adicional declarada | Qué cambia respecto a la versión anterior | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/agents/00000000-0000-4000-8000-000000000001/versions/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AgentVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AgentVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AgentVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AgentVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AgentVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AgentVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AgentVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AgentVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AgentVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AgentVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AgentVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "agentId": "00000000-0000-4000-8000-000000000001",
  "version": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "currentVersion": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `agentId` | Sí | `string` | formato `uuid` | Identificador asociado a agent. | `00000000-0000-4000-8000-000000000001` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `currentVersion` | Sí | `number` | Sin restricción adicional declarada | Versión vigente del agente tras publicar | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AUTOMATION_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Agente no encontrado. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 404 | `NOT_FOUND` | La versión no existe para ese agente. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La versión ya no está en borrador. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | Para crear una versión nueva hace falta su plantilla de prompt. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/agents/{id}/versions/publish"
}
```

---

## 9. POST /automation/approvals/{id}/decide

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Decidir la aprobación y reanudar o abortar el run
- **Operation ID:** `AutomationOrchestrationController_decideApproval`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AutomationOrchestrationController.decideApproval](../../src/modules/automation/controllers/automation-orchestration.controller.ts)

### Descripción de negocio

Una sola decisión vale; quien decide queda registrado.


### Descripción del sistema

NestJS resuelve `POST /automation/approvals/{id}/decide` en `AutomationOrchestrationController_decideApproval`. El controlador delega en `AutomationExecutionService.decideApproval`. Valida el body como `DecideApprovalDto` y consume `application/json`. El tipo de retorno estático es `Promise<DecideApprovalResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DecideApprovalDto`; los campos opcionales se omiten.

```http
POST /automation/approvals/00000000-0000-4000-8000-000000000001/decide HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "approved"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICAL_APPROVER`, `OPERATIONAL_APPROVER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `approved`, `rejected` | Sin descripción específica en el contrato OpenAPI. | `approved` |
| `decisionNote` | No | `string` | Sin restricción adicional declarada | Por qué se aprueba o se rechaza | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/approvals/00000000-0000-4000-8000-000000000001/decide HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "approved",
  "decisionNote": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DecideApprovalResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DecideApprovalResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DecideApprovalResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DecideApprovalResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DecideApprovalResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DecideApprovalResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DecideApprovalResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DecideApprovalResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DecideApprovalResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DecideApprovalResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DecideApprovalResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "agentRunId": "00000000-0000-4000-8000-000000000001",
  "agentRunStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "resolutionStepId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `agentRunId` | Sí | `string` | formato `uuid` | Identificador asociado a agent run. | `00000000-0000-4000-8000-000000000001` |
| `agentRunStatusConceptId` | Sí | `string` | formato `uuid` | Estado en el que queda el agent_run | `00000000-0000-4000-8000-000000000001` |
| `resolutionStepId` | Sí | `string` | formato `uuid` | Paso de resolución añadido a la traza | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICAL_APPROVER, OPERATIONAL_APPROVER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Aprobación no encontrada. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 404 | `NOT_FOUND` | Ejecución de agente no encontrada. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 409 | `CONFLICT` | La aprobación ya está decidida. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ejecución del agente no está en pausa. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/approvals/{id}/decide"
}
```

---

## 10. POST /automation/guardrails

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Definir una política de guardrail
- **Operation ID:** `AgentCatalogController_defineGuardrail`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AgentCatalogController.defineGuardrail](../../src/modules/automation/controllers/agent-catalog.controller.ts)

### Descripción de negocio

Una política de coste sin tope, o de PHI sin tratamiento declarado, se rechaza.

Contexto declarado en el controlador: UC-48-05 (política).

### Descripción del sistema

NestJS resuelve `POST /automation/guardrails` en `AgentCatalogController_defineGuardrail`. El controlador delega en `AgentCatalogService.defineGuardrail`. Valida el body como `DefineGuardrailDto` y consume `application/json`. El tipo de retorno estático es `Promise<GuardrailResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineGuardrailDto`; los campos opcionales se omiten.

```http
POST /automation/guardrails HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "policyTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "enforcementConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AI_GOVERNANCE_OFFICER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `policyTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ruleJson` | No | `object` | Sin restricción adicional declarada | Regla declarativa de la política | `{}` |
| `piiPhiHandlingConceptId` | No | `string` | formato `uuid` | Cómo se trata el dato de paciente | `00000000-0000-4000-8000-000000000001` |
| `maxCostAmount` | No | `string` | Sin restricción adicional declarada | Tope de coste; cadena por ser numeric | `valor-ejemplo` |
| `enforcementConceptId` | Sí | `string` | formato `uuid` | Bloquea, avisa o sólo registra | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/guardrails HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<GuardrailResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<GuardrailResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<GuardrailResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<GuardrailResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<GuardrailResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<GuardrailResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<GuardrailResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<GuardrailResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<GuardrailResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GuardrailResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "isActive": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is active mantenido por la instancia. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AI_GOVERNANCE_OFFICER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una política de guardrail con ese código. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una política de coste tiene que declarar su tope. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | Una política de datos de paciente tiene que declarar cómo se tratan. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/guardrails"
}
```

---

## 11. POST /automation/runs/{workflowRunId}/agent-runs

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Arrancar la ejecución de un agente dentro del run
- **Operation ID:** `AutomationOrchestrationController_startAgentRun`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AutomationOrchestrationController.startAgentRun](../../src/modules/automation/controllers/automation-orchestration.controller.ts)

### Descripción de negocio

Sólo versiones publicadas: un borrador es una propuesta, no algo que actúe.

Contexto declarado en el controlador: UC-48-09 (arranque del agente).

### Descripción del sistema

NestJS resuelve `POST /automation/runs/{workflowRunId}/agent-runs` en `AutomationOrchestrationController_startAgentRun`. El controlador delega en `AutomationExecutionService.startAgentRun`. Valida el body como `StartAgentRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<AgentRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `workflowRunId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `StartAgentRunDto`; los campos opcionales se omiten.

```http
POST /automation/runs/00000000-0000-4000-8000-000000000001/agent-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "agentId": "00000000-0000-4000-8000-000000000001",
  "taskTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `AGENT_RUNTIME`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `workflowRunId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `agentId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `agentVersionId` | No | `string` | formato `uuid` | Versión concreta; por omisión, la publicada vigente del agente | `00000000-0000-4000-8000-000000000001` |
| `taskTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `inputJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/runs/00000000-0000-4000-8000-000000000001/agent-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "agentId": "00000000-0000-4000-8000-000000000001",
  "agentVersionId": "00000000-0000-4000-8000-000000000001",
  "taskTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "inputJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AgentRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AgentRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AgentRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AgentRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AgentRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AgentRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AgentRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AgentRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AgentRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AgentRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AgentRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "agentVersionId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `agentVersionId` | Sí | `string` | formato `uuid` | Identificador asociado a agent version. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, AGENT_RUNTIME, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ejecución de workflow no encontrada. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 404 | `NOT_FOUND` | Agente no encontrado. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 404 | `NOT_FOUND` | La versión no existe para ese agente. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ejecución del workflow no está en marcha. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 422 | `PRECONDITION_FAILED` | El agente no está activo. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 422 | `PRECONDITION_FAILED` | Sólo se puede ejecutar una versión publicada del agente. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/runs/{workflowRunId}/agent-runs"
}
```

---

## 12. POST /automation/runs/{workflowRunId}/finalize

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Cerrar la ejecución con el resumen de coste
- **Operation ID:** `AutomationOrchestrationController_finalizeWorkflowRun`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AutomationOrchestrationController.finalizeWorkflowRun](../../src/modules/automation/controllers/automation-orchestration.controller.ts)

### Descripción de negocio

Idempotente; no cierra si quedan aprobaciones pendientes.


### Descripción del sistema

NestJS resuelve `POST /automation/runs/{workflowRunId}/finalize` en `AutomationOrchestrationController_finalizeWorkflowRun`. El controlador delega en `AutomationExecutionService.finalizeWorkflowRun`. Valida el body como `FinalizeWorkflowRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<FinalizeWorkflowRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `workflowRunId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `FinalizeWorkflowRunDto`; los campos opcionales se omiten.

```http
POST /automation/runs/00000000-0000-4000-8000-000000000001/finalize HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `workflowRunId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `failed` | No | `boolean` | Sin restricción adicional declarada | Cierra el run como fallido aunque los agent_runs hayan terminado bien | `false` |
| `errorText` | No | `string` | Sin restricción adicional declarada | Motivo del fallo | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/runs/00000000-0000-4000-8000-000000000001/finalize HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "failed": false,
  "errorText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<FinalizeWorkflowRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FinalizeWorkflowRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FinalizeWorkflowRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FinalizeWorkflowRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<FinalizeWorkflowRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FinalizeWorkflowRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FinalizeWorkflowRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FinalizeWorkflowRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FinalizeWorkflowRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FinalizeWorkflowRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FinalizeWorkflowRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "totalCostAmount": "valor-ejemplo",
  "closedAgentRuns": 1,
  "alreadyFinalized": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `totalCostAmount` | Sí | `string` | Sin restricción adicional declarada | Suma del coste de los agent_runs; cadena por ser numeric | `valor-ejemplo` |
| `closedAgentRuns` | Sí | `number` | Sin restricción adicional declarada | Agent runs cerrados por esta llamada | `1` |
| `alreadyFinalized` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si el run ya estaba cerrado y no se tocó nada | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ejecución de workflow no encontrada. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ejecución tiene aprobaciones pendientes y no puede cerrarse. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/runs/{workflowRunId}/finalize"
}
```

---

## 13. POST /automation/tools

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Registrar una herramienta de agente
- **Operation ID:** `AgentCatalogController_registerTool`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AgentCatalogController.registerTool](../../src/modules/automation/controllers/agent-catalog.controller.ts)

### Descripción de negocio

`isWrite` y `requiresApproval` son lo que decide si su uso pausa la ejecución.


### Descripción del sistema

NestJS resuelve `POST /automation/tools` en `AgentCatalogController_registerTool`. El controlador delega en `AgentCatalogService.registerTool`. Valida el body como `RegisterToolDto` y consume `application/json`. El tipo de retorno estático es `Promise<ToolResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterToolDto`; los campos opcionales se omiten.

```http
POST /automation/tools HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "toolTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AUTOMATION_ENGINEER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `toolTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `targetResource` | No | `string` | longitud máxima 200 | Recurso sobre el que opera la herramienta | `valor-ejemplo` |
| `inputSchemaJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `outputSchemaJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `integrationEndpointId` | No | `string` | formato `uuid` | Endpoint de integración; obligatorio si la herramienta es una llamada HTTP | `00000000-0000-4000-8000-000000000001` |
| `isWrite` | No | `boolean` | Sin restricción adicional declarada | Si la herramienta escribe | `false` |
| `requiresApproval` | No | `boolean` | Sin restricción adicional declarada | Si su uso exige aprobación humana | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/tools HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ToolResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ToolResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ToolResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ToolResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ToolResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ToolResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ToolResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ToolResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ToolResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ToolResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "isWrite": true,
  "requiresApproval": true,
  "stateConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `isWrite` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is write mantenido por la instancia. | `true` |
| `requiresApproval` | Sí | `boolean` | Sin restricción adicional declarada | Valor de requires approval mantenido por la instancia. | `true` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AUTOMATION_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una herramienta con ese código. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una herramienta de llamada HTTP necesita un endpoint de integración. | Excepción explícita en src/modules/automation/services/agent-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/tools"
}
```

---

## 14. POST /automation/triggers

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Configurar un disparador de automatización
- **Operation ID:** `AutomationOrchestrationController_configureTrigger`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AutomationOrchestrationController.configureTrigger](../../src/modules/automation/controllers/automation-orchestration.controller.ts)

### Descripción de negocio

Por evento exige el tipo de evento; por calendario, un cron de cinco campos.


### Descripción del sistema

NestJS resuelve `POST /automation/triggers` en `AutomationOrchestrationController_configureTrigger`. El controlador delega en `AutomationDefinitionService.configureTrigger`. Valida el body como `ConfigureTriggerDto` y consume `application/json`. El tipo de retorno estático es `Promise<TriggerResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ConfigureTriggerDto`; los campos opcionales se omiten.

```http
POST /automation/triggers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "triggerTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "workflowId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AUTOMATION_ENGINEER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `triggerTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `eventType` | No | `string` | longitud máxima 200 | Tipo de evento que suscribe; obligatorio para disparadores por evento | `valor-ejemplo` |
| `targetResourceType` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `conditionJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `scheduleCron` | No | `string` | longitud máxima 100 | Expresión cron de 5 campos; obligatoria para disparadores por calendario | `valor-ejemplo` |
| `workflowId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `campaignScheduleId` | No | `string` | formato `uuid` | Calendario de campaña, si el cron viene de marketing | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/triggers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TriggerResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TriggerResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TriggerResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TriggerResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TriggerResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TriggerResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TriggerResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TriggerResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TriggerResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TriggerResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "isEnabled": true,
  "stateConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `isEnabled` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is enabled mantenido por la instancia. | `true` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AUTOMATION_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Workflow no encontrado. | Excepción explícita en src/modules/automation/services/automation-definition.service.ts |
| 409 | `CONFLICT` | Ya existe un disparador con ese código. | Excepción explícita en src/modules/automation/services/automation-definition.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No se puede disparar un workflow archivado. | Excepción explícita en src/modules/automation/services/automation-definition.service.ts |
| 422 | `PRECONDITION_FAILED` | Un disparador por evento tiene que declarar qué evento suscribe. | Excepción explícita en src/modules/automation/services/automation-definition.service.ts |
| 422 | `PRECONDITION_FAILED` | Un disparador por calendario tiene que declarar su cron. | Excepción explícita en src/modules/automation/services/automation-definition.service.ts |
| 422 | `PRECONDITION_FAILED` | La expresión cron tiene que tener cinco campos. | Excepción explícita en src/modules/automation/services/automation-definition.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/triggers"
}
```

---

## 15. POST /automation/triggers/calendar/tick

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Evaluar los disparadores de calendario vencidos
- **Operation ID:** `AutomationOrchestrationController_evaluateCalendarTriggers`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AutomationOrchestrationController.evaluateCalendarTriggers](../../src/modules/automation/controllers/automation-orchestration.controller.ts)

### Descripción de negocio

Toma con SKIP LOCKED: arranca un run por disparador vencido y avanza su marca.

Contexto declarado en el controlador: Worker · UC-48-07 (evaluación periódica).

### Descripción del sistema

NestJS resuelve `POST /automation/triggers/calendar/tick` en `AutomationOrchestrationController_evaluateCalendarTriggers`. El controlador delega en `AutomationExecutionService.evaluateCalendarTriggers`. Valida el body como `EvaluateCalendarTriggersDto` y consume `application/json`. El tipo de retorno estático es `Promise<EvaluateCalendarTriggersResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EvaluateCalendarTriggersDto`; los campos opcionales se omiten.

```http
POST /automation/triggers/calendar/tick HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `batchSize` | No | `number` | mínimo 1; máximo 500 | Disparadores de calendario a evaluar por tick | `50` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/triggers/calendar/tick HTTP/1.1
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
| 200 | Operación completada correctamente. | `Promise<EvaluateCalendarTriggersResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EvaluateCalendarTriggersResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EvaluateCalendarTriggersResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EvaluateCalendarTriggersResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EvaluateCalendarTriggersResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EvaluateCalendarTriggersResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EvaluateCalendarTriggersResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EvaluateCalendarTriggersResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EvaluateCalendarTriggersResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EvaluateCalendarTriggersResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "scanned": 1,
  "fired": 1,
  "skipped": 1,
  "firedTriggers": [
    {
      "triggerId": "00000000-0000-4000-8000-000000000001",
      "workflowRunId": "00000000-0000-4000-8000-000000000001",
      "firedAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `scanned` | Sí | `number` | Sin restricción adicional declarada | Disparadores de calendario tomados en este tick | `1` |
| `fired` | Sí | `number` | Sin restricción adicional declarada | Ejecuciones de workflow arrancadas | `1` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Disparadores evaluados que aún no vencían o cuyo workflow ya no está activo | `1` |
| `firedTriggers` | Sí | `array<FiredTriggerDto>` | Sin restricción adicional declarada | Valor de fired triggers mantenido por la instancia. | `[{"triggerId":"00000000-0000-4000-8000-000000000001","workflowRunId":"00000000-0000-4000-8000-000000000001","firedAt":"2026-07-31T12:00:00.000Z"}]` |
| `firedTriggers[].triggerId` | Sí | `string` | formato `uuid` | Identificador asociado a trigger. | `00000000-0000-4000-8000-000000000001` |
| `firedTriggers[].workflowRunId` | Sí | `string` | formato `uuid` | Identificador asociado a workflow run. | `00000000-0000-4000-8000-000000000001` |
| `firedTriggers[].firedAt` | Sí | `string` | formato `date-time` | Marca del cron que disparó esta ejecución | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
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
  "path": "/automation/triggers/calendar/tick"
}
```

---

## 16. POST /automation/workflows

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Definir un workflow con sus pasos
- **Operation ID:** `AutomationOrchestrationController_defineWorkflow`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AutomationOrchestrationController.defineWorkflow](../../src/modules/automation/controllers/automation-orchestration.controller.ts)

### Descripción de negocio

Los saltos entre pasos van por código; un salto a un paso no declarado se rechaza.


### Descripción del sistema

NestJS resuelve `POST /automation/workflows` en `AutomationOrchestrationController_defineWorkflow`. El controlador delega en `AutomationDefinitionService.defineWorkflow`. Valida el body como `DefineWorkflowDto` y consume `application/json`. El tipo de retorno estático es `Promise<WorkflowResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineWorkflowDto`; los campos opcionales se omiten.

```http
POST /automation/workflows HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AUTOMATION_ENGINEER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `orchestrationTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `definitionJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `steps` | Sí | `array<WorkflowStepDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"stepCode":"CODIGO_EJEMPLO","stepTypeConceptId":"00000000-0000-4000-8000-000000000001","agentId":"00000000-0000-4000-8000-000000000001","agentToolId":"00000000-0000-4000-8000-000000000001","onSuccessStepCode":"CODIGO_EJEMPLO","onFailureStepCode":"CODIGO_EJEMPLO","configJson":{},"ordinal":1}]` |
| `steps[].stepCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `steps[].stepTypeConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `steps[].agentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `steps[].agentToolId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `steps[].onSuccessStepCode` | No | `string` | longitud máxima 100 | Código del paso siguiente si éste sale bien | `CODIGO_EJEMPLO` |
| `steps[].onFailureStepCode` | No | `string` | longitud máxima 100 | Código del paso siguiente si éste falla | `CODIGO_EJEMPLO` |
| `steps[].configJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `steps[].ordinal` | Sí | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/workflows HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<WorkflowResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<WorkflowResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<WorkflowResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<WorkflowResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<WorkflowResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<WorkflowResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<WorkflowResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<WorkflowResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<WorkflowResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WorkflowResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "stepIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `stepIds` | Sí | `array<string>` | formato `uuid` | Valor de step ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AUTOMATION_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Agente referenciado por un paso no encontrado. | Excepción explícita en src/modules/automation/services/automation-definition.service.ts |
| 404 | `NOT_FOUND` | Herramienta referenciada por un paso no encontrada. | Excepción explícita en src/modules/automation/services/automation-definition.service.ts |
| 409 | `CONFLICT` | Ya existe un workflow de automatización con ese código. | Excepción explícita en src/modules/automation/services/automation-definition.service.ts |
| 409 | `CONFLICT` | Dos pasos comparten el mismo código. | Excepción explícita en src/modules/automation/services/automation-definition.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un paso salta a otro que no está declarado en el workflow. | Excepción explícita en src/modules/automation/services/automation-definition.service.ts |
| 422 | `PRECONDITION_FAILED` | Un paso de llamada a agente tiene que declarar qué agente llama. | Excepción explícita en src/modules/automation/services/automation-definition.service.ts |
| 422 | `PRECONDITION_FAILED` | Un paso de llamada a herramienta tiene que declarar qué herramienta usa. | Excepción explícita en src/modules/automation/services/automation-definition.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/workflows"
}
```

---

## 17. POST /automation/workflows/{id}/runs

- **Módulo:** `automation`
- **Etiqueta OpenAPI:** `automation`
- **Nombre:** Arrancar la ejecución de un workflow
- **Operation ID:** `AutomationOrchestrationController_startWorkflowRun`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AutomationOrchestrationController.startWorkflowRun](../../src/modules/automation/controllers/automation-orchestration.controller.ts)

### Descripción de negocio

Si ya hay una ejecución viva sobre el mismo expediente, se devuelve ésa en lugar de arrancar otra.


### Descripción del sistema

NestJS resuelve `POST /automation/workflows/{id}/runs` en `AutomationOrchestrationController_startWorkflowRun`. El controlador delega en `AutomationExecutionService.startWorkflowRun`. Valida el body como `StartWorkflowRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<WorkflowRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `StartWorkflowRunDto`; los campos opcionales se omiten.

```http
POST /automation/workflows/00000000-0000-4000-8000-000000000001/runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "triggerSourceConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `AUTOMATION_ENGINEER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `triggerId` | No | `string` | formato `uuid` | Disparador que originó la ejecución | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `triggerSourceConceptId` | Sí | `string` | formato `uuid` | De dónde viene la ejecución: evento, calendario o mano | `00000000-0000-4000-8000-000000000001` |
| `inputJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `contextRefType` | No | `string` | longitud máxima 100 | Tipo del expediente sobre el que corre | `valor-ejemplo` |
| `contextRefId` | No | `string` | formato `uuid` | Expediente sobre el que corre | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /automation/workflows/00000000-0000-4000-8000-000000000001/runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "triggerId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "triggerSourceConceptId": "00000000-0000-4000-8000-000000000001",
  "inputJson": {},
  "contextRefType": "valor-ejemplo",
  "contextRefId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<WorkflowRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<WorkflowRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<WorkflowRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<WorkflowRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<WorkflowRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<WorkflowRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<WorkflowRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<WorkflowRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<WorkflowRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<WorkflowRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WorkflowRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "runNumber": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `runNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de run number mantenido por la instancia. | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si ya había un run vivo para el mismo contexto | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, AUTOMATION_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Workflow no encontrado. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 404 | `NOT_FOUND` | Disparador no encontrado. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El workflow está archivado. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 422 | `PRECONDITION_FAILED` | El disparador está deshabilitado. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 422 | `PRECONDITION_FAILED` | El disparador no pertenece a ese workflow. | Excepción explícita en src/modules/automation/services/automation-execution.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/automation/workflows/{id}/runs"
}
```

---

