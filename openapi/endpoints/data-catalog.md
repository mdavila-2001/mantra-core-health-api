<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `data_catalog`

Referencia exhaustiva de 38 operación(es) del módulo `data_catalog`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `admin-catalog`, `admin-portal`, `data-catalog-internal`
- **Controladores:** `AdminCatalogController`, `AdminPortalController`, `InternalCatalogInventoryController`, `InternalCatalogScansController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /admin/catalog/annotations/{id}/review](#1-post-admin-catalog-annotations-id-review) — Aprueba o rechaza la revisión vigente de una ficha
2. [POST /admin/catalog/classification/run](#2-post-admin-catalog-classification-run) — Corre la clasificación automática de sensibilidad sobre las columnas observadas
3. [PUT /admin/catalog/columns/{id}/annotation](#3-put-admin-catalog-columns-id-annotation) — Crea o edita la ficha de una columna (con versión esperada); guardar a mano saca la ficha de AUTO_DETECTED
4. [GET /admin/catalog/columns/{id}/evidence](#4-get-admin-catalog-columns-id-evidence) — Evidencia enlazada a una columna
5. [POST /admin/catalog/columns/{id}/evidence](#5-post-admin-catalog-columns-id-evidence) — Enlaza evidencia a una columna
6. [GET /admin/catalog/coverage](#6-get-admin-catalog-coverage) — Cobertura del catálogo por dimensión, calculada por el servidor
7. [GET /admin/catalog/objects](#7-get-admin-catalog-objects) — Objetos del catálogo, paginados por cursor
8. [GET /admin/catalog/objects/{id}](#8-get-admin-catalog-objects-id) — Ficha técnica, observación, ficha curada, cobertura y gobierno de un objeto
9. [PUT /admin/catalog/objects/{id}/annotation](#9-put-admin-catalog-objects-id-annotation) — Crea o edita la ficha de un objeto (con versión esperada)
10. [GET /admin/catalog/objects/{id}/changes](#10-get-admin-catalog-objects-id-changes) — Cambios que los escaneos detectaron en un objeto
11. [GET /admin/catalog/objects/{id}/columns](#11-get-admin-catalog-objects-id-columns) — Columnas observadas de un objeto, con su ficha si la tienen
12. [GET /admin/catalog/objects/{id}/evidence](#12-get-admin-catalog-objects-id-evidence) — Evidencia enlazada a un objeto
13. [POST /admin/catalog/objects/{id}/evidence](#13-post-admin-catalog-objects-id-evidence) — Enlaza evidencia a un objeto
14. [GET /admin/catalog/objects/{id}/history](#14-get-admin-catalog-objects-id-history) — Revisiones y decisiones de la ficha de un objeto
15. [GET /admin/catalog/objects/{id}/impact](#15-get-admin-catalog-objects-id-impact) — Quién referencia a un objeto y a quién referencia, por claves foráneas observadas
16. [GET /admin/catalog/permission-drift](#16-get-admin-catalog-permission-drift) — Deriva de permisos: roles que las rutas exigen contra los que la API siembra
17. [GET /admin/catalog/scans](#17-get-admin-catalog-scans) — Escaneos, del más reciente al más antiguo
18. [POST /admin/catalog/scans](#18-post-admin-catalog-scans) — Pide un escaneo de la base primaria (se ejecuta fuera de la petición)
19. [GET /admin/catalog/scans/{id}](#19-get-admin-catalog-scans-id) — Un escaneo
20. [GET /admin/catalog/schemas](#20-get-admin-catalog-schemas) — Schemas observados, con cuántos objetos tienen ficha y cuántos están aprobados
21. [GET /admin/portal/catalogo/deriva](#21-get-admin-portal-catalogo-deriva) — Deriva entre el DDL del modelo y las entidades del ORM
22. [GET /admin/portal/catalogo/tablas](#22-get-admin-portal-catalogo-tablas) — Listar las tablas del catálogo de datos
23. [GET /admin/portal/catalogo/tablas/{schema}/{tabla}](#23-get-admin-portal-catalogo-tablas-schema-tabla) — Ver la ficha de una tabla
24. [GET /admin/portal/flujos](#24-get-admin-portal-flujos) — Listar los procesos de negocio
25. [GET /admin/portal/flujos/{codigo}](#25-get-admin-portal-flujos-codigo) — Ver un proceso con sus etapas y máquinas de estado
26. [GET /admin/portal/flujos/{codigo}/grafo](#26-get-admin-portal-flujos-codigo-grafo) — Ver el grafo de un proceso
27. [GET /admin/portal/flujos/hallazgos](#27-get-admin-portal-flujos-hallazgos) — Resumen de hallazgos del mapa
28. [GET /admin/portal/flujos/hallazgos/{id}](#28-get-admin-portal-flujos-hallazgos-id) — Ver los casos de un hallazgo
29. [GET /admin/portal/flujos/mapa](#29-get-admin-portal-flujos-mapa) — Mapa de operaciones con sus señales
30. [GET /admin/portal/glosario](#30-get-admin-portal-glosario) — Buscar en el glosario
31. [GET /admin/portal/linaje](#31-get-admin-portal-linaje) — Métricas del linaje de datos
32. [GET /admin/portal/linaje/tablas/{schema}/{tabla}](#32-get-admin-portal-linaje-tablas-schema-tabla) — Linaje de una tabla
33. [GET /admin/portal/operaciones](#33-get-admin-portal-operaciones) — Listar las operaciones HTTP del sistema
34. [GET /admin/portal/operaciones/{id}](#34-get-admin-portal-operaciones-id) — Ver la ficha de una operación
35. [GET /admin/portal/operaciones/{id}/arbol](#35-get-admin-portal-operaciones-id-arbol) — Ver el árbol de decisión de una operación
36. [GET /admin/portal/version](#36-get-admin-portal-version) — Versión y tamaño del inventario publicado
37. [POST /internal/catalog/inventory/import](#37-post-internal-catalog-inventory-import) — Importa el inventario de la API a las tablas de operaciones y procesos (worker)
38. [POST /internal/catalog/scans/run-next](#38-post-internal-catalog-scans-run-next) — Sonda: reclama y ejecuta el siguiente escaneo (worker)

---

## 1. POST /admin/catalog/annotations/{id}/review

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Aprueba o rechaza la revisión vigente de una ficha
- **Operation ID:** `AdminCatalogController_review`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.review](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Aprueba o rechaza la revisión vigente de una ficha. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/catalog/annotations/{id}/review` en `AdminCatalogController_review`. El controlador delega en `CatalogGovernanceService.review`. Valida el body como `ReviewInputDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReviewInputDto`; los campos opcionales se omiten.

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
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DATA_STEWARD`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `APPROVED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `expectedRevisionNo` | Sí | `number` | mínimo 1 | Revisión que se revisó (`currentRevisionNo`); si hay una más reciente, 409 | `1` |
| `comment` | No | `string` | longitud máxima 2000 | Obligatorio, de al menos 10 caracteres, al rechazar | `valor-ejemplo` |

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
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Quien escribió la revisión no la decide (`SELF_REVIEW`) | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Hay una revisión más reciente que la revisada | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | No está en revisión, falta evidencia o el rechazo no explica | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Ficha no encontrada | Excepción explícita en src/modules/data_catalog/services/catalog-governance.service.ts |
| 409 | `CONCURRENCY_CONFLICT` | message | Excepción explícita en src/modules/data_catalog/services/catalog-governance.service.ts |
| 409 | `CONCURRENCY_CONFLICT` | La ficha cambió mientras se revisaba | Excepción explícita en src/modules/data_catalog/services/catalog-governance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | message | Excepción explícita en src/modules/data_catalog/services/catalog-governance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/annotations/{id}/review"
}
```

---

## 2. POST /admin/catalog/classification/run

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Corre la clasificación automática de sensibilidad sobre las columnas observadas
- **Operation ID:** `AdminCatalogController_runClassification`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.runClassification](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Crea fichas de columna en AUTO_DETECTED (certeza) o NEEDS_REVIEW (duda). Nunca baja un nivel ni pisa fichas escritas por una persona o que ya salieron de AUTO_DETECTED.


### Descripción del sistema

NestJS resuelve `POST /admin/catalog/classification/run` en `AdminCatalogController_runClassification`. El controlador delega en `CatalogClassificationService.run`. Valida el body como `ClassificationRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<ClassificationRunResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ClassificationRunDto`; los campos opcionales se omiten.

```http
POST /admin/catalog/classification/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DATA_STEWARD`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `schema` | No | `string` | longitud máxima 100 | Limita la corrida a un schema | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/catalog/classification/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "schema": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ClassificationRunResultDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<ClassificationRunResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ClassificationRunResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ClassificationRunResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ClassificationRunResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ClassificationRunResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ClassificationRunResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ClassificationRunResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ClassificationRunResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ClassificationRunResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ClassificationRunResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "examined": 1,
  "unclassified": 1,
  "created": 1,
  "raised": 1,
  "sentToReview": 1,
  "skippedManual": 1,
  "skippedReviewed": 1,
  "skippedNotHigher": 1,
  "conflicts": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `examined` | Sí | `number` | Sin restricción adicional declarada | Columnas observadas que se miraron | `1` |
| `unclassified` | Sí | `number` | Sin restricción adicional declarada | Columnas que ninguna regla reconoció: quedan sin clasificar | `1` |
| `created` | Sí | `number` | Sin restricción adicional declarada | Fichas nuevas | `1` |
| `raised` | Sí | `number` | Sin restricción adicional declarada | Fichas de la máquina subidas a un nivel más alto | `1` |
| `sentToReview` | Sí | `number` | Sin restricción adicional declarada | De las creadas o subidas, las que quedaron en NEEDS_REVIEW por duda | `1` |
| `skippedManual` | Sí | `number` | Sin restricción adicional declarada | No tocadas: las escribió una persona | `1` |
| `skippedReviewed` | Sí | `number` | Sin restricción adicional declarada | No tocadas: ya salieron de AUTO_DETECTED | `1` |
| `skippedNotHigher` | Sí | `number` | Sin restricción adicional declarada | No tocadas: la propuesta no era más alta (nunca baja) | `1` |
| `conflicts` | Sí | `number` | Sin restricción adicional declarada | No escritas: otra petición cambió la ficha antes | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD. | Roles/tenant/guards de autorización |
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
  "path": "/admin/catalog/classification/run"
}
```

---

## 3. PUT /admin/catalog/columns/{id}/annotation

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Crea o edita la ficha de una columna (con versión esperada); guardar a mano saca la ficha de AUTO_DETECTED
- **Operation ID:** `AdminCatalogController_saveColumnAnnotation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.saveColumnAnnotation](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Crea o edita la ficha de una columna (con versión esperada); guardar a mano saca la ficha de AUTO_DETECTED. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /admin/catalog/columns/{id}/annotation` en `AdminCatalogController_saveColumnAnnotation`. El controlador delega en `CatalogGovernanceService.saveColumnAnnotation`. Valida el body como `AnnotationPatchDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AnnotationPatchDto`; los campos opcionales se omiten.

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
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DATA_STEWARD`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expectedVersion` | Sí | `number` | mínimo 0 | Versión de la ficha que se leyó (`version`); 0 para crearla. Si cambió, 409 | `1` |
| `submit` | No | `boolean` | Sin restricción adicional declarada | Enviarla a revisión: exige propósito, razón de existir y grano de fila (o declararlos como preguntas abiertas) | `true` |
| `changeReason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `businessName` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `definition` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `purpose` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `existenceRationale` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `rowGrain` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `alternativesRationale` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `deletionImpact` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `businessOwner` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `dataSteward` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `technicalOwner` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `unit` | No | `object` | longitud máxima 100; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `valueDomain` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `nullSemantics` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sensitivity` | No | `string` | valores: `UNKNOWN`, `ANONYMIZED`, `PUBLIC`, `INTERNAL`, `PSEUDONYMIZED`, `PERSONAL`, `PHI_IDENTIFIER`, `PHI_SENSITIVE`, `PHI_SPECIAL`, `CREDENTIAL` | Sin descripción específica en el contrato OpenAPI. | `UNKNOWN` |
| `consumers` | No | `array<string>` | longitud máxima 200; máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `openQuestions` | No | `array<OpenQuestionDto>` | máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"field":"valor-ejemplo","question":"valor-ejemplo","owner":"valor-ejemplo","dueDate":"valor-ejemplo"}]` |
| `openQuestions[].field` | No | `string` | longitud máxima 60 | Campo de la ficha sobre el que es la pregunta | `valor-ejemplo` |
| `openQuestions[].question` | No | `string` | longitud mínima 3; longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `openQuestions[].owner` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `openQuestions[].dueDate` | No | `string` | Sin restricción adicional declarada | Fecha ISO 8601 | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /admin/catalog/columns/00000000-0000-4000-8000-000000000001/annotation HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expectedVersion": 1,
  "submit": true,
  "changeReason": "Texto descriptivo de ejemplo",
  "businessName": {},
  "definition": {},
  "purpose": {},
  "existenceRationale": {},
  "rowGrain": {},
  "alternativesRationale": {},
  "deletionImpact": {},
  "businessOwner": {},
  "dataSteward": {},
  "technicalOwner": {},
  "unit": {},
  "valueDomain": {},
  "nullSemantics": {},
  "sensitivity": "UNKNOWN",
  "consumers": [
    "valor-ejemplo"
  ],
  "openQuestions": [
    {
      "field": "valor-ejemplo",
      "question": "valor-ejemplo",
      "owner": "valor-ejemplo",
      "dueDate": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | No existe la columna | `no declarado` | No |
| 409 | La ficha cambió desde que se leyó (`CONCURRENCY_CONFLICT`) | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | No puede enviarse a revisión: falta la definición (`VALIDATION_FAILED`, `details.violations`) | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Columna del catálogo no encontrada | Excepción explícita en src/modules/data_catalog/services/catalog-governance.service.ts |
| 409 | `CONCURRENCY_CONFLICT` | La ficha cambió desde que se leyó | Excepción explícita en src/modules/data_catalog/services/catalog-governance.service.ts |
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
  "path": "/admin/catalog/columns/{id}/annotation"
}
```

---

## 4. GET /admin/catalog/columns/{id}/evidence

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Evidencia enlazada a una columna
- **Operation ID:** `AdminCatalogController_columnEvidence`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.columnEvidence](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Evidencia enlazada a una columna. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/columns/{id}/evidence` en `AdminCatalogController_columnEvidence`. El controlador delega en `CatalogReadService.columnEvidence`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/columns/00000000-0000-4000-8000-000000000001/evidence HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
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
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | No existe la columna | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Columna del catálogo no encontrada | Excepción explícita en src/modules/data_catalog/services/catalog-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/columns/{id}/evidence"
}
```

---

## 5. POST /admin/catalog/columns/{id}/evidence

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Enlaza evidencia a una columna
- **Operation ID:** `AdminCatalogController_addColumnEvidence`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.addColumnEvidence](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Enlaza evidencia a una columna. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/catalog/columns/{id}/evidence` en `AdminCatalogController_addColumnEvidence`. El controlador delega en `CatalogGovernanceService.addColumnEvidence`. Valida el body como `DataCatalogEvidenceInputDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DataCatalogEvidenceInputDto`; los campos opcionales se omiten.

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
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DATA_STEWARD`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `kind` | Sí | `string` | valores: `SCHEMA_COMMENT`, `VAULT_NOTE`, `MIGRATION`, `CODE_REFERENCE`, `OPENAPI`, `OWNER_STATEMENT`, `DOCUMENT` | Sin descripción específica en el contrato OpenAPI. | `SCHEMA_COMMENT` |
| `reference` | Sí | `string` | longitud mínima 3; longitud máxima 2000 | Dónde está la evidencia: ruta, enlace, identificador | `valor-ejemplo` |
| `excerpt` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sourceRevision` | No | `string` | longitud máxima 200 | Revisión del documento o commit de donde se tomó | `valor-ejemplo` |

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
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | No existe la columna | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Columna del catálogo no encontrada | Excepción explícita en src/modules/data_catalog/services/catalog-governance.service.ts |
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
  "path": "/admin/catalog/columns/{id}/evidence"
}
```

---

## 6. GET /admin/catalog/coverage

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Cobertura del catálogo por dimensión, calculada por el servidor
- **Operation ID:** `AdminCatalogController_coverage`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.coverage](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Cobertura del catálogo por dimensión, calculada por el servidor. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/coverage` en `AdminCatalogController_coverage`. El controlador delega en `CatalogReadService.coverage`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `schema` | query | No | `string` | Sin restricción adicional declarada | Limita la cobertura a un schema | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/coverage HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
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
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
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
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Objetos del catálogo, paginados por cursor
- **Operation ID:** `AdminCatalogController_objects`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.objects](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Objetos del catálogo, paginados por cursor. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/objects` en `AdminCatalogController_objects`. El controlador delega en `CatalogReadService.objects`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `cursor` | query | No | `string` | longitud máxima 600 | Cursor opaco de la página anterior (`nextCursor`) | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Filas por página | `50` |
| `schema` | query | No | `string` | Sin restricción adicional declarada | Schema de PostgreSQL | `valor-ejemplo` |
| `kind` | query | No | `string` | valores: `TABLE`, `PARTITIONED_TABLE`, `VIEW`, `MATERIALIZED_VIEW`, `FOREIGN_TABLE` | Sin descripción específica en OpenAPI. | `TABLE` |
| `observationStatus` | query | No | `string` | valores: `OBSERVED`, `NOT_OBSERVED`, `RETIRED` | Sin descripción específica en OpenAPI. | `OBSERVED` |
| `reviewStatus` | query | No | `string` | valores: `AUTO_DETECTED`, `DRAFT`, `NEEDS_REVIEW`, `APPROVED`, `REJECTED`, `NONE` | `NONE`: objetos sin ficha | `AUTO_DETECTED` |
| `q` | query | No | `string` | longitud máxima 120 | Busca en `schema.objeto` y en el nombre de negocio | `valor-ejemplo` |
| `missing` | query | No | `string` | valores: `purpose`, `existenceRationale`, `rowGrain`, `businessOwner` | Sólo los objetos a los que les falta ese dato de la ficha | `purpose` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/objects HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/objects?cursor=valor-ejemplo&limit=50&schema=valor-ejemplo&kind=TABLE&observationStatus=OBSERVED&reviewStatus=AUTO_DETECTED&q=valor-ejemplo&missing=purpose HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 400 | `VALIDATION_FAILED` | El cursor de paginación no es válido | Excepción explícita en src/modules/data_catalog/services/catalog-read.service.ts |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
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

## 8. GET /admin/catalog/objects/{id}

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Ficha técnica, observación, ficha curada, cobertura y gobierno de un objeto
- **Operation ID:** `AdminCatalogController_object`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.object](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Ficha técnica, observación, ficha curada, cobertura y gobierno de un objeto. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/objects/{id}` en `AdminCatalogController_object`. El controlador delega en `CatalogReadService.objectDetail`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
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
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | No existe el objeto | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto del catálogo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/objects/{id}"
}
```

---

## 9. PUT /admin/catalog/objects/{id}/annotation

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Crea o edita la ficha de un objeto (con versión esperada)
- **Operation ID:** `AdminCatalogController_saveAnnotation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.saveAnnotation](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Crea o edita la ficha de un objeto (con versión esperada). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /admin/catalog/objects/{id}/annotation` en `AdminCatalogController_saveAnnotation`. El controlador delega en `CatalogGovernanceService.saveAnnotation`. Valida el body como `AnnotationPatchDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AnnotationPatchDto`; los campos opcionales se omiten.

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
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DATA_STEWARD`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expectedVersion` | Sí | `number` | mínimo 0 | Versión de la ficha que se leyó (`version`); 0 para crearla. Si cambió, 409 | `1` |
| `submit` | No | `boolean` | Sin restricción adicional declarada | Enviarla a revisión: exige propósito, razón de existir y grano de fila (o declararlos como preguntas abiertas) | `true` |
| `changeReason` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `businessName` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `definition` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `purpose` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `existenceRationale` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `rowGrain` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `alternativesRationale` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `deletionImpact` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `businessOwner` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `dataSteward` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `technicalOwner` | No | `object` | longitud máxima 200; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `unit` | No | `object` | longitud máxima 100; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `valueDomain` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `nullSemantics` | No | `object` | longitud máxima 4000; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `sensitivity` | No | `string` | valores: `UNKNOWN`, `ANONYMIZED`, `PUBLIC`, `INTERNAL`, `PSEUDONYMIZED`, `PERSONAL`, `PHI_IDENTIFIER`, `PHI_SENSITIVE`, `PHI_SPECIAL`, `CREDENTIAL` | Sin descripción específica en el contrato OpenAPI. | `UNKNOWN` |
| `consumers` | No | `array<string>` | longitud máxima 200; máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `openQuestions` | No | `array<OpenQuestionDto>` | máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"field":"valor-ejemplo","question":"valor-ejemplo","owner":"valor-ejemplo","dueDate":"valor-ejemplo"}]` |
| `openQuestions[].field` | No | `string` | longitud máxima 60 | Campo de la ficha sobre el que es la pregunta | `valor-ejemplo` |
| `openQuestions[].question` | No | `string` | longitud mínima 3; longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `openQuestions[].owner` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `openQuestions[].dueDate` | No | `string` | Sin restricción adicional declarada | Fecha ISO 8601 | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /admin/catalog/objects/00000000-0000-4000-8000-000000000001/annotation HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expectedVersion": 1,
  "submit": true,
  "changeReason": "Texto descriptivo de ejemplo",
  "businessName": {},
  "definition": {},
  "purpose": {},
  "existenceRationale": {},
  "rowGrain": {},
  "alternativesRationale": {},
  "deletionImpact": {},
  "businessOwner": {},
  "dataSteward": {},
  "technicalOwner": {},
  "unit": {},
  "valueDomain": {},
  "nullSemantics": {},
  "sensitivity": "UNKNOWN",
  "consumers": [
    "valor-ejemplo"
  ],
  "openQuestions": [
    {
      "field": "valor-ejemplo",
      "question": "valor-ejemplo",
      "owner": "valor-ejemplo",
      "dueDate": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | La ficha cambió desde que se leyó (`CONCURRENCY_CONFLICT`) | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | No puede enviarse a revisión: faltan respuestas (`VALIDATION_FAILED`, `details.violations`) | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto del catálogo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-governance.service.ts |
| 409 | `CONCURRENCY_CONFLICT` | La ficha cambió desde que se leyó | Excepción explícita en src/modules/data_catalog/services/catalog-governance.service.ts |
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
  "path": "/admin/catalog/objects/{id}/annotation"
}
```

---

## 10. GET /admin/catalog/objects/{id}/changes

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Cambios que los escaneos detectaron en un objeto
- **Operation ID:** `AdminCatalogController_changes`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.changes](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Cambios que los escaneos detectaron en un objeto. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/objects/{id}/changes` en `AdminCatalogController_changes`. El controlador delega en `CatalogReadService.changes`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | No | `string` | longitud máxima 600 | Cursor opaco de la página anterior (`nextCursor`) | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Filas por página | `50` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001/changes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
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
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto del catálogo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/objects/{id}/changes"
}
```

---

## 11. GET /admin/catalog/objects/{id}/columns

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Columnas observadas de un objeto, con su ficha si la tienen
- **Operation ID:** `AdminCatalogController_columns`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.columns](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Columnas observadas de un objeto, con su ficha si la tienen. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/objects/{id}/columns` en `AdminCatalogController_columns`. El controlador delega en `CatalogReadService.columns`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001/columns HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
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
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto del catálogo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/objects/{id}/columns"
}
```

---

## 12. GET /admin/catalog/objects/{id}/evidence

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Evidencia enlazada a un objeto
- **Operation ID:** `AdminCatalogController_evidence`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.evidence](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Evidencia enlazada a un objeto. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/objects/{id}/evidence` en `AdminCatalogController_evidence`. El controlador delega en `CatalogReadService.evidence`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001/evidence HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
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
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto del catálogo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/objects/{id}/evidence"
}
```

---

## 13. POST /admin/catalog/objects/{id}/evidence

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Enlaza evidencia a un objeto
- **Operation ID:** `AdminCatalogController_addEvidence`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.addEvidence](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Enlaza evidencia a un objeto. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/catalog/objects/{id}/evidence` en `AdminCatalogController_addEvidence`. El controlador delega en `CatalogGovernanceService.addEvidence`. Valida el body como `DataCatalogEvidenceInputDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DataCatalogEvidenceInputDto`; los campos opcionales se omiten.

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
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DATA_STEWARD`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `kind` | Sí | `string` | valores: `SCHEMA_COMMENT`, `VAULT_NOTE`, `MIGRATION`, `CODE_REFERENCE`, `OPENAPI`, `OWNER_STATEMENT`, `DOCUMENT` | Sin descripción específica en el contrato OpenAPI. | `SCHEMA_COMMENT` |
| `reference` | Sí | `string` | longitud mínima 3; longitud máxima 2000 | Dónde está la evidencia: ruta, enlace, identificador | `valor-ejemplo` |
| `excerpt` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sourceRevision` | No | `string` | longitud máxima 200 | Revisión del documento o commit de donde se tomó | `valor-ejemplo` |

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
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto del catálogo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-governance.service.ts |
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
  "path": "/admin/catalog/objects/{id}/evidence"
}
```

---

## 14. GET /admin/catalog/objects/{id}/history

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Revisiones y decisiones de la ficha de un objeto
- **Operation ID:** `AdminCatalogController_history`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.history](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Revisiones y decisiones de la ficha de un objeto. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/objects/{id}/history` en `AdminCatalogController_history`. El controlador delega en `CatalogReadService.history`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/objects/00000000-0000-4000-8000-000000000001/history HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
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
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto del catálogo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/objects/{id}/history"
}
```

---

## 15. GET /admin/catalog/objects/{id}/impact

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Quién referencia a un objeto y a quién referencia, por claves foráneas observadas
- **Operation ID:** `AdminCatalogController_impact`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.impact](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Quién referencia a un objeto y a quién referencia, por claves foráneas observadas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/objects/{id}/impact` en `AdminCatalogController_impact`. El controlador delega en `CatalogReadService.impact`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `direction` | query | No | `string` | valores: `downstream`, `upstream`, `both` | `downstream`: quién referencia al objeto; `upstream`: a quién referencia | `both` |
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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
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
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Objeto del catálogo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/objects/{id}/impact"
}
```

---

## 16. GET /admin/catalog/permission-drift

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Deriva de permisos: roles que las rutas exigen contra los que la API siembra
- **Operation ID:** `AdminCatalogController_permissionDrift`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.permissionDrift](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Compara los `@Roles(...)` de todas las rutas (leídos al arrancar) con los roles de los `*.roles.ts` y con `authz.roles`: roles usados sin sembrar, sembrados sin usar y rutas autenticadas sin `@Roles`.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/permission-drift` en `AdminCatalogController_permissionDrift`. El controlador delega en `PermissionDriftService.report`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/permission-drift HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/catalog/permission-drift HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/permission-drift"
}
```

---

## 17. GET /admin/catalog/scans

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Escaneos, del más reciente al más antiguo
- **Operation ID:** `AdminCatalogController_listScans`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.listScans](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Escaneos, del más reciente al más antiguo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/scans` en `AdminCatalogController_listScans`. El controlador delega en `CatalogReadService.scans`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `cursor` | query | No | `string` | longitud máxima 600 | Cursor opaco de la página anterior (`nextCursor`) | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Filas por página | `50` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/scans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
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
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
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

## 18. POST /admin/catalog/scans

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Pide un escaneo de la base primaria (se ejecuta fuera de la petición)
- **Operation ID:** `AdminCatalogController_requestScan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.requestScan](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Pide un escaneo de la base primaria (se ejecuta fuera de la petición). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/catalog/scans` en `AdminCatalogController_requestScan`. El controlador delega en `CatalogScanService.request`. No recibe body. El tipo de retorno estático es `Promise<ScanAcceptedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `Idempotency-Key` | header | Sí | `string` | Sin restricción adicional declarada | 8–128 caracteres; la misma clave del mismo usuario devuelve el escaneo ya aceptado | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /admin/catalog/scans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Idempotency-Key: valor-ejemplo
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DATA_STEWARD`.
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
| 409 | Ya hay un escaneo en curso de esta fuente | `Promise<ScanAcceptedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ScanAcceptedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ScanAcceptedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ScanAcceptedDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ScanAcceptedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ScanAcceptedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "scanId": "00000000-0000-4000-8000-000000000001",
  "status": "QUEUED",
  "created": true,
  "acceptedAt": "2026-07-31T12:00:00.000Z",
  "statusUrl": "/admin/catalog/scans"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `scanId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | valores: `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELLED` | Sin descripción específica en el contrato OpenAPI. | `QUEUED` |
| `created` | Sí | `boolean` | Sin restricción adicional declarada | `false` si la petición repetía una `Idempotency-Key` ya usada y se devolvió el escaneo de entonces | `true` |
| `acceptedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `statusUrl` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `/admin/catalog/scans` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya hay un escaneo en curso de esta fuente | Excepción explícita en src/modules/data_catalog/services/catalog-scan.service.ts |
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

## 19. GET /admin/catalog/scans/{id}

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Un escaneo
- **Operation ID:** `AdminCatalogController_scan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.scan](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Un escaneo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/scans/{id}` en `AdminCatalogController_scan`. El controlador delega en `CatalogReadService.scan`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/catalog/scans/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
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
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Escaneo no encontrado | Excepción explícita en src/modules/data_catalog/services/catalog-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/catalog/scans/{id}"
}
```

---

## 20. GET /admin/catalog/schemas

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-catalog`
- **Nombre:** Schemas observados, con cuántos objetos tienen ficha y cuántos están aprobados
- **Operation ID:** `AdminCatalogController_schemas`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminCatalogController.schemas](../../src/modules/data_catalog/controllers/admin-catalog.controller.ts)

### Descripción de negocio

Schemas observados, con cuántos objetos tienen ficha y cuántos están aprobados. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/catalog/schemas` en `AdminCatalogController_schemas`. El controlador delega en `CatalogReadService.schemas`. No recibe body. El tipo de retorno estático es `no declarado`.

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
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
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
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

## 21. GET /admin/portal/catalogo/deriva

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Deriva entre el DDL del modelo y las entidades del ORM
- **Operation ID:** `AdminPortalController_deriva`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.deriva](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Deriva entre el DDL del modelo y las entidades del ORM. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Deriva entre el modelo, el ORM y la base.

### Descripción del sistema

NestJS resuelve `GET /admin/portal/catalogo/deriva` en `AdminPortalController_deriva`. El controlador delega en `PortalInventoryService.derivaDelCatalogo`. No recibe body. El tipo de retorno estático es `DerivaCatalogoDto`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/catalogo/deriva HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/catalogo/deriva HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `DerivaCatalogoDto` | No |
| 400 | Consulta completada correctamente. | `DerivaCatalogoDto` | No |
| 401 | Consulta completada correctamente. | `DerivaCatalogoDto` | No |
| 403 | Consulta completada correctamente. | `DerivaCatalogoDto` | No |
| 429 | Consulta completada correctamente. | `DerivaCatalogoDto` | No |
| 500 | Consulta completada correctamente. | `DerivaCatalogoDto` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `DerivaCatalogoDto` | No |
| 504 | Consulta completada correctamente. | `DerivaCatalogoDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DerivaCatalogoDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "resumen": {
    "clave": "valor"
  },
  "deriva": {
    "clave": "valor"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `resumen` | Sí | `object` | Sin restricción adicional declarada | Cifras del catálogo | `{"clave":"valor"}` |
| `deriva` | Sí | `object` | Sin restricción adicional declarada | Entidades sin tabla, tablas sin entidad, columnas ausentes, nulabilidad, schemas sin catálogo de la API | `{"clave":"valor"}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/catalogo/deriva"
}
```

---

## 22. GET /admin/portal/catalogo/tablas

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Listar las tablas del catálogo de datos
- **Operation ID:** `AdminPortalController_listarTablas`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.listarTablas](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Listar las tablas del catálogo de datos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Tablas del catálogo de datos del modelo.

### Descripción del sistema

NestJS resuelve `GET /admin/portal/catalogo/tablas` en `AdminPortalController_listarTablas`. El controlador delega en `PortalInventoryService.listarTablas`. No recibe body. El tipo de retorno estático es `TablasPaginaDto`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `cursor` | query | No | `string` | longitud máxima 600 | Cursor opaco de la página anterior (`nextCursor`) | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Filas por página | `50` |
| `schema` | query | No | `string` | Sin restricción adicional declarada | Schema de PostgreSQL | `valor-ejemplo` |
| `q` | query | No | `string` | longitud máxima 120 | Busca en `schema.tabla` y propósito | `valor-ejemplo` |
| `orm` | query | No | `string` | valores: `COINCIDE`, `DIVERGE`, `SIN_ENTIDAD` | Estado frente al ORM | `COINCIDE` |
| `appendOnly` | query | No | `boolean` | Sin restricción adicional declarada | Sólo (o excluyendo) las tablas que un README declara append-only | `true` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/catalogo/tablas HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/catalogo/tablas?cursor=valor-ejemplo&limit=50&schema=valor-ejemplo&q=valor-ejemplo&orm=COINCIDE&appendOnly=true HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `TablasPaginaDto` | No |
| 400 | Consulta completada correctamente. | `TablasPaginaDto` | No |
| 401 | Consulta completada correctamente. | `TablasPaginaDto` | No |
| 403 | Consulta completada correctamente. | `TablasPaginaDto` | No |
| 429 | Consulta completada correctamente. | `TablasPaginaDto` | No |
| 500 | Consulta completada correctamente. | `TablasPaginaDto` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `TablasPaginaDto` | No |
| 504 | Consulta completada correctamente. | `TablasPaginaDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TablasPaginaDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "scheduling.slot_holds",
      "schema": "valor-ejemplo",
      "tabla": "valor-ejemplo",
      "dominio": "valor-ejemplo",
      "columnas": 1,
      "indices": 1,
      "operaciones": 1,
      "orm": "COINCIDE",
      "appendOnly": true
    }
  ],
  "nextCursor": "valor-ejemplo",
  "limit": 1,
  "total": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<TablaResumenDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"scheduling.slot_holds","schema":"valor-ejemplo","tabla":"valor-ejemplo","dominio":"valor-ejemplo","columnas":1,"indices":1,"operaciones":1,"orm":"COINCIDE","appendOnly":true}]` |
| `items[].id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `scheduling.slot_holds` |
| `items[].schema` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].tabla` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].dominio` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].columnas` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].indices` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].operaciones` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].orm` | Sí | `string` | valores: `COINCIDE`, `DIVERGE`, `SIN_ENTIDAD` | Sin descripción específica en el contrato OpenAPI. | `COINCIDE` |
| `items[].appendOnly` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `nextCursor` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/catalogo/tablas"
}
```

---

## 23. GET /admin/portal/catalogo/tablas/{schema}/{tabla}

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Ver la ficha de una tabla
- **Operation ID:** `AdminPortalController_fichaDeTabla`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.fichaDeTabla](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Ver la ficha de una tabla. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ficha de una tabla.

### Descripción del sistema

NestJS resuelve `GET /admin/portal/catalogo/tablas/{schema}/{tabla}` en `AdminPortalController_fichaDeTabla`. El controlador delega en `PortalInventoryService.fichaDeTabla`. No recibe body. El tipo de retorno estático es `TablaFichaDto`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `schema` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `tabla` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/catalogo/tablas/valor-ejemplo/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/catalogo/tablas/valor-ejemplo/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `TablaFichaDto` | Sí |
| 400 | Consulta completada correctamente. | `TablaFichaDto` | No |
| 401 | Consulta completada correctamente. | `TablaFichaDto` | No |
| 403 | Consulta completada correctamente. | `TablaFichaDto` | No |
| 404 | La tabla no está en el catálogo | `TablaFichaDto` | No |
| 429 | Consulta completada correctamente. | `TablaFichaDto` | No |
| 500 | Consulta completada correctamente. | `TablaFichaDto` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `TablaFichaDto` | No |
| 504 | Consulta completada correctamente. | `TablaFichaDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TablaFichaDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "schema": "valor-ejemplo",
  "tabla": "valor-ejemplo",
  "dominio": {},
  "diagrama": "valor-ejemplo",
  "ddl": "valor-ejemplo",
  "proposito": {},
  "propositoEstado": "valor-ejemplo",
  "propositoFuente": {},
  "entidadOrm": {},
  "gobierno": {
    "clave": "valor"
  },
  "columnas": [
    {
      "clave": "valor"
    }
  ],
  "relaciones": {
    "clave": "valor"
  },
  "indices": [
    {
      "clave": "valor"
    }
  ],
  "restricciones": [
    {
      "clave": "valor"
    }
  ],
  "operaciones": [
    {
      "clave": "valor"
    }
  ],
  "deriva": {
    "clave": "valor"
  },
  "revision": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `schema` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `tabla` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `dominio` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `diagrama` | Sí | `string` | Sin restricción adicional declarada | Diagrama del modelo del que sale | `valor-ejemplo` |
| `ddl` | Sí | `string` | Sin restricción adicional declarada | DDL del que sale | `valor-ejemplo` |
| `proposito` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `propositoEstado` | Sí | `string` | Sin restricción adicional declarada | Estado de la revisión del propósito (hoy `DOMAIN_CURATED_DRAFT`) | `valor-ejemplo` |
| `propositoFuente` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `entidadOrm` | No | `object` | admite null | Clase de la entidad del ORM | `{}` |
| `gobierno` | Sí | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"clave":"valor"}` |
| `columnas` | Sí | `array<object>` | Sin restricción adicional declarada | Columnas con rol estructural y descripción (con fuente o «sin dato») | `[{"clave":"valor"}]` |
| `relaciones` | Sí | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"clave":"valor"}` |
| `indices` | Sí | `array<object>` | Sin restricción adicional declarada | Índices con su «para qué» | `[{"clave":"valor"}]` |
| `restricciones` | Sí | `array<object>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"clave":"valor"}]` |
| `operaciones` | Sí | `array<object>` | Sin restricción adicional declarada | Operaciones HTTP que la tocan | `[{"clave":"valor"}]` |
| `deriva` | Sí | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"clave":"valor"}` |
| `revision` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Tabla no encontrada en el catálogo | Excepción explícita en src/modules/data_catalog/services/portal-inventory.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/catalogo/tablas/{schema}/{tabla}"
}
```

---

## 24. GET /admin/portal/flujos

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Listar los procesos de negocio
- **Operation ID:** `AdminPortalController_listarProcesos`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.listarProcesos](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Listar los procesos de negocio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Procesos de negocio (por módulo y críticos).

### Descripción del sistema

NestJS resuelve `GET /admin/portal/flujos` en `AdminPortalController_listarProcesos`. El controlador delega en `PortalInventoryService.listarProcesos`. No recibe body. El tipo de retorno estático es `ProcesosPaginaDto`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `cursor` | query | No | `string` | longitud máxima 600 | Cursor opaco de la página anterior (`nextCursor`) | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Filas por página | `50` |
| `q` | query | No | `string` | longitud máxima 120 | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `tipo` | query | No | `string` | valores: `MODULO`, `CRITICO` | Sin descripción específica en OpenAPI. | `MODULO` |
| `modulo` | query | No | `string` | Sin restricción adicional declarada | Carpeta del módulo | `valor-ejemplo` |
| `agrupacion` | query | No | `string` | valores: `CASO_DE_USO_README`, `AGRUPACION_POR_CONTROLADOR`, `MIXTO`, `CURADO_EN_DOCUMENTO` | Sin descripción específica en OpenAPI. | `CASO_DE_USO_README` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/flujos HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/flujos?cursor=valor-ejemplo&limit=50&q=valor-ejemplo&tipo=MODULO&modulo=valor-ejemplo&agrupacion=CASO_DE_USO_README HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `ProcesosPaginaDto` | No |
| 400 | Consulta completada correctamente. | `ProcesosPaginaDto` | No |
| 401 | Consulta completada correctamente. | `ProcesosPaginaDto` | No |
| 403 | Consulta completada correctamente. | `ProcesosPaginaDto` | No |
| 429 | Consulta completada correctamente. | `ProcesosPaginaDto` | No |
| 500 | Consulta completada correctamente. | `ProcesosPaginaDto` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `ProcesosPaginaDto` | No |
| 504 | Consulta completada correctamente. | `ProcesosPaginaDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProcesosPaginaDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "codigo": "valor-ejemplo",
      "tipo": "MODULO",
      "nombre": "valor-ejemplo",
      "modulo": "valor-ejemplo",
      "bloque": "valor-ejemplo",
      "agrupacion": "valor-ejemplo",
      "actores": [
        "valor-ejemplo"
      ],
      "operaciones": 1,
      "etapas": 1,
      "maquinas": [
        "valor-ejemplo"
      ],
      "revision": "valor-ejemplo"
    }
  ],
  "nextCursor": "valor-ejemplo",
  "limit": 1,
  "total": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ProcesoResumenDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"codigo":"valor-ejemplo","tipo":"MODULO","nombre":"valor-ejemplo","modulo":"valor-ejemplo","bloque":"valor-ejemplo","agrupacion":"valor-ejemplo","actores":["valor-ejemplo"],"operaciones":1,"etapas":1,"maquinas":["valor-ejemplo"],"revision":"valor-ejemplo"}]` |
| `items[].codigo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].tipo` | Sí | `string` | valores: `MODULO`, `CRITICO` | Sin descripción específica en el contrato OpenAPI. | `MODULO` |
| `items[].nombre` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].modulo` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].bloque` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].agrupacion` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].actores` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `items[].operaciones` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].etapas` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items[].maquinas` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `items[].revision` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `nextCursor` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/flujos"
}
```

---

## 25. GET /admin/portal/flujos/{codigo}

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Ver un proceso con sus etapas y máquinas de estado
- **Operation ID:** `AdminPortalController_detalleDeProceso`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.detalleDeProceso](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Ver un proceso con sus etapas y máquinas de estado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Detalle de un proceso con sus etapas y máquinas de estado.

### Descripción del sistema

NestJS resuelve `GET /admin/portal/flujos/{codigo}` en `AdminPortalController_detalleDeProceso`. El controlador delega en `PortalInventoryService.detalleDeProceso`. No recibe body. El tipo de retorno estático es `ProcesoDetalleDto`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `codigo` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/flujos/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/flujos/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `ProcesoDetalleDto` | Sí |
| 400 | Consulta completada correctamente. | `ProcesoDetalleDto` | No |
| 401 | Consulta completada correctamente. | `ProcesoDetalleDto` | No |
| 403 | Consulta completada correctamente. | `ProcesoDetalleDto` | No |
| 404 | No existe ese proceso | `ProcesoDetalleDto` | No |
| 429 | Consulta completada correctamente. | `ProcesoDetalleDto` | No |
| 500 | Consulta completada correctamente. | `ProcesoDetalleDto` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `ProcesoDetalleDto` | No |
| 504 | Consulta completada correctamente. | `ProcesoDetalleDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProcesoDetalleDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "codigo": "valor-ejemplo",
  "tipo": "MODULO",
  "nombre": "valor-ejemplo",
  "modulo": {},
  "bloque": {},
  "agrupacion": "valor-ejemplo",
  "actores": [
    "valor-ejemplo"
  ],
  "operaciones": 1,
  "etapas": 1,
  "maquinas": [
    "valor-ejemplo"
  ],
  "revision": "valor-ejemplo",
  "paraQueSirve": {},
  "paraQueSirveFuente": {},
  "flujoGeneral": {},
  "detalleDeEtapas": [
    {
      "codigo": "valor-ejemplo",
      "nombre": "valor-ejemplo",
      "fuente": {},
      "agrupacion": "valor-ejemplo",
      "operaciones": [
        {
          "clave": "valor"
        }
      ]
    }
  ],
  "maquinasDeEstado": [
    {
      "codigo": "valor-ejemplo",
      "fuente": "valor-ejemplo",
      "estados": [
        "valor-ejemplo"
      ],
      "transiciones": [
        {
          "clave": "valor"
        }
      ],
      "iniciales": [
        "valor-ejemplo"
      ],
      "terminales": [
        "valor-ejemplo"
      ],
      "operaciones": [
        {
          "clave": "valor"
        }
      ]
    }
  ],
  "fuentes": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `codigo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `tipo` | Sí | `string` | valores: `MODULO`, `CRITICO` | Sin descripción específica en el contrato OpenAPI. | `MODULO` |
| `nombre` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `modulo` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `bloque` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `agrupacion` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `actores` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `operaciones` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `etapas` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `maquinas` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `revision` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `paraQueSirve` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `paraQueSirveFuente` | No | `object` | admite null | archivo:línea de donde sale «para qué sirve» | `{}` |
| `flujoGeneral` | No | `object` | admite null | Diagrama declarado en el README del módulo, tal cual | `{}` |
| `detalleDeEtapas` | Sí | `array<EtapaDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"codigo":"valor-ejemplo","nombre":"valor-ejemplo","fuente":{},"agrupacion":"valor-ejemplo","operaciones":[{"clave":"valor"}]}]` |
| `detalleDeEtapas[].codigo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `detalleDeEtapas[].nombre` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `detalleDeEtapas[].fuente` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `detalleDeEtapas[].agrupacion` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `detalleDeEtapas[].operaciones` | Sí | `array<object>` | Sin restricción adicional declarada | Operaciones de la etapa con quién actúa y qué efectos tiene | `[{"clave":"valor"}]` |
| `maquinasDeEstado` | Sí | `array<MaquinaDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"codigo":"valor-ejemplo","fuente":"valor-ejemplo","estados":["valor-ejemplo"],"transiciones":[{"clave":"valor"}],"iniciales":["valor-ejemplo"],"terminales":["valor-ejemplo"],"operaciones":[{"clave":"valor"}]}]` |
| `maquinasDeEstado[].codigo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `maquinasDeEstado[].fuente` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `maquinasDeEstado[].estados` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `maquinasDeEstado[].transiciones` | Sí | `array<object>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"clave":"valor"}]` |
| `maquinasDeEstado[].iniciales` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `maquinasDeEstado[].terminales` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `maquinasDeEstado[].operaciones` | Sí | `array<object>` | Sin restricción adicional declarada | Operaciones que la ejercen (POR_REFERENCIA) | `[{"clave":"valor"}]` |
| `fuentes` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proceso no encontrado en el inventario | Excepción explícita en src/modules/data_catalog/services/portal-inventory.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/flujos/{codigo}"
}
```

---

## 26. GET /admin/portal/flujos/{codigo}/grafo

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Ver el grafo de un proceso
- **Operation ID:** `AdminPortalController_grafo`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.grafo](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Ver el grafo de un proceso. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Grafo de un proceso.

### Descripción del sistema

NestJS resuelve `GET /admin/portal/flujos/{codigo}/grafo` en `AdminPortalController_grafo`. El controlador delega en `PortalInventoryService.grafoDeProceso`. No recibe body. El tipo de retorno estático es `GrafoDto`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `codigo` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/flujos/valor-ejemplo/grafo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/flujos/valor-ejemplo/grafo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `GrafoDto` | Sí |
| 400 | Consulta completada correctamente. | `GrafoDto` | No |
| 401 | Consulta completada correctamente. | `GrafoDto` | No |
| 403 | Consulta completada correctamente. | `GrafoDto` | No |
| 404 | No existe ese proceso | `GrafoDto` | No |
| 429 | Consulta completada correctamente. | `GrafoDto` | No |
| 500 | Consulta completada correctamente. | `GrafoDto` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `GrafoDto` | No |
| 504 | Consulta completada correctamente. | `GrafoDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GrafoDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "proceso": "valor-ejemplo",
  "nombre": "valor-ejemplo",
  "roles": [
    "valor-ejemplo"
  ],
  "nodos": [
    {
      "clave": "valor"
    }
  ],
  "aristas": [
    {
      "clave": "valor"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `proceso` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `nombre` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `roles` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `nodos` | Sí | `array<object>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"clave":"valor"}]` |
| `aristas` | Sí | `array<object>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"clave":"valor"}]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proceso no encontrado en el inventario | Excepción explícita en src/modules/data_catalog/services/portal-inventory.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/flujos/{codigo}/grafo"
}
```

---

## 27. GET /admin/portal/flujos/hallazgos

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Resumen de hallazgos del mapa
- **Operation ID:** `AdminPortalController_hallazgos`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.hallazgos](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Resumen de hallazgos del mapa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Hallazgos que salen de cruzar flujos, riesgo, pruebas y consumidores.

### Descripción del sistema

NestJS resuelve `GET /admin/portal/flujos/hallazgos` en `AdminPortalController_hallazgos`. El controlador delega en `PortalInventoryService.hallazgos`. No recibe body. El tipo de retorno estático es `HallazgoResumenDto[]`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/flujos/hallazgos HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/flujos/hallazgos HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `HallazgoResumenDto[]` | No |
| 400 | Consulta completada correctamente. | `HallazgoResumenDto[]` | No |
| 401 | Consulta completada correctamente. | `HallazgoResumenDto[]` | No |
| 403 | Consulta completada correctamente. | `HallazgoResumenDto[]` | No |
| 429 | Consulta completada correctamente. | `HallazgoResumenDto[]` | No |
| 500 | Consulta completada correctamente. | `HallazgoResumenDto[]` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `HallazgoResumenDto[]` | No |
| 504 | Consulta completada correctamente. | `HallazgoResumenDto[]` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HallazgoResumenDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "FLU-02",
    "severidad": "ALTA",
    "titulo": "valor-ejemplo",
    "queHacer": "valor-ejemplo",
    "cuenta": 1
  }
]
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/flujos/hallazgos"
}
```

---

## 28. GET /admin/portal/flujos/hallazgos/{id}

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Ver los casos de un hallazgo
- **Operation ID:** `AdminPortalController_detalleDeHallazgo`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.detalleDeHallazgo](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Ver los casos de un hallazgo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Casos de un hallazgo, paginados.

### Descripción del sistema

NestJS resuelve `GET /admin/portal/flujos/hallazgos/{id}` en `AdminPortalController_detalleDeHallazgo`. El controlador delega en `PortalInventoryService.detalleDeHallazgo`. No recibe body. El tipo de retorno estático es `HallazgoDetalleDto`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | No | `string` | longitud máxima 600 | Cursor opaco de la página anterior (`nextCursor`) | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Filas por página | `50` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/flujos/hallazgos/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/flujos/hallazgos/00000000-0000-4000-8000-000000000001?cursor=valor-ejemplo&limit=50 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `HallazgoDetalleDto` | Sí |
| 400 | Consulta completada correctamente. | `HallazgoDetalleDto` | No |
| 401 | Consulta completada correctamente. | `HallazgoDetalleDto` | No |
| 403 | Consulta completada correctamente. | `HallazgoDetalleDto` | No |
| 404 | No existe ese hallazgo | `HallazgoDetalleDto` | No |
| 429 | Consulta completada correctamente. | `HallazgoDetalleDto` | No |
| 500 | Consulta completada correctamente. | `HallazgoDetalleDto` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `HallazgoDetalleDto` | No |
| 504 | Consulta completada correctamente. | `HallazgoDetalleDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HallazgoDetalleDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "FLU-02",
  "severidad": "ALTA",
  "titulo": "valor-ejemplo",
  "queHacer": "valor-ejemplo",
  "cuenta": 1,
  "items": [
    {
      "clave": "valor"
    }
  ],
  "nextCursor": {},
  "limit": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `FLU-02` |
| `severidad` | Sí | `string` | valores: `ALTA`, `MEDIA`, `BAJA`, `INFO` | Sin descripción específica en el contrato OpenAPI. | `ALTA` |
| `titulo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `queHacer` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cuenta` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `items` | Sí | `array<object>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"clave":"valor"}]` |
| `nextCursor` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Hallazgo no encontrado | Excepción explícita en src/modules/data_catalog/services/portal-inventory.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/flujos/hallazgos/{id}"
}
```

---

## 29. GET /admin/portal/flujos/mapa

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Mapa de operaciones con sus señales
- **Operation ID:** `AdminPortalController_mapa`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.mapa](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Mapa de operaciones con sus señales. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Mapa de operaciones (ruta, proceso, riesgo, autorización, quién la llama, señales).

### Descripción del sistema

NestJS resuelve `GET /admin/portal/flujos/mapa` en `AdminPortalController_mapa`. El controlador delega en `PortalInventoryService.mapa`. No recibe body. El tipo de retorno estático es `MapaPaginaDto`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `cursor` | query | No | `string` | longitud máxima 600 | Cursor opaco de la página anterior (`nextCursor`) | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Filas por página | `50` |
| `q` | query | No | `string` | longitud máxima 120 | Busca (sin tildes ni mayúsculas) en ruta, nombre y controlador | `valor-ejemplo` |
| `modulo` | query | No | `string` | Sin restricción adicional declarada | Carpeta del módulo, p. ej. `scheduling` | `valor-ejemplo` |
| `riesgo` | query | No | `string` | valores: `ALTO`, `MEDIO`, `BAJO` | Sin descripción específica en OpenAPI. | `ALTO` |
| `metodo` | query | No | `string` | valores: `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Sin descripción específica en OpenAPI. | `GET` |
| `origen` | query | No | `string` | valores: `CONTRATO`, `CONTRATO_AUSENTE` | `CONTRATO_AUSENTE`: existe en el código y `openapi.json` no la publica | `CONTRATO` |
| `senal` | query | No | `string` | Sin restricción adicional declarada | Señal del mapa, p. ej. `ESCRIBE_SIN_ROLES` o `SIN_PRUEBAS` | `valor-ejemplo` |
| `flujo` | query | No | `string` | Sin restricción adicional declarada | Código del proceso al que pertenece, p. ej. `scheduling` o `critico:scheduling` | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/flujos/mapa HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/flujos/mapa?cursor=valor-ejemplo&limit=50&q=valor-ejemplo&modulo=valor-ejemplo&riesgo=ALTO&metodo=GET&origen=CONTRATO&senal=valor-ejemplo&flujo=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `MapaPaginaDto` | No |
| 400 | Consulta completada correctamente. | `MapaPaginaDto` | No |
| 401 | Consulta completada correctamente. | `MapaPaginaDto` | No |
| 403 | Consulta completada correctamente. | `MapaPaginaDto` | No |
| 429 | Consulta completada correctamente. | `MapaPaginaDto` | No |
| 500 | Consulta completada correctamente. | `MapaPaginaDto` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `MapaPaginaDto` | No |
| 504 | Consulta completada correctamente. | `MapaPaginaDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MapaPaginaDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "metodo": "valor-ejemplo",
      "ruta": "valor-ejemplo",
      "flujos": [
        {
          "codigo": "valor-ejemplo",
          "nombre": "valor-ejemplo",
          "etapa": "valor-ejemplo"
        }
      ],
      "modulo": "valor-ejemplo",
      "riesgo": "ALTO",
      "autorizacion": "valor-ejemplo",
      "llamadaPor": [
        "valor-ejemplo"
      ],
      "senales": [
        "valor-ejemplo"
      ]
    }
  ],
  "nextCursor": "valor-ejemplo",
  "limit": 1,
  "total": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<MapaFilaDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","metodo":"valor-ejemplo","ruta":"valor-ejemplo","flujos":[{"codigo":"valor-ejemplo","nombre":"valor-ejemplo","etapa":"valor-ejemplo"}],"modulo":"valor-ejemplo","riesgo":"ALTO","autorizacion":"valor-ejemplo","llamadaPor":["valor-ejemplo"],"senales":["valor-ejemplo"]}]` |
| `items[].id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `items[].metodo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].ruta` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].flujos` | Sí | `array<object>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"codigo":"valor-ejemplo","nombre":"valor-ejemplo","etapa":"valor-ejemplo"}]` |
| `items[].flujos[].codigo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].flujos[].nombre` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].flujos[].etapa` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].modulo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].riesgo` | Sí | `string` | valores: `ALTO`, `MEDIO`, `BAJO` | Sin descripción específica en el contrato OpenAPI. | `ALTO` |
| `items[].autorizacion` | Sí | `string` | Sin restricción adicional declarada | Pública, los roles o «Sesión sin roles» | `valor-ejemplo` |
| `items[].llamadaPor` | No | `array<string>` | admite null | `null` si no se pudo cruzar con el frontend | `["valor-ejemplo"]` |
| `items[].senales` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `nextCursor` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/flujos/mapa"
}
```

---

## 30. GET /admin/portal/glosario

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Buscar en el glosario
- **Operation ID:** `AdminPortalController_glosario`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.glosario](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Buscar en el glosario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Glosario de los términos de la API y del frontend.

### Descripción del sistema

NestJS resuelve `GET /admin/portal/glosario` en `AdminPortalController_glosario`. El controlador delega en `PortalInventoryService.glosario`. No recibe body. El tipo de retorno estático es `GlosarioPaginaDto`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `cursor` | query | No | `string` | longitud máxima 600 | Cursor opaco de la página anterior (`nextCursor`) | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Filas por página | `50` |
| `q` | query | No | `string` | longitud máxima 120 | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/glosario HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/glosario?cursor=valor-ejemplo&limit=50&q=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `GlosarioPaginaDto` | No |
| 400 | Consulta completada correctamente. | `GlosarioPaginaDto` | No |
| 401 | Consulta completada correctamente. | `GlosarioPaginaDto` | No |
| 403 | Consulta completada correctamente. | `GlosarioPaginaDto` | No |
| 429 | Consulta completada correctamente. | `GlosarioPaginaDto` | No |
| 500 | Consulta completada correctamente. | `GlosarioPaginaDto` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `GlosarioPaginaDto` | No |
| 504 | Consulta completada correctamente. | `GlosarioPaginaDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GlosarioPaginaDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "termino": "valor-ejemplo",
      "definicion": "valor-ejemplo",
      "fuente": "valor-ejemplo",
      "tablasRelacionadas": [
        "valor-ejemplo"
      ]
    }
  ],
  "nextCursor": "valor-ejemplo",
  "limit": 1,
  "total": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<GlosarioTerminoDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"termino":"valor-ejemplo","definicion":"valor-ejemplo","fuente":"valor-ejemplo","tablasRelacionadas":["valor-ejemplo"]}]` |
| `items[].termino` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].definicion` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].fuente` | Sí | `string` | Sin restricción adicional declarada | repo:archivo:línea | `valor-ejemplo` |
| `items[].tablasRelacionadas` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `nextCursor` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/glosario"
}
```

---

## 31. GET /admin/portal/linaje

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Métricas del linaje de datos
- **Operation ID:** `AdminPortalController_linaje`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.linaje](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Métricas del linaje de datos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Métricas del linaje y dominios.

### Descripción del sistema

NestJS resuelve `GET /admin/portal/linaje` en `AdminPortalController_linaje`. El controlador delega en `PortalInventoryService.linaje`. No recibe body. El tipo de retorno estático es `LinajeDto`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/linaje HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/linaje HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `LinajeDto` | No |
| 400 | Consulta completada correctamente. | `LinajeDto` | No |
| 401 | Consulta completada correctamente. | `LinajeDto` | No |
| 403 | Consulta completada correctamente. | `LinajeDto` | No |
| 429 | Consulta completada correctamente. | `LinajeDto` | No |
| 500 | Consulta completada correctamente. | `LinajeDto` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `LinajeDto` | No |
| 504 | Consulta completada correctamente. | `LinajeDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LinajeDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "metricas": {
    "clave": "valor"
  },
  "dominios": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "etiqueta": "valor-ejemplo",
      "tablas": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `metricas` | Sí | `object` | Sin restricción adicional declarada | Dominios, rutas, tablas, aristas, operación→tabla, tabla→tabla; las tablas con datos personales son `SIN_FUENTE` | `{"clave":"valor"}` |
| `dominios` | Sí | `array<LinajeDominioDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","etiqueta":"valor-ejemplo","tablas":1}]` |
| `dominios[].id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `dominios[].etiqueta` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `dominios[].tablas` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/linaje"
}
```

---

## 32. GET /admin/portal/linaje/tablas/{schema}/{tabla}

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Linaje de una tabla
- **Operation ID:** `AdminPortalController_linajeDeTabla`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.linajeDeTabla](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Linaje de una tabla. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Qué operaciones tocan una tabla y con qué tablas se relaciona.

### Descripción del sistema

NestJS resuelve `GET /admin/portal/linaje/tablas/{schema}/{tabla}` en `AdminPortalController_linajeDeTabla`. El controlador delega en `PortalInventoryService.linajeDeTabla`. No recibe body. El tipo de retorno estático es `LinajeTablaDto`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `schema` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `tabla` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/linaje/tablas/valor-ejemplo/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/linaje/tablas/valor-ejemplo/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `LinajeTablaDto` | Sí |
| 400 | Consulta completada correctamente. | `LinajeTablaDto` | No |
| 401 | Consulta completada correctamente. | `LinajeTablaDto` | No |
| 403 | Consulta completada correctamente. | `LinajeTablaDto` | No |
| 404 | La tabla no está en el linaje | `LinajeTablaDto` | No |
| 429 | Consulta completada correctamente. | `LinajeTablaDto` | No |
| 500 | Consulta completada correctamente. | `LinajeTablaDto` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `LinajeTablaDto` | No |
| 504 | Consulta completada correctamente. | `LinajeTablaDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LinajeTablaDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "operaciones": [
    {
      "clave": "valor"
    }
  ],
  "referencia": [
    "valor-ejemplo"
  ],
  "referenciadaPor": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `operaciones` | Sí | `array<object>` | Sin restricción adicional declarada | Operaciones que la leen o la escriben | `[{"clave":"valor"}]` |
| `referencia` | Sí | `array<string>` | Sin restricción adicional declarada | Tablas a las que ésta referencia | `["valor-ejemplo"]` |
| `referenciadaPor` | Sí | `array<string>` | Sin restricción adicional declarada | Tablas que la referencian | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Tabla no encontrada en el linaje | Excepción explícita en src/modules/data_catalog/services/portal-inventory.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/linaje/tablas/{schema}/{tabla}"
}
```

---

## 33. GET /admin/portal/operaciones

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Listar las operaciones HTTP del sistema
- **Operation ID:** `AdminPortalController_listarOperaciones`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.listarOperaciones](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Listar las operaciones HTTP del sistema. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Catálogo de operaciones HTTP, con filtros y cursor.

### Descripción del sistema

NestJS resuelve `GET /admin/portal/operaciones` en `AdminPortalController_listarOperaciones`. El controlador delega en `PortalInventoryService.listarOperaciones`. No recibe body. El tipo de retorno estático es `OperacionesPaginaDto`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `cursor` | query | No | `string` | longitud máxima 600 | Cursor opaco de la página anterior (`nextCursor`) | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Filas por página | `50` |
| `q` | query | No | `string` | longitud máxima 120 | Busca (sin tildes ni mayúsculas) en ruta, nombre y controlador | `valor-ejemplo` |
| `modulo` | query | No | `string` | Sin restricción adicional declarada | Carpeta del módulo, p. ej. `scheduling` | `valor-ejemplo` |
| `riesgo` | query | No | `string` | valores: `ALTO`, `MEDIO`, `BAJO` | Sin descripción específica en OpenAPI. | `ALTO` |
| `metodo` | query | No | `string` | valores: `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | Sin descripción específica en OpenAPI. | `GET` |
| `origen` | query | No | `string` | valores: `CONTRATO`, `CONTRATO_AUSENTE` | `CONTRATO_AUSENTE`: existe en el código y `openapi.json` no la publica | `CONTRATO` |
| `senal` | query | No | `string` | Sin restricción adicional declarada | Señal del mapa, p. ej. `ESCRIBE_SIN_ROLES` o `SIN_PRUEBAS` | `valor-ejemplo` |
| `flujo` | query | No | `string` | Sin restricción adicional declarada | Código del proceso al que pertenece, p. ej. `scheduling` o `critico:scheduling` | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/operaciones HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/operaciones?cursor=valor-ejemplo&limit=50&q=valor-ejemplo&modulo=valor-ejemplo&riesgo=ALTO&metodo=GET&origen=CONTRATO&senal=valor-ejemplo&flujo=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `OperacionesPaginaDto` | No |
| 400 | Consulta completada correctamente. | `OperacionesPaginaDto` | No |
| 401 | Consulta completada correctamente. | `OperacionesPaginaDto` | No |
| 403 | Consulta completada correctamente. | `OperacionesPaginaDto` | No |
| 429 | Consulta completada correctamente. | `OperacionesPaginaDto` | No |
| 500 | Consulta completada correctamente. | `OperacionesPaginaDto` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `OperacionesPaginaDto` | No |
| 504 | Consulta completada correctamente. | `OperacionesPaginaDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OperacionesPaginaDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "SchedulingController_placeHold",
      "metodo": "valor-ejemplo",
      "ruta": "valor-ejemplo",
      "modulo": "valor-ejemplo",
      "nombre": "valor-ejemplo",
      "origen": "CONTRATO",
      "riesgo": "ALTO",
      "publica": true,
      "roles": [
        "valor-ejemplo"
      ],
      "tablas": 1,
      "flujos": [
        {
          "codigo": "scheduling",
          "nombre": "valor-ejemplo",
          "etapa": "valor-ejemplo",
          "agrupacion": "CASO_DE_USO_README"
        }
      ],
      "senales": [
        "valor-ejemplo"
      ]
    }
  ],
  "nextCursor": "valor-ejemplo",
  "limit": 1,
  "total": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<OperacionResumenDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"SchedulingController_placeHold","metodo":"valor-ejemplo","ruta":"valor-ejemplo","modulo":"valor-ejemplo","nombre":"valor-ejemplo","origen":"CONTRATO","riesgo":"ALTO","publica":true,"roles":["valor-ejemplo"],"tablas":1,"flujos":[{"codigo":"scheduling","nombre":"valor-ejemplo","etapa":"valor-ejemplo","agrupacion":"CASO_DE_USO_README"}],"senales":["valor-ejemplo"]}]` |
| `items[].id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `SchedulingController_placeHold` |
| `items[].metodo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].ruta` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].modulo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].nombre` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].origen` | Sí | `string` | valores: `CONTRATO`, `CONTRATO_AUSENTE` | Sin descripción específica en el contrato OpenAPI. | `CONTRATO` |
| `items[].riesgo` | Sí | `string` | valores: `ALTO`, `MEDIO`, `BAJO` | Sin descripción específica en el contrato OpenAPI. | `ALTO` |
| `items[].publica` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].roles` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `items[].tablas` | Sí | `number` | Sin restricción adicional declarada | Cantidad de tablas que toca | `1` |
| `items[].flujos` | Sí | `array<FlujoRefDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"codigo":"scheduling","nombre":"valor-ejemplo","etapa":"valor-ejemplo","agrupacion":"CASO_DE_USO_README"}]` |
| `items[].flujos[].codigo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `scheduling` |
| `items[].flujos[].nombre` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `items[].flujos[].etapa` | Sí | `string` | Sin restricción adicional declarada | Etapa (caso de uso o controlador) dentro del proceso | `valor-ejemplo` |
| `items[].flujos[].agrupacion` | Sí | `string` | valores: `CASO_DE_USO_README`, `AGRUPACION_POR_CONTROLADOR`, `CURADO_EN_DOCUMENTO` | Sin descripción específica en el contrato OpenAPI. | `CASO_DE_USO_README` |
| `items[].senales` | Sí | `array<string>` | Sin restricción adicional declarada | Señales del mapa (`SIN_PRUEBAS`, `ESCRIBE_SIN_ROLES`…) | `["valor-ejemplo"]` |
| `nextCursor` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/operaciones"
}
```

---

## 34. GET /admin/portal/operaciones/{id}

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Ver la ficha de una operación
- **Operation ID:** `AdminPortalController_detalleDeOperacion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.detalleDeOperacion](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Ver la ficha de una operación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ficha de una operación (negocio, contrato, datos, acceso, pruebas).

### Descripción del sistema

NestJS resuelve `GET /admin/portal/operaciones/{id}` en `AdminPortalController_detalleDeOperacion`. El controlador delega en `PortalInventoryService.detalleDeOperacion`. No recibe body. El tipo de retorno estático es `OperacionDetalleDto`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/operaciones/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/operaciones/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `OperacionDetalleDto` | Sí |
| 400 | Consulta completada correctamente. | `OperacionDetalleDto` | No |
| 401 | Consulta completada correctamente. | `OperacionDetalleDto` | No |
| 403 | Consulta completada correctamente. | `OperacionDetalleDto` | No |
| 404 | La operación no está en el inventario | `OperacionDetalleDto` | No |
| 429 | Consulta completada correctamente. | `OperacionDetalleDto` | No |
| 500 | Consulta completada correctamente. | `OperacionDetalleDto` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `OperacionDetalleDto` | No |
| 504 | Consulta completada correctamente. | `OperacionDetalleDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OperacionDetalleDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "SchedulingController_placeHold",
  "metodo": "valor-ejemplo",
  "ruta": "valor-ejemplo",
  "modulo": "valor-ejemplo",
  "nombre": {},
  "origen": "CONTRATO",
  "riesgo": "ALTO",
  "publica": true,
  "roles": [
    "valor-ejemplo"
  ],
  "tablas": 1,
  "flujos": [
    {
      "codigo": "scheduling",
      "nombre": "valor-ejemplo",
      "etapa": "valor-ejemplo",
      "agrupacion": "CASO_DE_USO_README"
    }
  ],
  "senales": [
    "valor-ejemplo"
  ],
  "bloque": {},
  "codigo": {},
  "negocio": {
    "texto": {},
    "estado": "valor-ejemplo",
    "fuentes": [
      "valor-ejemplo"
    ]
  },
  "sistema": "valor-ejemplo",
  "razonesDeRiesgo": [
    "valor-ejemplo"
  ],
  "requerimientos": [
    {
      "tipo": "ROL",
      "detalle": "valor-ejemplo",
      "fuente": "valor-ejemplo"
    }
  ],
  "parametros": [
    {
      "nombre": {},
      "en": "valor-ejemplo",
      "obligatorio": {},
      "tipo": {},
      "descripcion": {}
    }
  ],
  "cuerpo": {
    "dto": {},
    "contentType": {},
    "obligatorio": {},
    "campos": [
      {
        "campo": "valor-ejemplo",
        "tipo": "valor-ejemplo",
        "obligatorio": true,
        "restricciones": [
          "valor-ejemplo"
        ],
        "descripcion": {},
        "ejemplo": {},
        "fuente": {}
      }
    ],
    "payloadMinimo": {}
  },
  "respuesta": {
    "tipoRetorno": {},
    "dto": {},
    "httpCode": {},
    "campos": [
      {
        "campo": "valor-ejemplo",
        "tipo": "valor-ejemplo",
        "obligatorio": true,
        "restricciones": [
          "valor-ejemplo"
        ],
        "descripcion": {},
        "ejemplo": {},
        "fuente": {}
      }
    ]
  },
  "respuestasPosibles": [
    {
      "estado": 1,
      "codigo": {},
      "causas": [
        "valor-ejemplo"
      ]
    }
  ],
  "datos": [
    {
      "schema": "valor-ejemplo",
      "tabla": "valor-ejemplo",
      "operacion": "LEE",
      "detalle": "valor-ejemplo",
      "confianza": "DIRECTA",
      "via": [
        "valor-ejemplo"
      ],
      "fuente": "valor-ejemplo",
      "catalogada": true
    }
  ],
  "eventos": [
    "valor-ejemplo"
  ],
  "trabajos": [
    "valor-ejemplo"
  ],
  "noResuelto": [
    "valor-ejemplo"
  ],
  "sinTablas": {},
  "pruebas": [
    {
      "tipo": "CONTROLADOR",
      "archivo": "valor-ejemplo",
      "linea": 1
    }
  ],
  "revision": "valor-ejemplo",
  "datosPersonales": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `SchedulingController_placeHold` |
| `metodo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `ruta` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `modulo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `nombre` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `origen` | Sí | `string` | valores: `CONTRATO`, `CONTRATO_AUSENTE` | Sin descripción específica en el contrato OpenAPI. | `CONTRATO` |
| `riesgo` | Sí | `string` | valores: `ALTO`, `MEDIO`, `BAJO` | Sin descripción específica en el contrato OpenAPI. | `ALTO` |
| `publica` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `roles` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `tablas` | Sí | `number` | Sin restricción adicional declarada | Cantidad de tablas que toca | `1` |
| `flujos` | Sí | `array<FlujoRefDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"codigo":"scheduling","nombre":"valor-ejemplo","etapa":"valor-ejemplo","agrupacion":"CASO_DE_USO_README"}]` |
| `flujos[].codigo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `scheduling` |
| `flujos[].nombre` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `flujos[].etapa` | Sí | `string` | Sin restricción adicional declarada | Etapa (caso de uso o controlador) dentro del proceso | `valor-ejemplo` |
| `flujos[].agrupacion` | Sí | `string` | valores: `CASO_DE_USO_README`, `AGRUPACION_POR_CONTROLADOR`, `CURADO_EN_DOCUMENTO` | Sin descripción específica en el contrato OpenAPI. | `CASO_DE_USO_README` |
| `senales` | Sí | `array<string>` | Sin restricción adicional declarada | Señales del mapa (`SIN_PRUEBAS`, `ESCRIBE_SIN_ROLES`…) | `["valor-ejemplo"]` |
| `bloque` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `codigo` | No | `object` | admite null | archivo:línea del handler | `{}` |
| `negocio` | Sí | `ExplicacionNegocioDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"texto":{},"estado":"valor-ejemplo","fuentes":["valor-ejemplo"]}` |
| `negocio.texto` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `negocio.estado` | Sí | `string` | Sin restricción adicional declarada | `AUTO_DETECTADA` hasta que una persona la revise | `valor-ejemplo` |
| `negocio.fuentes` | Sí | `array<string>` | Sin restricción adicional declarada | Fuentes con las que se compuso el texto | `["valor-ejemplo"]` |
| `sistema` | Sí | `string` | Sin restricción adicional declarada | Cómo la atiende el sistema (controlador, servicio, tablas) | `valor-ejemplo` |
| `razonesDeRiesgo` | Sí | `array<string>` | Sin restricción adicional declarada | Por qué tiene ese nivel de riesgo | `["valor-ejemplo"]` |
| `requerimientos` | Sí | `array<RequerimientoDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"tipo":"ROL","detalle":"valor-ejemplo","fuente":"valor-ejemplo"}]` |
| `requerimientos[].tipo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `ROL` |
| `requerimientos[].detalle` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `requerimientos[].fuente` | Sí | `string` | Sin restricción adicional declarada | archivo:línea de donde se leyó | `valor-ejemplo` |
| `parametros` | Sí | `array<ParametroDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"nombre":{},"en":"valor-ejemplo","obligatorio":{},"tipo":{},"descripcion":{}}]` |
| `parametros[].nombre` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `parametros[].en` | Sí | `string` | Sin restricción adicional declarada | path, query, header o cookie | `valor-ejemplo` |
| `parametros[].obligatorio` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `parametros[].tipo` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `parametros[].descripcion` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `cuerpo` | No | `CuerpoDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"dto":{},"contentType":{},"obligatorio":{},"campos":[{"campo":"valor-ejemplo","tipo":"valor-ejemplo","obligatorio":true,"restricciones":["valor-ejemplo"],"descripcion":{},"ejemplo":{},"fuente":{}}],"payloadMinimo":{}}` |
| `cuerpo.dto` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `cuerpo.contentType` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `cuerpo.obligatorio` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `cuerpo.campos` | No | `array<CampoDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"campo":"valor-ejemplo","tipo":"valor-ejemplo","obligatorio":true,"restricciones":["valor-ejemplo"],"descripcion":{},"ejemplo":{},"fuente":{}}]` |
| `cuerpo.campos[].campo` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cuerpo.campos[].tipo` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cuerpo.campos[].obligatorio` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `cuerpo.campos[].restricciones` | No | `array<string>` | Sin restricción adicional declarada | Restricciones leídas del DTO (formato, longitud, rango…) | `["valor-ejemplo"]` |
| `cuerpo.campos[].descripcion` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `cuerpo.campos[].ejemplo` | No | `object` | Sin restricción adicional declarada | Ejemplo sintético | `{}` |
| `cuerpo.campos[].fuente` | No | `object` | admite null | archivo:línea del campo | `{}` |
| `cuerpo.payloadMinimo` | No | `object` | Sin restricción adicional declarada | Sólo los campos obligatorios, con valores de ejemplo sintéticos | `{}` |
| `respuesta` | Sí | `RespuestaContratoDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"tipoRetorno":{},"dto":{},"httpCode":{},"campos":[{"campo":"valor-ejemplo","tipo":"valor-ejemplo","obligatorio":true,"restricciones":["valor-ejemplo"],"descripcion":{},"ejemplo":{},"fuente":{}}]}` |
| `respuesta.tipoRetorno` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `respuesta.dto` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `respuesta.httpCode` | No | `object` | admite null | Código de éxito declarado con @HttpCode | `{}` |
| `respuesta.campos` | Sí | `array<CampoDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"campo":"valor-ejemplo","tipo":"valor-ejemplo","obligatorio":true,"restricciones":["valor-ejemplo"],"descripcion":{},"ejemplo":{},"fuente":{}}]` |
| `respuesta.campos[].campo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `respuesta.campos[].tipo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `respuesta.campos[].obligatorio` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `respuesta.campos[].restricciones` | Sí | `array<string>` | Sin restricción adicional declarada | Restricciones leídas del DTO (formato, longitud, rango…) | `["valor-ejemplo"]` |
| `respuesta.campos[].descripcion` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `respuesta.campos[].ejemplo` | No | `object` | Sin restricción adicional declarada | Ejemplo sintético | `{}` |
| `respuesta.campos[].fuente` | No | `object` | admite null | archivo:línea del campo | `{}` |
| `respuestasPosibles` | Sí | `array<RespuestaPosibleDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"estado":1,"codigo":{},"causas":["valor-ejemplo"]}]` |
| `respuestasPosibles[].estado` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `respuestasPosibles[].codigo` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `respuestasPosibles[].causas` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `datos` | Sí | `array<TablaOperacionDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"schema":"valor-ejemplo","tabla":"valor-ejemplo","operacion":"LEE","detalle":"valor-ejemplo","confianza":"DIRECTA","via":["valor-ejemplo"],"fuente":"valor-ejemplo","catalogada":true}]` |
| `datos[].schema` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `datos[].tabla` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `datos[].operacion` | Sí | `string` | valores: `LEE`, `ESCRIBE`, `BORRA` | Sin descripción específica en el contrato OpenAPI. | `LEE` |
| `datos[].detalle` | Sí | `string` | Sin restricción adicional declarada | CREA, ACTUALIZA, GUARDA, BORRA o LEE | `valor-ejemplo` |
| `datos[].confianza` | Sí | `string` | valores: `DIRECTA`, `POR_TIPO`, `POR_REGISTRO`, `POR_SQL` | Sin descripción específica en el contrato OpenAPI. | `DIRECTA` |
| `datos[].via` | Sí | `array<string>` | Sin restricción adicional declarada | Camino handler → servicio → repositorio | `["valor-ejemplo"]` |
| `datos[].fuente` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `datos[].catalogada` | Sí | `boolean` | Sin restricción adicional declarada | `false` si es una vista u objeto que no es una tabla del catálogo | `true` |
| `eventos` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `trabajos` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `noResuelto` | Sí | `array<string>` | Sin restricción adicional declarada | Llamadas cuyo destino depende de un dato en ejecución: no se siguieron | `["valor-ejemplo"]` |
| `sinTablas` | No | `object` | admite null | Por qué no toca tablas, si está curado a mano | `{}` |
| `pruebas` | Sí | `array<PruebaDto>` | Sin restricción adicional declarada | Pruebas que mencionan la operación (búsqueda textual, no cobertura) | `[{"tipo":"CONTROLADOR","archivo":"valor-ejemplo","linea":1}]` |
| `pruebas[].tipo` | Sí | `string` | valores: `CONTROLADOR`, `INTEGRACION` | Sin descripción específica en el contrato OpenAPI. | `CONTROLADOR` |
| `pruebas[].archivo` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `pruebas[].linea` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `revision` | Sí | `string` | Sin restricción adicional declarada | `AUTO_DETECTADA` hasta que una persona la revise | `valor-ejemplo` |
| `datosPersonales` | Sí | `string` | Sin restricción adicional declarada | Siempre `SIN_FUENTE` mientras no exista una clasificación de datos personales | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Operación no encontrada en el inventario | Excepción explícita en src/modules/data_catalog/services/portal-inventory.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/operaciones/{id}"
}
```

---

## 35. GET /admin/portal/operaciones/{id}/arbol

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Ver el árbol de decisión de una operación
- **Operation ID:** `AdminPortalController_arbol`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.arbol](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Ver el árbol de decisión de una operación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Árbol de decisión de una operación.

### Descripción del sistema

NestJS resuelve `GET /admin/portal/operaciones/{id}/arbol` en `AdminPortalController_arbol`. El controlador delega en `PortalInventoryService.arbolDeOperacion`. No recibe body. El tipo de retorno estático es `ArbolDto`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/operaciones/00000000-0000-4000-8000-000000000001/arbol HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/operaciones/00000000-0000-4000-8000-000000000001/arbol HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `ArbolDto` | Sí |
| 400 | Consulta completada correctamente. | `ArbolDto` | No |
| 401 | Consulta completada correctamente. | `ArbolDto` | No |
| 403 | Consulta completada correctamente. | `ArbolDto` | No |
| 404 | La operación no está en el inventario | `ArbolDto` | No |
| 429 | Consulta completada correctamente. | `ArbolDto` | No |
| 500 | Consulta completada correctamente. | `ArbolDto` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `ArbolDto` | No |
| 504 | Consulta completada correctamente. | `ArbolDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ArbolDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "nodos": [
    {
      "clave": "valor"
    }
  ],
  "respuestas": [
    {
      "estado": 1,
      "codigo": {},
      "causas": [
        "valor-ejemplo"
      ]
    }
  ],
  "truncado": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `nodos` | Sí | `array<object>` | Sin restricción adicional declarada | Nodos del árbol: ACCESO, SI, SEGUN, BUCLE, INTENTAR, TRANSACCION, LLAMADA, ERROR, EFECTO, EVENTO, TRABAJO, RESPUESTA | `[{"clave":"valor"}]` |
| `respuestas` | Sí | `array<RespuestaPosibleDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"estado":1,"codigo":{},"causas":["valor-ejemplo"]}]` |
| `respuestas[].estado` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `respuestas[].codigo` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `respuestas[].causas` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `truncado` | Sí | `boolean` | Sin restricción adicional declarada | `true` si el árbol se cortó por tope de nodos | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | La operación no tiene árbol de decisión | Excepción explícita en src/modules/data_catalog/services/portal-inventory.service.ts |
| 404 | `NOT_FOUND` | Operación no encontrada en el inventario | Excepción explícita en src/modules/data_catalog/services/portal-inventory.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/operaciones/{id}/arbol"
}
```

---

## 36. GET /admin/portal/version

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `admin-portal`
- **Nombre:** Versión y tamaño del inventario publicado
- **Operation ID:** `AdminPortalController_version`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminPortalController.version](../../src/modules/data_catalog/controllers/admin-portal.controller.ts)

### Descripción de negocio

Versión y tamaño del inventario publicado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Versión del inventario que se está mostrando.

### Descripción del sistema

NestJS resuelve `GET /admin/portal/version` en `AdminPortalController_version`. El controlador delega en `PortalInventoryService.version`. No recibe body. El tipo de retorno estático es `PortalVersionDto`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/portal/version HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`, `PLATFORM_ADMIN`, `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DPO`, `AUDITOR`, `DATA_STEWARD`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/portal/version HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `PortalVersionDto` | No |
| 400 | Consulta completada correctamente. | `PortalVersionDto` | No |
| 401 | Consulta completada correctamente. | `PortalVersionDto` | No |
| 403 | Consulta completada correctamente. | `PortalVersionDto` | No |
| 429 | Consulta completada correctamente. | `PortalVersionDto` | No |
| 500 | Consulta completada correctamente. | `PortalVersionDto` | No |
| 503 | El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`) | `PortalVersionDto` | No |
| 504 | Consulta completada correctamente. | `PortalVersionDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PortalVersionDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "hash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "operaciones": 1,
  "procesos": 1,
  "tablas": 1,
  "columnas": 1,
  "origen": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `hash` | Sí | `string` | Sin restricción adicional declarada | Huella del inventario: cambia cuando cambia su contenido | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `operaciones` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `procesos` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `tablas` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `columnas` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `origen` | Sí | `string` | Sin restricción adicional declarada | Directorio del que se leyó el inventario, relativo al proceso | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN, PLATFORM_ADMIN, GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DPO, AUDITOR, DATA_STEWARD. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/portal/version"
}
```

---

## 37. POST /internal/catalog/inventory/import

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog-internal`
- **Nombre:** Importa el inventario de la API a las tablas de operaciones y procesos (worker)
- **Operation ID:** `InternalCatalogInventoryController_importInventory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InternalCatalogInventoryController.importInventory](../../src/modules/data_catalog/controllers/internal-catalog.controller.ts)

### Descripción de negocio

Lee `inventario/` y escribe `catalog_operations`, `catalog_operation_impacts`, `catalog_processes`, `catalog_process_steps` y `catalog_process_step_operations` en una transacción. Idempotente: lo que no cambió no se toca. Corre después de un escaneo, porque cada impacto apunta a un objeto de `catalog_objects`. Una operación que deja de aparecer queda `NOT_OBSERVED`. 503 si la instancia no tiene el inventario.


### Descripción del sistema

NestJS resuelve `POST /internal/catalog/inventory/import` en `InternalCatalogInventoryController_importInventory`. El controlador delega en `InventoryImportService.importInventory`. No recibe body. El tipo de retorno estático es `Promise<InventoryImportResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /internal/catalog/inventory/import HTTP/1.1
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
POST /internal/catalog/inventory/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<InventoryImportResultDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<InventoryImportResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<InventoryImportResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<InventoryImportResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<InventoryImportResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<InventoryImportResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<InventoryImportResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<InventoryImportResultDto>` | No |
| 503 | El inventario no está disponible en esta instancia | `Promise<InventoryImportResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<InventoryImportResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `InventoryImportResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "inventory": {
    "hash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "operaciones": 1,
    "procesos": 1
  },
  "operations": {
    "added": 1,
    "changed": 1,
    "reappeared": 1,
    "unchanged": 1,
    "notObserved": 1
  },
  "impacts": {
    "written": 1,
    "skippedNotCataloged": 1,
    "skippedUnresolved": 1
  },
  "processes": {
    "added": 1,
    "changed": 1,
    "unchanged": 1
  },
  "steps": {
    "written": 1
  },
  "stepOperations": {
    "written": 1,
    "skippedUnresolved": 1
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `inventory` | Sí | `InventoryImportSourceDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"hash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","operaciones":1,"procesos":1}` |
| `inventory.hash` | Sí | `string` | Sin restricción adicional declarada | Huella del inventario (la misma de `GET /admin/portal/version`) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `inventory.operaciones` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `inventory.procesos` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `operations` | Sí | `InventoryImportOperationsDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"added":1,"changed":1,"reappeared":1,"unchanged":1,"notObserved":1}` |
| `operations.added` | Sí | `number` | Sin restricción adicional declarada | Operaciones nuevas en la base | `1` |
| `operations.changed` | Sí | `number` | Sin restricción adicional declarada | Operaciones cuya huella técnica cambió | `1` |
| `operations.reappeared` | Sí | `number` | Sin restricción adicional declarada | Operaciones `NOT_OBSERVED` que volvieron a aparecer | `1` |
| `operations.unchanged` | Sí | `number` | Sin restricción adicional declarada | Operaciones que no cambiaron: no se tocó su fila | `1` |
| `operations.notObserved` | Sí | `number` | Sin restricción adicional declarada | Operaciones que dejaron de aparecer y pasaron a `NOT_OBSERVED` (no se borran) | `1` |
| `impacts` | Sí | `InventoryImportImpactsDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"written":1,"skippedNotCataloged":1,"skippedUnresolved":1}` |
| `impacts.written` | Sí | `number` | Sin restricción adicional declarada | Impactos escritos en esta corrida | `1` |
| `impacts.skippedNotCataloged` | Sí | `number` | Sin restricción adicional declarada | Tablas que el inventario no tiene catalogadas y la sonda tampoco observó (estado actual, no sólo esta corrida) | `1` |
| `impacts.skippedUnresolved` | Sí | `number` | Sin restricción adicional declarada | Tablas que el inventario da por catalogadas y la sonda aún no observó: correr un escaneo y volver a importar | `1` |
| `processes` | Sí | `InventoryImportProcessesDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"added":1,"changed":1,"unchanged":1}` |
| `processes.added` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `processes.changed` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `processes.unchanged` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `steps` | Sí | `InventoryImportStepsDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"written":1}` |
| `steps.written` | Sí | `number` | Sin restricción adicional declarada | Etapas escritas en esta corrida | `1` |
| `stepOperations` | Sí | `InventoryImportStepOperationsDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"written":1,"skippedUnresolved":1}` |
| `stepOperations.written` | Sí | `number` | Sin restricción adicional declarada | Enlaces etapa-operación escritos | `1` |
| `stepOperations.skippedUnresolved` | Sí | `number` | Sin restricción adicional declarada | Enlaces cuya operación no está en el inventario de endpoints | `1` |

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
  "path": "/internal/catalog/inventory/import"
}
```

---

## 38. POST /internal/catalog/scans/run-next

- **Módulo:** `data_catalog`
- **Etiqueta OpenAPI:** `data-catalog-internal`
- **Nombre:** Sonda: reclama y ejecuta el siguiente escaneo (worker)
- **Operation ID:** `InternalCatalogScansController_runNext`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InternalCatalogScansController.runNext](../../src/modules/data_catalog/controllers/internal-catalog.controller.ts)

### Descripción de negocio

Cierra los escaneos abandonados, retoma el que está en cola o, si venció el intervalo de la sonda, pide uno nuevo. `claimed: 0` si no había nada que hacer. `fenced: true` si el escaneo perdió su lease.


### Descripción del sistema

NestJS resuelve `POST /internal/catalog/scans/run-next` en `InternalCatalogScansController_runNext`. El controlador delega en `CatalogScanService.runNext`. No recibe body. El tipo de retorno estático es `Promise<RunNextResultDto>`.

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
| 200 | Operación completada correctamente. | `Promise<RunNextResultDto>` | Sí |
| 400 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |
| 504 | Operación completada correctamente. | `Promise<RunNextResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RunNextResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "claimed": 1,
  "scanId": "00000000-0000-4000-8000-000000000001",
  "status": "QUEUED",
  "fenced": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `claimed` | Sí | `number` | valores: `0`, `1` | 1 si este tick tomó un escaneo; 0 si no había nada que hacer | `1` |
| `scanId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `status` | No | `string` | valores: `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `CANCELLED` | Sin descripción específica en el contrato OpenAPI. | `QUEUED` |
| `fenced` | No | `boolean` | Sin restricción adicional declarada | `true` si el escaneo perdió su lease y no se pisó lo que otro proceso cerró | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya hay un escaneo en curso de esta fuente | Excepción explícita en src/modules/data_catalog/services/catalog-scan.service.ts |
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

