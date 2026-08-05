# Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases

Solicitudes de cambio con aprobación del CAB, artefactos inmutables, despliegues con reversión,
health checks que derivan incidentes, ciclo de vida del incidente con timeline append-only,
postmortems, SLO y presupuesto de error con congelamiento de despliegues, capacidad, revisiones de
preparación, runbooks versionados y ejercicios de resiliencia.

## Casos de uso cubiertos (14)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-46-01 | `POST /ops/change-requests` | Registrar solicitud de cambio |
| UC-46-02 | `POST /ops/change-requests/:id/approvals` | Decisión del CAB, multi-paso |
| UC-46-03 | `POST /ops/artifacts` | Publicar artefacto inmutable |
| UC-46-04 | `POST /ops/deployments` | Ejecutar despliegue con puertas |
| UC-46-05 | `POST /ops/deployments/:id/rollback` | Revertir despliegue |
| UC-46-06 | `POST /ops/health-checks/:id/runs` | Corrida y derivación de incidente |
| UC-46-07 | `PATCH /ops/incidents/:id` | Ciclo de vida del incidente |
| UC-46-08 | `POST /ops/incidents/:id/postmortem` | Postmortem y acciones |
| UC-46-09 | `POST /ops/slo/:id/measurements` | Medición de ventana SLO |
| UC-46-10 | `POST /ops/error-budget/:policyId/burn-events` | Quema y congelamiento |
| UC-46-11 | `POST /ops/capacity-plans/:id/measurements` | Medición de capacidad |
| UC-46-12 | `POST /ops/readiness-reviews/:id/complete` | Cerrar revisión de preparación |
| UC-46-13 | `POST /ops/runbooks/:id/versions` · `POST /ops/runbook-executions` | Versión y ejecución de runbook |
| UC-46-14 | `POST /ops/resilience-exercises/:id/complete` | Cerrar ejercicio de resiliencia |

## Entidades

Escritas: `change_requests`, `change_approvals`, `artifacts`, `deployments`, `health_check_runs`,
`health_incidents`, `incident_responders`, `incident_timeline_events`, `incident_communications`,
`postmortems`, `postmortem_action_items`, `operational_improvement_items`, `slo_measurements`,
`error_budget_burn_events`, `capacity_measurements`, `capacity_plans`,
`operational_readiness_reviews`, `readiness_review_findings`, `runbook_versions`, `runbooks`,
`runbook_executions`, `resilience_exercises`.

Sólo leídas (catálogo y precondiciones): `service_components`, `tool_registry`,
`maintenance_windows`, `health_checks`, `service_level_objectives`, `error_budget_policies`,
`recovery_objectives`.

Del esquema pero fuera de los 14 casos de uso —no hay endpoint que las toque—:
`service_dependencies`, `service_ownerships`, `operational_teams`, `on_call_schedules`,
`on_call_shifts`, `escalation_policies`, `escalation_policy_steps`, `component_tools`,
`service_level_indicators`.

## Flujo general

```
cambio (requested)
   ├─ approvals ──> in_review ──> approved   (rechazo ⇒ rejected, y ahí acaba)
   │
artefacto (inmutable, direccionado por contenido)
   │
deployments  [puertas: cambio approved · ORR "go" en producción · sin congelamiento]
   ├─ en curso ─────────────> succeeded ⇒ pasa a vigente y el cambio queda implementado
   └─ failed ───────────────> el vigente no cambia de manos
        └─ rollback ────────> despliegue nuevo al artefacto estable + el fallido a rolled_back

health-checks/:id/runs
   └─ N fallos consecutivos ⇒ incidente open (uno solo mientras siga vivo)
        └─ PATCH incidents ──> acknowledged ──> mitigated ──> resolved
             └─ postmortem ──> acciones + mejoras en el backlog

slo/:id/measurements ──> pass | warn | fail
   └─ error-budget/burn-events ──> warning | critical | exhausted
        └─ exhausted + política que congela ⇒ los despliegues quedan bloqueados

capacity-plans/:id/measurements ──> utilización; cruzar el guardrail permite recomputar el plan
readiness-reviews/:id/complete ──> go | no_go; lo abierto pasa al backlog
runbooks/:id/versions ──> versión inmutable y vigente; runbook-executions deja rastro
resilience-exercises/:id/complete ──> pass | fail derivado del objetivo de recuperación
```

## Reglas de negocio

- **Quien pide el cambio no lo aprueba**. El CAB existe para que lo mire alguien distinto, y sin esa
  comprobación el control es decorativo.
- **Los pasos de aprobación se recorren en orden** y nadie vota dos veces en el mismo paso. Saltarse
  un paso dejaría aprobado un cambio que nadie miró en ese nivel.
- **Un cambio atado a una ventana debe caber dentro de ella**: si no, se ejecutaría sin la cobertura
  que dice tener.
- **El artefacto es inmutable y direccionado por contenido**. La misma referencia no se republica, ni
  el mismo componente repite versión: si el contenido tras una referencia cambiara, nadie podría
  decir qué hay realmente desplegado.
- **Una herramienta no homologada no produce artefactos desplegables**.
- **Tres puertas antes de desplegar**: cambio aprobado, revisión de preparación con decisión "go" en
  producción y ausencia de congelamiento por error budget.
- **El testigo de "vigente" sólo cambia de manos con un despliegue correcto**. Uno fallido no
  representa lo que está corriendo, y marcarlo como vigente haría mentir al rollback.
- **Revertir crea un despliegue nuevo**, no reescribe el fallido: borrar la evidencia de que hubo que
  volver atrás es perder justo el dato que importa.
- **Un incidente por caída**: mientras el incidente siga vivo, las corridas fallidas siguientes se
  suman a su timeline en lugar de abrir otro.
- **`WARN` no cuenta como fallo**: un aviso no es una caída, y tratarlo como tal llenaría la guardia
  de ruido.
- **Resolver un incidente exige causa raíz y resolución**: cerrarlo sin ellas deja al postmortem sin
  nada que analizar.
- **Un postmortem por incidente y siempre con acciones**. Dos versiones de lo ocurrido no se
  reconcilian, y un postmortem sin acciones no cambia nada.
- **La medición de SLO es idempotente por fin de ventana**: el evaluador reintenta, y medir dos veces
  la misma ventana falsearía el histórico sobre el que se calcula la quema.
- **El cumplimiento se calcula con `BigInt`**: pasar los contadores por `number` perdería precisión
  justo en las ventanas grandes, que son las que deciden si el SLO se cumple.
- **Agotar el presupuesto con la política puesta a congelar bloquea los despliegues**. Seguir
  desplegando mientras el servicio incumple es exactamente lo que el presupuesto existe para evitar.
- **El congelamiento no es una fila propia**: es la lectura del último evento de quema de cada
  política que congela. Así no puede quedarse desincronizado con lo que realmente pasó.
- **Un hallazgo crítico o alto sin resolver impide el "go"**, y lo que queda abierto pasa al backlog
  con dueño en lugar de desaparecer al cerrar la revisión.
- **La versión del runbook es inmutable**: corregir es publicar otra, porque la anterior es la que
  quedó registrada en las ejecuciones ya hechas.
- **El resultado del ejercicio de resiliencia se deriva**, no se declara: dejar que quien ejecuta el
  simulacro se ponga la nota lo vaciaría de valor.

## Permisos

`PLATFORM_ADMIN` cubre el módulo entero. `RELEASE_MANAGER` abre cambios, despliega y cierra
revisiones de preparación. `CHANGE_APPROVER` decide en el CAB. `DEPLOY_PIPELINE` publica artefactos y
despliega. `SRE` revierte, opera incidentes, escribe postmortems, publica y ejecuta runbooks y cierra
ejercicios de resiliencia. `INCIDENT_COMMANDER` conduce el incidente. `CAPACITY_PLANNER` mide
capacidad. `SYSTEM` registra corridas de health check, mediciones de SLO y eventos de quema.

Ninguna ruta es pública.

## Concurrencia

`FOR UPDATE` sobre la ventana de mantenimiento al atarle un cambio, sobre el cambio en toda decisión
o despliegue, sobre el despliegue vigente del par componente+entorno —sólo puede haber uno, y ceder
el testigo y tomarlo deben verse en la misma transacción—, sobre ambos despliegues al revertir, sobre
el incidente vivo del check al derivarlo, sobre el incidente en toda transición, sobre la política de
error budget, el plan de capacidad, la revisión y sus hallazgos, el runbook al mover su versión
vigente, el ejercicio y su objetivo de recuperación. `row_version` aporta bloqueo optimista.

## Logs

`operation: 'ops.<área>.<acción>'`. Nivel `warn` ante rechazo del CAB, despliegue fallido, reversión,
apertura de incidente, SLO incumplido, quema de presupuesto, guardrail de capacidad cruzado, revisión
cerrada con "no go", ejecución de runbook que no completa y ejercicio que incumple su objetivo. Las
mediciones y los eventos de quema no tienen columnas de auditoría —son logs de sólo inserción—, así
que quién los registró se deja en el log.

## Pruebas

`yarn test --testPathPatterns=platform_ops` — 146 pruebas (131 de servicio + 15 de delegación del
controlador).

## Divergencias con el caso de uso v3.9

- **`runbook_versions.checksum_sha256`**: el caso de uso lo declara ("checksum pin"), pero el modelo
  v4.0.7 no materializó la columna. No se inventa: la versión se identifica por
  `UNIQUE(runbook_id, version_number)` y la inmutabilidad se sostiene en no reescribirla nunca.
- **`ops/deployments` y el congelamiento**: el caso de uso lo describe como una marca sobre
  `maintenance_windows`/`change_requests`. Ninguna de las dos tablas tiene columna para eso, así que
  el congelamiento se deriva del último evento de quema (ver arriba).
- **Pasos de aprobación exigidos**: `change_requests` no tiene columna para el número de pasos, así
  que lo declara cada decisión (`requiredApprovalSteps`) en lugar de persistirse en el cambio.
- **Guardrail de capacidad**: `capacity_plans.cost_guardrails_json` es JSON libre; el módulo lee de
  él la clave `maxUtilizationPercent`. La convención está documentada en `services/`.

## Pendiente

- **Outbox** (módulo 35): `ChangeRequestOpened`, `ChangeApproved`, `ArtifactPublished`,
  `DeploymentStarted/Succeeded/RolledBack`, `HealthCheckFailed`, `IncidentOpened`,
  `IncidentStatusChanged`, `PostmortemOpened`, `SloMeasured`, `ErrorBudgetBurn`,
  `DeploymentFreezeActivated`, `CapacityMeasured`, `ReadinessReviewCompleted`,
  `RunbookVersionPublished`, `RunbookExecuted`, `ResilienceExerciseCompleted`.
- **Proyecciones**: `read_models.*` e índices de `search_platform` los alimenta el outbox.
- **Series temporales**: `deployment_frequency_series`, `change_failure_rate_series` (DORA),
  `health_check_latency_series`, `slo_attainment_series`, `error_budget_burn_series`,
  `capacity_utilization_series`, `mttr_series`, `dr_rto_series` viven en `time_series` (módulo 49).
- **Ejecución real del despliegue**: el módulo registra el despliegue y sus puertas; quien mueve
  contenedores es el pipeline, que llama a este endpoint con el desenlace.
- **Cálculo del burn rate**: se registra el ritmo, no se calcula. El evaluador de SLO lo computa
  fuera y lo reporta aquí.
- **Guardia y escalado**: `operational_teams`, `on_call_schedules`, `on_call_shifts` y
  `escalation_policies` están en el esquema pero ningún caso de uso del módulo los opera; su gestión
  llegará con los casos de uso que los declaren.
