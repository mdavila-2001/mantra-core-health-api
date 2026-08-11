<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/workflow/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `workflow`

**Fuente:** [`src/modules/workflow/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/workflow/README.md)
· 3 controllers · 3 services · 3 repositories · 8 entidades · 1 DTO

---

# Módulo 32 — Máquinas de estado y flujos entre dominios

Un solo sitio donde se declara qué estados puede tener un agregado, qué comandos lo mueven de uno a
otro, qué hay que cumplir para moverlo y qué pasa después de moverlo. Y un solo sitio donde eso se
ejecuta, con idempotencia, compensación, reintento y vencimiento.

## Casos de uso cubiertos (13)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-32-01 | `POST /workflow/state-machines` | Registrar definición de máquina |
| UC-32-02 | `POST /workflow/state-machines/:id/states` | Declarar estados (inicial/terminal) |
| UC-32-03 | `POST /workflow/state-machines/:id/transitions` | Transición con guardas y efectos |
| UC-32-04 | `POST /workflow/state-machines/:id/publish` | Publicar/activar la versión |
| UC-32-05 | `POST /workflow/aggregates/:aggregateId/transitions/:commandCode` | Disparar transición validada |
| UC-32-06 | cabecera `Idempotency-Key` en UC-32-05 | Idempotencia de transición |
| UC-32-07 | (parte transaccional aquí; relay en módulo 35) | Efectos post-commit vía outbox |
| UC-32-08 | `POST /workflow/aggregates/:aggregateId/transitions/:eventId/compensate` | Compensar (saga) |
| UC-32-09 | `POST /workflow/aggregates/:aggregateId/transitions/:eventId/retry` | Reintentar transición fallida |
| UC-32-10 | `POST /workflow/instances/sweep-timeouts` | Escalar por vencimiento |
| UC-32-11 | `GET /workflow/aggregates/:aggregateId/transitions` | Estado e historial |
| UC-32-12 | `POST /workflow/instances` | Crear instancia y tareas |
| UC-32-13 | `POST /workflow/tasks/:id/complete` | Completar tarea |

11 endpoints para 13 casos de uso: UC-32-06 es una cabecera de UC-32-05, y UC-32-07 no tiene REST
propio (ver abajo).

## Flujo general

```
DEFINICIÓN (borrador)
  state-machines ──────────> máquina DRAFT, versión N+1 del value set
    ├─ :id/states ─────────> exactamente un inicial, al menos un terminal
    └─ :id/transitions ────> from no terminal; guardas y efectos ordenados
  :id/publish ─────────────> comprueba el grafo → ACTIVE
                             la versión activa anterior queda RETIRED

EJECUCIÓN
  aggregates/:id/transitions/:command
    1. FOR UPDATE sobre el agregado          ← antes de leer su estado
    2. ¿hay transición (estado actual, comando)?
    3. Idempotency-Key ya vista ─────────────> devuelve el resultado previo
    4. ¿motivo? ¿versión esperada? ¿guardas en orden?
    5. UPDATE del agregado + row_version++
    6. INSERT en state_transition_events (inmutable)
    7. outbox: un mensaje por efecto con outbox_event_type
                                             ↓ post-commit
                             el relay del módulo 35 los despacha

  .../:eventId/compensate ─> vuelve al estado de origen, evento nuevo con causation_id
  .../:eventId/retry ──────> no mueve nada; reusa la clave de idempotencia original

INSTANCIAS
  instances ───────────────> estado inicial de la definición + tareas OPEN
  tasks/:id/complete ──────> tarea COMPLETED, paso avanzado, transición si hay comando
  instances/sweep-timeouts > vencidas → ESCALATED (instancia y tareas), SKIP LOCKED
```

## Reglas de negocio

- **La definición nace en borrador.** Una máquina recién declarada no tiene estados ni transiciones:
  activarla permitiría disparar comandos contra un grafo vacío y dejar al agregado en un estado del
  que no se puede salir.
- **Estados y transiciones sólo sobre borrador.** Añadir un estado a una máquina viva cambia el grafo
  bajo los agregados que ya se están moviendo por él.
- **Exactamente un estado inicial**, contando los ya declarados. Dos iniciales dejan sin decidir
  dónde empieza una instancia nueva.
- **Un estado terminal no tiene transiciones de salida.** Si las tuviera, el grafo diría que es
  terminal mientras las transiciones dirían que no.
- **Publicar comprueba el grafo**: hay inicial, hay terminal, y todo estado se alcanza desde el
  inicial. Un estado inalcanzable es código muerto; uno alcanzable, sin salida y no terminal, atrapa
  al agregado para siempre.
- **Una sola versión activa por value set.** Dos vigentes dejarían sin decidir cuál gobierna la
  próxima transición.
- **Se bloquea el agregado antes de leer su estado.** Al revés, dos comandos concurrentes leerían el
  mismo estado de origen y aplicarían los dos su transición.
- **La clave de idempotencia corta antes de tocar nada** y devuelve el resultado previo. Reaplicar
  una transición ya aplicada movería el agregado una segunda vez.
- **Las guardas fallan cerrado.** Una guarda cuya expresión no se entiende se considera no cumplida:
  existe para impedir algo, y dejarla pasar porque no se sabe leerla la convierte en un adorno.
- **El rechazo devuelve el `failure_code` declarado, no la expresión.** Filtrarla revelaría la regla
  de negocio a quien acaba de chocar contra ella.
- **Sólo se compensa lo que se declaró compensable.** Sin `compensation_spec_json` no hay forma
  declarada de deshacer los efectos ya despachados, y devolver el agregado sin revertirlos deja el
  sistema peor que antes.
- **Compensar no borra**: registra un evento nuevo con `causation_id` al original. El histórico tiene
  que poder contar que se hizo y que se deshizo.
- **No se compensa si el agregado ya se movió** a otro estado: sobrescribiría un cambio posterior que
  nadie pidió deshacer.
- **El reintento conserva la clave del original** y no mueve el agregado. Es lo que distingue
  reintentar de volver a hacer: la transición ya se aplicó, lo que falló fue el efecto.
- **El estado inicial de una instancia sale de la definición, no de la petición.** Dejarlo entrar por
  el cuerpo permitiría arrancar en mitad del flujo saltándose todo lo anterior.
- **Una sola instancia viva por (código, sujeto).** Dos flujos del mismo tipo sobre el mismo agregado
  competirían por moverlo.
- **No se completa la tarea de otro.** Cerrarla no sería cerrarla: sería apropiarse de una decisión
  ajena.
- **Escalar no cancela.** Un plazo vencido significa que alguien tiene que mirarlo, no que haya que
  tirar el trabajo hecho. Y el barrido limpia el `due_at` al escalar, o volvería a tomar la misma
  instancia una y otra vez.

## La escritura fuera del esquema

`AggregateStateRepository` es el único punto del módulo que escribe fuera de `workflow`, y lo hace a
propósito: `state_machine_definitions` guarda `aggregate_schema_name`, `aggregate_entity_name` y
`status_field_name` precisamente para poder mover esa columna. La alternativa —una entidad MikroORM
por agregado gobernable— obligaría a tocar este módulo cada vez que un dominio quisiera una máquina
de estado, que es justo lo que el modelo evita.

Como el identificador SQL no admite *bind*, los tres nombres pasan por una lista blanca
(`^[a-z_][a-z0-9_]{0,62}$`) y se entrecomillan. Lo que no case, no se ejecuta.

## Guardas: la gramática que el modelo no define

`transition_guards.expression_json` es `jsonb` sin gramática declarada en el caso de uso. Este módulo
fija una mínima y la documenta aquí, porque el caso de uso **sí** define el comportamiento
observable —evaluar en orden y devolver el `failure_code` estable— aunque no el lenguaje:

| Tipo de guarda | Forma de `expression_json` |
| --- | --- |
| `WF_GUARD_EXPRESSION` | `{ field, op, value }`, `field` es ruta con puntos dentro de `payloadJson`; `op` ∈ `eq`, `ne`, `in`, `exists`, `gt`, `lt` |
| `WF_GUARD_PERMISSION` | `{ anyOfRoles: string[] }` contra los roles del actor |
| `WF_GUARD_STATE` | `{ stateConceptId }` contra el estado actual del agregado |

Cualquier otra forma —u otro tipo de guarda— **falla cerrado**.

## Permisos

`WORKFLOW_ARCHITECT` y `GOVERNANCE_ADMIN` definen y publican. Los actores de dominio (`CLINICIAN`,
`BILLING_AGENT`, `SCHEDULER`) disparan transiciones, crean instancias y completan tareas. `SYSTEM`
barre vencidos y reintenta. `SAGA_ORCHESTRATOR` compensa. `AUDITOR` y `COMPLIANCE_OFFICER` leen el
historial. `PLATFORM_ADMIN` cubre todo.

Ninguna ruta es pública.

## Concurrencia

`FOR UPDATE` sobre la definición al declarar estados/transiciones y al publicar, sobre la versión
activa que se retira, sobre el agregado antes de moverlo, sobre la instancia y sobre la tarea.
`FOR UPDATE SKIP LOCKED` en el barrido de vencidos, para que dos barridos se repartan la cola.

El bloqueo optimista es aparte: si la transición declara `optimistic_lock_required`, el `UPDATE`
lleva `and row_version = ?` y cero filas afectadas se traduce en `409`.

## Logs

`operation: 'workflow.<área>.<acción>'`. Nivel `warn` en compensación, reintento y escalado por
vencimiento —los tres momentos en que algo no salió como se esperaba—. No se loguean expresiones de
guarda ni el contenido de `payloadJson`.

## Pruebas

`yarn test --testPathPatterns=modules/workflow` — 87 pruebas (17 definición + 31 ejecución +
19 instancias + 9 del repositorio de agregado + 11 de delegación de los tres controladores).

## Divergencia con el caso de uso v3.9

- **Segmentos planos en vez de `:accion`.** El caso de uso escribe
  `transitions:{command_code}`, `{event_id}:compensate`, `{event_id}:retry` e `instances:sweep-timeouts`.
  Nest 11 monta sobre `path-to-regexp` v8, que trata `:` como inicio de parámetro en **cualquier**
  posición del segmento, así que `{id}:retry` declararía un parámetro llamado `id}:retry`. Se
  publican como segmentos separados.

## Pendiente

- **UC-32-07, el relay**: el caso de uso lo marca explícitamente como *worker interno, no REST
  público*. La parte transaccional está aquí (un mensaje de outbox por efecto, dentro de la
  transacción de la transición); despacharlos es
  `POST /internal/outbox/relay/run` del módulo 35, ya implementado. Lo que falta es que ese relay lea
  `transition_side_effects.action_spec_json` y `execution_mode_concept_id` para elegir el despacho:
  hoy publica el mensaje con el modo en `metadataJson` y el consumidor decide.
- **Efectos sin `outbox_event_type`** (crear tarea, notificar): se registran en la definición pero no
  se ejecutan. `action_spec_json` no tiene gramática declarada en el modelo, y ejecutarlos a ciegas
  sería inventarla.
- **`redis_runtime.idempotency_entries`** (UC-32-06, cortocircuito rápido con TTL): aquí la
  idempotencia la da el unique parcial sobre `state_transition_events`, que es la garantía dura. La
  caché de Redis es del módulo 56, **sin asignar**.
- **`transition_timeout_seconds`**: se guarda en la definición pero el barrido usa `workflow_instances.due_at`
  y `workflow_tasks.due_at`. Calcular el vencimiento por transición exige un planificador que
  programe el `due_at` al aplicar la transición.
- **Tablas `*_history`**: el caso de uso las declara junto a `audit.audit_events`. El registro de
  auditoría es del módulo 06; las tablas de historial por entidad no están generadas en este esquema.
- **`purpose_of_use_concept_id`**: se guarda en la definición de la transición y se exige que exista,
  pero no se contrasta contra el propósito declarado por el llamante. Eso vive en `authz`
  (`access_policies`), que es de la parte de Pablo.

