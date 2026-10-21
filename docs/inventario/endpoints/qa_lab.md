<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `qa_lab`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 13 (13 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 13 · BAJO 0
- **Tablas distintas que tocan:** 12
- **Respuestas de error y detalle contractual:** `openapi/endpoints/qa-lab.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/internal/qa/schedules/run-due` | Evaluar programaciones vencidas y encolar sus corridas | MEDIO | 7 | SYSTEM, QA_ADMIN |
| 2 | POST | `/qa/case-results/{resultId}/evaluate` | Evaluar las aserciones y fijar el resultado del caso | MEDIO | 5 | SYSTEM, QA_ENGINEER |
| 3 | POST | `/qa/defects` | Registrar un defecto detectado | MEDIO | 4 | SYSTEM, QA_ENGINEER, QA_ADMIN |
| 4 | PATCH | `/qa/defects/{defectId}` | Triage y transición de estado del defecto | MEDIO | 2 | QA_ADMIN, QA_ENGINEER |
| 5 | POST | `/qa/environments` | Registrar un entorno de pruebas gobernado | MEDIO | 2 | QA_ADMIN |
| 6 | POST | `/qa/runs` | Disparar una corrida de pruebas | MEDIO | 5 | QA_ADMIN, QA_ENGINEER, SYSTEM |
| 7 | POST | `/qa/runs/{runId}/artifacts` | Adjuntar un artefacto de evidencia a la corrida | MEDIO | 3 | SYSTEM, QA_ENGINEER |
| 8 | POST | `/qa/runs/{runId}/cases/{caseId}/execute` | Registrar la ejecución del caso con sus payloads | MEDIO | 8 | SYSTEM, QA_ENGINEER |
| 9 | POST | `/qa/runs/{runId}/finalize` | Cerrar la corrida y consolidar totales | MEDIO | 3 | SYSTEM, QA_ENGINEER |
| 10 | POST | `/qa/runs/{runId}/link-release` | Enlazar la evidencia de la corrida a un release | MEDIO | 3 | RELEASE_MANAGER, QA_ADMIN |
| 11 | POST | `/qa/schedules` | Programar la ejecución automática de la suite | MEDIO | 4 | QA_ADMIN, QA_ENGINEER |
| 12 | POST | `/qa/suites/{suiteId}/cases` | Definir un caso de prueba con sus aserciones | MEDIO | 4 | QA_ADMIN, QA_ENGINEER |
| 13 | POST | `/qa/suites/{suiteId}/publish` | Publicar la suite y activar sus casos | MEDIO | 4 | QA_ADMIN, QA_ENGINEER |

---

## 1. POST /internal/qa/schedules/run-due

- **Origen:** CONTRATO
- **Nombre:** Evaluar programaciones vencidas y encolar sus corridas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabInternalController.runDueSchedules` — `src/modules/qa_lab/controllers/qa-lab-internal.controller.ts:31`

### Qué es y para qué sirve (negocio)

Evaluar programaciones vencidas y encolar sus corridas. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /internal/qa/schedules/run-due` la atiende `QaLabInternalController.runDueSchedules` (src/modules/qa_lab/controllers/qa-lab-internal.controller.ts:31). Exige sesión con alguno de los roles SYSTEM, QA_ADMIN. Valida el cuerpo como `RunDueSchedulesDto` (1 campo, 0 obligatorios). Delega en `QaCatalogService.runDueSchedules`. Crea filas en qa_lab.test_runs. Actualiza qa_lab.test_schedules. Lee qa_lab.test_cases, qa_lab.test_environments, qa_lab.test_runs, qa_lab.test_schedules, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, QA_ADMIN | `src/modules/qa_lab/controllers/qa-lab-internal.controller.ts:31` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabInternalController.runDueSchedules → QaCatalogService.runDueSchedules → QaCatalogService.runDueSchedule → QaCatalogRepository.countActiveCases | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:349` |
| `qa_lab.test_environments` | LEE | LEE | DIRECTA | QaLabInternalController.runDueSchedules → QaCatalogService.runDueSchedules → QaCatalogService.runDueSchedule → QaCatalogRepository.findEnvironmentById | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:218` |
| `qa_lab.test_runs` | ESCRIBE | CREA | DIRECTA | QaLabInternalController.runDueSchedules → QaCatalogService.runDueSchedules → QaCatalogService.runDueSchedule → QaRunsRepository.createRun | `src/modules/qa_lab/repositories/qa-runs.repository.ts:131` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabInternalController.runDueSchedules → QaCatalogService.runDueSchedules → QaCatalogService.runDueSchedule → QaRunsRepository.findRunsInProgress | `src/modules/qa_lab/repositories/qa-runs.repository.ts:211` |
| `qa_lab.test_schedules` | ESCRIBE | ACTUALIZA | POR_TIPO | QaLabInternalController.runDueSchedules → QaCatalogService.runDueSchedules → QaCatalogService.runDueSchedule | `src/modules/qa_lab/services/qa-catalog.service.ts:561` |
| `qa_lab.test_schedules` | LEE | LEE | DIRECTA | QaLabInternalController.runDueSchedules → QaCatalogService.runDueSchedules → QaCatalogRepository.claimDueSchedules | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:483` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabInternalController.runDueSchedules → QaCatalogService.runDueSchedules → QaCatalogService.runDueSchedule → QaCatalogRepository.findSuiteById | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:245` |

### Cuerpo — DTO `RunDueSchedulesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `limit` | `number` | No | mínimo 1; máximo 100 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(100)` | Tamaño máximo del lote de programaciones a evaluar | `src/modules/qa_lab/dto/qa-lab.dto.ts:1142` |

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
| `claimed` | `number` | Sí | — | — | Programaciones vencidas reclamadas en este lote | `src/modules/qa_lab/dto/qa-lab.dto.ts:1194` |
| `queued` | `number` | Sí | — | — | Corridas efectivamente encoladas | `src/modules/qa_lab/dto/qa-lab.dto.ts:1200` |
| `skipped` | `number` | Sí | — | — | Programaciones vencidas que no llegaron a encolar corrida | `src/modules/qa_lab/dto/qa-lab.dto.ts:1208` |
| `results` | `array<DueScheduleRunResultDto>` | Sí | — | — | Valor de results mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:1214` |
| `results[].scheduleId` | `string` | Sí | formato uuid | — | Identificador asociado a schedule. | `src/modules/qa_lab/dto/qa-lab.dto.ts:1151` |
| `results[].runId` | `string` | No | formato uuid | — | Corrida encolada, si la programación pudo dispararse | `src/modules/qa_lab/dto/qa-lab.dto.ts:1160` |
| `results[].runNumber` | `string` | No | — | — | Número de la corrida encolada | `src/modules/qa_lab/dto/qa-lab.dto.ts:1166` |
| `results[].nextRunAt` | `string` | No | formato date-time | — | Próxima marca calculada a partir del cron de la programación | `src/modules/qa_lab/dto/qa-lab.dto.ts:1175` |
| `results[].skippedReason` | `string` | No | — | — | Motivo por el que esta marca no llegó a encolar una corrida | `src/modules/qa_lab/dto/qa-lab.dto.ts:1183` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/controllers/qa-lab-internal.controller.spec.ts:38` |

### Flujos

_Se completa en la fase de flujos._

---

## 2. POST /qa/case-results/{resultId}/evaluate

- **Origen:** CONTRATO
- **Nombre:** Evaluar las aserciones y fijar el resultado del caso
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.evaluateResult` — `src/modules/qa_lab/controllers/qa-lab.controller.ts:139`

### Qué es y para qué sirve (negocio)

Evaluar las aserciones y fijar el resultado del caso. Caso de uso UC-36-06: Evaluar aserciones. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/case-results/{resultId}/evaluate` la atiende `QaLabController.evaluateResult` (src/modules/qa_lab/controllers/qa-lab.controller.ts:139). Exige sesión con alguno de los roles SYSTEM, QA_ENGINEER. Delega en `QaRunsService.evaluateResult`. Crea filas en qa_lab.assertion_results. Actualiza qa_lab.test_case_results. Lee qa_lab.assertion_results, qa_lab.test_assertions, qa_lab.test_case_results.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, QA_ENGINEER | `src/modules/qa_lab/controllers/qa-lab.controller.ts:139` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: resultId | `src/modules/qa_lab/controllers/qa-lab.controller.ts:139` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.assertion_results` | ESCRIBE | CREA | DIRECTA | QaLabController.evaluateResult → QaRunsService.evaluateResult → QaRunsRepository.createAssertionResult | `src/modules/qa_lab/repositories/qa-runs.repository.ts:364` |
| `qa_lab.assertion_results` | LEE | LEE | DIRECTA | QaLabController.evaluateResult → QaRunsService.evaluateResult → QaRunsRepository.countAssertionResults | `src/modules/qa_lab/repositories/qa-runs.repository.ts:390` |
| `qa_lab.test_assertions` | LEE | LEE | DIRECTA | QaLabController.evaluateResult → QaRunsService.evaluateResult → QaCatalogRepository.findAssertionsByCase | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:420` |
| `qa_lab.test_case_results` | ESCRIBE | ACTUALIZA | POR_TIPO | QaLabController.evaluateResult → QaRunsService.evaluateResult | `src/modules/qa_lab/services/qa-runs.service.ts:408` |
| `qa_lab.test_case_results` | LEE | LEE | DIRECTA | QaLabController.evaluateResult → QaRunsService.evaluateResult → QaRunsRepository.findCaseResultForUpdate | `src/modules/qa_lab/repositories/qa-runs.repository.ts:310` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `resultId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<EvaluateResultResponseDto>` · DTO `EvaluateResultResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:626` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/qa_lab/dto/qa-lab.dto.ts:632` |
| `assertionsTotal` | `number` | Sí | — | — | Valor de assertions total mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:638` |
| `assertionsPassed` | `number` | Sí | — | — | Valor de assertions passed mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:644` |
| `assertionsFailed` | `number` | Sí | — | — | Valor de assertions failed mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:650` |
| `failureSignatureHash` | `string` | No | — | — | Firma del fallo, con la que se deduplican defectos | `src/modules/qa_lab/dto/qa-lab.dto.ts:658` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/controllers/qa-lab.controller.spec.ts:108` |

### Flujos

_Se completa en la fase de flujos._

---

## 3. POST /qa/defects

- **Origen:** CONTRATO
- **Nombre:** Registrar un defecto detectado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.registerDefect` — `src/modules/qa_lab/controllers/qa-lab.controller.ts:183`

### Qué es y para qué sirve (negocio)

Registrar un defecto detectado. Caso de uso UC-36-09: Registrar y deduplicar defecto. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/defects` la atiende `QaLabController.registerDefect` (src/modules/qa_lab/controllers/qa-lab.controller.ts:183). Exige sesión con alguno de los roles SYSTEM, QA_ENGINEER, QA_ADMIN. Valida el cuerpo como `RegisterDefectDto` (8 campos, 5 obligatorios). Delega en `QaRunsService.registerDefect`. Crea filas en qa_lab.test_defects. Actualiza qa_lab.test_defects. Lee qa_lab.test_cases, qa_lab.test_defects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, QA_ENGINEER, QA_ADMIN | `src/modules/qa_lab/controllers/qa-lab.controller.ts:183` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabController.registerDefect → QaRunsService.registerDefect → QaCatalogRepository.findCaseById | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:300` |
| `qa_lab.test_defects` | ESCRIBE | ACTUALIZA | POR_TIPO | QaLabController.registerDefect → QaRunsService.registerDefect | `src/modules/qa_lab/services/qa-runs.service.ts:596` |
| `qa_lab.test_defects` | ESCRIBE | CREA | DIRECTA | QaLabController.registerDefect → QaRunsService.registerDefect → QaRunsRepository.createDefect | `src/modules/qa_lab/repositories/qa-runs.repository.ts:598` |
| `qa_lab.test_defects` | LEE | LEE | DIRECTA | QaLabController.registerDefect → QaRunsService.registerDefect → QaRunsRepository.findDefectBySignatureForUpdate | `src/modules/qa_lab/repositories/qa-runs.repository.ts:649` |

### Cuerpo — DTO `RegisterDefectDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `testCaseId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:801` |
| `testCaseResultId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Resultado en el que se detectó | `src/modules/qa_lab/dto/qa-lab.dto.ts:812` |
| `failureSignatureHash` | `string` | Sí | longitud máxima 128 | `@IsString()` `@MaxLength(128)` | Firma del fallo; dos fallos con la misma firma son el mismo defecto | `src/modules/qa_lab/dto/qa-lab.dto.ts:824` |
| `defectType` | `string` | Sí | valores: BUG, REGRESSION, FLAKY | `@IsIn(DEFECT_TYPES)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:831` |
| `severity` | `string` | Sí | valores: LOW, MEDIUM, HIGH, CRITICAL | `@IsIn(DEFECT_SEVERITIES)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:838` |
| `title` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:846` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:854` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:862` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:873` |
| `defectNumber` | `string` | Sí | — | — | Valor de defect number mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:879` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/qa_lab/dto/qa-lab.dto.ts:885` |
| `occurrencesCount` | `number` | Sí | — | — | Veces que se ha visto este mismo fallo | `src/modules/qa_lab/dto/qa-lab.dto.ts:891` |
| `deduplicated` | `boolean` | Sí | — | — | true si el defecto ya existía y sólo subió su contador | `src/modules/qa_lab/dto/qa-lab.dto.ts:899` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/controllers/qa-lab.controller.spec.ts:132` |

### Flujos

_Se completa en la fase de flujos._

---

## 4. PATCH /qa/defects/{defectId}

- **Origen:** CONTRATO
- **Nombre:** Triage y transición de estado del defecto
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.triageDefect` — `src/modules/qa_lab/controllers/qa-lab.controller.ts:199`

### Qué es y para qué sirve (negocio)

Triage y transición de estado del defecto. Caso de uso UC-36-10: Triage y transición. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /qa/defects/{defectId}` la atiende `QaLabController.triageDefect` (src/modules/qa_lab/controllers/qa-lab.controller.ts:199). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER. Valida el cuerpo como `TriageDefectDto` (5 campos, 1 obligatorio). Delega en `QaRunsService.triageDefect`. Actualiza qa_lab.test_defects. Lee qa_lab.test_defects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER | `src/modules/qa_lab/controllers/qa-lab.controller.ts:199` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: defectId | `src/modules/qa_lab/controllers/qa-lab.controller.ts:199` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_defects` | ESCRIBE | ACTUALIZA | POR_TIPO | QaLabController.triageDefect → QaRunsService.triageDefect | `src/modules/qa_lab/services/qa-runs.service.ts:701` |
| `qa_lab.test_defects` | LEE | LEE | DIRECTA | QaLabController.triageDefect → QaRunsService.triageDefect → QaRunsRepository.findDefectForUpdate | `src/modules/qa_lab/repositories/qa-runs.repository.ts:633` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `defectId` | path | Sí | `string` | — |

### Cuerpo — DTO `TriageDefectDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: OPEN, TRIAGED, IN_PROGRESS, RESOLVED, CLOSED, REJECTED | `@IsIn(DEFECT_STATUSES)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:925` |
| `severity` | `string` | No | valores: LOW, MEDIUM, HIGH, CRITICAL | `@IsOptional()` `@IsIn(DEFECT_SEVERITIES)` | Reclasificar la gravedad | `src/modules/qa_lab/dto/qa-lab.dto.ts:936` |
| `assignedToUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Persona a la que se asigna | `src/modules/qa_lab/dto/qa-lab.dto.ts:947` |
| `isFlaky` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marcarlo como intermitente | `src/modules/qa_lab/dto/qa-lab.dto.ts:955` |
| `externalIssueRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia en el gestor externo | `src/modules/qa_lab/dto/qa-lab.dto.ts:967` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:978` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/qa_lab/dto/qa-lab.dto.ts:984` |
| `severityConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a severity concept. | `src/modules/qa_lab/dto/qa-lab.dto.ts:990` |
| `assignedToUserId` | `string` | No | formato uuid | — | Identificador asociado a assigned to user. | `src/modules/qa_lab/dto/qa-lab.dto.ts:996` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/controllers/qa-lab.controller.spec.ts:133` |

### Flujos

_Se completa en la fase de flujos._

---

## 5. POST /qa/environments

- **Origen:** CONTRATO
- **Nombre:** Registrar un entorno de pruebas gobernado
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.createEnvironment` — `src/modules/qa_lab/controllers/qa-lab.controller.ts:56`

### Qué es y para qué sirve (negocio)

Registrar un entorno de pruebas gobernado. Caso de uso UC-36-01: Registrar entorno gobernado. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:10`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/environments` la atiende `QaLabController.createEnvironment` (src/modules/qa_lab/controllers/qa-lab.controller.ts:56). Exige sesión con alguno de los roles QA_ADMIN. Valida el cuerpo como `CreateEnvironmentDto` (7 campos, 3 obligatorios). Delega en `QaCatalogService.createEnvironment`. Crea filas en qa_lab.test_environments. Lee qa_lab.test_environments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN | `src/modules/qa_lab/controllers/qa-lab.controller.ts:56` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_environments` | ESCRIBE | CREA | DIRECTA | QaLabController.createEnvironment → QaCatalogService.createEnvironment → QaCatalogRepository.createEnvironment | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:190` |
| `qa_lab.test_environments` | LEE | LEE | DIRECTA | QaLabController.createEnvironment → QaCatalogService.createEnvironment → QaCatalogRepository.findEnvironmentByCode | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:232` |

### Cuerpo — DTO `CreateEnvironmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del entorno, único | `src/modules/qa_lab/dto/qa-lab.dto.ts:40` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:48` |
| `environment` | `string` | Sí | valores: DEV, STAGING, PRODUCTION | `@IsIn(['DEV', 'STAGING', 'PRODUCTION'])` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:55` |
| `baseUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | URL base contra la que apuntan los casos | `src/modules/qa_lab/dto/qa-lab.dto.ts:65` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:73` |
| `configJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Configuración del entorno | `src/modules/qa_lab/dto/qa-lab.dto.ts:81` |
| `isProductionSafe` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si es false, los payloads capturados se enmascaran: el entorno puede contener datos reales. | `src/modules/qa_lab/dto/qa-lab.dto.ts:93` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:104` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:110` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/qa_lab/dto/qa-lab.dto.ts:116` |
| `isProductionSafe` | `boolean` | Sí | — | — | Valor de is production safe mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:122` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/controllers/qa-lab.controller.spec.ts:51` |

### Flujos

_Se completa en la fase de flujos._

---

## 6. POST /qa/runs

- **Origen:** CONTRATO
- **Nombre:** Disparar una corrida de pruebas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.createRun` — `src/modules/qa_lab/controllers/qa-lab.controller.ts:105`

### Qué es y para qué sirve (negocio)

Disparar una corrida de pruebas. Caso de uso UC-36-04: Disparar corrida. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/runs` la atiende `QaLabController.createRun` (src/modules/qa_lab/controllers/qa-lab.controller.ts:105). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER, SYSTEM. Valida el cuerpo como `CreateRunDto` (6 campos, 3 obligatorios). Delega en `QaRunsService.createRun`. Crea filas en qa_lab.test_runs. Lee qa_lab.test_cases, qa_lab.test_environments, qa_lab.test_runs, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER, SYSTEM | `src/modules/qa_lab/controllers/qa-lab.controller.ts:105` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabController.createRun → QaRunsService.createRun → QaCatalogRepository.countActiveCases | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:349` |
| `qa_lab.test_environments` | LEE | LEE | DIRECTA | QaLabController.createRun → QaRunsService.createRun → QaCatalogRepository.findEnvironmentById | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:218` |
| `qa_lab.test_runs` | ESCRIBE | CREA | DIRECTA | QaLabController.createRun → QaRunsService.createRun → QaRunsRepository.createRun | `src/modules/qa_lab/repositories/qa-runs.repository.ts:131` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabController.createRun → QaRunsService.createRun → QaRunsRepository.findRunsInProgress | `src/modules/qa_lab/repositories/qa-runs.repository.ts:211` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabController.createRun → QaRunsService.createRun → QaCatalogRepository.findSuiteForUpdate | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:253` |

### Cuerpo — DTO `CreateRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `suiteId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:420` |
| `environmentId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:427` |
| `trigger` | `string` | Sí | valores: MANUAL, SCHEDULED, CI_PUSH, CI_PR, WEBHOOK | `@IsIn(RUN_TRIGGERS)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:434` |
| `gitRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia de git que se está probando | `src/modules/qa_lab/dto/qa-lab.dto.ts:446` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:454` |
| `concurrencyPolicy` | `string` | No | valores: ALLOW, FORBID, QUEUE | `@IsOptional()` `@IsIn(['ALLOW', 'FORBID', 'QUEUE'])` | Política ante corridas solapadas de la misma suite | `src/modules/qa_lab/dto/qa-lab.dto.ts:466` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:477` |
| `runNumber` | `string` | Sí | — | — | Número secuencial de la corrida | `src/modules/qa_lab/dto/qa-lab.dto.ts:483` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/qa_lab/dto/qa-lab.dto.ts:489` |
| `totalCases` | `number` | Sí | — | — | Casos activos que la corrida ejercitará | `src/modules/qa_lab/dto/qa-lab.dto.ts:495` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/controllers/qa-lab.controller.spec.ts:83` |

### Flujos

_Se completa en la fase de flujos._

---

## 7. POST /qa/runs/{runId}/artifacts

- **Origen:** CONTRATO
- **Nombre:** Adjuntar un artefacto de evidencia a la corrida
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.attachArtifact` — `src/modules/qa_lab/controllers/qa-lab.controller.ts:170`

### Qué es y para qué sirve (negocio)

Adjuntar un artefacto de evidencia a la corrida. Caso de uso UC-36-08: Adjuntar evidencia. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/runs/{runId}/artifacts` la atiende `QaLabController.attachArtifact` (src/modules/qa_lab/controllers/qa-lab.controller.ts:170). Exige sesión con alguno de los roles SYSTEM, QA_ENGINEER. Valida el cuerpo como `AttachArtifactDto` (4 campos, 2 obligatorios). Delega en `QaRunsService.attachArtifact`. Crea filas en qa_lab.run_artifacts. Lee qa_lab.test_case_results, qa_lab.test_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, QA_ENGINEER | `src/modules/qa_lab/controllers/qa-lab.controller.ts:170` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: runId | `src/modules/qa_lab/controllers/qa-lab.controller.ts:170` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.run_artifacts` | ESCRIBE | CREA | DIRECTA | QaLabController.attachArtifact → QaRunsService.attachArtifact → QaRunsRepository.createArtifact | `src/modules/qa_lab/repositories/qa-runs.repository.ts:566` |
| `qa_lab.test_case_results` | LEE | LEE | DIRECTA | QaLabController.attachArtifact → QaRunsService.attachArtifact → QaRunsRepository.findCaseResultById | `src/modules/qa_lab/repositories/qa-runs.repository.ts:296` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabController.attachArtifact → QaRunsService.attachArtifact → QaRunsRepository.findRunById | `src/modules/qa_lab/repositories/qa-runs.repository.ts:161` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `runId` | path | Sí | `string` | — |

### Cuerpo — DTO `AttachArtifactDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `artifactType` | `string` | Sí | valores: LOG, HAR, SCREENSHOT, JUNIT | `@IsIn(ARTIFACT_TYPES)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:729` |
| `fileId` | `string` | Sí | formato uuid | `@IsUUID()` | Archivo en `common.files` | `src/modules/qa_lab/dto/qa-lab.dto.ts:736` |
| `label` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:745` |
| `testCaseResultId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Resultado de caso al que pertenece | `src/modules/qa_lab/dto/qa-lab.dto.ts:756` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:767` |
| `testRunId` | `string` | Sí | formato uuid | — | Identificador asociado a test run. | `src/modules/qa_lab/dto/qa-lab.dto.ts:773` |
| `artifactTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a artifact type concept. | `src/modules/qa_lab/dto/qa-lab.dto.ts:779` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/controllers/qa-lab.controller.spec.ts:120` |

### Flujos

_Se completa en la fase de flujos._

---

## 8. POST /qa/runs/{runId}/cases/{caseId}/execute

- **Origen:** CONTRATO
- **Nombre:** Registrar la ejecución del caso con sus payloads
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.executeCase` — `src/modules/qa_lab/controllers/qa-lab.controller.ts:121`

### Qué es y para qué sirve (negocio)

Registrar la ejecución del caso con sus payloads. Caso de uso UC-36-05: Capturar ejecución y payloads. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/runs/{runId}/cases/{caseId}/execute` la atiende `QaLabController.executeCase` (src/modules/qa_lab/controllers/qa-lab.controller.ts:121). Exige sesión con alguno de los roles SYSTEM, QA_ENGINEER. Valida el cuerpo como `ExecuteCaseDto` (8 campos, 2 obligatorios). Delega en `QaRunsService.executeCase`. Crea filas en qa_lab.request_payloads, qa_lab.response_payloads, qa_lab.test_case_results. Actualiza qa_lab.test_runs. Lee qa_lab.test_case_results, qa_lab.test_cases, qa_lab.test_environments, qa_lab.test_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, QA_ENGINEER | `src/modules/qa_lab/controllers/qa-lab.controller.ts:121` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: runId, caseId | `src/modules/qa_lab/controllers/qa-lab.controller.ts:121` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.request_payloads` | ESCRIBE | CREA | DIRECTA | QaLabController.executeCase → QaRunsService.executeCase → QaRunsRepository.createRequestPayload | `src/modules/qa_lab/repositories/qa-runs.repository.ts:441` |
| `qa_lab.response_payloads` | ESCRIBE | CREA | DIRECTA | QaLabController.executeCase → QaRunsService.executeCase → QaRunsRepository.createResponsePayload | `src/modules/qa_lab/repositories/qa-runs.repository.ts:509` |
| `qa_lab.test_case_results` | ESCRIBE | CREA | DIRECTA | QaLabController.executeCase → QaRunsService.executeCase → QaRunsRepository.createCaseResult | `src/modules/qa_lab/repositories/qa-runs.repository.ts:267` |
| `qa_lab.test_case_results` | LEE | LEE | DIRECTA | QaLabController.executeCase → QaRunsService.executeCase → QaRunsRepository.findCaseResult | `src/modules/qa_lab/repositories/qa-runs.repository.ts:323` |
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabController.executeCase → QaRunsService.executeCase → QaCatalogRepository.findCaseById | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:300` |
| `qa_lab.test_environments` | LEE | LEE | DIRECTA | QaLabController.executeCase → QaRunsService.executeCase → QaCatalogRepository.findEnvironmentById | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:218` |
| `qa_lab.test_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | QaLabController.executeCase → QaRunsService.executeCase | `src/modules/qa_lab/services/qa-runs.service.ts:326` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabController.executeCase → QaRunsService.executeCase → QaRunsRepository.findRunForUpdate | `src/modules/qa_lab/repositories/qa-runs.repository.ts:172` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `runId` | path | Sí | `string` | — |
| `caseId` | path | Sí | `string` | — |

### Cuerpo — DTO `ExecuteCaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `requestBodyJson` | `object` | Sí | — | `@IsObject()` | Cuerpo de la petición tal como se envió | `src/modules/qa_lab/dto/qa-lab.dto.ts:509` |
| `requestHeadersJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Cabeceras de la petición | `src/modules/qa_lab/dto/qa-lab.dto.ts:517` |
| `targetUrl` | `string` | No | — | `@IsOptional()` `@IsString()` | URL a la que se llamó | `src/modules/qa_lab/dto/qa-lab.dto.ts:525` |
| `responseBodyJson` | `object` | Sí | — | `@IsObject()` | Cuerpo de la respuesta tal como llegó | `src/modules/qa_lab/dto/qa-lab.dto.ts:532` |
| `responseHeadersJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Cabeceras de la respuesta | `src/modules/qa_lab/dto/qa-lab.dto.ts:540` |
| `httpStatus` | `number` | No | mínimo 100; máximo 599 | `@IsOptional()` `@IsInt()` `@Min(100)` `@Max(599)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:550` |
| `latencyMs` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Latencia de la llamada, en milisegundos | `src/modules/qa_lab/dto/qa-lab.dto.ts:561` |
| `errorText` | `string` | No | — | `@IsOptional()` `@IsString()` | Error de transporte si la llamada no llegó a completarse | `src/modules/qa_lab/dto/qa-lab.dto.ts:571` |

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
| `id` | `string` | Sí | formato uuid | — | Resultado del caso creado | `src/modules/qa_lab/dto/qa-lab.dto.ts:582` |
| `requestPayloadId` | `string` | Sí | formato uuid | — | Identificador asociado a request payload. | `src/modules/qa_lab/dto/qa-lab.dto.ts:588` |
| `responsePayloadId` | `string` | Sí | formato uuid | — | Identificador asociado a response payload. | `src/modules/qa_lab/dto/qa-lab.dto.ts:594` |
| `responseBodyHash` | `string` | Sí | — | — | Hash del cuerpo de la respuesta, para detectar manipulación | `src/modules/qa_lab/dto/qa-lab.dto.ts:602` |
| `masked` | `boolean` | Sí | — | — | true si el entorno no es seguro y los payloads se guardaron enmascarados | `src/modules/qa_lab/dto/qa-lab.dto.ts:611` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/controllers/qa-lab.controller.spec.ts:93` |

### Flujos

_Se completa en la fase de flujos._

---

## 9. POST /qa/runs/{runId}/finalize

- **Origen:** CONTRATO
- **Nombre:** Cerrar la corrida y consolidar totales
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.finalizeRun` — `src/modules/qa_lab/controllers/qa-lab.controller.ts:155`

### Qué es y para qué sirve (negocio)

Cerrar la corrida y consolidar totales. Caso de uso UC-36-07: Cerrar corrida y consolidar. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/runs/{runId}/finalize` la atiende `QaLabController.finalizeRun` (src/modules/qa_lab/controllers/qa-lab.controller.ts:155). Exige sesión con alguno de los roles SYSTEM, QA_ENGINEER. Delega en `QaRunsService.finalizeRun`. Actualiza qa_lab.test_runs. Lee qa_lab.test_case_results, qa_lab.test_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, QA_ENGINEER | `src/modules/qa_lab/controllers/qa-lab.controller.ts:155` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: runId | `src/modules/qa_lab/controllers/qa-lab.controller.ts:155` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_case_results` | LEE | LEE | DIRECTA | QaLabController.finalizeRun → QaRunsService.finalizeRun → QaRunsRepository.findResultsByRun | `src/modules/qa_lab/repositories/qa-runs.repository.ts:331` |
| `qa_lab.test_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | QaLabController.finalizeRun → QaRunsService.finalizeRun | `src/modules/qa_lab/services/qa-runs.service.ts:480` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabController.finalizeRun → QaRunsService.finalizeRun → QaRunsRepository.findRunForUpdate | `src/modules/qa_lab/repositories/qa-runs.repository.ts:172` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `runId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<FinalizeRunResponseDto>` · DTO `FinalizeRunResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:673` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/qa_lab/dto/qa-lab.dto.ts:679` |
| `totalCases` | `number` | Sí | — | — | Valor de total cases mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:685` |
| `totalPassed` | `number` | Sí | — | — | Valor de total passed mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:691` |
| `totalFailed` | `number` | Sí | — | — | Valor de total failed mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:697` |
| `totalSkipped` | `number` | Sí | — | — | Valor de total skipped mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:703` |
| `durationMs` | `number` | No | — | — | Duración de la corrida, en milisegundos | `src/modules/qa_lab/dto/qa-lab.dto.ts:711` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/controllers/qa-lab.controller.spec.ts:109` |

### Flujos

_Se completa en la fase de flujos._

---

## 10. POST /qa/runs/{runId}/link-release

- **Origen:** CONTRATO
- **Nombre:** Enlazar la evidencia de la corrida a un release
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.linkRelease` — `src/modules/qa_lab/controllers/qa-lab.controller.ts:227`

### Qué es y para qué sirve (negocio)

Enlazar la evidencia de la corrida a un release. Caso de uso UC-36-12: Enlazar evidencia a release. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/runs/{runId}/link-release` la atiende `QaLabController.linkRelease` (src/modules/qa_lab/controllers/qa-lab.controller.ts:227). Exige sesión con alguno de los roles RELEASE_MANAGER, QA_ADMIN. Valida el cuerpo como `LinkReleaseDto` (2 campos, 1 obligatorio). Delega en `QaRunsService.linkRelease`. Actualiza qa_lab.test_runs. Lee qa_lab.run_artifacts, qa_lab.test_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: RELEASE_MANAGER, QA_ADMIN | `src/modules/qa_lab/controllers/qa-lab.controller.ts:227` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: runId | `src/modules/qa_lab/controllers/qa-lab.controller.ts:227` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.run_artifacts` | LEE | LEE | DIRECTA | QaLabController.linkRelease → QaRunsService.linkRelease → QaRunsRepository.findArtifactsByRun | `src/modules/qa_lab/repositories/qa-runs.repository.ts:585` |
| `qa_lab.test_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | QaLabController.linkRelease → QaRunsService.linkRelease | `src/modules/qa_lab/services/qa-runs.service.ts:760` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaLabController.linkRelease → QaRunsService.linkRelease → QaRunsRepository.findRunForUpdate | `src/modules/qa_lab/repositories/qa-runs.repository.ts:172` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `runId` | path | Sí | `string` | — |

### Cuerpo — DTO `LinkReleaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `gitRef` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Referencia de git confirmada del release | `src/modules/qa_lab/dto/qa-lab.dto.ts:1232` |
| `releaseRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Identificador del release en el módulo de despliegue | `src/modules/qa_lab/dto/qa-lab.dto.ts:1243` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:1254` |
| `gitRef` | `string` | Sí | — | — | Valor de git ref mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:1260` |
| `artifactCount` | `number` | Sí | — | — | Artefactos que componen el paquete de evidencia | `src/modules/qa_lab/dto/qa-lab.dto.ts:1268` |
| `evidenceHash` | `string` | Sí | — | — | Sello del paquete: hash de los artefactos enlazados | `src/modules/qa_lab/dto/qa-lab.dto.ts:1276` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/controllers/qa-lab.controller.spec.ts:161` |

### Flujos

_Se completa en la fase de flujos._

---

## 11. POST /qa/schedules

- **Origen:** CONTRATO
- **Nombre:** Programar la ejecución automática de la suite
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.createSchedule` — `src/modules/qa_lab/controllers/qa-lab.controller.ts:215`

### Qué es y para qué sirve (negocio)

Programar la ejecución automática de la suite. Caso de uso UC-36-11: Programar ejecución automática. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/schedules` la atiende `QaLabController.createSchedule` (src/modules/qa_lab/controllers/qa-lab.controller.ts:215). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER. Valida el cuerpo como `CreateTestScheduleDto` (9 campos, 6 obligatorios). Delega en `QaCatalogService.createSchedule`. Crea filas en qa_lab.test_schedules. Lee qa_lab.test_environments, qa_lab.test_schedules, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER | `src/modules/qa_lab/controllers/qa-lab.controller.ts:215` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_environments` | LEE | LEE | DIRECTA | QaLabController.createSchedule → QaCatalogService.createSchedule → QaCatalogRepository.findEnvironmentById | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:218` |
| `qa_lab.test_schedules` | ESCRIBE | CREA | DIRECTA | QaLabController.createSchedule → QaCatalogService.createSchedule → QaCatalogRepository.createSchedule | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:437` |
| `qa_lab.test_schedules` | LEE | LEE | DIRECTA | QaLabController.createSchedule → QaCatalogService.createSchedule → QaCatalogRepository.findScheduleByCode | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:465` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabController.createSchedule → QaCatalogService.createSchedule → QaCatalogRepository.findSuiteById | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:245` |

### Cuerpo — DTO `CreateTestScheduleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `suiteId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:1010` |
| `environmentId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:1017` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código, único por suite y entorno | `src/modules/qa_lab/dto/qa-lab.dto.ts:1028` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:1036` |
| `cronExpression` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Expresión cron de cinco campos | `src/modules/qa_lab/dto/qa-lab.dto.ts:1047` |
| `timezone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA | `src/modules/qa_lab/dto/qa-lab.dto.ts:1060` |
| `concurrencyPolicy` | `string` | No | valores: ALLOW, FORBID, QUEUE | `@IsOptional()` `@IsIn(['ALLOW', 'FORBID', 'QUEUE'])` | Qué hacer si la suite ya tiene una corrida en marcha | `src/modules/qa_lab/dto/qa-lab.dto.ts:1072` |
| `firstRunAt` | `string` | Sí | formato date-time | `@IsISO8601()` | Primera corrida. El cliente resuelve el cron; aquí se guarda el instante. | `src/modules/qa_lab/dto/qa-lab.dto.ts:1083` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:1091` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:1102` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:1108` |
| `nextRunAt` | `string` | Sí | formato date-time | — | Valor de next run at mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:1114` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/qa_lab/dto/qa-lab.dto.ts:1120` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/controllers/qa-lab.controller.spec.ts:151` |

### Flujos

_Se completa en la fase de flujos._

---

## 12. POST /qa/suites/{suiteId}/cases

- **Origen:** CONTRATO
- **Nombre:** Definir un caso de prueba con sus aserciones
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.createTestCase` — `src/modules/qa_lab/controllers/qa-lab.controller.ts:72`

### Qué es y para qué sirve (negocio)

Definir un caso de prueba con sus aserciones. Caso de uso UC-36-02: Definir caso con aserciones. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:11`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/suites/{suiteId}/cases` la atiende `QaLabController.createTestCase` (src/modules/qa_lab/controllers/qa-lab.controller.ts:72). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER. Valida el cuerpo como `CreateTestCaseDto` (16 campos, 4 obligatorios). Delega en `QaCatalogService.createTestCase`. Crea filas en qa_lab.test_assertions, qa_lab.test_cases. Lee qa_lab.test_cases, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER | `src/modules/qa_lab/controllers/qa-lab.controller.ts:72` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: suiteId | `src/modules/qa_lab/controllers/qa-lab.controller.ts:72` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_assertions` | ESCRIBE | CREA | DIRECTA | QaLabController.createTestCase → QaCatalogService.createTestCase → QaCatalogRepository.createAssertion | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:399` |
| `qa_lab.test_cases` | ESCRIBE | CREA | DIRECTA | QaLabController.createTestCase → QaCatalogService.createTestCase → QaCatalogRepository.createCase | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:270` |
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabController.createTestCase → QaCatalogService.createTestCase → QaCatalogRepository.findCaseByCode | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:316` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabController.createTestCase → QaCatalogService.createTestCase → QaCatalogRepository.findSuiteForUpdate | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:253` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `suiteId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateTestCaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del caso, único en la suite | `src/modules/qa_lab/dto/qa-lab.dto.ts:220` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:228` |
| `caseType` | `string` | No | valores: HAPPY_PATH, EDGE, NEGATIVE | `@IsOptional()` `@IsIn(CASE_TYPES)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:236` |
| `endpointId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Endpoint del catálogo que se ejercita | `src/modules/qa_lab/dto/qa-lab.dto.ts:247` |
| `httpMethod` | `string` | No | valores: GET, POST, PUT, PATCH, DELETE | `@IsOptional()` `@IsIn(HTTP_METHODS)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:255` |
| `requestPath` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:264` |
| `expectedHttpStatus` | `number` | No | mínimo 100; máximo 599 | `@IsOptional()` `@IsInt()` `@Min(100)` `@Max(599)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:274` |
| `setupJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Preparación previa al caso | `src/modules/qa_lab/dto/qa-lab.dto.ts:282` |
| `teardownJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Limpieza posterior al caso | `src/modules/qa_lab/dto/qa-lab.dto.ts:290` |
| `isCritical` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Un caso crítico que falla tumba la corrida entera | `src/modules/qa_lab/dto/qa-lab.dto.ts:301` |
| `assertions` | `array<TestAssertionDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => TestAssertionDto)` | Aserciones del caso, al menos una | `src/modules/qa_lab/dto/qa-lab.dto.ts:314` |
| `assertions[].assertionType` | `string` | Sí | valores: STATUS_CODE, JSON_PATH, HEADER, LATENCY | `@IsIn(ASSERTION_TYPES)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:168` |
| `assertions[].jsonPath` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Ruta dentro del cuerpo; obligatoria si el tipo es JSON_PATH | `src/modules/qa_lab/dto/qa-lab.dto.ts:180` |
| `assertions[].operator` | `string` | No | valores: EQUALS, NOT_EQUALS, CONTAINS, EXISTS, LESS_THAN, GREATER_THAN | `@IsOptional()` `@IsIn(ASSERTION_OPERATORS)` | — | `src/modules/qa_lab/dto/qa-lab.dto.ts:188` |
| `assertions[].expectedValue` | `string` | No | — | `@IsOptional()` `@IsString()` | Valor esperado; no aplica al operador EXISTS | `src/modules/qa_lab/dto/qa-lab.dto.ts:198` |
| `assertions[].tolerance` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Tolerancia en comparaciones numéricas | `src/modules/qa_lab/dto/qa-lab.dto.ts:206` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:325` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:331` |
| `stateConceptId` | `string` | Sí | formato uuid | — | El caso nace en borrador | `src/modules/qa_lab/dto/qa-lab.dto.ts:337` |
| `ordinal` | `number` | Sí | — | — | Valor de ordinal mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:343` |
| `assertionIds` | `array<string>` | Sí | formato uuid | — | Valor de assertion ids mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:349` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/controllers/qa-lab.controller.spec.ts:63` |

### Flujos

_Se completa en la fase de flujos._

---

## 13. POST /qa/suites/{suiteId}/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar la suite y activar sus casos
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaLabController.publishSuite` — `src/modules/qa_lab/controllers/qa-lab.controller.ts:88`

### Qué es y para qué sirve (negocio)

Publicar la suite y activar sus casos. Caso de uso UC-36-03: Publicar suite y activar casos. Dentro del módulo (descripción del modelo, en inglés): «A governed quality-assurance laboratory for the platform's integrations and critical workflows.» Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/qa_lab/README.md:12`) · MODELO (`Mantra Core Health Context/modules/diagram_36_qa_lab.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /qa/suites/{suiteId}/publish` la atiende `QaLabController.publishSuite` (src/modules/qa_lab/controllers/qa-lab.controller.ts:88). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER. Valida el cuerpo como `PublishSuiteDto` (1 campo, 0 obligatorios). Delega en `QaCatalogService.publishSuite`. Actualiza qa_lab.test_cases, qa_lab.test_suites. Lee qa_lab.test_cases, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER | `src/modules/qa_lab/controllers/qa-lab.controller.ts:88` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: suiteId | `src/modules/qa_lab/controllers/qa-lab.controller.ts:88` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_lab.test_cases` | ESCRIBE | ACTUALIZA | POR_TIPO | QaLabController.publishSuite → QaCatalogService.publishSuite | `src/modules/qa_lab/services/qa-catalog.service.ts:313` |
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaLabController.publishSuite → QaCatalogService.publishSuite → QaCatalogRepository.findCasesBySuiteForUpdate | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:329` |
| `qa_lab.test_suites` | ESCRIBE | ACTUALIZA | POR_TIPO | QaLabController.publishSuite → QaCatalogService.publishSuite | `src/modules/qa_lab/services/qa-catalog.service.ts:319` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaLabController.publishSuite → QaCatalogService.publishSuite → QaCatalogRepository.findSuiteForUpdate | `src/modules/qa_lab/repositories/qa-catalog.repository.ts:253` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `suiteId` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishSuiteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `changeNote` | `string` | No | — | `@IsOptional()` `@IsString()` | Qué cambió en esta versión de la suite | `src/modules/qa_lab/dto/qa-lab.dto.ts:366` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:377` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/qa_lab/dto/qa-lab.dto.ts:383` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a state concept. | `src/modules/qa_lab/dto/qa-lab.dto.ts:389` |
| `casesActivated` | `number` | Sí | — | — | Casos que pasaron de borrador a activos | `src/modules/qa_lab/dto/qa-lab.dto.ts:395` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/qa_lab/controllers/qa-lab.controller.spec.ts:64` |

### Flujos

_Se completa en la fase de flujos._

---

