# Módulo 48 — Automatización y orquestación multiagente

Agentes con versiones publicables, herramientas con permiso, guardrails que detienen lo que no debe
pasar, workflows con pasos enlazados, ejecuciones con traza paso a paso, aprobaciones humanas y
escritura de registros con deduplicación.

## Casos de uso cubiertos (14)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-48-01 | `POST /automation/agents` | Registrar agente con su versión 1 |
| UC-48-02 | `POST /automation/agents/:id/versions/publish` | Publicar versión |
| UC-48-03 | `POST /automation/tools` | Registrar herramienta |
| UC-48-04 | `POST /automation/agents/:id/versions/:versionId/tool-bindings` | Enlazar herramientas |
| UC-48-05 | `POST /automation/guardrails` · `POST /automation/agents/:id/guardrails` | Guardrail y adjunción |
| UC-48-06 | `POST /automation/workflows` | Workflow con pasos anidados |
| UC-48-07 | `POST /automation/triggers` | Disparador |
| UC-48-08 | `POST /automation/workflows/:id/runs` | Arrancar ejecución |
| UC-48-09 | `POST /automation/runs/:workflowRunId/agent-runs` · `POST /automation/agent-runs/:id/steps` | Ejecución con traza |
| UC-48-10 | `POST /automation/agent-runs/:id/approvals` (y automático en el paso) | Pausar por guardrail |
| UC-48-11 | `POST /automation/approvals/:id/decide` | Decidir y reanudar |
| UC-48-12 | `POST /automation/agents/:id/memory` | Persistir memoria |
| UC-48-13 | `POST /automation/agent-runs/:id/record-automations/:recordAutomationId/execute` | Escribir con dedupe |
| UC-48-14 | `POST /automation/runs/:workflowRunId/finalize` | Cerrar con resumen de coste |

15 endpoints para 14 casos de uso: UC-48-05 y UC-48-09 tienen dos cada uno, y UC-48-10 se dispara
además automáticamente desde el registro del paso.

## Flujo general

```
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

## Reglas de negocio

- **El agente y su versión 1 nacen en borrador.** Un agente sin versión publicada no puede
  ejecutarse; crearlo ya activo daría a entender que sí.
- **Un agente que actúa necesita identidad de servicio.** Sin `acts_as_user_id`, sus escrituras no
  quedan atribuidas a nadie y la pregunta "quién cambió esto" no tiene respuesta.
- **Publicar la primera versión activa al agente**: es el momento en que deja de ser una declaración.
- **`current_version` es derivada**, no la manda el llamante; por eso el agente se bloquea antes de
  tocarla.
- **Una herramienta HTTP sin endpoint de integración no tiene a dónde ir.**
- **Sólo se enlazan herramientas activas.** Enlazar una deshabilitada deja una capacidad declarada
  que fallará a mitad de una ejecución en vez de aquí.
- **El lote de enlaces es atómico**: enlazar cinco y que entren tres deja una capacidad parcial que
  nadie pidió.
- **Una política de coste sin tope no restringe nada**, y una de PHI sin tratamiento declarado
  tampoco. Registrarlas sería dar por cubierto un control que no existe.
- **Los saltos entre pasos van por código, no por id**: los ids no existen hasta que se insertan, y
  pedirlos obligaría a dos llamadas con el grafo a medias entre ellas.
- **Un salto a un paso no declarado se rechaza.** Una arista colgando no falla al definir el
  workflow, falla a mitad de una ejecución.
- **Un disparador por evento exige el tipo de evento; uno por calendario, un cron de cinco campos.**
  Sin eso queda registrado pero no se dispara nunca, que es peor que no tenerlo porque parece que sí.
- **Un run vivo sobre el mismo expediente no se duplica**: se devuelve el que hay. Es el sustituto
  local del bloqueo distribuido; sin él, un evento entregado dos veces —lo normal en *at-least-once*—
  arrancaría dos ejecuciones sobre el mismo expediente.
- **Sólo se ejecutan versiones publicadas.** Un borrador es una propuesta; dejarlo actuar sobre datos
  reales convierte cada edición del prompt en un despliegue silencioso.
- **La secuencia del paso se deriva del último**, no la elige el llamante: dos pasos con el mismo
  número harían que el orden de la traza dependiera del plan de la consulta.
- **Un enlace que deniega se rechaza, no se convierte en aprobación pendiente.** Es una decisión
  explícita del ingeniero, no una duda.
- **Un paso bloqueado no guarda salida de herramienta**: la herramienta no llegó a ejecutarse, y ése
  es el punto entero del guardrail.
- **Sólo bloquea el guardrail declarado para bloquear.** `warn` y `log` dejan constancia y siguen.
- **Una sola decisión de aprobación vale.** La guarda sobre `pending` impide que un segundo aprobador
  reabra algo ya rechazado.
- **Quien decide es la persona, no el agente**: `decided_by_user_id` es el actor humano. El sentido
  de la aprobación es precisamente ése.
- **La escritura de registros se atribuye a la identidad de servicio del agente**, y el mapeo no la
  puede pisar: la atribución se pone después de recorrerlo.
- **No se escribe con el run en pausa**: sería exactamente lo que el guardrail acaba de impedir.
- **La memoria es upsert por `(agente, ámbito, referencia, tipo)`.** Si fuera insert, el agente
  acumularía cien versiones de la misma preferencia y la recuperación tendría que decidir cuál vale.
- **Fuera del ámbito global la memoria necesita a qué se refiere.** Una memoria "de este expediente"
  sin referencia no se recupera para ningún expediente.
- **El cierre es idempotente**: cerrar un run ya cerrado devuelve lo que hay sin volver a sumar. Un
  worker que reintenta no debe duplicar la factura.
- **No se cierra con aprobaciones pendientes**: dejaría a un aprobador decidiendo sobre una ejecución
  que ya no existe.

## Dinero sin coma flotante

`cost_amount` y `max_cost_amount` son `numeric` y viajan como cadena. `compareDecimals` y
`addDecimals` escalan los dos operandos a la misma cantidad de decimales y operan con `BigInt`:
`0.1 + 0.2 > 0.3` es verdad en coma flotante, y aquí eso sería bloquear un run por un coste que no se
ha superado, o facturar de más al sumar.

## La escritura fuera del esquema

`TargetRecordRepository` es el único punto del módulo que escribe fuera de `automation`.
`record_automations` guarda `target_resource_type`, `field_mapping_json` y `dedupe_key_expr`
precisamente para escribir en un destino que no se conoce al compilar. Como el identificador SQL no
admite *bind*, esquema, tabla y columnas pasan por la lista blanca `^[a-z_][a-z0-9_]{0,62}$` antes de
entrecomillarse.

### La gramática que el modelo no define

| Campo | Forma admitida |
| --- | --- |
| `field_mapping_json` | `{ "<columna>": { "from": "ruta.en.payload" \| "value": <literal>, "required": bool } }` |
| `validation_json` | `{ "required": ["<columna>", …] }`; otras claves se ignoran |
| `dedupe_key_expr` | lista de columnas separadas por comas → `ON CONFLICT (…)` |

El mapeo **falla cerrado**: una regla que no se entiende no escribe. Adivinar la correspondencia
entre un campo del agente y una columna de una tabla clínica es exactamente lo que no se debe hacer.
La validación, en cambio, **ignora lo que no entiende**: validar de más rechazaría escrituras
legítimas de automatizaciones ya configuradas.

## Permisos

`AUTOMATION_ENGINEER` define agentes, herramientas, enlaces, workflows y disparadores.
`AI_GOVERNANCE_OFFICER` define y adjunta guardrails. `SYSTEM` y `AGENT_RUNTIME` ejecutan: arrancan
runs, registran pasos, piden aprobación y escriben registros. `CLINICAL_APPROVER` y
`OPERATIONAL_APPROVER` deciden. `PLATFORM_ADMIN` cubre todo.

Ninguna ruta es pública.

## Concurrencia

`FOR UPDATE` sobre el agente al publicar o adjuntar guardrail, sobre el `agent_run` al registrar paso
o decidir, sobre la aprobación al decidirla, sobre el `workflow_run` al pausarlo o cerrarlo, sobre
los `agent_runs` del run al cerrarlo, sobre la memoria al hacer upsert y sobre la automatización de
registro al ejecutarla.

## Logs

`operation: 'automation.<área>.<acción>'`. Nivel `warn` en pausa por guardrail y en decisión de
aprobación —los dos momentos en que una persona tiene que intervenir—. No se loguean
`payloadJson`, `thought_text` ni el contenido de la memoria.

## Pruebas

`yarn test --testPathPatterns=modules/automation` — 127 pruebas (26 catálogo + 15 definición +
39 ejecución + 18 escritura de registros + 13 del repositorio de destino + 16 de delegación de los
dos controladores).

## Divergencias con el caso de uso v3.9

- **Segmentos planos en vez de `:accion`.** El caso de uso escribe `versions:publish`,
  `{id}:decide`, `{workflow_run_id}:finalize`. Nest 11 monta sobre `path-to-regexp` v8, que trata `:`
  como inicio de parámetro en cualquier posición del segmento. Se publican como segmentos separados.
- **UC-48-13 tiene endpoint propio.** El caso de uso lo marca como *interno, ejecutado en el paso
  `tool_call`*. Se expone bajo el `agent_run` que lo ejecuta, que es donde el modelo lo sitúa
  (`agent_run_steps — INSERT`), para que el runtime pueda invocarlo y quede la traza.

## Pendiente

- **La ejecución real del agente**: llamar al modelo, ejecutar la herramienta HTTP contra
  `integrations.integration_endpoints`. Este módulo gobierna, registra y bloquea; el runtime del
  agente ejecuta y va reportando cada paso.
- **`input_tokens` / `output_tokens` / `cost_amount` del `agent_run`**: los reporta el runtime, que es
  quien habla con el modelo. El cierre suma lo que haya.
- **`workflow.automation_run_machine` (módulo 32)**: el caso de uso mantiene una máquina de estados
  paralela en el esquema `workflow`. Aquí el estado vive en `workflow_runs.status_concept_id`;
  reflejarlo además como agregado gobernado del módulo 32 exige registrar la máquina y decidir su
  `machine_code`, que el modelo no declara.
- **`redis_runtime.idempotency_entries` y `distributed_lock_entries`** (UC-48-08, 13): aquí lo cubren
  el `FOR UPDATE` y la búsqueda de run vivo por contexto. Ese esquema es del módulo 56, **sin
  asignar**.
- **`knowledge_sources`**: la tabla existe en el esquema pero ningún caso de uso del módulo 48 la
  cubre. No se ha inventado un endpoint para ella.
- **Suscripción real del disparador al bus** (`messaging.domain_events`) y registro del cron en el
  planificador: el disparador se registra y publica `TriggerRegistered`; quien lo consume y arma la
  suscripción es el worker.
- **Tablas `*_history`**: el caso de uso las declara junto a `audit.audit_events`. La auditoría es del
  módulo 06; las tablas de historial por entidad no están generadas en este esquema.
