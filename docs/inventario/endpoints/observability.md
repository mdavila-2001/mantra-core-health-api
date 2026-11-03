<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `observability`

- **Bloque:** —
- **Operaciones:** 14 (0 en el contrato, 14 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 1 · BAJO 13
- **Tablas distintas que tocan:** 7
- **Respuestas de error y detalle contractual:** `openapi/endpoints/observability.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/admin/observability/coverage` | — | BAJO | 1 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 2 | GET | `/admin/observability/endpoints` | — | BAJO | 3 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 3 | GET | `/admin/observability/errors/events` | — | BAJO | 2 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 4 | GET | `/admin/observability/errors/groups` | — | BAJO | 3 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 5 | GET | `/admin/observability/errors/groups/{id}` | — | BAJO | 3 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 6 | PATCH | `/admin/observability/errors/groups/{id}` | Cambia el estado de un grupo. **Sin** `@PlatformScopeOptional`: muta, así que exige una organización elegida (o un rol global con resolución propia, como `SUPERADMIN`). Es la decisión conservadora; ver el README del módulo. | MEDIO | 2 | PLATFORM_ADMIN, SRE |
| 7 | GET | `/admin/observability/modules` | — | BAJO | 3 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 8 | GET | `/admin/observability/requests/{requestId}` | — | BAJO | 2 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 9 | GET | `/admin/observability/sql/slow` | — | BAJO | 2 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 10 | GET | `/admin/observability/sql/statements` | — | BAJO | 3 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 11 | GET | `/admin/observability/sql/statements/{hash}` | — | BAJO | 4 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 12 | GET | `/admin/observability/summary` | — | BAJO | 4 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 13 | GET | `/admin/observability/timeseries` | — | BAJO | 4 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 14 | GET | `/internal/observability/selftest/fail` | — | BAJO | 0 | SYSTEM |

---

## 1. GET /admin/observability/coverage

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObservabilityController.coverage` — `src/modules/observability/presentation/controllers/observability.controller.ts:85`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Answers "is the system healthy, what is failing, how often, since when and where does the time go" for platform operators: grouped errors with a fingerprint and a request id to jump to the trace…»

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_70_observability.puml:67`)

### Cómo se atiende (sistema)

`GET /admin/observability/coverage` la atiende `ObservabilityController.coverage` (src/modules/observability/presentation/controllers/observability.controller.ts:85). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `ObservabilityReadService.coverage`. Lee observability.instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/observability/presentation/controllers/observability.controller.ts:85` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `observability.instances` | LEE | LEE | POR_SQL | ObservabilityController.coverage → ObservabilityReadService.coverage → ObservabilityReadRepository.instances | `src/modules/observability/infrastructure/observability-read.repository.ts:179` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `WindowQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/observability.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- observability — portal «Sistema» (módulo 70) — etapa `ctrl:ObservabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /admin/observability/endpoints

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObservabilityController.endpoints` — `src/modules/observability/presentation/controllers/observability.controller.ts:69`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Answers "is the system healthy, what is failing, how often, since when and where does the time go" for platform operators: grouped errors with a fingerprint and a request id to jump to the trace…»

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_70_observability.puml:67`)

### Cómo se atiende (sistema)

`GET /admin/observability/endpoints` la atiende `ObservabilityController.endpoints` (src/modules/observability/presentation/controllers/observability.controller.ts:69). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `ObservabilityReadService.endpoints`. Lee observability.error_groups, observability.http_request_minute_series, observability.instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/observability/presentation/controllers/observability.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `observability.error_groups` | LEE | LEE | POR_SQL | ObservabilityController.endpoints → ObservabilityReadService.endpoints → ObservabilityReadRepository.openGroupCounts | `src/modules/observability/infrastructure/observability-read.repository.ts:278` |
| `observability.http_request_minute_series` | LEE | LEE | POR_SQL | ObservabilityController.endpoints → ObservabilityReadService.endpoints → ObservabilityReadRepository.httpByEndpoint | `src/modules/observability/infrastructure/observability-read.repository.ts:235` |
| `observability.instances` | LEE | LEE | POR_SQL | ObservabilityController.endpoints → ObservabilityReadService.endpoints → ObservabilityReadService.envelope → ObservabilityReadRepository.instanceActivity | `src/modules/observability/infrastructure/observability-read.repository.ts:155` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `EndpointsQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/observability.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- observability — portal «Sistema» (módulo 70) — etapa `ctrl:ObservabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /admin/observability/errors/events

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObservabilityController.errorEvents` — `src/modules/observability/presentation/controllers/observability.controller.ts:116`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Answers "is the system healthy, what is failing, how often, since when and where does the time go" for platform operators: grouped errors with a fingerprint and a request id to jump to the trace…»

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_70_observability.puml:67`)

### Cómo se atiende (sistema)

`GET /admin/observability/errors/events` la atiende `ObservabilityController.errorEvents` (src/modules/observability/presentation/controllers/observability.controller.ts:116). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `ObservabilityReadService.errorEvents`. Lee observability.error_events, observability.instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/observability/presentation/controllers/observability.controller.ts:116` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `observability.error_events` | LEE | LEE | POR_SQL | ObservabilityController.errorEvents → ObservabilityReadService.errorEvents → ObservabilityReadRepository.listEvents | `src/modules/observability/infrastructure/observability-read.repository.ts:521` |
| `observability.instances` | LEE | LEE | POR_SQL | ObservabilityController.errorEvents → ObservabilityReadService.errorEvents → ObservabilityReadService.envelope → ObservabilityReadRepository.instanceActivity | `src/modules/observability/infrastructure/observability-read.repository.ts:155` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `ErrorEventsQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/observability.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- observability — portal «Sistema» (módulo 70) — etapa `ctrl:ObservabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /admin/observability/errors/groups

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObservabilityController.errorGroups` — `src/modules/observability/presentation/controllers/observability.controller.ts:95`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Answers "is the system healthy, what is failing, how often, since when and where does the time go" for platform operators: grouped errors with a fingerprint and a request id to jump to the trace…»

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_70_observability.puml:67`)

### Cómo se atiende (sistema)

`GET /admin/observability/errors/groups` la atiende `ObservabilityController.errorGroups` (src/modules/observability/presentation/controllers/observability.controller.ts:95). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `ObservabilityReadService.errorGroups`. Lee observability.error_events, observability.error_groups, observability.instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/observability/presentation/controllers/observability.controller.ts:95` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `observability.error_events` | LEE | LEE | POR_SQL | ObservabilityController.errorGroups → ObservabilityReadService.errorGroups → ObservabilityReadRepository.groupActivity | `src/modules/observability/infrastructure/observability-read.repository.ts:399` |
| `observability.error_groups` | LEE | LEE | POR_SQL | ObservabilityController.errorGroups → ObservabilityReadService.errorGroups → ObservabilityReadRepository.listErrorGroups | `src/modules/observability/infrastructure/observability-read.repository.ts:363` |
| `observability.instances` | LEE | LEE | POR_SQL | ObservabilityController.errorGroups → ObservabilityReadService.errorGroups → ObservabilityReadService.envelope → ObservabilityReadRepository.instanceActivity | `src/modules/observability/infrastructure/observability-read.repository.ts:155` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `ErrorGroupsQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/observability.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- observability — portal «Sistema» (módulo 70) — etapa `ctrl:ObservabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /admin/observability/errors/groups/{id}

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObservabilityController.errorGroup` — `src/modules/observability/presentation/controllers/observability.controller.ts:105`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Answers "is the system healthy, what is failing, how often, since when and where does the time go" for platform operators: grouped errors with a fingerprint and a request id to jump to the trace…»

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_70_observability.puml:67`)

### Cómo se atiende (sistema)

`GET /admin/observability/errors/groups/{id}` la atiende `ObservabilityController.errorGroup` (src/modules/observability/presentation/controllers/observability.controller.ts:105). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `ObservabilityReadService.errorGroup`. Lee observability.error_events, observability.error_groups, observability.instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/observability/presentation/controllers/observability.controller.ts:105` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/observability/presentation/controllers/observability.controller.ts:105` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `observability.error_events` | LEE | LEE | POR_SQL | ObservabilityController.errorGroup → ObservabilityReadService.errorGroup → ObservabilityReadRepository.groupActivity | `src/modules/observability/infrastructure/observability-read.repository.ts:399` |
| `observability.error_groups` | LEE | LEE | POR_SQL | ObservabilityController.errorGroup → ObservabilityReadService.errorGroup → ObservabilityReadRepository.getErrorGroup | `src/modules/observability/infrastructure/observability-read.repository.ts:376` |
| `observability.instances` | LEE | LEE | POR_SQL | ObservabilityController.errorGroup → ObservabilityReadService.errorGroup → ObservabilityReadService.envelope → ObservabilityReadRepository.instanceActivity | `src/modules/observability/infrastructure/observability-read.repository.ts:155` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `—` | query | sin dato | `IntervalWindowQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/observability.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- observability — portal «Sistema» (módulo 70) — etapa `ctrl:ObservabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. PATCH /admin/observability/errors/groups/{id}

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Cambia el estado de un grupo. **Sin** `@PlatformScopeOptional`: muta, así que exige una organización elegida (o un rol global con resolución propia, como `SUPERADMIN`). Es la decisión conservadora; ver el README del módulo.
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObservabilityController.changeErrorGroupState` — `src/modules/observability/presentation/controllers/observability.controller.ts:140`

### Qué es y para qué sirve (negocio)

Cambia el estado de un grupo. **Sin** `@PlatformScopeOptional`: muta, así que exige una organización elegida (o un rol global con resolución propia, como `SUPERADMIN`). Es la decisión conservadora; ver el README del módulo. Dentro del módulo (descripción del modelo, en inglés): «Answers "is the system healthy, what is failing, how often, since when and where does the time go" for platform operators: grouped errors with a fingerprint and a request id to jump to the trace…»

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_70_observability.puml:67`)

### Cómo se atiende (sistema)

`PATCH /admin/observability/errors/groups/{id}` la atiende `ObservabilityController.changeErrorGroupState` (src/modules/observability/presentation/controllers/observability.controller.ts:140). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE. Valida el cuerpo como `ChangeErrorGroupStateDto` (3 campos, 2 obligatorios). Delega en `ObservabilityReadService.changeGroupState`. Actualiza observability.error_groups. Lee observability.error_groups.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE | `src/modules/observability/presentation/controllers/observability.controller.ts:140` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/observability/presentation/controllers/observability.controller.ts:140` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `observability.error_groups` | ESCRIBE | ACTUALIZA | POR_SQL | ObservabilityController.changeErrorGroupState → ObservabilityReadService.changeGroupState → ObservabilityReadRepository.changeState | `src/modules/observability/infrastructure/observability-read.repository.ts:579` |
| `observability.error_groups` | LEE | LEE | POR_SQL | ObservabilityController.changeErrorGroupState → ObservabilityReadService.changeGroupState → ObservabilityReadRepository.getErrorGroup | `src/modules/observability/infrastructure/observability-read.repository.ts:376` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ChangeErrorGroupStateDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `state` | `string` | Sí | valores: NEW, SEEN, RESOLVED, IGNORED | `@IsIn(['NEW', 'SEEN', 'RESOLVED', 'IGNORED'])` | — | `src/modules/observability/presentation/dto/observability-query.dto.ts:188` |
| `note` | `string` | No | longitud mínima 1; longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(1000)` | Motivo; obligatorio (≥ 3 caracteres) al resolver o ignorar | `src/modules/observability/presentation/dto/observability-query.dto.ts:197` |
| `expectedVersion` | `number` | Sí | mínimo 1 | `@Type(() => Number)` `@IsInt()` `@Min(1)` | `rowVersion` que el cliente leyó; si cambió, 409 CONCURRENCY_CONFLICT | `src/modules/observability/presentation/dto/observability-query.dto.ts:207` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "state": "NEW",
  "expectedVersion": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "state": "NEW",
  "note": "valor-ejemplo",
  "expectedVersion": 1
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

El árbol de decisión completo está en [flujos](../flujos/observability.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- observability — portal «Sistema» (módulo 70) — etapa `ctrl:ObservabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /admin/observability/modules

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObservabilityController.modules` — `src/modules/observability/presentation/controllers/observability.controller.ts:77`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Answers "is the system healthy, what is failing, how often, since when and where does the time go" for platform operators: grouped errors with a fingerprint and a request id to jump to the trace…»

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_70_observability.puml:67`)

### Cómo se atiende (sistema)

`GET /admin/observability/modules` la atiende `ObservabilityController.modules` (src/modules/observability/presentation/controllers/observability.controller.ts:77). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `ObservabilityReadService.modules`. Lee observability.error_groups, observability.http_request_minute_series, observability.instances.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/observability/presentation/controllers/observability.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `observability.error_groups` | LEE | LEE | POR_SQL | ObservabilityController.modules → ObservabilityReadService.modules → ObservabilityReadRepository.openGroupCounts | `src/modules/observability/infrastructure/observability-read.repository.ts:278` |
| `observability.http_request_minute_series` | LEE | LEE | POR_SQL | ObservabilityController.modules → ObservabilityReadService.modules → ObservabilityReadRepository.httpByModule | `src/modules/observability/infrastructure/observability-read.repository.ts:261` |
| `observability.instances` | LEE | LEE | POR_SQL | ObservabilityController.modules → ObservabilityReadService.modules → ObservabilityReadService.envelope → ObservabilityReadRepository.instanceActivity | `src/modules/observability/infrastructure/observability-read.repository.ts:155` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `WindowQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/observability.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- observability — portal «Sistema» (módulo 70) — etapa `ctrl:ObservabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /admin/observability/requests/{requestId}

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObservabilityController.request` — `src/modules/observability/presentation/controllers/observability.controller.ts:124`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Answers "is the system healthy, what is failing, how often, since when and where does the time go" for platform operators: grouped errors with a fingerprint and a request id to jump to the trace…»

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_70_observability.puml:67`)

### Cómo se atiende (sistema)

`GET /admin/observability/requests/{requestId}` la atiende `ObservabilityController.request` (src/modules/observability/presentation/controllers/observability.controller.ts:124). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `ObservabilityReadService.request`. Lee observability.error_events, observability.slow_request_samples.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/observability/presentation/controllers/observability.controller.ts:124` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `observability.error_events` | LEE | LEE | POR_SQL | ObservabilityController.request → ObservabilityReadService.request → ObservabilityReadRepository.byRequestId | `src/modules/observability/infrastructure/observability-read.repository.ts:537` |
| `observability.slow_request_samples` | LEE | LEE | POR_SQL | ObservabilityController.request → ObservabilityReadService.request → ObservabilityReadRepository.byRequestId | `src/modules/observability/infrastructure/observability-read.repository.ts:549` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `requestId` | path | Sí | `string` | — |

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

El árbol de decisión completo está en [flujos](../flujos/observability.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- observability — portal «Sistema» (módulo 70) — etapa `ctrl:ObservabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /admin/observability/sql/slow

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObservabilityController.sqlSlow` — `src/modules/observability/presentation/controllers/observability.controller.ts:181`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Answers "is the system healthy, what is failing, how often, since when and where does the time go" for platform operators: grouped errors with a fingerprint and a request id to jump to the trace…»

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_70_observability.puml:67`)

### Cómo se atiende (sistema)

`GET /admin/observability/sql/slow` la atiende `ObservabilityController.sqlSlow` (src/modules/observability/presentation/controllers/observability.controller.ts:181). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `ObservabilityReadService.sqlSlow`. Lee observability.instances, observability.slow_request_samples.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/observability/presentation/controllers/observability.controller.ts:181` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `observability.instances` | LEE | LEE | POR_SQL | ObservabilityController.sqlSlow → ObservabilityReadService.sqlSlow → ObservabilityReadService.envelope → ObservabilityReadRepository.instanceActivity | `src/modules/observability/infrastructure/observability-read.repository.ts:155` |
| `observability.slow_request_samples` | LEE | LEE | POR_SQL | ObservabilityController.sqlSlow → ObservabilityReadService.sqlSlow → ObservabilityReadRepository.listSlowSamples | `src/modules/observability/infrastructure/observability-read.repository.ts:752` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `PageQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/observability.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- observability — portal «Sistema» (módulo 70) — etapa `ctrl:ObservabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. GET /admin/observability/sql/statements

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObservabilityController.sqlStatements` — `src/modules/observability/presentation/controllers/observability.controller.ts:160`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Answers "is the system healthy, what is failing, how often, since when and where does the time go" for platform operators: grouped errors with a fingerprint and a request id to jump to the trace…»

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_70_observability.puml:67`)

### Cómo se atiende (sistema)

`GET /admin/observability/sql/statements` la atiende `ObservabilityController.sqlStatements` (src/modules/observability/presentation/controllers/observability.controller.ts:160). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `ObservabilityReadService.sqlStatements`. Lee observability.instances, observability.sql_statement_minute_series, observability.sql_statements.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/observability/presentation/controllers/observability.controller.ts:160` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `observability.instances` | LEE | LEE | POR_SQL | ObservabilityController.sqlStatements → ObservabilityReadService.sqlStatements → ObservabilityReadService.envelope → ObservabilityReadRepository.instanceActivity | `src/modules/observability/infrastructure/observability-read.repository.ts:155` |
| `observability.sql_statement_minute_series` | LEE | LEE | POR_SQL | ObservabilityController.sqlStatements → ObservabilityReadService.sqlStatements → ObservabilityReadRepository.sqlStatements | `src/modules/observability/infrastructure/observability-read.repository.ts:659` |
| `observability.sql_statements` | LEE | LEE | POR_SQL | ObservabilityController.sqlStatements → ObservabilityReadService.sqlStatements → ObservabilityReadRepository.sqlStatements | `src/modules/observability/infrastructure/observability-read.repository.ts:659` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `SqlStatementsQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/observability.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- observability — portal «Sistema» (módulo 70) — etapa `ctrl:ObservabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. GET /admin/observability/sql/statements/{hash}

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObservabilityController.sqlStatement` — `src/modules/observability/presentation/controllers/observability.controller.ts:170`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Answers "is the system healthy, what is failing, how often, since when and where does the time go" for platform operators: grouped errors with a fingerprint and a request id to jump to the trace…»

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_70_observability.puml:67`)

### Cómo se atiende (sistema)

`GET /admin/observability/sql/statements/{hash}` la atiende `ObservabilityController.sqlStatement` (src/modules/observability/presentation/controllers/observability.controller.ts:170). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `ObservabilityReadService.sqlStatement`. Lee observability.instances, observability.slow_request_samples, observability.sql_statement_minute_series, observability.sql_statements.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/observability/presentation/controllers/observability.controller.ts:170` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `observability.instances` | LEE | LEE | POR_SQL | ObservabilityController.sqlStatement → ObservabilityReadService.sqlStatement → ObservabilityReadService.envelope → ObservabilityReadRepository.instanceActivity | `src/modules/observability/infrastructure/observability-read.repository.ts:155` |
| `observability.slow_request_samples` | LEE | LEE | POR_SQL | ObservabilityController.sqlStatement → ObservabilityReadService.sqlStatement → ObservabilityReadRepository.slowSamplesOfStatement | `src/modules/observability/infrastructure/observability-read.repository.ts:728` |
| `observability.sql_statement_minute_series` | LEE | LEE | POR_SQL | ObservabilityController.sqlStatement → ObservabilityReadService.sqlStatement → ObservabilityReadRepository.sqlStatementSeries | `src/modules/observability/infrastructure/observability-read.repository.ts:694` |
| `observability.sql_statements` | LEE | LEE | POR_SQL | ObservabilityController.sqlStatement → ObservabilityReadService.sqlStatement → ObservabilityReadRepository.sqlStatement | `src/modules/observability/infrastructure/observability-read.repository.ts:682` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `hash` | path | Sí | `string` | — |
| `—` | query | sin dato | `IntervalWindowQueryDto` | — |

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
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY}; DomainException: {HttpStatus.NOT_FOUND} |

El árbol de decisión completo está en [flujos](../flujos/observability.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- observability — portal «Sistema» (módulo 70) — etapa `ctrl:ObservabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. GET /admin/observability/summary

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObservabilityController.summary` — `src/modules/observability/presentation/controllers/observability.controller.ts:49`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Answers "is the system healthy, what is failing, how often, since when and where does the time go" for platform operators: grouped errors with a fingerprint and a request id to jump to the trace…»

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_70_observability.puml:67`)

### Cómo se atiende (sistema)

`GET /admin/observability/summary` la atiende `ObservabilityController.summary` (src/modules/observability/presentation/controllers/observability.controller.ts:49). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `ObservabilityReadService.summary`. Lee observability.error_groups, observability.http_request_minute_series, observability.instances, observability.sql_statement_minute_series.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/observability/presentation/controllers/observability.controller.ts:49` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `observability.error_groups` | LEE | LEE | POR_SQL | ObservabilityController.summary → ObservabilityReadService.summary → ObservabilityReadRepository.errorGroupSummary | `src/modules/observability/infrastructure/observability-read.repository.ts:299` |
| `observability.http_request_minute_series` | LEE | LEE | POR_SQL | ObservabilityController.summary → ObservabilityReadService.summary → ObservabilityReadRepository.httpTotals | `src/modules/observability/infrastructure/observability-read.repository.ts:195` |
| `observability.instances` | LEE | LEE | POR_SQL | ObservabilityController.summary → ObservabilityReadService.summary → ObservabilityReadService.envelope → ObservabilityReadRepository.instanceActivity | `src/modules/observability/infrastructure/observability-read.repository.ts:155` |
| `observability.sql_statement_minute_series` | LEE | LEE | POR_SQL | ObservabilityController.summary → ObservabilityReadService.summary → ObservabilityReadRepository.sqlTotals | `src/modules/observability/infrastructure/observability-read.repository.ts:611` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `WindowQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/observability.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- observability — portal «Sistema» (módulo 70) — etapa `ctrl:ObservabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. GET /admin/observability/timeseries

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObservabilityController.timeseries` — `src/modules/observability/presentation/controllers/observability.controller.ts:59`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Answers "is the system healthy, what is failing, how often, since when and where does the time go" for platform operators: grouped errors with a fingerprint and a request id to jump to the trace…»

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_70_observability.puml:67`)

### Cómo se atiende (sistema)

`GET /admin/observability/timeseries` la atiende `ObservabilityController.timeseries` (src/modules/observability/presentation/controllers/observability.controller.ts:59). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `ObservabilityReadService.timeseries`. Lee observability.error_events, observability.http_request_minute_series, observability.instances, observability.sql_statement_minute_series.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/observability/presentation/controllers/observability.controller.ts:59` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `observability.error_events` | LEE | LEE | POR_SQL | ObservabilityController.timeseries → ObservabilityReadService.timeseries → ObservabilityReadRepository.listEventBuckets | `src/modules/observability/infrastructure/observability-read.repository.ts:447` |
| `observability.http_request_minute_series` | LEE | LEE | POR_SQL | ObservabilityController.timeseries → ObservabilityReadService.timeseries → ObservabilityReadRepository.httpSeries | `src/modules/observability/infrastructure/observability-read.repository.ts:216` |
| `observability.instances` | LEE | LEE | POR_SQL | ObservabilityController.timeseries → ObservabilityReadService.timeseries → ObservabilityReadService.envelope → ObservabilityReadRepository.instanceActivity | `src/modules/observability/infrastructure/observability-read.repository.ts:155` |
| `observability.sql_statement_minute_series` | LEE | LEE | POR_SQL | ObservabilityController.timeseries → ObservabilityReadService.timeseries → ObservabilityReadRepository.sqlSeries | `src/modules/observability/infrastructure/observability-read.repository.ts:625` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `TimeseriesQueryDto` | — |

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
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

El árbol de decisión completo está en [flujos](../flujos/observability.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- observability — portal «Sistema» (módulo 70) — etapa `ctrl:ObservabilityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. GET /internal/observability/selftest/fail

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ObservabilitySelftestController.fail` — `src/modules/observability/presentation/controllers/observability-selftest.controller.ts:32`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Answers "is the system healthy, what is failing, how often, since when and where does the time go" for platform operators: grouped errors with a fingerprint and a request id to jump to the trace…»

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_70_observability.puml:67`)

### Cómo se atiende (sistema)

`GET /internal/observability/selftest/fail` la atiende `ObservabilitySelftestController.fail` (src/modules/observability/presentation/controllers/observability-selftest.controller.ts:32). Exige sesión con alguno de los roles SYSTEM. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/observability/presentation/controllers/observability-selftest.controller.ts:32` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/observability/presentation/controllers/observability-selftest.controller.ts:32`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `SelftestFailQuery` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `never` · HTTP `500`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | NotFoundException |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | TypeError: no se puede leer {String(holder.value.deep)}; Error: selftest: falla controlada |
| 500 | — | Éxito |

El árbol de decisión completo está en [flujos](../flujos/observability.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- observability — portal «Sistema» (módulo 70) — etapa `ctrl:ObservabilitySelftestController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

