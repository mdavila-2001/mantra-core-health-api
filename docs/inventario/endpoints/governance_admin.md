<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `governance_admin`

- **Bloque:** —
- **Operaciones:** 5 (0 en el contrato, 5 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 1 · BAJO 4
- **Tablas distintas que tocan:** 5
- **Respuestas de error y detalle contractual:** `openapi/endpoints/governance-admin.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/admin/governance/data-quality/issues` | — | BAJO | 3 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD |
| 2 | GET | `/admin/governance/data-quality/issues/{id}` | — | BAJO | 3 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD |
| 3 | POST | `/admin/governance/data-quality/issues/{id}/resolution` | — | MEDIO | 4 | GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD, PLATFORM_ADMIN |
| 4 | GET | `/admin/governance/data-quality/rules` | — | BAJO | 3 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD |
| 5 | GET | `/admin/governance/data-quality/rules/{id}` | — | BAJO | 5 | SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD |

---

## 1. GET /admin/governance/data-quality/issues

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminDataQualityController.issues` — `src/modules/governance_admin/controllers/admin-data-quality.controller.ts:52`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`GET /admin/governance/data-quality/issues` la atiende `AdminDataQualityController.issues` (src/modules/governance_admin/controllers/admin-data-quality.controller.ts:52). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. Delega en `DataQualityService.listIssues`. Lee health_data.health_data_quality_issues, health_data.health_data_quality_rules, health_data.health_data_quality_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD | `src/modules/governance_admin/controllers/admin-data-quality.controller.ts:52` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/governance_admin/controllers/admin-data-quality.controller.ts:52` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.health_data_quality_issues` | LEE | LEE | POR_SQL | AdminDataQualityController.issues → DataQualityService.listIssues → DataQualityRepository.listIssues | `src/modules/governance_admin/repositories/data-quality.repository.ts:164` |
| `health_data.health_data_quality_rules` | LEE | LEE | POR_SQL | AdminDataQualityController.issues → DataQualityService.listIssues → DataQualityRepository.listIssues | `src/modules/governance_admin/repositories/data-quality.repository.ts:164` |
| `health_data.health_data_quality_runs` | LEE | LEE | POR_SQL | AdminDataQualityController.issues → DataQualityService.listIssues → DataQualityRepository.listIssues | `src/modules/governance_admin/repositories/data-quality.repository.ts:164` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `IssuesQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/governance_admin.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- governance_admin — etapa `ctrl:AdminDataQualityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /admin/governance/data-quality/issues/{id}

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminDataQualityController.issue` — `src/modules/governance_admin/controllers/admin-data-quality.controller.ts:65`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`GET /admin/governance/data-quality/issues/{id}` la atiende `AdminDataQualityController.issue` (src/modules/governance_admin/controllers/admin-data-quality.controller.ts:65). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. Delega en `DataQualityService.getIssue`. Lee health_data.health_data_quality_issues, health_data.health_data_quality_rules, health_data.health_data_quality_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD | `src/modules/governance_admin/controllers/admin-data-quality.controller.ts:65` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/governance_admin/controllers/admin-data-quality.controller.ts:65` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.health_data_quality_issues` | LEE | LEE | POR_SQL | AdminDataQualityController.issue → DataQualityService.getIssue → DataQualityRepository.findIssue | `src/modules/governance_admin/repositories/data-quality.repository.ts:173` |
| `health_data.health_data_quality_rules` | LEE | LEE | POR_SQL | AdminDataQualityController.issue → DataQualityService.getIssue → DataQualityRepository.findIssue | `src/modules/governance_admin/repositories/data-quality.repository.ts:173` |
| `health_data.health_data_quality_runs` | LEE | LEE | POR_SQL | AdminDataQualityController.issue → DataQualityService.getIssue → DataQualityRepository.findIssue | `src/modules/governance_admin/repositories/data-quality.repository.ts:173` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | path | Sí | `IdParamDto` | — |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Incidencia no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/governance_admin.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- governance_admin — etapa `ctrl:AdminDataQualityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /admin/governance/data-quality/issues/{id}/resolution

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminDataQualityController.resolve` — `src/modules/governance_admin/controllers/admin-data-quality.controller.ts:78`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`POST /admin/governance/data-quality/issues/{id}/resolution` la atiende `AdminDataQualityController.resolve` (src/modules/governance_admin/controllers/admin-data-quality.controller.ts:78). Exige sesión con alguno de los roles GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD, PLATFORM_ADMIN. Valida el cuerpo como `ResolveIssueDto` (2 campos, 2 obligatorios). Delega en `DataQualityService.resolve`. Actualiza health_data.health_data_quality_issues. Lee health_data.health_data_quality_issues, health_data.health_data_quality_rules, health_data.health_data_quality_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD, PLATFORM_ADMIN | `src/modules/governance_admin/controllers/admin-data-quality.controller.ts:78` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/governance_admin/controllers/admin-data-quality.controller.ts:78` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.health_data_quality_issues` | ESCRIBE | ACTUALIZA | POR_SQL | AdminDataQualityController.resolve → DataQualityService.resolve → DataQualityRepository.closeIfOpen | `src/modules/governance_admin/repositories/data-quality.repository.ts:191` |
| `health_data.health_data_quality_issues` | LEE | LEE | POR_SQL | AdminDataQualityController.resolve → DataQualityService.resolve → DataQualityRepository.findIssue | `src/modules/governance_admin/repositories/data-quality.repository.ts:173` |
| `health_data.health_data_quality_rules` | LEE | LEE | POR_SQL | AdminDataQualityController.resolve → DataQualityService.resolve → DataQualityRepository.findIssue | `src/modules/governance_admin/repositories/data-quality.repository.ts:173` |
| `health_data.health_data_quality_runs` | LEE | LEE | POR_SQL | AdminDataQualityController.resolve → DataQualityService.resolve → DataQualityRepository.findIssue | `src/modules/governance_admin/repositories/data-quality.repository.ts:173` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | path | Sí | `IdParamDto` | — |

### Cuerpo — DTO `ResolveIssueDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `action` | `object` | Sí | — | `@IsIn(RESOLUTION_ACTIONS)` | Tipo TypeScript no expandido: (typeof RESOLUTION_ACTIONS)[number] | `src/modules/governance_admin/dto/resolve-issue.dto.ts:11` |
| `note` | `string` | Sí | longitud mínima 10; longitud máxima 2000 | `@Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value, )` `@IsString()` `@MinLength(10)` `@MaxLength(2000)` | Motivo de la resolución o del descarte. Es obligatorio y queda en la incidencia. | `src/modules/governance_admin/dto/resolve-issue.dto.ts:25` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "action": {},
  "note": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "action": {},
  "note": "valor-ejemplo"
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Incidencia no encontrada |
| 409 | `CONFLICT` | ConflictException: La incidencia ya no está abierta: otra persona la cerró con otro desenlace |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/governance_admin.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- governance_admin — etapa `ctrl:AdminDataQualityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /admin/governance/data-quality/rules

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminDataQualityController.rules` — `src/modules/governance_admin/controllers/admin-data-quality.controller.ts:99`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`GET /admin/governance/data-quality/rules` la atiende `AdminDataQualityController.rules` (src/modules/governance_admin/controllers/admin-data-quality.controller.ts:99). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. Delega en `DataQualityService.listRules`. Lee health_data.health_data_quality_rule_sets, health_data.health_data_quality_rules, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD | `src/modules/governance_admin/controllers/admin-data-quality.controller.ts:99` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/governance_admin/controllers/admin-data-quality.controller.ts:99` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.health_data_quality_rule_sets` | LEE | LEE | POR_SQL | AdminDataQualityController.rules → DataQualityService.listRules → DataQualityRepository.listRules | `src/modules/governance_admin/repositories/data-quality.repository.ts:240` |
| `health_data.health_data_quality_rules` | LEE | LEE | POR_SQL | AdminDataQualityController.rules → DataQualityService.listRules → DataQualityRepository.listRules | `src/modules/governance_admin/repositories/data-quality.repository.ts:240` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | AdminDataQualityController.rules → DataQualityService.listRules → DataQualityRepository.listRules | `src/modules/governance_admin/repositories/data-quality.repository.ts:240` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `RulesQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/governance_admin.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- governance_admin — etapa `ctrl:AdminDataQualityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /admin/governance/data-quality/rules/{id}

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AdminDataQualityController.rule` — `src/modules/governance_admin/controllers/admin-data-quality.controller.ts:108`

### Qué es y para qué sirve (negocio)

_Sin fuente: ni el contrato, ni el README del módulo ni el modelo la describen._



### Cómo se atiende (sistema)

`GET /admin/governance/data-quality/rules/{id}` la atiende `AdminDataQualityController.rule` (src/modules/governance_admin/controllers/admin-data-quality.controller.ts:108). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. Delega en `DataQualityService.getRule`. Lee health_data.health_data_quality_issues, health_data.health_data_quality_rule_sets, health_data.health_data_quality_rules, health_data.health_data_quality_runs, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD | `src/modules/governance_admin/controllers/admin-data-quality.controller.ts:108` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/governance_admin/controllers/admin-data-quality.controller.ts:108` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.health_data_quality_issues` | LEE | LEE | POR_SQL | AdminDataQualityController.rule → DataQualityService.getRule → DataQualityRepository.issueCountsByStatus | `src/modules/governance_admin/repositories/data-quality.repository.ts:267` |
| `health_data.health_data_quality_rule_sets` | LEE | LEE | POR_SQL | AdminDataQualityController.rule → DataQualityService.getRule → DataQualityRepository.findRule | `src/modules/governance_admin/repositories/data-quality.repository.ts:249` |
| `health_data.health_data_quality_rules` | LEE | LEE | POR_SQL | AdminDataQualityController.rule → DataQualityService.getRule → DataQualityRepository.findRule | `src/modules/governance_admin/repositories/data-quality.repository.ts:249` |
| `health_data.health_data_quality_runs` | LEE | LEE | POR_SQL | AdminDataQualityController.rule → DataQualityService.getRule → DataQualityRepository.recentRuns | `src/modules/governance_admin/repositories/data-quality.repository.ts:283` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | AdminDataQualityController.rule → DataQualityService.getRule → DataQualityRepository.findRule | `src/modules/governance_admin/repositories/data-quality.repository.ts:249` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | path | Sí | `IdParamDto` | — |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Regla no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/governance_admin.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- governance_admin — etapa `ctrl:AdminDataQualityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

