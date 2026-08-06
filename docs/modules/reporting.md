<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/reporting/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `reporting`

**Fuente:** [`src/modules/reporting/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/reporting/README.md)
· 1 controllers · 2 services · 2 repositories · 12 entidades · 1 DTO

---

# Módulo 39 — Reportes, Distribución y Tableros

Fuentes de datos gobernadas, definiciones versionadas con parámetros y columnas, corridas
parametrizadas con snapshot, programación y distribución periódica, suscripciones y tableros.

## Casos de uso cubiertos (12)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-39-01 | `POST /reporting/data-sources` | Registrar fuente gobernada |
| UC-39-02 | `POST /reporting/definitions` | Autorar definición con parámetros y columnas |
| UC-39-03 | `POST /reporting/definitions/:id/versions/publish` | Publicar versión |
| UC-39-04 | `POST /reporting/definitions/:id/executions` | Encolar corrida parametrizada |
| UC-39-05 | `POST /reporting/executions/:id/snapshot` | Materializar el artefacto |
| UC-39-06 | `POST /reporting/definitions/:id/schedules` | Programar distribución |
| UC-39-07 | `POST /reporting/scheduler/tick` | Disparar corridas vencidas |
| UC-39-08 | `POST /reporting/executions/:id/distributions` | Crear distribuciones |
| UC-39-09 | `POST /reporting/schedules/:id/subscriptions` | Suscribirse |
| UC-39-10 | `POST /reporting/dashboards` | Componer tablero con widgets |
| UC-39-11 | `POST /reporting/executions/:id/retry` | Reintentar corrida fallida |
| UC-39-12 | `POST /reporting/definitions/:id/deprecate` | Deprecar definición |

## Entidades

`report_data_sources`, `report_definitions`, `report_parameters`, `report_columns`,
`report_versions`, `report_executions`, `report_snapshots`, `report_schedules`,
`report_distributions`, `report_subscriptions`, `dashboards`, `dashboard_widgets`.

## Flujo general

```
fuente (active, gobernada) ── definición (draft) ── versión ──> definición active, vN
                                    │                                   │
                                    │                                   └─ deprecate ──> deprecated
                                    │                                          + schedules suspended
                                    │
     ├─ execution (queued) ── snapshot ──> succeeded (+ retención)
     │        └─ fallo ── retry ──> queued (+ distribuciones re-pendientes)
     │
     ├─ schedule (active) ── tick ──> execution (queued) + ventana avanzada
     │        └─ suscripciones ──> destinatarios del envío
     │
     └─ distribuciones (pending) ──> messaging las envía y las marca sent

tablero (active) ── widgets ──> apuntan a definiciones no deprecadas
```

## Reglas de negocio

- **La fuente es gobernada**: o apunta a un read model declarado o a una vista nombrada. No hay
  consulta libre, y eso es lo que hace que la seguridad por fila (`row_security_json`) tenga dónde
  aplicarse.
- **Un reporte no público exige declarar su permiso**: sin él lo vería cualquiera, que es
  exactamente lo que `required_permission_id` existe para impedir.
- **La definición nace en borrador**: publicar una versión es lo que la activa, y la primera
  publicación estrena la versión 1 que ya lleva la cabecera.
- **La versión congela consulta y parámetros**: ejecutar una corrida vieja tiene que dar lo mismo
  aunque la definición haya cambiado después.
- **Los parámetros se validan antes de encolar**: los obligatorios que faltan se rechazan, los que
  traen valor por defecto se rellenan, y lo que la definición no declara se descarta — aceptarlo
  sería aceptar entrada arbitraria en la consulta.
- **Un snapshot por corrida**: el hash del contenido permite reconocer que el resultado es idéntico
  a otro ya guardado, cosa habitual en reportes programados sobre datos que no cambian.
- **Sólo se distribuye una corrida que terminó con éxito**: enviar una fallida sería mandar un
  reporte vacío o a medias.
- **Una fila de distribución por destinatario y canal**: es lo que hace que reintentar no reenvíe
  dos veces.
- **El tick toma con SKIP LOCKED**: da un disparo por ventana aunque varios ticks se solapen. Una
  programación cuya definición ya no está activa se salta, pero su ventana avanza igual — si no,
  se reintentaría en cada tick para siempre.
- **Suscribirse de nuevo reactiva**, no duplica.
- **Un widget no cuelga de un reporte deprecado**: el tablero mostraría algo que la organización
  decidió dejar de publicar.
- **Deprecar suspende las programaciones** en la misma transacción, para no dejar disparos
  huérfanos.

## Permisos

`REPORTING_ADMIN` cubre el módulo. `DATA_STEWARD` registra fuentes. `REPORT_AUTHOR` autora
definiciones, versiones, programaciones y tableros. `REPORT_VIEWER` ejecuta bajo demanda y se
suscribe. `SYSTEM` materializa snapshots, corre el tick, crea distribuciones y reintenta.

## Concurrencia

`FOR UPDATE` sobre la definición (serializa el versionado y la deprecación), la ejecución y las
programaciones que se suspenden. `FOR UPDATE SKIP LOCKED` sobre las programaciones vencidas del
tick. `row_version` aporta bloqueo optimista automático.

## Logs

`operation: 'reporting.<área>.<acción>'`. Nivel `warn` al deprecar una definición. No se loguean
parámetros de ejecución ni direcciones de destinatarios.

## Pruebas

`yarn test --testPathPatterns=reporting` — 58 pruebas de servicio + delegación del controlador.

## Pendiente

- **Ejecución real de la consulta**: este módulo gobierna el ciclo de vida de la corrida
  (`queued → succeeded | failed`), pero no ejecuta SQL. El worker que lo hace llamará a
  `POST /executions/:id/snapshot` con el artefacto ya en el almacén.
- **Cálculo del cron**: `next_run_at` se recibe en el alta y avanza por intervalo en el tick. La
  resolución de la expresión cron con su zona horaria pertenece al planificador, fuera de la
  transacción.
- **Envío efectivo**: las distribuciones quedan en `pending`; marcarlas `sent` es de messaging
  (módulo 35), consumiendo el outbox.
- **Consent-aware**: el caso de uso pide filtrar por consentimiento. La fuente declara
  `row_security_json` y la definición su permiso; aplicar el filtro pertenece a quien ejecuta la
  consulta.
- **Limpieza por retención**: `expires_at` se fija en el snapshot; el barrido que borra artefactos
  vencidos pertenece al módulo de almacenamiento.
- **Outbox**: `ReportPublished`, `ExecutionQueued`, `ReportDistributed` se emitirán cuando exista el
  módulo 35.

