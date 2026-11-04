<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `governance_admin`

Referencia exhaustiva de 5 operación(es) del módulo `governance_admin`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `admin-governance-data-quality`
- **Controladores:** `AdminDataQualityController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /admin/governance/data-quality/issues](#1-get-admin-governance-data-quality-issues) — Incidencias de calidad de datos clínicos, paginadas por cursor
2. [GET /admin/governance/data-quality/issues/{id}](#2-get-admin-governance-data-quality-issues-id) — Una incidencia de calidad de datos clínicos
3. [POST /admin/governance/data-quality/issues/{id}/resolution](#3-post-admin-governance-data-quality-issues-id-resolution) — Resolver o descartar una incidencia abierta
4. [GET /admin/governance/data-quality/rules](#4-get-admin-governance-data-quality-rules) — Reglas de calidad de datos clínicos, paginadas por cursor
5. [GET /admin/governance/data-quality/rules/{id}](#5-get-admin-governance-data-quality-rules-id) — Una regla de calidad con su expresión, sus incidencias por estado y sus últimas corridas

---

## 1. GET /admin/governance/data-quality/issues

- **Módulo:** `governance_admin`
- **Etiqueta OpenAPI:** `admin-governance-data-quality`
- **Nombre:** Incidencias de calidad de datos clínicos, paginadas por cursor
- **Operation ID:** `AdminDataQualityController_issues`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminDataQualityController.issues](../../src/modules/governance_admin/controllers/admin-data-quality.controller.ts)

### Descripción de negocio

Incidencias de calidad de datos clínicos, paginadas por cursor. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/governance/data-quality/issues` en `AdminDataQualityController_issues`. El controlador delega en `DataQualityService.listIssues`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `cursor` | query | No | `string` | longitud máxima 600 | Cursor opaco (`nextCursor`) | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `25` |
| `status` | query | No | `string` | valores: `OPEN`, `RESOLVED`, `DISMISSED` | Sin descripción específica en OpenAPI. | `OPEN` |
| `severity` | query | No | `string` | valores: `FATAL`, `ERROR`, `WARNING`, `INFORMATION` | Sin descripción específica en OpenAPI. | `FATAL` |
| `ruleId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `q` | query | No | `string` | longitud máxima 120 | Busca en la ruta del campo, el código y el nombre de la regla | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/governance/data-quality/issues HTTP/1.1
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
GET /admin/governance/data-quality/issues?cursor=valor-ejemplo&limit=25&status=OPEN&severity=FATAL&ruleId=00000000-0000-4000-8000-000000000001&q=valor-ejemplo HTTP/1.1
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
  "path": "/admin/governance/data-quality/issues"
}
```

---

## 2. GET /admin/governance/data-quality/issues/{id}

- **Módulo:** `governance_admin`
- **Etiqueta OpenAPI:** `admin-governance-data-quality`
- **Nombre:** Una incidencia de calidad de datos clínicos
- **Operation ID:** `AdminDataQualityController_issue`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminDataQualityController.issue](../../src/modules/governance_admin/controllers/admin-data-quality.controller.ts)

### Descripción de negocio

Una incidencia de calidad de datos clínicos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/governance/data-quality/issues/{id}` en `AdminDataQualityController_issue`. El controlador delega en `DataQualityService.getIssue`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/governance/data-quality/issues/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /admin/governance/data-quality/issues/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | La incidencia | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | No existe la incidencia | `no declarado` | No |
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
| 404 | `NOT_FOUND` | Incidencia no encontrada | Excepción explícita en src/modules/governance_admin/services/data-quality.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/data-quality/issues/{id}"
}
```

---

## 3. POST /admin/governance/data-quality/issues/{id}/resolution

- **Módulo:** `governance_admin`
- **Etiqueta OpenAPI:** `admin-governance-data-quality`
- **Nombre:** Resolver o descartar una incidencia abierta
- **Operation ID:** `AdminDataQualityController_resolve`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminDataQualityController.resolve](../../src/modules/governance_admin/controllers/admin-data-quality.controller.ts)

### Descripción de negocio

Idempotente: repetir la misma acción devuelve 200 con `alreadyApplied: true`. Pedir la contraria sobre una incidencia ya cerrada responde 409.


### Descripción del sistema

NestJS resuelve `POST /admin/governance/data-quality/issues/{id}/resolution` en `AdminDataQualityController_resolve`. El controlador delega en `DataQualityService.resolve`. Valida el body como `ResolveIssueDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ResolveIssueDto`; los campos opcionales se omiten.

```http
POST /admin/governance/data-quality/issues/00000000-0000-4000-8000-000000000001/resolution HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "action": "RESOLVE",
  "note": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `GOVERNANCE_ADMIN`, `DATA_PLATFORM_ADMIN`, `DATA_STEWARD`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `action` | Sí | `string` | valores: `RESOLVE`, `DISMISS` | Sin descripción específica en el contrato OpenAPI. | `RESOLVE` |
| `note` | Sí | `string` | longitud mínima 10; longitud máxima 2000 | Motivo de la resolución o del descarte. Es obligatorio y queda en la incidencia. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/governance/data-quality/issues/00000000-0000-4000-8000-000000000001/resolution HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "action": "RESOLVE",
  "note": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | La incidencia con su desenlace; `alreadyApplied` si ya estaba así | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Ya la cerró otra persona con otro desenlace | `no declarado` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GOVERNANCE_ADMIN, DATA_PLATFORM_ADMIN, DATA_STEWARD, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Incidencia no encontrada | Excepción explícita en src/modules/governance_admin/services/data-quality.service.ts |
| 409 | `CONFLICT` | La incidencia ya no está abierta: otra persona la cerró con otro desenlace | Excepción explícita en src/modules/governance_admin/services/data-quality.service.ts |
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
  "path": "/admin/governance/data-quality/issues/{id}/resolution"
}
```

---

## 4. GET /admin/governance/data-quality/rules

- **Módulo:** `governance_admin`
- **Etiqueta OpenAPI:** `admin-governance-data-quality`
- **Nombre:** Reglas de calidad de datos clínicos, paginadas por cursor
- **Operation ID:** `AdminDataQualityController_rules`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminDataQualityController.rules](../../src/modules/governance_admin/controllers/admin-data-quality.controller.ts)

### Descripción de negocio

Reglas de calidad de datos clínicos, paginadas por cursor. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/governance/data-quality/rules` en `AdminDataQualityController_rules`. El controlador delega en `DataQualityService.listRules`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `cursor` | query | No | `string` | longitud máxima 600 | Cursor opaco (`nextCursor`) | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `25` |
| `severity` | query | No | `string` | valores: `FATAL`, `ERROR`, `WARNING`, `INFORMATION` | Sin descripción específica en OpenAPI. | `FATAL` |
| `dimension` | query | No | `string` | longitud máxima 80 | Código de la dimensión de calidad (concepto) | `valor-ejemplo` |
| `q` | query | No | `string` | longitud máxima 120 | Busca en código y nombre | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/governance/data-quality/rules HTTP/1.1
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
GET /admin/governance/data-quality/rules?cursor=valor-ejemplo&limit=25&severity=FATAL&dimension=valor-ejemplo&q=valor-ejemplo HTTP/1.1
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
  "path": "/admin/governance/data-quality/rules"
}
```

---

## 5. GET /admin/governance/data-quality/rules/{id}

- **Módulo:** `governance_admin`
- **Etiqueta OpenAPI:** `admin-governance-data-quality`
- **Nombre:** Una regla de calidad con su expresión, sus incidencias por estado y sus últimas corridas
- **Operation ID:** `AdminDataQualityController_rule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminDataQualityController.rule](../../src/modules/governance_admin/controllers/admin-data-quality.controller.ts)

### Descripción de negocio

Una regla de calidad con su expresión, sus incidencias por estado y sus últimas corridas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/governance/data-quality/rules/{id}` en `AdminDataQualityController_rule`. El controlador delega en `DataQualityService.getRule`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/governance/data-quality/rules/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
GET /admin/governance/data-quality/rules/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Regla de calidad con incidencias y corridas  La regla | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 404 | No existe la regla | `no declarado` | No |
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
| 404 | `NOT_FOUND` | Regla no encontrada | Excepción explícita en src/modules/governance_admin/services/data-quality.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/governance/data-quality/rules/{id}"
}
```

---

