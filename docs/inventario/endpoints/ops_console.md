<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `ops_console`

- **Bloque:** —
- **Operaciones:** 9 (9 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 0 · BAJO 9
- **Tablas distintas que tocan:** 18
- **Respuestas de error y detalle contractual:** `openapi/endpoints/ops-console.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/admin/ops/backups` | Políticas de backup con su última prueba de restauración | BAJO | 2 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 2 | GET | `/admin/ops/change-requests` | Solicitudes de cambio | BAJO | 1 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 3 | GET | `/admin/ops/deployments` | Despliegues recientes | BAJO | 2 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 4 | GET | `/admin/ops/incidents` | Incidentes | BAJO | 2 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 5 | GET | `/admin/ops/incidents/{id}` | Incidente con su timeline | BAJO | 3 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 6 | GET | `/admin/ops/readiness` | Preparación para producción: controles PASS/FAIL/UNKNOWN/N_A con evidencia | BAJO | 14 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 7 | GET | `/admin/ops/slos` | SLO activos con su última medición (numerador y denominador) | BAJO | 3 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 8 | GET | `/admin/ops/traffic` | Tráfico HTTP de la API: solicitudes, éxito, fallos, latencia y usuarios activos | BAJO | 2 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 9 | GET | `/admin/ops/traffic/endpoints` | Endpoints tocados en la ventana, por plantilla de ruta | BAJO | 1 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |

---

## 1. GET /admin/ops/backups

- **Origen:** CONTRATO
- **Nombre:** Políticas de backup con su última prueba de restauración
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsConsoleController.backups` — `src/modules/ops_console/ops-console.controller.ts:153`

### Qué es y para qué sirve (negocio)

Políticas de backup con su última prueba de restauración.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/backups` la atiende `OpsConsoleController.backups` (src/modules/ops_console/ops-console.controller.ts:153). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsConsoleService.listBackups`. Lee system_ops.backup_policies, system_ops.restore_test_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/ops-console.controller.ts:153` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.backup_policies` | LEE | LEE | POR_SQL | OpsConsoleController.backups → OpsConsoleService.listBackups → OpsConsoleRepository.listBackupPolicies | `src/modules/ops_console/ops-console.repository.ts:193` |
| `system_ops.restore_test_runs` | LEE | LEE | POR_SQL | OpsConsoleController.backups → OpsConsoleService.listBackups → OpsConsoleRepository.listBackupPolicies | `src/modules/ops_console/ops-console.repository.ts:193` |

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

El árbol de decisión completo está en [flujos](../flujos/ops_console.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Operations console module — etapa `ctrl:OpsConsoleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /admin/ops/change-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitudes de cambio
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsConsoleController.changeRequests` — `src/modules/ops_console/ops-console.controller.ts:137`

### Qué es y para qué sirve (negocio)

Solicitudes de cambio.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/change-requests` la atiende `OpsConsoleController.changeRequests` (src/modules/ops_console/ops-console.controller.ts:137). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsConsoleService.listChangeRequests`. Lee platform_ops.change_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/ops-console.controller.ts:137` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.change_requests` | LEE | LEE | POR_SQL | OpsConsoleController.changeRequests → OpsConsoleService.listChangeRequests → OpsConsoleRepository.listChangeRequests | `src/modules/ops_console/ops-console.repository.ts:138` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
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

El árbol de decisión completo está en [flujos](../flujos/ops_console.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Operations console module — etapa `ctrl:OpsConsoleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /admin/ops/deployments

- **Origen:** CONTRATO
- **Nombre:** Despliegues recientes
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsConsoleController.deployments` — `src/modules/ops_console/ops-console.controller.ts:130`

### Qué es y para qué sirve (negocio)

Despliegues recientes.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/deployments` la atiende `OpsConsoleController.deployments` (src/modules/ops_console/ops-console.controller.ts:130). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsConsoleService.listDeployments`. Lee platform_ops.deployments, platform_ops.service_components.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/ops-console.controller.ts:130` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.deployments` | LEE | LEE | POR_SQL | OpsConsoleController.deployments → OpsConsoleService.listDeployments → OpsConsoleRepository.listDeployments | `src/modules/ops_console/ops-console.repository.ts:117` |
| `platform_ops.service_components` | LEE | LEE | POR_SQL | OpsConsoleController.deployments → OpsConsoleService.listDeployments → OpsConsoleRepository.listDeployments | `src/modules/ops_console/ops-console.repository.ts:117` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
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

El árbol de decisión completo está en [flujos](../flujos/ops_console.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Operations console module — etapa `ctrl:OpsConsoleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /admin/ops/incidents

- **Origen:** CONTRATO
- **Nombre:** Incidentes
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsConsoleController.incidents` — `src/modules/ops_console/ops-console.controller.ts:116`

### Qué es y para qué sirve (negocio)

Incidentes.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/incidents` la atiende `OpsConsoleController.incidents` (src/modules/ops_console/ops-console.controller.ts:116). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsConsoleService.listIncidents`. Lee platform_ops.health_incidents, platform_ops.service_components.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/ops-console.controller.ts:116` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.health_incidents` | LEE | LEE | POR_SQL | OpsConsoleController.incidents → OpsConsoleService.listIncidents → OpsConsoleRepository.listIncidents | `src/modules/ops_console/ops-console.repository.ts:52` |
| `platform_ops.service_components` | LEE | LEE | POR_SQL | OpsConsoleController.incidents → OpsConsoleService.listIncidents → OpsConsoleRepository.listIncidents | `src/modules/ops_console/ops-console.repository.ts:52` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | — |
| `open` | query | No | `boolean` | Sólo incidentes vivos (abiertos, reconocidos, mitigados) |

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

El árbol de decisión completo está en [flujos](../flujos/ops_console.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Operations console module — etapa `ctrl:OpsConsoleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /admin/ops/incidents/{id}

- **Origen:** CONTRATO
- **Nombre:** Incidente con su timeline
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsConsoleController.incident` — `src/modules/ops_console/ops-console.controller.ts:123`

### Qué es y para qué sirve (negocio)

Incidente con su timeline.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/incidents/{id}` la atiende `OpsConsoleController.incident` (src/modules/ops_console/ops-console.controller.ts:123). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsConsoleService.getIncident`. Lee platform_ops.health_incidents, platform_ops.incident_timeline_events, platform_ops.service_components.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/ops-console.controller.ts:123` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/ops_console/ops-console.controller.ts:123` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.health_incidents` | LEE | LEE | POR_SQL | OpsConsoleController.incident → OpsConsoleService.getIncident → OpsConsoleRepository.findIncident | `src/modules/ops_console/ops-console.repository.ts:78` |
| `platform_ops.incident_timeline_events` | LEE | LEE | POR_SQL | OpsConsoleController.incident → OpsConsoleService.getIncident → OpsConsoleRepository.findIncident | `src/modules/ops_console/ops-console.repository.ts:94` |
| `platform_ops.service_components` | LEE | LEE | POR_SQL | OpsConsoleController.incident → OpsConsoleService.getIncident → OpsConsoleRepository.findIncident | `src/modules/ops_console/ops-console.repository.ts:78` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Incidente no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/ops_console.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Operations console module — etapa `ctrl:OpsConsoleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /admin/ops/readiness

- **Origen:** CONTRATO
- **Nombre:** Preparación para producción: controles PASS/FAIL/UNKNOWN/N_A con evidencia
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsConsoleController.readiness` — `src/modules/ops_console/ops-console.controller.ts:104`

### Qué es y para qué sirve (negocio)

Preparación para producción: controles PASS/FAIL/UNKNOWN/N_A con evidencia.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/readiness` la atiende `OpsConsoleController.readiness` (src/modules/ops_console/ops-console.controller.ts:104). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsConsoleService.readiness`. Lee data_catalog.catalog_annotations, data_catalog.catalog_objects, data_catalog.catalog_scan_runs, platform_ops.deployments, platform_ops.health_incidents, platform_ops.service_components, platform_ops.service_level_indicators, platform_ops.service_level_objectives y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/ops-console.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.catalogReview | `src/modules/ops_console/ops-console.repository.ts:271` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.catalogReview | `src/modules/ops_console/ops-console.repository.ts:271` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.catalogReview | `src/modules/ops_console/ops-console.repository.ts:271` |
| `platform_ops.deployments` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.lastProductionDeployment | `src/modules/ops_console/ops-console.repository.ts:255` |
| `platform_ops.health_incidents` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listIncidents | `src/modules/ops_console/ops-console.repository.ts:52` |
| `platform_ops.service_components` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listIncidents | `src/modules/ops_console/ops-console.repository.ts:52` |
| `platform_ops.service_level_indicators` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listSlos | `src/modules/ops_console/ops-console.repository.ts:160` |
| `platform_ops.service_level_objectives` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listSlos | `src/modules/ops_console/ops-console.repository.ts:160` |
| `platform_ops.slo_measurements` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listSlos | `src/modules/ops_console/ops-console.repository.ts:160` |
| `qa_execution.execution_plans` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.lastPlanPerActiveSuite | `src/modules/ops_console/ops-console.repository.ts:236` |
| `qa_lab.test_defects` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listOpenDefects | `src/modules/ops_console/ops-console.repository.ts:221` |
| `qa_lab.test_suites` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.lastPlanPerActiveSuite | `src/modules/ops_console/ops-console.repository.ts:236` |
| `system_ops.backup_policies` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listBackupPolicies | `src/modules/ops_console/ops-console.repository.ts:193` |
| `system_ops.restore_test_runs` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listBackupPolicies | `src/modules/ops_console/ops-console.repository.ts:193` |

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

El árbol de decisión completo está en [flujos](../flujos/ops_console.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Operations console module — etapa `ctrl:OpsConsoleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /admin/ops/slos

- **Origen:** CONTRATO
- **Nombre:** SLO activos con su última medición (numerador y denominador)
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsConsoleController.slos` — `src/modules/ops_console/ops-console.controller.ts:144`

### Qué es y para qué sirve (negocio)

SLO activos con su última medición (numerador y denominador).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/slos` la atiende `OpsConsoleController.slos` (src/modules/ops_console/ops-console.controller.ts:144). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsConsoleService.listSlos`. Lee platform_ops.service_level_indicators, platform_ops.service_level_objectives, platform_ops.slo_measurements.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/ops-console.controller.ts:144` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.service_level_indicators` | LEE | LEE | POR_SQL | OpsConsoleController.slos → OpsConsoleService.listSlos → OpsConsoleRepository.listSlos | `src/modules/ops_console/ops-console.repository.ts:160` |
| `platform_ops.service_level_objectives` | LEE | LEE | POR_SQL | OpsConsoleController.slos → OpsConsoleService.listSlos → OpsConsoleRepository.listSlos | `src/modules/ops_console/ops-console.repository.ts:160` |
| `platform_ops.slo_measurements` | LEE | LEE | POR_SQL | OpsConsoleController.slos → OpsConsoleService.listSlos → OpsConsoleRepository.listSlos | `src/modules/ops_console/ops-console.repository.ts:160` |

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

El árbol de decisión completo está en [flujos](../flujos/ops_console.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Operations console module — etapa `ctrl:OpsConsoleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /admin/ops/traffic

- **Origen:** CONTRATO
- **Nombre:** Tráfico HTTP de la API: solicitudes, éxito, fallos, latencia y usuarios activos
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsConsoleController.trafficOverview` — `src/modules/ops_console/ops-console.controller.ts:162`

### Qué es y para qué sirve (negocio)

Tráfico HTTP de la API: solicitudes, éxito, fallos, latencia y usuarios activos.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/traffic` la atiende `OpsConsoleController.trafficOverview` (src/modules/ops_console/ops-console.controller.ts:162). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsTrafficService.traffic`. Lee iam.sessions, time_series.service_sli_series.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/ops-console.controller.ts:162` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.sessions` | LEE | LEE | POR_SQL | OpsConsoleController.trafficOverview → OpsTrafficService.traffic → OpsTrafficRepository.readActiveUsers | `src/modules/ops_console/ops-traffic.repository.ts:190` |
| `time_series.service_sli_series` | LEE | LEE | POR_SQL | OpsConsoleController.trafficOverview → OpsTrafficService.traffic → OpsTrafficRepository.readWindow | `src/modules/ops_console/ops-traffic.repository.ts:110` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `from` | query | No | `string` | Por defecto: 00:00 UTC del día de `to` |
| `to` | query | No | `string` | Por defecto: ahora |
| `interval` | query | No | `string` | — |

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

El árbol de decisión completo está en [flujos](../flujos/ops_console.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Operations console module — etapa `ctrl:OpsConsoleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /admin/ops/traffic/endpoints

- **Origen:** CONTRATO
- **Nombre:** Endpoints tocados en la ventana, por plantilla de ruta
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsConsoleController.trafficEndpoints` — `src/modules/ops_console/ops-console.controller.ts:174`

### Qué es y para qué sirve (negocio)

Endpoints tocados en la ventana, por plantilla de ruta.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/traffic/endpoints` la atiende `OpsConsoleController.trafficEndpoints` (src/modules/ops_console/ops-console.controller.ts:174). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsTrafficService.endpoints`. Lee time_series.service_sli_series.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/ops-console.controller.ts:174` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `time_series.service_sli_series` | LEE | LEE | POR_SQL | OpsConsoleController.trafficEndpoints → OpsTrafficService.endpoints → OpsTrafficRepository.readEndpoints | `src/modules/ops_console/ops-traffic.repository.ts:158` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `from` | query | No | `string` | Por defecto: 00:00 UTC del día de `to` |
| `to` | query | No | `string` | Por defecto: ahora |
| `limit` | query | No | `number` | — |
| `sort` | query | No | `string` | — |

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

El árbol de decisión completo está en [flujos](../flujos/ops_console.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Operations console module — etapa `ctrl:OpsConsoleController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

