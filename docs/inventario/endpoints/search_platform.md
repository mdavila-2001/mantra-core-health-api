<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `search_platform`

- **Bloque:** —
- **Operaciones:** 4 (3 en el contrato, 1 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 0 · BAJO 4
- **Tablas distintas que tocan:** 0
- **Respuestas de error y detalle contractual:** `openapi/endpoints/search-platform.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | DESCONOCIDO | `/search` | Exige tenant de contexto (fail-closed). | BAJO | 0 | sesión (sin roles) |
| 2 | POST | `/search/{index}/_search` | Buscar documentos | BAJO | 0 | PLATFORM_ADMIN, SEARCH_ADMIN, SEARCH_READER, SYSTEM |
| 3 | POST | `/search/{index}/documents` | Indexar un documento | BAJO | 0 | PLATFORM_ADMIN, SEARCH_ADMIN, SYSTEM |
| 4 | DELETE | `/search/{index}/documents/{id}` | Eliminar un documento | BAJO | 0 | PLATFORM_ADMIN, SEARCH_ADMIN, SYSTEM |

---

## 1. DESCONOCIDO /search

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Exige tenant de contexto (fail-closed).
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SearchPlatformController.requireTenant` — `src/modules/search_platform/controllers/search-platform.controller.ts:102`

### Qué es y para qué sirve (negocio)

Exige tenant de contexto (fail-closed).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`DESCONOCIDO /search` la atiende `SearchPlatformController.requireTenant` (src/modules/search_platform/controllers/search-platform.controller.ts:102). Exige sesión; el controlador no declara roles. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/search_platform/controllers/search-platform.controller.ts:102` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/search_platform/controllers/search-platform.controller.ts:102`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `string`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 2. POST /search/{index}/_search

- **Origen:** CONTRATO
- **Nombre:** Buscar documentos
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SearchPlatformController.search` — `src/modules/search_platform/controllers/search-platform.controller.ts:63`

### Qué es y para qué sirve (negocio)

Buscar documentos.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /search/{index}/_search` la atiende `SearchPlatformController.search` (src/modules/search_platform/controllers/search-platform.controller.ts:63). Exige sesión con alguno de los roles PLATFORM_ADMIN, SEARCH_ADMIN, SEARCH_READER, SYSTEM. Valida el cuerpo como `SearchRequestDto` (7 campos, 0 obligatorios). Delega en `SearchIndexService.search`. No toca tablas relacionales: opera sobre OpenSearch, no sobre tablas relacionales.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SEARCH_ADMIN, SEARCH_READER, SYSTEM | `src/modules/search_platform/controllers/search-platform.controller.ts:63` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

No toca tablas relacionales: opera sobre OpenSearch, no sobre tablas relacionales. _(automática; fuente: `docs/reports/system-inventory.md §2`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `index` | path | Sí | `string` | — |

### Cuerpo — DTO `SearchRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `query` | `string` | No | longitud máxima 512 | `@IsOptional()` `@IsString()` `@MaxLength(512)` | Texto a buscar en los campos full-text del índice. | `src/modules/search_platform/dto/search-platform.dto.ts:95` |
| `filters` | `array<SearchFilterDto>` | No | máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(20)` `@ValidateNested({ each: true })` `@Type(() => SearchFilterDto)` | — | `src/modules/search_platform/dto/search-platform.dto.ts:106` |
| `filters[].field` | `string` | No | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Campo permitido del índice. | `src/modules/search_platform/dto/search-platform.dto.ts:60` |
| `filters[].values` | `array<string>` | No | longitud máxima 256; mínimo 1 elemento(s); máximo 50 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ArrayMaxSize(50)` `@IsString({ each: true })` `@MaxLength(256, { each: true })` | Valores admitidos (OR); se traduce a un `terms` acotado. | `src/modules/search_platform/dto/search-platform.dto.ts:74` |
| `facets` | `array<string>` | No | longitud máxima 100; máximo 10 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(10)` `@IsString({ each: true })` `@MaxLength(100, { each: true })` | Campos a agregar como faceta (allowlist del índice). | `src/modules/search_platform/dto/search-platform.dto.ts:120` |
| `from` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/search_platform/dto/search-platform.dto.ts:129` |
| `size` | `number` | No | mínimo 1; máximo 100 | `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(MAX_SEARCH_SIZE)` | — | `src/modules/search_platform/dto/search-platform.dto.ts:143` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "query": "valor-ejemplo",
  "filters": [
    {
      "field": "valor-ejemplo",
      "values": [
        "valor-ejemplo"
      ]
    }
  ],
  "facets": [
    "valor-ejemplo"
  ],
  "from": 0,
  "size": 20
}
```

</details>

### Respuesta — `Promise<SearchResponseDto>` · DTO `SearchResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `total` | `number` | Sí | — | — | Valor de total mantenido por la instancia. | `src/modules/search_platform/dto/search-platform.dto.ts:221` |
| `hits` | `array<SearchHitDto>` | Sí | — | — | Valor de hits mantenido por la instancia. | `src/modules/search_platform/dto/search-platform.dto.ts:227` |
| `hits[].id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/search_platform/dto/search-platform.dto.ts:181` |
| `hits[].score` | `number` | Sí | admite null | — | Valor de score mantenido por la instancia. | `src/modules/search_platform/dto/search-platform.dto.ts:187` |
| `hits[].source` | `object` | Sí | — | — | Valor de source mantenido por la instancia. | `src/modules/search_platform/dto/search-platform.dto.ts:193` |
| `facets` | `object` | Sí | — | — | Facetas por campo: `{ campo: [{ key, count }] }`. | `src/modules/search_platform/dto/search-platform.dto.ts:237` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/search-platform.int-spec.ts:56` |

### Flujos

_Se completa en la fase de flujos._

---

## 3. POST /search/{index}/documents

- **Origen:** CONTRATO
- **Nombre:** Indexar un documento
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SearchPlatformController.indexDocument` — `src/modules/search_platform/controllers/search-platform.controller.ts:40`

### Qué es y para qué sirve (negocio)

Indexar un documento.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /search/{index}/documents` la atiende `SearchPlatformController.indexDocument` (src/modules/search_platform/controllers/search-platform.controller.ts:40). Exige sesión con alguno de los roles PLATFORM_ADMIN, SEARCH_ADMIN, SYSTEM. Valida el cuerpo como `IndexDocumentDto` (2 campos, 2 obligatorios). Delega en `SearchIndexService.indexDocument`. No toca tablas relacionales: opera sobre OpenSearch, no sobre tablas relacionales.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SEARCH_ADMIN, SYSTEM | `src/modules/search_platform/controllers/search-platform.controller.ts:40` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

No toca tablas relacionales: opera sobre OpenSearch, no sobre tablas relacionales. _(automática; fuente: `docs/reports/system-inventory.md §2`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `index` | path | Sí | `string` | — |

### Cuerpo — DTO `IndexDocumentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | longitud máxima 256 | `@IsString()` `@MaxLength(256)` | Identificador del documento en el índice (idempotente). | `src/modules/search_platform/dto/search-platform.dto.ts:34` |
| `document` | `object` | Sí | — | `@IsObject()` | Documento de negocio. El servicio sobrescribe `tenantId` con el del contexto. | `src/modules/search_platform/dto/search-platform.dto.ts:46` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "document": {
    "clave": "valor"
  }
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "document": {
    "clave": "valor"
  }
}
```

</details>

### Respuesta — `Promise<IndexDocumentResponseDto>` · DTO `IndexDocumentResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `index` | `string` | Sí | — | — | Valor de index mantenido por la instancia. | `src/modules/search_platform/dto/search-platform.dto.ts:156` |
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/search_platform/dto/search-platform.dto.ts:162` |
| `result` | `string` | Sí | — | — | Resultado de OpenSearch: `created` o `updated`. | `src/modules/search_platform/dto/search-platform.dto.ts:170` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/search-platform.int-spec.ts:33` |

### Flujos

_Se completa en la fase de flujos._

---

## 4. DELETE /search/{index}/documents/{id}

- **Origen:** CONTRATO
- **Nombre:** Eliminar un documento
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SearchPlatformController.deleteDocument` — `src/modules/search_platform/controllers/search-platform.controller.ts:88`

### Qué es y para qué sirve (negocio)

Eliminar un documento.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`DELETE /search/{index}/documents/{id}` la atiende `SearchPlatformController.deleteDocument` (src/modules/search_platform/controllers/search-platform.controller.ts:88). Exige sesión con alguno de los roles PLATFORM_ADMIN, SEARCH_ADMIN, SYSTEM. Delega en `SearchIndexService.deleteDocument`. No toca tablas relacionales: opera sobre OpenSearch, no sobre tablas relacionales.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PLATFORM_ADMIN, SEARCH_ADMIN, SYSTEM | `src/modules/search_platform/controllers/search-platform.controller.ts:88` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

No toca tablas relacionales: opera sobre OpenSearch, no sobre tablas relacionales. _(automática; fuente: `docs/reports/system-inventory.md §2`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `index` | path | Sí | `string` | — |
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DeleteDocumentResponseDto>` · DTO `DeleteDocumentResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `index` | `string` | Sí | — | — | Valor de index mantenido por la instancia. | `src/modules/search_platform/dto/search-platform.dto.ts:248` |
| `id` | `string` | Sí | — | — | Identificador único de la instancia. | `src/modules/search_platform/dto/search-platform.dto.ts:254` |
| `deleted` | `boolean` | Sí | — | — | Valor de deleted mantenido por la instancia. | `src/modules/search_platform/dto/search-platform.dto.ts:260` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/search-platform.int-spec.ts:153` |

### Flujos

_Se completa en la fase de flujos._

---

