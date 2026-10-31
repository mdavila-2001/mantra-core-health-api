<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `platform_ops`

- **Bloque:** Operaciones de Plataforma (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)
- **Operaciones:** 20 (16 en el contrato, 4 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 16 · BAJO 4
- **Tablas distintas que tocan:** 33
- **Respuestas de error y detalle contractual:** `openapi/endpoints/platform-ops.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/admin/ops/runtime-pieces` | — | BAJO | 1 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 2 | GET | `/admin/ops/runtime-pieces/{id}` | — | BAJO | 1 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 3 | POST | `/admin/ops/runtime-pieces/discover` | — | MEDIO | 5 | PLATFORM_ADMIN, SRE |
| 4 | GET | `/admin/ops/tools` | — | BAJO | 5 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 5 | GET | `/admin/ops/tools/{code}` | Una herramienta con su historial corto de comprobaciones | BAJO | 5 | PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN |
| 6 | POST | `/ops/artifacts` | Publicar un artefacto inmutable | MEDIO | 4 | DEPLOY_PIPELINE, RELEASE_MANAGER, PLATFORM_ADMIN |
| 7 | POST | `/ops/capacity-plans/{id}/measurements` | Registrar una medición de capacidad | MEDIO | 3 | CAPACITY_PLANNER, SRE, PLATFORM_ADMIN |
| 8 | POST | `/ops/change-requests` | Registrar una solicitud de cambio | MEDIO | 4 | RELEASE_MANAGER, PLATFORM_ADMIN |
| 9 | POST | `/ops/change-requests/{id}/approvals` | Registrar la decisión del CAB | MEDIO | 3 | CHANGE_APPROVER, PLATFORM_ADMIN |
| 10 | POST | `/ops/deployments` | Ejecutar un despliegue | MEDIO | 8 | RELEASE_MANAGER, DEPLOY_PIPELINE, PLATFORM_ADMIN |
| 11 | POST | `/ops/deployments/{id}/rollback` | Revertir un despliegue | MEDIO | 2 | SRE, RELEASE_MANAGER, PLATFORM_ADMIN |
| 12 | POST | `/ops/error-budget/{policyId}/burn-events` | Registrar la quema del presupuesto de error | MEDIO | 7 | SYSTEM, SRE, PLATFORM_ADMIN |
| 13 | POST | `/ops/health-checks/{id}/runs` | Registrar una corrida de health check | MEDIO | 7 | SYSTEM, SRE, PLATFORM_ADMIN |
| 14 | PATCH | `/ops/incidents/{id}` | Mover el incidente, sumar respondientes y publicar comunicaciones | MEDIO | 7 | INCIDENT_COMMANDER, SRE, PLATFORM_ADMIN |
| 15 | POST | `/ops/incidents/{id}/postmortem` | Abrir el postmortem del incidente resuelto | MEDIO | 5 | SRE, INCIDENT_COMMANDER, PLATFORM_ADMIN |
| 16 | POST | `/ops/readiness-reviews/{id}/complete` | Cerrar la revisión de preparación con su decisión | MEDIO | 4 | RELEASE_MANAGER, PLATFORM_ADMIN |
| 17 | POST | `/ops/resilience-exercises/{id}/complete` | Cerrar un ejercicio de resiliencia | MEDIO | 3 | SRE, PLATFORM_ADMIN |
| 18 | POST | `/ops/runbook-executions` | Registrar la ejecución de un runbook | MEDIO | 6 | SRE, PLATFORM_ADMIN |
| 19 | POST | `/ops/runbooks/{id}/versions` | Publicar una versión del runbook | MEDIO | 3 | SRE, PLATFORM_ADMIN |
| 20 | POST | `/ops/slo/{id}/measurements` | Registrar la medición de una ventana del SLO | MEDIO | 5 | SYSTEM, SRE, PLATFORM_ADMIN |

---

## 1. GET /admin/ops/runtime-pieces

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RuntimePiecesController.list` — `src/modules/platform_ops/runtime_pieces/runtime-pieces.controller.ts:49`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /admin/ops/runtime-pieces` la atiende `RuntimePiecesController.list` (src/modules/platform_ops/runtime_pieces/runtime-pieces.controller.ts:49). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `RuntimePiecesService.list`. Lee platform_ops.tool_registry.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/platform_ops/runtime_pieces/runtime-pieces.controller.ts:49` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.tool_registry` | LEE | LEE | POR_SQL | RuntimePiecesController.list → RuntimePiecesService.list → RuntimePiecesService.snapshot → RuntimePiecesRepository.listRegistered | `src/modules/platform_ops/runtime_pieces/runtime-pieces.repository.ts:57` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `RuntimePiecesQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `ctrl:RuntimePiecesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /admin/ops/runtime-pieces/{id}

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RuntimePiecesController.detail` — `src/modules/platform_ops/runtime_pieces/runtime-pieces.controller.ts:62`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /admin/ops/runtime-pieces/{id}` la atiende `RuntimePiecesController.detail` (src/modules/platform_ops/runtime_pieces/runtime-pieces.controller.ts:62). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `RuntimePiecesService.get`. Lee platform_ops.tool_registry.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/platform_ops/runtime_pieces/runtime-pieces.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.tool_registry` | LEE | LEE | POR_SQL | RuntimePiecesController.detail → RuntimePiecesService.get → RuntimePiecesService.snapshot → RuntimePiecesRepository.listRegistered | `src/modules/platform_ops/runtime_pieces/runtime-pieces.repository.ts:57` |

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
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Pieza no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `ctrl:RuntimePiecesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /admin/ops/runtime-pieces/discover

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `RuntimePiecesController.discover` — `src/modules/platform_ops/runtime_pieces/runtime-pieces.controller.ts:73`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /admin/ops/runtime-pieces/discover` la atiende `RuntimePiecesController.discover` (src/modules/platform_ops/runtime_pieces/runtime-pieces.controller.ts:73). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE. Valida el cuerpo como `DiscoverRuntimePiecesDto` (1 campo, 0 obligatorios). Delega en `RuntimePiecesService.discover`. Crea filas en platform_ops.tool_registry. Actualiza platform_ops.tool_registry. Lee directory.tenants, platform_ops.tool_registry, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE | `src/modules/platform_ops/runtime_pieces/runtime-pieces.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenants` | LEE | LEE | POR_SQL | RuntimePiecesController.discover → RuntimePiecesService.discover → RuntimePiecesSeedService.run → RuntimePiecesSeedService.assertPreconditions → RuntimePiecesRepository.tenantExists | `src/modules/platform_ops/runtime_pieces/runtime-pieces.repository.ts:94` |
| `platform_ops.tool_registry` | ESCRIBE | CREA | POR_SQL | RuntimePiecesController.discover → RuntimePiecesService.discover → RuntimePiecesSeedService.run → RuntimePiecesRepository.insertIfAbsent | `src/modules/platform_ops/runtime_pieces/runtime-pieces.repository.ts:110` |
| `platform_ops.tool_registry` | ESCRIBE | ACTUALIZA | POR_SQL | RuntimePiecesController.discover → RuntimePiecesService.discover → RuntimePiecesSeedService.run → RuntimePiecesRepository.updateDerived | `src/modules/platform_ops/runtime_pieces/runtime-pieces.repository.ts:143` |
| `platform_ops.tool_registry` | LEE | LEE | POR_SQL | RuntimePiecesController.discover → RuntimePiecesService.discover → RuntimePiecesSeedService.run → RuntimePiecesRepository.listRegistered | `src/modules/platform_ops/runtime_pieces/runtime-pieces.repository.ts:57` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | RuntimePiecesController.discover → RuntimePiecesService.discover → RuntimePiecesSeedService.run → RuntimePiecesSeedService.assertPreconditions → RuntimePiecesRepository.existingConcepts | `src/modules/platform_ops/runtime_pieces/runtime-pieces.repository.ts:86` |

### Cuerpo — DTO `DiscoverRuntimePiecesDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `dryRun` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Calcula qué cambiaría sin escribir nada | `src/modules/platform_ops/runtime_pieces/runtime-pieces.dto.ts:80` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "dryRun": true
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
| 409 | `CONFLICT` | ConflictException: {scan.reason ?? 'No hay código fuente para escanear'} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Faltan conceptos del catálogo para registrar las piezas: ejecutar el seed de terminología; PreconditionFailedException: No existe el tenant de plataforma que es dueño de las piezas |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `ctrl:RuntimePiecesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /admin/ops/tools

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsToolsController.list` — `src/modules/platform_ops/controllers/ops-tools.controller.ts:24`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /admin/ops/tools` la atiende `OpsToolsController.list` (src/modules/platform_ops/controllers/ops-tools.controller.ts:24). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsToolsService.list`. Lee platform_ops.component_tools, platform_ops.health_check_runs, platform_ops.health_checks, platform_ops.service_components, platform_ops.tool_registry.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/platform_ops/controllers/ops-tools.controller.ts:24` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.component_tools` | LEE | LEE | DIRECTA | OpsToolsController.list → OpsToolsService.list → OpsToolsRepository.listTools → OpsToolsRepository.load | `src/modules/platform_ops/repositories/ops-tools.repository.ts:100` |
| `platform_ops.health_check_runs` | LEE | LEE | POR_SQL | OpsToolsController.list → OpsToolsService.list → OpsToolsRepository.listTools → OpsToolsRepository.load → OpsToolsRepository.latestRuns | `src/modules/platform_ops/repositories/ops-tools.repository.ts:167` |
| `platform_ops.health_checks` | LEE | LEE | DIRECTA | OpsToolsController.list → OpsToolsService.list → OpsToolsRepository.listTools → OpsToolsRepository.load | `src/modules/platform_ops/repositories/ops-tools.repository.ts:109` |
| `platform_ops.service_components` | LEE | LEE | DIRECTA | OpsToolsController.list → OpsToolsService.list → OpsToolsRepository.listTools → OpsToolsRepository.load | `src/modules/platform_ops/repositories/ops-tools.repository.ts:104` |
| `platform_ops.tool_registry` | LEE | LEE | DIRECTA | OpsToolsController.list → OpsToolsService.list → OpsToolsRepository.listTools → OpsToolsRepository.load | `src/modules/platform_ops/repositories/ops-tools.repository.ts:95` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ToolListResponseDto>` · DTO `ToolListResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `evaluatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:69` |
| `items` | `array<ToolItemDto>` | Sí | — | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:72` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:36` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:39` |
| `items[].kind` | `string` | Sí | valores: DATABASE, CACHE, SEARCH, STORAGE, MESSAGING, PAYMENTS, AI, MAPS, ANALYTICS, SECURITY, OBSERVABILITY, OTHER | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:42` |
| `items[].isCritical` | `boolean` | Sí | — | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:45` |
| `items[].status` | `string` | Sí | valores: ACTIVE, PLANNED, DEPRECATED, DISABLED | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:48` |
| `items[].requiredEnvVars` | `array<string>` | Sí | — | — | Solo nombres, nunca valores. | `src/modules/platform_ops/dto/ops-tools.dto.ts:51` |
| `items[].health` | `ToolHealthDto` | Sí | — | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:54` |
| `items[].health.state` | `string` | Sí | valores: OK, FAIL, NOT_PROBED | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:18` |
| `items[].health.checkType` | `string` | Sí | valores: LIVE, CONFIGURATION, NOT_APPLICABLE | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:21` |
| `items[].health.observedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:24` |
| `items[].health.missingEnvVars` | `array<string>` | Sí | — | — | Solo NOMBRES de las variables de entorno ausentes. | `src/modules/platform_ops/dto/ops-tools.dto.ts:30` |
| `notMeasured` | `array<ToolNotMeasuredDto>` | Sí | — | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:75` |
| `notMeasured[].code` | `string` | Sí | — | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:60` |
| `notMeasured[].reason` | `string` | Sí | — | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:63` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `ctrl:OpsToolsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /admin/ops/tools/{code}

- **Origen:** CONTRATO
- **Nombre:** Una herramienta con su historial corto de comprobaciones
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OpsToolsController.detail` — `src/modules/platform_ops/controllers/ops-tools.controller.ts:38`

### Qué es y para qué sirve (negocio)

Una herramienta con su historial corto de comprobaciones. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /admin/ops/tools/{code}` la atiende `OpsToolsController.detail` (src/modules/platform_ops/controllers/ops-tools.controller.ts:38). Exige sesión con alguno de los roles PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. Delega en `OpsToolsService.get`. Lee platform_ops.component_tools, platform_ops.health_check_runs, platform_ops.health_checks, platform_ops.service_components, platform_ops.tool_registry.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN | `src/modules/platform_ops/controllers/ops-tools.controller.ts:38` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.component_tools` | LEE | LEE | DIRECTA | OpsToolsController.detail → OpsToolsService.get → OpsToolsRepository.findTool → OpsToolsRepository.load | `src/modules/platform_ops/repositories/ops-tools.repository.ts:100` |
| `platform_ops.health_check_runs` | LEE | LEE | DIRECTA | OpsToolsController.detail → OpsToolsService.get → OpsToolsRepository.recentRuns | `src/modules/platform_ops/repositories/ops-tools.repository.ts:68` |
| `platform_ops.health_checks` | LEE | LEE | DIRECTA | OpsToolsController.detail → OpsToolsService.get → OpsToolsRepository.findTool → OpsToolsRepository.load | `src/modules/platform_ops/repositories/ops-tools.repository.ts:109` |
| `platform_ops.service_components` | LEE | LEE | DIRECTA | OpsToolsController.detail → OpsToolsService.get → OpsToolsRepository.findTool → OpsToolsRepository.load | `src/modules/platform_ops/repositories/ops-tools.repository.ts:104` |
| `platform_ops.tool_registry` | LEE | LEE | DIRECTA | OpsToolsController.detail → OpsToolsService.get → OpsToolsRepository.findTool → OpsToolsRepository.load | `src/modules/platform_ops/repositories/ops-tools.repository.ts:95` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `code` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ToolDetailResponseDto>` · DTO `ToolDetailResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | — | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:36` |
| `name` | `string` | Sí | — | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:39` |
| `kind` | `string` | Sí | valores: DATABASE, CACHE, SEARCH, STORAGE, MESSAGING, PAYMENTS, AI, MAPS, ANALYTICS, SECURITY, OBSERVABILITY, OTHER | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:42` |
| `isCritical` | `boolean` | Sí | — | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:45` |
| `status` | `string` | Sí | valores: ACTIVE, PLANNED, DEPRECATED, DISABLED | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:48` |
| `requiredEnvVars` | `array<string>` | Sí | — | — | Solo nombres, nunca valores. | `src/modules/platform_ops/dto/ops-tools.dto.ts:51` |
| `health` | `ToolHealthDto` | Sí | — | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:54` |
| `health.state` | `string` | Sí | valores: OK, FAIL, NOT_PROBED | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:18` |
| `health.checkType` | `string` | Sí | valores: LIVE, CONFIGURATION, NOT_APPLICABLE | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:21` |
| `health.observedAt` | `string` | Sí | formato date-time; admite null | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:24` |
| `health.missingEnvVars` | `array<string>` | Sí | — | — | Solo NOMBRES de las variables de entorno ausentes. | `src/modules/platform_ops/dto/ops-tools.dto.ts:30` |
| `evaluatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:96` |
| `history` | `array<ToolCheckRunDto>` | Sí | — | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:99` |
| `history[].observedAt` | `string` | Sí | formato date-time | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:81` |
| `history[].outcome` | `string` | Sí | valores: PASS, WARN, FAIL, TIMEOUT, ERROR | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:84` |
| `history[].latencyMs` | `number` | Sí | admite null | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:87` |
| `history[].httpStatus` | `number` | Sí | admite null | — | — | `src/modules/platform_ops/dto/ops-tools.dto.ts:90` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Herramienta no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `ctrl:OpsToolsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /ops/artifacts

- **Origen:** CONTRATO
- **Nombre:** Publicar un artefacto inmutable
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PlatformOpsController.publishArtifact` — `src/modules/platform_ops/controllers/platform-ops.controller.ts:121`

### Qué es y para qué sirve (negocio)

Publicar un artefacto inmutable. Caso de uso UC-46-03: Publicar artefacto inmutable. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/platform_ops/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /ops/artifacts` la atiende `PlatformOpsController.publishArtifact` (src/modules/platform_ops/controllers/platform-ops.controller.ts:121). Exige sesión con alguno de los roles DEPLOY_PIPELINE, RELEASE_MANAGER, PLATFORM_ADMIN. Valida el cuerpo como `PublishArtifactDto` (15 campos, 6 obligatorios). Delega en `OpsReleasesService.publishArtifact`. Crea filas en platform_ops.artifacts. Lee platform_ops.artifacts, platform_ops.service_components, platform_ops.tool_registry.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DEPLOY_PIPELINE, RELEASE_MANAGER, PLATFORM_ADMIN | `src/modules/platform_ops/controllers/platform-ops.controller.ts:121` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.artifacts` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.publishArtifact → OpsReleasesService.publishArtifact → OpsReleasesRepository.createArtifact | `src/modules/platform_ops/repositories/ops-releases.repository.ts:450` |
| `platform_ops.artifacts` | LEE | LEE | DIRECTA | PlatformOpsController.publishArtifact → OpsReleasesService.publishArtifact → OpsReleasesRepository.findArtifactByRef | `src/modules/platform_ops/repositories/ops-releases.repository.ts:504` |
| `platform_ops.service_components` | LEE | LEE | DIRECTA | PlatformOpsController.publishArtifact → OpsReleasesService.publishArtifact → OpsReleasesRepository.findComponentById | `src/modules/platform_ops/repositories/ops-releases.repository.ts:239` |
| `platform_ops.tool_registry` | LEE | LEE | DIRECTA | PlatformOpsController.publishArtifact → OpsReleasesService.publishArtifact → OpsReleasesRepository.findToolById | `src/modules/platform_ops/repositories/ops-releases.repository.ts:257` |

### Cuerpo — DTO `PublishArtifactDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:260` |
| `serviceComponentId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:267` |
| `producedByToolId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Herramienta que lo construyó | `src/modules/platform_ops/dto/platform-ops.dto.ts:278` |
| `artifactRef` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | Referencia única del artefacto | `src/modules/platform_ops/dto/platform-ops.dto.ts:289` |
| `artifactKind` | `string` | Sí | valores: CONTAINER_IMAGE, PACKAGE, BINARY, HELM_CHART, CONFIG_BUNDLE | `@IsIn(ARTIFACT_KINDS)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:296` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:304` |
| `version` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Versión publicada | `src/modules/platform_ops/dto/platform-ops.dto.ts:312` |
| `semver` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:321` |
| `gitRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:330` |
| `commitSha` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | SHA del commit | `src/modules/platform_ops/dto/platform-ops.dto.ts:339` |
| `contentHash` | `string` | Sí | patrón runtime /^[0-9a-f]{32,128}$/i | `@Matches(/^[0-9a-f]{32,128}$/i, { message: 'contentHash debe ser un hash hexadecimal de 32 a 128 caracteres', })` | Hash del contenido en hexadecimal; direcciona el artefacto | `src/modules/platform_ops/dto/platform-ops.dto.ts:351` |
| `storageUri` | `string` | No | — | `@IsOptional()` `@IsString()` | URI del blob en almacenamiento de objetos | `src/modules/platform_ops/dto/platform-ops.dto.ts:361` |
| `fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:369` |
| `sizeBytes` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:378` |
| `builtAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:386` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "serviceComponentId": "00000000-0000-4000-8000-000000000001",
  "artifactRef": "valor-ejemplo",
  "artifactKind": "CONTAINER_IMAGE",
  "name": "Nombre de ejemplo",
  "version": "valor-ejemplo",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "serviceComponentId": "00000000-0000-4000-8000-000000000001",
  "producedByToolId": "00000000-0000-4000-8000-000000000001",
  "artifactRef": "valor-ejemplo",
  "artifactKind": "CONTAINER_IMAGE",
  "name": "Nombre de ejemplo",
  "version": "valor-ejemplo",
  "semver": "valor-ejemplo",
  "gitRef": "valor-ejemplo",
  "commitSha": "valor-ejemplo",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "storageUri": "valor-ejemplo",
  "fileId": "00000000-0000-4000-8000-000000000001",
  "sizeBytes": 1,
  "builtAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<ArtifactResponseDto>` · DTO `ArtifactResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:397` |
| `testRunId` | `string` | Sí | formato uuid | — | Identificador asociado a test run. | sin fuente |
| `artifactTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a artifact type concept. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un artefacto con esa referencia; ConflictException: El componente ya publicó esa versión |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La herramienta no está homologada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/platform_ops/controllers/platform-ops.controller.spec.ts:91` |

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `UC-46-03`

---

## 7. POST /ops/capacity-plans/{id}/measurements

- **Origen:** CONTRATO
- **Nombre:** Registrar una medición de capacidad
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PlatformOpsController.recordCapacityMeasurement` — `src/modules/platform_ops/controllers/platform-ops.controller.ts:295`

### Qué es y para qué sirve (negocio)

Registrar una medición de capacidad. Caso de uso UC-46-11: Medición de capacidad. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/platform_ops/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /ops/capacity-plans/{id}/measurements` la atiende `PlatformOpsController.recordCapacityMeasurement` (src/modules/platform_ops/controllers/platform-ops.controller.ts:295). Exige sesión con alguno de los roles CAPACITY_PLANNER, SRE, PLATFORM_ADMIN. Valida el cuerpo como `RecordCapacityMeasurementDto` (7 campos, 3 obligatorios). Delega en `OpsReliabilityService.recordCapacityMeasurement`. Crea filas en platform_ops.capacity_measurements. Lee platform_ops.capacity_plans, platform_ops.service_components.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CAPACITY_PLANNER, SRE, PLATFORM_ADMIN | `src/modules/platform_ops/controllers/platform-ops.controller.ts:295` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/platform_ops/controllers/platform-ops.controller.ts:295` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.capacity_measurements` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.recordCapacityMeasurement → OpsReliabilityService.recordCapacityMeasurement → OpsReliabilityRepository.createCapacityMeasurement | `src/modules/platform_ops/repositories/ops-reliability.repository.ts:311` |
| `platform_ops.capacity_plans` | LEE | LEE | DIRECTA | PlatformOpsController.recordCapacityMeasurement → OpsReliabilityService.recordCapacityMeasurement → OpsReliabilityRepository.findCapacityPlanForUpdate | `src/modules/platform_ops/repositories/ops-reliability.repository.ts:270` |
| `platform_ops.service_components` | LEE | LEE | DIRECTA | PlatformOpsController.recordCapacityMeasurement → OpsReliabilityService.recordCapacityMeasurement → PlatformOpsScope.viaComponent | `src/modules/platform_ops/services/platform-ops-scope.service.ts:102` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordCapacityMeasurementDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `metric` | `string` | Sí | valores: CPU, MEMORY, STORAGE, THROUGHPUT, CONNECTIONS | `@IsIn(CAPACITY_METRICS)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1316` |
| `observedValue` | `string` | Sí | — | `@IsNumberString()` | Valor observado, como cadena decimal | `src/modules/platform_ops/dto/platform-ops.dto.ts:1323` |
| `capacityValue` | `string` | Sí | — | `@IsNumberString()` | Capacidad disponible, como cadena decimal | `src/modules/platform_ops/dto/platform-ops.dto.ts:1330` |
| `measuredAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Cuándo se midió; por defecto, ahora | `src/modules/platform_ops/dto/platform-ops.dto.ts:1341` |
| `sourceReference` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1350` |
| `demandForecastJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Previsión de demanda recalculada | `src/modules/platform_ops/dto/platform-ops.dto.ts:1358` |
| `scalingPolicyJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Política de escalado recalculada | `src/modules/platform_ops/dto/platform-ops.dto.ts:1366` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "metric": "CPU",
  "observedValue": "valor-ejemplo",
  "capacityValue": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "metric": "CPU",
  "observedValue": "valor-ejemplo",
  "capacityValue": "valor-ejemplo",
  "measuredAt": "2026-07-31T12:00:00.000Z",
  "sourceReference": "valor-ejemplo",
  "demandForecastJson": {},
  "scalingPolicyJson": {}
}
```

</details>

### Respuesta — `Promise<CapacityMeasurementResponseDto>` · DTO `CapacityMeasurementResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:1377` |
| `utilizationPercent` | `string` | Sí | — | — | Utilización calculada en porcentaje, como cadena decimal | `src/modules/platform_ops/dto/platform-ops.dto.ts:1385` |
| `guardrailCrossed` | `boolean` | Sí | — | — | true si la utilización cruzó el guardrail del plan | `src/modules/platform_ops/dto/platform-ops.dto.ts:1393` |
| `planUpdated` | `boolean` | Sí | — | — | true si el plan se recalculó en esta medición | `src/modules/platform_ops/dto/platform-ops.dto.ts:1399` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La capacidad debe ser mayor que cero; PreconditionFailedException: El plan de capacidad no está activo; PreconditionFailedException: La medición cae fuera del horizonte del plan |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/platform_ops/controllers/platform-ops.controller.spec.ts:197` |

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `UC-46-11`

---

## 8. POST /ops/change-requests

- **Origen:** CONTRATO
- **Nombre:** Registrar una solicitud de cambio
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PlatformOpsController.createChangeRequest` — `src/modules/platform_ops/controllers/platform-ops.controller.ts:78`

### Qué es y para qué sirve (negocio)

Registrar una solicitud de cambio. Caso de uso UC-46-01: Registrar solicitud de cambio. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/platform_ops/README.md:47`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /ops/change-requests` la atiende `PlatformOpsController.createChangeRequest` (src/modules/platform_ops/controllers/platform-ops.controller.ts:78). Exige sesión con alguno de los roles RELEASE_MANAGER, PLATFORM_ADMIN. Valida el cuerpo como `CreateChangeRequestDto` (11 campos, 4 obligatorios). Delega en `OpsReleasesService.createChangeRequest`. Crea filas en platform_ops.change_requests. Lee platform_ops.change_requests, platform_ops.maintenance_windows, platform_ops.service_components.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: RELEASE_MANAGER, PLATFORM_ADMIN | `src/modules/platform_ops/controllers/platform-ops.controller.ts:78` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.change_requests` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.createChangeRequest → OpsReleasesService.createChangeRequest → OpsReleasesRepository.createChangeRequest | `src/modules/platform_ops/repositories/ops-releases.repository.ts:300` |
| `platform_ops.change_requests` | LEE | LEE | DIRECTA | PlatformOpsController.createChangeRequest → OpsReleasesService.createChangeRequest → OpsReleasesService.nextChangeNumber → OpsReleasesRepository.countChangeRequests | `src/modules/platform_ops/repositories/ops-releases.repository.ts:377` |
| `platform_ops.maintenance_windows` | LEE | LEE | DIRECTA | PlatformOpsController.createChangeRequest → OpsReleasesService.createChangeRequest → OpsReleasesRepository.findWindowForUpdate | `src/modules/platform_ops/repositories/ops-releases.repository.ts:272` |
| `platform_ops.service_components` | LEE | LEE | DIRECTA | PlatformOpsController.createChangeRequest → OpsReleasesService.createChangeRequest → OpsReleasesRepository.findComponentById | `src/modules/platform_ops/repositories/ops-releases.repository.ts:239` |

### Cuerpo — DTO `CreateChangeRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:50` |
| `serviceComponentId` | `string` | Sí | formato uuid | `@IsUUID()` | Componente afectado | `src/modules/platform_ops/dto/platform-ops.dto.ts:57` |
| `title` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:65` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:73` |
| `changeType` | `string` | Sí | valores: STANDARD, NORMAL, EMERGENCY | `@IsIn(CHANGE_TYPES)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:80` |
| `risk` | `string` | Sí | valores: LOW, MEDIUM, HIGH, CRITICAL | `@IsIn(CHANGE_RISKS)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:87` |
| `plannedStartAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:95` |
| `plannedEndAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:103` |
| `rollbackPlanText` | `string` | No | — | `@IsOptional()` `@IsString()` | Cómo se deshace el cambio si sale mal | `src/modules/platform_ops/dto/platform-ops.dto.ts:111` |
| `validationPlanText` | `string` | No | — | `@IsOptional()` `@IsString()` | Cómo se comprueba que el cambio funcionó | `src/modules/platform_ops/dto/platform-ops.dto.ts:121` |
| `maintenanceWindowId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ventana de mantenimiento a la que se ata | `src/modules/platform_ops/dto/platform-ops.dto.ts:132` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "serviceComponentId": "00000000-0000-4000-8000-000000000001",
  "title": "valor-ejemplo",
  "changeType": "STANDARD",
  "risk": "LOW"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "serviceComponentId": "00000000-0000-4000-8000-000000000001",
  "title": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "changeType": "STANDARD",
  "risk": "LOW",
  "plannedStartAt": "2026-07-31T12:00:00.000Z",
  "plannedEndAt": "2026-07-31T12:00:00.000Z",
  "rollbackPlanText": "valor-ejemplo",
  "validationPlanText": "valor-ejemplo",
  "maintenanceWindowId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ChangeRequestResponseDto>` · DTO `ChangeRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:143` |
| `changeNumber` | `string` | Sí | — | — | Número correlativo del cambio en el tenant | `src/modules/platform_ops/dto/platform-ops.dto.ts:149` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/platform_ops/dto/platform-ops.dto.ts:155` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: No se pudo asignar un número de cambio libre |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana planificada está invertida; PreconditionFailedException: El componente no está activo; PreconditionFailedException: La ventana de mantenimiento está cerrada; PreconditionFailedException: El cambio empieza antes que su ventana; PreconditionFailedException: El cambio termina después que su ventana |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/platform_ops/controllers/platform-ops.controller.spec.ts:64` |

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `UC-46-01`

---

## 9. POST /ops/change-requests/{id}/approvals

- **Origen:** CONTRATO
- **Nombre:** Registrar la decisión del CAB
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PlatformOpsController.recordApproval` — `src/modules/platform_ops/controllers/platform-ops.controller.ts:99`

### Qué es y para qué sirve (negocio)

Registrar la decisión del CAB. Caso de uso UC-46-02: Decisión del CAB, multi-paso. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/platform_ops/README.md:48`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /ops/change-requests/{id}/approvals` la atiende `PlatformOpsController.recordApproval` (src/modules/platform_ops/controllers/platform-ops.controller.ts:99). Exige sesión con alguno de los roles CHANGE_APPROVER, PLATFORM_ADMIN. Valida el cuerpo como `RecordApprovalDto` (4 campos, 2 obligatorios). Delega en `OpsReleasesService.recordApproval`. Crea filas en platform_ops.change_approvals. Lee platform_ops.change_approvals, platform_ops.change_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CHANGE_APPROVER, PLATFORM_ADMIN | `src/modules/platform_ops/controllers/platform-ops.controller.ts:99` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/platform_ops/controllers/platform-ops.controller.ts:99` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.change_approvals` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.recordApproval → OpsReleasesService.recordApproval → OpsReleasesRepository.createApproval | `src/modules/platform_ops/repositories/ops-releases.repository.ts:406` |
| `platform_ops.change_approvals` | LEE | LEE | DIRECTA | PlatformOpsController.recordApproval → OpsReleasesService.recordApproval → OpsReleasesRepository.findApprovals | `src/modules/platform_ops/repositories/ops-releases.repository.ts:433` |
| `platform_ops.change_requests` | LEE | LEE | DIRECTA | PlatformOpsController.recordApproval → OpsReleasesService.recordApproval → OpsReleasesRepository.findChangeRequestForUpdate | `src/modules/platform_ops/repositories/ops-releases.repository.ts:346` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordApprovalDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `approvalStep` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | Paso del recorrido de aprobación | `src/modules/platform_ops/dto/platform-ops.dto.ts:173` |
| `decision` | `string` | Sí | valores: APPROVED, REJECTED | `@IsIn(['APPROVED', 'REJECTED'])` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:180` |
| `decisionReason` | `string` | No | — | `@IsOptional()` `@IsString()` | Por qué se decide así | `src/modules/platform_ops/dto/platform-ops.dto.ts:188` |
| `requiredApprovalSteps` | `number` | No | mínimo 1; máximo 5 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(5)` | Pasos exigidos; por defecto, los pasos ya emitidos más éste | `src/modules/platform_ops/dto/platform-ops.dto.ts:202` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "approvalStep": 1,
  "decision": "APPROVED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "approvalStep": 1,
  "decision": "APPROVED",
  "decisionReason": "Texto descriptivo de ejemplo",
  "requiredApprovalSteps": 1
}
```

</details>

### Respuesta — `Promise<ApprovalResponseDto>` · DTO `ApprovalResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:213` |
| `changeRequestId` | `string` | Sí | formato uuid | — | Identificador asociado a change request. | `src/modules/platform_ops/dto/platform-ops.dto.ts:219` |
| `changeStatusConceptId` | `string` | Sí | formato uuid | — | Estado del cambio tras la decisión | `src/modules/platform_ops/dto/platform-ops.dto.ts:228` |
| `approvedSteps` | `number` | Sí | — | — | Pasos aprobados hasta ahora | `src/modules/platform_ops/dto/platform-ops.dto.ts:234` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ese aprobador ya votó en este paso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud ya no admite decisiones; PreconditionFailedException: Quien solicita el cambio no puede aprobarlo; PreconditionFailedException: El paso anterior todavía no está aprobado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/platform_ops/controllers/platform-ops.controller.spec.ts:77` |

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `UC-46-02`

---

## 10. POST /ops/deployments

- **Origen:** CONTRATO
- **Nombre:** Ejecutar un despliegue
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PlatformOpsController.createDeployment` — `src/modules/platform_ops/controllers/platform-ops.controller.ts:142`

### Qué es y para qué sirve (negocio)

Ejecutar un despliegue. Caso de uso UC-46-04: Ejecutar despliegue con puertas. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/platform_ops/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /ops/deployments` la atiende `PlatformOpsController.createDeployment` (src/modules/platform_ops/controllers/platform-ops.controller.ts:142). Exige sesión con alguno de los roles RELEASE_MANAGER, DEPLOY_PIPELINE, PLATFORM_ADMIN. Valida el cuerpo como `CreateDeploymentDto` (6 campos, 4 obligatorios). Delega en `OpsReleasesService.createDeployment`. Crea filas en platform_ops.deployments. Actualiza platform_ops.deployments. Lee platform_ops.artifacts, platform_ops.change_requests, platform_ops.deployments, platform_ops.error_budget_burn_events, platform_ops.error_budget_policies, platform_ops.operational_readiness_reviews.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: RELEASE_MANAGER, DEPLOY_PIPELINE, PLATFORM_ADMIN | `src/modules/platform_ops/controllers/platform-ops.controller.ts:142` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.artifacts` | LEE | LEE | DIRECTA | PlatformOpsController.createDeployment → OpsReleasesService.createDeployment → OpsReleasesRepository.findArtifactById | `src/modules/platform_ops/repositories/ops-releases.repository.ts:490` |
| `platform_ops.change_requests` | LEE | LEE | DIRECTA | PlatformOpsController.createDeployment → OpsReleasesService.createDeployment → OpsReleasesRepository.findChangeRequestForUpdate | `src/modules/platform_ops/repositories/ops-releases.repository.ts:346` |
| `platform_ops.deployments` | ESCRIBE | ACTUALIZA | POR_TIPO | PlatformOpsController.createDeployment → OpsReleasesService.createDeployment | `src/modules/platform_ops/services/ops-releases.service.ts:585` |
| `platform_ops.deployments` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.createDeployment → OpsReleasesService.createDeployment → OpsReleasesRepository.createDeployment | `src/modules/platform_ops/repositories/ops-releases.repository.ts:533` |
| `platform_ops.deployments` | LEE | LEE | DIRECTA | PlatformOpsController.createDeployment → OpsReleasesService.createDeployment → OpsReleasesRepository.findCurrentDeploymentForUpdate | `src/modules/platform_ops/repositories/ops-releases.repository.ts:600` |
| `platform_ops.error_budget_burn_events` | LEE | LEE | DIRECTA | PlatformOpsController.createDeployment → OpsReleasesService.createDeployment → OpsReleasesService.deploymentsFrozen → OpsReliabilityRepository.findLatestBurnEvent | `src/modules/platform_ops/repositories/ops-reliability.repository.ts:235` |
| `platform_ops.error_budget_policies` | LEE | LEE | DIRECTA | PlatformOpsController.createDeployment → OpsReleasesService.createDeployment → OpsReleasesService.deploymentsFrozen → OpsReliabilityRepository.findFreezingPolicies | `src/modules/platform_ops/repositories/ops-reliability.repository.ts:251` |
| `platform_ops.operational_readiness_reviews` | LEE | LEE | DIRECTA | PlatformOpsController.createDeployment → OpsReleasesService.createDeployment → OpsPracticesRepository.findGoReview | `src/modules/platform_ops/repositories/ops-practices.repository.ts:60` |

### Cuerpo — DTO `CreateDeploymentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `changeRequestId` | `string` | Sí | formato uuid | `@IsUUID()` | Cambio aprobado que lo habilita | `src/modules/platform_ops/dto/platform-ops.dto.ts:452` |
| `artifactId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:459` |
| `environment` | `string` | Sí | valores: DEVELOPMENT, STAGING, PRODUCTION | `@IsIn(OPS_ENVIRONMENTS)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:466` |
| `strategy` | `string` | Sí | valores: ROLLING, BLUE_GREEN, CANARY, RECREATE | `@IsIn(DEPLOY_STRATEGIES)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:473` |
| `gitRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:482` |
| `outcome` | `string` | No | valores: SUCCEEDED, FAILED | `@IsOptional()` `@IsIn(['SUCCEEDED', 'FAILED'])` | Desenlace si el pipeline ya terminó; si falta, queda en curso | `src/modules/platform_ops/dto/platform-ops.dto.ts:494` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "changeRequestId": "00000000-0000-4000-8000-000000000001",
  "artifactId": "00000000-0000-4000-8000-000000000001",
  "environment": "DEVELOPMENT",
  "strategy": "ROLLING"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "changeRequestId": "00000000-0000-4000-8000-000000000001",
  "artifactId": "00000000-0000-4000-8000-000000000001",
  "environment": "DEVELOPMENT",
  "strategy": "ROLLING",
  "gitRef": "valor-ejemplo",
  "outcome": "SUCCEEDED"
}
```

</details>

### Respuesta — `Promise<DeploymentResponseDto>` · DTO `DeploymentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:505` |
| `deploymentNumber` | `string` | Sí | — | — | Valor de deployment number mantenido por la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:511` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/platform_ops/dto/platform-ops.dto.ts:517` |
| `isCurrent` | `boolean` | Sí | — | — | true si pasa a ser el despliegue vigente del entorno | `src/modules/platform_ops/dto/platform-ops.dto.ts:525` |
| `supersededDeploymentId` | `string` | No | formato uuid | — | Despliegue que deja de ser vigente | `src/modules/platform_ops/dto/platform-ops.dto.ts:534` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: No se pudo asignar un número de despliegue libre |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El cambio no está aprobado; PreconditionFailedException: El artefacto no está activo; PreconditionFailedException: El artefacto pertenece a otro componente; PreconditionFailedException: Producción exige una revisión de preparación con decisión "go"; PreconditionFailedException: Los despliegues están congelados por agotamiento del error budget |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/platform_ops/controllers/platform-ops.controller.spec.ts:101` |

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `UC-46-04`

---

## 11. POST /ops/deployments/{id}/rollback

- **Origen:** CONTRATO
- **Nombre:** Revertir un despliegue
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PlatformOpsController.rollbackDeployment` — `src/modules/platform_ops/controllers/platform-ops.controller.ts:163`

### Qué es y para qué sirve (negocio)

Revertir un despliegue. Caso de uso UC-46-05: Revertir despliegue. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/platform_ops/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /ops/deployments/{id}/rollback` la atiende `PlatformOpsController.rollbackDeployment` (src/modules/platform_ops/controllers/platform-ops.controller.ts:163). Exige sesión con alguno de los roles SRE, RELEASE_MANAGER, PLATFORM_ADMIN. Valida el cuerpo como `RollbackDeploymentDto` (2 campos, 1 obligatorio). Delega en `OpsReleasesService.rollbackDeployment`. Crea filas en platform_ops.deployments. Lee platform_ops.deployments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SRE, RELEASE_MANAGER, PLATFORM_ADMIN | `src/modules/platform_ops/controllers/platform-ops.controller.ts:163` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/platform_ops/controllers/platform-ops.controller.ts:163` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.deployments` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.rollbackDeployment → OpsReleasesService.rollbackDeployment → OpsReleasesRepository.createDeployment | `src/modules/platform_ops/repositories/ops-releases.repository.ts:533` |
| `platform_ops.deployments` | LEE | LEE | DIRECTA | PlatformOpsController.rollbackDeployment → OpsReleasesService.rollbackDeployment → OpsReleasesRepository.findDeploymentForUpdate | `src/modules/platform_ops/repositories/ops-releases.repository.ts:584` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RollbackDeploymentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | — | `@IsString()` | Por qué se revierte | `src/modules/platform_ops/dto/platform-ops.dto.ts:548` |
| `targetDeploymentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Despliegue estable al que volver; por defecto, el correcto anterior | `src/modules/platform_ops/dto/platform-ops.dto.ts:560` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo",
  "targetDeploymentId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<RollbackResponseDto>` · DTO `RollbackResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Despliegue de reversión creado | `src/modules/platform_ops/dto/platform-ops.dto.ts:574` |
| `deploymentNumber` | `string` | Sí | — | — | Valor de deployment number mantenido por la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:580` |
| `rolledBackDeploymentId` | `string` | Sí | formato uuid | — | Despliegue revertido | `src/modules/platform_ops/dto/platform-ops.dto.ts:586` |
| `artifactId` | `string` | Sí | formato uuid | — | Artefacto al que se vuelve | `src/modules/platform_ops/dto/platform-ops.dto.ts:592` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: No se pudo asignar un número de despliegue libre |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El despliegue no está en un estado reversible; PreconditionFailedException: El despliegue ya no es el vigente; PreconditionFailedException: No hay un despliegue estable anterior al que volver; PreconditionFailedException: El destino de la reversión es de otro componente o entorno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/platform_ops/controllers/platform-ops.controller.spec.ts:111` |

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `UC-46-05`

---

## 12. POST /ops/error-budget/{policyId}/burn-events

- **Origen:** CONTRATO
- **Nombre:** Registrar la quema del presupuesto de error
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PlatformOpsController.recordBurnEvent` — `src/modules/platform_ops/controllers/platform-ops.controller.ts:273`

### Qué es y para qué sirve (negocio)

Registrar la quema del presupuesto de error. Caso de uso UC-46-10: Quema y congelamiento. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/platform_ops/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /ops/error-budget/{policyId}/burn-events` la atiende `PlatformOpsController.recordBurnEvent` (src/modules/platform_ops/controllers/platform-ops.controller.ts:273). Exige sesión con alguno de los roles SYSTEM, SRE, PLATFORM_ADMIN. Valida el cuerpo como `RecordBurnEventDto` (5 campos, 3 obligatorios). Delega en `OpsReliabilityService.recordBurnEvent`. Crea filas en platform_ops.error_budget_burn_events. Lee platform_ops.error_budget_policies, platform_ops.health_incidents, platform_ops.service_components, platform_ops.service_level_indicators, platform_ops.service_level_objectives, platform_ops.slo_measurements.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SRE, PLATFORM_ADMIN | `src/modules/platform_ops/controllers/platform-ops.controller.ts:273` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: policyId | `src/modules/platform_ops/controllers/platform-ops.controller.ts:273` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.error_budget_burn_events` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.recordBurnEvent → OpsReliabilityService.recordBurnEvent → OpsReliabilityRepository.createBurnEvent | `src/modules/platform_ops/repositories/ops-reliability.repository.ts:206` |
| `platform_ops.error_budget_policies` | LEE | LEE | DIRECTA | PlatformOpsController.recordBurnEvent → OpsReliabilityService.recordBurnEvent → OpsReliabilityRepository.findPolicyForUpdate | `src/modules/platform_ops/repositories/ops-reliability.repository.ts:161` |
| `platform_ops.health_incidents` | LEE | LEE | DIRECTA | PlatformOpsController.recordBurnEvent → OpsReliabilityService.recordBurnEvent → OpsReliabilityRepository.findIncidentInTenant | `src/modules/platform_ops/repositories/ops-reliability.repository.ts:27` |
| `platform_ops.service_components` | LEE | LEE | DIRECTA | PlatformOpsController.recordBurnEvent → OpsReliabilityService.recordBurnEvent → PlatformOpsScope.viaSlo | `src/modules/platform_ops/services/platform-ops-scope.service.ts:123` |
| `platform_ops.service_level_indicators` | LEE | LEE | DIRECTA | PlatformOpsController.recordBurnEvent → OpsReliabilityService.recordBurnEvent → PlatformOpsScope.viaSlo | `src/modules/platform_ops/services/platform-ops-scope.service.ts:118` |
| `platform_ops.service_level_objectives` | LEE | LEE | DIRECTA | PlatformOpsController.recordBurnEvent → OpsReliabilityService.recordBurnEvent → PlatformOpsScope.viaSlo | `src/modules/platform_ops/services/platform-ops-scope.service.ts:116` |
| `platform_ops.slo_measurements` | LEE | LEE | DIRECTA | PlatformOpsController.recordBurnEvent → OpsReliabilityService.recordBurnEvent → OpsReliabilityRepository.findLatestMeasurement | `src/modules/platform_ops/repositories/ops-reliability.repository.ts:127` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `policyId` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordBurnEventDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `windowSeconds` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Ventana evaluada en segundos; cadena por ser bigint | `src/modules/platform_ops/dto/platform-ops.dto.ts:1229` |
| `burnRate` | `string` | Sí | — | `@IsNumberString()` | Ritmo de consumo del presupuesto, como cadena decimal | `src/modules/platform_ops/dto/platform-ops.dto.ts:1238` |
| `remainingBudgetPercent` | `string` | Sí | — | `@IsNumberString()` | Presupuesto restante en porcentaje, como cadena decimal | `src/modules/platform_ops/dto/platform-ops.dto.ts:1247` |
| `actionTakenJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Qué se hizo al detectarlo | `src/modules/platform_ops/dto/platform-ops.dto.ts:1255` |
| `healthIncidentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Incidente de fiabilidad asociado | `src/modules/platform_ops/dto/platform-ops.dto.ts:1266` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "windowSeconds": "valor-ejemplo",
  "burnRate": "valor-ejemplo",
  "remainingBudgetPercent": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "windowSeconds": "valor-ejemplo",
  "burnRate": "valor-ejemplo",
  "remainingBudgetPercent": "valor-ejemplo",
  "actionTakenJson": {},
  "healthIncidentId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<BurnEventResponseDto>` · DTO `BurnEventResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:1277` |
| `severityConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a severity concept. | `src/modules/platform_ops/dto/platform-ops.dto.ts:1283` |
| `deploymentFreezeActive` | `boolean` | Sí | — | — | true si a partir de ahora los despliegues quedan congelados | `src/modules/platform_ops/dto/platform-ops.dto.ts:1291` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La política no está activa; PreconditionFailedException: La política no tiene ninguna medición del objetivo sobre la que evaluar; PreconditionFailedException: El ritmo de quema no alcanza el umbral de aviso de la política |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/platform_ops/controllers/platform-ops.controller.spec.ts:181` |

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `UC-46-10`

---

## 13. POST /ops/health-checks/{id}/runs

- **Origen:** CONTRATO
- **Nombre:** Registrar una corrida de health check
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PlatformOpsController.recordHealthRun` — `src/modules/platform_ops/controllers/platform-ops.controller.ts:185`

### Qué es y para qué sirve (negocio)

Registrar una corrida de health check. Caso de uso UC-46-06: Corrida y derivación de incidente. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/platform_ops/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /ops/health-checks/{id}/runs` la atiende `PlatformOpsController.recordHealthRun` (src/modules/platform_ops/controllers/platform-ops.controller.ts:185). Exige sesión con alguno de los roles SYSTEM, SRE, PLATFORM_ADMIN. Valida el cuerpo como `RecordHealthRunDto` (9 campos, 2 obligatorios). Delega en `OpsIncidentsService.recordHealthRun`. Crea filas en platform_ops.health_check_runs, platform_ops.health_incidents, platform_ops.incident_timeline_events. Lee platform_ops.deployments, platform_ops.health_check_runs, platform_ops.health_checks, platform_ops.health_incidents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SRE, PLATFORM_ADMIN | `src/modules/platform_ops/controllers/platform-ops.controller.ts:185` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/platform_ops/controllers/platform-ops.controller.ts:185` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.deployments` | LEE | LEE | DIRECTA | PlatformOpsController.recordHealthRun → OpsIncidentsService.recordHealthRun → OpsIncidentsRepository.findDeploymentInTenant | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:128` |
| `platform_ops.health_check_runs` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.recordHealthRun → OpsIncidentsService.recordHealthRun → OpsIncidentsRepository.createHealthRun | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:152` |
| `platform_ops.health_check_runs` | LEE | LEE | DIRECTA | PlatformOpsController.recordHealthRun → OpsIncidentsService.recordHealthRun → OpsIncidentsRepository.findRecentRuns | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:182` |
| `platform_ops.health_checks` | LEE | LEE | DIRECTA | PlatformOpsController.recordHealthRun → OpsIncidentsService.recordHealthRun → OpsIncidentsRepository.findHealthCheckById | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:144` |
| `platform_ops.health_incidents` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.recordHealthRun → OpsIncidentsService.recordHealthRun → OpsIncidentsRepository.createIncident | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:199` |
| `platform_ops.health_incidents` | LEE | LEE | DIRECTA | PlatformOpsController.recordHealthRun → OpsIncidentsService.recordHealthRun → OpsIncidentsRepository.findOpenIncidentByCheckForUpdate | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:262` |
| `platform_ops.incident_timeline_events` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.recordHealthRun → OpsIncidentsService.recordHealthRun → OpsIncidentsRepository.createTimelineEvent | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:377` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordHealthRunDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: PASS, WARN, FAIL, TIMEOUT, ERROR | `@IsIn(HEALTH_RUN_STATUSES)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:620` |
| `source` | `string` | Sí | valores: SCHEDULER, PROBE, MANUAL | `@IsIn(HEALTH_RUN_SOURCES)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:627` |
| `latencyMs` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:636` |
| `httpStatus` | `number` | No | mínimo 100; máximo 599 | `@IsOptional()` `@IsInt()` `@Min(100)` `@Max(599)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:646` |
| `observedValue` | `string` | No | — | `@IsOptional()` `@IsString()` | Valor observado, como cadena para no perder precisión | `src/modules/platform_ops/dto/platform-ops.dto.ts:656` |
| `message` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:665` |
| `deploymentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Despliegue bajo el que se observa | `src/modules/platform_ops/dto/platform-ops.dto.ts:676` |
| `startedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:684` |
| `finishedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:692` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "status": "PASS",
  "source": "SCHEDULER"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "status": "PASS",
  "source": "SCHEDULER",
  "latencyMs": 1,
  "httpStatus": 100,
  "observedValue": "valor-ejemplo",
  "message": "valor-ejemplo",
  "deploymentId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "finishedAt": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<HealthRunResponseDto>` · DTO `HealthRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:703` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/platform_ops/dto/platform-ops.dto.ts:709` |
| `consecutiveFailures` | `number` | Sí | — | — | Fallos consecutivos acumulados tras esta corrida | `src/modules/platform_ops/dto/platform-ops.dto.ts:717` |
| `healthIncidentId` | `string` | No | formato uuid | — | Incidente abierto o ya vivo | `src/modules/platform_ops/dto/platform-ops.dto.ts:726` |
| `incidentOpened` | `boolean` | Sí | — | — | true si esta corrida abrió el incidente | `src/modules/platform_ops/dto/platform-ops.dto.ts:732` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El health check no está activo; PreconditionFailedException: El health check está deshabilitado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/platform_ops/controllers/platform-ops.controller.spec.ts:125` |

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `UC-46-06`

---

## 14. PATCH /ops/incidents/{id}

- **Origen:** CONTRATO
- **Nombre:** Mover el incidente, sumar respondientes y publicar comunicaciones
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PlatformOpsController.updateIncident` — `src/modules/platform_ops/controllers/platform-ops.controller.ts:207`

### Qué es y para qué sirve (negocio)

Mover el incidente, sumar respondientes y publicar comunicaciones. Caso de uso UC-46-07: Ciclo de vida del incidente. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/platform_ops/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`PATCH /ops/incidents/{id}` la atiende `PlatformOpsController.updateIncident` (src/modules/platform_ops/controllers/platform-ops.controller.ts:207). Exige sesión con alguno de los roles INCIDENT_COMMANDER, SRE, PLATFORM_ADMIN. Valida el cuerpo como `UpdateIncidentDto` (13 campos, 1 obligatorio). Delega en `OpsIncidentsService.updateIncident`. Crea filas en platform_ops.incident_communications, platform_ops.incident_responders, platform_ops.incident_timeline_events. Actualiza platform_ops.health_incidents, platform_ops.incident_responders. Lee platform_ops.health_incidents, platform_ops.incident_responders.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: INCIDENT_COMMANDER, SRE, PLATFORM_ADMIN | `src/modules/platform_ops/controllers/platform-ops.controller.ts:207` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/platform_ops/controllers/platform-ops.controller.ts:207` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.health_incidents` | ESCRIBE | ACTUALIZA | POR_TIPO | PlatformOpsController.updateIncident → OpsIncidentsService.updateIncident → OpsIncidentsService.applyTransition | `src/modules/platform_ops/services/ops-incidents.service.ts:598` |
| `platform_ops.health_incidents` | LEE | LEE | DIRECTA | PlatformOpsController.updateIncident → OpsIncidentsService.updateIncident → OpsIncidentsRepository.findIncidentForUpdate | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:246` |
| `platform_ops.incident_communications` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.updateIncident → OpsIncidentsService.updateIncident → OpsIncidentsRepository.createCommunication | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:424` |
| `platform_ops.incident_responders` | ESCRIBE | ACTUALIZA | POR_TIPO | PlatformOpsController.updateIncident → OpsIncidentsService.updateIncident | `src/modules/platform_ops/services/ops-incidents.service.ts:373` |
| `platform_ops.incident_responders` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.updateIncident → OpsIncidentsService.updateIncident → OpsIncidentsRepository.createResponder | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:310` |
| `platform_ops.incident_responders` | LEE | LEE | DIRECTA | PlatformOpsController.updateIncident → OpsIncidentsService.updateIncident → OpsIncidentsRepository.findResponder | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:340` |
| `platform_ops.incident_timeline_events` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.updateIncident → OpsIncidentsService.updateIncident → OpsIncidentsRepository.createTimelineEvent | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:377` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateIncidentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `transition` | `string` | Sí | valores: ACKNOWLEDGE, MITIGATE, RESOLVE, UPDATE | `@IsIn(INCIDENT_TRANSITIONS)` | `UPDATE` sólo añade sin mover el estado | `src/modules/platform_ops/dto/platform-ops.dto.ts:850` |
| `summary` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Qué se apunta en el timeline | `src/modules/platform_ops/dto/platform-ops.dto.ts:862` |
| `rootCauseText` | `string` | No | — | `@IsOptional()` `@IsString()` | Causa raíz; obligatoria al resolver | `src/modules/platform_ops/dto/platform-ops.dto.ts:870` |
| `resolutionText` | `string` | No | — | `@IsOptional()` `@IsString()` | Cómo se resolvió; obligatoria al resolver | `src/modules/platform_ops/dto/platform-ops.dto.ts:880` |
| `responders` | `array<IncidentResponderDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => IncidentResponderDto)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:890` |
| `responders[].userId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:784` |
| `responders[].role` | `string` | No | valores: COMMANDER, OPERATIONS, COMMUNICATIONS, SCRIBE | `@IsIn(RESPONDER_ROLES)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:791` |
| `responders[].acknowledged` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | true si el respondiente ya acusó recibo | `src/modules/platform_ops/dto/platform-ops.dto.ts:801` |
| `communications` | `array<IncidentCommunicationDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => IncidentCommunicationDto)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:900` |
| `communications[].type` | `string` | No | valores: STATUS_UPDATE, ESCALATION, RESOLUTION | `@IsIn(COMMUNICATION_TYPES)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:813` |
| `communications[].audience` | `string` | No | valores: INTERNAL, CUSTOMERS, REGULATORS | `@IsIn(COMMUNICATION_AUDIENCES)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:820` |
| `communications[].messageText` | `string` | No | longitud máxima 4000 | `@IsString()` `@MaxLength(4000)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:828` |
| `communications[].channelReference` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:837` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "transition": "ACKNOWLEDGE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "transition": "ACKNOWLEDGE",
  "summary": "valor-ejemplo",
  "rootCauseText": "valor-ejemplo",
  "resolutionText": "valor-ejemplo",
  "responders": [
    {
      "userId": "00000000-0000-4000-8000-000000000001",
      "role": "COMMANDER",
      "acknowledged": true
    }
  ],
  "communications": [
    {
      "type": "STATUS_UPDATE",
      "audience": "INTERNAL",
      "messageText": "valor-ejemplo",
      "channelReference": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<IncidentResponseDto>` · DTO `IncidentResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:911` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/platform_ops/dto/platform-ops.dto.ts:917` |
| `addedResponderIds` | `array<string>` | Sí | formato uuid | — | Respondientes añadidos | `src/modules/platform_ops/dto/platform-ops.dto.ts:927` |
| `communicationIds` | `array<string>` | Sí | formato uuid | — | Comunicaciones publicadas | `src/modules/platform_ops/dto/platform-ops.dto.ts:937` |
| `timelineEventIds` | `array<string>` | Sí | formato uuid | — | Entradas de timeline creadas | `src/modules/platform_ops/dto/platform-ops.dto.ts:947` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El incidente ya está resuelto; PreconditionFailedException: La transición no es válida desde el estado actual; PreconditionFailedException: Resolver exige causa raíz y descripción de la resolución |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/platform_ops/controllers/platform-ops.controller.spec.ts:139` |

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `UC-46-07`

---

## 15. POST /ops/incidents/{id}/postmortem

- **Origen:** CONTRATO
- **Nombre:** Abrir el postmortem del incidente resuelto
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PlatformOpsController.openPostmortem` — `src/modules/platform_ops/controllers/platform-ops.controller.ts:229`

### Qué es y para qué sirve (negocio)

Abrir el postmortem del incidente resuelto. Caso de uso UC-46-08: Postmortem y acciones. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/platform_ops/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /ops/incidents/{id}/postmortem` la atiende `PlatformOpsController.openPostmortem` (src/modules/platform_ops/controllers/platform-ops.controller.ts:229). Exige sesión con alguno de los roles SRE, INCIDENT_COMMANDER, PLATFORM_ADMIN. Valida el cuerpo como `OpenPostmortemDto` (15 campos, 7 obligatorios). Delega en `OpsIncidentsService.openPostmortem`. Crea filas en platform_ops.operational_improvement_items, platform_ops.postmortem_action_items, platform_ops.postmortems. Lee platform_ops.health_incidents, platform_ops.postmortems.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SRE, INCIDENT_COMMANDER, PLATFORM_ADMIN | `src/modules/platform_ops/controllers/platform-ops.controller.ts:229` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/platform_ops/controllers/platform-ops.controller.ts:229` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.health_incidents` | LEE | LEE | DIRECTA | PlatformOpsController.openPostmortem → OpsIncidentsService.openPostmortem → OpsIncidentsRepository.findIncidentForUpdate | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:246` |
| `platform_ops.operational_improvement_items` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.openPostmortem → OpsIncidentsService.openPostmortem → OpsImprovementsRepository.createImprovementItem | `src/modules/platform_ops/repositories/ops-improvements.repository.ts:81` |
| `platform_ops.postmortem_action_items` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.openPostmortem → OpsIncidentsService.openPostmortem → OpsIncidentsRepository.createActionItem | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:570` |
| `platform_ops.postmortems` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.openPostmortem → OpsIncidentsService.openPostmortem → OpsIncidentsRepository.createPostmortem | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:499` |
| `platform_ops.postmortems` | LEE | LEE | DIRECTA | PlatformOpsController.openPostmortem → OpsIncidentsService.openPostmortem → OpsIncidentsRepository.findPostmortemByIncident | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:523` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `OpenPostmortemDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `title` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1029` |
| `ownerUserId` | `string` | Sí | formato uuid | `@IsUUID()` | Quién conduce el postmortem | `src/modules/platform_ops/dto/platform-ops.dto.ts:1036` |
| `impactSummary` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1044` |
| `detectionSummary` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1052` |
| `responseSummary` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1060` |
| `rootCauseSummary` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1068` |
| `contributingFactorsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Factores contribuyentes | `src/modules/platform_ops/dto/platform-ops.dto.ts:1076` |
| `lessonsLearned` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1084` |
| `actionItems` | `array<ActionItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => ActionItemDto)` | Un postmortem sin acciones no cambia nada | `src/modules/platform_ops/dto/platform-ops.dto.ts:1097` |
| `actionItems[].actionCode` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | Código de la acción, único en el postmortem | `src/modules/platform_ops/dto/platform-ops.dto.ts:980` |
| `actionItems[].description` | `string` | Sí | longitud máxima 2000 | `@IsString()` `@MaxLength(2000)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:988` |
| `actionItems[].actionType` | `string` | Sí | valores: PREVENTIVE, CORRECTIVE, DETECTIVE, PROCESS | `@IsIn(ACTION_TYPES)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:995` |
| `actionItems[].ownerUserId` | `string` | Sí | formato uuid | `@IsUUID()` | Quién responde de la acción | `src/modules/platform_ops/dto/platform-ops.dto.ts:1002` |
| `actionItems[].dueAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1010` |
| `actionItems[].priority` | `string` | No | valores: LOW, MEDIUM, HIGH | `@IsOptional()` `@IsIn(IMPROVEMENT_PRIORITIES)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1018` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "title": "valor-ejemplo",
  "ownerUserId": "00000000-0000-4000-8000-000000000001",
  "actionItems": [
    {
      "actionCode": "CODIGO_EJEMPLO",
      "description": "Texto descriptivo de ejemplo",
      "actionType": "PREVENTIVE",
      "ownerUserId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "title": "valor-ejemplo",
  "ownerUserId": "00000000-0000-4000-8000-000000000001",
  "impactSummary": "valor-ejemplo",
  "detectionSummary": "valor-ejemplo",
  "responseSummary": "valor-ejemplo",
  "rootCauseSummary": "valor-ejemplo",
  "contributingFactorsJson": {},
  "lessonsLearned": "valor-ejemplo",
  "actionItems": [
    {
      "actionCode": "CODIGO_EJEMPLO",
      "description": "Texto descriptivo de ejemplo",
      "actionType": "PREVENTIVE",
      "ownerUserId": "00000000-0000-4000-8000-000000000001",
      "dueAt": "2026-07-31T12:00:00.000Z",
      "priority": "MEDIUM"
    }
  ]
}
```

</details>

### Respuesta — `Promise<PostmortemResponseDto>` · DTO `PostmortemResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:1108` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/platform_ops/dto/platform-ops.dto.ts:1114` |
| `actionItemIds` | `array<string>` | Sí | formato uuid | — | Valor de action item ids mantenido por la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:1120` |
| `improvementItemIds` | `array<string>` | Sí | formato uuid | — | Mejoras abiertas para seguimiento | `src/modules/platform_ops/dto/platform-ops.dto.ts:1130` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El incidente ya tiene postmortem |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El código de acción está repetido; PreconditionFailedException: El incidente todavía no está resuelto |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/platform_ops/controllers/platform-ops.controller.spec.ts:153` |

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `UC-46-08`

---

## 16. POST /ops/readiness-reviews/{id}/complete

- **Origen:** CONTRATO
- **Nombre:** Cerrar la revisión de preparación con su decisión
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PlatformOpsController.completeReadinessReview` — `src/modules/platform_ops/controllers/platform-ops.controller.ts:317`

### Qué es y para qué sirve (negocio)

Cerrar la revisión de preparación con su decisión. Caso de uso UC-46-12: Cerrar revisión de preparación. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/platform_ops/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /ops/readiness-reviews/{id}/complete` la atiende `PlatformOpsController.completeReadinessReview` (src/modules/platform_ops/controllers/platform-ops.controller.ts:317). Exige sesión con alguno de los roles RELEASE_MANAGER, PLATFORM_ADMIN. Valida el cuerpo como `CompleteReadinessReviewDto` (6 campos, 2 obligatorios). Delega en `OpsPracticesService.completeReadinessReview`. Crea filas en platform_ops.operational_improvement_items. Lee platform_ops.operational_readiness_reviews, platform_ops.readiness_review_findings, platform_ops.service_components.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: RELEASE_MANAGER, PLATFORM_ADMIN | `src/modules/platform_ops/controllers/platform-ops.controller.ts:317` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/platform_ops/controllers/platform-ops.controller.ts:317` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.operational_improvement_items` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.completeReadinessReview → OpsPracticesService.completeReadinessReview → OpsImprovementsRepository.createImprovementItem | `src/modules/platform_ops/repositories/ops-improvements.repository.ts:81` |
| `platform_ops.operational_readiness_reviews` | LEE | LEE | DIRECTA | PlatformOpsController.completeReadinessReview → OpsPracticesService.completeReadinessReview → OpsPracticesRepository.findReviewForUpdate | `src/modules/platform_ops/repositories/ops-practices.repository.ts:43` |
| `platform_ops.readiness_review_findings` | LEE | LEE | DIRECTA | PlatformOpsController.completeReadinessReview → OpsPracticesService.completeReadinessReview → OpsPracticesRepository.findFindingsForUpdate | `src/modules/platform_ops/repositories/ops-practices.repository.ts:76` |
| `platform_ops.service_components` | LEE | LEE | DIRECTA | PlatformOpsController.completeReadinessReview → OpsPracticesService.completeReadinessReview → PlatformOpsScope.viaComponent | `src/modules/platform_ops/services/platform-ops-scope.service.ts:102` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CompleteReadinessReviewDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: GO, NO_GO | `@IsIn(['GO', 'NO_GO'])` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1436` |
| `resolvedFindings` | `array<ResolvedFindingDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => ResolvedFindingDto)` | Hallazgos que se cierran | `src/modules/platform_ops/dto/platform-ops.dto.ts:1449` |
| `resolvedFindings[].findingId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1418` |
| `resolvedFindings[].evidenceJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Evidencia del cierre | `src/modules/platform_ops/dto/platform-ops.dto.ts:1426` |
| `evidenceJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Evidencia de la revisión | `src/modules/platform_ops/dto/platform-ops.dto.ts:1457` |
| `improvementOwnerUserId` | `string` | Sí | formato uuid | `@IsUUID()` | Quién responde de los hallazgos que quedan abiertos | `src/modules/platform_ops/dto/platform-ops.dto.ts:1467` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "GO",
  "improvementOwnerUserId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "GO",
  "resolvedFindings": [
    {
      "findingId": "00000000-0000-4000-8000-000000000001",
      "evidenceJson": {}
    }
  ],
  "evidenceJson": {},
  "improvementOwnerUserId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ReadinessReviewResponseDto>` · DTO `ReadinessReviewResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:1478` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/platform_ops/dto/platform-ops.dto.ts:1484` |
| `decisionConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a decision concept. | `src/modules/platform_ops/dto/platform-ops.dto.ts:1490` |
| `resolvedCount` | `number` | Sí | — | — | Hallazgos cerrados en esta operación | `src/modules/platform_ops/dto/platform-ops.dto.ts:1496` |
| `improvementItemIds` | `array<string>` | Sí | formato uuid | — | Mejoras abiertas por lo que queda | `src/modules/platform_ops/dto/platform-ops.dto.ts:1506` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El hallazgo no pertenece a esta revisión |
| 409 | `CONFLICT` | ConflictException: El hallazgo ya no está abierto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La revisión no está en curso; PreconditionFailedException: Quedan hallazgos críticos o altos sin resolver |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/platform_ops/controllers/platform-ops.controller.spec.ts:211` |

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `UC-46-12`

---

## 17. POST /ops/resilience-exercises/{id}/complete

- **Origen:** CONTRATO
- **Nombre:** Cerrar un ejercicio de resiliencia
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PlatformOpsController.completeResilienceExercise` — `src/modules/platform_ops/controllers/platform-ops.controller.ts:379`

### Qué es y para qué sirve (negocio)

Cerrar un ejercicio de resiliencia. Caso de uso UC-46-14: Cerrar ejercicio de resiliencia. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/platform_ops/README.md:60`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /ops/resilience-exercises/{id}/complete` la atiende `PlatformOpsController.completeResilienceExercise` (src/modules/platform_ops/controllers/platform-ops.controller.ts:379). Exige sesión con alguno de los roles SRE, PLATFORM_ADMIN. Valida el cuerpo como `CompleteResilienceExerciseDto` (7 campos, 4 obligatorios). Delega en `OpsPracticesService.completeResilienceExercise`. Crea filas en platform_ops.operational_improvement_items. Lee platform_ops.recovery_objectives, platform_ops.resilience_exercises.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SRE, PLATFORM_ADMIN | `src/modules/platform_ops/controllers/platform-ops.controller.ts:379` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/platform_ops/controllers/platform-ops.controller.ts:379` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.operational_improvement_items` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.completeResilienceExercise → OpsPracticesService.completeResilienceExercise → OpsImprovementsRepository.createImprovementItem | `src/modules/platform_ops/repositories/ops-improvements.repository.ts:81` |
| `platform_ops.recovery_objectives` | LEE | LEE | DIRECTA | PlatformOpsController.completeResilienceExercise → OpsPracticesService.completeResilienceExercise → OpsPracticesRepository.findRecoveryObjectiveForUpdate | `src/modules/platform_ops/repositories/ops-practices.repository.ts:292` |
| `platform_ops.resilience_exercises` | LEE | LEE | DIRECTA | PlatformOpsController.completeResilienceExercise → OpsPracticesService.completeResilienceExercise → OpsPracticesRepository.findExerciseForUpdate | `src/modules/platform_ops/repositories/ops-practices.repository.ts:276` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CompleteResilienceExerciseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `startedAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1683` |
| `endedAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1690` |
| `observedRtoSeconds` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Tiempo de recuperación observado en segundos; cadena por ser bigint | `src/modules/platform_ops/dto/platform-ops.dto.ts:1701` |
| `observedRpoSeconds` | `string` | No | — | `@IsOptional()` `@IsNumberString({ no_symbols: true })` | Pérdida de datos observada en segundos; cadena por ser bigint | `src/modules/platform_ops/dto/platform-ops.dto.ts:1713` |
| `evidenceUri` | `string` | No | — | `@IsOptional()` `@IsString()` | URI de la evidencia | `src/modules/platform_ops/dto/platform-ops.dto.ts:1721` |
| `findingsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Hallazgos del ejercicio | `src/modules/platform_ops/dto/platform-ops.dto.ts:1729` |
| `improvementOwnerUserId` | `string` | Sí | formato uuid | `@IsUUID()` | Quién responde de la mejora si se incumple el objetivo | `src/modules/platform_ops/dto/platform-ops.dto.ts:1739` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "startedAt": "2026-07-31T12:00:00.000Z",
  "endedAt": "2026-07-31T12:00:00.000Z",
  "observedRtoSeconds": "900",
  "improvementOwnerUserId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "startedAt": "2026-07-31T12:00:00.000Z",
  "endedAt": "2026-07-31T12:00:00.000Z",
  "observedRtoSeconds": "900",
  "observedRpoSeconds": "300",
  "evidenceUri": "valor-ejemplo",
  "findingsJson": {},
  "improvementOwnerUserId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ResilienceExerciseResponseDto>` · DTO `ResilienceExerciseResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:1750` |
| `resultConceptId` | `string` | Sí | formato uuid | — | Resultado derivado de comparar con el objetivo | `src/modules/platform_ops/dto/platform-ops.dto.ts:1759` |
| `rtoBreached` | `boolean` | Sí | — | — | true si el RTO observado supera el objetivo | `src/modules/platform_ops/dto/platform-ops.dto.ts:1765` |
| `rpoBreached` | `boolean` | Sí | — | — | true si el RPO observado supera el objetivo | `src/modules/platform_ops/dto/platform-ops.dto.ts:1771` |
| `improvementItemId` | `string` | No | formato uuid | — | Mejora abierta por el incumplimiento | `src/modules/platform_ops/dto/platform-ops.dto.ts:1780` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El ejercicio ya está cerrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El ejercicio termina antes de empezar; PreconditionFailedException: El componente no tiene objetivo de recuperación vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/platform_ops/controllers/platform-ops.controller.spec.ts:252` |

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `UC-46-14`

---

## 18. POST /ops/runbook-executions

- **Origen:** CONTRATO
- **Nombre:** Registrar la ejecución de un runbook
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PlatformOpsController.recordRunbookExecution` — `src/modules/platform_ops/controllers/platform-ops.controller.ts:359`

### Qué es y para qué sirve (negocio)

Registrar la ejecución de un runbook. Caso de uso UC-46-13: Versión y ejecución de runbook. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/platform_ops/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /ops/runbook-executions` la atiende `PlatformOpsController.recordRunbookExecution` (src/modules/platform_ops/controllers/platform-ops.controller.ts:359). Exige sesión con alguno de los roles SRE, PLATFORM_ADMIN. Valida el cuerpo como `RecordRunbookExecutionDto` (9 campos, 4 obligatorios). Delega en `OpsPracticesService.recordRunbookExecution`. Crea filas en platform_ops.incident_timeline_events, platform_ops.runbook_executions. Lee platform_ops.change_requests, platform_ops.health_incidents, platform_ops.runbook_versions, platform_ops.runbooks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SRE, PLATFORM_ADMIN | `src/modules/platform_ops/controllers/platform-ops.controller.ts:359` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.change_requests` | LEE | LEE | DIRECTA | PlatformOpsController.recordRunbookExecution → OpsPracticesService.recordRunbookExecution → OpsPracticesRepository.findChangeRequestInTenant | `src/modules/platform_ops/repositories/ops-practices.repository.ts:27` |
| `platform_ops.health_incidents` | LEE | LEE | DIRECTA | PlatformOpsController.recordRunbookExecution → OpsPracticesService.recordRunbookExecution → OpsIncidentsRepository.findIncidentById | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:230` |
| `platform_ops.incident_timeline_events` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.recordRunbookExecution → OpsPracticesService.recordRunbookExecution → OpsIncidentsRepository.createTimelineEvent | `src/modules/platform_ops/repositories/ops-incidents.repository.ts:377` |
| `platform_ops.runbook_executions` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.recordRunbookExecution → OpsPracticesService.recordRunbookExecution → OpsPracticesRepository.createRunbookExecution | `src/modules/platform_ops/repositories/ops-practices.repository.ts:241` |
| `platform_ops.runbook_versions` | LEE | LEE | DIRECTA | PlatformOpsController.recordRunbookExecution → OpsPracticesService.recordRunbookExecution → OpsPracticesRepository.findRunbookVersionById | `src/modules/platform_ops/repositories/ops-practices.repository.ts:174` |
| `platform_ops.runbooks` | LEE | LEE | DIRECTA | PlatformOpsController.recordRunbookExecution → OpsPracticesService.recordRunbookExecution → PlatformOpsScope.viaRunbook | `src/modules/platform_ops/services/platform-ops-scope.service.ts:140` |

### Cuerpo — DTO `RecordRunbookExecutionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `runbookVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión ejecutada | `src/modules/platform_ops/dto/platform-ops.dto.ts:1576` |
| `mode` | `string` | Sí | valores: MANUAL, ASSISTED, AUTOMATED | `@IsIn(EXECUTION_MODES)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1583` |
| `result` | `string` | Sí | valores: SUCCESS, PARTIAL, FAILED, ABORTED | `@IsIn(EXECUTION_RESULTS)` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1590` |
| `startedAt` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1597` |
| `endedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1605` |
| `healthIncidentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Incidente en el que se ejecutó | `src/modules/platform_ops/dto/platform-ops.dto.ts:1616` |
| `changeRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cambio en el que se ejecutó | `src/modules/platform_ops/dto/platform-ops.dto.ts:1627` |
| `executionLogUri` | `string` | No | — | `@IsOptional()` `@IsString()` | URI del log de ejecución | `src/modules/platform_ops/dto/platform-ops.dto.ts:1635` |
| `outputJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Salida de la ejecución | `src/modules/platform_ops/dto/platform-ops.dto.ts:1643` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "runbookVersionId": "00000000-0000-4000-8000-000000000001",
  "mode": "MANUAL",
  "result": "SUCCESS",
  "startedAt": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "runbookVersionId": "00000000-0000-4000-8000-000000000001",
  "mode": "MANUAL",
  "result": "SUCCESS",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "endedAt": "2026-07-31T12:00:00.000Z",
  "healthIncidentId": "00000000-0000-4000-8000-000000000001",
  "changeRequestId": "00000000-0000-4000-8000-000000000001",
  "executionLogUri": "valor-ejemplo",
  "outputJson": {}
}
```

</details>

### Respuesta — `Promise<RunbookExecutionResponseDto>` · DTO `RunbookExecutionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:1654` |
| `resultConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a result concept. | `src/modules/platform_ops/dto/platform-ops.dto.ts:1660` |
| `timelineEventId` | `string` | No | formato uuid | — | Entrada de timeline si la ejecución fue en un incidente | `src/modules/platform_ops/dto/platform-ops.dto.ts:1669` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ejecución termina antes de empezar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/platform_ops/controllers/platform-ops.controller.spec.ts:239` |

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `UC-46-13`

---

## 19. POST /ops/runbooks/{id}/versions

- **Origen:** CONTRATO
- **Nombre:** Publicar una versión del runbook
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PlatformOpsController.publishRunbookVersion` — `src/modules/platform_ops/controllers/platform-ops.controller.ts:338`

### Qué es y para qué sirve (negocio)

Publicar una versión del runbook. Caso de uso UC-46-13: Versión y ejecución de runbook. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/platform_ops/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /ops/runbooks/{id}/versions` la atiende `PlatformOpsController.publishRunbookVersion` (src/modules/platform_ops/controllers/platform-ops.controller.ts:338). Exige sesión con alguno de los roles SRE, PLATFORM_ADMIN. Valida el cuerpo como `PublishRunbookVersionDto` (2 campos, 1 obligatorio). Delega en `OpsPracticesService.publishRunbookVersion`. Crea filas en platform_ops.runbook_versions. Lee platform_ops.runbook_versions, platform_ops.runbooks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SRE, PLATFORM_ADMIN | `src/modules/platform_ops/controllers/platform-ops.controller.ts:338` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/platform_ops/controllers/platform-ops.controller.ts:338` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.runbook_versions` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.publishRunbookVersion → OpsPracticesService.publishRunbookVersion → OpsPracticesRepository.createRunbookVersion | `src/modules/platform_ops/repositories/ops-practices.repository.ts:131` |
| `platform_ops.runbook_versions` | LEE | LEE | DIRECTA | PlatformOpsController.publishRunbookVersion → OpsPracticesService.publishRunbookVersion → OpsPracticesRepository.findLatestRunbookVersion | `src/modules/platform_ops/repositories/ops-practices.repository.ts:188` |
| `platform_ops.runbooks` | LEE | LEE | DIRECTA | PlatformOpsController.publishRunbookVersion → OpsPracticesService.publishRunbookVersion → OpsPracticesRepository.findRunbookForUpdate | `src/modules/platform_ops/repositories/ops-practices.repository.ts:98` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishRunbookVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `contentMarkdown` | `string` | Sí | — | `@IsString()` | Contenido del runbook en Markdown | `src/modules/platform_ops/dto/platform-ops.dto.ts:1528` |
| `automationDefinitionJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Definición de la automatización asociada | `src/modules/platform_ops/dto/platform-ops.dto.ts:1538` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "contentMarkdown": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "contentMarkdown": "valor-ejemplo",
  "automationDefinitionJson": {}
}
```

</details>

### Respuesta — `Promise<RunbookVersionResponseDto>` · DTO `RunbookVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:1549` |
| `versionNumber` | `number` | Sí | — | — | Número de versión, correlativo dentro del runbook | `src/modules/platform_ops/dto/platform-ops.dto.ts:1557` |
| `runbookId` | `string` | Sí | formato uuid | — | Versión que pasa a ser la vigente del runbook | `src/modules/platform_ops/dto/platform-ops.dto.ts:1566` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Esa versión del runbook ya existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El runbook no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/platform_ops/controllers/platform-ops.controller.spec.ts:225` |

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `UC-46-13`

---

## 20. POST /ops/slo/{id}/measurements

- **Origen:** CONTRATO
- **Nombre:** Registrar la medición de una ventana del SLO
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PlatformOpsController.recordSloMeasurement` — `src/modules/platform_ops/controllers/platform-ops.controller.ts:251`

### Qué es y para qué sirve (negocio)

Registrar la medición de una ventana del SLO. Caso de uso UC-46-09: Medición de ventana SLO. Dentro del módulo (descripción del modelo, en inglés): «The operational backbone a data-center-grade deployment requires.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/platform_ops/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_46_platform_ops.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /ops/slo/{id}/measurements` la atiende `PlatformOpsController.recordSloMeasurement` (src/modules/platform_ops/controllers/platform-ops.controller.ts:251). Exige sesión con alguno de los roles SYSTEM, SRE, PLATFORM_ADMIN. Valida el cuerpo como `RecordSloMeasurementDto` (5 campos, 4 obligatorios). Delega en `OpsReliabilityService.recordSloMeasurement`. Crea filas en platform_ops.slo_measurements. Lee platform_ops.service_components, platform_ops.service_level_indicators, platform_ops.service_level_objectives, platform_ops.slo_measurements.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SRE, PLATFORM_ADMIN | `src/modules/platform_ops/controllers/platform-ops.controller.ts:251` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/platform_ops/controllers/platform-ops.controller.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `platform_ops.service_components` | LEE | LEE | DIRECTA | PlatformOpsController.recordSloMeasurement → OpsReliabilityService.recordSloMeasurement → PlatformOpsScope.viaSlo | `src/modules/platform_ops/services/platform-ops-scope.service.ts:123` |
| `platform_ops.service_level_indicators` | LEE | LEE | DIRECTA | PlatformOpsController.recordSloMeasurement → OpsReliabilityService.recordSloMeasurement → PlatformOpsScope.viaSlo | `src/modules/platform_ops/services/platform-ops-scope.service.ts:118` |
| `platform_ops.service_level_objectives` | LEE | LEE | DIRECTA | PlatformOpsController.recordSloMeasurement → OpsReliabilityService.recordSloMeasurement → PlatformOpsScope.viaSlo | `src/modules/platform_ops/services/platform-ops-scope.service.ts:116` |
| `platform_ops.slo_measurements` | ESCRIBE | CREA | DIRECTA | PlatformOpsController.recordSloMeasurement → OpsReliabilityService.recordSloMeasurement → OpsReliabilityRepository.createSloMeasurement | `src/modules/platform_ops/repositories/ops-reliability.repository.ts:88` |
| `platform_ops.slo_measurements` | LEE | LEE | DIRECTA | PlatformOpsController.recordSloMeasurement → OpsReliabilityService.recordSloMeasurement → OpsReliabilityRepository.findMeasurementByWindow | `src/modules/platform_ops/repositories/ops-reliability.repository.ts:113` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RecordSloMeasurementDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `windowStart` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1144` |
| `windowEnd` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/platform_ops/dto/platform-ops.dto.ts:1151` |
| `goodEvents` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Eventos buenos de la ventana; cadena por ser bigint | `src/modules/platform_ops/dto/platform-ops.dto.ts:1160` |
| `totalEvents` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Eventos totales de la ventana; cadena por ser bigint | `src/modules/platform_ops/dto/platform-ops.dto.ts:1169` |
| `sourceReference` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | De dónde salieron los datos | `src/modules/platform_ops/dto/platform-ops.dto.ts:1181` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "windowStart": "2026-07-31T12:00:00.000Z",
  "windowEnd": "2026-07-31T12:00:00.000Z",
  "goodEvents": "valor-ejemplo",
  "totalEvents": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "windowStart": "2026-07-31T12:00:00.000Z",
  "windowEnd": "2026-07-31T12:00:00.000Z",
  "goodEvents": "valor-ejemplo",
  "totalEvents": "valor-ejemplo",
  "sourceReference": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<SloMeasurementResponseDto>` · DTO `SloMeasurementResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/platform_ops/dto/platform-ops.dto.ts:1192` |
| `attainedValue` | `string` | Sí | — | — | Cumplimiento alcanzado, como cadena decimal | `src/modules/platform_ops/dto/platform-ops.dto.ts:1198` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/platform_ops/dto/platform-ops.dto.ts:1204` |
| `duplicate` | `boolean` | Sí | — | — | true si la ventana ya estaba medida y se devuelve la anterior | `src/modules/platform_ops/dto/platform-ops.dto.ts:1213` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana de medición está invertida; PreconditionFailedException: Una ventana sin eventos no mide nada; PreconditionFailedException: Los eventos buenos no pueden superar a los totales; PreconditionFailedException: El objetivo no está activo; PreconditionFailedException: La ventana precede a la vigencia del objetivo; PreconditionFailedException: La ventana excede la vigencia del objetivo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/platform_ops.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/platform_ops/controllers/platform-ops.controller.spec.ts:167` |

### Flujos

- Módulo 46 — Operaciones de Plataforma, Observabilidad y Releases — etapa `UC-46-09`

---

