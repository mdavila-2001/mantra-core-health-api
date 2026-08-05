<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `vector_rag`

Referencia exhaustiva de 16 operación(es) del módulo `vector_rag`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `vector_rag`
- **Controladores:** `VectorGovernanceController`, `VectorRuntimeController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /vector-rag/collections](#1-post-vector-rag-collections) — Crear una colección vectorial con su vínculo de tenant
2. [POST /vector-rag/collections/{id}/embedding-jobs](#2-post-vector-rag-collections-id-embedding-jobs) — Encolar un job de embedding
3. [PUT /vector-rag/collections/{id}/lifecycle](#3-put-vector-rag-collections-id-lifecycle) — Sellar o deprecar la colección
4. [POST /vector-rag/collections/{id}/re-embed](#4-post-vector-rag-collections-id-re-embed) — Migrar la colección a un modelo nuevo
5. [POST /vector-rag/collections/{id}/reconciliation](#5-post-vector-rag-collections-id-reconciliation) — Reconciliar el manifiesto canónico contra el vectorial
6. [POST /vector-rag/deletion-jobs](#6-post-vector-rag-deletion-jobs) — Propagar el borrado de la fuente a los embeddings
7. [POST /vector-rag/embedding-jobs/{id}/run](#7-post-vector-rag-embedding-jobs-id-run) — Ejecutar un lote del job de embedding
8. [GET /vector-rag/embedding-jobs/pending](#8-get-vector-rag-embedding-jobs-pending) — Listar jobs de embedding en cola
9. [POST /vector-rag/embedding-model-versions](#9-post-vector-rag-embedding-model-versions) — Registrar y aprobar una versión de modelo de embedding
10. [POST /vector-rag/embedding-model-versions/{id}/retire](#10-post-vector-rag-embedding-model-versions-id-retire) — Retirar una versión de modelo
11. [POST /vector-rag/rag-access-policies](#11-post-vector-rag-rag-access-policies) — Definir una política de acceso RAG
12. [PUT /vector-rag/rag-access-policies/{id}/publish](#12-put-vector-rag-rag-access-policies-id-publish) — Publicar la política y reenlazar colecciones
13. [POST /vector-rag/retrieval-sessions](#13-post-vector-rag-retrieval-sessions) — Abrir una sesión de retrieval gobernada por consentimiento
14. [POST /vector-rag/retrieval-sessions/{id}/evidence](#14-post-vector-rag-retrieval-sessions-id-evidence) — Materializar la evidencia citable
15. [POST /vector-rag/retrieval-sessions/{id}/feedback](#15-post-vector-rag-retrieval-sessions-id-feedback) — Capturar feedback de la sesión
16. [POST /vector-rag/retrieval-sessions/{id}/search](#16-post-vector-rag-retrieval-sessions-id-search) — Ranquear los candidatos y filtrarlos por consentimiento y etiquetas

---

## 1. POST /vector-rag/collections

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Crear una colección vectorial con su vínculo de tenant
- **Operation ID:** `VectorGovernanceController_createCollection`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorGovernanceController.createCollection](../../src/modules/vector_rag/controllers/vector-governance.controller.ts)

### Descripción de negocio

Dimensión y métrica salen del modelo; una colección con PHI exige un modelo aprobado para PHI.


### Descripción del sistema

NestJS resuelve `POST /vector-rag/collections` en `VectorGovernanceController_createCollection`. El controlador delega en `VectorGovernanceService.createCollection`. Valida el body como `CreateCollectionDto` y consume `application/json`. El tipo de retorno estático es `Promise<CollectionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCollectionDto`; los campos opcionales se omiten.

```http
POST /vector-rag/collections HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "embeddingModelVersionId": "00000000-0000-4000-8000-000000000001",
  "namespace": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `RAG_COLLECTION_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `embeddingModelVersionId` | Sí | `string` | formato `uuid` | Modelo aprobado y no retirado | `00000000-0000-4000-8000-000000000001` |
| `containsPhi` | No | `boolean` | Sin restricción adicional declarada | Si la colección va a contener datos de paciente | `false` |
| `accessPolicyId` | No | `string` | formato `uuid` | Política de acceso RAG publicada | `00000000-0000-4000-8000-000000000001` |
| `namespace` | Sí | `string` | longitud máxima 200 | Namespace físico único del vínculo | `Nombre de ejemplo` |
| `encryptionProfileCode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /vector-rag/collections HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "embeddingModelVersionId": "00000000-0000-4000-8000-000000000001",
  "containsPhi": false,
  "accessPolicyId": "00000000-0000-4000-8000-000000000001",
  "namespace": "Nombre de ejemplo",
  "encryptionProfileCode": "CODIGO_EJEMPLO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CollectionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CollectionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CollectionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "dimension": 1,
  "distanceMetric": "valor-ejemplo",
  "lifecycleState": "valor-ejemplo",
  "bindingId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `dimension` | Sí | `number` | Sin restricción adicional declarada | Valor de dimension mantenido por la instancia. | `1` |
| `distanceMetric` | Sí | `string` | Sin restricción adicional declarada | Valor de distance metric mantenido por la instancia. | `valor-ejemplo` |
| `lifecycleState` | Sí | `string` | Sin restricción adicional declarada | Valor de lifecycle state mantenido por la instancia. | `valor-ejemplo` |
| `bindingId` | Sí | `string` | formato `uuid` | Vínculo del tenant creado con la colección | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: RAG_COLLECTION_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión de modelo no encontrada. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
| 404 | `NOT_FOUND` | Política de acceso RAG no encontrada. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
| 409 | `CONFLICT` | Ya existe una colección con ese código para el tenant. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
| 409 | `CONFLICT` | El namespace ya está en uso por otro vínculo. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El modelo está retirado; no se pueden crear colecciones nuevas sobre él. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
| 422 | `PRECONDITION_FAILED` | El modelo no está aprobado para datos de paciente. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/vector-rag/collections"
}
```

---

## 2. POST /vector-rag/collections/{id}/embedding-jobs

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Encolar un job de embedding
- **Operation ID:** `VectorGovernanceController_queueEmbeddingJob`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorGovernanceController.queueEmbeddingJob](../../src/modules/vector_rag/controllers/vector-governance.controller.ts)

### Descripción de negocio

Sólo sobre colección activa; el mismo alcance pedido dos veces no se duplica.


### Descripción del sistema

NestJS resuelve `POST /vector-rag/collections/{id}/embedding-jobs` en `VectorGovernanceController_queueEmbeddingJob`. El controlador delega en `EmbeddingPipelineService.queueEmbeddingJob`. Valida el body como `QueueEmbeddingJobDto` y consume `application/json`. El tipo de retorno estático es `Promise<EmbeddingJobResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `idempotency-key` | header | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `Idempotency-Key` | header | No | `string` | Sin restricción adicional declarada | Si no se envía, se deriva del alcance del job. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `QueueEmbeddingJobDto`; los campos opcionales se omiten.

```http
POST /vector-rag/collections/00000000-0000-4000-8000-000000000001/embedding-jobs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
idempotency-key: valor-ejemplo
Content-Type: application/json

{
  "jobType": "backfill",
  "sourceScope": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `RAG_COLLECTION_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `jobType` | Sí | `string` | valores: `backfill`, `incremental`, `re_embed` | Sin descripción específica en el contrato OpenAPI. | `backfill` |
| `sourceScope` | Sí | `object` | Sin restricción adicional declarada | Qué documentos y versiones abarca el job | `{}` |
| `totalChunks` | No | `number` | mínimo 0 | Chunks previstos, si se conocen | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /vector-rag/collections/00000000-0000-4000-8000-000000000001/embedding-jobs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
idempotency-key: valor-ejemplo
Idempotency-Key: valor-ejemplo
Content-Type: application/json

{
  "jobType": "backfill",
  "sourceScope": {},
  "totalChunks": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EmbeddingJobResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EmbeddingJobResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EmbeddingJobResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EmbeddingJobResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<EmbeddingJobResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EmbeddingJobResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EmbeddingJobResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EmbeddingJobResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EmbeddingJobResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EmbeddingJobResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EmbeddingJobResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "vectorCollectionId": "00000000-0000-4000-8000-000000000001",
  "jobType": "valor-ejemplo",
  "status": "ok",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `vectorCollectionId` | Sí | `string` | formato `uuid` | Identificador asociado a vector collection. | `00000000-0000-4000-8000-000000000001` |
| `jobType` | Sí | `string` | Sin restricción adicional declarada | Valor de job type mantenido por la instancia. | `valor-ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si la clave de idempotencia ya había encolado este job | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: RAG_COLLECTION_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Colección no encontrada. | Excepción explícita en src/modules/vector_rag/services/embedding-pipeline.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La colección no está activa; no admite jobs de embedding. | Excepción explícita en src/modules/vector_rag/services/embedding-pipeline.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/vector-rag/collections/{id}/embedding-jobs"
}
```

---

## 3. PUT /vector-rag/collections/{id}/lifecycle

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Sellar o deprecar la colección
- **Operation ID:** `VectorGovernanceController_updateCollectionLifecycle`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorGovernanceController.updateCollectionLifecycle](../../src/modules/vector_rag/controllers/vector-governance.controller.ts)

### Descripción de negocio

Sellar congela los vínculos del tenant, que es lo que bloquea escrituras nuevas.

Contexto declarado en el controlador: UC-59-13 (sellado de la colección).

### Descripción del sistema

NestJS resuelve `PUT /vector-rag/collections/{id}/lifecycle` en `VectorGovernanceController_updateCollectionLifecycle`. El controlador delega en `VectorGovernanceService.updateCollectionLifecycle`. Valida el body como `UpdateCollectionLifecycleDto` y consume `application/json`. El tipo de retorno estático es `Promise<LifecycleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateCollectionLifecycleDto`; los campos opcionales se omiten.

```http
PUT /vector-rag/collections/00000000-0000-4000-8000-000000000001/lifecycle HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "lifecycleState": "active"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AI_GOVERNANCE_OFFICER`, `RAG_COLLECTION_ADMIN`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `lifecycleState` | Sí | `string` | valores: `active`, `sealed`, `deprecated` | Sin descripción específica en el contrato OpenAPI. | `active` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /vector-rag/collections/00000000-0000-4000-8000-000000000001/lifecycle HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "lifecycleState": "active"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LifecycleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LifecycleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LifecycleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LifecycleResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<LifecycleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LifecycleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<LifecycleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LifecycleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LifecycleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LifecycleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LifecycleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "lifecycleState": "valor-ejemplo",
  "frozenBindings": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `lifecycleState` | Sí | `string` | Sin restricción adicional declarada | Valor de lifecycle state mantenido por la instancia. | `valor-ejemplo` |
| `frozenBindings` | Sí | `number` | Sin restricción adicional declarada | Vínculos de tenant congelados por el cambio | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AI_GOVERNANCE_OFFICER, RAG_COLLECTION_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Colección no encontrada. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
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
  "path": "/vector-rag/collections/{id}/lifecycle"
}
```

---

## 4. POST /vector-rag/collections/{id}/re-embed

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Migrar la colección a un modelo nuevo
- **Operation ID:** `VectorGovernanceController_reEmbedCollection`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorGovernanceController.reEmbedCollection](../../src/modules/vector_rag/controllers/vector-governance.controller.ts)

### Descripción de negocio

Los embeddings anteriores pasan a `superseded`, no se borran: la colección sigue sirviendo búsquedas mientras se re-embebe.


### Descripción del sistema

NestJS resuelve `POST /vector-rag/collections/{id}/re-embed` en `VectorGovernanceController_reEmbedCollection`. El controlador delega en `EmbeddingPipelineService.reEmbedCollection`. Valida el body como `ReEmbedCollectionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReEmbedResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReEmbedCollectionDto`; los campos opcionales se omiten.

```http
POST /vector-rag/collections/00000000-0000-4000-8000-000000000001/re-embed HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "embeddingModelVersionId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AI_GOVERNANCE_OFFICER`, `MLOPS_ENGINEER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `embeddingModelVersionId` | Sí | `string` | formato `uuid` | Nuevo modelo, aprobado y no retirado | `00000000-0000-4000-8000-000000000001` |
| `supersedePrevious` | No | `boolean` | Sin restricción adicional declarada | Si los embeddings del modelo anterior pasan a `superseded` | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /vector-rag/collections/00000000-0000-4000-8000-000000000001/re-embed HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "embeddingModelVersionId": "00000000-0000-4000-8000-000000000001",
  "supersedePrevious": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReEmbedResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReEmbedResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReEmbedResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReEmbedResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReEmbedResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReEmbedResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReEmbedResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReEmbedResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReEmbedResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReEmbedResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReEmbedResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "vectorCollectionId": "00000000-0000-4000-8000-000000000001",
  "embeddingJobId": "00000000-0000-4000-8000-000000000001",
  "embeddingModelVersionId": "00000000-0000-4000-8000-000000000001",
  "supersededEmbeddings": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `vectorCollectionId` | Sí | `string` | formato `uuid` | Identificador asociado a vector collection. | `00000000-0000-4000-8000-000000000001` |
| `embeddingJobId` | Sí | `string` | formato `uuid` | Job de re-embedding encolado | `00000000-0000-4000-8000-000000000001` |
| `embeddingModelVersionId` | Sí | `string` | formato `uuid` | Identificador asociado a embedding model version. | `00000000-0000-4000-8000-000000000001` |
| `supersededEmbeddings` | Sí | `number` | Sin restricción adicional declarada | Embeddings del modelo anterior marcados como superados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AI_GOVERNANCE_OFFICER, MLOPS_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Colección no encontrada. | Excepción explícita en src/modules/vector_rag/services/embedding-pipeline.service.ts |
| 404 | `NOT_FOUND` | Versión de modelo no encontrada. | Excepción explícita en src/modules/vector_rag/services/embedding-pipeline.service.ts |
| 409 | `CONFLICT` | La colección ya usa esa versión de modelo. | Excepción explícita en src/modules/vector_rag/services/embedding-pipeline.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La colección no está activa. | Excepción explícita en src/modules/vector_rag/services/embedding-pipeline.service.ts |
| 422 | `PRECONDITION_FAILED` | El modelo de destino está retirado. | Excepción explícita en src/modules/vector_rag/services/embedding-pipeline.service.ts |
| 422 | `PRECONDITION_FAILED` | El modelo de destino no está aprobado para datos de paciente. | Excepción explícita en src/modules/vector_rag/services/embedding-pipeline.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/vector-rag/collections/{id}/re-embed"
}
```

---

## 5. POST /vector-rag/collections/{id}/reconciliation

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Reconciliar el manifiesto canónico contra el vectorial
- **Operation ID:** `VectorRuntimeController_reconcileCollection`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorRuntimeController.reconcileCollection](../../src/modules/vector_rag/controllers/vector-runtime.controller.ts)

### Descripción de negocio

Distingue lo que falta, lo huérfano y lo descuadrado, y encola la reparación de cada uno.


### Descripción del sistema

NestJS resuelve `POST /vector-rag/collections/{id}/reconciliation` en `VectorRuntimeController_reconcileCollection`. El controlador delega en `VectorMaintenanceService.reconcileCollection`. Valida el body como `ReconcileCollectionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReconciliationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReconcileCollectionDto`; los campos opcionales se omiten.

```http
POST /vector-rag/collections/00000000-0000-4000-8000-000000000001/reconciliation HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "canonicalDocumentIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "canonicalManifestHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `RECONCILIATION_WORKER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `canonicalDocumentIds` | Sí | `array<string>` | formato `uuid` | Documentos que la fuente autoritativa dice que deberían estar | `["00000000-0000-4000-8000-000000000001"]` |
| `canonicalManifestHash` | Sí | `string` | longitud máxima 200 | Hash del manifiesto canónico | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `autoRepair` | No | `boolean` | Sin restricción adicional declarada | Si el drift detectado encola automáticamente su reparación | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /vector-rag/collections/00000000-0000-4000-8000-000000000001/reconciliation HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "canonicalDocumentIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "canonicalManifestHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "autoRepair": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReconciliationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReconciliationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "missingCount": 1,
  "orphanCount": 1,
  "mismatchedCount": 1,
  "repairJobId": "00000000-0000-4000-8000-000000000001",
  "purgeJobId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `missingCount` | Sí | `number` | Sin restricción adicional declarada | Documentos que la fuente tiene y el vector no | `1` |
| `orphanCount` | Sí | `number` | Sin restricción adicional declarada | Documentos que el vector tiene y la fuente ya no | `1` |
| `mismatchedCount` | Sí | `number` | Sin restricción adicional declarada | Documentos presentes en ambos con contenido distinto | `1` |
| `repairJobId` | No | `string` | formato `uuid` | Job encolado para reparar lo que falta | `00000000-0000-4000-8000-000000000001` |
| `purgeJobId` | No | `string` | formato `uuid` | Job encolado para purgar los huérfanos | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, RECONCILIATION_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Colección no encontrada. | Excepción explícita en src/modules/vector_rag/services/vector-maintenance.service.ts |
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
  "path": "/vector-rag/collections/{id}/reconciliation"
}
```

---

## 6. POST /vector-rag/deletion-jobs

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Propagar el borrado de la fuente a los embeddings
- **Operation ID:** `VectorRuntimeController_propagateDeletion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorRuntimeController.propagateDeletion](../../src/modules/vector_rag/controllers/vector-runtime.controller.ts)

### Descripción de negocio

Borrado físico: un embedding marcado como borrado seguiría siendo el dato guardado.


### Descripción del sistema

NestJS resuelve `POST /vector-rag/deletion-jobs` en `VectorRuntimeController_propagateDeletion`. El controlador delega en `VectorMaintenanceService.propagateDeletion`. Valida el body como `PropagateDeletionDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeletionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PropagateDeletionDto`; los campos opcionales se omiten.

```http
POST /vector-rag/deletion-jobs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "deletionReason": "source_document_deleted"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRIVACY_OFFICER`, `DPO`, `SYSTEM`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sourceDocumentId` | No | `string` | formato `uuid` | Documento fuente borrado | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | Paciente cuyo dato se borra | `00000000-0000-4000-8000-000000000001` |
| `deletionReason` | Sí | `string` | valores: `source_document_deleted`, `patient_erasure`, `orphan_purge` | Sin descripción específica en el contrato OpenAPI. | `source_document_deleted` |
| `batchSize` | No | `number` | mínimo 1; máximo 1000 | Sin descripción específica en el contrato OpenAPI. | `100` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /vector-rag/deletion-jobs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourceDocumentId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "deletionReason": "source_document_deleted",
  "batchSize": 100
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DeletionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeletionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeletionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeletionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeletionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeletionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeletionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeletionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeletionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeletionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "documentsPurged": 1,
  "chunksPurged": 1,
  "embeddingsPurged": 1,
  "verified": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `documentsPurged` | Sí | `number` | Sin restricción adicional declarada | Valor de documents purged mantenido por la instancia. | `1` |
| `chunksPurged` | Sí | `number` | Sin restricción adicional declarada | Valor de chunks purged mantenido por la instancia. | `1` |
| `embeddingsPurged` | Sí | `number` | Sin restricción adicional declarada | Valor de embeddings purged mantenido por la instancia. | `1` |
| `verified` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si no quedaba nada por purgar y el borrado queda verificado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRIVACY_OFFICER, DPO, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Hay que declarar qué se borra: un documento fuente o un paciente. | Excepción explícita en src/modules/vector_rag/services/vector-maintenance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/vector-rag/deletion-jobs"
}
```

---

## 7. POST /vector-rag/embedding-jobs/{id}/run

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Ejecutar un lote del job de embedding
- **Operation ID:** `VectorRuntimeController_runEmbeddingJob`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorRuntimeController.runEmbeddingJob](../../src/modules/vector_rag/controllers/vector-runtime.controller.ts)

### Descripción de negocio

Documento, chunks y vectores en la misma transacción; reejecutar no duplica en ninguno de los tres niveles.


### Descripción del sistema

NestJS resuelve `POST /vector-rag/embedding-jobs/{id}/run` en `VectorRuntimeController_runEmbeddingJob`. El controlador delega en `EmbeddingPipelineService.runEmbeddingJob`. Valida el body como `RunEmbeddingJobDto` y consume `application/json`. El tipo de retorno estático es `Promise<RunEmbeddingJobResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunEmbeddingJobDto`; los campos opcionales se omiten.

```http
POST /vector-rag/embedding-jobs/00000000-0000-4000-8000-000000000001/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `EMBEDDING_WORKER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `documents` | No | `array<EmbeddedDocumentDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"sourceDocumentId":"00000000-0000-4000-8000-000000000001","sourceVersionId":"00000000-0000-4000-8000-000000000001","documentType":"valor-ejemplo","language":"es-BO","title":"valor-ejemplo","contentHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","containsPhi":false,"patientProfileId":"00000000-0000-4000-8000-000000000001","securityLabels":["valor-ejemplo"],"purposeOfUseCodes":["CODIGO_EJEMPLO"],"chunks":[{"chunkNumber":1,"chunkTextRedacted":"valor-ejemplo","tokenCount":1,"chunkHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","sectionPath":"valor-ejemplo","metadata":{},"embedding":"valor-ejemplo","embeddingHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]}]` |
| `documents[].sourceDocumentId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `documents[].sourceVersionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `documents[].documentType` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `documents[].language` | No | `string` | longitud máxima 20 | Sin descripción específica en el contrato OpenAPI. | `es-BO` |
| `documents[].title` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `documents[].contentHash` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `documents[].containsPhi` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `documents[].patientProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `documents[].securityLabels` | No | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `documents[].purposeOfUseCodes` | No | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["CODIGO_EJEMPLO"]` |
| `documents[].chunks` | No | `array<EmbeddedChunkDto>` | mínimo 1 elemento(s); máximo 500 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"chunkNumber":1,"chunkTextRedacted":"valor-ejemplo","tokenCount":1,"chunkHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","sectionPath":"valor-ejemplo","metadata":{},"embedding":"valor-ejemplo","embeddingHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]` |
| `documents[].chunks[].chunkNumber` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `documents[].chunks[].chunkTextRedacted` | No | `string` | Sin restricción adicional declarada | Texto ya redactado; nunca el original | `valor-ejemplo` |
| `documents[].chunks[].tokenCount` | No | `number` | mínimo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `documents[].chunks[].chunkHash` | No | `string` | longitud máxima 200 | Hash del texto del chunk | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `documents[].chunks[].sectionPath` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `documents[].chunks[].metadata` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `documents[].chunks[].embedding` | No | `string` | Sin restricción adicional declarada | Vector en formato de pgvector, p. ej. `[0.1,0.2,...]` | `valor-ejemplo` |
| `documents[].chunks[].embeddingHash` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `finalBatch` | No | `boolean` | Sin restricción adicional declarada | Si este lote cierra el job y lo pasa a completado | `false` |
| `failed` | No | `boolean` | Sin restricción adicional declarada | El lote falló antes de calcular ningún embedding | `true` |
| `errorCode` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /vector-rag/embedding-jobs/00000000-0000-4000-8000-000000000001/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "documents": [
    {
      "sourceDocumentId": "00000000-0000-4000-8000-000000000001",
      "sourceVersionId": "00000000-0000-4000-8000-000000000001",
      "documentType": "valor-ejemplo",
      "language": "es-BO",
      "title": "valor-ejemplo",
      "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "containsPhi": false,
      "patientProfileId": "00000000-0000-4000-8000-000000000001",
      "securityLabels": [
        "valor-ejemplo"
      ],
      "purposeOfUseCodes": [
        "CODIGO_EJEMPLO"
      ],
      "chunks": [
        {
          "chunkNumber": 1,
          "chunkTextRedacted": "valor-ejemplo",
          "tokenCount": 1,
          "chunkHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          "sectionPath": "valor-ejemplo",
          "metadata": {},
          "embedding": "valor-ejemplo",
          "embeddingHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        }
      ]
    }
  ],
  "finalBatch": false,
  "failed": true,
  "errorCode": "CODIGO_EJEMPLO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RunEmbeddingJobResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RunEmbeddingJobResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RunEmbeddingJobResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RunEmbeddingJobResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RunEmbeddingJobResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RunEmbeddingJobResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RunEmbeddingJobResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RunEmbeddingJobResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RunEmbeddingJobResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RunEmbeddingJobResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RunEmbeddingJobResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "jobId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "documentsUpserted": 1,
  "chunksCreated": 1,
  "embeddingsCreated": 1,
  "chunksSkipped": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `jobId` | Sí | `string` | formato `uuid` | Identificador asociado a job. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `documentsUpserted` | Sí | `number` | Sin restricción adicional declarada | Documentos creados en este lote | `1` |
| `chunksCreated` | Sí | `number` | Sin restricción adicional declarada | Chunks creados en este lote | `1` |
| `embeddingsCreated` | Sí | `number` | Sin restricción adicional declarada | Embeddings creados en este lote | `1` |
| `chunksSkipped` | Sí | `number` | Sin restricción adicional declarada | Chunks que ya estaban embebidos y no se repitieron | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, EMBEDDING_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Job de embedding no encontrado. | Excepción explícita en src/modules/vector_rag/services/embedding-pipeline.service.ts |
| 404 | `NOT_FOUND` | Colección no encontrada. | Excepción explícita en src/modules/vector_rag/services/embedding-pipeline.service.ts |
| 404 | `NOT_FOUND` | Versión de modelo no encontrada. | Excepción explícita en src/modules/vector_rag/services/embedding-pipeline.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El job ya no está en cola ni en ejecución. | Excepción explícita en src/modules/vector_rag/services/embedding-pipeline.service.ts |
| 422 | `PRECONDITION_FAILED` | El modelo de la colección está retirado; el job no puede seguir. | Excepción explícita en src/modules/vector_rag/services/embedding-pipeline.service.ts |
| 422 | `PRECONDITION_FAILED` | La colección no admite datos de paciente y el documento los declara. | Excepción explícita en src/modules/vector_rag/services/embedding-pipeline.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/vector-rag/embedding-jobs/{id}/run"
}
```

---

## 8. GET /vector-rag/embedding-jobs/pending

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Listar jobs de embedding en cola
- **Operation ID:** `VectorRuntimeController_listQueuedJobs`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorRuntimeController.listQueuedJobs](../../src/modules/vector_rag/controllers/vector-runtime.controller.ts)

### Descripción de negocio

Listar jobs de embedding en cola. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Descubrimiento del worker de embeddings: `run` exige un `jobId` puntual y no había forma de listar qué jobs en cola ejecutar.

### Descripción del sistema

NestJS resuelve `GET /vector-rag/embedding-jobs/pending` en `VectorRuntimeController_listQueuedJobs`. El controlador delega en `EmbeddingPipelineService.listQueuedJobs`. No recibe body. El tipo de retorno estático es `Promise<PendingEmbeddingJobsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /vector-rag/embedding-jobs/pending?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `EMBEDDING_WORKER`, `PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /vector-rag/embedding-jobs/pending?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PendingEmbeddingJobsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PendingEmbeddingJobsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PendingEmbeddingJobsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PendingEmbeddingJobsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PendingEmbeddingJobsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PendingEmbeddingJobsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PendingEmbeddingJobsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "jobs": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "vectorCollectionId": "00000000-0000-4000-8000-000000000001",
      "jobType": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `jobs` | Sí | `array<QueuedEmbeddingJobSummaryDto>` | Sin restricción adicional declarada | Valor de jobs mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","vectorCollectionId":"00000000-0000-4000-8000-000000000001","jobType":"valor-ejemplo"}]` |
| `jobs[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `jobs[].vectorCollectionId` | Sí | `string` | formato `uuid` | Identificador asociado a vector collection. | `00000000-0000-4000-8000-000000000001` |
| `jobs[].jobType` | Sí | `string` | Sin restricción adicional declarada | Valor de job type mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, EMBEDDING_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/vector-rag/embedding-jobs/pending"
}
```

---

## 9. POST /vector-rag/embedding-model-versions

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Registrar y aprobar una versión de modelo de embedding
- **Operation ID:** `VectorGovernanceController_registerModelVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorGovernanceController.registerModelVersion](../../src/modules/vector_rag/controllers/vector-governance.controller.ts)

### Descripción de negocio

La aprobación para datos de paciente queda registrada con quién y cuándo.


### Descripción del sistema

NestJS resuelve `POST /vector-rag/embedding-model-versions` en `VectorGovernanceController_registerModelVersion`. El controlador delega en `VectorGovernanceService.registerModelVersion`. Valida el body como `RegisterModelVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ModelVersionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterModelVersionDto`; los campos opcionales se omiten.

```http
POST /vector-rag/embedding-model-versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "providerCode": "CODIGO_EJEMPLO",
  "modelId": "00000000-0000-4000-8000-000000000001",
  "modelVersion": "valor-ejemplo",
  "dimension": 1,
  "distanceMetric": "cosine",
  "tokenizerVersion": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AI_GOVERNANCE_OFFICER`, `MLOPS_ENGINEER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `providerCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `modelId` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `modelVersion` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `dimension` | Sí | `number` | mínimo 1; máximo 16000 | Dimensión del vector que produce | `1` |
| `distanceMetric` | Sí | `string` | valores: `cosine`, `l2`, `inner_product` | Sin descripción específica en el contrato OpenAPI. | `cosine` |
| `tokenizerVersion` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `approvedForPhi` | No | `boolean` | Sin restricción adicional declarada | Si está aprobado para datos de paciente; queda registrado quién lo aprobó | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /vector-rag/embedding-model-versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "providerCode": "CODIGO_EJEMPLO",
  "modelId": "00000000-0000-4000-8000-000000000001",
  "modelVersion": "valor-ejemplo",
  "dimension": 1,
  "distanceMetric": "cosine",
  "tokenizerVersion": "valor-ejemplo",
  "approvedForPhi": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ModelVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "providerCode": "CODIGO_EJEMPLO",
  "modelId": "00000000-0000-4000-8000-000000000001",
  "modelVersion": "valor-ejemplo",
  "dimension": 1,
  "approvedForPhi": true,
  "retiredAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `providerCode` | Sí | `string` | Sin restricción adicional declarada | Valor de provider code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `modelId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a model. | `00000000-0000-4000-8000-000000000001` |
| `modelVersion` | Sí | `string` | Sin restricción adicional declarada | Valor de model version mantenido por la instancia. | `valor-ejemplo` |
| `dimension` | Sí | `number` | Sin restricción adicional declarada | Valor de dimension mantenido por la instancia. | `1` |
| `approvedForPhi` | Sí | `boolean` | Sin restricción adicional declarada | Valor de approved for phi mantenido por la instancia. | `true` |
| `retiredAt` | No | `string` | formato `date-time` | Valor de retired at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AI_GOVERNANCE_OFFICER, MLOPS_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Esa versión del modelo ya está registrada. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
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
  "path": "/vector-rag/embedding-model-versions"
}
```

---

## 10. POST /vector-rag/embedding-model-versions/{id}/retire

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Retirar una versión de modelo
- **Operation ID:** `VectorGovernanceController_retireModelVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorGovernanceController.retireModelVersion](../../src/modules/vector_rag/controllers/vector-governance.controller.ts)

### Descripción de negocio

No borra: marca `retired_at`. Se rechaza si hay jobs vivos que dependen de él.

Contexto declarado en el controlador: UC-59-13 (retirada del modelo).

### Descripción del sistema

NestJS resuelve `POST /vector-rag/embedding-model-versions/{id}/retire` en `VectorGovernanceController_retireModelVersion`. El controlador delega en `VectorGovernanceService.retireModelVersion`. Valida el body como `RetireModelVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ModelVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RetireModelVersionDto`; los campos opcionales se omiten.

```http
POST /vector-rag/embedding-model-versions/00000000-0000-4000-8000-000000000001/retire HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AI_GOVERNANCE_OFFICER`, `MLOPS_ENGINEER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | No | `string` | Sin restricción adicional declarada | Por qué se retira; queda en el evento publicado | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /vector-rag/embedding-model-versions/00000000-0000-4000-8000-000000000001/retire HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ModelVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ModelVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "providerCode": "CODIGO_EJEMPLO",
  "modelId": "00000000-0000-4000-8000-000000000001",
  "modelVersion": "valor-ejemplo",
  "dimension": 1,
  "approvedForPhi": true,
  "retiredAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `providerCode` | Sí | `string` | Sin restricción adicional declarada | Valor de provider code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `modelId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a model. | `00000000-0000-4000-8000-000000000001` |
| `modelVersion` | Sí | `string` | Sin restricción adicional declarada | Valor de model version mantenido por la instancia. | `valor-ejemplo` |
| `dimension` | Sí | `number` | Sin restricción adicional declarada | Valor de dimension mantenido por la instancia. | `1` |
| `approvedForPhi` | Sí | `boolean` | Sin restricción adicional declarada | Valor de approved for phi mantenido por la instancia. | `true` |
| `retiredAt` | No | `string` | formato `date-time` | Valor de retired at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AI_GOVERNANCE_OFFICER, MLOPS_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión de modelo no encontrada. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
| 409 | `CONFLICT` | El modelo ya está retirado. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Hay jobs de embedding vivos que dependen del modelo. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/vector-rag/embedding-model-versions/{id}/retire"
}
```

---

## 11. POST /vector-rag/rag-access-policies

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Definir una política de acceso RAG
- **Operation ID:** `VectorGovernanceController_defineRagPolicy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorGovernanceController.defineRagPolicy](../../src/modules/vector_rag/controllers/vector-governance.controller.ts)

### Descripción de negocio

Nace en borrador; una política en borrador no gobierna ninguna consulta.

Contexto declarado en el controlador: UC-59-03 (definición).

### Descripción del sistema

NestJS resuelve `POST /vector-rag/rag-access-policies` en `VectorGovernanceController_defineRagPolicy`. El controlador delega en `VectorGovernanceService.defineRagPolicy`. Valida el body como `DefineRagPolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<RagPolicyResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineRagPolicyDto`; los campos opcionales se omiten.

```http
POST /vector-rag/rag-access-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "allowedPrincipalTypes": [
    "user"
  ],
  "allowedPurposeCodes": [
    "CODIGO_EJEMPLO"
  ],
  "allowedSecurityLabels": [
    "valor-ejemplo"
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRIVACY_OFFICER`, `DPO`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `allowedPrincipalTypes` | Sí | `array<string>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["user"]` |
| `allowedPurposeCodes` | Sí | `array<string>` | mínimo 1 elemento(s) | Propósitos de uso admitidos | `["CODIGO_EJEMPLO"]` |
| `allowedSecurityLabels` | Sí | `array<string>` | Sin restricción adicional declarada | Etiquetas de seguridad admitidas | `["valor-ejemplo"]` |
| `patientScopeRequired` | No | `boolean` | Sin restricción adicional declarada | Si la consulta debe declarar el paciente sobre el que se hace | `false` |
| `consentRequired` | No | `boolean` | Sin restricción adicional declarada | Si exige consentimiento vigente | `false` |
| `fieldRedactionProfile` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /vector-rag/rag-access-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "allowedPrincipalTypes": [
    "user"
  ],
  "allowedPurposeCodes": [
    "CODIGO_EJEMPLO"
  ],
  "allowedSecurityLabels": [
    "valor-ejemplo"
  ],
  "patientScopeRequired": false,
  "consentRequired": false,
  "fieldRedactionProfile": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RagPolicyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "state": "valor-ejemplo",
  "reboundCollections": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |
| `reboundCollections` | Sí | `number` | Sin restricción adicional declarada | Colecciones reenlazadas al publicar | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRIVACY_OFFICER, DPO, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una política con ese código para el tenant. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Exigir consentimiento obliga a exigir también el ámbito de paciente. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/vector-rag/rag-access-policies"
}
```

---

## 12. PUT /vector-rag/rag-access-policies/{id}/publish

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Publicar la política y reenlazar colecciones
- **Operation ID:** `VectorGovernanceController_publishRagPolicy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorGovernanceController.publishRagPolicy](../../src/modules/vector_rag/controllers/vector-governance.controller.ts)

### Descripción de negocio

Publicar es el momento en que la revisión de privacidad pasa a tener efecto.

Contexto declarado en el controlador: UC-59-03 (publicación).

### Descripción del sistema

NestJS resuelve `PUT /vector-rag/rag-access-policies/{id}/publish` en `VectorGovernanceController_publishRagPolicy`. El controlador delega en `VectorGovernanceService.publishRagPolicy`. Valida el body como `PublishRagPolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<RagPolicyResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishRagPolicyDto`; los campos opcionales se omiten.

```http
PUT /vector-rag/rag-access-policies/00000000-0000-4000-8000-000000000001/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PRIVACY_OFFICER`, `DPO`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `rebindCollectionIds` | No | `array<string>` | formato `uuid` | Colecciones que pasan a regirse por esta política | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /vector-rag/rag-access-policies/00000000-0000-4000-8000-000000000001/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "rebindCollectionIds": [
    "00000000-0000-4000-8000-000000000001"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RagPolicyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RagPolicyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "state": "valor-ejemplo",
  "reboundCollections": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |
| `reboundCollections` | Sí | `number` | Sin restricción adicional declarada | Colecciones reenlazadas al publicar | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PRIVACY_OFFICER, DPO, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Política de acceso RAG no encontrada. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
| 404 | `NOT_FOUND` | Colección no encontrada. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La colección pertenece a otro tenant que la política. | Excepción explícita en src/modules/vector_rag/services/vector-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/vector-rag/rag-access-policies/{id}/publish"
}
```

---

## 13. POST /vector-rag/retrieval-sessions

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Abrir una sesión de retrieval gobernada por consentimiento
- **Operation ID:** `VectorRuntimeController_openSession`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorRuntimeController.openSession](../../src/modules/vector_rag/controllers/vector-runtime.controller.ts)

### Descripción de negocio

Exige política publicada, propósito admitido y —si la política lo pide— paciente y consentimiento.


### Descripción del sistema

NestJS resuelve `POST /vector-rag/retrieval-sessions` en `VectorRuntimeController_openSession`. El controlador delega en `RetrievalService.openSession`. Valida el body como `OpenRetrievalSessionDto` y consume `application/json`. El tipo de retorno estático es `Promise<RetrievalSessionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `OpenRetrievalSessionDto`; los campos opcionales se omiten.

```http
POST /vector-rag/retrieval-sessions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "vectorCollectionId": "00000000-0000-4000-8000-000000000001",
  "principalType": "user",
  "purposeOfUseCode": "CODIGO_EJEMPLO",
  "queryTextRedacted": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `AGENT_RUNTIME`, `SYSTEM`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `vectorCollectionId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `principalType` | Sí | `string` | valores: `user`, `agent`, `service` | Sin descripción específica en el contrato OpenAPI. | `user` |
| `agentId` | No | `string` | formato `uuid` | Agente que consulta, si no es una persona | `00000000-0000-4000-8000-000000000001` |
| `purposeOfUseCode` | Sí | `string` | longitud máxima 100 | Propósito de uso declarado | `CODIGO_EJEMPLO` |
| `patientProfileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `consentDirectiveId` | No | `string` | formato `uuid` | Directiva de consentimiento que ampara la consulta | `00000000-0000-4000-8000-000000000001` |
| `queryTextRedacted` | Sí | `string` | Sin restricción adicional declarada | Consulta ya redactada; nunca la original | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /vector-rag/retrieval-sessions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "vectorCollectionId": "00000000-0000-4000-8000-000000000001",
  "principalType": "user",
  "agentId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUseCode": "CODIGO_EJEMPLO",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "consentDirectiveId": "00000000-0000-4000-8000-000000000001",
  "queryTextRedacted": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RetrievalSessionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RetrievalSessionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RetrievalSessionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RetrievalSessionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RetrievalSessionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RetrievalSessionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RetrievalSessionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RetrievalSessionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RetrievalSessionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RetrievalSessionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "queryHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `queryHash` | Sí | `string` | Sin restricción adicional declarada | Hash de la consulta; identifica la pregunta sin guardarla | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si ya había una sesión abierta para la misma consulta | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, AGENT_RUNTIME, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Colección no encontrada. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 404 | `NOT_FOUND` | Política de acceso RAG no encontrada. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La colección está deprecada. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 422 | `PRECONDITION_FAILED` | La política no admite ese tipo de principal. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 422 | `PRECONDITION_FAILED` | La política no admite ese propósito de uso. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 422 | `PRECONDITION_FAILED` | La política exige declarar el paciente sobre el que se consulta. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 422 | `PRECONDITION_FAILED` | La política exige una directiva de consentimiento vigente. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 422 | `PRECONDITION_FAILED` | La colección no tiene política de acceso RAG; no se puede consultar. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 422 | `PRECONDITION_FAILED` | La política de acceso RAG no está publicada. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/vector-rag/retrieval-sessions"
}
```

---

## 14. POST /vector-rag/retrieval-sessions/{id}/evidence

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Materializar la evidencia citable
- **Operation ID:** `VectorRuntimeController_materializeEvidence`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorRuntimeController.materializeEvidence](../../src/modules/vector_rag/controllers/vector-runtime.controller.ts)

### Descripción de negocio

Sólo se cita lo seleccionado y autorizado; la versión fuente se copia del documento, no se recibe.


### Descripción del sistema

NestJS resuelve `POST /vector-rag/retrieval-sessions/{id}/evidence` en `VectorRuntimeController_materializeEvidence`. El controlador delega en `RetrievalService.materializeEvidence`. Valida el body como `MaterializeEvidenceDto` y consume `application/json`. El tipo de retorno estático es `Promise<EvidenceResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `MaterializeEvidenceDto`; los campos opcionales se omiten.

```http
POST /vector-rag/retrieval-sessions/00000000-0000-4000-8000-000000000001/evidence HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "citations": [
    {
      "vectorChunkId": "00000000-0000-4000-8000-000000000001",
      "quotedTextRedacted": "valor-ejemplo"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `RETRIEVAL_WORKER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `citations` | Sí | `array<EvidenceInputDto>` | mínimo 1 elemento(s); máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"vectorChunkId":"00000000-0000-4000-8000-000000000001","quotedTextRedacted":"valor-ejemplo","sourceUri":"valor-ejemplo"}]` |
| `citations[].vectorChunkId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `citations[].quotedTextRedacted` | Sí | `string` | Sin restricción adicional declarada | Fragmento citado, ya redactado | `valor-ejemplo` |
| `citations[].sourceUri` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /vector-rag/retrieval-sessions/00000000-0000-4000-8000-000000000001/evidence HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "citations": [
    {
      "vectorChunkId": "00000000-0000-4000-8000-000000000001",
      "quotedTextRedacted": "valor-ejemplo",
      "sourceUri": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EvidenceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "retrievalSessionId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "citations": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `retrievalSessionId` | Sí | `string` | formato `uuid` | Identificador asociado a retrieval session. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `citations` | Sí | `number` | Sin restricción adicional declarada | Citas materializadas | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, RETRIEVAL_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sesión de retrieval no encontrada. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La sesión tiene que estar ranqueada para materializar evidencia. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 422 | `PRECONDITION_FAILED` | La sesión no tiene ningún candidato seleccionado y autorizado que citar. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 422 | `PRECONDITION_FAILED` | Se intenta citar un chunk que no quedó seleccionado y autorizado. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/vector-rag/retrieval-sessions/{id}/evidence"
}
```

---

## 15. POST /vector-rag/retrieval-sessions/{id}/feedback

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Capturar feedback de la sesión
- **Operation ID:** `VectorRuntimeController_captureFeedback`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorRuntimeController.captureFeedback](../../src/modules/vector_rag/controllers/vector-runtime.controller.ts)

### Descripción de negocio

Un código de problema de seguridad marca la sesión y publica un evento aparte.


### Descripción del sistema

NestJS resuelve `POST /vector-rag/retrieval-sessions/{id}/feedback` en `VectorRuntimeController_captureFeedback`. El controlador delega en `RetrievalService.captureFeedback`. Valida el body como `CaptureFeedbackDto` y consume `application/json`. El tipo de retorno estático es `Promise<FeedbackResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CaptureFeedbackDto`; los campos opcionales se omiten.

```http
POST /vector-rag/retrieval-sessions/00000000-0000-4000-8000-000000000001/feedback HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "feedbackType": "relevance"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `AGENT_RUNTIME`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `feedbackType` | Sí | `string` | valores: `relevance`, `safety`, `accuracy` | Sin descripción específica en el contrato OpenAPI. | `relevance` |
| `relevanceScore` | No | `number` | mínimo 0; máximo 5 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `safetyIssueCode` | No | `string` | longitud máxima 100 | Código del problema de seguridad; su presencia marca la sesión para revisión | `CODIGO_EJEMPLO` |
| `commentRedacted` | No | `string` | Sin restricción adicional declarada | Comentario ya redactado | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /vector-rag/retrieval-sessions/00000000-0000-4000-8000-000000000001/feedback HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "feedbackType": "relevance",
  "relevanceScore": 1,
  "safetyIssueCode": "CODIGO_EJEMPLO",
  "commentRedacted": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FeedbackResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FeedbackResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FeedbackResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FeedbackResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<FeedbackResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FeedbackResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FeedbackResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FeedbackResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FeedbackResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FeedbackResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FeedbackResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "retrievalSessionId": "00000000-0000-4000-8000-000000000001",
  "flagged": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `retrievalSessionId` | Sí | `string` | formato `uuid` | Identificador asociado a retrieval session. | `00000000-0000-4000-8000-000000000001` |
| `flagged` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si el feedback marcó la sesión para revisión | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, AGENT_RUNTIME, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sesión de retrieval no encontrada. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo se puede dar feedback de una sesión completada. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/vector-rag/retrieval-sessions/{id}/feedback"
}
```

---

## 16. POST /vector-rag/retrieval-sessions/{id}/search

- **Módulo:** `vector_rag`
- **Etiqueta OpenAPI:** `vector_rag`
- **Nombre:** Ranquear los candidatos y filtrarlos por consentimiento y etiquetas
- **Operation ID:** `VectorRuntimeController_rankCandidates`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [VectorRuntimeController.rankCandidates](../../src/modules/vector_rag/controllers/vector-runtime.controller.ts)

### Descripción de negocio

Cada candidato recibe una decisión y todas se guardan, también las denegadas y su motivo.


### Descripción del sistema

NestJS resuelve `POST /vector-rag/retrieval-sessions/{id}/search` en `VectorRuntimeController_rankCandidates`. El controlador delega en `RetrievalService.rankCandidates`. Valida el body como `RankCandidatesDto` y consume `application/json`. El tipo de retorno estático es `Promise<RankCandidatesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RankCandidatesDto`; los campos opcionales se omiten.

```http
POST /vector-rag/retrieval-sessions/00000000-0000-4000-8000-000000000001/search HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "candidates": [
    {
      "vectorChunkId": "00000000-0000-4000-8000-000000000001",
      "vectorScore": 1
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `RETRIEVAL_WORKER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `candidates` | Sí | `array<CandidateInputDto>` | mínimo 1 elemento(s); máximo 200 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"vectorChunkId":"00000000-0000-4000-8000-000000000001","vectorScore":1,"lexicalScore":1,"rerankerScore":1}]` |
| `candidates[].vectorChunkId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `candidates[].vectorScore` | Sí | `number` | Sin restricción adicional declarada | Distancia o similitud devuelta por el índice | `1` |
| `candidates[].lexicalScore` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `candidates[].rerankerScore` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `topK` | No | `number` | mínimo 1; máximo 200 | Cuántos de los autorizados se marcan como seleccionados | `10` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /vector-rag/retrieval-sessions/00000000-0000-4000-8000-000000000001/search HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "candidates": [
    {
      "vectorChunkId": "00000000-0000-4000-8000-000000000001",
      "vectorScore": 1,
      "lexicalScore": 1,
      "rerankerScore": 1
    }
  ],
  "topK": 10
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RankCandidatesResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RankCandidatesResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RankCandidatesResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RankCandidatesResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RankCandidatesResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RankCandidatesResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RankCandidatesResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RankCandidatesResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RankCandidatesResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RankCandidatesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RankCandidatesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "retrievalSessionId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "candidates": [
    {
      "vectorChunkId": "00000000-0000-4000-8000-000000000001",
      "rank": 1,
      "authorizationDecision": "valor-ejemplo",
      "selected": true
    }
  ],
  "deniedByReason": {
    "clave": "valor"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `retrievalSessionId` | Sí | `string` | formato `uuid` | Identificador asociado a retrieval session. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `candidates` | Sí | `array<RankedCandidateDto>` | Sin restricción adicional declarada | Valor de candidates mantenido por la instancia. | `[{"vectorChunkId":"00000000-0000-4000-8000-000000000001","rank":1,"authorizationDecision":"valor-ejemplo","selected":true}]` |
| `candidates[].vectorChunkId` | Sí | `string` | formato `uuid` | Identificador asociado a vector chunk. | `00000000-0000-4000-8000-000000000001` |
| `candidates[].rank` | Sí | `number` | Sin restricción adicional declarada | Valor de rank mantenido por la instancia. | `1` |
| `candidates[].authorizationDecision` | Sí | `string` | Sin restricción adicional declarada | Valor de authorization decision mantenido por la instancia. | `valor-ejemplo` |
| `candidates[].selected` | Sí | `boolean` | Sin restricción adicional declarada | Valor de selected mantenido por la instancia. | `true` |
| `deniedByReason` | Sí | `object` | Sin restricción adicional declarada | Candidatos denegados, por motivo | `{"clave":"valor"}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, RETRIEVAL_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sesión de retrieval no encontrada. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 404 | `NOT_FOUND` | Chunk candidato no encontrado. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 404 | `NOT_FOUND` | Documento del chunk no encontrado. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 404 | `NOT_FOUND` | Política de acceso RAG no encontrada. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La sesión ya no está abierta. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 422 | `PRECONDITION_FAILED` | La colección no tiene política de acceso RAG; no se puede consultar. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 422 | `PRECONDITION_FAILED` | La política de acceso RAG no está publicada. | Excepción explícita en src/modules/vector_rag/services/retrieval.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/vector-rag/retrieval-sessions/{id}/search"
}
```

---

