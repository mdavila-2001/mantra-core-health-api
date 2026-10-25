<!-- AUTOGENERADO por tools/inventario/flujos.mjs. No editar manualmente. -->

# Flujos del módulo `qa_lab`

- **Procesos:** 1 · **Máquinas de estado:** 1
- **Operaciones:** 21 (14 con decisiones propias, 7 sin ellas)
- Inventario de endpoints del módulo: [qa_lab](../endpoints/qa_lab.md)

## Proceso: Módulo 36 — Laboratorio de Pruebas y Defectos

- **Código:** `qa_lab` · **Agrupación:** MIXTO · **Operaciones:** 21
- **Actores:** PLATFORM_ADMIN · QA_ADMIN · QA_ENGINEER · RELEASE_MANAGER · SYSTEM
- **Revisión:** AUTO_DETECTADA
- **Fuentes:** `src/modules/qa_lab/README.md`

### Para qué sirve

Entornos gobernados, suites con casos y aserciones, corridas con evidencia inmutable, defectos deduplicados por firma de fallo y enlace de evidencia a un release.

_Fuente: `src/modules/qa_lab/README.md:3`_

### Flujo general declarado en el README

```text
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

_Fuente: `src/modules/qa_lab/README.md:70`_

### Etapas y operaciones

| Etapa | Descripción | Operación | Quién actúa | Riesgo | Tablas |
|---|---|---|---|---|---|
| `UC-36-01` | Registrar entorno gobernado | POST /qa/environments | QA_ADMIN | MEDIO | 2 |
| `UC-36-02` | Definir caso con aserciones | POST /qa/suites/{suiteId}/cases | QA_ADMIN · QA_ENGINEER | MEDIO | 4 |
| `UC-36-03` | Publicar suite y activar casos | POST /qa/suites/{suiteId}/publish | QA_ADMIN · QA_ENGINEER | MEDIO | 3 |
| `UC-36-04` | Disparar corrida | POST /qa/runs | QA_ADMIN · QA_ENGINEER · SYSTEM | MEDIO | 5 |
| `UC-36-05` | Capturar ejecución y payloads | POST /qa/runs/{runId}/cases/{caseId}/execute | SYSTEM · QA_ENGINEER | MEDIO | 8 |
| `UC-36-06` | Evaluar aserciones | POST /qa/case-results/{resultId}/evaluate | SYSTEM · QA_ENGINEER | MEDIO | 6 |
| `UC-36-07` | Cerrar corrida y consolidar | POST /qa/runs/{runId}/finalize | SYSTEM · QA_ENGINEER | BAJO | 2 |
| `UC-36-08` | Adjuntar evidencia | POST /qa/runs/{runId}/artifacts | SYSTEM · QA_ENGINEER | MEDIO | 3 |
| `UC-36-09` | Registrar y deduplicar defecto | POST /qa/defects | SYSTEM · QA_ENGINEER · QA_ADMIN | MEDIO | 7 |
| `UC-36-10` | Triage y transición | PATCH /qa/defects/{defectId} | QA_ADMIN · QA_ENGINEER | BAJO | 1 |
| `UC-36-11` | Programar ejecución automática | POST /qa/schedules | QA_ADMIN · QA_ENGINEER | MEDIO | 4 |
| `UC-36-12` | Enlazar evidencia a release | POST /qa/runs/{runId}/link-release | RELEASE_MANAGER · QA_ADMIN | BAJO | 2 |
| `ctrl:QaLabInternalController` | Operaciones de QaLabInternalController que el README no asigna a un caso de uso | POST /internal/qa/schedules/run-due | SYSTEM · QA_ADMIN | MEDIO | 7 |
| `ctrl:QaLabReadController` | Operaciones de QaLabReadController que el README no asigna a un caso de uso | GET /admin/qa/defects | QA_ADMIN · QA_ENGINEER · RELEASE_MANAGER · PLATFORM_ADMIN | BAJO | 1 |
|  |  | GET /admin/qa/environments | QA_ADMIN · QA_ENGINEER · RELEASE_MANAGER · PLATFORM_ADMIN | BAJO | 1 |
|  |  | GET /admin/qa/flows | QA_ADMIN · QA_ENGINEER · RELEASE_MANAGER · PLATFORM_ADMIN | BAJO | 5 |
|  |  | GET /admin/qa/flows/{flowId} | QA_ADMIN · QA_ENGINEER · RELEASE_MANAGER · PLATFORM_ADMIN | BAJO | 5 |
|  |  | GET /admin/qa/runs | QA_ADMIN · QA_ENGINEER · RELEASE_MANAGER · PLATFORM_ADMIN | BAJO | 1 |
|  |  | GET /admin/qa/runs/{runId} | QA_ADMIN · QA_ENGINEER · RELEASE_MANAGER · PLATFORM_ADMIN | BAJO | 4 |
|  |  | GET /admin/qa/suites | QA_ADMIN · QA_ENGINEER · RELEASE_MANAGER · PLATFORM_ADMIN | BAJO | 3 |
|  |  | GET /admin/qa/suites/{suiteId} | QA_ADMIN · QA_ENGINEER · RELEASE_MANAGER · PLATFORM_ADMIN | BAJO | 3 |

### Diagrama 1 de 2 — etapas `UC-36-01`, `UC-36-02`, `UC-36-03`…

```mermaid
flowchart LR
  a2(["QA_ADMIN"]):::actor
  a5(["QA_ADMIN · QA_ENGINEER"]):::actor
  a11(["QA_ADMIN · QA_ENGINEER · SYSTEM"]):::actor
  a14(["SYSTEM · QA_ENGINEER"]):::actor
  a25(["SYSTEM · QA_ENGINEER · QA_ADMIN"]):::actor
  a32(["RELEASE_MANAGER · QA_ADMIN"]):::actor
  a34(["SYSTEM · QA_ADMIN"]):::actor
  t3[("qa_lab.test_environments")]:::tabla
  t6[("qa_lab.test_assertions")]:::tabla
  t7[("qa_lab.test_cases")]:::tabla
  t8[("qa_lab.test_suites")]:::tabla
  t12[("qa_lab.test_runs")]:::tabla
  t15[("qa_lab.request_payloads")]:::tabla
  t16[("qa_lab.response_payloads")]:::tabla
  t17[("qa_lab.test_case_results")]:::tabla
  t20[("qa_lab.assertion_results")]:::tabla
  t23[("qa_lab.run_artifacts")]:::tabla
  t26[("qa_lab.test_defects")]:::tabla
  t30[("qa_lab.test_schedules")]:::tabla
  subgraph s0["UC-36-01 · Registrar entorno gobernado"]
    o1["POST /qa/environments"]:::op
  end
  subgraph s1["UC-36-02 · Definir caso con aserciones"]
    o4["POST /qa/suites/{suiteId}/cases"]:::op
  end
  subgraph s2["UC-36-03 · Publicar suite y activar casos"]
    o9["POST /qa/suites/{suiteId}/publish"]:::op
  end
  subgraph s3["UC-36-04 · Disparar corrida"]
    o10["POST /qa/runs"]:::op
  end
  t18[("+2 tablas más")]
  subgraph s4["UC-36-05 · Capturar ejecución y payloads"]
    o13["POST /qa/runs/{runId}/cases/{caseId}/execute"]:::op
  end
  subgraph s5["UC-36-06 · Evaluar aserciones"]
    o19["POST /qa/case-results/{resultId}/evaluate"]:::op
  end
  subgraph s6["UC-36-07 · Cerrar corrida y consolidar"]
    o21["POST /qa/runs/{runId}/finalize"]:::op
  end
  subgraph s7["UC-36-08 · Adjuntar evidencia"]
    o22["POST /qa/runs/{runId}/artifacts"]:::op
  end
  t27[("+1 tablas más")]
  subgraph s8["UC-36-09 · Registrar y deduplicar defecto"]
    o24["POST /qa/defects"]:::op
  end
  subgraph s9["UC-36-10 · Triage y transición"]
    o28["PATCH /qa/defects/{defectId}"]:::op
  end
  subgraph s10["UC-36-11 · Programar ejecución automática"]
    o29["POST /qa/schedules"]:::op
  end
  subgraph s11["UC-36-12 · Enlazar evidencia a release"]
    o31["POST /qa/runs/{runId}/link-release"]:::op
  end
  t35[("+1 tablas más")]
  subgraph s12["ctrl:QaLabInternalController · Operaciones de QaLabInternalController que el RE…"]
    o33["POST /internal/qa/schedules/run-due"]:::op
  end
  a2 --> o1
  o1 -->|"CREA"| t3
  o1 -->|"LEE"| t3
  a5 --> o4
  o4 -->|"CREA"| t6
  o4 -->|"CREA"| t7
  o4 -->|"LEE"| t7
  o4 -->|"LEE"| t8
  a5 --> o9
  o9 -->|"ACTUALIZA"| t7
  o9 -->|"LEE"| t7
  o9 -->|"LEE"| t8
  a11 --> o10
  o10 -->|"LEE"| t7
  o10 -->|"LEE"| t3
  o10 -->|"CREA"| t12
  o10 -->|"LEE"| t12
  o10 -->|"LEE"| t8
  a14 --> o13
  o13 -->|"CREA"| t15
  o13 -->|"CREA"| t16
  o13 -->|"CREA"| t17
  o13 -->|"LEE"| t17
  o13 -->|"LEE"| t7
  o13 -->|"LEE"| t3
  o13 -.-> t18
  a14 --> o19
  o19 -->|"CREA"| t20
  o19 -->|"LEE"| t20
  o19 -->|"LEE"| t6
  o19 -->|"ACTUALIZA"| t17
  o19 -->|"LEE"| t17
  o19 -->|"LEE"| t12
  a14 --> o21
  o21 -->|"LEE"| t17
  o21 -->|"LEE"| t12
  a14 --> o22
  o22 -->|"CREA"| t23
  o22 -->|"LEE"| t17
  o22 -->|"LEE"| t12
  a25 --> o24
  o24 -->|"LEE"| t17
  o24 -->|"LEE"| t7
  o24 -->|"ACTUALIZA"| t26
  o24 -->|"CREA"| t26
  o24 -->|"LEE"| t26
  o24 -->|"LEE"| t12
  o24 -.-> t27
  a5 --> o28
  o28 -->|"LEE"| t26
  a5 --> o29
  o29 -->|"LEE"| t3
  o29 -->|"CREA"| t30
  o29 -->|"LEE"| t30
  o29 -->|"LEE"| t8
  a32 --> o31
  o31 -->|"LEE"| t23
  o31 -->|"LEE"| t12
  a34 --> o33
  o33 -->|"LEE"| t7
  o33 -->|"LEE"| t3
  o33 -->|"CREA"| t12
  o33 -->|"LEE"| t12
  o33 -->|"ACTUALIZA"| t30
  o33 -->|"LEE"| t30
  o33 -.-> t35
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

### Diagrama 2 de 2 — etapas `ctrl:QaLabReadController`

```mermaid
flowchart LR
  a2(["QA_ADMIN · QA_ENGINEER · RELEASE_MANAGER · PLATFORM_ADMIN"]):::actor
  t3[("qa_lab.test_defects")]:::tabla
  t5[("qa_lab.test_environments")]:::tabla
  t7[("qa_lab.assertion_results")]:::tabla
  t8[("qa_lab.test_case_results")]:::tabla
  t9[("qa_lab.test_cases")]:::tabla
  t10[("qa_lab.test_runs")]:::tabla
  t11[("qa_lab.test_suites")]:::tabla
  t17[("qa_lab.test_assertions")]:::tabla
  subgraph s0["ctrl:QaLabReadController · Operaciones de QaLabReadController que el README no…"]
    o1["GET /admin/qa/defects"]:::op
    o4["GET /admin/qa/environments"]:::op
    o6["GET /admin/qa/flows"]:::op
    o12["GET /admin/qa/flows/{flowId}"]:::op
    o13["GET /admin/qa/runs"]:::op
    o14["GET /admin/qa/runs/{runId}"]:::op
    o15["GET /admin/qa/suites"]:::op
    o16["GET /admin/qa/suites/{suiteId}"]:::op
  end
  a2 --> o1
  o1 -->|"LEE"| t3
  a2 --> o4
  o4 -->|"LEE"| t5
  a2 --> o6
  o6 -->|"LEE"| t7
  o6 -->|"LEE"| t8
  o6 -->|"LEE"| t9
  o6 -->|"LEE"| t10
  o6 -->|"LEE"| t11
  a2 --> o12
  o12 -->|"LEE"| t7
  o12 -->|"LEE"| t8
  o12 -->|"LEE"| t9
  o12 -->|"LEE"| t10
  o12 -->|"LEE"| t11
  a2 --> o13
  o13 -->|"LEE"| t10
  a2 --> o14
  o14 -->|"LEE"| t7
  o14 -->|"LEE"| t8
  o14 -->|"LEE"| t9
  o14 -->|"LEE"| t10
  a2 --> o15
  o15 -->|"LEE"| t9
  o15 -->|"LEE"| t10
  o15 -->|"LEE"| t11
  a2 --> o16
  o16 -->|"LEE"| t17
  o16 -->|"LEE"| t9
  o16 -->|"LEE"| t11
  classDef op fill:#fff,stroke:#446
  classDef actor fill:#eef,stroke:#66a
  classDef tabla fill:#ffd,stroke:#aa3
  classDef evento fill:#efe,stroke:#3a3
```

## Máquinas de estado

### Máquina de estados `DEFECT_TRANSITIONS`

Declarada en `src/modules/qa_lab/services/qa-runs.service.ts:106`. Los estados llevan el nombre del identificador del código; no se resuelven al catálogo de conceptos.

```mermaid
stateDiagram-v2
  [*] --> OPEN
  OPEN --> TRIAGED
  OPEN --> REJECTED
  TRIAGED --> IN_PROGRESS : PATCH …/defects/{defectId}
  TRIAGED --> REJECTED
  IN_PROGRESS --> RESOLVED
  IN_PROGRESS --> TRIAGED
  RESOLVED --> CLOSED
  RESOLVED --> IN_PROGRESS : PATCH …/defects/{defectId}
  REJECTED --> [*]
  CLOSED --> [*]
```

**Operaciones que ejercen esta máquina** _(POR_REFERENCIA: el handler alcanza un método que valida contra la tabla; «sin destino nombrado» significa que el estado de destino llega por el cuerpo de la petición)_:

| Operación | Estados de destino que nombra | A través de |
|---|---|---|
| PATCH /qa/defects/{defectId} | IN_PROGRESS | QaRunsService.triageDefect |

## Árbol de decisión por operación

Cada árbol se deriva del código del handler y de los métodos que invoca (hasta 4 niveles). Una rama que no decide, no escribe y no falla se poda. Los accesos y los efectos consecutivos se agrupan en un solo nodo.

### Operaciones con decisiones propias

#### 1. GET /admin/qa/flows/{flowId}

Árbol de decisión de un flujo: pasos, endpoints (declarado o ausente), ramas válidas, límite e inválidas y su último veredicto

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Flujo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a QaFlowsService.detail"]:::llamada
  n2 --> n3
  n4{"!flow"}:::decision
  n3 --> n4
  n5(["404 NOT_FOUND Flujo no encontrado"]):::error
  n4 -->|"sí"| n5
  n6["Llama a QaFlowsService.loadState"]:::llamada
  n4 -->|"no"| n6
  n7[("LEE qa_lab.test_suites · LEE qa_lab.test_cases · LEE qa_lab.test_runs · LEE qa_lab.test_case_results")]:::efecto
  n6 --> n7
  n8(("200 Responde con éxito")):::ok
  n7 --> n8
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 2. POST /internal/qa/schedules/run-due

Evaluar programaciones vencidas y encolar sus corridas

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: No se pudo asignar número de corrida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a QaCatalogService.runDueSchedules"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a QaCatalogRepository.claimDueSchedules"]:::llamada
  n4 --> n5
  n6[("LEE qa_lab.test_schedules")]:::efecto
  n5 --> n6
  n7["Repite: por cada const schedule de due"]:::bucle
  n6 --> n7
  n8["Llama a QaCatalogService.runDueSchedule"]:::llamada
  n7 -->|"cada elemento"| n8
  n9["Llama a QaCatalogRepository.findSuiteById"]:::llamada
  n8 --> n9
  n10[("LEE qa_lab.test_suites")]:::efecto
  n9 --> n10
  n11["Llama a QaCatalogRepository.findEnvironmentById"]:::llamada
  n10 --> n11
  n12[("LEE qa_lab.test_environments")]:::efecto
  n11 --> n12
  n13{"!suite || suite.stateConceptId !== CONCEPTS.SUITE_ACTIVE"}:::decision
  n12 --> n13
  n14{"!sameQaOwner(suite, schedule) || (environment && !sameQaOwner(environment, schedule))"}:::decision
  n13 -->|"no"| n14
  n15{"!environment || environment.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n14 -->|"no"| n15
  n16{"policy === 'FORBID'"}:::decision
  n15 -->|"no"| n16
  n17["Llama a QaRunsRepository.findRunsInProgress"]:::llamada
  n16 -->|"sí"| n17
  n18[("LEE qa_lab.test_runs")]:::efecto
  n17 --> n18
  n19{"!skippedReason"}:::decision
  n18 --> n19
  n16 -->|"no"| n19
  n20["Llama a QaCatalogRepository.countActiveCases"]:::llamada
  n19 -->|"sí"| n20
  n21[("LEE qa_lab.test_cases")]:::efecto
  n20 --> n21
  n22{"totalCases === 0"}:::decision
  n21 --> n22
  n23["Llama a QaCatalogService.nextRunNumber"]:::llamada
  n22 -->|"no"| n23
  n24["Llama a QaRunsRepository.findLastRun"]:::llamada
  n23 --> n24
  n25[("LEE qa_lab.test_runs")]:::efecto
  n24 --> n25
  n26["Repite: ciclo for"]:::bucle
  n25 --> n26
  n27["Llama a QaRunsRepository.findRunByNumber"]:::llamada
  n26 -->|"cada elemento"| n27
  n28[("LEE qa_lab.test_runs")]:::efecto
  n27 --> n28
  n29(["409 CONFLICT No se pudo asignar número de corrida"]):::error
  n28 --> n29
  n26 -->|"al terminar"| n29
  n30["Llama a QaRunsRepository.createRun"]:::llamada
  n31[("CREA qa_lab.test_runs")]:::efecto
  n30 --> n31
  n32{"nextRunAt"}:::decision
  n13 -->|"sí"| n32
  n14 -->|"sí"| n32
  n15 -->|"sí"| n32
  n22 -->|"sí"| n32
  n31 --> n32
  n19 -->|"no"| n32
  n33[("ACTUALIZA qa_lab.test_schedules")]:::efecto
  n32 -->|"sí"| n33
  n34[("ACTUALIZA qa_lab.test_schedules")]:::efecto
  n32 -->|"no"| n34
  n35{"runId"}:::decision
  n33 --> n35
  n34 --> n35
  n36[("ACTUALIZA qa_lab.test_schedules · ACTUALIZA qa_lab.test_schedules")]:::efecto
  n35 -->|"sí"| n36
  n37(("200 Responde con éxito")):::ok
  n36 --> n37
  n35 -->|"no"| n37
  n7 -->|"al terminar"| n37
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 3. POST /qa/case-results/{resultId}/evaluate

Evaluar las aserciones y fijar el resultado del caso

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El resultado ya fue evaluado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso falló en transporte: no hay respuesta que evaluar; PreconditionFailedException: El caso no tiene aserciones |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a QaRunsService.evaluateResult"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a QaRunsRepository.findCaseResultById"]:::llamada
  n4 --> n5
  n6[("LEE qa_lab.test_case_results")]:::efecto
  n5 --> n6
  n7["Llama a QaRunsRepository.findRunById"]:::llamada
  n6 --> n7
  n8[("LEE qa_lab.test_runs")]:::efecto
  n7 --> n8
  n9["Llama a QaRunsRepository.findCaseResultForUpdate"]:::llamada
  n8 --> n9
  n10[("LEE qa_lab.test_case_results")]:::efecto
  n9 --> n10
  n11{"!result"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13["Llama a QaRunsRepository.countAssertionResults"]:::llamada
  n11 -->|"no"| n13
  n14[("LEE qa_lab.assertion_results")]:::efecto
  n13 --> n14
  n15{"alreadyEvaluated › 0"}:::decision
  n14 --> n15
  n16(["409 CONFLICT El resultado ya fue evaluado"]):::error
  n15 -->|"sí"| n16
  n17{"result.errorTypeConceptId === CONCEPTS.ERROR_TRANSPORT"}:::decision
  n15 -->|"no"| n17
  n18(["422 PRECONDITION_FAILED El caso falló en transporte: no hay respuesta que evaluar"]):::error
  n17 -->|"sí"| n18
  n19["Llama a QaCatalogRepository.findAssertionsByCase"]:::llamada
  n17 -->|"no"| n19
  n20[("LEE qa_lab.test_assertions")]:::efecto
  n19 --> n20
  n21{"assertions.length === 0"}:::decision
  n20 --> n21
  n22(["422 PRECONDITION_FAILED El caso no tiene aserciones"]):::error
  n21 -->|"sí"| n22
  n23["Repite: por cada const assertion de assertions"]:::bucle
  n21 -->|"no"| n23
  n24["Llama a QaRunsRepository.createAssertionResult"]:::llamada
  n23 -->|"cada elemento"| n24
  n25[("CREA qa_lab.assertion_results")]:::efecto
  n24 --> n25
  n26[("ACTUALIZA qa_lab.test_case_results · ACTUALIZA qa_lab.test_case_results · ACTUALIZA qa_lab.test_case_results…")]:::efecto
  n25 --> n26
  n23 -->|"al terminar"| n26
  n27{"failed › 0"}:::decision
  n26 --> n27
  n28[("ACTUALIZA qa_lab.test_case_results")]:::efecto
  n27 -->|"sí"| n28
  n29(("200 Responde con éxito")):::ok
  n28 --> n29
  n27 -->|"no"| n29
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 4. POST /qa/defects

Registrar un defecto detectado

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: No se pudo asignar número de defecto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El resultado pertenece a otro caso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a QaRunsService.registerDefect"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a QaCatalogRepository.findCaseById"]:::llamada
  n4 --> n5
  n6[("LEE qa_lab.test_cases")]:::efecto
  n5 --> n6
  n7["Llama a QaCatalogRepository.findSuiteById"]:::llamada
  n6 --> n7
  n8[("LEE qa_lab.test_suites")]:::efecto
  n7 --> n8
  n9{"dto.testCaseResultId"}:::decision
  n8 --> n9
  n10["Llama a QaRunsRepository.findCaseResultById"]:::llamada
  n9 -->|"sí"| n10
  n11[("LEE qa_lab.test_case_results")]:::efecto
  n10 --> n11
  n12["Llama a QaRunsRepository.findRunById"]:::llamada
  n11 --> n12
  n13[("LEE qa_lab.test_runs")]:::efecto
  n12 --> n13
  n14{"linked?.testCaseId !== dto.testCaseId"}:::decision
  n13 --> n14
  n15(["422 PRECONDITION_FAILED El resultado pertenece a otro caso"]):::error
  n14 -->|"sí"| n15
  n16["Llama a QaRunsRepository.findDefectBySignatureForUpdate"]:::llamada
  n14 -->|"no"| n16
  n9 -->|"no"| n16
  n17[("LEE qa_lab.test_defects")]:::efecto
  n16 --> n17
  n18{"existing"}:::decision
  n17 --> n18
  n19[("ACTUALIZA qa_lab.test_defects · ACTUALIZA qa_lab.test_defects · ACTUALIZA qa_lab.test_defects")]:::efecto
  n18 -->|"sí"| n19
  n20{"existing.statusConceptId === CONCEPTS.DEFECT_RESOLVED || existing.statusConceptId === CONCEPTS.DEFECT_CLOSED"}:::decision
  n19 --> n20
  n21[("ACTUALIZA qa_lab.test_defects")]:::efecto
  n20 -->|"sí"| n21
  n22["Llama a QaRunsService.nextDefectNumber"]:::llamada
  n21 --> n22
  n20 -->|"no"| n22
  n18 -->|"no"| n22
  n23["Llama a QaRunsRepository.countDefects"]:::llamada
  n22 --> n23
  n24[("LEE qa_lab.test_defects")]:::efecto
  n23 --> n24
  n25["Repite: ciclo for"]:::bucle
  n24 --> n25
  n26["Llama a QaRunsRepository.findDefectByNumber"]:::llamada
  n25 -->|"cada elemento"| n26
  n27[("LEE qa_lab.test_defects")]:::efecto
  n26 --> n27
  n28(["409 CONFLICT No se pudo asignar número de defecto"]):::error
  n27 --> n28
  n25 -->|"al terminar"| n28
  n29["Llama a QaRunsRepository.createDefect"]:::llamada
  n30[("CREA qa_lab.test_defects")]:::efecto
  n29 --> n30
  n31(("201 Responde con éxito")):::ok
  n30 --> n31
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 5. PATCH /qa/defects/{defectId}

Triage y transición de estado del defecto

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El defecto está en un estado desconocido; PreconditionFailedException: La transición de estado no está permitida; PreconditionFailedException: Un defecto en curso necesita responsable |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a QaRunsService.triageDefect"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a QaRunsRepository.findDefectForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE qa_lab.test_defects")]:::efecto
  n5 --> n6
  n7{"!current"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED El defecto está en un estado desconocido"]):::error
  n7 -->|"sí"| n8
  n9{"current !== dto.status && !DEFECT_TRANSITIONS[current].includes(dto.status)"}:::decision
  n7 -->|"no"| n9
  n10(["422 PRECONDITION_FAILED La transición de estado no está permitida"]):::error
  n9 -->|"sí"| n10
  n11{"dto.status === 'IN_PROGRESS' && !dto.assignedToUserId && !defect.assignedToUserId"}:::decision
  n9 -->|"no"| n11
  n12(["422 PRECONDITION_FAILED Un defecto en curso necesita responsable"]):::error
  n11 -->|"sí"| n12
  n13(("200 Responde con éxito")):::ok
  n11 -->|"no"| n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 6. POST /qa/environments

Registrar un entorno de pruebas gobernado

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un entorno con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un entorno de producción no puede declararse seguro para capturar payloads |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a QaCatalogService.createEnvironment"]:::llamada
  n2 --> n3
  n4["Llama a QaCatalogRepository.findEnvironmentByCode"]:::llamada
  n3 --> n4
  n5[("LEE qa_lab.test_environments")]:::efecto
  n4 --> n5
  n6{"duplicate"}:::decision
  n5 --> n6
  n7(["409 CONFLICT Ya existe un entorno con ese código"]):::error
  n6 -->|"sí"| n7
  n8{"dto.environment === 'PRODUCTION' && dto.isProductionSafe"}:::decision
  n6 -->|"no"| n8
  n9(["422 PRECONDITION_FAILED Un entorno de producción no puede declararse seguro para capturar payloads"]):::error
  n8 -->|"sí"| n9
  n10["Transacción: transactional(…)"]:::transaccion
  n8 -->|"no"| n10
  n11["Llama a QaCatalogRepository.createEnvironment"]:::llamada
  n10 --> n11
  n12[("CREA qa_lab.test_environments")]:::efecto
  n11 --> n12
  n13(("201 Responde con éxito")):::ok
  n12 --> n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 7. POST /qa/runs

Disparar una corrida de pruebas

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La suite ya tiene una corrida en marcha; ConflictException: No se pudo asignar número de corrida |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La suite no está publicada; PreconditionFailedException: El entorno no está activo; PreconditionFailedException: La suite no tiene casos activos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a QaRunsService.createRun"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a QaCatalogRepository.findSuiteForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE qa_lab.test_suites")]:::efecto
  n5 --> n6
  n7{"suite.stateConceptId !== CONCEPTS.SUITE_ACTIVE"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED La suite no está publicada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a QaCatalogRepository.findEnvironmentById"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE qa_lab.test_environments")]:::efecto
  n9 --> n10
  n11{"!sameQaOwner(environment, suite)"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"environment.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED El entorno no está activo"]):::error
  n13 -->|"sí"| n14
  n15{"policy === 'FORBID'"}:::decision
  n13 -->|"no"| n15
  n16["Llama a QaRunsRepository.findRunsInProgress"]:::llamada
  n15 -->|"sí"| n16
  n17[("LEE qa_lab.test_runs")]:::efecto
  n16 --> n17
  n18{"running.length › 0"}:::decision
  n17 --> n18
  n19(["409 CONFLICT La suite ya tiene una corrida en marcha"]):::error
  n18 -->|"sí"| n19
  n20["Llama a QaCatalogRepository.countActiveCases"]:::llamada
  n18 -->|"no"| n20
  n15 -->|"no"| n20
  n21[("LEE qa_lab.test_cases")]:::efecto
  n20 --> n21
  n22{"totalCases === 0"}:::decision
  n21 --> n22
  n23(["422 PRECONDITION_FAILED La suite no tiene casos activos"]):::error
  n22 -->|"sí"| n23
  n24["Llama a QaRunsService.nextRunNumber"]:::llamada
  n22 -->|"no"| n24
  n25["Llama a QaRunsRepository.findLastRun"]:::llamada
  n24 --> n25
  n26[("LEE qa_lab.test_runs")]:::efecto
  n25 --> n26
  n27["Repite: ciclo for"]:::bucle
  n26 --> n27
  n28["Llama a QaRunsRepository.findRunByNumber"]:::llamada
  n27 -->|"cada elemento"| n28
  n29[("LEE qa_lab.test_runs")]:::efecto
  n28 --> n29
  n30(["409 CONFLICT No se pudo asignar número de corrida"]):::error
  n29 --> n30
  n27 -->|"al terminar"| n30
  n31["Llama a QaRunsRepository.createRun"]:::llamada
  n32[("CREA qa_lab.test_runs")]:::efecto
  n31 --> n32
  n33(("201 Responde con éxito")):::ok
  n32 --> n33
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 8. POST /qa/runs/{runId}/artifacts

Adjuntar un artefacto de evidencia a la corrida

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El resultado pertenece a otra corrida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a QaRunsService.attachArtifact"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a QaRunsRepository.findRunById"]:::llamada
  n4 --> n5
  n6[("LEE qa_lab.test_runs")]:::efecto
  n5 --> n6
  n7{"dto.testCaseResultId"}:::decision
  n6 --> n7
  n8["Llama a QaRunsRepository.findCaseResultById"]:::llamada
  n7 -->|"sí"| n8
  n9[("LEE qa_lab.test_case_results")]:::efecto
  n8 --> n9
  n10{"!result"}:::decision
  n9 --> n10
  n11(["↩ (relanza el error capturado)"]):::error
  n10 -->|"sí"| n11
  n12{"result.testRunId !== runId"}:::decision
  n10 -->|"no"| n12
  n13["Llama a QaRunsRepository.findRunById"]:::llamada
  n12 -->|"sí"| n13
  n14[("LEE qa_lab.test_runs")]:::efecto
  n13 --> n14
  n15(["422 PRECONDITION_FAILED El resultado pertenece a otra corrida"]):::error
  n14 --> n15
  n16["Llama a QaRunsRepository.createArtifact"]:::llamada
  n12 -->|"no"| n16
  n7 -->|"no"| n16
  n17[("CREA qa_lab.run_artifacts")]:::efecto
  n16 --> n17
  n18(("201 Responde con éxito")):::ok
  n17 --> n18
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 9. POST /qa/runs/{runId}/cases/{caseId}/execute

Registrar la ejecución del caso con sus payloads

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La corrida ya está cerrada; ConflictException: El caso ya se ejecutó en esta corrida |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso pertenece a otra suite |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a QaRunsService.executeCase"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a QaRunsRepository.findRunForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE qa_lab.test_runs")]:::efecto
  n5 --> n6
  n7{"run.statusConceptId === CONCEPTS.RUN_PASSED || run.statusConceptId === CONCEPTS.RUN_FAILED_STATUS"}:::decision
  n6 --> n7
  n8(["409 CONFLICT La corrida ya está cerrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a QaCatalogRepository.findCaseById"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE qa_lab.test_cases")]:::efecto
  n9 --> n10
  n11{"!testCase"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"testCase.suiteId !== run.suiteId"}:::decision
  n11 -->|"no"| n13
  n14["Llama a QaCatalogRepository.findSuiteById"]:::llamada
  n13 -->|"sí"| n14
  n15[("LEE qa_lab.test_suites")]:::efecto
  n14 --> n15
  n16(["422 PRECONDITION_FAILED El caso pertenece a otra suite"]):::error
  n15 --> n16
  n17["Llama a QaRunsRepository.findCaseResult"]:::llamada
  n13 -->|"no"| n17
  n18[("LEE qa_lab.test_case_results")]:::efecto
  n17 --> n18
  n19{"previous"}:::decision
  n18 --> n19
  n20(["409 CONFLICT El caso ya se ejecutó en esta corrida"]):::error
  n19 -->|"sí"| n20
  n21["Llama a QaCatalogRepository.findEnvironmentById"]:::llamada
  n19 -->|"no"| n21
  n22[("LEE qa_lab.test_environments")]:::efecto
  n21 --> n22
  n23["Llama a QaRunsRepository.createCaseResult"]:::llamada
  n22 --> n23
  n24[("CREA qa_lab.test_case_results")]:::efecto
  n23 --> n24
  n25["Llama a QaRunsRepository.createRequestPayload"]:::llamada
  n24 --> n25
  n26[("CREA qa_lab.request_payloads")]:::efecto
  n25 --> n26
  n27["Llama a QaRunsRepository.createResponsePayload"]:::llamada
  n26 --> n27
  n28[("CREA qa_lab.response_payloads")]:::efecto
  n27 --> n28
  n29(("201 Responde con éxito")):::ok
  n28 --> n29
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 10. POST /qa/runs/{runId}/finalize

Cerrar la corrida y consolidar totales

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La corrida ya está cerrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a QaRunsService.finalizeRun"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a QaRunsRepository.findRunForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE qa_lab.test_runs")]:::efecto
  n5 --> n6
  n7{"run.statusConceptId === CONCEPTS.RUN_PASSED || run.statusConceptId === CONCEPTS.RUN_FAILED_STATUS"}:::decision
  n6 --> n7
  n8(["409 CONFLICT La corrida ya está cerrada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a QaRunsRepository.findResultsByRun"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE qa_lab.test_case_results")]:::efecto
  n9 --> n10
  n11(("200 Responde con éxito")):::ok
  n10 --> n11
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 11. POST /qa/runs/{runId}/link-release

Enlazar la evidencia de la corrida a un release

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo una corrida que pasó puede respaldar un release; PreconditionFailedException: La corrida no tiene evidencia adjunta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a QaRunsService.linkRelease"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a QaRunsRepository.findRunForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE qa_lab.test_runs")]:::efecto
  n5 --> n6
  n7{"run.statusConceptId !== CONCEPTS.RUN_PASSED"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED Sólo una corrida que pasó puede respaldar un release"]):::error
  n7 -->|"sí"| n8
  n9["Llama a QaRunsRepository.findArtifactsByRun"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE qa_lab.run_artifacts")]:::efecto
  n9 --> n10
  n11{"artifacts.length === 0"}:::decision
  n10 --> n11
  n12(["422 PRECONDITION_FAILED La corrida no tiene evidencia adjunta"]):::error
  n11 -->|"sí"| n12
  n13(("200 Responde con éxito")):::ok
  n11 -->|"no"| n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 12. POST /qa/schedules

Programar la ejecución automática de la suite

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una programación con ese código para la suite y el entorno |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La suite no está publicada; PreconditionFailedException: El entorno no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · cuerpo válido (400) · límite de tasa (429)"}}:::acceso
  n1 --> n2
  n3["Llama a QaCatalogService.createSchedule"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a QaCatalogRepository.findSuiteById"]:::llamada
  n4 --> n5
  n6[("LEE qa_lab.test_suites")]:::efecto
  n5 --> n6
  n7{"suite.stateConceptId !== CONCEPTS.SUITE_ACTIVE"}:::decision
  n6 --> n7
  n8(["422 PRECONDITION_FAILED La suite no está publicada"]):::error
  n7 -->|"sí"| n8
  n9["Llama a QaCatalogRepository.findEnvironmentById"]:::llamada
  n7 -->|"no"| n9
  n10[("LEE qa_lab.test_environments")]:::efecto
  n9 --> n10
  n11{"!sameQaOwner(environment, suite)"}:::decision
  n10 --> n11
  n12(["↩ (relanza el error capturado)"]):::error
  n11 -->|"sí"| n12
  n13{"environment.stateConceptId !== CONCEPTS.STATE_ACTIVE"}:::decision
  n11 -->|"no"| n13
  n14(["422 PRECONDITION_FAILED El entorno no está activo"]):::error
  n13 -->|"sí"| n14
  n15["Llama a QaCatalogRepository.findScheduleByCode"]:::llamada
  n13 -->|"no"| n15
  n16[("LEE qa_lab.test_schedules")]:::efecto
  n15 --> n16
  n17{"duplicate"}:::decision
  n16 --> n17
  n18(["409 CONFLICT Ya existe una programación con ese código para la suite y el entorno"]):::error
  n17 -->|"sí"| n18
  n19["Llama a QaCatalogRepository.createSchedule"]:::llamada
  n17 -->|"no"| n19
  n20[("CREA qa_lab.test_schedules")]:::efecto
  n19 --> n20
  n21(("201 Responde con éxito")):::ok
  n20 --> n21
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 13. POST /qa/suites/{suiteId}/cases

Definir un caso de prueba con sus aserciones

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un caso con ese código en la suite |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una aserción JSON_PATH necesita su ruta; PreconditionFailedException: La aserción necesita valor esperado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a QaCatalogService.createTestCase"]:::llamada
  n2 --> n3
  n4["Repite: por cada const assertion de dto.assertions"]:::bucle
  n3 --> n4
  n5{"assertion.assertionType === 'JSON_PATH' && !assertion.jsonPath"}:::decision
  n4 -->|"cada elemento"| n5
  n6(["422 PRECONDITION_FAILED Una aserción JSON_PATH necesita su ruta"]):::error
  n5 -->|"sí"| n6
  n7{"assertion.operator !== 'EXISTS' && !assertion.expectedValue"}:::decision
  n5 -->|"no"| n7
  n8(["422 PRECONDITION_FAILED La aserción necesita valor esperado"]):::error
  n7 -->|"sí"| n8
  n9["Transacción: transactional(…)"]:::transaccion
  n7 -->|"no"| n9
  n4 -->|"al terminar"| n9
  n10["Llama a QaCatalogRepository.findSuiteForUpdate"]:::llamada
  n9 --> n10
  n11[("LEE qa_lab.test_suites")]:::efecto
  n10 --> n11
  n12["Llama a QaCatalogRepository.findCaseByCode"]:::llamada
  n11 --> n12
  n13[("LEE qa_lab.test_cases")]:::efecto
  n12 --> n13
  n14{"duplicate"}:::decision
  n13 --> n14
  n15(["409 CONFLICT Ya existe un caso con ese código en la suite"]):::error
  n14 -->|"sí"| n15
  n16["Llama a QaCatalogRepository.findCasesBySuite"]:::llamada
  n14 -->|"no"| n16
  n17[("LEE qa_lab.test_cases")]:::efecto
  n16 --> n17
  n18["Llama a QaCatalogRepository.createCase"]:::llamada
  n17 --> n18
  n19[("CREA qa_lab.test_cases")]:::efecto
  n18 --> n19
  n20["Llama a QaCatalogRepository.createAssertion"]:::llamada
  n19 --> n20
  n21[("CREA qa_lab.test_assertions")]:::efecto
  n20 --> n21
  n22(("201 Responde con éxito")):::ok
  n21 --> n22
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

#### 14. POST /qa/suites/{suiteId}/publish

Publicar la suite y activar sus casos

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una suite sin casos no puede publicarse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

```mermaid
flowchart TD
  n1(("Solicitud")):::inicio
  n2{{"Acceso: sesión (401) · rol (403) · tenant (403) · parámetros de ruta (400) · cuerpo válido (400) · límite de…"}}:::acceso
  n1 --> n2
  n3["Llama a QaCatalogService.publishSuite"]:::llamada
  n2 --> n3
  n4["Transacción: transactional(…)"]:::transaccion
  n3 --> n4
  n5["Llama a QaCatalogRepository.findSuiteForUpdate"]:::llamada
  n4 --> n5
  n6[("LEE qa_lab.test_suites")]:::efecto
  n5 --> n6
  n7["Llama a QaCatalogRepository.findCasesBySuiteForUpdate"]:::llamada
  n6 --> n7
  n8[("LEE qa_lab.test_cases")]:::efecto
  n7 --> n8
  n9{"cases.length === 0"}:::decision
  n8 --> n9
  n10(["422 PRECONDITION_FAILED Una suite sin casos no puede publicarse"]):::error
  n9 -->|"sí"| n10
  n11["Repite: por cada const testCase de cases"]:::bucle
  n9 -->|"no"| n11
  n12[("ACTUALIZA qa_lab.test_cases")]:::efecto
  n11 -->|"cada elemento"| n12
  n13(("200 Responde con éxito")):::ok
  n12 --> n13
  n11 -->|"al terminar"| n13
  classDef acceso fill:#eef,stroke:#66a
  classDef error fill:#fee,stroke:#c33
  classDef ok fill:#efe,stroke:#3a3
  classDef efecto fill:#ffd,stroke:#aa3
  classDef decision fill:#fff,stroke:#555
  classDef corte fill:#eee,stroke:#999,stroke-dasharray: 4
```

### Operaciones sin decisiones propias

Sólo comprueban el acceso y leen o escriben: no tienen ramas que dibujar. Su detalle está en la ficha de endpoints.

| Operación | Respuestas posibles | Tablas |
|---|---|---|
| GET /admin/qa/defects | 200, 401, 403, 429 | 1 |
| GET /admin/qa/environments | 200, 401, 403, 429 | 1 |
| GET /admin/qa/flows | 200, 401, 403, 429 | 5 |
| GET /admin/qa/runs | 200, 401, 403, 429 | 1 |
| GET /admin/qa/runs/{runId} | 200, 400, 401, 403, 429 | 4 |
| GET /admin/qa/suites | 200, 401, 403, 429 | 3 |
| GET /admin/qa/suites/{suiteId} | 200, 400, 401, 403, 429 | 3 |
