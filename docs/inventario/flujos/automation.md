<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `automation`

- **Procesos:** 1 · **Máquinas de estado:** 0
- **Operaciones:** 17 (17 con decisiones propias, 0 sin ellas)
- Inventario de endpoints del módulo: [automation](../endpoints/automation.md)

## Proceso: Módulo 48 — Automatización y orquestación multiagente

- **Código:** `automation` · **Agrupación:** MIXTO · **Operaciones:** 17
- **Actores:** AGENT_RUNTIME · AI_GOVERNANCE_OFFICER · AUTOMATION_ENGINEER · CLINICAL_APPROVER · OPERATIONAL_APPROVER · PLATFORM_ADMIN · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/automation/README.md`

### Para qué sirve

Agentes con versiones publicables, herramientas con permiso, guardrails que detienen lo que no debe pasar, workflows con pasos enlazados, ejecuciones con traza paso a paso, aprobaciones humanas y escritura de registros con deduplicación.

_Fuente: `src/modules/automation/README.md:3`_

### Flujo general declarado en el README

```text
CATÁLOGO
  agents ─────────────> agente DRAFT + versión 1 DRAFT
    └─ versions/publish > versión PUBLISHED, agente ACTIVE, current_version derivada
  tools ──────────────> herramienta ACTIVE con is_write / requires_approval
    └─ tool-bindings ─> qué puede usar cada versión, con tope de llamadas
  guardrails ─────────> política ACTIVE
    └─ agents/:id/guardrails > adjunta y habilitada

ORQUESTACIÓN
  workflows ──────────> workflow DRAFT + pasos enlazados por código
  triggers ───────────> disparador ACTIVE (evento con tipo, calendario con cron)

EJECUCIÓN
  workflows/:id/runs ──> ¿ya hay run vivo en el mismo expediente? ──> devuelve ése
                         si no: run RUNNING, numerado
    └─ agent-runs ─────> sólo versión PUBLISHED; se atribuye a acts_as_user_id
        └─ steps ──────> append-only, secuencia derivada
             ├─ herramienta no enlazada / denegada / sin cupo ──> rechazo
             ├─ escribe + requiere aprobación ──┐
             ├─ guardrail BLOCK (coste/PHI) ────┤
             │                                  ↓
             │        paso AWAITING_APPROVAL, agent_run PAUSED, run WAITING
             │        approvals/:id/decide ──> approved: RUNNING · rejected: CANCELLED + run FAILED
             └─ todo bien ──> paso SUCCEEDED
        └─ record-automations/:id/execute ──> mapeo → columnas → INSERT … ON CONFLICT
  runs/:id/finalize ───> cierra agent_runs abiertos, suma coste, run COMPLETED|FAILED
```

_Fuente: `src/modules/automation/README.md:29`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-48-01` | Registrar agente con su versión 1 | POST /automation/agents | AUTOMATION_ENGINEER · PLATFORM_ADMIN | MEDIO | 6 |
| `UC-48-02` | Publicar versión | POST /automation/agents/{id}/versions/publish | AUTOMATION_ENGINEER · PLATFORM_ADMIN | MEDIO | 7 |
| `UC-48-03` | Registrar herramienta | POST /automation/tools | AUTOMATION_ENGINEER · PLATFORM_ADMIN | MEDIO | 5 |
| `UC-48-04` | Enlazar herramientas | POST /automation/agents/{id}/versions/{versionId}/tool-bindings | AUTOMATION_ENGINEER · PLATFORM_ADMIN | MEDIO | 7 |
| `UC-48-05` | Guardrail y adjunción | POST /automation/agents/{id}/guardrails | AI_GOVERNANCE_OFFICER · PLATFORM_ADMIN | MEDIO | 7 |
|  |  | POST /automation/guardrails | AI_GOVERNANCE_OFFICER · PLATFORM_ADMIN | MEDIO | 2 |
| `UC-48-06` | Workflow con pasos anidados | POST /automation/workflows | AUTOMATION_ENGINEER · PLATFORM_ADMIN | MEDIO | 9 |
| `UC-48-07` | Disparador | POST /automation/triggers | AUTOMATION_ENGINEER · PLATFORM_ADMIN | MEDIO | 6 |
| `UC-48-08` | Arrancar ejecución | POST /automation/workflows/{id}/runs | SYSTEM · AUTOMATION_ENGINEER · PLATFORM_ADMIN | MEDIO | 7 |
| `UC-48-09` | Ejecución con traza | POST /automation/agent-runs/{id}/steps | SYSTEM · AGENT_RUNTIME · PLATFORM_ADMIN | MEDIO | 15 |
|  |  | POST /automation/runs/{workflowRunId}/agent-runs | SYSTEM · AGENT_RUNTIME · PLATFORM_ADMIN | MEDIO | 4 |
| `UC-48-10` | Pausar por guardrail | POST /automation/agent-runs/{id}/approvals | SYSTEM · AGENT_RUNTIME · PLATFORM_ADMIN | MEDIO | 10 |
| `UC-48-11` | Decidir y reanudar | POST /automation/approvals/{id}/decide | CLINICAL_APPROVER · OPERATIONAL_APPROVER · PLATFORM_ADMIN | MEDIO | 11 |
| `UC-48-12` | Persistir memoria | POST /automation/agents/{id}/memory | SYSTEM · AGENT_RUNTIME · AUTOMATION_ENGINEER · PLATFORM_ADMIN | MEDIO | 7 |
| `UC-48-13` | Escribir con dedupe | POST /automation/agent-runs/{id}/record-automations/{recordAutomationId}/execute | SYSTEM · AGENT_RUNTIME · PLATFORM_ADMIN | MEDIO | 8 |
| `UC-48-14` | Cerrar con resumen de coste | POST /automation/runs/{workflowRunId}/finalize | SYSTEM · PLATFORM_ADMIN | MEDIO | 8 |
| `ctrl:AutomationOrchestrationController` | Operaciones de AutomationOrchestrationController que el README no asigna a un caso de uso | POST /automation/triggers/calendar/tick | SYSTEM | MEDIO | 7 |

### Diagrama — etapas `UC-48-01`, `UC-48-02`, `UC-48-03`…

```mermaid
flowchart LR
  a2(["AUTOMATION_ENGINEER · PLATFORM_ADMIN"]):::actor
  a19(["AI_GOVERNANCE_OFFICER · PLATFORM_ADMIN"]):::actor
  a34(["SYSTEM · AUTOMATION_ENGINEER · PLATFORM_ADMIN"]):::actor
  a39(["SYSTEM · AGENT_RUNTIME · PLATFORM_ADMIN"]):::actor
  a50(["CLINICAL_APPROVER · OPERATIONAL_APPROVER · PLATFORM_ADMIN"]):::actor
  a54(["SYSTEM · AGENT_RUNTIME · AUTOMATION_ENGINEER · PLATFORM_ADM…"]):::actor
  a63(["SYSTEM · PLATFORM_ADMIN"]):::actor
  a67(["SYSTEM"]):::actor
  t3[("automation.agent_versions")]:::tabla
  t4[("automation.agents")]:::tabla
  t5[("messaging.domain_events")]:::tabla
  t6[("messaging.outbox_messages")]:::tabla
  e7>"AgentRegistered"]:::evento
  e10>"AgentVersionPublished"]:::evento
  t12[("automation.agent_tools")]:::tabla
  e13>"AgentToolRegistered"]:::evento
  t15[("automation.agent_tool_bindings")]:::tabla
  e17>"AgentToolBound"]:::evento
  t20[("automation.agent_guardrails")]:::tabla
  t21[("automation.guardrail_policies")]:::tabla
  e23>"GuardrailAttached"]:::evento
  t26[("automation.workflow_steps")]:::tabla
  t27[("automation.workflows")]:::tabla
  e29>"WorkflowDefined"]:::evento
  t31[("automation.automation_triggers")]:::tabla
  e32>"TriggerRegistered"]:::evento
  t35[("automation.workflow_runs")]:::tabla
  e37>"WorkflowRunStarted"]:::evento
  t40[("automation.agent_run_steps")]:::tabla
  t41[("automation.agent_runs")]:::tabla
  e43>"AgentStepRecorded"]:::evento
  e44>"ApprovalRequested"]:::evento
  t47[("automation.automation_approvals")]:::tabla
  e52>"ApprovalDecided"]:::evento
  t55[("automation.agent_memory")]:::tabla
  e57>"AgentMemoryUpserted"]:::evento
  t59[("automation.record_automations")]:::tabla
  e61>"RecordAutomated"]:::evento
  e65>"WorkflowRunCompleted"]:::evento
  subgraph s0["UC-48-01 · Registrar agente con su versión 1"]
    o1["POST /automation/agents"]:::op
  end
  t9[("+1 tablas más")]
  subgraph s1["UC-48-02 · Publicar versión"]
    o8["POST /automation/agents/{id}/versions/publish"]:::op
  end
  subgraph s2["UC-48-03 · Registrar herramienta"]
    o11["POST /automation/tools"]:::op
  end
  t16[("+1 tablas más")]
  subgraph s3["UC-48-04 · Enlazar herramientas"]
    o14["POST /automation/agents/{id}/versions/{versionId}/tool-bindings"]:::op
  end
  t22[("+1 tablas más")]
  subgraph s4["UC-48-05 · Guardrail y adjunción"]
    o18["POST /automation/agents/{id}/guardrails"]:::op
    o24["POST /automation/guardrails"]:::op
  end
  t28[("+3 tablas más")]
  subgraph s5["UC-48-06 · Workflow con pasos anidados"]
    o25["POST /automation/workflows"]:::op
  end
  subgraph s6["UC-48-07 · Disparador"]
    o30["POST /automation/triggers"]:::op
  end
  t36[("+1 tablas más")]
  subgraph s7["UC-48-08 · Arrancar ejecución"]
    o33["POST /automation/workflows/{id}/runs"]:::op
  end
  t42[("+9 tablas más")]
  subgraph s8["UC-48-09 · Ejecución con traza"]
    o38["POST /automation/agent-runs/{id}/steps"]:::op
    o45["POST /automation/runs/{workflowRunId}/agent-runs"]:::op
  end
  t48[("+4 tablas más")]
  subgraph s9["UC-48-10 · Pausar por guardrail"]
    o46["POST /automation/agent-runs/{id}/approvals"]:::op
  end
  t51[("+5 tablas más")]
  subgraph s10["UC-48-11 · Decidir y reanudar"]
    o49["POST /automation/approvals/{id}/decide"]:::op
  end
  t56[("+1 tablas más")]
  subgraph s11["UC-48-12 · Persistir memoria"]
    o53["POST /automation/agents/{id}/memory"]:::op
  end
  t60[("+2 tablas más")]
  subgraph s12["UC-48-13 · Escribir con dedupe"]
    o58["POST /automation/agent-runs/{id}/record-automations/{recordAutomation…"]:::op
  end
  t64[("+2 tablas más")]
  subgraph s13["UC-48-14 · Cerrar con resumen de coste"]
    o62["POST /automation/runs/{workflowRunId}/finalize"]:::op
  end
  t68[("+1 tablas más")]
  subgraph s14["ctrl:AutomationOrchestrationController · Operaciones de AutomationOrchestration…"]
    o66["POST /automation/triggers/calendar/tick"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"CREA"| t4
  o1 -->|"LEE"| t4
  o1 -->|"CREA"| t5
  o1 -->|"CREA"| t6
  o1 -->|"LEE"| t6
  o1 -->|"evento"| e7
  a2 --> o8
  o8 -->|"CREA"| t3
  o8 -->|"LEE"| t3
  o8 -->|"ACTUALIZA"| t4
  o8 -->|"LEE"| t4
  o8 -->|"CREA"| t5
  o8 -->|"CREA"| t6
  o8 -.-> t9
  o8 -->|"evento"| e10
  a2 --> o11
  o11 -->|"CREA"| t12
  o11 -->|"LEE"| t12
  o11 -->|"CREA"| t5
  o11 -->|"CREA"| t6
  o11 -->|"LEE"| t6
  o11 -->|"evento"| e13
  a2 --> o14
  o14 -->|"CREA"| t15
  o14 -->|"LEE"| t15
  o14 -->|"LEE"| t12
  o14 -->|"LEE"| t3
  o14 -->|"CREA"| t5
  o14 -->|"CREA"| t6
  o14 -.-> t16
  o14 -->|"evento"| e17
  a19 --> o18
  o18 -->|"CREA"| t20
  o18 -->|"LEE"| t20
  o18 -->|"LEE"| t4
  o18 -->|"LEE"| t21
  o18 -->|"CREA"| t5
  o18 -->|"CREA"| t6
  o18 -.-> t22
  o18 -->|"evento"| e23
  a19 --> o24
  o24 -->|"CREA"| t21
  o24 -->|"LEE"| t21
  a2 --> o25
  o25 -->|"LEE"| t12
  o25 -->|"LEE"| t4
  o25 -->|"ACTUALIZA"| t26
  o25 -->|"CREA"| t26
  o25 -->|"CREA"| t27
  o25 -->|"LEE"| t27
  o25 -.-> t28
  o25 -->|"evento"| e29
  a2 --> o30
  o30 -->|"CREA"| t31
  o30 -->|"LEE"| t31
  o30 -->|"LEE"| t27
  o30 -->|"CREA"| t5
  o30 -->|"CREA"| t6
  o30 -->|"LEE"| t6
  o30 -->|"evento"| e32
  a34 --> o33
  o33 -->|"LEE"| t31
  o33 -->|"CREA"| t35
  o33 -->|"LEE"| t35
  o33 -->|"LEE"| t27
  o33 -->|"CREA"| t5
  o33 -->|"CREA"| t6
  o33 -.-> t36
  o33 -->|"evento"| e37
  a39 --> o38
  o38 -->|"LEE"| t20
  o38 -->|"CREA"| t40
  o38 -->|"LEE"| t40
  o38 -->|"ACTUALIZA"| t41
  o38 -->|"LEE"| t41
  o38 -->|"LEE"| t15
  o38 -.-> t42
  o38 -->|"evento"| e43
  o38 -->|"evento"| e44
  a39 --> o45
  o45 -->|"CREA"| t41
  o45 -->|"LEE"| t3
  o45 -->|"LEE"| t4
  o45 -->|"LEE"| t35
  a39 --> o46
  o46 -->|"ACTUALIZA"| t41
  o46 -->|"LEE"| t41
  o46 -->|"LEE"| t4
  o46 -->|"CREA"| t47
  o46 -->|"LEE"| t47
  o46 -->|"ACTUALIZA"| t35
  o46 -.-> t48
  o46 -->|"evento"| e44
  a50 --> o49
  o49 -->|"CREA"| t40
  o49 -->|"LEE"| t40
  o49 -->|"ACTUALIZA"| t41
  o49 -->|"LEE"| t41
  o49 -->|"ACTUALIZA"| t47
  o49 -->|"LEE"| t47
  o49 -.-> t51
  o49 -->|"evento"| e52
  a54 --> o53
  o53 -->|"ACTUALIZA"| t55
  o53 -->|"CREA"| t55
  o53 -->|"LEE"| t55
  o53 -->|"LEE"| t4
  o53 -->|"CREA"| t5
  o53 -->|"CREA"| t6
  o53 -.-> t56
  o53 -->|"evento"| e57
  a39 --> o58
  o58 -->|"CREA"| t40
  o58 -->|"LEE"| t40
  o58 -->|"LEE"| t41
  o58 -->|"LEE"| t4
  o58 -->|"LEE"| t59
  o58 -->|"CREA"| t5
  o58 -.-> t60
  o58 -->|"evento"| e61
  a63 --> o62
  o62 -->|"ACTUALIZA"| t41
  o62 -->|"LEE"| t41
  o62 -->|"LEE"| t47
  o62 -->|"ACTUALIZA"| t35
  o62 -->|"LEE"| t35
  o62 -->|"CREA"| t5
  o62 -.-> t64
  o62 -->|"evento"| e65
  a67 --> o66
  o66 -->|"LEE"| t31
  o66 -->|"CREA"| t35
  o66 -->|"LEE"| t35
  o66 -->|"LEE"| t27
  o66 -->|"CREA"| t5
  o66 -->|"CREA"| t6
  o66 -.-> t68
  o66 -->|"evento"| e37
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. POST /automation/agent-runs/{id}/approvals

Solicitar aprobación y pausar la ejecución

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ejecución de agente no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ejecución del agente ya terminó; no admite aprobaciones. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AutomationExecutionService.requestApproval"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AutomationRunsRepository.findAgentRunForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE automation.agent_runs")]:::efecto
  n5 --> n6
  n7{"!agentRun"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Ejecución de agente no encontrada."]):::error
  n7 -->|"sí"| n8
  n9{"!OPEN_AGENT_RUN_STATUSES.includes(agentRun.statusConceptId)"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La ejecución del agente ya terminó; no admite aprobaciones."]):::error
  n9 -->|"sí"| n10
  n11["Llama a AutomationRunsRepository.findPendingApprovalsByAgentRuns"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE automation.automation_approvals")]:::efecto
  n11 --> n12
  n13["Llama a AgentsRepository.findAgentById"]:::llamada
  n12 --> n13
  n14[("LEE automation.agents")]:::efecto
  n13 --> n14
  n15["Llama a AutomationExecutionService.pauseForApproval"]:::llamada
  n14 --> n15
  n16["Llama a AutomationRunsRepository.createApproval"]:::llamada
  n15 --> n16
  n17[("CREA automation.automation_approvals")]:::efecto
  n16 --> n17
  n18[("ACTUALIZA automation.agent_runs")]:::efecto
  n17 --> n18
  n19{"agentRun.workflowRunId"}:::decision
  n18 --> n19
  n20["Llama a AutomationRunsRepository.findWorkflowRunForUpdate"]:::llamada
  n19 -->|"sí"| n20
  n21[("LEE automation.workflow_runs")]:::efecto
  n20 --> n21
  n22{"run && run.statusConceptId === CONCEPTS.AUTO_RUN_RUNNING"}:::decision
  n21 --> n22
  n23[("ACTUALIZA automation.workflow_runs")]:::efecto
  n22 -->|"sí"| n23
  n24["Llama a OutboxService.publishDomainEvent"]:::llamada
  n23 --> n24
  n22 -->|"no"| n24
  n19 -->|"no"| n24
  n25["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n24 --> n25
  n26["Transacción: startActiveSpan(…)"]:::transaccion
  n25 --> n26
  n27["Intenta"]:::intento
  n26 --> n27
  n28(["↩ (relanza el error capturado)"]):::error
  n27 -->|"si falla"| n28
  n29>"Evento ApprovalRequested"]:::evento
  n27 --> n29
  n30(("201 Responde con éxito")):::ok
  n29 --> n30
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /automation/agent-runs/{id}/record-automations/{recordAutomationId}/execute

Ejecutar una automatización de registro con deduplicación

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

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a RecordAutomationService.executeRecordAutomation"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AutomationRunsRepository.findAgentRunForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE automation.agent_runs")]:::efecto
  n5 --> n6
  n7{"!agentRun"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Ejecución de agente no encontrada."]):::error
  n7 -->|"sí"| n8
  n9{"agentRun.statusConceptId !== CONCEPTS.AUTO_AGENT_RUN_RUNNING"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La ejecución del agente no está en marcha; no puede escribir registros."]):::error
  n9 -->|"sí"| n10
  n11["Llama a AutomationGovernanceRepository.findRecordAutomationForUpdate"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE automation.record_automations")]:::efecto
  n11 --> n12
  n13{"!automation"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Automatización de registro no encontrada."]):::error
  n13 -->|"sí"| n14
  n15{"!automation.isActive"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED La automatización de registro no está activa."]):::error
  n15 -->|"sí"| n16
  n17{"automation.agentId && automation.agentId !== agentRun.agentId"}:::decision
  n15 -->|"no"| n17
  n18(["422 PRECONDITION_FAILED La automatización de registro pertenece a otro agente."]):::error
  n17 -->|"sí"| n18
  n19["Llama a AgentsRepository.findAgentById"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE automation.agents")]:::efecto
  n19 --> n20
  n21{"!writerUserId"}:::decision
  n20 --> n21
  n22(["422 PRECONDITION_FAILED El agente no tiene identidad de servicio; su escritura no sería atribuible."]):::error
  n21 -->|"sí"| n22
  n23["Llama a RecordAutomationService.applyFieldMapping"]:::llamada
  n21 -->|"no"| n23
  n24{"!fieldMappingJson || typeof fieldMappingJson !== 'object'"}:::decision
  n23 --> n24
  n25(["422 PRECONDITION_FAILED La automatización de registro no declara mapeo de campos."]):::error
  n24 -->|"sí"| n25
  n26["Repite: por cada const [column, rule] de Object.entries(mapping)"]:::bucle
  n24 -->|"no"| n26
  n27{"!rule || typeof rule !== 'object'"}:::decision
  n26 -->|"cada elemento"| n27
  n28(["422 PRECONDITION_FAILED El mapeo de campos tiene una regla que no se entiende."]):::error
  n27 -->|"sí"| n28
  n29{"rule.from !== undefined"}:::decision
  n27 -->|"no"| n29
  n30{"typeof rule.from !== 'string'"}:::decision
  n29 -->|"sí"| n30
  n31(["422 PRECONDITION_FAILED El origen de un campo mapeado tiene que ser una ruta."]):::error
  n30 -->|"sí"| n31
  n32{"rule.value !== undefined"}:::decision
  n29 -->|"no"| n32
  n33(["422 PRECONDITION_FAILED Una regla de mapeo tiene que declarar `from` o `value`."]):::error
  n32 -->|"no"| n33
  n34{"(value === undefined || value === null) && rule.required === true"}:::decision
  n30 -->|"no"| n34
  n32 -->|"sí"| n34
  n35(["422 PRECONDITION_FAILED Falta un campo obligatorio del mapeo."]):::error
  n34 -->|"sí"| n35
  n36["Llama a RecordAutomationService.assertValidation"]:::llamada
  n34 -->|"no"| n36
  n26 -->|"al terminar"| n36
  n37["Repite: por cada const column de required"]:::bucle
  n36 --> n37
  n38{"value === undefined || value === null || value === ''"}:::decision
  n37 -->|"cada elemento"| n38
  n39(["422 PRECONDITION_FAILED La validación de la automatización exige un campo que no llegó."]):::error
  n38 -->|"sí"| n39
  n40{"upsert && dedupeColumns.length === 0"}:::decision
  n38 -->|"no"| n40
  n37 -->|"al terminar"| n40
  n41(["422 PRECONDITION_FAILED Un modo de escritura `upsert` necesita una clave de deduplicación."]):::error
  n40 -->|"sí"| n41
  n42{"!draft"}:::decision
  n40 -->|"no"| n42
  n43["Llama a TargetRecordRepository.writeRecord"]:::llamada
  n42 -->|"sí"| n43
  n44{"columnNames.length === 0"}:::decision
  n43 --> n44
  n45(["500 La automatización de registro no produjo ninguna columna que escribir."]):::error
  n44 -->|"sí"| n45
  n46["Llama a AutomationRunsRepository.createAgentRunStep"]:::llamada
  n44 -->|"no"| n46
  n42 -->|"no"| n46
  n47[("CREA automation.agent_run_steps")]:::efecto
  n46 --> n47
  n48["Llama a AutomationRunsRepository.findMaxSequenceNo"]:::llamada
  n47 --> n48
  n49[("LEE automation.agent_run_steps")]:::efecto
  n48 --> n49
  n50["Llama a OutboxService.publishDomainEvent"]:::llamada
  n49 --> n50
  n51["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n50 --> n51
  n52["Transacción: startActiveSpan(…)"]:::transaccion
  n51 --> n52
  n53["Intenta"]:::intento
  n52 --> n53
  n54(["↩ (relanza el error capturado)"]):::error
  n53 -->|"si falla"| n54
  n55["Llama a OutboxService.persistDomainEvent"]:::llamada
  n53 --> n55
  n56["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n55 --> n56
  n57[("LEE messaging.outbox_messages")]:::efecto
  n56 --> n57
  n58["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n57 --> n58
  n59[("CREA messaging.domain_events")]:::efecto
  n58 --> n59
  n60["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n59 --> n60
  n61[("CREA messaging.outbox_messages")]:::efecto
  n60 --> n61
  n62>"Evento RecordAutomated"]:::evento
  n61 --> n62
  n63(("201 Responde con éxito")):::ok
  n62 --> n63
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /automation/agent-runs/{id}/steps

Registrar un paso de la traza del agente

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ejecución de agente no encontrada.; ResourceNotFoundException: Herramienta no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ejecución del agente no está en marcha; no admite pasos nuevos.; PreconditionFailedException: La herramienta no está enlazada a la versión que se está ejecutando.; PreconditionFailedException: El enlace deniega el uso de esa herramienta para esta versión.; PreconditionFailedException: La herramienta agotó su tope de llamadas para esta ejecución. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AutomationExecutionService.recordAgentStep"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AutomationRunsRepository.findAgentRunForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE automation.agent_runs")]:::efecto
  n5 --> n6
  n7{"!agentRun"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Ejecución de agente no encontrada."]):::error
  n7 -->|"sí"| n8
  n9{"agentRun.statusConceptId !== CONCEPTS.AUTO_AGENT_RUN_RUNNING"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La ejecución del agente no está en marcha; no admite pasos nuevos."]):::error
  n9 -->|"sí"| n10
  n11["Llama a AgentsRepository.findAgentById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE automation.agents")]:::efecto
  n11 --> n12
  n13["Llama a AutomationExecutionService.findBlocker"]:::llamada
  n12 --> n13
  n14{"dto.agentToolId"}:::decision
  n13 --> n14
  n15["Llama a AgentsRepository.findToolById"]:::llamada
  n14 -->|"sí"| n15
  n16[("LEE automation.agent_tools")]:::efecto
  n15 --> n16
  n17{"!tool"}:::decision
  n16 --> n17
  n18(["404 NOT_FOUND Herramienta no encontrada."]):::error
  n17 -->|"sí"| n18
  n19["Llama a AgentsRepository.findBinding"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE automation.agent_tool_bindings")]:::efecto
  n19 --> n20
  n21{"!binding"}:::decision
  n20 --> n21
  n22(["422 PRECONDITION_FAILED La herramienta no está enlazada a la versión que se está ejecutando."]):::error
  n21 -->|"sí"| n22
  n23{"binding.permissionEffectConceptId === CONCEPTS.AUTO_PERMISSION_DENY"}:::decision
  n21 -->|"no"| n23
  n24(["422 PRECONDITION_FAILED El enlace deniega el uso de esa herramienta para esta versión."]):::error
  n23 -->|"sí"| n24
  n25{"binding.maxCallsPerRun !== undefined && binding.maxCallsPerRun !== null"}:::decision
  n23 -->|"no"| n25
  n26["Llama a AutomationRunsRepository.countToolCalls"]:::llamada
  n25 -->|"sí"| n26
  n27[("LEE automation.agent_run_steps")]:::efecto
  n26 --> n27
  n28{"used ›= binding.maxCallsPerRun"}:::decision
  n27 --> n28
  n29(["422 PRECONDITION_FAILED La herramienta agotó su tope de llamadas para esta ejecución."]):::error
  n28 -->|"sí"| n29
  n30["Llama a AutomationGovernanceRepository.findEnabledGuardrailsByAgent"]:::llamada
  n28 -->|"no"| n30
  n25 -->|"no"| n30
  n14 -->|"no"| n30
  n31[("LEE automation.agent_guardrails")]:::efecto
  n30 --> n31
  n32["Repite: por cada const attachment de attachments"]:::bucle
  n31 --> n32
  n33["Llama a AutomationGovernanceRepository.findGuardrailPolicyById"]:::llamada
  n32 -->|"cada elemento"| n33
  n34[("LEE automation.guardrail_policies")]:::efecto
  n33 --> n34
  n35["Llama a AutomationRunsRepository.findMaxSequenceNo"]:::llamada
  n34 --> n35
  n32 -->|"al terminar"| n35
  n36[("LEE automation.agent_run_steps")]:::efecto
  n35 --> n36
  n37["Llama a AutomationRunsRepository.createAgentRunStep"]:::llamada
  n36 --> n37
  n38[("CREA automation.agent_run_steps")]:::efecto
  n37 --> n38
  n39["Llama a OutboxService.publishDomainEvent"]:::llamada
  n38 --> n39
  n40["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n39 --> n40
  n41["Transacción: startActiveSpan(…)"]:::transaccion
  n40 --> n41
  n42["Intenta"]:::intento
  n41 --> n42
  n43(["↩ (relanza el error capturado)"]):::error
  n42 -->|"si falla"| n43
  n44["Llama a OutboxService.persistDomainEvent"]:::llamada
  n42 --> n44
  n45["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n44 --> n45
  n46[("LEE messaging.outbox_messages")]:::efecto
  n45 --> n46
  n47["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n46 --> n47
  n48[("CREA messaging.domain_events")]:::efecto
  n47 --> n48
  n49["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n48 --> n49
  n50[("CREA messaging.outbox_messages")]:::efecto
  n49 --> n50
  n51>"Evento AgentStepRecorded"]:::evento
  n50 --> n51
  n52["Llama a AutomationExecutionService.pauseForApproval"]:::llamada
  n51 --> n52
  n53["Llama a AutomationRunsRepository.createApproval"]:::llamada
  n52 --> n53
  n54[("CREA automation.automation_approvals")]:::efecto
  n53 --> n54
  n55[("ACTUALIZA automation.agent_runs")]:::efecto
  n54 --> n55
  n56{"agentRun.workflowRunId"}:::decision
  n55 --> n56
  n57["Llama a AutomationRunsRepository.findWorkflowRunForUpdate"]:::llamada
  n56 -->|"sí"| n57
  n58[("LEE automation.workflow_runs")]:::efecto
  n57 --> n58
  n59{"run && run.statusConceptId === CONCEPTS.AUTO_RUN_RUNNING"}:::decision
  n58 --> n59
  n60[("ACTUALIZA automation.workflow_runs")]:::efecto
  n59 -->|"sí"| n60
  n61["Llama a OutboxService.publishDomainEvent"]:::llamada
  n60 --> n61
  n59 -->|"no"| n61
  n56 -->|"no"| n61
  n62["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n61 --> n62
  n63["Transacción: startActiveSpan(…)"]:::transaccion
  n62 --> n63
  n64["Intenta"]:::intento
  n63 --> n64
  n65(["↩ (relanza el error capturado)"]):::error
  n64 -->|"si falla"| n65
  n66>"Evento ApprovalRequested"]:::evento
  n64 --> n66
  n67(("201 Responde con éxito")):::ok
  n66 --> n67
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /automation/agents

Registrar un agente con su primera versión

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un agente con ese código. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un agente que actúa necesita una identidad de servicio (`actsAsUserId`). |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AgentCatalogService.registerAgent"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AgentsRepository.findAgentByCode"]:::llamada
  n4 --> n5
  n6[("LEE automation.agents")]:::efecto
  n5 --> n6
  n7{"existing"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe un agente con ese código."]):::error
  n7 -->|"sí"| n8
  n9{"ACTING_AUTONOMY_LEVELS.includes(dto.autonomyLevelConceptId) && !dto.actsAsUserId"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED Un agente que actúa necesita una identidad de servicio (`actsAsUserId`)."]):::error
  n9 -->|"sí"| n10
  n11["Llama a AgentsRepository.createAgent"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA automation.agents")]:::efecto
  n11 --> n12
  n13["Llama a AgentsRepository.createAgentVersion"]:::llamada
  n12 --> n13
  n14[("CREA automation.agent_versions")]:::efecto
  n13 --> n14
  n15["Llama a OutboxService.publishDomainEvent"]:::llamada
  n14 --> n15
  n16["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n15 --> n16
  n17["Transacción: startActiveSpan(…)"]:::transaccion
  n16 --> n17
  n18["Intenta"]:::intento
  n17 --> n18
  n19(["↩ (relanza el error capturado)"]):::error
  n18 -->|"si falla"| n19
  n20["Llama a OutboxService.persistDomainEvent"]:::llamada
  n18 --> n20
  n21["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n20 --> n21
  n22[("LEE messaging.outbox_messages")]:::efecto
  n21 --> n22
  n23["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n22 --> n23
  n24[("CREA messaging.domain_events")]:::efecto
  n23 --> n24
  n25["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n24 --> n25
  n26[("CREA messaging.outbox_messages")]:::efecto
  n25 --> n26
  n27>"Evento AgentRegistered"]:::evento
  n26 --> n27
  n28(("201 Responde con éxito")):::ok
  n27 --> n28
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. POST /automation/agents/{id}/guardrails

Adjuntar una política de guardrail a un agente

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

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AgentCatalogService.attachGuardrail"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AgentsRepository.findAgentForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE automation.agents")]:::efecto
  n5 --> n6
  n7{"!agent"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Agente no encontrado."]):::error
  n7 -->|"sí"| n8
  n9["Llama a AutomationGovernanceRepository.findGuardrailPolicyById"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE automation.guardrail_policies")]:::efecto
  n9 --> n10
  n11{"!policy"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Política de guardrail no encontrada."]):::error
  n11 -->|"sí"| n12
  n13{"!policy.isActive"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED La política de guardrail no está activa."]):::error
  n13 -->|"sí"| n14
  n15["Llama a AutomationGovernanceRepository.findAgentGuardrail"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE automation.agent_guardrails")]:::efecto
  n15 --> n16
  n17{"duplicate"}:::decision
  n16 --> n17
  n18(["409 CONFLICT La política ya está adjunta a este agente."]):::error
  n17 -->|"sí"| n18
  n19["Llama a AutomationGovernanceRepository.createAgentGuardrail"]:::llamada
  n17 -->|"no"| n19
  n20[("CREA automation.agent_guardrails")]:::efecto
  n19 --> n20
  n21["Llama a OutboxService.publishDomainEvent"]:::llamada
  n20 --> n21
  n22["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n21 --> n22
  n23["Transacción: startActiveSpan(…)"]:::transaccion
  n22 --> n23
  n24["Intenta"]:::intento
  n23 --> n24
  n25(["↩ (relanza el error capturado)"]):::error
  n24 -->|"si falla"| n25
  n26["Llama a OutboxService.persistDomainEvent"]:::llamada
  n24 --> n26
  n27["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n26 --> n27
  n28[("LEE messaging.outbox_messages")]:::efecto
  n27 --> n28
  n29["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n28 --> n29
  n30[("CREA messaging.domain_events")]:::efecto
  n29 --> n30
  n31["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n30 --> n31
  n32[("CREA messaging.outbox_messages")]:::efecto
  n31 --> n32
  n33>"Evento GuardrailAttached"]:::evento
  n32 --> n33
  n34(("201 Responde con éxito")):::ok
  n33 --> n34
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /automation/agents/{id}/memory

Persistir memoria del agente

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Agente no encontrado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Fuera del ámbito global la memoria tiene que declarar a qué se refiere. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AgentCatalogService.upsertMemory"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AgentsRepository.findAgentById"]:::llamada
  n4 --> n5
  n6[("LEE automation.agents")]:::efecto
  n5 --> n6
  n7{"!agent"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Agente no encontrado."]):::error
  n7 -->|"sí"| n8
  n9{"dto.scopeConceptId !== CONCEPTS.AUTO_MEMORY_SCOPE_GLOBAL && !dto.scopeRefId"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED Fuera del ámbito global la memoria tiene que declarar a qué se refiere."]):::error
  n9 -->|"sí"| n10
  n11["Llama a AgentsRepository.findMemoryForUpdate"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE automation.agent_memory")]:::efecto
  n11 --> n12
  n13{"existing"}:::decision
  n12 --> n13
  n14[("ACTUALIZA automation.agent_memory · ACTUALIZA automation.agent_memory · ACTUALIZA automation.agent_memory · A…")]:::efecto
  n13 -->|"sí"| n14
  n15["Llama a AgentCatalogService.publishMemoryEvent"]:::llamada
  n14 --> n15
  n16["Llama a OutboxService.publishDomainEvent"]:::llamada
  n15 --> n16
  n17["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n16 --> n17
  n18["Transacción: startActiveSpan(…)"]:::transaccion
  n17 --> n18
  n19["Intenta"]:::intento
  n18 --> n19
  n20(["↩ (relanza el error capturado)"]):::error
  n19 -->|"si falla"| n20
  n21>"Evento AgentMemoryUpserted"]:::evento
  n19 --> n21
  n22["Llama a AgentsRepository.createMemory"]:::llamada
  n21 --> n22
  n13 -->|"no"| n22
  n23[("CREA automation.agent_memory")]:::efecto
  n22 --> n23
  n24["Llama a AgentCatalogService.publishMemoryEvent"]:::llamada
  n23 --> n24
  n25["Llama a OutboxService.publishDomainEvent"]:::llamada
  n24 --> n25
  n26["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n25 --> n26
  n27["Transacción: startActiveSpan(…)"]:::transaccion
  n26 --> n27
  n28["Intenta"]:::intento
  n27 --> n28
  n29(["↩ (relanza el error capturado)"]):::error
  n28 -->|"si falla"| n29
  n30>"Evento AgentMemoryUpserted"]:::evento
  n28 --> n30
  n31(("200 Responde con éxito")):::ok
  n30 --> n31
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /automation/agents/{id}/versions/{versionId}/tool-bindings

Enlazar herramientas a una versión del agente

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

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AgentCatalogService.bindTools"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AgentsRepository.findVersionById"]:::llamada
  n4 --> n5
  n6[("LEE automation.agent_versions")]:::efecto
  n5 --> n6
  n7{"!version || version.agentId !== agentId"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND La versión no existe para ese agente."]):::error
  n7 -->|"sí"| n8
  n9["Repite: por cada const binding de dto.bindings"]:::bucle
  n7 -->|"no"| n9
  n10{"seen.has(binding.agentToolId)"}:::decision
  n9 -->|"cada elemento"| n10
  n11(["409 CONFLICT La misma herramienta viene dos veces en el lote."]):::error
  n10 -->|"sí"| n11
  n12["Llama a AgentsRepository.findToolById"]:::llamada
  n10 -->|"no"| n12
  n13[("LEE automation.agent_tools")]:::efecto
  n12 --> n13
  n14{"!tool"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Herramienta no encontrada."]):::error
  n14 -->|"sí"| n15
  n16{"tool.stateConceptId !== CONCEPTS.AUTO_TOOL_ACTIVE"}:::decision
  n14 -->|"no"| n16
  n17(["422 PRECONDITION_FAILED La herramienta no está activa."]):::error
  n16 -->|"sí"| n17
  n18["Llama a AgentsRepository.findBinding"]:::llamada
  n16 -->|"no"| n18
  n19[("LEE automation.agent_tool_bindings")]:::efecto
  n18 --> n19
  n20{"duplicate"}:::decision
  n19 --> n20
  n21(["409 CONFLICT La herramienta ya está enlazada a esta versión."]):::error
  n20 -->|"sí"| n21
  n22["Llama a AgentsRepository.createBinding"]:::llamada
  n20 -->|"no"| n22
  n23[("CREA automation.agent_tool_bindings")]:::efecto
  n22 --> n23
  n24["Llama a OutboxService.publishDomainEvent"]:::llamada
  n23 --> n24
  n9 -->|"al terminar"| n24
  n25["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n24 --> n25
  n26["Transacción: startActiveSpan(…)"]:::transaccion
  n25 --> n26
  n27["Intenta"]:::intento
  n26 --> n27
  n28(["↩ (relanza el error capturado)"]):::error
  n27 -->|"si falla"| n28
  n29["Llama a OutboxService.persistDomainEvent"]:::llamada
  n27 --> n29
  n30["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n29 --> n30
  n31[("LEE messaging.outbox_messages")]:::efecto
  n30 --> n31
  n32["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n31 --> n32
  n33[("CREA messaging.domain_events")]:::efecto
  n32 --> n33
  n34["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n33 --> n34
  n35[("CREA messaging.outbox_messages")]:::efecto
  n34 --> n35
  n36>"Evento AgentToolBound"]:::evento
  n35 --> n36
  n37(("201 Responde con éxito")):::ok
  n36 --> n37
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /automation/agents/{id}/versions/publish

Publicar una versión del agente

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Agente no encontrado.; ResourceNotFoundException: La versión no existe para ese agente. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión ya no está en borrador.; PreconditionFailedException: Para crear una versión nueva hace falta su plantilla de prompt. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AgentCatalogService.publishAgentVersion"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AgentsRepository.findAgentForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE automation.agents")]:::efecto
  n5 --> n6
  n7{"!agent"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Agente no encontrado."]):::error
  n7 -->|"sí"| n8
  n9{"dto.agentVersionId"}:::decision
  n7 -->|"no"| n9
  n10["Llama a AgentsRepository.findVersionById"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE automation.agent_versions")]:::efecto
  n10 --> n11
  n12{"!version || version.agentId !== agentId"}:::decision
  n11 --> n12
  n13(["404 NOT_FOUND La versión no existe para ese agente."]):::error
  n12 -->|"sí"| n13
  n14{"version.statusConceptId !== CONCEPTS.AUTO_VERSION_DRAFT"}:::decision
  n12 -->|"no"| n14
  n15(["422 PRECONDITION_FAILED La versión ya no está en borrador."]):::error
  n14 -->|"sí"| n15
  n16{"!dto.promptTemplate"}:::decision
  n9 -->|"no"| n16
  n17(["422 PRECONDITION_FAILED Para crear una versión nueva hace falta su plantilla de prompt."]):::error
  n16 -->|"sí"| n17
  n18["Llama a AgentsRepository.findMaxVersion"]:::llamada
  n16 -->|"no"| n18
  n19[("LEE automation.agent_versions")]:::efecto
  n18 --> n19
  n20["Llama a AgentsRepository.createAgentVersion"]:::llamada
  n19 --> n20
  n21[("CREA automation.agent_versions")]:::efecto
  n20 --> n21
  n22[("ACTUALIZA automation.agents")]:::efecto
  n14 -->|"no"| n22
  n21 --> n22
  n23{"agent.stateConceptId === CONCEPTS.AUTO_AGENT_DRAFT"}:::decision
  n22 --> n23
  n24[("ACTUALIZA automation.agents")]:::efecto
  n23 -->|"sí"| n24
  n25["Llama a OutboxService.publishDomainEvent"]:::llamada
  n24 --> n25
  n23 -->|"no"| n25
  n26["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n25 --> n26
  n27["Transacción: startActiveSpan(…)"]:::transaccion
  n26 --> n27
  n28["Intenta"]:::intento
  n27 --> n28
  n29(["↩ (relanza el error capturado)"]):::error
  n28 -->|"si falla"| n29
  n30["Llama a OutboxService.persistDomainEvent"]:::llamada
  n28 --> n30
  n31["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n30 --> n31
  n32[("LEE messaging.outbox_messages")]:::efecto
  n31 --> n32
  n33["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n32 --> n33
  n34[("CREA messaging.domain_events")]:::efecto
  n33 --> n34
  n35["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n34 --> n35
  n36[("CREA messaging.outbox_messages")]:::efecto
  n35 --> n36
  n37>"Evento AgentVersionPublished"]:::evento
  n36 --> n37
  n38(("201 Responde con éxito")):::ok
  n37 --> n38
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /automation/approvals/{id}/decide

Decidir la aprobación y reanudar o abortar el run

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

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AutomationExecutionService.decideApproval"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AutomationRunsRepository.findApprovalForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE automation.automation_approvals")]:::efecto
  n5 --> n6
  n7{"!approval"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Aprobación no encontrada."]):::error
  n7 -->|"sí"| n8
  n9{"approval.statusConceptId !== CONCEPTS.AUTO_APPROVAL_PENDING"}:::decision
  n7 -->|"no"| n9
  n10(["409 CONFLICT La aprobación ya está decidida."]):::error
  n9 -->|"sí"| n10
  n11["Llama a AutomationRunsRepository.findAgentRunForUpdate"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE automation.agent_runs")]:::efecto
  n11 --> n12
  n13{"!agentRun"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Ejecución de agente no encontrada."]):::error
  n13 -->|"sí"| n14
  n15{"agentRun.statusConceptId !== CONCEPTS.AUTO_AGENT_RUN_PAUSED"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED La ejecución del agente no está en pausa."]):::error
  n15 -->|"sí"| n16
  n17[("ACTUALIZA automation.automation_approvals · ACTUALIZA automation.automation_approvals · ACTUALIZA automation.…")]:::efecto
  n15 -->|"no"| n17
  n18{"!approved"}:::decision
  n17 --> n18
  n19[("ACTUALIZA automation.agent_runs")]:::efecto
  n18 -->|"sí"| n19
  n20["Llama a AutomationRunsRepository.findMaxSequenceNo"]:::llamada
  n19 --> n20
  n18 -->|"no"| n20
  n21[("LEE automation.agent_run_steps")]:::efecto
  n20 --> n21
  n22["Llama a AutomationRunsRepository.createAgentRunStep"]:::llamada
  n21 --> n22
  n23[("CREA automation.agent_run_steps")]:::efecto
  n22 --> n23
  n24{"agentRun.workflowRunId"}:::decision
  n23 --> n24
  n25["Llama a AutomationRunsRepository.findWorkflowRunForUpdate"]:::llamada
  n24 -->|"sí"| n25
  n26[("LEE automation.workflow_runs")]:::efecto
  n25 --> n26
  n27{"run && run.statusConceptId === CONCEPTS.AUTO_RUN_WAITING"}:::decision
  n26 --> n27
  n28[("ACTUALIZA automation.workflow_runs")]:::efecto
  n27 -->|"sí"| n28
  n29{"!approved"}:::decision
  n28 --> n29
  n30[("ACTUALIZA automation.workflow_runs · ACTUALIZA automation.workflow_runs")]:::efecto
  n29 -->|"sí"| n30
  n31["Llama a OutboxService.publishDomainEvent"]:::llamada
  n30 --> n31
  n29 -->|"no"| n31
  n27 -->|"no"| n31
  n24 -->|"no"| n31
  n32["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n31 --> n32
  n33["Transacción: startActiveSpan(…)"]:::transaccion
  n32 --> n33
  n34["Intenta"]:::intento
  n33 --> n34
  n35(["↩ (relanza el error capturado)"]):::error
  n34 -->|"si falla"| n35
  n36["Llama a OutboxService.persistDomainEvent"]:::llamada
  n34 --> n36
  n37["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n36 --> n37
  n38[("LEE messaging.outbox_messages")]:::efecto
  n37 --> n38
  n39["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n38 --> n39
  n40[("CREA messaging.domain_events")]:::efecto
  n39 --> n40
  n41["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n40 --> n41
  n42[("CREA messaging.outbox_messages")]:::efecto
  n41 --> n42
  n43>"Evento ApprovalDecided"]:::evento
  n42 --> n43
  n44(("200 Responde con éxito")):::ok
  n43 --> n44
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /automation/guardrails

Definir una política de guardrail

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una política de guardrail con ese código. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una política de coste tiene que declarar su tope.; PreconditionFailedException: Una política de datos de paciente tiene que declarar cómo se tratan. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AgentCatalogService.defineGuardrail"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AutomationGovernanceRepository.findGuardrailPolicyByCode"]:::llamada
  n4 --> n5
  n6[("LEE automation.guardrail_policies")]:::efecto
  n5 --> n6
  n7{"existing"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe una política de guardrail con ese código."]):::error
  n7 -->|"sí"| n8
  n9{"dto.policyTypeConceptId === CONCEPTS.AUTO_GUARDRAIL_COST && !dto.maxCostAmount"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED Una política de coste tiene que declarar su tope."]):::error
  n9 -->|"sí"| n10
  n11{"dto.policyTypeConceptId === CONCEPTS.AUTO_GUARDRAIL_PHI && !dto.piiPhiHandlingConceptId"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED Una política de datos de paciente tiene que declarar cómo se tratan."]):::error
  n11 -->|"sí"| n12
  n13["Llama a AutomationGovernanceRepository.createGuardrailPolicy"]:::llamada
  n11 -->|"no"| n13
  n14[("CREA automation.guardrail_policies")]:::efecto
  n13 --> n14
  n15(("201 Responde con éxito")):::ok
  n14 --> n15
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. POST /automation/runs/{workflowRunId}/agent-runs

Arrancar la ejecución de un agente dentro del run

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ejecución de workflow no encontrada.; ResourceNotFoundException: Agente no encontrado.; ResourceNotFoundException: La versión no existe para ese agente. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ejecución del workflow no está en marcha.; PreconditionFailedException: El agente no está activo.; PreconditionFailedException: Sólo se puede ejecutar una versión publicada del agente. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AutomationExecutionService.startAgentRun"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AutomationRunsRepository.findWorkflowRunById"]:::llamada
  n4 --> n5
  n6[("LEE automation.workflow_runs")]:::efecto
  n5 --> n6
  n7{"!run"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Ejecución de workflow no encontrada."]):::error
  n7 -->|"sí"| n8
  n9{"run.statusConceptId !== CONCEPTS.AUTO_RUN_RUNNING"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La ejecución del workflow no está en marcha."]):::error
  n9 -->|"sí"| n10
  n11["Llama a AgentsRepository.findAgentById"]:::llamada
  n9 -->|"no"| n11
  n12[("LEE automation.agents")]:::efecto
  n11 --> n12
  n13{"!agent"}:::decision
  n12 --> n13
  n14(["404 NOT_FOUND Agente no encontrado."]):::error
  n13 -->|"sí"| n14
  n15{"agent.stateConceptId !== CONCEPTS.AUTO_AGENT_ACTIVE"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED El agente no está activo."]):::error
  n15 -->|"sí"| n16
  n17["Llama a AgentsRepository.findVersionById"]:::llamada
  n15 -->|"no"| n17
  n18[("LEE automation.agent_versions")]:::efecto
  n17 --> n18
  n19["Llama a AgentsRepository.findVersion"]:::llamada
  n18 --> n19
  n20[("LEE automation.agent_versions")]:::efecto
  n19 --> n20
  n21{"!version || version.agentId !== agent.id"}:::decision
  n20 --> n21
  n22(["404 NOT_FOUND La versión no existe para ese agente."]):::error
  n21 -->|"sí"| n22
  n23{"version.statusConceptId !== CONCEPTS.AUTO_VERSION_PUBLISHED"}:::decision
  n21 -->|"no"| n23
  n24(["422 PRECONDITION_FAILED Sólo se puede ejecutar una versión publicada del agente."]):::error
  n23 -->|"sí"| n24
  n25["Llama a AutomationRunsRepository.createAgentRun"]:::llamada
  n23 -->|"no"| n25
  n26[("CREA automation.agent_runs")]:::efecto
  n25 --> n26
  n27(("201 Responde con éxito")):::ok
  n26 --> n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /automation/runs/{workflowRunId}/finalize

Cerrar la ejecución con el resumen de coste

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Ejecución de workflow no encontrada. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ejecución tiene aprobaciones pendientes y no puede cerrarse. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AutomationExecutionService.finalizeWorkflowRun"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AutomationRunsRepository.findWorkflowRunForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE automation.workflow_runs")]:::efecto
  n5 --> n6
  n7{"!run"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Ejecución de workflow no encontrada."]):::error
  n7 -->|"sí"| n8
  n9["Llama a AutomationRunsRepository.findAgentRunsByWorkflowRunForUpdate"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE automation.agent_runs")]:::efecto
  n9 --> n10
  n11["Llama a AutomationRunsRepository.findPendingApprovalsByAgentRuns"]:::llamada
  n10 --> n11
  n12[("LEE automation.automation_approvals")]:::efecto
  n11 --> n12
  n13{"pending.length › 0"}:::decision
  n12 --> n13
  n14(["422 PRECONDITION_FAILED La ejecución tiene aprobaciones pendientes y no puede cerrarse."]):::error
  n13 -->|"sí"| n14
  n15["Repite: por cada const agentRun de agentRuns"]:::bucle
  n13 -->|"no"| n15
  n16{"OPEN_AGENT_RUN_STATUSES.includes(agentRun.statusConceptId)"}:::decision
  n15 -->|"cada elemento"| n16
  n17[("ACTUALIZA automation.agent_runs · ACTUALIZA automation.agent_runs")]:::efecto
  n16 -->|"sí"| n17
  n18{"agentRun.startedAt"}:::decision
  n17 --> n18
  n19[("ACTUALIZA automation.agent_runs")]:::efecto
  n18 -->|"sí"| n19
  n20[("ACTUALIZA automation.workflow_runs · ACTUALIZA automation.workflow_runs · ACTUALIZA automation.workflow_runs…")]:::efecto
  n19 --> n20
  n18 -->|"no"| n20
  n16 -->|"no"| n20
  n15 -->|"al terminar"| n20
  n21{"dto.errorText"}:::decision
  n20 --> n21
  n22[("ACTUALIZA automation.workflow_runs")]:::efecto
  n21 -->|"sí"| n22
  n23["Llama a OutboxService.publishDomainEvent"]:::llamada
  n22 --> n23
  n21 -->|"no"| n23
  n24["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n23 --> n24
  n25["Transacción: startActiveSpan(…)"]:::transaccion
  n24 --> n25
  n26["Intenta"]:::intento
  n25 --> n26
  n27(["↩ (relanza el error capturado)"]):::error
  n26 -->|"si falla"| n27
  n28["Llama a OutboxService.persistDomainEvent"]:::llamada
  n26 --> n28
  n29["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n28 --> n29
  n30[("LEE messaging.outbox_messages")]:::efecto
  n29 --> n30
  n31["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n30 --> n31
  n32[("CREA messaging.domain_events")]:::efecto
  n31 --> n32
  n33["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n32 --> n33
  n34[("CREA messaging.outbox_messages")]:::efecto
  n33 --> n34
  n35>"Evento WorkflowRunCompleted"]:::evento
  n34 --> n35
  n36(("200 Responde con éxito")):::ok
  n35 --> n36
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /automation/tools

Registrar una herramienta de agente

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una herramienta con ese código. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una herramienta de llamada HTTP necesita un endpoint de integración. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AgentCatalogService.registerTool"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AgentsRepository.findToolByCode"]:::llamada
  n4 --> n5
  n6[("LEE automation.agent_tools")]:::efecto
  n5 --> n6
  n7{"existing"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe una herramienta con ese código."]):::error
  n7 -->|"sí"| n8
  n9{"dto.toolTypeConceptId === CONCEPTS.AUTO_TOOL_TYPE_HTTP_CALL && !dto.integrationEndpointId"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED Una herramienta de llamada HTTP necesita un endpoint de integración."]):::error
  n9 -->|"sí"| n10
  n11["Llama a AgentsRepository.createTool"]:::llamada
  n9 -->|"no"| n11
  n12[("CREA automation.agent_tools")]:::efecto
  n11 --> n12
  n13["Llama a OutboxService.publishDomainEvent"]:::llamada
  n12 --> n13
  n14["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n13 --> n14
  n15["Transacción: startActiveSpan(…)"]:::transaccion
  n14 --> n15
  n16["Intenta"]:::intento
  n15 --> n16
  n17(["↩ (relanza el error capturado)"]):::error
  n16 -->|"si falla"| n17
  n18["Llama a OutboxService.persistDomainEvent"]:::llamada
  n16 --> n18
  n19["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n18 --> n19
  n20[("LEE messaging.outbox_messages")]:::efecto
  n19 --> n20
  n21["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n20 --> n21
  n22[("CREA messaging.domain_events")]:::efecto
  n21 --> n22
  n23["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n22 --> n23
  n24[("CREA messaging.outbox_messages")]:::efecto
  n23 --> n24
  n25>"Evento AgentToolRegistered"]:::evento
  n24 --> n25
  n26(("201 Responde con éxito")):::ok
  n25 --> n26
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. POST /automation/triggers

Configurar un disparador de automatización

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

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AutomationDefinitionService.configureTrigger"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AutomationGovernanceRepository.findTriggerByCode"]:::llamada
  n4 --> n5
  n6[("LEE automation.automation_triggers")]:::efecto
  n5 --> n6
  n7{"existing"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe un disparador con ese código."]):::error
  n7 -->|"sí"| n8
  n9["Llama a AutomationGovernanceRepository.findWorkflowById"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE automation.workflows")]:::efecto
  n9 --> n10
  n11{"!workflow"}:::decision
  n10 --> n11
  n12(["404 NOT_FOUND Workflow no encontrado."]):::error
  n11 -->|"sí"| n12
  n13{"workflow.stateConceptId === CONCEPTS.AUTO_WORKFLOW_ARCHIVED"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED No se puede disparar un workflow archivado."]):::error
  n13 -->|"sí"| n14
  n15{"dto.triggerTypeConceptId === CONCEPTS.AUTO_TRIGGER_TYPE_EVENT && !dto.eventType"}:::decision
  n13 -->|"no"| n15
  n16(["422 PRECONDITION_FAILED Un disparador por evento tiene que declarar qué evento suscribe."]):::error
  n15 -->|"sí"| n16
  n17{"dto.triggerTypeConceptId === CONCEPTS.AUTO_TRIGGER_TYPE_SCHEDULE"}:::decision
  n15 -->|"no"| n17
  n18{"!dto.scheduleCron"}:::decision
  n17 -->|"sí"| n18
  n19(["422 PRECONDITION_FAILED Un disparador por calendario tiene que declarar su cron."]):::error
  n18 -->|"sí"| n19
  n20["Llama a AutomationDefinitionService.assertCron"]:::llamada
  n18 -->|"no"| n20
  n21{"fields.length !== CRON_FIELD_COUNT"}:::decision
  n20 --> n21
  n22(["422 PRECONDITION_FAILED La expresión cron tiene que tener cinco campos."]):::error
  n21 -->|"sí"| n22
  n23["Llama a AutomationGovernanceRepository.createTrigger"]:::llamada
  n21 -->|"no"| n23
  n17 -->|"no"| n23
  n24[("CREA automation.automation_triggers")]:::efecto
  n23 --> n24
  n25["Llama a OutboxService.publishDomainEvent"]:::llamada
  n24 --> n25
  n26["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n25 --> n26
  n27["Transacción: startActiveSpan(…)"]:::transaccion
  n26 --> n27
  n28["Intenta"]:::intento
  n27 --> n28
  n29(["↩ (relanza el error capturado)"]):::error
  n28 -->|"si falla"| n29
  n30["Llama a OutboxService.persistDomainEvent"]:::llamada
  n28 --> n30
  n31["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n30 --> n31
  n32[("LEE messaging.outbox_messages")]:::efecto
  n31 --> n32
  n33["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n32 --> n33
  n34[("CREA messaging.domain_events")]:::efecto
  n33 --> n34
  n35["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n34 --> n35
  n36[("CREA messaging.outbox_messages")]:::efecto
  n35 --> n36
  n37>"Evento TriggerRegistered"]:::evento
  n36 --> n37
  n38(("201 Responde con éxito")):::ok
  n37 --> n38
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 15. POST /automation/triggers/calendar/tick

Evaluar los disparadores de calendario vencidos

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AutomationExecutionService.evaluateCalendarTriggers"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AutomationGovernanceRepository.findEnabledCalendarTriggers"]:::llamada
  n4 --> n5
  n6[("LEE automation.automation_triggers")]:::efecto
  n5 --> n6
  n7["Repite: por cada const trigger de candidates"]:::bucle
  n6 --> n7
  n8["Llama a AutomationGovernanceRepository.findWorkflowById"]:::llamada
  n7 -->|"cada elemento"| n8
  n9[("LEE automation.workflows")]:::efecto
  n8 --> n9
  n10["Llama a AutomationRunsRepository.countRunsByWorkflow"]:::llamada
  n9 --> n10
  n11[("LEE automation.workflow_runs")]:::efecto
  n10 --> n11
  n12["Llama a AutomationRunsRepository.createWorkflowRun"]:::llamada
  n11 --> n12
  n13[("CREA automation.workflow_runs")]:::efecto
  n12 --> n13
  n14["Llama a OutboxService.publishDomainEvent"]:::llamada
  n13 --> n14
  n15["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n14 --> n15
  n16["Transacción: startActiveSpan(…)"]:::transaccion
  n15 --> n16
  n17["Intenta"]:::intento
  n16 --> n17
  n18(["↩ (relanza el error capturado)"]):::error
  n17 -->|"si falla"| n18
  n19["Llama a OutboxService.persistDomainEvent"]:::llamada
  n17 --> n19
  n20["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n19 --> n20
  n21[("LEE messaging.outbox_messages")]:::efecto
  n20 --> n21
  n22["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n21 --> n22
  n23[("CREA messaging.domain_events")]:::efecto
  n22 --> n23
  n24["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n23 --> n24
  n25[("CREA messaging.outbox_messages")]:::efecto
  n24 --> n25
  n26>"Evento WorkflowRunStarted"]:::evento
  n25 --> n26
  n27(("200 Responde con éxito")):::ok
  n26 --> n27
  n7 -->|"al terminar"| n27
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 16. POST /automation/workflows

Definir un workflow con sus pasos

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

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a AutomationDefinitionService.defineWorkflow"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AutomationGovernanceRepository.findWorkflowByCode"]:::llamada
  n4 --> n5
  n6[("LEE automation.workflows")]:::efecto
  n5 --> n6
  n7{"existing"}:::decision
  n6 --> n7
  n8(["409 CONFLICT Ya existe un workflow de automatización con ese código."]):::error
  n7 -->|"sí"| n8
  n9["Repite: por cada const step de dto.steps"]:::bucle
  n7 -->|"no"| n9
  n10{"stepCodes.has(step.stepCode)"}:::decision
  n9 -->|"cada elemento"| n10
  n11(["409 CONFLICT Dos pasos comparten el mismo código."]):::error
  n10 -->|"sí"| n11
  n12["Repite: por cada const step de dto.steps"]:::bucle
  n10 -->|"no"| n12
  n9 -->|"al terminar"| n12
  n13["Repite: por cada const target de [step.onSuccessStepCode, step.onFailureStepCode]"]:::bucle
  n12 -->|"cada elemento"| n13
  n14{"target && !stepCodes.has(target)"}:::decision
  n13 -->|"cada elemento"| n14
  n15(["422 PRECONDITION_FAILED Un paso salta a otro que no está declarado en el workflow."]):::error
  n14 -->|"sí"| n15
  n16{"step.stepTypeConceptId === CONCEPTS.AUTO_STEP_AGENT_CALL && !step.agentId"}:::decision
  n14 -->|"no"| n16
  n13 -->|"al terminar"| n16
  n17(["422 PRECONDITION_FAILED Un paso de llamada a agente tiene que declarar qué agente llama."]):::error
  n16 -->|"sí"| n17
  n18{"step.stepTypeConceptId === CONCEPTS.AUTO_STEP_TOOL_CALL && !step.agentToolId"}:::decision
  n16 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED Un paso de llamada a herramienta tiene que declarar qué herramienta usa."]):::error
  n18 -->|"sí"| n19
  n20{"step.agentId"}:::decision
  n18 -->|"no"| n20
  n21["Llama a AgentsRepository.findAgentById"]:::llamada
  n20 -->|"sí"| n21
  n22[("LEE automation.agents")]:::efecto
  n21 --> n22
  n23{"!agent"}:::decision
  n22 --> n23
  n24(["404 NOT_FOUND Agente referenciado por un paso no encontrado."]):::error
  n23 -->|"sí"| n24
  n25{"step.agentToolId"}:::decision
  n23 -->|"no"| n25
  n20 -->|"no"| n25
  n26["Llama a AgentsRepository.findToolById"]:::llamada
  n25 -->|"sí"| n26
  n27[("LEE automation.agent_tools")]:::efecto
  n26 --> n27
  n28{"!tool"}:::decision
  n27 --> n28
  n29(["404 NOT_FOUND Herramienta referenciada por un paso no encontrada."]):::error
  n28 -->|"sí"| n29
  n30["Llama a AutomationGovernanceRepository.createWorkflow"]:::llamada
  n28 -->|"no"| n30
  n25 -->|"no"| n30
  n12 -->|"al terminar"| n30
  n31[("CREA automation.workflows")]:::efecto
  n30 --> n31
  n32["Repite: map(…)"]:::bucle
  n31 --> n32
  n33["Llama a AutomationGovernanceRepository.createWorkflowStep"]:::llamada
  n32 -->|"cada elemento"| n33
  n34[("CREA automation.workflow_steps")]:::efecto
  n33 --> n34
  n35["Repite: por cada const { dto: step, row } de created"]:::bucle
  n34 --> n35
  n32 -->|"al terminar"| n35
  n36{"step.onSuccessStepCode"}:::decision
  n35 -->|"cada elemento"| n36
  n37[("ACTUALIZA automation.workflow_steps")]:::efecto
  n36 -->|"sí"| n37
  n38{"step.onFailureStepCode"}:::decision
  n37 --> n38
  n36 -->|"no"| n38
  n39[("ACTUALIZA automation.workflow_steps")]:::efecto
  n38 -->|"sí"| n39
  n40["Llama a OutboxService.publishDomainEvent"]:::llamada
  n39 --> n40
  n38 -->|"no"| n40
  n35 -->|"al terminar"| n40
  n41["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n40 --> n41
  n42["Transacción: startActiveSpan(…)"]:::transaccion
  n41 --> n42
  n43["Intenta"]:::intento
  n42 --> n43
  n44(["↩ (relanza el error capturado)"]):::error
  n43 -->|"si falla"| n44
  n45["Llama a OutboxService.persistDomainEvent"]:::llamada
  n43 --> n45
  n46["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n45 --> n46
  n47[("LEE messaging.outbox_messages")]:::efecto
  n46 --> n47
  n48["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n47 --> n48
  n49[("CREA messaging.domain_events")]:::efecto
  n48 --> n49
  n50["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n49 --> n50
  n51[("CREA messaging.outbox_messages")]:::efecto
  n50 --> n51
  n52>"Evento WorkflowDefined"]:::evento
  n51 --> n52
  n53(("201 Responde con éxito")):::ok
  n52 --> n53
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 17. POST /automation/workflows/{id}/runs

Arrancar la ejecución de un workflow

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Workflow no encontrado.; ResourceNotFoundException: Disparador no encontrado. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El workflow está archivado.; PreconditionFailedException: El disparador está deshabilitado.; PreconditionFailedException: El disparador no pertenece a ese workflow. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a AutomationExecutionService.startWorkflowRun"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a AutomationGovernanceRepository.findWorkflowById"]:::llamada
  n4 --> n5
  n6[("LEE automation.workflows")]:::efecto
  n5 --> n6
  n7{"!workflow"}:::decision
  n6 --> n7
  n8(["404 NOT_FOUND Workflow no encontrado."]):::error
  n7 -->|"sí"| n8
  n9{"workflow.stateConceptId === CONCEPTS.AUTO_WORKFLOW_ARCHIVED"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED El workflow está archivado."]):::error
  n9 -->|"sí"| n10
  n11{"dto.triggerId"}:::decision
  n9 -->|"no"| n11
  n12["Llama a AutomationGovernanceRepository.findTriggerById"]:::llamada
  n11 -->|"sí"| n12
  n13[("LEE automation.automation_triggers")]:::efecto
  n12 --> n13
  n14{"!trigger"}:::decision
  n13 --> n14
  n15(["404 NOT_FOUND Disparador no encontrado."]):::error
  n14 -->|"sí"| n15
  n16{"trigger.isEnabled !== true"}:::decision
  n14 -->|"no"| n16
  n17(["422 PRECONDITION_FAILED El disparador está deshabilitado."]):::error
  n16 -->|"sí"| n17
  n18{"trigger.workflowId !== workflowId"}:::decision
  n16 -->|"no"| n18
  n19(["422 PRECONDITION_FAILED El disparador no pertenece a ese workflow."]):::error
  n18 -->|"sí"| n19
  n20{"dto.contextRefId"}:::decision
  n18 -->|"no"| n20
  n11 -->|"no"| n20
  n21["Llama a AutomationRunsRepository.findLiveRunByContext"]:::llamada
  n20 -->|"sí"| n21
  n22[("LEE automation.workflow_runs")]:::efecto
  n21 --> n22
  n23["Llama a AutomationRunsRepository.countRunsByWorkflow"]:::llamada
  n22 --> n23
  n20 -->|"no"| n23
  n24[("LEE automation.workflow_runs")]:::efecto
  n23 --> n24
  n25["Llama a AutomationRunsRepository.createWorkflowRun"]:::llamada
  n24 --> n25
  n26[("CREA automation.workflow_runs")]:::efecto
  n25 --> n26
  n27["Llama a OutboxService.publishDomainEvent"]:::llamada
  n26 --> n27
  n28["Llama a MessagingTraceService.runInProducerSpan"]:::llamada
  n27 --> n28
  n29["Transacción: startActiveSpan(…)"]:::transaccion
  n28 --> n29
  n30["Intenta"]:::intento
  n29 --> n30
  n31(["↩ (relanza el error capturado)"]):::error
  n30 -->|"si falla"| n31
  n32["Llama a OutboxService.persistDomainEvent"]:::llamada
  n30 --> n32
  n33["Llama a OutboxRepository.findOutboxByIdempotencyKey"]:::llamada
  n32 --> n33
  n34[("LEE messaging.outbox_messages")]:::efecto
  n33 --> n34
  n35["Llama a OutboxRepository.createDomainEvent"]:::llamada
  n34 --> n35
  n36[("CREA messaging.domain_events")]:::efecto
  n35 --> n36
  n37["Llama a OutboxRepository.createOutboxMessage"]:::llamada
  n36 --> n37
  n38[("CREA messaging.outbox_messages")]:::efecto
  n37 --> n38
  n39>"Evento WorkflowRunStarted"]:::evento
  n38 --> n39
  n40(("201 Responde con éxito")):::ok
  n39 --> n40
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

