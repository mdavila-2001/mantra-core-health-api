# Repositorios — automation

Cuatro repositorios. Ninguno abre transacción: todos reciben el `EntityManager` transaccional del
servicio como primer parámetro.

| Repositorio | Tablas |
| --- | --- |
| `agents.repository.ts` | `agents`, `agent_versions`, `agent_tools`, `agent_tool_bindings`, `agent_memory` |
| `automation-governance.repository.ts` | `guardrail_policies`, `agent_guardrails`, `workflows`, `workflow_steps`, `automation_triggers`, `record_automations` |
| `automation-runs.repository.ts` | `workflow_runs`, `agent_runs`, `agent_run_steps`, `automation_approvals` |
| `target-record.repository.ts` | la fila del **destino de negocio**, fuera del esquema `automation` |

El corte es por quién escribe: el catálogo lo toca el ingeniero, el gobierno el responsable de IA,
la ejecución el runtime, y el cuarto es la única salida del esquema.

## `target-record.repository.ts`

Es el punto delicado del módulo. `record_automations` guarda el destino como texto
(`target_resource_type` = `esquema.tabla`) y el mapeo de columnas como `jsonb`, así que la sentencia
se compone en tiempo de ejecución. **Un identificador SQL no admite `?`**, y por eso esquema, tabla,
columnas de destino y columnas de deduplicación pasan por la lista blanca
`^[a-z_][a-z0-9_]{0,62}$` antes de entrecomillarse. Los **valores** sí van parametrizados.

`parseTargetResource` exige el punto: sin esquema explícito, el destino dependería del `search_path`
de la conexión del momento.

`writeRecord` compone `insert … values … [on conflict (clave) do nothing|do update set …] returning id`.
Con `upsert` se actualiza todo menos las columnas de la clave —reescribirlas con el mismo valor es
ruido, y con otro sería cambiar la identidad de la fila desde una operación que decía actualizarla—.
Sin `upsert`, la colisión no devuelve fila y eso se traduce en `written: false`: la deduplicación
funcionando, no un error.

## Bloqueos

`FOR UPDATE` (`LockMode.PESSIMISTIC_WRITE`):

| Método | Por qué |
| --- | --- |
| `findAgentForUpdate` | publicar versión y adjuntar guardrail compiten por la misma fila; `current_version` es derivada |
| `findMemoryForUpdate` | el upsert de memoria lee y escribe la misma clave natural |
| `findWorkflowRunForUpdate` | pausar y cerrar el run tocan el mismo estado |
| `findAgentRunForUpdate` | registrar paso, pausar y decidir compiten |
| `findApprovalForUpdate` | una sola decisión puede valer |
| `findAgentRunsByWorkflowRunForUpdate` | el cierre los mueve todos a la vez |
| `findRecordAutomationForUpdate` | su `updated_at` es la métrica de último uso |

No hay `SKIP LOCKED` en este módulo: no hay ninguna cola que barrer.

## La clave natural de la memoria

`findMemoryForUpdate` filtra por `scopeRefId: dto.scopeRefId ?? null`. En Postgres `null = null` es
*desconocido*, no verdadero: sin ese `?? null` explícito, el ámbito global —donde la referencia es
nula— nunca encontraría su propia fila y el upsert insertaría una memoria nueva cada vez.

## Append-only

`agent_run_steps` sólo tiene `create*` y lecturas. La traza es lo que permite reconstruir por qué el
agente hizo lo que hizo; editable, no permitiría nada. La entidad ni siquiera declara `updated_at`.

`findMaxSequenceNo` deriva el número del siguiente paso, y `countToolCalls` cuenta los usos de una
herramienta en el run para el tope del enlace.

## Numéricos como texto

`cost_amount`, `total_cost_amount`, `max_cost_amount` e `importance` son `numeric` y viajan como
`string`. Se suman y comparan con las utilidades de escala entera del servicio de ejecución, nunca
con `Number`.

## Convenciones

- `createdBy(actorUserId)` en cada `create*`; el `touch` lo hace el servicio sobre la entidad
  gestionada.
- Sin `flush()`: lo hace `em.transactional` al cerrar.
- Los pasos de workflow se devuelven por `ordinal`; el orden es parte de la definición.
