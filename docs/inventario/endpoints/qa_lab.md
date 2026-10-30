<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `qa_lab`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 21 (21 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 10 · BAJO 11
- **Tablas distintas que tocan:** 12
- **Respuestas de error y detalle contractual:** `openapi/endpoints/qa-lab.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/admin/qa/defects` | Defectos deduplicados por firma | BAJO | 1 | QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN |
| 2 | GET | `/admin/qa/environments` | Entornos de prueba | BAJO | 1 | QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN |
| 3 | GET | `/admin/qa/flows` | Catálogo de flujos: recorridos del usuario con su cobertura de contrato y de pruebas | BAJO | 5 | QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN |
| 4 | GET | `/admin/qa/flows/{flowId}` | Árbol de decisión de un flujo: pasos, endpoints (declarado o ausente), ramas válidas, límite e inválidas y su último veredicto | BAJO | 5 | QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN |
| 5 | GET | `/admin/qa/runs` | Corridas recientes | BAJO | 1 | QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN |
| 6 | GET | `/admin/qa/runs/{runId}` | Corrida con resultados por caso y veredicto por aserción (valor observado) | BAJO | 4 | QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN |
| 7 | GET | `/admin/qa/suites` | Suites con conteo de casos y última corrida | BAJO | 3 | QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN |
| 8 | GET | `/admin/qa/suites/{suiteId}` | Suite con casos y aserciones | BAJO | 3 | QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN |
| 9 | POST | `/internal/qa/schedules/run-due` | Evaluar programaciones vencidas y encolar sus corridas | MEDIO | 7 | SYSTEM, QA_ADMIN |
| 10 | POST | `/qa/case-results/{resultId}/evaluate` | Evaluar las aserciones y fijar el resultado del caso | MEDIO | 6 | SYSTEM, QA_ENGINEER |
| 11 | POST | `/qa/defects` | Registrar un defecto detectado | MEDIO | 7 | SYSTEM, QA_ENGINEER, QA_ADMIN |
| 12 | PATCH | `/qa/defects/{defectId}` | Triage y transición de estado del defecto | BAJO | 1 | QA_ADMIN, QA_ENGINEER |
| 13 | POST | `/qa/environments` | Registrar un entorno de pruebas gobernado | MEDIO | 2 | QA_ADMIN |
| 14 | POST | `/qa/runs` | Disparar una corrida de pruebas | MEDIO | 5 | QA_ADMIN, QA_ENGINEER, SYSTEM |
| 15 | POST | `/qa/runs/{runId}/artifacts` | Adjuntar un artefacto de evidencia a la corrida | MEDIO | 3 | SYSTEM, QA_ENGINEER |
| 16 | POST | `/qa/runs/{runId}/cases/{caseId}/execute` | Registrar la ejecución del caso con sus payloads | MEDIO | 8 | SYSTEM, QA_ENGINEER |
| 17 | POST | `/qa/runs/{runId}/finalize` | Cerrar la corrida y consolidar totales | BAJO | 2 | SYSTEM, QA_ENGINEER |
| 18 | POST | `/qa/runs/{runId}/link-release` | Enlazar la evidencia de la corrida a un release | BAJO | 2 | RELEASE_MANAGER, QA_ADMIN |
| 19 | POST | `/qa/schedules` | Programar la ejecución automática de la suite | MEDIO | 4 | QA_ADMIN, QA_ENGINEER |
| 20 | POST | `/qa/suites/{suiteId}/cases` | Definir un caso de prueba con sus aserciones | MEDIO | 4 | QA_ADMIN, QA_ENGINEER |
| 21 | POST | `/qa/suites/{suiteId}/publish` | Publicar la suite y activar sus casos | MEDIO | 3 | QA_ADMIN, QA_ENGINEER |

---

## 1. GET /admin/qa/defects

- **Origen:** CONTRATO
- **Nombre:** Defectos deduplicados por firma
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabReadController.defects` — `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:127`

### Qué es y para qué sirve (negocio)

Defectos deduplicados por firma. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /admin/qa/defects` la atiende `QaLabReadController.defects` (src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:127). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN. Delega en `QaLabReadService.listDefects`. Lee qa_lab.test_defects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN | `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:127` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_defects` | LEE | LEE | DIRECTA | QaLabReadController.defects → QaLabReadService.listDefects | `src/modules/qa_lab/application/services/qa-lab-read.service.ts:236` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `status` | query | No | `string` | Código: DEFECT_OPEN, DEFECT_TRIAGED, … |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `ctrl:QaLabReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /admin/qa/environments

- **Origen:** CONTRATO
- **Nombre:** Entornos de prueba
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabReadController.environments` — `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:89`

### Qué es y para qué sirve (negocio)

Entornos de prueba. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /admin/qa/environments` la atiende `QaLabReadController.environments` (src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:89). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN. Delega en `QaLabReadService.listEnvironments`. Lee qa_lab.test_environments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN | `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:89` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_environments` | LEE | LEE | DIRECTA | QaLabReadController.environments → QaLabReadService.listEnvironments | `src/modules/qa_lab/application/services/qa-lab-read.service.ts:32` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `ctrl:QaLabReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /admin/qa/flows

- **Origen:** CONTRATO
- **Nombre:** Catálogo de flujos: recorridos del usuario con su cobertura de contrato y de pruebas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabReadController.listFlows` — `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:134`

### Qué es y para qué sirve (negocio)

Catálogo de flujos: recorridos del usuario con su cobertura de contrato y de pruebas. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /admin/qa/flows` la atiende `QaLabReadController.listFlows` (src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:134). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN. Delega en `QaFlowsService.list`. Lee qa_lab.assertion_results, qa_lab.test_case_results, qa_lab.test_cases, qa_lab.test_runs, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN | `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:134` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.assertion_results` | LEE | LEE | DIRECTA | QaLabReadController.listFlows → QaFlowsService.list → QaFlowsService.loadState | `src/modules/qa_lab/application/services/qa-flows.service.ts:375` |
| `qa_lab.test_case_results` | LEE | LEE | DIRECTA | QaLabReadController.listFlows → QaFlowsService.list → QaFlowsService.loadState | `src/modules/qa_lab/application/services/qa-flows.service.ts:371` |
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabReadController.listFlows → QaFlowsService.list → QaFlowsService.loadState | `src/modules/qa_lab/application/services/qa-flows.service.ts:332` |
| `qa_lab.test_runs` | LEE | LEE | POR_SQL | QaLabReadController.listFlows → QaFlowsService.list → QaFlowsService.loadState | `src/modules/qa_lab/application/services/qa-flows.service.ts:354` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabReadController.listFlows → QaFlowsService.list → QaFlowsService.loadState | `src/modules/qa_lab/application/services/qa-flows.service.ts:325` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `module` | query | No | `string` | Módulo del Registro: «2 · Médico» |
| `search` | query | No | `string` | Texto en el id, el título o el módulo |
| `coverage` | query | No | `string` | SEEDED/NOT_SEEDED: la suite FLOW-<id> existe en qa_lab o no. RAN/NEVER_RAN: tuvo alguna corrida o no. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `ctrl:QaLabReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /admin/qa/flows/{flowId}

- **Origen:** CONTRATO
- **Nombre:** Árbol de decisión de un flujo: pasos, endpoints (declarado o ausente), ramas válidas, límite e inválidas y su último veredicto
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabReadController.flow` — `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:144`

### Qué es y para qué sirve (negocio)

Árbol de decisión de un flujo: pasos, endpoints (declarado o ausente), ramas válidas, límite e inválidas y su último veredicto. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /admin/qa/flows/{flowId}` la atiende `QaLabReadController.flow` (src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:144). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN. Delega en `QaFlowsService.detail`. Lee qa_lab.assertion_results, qa_lab.test_case_results, qa_lab.test_cases, qa_lab.test_runs, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN | `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:144` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.assertion_results` | LEE | LEE | DIRECTA | QaLabReadController.flow → QaFlowsService.detail → QaFlowsService.loadState | `src/modules/qa_lab/application/services/qa-flows.service.ts:375` |
| `qa_lab.test_case_results` | LEE | LEE | DIRECTA | QaLabReadController.flow → QaFlowsService.detail → QaFlowsService.loadState | `src/modules/qa_lab/application/services/qa-flows.service.ts:371` |
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabReadController.flow → QaFlowsService.detail → QaFlowsService.loadState | `src/modules/qa_lab/application/services/qa-flows.service.ts:332` |
| `qa_lab.test_runs` | LEE | LEE | POR_SQL | QaLabReadController.flow → QaFlowsService.detail → QaFlowsService.loadState | `src/modules/qa_lab/application/services/qa-flows.service.ts:354` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabReadController.flow → QaFlowsService.detail → QaFlowsService.loadState | `src/modules/qa_lab/application/services/qa-flows.service.ts:325` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `flowId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Flujo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `ctrl:QaLabReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /admin/qa/runs

- **Origen:** CONTRATO
- **Nombre:** Corridas recientes
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabReadController.runs` — `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:110`

### Qué es y para qué sirve (negocio)

Corridas recientes. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /admin/qa/runs` la atiende `QaLabReadController.runs` (src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:110). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN. Delega en `QaLabReadService.listRuns`. Lee qa_lab.test_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN | `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:110` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabReadController.runs → QaLabReadService.listRuns | `src/modules/qa_lab/application/services/qa-lab-read.service.ts:162` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `suiteId` | query | No | `string` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `ctrl:QaLabReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /admin/qa/runs/{runId}

- **Origen:** CONTRATO
- **Nombre:** Corrida con resultados por caso y veredicto por aserción (valor observado)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabReadController.run` — `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:117`

### Qué es y para qué sirve (negocio)

Corrida con resultados por caso y veredicto por aserción (valor observado). Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /admin/qa/runs/{runId}` la atiende `QaLabReadController.run` (src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:117). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN. Delega en `QaLabReadService.getRun`. Lee qa_lab.assertion_results, qa_lab.test_case_results, qa_lab.test_cases, qa_lab.test_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN | `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:117` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: runId | `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:117` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.assertion_results` | LEE | LEE | DIRECTA | QaLabReadController.run → QaLabReadService.getRun | `src/modules/qa_lab/application/services/qa-lab-read.service.ts:205` |
| `qa_lab.test_case_results` | LEE | LEE | DIRECTA | QaLabReadController.run → QaLabReadService.getRun | `src/modules/qa_lab/application/services/qa-lab-read.service.ts:200` |
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabReadController.run → QaLabReadService.getRun | `src/modules/qa_lab/application/services/qa-lab-read.service.ts:208` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabReadController.run → QaLabReadService.getRun | `src/modules/qa_lab/application/services/qa-lab-read.service.ts:196` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `runId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `ctrl:QaLabReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /admin/qa/suites

- **Origen:** CONTRATO
- **Nombre:** Suites con conteo de casos y última corrida
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabReadController.suites` — `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:96`

### Qué es y para qué sirve (negocio)

Suites con conteo de casos y última corrida. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /admin/qa/suites` la atiende `QaLabReadController.suites` (src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:96). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN. Delega en `QaLabReadService.listSuites`. Lee qa_lab.test_cases, qa_lab.test_runs, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN | `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:96` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabReadController.suites → QaLabReadService.listSuites | `src/modules/qa_lab/application/services/qa-lab-read.service.ts:55` |
| `qa_lab.test_runs` | LEE | LEE | POR_SQL | QaLabReadController.suites → QaLabReadService.listSuites | `src/modules/qa_lab/application/services/qa-lab-read.service.ts:72` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabReadController.suites → QaLabReadService.listSuites | `src/modules/qa_lab/application/services/qa-lab-read.service.ts:50` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `ctrl:QaLabReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /admin/qa/suites/{suiteId}

- **Origen:** CONTRATO
- **Nombre:** Suite con casos y aserciones
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabReadController.suite` — `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:103`

### Qué es y para qué sirve (negocio)

Suite con casos y aserciones. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /admin/qa/suites/{suiteId}` la atiende `QaLabReadController.suite` (src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:103). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN. Delega en `QaLabReadService.getSuite`. Lee qa_lab.test_assertions, qa_lab.test_cases, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN | `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:103` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: suiteId | `src/modules/qa_lab/presentation/controllers/qa-lab-read.controller.ts:103` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_assertions` | LEE | LEE | DIRECTA | QaLabReadController.suite → QaLabReadService.getSuite | `src/modules/qa_lab/application/services/qa-lab-read.service.ts:122` |
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabReadController.suite → QaLabReadService.getSuite | `src/modules/qa_lab/application/services/qa-lab-read.service.ts:117` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabReadController.suite → QaLabReadService.getSuite | `src/modules/qa_lab/application/services/qa-lab-read.service.ts:113` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `suiteId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `ctrl:QaLabReadController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /internal/qa/schedules/run-due

- **Origen:** CONTRATO
- **Nombre:** Evaluar programaciones vencidas y encolar sus corridas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabInternalController.runDueSchedules` — `src/modules/qa_lab/presentation/controllers/qa-lab-internal.controller.ts:36`

### Qué es y para qué sirve (negocio)

Evaluar programaciones vencidas y encolar sus corridas. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /internal/qa/schedules/run-due` la atiende `QaLabInternalController.runDueSchedules` (src/modules/qa_lab/presentation/controllers/qa-lab-internal.controller.ts:36). Exige sesión con alguno de los roles SYSTEM, QA_ADMIN. Valida el cuerpo como `QaLabRunDueSchedulesDto` (1 campo, 0 obligatorios). Delega en `QaCatalogService.runDueSchedules`. Crea filas en qa_lab.test_runs. Actualiza qa_lab.test_schedules. Lee qa_lab.test_cases, qa_lab.test_environments, qa_lab.test_runs, qa_lab.test_schedules, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, QA_ADMIN | `src/modules/qa_lab/presentation/controllers/qa-lab-internal.controller.ts:36` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabInternalController.runDueSchedules → QaCatalogService.runDueSchedules → QaCatalogService.runDueSchedule → QaCatalogRepository.countActiveCases | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:355` |
| `qa_lab.test_environments` | LEE | LEE | DIRECTA | QaLabInternalController.runDueSchedules → QaCatalogService.runDueSchedules → QaCatalogService.runDueSchedule → QaCatalogRepository.findEnvironmentById | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:218` |
| `qa_lab.test_runs` | ESCRIBE | CREA | DIRECTA | QaLabInternalController.runDueSchedules → QaCatalogService.runDueSchedules → QaCatalogService.runDueSchedule → QaRunsRepository.createRun | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:131` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabInternalController.runDueSchedules → QaCatalogService.runDueSchedules → QaCatalogService.runDueSchedule → QaRunsRepository.findRunsInProgress | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:217` |
| `qa_lab.test_schedules` | ESCRIBE | ACTUALIZA | POR_TIPO | QaLabInternalController.runDueSchedules → QaCatalogService.runDueSchedules → QaCatalogService.runDueSchedule | `src/modules/qa_lab/application/services/qa-catalog.service.ts:588` |
| `qa_lab.test_schedules` | LEE | LEE | DIRECTA | QaLabInternalController.runDueSchedules → QaCatalogService.runDueSchedules → QaCatalogRepository.claimDueSchedules | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:490` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabInternalController.runDueSchedules → QaCatalogService.runDueSchedules → QaCatalogService.runDueSchedule → QaCatalogRepository.findSuiteById | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:245` |

### Cuerpo — DTO `QaLabRunDueSchedulesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `limit` | `number` | No | mínimo 1; máximo 100 | — | Tamaño máximo del lote de programaciones a evaluar | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "limit": 20
}
```

</details>

### Respuesta — `Promise<RunDueSchedulesResponseDto>` · DTO `RunDueSchedulesResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `claimed` | `number` | Sí | — | — | Programaciones vencidas reclamadas en este lote | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1194` |
| `queued` | `number` | Sí | — | — | Corridas efectivamente encoladas | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1200` |
| `skipped` | `number` | Sí | — | — | Programaciones vencidas que no llegaron a encolar corrida | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1208` |
| `results` | `array<DueScheduleRunResultDto>` | Sí | — | — | Valor de results mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1214` |
| `results[].scheduleId` | `string` | Sí | formato uuid | — | Identificador asociado a schedule. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1151` |
| `results[].runId` | `string` | No | formato uuid | — | Corrida encolada, si la programación pudo dispararse | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1160` |
| `results[].runNumber` | `string` | No | — | — | Número de la corrida encolada | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1166` |
| `results[].nextRunAt` | `string` | No | formato date-time | — | Próxima marca calculada a partir del cron de la programación | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1175` |
| `results[].skippedReason` | `string` | No | — | — | Motivo por el que esta marca no llegó a encolar una corrida | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1183` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: No se pudo asignar número de corrida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/presentation/controllers/qa-lab-internal.controller.spec.ts:38` |

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `ctrl:QaLabInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /qa/case-results/{resultId}/evaluate

- **Origen:** CONTRATO
- **Nombre:** Evaluar las aserciones y fijar el resultado del caso
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.evaluateResult` — `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:169`

### Qué es y para qué sirve (negocio)

Evaluar las aserciones y fijar el resultado del caso. Caso de uso UC-36-06: Evaluar aserciones. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/case-results/{resultId}/evaluate` la atiende `QaLabController.evaluateResult` (src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:169). Exige sesión con alguno de los roles SYSTEM, QA_ENGINEER. Delega en `QaRunsService.evaluateResult`. Crea filas en qa_lab.assertion_results. Actualiza qa_lab.test_case_results. Lee qa_lab.assertion_results, qa_lab.test_assertions, qa_lab.test_case_results, qa_lab.test_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, QA_ENGINEER | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:169` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: resultId | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:169` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.assertion_results` | ESCRIBE | CREA | DIRECTA | QaLabController.evaluateResult → QaRunsService.evaluateResult → QaRunsRepository.createAssertionResult | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:370` |
| `qa_lab.assertion_results` | LEE | LEE | DIRECTA | QaLabController.evaluateResult → QaRunsService.evaluateResult → QaRunsRepository.countAssertionResults | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:396` |
| `qa_lab.test_assertions` | LEE | LEE | DIRECTA | QaLabController.evaluateResult → QaRunsService.evaluateResult → QaCatalogRepository.findAssertionsByCase | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:426` |
| `qa_lab.test_case_results` | ESCRIBE | ACTUALIZA | POR_TIPO | QaLabController.evaluateResult → QaRunsService.evaluateResult | `src/modules/qa_lab/application/services/qa-runs.service.ts:471` |
| `qa_lab.test_case_results` | LEE | LEE | DIRECTA | QaLabController.evaluateResult → QaRunsService.evaluateResult → QaRunsRepository.findCaseResultById | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:302` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabController.evaluateResult → QaRunsService.evaluateResult → QaRunsRepository.findRunById | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:161` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `resultId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<EvaluateResultResponseDto>` · DTO `EvaluateResultResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:626` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:632` |
| `assertionsTotal` | `number` | Sí | — | — | Valor de assertions total mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:638` |
| `assertionsPassed` | `number` | Sí | — | — | Valor de assertions passed mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:644` |
| `assertionsFailed` | `number` | Sí | — | — | Valor de assertions failed mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:650` |
| `failureSignatureHash` | `string` | No | — | — | Firma del fallo, con la que se deduplican defectos | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:658` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El resultado ya fue evaluado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso falló en transporte: no hay respuesta que evaluar; PreconditionFailedException: El caso no tiene aserciones |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.spec.ts:108` |

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `UC-36-06`

---

## 11. POST /qa/defects

- **Origen:** CONTRATO
- **Nombre:** Registrar un defecto detectado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.registerDefect` — `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:228`

### Qué es y para qué sirve (negocio)

Registrar un defecto detectado. Caso de uso UC-36-09: Registrar y deduplicar defecto. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/defects` la atiende `QaLabController.registerDefect` (src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:228). Exige sesión con alguno de los roles SYSTEM, QA_ENGINEER, QA_ADMIN. Valida el cuerpo como `RegisterDefectDto` (8 campos, 5 obligatorios). Delega en `QaRunsService.registerDefect`. Crea filas en qa_lab.test_defects. Actualiza qa_lab.test_defects. Lee qa_lab.test_case_results, qa_lab.test_cases, qa_lab.test_defects, qa_lab.test_runs, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, QA_ENGINEER, QA_ADMIN | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:228` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_case_results` | LEE | LEE | DIRECTA | QaLabController.registerDefect → QaRunsService.registerDefect → QaRunsRepository.findCaseResultById | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:302` |
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabController.registerDefect → QaRunsService.registerDefect → QaCatalogRepository.findCaseById | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:306` |
| `qa_lab.test_defects` | ESCRIBE | ACTUALIZA | POR_TIPO | QaLabController.registerDefect → QaRunsService.registerDefect | `src/modules/qa_lab/application/services/qa-runs.service.ts:696` |
| `qa_lab.test_defects` | ESCRIBE | CREA | DIRECTA | QaLabController.registerDefect → QaRunsService.registerDefect → QaRunsRepository.createDefect | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:604` |
| `qa_lab.test_defects` | LEE | LEE | DIRECTA | QaLabController.registerDefect → QaRunsService.registerDefect → QaRunsRepository.findDefectBySignatureForUpdate | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:658` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabController.registerDefect → QaRunsService.registerDefect → QaRunsRepository.findRunById | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:161` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabController.registerDefect → QaRunsService.registerDefect → QaCatalogRepository.findSuiteById | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:245` |

### Cuerpo — DTO `RegisterDefectDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `testCaseId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:801` |
| `testCaseResultId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Resultado en el que se detectó | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:812` |
| `failureSignatureHash` | `string` | Sí | longitud máxima 128 | `@IsString()` `@MaxLength(128)` | Firma del fallo; dos fallos con la misma firma son el mismo defecto | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:824` |
| `defectType` | `string` | Sí | valores: BUG, REGRESSION, FLAKY | `@IsIn(DEFECT_TYPES)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:831` |
| `severity` | `string` | Sí | valores: LOW, MEDIUM, HIGH, CRITICAL | `@IsIn(DEFECT_SEVERITIES)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:838` |
| `title` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:846` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:854` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:862` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "testCaseId": "00000000-0000-4000-8000-000000000001",
  "failureSignatureHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "defectType": "BUG",
  "severity": "LOW",
  "title": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "testCaseId": "00000000-0000-4000-8000-000000000001",
  "testCaseResultId": "00000000-0000-4000-8000-000000000001",
  "failureSignatureHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "defectType": "BUG",
  "severity": "LOW",
  "title": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<DefectResponseDto>` · DTO `DefectResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:873` |
| `defectNumber` | `string` | Sí | — | — | Valor de defect number mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:879` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:885` |
| `occurrencesCount` | `number` | Sí | — | — | Veces que se ha visto este mismo fallo | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:891` |
| `deduplicated` | `boolean` | Sí | — | — | true si el defecto ya existía y sólo subió su contador | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:899` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: No se pudo asignar número de defecto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El resultado pertenece a otro caso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.spec.ts:132` |

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `UC-36-09`

---

## 12. PATCH /qa/defects/{defectId}

- **Origen:** CONTRATO
- **Nombre:** Triage y transición de estado del defecto
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.triageDefect` — `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:249`

### Qué es y para qué sirve (negocio)

Triage y transición de estado del defecto. Caso de uso UC-36-10: Triage y transición. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /qa/defects/{defectId}` la atiende `QaLabController.triageDefect` (src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:249). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER. Valida el cuerpo como `TriageDefectDto` (5 campos, 1 obligatorio). Delega en `QaRunsService.triageDefect`. Lee qa_lab.test_defects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:249` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: defectId | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:249` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_defects` | LEE | LEE | DIRECTA | QaLabController.triageDefect → QaRunsService.triageDefect → QaRunsRepository.findDefectForUpdate | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:642` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `defectId` | path | Sí | `string` | — |

### Cuerpo — DTO `TriageDefectDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: OPEN, TRIAGED, IN_PROGRESS, RESOLVED, CLOSED, REJECTED | `@IsIn(DEFECT_STATUSES)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:925` |
| `severity` | `string` | No | valores: LOW, MEDIUM, HIGH, CRITICAL | `@IsOptional()` `@IsIn(DEFECT_SEVERITIES)` | Reclasificar la gravedad | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:936` |
| `assignedToUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Persona a la que se asigna | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:947` |
| `isFlaky` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marcarlo como intermitente | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:955` |
| `externalIssueRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia en el gestor externo | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:967` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "status": "OPEN"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "status": "OPEN",
  "severity": "LOW",
  "assignedToUserId": "00000000-0000-4000-8000-000000000001",
  "isFlaky": true,
  "externalIssueRef": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<TriageDefectResponseDto>` · DTO `TriageDefectResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:978` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:984` |
| `severityConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a severity concept. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:990` |
| `assignedToUserId` | `string` | No | formato uuid | — | Identificador asociado a assigned to user. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:996` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El defecto está en un estado desconocido; PreconditionFailedException: La transición de estado no está permitida; PreconditionFailedException: Un defecto en curso necesita responsable |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.spec.ts:133` |

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `UC-36-10`

---

## 13. POST /qa/environments

- **Origen:** CONTRATO
- **Nombre:** Registrar un entorno de pruebas gobernado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.createEnvironment` — `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:61`

### Qué es y para qué sirve (negocio)

Registrar un entorno de pruebas gobernado. Caso de uso UC-36-01: Registrar entorno gobernado. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/environments` la atiende `QaLabController.createEnvironment` (src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:61). Exige sesión con alguno de los roles QA_ADMIN. Valida el cuerpo como `CreateEnvironmentDto` (7 campos, 3 obligatorios). Delega en `QaCatalogService.createEnvironment`. Crea filas en qa_lab.test_environments. Lee qa_lab.test_environments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_environments` | ESCRIBE | CREA | DIRECTA | QaLabController.createEnvironment → QaCatalogService.createEnvironment → QaCatalogRepository.createEnvironment | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:190` |
| `qa_lab.test_environments` | LEE | LEE | DIRECTA | QaLabController.createEnvironment → QaCatalogService.createEnvironment → QaCatalogRepository.findEnvironmentByCode | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:232` |

### Cuerpo — DTO `CreateEnvironmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del entorno, único | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:40` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:48` |
| `environment` | `string` | Sí | valores: DEV, STAGING, PRODUCTION | `@IsIn(['DEV', 'STAGING', 'PRODUCTION'])` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:55` |
| `baseUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | URL base contra la que apuntan los casos | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:65` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:73` |
| `configJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Configuración del entorno | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:81` |
| `isProductionSafe` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si es false, los payloads capturados se enmascaran: el entorno puede contener datos reales. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:93` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "environment": "DEV"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "environment": "DEV",
  "baseUrl": "valor-ejemplo",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "configJson": {},
  "isProductionSafe": false
}
```

</details>

### Respuesta — `Promise<EnvironmentResponseDto>` · DTO `EnvironmentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:104` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:110` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:116` |
| `isProductionSafe` | `boolean` | Sí | — | — | Valor de is production safe mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:122` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un entorno con ese código |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un entorno de producción no puede declararse seguro para capturar payloads |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.spec.ts:51` |

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `UC-36-01`

---

## 14. POST /qa/runs

- **Origen:** CONTRATO
- **Nombre:** Disparar una corrida de pruebas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.createRun` — `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:125`

### Qué es y para qué sirve (negocio)

Disparar una corrida de pruebas. Caso de uso UC-36-04: Disparar corrida. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/runs` la atiende `QaLabController.createRun` (src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:125). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER, SYSTEM. Valida el cuerpo como `CreateRunDto` (6 campos, 3 obligatorios). Delega en `QaRunsService.createRun`. Crea filas en qa_lab.test_runs. Lee qa_lab.test_cases, qa_lab.test_environments, qa_lab.test_runs, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER, SYSTEM | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:125` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabController.createRun → QaRunsService.createRun → QaCatalogRepository.countActiveCases | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:355` |
| `qa_lab.test_environments` | LEE | LEE | DIRECTA | QaLabController.createRun → QaRunsService.createRun → QaCatalogRepository.findEnvironmentById | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:218` |
| `qa_lab.test_runs` | ESCRIBE | CREA | DIRECTA | QaLabController.createRun → QaRunsService.createRun → QaRunsRepository.createRun | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:131` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabController.createRun → QaRunsService.createRun → QaRunsRepository.findRunsInProgress | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:217` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabController.createRun → QaRunsService.createRun → QaCatalogRepository.findSuiteForUpdate | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:259` |

### Cuerpo — DTO `CreateRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `suiteId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:420` |
| `environmentId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:427` |
| `trigger` | `string` | Sí | valores: MANUAL, SCHEDULED, CI_PUSH, CI_PR, WEBHOOK | `@IsIn(RUN_TRIGGERS)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:434` |
| `gitRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia de git que se está probando | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:446` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:454` |
| `concurrencyPolicy` | `string` | No | valores: ALLOW, FORBID, QUEUE | `@IsOptional()` `@IsIn(['ALLOW', 'FORBID', 'QUEUE'])` | Política ante corridas solapadas de la misma suite | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:466` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "suiteId": "00000000-0000-4000-8000-000000000001",
  "environmentId": "00000000-0000-4000-8000-000000000001",
  "trigger": "MANUAL"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "suiteId": "00000000-0000-4000-8000-000000000001",
  "environmentId": "00000000-0000-4000-8000-000000000001",
  "trigger": "MANUAL",
  "gitRef": "valor-ejemplo",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "concurrencyPolicy": "ALLOW"
}
```

</details>

### Respuesta — `Promise<RunResponseDto>` · DTO `RunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:477` |
| `runNumber` | `string` | Sí | — | — | Número secuencial de la corrida | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:483` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:489` |
| `totalCases` | `number` | Sí | — | — | Casos activos que la corrida ejercitará | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:495` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La suite ya tiene una corrida en marcha; ConflictException: No se pudo asignar número de corrida |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La suite no está publicada; PreconditionFailedException: El entorno no está activo; PreconditionFailedException: La suite no tiene casos activos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.spec.ts:83` |

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `UC-36-04`

---

## 15. POST /qa/runs/{runId}/artifacts

- **Origen:** CONTRATO
- **Nombre:** Adjuntar un artefacto de evidencia a la corrida
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.attachArtifact` — `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:210`

### Qué es y para qué sirve (negocio)

Adjuntar un artefacto de evidencia a la corrida. Caso de uso UC-36-08: Adjuntar evidencia. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/runs/{runId}/artifacts` la atiende `QaLabController.attachArtifact` (src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:210). Exige sesión con alguno de los roles SYSTEM, QA_ENGINEER. Valida el cuerpo como `AttachArtifactDto` (4 campos, 2 obligatorios). Delega en `QaRunsService.attachArtifact`. Crea filas en qa_lab.run_artifacts. Lee qa_lab.test_case_results, qa_lab.test_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, QA_ENGINEER | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:210` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: runId | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:210` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.run_artifacts` | ESCRIBE | CREA | DIRECTA | QaLabController.attachArtifact → QaRunsService.attachArtifact → QaRunsRepository.createArtifact | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:572` |
| `qa_lab.test_case_results` | LEE | LEE | DIRECTA | QaLabController.attachArtifact → QaRunsService.attachArtifact → QaRunsRepository.findCaseResultById | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:302` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabController.attachArtifact → QaRunsService.attachArtifact → QaRunsRepository.findRunById | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:161` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `runId` | path | Sí | `string` | — |

### Cuerpo — DTO `AttachArtifactDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `artifactType` | `string` | Sí | valores: LOG, HAR, SCREENSHOT, JUNIT | `@IsIn(ARTIFACT_TYPES)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:729` |
| `fileId` | `string` | Sí | formato uuid | `@IsUUID()` | Archivo en `common.files` | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:736` |
| `label` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:745` |
| `testCaseResultId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Resultado de caso al que pertenece | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:756` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "artifactType": "LOG",
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "artifactType": "LOG",
  "fileId": "00000000-0000-4000-8000-000000000001",
  "label": "valor-ejemplo",
  "testCaseResultId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ArtifactResponseDto>` · DTO `ArtifactResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:767` |
| `testRunId` | `string` | Sí | formato uuid | — | Identificador asociado a test run. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:773` |
| `artifactTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a artifact type concept. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:779` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El resultado pertenece a otra corrida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.spec.ts:120` |

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `UC-36-08`

---

## 16. POST /qa/runs/{runId}/cases/{caseId}/execute

- **Origen:** CONTRATO
- **Nombre:** Registrar la ejecución del caso con sus payloads
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.executeCase` — `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:146`

### Qué es y para qué sirve (negocio)

Registrar la ejecución del caso con sus payloads. Caso de uso UC-36-05: Capturar ejecución y payloads. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/runs/{runId}/cases/{caseId}/execute` la atiende `QaLabController.executeCase` (src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:146). Exige sesión con alguno de los roles SYSTEM, QA_ENGINEER. Valida el cuerpo como `ExecuteCaseDto` (8 campos, 2 obligatorios). Delega en `QaRunsService.executeCase`. Crea filas en qa_lab.request_payloads, qa_lab.response_payloads, qa_lab.test_case_results. Lee qa_lab.test_case_results, qa_lab.test_cases, qa_lab.test_environments, qa_lab.test_runs, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, QA_ENGINEER | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:146` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: runId, caseId | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:146` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.request_payloads` | ESCRIBE | CREA | DIRECTA | QaLabController.executeCase → QaRunsService.executeCase → QaRunsRepository.createRequestPayload | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:447` |
| `qa_lab.response_payloads` | ESCRIBE | CREA | DIRECTA | QaLabController.executeCase → QaRunsService.executeCase → QaRunsRepository.createResponsePayload | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:515` |
| `qa_lab.test_case_results` | ESCRIBE | CREA | DIRECTA | QaLabController.executeCase → QaRunsService.executeCase → QaRunsRepository.createCaseResult | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:273` |
| `qa_lab.test_case_results` | LEE | LEE | DIRECTA | QaLabController.executeCase → QaRunsService.executeCase → QaRunsRepository.findCaseResult | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:329` |
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabController.executeCase → QaRunsService.executeCase → QaCatalogRepository.findCaseById | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:306` |
| `qa_lab.test_environments` | LEE | LEE | DIRECTA | QaLabController.executeCase → QaRunsService.executeCase → QaCatalogRepository.findEnvironmentById | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:218` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabController.executeCase → QaRunsService.executeCase → QaRunsRepository.findRunForUpdate | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:178` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabController.executeCase → QaRunsService.executeCase → QaCatalogRepository.findSuiteById | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:245` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `runId` | path | Sí | `string` | — |
| `caseId` | path | Sí | `string` | — |

### Cuerpo — DTO `ExecuteCaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `requestBodyJson` | `object` | Sí | — | `@IsObject()` | Cuerpo de la petición tal como se envió | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:509` |
| `requestHeadersJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Cabeceras de la petición | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:517` |
| `targetUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | URL a la que se llamó | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:525` |
| `responseBodyJson` | `object` | Sí | — | `@IsObject()` | Cuerpo de la respuesta tal como llegó | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:532` |
| `responseHeadersJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Cabeceras de la respuesta | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:540` |
| `httpStatus` | `number` | No | mínimo 100; máximo 599 | `@IsOptional()` `@IsInt()` `@Min(100)` `@Max(599)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:550` |
| `latencyMs` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Latencia de la llamada, en milisegundos | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:561` |
| `errorText` | `string` | No | — | `@IsOptional()` `@IsString()` | Error de transporte si la llamada no llegó a completarse | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:571` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "requestBodyJson": {},
  "responseBodyJson": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "requestBodyJson": {},
  "requestHeadersJson": {},
  "targetUrl": "valor-ejemplo",
  "responseBodyJson": {},
  "responseHeadersJson": {},
  "httpStatus": 100,
  "latencyMs": 1,
  "errorText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ExecuteCaseResponseDto>` · DTO `ExecuteCaseResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Resultado del caso creado | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:582` |
| `requestPayloadId` | `string` | Sí | formato uuid | — | Identificador asociado a request payload. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:588` |
| `responsePayloadId` | `string` | Sí | formato uuid | — | Identificador asociado a response payload. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:594` |
| `responseBodyHash` | `string` | Sí | — | — | Hash del cuerpo de la respuesta, para detectar manipulación | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:602` |
| `masked` | `boolean` | Sí | — | — | true si el entorno no es seguro y los payloads se guardaron enmascarados | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:611` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La corrida ya está cerrada; ConflictException: El caso ya se ejecutó en esta corrida |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso pertenece a otra suite |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.spec.ts:93` |

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `UC-36-05`

---

## 17. POST /qa/runs/{runId}/finalize

- **Origen:** CONTRATO
- **Nombre:** Cerrar la corrida y consolidar totales
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.finalizeRun` — `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:190`

### Qué es y para qué sirve (negocio)

Cerrar la corrida y consolidar totales. Caso de uso UC-36-07: Cerrar corrida y consolidar. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/runs/{runId}/finalize` la atiende `QaLabController.finalizeRun` (src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:190). Exige sesión con alguno de los roles SYSTEM, QA_ENGINEER. Delega en `QaRunsService.finalizeRun`. Lee qa_lab.test_case_results, qa_lab.test_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, QA_ENGINEER | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:190` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: runId | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:190` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_case_results` | LEE | LEE | DIRECTA | QaLabController.finalizeRun → QaRunsService.finalizeRun → QaRunsRepository.findResultsByRun | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:337` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabController.finalizeRun → QaRunsService.finalizeRun → QaRunsRepository.findRunForUpdate | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:178` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `runId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<FinalizeRunResponseDto>` · DTO `FinalizeRunResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:673` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:679` |
| `totalCases` | `number` | Sí | — | — | Valor de total cases mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:685` |
| `totalPassed` | `number` | Sí | — | — | Valor de total passed mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:691` |
| `totalFailed` | `number` | Sí | — | — | Valor de total failed mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:697` |
| `totalSkipped` | `number` | Sí | — | — | Valor de total skipped mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:703` |
| `durationMs` | `number` | No | — | — | Duración de la corrida, en milisegundos | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:711` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La corrida ya está cerrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.spec.ts:109` |

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `UC-36-07`

---

## 18. POST /qa/runs/{runId}/link-release

- **Origen:** CONTRATO
- **Nombre:** Enlazar la evidencia de la corrida a un release
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.linkRelease` — `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:287`

### Qué es y para qué sirve (negocio)

Enlazar la evidencia de la corrida a un release. Caso de uso UC-36-12: Enlazar evidencia a release. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:60`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/runs/{runId}/link-release` la atiende `QaLabController.linkRelease` (src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:287). Exige sesión con alguno de los roles RELEASE_MANAGER, QA_ADMIN. Valida el cuerpo como `LinkReleaseDto` (2 campos, 1 obligatorio). Delega en `QaRunsService.linkRelease`. Lee qa_lab.run_artifacts, qa_lab.test_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: RELEASE_MANAGER, QA_ADMIN | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:287` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: runId | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:287` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.run_artifacts` | LEE | LEE | DIRECTA | QaLabController.linkRelease → QaRunsService.linkRelease → QaRunsRepository.findArtifactsByRun | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:591` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabController.linkRelease → QaRunsService.linkRelease → QaRunsRepository.findRunForUpdate | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:178` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `runId` | path | Sí | `string` | — |

### Cuerpo — DTO `LinkReleaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `gitRef` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Referencia de git confirmada del release | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1232` |
| `releaseRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Identificador del release en el módulo de despliegue | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1243` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "gitRef": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "gitRef": "valor-ejemplo",
  "releaseRef": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<LinkReleaseResponseDto>` · DTO `LinkReleaseResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1254` |
| `gitRef` | `string` | Sí | — | — | Valor de git ref mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1260` |
| `artifactCount` | `number` | Sí | — | — | Artefactos que componen el paquete de evidencia | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1268` |
| `evidenceHash` | `string` | Sí | — | — | Sello del paquete: hash de los artefactos enlazados | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1276` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo una corrida que pasó puede respaldar un release; PreconditionFailedException: La corrida no tiene evidencia adjunta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.spec.ts:161` |

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `UC-36-12`

---

## 19. POST /qa/schedules

- **Origen:** CONTRATO
- **Nombre:** Programar la ejecución automática de la suite
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.createSchedule` — `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:270`

### Qué es y para qué sirve (negocio)

Programar la ejecución automática de la suite. Caso de uso UC-36-11: Programar ejecución automática. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/schedules` la atiende `QaLabController.createSchedule` (src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:270). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER. Valida el cuerpo como `CreateTestScheduleDto` (9 campos, 6 obligatorios). Delega en `QaCatalogService.createSchedule`. Crea filas en qa_lab.test_schedules. Lee qa_lab.test_environments, qa_lab.test_schedules, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:270` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_environments` | LEE | LEE | DIRECTA | QaLabController.createSchedule → QaCatalogService.createSchedule → QaCatalogRepository.findEnvironmentById | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:218` |
| `qa_lab.test_schedules` | ESCRIBE | CREA | DIRECTA | QaLabController.createSchedule → QaCatalogService.createSchedule → QaCatalogRepository.createSchedule | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:443` |
| `qa_lab.test_schedules` | LEE | LEE | DIRECTA | QaLabController.createSchedule → QaCatalogService.createSchedule → QaCatalogRepository.findScheduleByCode | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:471` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabController.createSchedule → QaCatalogService.createSchedule → QaCatalogRepository.findSuiteById | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:245` |

### Cuerpo — DTO `CreateTestScheduleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `suiteId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1010` |
| `environmentId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1017` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código, único por suite y entorno | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1028` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1036` |
| `cronExpression` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Expresión cron de cinco campos | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1047` |
| `timezone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1060` |
| `concurrencyPolicy` | `string` | No | valores: ALLOW, FORBID, QUEUE | `@IsOptional()` `@IsIn(['ALLOW', 'FORBID', 'QUEUE'])` | Qué hacer si la suite ya tiene una corrida en marcha | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1072` |
| `firstRunAt` | `string` | Sí | formato date-time | `@IsISO8601()` | Primera corrida. El cliente resuelve el cron; aquí se guarda el instante. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1083` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1091` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "suiteId": "00000000-0000-4000-8000-000000000001",
  "environmentId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "cronExpression": "valor-ejemplo",
  "firstRunAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "suiteId": "00000000-0000-4000-8000-000000000001",
  "environmentId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "cronExpression": "valor-ejemplo",
  "timezone": "UTC",
  "concurrencyPolicy": "FORBID",
  "firstRunAt": "2026-07-31T12:00:00.000Z",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<TestScheduleResponseDto>` · DTO `TestScheduleResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1102` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1108` |
| `nextRunAt` | `string` | Sí | formato date-time | — | Valor de next run at mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1114` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:1120` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una programación con ese código para la suite y el entorno |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La suite no está publicada; PreconditionFailedException: El entorno no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.spec.ts:151` |

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `UC-36-11`

---

## 20. POST /qa/suites/{suiteId}/cases

- **Origen:** CONTRATO
- **Nombre:** Definir un caso de prueba con sus aserciones
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.createTestCase` — `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:82`

### Qué es y para qué sirve (negocio)

Definir un caso de prueba con sus aserciones. Caso de uso UC-36-02: Definir caso con aserciones. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/suites/{suiteId}/cases` la atiende `QaLabController.createTestCase` (src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:82). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER. Valida el cuerpo como `CreateTestCaseDto` (16 campos, 4 obligatorios). Delega en `QaCatalogService.createTestCase`. Crea filas en qa_lab.test_assertions, qa_lab.test_cases. Lee qa_lab.test_cases, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:82` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: suiteId | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:82` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_assertions` | ESCRIBE | CREA | DIRECTA | QaLabController.createTestCase → QaCatalogService.createTestCase → QaCatalogRepository.createAssertion | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:405` |
| `qa_lab.test_cases` | ESCRIBE | CREA | DIRECTA | QaLabController.createTestCase → QaCatalogService.createTestCase → QaCatalogRepository.createCase | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:276` |
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabController.createTestCase → QaCatalogService.createTestCase → QaCatalogRepository.findCaseByCode | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:322` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabController.createTestCase → QaCatalogService.createTestCase → QaCatalogRepository.findSuiteForUpdate | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:259` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `suiteId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateTestCaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del caso, único en la suite | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:220` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:228` |
| `caseType` | `string` | No | valores: HAPPY_PATH, EDGE, NEGATIVE | `@IsOptional()` `@IsIn(CASE_TYPES)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:236` |
| `endpointId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Endpoint del catálogo que se ejercita | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:247` |
| `httpMethod` | `string` | No | valores: GET, POST, PUT, PATCH, DELETE | `@IsOptional()` `@IsIn(HTTP_METHODS)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:255` |
| `requestPath` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:264` |
| `expectedHttpStatus` | `number` | No | mínimo 100; máximo 599 | `@IsOptional()` `@IsInt()` `@Min(100)` `@Max(599)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:274` |
| `setupJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Preparación previa al caso | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:282` |
| `teardownJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Limpieza posterior al caso | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:290` |
| `isCritical` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Un caso crítico que falla tumba la corrida entera | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:301` |
| `assertions` | `array<TestAssertionDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => TestAssertionDto)` | Aserciones del caso, al menos una | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:314` |
| `assertions[].assertionType` | `string` | Sí | valores: STATUS_CODE, JSON_PATH, HEADER, LATENCY | `@IsIn(ASSERTION_TYPES)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:168` |
| `assertions[].jsonPath` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Ruta dentro del cuerpo; obligatoria si el tipo es JSON_PATH | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:180` |
| `assertions[].operator` | `string` | No | valores: EQUALS, NOT_EQUALS, CONTAINS, EXISTS, LESS_THAN, GREATER_THAN | `@IsOptional()` `@IsIn(ASSERTION_OPERATORS)` | — | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:188` |
| `assertions[].expectedValue` | `string` | No | — | `@IsOptional()` `@IsString()` | Valor esperado; no aplica al operador EXISTS | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:198` |
| `assertions[].tolerance` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Tolerancia en comparaciones numéricas | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:206` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "assertions": [
    {
      "assertionType": "STATUS_CODE"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "caseType": "HAPPY_PATH",
  "endpointId": "00000000-0000-4000-8000-000000000001",
  "httpMethod": "GET",
  "requestPath": "valor-ejemplo",
  "expectedHttpStatus": 100,
  "setupJson": {},
  "teardownJson": {},
  "isCritical": false,
  "assertions": [
    {
      "assertionType": "STATUS_CODE",
      "jsonPath": "valor-ejemplo",
      "operator": "EQUALS",
      "expectedValue": "valor-ejemplo",
      "tolerance": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<TestCaseResponseDto>` · DTO `TestCaseResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:325` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:331` |
| `stateConceptId` | `string` | Sí | formato uuid | — | El caso nace en borrador | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:337` |
| `ordinal` | `number` | Sí | — | — | Valor de ordinal mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:343` |
| `assertionIds` | `array<string>` | Sí | formato uuid | — | Valor de assertion ids mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:349` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un caso con ese código en la suite |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una aserción JSON_PATH necesita su ruta; PreconditionFailedException: La aserción necesita valor esperado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.spec.ts:63` |

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `UC-36-02`

---

## 21. POST /qa/suites/{suiteId}/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar la suite y activar sus casos
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.publishSuite` — `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:103`

### Qué es y para qué sirve (negocio)

Publicar la suite y activar sus casos. Caso de uso UC-36-03: Publicar suite y activar casos. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/suites/{suiteId}/publish` la atiende `QaLabController.publishSuite` (src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:103). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER. Valida el cuerpo como `PublishSuiteDto` (1 campo, 0 obligatorios). Delega en `QaCatalogService.publishSuite`. Actualiza qa_lab.test_cases. Lee qa_lab.test_cases, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:103` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: suiteId | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.ts:103` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | QaLabController.publishSuite → QaCatalogService.publishSuite | `src/modules/qa_lab/application/services/qa-catalog.service.ts:329` |
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabController.publishSuite → QaCatalogService.publishSuite → QaCatalogRepository.findCasesBySuiteForUpdate | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:335` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabController.publishSuite → QaCatalogService.publishSuite → QaCatalogRepository.findSuiteForUpdate | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:259` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `suiteId` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishSuiteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `changeNote` | `string` | No | — | `@IsOptional()` `@IsString()` | Qué cambió en esta versión de la suite | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:366` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "changeNote": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<PublishSuiteResponseDto>` · DTO `PublishSuiteResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:377` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:383` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:389` |
| `casesActivated` | `number` | Sí | — | — | Casos que pasaron de borrador a activos | `src/modules/qa_lab/presentation/dto/qa-lab.dto.ts:395` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una suite sin casos no puede publicarse |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_lab.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/presentation/controllers/qa-lab.controller.spec.ts:64` |

### Flujos

- Módulo 36 — Laboratorio de Pruebas y Defectos — etapa `UC-36-03`

---

