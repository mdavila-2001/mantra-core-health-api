<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `qa_execution`

- **Bloque:** —
- **Operaciones:** 9 (9 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 5 · BAJO 4
- **Tablas distintas que tocan:** 13
- **Respuestas de error y detalle contractual:** `openapi/endpoints/qa-execution.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | PUT | `/admin/qa/environments/{environmentId}/target` | Registrar o cambiar el destino de un entorno (cambiarlo invalida planes aprobados) | MEDIO | 4 | QA_ADMIN, SECURITY_ADMIN |
| 2 | GET | `/admin/qa/plans` | Planes, del más reciente al más antiguo | BAJO | 1 | QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN |
| 3 | POST | `/admin/qa/plans` | Pedir un plan (202). Queda QUEUED o PENDING_APPROVAL; lo ejecuta el worker qa_lab | MEDIO | 11 | QA_ADMIN, QA_ENGINEER |
| 4 | GET | `/admin/qa/plans/{planId}` | Plan con pasos, límites, aprobaciones y bitácora ordenada | BAJO | 3 | QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN |
| 5 | POST | `/admin/qa/plans/{planId}/approvals` | Aprobar o rechazar el hash vigente del plan, con vencimiento | MEDIO | 6 | QA_ADMIN, RELEASE_MANAGER, SECURITY_ADMIN |
| 6 | POST | `/admin/qa/plans/{planId}/cancel` | Pedir la cancelación (el runner la confirma entre casos) | MEDIO | 5 | QA_ADMIN, QA_ENGINEER |
| 7 | POST | `/admin/qa/plans/preflight` | Dry-run: pasos, URL resueltas, límites recortados, hash y si requiere aprobación. No llama a nada | BAJO | 4 | QA_ADMIN, QA_ENGINEER |
| 8 | GET | `/admin/qa/targets` | Destinos aprobados por entorno (sin valores de secretos) | BAJO | 1 | QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN |
| 9 | POST | `/internal/qa/plans/run-next` | Reclamar y ejecutar el siguiente plan (worker) | MEDIO | 18 | SYSTEM |

---

## 1. PUT /admin/qa/environments/{environmentId}/target

- **Origen:** CONTRATO
- **Nombre:** Registrar o cambiar el destino de un entorno (cambiarlo invalida planes aprobados)
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaExecutionController.upsertTarget` — `src/modules/qa_execution/controllers/qa-execution.controller.ts:72`

### Qué es y para qué sirve (negocio)

Registrar o cambiar el destino de un entorno (cambiarlo invalida planes aprobados).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`PUT /admin/qa/environments/{environmentId}/target` la atiende `QaExecutionController.upsertTarget` (src/modules/qa_execution/controllers/qa-execution.controller.ts:72). Exige sesión con alguno de los roles QA_ADMIN, SECURITY_ADMIN. Valida el cuerpo como `UpsertTargetDto` (13 campos, 4 obligatorios). Delega en `QaExecutionService.upsertTarget`. Crea filas en qa_execution.execution_targets. Actualiza qa_execution.execution_targets. Lee qa_execution.execution_targets, qa_lab.test_environments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, SECURITY_ADMIN | `src/modules/qa_execution/controllers/qa-execution.controller.ts:72` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: environmentId | `src/modules/qa_execution/controllers/qa-execution.controller.ts:72` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_execution.execution_targets` | ESCRIBE | CREA | DIRECTA | QaExecutionController.upsertTarget → QaExecutionService.upsertTarget | `src/modules/qa_execution/services/qa-execution.service.ts:160` |
| `qa_execution.execution_targets` | ESCRIBE | ACTUALIZA | POR_TIPO | QaExecutionController.upsertTarget → QaExecutionService.upsertTarget | `src/modules/qa_execution/services/qa-execution.service.ts:170` |
| `qa_execution.execution_targets` | LEE | LEE | DIRECTA | QaExecutionController.upsertTarget → QaExecutionService.upsertTarget | `src/modules/qa_execution/services/qa-execution.service.ts:154` |
| `qa_lab.test_environments` | LEE | LEE | DIRECTA | QaExecutionController.upsertTarget → QaExecutionService.upsertTarget | `src/modules/qa_execution/services/qa-execution.service.ts:138` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `environmentId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpsertTargetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `scheme` | `string` | Sí | valores: http, https | `@IsIn(['http', 'https'])` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:26` |
| `host` | `string` | Sí | longitud máxima 253; patrón runtime /^[a-z0-9.-]+$\|^\[[0-9a-f:]+\]$/i | `@IsString()` `@Matches(/^[a-z0-9.-]+$\|^\[[0-9a-f:]+\]$/i, { message: 'host no válido' })` `@MaxLength(253)` | Host exacto, sin comodines | `src/modules/qa_execution/dto/qa-execution.dto.ts:32` |
| `port` | `number` | Sí | mínimo 1; máximo 65535 | `@Type(() => Number)` `@IsInt()` `@Min(1)` `@Max(65535)` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:39` |
| `allowedPathPrefixes` | `array<string>` | Sí | mínimo 1 elemento(s); máximo 20 elemento(s); patrón runtime /^\/[A-Za-z0-9/_\-.]*$/ | `@IsString({ each: true })` `@Matches(/^\/[A-Za-z0-9/_\-.]*$/, { each: true, message: 'prefijo de ruta no válido', })` `@ArrayMinSize(1)` `@ArrayMaxSize(20)` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:49` |
| `allowPrivateNetwork` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:54` |
| `allowMutations` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:59` |
| `authSecretRef` | `string` | No | patrón runtime SECRET_REF_PATTERN | `@IsOptional()` `@Matches(SECRET_REF_PATTERN, { message: 'sólo variables QA_TARGET_*' })` | Nombre de variable QA_TARGET_*; nunca el valor | `src/modules/qa_execution/dto/qa-execution.dto.ts:66` |
| `authHeaderName` | `string` | No | patrón runtime /^[A-Za-z0-9-]{1,64}$/ | `@IsOptional()` `@Matches(/^[A-Za-z0-9-]{1,64}$/)` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:71` |
| `maxRequests` | `number` | No | mínimo 1; máximo 1000 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@Min(1)` `@Max(1000)` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:79` |
| `maxDurationSeconds` | `number` | No | mínimo 1; máximo 600 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@Min(1)` `@Max(600)` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:87` |
| `requestTimeoutMs` | `number` | No | mínimo 100; máximo 30000 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@Min(100)` `@Max(30_000)` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:95` |
| `minIntervalMs` | `number` | No | mínimo 0; máximo 10000 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@Min(0)` `@Max(10_000)` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:103` |
| `status` | `string` | No | valores: ACTIVE, DISABLED | `@IsOptional()` `@IsIn(['ACTIVE', 'DISABLED'])` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:108` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "scheme": "http",
  "host": "valor-ejemplo",
  "port": 1,
  "allowedPathPrefixes": [
    "/api"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "scheme": "http",
  "host": "valor-ejemplo",
  "port": 1,
  "allowedPathPrefixes": [
    "/api"
  ],
  "allowPrivateNetwork": false,
  "allowMutations": false,
  "authSecretRef": "valor-ejemplo",
  "authHeaderName": "authorization",
  "maxRequests": 300,
  "maxDurationSeconds": 60,
  "requestTimeoutMs": 10000,
  "minIntervalMs": 200,
  "status": "ACTIVE"
}
```

</details>

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Entorno no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_execution.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 68 — Plano de ejecución de QA en el servidor — etapa `ctrl:QaExecutionController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /admin/qa/plans

- **Origen:** CONTRATO
- **Nombre:** Planes, del más reciente al más antiguo
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaExecutionController.listPlans` — `src/modules/qa_execution/controllers/qa-execution.controller.ts:132`

### Qué es y para qué sirve (negocio)

Planes, del más reciente al más antiguo.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/qa/plans` la atiende `QaExecutionController.listPlans` (src/modules/qa_execution/controllers/qa-execution.controller.ts:132). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN. Delega en `QaExecutionService.listPlans`. Lee qa_execution.execution_plans.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN | `src/modules/qa_execution/controllers/qa-execution.controller.ts:132` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_execution.execution_plans` | LEE | LEE | DIRECTA | QaExecutionController.listPlans → QaExecutionService.listPlans | `src/modules/qa_execution/services/qa-execution.service.ts:513` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `status` | query | No | `string` | — |
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

El árbol de decisión completo está en [flujos](../flujos/qa_execution.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 68 — Plano de ejecución de QA en el servidor — etapa `ctrl:QaExecutionController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /admin/qa/plans

- **Origen:** CONTRATO
- **Nombre:** Pedir un plan (202). Queda QUEUED o PENDING_APPROVAL; lo ejecuta el worker qa_lab
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaExecutionController.createPlan` — `src/modules/qa_execution/controllers/qa-execution.controller.ts:106`

### Qué es y para qué sirve (negocio)

Pedir un plan (202). Queda QUEUED o PENDING_APPROVAL; lo ejecuta el worker qa_lab.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /admin/qa/plans` la atiende `QaExecutionController.createPlan` (src/modules/qa_execution/controllers/qa-execution.controller.ts:106). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER. Valida el cuerpo como `PlanRequestDto` (7 campos, 2 obligatorios). Delega en `QaExecutionService.createPlan`. Crea filas en qa_execution.execution_plans, qa_execution.plan_events, qa_lab.test_runs. Lee qa_execution.execution_plans, qa_execution.execution_targets, qa_execution.plan_approvals, qa_execution.plan_events, qa_lab.test_cases, qa_lab.test_environments, qa_lab.test_runs, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER | `src/modules/qa_execution/controllers/qa-execution.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CABECERA | Idempotency-Key (opcional) | `contrato (parameters)` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_execution.execution_plans` | ESCRIBE | CREA | DIRECTA | QaExecutionController.createPlan → QaExecutionService.createPlan | `src/modules/qa_execution/services/qa-execution.service.ts:367` |
| `qa_execution.execution_plans` | LEE | LEE | DIRECTA | QaExecutionController.createPlan → QaExecutionService.createPlan | `src/modules/qa_execution/services/qa-execution.service.ts:338` |
| `qa_execution.execution_targets` | LEE | LEE | DIRECTA | QaExecutionController.createPlan → QaExecutionService.createPlan → QaExecutionService.loadContext | `src/modules/qa_execution/services/qa-execution.service.ts:270` |
| `qa_execution.plan_approvals` | LEE | LEE | DIRECTA | QaExecutionController.createPlan → QaExecutionService.createPlan → QaExecutionService.getPlan | `src/modules/qa_execution/services/qa-execution.service.ts:553` |
| `qa_execution.plan_events` | ESCRIBE | CREA | DIRECTA | QaExecutionController.createPlan → QaExecutionService.createPlan → QaExecutionService.appendEvent | `src/modules/qa_execution/services/qa-execution.service.ts:599` |
| `qa_execution.plan_events` | LEE | LEE | DIRECTA | QaExecutionController.createPlan → QaExecutionService.createPlan → QaExecutionService.getPlan | `src/modules/qa_execution/services/qa-execution.service.ts:556` |
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaExecutionController.createPlan → QaExecutionService.createPlan → QaExecutionService.loadContext | `src/modules/qa_execution/services/qa-execution.service.ts:277` |
| `qa_lab.test_environments` | LEE | LEE | DIRECTA | QaExecutionController.createPlan → QaExecutionService.createPlan → QaExecutionService.loadContext | `src/modules/qa_execution/services/qa-execution.service.ts:257` |
| `qa_lab.test_runs` | ESCRIBE | CREA | DIRECTA | QaExecutionController.createPlan → QaExecutionService.createPlan → QaRunsService.createRun → QaRunsRepository.createRun | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:131` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaExecutionController.createPlan → QaExecutionService.createPlan → QaRunsService.createRun → QaRunsRepository.findRunsInProgress | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:217` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaExecutionController.createPlan → QaExecutionService.createPlan → QaExecutionService.loadContext | `src/modules/qa_execution/services/qa-execution.service.ts:251` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `Idempotency-Key` | header | No | `string` | — |

### Cuerpo — DTO `PlanRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `suiteId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:139` |
| `environmentId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:140` |
| `limits` | `RequestedLimitsDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => RequestedLimitsDto)` | El servidor recorta; nunca eleva | `src/modules/qa_execution/dto/qa-execution.dto.ts:149` |
| `limits.maxRequests` | `number` | No | — | — | — | sin fuente |
| `limits.maxDurationSeconds` | `number` | No | — | — | — | sin fuente |
| `limits.requestTimeoutMs` | `number` | No | — | — | — | sin fuente |
| `limits.minIntervalMs` | `number` | No | — | — | — | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "suiteId": "00000000-0000-4000-8000-000000000001",
  "environmentId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "suiteId": "00000000-0000-4000-8000-000000000001",
  "environmentId": "00000000-0000-4000-8000-000000000001",
  "limits": {
    "maxRequests": 1,
    "maxDurationSeconds": 1,
    "requestTimeoutMs": 1,
    "minIntervalMs": 1
  }
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.ACCEPTED`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 202 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plan no encontrado; ResourceNotFoundException: Suite no encontrada; ResourceNotFoundException: Entorno no encontrado |
| 409 | `CONFLICT` | ConflictException: La suite ya tiene una corrida en marcha; ConflictException: No se pudo asignar número de corrida |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La suite no está publicada; PreconditionFailedException: El entorno no está activo; PreconditionFailedException: La suite no tiene casos activos |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_execution.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 68 — Plano de ejecución de QA en el servidor — etapa `ctrl:QaExecutionController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /admin/qa/plans/{planId}

- **Origen:** CONTRATO
- **Nombre:** Plan con pasos, límites, aprobaciones y bitácora ordenada
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaExecutionController.getPlan` — `src/modules/qa_execution/controllers/qa-execution.controller.ts:139`

### Qué es y para qué sirve (negocio)

Plan con pasos, límites, aprobaciones y bitácora ordenada.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/qa/plans/{planId}` la atiende `QaExecutionController.getPlan` (src/modules/qa_execution/controllers/qa-execution.controller.ts:139). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN. Delega en `QaExecutionService.getPlan`. Lee qa_execution.execution_plans, qa_execution.plan_approvals, qa_execution.plan_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN | `src/modules/qa_execution/controllers/qa-execution.controller.ts:139` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: planId | `src/modules/qa_execution/controllers/qa-execution.controller.ts:139` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_execution.execution_plans` | LEE | LEE | DIRECTA | QaExecutionController.getPlan → QaExecutionService.getPlan | `src/modules/qa_execution/services/qa-execution.service.ts:549` |
| `qa_execution.plan_approvals` | LEE | LEE | DIRECTA | QaExecutionController.getPlan → QaExecutionService.getPlan | `src/modules/qa_execution/services/qa-execution.service.ts:553` |
| `qa_execution.plan_events` | LEE | LEE | DIRECTA | QaExecutionController.getPlan → QaExecutionService.getPlan | `src/modules/qa_execution/services/qa-execution.service.ts:556` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `planId` | path | Sí | `string` | — |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plan no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_execution.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 68 — Plano de ejecución de QA en el servidor — etapa `ctrl:QaExecutionController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /admin/qa/plans/{planId}/approvals

- **Origen:** CONTRATO
- **Nombre:** Aprobar o rechazar el hash vigente del plan, con vencimiento
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaExecutionController.approve` — `src/modules/qa_execution/controllers/qa-execution.controller.ts:148`

### Qué es y para qué sirve (negocio)

Aprobar o rechazar el hash vigente del plan, con vencimiento.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /admin/qa/plans/{planId}/approvals` la atiende `QaExecutionController.approve` (src/modules/qa_execution/controllers/qa-execution.controller.ts:148). Exige sesión con alguno de los roles QA_ADMIN, RELEASE_MANAGER, SECURITY_ADMIN. Valida el cuerpo como `ApprovePlanDto` (4 campos, 3 obligatorios). Delega en `QaExecutionService.approve`. Crea filas en qa_execution.plan_approvals, qa_execution.plan_events. Actualiza qa_execution.execution_plans. Lee qa_execution.execution_plans, qa_execution.plan_approvals, qa_execution.plan_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, RELEASE_MANAGER, SECURITY_ADMIN | `src/modules/qa_execution/controllers/qa-execution.controller.ts:148` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: planId | `src/modules/qa_execution/controllers/qa-execution.controller.ts:148` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_execution.execution_plans` | ESCRIBE | ACTUALIZA | POR_TIPO | QaExecutionController.approve → QaExecutionService.approve | `src/modules/qa_execution/services/qa-execution.service.ts:460` |
| `qa_execution.execution_plans` | LEE | LEE | DIRECTA | QaExecutionController.approve → QaExecutionService.approve | `src/modules/qa_execution/services/qa-execution.service.ts:413` |
| `qa_execution.plan_approvals` | ESCRIBE | CREA | DIRECTA | QaExecutionController.approve → QaExecutionService.approve | `src/modules/qa_execution/services/qa-execution.service.ts:449` |
| `qa_execution.plan_approvals` | LEE | LEE | DIRECTA | QaExecutionController.approve → QaExecutionService.approve → QaExecutionService.getPlan | `src/modules/qa_execution/services/qa-execution.service.ts:553` |
| `qa_execution.plan_events` | ESCRIBE | CREA | DIRECTA | QaExecutionController.approve → QaExecutionService.approve → QaExecutionService.appendEvent | `src/modules/qa_execution/services/qa-execution.service.ts:599` |
| `qa_execution.plan_events` | LEE | LEE | DIRECTA | QaExecutionController.approve → QaExecutionService.approve → QaExecutionService.getPlan | `src/modules/qa_execution/services/qa-execution.service.ts:556` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `planId` | path | Sí | `string` | — |

### Cuerpo — DTO `ApprovePlanDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: APPROVED, REJECTED | `@IsIn(['APPROVED', 'REJECTED'])` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:155` |
| `planHash` | `string` | Sí | patrón runtime /^[0-9a-f]{64}$/ | `@IsString()` `@Matches(/^[0-9a-f]{64}$/)` | Hash del plan revisado; si cambió, la aprobación no aplica | `src/modules/qa_execution/dto/qa-execution.dto.ts:162` |
| `reason` | `string` | Sí | longitud mínima 10; longitud máxima 1000 | `@IsString()` `@MinLength(10)` `@MaxLength(1000)` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:168` |
| `expiresInMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@Min(5)` `@Max(240)` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:176` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "APPROVED",
  "planHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "APPROVED",
  "planHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "reason": "Texto descriptivo de ejemplo",
  "expiresInMinutes": 60
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plan no encontrado |
| 409 | `CONFLICT` | ConflictException: El plan no está esperando aprobación; ConflictException: El plan revisado no es el vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/qa_execution.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 68 — Plano de ejecución de QA en el servidor — etapa `ctrl:QaExecutionController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /admin/qa/plans/{planId}/cancel

- **Origen:** CONTRATO
- **Nombre:** Pedir la cancelación (el runner la confirma entre casos)
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaExecutionController.cancel` — `src/modules/qa_execution/controllers/qa-execution.controller.ts:167`

### Qué es y para qué sirve (negocio)

Pedir la cancelación (el runner la confirma entre casos).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /admin/qa/plans/{planId}/cancel` la atiende `QaExecutionController.cancel` (src/modules/qa_execution/controllers/qa-execution.controller.ts:167). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER. Delega en `QaExecutionService.cancel`. Crea filas en qa_execution.plan_events. Actualiza qa_execution.execution_plans. Lee qa_execution.execution_plans, qa_execution.plan_approvals, qa_execution.plan_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER | `src/modules/qa_execution/controllers/qa-execution.controller.ts:167` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| PARAMETRO_RUTA | Deben ser UUID válidos: planId | `src/modules/qa_execution/controllers/qa-execution.controller.ts:167` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_execution.execution_plans` | ESCRIBE | ACTUALIZA | POR_TIPO | QaExecutionController.cancel → QaExecutionService.cancel | `src/modules/qa_execution/services/qa-execution.service.ts:494` |
| `qa_execution.execution_plans` | LEE | LEE | DIRECTA | QaExecutionController.cancel → QaExecutionService.cancel | `src/modules/qa_execution/services/qa-execution.service.ts:481` |
| `qa_execution.plan_approvals` | LEE | LEE | DIRECTA | QaExecutionController.cancel → QaExecutionService.cancel → QaExecutionService.getPlan | `src/modules/qa_execution/services/qa-execution.service.ts:553` |
| `qa_execution.plan_events` | ESCRIBE | CREA | DIRECTA | QaExecutionController.cancel → QaExecutionService.cancel → QaExecutionService.appendEvent | `src/modules/qa_execution/services/qa-execution.service.ts:599` |
| `qa_execution.plan_events` | LEE | LEE | DIRECTA | QaExecutionController.cancel → QaExecutionService.cancel → QaExecutionService.getPlan | `src/modules/qa_execution/services/qa-execution.service.ts:556` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `planId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado` · HTTP `HttpStatus.ACCEPTED`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 202 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Plan no encontrado |
| 409 | `CONFLICT` | ConflictException: El plan ya terminó |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_execution.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 68 — Plano de ejecución de QA en el servidor — etapa `ctrl:QaExecutionController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /admin/qa/plans/preflight

- **Origen:** CONTRATO
- **Nombre:** Dry-run: pasos, URL resueltas, límites recortados, hash y si requiere aprobación. No llama a nada
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaExecutionController.preflight` — `src/modules/qa_execution/controllers/qa-execution.controller.ts:91`

### Qué es y para qué sirve (negocio)

Dry-run: pasos, URL resueltas, límites recortados, hash y si requiere aprobación. No llama a nada.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /admin/qa/plans/preflight` la atiende `QaExecutionController.preflight` (src/modules/qa_execution/controllers/qa-execution.controller.ts:91). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER. Valida el cuerpo como `PlanRequestDto` (7 campos, 2 obligatorios). Delega en `QaExecutionService.preflight`. Lee qa_execution.execution_targets, qa_lab.test_cases, qa_lab.test_environments, qa_lab.test_suites.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER | `src/modules/qa_execution/controllers/qa-execution.controller.ts:91` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:180` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_execution.execution_targets` | LEE | LEE | DIRECTA | QaExecutionController.preflight → QaExecutionService.preflight → QaExecutionService.loadContext | `src/modules/qa_execution/services/qa-execution.service.ts:270` |
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaExecutionController.preflight → QaExecutionService.preflight → QaExecutionService.loadContext | `src/modules/qa_execution/services/qa-execution.service.ts:277` |
| `qa_lab.test_environments` | LEE | LEE | DIRECTA | QaExecutionController.preflight → QaExecutionService.preflight → QaExecutionService.loadContext | `src/modules/qa_execution/services/qa-execution.service.ts:257` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaExecutionController.preflight → QaExecutionService.preflight → QaExecutionService.loadContext | `src/modules/qa_execution/services/qa-execution.service.ts:251` |

### Cuerpo — DTO `PlanRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `suiteId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:139` |
| `environmentId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/qa_execution/dto/qa-execution.dto.ts:140` |
| `limits` | `RequestedLimitsDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => RequestedLimitsDto)` | El servidor recorta; nunca eleva | `src/modules/qa_execution/dto/qa-execution.dto.ts:149` |
| `limits.maxRequests` | `number` | No | — | — | — | sin fuente |
| `limits.maxDurationSeconds` | `number` | No | — | — | — | sin fuente |
| `limits.requestTimeoutMs` | `number` | No | — | — | — | sin fuente |
| `limits.minIntervalMs` | `number` | No | — | — | — | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "suiteId": "00000000-0000-4000-8000-000000000001",
  "environmentId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "suiteId": "00000000-0000-4000-8000-000000000001",
  "environmentId": "00000000-0000-4000-8000-000000000001",
  "limits": {
    "maxRequests": 1,
    "maxDurationSeconds": 1,
    "requestTimeoutMs": 1,
    "minIntervalMs": 1
  }
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Suite no encontrada; ResourceNotFoundException: Entorno no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_execution.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 68 — Plano de ejecución de QA en el servidor — etapa `ctrl:QaExecutionController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /admin/qa/targets

- **Origen:** CONTRATO
- **Nombre:** Destinos aprobados por entorno (sin valores de secretos)
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaExecutionController.listTargets` — `src/modules/qa_execution/controllers/qa-execution.controller.ts:63`

### Qué es y para qué sirve (negocio)

Destinos aprobados por entorno (sin valores de secretos).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/qa/targets` la atiende `QaExecutionController.listTargets` (src/modules/qa_execution/controllers/qa-execution.controller.ts:63). Exige sesión con alguno de los roles QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN. Delega en `QaExecutionService.listTargets`. Lee qa_execution.execution_targets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: QA_ADMIN, QA_ENGINEER, RELEASE_MANAGER, PLATFORM_ADMIN | `src/modules/qa_execution/controllers/qa-execution.controller.ts:63` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_execution.execution_targets` | LEE | LEE | DIRECTA | QaExecutionController.listTargets → QaExecutionService.listTargets | `src/modules/qa_execution/services/qa-execution.service.ts:193` |

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

El árbol de decisión completo está en [flujos](../flujos/qa_execution.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 68 — Plano de ejecución de QA en el servidor — etapa `ctrl:QaExecutionController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /internal/qa/plans/run-next

- **Origen:** CONTRATO
- **Nombre:** Reclamar y ejecutar el siguiente plan (worker)
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `QaExecutionInternalController.runNext` — `src/modules/qa_execution/controllers/qa-execution.controller.ts:193`

### Qué es y para qué sirve (negocio)

Reclamar y ejecutar el siguiente plan (worker).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /internal/qa/plans/run-next` la atiende `QaExecutionInternalController.runNext` (src/modules/qa_execution/controllers/qa-execution.controller.ts:193). Exige sesión con alguno de los roles SYSTEM. Delega en `QaExecutionService.runNext`. Crea filas en qa_execution.plan_events, qa_lab.assertion_results, qa_lab.request_payloads, qa_lab.response_payloads, qa_lab.test_case_results. Actualiza qa_execution.execution_plans, qa_lab.test_case_results. Lee qa_execution.execution_plans, qa_execution.execution_targets, qa_execution.plan_approvals, qa_execution.plan_events, qa_lab.assertion_results, qa_lab.test_assertions, qa_lab.test_case_results, qa_lab.test_cases y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/qa_execution/controllers/qa-execution.controller.ts:193` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:282` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:149` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `qa_execution.execution_plans` | ESCRIBE | ACTUALIZA | POR_TIPO | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaExecutionService.close | `src/modules/qa_execution/services/qa-execution.service.ts:937` |
| `qa_execution.execution_plans` | LEE | LEE | DIRECTA | QaExecutionInternalController.runNext → QaExecutionService.runNext | `src/modules/qa_execution/services/qa-execution.service.ts:660` |
| `qa_execution.execution_targets` | LEE | LEE | DIRECTA | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaExecutionService.loadContext | `src/modules/qa_execution/services/qa-execution.service.ts:270` |
| `qa_execution.plan_approvals` | LEE | LEE | DIRECTA | QaExecutionInternalController.runNext → QaExecutionService.runNext | `src/modules/qa_execution/services/qa-execution.service.ts:690` |
| `qa_execution.plan_events` | ESCRIBE | CREA | DIRECTA | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaExecutionService.appendEvent | `src/modules/qa_execution/services/qa-execution.service.ts:599` |
| `qa_execution.plan_events` | LEE | LEE | POR_SQL | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaExecutionService.appendEvent | `src/modules/qa_execution/services/qa-execution.service.ts:594` |
| `qa_lab.assertion_results` | ESCRIBE | CREA | DIRECTA | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaRunsService.evaluateResult → QaRunsRepository.createAssertionResult | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:370` |
| `qa_lab.assertion_results` | LEE | LEE | DIRECTA | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaRunsService.evaluateResult → QaRunsRepository.countAssertionResults | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:396` |
| `qa_lab.request_payloads` | ESCRIBE | CREA | DIRECTA | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaRunsService.executeCase → QaRunsRepository.createRequestPayload | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:447` |
| `qa_lab.response_payloads` | ESCRIBE | CREA | DIRECTA | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaRunsService.executeCase → QaRunsRepository.createResponsePayload | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:515` |
| `qa_lab.test_assertions` | LEE | LEE | DIRECTA | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaRunsService.evaluateResult → QaCatalogRepository.findAssertionsByCase | `src/modules/qa_lab/infrastructure/repositories/qa-catalog.repository.ts:426` |
| `qa_lab.test_case_results` | ESCRIBE | CREA | DIRECTA | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaRunsService.executeCase → QaRunsRepository.createCaseResult | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:273` |
| `qa_lab.test_case_results` | ESCRIBE | ACTUALIZA | POR_TIPO | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaRunsService.evaluateResult | `src/modules/qa_lab/application/services/qa-runs.service.ts:471` |
| `qa_lab.test_case_results` | LEE | LEE | DIRECTA | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaRunsService.executeCase → QaRunsRepository.findCaseResult | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:329` |
| `qa_lab.test_cases` | LEE | LEE | DIRECTA | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaExecutionService.loadContext | `src/modules/qa_execution/services/qa-execution.service.ts:277` |
| `qa_lab.test_environments` | LEE | LEE | DIRECTA | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaExecutionService.loadContext | `src/modules/qa_execution/services/qa-execution.service.ts:257` |
| `qa_lab.test_runs` | LEE | LEE | DIRECTA | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaRunsService.executeCase → QaRunsRepository.findRunForUpdate | `src/modules/qa_lab/infrastructure/repositories/qa-runs.repository.ts:178` |
| `qa_lab.test_suites` | LEE | LEE | DIRECTA | QaExecutionInternalController.runNext → QaExecutionService.runNext → QaExecutionService.loadContext | `src/modules/qa_execution/services/qa-execution.service.ts:251` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Suite no encontrada; ResourceNotFoundException: Entorno no encontrado |
| 409 | `CONFLICT` | ConflictException: La corrida ya está cerrada; ConflictException: El caso ya se ejecutó en esta corrida; ConflictException: El resultado ya fue evaluado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso pertenece a otra suite; PreconditionFailedException: El caso falló en transporte: no hay respuesta que evaluar; PreconditionFailedException: El caso no tiene aserciones |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/qa_execution.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 68 — Plano de ejecución de QA en el servidor — etapa `ctrl:QaExecutionInternalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

