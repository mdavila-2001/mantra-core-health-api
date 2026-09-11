<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `system_context`

Referencia exhaustiva de 13 operación(es) del módulo `system_context`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `system-context`
- **Controladores:** `SystemContextController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /system-context/contexts](#1-post-system-context-contexts) — Definir un contexto de sistema con su versión inicial
2. [POST /system-context/contexts/{id}/bindings](#2-post-system-context-contexts-id-bindings) — Vincular el contexto a un consumidor
3. [POST /system-context/contexts/{id}/refresh](#3-post-system-context-contexts-id-refresh) — Refrescar el contexto y snapshotear su procedencia
4. [POST /system-context/contexts/{id}/rollback](#4-post-system-context-contexts-id-rollback) — Volver a una versión anterior del contexto
5. [POST /system-context/contexts/{id}/versions/{version}/activate](#5-post-system-context-contexts-id-versions-version-activate) — Promover la versión a vigente
6. [GET /system-context/dynamic-enums](#6-get-system-context-dynamic-enums) — Leer las opciones publicadas de una enumeración
7. [GET /system-context/dynamic-enums/bindings](#7-get-system-context-dynamic-enums-bindings) — Listar los amarres campo -> enumeración
8. [POST /system-context/dynamic-enums/definitions](#8-post-system-context-dynamic-enums-definitions) — Definir una enumeración dinámica ligada a un value set
9. [POST /system-context/dynamic-enums/definitions/{defId}/bindings](#9-post-system-context-dynamic-enums-definitions-defid-bindings) — Vincular la enumeración a un campo destino
10. [POST /system-context/dynamic-enums/definitions/{defId}/retire](#10-post-system-context-dynamic-enums-definitions-defid-retire) — Retirar la definición (borrado lógico gobernado)
11. [POST /system-context/dynamic-enums/definitions/{defId}/versions](#11-post-system-context-dynamic-enums-definitions-defid-versions) — Redactar una versión con su snapshot de opciones
12. [POST /system-context/dynamic-enums/definitions/{defId}/versions/{version}/publish](#12-post-system-context-dynamic-enums-definitions-defid-versions-version-publish) — Publicar la versión e invalidar la caché
13. [POST /system-context/dynamic-enums/resolve](#13-post-system-context-dynamic-enums-resolve) — Resolver y validar un valor de enumeración antes de escribirlo

---

## 1. POST /system-context/contexts

- **Módulo:** `system_context`
- **Etiqueta OpenAPI:** `system-context`
- **Nombre:** Definir un contexto de sistema con su versión inicial
- **Operation ID:** `SystemContextController_createContext`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SystemContextController.createContext](../../src/modules/system_context/controllers/system-context.controller.ts)

### Descripción de negocio

El contenido nunca lleva secretos: sólo referencias gobernadas.


### Descripción del sistema

NestJS resuelve `POST /system-context/contexts` en `SystemContextController_createContext`. El controlador delega en `SystemContextsService.createContext`. Valida el body como `CreateSystemContextDto` y consume `application/json`. El tipo de retorno estático es `Promise<SystemContextResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateSystemContextDto`; los campos opcionales se omiten.

```http
POST /system-context/contexts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "contextTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "scopeTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "contextJson": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `GOVERNANCE`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Código único del contexto | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `contextTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de contexto (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `scopeTypeConceptId` | Sí | `string` | formato `uuid` | Ámbito del contexto (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `countryConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `localeConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `refreshPolicyConceptId` | No | `string` | formato `uuid` | Política de refresco (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `schemaVersion` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `contextJson` | Sí | `object` | Sin restricción adicional declarada | Contenido del contexto. Nunca secretos: sólo referencias gobernadas. | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /system-context/contexts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "contextTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "scopeTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "localeConceptId": "00000000-0000-4000-8000-000000000001",
  "refreshPolicyConceptId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo",
  "contextJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SystemContextResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SystemContextResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SystemContextResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SystemContextResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SystemContextResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SystemContextResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SystemContextResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SystemContextResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SystemContextResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SystemContextResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "currentVersionId": "00000000-0000-4000-8000-000000000001",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `currentVersionId` | Sí | `string` | formato `uuid` | Versión 1, creada en la misma transacción | `00000000-0000-4000-8000-000000000001` |
| `contentHash` | Sí | `string` | Sin restricción adicional declarada | Hash del contenido de la versión inicial | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, GOVERNANCE. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un contexto con ese código | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
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
  "path": "/system-context/contexts"
}
```

---

## 2. POST /system-context/contexts/{id}/bindings

- **Módulo:** `system_context`
- **Etiqueta OpenAPI:** `system-context`
- **Nombre:** Vincular el contexto a un consumidor
- **Operation ID:** `SystemContextController_createContextBinding`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SystemContextController.createContextBinding](../../src/modules/system_context/controllers/system-context.controller.ts)

### Descripción de negocio

Dos bindings del mismo consumidor no pueden solapar su ventana.


### Descripción del sistema

NestJS resuelve `POST /system-context/contexts/{id}/bindings` en `SystemContextController_createContextBinding`. El controlador delega en `SystemContextsService.createBinding`. Valida el body como `CreateContextBindingDto` y consume `application/json`. El tipo de retorno estático es `Promise<ContextBindingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateContextBindingDto`; los campos opcionales se omiten.

```http
POST /system-context/contexts/00000000-0000-4000-8000-000000000001/bindings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "consumerTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "consumerId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MODULE_OWNER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `consumerTypeConceptId` | Sí | `string` | formato `uuid` | Naturaleza del consumidor (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `consumerId` | Sí | `string` | formato `uuid` | Consumidor concreto | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `countryConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `activationRuleJson` | No | `object` | Sin restricción adicional declarada | Condición de activación del binding | `{}` |
| `priority` | No | `number` | mínimo 1 | Desempata varios bindings; menor gana | `1` |
| `validFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /system-context/contexts/00000000-0000-4000-8000-000000000001/bindings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "consumerTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "consumerId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "activationRuleJson": {},
  "priority": 1,
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ContextBindingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ContextBindingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ContextBindingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ContextBindingResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ContextBindingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ContextBindingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ContextBindingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ContextBindingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ContextBindingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ContextBindingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ContextBindingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "systemContextId": "00000000-0000-4000-8000-000000000001",
  "priority": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `systemContextId` | Sí | `string` | formato `uuid` | Identificador asociado a system context. | `00000000-0000-4000-8000-000000000001` |
| `priority` | Sí | `number` | Sin restricción adicional declarada | Valor de priority mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MODULE_OWNER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contexto no encontrado | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 409 | `CONFLICT` | El consumidor ya tiene un binding en esa ventana | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ventana de validez está invertida | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 422 | `PRECONDITION_FAILED` | El contexto no está activo | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/system-context/contexts/{id}/bindings"
}
```

---

## 3. POST /system-context/contexts/{id}/refresh

- **Módulo:** `system_context`
- **Etiqueta OpenAPI:** `system-context`
- **Nombre:** Refrescar el contexto y snapshotear su procedencia
- **Operation ID:** `SystemContextController_refreshContext`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SystemContextController.refreshContext](../../src/modules/system_context/controllers/system-context.controller.ts)

### Descripción de negocio

Idempotente por clave; si el contenido no cambió, no se redacta versión.

Contexto declarado en el controlador: UC-45-07 (incluye UC-45-08).

### Descripción del sistema

NestJS resuelve `POST /system-context/contexts/{id}/refresh` en `SystemContextController_refreshContext`. El controlador delega en `SystemContextsService.refreshContext`. Valida el body como `RefreshSystemContextDto` y consume `application/json`. El tipo de retorno estático es `Promise<RefreshRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RefreshSystemContextDto`; los campos opcionales se omiten.

```http
POST /system-context/contexts/00000000-0000-4000-8000-000000000001/refresh HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "idempotencyKey": "valor-ejemplo",
  "trigger": "SCHEDULED",
  "contextJson": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `idempotencyKey` | Sí | `string` | longitud máxima 200 | Clave de idempotencia de la corrida | `valor-ejemplo` |
| `trigger` | Sí | `string` | valores: `SCHEDULED`, `MANUAL`, `EVENT` | Sin descripción específica en el contrato OpenAPI. | `SCHEDULED` |
| `contextJson` | Sí | `object` | Sin restricción adicional declarada | Contenido regenerado del contexto | `{}` |
| `schemaVersion` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `generatedByAgentId` | No | `string` | formato `uuid` | Agente que generó el contenido | `00000000-0000-4000-8000-000000000001` |
| `inputs` | No | `array<ContextInputDto>` | Sin restricción adicional declarada | Procedencia de lo recogido | `[{"sourceTypeConceptId":"00000000-0000-4000-8000-000000000001","sourceSchemaName":"Nombre de ejemplo","sourceEntityName":"Nombre de ejemplo","sourceRecordId":"00000000-0000-4000-8000-000000000001","sourceVersionId":"00000000-0000-4000-8000-000000000001","sourceContentHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","sourceFreshnessAt":"2026-07-31T12:00:00.000Z","precedence":1,"required":false,"missing":true}]` |
| `inputs[].sourceTypeConceptId` | No | `string` | formato `uuid` | Naturaleza de la fuente (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `inputs[].sourceSchemaName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `inputs[].sourceEntityName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `inputs[].sourceRecordId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `inputs[].sourceVersionId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `inputs[].sourceContentHash` | No | `string` | longitud máxima 200 | Hash del contenido de la fuente en el momento del snapshot | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `inputs[].sourceFreshnessAt` | No | `string` | formato `date-time` | Frescura del dato de origen | `2026-07-31T12:00:00.000Z` |
| `inputs[].precedence` | No | `number` | mínimo 1 | Precedencia; menor gana ante colisión | `1` |
| `inputs[].required` | No | `boolean` | Sin restricción adicional declarada | Si falta, la corrida falla | `false` |
| `inputs[].missing` | No | `boolean` | Sin restricción adicional declarada | true si la entrada no pudo recogerse | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /system-context/contexts/00000000-0000-4000-8000-000000000001/refresh HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "idempotencyKey": "valor-ejemplo",
  "trigger": "SCHEDULED",
  "contextJson": {},
  "schemaVersion": "valor-ejemplo",
  "generatedByAgentId": "00000000-0000-4000-8000-000000000001",
  "inputs": [
    {
      "sourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "sourceSchemaName": "Nombre de ejemplo",
      "sourceEntityName": "Nombre de ejemplo",
      "sourceRecordId": "00000000-0000-4000-8000-000000000001",
      "sourceVersionId": "00000000-0000-4000-8000-000000000001",
      "sourceContentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "sourceFreshnessAt": "2026-07-31T12:00:00.000Z",
      "precedence": 1,
      "required": false,
      "missing": true
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RefreshRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RefreshRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "runId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "unchanged": true,
  "inputCount": 1,
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `runId` | Sí | `string` | formato `uuid` | Identificador asociado a run. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | No | `string` | formato `uuid` | Versión redactada, si hubo cambio | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | No | `number` | Sin restricción adicional declarada | Número de la versión redactada | `1` |
| `contentHash` | Sí | `string` | Sin restricción adicional declarada | Hash del contenido regenerado | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `unchanged` | Sí | `boolean` | Sin restricción adicional declarada | true si el contenido no cambió y no se redactó versión | `true` |
| `inputCount` | Sí | `number` | Sin restricción adicional declarada | Entradas de procedencia registradas | `1` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si la corrida ya existía con esa clave | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contexto no encontrado | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El contexto no está activo | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/system-context/contexts/{id}/refresh"
}
```

---

## 4. POST /system-context/contexts/{id}/rollback

- **Módulo:** `system_context`
- **Etiqueta OpenAPI:** `system-context`
- **Nombre:** Volver a una versión anterior del contexto
- **Operation ID:** `SystemContextController_rollbackContext`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SystemContextController.rollbackContext](../../src/modules/system_context/controllers/system-context.controller.ts)

### Descripción de negocio

Sólo a una que estuvo vigente; el historial se conserva entero.


### Descripción del sistema

NestJS resuelve `POST /system-context/contexts/{id}/rollback` en `SystemContextController_rollbackContext`. El controlador delega en `SystemContextsService.rollbackContext`. Valida el body como `RollbackContextDto` y consume `application/json`. El tipo de retorno estático es `Promise<RollbackContextResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RollbackContextDto`; los campos opcionales se omiten.

```http
POST /system-context/contexts/00000000-0000-4000-8000-000000000001/rollback HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetVersionNumber": 1,
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `targetVersionNumber` | Sí | `number` | mínimo 1 | Versión a reactivar | `1` |
| `reason` | Sí | `string` | Sin restricción adicional declarada | Por qué se vuelve atrás | `Texto descriptivo de ejemplo` |
| `expectedContentHash` | No | `string` | longitud máxima 200 | Hash esperado de la versión objetivo | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /system-context/contexts/00000000-0000-4000-8000-000000000001/rollback HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetVersionNumber": 1,
  "reason": "Texto descriptivo de ejemplo",
  "expectedContentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RollbackContextResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RollbackContextResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RollbackContextResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RollbackContextResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RollbackContextResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RollbackContextResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RollbackContextResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RollbackContextResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RollbackContextResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RollbackContextResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RollbackContextResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "supersededVersionId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Versión reactivada | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `supersededVersionId` | Sí | `string` | formato `uuid` | Versión que queda superseded | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contexto no encontrado | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 404 | `NOT_FOUND` | Versión objetivo no encontrada | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo se puede volver a una versión que estuvo vigente | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 422 | `PRECONDITION_FAILED` | El contenido de la versión no es el esperado | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 422 | `PRECONDITION_FAILED` | El contexto no tiene versión vigente | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/system-context/contexts/{id}/rollback"
}
```

---

## 5. POST /system-context/contexts/{id}/versions/{version}/activate

- **Módulo:** `system_context`
- **Etiqueta OpenAPI:** `system-context`
- **Nombre:** Promover la versión a vigente
- **Operation ID:** `SystemContextController_activateContextVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SystemContextController.activateContextVersion](../../src/modules/system_context/controllers/system-context.controller.ts)

### Descripción de negocio

Exactamente una versión activa por contexto.


### Descripción del sistema

NestJS resuelve `POST /system-context/contexts/{id}/versions/{version}/activate` en `SystemContextController_activateContextVersion`. El controlador delega en `SystemContextsService.activateVersion`. Valida el body como `ActivateContextVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ActivateContextVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `version` | path | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ActivateContextVersionDto`; los campos opcionales se omiten.

```http
POST /system-context/contexts/00000000-0000-4000-8000-000000000001/versions/1/activate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expectedContentHash` | No | `string` | longitud máxima 200 | Hash esperado; si no coincide con el de la versión, no se activa | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /system-context/contexts/00000000-0000-4000-8000-000000000001/versions/1/activate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "expectedContentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ActivateContextVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ActivateContextVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ActivateContextVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ActivateContextVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ActivateContextVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ActivateContextVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ActivateContextVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ActivateContextVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ActivateContextVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ActivateContextVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ActivateContextVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "supersededVersionId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `supersededVersionId` | No | `string` | formato `uuid` | Versión que queda superseded | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contexto no encontrado | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 404 | `NOT_FOUND` | Versión del contexto no encontrada | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 409 | `CONFLICT` | La versión ya es la vigente | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El contexto no está activo | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión no está en borrador | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 422 | `PRECONDITION_FAILED` | El contenido de la versión no es el esperado | Excepción explícita en src/modules/system_context/services/system-contexts.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/system-context/contexts/{id}/versions/{version}/activate"
}
```

---

## 6. GET /system-context/dynamic-enums

- **Módulo:** `system_context`
- **Etiqueta OpenAPI:** `system-context`
- **Nombre:** Leer las opciones publicadas de una enumeración
- **Operation ID:** `SystemContextController_readEnum`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SystemContextController.readEnum](../../src/modules/system_context/controllers/system-context.controller.ts)

### Descripción de negocio

Por campo destino o por código; devuelve `conceptId` para escribir y `display` para pintar.

Contexto declarado en el controlador: Cara de lectura de UC-45-05: las opciones válidas de un campo de catálogo. Se pide por la ruta del campo (`target=profiles.persons.administrative_gender_concept_id`) o por el código de la enumeración (`code=administrative-gender`). Los dos son constantes del código fuente; ninguno es un uuid sembrado por entorno, que es lo que impedía poblar un selector. Es `@Public()` por la misma razón por la que `listEnumBindings` no exige rol: quien más necesita estas opciones es el alta anónima de paciente, que todavía no tiene sesión con la que pedirlas.

### Descripción del sistema

NestJS resuelve `GET /system-context/dynamic-enums` en `SystemContextController_readEnum`. El controlador delega en `DynamicEnumsService.readEnum`. No recibe body. El tipo de retorno estático es `Promise<ReadDynamicEnumResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `target` | query | No | `string` | Sin restricción adicional declarada | Campo destino, como `profiles.persons.sex_at_birth_concept_id` | `valor-ejemplo` |
| `code` | query | No | `string` | Sin restricción adicional declarada | Código estable de la enumeración, como `sex-at-birth` | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /system-context/dynamic-enums HTTP/1.1
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
GET /system-context/dynamic-enums?target=valor-ejemplo&code=CODIGO_EJEMPLO HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReadDynamicEnumResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ReadDynamicEnumResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ReadDynamicEnumResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ReadDynamicEnumResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ReadDynamicEnumResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ReadDynamicEnumResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReadDynamicEnumResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "definitionId": "00000000-0000-4000-8000-000000000001",
  "valueSetId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "valueSetVersionId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo",
  "cacheToken": "valor-ejemplo",
  "allowCustomValue": true,
  "options": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "ordinal": 1,
      "isDefault": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | Sin restricción adicional declarada | Código estable de la enumeración. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible de la enumeración. | `Nombre de ejemplo` |
| `description` | No | `string` | Sin restricción adicional declarada | Qué gobierna la enumeración. | `Texto descriptivo de ejemplo` |
| `definitionId` | Sí | `string` | formato `uuid` | Identificador de la definición. | `00000000-0000-4000-8000-000000000001` |
| `valueSetId` | Sí | `string` | formato `uuid` | Conjunto de valores de terminología del que sale la enumeración. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Versión publicada de la que salen las opciones. | `00000000-0000-4000-8000-000000000001` |
| `valueSetVersionId` | Sí | `string` | formato `uuid` | Versión del value set que la versión vigente congeló. Es lo que hay que volver a mandar para redactar la siguiente: la entidad la exige y ninguna otra lectura la exponía. | `00000000-0000-4000-8000-000000000001` |
| `schemaVersion` | Sí | `string` | Sin restricción adicional declarada | Versión de esquema que la versión vigente declara. Se repite al redactar. | `valor-ejemplo` |
| `cacheToken` | No | `string` | Sin restricción adicional declarada | Testigo de caché de la versión publicada. | `valor-ejemplo` |
| `allowCustomValue` | Sí | `boolean` | Sin restricción adicional declarada | Si el campo admite un valor fuera del conjunto. | `true` |
| `options` | Sí | `array<DynamicEnumOptionItemDto>` | Sin restricción adicional declarada | Opciones habilitadas, en el orden en que se ofrecen. | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","display":"valor-ejemplo","ordinal":1,"isDefault":true}]` |
| `options[].conceptId` | Sí | `string` | formato `uuid` | Concepto que respalda la opción; es el valor que se envía al escribir. | `00000000-0000-4000-8000-000000000001` |
| `options[].code` | Sí | `string` | Sin restricción adicional declarada | Código estable del concepto. | `CODIGO_EJEMPLO` |
| `options[].display` | Sí | `string` | Sin restricción adicional declarada | Rótulo legible de la opción. | `valor-ejemplo` |
| `options[].ordinal` | No | `number` | Sin restricción adicional declarada | Posición en la que se ofrece, empezando en cero. | `1` |
| `options[].isDefault` | Sí | `boolean` | Sin restricción adicional declarada | Si la opción viene preseleccionada. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 400 | `VALIDATION_FAILED` | Indique el campo destino (`target`) o el código de la enumeración (`code`) | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 400 | `VALIDATION_FAILED` | El campo destino se escribe como `esquema.tabla.columna` | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Enumeración no encontrada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 404 | `NOT_FOUND` | La enumeración está retirada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 422 | `PRECONDITION_FAILED` | La enumeración no tiene versión publicada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/system-context/dynamic-enums"
}
```

---

## 7. GET /system-context/dynamic-enums/bindings

- **Módulo:** `system_context`
- **Etiqueta OpenAPI:** `system-context`
- **Nombre:** Listar los amarres campo -> enumeración
- **Operation ID:** `SystemContextController_listEnumBindings`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SystemContextController.listEnumBindings](../../src/modules/system_context/controllers/system-context.controller.ts)

### Descripción de negocio

Permite descubrir qué campos `*_concept_id` son de catálogo sin conocer ningún uuid.

Contexto declarado en el controlador: Cara de lectura de UC-45-04: qué campos de una tabla salen de catálogo. Va declarada antes que cualquier ruta con parámetro para que `bindings` no sea capturado como identificador. No exige rol de administración, y es deliberado: escribir la enumeración gobierna el sistema y por eso pide `PLATFORM_ADMIN`, pero **leer** la lista de opciones válidas es lo que necesita cualquier formulario para pintarse. Pedir rol de plataforma para eso dejaría el catálogo inutilizable desde el cliente, que es exactamente la situación que este endpoint viene a corregir. No revela dato personal alguno: son vocabularios de plataforma.

### Descripción del sistema

NestJS resuelve `GET /system-context/dynamic-enums/bindings` en `SystemContextController_listEnumBindings`. El controlador delega en `DynamicEnumsService.listBindings`. No recibe body. El tipo de retorno estático es `Promise<ListDynamicEnumBindingsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `schema` | query | No | `string` | Sin restricción adicional declarada | Esquema al que acotar (por ejemplo, `profiles`) | `valor-ejemplo` |
| `entity` | query | No | `string` | Sin restricción adicional declarada | Tabla a la que acotar (por ejemplo, `persons`) | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /system-context/dynamic-enums/bindings HTTP/1.1
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
GET /system-context/dynamic-enums/bindings?schema=valor-ejemplo&entity=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListDynamicEnumBindingsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListDynamicEnumBindingsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListDynamicEnumBindingsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListDynamicEnumBindingsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListDynamicEnumBindingsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListDynamicEnumBindingsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListDynamicEnumBindingsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "target": "profiles.persons.administrative_gender_concept_id",
      "targetSchemaName": "Nombre de ejemplo",
      "targetEntityName": "Nombre de ejemplo",
      "targetFieldName": "Nombre de ejemplo",
      "enumCode": "CODIGO_EJEMPLO",
      "definitionId": "00000000-0000-4000-8000-000000000001",
      "valueSetId": "00000000-0000-4000-8000-000000000001",
      "required": true,
      "fallbackConceptId": "00000000-0000-4000-8000-000000000001",
      "validationModeConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<DynamicEnumBindingItemDto>` | Sin restricción adicional declarada | Amarres activos, ordenados por campo. | `[{"target":"profiles.persons.administrative_gender_concept_id","targetSchemaName":"Nombre de ejemplo","targetEntityName":"Nombre de ejemplo","targetFieldName":"Nombre de ejemplo","enumCode":"CODIGO_EJEMPLO","definitionId":"00000000-0000-4000-8000-000000000001","valueSetId":"00000000-0000-4000-8000-000000000001","required":true,"fallbackConceptId":"00000000-0000-4000-8000-000000000001","validationModeConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].target` | Sí | `string` | Sin restricción adicional declarada | Campo gobernado, en la forma `esquema.tabla.columna`. | `profiles.persons.administrative_gender_concept_id` |
| `items[].targetSchemaName` | Sí | `string` | Sin restricción adicional declarada | Esquema de la tabla destino. | `Nombre de ejemplo` |
| `items[].targetEntityName` | Sí | `string` | Sin restricción adicional declarada | Tabla destino. | `Nombre de ejemplo` |
| `items[].targetFieldName` | Sí | `string` | Sin restricción adicional declarada | Columna destino. | `Nombre de ejemplo` |
| `items[].enumCode` | Sí | `string` | Sin restricción adicional declarada | Código estable de la enumeración que lo gobierna. | `CODIGO_EJEMPLO` |
| `items[].definitionId` | Sí | `string` | formato `uuid` | Identificador de la definición. | `00000000-0000-4000-8000-000000000001` |
| `items[].valueSetId` | Sí | `string` | formato `uuid` | Conjunto de valores del que sale la enumeración. | `00000000-0000-4000-8000-000000000001` |
| `items[].required` | Sí | `boolean` | Sin restricción adicional declarada | Si el amarre declara el campo obligatorio. | `true` |
| `items[].fallbackConceptId` | No | `string` | formato `uuid` | Concepto de reserva cuando la validación es permisiva. | `00000000-0000-4000-8000-000000000001` |
| `items[].validationModeConceptId` | No | `string` | formato `uuid` | Modo de validación con el que se resuelve el valor propuesto. | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántos amarres trae la respuesta. | `1` |

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
  "path": "/system-context/dynamic-enums/bindings"
}
```

---

## 8. POST /system-context/dynamic-enums/definitions

- **Módulo:** `system_context`
- **Etiqueta OpenAPI:** `system-context`
- **Nombre:** Definir una enumeración dinámica ligada a un value set
- **Operation ID:** `SystemContextController_createEnumDefinition`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SystemContextController.createEnumDefinition](../../src/modules/system_context/controllers/system-context.controller.ts)

### Descripción de negocio

Sin tipos ENUM nativos de PostgreSQL: el conjunto vive en filas versionadas.


### Descripción del sistema

NestJS resuelve `POST /system-context/dynamic-enums/definitions` en `SystemContextController_createEnumDefinition`. El controlador delega en `DynamicEnumsService.createDefinition`. Valida el body como `CreateEnumDefinitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<EnumDefinitionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateEnumDefinitionDto`; los campos opcionales se omiten.

```http
POST /system-context/dynamic-enums/definitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "valueSetId": "00000000-0000-4000-8000-000000000001",
  "scopeTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "selectionModeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `TERMINOLOGY_ENGINEER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Código único global de la definición | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `valueSetId` | Sí | `string` | formato `uuid` | Value set de terminología del que sale el enum | `00000000-0000-4000-8000-000000000001` |
| `scopeTypeConceptId` | Sí | `string` | formato `uuid` | Ámbito de la definición (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `selectionModeConceptId` | Sí | `string` | formato `uuid` | Modo de selección (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `countryConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `allowTenantExtension` | No | `boolean` | Sin restricción adicional declarada | El tenant puede añadir opciones propias | `false` |
| `allowCustomValue` | No | `boolean` | Sin restricción adicional declarada | Se admite un valor fuera del catálogo | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /system-context/dynamic-enums/definitions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "valueSetId": "00000000-0000-4000-8000-000000000001",
  "scopeTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "selectionModeConceptId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "allowTenantExtension": false,
  "allowCustomValue": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EnumDefinitionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EnumDefinitionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EnumDefinitionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EnumDefinitionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EnumDefinitionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EnumDefinitionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EnumDefinitionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EnumDefinitionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EnumDefinitionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EnumDefinitionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `statusConceptId` | Sí | `string` | formato `uuid` | La definición nace en borrador | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: TERMINOLOGY_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una enumeración con ese código | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
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
  "path": "/system-context/dynamic-enums/definitions"
}
```

---

## 9. POST /system-context/dynamic-enums/definitions/{defId}/bindings

- **Módulo:** `system_context`
- **Etiqueta OpenAPI:** `system-context`
- **Nombre:** Vincular la enumeración a un campo destino
- **Operation ID:** `SystemContextController_createEnumBinding`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SystemContextController.createEnumBinding](../../src/modules/system_context/controllers/system-context.controller.ts)

### Descripción de negocio

Un campo no puede estar gobernado por dos enumeraciones a la vez.


### Descripción del sistema

NestJS resuelve `POST /system-context/dynamic-enums/definitions/{defId}/bindings` en `SystemContextController_createEnumBinding`. El controlador delega en `DynamicEnumsService.createBinding`. Valida el body como `CreateEnumBindingDto` y consume `application/json`. El tipo de retorno estático es `Promise<EnumBindingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `defId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateEnumBindingDto`; los campos opcionales se omiten.

```http
POST /system-context/dynamic-enums/definitions/00000000-0000-4000-8000-000000000001/bindings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetSchemaName": "Nombre de ejemplo",
  "targetEntityName": "Nombre de ejemplo",
  "targetFieldName": "Nombre de ejemplo",
  "validationMode": "STRICT"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `MODULE_OWNER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `defId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `targetSchemaName` | Sí | `string` | longitud máxima 100 | Esquema del campo destino | `Nombre de ejemplo` |
| `targetEntityName` | Sí | `string` | longitud máxima 100 | Entidad del campo destino | `Nombre de ejemplo` |
| `targetFieldName` | Sí | `string` | longitud máxima 100 | Campo gobernado por el enum | `Nombre de ejemplo` |
| `systemContextId` | No | `string` | formato `uuid` | Contexto que acota la resolución | `00000000-0000-4000-8000-000000000001` |
| `required` | No | `boolean` | Sin restricción adicional declarada | El campo no admite quedarse vacío | `false` |
| `fallbackConceptId` | No | `string` | formato `uuid` | Concepto al que se cae en modo LENIENT; obligatorio en ese modo | `00000000-0000-4000-8000-000000000001` |
| `validationMode` | Sí | `string` | valores: `STRICT`, `LENIENT` | Sin descripción específica en el contrato OpenAPI. | `STRICT` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /system-context/dynamic-enums/definitions/00000000-0000-4000-8000-000000000001/bindings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetSchemaName": "Nombre de ejemplo",
  "targetEntityName": "Nombre de ejemplo",
  "targetFieldName": "Nombre de ejemplo",
  "systemContextId": "00000000-0000-4000-8000-000000000001",
  "required": false,
  "fallbackConceptId": "00000000-0000-4000-8000-000000000001",
  "validationMode": "STRICT"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EnumBindingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EnumBindingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EnumBindingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EnumBindingResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<EnumBindingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EnumBindingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EnumBindingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EnumBindingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EnumBindingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EnumBindingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EnumBindingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "dynamicEnumDefinitionId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `dynamicEnumDefinitionId` | Sí | `string` | formato `uuid` | Identificador asociado a dynamic enum definition. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: MODULE_OWNER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Enumeración no encontrada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 409 | `CONFLICT` | El campo ya está gobernado por otra enumeración | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El modo permisivo exige un concepto de reserva | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 422 | `PRECONDITION_FAILED` | La enumeración está retirada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/system-context/dynamic-enums/definitions/{defId}/bindings"
}
```

---

## 10. POST /system-context/dynamic-enums/definitions/{defId}/retire

- **Módulo:** `system_context`
- **Etiqueta OpenAPI:** `system-context`
- **Nombre:** Retirar la definición (borrado lógico gobernado)
- **Operation ID:** `SystemContextController_retireEnumDefinition`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SystemContextController.retireEnumDefinition](../../src/modules/system_context/controllers/system-context.controller.ts)

### Descripción de negocio

Sus bindings quedan deshabilitados; un campo obligatorio bloquea el retiro.


### Descripción del sistema

NestJS resuelve `POST /system-context/dynamic-enums/definitions/{defId}/retire` en `SystemContextController_retireEnumDefinition`. El controlador delega en `DynamicEnumsService.retireDefinition`. Valida el body como `RetireEnumDefinitionDto` y consume `application/json`. El tipo de retorno estático es `Promise<RetireEnumDefinitionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `defId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RetireEnumDefinitionDto`; los campos opcionales se omiten.

```http
POST /system-context/dynamic-enums/definitions/00000000-0000-4000-8000-000000000001/retire HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `defId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | Sin restricción adicional declarada | Por qué se retira | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /system-context/dynamic-enums/definitions/00000000-0000-4000-8000-000000000001/retire HTTP/1.1
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
| 200 | Operación completada correctamente. | `Promise<RetireEnumDefinitionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RetireEnumDefinitionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RetireEnumDefinitionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RetireEnumDefinitionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RetireEnumDefinitionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RetireEnumDefinitionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RetireEnumDefinitionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RetireEnumDefinitionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RetireEnumDefinitionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RetireEnumDefinitionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RetireEnumDefinitionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "disabledBindings": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `disabledBindings` | Sí | `number` | Sin restricción adicional declarada | Bindings que quedan deshabilitados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Enumeración no encontrada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 409 | `CONFLICT` | La enumeración ya está retirada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Hay un campo obligatorio vinculado; migra su enumeración antes de retirarla | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/system-context/dynamic-enums/definitions/{defId}/retire"
}
```

---

## 11. POST /system-context/dynamic-enums/definitions/{defId}/versions

- **Módulo:** `system_context`
- **Etiqueta OpenAPI:** `system-context`
- **Nombre:** Redactar una versión con su snapshot de opciones
- **Operation ID:** `SystemContextController_draftEnumVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SystemContextController.draftEnumVersion](../../src/modules/system_context/controllers/system-context.controller.ts)

### Descripción de negocio

Las opciones son inmutables: preservan la validación histórica.


### Descripción del sistema

NestJS resuelve `POST /system-context/dynamic-enums/definitions/{defId}/versions` en `SystemContextController_draftEnumVersion`. El controlador delega en `DynamicEnumsService.draftVersion`. Valida el body como `DraftEnumVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<EnumVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `defId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DraftEnumVersionDto`; los campos opcionales se omiten.

```http
POST /system-context/dynamic-enums/definitions/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "valueSetVersionId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo",
  "options": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `TERMINOLOGY_ENGINEER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `defId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `valueSetVersionId` | Sí | `string` | formato `uuid` | Versión del value set que se congela | `00000000-0000-4000-8000-000000000001` |
| `schemaVersion` | Sí | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `options` | Sí | `array<EnumOptionDto>` | mínimo 1 elemento(s) | Snapshot ordenado de las opciones | `[{"conceptId":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","display":"valor-ejemplo","ordinal":1,"isDefault":false,"enabled":true,"metadataJson":{}}]` |
| `options[].conceptId` | Sí | `string` | formato `uuid` | Concepto de terminología | `00000000-0000-4000-8000-000000000001` |
| `options[].code` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `options[].display` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `options[].ordinal` | No | `number` | mínimo 0 | Orden de presentación; por defecto, el del array | `1` |
| `options[].isDefault` | No | `boolean` | Sin restricción adicional declarada | Sólo una opción puede serlo | `false` |
| `options[].enabled` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `options[].metadataJson` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /system-context/dynamic-enums/definitions/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "valueSetVersionId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo",
  "options": [
    {
      "conceptId": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "display": "valor-ejemplo",
      "ordinal": 1,
      "isDefault": false,
      "enabled": true,
      "metadataJson": {}
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EnumVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EnumVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EnumVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EnumVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<EnumVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EnumVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EnumVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EnumVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EnumVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EnumVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EnumVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "optionIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `optionIds` | Sí | `array<string>` | formato `uuid` | Valor de option ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: TERMINOLOGY_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Enumeración no encontrada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La enumeración está retirada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 422 | `PRECONDITION_FAILED` | Sólo una opción puede ser la de por defecto | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 422 | `PRECONDITION_FAILED` | La opción por defecto no puede estar deshabilitada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 422 | `PRECONDITION_FAILED` | El código de opción está repetido | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 422 | `PRECONDITION_FAILED` | El concepto está repetido en las opciones | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/system-context/dynamic-enums/definitions/{defId}/versions"
}
```

---

## 12. POST /system-context/dynamic-enums/definitions/{defId}/versions/{version}/publish

- **Módulo:** `system_context`
- **Etiqueta OpenAPI:** `system-context`
- **Nombre:** Publicar la versión e invalidar la caché
- **Operation ID:** `SystemContextController_publishEnumVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SystemContextController.publishEnumVersion](../../src/modules/system_context/controllers/system-context.controller.ts)

### Descripción de negocio

La versión anterior queda superseded en la misma transacción.


### Descripción del sistema

NestJS resuelve `POST /system-context/dynamic-enums/definitions/{defId}/versions/{version}/publish` en `SystemContextController_publishEnumVersion`. El controlador delega en `DynamicEnumsService.publishVersion`. No recibe body. El tipo de retorno estático es `Promise<PublishEnumVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `defId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `version` | path | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /system-context/dynamic-enums/definitions/00000000-0000-4000-8000-000000000001/versions/1/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `TERMINOLOGY_ENGINEER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `defId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /system-context/dynamic-enums/definitions/00000000-0000-4000-8000-000000000001/versions/1/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublishEnumVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PublishEnumVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PublishEnumVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PublishEnumVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PublishEnumVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PublishEnumVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PublishEnumVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PublishEnumVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PublishEnumVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublishEnumVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "cacheToken": "valor-ejemplo",
  "supersededVersionId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `cacheToken` | Sí | `string` | Sin restricción adicional declarada | Token nuevo; invalida la caché de la definición | `valor-ejemplo` |
| `supersededVersionId` | No | `string` | formato `uuid` | Versión que queda superseded | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: TERMINOLOGY_ENGINEER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Enumeración no encontrada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 404 | `NOT_FOUND` | Versión de la enumeración no encontrada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 422 | `PRECONDITION_FAILED` | La enumeración está retirada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión no está en borrador | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión no tiene ninguna opción habilitada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/system-context/dynamic-enums/definitions/{defId}/versions/{version}/publish"
}
```

---

## 13. POST /system-context/dynamic-enums/resolve

- **Módulo:** `system_context`
- **Etiqueta OpenAPI:** `system-context`
- **Nombre:** Resolver y validar un valor de enumeración antes de escribirlo
- **Operation ID:** `SystemContextController_resolveEnumValue`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [SystemContextController.resolveEnumValue](../../src/modules/system_context/controllers/system-context.controller.ts)

### Descripción de negocio

En modo estricto se rechaza lo que no pertenece; en permisivo se usa la reserva.


### Descripción del sistema

NestJS resuelve `POST /system-context/dynamic-enums/resolve` en `SystemContextController_resolveEnumValue`. El controlador delega en `DynamicEnumsService.resolveValue`. Valida el body como `ResolveEnumValueDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResolveEnumValueResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ResolveEnumValueDto`; los campos opcionales se omiten.

```http
POST /system-context/dynamic-enums/resolve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetSchemaName": "Nombre de ejemplo",
  "targetEntityName": "Nombre de ejemplo",
  "targetFieldName": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `WRITE_SERVICE`, `MODULE_OWNER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `targetSchemaName` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `targetEntityName` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `targetFieldName` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `conceptId` | No | `string` | formato `uuid` | Valor propuesto, por concepto | `00000000-0000-4000-8000-000000000001` |
| `code` | No | `string` | longitud máxima 100 | Valor propuesto, por código de la opción | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /system-context/dynamic-enums/resolve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetSchemaName": "Nombre de ejemplo",
  "targetEntityName": "Nombre de ejemplo",
  "targetFieldName": "Nombre de ejemplo",
  "conceptId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ResolveEnumValueResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResolveEnumValueResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResolveEnumValueResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResolveEnumValueResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResolveEnumValueResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResolveEnumValueResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResolveEnumValueResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResolveEnumValueResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResolveEnumValueResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResolveEnumValueResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "accepted": true,
  "resolvedConceptId": "00000000-0000-4000-8000-000000000001",
  "resolvedCode": "CODIGO_EJEMPLO",
  "usedFallback": true,
  "validationModeConceptId": "00000000-0000-4000-8000-000000000001",
  "cacheToken": "valor-ejemplo",
  "rejectionReason": "Texto descriptivo de ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `accepted` | Sí | `boolean` | Sin restricción adicional declarada | true si el valor puede escribirse | `true` |
| `resolvedConceptId` | No | `string` | formato `uuid` | Concepto resuelto que debe persistirse | `00000000-0000-4000-8000-000000000001` |
| `resolvedCode` | No | `string` | Sin restricción adicional declarada | Código de la opción resuelta | `CODIGO_EJEMPLO` |
| `usedFallback` | Sí | `boolean` | Sin restricción adicional declarada | true si se cayó al concepto de reserva del binding | `true` |
| `validationModeConceptId` | Sí | `string` | formato `uuid` | Modo con el que se evaluó | `00000000-0000-4000-8000-000000000001` |
| `cacheToken` | Sí | `string` | Sin restricción adicional declarada | Token de la versión resuelta; identifica la caché | `valor-ejemplo` |
| `rejectionReason` | No | `string` | Sin restricción adicional declarada | Por qué se rechazó | `Texto descriptivo de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: WRITE_SERVICE, MODULE_OWNER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El campo no tiene enumeración vinculada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La enumeración no tiene versión publicada | Excepción explícita en src/modules/system_context/services/dynamic-enums.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/system-context/dynamic-enums/resolve"
}
```

---

