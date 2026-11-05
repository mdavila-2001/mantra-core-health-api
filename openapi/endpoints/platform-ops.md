<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `platform_ops`

Referencia exhaustiva de 20 operación(es) del módulo `platform_ops`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `ops-runtime-pieces`, `ops-tools`, `platform-ops`
- **Controladores:** `OpsToolsController`, `PlatformOpsController`, `RuntimePiecesController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /admin/ops/runtime-pieces](#1-get-admin-ops-runtime-pieces) — Piezas descubiertas en el código, con su estado contrastado
2. [GET /admin/ops/runtime-pieces/{id}](#2-get-admin-ops-runtime-pieces-id) — Una pieza con su evidencia, su registro y sus hallazgos
3. [POST /admin/ops/runtime-pieces/discover](#3-post-admin-ops-runtime-pieces-discover) — Descubrir y registrar las piezas del código (idempotente)
4. [GET /admin/ops/tool-registry](#4-get-admin-ops-tool-registry) — Herramientas del catálogo con su salud
5. [GET /admin/ops/tools/{code}](#5-get-admin-ops-tools-code) — Una herramienta con su historial corto de comprobaciones
6. [POST /ops/artifacts](#6-post-ops-artifacts) — Publicar un artefacto inmutable
7. [POST /ops/capacity-plans/{id}/measurements](#7-post-ops-capacity-plans-id-measurements) — Registrar una medición de capacidad
8. [POST /ops/change-requests](#8-post-ops-change-requests) — Registrar una solicitud de cambio
9. [POST /ops/change-requests/{id}/approvals](#9-post-ops-change-requests-id-approvals) — Registrar la decisión del CAB
10. [POST /ops/deployments](#10-post-ops-deployments) — Ejecutar un despliegue
11. [POST /ops/deployments/{id}/rollback](#11-post-ops-deployments-id-rollback) — Revertir un despliegue
12. [POST /ops/error-budget/{policyId}/burn-events](#12-post-ops-error-budget-policyid-burn-events) — Registrar la quema del presupuesto de error
13. [POST /ops/health-checks/{id}/runs](#13-post-ops-health-checks-id-runs) — Registrar una corrida de health check
14. [PATCH /ops/incidents/{id}](#14-patch-ops-incidents-id) — Mover el incidente, sumar respondientes y publicar comunicaciones
15. [POST /ops/incidents/{id}/postmortem](#15-post-ops-incidents-id-postmortem) — Abrir el postmortem del incidente resuelto
16. [POST /ops/readiness-reviews/{id}/complete](#16-post-ops-readiness-reviews-id-complete) — Cerrar la revisión de preparación con su decisión
17. [POST /ops/resilience-exercises/{id}/complete](#17-post-ops-resilience-exercises-id-complete) — Cerrar un ejercicio de resiliencia
18. [POST /ops/runbook-executions](#18-post-ops-runbook-executions) — Registrar la ejecución de un runbook
19. [POST /ops/runbooks/{id}/versions](#19-post-ops-runbooks-id-versions) — Publicar una versión del runbook
20. [POST /ops/slo/{id}/measurements](#20-post-ops-slo-id-measurements) — Registrar la medición de una ventana del SLO

---

## 1. GET /admin/ops/runtime-pieces

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `ops-runtime-pieces`
- **Nombre:** Piezas descubiertas en el código, con su estado contrastado
- **Operation ID:** `RuntimePiecesController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RuntimePiecesController.list](../../src/modules/platform_ops/runtime_pieces/runtime-pieces.controller.ts)

### Descripción de negocio

Estados: VIVA (latido reciente), SIN_LATIDO, NO_REGISTRADA, HUERFANA, DESHABILITADA y NO_MEDIBLE (clase de pieza sin mecanismo de latido). Incluye instancias, hallazgos y lo que no se mide.


### Descripción del sistema

NestJS resuelve `GET /admin/ops/runtime-pieces` en `RuntimePiecesController_list`. El controlador delega en `RuntimePiecesService.list`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `page` | query | No | `number` | mínimo 1 | Sin descripción específica en OpenAPI. | `1` |
| `pageSize` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `25` |
| `kind` | query | No | `string` | valores: `PROCESO`, `JOB_PROGRAMADO`, `TEMPORIZADOR`, `CONSUMIDOR_COLA`, `JOB_NOMBRADO`, `ENDPOINT_INTERNO`, `SALUD`, `CONECTOR` | Sin descripción específica en OpenAPI. | `PROCESO` |
| `state` | query | No | `string` | valores: `VIVA`, `SIN_LATIDO`, `NO_REGISTRADA`, `HUERFANA`, `DESHABILITADA`, `NO_MEDIBLE` | Sin descripción específica en OpenAPI. | `VIVA` |
| `host` | query | No | `string` | Sin restricción adicional declarada | Proceso anfitrión exacto (`api`, `worker-messaging`…) | `valor-ejemplo` |
| `module` | query | No | `string` | Sin restricción adicional declarada | Módulo de dominio exacto | `valor-ejemplo` |
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto en id, nombre o ruta de la evidencia | `valor-ejemplo` |
| `withFindings` | query | No | `boolean` | Sin restricción adicional declarada | Sólo piezas que tienen algún hallazgo | `true` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/ops/runtime-pieces HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SRE`, `SECURITY_ADMIN`, `RELEASE_MANAGER`, `GOVERNANCE_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/ops/runtime-pieces?page=1&pageSize=25&kind=PROCESO&state=VIVA&host=valor-ejemplo&module=valor-ejemplo&q=valor-ejemplo&withFindings=true HTTP/1.1
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/ops/runtime-pieces"
}
```

---

## 2. GET /admin/ops/runtime-pieces/{id}

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `ops-runtime-pieces`
- **Nombre:** Una pieza con su evidencia, su registro y sus hallazgos
- **Operation ID:** `RuntimePiecesController_detail`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RuntimePiecesController.detail](../../src/modules/platform_ops/runtime_pieces/runtime-pieces.controller.ts)

### Descripción de negocio

Una pieza con su evidencia, su registro y sus hallazgos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/ops/runtime-pieces/{id}` en `RuntimePiecesController_detail`. El controlador delega en `RuntimePiecesService.get`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/ops/runtime-pieces/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SRE`, `SECURITY_ADMIN`, `RELEASE_MANAGER`, `GOVERNANCE_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/ops/runtime-pieces/00000000-0000-4000-8000-000000000001 HTTP/1.1
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
| 404 | reason RUNTIME_PIECE_NOT_FOUND | `no declarado` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Pieza no encontrada | Excepción explícita en src/modules/platform_ops/runtime_pieces/runtime-pieces.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/ops/runtime-pieces/{id}"
}
```

---

## 3. POST /admin/ops/runtime-pieces/discover

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `ops-runtime-pieces`
- **Nombre:** Descubrir y registrar las piezas del código (idempotente)
- **Operation ID:** `RuntimePiecesController_discover`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [RuntimePiecesController.discover](../../src/modules/platform_ops/runtime_pieces/runtime-pieces.controller.ts)

### Descripción de negocio

Escanea el código y registra en tool_registry lo que falte, con su procedencia. Repetirlo sin cambios en el código no inserta ni modifica nada. Nunca borra. `dryRun` calcula el efecto sin escribir.


### Descripción del sistema

NestJS resuelve `POST /admin/ops/runtime-pieces/discover` en `RuntimePiecesController_discover`. El controlador delega en `RuntimePiecesService.discover`. Valida el body como `DiscoverRuntimePiecesDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DiscoverRuntimePiecesDto`; los campos opcionales se omiten.

```http
POST /admin/ops/runtime-pieces/discover HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SRE`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `dryRun` | No | `boolean` | Sin restricción adicional declarada | Calcula qué cambiaría sin escribir nada | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/ops/runtime-pieces/discover HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "dryRun": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | reason RUNTIME_PIECES_SOURCE_UNAVAILABLE | `no declarado` | No |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SRE. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | scan.reason ?? 'No hay código fuente para escanear' | Excepción explícita en src/modules/platform_ops/runtime_pieces/runtime-pieces-seed.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Faltan conceptos del catálogo para registrar las piezas: ejecutar el seed de terminología | Excepción explícita en src/modules/platform_ops/runtime_pieces/runtime-pieces-seed.service.ts |
| 422 | `PRECONDITION_FAILED` | No existe el tenant de plataforma que es dueño de las piezas | Excepción explícita en src/modules/platform_ops/runtime_pieces/runtime-pieces-seed.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/ops/runtime-pieces/discover"
}
```

---

## 4. GET /admin/ops/tool-registry

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `ops-tools`
- **Nombre:** Herramientas del catálogo con su salud
- **Operation ID:** `OpsToolsController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OpsToolsController.list](../../src/modules/platform_ops/controllers/ops-tools.controller.ts)

### Descripción de negocio

Lista completa (no paginada). `health.state` es NOT_PROBED cuando nadie lo midió; CONFIGURATION solo verifica que existan las variables requeridas y devuelve sus nombres, nunca valores; LIVE solo con una comprobación real y reciente en health_check_runs.


### Descripción del sistema

NestJS resuelve `GET /admin/ops/tool-registry` en `OpsToolsController_list`. El controlador delega en `OpsToolsService.list`. No recibe body. El tipo de retorno estático es `Promise<ToolListResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/ops/tool-registry HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SRE`, `SECURITY_ADMIN`, `RELEASE_MANAGER`, `GOVERNANCE_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/ops/tool-registry HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ToolListResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<ToolListResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ToolListResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ToolListResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ToolListResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ToolListResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ToolListResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ToolListResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "evaluatedAt": "2026-07-31T12:00:00.000Z",
  "items": [
    {
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "kind": "DATABASE",
      "isCritical": true,
      "status": "ACTIVE",
      "requiredEnvVars": [
        "valor-ejemplo"
      ],
      "health": {
        "state": "OK",
        "checkType": "LIVE",
        "observedAt": "2026-07-31T12:00:00.000Z",
        "missingEnvVars": [
          "valor-ejemplo"
        ]
      }
    }
  ],
  "notMeasured": [
    {
      "code": "CODIGO_EJEMPLO",
      "reason": "Texto descriptivo de ejemplo"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `evaluatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items` | Sí | `array<ToolItemDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","kind":"DATABASE","isCritical":true,"status":"ACTIVE","requiredEnvVars":["valor-ejemplo"],"health":{"state":"OK","checkType":"LIVE","observedAt":"2026-07-31T12:00:00.000Z","missingEnvVars":["valor-ejemplo"]}}]` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `items[].kind` | Sí | `string` | valores: `DATABASE`, `CACHE`, `SEARCH`, `STORAGE`, `MESSAGING`, `PAYMENTS`, `AI`, `MAPS`, `ANALYTICS`, `SECURITY`, `OBSERVABILITY`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `DATABASE` |
| `items[].isCritical` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `items[].status` | Sí | `string` | valores: `ACTIVE`, `PLANNED`, `DEPRECATED`, `DISABLED` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |
| `items[].requiredEnvVars` | Sí | `array<string>` | Sin restricción adicional declarada | Solo nombres, nunca valores. | `["valor-ejemplo"]` |
| `items[].health` | Sí | `ToolHealthDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"state":"OK","checkType":"LIVE","observedAt":"2026-07-31T12:00:00.000Z","missingEnvVars":["valor-ejemplo"]}` |
| `items[].health.state` | Sí | `string` | valores: `OK`, `FAIL`, `NOT_PROBED` | Sin descripción específica en el contrato OpenAPI. | `OK` |
| `items[].health.checkType` | Sí | `string` | valores: `LIVE`, `CONFIGURATION`, `NOT_APPLICABLE` | Sin descripción específica en el contrato OpenAPI. | `LIVE` |
| `items[].health.observedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].health.missingEnvVars` | Sí | `array<string>` | Sin restricción adicional declarada | Solo NOMBRES de las variables de entorno ausentes. | `["valor-ejemplo"]` |
| `notMeasured` | Sí | `array<ToolNotMeasuredDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","reason":"Texto descriptivo de ejemplo"}]` |
| `notMeasured[].code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `notMeasured[].reason` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/ops/tool-registry"
}
```

---

## 5. GET /admin/ops/tools/{code}

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `ops-tools`
- **Nombre:** Una herramienta con su historial corto de comprobaciones
- **Operation ID:** `OpsToolsController_detail`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [OpsToolsController.detail](../../src/modules/platform_ops/controllers/ops-tools.controller.ts)

### Descripción de negocio

Últimas 20 corridas de health_check_runs, de la más nueva a la más vieja.


### Descripción del sistema

NestJS resuelve `GET /admin/ops/tools/{code}` en `OpsToolsController_detail`. El controlador delega en `OpsToolsService.get`. No recibe body. El tipo de retorno estático es `Promise<ToolDetailResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `code` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/ops/tools/CODIGO_EJEMPLO HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PLATFORM_ADMIN`, `SRE`, `SECURITY_ADMIN`, `RELEASE_MANAGER`, `GOVERNANCE_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/ops/tools/CODIGO_EJEMPLO HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ToolDetailResponseDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<ToolDetailResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ToolDetailResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ToolDetailResponseDto>` | No |
| 404 | La herramienta no existe (reason TOOL_NOT_FOUND). | `Promise<ToolDetailResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ToolDetailResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ToolDetailResponseDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<ToolDetailResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ToolDetailResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "kind": "DATABASE",
  "isCritical": true,
  "status": "ACTIVE",
  "requiredEnvVars": [
    "valor-ejemplo"
  ],
  "health": {
    "state": "OK",
    "checkType": "LIVE",
    "observedAt": "2026-07-31T12:00:00.000Z",
    "missingEnvVars": [
      "valor-ejemplo"
    ]
  },
  "evaluatedAt": "2026-07-31T12:00:00.000Z",
  "history": [
    {
      "observedAt": "2026-07-31T12:00:00.000Z",
      "outcome": "PASS",
      "latencyMs": 1,
      "httpStatus": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `kind` | Sí | `string` | valores: `DATABASE`, `CACHE`, `SEARCH`, `STORAGE`, `MESSAGING`, `PAYMENTS`, `AI`, `MAPS`, `ANALYTICS`, `SECURITY`, `OBSERVABILITY`, `OTHER` | Sin descripción específica en el contrato OpenAPI. | `DATABASE` |
| `isCritical` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `status` | Sí | `string` | valores: `ACTIVE`, `PLANNED`, `DEPRECATED`, `DISABLED` | Sin descripción específica en el contrato OpenAPI. | `ACTIVE` |
| `requiredEnvVars` | Sí | `array<string>` | Sin restricción adicional declarada | Solo nombres, nunca valores. | `["valor-ejemplo"]` |
| `health` | Sí | `ToolHealthDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"state":"OK","checkType":"LIVE","observedAt":"2026-07-31T12:00:00.000Z","missingEnvVars":["valor-ejemplo"]}` |
| `health.state` | Sí | `string` | valores: `OK`, `FAIL`, `NOT_PROBED` | Sin descripción específica en el contrato OpenAPI. | `OK` |
| `health.checkType` | Sí | `string` | valores: `LIVE`, `CONFIGURATION`, `NOT_APPLICABLE` | Sin descripción específica en el contrato OpenAPI. | `LIVE` |
| `health.observedAt` | Sí | `string` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `health.missingEnvVars` | Sí | `array<string>` | Sin restricción adicional declarada | Solo NOMBRES de las variables de entorno ausentes. | `["valor-ejemplo"]` |
| `evaluatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `history` | Sí | `array<ToolCheckRunDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"observedAt":"2026-07-31T12:00:00.000Z","outcome":"PASS","latencyMs":1,"httpStatus":1}]` |
| `history[].observedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `history[].outcome` | Sí | `string` | valores: `PASS`, `WARN`, `FAIL`, `TIMEOUT`, `ERROR` | Sin descripción específica en el contrato OpenAPI. | `PASS` |
| `history[].latencyMs` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `history[].httpStatus` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PLATFORM_ADMIN, SRE, SECURITY_ADMIN, RELEASE_MANAGER, GOVERNANCE_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Herramienta no encontrada | Excepción explícita en src/modules/platform_ops/services/ops-tools.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/ops/tools/{code}"
}
```

---

## 6. POST /ops/artifacts

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Publicar un artefacto inmutable
- **Operation ID:** `PlatformOpsController_publishArtifact`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.publishArtifact](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Direccionado por contenido: la misma referencia no se republica.


### Descripción del sistema

NestJS resuelve `POST /ops/artifacts` en `PlatformOpsController_publishArtifact`. El controlador delega en `OpsReleasesService.publishArtifact`. Valida el body como `PublishArtifactDto` y consume `application/json`. El tipo de retorno estático es `Promise<ArtifactResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishArtifactDto`; los campos opcionales se omiten.

```http
POST /ops/artifacts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "serviceComponentId": "00000000-0000-4000-8000-000000000001",
  "artifactRef": "valor-ejemplo",
  "artifactKind": "CONTAINER_IMAGE",
  "name": "Nombre de ejemplo",
  "version": "valor-ejemplo",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DEPLOY_PIPELINE`, `RELEASE_MANAGER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceComponentId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `producedByToolId` | No | `string` | formato `uuid` | Herramienta que lo construyó | `00000000-0000-4000-8000-000000000001` |
| `artifactRef` | Sí | `string` | longitud máxima 500 | Referencia única del artefacto | `valor-ejemplo` |
| `artifactKind` | Sí | `string` | valores: `CONTAINER_IMAGE`, `PACKAGE`, `BINARY`, `HELM_CHART`, `CONFIG_BUNDLE` | Sin descripción específica en el contrato OpenAPI. | `CONTAINER_IMAGE` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `version` | Sí | `string` | longitud máxima 100 | Versión publicada | `valor-ejemplo` |
| `semver` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `gitRef` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `commitSha` | No | `string` | longitud máxima 100 | SHA del commit | `valor-ejemplo` |
| `contentHash` | Sí | `string` | patrón runtime `/^[0-9a-f]{32,128}$/i` | Hash del contenido en hexadecimal; direcciona el artefacto | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `storageUri` | No | `string` | Sin restricción adicional declarada | URI del blob en almacenamiento de objetos | `valor-ejemplo` |
| `fileId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sizeBytes` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `builtAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/artifacts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "serviceComponentId": "00000000-0000-4000-8000-000000000001",
  "producedByToolId": "00000000-0000-4000-8000-000000000001",
  "artifactRef": "valor-ejemplo",
  "artifactKind": "CONTAINER_IMAGE",
  "name": "Nombre de ejemplo",
  "version": "valor-ejemplo",
  "semver": "valor-ejemplo",
  "gitRef": "valor-ejemplo",
  "commitSha": "valor-ejemplo",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "storageUri": "valor-ejemplo",
  "fileId": "00000000-0000-4000-8000-000000000001",
  "sizeBytes": 1,
  "builtAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ArtifactResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ArtifactResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "testRunId": "00000000-0000-4000-8000-000000000001",
  "artifactTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `testRunId` | Sí | `string` | formato `uuid` | Identificador asociado a test run. | `00000000-0000-4000-8000-000000000001` |
| `artifactTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a artifact type concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DEPLOY_PIPELINE, RELEASE_MANAGER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un artefacto con esa referencia | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 409 | `CONFLICT` | El componente ya publicó esa versión | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La herramienta no está homologada | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/artifacts"
}
```

---

## 7. POST /ops/capacity-plans/{id}/measurements

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Registrar una medición de capacidad
- **Operation ID:** `PlatformOpsController_recordCapacityMeasurement`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.recordCapacityMeasurement](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Cruzar el guardrail declarado permite recomputar el plan en la misma operación.


### Descripción del sistema

NestJS resuelve `POST /ops/capacity-plans/{id}/measurements` en `PlatformOpsController_recordCapacityMeasurement`. El controlador delega en `OpsReliabilityService.recordCapacityMeasurement`. Valida el body como `RecordCapacityMeasurementDto` y consume `application/json`. El tipo de retorno estático es `Promise<CapacityMeasurementResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordCapacityMeasurementDto`; los campos opcionales se omiten.

```http
POST /ops/capacity-plans/00000000-0000-4000-8000-000000000001/measurements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "metric": "CPU",
  "observedValue": "valor-ejemplo",
  "capacityValue": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CAPACITY_PLANNER`, `SRE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `metric` | Sí | `string` | valores: `CPU`, `MEMORY`, `STORAGE`, `THROUGHPUT`, `CONNECTIONS` | Sin descripción específica en el contrato OpenAPI. | `CPU` |
| `observedValue` | Sí | `string` | Sin restricción adicional declarada | Valor observado, como cadena decimal | `valor-ejemplo` |
| `capacityValue` | Sí | `string` | Sin restricción adicional declarada | Capacidad disponible, como cadena decimal | `valor-ejemplo` |
| `measuredAt` | No | `string` | formato `date-time` | Cuándo se midió; por defecto, ahora | `2026-07-31T12:00:00.000Z` |
| `sourceReference` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `demandForecastJson` | No | `object` | Sin restricción adicional declarada | Previsión de demanda recalculada | `{}` |
| `scalingPolicyJson` | No | `object` | Sin restricción adicional declarada | Política de escalado recalculada | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/capacity-plans/00000000-0000-4000-8000-000000000001/measurements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "metric": "CPU",
  "observedValue": "valor-ejemplo",
  "capacityValue": "valor-ejemplo",
  "measuredAt": "2026-07-31T12:00:00.000Z",
  "sourceReference": "valor-ejemplo",
  "demandForecastJson": {},
  "scalingPolicyJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<CapacityMeasurementResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CapacityMeasurementResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "utilizationPercent": "valor-ejemplo",
  "guardrailCrossed": true,
  "planUpdated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `utilizationPercent` | Sí | `string` | Sin restricción adicional declarada | Utilización calculada en porcentaje, como cadena decimal | `valor-ejemplo` |
| `guardrailCrossed` | Sí | `boolean` | Sin restricción adicional declarada | true si la utilización cruzó el guardrail del plan | `true` |
| `planUpdated` | Sí | `boolean` | Sin restricción adicional declarada | true si el plan se recalculó en esta medición | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CAPACITY_PLANNER, SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La capacidad debe ser mayor que cero | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | El plan de capacidad no está activo | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | La medición cae fuera del horizonte del plan | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/capacity-plans/{id}/measurements"
}
```

---

## 8. POST /ops/change-requests

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Registrar una solicitud de cambio
- **Operation ID:** `PlatformOpsController_createChangeRequest`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.createChangeRequest](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Atarla a una ventana obliga a que el cambio quepa dentro de ella.


### Descripción del sistema

NestJS resuelve `POST /ops/change-requests` en `PlatformOpsController_createChangeRequest`. El controlador delega en `OpsReleasesService.createChangeRequest`. Valida el body como `CreateChangeRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<ChangeRequestResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateChangeRequestDto`; los campos opcionales se omiten.

```http
POST /ops/change-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "serviceComponentId": "00000000-0000-4000-8000-000000000001",
  "title": "valor-ejemplo",
  "changeType": "STANDARD",
  "risk": "LOW"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `RELEASE_MANAGER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `serviceComponentId` | Sí | `string` | formato `uuid` | Componente afectado | `00000000-0000-4000-8000-000000000001` |
| `title` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `changeType` | Sí | `string` | valores: `STANDARD`, `NORMAL`, `EMERGENCY` | Sin descripción específica en el contrato OpenAPI. | `STANDARD` |
| `risk` | Sí | `string` | valores: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Sin descripción específica en el contrato OpenAPI. | `LOW` |
| `plannedStartAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `plannedEndAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `rollbackPlanText` | No | `string` | Sin restricción adicional declarada | Cómo se deshace el cambio si sale mal | `valor-ejemplo` |
| `validationPlanText` | No | `string` | Sin restricción adicional declarada | Cómo se comprueba que el cambio funcionó | `valor-ejemplo` |
| `maintenanceWindowId` | No | `string` | formato `uuid` | Ventana de mantenimiento a la que se ata | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/change-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "serviceComponentId": "00000000-0000-4000-8000-000000000001",
  "title": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "changeType": "STANDARD",
  "risk": "LOW",
  "plannedStartAt": "2026-07-31T12:00:00.000Z",
  "plannedEndAt": "2026-07-31T12:00:00.000Z",
  "rollbackPlanText": "valor-ejemplo",
  "validationPlanText": "valor-ejemplo",
  "maintenanceWindowId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ChangeRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ChangeRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "changeNumber": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `changeNumber` | Sí | `string` | Sin restricción adicional declarada | Número correlativo del cambio en el tenant | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: RELEASE_MANAGER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | No se pudo asignar un número de cambio libre | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ventana planificada está invertida | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El componente no está activo | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana de mantenimiento está cerrada | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El cambio empieza antes que su ventana | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El cambio termina después que su ventana | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/change-requests"
}
```

---

## 9. POST /ops/change-requests/{id}/approvals

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Registrar la decisión del CAB
- **Operation ID:** `PlatformOpsController_recordApproval`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.recordApproval](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Quien solicita el cambio no lo aprueba, y los pasos se recorren en orden.


### Descripción del sistema

NestJS resuelve `POST /ops/change-requests/{id}/approvals` en `PlatformOpsController_recordApproval`. El controlador delega en `OpsReleasesService.recordApproval`. Valida el body como `RecordApprovalDto` y consume `application/json`. El tipo de retorno estático es `Promise<ApprovalResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordApprovalDto`; los campos opcionales se omiten.

```http
POST /ops/change-requests/00000000-0000-4000-8000-000000000001/approvals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "approvalStep": 1,
  "decision": "APPROVED"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CHANGE_APPROVER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `approvalStep` | Sí | `number` | mínimo 1 | Paso del recorrido de aprobación | `1` |
| `decision` | Sí | `string` | valores: `APPROVED`, `REJECTED` | Sin descripción específica en el contrato OpenAPI. | `APPROVED` |
| `decisionReason` | No | `string` | Sin restricción adicional declarada | Por qué se decide así | `Texto descriptivo de ejemplo` |
| `requiredApprovalSteps` | No | `number` | mínimo 1; máximo 5 | Pasos exigidos; por defecto, los pasos ya emitidos más éste | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/change-requests/00000000-0000-4000-8000-000000000001/approvals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "approvalStep": 1,
  "decision": "APPROVED",
  "decisionReason": "Texto descriptivo de ejemplo",
  "requiredApprovalSteps": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ApprovalResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ApprovalResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "changeRequestId": "00000000-0000-4000-8000-000000000001",
  "changeStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "approvedSteps": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `changeRequestId` | Sí | `string` | formato `uuid` | Identificador asociado a change request. | `00000000-0000-4000-8000-000000000001` |
| `changeStatusConceptId` | Sí | `string` | formato `uuid` | Estado del cambio tras la decisión | `00000000-0000-4000-8000-000000000001` |
| `approvedSteps` | Sí | `number` | Sin restricción adicional declarada | Pasos aprobados hasta ahora | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CHANGE_APPROVER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ese aprobador ya votó en este paso | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La solicitud ya no admite decisiones | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | Quien solicita el cambio no puede aprobarlo | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El paso anterior todavía no está aprobado | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/change-requests/{id}/approvals"
}
```

---

## 10. POST /ops/deployments

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Ejecutar un despliegue
- **Operation ID:** `PlatformOpsController_createDeployment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.createDeployment](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Exige cambio aprobado, revisión de preparación con "go" en producción y ausencia de congelamiento.


### Descripción del sistema

NestJS resuelve `POST /ops/deployments` en `PlatformOpsController_createDeployment`. El controlador delega en `OpsReleasesService.createDeployment`. Valida el body como `CreateDeploymentDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeploymentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDeploymentDto`; los campos opcionales se omiten.

```http
POST /ops/deployments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "changeRequestId": "00000000-0000-4000-8000-000000000001",
  "artifactId": "00000000-0000-4000-8000-000000000001",
  "environment": "DEVELOPMENT",
  "strategy": "ROLLING"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `RELEASE_MANAGER`, `DEPLOY_PIPELINE`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `changeRequestId` | Sí | `string` | formato `uuid` | Cambio aprobado que lo habilita | `00000000-0000-4000-8000-000000000001` |
| `artifactId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `environment` | Sí | `string` | valores: `DEVELOPMENT`, `STAGING`, `PRODUCTION` | Sin descripción específica en el contrato OpenAPI. | `DEVELOPMENT` |
| `strategy` | Sí | `string` | valores: `ROLLING`, `BLUE_GREEN`, `CANARY`, `RECREATE` | Sin descripción específica en el contrato OpenAPI. | `ROLLING` |
| `gitRef` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `outcome` | No | `string` | valores: `SUCCEEDED`, `FAILED` | Desenlace si el pipeline ya terminó; si falta, queda en curso | `SUCCEEDED` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/deployments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "changeRequestId": "00000000-0000-4000-8000-000000000001",
  "artifactId": "00000000-0000-4000-8000-000000000001",
  "environment": "DEVELOPMENT",
  "strategy": "ROLLING",
  "gitRef": "valor-ejemplo",
  "outcome": "SUCCEEDED"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<DeploymentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeploymentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "deploymentNumber": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "isCurrent": true,
  "supersededDeploymentId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `deploymentNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de deployment number mantenido por la instancia. | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `isCurrent` | Sí | `boolean` | Sin restricción adicional declarada | true si pasa a ser el despliegue vigente del entorno | `true` |
| `supersededDeploymentId` | No | `string` | formato `uuid` | Despliegue que deja de ser vigente | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: RELEASE_MANAGER, DEPLOY_PIPELINE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | No se pudo asignar un número de despliegue libre | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El cambio no está aprobado | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El artefacto no está activo | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El artefacto pertenece a otro componente | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | Producción exige una revisión de preparación con decisión "go" | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | Los despliegues están congelados por agotamiento del error budget | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/deployments"
}
```

---

## 11. POST /ops/deployments/{id}/rollback

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Revertir un despliegue
- **Operation ID:** `PlatformOpsController_rollbackDeployment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.rollbackDeployment](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Crea un despliegue nuevo al artefacto estable anterior; el fallido queda revertido.


### Descripción del sistema

NestJS resuelve `POST /ops/deployments/{id}/rollback` en `PlatformOpsController_rollbackDeployment`. El controlador delega en `OpsReleasesService.rollbackDeployment`. Valida el body como `RollbackDeploymentDto` y consume `application/json`. El tipo de retorno estático es `Promise<RollbackResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RollbackDeploymentDto`; los campos opcionales se omiten.

```http
POST /ops/deployments/00000000-0000-4000-8000-000000000001/rollback HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SRE`, `RELEASE_MANAGER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | Sin restricción adicional declarada | Por qué se revierte | `Texto descriptivo de ejemplo` |
| `targetDeploymentId` | No | `string` | formato `uuid` | Despliegue estable al que volver; por defecto, el correcto anterior | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/deployments/00000000-0000-4000-8000-000000000001/rollback HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo",
  "targetDeploymentId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RollbackResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<RollbackResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RollbackResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "deploymentNumber": "valor-ejemplo",
  "rolledBackDeploymentId": "00000000-0000-4000-8000-000000000001",
  "artifactId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Despliegue de reversión creado | `00000000-0000-4000-8000-000000000001` |
| `deploymentNumber` | Sí | `string` | Sin restricción adicional declarada | Valor de deployment number mantenido por la instancia. | `valor-ejemplo` |
| `rolledBackDeploymentId` | Sí | `string` | formato `uuid` | Despliegue revertido | `00000000-0000-4000-8000-000000000001` |
| `artifactId` | Sí | `string` | formato `uuid` | Artefacto al que se vuelve | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SRE, RELEASE_MANAGER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | No se pudo asignar un número de despliegue libre | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El despliegue no está en un estado reversible | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El despliegue ya no es el vigente | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay un despliegue estable anterior al que volver | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 422 | `PRECONDITION_FAILED` | El destino de la reversión es de otro componente o entorno | Excepción explícita en src/modules/platform_ops/services/ops-releases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/deployments/{id}/rollback"
}
```

---

## 12. POST /ops/error-budget/{policyId}/burn-events

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Registrar la quema del presupuesto de error
- **Operation ID:** `PlatformOpsController_recordBurnEvent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.recordBurnEvent](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Agotarlo con la política puesta a congelar bloquea los despliegues.


### Descripción del sistema

NestJS resuelve `POST /ops/error-budget/{policyId}/burn-events` en `PlatformOpsController_recordBurnEvent`. El controlador delega en `OpsReliabilityService.recordBurnEvent`. Valida el body como `RecordBurnEventDto` y consume `application/json`. El tipo de retorno estático es `Promise<BurnEventResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `policyId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordBurnEventDto`; los campos opcionales se omiten.

```http
POST /ops/error-budget/00000000-0000-4000-8000-000000000001/burn-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "windowSeconds": "valor-ejemplo",
  "burnRate": "valor-ejemplo",
  "remainingBudgetPercent": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SRE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `policyId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `windowSeconds` | Sí | `string` | Sin restricción adicional declarada | Ventana evaluada en segundos; cadena por ser bigint | `valor-ejemplo` |
| `burnRate` | Sí | `string` | Sin restricción adicional declarada | Ritmo de consumo del presupuesto, como cadena decimal | `valor-ejemplo` |
| `remainingBudgetPercent` | Sí | `string` | Sin restricción adicional declarada | Presupuesto restante en porcentaje, como cadena decimal | `valor-ejemplo` |
| `actionTakenJson` | No | `object` | Sin restricción adicional declarada | Qué se hizo al detectarlo | `{}` |
| `healthIncidentId` | No | `string` | formato `uuid` | Incidente de fiabilidad asociado | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/error-budget/00000000-0000-4000-8000-000000000001/burn-events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "windowSeconds": "valor-ejemplo",
  "burnRate": "valor-ejemplo",
  "remainingBudgetPercent": "valor-ejemplo",
  "actionTakenJson": {},
  "healthIncidentId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<BurnEventResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BurnEventResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "deploymentFreezeActive": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `severityConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a severity concept. | `00000000-0000-4000-8000-000000000001` |
| `deploymentFreezeActive` | Sí | `boolean` | Sin restricción adicional declarada | true si a partir de ahora los despliegues quedan congelados | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La política no está activa | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | La política no tiene ninguna medición del objetivo sobre la que evaluar | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | El ritmo de quema no alcanza el umbral de aviso de la política | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/error-budget/{policyId}/burn-events"
}
```

---

## 13. POST /ops/health-checks/{id}/runs

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Registrar una corrida de health check
- **Operation ID:** `PlatformOpsController_recordHealthRun`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.recordHealthRun](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Alcanzar el umbral de fallos consecutivos abre el incidente, sin duplicarlo.


### Descripción del sistema

NestJS resuelve `POST /ops/health-checks/{id}/runs` en `PlatformOpsController_recordHealthRun`. El controlador delega en `OpsIncidentsService.recordHealthRun`. Valida el body como `RecordHealthRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<HealthRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordHealthRunDto`; los campos opcionales se omiten.

```http
POST /ops/health-checks/00000000-0000-4000-8000-000000000001/runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "PASS",
  "source": "SCHEDULER"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SRE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `PASS`, `WARN`, `FAIL`, `TIMEOUT`, `ERROR` | Sin descripción específica en el contrato OpenAPI. | `PASS` |
| `source` | Sí | `string` | valores: `SCHEDULER`, `PROBE`, `MANUAL` | Sin descripción específica en el contrato OpenAPI. | `SCHEDULER` |
| `latencyMs` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `httpStatus` | No | `number` | mínimo 100; máximo 599 | Sin descripción específica en el contrato OpenAPI. | `100` |
| `observedValue` | No | `string` | Sin restricción adicional declarada | Valor observado, como cadena para no perder precisión | `valor-ejemplo` |
| `message` | No | `string` | longitud máxima 1000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `deploymentId` | No | `string` | formato `uuid` | Despliegue bajo el que se observa | `00000000-0000-4000-8000-000000000001` |
| `startedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `finishedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/health-checks/00000000-0000-4000-8000-000000000001/runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "PASS",
  "source": "SCHEDULER",
  "latencyMs": 1,
  "httpStatus": 100,
  "observedValue": "valor-ejemplo",
  "message": "valor-ejemplo",
  "deploymentId": "00000000-0000-4000-8000-000000000001",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "finishedAt": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<HealthRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HealthRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "consecutiveFailures": 1,
  "healthIncidentId": "00000000-0000-4000-8000-000000000001",
  "incidentOpened": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `consecutiveFailures` | Sí | `number` | Sin restricción adicional declarada | Fallos consecutivos acumulados tras esta corrida | `1` |
| `healthIncidentId` | No | `string` | formato `uuid` | Incidente abierto o ya vivo | `00000000-0000-4000-8000-000000000001` |
| `incidentOpened` | Sí | `boolean` | Sin restricción adicional declarada | true si esta corrida abrió el incidente | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El health check no está activo | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 422 | `PRECONDITION_FAILED` | El health check está deshabilitado | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/health-checks/{id}/runs"
}
```

---

## 14. PATCH /ops/incidents/{id}

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Mover el incidente, sumar respondientes y publicar comunicaciones
- **Operation ID:** `PlatformOpsController_updateIncident`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.updateIncident](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Resolver exige causa raíz y descripción de la resolución.


### Descripción del sistema

NestJS resuelve `PATCH /ops/incidents/{id}` en `PlatformOpsController_updateIncident`. El controlador delega en `OpsIncidentsService.updateIncident`. Valida el body como `UpdateIncidentDto` y consume `application/json`. El tipo de retorno estático es `Promise<IncidentResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateIncidentDto`; los campos opcionales se omiten.

```http
PATCH /ops/incidents/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "transition": "ACKNOWLEDGE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `INCIDENT_COMMANDER`, `SRE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `transition` | Sí | `string` | valores: `ACKNOWLEDGE`, `MITIGATE`, `RESOLVE`, `UPDATE` | `UPDATE` sólo añade sin mover el estado | `ACKNOWLEDGE` |
| `summary` | No | `string` | longitud máxima 1000 | Qué se apunta en el timeline | `valor-ejemplo` |
| `rootCauseText` | No | `string` | Sin restricción adicional declarada | Causa raíz; obligatoria al resolver | `valor-ejemplo` |
| `resolutionText` | No | `string` | Sin restricción adicional declarada | Cómo se resolvió; obligatoria al resolver | `valor-ejemplo` |
| `responders` | No | `array<IncidentResponderDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"userId":"00000000-0000-4000-8000-000000000001","role":"COMMANDER","acknowledged":true}]` |
| `responders[].userId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `responders[].role` | No | `string` | valores: `COMMANDER`, `OPERATIONS`, `COMMUNICATIONS`, `SCRIBE` | Sin descripción específica en el contrato OpenAPI. | `COMMANDER` |
| `responders[].acknowledged` | No | `boolean` | Sin restricción adicional declarada | true si el respondiente ya acusó recibo | `true` |
| `communications` | No | `array<IncidentCommunicationDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"type":"STATUS_UPDATE","audience":"INTERNAL","messageText":"valor-ejemplo","channelReference":"valor-ejemplo"}]` |
| `communications[].type` | No | `string` | valores: `STATUS_UPDATE`, `ESCALATION`, `RESOLUTION` | Sin descripción específica en el contrato OpenAPI. | `STATUS_UPDATE` |
| `communications[].audience` | No | `string` | valores: `INTERNAL`, `CUSTOMERS`, `REGULATORS` | Sin descripción específica en el contrato OpenAPI. | `INTERNAL` |
| `communications[].messageText` | No | `string` | longitud máxima 4000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `communications[].channelReference` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /ops/incidents/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "transition": "ACKNOWLEDGE",
  "summary": "valor-ejemplo",
  "rootCauseText": "valor-ejemplo",
  "resolutionText": "valor-ejemplo",
  "responders": [
    {
      "userId": "00000000-0000-4000-8000-000000000001",
      "role": "COMMANDER",
      "acknowledged": true
    }
  ],
  "communications": [
    {
      "type": "STATUS_UPDATE",
      "audience": "INTERNAL",
      "messageText": "valor-ejemplo",
      "channelReference": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<IncidentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IncidentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "addedResponderIds": [
    "valor-ejemplo"
  ],
  "communicationIds": [
    "valor-ejemplo"
  ],
  "timelineEventIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `addedResponderIds` | Sí | `array<string>` | formato `uuid` | Respondientes añadidos | `["valor-ejemplo"]` |
| `communicationIds` | Sí | `array<string>` | formato `uuid` | Comunicaciones publicadas | `["valor-ejemplo"]` |
| `timelineEventIds` | Sí | `array<string>` | formato `uuid` | Entradas de timeline creadas | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: INCIDENT_COMMANDER, SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El incidente ya está resuelto | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 422 | `PRECONDITION_FAILED` | La transición no es válida desde el estado actual | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 422 | `PRECONDITION_FAILED` | Resolver exige causa raíz y descripción de la resolución | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/incidents/{id}"
}
```

---

## 15. POST /ops/incidents/{id}/postmortem

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Abrir el postmortem del incidente resuelto
- **Operation ID:** `PlatformOpsController_openPostmortem`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.openPostmortem](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Cada acción entra además al backlog de mejoras para su seguimiento.


### Descripción del sistema

NestJS resuelve `POST /ops/incidents/{id}/postmortem` en `PlatformOpsController_openPostmortem`. El controlador delega en `OpsIncidentsService.openPostmortem`. Valida el body como `OpenPostmortemDto` y consume `application/json`. El tipo de retorno estático es `Promise<PostmortemResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `OpenPostmortemDto`; los campos opcionales se omiten.

```http
POST /ops/incidents/00000000-0000-4000-8000-000000000001/postmortem HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "title": "valor-ejemplo",
  "ownerUserId": "00000000-0000-4000-8000-000000000001",
  "actionItems": [
    {
      "actionCode": "CODIGO_EJEMPLO",
      "description": "Texto descriptivo de ejemplo",
      "actionType": "PREVENTIVE",
      "ownerUserId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SRE`, `INCIDENT_COMMANDER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `title` | Sí | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `ownerUserId` | Sí | `string` | formato `uuid` | Quién conduce el postmortem | `00000000-0000-4000-8000-000000000001` |
| `impactSummary` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `detectionSummary` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `responseSummary` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `rootCauseSummary` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `contributingFactorsJson` | No | `object` | Sin restricción adicional declarada | Factores contribuyentes | `{}` |
| `lessonsLearned` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `actionItems` | Sí | `array<ActionItemDto>` | mínimo 1 elemento(s) | Un postmortem sin acciones no cambia nada | `[{"actionCode":"CODIGO_EJEMPLO","description":"Texto descriptivo de ejemplo","actionType":"PREVENTIVE","ownerUserId":"00000000-0000-4000-8000-000000000001","dueAt":"2026-07-31T12:00:00.000Z","priority":"MEDIUM"}]` |
| `actionItems[].actionCode` | Sí | `string` | longitud máxima 50 | Código de la acción, único en el postmortem | `CODIGO_EJEMPLO` |
| `actionItems[].description` | Sí | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `actionItems[].actionType` | Sí | `string` | valores: `PREVENTIVE`, `CORRECTIVE`, `DETECTIVE`, `PROCESS` | Sin descripción específica en el contrato OpenAPI. | `PREVENTIVE` |
| `actionItems[].ownerUserId` | Sí | `string` | formato `uuid` | Quién responde de la acción | `00000000-0000-4000-8000-000000000001` |
| `actionItems[].dueAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `actionItems[].priority` | No | `string` | valores: `LOW`, `MEDIUM`, `HIGH` | Sin descripción específica en el contrato OpenAPI. | `MEDIUM` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/incidents/00000000-0000-4000-8000-000000000001/postmortem HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "title": "valor-ejemplo",
  "ownerUserId": "00000000-0000-4000-8000-000000000001",
  "impactSummary": "valor-ejemplo",
  "detectionSummary": "valor-ejemplo",
  "responseSummary": "valor-ejemplo",
  "rootCauseSummary": "valor-ejemplo",
  "contributingFactorsJson": {},
  "lessonsLearned": "valor-ejemplo",
  "actionItems": [
    {
      "actionCode": "CODIGO_EJEMPLO",
      "description": "Texto descriptivo de ejemplo",
      "actionType": "PREVENTIVE",
      "ownerUserId": "00000000-0000-4000-8000-000000000001",
      "dueAt": "2026-07-31T12:00:00.000Z",
      "priority": "MEDIUM"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<PostmortemResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PostmortemResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "actionItemIds": [
    "valor-ejemplo"
  ],
  "improvementItemIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `actionItemIds` | Sí | `array<string>` | formato `uuid` | Valor de action item ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `improvementItemIds` | Sí | `array<string>` | formato `uuid` | Mejoras abiertas para seguimiento | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SRE, INCIDENT_COMMANDER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El incidente ya tiene postmortem | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El incidente todavía no está resuelto | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 422 | `PRECONDITION_FAILED` | El código de acción está repetido | Excepción explícita en src/modules/platform_ops/services/ops-incidents.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/incidents/{id}/postmortem"
}
```

---

## 16. POST /ops/readiness-reviews/{id}/complete

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Cerrar la revisión de preparación con su decisión
- **Operation ID:** `PlatformOpsController_completeReadinessReview`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.completeReadinessReview](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Un hallazgo crítico o alto sin resolver impide el "go".


### Descripción del sistema

NestJS resuelve `POST /ops/readiness-reviews/{id}/complete` en `PlatformOpsController_completeReadinessReview`. El controlador delega en `OpsPracticesService.completeReadinessReview`. Valida el body como `CompleteReadinessReviewDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReadinessReviewResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CompleteReadinessReviewDto`; los campos opcionales se omiten.

```http
POST /ops/readiness-reviews/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "GO",
  "improvementOwnerUserId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `RELEASE_MANAGER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `GO`, `NO_GO` | Sin descripción específica en el contrato OpenAPI. | `GO` |
| `resolvedFindings` | No | `array<ResolvedFindingDto>` | Sin restricción adicional declarada | Hallazgos que se cierran | `[{"findingId":"00000000-0000-4000-8000-000000000001","evidenceJson":{}}]` |
| `resolvedFindings[].findingId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `resolvedFindings[].evidenceJson` | No | `object` | Sin restricción adicional declarada | Evidencia del cierre | `{}` |
| `evidenceJson` | No | `object` | Sin restricción adicional declarada | Evidencia de la revisión | `{}` |
| `improvementOwnerUserId` | Sí | `string` | formato `uuid` | Quién responde de los hallazgos que quedan abiertos | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/readiness-reviews/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "GO",
  "resolvedFindings": [
    {
      "findingId": "00000000-0000-4000-8000-000000000001",
      "evidenceJson": {}
    }
  ],
  "evidenceJson": {},
  "improvementOwnerUserId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ReadinessReviewResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReadinessReviewResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "decisionConceptId": "00000000-0000-4000-8000-000000000001",
  "resolvedCount": 1,
  "improvementItemIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `decisionConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a decision concept. | `00000000-0000-4000-8000-000000000001` |
| `resolvedCount` | Sí | `number` | Sin restricción adicional declarada | Hallazgos cerrados en esta operación | `1` |
| `improvementItemIds` | Sí | `array<string>` | formato `uuid` | Mejoras abiertas por lo que queda | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: RELEASE_MANAGER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El hallazgo no pertenece a esta revisión | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 409 | `CONFLICT` | El hallazgo ya no está abierto | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La revisión no está en curso | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 422 | `PRECONDITION_FAILED` | Quedan hallazgos críticos o altos sin resolver | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/readiness-reviews/{id}/complete"
}
```

---

## 17. POST /ops/resilience-exercises/{id}/complete

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Cerrar un ejercicio de resiliencia
- **Operation ID:** `PlatformOpsController_completeResilienceExercise`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.completeResilienceExercise](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

El resultado se deriva de comparar lo observado con el objetivo de recuperación.


### Descripción del sistema

NestJS resuelve `POST /ops/resilience-exercises/{id}/complete` en `PlatformOpsController_completeResilienceExercise`. El controlador delega en `OpsPracticesService.completeResilienceExercise`. Valida el body como `CompleteResilienceExerciseDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResilienceExerciseResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CompleteResilienceExerciseDto`; los campos opcionales se omiten.

```http
POST /ops/resilience-exercises/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "startedAt": "2026-07-31T12:00:00.000Z",
  "endedAt": "2026-07-31T12:00:00.000Z",
  "observedRtoSeconds": "900",
  "improvementOwnerUserId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SRE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `startedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `endedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `observedRtoSeconds` | Sí | `string` | Sin restricción adicional declarada | Tiempo de recuperación observado en segundos; cadena por ser bigint | `900` |
| `observedRpoSeconds` | No | `string` | Sin restricción adicional declarada | Pérdida de datos observada en segundos; cadena por ser bigint | `300` |
| `evidenceUri` | No | `string` | Sin restricción adicional declarada | URI de la evidencia | `valor-ejemplo` |
| `findingsJson` | No | `object` | Sin restricción adicional declarada | Hallazgos del ejercicio | `{}` |
| `improvementOwnerUserId` | Sí | `string` | formato `uuid` | Quién responde de la mejora si se incumple el objetivo | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/resilience-exercises/00000000-0000-4000-8000-000000000001/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "startedAt": "2026-07-31T12:00:00.000Z",
  "endedAt": "2026-07-31T12:00:00.000Z",
  "observedRtoSeconds": "900",
  "observedRpoSeconds": "300",
  "evidenceUri": "valor-ejemplo",
  "findingsJson": {},
  "improvementOwnerUserId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<ResilienceExerciseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResilienceExerciseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "resultConceptId": "00000000-0000-4000-8000-000000000001",
  "rtoBreached": true,
  "rpoBreached": true,
  "improvementItemId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `resultConceptId` | Sí | `string` | formato `uuid` | Resultado derivado de comparar con el objetivo | `00000000-0000-4000-8000-000000000001` |
| `rtoBreached` | Sí | `boolean` | Sin restricción adicional declarada | true si el RTO observado supera el objetivo | `true` |
| `rpoBreached` | Sí | `boolean` | Sin restricción adicional declarada | true si el RPO observado supera el objetivo | `true` |
| `improvementItemId` | No | `string` | formato `uuid` | Mejora abierta por el incumplimiento | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El ejercicio ya está cerrado | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El ejercicio termina antes de empezar | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 422 | `PRECONDITION_FAILED` | El componente no tiene objetivo de recuperación vigente | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/resilience-exercises/{id}/complete"
}
```

---

## 18. POST /ops/runbook-executions

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Registrar la ejecución de un runbook
- **Operation ID:** `PlatformOpsController_recordRunbookExecution`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.recordRunbookExecution](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Si se ejecutó en un incidente, queda también en su timeline.


### Descripción del sistema

NestJS resuelve `POST /ops/runbook-executions` en `PlatformOpsController_recordRunbookExecution`. El controlador delega en `OpsPracticesService.recordRunbookExecution`. Valida el body como `RecordRunbookExecutionDto` y consume `application/json`. El tipo de retorno estático es `Promise<RunbookExecutionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordRunbookExecutionDto`; los campos opcionales se omiten.

```http
POST /ops/runbook-executions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "runbookVersionId": "00000000-0000-4000-8000-000000000001",
  "mode": "MANUAL",
  "result": "SUCCESS",
  "startedAt": "2026-07-31T12:00:00.000Z"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SRE`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `runbookVersionId` | Sí | `string` | formato `uuid` | Versión ejecutada | `00000000-0000-4000-8000-000000000001` |
| `mode` | Sí | `string` | valores: `MANUAL`, `ASSISTED`, `AUTOMATED` | Sin descripción específica en el contrato OpenAPI. | `MANUAL` |
| `result` | Sí | `string` | valores: `SUCCESS`, `PARTIAL`, `FAILED`, `ABORTED` | Sin descripción específica en el contrato OpenAPI. | `SUCCESS` |
| `startedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `endedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `healthIncidentId` | No | `string` | formato `uuid` | Incidente en el que se ejecutó | `00000000-0000-4000-8000-000000000001` |
| `changeRequestId` | No | `string` | formato `uuid` | Cambio en el que se ejecutó | `00000000-0000-4000-8000-000000000001` |
| `executionLogUri` | No | `string` | Sin restricción adicional declarada | URI del log de ejecución | `valor-ejemplo` |
| `outputJson` | No | `object` | Sin restricción adicional declarada | Salida de la ejecución | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/runbook-executions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "runbookVersionId": "00000000-0000-4000-8000-000000000001",
  "mode": "MANUAL",
  "result": "SUCCESS",
  "startedAt": "2026-07-31T12:00:00.000Z",
  "endedAt": "2026-07-31T12:00:00.000Z",
  "healthIncidentId": "00000000-0000-4000-8000-000000000001",
  "changeRequestId": "00000000-0000-4000-8000-000000000001",
  "executionLogUri": "valor-ejemplo",
  "outputJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<RunbookExecutionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RunbookExecutionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "resultConceptId": "00000000-0000-4000-8000-000000000001",
  "timelineEventId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `resultConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a result concept. | `00000000-0000-4000-8000-000000000001` |
| `timelineEventId` | No | `string` | formato `uuid` | Entrada de timeline si la ejecución fue en un incidente | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ejecución termina antes de empezar | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/runbook-executions"
}
```

---

## 19. POST /ops/runbooks/{id}/versions

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Publicar una versión del runbook
- **Operation ID:** `PlatformOpsController_publishRunbookVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.publishRunbookVersion](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

La versión es inmutable y pasa a ser la vigente.


### Descripción del sistema

NestJS resuelve `POST /ops/runbooks/{id}/versions` en `PlatformOpsController_publishRunbookVersion`. El controlador delega en `OpsPracticesService.publishRunbookVersion`. Valida el body como `PublishRunbookVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<RunbookVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishRunbookVersionDto`; los campos opcionales se omiten.

```http
POST /ops/runbooks/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "contentMarkdown": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SRE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `contentMarkdown` | Sí | `string` | Sin restricción adicional declarada | Contenido del runbook en Markdown | `valor-ejemplo` |
| `automationDefinitionJson` | No | `object` | Sin restricción adicional declarada | Definición de la automatización asociada | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/runbooks/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "contentMarkdown": "valor-ejemplo",
  "automationDefinitionJson": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<RunbookVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RunbookVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "runbookId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Número de versión, correlativo dentro del runbook | `1` |
| `runbookId` | Sí | `string` | formato `uuid` | Versión que pasa a ser la vigente del runbook | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Esa versión del runbook ya existe | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El runbook no está activo | Excepción explícita en src/modules/platform_ops/services/ops-practices.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/runbooks/{id}/versions"
}
```

---

## 20. POST /ops/slo/{id}/measurements

- **Módulo:** `platform_ops`
- **Etiqueta OpenAPI:** `platform-ops`
- **Nombre:** Registrar la medición de una ventana del SLO
- **Operation ID:** `PlatformOpsController_recordSloMeasurement`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PlatformOpsController.recordSloMeasurement](../../src/modules/platform_ops/controllers/platform-ops.controller.ts)

### Descripción de negocio

Idempotente por fin de ventana: reintentar no duplica el histórico.


### Descripción del sistema

NestJS resuelve `POST /ops/slo/{id}/measurements` en `PlatformOpsController_recordSloMeasurement`. El controlador delega en `OpsReliabilityService.recordSloMeasurement`. Valida el body como `RecordSloMeasurementDto` y consume `application/json`. El tipo de retorno estático es `Promise<SloMeasurementResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordSloMeasurementDto`; los campos opcionales se omiten.

```http
POST /ops/slo/00000000-0000-4000-8000-000000000001/measurements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "windowStart": "2026-07-31T12:00:00.000Z",
  "windowEnd": "2026-07-31T12:00:00.000Z",
  "goodEvents": "valor-ejemplo",
  "totalEvents": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SRE`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `windowStart` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `windowEnd` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `goodEvents` | Sí | `string` | Sin restricción adicional declarada | Eventos buenos de la ventana; cadena por ser bigint | `valor-ejemplo` |
| `totalEvents` | Sí | `string` | Sin restricción adicional declarada | Eventos totales de la ventana; cadena por ser bigint | `valor-ejemplo` |
| `sourceReference` | No | `string` | longitud máxima 500 | De dónde salieron los datos | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /ops/slo/00000000-0000-4000-8000-000000000001/measurements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "windowStart": "2026-07-31T12:00:00.000Z",
  "windowEnd": "2026-07-31T12:00:00.000Z",
  "goodEvents": "valor-ejemplo",
  "totalEvents": "valor-ejemplo",
  "sourceReference": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |
| 504 | Operación completada correctamente. | `Promise<SloMeasurementResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SloMeasurementResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "attainedValue": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `attainedValue` | Sí | `string` | Sin restricción adicional declarada | Cumplimiento alcanzado, como cadena decimal | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | true si la ventana ya estaba medida y se devuelve la anterior | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SRE, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La ventana de medición está invertida | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | Una ventana sin eventos no mide nada | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | Los eventos buenos no pueden superar a los totales | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | El objetivo no está activo | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana precede a la vigencia del objetivo | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 422 | `PRECONDITION_FAILED` | La ventana excede la vigencia del objetivo | Excepción explícita en src/modules/platform_ops/services/ops-reliability.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/ops/slo/{id}/measurements"
}
```

---

