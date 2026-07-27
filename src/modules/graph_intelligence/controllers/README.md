# Controladores — graph_intelligence

Dos controladores, 15 endpoints para 12 casos de uso. Todos delegan en un servicio y no contienen
lógica.

## `GraphProjectionController` (6) — escribe el grafo

| Método · ruta | UC | Código | Rol |
| --- | --- | --- | --- |
| `POST /graph/projections/nodes/upsert` | 01 | 200 | `SYSTEM`, `GRAPH_PROJECTION_WORKER`, `PLATFORM_ADMIN` |
| `POST /graph/projections/edges/upsert` | 02 | 200 | ídem |
| `POST /graph/projections/reconcile` | 12 | 200 | ídem |
| `POST /graph/projection-definitions/:id/runs` | 03 | 201 | `SYSTEM`, `GRAPH_ANALYST`, `PLATFORM_ADMIN` |
| `POST /graph/projection-runs/:id/advance` | 03 | 200 | `SYSTEM`, `GRAPH_PROJECTION_WORKER`, `PLATFORM_ADMIN` |
| `POST /graph/edges/:id/expire` | 10 | 200 | ídem |

Los tres `upsert`/`reconcile` son `200` y no `201` a propósito: son idempotentes y pueden no crear
nada. Sólo abrir una corrida es `201`, que es la única que siempre crea una fila.

## `GraphQueryController` (9) — gobierna, consulta y explota

| Método · ruta | UC | Código | Rol |
| --- | --- | --- | --- |
| `POST /graph/access-scopes` | 04 | 201 | `DATA_GOVERNANCE_ADMIN`, `COMPLIANCE_OFFICER`, `PLATFORM_ADMIN` |
| `PATCH /graph/access-scopes/:id` | 04 | 200 | ídem |
| `POST /graph/traverse` | 05 | 200 | `GRAPH_ANALYST`, `API_CONSUMER`, `COMPLIANCE_OFFICER`, `PLATFORM_ADMIN` |
| `POST /graph/paths` | 05 | 200 | ídem |
| `POST /graph/analytics/community-detection` | 06 | 201 | `SYSTEM`, `GRAPH_ANALYTICS_WORKER`, `PLATFORM_ADMIN` |
| `POST /graph/analytics/risk-scoring` | 07 | 201 | ídem |
| `POST /graph/rules/:id/evaluate` | 08 | 201 | `SYSTEM`, `GRAPH_ANALYTICS_WORKER`, `COMPLIANCE_OFFICER`, `PLATFORM_ADMIN` |
| `PATCH /graph/rule-hits/:id` | 09 | 200 | `COMPLIANCE_OFFICER`, `GRAPH_ANALYST`, `PLATFORM_ADMIN` |
| `POST /graph/deletion-jobs` | 11 | 201 | `DATA_GOVERNANCE_ADMIN`, `SYSTEM`, `PLATFORM_ADMIN` |

`/traverse` y `/paths` son `POST` con cuerpo, no `GET` con query: el filtro de relaciones, el
propósito de uso y el contexto de paciente no caben cómodamente en una URL, y —sobre todo— un
identificador de paciente en la query acaba en cada log de acceso del camino.

## Quién puede hacer qué

**Quien proyecta no consulta y quien consulta no proyecta.** `GRAPH_PROJECTION_WORKER` no aparece en
`/traverse` ni en `/paths`; `GRAPH_ANALYST` no aparece en `/projections/*`. Escribir el grafo y
leerlo son capacidades distintas: quien puede escribirlo podría fabricar exactamente la relación que
quiere encontrar después.

**Quien define el alcance no lo usa para investigar.** `DATA_GOVERNANCE_ADMIN` define alcances pero
no aparece en `/traverse`. El gobierno del acceso lo pone quien no lo va a ejercer.

**Quien detecta no resuelve.** `GRAPH_ANALYTICS_WORKER` registra hallazgos, pero el triage
(`PATCH /rule-hits/:id`) es de `COMPLIANCE_OFFICER` y `GRAPH_ANALYST`. Un worker que pudiera cerrar
sus propios hallazgos podría silenciarlos.

`GRAPH_ANALYST` sí puede arrancar una corrida de proyección (`/projection-definitions/:id/runs`) —el
caso de uso lo pide— pero no avanzarla ni escribir nodos: puede pedir que se reproyecte, no decidir
qué se proyecta.

## Rutas planas y sin `/internal`

El caso de uso escribe `/internal/graph/projections/nodes/upsert`, `/internal/graph/edges/expire` y
`/internal/graph/deletion-jobs/{id}/execute`. Se publican bajo `/graph/…` con rol de worker,
siguiendo la convención del resto del proyecto: el worker es un cliente autenticado más, y el
aislamiento lo da el rol, no el prefijo de la ruta.

## Dos controladores, un mismo prefijo

Los dos cuelgan de `@Controller('graph')`. Nest los monta sin conflicto porque ninguna ruta se
repite. La separación es por responsabilidad, y se nota en los roles: el primero lo llaman workers de
proyección casi en exclusiva; el segundo, personas y workers de analítica.

## Actor

Todas las rutas reciben `@CurrentUser()`; va al `actorUserId` del evento de outbox. El actor no entra
en la decisión de scoping —eso lo determina el alcance declarado en el cuerpo—, pero sí queda
registrado en cada cambio de política, hallazgo y purga.

## Pruebas

15 pruebas de delegación en `graph-controllers.spec.ts`.
