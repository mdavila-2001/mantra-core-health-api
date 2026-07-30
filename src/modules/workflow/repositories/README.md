# Repositorios — workflow

Tres repositorios. Ninguno abre transacción: todos reciben el `EntityManager` transaccional del
servicio como primer parámetro.

| Repositorio | Qué toca |
| --- | --- |
| `state-machines.repository.ts` | `state_machine_definitions`, `state_definitions`, `state_transition_definitions`, `transition_guards`, `transition_side_effects` |
| `workflow-runtime.repository.ts` | `state_transition_events`, `workflow_instances`, `workflow_tasks` |
| `aggregate-state.repository.ts` | la fila del **agregado de dominio**, fuera del esquema `workflow` |

El corte no es por tabla sino por quién escribe: el primero sólo lo toca el arquitecto de workflow,
el segundo la ejecución, y el tercero es la única salida del esquema.

## `aggregate-state.repository.ts`

Es el punto delicado del módulo. La definición guarda el esquema, la tabla y la columna de estado del
agregado como texto (`aggregate_schema_name`, `aggregate_entity_name`, `status_field_name`), así que
la sentencia se compone en tiempo de ejecución. **Un identificador SQL no admite `?`**, y por eso los
tres nombres pasan por la lista blanca `^[a-z_][a-z0-9_]{0,62}$` antes de entrecomillarse. Lo que no
case lanza y no llega a ejecutarse.

`findForUpdate` lee estado y `row_version` con `for update`. `updateState` mueve la columna, hace
`row_version + 1` y, si se le pasa `expectedRowVersion`, añade `and row_version = ?`: cero filas
afectadas es el conflicto optimista, y el servicio lo convierte en `409`.

No toca `updated_by_user_id`: quién ordenó el movimiento queda en `state_transition_events`, que es
el registro autoritativo del hecho y no se puede editar después.

## Bloqueos

`FOR UPDATE` (`LockMode.PESSIMISTIC_WRITE`):

| Método | Por qué |
| --- | --- |
| `findMachineForUpdate` | declarar estados o transiciones y publicar compiten por la misma fila |
| `findActiveMachineForUpdate` | la versión vigente que se retira al publicar |
| `findInstanceForUpdate` | completar tarea y reintentar mueven la instancia |
| `findTaskForUpdate` | dos personas pueden intentar completar la misma tarea |
| `findDueTasksByInstanceForUpdate` | las tareas vencidas que se escalan con su instancia |
| `AggregateStateRepository.findForUpdate` | el agregado, **antes** de leer su estado |

`findDueInstancesForUpdate` es el único con `PESSIMISTIC_PARTIAL_WRITE` (`FOR UPDATE SKIP LOCKED`):
el barrido de vencidos es una cola, y esperar a una fila que alguien está tocando retrasaría a todas
las demás. Lo que este barrido se salta, lo toma el siguiente.

## Append-only

`state_transition_events` sólo tiene `create*` y lecturas. No hay `update` ni `delete`, y la entidad
ni siquiera declara `updated_at`: un histórico de transiciones editable deja de ser el registro de lo
que pasó, que es exactamente para lo que existe.

## Idempotencia

`findTransitionEventByIdempotencyKey` filtra por `(state_machine_definition_id, aggregate_id,
idempotency_key)` — el unique parcial del modelo. La misma clave sobre otro agregado es otra
operación, y sobre otra máquina también.

## Convenciones

- `createdBy(actorUserId)` en cada `create*`; el `touch` lo hace el servicio sobre la entidad
  gestionada.
- Sin `flush()`: lo hace `em.transactional` al cerrar.
- Las guardas se devuelven por `evaluation_order` y los efectos por `execution_order`: en los dos
  casos el orden es contractual, no cosmético.
