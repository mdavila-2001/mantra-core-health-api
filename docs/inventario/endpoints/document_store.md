<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `document_store`

- **Bloque:** —
- **Operaciones:** 5 (5 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 0 · BAJO 5
- **Tablas distintas que tocan:** 0
- **Respuestas de error y detalle contractual:** `openapi/endpoints/document-store.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/document-store/collections/{collection}/documents` | Listar documentos del tenant (paginado) | BAJO | 0 | STORAGE_ADMIN, PLATFORM_ADMIN |
| 2 | POST | `/document-store/collections/{collection}/documents` | Crear un documento flexible en la colección | BAJO | 0 | STORAGE_ADMIN, PLATFORM_ADMIN |
| 3 | DELETE | `/document-store/collections/{collection}/documents/{id}` | Borrado lógico de un documento (soft-delete) | BAJO | 0 | STORAGE_ADMIN, PLATFORM_ADMIN |
| 4 | GET | `/document-store/collections/{collection}/documents/{id}` | Leer un documento por id (acotado por tenant) | BAJO | 0 | STORAGE_ADMIN, PLATFORM_ADMIN |
| 5 | PATCH | `/document-store/collections/{collection}/documents/{id}` | Actualizar un documento con concurrencia optimista | BAJO | 0 | STORAGE_ADMIN, PLATFORM_ADMIN |

---

## 1. GET /document-store/collections/{collection}/documents

- **Origen:** CONTRATO
- **Nombre:** Listar documentos del tenant (paginado)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DocumentStoreController.list` — `src/modules/document_store/controllers/document-store.controller.ts:110`

### Qué es y para qué sirve (negocio)

Listar documentos del tenant (paginado).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /document-store/collections/{collection}/documents` la atiende `DocumentStoreController.list` (src/modules/document_store/controllers/document-store.controller.ts:110). Exige sesión con alguno de los roles STORAGE_ADMIN, PLATFORM_ADMIN. Delega en `DocumentStoreService.list`. No toca tablas relacionales: opera sobre MongoDB, no sobre tablas relacionales.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: STORAGE_ADMIN, PLATFORM_ADMIN | `src/modules/document_store/controllers/document-store.controller.ts:110` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: opera sobre MongoDB, no sobre tablas relacionales. _(automática; fuente: `docs/reports/system-inventory.md §2`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `collection` | path | Sí | `string` | Colección lógica de documentos |
| `page` | query | No | `number` | Página (1-based) |
| `pageSize` | query | No | `number` | Tamaño de página |
| `order` | query | No | `string` | — |
| `sortBy` | query | No | `string` | Campo de ordenamiento. Debe ser un identificador de columna (letras, números, guión bajo); el servicio aplica además su propia allowlist de columnas ordenables |
| `tenantId` | query | No | `string` | Se ignora como fuente de verdad: el tenant es el activo (X-Tenant-Id). Si se envía y no coincide, responde 404 |
| `documentType` | query | No | `string` | Filtrar por clasificación de documento |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PageResponseDto<DocumentResponseDto>>` · DTO `PageResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `data` | `array<object>` | Sí | — | — | Valor de data mantenido por la instancia. | `src/common/dto/page-response.dto.ts:33` |
| `meta` | `PageMetaDto` | Sí | — | — | Valor de meta mantenido por la instancia. | `src/common/dto/page-response.dto.ts:39` |
| `meta.page` | `number` | Sí | — | — | Valor de page mantenido por la instancia. | `src/common/dto/page-response.dto.ts:8` |
| `meta.pageSize` | `number` | Sí | — | — | Valor de page size mantenido por la instancia. | `src/common/dto/page-response.dto.ts:12` |
| `meta.total` | `number` | Sí | — | — | Valor de total mantenido por la instancia. | `src/common/dto/page-response.dto.ts:16` |
| `meta.totalPages` | `number` | Sí | — | — | Valor de total pages mantenido por la instancia. | `src/common/dto/page-response.dto.ts:20` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/document_store.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 55 — Document Store (documentos flexibles sobre MongoDB) — etapa `ctrl:DocumentStoreController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /document-store/collections/{collection}/documents

- **Origen:** CONTRATO
- **Nombre:** Crear un documento flexible en la colección
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DocumentStoreController.create` — `src/modules/document_store/controllers/document-store.controller.ts:67`

### Qué es y para qué sirve (negocio)

Crear un documento flexible en la colección.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /document-store/collections/{collection}/documents` la atiende `DocumentStoreController.create` (src/modules/document_store/controllers/document-store.controller.ts:67). Exige sesión con alguno de los roles STORAGE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `CreateFlexibleDocumentDto` (3 campos, 2 obligatorios). Delega en `DocumentStoreService.create`. No toca tablas relacionales: opera sobre MongoDB, no sobre tablas relacionales.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: STORAGE_ADMIN, PLATFORM_ADMIN | `src/modules/document_store/controllers/document-store.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: opera sobre MongoDB, no sobre tablas relacionales. _(automática; fuente: `docs/reports/system-inventory.md §2`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `collection` | path | Sí | `string` | Colección lógica de documentos |

### Cuerpo — DTO `CreateFlexibleDocumentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Se ignora como fuente de verdad: el tenant es el activo (X-Tenant-Id). Si se envía y no coincide, responde 404 | `src/modules/document_store/dto/create-document.dto.ts:33` |
| `documentType` | `string` | Sí | longitud mínima 1; patrón runtime DOCUMENT_TYPE_RE | `@IsNotEmpty()` `@Matches(DOCUMENT_TYPE_RE, { message: 'documentType debe empezar por minúscula y usar sólo [a-z0-9_.-] (2-61 chars)', })` | Tipo/clasificación del documento (p. ej. fhir_bundle_raw) | `src/modules/document_store/dto/create-document.dto.ts:47` |
| `payload` | `object` | Sí | — | `@IsObject()` `@MaxJsonSize(900 * 1024)` | Contenido flexible del documento (JSON/semiestructurado) | `src/modules/document_store/dto/create-document.dto.ts:59` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "documentType": "fhir_bundle_raw",
  "payload": {
    "clave": "valor"
  }
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "documentType": "fhir_bundle_raw",
  "payload": {
    "clave": "valor"
  }
}
```

</details>

### Respuesta — `Promise<DocumentResponseDto>` · DTO `DocumentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador del documento (ObjectId hex) | `src/modules/document_store/dto/document-response.dto.ts:13` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/document_store/dto/document-response.dto.ts:19` |
| `documentType` | `string` | Sí | — | — | Valor de document type mantenido por la instancia. | `src/modules/document_store/dto/document-response.dto.ts:25` |
| `payload` | `object` | Sí | — | — | Valor de payload mantenido por la instancia. | `src/modules/document_store/dto/document-response.dto.ts:31` |
| `version` | `number` | Sí | — | — | Versión vigente (concurrencia optimista) | `src/modules/document_store/dto/document-response.dto.ts:37` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/document_store/dto/document-response.dto.ts:43` |
| `updatedAt` | `string` | Sí | formato date-time | — | Fecha y hora de la última actualización. | `src/modules/document_store/dto/document-response.dto.ts:49` |
| `deletedAt` | `string` | No | formato date-time; admite null | — | Marca de borrado lógico; null si el documento está vivo | `src/modules/document_store/dto/document-response.dto.ts:60` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/document_store.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 55 — Document Store (documentos flexibles sobre MongoDB) — etapa `ctrl:DocumentStoreController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. DELETE /document-store/collections/{collection}/documents/{id}

- **Origen:** CONTRATO
- **Nombre:** Borrado lógico de un documento (soft-delete)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DocumentStoreController.softDelete` — `src/modules/document_store/controllers/document-store.controller.ts:157`

### Qué es y para qué sirve (negocio)

Borrado lógico de un documento (soft-delete).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`DELETE /document-store/collections/{collection}/documents/{id}` la atiende `DocumentStoreController.softDelete` (src/modules/document_store/controllers/document-store.controller.ts:157). Exige sesión con alguno de los roles STORAGE_ADMIN, PLATFORM_ADMIN. Delega en `DocumentStoreService.softDelete`. No toca tablas relacionales: opera sobre MongoDB, no sobre tablas relacionales.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: STORAGE_ADMIN, PLATFORM_ADMIN | `src/modules/document_store/controllers/document-store.controller.ts:157` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: opera sobre MongoDB, no sobre tablas relacionales. _(automática; fuente: `docs/reports/system-inventory.md §2`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `collection` | path | Sí | `string` | Colección lógica de documentos |
| `id` | path | Sí | `string` | — |
| `tenantId` | query | No | `string` | Se ignora como fuente de verdad: el tenant es el activo (X-Tenant-Id). Si se envía y no coincide, responde 404 |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DocumentResponseDto>` · DTO `DocumentResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador del documento (ObjectId hex) | `src/modules/document_store/dto/document-response.dto.ts:13` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/document_store/dto/document-response.dto.ts:19` |
| `documentType` | `string` | Sí | — | — | Valor de document type mantenido por la instancia. | `src/modules/document_store/dto/document-response.dto.ts:25` |
| `payload` | `object` | Sí | — | — | Valor de payload mantenido por la instancia. | `src/modules/document_store/dto/document-response.dto.ts:31` |
| `version` | `number` | Sí | — | — | Versión vigente (concurrencia optimista) | `src/modules/document_store/dto/document-response.dto.ts:37` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/document_store/dto/document-response.dto.ts:43` |
| `updatedAt` | `string` | Sí | formato date-time | — | Fecha y hora de la última actualización. | `src/modules/document_store/dto/document-response.dto.ts:49` |
| `deletedAt` | `string` | No | formato date-time; admite null | — | Marca de borrado lógico; null si el documento está vivo | `src/modules/document_store/dto/document-response.dto.ts:60` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/document_store.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 55 — Document Store (documentos flexibles sobre MongoDB) — etapa `ctrl:DocumentStoreController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /document-store/collections/{collection}/documents/{id}

- **Origen:** CONTRATO
- **Nombre:** Leer un documento por id (acotado por tenant)
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DocumentStoreController.findOne` — `src/modules/document_store/controllers/document-store.controller.ts:92`

### Qué es y para qué sirve (negocio)

Leer un documento por id (acotado por tenant).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /document-store/collections/{collection}/documents/{id}` la atiende `DocumentStoreController.findOne` (src/modules/document_store/controllers/document-store.controller.ts:92). Exige sesión con alguno de los roles STORAGE_ADMIN, PLATFORM_ADMIN. Delega en `DocumentStoreService.findOne`. No toca tablas relacionales: opera sobre MongoDB, no sobre tablas relacionales.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: STORAGE_ADMIN, PLATFORM_ADMIN | `src/modules/document_store/controllers/document-store.controller.ts:92` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: opera sobre MongoDB, no sobre tablas relacionales. _(automática; fuente: `docs/reports/system-inventory.md §2`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `collection` | path | Sí | `string` | Colección lógica de documentos |
| `id` | path | Sí | `string` | — |
| `tenantId` | query | No | `string` | Se ignora como fuente de verdad: el tenant es el activo (X-Tenant-Id). Si se envía y no coincide, responde 404 |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DocumentResponseDto>` · DTO `DocumentResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador del documento (ObjectId hex) | `src/modules/document_store/dto/document-response.dto.ts:13` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/document_store/dto/document-response.dto.ts:19` |
| `documentType` | `string` | Sí | — | — | Valor de document type mantenido por la instancia. | `src/modules/document_store/dto/document-response.dto.ts:25` |
| `payload` | `object` | Sí | — | — | Valor de payload mantenido por la instancia. | `src/modules/document_store/dto/document-response.dto.ts:31` |
| `version` | `number` | Sí | — | — | Versión vigente (concurrencia optimista) | `src/modules/document_store/dto/document-response.dto.ts:37` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/document_store/dto/document-response.dto.ts:43` |
| `updatedAt` | `string` | Sí | formato date-time | — | Fecha y hora de la última actualización. | `src/modules/document_store/dto/document-response.dto.ts:49` |
| `deletedAt` | `string` | No | formato date-time; admite null | — | Marca de borrado lógico; null si el documento está vivo | `src/modules/document_store/dto/document-response.dto.ts:60` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/document_store.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 55 — Document Store (documentos flexibles sobre MongoDB) — etapa `ctrl:DocumentStoreController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. PATCH /document-store/collections/{collection}/documents/{id}

- **Origen:** CONTRATO
- **Nombre:** Actualizar un documento con concurrencia optimista
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `DocumentStoreController.update` — `src/modules/document_store/controllers/document-store.controller.ts:129`

### Qué es y para qué sirve (negocio)

Actualizar un documento con concurrencia optimista.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`PATCH /document-store/collections/{collection}/documents/{id}` la atiende `DocumentStoreController.update` (src/modules/document_store/controllers/document-store.controller.ts:129). Exige sesión con alguno de los roles STORAGE_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `UpdateDocumentDto` (4 campos, 1 obligatorio). Delega en `DocumentStoreService.update`. No toca tablas relacionales: opera sobre MongoDB, no sobre tablas relacionales.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: STORAGE_ADMIN, PLATFORM_ADMIN | `src/modules/document_store/controllers/document-store.controller.ts:129` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: opera sobre MongoDB, no sobre tablas relacionales. _(automática; fuente: `docs/reports/system-inventory.md §2`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `collection` | path | Sí | `string` | Colección lógica de documentos |
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateDocumentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Se ignora como fuente de verdad: el tenant es el activo (X-Tenant-Id). Si se envía y no coincide, responde 404 | `src/modules/document_store/dto/update-document.dto.ts:32` |
| `expectedVersion` | `number` | Sí | mínimo 1 | `@IsInt()` `@Min(1)` | Versión que el cliente cree vigente (concurrencia optimista) | `src/modules/document_store/dto/update-document.dto.ts:43` |
| `payload` | `object` | No | — | `@IsOptional()` `@IsObject()` `@MaxJsonSize(900 * 1024)` | Nuevo contenido flexible del documento | `src/modules/document_store/dto/update-document.dto.ts:56` |
| `documentType` | `string` | No | patrón runtime DOCUMENT_TYPE_RE | `@IsOptional()` `@Matches(DOCUMENT_TYPE_RE, { message: 'documentType debe empezar por minúscula y usar sólo [a-z0-9_.-] (2-61 chars)', })` | Nueva clasificación del documento | `src/modules/document_store/dto/update-document.dto.ts:67` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "expectedVersion": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "expectedVersion": 1,
  "payload": {
    "clave": "valor"
  },
  "documentType": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<DocumentResponseDto>` · DTO `DocumentResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Identificador del documento (ObjectId hex) | `src/modules/document_store/dto/document-response.dto.ts:13` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/document_store/dto/document-response.dto.ts:19` |
| `documentType` | `string` | Sí | — | — | Valor de document type mantenido por la instancia. | `src/modules/document_store/dto/document-response.dto.ts:25` |
| `payload` | `object` | Sí | — | — | Valor de payload mantenido por la instancia. | `src/modules/document_store/dto/document-response.dto.ts:31` |
| `version` | `number` | Sí | — | — | Versión vigente (concurrencia optimista) | `src/modules/document_store/dto/document-response.dto.ts:37` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/document_store/dto/document-response.dto.ts:43` |
| `updatedAt` | `string` | Sí | formato date-time | — | Fecha y hora de la última actualización. | `src/modules/document_store/dto/document-response.dto.ts:49` |
| `deletedAt` | `string` | No | formato date-time; admite null | — | Marca de borrado lógico; null si el documento está vivo | `src/modules/document_store/dto/document-response.dto.ts:60` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONCURRENCY_CONFLICT` | ConcurrencyConflictException: La versión del documento ha cambiado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Nada que actualizar: indica payload y/o documentType |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/document_store.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 55 — Document Store (documentos flexibles sobre MongoDB) — etapa `ctrl:DocumentStoreController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

