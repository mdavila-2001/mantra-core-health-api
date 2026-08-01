<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `graph_intelligence`

Referencia exhaustiva de 15 operación(es) del módulo `graph_intelligence`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `graph_intelligence`
- **Controladores:** `GraphProjectionController`, `GraphQueryController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /graph/access-scopes](#1-post-graph-access-scopes) — Definir un alcance de acceso al grafo
2. [PATCH /graph/access-scopes/{id}](#2-patch-graph-access-scopes-id) — Ajustar o suspender el alcance de acceso
3. [POST /graph/analytics/community-detection](#3-post-graph-analytics-community-detection) — Registrar las comunidades detectadas
4. [POST /graph/analytics/risk-scoring](#4-post-graph-analytics-risk-scoring) — Registrar puntajes de riesgo por nodo
5. [POST /graph/deletion-jobs](#5-post-graph-deletion-jobs) — Propagar el borrado al grafo (derecho al olvido)
6. [POST /graph/edges/{id}/expire](#6-post-graph-edges-id-expire) — Expirar la arista y decaer su confianza
7. [POST /graph/paths](#7-post-graph-paths) — Buscar el camino entre dos nodos
8. [POST /graph/projection-definitions/{id}/runs](#8-post-graph-projection-definitions-id-runs) — Arrancar una corrida de proyección
9. [POST /graph/projection-runs/{id}/advance](#9-post-graph-projection-runs-id-advance) — Avanzar el checkpoint de la corrida
10. [POST /graph/projections/edges/upsert](#10-post-graph-projections-edges-upsert) — Proyectar una arista con su evidencia
11. [POST /graph/projections/nodes/upsert](#11-post-graph-projections-nodes-upsert) — Proyectar un nodo y sus identificadores
12. [POST /graph/projections/reconcile](#12-post-graph-projections-reconcile) — Reconciliar la versión canónica del nodo
13. [PATCH /graph/rule-hits/{id}](#13-patch-graph-rule-hits-id) — Mover el hallazgo por su triage
14. [POST /graph/rules/{id}/evaluate](#14-post-graph-rules-id-evaluate) — Registrar los hallazgos de una regla
15. [POST /graph/traverse](#15-post-graph-traverse) — Recorrer el grafo desde un nodo

---

## 1. POST /graph/access-scopes

- **Módulo:** `graph_intelligence`
- **Etiqueta OpenAPI:** `graph_intelligence`
- **Nombre:** Definir un alcance de acceso al grafo
- **Operation ID:** `GraphQueryController_defineAccessScope`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GraphQueryController.defineAccessScope](../../src/modules/graph_intelligence/controllers/graph-query.controller.ts)

### Descripción de negocio

Acota tipos de nodo, tipos de relación, propósitos de uso y profundidad máxima.

Contexto declarado en el controlador: UC-61-04 (alta).

### Descripción del sistema

NestJS resuelve `POST /graph/access-scopes` en `GraphQueryController_defineAccessScope`. El controlador delega en `GraphTraversalService.defineAccessScope`. Valida el body como `DefineAccessScopeDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccessScopeResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DefineAccessScopeDto`; los campos opcionales se omiten.

```http
POST /graph/access-scopes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "allowedNodeTypes": [
    "valor-ejemplo"
  ],
  "allowedRelationshipTypes": [
    "valor-ejemplo"
  ],
  "purposeOfUseCodes": [
    "CODIGO_EJEMPLO"
  ],
  "maxHops": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_GOVERNANCE_ADMIN`, `COMPLIANCE_OFFICER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `scopeCode` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `allowedNodeTypes` | Sí | `array<string>` | mínimo 1 elemento(s) | Tipos de nodo visitables | `["valor-ejemplo"]` |
| `allowedRelationshipTypes` | Sí | `array<string>` | mínimo 1 elemento(s) | Tipos de relación recorribles | `["valor-ejemplo"]` |
| `purposeOfUseCodes` | Sí | `array<string>` | mínimo 1 elemento(s) | Propósitos de uso admitidos | `["CODIGO_EJEMPLO"]` |
| `maxHops` | Sí | `number` | mínimo 1; máximo 6 | Profundidad máxima | `1` |
| `requiresPatientContext` | No | `boolean` | Sin restricción adicional declarada | Si el traversal exige declarar el paciente sobre el que se hace | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /graph/access-scopes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "allowedNodeTypes": [
    "valor-ejemplo"
  ],
  "allowedRelationshipTypes": [
    "valor-ejemplo"
  ],
  "purposeOfUseCodes": [
    "CODIGO_EJEMPLO"
  ],
  "maxHops": 1,
  "requiresPatientContext": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccessScopeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "maxHops": 1,
  "state": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `scopeCode` | Sí | `string` | Sin restricción adicional declarada | Valor de scope code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `maxHops` | Sí | `number` | Sin restricción adicional declarada | Valor de max hops mantenido por la instancia. | `1` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_GOVERNANCE_ADMIN, COMPLIANCE_OFFICER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un alcance con ese código para el tenant. | Excepción explícita en src/modules/graph_intelligence/services/graph-traversal.service.ts |
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
  "path": "/graph/access-scopes"
}
```

---

## 2. PATCH /graph/access-scopes/{id}

- **Módulo:** `graph_intelligence`
- **Etiqueta OpenAPI:** `graph_intelligence`
- **Nombre:** Ajustar o suspender el alcance de acceso
- **Operation ID:** `GraphQueryController_updateAccessScope`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GraphQueryController.updateAccessScope](../../src/modules/graph_intelligence/controllers/graph-query.controller.ts)

### Descripción de negocio

Cualquier cambio publica el evento que invalida las cachés de sesión.

Contexto declarado en el controlador: UC-61-04 (cambio).

### Descripción del sistema

NestJS resuelve `PATCH /graph/access-scopes/{id}` en `GraphQueryController_updateAccessScope`. El controlador delega en `GraphTraversalService.updateAccessScope`. Valida el body como `UpdateAccessScopeDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccessScopeResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateAccessScopeDto`; los campos opcionales se omiten.

```http
PATCH /graph/access-scopes/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_GOVERNANCE_ADMIN`, `COMPLIANCE_OFFICER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `state` | No | `string` | valores: `active`, `suspended` | Sin descripción específica en el contrato OpenAPI. | `active` |
| `allowedNodeTypes` | No | `array<string>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `allowedRelationshipTypes` | No | `array<string>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `purposeOfUseCodes` | No | `array<string>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["CODIGO_EJEMPLO"]` |
| `maxHops` | No | `number` | mínimo 1; máximo 6 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `requiresPatientContext` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /graph/access-scopes/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "state": "active",
  "allowedNodeTypes": [
    "valor-ejemplo"
  ],
  "allowedRelationshipTypes": [
    "valor-ejemplo"
  ],
  "purposeOfUseCodes": [
    "CODIGO_EJEMPLO"
  ],
  "maxHops": 1,
  "requiresPatientContext": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AccessScopeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccessScopeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "maxHops": 1,
  "state": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `scopeCode` | Sí | `string` | Sin restricción adicional declarada | Valor de scope code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `maxHops` | Sí | `number` | Sin restricción adicional declarada | Valor de max hops mantenido por la instancia. | `1` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_GOVERNANCE_ADMIN, COMPLIANCE_OFFICER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Alcance de acceso no encontrado. | Excepción explícita en src/modules/graph_intelligence/services/graph-traversal.service.ts |
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
  "path": "/graph/access-scopes/{id}"
}
```

---

## 3. POST /graph/analytics/community-detection

- **Módulo:** `graph_intelligence`
- **Etiqueta OpenAPI:** `graph_intelligence`
- **Nombre:** Registrar las comunidades detectadas
- **Operation ID:** `GraphQueryController_detectCommunities`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GraphQueryController.detectCommunities](../../src/modules/graph_intelligence/controllers/graph-query.controller.ts)

### Descripción de negocio

El resultado de una versión de algoritmo se reemplaza entero; las versiones conviven.


### Descripción del sistema

NestJS resuelve `POST /graph/analytics/community-detection` en `GraphQueryController_detectCommunities`. El controlador delega en `GraphAnalyticsService.detectCommunities`. Valida el body como `DetectCommunitiesDto` y consume `application/json`. El tipo de retorno estático es `Promise<CommunitiesResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `DetectCommunitiesDto`; los campos opcionales se omiten.

```http
POST /graph/analytics/community-detection HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "communityType": "valor-ejemplo",
  "algorithmVersion": "valor-ejemplo",
  "communities": [
    {
      "memberNodeIds": [
        "00000000-0000-4000-8000-000000000001"
      ],
      "score": 1
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `GRAPH_ANALYTICS_WORKER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `communityType` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `algorithmVersion` | Sí | `string` | longitud máxima 50 | Versión del algoritmo que produjo el resultado | `valor-ejemplo` |
| `communities` | Sí | `array<CommunityInputDto>` | mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"memberNodeIds":["00000000-0000-4000-8000-000000000001"],"score":1}]` |
| `communities[].memberNodeIds` | Sí | `array<string>` | formato `uuid`; mínimo 1 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |
| `communities[].score` | Sí | `number` | mínimo 0; máximo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /graph/analytics/community-detection HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "communityType": "valor-ejemplo",
  "algorithmVersion": "valor-ejemplo",
  "communities": [
    {
      "memberNodeIds": [
        "00000000-0000-4000-8000-000000000001"
      ],
      "score": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CommunitiesResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CommunitiesResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CommunitiesResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CommunitiesResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CommunitiesResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CommunitiesResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CommunitiesResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CommunitiesResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CommunitiesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CommunitiesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "communityType": "valor-ejemplo",
  "algorithmVersion": "valor-ejemplo",
  "written": 1,
  "replaced": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `communityType` | Sí | `string` | Sin restricción adicional declarada | Valor de community type mantenido por la instancia. | `valor-ejemplo` |
| `algorithmVersion` | Sí | `string` | Sin restricción adicional declarada | Valor de algorithm version mantenido por la instancia. | `valor-ejemplo` |
| `written` | Sí | `number` | Sin restricción adicional declarada | Comunidades escritas | `1` |
| `replaced` | Sí | `number` | Sin restricción adicional declarada | Comunidades de la misma versión que se reemplazaron | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, GRAPH_ANALYTICS_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/graph/analytics/community-detection"
}
```

---

## 4. POST /graph/analytics/risk-scoring

- **Módulo:** `graph_intelligence`
- **Etiqueta OpenAPI:** `graph_intelligence`
- **Nombre:** Registrar puntajes de riesgo por nodo
- **Operation ID:** `GraphQueryController_computeRiskScores`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GraphQueryController.computeRiskScores](../../src/modules/graph_intelligence/controllers/graph-query.controller.ts)

### Descripción de negocio

Cada puntaje caduca; sólo se publica alerta por encima del umbral.


### Descripción del sistema

NestJS resuelve `POST /graph/analytics/risk-scoring` en `GraphQueryController_computeRiskScores`. El controlador delega en `GraphAnalyticsService.computeRiskScores`. Valida el body como `ComputeRiskScoresDto` y consume `application/json`. El tipo de retorno estático es `Promise<RiskScoresResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ComputeRiskScoresDto`; los campos opcionales se omiten.

```http
POST /graph/analytics/risk-scoring HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "riskType": "valor-ejemplo",
  "modelVersion": "valor-ejemplo",
  "scores": [
    {
      "nodeId": "00000000-0000-4000-8000-000000000001",
      "score": 1
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `GRAPH_ANALYTICS_WORKER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `riskType` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `modelVersion` | Sí | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `alertThreshold` | No | `number` | mínimo 0; máximo 1 | Por encima de este puntaje se publica alerta | `1` |
| `scores` | Sí | `array<RiskScoreInputDto>` | mínimo 1 elemento(s); máximo 1000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"nodeId":"00000000-0000-4000-8000-000000000001","score":1,"explanationRedacted":"valor-ejemplo"}]` |
| `scores[].nodeId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `scores[].score` | Sí | `number` | mínimo 0; máximo 1 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `scores[].explanationRedacted` | No | `string` | longitud máxima 1000 | Explicación ya redactada | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /graph/analytics/risk-scoring HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "riskType": "valor-ejemplo",
  "modelVersion": "valor-ejemplo",
  "alertThreshold": 1,
  "scores": [
    {
      "nodeId": "00000000-0000-4000-8000-000000000001",
      "score": 1,
      "explanationRedacted": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RiskScoresResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RiskScoresResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RiskScoresResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RiskScoresResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RiskScoresResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RiskScoresResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RiskScoresResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RiskScoresResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RiskScoresResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RiskScoresResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "riskType": "valor-ejemplo",
  "modelVersion": "valor-ejemplo",
  "created": 1,
  "updated": 1,
  "alerted": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `riskType` | Sí | `string` | Sin restricción adicional declarada | Valor de risk type mantenido por la instancia. | `valor-ejemplo` |
| `modelVersion` | Sí | `string` | Sin restricción adicional declarada | Valor de model version mantenido por la instancia. | `valor-ejemplo` |
| `created` | Sí | `number` | Sin restricción adicional declarada | Puntajes creados | `1` |
| `updated` | Sí | `number` | Sin restricción adicional declarada | Puntajes actualizados sobre uno anterior del mismo modelo | `1` |
| `alerted` | Sí | `number` | Sin restricción adicional declarada | Puntajes que superaron el umbral y generaron alerta | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, GRAPH_ANALYTICS_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Nodo no encontrado para ese tenant. | Excepción explícita en src/modules/graph_intelligence/services/graph-analytics.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No se puntúa un nodo que ya no está activo. | Excepción explícita en src/modules/graph_intelligence/services/graph-analytics.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/graph/analytics/risk-scoring"
}
```

---

## 5. POST /graph/deletion-jobs

- **Módulo:** `graph_intelligence`
- **Etiqueta OpenAPI:** `graph_intelligence`
- **Nombre:** Propagar el borrado al grafo (derecho al olvido)
- **Operation ID:** `GraphQueryController_requestDeletion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GraphQueryController.requestDeletion](../../src/modules/graph_intelligence/controllers/graph-query.controller.ts)

### Descripción de negocio

Purga nodo, identificadores, aristas con su evidencia, riesgo, rutas cacheadas y la pertenencia a comunidades.


### Descripción del sistema

NestJS resuelve `POST /graph/deletion-jobs` en `GraphQueryController_requestDeletion`. El controlador delega en `GraphAnalyticsService.requestDeletion`. Valida el body como `RequestGraphDeletionDto` y consume `application/json`. El tipo de retorno estático es `Promise<GraphDeletionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RequestGraphDeletionDto`; los campos opcionales se omiten.

```http
POST /graph/deletion-jobs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `DATA_GOVERNANCE_ADMIN`, `SYSTEM`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sourceEntityType` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sourceEntityId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /graph/deletion-jobs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<GraphDeletionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<GraphDeletionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<GraphDeletionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<GraphDeletionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<GraphDeletionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<GraphDeletionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<GraphDeletionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<GraphDeletionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<GraphDeletionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GraphDeletionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "nodesDeleted": 1,
  "edgesDeleted": 1,
  "identifiersDeleted": 1,
  "riskScoresDeleted": 1,
  "communitiesUpdated": 1,
  "invalidatedPaths": 1,
  "duplicate": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `nodesDeleted` | Sí | `number` | Sin restricción adicional declarada | Valor de nodes deleted mantenido por la instancia. | `1` |
| `edgesDeleted` | Sí | `number` | Sin restricción adicional declarada | Valor de edges deleted mantenido por la instancia. | `1` |
| `identifiersDeleted` | Sí | `number` | Sin restricción adicional declarada | Identificadores hasheados purgados | `1` |
| `riskScoresDeleted` | Sí | `number` | Sin restricción adicional declarada | Puntajes de riesgo purgados | `1` |
| `communitiesUpdated` | Sí | `number` | Sin restricción adicional declarada | Comunidades de las que se depuró el nodo | `1` |
| `invalidatedPaths` | Sí | `number` | Sin restricción adicional declarada | Entradas de caché invalidadas | `1` |
| `duplicate` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si ya había un job vivo para esa entidad | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: DATA_GOVERNANCE_ADMIN, SYSTEM, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/graph/deletion-jobs"
}
```

---

## 6. POST /graph/edges/{id}/expire

- **Módulo:** `graph_intelligence`
- **Etiqueta OpenAPI:** `graph_intelligence`
- **Nombre:** Expirar la arista y decaer su confianza
- **Operation ID:** `GraphProjectionController_expireEdge`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GraphProjectionController.expireEdge](../../src/modules/graph_intelligence/controllers/graph-projection.controller.ts)

### Descripción de negocio

No borra: la relación existió. Deja de recorrerse e invalida las rutas cacheadas que pasaban por ella.


### Descripción del sistema

NestJS resuelve `POST /graph/edges/{id}/expire` en `GraphProjectionController_expireEdge`. El controlador delega en `GraphProjectionService.expireEdge`. Valida el body como `ExpireEdgeDto` y consume `application/json`. El tipo de retorno estático es `Promise<ExpireEdgeResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ExpireEdgeDto`; los campos opcionales se omiten.

```http
POST /graph/edges/00000000-0000-4000-8000-000000000001/expire HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "evidenceHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `GRAPH_PROJECTION_WORKER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `evidenceHash` | Sí | `string` | longitud máxima 200 | Hash del evento de cierre; deduplica el reenvío | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `sourceReference` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `confidenceDelta` | No | `number` | mínimo -1; máximo 0 | Cuánto baja la confianza al cerrar; nunca positivo | `-0.5` |
| `retired` | No | `boolean` | Sin restricción adicional declarada | Si la arista se retira en vez de expirar naturalmente | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /graph/edges/00000000-0000-4000-8000-000000000001/expire HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "evidenceHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "sourceReference": "valor-ejemplo",
  "confidenceDelta": -0.5,
  "retired": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ExpireEdgeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExpireEdgeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExpireEdgeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExpireEdgeResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ExpireEdgeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExpireEdgeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ExpireEdgeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExpireEdgeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExpireEdgeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExpireEdgeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExpireEdgeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "lifecycleState": "valor-ejemplo",
  "confidenceScore": 1,
  "invalidatedPaths": 1,
  "alreadyClosed": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `lifecycleState` | Sí | `string` | Sin restricción adicional declarada | Valor de lifecycle state mantenido por la instancia. | `valor-ejemplo` |
| `confidenceScore` | Sí | `number` | Sin restricción adicional declarada | Valor de confidence score mantenido por la instancia. | `1` |
| `invalidatedPaths` | Sí | `number` | Sin restricción adicional declarada | Entradas de caché de rutas invalidadas | `1` |
| `alreadyClosed` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si la arista ya estaba cerrada | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Arista no encontrada. | Excepción explícita en src/modules/graph_intelligence/services/graph-projection.service.ts |
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
  "path": "/graph/edges/{id}/expire"
}
```

---

## 7. POST /graph/paths

- **Módulo:** `graph_intelligence`
- **Etiqueta OpenAPI:** `graph_intelligence`
- **Nombre:** Buscar el camino entre dos nodos
- **Operation ID:** `GraphQueryController_findPath`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GraphQueryController.findPath](../../src/modules/graph_intelligence/controllers/graph-query.controller.ts)

### Descripción de negocio

La caché se consulta después de validar el alcance, nunca antes.

Contexto declarado en el controlador: UC-61-05 (ruta).

### Descripción del sistema

NestJS resuelve `POST /graph/paths` en `GraphQueryController_findPath`. El controlador delega en `GraphTraversalService.findPath`. Valida el body como `FindPathDto` y consume `application/json`. El tipo de retorno estático es `Promise<PathResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `FindPathDto`; los campos opcionales se omiten.

```http
POST /graph/paths HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "startNodeId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUse": "valor-ejemplo",
  "endNodeId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `GRAPH_ANALYST`, `API_CONSUMER`, `COMPLIANCE_OFFICER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `scopeCode` | Sí | `string` | longitud máxima 100 | Alcance de acceso bajo el que se recorre | `CODIGO_EJEMPLO` |
| `startNodeId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `purposeOfUse` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `relationshipFilter` | No | `array<string>` | Sin restricción adicional declarada | Filtro de tipos de relación | `["valor-ejemplo"]` |
| `maxHops` | No | `number` | mínimo 1; máximo 6 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `patientProfileId` | No | `string` | formato `uuid` | Paciente del contexto; obligatorio si el alcance lo exige | `00000000-0000-4000-8000-000000000001` |
| `endNodeId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /graph/paths HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "startNodeId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUse": "valor-ejemplo",
  "relationshipFilter": [
    "valor-ejemplo"
  ],
  "maxHops": 1,
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "endNodeId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PathResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PathResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PathResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PathResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PathResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PathResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PathResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PathResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PathResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PathResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "startNodeId": "00000000-0000-4000-8000-000000000001",
  "endNodeId": "00000000-0000-4000-8000-000000000001",
  "found": true,
  "pathNodes": [
    "valor-ejemplo"
  ],
  "pathEdges": [
    "valor-ejemplo"
  ],
  "fromCache": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `startNodeId` | Sí | `string` | formato `uuid` | Identificador asociado a start node. | `00000000-0000-4000-8000-000000000001` |
| `endNodeId` | Sí | `string` | formato `uuid` | Identificador asociado a end node. | `00000000-0000-4000-8000-000000000001` |
| `found` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si existe camino dentro del alcance | `true` |
| `pathNodes` | Sí | `array<string>` | formato `uuid` | Valor de path nodes mantenido por la instancia. | `["valor-ejemplo"]` |
| `pathEdges` | Sí | `array<string>` | formato `uuid` | Valor de path edges mantenido por la instancia. | `["valor-ejemplo"]` |
| `fromCache` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si la ruta salió de la caché | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GRAPH_ANALYST, API_CONSUMER, COMPLIANCE_OFFICER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Alcance de acceso no encontrado. | Excepción explícita en src/modules/graph_intelligence/services/graph-traversal.service.ts |
| 404 | `NOT_FOUND` | Nodo de partida no encontrado. | Excepción explícita en src/modules/graph_intelligence/services/graph-traversal.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El alcance de acceso no está activo. | Excepción explícita en src/modules/graph_intelligence/services/graph-traversal.service.ts |
| 422 | `PRECONDITION_FAILED` | El alcance no admite ese propósito de uso. | Excepción explícita en src/modules/graph_intelligence/services/graph-traversal.service.ts |
| 422 | `PRECONDITION_FAILED` | El alcance exige declarar el paciente del contexto. | Excepción explícita en src/modules/graph_intelligence/services/graph-traversal.service.ts |
| 422 | `PRECONDITION_FAILED` | El nodo de partida queda fuera del alcance de acceso. | Excepción explícita en src/modules/graph_intelligence/services/graph-traversal.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/graph/paths"
}
```

---

## 8. POST /graph/projection-definitions/{id}/runs

- **Módulo:** `graph_intelligence`
- **Etiqueta OpenAPI:** `graph_intelligence`
- **Nombre:** Arrancar una corrida de proyección
- **Operation ID:** `GraphProjectionController_startProjectionRun`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GraphProjectionController.startProjectionRun](../../src/modules/graph_intelligence/controllers/graph-projection.controller.ts)

### Descripción de negocio

Una sola corrida viva por definición; si ya hay una, se devuelve ésa.

Contexto declarado en el controlador: UC-61-03 (arranque).

### Descripción del sistema

NestJS resuelve `POST /graph/projection-definitions/{id}/runs` en `GraphProjectionController_startProjectionRun`. El controlador delega en `GraphProjectionService.startProjectionRun`. Valida el body como `StartProjectionRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<ProjectionRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `StartProjectionRunDto`; los campos opcionales se omiten.

```http
POST /graph/projection-definitions/00000000-0000-4000-8000-000000000001/runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `GRAPH_ANALYST`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sourceCheckpoint` | No | `string` | Sin restricción adicional declarada | Punto desde el que sigue la corrida; cadena por ser bigint | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /graph/projection-definitions/00000000-0000-4000-8000-000000000001/runs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceCheckpoint": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProjectionRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "sourceCheckpoint": "valor-ejemplo",
  "nodesWritten": "valor-ejemplo",
  "edgesWritten": "valor-ejemplo",
  "alreadyRunning": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `sourceCheckpoint` | No | `string` | Sin restricción adicional declarada | Valor de source checkpoint mantenido por la instancia. | `valor-ejemplo` |
| `nodesWritten` | Sí | `string` | Sin restricción adicional declarada | Valor de nodes written mantenido por la instancia. | `valor-ejemplo` |
| `edgesWritten` | Sí | `string` | Sin restricción adicional declarada | Valor de edges written mantenido por la instancia. | `valor-ejemplo` |
| `alreadyRunning` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si ya había una corrida viva y se devuelve ésa | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, GRAPH_ANALYST, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Definición de proyección no encontrada. | Excepción explícita en src/modules/graph_intelligence/services/graph-projection.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La definición de proyección no está activa. | Excepción explícita en src/modules/graph_intelligence/services/graph-projection.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/graph/projection-definitions/{id}/runs"
}
```

---

## 9. POST /graph/projection-runs/{id}/advance

- **Módulo:** `graph_intelligence`
- **Etiqueta OpenAPI:** `graph_intelligence`
- **Nombre:** Avanzar el checkpoint de la corrida
- **Operation ID:** `GraphProjectionController_advanceProjectionRun`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GraphProjectionController.advanceProjectionRun](../../src/modules/graph_intelligence/controllers/graph-projection.controller.ts)

### Descripción de negocio

El checkpoint es monótono: no puede retroceder.

Contexto declarado en el controlador: UC-61-03 (avance).

### Descripción del sistema

NestJS resuelve `POST /graph/projection-runs/{id}/advance` en `GraphProjectionController_advanceProjectionRun`. El controlador delega en `GraphProjectionService.advanceProjectionRun`. Valida el body como `AdvanceProjectionRunDto` y consume `application/json`. El tipo de retorno estático es `Promise<ProjectionRunResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AdvanceProjectionRunDto`; los campos opcionales se omiten.

```http
POST /graph/projection-runs/00000000-0000-4000-8000-000000000001/advance HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceCheckpoint": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `GRAPH_PROJECTION_WORKER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sourceCheckpoint` | Sí | `string` | Sin restricción adicional declarada | Nuevo punto alcanzado; cadena por ser bigint | `valor-ejemplo` |
| `nodesWritten` | No | `number` | mínimo 0; máximo 1000 | Sin descripción específica en el contrato OpenAPI. | `0` |
| `edgesWritten` | No | `number` | mínimo 0; máximo 1000 | Sin descripción específica en el contrato OpenAPI. | `0` |
| `finalBatch` | No | `boolean` | Sin restricción adicional declarada | Si este lote cierra la corrida | `false` |
| `failed` | No | `boolean` | Sin restricción adicional declarada | Cierra la corrida como fallida | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /graph/projection-runs/00000000-0000-4000-8000-000000000001/advance HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceCheckpoint": "valor-ejemplo",
  "nodesWritten": 0,
  "edgesWritten": 0,
  "finalBatch": false,
  "failed": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ProjectionRunResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProjectionRunResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "sourceCheckpoint": "valor-ejemplo",
  "nodesWritten": "valor-ejemplo",
  "edgesWritten": "valor-ejemplo",
  "alreadyRunning": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `sourceCheckpoint` | No | `string` | Sin restricción adicional declarada | Valor de source checkpoint mantenido por la instancia. | `valor-ejemplo` |
| `nodesWritten` | Sí | `string` | Sin restricción adicional declarada | Valor de nodes written mantenido por la instancia. | `valor-ejemplo` |
| `edgesWritten` | Sí | `string` | Sin restricción adicional declarada | Valor de edges written mantenido por la instancia. | `valor-ejemplo` |
| `alreadyRunning` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si ya había una corrida viva y se devuelve ésa | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Corrida de proyección no encontrada. | Excepción explícita en src/modules/graph_intelligence/services/graph-projection.service.ts |
| 409 | `CONFLICT` | El checkpoint no puede retroceder. | Excepción explícita en src/modules/graph_intelligence/services/graph-projection.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La corrida ya no está en marcha. | Excepción explícita en src/modules/graph_intelligence/services/graph-projection.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/graph/projection-runs/{id}/advance"
}
```

---

## 10. POST /graph/projections/edges/upsert

- **Módulo:** `graph_intelligence`
- **Etiqueta OpenAPI:** `graph_intelligence`
- **Nombre:** Proyectar una arista con su evidencia
- **Operation ID:** `GraphProjectionController_upsertEdge`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GraphProjectionController.upsertEdge](../../src/modules/graph_intelligence/controllers/graph-projection.controller.ts)

### Descripción de negocio

La confianza se calcula como base + suma de deltas, acotada a [0,1]; la evidencia repetida se descarta por su hash.


### Descripción del sistema

NestJS resuelve `POST /graph/projections/edges/upsert` en `GraphProjectionController_upsertEdge`. El controlador delega en `GraphProjectionService.upsertEdge`. Valida el body como `UpsertEdgeDto` y consume `application/json`. El tipo de retorno estático es `Promise<EdgeResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpsertEdgeDto`; los campos opcionales se omiten.

```http
POST /graph/projections/edges/upsert HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "fromNodeId": "00000000-0000-4000-8000-000000000001",
  "toNodeId": "00000000-0000-4000-8000-000000000001",
  "relationshipType": "valor-ejemplo",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `GRAPH_PROJECTION_WORKER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `fromNodeId` | Sí | `string` | formato `uuid` | Nodo origen, ya proyectado | `00000000-0000-4000-8000-000000000001` |
| `toNodeId` | Sí | `string` | formato `uuid` | Nodo destino, ya proyectado | `00000000-0000-4000-8000-000000000001` |
| `relationshipType` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `directionality` | No | `string` | valores: `directed`, `undirected` | Sin descripción específica en el contrato OpenAPI. | `directed` |
| `sourceEntityType` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sourceEntityId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `effectiveFrom` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `properties` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `evidence` | No | `array<EdgeEvidenceDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"evidenceType":"source_event","sourceReference":"valor-ejemplo","evidenceHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","observedAt":"2026-07-31T12:00:00.000Z","confidenceDelta":1}]` |
| `evidence[].evidenceType` | No | `string` | valores: `source_event`, `manual_assertion`, `inference`, `termination` | Sin descripción específica en el contrato OpenAPI. | `source_event` |
| `evidence[].sourceReference` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `evidence[].evidenceHash` | No | `string` | longitud máxima 200 | Hash de la evidencia; deduplica el reenvío | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `evidence[].observedAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `evidence[].confidenceDelta` | No | `number` | mínimo -1; máximo 1 | Cuánto sube o baja la confianza de la arista | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /graph/projections/edges/upsert HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "fromNodeId": "00000000-0000-4000-8000-000000000001",
  "toNodeId": "00000000-0000-4000-8000-000000000001",
  "relationshipType": "valor-ejemplo",
  "directionality": "directed",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001",
  "effectiveFrom": "2026-07-31T12:00:00.000Z",
  "properties": {},
  "evidence": [
    {
      "evidenceType": "source_event",
      "sourceReference": "valor-ejemplo",
      "evidenceHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "observedAt": "2026-07-31T12:00:00.000Z",
      "confidenceDelta": 1
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<EdgeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EdgeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EdgeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EdgeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EdgeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EdgeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EdgeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EdgeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EdgeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EdgeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "relationshipType": "valor-ejemplo",
  "confidenceScore": 1,
  "lifecycleState": "valor-ejemplo",
  "evidenceAdded": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `relationshipType` | Sí | `string` | Sin restricción adicional declarada | Valor de relationship type mantenido por la instancia. | `valor-ejemplo` |
| `confidenceScore` | Sí | `number` | Sin restricción adicional declarada | Valor de confidence score mantenido por la instancia. | `1` |
| `lifecycleState` | Sí | `string` | Sin restricción adicional declarada | Valor de lifecycle state mantenido por la instancia. | `valor-ejemplo` |
| `evidenceAdded` | Sí | `number` | Sin restricción adicional declarada | Evidencias nuevas añadidas; las repetidas se descartan | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Los dos extremos de la arista tienen que estar proyectados antes que ella. | Excepción explícita en src/modules/graph_intelligence/services/graph-projection.service.ts |
| 422 | `PRECONDITION_FAILED` | Una arista no puede cruzar dos tenants. | Excepción explícita en src/modules/graph_intelligence/services/graph-projection.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/graph/projections/edges/upsert"
}
```

---

## 11. POST /graph/projections/nodes/upsert

- **Módulo:** `graph_intelligence`
- **Etiqueta OpenAPI:** `graph_intelligence`
- **Nombre:** Proyectar un nodo y sus identificadores
- **Operation ID:** `GraphProjectionController_upsertNode`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GraphProjectionController.upsertNode](../../src/modules/graph_intelligence/controllers/graph-projection.controller.ts)

### Descripción de negocio

Idempotente por la clave de origen. Un evento con versión anterior se descarta (`stale`). Los identificadores entran sólo hasheados.


### Descripción del sistema

NestJS resuelve `POST /graph/projections/nodes/upsert` en `GraphProjectionController_upsertNode`. El controlador delega en `GraphProjectionService.upsertNode`. Valida el body como `UpsertNodeDto` y consume `application/json`. El tipo de retorno estático es `Promise<NodeResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpsertNodeDto`; los campos opcionales se omiten.

```http
POST /graph/projections/nodes/upsert HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "nodeType": "valor-ejemplo",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001",
  "sourceVersion": "valor-ejemplo",
  "displayLabelRedacted": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `GRAPH_PROJECTION_WORKER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `nodeType` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sourceEntityType` | Sí | `string` | longitud máxima 100 | Tabla canónica de la que se proyecta | `valor-ejemplo` |
| `sourceEntityId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sourceVersion` | Sí | `string` | Sin restricción adicional declarada | Versión canónica del evento; cadena por ser bigint. Un valor menor no se aplica. | `valor-ejemplo` |
| `displayLabelRedacted` | Sí | `string` | longitud máxima 300 | Etiqueta ya redactada; nunca el nombre completo | `valor-ejemplo` |
| `properties` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `securityLabels` | No | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `identifiers` | No | `array<NodeIdentifierDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"identifierSystem":"valor-ejemplo","identifierValueHash":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","identifierType":"valor-ejemplo","isPrimary":false}]` |
| `identifiers[].identifierSystem` | No | `string` | longitud máxima 100 | Sistema del identificador, p. ej. `DNI` | `valor-ejemplo` |
| `identifiers[].identifierValueHash` | No | `string` | longitud máxima 200 | Hash del identificador. **Nunca el valor en claro.** | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `identifiers[].identifierType` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `identifiers[].isPrimary` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /graph/projections/nodes/upsert HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "nodeType": "valor-ejemplo",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001",
  "sourceVersion": "valor-ejemplo",
  "displayLabelRedacted": "valor-ejemplo",
  "properties": {},
  "securityLabels": [
    "valor-ejemplo"
  ],
  "identifiers": [
    {
      "identifierSystem": "valor-ejemplo",
      "identifierValueHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "identifierType": "valor-ejemplo",
      "isPrimary": false
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<NodeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<NodeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<NodeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<NodeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<NodeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<NodeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<NodeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<NodeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<NodeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `NodeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "nodeType": "valor-ejemplo",
  "sourceVersion": "valor-ejemplo",
  "lifecycleState": "valor-ejemplo",
  "identifiersAdded": 1,
  "stale": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `nodeType` | Sí | `string` | Sin restricción adicional declarada | Valor de node type mantenido por la instancia. | `valor-ejemplo` |
| `sourceVersion` | Sí | `string` | Sin restricción adicional declarada | Valor de source version mantenido por la instancia. | `valor-ejemplo` |
| `lifecycleState` | Sí | `string` | Sin restricción adicional declarada | Valor de lifecycle state mantenido por la instancia. | `valor-ejemplo` |
| `identifiersAdded` | Sí | `number` | Sin restricción adicional declarada | Identificadores nuevos añadidos en esta llamada | `1` |
| `stale` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si el evento traía una versión anterior y se descartó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/graph/projections/nodes/upsert"
}
```

---

## 12. POST /graph/projections/reconcile

- **Módulo:** `graph_intelligence`
- **Etiqueta OpenAPI:** `graph_intelligence`
- **Nombre:** Reconciliar la versión canónica del nodo
- **Operation ID:** `GraphProjectionController_reconcileSourceVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GraphProjectionController.reconcileSourceVersion](../../src/modules/graph_intelligence/controllers/graph-projection.controller.ts)

### Descripción de negocio

Actualiza el nodo, invalida las rutas cacheadas y caduca sus puntajes de riesgo. Si el evento es un borrado, abre el job de purga.


### Descripción del sistema

NestJS resuelve `POST /graph/projections/reconcile` en `GraphProjectionController_reconcileSourceVersion`. El controlador delega en `GraphProjectionService.reconcileSourceVersion`. Valida el body como `ReconcileSourceVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReconcileResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReconcileSourceVersionDto`; los campos opcionales se omiten.

```http
POST /graph/projections/reconcile HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001",
  "sourceVersion": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `GRAPH_PROJECTION_WORKER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sourceEntityType` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sourceEntityId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sourceVersion` | Sí | `string` | Sin restricción adicional declarada | Versión canónica entrante; cadena por ser bigint | `valor-ejemplo` |
| `deleted` | No | `boolean` | Sin restricción adicional declarada | Si el evento es un borrado; crea el job de purga | `false` |
| `displayLabelRedacted` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `properties` | No | `object` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `securityLabels` | No | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /graph/projections/reconcile HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourceEntityType": "valor-ejemplo",
  "sourceEntityId": "00000000-0000-4000-8000-000000000001",
  "sourceVersion": "valor-ejemplo",
  "deleted": false,
  "displayLabelRedacted": "valor-ejemplo",
  "properties": {},
  "securityLabels": [
    "valor-ejemplo"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReconcileResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReconcileResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "batchId": "00000000-0000-4000-8000-000000000001",
  "itemsProcessed": 1,
  "discrepancies": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `batchId` | Sí | `string` | formato `uuid` | Identificador asociado a batch. | `00000000-0000-4000-8000-000000000001` |
| `itemsProcessed` | Sí | `number` | Sin restricción adicional declarada | Items procesados | `1` |
| `discrepancies` | Sí | `number` | Sin restricción adicional declarada | Items marcados como discrepancia | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, GRAPH_PROJECTION_WORKER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | El nodo no está proyectado. | Excepción explícita en src/modules/graph_intelligence/services/graph-projection.service.ts |
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
  "path": "/graph/projections/reconcile"
}
```

---

## 13. PATCH /graph/rule-hits/{id}

- **Módulo:** `graph_intelligence`
- **Etiqueta OpenAPI:** `graph_intelligence`
- **Nombre:** Mover el hallazgo por su triage
- **Operation ID:** `GraphQueryController_triageRuleHit`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GraphQueryController.triageRuleHit](../../src/modules/graph_intelligence/controllers/graph-query.controller.ts)

### Descripción de negocio

Un hallazgo cerrado no se reabre: si el patrón vuelve, la regla abre uno nuevo.


### Descripción del sistema

NestJS resuelve `PATCH /graph/rule-hits/{id}` en `GraphQueryController_triageRuleHit`. El controlador delega en `GraphAnalyticsService.triageRuleHit`. Valida el body como `TriageRuleHitDto` y consume `application/json`. El tipo de retorno estático es `Promise<RuleHitResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `TriageRuleHitDto`; los campos opcionales se omiten.

```http
PATCH /graph/rule-hits/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "open"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `COMPLIANCE_OFFICER`, `GRAPH_ANALYST`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `open`, `in_review`, `resolved`, `dismissed` | Sin descripción específica en el contrato OpenAPI. | `open` |
| `resolutionNote` | No | `string` | longitud máxima 1000 | Desenlace; queda en el evento publicado | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /graph/rule-hits/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "open",
  "resolutionNote": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RuleHitResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RuleHitResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RuleHitResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RuleHitResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RuleHitResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RuleHitResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RuleHitResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RuleHitResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RuleHitResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RuleHitResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RuleHitResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "resolvedAt": "2026-07-31T12:00:00.000Z",
  "unchanged": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `resolvedAt` | No | `string` | formato `date-time` | Valor de resolved at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `unchanged` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si el hallazgo ya estaba en ese estado | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: COMPLIANCE_OFFICER, GRAPH_ANALYST, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Hallazgo no encontrado. | Excepción explícita en src/modules/graph_intelligence/services/graph-analytics.service.ts |
| 409 | `CONFLICT` | Esa transición del hallazgo no está permitida. | Excepción explícita en src/modules/graph_intelligence/services/graph-analytics.service.ts |
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
  "path": "/graph/rule-hits/{id}"
}
```

---

## 14. POST /graph/rules/{id}/evaluate

- **Módulo:** `graph_intelligence`
- **Etiqueta OpenAPI:** `graph_intelligence`
- **Nombre:** Registrar los hallazgos de una regla
- **Operation ID:** `GraphQueryController_evaluateRule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GraphQueryController.evaluateRule](../../src/modules/graph_intelligence/controllers/graph-query.controller.ts)

### Descripción de negocio

Deduplica por (regla, nodo principal) mientras haya un hallazgo vivo; exige alcance de acceso activo.


### Descripción del sistema

NestJS resuelve `POST /graph/rules/{id}/evaluate` en `GraphQueryController_evaluateRule`. El controlador delega en `GraphAnalyticsService.evaluateRule`. Valida el body como `GraphIntelligenceEvaluateRuleDto` y consume `application/json`. El tipo de retorno estático es `Promise<EvaluateRuleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `GraphIntelligenceEvaluateRuleDto`; los campos opcionales se omiten.

```http
POST /graph/rules/00000000-0000-4000-8000-000000000001/evaluate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "matches": [
    {
      "primaryNodeId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `GRAPH_ANALYTICS_WORKER`, `COMPLIANCE_OFFICER`, `PLATFORM_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `scopeCode` | Sí | `string` | longitud máxima 100 | Alcance bajo el que se evaluó el traversal | `CODIGO_EJEMPLO` |
| `matches` | Sí | `array<RuleMatchDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"primaryNodeId":"00000000-0000-4000-8000-000000000001","relatedNodeIds":["00000000-0000-4000-8000-000000000001"],"evidenceEdgeIds":["00000000-0000-4000-8000-000000000001"]}]` |
| `matches[].primaryNodeId` | Sí | `string` | formato `uuid` | Nodo sobre el que se dispara el patrón | `00000000-0000-4000-8000-000000000001` |
| `matches[].relatedNodeIds` | No | `array<string>` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `["00000000-0000-4000-8000-000000000001"]` |
| `matches[].evidenceEdgeIds` | No | `array<string>` | formato `uuid` | Aristas que sustentan el patrón | `["00000000-0000-4000-8000-000000000001"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /graph/rules/00000000-0000-4000-8000-000000000001/evaluate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "matches": [
    {
      "primaryNodeId": "00000000-0000-4000-8000-000000000001",
      "relatedNodeIds": [
        "00000000-0000-4000-8000-000000000001"
      ],
      "evidenceEdgeIds": [
        "00000000-0000-4000-8000-000000000001"
      ]
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EvaluateRuleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EvaluateRuleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "graphRuleDefinitionId": "00000000-0000-4000-8000-000000000001",
  "severity": "valor-ejemplo",
  "hitsOpened": 1,
  "duplicatesSkipped": 1,
  "hitIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `graphRuleDefinitionId` | Sí | `string` | formato `uuid` | Identificador asociado a graph rule definition. | `00000000-0000-4000-8000-000000000001` |
| `severity` | Sí | `string` | Sin restricción adicional declarada | Valor de severity mantenido por la instancia. | `valor-ejemplo` |
| `hitsOpened` | Sí | `number` | Sin restricción adicional declarada | Hallazgos nuevos abiertos | `1` |
| `duplicatesSkipped` | Sí | `number` | Sin restricción adicional declarada | Coincidencias descartadas por tener ya un hallazgo vivo | `1` |
| `hitIds` | Sí | `array<string>` | formato `uuid` | Valor de hit ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, GRAPH_ANALYTICS_WORKER, COMPLIANCE_OFFICER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Definición de regla no encontrada. | Excepción explícita en src/modules/graph_intelligence/services/graph-analytics.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La definición de regla no está activa. | Excepción explícita en src/modules/graph_intelligence/services/graph-analytics.service.ts |
| 422 | `PRECONDITION_FAILED` | La regla tiene que evaluarse bajo un alcance de acceso activo. | Excepción explícita en src/modules/graph_intelligence/services/graph-analytics.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/graph/rules/{id}/evaluate"
}
```

---

## 15. POST /graph/traverse

- **Módulo:** `graph_intelligence`
- **Etiqueta OpenAPI:** `graph_intelligence`
- **Nombre:** Recorrer el grafo desde un nodo
- **Operation ID:** `GraphQueryController_traverse`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [GraphQueryController.traverse](../../src/modules/graph_intelligence/controllers/graph-query.controller.ts)

### Descripción de negocio

El scoping se aplica dentro del recorrido: un nodo fuera de alcance no se visita, así que tampoco se llega a lo que hay detrás.

Contexto declarado en el controlador: UC-61-05 (recorrido).

### Descripción del sistema

NestJS resuelve `POST /graph/traverse` en `GraphQueryController_traverse`. El controlador delega en `GraphTraversalService.traverse`. Valida el body como `TraverseDto` y consume `application/json`. El tipo de retorno estático es `Promise<TraverseResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `TraverseDto`; los campos opcionales se omiten.

```http
POST /graph/traverse HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "startNodeId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUse": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `GRAPH_ANALYST`, `API_CONSUMER`, `COMPLIANCE_OFFICER`, `PLATFORM_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `scopeCode` | Sí | `string` | longitud máxima 100 | Alcance de acceso bajo el que se recorre | `CODIGO_EJEMPLO` |
| `startNodeId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `purposeOfUse` | Sí | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `relationshipFilter` | No | `array<string>` | Sin restricción adicional declarada | Filtro de tipos de relación | `["valor-ejemplo"]` |
| `maxHops` | No | `number` | mínimo 1; máximo 6 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `patientProfileId` | No | `string` | formato `uuid` | Paciente del contexto; obligatorio si el alcance lo exige | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /graph/traverse HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scopeCode": "CODIGO_EJEMPLO",
  "startNodeId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUse": "valor-ejemplo",
  "relationshipFilter": [
    "valor-ejemplo"
  ],
  "maxHops": 1,
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TraverseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TraverseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<TraverseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<TraverseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TraverseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TraverseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TraverseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TraverseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TraverseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TraverseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "startNodeId": "00000000-0000-4000-8000-000000000001",
  "nodes": [
    {
      "nodeId": "00000000-0000-4000-8000-000000000001",
      "nodeType": "valor-ejemplo",
      "displayLabelRedacted": "valor-ejemplo",
      "depth": 1
    }
  ],
  "edgeCount": 1,
  "depthReached": 1,
  "truncated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `startNodeId` | Sí | `string` | formato `uuid` | Identificador asociado a start node. | `00000000-0000-4000-8000-000000000001` |
| `nodes` | Sí | `array<VisitedNodeDto>` | Sin restricción adicional declarada | Valor de nodes mantenido por la instancia. | `[{"nodeId":"00000000-0000-4000-8000-000000000001","nodeType":"valor-ejemplo","displayLabelRedacted":"valor-ejemplo","depth":1}]` |
| `nodes[].nodeId` | Sí | `string` | formato `uuid` | Identificador asociado a node. | `00000000-0000-4000-8000-000000000001` |
| `nodes[].nodeType` | Sí | `string` | Sin restricción adicional declarada | Valor de node type mantenido por la instancia. | `valor-ejemplo` |
| `nodes[].displayLabelRedacted` | Sí | `string` | Sin restricción adicional declarada | Valor de display label redacted mantenido por la instancia. | `valor-ejemplo` |
| `nodes[].depth` | Sí | `number` | Sin restricción adicional declarada | Saltos desde el nodo de partida | `1` |
| `edgeCount` | Sí | `number` | Sin restricción adicional declarada | Aristas recorridas | `1` |
| `depthReached` | Sí | `number` | Sin restricción adicional declarada | Profundidad efectiva alcanzada | `1` |
| `truncated` | Sí | `boolean` | Sin restricción adicional declarada | Verdadero si se alcanzó el tope de nodos y hay más | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: GRAPH_ANALYST, API_CONSUMER, COMPLIANCE_OFFICER, PLATFORM_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Alcance de acceso no encontrado. | Excepción explícita en src/modules/graph_intelligence/services/graph-traversal.service.ts |
| 404 | `NOT_FOUND` | Nodo de partida no encontrado. | Excepción explícita en src/modules/graph_intelligence/services/graph-traversal.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El alcance de acceso no está activo. | Excepción explícita en src/modules/graph_intelligence/services/graph-traversal.service.ts |
| 422 | `PRECONDITION_FAILED` | El alcance no admite ese propósito de uso. | Excepción explícita en src/modules/graph_intelligence/services/graph-traversal.service.ts |
| 422 | `PRECONDITION_FAILED` | El alcance exige declarar el paciente del contexto. | Excepción explícita en src/modules/graph_intelligence/services/graph-traversal.service.ts |
| 422 | `PRECONDITION_FAILED` | El nodo de partida queda fuera del alcance de acceso. | Excepción explícita en src/modules/graph_intelligence/services/graph-traversal.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/graph/traverse"
}
```

---

