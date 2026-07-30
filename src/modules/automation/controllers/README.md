# Controladores — automation

Dos controladores, 15 endpoints para 14 casos de uso. Todos delegan en un servicio y no contienen
lógica: el controlador resuelve la ruta y el rol, el servicio decide.

## `AgentCatalogController` (7)

| Método · ruta | UC | Código | Rol |
| --- | --- | --- | --- |
| `POST /automation/agents` | 01 | 201 | `AUTOMATION_ENGINEER`, `PLATFORM_ADMIN` |
| `POST /automation/agents/:id/versions/publish` | 02 | 201 | ídem |
| `POST /automation/tools` | 03 | 201 | ídem |
| `POST /automation/agents/:id/versions/:versionId/tool-bindings` | 04 | 201 | ídem |
| `POST /automation/guardrails` | 05 | 201 | `AI_GOVERNANCE_OFFICER`, `PLATFORM_ADMIN` |
| `POST /automation/agents/:id/guardrails` | 05 | 201 | ídem |
| `POST /automation/agents/:id/memory` | 12 | 200 | `SYSTEM`, `AGENT_RUNTIME`, `AUTOMATION_ENGINEER`, `PLATFORM_ADMIN` |

La memoria es `200` y no `201` porque es un upsert: puede haber creado o actualizado, y el cuerpo lo
dice en `updated`.

Los guardrails los define el responsable de gobierno de IA, no el ingeniero de automatización. Es la
separación que hace que quien construye el agente no sea quien decide qué no puede hacer.

## `AutomationOrchestrationController` (8)

| Método · ruta | UC | Código | Rol |
| --- | --- | --- | --- |
| `POST /automation/workflows` | 06 | 201 | `AUTOMATION_ENGINEER`, `PLATFORM_ADMIN` |
| `POST /automation/triggers` | 07 | 201 | ídem |
| `POST /automation/workflows/:id/runs` | 08 | 201 | `SYSTEM`, `AUTOMATION_ENGINEER`, `PLATFORM_ADMIN` |
| `POST /automation/runs/:workflowRunId/agent-runs` | 09 | 201 | `SYSTEM`, `AGENT_RUNTIME`, `PLATFORM_ADMIN` |
| `POST /automation/agent-runs/:id/steps` | 09, 10 | 201 | ídem |
| `POST /automation/agent-runs/:id/approvals` | 10 | 201 | ídem |
| `POST /automation/approvals/:id/decide` | 11 | 200 | `CLINICAL_APPROVER`, `OPERATIONAL_APPROVER`, `PLATFORM_ADMIN` |
| `POST /automation/agent-runs/:id/record-automations/:recordAutomationId/execute` | 13 | 201 | `SYSTEM`, `AGENT_RUNTIME`, `PLATFORM_ADMIN` |
| `POST /automation/runs/:workflowRunId/finalize` | 14 | 200 | `SYSTEM`, `PLATFORM_ADMIN` |

`201` en todo lo que crea una fila. `200` en decidir y cerrar: las dos mutan algo que ya existía.

**Quien aprueba no puede ejecutar.** `CLINICAL_APPROVER` y `OPERATIONAL_APPROVER` sólo aparecen en
`/approvals/:id/decide`, y ni `SYSTEM` ni `AGENT_RUNTIME` aparecen ahí. Si el runtime pudiera aprobar
sus propias solicitudes, el guardrail no detendría nada.

## Rutas planas

El caso de uso escribe `versions:publish`, `{id}:decide` y `{workflow_run_id}:finalize`. Nest 11
monta sobre `path-to-regexp` v8, que trata `:` como inicio de parámetro en **cualquier** posición del
segmento: `{id}:decide` declararía un parámetro llamado `id}:decide` y la ruta no montaría. Se
publican como segmentos separados.

## Dos controladores, un mismo prefijo

Los dos cuelgan de `@Controller('automation')`. Nest los monta sin conflicto porque ninguna ruta se
repite, y la separación es por responsabilidad: el catálogo lo escriben personas configurando el
sistema; la orquestación la escribe casi toda el runtime.

## Actor

Todas las rutas reciben `@CurrentUser()`. En la ejecución el actor autenticado **no** es
necesariamente quien queda registrado: los pasos y las escrituras se atribuyen a `acts_as_user_id`
del agente. La excepción es la decisión de la aprobación, que se atribuye a la persona: es el único
punto donde el sentido de la operación es que la tomó un humano.

## Pruebas

16 pruebas de delegación en `automation-controllers.spec.ts`.
