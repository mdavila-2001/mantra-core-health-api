<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `document_store`

Referencia exhaustiva de 5 operación(es) del módulo `document_store`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `document-store`
- **Controladores:** `DocumentStoreController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /document-store/collections/{collection}/documents](#1-get-document-store-collections-collection-documents) — Listar documentos del tenant (paginado)
2. [POST /document-store/collections/{collection}/documents](#2-post-document-store-collections-collection-documents) — Crear un documento flexible en la colección
3. [DELETE /document-store/collections/{collection}/documents/{id}](#3-delete-document-store-collections-collection-documents-id) — Borrado lógico de un documento (soft-delete)
4. [GET /document-store/collections/{collection}/documents/{id}](#4-get-document-store-collections-collection-documents-id) — Leer un documento por id (acotado por tenant)
5. [PATCH /document-store/collections/{collection}/documents/{id}](#5-patch-document-store-collections-collection-documents-id) — Actualizar un documento con concurrencia optimista

---

## 1. GET /document-store/collections/{collection}/documents

- **Módulo:** `document_store`
- **Etiqueta OpenAPI:** `document-store`
- **Nombre:** Listar documentos del tenant (paginado)
- **Operation ID:** `DocumentStoreController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DocumentStoreController.list](../../src/modules/document_store/controllers/document-store.controller.ts)

### Descripción de negocio

Listar documentos del tenant (paginado). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Obtiene list.

### Descripción del sistema

NestJS resuelve `GET /document-store/collections/{collection}/documents` en `DocumentStoreController_list`. El controlador delega en `DocumentStoreService.list`. No recibe body. El tipo de retorno estático es `Promise<PageResponseDto<DocumentResponseDto>>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `collection` | path | Sí | `string` | Sin restricción adicional declarada | Colección lógica de documentos | `valor-ejemplo` |
| `page` | query | No | `number` | mínimo 1 | Página (1-based) | `1` |
| `pageSize` | query | No | `number` | mínimo 1; máximo 100 | Tamaño de página | `20` |
| `order` | query | No | `string` | valores: `ASC`, `DESC` | Sin descripción específica en OpenAPI. | `DESC` |
| `sortBy` | query | No | `string` | Sin restricción adicional declarada | Campo de ordenamiento | `createdAt` |
| `tenantId` | query | Sí | `string` | formato `uuid` | Tenant cuyos documentos se listan | `00000000-0000-4000-8000-000000000001` |
| `documentType` | query | No | `string` | Sin restricción adicional declarada | Filtrar por clasificación de documento | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /document-store/collections/valor-ejemplo/documents?tenantId=00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /document-store/collections/valor-ejemplo/documents?page=1&pageSize=20&order=DESC&sortBy=createdAt&tenantId=00000000-0000-4000-8000-000000000001&documentType=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PageResponseDto<DocumentResponseDto>>` | No |
| 400 | Consulta completada correctamente. | `Promise<PageResponseDto<DocumentResponseDto>>` | No |
| 401 | Consulta completada correctamente. | `Promise<PageResponseDto<DocumentResponseDto>>` | No |
| 403 | Consulta completada correctamente. | `Promise<PageResponseDto<DocumentResponseDto>>` | No |
| 404 | Consulta completada correctamente. | `Promise<PageResponseDto<DocumentResponseDto>>` | No |
| 429 | Consulta completada correctamente. | `Promise<PageResponseDto<DocumentResponseDto>>` | No |
| 500 | Consulta completada correctamente. | `Promise<PageResponseDto<DocumentResponseDto>>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PageResponseDto<DocumentResponseDto>`. Ejemplo completo derivado de ese DTO:

```json
{
  "data": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "documentType": "valor-ejemplo",
      "payload": {
        "clave": "valor"
      },
      "version": 1,
      "createdAt": "2026-07-31T12:00:00.000Z",
      "updatedAt": "2026-07-31T12:00:00.000Z",
      "deletedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 1,
    "total": 1,
    "totalPages": 1
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `data` | Sí | `array<DocumentResponseDto>` | Sin restricción adicional declarada | Valor de data mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","tenantId":"00000000-0000-4000-8000-000000000001","documentType":"valor-ejemplo","payload":{"clave":"valor"},"version":1,"createdAt":"2026-07-31T12:00:00.000Z","updatedAt":"2026-07-31T12:00:00.000Z","deletedAt":"2026-07-31T12:00:00.000Z"}]` |
| `data[].id` | Sí | `string` | Sin restricción adicional declarada | Identificador del documento (ObjectId hex) | `00000000-0000-4000-8000-000000000001` |
| `data[].tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `data[].documentType` | Sí | `string` | Sin restricción adicional declarada | Valor de document type mantenido por la instancia. | `valor-ejemplo` |
| `data[].payload` | Sí | `object` | Sin restricción adicional declarada | Valor de payload mantenido por la instancia. | `{"clave":"valor"}` |
| `data[].version` | Sí | `number` | Sin restricción adicional declarada | Versión vigente (concurrencia optimista) | `1` |
| `data[].createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `data[].updatedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la última actualización. | `2026-07-31T12:00:00.000Z` |
| `data[].deletedAt` | No | `string` | formato `date-time`; admite null | Marca de borrado lógico; null si el documento está vivo | `2026-07-31T12:00:00.000Z` |
| `meta` | Sí | `PageMetaDto` | Sin restricción adicional declarada | Valor de meta mantenido por la instancia. | `{"page":1,"pageSize":1,"total":1,"totalPages":1}` |
| `meta.page` | Sí | `number` | Sin restricción adicional declarada | Valor de page mantenido por la instancia. | `1` |
| `meta.pageSize` | Sí | `number` | Sin restricción adicional declarada | Valor de page size mantenido por la instancia. | `1` |
| `meta.total` | Sí | `number` | Sin restricción adicional declarada | Valor de total mantenido por la instancia. | `1` |
| `meta.totalPages` | Sí | `number` | Sin restricción adicional declarada | Valor de total pages mantenido por la instancia. | `1` |

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
  "path": "/document-store/collections/{collection}/documents"
}
```

---

## 2. POST /document-store/collections/{collection}/documents

- **Módulo:** `document_store`
- **Etiqueta OpenAPI:** `document-store`
- **Nombre:** Crear un documento flexible en la colección
- **Operation ID:** `DocumentStoreController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DocumentStoreController.create](../../src/modules/document_store/controllers/document-store.controller.ts)

### Descripción de negocio

Crear un documento flexible en la colección. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create.

### Descripción del sistema

NestJS resuelve `POST /document-store/collections/{collection}/documents` en `DocumentStoreController_create`. El controlador delega en `DocumentStoreService.create`. Valida el body como `CreateFlexibleDocumentDto` y consume `application/json`. El tipo de retorno estático es `Promise<DocumentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `collection` | path | Sí | `string` | Sin restricción adicional declarada | Colección lógica de documentos | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFlexibleDocumentDto`; los campos opcionales se omiten.

```http
POST /document-store/collections/valor-ejemplo/documents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "documentType": "fhir_bundle_raw",
  "payload": {
    "clave": "valor"
  }
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `STORAGE_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Tenant propietario del documento | `00000000-0000-4000-8000-000000000001` |
| `documentType` | Sí | `string` | longitud mínima 1; patrón runtime `DOCUMENT_TYPE_RE` | Tipo/clasificación del documento (p. ej. fhir_bundle_raw) | `fhir_bundle_raw` |
| `payload` | Sí | `object` | Sin restricción adicional declarada | Contenido flexible del documento (JSON/semiestructurado) | `{"clave":"valor"}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /document-store/collections/valor-ejemplo/documents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "documentType": "fhir_bundle_raw",
  "payload": {
    "clave": "valor"
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DocumentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DocumentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "documentType": "valor-ejemplo",
  "payload": {
    "clave": "valor"
  },
  "version": 1,
  "createdAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "deletedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador del documento (ObjectId hex) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `documentType` | Sí | `string` | Sin restricción adicional declarada | Valor de document type mantenido por la instancia. | `valor-ejemplo` |
| `payload` | Sí | `object` | Sin restricción adicional declarada | Valor de payload mantenido por la instancia. | `{"clave":"valor"}` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Versión vigente (concurrencia optimista) | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la última actualización. | `2026-07-31T12:00:00.000Z` |
| `deletedAt` | No | `string` | formato `date-time`; admite null | Marca de borrado lógico; null si el documento está vivo | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: STORAGE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/document-store/collections/{collection}/documents"
}
```

---

## 3. DELETE /document-store/collections/{collection}/documents/{id}

- **Módulo:** `document_store`
- **Etiqueta OpenAPI:** `document-store`
- **Nombre:** Borrado lógico de un documento (soft-delete)
- **Operation ID:** `DocumentStoreController_softDelete`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DocumentStoreController.softDelete](../../src/modules/document_store/controllers/document-store.controller.ts)

### Descripción de negocio

Borrado lógico de un documento (soft-delete). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación soft delete.

### Descripción del sistema

NestJS resuelve `DELETE /document-store/collections/{collection}/documents/{id}` en `DocumentStoreController_softDelete`. El controlador delega en `DocumentStoreService.softDelete`. No recibe body. El tipo de retorno estático es `Promise<DocumentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `collection` | path | Sí | `string` | Sin restricción adicional declarada | Colección lógica de documentos | `valor-ejemplo` |
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | query | Sí | `string` | formato `uuid` | Tenant propietario del documento | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /document-store/collections/valor-ejemplo/documents/00000000-0000-4000-8000-000000000001?tenantId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `STORAGE_ADMIN`, `PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /document-store/collections/valor-ejemplo/documents/00000000-0000-4000-8000-000000000001?tenantId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DocumentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "documentType": "valor-ejemplo",
  "payload": {
    "clave": "valor"
  },
  "version": 1,
  "createdAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "deletedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador del documento (ObjectId hex) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `documentType` | Sí | `string` | Sin restricción adicional declarada | Valor de document type mantenido por la instancia. | `valor-ejemplo` |
| `payload` | Sí | `object` | Sin restricción adicional declarada | Valor de payload mantenido por la instancia. | `{"clave":"valor"}` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Versión vigente (concurrencia optimista) | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la última actualización. | `2026-07-31T12:00:00.000Z` |
| `deletedAt` | No | `string` | formato `date-time`; admite null | Marca de borrado lógico; null si el documento está vivo | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: STORAGE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Documento no encontrado | Excepción explícita en src/modules/document_store/services/document-store.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/document-store/collections/{collection}/documents/{id}"
}
```

---

## 4. GET /document-store/collections/{collection}/documents/{id}

- **Módulo:** `document_store`
- **Etiqueta OpenAPI:** `document-store`
- **Nombre:** Leer un documento por id (acotado por tenant)
- **Operation ID:** `DocumentStoreController_findOne`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DocumentStoreController.findOne](../../src/modules/document_store/controllers/document-store.controller.ts)

### Descripción de negocio

Leer un documento por id (acotado por tenant). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Obtiene find one.

### Descripción del sistema

NestJS resuelve `GET /document-store/collections/{collection}/documents/{id}` en `DocumentStoreController_findOne`. El controlador delega en `DocumentStoreService.findOne`. No recibe body. El tipo de retorno estático es `Promise<DocumentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `collection` | path | Sí | `string` | Sin restricción adicional declarada | Colección lógica de documentos | `valor-ejemplo` |
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | query | Sí | `string` | formato `uuid` | Tenant propietario del documento | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /document-store/collections/valor-ejemplo/documents/00000000-0000-4000-8000-000000000001?tenantId=00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /document-store/collections/valor-ejemplo/documents/00000000-0000-4000-8000-000000000001?tenantId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<DocumentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DocumentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "documentType": "valor-ejemplo",
  "payload": {
    "clave": "valor"
  },
  "version": 1,
  "createdAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "deletedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador del documento (ObjectId hex) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `documentType` | Sí | `string` | Sin restricción adicional declarada | Valor de document type mantenido por la instancia. | `valor-ejemplo` |
| `payload` | Sí | `object` | Sin restricción adicional declarada | Valor de payload mantenido por la instancia. | `{"clave":"valor"}` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Versión vigente (concurrencia optimista) | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la última actualización. | `2026-07-31T12:00:00.000Z` |
| `deletedAt` | No | `string` | formato `date-time`; admite null | Marca de borrado lógico; null si el documento está vivo | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Documento no encontrado | Excepción explícita en src/modules/document_store/services/document-store.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/document-store/collections/{collection}/documents/{id}"
}
```

---

## 5. PATCH /document-store/collections/{collection}/documents/{id}

- **Módulo:** `document_store`
- **Etiqueta OpenAPI:** `document-store`
- **Nombre:** Actualizar un documento con concurrencia optimista
- **Operation ID:** `DocumentStoreController_update`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DocumentStoreController.update](../../src/modules/document_store/controllers/document-store.controller.ts)

### Descripción de negocio

Actualizar un documento con concurrencia optimista. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Actualiza update.

### Descripción del sistema

NestJS resuelve `PATCH /document-store/collections/{collection}/documents/{id}` en `DocumentStoreController_update`. El controlador delega en `DocumentStoreService.update`. Valida el body como `UpdateDocumentDto` y consume `application/json`. El tipo de retorno estático es `Promise<DocumentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `collection` | path | Sí | `string` | Sin restricción adicional declarada | Colección lógica de documentos | `valor-ejemplo` |
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateDocumentDto`; los campos opcionales se omiten.

```http
PATCH /document-store/collections/valor-ejemplo/documents/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "expectedVersion": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `STORAGE_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Tenant propietario del documento | `00000000-0000-4000-8000-000000000001` |
| `expectedVersion` | Sí | `number` | mínimo 1 | Versión que el cliente cree vigente (concurrencia optimista) | `1` |
| `payload` | No | `object` | Sin restricción adicional declarada | Nuevo contenido flexible del documento | `{"clave":"valor"}` |
| `documentType` | No | `string` | patrón runtime `DOCUMENT_TYPE_RE` | Nueva clasificación del documento | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /document-store/collections/valor-ejemplo/documents/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "expectedVersion": 1,
  "payload": {
    "clave": "valor"
  },
  "documentType": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DocumentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DocumentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "documentType": "valor-ejemplo",
  "payload": {
    "clave": "valor"
  },
  "version": 1,
  "createdAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z",
  "deletedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Identificador del documento (ObjectId hex) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `documentType` | Sí | `string` | Sin restricción adicional declarada | Valor de document type mantenido por la instancia. | `valor-ejemplo` |
| `payload` | Sí | `object` | Sin restricción adicional declarada | Valor de payload mantenido por la instancia. | `{"clave":"valor"}` |
| `version` | Sí | `number` | Sin restricción adicional declarada | Versión vigente (concurrencia optimista) | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la última actualización. | `2026-07-31T12:00:00.000Z` |
| `deletedAt` | No | `string` | formato `date-time`; admite null | Marca de borrado lógico; null si el documento está vivo | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: STORAGE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Documento no encontrado | Excepción explícita en src/modules/document_store/services/document-store.service.ts |
| 409 | `CONCURRENCY_CONFLICT` | La versión del documento ha cambiado | Excepción explícita en src/modules/document_store/services/document-store.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Nada que actualizar: indica payload y/o documentType | Excepción explícita en src/modules/document_store/services/document-store.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/document-store/collections/{collection}/documents/{id}"
}
```

---

