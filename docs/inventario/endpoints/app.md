<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `app`

- **Bloque:** —
- **Operaciones:** 6 (6 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 0 · BAJO 6
- **Tablas distintas que tocan:** 0
- **Respuestas de error y detalle contractual:** `openapi/endpoints/app.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/` | Saludo raíz de verificación de despliegue | BAJO | 0 | sesión (sin roles) |
| 2 | GET | `/health` | Sonda de liveness (sin autenticación) | BAJO | 0 | pública |
| 3 | GET | `/health/data-sources` | Estado y enrutado de las fuentes de datos (requiere autenticación) | BAJO | 0 | sesión (sin roles) |
| 4 | GET | `/health/data-sources/metrics` | Contadores de operaciones por conexión y por ruta read/write | BAJO | 0 | sesión (sin roles) |
| 5 | GET | `/liveness` | Sonda de liveness sin dependencias externas | BAJO | 0 | pública |
| 6 | GET | `/readiness` | Sonda de readiness de dependencias obligatorias | BAJO | 0 | pública |

---

## 1. GET /

- **Origen:** CONTRATO
- **Nombre:** Saludo raíz de verificación de despliegue
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AppController.getHello` — `src/app.controller.ts:30`

### Qué es y para qué sirve (negocio)

Saludo raíz de verificación de despliegue.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /` la atiende `AppController.getHello` (src/app.controller.ts:30). Exige sesión; el controlador no declara roles. Delega en `AppService.getHello`. No toca tablas relacionales: Devuelve la constante 'Hello World!'; no accede a datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/app.controller.ts:30` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

No toca tablas relacionales: Devuelve la constante 'Hello World!'; no accede a datos.. _(manual, 2026-10-21; fuente: `src/app.service.ts:12`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `string`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/app.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/app.e2e-spec.ts:21` |

### Flujos

- app — etapa `ctrl:AppController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /health

- **Origen:** CONTRATO
- **Nombre:** Sonda de liveness (sin autenticación)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AppController.health` — `src/app.controller.ts:42`

### Qué es y para qué sirve (negocio)

Sonda de liveness (sin autenticación).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /health` la atiende `AppController.health` (src/app.controller.ts:42). Es una ruta pública: no exige token. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/app.controller.ts:42` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/app.controller.ts:42`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `{ /** * Valor de status mantenido por la instancia. */ status: string; }`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/app.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/observability.int-spec.ts:150` |

### Flujos

- app — etapa `ctrl:AppController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /health/data-sources

- **Origen:** CONTRATO
- **Nombre:** Estado y enrutado de las fuentes de datos (requiere autenticación)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DataSourcesController.dataSources` — `src/persistence/health/data-sources.controller.ts:25`

### Qué es y para qué sirve (negocio)

Estado y enrutado de las fuentes de datos (requiere autenticación).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /health/data-sources` la atiende `DataSourcesController.dataSources` (src/persistence/health/data-sources.controller.ts:25). Exige sesión; el controlador no declara roles. Delega en `DataSourcesHealthService.report`. No toca tablas relacionales: Consulta el estado del registro de conexiones y las reglas de enrutamiento, en memoria..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/persistence/health/data-sources.controller.ts:25` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

No toca tablas relacionales: Consulta el estado del registro de conexiones y las reglas de enrutamiento, en memoria.. _(manual, 2026-10-21; fuente: `src/persistence/health/data-sources.health.ts:51`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DataSourcesReport>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DataSourceConfigurationError: No hay ninguna conexión registrada como «{name}». Registradas: {known}. |

El árbol de decisión completo está en [flujos](../flujos/app.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/data-sources.int-spec.ts:119` |

### Flujos

- app — etapa `ctrl:DataSourcesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /health/data-sources/metrics

- **Origen:** CONTRATO
- **Nombre:** Contadores de operaciones por conexión y por ruta read/write
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DataSourcesController.metrics` — `src/persistence/health/data-sources.controller.ts:36`

### Qué es y para qué sirve (negocio)

Contadores de operaciones por conexión y por ruta read/write.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /health/data-sources/metrics` la atiende `DataSourcesController.metrics` (src/persistence/health/data-sources.controller.ts:36). Exige sesión; el controlador no declara roles. Delega en `DataSourcesHealthService.metricsSnapshot`. No toca tablas relacionales: Devuelve el contador de métricas en memoria..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/persistence/health/data-sources.controller.ts:36` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

No toca tablas relacionales: Devuelve el contador de métricas en memoria.. _(manual, 2026-10-21; fuente: `src/persistence/health/data-sources.health.ts:71`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `PersistenceMetricsSnapshot`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/app.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/data-sources.int-spec.ts:158` |

### Flujos

- app — etapa `ctrl:DataSourcesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /liveness

- **Origen:** CONTRATO
- **Nombre:** Sonda de liveness sin dependencias externas
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AppController.liveness` — `src/app.controller.ts:55`

### Qué es y para qué sirve (negocio)

Sonda de liveness sin dependencias externas.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /liveness` la atiende `AppController.liveness` (src/app.controller.ts:55). Es una ruta pública: no exige token. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/app.controller.ts:55` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/app.controller.ts:55`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `{ status: string }`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/app.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- app — etapa `ctrl:AppController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /readiness

- **Origen:** CONTRATO
- **Nombre:** Sonda de readiness de dependencias obligatorias
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AppController.readiness` — `src/app.controller.ts:63`

### Qué es y para qué sirve (negocio)

Sonda de readiness de dependencias obligatorias.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /readiness` la atiende `AppController.readiness` (src/app.controller.ts:63). Es una ruta pública: no exige token. Delega en `AppReadinessService.check`. No toca tablas relacionales: Sondas de salud: `select 1` contra PostgreSQL y ping a MongoDB, Redis y OpenSearch; no lee tablas del modelo..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/app.controller.ts:63` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

No toca tablas relacionales: Sondas de salud: `select 1` contra PostgreSQL y ping a MongoDB, Redis y OpenSearch; no lee tablas del modelo.. _(manual, 2026-10-21; fuente: `src/app-readiness.service.ts:32`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReadinessResult>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: MongoDB no confirmó el ping; Error: Redis no respondió PONG; Error: OpenSearch está en estado red |
| 503 | `DEPENDENCY_UNAVAILABLE` | ServiceUnavailableException: {{ code: ErrorCode.DEPENDENCY_UNAVAILABLE, message: 'Una o m…} |

El árbol de decisión completo está en [flujos](../flujos/app.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- app — etapa `ctrl:AppController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

