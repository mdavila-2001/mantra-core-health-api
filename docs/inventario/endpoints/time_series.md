<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `time_series`

- **Bloque:** Datos y NoSQL (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)
- **Operaciones:** 14 (14 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 11 · BAJO 3
- **Tablas distintas que tocan:** 13
- **Respuestas de error y detalle contractual:** `openapi/endpoints/time-series.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/ts/admin/compression/run` | Comprimir los chunks más antiguos que el umbral | MEDIO | 5 | SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN |
| 2 | POST | `/ts/admin/hypertables` | Convertir una serie en hypertable y declarar su particionado | BAJO | 0 | DATA_PLATFORM_ADMIN, PLATFORM_ADMIN |
| 3 | PATCH | `/ts/admin/hypertables/{table}` | Ajustar la anchura temporal del chunk | BAJO | 0 | DATA_PLATFORM_ADMIN, PLATFORM_ADMIN |
| 4 | POST | `/ts/admin/retention/policies` | Aplicar la retención descartando chunks fuera de ventana | MEDIO | 5 | SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN |
| 5 | POST | `/ts/admin/rollups/{name}/refresh` | Materializar la ventana de un agregado continuo | MEDIO | 5 | SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN |
| 6 | POST | `/ts/admin/rollups/audit-daily/refresh` | Refrescar el rollup de conteos diarios de auditoría | MEDIO | 5 | SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN |
| 7 | POST | `/ts/ads/events/batch-ingest` | Ingerir eventos de entrega de publicidad | MEDIO | 6 | INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN |
| 8 | POST | `/ts/devices/{deviceId}/readings/ingest` | Ingerir lecturas de un dispositivo médico | MEDIO | 6 | INGEST_GATEWAY, DEVICE, SYSTEM, PLATFORM_ADMIN |
| 9 | POST | `/ts/location/pings/batch-ingest` | Ingerir pings de ubicación | MEDIO | 9 | INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN |
| 10 | POST | `/ts/metrics/{dataset}/batch-ingest` | Ingerir métricas de runtime de IA, pipeline o SLI | MEDIO | 4 | INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN |
| 11 | POST | `/ts/normalize/run` | Normalizar una lectura cruda y promoverla al registro clínico | MEDIO | 9 | SYSTEM, PLATFORM_ADMIN |
| 12 | POST | `/ts/series/{seriesId}/backfill/governed` | Backfill gobernado de una serie | MEDIO | 4 | DATA_PLATFORM_ADMIN, PLATFORM_ADMIN |
| 13 | POST | `/ts/series/{seriesId}/points/batch-ingest` | Ingerir un lote de puntos en una serie | MEDIO | 4 | INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN |
| 14 | GET | `/ts/series/{seriesId}/query` | Consultar un rango con downsampling | BAJO | 0 | ANALYST, DATA_PLATFORM_ADMIN, SYSTEM, PLATFORM_ADMIN |

---

## 1. POST /ts/admin/compression/run

- **Origen:** CONTRATO
- **Nombre:** Comprimir los chunks más antiguos que el umbral
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TimescaleAdminController.runCompression` — `src/modules/time_series/controllers/timescale-admin.controller.ts:92`

### Qué es y para qué sirve (negocio)

Comprimir los chunks más antiguos que el umbral. Caso de uso UC-58-05: Comprimir chunks antiguos. Dentro del módulo (descripción del modelo, en inglés): «Stores high-frequency readings and operational events that would overload transactional tables.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/time_series/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_58_time_series.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /ts/admin/compression/run` la atiende `TimescaleAdminController.runCompression` (src/modules/time_series/controllers/timescale-admin.controller.ts:92). Exige sesión con alguno de los roles SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `RunCompressionDto` (5 campos, 4 obligatorios). Delega en `TimescaleAdminService.runCompression`. Crea filas en messaging.domain_events, messaging.outbox_messages, time_series.ingestion_pipeline_metric_series. Lee directory.tenants, messaging.outbox_messages. Publica ChunksCompressed.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN | `src/modules/time_series/controllers/timescale-admin.controller.ts:92` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenants` | LEE | LEE | DIRECTA | TimescaleAdminController.runCompression → TimescaleAdminService.runCompression → TimescaleAdminService.assertTenantExists | `src/modules/time_series/services/timescale-admin.service.ts:180` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | TimescaleAdminController.runCompression → TimescaleAdminService.runCompression → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | TimescaleAdminController.runCompression → TimescaleAdminService.runCompression → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | TimescaleAdminController.runCompression → TimescaleAdminService.runCompression → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `time_series.ingestion_pipeline_metric_series` | ESCRIBE | CREA | DIRECTA | TimescaleAdminController.runCompression → TimescaleAdminService.runCompression → SeriesIngestRepository.createPipelineMetric | `src/modules/time_series/repositories/series-ingest.repository.ts:165` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `ChunksCompressed` | `src/modules/time_series/services/timescale-admin.service.ts:246` |

### Cuerpo — DTO `RunCompressionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `table` | `string` | Sí | valores: ads_delivery_event_series, ai_runtime_metric_series, application_tracking_series, audit_access_metric_series, device_raw_reading_series, ingestion_pipeline_metric_series, lab_analyzer_event_series, location_ping_series, normalized_vital_series, payment_gateway_metric_series, service_sli_series, telemetry_event_series | `@IsIn(TIMESERIES_TABLES)` | — | `src/modules/time_series/dto/time-series.dto.ts:502` |
| `olderThan` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | Comprime los chunks más antiguos que este intervalo | `src/modules/time_series/dto/time-series.dto.ts:513` |
| `batchId` | `string` | Sí | formato uuid | `@IsUUID()` | Lote al que se atribuyen las métricas | `src/modules/time_series/dto/time-series.dto.ts:523` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:530` |
| `maxChunks` | `number` | No | mínimo 1; máximo 100 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(100)` | — | `src/modules/time_series/dto/time-series.dto.ts:540` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "table": "ads_delivery_event_series",
  "olderThan": "valor-ejemplo",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "table": "ads_delivery_event_series",
  "olderThan": "valor-ejemplo",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "maxChunks": 10
}
```

</details>

### Respuesta — `Promise<CompressionResponseDto>` · DTO `CompressionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `table` | `string` | Sí | — | — | Valor de table mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:551` |
| `chunksCompressed` | `number` | Sí | — | — | Chunks comprimidos en esta pasada | `src/modules/time_series/dto/time-series.dto.ts:557` |
| `remainingChunks` | `array<string>` | Sí | — | — | Chunks candidatos que quedaron para la siguiente | `src/modules/time_series/dto/time-series.dto.ts:566` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Tenant no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La serie no declara por qué columnas se segmenta al comprimir. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | — | InternalServerErrorException: La segmentación de compresión declara una columna que no es válida. |

El árbol de decisión completo está en [flujos](../flujos/time_series.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 58 — Series temporales de alto volumen y analítica de eventos — etapa `UC-58-05`

---

## 2. POST /ts/admin/hypertables

- **Origen:** CONTRATO
- **Nombre:** Convertir una serie en hypertable y declarar su particionado
- **Bloque:** Datos y NoSQL
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TimescaleAdminController.configureHypertable` — `src/modules/time_series/controllers/timescale-admin.controller.ts:50`

### Qué es y para qué sirve (negocio)

Convertir una serie en hypertable y declarar su particionado. Caso de uso UC-58-04: Hypertable y chunks. Dentro del módulo (descripción del modelo, en inglés): «Stores high-frequency readings and operational events that would overload transactional tables.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/time_series/README.md:48`) · MODELO (`Mantra Core Health Context/modules/diagram_58_time_series.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /ts/admin/hypertables` la atiende `TimescaleAdminController.configureHypertable` (src/modules/time_series/controllers/timescale-admin.controller.ts:50). Exige sesión con alguno de los roles DATA_PLATFORM_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `ConfigureHypertableDto` (4 campos, 1 obligatorio). Delega en `TimescaleAdminService.configureHypertable`. No toca tablas relacionales: Convierte en hypertable la tabla que indica la petición (`dto.table`); el nombre no se conoce antes de ejecutar..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_PLATFORM_ADMIN, PLATFORM_ADMIN | `src/modules/time_series/controllers/timescale-admin.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Convierte en hypertable la tabla que indica la petición (`dto.table`); el nombre no se conoce antes de ejecutar.. _(manual, 2026-10-21; fuente: `src/modules/time_series/services/timescale-admin.service.ts:75`)_

### Cuerpo — DTO `ConfigureHypertableDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `table` | `string` | Sí | valores: ads_delivery_event_series, ai_runtime_metric_series, application_tracking_series, audit_access_metric_series, device_raw_reading_series, ingestion_pipeline_metric_series, lab_analyzer_event_series, location_ping_series, normalized_vital_series, payment_gateway_metric_series, service_sli_series, telemetry_event_series | `@IsIn(TIMESERIES_TABLES)` | — | `src/modules/time_series/dto/time-series.dto.ts:407` |
| `chunkTimeInterval` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | Anchura temporal del chunk, p. ej. `1 day` o `7 days` | `src/modules/time_series/dto/time-series.dto.ts:419` |
| `spaceColumn` | `string` | No | longitud máxima 63 | `@IsOptional()` `@IsString()` `@MaxLength(63)` | Columna de la dimensión de espacio, p. ej. `tenant_id` | `src/modules/time_series/dto/time-series.dto.ts:431` |
| `spacePartitions` | `number` | No | mínimo 1; máximo 256 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(256)` | — | `src/modules/time_series/dto/time-series.dto.ts:441` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "table": "ads_delivery_event_series"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "table": "ads_delivery_event_series",
  "chunkTimeInterval": "valor-ejemplo",
  "spaceColumn": "valor-ejemplo",
  "spacePartitions": 4
}
```

</details>

### Respuesta — `Promise<HypertableResponseDto>` · DTO `HypertableResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `table` | `string` | Sí | — | — | Valor de table mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:466` |
| `chunkCount` | `number` | No | — | — | Chunks existentes según el catálogo del motor | `src/modules/time_series/dto/time-series.dto.ts:474` |
| `compressionEnabled` | `boolean` | No | — | — | Valor de compression enabled mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:480` |
| `spaceDimensionAdded` | `boolean` | Sí | — | — | Verdadero si se declaró la dimensión de espacio | `src/modules/time_series/dto/time-series.dto.ts:488` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | — | InternalServerErrorException: La dimensión de espacio no es un identificador de columna válido. |

El árbol de decisión completo está en [flujos](../flujos/time_series.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 58 — Series temporales de alto volumen y analítica de eventos — etapa `UC-58-04`

---

## 3. PATCH /ts/admin/hypertables/{table}

- **Origen:** CONTRATO
- **Nombre:** Ajustar la anchura temporal del chunk
- **Bloque:** Datos y NoSQL
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TimescaleAdminController.updateHypertable` — `src/modules/time_series/controllers/timescale-admin.controller.ts:70`

### Qué es y para qué sirve (negocio)

Ajustar la anchura temporal del chunk. Caso de uso UC-58-04: Hypertable y chunks. Dentro del módulo (descripción del modelo, en inglés): «Stores high-frequency readings and operational events that would overload transactional tables.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/time_series/README.md:48`) · MODELO (`Mantra Core Health Context/modules/diagram_58_time_series.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`PATCH /ts/admin/hypertables/{table}` la atiende `TimescaleAdminController.updateHypertable` (src/modules/time_series/controllers/timescale-admin.controller.ts:70). Exige sesión con alguno de los roles DATA_PLATFORM_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `UpdateHypertableDto` (1 campo, 1 obligatorio). Delega en `TimescaleAdminService.updateHypertable`. No toca tablas relacionales: Modifica la hypertable que indica la ruta (`{table}`); el nombre no se conoce antes de ejecutar..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_PLATFORM_ADMIN, PLATFORM_ADMIN | `src/modules/time_series/controllers/timescale-admin.controller.ts:70` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Modifica la hypertable que indica la ruta (`{table}`); el nombre no se conoce antes de ejecutar.. _(manual, 2026-10-21; fuente: `src/modules/time_series/services/timescale-admin.service.ts:122`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `table` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateHypertableDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `chunkTimeInterval` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | Nueva anchura temporal del chunk | `src/modules/time_series/dto/time-series.dto.ts:455` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "chunkTimeInterval": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "chunkTimeInterval": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<HypertableResponseDto>` · DTO `HypertableResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `table` | `string` | Sí | — | — | Valor de table mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:466` |
| `chunkCount` | `number` | No | — | — | Chunks existentes según el catálogo del motor | `src/modules/time_series/dto/time-series.dto.ts:474` |
| `compressionEnabled` | `boolean` | No | — | — | Valor de compression enabled mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:480` |
| `spaceDimensionAdded` | `boolean` | Sí | — | — | Verdadero si se declaró la dimensión de espacio | `src/modules/time_series/dto/time-series.dto.ts:488` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: La tabla no pertenece al catálogo de series del módulo. |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La tabla todavía no es una hypertable; conviértela antes de ajustar sus chunks. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/time_series.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 58 — Series temporales de alto volumen y analítica de eventos — etapa `UC-58-04`

---

## 4. POST /ts/admin/retention/policies

- **Origen:** CONTRATO
- **Nombre:** Aplicar la retención descartando chunks fuera de ventana
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TimescaleAdminController.applyRetention` — `src/modules/time_series/controllers/timescale-admin.controller.ts:112`

### Qué es y para qué sirve (negocio)

Aplicar la retención descartando chunks fuera de ventana. Caso de uso UC-58-06: Descartar chunks fuera de ventana. Dentro del módulo (descripción del modelo, en inglés): «Stores high-frequency readings and operational events that would overload transactional tables.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/time_series/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_58_time_series.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /ts/admin/retention/policies` la atiende `TimescaleAdminController.applyRetention` (src/modules/time_series/controllers/timescale-admin.controller.ts:112). Exige sesión con alguno de los roles SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `ApplyRetentionDto` (5 campos, 4 obligatorios). Delega en `TimescaleAdminService.applyRetention`. Crea filas en messaging.domain_events, messaging.outbox_messages, time_series.ingestion_pipeline_metric_series. Lee directory.tenants, messaging.outbox_messages. Publica ChunksDropped.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN | `src/modules/time_series/controllers/timescale-admin.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenants` | LEE | LEE | DIRECTA | TimescaleAdminController.applyRetention → TimescaleAdminService.applyRetention → TimescaleAdminService.assertTenantExists | `src/modules/time_series/services/timescale-admin.service.ts:180` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | TimescaleAdminController.applyRetention → TimescaleAdminService.applyRetention → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | TimescaleAdminController.applyRetention → TimescaleAdminService.applyRetention → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | TimescaleAdminController.applyRetention → TimescaleAdminService.applyRetention → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `time_series.ingestion_pipeline_metric_series` | ESCRIBE | CREA | DIRECTA | TimescaleAdminController.applyRetention → TimescaleAdminService.applyRetention → SeriesIngestRepository.createPipelineMetric | `src/modules/time_series/repositories/series-ingest.repository.ts:165` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `ChunksDropped` | `src/modules/time_series/services/timescale-admin.service.ts:315` |

### Cuerpo — DTO `ApplyRetentionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `table` | `string` | Sí | valores: ads_delivery_event_series, ai_runtime_metric_series, application_tracking_series, audit_access_metric_series, device_raw_reading_series, ingestion_pipeline_metric_series, lab_analyzer_event_series, location_ping_series, normalized_vital_series, payment_gateway_metric_series, service_sli_series, telemetry_event_series | `@IsIn(TIMESERIES_TABLES)` | — | `src/modules/time_series/dto/time-series.dto.ts:580` |
| `olderThan` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | Descarta los chunks más antiguos que este intervalo | `src/modules/time_series/dto/time-series.dto.ts:591` |
| `batchId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:598` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:605` |
| `reason` | `string` | No | — | `@IsOptional()` `@IsString()` | Por qué se aplica; queda en el log de la operación | `src/modules/time_series/dto/time-series.dto.ts:615` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "table": "ads_delivery_event_series",
  "olderThan": "valor-ejemplo",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "table": "ads_delivery_event_series",
  "olderThan": "valor-ejemplo",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<RetentionResponseDto>` · DTO `RetentionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `table` | `string` | Sí | — | — | Valor de table mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:626` |
| `chunksDropped` | `number` | Sí | — | — | Chunks descartados | `src/modules/time_series/dto/time-series.dto.ts:632` |
| `droppedChunks` | `array<string>` | Sí | — | — | Valor de dropped chunks mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:638` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Tenant no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/time_series.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 58 — Series temporales de alto volumen y analítica de eventos — etapa `UC-58-06`

---

## 5. POST /ts/admin/rollups/{name}/refresh

- **Origen:** CONTRATO
- **Nombre:** Materializar la ventana de un agregado continuo
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TimescaleAdminController.refreshRollup` — `src/modules/time_series/controllers/timescale-admin.controller.ts:159`

### Qué es y para qué sirve (negocio)

Materializar la ventana de un agregado continuo. Caso de uso UC-58-07: Materializar agregado continuo. Dentro del módulo (descripción del modelo, en inglés): «Stores high-frequency readings and operational events that would overload transactional tables.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/time_series/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_58_time_series.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /ts/admin/rollups/{name}/refresh` la atiende `TimescaleAdminController.refreshRollup` (src/modules/time_series/controllers/timescale-admin.controller.ts:159). Exige sesión con alguno de los roles SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `RefreshRollupDto` (4 campos, 4 obligatorios). Delega en `TimescaleAdminService.refreshRollup`. Crea filas en messaging.domain_events, messaging.outbox_messages, time_series.ingestion_pipeline_metric_series. Lee directory.tenants, messaging.outbox_messages. Publica un evento calculado (name === 'continuous_audit_daily'
            ? 'AuditDailyRollupRefreshed'
            : 'SliRollupMaterialized').

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN | `src/modules/time_series/controllers/timescale-admin.controller.ts:159` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenants` | LEE | LEE | DIRECTA | TimescaleAdminController.refreshRollup → TimescaleAdminService.refreshRollup → TimescaleAdminService.assertTenantExists | `src/modules/time_series/services/timescale-admin.service.ts:180` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | TimescaleAdminController.refreshRollup → TimescaleAdminService.refreshRollup → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | TimescaleAdminController.refreshRollup → TimescaleAdminService.refreshRollup → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | TimescaleAdminController.refreshRollup → TimescaleAdminService.refreshRollup → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `time_series.ingestion_pipeline_metric_series` | ESCRIBE | CREA | DIRECTA | TimescaleAdminController.refreshRollup → TimescaleAdminService.refreshRollup → SeriesIngestRepository.createPipelineMetric | `src/modules/time_series/repositories/series-ingest.repository.ts:165` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `name === 'continuous_audit_daily' ? 'AuditDailyRollupRefreshed' : 'SliRollupMaterialized'` | `src/modules/time_series/services/timescale-admin.service.ts:413` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `name` | path | Sí | `string` | — |

### Cuerpo — DTO `RefreshRollupDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `from` | `string` | Sí | formato date-time | `@IsISO8601()` | Inicio de la ventana a materializar | `src/modules/time_series/dto/time-series.dto.ts:655` |
| `to` | `string` | Sí | formato date-time | `@IsISO8601()` | Fin de la ventana, exclusivo | `src/modules/time_series/dto/time-series.dto.ts:665` |
| `batchId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:672` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:679` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<RefreshRollupResponseDto>` · DTO `RefreshRollupResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `rollup` | `string` | Sí | — | — | Valor de rollup mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:690` |
| `bucketsMaterialized` | `number` | Sí | — | — | Buckets materializados en la ventana | `src/modules/time_series/dto/time-series.dto.ts:696` |
| `from` | `string` | Sí | formato date-time | — | Valor de from mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:702` |
| `to` | `string` | Sí | formato date-time | — | Valor de to mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:708` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: El rollup debe ser uno de: {ROLLUP_NAMES.join(', ')}. |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Tenant no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana a materializar tiene que empezar antes de terminar. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/time_series.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 58 — Series temporales de alto volumen y analítica de eventos — etapa `UC-58-07`

---

## 6. POST /ts/admin/rollups/audit-daily/refresh

- **Origen:** CONTRATO
- **Nombre:** Refrescar el rollup de conteos diarios de auditoría
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TimescaleAdminController.refreshAuditDaily` — `src/modules/time_series/controllers/timescale-admin.controller.ts:135`

### Qué es y para qué sirve (negocio)

Refrescar el rollup de conteos diarios de auditoría. Caso de uso UC-58-08: Rollup de conteos de auditoría. Dentro del módulo (descripción del modelo, en inglés): «Stores high-frequency readings and operational events that would overload transactional tables.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/time_series/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_58_time_series.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /ts/admin/rollups/audit-daily/refresh` la atiende `TimescaleAdminController.refreshAuditDaily` (src/modules/time_series/controllers/timescale-admin.controller.ts:135). Exige sesión con alguno de los roles SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `RefreshRollupDto` (4 campos, 4 obligatorios). Delega en `TimescaleAdminService.refreshRollup`. Crea filas en messaging.domain_events, messaging.outbox_messages, time_series.ingestion_pipeline_metric_series. Lee directory.tenants, messaging.outbox_messages. Publica un evento calculado (name === 'continuous_audit_daily'
            ? 'AuditDailyRollupRefreshed'
            : 'SliRollupMaterialized').

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, DATA_PLATFORM_ADMIN, PLATFORM_ADMIN | `src/modules/time_series/controllers/timescale-admin.controller.ts:135` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenants` | LEE | LEE | DIRECTA | TimescaleAdminController.refreshAuditDaily → TimescaleAdminService.refreshRollup → TimescaleAdminService.assertTenantExists | `src/modules/time_series/services/timescale-admin.service.ts:180` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | TimescaleAdminController.refreshAuditDaily → TimescaleAdminService.refreshRollup → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | TimescaleAdminController.refreshAuditDaily → TimescaleAdminService.refreshRollup → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | TimescaleAdminController.refreshAuditDaily → TimescaleAdminService.refreshRollup → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `time_series.ingestion_pipeline_metric_series` | ESCRIBE | CREA | DIRECTA | TimescaleAdminController.refreshAuditDaily → TimescaleAdminService.refreshRollup → SeriesIngestRepository.createPipelineMetric | `src/modules/time_series/repositories/series-ingest.repository.ts:165` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | calculado: `name === 'continuous_audit_daily' ? 'AuditDailyRollupRefreshed' : 'SliRollupMaterialized'` | `src/modules/time_series/services/timescale-admin.service.ts:413` |

### Cuerpo — DTO `RefreshRollupDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `from` | `string` | Sí | formato date-time | `@IsISO8601()` | Inicio de la ventana a materializar | `src/modules/time_series/dto/time-series.dto.ts:655` |
| `to` | `string` | Sí | formato date-time | `@IsISO8601()` | Fin de la ventana, exclusivo | `src/modules/time_series/dto/time-series.dto.ts:665` |
| `batchId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:672` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:679` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "from": "2026-07-31T12:00:00.000Z",
  "to": "2026-07-31T12:00:00.000Z",
  "batchId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<RefreshRollupResponseDto>` · DTO `RefreshRollupResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `rollup` | `string` | Sí | — | — | Valor de rollup mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:690` |
| `bucketsMaterialized` | `number` | Sí | — | — | Buckets materializados en la ventana | `src/modules/time_series/dto/time-series.dto.ts:696` |
| `from` | `string` | Sí | formato date-time | — | Valor de from mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:702` |
| `to` | `string` | Sí | formato date-time | — | Valor de to mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:708` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Tenant no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana a materializar tiene que empezar antes de terminar. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/time_series.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 58 — Series temporales de alto volumen y analítica de eventos — etapa `UC-58-08`

---

## 7. POST /ts/ads/events/batch-ingest

- **Origen:** CONTRATO
- **Nombre:** Ingerir eventos de entrega de publicidad
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SeriesController.batchIngestAdsEvents` — `src/modules/time_series/controllers/series.controller.ts:157`

### Qué es y para qué sirve (negocio)

Ingerir eventos de entrega de publicidad. Caso de uso UC-58-10: Eventos de publicidad con dedupe. Dentro del módulo (descripción del modelo, en inglés): «Stores high-frequency readings and operational events that would overload transactional tables.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/time_series/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_58_time_series.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /ts/ads/events/batch-ingest` la atiende `SeriesController.batchIngestAdsEvents` (src/modules/time_series/controllers/series.controller.ts:157). Exige sesión con alguno de los roles INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `BatchIngestAdsDto` (14 campos, 8 obligatorios). Delega en `SeriesIngestService.batchIngestAdsEvents`. Crea filas en messaging.domain_events, messaging.outbox_messages, time_series.ads_delivery_event_series, time_series.ingestion_pipeline_metric_series. Lee messaging.outbox_messages, time_series.ads_delivery_event_series. Publica AdsEventsIngested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN | `src/modules/time_series/controllers/series.controller.ts:157` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | SeriesController.batchIngestAdsEvents → SeriesIngestService.batchIngestAdsEvents → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | SeriesController.batchIngestAdsEvents → SeriesIngestService.batchIngestAdsEvents → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | SeriesController.batchIngestAdsEvents → SeriesIngestService.batchIngestAdsEvents → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `time_series.ads_delivery_event_series` | ESCRIBE | CREA | DIRECTA | SeriesController.batchIngestAdsEvents → SeriesIngestService.batchIngestAdsEvents → SeriesIngestRepository.createAdsEvent | `src/modules/time_series/repositories/series-ingest.repository.ts:343` |
| `time_series.ads_delivery_event_series` | LEE | LEE | DIRECTA | SeriesController.batchIngestAdsEvents → SeriesIngestService.batchIngestAdsEvents → SeriesIngestRepository.findAdsEvent | `src/modules/time_series/repositories/series-ingest.repository.ts:324` |
| `time_series.ingestion_pipeline_metric_series` | ESCRIBE | CREA | DIRECTA | SeriesController.batchIngestAdsEvents → SeriesIngestService.batchIngestAdsEvents → SeriesIngestService.recordPipelineMetric → SeriesIngestRepository.createPipelineMetric | `src/modules/time_series/repositories/series-ingest.repository.ts:165` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `AdsEventsIngested` | `src/modules/time_series/services/series-ingest.service.ts:291` |

### Cuerpo — DTO `BatchIngestAdsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:928` |
| `ingestionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:935` |
| `seriesId` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/time_series/dto/time-series.dto.ts:944` |
| `events` | `array<AdsEventDto>` | Sí | mínimo 1 elemento(s); máximo 5000 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_BATCH_ROWS)` `@ValidateNested({ each: true })` `@Type(() => AdsEventDto)` | — | `src/modules/time_series/dto/time-series.dto.ts:955` |
| `events[].time` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/time_series/dto/time-series.dto.ts:844` |
| `events[].adAccountId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:851` |
| `events[].campaignId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:858` |
| `events[].adSetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:866` |
| `events[].adId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:874` |
| `events[].eventName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/time_series/dto/time-series.dto.ts:882` |
| `events[].eventId` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Identificador del origen; es la clave de deduplicación | `src/modules/time_series/dto/time-series.dto.ts:893` |
| `events[].value` | `number` | No | — | `@IsOptional()` `@IsNumber()` | — | `src/modules/time_series/dto/time-series.dto.ts:901` |
| `events[].currencyCode` | `string` | No | longitud máxima 3 | `@IsOptional()` `@IsString()` `@MaxLength(3)` | — | `src/modules/time_series/dto/time-series.dto.ts:910` |
| `events[].dimensions` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/time_series/dto/time-series.dto.ts:918` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<BatchIngestResponseDto>` · DTO `BatchIngestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `seriesId` | `string` | Sí | — | — | Identificador asociado a series. | `src/modules/time_series/dto/time-series.dto.ts:117` |
| `ingestionId` | `string` | Sí | formato uuid | — | Identificador asociado a ingestion. | `src/modules/time_series/dto/time-series.dto.ts:123` |
| `rowsIngested` | `number` | Sí | — | — | Filas efectivamente insertadas | `src/modules/time_series/dto/time-series.dto.ts:129` |
| `rowsSkipped` | `number` | Sí | — | — | Filas descartadas por ser duplicado del origen | `src/modules/time_series/dto/time-series.dto.ts:137` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/time_series.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 58 — Series temporales de alto volumen y analítica de eventos — etapa `UC-58-10`

---

## 8. POST /ts/devices/{deviceId}/readings/ingest

- **Origen:** CONTRATO
- **Nombre:** Ingerir lecturas de un dispositivo médico
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SeriesController.ingestDeviceReadings` — `src/modules/time_series/controllers/series.controller.ts:116`

### Qué es y para qué sirve (negocio)

Ingerir lecturas de un dispositivo médico. Caso de uso UC-58-02: Lectura de dispositivo médico. Dentro del módulo (descripción del modelo, en inglés): «Stores high-frequency readings and operational events that would overload transactional tables.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/time_series/README.md:46`) · MODELO (`Mantra Core Health Context/modules/diagram_58_time_series.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /ts/devices/{deviceId}/readings/ingest` la atiende `SeriesController.ingestDeviceReadings` (src/modules/time_series/controllers/series.controller.ts:116). Exige sesión con alguno de los roles INGEST_GATEWAY, DEVICE, SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `IngestDeviceReadingsDto` (12 campos, 6 obligatorios). Delega en `SeriesIngestService.ingestDeviceReadings`. Crea filas en messaging.domain_events, messaging.outbox_messages, time_series.device_raw_reading_series, time_series.ingestion_pipeline_metric_series. Lee messaging.outbox_messages, time_series.device_raw_reading_series. Publica DeviceRawReadingReceived.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: INGEST_GATEWAY, DEVICE, SYSTEM, PLATFORM_ADMIN | `src/modules/time_series/controllers/series.controller.ts:116` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: deviceId | `src/modules/time_series/controllers/series.controller.ts:116` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | SeriesController.ingestDeviceReadings → SeriesIngestService.ingestDeviceReadings → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | SeriesController.ingestDeviceReadings → SeriesIngestService.ingestDeviceReadings → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | SeriesController.ingestDeviceReadings → SeriesIngestService.ingestDeviceReadings → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `time_series.device_raw_reading_series` | ESCRIBE | CREA | DIRECTA | SeriesController.ingestDeviceReadings → SeriesIngestService.ingestDeviceReadings → SeriesIngestRepository.createDeviceReading | `src/modules/time_series/repositories/series-ingest.repository.ts:256` |
| `time_series.device_raw_reading_series` | LEE | LEE | DIRECTA | SeriesController.ingestDeviceReadings → SeriesIngestService.ingestDeviceReadings → SeriesIngestRepository.findDeviceReadingBySequence | `src/modules/time_series/repositories/series-ingest.repository.ts:200` |
| `time_series.ingestion_pipeline_metric_series` | ESCRIBE | CREA | DIRECTA | SeriesController.ingestDeviceReadings → SeriesIngestService.ingestDeviceReadings → SeriesIngestService.recordPipelineMetric → SeriesIngestRepository.createPipelineMetric | `src/modules/time_series/repositories/series-ingest.repository.ts:165` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `DeviceRawReadingReceived` | `src/modules/time_series/services/series-ingest.service.ts:203` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `deviceId` | path | Sí | `string` | — |

### Cuerpo — DTO `IngestDeviceReadingsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:224` |
| `ingestionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:231` |
| `seriesId` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Serie a la que pertenecen; por omisión, el dispositivo | `src/modules/time_series/dto/time-series.dto.ts:243` |
| `readings` | `array<DeviceReadingDto>` | Sí | mínimo 1 elemento(s); máximo 5000 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_BATCH_ROWS)` `@ValidateNested({ each: true })` `@Type(() => DeviceReadingDto)` | — | `src/modules/time_series/dto/time-series.dto.ts:254` |
| `readings[].time` | `string` | Sí | formato date-time | `@IsISO8601()` | — | `src/modules/time_series/dto/time-series.dto.ts:153` |
| `readings[].channelCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Canal del dispositivo | `src/modules/time_series/dto/time-series.dto.ts:161` |
| `readings[].rawValue` | `object` | Sí | — | `@IsObject()` | Lectura tal como la emite el dispositivo | `src/modules/time_series/dto/time-series.dto.ts:168` |
| `readings[].numericValue` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Valor numérico extraído, si lo hay | `src/modules/time_series/dto/time-series.dto.ts:176` |
| `readings[].unitCode` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/time_series/dto/time-series.dto.ts:185` |
| `readings[].deviceSequence` | `string` | No | — | `@IsOptional()` `@IsNumberString({ no_symbols: true })` | Secuencia monótona por canal; cadena por ser bigint | `src/modules/time_series/dto/time-series.dto.ts:195` |
| `readings[].observedAtDevice` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | Instante según el reloj del dispositivo | `src/modules/time_series/dto/time-series.dto.ts:206` |
| `readings[].patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:214` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<BatchIngestResponseDto>` · DTO `BatchIngestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `seriesId` | `string` | Sí | — | — | Identificador asociado a series. | `src/modules/time_series/dto/time-series.dto.ts:117` |
| `ingestionId` | `string` | Sí | formato uuid | — | Identificador asociado a ingestion. | `src/modules/time_series/dto/time-series.dto.ts:123` |
| `rowsIngested` | `number` | Sí | — | — | Filas efectivamente insertadas | `src/modules/time_series/dto/time-series.dto.ts:129` |
| `rowsSkipped` | `number` | Sí | — | — | Filas descartadas por ser duplicado del origen | `src/modules/time_series/dto/time-series.dto.ts:137` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/time_series.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 58 — Series temporales de alto volumen y analítica de eventos — etapa `UC-58-02`

---

## 9. POST /ts/location/pings/batch-ingest

- **Origen:** CONTRATO
- **Nombre:** Ingerir pings de ubicación
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SeriesController.batchIngestLocationPings` — `src/modules/time_series/controllers/series.controller.ts:206`

### Qué es y para qué sirve (negocio)

Ingerir pings de ubicación. Caso de uso UC-58-13: Pings de ubicación con consentimiento. Dentro del módulo (descripción del modelo, en inglés): «Stores high-frequency readings and operational events that would overload transactional tables.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/time_series/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_58_time_series.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /ts/location/pings/batch-ingest` la atiende `SeriesController.batchIngestLocationPings` (src/modules/time_series/controllers/series.controller.ts:206). Exige sesión con alguno de los roles INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `BatchIngestLocationDto` (14 campos, 9 obligatorios). Delega en `SeriesIngestService.batchIngestLocationPings`. Crea filas en messaging.domain_events, messaging.outbox_messages, time_series.ingestion_pipeline_metric_series, time_series.location_ping_series. Lee consent.consents, consent.processing_purposes, iam.devices, messaging.outbox_messages, profiles.person_account_links. Publica LocationPingsIngested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN | `src/modules/time_series/controllers/series.controller.ts:206` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `consent.consents` | LEE | LEE | DIRECTA | SeriesController.batchIngestLocationPings → SeriesIngestService.batchIngestLocationPings → LocationConsentPolicy.assertAllowed | `src/modules/time_series/services/location-consent.policy.ts:73` |
| `consent.processing_purposes` | LEE | LEE | DIRECTA | SeriesController.batchIngestLocationPings → SeriesIngestService.batchIngestLocationPings → LocationConsentPolicy.assertAllowed | `src/modules/time_series/services/location-consent.policy.ts:93` |
| `iam.devices` | LEE | LEE | DIRECTA | SeriesController.batchIngestLocationPings → SeriesIngestService.batchIngestLocationPings → LocationConsentPolicy.assertAllowed → LocationConsentPolicy.holderSubjectIds | `src/modules/time_series/services/location-consent.policy.ts:132` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | SeriesController.batchIngestLocationPings → SeriesIngestService.batchIngestLocationPings → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | SeriesController.batchIngestLocationPings → SeriesIngestService.batchIngestLocationPings → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | SeriesController.batchIngestLocationPings → SeriesIngestService.batchIngestLocationPings → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | SeriesController.batchIngestLocationPings → SeriesIngestService.batchIngestLocationPings → LocationConsentPolicy.assertAllowed → LocationConsentPolicy.holderSubjectIds | `src/modules/time_series/services/location-consent.policy.ts:124` |
| `time_series.ingestion_pipeline_metric_series` | ESCRIBE | CREA | DIRECTA | SeriesController.batchIngestLocationPings → SeriesIngestService.batchIngestLocationPings → SeriesIngestService.recordPipelineMetric → SeriesIngestRepository.createPipelineMetric | `src/modules/time_series/repositories/series-ingest.repository.ts:165` |
| `time_series.location_ping_series` | ESCRIBE | CREA | DIRECTA | SeriesController.batchIngestLocationPings → SeriesIngestService.batchIngestLocationPings → SeriesIngestRepository.createLocationPing | `src/modules/time_series/repositories/series-ingest.repository.ts:359` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `LocationPingsIngested` | `src/modules/time_series/services/series-ingest.service.ts:442` |

### Cuerpo — DTO `BatchIngestLocationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:1183` |
| `ingestionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:1190` |
| `seriesId` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/time_series/dto/time-series.dto.ts:1199` |
| `consentId` | `string` | Sí | formato uuid | `@IsUUID()` | Consentimiento vigente que ampara el registro de ubicación del sujeto | `src/modules/time_series/dto/time-series.dto.ts:1210` |
| `pings` | `array<TimeSeriesLocationPingDto>` | Sí | mínimo 1 elemento(s); máximo 5000 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_BATCH_ROWS)` `@ValidateNested({ each: true })` `@Type(() => LocationPingDto)` | — | `src/modules/time_series/dto/time-series.dto.ts:1221` |
| `pings[].time` | `string` | Sí | formato date-time | — | — | sin fuente |
| `pings[].subjectType` | `string` | Sí | longitud máxima 50 | — | — | sin fuente |
| `pings[].subjectId` | `string` | Sí | formato uuid | — | — | sin fuente |
| `pings[].latitude` | `number` | Sí | mínimo -90; máximo 90 | — | — | sin fuente |
| `pings[].longitude` | `number` | Sí | mínimo -180; máximo 180 | — | — | sin fuente |
| `pings[].altitudeM` | `number` | No | — | — | — | sin fuente |
| `pings[].accuracyM` | `number` | No | mínimo 0 | — | — | sin fuente |
| `pings[].speedMps` | `number` | No | mínimo 0 | — | — | sin fuente |
| `pings[].geohash` | `string` | No | longitud máxima 20 | — | — | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "consentId": "00000000-0000-4000-8000-000000000001",
  "pings": [
    {
      "time": "2026-07-31T12:00:00.000Z",
      "subjectType": "valor-ejemplo",
      "subjectId": "00000000-0000-4000-8000-000000000001",
      "latitude": 1,
      "longitude": 1
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "ingestionId": "00000000-0000-4000-8000-000000000001",
  "seriesId": "00000000-0000-4000-8000-000000000001",
  "consentId": "00000000-0000-4000-8000-000000000001",
  "pings": [
    {
      "time": "2026-07-31T12:00:00.000Z",
      "subjectType": "valor-ejemplo",
      "subjectId": "00000000-0000-4000-8000-000000000001",
      "latitude": 1,
      "longitude": 1,
      "altitudeM": 1,
      "accuracyM": 1,
      "speedMps": 1,
      "geohash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    }
  ]
}
```

</details>

### Respuesta — `Promise<BatchIngestResponseDto>` · DTO `BatchIngestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `seriesId` | `string` | Sí | — | — | Identificador asociado a series. | `src/modules/time_series/dto/time-series.dto.ts:117` |
| `ingestionId` | `string` | Sí | formato uuid | — | Identificador asociado a ingestion. | `src/modules/time_series/dto/time-series.dto.ts:123` |
| `rowsIngested` | `number` | Sí | — | — | Filas efectivamente insertadas | `src/modules/time_series/dto/time-series.dto.ts:129` |
| `rowsSkipped` | `number` | Sí | — | — | Filas descartadas por ser duplicado del origen | `src/modules/time_series/dto/time-series.dto.ts:137` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/time_series.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 58 — Series temporales de alto volumen y analítica de eventos — etapa `UC-58-13`

---

## 10. POST /ts/metrics/{dataset}/batch-ingest

- **Origen:** CONTRATO
- **Nombre:** Ingerir métricas de runtime de IA, pipeline o SLI
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SeriesController.batchIngestMetrics` — `src/modules/time_series/controllers/series.controller.ts:176`

### Qué es y para qué sirve (negocio)

Ingerir métricas de runtime de IA, pipeline o SLI. Caso de uso UC-58-11: Métricas de runtime y pipeline. Dentro del módulo (descripción del modelo, en inglés): «Stores high-frequency readings and operational events that would overload transactional tables.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/time_series/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_58_time_series.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /ts/metrics/{dataset}/batch-ingest` la atiende `SeriesController.batchIngestMetrics` (src/modules/time_series/controllers/series.controller.ts:176). Exige sesión con alguno de los roles INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `BatchIngestMetricsDto` (6 campos, 5 obligatorios). Delega en `SeriesIngestService.batchIngestMetrics`. Crea filas en messaging.domain_events, messaging.outbox_messages, time_series.ingestion_pipeline_metric_series. Lee messaging.outbox_messages. Publica RuntimeMetricsIngested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN | `src/modules/time_series/controllers/series.controller.ts:176` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | SeriesController.batchIngestMetrics → SeriesIngestService.batchIngestMetrics → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | SeriesController.batchIngestMetrics → SeriesIngestService.batchIngestMetrics → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | SeriesController.batchIngestMetrics → SeriesIngestService.batchIngestMetrics → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `time_series.ingestion_pipeline_metric_series` | ESCRIBE | CREA | DIRECTA | SeriesController.batchIngestMetrics → SeriesIngestService.batchIngestMetrics → SeriesIngestService.recordPipelineMetric → SeriesIngestRepository.createPipelineMetric | `src/modules/time_series/repositories/series-ingest.repository.ts:165` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `RuntimeMetricsIngested` | `src/modules/time_series/services/series-ingest.service.ts:355` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `dataset` | path | Sí | `string` | — |

### Cuerpo — DTO `BatchIngestMetricsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:969` |
| `ingestionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:976` |
| `seriesId` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/time_series/dto/time-series.dto.ts:985` |
| `points` | `array<SeriesPointDto>` | Sí | mínimo 1 elemento(s); máximo 5000 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_BATCH_ROWS)` `@ValidateNested({ each: true })` `@Type(() => SeriesPointDto)` | — | `src/modules/time_series/dto/time-series.dto.ts:996` |
| `points[].time` | `string` | Sí | formato date-time | `@IsISO8601()` | Instante de la medición | `src/modules/time_series/dto/time-series.dto.ts:45` |
| `points[].values` | `object` | Sí | — | `@IsObject()` | Resto de columnas del punto, según el dataset al que se ingiere | `src/modules/time_series/dto/time-series.dto.ts:55` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<BatchIngestResponseDto>` · DTO `BatchIngestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `seriesId` | `string` | Sí | — | — | Identificador asociado a series. | `src/modules/time_series/dto/time-series.dto.ts:117` |
| `ingestionId` | `string` | Sí | formato uuid | — | Identificador asociado a ingestion. | `src/modules/time_series/dto/time-series.dto.ts:123` |
| `rowsIngested` | `number` | Sí | — | — | Filas efectivamente insertadas | `src/modules/time_series/dto/time-series.dto.ts:129` |
| `rowsSkipped` | `number` | Sí | — | — | Filas descartadas por ser duplicado del origen | `src/modules/time_series/dto/time-series.dto.ts:137` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: El dataset de métricas debe ser uno de: {METRIC_DATASETS.join(', ')}. |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/time_series.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 58 — Series temporales de alto volumen y analítica de eventos — etapa `UC-58-11`

---

## 11. POST /ts/normalize/run

- **Origen:** CONTRATO
- **Nombre:** Normalizar una lectura cruda y promoverla al registro clínico
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SeriesController.normalizeReading` — `src/modules/time_series/controllers/series.controller.ts:137`

### Qué es y para qué sirve (negocio)

Normalizar una lectura cruda y promoverla al registro clínico. Caso de uso UC-58-03: Normalizar y promover a clinical.observations. Dentro del módulo (descripción del modelo, en inglés): «Stores high-frequency readings and operational events that would overload transactional tables.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/time_series/README.md:47`) · MODELO (`Mantra Core Health Context/modules/diagram_58_time_series.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /ts/normalize/run` la atiende `SeriesController.normalizeReading` (src/modules/time_series/controllers/series.controller.ts:137). Exige sesión con alguno de los roles SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `NormalizeReadingDto` (10 campos, 7 obligatorios). Delega en `VitalNormalizationService.normalizeReading`. Crea filas en clinical.observations, messaging.domain_events, messaging.outbox_messages, time_series.ingestion_pipeline_metric_series, time_series.normalized_vital_series. Actualiza time_series.normalized_vital_series. Lee messaging.outbox_messages, time_series.device_raw_reading_series, time_series.normalized_vital_series. Publica VitalNormalizedAndPromoted.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, PLATFORM_ADMIN | `src/modules/time_series/controllers/series.controller.ts:137` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.observations` | ESCRIBE | CREA | DIRECTA | SeriesController.normalizeReading → VitalNormalizationService.normalizeReading → ObservationsRepository.create | `src/modules/clinical/repositories/observations.repository.ts:300` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | SeriesController.normalizeReading → VitalNormalizationService.normalizeReading → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | SeriesController.normalizeReading → VitalNormalizationService.normalizeReading → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | SeriesController.normalizeReading → VitalNormalizationService.normalizeReading → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `time_series.device_raw_reading_series` | LEE | LEE | DIRECTA | SeriesController.normalizeReading → VitalNormalizationService.normalizeReading → SeriesIngestRepository.findDeviceReadingForUpdate | `src/modules/time_series/repositories/series-ingest.repository.ts:275` |
| `time_series.ingestion_pipeline_metric_series` | ESCRIBE | CREA | DIRECTA | SeriesController.normalizeReading → VitalNormalizationService.normalizeReading → SeriesIngestRepository.createPipelineMetric | `src/modules/time_series/repositories/series-ingest.repository.ts:165` |
| `time_series.normalized_vital_series` | ESCRIBE | ACTUALIZA | POR_TIPO | SeriesController.normalizeReading → VitalNormalizationService.normalizeReading | `src/modules/time_series/services/vital-normalization.service.ts:144` |
| `time_series.normalized_vital_series` | ESCRIBE | CREA | DIRECTA | SeriesController.normalizeReading → VitalNormalizationService.normalizeReading → SeriesIngestRepository.createVital | `src/modules/time_series/repositories/series-ingest.repository.ts:308` |
| `time_series.normalized_vital_series` | LEE | LEE | DIRECTA | SeriesController.normalizeReading → VitalNormalizationService.normalizeReading → SeriesIngestRepository.findVital | `src/modules/time_series/repositories/series-ingest.repository.ts:293` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `VitalNormalizedAndPromoted` | `src/modules/time_series/services/vital-normalization.service.ts:162` |

### Cuerpo — DTO `NormalizeReadingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `time` | `string` | Sí | formato date-time | `@IsISO8601()` | Instante de la lectura cruda | `src/modules/time_series/dto/time-series.dto.ts:271` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:278` |
| `seriesId` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/time_series/dto/time-series.dto.ts:286` |
| `observationCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código de observación al que mapea el canal | `src/modules/time_series/dto/time-series.dto.ts:297` |
| `observationCodeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concepto del código de observación, necesario para promover a clinical | `src/modules/time_series/dto/time-series.dto.ts:308` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:315` |
| `unitCode` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | — | `src/modules/time_series/dto/time-series.dto.ts:323` |
| `unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad como concepto, para la observación clínica | `src/modules/time_series/dto/time-series.dto.ts:334` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:342` |
| `promoteToClinical` | `boolean` | No | — | `@IsOptional()` | Si la medición es clínicamente significativa y debe promoverse | `src/modules/time_series/dto/time-series.dto.ts:353` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<NormalizeReadingResponseDto>` · DTO `NormalizeReadingResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `seriesId` | `string` | Sí | — | — | Identificador asociado a series. | `src/modules/time_series/dto/time-series.dto.ts:364` |
| `observationCode` | `string` | Sí | — | — | Valor de observation code mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:370` |
| `validationState` | `string` | Sí | — | — | Valor de validation state mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:376` |
| `clinicallyPromotedObservationId` | `string` | No | formato uuid | — | Observación clínica creada al promover | `src/modules/time_series/dto/time-series.dto.ts:385` |
| `duplicate` | `boolean` | Sí | — | — | Verdadero si la lectura ya se había normalizado antes | `src/modules/time_series/dto/time-series.dto.ts:393` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No hay lectura cruda para ese instante y serie. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La lectura cruda está marcada como rechazada; no se normaliza.; PreconditionFailedException: La lectura cruda no tiene valor numérico; no se puede normalizar. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/time_series.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 58 — Series temporales de alto volumen y analítica de eventos — etapa `UC-58-03`

---

## 12. POST /ts/series/{seriesId}/backfill/governed

- **Origen:** CONTRATO
- **Nombre:** Backfill gobernado de una serie
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SeriesController.governedBackfill` — `src/modules/time_series/controllers/series.controller.ts:95`

### Qué es y para qué sirve (negocio)

Backfill gobernado de una serie. Caso de uso UC-58-12: Corrección append-only gobernada. Dentro del módulo (descripción del modelo, en inglés): «Stores high-frequency readings and operational events that would overload transactional tables.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/time_series/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_58_time_series.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /ts/series/{seriesId}/backfill/governed` la atiende `SeriesController.governedBackfill` (src/modules/time_series/controllers/series.controller.ts:95). Exige sesión con alguno de los roles DATA_PLATFORM_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `GovernedBackfillDto` (9 campos, 9 obligatorios). Delega en `SeriesIngestService.governedBackfill`. Crea filas en messaging.domain_events, messaging.outbox_messages, time_series.ingestion_pipeline_metric_series. Lee messaging.outbox_messages. Publica GovernedBackfillApplied.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_PLATFORM_ADMIN, PLATFORM_ADMIN | `src/modules/time_series/controllers/series.controller.ts:95` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | SeriesController.governedBackfill → SeriesIngestService.governedBackfill → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | SeriesController.governedBackfill → SeriesIngestService.governedBackfill → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | SeriesController.governedBackfill → SeriesIngestService.governedBackfill → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `time_series.ingestion_pipeline_metric_series` | ESCRIBE | CREA | DIRECTA | SeriesController.governedBackfill → SeriesIngestService.governedBackfill → SeriesIngestService.recordPipelineMetric → SeriesIngestRepository.createPipelineMetric | `src/modules/time_series/repositories/series-ingest.repository.ts:165` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `GovernedBackfillApplied` | `src/modules/time_series/services/series-ingest.service.ts:548` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `seriesId` | path | Sí | `string` | — |

### Cuerpo — DTO `GovernedBackfillDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `dataset` | `string` | Sí | valores: device_raw_reading_series, telemetry_event_series | `@IsIn(BACKFILLABLE_DATASETS)` | — | `src/modules/time_series/dto/time-series.dto.ts:1010` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:1017` |
| `batchId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:1024` |
| `justification` | `string` | Sí | — | `@IsString()` | Justificación de la corrección; sin ella no se aplica | `src/modules/time_series/dto/time-series.dto.ts:1033` |
| `windowFrom` | `string` | Sí | formato date-time | `@IsISO8601()` | Inicio de la ventana corregida | `src/modules/time_series/dto/time-series.dto.ts:1043` |
| `windowTo` | `string` | Sí | formato date-time | `@IsISO8601()` | Fin de la ventana corregida | `src/modules/time_series/dto/time-series.dto.ts:1053` |
| `corrections` | `array<SeriesPointDto>` | Sí | mínimo 1 elemento(s); máximo 5000 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_BATCH_ROWS)` `@ValidateNested({ each: true })` `@Type(() => SeriesPointDto)` | — | `src/modules/time_series/dto/time-series.dto.ts:1064` |
| `corrections[].time` | `string` | Sí | formato date-time | `@IsISO8601()` | Instante de la medición | `src/modules/time_series/dto/time-series.dto.ts:45` |
| `corrections[].values` | `object` | Sí | — | `@IsObject()` | Resto de columnas del punto, según el dataset al que se ingiere | `src/modules/time_series/dto/time-series.dto.ts:55` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<GovernedBackfillResponseDto>` · DTO `GovernedBackfillResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `seriesId` | `string` | Sí | — | — | Identificador asociado a series. | `src/modules/time_series/dto/time-series.dto.ts:1075` |
| `rowsBackfilled` | `number` | Sí | — | — | Correcciones insertadas como eventos nuevos | `src/modules/time_series/dto/time-series.dto.ts:1081` |
| `sourceVersion` | `string` | Sí | — | — | Versión de origen con la que entraron las correcciones | `src/modules/time_series/dto/time-series.dto.ts:1089` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana de corrección tiene que empezar antes de terminar.; PreconditionFailedException: Una corrección cae fuera de la ventana declarada. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/time_series.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 58 — Series temporales de alto volumen y analítica de eventos — etapa `UC-58-12`

---

## 13. POST /ts/series/{seriesId}/points/batch-ingest

- **Origen:** CONTRATO
- **Nombre:** Ingerir un lote de puntos en una serie
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SeriesController.batchIngestPoints` — `src/modules/time_series/controllers/series.controller.ts:75`

### Qué es y para qué sirve (negocio)

Ingerir un lote de puntos en una serie. Caso de uso UC-58-01: Lote append-only de puntos. Dentro del módulo (descripción del modelo, en inglés): «Stores high-frequency readings and operational events that would overload transactional tables.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/time_series/README.md:45`) · MODELO (`Mantra Core Health Context/modules/diagram_58_time_series.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /ts/series/{seriesId}/points/batch-ingest` la atiende `SeriesController.batchIngestPoints` (src/modules/time_series/controllers/series.controller.ts:75). Exige sesión con alguno de los roles INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `BatchIngestPointsDto` (7 campos, 6 obligatorios). Delega en `SeriesIngestService.batchIngestPoints`. Crea filas en messaging.domain_events, messaging.outbox_messages, time_series.ingestion_pipeline_metric_series. Lee messaging.outbox_messages. Publica SeriesBatchIngested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: INGEST_GATEWAY, SYSTEM, PLATFORM_ADMIN | `src/modules/time_series/controllers/series.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | SeriesController.batchIngestPoints → SeriesIngestService.batchIngestPoints → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | SeriesController.batchIngestPoints → SeriesIngestService.batchIngestPoints → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | SeriesController.batchIngestPoints → SeriesIngestService.batchIngestPoints → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `time_series.ingestion_pipeline_metric_series` | ESCRIBE | CREA | DIRECTA | SeriesController.batchIngestPoints → SeriesIngestService.batchIngestPoints → SeriesIngestService.recordPipelineMetric → SeriesIngestRepository.createPipelineMetric | `src/modules/time_series/repositories/series-ingest.repository.ts:165` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `SeriesBatchIngested` | `src/modules/time_series/services/series-ingest.service.ts:104` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `seriesId` | path | Sí | `string` | — |

### Cuerpo — DTO `BatchIngestPointsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `dataset` | `string` | Sí | valores: device_raw_reading_series, telemetry_event_series, application_tracking_series, audit_access_metric_series, lab_analyzer_event_series, payment_gateway_metric_series | `@IsIn(BATCH_INGEST_DATASETS)` | Serie a la que se ingiere | `src/modules/time_series/dto/time-series.dto.ts:68` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/time_series/dto/time-series.dto.ts:75` |
| `ingestionId` | `string` | Sí | formato uuid | `@IsUUID()` | Identificador del lote; el mismo lote reenviado no vuelve a entrar | `src/modules/time_series/dto/time-series.dto.ts:86` |
| `sourceVersion` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/time_series/dto/time-series.dto.ts:95` |
| `points` | `array<SeriesPointDto>` | Sí | mínimo 1 elemento(s); máximo 5000 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_BATCH_ROWS)` `@ValidateNested({ each: true })` `@Type(() => SeriesPointDto)` | — | `src/modules/time_series/dto/time-series.dto.ts:106` |
| `points[].time` | `string` | Sí | formato date-time | `@IsISO8601()` | Instante de la medición | `src/modules/time_series/dto/time-series.dto.ts:45` |
| `points[].values` | `object` | Sí | — | `@IsObject()` | Resto de columnas del punto, según el dataset al que se ingiere | `src/modules/time_series/dto/time-series.dto.ts:55` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<BatchIngestResponseDto>` · DTO `BatchIngestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `seriesId` | `string` | Sí | — | — | Identificador asociado a series. | `src/modules/time_series/dto/time-series.dto.ts:117` |
| `ingestionId` | `string` | Sí | formato uuid | — | Identificador asociado a ingestion. | `src/modules/time_series/dto/time-series.dto.ts:123` |
| `rowsIngested` | `number` | Sí | — | — | Filas efectivamente insertadas | `src/modules/time_series/dto/time-series.dto.ts:129` |
| `rowsSkipped` | `number` | Sí | — | — | Filas descartadas por ser duplicado del origen | `src/modules/time_series/dto/time-series.dto.ts:137` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/time_series.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 58 — Series temporales de alto volumen y analítica de eventos — etapa `UC-58-01`

---

## 14. GET /ts/series/{seriesId}/query

- **Origen:** CONTRATO
- **Nombre:** Consultar un rango con downsampling
- **Bloque:** Datos y NoSQL
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SeriesController.queryRange` — `src/modules/time_series/controllers/series.controller.ts:60`

### Qué es y para qué sirve (negocio)

Consultar un rango con downsampling. Caso de uso UC-58-09: Rango con downsampling. Dentro del módulo (descripción del modelo, en inglés): «Stores high-frequency readings and operational events that would overload transactional tables.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/time_series/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_58_time_series.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`GET /ts/series/{seriesId}/query` la atiende `SeriesController.queryRange` (src/modules/time_series/controllers/series.controller.ts:60). Exige sesión con alguno de los roles ANALYST, DATA_PLATFORM_ADMIN, SYSTEM, PLATFORM_ADMIN. Delega en `SeriesQueryService.queryRange`. No toca tablas relacionales: Lee series temporales de una tabla que elige la petición (`query.dataset`) o de un rollup; el nombre no se conoce antes de ejecutar..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: ANALYST, DATA_PLATFORM_ADMIN, SYSTEM, PLATFORM_ADMIN | `src/modules/time_series/controllers/series.controller.ts:60` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_QUERY | dataset (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | tenantId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | from (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | to (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | bucket (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: Lee series temporales de una tabla que elige la petición (`query.dataset`) o de un rollup; el nombre no se conoce antes de ejecutar.. _(manual, 2026-10-21; fuente: `src/modules/time_series/services/series-query.service.ts:122`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `seriesId` | path | Sí | `string` | — |
| `dataset` | query | Sí | `string` | — |
| `tenantId` | query | Sí | `string` | — |
| `from` | query | Sí | `string` | — |
| `to` | query | Sí | `string` | — |
| `bucket` | query | Sí | `string` | Anchura del bucket, p. ej. `5 minutes` o `1 day` |
| `agg` | query | No | `string` | — |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<QuerySeriesRangeResponseDto>` · DTO `QuerySeriesRangeResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `seriesId` | `string` | Sí | — | — | Identificador asociado a series. | `src/modules/time_series/dto/time-series.dto.ts:806` |
| `source` | `string` | Sí | — | — | De dónde salió el dato: `raw` o el nombre del rollup | `src/modules/time_series/dto/time-series.dto.ts:814` |
| `points` | `array<SeriesPointResponseDto>` | Sí | — | — | Valor de points mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:820` |
| `points[].bucket` | `string` | Sí | formato date-time | — | Valor de bucket mantenido por la instancia. | `src/modules/time_series/dto/time-series.dto.ts:783` |
| `points[].value` | `number` | No | admite null | — | Valor agregado del bucket | `src/modules/time_series/dto/time-series.dto.ts:789` |
| `points[].samples` | `number` | Sí | — | — | Muestras que entraron en el bucket | `src/modules/time_series/dto/time-series.dto.ts:795` |
| `truncated` | `boolean` | Sí | — | — | Verdadero si la respuesta llegó al tope y hay más datos | `src/modules/time_series/dto/time-series.dto.ts:828` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El rango tiene que empezar antes de terminar.; PreconditionFailedException: Esta serie no tiene magnitud que agregar; sólo admite `count`. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | — | InternalServerErrorException: La consulta declara una agregación que no es válida.; InternalServerErrorException: La consulta declara una columna que no es válida.; InternalServerErrorException: La serie no tiene columna numérica: sólo admite conteo. |

El árbol de decisión completo está en [flujos](../flujos/time_series.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 58 — Series temporales de alto volumen y analítica de eventos — etapa `UC-58-09`

---

