<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `forms`

Referencia exhaustiva de 13 operación(es) del módulo `forms`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `forms-assignments`, `forms-definition-sets`, `forms-fields`, `forms-instances`, `forms-values`
- **Controladores:** `FormsAssignmentsController`, `FormsDefinitionSetsController`, `FormsFieldsController`, `FormsInstancesController`, `FormsValuesController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /forms/assignments](#1-post-forms-assignments) — Asignar campos a un target con política de extensión
2. [POST /forms/definition-sets](#2-post-forms-definition-sets) — Definir un set de campos dinámicos y su versión inicial
3. [POST /forms/definition-sets/{id}/migrations/{migrationId}/run](#3-post-forms-definition-sets-id-migrations-migrationid-run) — Migrar valores entre versiones de schema
4. [POST /forms/definition-sets/{id}/versions/{ver}/publish](#4-post-forms-definition-sets-id-versions-ver-publish) — Componer miembros del set y publicar la versión
5. [POST /forms/field-definitions](#5-post-forms-field-definitions) — Declarar una definición de campo con reglas de validación
6. [POST /forms/fields/{id}/access-rules](#6-post-forms-fields-id-access-rules) — Definir reglas de acceso y enmascarado por campo
7. [POST /forms/fields/{id}/dependencies](#7-post-forms-fields-id-dependencies) — Definir dependencias condicionales entre campos
8. [PUT /forms/fields/{id}/localizations/{lang}](#8-put-forms-fields-id-localizations-lang) — Localizar (i18n) una definición de campo
9. [POST /forms/instances](#9-post-forms-instances) — Abrir una instancia de formulario para un recurso
10. [POST /forms/instances/{id}/close](#10-post-forms-instances-id-close) — Cerrar formulario y proyectar vista de recurso
11. [POST /forms/instances/{id}/values](#11-post-forms-instances-id-values) — Capturar valores de formulario (value[x] exclusivo)
12. [PATCH /forms/values/{id}](#12-patch-forms-values-id) — Corregir valor con supersede y snapshot inmutable
13. [POST /forms/values/import](#13-post-forms-values-import) — Registrar procedencia de valores importados (batch ETL)

---

## 1. POST /forms/assignments

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-assignments`
- **Nombre:** Asignar campos a un target con política de extensión
- **Operation ID:** `FormsAssignmentsController_createAssignment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsAssignmentsController.createAssignment](../../src/modules/forms/controllers/forms-assignments.controller.ts)

### Descripción de negocio

Asignar campos a un target con política de extensión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/assignments` en `FormsAssignmentsController_createAssignment`. El controlador delega en `FormsAssignmentsService.createAssignment`. Valida el body como `CreateAssignmentDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAssignmentDto`; los campos opcionales se omiten.

```http
POST /forms/assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "surveyVersionId": "00000000-0000-4000-8000-000000000001",
  "targetType": "APPOINTMENT",
  "targetId": "00000000-0000-4000-8000-000000000001"
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
| `surveyVersionId` | Sí | `string` | formato `uuid` | Versión publicada que se reparte | `00000000-0000-4000-8000-000000000001` |
| `targetType` | Sí | `string` | valores: `APPOINTMENT`, `SERVICE`, `CARE_TYPE` | Qué se evalúa: la reserva, el servicio o el tipo de atención | `APPOINTMENT` |
| `targetId` | Sí | `string` | formato `uuid` | Identificador de la cosa evaluada, según `targetType` | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/assignments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "surveyVersionId": "00000000-0000-4000-8000-000000000001",
  "targetType": "APPOINTMENT",
  "targetId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Campo no encontrado | Excepción explícita en src/modules/forms/services/forms-assignments.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Se excedió el presupuesto de campos del target | Excepción explícita en src/modules/forms/services/forms-assignments.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/assignments"
}
```

---

## 2. POST /forms/definition-sets

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-definition-sets`
- **Nombre:** Definir un set de campos dinámicos y su versión inicial
- **Operation ID:** `FormsDefinitionSetsController_createDefinitionSet`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsDefinitionSetsController.createDefinitionSet](../../src/modules/forms/controllers/forms-definition-sets.controller.ts)

### Descripción de negocio

Definir un set de campos dinámicos y su versión inicial. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/definition-sets` en `FormsDefinitionSetsController_createDefinitionSet`. El controlador delega en `FormsSchemaService.createDefinitionSet`. Valida el body como `CreateDefinitionSetDto` y consume `application/json`. El tipo de retorno estático es `Promise<DefinitionSetResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDefinitionSetDto`; los campos opcionales se omiten.

```http
POST /forms/definition-sets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "namespaceUri": "Nombre de ejemplo",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
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
| `namespaceUri` | Sí | `string` | longitud mínima 1; longitud máxima 500 | URI de namespace único del set | `Nombre de ejemplo` |
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código estable del set | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre legible | `Nombre de ejemplo` |
| `ownerTenantId` | No | `string` | formato `uuid` | Tenant propietario | `00000000-0000-4000-8000-000000000001` |
| `targetDomainConceptId` | No | `string` | formato `uuid` | Dominio destino (concept id) | `00000000-0000-4000-8000-000000000001` |
| `semanticVersion` | No | `string` | longitud máxima 50 | Versión semántica inicial | `1.0.0` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/definition-sets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "namespaceUri": "Nombre de ejemplo",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "ownerTenantId": "00000000-0000-4000-8000-000000000001",
  "targetDomainConceptId": "00000000-0000-4000-8000-000000000001",
  "semanticVersion": "1.0.0"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DefinitionSetResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DefinitionSetResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Versión inicial (draft) creada | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado del set (concept id) | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El namespace ya está en uso | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
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
  "path": "/forms/definition-sets"
}
```

---

## 3. POST /forms/definition-sets/{id}/migrations/{migrationId}/run

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-definition-sets`
- **Nombre:** Migrar valores entre versiones de schema
- **Operation ID:** `FormsDefinitionSetsController_runMigration`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsDefinitionSetsController.runMigration](../../src/modules/forms/controllers/forms-definition-sets.controller.ts)

### Descripción de negocio

Migrar valores entre versiones de schema. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/definition-sets/{id}/migrations/{migrationId}/run` en `FormsDefinitionSetsController_runMigration`. El controlador delega en `FormsSchemaService.runMigration`. Valida el body como `RunMigrationDto` y consume `application/json`. El tipo de retorno estático es `Promise<MigrationRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `migrationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunMigrationDto`; los campos opcionales se omiten.

```http
POST /forms/definition-sets/00000000-0000-4000-8000-000000000001/migrations/00000000-0000-4000-8000-000000000001/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fromVersionId": "00000000-0000-4000-8000-000000000001",
  "toVersionId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`, `migrationId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `fromVersionId` | Sí | `string` | formato `uuid` | Versión origen (publicada) | `00000000-0000-4000-8000-000000000001` |
| `toVersionId` | Sí | `string` | formato `uuid` | Versión destino (publicada) | `00000000-0000-4000-8000-000000000001` |
| `migrationTypeConceptId` | No | `string` | formato `uuid` | Tipo de migración (concept id) | `00000000-0000-4000-8000-000000000001` |
| `transformationExpression` | No | `string` | longitud máxima 4000 | Expresión de transformación | `valor-ejemplo` |
| `validationExpression` | No | `string` | longitud máxima 4000 | Expresión de validación | `valor-ejemplo` |
| `rollbackExpression` | No | `string` | longitud máxima 4000 | Expresión de rollback | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/definition-sets/00000000-0000-4000-8000-000000000001/migrations/00000000-0000-4000-8000-000000000001/run HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "fromVersionId": "00000000-0000-4000-8000-000000000001",
  "toVersionId": "00000000-0000-4000-8000-000000000001",
  "migrationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "transformationExpression": "valor-ejemplo",
  "validationExpression": "valor-ejemplo",
  "rollbackExpression": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MigrationRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MigrationRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "migratedValues": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado final (concept id) | `00000000-0000-4000-8000-000000000001` |
| `migratedValues` | Sí | `number` | Sin restricción adicional declarada | Nº de valores migrados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Set de definiciones no encontrado | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
| 404 | `NOT_FOUND` | Versión origen no válida | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
| 404 | `NOT_FOUND` | Versión destino no válida | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
| 409 | `CONFLICT` | La migración ya fue registrada | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
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
  "path": "/forms/definition-sets/{id}/migrations/{migrationId}/run"
}
```

---

## 4. POST /forms/definition-sets/{id}/versions/{ver}/publish

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-definition-sets`
- **Nombre:** Componer miembros del set y publicar la versión
- **Operation ID:** `FormsDefinitionSetsController_publishVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsDefinitionSetsController.publishVersion](../../src/modules/forms/controllers/forms-definition-sets.controller.ts)

### Descripción de negocio

Componer miembros del set y publicar la versión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/definition-sets/{id}/versions/{ver}/publish` en `FormsDefinitionSetsController_publishVersion`. El controlador delega en `FormsSchemaService.publishVersion`. Valida el body como `FormsPublishVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<OkResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `ver` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `FormsPublishVersionDto`; los campos opcionales se omiten.

```http
POST /forms/definition-sets/00000000-0000-4000-8000-000000000001/versions/valor-ejemplo/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "members": [
    {
      "fieldId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`, `ver`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `members` | Sí | `array<SetMemberInputDto>` | Sin restricción adicional declarada | Miembros a componer | `[{"fieldId":"00000000-0000-4000-8000-000000000001","sectionId":"00000000-0000-4000-8000-000000000001","required":true,"ordinal":1}]` |
| `members[].fieldId` | Sí | `string` | formato `uuid` | Definición de campo miembro | `00000000-0000-4000-8000-000000000001` |
| `members[].sectionId` | No | `string` | formato `uuid` | Sección a la que pertenece | `00000000-0000-4000-8000-000000000001` |
| `members[].required` | No | `boolean` | Sin restricción adicional declarada | ¿Campo requerido en el set? | `true` |
| `members[].ordinal` | No | `number` | mínimo 0 | Orden dentro del set | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/definition-sets/00000000-0000-4000-8000-000000000001/versions/valor-ejemplo/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "members": [
    {
      "fieldId": "00000000-0000-4000-8000-000000000001",
      "sectionId": "00000000-0000-4000-8000-000000000001",
      "required": true,
      "ordinal": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OkResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OkResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Set de definiciones no encontrado | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
| 404 | `NOT_FOUND` | Versión no encontrada para el set | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La versión no está en borrador | Excepción explícita en src/modules/forms/services/forms-schema.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/definition-sets/{id}/versions/{ver}/publish"
}
```

---

## 5. POST /forms/field-definitions

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-fields`
- **Nombre:** Declarar una definición de campo con reglas de validación
- **Operation ID:** `FormsFieldsController_createFieldDefinition`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsFieldsController.createFieldDefinition](../../src/modules/forms/controllers/forms-fields.controller.ts)

### Descripción de negocio

Declarar una definición de campo con reglas de validación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/field-definitions` en `FormsFieldsController_createFieldDefinition`. El controlador delega en `FormsFieldsService.createFieldDefinition`. Valida el body como `CreateFieldDefinitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFieldDefinitionDto`; los campos opcionales se omiten.

```http
POST /forms/field-definitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "dataType": "string"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único del campo | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre legible | `Nombre de ejemplo` |
| `dataType` | Sí | `string` | valores: `string`, `text`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `time`, `uuid`, `json`, `binary`, `reference`, `code` | Tipo de dato técnico | `string` |
| `sensitivityConceptId` | No | `string` | formato `uuid` | Sensibilidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `semanticConceptId` | No | `string` | formato `uuid` | Concepto semántico (concept id) | `00000000-0000-4000-8000-000000000001` |
| `valueSetId` | No | `string` | formato `uuid` | Value set de valores permitidos | `00000000-0000-4000-8000-000000000001` |
| `unitValueSetId` | No | `string` | formato `uuid` | Value set de unidades | `00000000-0000-4000-8000-000000000001` |
| `cardinalityMin` | No | `number` | Sin restricción adicional declarada | Cardinalidad mínima | `1` |
| `cardinalityMax` | No | `number` | Sin restricción adicional declarada | Cardinalidad máxima | `1` |
| `regex` | No | `string` | longitud máxima 1000 | Expresión regular de validación | `valor-ejemplo` |
| `validationRules` | No | `array<ValidationRuleInputDto>` | Sin restricción adicional declarada | Reglas de validación | `[{"ruleType":"REQUIRED","operator":"EQ","parameters":{},"severity":"ERROR","errorMessage":"valor-ejemplo"}]` |
| `validationRules[].ruleType` | No | `string` | valores: `REQUIRED`, `RANGE`, `REGEX` | Sin descripción específica en el contrato OpenAPI. | `REQUIRED` |
| `validationRules[].operator` | No | `string` | valores: `EQ`, `NEQ`, `GT`, `LT` | Sin descripción específica en el contrato OpenAPI. | `EQ` |
| `validationRules[].parameters` | No | `object` | Sin restricción adicional declarada | Parámetros de la regla | `{}` |
| `validationRules[].severity` | No | `string` | valores: `ERROR`, `WARNING` | Sin descripción específica en el contrato OpenAPI. | `ERROR` |
| `validationRules[].errorMessage` | No | `string` | longitud máxima 500 | Mensaje de error asociado | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/field-definitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "dataType": "string",
  "sensitivityConceptId": "00000000-0000-4000-8000-000000000001",
  "semanticConceptId": "00000000-0000-4000-8000-000000000001",
  "valueSetId": "00000000-0000-4000-8000-000000000001",
  "unitValueSetId": "00000000-0000-4000-8000-000000000001",
  "cardinalityMin": 1,
  "cardinalityMax": 1,
  "regex": "valor-ejemplo",
  "validationRules": [
    {
      "ruleType": "REQUIRED",
      "operator": "EQ",
      "parameters": {},
      "severity": "ERROR",
      "errorMessage": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El código de campo ya existe | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
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
  "path": "/forms/field-definitions"
}
```

---

## 6. POST /forms/fields/{id}/access-rules

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-fields`
- **Nombre:** Definir reglas de acceso y enmascarado por campo
- **Operation ID:** `FormsFieldsController_createAccessRule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsFieldsController.createAccessRule](../../src/modules/forms/controllers/forms-fields.controller.ts)

### Descripción de negocio

Definir reglas de acceso y enmascarado por campo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/fields/{id}/access-rules` en `FormsFieldsController_createAccessRule`. El controlador delega en `FormsFieldsService.createAccessRule`. Valida el body como `CreateAccessRuleDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAccessRuleDto`; los campos opcionales se omiten.

```http
POST /forms/fields/00000000-0000-4000-8000-000000000001/access-rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeOfUseValueSetId": "00000000-0000-4000-8000-000000000001"
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
| `purposeOfUseValueSetId` | Sí | `string` | formato `uuid` | Value set de propósitos de uso permitidos | `00000000-0000-4000-8000-000000000001` |
| `assignmentId` | No | `string` | formato `uuid` | Asignación concreta afectada | `00000000-0000-4000-8000-000000000001` |
| `readRoleValueSetId` | No | `string` | formato `uuid` | Value set de roles de lectura | `00000000-0000-4000-8000-000000000001` |
| `writeRoleValueSetId` | No | `string` | formato `uuid` | Value set de roles de escritura | `00000000-0000-4000-8000-000000000001` |
| `consentCategoryConceptId` | No | `string` | formato `uuid` | Categoría de consentimiento (concept id) | `00000000-0000-4000-8000-000000000001` |
| `maskStrategy` | No | `string` | valores: `NONE`, `REDACT`, `HASH` | Estrategia de enmascarado | `NONE` |
| `breakGlassAllowed` | No | `boolean` | Sin restricción adicional declarada | ¿Permite acceso break-glass? | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/fields/00000000-0000-4000-8000-000000000001/access-rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "purposeOfUseValueSetId": "00000000-0000-4000-8000-000000000001",
  "assignmentId": "00000000-0000-4000-8000-000000000001",
  "readRoleValueSetId": "00000000-0000-4000-8000-000000000001",
  "writeRoleValueSetId": "00000000-0000-4000-8000-000000000001",
  "consentCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "maskStrategy": "NONE",
  "breakGlassAllowed": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Campo no encontrado | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
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
  "path": "/forms/fields/{id}/access-rules"
}
```

---

## 7. POST /forms/fields/{id}/dependencies

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-fields`
- **Nombre:** Definir dependencias condicionales entre campos
- **Operation ID:** `FormsFieldsController_addDependency`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsFieldsController.addDependency](../../src/modules/forms/controllers/forms-fields.controller.ts)

### Descripción de negocio

Definir dependencias condicionales entre campos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/fields/{id}/dependencies` en `FormsFieldsController_addDependency`. El controlador delega en `FormsFieldsService.addDependency`. Valida el body como `CreateFieldDependencyDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFieldDependencyDto`; los campos opcionales se omiten.

```http
POST /forms/fields/00000000-0000-4000-8000-000000000001/dependencies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceFieldId": "00000000-0000-4000-8000-000000000001",
  "operator": "EQ",
  "behavior": "SHOW"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sourceFieldId` | Sí | `string` | formato `uuid` | Campo fuente que dispara la condición | `00000000-0000-4000-8000-000000000001` |
| `operator` | Sí | `string` | valores: `EQ`, `NEQ`, `GT`, `LT` | Operador de comparación | `EQ` |
| `behavior` | Sí | `string` | valores: `SHOW`, `HIDE`, `REQUIRE` | Comportamiento aplicado | `SHOW` |
| `comparisonValue` | No | `object` | Sin restricción adicional declarada | Valor de comparación (json) | `{}` |
| `logicalGroup` | No | `string` | longitud máxima 100 | Grupo lógico de la condición | `valor-ejemplo` |
| `ordinal` | No | `number` | mínimo 0 | Orden de evaluación | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/fields/00000000-0000-4000-8000-000000000001/dependencies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceFieldId": "00000000-0000-4000-8000-000000000001",
  "operator": "EQ",
  "behavior": "SHOW",
  "comparisonValue": {},
  "logicalGroup": "valor-ejemplo",
  "ordinal": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Campo destino no encontrado | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
| 404 | `NOT_FOUND` | Campo fuente no encontrado | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
| 409 | `CONFLICT` | La dependencia ya existe en ese grupo lógico | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un campo no puede depender de sí mismo | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/fields/{id}/dependencies"
}
```

---

## 8. PUT /forms/fields/{id}/localizations/{lang}

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-fields`
- **Nombre:** Localizar (i18n) una definición de campo
- **Operation ID:** `FormsFieldsController_upsertLocalization`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsFieldsController.upsertLocalization](../../src/modules/forms/controllers/forms-fields.controller.ts)

### Descripción de negocio

Localizar (i18n) una definición de campo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /forms/fields/{id}/localizations/{lang}` en `FormsFieldsController_upsertLocalization`. El controlador delega en `FormsFieldsService.upsertLocalization`. Valida el body como `UpsertLocalizationDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lang` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpsertLocalizationDto`; los campos opcionales se omiten.

```http
PUT /forms/fields/00000000-0000-4000-8000-000000000001/localizations/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `label` | No | `string` | longitud máxima 200 | Etiqueta traducida | `valor-ejemplo` |
| `helpText` | No | `string` | longitud máxima 2000 | Texto de ayuda traducido | `valor-ejemplo` |
| `placeholder` | No | `string` | longitud máxima 200 | Placeholder traducido | `valor-ejemplo` |
| `validationMessage` | No | `string` | longitud máxima 500 | Mensaje de validación traducido | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /forms/fields/00000000-0000-4000-8000-000000000001/localizations/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "label": "valor-ejemplo",
  "helpText": "valor-ejemplo",
  "placeholder": "valor-ejemplo",
  "validationMessage": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Campo no encontrado | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Idioma no soportado | Excepción explícita en src/modules/forms/services/forms-fields.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/fields/{id}/localizations/{lang}"
}
```

---

## 9. POST /forms/instances

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-instances`
- **Nombre:** Abrir una instancia de formulario para un recurso
- **Operation ID:** `FormsInstancesController_openInstance`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsInstancesController.openInstance](../../src/modules/forms/controllers/forms-instances.controller.ts)

### Descripción de negocio

Abrir una instancia de formulario para un recurso. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/instances` en `FormsInstancesController_openInstance`. El controlador delega en `FormsInstancesService.openInstance`. Valida el body como `OpenInstanceDto` y consume `application/json`. El tipo de retorno estático es `Promise<FormInstanceResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `OpenInstanceDto`; los campos opcionales se omiten.

```http
POST /forms/instances HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "resourceId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `resourceId` | Sí | `string` | formato `uuid` | Recurso al que se adjunta el formulario | `00000000-0000-4000-8000-000000000001` |
| `resourceTypeConceptId` | No | `string` | formato `uuid` | Tipo de recurso (concept id) | `00000000-0000-4000-8000-000000000001` |
| `tenantContextId` | No | `string` | formato `uuid` | Contexto de tenant | `00000000-0000-4000-8000-000000000001` |
| `definitionSetVersionId` | No | `string` | formato `uuid` | Versión publicada del set cuyo schema se congela | `00000000-0000-4000-8000-000000000001` |
| `schemaVersion` | No | `number` | mínimo 1 | Versión de schema explícita | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/instances HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "resourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "tenantContextId": "00000000-0000-4000-8000-000000000001",
  "definitionSetVersionId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FormInstanceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FormInstanceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": 1,
  "state": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `schemaVersion` | Sí | `number` | Sin restricción adicional declarada | Versión de schema congelada | `1` |
| `state` | Sí | `string` | formato `uuid` | Estado de la instancia (concept id) | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una instancia para el recurso y versión | Excepción explícita en src/modules/forms/services/forms-instances.service.ts |
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
  "path": "/forms/instances"
}
```

---

## 10. POST /forms/instances/{id}/close

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-instances`
- **Nombre:** Cerrar formulario y proyectar vista de recurso
- **Operation ID:** `FormsInstancesController_closeInstance`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsInstancesController.closeInstance](../../src/modules/forms/controllers/forms-instances.controller.ts)

### Descripción de negocio

Cerrar formulario y proyectar vista de recurso. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/instances/{id}/close` en `FormsInstancesController_closeInstance`. El controlador delega en `FormsInstancesService.closeInstance`. No recibe body. El tipo de retorno estático es `Promise<OkResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /forms/instances/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /forms/instances/00000000-0000-4000-8000-000000000001/close HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OkResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OkResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OkResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ok": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ok` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Instancia no encontrada | Excepción explícita en src/modules/forms/services/forms-instances.service.ts |
| 422 | `PRECONDITION_FAILED` | La instancia no está abierta | Excepción explícita en src/modules/forms/services/forms-instances.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/instances/{id}/close"
}
```

---

## 11. POST /forms/instances/{id}/values

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-instances`
- **Nombre:** Capturar valores de formulario (value[x] exclusivo)
- **Operation ID:** `FormsInstancesController_captureValues`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsInstancesController.captureValues](../../src/modules/forms/controllers/forms-instances.controller.ts)

### Descripción de negocio

Capturar valores de formulario (value[x] exclusivo). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/instances/{id}/values` en `FormsInstancesController_captureValues`. El controlador delega en `FormsValuesService.captureValues`. Valida el body como `CaptureValuesDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdListResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CaptureValuesDto`; los campos opcionales se omiten.

```http
POST /forms/instances/00000000-0000-4000-8000-000000000001/values HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "values": [
    {
      "fieldId": "00000000-0000-4000-8000-000000000001",
      "dataType": "string",
      "value": {}
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `values` | Sí | `array<FieldValueInputDto>` | mínimo 1 elemento(s) | Valores a capturar | `[{"fieldId":"00000000-0000-4000-8000-000000000001","dataType":"string","value":{},"assignmentId":"00000000-0000-4000-8000-000000000001","unitConceptId":"00000000-0000-4000-8000-000000000001","ordinal":0}]` |
| `values[].fieldId` | Sí | `string` | formato `uuid` | Campo al que corresponde el valor | `00000000-0000-4000-8000-000000000001` |
| `values[].dataType` | Sí | `string` | valores: `string`, `text`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `time`, `uuid`, `json`, `binary`, `reference`, `code` | Tipo de dato (determina value[x]) | `string` |
| `values[].value` | Sí | `object` | Sin restricción adicional declarada | Valor tipado; se persiste en la columna value_* que corresponde | `{}` |
| `values[].assignmentId` | No | `string` | formato `uuid` | Asignación que autoriza el campo | `00000000-0000-4000-8000-000000000001` |
| `values[].unitConceptId` | No | `string` | formato `uuid` | Unidad (concept id) | `00000000-0000-4000-8000-000000000001` |
| `values[].ordinal` | No | `number` | mínimo 0 | Orden dentro del campo (cardinalidad) | `0` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/instances/00000000-0000-4000-8000-000000000001/values HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "values": [
    {
      "fieldId": "00000000-0000-4000-8000-000000000001",
      "dataType": "string",
      "value": {},
      "assignmentId": "00000000-0000-4000-8000-000000000001",
      "unitConceptId": "00000000-0000-4000-8000-000000000001",
      "ordinal": 0
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdListResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ids": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ids` | Sí | `array<string>` | formato `uuid` | Valor de ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Instancia no encontrada | Excepción explícita en src/modules/forms/services/forms-values.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La instancia no está abierta | Excepción explícita en src/modules/forms/services/forms-values.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/instances/{id}/values"
}
```

---

## 12. PATCH /forms/values/{id}

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-values`
- **Nombre:** Corregir valor con supersede y snapshot inmutable
- **Operation ID:** `FormsValuesController_correctValue`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsValuesController.correctValue](../../src/modules/forms/controllers/forms-values.controller.ts)

### Descripción de negocio

Corregir valor con supersede y snapshot inmutable. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /forms/values/{id}` en `FormsValuesController_correctValue`. El controlador delega en `FormsValuesService.correctValue`. Valida el body como `CorrectValueDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CorrectValueDto`; los campos opcionales se omiten.

```http
PATCH /forms/values/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "dataType": "string",
  "value": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `dataType` | Sí | `string` | valores: `string`, `text`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `time`, `uuid`, `json`, `binary`, `reference`, `code` | Tipo de dato del valor corregido | `string` |
| `value` | Sí | `object` | Sin restricción adicional declarada | Nuevo valor tipado | `{}` |
| `reasonConceptId` | No | `string` | formato `uuid` | Motivo de la corrección (concept id) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /forms/values/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "dataType": "string",
  "value": {},
  "reasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Valor no encontrado | Excepción explícita en src/modules/forms/services/forms-values.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El valor ya fue superado | Excepción explícita en src/modules/forms/services/forms-values.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/forms/values/{id}"
}
```

---

## 13. POST /forms/values/import

- **Módulo:** `forms`
- **Etiqueta OpenAPI:** `forms-values`
- **Nombre:** Registrar procedencia de valores importados (batch ETL)
- **Operation ID:** `FormsValuesController_importValues`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [FormsValuesController.importValues](../../src/modules/forms/controllers/forms-values.controller.ts)

### Descripción de negocio

Registrar procedencia de valores importados (batch ETL). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /forms/values/import` en `FormsValuesController_importValues`. El controlador delega en `FormsValuesService.importValues`. Valida el body como `ImportValuesDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdListResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ImportValuesDto`; los campos opcionales se omiten.

```http
POST /forms/values/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "importBatchId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "formInstanceId": "00000000-0000-4000-8000-000000000001",
      "fieldId": "00000000-0000-4000-8000-000000000001",
      "dataType": "string",
      "value": {}
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `PRACTITIONER`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `importBatchId` | Sí | `string` | formato `uuid` | Identificador del lote de importación | `00000000-0000-4000-8000-000000000001` |
| `items` | Sí | `array<ImportValueItemDto>` | mínimo 1 elemento(s) | Valores a importar | `[{"formInstanceId":"00000000-0000-4000-8000-000000000001","fieldId":"00000000-0000-4000-8000-000000000001","dataType":"string","value":{},"sourceSystemUri":"valor-ejemplo","sourceResourceType":"valor-ejemplo","sourceResourceId":"00000000-0000-4000-8000-000000000001","contentHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]` |
| `items[].formInstanceId` | Sí | `string` | formato `uuid` | Instancia de formulario destino | `00000000-0000-4000-8000-000000000001` |
| `items[].fieldId` | Sí | `string` | formato `uuid` | Campo destino | `00000000-0000-4000-8000-000000000001` |
| `items[].dataType` | Sí | `string` | valores: `string`, `text`, `integer`, `decimal`, `boolean`, `date`, `datetime`, `time`, `uuid`, `json`, `binary`, `reference`, `code` | Tipo de dato (determina value[x]) | `string` |
| `items[].value` | Sí | `object` | Sin restricción adicional declarada | Valor importado | `{}` |
| `items[].sourceSystemUri` | No | `string` | longitud máxima 500 | URI del sistema origen | `valor-ejemplo` |
| `items[].sourceResourceType` | No | `string` | longitud máxima 100 | Tipo de recurso origen | `valor-ejemplo` |
| `items[].sourceResourceId` | No | `string` | longitud máxima 200 | Id de recurso origen | `00000000-0000-4000-8000-000000000001` |
| `items[].contentHash` | No | `string` | longitud máxima 200 | Hash de contenido (idempotencia) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /forms/values/import HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "importBatchId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "formInstanceId": "00000000-0000-4000-8000-000000000001",
      "fieldId": "00000000-0000-4000-8000-000000000001",
      "dataType": "string",
      "value": {},
      "sourceSystemUri": "valor-ejemplo",
      "sourceResourceType": "valor-ejemplo",
      "sourceResourceId": "00000000-0000-4000-8000-000000000001",
      "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdListResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "ids": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ids` | Sí | `array<string>` | formato `uuid` | Valor de ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, PRACTITIONER. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Instancia no encontrada | Excepción explícita en src/modules/forms/services/forms-values.service.ts |
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
  "path": "/forms/values/import"
}
```

---

