<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `terminology`

Referencia exhaustiva de 15 operación(es) del módulo `terminology`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `terminology`
- **Controladores:** `TerminologyCodeSystemsController`, `TerminologyConceptsController`, `TerminologyFhirController`, `TerminologyTenantCatalogController`, `TerminologyValueSetsController`, `TerminologyVersionsController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /terminology/code-systems](#1-post-terminology-code-systems) — UC-03-01: crea un sistema de códigos y su fuente
2. [POST /terminology/code-systems/{id}/versions](#2-post-terminology-code-systems-id-versions) — UC-03-02: crea una versión (borrador) de un sistema de códigos
3. [GET /terminology/CodeSystem/$lookup](#3-get-terminology-codesystem-lookup) — UC-03-11: resuelve un concepto por sistema y código
4. [POST /terminology/ConceptMap/$translate](#4-post-terminology-conceptmap-translate) — UC-03-09: cura o consulta un mapeo entre conceptos
5. [GET /terminology/concepts](#5-get-terminology-concepts) — UC-03-13: busca conceptos del catálogo por código o denominación
6. [POST /terminology/concepts/{conceptId}/$deprecate](#6-post-terminology-concepts-conceptid-deprecate) — UC-03-10: retira el concepto y lo excluye de las expansiones
7. [POST /terminology/concepts/{conceptId}/designations](#7-post-terminology-concepts-conceptid-designations) — UC-03-05: añade una designación (y opcionalmente propiedades)
8. [POST /terminology/concepts/{conceptId}/properties](#8-post-terminology-concepts-conceptid-properties) — UC-03-05: alta o actualización de propiedades del concepto
9. [POST /terminology/concepts/{conceptId}/relationships](#9-post-terminology-concepts-conceptid-relationships) — UC-03-06: crea una relación dirigida entre conceptos
10. [PUT /terminology/tenants/{tenantId}/catalog-policies](#10-put-terminology-tenants-tenantid-catalog-policies) — UC-03-12: define la política de catálogo del tenant
11. [POST /terminology/value-sets](#11-post-terminology-value-sets) — UC-03-07: crea un conjunto de valores con versión y reglas
12. [GET /terminology/value-sets/{id}/$expand](#12-get-terminology-value-sets-id-expand) — UC-03-08: lee la expansión vigente de un conjunto de valores
13. [POST /terminology/ValueSet/{id}/$expand](#13-post-terminology-valueset-id-expand) — UC-03-08: materializa los miembros de la expansión
14. [POST /terminology/versions/{versionId}/import](#14-post-terminology-versions-versionid-import) — UC-03-03: importa conceptos en una versión en borrador
15. [POST /terminology/versions/{versionId}/publish](#15-post-terminology-versions-versionid-publish) — UC-03-04: publica una versión (borrador → activa)

---

## 1. POST /terminology/code-systems

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

## 2. POST /terminology/code-systems/{id}/versions

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

## 3. GET /terminology/CodeSystem/$lookup

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

## 4. POST /terminology/ConceptMap/$translate

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

## 5. GET /terminology/concepts

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-13: busca conceptos del catálogo por código o denominación
- **Operation ID:** `TerminologyConceptsController_searchConcepts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyConceptsController.searchConcepts](../../src/modules/terminology/controllers/terminology-concepts.controller.ts)

### Descripción de negocio

UC-03-13: busca conceptos del catálogo por código o denominación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-03-13: busca conceptos por texto para poder rellenar cualquier campo `*ConceptId` del contrato. Es de sólo lectura y no exige rol de administración: el catálogo es metadato compartido, sin datos de paciente, y cualquier cliente autenticado necesita resolver estos ids para poder crear recursos.

### Descripción del sistema

NestJS resuelve `GET /terminology/concepts` en `TerminologyConceptsController_searchConcepts`. El controlador delega en `ConceptsService.searchConcepts`. No recibe body. El tipo de retorno estático es `Promise<SearchConceptsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en el código o la denominación | `valor-ejemplo` |
| `codeSystemVersionId` | query | No | `string` | Sin restricción adicional declarada | Acota la búsqueda a una versión de sistema de códigos | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope de resultados (por defecto 50) | `1` |

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
GET /terminology/concepts?q=valor-ejemplo&codeSystemVersionId=00000000-0000-4000-8000-000000000001&limit=1 HTTP/1.1
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
      "codeSystemVersionId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "count": 1,
  "limit": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ConceptSearchItemDto>` | Sin restricción adicional declarada | Conceptos que casan con el filtro. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"GENDER_FEMALE","display":"valor-ejemplo","definition":"valor-ejemplo","selectable":true,"codeSystemVersionId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].conceptId` | Sí | `string` | formato `uuid` | Valor a enviar en los campos `*ConceptId` del contrato | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código del concepto | `GENDER_FEMALE` |
| `items[].display` | Sí | `string` | Sin restricción adicional declarada | Denominación principal | `valor-ejemplo` |
| `items[].definition` | No | `string` | Sin restricción adicional declarada | Definición del concepto | `valor-ejemplo` |
| `items[].selectable` | No | `boolean` | Sin restricción adicional declarada | Si el concepto puede seleccionarse | `true` |
| `items[].codeSystemVersionId` | Sí | `string` | formato `uuid` | Versión del sistema de códigos | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope de resultados aplicado | `1` |

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
  "path": "/terminology/concepts"
}
```

---

## 6. POST /terminology/concepts/{conceptId}/$deprecate

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

## 7. POST /terminology/concepts/{conceptId}/designations

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

## 8. POST /terminology/concepts/{conceptId}/properties

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

## 9. POST /terminology/concepts/{conceptId}/relationships

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

## 10. PUT /terminology/tenants/{tenantId}/catalog-policies

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

## 11. POST /terminology/value-sets

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

## 12. GET /terminology/value-sets/{id}/$expand

- **Módulo:** `terminology`
- **Etiqueta OpenAPI:** `terminology`
- **Nombre:** UC-03-08: lee la expansión vigente de un conjunto de valores
- **Operation ID:** `TerminologyValueSetsController_readExpansion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [TerminologyValueSetsController.readExpansion](../../src/modules/terminology/controllers/terminology-value-sets.controller.ts)

### Descripción de negocio

UC-03-08: lee la expansión vigente de un conjunto de valores. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-03-08: lee una página de la expansión vigente del conjunto de valores. Es la contraparte de lectura del `POST ValueSet/:id/$expand`, que **materializa** los miembros y por eso exige `SECURITY_ADMIN`. Ésta sólo los devuelve, así que no pide rol de administración: un campo de formulario necesita la lista de opciones válidas, y exigir rol de seguridad para leerla dejaría el catálogo inutilizable desde el cliente. Pagina por cursor y no por página numerada: la expansión se reemplaza entera cada vez que se re-expande, y con `offset` una re-expansión a mitad de recorrido saltaría o repetiría miembros sin que el cliente se entere.

### Descripción del sistema

NestJS resuelve `GET /terminology/value-sets/{id}/$expand` en `TerminologyValueSetsController_readExpansion`. El controlador delega en `ValueSetsService.readExpansion`. No recibe body. El tipo de retorno estático es `Promise<ReadValueSetExpansionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `valueSetVersionId` | query | No | `string` | Sin restricción adicional declarada | Versión concreta a leer; por defecto la vigente | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Miembros por página (por defecto 50) | `1` |

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
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /terminology/value-sets/00000000-0000-4000-8000-000000000001/$expand?valueSetVersionId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
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
      "ordinal": 1
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
| `items` | Sí | `array<ValueSetExpansionItemDto>` | Sin restricción adicional declarada | Miembros de esta página. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"GENDER_FEMALE","display":"valor-ejemplo","definition":"valor-ejemplo","selectable":true,"codeSystemVersionId":"00000000-0000-4000-8000-000000000001","ordinal":1}]` |
| `items[].conceptId` | Sí | `string` | formato `uuid` | Valor a enviar en los campos `*ConceptId` del contrato | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código del concepto | `GENDER_FEMALE` |
| `items[].display` | Sí | `string` | Sin restricción adicional declarada | Denominación principal | `valor-ejemplo` |
| `items[].definition` | No | `string` | Sin restricción adicional declarada | Definición del concepto | `valor-ejemplo` |
| `items[].selectable` | No | `boolean` | Sin restricción adicional declarada | Si el concepto puede seleccionarse | `true` |
| `items[].codeSystemVersionId` | Sí | `string` | formato `uuid` | Versión del sistema de códigos | `00000000-0000-4000-8000-000000000001` |
| `items[].ordinal` | No | `number` | Sin restricción adicional declarada | Posición del miembro dentro de la expansión | `1` |
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
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
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

## 13. POST /terminology/ValueSet/{id}/$expand

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

## 14. POST /terminology/versions/{versionId}/import

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

## 15. POST /terminology/versions/{versionId}/publish

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

