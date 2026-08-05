# Servicios — automation

Cuatro servicios. Cada método público es un caso de uso completo dentro de un único
`em.transactional`.

| Servicio | UC | Qué hace |
| --- | --- | --- |
| `agent-catalog.service.ts` | 01–05, 12 | agentes, versiones, herramientas, enlaces, guardrails y memoria |
| `automation-definition.service.ts` | 06, 07 | workflows con pasos y disparadores |
| `automation-execution.service.ts` | 08–11, 14 | runs, traza, pausa, decisión y cierre |
| `record-automation.service.ts` | 13 | la escritura real en un esquema de negocio |

UC-48-13 está solo en su servicio a propósito: es la única operación que escribe fuera de
`automation`, con el destino resuelto en tiempo de ejecución, y mezclarla con el resto de la
ejecución escondería lo delicada que es.

## AgentCatalogService

- `registerAgent` (UC-48-01) — agente y versión 1, los dos en borrador, en la misma transacción. Un
  agente que actúa exige `actsAsUserId`.
- `publishAgentVersion` (UC-48-02) — dos caminos: publicar una versión ya en borrador, o crear la
  siguiente y publicarla. `current_version` del agente pasa a ser la publicada, y publicar la primera
  activa al agente.
- `registerTool` (UC-48-03) — `isWrite` + `requiresApproval` son las dos banderas que la ejecución
  lee para decidir si el paso se detiene. Una herramienta HTTP exige endpoint.
- `bindTools` (UC-48-04) — lote atómico; sólo herramientas activas, sin repetidas en el lote y sin
  enlaces duplicados.
- `defineGuardrail` / `attachGuardrail` (UC-48-05) — coste sin tope y PHI sin tratamiento declarado se
  rechazan.
- `upsertMemory` (UC-48-12) — upsert por `(agente, ámbito, referencia, tipo)`; fuera del ámbito
  global la referencia es obligatoria.

## AutomationDefinitionService

- `defineWorkflow` (UC-48-06) — valida el grafo antes de crear nada: códigos únicos, saltos a pasos
  declarados, agente/herramienta presentes según el tipo de paso y existentes en el catálogo.
  Después crea todos los pasos y **luego** resuelve los saltos: una arista puede apuntar hacia
  adelante, y en ese momento el destino aún no existiría.
- `configureTrigger` (UC-48-07) — evento exige `eventType`; calendario exige un cron de cinco campos
  (`assertCron` valida la forma, no la semántica: eso es del planificador, pero un cron de tres
  campos no llegaría a registrarse allí y el disparador quedaría muerto sin que nadie lo notara).
  `schedule_source` sale de si viene `campaignScheduleId`, no de la petición.

## AutomationExecutionService

- `startWorkflowRun` (UC-48-08) — comprueba workflow y disparador, busca run vivo por contexto y, si
  lo hay, lo devuelve. El run nace directamente `RUNNING`: el caso de uso describe `queued -> running`
  en la misma transacción, y separarlo dejaría un estado que nadie observa.
- `startAgentRun` (UC-48-09) — sólo versiones publicadas; se atribuye a `acts_as_user_id`.
- `recordAgentStep` (UC-48-09 + UC-48-10) — el método central. `findBlocker` decide si el paso se
  detiene: primero la herramienta (enlazada, no denegada, con cupo, y si escribe y exige aprobación),
  después los guardrails habilitados con `enforcement = block`. Si hay bloqueo, el paso se registra
  `AWAITING_APPROVAL` **sin salida de herramienta**, y `pauseForApproval` crea la aprobación, pausa el
  `agent_run` y pone el `workflow_run` en `WAITING` — los tres a la vez.
- `requestApproval` (UC-48-10) — la misma operación, invocable explícitamente; devuelve la pendiente
  si ya la había.
- `decideApproval` (UC-48-11) — guarda sobre `pending`; aprobar reanuda, rechazar cancela el agente y
  falla el run. Añade un paso `HUMAN_APPROVAL` a la traza con la decisión.
- `finalizeWorkflowRun` (UC-48-14) — idempotente, no cierra con aprobaciones pendientes, cierra los
  `agent_runs` abiertos calculando su latencia y suma el coste.

### `compareDecimals` y `addDecimals`

Exportado el primero para poder probarlo aparte. Los dos escalan los operandos a la misma cantidad de
decimales y operan con `BigInt`. En coma flotante `0.1 + 0.2 > 0.3` es verdad, y aquí eso sería
bloquear un run por un coste que no se ha superado, o facturar de más al sumar.

## RecordAutomationService

`executeRecordAutomation` (UC-48-13) en orden:

1. `agent_run` en marcha —no en pausa: escribir ahí sería lo que el guardrail acaba de impedir—,
2. automatización activa y del agente correcto,
3. identidad de servicio presente, o la escritura no sería atribuible,
4. `applyFieldMapping` traduce el payload a columnas y **falla cerrado**,
5. `assertValidation` comprueba lo declarado e **ignora lo que no entiende**,
6. `parseDedupeColumns` parte la clave,
7. escritura (salvo en modo borrador),
8. paso de traza —pase lo que pase, incluso si la deduplicación no escribió: que el agente lo
   intentara también es un hecho—,
9. `RecordAutomated` al outbox.

La atribución (`created_by_user_id`, `updated_by_user_id`) se pone **después** de recorrer el mapeo,
para que el mapeo no pueda pisarla.

## Transacciones

Un caso de uso, una transacción. `OutboxService.publishDomainEvent(tx, …)` recibe la transacción
abierta y se enlista en ella.

## Errores

`ConflictException` (409) para códigos duplicados, enlaces repetidos y aprobación ya decidida.
`PreconditionFailedException` (422) para estado incompatible, requisitos de tipo, guardrail y mapeo.
`ResourceNotFoundException` (404) para referencias que no resuelven.

## Logs

`operation: 'automation.<área>.<acción>'`. `warn` en pausa por guardrail y decisión de aprobación.
No se loguean `payloadJson`, `thought_text` ni el contenido de la memoria.
