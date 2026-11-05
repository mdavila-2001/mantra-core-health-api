<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `telemetry`

Referencia exhaustiva de 35 operación(es) del módulo `telemetry`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `telemetry-analytics`, `telemetry-client-errors`, `telemetry-consent`, `telemetry-events`, `telemetry-governance`, `telemetry-onboarding-analytics`, `telemetry-retention`
- **Controladores:** `TelemetryAnalyticsController`, `TelemetryClickHeatmapController`, `TelemetryClientErrorsController`, `TelemetryConsentController`, `TelemetryErrorsAnalyticsController`, `TelemetryEventsController`, `TelemetryGovernanceController`, `TelemetryOnboardingAnalyticsController`, `TelemetryPartsAnalyticsController`, `TelemetryRetentionController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /admin/analytics/devices](#1-get-admin-analytics-devices) — Desglose de dispositivos (tipo, SO, navegador, versión de app); bots aparte; lo no medido se declara
2. [GET /admin/analytics/errors](#2-get-admin-analytics-errors) — Errores del cliente: totales, por parte, clase, estado HTTP y ruta de API
3. [GET /admin/analytics/errors/fingerprints](#3-get-admin-analytics-errors-fingerprints) — Top de huellas de error con tendencia
4. [GET /admin/analytics/errors/fingerprints/{fingerprint}](#4-get-admin-analytics-errors-fingerprints-fingerprint) — Detalle agregado de una huella; request_id recientes sólo a roles RAW
5. [GET /admin/analytics/errors/routes-not-found](#5-get-admin-analytics-errors-routes-not-found) — Rutas que cayeron en «no encontrada» o sin parte registrada
6. [GET /admin/analytics/funnels](#6-get-admin-analytics-funnels) — Embudos definidos con sus pasos
7. [GET /admin/analytics/funnels/{funnelId}/report](#7-get-admin-analytics-funnels-funnelid-report) — Embudo por sesión: denominador, conversión por paso y conversiones confirmadas por servidor
8. [GET /admin/analytics/heatmap](#8-get-admin-analytics-heatmap) — Mapa de calor de clics de una pantalla: celdas normalizadas, elementos y tamaño; lo no medido se declara
9. [GET /admin/analytics/onboarding/funnel](#9-get-admin-analytics-onboarding-funnel) — Reporte de embudo y deserción paso a paso para formularios de alta
10. [GET /admin/analytics/onboarding/heatmap](#10-get-admin-analytics-onboarding-heatmap) — Mapa de calor por campo y nivel de fricción para formularios de alta
11. [GET /admin/analytics/overview](#11-get-admin-analytics-overview) — Totales, rutas y eventos principales de la ventana
12. [GET /admin/analytics/parts](#12-get-admin-analytics-parts) — Árbol de partes con su uso, errores y vitales; lo que no casa va a unmapped
13. [GET /admin/analytics/parts/{routeCode}](#13-get-admin-analytics-parts-routecode) — Detalle de una parte: serie, acciones clave, vitales y errores
14. [GET /admin/analytics/pipeline-health](#14-get-admin-analytics-pipeline-health) — Frescura, latencia de ingesta, desfase de reloj; lo no medido se declara
15. [GET /admin/analytics/sessions](#15-get-admin-analytics-sessions) — Sesiones de la ventana (sin identificadores de sesión ni sujeto)
16. [GET /admin/analytics/sessions/{id}](#16-get-admin-analytics-sessions-id) — Timeline de una sesión: eventos y nombres de propiedad, sin valores
17. [GET /admin/analytics/timeseries](#17-get-admin-analytics-timeseries) — Eventos y sesiones por hora o día (UTC), cubos vacíos en 0
18. [GET /admin/analytics/web-vitals](#18-get-admin-analytics-web-vitals) — p50/p75/p95 por métrica sobre la distribución, con tamaño de muestra
19. [POST /telemetry/activity-events](#19-post-telemetry-activity-events) — Capturar evento(s) de actividad consent-aware (batch)
20. [POST /telemetry/analytics-subjects](#20-post-telemetry-analytics-subjects) — Provisionar sujeto de analítica pseudónimo
21. [POST /telemetry/client-contexts](#21-post-telemetry-client-contexts) — Registrar contexto de cliente/dispositivo + journey
22. [POST /telemetry/client-errors](#22-post-telemetry-client-errors) — Registra un lote de errores del cliente (saneados en el servidor)
23. [POST /telemetry/conversion-events](#23-post-telemetry-conversion-events) — Registrar evento de conversión con atribución
24. [POST /telemetry/disclosure-acceptances](#24-post-telemetry-disclosure-acceptances) — Registrar aceptación de disclosure por usuario/sesión
25. [POST /telemetry/disclosure-versions](#25-post-telemetry-disclosure-versions) — Publicar versión de disclosure de tracking
26. [POST /telemetry/event-schemas](#26-post-telemetry-event-schemas) — Registrar esquema de evento de actividad (versionado)
27. [POST /telemetry/funnels](#27-post-telemetry-funnels) — Definir funnel y sus pasos
28. [POST /telemetry/onboarding-events](#28-post-telemetry-onboarding-events) — Captura eventos de telemetría de alta y avance en formularios de registro
29. [POST /telemetry/retention/purge](#29-post-telemetry-retention-purge) — Purga por retención del propósito: eventos de uso, propiedades y errores del cliente
30. [POST /telemetry/session-journeys/{id}/close](#30-post-telemetry-session-journeys-id-close) — Cerrar journey de sesión y consolidar métricas
31. [POST /telemetry/tracking-consents](#31-post-telemetry-tracking-consents) — Otorgar consentimiento de tracking por propósito
32. [POST /telemetry/tracking-consents/{id}/withdraw](#32-post-telemetry-tracking-consents-id-withdraw) — Retirar consentimiento y desactivar sujeto (cascada)
33. [GET /telemetry/tracking-consents/me](#33-get-telemetry-tracking-consents-me) — Estado vigente de mi consentimiento de tracking
34. [POST /telemetry/tracking-purposes](#34-post-telemetry-tracking-purposes) — Definir propósito de tracking y base legal
35. [POST /telemetry/web-vitals](#35-post-telemetry-web-vitals) — Registrar métricas Core Web Vitals por ruta (batch)

---

## 1. GET /admin/analytics/devices

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** Desglose de dispositivos (tipo, SO, navegador, versión de app); bots aparte; lo no medido se declara
- **Operation ID:** `TelemetryAnalyticsController_devices`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryAnalyticsController.devices](../../src/modules/telemetry/presentation/controllers/telemetry-analytics.controller.ts)

### Descripción de negocio

Desglose de dispositivos (tipo, SO, navegador, versión de app); bots aparte; lo no medido se declara. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/devices` en `TelemetryAnalyticsController_devices`. El controlador delega en `TelemetryAnalyticsService.devices`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | No | `string` | formato `date-time` | Por defecto: to − 7 días | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Por defecto: ahora | `2026-07-31T12:00:00.000Z` |
| `portal` | query | No | `string` | valores: `WEB`, `MOBILE` | Sin descripción específica en OpenAPI. | `WEB` |
| `minSample` | query | No | `number` | mínimo 1; máximo 1000 | Sólo alcance plataforma (sin X-Tenant-Id): sube el umbral de sujetos por grupo; nunca baja del piso del servidor. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/devices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/devices?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&portal=WEB&minSample=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/devices"
}
```

---

## 2. GET /admin/analytics/errors

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** Errores del cliente: totales, por parte, clase, estado HTTP y ruta de API
- **Operation ID:** `TelemetryErrorsAnalyticsController_summary`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryErrorsAnalyticsController.summary](../../src/modules/telemetry/presentation/controllers/telemetry-errors-analytics.controller.ts)

### Descripción de negocio

Errores del cliente: totales, por parte, clase, estado HTTP y ruta de API. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/errors` en `TelemetryErrorsAnalyticsController_summary`. El controlador delega en `TelemetryErrorsAnalyticsService.errors`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | No | `string` | formato `date-time` | Por defecto: to − 7 días. Máximo 92 días. | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Por defecto: ahora | `2026-07-31T12:00:00.000Z` |
| `interval` | query | No | `string` | valores: `hour`, `day` | Sin descripción específica en OpenAPI. | `hour` |
| `portal` | query | No | `string` | valores: `WEB`, `MOBILE` | Sin descripción específica en OpenAPI. | `WEB` |
| `minSample` | query | No | `number` | mínimo 1; máximo 1000 | Sólo alcance plataforma: sube el umbral de sujetos (nunca baja del piso del servidor). | `1` |
| `routeCode` | query | No | `string` | Sin restricción adicional declarada | route_code de la parte (ver GET /admin/analytics/parts) | `CODIGO_EJEMPLO` |
| `class` | query | No | `string` | valores: `JS`, `PROMISE`, `HTTP`, `ROUTE`, `CHUNK`, `HYDRATION`, `TEMPLATE`, `NATIVE` | Sin descripción específica en OpenAPI. | `JS` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `20` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/errors HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/errors?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&interval=hour&portal=WEB&minSample=1&routeCode=CODIGO_EJEMPLO&class=JS&limit=20 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/errors"
}
```

---

## 3. GET /admin/analytics/errors/fingerprints

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** Top de huellas de error con tendencia
- **Operation ID:** `TelemetryErrorsAnalyticsController_fingerprints`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryErrorsAnalyticsController.fingerprints](../../src/modules/telemetry/presentation/controllers/telemetry-errors-analytics.controller.ts)

### Descripción de negocio

Top de huellas de error con tendencia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/errors/fingerprints` en `TelemetryErrorsAnalyticsController_fingerprints`. El controlador delega en `TelemetryErrorsAnalyticsService.fingerprints`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | No | `string` | formato `date-time` | Por defecto: to − 7 días. Máximo 92 días. | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Por defecto: ahora | `2026-07-31T12:00:00.000Z` |
| `interval` | query | No | `string` | valores: `hour`, `day` | Sin descripción específica en OpenAPI. | `hour` |
| `portal` | query | No | `string` | valores: `WEB`, `MOBILE` | Sin descripción específica en OpenAPI. | `WEB` |
| `minSample` | query | No | `number` | mínimo 1; máximo 1000 | Sólo alcance plataforma: sube el umbral de sujetos (nunca baja del piso del servidor). | `1` |
| `routeCode` | query | No | `string` | Sin restricción adicional declarada | route_code de la parte (ver GET /admin/analytics/parts) | `CODIGO_EJEMPLO` |
| `class` | query | No | `string` | valores: `JS`, `PROMISE`, `HTTP`, `ROUTE`, `CHUNK`, `HYDRATION`, `TEMPLATE`, `NATIVE` | Sin descripción específica en OpenAPI. | `JS` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `20` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/errors/fingerprints HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/errors/fingerprints?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&interval=hour&portal=WEB&minSample=1&routeCode=CODIGO_EJEMPLO&class=JS&limit=20 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/errors/fingerprints"
}
```

---

## 4. GET /admin/analytics/errors/fingerprints/{fingerprint}

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** Detalle agregado de una huella; request_id recientes sólo a roles RAW
- **Operation ID:** `TelemetryErrorsAnalyticsController_fingerprint`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryErrorsAnalyticsController.fingerprint](../../src/modules/telemetry/presentation/controllers/telemetry-errors-analytics.controller.ts)

### Descripción de negocio

Detalle agregado de una huella; request_id recientes sólo a roles RAW. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/errors/fingerprints/{fingerprint}` en `TelemetryErrorsAnalyticsController_fingerprint`. El controlador delega en `TelemetryErrorsAnalyticsService.fingerprint`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `fingerprint` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `from` | query | No | `string` | formato `date-time` | Por defecto: to − 7 días. Máximo 92 días. | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Por defecto: ahora | `2026-07-31T12:00:00.000Z` |
| `interval` | query | No | `string` | valores: `hour`, `day` | Sin descripción específica en OpenAPI. | `hour` |
| `portal` | query | No | `string` | valores: `WEB`, `MOBILE` | Sin descripción específica en OpenAPI. | `WEB` |
| `minSample` | query | No | `number` | mínimo 1; máximo 1000 | Sólo alcance plataforma: sube el umbral de sujetos (nunca baja del piso del servidor). | `1` |
| `routeCode` | query | No | `string` | Sin restricción adicional declarada | route_code de la parte (ver GET /admin/analytics/parts) | `CODIGO_EJEMPLO` |
| `class` | query | No | `string` | valores: `JS`, `PROMISE`, `HTTP`, `ROUTE`, `CHUNK`, `HYDRATION`, `TEMPLATE`, `NATIVE` | Sin descripción específica en OpenAPI. | `JS` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `20` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/errors/fingerprints/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/errors/fingerprints/valor-ejemplo?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&interval=hour&portal=WEB&minSample=1&routeCode=CODIGO_EJEMPLO&class=JS&limit=20 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/errors/fingerprints/{fingerprint}"
}
```

---

## 5. GET /admin/analytics/errors/routes-not-found

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** Rutas que cayeron en «no encontrada» o sin parte registrada
- **Operation ID:** `TelemetryErrorsAnalyticsController_routesNotFound`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryErrorsAnalyticsController.routesNotFound](../../src/modules/telemetry/presentation/controllers/telemetry-errors-analytics.controller.ts)

### Descripción de negocio

Rutas que cayeron en «no encontrada» o sin parte registrada. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/errors/routes-not-found` en `TelemetryErrorsAnalyticsController_routesNotFound`. El controlador delega en `TelemetryErrorsAnalyticsService.routesNotFound`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | No | `string` | formato `date-time` | Por defecto: to − 7 días. Máximo 92 días. | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Por defecto: ahora | `2026-07-31T12:00:00.000Z` |
| `interval` | query | No | `string` | valores: `hour`, `day` | Sin descripción específica en OpenAPI. | `hour` |
| `portal` | query | No | `string` | valores: `WEB`, `MOBILE` | Sin descripción específica en OpenAPI. | `WEB` |
| `minSample` | query | No | `number` | mínimo 1; máximo 1000 | Sólo alcance plataforma: sube el umbral de sujetos (nunca baja del piso del servidor). | `1` |
| `routeCode` | query | No | `string` | Sin restricción adicional declarada | route_code de la parte (ver GET /admin/analytics/parts) | `CODIGO_EJEMPLO` |
| `class` | query | No | `string` | valores: `JS`, `PROMISE`, `HTTP`, `ROUTE`, `CHUNK`, `HYDRATION`, `TEMPLATE`, `NATIVE` | Sin descripción específica en OpenAPI. | `JS` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `20` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/errors/routes-not-found HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/errors/routes-not-found?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&interval=hour&portal=WEB&minSample=1&routeCode=CODIGO_EJEMPLO&class=JS&limit=20 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/errors/routes-not-found"
}
```

---

## 6. GET /admin/analytics/funnels

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** Embudos definidos con sus pasos
- **Operation ID:** `TelemetryAnalyticsController_listFunnels`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryAnalyticsController.listFunnels](../../src/modules/telemetry/presentation/controllers/telemetry-analytics.controller.ts)

### Descripción de negocio

Embudos definidos con sus pasos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/funnels` en `TelemetryAnalyticsController_listFunnels`. El controlador delega en `TelemetryAnalyticsService.listFunnels`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/funnels HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/funnels HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/funnels"
}
```

---

## 7. GET /admin/analytics/funnels/{funnelId}/report

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** Embudo por sesión: denominador, conversión por paso y conversiones confirmadas por servidor
- **Operation ID:** `TelemetryAnalyticsController_funnelReport`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryAnalyticsController.funnelReport](../../src/modules/telemetry/presentation/controllers/telemetry-analytics.controller.ts)

### Descripción de negocio

Embudo por sesión: denominador, conversión por paso y conversiones confirmadas por servidor. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/funnels/{funnelId}/report` en `TelemetryAnalyticsController_funnelReport`. El controlador delega en `TelemetryAnalyticsService.funnelReport`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `funnelId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `from` | query | No | `string` | formato `date-time` | Por defecto: to − 7 días | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Por defecto: ahora | `2026-07-31T12:00:00.000Z` |
| `interval` | query | No | `string` | valores: `hour`, `day` | Sin descripción específica en OpenAPI. | `hour` |
| `portal` | query | No | `string` | valores: `WEB`, `MOBILE` | Sin descripción específica en OpenAPI. | `WEB` |
| `minSample` | query | No | `number` | mínimo 1; máximo 1000 | Sólo alcance plataforma (sin X-Tenant-Id): sube el umbral de sujetos por grupo; nunca baja del piso del servidor. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/funnels/00000000-0000-4000-8000-000000000001/report HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Deben ser UUID válidos: `funnelId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/funnels/00000000-0000-4000-8000-000000000001/report?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&interval=hour&portal=WEB&minSample=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Embudo no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-analytics.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/funnels/{funnelId}/report"
}
```

---

## 8. GET /admin/analytics/heatmap

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** Mapa de calor de clics de una pantalla: celdas normalizadas, elementos y tamaño; lo no medido se declara
- **Operation ID:** `TelemetryClickHeatmapController_getHeatmap`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryClickHeatmapController.getHeatmap](../../src/modules/telemetry/presentation/controllers/telemetry-click-heatmap.controller.ts)

### Descripción de negocio

Mapa de calor de clics de una pantalla: celdas normalizadas, elementos y tamaño; lo no medido se declara. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/heatmap` en `TelemetryClickHeatmapController_getHeatmap`. El controlador delega en `TelemetryClickHeatmapService.heatmap`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `route` | query | Sí | `string` | longitud mínima 1; longitud máxima 300 | Plantilla de ruta, p. ej. /patients/:id (la misma que `routeTemplate` del evento). | `valor-ejemplo` |
| `from` | query | No | `string` | formato `date-time` | Por defecto: to − 7 días. Máximo 92 días. | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Por defecto: ahora | `2026-07-31T12:00:00.000Z` |
| `portal` | query | No | `string` | valores: `WEB`, `MOBILE` | Sin descripción específica en OpenAPI. | `WEB` |
| `screenSize` | query | No | `string` | valores: `movil`, `tableta`, `escritorio` | Segmenta las celdas y los elementos por tamaño de pantalla; `byScreenSize` no se filtra. | `movil` |
| `metric` | query | No | `string` | valores: `clicks`, `rage`, `dead`, `scroll` | clicks: todos los clics posicionados; rage: clics repetidos; dead: clics sobre algo interactivo sin efecto; scroll: profundidad de lectura (sin celdas). | `clicks` |
| `minSample` | query | No | `number` | mínimo 1; máximo 1000 | Sólo alcance plataforma (sin X-Tenant-Id): sube el umbral de personas por celda/elemento; nunca baja del piso del servidor. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/heatmap?route=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/heatmap?route=valor-ejemplo&from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&portal=WEB&screenSize=movil&metric=clicks&minSample=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/heatmap"
}
```

---

## 9. GET /admin/analytics/onboarding/funnel

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-onboarding-analytics`
- **Nombre:** Reporte de embudo y deserción paso a paso para formularios de alta
- **Operation ID:** `TelemetryOnboardingAnalyticsController_getFunnelReport`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryOnboardingAnalyticsController.getFunnelReport](../../src/modules/telemetry/presentation/controllers/telemetry-onboarding-analytics.controller.ts)

### Descripción de negocio

Reporte de embudo y deserción paso a paso para formularios de alta. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/onboarding/funnel` en `TelemetryOnboardingAnalyticsController_getFunnelReport`. El controlador delega en `TelemetryOnboardingAnalyticsService.getFunnelReport`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/onboarding/funnel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/onboarding/funnel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/onboarding/funnel"
}
```

---

## 10. GET /admin/analytics/onboarding/heatmap

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-onboarding-analytics`
- **Nombre:** Mapa de calor por campo y nivel de fricción para formularios de alta
- **Operation ID:** `TelemetryOnboardingAnalyticsController_getHeatmapReport`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryOnboardingAnalyticsController.getHeatmapReport](../../src/modules/telemetry/presentation/controllers/telemetry-onboarding-analytics.controller.ts)

### Descripción de negocio

Mapa de calor por campo y nivel de fricción para formularios de alta. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/onboarding/heatmap` en `TelemetryOnboardingAnalyticsController_getHeatmapReport`. El controlador delega en `TelemetryOnboardingAnalyticsService.getHeatmapReport`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `metric` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/onboarding/heatmap?metric=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/onboarding/heatmap?metric=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/onboarding/heatmap"
}
```

---

## 11. GET /admin/analytics/overview

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** Totales, rutas y eventos principales de la ventana
- **Operation ID:** `TelemetryAnalyticsController_overview`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryAnalyticsController.overview](../../src/modules/telemetry/presentation/controllers/telemetry-analytics.controller.ts)

### Descripción de negocio

Totales, rutas y eventos principales de la ventana. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/overview` en `TelemetryAnalyticsController_overview`. El controlador delega en `TelemetryAnalyticsService.overview`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | No | `string` | formato `date-time` | Por defecto: to − 7 días | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Por defecto: ahora | `2026-07-31T12:00:00.000Z` |
| `interval` | query | No | `string` | valores: `hour`, `day` | Sin descripción específica en OpenAPI. | `hour` |
| `portal` | query | No | `string` | valores: `WEB`, `MOBILE` | Sin descripción específica en OpenAPI. | `WEB` |
| `minSample` | query | No | `number` | mínimo 1; máximo 1000 | Sólo alcance plataforma (sin X-Tenant-Id): sube el umbral de sujetos por grupo; nunca baja del piso del servidor. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/overview HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/overview?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&interval=hour&portal=WEB&minSample=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/overview"
}
```

---

## 12. GET /admin/analytics/parts

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** Árbol de partes con su uso, errores y vitales; lo que no casa va a unmapped
- **Operation ID:** `TelemetryPartsAnalyticsController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryPartsAnalyticsController.list](../../src/modules/telemetry/presentation/controllers/telemetry-parts-analytics.controller.ts)

### Descripción de negocio

Árbol de partes con su uso, errores y vitales; lo que no casa va a unmapped. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/parts` en `TelemetryPartsAnalyticsController_list`. El controlador delega en `TelemetryPartsAnalyticsService.parts`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | No | `string` | formato `date-time` | Por defecto: to − 7 días. Máximo 92 días. | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Por defecto: ahora | `2026-07-31T12:00:00.000Z` |
| `interval` | query | No | `string` | valores: `hour`, `day` | Sin descripción específica en OpenAPI. | `hour` |
| `portal` | query | No | `string` | valores: `WEB`, `MOBILE` | Sin descripción específica en OpenAPI. | `WEB` |
| `minSample` | query | No | `number` | mínimo 1; máximo 1000 | Sólo alcance plataforma: sube el umbral de sujetos (nunca baja del piso del servidor). | `1` |
| `compare` | query | No | `string` | valores: `previous` | Añade el periodo anterior de la misma duración. | `previous` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/parts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/parts?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&interval=hour&portal=WEB&minSample=1&compare=previous HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/parts"
}
```

---

## 13. GET /admin/analytics/parts/{routeCode}

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** Detalle de una parte: serie, acciones clave, vitales y errores
- **Operation ID:** `TelemetryPartsAnalyticsController_detail`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryPartsAnalyticsController.detail](../../src/modules/telemetry/presentation/controllers/telemetry-parts-analytics.controller.ts)

### Descripción de negocio

Detalle de una parte: serie, acciones clave, vitales y errores. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/parts/{routeCode}` en `TelemetryPartsAnalyticsController_detail`. El controlador delega en `TelemetryPartsAnalyticsService.part`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `routeCode` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |
| `from` | query | No | `string` | formato `date-time` | Por defecto: to − 7 días. Máximo 92 días. | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Por defecto: ahora | `2026-07-31T12:00:00.000Z` |
| `interval` | query | No | `string` | valores: `hour`, `day` | Sin descripción específica en OpenAPI. | `hour` |
| `portal` | query | No | `string` | valores: `WEB`, `MOBILE` | Sin descripción específica en OpenAPI. | `WEB` |
| `minSample` | query | No | `number` | mínimo 1; máximo 1000 | Sólo alcance plataforma: sube el umbral de sujetos (nunca baja del piso del servidor). | `1` |
| `compare` | query | No | `string` | valores: `previous` | Añade el periodo anterior de la misma duración. | `previous` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/parts/CODIGO_EJEMPLO HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/parts/CODIGO_EJEMPLO?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&interval=hour&portal=WEB&minSample=1&compare=previous HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Parte no registrada | Excepción explícita en src/modules/telemetry/application/services/telemetry-parts-analytics.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/parts/{routeCode}"
}
```

---

## 14. GET /admin/analytics/pipeline-health

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** Frescura, latencia de ingesta, desfase de reloj; lo no medido se declara
- **Operation ID:** `TelemetryAnalyticsController_pipelineHealth`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryAnalyticsController.pipelineHealth](../../src/modules/telemetry/presentation/controllers/telemetry-analytics.controller.ts)

### Descripción de negocio

Frescura, latencia de ingesta, desfase de reloj; lo no medido se declara. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/pipeline-health` en `TelemetryAnalyticsController_pipelineHealth`. El controlador delega en `TelemetryAnalyticsService.pipelineHealth`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | No | `string` | formato `date-time` | Por defecto: to − 7 días | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Por defecto: ahora | `2026-07-31T12:00:00.000Z` |
| `interval` | query | No | `string` | valores: `hour`, `day` | Sin descripción específica en OpenAPI. | `hour` |
| `portal` | query | No | `string` | valores: `WEB`, `MOBILE` | Sin descripción específica en OpenAPI. | `WEB` |
| `minSample` | query | No | `number` | mínimo 1; máximo 1000 | Sólo alcance plataforma (sin X-Tenant-Id): sube el umbral de sujetos por grupo; nunca baja del piso del servidor. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/pipeline-health HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/pipeline-health?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&interval=hour&portal=WEB&minSample=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/pipeline-health"
}
```

---

## 15. GET /admin/analytics/sessions

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** Sesiones de la ventana (sin identificadores de sesión ni sujeto)
- **Operation ID:** `TelemetryAnalyticsController_listSessions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryAnalyticsController.listSessions](../../src/modules/telemetry/presentation/controllers/telemetry-analytics.controller.ts)

### Descripción de negocio

Sesiones de la ventana (sin identificadores de sesión ni sujeto). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/sessions` en `TelemetryAnalyticsController_listSessions`. El controlador delega en `TelemetryAnalyticsService.listSessions`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | No | `string` | formato `date-time` | Por defecto: to − 7 días | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Por defecto: ahora | `2026-07-31T12:00:00.000Z` |
| `interval` | query | No | `string` | valores: `hour`, `day` | Sin descripción específica en OpenAPI. | `hour` |
| `portal` | query | No | `string` | valores: `WEB`, `MOBILE` | Sin descripción específica en OpenAPI. | `WEB` |
| `minSample` | query | No | `number` | mínimo 1; máximo 1000 | Sólo alcance plataforma (sin X-Tenant-Id): sube el umbral de sujetos por grupo; nunca baja del piso del servidor. | `1` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `50` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/sessions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/sessions?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&interval=hour&portal=WEB&minSample=1&cursor=valor-ejemplo&limit=50 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DPO. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/sessions"
}
```

---

## 16. GET /admin/analytics/sessions/{id}

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** Timeline de una sesión: eventos y nombres de propiedad, sin valores
- **Operation ID:** `TelemetryAnalyticsController_getSession`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryAnalyticsController.getSession](../../src/modules/telemetry/presentation/controllers/telemetry-analytics.controller.ts)

### Descripción de negocio

Timeline de una sesión: eventos y nombres de propiedad, sin valores. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/sessions/{id}` en `TelemetryAnalyticsController_getSession`. El controlador delega en `TelemetryAnalyticsService.getSession`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/sessions/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DPO`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/sessions/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DPO. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sesión no encontrada | Excepción explícita en src/modules/telemetry/application/services/telemetry-analytics.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/sessions/{id}"
}
```

---

## 17. GET /admin/analytics/timeseries

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** Eventos y sesiones por hora o día (UTC), cubos vacíos en 0
- **Operation ID:** `TelemetryAnalyticsController_timeseries`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryAnalyticsController.timeseries](../../src/modules/telemetry/presentation/controllers/telemetry-analytics.controller.ts)

### Descripción de negocio

Eventos y sesiones por hora o día (UTC), cubos vacíos en 0. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/timeseries` en `TelemetryAnalyticsController_timeseries`. El controlador delega en `TelemetryAnalyticsService.timeseries`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | No | `string` | formato `date-time` | Por defecto: to − 7 días | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Por defecto: ahora | `2026-07-31T12:00:00.000Z` |
| `interval` | query | No | `string` | valores: `hour`, `day` | Sin descripción específica en OpenAPI. | `hour` |
| `portal` | query | No | `string` | valores: `WEB`, `MOBILE` | Sin descripción específica en OpenAPI. | `WEB` |
| `minSample` | query | No | `number` | mínimo 1; máximo 1000 | Sólo alcance plataforma (sin X-Tenant-Id): sube el umbral de sujetos por grupo; nunca baja del piso del servidor. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/timeseries HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/timeseries?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&interval=hour&portal=WEB&minSample=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/timeseries"
}
```

---

## 18. GET /admin/analytics/web-vitals

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-analytics`
- **Nombre:** p50/p75/p95 por métrica sobre la distribución, con tamaño de muestra
- **Operation ID:** `TelemetryAnalyticsController_webVitals`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryAnalyticsController.webVitals](../../src/modules/telemetry/presentation/controllers/telemetry-analytics.controller.ts)

### Descripción de negocio

p50/p75/p95 por métrica sobre la distribución, con tamaño de muestra. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/analytics/web-vitals` en `TelemetryAnalyticsController_webVitals`. El controlador delega en `TelemetryAnalyticsService.webVitals`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | No | `string` | formato `date-time` | Por defecto: to − 7 días | `2026-07-31T12:00:00.000Z` |
| `to` | query | No | `string` | formato `date-time` | Por defecto: ahora | `2026-07-31T12:00:00.000Z` |
| `interval` | query | No | `string` | valores: `hour`, `day` | Sin descripción específica en OpenAPI. | `hour` |
| `portal` | query | No | `string` | valores: `WEB`, `MOBILE` | Sin descripción específica en OpenAPI. | `WEB` |
| `minSample` | query | No | `number` | mínimo 1; máximo 1000 | Sólo alcance plataforma (sin X-Tenant-Id): sube el umbral de sujetos por grupo; nunca baja del piso del servidor. | `1` |
| `route` | query | No | `string` | longitud máxima 300 | Plantilla de ruta, p. ej. /patients/:id | `valor-ejemplo` |
| `metric` | query | No | `string` | valores: `LCP`, `INP`, `CLS`, `FCP`, `TTFB`, `FID` | Desglose p75 por ruta de esta métrica | `LCP` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/analytics/web-vitals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SECURITY_ADMIN`, `DATA_PLATFORM_ADMIN`, `MARKETING_MANAGER`, `DPO`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/analytics/web-vitals?from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&interval=hour&portal=WEB&minSample=1&route=valor-ejemplo&metric=LCP HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SECURITY_ADMIN, DATA_PLATFORM_ADMIN, MARKETING_MANAGER, DPO. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/analytics/web-vitals"
}
```

---

## 19. POST /telemetry/activity-events

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-events`
- **Nombre:** Capturar evento(s) de actividad consent-aware (batch)
- **Operation ID:** `TelemetryEventsController_captureActivityEvents`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryEventsController.captureActivityEvents](../../src/modules/telemetry/presentation/controllers/telemetry-events.controller.ts)

### Descripción de negocio

Capturar evento(s) de actividad consent-aware (batch). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/activity-events` en `TelemetryEventsController_captureActivityEvents`. El controlador delega en `TelemetryEventsService.captureActivityEvents`. Valida el body como `CaptureActivityEventsDto` y consume `application/json`. El tipo de retorno estático es `Promise<ActivityEventsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CaptureActivityEventsDto`; los campos opcionales se omiten.

```http
POST /telemetry/activity-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "events": [
    {
      "eventSchemaDefinitionId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `events` | Sí | `array<ActivityEventItemDto>` | mínimo 1 elemento(s); máximo 500 elemento(s) | Lote de eventos de actividad | `[{"eventSchemaDefinitionId":"00000000-0000-4000-8000-000000000001","eventName":"Nombre de ejemplo","eventIdempotencyKey":"valor-ejemplo","analyticsSubjectId":"00000000-0000-4000-8000-000000000001","sessionJourneyId":"00000000-0000-4000-8000-000000000001","portalTypeConceptId":"00000000-0000-4000-8000-000000000001","routeTemplate":"valor-ejemplo","occurredAt":"valor-ejemplo","correlationId":"00000000-0000-4000-8000-000000000001","properties":[{"propertyName":"Nombre de ejemplo","valueType":"STRING","valueString":"valor-ejemplo","valueNumber":1,"valueBoolean":true,"dataClassificationConceptId":"00000000-0000-4000-8000-000000000001"}]}]` |
| `events[].eventSchemaDefinitionId` | Sí | `string` | formato `uuid` | Esquema de evento activo | `00000000-0000-4000-8000-000000000001` |
| `events[].eventName` | No | `string` | longitud máxima 200 | Nombre del evento (override del esquema) | `Nombre de ejemplo` |
| `events[].eventIdempotencyKey` | No | `string` | longitud máxima 200 | Clave de idempotencia del evento | `valor-ejemplo` |
| `events[].analyticsSubjectId` | No | `string` | formato `uuid` | Sujeto de analítica pseudónimo; debe ser del usuario autenticado | `00000000-0000-4000-8000-000000000001` |
| `events[].sessionJourneyId` | No | `string` | formato `uuid` | Journey de sesión existente a enlazar; debe ser de una sesión del usuario autenticado | `00000000-0000-4000-8000-000000000001` |
| `events[].portalTypeConceptId` | No | `string` | formato `uuid` | Tipo de portal (concept id) | `00000000-0000-4000-8000-000000000001` |
| `events[].routeTemplate` | No | `string` | longitud máxima 300 | Plantilla de ruta (sin ids en claro) | `valor-ejemplo` |
| `events[].occurredAt` | No | `string` | Sin restricción adicional declarada | Instante de ocurrencia (ISO-8601) | `valor-ejemplo` |
| `events[].correlationId` | No | `string` | formato `uuid` | Correlation id | `00000000-0000-4000-8000-000000000001` |
| `events[].properties` | No | `array<ActivityEventPropertyDto>` | máximo 25 elemento(s) | Propiedades declaradas por el esquema del evento (máximo 25, el tope del proveedor) | `[{"propertyName":"Nombre de ejemplo","valueType":"STRING","valueString":"valor-ejemplo","valueNumber":1,"valueBoolean":true,"dataClassificationConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `events[].properties[].propertyName` | No | `string` | longitud máxima 200 | Nombre de la propiedad | `Nombre de ejemplo` |
| `events[].properties[].valueType` | No | `string` | valores: `STRING`, `NUMBER`, `BOOLEAN` | Tipo de valor | `STRING` |
| `events[].properties[].valueString` | No | `string` | longitud máxima 4000 | Valor string | `valor-ejemplo` |
| `events[].properties[].valueNumber` | No | `number` | Sin restricción adicional declarada | Valor numérico | `1` |
| `events[].properties[].valueBoolean` | No | `boolean` | Sin restricción adicional declarada | Valor booleano | `true` |
| `events[].properties[].dataClassificationConceptId` | No | `string` | formato `uuid` | Ignorado: la clasificación del dato la fija el servidor desde el esquema del evento | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/activity-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ActivityEventsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ActivityEventsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "inserted": 1,
  "skipped": 1,
  "eventIds": [
    "valor-ejemplo"
  ],
  "sessionJourneyId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `inserted` | Sí | `number` | Sin restricción adicional declarada | Eventos insertados (consent-aware) | `1` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Eventos descartados por falta de consentimiento o reenvío | `1` |
| `eventIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de los eventos insertados | `["valor-ejemplo"]` |
| `sessionJourneyId` | No | `string` | formato `uuid` | Journey de sesión afectado | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Esquema de evento no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 404 | `NOT_FOUND` | Sujeto de analítica no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 404 | `NOT_FOUND` | Journey de sesión no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La sesión autenticada no está registrada | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/telemetry/activity-events"
}
```

---

## 20. POST /telemetry/analytics-subjects

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-consent`
- **Nombre:** Provisionar sujeto de analítica pseudónimo
- **Operation ID:** `TelemetryConsentController_provisionSubject`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryConsentController.provisionSubject](../../src/modules/telemetry/presentation/controllers/telemetry-consent.controller.ts)

### Descripción de negocio

Provisionar sujeto de analítica pseudónimo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-28-06 (interno del worker de ingesta).

### Descripción del sistema

NestJS resuelve `POST /telemetry/analytics-subjects` en `TelemetryConsentController_provisionSubject`. El controlador delega en `TelemetryConsentService.provisionSubject`. Valida el body como `ProvisionAnalyticsSubjectDto` y consume `application/json`. El tipo de retorno estático es `Promise<AnalyticsSubjectResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ProvisionAnalyticsSubjectDto`; los campos opcionales se omiten.

```http
POST /telemetry/analytics-subjects HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `pseudonymousSubjectKey` | No | `string` | longitud máxima 200 | Clave pseudónima (HMAC). Si se omite se genera de forma determinista. | `valor-ejemplo` |
| `keyVersion` | No | `number` | mínimo 1 | Versión de la clave de derivación | `1` |
| `userId` | No | `string` | formato `uuid` | Usuario asociado (opcional) | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Perfil de paciente asociado (opcional) | `00000000-0000-4000-8000-000000000001` |
| `createdFromConsentId` | No | `string` | formato `uuid` | Consentimiento que originó el sujeto | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/analytics-subjects HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pseudonymousSubjectKey": "valor-ejemplo",
  "keyVersion": 1,
  "userId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "createdFromConsentId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<AnalyticsSubjectResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AnalyticsSubjectResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "pseudonymousSubjectKey": "valor-ejemplo",
  "keyVersion": 1,
  "reused": true,
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `pseudonymousSubjectKey` | Sí | `string` | Sin restricción adicional declarada | Clave pseudónima del sujeto | `valor-ejemplo` |
| `keyVersion` | No | `number` | Sin restricción adicional declarada | Valor de key version mantenido por la instancia. | `1` |
| `reused` | Sí | `boolean` | Sin restricción adicional declarada | true si el sujeto ya existía (idempotente) | `true` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/telemetry/analytics-subjects"
}
```

---

## 21. POST /telemetry/client-contexts

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-events`
- **Nombre:** Registrar contexto de cliente/dispositivo + journey
- **Operation ID:** `TelemetryEventsController_captureClientContext`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryEventsController.captureClientContext](../../src/modules/telemetry/presentation/controllers/telemetry-events.controller.ts)

### Descripción de negocio

Registrar contexto de cliente/dispositivo + journey. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/client-contexts` en `TelemetryEventsController_captureClientContext`. El controlador delega en `TelemetryEventsService.captureClientContext`. Valida el body como `CreateClientContextDto` y consume `application/json`. El tipo de retorno estático es `Promise<ClientContextResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateClientContextDto`; los campos opcionales se omiten.

```http
POST /telemetry/client-contexts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sessionJourneyId` | No | `string` | formato `uuid` | Journey de sesión existente a enlazar; debe ser de una sesión del usuario autenticado. Si falta, se usa el journey abierto de la sesión autenticada | `00000000-0000-4000-8000-000000000001` |
| `analyticsSubjectId` | No | `string` | formato `uuid` | Sujeto de analítica; debe ser del usuario autenticado | `00000000-0000-4000-8000-000000000001` |
| `portalTypeConceptId` | No | `string` | formato `uuid` | Tipo de portal (concept id) | `00000000-0000-4000-8000-000000000001` |
| `deviceTypeConceptId` | No | `string` | formato `uuid` | Tipo de dispositivo (concept id) | `00000000-0000-4000-8000-000000000001` |
| `osFamilyConceptId` | No | `string` | formato `uuid` | Familia de SO (concept id) | `00000000-0000-4000-8000-000000000001` |
| `browserFamilyConceptId` | No | `string` | formato `uuid` | Familia de navegador (concept id) | `00000000-0000-4000-8000-000000000001` |
| `appVersion` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `screenClass` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `viewportBucket` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `locale` | No | `string` | longitud máxima 20 | Sin descripción específica en el contrato OpenAPI. | `es-BO` |
| `timezoneOffsetMinutes` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `countryConceptId` | No | `string` | formato `uuid` | País (concept id) | `00000000-0000-4000-8000-000000000001` |
| `regionCoarse` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `ipPrefixHash` | No | `string` | longitud máxima 200 | Hash del prefijo de IP | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `userAgentHash` | No | `string` | longitud máxima 200 | Hash del user agent | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `isBot` | No | `boolean` | Sin restricción adicional declarada | Marcado como bot | `true` |
| `dataClassificationConceptId` | No | `string` | formato `uuid` | Clasificación de dato (concept id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/client-contexts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ClientContextResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ClientContextResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "sessionJourneyId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `sessionJourneyId` | Sí | `string` | formato `uuid` | Journey de sesión creado o enlazado | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sujeto de analítica no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 404 | `NOT_FOUND` | Journey de sesión no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La sesión autenticada no está registrada | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/telemetry/client-contexts"
}
```

---

## 22. POST /telemetry/client-errors

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-client-errors`
- **Nombre:** Registra un lote de errores del cliente (saneados en el servidor)
- **Operation ID:** `TelemetryClientErrorsController_capture`
- **Autenticación:** Pública
- **Implementación:** [TelemetryClientErrorsController.capture](../../src/modules/telemetry/presentation/controllers/telemetry-client-errors.controller.ts)

### Descripción de negocio

Registra un lote de errores del cliente (saneados en el servidor). Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/client-errors` en `TelemetryClientErrorsController_capture`. El controlador delega en `TelemetryClientErrorsService.ingest`. Valida el body como `CaptureClientErrorsDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CaptureClientErrorsDto`; los campos opcionales se omiten.

```http
POST /telemetry/client-errors HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "errors": [
    {
      "errorClass": "JS",
      "errorType": "TypeError",
      "appVersion": "valor-ejemplo"
    }
  ]
}
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle(CLIENT_ERRORS_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `errors` | Sí | `array<ClientErrorItemDto>` | mínimo 1 elemento(s); máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"errorClass":"JS","errorType":"TypeError","message":"valor-ejemplo","routeTemplate":"valor-ejemplo","occurredAt":"2026-07-31T12:00:00.000Z","portal":"WEB","httpMethod":"valor-ej","apiRouteTemplate":"valor-ejemplo","httpStatus":1,"apiErrorCode":"CODIGO_EJEMPLO","requestId":"00000000-0000-4000-8000-000000000001","supportCode":"CODIGO_EJEMPLO","appVersion":"valor-ejemplo","buildId":"00000000-0000-4000-8000-000000000001","screenSize":"movil","isOnline":true,"suppressedCount":1,"fingerprint":"valor-ejemplo"}]` |
| `errors[].errorClass` | Sí | `string` | valores: `JS`, `PROMISE`, `HTTP`, `ROUTE`, `CHUNK`, `HYDRATION`, `TEMPLATE`, `NATIVE` | Sin descripción específica en el contrato OpenAPI. | `JS` |
| `errors[].errorType` | Sí | `string` | longitud mínima 1; longitud máxima 120 | Sin descripción específica en el contrato OpenAPI. | `TypeError` |
| `errors[].message` | No | `string` | longitud máxima 500 | Sin stack ni cuerpo; se redacta de nuevo en el servidor. | `valor-ejemplo` |
| `errors[].routeTemplate` | No | `string` | longitud máxima 300 | Plantilla de ruta sin ids (misma lista cerrada que la ruta anónima). | `valor-ejemplo` |
| `errors[].occurredAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `errors[].portal` | No | `string` | valores: `WEB`, `MOBILE` | Sin descripción específica en el contrato OpenAPI. | `WEB` |
| `errors[].httpMethod` | No | `string` | longitud máxima 8 | Sin descripción específica en el contrato OpenAPI. | `valor-ej` |
| `errors[].apiRouteTemplate` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `errors[].httpStatus` | No | `number` | mínimo 0; máximo 599 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `errors[].apiErrorCode` | No | `string` | longitud máxima 60 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `errors[].requestId` | No | `string` | longitud máxima 80 | X-Request-Id de la respuesta; enlaza con observability.error_events. | `00000000-0000-4000-8000-000000000001` |
| `errors[].supportCode` | No | `string` | longitud máxima 40 | Código dictable E-… que ve la persona. | `CODIGO_EJEMPLO` |
| `errors[].appVersion` | Sí | `string` | longitud mínima 1; longitud máxima 40 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `errors[].buildId` | No | `string` | longitud máxima 40 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `errors[].screenSize` | No | `string` | valores: `movil`, `tableta`, `escritorio` | Sin descripción específica en el contrato OpenAPI. | `movil` |
| `errors[].isOnline` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `errors[].suppressedCount` | No | `number` | mínimo 0; máximo 100000 | Repeticiones suprimidas en el cliente. | `1` |
| `errors[].fingerprint` | No | `string` | longitud máxima 64 | Se ignora: la huella la calcula el servidor. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/client-errors HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "errors": [
    {
      "errorClass": "JS",
      "errorType": "TypeError",
      "message": "valor-ejemplo",
      "routeTemplate": "valor-ejemplo",
      "occurredAt": "2026-07-31T12:00:00.000Z",
      "portal": "WEB",
      "httpMethod": "valor-ej",
      "apiRouteTemplate": "valor-ejemplo",
      "httpStatus": 1,
      "apiErrorCode": "CODIGO_EJEMPLO",
      "requestId": "00000000-0000-4000-8000-000000000001",
      "supportCode": "CODIGO_EJEMPLO",
      "appVersion": "valor-ejemplo",
      "buildId": "00000000-0000-4000-8000-000000000001",
      "screenSize": "movil",
      "isOnline": true,
      "suppressedCount": 1,
      "fingerprint": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(CLIENT_ERRORS_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/telemetry/client-errors"
}
```

---

## 23. POST /telemetry/conversion-events

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-events`
- **Nombre:** Registrar evento de conversión con atribución
- **Operation ID:** `TelemetryEventsController_recordConversion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryEventsController.recordConversion](../../src/modules/telemetry/presentation/controllers/telemetry-events.controller.ts)

### Descripción de negocio

Registrar evento de conversión con atribución. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/conversion-events` en `TelemetryEventsController_recordConversion`. El controlador delega en `TelemetryEventsService.recordConversion`. Valida el body como `CreateConversionEventDto` y consume `application/json`. El tipo de retorno estático es `Promise<ConversionEventResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateConversionEventDto`; los campos opcionales se omiten.

```http
POST /telemetry/conversion-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "funnelDefinitionId": "00000000-0000-4000-8000-000000000001",
  "analyticsSubjectId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `funnelDefinitionId` | Sí | `string` | formato `uuid` | Funnel activo alcanzado | `00000000-0000-4000-8000-000000000001` |
| `analyticsSubjectId` | Sí | `string` | formato `uuid` | Sujeto de analítica que convierte | `00000000-0000-4000-8000-000000000001` |
| `sessionJourneyId` | No | `string` | formato `uuid` | Journey de sesión asociado | `00000000-0000-4000-8000-000000000001` |
| `completionEventId` | No | `string` | formato `uuid` | Evento de actividad que completó el último paso | `00000000-0000-4000-8000-000000000001` |
| `attributionJson` | No | `object` | Sin restricción adicional declarada | Datos de atribución (JSON) | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/conversion-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "funnelDefinitionId": "00000000-0000-4000-8000-000000000001",
  "analyticsSubjectId": "00000000-0000-4000-8000-000000000001",
  "sessionJourneyId": "00000000-0000-4000-8000-000000000001",
  "completionEventId": "00000000-0000-4000-8000-000000000001",
  "attributionJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ConversionEventResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConversionEventResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "funnelDefinitionId": "00000000-0000-4000-8000-000000000001",
  "analyticsSubjectId": "00000000-0000-4000-8000-000000000001",
  "convertedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `funnelDefinitionId` | Sí | `string` | formato `uuid` | Identificador asociado a funnel definition. | `00000000-0000-4000-8000-000000000001` |
| `analyticsSubjectId` | Sí | `string` | formato `uuid` | Identificador asociado a analytics subject. | `00000000-0000-4000-8000-000000000001` |
| `convertedAt` | Sí | `string` | formato `date-time` | Valor de converted at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Funnel no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 404 | `NOT_FOUND` | Sujeto de analítica no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 404 | `NOT_FOUND` | Journey de sesión no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 404 | `NOT_FOUND` | Evento de actividad no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
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
  "path": "/telemetry/conversion-events"
}
```

---

## 24. POST /telemetry/disclosure-acceptances

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-consent`
- **Nombre:** Registrar aceptación de disclosure por usuario/sesión
- **Operation ID:** `TelemetryConsentController_acceptDisclosure`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryConsentController.acceptDisclosure](../../src/modules/telemetry/presentation/controllers/telemetry-consent.controller.ts)

### Descripción de negocio

Registrar aceptación de disclosure por usuario/sesión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/disclosure-acceptances` en `TelemetryConsentController_acceptDisclosure`. El controlador delega en `TelemetryConsentService.acceptDisclosure`. Valida el body como `CreateDisclosureAcceptanceDto` y consume `application/json`. El tipo de retorno estático es `Promise<DisclosureAcceptanceResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDisclosureAcceptanceDto`; los campos opcionales se omiten.

```http
POST /telemetry/disclosure-acceptances HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "trackingDisclosureVersionId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `trackingDisclosureVersionId` | Sí | `string` | formato `uuid` | Versión de disclosure aceptada | `00000000-0000-4000-8000-000000000001` |
| `sessionId` | No | `string` | formato `uuid` | Sesión asociada | `00000000-0000-4000-8000-000000000001` |
| `ipPrefixHash` | No | `string` | longitud máxima 200 | Hash del prefijo de IP (sin PII en claro) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `userAgentHash` | No | `string` | longitud máxima 200 | Hash del user agent (sin PII en claro) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/disclosure-acceptances HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "trackingDisclosureVersionId": "00000000-0000-4000-8000-000000000001",
  "sessionId": "00000000-0000-4000-8000-000000000001",
  "ipPrefixHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "userAgentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<DisclosureAcceptanceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DisclosureAcceptanceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "trackingDisclosureVersionId": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "acceptedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `trackingDisclosureVersionId` | Sí | `string` | formato `uuid` | Identificador asociado a tracking disclosure version. | `00000000-0000-4000-8000-000000000001` |
| `userId` | Sí | `string` | formato `uuid` | Identificador asociado a user. | `00000000-0000-4000-8000-000000000001` |
| `acceptedAt` | Sí | `string` | formato `date-time` | Valor de accepted at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión de disclosure no encontrada | Excepción explícita en src/modules/telemetry/application/services/telemetry-consent.service.ts |
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
  "path": "/telemetry/disclosure-acceptances"
}
```

---

## 25. POST /telemetry/disclosure-versions

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-governance`
- **Nombre:** Publicar versión de disclosure de tracking
- **Operation ID:** `TelemetryGovernanceController_publishDisclosure`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryGovernanceController.publishDisclosure](../../src/modules/telemetry/presentation/controllers/telemetry-governance.controller.ts)

### Descripción de negocio

Publicar versión de disclosure de tracking. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/disclosure-versions` en `TelemetryGovernanceController_publishDisclosure`. El controlador delega en `TelemetryGovernanceService.publishDisclosure`. Valida el body como `CreateDisclosureVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<DisclosureVersionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDisclosureVersionDto`; los campos opcionales se omiten.

```http
POST /telemetry/disclosure-versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "documentCode": "CODIGO_EJEMPLO"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `documentCode` | Sí | `string` | longitud máxima 100 | Código del documento de disclosure | `CODIGO_EJEMPLO` |
| `versionNumber` | No | `number` | mínimo 1 | Número de versión | `1` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Jurisdicción (concept id) | `00000000-0000-4000-8000-000000000001` |
| `fileId` | No | `string` | formato `uuid` | Documento en object storage (file id) | `00000000-0000-4000-8000-000000000001` |
| `contentHash` | No | `string` | longitud máxima 200 | Hash del contenido del documento | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/disclosure-versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "documentCode": "CODIGO_EJEMPLO",
  "versionNumber": 1,
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "fileId": "00000000-0000-4000-8000-000000000001",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<DisclosureVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DisclosureVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "documentCode": "CODIGO_EJEMPLO",
  "versionNumber": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `documentCode` | Sí | `string` | Sin restricción adicional declarada | Valor de document code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe esa versión del documento | Excepción explícita en src/modules/telemetry/application/services/telemetry-governance.service.ts |
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
  "path": "/telemetry/disclosure-versions"
}
```

---

## 26. POST /telemetry/event-schemas

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-governance`
- **Nombre:** Registrar esquema de evento de actividad (versionado)
- **Operation ID:** `TelemetryGovernanceController_registerEventSchema`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryGovernanceController.registerEventSchema](../../src/modules/telemetry/presentation/controllers/telemetry-governance.controller.ts)

### Descripción de negocio

Registrar esquema de evento de actividad (versionado). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/event-schemas` en `TelemetryGovernanceController_registerEventSchema`. El controlador delega en `TelemetryGovernanceService.registerEventSchema`. Valida el body como `CreateEventSchemaDto` y consume `application/json`. El tipo de retorno estático es `Promise<EventSchemaResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateEventSchemaDto`; los campos opcionales se omiten.

```http
POST /telemetry/event-schemas HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "eventName": "Nombre de ejemplo",
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `eventName` | Sí | `string` | longitud máxima 200 | Nombre del evento de actividad | `Nombre de ejemplo` |
| `schemaVersion` | No | `number` | mínimo 1 | Versión del esquema | `1` |
| `purposeDefinitionId` | Sí | `string` | formato `uuid` | Propósito de tracking asociado (activo) | `00000000-0000-4000-8000-000000000001` |
| `portalTypeConceptId` | No | `string` | formato `uuid` | Tipo de portal (concept id) | `00000000-0000-4000-8000-000000000001` |
| `propertySchemaJson` | No | `object` | Sin restricción adicional declarada | JSON Schema de propiedades permitidas | `{}` |
| `prohibitedPropertyPatternsJson` | No | `object` | Sin restricción adicional declarada | Patrones de propiedades prohibidas (PHI/free-text) | `{}` |
| `piiClassificationConceptId` | No | `string` | formato `uuid` | Clasificación PII (concept id) | `00000000-0000-4000-8000-000000000001` |
| `phiAllowed` | No | `boolean` | Sin restricción adicional declarada | PHI permitido en el esquema | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/event-schemas HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<EventSchemaResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EventSchemaResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "eventName": "Nombre de ejemplo",
  "schemaVersion": 1,
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `eventName` | Sí | `string` | Sin restricción adicional declarada | Valor de event name mantenido por la instancia. | `Nombre de ejemplo` |
| `schemaVersion` | Sí | `number` | Sin restricción adicional declarada | Valor de schema version mantenido por la instancia. | `1` |
| `purposeDefinitionId` | Sí | `string` | formato `uuid` | Identificador asociado a purpose definition. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Propósito de tracking no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-governance.service.ts |
| 409 | `CONFLICT` | Ya existe un esquema con ese nombre y versión | Excepción explícita en src/modules/telemetry/application/services/telemetry-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El propósito de tracking no está activo | Excepción explícita en src/modules/telemetry/application/services/telemetry-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/telemetry/event-schemas"
}
```

---

## 27. POST /telemetry/funnels

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-governance`
- **Nombre:** Definir funnel y sus pasos
- **Operation ID:** `TelemetryGovernanceController_defineFunnel`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryGovernanceController.defineFunnel](../../src/modules/telemetry/presentation/controllers/telemetry-governance.controller.ts)

### Descripción de negocio

Definir funnel y sus pasos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/funnels` en `TelemetryGovernanceController_defineFunnel`. El controlador delega en `TelemetryGovernanceService.defineFunnel`. Valida el body como `CreateFunnelDto` y consume `application/json`. El tipo de retorno estático es `Promise<FunnelResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFunnelDto`; los campos opcionales se omiten.

```http
POST /telemetry/funnels HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `funnelCode` | Sí | `string` | longitud máxima 100 | Código único del funnel | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Nombre del funnel | `Nombre de ejemplo` |
| `purposeDefinitionId` | Sí | `string` | formato `uuid` | Propósito de tracking activo | `00000000-0000-4000-8000-000000000001` |
| `portalTypeConceptId` | No | `string` | formato `uuid` | Tipo de portal (concept id) | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | No | `number` | mínimo 1 | Número de versión | `1` |
| `steps` | Sí | `array<FunnelStepDto>` | mínimo 1 elemento(s) | Pasos del funnel (>= 1) | `[{"stepNumber":1,"eventSchemaDefinitionId":"00000000-0000-4000-8000-000000000001","qualificationRuleJson":{}}]` |
| `steps[].stepNumber` | No | `number` | mínimo 1 | Número de paso (contiguo desde 1). Si se omite se asigna por orden. | `1` |
| `steps[].eventSchemaDefinitionId` | Sí | `string` | formato `uuid` | Esquema de evento que cualifica el paso | `00000000-0000-4000-8000-000000000001` |
| `steps[].qualificationRuleJson` | No | `object` | Sin restricción adicional declarada | Regla de cualificación (JSON) | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/funnels HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FunnelResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<FunnelResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FunnelResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "funnelCode": "CODIGO_EJEMPLO",
  "versionNumber": 1,
  "stepCount": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `funnelCode` | Sí | `string` | Sin restricción adicional declarada | Valor de funnel code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `stepCount` | Sí | `number` | Sin restricción adicional declarada | Número de pasos definidos | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Propósito de tracking no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-governance.service.ts |
| 409 | `CONFLICT` | El código de funnel ya existe | Excepción explícita en src/modules/telemetry/application/services/telemetry-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Esquema de evento de un paso no existe | Excepción explícita en src/modules/telemetry/application/services/telemetry-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/telemetry/funnels"
}
```

---

## 28. POST /telemetry/onboarding-events

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-onboarding-analytics`
- **Nombre:** Captura eventos de telemetría de alta y avance en formularios de registro
- **Operation ID:** `TelemetryOnboardingAnalyticsController_recordEvents`
- **Autenticación:** Pública
- **Implementación:** [TelemetryOnboardingAnalyticsController.recordEvents](../../src/modules/telemetry/presentation/controllers/telemetry-onboarding-analytics.controller.ts)

### Descripción de negocio

Captura eventos de telemetría de alta y avance en formularios de registro. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/onboarding-events` en `TelemetryOnboardingAnalyticsController_recordEvents`. El controlador delega en `TelemetryOnboardingAnalyticsService.recordEvents`. Valida el body como `IngestOnboardingEventsDto` y consume `application/json`. El tipo de retorno estático es `{ ok: boolean }`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IngestOnboardingEventsDto`; los campos opcionales se omiten.

```http
POST /telemetry/onboarding-events HTTP/1.1
Host: localhost:3000
Content-Type: application/json

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

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `events` | Sí | `array<OnboardingEventDto>` | máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"eventType":"start","formType":"valor-ejemplo","draftId":"00000000-0000-4000-8000-000000000001","stepIndex":1,"stepKey":"valor-ejemplo","fieldKey":"valor-ejemplo","interactionType":"focus","errorCategory":"valor-ejemplo","durationMs":1,"timestamp":"valor-ejemplo"}]` |
| `events[].eventType` | Sí | `string` | valores: `start`, `step_view`, `field_interaction`, `field_error`, `abandon`, `complete` | Sin descripción específica en el contrato OpenAPI. | `start` |
| `events[].formType` | Sí | `string` | longitud máxima 40 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `events[].draftId` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `events[].stepIndex` | Sí | `number` | mínimo 0; máximo 100 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `events[].stepKey` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `events[].fieldKey` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `events[].interactionType` | No | `string` | valores: `focus`, `blur`, `change`, `error` | Sin descripción específica en el contrato OpenAPI. | `focus` |
| `events[].errorCategory` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `events[].durationMs` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `events[].timestamp` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/onboarding-events HTTP/1.1
Host: localhost:3000
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `{ ok: boolean }` | No |
| 400 | Operación completada correctamente. | `{ ok: boolean }` | No |
| 409 | Operación completada correctamente. | `{ ok: boolean }` | No |
| 413 | Operación completada correctamente. | `{ ok: boolean }` | No |
| 422 | Operación completada correctamente. | `{ ok: boolean }` | No |
| 429 | Operación completada correctamente. | `{ ok: boolean }` | No |
| 500 | Operación completada correctamente. | `{ ok: boolean }` | No |
| 504 | Operación completada correctamente. | `{ ok: boolean }` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ ok: boolean }`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
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
  "path": "/telemetry/onboarding-events"
}
```

---

## 29. POST /telemetry/retention/purge

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-retention`
- **Nombre:** Purga por retención del propósito: eventos de uso, propiedades y errores del cliente
- **Operation ID:** `TelemetryRetentionController_purge`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryRetentionController.purge](../../src/modules/telemetry/presentation/controllers/telemetry-retention.controller.ts)

### Descripción de negocio

Purga por retención del propósito: eventos de uso, propiedades y errores del cliente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/retention/purge` en `TelemetryRetentionController_purge`. El controlador delega en `TelemetryRetentionService.purge`. Valida el body como `RetentionPurgeDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RetentionPurgeDto`; los campos opcionales se omiten.

```http
POST /telemetry/retention/purge HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `batchSize` | No | `number` | mínimo 1; máximo 5000 | Sin descripción específica en el contrato OpenAPI. | `1000` |
| `maxBatches` | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en el contrato OpenAPI. | `10` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/retention/purge HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "batchSize": 1000,
  "maxBatches": 10
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
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
  "path": "/telemetry/retention/purge"
}
```

---

## 30. POST /telemetry/session-journeys/{id}/close

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-events`
- **Nombre:** Cerrar journey de sesión y consolidar métricas
- **Operation ID:** `TelemetryEventsController_closeJourney`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryEventsController.closeJourney](../../src/modules/telemetry/presentation/controllers/telemetry-events.controller.ts)

### Descripción de negocio

Cerrar journey de sesión y consolidar métricas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/session-journeys/{id}/close` en `TelemetryEventsController_closeJourney`. El controlador delega en `TelemetryEventsService.closeJourney`. Valida el body como `CloseJourneyDto` y consume `application/json`. El tipo de retorno estático es `Promise<JourneyResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CloseJourneyDto`; los campos opcionales se omiten.

```http
POST /telemetry/session-journeys/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `exitEventId` | No | `string` | formato `uuid` | Evento de salida | `00000000-0000-4000-8000-000000000001` |
| `eventCount` | No | `number` | mínimo 0 | Conteo final de eventos (si el worker lo consolida) | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/session-journeys/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "exitEventId": "00000000-0000-4000-8000-000000000001",
  "eventCount": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<JourneyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `JourneyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "journeyStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "endedAt": "2026-07-31T12:00:00.000Z",
  "eventCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `journeyStatusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a journey status concept. | `00000000-0000-4000-8000-000000000001` |
| `endedAt` | No | `string` | formato `date-time` | Valor de ended at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `eventCount` | Sí | `number` | Sin restricción adicional declarada | Valor de event count mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Journey de sesión no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 404 | `NOT_FOUND` | Evento de actividad no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El journey ya está cerrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/telemetry/session-journeys/{id}/close"
}
```

---

## 31. POST /telemetry/tracking-consents

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-consent`
- **Nombre:** Otorgar consentimiento de tracking por propósito
- **Operation ID:** `TelemetryConsentController_grantConsent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryConsentController.grantConsent](../../src/modules/telemetry/presentation/controllers/telemetry-consent.controller.ts)

### Descripción de negocio

Otorgar consentimiento de tracking por propósito. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/tracking-consents` en `TelemetryConsentController_grantConsent`. El controlador delega en `TelemetryConsentService.grantConsent`. Valida el body como `CreateTrackingConsentDto` y consume `application/json`. El tipo de retorno estático es `Promise<TrackingConsentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTrackingConsentDto`; los campos opcionales se omiten.

```http
POST /telemetry/tracking-consents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `purposeDefinitionId` | Sí | `string` | formato `uuid` | Propósito de tracking (requiere consentimiento) | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Jurisdicción (concept id) | `00000000-0000-4000-8000-000000000001` |
| `consentVersion` | No | `string` | longitud máxima 50 | Versión del consentimiento | `valor-ejemplo` |
| `evidenceHash` | No | `string` | longitud máxima 200 | Hash de la evidencia de consentimiento | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/tracking-consents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "consentVersion": "valor-ejemplo",
  "evidenceHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TrackingConsentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "decisionConceptId": "00000000-0000-4000-8000-000000000001",
  "grantedAt": "2026-07-31T12:00:00.000Z",
  "withdrawnAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `userId` | Sí | `string` | formato `uuid` | Identificador asociado a user. | `00000000-0000-4000-8000-000000000001` |
| `purposeDefinitionId` | Sí | `string` | formato `uuid` | Identificador asociado a purpose definition. | `00000000-0000-4000-8000-000000000001` |
| `decisionConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a decision concept. | `00000000-0000-4000-8000-000000000001` |
| `grantedAt` | No | `string` | formato `date-time` | Valor de granted at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `withdrawnAt` | No | `string` | formato `date-time` | Valor de withdrawn at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Propósito de tracking no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-consent.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El propósito no requiere consentimiento | Excepción explícita en src/modules/telemetry/application/services/telemetry-consent.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/telemetry/tracking-consents"
}
```

---

## 32. POST /telemetry/tracking-consents/{id}/withdraw

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-consent`
- **Nombre:** Retirar consentimiento y desactivar sujeto (cascada)
- **Operation ID:** `TelemetryConsentController_withdrawConsent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryConsentController.withdrawConsent](../../src/modules/telemetry/presentation/controllers/telemetry-consent.controller.ts)

### Descripción de negocio

Retirar consentimiento y desactivar sujeto (cascada). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/tracking-consents/{id}/withdraw` en `TelemetryConsentController_withdrawConsent`. El controlador delega en `TelemetryConsentService.withdrawConsent`. No recibe body. El tipo de retorno estático es `Promise<TrackingConsentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /telemetry/tracking-consents/00000000-0000-4000-8000-000000000001/withdraw HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /telemetry/tracking-consents/00000000-0000-4000-8000-000000000001/withdraw HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<TrackingConsentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TrackingConsentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "decisionConceptId": "00000000-0000-4000-8000-000000000001",
  "grantedAt": "2026-07-31T12:00:00.000Z",
  "withdrawnAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `userId` | Sí | `string` | formato `uuid` | Identificador asociado a user. | `00000000-0000-4000-8000-000000000001` |
| `purposeDefinitionId` | Sí | `string` | formato `uuid` | Identificador asociado a purpose definition. | `00000000-0000-4000-8000-000000000001` |
| `decisionConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a decision concept. | `00000000-0000-4000-8000-000000000001` |
| `grantedAt` | No | `string` | formato `date-time` | Valor de granted at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `withdrawnAt` | No | `string` | formato `date-time` | Valor de withdrawn at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Consentimiento no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-consent.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay un consentimiento vigente que retirar | Excepción explícita en src/modules/telemetry/application/services/telemetry-consent.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/telemetry/tracking-consents/{id}/withdraw"
}
```

---

## 33. GET /telemetry/tracking-consents/me

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-consent`
- **Nombre:** Estado vigente de mi consentimiento de tracking
- **Operation ID:** `TelemetryConsentController_getMyConsent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryConsentController.getMyConsent](../../src/modules/telemetry/presentation/controllers/telemetry-consent.controller.ts)

### Descripción de negocio

Estado vigente de mi consentimiento de tracking. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Estado de mi consentimiento de tracking para un propósito.

### Descripción del sistema

NestJS resuelve `GET /telemetry/tracking-consents/me` en `TelemetryConsentController_getMyConsent`. El controlador delega en `TelemetryConsentService.getMyStatus`. No recibe body. El tipo de retorno estático es `Promise<MyTrackingConsentStatusDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `purposeDefinitionId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /telemetry/tracking-consents/me?purposeDefinitionId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /telemetry/tracking-consents/me?purposeDefinitionId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MyTrackingConsentStatusDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<MyTrackingConsentStatusDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MyTrackingConsentStatusDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MyTrackingConsentStatusDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MyTrackingConsentStatusDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MyTrackingConsentStatusDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<MyTrackingConsentStatusDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MyTrackingConsentStatusDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "status": "GRANTED",
  "consentId": "00000000-0000-4000-8000-000000000001",
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `GRANTED`, `WITHDRAWN`, `NONE` | `GRANTED` si la última decisión es el otorgamiento, `WITHDRAWN` si es el retiro y `NONE` si nunca decidió. | `GRANTED` |
| `consentId` | No | `string` | formato `uuid` | Consentimiento que hay que pasar a `POST /telemetry/tracking-consents/:id/withdraw` para retirarlo. Sólo viene con `GRANTED`. | `00000000-0000-4000-8000-000000000001` |
| `purposeDefinitionId` | Sí | `string` | formato `uuid` | Propósito consultado. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/telemetry/tracking-consents/me"
}
```

---

## 34. POST /telemetry/tracking-purposes

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-governance`
- **Nombre:** Definir propósito de tracking y base legal
- **Operation ID:** `TelemetryGovernanceController_definePurpose`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryGovernanceController.definePurpose](../../src/modules/telemetry/presentation/controllers/telemetry-governance.controller.ts)

### Descripción de negocio

Definir propósito de tracking y base legal. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/tracking-purposes` en `TelemetryGovernanceController_definePurpose`. El controlador delega en `TelemetryGovernanceService.definePurpose`. Valida el body como `CreateTrackingPurposeDto` y consume `application/json`. El tipo de retorno estático es `Promise<TrackingPurposeResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateTrackingPurposeDto`; los campos opcionales se omiten.

```http
POST /telemetry/tracking-purposes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `purposeCode` | Sí | `string` | longitud máxima 100 | Código único del propósito de tracking | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Nombre legible del propósito | `Nombre de ejemplo` |
| `purposeCategoryConceptId` | No | `string` | formato `uuid` | Categoría del propósito (concept id) | `00000000-0000-4000-8000-000000000001` |
| `legalBasisConceptId` | No | `string` | formato `uuid` | Base legal (concept id) | `00000000-0000-4000-8000-000000000001` |
| `requiresConsent` | No | `boolean` | Sin restricción adicional declarada | Requiere consentimiento explícito | `true` |
| `permitsMarketingUse` | No | `boolean` | Sin restricción adicional declarada | Permite uso de marketing | `true` |
| `permitsCrossTenantAggregation` | No | `boolean` | Sin restricción adicional declarada | Permite agregación cross-tenant | `true` |
| `defaultRetentionDays` | No | `number` | mínimo 0; máximo 36500 | Días de retención por defecto | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/tracking-purposes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<TrackingPurposeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TrackingPurposeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "purposeCode": "CODIGO_EJEMPLO",
  "versionNumber": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "requiresConsent": true,
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `purposeCode` | Sí | `string` | Sin restricción adicional declarada | Valor de purpose code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `requiresConsent` | Sí | `boolean` | Sin restricción adicional declarada | Requiere consentimiento | `true` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El código de propósito ya existe | Excepción explícita en src/modules/telemetry/application/services/telemetry-governance.service.ts |
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
  "path": "/telemetry/tracking-purposes"
}
```

---

## 35. POST /telemetry/web-vitals

- **Módulo:** `telemetry`
- **Etiqueta OpenAPI:** `telemetry-events`
- **Nombre:** Registrar métricas Core Web Vitals por ruta (batch)
- **Operation ID:** `TelemetryEventsController_recordWebVitals`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TelemetryEventsController.recordWebVitals](../../src/modules/telemetry/presentation/controllers/telemetry-events.controller.ts)

### Descripción de negocio

Registrar métricas Core Web Vitals por ruta (batch). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /telemetry/web-vitals` en `TelemetryEventsController_recordWebVitals`. El controlador delega en `TelemetryEventsService.recordWebVitals`. Valida el body como `RecordWebVitalsDto` y consume `application/json`. El tipo de retorno estático es `Promise<WebVitalsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordWebVitalsDto`; los campos opcionales se omiten.

```http
POST /telemetry/web-vitals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "metrics": [
    {
      "metric": "LCP",
      "metricValue": 1
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `metrics` | Sí | `array<WebVitalItemDto>` | mínimo 1 elemento(s); máximo 200 elemento(s) | Lote de métricas CWV | `[{"metric":"LCP","metricValue":1,"rating":"GOOD","routeTemplate":"valor-ejemplo","portalTypeConceptId":"00000000-0000-4000-8000-000000000001","userActivityEventId":"00000000-0000-4000-8000-000000000001","clientContextId":"00000000-0000-4000-8000-000000000001","sessionJourneyId":"00000000-0000-4000-8000-000000000001","analyticsSubjectId":"00000000-0000-4000-8000-000000000001"}]` |
| `metrics[].metric` | Sí | `string` | valores: `LCP`, `INP`, `FID`, `CLS`, `TTFB`, `FCP` | Métrica CWV | `LCP` |
| `metrics[].metricValue` | Sí | `number` | mínimo 0 | Valor de la métrica (>= 0) | `1` |
| `metrics[].rating` | No | `string` | valores: `GOOD`, `NEEDS_IMPROVEMENT`, `POOR` | Rating | `GOOD` |
| `metrics[].routeTemplate` | No | `string` | longitud máxima 300 | Plantilla de ruta | `valor-ejemplo` |
| `metrics[].portalTypeConceptId` | No | `string` | formato `uuid` | Tipo de portal (concept id) | `00000000-0000-4000-8000-000000000001` |
| `metrics[].userActivityEventId` | No | `string` | formato `uuid` | Evento de actividad relacionado | `00000000-0000-4000-8000-000000000001` |
| `metrics[].clientContextId` | No | `string` | formato `uuid` | Contexto de cliente | `00000000-0000-4000-8000-000000000001` |
| `metrics[].sessionJourneyId` | No | `string` | formato `uuid` | Journey de sesión | `00000000-0000-4000-8000-000000000001` |
| `metrics[].analyticsSubjectId` | No | `string` | formato `uuid` | Sujeto de analítica | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /telemetry/web-vitals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<WebVitalsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `WebVitalsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "inserted": 1,
  "ids": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `inserted` | Sí | `number` | Sin restricción adicional declarada | Valor de inserted mantenido por la instancia. | `1` |
| `ids` | Sí | `array<string>` | Sin restricción adicional declarada | Valor de ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Journey de sesión no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 404 | `NOT_FOUND` | Sujeto de analítica no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 404 | `NOT_FOUND` | Evento de actividad no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
| 404 | `NOT_FOUND` | Contexto de cliente no encontrado | Excepción explícita en src/modules/telemetry/application/services/telemetry-events.service.ts |
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
  "path": "/telemetry/web-vitals"
}
```

---

