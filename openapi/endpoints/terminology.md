<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `terminology`

Referencia exhaustiva de 20 operación(es) del módulo `terminology`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `terminology`
- **Controladores:** `TerminologyCodeSystemsController`, `TerminologyConceptsController`, `TerminologyFhirController`, `TerminologyTenantCatalogController`, `TerminologyValueSetsController`, `TerminologyVersionsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /terminology/code-systems](#1-get-terminology-code-systems) — Sistemas de códigos registrados
2. [POST /terminology/code-systems](#2-post-terminology-code-systems) — UC-03-01: crea un sistema de códigos y su fuente
3. [GET /terminology/code-systems/{id}/versions](#3-get-terminology-code-systems-id-versions) — Versiones de un sistema de códigos
4. [POST /terminology/code-systems/{id}/versions](#4-post-terminology-code-systems-id-versions) — UC-03-02: crea una versión (borrador) de un sistema de códigos
5. [GET /terminology/CodeSystem/$lookup](#5-get-terminology-codesystem-lookup) — UC-03-11: resuelve un concepto por sistema y código
6. [POST /terminology/ConceptMap/$translate](#6-post-terminology-conceptmap-translate) — UC-03-09: cura o consulta un mapeo entre conceptos
7. [GET /terminology/concepts](#7-get-terminology-concepts) — UC-03-13: busca conceptos por código/denominación, o resuelve ids a etiqueta
8. [GET /terminology/concepts/{conceptId}](#8-get-terminology-concepts-conceptid) — Lee la ficha de un concepto: textos en el idioma pedido, conjuntos de valores a los que pertenece y denominaciones alternativas
9. [POST /terminology/concepts/{conceptId}/$deprecate](#9-post-terminology-concepts-conceptid-deprecate) — UC-03-10: retira el concepto y lo excluye de las expansiones
10. [POST /terminology/concepts/{conceptId}/designations](#10-post-terminology-concepts-conceptid-designations) — UC-03-05: añade una designación (y opcionalmente propiedades)
11. [POST /terminology/concepts/{conceptId}/properties](#11-post-terminology-concepts-conceptid-properties) — UC-03-05: alta o actualización de propiedades del concepto
12. [POST /terminology/concepts/{conceptId}/relationships](#12-post-terminology-concepts-conceptid-relationships) — UC-03-06: crea una relación dirigida entre conceptos
13. [PUT /terminology/tenants/{tenantId}/catalog-policies](#13-put-terminology-tenants-tenantid-catalog-policies) — UC-03-12: define la política de catálogo del tenant
14. [GET /terminology/value-sets](#14-get-terminology-value-sets) — Listar conjuntos de valores por código interno o texto
15. [POST /terminology/value-sets](#15-post-terminology-value-sets) — UC-03-07: crea un conjunto de valores con versión y reglas
16. [GET /terminology/value-sets/{id}/$expand](#16-get-terminology-value-sets-id-expand) — UC-03-08: lee la expansión vigente de un conjunto de valores
17. [POST /terminology/ValueSet/{id}/$expand](#17-post-terminology-valueset-id-expand) — UC-03-08: materializa los miembros de la expansión
18. [POST /terminology/versions/{versionId}/import](#18-post-terminology-versions-versionid-import) — UC-03-03: importa conceptos en una versión en borrador
19. [POST /terminology/versions/{versionId}/import-file](#19-post-terminology-versions-versionid-import-file) — UC-03-03: importa conceptos desde un archivo NDJSON
20. [POST /terminology/versions/{versionId}/publish](#20-post-terminology-versions-versionid-publish) — UC-03-04: publica una versión (borrador → activa)

---

## 1. GET /terminology/code-systems

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** Sistemas de códigos registrados
- **Operation ID:** `TerminologyCodeSystemsController_listCodeSystems`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyCodeSystemsController.listCodeSystems](../../src/modules/terminology/controllers/terminology-code-systems.controller.ts)

### Descripción de negocio

Sistemas de códigos registrados. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Los sistemas de codificación registrados. Existe porque no se podían leer: sin esto, una pantalla que quiera importar conceptos no tiene forma de ofrecer a qué sistema, y el identificador había que sacarlo de la respuesta del alta y anotarlo a mano.

### Descripción del sistema

NestJS resuelve `GET /terminology/code-systems` en `TerminologyCodeSystemsController_listCodeSystems`. El controlador delega en `CodeSystemsReadService.listCodeSystems`. No recibe body. El tipo de retorno estático es `Promise<ListCodeSystemsResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /terminology/code-systems HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /terminology/code-systems HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListCodeSystemsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListCodeSystemsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListCodeSystemsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListCodeSystemsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListCodeSystemsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListCodeSystemsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListCodeSystemsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "internalCode": "icd10cm",
      "name": "Nombre de ejemplo",
      "canonicalUrl": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<CodeSystemListItemDto>` | Sin restricción adicional declarada | Los sistemas registrados. | `[{"id":"00000000-0000-4000-8000-000000000001","internalCode":"icd10cm","name":"Nombre de ejemplo","canonicalUrl":"valor-ejemplo"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del sistema. | `00000000-0000-4000-8000-000000000001` |
| `items[].internalCode` | Sí | `string` | Sin restricción adicional declarada | Código interno | `icd10cm` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre del sistema de codificación | `Nombre de ejemplo` |
| `items[].canonicalUrl` | Sí | `string` | Sin restricción adicional declarada | URL canónica del sistema | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/terminology/code-systems"
}
```

---

## 2. POST /terminology/code-systems

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-01: crea un sistema de códigos y su fuente
- **Operation ID:** `TerminologyCodeSystemsController_createCodeSystem`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyCodeSystemsController.createCodeSystem](../../src/modules/terminology/controllers/terminology-code-systems.controller.ts)

### Descripción de negocio

UC-03-01: crea un sistema de códigos y su fuente. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create code system.

### Descripción del sistema

NestJS resuelve `POST /terminology/code-systems` en `TerminologyCodeSystemsController_createCodeSystem`. El controlador delega en `CodeSystemsService.createCodeSystem`. Valida el body como `CreateCodeSystemDto` y consume `application/json`. El tipo de retorno estático es `Promise<CodeSystemResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCodeSystemDto`; los campos opcionales se omiten.

```http
POST /terminology/code-systems HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "internalCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "canonicalUrl": "valor-ejemplo",
  "sourceCode": "CODIGO_EJEMPLO",
  "sourceName": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `internalCode` | Sí | `string` | longitud mínima 1; longitud máxima 255 | Código interno único del sistema de códigos | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 255 | Nombre legible del sistema de códigos | `Nombre de ejemplo` |
| `canonicalUrl` | Sí | `string` | longitud mínima 1 | URL canónica FHIR del sistema de códigos | `valor-ejemplo` |
| `sourceCode` | Sí | `string` | longitud mínima 1; longitud máxima 255 | Código de negocio de la fuente que publica el sistema | `CODIGO_EJEMPLO` |
| `sourceName` | Sí | `string` | longitud mínima 1; longitud máxima 255 | Nombre de la fuente que publica el sistema | `Nombre de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /terminology/code-systems HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "internalCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "canonicalUrl": "valor-ejemplo",
  "sourceCode": "CODIGO_EJEMPLO",
  "sourceName": "Nombre de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CodeSystemResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CodeSystemResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CodeSystemResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CodeSystemResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CodeSystemResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CodeSystemResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CodeSystemResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CodeSystemResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CodeSystemResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CodeSystemResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "internalCode": "CODIGO_EJEMPLO",
  "sourceId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id del sistema de códigos creado | `00000000-0000-4000-8000-000000000001` |
| `internalCode` | Sí | `string` | Sin restricción adicional declarada | Código interno del sistema de códigos | `CODIGO_EJEMPLO` |
| `sourceId` | Sí | `string` | Sin restricción adicional declarada | Id de la fuente (creada o reutilizada) | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un sistema de códigos con ese código interno | Excepción explícita en src/modules/terminology/services/code-systems.service.ts |
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
  "path": "/terminology/code-systems"
}
```

---

## 3. GET /terminology/code-systems/{id}/versions

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** Versiones de un sistema de códigos
- **Operation ID:** `TerminologyCodeSystemsController_listVersions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyCodeSystemsController.listVersions](../../src/modules/terminology/controllers/terminology-code-systems.controller.ts)

### Descripción de negocio

Versiones de un sistema de códigos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Las versiones de un sistema de codificación. Cada una dice si **admite conceptos**, que es la pregunta que se hace quien va a importar: una versión publicada ya no los acepta.

### Descripción del sistema

NestJS resuelve `GET /terminology/code-systems/{id}/versions` en `TerminologyCodeSystemsController_listVersions`. El controlador delega en `CodeSystemsReadService.listVersions`. No recibe body. El tipo de retorno estático es `Promise<ListCodeSystemVersionsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /terminology/code-systems/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /terminology/code-systems/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListCodeSystemVersionsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListCodeSystemVersionsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListCodeSystemVersionsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListCodeSystemVersionsResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ListCodeSystemVersionsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListCodeSystemVersionsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListCodeSystemVersionsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListCodeSystemVersionsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "version": 2026,
      "state": "DRAFT",
      "isDefault": true,
      "publishedAt": "2026-07-31T12:00:00.000Z",
      "acceptsConcepts": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<CodeSystemVersionListItemDto>` | Sin restricción adicional declarada | Las versiones del sistema. | `[{"id":"00000000-0000-4000-8000-000000000001","version":2026,"state":"DRAFT","isDefault":true,"publishedAt":"2026-07-31T12:00:00.000Z","acceptsConcepts":true}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la versión. | `00000000-0000-4000-8000-000000000001` |
| `items[].version` | Sí | `string` | Sin restricción adicional declarada | Versión | `2026` |
| `items[].state` | Sí | `string` | valores: `DRAFT`, `ACTIVE`, `RETIRED`, `DEPRECATED`, `UNKNOWN` | Estado, en palabra. `UNKNOWN` es el caso real de las versiones que dejaron los importadores externos sin fijar estado: no es un error, y admiten conceptos igual. `RETIRED` y `DEPRECATED` se nombran aparte porque **no** los admiten, y agruparlos bajo `UNKNOWN` los hacía pasar por el caso que sí. | `DRAFT` |
| `items[].isDefault` | Sí | `boolean` | Sin restricción adicional declarada | Si es la versión por defecto | `true` |
| `items[].publishedAt` | Sí | `string` | formato `date-time`; admite null | Cuándo se publicó, si se publicó. | `2026-07-31T12:00:00.000Z` |
| `items[].acceptsConcepts` | Sí | `boolean` | Sin restricción adicional declarada | Si se le pueden importar conceptos | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/terminology/code-systems/{id}/versions"
}
```

---

## 4. POST /terminology/code-systems/{id}/versions

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-02: crea una versión (borrador) de un sistema de códigos
- **Operation ID:** `TerminologyCodeSystemsController_createVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyCodeSystemsController.createVersion](../../src/modules/terminology/controllers/terminology-code-systems.controller.ts)

### Descripción de negocio

UC-03-02: crea una versión (borrador) de un sistema de códigos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create version.

### Descripción del sistema

NestJS resuelve `POST /terminology/code-systems/{id}/versions` en `TerminologyCodeSystemsController_createVersion`. El controlador delega en `CodeSystemsService.createVersion`. Valida el body como `CreateCodeSystemVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<CodeSystemVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCodeSystemVersionDto`; los campos opcionales se omiten.

```http
POST /terminology/code-systems/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "version": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `version` | Sí | `string` | longitud mínima 1; longitud máxima 255 | Etiqueta de versión (p. ej. 1.0.0) | `valor-ejemplo` |
| `isDefault` | No | `boolean` | Sin restricción adicional declarada | Marca la versión como predeterminada | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /terminology/code-systems/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "version": "valor-ejemplo",
  "isDefault": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CodeSystemVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CodeSystemVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CodeSystemVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CodeSystemVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CodeSystemVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CodeSystemVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CodeSystemVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CodeSystemVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CodeSystemVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CodeSystemVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CodeSystemVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "version": "valor-ejemplo",
  "state": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id de la versión creada | `00000000-0000-4000-8000-000000000001` |
| `version` | Sí | `string` | Sin restricción adicional declarada | Etiqueta de versión | `valor-ejemplo` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Estado del ciclo de vida (código de concepto) | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sistema de códigos no encontrado | Excepción explícita en src/modules/terminology/services/code-systems.service.ts |
| 409 | `CONFLICT` | Ya existe esa versión para el sistema de códigos | Excepción explícita en src/modules/terminology/services/code-systems.service.ts |
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
  "path": "/terminology/code-systems/{id}/versions"
}
```

---

## 5. GET /terminology/CodeSystem/$lookup

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-11: resuelve un concepto por sistema y código
- **Operation ID:** `TerminologyFhirController_lookup`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyFhirController.lookup](../../src/modules/terminology/controllers/terminology-fhir.controller.ts)

### Descripción de negocio

UC-03-11: resuelve un concepto por sistema y código. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación lookup.

### Descripción del sistema

NestJS resuelve `GET /terminology/CodeSystem/$lookup` en `TerminologyFhirController_lookup`. El controlador delega en `ConceptsService.lookupConcept`. No recibe body. El tipo de retorno estático es `Promise<LookupResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `system` | query | Sí | `string` | Sin restricción adicional declarada | URL canónica del sistema de códigos | `valor-ejemplo` |
| `code` | query | Sí | `string` | Sin restricción adicional declarada | Código dentro del sistema | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /terminology/CodeSystem/$lookup?system=valor-ejemplo&code=CODIGO_EJEMPLO HTTP/1.1
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
GET /terminology/CodeSystem/$lookup?system=valor-ejemplo&code=CODIGO_EJEMPLO HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LookupResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<LookupResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<LookupResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<LookupResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<LookupResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<LookupResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LookupResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "conceptId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "display": "valor-ejemplo",
  "definition": "valor-ejemplo",
  "selectable": true,
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "designations": [
    {
      "value": "valor-ejemplo",
      "languageConceptId": "es-BO",
      "preferred": true
    }
  ],
  "properties": [
    {
      "propertyCode": "CODIGO_EJEMPLO",
      "dataType": "valor-ejemplo",
      "valueJson": {
        "clave": "valor"
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `conceptId` | Sí | `string` | Sin restricción adicional declarada | Id del concepto resuelto | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Código dentro del sistema | `CODIGO_EJEMPLO` |
| `display` | Sí | `string` | Sin restricción adicional declarada | Denominación principal | `valor-ejemplo` |
| `definition` | No | `string` | Sin restricción adicional declarada | Definición del concepto | `valor-ejemplo` |
| `selectable` | No | `boolean` | Sin restricción adicional declarada | Si el concepto puede seleccionarse | `true` |
| `stateConceptId` | No | `string` | Sin restricción adicional declarada | Estado del concepto | `00000000-0000-4000-8000-000000000001` |
| `designations` | Sí | `array<LookupDesignationDto>` | Sin restricción adicional declarada | Designaciones multilingües | `[{"value":"valor-ejemplo","languageConceptId":"es-BO","preferred":true}]` |
| `designations[].value` | Sí | `string` | Sin restricción adicional declarada | Texto de la designación | `valor-ejemplo` |
| `designations[].languageConceptId` | No | `string` | Sin restricción adicional declarada | Idioma (concepto) | `es-BO` |
| `designations[].preferred` | No | `boolean` | Sin restricción adicional declarada | Si es la designación preferida de su idioma | `true` |
| `properties` | Sí | `array<LookupPropertyDto>` | Sin restricción adicional declarada | Propiedades del concepto | `[{"propertyCode":"CODIGO_EJEMPLO","dataType":"valor-ejemplo","valueJson":{"clave":"valor"}}]` |
| `properties[].propertyCode` | Sí | `string` | Sin restricción adicional declarada | Código de la propiedad | `CODIGO_EJEMPLO` |
| `properties[].dataType` | No | `string` | Sin restricción adicional declarada | Tipo de dato técnico | `valor-ejemplo` |
| `properties[].valueJson` | Sí | `object` | Sin restricción adicional declarada | Valor de la propiedad | `{"clave":"valor"}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Sistema de códigos no encontrado | Excepción explícita en src/modules/terminology/services/concepts.service.ts |
| 404 | `NOT_FOUND` | El sistema de códigos no tiene versión vigente publicada | Excepción explícita en src/modules/terminology/services/concepts.service.ts |
| 404 | `NOT_FOUND` | Código no encontrado en la versión vigente | Excepción explícita en src/modules/terminology/services/concepts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/terminology/CodeSystem/$lookup"
}
```

---

## 6. POST /terminology/ConceptMap/$translate

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-09: cura o consulta un mapeo entre conceptos
- **Operation ID:** `TerminologyFhirController_translate`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyFhirController.translate](../../src/modules/terminology/controllers/terminology-fhir.controller.ts)

### Descripción de negocio

UC-03-09: cura o consulta un mapeo entre conceptos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación translate.

### Descripción del sistema

NestJS resuelve `POST /terminology/ConceptMap/$translate` en `TerminologyFhirController_translate`. El controlador delega en `ConceptMapsService.translate`. Valida el body como `TranslateConceptDto` y consume `application/json`. El tipo de retorno estático es `Promise<TranslateResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `TranslateConceptDto`; los campos opcionales se omiten.

```http
POST /terminology/ConceptMap/$translate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sourceConceptId` | Sí | `string` | formato `uuid` | Concepto de origen | `00000000-0000-4000-8000-000000000001` |
| `targetConceptId` | No | `string` | formato `uuid` | Concepto de destino. Si se envía, la llamada cura el mapeo. | `00000000-0000-4000-8000-000000000001` |
| `equivalence` | No | `string` | valores: `EQUIVALENT`, `WIDER`, `NARROWER`, `INEXACT`, `UNMATCHED` | Equivalencia del mapeo; obligatoria al curar | `EQUIVALENT` |
| `context` | No | `string` | longitud máxima 255 | Contexto del mapeo | `valor-ejemplo` |
| `version` | No | `string` | longitud máxima 50 | Versión del mapeo | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /terminology/ConceptMap/$translate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceConceptId": "00000000-0000-4000-8000-000000000001",
  "targetConceptId": "00000000-0000-4000-8000-000000000001",
  "equivalence": "EQUIVALENT",
  "context": "valor-ejemplo",
  "version": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TranslateResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TranslateResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TranslateResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TranslateResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TranslateResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TranslateResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TranslateResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TranslateResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TranslateResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TranslateResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "sourceConceptId": "00000000-0000-4000-8000-000000000001",
  "matched": true,
  "matches": [
    {
      "conceptMapId": "00000000-0000-4000-8000-000000000001",
      "targetConceptId": "00000000-0000-4000-8000-000000000001",
      "equivalenceConceptId": "00000000-0000-4000-8000-000000000001",
      "context": "valor-ejemplo"
    }
  ],
  "curated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sourceConceptId` | Sí | `string` | Sin restricción adicional declarada | Concepto de origen | `00000000-0000-4000-8000-000000000001` |
| `matched` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si hay al menos una traducción | `true` |
| `matches` | Sí | `array<TranslationMatchDto>` | Sin restricción adicional declarada | Traducciones encontradas | `[{"conceptMapId":"00000000-0000-4000-8000-000000000001","targetConceptId":"00000000-0000-4000-8000-000000000001","equivalenceConceptId":"00000000-0000-4000-8000-000000000001","context":"valor-ejemplo"}]` |
| `matches[].conceptMapId` | Sí | `string` | Sin restricción adicional declarada | Id del mapeo | `00000000-0000-4000-8000-000000000001` |
| `matches[].targetConceptId` | Sí | `string` | Sin restricción adicional declarada | Concepto de destino | `00000000-0000-4000-8000-000000000001` |
| `matches[].equivalenceConceptId` | No | `string` | Sin restricción adicional declarada | Equivalencia (concepto) | `00000000-0000-4000-8000-000000000001` |
| `matches[].context` | No | `string` | Sin restricción adicional declarada | Contexto del mapeo | `valor-ejemplo` |
| `curated` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si la llamada curó un mapeo en vez de sólo consultar | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Concepto origen no encontrado | Excepción explícita en src/modules/terminology/services/concept-maps.service.ts |
| 404 | `NOT_FOUND` | Concepto destino no encontrado | Excepción explícita en src/modules/terminology/services/concept-maps.service.ts |
| 404 | `NOT_FOUND` | El mapeo dejó de existir durante el curado | Excepción explícita en src/modules/terminology/services/concept-maps.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Curar un mapeo exige declarar la equivalencia | Excepción explícita en src/modules/terminology/services/concept-maps.service.ts |
| 422 | `PRECONDITION_FAILED` | Un concepto no puede mapearse a sí mismo | Excepción explícita en src/modules/terminology/services/concept-maps.service.ts |
| 422 | `PRECONDITION_FAILED` | Los conceptos del mapeo tienen que estar activos | Excepción explícita en src/modules/terminology/services/concept-maps.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/terminology/ConceptMap/$translate"
}
```

---

## 7. GET /terminology/concepts

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-13: busca conceptos por código/denominación, o resuelve ids a etiqueta
- **Operation ID:** `TerminologyConceptsController_searchConcepts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyConceptsController.searchConcepts](../../src/modules/terminology/controllers/terminology-concepts.controller.ts)

### Descripción de negocio

UC-03-13: busca conceptos por código/denominación, o resuelve ids a etiqueta. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-03-13: busca conceptos por texto para poder rellenar cualquier campo `*ConceptId` del contrato. Es de sólo lectura y no exige rol de administración: el catálogo es metadato compartido, sin datos de paciente, y cualquier cliente autenticado necesita resolver estos ids para poder crear recursos. Con `ids` hace el camino inverso —de id a etiqueta—, que es el que necesita cualquier pantalla que muestre lo que el contrato devuelve: los estados, ciclos de vida y clasificaciones viajan siempre como `*ConceptId` en UUID. ## Los dos parámetros nuevos, y la promesa que los acompaña `lang` devuelve `display` y `definition` en ese idioma —resueltos desde las designaciones del catálogo, cayendo al texto del sistema de codificación cuando falta la traducción— e `includeValueSets` añade a cada concepto los conjuntos de valores a los que pertenece. **Sin ellos, la respuesta es exactamente la de siempre.** No es una intención: los campos que agregan son claves opcionales que ni siquiera viajan en el JSON si no se piden, y hay una prueba que lo fija. Esta lectura la consumen la agenda, el perfil profesional, los diagnósticos y la ficha clínica a través de `readConceptLabels`, y ninguna de ellas manda estos parámetros.

### Descripción del sistema

NestJS resuelve `GET /terminology/concepts` en `TerminologyConceptsController_searchConcepts`. El controlador delega en `ConceptsService.searchConcepts`. No recibe body. El tipo de retorno estático es `Promise<SearchConceptsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en el código o la denominación | `valor-ejemplo` |
| `codeSystemVersionId` | query | No | `string` | Sin restricción adicional declarada | Acota la búsqueda a una versión de sistema de códigos | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope de resultados (por defecto 50) | `1` |
| `ids` | query | No | `array<string>` | Sin restricción adicional declarada | Ids de concepto a resolver, separados por coma (máx. 200). Es la vía para traducir a etiqueta los `*ConceptId` que devuelve el resto del contrato | `["valor-ejemplo"]` |
| `lang` | query | No | `string` | valores: `ES`, `EN` | Idioma preferido de `display` y `definition`. Sin este parámetro la respuesta es idéntica a la histórica; con él, los conceptos sin designación en ese idioma vuelven con su texto original y `translated: false` | `ES` |
| `includeValueSets` | query | No | `string` | Sin restricción adicional declarada | Añade a cada concepto los conjuntos de valores a los que pertenece — el camino inverso al de `$expand` | `valor-ejemplo` |
| `valueSetId` | query | No | `string` | Sin restricción adicional declarada | Acota a los conceptos de ese conjunto de valores. Es «navegar por categoría»: se combina con `q` y devuelve lo mismo que la búsqueda, no los miembros crudos de `$expand` | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /terminology/concepts HTTP/1.1
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
GET /terminology/concepts?q=valor-ejemplo&codeSystemVersionId=00000000-0000-4000-8000-000000000001&limit=1&ids=valor-ejemplo&lang=ES&includeValueSets=valor-ejemplo&valueSetId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SearchConceptsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SearchConceptsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SearchConceptsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SearchConceptsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SearchConceptsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SearchConceptsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SearchConceptsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "GENDER_FEMALE",
      "display": "valor-ejemplo",
      "definition": "valor-ejemplo",
      "selectable": true,
      "codeSystemVersionId": "00000000-0000-4000-8000-000000000001",
      "translated": true,
      "valueSets": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "internalCode": "condition-severity",
          "name": "Severidad"
        }
      ],
      "slug": "hipertension-arterial",
      "category": {
        "internalCode": "glossary-category-anatomy",
        "name": "Anatomía"
      },
      "shortDefinition": "valor-ejemplo",
      "tags": [
        "valor-ejemplo"
      ],
      "relationsCount": 1,
      "status": "active"
    }
  ],
  "count": 1,
  "limit": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ConceptSearchItemDto>` | Sin restricción adicional declarada | Conceptos que casan con el filtro. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"GENDER_FEMALE","display":"valor-ejemplo","definition":"valor-ejemplo","selectable":true,"codeSystemVersionId":"00000000-0000-4000-8000-000000000001","translated":true,"valueSets":[{"id":"00000000-0000-4000-8000-000000000001","internalCode":"condition-severity","name":"Severidad"}],"slug":"hipertension-arterial","category":{"internalCode":"glossary-category-anatomy","name":"Anatomía"},"shortDefinition":"valor-ejemplo","tags":["valor-ejemplo"],"relationsCount":1,"status":"active"}]` |
| `items[].conceptId` | Sí | `string` | formato `uuid` | Valor a enviar en los campos `*ConceptId` del contrato | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código del concepto | `GENDER_FEMALE` |
| `items[].display` | Sí | `string` | Sin restricción adicional declarada | Denominación principal | `valor-ejemplo` |
| `items[].definition` | No | `string` | Sin restricción adicional declarada | Definición del concepto | `valor-ejemplo` |
| `items[].selectable` | No | `boolean` | Sin restricción adicional declarada | Si el concepto puede seleccionarse | `true` |
| `items[].codeSystemVersionId` | Sí | `string` | formato `uuid` | Versión del sistema de códigos | `00000000-0000-4000-8000-000000000001` |
| `items[].translated` | No | `boolean` | Sin restricción adicional declarada | Si los textos vienen en el idioma pedido. `false` significa que se devolvió el original del sistema de codificación porque falta la designación | `true` |
| `items[].valueSets` | No | `array<ConceptValueSetRefDto>` | Sin restricción adicional declarada | Conjuntos de valores a los que pertenece el concepto. Sólo se informa con `includeValueSets=true`. Son las categorías bajo las cuales el término tiene sentido —«Diagnóstico», «Severidad», «Vía de administración»— y es lo que el glosario pinta como etiquetas. | `[{"id":"00000000-0000-4000-8000-000000000001","internalCode":"condition-severity","name":"Severidad"}]` |
| `items[].valueSets[].id` | No | `string` | formato `uuid` | Identificador del conjunto de valores. | `00000000-0000-4000-8000-000000000001` |
| `items[].valueSets[].internalCode` | No | `string` | Sin restricción adicional declarada | Código interno estable, como `condition-severity`. | `condition-severity` |
| `items[].valueSets[].name` | No | `string` | Sin restricción adicional declarada | Nombre legible del conjunto. Es el texto de la etiqueta. | `Severidad` |
| `items[].slug` | No | `string` | Sin restricción adicional declarada | Slug kebab-case del término, único en el glosario. | `hipertension-arterial` |
| `items[].category` | No | `ConceptTaxonomyRefDto` | Sin restricción adicional declarada | Categoría del término, o `null` si —siendo del glosario— no tiene ninguna asignada. | `{"internalCode":"glossary-category-anatomy","name":"Anatomía"}` |
| `items[].category.internalCode` | No | `string` | Sin restricción adicional declarada | Código interno estable, como `glossary-category-anatomy`. | `glossary-category-anatomy` |
| `items[].category.name` | No | `string` | Sin restricción adicional declarada | Nombre legible de la categoría. | `Anatomía` |
| `items[].shortDefinition` | No | `string` | Sin restricción adicional declarada | Resumen en lenguaje llano, para la columna «definición corta» de la tabla. | `valor-ejemplo` |
| `items[].tags` | No | `array<string>` | Sin restricción adicional declarada | Nombres de las etiquetas del término (la categoría no se repite acá). | `["valor-ejemplo"]` |
| `items[].relationsCount` | No | `number` | Sin restricción adicional declarada | Cuántas relaciones tipadas tiene el término; la lista completa vive en la ficha. | `1` |
| `items[].status` | No | `string` | Sin restricción adicional declarada | Estado publicado del término (`active`, hoy el único que puede llegar al glosario público). | `active` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope de resultados aplicado | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El conjunto de valores no existe o no tiene versión vigente | Excepción explícita en src/modules/terminology/services/concepts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/terminology/concepts"
}
```

---

## 8. GET /terminology/concepts/{conceptId}

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** Lee la ficha de un concepto: textos en el idioma pedido, conjuntos de valores a los que pertenece y denominaciones alternativas
- **Operation ID:** `TerminologyConceptsController_readConcept`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyConceptsController.readConcept](../../src/modules/terminology/controllers/terminology-concepts.controller.ts)

### Descripción de negocio

Lee la ficha de un concepto: textos en el idioma pedido, conjuntos de valores a los que pertenece y denominaciones alternativas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: La ficha de un término: sus textos, sus etiquetas y sus sinónimos. Es lo que abre el glosario al hacer clic en una entrada. Va **después** del `@Get()` de la búsqueda, que no tiene segmento: si estuviera antes, un `:conceptId` se comería la ruta del listado. De sólo lectura y sin rol de administración, por el mismo motivo que la búsqueda: el catálogo es metadato compartido, sin datos de paciente.

### Descripción del sistema

NestJS resuelve `GET /terminology/concepts/{conceptId}` en `TerminologyConceptsController_readConcept`. El controlador delega en `ConceptsService.readConcept`. No recibe body. El tipo de retorno estático es `Promise<ConceptDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conceptId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lang` | query | No | `string` | valores: `ES`, `EN` | Idioma preferido de `display` y `definition` | `ES` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /terminology/concepts/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `conceptId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /terminology/concepts/00000000-0000-4000-8000-000000000001?lang=ES HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ConceptDetailDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ConceptDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ConceptDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ConceptDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ConceptDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ConceptDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ConceptDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConceptDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "conceptId": "00000000-0000-4000-8000-000000000001",
  "code": "I10",
  "display": "valor-ejemplo",
  "definition": "valor-ejemplo",
  "selectable": true,
  "codeSystemVersionId": "00000000-0000-4000-8000-000000000001",
  "translated": true,
  "valueSets": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "internalCode": "condition-severity",
      "name": "Severidad"
    }
  ],
  "synonyms": [
    {
      "value": "valor-ejemplo",
      "language": "ES",
      "preferred": true
    }
  ],
  "slug": "hipertension-arterial",
  "clinicalDefinition": {
    "text": "valor-ejemplo",
    "translated": true
  },
  "plainSummary": {
    "text": "valor-ejemplo",
    "translated": true
  },
  "category": {
    "valueSetId": "00000000-0000-4000-8000-000000000001",
    "internalCode": "glossary-category-anatomy",
    "name": "Anatomía"
  },
  "tags": [
    {
      "valueSetId": "00000000-0000-4000-8000-000000000001",
      "internalCode": "glossary-category-anatomy",
      "name": "Anatomía"
    }
  ],
  "relations": [
    {
      "type": {},
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "slug": "valor-ejemplo",
      "display": "valor-ejemplo"
    }
  ],
  "properties": {
    "clave": "valor"
  },
  "image": {
    "source": "valor-ejemplo",
    "license": "valor-ejemplo",
    "attribution": "valor-ejemplo",
    "alt": "valor-ejemplo",
    "status": "approved"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `conceptId` | Sí | `string` | formato `uuid` | Id del concepto. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Código dentro de su sistema. | `I10` |
| `display` | Sí | `string` | Sin restricción adicional declarada | Denominación, en el idioma pedido si la hay. | `valor-ejemplo` |
| `definition` | No | `string` | Sin restricción adicional declarada | Definición, en el idioma pedido si la hay. | `valor-ejemplo` |
| `selectable` | No | `boolean` | Sin restricción adicional declarada | Si el concepto puede seleccionarse. | `true` |
| `codeSystemVersionId` | Sí | `string` | formato `uuid` | Versión del sistema de códigos a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `translated` | No | `boolean` | Sin restricción adicional declarada | Si los textos vienen en el idioma pedido; ver . | `true` |
| `valueSets` | Sí | `array<ConceptValueSetRefDto>` | Sin restricción adicional declarada | Categorías a las que pertenece el término. | `[{"id":"00000000-0000-4000-8000-000000000001","internalCode":"condition-severity","name":"Severidad"}]` |
| `valueSets[].id` | Sí | `string` | formato `uuid` | Identificador del conjunto de valores. | `00000000-0000-4000-8000-000000000001` |
| `valueSets[].internalCode` | Sí | `string` | Sin restricción adicional declarada | Código interno estable, como `condition-severity`. | `condition-severity` |
| `valueSets[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible del conjunto. Es el texto de la etiqueta. | `Severidad` |
| `synonyms` | Sí | `array<ConceptSynonymDto>` | Sin restricción adicional declarada | Otras formas de nombrar lo mismo. Se excluye la designación que ya se está mostrando como `display`: repetirla bajo el título «también se le dice» no informa de nada. | `[{"value":"valor-ejemplo","language":"ES","preferred":true}]` |
| `synonyms[].value` | Sí | `string` | Sin restricción adicional declarada | El texto de la denominación. | `valor-ejemplo` |
| `synonyms[].language` | No | `string` | valores: `ES`, `EN` | Idioma de la denominación, cuando el catálogo lo declara. | `ES` |
| `synonyms[].preferred` | No | `boolean` | Sin restricción adicional declarada | Si es la denominación preferida de su idioma. | `true` |
| `slug` | No | `string` | Sin restricción adicional declarada | Slug del término, si es un término del glosario. | `hipertension-arterial` |
| `clinicalDefinition` | No | `ConceptTextDto` | Sin restricción adicional declarada | Definición clínica, si el término la tiene cargada. | `{"text":"valor-ejemplo","translated":true}` |
| `clinicalDefinition.text` | No | `string` | Sin restricción adicional declarada | El texto, en el idioma pedido o su respaldo en castellano. | `valor-ejemplo` |
| `clinicalDefinition.translated` | No | `boolean` | Sin restricción adicional declarada | Si `text` vino en el idioma pedido. En `false`, es el texto en castellano —siempre presente, es obligatorio en el catálogo curado— porque no hay traducción cargada para ese idioma. | `true` |
| `plainSummary` | No | `ConceptTextDto` | Sin restricción adicional declarada | Resumen en lenguaje llano, si el término lo tiene cargado. | `{"text":"valor-ejemplo","translated":true}` |
| `plainSummary.text` | No | `string` | Sin restricción adicional declarada | El texto, en el idioma pedido o su respaldo en castellano. | `valor-ejemplo` |
| `plainSummary.translated` | No | `boolean` | Sin restricción adicional declarada | Si `text` vino en el idioma pedido. En `false`, es el texto en castellano —siempre presente, es obligatorio en el catálogo curado— porque no hay traducción cargada para ese idioma. | `true` |
| `category` | Sí | `ConceptCategoryRefDto` | Sin restricción adicional declarada | Categoría del glosario a la que pertenece, o `null` si no pertenece a ninguna. | `{"valueSetId":"00000000-0000-4000-8000-000000000001","internalCode":"glossary-category-anatomy","name":"Anatomía"}` |
| `category.valueSetId` | Sí | `string` | formato `uuid` | Identificador del value set. | `00000000-0000-4000-8000-000000000001` |
| `category.internalCode` | Sí | `string` | Sin restricción adicional declarada | Código interno estable. | `glossary-category-anatomy` |
| `category.name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible. | `Anatomía` |
| `tags` | Sí | `array<ConceptCategoryRefDto>` | Sin restricción adicional declarada | Etiquetas del glosario (la categoría no se repite acá). | `[{"valueSetId":"00000000-0000-4000-8000-000000000001","internalCode":"glossary-category-anatomy","name":"Anatomía"}]` |
| `tags[].valueSetId` | Sí | `string` | formato `uuid` | Identificador del value set. | `00000000-0000-4000-8000-000000000001` |
| `tags[].internalCode` | Sí | `string` | Sin restricción adicional declarada | Código interno estable. | `glossary-category-anatomy` |
| `tags[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible. | `Anatomía` |
| `relations` | Sí | `array<ConceptRelationDto>` | Sin restricción adicional declarada | Relaciones tipadas salientes, con el término destino ya resuelto. | `[{"type":{},"conceptId":"00000000-0000-4000-8000-000000000001","slug":"valor-ejemplo","display":"valor-ejemplo"}]` |
| `relations[].type` | Sí | `object` | Sin restricción adicional declarada | Tipo de relación. | `{}` |
| `relations[].conceptId` | Sí | `string` | formato `uuid` | Id del concepto destino. | `00000000-0000-4000-8000-000000000001` |
| `relations[].slug` | Sí | `string` | Sin restricción adicional declarada | Slug del término destino. | `valor-ejemplo` |
| `relations[].display` | Sí | `string` | Sin restricción adicional declarada | Denominación del término destino (EN, `CatalogConcepts.display`). | `valor-ejemplo` |
| `properties` | Sí | `object` | Sin restricción adicional declarada | Propiedades declaradas del concepto, indexadas por su código. Es donde cada code system guarda lo suyo sin que el modelo tenga que declarar una columna por vocabulario: el vademécum publica acá `dose_forms`, `strengths` y `routes` —lo que la pantalla de receta necesita para que el profesional elija presentación y concentración en vez de teclearlas—, y también `rxnorm_cui` o `snomed_code` para cruzar con otros catálogos. Se devuelve como mapa `código -> valor` y no como lista de pares porque se consume por nombre (`properties.strengths`), nunca recorriéndolo. El valor es el `value_json` tal como se guardó: un texto, una lista o un objeto, según lo que declare cada propiedad. Va sólo en la ficha, no en la búsqueda: son varias filas por concepto y traerlas para cada resultado de un autocompletar es peso que la lista no usa. | `{"clave":"valor"}` |
| `image` | No | `ConceptImageDto` | Sin restricción adicional declarada | Imagen ilustrativa. Siempre ausente hoy (ver ); el campo existe para que un carril futuro pueda adjuntar una sin romper el contrato. | `{"source":"valor-ejemplo","license":"valor-ejemplo","attribution":"valor-ejemplo","alt":"valor-ejemplo","status":"approved"}` |
| `image.source` | No | `string` | Sin restricción adicional declarada | URL o referencia del activo. | `valor-ejemplo` |
| `image.license` | No | `string` | Sin restricción adicional declarada | Licencia bajo la que se usa la imagen. | `valor-ejemplo` |
| `image.attribution` | No | `string` | Sin restricción adicional declarada | A quién atribuir la imagen. | `valor-ejemplo` |
| `image.alt` | No | `string` | Sin restricción adicional declarada | Texto alternativo, para accesibilidad. | `valor-ejemplo` |
| `image.status` | No | `string` | valores: `approved`, `pending`, `rejected` | Estado de revisión de la imagen. | `approved` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Concepto no encontrado | Excepción explícita en src/modules/terminology/services/concepts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/terminology/concepts/{conceptId}"
}
```

---

## 9. POST /terminology/concepts/{conceptId}/$deprecate

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-10: retira el concepto y lo excluye de las expansiones
- **Operation ID:** `TerminologyConceptsController_deprecateConcept`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyConceptsController.deprecateConcept](../../src/modules/terminology/controllers/terminology-concepts.controller.ts)

### Descripción de negocio

UC-03-10: retira el concepto y lo excluye de las expansiones. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación deprecate concept.

### Descripción del sistema

NestJS resuelve `POST /terminology/concepts/{conceptId}/$deprecate` en `TerminologyConceptsController_deprecateConcept`. El controlador delega en `ConceptsService.deprecateConcept`. Valida el body como `DeprecateConceptDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeprecateConceptResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conceptId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DeprecateConceptDto`; los campos opcionales se omiten.

```http
POST /terminology/concepts/00000000-0000-4000-8000-000000000001/$deprecate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `conceptId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `replacedByConceptId` | No | `string` | formato `uuid` | Concepto que lo sustituye; tiene que estar activo | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /terminology/concepts/00000000-0000-4000-8000-000000000001/$deprecate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "replacedByConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DeprecateConceptResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeprecateConceptResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeprecateConceptResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeprecateConceptResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DeprecateConceptResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeprecateConceptResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeprecateConceptResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeprecateConceptResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeprecateConceptResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeprecateConceptResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeprecateConceptResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "replacedByConceptId": "00000000-0000-4000-8000-000000000001",
  "excludedMembers": 1,
  "alreadyRetired": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id del concepto retirado | `00000000-0000-4000-8000-000000000001` |
| `stateConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado en el que queda | `00000000-0000-4000-8000-000000000001` |
| `replacedByConceptId` | No | `string` | Sin restricción adicional declarada | Concepto que lo sustituye | `00000000-0000-4000-8000-000000000001` |
| `excludedMembers` | Sí | `number` | Sin restricción adicional declarada | Miembros de conjuntos de valores que quedaron excluidos | `1` |
| `alreadyRetired` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si el concepto ya estaba retirado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Concepto no encontrado | Excepción explícita en src/modules/terminology/services/concepts.service.ts |
| 404 | `NOT_FOUND` | Concepto de reemplazo no encontrado | Excepción explícita en src/modules/terminology/services/concepts.service.ts |
| 409 | `CONFLICT` | Un concepto no puede reemplazarse a sí mismo | Excepción explícita en src/modules/terminology/services/concepts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El concepto de reemplazo está retirado | Excepción explícita en src/modules/terminology/services/concepts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/terminology/concepts/{conceptId}/$deprecate"
}
```

---

## 10. POST /terminology/concepts/{conceptId}/designations

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-05: añade una designación (y opcionalmente propiedades)
- **Operation ID:** `TerminologyConceptsController_addDesignation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyConceptsController.addDesignation](../../src/modules/terminology/controllers/terminology-concepts.controller.ts)

### Descripción de negocio

UC-03-05: añade una designación (y opcionalmente propiedades). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea add designation.

### Descripción del sistema

NestJS resuelve `POST /terminology/concepts/{conceptId}/designations` en `TerminologyConceptsController_addDesignation`. El controlador delega en `ConceptsService.addDesignation`. Valida el body como `CreateDesignationDto` y consume `application/json`. El tipo de retorno estático es `Promise<DesignationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conceptId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDesignationDto`; los campos opcionales se omiten.

```http
POST /terminology/concepts/00000000-0000-4000-8000-000000000001/designations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "value": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `conceptId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `value` | Sí | `string` | longitud mínima 1; longitud máxima 255 | Texto de la designación | `valor-ejemplo` |
| `language` | No | `string` | valores: `ES`, `EN` | Idioma de la designación | `ES` |
| `designationType` | No | `string` | valores: `PREFERRED`, `SYNONYM` | Tipo de designación | `PREFERRED` |
| `preferred` | No | `boolean` | Sin restricción adicional declarada | Marca la designación como preferida | `true` |
| `properties` | No | `array<ConceptPropertyInputDto>` | Sin restricción adicional declarada | Propiedades a adjuntar al concepto | `[{"propertyCode":"CODIGO_EJEMPLO","valueJson":{},"dataType":"valor-ejemplo"}]` |
| `properties[].propertyCode` | No | `string` | longitud mínima 1; longitud máxima 255 | Código de la propiedad | `CODIGO_EJEMPLO` |
| `properties[].valueJson` | No | `object` | longitud mínima 1 | Valor de la propiedad (JSON arbitrario) | `{}` |
| `properties[].dataType` | No | `string` | Sin restricción adicional declarada | Tipo de dato técnico (enum terminology.technical_data_type) | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /terminology/concepts/00000000-0000-4000-8000-000000000001/designations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "value": "valor-ejemplo",
  "language": "ES",
  "designationType": "PREFERRED",
  "preferred": true,
  "properties": [
    {
      "propertyCode": "CODIGO_EJEMPLO",
      "valueJson": {},
      "dataType": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DesignationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DesignationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DesignationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DesignationResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DesignationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DesignationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DesignationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DesignationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DesignationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DesignationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DesignationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "conceptId": "00000000-0000-4000-8000-000000000001",
  "value": "valor-ejemplo",
  "languageConceptId": "es-BO",
  "designationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "preferred": true,
  "propertiesCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id de la designación creada | `00000000-0000-4000-8000-000000000001` |
| `conceptId` | Sí | `string` | Sin restricción adicional declarada | Id del concepto al que pertenece | `00000000-0000-4000-8000-000000000001` |
| `value` | Sí | `string` | Sin restricción adicional declarada | Texto de la designación | `valor-ejemplo` |
| `languageConceptId` | No | `string` | Sin restricción adicional declarada | Idioma (concepto) | `es-BO` |
| `designationTypeConceptId` | No | `string` | Sin restricción adicional declarada | Tipo de designación (concepto) | `00000000-0000-4000-8000-000000000001` |
| `preferred` | No | `boolean` | Sin restricción adicional declarada | Si es la designación preferida | `true` |
| `propertiesCount` | Sí | `number` | Sin restricción adicional declarada | Número de propiedades adjuntadas | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Concepto no encontrado | Excepción explícita en src/modules/terminology/services/concepts.service.ts |
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
  "path": "/terminology/concepts/{conceptId}/designations"
}
```

---

## 11. POST /terminology/concepts/{conceptId}/properties

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-05: alta o actualización de propiedades del concepto
- **Operation ID:** `TerminologyConceptsController_upsertProperties`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyConceptsController.upsertProperties](../../src/modules/terminology/controllers/terminology-concepts.controller.ts)

### Descripción de negocio

UC-03-05: alta o actualización de propiedades del concepto. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación upsert properties.

### Descripción del sistema

NestJS resuelve `POST /terminology/concepts/{conceptId}/properties` en `TerminologyConceptsController_upsertProperties`. El controlador delega en `ConceptsService.upsertProperties`. Valida el body como `UpsertConceptPropertiesDto` y consume `application/json`. El tipo de retorno estático es `Promise<ConceptPropertiesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conceptId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpsertConceptPropertiesDto`; los campos opcionales se omiten.

```http
POST /terminology/concepts/00000000-0000-4000-8000-000000000001/properties HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "properties": [
    {
      "propertyCode": "CODIGO_EJEMPLO",
      "valueJson": {}
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `conceptId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `properties` | Sí | `array<ConceptPropertyInputDto>` | mínimo 1 elemento(s) | Propiedades del concepto | `[{"propertyCode":"CODIGO_EJEMPLO","valueJson":{},"dataType":"valor-ejemplo"}]` |
| `properties[].propertyCode` | Sí | `string` | longitud mínima 1; longitud máxima 255 | Código de la propiedad | `CODIGO_EJEMPLO` |
| `properties[].valueJson` | Sí | `object` | longitud mínima 1 | Valor de la propiedad (JSON arbitrario) | `{}` |
| `properties[].dataType` | No | `string` | Sin restricción adicional declarada | Tipo de dato técnico (enum terminology.technical_data_type) | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /terminology/concepts/00000000-0000-4000-8000-000000000001/properties HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "properties": [
    {
      "propertyCode": "CODIGO_EJEMPLO",
      "valueJson": {},
      "dataType": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ConceptPropertiesResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ConceptPropertiesResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ConceptPropertiesResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ConceptPropertiesResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ConceptPropertiesResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ConceptPropertiesResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ConceptPropertiesResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ConceptPropertiesResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ConceptPropertiesResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ConceptPropertiesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConceptPropertiesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "conceptId": "00000000-0000-4000-8000-000000000001",
  "created": 1,
  "updated": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `conceptId` | Sí | `string` | Sin restricción adicional declarada | Id del concepto | `00000000-0000-4000-8000-000000000001` |
| `created` | Sí | `number` | Sin restricción adicional declarada | Propiedades creadas | `1` |
| `updated` | Sí | `number` | Sin restricción adicional declarada | Propiedades actualizadas sobre una existente | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Concepto no encontrado | Excepción explícita en src/modules/terminology/services/concepts.service.ts |
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
  "path": "/terminology/concepts/{conceptId}/properties"
}
```

---

## 12. POST /terminology/concepts/{conceptId}/relationships

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-06: crea una relación dirigida entre conceptos
- **Operation ID:** `TerminologyConceptsController_addRelationship`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyConceptsController.addRelationship](../../src/modules/terminology/controllers/terminology-concepts.controller.ts)

### Descripción de negocio

UC-03-06: crea una relación dirigida entre conceptos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea add relationship.

### Descripción del sistema

NestJS resuelve `POST /terminology/concepts/{conceptId}/relationships` en `TerminologyConceptsController_addRelationship`. El controlador delega en `ConceptsService.addRelationship`. Valida el body como `TerminologyCreateRelationshipDto` y consume `application/json`. El tipo de retorno estático es `Promise<RelationshipResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conceptId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `TerminologyCreateRelationshipDto`; los campos opcionales se omiten.

```http
POST /terminology/concepts/00000000-0000-4000-8000-000000000001/relationships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetConceptId": "00000000-0000-4000-8000-000000000001",
  "relationshipType": "IS_A"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `conceptId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `targetConceptId` | Sí | `string` | Sin restricción adicional declarada | Id del concepto destino | `00000000-0000-4000-8000-000000000001` |
| `relationshipType` | Sí | `string` | valores: `IS_A`, `PART_OF` | Tipo de relación | `IS_A` |
| `ordinal` | No | `number` | Sin restricción adicional declarada | Orden dentro de las relaciones del mismo tipo | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /terminology/concepts/00000000-0000-4000-8000-000000000001/relationships HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetConceptId": "00000000-0000-4000-8000-000000000001",
  "relationshipType": "IS_A",
  "ordinal": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RelationshipResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RelationshipResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "sourceConceptId": "00000000-0000-4000-8000-000000000001",
  "targetConceptId": "00000000-0000-4000-8000-000000000001",
  "relationshipTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "ordinal": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id de la relación creada | `00000000-0000-4000-8000-000000000001` |
| `sourceConceptId` | Sí | `string` | Sin restricción adicional declarada | Id del concepto origen | `00000000-0000-4000-8000-000000000001` |
| `targetConceptId` | Sí | `string` | Sin restricción adicional declarada | Id del concepto destino | `00000000-0000-4000-8000-000000000001` |
| `relationshipTypeConceptId` | Sí | `string` | Sin restricción adicional declarada | Tipo de relación (concepto) | `00000000-0000-4000-8000-000000000001` |
| `ordinal` | No | `number` | Sin restricción adicional declarada | Orden dentro de las relaciones del mismo tipo | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Concepto origen no encontrado | Excepción explícita en src/modules/terminology/services/concepts.service.ts |
| 404 | `NOT_FOUND` | Concepto destino no encontrado | Excepción explícita en src/modules/terminology/services/concepts.service.ts |
| 409 | `CONFLICT` | Un concepto no puede relacionarse consigo mismo | Excepción explícita en src/modules/terminology/services/concepts.service.ts |
| 409 | `CONFLICT` | Ya existe una relación equivalente entre esos conceptos | Excepción explícita en src/modules/terminology/services/concepts.service.ts |
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
  "path": "/terminology/concepts/{conceptId}/relationships"
}
```

---

## 13. PUT /terminology/tenants/{tenantId}/catalog-policies

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-12: define la política de catálogo del tenant
- **Operation ID:** `TerminologyTenantCatalogController_upsertPolicy`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyTenantCatalogController.upsertPolicy](../../src/modules/terminology/controllers/terminology-tenant-catalog.controller.ts)

### Descripción de negocio

UC-03-12: define la política de catálogo del tenant. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación upsert policy.

### Descripción del sistema

NestJS resuelve `PUT /terminology/tenants/{tenantId}/catalog-policies` en `TerminologyTenantCatalogController_upsertPolicy`. El controlador delega en `TenantCatalogService.upsertPolicy`. Valida el body como `UpsertTenantCatalogPolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<TenantCatalogPolicyResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpsertTenantCatalogPolicyDto`; los campos opcionales se omiten.

```http
PUT /terminology/tenants/00000000-0000-4000-8000-000000000001/catalog-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "valueSetId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `tenantId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `valueSetId` | Sí | `string` | formato `uuid` | Conjunto de valores sobre el que aplica | `00000000-0000-4000-8000-000000000001` |
| `mode` | No | `string` | valores: `INHERIT`, `SUBSET`, `EXTEND` | Sin descripción específica en el contrato OpenAPI. | `INHERIT` |
| `allowSubset` | No | `boolean` | Sin restricción adicional declarada | Si el tenant puede recortar el conjunto | `false` |
| `allowAlias` | No | `boolean` | Sin restricción adicional declarada | Si el tenant puede renombrar conceptos | `false` |
| `allowLocalConcepts` | No | `boolean` | Sin restricción adicional declarada | Si el tenant puede añadir conceptos locales | `false` |
| `validFrom` | No | `string` | formato `date-time` | Desde cuándo rige | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Hasta cuándo rige | `2026-07-31T12:00:00.000Z` |
| `concepts` | No | `array<TenantConceptConfigInputDto>` | Sin restricción adicional declarada | Configuración por concepto | `[{"conceptId":"00000000-0000-4000-8000-000000000001","enabled":true,"aliasDisplay":"valor-ejemplo","ordinal":1,"isDefault":false}]` |
| `concepts[].conceptId` | No | `string` | formato `uuid` | Concepto configurado | `00000000-0000-4000-8000-000000000001` |
| `concepts[].enabled` | No | `boolean` | Sin restricción adicional declarada | Si el tenant lo ofrece | `true` |
| `concepts[].aliasDisplay` | No | `string` | longitud máxima 255 | Nombre con el que el tenant lo muestra; exige `allowAlias` | `valor-ejemplo` |
| `concepts[].ordinal` | No | `number` | mínimo 0 | Orden de presentación | `1` |
| `concepts[].isDefault` | No | `boolean` | Sin restricción adicional declarada | Valor por omisión del conjunto; sólo uno puede serlo | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /terminology/tenants/00000000-0000-4000-8000-000000000001/catalog-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "valueSetId": "00000000-0000-4000-8000-000000000001",
  "mode": "INHERIT",
  "allowSubset": false,
  "allowAlias": false,
  "allowLocalConcepts": false,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "concepts": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "enabled": true,
      "aliasDisplay": "valor-ejemplo",
      "ordinal": 1,
      "isDefault": false
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TenantCatalogPolicyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TenantCatalogPolicyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TenantCatalogPolicyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TenantCatalogPolicyResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<TenantCatalogPolicyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TenantCatalogPolicyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TenantCatalogPolicyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TenantCatalogPolicyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TenantCatalogPolicyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TenantCatalogPolicyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TenantCatalogPolicyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "valueSetId": "00000000-0000-4000-8000-000000000001",
  "modeConceptId": "00000000-0000-4000-8000-000000000001",
  "conceptsCreated": 1,
  "conceptsUpdated": 1,
  "updated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id de la política | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | Sin restricción adicional declarada | Tenant al que pertenece | `00000000-0000-4000-8000-000000000001` |
| `valueSetId` | Sí | `string` | Sin restricción adicional declarada | Conjunto de valores sobre el que aplica | `00000000-0000-4000-8000-000000000001` |
| `modeConceptId` | No | `string` | Sin restricción adicional declarada | Modo del catálogo (concepto) | `00000000-0000-4000-8000-000000000001` |
| `conceptsCreated` | Sí | `number` | Sin restricción adicional declarada | Configuraciones de concepto creadas | `1` |
| `conceptsUpdated` | Sí | `number` | Sin restricción adicional declarada | Configuraciones de concepto actualizadas | `1` |
| `updated` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si la política ya existía y se actualizó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Conjunto de valores no encontrado | Excepción explícita en src/modules/terminology/services/tenant-catalog.service.ts |
| 404 | `NOT_FOUND` | Concepto no encontrado | Excepción explícita en src/modules/terminology/services/tenant-catalog.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La política no permite renombrar conceptos | Excepción explícita en src/modules/terminology/services/tenant-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | Sólo un concepto puede ser el valor por omisión | Excepción explícita en src/modules/terminology/services/tenant-catalog.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/terminology/tenants/{tenantId}/catalog-policies"
}
```

---

## 14. GET /terminology/value-sets

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** Listar conjuntos de valores por código interno o texto
- **Operation ID:** `TerminologyValueSetsController_searchValueSets`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyValueSetsController.searchValueSets](../../src/modules/terminology/controllers/terminology-value-sets.controller.ts)

### Descripción de negocio

Permite resolver el uuid de un conjunto desde un código estable, sin hardcodear identificadores por entorno.

Contexto declarado en el controlador: Listado de conjuntos de valores, buscable por código interno o texto libre. Va declarado **antes** que `:id/$expand` sólo por legibilidad; no compiten, porque aquél tiene dos segmentos. No pide rol, por el mismo motivo que la lectura de la expansión: un campo de formulario necesita resolver su conjunto de valores, y exigir rol de administración para eso deja el catálogo inutilizable desde el cliente. Y no pide **sesión**, que es un paso más allá: el registro público es un formulario sin sesión y su desplegable de departamentos (`VS_BO_DEPARTMENT`) empieza justamente acá. Con la ruta autenticada, esa pantalla recibía 401 antes de pintar el primer campo. Es seguro porque lo que devuelve no es de nadie: `terminology.value_sets` y las tablas de su expansión no tienen `tenant_id` —son el catálogo global, fuera del alcance de las políticas RLS por tenant— y ninguna fila contiene datos de un paciente. Lo que sale de acá son códigos y nombres de catálogo.

### Descripción del sistema

NestJS resuelve `GET /terminology/value-sets` en `TerminologyValueSetsController_searchValueSets`. El controlador delega en `ValueSetsService.searchValueSets`. No recibe body. El tipo de retorno estático es `Promise<SearchValueSetsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `code` | query | No | `string` | Sin restricción adicional declarada | Código interno exacto del conjunto | `CODIGO_EJEMPLO` |
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en el código interno o el nombre | `valor-ejemplo` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Conjuntos por página (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /terminology/value-sets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit particular: `Throttle(PUBLIC_CATALOG_READ_THROTTLE)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /terminology/value-sets?code=CODIGO_EJEMPLO&q=valor-ejemplo&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SearchValueSetsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SearchValueSetsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SearchValueSetsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SearchValueSetsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SearchValueSetsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SearchValueSetsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SearchValueSetsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "internalCode": "administrative-gender",
      "name": "Nombre de ejemplo",
      "canonicalUrl": "valor-ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "defaultVersionId": "00000000-0000-4000-8000-000000000001",
      "memberCount": 1
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ValueSetListItemDto>` | Sin restricción adicional declarada | Conjuntos de esta página, ordenados por código interno. | `[{"id":"00000000-0000-4000-8000-000000000001","internalCode":"administrative-gender","name":"Nombre de ejemplo","canonicalUrl":"valor-ejemplo","description":"Texto descriptivo de ejemplo","stateConceptId":"00000000-0000-4000-8000-000000000001","defaultVersionId":"00000000-0000-4000-8000-000000000001","memberCount":1}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del conjunto de valores. | `00000000-0000-4000-8000-000000000001` |
| `items[].internalCode` | Sí | `string` | Sin restricción adicional declarada | Código interno estable. Es la clave por la que se busca sin conocer el uuid. | `administrative-gender` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible. | `Nombre de ejemplo` |
| `items[].canonicalUrl` | Sí | `string` | Sin restricción adicional declarada | URL canónica FHIR del conjunto. | `valor-ejemplo` |
| `items[].description` | No | `string` | Sin restricción adicional declarada | Descripción de qué agrupa. | `Texto descriptivo de ejemplo` |
| `items[].stateConceptId` | No | `string` | formato `uuid` | Estado del conjunto en el ciclo de vida de terminología. | `00000000-0000-4000-8000-000000000001` |
| `items[].defaultVersionId` | No | `string` | formato `uuid`; admite null | Versión marcada por defecto, o `null` si todavía no hay ninguna. | `00000000-0000-4000-8000-000000000001` |
| `items[].memberCount` | No | `number` | Sin restricción adicional declarada | Conceptos incluidos en la versión vigente del conjunto | `1` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a la consulta. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor opaco de continuación, o `null` si ésta es la última página. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_CATALOG_READ_THROTTLE). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/terminology/value-sets"
}
```

---

## 15. POST /terminology/value-sets

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-07: crea un conjunto de valores con versión y reglas
- **Operation ID:** `TerminologyValueSetsController_createValueSet`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyValueSetsController.createValueSet](../../src/modules/terminology/controllers/terminology-value-sets.controller.ts)

### Descripción de negocio

UC-03-07: crea un conjunto de valores con versión y reglas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create value set.

### Descripción del sistema

NestJS resuelve `POST /terminology/value-sets` en `TerminologyValueSetsController_createValueSet`. El controlador delega en `ValueSetsService.createValueSet`. Valida el body como `CreateValueSetDto` y consume `application/json`. El tipo de retorno estático es `Promise<ValueSetResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateValueSetDto`; los campos opcionales se omiten.

```http
POST /terminology/value-sets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "internalCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "canonicalUrl": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `internalCode` | Sí | `string` | longitud mínima 1; longitud máxima 255 | Código interno único del conjunto de valores | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 255 | Nombre legible del conjunto de valores | `Nombre de ejemplo` |
| `canonicalUrl` | Sí | `string` | longitud mínima 1 | URL canónica FHIR del conjunto de valores | `valor-ejemplo` |
| `rules` | No | `array<ValueSetRuleInputDto>` | Sin restricción adicional declarada | Reglas de composición | `[{"codeSystemId":"00000000-0000-4000-8000-000000000001","operator":"IN","property":"valor-ejemplo","value":"valor-ejemplo","included":true}]` |
| `rules[].codeSystemId` | No | `string` | formato `uuid` | Id del sistema de códigos referido por la regla | `00000000-0000-4000-8000-000000000001` |
| `rules[].operator` | No | `string` | valores: `IN`, `IS_A` | Operador de la regla | `IN` |
| `rules[].property` | No | `string` | longitud máxima 255 | Propiedad sobre la que aplica la regla | `valor-ejemplo` |
| `rules[].value` | No | `string` | longitud máxima 255 | Valor comparado por la regla | `valor-ejemplo` |
| `rules[].included` | No | `boolean` | Sin restricción adicional declarada | Si la regla incluye (true) o excluye (false); por defecto true | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /terminology/value-sets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "internalCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "canonicalUrl": "valor-ejemplo",
  "rules": [
    {
      "codeSystemId": "00000000-0000-4000-8000-000000000001",
      "operator": "IN",
      "property": "valor-ejemplo",
      "value": "valor-ejemplo",
      "included": true
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ValueSetResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ValueSetResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ValueSetResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ValueSetResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ValueSetResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ValueSetResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ValueSetResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ValueSetResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ValueSetResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ValueSetResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "rulesCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id del conjunto de valores creado | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | Sin restricción adicional declarada | Id de la versión inicial creada | `00000000-0000-4000-8000-000000000001` |
| `rulesCount` | Sí | `number` | Sin restricción adicional declarada | Número de reglas creadas | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un conjunto de valores con ese código interno | Excepción explícita en src/modules/terminology/services/value-sets.service.ts |
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
  "path": "/terminology/value-sets"
}
```

---

## 16. GET /terminology/value-sets/{id}/$expand

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-08: lee la expansión vigente de un conjunto de valores
- **Operation ID:** `TerminologyValueSetsController_readExpansion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyValueSetsController.readExpansion](../../src/modules/terminology/controllers/terminology-value-sets.controller.ts)

### Descripción de negocio

UC-03-08: lee la expansión vigente de un conjunto de valores. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-03-08: lee una página de la expansión vigente del conjunto de valores. Es la contraparte de lectura del `POST ValueSet/:id/$expand`, que **materializa** los miembros y por eso exige `SECURITY_ADMIN`. Ésta sólo los devuelve, así que no pide rol de administración: un campo de formulario necesita la lista de opciones válidas, y exigir rol de seguridad para leerla dejaría el catálogo inutilizable desde el cliente. Tampoco pide sesión, y va en el mismo lote que el listado de arriba a propósito: resolver el conjunto y leer sus miembros son los dos pasos de una misma lectura, y abrir sólo el primero deja el formulario público con el identificador del catálogo y sin sus opciones. Pagina por cursor y no por página numerada: la expansión se reemplaza entera cada vez que se re-expande, y con `offset` una re-expansión a mitad de recorrido saltaría o repetiría miembros sin que el cliente se entere.

### Descripción del sistema

NestJS resuelve `GET /terminology/value-sets/{id}/$expand` en `TerminologyValueSetsController_readExpansion`. El controlador delega en `ValueSetsService.readExpansion`. No recibe body. El tipo de retorno estático es `Promise<ReadValueSetExpansionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `valueSetVersionId` | query | No | `string` | Sin restricción adicional declarada | Versión concreta a leer; por defecto la vigente | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Miembros por página (por defecto 50) | `1` |
| `includeProperties` | query | No | `boolean` | Sin restricción adicional declarada | Trae también las propiedades de cada concepto. Opt-in: hay catálogos cuyo dato útil vive ahí (el nomenclador guarda especialidad, precio y unidad como propiedades). | `true` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /terminology/value-sets/00000000-0000-4000-8000-000000000001/$expand HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit particular: `Throttle(PUBLIC_CATALOG_READ_THROTTLE)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /terminology/value-sets/00000000-0000-4000-8000-000000000001/$expand?valueSetVersionId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1&includeProperties=true HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReadValueSetExpansionResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ReadValueSetExpansionResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ReadValueSetExpansionResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ReadValueSetExpansionResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ReadValueSetExpansionResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ReadValueSetExpansionResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ReadValueSetExpansionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReadValueSetExpansionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "valueSetId": "00000000-0000-4000-8000-000000000001",
  "valueSetVersionId": "00000000-0000-4000-8000-000000000001",
  "version": "1.0.0",
  "items": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "GENDER_FEMALE",
      "display": "valor-ejemplo",
      "definition": "valor-ejemplo",
      "selectable": true,
      "codeSystemVersionId": "00000000-0000-4000-8000-000000000001",
      "ordinal": 1,
      "properties": {
        "clave": "valor"
      }
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `valueSetId` | Sí | `string` | formato `uuid` | Id del conjunto de valores | `00000000-0000-4000-8000-000000000001` |
| `valueSetVersionId` | Sí | `string` | formato `uuid` | Id de la versión leída | `00000000-0000-4000-8000-000000000001` |
| `version` | Sí | `string` | Sin restricción adicional declarada | Etiqueta de la versión | `1.0.0` |
| `items` | Sí | `array<ValueSetExpansionItemDto>` | Sin restricción adicional declarada | Miembros de esta página. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"GENDER_FEMALE","display":"valor-ejemplo","definition":"valor-ejemplo","selectable":true,"codeSystemVersionId":"00000000-0000-4000-8000-000000000001","ordinal":1,"properties":{"clave":"valor"}}]` |
| `items[].conceptId` | Sí | `string` | formato `uuid` | Valor a enviar en los campos `*ConceptId` del contrato | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código del concepto | `GENDER_FEMALE` |
| `items[].display` | Sí | `string` | Sin restricción adicional declarada | Denominación principal | `valor-ejemplo` |
| `items[].definition` | No | `string` | Sin restricción adicional declarada | Definición del concepto | `valor-ejemplo` |
| `items[].selectable` | No | `boolean` | Sin restricción adicional declarada | Si el concepto puede seleccionarse | `true` |
| `items[].codeSystemVersionId` | Sí | `string` | formato `uuid` | Versión del sistema de códigos | `00000000-0000-4000-8000-000000000001` |
| `items[].ordinal` | No | `number` | Sin restricción adicional declarada | Posición del miembro dentro de la expansión | `1` |
| `items[].properties` | No | `object` | Sin restricción adicional declarada | Propiedades del concepto; sólo con includeProperties=true | `{"clave":"valor"}` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope de resultados aplicado | `1` |
| `nextCursor` | No | `string` | admite null | Cursor opaco para pedir la página siguiente | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Conjunto de valores no encontrado | Excepción explícita en src/modules/terminology/services/value-sets.service.ts |
| 404 | `NOT_FOUND` | options.valueSetVersionId           ? 'Versión del conjunto de valores no encontrada'           : 'El conjunto de valores no tiene una versión vigente' | Excepción explícita en src/modules/terminology/services/value-sets.service.ts |
| 409 | `CONFLICT` | La versión no pertenece a ese conjunto de valores | Excepción explícita en src/modules/terminology/services/value-sets.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_CATALOG_READ_THROTTLE). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/terminology/value-sets/{id}/$expand"
}
```

---

## 17. POST /terminology/ValueSet/{id}/$expand

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-08: materializa los miembros de la expansión
- **Operation ID:** `TerminologyFhirController_expandValueSet`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyFhirController.expandValueSet](../../src/modules/terminology/controllers/terminology-fhir.controller.ts)

### Descripción de negocio

UC-03-08: materializa los miembros de la expansión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación expand value set.

### Descripción del sistema

NestJS resuelve `POST /terminology/ValueSet/{id}/$expand` en `TerminologyFhirController_expandValueSet`. El controlador delega en `ValueSetsService.expandValueSet`. Valida el body como `ExpandValueSetDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExpandValueSetResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ExpandValueSetDto`; los campos opcionales se omiten.

```http
POST /terminology/ValueSet/00000000-0000-4000-8000-000000000001/$expand HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "valueSetVersionId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `valueSetVersionId` | Sí | `string` | formato `uuid` | Versión del conjunto de valores a expandir | `00000000-0000-4000-8000-000000000001` |
| `activate` | No | `boolean` | Sin restricción adicional declarada | Activa la versión al expandirla (draft -> active) | `true` |
| `makeDefault` | No | `boolean` | Sin restricción adicional declarada | Marca la versión como la vigente por defecto del conjunto | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /terminology/ValueSet/00000000-0000-4000-8000-000000000001/$expand HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "valueSetVersionId": "00000000-0000-4000-8000-000000000001",
  "activate": true,
  "makeDefault": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ExpandValueSetResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExpandValueSetResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExpandValueSetResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExpandValueSetResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExpandValueSetResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExpandValueSetResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExpandValueSetResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExpandValueSetResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExpandValueSetResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExpandValueSetResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExpandValueSetResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "valueSetId": "00000000-0000-4000-8000-000000000001",
  "valueSetVersionId": "00000000-0000-4000-8000-000000000001",
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "rulesEvaluated": 1,
  "includedMembers": 1,
  "replacedMembers": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `valueSetId` | Sí | `string` | Sin restricción adicional declarada | Id del conjunto de valores | `00000000-0000-4000-8000-000000000001` |
| `valueSetVersionId` | Sí | `string` | Sin restricción adicional declarada | Id de la versión expandida | `00000000-0000-4000-8000-000000000001` |
| `stateConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado en el que queda la versión | `00000000-0000-4000-8000-000000000001` |
| `rulesEvaluated` | Sí | `number` | Sin restricción adicional declarada | Reglas evaluadas | `1` |
| `includedMembers` | Sí | `number` | Sin restricción adicional declarada | Conceptos incluidos en la expansión | `1` |
| `replacedMembers` | Sí | `number` | Sin restricción adicional declarada | Miembros de la expansión anterior que se reemplazaron | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Conjunto de valores no encontrado | Excepción explícita en src/modules/terminology/services/value-sets.service.ts |
| 404 | `NOT_FOUND` | Versión del conjunto de valores no encontrada | Excepción explícita en src/modules/terminology/services/value-sets.service.ts |
| 409 | `CONFLICT` | La versión no pertenece a ese conjunto de valores | Excepción explícita en src/modules/terminology/services/value-sets.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo se expanden versiones en borrador o activas | Excepción explícita en src/modules/terminology/services/value-sets.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/terminology/ValueSet/{id}/$expand"
}
```

---

## 18. POST /terminology/versions/{versionId}/import

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-03: importa conceptos en una versión en borrador
- **Operation ID:** `TerminologyVersionsController_importConcepts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyVersionsController.importConcepts](../../src/modules/terminology/controllers/terminology-versions.controller.ts)

### Descripción de negocio

UC-03-03: importa conceptos en una versión en borrador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación import concepts.

### Descripción del sistema

NestJS resuelve `POST /terminology/versions/{versionId}/import` en `TerminologyVersionsController_importConcepts`. El controlador delega en `CodeSystemVersionsService.importConcepts`. Valida el body como `ImportConceptsDto` y consume `application/json`. El tipo de retorno estático es `Promise<ImportConceptsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ImportConceptsDto`; los campos opcionales se omiten.

```http
POST /terminology/versions/00000000-0000-4000-8000-000000000001/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "concepts": [
    {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `versionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `concepts` | Sí | `array<ImportConceptItemDto>` | Sin restricción adicional declarada | Conceptos a importar | `[{"code":"CODIGO_EJEMPLO","display":"valor-ejemplo","definition":"valor-ejemplo"}]` |
| `concepts[].code` | Sí | `string` | longitud mínima 1; longitud máxima 255 | Código del concepto dentro de la versión | `CODIGO_EJEMPLO` |
| `concepts[].display` | Sí | `string` | longitud mínima 1; longitud máxima 255 | Texto de presentación del concepto | `valor-ejemplo` |
| `concepts[].definition` | No | `string` | Sin restricción adicional declarada | Definición larga del concepto | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /terminology/versions/00000000-0000-4000-8000-000000000001/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "concepts": [
    {
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "definition": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ImportConceptsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ImportConceptsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ImportConceptsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ImportConceptsResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ImportConceptsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ImportConceptsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ImportConceptsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ImportConceptsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ImportConceptsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ImportConceptsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ImportConceptsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "inserted": 1,
  "skipped": 1,
  "total": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `inserted` | Sí | `number` | Sin restricción adicional declarada | Conceptos insertados | `1` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Conceptos omitidos por existir ya en la versión | `1` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Conceptos recibidos en la petición | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión no encontrada | Excepción explícita en src/modules/terminology/services/code-system-versions.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No se puede importar en una versión que no está en borrador | Excepción explícita en src/modules/terminology/services/code-system-versions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/terminology/versions/{versionId}/import"
}
```

---

## 19. POST /terminology/versions/{versionId}/import-file

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-03: importa conceptos desde un archivo NDJSON
- **Operation ID:** `TerminologyVersionsController_importConceptsFile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyVersionsController.importConceptsFile](../../src/modules/terminology/controllers/terminology-versions.controller.ts)

### Descripción de negocio

UC-03-03: importa conceptos desde un archivo NDJSON. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Importa conceptos desde un archivo NDJSON ya subido (UC-03-03, por archivo). Es la cara sin techo del import de arriba: aquél recibe los conceptos en el cuerpo, y el cuerpo está limitado a 1 MB —unos diez mil conceptos—. Un sistema de codificación real tiene cien mil. El archivo llega **acá** y no por `common/files`: aquella superficie valida el tipo por bytes mágicos y sólo admite PDF e imágenes, porque existe para evidencia clínica. Un archivo de texto no tiene firma binaria. Acá el tipo se comprueba por parseo, que para NDJSON es una prueba más fuerte. El contenido no se almacena: se convierte en filas y se descarta. Lo que queda es el lote en `terminology.catalog_import_batches`, con la huella del contenido y los contadores.

### Descripción del sistema

NestJS resuelve `POST /terminology/versions/{versionId}/import-file` en `TerminologyVersionsController_importConceptsFile`. El controlador delega en `ConceptFileImportService.importFromFile`. Valida el body como `object` y consume `multipart/form-data`. El tipo de retorno estático es `Promise<ImportConceptsFileResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `object`; los campos opcionales se omiten.

```http
POST /terminology/versions/00000000-0000-4000-8000-000000000001/import-file HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: multipart/form-data

{
  "file": "<contenido-binario>"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `versionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `file` | Sí | `string` | formato `binary` | Sin descripción específica en el contrato OpenAPI. | `<contenido-binario>` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /terminology/versions/00000000-0000-4000-8000-000000000001/import-file HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: multipart/form-data

{
  "file": "<contenido-binario>"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ImportConceptsFileResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ImportConceptsFileResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ImportConceptsFileResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ImportConceptsFileResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ImportConceptsFileResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ImportConceptsFileResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ImportConceptsFileResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ImportConceptsFileResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ImportConceptsFileResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ImportConceptsFileResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ImportConceptsFileResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "batchId": "00000000-0000-4000-8000-000000000001",
  "totalRead": 1,
  "inserted": 1,
  "skipped": 1,
  "errors": 1,
  "errorSamples": [
    {
      "line": 1,
      "message": "valor-ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `batchId` | Sí | `string` | formato `uuid` | Lote de importación registrado | `00000000-0000-4000-8000-000000000001` |
| `totalRead` | Sí | `number` | Sin restricción adicional declarada | Líneas con contenido leídas | `1` |
| `inserted` | Sí | `number` | Sin restricción adicional declarada | Conceptos creados | `1` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Códigos que ya existían en la versión | `1` |
| `errors` | Sí | `number` | Sin restricción adicional declarada | Líneas descartadas | `1` |
| `errorSamples` | Sí | `array<ImportFileIssueDto>` | Sin restricción adicional declarada | Primeros errores encontrados, como muestra | `[{"line":1,"message":"valor-ejemplo"}]` |
| `errorSamples[].line` | Sí | `number` | Sin restricción adicional declarada | Línea del archivo, empezando en 1 | `1` |
| `errorSamples[].message` | Sí | `string` | Sin restricción adicional declarada | Motivo por el que la línea se descartó | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión no encontrada | Excepción explícita en src/modules/terminology/services/concept-file-import.service.ts |
| 404 | `NOT_FOUND` | El sistema de codificación de la versión no existe | Excepción explícita en src/modules/terminology/services/concept-file-import.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El archivo llegó vacío | Excepción explícita en src/modules/terminology/services/concept-file-import.service.ts |
| 422 | `PRECONDITION_FAILED` | errores.length > 0           ? 'Ninguna línea del archivo es un concepto válido: se esperaba ' +               'NDJSON con «code» y «display» por línea.'           : 'El archivo no tiene ninguna línea con contenido.' | Excepción explícita en src/modules/terminology/services/concept-file-import.service.ts |
| 422 | `PRECONDITION_FAILED` | Solo se puede importar en una versión en borrador | Excepción explícita en src/modules/terminology/services/concept-file-import.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/terminology/versions/{versionId}/import-file"
}
```

---

## 20. POST /terminology/versions/{versionId}/publish

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-04: publica una versión (borrador → activa)
- **Operation ID:** `TerminologyVersionsController_publishVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyVersionsController.publishVersion](../../src/modules/terminology/controllers/terminology-versions.controller.ts)

### Descripción de negocio

UC-03-04: publica una versión (borrador → activa). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ejecuta la operación publish version.

### Descripción del sistema

NestJS resuelve `POST /terminology/versions/{versionId}/publish` en `TerminologyVersionsController_publishVersion`. El controlador delega en `CodeSystemVersionsService.publishVersion`. No recibe body. El tipo de retorno estático es `Promise<PublishVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `versionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /terminology/versions/00000000-0000-4000-8000-000000000001/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `versionId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /terminology/versions/00000000-0000-4000-8000-000000000001/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublishVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PublishVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PublishVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PublishVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PublishVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PublishVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PublishVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PublishVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PublishVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublishVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "state": "valor-ejemplo",
  "publishedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id de la versión publicada | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Estado del ciclo de vida tras la publicación (código de concepto) | `valor-ejemplo` |
| `publishedAt` | Sí | `string` | formato `date-time` | Instante de publicación | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión no encontrada | Excepción explícita en src/modules/terminology/services/code-system-versions.service.ts |
| 409 | `CONFLICT` | La versión ya está publicada | Excepción explícita en src/modules/terminology/services/code-system-versions.service.ts |
| 422 | `PRECONDITION_FAILED` | Solo se puede publicar una versión en borrador | Excepción explícita en src/modules/terminology/services/code-system-versions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/terminology/versions/{versionId}/publish"
}
```

---

