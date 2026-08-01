<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `lakehouse`

Referencia exhaustiva de 12 operación(es) del módulo `lakehouse`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `lakehouse`
- **Controladores:** `LakehouseController`, `ResearchController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /lakehouse/catalogs](#1-post-lakehouse-catalogs) — Registrar el catálogo / metastore
2. [POST /lakehouse/data-products/{id}/versions](#2-post-lakehouse-data-products-id-versions) — Publicar el producto de datos y su versión
3. [POST /lakehouse/datasets](#3-post-lakehouse-datasets) — Registrar el dataset y su esquema inicial
4. [POST /lakehouse/datasets/{id}/quality-runs](#4-post-lakehouse-datasets-id-quality-runs) — Evaluar la calidad del dataset y abrir hallazgos
5. [POST /lakehouse/ingestion/curated-runs](#5-post-lakehouse-ingestion-curated-runs) — Ingerir dato de salud de-identificado en la zona curada
6. [POST /lakehouse/transformations/{defId}/runs](#6-post-lakehouse-transformations-defid-runs) — Registrar la corrida con sus particiones, archivos y linaje
7. [POST /lakehouse/zones](#7-post-lakehouse-zones) — Definir una zona del data lake
8. [POST /research/dataset-releases](#8-post-research-dataset-releases) — Solicitar el release de un dataset para investigación
9. [POST /research/dataset-releases/{id}/approve](#9-post-research-dataset-releases-id-approve) — Aprobar y materializar el manifiesto de-identificado
10. [POST /research/dataset-releases/{id}/revoke](#10-post-research-dataset-releases-id-revoke) — Expirar o revocar el release
11. [GET /research/dataset-releases/expired](#11-get-research-dataset-releases-expired) — Listar releases con manifiesto vencido sin cerrar
12. [POST /research/projects/{id}/cohorts](#12-post-research-projects-id-cohorts) — Definir el proyecto de investigación y su cohorte

---

## 1. POST /lakehouse/catalogs

- **Módulo:** `lakehouse`
- **Etiqueta OpenAPI:** `lakehouse`
- **Nombre:** Registrar el catálogo / metastore
- **Operation ID:** `LakehouseController_registerCatalog`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LakehouseController.registerCatalog](../../src/modules/lakehouse/controllers/lakehouse.controller.ts)

### Descripción de negocio

Registrar el catálogo / metastore. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /lakehouse/catalogs` en `LakehouseController_registerCatalog`. El controlador delega en `LakehouseCatalogService.registerCatalog`. Valida el body como `RegisterCatalogDto` y consume `application/json`. El tipo de retorno estático es `Promise<CatalogResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterCatalogDto`; los campos opcionales se omiten.

```http
POST /lakehouse/catalogs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "catalogType": "valor-ejemplo",
  "metastoreUri": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_PLATFORM_ENGINEER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `catalogType` | Sí | `string` | longitud máxima 100 | Motor del metastore, p. ej. `glue` o `hive` | `valor-ejemplo` |
| `metastoreUri` | Sí | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `defaultFormat` | No | `string` | valores: `parquet`, `delta`, `iceberg`, `avro`, `orc` | Sin descripción específica en el contrato OpenAPI. | `parquet` |
| `defaultCompression` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /lakehouse/catalogs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "catalogType": "valor-ejemplo",
  "metastoreUri": "valor-ejemplo",
  "defaultFormat": "parquet",
  "defaultCompression": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CatalogResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CatalogResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CatalogResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CatalogResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CatalogResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CatalogResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CatalogResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CatalogResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CatalogResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CatalogResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "state": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_PLATFORM_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un catálogo con ese código. | Excepción explícita en src/modules/lakehouse/services/lakehouse-catalog.service.ts |
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
  "path": "/lakehouse/catalogs"
}
```

---

## 2. POST /lakehouse/data-products/{id}/versions

- **Módulo:** `lakehouse`
- **Etiqueta OpenAPI:** `lakehouse`
- **Nombre:** Publicar el producto de datos y su versión
- **Operation ID:** `LakehouseController_publishProductVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LakehouseController.publishProductVersion](../../src/modules/lakehouse/controllers/lakehouse.controller.ts)

### Descripción de negocio

Upsert del producto y alta de la versión; la vigente anterior queda superseded y del SLO salen las reglas de calidad.


### Descripción del sistema

NestJS resuelve `POST /lakehouse/data-products/{id}/versions` en `LakehouseController_publishProductVersion`. El controlador delega en `LakehouseCatalogService.publishProductVersion`. Valida el body como `PublishProductVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ProductVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishProductVersionDto`; los campos opcionales se omiten.

```http
POST /lakehouse/data-products/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "version": "valor-ejemplo",
  "contractSchemaJson": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_PRODUCT_OWNER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código del producto; su clave natural con el tenant | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `ownerTeamId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `businessPurpose` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `classificationCode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `containsPhi` | No | `boolean` | Sin restricción adicional declarada | Si el producto contiene datos de paciente | `false` |
| `version` | Sí | `string` | longitud máxima 50 | Versión que se publica | `valor-ejemplo` |
| `contractSchemaJson` | Sí | `object` | Sin restricción adicional declarada | Contrato de esquema que el producto promete cumplir | `{}` |
| `qualitySloJson` | No | `object` | Sin restricción adicional declarada | Objetivos de calidad de los que salen las reglas | `{}` |
| `qualityRules` | No | `array<QualityRuleDto>` | máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"ruleCode":"CODIGO_EJEMPLO","dimension":"completeness","expression":"valor-ejemplo","severity":"info","threshold":"valor-ejemplo"}]` |
| `qualityRules[].ruleCode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `qualityRules[].dimension` | No | `string` | valores: `completeness`, `accuracy`, `consistency`, `timeliness`, `uniqueness`, `validity` | Sin descripción específica en el contrato OpenAPI. | `completeness` |
| `qualityRules[].expression` | No | `string` | longitud máxima 1000 | Expresión declarativa de la regla | `valor-ejemplo` |
| `qualityRules[].severity` | No | `string` | valores: `info`, `warning`, `blocking` | `blocking` cuarentena el dataset | `info` |
| `qualityRules[].threshold` | No | `string` | Sin restricción adicional declarada | Umbral a partir del cual la regla falla; cadena por ser numeric | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /lakehouse/data-products/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ProductVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ProductVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ProductVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ProductVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ProductVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ProductVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ProductVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ProductVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ProductVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ProductVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProductVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "dataProductId": "00000000-0000-4000-8000-000000000001",
  "id": "00000000-0000-4000-8000-000000000001",
  "version": "valor-ejemplo",
  "state": "valor-ejemplo",
  "supersededVersionId": "00000000-0000-4000-8000-000000000001",
  "qualityRulesCreated": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `dataProductId` | Sí | `string` | formato `uuid` | Identificador asociado a data product. | `00000000-0000-4000-8000-000000000001` |
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `version` | Sí | `string` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `valor-ejemplo` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |
| `supersededVersionId` | No | `string` | formato `uuid` | Versión anterior que quedó superseded | `00000000-0000-4000-8000-000000000001` |
| `qualityRulesCreated` | Sí | `number` | Sin restricción adicional declarada | Reglas de calidad derivadas del SLO | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_PRODUCT_OWNER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un producto con ese código para el tenant, con otro identificador. | Excepción explícita en src/modules/lakehouse/services/lakehouse-catalog.service.ts |
| 409 | `CONFLICT` | El producto existente tiene otro código o pertenece a otro tenant. | Excepción explícita en src/modules/lakehouse/services/lakehouse-catalog.service.ts |
| 409 | `CONFLICT` | Esa versión del producto ya está publicada. | Excepción explícita en src/modules/lakehouse/services/lakehouse-catalog.service.ts |
| 409 | `CONFLICT` | Dos reglas de calidad comparten el mismo código. | Excepción explícita en src/modules/lakehouse/services/lakehouse-catalog.service.ts |
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
  "path": "/lakehouse/data-products/{id}/versions"
}
```

---

## 3. POST /lakehouse/datasets

- **Módulo:** `lakehouse`
- **Etiqueta OpenAPI:** `lakehouse`
- **Nombre:** Registrar el dataset y su esquema inicial
- **Operation ID:** `LakehouseController_registerDataset`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LakehouseController.registerDataset](../../src/modules/lakehouse/controllers/lakehouse.controller.ts)

### Descripción de negocio

Exige versión de producto activa, y zona y catálogo activos.


### Descripción del sistema

NestJS resuelve `POST /lakehouse/datasets` en `LakehouseController_registerDataset`. El controlador delega en `LakehouseCatalogService.registerDataset`. Valida el body como `RegisterDatasetDto` y consume `application/json`. El tipo de retorno estático es `Promise<DatasetResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterDatasetDto`; los campos opcionales se omiten.

```http
POST /lakehouse/datasets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_PLATFORM_ENGINEER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `dataProductVersionId` | Sí | `string` | formato `uuid` | Versión de producto activa | `00000000-0000-4000-8000-000000000001` |
| `dataLakeZoneId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lakehouseCatalogId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `databaseName` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `tableName` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `storageFormat` | No | `string` | valores: `parquet`, `delta`, `iceberg`, `avro`, `orc` | Por omisión, el del catálogo | `parquet` |
| `partitionSpecJson` | No | `object` | Sin restricción adicional declarada | Cómo se particiona la tabla | `{}` |
| `sourceDatasetCode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `schemaJson` | Sí | `object` | Sin restricción adicional declarada | Esquema inicial del dataset | `{}` |
| `schemaFingerprint` | Sí | `string` | longitud máxima 200 | Huella del esquema; identifica el contrato | `valor-ejemplo` |
| `compatibilityMode` | No | `string` | valores: `none`, `backward`, `forward`, `full` | Sin descripción específica en el contrato OpenAPI. | `backward` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /lakehouse/datasets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DatasetResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DatasetResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DatasetResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "lifecycleState": "valor-ejemplo",
  "initialVersionId": "00000000-0000-4000-8000-000000000001",
  "initialVersion": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `lifecycleState` | Sí | `string` | Sin restricción adicional declarada | Valor de lifecycle state mantenido por la instancia. | `valor-ejemplo` |
| `initialVersionId` | Sí | `string` | formato `uuid` | Versión 1.0.0, creada en la misma transacción | `00000000-0000-4000-8000-000000000001` |
| `initialVersion` | Sí | `string` | Sin restricción adicional declarada | Valor de initial version mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_PLATFORM_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión de producto no encontrada. | Excepción explícita en src/modules/lakehouse/services/lakehouse-catalog.service.ts |
| 404 | `NOT_FOUND` | Zona no encontrada. | Excepción explícita en src/modules/lakehouse/services/lakehouse-catalog.service.ts |
| 404 | `NOT_FOUND` | Catálogo no encontrado. | Excepción explícita en src/modules/lakehouse/services/lakehouse-catalog.service.ts |
| 409 | `CONFLICT` | Ya hay un dataset registrado para esa tabla. | Excepción explícita en src/modules/lakehouse/services/lakehouse-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La versión del producto ya no es la vigente. | Excepción explícita en src/modules/lakehouse/services/lakehouse-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | La zona no está activa. | Excepción explícita en src/modules/lakehouse/services/lakehouse-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El catálogo no está activo. | Excepción explícita en src/modules/lakehouse/services/lakehouse-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/lakehouse/datasets"
}
```

---

## 4. POST /lakehouse/datasets/{id}/quality-runs

- **Módulo:** `lakehouse`
- **Etiqueta OpenAPI:** `lakehouse`
- **Nombre:** Evaluar la calidad del dataset y abrir hallazgos
- **Operation ID:** `LakehouseController_runQualityCheck`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LakehouseController.runQualityCheck](../../src/modules/lakehouse/controllers/lakehouse.controller.ts)

### Descripción de negocio

Una regla `blocking` incumplida pone el dataset en cuarentena.


### Descripción del sistema

NestJS resuelve `POST /lakehouse/datasets/{id}/quality-runs` en `LakehouseController_runQualityCheck`. El controlador delega en `TransformationService.runQualityCheck`. Valida el body como `RunQualityCheckDto` y consume `application/json`. El tipo de retorno estático es `Promise<QualityRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunQualityCheckDto`; los campos opcionales se omiten.

```http
POST /lakehouse/datasets/00000000-0000-4000-8000-000000000001/quality-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "evaluatedRecordCount": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_STEWARD`, `SYSTEM`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `transformationRunId` | No | `string` | formato `uuid` | Corrida de transformación evaluada | `00000000-0000-4000-8000-000000000001` |
| `evaluatedRecordCount` | Sí | `string` | Sin restricción adicional declarada | Registros evaluados; cadena por ser bigint | `valor-ejemplo` |
| `findings` | No | `array<QualityFindingDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"healthDataQualityRuleId":"00000000-0000-4000-8000-000000000001","canonicalHealthResourceId":"00000000-0000-4000-8000-000000000001","canonicalResourceVersionId":"00000000-0000-4000-8000-000000000001","fieldPath":"valor-ejemplo","observedValueHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]` |
| `findings[].healthDataQualityRuleId` | No | `string` | formato `uuid` | Regla que se incumple | `00000000-0000-4000-8000-000000000001` |
| `findings[].canonicalHealthResourceId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `findings[].canonicalResourceVersionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `findings[].fieldPath` | No | `string` | longitud máxima 500 | Campo afectado | `valor-ejemplo` |
| `findings[].observedValueHash` | No | `string` | longitud máxima 200 | Hash del valor observado; el valor en claro no se guarda | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /lakehouse/datasets/00000000-0000-4000-8000-000000000001/quality-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "transformationRunId": "00000000-0000-4000-8000-000000000001",
  "evaluatedRecordCount": "valor-ejemplo",
  "findings": [
    {
      "healthDataQualityRuleId": "00000000-0000-4000-8000-000000000001",
      "canonicalHealthResourceId": "00000000-0000-4000-8000-000000000001",
      "canonicalResourceVersionId": "00000000-0000-4000-8000-000000000001",
      "fieldPath": "valor-ejemplo",
      "observedValueHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<QualityRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `QualityRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "evaluatedRecordCount": "valor-ejemplo",
  "failedRecordCount": "valor-ejemplo",
  "issuesOpened": 1,
  "datasetQuarantined": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `evaluatedRecordCount` | Sí | `string` | Sin restricción adicional declarada | Valor de evaluated record count mantenido por la instancia. | `valor-ejemplo` |
| `failedRecordCount` | Sí | `string` | Sin restricción adicional declarada | Valor de failed record count mantenido por la instancia. | `valor-ejemplo` |
| `issuesOpened` | Sí | `number` | Sin restricción adicional declarada | Hallazgos abiertos | `1` |
| `datasetQuarantined` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si una regla bloqueante puso el dataset en cuarentena | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_STEWARD, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Dataset no encontrado. | Excepción explícita en src/modules/lakehouse/services/transformation.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El hallazgo cita una regla que no está activa para la versión del producto. | Excepción explícita en src/modules/lakehouse/services/transformation.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/lakehouse/datasets/{id}/quality-runs"
}
```

---

## 5. POST /lakehouse/ingestion/curated-runs

- **Módulo:** `lakehouse`
- **Etiqueta OpenAPI:** `lakehouse`
- **Nombre:** Ingerir dato de salud de-identificado en la zona curada
- **Operation ID:** `LakehouseController_ingestCurated`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LakehouseController.ingestCurated](../../src/modules/lakehouse/controllers/lakehouse.controller.ts)

### Descripción de negocio

El destino tiene que estar en zona `curated`; la corrida de de-identificación se registra en la misma transacción.


### Descripción del sistema

NestJS resuelve `POST /lakehouse/ingestion/curated-runs` en `LakehouseController_ingestCurated`. El controlador delega en `TransformationService.ingestCurated`. Valida el body como `CuratedIngestionDto` y consume `application/json`. El tipo de retorno estático es `Promise<CuratedIngestionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CuratedIngestionDto`; los campos opcionales se omiten.

```http
POST /lakehouse/ingestion/curated-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `DEIDENTIFICATION_WORKER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `targetDatasetId` | Sí | `string` | formato `uuid` | Dataset destino, obligatoriamente en zona curated | `00000000-0000-4000-8000-000000000001` |
| `deidentificationProfileId` | Sí | `string` | formato `uuid` | Perfil de de-identificación aplicado | `00000000-0000-4000-8000-000000000001` |
| `purposeConceptId` | Sí | `string` | formato `uuid` | Propósito de la de-identificación | `00000000-0000-4000-8000-000000000001` |
| `consentDirectiveId` | No | `string` | formato `uuid` | Consentimiento que ampara el tratamiento | `00000000-0000-4000-8000-000000000001` |
| `inputManifestFileId` | No | `string` | formato `uuid` | Manifiesto del lote de entrada | `00000000-0000-4000-8000-000000000001` |
| `recordsProcessed` | Sí | `string` | Sin restricción adicional declarada | Registros de-identificados; cadena por ser bigint | `valor-ejemplo` |
| `recordsRejected` | No | `string` | Sin restricción adicional declarada | Registros rechazados; cadena por ser bigint | `valor-ejemplo` |
| `partitions` | Sí | `array<MaterializedPartitionDto>` | mínimo 1 elemento(s); máximo 500 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"partitionSpecHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","partitionValuesJson":{},"recordCount":"valor-ejemplo","sizeBytes":"valor-ejemplo","minEventAt":"2026-07-31T12:00:00.000Z","maxEventAt":"2026-07-31T12:00:00.000Z","files":[{"objectManifestId":"00000000-0000-4000-8000-000000000001","fileFormat":"parquet","rowCount":"valor-ejemplo","sizeBytes":"valor-ejemplo","contentHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","minMaxStatisticsJson":{}}],"sourcePartitionIds":["00000000-0000-4000-8000-000000000001"]}]` |
| `partitions[].partitionSpecHash` | Sí | `string` | longitud máxima 200 | Huella de los valores de partición | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `partitions[].partitionValuesJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `partitions[].recordCount` | Sí | `string` | Sin restricción adicional declarada | Registros de la partición; cadena por ser bigint | `valor-ejemplo` |
| `partitions[].sizeBytes` | Sí | `string` | Sin restricción adicional declarada | Tamaño en bytes; cadena por ser bigint | `valor-ejemplo` |
| `partitions[].minEventAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `partitions[].maxEventAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `partitions[].files` | Sí | `array<MaterializedFileDto>` | mínimo 1 elemento(s); máximo 1000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"objectManifestId":"00000000-0000-4000-8000-000000000001","fileFormat":"parquet","rowCount":"valor-ejemplo","sizeBytes":"valor-ejemplo","contentHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","minMaxStatisticsJson":{}}]` |
| `partitions[].files[].objectManifestId` | No | `string` | formato `uuid` | Manifiesto del objeto en el almacén | `00000000-0000-4000-8000-000000000001` |
| `partitions[].files[].fileFormat` | Sí | `string` | valores: `parquet`, `delta`, `iceberg`, `avro`, `orc` | Sin descripción específica en el contrato OpenAPI. | `parquet` |
| `partitions[].files[].rowCount` | Sí | `string` | Sin restricción adicional declarada | Filas del archivo; cadena por ser bigint | `valor-ejemplo` |
| `partitions[].files[].sizeBytes` | Sí | `string` | Sin restricción adicional declarada | Tamaño en bytes; cadena por ser bigint | `valor-ejemplo` |
| `partitions[].files[].contentHash` | Sí | `string` | longitud máxima 200 | Hash del contenido; el archivo es inmutable | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `partitions[].files[].minMaxStatisticsJson` | No | `object` | Sin restricción adicional declarada | Mínimos y máximos por columna, para poda de particiones | `{}` |
| `partitions[].sourcePartitionIds` | No | `array<string>` | formato `uuid` | Particiones fuente de las que sale ésta; alimentan el linaje | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /lakehouse/ingestion/curated-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CuratedIngestionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CuratedIngestionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CuratedIngestionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CuratedIngestionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CuratedIngestionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CuratedIngestionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CuratedIngestionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CuratedIngestionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CuratedIngestionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CuratedIngestionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "deidentificationRunId": "00000000-0000-4000-8000-000000000001",
  "targetDatasetId": "00000000-0000-4000-8000-000000000001",
  "partitionsCommitted": 1,
  "filesWritten": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `deidentificationRunId` | Sí | `string` | formato `uuid` | Corrida de de-identificación registrada | `00000000-0000-4000-8000-000000000001` |
| `targetDatasetId` | Sí | `string` | formato `uuid` | Identificador asociado a target dataset. | `00000000-0000-4000-8000-000000000001` |
| `partitionsCommitted` | Sí | `number` | Sin restricción adicional declarada | Valor de partitions committed mantenido por la instancia. | `1` |
| `filesWritten` | Sí | `number` | Sin restricción adicional declarada | Valor de files written mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, DEIDENTIFICATION_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Perfil de de-identificación no encontrado. | Excepción explícita en src/modules/lakehouse/services/transformation.service.ts |
| 404 | `NOT_FOUND` | Dataset objetivo no encontrado. | Excepción explícita en src/modules/lakehouse/services/transformation.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ingesta de-identificada sólo puede escribir en la zona curated. | Excepción explícita en src/modules/lakehouse/services/transformation.service.ts |
| 422 | `PRECONDITION_FAILED` | El dataset objetivo no está activo; no admite escrituras. | Excepción explícita en src/modules/lakehouse/services/transformation.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/lakehouse/ingestion/curated-runs"
}
```

---

## 6. POST /lakehouse/transformations/{defId}/runs

- **Módulo:** `lakehouse`
- **Etiqueta OpenAPI:** `lakehouse`
- **Nombre:** Registrar la corrida con sus particiones, archivos y linaje
- **Operation ID:** `LakehouseController_runTransformation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LakehouseController.runTransformation](../../src/modules/lakehouse/controllers/lakehouse.controller.ts)

### Descripción de negocio

Una sola corrida viva por definición. Las particiones y archivos ya escritos se saltan por su huella: corregir crea una partición nueva, no reescribe.

Contexto declarado en el controlador: UC-63-05 + UC-63-06.

### Descripción del sistema

NestJS resuelve `POST /lakehouse/transformations/{defId}/runs` en `LakehouseController_runTransformation`. El controlador delega en `TransformationService.runTransformation`. Valida el body como `RunTransformationDto` y consume `application/json`. El tipo de retorno estático es `Promise<TransformationRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `defId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunTransformationDto`; los campos opcionales se omiten.

```http
POST /lakehouse/transformations/00000000-0000-4000-8000-000000000001/runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `TRANSFORMATION_WORKER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `defId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sourceCheckpoint` | No | `string` | Sin restricción adicional declarada | Punto de la fuente hasta el que procesó; cadena por ser bigint | `valor-ejemplo` |
| `inputRecordCount` | Sí | `string` | Sin restricción adicional declarada | Registros leídos; cadena por ser bigint | `valor-ejemplo` |
| `outputRecordCount` | Sí | `string` | Sin restricción adicional declarada | Registros escritos; cadena por ser bigint | `valor-ejemplo` |
| `rejectedRecordCount` | No | `string` | Sin restricción adicional declarada | Registros rechazados; cadena por ser bigint | `valor-ejemplo` |
| `partitions` | Sí | `array<MaterializedPartitionDto>` | mínimo 1 elemento(s); máximo 500 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"partitionSpecHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","partitionValuesJson":{},"recordCount":"valor-ejemplo","sizeBytes":"valor-ejemplo","minEventAt":"2026-07-31T12:00:00.000Z","maxEventAt":"2026-07-31T12:00:00.000Z","files":[{"objectManifestId":"00000000-0000-4000-8000-000000000001","fileFormat":"parquet","rowCount":"valor-ejemplo","sizeBytes":"valor-ejemplo","contentHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","minMaxStatisticsJson":{}}],"sourcePartitionIds":["00000000-0000-4000-8000-000000000001"]}]` |
| `partitions[].partitionSpecHash` | Sí | `string` | longitud máxima 200 | Huella de los valores de partición | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `partitions[].partitionValuesJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `partitions[].recordCount` | Sí | `string` | Sin restricción adicional declarada | Registros de la partición; cadena por ser bigint | `valor-ejemplo` |
| `partitions[].sizeBytes` | Sí | `string` | Sin restricción adicional declarada | Tamaño en bytes; cadena por ser bigint | `valor-ejemplo` |
| `partitions[].minEventAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `partitions[].maxEventAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `partitions[].files` | Sí | `array<MaterializedFileDto>` | mínimo 1 elemento(s); máximo 1000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"objectManifestId":"00000000-0000-4000-8000-000000000001","fileFormat":"parquet","rowCount":"valor-ejemplo","sizeBytes":"valor-ejemplo","contentHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","minMaxStatisticsJson":{}}]` |
| `partitions[].files[].objectManifestId` | No | `string` | formato `uuid` | Manifiesto del objeto en el almacén | `00000000-0000-4000-8000-000000000001` |
| `partitions[].files[].fileFormat` | Sí | `string` | valores: `parquet`, `delta`, `iceberg`, `avro`, `orc` | Sin descripción específica en el contrato OpenAPI. | `parquet` |
| `partitions[].files[].rowCount` | Sí | `string` | Sin restricción adicional declarada | Filas del archivo; cadena por ser bigint | `valor-ejemplo` |
| `partitions[].files[].sizeBytes` | Sí | `string` | Sin restricción adicional declarada | Tamaño en bytes; cadena por ser bigint | `valor-ejemplo` |
| `partitions[].files[].contentHash` | Sí | `string` | longitud máxima 200 | Hash del contenido; el archivo es inmutable | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `partitions[].files[].minMaxStatisticsJson` | No | `object` | Sin restricción adicional declarada | Mínimos y máximos por columna, para poda de particiones | `{}` |
| `partitions[].sourcePartitionIds` | No | `array<string>` | formato `uuid` | Particiones fuente de las que sale ésta; alimentan el linaje | `["00000000-0000-4000-8000-000000000001"]` |
| `failed` | No | `boolean` | Sin restricción adicional declarada | Cierra la corrida como fallida | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /lakehouse/transformations/00000000-0000-4000-8000-000000000001/runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<TransformationRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TransformationRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TransformationRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TransformationRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TransformationRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TransformationRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TransformationRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TransformationRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TransformationRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TransformationRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TransformationRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "partitionsCommitted": 1,
  "partitionsSkipped": 1,
  "filesWritten": 1,
  "lineageEdges": 1,
  "alreadyRunning": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `partitionsCommitted` | Sí | `number` | Sin restricción adicional declarada | Particiones nuevas materializadas | `1` |
| `partitionsSkipped` | Sí | `number` | Sin restricción adicional declarada | Particiones que ya existían con la misma huella | `1` |
| `filesWritten` | Sí | `number` | Sin restricción adicional declarada | Archivos nuevos registrados | `1` |
| `lineageEdges` | Sí | `number` | Sin restricción adicional declarada | Aristas de linaje registradas (UC-63-06) | `1` |
| `alreadyRunning` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si ya había una corrida viva sobre el mismo objetivo | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, TRANSFORMATION_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Definición de transformación no encontrada. | Excepción explícita en src/modules/lakehouse/services/transformation.service.ts |
| 404 | `NOT_FOUND` | Dataset objetivo no encontrado. | Excepción explícita en src/modules/lakehouse/services/transformation.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La definición de transformación no está activa. | Excepción explícita en src/modules/lakehouse/services/transformation.service.ts |
| 422 | `PRECONDITION_FAILED` | El dataset objetivo no está activo; no admite escrituras. | Excepción explícita en src/modules/lakehouse/services/transformation.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/lakehouse/transformations/{defId}/runs"
}
```

---

## 7. POST /lakehouse/zones

- **Módulo:** `lakehouse`
- **Etiqueta OpenAPI:** `lakehouse`
- **Nombre:** Definir una zona del data lake
- **Operation ID:** `LakehouseController_defineZone`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [LakehouseController.defineZone](../../src/modules/lakehouse/controllers/lakehouse.controller.ts)

### Descripción de negocio

La zona no es una etiqueta descriptiva: `curated` sólo admite dato de-identificado.


### Descripción del sistema

NestJS resuelve `POST /lakehouse/zones` en `LakehouseController_defineZone`. El controlador delega en `LakehouseCatalogService.defineZone`. Valida el body como `DefineZoneDto` y consume `application/json`. El tipo de retorno estático es `Promise<ZoneResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineZoneDto`; los campos opcionales se omiten.

```http
POST /lakehouse/zones HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "zoneType": "raw"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_PLATFORM_ENGINEER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `zoneType` | Sí | `string` | valores: `raw`, `standardized`, `curated`, `research` | Sin descripción específica en el contrato OpenAPI. | `raw` |
| `namespaceId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `encryptionProfileCode` | No | `string` | longitud máxima 100 | Perfil de cifrado en reposo | `CODIGO_EJEMPLO` |
| `retentionPolicyCode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /lakehouse/zones HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "zoneType": "raw",
  "namespaceId": "00000000-0000-4000-8000-000000000001",
  "encryptionProfileCode": "CODIGO_EJEMPLO",
  "retentionPolicyCode": "CODIGO_EJEMPLO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ZoneResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ZoneResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ZoneResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ZoneResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ZoneResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ZoneResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ZoneResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ZoneResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ZoneResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ZoneResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "zoneType": "valor-ejemplo",
  "state": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `zoneType` | Sí | `string` | Sin restricción adicional declarada | Valor de zone type mantenido por la instancia. | `valor-ejemplo` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_PLATFORM_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una zona con ese código. | Excepción explícita en src/modules/lakehouse/services/lakehouse-catalog.service.ts |
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
  "path": "/lakehouse/zones"
}
```

---

## 8. POST /research/dataset-releases

- **Módulo:** `lakehouse`
- **Etiqueta OpenAPI:** `lakehouse`
- **Nombre:** Solicitar el release de un dataset para investigación
- **Operation ID:** `ResearchController_requestRelease`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ResearchController.requestRelease](../../src/modules/lakehouse/controllers/research.controller.ts)

### Descripción de negocio

Se comprueba la ventana ética al solicitar; un producto con PHI exige que la cohorte declare perfil de de-identificación.


### Descripción del sistema

NestJS resuelve `POST /research/dataset-releases` en `ResearchController_requestRelease`. El controlador delega en `ResearchReleaseService.requestRelease`. Valida el body como `RequestDatasetReleaseDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReleaseRequestResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RequestDatasetReleaseDto`; los campos opcionales se omiten.

```http
POST /research/dataset-releases HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "researchProjectId": "00000000-0000-4000-8000-000000000001",
  "dataProductVersionId": "00000000-0000-4000-8000-000000000001",
  "cohortDefinitionId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUseCode": "CODIGO_EJEMPLO"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRINCIPAL_INVESTIGATOR`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `researchProjectId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `dataProductVersionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cohortDefinitionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `purposeOfUseCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /research/dataset-releases HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "researchProjectId": "00000000-0000-4000-8000-000000000001",
  "dataProductVersionId": "00000000-0000-4000-8000-000000000001",
  "cohortDefinitionId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUseCode": "CODIGO_EJEMPLO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReleaseRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReleaseRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReleaseRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReleaseRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReleaseRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReleaseRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReleaseRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReleaseRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReleaseRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReleaseRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "requestedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `requestedAt` | Sí | `string` | formato `date-time` | Valor de requested at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRINCIPAL_INVESTIGATOR, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proyecto de investigación no encontrado. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 404 | `NOT_FOUND` | La cohorte no pertenece a ese proyecto. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 404 | `NOT_FOUND` | Versión de producto no encontrada. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El proyecto no está aprobado. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana de aprobación ética del proyecto no está vigente. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 422 | `PRECONDITION_FAILED` | La cohorte no está activa. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 422 | `PRECONDITION_FAILED` | El producto contiene datos de paciente y la cohorte no declara perfil de de-identificación. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/research/dataset-releases"
}
```

---

## 9. POST /research/dataset-releases/{id}/approve

- **Módulo:** `lakehouse`
- **Etiqueta OpenAPI:** `lakehouse`
- **Nombre:** Aprobar y materializar el manifiesto de-identificado
- **Operation ID:** `ResearchController_approveRelease`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ResearchController.approveRelease](../../src/modules/lakehouse/controllers/research.controller.ts)

### Descripción de negocio

Corrida de de-identificación, manifiesto y cambio de estado en la misma transacción. El acceso caduca, y nunca sobrevive a la aprobación ética.


### Descripción del sistema

NestJS resuelve `POST /research/dataset-releases/{id}/approve` en `ResearchController_approveRelease`. El controlador delega en `ResearchReleaseService.approveRelease`. Valida el body como `ApproveDatasetReleaseDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReleaseManifestResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ApproveDatasetReleaseDto`; los campos opcionales se omiten.

```http
POST /research/dataset-releases/00000000-0000-4000-8000-000000000001/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeConceptId": "00000000-0000-4000-8000-000000000001",
  "recordCount": "valor-ejemplo",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `RESEARCH_GOVERNANCE`, `DPO`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `purposeConceptId` | Sí | `string` | formato `uuid` | Propósito con el que corre la de-identificación | `00000000-0000-4000-8000-000000000001` |
| `recordCount` | Sí | `string` | Sin restricción adicional declarada | Registros del manifiesto; cadena por ser bigint | `valor-ejemplo` |
| `contentHash` | Sí | `string` | longitud máxima 200 | Hash del contenido materializado | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `objectManifestId` | No | `string` | formato `uuid` | Manifiesto del objeto de-identificado | `00000000-0000-4000-8000-000000000001` |
| `schemaVersion` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `ttlDays` | No | `number` | mínimo 1; máximo 3650 | Días de vigencia del acceso; por omisión, 90 | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /research/dataset-releases/00000000-0000-4000-8000-000000000001/approve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeConceptId": "00000000-0000-4000-8000-000000000001",
  "recordCount": "valor-ejemplo",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "objectManifestId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo",
  "ttlDays": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReleaseManifestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReleaseManifestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReleaseManifestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReleaseManifestResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReleaseManifestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReleaseManifestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReleaseManifestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReleaseManifestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReleaseManifestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReleaseManifestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReleaseManifestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "datasetReleaseRequestId": "00000000-0000-4000-8000-000000000001",
  "id": "00000000-0000-4000-8000-000000000001",
  "deidentificationRunId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "expiresAt": "2026-07-31T12:00:00.000Z",
  "alreadyReleased": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `datasetReleaseRequestId` | Sí | `string` | formato `uuid` | Identificador asociado a dataset release request. | `00000000-0000-4000-8000-000000000001` |
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `deidentificationRunId` | Sí | `string` | formato `uuid` | Identificador asociado a deidentification run. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `expiresAt` | Sí | `string` | formato `date-time` | Valor de expires at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `alreadyReleased` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si el release ya estaba materializado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: RESEARCH_GOVERNANCE, DPO, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud de release no encontrada. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 404 | `NOT_FOUND` | Proyecto de investigación no encontrado. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La solicitud no está en un estado que admita aprobación. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 422 | `PRECONDITION_FAILED` | La aprobación ética del proyecto caducó; el release no puede materializarse. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 422 | `PRECONDITION_FAILED` | La cohorte no declara perfil de de-identificación. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/research/dataset-releases/{id}/approve"
}
```

---

## 10. POST /research/dataset-releases/{id}/revoke

- **Módulo:** `lakehouse`
- **Etiqueta OpenAPI:** `lakehouse`
- **Nombre:** Expirar o revocar el release
- **Operation ID:** `ResearchController_revokeRelease`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ResearchController.revokeRelease](../../src/modules/lakehouse/controllers/research.controller.ts)

### Descripción de negocio

Los dos cierres se distinguen: uno es el fin del plazo y el otro una decisión.


### Descripción del sistema

NestJS resuelve `POST /research/dataset-releases/{id}/revoke` en `ResearchController_revokeRelease`. El controlador delega en `ResearchReleaseService.revokeRelease`. Valida el body como `RevokeDatasetReleaseDto` y consume `application/json`. El tipo de retorno estático es `Promise<RevokeReleaseResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RevokeDatasetReleaseDto`; los campos opcionales se omiten.

```http
POST /research/dataset-releases/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `RESEARCH_GOVERNANCE`, `DPO`, `SYSTEM`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expired` | No | `boolean` | Sin restricción adicional declarada | Cierra por vencimiento del plazo en vez de por decisión de gobernanza | `false` |
| `reason` | No | `string` | longitud máxima 1000 | Motivo; queda en el evento publicado | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /research/dataset-releases/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expired": false,
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RevokeReleaseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RevokeReleaseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RevokeReleaseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RevokeReleaseResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RevokeReleaseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RevokeReleaseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RevokeReleaseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RevokeReleaseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RevokeReleaseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RevokeReleaseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RevokeReleaseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "alreadyClosed": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `alreadyClosed` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si el release ya estaba cerrado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: RESEARCH_GOVERNANCE, DPO, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud de release no encontrada. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
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
  "path": "/research/dataset-releases/{id}/revoke"
}
```

---

## 11. GET /research/dataset-releases/expired

- **Módulo:** `lakehouse`
- **Etiqueta OpenAPI:** `lakehouse`
- **Nombre:** Listar releases con manifiesto vencido sin cerrar
- **Operation ID:** `ResearchController_listExpiredReleases`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ResearchController.listExpiredReleases](../../src/modules/lakehouse/controllers/research.controller.ts)

### Descripción de negocio

Listar releases con manifiesto vencido sin cerrar. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Descubrimiento del worker de revocación: `revoke` exige un `requestId` puntual y no había forma de listar qué releases vencidos cerrar.

### Descripción del sistema

NestJS resuelve `GET /research/dataset-releases/expired` en `ResearchController_listExpiredReleases`. El controlador delega en `ResearchReleaseService.listExpiredReleases`. No recibe body. El tipo de retorno estático es `Promise<PendingExpiredReleasesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /research/dataset-releases/expired?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `RESEARCH_GOVERNANCE`, `DPO`, `SYSTEM`, `PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /research/dataset-releases/expired?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PendingExpiredReleasesResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PendingExpiredReleasesResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PendingExpiredReleasesResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PendingExpiredReleasesResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PendingExpiredReleasesResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PendingExpiredReleasesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PendingExpiredReleasesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "releases": [
    {
      "requestId": "00000000-0000-4000-8000-000000000001",
      "expiresAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `releases` | Sí | `array<ExpiredReleaseSummaryDto>` | Sin restricción adicional declarada | Valor de releases mantenido por la instancia. | `[{"requestId":"00000000-0000-4000-8000-000000000001","expiresAt":"2026-07-31T12:00:00.000Z"}]` |
| `releases[].requestId` | Sí | `string` | formato `uuid` | Identificador asociado a request. | `00000000-0000-4000-8000-000000000001` |
| `releases[].expiresAt` | Sí | `string` | formato `date-time` | Fecha y hora en que venció el manifiesto. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: RESEARCH_GOVERNANCE, DPO, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/research/dataset-releases/expired"
}
```

---

## 12. POST /research/projects/{id}/cohorts

- **Módulo:** `lakehouse`
- **Etiqueta OpenAPI:** `lakehouse`
- **Nombre:** Definir el proyecto de investigación y su cohorte
- **Operation ID:** `ResearchController_defineCohort`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ResearchController.defineCohort](../../src/modules/lakehouse/controllers/research.controller.ts)

### Descripción de negocio

Upsert del proyecto y alta de la cohorte; la ventana de aprobación ética tiene que estar vigente.


### Descripción del sistema

NestJS resuelve `POST /research/projects/{id}/cohorts` en `ResearchController_defineCohort`. El controlador delega en `ResearchReleaseService.defineCohort`. Valida el body como `DefineCohortDto` y consume `application/json`. El tipo de retorno estático es `Promise<CohortResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineCohortDto`; los campos opcionales se omiten.

```http
POST /research/projects/00000000-0000-4000-8000-000000000001/cohorts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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
  "deidentificationProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRINCIPAL_INVESTIGATOR`, `RESEARCH_GOVERNANCE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `projectCode` | Sí | `string` | longitud máxima 100 | Código del proyecto; su clave natural con el tenant | `CODIGO_EJEMPLO` |
| `title` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `protocolReference` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `principalInvestigatorId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ethicsApprovalReference` | Sí | `string` | longitud máxima 200 | Referencia de la aprobación ética | `valor-ejemplo` |
| `approvedFrom` | Sí | `string` | formato `date-time` | Inicio de la ventana ética | `2026-07-31T12:00:00.000Z` |
| `approvedTo` | Sí | `string` | formato `date-time` | Fin de la ventana ética | `2026-07-31T12:00:00.000Z` |
| `cohortCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `cohortVersion` | Sí | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `inclusionExpression` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `exclusionExpression` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `deidentificationProfileId` | Sí | `string` | formato `uuid` | Perfil de de-identificación con el que se materializará el release | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /research/projects/00000000-0000-4000-8000-000000000001/cohorts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CohortResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CohortResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CohortResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "researchProjectId": "00000000-0000-4000-8000-000000000001",
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "version": "valor-ejemplo",
  "state": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `researchProjectId` | Sí | `string` | formato `uuid` | Identificador asociado a research project. | `00000000-0000-4000-8000-000000000001` |
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `version` | Sí | `string` | Sin restricción adicional declarada | Valor de version mantenido por la instancia. | `valor-ejemplo` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRINCIPAL_INVESTIGATOR, RESEARCH_GOVERNANCE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un proyecto con ese código para el tenant, con otro identificador. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 409 | `CONFLICT` | El proyecto existente tiene otro código o pertenece a otro tenant. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 409 | `CONFLICT` | Esa versión de la cohorte ya está definida. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ventana de aprobación ética tiene que empezar antes de terminar. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 422 | `PRECONDITION_FAILED` | La aprobación ética ya está caducada. | Excepción explícita en src/modules/lakehouse/services/research-release.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/research/projects/{id}/cohorts"
}
```

---

