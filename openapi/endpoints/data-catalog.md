<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `data_catalog`

Referencia exhaustiva de 22 operación(es) del módulo `data_catalog`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `data-catalog`, `data-catalog-internal`
- **Controladores:** `DataCatalogController`, `DataCatalogInternalController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /admin/catalog/annotations/{annotationId}/review](#1-post-admin-catalog-annotations-annotationid-review) — Aprobar o rechazar la revisión vigente de una ficha
2. [PUT /admin/catalog/columns/{columnId}/annotation](#2-put-admin-catalog-columns-columnid-annotation) — Crear o editar la ficha de una columna
3. [GET /admin/catalog/columns/{columnId}/evidence](#3-get-admin-catalog-columns-columnid-evidence) — Evidencia de una columna
4. [POST /admin/catalog/columns/{columnId}/evidence](#4-post-admin-catalog-columns-columnid-evidence) — Enlazar evidencia a una columna
5. [GET /admin/catalog/columns/{columnId}/history](#5-get-admin-catalog-columns-columnid-history) — Revisiones y decisiones de la ficha de una columna
6. [GET /admin/catalog/coverage](#6-get-admin-catalog-coverage) — Cobertura explicada por dimensión (técnica, semántica, owner, sensibilidad, revisión)
7. [GET /admin/catalog/objects](#7-get-admin-catalog-objects) — Inventario de tablas y vistas, con estado de su ficha
8. [GET /admin/catalog/objects/{objectId}](#8-get-admin-catalog-objects-objectid) — Ficha técnica, de negocio, cobertura y gobierno de un objeto
9. [PUT /admin/catalog/objects/{objectId}/annotation](#9-put-admin-catalog-objects-objectid-annotation) — Crear o editar la ficha de una tabla (expectedVersion obligatorio)
10. [GET /admin/catalog/objects/{objectId}/changes](#10-get-admin-catalog-objects-objectid-changes) — Historial técnico (cambios detectados por escaneos)
11. [GET /admin/catalog/objects/{objectId}/columns](#11-get-admin-catalog-objects-objectid-columns) — Columnas observadas y sus fichas
12. [GET /admin/catalog/objects/{objectId}/evidence](#12-get-admin-catalog-objects-objectid-evidence) — Evidencia de la tabla
13. [POST /admin/catalog/objects/{objectId}/evidence](#13-post-admin-catalog-objects-objectid-evidence) — Enlazar evidencia a la tabla
14. [GET /admin/catalog/objects/{objectId}/history](#14-get-admin-catalog-objects-objectid-history) — Revisiones y decisiones de la ficha de la tabla
15. [GET /admin/catalog/objects/{objectId}/impact](#15-get-admin-catalog-objects-objectid-impact) — Impacto estructural (FK observadas): qué depende de la tabla y de qué depende
16. [GET /admin/catalog/scans](#16-get-admin-catalog-scans) — Corridas de escaneo, de la más reciente a la más antigua
17. [POST /admin/catalog/scans](#17-post-admin-catalog-scans) — Solicitar un escaneo técnico (202 tras aceptación durable)
18. [GET /admin/catalog/scans/{scanId}](#18-get-admin-catalog-scans-scanid) — Estado, contadores, huella y limitaciones de una corrida
19. [POST /admin/catalog/scans/{scanId}/cancel](#19-post-admin-catalog-scans-scanid-cancel) — Pedir la cancelación
20. [GET /admin/catalog/scans/{scanId}/changes](#20-get-admin-catalog-scans-scanid-changes) — Diff detectado por una corrida
21. [GET /admin/catalog/schemas](#21-get-admin-catalog-schemas) — Resumen por schema del alcance observado
22. [POST /internal/catalog/scans/run-next](#22-post-internal-catalog-scans-run-next) — Reclamar y ejecutar la siguiente corrida de escaneo (worker)

---

## 1. POST /admin/catalog/annotations/{annotationId}/review

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Aprobar o rechazar la revisión vigente de una ficha
- **Operation ID:** `DataCatalogController_review`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.review](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

403 si quien revisa escribió la revisión; 409 si hay una revisión más reciente; 422 sin evidencia o sin comentario de rechazo.


### Descripción del sistema

NestJS resuelve `POST /admin/catalog/annotations/{annotationId}/review` en `DataCatalogController_review`. El controlador delega en `CatalogAnnotationsService.review`. Valida el body como `ReviewAnnotationDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `annotationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReviewAnnotationDto`; los campos opcionales se omiten.

```http
POST /admin/catalog/annotations/00000000-0000-4000-8000-000000000001/review HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "APPROVED",
  "expectedRevisionNo": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_REVIEW_ROLES`.
- Deben ser UUID válidos: `annotationId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `APPROVED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `expectedRevisionNo` | Sí | `number` | mínimo 1 | Revisión que se está decidiendo | `1` |
| `comment` | No | `string` | longitud máxima 2000 | Obligatorio al rechazar | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/catalog/annotations/00000000-0000-4000-8000-000000000001/review HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "APPROVED",
  "expectedRevisionNo": 1,
  "comment": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_REVIEW_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ficha no encontrada | Excepción explícita en src/modules/data_catalog/services/catalog-annotations.service.ts |
| 409 | `CONCURRENCY_CONFLICT` | La ficha tiene una revisión más reciente que la revisada | Excepción explícita en src/modules/data_catalog/services/catalog-annotations.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | violations[0].message | Excepción explícita en src/modules/data_catalog/services/catalog-annotations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/annotations/{annotationId}/review"
}
```

---

## 2. PUT /admin/catalog/columns/{columnId}/annotation

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Crear o editar la ficha de una columna
- **Operation ID:** `DataCatalogController_upsertColumnAnnotation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.upsertColumnAnnotation](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Crear o editar la ficha de una columna. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /admin/catalog/columns/{columnId}/annotation` en `DataCatalogController_upsertColumnAnnotation`. El controlador delega en `CatalogAnnotationsService.upsertForColumn`. Valida el body como `UpsertAnnotationDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `columnId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpsertAnnotationDto`; los campos opcionales se omiten.

```http
PUT /admin/catalog/columns/00000000-0000-4000-8000-000000000001/annotation HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expectedVersion": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_EDIT_ROLES`.
- Deben ser UUID válidos: `columnId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expectedVersion` | Sí | `number` | mínimo 0 | rowVersion leída; 0 si la ficha no existe | `1` |
| `submit` | No | `boolean` | Sin restricción adicional declarada | true envía a revisión (NEEDS_REVIEW); false guarda borrador | `false` |
| `changeReason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `businessName` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `definition` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `purpose` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `existenceRationale` | No | `object` | longitud máxima 4000; admite null | Por qué hace falta persistencia propia | `{}` |
| `rowGrain` | No | `object` | longitud máxima 4000; admite null | Qué representa una fila (sólo tablas) | `{}` |
| `alternativesRationale` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `processSupported` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sourceOfTruth` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `producers` | No | `array<string>` | longitud máxima 200; máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `consumers` | No | `array<string>` | longitud máxima 200; máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `deletionImpact` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `businessOwner` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `dataSteward` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `technicalOwner` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `unit` | No | `object` | longitud máxima 50; admite null | Sólo columnas | `{}` |
| `valueDomain` | No | `object` | longitud máxima 4000; admite null | Sólo columnas | `{}` |
| `nullSemantics` | No | `object` | longitud máxima 4000; admite null | Sólo columnas | `{}` |
| `sensitivity` | No | `string` | valores: `UNKNOWN`, `NONE`, `INTERNAL`, `PII`, `PHI`, `SECRET` | Sin descripción específica en el contrato OpenAPI. | `UNKNOWN` |
| `openQuestions` | No | `array<OpenQuestionDto>` | máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"field":"businessName","question":"valor-ejemplo","owner":"valor-ejemplo","dueDate":"2026-07-31"}]` |
| `openQuestions[].field` | No | `string` | valores: `businessName`, `definition`, `purpose`, `existenceRationale`, `processSupported`, `sourceOfTruth`, `producers`, `consumers`, `deletionImpact`, `businessOwner`, `dataSteward`, `technicalOwner`, `sensitivity`, `openQuestions`, `rowGrain`, `alternativesRationale`, `unit`, `valueDomain`, `nullSemantics` | Campo que queda sin responder | `businessName` |
| `openQuestions[].question` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `openQuestions[].owner` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `openQuestions[].dueDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /admin/catalog/columns/00000000-0000-4000-8000-000000000001/annotation HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expectedVersion": 1,
  "submit": false,
  "changeReason": "Texto descriptivo de ejemplo",
  "businessName": {},
  "definition": {},
  "purpose": {},
  "existenceRationale": {},
  "rowGrain": {},
  "alternativesRationale": {},
  "processSupported": {},
  "sourceOfTruth": {},
  "producers": [
    "valor-ejemplo"
  ],
  "consumers": [
    "valor-ejemplo"
  ],
  "deletionImpact": {},
  "businessOwner": {},
  "dataSteward": {},
  "technicalOwner": {},
  "unit": {},
  "valueDomain": {},
  "nullSemantics": {},
  "sensitivity": "UNKNOWN",
  "openQuestions": [
    {
      "field": "businessName",
      "question": "valor-ejemplo",
      "owner": "valor-ejemplo",
      "dueDate": "2026-07-31"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_EDIT_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Columna de catálogo no encontrada | Excepción explícita en src/modules/data_catalog/services/catalog-annotations.service.ts |
| 409 | `CONCURRENCY_CONFLICT` | La ficha cambió desde que se leyó | Excepción explícita en src/modules/data_catalog/services/catalog-annotations.service.ts |
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
  "path": "/admin/catalog/columns/{columnId}/annotation"
}
```

---

## 3. GET /admin/catalog/columns/{columnId}/evidence

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Evidencia de una columna
- **Operation ID:** `DataCatalogController_listColumnEvidence`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.listColumnEvidence](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Evidencia de una columna. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/columns/{columnId}/evidence` en `DataCatalogController_listColumnEvidence`. El controlador delega en `CatalogAnnotationsService.listEvidenceForColumn`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `columnId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/columns/00000000-0000-4000-8000-000000000001/evidence HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_READ_ROLES`.
- Deben ser UUID válidos: `columnId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/columns/00000000-0000-4000-8000-000000000001/evidence HTTP/1.1
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

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_READ_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Columna de catálogo no encontrada | Excepción explícita en src/modules/data_catalog/services/catalog-annotations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/columns/{columnId}/evidence"
}
```

---

## 4. POST /admin/catalog/columns/{columnId}/evidence

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Enlazar evidencia a una columna
- **Operation ID:** `DataCatalogController_addColumnEvidence`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.addColumnEvidence](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Enlazar evidencia a una columna. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/catalog/columns/{columnId}/evidence` en `DataCatalogController_addColumnEvidence`. El controlador delega en `CatalogAnnotationsService.addEvidenceToColumn`. Valida el body como `AddEvidenceDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `columnId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddEvidenceDto`; los campos opcionales se omiten.

```http
POST /admin/catalog/columns/00000000-0000-4000-8000-000000000001/evidence HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "kind": "SCHEMA_COMMENT",
  "reference": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_EDIT_ROLES`.
- Deben ser UUID válidos: `columnId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `kind` | Sí | `string` | valores: `SCHEMA_COMMENT`, `VAULT_NOTE`, `MIGRATION`, `CODE_REFERENCE`, `OPENAPI`, `OWNER_STATEMENT`, `DOCUMENT` | Sin descripción específica en el contrato OpenAPI. | `SCHEMA_COMMENT` |
| `reference` | Sí | `string` | longitud mínima 3; longitud máxima 1000 | Ruta, URL o identificador verificable. Nunca un secreto. | `valor-ejemplo` |
| `excerpt` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sourceRevision` | No | `string` | longitud máxima 100 | Commit o hash de la fuente | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/catalog/columns/00000000-0000-4000-8000-000000000001/evidence HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "kind": "SCHEMA_COMMENT",
  "reference": "valor-ejemplo",
  "excerpt": "valor-ejemplo",
  "sourceRevision": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_EDIT_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Columna de catálogo no encontrada | Excepción explícita en src/modules/data_catalog/services/catalog-annotations.service.ts |
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
  "path": "/admin/catalog/columns/{columnId}/evidence"
}
```

---

## 5. GET /admin/catalog/columns/{columnId}/history

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Revisiones y decisiones de la ficha de una columna
- **Operation ID:** `DataCatalogController_columnHistory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.columnHistory](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Revisiones y decisiones de la ficha de una columna. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/columns/{columnId}/history` en `DataCatalogController_columnHistory`. El controlador delega en `CatalogAnnotationsService.historyForColumn`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `columnId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/columns/00000000-0000-4000-8000-000000000001/history HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_READ_ROLES`.
- Deben ser UUID válidos: `columnId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/columns/00000000-0000-4000-8000-000000000001/history HTTP/1.1
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

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_READ_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Columna de catálogo no encontrada | Excepción explícita en src/modules/data_catalog/services/catalog-annotations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/columns/{columnId}/history"
}
```

---

## 6. GET /admin/catalog/coverage

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Cobertura explicada por dimensión (técnica, semántica, owner, sensibilidad, revisión)
- **Operation ID:** `DataCatalogController_coverage`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.coverage](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

UNKNOWN sin escaneo terminado; NOT_APPLICABLE con denominador cero. Nunca un porcentaje inventado.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/coverage` en `DataCatalogController_coverage`. El controlador delega en `CatalogQueryService.coverage`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `schema` | query | No | `string` | longitud máxima 63 | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/coverage HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_READ_ROLES`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/coverage?schema=valor-ejemplo HTTP/1.1
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

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_READ_ROLES. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/coverage"
}
```

---

## 7. GET /admin/catalog/objects

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Inventario de tablas y vistas, con estado de su ficha
- **Operation ID:** `DataCatalogController_listObjects`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.listObjects](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Inventario de tablas y vistas, con estado de su ficha. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/objects` en `DataCatalogController_listObjects`. El controlador delega en `CatalogQueryService.listObjects`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto como nextCursor | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `50` |
| `schema` | query | No | `string` | longitud máxima 63 | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `kind` | query | No | `string` | valores: `TABLE`, `PARTITIONED_TABLE`, `VIEW`, `MATERIALIZED_VIEW`, `FOREIGN_TABLE` | Sin descripción específica en OpenAPI. | `TABLE` |
| `observationStatus` | query | No | `string` | valores: `OBSERVED`, `NOT_OBSERVED`, `RETIRED` | Sin descripción específica en OpenAPI. | `OBSERVED` |
| `reviewStatus` | query | No | `string` | valores: `DRAFT`, `NEEDS_REVIEW`, `APPROVED`, `REJECTED`, `NONE` | NONE = sin ficha | `DRAFT` |
| `q` | query | No | `string` | longitud máxima 100 | Nombre técnico o de negocio | `valor-ejemplo` |
| `missing` | query | No | `string` | valores: `purpose`, `existenceRationale`, `rowGrain`, `businessOwner` | Sin descripción específica en OpenAPI. | `purpose` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/objects HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_READ_ROLES`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/objects?cursor=valor-ejemplo&limit=50&schema=valor-ejemplo&kind=TABLE&observationStatus=OBSERVED&reviewStatus=DRAFT&q=valor-ejemplo&missing=purpose HTTP/1.1
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

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_READ_ROLES. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/objects"
}
```

---

## 8. GET /admin/catalog/objects/{objectId}

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Ficha técnica, de negocio, cobertura y gobierno de un objeto
- **Operation ID:** `DataCatalogController_getObject`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.getObject](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Ficha técnica, de negocio, cobertura y gobierno de un objeto. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/objects/{objectId}` en `DataCatalogController_getObject`. El controlador delega en `CatalogQueryService.getObject`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `objectId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_READ_ROLES`.
- Deben ser UUID válidos: `objectId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001 HTTP/1.1
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

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_READ_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto de catálogo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-query.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/objects/{objectId}"
}
```

---

## 9. PUT /admin/catalog/objects/{objectId}/annotation

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Crear o editar la ficha de una tabla (expectedVersion obligatorio)
- **Operation ID:** `DataCatalogController_upsertObjectAnnotation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.upsertObjectAnnotation](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

409 si la ficha cambió desde que se leyó; 422 si falta un campo obligatorio al enviar a revisión o el texto es relleno.


### Descripción del sistema

NestJS resuelve `PUT /admin/catalog/objects/{objectId}/annotation` en `DataCatalogController_upsertObjectAnnotation`. El controlador delega en `CatalogAnnotationsService.upsertForObject`. Valida el body como `UpsertAnnotationDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `objectId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpsertAnnotationDto`; los campos opcionales se omiten.

```http
PUT /admin/catalog/objects/00000000-0000-4000-8000-000000000001/annotation HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expectedVersion": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_EDIT_ROLES`.
- Deben ser UUID válidos: `objectId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expectedVersion` | Sí | `number` | mínimo 0 | rowVersion leída; 0 si la ficha no existe | `1` |
| `submit` | No | `boolean` | Sin restricción adicional declarada | true envía a revisión (NEEDS_REVIEW); false guarda borrador | `false` |
| `changeReason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `businessName` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `definition` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `purpose` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `existenceRationale` | No | `object` | longitud máxima 4000; admite null | Por qué hace falta persistencia propia | `{}` |
| `rowGrain` | No | `object` | longitud máxima 4000; admite null | Qué representa una fila (sólo tablas) | `{}` |
| `alternativesRationale` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `processSupported` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sourceOfTruth` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `producers` | No | `array<string>` | longitud máxima 200; máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `consumers` | No | `array<string>` | longitud máxima 200; máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `deletionImpact` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `businessOwner` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `dataSteward` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `technicalOwner` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `unit` | No | `object` | longitud máxima 50; admite null | Sólo columnas | `{}` |
| `valueDomain` | No | `object` | longitud máxima 4000; admite null | Sólo columnas | `{}` |
| `nullSemantics` | No | `object` | longitud máxima 4000; admite null | Sólo columnas | `{}` |
| `sensitivity` | No | `string` | valores: `UNKNOWN`, `NONE`, `INTERNAL`, `PII`, `PHI`, `SECRET` | Sin descripción específica en el contrato OpenAPI. | `UNKNOWN` |
| `openQuestions` | No | `array<OpenQuestionDto>` | máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"field":"businessName","question":"valor-ejemplo","owner":"valor-ejemplo","dueDate":"2026-07-31"}]` |
| `openQuestions[].field` | No | `string` | valores: `businessName`, `definition`, `purpose`, `existenceRationale`, `processSupported`, `sourceOfTruth`, `producers`, `consumers`, `deletionImpact`, `businessOwner`, `dataSteward`, `technicalOwner`, `sensitivity`, `openQuestions`, `rowGrain`, `alternativesRationale`, `unit`, `valueDomain`, `nullSemantics` | Campo que queda sin responder | `businessName` |
| `openQuestions[].question` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `openQuestions[].owner` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `openQuestions[].dueDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /admin/catalog/objects/00000000-0000-4000-8000-000000000001/annotation HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expectedVersion": 1,
  "submit": false,
  "changeReason": "Texto descriptivo de ejemplo",
  "businessName": {},
  "definition": {},
  "purpose": {},
  "existenceRationale": {},
  "rowGrain": {},
  "alternativesRationale": {},
  "processSupported": {},
  "sourceOfTruth": {},
  "producers": [
    "valor-ejemplo"
  ],
  "consumers": [
    "valor-ejemplo"
  ],
  "deletionImpact": {},
  "businessOwner": {},
  "dataSteward": {},
  "technicalOwner": {},
  "unit": {},
  "valueDomain": {},
  "nullSemantics": {},
  "sensitivity": "UNKNOWN",
  "openQuestions": [
    {
      "field": "businessName",
      "question": "valor-ejemplo",
      "owner": "valor-ejemplo",
      "dueDate": "2026-07-31"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_EDIT_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto de catálogo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-annotations.service.ts |
| 409 | `CONCURRENCY_CONFLICT` | La ficha cambió desde que se leyó | Excepción explícita en src/modules/data_catalog/services/catalog-annotations.service.ts |
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
  "path": "/admin/catalog/objects/{objectId}/annotation"
}
```

---

## 10. GET /admin/catalog/objects/{objectId}/changes

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Historial técnico (cambios detectados por escaneos)
- **Operation ID:** `DataCatalogController_listObjectChanges`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.listObjectChanges](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Historial técnico (cambios detectados por escaneos). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/objects/{objectId}/changes` en `DataCatalogController_listObjectChanges`. El controlador delega en `CatalogQueryService.listObjectChanges`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `objectId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto como nextCursor | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `50` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001/changes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_READ_ROLES`.
- Deben ser UUID válidos: `objectId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001/changes?cursor=valor-ejemplo&limit=50 HTTP/1.1
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

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_READ_ROLES. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/objects/{objectId}/changes"
}
```

---

## 11. GET /admin/catalog/objects/{objectId}/columns

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Columnas observadas y sus fichas
- **Operation ID:** `DataCatalogController_listColumns`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.listColumns](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Columnas observadas y sus fichas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/objects/{objectId}/columns` en `DataCatalogController_listColumns`. El controlador delega en `CatalogQueryService.listColumns`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `objectId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001/columns HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_READ_ROLES`.
- Deben ser UUID válidos: `objectId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001/columns HTTP/1.1
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

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_READ_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto de catálogo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-query.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/objects/{objectId}/columns"
}
```

---

## 12. GET /admin/catalog/objects/{objectId}/evidence

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Evidencia de la tabla
- **Operation ID:** `DataCatalogController_listObjectEvidence`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.listObjectEvidence](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Evidencia de la tabla. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/objects/{objectId}/evidence` en `DataCatalogController_listObjectEvidence`. El controlador delega en `CatalogAnnotationsService.listEvidenceForObject`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `objectId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001/evidence HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_READ_ROLES`.
- Deben ser UUID válidos: `objectId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001/evidence HTTP/1.1
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

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_READ_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto de catálogo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-annotations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/objects/{objectId}/evidence"
}
```

---

## 13. POST /admin/catalog/objects/{objectId}/evidence

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Enlazar evidencia a la tabla
- **Operation ID:** `DataCatalogController_addObjectEvidence`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.addObjectEvidence](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Enlazar evidencia a la tabla. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/catalog/objects/{objectId}/evidence` en `DataCatalogController_addObjectEvidence`. El controlador delega en `CatalogAnnotationsService.addEvidenceToObject`. Valida el body como `AddEvidenceDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `objectId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AddEvidenceDto`; los campos opcionales se omiten.

```http
POST /admin/catalog/objects/00000000-0000-4000-8000-000000000001/evidence HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "kind": "SCHEMA_COMMENT",
  "reference": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_EDIT_ROLES`.
- Deben ser UUID válidos: `objectId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `kind` | Sí | `string` | valores: `SCHEMA_COMMENT`, `VAULT_NOTE`, `MIGRATION`, `CODE_REFERENCE`, `OPENAPI`, `OWNER_STATEMENT`, `DOCUMENT` | Sin descripción específica en el contrato OpenAPI. | `SCHEMA_COMMENT` |
| `reference` | Sí | `string` | longitud mínima 3; longitud máxima 1000 | Ruta, URL o identificador verificable. Nunca un secreto. | `valor-ejemplo` |
| `excerpt` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sourceRevision` | No | `string` | longitud máxima 100 | Commit o hash de la fuente | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/catalog/objects/00000000-0000-4000-8000-000000000001/evidence HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "kind": "SCHEMA_COMMENT",
  "reference": "valor-ejemplo",
  "excerpt": "valor-ejemplo",
  "sourceRevision": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_EDIT_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto de catálogo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-annotations.service.ts |
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
  "path": "/admin/catalog/objects/{objectId}/evidence"
}
```

---

## 14. GET /admin/catalog/objects/{objectId}/history

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Revisiones y decisiones de la ficha de la tabla
- **Operation ID:** `DataCatalogController_objectHistory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.objectHistory](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Revisiones y decisiones de la ficha de la tabla. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/objects/{objectId}/history` en `DataCatalogController_objectHistory`. El controlador delega en `CatalogAnnotationsService.historyForObject`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `objectId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001/history HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_READ_ROLES`.
- Deben ser UUID válidos: `objectId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001/history HTTP/1.1
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

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_READ_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto de catálogo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-annotations.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/objects/{objectId}/history"
}
```

---

## 15. GET /admin/catalog/objects/{objectId}/impact

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Impacto estructural (FK observadas): qué depende de la tabla y de qué depende
- **Operation ID:** `DataCatalogController_impact`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.impact](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Profundidad máx. 5 y 200 nodos; declara truncamiento y alcance. Una FK no es un flujo de datos.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/objects/{objectId}/impact` en `DataCatalogController_impact`. El controlador delega en `CatalogQueryService.impact`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `objectId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `direction` | query | No | `string` | valores: `downstream`, `upstream`, `both` | Sin descripción específica en OpenAPI. | `both` |
| `depth` | query | No | `number` | mínimo 1; máximo 5 | Sin descripción específica en OpenAPI. | `2` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001/impact HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_READ_ROLES`.
- Deben ser UUID válidos: `objectId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001/impact?direction=both&depth=2 HTTP/1.1
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

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_READ_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto de catálogo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-query.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/objects/{objectId}/impact"
}
```

---

## 16. GET /admin/catalog/scans

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Corridas de escaneo, de la más reciente a la más antigua
- **Operation ID:** `DataCatalogController_listScans`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.listScans](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Corridas de escaneo, de la más reciente a la más antigua. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/scans` en `DataCatalogController_listScans`. El controlador delega en `CatalogQueryService.listScans`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto como nextCursor | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `50` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/scans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_READ_ROLES`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/scans?cursor=valor-ejemplo&limit=50 HTTP/1.1
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

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_READ_ROLES. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/scans"
}
```

---

## 17. POST /admin/catalog/scans

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Solicitar un escaneo técnico (202 tras aceptación durable)
- **Operation ID:** `DataCatalogController_requestScan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.requestScan](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

El worker data_catalog lo ejecuta. 409 si ya hay uno vivo de la misma fuente.


### Descripción del sistema

NestJS resuelve `POST /admin/catalog/scans` en `DataCatalogController_requestScan`. El controlador delega en `CatalogScanService.request`. No recibe body. El tipo de retorno estático es `Promise<ScanAcceptedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `Idempotency-Key` | header | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /admin/catalog/scans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_SCAN_ROLES`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /admin/catalog/scans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Idempotency-Key: valor-ejemplo
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 202 | Solicitud aceptada para procesamiento asíncrono. | `Promise<ScanAcceptedDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<ScanAcceptedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ScanAcceptedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ScanAcceptedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ScanAcceptedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ScanAcceptedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ScanAcceptedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ScanAcceptedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ScanAcceptedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "scanId": "00000000-0000-4000-8000-000000000001",
  "status": "QUEUED",
  "acceptedAt": "valor-ejemplo",
  "statusUrl": "valor-ejemplo",
  "created": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `scanId` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | valores: `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELLED` | Sin descripción específica en el contrato OpenAPI. | `QUEUED` |
| `acceptedAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `statusUrl` | Sí | `string` | Sin restricción adicional declarada | Ruta relativa para consultar el estado | `valor-ejemplo` |
| `created` | Sí | `boolean` | Sin restricción adicional declarada | false si la clave de idempotencia devolvió una corrida existente | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_SCAN_ROLES. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya hay un escaneo en curso de esta fuente | Excepción explícita en src/modules/data_catalog/services/catalog-scan.service.ts |
| 409 | `CONFLICT` | Otra petición aceptó un escaneo de esta fuente al mismo tiempo | Excepción explícita en src/modules/data_catalog/services/catalog-scan.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/scans"
}
```

---

## 18. GET /admin/catalog/scans/{scanId}

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Estado, contadores, huella y limitaciones de una corrida
- **Operation ID:** `DataCatalogController_getScan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.getScan](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Estado, contadores, huella y limitaciones de una corrida. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/scans/{scanId}` en `DataCatalogController_getScan`. El controlador delega en `CatalogQueryService.getScan`. No recibe body. El tipo de retorno estático es `Promise<ScanViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `scanId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/scans/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_READ_ROLES`.
- Deben ser UUID válidos: `scanId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/scans/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ScanViewDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ScanViewDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ScanViewDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ScanViewDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ScanViewDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ScanViewDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ScanViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ScanViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "sourceCode": "CODIGO_EJEMPLO",
  "mode": "valor-ejemplo",
  "status": "ok",
  "requestedAt": "valor-ejemplo",
  "requestedByUserId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "valor-ejemplo",
  "finishedAt": "valor-ejemplo",
  "cancelRequestedAt": "valor-ejemplo",
  "attempt": 1,
  "connectorVersion": "valor-ejemplo",
  "engineVersion": "valor-ejemplo",
  "snapshotHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "counters": {
    "clave": "valor"
  },
  "excludedSchemas": [
    "valor-ejemplo"
  ],
  "limitations": [
    {
      "clave": "valor"
    }
  ],
  "error": {
    "code": "CODIGO_EJEMPLO",
    "message": "valor-ejemplo"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sourceCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `mode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `ok` |
| `requestedAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `requestedByUserId` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `startedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `finishedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cancelRequestedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `attempt` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `connectorVersion` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `engineVersion` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `snapshotHash` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `counters` | No | `object` | admite null | null mientras no termina | `{"clave":"valor"}` |
| `excludedSchemas` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `limitations` | Sí | `array<object>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"clave":"valor"}]` |
| `error` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","message":"valor-ejemplo"}` |
| `error.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `error.message` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_READ_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Escaneo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-query.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/scans/{scanId}"
}
```

---

## 19. POST /admin/catalog/scans/{scanId}/cancel

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Pedir la cancelación
- **Operation ID:** `DataCatalogController_cancelScan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.cancelScan](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

En cola se cancela ya; en marcha queda cancelRequestedAt y el runner la confirma.


### Descripción del sistema

NestJS resuelve `POST /admin/catalog/scans/{scanId}/cancel` en `DataCatalogController_cancelScan`. El controlador delega en `CatalogScanService.cancel`. No recibe body. El tipo de retorno estático es `Promise<ScanViewDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `scanId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /admin/catalog/scans/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_SCAN_ROLES`.
- Deben ser UUID válidos: `scanId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /admin/catalog/scans/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 202 | Solicitud aceptada para procesamiento asíncrono. | `Promise<ScanViewDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ScanViewDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ScanViewDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ScanViewDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ScanViewDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ScanViewDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ScanViewDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ScanViewDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ScanViewDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ScanViewDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "sourceCode": "CODIGO_EJEMPLO",
  "mode": "valor-ejemplo",
  "status": "ok",
  "requestedAt": "valor-ejemplo",
  "requestedByUserId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "valor-ejemplo",
  "finishedAt": "valor-ejemplo",
  "cancelRequestedAt": "valor-ejemplo",
  "attempt": 1,
  "connectorVersion": "valor-ejemplo",
  "engineVersion": "valor-ejemplo",
  "snapshotHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "counters": {
    "clave": "valor"
  },
  "excludedSchemas": [
    "valor-ejemplo"
  ],
  "limitations": [
    {
      "clave": "valor"
    }
  ],
  "error": {
    "code": "CODIGO_EJEMPLO",
    "message": "valor-ejemplo"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sourceCode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `mode` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `ok` |
| `requestedAt` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `requestedByUserId` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `startedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `finishedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cancelRequestedAt` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `attempt` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `connectorVersion` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `engineVersion` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `snapshotHash` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `counters` | No | `object` | admite null | null mientras no termina | `{"clave":"valor"}` |
| `excludedSchemas` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `limitations` | Sí | `array<object>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"clave":"valor"}]` |
| `error` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CODIGO_EJEMPLO","message":"valor-ejemplo"}` |
| `error.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `error.message` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_SCAN_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Escaneo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-scan.service.ts |
| 409 | `CONFLICT` | El escaneo ya terminó | Excepción explícita en src/modules/data_catalog/services/catalog-scan.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/scans/{scanId}/cancel"
}
```

---

## 20. GET /admin/catalog/scans/{scanId}/changes

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Diff detectado por una corrida
- **Operation ID:** `DataCatalogController_listScanChanges`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.listScanChanges](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Diff detectado por una corrida. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/scans/{scanId}/changes` en `DataCatalogController_listScanChanges`. El controlador delega en `CatalogQueryService.listScanChanges`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `scanId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto como nextCursor | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `50` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/scans/00000000-0000-4000-8000-000000000001/changes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_READ_ROLES`.
- Deben ser UUID válidos: `scanId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/scans/00000000-0000-4000-8000-000000000001/changes?cursor=valor-ejemplo&limit=50 HTTP/1.1
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

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_READ_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Escaneo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-query.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/scans/{scanId}/changes"
}
```

---

## 21. GET /admin/catalog/schemas

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog`
- **Nombre:** Resumen por schema del alcance observado
- **Operation ID:** `DataCatalogController_listSchemas`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogController.listSchemas](../../src/modules/data_catalog/controllers/data-catalog.controller.ts)

### Descripción de negocio

Resumen por schema del alcance observado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/schemas` en `DataCatalogController_listSchemas`. El controlador delega en `CatalogQueryService.listSchemas`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/schemas HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...CATALOG_READ_ROLES`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/schemas HTTP/1.1
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

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...CATALOG_READ_ROLES. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/schemas"
}
```

---

## 22. POST /internal/catalog/scans/run-next

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog-internal`
- **Nombre:** Reclamar y ejecutar la siguiente corrida de escaneo (worker)
- **Operation ID:** `DataCatalogInternalController_runNext`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [DataCatalogInternalController.runNext](../../src/modules/data_catalog/controllers/data-catalog-internal.controller.ts)

### Descripción de negocio

Reclama con lease y SKIP LOCKED; recupera corridas cuyo worker murió. claimed=0 si no hay trabajo.


### Descripción del sistema

NestJS resuelve `POST /internal/catalog/scans/run-next` en `DataCatalogInternalController_runNext`. El controlador delega en `CatalogScanService.runNext`. No recibe body. El tipo de retorno estático es `Promise<RunNextResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /internal/catalog/scans/run-next HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /internal/catalog/scans/run-next HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RunNextResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "claimed": 1,
  "scanId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "fenced": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `claimed` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `scanId` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `ok` |
| `fenced` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/catalog/scans/run-next"
}
```

---

