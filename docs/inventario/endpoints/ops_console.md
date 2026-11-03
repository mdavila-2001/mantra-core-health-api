<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `ops_console`

- **Bloque:** —
- **Operaciones:** 11 (11 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 0 · BAJO 11
- **Tablas distintas que tocan:** 19
- **Respuestas de error y detalle contractual:** `openapi/endpoints/ops-console.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/admin/ops/backups` | Políticas de backup con su última prueba de restauración | BAJO | 2 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 2 | GET | `/admin/ops/change-requests` | Solicitudes de cambio | BAJO | 1 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 3 | GET | `/admin/ops/deployments` | Despliegues recientes | BAJO | 2 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 4 | GET | `/admin/ops/incidents` | Incidentes | BAJO | 2 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 5 | GET | `/admin/ops/incidents/{id}` | Incidente con su timeline | BAJO | 3 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 6 | GET | `/admin/ops/instances/liveness` | Vida de cada instancia (VIVA/DEGRADADA/CAIDA/SIN_DATO) con causa y evidencia | BAJO | 1 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 7 | GET | `/admin/ops/readiness` | Preparación para producción: controles PASS/FAIL/UNKNOWN/N_A con evidencia | BAJO | 14 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 8 | GET | `/admin/ops/slos` | SLO activos con su última medición (numerador y denominador) | BAJO | 3 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 9 | GET | `/admin/ops/traffic` | Tráfico HTTP de la API: solicitudes, éxito, fallos, latencia y usuarios activos | BAJO | 2 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 10 | GET | `/admin/ops/traffic/endpoints` | Endpoints tocados en la ventana, por plantilla de ruta | BAJO | 1 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 11 | POST | `/internal/ops/heartbeats` | Latido de un worker hacia la sonda de vida de instancias | BAJO | 0 | SYSTEM |

---

## 1. GET /admin/ops/backups

- **Origen:** CONTRATO
- **Nombre:** Políticas de backup con su última prueba de restauración
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsConsoleController.backups` — `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:83`

### Qué es y para qué sirve (negocio)

Políticas de backup con su última prueba de restauración.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/backups` la atiende `OpsConsoleController.backups` (src/modules/ops_console/presentation/controllers/ops-console.controller.ts:83). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsConsoleService.listBackups`. Lee system_ops.backup_policies, system_ops.restore_test_runs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:83` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `system_ops.backup_policies` | LEE | LEE | POR_SQL | OpsConsoleController.backups → OpsConsoleService.listBackups → OpsConsoleRepository.listBackupPolicies | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:193` |
| `system_ops.restore_test_runs` | LEE | LEE | POR_SQL | OpsConsoleController.backups → OpsConsoleService.listBackups → OpsConsoleRepository.listBackupPolicies | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:193` |

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
- **Implementación:** `OpsConsoleController.changeRequests` — `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:67`

### Qué es y para qué sirve (negocio)

Solicitudes de cambio.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/change-requests` la atiende `OpsConsoleController.changeRequests` (src/modules/ops_console/presentation/controllers/ops-console.controller.ts:67). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsConsoleService.listChangeRequests`. Lee platform_ops.change_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.change_requests` | LEE | LEE | POR_SQL | OpsConsoleController.changeRequests → OpsConsoleService.listChangeRequests → OpsConsoleRepository.listChangeRequests | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:138` |

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
- **Implementación:** `OpsConsoleController.deployments` — `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:60`

### Qué es y para qué sirve (negocio)

Despliegues recientes.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/deployments` la atiende `OpsConsoleController.deployments` (src/modules/ops_console/presentation/controllers/ops-console.controller.ts:60). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsConsoleService.listDeployments`. Lee platform_ops.deployments, platform_ops.service_components.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:60` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.deployments` | LEE | LEE | POR_SQL | OpsConsoleController.deployments → OpsConsoleService.listDeployments → OpsConsoleRepository.listDeployments | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:117` |
| `platform_ops.service_components` | LEE | LEE | POR_SQL | OpsConsoleController.deployments → OpsConsoleService.listDeployments → OpsConsoleRepository.listDeployments | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:117` |

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
- **Implementación:** `OpsConsoleController.incidents` — `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:46`

### Qué es y para qué sirve (negocio)

Incidentes.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/incidents` la atiende `OpsConsoleController.incidents` (src/modules/ops_console/presentation/controllers/ops-console.controller.ts:46). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsConsoleService.listIncidents`. Lee platform_ops.health_incidents, platform_ops.service_components.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.health_incidents` | LEE | LEE | POR_SQL | OpsConsoleController.incidents → OpsConsoleService.listIncidents → OpsConsoleRepository.listIncidents | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:52` |
| `platform_ops.service_components` | LEE | LEE | POR_SQL | OpsConsoleController.incidents → OpsConsoleService.listIncidents → OpsConsoleRepository.listIncidents | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:52` |

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
- **Implementación:** `OpsConsoleController.incident` — `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:53`

### Qué es y para qué sirve (negocio)

Incidente con su timeline.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/incidents/{id}` la atiende `OpsConsoleController.incident` (src/modules/ops_console/presentation/controllers/ops-console.controller.ts:53). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsConsoleService.getIncident`. Lee platform_ops.health_incidents, platform_ops.incident_timeline_events, platform_ops.service_components.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:53` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.health_incidents` | LEE | LEE | POR_SQL | OpsConsoleController.incident → OpsConsoleService.getIncident → OpsConsoleRepository.findIncident | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:78` |
| `platform_ops.incident_timeline_events` | LEE | LEE | POR_SQL | OpsConsoleController.incident → OpsConsoleService.getIncident → OpsConsoleRepository.findIncident | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:94` |
| `platform_ops.service_components` | LEE | LEE | POR_SQL | OpsConsoleController.incident → OpsConsoleService.getIncident → OpsConsoleRepository.findIncident | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:78` |

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

## 6. GET /admin/ops/instances/liveness

- **Origen:** CONTRATO
- **Nombre:** Vida de cada instancia (VIVA/DEGRADADA/CAIDA/SIN_DATO) con causa y evidencia
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsLivenessController.instancesLiveness` — `src/modules/ops_console/presentation/controllers/ops-liveness.controller.ts:22`

### Qué es y para qué sirve (negocio)

Vida de cada instancia (VIVA/DEGRADADA/CAIDA/SIN_DATO) con causa y evidencia.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/instances/liveness` la atiende `OpsLivenessController.instancesLiveness` (src/modules/ops_console/presentation/controllers/ops-liveness.controller.ts:22). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `InstanceLivenessService.liveness`. Lee terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/presentation/controllers/ops-liveness.controller.ts:22` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | OpsLivenessController.instancesLiveness → InstanceLivenessService.liveness → InstanceLivenessService.probeDependencies → InstanceLivenessService.runProbes → AppReadinessService.collect → AppReadinessService.checkSeedCore | `src/app-readiness.service.ts:231` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<InstanceLivenessResponse>`

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

- Operations console module — etapa `ctrl:OpsLivenessController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /admin/ops/readiness

- **Origen:** CONTRATO
- **Nombre:** Preparación para producción: controles PASS/FAIL/UNKNOWN/N_A con evidencia
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsConsoleController.readiness` — `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:34`

### Qué es y para qué sirve (negocio)

Preparación para producción: controles PASS/FAIL/UNKNOWN/N_A con evidencia.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/readiness` la atiende `OpsConsoleController.readiness` (src/modules/ops_console/presentation/controllers/ops-console.controller.ts:34). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsConsoleService.readiness`. Lee data_catalog.catalog_annotations, data_catalog.catalog_objects, data_catalog.catalog_scan_runs, platform_ops.deployments, platform_ops.health_incidents, platform_ops.service_components, platform_ops.service_level_indicators, platform_ops.service_level_objectives y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:34` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `data_catalog.catalog_annotations` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.catalogReview | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:271` |
| `data_catalog.catalog_objects` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.catalogReview | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:271` |
| `data_catalog.catalog_scan_runs` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.catalogReview | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:271` |
| `platform_ops.deployments` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.lastProductionDeployment | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:255` |
| `platform_ops.health_incidents` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listIncidents | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:52` |
| `platform_ops.service_components` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listIncidents | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:52` |
| `platform_ops.service_level_indicators` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listSlos | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:160` |
| `platform_ops.service_level_objectives` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listSlos | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:160` |
| `platform_ops.slo_measurements` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listSlos | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:160` |
| `qa_execution.execution_plans` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.lastPlanPerActiveSuite | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:236` |
| `qa_lab.test_defects` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listOpenDefects | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:221` |
| `qa_lab.test_suites` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.lastPlanPerActiveSuite | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:236` |
| `system_ops.backup_policies` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listBackupPolicies | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:193` |
| `system_ops.restore_test_runs` | LEE | LEE | POR_SQL | OpsConsoleController.readiness → OpsConsoleService.readiness → OpsConsoleRepository.listBackupPolicies | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:193` |

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

## 8. GET /admin/ops/slos

- **Origen:** CONTRATO
- **Nombre:** SLO activos con su última medición (numerador y denominador)
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsConsoleController.slos` — `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:74`

### Qué es y para qué sirve (negocio)

SLO activos con su última medición (numerador y denominador).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/slos` la atiende `OpsConsoleController.slos` (src/modules/ops_console/presentation/controllers/ops-console.controller.ts:74). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsConsoleService.listSlos`. Lee platform_ops.service_level_indicators, platform_ops.service_level_objectives, platform_ops.slo_measurements.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:74` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.service_level_indicators` | LEE | LEE | POR_SQL | OpsConsoleController.slos → OpsConsoleService.listSlos → OpsConsoleRepository.listSlos | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:160` |
| `platform_ops.service_level_objectives` | LEE | LEE | POR_SQL | OpsConsoleController.slos → OpsConsoleService.listSlos → OpsConsoleRepository.listSlos | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:160` |
| `platform_ops.slo_measurements` | LEE | LEE | POR_SQL | OpsConsoleController.slos → OpsConsoleService.listSlos → OpsConsoleRepository.listSlos | `src/modules/ops_console/infrastructure/repositories/ops-console.repository.ts:160` |

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

## 9. GET /admin/ops/traffic

- **Origen:** CONTRATO
- **Nombre:** Tráfico HTTP de la API: solicitudes, éxito, fallos, latencia y usuarios activos
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsConsoleController.trafficOverview` — `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:92`

### Qué es y para qué sirve (negocio)

Tráfico HTTP de la API: solicitudes, éxito, fallos, latencia y usuarios activos.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/traffic` la atiende `OpsConsoleController.trafficOverview` (src/modules/ops_console/presentation/controllers/ops-console.controller.ts:92). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsTrafficService.traffic`. Lee iam.sessions, time_series.service_sli_series.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:92` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.sessions` | LEE | LEE | POR_SQL | OpsConsoleController.trafficOverview → OpsTrafficService.traffic → OpsTrafficRepository.readActiveUsers | `src/modules/ops_console/infrastructure/repositories/ops-traffic.repository.ts:190` |
| `time_series.service_sli_series` | LEE | LEE | POR_SQL | OpsConsoleController.trafficOverview → OpsTrafficService.traffic → OpsTrafficRepository.readWindow | `src/modules/ops_console/infrastructure/repositories/ops-traffic.repository.ts:110` |

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

## 10. GET /admin/ops/traffic/endpoints

- **Origen:** CONTRATO
- **Nombre:** Endpoints tocados en la ventana, por plantilla de ruta
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsConsoleController.trafficEndpoints` — `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:104`

### Qué es y para qué sirve (negocio)

Endpoints tocados en la ventana, por plantilla de ruta.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/ops/traffic/endpoints` la atiende `OpsConsoleController.trafficEndpoints` (src/modules/ops_console/presentation/controllers/ops-console.controller.ts:104). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsTrafficService.endpoints`. Lee time_series.service_sli_series.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/ops_console/presentation/controllers/ops-console.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `time_series.service_sli_series` | LEE | LEE | POR_SQL | OpsConsoleController.trafficEndpoints → OpsTrafficService.endpoints → OpsTrafficRepository.readEndpoints | `src/modules/ops_console/infrastructure/repositories/ops-traffic.repository.ts:158` |

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

## 11. POST /internal/ops/heartbeats

- **Origen:** CONTRATO
- **Nombre:** Latido de un worker hacia la sonda de vida de instancias
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsHeartbeatController.record` — `src/modules/ops_console/presentation/controllers/ops-heartbeat.controller.ts:25`

### Qué es y para qué sirve (negocio)

Latido de un worker hacia la sonda de vida de instancias.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /internal/ops/heartbeats` la atiende `OpsHeartbeatController.record` (src/modules/ops_console/presentation/controllers/ops-heartbeat.controller.ts:25). Exige sesión con alguno de los roles SYSTEM. Valida el cuerpo como `HeartbeatDto` (13 campos, 13 obligatorios). Delega en `InstanceLivenessService.recordHeartbeat`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/ops_console/presentation/controllers/ops-heartbeat.controller.ts:25` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo — DTO `HeartbeatDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `instanceId` | `string` | Sí | longitud máxima 64; patrón runtime /^worker-[a-z0-9_-]+$/ | `@IsString()` `@MaxLength(64)` `@Matches(/^worker-[a-z0-9_-]+$/)` | `worker-<dominio>` exacto del entrypoint | `src/modules/ops_console/presentation/dto/ops-heartbeat.dto.ts:57` |
| `pid` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | — | `src/modules/ops_console/presentation/dto/ops-heartbeat.dto.ts:62` |
| `startedAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/ops_console/presentation/dto/ops-heartbeat.dto.ts:66` |
| `sentAt` | `string` | Sí | formato date-time | `@IsISO8601()` | Reloj del worker; informativo, no decide la edad | `src/modules/ops_console/presentation/dto/ops-heartbeat.dto.ts:73` |
| `status` | `string` | Sí | valores: starting, running, draining, stopped | `@IsIn(HEARTBEAT_STATUSES)` | — | `src/modules/ops_console/presentation/dto/ops-heartbeat.dto.ts:77` |
| `liveness` | `HeartbeatProbeDto` | Sí | — | `@ValidateNested()` `@Type(() => HeartbeatProbeDto)` | — | `src/modules/ops_console/presentation/dto/ops-heartbeat.dto.ts:82` |
| `liveness.healthy` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/ops_console/presentation/dto/ops-heartbeat.dto.ts:29` |
| `liveness.reasons` | `array<string>` | Sí | longitud máxima 200; máximo 10 elemento(s) | `@IsArray()` `@ArrayMaxSize(10)` `@IsString({ each: true })` `@MaxLength(200, { each: true })` | Frases generadas por el registro, sin mensajes crudos; máx. 200 caracteres | `src/modules/ops_console/presentation/dto/ops-heartbeat.dto.ts:41` |
| `readiness` | `HeartbeatProbeDto` | Sí | — | `@ValidateNested()` `@Type(() => HeartbeatProbeDto)` | — | `src/modules/ops_console/presentation/dto/ops-heartbeat.dto.ts:87` |
| `readiness.healthy` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/ops_console/presentation/dto/ops-heartbeat.dto.ts:29` |
| `readiness.reasons` | `array<string>` | Sí | longitud máxima 200; máximo 10 elemento(s) | `@IsArray()` `@ArrayMaxSize(10)` `@IsString({ each: true })` `@MaxLength(200, { each: true })` | Frases generadas por el registro, sin mensajes crudos; máx. 200 caracteres | `src/modules/ops_console/presentation/dto/ops-heartbeat.dto.ts:41` |
| `stuckTicks` | `number` | Sí | mínimo 0 | `@IsInt()` `@Min(0)` | — | `src/modules/ops_console/presentation/dto/ops-heartbeat.dto.ts:92` |
| `openCircuits` | `array<string>` | Sí | longitud máxima 100; máximo 10 elemento(s) | `@IsArray()` `@ArrayMaxSize(10)` `@IsString({ each: true })` `@MaxLength(100, { each: true })` | — | `src/modules/ops_console/presentation/dto/ops-heartbeat.dto.ts:99` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "instanceId": "worker-messaging",
  "pid": 1,
  "startedAt": "2026-07-31T12:00:00.000Z",
  "sentAt": "2026-07-31T12:00:00.000Z",
  "status": "starting",
  "liveness": {
    "healthy": true,
    "reasons": [
      "Texto descriptivo de ejemplo"
    ]
  },
  "readiness": {
    "healthy": true,
    "reasons": [
      "Texto descriptivo de ejemplo"
    ]
  },
  "stuckTicks": 1,
  "openCircuits": [
    "valor-ejemplo"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "instanceId": "worker-messaging",
  "pid": 1,
  "startedAt": "2026-07-31T12:00:00.000Z",
  "sentAt": "2026-07-31T12:00:00.000Z",
  "status": "starting",
  "liveness": {
    "healthy": true,
    "reasons": [
      "Texto descriptivo de ejemplo"
    ]
  },
  "readiness": {
    "healthy": true,
    "reasons": [
      "Texto descriptivo de ejemplo"
    ]
  },
  "stuckTicks": 1,
  "openCircuits": [
    "valor-ejemplo"
  ]
}
```

</details>

### Respuesta — `Promise<HeartbeatAcceptedDto>` · DTO `HeartbeatAcceptedDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `instanceId` | `string` | Sí | — | — | — | `src/modules/ops_console/presentation/dto/ops-heartbeat.dto.ts:104` |
| `receivedAt` | `string` | Sí | formato date-time | — | Reloj de la API | `src/modules/ops_console/presentation/dto/ops-heartbeat.dto.ts:107` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

El árbol de decisión completo está en [flujos](../flujos/ops_console.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Operations console module — etapa `ctrl:OpsHeartbeatController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

