<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `time_series`

Referencia exhaustiva de 14 operación(es) del módulo `time_series`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `time_series`
- **Controladores:** `SeriesController`, `TimescaleAdminController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /ts/admin/compression/run](#1-post-ts-admin-compression-run) — Comprimir los chunks más antiguos que el umbral
2. [POST /ts/admin/hypertables](#2-post-ts-admin-hypertables) — Convertir una serie en hypertable y declarar su particionado
3. [PATCH /ts/admin/hypertables/{table}](#3-patch-ts-admin-hypertables-table) — Ajustar la anchura temporal del chunk
4. [POST /ts/admin/retention/policies](#4-post-ts-admin-retention-policies) — Aplicar la retención descartando chunks fuera de ventana
5. [POST /ts/admin/rollups/{name}/refresh](#5-post-ts-admin-rollups-name-refresh) — Materializar la ventana de un agregado continuo
6. [POST /ts/admin/rollups/audit-daily/refresh](#6-post-ts-admin-rollups-audit-daily-refresh) — Refrescar el rollup de conteos diarios de auditoría
7. [POST /ts/ads/events/batch-ingest](#7-post-ts-ads-events-batch-ingest) — Ingerir eventos de entrega de publicidad
8. [POST /ts/devices/{deviceId}/readings/ingest](#8-post-ts-devices-deviceid-readings-ingest) — Ingerir lecturas de un dispositivo médico
9. [POST /ts/location/pings/batch-ingest](#9-post-ts-location-pings-batch-ingest) — Ingerir pings de ubicación
10. [POST /ts/metrics/{dataset}/batch-ingest](#10-post-ts-metrics-dataset-batch-ingest) — Ingerir métricas de runtime de IA, pipeline o SLI
11. [POST /ts/normalize/run](#11-post-ts-normalize-run) — Normalizar una lectura cruda y promoverla al registro clínico
12. [POST /ts/series/{seriesId}/backfill/governed](#12-post-ts-series-seriesid-backfill-governed) — Backfill gobernado de una serie
13. [POST /ts/series/{seriesId}/points/batch-ingest](#13-post-ts-series-seriesid-points-batch-ingest) — Ingerir un lote de puntos en una serie
14. [GET /ts/series/{seriesId}/query](#14-get-ts-series-seriesid-query) — Consultar un rango con downsampling

---

## 1. POST /ts/admin/compression/run

- **Módulo:** `time_series`
- **Etiqueta OpenAPI:** `time_series`
- **Nombre:** Comprimir los chunks más antiguos que el umbral
- **Operation ID:** `TimescaleAdminController_runCompression`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TimescaleAdminController.runCompression](../../src/modules/time_series/controllers/timescale-admin.controller.ts)

### Descripción de negocio

Un chunk cada vez y con tope por pasada; el chunk comprimido queda de sólo lectura.


### Descripción del sistema

NestJS resuelve `POST /ts/admin/compression/run` en `TimescaleAdminController_runCompression`. El controlador delega en `TimescaleAdminService.runCompression`. Valida el body como `RunCompressionDto` y consume `application/json`. El tipo de retorno estático es `Promise<CompressionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunCompressionDto`; los campos opcionales se omiten.

```http
POST /ts/admin/compression/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "table": "ads_delivery_event_series",
  "olderThan": "valor-ejemplo",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `DATA_PLATFORM_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `table` | Sí | `string` | valores: `ads_delivery_event_series`, `ai_runtime_metric_series`, `application_tracking_series`, `audit_access_metric_series`, `device_raw_reading_series`, `ingestion_pipeline_metric_series`, `lab_analyzer_event_series`, `location_ping_series`, `normalized_vital_series`, `payment_gateway_metric_series`, `service_sli_series`, `telemetry_event_series` | Sin descripción específica en el contrato OpenAPI. | `ads_delivery_event_series` |
| `olderThan` | Sí | `string` | longitud máxima 50 | Comprime los chunks más antiguos que este intervalo | `valor-ejemplo` |
| `batchId` | Sí | `string` | formato `uuid` | Lote al que se atribuyen las métricas | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `maxChunks` | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en el contrato OpenAPI. | `10` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ts/admin/compression/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "table": "ads_delivery_event_series",
  "olderThan": "valor-ejemplo",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "maxChunks": 10
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CompressionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CompressionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CompressionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CompressionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CompressionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CompressionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CompressionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CompressionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CompressionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CompressionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "table": "valor-ejemplo",
  "chunksCompressed": 1,
  "remainingChunks": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `table` | Sí | `string` | Sin restricción adicional declarada | Valor de table mantenido por la instancia. | `valor-ejemplo` |
| `chunksCompressed` | Sí | `number` | Sin restricción adicional declarada | Chunks comprimidos en esta pasada | `1` |
| `remainingChunks` | Sí | `array<string>` | Sin restricción adicional declarada | Chunks candidatos que quedaron para la siguiente | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La serie no declara por qué columnas se segmenta al comprimir. | Excepción explícita en src/modules/time_series/services/timescale-admin.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ts/admin/compression/run"
}
```

---

## 2. POST /ts/admin/hypertables

- **Módulo:** `time_series`
- **Etiqueta OpenAPI:** `time_series`
- **Nombre:** Convertir una serie en hypertable y declarar su particionado
- **Operation ID:** `TimescaleAdminController_configureHypertable`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TimescaleAdminController.configureHypertable](../../src/modules/time_series/controllers/timescale-admin.controller.ts)

### Descripción de negocio

Idempotente; la dimensión de espacio evita que un tenant lea los chunks de todos.


### Descripción del sistema

NestJS resuelve `POST /ts/admin/hypertables` en `TimescaleAdminController_configureHypertable`. El controlador delega en `TimescaleAdminService.configureHypertable`. Valida el body como `ConfigureHypertableDto` y consume `application/json`. El tipo de retorno estático es `Promise<HypertableResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ConfigureHypertableDto`; los campos opcionales se omiten.

```http
POST /ts/admin/hypertables HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "table": "ads_delivery_event_series"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_PLATFORM_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `table` | Sí | `string` | valores: `ads_delivery_event_series`, `ai_runtime_metric_series`, `application_tracking_series`, `audit_access_metric_series`, `device_raw_reading_series`, `ingestion_pipeline_metric_series`, `lab_analyzer_event_series`, `location_ping_series`, `normalized_vital_series`, `payment_gateway_metric_series`, `service_sli_series`, `telemetry_event_series` | Sin descripción específica en el contrato OpenAPI. | `ads_delivery_event_series` |
| `chunkTimeInterval` | No | `string` | longitud máxima 50 | Anchura temporal del chunk, p. ej. `1 day` o `7 days` | `valor-ejemplo` |
| `spaceColumn` | No | `string` | longitud máxima 63 | Columna de la dimensión de espacio, p. ej. `tenant_id` | `valor-ejemplo` |
| `spacePartitions` | No | `number` | mínimo 1; máximo 256 | Sin descripción específica en el contrato OpenAPI. | `4` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ts/admin/hypertables HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "table": "ads_delivery_event_series",
  "chunkTimeInterval": "valor-ejemplo",
  "spaceColumn": "valor-ejemplo",
  "spacePartitions": 4
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<HypertableResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HypertableResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "table": "valor-ejemplo",
  "chunkCount": 1,
  "compressionEnabled": true,
  "spaceDimensionAdded": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `table` | Sí | `string` | Sin restricción adicional declarada | Valor de table mantenido por la instancia. | `valor-ejemplo` |
| `chunkCount` | No | `number` | Sin restricción adicional declarada | Chunks existentes según el catálogo del motor | `1` |
| `compressionEnabled` | No | `boolean` | Sin restricción adicional declarada | Valor de compression enabled mantenido por la instancia. | `true` |
| `spaceDimensionAdded` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si se declaró la dimensión de espacio | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_PLATFORM_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/ts/admin/hypertables"
}
```

---

## 3. PATCH /ts/admin/hypertables/{table}

- **Módulo:** `time_series`
- **Etiqueta OpenAPI:** `time_series`
- **Nombre:** Ajustar la anchura temporal del chunk
- **Operation ID:** `TimescaleAdminController_updateHypertable`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TimescaleAdminController.updateHypertable](../../src/modules/time_series/controllers/timescale-admin.controller.ts)

### Descripción de negocio

Ajustar la anchura temporal del chunk. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /ts/admin/hypertables/{table}` en `TimescaleAdminController_updateHypertable`. El controlador delega en `TimescaleAdminService.updateHypertable`. Valida el body como `UpdateHypertableDto` y consume `application/json`. El tipo de retorno estático es `Promise<HypertableResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `table` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateHypertableDto`; los campos opcionales se omiten.

```http
PATCH /ts/admin/hypertables/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "chunkTimeInterval": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_PLATFORM_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `chunkTimeInterval` | Sí | `string` | longitud máxima 50 | Nueva anchura temporal del chunk | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /ts/admin/hypertables/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "chunkTimeInterval": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<HypertableResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HypertableResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "table": "valor-ejemplo",
  "chunkCount": 1,
  "compressionEnabled": true,
  "spaceDimensionAdded": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `table` | Sí | `string` | Sin restricción adicional declarada | Valor de table mantenido por la instancia. | `valor-ejemplo` |
| `chunkCount` | No | `number` | Sin restricción adicional declarada | Chunks existentes según el catálogo del motor | `1` |
| `compressionEnabled` | No | `boolean` | Sin restricción adicional declarada | Valor de compression enabled mantenido por la instancia. | `true` |
| `spaceDimensionAdded` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si se declaró la dimensión de espacio | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_PLATFORM_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La tabla todavía no es una hypertable; conviértela antes de ajustar sus chunks. | Excepción explícita en src/modules/time_series/services/timescale-admin.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ts/admin/hypertables/{table}"
}
```

---

## 4. POST /ts/admin/retention/policies

- **Módulo:** `time_series`
- **Etiqueta OpenAPI:** `time_series`
- **Nombre:** Aplicar la retención descartando chunks fuera de ventana
- **Operation ID:** `TimescaleAdminController_applyRetention`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TimescaleAdminController.applyRetention](../../src/modules/time_series/controllers/timescale-admin.controller.ts)

### Descripción de negocio

Descarte por metadata, no fila a fila. No sustituye ni toca la cadena de auditoría legal.


### Descripción del sistema

NestJS resuelve `POST /ts/admin/retention/policies` en `TimescaleAdminController_applyRetention`. El controlador delega en `TimescaleAdminService.applyRetention`. Valida el body como `ApplyRetentionDto` y consume `application/json`. El tipo de retorno estático es `Promise<RetentionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ApplyRetentionDto`; los campos opcionales se omiten.

```http
POST /ts/admin/retention/policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "table": "ads_delivery_event_series",
  "olderThan": "valor-ejemplo",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `DATA_PLATFORM_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `table` | Sí | `string` | valores: `ads_delivery_event_series`, `ai_runtime_metric_series`, `application_tracking_series`, `audit_access_metric_series`, `device_raw_reading_series`, `ingestion_pipeline_metric_series`, `lab_analyzer_event_series`, `location_ping_series`, `normalized_vital_series`, `payment_gateway_metric_series`, `service_sli_series`, `telemetry_event_series` | Sin descripción específica en el contrato OpenAPI. | `ads_delivery_event_series` |
| `olderThan` | Sí | `string` | longitud máxima 50 | Descarta los chunks más antiguos que este intervalo | `valor-ejemplo` |
| `batchId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reason` | No | `string` | Sin restricción adicional declarada | Por qué se aplica; queda en el log de la operación | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ts/admin/retention/policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "table": "ads_delivery_event_series",
  "olderThan": "valor-ejemplo",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RetentionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RetentionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RetentionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RetentionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RetentionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RetentionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RetentionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RetentionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RetentionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RetentionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "table": "valor-ejemplo",
  "chunksDropped": 1,
  "droppedChunks": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `table` | Sí | `string` | Sin restricción adicional declarada | Valor de table mantenido por la instancia. | `valor-ejemplo` |
| `chunksDropped` | Sí | `number` | Sin restricción adicional declarada | Chunks descartados | `1` |
| `droppedChunks` | Sí | `array<string>` | Sin restricción adicional declarada | Valor de dropped chunks mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/ts/admin/retention/policies"
}
```

---

## 5. POST /ts/admin/rollups/{name}/refresh

- **Módulo:** `time_series`
- **Etiqueta OpenAPI:** `time_series`
- **Nombre:** Materializar la ventana de un agregado continuo
- **Operation ID:** `TimescaleAdminController_refreshRollup`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TimescaleAdminController.refreshRollup](../../src/modules/time_series/controllers/timescale-admin.controller.ts)

### Descripción de negocio

El refresco corre fuera de transacción: TimescaleDB no lo permite dentro.


### Descripción del sistema

NestJS resuelve `POST /ts/admin/rollups/{name}/refresh` en `TimescaleAdminController_refreshRollup`. El controlador delega en `TimescaleAdminService.refreshRollup`. Valida el body como `RefreshRollupDto` y consume `application/json`. El tipo de retorno estático es `Promise<RefreshRollupResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `name` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `Nombre de ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RefreshRollupDto`; los campos opcionales se omiten.

```http
POST /ts/admin/rollups/Nombre%20de%20ejemplo/refresh HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `DATA_PLATFORM_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `from` | Sí | `string` | formato `date-time` | Inicio de la ventana a materializar | `2026-07-31T12:00:00.000Z` |
| `to` | Sí | `string` | formato `date-time` | Fin de la ventana, exclusivo | `2026-07-31T12:00:00.000Z` |
| `batchId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ts/admin/rollups/Nombre%20de%20ejemplo/refresh HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RefreshRollupResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "rollup": "valor-ejemplo",
  "bucketsMaterialized": 1,
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `rollup` | Sí | `string` | Sin restricción adicional declarada | Valor de rollup mantenido por la instancia. | `valor-ejemplo` |
| `bucketsMaterialized` | Sí | `number` | Sin restricción adicional declarada | Buckets materializados en la ventana | `1` |
| `from` | Sí | `string` | formato `date-time` | Valor de from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `to` | Sí | `string` | formato `date-time` | Valor de to mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ventana a materializar tiene que empezar antes de terminar. | Excepción explícita en src/modules/time_series/services/timescale-admin.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ts/admin/rollups/{name}/refresh"
}
```

---

## 6. POST /ts/admin/rollups/audit-daily/refresh

- **Módulo:** `time_series`
- **Etiqueta OpenAPI:** `time_series`
- **Nombre:** Refrescar el rollup de conteos diarios de auditoría
- **Operation ID:** `TimescaleAdminController_refreshAuditDaily`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TimescaleAdminController.refreshAuditDaily](../../src/modules/time_series/controllers/timescale-admin.controller.ts)

### Descripción de negocio

Estos conteos alimentan paneles; no sustituyen `audit.audit_events`.

Contexto declarado en el controlador: UC-58-08. Declarada **antes** que la ruta paramétrica de rollups: un segmento literal que coincide con un parámetro tiene que resolverse primero.

### Descripción del sistema

NestJS resuelve `POST /ts/admin/rollups/audit-daily/refresh` en `TimescaleAdminController_refreshAuditDaily`. El controlador delega en `TimescaleAdminService.refreshRollup`. Valida el body como `RefreshRollupDto` y consume `application/json`. El tipo de retorno estático es `Promise<RefreshRollupResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RefreshRollupDto`; los campos opcionales se omiten.

```http
POST /ts/admin/rollups/audit-daily/refresh HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `DATA_PLATFORM_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `from` | Sí | `string` | formato `date-time` | Inicio de la ventana a materializar | `2026-07-31T12:00:00.000Z` |
| `to` | Sí | `string` | formato `date-time` | Fin de la ventana, exclusivo | `2026-07-31T12:00:00.000Z` |
| `batchId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ts/admin/rollups/audit-daily/refresh HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RefreshRollupResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RefreshRollupResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "rollup": "valor-ejemplo",
  "bucketsMaterialized": 1,
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `rollup` | Sí | `string` | Sin restricción adicional declarada | Valor de rollup mantenido por la instancia. | `valor-ejemplo` |
| `bucketsMaterialized` | Sí | `number` | Sin restricción adicional declarada | Buckets materializados en la ventana | `1` |
| `from` | Sí | `string` | formato `date-time` | Valor de from mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `to` | Sí | `string` | formato `date-time` | Valor de to mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ventana a materializar tiene que empezar antes de terminar. | Excepción explícita en src/modules/time_series/services/timescale-admin.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ts/admin/rollups/audit-daily/refresh"
}
```

---

## 7. POST /ts/ads/events/batch-ingest

- **Módulo:** `time_series`
- **Etiqueta OpenAPI:** `time_series`
- **Nombre:** Ingerir eventos de entrega de publicidad
- **Operation ID:** `SeriesController_batchIngestAdsEvents`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SeriesController.batchIngestAdsEvents](../../src/modules/time_series/controllers/series.controller.ts)

### Descripción de negocio

El `eventId` del origen es la clave de deduplicación.


### Descripción del sistema

NestJS resuelve `POST /ts/ads/events/batch-ingest` en `SeriesController_batchIngestAdsEvents`. El controlador delega en `SeriesIngestService.batchIngestAdsEvents`. Valida el body como `BatchIngestAdsDto` y consume `application/json`. El tipo de retorno estático es `Promise<BatchIngestResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BatchIngestAdsDto`; los campos opcionales se omiten.

```http
POST /ts/ads/events/batch-ingest HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "events": [
    {
      "time": "2026-07-31T12:00:00.000Z",
      "adAccountId": "00000000-0000-4000-8000-000000000001",
      "campaignId": "00000000-0000-4000-8000-000000000001",
      "eventName": "Nombre de ejemplo",
      "eventId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `INGEST_GATEWAY`, `SYSTEM`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ingestionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `seriesId` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `events` | Sí | `array<AdsEventDto>` | mínimo 1 elemento(s); máximo 5000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"time":"2026-07-31T12:00:00.000Z","adAccountId":"00000000-0000-4000-8000-000000000001","campaignId":"00000000-0000-4000-8000-000000000001","adSetId":"00000000-0000-4000-8000-000000000001","adId":"00000000-0000-4000-8000-000000000001","eventName":"Nombre de ejemplo","eventId":"00000000-0000-4000-8000-000000000001","value":1,"currencyCode":"BOB","dimensions":{}}]` |
| `events[].time` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `events[].adAccountId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `events[].campaignId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `events[].adSetId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `events[].adId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `events[].eventName` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `events[].eventId` | Sí | `string` | longitud máxima 200 | Identificador del origen; es la clave de deduplicación | `00000000-0000-4000-8000-000000000001` |
| `events[].value` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `events[].currencyCode` | No | `string` | longitud máxima 3 | Sin descripción específica en el contrato OpenAPI. | `BOB` |
| `events[].dimensions` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ts/ads/events/batch-ingest HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "seriesId": "00000000-0000-4000-8000-000000000001",
  "events": [
    {
      "time": "2026-07-31T12:00:00.000Z",
      "adAccountId": "00000000-0000-4000-8000-000000000001",
      "campaignId": "00000000-0000-4000-8000-000000000001",
      "adSetId": "00000000-0000-4000-8000-000000000001",
      "adId": "00000000-0000-4000-8000-000000000001",
      "eventName": "Nombre de ejemplo",
      "eventId": "00000000-0000-4000-8000-000000000001",
      "value": 1,
      "currencyCode": "BOB",
      "dimensions": {}
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BatchIngestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "seriesId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "rowsIngested": 1,
  "rowsSkipped": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `seriesId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a series. | `00000000-0000-4000-8000-000000000001` |
| `ingestionId` | Sí | `string` | formato `uuid` | Identificador asociado a ingestion. | `00000000-0000-4000-8000-000000000001` |
| `rowsIngested` | Sí | `number` | Sin restricción adicional declarada | Filas efectivamente insertadas | `1` |
| `rowsSkipped` | Sí | `number` | Sin restricción adicional declarada | Filas descartadas por ser duplicado del origen | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/ts/ads/events/batch-ingest"
}
```

---

## 8. POST /ts/devices/{deviceId}/readings/ingest

- **Módulo:** `time_series`
- **Etiqueta OpenAPI:** `time_series`
- **Nombre:** Ingerir lecturas de un dispositivo médico
- **Operation ID:** `SeriesController_ingestDeviceReadings`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SeriesController.ingestDeviceReadings](../../src/modules/time_series/controllers/series.controller.ts)

### Descripción de negocio

La secuencia del dispositivo descarta el reenvío sin contarlo dos veces.


### Descripción del sistema

NestJS resuelve `POST /ts/devices/{deviceId}/readings/ingest` en `SeriesController_ingestDeviceReadings`. El controlador delega en `SeriesIngestService.ingestDeviceReadings`. Valida el body como `IngestDeviceReadingsDto` y consume `application/json`. El tipo de retorno estático es `Promise<BatchIngestResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `deviceId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IngestDeviceReadingsDto`; los campos opcionales se omiten.

```http
POST /ts/devices/00000000-0000-4000-8000-000000000001/readings/ingest HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "readings": [
    {
      "time": "2026-07-31T12:00:00.000Z",
      "channelCode": "CODIGO_EJEMPLO",
      "rawValue": {}
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `INGEST_GATEWAY`, `DEVICE`, `SYSTEM`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `deviceId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ingestionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `seriesId` | No | `string` | longitud máxima 100 | Serie a la que pertenecen; por omisión, el dispositivo | `00000000-0000-4000-8000-000000000001` |
| `readings` | Sí | `array<DeviceReadingDto>` | mínimo 1 elemento(s); máximo 5000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"time":"2026-07-31T12:00:00.000Z","channelCode":"CODIGO_EJEMPLO","rawValue":{},"numericValue":1,"unitCode":"CODIGO_EJEMPLO","deviceSequence":"valor-ejemplo","observedAtDevice":"2026-07-31T12:00:00.000Z","patientProfileId":"00000000-0000-4000-8000-000000000001"}]` |
| `readings[].time` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `readings[].channelCode` | Sí | `string` | longitud máxima 100 | Canal del dispositivo | `CODIGO_EJEMPLO` |
| `readings[].rawValue` | Sí | `object` | Sin restricción adicional declarada | Lectura tal como la emite el dispositivo | `{}` |
| `readings[].numericValue` | No | `number` | Sin restricción adicional declarada | Valor numérico extraído, si lo hay | `1` |
| `readings[].unitCode` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `readings[].deviceSequence` | No | `string` | Sin restricción adicional declarada | Secuencia monótona por canal; cadena por ser bigint | `valor-ejemplo` |
| `readings[].observedAtDevice` | No | `string` | formato `date-time` | Instante según el reloj del dispositivo | `2026-07-31T12:00:00.000Z` |
| `readings[].patientProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ts/devices/00000000-0000-4000-8000-000000000001/readings/ingest HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "seriesId": "00000000-0000-4000-8000-000000000001",
  "readings": [
    {
      "time": "2026-07-31T12:00:00.000Z",
      "channelCode": "CODIGO_EJEMPLO",
      "rawValue": {},
      "numericValue": 1,
      "unitCode": "CODIGO_EJEMPLO",
      "deviceSequence": "valor-ejemplo",
      "observedAtDevice": "2026-07-31T12:00:00.000Z",
      "patientProfileId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BatchIngestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "seriesId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "rowsIngested": 1,
  "rowsSkipped": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `seriesId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a series. | `00000000-0000-4000-8000-000000000001` |
| `ingestionId` | Sí | `string` | formato `uuid` | Identificador asociado a ingestion. | `00000000-0000-4000-8000-000000000001` |
| `rowsIngested` | Sí | `number` | Sin restricción adicional declarada | Filas efectivamente insertadas | `1` |
| `rowsSkipped` | Sí | `number` | Sin restricción adicional declarada | Filas descartadas por ser duplicado del origen | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: INGEST_GATEWAY, DEVICE, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/ts/devices/{deviceId}/readings/ingest"
}
```

---

## 9. POST /ts/location/pings/batch-ingest

- **Módulo:** `time_series`
- **Etiqueta OpenAPI:** `time_series`
- **Nombre:** Ingerir pings de ubicación
- **Operation ID:** `SeriesController_batchIngestLocationPings`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SeriesController.batchIngestLocationPings](../../src/modules/time_series/controllers/series.controller.ts)

### Descripción de negocio

Exige el consentimiento vigente que ampara el registro del sujeto.


### Descripción del sistema

NestJS resuelve `POST /ts/location/pings/batch-ingest` en `SeriesController_batchIngestLocationPings`. El controlador delega en `SeriesIngestService.batchIngestLocationPings`. Valida el body como `BatchIngestLocationDto` y consume `application/json`. El tipo de retorno estático es `Promise<BatchIngestResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BatchIngestLocationDto`; los campos opcionales se omiten.

```http
POST /ts/location/pings/batch-ingest HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "consentId": "00000000-0000-4000-8000-000000000001",
  "pings": [
    {
      "latitude": -12.0464,
      "longitude": -77.0428
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `INGEST_GATEWAY`, `SYSTEM`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ingestionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `seriesId` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `consentId` | Sí | `string` | formato `uuid` | Consentimiento vigente que ampara el registro de ubicación del sujeto | `00000000-0000-4000-8000-000000000001` |
| `pings` | Sí | `array<LocationPingDto>` | mínimo 1 elemento(s); máximo 5000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"latitude":-12.0464,"longitude":-77.0428,"accuracyM":1,"altitudeM":1,"speedMps":1,"headingDeg":1,"batteryPct":1,"network":"CELLULAR","deviceId":"00000000-0000-4000-8000-000000000001","capturedAt":"2026-07-31T12:00:00.000Z"}]` |
| `pings[].latitude` | Sí | `number` | mínimo -90; máximo 90 | Latitud en grados decimales | `-12.0464` |
| `pings[].longitude` | Sí | `number` | mínimo -180; máximo 180 | Longitud en grados decimales | `-77.0428` |
| `pings[].accuracyM` | No | `number` | mínimo 0 | Precisión horizontal (m) | `1` |
| `pings[].altitudeM` | No | `number` | Sin restricción adicional declarada | Altitud (m) | `1` |
| `pings[].speedMps` | No | `number` | mínimo 0 | Velocidad (m/s) | `1` |
| `pings[].headingDeg` | No | `number` | Sin restricción adicional declarada | Rumbo (grados) | `1` |
| `pings[].batteryPct` | No | `number` | mínimo 0; máximo 100 | Batería (%) | `1` |
| `pings[].network` | No | `string` | valores: `CELLULAR`, `WIFI` | Red de captura | `CELLULAR` |
| `pings[].deviceId` | No | `string` | formato `uuid` | Dispositivo que capturó el ping | `00000000-0000-4000-8000-000000000001` |
| `pings[].capturedAt` | No | `string` | formato `date-time` | Instante de captura en el dispositivo | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ts/location/pings/batch-ingest HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "seriesId": "00000000-0000-4000-8000-000000000001",
  "consentId": "00000000-0000-4000-8000-000000000001",
  "pings": [
    {
      "latitude": -12.0464,
      "longitude": -77.0428,
      "accuracyM": 1,
      "altitudeM": 1,
      "speedMps": 1,
      "headingDeg": 1,
      "batteryPct": 1,
      "network": "CELLULAR",
      "deviceId": "00000000-0000-4000-8000-000000000001",
      "capturedAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BatchIngestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "seriesId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "rowsIngested": 1,
  "rowsSkipped": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `seriesId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a series. | `00000000-0000-4000-8000-000000000001` |
| `ingestionId` | Sí | `string` | formato `uuid` | Identificador asociado a ingestion. | `00000000-0000-4000-8000-000000000001` |
| `rowsIngested` | Sí | `number` | Sin restricción adicional declarada | Filas efectivamente insertadas | `1` |
| `rowsSkipped` | Sí | `number` | Sin restricción adicional declarada | Filas descartadas por ser duplicado del origen | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/ts/location/pings/batch-ingest"
}
```

---

## 10. POST /ts/metrics/{dataset}/batch-ingest

- **Módulo:** `time_series`
- **Etiqueta OpenAPI:** `time_series`
- **Nombre:** Ingerir métricas de runtime de IA, pipeline o SLI
- **Operation ID:** `SeriesController_batchIngestMetrics`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SeriesController.batchIngestMetrics](../../src/modules/time_series/controllers/series.controller.ts)

### Descripción de negocio

El dataset viaja en la ruta y se valida contra la lista cerrada del módulo.


### Descripción del sistema

NestJS resuelve `POST /ts/metrics/{dataset}/batch-ingest` en `SeriesController_batchIngestMetrics`. El controlador delega en `SeriesIngestService.batchIngestMetrics`. Valida el body como `BatchIngestMetricsDto` y consume `application/json`. El tipo de retorno estático es `Promise<BatchIngestResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `dataset` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BatchIngestMetricsDto`; los campos opcionales se omiten.

```http
POST /ts/metrics/valor-ejemplo/batch-ingest HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "points": [
    {
      "time": "2026-07-31T12:00:00.000Z",
      "values": {}
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `INGEST_GATEWAY`, `SYSTEM`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ingestionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `seriesId` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `points` | Sí | `array<SeriesPointDto>` | mínimo 1 elemento(s); máximo 5000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"time":"2026-07-31T12:00:00.000Z","values":{}}]` |
| `points[].time` | Sí | `string` | formato `date-time` | Instante de la medición | `2026-07-31T12:00:00.000Z` |
| `points[].values` | Sí | `object` | Sin restricción adicional declarada | Resto de columnas del punto, según el dataset al que se ingiere | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ts/metrics/valor-ejemplo/batch-ingest HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "seriesId": "00000000-0000-4000-8000-000000000001",
  "points": [
    {
      "time": "2026-07-31T12:00:00.000Z",
      "values": {}
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BatchIngestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "seriesId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "rowsIngested": 1,
  "rowsSkipped": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `seriesId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a series. | `00000000-0000-4000-8000-000000000001` |
| `ingestionId` | Sí | `string` | formato `uuid` | Identificador asociado a ingestion. | `00000000-0000-4000-8000-000000000001` |
| `rowsIngested` | Sí | `number` | Sin restricción adicional declarada | Filas efectivamente insertadas | `1` |
| `rowsSkipped` | Sí | `number` | Sin restricción adicional declarada | Filas descartadas por ser duplicado del origen | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/ts/metrics/{dataset}/batch-ingest"
}
```

---

## 11. POST /ts/normalize/run

- **Módulo:** `time_series`
- **Etiqueta OpenAPI:** `time_series`
- **Nombre:** Normalizar una lectura cruda y promoverla al registro clínico
- **Operation ID:** `SeriesController_normalizeReading`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SeriesController.normalizeReading](../../src/modules/time_series/controllers/series.controller.ts)

### Descripción de negocio

La vital y la observación clínica se confirman juntas; reprocesar el mismo evento no promueve dos veces.


### Descripción del sistema

NestJS resuelve `POST /ts/normalize/run` en `SeriesController_normalizeReading`. El controlador delega en `VitalNormalizationService.normalizeReading`. Valida el body como `NormalizeReadingDto` y consume `application/json`. El tipo de retorno estático es `Promise<NormalizeReadingResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `NormalizeReadingDto`; los campos opcionales se omiten.

```http
POST /ts/normalize/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "time": "2026-07-31T12:00:00.000Z",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "seriesId": "00000000-0000-4000-8000-000000000001",
  "observationCode": "CODIGO_EJEMPLO",
  "observationCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "unitCode": "CODIGO_EJEMPLO"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `time` | Sí | `string` | formato `date-time` | Instante de la lectura cruda | `2026-07-31T12:00:00.000Z` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `seriesId` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `observationCode` | Sí | `string` | longitud máxima 100 | Código de observación al que mapea el canal | `CODIGO_EJEMPLO` |
| `observationCodeConceptId` | Sí | `string` | formato `uuid` | Concepto del código de observación, necesario para promover a clinical | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `unitCode` | Sí | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `unitConceptId` | No | `string` | formato `uuid` | Unidad como concepto, para la observación clínica | `00000000-0000-4000-8000-000000000001` |
| `encounterId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `promoteToClinical` | No | `boolean` | Sin restricción adicional declarada | Si la medición es clínicamente significativa y debe promoverse | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ts/normalize/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "time": "2026-07-31T12:00:00.000Z",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "seriesId": "00000000-0000-4000-8000-000000000001",
  "observationCode": "CODIGO_EJEMPLO",
  "observationCodeConceptId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "unitCode": "CODIGO_EJEMPLO",
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "promoteToClinical": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<NormalizeReadingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<NormalizeReadingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<NormalizeReadingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<NormalizeReadingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<NormalizeReadingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<NormalizeReadingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<NormalizeReadingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<NormalizeReadingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<NormalizeReadingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `NormalizeReadingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "seriesId": "00000000-0000-4000-8000-000000000001",
  "observationCode": "CODIGO_EJEMPLO",
  "validationState": "valor-ejemplo",
  "clinicallyPromotedObservationId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `seriesId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a series. | `00000000-0000-4000-8000-000000000001` |
| `observationCode` | Sí | `string` | Sin restricción adicional declarada | Valor de observation code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `validationState` | Sí | `string` | Sin restricción adicional declarada | Valor de validation state mantenido por la instancia. | `valor-ejemplo` |
| `clinicallyPromotedObservationId` | No | `string` | formato `uuid` | Observación clínica creada al promover | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si la lectura ya se había normalizado antes | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | No hay lectura cruda para ese instante y serie. | Excepción explícita en src/modules/time_series/services/vital-normalization.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La lectura cruda está marcada como rechazada; no se normaliza. | Excepción explícita en src/modules/time_series/services/vital-normalization.service.ts |
| 422 | `PRECONDITION_FAILED` | La lectura cruda no tiene valor numérico; no se puede normalizar. | Excepción explícita en src/modules/time_series/services/vital-normalization.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ts/normalize/run"
}
```

---

## 12. POST /ts/series/{seriesId}/backfill/governed

- **Módulo:** `time_series`
- **Etiqueta OpenAPI:** `time_series`
- **Nombre:** Backfill gobernado de una serie
- **Operation ID:** `SeriesController_governedBackfill`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SeriesController.governedBackfill](../../src/modules/time_series/controllers/series.controller.ts)

### Descripción de negocio

Las correcciones entran como eventos nuevos con `quality_state = backfill`; los originales no se tocan.


### Descripción del sistema

NestJS resuelve `POST /ts/series/{seriesId}/backfill/governed` en `SeriesController_governedBackfill`. El controlador delega en `SeriesIngestService.governedBackfill`. Valida el body como `GovernedBackfillDto` y consume `application/json`. El tipo de retorno estático es `Promise<GovernedBackfillResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `seriesId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `GovernedBackfillDto`; los campos opcionales se omiten.

```http
POST /ts/series/00000000-0000-4000-8000-000000000001/backfill/governed HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "dataset": "device_raw_reading_series",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "justification": "valor-ejemplo",
  "windowFrom": "2026-07-31T12:00:00.000Z",
  "windowTo": "2026-07-31T12:00:00.000Z",
  "corrections": [
    {
      "time": "2026-07-31T12:00:00.000Z",
      "values": {}
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_PLATFORM_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `dataset` | Sí | `string` | valores: `device_raw_reading_series`, `telemetry_event_series` | Sin descripción específica en el contrato OpenAPI. | `device_raw_reading_series` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `batchId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `justification` | Sí | `string` | Sin restricción adicional declarada | Justificación de la corrección; sin ella no se aplica | `valor-ejemplo` |
| `windowFrom` | Sí | `string` | formato `date-time` | Inicio de la ventana corregida | `2026-07-31T12:00:00.000Z` |
| `windowTo` | Sí | `string` | formato `date-time` | Fin de la ventana corregida | `2026-07-31T12:00:00.000Z` |
| `corrections` | Sí | `array<SeriesPointDto>` | mínimo 1 elemento(s); máximo 5000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"time":"2026-07-31T12:00:00.000Z","values":{}}]` |
| `corrections[].time` | Sí | `string` | formato `date-time` | Instante de la medición | `2026-07-31T12:00:00.000Z` |
| `corrections[].values` | Sí | `object` | Sin restricción adicional declarada | Resto de columnas del punto, según el dataset al que se ingiere | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ts/series/00000000-0000-4000-8000-000000000001/backfill/governed HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "dataset": "device_raw_reading_series",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "justification": "valor-ejemplo",
  "windowFrom": "2026-07-31T12:00:00.000Z",
  "windowTo": "2026-07-31T12:00:00.000Z",
  "corrections": [
    {
      "time": "2026-07-31T12:00:00.000Z",
      "values": {}
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<GovernedBackfillResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<GovernedBackfillResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<GovernedBackfillResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<GovernedBackfillResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<GovernedBackfillResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<GovernedBackfillResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<GovernedBackfillResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<GovernedBackfillResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<GovernedBackfillResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<GovernedBackfillResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GovernedBackfillResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "seriesId": "00000000-0000-4000-8000-000000000001",
  "rowsBackfilled": 1,
  "sourceVersion": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `seriesId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a series. | `00000000-0000-4000-8000-000000000001` |
| `rowsBackfilled` | Sí | `number` | Sin restricción adicional declarada | Correcciones insertadas como eventos nuevos | `1` |
| `sourceVersion` | Sí | `string` | Sin restricción adicional declarada | Versión de origen con la que entraron las correcciones | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_PLATFORM_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ventana de corrección tiene que empezar antes de terminar. | Excepción explícita en src/modules/time_series/services/series-ingest.service.ts |
| 422 | `PRECONDITION_FAILED` | Una corrección cae fuera de la ventana declarada. | Excepción explícita en src/modules/time_series/services/series-ingest.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ts/series/{seriesId}/backfill/governed"
}
```

---

## 13. POST /ts/series/{seriesId}/points/batch-ingest

- **Módulo:** `time_series`
- **Etiqueta OpenAPI:** `time_series`
- **Nombre:** Ingerir un lote de puntos en una serie
- **Operation ID:** `SeriesController_batchIngestPoints`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SeriesController.batchIngestPoints](../../src/modules/time_series/controllers/series.controller.ts)

### Descripción de negocio

Append-only: el lote entra entero o no entra.


### Descripción del sistema

NestJS resuelve `POST /ts/series/{seriesId}/points/batch-ingest` en `SeriesController_batchIngestPoints`. El controlador delega en `SeriesIngestService.batchIngestPoints`. Valida el body como `BatchIngestPointsDto` y consume `application/json`. El tipo de retorno estático es `Promise<BatchIngestResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `seriesId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BatchIngestPointsDto`; los campos opcionales se omiten.

```http
POST /ts/series/00000000-0000-4000-8000-000000000001/points/batch-ingest HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "dataset": "device_raw_reading_series",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "points": [
    {
      "time": "2026-07-31T12:00:00.000Z",
      "values": {}
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `INGEST_GATEWAY`, `SYSTEM`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `dataset` | Sí | `string` | valores: `device_raw_reading_series`, `telemetry_event_series`, `application_tracking_series`, `audit_access_metric_series`, `lab_analyzer_event_series`, `payment_gateway_metric_series` | Serie a la que se ingiere | `device_raw_reading_series` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ingestionId` | Sí | `string` | formato `uuid` | Identificador del lote; el mismo lote reenviado no vuelve a entrar | `00000000-0000-4000-8000-000000000001` |
| `sourceVersion` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `points` | Sí | `array<SeriesPointDto>` | mínimo 1 elemento(s); máximo 5000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"time":"2026-07-31T12:00:00.000Z","values":{}}]` |
| `points[].time` | Sí | `string` | formato `date-time` | Instante de la medición | `2026-07-31T12:00:00.000Z` |
| `points[].values` | Sí | `object` | Sin restricción adicional declarada | Resto de columnas del punto, según el dataset al que se ingiere | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ts/series/00000000-0000-4000-8000-000000000001/points/batch-ingest HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "dataset": "device_raw_reading_series",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "sourceVersion": "1",
  "points": [
    {
      "time": "2026-07-31T12:00:00.000Z",
      "values": {}
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BatchIngestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BatchIngestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "seriesId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "rowsIngested": 1,
  "rowsSkipped": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `seriesId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a series. | `00000000-0000-4000-8000-000000000001` |
| `ingestionId` | Sí | `string` | formato `uuid` | Identificador asociado a ingestion. | `00000000-0000-4000-8000-000000000001` |
| `rowsIngested` | Sí | `number` | Sin restricción adicional declarada | Filas efectivamente insertadas | `1` |
| `rowsSkipped` | Sí | `number` | Sin restricción adicional declarada | Filas descartadas por ser duplicado del origen | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/ts/series/{seriesId}/points/batch-ingest"
}
```

---

## 14. GET /ts/series/{seriesId}/query

- **Módulo:** `time_series`
- **Etiqueta OpenAPI:** `time_series`
- **Nombre:** Consultar un rango con downsampling
- **Operation ID:** `SeriesController_queryRange`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SeriesController.queryRange](../../src/modules/time_series/controllers/series.controller.ts)

### Descripción de negocio

Si el bucket es lo bastante ancho y la serie tiene agregado continuo, la respuesta se sirve desde el rollup.

Contexto declarado en el controlador: UC-58-09. Declarada antes que las de ingesta para leerse junto a su serie.

### Descripción del sistema

NestJS resuelve `GET /ts/series/{seriesId}/query` en `SeriesController_queryRange`. El controlador delega en `SeriesQueryService.queryRange`. No recibe body. El tipo de retorno estático es `Promise<QuerySeriesRangeResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `seriesId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `dataset` | query | Sí | `string` | valores: `ads_delivery_event_series`, `ai_runtime_metric_series`, `application_tracking_series`, `audit_access_metric_series`, `device_raw_reading_series`, `ingestion_pipeline_metric_series`, `lab_analyzer_event_series`, `location_ping_series`, `normalized_vital_series`, `payment_gateway_metric_series`, `service_sli_series`, `telemetry_event_series` | Sin descripción específica en OpenAPI. | `ads_delivery_event_series` |
| `tenantId` | query | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `from` | query | Sí | `string` | formato `date-time` | Sin descripción específica en OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `to` | query | Sí | `string` | formato `date-time` | Sin descripción específica en OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `bucket` | query | Sí | `string` | longitud máxima 50 | Anchura del bucket, p. ej. `5 minutes` o `1 day` | `valor-ejemplo` |
| `agg` | query | No | `string` | valores: `avg`, `min`, `max`, `sum`, `count` | Sin descripción específica en OpenAPI. | `avg` |
| `limit` | query | No | `number` | mínimo 1; máximo 5000 | Sin descripción específica en OpenAPI. | `1000` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /ts/series/00000000-0000-4000-8000-000000000001/query?dataset=ads_delivery_event_series&tenantId=00000000-0000-4000-8000-000000000001&from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&bucket=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `ANALYST`, `DATA_PLATFORM_ADMIN`, `SYSTEM`, `PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /ts/series/00000000-0000-4000-8000-000000000001/query?dataset=ads_delivery_event_series&tenantId=00000000-0000-4000-8000-000000000001&from=2026-07-31T12%3A00%3A00.000Z&to=2026-07-31T12%3A00%3A00.000Z&bucket=valor-ejemplo&agg=avg&limit=1000 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<QuerySeriesRangeResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<QuerySeriesRangeResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<QuerySeriesRangeResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<QuerySeriesRangeResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<QuerySeriesRangeResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<QuerySeriesRangeResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<QuerySeriesRangeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `QuerySeriesRangeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "seriesId": "00000000-0000-4000-8000-000000000001",
  "source": "valor-ejemplo",
  "points": [
    {
      "bucket": "2026-07-31T12:00:00.000Z",
      "value": 1,
      "samples": 1
    }
  ],
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `seriesId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a series. | `00000000-0000-4000-8000-000000000001` |
| `source` | Sí | `string` | Sin restricción adicional declarada | De dónde salió el dato: `raw` o el nombre del rollup | `valor-ejemplo` |
| `points` | Sí | `array<SeriesPointResponseDto>` | Sin restricción adicional declarada | Valor de points mantenido por la instancia. | `[{"bucket":"2026-07-31T12:00:00.000Z","value":1,"samples":1}]` |
| `points[].bucket` | Sí | `string` | formato `date-time` | Valor de bucket mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `points[].value` | No | `number` | admite null | Valor agregado del bucket | `1` |
| `points[].samples` | Sí | `number` | Sin restricción adicional declarada | Muestras que entraron en el bucket | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si la respuesta llegó al tope y hay más datos | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ANALYST, DATA_PLATFORM_ADMIN, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | El rango tiene que empezar antes de terminar. | Excepción explícita en src/modules/time_series/services/series-query.service.ts |
| 422 | `PRECONDITION_FAILED` | Esta serie no tiene magnitud que agregar; sólo admite `count`. | Excepción explícita en src/modules/time_series/services/series-query.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ts/series/{seriesId}/query"
}
```

---

