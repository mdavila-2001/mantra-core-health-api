# Servicios — workflow

Tres servicios. Cada método público es un caso de uso completo dentro de un único
`em.transactional`.

| Servicio | UC | Qué hace |
| --- | --- | --- |
| `state-machine-definition.service.ts` | 01–04 | declara el grafo y lo publica; nada de esto mueve un agregado |
| `transition-execution.service.ts` | 05, 06, 08, 09, 11 | mueve agregados, compensa, reintenta y lee el historial |
| `workflow-instances.service.ts` | 10, 12, 13 | instancias, tareas y barrido de vencidos |

## StateMachineDefinitionService

- `registerStateMachine` (UC-32-01) — máquina `DRAFT`, versión `max(version) + 1` del value set. El
  número sale del value set, no del código, porque el unique del modelo es
  `(state_value_set_id, version_number)`.
- `defineStates` (UC-32-02) — sólo sobre borrador; exactamente un inicial contando los ya declarados;
  sin conceptos repetidos.
- `defineTransition` (UC-32-03) — origen y destino declarados, origen no terminal, y sin dos guardas
  o dos efectos compartiendo orden. Dos guardas con el mismo orden harían que el `failure_code` que
  ve el llamante dependiera del plan de la consulta.
- `publishStateMachine` (UC-32-04) — `findUnreachableStates` recorre el grafo en anchura desde el
  inicial antes de activar. Publicar retira la versión activa anterior del mismo value set.

## TransitionExecutionService

`triggerTransition` (UC-32-05 + UC-32-06) es el método que estructura el módulo. El orden no es
arbitrario:

1. resolver la **versión activa** de la máquina,
2. `FOR UPDATE` sobre el agregado —antes de leer su estado—,
3. buscar la transición por `(máquina, estado actual, comando)`,
4. cortocircuito de idempotencia,
5. motivo y versión esperada, si la definición los exige,
6. guardas en orden,
7. `UPDATE` del agregado,
8. `INSERT` del evento inmutable,
9. un mensaje de outbox por efecto con `outbox_event_type`.

Todo en la misma transacción, y **ninguna llamada externa**: los efectos salen por el outbox y los
despacha el relay después del commit.

`assertGuards` lanza con el `failure_message_key` declarado y pone el `failure_code` en los detalles;
la expresión no sale nunca en la respuesta.

`evaluateGuard` **falla cerrado**: tipo desconocido o expresión que no se entiende ⇒ guarda no
cumplida. La gramática admitida está en el README del módulo.

`compensateTransition` (UC-32-08) exige que algún efecto declare `compensation_spec_json` y que el
agregado siga donde lo dejó la transición original. Registra un evento nuevo con
`causation_id = eventId` y clave de idempotencia propia (`compensate:<eventId>`): el reverso es un
hecho distinto del original, y compartir la clave lo haría parecer un duplicado.

`retryTransition` (UC-32-09) **no mueve el agregado** —origen y destino son el estado al que ya
llegó— y **conserva la clave de idempotencia del original**, incluida la de los mensajes de sus
efectos (`<clave>:<sideEffectCode>`). Es lo que distingue reintentar de volver a hacer.

`getTransitionHistory` (UC-32-11) es lectura pura sobre tabla append-only. Resuelve `transitionCode`
y `commandCode` una vez por definición distinta, no una vez por evento, y recorta el `limit` pedido
a 200.

## WorkflowInstancesService

- `createInstance` (UC-32-12) — estado inicial de la definición activa; una sola instancia viva por
  `(workflowCode, subjectId)`; tareas iniciales `OPEN`.
- `completeTask` (UC-32-13) — tarea abierta, instancia viva, y no la tarea de otro. Fija
  `assigned_user_id` al actor: es la única forma de saber después quién dio por buena una tarea que
  estaba asignada a un rol. Con `commandCode` dispara además la transición
  (`WF_REASON_TASK_COMPLETED`, clave `task-complete:<taskId>`).
- `sweepTimeouts` (UC-32-10) — lote con `SKIP LOCKED`, instancia y tareas a `ESCALATED`, y `due_at`
  limpiado para que el siguiente barrido no vuelva a tomarla.

## Transacciones

Un caso de uso, una transacción. `OutboxService.publishDomainEvent(tx, …)` recibe la transacción
abierta y se enlista en ella —es la excepción deliberada del proyecto, y la razón de que exista el
outbox—.

## Errores

`ConflictException` (409) para códigos duplicados, instancia viva repetida y tarea ajena.
`ConcurrencyConflictException` (409) cuando el `UPDATE` con versión esperada no afecta filas.
`PreconditionFailedException` (422) para estado incompatible, guarda incumplida, comando no aplicable
y requisitos declarados por la transición. `ResourceNotFoundException` (404) para referencias que no
resuelven.

## Logs

`operation: 'workflow.<área>.<acción>'`. `info` en registro, publicación, disparo, creación de
instancia y completado de tarea. `warn` en compensación, reintento y escalado. No se loguean
expresiones de guarda ni `payloadJson`.
