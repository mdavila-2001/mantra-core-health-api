<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `telemetry`

- **Bloque:** Operaciones de Plataforma (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)
- **Operaciones:** 25 (25 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 8 · MEDIO 5 · BAJO 12
- **Tablas distintas que tocan:** 15
- **Respuestas de error y detalle contractual:** `openapi/endpoints/telemetry.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/admin/analytics/funnels` | Embudos definidos con sus pasos | BAJO | 3 | PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO |
| 2 | GET | `/admin/analytics/funnels/{funnelId}/report` | Embudo por sesión: denominador, conversión por paso y conversiones confirmadas por servidor | BAJO | 6 | PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO |
| 3 | GET | `/admin/analytics/onboarding/funnel` | Reporte de embudo y deserción paso a paso para formularios de alta | BAJO | 0 | PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO |
| 4 | GET | `/admin/analytics/onboarding/heatmap` | Mapa de calor por campo y nivel de fricción para formularios de alta | BAJO | 0 | PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO |
| 5 | GET | `/admin/analytics/overview` | Totales, rutas y eventos principales de la ventana | BAJO | 1 | PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO |
| 6 | GET | `/admin/analytics/pipeline-health` | Frescura, latencia de ingesta, desfase de reloj; lo no medido se declara | BAJO | 2 | PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO |
| 7 | GET | `/admin/analytics/sessions` | Sesiones de la ventana (sin identificadores de sesión ni sujeto) | BAJO | 2 | PLATFORM_ADMIN, SECURITY_ADMIN, DPO |
| 8 | GET | `/admin/analytics/sessions/{id}` | Timeline de una sesión: eventos y nombres de propiedad, sin valores | BAJO | 3 | PLATFORM_ADMIN, SECURITY_ADMIN, DPO |
| 9 | GET | `/admin/analytics/timeseries` | Eventos y sesiones por hora o día (UTC), cubos vacíos en 0 | BAJO | 1 | PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO |
| 10 | GET | `/admin/analytics/web-vitals` | p50/p75/p95 por métrica sobre la distribución, con tamaño de muestra | BAJO | 3 | PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO |
| 11 | POST | `/telemetry/activity-events` | Capturar evento(s) de actividad consent-aware (batch) | ALTO | 10 | sesión (sin roles) |
| 12 | POST | `/telemetry/analytics-subjects` | Provisionar sujeto de analítica pseudónimo | MEDIO | 2 | SECURITY_ADMIN |
| 13 | POST | `/telemetry/client-contexts` | Registrar contexto de cliente/dispositivo + journey | ALTO | 5 | sesión (sin roles) |
| 14 | POST | `/telemetry/conversion-events` | Registrar evento de conversión con atribución | ALTO | 7 | sesión (sin roles) |
| 15 | POST | `/telemetry/disclosure-acceptances` | Registrar aceptación de disclosure por usuario/sesión | ALTO | 3 | sesión (sin roles) |
| 16 | POST | `/telemetry/disclosure-versions` | Publicar versión de disclosure de tracking | MEDIO | 3 | SECURITY_ADMIN |
| 17 | POST | `/telemetry/event-schemas` | Registrar esquema de evento de actividad (versionado) | MEDIO | 3 | SECURITY_ADMIN |
| 18 | POST | `/telemetry/funnels` | Definir funnel y sus pasos | MEDIO | 5 | SECURITY_ADMIN |
| 19 | POST | `/telemetry/onboarding-events` | Captura eventos de telemetría de alta y avance en formularios de registro | BAJO | 0 | pública |
| 20 | POST | `/telemetry/session-journeys/{id}/close` | Cerrar journey de sesión y consolidar métricas | ALTO | 4 | sesión (sin roles) |
| 21 | POST | `/telemetry/tracking-consents` | Otorgar consentimiento de tracking por propósito | ALTO | 2 | sesión (sin roles) |
| 22 | POST | `/telemetry/tracking-consents/{id}/withdraw` | Retirar consentimiento y desactivar sujeto (cascada) | ALTO | 4 | sesión (sin roles) |
| 23 | GET | `/telemetry/tracking-consents/me` | Estado vigente de mi consentimiento de tracking | BAJO | 1 | sesión (sin roles) |
| 24 | POST | `/telemetry/tracking-purposes` | Definir propósito de tracking y base legal | MEDIO | 2 | SECURITY_ADMIN |
| 25 | POST | `/telemetry/web-vitals` | Registrar métricas Core Web Vitals por ruta (batch) | ALTO | 6 | sesión (sin roles) |

---

## 1. GET /admin/analytics/funnels

- **Origen:** CONTRATO
- **Nombre:** Embudos definidos con sus pasos
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryAnalyticsController.listFunnels` — `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:149`

### Qué es y para qué sirve (negocio)

Embudos definidos con sus pasos. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /admin/analytics/funnels` la atiende `TelemetryAnalyticsController.listFunnels` (src/modules/telemetry/controllers/telemetry-analytics.controller.ts:149). Exige sesión con alguno de los roles PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. Delega en `TelemetryAnalyticsService.listFunnels`. Lee telemetry.activity_event_schema_definitions, telemetry.funnel_definitions, telemetry.funnel_steps.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:149` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.activity_event_schema_definitions` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.listFunnels → TelemetryAnalyticsService.listFunnels → TelemetryAnalyticsRepository.listFunnels | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:324` |
| `telemetry.funnel_definitions` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.listFunnels → TelemetryAnalyticsService.listFunnels → TelemetryAnalyticsRepository.listFunnels | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:324` |
| `telemetry.funnel_steps` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.listFunnels → TelemetryAnalyticsService.listFunnels → TelemetryAnalyticsRepository.listFunnels | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:324` |

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

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryAnalyticsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /admin/analytics/funnels/{funnelId}/report

- **Origen:** CONTRATO
- **Nombre:** Embudo por sesión: denominador, conversión por paso y conversiones confirmadas por servidor
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryAnalyticsController.funnelReport` — `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:156`

### Qué es y para qué sirve (negocio)

Embudo por sesión: denominador, conversión por paso y conversiones confirmadas por servidor. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /admin/analytics/funnels/{funnelId}/report` la atiende `TelemetryAnalyticsController.funnelReport` (src/modules/telemetry/controllers/telemetry-analytics.controller.ts:156). Exige sesión con alguno de los roles PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. Delega en `TelemetryAnalyticsService.funnelReport`. Lee telemetry.activity_event_schema_definitions, telemetry.conversion_events, telemetry.funnel_definitions, telemetry.funnel_steps, telemetry.session_journeys, telemetry.user_activity_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:156` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: funnelId | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:156` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.activity_event_schema_definitions` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.funnelReport → TelemetryAnalyticsService.funnelReport → TelemetryAnalyticsService.listFunnels → TelemetryAnalyticsRepository.listFunnels | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:324` |
| `telemetry.conversion_events` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.funnelReport → TelemetryAnalyticsService.funnelReport → TelemetryAnalyticsRepository.serverConversions | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:398` |
| `telemetry.funnel_definitions` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.funnelReport → TelemetryAnalyticsService.funnelReport → TelemetryAnalyticsService.listFunnels → TelemetryAnalyticsRepository.listFunnels | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:324` |
| `telemetry.funnel_steps` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.funnelReport → TelemetryAnalyticsService.funnelReport → TelemetryAnalyticsService.listFunnels → TelemetryAnalyticsRepository.listFunnels | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:324` |
| `telemetry.session_journeys` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.funnelReport → TelemetryAnalyticsService.funnelReport → TelemetryAnalyticsRepository.serverConversions → TelemetryAnalyticsRepository.rowInTenant | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:94` |
| `telemetry.user_activity_events` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.funnelReport → TelemetryAnalyticsService.funnelReport → TelemetryAnalyticsRepository.funnelReach | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:354` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `funnelId` | path | Sí | `string` | — |
| `from` | query | No | `string` | Por defecto: to − 7 días |
| `to` | query | No | `string` | Por defecto: ahora |
| `interval` | query | No | `string` | — |
| `portal` | query | No | `string` | — |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Embudo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-analytics.controller.spec.ts:61` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryAnalyticsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /admin/analytics/onboarding/funnel

- **Origen:** CONTRATO
- **Nombre:** Reporte de embudo y deserción paso a paso para formularios de alta
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryOnboardingAnalyticsController.getFunnelReport` — `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:138`

### Qué es y para qué sirve (negocio)

Reporte de embudo y deserción paso a paso para formularios de alta. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /admin/analytics/onboarding/funnel` la atiende `TelemetryOnboardingAnalyticsController.getFunnelReport` (src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:138). Exige sesión con alguno de los roles PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. Delega en `TelemetryOnboardingAnalyticsService.getFunnelReport`. No toca tablas relacionales: Calcula el embudo sobre los eventos de alta que el proceso acumula en memoria (`events`); no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:138` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

No toca tablas relacionales: Calcula el embudo sobre los eventos de alta que el proceso acumula en memoria (`events`); no consulta la base de datos.. _(manual, 2026-10-25; fuente: `src/modules/telemetry/services/telemetry-onboarding-analytics.service.ts:19`)_

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

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.spec.ts:34` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryOnboardingAnalyticsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /admin/analytics/onboarding/heatmap

- **Origen:** CONTRATO
- **Nombre:** Mapa de calor por campo y nivel de fricción para formularios de alta
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryOnboardingAnalyticsController.getHeatmapReport` — `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:152`

### Qué es y para qué sirve (negocio)

Mapa de calor por campo y nivel de fricción para formularios de alta. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /admin/analytics/onboarding/heatmap` la atiende `TelemetryOnboardingAnalyticsController.getHeatmapReport` (src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:152). Exige sesión con alguno de los roles PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. Delega en `TelemetryOnboardingAnalyticsService.getHeatmapReport`. No toca tablas relacionales: Calcula el mapa de calor sobre los eventos de alta que el proceso acumula en memoria (`events`); no consulta la base de datos..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:152` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | metric (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

No toca tablas relacionales: Calcula el mapa de calor sobre los eventos de alta que el proceso acumula en memoria (`events`); no consulta la base de datos.. _(manual, 2026-10-25; fuente: `src/modules/telemetry/services/telemetry-onboarding-analytics.service.ts:19`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `metric` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.spec.ts:43` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryOnboardingAnalyticsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /admin/analytics/overview

- **Origen:** CONTRATO
- **Nombre:** Totales, rutas y eventos principales de la ventana
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryAnalyticsController.overview` — `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:121`

### Qué es y para qué sirve (negocio)

Totales, rutas y eventos principales de la ventana. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /admin/analytics/overview` la atiende `TelemetryAnalyticsController.overview` (src/modules/telemetry/controllers/telemetry-analytics.controller.ts:121). Exige sesión con alguno de los roles PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. Delega en `TelemetryAnalyticsService.overview`. Lee telemetry.user_activity_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:121` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.user_activity_events` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.overview → TelemetryAnalyticsService.overview → TelemetryAnalyticsRepository.overview | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:113` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `from` | query | No | `string` | Por defecto: to − 7 días |
| `to` | query | No | `string` | Por defecto: ahora |
| `interval` | query | No | `string` | — |
| `portal` | query | No | `string` | — |

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

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-analytics.controller.spec.ts:58` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryAnalyticsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /admin/analytics/pipeline-health

- **Origen:** CONTRATO
- **Nombre:** Frescura, latencia de ingesta, desfase de reloj; lo no medido se declara
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryAnalyticsController.pipelineHealth` — `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:169`

### Qué es y para qué sirve (negocio)

Frescura, latencia de ingesta, desfase de reloj; lo no medido se declara. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /admin/analytics/pipeline-health` la atiende `TelemetryAnalyticsController.pipelineHealth` (src/modules/telemetry/controllers/telemetry-analytics.controller.ts:169). Exige sesión con alguno de los roles PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. Delega en `TelemetryAnalyticsService.pipelineHealth`. Lee telemetry.client_contexts, telemetry.user_activity_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:169` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.client_contexts` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.pipelineHealth → TelemetryAnalyticsService.pipelineHealth → TelemetryAnalyticsRepository.pipelineHealth | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:438` |
| `telemetry.user_activity_events` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.pipelineHealth → TelemetryAnalyticsService.pipelineHealth → TelemetryAnalyticsRepository.pipelineHealth | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:418` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `from` | query | No | `string` | Por defecto: to − 7 días |
| `to` | query | No | `string` | Por defecto: ahora |
| `interval` | query | No | `string` | — |
| `portal` | query | No | `string` | — |

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

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-analytics.controller.spec.ts:62` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryAnalyticsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /admin/analytics/sessions

- **Origen:** CONTRATO
- **Nombre:** Sesiones de la ventana (sin identificadores de sesión ni sujeto)
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryAnalyticsController.listSessions` — `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:179`

### Qué es y para qué sirve (negocio)

Sesiones de la ventana (sin identificadores de sesión ni sujeto). Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /admin/analytics/sessions` la atiende `TelemetryAnalyticsController.listSessions` (src/modules/telemetry/controllers/telemetry-analytics.controller.ts:179). Exige sesión con alguno de los roles PLATFORM_ADMIN, SECURITY_ADMIN, DPO. Delega en `TelemetryAnalyticsService.listSessions`. Lee telemetry.session_journeys, telemetry.user_activity_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SECURITY_ADMIN, DPO | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:179` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.session_journeys` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.listSessions → TelemetryAnalyticsService.listSessions → TelemetryAnalyticsRepository.listSessions | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:256` |
| `telemetry.user_activity_events` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.listSessions → TelemetryAnalyticsService.listSessions → TelemetryAnalyticsRepository.listSessions → TelemetryAnalyticsRepository.sessionInTenant | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `from` | query | No | `string` | Por defecto: to − 7 días |
| `to` | query | No | `string` | Por defecto: ahora |
| `interval` | query | No | `string` | — |
| `portal` | query | No | `string` | — |
| `cursor` | query | No | `string` | — |
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
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-analytics.controller.spec.ts:63` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryAnalyticsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /admin/analytics/sessions/{id}

- **Origen:** CONTRATO
- **Nombre:** Timeline de una sesión: eventos y nombres de propiedad, sin valores
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryAnalyticsController.getSession` — `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:188`

### Qué es y para qué sirve (negocio)

Timeline de una sesión: eventos y nombres de propiedad, sin valores. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /admin/analytics/sessions/{id}` la atiende `TelemetryAnalyticsController.getSession` (src/modules/telemetry/controllers/telemetry-analytics.controller.ts:188). Exige sesión con alguno de los roles PLATFORM_ADMIN, SECURITY_ADMIN, DPO. Delega en `TelemetryAnalyticsService.getSession`. Lee telemetry.session_journeys, telemetry.user_activity_event_properties, telemetry.user_activity_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SECURITY_ADMIN, DPO | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:188` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:188` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.session_journeys` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.getSession → TelemetryAnalyticsService.getSession → TelemetryAnalyticsRepository.findSession | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:279` |
| `telemetry.user_activity_event_properties` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.getSession → TelemetryAnalyticsService.getSession → TelemetryAnalyticsRepository.sessionTimeline | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:299` |
| `telemetry.user_activity_events` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.getSession → TelemetryAnalyticsService.getSession → TelemetryAnalyticsRepository.sessionTimeline | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:299` |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sesión no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-analytics.controller.spec.ts:64` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryAnalyticsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /admin/analytics/timeseries

- **Origen:** CONTRATO
- **Nombre:** Eventos y sesiones por hora o día (UTC), cubos vacíos en 0
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryAnalyticsController.timeseries` — `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:130`

### Qué es y para qué sirve (negocio)

Eventos y sesiones por hora o día (UTC), cubos vacíos en 0. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /admin/analytics/timeseries` la atiende `TelemetryAnalyticsController.timeseries` (src/modules/telemetry/controllers/telemetry-analytics.controller.ts:130). Exige sesión con alguno de los roles PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. Delega en `TelemetryAnalyticsService.timeseries`. Lee telemetry.user_activity_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:130` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.user_activity_events` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.timeseries → TelemetryAnalyticsService.timeseries → TelemetryAnalyticsRepository.timeseries | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:153` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `from` | query | No | `string` | Por defecto: to − 7 días |
| `to` | query | No | `string` | Por defecto: ahora |
| `interval` | query | No | `string` | — |
| `portal` | query | No | `string` | — |

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

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-analytics.controller.spec.ts:59` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryAnalyticsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. GET /admin/analytics/web-vitals

- **Origen:** CONTRATO
- **Nombre:** p50/p75/p95 por métrica sobre la distribución, con tamaño de muestra
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryAnalyticsController.webVitals` — `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:139`

### Qué es y para qué sirve (negocio)

p50/p75/p95 por métrica sobre la distribución, con tamaño de muestra. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /admin/analytics/web-vitals` la atiende `TelemetryAnalyticsController.webVitals` (src/modules/telemetry/controllers/telemetry-analytics.controller.ts:139). Exige sesión con alguno de los roles PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. Delega en `TelemetryAnalyticsService.webVitals`. Lee telemetry.session_journeys, telemetry.user_activity_events, telemetry.web_vitals.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO | `src/modules/telemetry/controllers/telemetry-analytics.controller.ts:139` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.session_journeys` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.webVitals → TelemetryAnalyticsService.webVitals → TelemetryAnalyticsRepository.webVitals → TelemetryAnalyticsRepository.rowInTenant | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:94` |
| `telemetry.user_activity_events` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.webVitals → TelemetryAnalyticsService.webVitals → TelemetryAnalyticsRepository.webVitals → TelemetryAnalyticsRepository.rowInTenant | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:94` |
| `telemetry.web_vitals` | LEE | LEE | POR_SQL | TelemetryAnalyticsController.webVitals → TelemetryAnalyticsService.webVitals → TelemetryAnalyticsRepository.webVitals | `src/modules/telemetry/repositories/telemetry-analytics.repository.ts:192` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `from` | query | No | `string` | Por defecto: to − 7 días |
| `to` | query | No | `string` | Por defecto: ahora |
| `interval` | query | No | `string` | — |
| `portal` | query | No | `string` | — |
| `route` | query | No | `string` | Plantilla de ruta, p. ej. /patients/:id |
| `metric` | query | No | `string` | Desglose p75 por ruta de esta métrica |

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

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-analytics.controller.spec.ts:60` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryAnalyticsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. POST /telemetry/activity-events

- **Origen:** CONTRATO
- **Nombre:** Capturar evento(s) de actividad consent-aware (batch)
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryEventsController.captureActivityEvents` — `src/modules/telemetry/controllers/telemetry-events.controller.ts:45`

### Qué es y para qué sirve (negocio)

Capturar evento(s) de actividad consent-aware (batch). Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /telemetry/activity-events` la atiende `TelemetryEventsController.captureActivityEvents` (src/modules/telemetry/controllers/telemetry-events.controller.ts:45). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CaptureActivityEventsDto` (17 campos, 2 obligatorios). Delega en `TelemetryEventsService.captureActivityEvents`. Crea filas en telemetry.session_journeys, telemetry.user_activity_event_properties, telemetry.user_activity_events. Actualiza telemetry.session_journeys. Lee iam.sessions, telemetry.activity_event_schema_definitions, telemetry.analytics_subjects, telemetry.session_journeys, telemetry.tracking_consents, telemetry.user_activity_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/telemetry/controllers/telemetry-events.controller.ts:45` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.sessions` | LEE | LEE | DIRECTA | TelemetryEventsController.captureActivityEvents → TelemetryEventsService.captureActivityEvents → TelemetryEventsService.actorSessionId → ActorSessionsRepository.findIdByToken | `src/modules/telemetry/repositories/actor-sessions.repository.ts:28` |
| `telemetry.activity_event_schema_definitions` | LEE | LEE | DIRECTA | TelemetryEventsController.captureActivityEvents → TelemetryEventsService.captureActivityEvents → ActivityEventSchemaDefinitionsRepository.findById | `src/modules/telemetry/repositories/activity-event-schema-definitions.repository.ts:67` |
| `telemetry.analytics_subjects` | LEE | LEE | DIRECTA | TelemetryEventsController.captureActivityEvents → TelemetryEventsService.captureActivityEvents → TelemetryEventsService.assertOwnedSubject → AnalyticsSubjectsRepository.findById | `src/modules/telemetry/repositories/analytics-subjects.repository.ts:40` |
| `telemetry.session_journeys` | ESCRIBE | ACTUALIZA | POR_TIPO | TelemetryEventsController.captureActivityEvents → TelemetryEventsService.captureActivityEvents | `src/modules/telemetry/services/telemetry-events.service.ts:243` |
| `telemetry.session_journeys` | ESCRIBE | CREA | DIRECTA | TelemetryEventsController.captureActivityEvents → TelemetryEventsService.captureActivityEvents → TelemetryEventsService.openJourney → SessionJourneysRepository.create | `src/modules/telemetry/repositories/session-journeys.repository.ts:72` |
| `telemetry.session_journeys` | LEE | LEE | DIRECTA | TelemetryEventsController.captureActivityEvents → TelemetryEventsService.captureActivityEvents → TelemetryEventsService.assertOwnedJourney → SessionJourneysRepository.findById | `src/modules/telemetry/repositories/session-journeys.repository.ts:48` |
| `telemetry.tracking_consents` | LEE | LEE | DIRECTA | TelemetryEventsController.captureActivityEvents → TelemetryEventsService.captureActivityEvents → TelemetryEventsService.consentAllows → TrackingConsentsRepository.findLatest | `src/modules/telemetry/repositories/tracking-consents.repository.ts:65` |
| `telemetry.user_activity_event_properties` | ESCRIBE | CREA | DIRECTA | TelemetryEventsController.captureActivityEvents → TelemetryEventsService.captureActivityEvents → UserActivityEventPropertiesRepository.create | `src/modules/telemetry/repositories/user-activity-event-properties.repository.ts:63` |
| `telemetry.user_activity_events` | ESCRIBE | CREA | DIRECTA | TelemetryEventsController.captureActivityEvents → TelemetryEventsService.captureActivityEvents → UserActivityEventsRepository.create | `src/modules/telemetry/repositories/user-activity-events.repository.ts:106` |
| `telemetry.user_activity_events` | LEE | LEE | DIRECTA | TelemetryEventsController.captureActivityEvents → TelemetryEventsService.captureActivityEvents → UserActivityEventsRepository.findByIdempotencyKey | `src/modules/telemetry/repositories/user-activity-events.repository.ts:84` |

### Cuerpo — DTO `CaptureActivityEventsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `events` | `array<ActivityEventItemDto>` | Sí | mínimo 1 elemento(s); máximo 500 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(500)` `@ValidateNested({ each: true })` `@Type(() => ActivityEventItemDto)` | Lote de eventos de actividad | `src/modules/telemetry/dto/activity-event.dto.ts:208` |
| `events[].eventSchemaDefinitionId` | `string` | Sí | formato uuid | `@IsUUID()` | Esquema de evento activo | `src/modules/telemetry/dto/activity-event.dto.ts:88` |
| `events[].eventName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Nombre del evento (override del esquema) | `src/modules/telemetry/dto/activity-event.dto.ts:100` |
| `events[].eventIdempotencyKey` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Clave de idempotencia del evento | `src/modules/telemetry/dto/activity-event.dto.ts:112` |
| `events[].analyticsSubjectId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sujeto de analítica pseudónimo; debe ser del usuario autenticado | `src/modules/telemetry/dto/activity-event.dto.ts:124` |
| `events[].sessionJourneyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Journey de sesión existente a enlazar; debe ser de una sesión del usuario autenticado | `src/modules/telemetry/dto/activity-event.dto.ts:136` |
| `events[].portalTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de portal (concept id) | `src/modules/telemetry/dto/activity-event.dto.ts:147` |
| `events[].routeTemplate` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Plantilla de ruta (sin ids en claro) | `src/modules/telemetry/dto/activity-event.dto.ts:159` |
| `events[].occurredAt` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Instante de ocurrencia (ISO-8601) | `src/modules/telemetry/dto/activity-event.dto.ts:167` |
| `events[].correlationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Correlation id | `src/modules/telemetry/dto/activity-event.dto.ts:175` |
| `events[].properties` | `array<ActivityEventPropertyDto>` | No | máximo 25 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(25)` `@ValidateNested({ each: true })` `@Type(() => ActivityEventPropertyDto)` | Propiedades declaradas por el esquema del evento (máximo 25, el tope del proveedor) | `src/modules/telemetry/dto/activity-event.dto.ts:191` |
| `events[].properties[].propertyName` | `string` | No | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Nombre de la propiedad | `src/modules/telemetry/dto/activity-event.dto.ts:29` |
| `events[].properties[].valueType` | `string` | No | valores: STRING, NUMBER, BOOLEAN | `@IsOptional()` `@IsIn(['STRING', 'NUMBER', 'BOOLEAN'])` | Tipo de valor | `src/modules/telemetry/dto/activity-event.dto.ts:40` |
| `events[].properties[].valueString` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Valor string | `src/modules/telemetry/dto/activity-event.dto.ts:49` |
| `events[].properties[].valueNumber` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Valor numérico | `src/modules/telemetry/dto/activity-event.dto.ts:57` |
| `events[].properties[].valueBoolean` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Valor booleano | `src/modules/telemetry/dto/activity-event.dto.ts:65` |
| `events[].properties[].dataClassificationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ignorado: la clasificación del dato la fija el servidor desde el esquema del evento | `src/modules/telemetry/dto/activity-event.dto.ts:78` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "events": [
    {
      "eventSchemaDefinitionId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "events": [
    {
      "eventSchemaDefinitionId": "00000000-0000-4000-8000-000000000001",
      "eventName": "Nombre de ejemplo",
      "eventIdempotencyKey": "valor-ejemplo",
      "analyticsSubjectId": "00000000-0000-4000-8000-000000000001",
      "sessionJourneyId": "00000000-0000-4000-8000-000000000001",
      "portalTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "routeTemplate": "valor-ejemplo",
      "occurredAt": "valor-ejemplo",
      "correlationId": "00000000-0000-4000-8000-000000000001",
      "properties": [
        {
          "propertyName": "Nombre de ejemplo",
          "valueType": "STRING",
          "valueString": "valor-ejemplo",
          "valueNumber": 1,
          "valueBoolean": true,
          "dataClassificationConceptId": "00000000-0000-4000-8000-000000000001"
        }
      ]
    }
  ]
}
```

</details>

### Respuesta — `Promise<ActivityEventsResponseDto>` · DTO `ActivityEventsResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `inserted` | `number` | Sí | — | — | Eventos insertados (consent-aware) | `src/modules/telemetry/dto/activity-event.dto.ts:217` |
| `skipped` | `number` | Sí | — | — | Eventos descartados por falta de consentimiento o reenvío | `src/modules/telemetry/dto/activity-event.dto.ts:225` |
| `eventIds` | `array<string>` | Sí | — | — | Ids de los eventos insertados | `src/modules/telemetry/dto/activity-event.dto.ts:231` |
| `sessionJourneyId` | `string` | No | formato uuid | — | Journey de sesión afectado | `src/modules/telemetry/dto/activity-event.dto.ts:240` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Esquema de evento no encontrado; ResourceNotFoundException: Sujeto de analítica no encontrado; ResourceNotFoundException: Journey de sesión no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión autenticada no está registrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.UNPROCESSABLE_ENTITY} |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryEventsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /telemetry/analytics-subjects

- **Origen:** CONTRATO
- **Nombre:** Provisionar sujeto de analítica pseudónimo
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryConsentController.provisionSubject` — `src/modules/telemetry/controllers/telemetry-consent.controller.ts:90`

### Qué es y para qué sirve (negocio)

Provisionar sujeto de analítica pseudónimo. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /telemetry/analytics-subjects` la atiende `TelemetryConsentController.provisionSubject` (src/modules/telemetry/controllers/telemetry-consent.controller.ts:90). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ProvisionAnalyticsSubjectDto` (5 campos, 0 obligatorios). Delega en `TelemetryConsentService.provisionSubject`. Crea filas en telemetry.analytics_subjects. Lee telemetry.analytics_subjects.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.analytics_subjects` | ESCRIBE | CREA | DIRECTA | TelemetryConsentController.provisionSubject → TelemetryConsentService.provisionSubject → AnalyticsSubjectsRepository.create | `src/modules/telemetry/repositories/analytics-subjects.repository.ts:85` |
| `telemetry.analytics_subjects` | LEE | LEE | DIRECTA | TelemetryConsentController.provisionSubject → TelemetryConsentService.provisionSubject → AnalyticsSubjectsRepository.findByKey | `src/modules/telemetry/repositories/analytics-subjects.repository.ts:54` |

### Cuerpo — DTO `ProvisionAnalyticsSubjectDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pseudonymousSubjectKey` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Clave pseudónima (HMAC). Si se omite se genera de forma determinista. | `src/modules/telemetry/dto/analytics-subject.dto.ts:24` |
| `keyVersion` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Versión de la clave de derivación | `src/modules/telemetry/dto/analytics-subject.dto.ts:36` |
| `userId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Usuario asociado (opcional) | `src/modules/telemetry/dto/analytics-subject.dto.ts:47` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil de paciente asociado (opcional) | `src/modules/telemetry/dto/analytics-subject.dto.ts:58` |
| `createdFromConsentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Consentimiento que originó el sujeto | `src/modules/telemetry/dto/analytics-subject.dto.ts:69` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "pseudonymousSubjectKey": "valor-ejemplo",
  "keyVersion": 1,
  "userId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "createdFromConsentId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<AnalyticsSubjectResponseDto>` · DTO `AnalyticsSubjectResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/telemetry/dto/analytics-subject.dto.ts:78` |
| `pseudonymousSubjectKey` | `string` | Sí | — | — | Clave pseudónima del sujeto | `src/modules/telemetry/dto/analytics-subject.dto.ts:84` |
| `keyVersion` | `number` | No | — | — | Valor de key version mantenido por la instancia. | `src/modules/telemetry/dto/analytics-subject.dto.ts:90` |
| `reused` | `boolean` | Sí | — | — | true si el sujeto ya existía (idempotente) | `src/modules/telemetry/dto/analytics-subject.dto.ts:96` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/telemetry/dto/analytics-subject.dto.ts:102` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-consent.controller.spec.ts:47` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryConsentController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /telemetry/client-contexts

- **Origen:** CONTRATO
- **Nombre:** Registrar contexto de cliente/dispositivo + journey
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryEventsController.captureClientContext` — `src/modules/telemetry/controllers/telemetry-events.controller.ts:62`

### Qué es y para qué sirve (negocio)

Registrar contexto de cliente/dispositivo + journey. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /telemetry/client-contexts` la atiende `TelemetryEventsController.captureClientContext` (src/modules/telemetry/controllers/telemetry-events.controller.ts:62). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateClientContextDto` (17 campos, 0 obligatorios). Delega en `TelemetryEventsService.captureClientContext`. Crea filas en telemetry.client_contexts, telemetry.session_journeys. Lee iam.sessions, telemetry.analytics_subjects, telemetry.session_journeys.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/telemetry/controllers/telemetry-events.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.sessions` | LEE | LEE | DIRECTA | TelemetryEventsController.captureClientContext → TelemetryEventsService.captureClientContext → TelemetryEventsService.actorSessionId → ActorSessionsRepository.findIdByToken | `src/modules/telemetry/repositories/actor-sessions.repository.ts:28` |
| `telemetry.analytics_subjects` | LEE | LEE | DIRECTA | TelemetryEventsController.captureClientContext → TelemetryEventsService.captureClientContext → TelemetryEventsService.assertOwnedSubject → AnalyticsSubjectsRepository.findById | `src/modules/telemetry/repositories/analytics-subjects.repository.ts:40` |
| `telemetry.client_contexts` | ESCRIBE | CREA | DIRECTA | TelemetryEventsController.captureClientContext → TelemetryEventsService.captureClientContext → ClientContextsRepository.create | `src/modules/telemetry/repositories/client-contexts.repository.ts:103` |
| `telemetry.session_journeys` | ESCRIBE | CREA | DIRECTA | TelemetryEventsController.captureClientContext → TelemetryEventsService.captureClientContext → TelemetryEventsService.openJourney → SessionJourneysRepository.create | `src/modules/telemetry/repositories/session-journeys.repository.ts:72` |
| `telemetry.session_journeys` | LEE | LEE | DIRECTA | TelemetryEventsController.captureClientContext → TelemetryEventsService.captureClientContext → TelemetryEventsService.assertOwnedJourney → SessionJourneysRepository.findById | `src/modules/telemetry/repositories/session-journeys.repository.ts:48` |

### Cuerpo — DTO `CreateClientContextDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sessionJourneyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Journey de sesión existente a enlazar; debe ser de una sesión del usuario autenticado. Si falta, se usa el journey abierto de la sesión autenticada | `src/modules/telemetry/dto/client-context.dto.ts:23` |
| `analyticsSubjectId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sujeto de analítica; debe ser del usuario autenticado | `src/modules/telemetry/dto/client-context.dto.ts:34` |
| `portalTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de portal (concept id) | `src/modules/telemetry/dto/client-context.dto.ts:45` |
| `deviceTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de dispositivo (concept id) | `src/modules/telemetry/dto/client-context.dto.ts:56` |
| `osFamilyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Familia de SO (concept id) | `src/modules/telemetry/dto/client-context.dto.ts:67` |
| `browserFamilyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Familia de navegador (concept id) | `src/modules/telemetry/dto/client-context.dto.ts:78` |
| `appVersion` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/telemetry/dto/client-context.dto.ts:87` |
| `screenClass` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/telemetry/dto/client-context.dto.ts:96` |
| `viewportBucket` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/telemetry/dto/client-context.dto.ts:105` |
| `locale` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | — | `src/modules/telemetry/dto/client-context.dto.ts:114` |
| `timezoneOffsetMinutes` | `number` | No | — | `@IsOptional()` `@IsInt()` | — | `src/modules/telemetry/dto/client-context.dto.ts:122` |
| `countryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | País (concept id) | `src/modules/telemetry/dto/client-context.dto.ts:130` |
| `regionCoarse` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/telemetry/dto/client-context.dto.ts:139` |
| `ipPrefixHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash del prefijo de IP | `src/modules/telemetry/dto/client-context.dto.ts:151` |
| `userAgentHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash del user agent | `src/modules/telemetry/dto/client-context.dto.ts:160` |
| `isBot` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marcado como bot | `src/modules/telemetry/dto/client-context.dto.ts:168` |
| `dataClassificationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Clasificación de dato (concept id) | `src/modules/telemetry/dto/client-context.dto.ts:179` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "sessionJourneyId": "00000000-0000-4000-8000-000000000001",
  "analyticsSubjectId": "00000000-0000-4000-8000-000000000001",
  "portalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "deviceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "osFamilyConceptId": "00000000-0000-4000-8000-000000000001",
  "browserFamilyConceptId": "00000000-0000-4000-8000-000000000001",
  "appVersion": "valor-ejemplo",
  "screenClass": "valor-ejemplo",
  "viewportBucket": "valor-ejemplo",
  "locale": "es-BO",
  "timezoneOffsetMinutes": 1,
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "regionCoarse": "valor-ejemplo",
  "ipPrefixHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "userAgentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "isBot": true,
  "dataClassificationConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ClientContextResponseDto>` · DTO `ClientContextResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/telemetry/dto/client-context.dto.ts:188` |
| `sessionJourneyId` | `string` | Sí | formato uuid | — | Journey de sesión creado o enlazado | `src/modules/telemetry/dto/client-context.dto.ts:197` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/telemetry/dto/client-context.dto.ts:203` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sujeto de analítica no encontrado; ResourceNotFoundException: Journey de sesión no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La sesión autenticada no está registrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryEventsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /telemetry/conversion-events

- **Origen:** CONTRATO
- **Nombre:** Registrar evento de conversión con atribución
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryEventsController.recordConversion` — `src/modules/telemetry/controllers/telemetry-events.controller.ts:97`

### Qué es y para qué sirve (negocio)

Registrar evento de conversión con atribución. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /telemetry/conversion-events` la atiende `TelemetryEventsController.recordConversion` (src/modules/telemetry/controllers/telemetry-events.controller.ts:97). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateConversionEventDto` (5 campos, 2 obligatorios). Delega en `TelemetryEventsService.recordConversion`. Crea filas en telemetry.conversion_events. Lee iam.sessions, telemetry.analytics_subjects, telemetry.conversion_events, telemetry.funnel_definitions, telemetry.session_journeys, telemetry.user_activity_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/telemetry/controllers/telemetry-events.controller.ts:97` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.sessions` | LEE | LEE | DIRECTA | TelemetryEventsController.recordConversion → TelemetryEventsService.recordConversion → TelemetryEventsService.assertOwnedJourney → ActorSessionsRepository.belongsToUser | `src/modules/telemetry/repositories/actor-sessions.repository.ts:45` |
| `telemetry.analytics_subjects` | LEE | LEE | DIRECTA | TelemetryEventsController.recordConversion → TelemetryEventsService.recordConversion → TelemetryEventsService.assertOwnedSubject → AnalyticsSubjectsRepository.findById | `src/modules/telemetry/repositories/analytics-subjects.repository.ts:40` |
| `telemetry.conversion_events` | ESCRIBE | CREA | DIRECTA | TelemetryEventsController.recordConversion → TelemetryEventsService.recordConversion → ConversionEventsRepository.create | `src/modules/telemetry/repositories/conversion-events.repository.ts:58` |
| `telemetry.conversion_events` | LEE | LEE | DIRECTA | TelemetryEventsController.recordConversion → TelemetryEventsService.recordConversion → ConversionEventsRepository.findExisting | `src/modules/telemetry/repositories/conversion-events.repository.ts:43` |
| `telemetry.funnel_definitions` | LEE | LEE | DIRECTA | TelemetryEventsController.recordConversion → TelemetryEventsService.recordConversion → FunnelDefinitionsRepository.findById | `src/modules/telemetry/repositories/funnel-definitions.repository.ts:48` |
| `telemetry.session_journeys` | LEE | LEE | DIRECTA | TelemetryEventsController.recordConversion → TelemetryEventsService.recordConversion → TelemetryEventsService.assertOwnedJourney → SessionJourneysRepository.findById | `src/modules/telemetry/repositories/session-journeys.repository.ts:48` |
| `telemetry.user_activity_events` | LEE | LEE | DIRECTA | TelemetryEventsController.recordConversion → TelemetryEventsService.recordConversion → TelemetryEventsService.assertOwnedEvent → UserActivityEventsRepository.findById | `src/modules/telemetry/repositories/user-activity-events.repository.ts:95` |

### Cuerpo — DTO `CreateConversionEventDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `funnelDefinitionId` | `string` | Sí | formato uuid | `@IsUUID()` | Funnel activo alcanzado | `src/modules/telemetry/dto/conversion-event.dto.ts:11` |
| `analyticsSubjectId` | `string` | Sí | formato uuid | `@IsUUID()` | Sujeto de analítica que convierte | `src/modules/telemetry/dto/conversion-event.dto.ts:21` |
| `sessionJourneyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Journey de sesión asociado | `src/modules/telemetry/dto/conversion-event.dto.ts:32` |
| `completionEventId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Evento de actividad que completó el último paso | `src/modules/telemetry/dto/conversion-event.dto.ts:43` |
| `attributionJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Datos de atribución (JSON) | `src/modules/telemetry/dto/conversion-event.dto.ts:51` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "funnelDefinitionId": "00000000-0000-4000-8000-000000000001",
  "analyticsSubjectId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "funnelDefinitionId": "00000000-0000-4000-8000-000000000001",
  "analyticsSubjectId": "00000000-0000-4000-8000-000000000001",
  "sessionJourneyId": "00000000-0000-4000-8000-000000000001",
  "completionEventId": "00000000-0000-4000-8000-000000000001",
  "attributionJson": {}
}
```

</details>

### Respuesta — `Promise<ConversionEventResponseDto>` · DTO `ConversionEventResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/telemetry/dto/conversion-event.dto.ts:60` |
| `funnelDefinitionId` | `string` | Sí | formato uuid | — | Identificador asociado a funnel definition. | `src/modules/telemetry/dto/conversion-event.dto.ts:66` |
| `analyticsSubjectId` | `string` | Sí | formato uuid | — | Identificador asociado a analytics subject. | `src/modules/telemetry/dto/conversion-event.dto.ts:72` |
| `convertedAt` | `string` | Sí | formato date-time | — | Valor de converted at mantenido por la instancia. | `src/modules/telemetry/dto/conversion-event.dto.ts:78` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Funnel no encontrado; ResourceNotFoundException: Sujeto de analítica no encontrado; ResourceNotFoundException: Journey de sesión no encontrado; ResourceNotFoundException: Evento de actividad no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryEventsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /telemetry/disclosure-acceptances

- **Origen:** CONTRATO
- **Nombre:** Registrar aceptación de disclosure por usuario/sesión
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryConsentController.acceptDisclosure` — `src/modules/telemetry/controllers/telemetry-consent.controller.ts:46`

### Qué es y para qué sirve (negocio)

Registrar aceptación de disclosure por usuario/sesión. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /telemetry/disclosure-acceptances` la atiende `TelemetryConsentController.acceptDisclosure` (src/modules/telemetry/controllers/telemetry-consent.controller.ts:46). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateDisclosureAcceptanceDto` (4 campos, 1 obligatorio). Delega en `TelemetryConsentService.acceptDisclosure`. Crea filas en telemetry.tracking_disclosure_acceptances. Lee telemetry.tracking_disclosure_acceptances, telemetry.tracking_disclosure_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.tracking_disclosure_acceptances` | ESCRIBE | CREA | DIRECTA | TelemetryConsentController.acceptDisclosure → TelemetryConsentService.acceptDisclosure → TrackingDisclosureAcceptancesRepository.create | `src/modules/telemetry/repositories/tracking-disclosure-acceptances.repository.ts:65` |
| `telemetry.tracking_disclosure_acceptances` | LEE | LEE | DIRECTA | TelemetryConsentController.acceptDisclosure → TelemetryConsentService.acceptDisclosure → TrackingDisclosureAcceptancesRepository.findExisting | `src/modules/telemetry/repositories/tracking-disclosure-acceptances.repository.ts:47` |
| `telemetry.tracking_disclosure_versions` | LEE | LEE | DIRECTA | TelemetryConsentController.acceptDisclosure → TelemetryConsentService.acceptDisclosure → TrackingDisclosureVersionsRepository.findById | `src/modules/telemetry/repositories/tracking-disclosure-versions.repository.ts:55` |

### Cuerpo — DTO `CreateDisclosureAcceptanceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `trackingDisclosureVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión de disclosure aceptada | `src/modules/telemetry/dto/disclosure-acceptance.dto.ts:14` |
| `sessionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sesión asociada | `src/modules/telemetry/dto/disclosure-acceptance.dto.ts:22` |
| `ipPrefixHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash del prefijo de IP (sin PII en claro) | `src/modules/telemetry/dto/disclosure-acceptance.dto.ts:34` |
| `userAgentHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash del user agent (sin PII en claro) | `src/modules/telemetry/dto/disclosure-acceptance.dto.ts:46` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "trackingDisclosureVersionId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "trackingDisclosureVersionId": "00000000-0000-4000-8000-000000000001",
  "sessionId": "00000000-0000-4000-8000-000000000001",
  "ipPrefixHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "userAgentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

</details>

### Respuesta — `Promise<DisclosureAcceptanceResponseDto>` · DTO `DisclosureAcceptanceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/telemetry/dto/disclosure-acceptance.dto.ts:55` |
| `trackingDisclosureVersionId` | `string` | Sí | formato uuid | — | Identificador asociado a tracking disclosure version. | `src/modules/telemetry/dto/disclosure-acceptance.dto.ts:61` |
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/telemetry/dto/disclosure-acceptance.dto.ts:67` |
| `acceptedAt` | `string` | Sí | formato date-time | — | Valor de accepted at mantenido por la instancia. | `src/modules/telemetry/dto/disclosure-acceptance.dto.ts:73` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Versión de disclosure no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-consent.controller.spec.ts:33` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryConsentController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /telemetry/disclosure-versions

- **Origen:** CONTRATO
- **Nombre:** Publicar versión de disclosure de tracking
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryGovernanceController.publishDisclosure` — `src/modules/telemetry/controllers/telemetry-governance.controller.ts:74`

### Qué es y para qué sirve (negocio)

Publicar versión de disclosure de tracking. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /telemetry/disclosure-versions` la atiende `TelemetryGovernanceController.publishDisclosure` (src/modules/telemetry/controllers/telemetry-governance.controller.ts:74). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateDisclosureVersionDto` (5 campos, 1 obligatorio). Delega en `TelemetryGovernanceService.publishDisclosure`. Crea filas en telemetry.tracking_disclosure_versions. Actualiza telemetry.tracking_disclosure_versions. Lee telemetry.tracking_disclosure_versions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/telemetry/controllers/telemetry-governance.controller.ts:74` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.tracking_disclosure_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | TelemetryGovernanceController.publishDisclosure → TelemetryGovernanceService.publishDisclosure | `src/modules/telemetry/services/telemetry-governance.service.ts:223` |
| `telemetry.tracking_disclosure_versions` | ESCRIBE | CREA | DIRECTA | TelemetryGovernanceController.publishDisclosure → TelemetryGovernanceService.publishDisclosure → TrackingDisclosureVersionsRepository.create | `src/modules/telemetry/repositories/tracking-disclosure-versions.repository.ts:99` |
| `telemetry.tracking_disclosure_versions` | LEE | LEE | DIRECTA | TelemetryGovernanceController.publishDisclosure → TelemetryGovernanceService.publishDisclosure → TrackingDisclosureVersionsRepository.findByDocumentVersion | `src/modules/telemetry/repositories/tracking-disclosure-versions.repository.ts:71` |

### Cuerpo — DTO `CreateDisclosureVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `documentCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del documento de disclosure | `src/modules/telemetry/dto/disclosure-version.dto.ts:22` |
| `versionNumber` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Número de versión | `src/modules/telemetry/dto/disclosure-version.dto.ts:31` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Jurisdicción (concept id) | `src/modules/telemetry/dto/disclosure-version.dto.ts:42` |
| `fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Documento en object storage (file id) | `src/modules/telemetry/dto/disclosure-version.dto.ts:53` |
| `contentHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash del contenido del documento | `src/modules/telemetry/dto/disclosure-version.dto.ts:65` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "documentCode": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "documentCode": "CODIGO_EJEMPLO",
  "versionNumber": 1,
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "fileId": "00000000-0000-4000-8000-000000000001",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

</details>

### Respuesta — `Promise<DisclosureVersionResponseDto>` · DTO `DisclosureVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/telemetry/dto/disclosure-version.dto.ts:74` |
| `documentCode` | `string` | Sí | — | — | Valor de document code mantenido por la instancia. | `src/modules/telemetry/dto/disclosure-version.dto.ts:80` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/telemetry/dto/disclosure-version.dto.ts:86` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/telemetry/dto/disclosure-version.dto.ts:92` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/telemetry/dto/disclosure-version.dto.ts:98` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe esa versión del documento |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-governance.controller.spec.ts:50` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /telemetry/event-schemas

- **Origen:** CONTRATO
- **Nombre:** Registrar esquema de evento de actividad (versionado)
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryGovernanceController.registerEventSchema` — `src/modules/telemetry/controllers/telemetry-governance.controller.ts:55`

### Qué es y para qué sirve (negocio)

Registrar esquema de evento de actividad (versionado). Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /telemetry/event-schemas` la atiende `TelemetryGovernanceController.registerEventSchema` (src/modules/telemetry/controllers/telemetry-governance.controller.ts:55). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateEventSchemaDto` (8 campos, 2 obligatorios). Delega en `TelemetryGovernanceService.registerEventSchema`. Crea filas en telemetry.activity_event_schema_definitions. Lee telemetry.activity_event_schema_definitions, telemetry.tracking_purpose_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/telemetry/controllers/telemetry-governance.controller.ts:55` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.activity_event_schema_definitions` | ESCRIBE | CREA | DIRECTA | TelemetryGovernanceController.registerEventSchema → TelemetryGovernanceService.registerEventSchema → ActivityEventSchemaDefinitionsRepository.create | `src/modules/telemetry/repositories/activity-event-schema-definitions.repository.ts:100` |
| `telemetry.activity_event_schema_definitions` | LEE | LEE | DIRECTA | TelemetryGovernanceController.registerEventSchema → TelemetryGovernanceService.registerEventSchema → ActivityEventSchemaDefinitionsRepository.findByNameVersion | `src/modules/telemetry/repositories/activity-event-schema-definitions.repository.ts:83` |
| `telemetry.tracking_purpose_definitions` | LEE | LEE | DIRECTA | TelemetryGovernanceController.registerEventSchema → TelemetryGovernanceService.registerEventSchema → TrackingPurposeDefinitionsRepository.findById | `src/modules/telemetry/repositories/tracking-purpose-definitions.repository.ts:71` |

### Cuerpo — DTO `CreateEventSchemaDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `eventName` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Nombre del evento de actividad | `src/modules/telemetry/dto/event-schema.dto.ts:24` |
| `schemaVersion` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Versión del esquema | `src/modules/telemetry/dto/event-schema.dto.ts:33` |
| `purposeDefinitionId` | `string` | Sí | formato uuid | `@IsUUID()` | Propósito de tracking asociado (activo) | `src/modules/telemetry/dto/event-schema.dto.ts:43` |
| `portalTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de portal (concept id) | `src/modules/telemetry/dto/event-schema.dto.ts:54` |
| `propertySchemaJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | JSON Schema de propiedades permitidas | `src/modules/telemetry/dto/event-schema.dto.ts:62` |
| `prohibitedPropertyPatternsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Patrones de propiedades prohibidas (PHI/free-text) | `src/modules/telemetry/dto/event-schema.dto.ts:72` |
| `piiClassificationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Clasificación PII (concept id) | `src/modules/telemetry/dto/event-schema.dto.ts:83` |
| `phiAllowed` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | PHI permitido en el esquema | `src/modules/telemetry/dto/event-schema.dto.ts:94` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "eventName": "Nombre de ejemplo",
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "eventName": "Nombre de ejemplo",
  "schemaVersion": 1,
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "portalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "propertySchemaJson": {},
  "prohibitedPropertyPatternsJson": {},
  "piiClassificationConceptId": "00000000-0000-4000-8000-000000000001",
  "phiAllowed": false
}
```

</details>

### Respuesta — `Promise<EventSchemaResponseDto>` · DTO `EventSchemaResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/telemetry/dto/event-schema.dto.ts:103` |
| `eventName` | `string` | Sí | — | — | Valor de event name mantenido por la instancia. | `src/modules/telemetry/dto/event-schema.dto.ts:109` |
| `schemaVersion` | `number` | Sí | — | — | Valor de schema version mantenido por la instancia. | `src/modules/telemetry/dto/event-schema.dto.ts:115` |
| `purposeDefinitionId` | `string` | Sí | formato uuid | — | Identificador asociado a purpose definition. | `src/modules/telemetry/dto/event-schema.dto.ts:121` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/telemetry/dto/event-schema.dto.ts:127` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/telemetry/dto/event-schema.dto.ts:133` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Propósito de tracking no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe un esquema con ese nombre y versión |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El propósito de tracking no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-governance.controller.spec.ts:43` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /telemetry/funnels

- **Origen:** CONTRATO
- **Nombre:** Definir funnel y sus pasos
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryGovernanceController.defineFunnel` — `src/modules/telemetry/controllers/telemetry-governance.controller.ts:91`

### Qué es y para qué sirve (negocio)

Definir funnel y sus pasos. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /telemetry/funnels` la atiende `TelemetryGovernanceController.defineFunnel` (src/modules/telemetry/controllers/telemetry-governance.controller.ts:91). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateFunnelDto` (9 campos, 5 obligatorios). Delega en `TelemetryGovernanceService.defineFunnel`. Crea filas en telemetry.funnel_definitions, telemetry.funnel_steps. Lee telemetry.activity_event_schema_definitions, telemetry.funnel_definitions, telemetry.tracking_purpose_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/telemetry/controllers/telemetry-governance.controller.ts:91` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.activity_event_schema_definitions` | LEE | LEE | DIRECTA | TelemetryGovernanceController.defineFunnel → TelemetryGovernanceService.defineFunnel → ActivityEventSchemaDefinitionsRepository.findById | `src/modules/telemetry/repositories/activity-event-schema-definitions.repository.ts:67` |
| `telemetry.funnel_definitions` | ESCRIBE | CREA | DIRECTA | TelemetryGovernanceController.defineFunnel → TelemetryGovernanceService.defineFunnel → FunnelDefinitionsRepository.create | `src/modules/telemetry/repositories/funnel-definitions.repository.ts:74` |
| `telemetry.funnel_definitions` | LEE | LEE | DIRECTA | TelemetryGovernanceController.defineFunnel → TelemetryGovernanceService.defineFunnel → FunnelDefinitionsRepository.findByCode | `src/modules/telemetry/repositories/funnel-definitions.repository.ts:62` |
| `telemetry.funnel_steps` | ESCRIBE | CREA | DIRECTA | TelemetryGovernanceController.defineFunnel → TelemetryGovernanceService.defineFunnel → FunnelStepsRepository.create | `src/modules/telemetry/repositories/funnel-steps.repository.ts:36` |
| `telemetry.tracking_purpose_definitions` | LEE | LEE | DIRECTA | TelemetryGovernanceController.defineFunnel → TelemetryGovernanceService.defineFunnel → TrackingPurposeDefinitionsRepository.findById | `src/modules/telemetry/repositories/tracking-purpose-definitions.repository.ts:71` |

### Cuerpo — DTO `CreateFunnelDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `funnelCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código único del funnel | `src/modules/telemetry/dto/funnel.dto.ts:57` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Nombre del funnel | `src/modules/telemetry/dto/funnel.dto.ts:65` |
| `purposeDefinitionId` | `string` | Sí | formato uuid | `@IsUUID()` | Propósito de tracking activo | `src/modules/telemetry/dto/funnel.dto.ts:72` |
| `portalTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de portal (concept id) | `src/modules/telemetry/dto/funnel.dto.ts:83` |
| `versionNumber` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Número de versión | `src/modules/telemetry/dto/funnel.dto.ts:92` |
| `steps` | `array<FunnelStepDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => FunnelStepDto)` | Pasos del funnel (>= 1) | `src/modules/telemetry/dto/funnel.dto.ts:105` |
| `steps[].stepNumber` | `number` | No | mínimo 1 | `@IsOptional()` `@IsInt()` `@Min(1)` | Número de paso (contiguo desde 1). Si se omite se asigna por orden. | `src/modules/telemetry/dto/funnel.dto.ts:28` |
| `steps[].eventSchemaDefinitionId` | `string` | Sí | formato uuid | `@IsUUID()` | Esquema de evento que cualifica el paso | `src/modules/telemetry/dto/funnel.dto.ts:38` |
| `steps[].qualificationRuleJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Regla de cualificación (JSON) | `src/modules/telemetry/dto/funnel.dto.ts:46` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "funnelCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "steps": [
    {
      "eventSchemaDefinitionId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "funnelCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "portalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "steps": [
    {
      "stepNumber": 1,
      "eventSchemaDefinitionId": "00000000-0000-4000-8000-000000000001",
      "qualificationRuleJson": {}
    }
  ]
}
```

</details>

### Respuesta — `Promise<FunnelResponseDto>` · DTO `FunnelResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/telemetry/dto/funnel.dto.ts:114` |
| `funnelCode` | `string` | Sí | — | — | Valor de funnel code mantenido por la instancia. | `src/modules/telemetry/dto/funnel.dto.ts:120` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/telemetry/dto/funnel.dto.ts:126` |
| `stepCount` | `number` | Sí | — | — | Número de pasos definidos | `src/modules/telemetry/dto/funnel.dto.ts:132` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/telemetry/dto/funnel.dto.ts:138` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/telemetry/dto/funnel.dto.ts:144` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Propósito de tracking no encontrado |
| 409 | `CONFLICT` | ConflictException: El código de funnel ya existe |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Esquema de evento de un paso no existe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-governance.controller.spec.ts:62` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /telemetry/onboarding-events

- **Origen:** CONTRATO
- **Nombre:** Captura eventos de telemetría de alta y avance en formularios de registro
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryOnboardingAnalyticsController.recordEvents` — `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:123`

### Qué es y para qué sirve (negocio)

Captura eventos de telemetría de alta y avance en formularios de registro. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /telemetry/onboarding-events` la atiende `TelemetryOnboardingAnalyticsController.recordEvents` (src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:123). Es una ruta pública: no exige token. Valida el cuerpo como `IngestOnboardingEventsDto` (11 campos, 6 obligatorios). Delega en `TelemetryOnboardingAnalyticsService.recordEvents`. No toca tablas relacionales: Los eventos del embudo de alta se acumulan sólo en la memoria del proceso (`events`); no hay fila en Postgres..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:123` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

No toca tablas relacionales: Los eventos del embudo de alta se acumulan sólo en la memoria del proceso (`events`); no hay fila en Postgres.. _(manual, 2026-10-25; fuente: `src/modules/telemetry/services/telemetry-onboarding-analytics.service.ts:19`)_

### Cuerpo — DTO `IngestOnboardingEventsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `events` | `array<OnboardingEventDto>` | Sí | máximo 200 elemento(s) | `@IsArray()` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => OnboardingEventDto)` | — | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:115` |
| `events[].eventType` | `string` | Sí | valores: start, step_view, field_interaction, field_error, abandon, complete | `@IsIn(ONBOARDING_EVENT_TYPES)` | — | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:57` |
| `events[].formType` | `string` | Sí | longitud máxima 40 | `@IsString()` `@MaxLength(40)` | — | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:62` |
| `events[].draftId` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:67` |
| `events[].stepIndex` | `number` | Sí | mínimo 0; máximo 100 | `@IsInt()` `@Min(0)` `@Max(100)` | — | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:73` |
| `events[].stepKey` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:79` |
| `events[].fieldKey` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:85` |
| `events[].interactionType` | `string` | No | valores: focus, blur, change, error | `@IsOptional()` `@IsIn(ONBOARDING_INTERACTION_TYPES)` | — | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:90` |
| `events[].errorCategory` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:96` |
| `events[].durationMs` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:102` |
| `events[].timestamp` | `string` | Sí | — | `@IsISO8601()` | — | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.ts:106` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "events": [
    {
      "eventType": "start",
      "formType": "valor-ejemplo",
      "draftId": "00000000-0000-4000-8000-000000000001",
      "stepIndex": 1,
      "timestamp": "valor-ejemplo"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "events": [
    {
      "eventType": "start",
      "formType": "valor-ejemplo",
      "draftId": "00000000-0000-4000-8000-000000000001",
      "stepIndex": 1,
      "stepKey": "valor-ejemplo",
      "fieldKey": "valor-ejemplo",
      "interactionType": "focus",
      "errorCategory": "valor-ejemplo",
      "durationMs": 1,
      "timestamp": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `{ ok: boolean }` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-onboarding-analytics.controller.spec.ts:18` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryOnboardingAnalyticsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /telemetry/session-journeys/{id}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar journey de sesión y consolidar métricas
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryEventsController.closeJourney` — `src/modules/telemetry/controllers/telemetry-events.controller.ts:113`

### Qué es y para qué sirve (negocio)

Cerrar journey de sesión y consolidar métricas. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /telemetry/session-journeys/{id}/close` la atiende `TelemetryEventsController.closeJourney` (src/modules/telemetry/controllers/telemetry-events.controller.ts:113). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CloseJourneyDto` (2 campos, 0 obligatorios). Delega en `TelemetryEventsService.closeJourney`. Actualiza telemetry.session_journeys. Lee iam.sessions, telemetry.session_journeys, telemetry.user_activity_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/telemetry/controllers/telemetry-events.controller.ts:113` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/telemetry/controllers/telemetry-events.controller.ts:113` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.sessions` | LEE | LEE | DIRECTA | TelemetryEventsController.closeJourney → TelemetryEventsService.closeJourney → TelemetryEventsService.assertOwnedJourney → ActorSessionsRepository.belongsToUser | `src/modules/telemetry/repositories/actor-sessions.repository.ts:45` |
| `telemetry.session_journeys` | ESCRIBE | ACTUALIZA | POR_TIPO | TelemetryEventsController.closeJourney → TelemetryEventsService.closeJourney | `src/modules/telemetry/services/telemetry-events.service.ts:515` |
| `telemetry.session_journeys` | LEE | LEE | DIRECTA | TelemetryEventsController.closeJourney → TelemetryEventsService.closeJourney → TelemetryEventsService.assertOwnedJourney → SessionJourneysRepository.findById | `src/modules/telemetry/repositories/session-journeys.repository.ts:48` |
| `telemetry.user_activity_events` | LEE | LEE | DIRECTA | TelemetryEventsController.closeJourney → TelemetryEventsService.closeJourney → TelemetryEventsService.assertOwnedEvent → UserActivityEventsRepository.findById | `src/modules/telemetry/repositories/user-activity-events.repository.ts:95` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CloseJourneyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `exitEventId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Evento de salida | `src/modules/telemetry/dto/session-journey.dto.ts:12` |
| `eventCount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Conteo final de eventos (si el worker lo consolida) | `src/modules/telemetry/dto/session-journey.dto.ts:23` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "exitEventId": "00000000-0000-4000-8000-000000000001",
  "eventCount": 1
}
```

</details>

### Respuesta — `Promise<JourneyResponseDto>` · DTO `JourneyResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/telemetry/dto/session-journey.dto.ts:32` |
| `journeyStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a journey status concept. | `src/modules/telemetry/dto/session-journey.dto.ts:38` |
| `endedAt` | `string` | No | formato date-time | — | Valor de ended at mantenido por la instancia. | `src/modules/telemetry/dto/session-journey.dto.ts:44` |
| `eventCount` | `number` | Sí | — | — | Valor de event count mantenido por la instancia. | `src/modules/telemetry/dto/session-journey.dto.ts:50` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Journey de sesión no encontrado; ResourceNotFoundException: Evento de actividad no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El journey ya está cerrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryEventsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /telemetry/tracking-consents

- **Origen:** CONTRATO
- **Nombre:** Otorgar consentimiento de tracking por propósito
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryConsentController.grantConsent` — `src/modules/telemetry/controllers/telemetry-consent.controller.ts:64`

### Qué es y para qué sirve (negocio)

Otorgar consentimiento de tracking por propósito. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /telemetry/tracking-consents` la atiende `TelemetryConsentController.grantConsent` (src/modules/telemetry/controllers/telemetry-consent.controller.ts:64). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateTrackingConsentDto` (4 campos, 1 obligatorio). Delega en `TelemetryConsentService.grantConsent`. Crea filas en telemetry.tracking_consents. Lee telemetry.tracking_purpose_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.tracking_consents` | ESCRIBE | CREA | DIRECTA | TelemetryConsentController.grantConsent → TelemetryConsentService.grantConsent → TrackingConsentsRepository.create | `src/modules/telemetry/repositories/tracking-consents.repository.ts:80` |
| `telemetry.tracking_purpose_definitions` | LEE | LEE | DIRECTA | TelemetryConsentController.grantConsent → TelemetryConsentService.grantConsent → TrackingPurposeDefinitionsRepository.findById | `src/modules/telemetry/repositories/tracking-purpose-definitions.repository.ts:71` |

### Cuerpo — DTO `CreateTrackingConsentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `purposeDefinitionId` | `string` | Sí | formato uuid | `@IsUUID()` | Propósito de tracking (requiere consentimiento) | `src/modules/telemetry/dto/tracking-consent.dto.ts:14` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Jurisdicción (concept id) | `src/modules/telemetry/dto/tracking-consent.dto.ts:25` |
| `consentVersion` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | Versión del consentimiento | `src/modules/telemetry/dto/tracking-consent.dto.ts:37` |
| `evidenceHash` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Hash de la evidencia de consentimiento | `src/modules/telemetry/dto/tracking-consent.dto.ts:49` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "consentVersion": "valor-ejemplo",
  "evidenceHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

</details>

### Respuesta — `Promise<TrackingConsentResponseDto>` · DTO `TrackingConsentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/telemetry/dto/tracking-consent.dto.ts:58` |
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/telemetry/dto/tracking-consent.dto.ts:64` |
| `purposeDefinitionId` | `string` | Sí | formato uuid | — | Identificador asociado a purpose definition. | `src/modules/telemetry/dto/tracking-consent.dto.ts:70` |
| `decisionConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a decision concept. | `src/modules/telemetry/dto/tracking-consent.dto.ts:76` |
| `grantedAt` | `string` | No | formato date-time | — | Valor de granted at mantenido por la instancia. | `src/modules/telemetry/dto/tracking-consent.dto.ts:82` |
| `withdrawnAt` | `string` | No | formato date-time | — | Valor de withdrawn at mantenido por la instancia. | `src/modules/telemetry/dto/tracking-consent.dto.ts:88` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Propósito de tracking no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El propósito no requiere consentimiento |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-consent.controller.spec.ts:40` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryConsentController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. POST /telemetry/tracking-consents/{id}/withdraw

- **Origen:** CONTRATO
- **Nombre:** Retirar consentimiento y desactivar sujeto (cascada)
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryConsentController.withdrawConsent` — `src/modules/telemetry/controllers/telemetry-consent.controller.ts:106`

### Qué es y para qué sirve (negocio)

Retirar consentimiento y desactivar sujeto (cascada). Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /telemetry/tracking-consents/{id}/withdraw` la atiende `TelemetryConsentController.withdrawConsent` (src/modules/telemetry/controllers/telemetry-consent.controller.ts:106). Exige sesión; el controlador no declara roles. Delega en `TelemetryConsentService.withdrawConsent`. Crea filas en telemetry.tracking_consents. Actualiza telemetry.analytics_subjects. Lee telemetry.analytics_subjects, telemetry.tracking_consents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:106` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.analytics_subjects` | ESCRIBE | ACTUALIZA | POR_TIPO | TelemetryConsentController.withdrawConsent → TelemetryConsentService.withdrawConsent | `src/modules/telemetry/services/telemetry-consent.service.ts:311` |
| `telemetry.analytics_subjects` | LEE | LEE | DIRECTA | TelemetryConsentController.withdrawConsent → TelemetryConsentService.withdrawConsent → AnalyticsSubjectsRepository.findActiveByConsent | `src/modules/telemetry/repositories/analytics-subjects.repository.ts:68` |
| `telemetry.tracking_consents` | ESCRIBE | CREA | DIRECTA | TelemetryConsentController.withdrawConsent → TelemetryConsentService.withdrawConsent → TrackingConsentsRepository.create | `src/modules/telemetry/repositories/tracking-consents.repository.ts:80` |
| `telemetry.tracking_consents` | LEE | LEE | DIRECTA | TelemetryConsentController.withdrawConsent → TelemetryConsentService.withdrawConsent → TrackingConsentsRepository.findById | `src/modules/telemetry/repositories/tracking-consents.repository.ts:56` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TrackingConsentResponseDto>` · DTO `TrackingConsentResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/telemetry/dto/tracking-consent.dto.ts:58` |
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/telemetry/dto/tracking-consent.dto.ts:64` |
| `purposeDefinitionId` | `string` | Sí | formato uuid | — | Identificador asociado a purpose definition. | `src/modules/telemetry/dto/tracking-consent.dto.ts:70` |
| `decisionConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a decision concept. | `src/modules/telemetry/dto/tracking-consent.dto.ts:76` |
| `grantedAt` | `string` | No | formato date-time | — | Valor de granted at mantenido por la instancia. | `src/modules/telemetry/dto/tracking-consent.dto.ts:82` |
| `withdrawnAt` | `string` | No | formato date-time | — | Valor de withdrawn at mantenido por la instancia. | `src/modules/telemetry/dto/tracking-consent.dto.ts:88` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Consentimiento no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No hay un consentimiento vigente que retirar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-consent.controller.spec.ts:53` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryConsentController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. GET /telemetry/tracking-consents/me

- **Origen:** CONTRATO
- **Nombre:** Estado vigente de mi consentimiento de tracking
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryConsentController.getMyConsent` — `src/modules/telemetry/controllers/telemetry-consent.controller.ts:80`

### Qué es y para qué sirve (negocio)

Estado vigente de mi consentimiento de tracking. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`GET /telemetry/tracking-consents/me` la atiende `TelemetryConsentController.getMyConsent` (src/modules/telemetry/controllers/telemetry-consent.controller.ts:80). Exige sesión; el controlador no declara roles. Delega en `TelemetryConsentService.getMyStatus`. Lee telemetry.tracking_consents.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/telemetry/controllers/telemetry-consent.controller.ts:80` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | purposeDefinitionId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.tracking_consents` | LEE | LEE | DIRECTA | TelemetryConsentController.getMyConsent → TelemetryConsentService.getMyStatus → TrackingConsentsRepository.findLatest | `src/modules/telemetry/repositories/tracking-consents.repository.ts:65` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `purposeDefinitionId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyTrackingConsentStatusDto>` · DTO `MyTrackingConsentStatusDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: GRANTED, WITHDRAWN, NONE | — | `GRANTED` si la última decisión es el otorgamiento, `WITHDRAWN` si es el retiro y `NONE` si nunca decidió. | `src/modules/telemetry/dto/tracking-consent.dto.ts:98` |
| `consentId` | `string` | No | formato uuid | — | Consentimiento que hay que pasar a `POST /telemetry/tracking-consents/:id/withdraw` para retirarlo. Sólo viene con `GRANTED`. | `src/modules/telemetry/dto/tracking-consent.dto.ts:105` |
| `purposeDefinitionId` | `string` | Sí | formato uuid | — | Propósito consultado. | `src/modules/telemetry/dto/tracking-consent.dto.ts:109` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryConsentController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /telemetry/tracking-purposes

- **Origen:** CONTRATO
- **Nombre:** Definir propósito de tracking y base legal
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryGovernanceController.definePurpose` — `src/modules/telemetry/controllers/telemetry-governance.controller.ts:38`

### Qué es y para qué sirve (negocio)

Definir propósito de tracking y base legal. Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /telemetry/tracking-purposes` la atiende `TelemetryGovernanceController.definePurpose` (src/modules/telemetry/controllers/telemetry-governance.controller.ts:38). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateTrackingPurposeDto` (8 campos, 2 obligatorios). Delega en `TelemetryGovernanceService.definePurpose`. Crea filas en telemetry.tracking_purpose_definitions. Lee telemetry.tracking_purpose_definitions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/telemetry/controllers/telemetry-governance.controller.ts:38` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `telemetry.tracking_purpose_definitions` | ESCRIBE | CREA | DIRECTA | TelemetryGovernanceController.definePurpose → TelemetryGovernanceService.definePurpose → TrackingPurposeDefinitionsRepository.create | `src/modules/telemetry/repositories/tracking-purpose-definitions.repository.ts:99` |
| `telemetry.tracking_purpose_definitions` | LEE | LEE | DIRECTA | TelemetryGovernanceController.definePurpose → TelemetryGovernanceService.definePurpose → TrackingPurposeDefinitionsRepository.findByCode | `src/modules/telemetry/repositories/tracking-purpose-definitions.repository.ts:85` |

### Cuerpo — DTO `CreateTrackingPurposeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `purposeCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código único del propósito de tracking | `src/modules/telemetry/dto/tracking-purpose.dto.ts:24` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Nombre legible del propósito | `src/modules/telemetry/dto/tracking-purpose.dto.ts:32` |
| `purposeCategoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría del propósito (concept id) | `src/modules/telemetry/dto/tracking-purpose.dto.ts:43` |
| `legalBasisConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Base legal (concept id) | `src/modules/telemetry/dto/tracking-purpose.dto.ts:54` |
| `requiresConsent` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere consentimiento explícito | `src/modules/telemetry/dto/tracking-purpose.dto.ts:65` |
| `permitsMarketingUse` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Permite uso de marketing | `src/modules/telemetry/dto/tracking-purpose.dto.ts:73` |
| `permitsCrossTenantAggregation` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Permite agregación cross-tenant | `src/modules/telemetry/dto/tracking-purpose.dto.ts:81` |
| `defaultRetentionDays` | `number` | No | mínimo 0; máximo 36500 | `@IsOptional()` `@IsInt()` `@Min(0)` `@Max(36500)` | Días de retención por defecto | `src/modules/telemetry/dto/tracking-purpose.dto.ts:91` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "purposeCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "purposeCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "purposeCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "legalBasisConceptId": "00000000-0000-4000-8000-000000000001",
  "requiresConsent": true,
  "permitsMarketingUse": true,
  "permitsCrossTenantAggregation": true,
  "defaultRetentionDays": 1
}
```

</details>

### Respuesta — `Promise<TrackingPurposeResponseDto>` · DTO `TrackingPurposeResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/telemetry/dto/tracking-purpose.dto.ts:100` |
| `purposeCode` | `string` | Sí | — | — | Valor de purpose code mantenido por la instancia. | `src/modules/telemetry/dto/tracking-purpose.dto.ts:106` |
| `versionNumber` | `number` | Sí | — | — | Valor de version number mantenido por la instancia. | `src/modules/telemetry/dto/tracking-purpose.dto.ts:112` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/telemetry/dto/tracking-purpose.dto.ts:118` |
| `requiresConsent` | `boolean` | Sí | — | — | Requiere consentimiento | `src/modules/telemetry/dto/tracking-purpose.dto.ts:124` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/telemetry/dto/tracking-purpose.dto.ts:130` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El código de propósito ya existe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/telemetry/controllers/telemetry-governance.controller.spec.ts:35` |

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. POST /telemetry/web-vitals

- **Origen:** CONTRATO
- **Nombre:** Registrar métricas Core Web Vitals por ruta (batch)
- **Bloque:** Operaciones de Plataforma
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TelemetryEventsController.recordWebVitals` — `src/modules/telemetry/controllers/telemetry-events.controller.ts:80`

### Qué es y para qué sirve (negocio)

Registrar métricas Core Web Vitals por ruta (batch). Dentro del módulo (descripción del modelo, en inglés): «Tracks application journeys for security, product and commercial analysis while separating mandatory security audit from optional/regulated analytics.» Dominio: Operaciones de Plataforma.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_28_telemetry.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:32`)

### Cómo se atiende (sistema)

`POST /telemetry/web-vitals` la atiende `TelemetryEventsController.recordWebVitals` (src/modules/telemetry/controllers/telemetry-events.controller.ts:80). Exige sesión; el controlador no declara roles. Valida el cuerpo como `RecordWebVitalsDto` (10 campos, 3 obligatorios). Delega en `TelemetryEventsService.recordWebVitals`. Crea filas en telemetry.web_vitals. Lee iam.sessions, telemetry.analytics_subjects, telemetry.client_contexts, telemetry.session_journeys, telemetry.user_activity_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/telemetry/controllers/telemetry-events.controller.ts:80` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.sessions` | LEE | LEE | DIRECTA | TelemetryEventsController.recordWebVitals → TelemetryEventsService.recordWebVitals → TelemetryEventsService.assertOwnedJourney → ActorSessionsRepository.belongsToUser | `src/modules/telemetry/repositories/actor-sessions.repository.ts:45` |
| `telemetry.analytics_subjects` | LEE | LEE | DIRECTA | TelemetryEventsController.recordWebVitals → TelemetryEventsService.recordWebVitals → TelemetryEventsService.assertOwnedSubject → AnalyticsSubjectsRepository.findById | `src/modules/telemetry/repositories/analytics-subjects.repository.ts:40` |
| `telemetry.client_contexts` | LEE | LEE | DIRECTA | TelemetryEventsController.recordWebVitals → TelemetryEventsService.recordWebVitals → TelemetryEventsService.assertOwnedContext → ClientContextsRepository.findById | `src/modules/telemetry/repositories/client-contexts.repository.ts:92` |
| `telemetry.session_journeys` | LEE | LEE | DIRECTA | TelemetryEventsController.recordWebVitals → TelemetryEventsService.recordWebVitals → TelemetryEventsService.assertOwnedJourney → SessionJourneysRepository.findById | `src/modules/telemetry/repositories/session-journeys.repository.ts:48` |
| `telemetry.user_activity_events` | LEE | LEE | DIRECTA | TelemetryEventsController.recordWebVitals → TelemetryEventsService.recordWebVitals → TelemetryEventsService.assertOwnedEvent → UserActivityEventsRepository.findById | `src/modules/telemetry/repositories/user-activity-events.repository.ts:95` |
| `telemetry.web_vitals` | ESCRIBE | CREA | DIRECTA | TelemetryEventsController.recordWebVitals → TelemetryEventsService.recordWebVitals → WebVitalsRepository.create | `src/modules/telemetry/repositories/web-vitals.repository.ts:64` |

### Cuerpo — DTO `RecordWebVitalsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `metrics` | `array<WebVitalItemDto>` | Sí | mínimo 1 elemento(s); máximo 200 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(200)` `@ValidateNested({ each: true })` `@Type(() => WebVitalItemDto)` | Lote de métricas CWV | `src/modules/telemetry/dto/web-vital.dto.ts:113` |
| `metrics[].metric` | `string` | Sí | valores: LCP, INP, FID, CLS, TTFB, FCP | `@IsIn(WEB_VITAL_METRIC_CODES)` | Métrica CWV | `src/modules/telemetry/dto/web-vital.dto.ts:25` |
| `metrics[].metricValue` | `number` | Sí | mínimo 0 | `@IsNumber()` `@Min(0)` | Valor de la métrica (>= 0) | `src/modules/telemetry/dto/web-vital.dto.ts:33` |
| `metrics[].rating` | `string` | No | valores: GOOD, NEEDS_IMPROVEMENT, POOR | `@IsOptional()` `@IsIn(['GOOD', 'NEEDS_IMPROVEMENT', 'POOR'])` | Rating | `src/modules/telemetry/dto/web-vital.dto.ts:44` |
| `metrics[].routeTemplate` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Plantilla de ruta | `src/modules/telemetry/dto/web-vital.dto.ts:53` |
| `metrics[].portalTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de portal (concept id) | `src/modules/telemetry/dto/web-vital.dto.ts:64` |
| `metrics[].userActivityEventId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Evento de actividad relacionado | `src/modules/telemetry/dto/web-vital.dto.ts:75` |
| `metrics[].clientContextId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Contexto de cliente | `src/modules/telemetry/dto/web-vital.dto.ts:83` |
| `metrics[].sessionJourneyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Journey de sesión | `src/modules/telemetry/dto/web-vital.dto.ts:91` |
| `metrics[].analyticsSubjectId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sujeto de analítica | `src/modules/telemetry/dto/web-vital.dto.ts:99` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "metrics": [
    {
      "metric": "LCP",
      "metricValue": 1
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "metrics": [
    {
      "metric": "LCP",
      "metricValue": 1,
      "rating": "GOOD",
      "routeTemplate": "valor-ejemplo",
      "portalTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "userActivityEventId": "00000000-0000-4000-8000-000000000001",
      "clientContextId": "00000000-0000-4000-8000-000000000001",
      "sessionJourneyId": "00000000-0000-4000-8000-000000000001",
      "analyticsSubjectId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — `Promise<WebVitalsResponseDto>` · DTO `WebVitalsResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `inserted` | `number` | Sí | — | — | Valor de inserted mantenido por la instancia. | `src/modules/telemetry/dto/web-vital.dto.ts:122` |
| `ids` | `array<string>` | Sí | — | — | Valor de ids mantenido por la instancia. | `src/modules/telemetry/dto/web-vital.dto.ts:128` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Journey de sesión no encontrado; ResourceNotFoundException: Sujeto de analítica no encontrado; ResourceNotFoundException: Evento de actividad no encontrado; ResourceNotFoundException: Contexto de cliente no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/telemetry.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Telemetry (28) — etapa `ctrl:TelemetryEventsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

