<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `qa_execution`

Referencia exhaustiva de 9 operación(es) del módulo `qa_execution`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `qa-execution`, `qa-execution-internal`
- **Controladores:** `QaExecutionController`, `QaExecutionInternalController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [PUT /admin/qa/environments/{environmentId}/target](#1-put-admin-qa-environments-environmentid-target) — Registrar o cambiar el destino de un entorno (cambiarlo invalida planes aprobados)
2. [GET /admin/qa/plans](#2-get-admin-qa-plans) — Planes, del más reciente al más antiguo
3. [POST /admin/qa/plans](#3-post-admin-qa-plans) — Pedir un plan (202). Queda QUEUED o PENDING_APPROVAL; lo ejecuta el worker qa_lab
4. [GET /admin/qa/plans/{planId}](#4-get-admin-qa-plans-planid) — Plan con pasos, límites, aprobaciones y bitácora ordenada
5. [POST /admin/qa/plans/{planId}/approvals](#5-post-admin-qa-plans-planid-approvals) — Aprobar o rechazar el hash vigente del plan, con vencimiento
6. [POST /admin/qa/plans/{planId}/cancel](#6-post-admin-qa-plans-planid-cancel) — Pedir la cancelación (el runner la confirma entre casos)
7. [POST /admin/qa/plans/preflight](#7-post-admin-qa-plans-preflight) — Dry-run: pasos, URL resueltas, límites recortados, hash y si requiere aprobación. No llama a nada
8. [GET /admin/qa/targets](#8-get-admin-qa-targets) — Destinos aprobados por entorno (sin valores de secretos)
9. [POST /internal/qa/plans/run-next](#9-post-internal-qa-plans-run-next) — Reclamar y ejecutar el siguiente plan (worker)

---

## 1. PUT /admin/qa/environments/{environmentId}/target

- **Módulo:** `qa_execution`
- **Etiqueta OpenAPI:** `qa-execution`
- **Nombre:** Registrar o cambiar el destino de un entorno (cambiarlo invalida planes aprobados)
- **Operation ID:** `QaExecutionController_upsertTarget`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaExecutionController.upsertTarget](../../src/modules/qa_execution/controllers/qa-execution.controller.ts)

### Descripción de negocio

Registrar o cambiar el destino de un entorno (cambiarlo invalida planes aprobados). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /admin/qa/environments/{environmentId}/target` en `QaExecutionController_upsertTarget`. El controlador delega en `QaExecutionService.upsertTarget`. Valida el body como `UpsertTargetDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `environmentId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpsertTargetDto`; los campos opcionales se omiten.

```http
PUT /admin/qa/environments/00000000-0000-4000-8000-000000000001/target HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "scheme": "http",
  "host": "valor-ejemplo",
  "port": 1,
  "allowedPathPrefixes": [
    "/api"
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...QA_TARGET_ROLES`.
- Deben ser UUID válidos: `environmentId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `scheme` | Sí | `string` | valores: `http`, `https` | Sin descripción específica en el contrato OpenAPI. | `http` |
| `host` | Sí | `string` | longitud máxima 253; patrón runtime `/^[a-z0-9.-]+$\|^\[[0-9a-f:]+\]$/i` | Host exacto, sin comodines | `valor-ejemplo` |
| `port` | Sí | `number` | mínimo 1; máximo 65535 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `allowedPathPrefixes` | Sí | `array<string>` | mínimo 1 elemento(s); máximo 20 elemento(s); patrón runtime `/^\/[A-Za-z0-9/_\-.]*$/` | Sin descripción específica en el contrato OpenAPI. | `["/api"]` |
| `allowPrivateNetwork` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `allowMutations` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `authSecretRef` | No | `string` | patrón runtime `SECRET_REF_PATTERN` | Nombre de variable QA_TARGET_*; nunca el valor | `valor-ejemplo` |
| `authHeaderName` | No | `string` | patrón runtime `/^[A-Za-z0-9-]{1,64}$/` | Sin descripción específica en el contrato OpenAPI. | `authorization` |
| `maxRequests` | No | `number` | mínimo 1; máximo 1000 | Sin descripción específica en el contrato OpenAPI. | `300` |
| `maxDurationSeconds` | No | `number` | mínimo 1; máximo 600 | Sin descripción específica en el contrato OpenAPI. | `60` |
| `requestTimeoutMs` | No | `number` | mínimo 100; máximo 30000 | Sin descripción específica en el contrato OpenAPI. | `10000` |
| `minIntervalMs` | No | `number` | mínimo 0; máximo 10000 | Sin descripción específica en el contrato OpenAPI. | `200` |
| `status` | No | `string` | valores: `ACTIVE`, `DISABLED` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /admin/qa/environments/00000000-0000-4000-8000-000000000001/target HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "scheme": "http",
  "host": "valor-ejemplo",
  "port": 1,
  "allowedPathPrefixes": [
    "/api"
  ],
  "allowPrivateNetwork": false,
  "allowMutations": false,
  "authSecretRef": "valor-ejemplo",
  "authHeaderName": "authorization",
  "maxRequests": 300,
  "maxDurationSeconds": 60,
  "requestTimeoutMs": 10000,
  "minIntervalMs": 200,
  "status": "ACTIVE"
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...QA_TARGET_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Entorno no encontrado | Excepción explícita en src/modules/qa_execution/services/qa-execution.service.ts |
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
  "path": "/admin/qa/environments/{environmentId}/target"
}
```

---

## 2. GET /admin/qa/plans

- **Módulo:** `qa_execution`
- **Etiqueta OpenAPI:** `qa-execution`
- **Nombre:** Planes, del más reciente al más antiguo
- **Operation ID:** `QaExecutionController_listPlans`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaExecutionController.listPlans](../../src/modules/qa_execution/controllers/qa-execution.controller.ts)

### Descripción de negocio

Planes, del más reciente al más antiguo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/qa/plans` en `QaExecutionController_listPlans`. El controlador delega en `QaExecutionService.listPlans`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `status` | query | No | `string` | valores: `PENDING_APPROVAL`, `QUEUED`, `RUNNING`, `PASSED`, `FAILED`, `TIMED_OUT`, `CANCELLED`, `INFRA_ERROR`, `REJECTED` | Sin descripción específica en OpenAPI. | `PENDING_APPROVAL` |
| `suiteId` | query | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `50` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/qa/plans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...QA_READ_ROLES`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/qa/plans?status=PENDING_APPROVAL&suiteId=00000000-0000-4000-8000-000000000001&limit=50 HTTP/1.1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...QA_READ_ROLES. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/qa/plans"
}
```

---

## 3. POST /admin/qa/plans

- **Módulo:** `qa_execution`
- **Etiqueta OpenAPI:** `qa-execution`
- **Nombre:** Pedir un plan (202). Queda QUEUED o PENDING_APPROVAL; lo ejecuta el worker qa_lab
- **Operation ID:** `QaExecutionController_createPlan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaExecutionController.createPlan](../../src/modules/qa_execution/controllers/qa-execution.controller.ts)

### Descripción de negocio

Pedir un plan (202). Queda QUEUED o PENDING_APPROVAL; lo ejecuta el worker qa_lab. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/qa/plans` en `QaExecutionController_createPlan`. El controlador delega en `QaExecutionService.createPlan`. Valida el body como `PlanRequestDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `Idempotency-Key` | header | No | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PlanRequestDto`; los campos opcionales se omiten.

```http
POST /admin/qa/plans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "suiteId": "00000000-0000-4000-8000-000000000001",
  "environmentId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...QA_PLAN_ROLES`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `suiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `environmentId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limits` | No | `RequestedLimitsDto` | Sin restricción adicional declarada | El servidor recorta; nunca eleva | `{"maxRequests":1,"maxDurationSeconds":1,"requestTimeoutMs":1,"minIntervalMs":1}` |
| `limits.maxRequests` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `limits.maxDurationSeconds` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `limits.requestTimeoutMs` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `limits.minIntervalMs` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/qa/plans HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Idempotency-Key: valor-ejemplo
Content-Type: application/json

{
  "suiteId": "00000000-0000-4000-8000-000000000001",
  "environmentId": "00000000-0000-4000-8000-000000000001",
  "limits": {
    "maxRequests": 1,
    "maxDurationSeconds": 1,
    "requestTimeoutMs": 1,
    "minIntervalMs": 1
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 202 | Solicitud aceptada para procesamiento asíncrono. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...QA_PLAN_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Plan no encontrado | Excepción explícita en src/modules/qa_execution/services/qa-execution.service.ts |
| 404 | `NOT_FOUND` | Suite no encontrada | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 404 | `NOT_FOUND` | Entorno no encontrado | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 409 | `CONFLICT` | La suite ya tiene una corrida en marcha | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 409 | `CONFLICT` | No se pudo asignar número de corrida | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La suite no está publicada | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | El entorno no está activo | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | La suite no tiene casos activos | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/qa/plans"
}
```

---

## 4. GET /admin/qa/plans/{planId}

- **Módulo:** `qa_execution`
- **Etiqueta OpenAPI:** `qa-execution`
- **Nombre:** Plan con pasos, límites, aprobaciones y bitácora ordenada
- **Operation ID:** `QaExecutionController_getPlan`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaExecutionController.getPlan](../../src/modules/qa_execution/controllers/qa-execution.controller.ts)

### Descripción de negocio

Plan con pasos, límites, aprobaciones y bitácora ordenada. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/qa/plans/{planId}` en `QaExecutionController_getPlan`. El controlador delega en `QaExecutionService.getPlan`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `planId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/qa/plans/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...QA_READ_ROLES`.
- Deben ser UUID válidos: `planId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/qa/plans/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...QA_READ_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Plan no encontrado | Excepción explícita en src/modules/qa_execution/services/qa-execution.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/qa/plans/{planId}"
}
```

---

## 5. POST /admin/qa/plans/{planId}/approvals

- **Módulo:** `qa_execution`
- **Etiqueta OpenAPI:** `qa-execution`
- **Nombre:** Aprobar o rechazar el hash vigente del plan, con vencimiento
- **Operation ID:** `QaExecutionController_approve`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaExecutionController.approve](../../src/modules/qa_execution/controllers/qa-execution.controller.ts)

### Descripción de negocio

Aprobar o rechazar el hash vigente del plan, con vencimiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/qa/plans/{planId}/approvals` en `QaExecutionController_approve`. El controlador delega en `QaExecutionService.approve`. Valida el body como `ApprovePlanDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `planId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ApprovePlanDto`; los campos opcionales se omiten.

```http
POST /admin/qa/plans/00000000-0000-4000-8000-000000000001/approvals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "APPROVED",
  "planHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...QA_APPROVE_ROLES`.
- Deben ser UUID válidos: `planId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `APPROVED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `planHash` | Sí | `string` | patrón runtime `/^[0-9a-f]{64}$/` | Hash del plan revisado; si cambió, la aprobación no aplica | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `reason` | Sí | `string` | longitud mínima 10; longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `expiresInMinutes` | No | `number` | mínimo 5; máximo 240 | Sin descripción específica en el contrato OpenAPI. | `60` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/qa/plans/00000000-0000-4000-8000-000000000001/approvals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "APPROVED",
  "planHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "reason": "Texto descriptivo de ejemplo",
  "expiresInMinutes": 60
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...QA_APPROVE_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Plan no encontrado | Excepción explícita en src/modules/qa_execution/services/qa-execution.service.ts |
| 409 | `CONFLICT` | El plan no está esperando aprobación | Excepción explícita en src/modules/qa_execution/services/qa-execution.service.ts |
| 409 | `CONFLICT` | El plan revisado no es el vigente | Excepción explícita en src/modules/qa_execution/services/qa-execution.service.ts |
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
  "path": "/admin/qa/plans/{planId}/approvals"
}
```

---

## 6. POST /admin/qa/plans/{planId}/cancel

- **Módulo:** `qa_execution`
- **Etiqueta OpenAPI:** `qa-execution`
- **Nombre:** Pedir la cancelación (el runner la confirma entre casos)
- **Operation ID:** `QaExecutionController_cancel`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaExecutionController.cancel](../../src/modules/qa_execution/controllers/qa-execution.controller.ts)

### Descripción de negocio

Pedir la cancelación (el runner la confirma entre casos). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/qa/plans/{planId}/cancel` en `QaExecutionController_cancel`. El controlador delega en `QaExecutionService.cancel`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `planId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /admin/qa/plans/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...QA_PLAN_ROLES`.
- Deben ser UUID válidos: `planId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /admin/qa/plans/00000000-0000-4000-8000-000000000001/cancel HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 202 | Solicitud aceptada para procesamiento asíncrono. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...QA_PLAN_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Plan no encontrado | Excepción explícita en src/modules/qa_execution/services/qa-execution.service.ts |
| 409 | `CONFLICT` | El plan ya terminó | Excepción explícita en src/modules/qa_execution/services/qa-execution.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/qa/plans/{planId}/cancel"
}
```

---

## 7. POST /admin/qa/plans/preflight

- **Módulo:** `qa_execution`
- **Etiqueta OpenAPI:** `qa-execution`
- **Nombre:** Dry-run: pasos, URL resueltas, límites recortados, hash y si requiere aprobación. No llama a nada
- **Operation ID:** `QaExecutionController_preflight`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaExecutionController.preflight](../../src/modules/qa_execution/controllers/qa-execution.controller.ts)

### Descripción de negocio

Dry-run: pasos, URL resueltas, límites recortados, hash y si requiere aprobación. No llama a nada. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/qa/plans/preflight` en `QaExecutionController_preflight`. El controlador delega en `QaExecutionService.preflight`. Valida el body como `PlanRequestDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PlanRequestDto`; los campos opcionales se omiten.

```http
POST /admin/qa/plans/preflight HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "suiteId": "00000000-0000-4000-8000-000000000001",
  "environmentId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...QA_PLAN_ROLES`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `suiteId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `environmentId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limits` | No | `RequestedLimitsDto` | Sin restricción adicional declarada | El servidor recorta; nunca eleva | `{"maxRequests":1,"maxDurationSeconds":1,"requestTimeoutMs":1,"minIntervalMs":1}` |
| `limits.maxRequests` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `limits.maxDurationSeconds` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `limits.requestTimeoutMs` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `limits.minIntervalMs` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/qa/plans/preflight HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "suiteId": "00000000-0000-4000-8000-000000000001",
  "environmentId": "00000000-0000-4000-8000-000000000001",
  "limits": {
    "maxRequests": 1,
    "maxDurationSeconds": 1,
    "requestTimeoutMs": 1,
    "minIntervalMs": 1
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...QA_PLAN_ROLES. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Suite no encontrada | Excepción explícita en src/modules/qa_execution/services/qa-execution.service.ts |
| 404 | `NOT_FOUND` | Entorno no encontrado | Excepción explícita en src/modules/qa_execution/services/qa-execution.service.ts |
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
  "path": "/admin/qa/plans/preflight"
}
```

---

## 8. GET /admin/qa/targets

- **Módulo:** `qa_execution`
- **Etiqueta OpenAPI:** `qa-execution`
- **Nombre:** Destinos aprobados por entorno (sin valores de secretos)
- **Operation ID:** `QaExecutionController_listTargets`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaExecutionController.listTargets](../../src/modules/qa_execution/controllers/qa-execution.controller.ts)

### Descripción de negocio

Destinos aprobados por entorno (sin valores de secretos). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/qa/targets` en `QaExecutionController_listTargets`. El controlador delega en `QaExecutionService.listTargets`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/qa/targets HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `...QA_READ_ROLES`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/qa/targets HTTP/1.1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: ...QA_READ_ROLES. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/qa/targets"
}
```

---

## 9. POST /internal/qa/plans/run-next

- **Módulo:** `qa_execution`
- **Etiqueta OpenAPI:** `qa-execution-internal`
- **Nombre:** Reclamar y ejecutar el siguiente plan (worker)
- **Operation ID:** `QaExecutionInternalController_runNext`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [QaExecutionInternalController.runNext](../../src/modules/qa_execution/controllers/qa-execution.controller.ts)

### Descripción de negocio

Reclamar y ejecutar el siguiente plan (worker). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /internal/qa/plans/run-next` en `QaExecutionInternalController_runNext`. El controlador delega en `QaExecutionService.runNext`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /internal/qa/plans/run-next HTTP/1.1
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
POST /internal/qa/plans/run-next HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Corrida no encontrada | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 404 | `NOT_FOUND` | Suite no encontrada | Excepción explícita en src/modules/qa_execution/services/qa-execution.service.ts |
| 404 | `NOT_FOUND` | Entorno no encontrado | Excepción explícita en src/modules/qa_execution/services/qa-execution.service.ts |
| 404 | `NOT_FOUND` | Caso no encontrado | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 404 | `NOT_FOUND` | Resultado no encontrado | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 409 | `CONFLICT` | La corrida ya está cerrada | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 409 | `CONFLICT` | El caso ya se ejecutó en esta corrida | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 409 | `CONFLICT` | El resultado ya fue evaluado | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso pertenece a otra suite | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso falló en transporte: no hay respuesta que evaluar | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 422 | `PRECONDITION_FAILED` | El caso no tiene aserciones | Excepción explícita en src/modules/qa_lab/services/qa-runs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/qa/plans/run-next"
}
```

---

