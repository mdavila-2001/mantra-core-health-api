<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `search_platform`

Referencia exhaustiva de 3 operación(es) del módulo `search_platform`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `search_platform`
- **Controladores:** `SearchPlatformController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /search/{index}/_search](#1-post-search-index-search) — Buscar documentos
2. [POST /search/{index}/documents](#2-post-search-index-documents) — Indexar un documento
3. [DELETE /search/{index}/documents/{id}](#3-delete-search-index-documents-id) — Eliminar un documento

---

## 1. POST /search/{index}/_search

- **Módulo:** `search_platform`
- **Etiqueta OpenAPI:** `search_platform`
- **Nombre:** Buscar documentos
- **Operation ID:** `SearchPlatformController_search`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SearchPlatformController.search](../../src/modules/search_platform/controllers/search-platform.controller.ts)

### Descripción de negocio

Búsqueda tipada: texto + filtros/facetas declarados. Se inyecta siempre el filtro de tenant.

Contexto declarado en el controlador: Busca en el índice; devuelve aciertos y facetas (con allowlist de campos).

### Descripción del sistema

NestJS resuelve `POST /search/{index}/_search` en `SearchPlatformController_search`. El controlador delega en `SearchIndexService.search`. Valida el body como `SearchRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<SearchResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `index` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SearchRequestDto`; los campos opcionales se omiten.

```http
POST /search/valor-ejemplo/_search HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SEARCH_ADMIN`, `SEARCH_READER`, `SYSTEM`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `query` | No | `string` | longitud máxima 512 | Texto a buscar en los campos full-text del índice. | `valor-ejemplo` |
| `filters` | No | `array<SearchFilterDto>` | máximo 20 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"field":"valor-ejemplo","values":["valor-ejemplo"]}]` |
| `filters[].field` | No | `string` | longitud máxima 100 | Campo permitido del índice. | `valor-ejemplo` |
| `filters[].values` | No | `array<string>` | longitud máxima 256; mínimo 1 elemento(s); máximo 50 elemento(s) | Valores admitidos (OR); se traduce a un `terms` acotado. | `["valor-ejemplo"]` |
| `facets` | No | `array<string>` | longitud máxima 100; máximo 10 elemento(s) | Campos a agregar como faceta (allowlist del índice). | `["valor-ejemplo"]` |
| `from` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `0` |
| `size` | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en el contrato OpenAPI. | `20` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /search/valor-ejemplo/_search HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SearchResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SearchResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SearchResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SearchResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SearchResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SearchResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SearchResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SearchResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SearchResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SearchResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SearchResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "total": 1,
  "hits": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "score": 1,
      "source": {
        "clave": "valor"
      }
    }
  ],
  "facets": {
    "clave": "valor"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `total` | Sí | `number` | Sin restricción adicional declarada | Valor de total mantenido por la instancia. | `1` |
| `hits` | Sí | `array<SearchHitDto>` | Sin restricción adicional declarada | Valor de hits mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","score":1,"source":{"clave":"valor"}}]` |
| `hits[].id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `hits[].score` | Sí | `number` | admite null | Valor de score mantenido por la instancia. | `1` |
| `hits[].source` | Sí | `object` | Sin restricción adicional declarada | Valor de source mantenido por la instancia. | `{"clave":"valor"}` |
| `facets` | Sí | `object` | Sin restricción adicional declarada | Facetas por campo: `{ campo: [{ key, count }] }`. | `{"clave":"valor"}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SEARCH_ADMIN, SEARCH_READER, SYSTEM. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Índice de búsqueda no reconocido | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Falta el tenant de contexto para la operación de búsqueda | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Campo de ${kind} no permitido para el índice | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/search/{index}/_search"
}
```

---

## 2. POST /search/{index}/documents

- **Módulo:** `search_platform`
- **Etiqueta OpenAPI:** `search_platform`
- **Nombre:** Indexar un documento
- **Operation ID:** `SearchPlatformController_indexDocument`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SearchPlatformController.indexDocument](../../src/modules/search_platform/controllers/search-platform.controller.ts)

### Descripción de negocio

El servidor sella el documento con el `tenantId` del contexto; el del cuerpo se ignora.

Contexto declarado en el controlador: Indexa (upsert) un documento en el índice indicado.

### Descripción del sistema

NestJS resuelve `POST /search/{index}/documents` en `SearchPlatformController_indexDocument`. El controlador delega en `SearchIndexService.indexDocument`. Valida el body como `IndexDocumentDto` y consume `application/json`. El tipo de retorno estático es `Promise<IndexDocumentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `index` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IndexDocumentDto`; los campos opcionales se omiten.

```http
POST /search/valor-ejemplo/documents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "id": "00000000-0000-4000-8000-000000000001",
  "document": {
    "clave": "valor"
  }
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SEARCH_ADMIN`, `SYSTEM`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | longitud máxima 256 | Identificador del documento en el índice (idempotente). | `00000000-0000-4000-8000-000000000001` |
| `document` | Sí | `object` | Sin restricción adicional declarada | Documento de negocio. El servicio sobrescribe `tenantId` con el del contexto. | `{"clave":"valor"}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /search/valor-ejemplo/documents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "id": "00000000-0000-4000-8000-000000000001",
  "document": {
    "clave": "valor"
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<IndexDocumentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IndexDocumentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IndexDocumentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IndexDocumentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IndexDocumentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IndexDocumentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IndexDocumentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IndexDocumentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IndexDocumentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IndexDocumentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IndexDocumentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "index": "valor-ejemplo",
  "id": "00000000-0000-4000-8000-000000000001",
  "result": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `index` | Sí | `string` | Sin restricción adicional declarada | Valor de index mantenido por la instancia. | `valor-ejemplo` |
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `result` | Sí | `string` | Sin restricción adicional declarada | Resultado de OpenSearch: `created` o `updated`. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SEARCH_ADMIN, SYSTEM. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Índice de búsqueda no reconocido | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Falta el tenant de contexto para la operación de búsqueda | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/search/{index}/documents"
}
```

---

## 3. DELETE /search/{index}/documents/{id}

- **Módulo:** `search_platform`
- **Etiqueta OpenAPI:** `search_platform`
- **Nombre:** Eliminar un documento
- **Operation ID:** `SearchPlatformController_deleteDocument`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SearchPlatformController.deleteDocument](../../src/modules/search_platform/controllers/search-platform.controller.ts)

### Descripción de negocio

Eliminar un documento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Elimina un documento por id dentro del índice.

### Descripción del sistema

NestJS resuelve `DELETE /search/{index}/documents/{id}` en `SearchPlatformController_deleteDocument`. El controlador delega en `SearchIndexService.deleteDocument`. No recibe body. El tipo de retorno estático es `Promise<DeleteDocumentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `index` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /search/valor-ejemplo/documents/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SEARCH_ADMIN`, `SYSTEM`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /search/valor-ejemplo/documents/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DeleteDocumentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeleteDocumentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeleteDocumentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeleteDocumentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DeleteDocumentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeleteDocumentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeleteDocumentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeleteDocumentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeleteDocumentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeleteDocumentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "index": "valor-ejemplo",
  "id": "00000000-0000-4000-8000-000000000001",
  "deleted": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `index` | Sí | `string` | Sin restricción adicional declarada | Valor de index mantenido por la instancia. | `valor-ejemplo` |
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `deleted` | Sí | `boolean` | Sin restricción adicional declarada | Valor de deleted mantenido por la instancia. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SEARCH_ADMIN, SYSTEM. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Índice de búsqueda no reconocido | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Falta el tenant de contexto para la operación de búsqueda | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/search/{index}/documents/{id}"
}
```

---

