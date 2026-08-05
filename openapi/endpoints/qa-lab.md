<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `qa_lab`

Referencia exhaustiva de 13 operación(es) del módulo `qa_lab`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `qa`, `qa-internal`
- **Controladores:** `QaLabController`, `QaLabInternalController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /internal/qa/schedules/run-due](#1-post-internal-qa-schedules-run-due) — Evaluar programaciones vencidas y encolar sus corridas
2. [POST /qa/case-results/{resultId}/evaluate](#2-post-qa-case-results-resultid-evaluate) — Evaluar las aserciones y fijar el resultado del caso
3. [POST /qa/defects](#3-post-qa-defects) — Registrar un defecto detectado
4. [PATCH /qa/defects/{defectId}](#4-patch-qa-defects-defectid) — Triage y transición de estado del defecto
5. [POST /qa/environments](#5-post-qa-environments) — Registrar un entorno de pruebas gobernado
6. [POST /qa/runs](#6-post-qa-runs) — Disparar una corrida de pruebas
7. [POST /qa/runs/{runId}/artifacts](#7-post-qa-runs-runid-artifacts) — Adjuntar un artefacto de evidencia a la corrida
8. [POST /qa/runs/{runId}/cases/{caseId}/execute](#8-post-qa-runs-runid-cases-caseid-execute) — Registrar la ejecución del caso con sus payloads
9. [POST /qa/runs/{runId}/finalize](#9-post-qa-runs-runid-finalize) — Cerrar la corrida y consolidar totales
10. [POST /qa/runs/{runId}/link-release](#10-post-qa-runs-runid-link-release) — Enlazar la evidencia de la corrida a un release
11. [POST /qa/schedules](#11-post-qa-schedules) — Programar la ejecución automática de la suite
12. [POST /qa/suites/{suiteId}/cases](#12-post-qa-suites-suiteid-cases) — Definir un caso de prueba con sus aserciones
13. [POST /qa/suites/{suiteId}/publish](#13-post-qa-suites-suiteid-publish) — Publicar la suite y activar sus casos

---

## 1. POST /internal/qa/schedules/run-due

- **Módulo:** `qa_lab`
- **Etiqueta OpenAPI:** `qa-internal`
- **Nombre:** Evaluar programaciones vencidas y encolar sus corridas
- **Operation ID:** `QaLabInternalController_runDueSchedules`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaLabInternalController.runDueSchedules](../../src/modules/qa_lab/controllers/qa-lab-internal.controller.ts)

### Descripción de negocio

`SKIP LOCKED`: varios ticks corren a la vez sin estorbarse.

Contexto declarado en el controlador: Fase 2 del plan de corrección de workers: cierra el "Disparo programado" que el README documenta como pendiente ("`test_schedules` guarda cron y `next_run_at`; el tick que las dispara...").

### Descripción del sistema

NestJS resuelve `POST /internal/qa/schedules/run-due` en `QaLabInternalController_runDueSchedules`. El controlador delega en `QaCatalogService.runDueSchedules`. Valida el body como `RunDueSchedulesDto` y consume `application/json`. El tipo de retorno estático es `Promise<RunDueSchedulesResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunDueSchedulesDto`; los campos opcionales se omiten.

```http
POST /internal/qa/schedules/run-due HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `QA_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `limit` | No | `number` | mínimo 1; máximo 100 | Tamaño máximo del lote de programaciones a evaluar | `20` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/qa/schedules/run-due HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "limit": 20
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RunDueSchedulesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "claimed": 1,
  "queued": 1,
  "skipped": 1,
  "results": [
    {
      "scheduleId": "00000000-0000-4000-8000-000000000001",
      "runId": "00000000-0000-4000-8000-000000000001",
      "runNumber": "valor-ejemplo",
      "nextRunAt": "2026-07-31T12:00:00.000Z",
      "skippedReason": "Texto descriptivo de ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `claimed` | Sí | `number` | Sin restricción adicional declarada | Programaciones vencidas reclamadas en este lote | `1` |
| `queued` | Sí | `number` | Sin restricción adicional declarada | Corridas efectivamente encoladas | `1` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Programaciones vencidas que no llegaron a encolar corrida | `1` |
| `results` | Sí | `array<DueScheduleRunResultDto>` | Sin restricción adicional declarada | Valor de results mantenido por la instancia. | `[{"scheduleId":"00000000-0000-4000-8000-000000000001","runId":"00000000-0000-4000-8000-000000000001","runNumber":"valor-ejemplo","nextRunAt":"2026-07-31T12:00:00.000Z","skippedReason":"Texto descriptivo de ejemplo"}]` |
| `results[].scheduleId` | Sí | `string` | formato `uuid` | Identificador asociado a schedule. | `00000000-0000-4000-8000-000000000001` |
| `results[].runId` | No | `string` | formato `uuid` | Corrida encolada, si la programación pudo dispararse | `00000000-0000-4000-8000-000000000001` |
| `results[].runNumber` | No | `string` | Sin restricción adicional declarada | Número de la corrida encolada | `valor-ejemplo` |
| `results[].nextRunAt` | No | `string` | formato `date-time` | Próxima marca calculada a partir del cron de la programación | `2026-07-31T12:00:00.000Z` |
| `results[].skippedReason` | No | `string` | Sin restricción adicional declarada | Motivo por el que esta marca no llegó a encolar una corrida | `Texto descriptivo de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, QA_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | No se pudo asignar número de corrida | Excepción explícita en src/modules/qa_lab/services/qa-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/qa/schedules/run-due"
}
```

---

## 2. POST /qa/case-results/{resultId}/evaluate

- **Módulo:** `qa_lab`
- **Etiqueta OpenAPI:** `qa`
- **Nombre:** Evaluar las aserciones y fijar el resultado del caso
- **Operation ID:** `QaLabController_evaluateResult`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaLabController.evaluateResult](../../src/modules/qa_lab/controllers/qa-lab.controller.ts)

### Descripción de negocio

De los fallos sale la firma con la que se deduplican defectos.


### Descripción del sistema

NestJS resuelve `POST /qa/case-results/{resultId}/evaluate` en `QaLabController_evaluateResult`. El controlador delega en `QaRunsService.evaluateResult`. No recibe body. El tipo de retorno estático es `Promise<EvaluateResultResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `resultId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /qa/case-results/00000000-0000-4000-8000-000000000001/evaluate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `QA_ENGINEER`.
- Deben ser UUID válidos: `resultId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /qa/case-results/00000000-0000-4000-8000-000000000001/evaluate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<EvaluateResultResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EvaluateResultResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EvaluateResultResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EvaluateResultResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<EvaluateResultResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EvaluateResultResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EvaluateResultResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EvaluateResultResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EvaluateResultResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EvaluateResultResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "assertionsTotal": 1,
  "assertionsPassed": 1,
  "assertionsFailed": 1,
  "failureSignatureHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `assertionsTotal` | Sí | `number` | Sin restricción adicional declarada | Valor de assertions total mantenido por la instancia. | `1` |
| `assertionsPassed` | Sí | `number` | Sin restricción adicional declarada | Valor de assertions passed mantenido por la instancia. | `1` |
| `assertionsFailed` | Sí | `number` | Sin restricción adicional declarada | Valor de assertions failed mantenido por la instancia. | `1` |
| `failureSignatureHash` | No | `string` | Sin restricción adicional declarada | Firma del fallo, con la que se deduplican defectos | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, QA_ENGINEER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Resultado no encontrado | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 409 | `CONFLICT` | El resultado ya fue evaluado | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso falló en transporte: no hay respuesta que evaluar | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso no tiene aserciones | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/qa/case-results/{resultId}/evaluate"
}
```

---

## 3. POST /qa/defects

- **Módulo:** `qa_lab`
- **Etiqueta OpenAPI:** `qa`
- **Nombre:** Registrar un defecto detectado
- **Operation ID:** `QaLabController_registerDefect`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaLabController.registerDefect](../../src/modules/qa_lab/controllers/qa-lab.controller.ts)

### Descripción de negocio

Deduplica por firma de fallo: el mismo fallo sube el contador.


### Descripción del sistema

NestJS resuelve `POST /qa/defects` en `QaLabController_registerDefect`. El controlador delega en `QaRunsService.registerDefect`. Valida el body como `RegisterDefectDto` y consume `application/json`. El tipo de retorno estático es `Promise<DefectResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterDefectDto`; los campos opcionales se omiten.

```http
POST /qa/defects HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "testCaseId": "00000000-0000-4000-8000-000000000001",
  "failureSignatureHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "defectType": "BUG",
  "severity": "LOW",
  "title": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `QA_ENGINEER`, `QA_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `testCaseId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `testCaseResultId` | No | `string` | formato `uuid` | Resultado en el que se detectó | `00000000-0000-4000-8000-000000000001` |
| `failureSignatureHash` | Sí | `string` | longitud máxima 128 | Firma del fallo; dos fallos con la misma firma son el mismo defecto | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `defectType` | Sí | `string` | valores: `BUG`, `REGRESSION`, `FLAKY` | Sin descripción específica en el contrato OpenAPI. | `BUG` |
| `severity` | Sí | `string` | valores: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Sin descripción específica en el contrato OpenAPI. | `LOW` |
| `title` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /qa/defects HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DefectResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DefectResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DefectResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DefectResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DefectResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DefectResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DefectResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DefectResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DefectResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DefectResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "defectNumber": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "occurrencesCount": 1,
  "deduplicated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `defectNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de defect number mantenido por la instancia. | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `occurrencesCount` | Sí | `number` | Sin restricción adicional declarada | Veces que se ha visto este mismo fallo | `1` |
| `deduplicated` | Sí | `boolean` | Sin restricción adicional declarada | true si el defecto ya existía y sólo subió su contador | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, QA_ENGINEER, QA_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso no encontrado | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 409 | `CONFLICT` | No se pudo asignar número de defecto | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/qa/defects"
}
```

---

## 4. PATCH /qa/defects/{defectId}

- **Módulo:** `qa_lab`
- **Etiqueta OpenAPI:** `qa`
- **Nombre:** Triage y transición de estado del defecto
- **Operation ID:** `QaLabController_triageDefect`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaLabController.triageDefect](../../src/modules/qa_lab/controllers/qa-lab.controller.ts)

### Descripción de negocio

Las transiciones no admitidas se rechazan.


### Descripción del sistema

NestJS resuelve `PATCH /qa/defects/{defectId}` en `QaLabController_triageDefect`. El controlador delega en `QaRunsService.triageDefect`. Valida el body como `TriageDefectDto` y consume `application/json`. El tipo de retorno estático es `Promise<TriageDefectResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `defectId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `TriageDefectDto`; los campos opcionales se omiten.

```http
PATCH /qa/defects/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "OPEN"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `QA_ADMIN`, `QA_ENGINEER`.
- Deben ser UUID válidos: `defectId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `OPEN`, `TRIAGED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `OPEN` |
| `severity` | No | `string` | valores: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Reclasificar la gravedad | `LOW` |
| `assignedToUserId` | No | `string` | formato `uuid` | Persona a la que se asigna | `00000000-0000-4000-8000-000000000001` |
| `isFlaky` | No | `boolean` | Sin restricción adicional declarada | Marcarlo como intermitente | `true` |
| `externalIssueRef` | No | `string` | longitud máxima 200 | Referencia en el gestor externo | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /qa/defects/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "OPEN",
  "severity": "LOW",
  "assignedToUserId": "00000000-0000-4000-8000-000000000001",
  "isFlaky": true,
  "externalIssueRef": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TriageDefectResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TriageDefectResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TriageDefectResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TriageDefectResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TriageDefectResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TriageDefectResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TriageDefectResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TriageDefectResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TriageDefectResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TriageDefectResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TriageDefectResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "assignedToUserId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `severityConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a severity concept. | `00000000-0000-4000-8000-000000000001` |
| `assignedToUserId` | No | `string` | formato `uuid` | Identificador asociado a assigned to user. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: QA_ADMIN, QA_ENGINEER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Defecto no encontrado | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El defecto está en un estado desconocido | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | La transición de estado no está permitida | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | Un defecto en curso necesita responsable | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/qa/defects/{defectId}"
}
```

---

## 5. POST /qa/environments

- **Módulo:** `qa_lab`
- **Etiqueta OpenAPI:** `qa`
- **Nombre:** Registrar un entorno de pruebas gobernado
- **Operation ID:** `QaLabController_createEnvironment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaLabController.createEnvironment](../../src/modules/qa_lab/controllers/qa-lab.controller.ts)

### Descripción de negocio

`isProductionSafe` decide si los payloads capturados se guardan en claro.


### Descripción del sistema

NestJS resuelve `POST /qa/environments` en `QaLabController_createEnvironment`. El controlador delega en `QaCatalogService.createEnvironment`. Valida el body como `CreateEnvironmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<EnvironmentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateEnvironmentDto`; los campos opcionales se omiten.

```http
POST /qa/environments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "environment": "DEV"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `QA_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Código del entorno, único | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `environment` | Sí | `string` | valores: `DEV`, `STAGING`, `PRODUCTION` | Sin descripción específica en el contrato OpenAPI. | `DEV` |
| `baseUrl` | No | `string` | Sin restricción adicional declarada | URL base contra la que apuntan los casos | `valor-ejemplo` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `configJson` | No | `object` | Sin restricción adicional declarada | Configuración del entorno | `{}` |
| `isProductionSafe` | No | `boolean` | Sin restricción adicional declarada | Si es false, los payloads capturados se enmascaran: el entorno puede contener datos reales. | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /qa/environments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EnvironmentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EnvironmentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EnvironmentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EnvironmentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EnvironmentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EnvironmentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EnvironmentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EnvironmentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EnvironmentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EnvironmentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "isProductionSafe": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `isProductionSafe` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is production safe mantenido por la instancia. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: QA_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un entorno con ese código | Excepción explícita en src/modules/qa_lab/services/qa-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un entorno de producción no puede declararse seguro para capturar payloads | Excepción explícita en src/modules/qa_lab/services/qa-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/qa/environments"
}
```

---

## 6. POST /qa/runs

- **Módulo:** `qa_lab`
- **Etiqueta OpenAPI:** `qa`
- **Nombre:** Disparar una corrida de pruebas
- **Operation ID:** `QaLabController_createRun`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaLabController.createRun](../../src/modules/qa_lab/controllers/qa-lab.controller.ts)

### Descripción de negocio

La política de concurrencia decide qué hacer si la suite ya está corriendo.


### Descripción del sistema

NestJS resuelve `POST /qa/runs` en `QaLabController_createRun`. El controlador delega en `QaRunsService.createRun`. Valida el body como `CreateRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<RunResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateRunDto`; los campos opcionales se omiten.

```http
POST /qa/runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "suiteId": "00000000-0000-4000-8000-000000000001",
  "environmentId": "00000000-0000-4000-8000-000000000001",
  "trigger": "MANUAL"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `QA_ADMIN`, `QA_ENGINEER`, `SYSTEM`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `suiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `environmentId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `trigger` | Sí | `string` | valores: `MANUAL`, `SCHEDULED`, `CI_PUSH`, `CI_PR`, `WEBHOOK` | Sin descripción específica en el contrato OpenAPI. | `MANUAL` |
| `gitRef` | No | `string` | longitud máxima 200 | Referencia de git que se está probando | `valor-ejemplo` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `concurrencyPolicy` | No | `string` | valores: `ALLOW`, `FORBID`, `QUEUE` | Política ante corridas solapadas de la misma suite | `ALLOW` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /qa/runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "suiteId": "00000000-0000-4000-8000-000000000001",
  "environmentId": "00000000-0000-4000-8000-000000000001",
  "trigger": "MANUAL",
  "gitRef": "valor-ejemplo",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "concurrencyPolicy": "ALLOW"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "runNumber": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "totalCases": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `runNumber` | Sí | `string` | Sin restricción adicional declarada | Número secuencial de la corrida | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `totalCases` | Sí | `number` | Sin restricción adicional declarada | Casos activos que la corrida ejercitará | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: QA_ADMIN, QA_ENGINEER, SYSTEM. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Suite no encontrada | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 404 | `NOT_FOUND` | Entorno no encontrado | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 409 | `CONFLICT` | La suite ya tiene una corrida en marcha | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 409 | `CONFLICT` | No se pudo asignar número de corrida | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La suite no está publicada | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | El entorno no está activo | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | La suite no tiene casos activos | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/qa/runs"
}
```

---

## 7. POST /qa/runs/{runId}/artifacts

- **Módulo:** `qa_lab`
- **Etiqueta OpenAPI:** `qa`
- **Nombre:** Adjuntar un artefacto de evidencia a la corrida
- **Operation ID:** `QaLabController_attachArtifact`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaLabController.attachArtifact](../../src/modules/qa_lab/controllers/qa-lab.controller.ts)

### Descripción de negocio

Adjuntar un artefacto de evidencia a la corrida. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /qa/runs/{runId}/artifacts` en `QaLabController_attachArtifact`. El controlador delega en `QaRunsService.attachArtifact`. Valida el body como `AttachArtifactDto` y consume `application/json`. El tipo de retorno estático es `Promise<ArtifactResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `runId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AttachArtifactDto`; los campos opcionales se omiten.

```http
POST /qa/runs/00000000-0000-4000-8000-000000000001/artifacts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "artifactType": "LOG",
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `QA_ENGINEER`.
- Deben ser UUID válidos: `runId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `artifactType` | Sí | `string` | valores: `LOG`, `HAR`, `SCREENSHOT`, `JUNIT` | Sin descripción específica en el contrato OpenAPI. | `LOG` |
| `fileId` | Sí | `string` | formato `uuid` | Archivo en `common.files` | `00000000-0000-4000-8000-000000000001` |
| `label` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `testCaseResultId` | No | `string` | formato `uuid` | Resultado de caso al que pertenece | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /qa/runs/00000000-0000-4000-8000-000000000001/artifacts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "artifactType": "LOG",
  "fileId": "00000000-0000-4000-8000-000000000001",
  "label": "valor-ejemplo",
  "testCaseResultId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ArtifactResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "testRunId": "00000000-0000-4000-8000-000000000001",
  "artifactTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `testRunId` | Sí | `string` | formato `uuid` | Identificador asociado a test run. | `00000000-0000-4000-8000-000000000001` |
| `artifactTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a artifact type concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, QA_ENGINEER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Corrida no encontrada | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 404 | `NOT_FOUND` | Resultado no encontrado | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El resultado pertenece a otra corrida | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/qa/runs/{runId}/artifacts"
}
```

---

## 8. POST /qa/runs/{runId}/cases/{caseId}/execute

- **Módulo:** `qa_lab`
- **Etiqueta OpenAPI:** `qa`
- **Nombre:** Registrar la ejecución del caso con sus payloads
- **Operation ID:** `QaLabController_executeCase`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaLabController.executeCase](../../src/modules/qa_lab/controllers/qa-lab.controller.ts)

### Descripción de negocio

Evidencia inmutable con hash; enmascarada si el entorno no es seguro.


### Descripción del sistema

NestJS resuelve `POST /qa/runs/{runId}/cases/{caseId}/execute` en `QaLabController_executeCase`. El controlador delega en `QaRunsService.executeCase`. Valida el body como `ExecuteCaseDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExecuteCaseResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `runId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `caseId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ExecuteCaseDto`; los campos opcionales se omiten.

```http
POST /qa/runs/00000000-0000-4000-8000-000000000001/cases/00000000-0000-4000-8000-000000000001/execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "requestBodyJson": {},
  "responseBodyJson": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `QA_ENGINEER`.
- Deben ser UUID válidos: `runId`, `caseId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `requestBodyJson` | Sí | `object` | Sin restricción adicional declarada | Cuerpo de la petición tal como se envió | `{}` |
| `requestHeadersJson` | No | `object` | Sin restricción adicional declarada | Cabeceras de la petición | `{}` |
| `targetUrl` | No | `string` | Sin restricción adicional declarada | URL a la que se llamó | `valor-ejemplo` |
| `responseBodyJson` | Sí | `object` | Sin restricción adicional declarada | Cuerpo de la respuesta tal como llegó | `{}` |
| `responseHeadersJson` | No | `object` | Sin restricción adicional declarada | Cabeceras de la respuesta | `{}` |
| `httpStatus` | No | `number` | mínimo 100; máximo 599 | Sin descripción específica en el contrato OpenAPI. | `100` |
| `latencyMs` | No | `number` | mínimo 0 | Latencia de la llamada, en milisegundos | `1` |
| `errorText` | No | `string` | Sin restricción adicional declarada | Error de transporte si la llamada no llegó a completarse | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /qa/runs/00000000-0000-4000-8000-000000000001/cases/00000000-0000-4000-8000-000000000001/execute HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ExecuteCaseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExecuteCaseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExecuteCaseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExecuteCaseResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExecuteCaseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExecuteCaseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExecuteCaseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExecuteCaseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExecuteCaseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExecuteCaseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExecuteCaseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "requestPayloadId": "00000000-0000-4000-8000-000000000001",
  "responsePayloadId": "00000000-0000-4000-8000-000000000001",
  "responseBodyHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "masked": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Resultado del caso creado | `00000000-0000-4000-8000-000000000001` |
| `requestPayloadId` | Sí | `string` | formato `uuid` | Identificador asociado a request payload. | `00000000-0000-4000-8000-000000000001` |
| `responsePayloadId` | Sí | `string` | formato `uuid` | Identificador asociado a response payload. | `00000000-0000-4000-8000-000000000001` |
| `responseBodyHash` | Sí | `string` | Sin restricción adicional declarada | Hash del cuerpo de la respuesta, para detectar manipulación | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `masked` | Sí | `boolean` | Sin restricción adicional declarada | true si el entorno no es seguro y los payloads se guardaron enmascarados | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, QA_ENGINEER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Corrida no encontrada | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 404 | `NOT_FOUND` | Caso no encontrado | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 409 | `CONFLICT` | La corrida ya está cerrada | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 409 | `CONFLICT` | El caso ya se ejecutó en esta corrida | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El caso pertenece a otra suite | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/qa/runs/{runId}/cases/{caseId}/execute"
}
```

---

## 9. POST /qa/runs/{runId}/finalize

- **Módulo:** `qa_lab`
- **Etiqueta OpenAPI:** `qa`
- **Nombre:** Cerrar la corrida y consolidar totales
- **Operation ID:** `QaLabController_finalizeRun`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaLabController.finalizeRun](../../src/modules/qa_lab/controllers/qa-lab.controller.ts)

### Descripción de negocio

Los totales se agregan de los resultados reales.


### Descripción del sistema

NestJS resuelve `POST /qa/runs/{runId}/finalize` en `QaLabController_finalizeRun`. El controlador delega en `QaRunsService.finalizeRun`. No recibe body. El tipo de retorno estático es `Promise<FinalizeRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `runId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /qa/runs/00000000-0000-4000-8000-000000000001/finalize HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `QA_ENGINEER`.
- Deben ser UUID válidos: `runId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /qa/runs/00000000-0000-4000-8000-000000000001/finalize HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<FinalizeRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FinalizeRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FinalizeRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FinalizeRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<FinalizeRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FinalizeRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FinalizeRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FinalizeRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FinalizeRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FinalizeRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "totalCases": 1,
  "totalPassed": 1,
  "totalFailed": 1,
  "totalSkipped": 1,
  "durationMs": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `totalCases` | Sí | `number` | Sin restricción adicional declarada | Valor de total cases mantenido por la instancia. | `1` |
| `totalPassed` | Sí | `number` | Sin restricción adicional declarada | Valor de total passed mantenido por la instancia. | `1` |
| `totalFailed` | Sí | `number` | Sin restricción adicional declarada | Valor de total failed mantenido por la instancia. | `1` |
| `totalSkipped` | Sí | `number` | Sin restricción adicional declarada | Valor de total skipped mantenido por la instancia. | `1` |
| `durationMs` | No | `number` | Sin restricción adicional declarada | Duración de la corrida, en milisegundos | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, QA_ENGINEER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Corrida no encontrada | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 409 | `CONFLICT` | La corrida ya está cerrada | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/qa/runs/{runId}/finalize"
}
```

---

## 10. POST /qa/runs/{runId}/link-release

- **Módulo:** `qa_lab`
- **Etiqueta OpenAPI:** `qa`
- **Nombre:** Enlazar la evidencia de la corrida a un release
- **Operation ID:** `QaLabController_linkRelease`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaLabController.linkRelease](../../src/modules/qa_lab/controllers/qa-lab.controller.ts)

### Descripción de negocio

Sólo una corrida que pasó puede respaldar un despliegue.


### Descripción del sistema

NestJS resuelve `POST /qa/runs/{runId}/link-release` en `QaLabController_linkRelease`. El controlador delega en `QaRunsService.linkRelease`. Valida el body como `LinkReleaseDto` y consume `application/json`. El tipo de retorno estático es `Promise<LinkReleaseResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `runId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LinkReleaseDto`; los campos opcionales se omiten.

```http
POST /qa/runs/00000000-0000-4000-8000-000000000001/link-release HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "gitRef": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `RELEASE_MANAGER`, `QA_ADMIN`.
- Deben ser UUID válidos: `runId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `gitRef` | Sí | `string` | longitud máxima 200 | Referencia de git confirmada del release | `valor-ejemplo` |
| `releaseRef` | No | `string` | longitud máxima 200 | Identificador del release en el módulo de despliegue | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /qa/runs/00000000-0000-4000-8000-000000000001/link-release HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "gitRef": "valor-ejemplo",
  "releaseRef": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LinkReleaseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LinkReleaseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LinkReleaseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LinkReleaseResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LinkReleaseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LinkReleaseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LinkReleaseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LinkReleaseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LinkReleaseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LinkReleaseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LinkReleaseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "gitRef": "valor-ejemplo",
  "artifactCount": 1,
  "evidenceHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `gitRef` | Sí | `string` | Sin restricción adicional declarada | Valor de git ref mantenido por la instancia. | `valor-ejemplo` |
| `artifactCount` | Sí | `number` | Sin restricción adicional declarada | Artefactos que componen el paquete de evidencia | `1` |
| `evidenceHash` | Sí | `string` | Sin restricción adicional declarada | Sello del paquete: hash de los artefactos enlazados | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: RELEASE_MANAGER, QA_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Corrida no encontrada | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo una corrida que pasó puede respaldar un release | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | La corrida no tiene evidencia adjunta | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/qa/runs/{runId}/link-release"
}
```

---

## 11. POST /qa/schedules

- **Módulo:** `qa_lab`
- **Etiqueta OpenAPI:** `qa`
- **Nombre:** Programar la ejecución automática de la suite
- **Operation ID:** `QaLabController_createSchedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaLabController.createSchedule](../../src/modules/qa_lab/controllers/qa-lab.controller.ts)

### Descripción de negocio

Programar la ejecución automática de la suite. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /qa/schedules` en `QaLabController_createSchedule`. El controlador delega en `QaCatalogService.createSchedule`. Valida el body como `CreateTestScheduleDto` y consume `application/json`. El tipo de retorno estático es `Promise<TestScheduleResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTestScheduleDto`; los campos opcionales se omiten.

```http
POST /qa/schedules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "suiteId": "00000000-0000-4000-8000-000000000001",
  "environmentId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "cronExpression": "valor-ejemplo",
  "firstRunAt": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `QA_ADMIN`, `QA_ENGINEER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `suiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `environmentId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código, único por suite y entorno | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `cronExpression` | Sí | `string` | longitud máxima 100 | Expresión cron de cinco campos | `valor-ejemplo` |
| `timezone` | No | `string` | longitud máxima 100 | Zona horaria IANA | `UTC` |
| `concurrencyPolicy` | No | `string` | valores: `ALLOW`, `FORBID`, `QUEUE` | Qué hacer si la suite ya tiene una corrida en marcha | `FORBID` |
| `firstRunAt` | Sí | `string` | formato `date-time` | Primera corrida. El cliente resuelve el cron; aquí se guarda el instante. | `2026-07-31T12:00:00.000Z` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /qa/schedules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TestScheduleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TestScheduleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TestScheduleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TestScheduleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TestScheduleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TestScheduleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TestScheduleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TestScheduleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TestScheduleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TestScheduleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "nextRunAt": "2026-07-31T12:00:00.000Z",
  "stateConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `nextRunAt` | Sí | `string` | formato `date-time` | Valor de next run at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: QA_ADMIN, QA_ENGINEER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Suite no encontrada | Excepción explícita en src/modules/qa_lab/services/qa-catalog.service.ts |
| 404 | `NOT_FOUND` | Entorno no encontrado | Excepción explícita en src/modules/qa_lab/services/qa-catalog.service.ts |
| 409 | `CONFLICT` | Ya existe una programación con ese código para la suite y el entorno | Excepción explícita en src/modules/qa_lab/services/qa-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La suite no está publicada | Excepción explícita en src/modules/qa_lab/services/qa-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El entorno no está activo | Excepción explícita en src/modules/qa_lab/services/qa-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/qa/schedules"
}
```

---

## 12. POST /qa/suites/{suiteId}/cases

- **Módulo:** `qa_lab`
- **Etiqueta OpenAPI:** `qa`
- **Nombre:** Definir un caso de prueba con sus aserciones
- **Operation ID:** `QaLabController_createTestCase`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaLabController.createTestCase](../../src/modules/qa_lab/controllers/qa-lab.controller.ts)

### Descripción de negocio

Nace en borrador; publicar la suite es lo que lo activa.


### Descripción del sistema

NestJS resuelve `POST /qa/suites/{suiteId}/cases` en `QaLabController_createTestCase`. El controlador delega en `QaCatalogService.createTestCase`. Valida el body como `CreateTestCaseDto` y consume `application/json`. El tipo de retorno estático es `Promise<TestCaseResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `suiteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTestCaseDto`; los campos opcionales se omiten.

```http
POST /qa/suites/00000000-0000-4000-8000-000000000001/cases HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `QA_ADMIN`, `QA_ENGINEER`.
- Deben ser UUID válidos: `suiteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Código del caso, único en la suite | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `caseType` | No | `string` | valores: `HAPPY_PATH`, `EDGE`, `NEGATIVE` | Sin descripción específica en el contrato OpenAPI. | `HAPPY_PATH` |
| `endpointId` | No | `string` | formato `uuid` | Endpoint del catálogo que se ejercita | `00000000-0000-4000-8000-000000000001` |
| `httpMethod` | No | `string` | valores: `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Sin descripción específica en el contrato OpenAPI. | `GET` |
| `requestPath` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `expectedHttpStatus` | No | `number` | mínimo 100; máximo 599 | Sin descripción específica en el contrato OpenAPI. | `100` |
| `setupJson` | No | `object` | Sin restricción adicional declarada | Preparación previa al caso | `{}` |
| `teardownJson` | No | `object` | Sin restricción adicional declarada | Limpieza posterior al caso | `{}` |
| `isCritical` | No | `boolean` | Sin restricción adicional declarada | Un caso crítico que falla tumba la corrida entera | `false` |
| `assertions` | Sí | `array<TestAssertionDto>` | mínimo 1 elemento(s) | Aserciones del caso, al menos una | `[{"assertionType":"STATUS_CODE","jsonPath":"valor-ejemplo","operator":"EQUALS","expectedValue":"valor-ejemplo","tolerance":"valor-ejemplo"}]` |
| `assertions[].assertionType` | Sí | `string` | valores: `STATUS_CODE`, `JSON_PATH`, `HEADER`, `LATENCY` | Sin descripción específica en el contrato OpenAPI. | `STATUS_CODE` |
| `assertions[].jsonPath` | No | `string` | longitud máxima 300 | Ruta dentro del cuerpo; obligatoria si el tipo es JSON_PATH | `valor-ejemplo` |
| `assertions[].operator` | No | `string` | valores: `EQUALS`, `NOT_EQUALS`, `CONTAINS`, `EXISTS`, `LESS_THAN`, `GREATER_THAN` | Sin descripción específica en el contrato OpenAPI. | `EQUALS` |
| `assertions[].expectedValue` | No | `string` | Sin restricción adicional declarada | Valor esperado; no aplica al operador EXISTS | `valor-ejemplo` |
| `assertions[].tolerance` | No | `string` | Sin restricción adicional declarada | Tolerancia en comparaciones numéricas | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /qa/suites/00000000-0000-4000-8000-000000000001/cases HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TestCaseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TestCaseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TestCaseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TestCaseResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TestCaseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TestCaseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TestCaseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TestCaseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TestCaseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TestCaseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TestCaseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "ordinal": 1,
  "assertionIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `stateConceptId` | Sí | `string` | formato `uuid` | El caso nace en borrador | `00000000-0000-4000-8000-000000000001` |
| `ordinal` | Sí | `number` | Sin restricción adicional declarada | Valor de ordinal mantenido por la instancia. | `1` |
| `assertionIds` | Sí | `array<string>` | formato `uuid` | Valor de assertion ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: QA_ADMIN, QA_ENGINEER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Suite no encontrada | Excepción explícita en src/modules/qa_lab/services/qa-catalog.service.ts |
| 409 | `CONFLICT` | Ya existe un caso con ese código en la suite | Excepción explícita en src/modules/qa_lab/services/qa-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una aserción JSON_PATH necesita su ruta | Excepción explícita en src/modules/qa_lab/services/qa-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | La aserción necesita valor esperado | Excepción explícita en src/modules/qa_lab/services/qa-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/qa/suites/{suiteId}/cases"
}
```

---

## 13. POST /qa/suites/{suiteId}/publish

- **Módulo:** `qa_lab`
- **Etiqueta OpenAPI:** `qa`
- **Nombre:** Publicar la suite y activar sus casos
- **Operation ID:** `QaLabController_publishSuite`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaLabController.publishSuite](../../src/modules/qa_lab/controllers/qa-lab.controller.ts)

### Descripción de negocio

Sube la versión: lo que se ejecute a partir de aquí es este conjunto.


### Descripción del sistema

NestJS resuelve `POST /qa/suites/{suiteId}/publish` en `QaLabController_publishSuite`. El controlador delega en `QaCatalogService.publishSuite`. Valida el body como `PublishSuiteDto` y consume `application/json`. El tipo de retorno estático es `Promise<PublishSuiteResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `suiteId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishSuiteDto`; los campos opcionales se omiten.

```http
POST /qa/suites/00000000-0000-4000-8000-000000000001/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `QA_ADMIN`, `QA_ENGINEER`.
- Deben ser UUID válidos: `suiteId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `changeNote` | No | `string` | Sin restricción adicional declarada | Qué cambió en esta versión de la suite | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /qa/suites/00000000-0000-4000-8000-000000000001/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "changeNote": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublishSuiteResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PublishSuiteResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PublishSuiteResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PublishSuiteResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PublishSuiteResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PublishSuiteResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PublishSuiteResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PublishSuiteResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PublishSuiteResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PublishSuiteResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublishSuiteResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "version": 1,
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "casesActivated": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `1` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `casesActivated` | Sí | `number` | Sin restricción adicional declarada | Casos que pasaron de borrador a activos | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: QA_ADMIN, QA_ENGINEER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Suite no encontrada | Excepción explícita en src/modules/qa_lab/services/qa-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una suite sin casos no puede publicarse | Excepción explícita en src/modules/qa_lab/services/qa-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/qa/suites/{suiteId}/publish"
}
```

---

