<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/qa_lab/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `qa_lab`

**Fuente:** [`src/modules/qa_lab/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/qa_lab/README.md)
· 2 controllers · 2 services · 2 repositories · 13 entidades · 1 DTO

---

# Módulo 36 — Laboratorio de Pruebas y Defectos

Entornos gobernados, suites con casos y aserciones, corridas con evidencia inmutable, defectos
deduplicados por firma de fallo y enlace de evidencia a un release.

## Casos de uso cubiertos (12)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-36-01 | `POST /qa/environments` | Registrar entorno gobernado |
| UC-36-02 | `POST /qa/suites/:suiteId/cases` | Definir caso con aserciones |
| UC-36-03 | `POST /qa/suites/:suiteId/publish` | Publicar suite y activar casos |
| UC-36-04 | `POST /qa/runs` | Disparar corrida |
| UC-36-05 | `POST /qa/runs/:runId/cases/:caseId/execute` | Capturar ejecución y payloads |
| UC-36-06 | `POST /qa/case-results/:resultId/evaluate` | Evaluar aserciones |
| UC-36-07 | `POST /qa/runs/:runId/finalize` | Cerrar corrida y consolidar |
| UC-36-08 | `POST /qa/runs/:runId/artifacts` | Adjuntar evidencia |
| UC-36-09 | `POST /qa/defects` | Registrar y deduplicar defecto |
| UC-36-10 | `PATCH /qa/defects/:defectId` | Triage y transición |
| UC-36-11 | `POST /qa/schedules` | Programar ejecución automática |
| UC-36-12 | `POST /qa/runs/:runId/link-release` | Enlazar evidencia a release |

## Entidades

`test_environments`, `test_suites`, `test_cases`, `test_assertions`, `test_runs`,
`test_case_results`, `assertion_results`, `request_payloads`, `response_payloads`, `run_artifacts`,
`test_defects`, `test_schedules`.

`test_fixtures` existe en el modelo pero no se escribe desde aquí (ver *Pendiente*).

## Flujo general

```
entorno (active, isProductionSafe) ── suite ── casos (draft) + aserciones
                                          │
                                          └─ publish ──> suite active, casos active, versión++

corrida (queued) ── execute caso ──> running + payloads inmutables (hash del original)
                          │                     └─ enmascarados si el entorno no es seguro
                          ├─ evaluate ──> passed | failed + firma del fallo
                          ├─ artifacts ──> log | har | screenshot | junit
                          └─ finalize ──> passed | failed + totales agregados
                                              │
                                              └─ link-release (sólo si passed) ──> sello de evidencia

defecto: firma nueva ──> open        firma repetida ──> occurrences++ (y reabre si estaba resuelto)
         open → triaged → in_progress → resolved → closed
              ↘ rejected        ↘ triaged        ↘ in_progress
```

## Reglas de negocio

- **Un entorno de producción no puede declararse seguro** para capturar payloads: sería la vía por
  la que datos reales de pacientes acabarían en la evidencia de pruebas.
- **Los payloads se enmascaran** cuando el entorno no es seguro: se conserva la forma del cuerpo
  (qué claves viajaron) pero no su contenido. El **hash sella el cuerpo original**, así que
  enmascarar la copia guardada no impide comprobar contra qué se ejecutó.
- **El caso nace en borrador**: publicar la suite lo activa y sube la versión. Lo que se ejecute a
  partir de ahí es ese conjunto.
- **Una aserción necesita algo contra qué comparar**: valor esperado siempre, salvo con el operador
  `EXISTS`, cuya comprobación es la presencia misma. `JSON_PATH` exige además su ruta.
- **La política de concurrencia decide** si una suite puede tener dos corridas a la vez.
- **El número de corrida es secuencial por suite** y el total de casos se deriva de los activos.
- **La evidencia es append-only**: payloads y evaluaciones de aserción se insertan, nunca se
  corrigen. Ejecutar el mismo caso dos veces en una corrida se rechaza, y evaluar dos veces también.
- **Un fallo de transporte no se evalúa**: no llegó a haber respuesta que comprobar.
- **Los totales se agregan de los resultados reales** al cerrar, no de un contador incremental. Los
  casos activos que nadie ejecutó cuentan como omitidos: la corrida debe declarar que no los cubrió.
- **Los defectos se deduplican por firma de fallo**: el mismo fallo repitiéndose sube el contador en
  vez de abrir otro, que es lo que hace manejable la lista. Y un defecto resuelto que vuelve a verse
  **se reabre**: darlo por resuelto contra la evidencia de que sigue fallando sería falso.
- **Las transiciones de triage están acotadas**: no se cierra sin resolver ni rechazar, ni se reabre
  uno cerrado.
- **Un defecto en curso necesita responsable**.
- **Sólo una corrida que pasó respalda un release**, y debe tener evidencia adjunta; el sello se
  calcula sobre los artefactos, que son inmutables.

## Permisos

`QA_ADMIN` cubre el módulo. `QA_ENGINEER` define casos, publica, dispara corridas, adjunta evidencia
y hace triage. `SYSTEM` es el runner: captura ejecuciones, evalúa, cierra corridas y registra
defectos. `RELEASE_MANAGER` enlaza evidencia a un release.

## Concurrencia

`FOR UPDATE` sobre suite (al añadir casos y al publicar), corrida, resultado de caso y defecto. Los
casos de la suite se bloquean como colección al publicar, porque se activan todos a la vez. El
defecto se busca **bloqueado por firma**, que es lo que hace atómica la deduplicación. `row_version`
aporta bloqueo optimista automático.

## Logs

`operation: 'qa.<área>.<acción>'`. Nivel `warn` cuando una corrida termina con fallos. Nunca se
loguean payloads ni valores capturados.

## Pruebas

`yarn test --testPathPatterns=qa_lab` — 58 pruebas de servicio + delegación del controlador.

## Pendiente

- **Ejecución real de la petición**: este módulo captura y consolida evidencia, pero no llama al
  sistema bajo prueba. El runner lo hace y envía lo capturado a
  `POST /runs/:runId/cases/:caseId/execute`.
- **Evaluación real de la aserción**: `evaluateResult` consolida el veredicto por aserción y decide
  el estado del caso; comparar el valor real contra el esperado corresponde al runner, que conoce la
  respuesta. Aquí se marca como aprobada la aserción cuyo valor esperado está declarado — es lo que
  el modelo permite decidir sin ejecutar la petición.
- **Fixtures**: `test_fixtures` (datos de preparación de casos) se poblará cuando el runner los
  necesite; hoy `setup_json` y `teardown_json` del caso cubren el escenario simple.
- **Disparo programado**: `test_schedules` guarda cron y `next_run_at`; el tick que las dispara
  vivirá donde el planificador, igual que en reportes.
- **Enmascarado por registro de campos**: el caso de uso apunta a `system_ops.field_registry` para
  decidir qué campo es sensible. Aquí se enmascara **todo** el cuerpo cuando el entorno no es
  seguro, que es la opción conservadora; afinar por campo llegará con ese registro.
- **Outbox**: `TestRunQueued`, `TestCaseFailed`, `ReleaseEvidenceLinked` se emitirán cuando exista
  el módulo 35.

