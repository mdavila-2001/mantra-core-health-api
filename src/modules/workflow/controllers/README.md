# Controladores — workflow

Tres controladores, 11 endpoints para 13 casos de uso. Todos delegan en un servicio y no contienen
lógica: el controlador resuelve la ruta y el rol, el servicio decide.

## `/workflow/state-machines` — `WorkflowDefinitionsController` (4)

| Método · ruta | UC | Código | Rol |
| --- | --- | --- | --- |
| `POST /workflow/state-machines` | 01 | 201 | `WORKFLOW_ARCHITECT`, `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN` |
| `POST /workflow/state-machines/:id/states` | 02 | 201 | ídem |
| `POST /workflow/state-machines/:id/transitions` | 03 | 201 | ídem |
| `POST /workflow/state-machines/:id/publish` | 04 | 200 | ídem |

## `/workflow/aggregates` — `WorkflowTransitionsController` (4)

| Método · ruta | UC | Código | Rol |
| --- | --- | --- | --- |
| `GET /workflow/aggregates/:aggregateId/transitions` | 11 | 200 | `AUDITOR`, `COMPLIANCE_OFFICER`, `CLINICIAN`, `PLATFORM_ADMIN` |
| `POST /workflow/aggregates/:aggregateId/transitions/:commandCode` | 05, 06 | 201 | `CLINICIAN`, `BILLING_AGENT`, `SCHEDULER`, `SYSTEM`, `PLATFORM_ADMIN` |
| `POST /workflow/aggregates/:aggregateId/transitions/:eventId/compensate` | 08 | 200 | `SYSTEM`, `SAGA_ORCHESTRATOR`, `PLATFORM_ADMIN` |
| `POST /workflow/aggregates/:aggregateId/transitions/:eventId/retry` | 09 | 200 | `SYSTEM`, `PLATFORM_ADMIN` |

El disparo es `201` porque crea un evento de transición; compensar y reintentar son `200` porque su
respuesta es el resultado de una operación sobre algo que ya existía.

`Idempotency-Key` entra por `@Headers('idempotency-key')` —Nest normaliza las cabeceras a
minúsculas— y está documentada con `@ApiHeader` como opcional, porque sólo es obligatoria si la
transición declara `idempotency_required`.

## `/workflow` — `WorkflowInstancesController` (3)

| Método · ruta | UC | Código | Rol |
| --- | --- | --- | --- |
| `POST /workflow/instances/sweep-timeouts` | 10 | 200 | `SYSTEM`, `PLATFORM_ADMIN` |
| `POST /workflow/instances` | 12 | 201 | `CLINICIAN`, `BILLING_AGENT`, `SCHEDULER`, `SYSTEM`, `PLATFORM_ADMIN` |
| `POST /workflow/tasks/:id/complete` | 13 | 200 | `CLINICIAN`, `BILLING_AGENT`, `SCHEDULER`, `PLATFORM_ADMIN` |

`sweep-timeouts` se declara **antes** que `instances` para que el segmento literal se resuelva antes
que cualquier ruta paramétrica que se añada después.

## Rutas planas

El caso de uso escribe `transitions:{command_code}`, `{event_id}:compensate`, `{event_id}:retry` e
`instances:sweep-timeouts`. Nest 11 monta sobre `path-to-regexp` v8, que trata `:` como inicio de
parámetro en **cualquier** posición del segmento: `{id}:retry` declararía un parámetro llamado
`id}:retry` y la ruta no montaría. Se publican como segmentos separados.

Las tres rutas de `/workflow/aggregates/:aggregateId/transitions/...` no colisionan: el disparo tiene
un segmento después de `transitions` y las otras dos tienen dos.

## Actor

Todas las rutas de escritura reciben `@CurrentUser()`. En este módulo el actor no es contexto de
auditoría opcional: `state_transition_events.actor_user_id` es `NOT NULL`, porque una transición sin
autor no se puede reconstruir después.

`GET .../transitions` es la única que no lo pide: no escribe nada.

## Pruebas

11 pruebas de delegación, una por endpoint, en `workflow-controllers.spec.ts`.
