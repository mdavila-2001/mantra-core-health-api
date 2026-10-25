<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `lakehouse`

- **Bloque:** Datos y NoSQL (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)
- **Operaciones:** 13 (13 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 12 · BAJO 1
- **Tablas distintas que tocan:** 22
- **Respuestas de error y detalle contractual:** `openapi/endpoints/lakehouse.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/lakehouse/catalogs` | Registrar el catálogo / metastore | MEDIO | 5 | DATA_PLATFORM_ENGINEER, PLATFORM_ADMIN |
| 2 | POST | `/lakehouse/data-products/{id}/versions` | Publicar el producto de datos y su versión | MEDIO | 10 | DATA_PRODUCT_OWNER, PLATFORM_ADMIN |
| 3 | POST | `/lakehouse/datasets` | Registrar el dataset y su esquema inicial | MEDIO | 10 | DATA_PLATFORM_ENGINEER, PLATFORM_ADMIN |
| 4 | POST | `/lakehouse/datasets/{id}/quality-runs` | Evaluar la calidad del dataset y abrir hallazgos | MEDIO | 10 | DATA_STEWARD, SYSTEM, PLATFORM_ADMIN |
| 5 | POST | `/lakehouse/ingestion/curated-runs` | Ingerir dato de salud de-identificado en la zona curada | MEDIO | 12 | SYSTEM, DEIDENTIFICATION_WORKER, PLATFORM_ADMIN |
| 6 | POST | `/lakehouse/transformations/{defId}/runs` | Registrar la corrida con sus particiones, archivos y linaje | MEDIO | 13 | SYSTEM, TRANSFORMATION_WORKER, PLATFORM_ADMIN |
| 7 | POST | `/lakehouse/zones` | Definir una zona del data lake | MEDIO | 5 | DATA_PLATFORM_ENGINEER, PLATFORM_ADMIN |
| 8 | POST | `/research/dataset-releases` | Solicitar el release de un dataset para investigación | MEDIO | 8 | PRINCIPAL_INVESTIGATOR, PLATFORM_ADMIN |
| 9 | POST | `/research/dataset-releases/{id}/approve` | Aprobar y materializar el manifiesto de-identificado | MEDIO | 9 | RESEARCH_GOVERNANCE, DPO, PLATFORM_ADMIN |
| 10 | POST | `/research/dataset-releases/{id}/revoke` | Expirar o revocar el release | MEDIO | 6 | RESEARCH_GOVERNANCE, DPO, SYSTEM, PLATFORM_ADMIN |
| 11 | GET | `/research/dataset-releases/expired` | Listar releases con manifiesto vencido sin cerrar | BAJO | 2 | RESEARCH_GOVERNANCE, DPO, SYSTEM, PLATFORM_ADMIN |
| 12 | POST | `/research/deidentification-profiles` | Dar de alta un perfil de de-identificación | MEDIO | 1 | RESEARCH_GOVERNANCE, DPO, PRINCIPAL_INVESTIGATOR, PLATFORM_ADMIN |
| 13 | POST | `/research/projects/{id}/cohorts` | Definir el proyecto de investigación y su cohorte | MEDIO | 9 | PRINCIPAL_INVESTIGATOR, RESEARCH_GOVERNANCE, PLATFORM_ADMIN |

---

## 1. POST /lakehouse/catalogs

- **Origen:** CONTRATO
- **Nombre:** Registrar el catálogo / metastore
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LakehouseController.registerCatalog` — `src/modules/lakehouse/controllers/lakehouse.controller.ts:73`

### Qué es y para qué sirve (negocio)

Registrar el catálogo / metastore. Caso de uso UC-63-02: Catálogo / metastore. Dentro del módulo (descripción del modelo, en inglés): «Separates raw, standardized, curated and research-ready data while preserving lineage, quality contracts, de-identification and controlled release.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/lakehouse/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_63_lakehouse.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /lakehouse/catalogs` la atiende `LakehouseController.registerCatalog` (src/modules/lakehouse/controllers/lakehouse.controller.ts:73). Exige sesión con alguno de los roles DATA_PLATFORM_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `RegisterCatalogDto` (5 campos, 3 obligatorios). Delega en `LakehouseCatalogService.registerCatalog`. Crea filas en lakehouse.lakehouse_catalogs, messaging.domain_events, messaging.outbox_messages. Lee lakehouse.lakehouse_catalogs, messaging.outbox_messages. Publica LakehouseCatalogRegistered.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_PLATFORM_ENGINEER, PLATFORM_ADMIN | `src/modules/lakehouse/controllers/lakehouse.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `lakehouse.lakehouse_catalogs` | ESCRIBE | CREA | DIRECTA | LakehouseController.registerCatalog → LakehouseCatalogService.registerCatalog → LakehouseCatalogRepository.createCatalog | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:129` |
| `lakehouse.lakehouse_catalogs` | LEE | LEE | DIRECTA | LakehouseController.registerCatalog → LakehouseCatalogService.registerCatalog → LakehouseCatalogRepository.findCatalogByCode | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:143` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | LakehouseController.registerCatalog → LakehouseCatalogService.registerCatalog → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | LakehouseController.registerCatalog → LakehouseCatalogService.registerCatalog → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | LakehouseController.registerCatalog → LakehouseCatalogService.registerCatalog → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `LakehouseCatalogRegistered` | `src/modules/lakehouse/services/lakehouse-catalog.service.ts:137` |

### Cuerpo — DTO `RegisterCatalogDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:131` |
| `catalogType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Motor del metastore, p. ej. `glue` o `hive` | `src/modules/lakehouse/dto/lakehouse.dto.ts:142` |
| `metastoreUri` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:150` |
| `defaultFormat` | `string` | No | valores: parquet, delta, iceberg, avro, orc | `@IsOptional()` `@IsIn(STORAGE_FORMATS)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:158` |
| `defaultCompression` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:167` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "catalogType": "valor-ejemplo",
  "metastoreUri": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "catalogType": "valor-ejemplo",
  "metastoreUri": "valor-ejemplo",
  "defaultFormat": "parquet",
  "defaultCompression": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<CatalogResponseDto>` · DTO `CatalogResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:178` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:184` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:190` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un catálogo con ese código. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/lakehouse.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 63 — Lakehouse, productos de datos analíticos y releases de investigación — etapa `UC-63-02`

---

## 2. POST /lakehouse/data-products/{id}/versions

- **Origen:** CONTRATO
- **Nombre:** Publicar el producto de datos y su versión
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LakehouseController.publishProductVersion` — `src/modules/lakehouse/controllers/lakehouse.controller.ts:90`

### Qué es y para qué sirve (negocio)

Publicar el producto de datos y su versión. Caso de uso UC-63-03: Producto y versión con contrato y SLO. Dentro del módulo (descripción del modelo, en inglés): «Separates raw, standardized, curated and research-ready data while preserving lineage, quality contracts, de-identification and controlled release.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/lakehouse/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_63_lakehouse.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /lakehouse/data-products/{id}/versions` la atiende `LakehouseController.publishProductVersion` (src/modules/lakehouse/controllers/lakehouse.controller.ts:90). Exige sesión con alguno de los roles DATA_PRODUCT_OWNER, PLATFORM_ADMIN. Valida el cuerpo como `PublishProductVersionDto` (16 campos, 5 obligatorios). Delega en `LakehouseCatalogService.publishProductVersion`. Crea filas en lakehouse.data_product_versions, lakehouse.data_products, lakehouse.lakehouse_quality_rules, messaging.domain_events, messaging.outbox_messages. Actualiza lakehouse.data_product_versions, lakehouse.data_products. Lee lakehouse.data_product_versions, lakehouse.data_products, messaging.outbox_messages. Publica DataProductVersionPublished.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_PRODUCT_OWNER, PLATFORM_ADMIN | `src/modules/lakehouse/controllers/lakehouse.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/lakehouse/controllers/lakehouse.controller.ts:90` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `lakehouse.data_product_versions` | ESCRIBE | ACTUALIZA | POR_TIPO | LakehouseController.publishProductVersion → LakehouseCatalogService.publishProductVersion | `src/modules/lakehouse/services/lakehouse-catalog.service.ts:258` |
| `lakehouse.data_product_versions` | ESCRIBE | CREA | DIRECTA | LakehouseController.publishProductVersion → LakehouseCatalogService.publishProductVersion → LakehouseCatalogRepository.createProductVersion | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:298` |
| `lakehouse.data_product_versions` | LEE | LEE | DIRECTA | LakehouseController.publishProductVersion → LakehouseCatalogService.publishProductVersion → LakehouseCatalogRepository.findProductVersion | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:337` |
| `lakehouse.data_products` | ESCRIBE | ACTUALIZA | POR_TIPO | LakehouseController.publishProductVersion → LakehouseCatalogService.publishProductVersion | `src/modules/lakehouse/services/lakehouse-catalog.service.ts:226` |
| `lakehouse.data_products` | ESCRIBE | CREA | DIRECTA | LakehouseController.publishProductVersion → LakehouseCatalogService.publishProductVersion → LakehouseCatalogRepository.createProduct | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:257` |
| `lakehouse.data_products` | LEE | LEE | DIRECTA | LakehouseController.publishProductVersion → LakehouseCatalogService.publishProductVersion → LakehouseCatalogRepository.findProductById | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:206` |
| `lakehouse.lakehouse_quality_rules` | ESCRIBE | CREA | DIRECTA | LakehouseController.publishProductVersion → LakehouseCatalogService.publishProductVersion → LakehouseCatalogRepository.createQualityRule | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:395` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | LakehouseController.publishProductVersion → LakehouseCatalogService.publishProductVersion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | LakehouseController.publishProductVersion → LakehouseCatalogService.publishProductVersion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | LakehouseController.publishProductVersion → LakehouseCatalogService.publishProductVersion → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `DataProductVersionPublished` | `src/modules/lakehouse/services/lakehouse-catalog.service.ts:300` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishProductVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:257` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del producto; su clave natural con el tenant | `src/modules/lakehouse/dto/lakehouse.dto.ts:268` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:276` |
| `ownerTeamId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:284` |
| `businessPurpose` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:293` |
| `classificationCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:302` |
| `containsPhi` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si el producto contiene datos de paciente | `src/modules/lakehouse/dto/lakehouse.dto.ts:313` |
| `version` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | Versión que se publica | `src/modules/lakehouse/dto/lakehouse.dto.ts:321` |
| `contractSchemaJson` | `object` | Sí | — | `@IsObject()` | Contrato de esquema que el producto promete cumplir | `src/modules/lakehouse/dto/lakehouse.dto.ts:330` |
| `qualitySloJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Objetivos de calidad de los que salen las reglas | `src/modules/lakehouse/dto/lakehouse.dto.ts:340` |
| `qualityRules` | `array<QualityRuleDto>` | No | máximo 200 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(MAX_QUALITY_RULES)` `@ValidateNested({ each: true })` `@Type(() => QualityRuleDto)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:351` |
| `qualityRules[].ruleCode` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:207` |
| `qualityRules[].dimension` | `string` | No | valores: completeness, accuracy, consistency, timeliness, uniqueness, validity | `@IsIn(QUALITY_DIMENSIONS)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:214` |
| `qualityRules[].expression` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Expresión declarativa de la regla | `src/modules/lakehouse/dto/lakehouse.dto.ts:226` |
| `qualityRules[].severity` | `string` | No | valores: info, warning, blocking | `@IsIn(RULE_SEVERITIES)` | `blocking` cuarentena el dataset | `src/modules/lakehouse/dto/lakehouse.dto.ts:236` |
| `qualityRules[].threshold` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Umbral a partir del cual la regla falla; cadena por ser numeric | `src/modules/lakehouse/dto/lakehouse.dto.ts:247` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "version": "valor-ejemplo",
  "contractSchemaJson": {}
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "ownerTeamId": "00000000-0000-4000-8000-000000000001",
  "businessPurpose": "valor-ejemplo",
  "classificationCode": "CODIGO_EJEMPLO",
  "containsPhi": false,
  "version": "valor-ejemplo",
  "contractSchemaJson": {},
  "qualitySloJson": {},
  "qualityRules": [
    {
      "ruleCode": "CODIGO_EJEMPLO",
      "dimension": "completeness",
      "expression": "valor-ejemplo",
      "severity": "info",
      "threshold": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<ProductVersionResponseDto>` · DTO `ProductVersionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `dataProductId` | `string` | Sí | formato uuid | — | Identificador asociado a data product. | `src/modules/lakehouse/dto/lakehouse.dto.ts:362` |
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:368` |
| `version` | `string` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:374` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:380` |
| `supersededVersionId` | `string` | No | formato uuid | — | Versión anterior que quedó superseded | `src/modules/lakehouse/dto/lakehouse.dto.ts:389` |
| `qualityRulesCreated` | `number` | Sí | — | — | Reglas de calidad derivadas del SLO | `src/modules/lakehouse/dto/lakehouse.dto.ts:395` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un producto con ese código para el tenant, con otro identificador.; ConflictException: El producto existente tiene otro código.; ConflictException: Esa versión del producto ya está publicada.; ConflictException: Dos reglas de calidad comparten el mismo código. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/lakehouse.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 63 — Lakehouse, productos de datos analíticos y releases de investigación — etapa `UC-63-03`

---

## 3. POST /lakehouse/datasets

- **Origen:** CONTRATO
- **Nombre:** Registrar el dataset y su esquema inicial
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LakehouseController.registerDataset` — `src/modules/lakehouse/controllers/lakehouse.controller.ts:112`

### Qué es y para qué sirve (negocio)

Registrar el dataset y su esquema inicial. Caso de uso UC-63-04: Dataset y versión de esquema. Dentro del módulo (descripción del modelo, en inglés): «Separates raw, standardized, curated and research-ready data while preserving lineage, quality contracts, de-identification and controlled release.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/lakehouse/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_63_lakehouse.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /lakehouse/datasets` la atiende `LakehouseController.registerDataset` (src/modules/lakehouse/controllers/lakehouse.controller.ts:112). Exige sesión con alguno de los roles DATA_PLATFORM_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `RegisterDatasetDto` (12 campos, 8 obligatorios). Delega en `LakehouseCatalogService.registerDataset`. Crea filas en lakehouse.lakehouse_datasets, lakehouse.lakehouse_schema_versions, messaging.domain_events, messaging.outbox_messages. Lee lakehouse.data_lake_zones, lakehouse.data_product_versions, lakehouse.data_products, lakehouse.lakehouse_catalogs, lakehouse.lakehouse_datasets, messaging.outbox_messages. Publica LakehouseDatasetRegistered.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_PLATFORM_ENGINEER, PLATFORM_ADMIN | `src/modules/lakehouse/controllers/lakehouse.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `lakehouse.data_lake_zones` | LEE | LEE | DIRECTA | LakehouseController.registerDataset → LakehouseCatalogService.registerDataset → LakehouseCatalogRepository.findZoneById | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:88` |
| `lakehouse.data_product_versions` | LEE | LEE | DIRECTA | LakehouseController.registerDataset → LakehouseCatalogService.registerDataset → LakehouseCatalogRepository.findProductVersionInTenant | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:315` |
| `lakehouse.data_products` | LEE | LEE | DIRECTA | LakehouseController.registerDataset → LakehouseCatalogService.registerDataset → LakehouseCatalogRepository.findProductVersionInTenant | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:317` |
| `lakehouse.lakehouse_catalogs` | LEE | LEE | DIRECTA | LakehouseController.registerDataset → LakehouseCatalogService.registerDataset → LakehouseCatalogRepository.findCatalogById | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:157` |
| `lakehouse.lakehouse_datasets` | ESCRIBE | CREA | DIRECTA | LakehouseController.registerDataset → LakehouseCatalogService.registerDataset → LakehouseCatalogRepository.createDataset | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:490` |
| `lakehouse.lakehouse_datasets` | LEE | LEE | DIRECTA | LakehouseController.registerDataset → LakehouseCatalogService.registerDataset → LakehouseCatalogRepository.findDatasetByTable | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:547` |
| `lakehouse.lakehouse_schema_versions` | ESCRIBE | CREA | DIRECTA | LakehouseController.registerDataset → LakehouseCatalogService.registerDataset → LakehouseCatalogRepository.createSchemaVersion | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:591` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | LakehouseController.registerDataset → LakehouseCatalogService.registerDataset → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | LakehouseController.registerDataset → LakehouseCatalogService.registerDataset → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | LakehouseController.registerDataset → LakehouseCatalogService.registerDataset → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `LakehouseDatasetRegistered` | `src/modules/lakehouse/services/lakehouse-catalog.service.ts:442` |

### Cuerpo — DTO `RegisterDatasetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:409` |
| `dataProductVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | Versión de producto activa | `src/modules/lakehouse/dto/lakehouse.dto.ts:416` |
| `dataLakeZoneId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:423` |
| `lakehouseCatalogId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:430` |
| `databaseName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:438` |
| `tableName` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:446` |
| `storageFormat` | `string` | No | valores: parquet, delta, iceberg, avro, orc | `@IsOptional()` `@IsIn(STORAGE_FORMATS)` | Por omisión, el del catálogo | `src/modules/lakehouse/dto/lakehouse.dto.ts:457` |
| `partitionSpecJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Cómo se particiona la tabla | `src/modules/lakehouse/dto/lakehouse.dto.ts:465` |
| `sourceDatasetCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:474` |
| `schemaJson` | `object` | Sí | — | `@IsObject()` | Esquema inicial del dataset | `src/modules/lakehouse/dto/lakehouse.dto.ts:481` |
| `schemaFingerprint` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Huella del esquema; identifica el contrato | `src/modules/lakehouse/dto/lakehouse.dto.ts:492` |
| `compatibilityMode` | `string` | No | valores: none, backward, forward, full | `@IsOptional()` `@IsIn(COMPATIBILITY_MODES)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:500` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "dataProductVersionId": "00000000-0000-4000-8000-000000000001",
  "dataLakeZoneId": "00000000-0000-4000-8000-000000000001",
  "lakehouseCatalogId": "00000000-0000-4000-8000-000000000001",
  "databaseName": "Nombre de ejemplo",
  "tableName": "Nombre de ejemplo",
  "schemaJson": {},
  "schemaFingerprint": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "dataProductVersionId": "00000000-0000-4000-8000-000000000001",
  "dataLakeZoneId": "00000000-0000-4000-8000-000000000001",
  "lakehouseCatalogId": "00000000-0000-4000-8000-000000000001",
  "databaseName": "Nombre de ejemplo",
  "tableName": "Nombre de ejemplo",
  "storageFormat": "parquet",
  "partitionSpecJson": {},
  "sourceDatasetCode": "CODIGO_EJEMPLO",
  "schemaJson": {},
  "schemaFingerprint": "valor-ejemplo",
  "compatibilityMode": "backward"
}
```

</details>

### Respuesta — `Promise<DatasetResponseDto>` · DTO `DatasetResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:511` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | sin fuente |
| `lifecycleState` | `string` | Sí | — | — | Valor de lifecycle state mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:535` |
| `initialVersionId` | `string` | Sí | formato uuid | — | Versión 1.0.0, creada en la misma transacción | sin fuente |
| `initialVersion` | `string` | Sí | — | — | Valor de initial version mantenido por la instancia. | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Zona no encontrada.; ResourceNotFoundException: Catálogo no encontrado. |
| 409 | `CONFLICT` | ConflictException: Ya hay un dataset registrado para esa tabla. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La versión del producto ya no es la vigente.; PreconditionFailedException: La zona no está activa.; PreconditionFailedException: El catálogo no está activo. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/lakehouse.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 63 — Lakehouse, productos de datos analíticos y releases de investigación — etapa `UC-63-04`

---

## 4. POST /lakehouse/datasets/{id}/quality-runs

- **Origen:** CONTRATO
- **Nombre:** Evaluar la calidad del dataset y abrir hallazgos
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LakehouseController.runQualityCheck` — `src/modules/lakehouse/controllers/lakehouse.controller.ts:175`

### Qué es y para qué sirve (negocio)

Evaluar la calidad del dataset y abrir hallazgos. Caso de uso UC-63-08: Calidad y hallazgos. Dentro del módulo (descripción del modelo, en inglés): «Separates raw, standardized, curated and research-ready data while preserving lineage, quality contracts, de-identification and controlled release.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/lakehouse/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_63_lakehouse.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /lakehouse/datasets/{id}/quality-runs` la atiende `LakehouseController.runQualityCheck` (src/modules/lakehouse/controllers/lakehouse.controller.ts:175). Exige sesión con alguno de los roles DATA_STEWARD, SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `RunQualityCheckDto` (8 campos, 3 obligatorios). Delega en `TransformationService.runQualityCheck`. Crea filas en lakehouse.lakehouse_quality_issues, lakehouse.lakehouse_quality_runs, messaging.domain_events, messaging.outbox_messages. Actualiza lakehouse.lakehouse_quality_runs. Lee lakehouse.lakehouse_datasets, lakehouse.lakehouse_partitions, lakehouse.lakehouse_quality_rules, lakehouse.transformation_runs, messaging.outbox_messages. Publica QualityRunEvaluated.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_STEWARD, SYSTEM, PLATFORM_ADMIN | `src/modules/lakehouse/controllers/lakehouse.controller.ts:175` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/lakehouse/controllers/lakehouse.controller.ts:175` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `lakehouse.lakehouse_datasets` | LEE | LEE | DIRECTA | LakehouseController.runQualityCheck → TransformationService.runQualityCheck → LakehouseCatalogRepository.findDatasetForUpdate | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:522` |
| `lakehouse.lakehouse_partitions` | LEE | LEE | DIRECTA | LakehouseController.runQualityCheck → TransformationService.runQualityCheck → LakehouseRuntimeRepository.findPartitionById | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:195` |
| `lakehouse.lakehouse_quality_issues` | ESCRIBE | CREA | DIRECTA | LakehouseController.runQualityCheck → TransformationService.runQualityCheck → LakehouseRuntimeRepository.createQualityIssue | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:376` |
| `lakehouse.lakehouse_quality_rules` | LEE | LEE | DIRECTA | LakehouseController.runQualityCheck → TransformationService.runQualityCheck → LakehouseCatalogRepository.findActiveQualityRules | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:411` |
| `lakehouse.lakehouse_quality_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | LakehouseController.runQualityCheck → TransformationService.runQualityCheck | `src/modules/lakehouse/services/transformation.service.ts:428` |
| `lakehouse.lakehouse_quality_runs` | ESCRIBE | CREA | DIRECTA | LakehouseController.runQualityCheck → TransformationService.runQualityCheck → LakehouseRuntimeRepository.createQualityRun | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:333` |
| `lakehouse.transformation_runs` | LEE | LEE | DIRECTA | LakehouseController.runQualityCheck → TransformationService.runQualityCheck → LakehouseRuntimeRepository.findRunById | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:117` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | LakehouseController.runQualityCheck → TransformationService.runQualityCheck → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | LakehouseController.runQualityCheck → TransformationService.runQualityCheck → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | LakehouseController.runQualityCheck → TransformationService.runQualityCheck → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `QualityRunEvaluated` | `src/modules/lakehouse/services/transformation.service.ts:437` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RunQualityCheckDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:994` |
| `transformationRunId` | `string` | Sí | formato uuid | `@IsOptional()` `@IsUUID()` | Corrida de transformación evaluada | `src/modules/lakehouse/dto/lakehouse.dto.ts:1005` |
| `evaluatedRecordCount` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Registros evaluados; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:1012` |
| `findings` | `array<LakehouseQualityFindingDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => QualityFindingDto)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1022` |
| `findings[].ruleCode` | `string` | No | longitud máxima 100 | — | Código de la regla violada | sin fuente |
| `findings[].partitionId` | `string` | No | formato uuid | — | — | sin fuente |
| `findings[].issueCount` | `string` | No | — | — | Registros que incumplen; cadena por ser bigint | sin fuente |
| `findings[].sampleObjectManifestId` | `string` | No | formato uuid | — | Muestra para diagnosticar | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "transformationRunId": "00000000-0000-4000-8000-000000000001",
  "evaluatedRecordCount": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "transformationRunId": "00000000-0000-4000-8000-000000000001",
  "evaluatedRecordCount": "valor-ejemplo",
  "findings": [
    {
      "ruleCode": "CODIGO_EJEMPLO",
      "partitionId": "00000000-0000-4000-8000-000000000001",
      "issueCount": "valor-ejemplo",
      "sampleObjectManifestId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — `Promise<QualityRunResponseDto>` · DTO `QualityRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1033` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1039` |
| `evaluatedRecordCount` | `string` | Sí | — | — | Valor de evaluated record count mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1045` |
| `failedRecordCount` | `string` | Sí | — | — | Valor de failed record count mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1051` |
| `issuesOpened` | `number` | Sí | — | — | Hallazgos abiertos | `src/modules/lakehouse/dto/lakehouse.dto.ts:1057` |
| `datasetQuarantined` | `boolean` | Sí | — | — | Verdadero si una regla bloqueante puso el dataset en cuarentena | `src/modules/lakehouse/dto/lakehouse.dto.ts:1066` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El hallazgo cita una regla que no está activa para la versión del producto. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/lakehouse.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 63 — Lakehouse, productos de datos analíticos y releases de investigación — etapa `UC-63-08`

---

## 5. POST /lakehouse/ingestion/curated-runs

- **Origen:** CONTRATO
- **Nombre:** Ingerir dato de salud de-identificado en la zona curada
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LakehouseController.ingestCurated` — `src/modules/lakehouse/controllers/lakehouse.controller.ts:154`

### Qué es y para qué sirve (negocio)

Ingerir dato de salud de-identificado en la zona curada. Caso de uso UC-63-07: Ingesta de salud de-identificada. Dentro del módulo (descripción del modelo, en inglés): «Separates raw, standardized, curated and research-ready data while preserving lineage, quality contracts, de-identification and controlled release.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/lakehouse/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_63_lakehouse.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /lakehouse/ingestion/curated-runs` la atiende `LakehouseController.ingestCurated` (src/modules/lakehouse/controllers/lakehouse.controller.ts:154). Exige sesión con alguno de los roles SYSTEM, DEIDENTIFICATION_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `CuratedIngestionDto` (23 campos, 14 obligatorios). Delega en `TransformationService.ingestCurated`. Crea filas en health_data.health_deidentification_runs, lakehouse.lakehouse_files, lakehouse.lakehouse_lineage_edges, lakehouse.lakehouse_partitions, messaging.domain_events, messaging.outbox_messages. Lee health_data.health_deidentification_profiles, lakehouse.data_lake_zones, lakehouse.lakehouse_datasets, lakehouse.lakehouse_files, lakehouse.lakehouse_partitions, messaging.outbox_messages. Publica HealthBatchDeidentified.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, DEIDENTIFICATION_WORKER, PLATFORM_ADMIN | `src/modules/lakehouse/controllers/lakehouse.controller.ts:154` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.health_deidentification_profiles` | LEE | LEE | DIRECTA | LakehouseController.ingestCurated → TransformationService.ingestCurated → DataReleaseRepository.findDeidProfileById | `src/modules/health_data/repositories/data-release.repository.ts:31` |
| `health_data.health_deidentification_runs` | ESCRIBE | CREA | DIRECTA | LakehouseController.ingestCurated → TransformationService.ingestCurated → DataReleaseRepository.createDeidRun | `src/modules/health_data/repositories/data-release.repository.ts:150` |
| `lakehouse.data_lake_zones` | LEE | LEE | DIRECTA | LakehouseController.ingestCurated → TransformationService.ingestCurated → LakehouseCatalogRepository.findZoneById | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:88` |
| `lakehouse.lakehouse_datasets` | LEE | LEE | DIRECTA | LakehouseController.ingestCurated → TransformationService.ingestCurated → TransformationService.requireWritableDataset → LakehouseCatalogRepository.findDatasetById | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:506` |
| `lakehouse.lakehouse_files` | ESCRIBE | CREA | DIRECTA | LakehouseController.ingestCurated → TransformationService.ingestCurated → TransformationService.materialize → LakehouseRuntimeRepository.createFile | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:237` |
| `lakehouse.lakehouse_files` | LEE | LEE | DIRECTA | LakehouseController.ingestCurated → TransformationService.ingestCurated → TransformationService.materialize → LakehouseRuntimeRepository.findFileByHash | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:257` |
| `lakehouse.lakehouse_lineage_edges` | ESCRIBE | CREA | DIRECTA | LakehouseController.ingestCurated → TransformationService.ingestCurated → TransformationService.materialize → LakehouseRuntimeRepository.createLineageEdge | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:292` |
| `lakehouse.lakehouse_partitions` | ESCRIBE | CREA | DIRECTA | LakehouseController.ingestCurated → TransformationService.ingestCurated → TransformationService.materialize → LakehouseRuntimeRepository.createPartition | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:181` |
| `lakehouse.lakehouse_partitions` | LEE | LEE | DIRECTA | LakehouseController.ingestCurated → TransformationService.ingestCurated → TransformationService.materialize → LakehouseRuntimeRepository.findPartitionByHash | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:131` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | LakehouseController.ingestCurated → TransformationService.ingestCurated → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | LakehouseController.ingestCurated → TransformationService.ingestCurated → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | LakehouseController.ingestCurated → TransformationService.ingestCurated → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `HealthBatchDeidentified` | `src/modules/lakehouse/services/transformation.service.ts:286` |

### Cuerpo — DTO `CuratedIngestionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:822` |
| `targetDatasetId` | `string` | Sí | formato uuid | `@IsUUID()` | Dataset destino, obligatoriamente en zona curated | `src/modules/lakehouse/dto/lakehouse.dto.ts:832` |
| `deidentificationProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil de de-identificación aplicado | `src/modules/lakehouse/dto/lakehouse.dto.ts:842` |
| `purposeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Propósito de la de-identificación | `src/modules/lakehouse/dto/lakehouse.dto.ts:852` |
| `consentDirectiveId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Consentimiento que ampara el tratamiento | `src/modules/lakehouse/dto/lakehouse.dto.ts:863` |
| `inputManifestFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Manifiesto del lote de entrada | `src/modules/lakehouse/dto/lakehouse.dto.ts:874` |
| `recordsProcessed` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Registros de-identificados; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:883` |
| `recordsRejected` | `string` | No | — | `@IsOptional()` `@IsNumberString({ no_symbols: true })` | Registros rechazados; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:893` |
| `partitions` | `array<MaterializedPartitionDto>` | Sí | mínimo 1 elemento(s); máximo 500 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_PARTITIONS_PER_RUN)` `@ValidateNested({ each: true })` `@Type(() => MaterializedPartitionDto)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:907` |
| `partitions[].partitionSpecHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Huella de los valores de partición | `src/modules/lakehouse/dto/lakehouse.dto.ts:619` |
| `partitions[].partitionValuesJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:627` |
| `partitions[].recordCount` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Registros de la partición; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:636` |
| `partitions[].sizeBytes` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Tamaño en bytes; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:643` |
| `partitions[].minEventAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:651` |
| `partitions[].maxEventAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:659` |
| `partitions[].files` | `array<MaterializedFileDto>` | Sí | mínimo 1 elemento(s); máximo 1000 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_FILES_PER_PARTITION)` `@ValidateNested({ each: true })` `@Type(() => MaterializedFileDto)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:673` |
| `partitions[].files[].objectManifestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Manifiesto del objeto en el almacén | `src/modules/lakehouse/dto/lakehouse.dto.ts:561` |
| `partitions[].files[].fileFormat` | `string` | Sí | valores: parquet, delta, iceberg, avro, orc | `@IsIn(STORAGE_FORMATS)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:568` |
| `partitions[].files[].rowCount` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Filas del archivo; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:575` |
| `partitions[].files[].sizeBytes` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Tamaño en bytes; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:582` |
| `partitions[].files[].contentHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash del contenido; el archivo es inmutable | `src/modules/lakehouse/dto/lakehouse.dto.ts:593` |
| `partitions[].files[].minMaxStatisticsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Mínimos y máximos por columna, para poda de particiones | `src/modules/lakehouse/dto/lakehouse.dto.ts:603` |
| `partitions[].sourcePartitionIds` | `array<string>` | No | formato uuid | `@IsOptional()` `@IsArray()` `@IsUUID('4', { each: true })` | Particiones fuente de las que sale ésta; alimentan el linaje | `src/modules/lakehouse/dto/lakehouse.dto.ts:686` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "targetDatasetId": "00000000-0000-4000-8000-000000000001",
  "deidentificationProfileId": "00000000-0000-4000-8000-000000000001",
  "purposeConceptId": "00000000-0000-4000-8000-000000000001",
  "recordsProcessed": "valor-ejemplo",
  "partitions": [
    {
      "partitionSpecHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "recordCount": "valor-ejemplo",
      "sizeBytes": "valor-ejemplo",
      "files": [
        {
          "fileFormat": "parquet",
          "rowCount": "valor-ejemplo",
          "sizeBytes": "valor-ejemplo",
          "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        }
      ]
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "targetDatasetId": "00000000-0000-4000-8000-000000000001",
  "deidentificationProfileId": "00000000-0000-4000-8000-000000000001",
  "purposeConceptId": "00000000-0000-4000-8000-000000000001",
  "consentDirectiveId": "00000000-0000-4000-8000-000000000001",
  "inputManifestFileId": "00000000-0000-4000-8000-000000000001",
  "recordsProcessed": "valor-ejemplo",
  "recordsRejected": "valor-ejemplo",
  "partitions": [
    {
      "partitionSpecHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "partitionValuesJson": {},
      "recordCount": "valor-ejemplo",
      "sizeBytes": "valor-ejemplo",
      "minEventAt": "2026-07-31T12:00:00.000Z",
      "maxEventAt": "2026-07-31T12:00:00.000Z",
      "files": [
        {
          "objectManifestId": "00000000-0000-4000-8000-000000000001",
          "fileFormat": "parquet",
          "rowCount": "valor-ejemplo",
          "sizeBytes": "valor-ejemplo",
          "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "minMaxStatisticsJson": {}
        }
      ],
      "sourcePartitionIds": [
        "00000000-0000-4000-8000-000000000001"
      ]
    }
  ]
}
```

</details>

### Respuesta — `Promise<CuratedIngestionResponseDto>` · DTO `CuratedIngestionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `deidentificationRunId` | `string` | Sí | formato uuid | — | Corrida de de-identificación registrada | `src/modules/lakehouse/dto/lakehouse.dto.ts:921` |
| `targetDatasetId` | `string` | Sí | formato uuid | — | Identificador asociado a target dataset. | `src/modules/lakehouse/dto/lakehouse.dto.ts:927` |
| `partitionsCommitted` | `number` | Sí | — | — | Valor de partitions committed mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:933` |
| `filesWritten` | `number` | Sí | — | — | Valor de files written mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:939` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El dataset objetivo no está activo; no admite escrituras.; PreconditionFailedException: La ingesta de-identificada sólo puede escribir en la zona curated. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/lakehouse.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 63 — Lakehouse, productos de datos analíticos y releases de investigación — etapa `UC-63-07`

---

## 6. POST /lakehouse/transformations/{defId}/runs

- **Origen:** CONTRATO
- **Nombre:** Registrar la corrida con sus particiones, archivos y linaje
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LakehouseController.runTransformation` — `src/modules/lakehouse/controllers/lakehouse.controller.ts:132`

### Qué es y para qué sirve (negocio)

Registrar la corrida con sus particiones, archivos y linaje. Caso de uso UC-63-05: Corrida: particiones y archivos. Dentro del módulo (descripción del modelo, en inglés): «Separates raw, standardized, curated and research-ready data while preserving lineage, quality contracts, de-identification and controlled release.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/lakehouse/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_63_lakehouse.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /lakehouse/transformations/{defId}/runs` la atiende `LakehouseController.runTransformation` (src/modules/lakehouse/controllers/lakehouse.controller.ts:132). Exige sesión con alguno de los roles SYSTEM, TRANSFORMATION_WORKER, PLATFORM_ADMIN. Valida el cuerpo como `RunTransformationDto` (21 campos, 12 obligatorios). Delega en `TransformationService.runTransformation`. Crea filas en lakehouse.lakehouse_files, lakehouse.lakehouse_lineage_edges, lakehouse.lakehouse_partitions, lakehouse.transformation_runs, messaging.domain_events, messaging.outbox_messages. Actualiza lakehouse.transformation_runs. Lee lakehouse.lakehouse_datasets, lakehouse.lakehouse_files, lakehouse.lakehouse_partitions, lakehouse.transformation_definitions, lakehouse.transformation_runs, messaging.outbox_messages. Publica TransformationRunCompleted, LineageRecorded.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, TRANSFORMATION_WORKER, PLATFORM_ADMIN | `src/modules/lakehouse/controllers/lakehouse.controller.ts:132` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: defId | `src/modules/lakehouse/controllers/lakehouse.controller.ts:132` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `lakehouse.lakehouse_datasets` | LEE | LEE | DIRECTA | LakehouseController.runTransformation → TransformationService.runTransformation → LakehouseCatalogRepository.findDatasetById | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:506` |
| `lakehouse.lakehouse_files` | ESCRIBE | CREA | DIRECTA | LakehouseController.runTransformation → TransformationService.runTransformation → TransformationService.materialize → LakehouseRuntimeRepository.createFile | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:237` |
| `lakehouse.lakehouse_files` | LEE | LEE | DIRECTA | LakehouseController.runTransformation → TransformationService.runTransformation → TransformationService.materialize → LakehouseRuntimeRepository.findFileByHash | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:257` |
| `lakehouse.lakehouse_lineage_edges` | ESCRIBE | CREA | DIRECTA | LakehouseController.runTransformation → TransformationService.runTransformation → TransformationService.materialize → LakehouseRuntimeRepository.createLineageEdge | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:292` |
| `lakehouse.lakehouse_partitions` | ESCRIBE | CREA | DIRECTA | LakehouseController.runTransformation → TransformationService.runTransformation → TransformationService.materialize → LakehouseRuntimeRepository.createPartition | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:181` |
| `lakehouse.lakehouse_partitions` | LEE | LEE | DIRECTA | LakehouseController.runTransformation → TransformationService.runTransformation → TransformationService.materialize → LakehouseRuntimeRepository.findPartitionByHash | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:131` |
| `lakehouse.transformation_definitions` | LEE | LEE | DIRECTA | LakehouseController.runTransformation → TransformationService.runTransformation → LakehouseRuntimeRepository.findDefinitionById | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:40` |
| `lakehouse.transformation_runs` | ESCRIBE | ACTUALIZA | POR_TIPO | LakehouseController.runTransformation → TransformationService.runTransformation | `src/modules/lakehouse/services/transformation.service.ts:169` |
| `lakehouse.transformation_runs` | ESCRIBE | CREA | DIRECTA | LakehouseController.runTransformation → TransformationService.runTransformation → LakehouseRuntimeRepository.createRun | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:92` |
| `lakehouse.transformation_runs` | LEE | LEE | DIRECTA | LakehouseController.runTransformation → TransformationService.runTransformation → LakehouseRuntimeRepository.findLiveRunByTargetForUpdate | `src/modules/lakehouse/repositories/lakehouse-runtime.repository.ts:53` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | LakehouseController.runTransformation → TransformationService.runTransformation → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | LakehouseController.runTransformation → TransformationService.runTransformation → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | LakehouseController.runTransformation → TransformationService.runTransformation → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `TransformationRunCompleted` | `src/modules/lakehouse/services/transformation.service.ts:175` |
| Evento de dominio | `LineageRecorded` | `src/modules/lakehouse/services/transformation.service.ts:191` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `defId` | path | Sí | `string` | — |

### Cuerpo — DTO `RunTransformationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:696` |
| `sourceCheckpoint` | `string` | No | — | `@IsOptional()` `@IsNumberString({ no_symbols: true })` | Punto de la fuente hasta el que procesó; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:707` |
| `inputRecordCount` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Registros leídos; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:714` |
| `outputRecordCount` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Registros escritos; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:721` |
| `rejectedRecordCount` | `string` | No | — | `@IsOptional()` `@IsNumberString({ no_symbols: true })` | Registros rechazados; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:731` |
| `partitions` | `array<MaterializedPartitionDto>` | Sí | mínimo 1 elemento(s); máximo 500 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_PARTITIONS_PER_RUN)` `@ValidateNested({ each: true })` `@Type(() => MaterializedPartitionDto)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:745` |
| `partitions[].partitionSpecHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Huella de los valores de partición | `src/modules/lakehouse/dto/lakehouse.dto.ts:619` |
| `partitions[].partitionValuesJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:627` |
| `partitions[].recordCount` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Registros de la partición; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:636` |
| `partitions[].sizeBytes` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Tamaño en bytes; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:643` |
| `partitions[].minEventAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:651` |
| `partitions[].maxEventAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:659` |
| `partitions[].files` | `array<MaterializedFileDto>` | Sí | mínimo 1 elemento(s); máximo 1000 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(MAX_FILES_PER_PARTITION)` `@ValidateNested({ each: true })` `@Type(() => MaterializedFileDto)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:673` |
| `partitions[].files[].objectManifestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Manifiesto del objeto en el almacén | `src/modules/lakehouse/dto/lakehouse.dto.ts:561` |
| `partitions[].files[].fileFormat` | `string` | Sí | valores: parquet, delta, iceberg, avro, orc | `@IsIn(STORAGE_FORMATS)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:568` |
| `partitions[].files[].rowCount` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Filas del archivo; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:575` |
| `partitions[].files[].sizeBytes` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Tamaño en bytes; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:582` |
| `partitions[].files[].contentHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash del contenido; el archivo es inmutable | `src/modules/lakehouse/dto/lakehouse.dto.ts:593` |
| `partitions[].files[].minMaxStatisticsJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Mínimos y máximos por columna, para poda de particiones | `src/modules/lakehouse/dto/lakehouse.dto.ts:603` |
| `partitions[].sourcePartitionIds` | `array<string>` | No | formato uuid | `@IsOptional()` `@IsArray()` `@IsUUID('4', { each: true })` | Particiones fuente de las que sale ésta; alimentan el linaje | `src/modules/lakehouse/dto/lakehouse.dto.ts:686` |
| `failed` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Cierra la corrida como fallida | `src/modules/lakehouse/dto/lakehouse.dto.ts:756` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "inputRecordCount": "valor-ejemplo",
  "outputRecordCount": "valor-ejemplo",
  "partitions": [
    {
      "partitionSpecHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "recordCount": "valor-ejemplo",
      "sizeBytes": "valor-ejemplo",
      "files": [
        {
          "fileFormat": "parquet",
          "rowCount": "valor-ejemplo",
          "sizeBytes": "valor-ejemplo",
          "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        }
      ]
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourceCheckpoint": "valor-ejemplo",
  "inputRecordCount": "valor-ejemplo",
  "outputRecordCount": "valor-ejemplo",
  "rejectedRecordCount": "valor-ejemplo",
  "partitions": [
    {
      "partitionSpecHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "partitionValuesJson": {},
      "recordCount": "valor-ejemplo",
      "sizeBytes": "valor-ejemplo",
      "minEventAt": "2026-07-31T12:00:00.000Z",
      "maxEventAt": "2026-07-31T12:00:00.000Z",
      "files": [
        {
          "objectManifestId": "00000000-0000-4000-8000-000000000001",
          "fileFormat": "parquet",
          "rowCount": "valor-ejemplo",
          "sizeBytes": "valor-ejemplo",
          "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "minMaxStatisticsJson": {}
        }
      ],
      "sourcePartitionIds": [
        "00000000-0000-4000-8000-000000000001"
      ]
    }
  ],
  "failed": false
}
```

</details>

### Respuesta — `Promise<TransformationRunResponseDto>` · DTO `TransformationRunResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:767` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:773` |
| `partitionsCommitted` | `number` | Sí | — | — | Particiones nuevas materializadas | `src/modules/lakehouse/dto/lakehouse.dto.ts:779` |
| `partitionsSkipped` | `number` | Sí | — | — | Particiones que ya existían con la misma huella | `src/modules/lakehouse/dto/lakehouse.dto.ts:787` |
| `filesWritten` | `number` | Sí | — | — | Archivos nuevos registrados | `src/modules/lakehouse/dto/lakehouse.dto.ts:793` |
| `lineageEdges` | `number` | Sí | — | — | Aristas de linaje registradas (UC-63-06) | `src/modules/lakehouse/dto/lakehouse.dto.ts:799` |
| `alreadyRunning` | `boolean` | Sí | — | — | Verdadero si ya había una corrida viva sobre el mismo objetivo | `src/modules/lakehouse/dto/lakehouse.dto.ts:808` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La definición de transformación no está activa.; PreconditionFailedException: El dataset objetivo no está activo; no admite escrituras. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/lakehouse.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 63 — Lakehouse, productos de datos analíticos y releases de investigación — etapa `UC-63-05`

---

## 7. POST /lakehouse/zones

- **Origen:** CONTRATO
- **Nombre:** Definir una zona del data lake
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `LakehouseController.defineZone` — `src/modules/lakehouse/controllers/lakehouse.controller.ts:52`

### Qué es y para qué sirve (negocio)

Definir una zona del data lake. Caso de uso UC-63-01: Zona del data lake. Dentro del módulo (descripción del modelo, en inglés): «Separates raw, standardized, curated and research-ready data while preserving lineage, quality contracts, de-identification and controlled release.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/lakehouse/README.md:48`) · MODELO (`Mantra Core Health Context/modules/diagram_63_lakehouse.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /lakehouse/zones` la atiende `LakehouseController.defineZone` (src/modules/lakehouse/controllers/lakehouse.controller.ts:52). Exige sesión con alguno de los roles DATA_PLATFORM_ENGINEER, PLATFORM_ADMIN. Valida el cuerpo como `DefineZoneDto` (6 campos, 6 obligatorios). Delega en `LakehouseCatalogService.defineZone`. Crea filas en lakehouse.data_lake_zones, messaging.domain_events, messaging.outbox_messages. Lee lakehouse.data_lake_zones, messaging.outbox_messages. Publica LakeZoneDefined.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: DATA_PLATFORM_ENGINEER, PLATFORM_ADMIN | `src/modules/lakehouse/controllers/lakehouse.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `lakehouse.data_lake_zones` | ESCRIBE | CREA | DIRECTA | LakehouseController.defineZone → LakehouseCatalogService.defineZone → LakehouseCatalogRepository.createZone | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:63` |
| `lakehouse.data_lake_zones` | LEE | LEE | DIRECTA | LakehouseController.defineZone → LakehouseCatalogService.defineZone → LakehouseCatalogRepository.findZoneByCode | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:77` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | LakehouseController.defineZone → LakehouseCatalogService.defineZone → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | LakehouseController.defineZone → LakehouseCatalogService.defineZone → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | LakehouseController.defineZone → LakehouseCatalogService.defineZone → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `LakeZoneDefined` | `src/modules/lakehouse/services/lakehouse-catalog.service.ts:88` |

### Cuerpo — DTO `DefineZoneDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:43` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:51` |
| `zoneType` | `string` | Sí | valores: raw, standardized, curated, research | `@IsIn(ZONE_TYPES)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:58` |
| `namespaceId` | `string` | Sí | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:66` |
| `encryptionProfileCode` | `string` | Sí | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Perfil de cifrado en reposo | `src/modules/lakehouse/dto/lakehouse.dto.ts:78` |
| `retentionPolicyCode` | `string` | Sí | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:87` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "zoneType": "raw",
  "namespaceId": "00000000-0000-4000-8000-000000000001",
  "encryptionProfileCode": "CODIGO_EJEMPLO",
  "retentionPolicyCode": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "zoneType": "raw",
  "namespaceId": "00000000-0000-4000-8000-000000000001",
  "encryptionProfileCode": "CODIGO_EJEMPLO",
  "retentionPolicyCode": "CODIGO_EJEMPLO"
}
```

</details>

### Respuesta — `Promise<ZoneResponseDto>` · DTO `ZoneResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:98` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:104` |
| `zoneType` | `string` | Sí | — | — | Valor de zone type mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:110` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:116` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una zona con ese código. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/lakehouse.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 63 — Lakehouse, productos de datos analíticos y releases de investigación — etapa `UC-63-01`

---

## 8. POST /research/dataset-releases

- **Origen:** CONTRATO
- **Nombre:** Solicitar el release de un dataset para investigación
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ResearchController.requestRelease` — `src/modules/lakehouse/controllers/research.controller.ts:106`

### Qué es y para qué sirve (negocio)

Solicitar el release de un dataset para investigación. Caso de uso UC-63-10: Solicitar release. Dentro del módulo (descripción del modelo, en inglés): «Separates raw, standardized, curated and research-ready data while preserving lineage, quality contracts, de-identification and controlled release.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/lakehouse/README.md:57`) · MODELO (`Mantra Core Health Context/modules/diagram_63_lakehouse.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /research/dataset-releases` la atiende `ResearchController.requestRelease` (src/modules/lakehouse/controllers/research.controller.ts:106). Exige sesión con alguno de los roles PRINCIPAL_INVESTIGATOR, PLATFORM_ADMIN. Valida el cuerpo como `RequestDatasetReleaseDto` (5 campos, 5 obligatorios). Delega en `ResearchReleaseService.requestRelease`. Crea filas en lakehouse.dataset_release_requests, messaging.domain_events, messaging.outbox_messages. Lee lakehouse.cohort_definitions, lakehouse.data_product_versions, lakehouse.data_products, lakehouse.research_projects, messaging.outbox_messages. Publica DatasetReleaseRequested.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRINCIPAL_INVESTIGATOR, PLATFORM_ADMIN | `src/modules/lakehouse/controllers/research.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `lakehouse.cohort_definitions` | LEE | LEE | DIRECTA | ResearchController.requestRelease → ResearchReleaseService.requestRelease → ResearchRepository.findCohortById | `src/modules/lakehouse/repositories/research.repository.ts:209` |
| `lakehouse.data_product_versions` | LEE | LEE | DIRECTA | ResearchController.requestRelease → ResearchReleaseService.requestRelease → LakehouseCatalogRepository.findProductVersionInTenant | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:315` |
| `lakehouse.data_products` | LEE | LEE | DIRECTA | ResearchController.requestRelease → ResearchReleaseService.requestRelease → LakehouseCatalogRepository.findProductVersionInTenant | `src/modules/lakehouse/repositories/lakehouse-catalog.repository.ts:317` |
| `lakehouse.dataset_release_requests` | ESCRIBE | CREA | DIRECTA | ResearchController.requestRelease → ResearchReleaseService.requestRelease → ResearchRepository.createReleaseRequest | `src/modules/lakehouse/repositories/research.repository.ts:272` |
| `lakehouse.research_projects` | LEE | LEE | DIRECTA | ResearchController.requestRelease → ResearchReleaseService.requestRelease → ResearchRepository.findProjectById | `src/modules/lakehouse/repositories/research.repository.ts:32` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ResearchController.requestRelease → ResearchReleaseService.requestRelease → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ResearchController.requestRelease → ResearchReleaseService.requestRelease → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ResearchController.requestRelease → ResearchReleaseService.requestRelease → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `DatasetReleaseRequested` | `src/modules/lakehouse/services/research-release.service.ts:384` |

### Cuerpo — DTO `RequestDatasetReleaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1237` |
| `researchProjectId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1244` |
| `dataProductVersionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1251` |
| `cohortDefinitionId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1258` |
| `purposeOfUseCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1266` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "researchProjectId": "00000000-0000-4000-8000-000000000001",
  "dataProductVersionId": "00000000-0000-4000-8000-000000000001",
  "cohortDefinitionId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUseCode": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "researchProjectId": "00000000-0000-4000-8000-000000000001",
  "dataProductVersionId": "00000000-0000-4000-8000-000000000001",
  "cohortDefinitionId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUseCode": "CODIGO_EJEMPLO"
}
```

</details>

### Respuesta — `Promise<ReleaseRequestResponseDto>` · DTO `ReleaseRequestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1277` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1283` |
| `requestedAt` | `string` | Sí | formato date-time | — | Valor de requested at mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1289` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El proyecto no está aprobado.; PreconditionFailedException: La ventana de aprobación ética del proyecto no está vigente.; PreconditionFailedException: La cohorte no está activa.; PreconditionFailedException: El producto contiene datos de paciente y la cohorte no declara perfil de de-identificación. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/lakehouse.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 63 — Lakehouse, productos de datos analíticos y releases de investigación — etapa `UC-63-10`

---

## 9. POST /research/dataset-releases/{id}/approve

- **Origen:** CONTRATO
- **Nombre:** Aprobar y materializar el manifiesto de-identificado
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ResearchController.approveRelease` — `src/modules/lakehouse/controllers/research.controller.ts:127`

### Qué es y para qué sirve (negocio)

Aprobar y materializar el manifiesto de-identificado. Caso de uso UC-63-11: Aprobar y materializar. Dentro del módulo (descripción del modelo, en inglés): «Separates raw, standardized, curated and research-ready data while preserving lineage, quality contracts, de-identification and controlled release.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/lakehouse/README.md:58`) · MODELO (`Mantra Core Health Context/modules/diagram_63_lakehouse.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /research/dataset-releases/{id}/approve` la atiende `ResearchController.approveRelease` (src/modules/lakehouse/controllers/research.controller.ts:127). Exige sesión con alguno de los roles RESEARCH_GOVERNANCE, DPO, PLATFORM_ADMIN. Valida el cuerpo como `ApproveDatasetReleaseDto` (6 campos, 5 obligatorios). Delega en `ResearchReleaseService.approveRelease`. Crea filas en health_data.health_deidentification_runs, lakehouse.dataset_release_manifests, messaging.domain_events, messaging.outbox_messages. Lee lakehouse.cohort_definitions, lakehouse.dataset_release_manifests, lakehouse.dataset_release_requests, lakehouse.research_projects, messaging.outbox_messages. Publica DatasetReleaseMaterialized.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: RESEARCH_GOVERNANCE, DPO, PLATFORM_ADMIN | `src/modules/lakehouse/controllers/research.controller.ts:127` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/lakehouse/controllers/research.controller.ts:127` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.health_deidentification_runs` | ESCRIBE | CREA | DIRECTA | ResearchController.approveRelease → ResearchReleaseService.approveRelease → DataReleaseRepository.createDeidRun | `src/modules/health_data/repositories/data-release.repository.ts:150` |
| `lakehouse.cohort_definitions` | LEE | LEE | DIRECTA | ResearchController.approveRelease → ResearchReleaseService.approveRelease → ResearchRepository.findCohortById | `src/modules/lakehouse/repositories/research.repository.ts:209` |
| `lakehouse.dataset_release_manifests` | ESCRIBE | CREA | DIRECTA | ResearchController.approveRelease → ResearchReleaseService.approveRelease → ResearchRepository.createManifest | `src/modules/lakehouse/repositories/research.repository.ts:416` |
| `lakehouse.dataset_release_manifests` | LEE | LEE | DIRECTA | ResearchController.approveRelease → ResearchReleaseService.approveRelease → ResearchRepository.findManifestByRequestForUpdate | `src/modules/lakehouse/repositories/research.repository.ts:320` |
| `lakehouse.dataset_release_requests` | LEE | LEE | DIRECTA | ResearchController.approveRelease → ResearchReleaseService.approveRelease → ResearchRepository.findReleaseRequestForUpdate | `src/modules/lakehouse/repositories/research.repository.ts:294` |
| `lakehouse.research_projects` | LEE | LEE | DIRECTA | ResearchController.approveRelease → ResearchReleaseService.approveRelease → ResearchRepository.findProjectById | `src/modules/lakehouse/repositories/research.repository.ts:32` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ResearchController.approveRelease → ResearchReleaseService.approveRelease → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ResearchController.approveRelease → ResearchReleaseService.approveRelease → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ResearchController.approveRelease → ResearchReleaseService.approveRelease → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `DatasetReleaseMaterialized` | `src/modules/lakehouse/services/research-release.service.ts:537` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ApproveDatasetReleaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `purposeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Propósito con el que corre la de-identificación | `src/modules/lakehouse/dto/lakehouse.dto.ts:1306` |
| `recordCount` | `string` | Sí | — | `@IsNumberString({ no_symbols: true })` | Registros del manifiesto; cadena por ser bigint | `src/modules/lakehouse/dto/lakehouse.dto.ts:1315` |
| `contentHash` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Hash del contenido materializado | `src/modules/lakehouse/dto/lakehouse.dto.ts:1326` |
| `objectManifestId` | `string` | Sí | formato uuid | `@IsOptional()` `@IsUUID()` | Manifiesto del objeto de-identificado | `src/modules/lakehouse/dto/lakehouse.dto.ts:1337` |
| `schemaVersion` | `string` | Sí | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1346` |
| `ttlDays` | `number` | No | mínimo 1; máximo 3650 | `@IsOptional()` `@IsInt()` `@Min(1)` | Días de vigencia del acceso; por omisión, 90 | `src/modules/lakehouse/dto/lakehouse.dto.ts:1359` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "purposeConceptId": "00000000-0000-4000-8000-000000000001",
  "recordCount": "valor-ejemplo",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "objectManifestId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "purposeConceptId": "00000000-0000-4000-8000-000000000001",
  "recordCount": "valor-ejemplo",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "objectManifestId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo",
  "ttlDays": 1
}
```

</details>

### Respuesta — `Promise<ReleaseManifestResponseDto>` · DTO `ReleaseManifestResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `datasetReleaseRequestId` | `string` | Sí | formato uuid | — | Identificador asociado a dataset release request. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1370` |
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1376` |
| `deidentificationRunId` | `string` | Sí | formato uuid | — | Identificador asociado a deidentification run. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1382` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1388` |
| `expiresAt` | `string` | Sí | formato date-time | — | Valor de expires at mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1394` |
| `alreadyReleased` | `boolean` | Sí | — | — | Verdadero si el release ya estaba materializado | `src/modules/lakehouse/dto/lakehouse.dto.ts:1402` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud no está en un estado que admita aprobación.; PreconditionFailedException: La aprobación ética del proyecto caducó; el release no puede materializarse.; PreconditionFailedException: La cohorte no declara perfil de de-identificación. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/lakehouse.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 63 — Lakehouse, productos de datos analíticos y releases de investigación — etapa `UC-63-11`

---

## 10. POST /research/dataset-releases/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Expirar o revocar el release
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ResearchController.revokeRelease` — `src/modules/lakehouse/controllers/research.controller.ts:165`

### Qué es y para qué sirve (negocio)

Expirar o revocar el release. Caso de uso UC-63-12: Expirar o revocar. Dentro del módulo (descripción del modelo, en inglés): «Separates raw, standardized, curated and research-ready data while preserving lineage, quality contracts, de-identification and controlled release.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/lakehouse/README.md:59`) · MODELO (`Mantra Core Health Context/modules/diagram_63_lakehouse.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /research/dataset-releases/{id}/revoke` la atiende `ResearchController.revokeRelease` (src/modules/lakehouse/controllers/research.controller.ts:165). Exige sesión con alguno de los roles RESEARCH_GOVERNANCE, DPO, SYSTEM, PLATFORM_ADMIN. Valida el cuerpo como `RevokeDatasetReleaseDto` (2 campos, 0 obligatorios). Delega en `ResearchReleaseService.revokeRelease`. Crea filas en messaging.domain_events, messaging.outbox_messages. Actualiza lakehouse.dataset_release_manifests. Lee lakehouse.dataset_release_manifests, lakehouse.dataset_release_requests, messaging.outbox_messages. Publica DatasetReleaseRevoked.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: RESEARCH_GOVERNANCE, DPO, SYSTEM, PLATFORM_ADMIN | `src/modules/lakehouse/controllers/research.controller.ts:165` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/lakehouse/controllers/research.controller.ts:165` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `lakehouse.dataset_release_manifests` | ESCRIBE | ACTUALIZA | POR_TIPO | ResearchController.revokeRelease → ResearchReleaseService.revokeRelease | `src/modules/lakehouse/services/research-release.service.ts:621` |
| `lakehouse.dataset_release_manifests` | LEE | LEE | DIRECTA | ResearchController.revokeRelease → ResearchReleaseService.revokeRelease → ResearchRepository.findManifestByRequestForUpdate | `src/modules/lakehouse/repositories/research.repository.ts:320` |
| `lakehouse.dataset_release_requests` | LEE | LEE | DIRECTA | ResearchController.revokeRelease → ResearchReleaseService.revokeRelease → ResearchRepository.findReleaseRequestForUpdate | `src/modules/lakehouse/repositories/research.repository.ts:294` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ResearchController.revokeRelease → ResearchReleaseService.revokeRelease → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ResearchController.revokeRelease → ResearchReleaseService.revokeRelease → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ResearchController.revokeRelease → ResearchReleaseService.revokeRelease → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `DatasetReleaseRevoked` | `src/modules/lakehouse/services/research-release.service.ts:624` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RevokeDatasetReleaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Cierra por vencimiento del plazo en vez de por decisión de gobernanza | `src/modules/lakehouse/dto/lakehouse.dto.ts:1421` |
| `reason` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Motivo; queda en el evento publicado | `src/modules/lakehouse/dto/lakehouse.dto.ts:1433` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "expired": false,
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<RevokeReleaseResponseDto>` · DTO `RevokeReleaseResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1444` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1450` |
| `alreadyClosed` | `boolean` | Sí | — | — | Verdadero si el release ya estaba cerrado | `src/modules/lakehouse/dto/lakehouse.dto.ts:1456` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/lakehouse.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 63 — Lakehouse, productos de datos analíticos y releases de investigación — etapa `UC-63-12`

---

## 11. GET /research/dataset-releases/expired

- **Origen:** CONTRATO
- **Nombre:** Listar releases con manifiesto vencido sin cerrar
- **Bloque:** Datos y NoSQL
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ResearchController.listExpiredReleases` — `src/modules/lakehouse/controllers/research.controller.ts:152`

### Qué es y para qué sirve (negocio)

Listar releases con manifiesto vencido sin cerrar. Dentro del módulo (descripción del modelo, en inglés): «Separates raw, standardized, curated and research-ready data while preserving lineage, quality contracts, de-identification and controlled release.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_63_lakehouse.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`GET /research/dataset-releases/expired` la atiende `ResearchController.listExpiredReleases` (src/modules/lakehouse/controllers/research.controller.ts:152). Exige sesión con alguno de los roles RESEARCH_GOVERNANCE, DPO, SYSTEM, PLATFORM_ADMIN. Delega en `ResearchReleaseService.listExpiredReleases`. Lee lakehouse.dataset_release_manifests, lakehouse.dataset_release_requests.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: RESEARCH_GOVERNANCE, DPO, SYSTEM, PLATFORM_ADMIN | `src/modules/lakehouse/controllers/research.controller.ts:152` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `lakehouse.dataset_release_manifests` | LEE | LEE | DIRECTA | ResearchController.listExpiredReleases → ResearchReleaseService.listExpiredReleases → ResearchRepository.findExpiredManifests | `src/modules/lakehouse/repositories/research.repository.ts:366` |
| `lakehouse.dataset_release_requests` | LEE | LEE | DIRECTA | ResearchController.listExpiredReleases → ResearchReleaseService.listExpiredReleases → ResearchRepository.findOpenRequestIds | `src/modules/lakehouse/repositories/research.repository.ts:342` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PendingExpiredReleasesResponseDto>` · DTO `PendingExpiredReleasesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `releases` | `array<ExpiredReleaseSummaryDto>` | Sí | — | — | Valor de releases mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1480` |
| `releases[].requestId` | `string` | Sí | formato uuid | — | Identificador asociado a request. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1465` |
| `releases[].expiresAt` | `string` | Sí | formato date-time | — | Fecha y hora en que venció el manifiesto. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1471` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/lakehouse.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 63 — Lakehouse, productos de datos analíticos y releases de investigación — etapa `ctrl:ResearchController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /research/deidentification-profiles

- **Origen:** CONTRATO
- **Nombre:** Dar de alta un perfil de de-identificación
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ResearchController.createDeidentificationProfile` — `src/modules/lakehouse/controllers/research.controller.ts:61`

### Qué es y para qué sirve (negocio)

Dar de alta un perfil de de-identificación. Dentro del módulo (descripción del modelo, en inglés): «Separates raw, standardized, curated and research-ready data while preserving lineage, quality contracts, de-identification and controlled release.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_63_lakehouse.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /research/deidentification-profiles` la atiende `ResearchController.createDeidentificationProfile` (src/modules/lakehouse/controllers/research.controller.ts:61). Exige sesión con alguno de los roles RESEARCH_GOVERNANCE, DPO, PRINCIPAL_INVESTIGATOR, PLATFORM_ADMIN. Valida el cuerpo como `CreateDeidentificationProfileDto` (8 campos, 4 obligatorios). Delega en `ResearchReleaseService.createDeidentificationProfile`. Crea filas en health_data.health_deidentification_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: RESEARCH_GOVERNANCE, DPO, PRINCIPAL_INVESTIGATOR, PLATFORM_ADMIN | `src/modules/lakehouse/controllers/research.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.health_deidentification_profiles` | ESCRIBE | CREA | DIRECTA | ResearchController.createDeidentificationProfile → ResearchReleaseService.createDeidentificationProfile → DataReleaseRepository.createDeidProfile | `src/modules/health_data/repositories/data-release.repository.ts:69` |

### Cuerpo — DTO `CreateDeidentificationProfileDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1496` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1504` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1512` |
| `methodologyConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Metodología de de-identificación aplicada | `src/modules/lakehouse/dto/lakehouse.dto.ts:1522` |
| `directIdentifierRulesJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1530` |
| `quasiIdentifierRulesJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1538` |
| `dateShiftPolicyJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1546` |
| `freeTextPolicyJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1554` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "methodologyConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "methodologyConceptId": "00000000-0000-4000-8000-000000000001",
  "directIdentifierRulesJson": {},
  "quasiIdentifierRulesJson": {},
  "dateShiftPolicyJson": {},
  "freeTextPolicyJson": {}
}
```

</details>

### Respuesta — `Promise<DeidentificationProfileResponseDto>` · DTO `DeidentificationProfileResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del perfil. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1560` |
| `code` | `string` | Sí | — | — | Código único dentro del tenant. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1562` |
| `stateConceptId` | `string` | Sí | formato uuid | — | Concepto de estado: nace activo. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1564` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/lakehouse.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 63 — Lakehouse, productos de datos analíticos y releases de investigación — etapa `ctrl:ResearchController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /research/projects/{id}/cohorts

- **Origen:** CONTRATO
- **Nombre:** Definir el proyecto de investigación y su cohorte
- **Bloque:** Datos y NoSQL
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ResearchController.defineCohort` — `src/modules/lakehouse/controllers/research.controller.ts:84`

### Qué es y para qué sirve (negocio)

Definir el proyecto de investigación y su cohorte. Caso de uso UC-63-09: Proyecto y cohorte. Dentro del módulo (descripción del modelo, en inglés): «Separates raw, standardized, curated and research-ready data while preserving lineage, quality contracts, de-identification and controlled release.» Dominio: Datos y NoSQL.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/lakehouse/README.md:56`) · MODELO (`Mantra Core Health Context/modules/diagram_63_lakehouse.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:37`)

### Cómo se atiende (sistema)

`POST /research/projects/{id}/cohorts` la atiende `ResearchController.defineCohort` (src/modules/lakehouse/controllers/research.controller.ts:84). Exige sesión con alguno de los roles PRINCIPAL_INVESTIGATOR, RESEARCH_GOVERNANCE, PLATFORM_ADMIN. Valida el cuerpo como `DefineCohortDto` (13 campos, 11 obligatorios). Delega en `ResearchReleaseService.defineCohort`. Crea filas en lakehouse.cohort_definitions, lakehouse.research_projects, messaging.domain_events, messaging.outbox_messages. Actualiza lakehouse.research_projects. Lee health_data.health_deidentification_profiles, lakehouse.cohort_definitions, lakehouse.research_projects, messaging.outbox_messages. Publica CohortDefined.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PRINCIPAL_INVESTIGATOR, RESEARCH_GOVERNANCE, PLATFORM_ADMIN | `src/modules/lakehouse/controllers/research.controller.ts:84` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/lakehouse/controllers/research.controller.ts:84` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `health_data.health_deidentification_profiles` | LEE | LEE | DIRECTA | ResearchController.defineCohort → ResearchReleaseService.defineCohort → DataReleaseRepository.findDeidProfileById | `src/modules/health_data/repositories/data-release.repository.ts:31` |
| `lakehouse.cohort_definitions` | ESCRIBE | CREA | DIRECTA | ResearchController.defineCohort → ResearchReleaseService.defineCohort → ResearchRepository.createCohort | `src/modules/lakehouse/repositories/research.repository.ts:186` |
| `lakehouse.cohort_definitions` | LEE | LEE | DIRECTA | ResearchController.defineCohort → ResearchReleaseService.defineCohort → ResearchRepository.findCohortByVersion | `src/modules/lakehouse/repositories/research.repository.ts:227` |
| `lakehouse.research_projects` | ESCRIBE | ACTUALIZA | POR_TIPO | ResearchController.defineCohort → ResearchReleaseService.defineCohort | `src/modules/lakehouse/services/research-release.service.ts:222` |
| `lakehouse.research_projects` | ESCRIBE | CREA | DIRECTA | ResearchController.defineCohort → ResearchReleaseService.defineCohort → ResearchRepository.createProject | `src/modules/lakehouse/repositories/research.repository.ts:131` |
| `lakehouse.research_projects` | LEE | LEE | DIRECTA | ResearchController.defineCohort → ResearchReleaseService.defineCohort → ResearchRepository.findProjectByIdAnyTenant | `src/modules/lakehouse/repositories/research.repository.ts:47` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | ResearchController.defineCohort → ResearchReleaseService.defineCohort → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | ResearchController.defineCohort → ResearchReleaseService.defineCohort → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | ResearchController.defineCohort → ResearchReleaseService.defineCohort → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `CohortDefined` | `src/modules/lakehouse/services/research-release.service.ts:259` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `DefineCohortDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1080` |
| `projectCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Código del proyecto; su clave natural con el tenant | `src/modules/lakehouse/dto/lakehouse.dto.ts:1091` |
| `title` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1099` |
| `protocolReference` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1108` |
| `principalInvestigatorId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1115` |
| `ethicsApprovalReference` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Referencia de la aprobación ética | `src/modules/lakehouse/dto/lakehouse.dto.ts:1126` |
| `approvedFrom` | `string` | Sí | formato date-time | `@IsISO8601()` | Inicio de la ventana ética | `src/modules/lakehouse/dto/lakehouse.dto.ts:1136` |
| `approvedTo` | `string` | Sí | formato date-time | `@IsISO8601()` | Fin de la ventana ética | `src/modules/lakehouse/dto/lakehouse.dto.ts:1143` |
| `cohortCode` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1151` |
| `cohortVersion` | `string` | Sí | longitud máxima 50 | `@IsString()` `@MaxLength(50)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1159` |
| `inclusionExpression` | `string` | Sí | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1168` |
| `exclusionExpression` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/lakehouse/dto/lakehouse.dto.ts:1177` |
| `deidentificationProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil de de-identificación con el que se materializará el release | `src/modules/lakehouse/dto/lakehouse.dto.ts:1188` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "projectCode": "CODIGO_EJEMPLO",
  "title": "valor-ejemplo",
  "principalInvestigatorId": "00000000-0000-4000-8000-000000000001",
  "ethicsApprovalReference": "valor-ejemplo",
  "approvedFrom": "2026-07-31T12:00:00.000Z",
  "approvedTo": "2026-07-31T12:00:00.000Z",
  "cohortCode": "CODIGO_EJEMPLO",
  "cohortVersion": "valor-ejemplo",
  "inclusionExpression": "valor-ejemplo",
  "deidentificationProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "projectCode": "CODIGO_EJEMPLO",
  "title": "valor-ejemplo",
  "protocolReference": "valor-ejemplo",
  "principalInvestigatorId": "00000000-0000-4000-8000-000000000001",
  "ethicsApprovalReference": "valor-ejemplo",
  "approvedFrom": "2026-07-31T12:00:00.000Z",
  "approvedTo": "2026-07-31T12:00:00.000Z",
  "cohortCode": "CODIGO_EJEMPLO",
  "cohortVersion": "valor-ejemplo",
  "inclusionExpression": "valor-ejemplo",
  "exclusionExpression": "valor-ejemplo",
  "deidentificationProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<CohortResponseDto>` · DTO `CohortResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `researchProjectId` | `string` | Sí | formato uuid | — | Identificador asociado a research project. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1199` |
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1205` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1211` |
| `version` | `string` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1217` |
| `state` | `string` | Sí | — | — | Valor de state mantenido por la instancia. | `src/modules/lakehouse/dto/lakehouse.dto.ts:1223` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un proyecto con ese código para el tenant, con otro identificador.; ConflictException: El proyecto existente tiene otro código.; ConflictException: Esa versión de la cohorte ya está definida. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La ventana de aprobación ética tiene que empezar antes de terminar.; PreconditionFailedException: La aprobación ética ya está caducada. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/lakehouse.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 63 — Lakehouse, productos de datos analíticos y releases de investigación — etapa `UC-63-09`

---

