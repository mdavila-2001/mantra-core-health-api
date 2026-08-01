<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `health_context`

Referencia exhaustiva de 13 operación(es) del módulo `health_context`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `health-context`
- **Controladores:** `HealthContextController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /health-context/agents](#1-post-health-context-agents) — Registrar un agente recolector gobernado
2. [POST /health-context/collection-runs](#2-post-health-context-collection-runs) — Disparar una corrida de recolección
3. [POST /health-context/collection-runs/{id}/finish](#3-post-health-context-collection-runs-id-finish) — Cerrar la corrida conciliando sus contadores
4. [POST /health-context/collection-runs/{id}/observations](#4-post-health-context-collection-runs-id-observations) — Registrar una observación inmutable de fuente
5. [POST /health-context/contexts](#5-post-health-context-contexts) — Crear el contexto de salud de un país
6. [POST /health-context/contexts/{id}/versions](#6-post-health-context-contexts-id-versions) — Materializar una versión borrador con hechos y evidencia
7. [GET /health-context/contexts/resolve](#7-get-health-context-contexts-resolve) — Resolver el contexto vigente para consumo
8. [POST /health-context/internal/schedules/run-due](#8-post-health-context-internal-schedules-run-due) — Evaluar programaciones vencidas y encolar sus corridas
9. [POST /health-context/schedules](#9-post-health-context-schedules) — Programar la recolección de contexto de un país
10. [POST /health-context/sources](#10-post-health-context-sources) — Registrar una fuente de contexto de salud
11. [POST /health-context/versions/{id}/publish](#11-post-health-context-versions-id-publish) — Publicar la versión aprobada y avanzar el contexto
12. [POST /health-context/versions/{id}/quality-reviews](#12-post-health-context-versions-id-quality-reviews) — Revisar la calidad de la versión
13. [POST /health-context/versions/{id}/supersede](#13-post-health-context-versions-id-supersede) — Retirar la versión vigente, con reemplazo o por caducidad

---

## 1. POST /health-context/agents

- **Módulo:** `health_context`
- **Etiqueta OpenAPI:** `health-context`
- **Nombre:** Registrar un agente recolector gobernado
- **Operation ID:** `HealthContextController_createAgent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthContextController.createAgent](../../src/modules/health_context/controllers/health-context.controller.ts)

### Descripción de negocio

Registrar un agente recolector gobernado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /health-context/agents` en `HealthContextController_createAgent`. El controlador delega en `ContextCollectionService.createAgent`. Valida el body como `CreateAgentDto` y consume `application/json`. El tipo de retorno estático es `Promise<AgentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAgentDto`; los campos opcionales se omiten.

```http
POST /health-context/agents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "agentTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SOURCE_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Código único del agente | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `agentTypeConceptId` | Sí | `string` | formato `uuid` | Naturaleza del agente (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `providerId` | No | `string` | formato `uuid` | Proveedor externo que lo opera | `00000000-0000-4000-8000-000000000001` |
| `implementationRef` | No | `string` | longitud máxima 500 | Referencia a la implementación | `valor-ejemplo` |
| `ownerTenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-context/agents HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "agentTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "providerId": "00000000-0000-4000-8000-000000000001",
  "implementationRef": "valor-ejemplo",
  "ownerTenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AgentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AgentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AgentResponseDto`. Ejemplo completo derivado de ese DTO:

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
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SOURCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un agente con ese código | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
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
  "path": "/health-context/agents"
}
```

---

## 2. POST /health-context/collection-runs

- **Módulo:** `health_context`
- **Etiqueta OpenAPI:** `health-context`
- **Nombre:** Disparar una corrida de recolección
- **Operation ID:** `HealthContextController_startCollectionRun`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthContextController.startCollectionRun](../../src/modules/health_context/controllers/health-context.controller.ts)

### Descripción de negocio

Idempotente por clave: el mismo disparo no se ejecuta dos veces.


### Descripción del sistema

NestJS resuelve `POST /health-context/collection-runs` en `HealthContextController_startCollectionRun`. El controlador delega en `ContextCollectionService.startCollectionRun`. Valida el body como `StartCollectionRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<CollectionRunResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `StartCollectionRunDto`; los campos opcionales se omiten.

```http
POST /health-context/collection-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "idempotencyKey": "valor-ejemplo",
  "trigger": "SCHEDULED"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `CONTEXT_CURATOR`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `idempotencyKey` | Sí | `string` | longitud máxima 200 | Clave de idempotencia de la corrida | `valor-ejemplo` |
| `trigger` | Sí | `string` | valores: `SCHEDULED`, `MANUAL` | Sin descripción específica en el contrato OpenAPI. | `SCHEDULED` |
| `scheduleId` | No | `string` | formato `uuid` | Programación que la dispara | `00000000-0000-4000-8000-000000000001` |
| `agentId` | No | `string` | formato `uuid` | Agente; por defecto, el de la programación | `00000000-0000-4000-8000-000000000001` |
| `countryConceptId` | No | `string` | formato `uuid` | País; por defecto, el de la programación | `00000000-0000-4000-8000-000000000001` |
| `nextRunAt` | No | `string` | formato `date-time` | Próxima ejecución recalculada | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-context/collection-runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "idempotencyKey": "valor-ejemplo",
  "trigger": "SCHEDULED",
  "scheduleId": "00000000-0000-4000-8000-000000000001",
  "agentId": "00000000-0000-4000-8000-000000000001",
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "nextRunAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CollectionRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CollectionRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CollectionRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CollectionRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CollectionRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CollectionRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CollectionRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CollectionRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CollectionRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CollectionRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si la clave ya se había usado y se devuelve la corrida previa | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, CONTEXT_CURATOR, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Programación no encontrada | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
| 404 | `NOT_FOUND` | Agente no encontrado | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La programación no está activa | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
| 422 | `PRECONDITION_FAILED` | La corrida necesita agente y país, o una programación de la que salgan | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
| 422 | `PRECONDITION_FAILED` | El agente no está activo | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-context/collection-runs"
}
```

---

## 3. POST /health-context/collection-runs/{id}/finish

- **Módulo:** `health_context`
- **Etiqueta OpenAPI:** `health-context`
- **Nombre:** Cerrar la corrida conciliando sus contadores
- **Operation ID:** `HealthContextController_finishCollectionRun`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthContextController.finishCollectionRun](../../src/modules/health_context/controllers/health-context.controller.ts)

### Descripción de negocio

Los contadores se recuentan contra las observaciones registradas.


### Descripción del sistema

NestJS resuelve `POST /health-context/collection-runs/{id}/finish` en `HealthContextController_finishCollectionRun`. El controlador delega en `ContextCollectionService.finishCollectionRun`. Valida el body como `FinishCollectionRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<FinishRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `FinishCollectionRunDto`; los campos opcionales se omiten.

```http
POST /health-context/collection-runs/00000000-0000-4000-8000-000000000001/finish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "outcome": "SUCCEEDED"
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
| `outcome` | Sí | `string` | valores: `SUCCEEDED`, `PARTIAL`, `FAILED` | Sin descripción específica en el contrato OpenAPI. | `SUCCEEDED` |
| `continuationCursorJson` | No | `object` | Sin restricción adicional declarada | Cursor para continuar donde se quedó | `{}` |
| `errorSummary` | No | `string` | Sin restricción adicional declarada | Qué salió mal; obligatorio si la corrida falla | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-context/collection-runs/00000000-0000-4000-8000-000000000001/finish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "outcome": "SUCCEEDED",
  "continuationCursorJson": {},
  "errorSummary": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<FinishRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FinishRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FinishRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FinishRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<FinishRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FinishRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FinishRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FinishRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FinishRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FinishRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FinishRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "observationsRead": "valor-ejemplo",
  "observationsAccepted": "valor-ejemplo",
  "observationsRejected": "valor-ejemplo",
  "sourceCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `observationsRead` | Sí | `string` | Sin restricción adicional declarada | Observaciones leídas, conciliadas contra la tabla | `valor-ejemplo` |
| `observationsAccepted` | Sí | `string` | Sin restricción adicional declarada | Valor de observations accepted mantenido por la instancia. | `valor-ejemplo` |
| `observationsRejected` | Sí | `string` | Sin restricción adicional declarada | Valor de observations rejected mantenido por la instancia. | `valor-ejemplo` |
| `sourceCount` | Sí | `number` | Sin restricción adicional declarada | Fuentes distintas que aportaron observaciones | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Corrida no encontrada | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
| 409 | `CONFLICT` | La corrida ya está cerrada | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una corrida fallida debe declarar qué salió mal | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-context/collection-runs/{id}/finish"
}
```

---

## 4. POST /health-context/collection-runs/{id}/observations

- **Módulo:** `health_context`
- **Etiqueta OpenAPI:** `health-context`
- **Nombre:** Registrar una observación inmutable de fuente
- **Operation ID:** `HealthContextController_recordObservation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthContextController.recordObservation](../../src/modules/health_context/controllers/health-context.controller.ts)

### Descripción de negocio

Sólo agregado de país; se deduplica por hash dentro de la corrida.


### Descripción del sistema

NestJS resuelve `POST /health-context/collection-runs/{id}/observations` en `HealthContextController_recordObservation`. El controlador delega en `ContextCollectionService.recordObservation`. Valida el body como `RecordObservationDto` y consume `application/json`. El tipo de retorno estático es `Promise<ObservationResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordObservationDto`; los campos opcionales se omiten.

```http
POST /health-context/collection-runs/00000000-0000-4000-8000-000000000001/observations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceId": "00000000-0000-4000-8000-000000000001",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "status": "ACCEPTED"
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
| `sourceId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `contentHash` | Sí | `string` | longitud máxima 200 | Hash del contenido recogido; permite deduplicar | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `status` | Sí | `string` | valores: `ACCEPTED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `ACCEPTED` |
| `sourceLocator` | No | `string` | Sin restricción adicional declarada | Dónde se encontró el dato | `valor-ejemplo` |
| `publishedAt` | No | `string` | formato `date-time` | Cuándo lo publicó la fuente | `2026-07-31T12:00:00.000Z` |
| `retrievedAt` | No | `string` | formato `date-time` | Cuándo se recogió; por defecto, ahora | `2026-07-31T12:00:00.000Z` |
| `mediaType` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rawPayloadFileId` | No | `string` | formato `uuid` | Archivo con el payload crudo | `00000000-0000-4000-8000-000000000001` |
| `extractedPayloadJson` | No | `object` | Sin restricción adicional declarada | Datos extraídos. Sólo agregado de país: nunca datos de paciente. | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-context/collection-runs/00000000-0000-4000-8000-000000000001/observations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceId": "00000000-0000-4000-8000-000000000001",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "status": "ACCEPTED",
  "sourceLocator": "valor-ejemplo",
  "publishedAt": "2026-07-31T12:00:00.000Z",
  "retrievedAt": "2026-07-31T12:00:00.000Z",
  "mediaType": "valor-ejemplo",
  "rawPayloadFileId": "00000000-0000-4000-8000-000000000001",
  "extractedPayloadJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ObservationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ObservationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ObservationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si ya se había recogido el mismo contenido en la corrida | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Corrida no encontrada | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
| 404 | `NOT_FOUND` | Fuente no encontrada | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La corrida ya no está en curso | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
| 422 | `PRECONDITION_FAILED` | La fuente no está activa | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-context/collection-runs/{id}/observations"
}
```

---

## 5. POST /health-context/contexts

- **Módulo:** `health_context`
- **Etiqueta OpenAPI:** `health-context`
- **Nombre:** Crear el contexto de salud de un país
- **Operation ID:** `HealthContextController_createContext`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthContextController.createContext](../../src/modules/health_context/controllers/health-context.controller.ts)

### Descripción de negocio

Nace en borrador: la versión vigente llega al publicar.


### Descripción del sistema

NestJS resuelve `POST /health-context/contexts` en `HealthContextController_createContext`. El controlador delega en `CountryContextService.createContext`. Valida el body como `CreateContextDto` y consume `application/json`. El tipo de retorno estático es `Promise<ContextResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateContextDto`; los campos opcionales se omiten.

```http
POST /health-context/contexts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "contextDomainConceptId": "00000000-0000-4000-8000-000000000001",
  "contextKey": "valor-ejemplo",
  "title": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CONTEXT_CURATOR`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `countryConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `contextDomainConceptId` | Sí | `string` | formato `uuid` | Dominio del contexto (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `contextKey` | Sí | `string` | longitud máxima 200 | Clave del contexto dentro del dominio | `valor-ejemplo` |
| `title` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-context/contexts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "contextDomainConceptId": "00000000-0000-4000-8000-000000000001",
  "contextKey": "valor-ejemplo",
  "title": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ContextResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ContextResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ContextResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ContextResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ContextResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ContextResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ContextResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ContextResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ContextResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ContextResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "contextKey": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `contextKey` | Sí | `string` | Sin restricción adicional declarada | Valor de context key mantenido por la instancia. | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | El contexto nace en borrador, sin versión vigente | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CONTEXT_CURATOR, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe ese contexto para el país y el dominio | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
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
  "path": "/health-context/contexts"
}
```

---

## 6. POST /health-context/contexts/{id}/versions

- **Módulo:** `health_context`
- **Etiqueta OpenAPI:** `health-context`
- **Nombre:** Materializar una versión borrador con hechos y evidencia
- **Operation ID:** `HealthContextController_draftContextVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthContextController.draftContextVersion](../../src/modules/health_context/controllers/health-context.controller.ts)

### Descripción de negocio

Un hecho sin evidencia de la misma corrida se rechaza.


### Descripción del sistema

NestJS resuelve `POST /health-context/contexts/{id}/versions` en `HealthContextController_draftContextVersion`. El controlador delega en `CountryContextService.draftVersion`. Valida el body como `DraftContextVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ContextVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DraftContextVersionDto`; los campos opcionales se omiten.

```http
POST /health-context/contexts/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "collectionRunId": "00000000-0000-4000-8000-000000000001",
  "contextPayloadJson": {},
  "facts": [
    {
      "factKey": "valor-ejemplo",
      "valueType": "valor-ejemplo",
      "valueJson": {},
      "evidence": [
        {
          "sourceObservationId": "00000000-0000-4000-8000-000000000001"
        }
      ]
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `CONTEXT_CURATOR`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `collectionRunId` | Sí | `string` | formato `uuid` | Corrida de la que salen las observaciones | `00000000-0000-4000-8000-000000000001` |
| `schemaVersion` | No | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `summary` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `contextPayloadJson` | Sí | `object` | Sin restricción adicional declarada | Contenido del contexto en esta versión | `{}` |
| `observedAt` | No | `string` | formato `date-time` | A qué momento corresponde lo observado | `2026-07-31T12:00:00.000Z` |
| `expiresAt` | No | `string` | formato `date-time` | Cuándo caduca la vigencia | `2026-07-31T12:00:00.000Z` |
| `confidenceScore` | No | `string` | Sin restricción adicional declarada | Confianza global, como cadena decimal | `valor-ejemplo` |
| `facts` | Sí | `array<ContextFactDto>` | mínimo 1 elemento(s) | Hechos con su evidencia | `[{"factKey":"valor-ejemplo","valueType":"valor-ejemplo","valueJson":{},"metricConceptId":"00000000-0000-4000-8000-000000000001","unitConceptId":"00000000-0000-4000-8000-000000000001","periodStart":"2026-07-31T12:00:00.000Z","periodEnd":"2026-07-31T12:00:00.000Z","confidenceScore":"valor-ejemplo","evidence":[{"sourceObservationId":"00000000-0000-4000-8000-000000000001","evidenceLocatorJson":{},"relevanceScore":"valor-ejemplo","evidenceHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]}]` |
| `facts[].factKey` | Sí | `string` | longitud máxima 200 | Clave del hecho dentro de la versión | `valor-ejemplo` |
| `facts[].valueType` | Sí | `string` | longitud máxima 50 | Tipo técnico del valor | `valor-ejemplo` |
| `facts[].valueJson` | Sí | `object` | Sin restricción adicional declarada | Valor del hecho | `{}` |
| `facts[].metricConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `facts[].unitConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `facts[].periodStart` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `facts[].periodEnd` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `facts[].confidenceScore` | No | `string` | Sin restricción adicional declarada | Confianza, como cadena decimal | `valor-ejemplo` |
| `facts[].evidence` | Sí | `array<FactEvidenceDto>` | mínimo 1 elemento(s) | Un hecho sin evidencia retenida no se acepta | `[{"sourceObservationId":"00000000-0000-4000-8000-000000000001","evidenceLocatorJson":{},"relevanceScore":"valor-ejemplo","evidenceHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]` |
| `facts[].evidence[].sourceObservationId` | Sí | `string` | formato `uuid` | Observación que respalda el hecho | `00000000-0000-4000-8000-000000000001` |
| `facts[].evidence[].evidenceLocatorJson` | No | `object` | Sin restricción adicional declarada | Dónde dentro de la observación está la evidencia | `{}` |
| `facts[].evidence[].relevanceScore` | No | `string` | Sin restricción adicional declarada | Relevancia, como cadena decimal | `valor-ejemplo` |
| `facts[].evidence[].evidenceHash` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-context/contexts/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "collectionRunId": "00000000-0000-4000-8000-000000000001",
  "schemaVersion": "valor-ejemplo",
  "summary": "valor-ejemplo",
  "contextPayloadJson": {},
  "observedAt": "2026-07-31T12:00:00.000Z",
  "expiresAt": "2026-07-31T12:00:00.000Z",
  "confidenceScore": "valor-ejemplo",
  "facts": [
    {
      "factKey": "valor-ejemplo",
      "valueType": "valor-ejemplo",
      "valueJson": {},
      "metricConceptId": "00000000-0000-4000-8000-000000000001",
      "unitConceptId": "00000000-0000-4000-8000-000000000001",
      "periodStart": "2026-07-31T12:00:00.000Z",
      "periodEnd": "2026-07-31T12:00:00.000Z",
      "confidenceScore": "valor-ejemplo",
      "evidence": [
        {
          "sourceObservationId": "00000000-0000-4000-8000-000000000001",
          "evidenceLocatorJson": {},
          "relevanceScore": "valor-ejemplo",
          "evidenceHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        }
      ]
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ContextVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ContextVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ContextVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ContextVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ContextVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ContextVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ContextVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ContextVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ContextVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ContextVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ContextVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "factIds": [
    "valor-ejemplo"
  ],
  "evidenceCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `contentHash` | Sí | `string` | Sin restricción adicional declarada | Valor de content hash mantenido por la instancia. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `factIds` | Sí | `array<string>` | formato `uuid` | Valor de fact ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `evidenceCount` | Sí | `number` | Sin restricción adicional declarada | Enlaces hecho → observación creados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, CONTEXT_CURATOR, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contexto no encontrado | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 404 | `NOT_FOUND` | Corrida no encontrada | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La corrida no está en un estado del que se pueda versionar | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 422 | `PRECONDITION_FAILED` | La corrida es de otro país | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 422 | `PRECONDITION_FAILED` | La evidencia debe apuntar a una observación aceptada de la misma corrida | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 422 | `PRECONDITION_FAILED` | La clave del hecho está repetida en la versión | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-context/contexts/{id}/versions"
}
```

---

## 7. GET /health-context/contexts/resolve

- **Módulo:** `health_context`
- **Etiqueta OpenAPI:** `health-context`
- **Nombre:** Resolver el contexto vigente para consumo
- **Operation ID:** `HealthContextController_resolveContext`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthContextController.resolveContext](../../src/modules/health_context/controllers/health-context.controller.ts)

### Descripción de negocio

Una versión caducada se devuelve marcada como obsoleta, no se oculta.


### Descripción del sistema

NestJS resuelve `GET /health-context/contexts/resolve` en `HealthContextController_resolveContext`. El controlador delega en `CountryContextService.resolveContext`. No recibe body. El tipo de retorno estático es `Promise<ResolvedContextResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `country` | query | Sí | `string` | formato `uuid` | Concepto de país | `00000000-0000-4000-8000-000000000001` |
| `domain` | query | Sí | `string` | formato `uuid` | Concepto de dominio del contexto | `00000000-0000-4000-8000-000000000001` |
| `key` | query | Sí | `string` | Sin restricción adicional declarada | Clave del contexto dentro del dominio | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /health-context/contexts/resolve?country=00000000-0000-4000-8000-000000000001&domain=00000000-0000-4000-8000-000000000001&key=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CONTEXT_CONSUMER`, `CONTEXT_CURATOR`, `SYSTEM`, `PLATFORM_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /health-context/contexts/resolve?country=00000000-0000-4000-8000-000000000001&domain=00000000-0000-4000-8000-000000000001&key=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ResolvedContextResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ResolvedContextResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ResolvedContextResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ResolvedContextResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ResolvedContextResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ResolvedContextResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResolvedContextResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "contextId": "00000000-0000-4000-8000-000000000001",
  "versionId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "contextPayloadJson": {
    "clave": "valor"
  },
  "observedAt": "2026-07-31T12:00:00.000Z",
  "expiresAt": "2026-07-31T12:00:00.000Z",
  "stale": true,
  "facts": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "factKey": "valor-ejemplo",
      "valueType": "valor-ejemplo",
      "valueJson": {
        "clave": "valor"
      },
      "metricConceptId": "00000000-0000-4000-8000-000000000001",
      "unitConceptId": "00000000-0000-4000-8000-000000000001",
      "confidenceScore": "valor-ejemplo",
      "evidenceObservationIds": [
        "valor-ejemplo"
      ]
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `contextId` | Sí | `string` | formato `uuid` | Identificador asociado a context. | `00000000-0000-4000-8000-000000000001` |
| `versionId` | Sí | `string` | formato `uuid` | Identificador asociado a version. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `contextPayloadJson` | Sí | `object` | Sin restricción adicional declarada | Contenido de la versión vigente | `{"clave":"valor"}` |
| `observedAt` | No | `string` | formato `date-time` | Valor de observed at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `expiresAt` | No | `string` | formato `date-time` | Valor de expires at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `stale` | Sí | `boolean` | Sin restricción adicional declarada | true si la versión vigente ya caducó | `true` |
| `facts` | Sí | `array<ResolvedFactDto>` | Sin restricción adicional declarada | Valor de facts mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","factKey":"valor-ejemplo","valueType":"valor-ejemplo","valueJson":{"clave":"valor"},"metricConceptId":"00000000-0000-4000-8000-000000000001","unitConceptId":"00000000-0000-4000-8000-000000000001","confidenceScore":"valor-ejemplo","evidenceObservationIds":["valor-ejemplo"]}]` |
| `facts[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `facts[].factKey` | Sí | `string` | Sin restricción adicional declarada | Valor de fact key mantenido por la instancia. | `valor-ejemplo` |
| `facts[].valueType` | Sí | `string` | Sin restricción adicional declarada | Valor de value type mantenido por la instancia. | `valor-ejemplo` |
| `facts[].valueJson` | Sí | `object` | Sin restricción adicional declarada | Valor del hecho | `{"clave":"valor"}` |
| `facts[].metricConceptId` | No | `string` | formato `uuid` | Identificador asociado a metric concept. | `00000000-0000-4000-8000-000000000001` |
| `facts[].unitConceptId` | No | `string` | formato `uuid` | Identificador asociado a unit concept. | `00000000-0000-4000-8000-000000000001` |
| `facts[].confidenceScore` | No | `string` | Sin restricción adicional declarada | Valor de confidence score mantenido por la instancia. | `valor-ejemplo` |
| `facts[].evidenceObservationIds` | Sí | `array<string>` | formato `uuid` | Observaciones que respaldan el hecho | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CONTEXT_CONSUMER, CONTEXT_CURATOR, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Contexto no encontrado | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 404 | `NOT_FOUND` | La versión vigente no existe | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 422 | `PRECONDITION_FAILED` | El contexto no tiene versión vigente | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión vigente no está publicada | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-context/contexts/resolve"
}
```

---

## 8. POST /health-context/internal/schedules/run-due

- **Módulo:** `health_context`
- **Etiqueta OpenAPI:** `health-context`
- **Nombre:** Evaluar programaciones vencidas y encolar sus corridas
- **Operation ID:** `HealthContextController_runDueSchedules`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthContextController.runDueSchedules](../../src/modules/health_context/controllers/health-context.controller.ts)

### Descripción de negocio

Toma el lote con SKIP LOCKED; avanza next_run_at siempre.

Contexto declarado en el controlador: Fase 2 del plan de corrección de workers: cierra el "Pendiente" del README sobre la resolución de la expresión cron, que hoy no evaluaba ningún proceso. Lo llama el worker en bucle, no la UI.

### Descripción del sistema

NestJS resuelve `POST /health-context/internal/schedules/run-due` en `HealthContextController_runDueSchedules`. El controlador delega en `ContextCollectionService.runDueSchedules`. Valida el body como `RunDueSchedulesDto` y consume `application/json`. El tipo de retorno estático es `Promise<RunDueSchedulesResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RunDueSchedulesDto`; los campos opcionales se omiten.

```http
POST /health-context/internal/schedules/run-due HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `limit` | No | `number` | mínimo 1; máximo 100 | Tamaño máximo del lote de programaciones a evaluar | `20` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-context/internal/schedules/run-due HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "limit": 20
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RunDueSchedulesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RunDueSchedulesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "claimed": 1,
  "queued": 1,
  "skipped": 1,
  "results": [
    {
      "scheduleId": "00000000-0000-4000-8000-000000000001",
      "runId": "00000000-0000-4000-8000-000000000001",
      "runNumber": "valor-ejemplo",
      "nextRunAt": "2026-07-31T12:00:00.000Z",
      "skippedReason": "Texto descriptivo de ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `claimed` | Sí | `number` | Sin restricción adicional declarada | Programaciones vencidas reclamadas en este lote | `1` |
| `queued` | Sí | `number` | Sin restricción adicional declarada | Corridas efectivamente encoladas | `1` |
| `skipped` | Sí | `number` | Sin restricción adicional declarada | Programaciones vencidas que no llegaron a encolar corrida | `1` |
| `results` | Sí | `array<DueScheduleRunResultDto>` | Sin restricción adicional declarada | Valor de results mantenido por la instancia. | `[{"scheduleId":"00000000-0000-4000-8000-000000000001","runId":"00000000-0000-4000-8000-000000000001","runNumber":"valor-ejemplo","nextRunAt":"2026-07-31T12:00:00.000Z","skippedReason":"Texto descriptivo de ejemplo"}]` |
| `results[].scheduleId` | Sí | `string` | formato `uuid` | Identificador asociado a schedule. | `00000000-0000-4000-8000-000000000001` |
| `results[].runId` | No | `string` | formato `uuid` | Corrida encolada, si la programación pudo dispararse | `00000000-0000-4000-8000-000000000001` |
| `results[].runNumber` | No | `string` | Sin restricción adicional declarada | Número de la corrida encolada | `valor-ejemplo` |
| `results[].nextRunAt` | No | `string` | formato `date-time` | Próxima marca calculada a partir del cron de la programación | `2026-07-31T12:00:00.000Z` |
| `results[].skippedReason` | No | `string` | Sin restricción adicional declarada | Motivo por el que esta marca no llegó a encolar una corrida | `Texto descriptivo de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
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
  "path": "/health-context/internal/schedules/run-due"
}
```

---

## 9. POST /health-context/schedules

- **Módulo:** `health_context`
- **Etiqueta OpenAPI:** `health-context`
- **Nombre:** Programar la recolección de contexto de un país
- **Operation ID:** `HealthContextController_createSchedule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthContextController.createSchedule](../../src/modules/health_context/controllers/health-context.controller.ts)

### Descripción de negocio

Programar la recolección de contexto de un país. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /health-context/schedules` en `HealthContextController_createSchedule`. El controlador delega en `ContextCollectionService.createSchedule`. Valida el body como `HealthContextCreateScheduleDto` y consume `application/json`. El tipo de retorno estático es `Promise<ScheduleResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `HealthContextCreateScheduleDto`; los campos opcionales se omiten.

```http
POST /health-context/schedules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "agentId": "00000000-0000-4000-8000-000000000001",
  "scheduleExpression": "0 3 * * *"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CONTEXT_CURATOR`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `countryConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `agentId` | Sí | `string` | formato `uuid` | Agente que ejecuta la recolección | `00000000-0000-4000-8000-000000000001` |
| `scheduleExpression` | Sí | `string` | Sin restricción adicional declarada | Expresión cron de cinco campos | `0 3 * * *` |
| `timezoneConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lookbackDays` | No | `number` | mínimo 0 | Días hacia atrás que revisa cada corrida | `1` |
| `freshnessTtlSeconds` | No | `number` | mínimo 60 | Segundos que el contexto se considera fresco | `60` |
| `nextRunAt` | No | `string` | formato `date-time` | Primera ejecución prevista | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-context/schedules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "agentId": "00000000-0000-4000-8000-000000000001",
  "scheduleExpression": "0 3 * * *",
  "timezoneConceptId": "00000000-0000-4000-8000-000000000001",
  "lookbackDays": 1,
  "freshnessTtlSeconds": 60,
  "nextRunAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ScheduleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ScheduleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "nextRunAt": "2026-07-31T12:00:00.000Z",
  "stateConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `nextRunAt` | Sí | `string` | formato `date-time` | Valor de next run at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CONTEXT_CURATOR, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Agente no encontrado | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El agente no está activo | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
| 422 | `PRECONDITION_FAILED` | La expresión de programación debe tener cinco campos | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-context/schedules"
}
```

---

## 10. POST /health-context/sources

- **Módulo:** `health_context`
- **Etiqueta OpenAPI:** `health-context`
- **Nombre:** Registrar una fuente de contexto de salud
- **Operation ID:** `HealthContextController_createSource`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthContextController.createSource](../../src/modules/health_context/controllers/health-context.controller.ts)

### Descripción de negocio

El nivel de confianza gobierna qué observaciones se aceptan.


### Descripción del sistema

NestJS resuelve `POST /health-context/sources` en `HealthContextController_createSource`. El controlador delega en `ContextCollectionService.createSource`. Valida el body como `CreateSourceDto` y consume `application/json`. El tipo de retorno estático es `Promise<SourceResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateSourceDto`; los campos opcionales se omiten.

```http
POST /health-context/sources HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "sourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "trustTierConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SOURCE_ADMIN`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | longitud máxima 100 | Código único de la fuente | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `sourceTypeConceptId` | Sí | `string` | formato `uuid` | Naturaleza de la fuente (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `trustTierConceptId` | Sí | `string` | formato `uuid` | Nivel de confianza; gobierna qué observaciones se aceptan | `00000000-0000-4000-8000-000000000001` |
| `ownerName` | No | `string` | longitud máxima 200 | Quién publica la fuente | `Nombre de ejemplo` |
| `canonicalUrl` | No | `string` | Sin restricción adicional declarada | URL canónica de la fuente | `valor-ejemplo` |
| `countryConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `licenseText` | No | `string` | Sin restricción adicional declarada | Licencia bajo la que se puede usar el dato | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-context/sources HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "sourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "trustTierConceptId": "00000000-0000-4000-8000-000000000001",
  "ownerName": "Nombre de ejemplo",
  "canonicalUrl": "valor-ejemplo",
  "countryConceptId": "00000000-0000-4000-8000-000000000001",
  "licenseText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SourceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SourceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SourceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SourceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SourceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SourceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SourceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SourceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SourceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SourceResponseDto`. Ejemplo completo derivado de ese DTO:

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
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SOURCE_ADMIN, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una fuente con ese código | Excepción explícita en src/modules/health_context/services/context-collection.service.ts |
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
  "path": "/health-context/sources"
}
```

---

## 11. POST /health-context/versions/{id}/publish

- **Módulo:** `health_context`
- **Etiqueta OpenAPI:** `health-context`
- **Nombre:** Publicar la versión aprobada y avanzar el contexto
- **Operation ID:** `HealthContextController_publishVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthContextController.publishVersion](../../src/modules/health_context/controllers/health-context.controller.ts)

### Descripción de negocio

Sólo puede haber una versión publicada por contexto.


### Descripción del sistema

NestJS resuelve `POST /health-context/versions/{id}/publish` en `HealthContextController_publishVersion`. El controlador delega en `CountryContextService.publishVersion`. No recibe body. El tipo de retorno estático es `Promise<PublishVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /health-context/versions/00000000-0000-4000-8000-000000000001/publish HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CONTEXT_CURATOR`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /health-context/versions/00000000-0000-4000-8000-000000000001/publish HTTP/1.1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CONTEXT_CURATOR, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión no encontrada | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 404 | `NOT_FOUND` | Contexto no encontrado | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 422 | `PRECONDITION_FAILED` | Sólo se publica una versión aprobada en revisión de calidad | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-context/versions/{id}/publish"
}
```

---

## 12. POST /health-context/versions/{id}/quality-reviews

- **Módulo:** `health_context`
- **Etiqueta OpenAPI:** `health-context`
- **Nombre:** Revisar la calidad de la versión
- **Operation ID:** `HealthContextController_recordQualityReview`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthContextController.recordQualityReview](../../src/modules/health_context/controllers/health-context.controller.ts)

### Descripción de negocio

El desenlace mueve la versión a aprobada o rechazada.


### Descripción del sistema

NestJS resuelve `POST /health-context/versions/{id}/quality-reviews` en `HealthContextController_recordQualityReview`. El controlador delega en `CountryContextService.recordQualityReview`. Valida el body como `RecordQualityReviewDto` y consume `application/json`. El tipo de retorno estático es `Promise<QualityReviewResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordQualityReviewDto`; los campos opcionales se omiten.

```http
POST /health-context/versions/00000000-0000-4000-8000-000000000001/quality-reviews HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reviewTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "outcome": "APPROVED"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `QUALITY_REVIEWER`, `SYSTEM`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reviewTypeConceptId` | Sí | `string` | formato `uuid` | Tipo de revisión (catálogo abierto) | `00000000-0000-4000-8000-000000000001` |
| `outcome` | Sí | `string` | valores: `APPROVED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `reviewerAgentId` | No | `string` | formato `uuid` | Agente revisor, si la revisión es automática | `00000000-0000-4000-8000-000000000001` |
| `issuesJson` | No | `object` | Sin restricción adicional declarada | Problemas encontrados | `{}` |
| `notes` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-context/versions/00000000-0000-4000-8000-000000000001/quality-reviews HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reviewTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "outcome": "APPROVED",
  "reviewerAgentId": "00000000-0000-4000-8000-000000000001",
  "issuesJson": {},
  "notes": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<QualityReviewResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<QualityReviewResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<QualityReviewResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<QualityReviewResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<QualityReviewResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<QualityReviewResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<QualityReviewResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<QualityReviewResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<QualityReviewResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<QualityReviewResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `QualityReviewResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "contextVersionId": "00000000-0000-4000-8000-000000000001",
  "versionStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `contextVersionId` | Sí | `string` | formato `uuid` | Identificador asociado a context version. | `00000000-0000-4000-8000-000000000001` |
| `versionStatusConceptId` | Sí | `string` | formato `uuid` | Estado en el que queda la versión | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: QUALITY_REVIEWER, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión no encontrada | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La versión no está en borrador | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-context/versions/{id}/quality-reviews"
}
```

---

## 13. POST /health-context/versions/{id}/supersede

- **Módulo:** `health_context`
- **Etiqueta OpenAPI:** `health-context`
- **Nombre:** Retirar la versión vigente, con reemplazo o por caducidad
- **Operation ID:** `HealthContextController_supersedeVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [HealthContextController.supersedeVersion](../../src/modules/health_context/controllers/health-context.controller.ts)

### Descripción de negocio

Sin reemplazo el contexto queda marcado como obsoleto.


### Descripción del sistema

NestJS resuelve `POST /health-context/versions/{id}/supersede` en `HealthContextController_supersedeVersion`. El controlador delega en `CountryContextService.supersedeVersion`. Valida el body como `SupersedeVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<SupersedeVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SupersedeVersionDto`; los campos opcionales se omiten.

```http
POST /health-context/versions/00000000-0000-4000-8000-000000000001/supersede HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mode": "SUPERSEDED",
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CONTEXT_CURATOR`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `mode` | Sí | `string` | valores: `SUPERSEDED`, `EXPIRED` | `EXPIRED` retira sin reemplazo y deja el contexto obsoleto | `SUPERSEDED` |
| `reason` | Sí | `string` | Sin restricción adicional declarada | Por qué se retira | `Texto descriptivo de ejemplo` |
| `replacementVersionId` | No | `string` | formato `uuid` | Versión que la sustituye; obligatoria en modo SUPERSEDED | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /health-context/versions/00000000-0000-4000-8000-000000000001/supersede HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mode": "SUPERSEDED",
  "reason": "Texto descriptivo de ejemplo",
  "replacementVersionId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SupersedeVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SupersedeVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SupersedeVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SupersedeVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SupersedeVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SupersedeVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SupersedeVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SupersedeVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SupersedeVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SupersedeVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SupersedeVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "currentVersionId": "00000000-0000-4000-8000-000000000001",
  "contextStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Versión retirada | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `currentVersionId` | No | `string` | formato `uuid` | Versión que queda vigente | `00000000-0000-4000-8000-000000000001` |
| `contextStatusConceptId` | Sí | `string` | formato `uuid` | Estado en el que queda el contexto | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CONTEXT_CURATOR, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión no encontrada | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 404 | `NOT_FOUND` | Contexto no encontrado | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 404 | `NOT_FOUND` | Versión de reemplazo no encontrada | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sustituir exige declarar la versión que reemplaza | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión no está publicada | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 422 | `PRECONDITION_FAILED` | El reemplazo es de otro contexto | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 422 | `PRECONDITION_FAILED` | El reemplazo debe estar aprobado en revisión de calidad | Excepción explícita en src/modules/health_context/services/country-context.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health-context/versions/{id}/supersede"
}
```

---

