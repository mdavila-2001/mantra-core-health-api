<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `identity_assurance`

Referencia exhaustiva de 25 operación(es) del módulo `identity_assurance`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `identity-assertions`, `identity-authorities`, `identity-checks`, `identity-manual-review`, `identity-policies`, `identity-self-service`, `identity-verification-cases`, `identity_assurance`
- **Controladores:** `IdentityAssertionsController`, `IdentityAuthoritiesController`, `IdentityCasesController`, `IdentityChecksController`, `IdentityManualReviewController`, `IdentityPoliciesController`, `IdentitySelfServiceController`, `IdentityWorkerController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /identity/assertions/{id}/revoke](#1-post-identity-assertions-id-revoke) — Revocar una aserción de identidad
2. [POST /identity/authorities](#2-post-identity-authorities) — Registrar una autoridad de identidad
3. [POST /identity/authorities/{id}/endpoints](#3-post-identity-authorities-id-endpoints) — Publicar un endpoint de verificación de la autoridad
4. [POST /identity/checks/{id}/attempts](#4-post-identity-checks-id-attempts) — Ejecutar un intento contra la autoridad externa (idempotente)
5. [POST /identity/checks/{id}/results](#5-post-identity-checks-id-results) — Registrar el resultado inmutable del check (con supersede)
6. [POST /identity/manual-review/{id}/decision](#6-post-identity-manual-review-id-decision) — Resolver una revisión manual (decisión)
7. [POST /identity/me/identity-verification](#7-post-identity-me-identity-verification) — Solicitar la verificación de la propia identidad (paciente)
8. [POST /identity/me/practitioner/identity-verification](#8-post-identity-me-practitioner-identity-verification) — Solicitar la verificación de la propia identidad (profesional)
9. [POST /identity/me/practitioner/license-verification](#9-post-identity-me-practitioner-license-verification) — Solicitar la verificación de la propia matrícula
10. [POST /identity/me/tenants/{tenantId}/verification](#10-post-identity-me-tenants-tenantid-verification) — Solicitar la verificación de una institución propia
11. [GET /identity/me/verification-cases](#11-get-identity-me-verification-cases) — Listar los casos de verificación propios
12. [GET /identity/me/verification-cases/{caseId}](#12-get-identity-me-verification-cases-caseid) — Consultar el estado de un caso propio
13. [GET /identity/me/verification-types](#13-get-identity-me-verification-types) — Listar los tipos de solicitud de verificación disponibles
14. [GET /identity/verification-cases](#14-get-identity-verification-cases) — Listar los casos que esperan revisión
15. [POST /identity/verification-cases](#15-post-identity-verification-cases) — Iniciar un caso de verificación de identidad
16. [POST /identity/verification-cases/{id}/assertions](#16-post-identity-verification-cases-id-assertions) — Emitir una aserción de identidad con nivel de aseguramiento
17. [POST /identity/verification-cases/{id}/checks:plan](#17-post-identity-verification-cases-id-checks-plan) — Planificar los checks requeridos del caso
18. [POST /identity/verification-cases/{id}/evidence](#18-post-identity-verification-cases-id-evidence) — Aportar evidencia documental bajo consentimiento
19. [POST /identity/verification-cases/{id}/fraud-signals](#19-post-identity-verification-cases-id-fraud-signals) — Detectar y registrar una señal de fraude
20. [POST /identity/verification-cases/{id}/manual-review](#20-post-identity-verification-cases-id-manual-review) — Escalar el caso a revisión manual
21. [POST /identity/verification-cases/expire-sweep](#21-post-identity-verification-cases-expire-sweep) — Expirar por lote los casos vencidos (job programado)
22. [POST /identity/verification-policies](#22-post-identity-verification-policies) — Crear una política de verificación de identidad (IAL/AAL)
23. [POST /internal/identity/checks/{id}/attempts](#23-post-internal-identity-checks-id-attempts) — Registrar el intento del worker contra la autoridad externa
24. [POST /internal/identity/checks/{id}/results](#24-post-internal-identity-checks-id-results) — Registrar el veredicto que devolvió la autoridad externa
25. [GET /internal/identity/checks/dispatchable](#25-get-internal-identity-checks-dispatchable) — Listar los checks que el worker debe atender en este tick

---

## 1. POST /identity/assertions/{id}/revoke

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-assertions`
- **Nombre:** Revocar una aserción de identidad
- **Operation ID:** `IdentityAssertionsController_revoke`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityAssertionsController.revoke](../../src/modules/identity_assurance/controllers/identity-assertions.controller.ts)

### Descripción de negocio

Revocar una aserción de identidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /identity/assertions/{id}/revoke` en `IdentityAssertionsController_revoke`. El controlador delega en `IdentityAssertionsService.revoke`. Valida el body como `RevokeAssertionDto` y consume `application/json`. El tipo de retorno estático es `Promise<AssertionRevokedResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RevokeAssertionDto`; los campos opcionales se omiten.

```http
POST /identity/assertions/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
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
| `revocationReasonConceptId` | No | `string` | formato `uuid` | Concepto: motivo de revocación (por defecto fraude) | `00000000-0000-4000-8000-000000000001` |
| `fraudSignalTypeConceptId` | No | `string` | formato `uuid` | Concepto: tipo de señal de fraude a derivar (si la revocación es por fraude) | `00000000-0000-4000-8000-000000000001` |
| `fraudSeverityConceptId` | No | `string` | formato `uuid` | Concepto: severidad de la señal derivada | `00000000-0000-4000-8000-000000000001` |
| `raiseFraudSignal` | No | `boolean` | Sin restricción adicional declarada | ¿Derivar una señal de fraude a partir de la revocación? | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/assertions/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "revocationReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "fraudSignalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "fraudSeverityConceptId": "00000000-0000-4000-8000-000000000001",
  "raiseFraudSignal": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AssertionRevokedResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AssertionRevokedResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AssertionRevokedResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AssertionRevokedResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AssertionRevokedResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AssertionRevokedResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AssertionRevokedResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AssertionRevokedResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AssertionRevokedResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AssertionRevokedResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AssertionRevokedResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "revokedAt": "2026-07-31T12:00:00.000Z",
  "caseStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `revokedAt` | Sí | `string` | formato `date-time` | Valor de revoked at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `caseStatus` | Sí | `string` | formato `uuid` | Valor de case status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Aserción de identidad no encontrada | Excepción explícita en src/modules/identity_assurance/services/identity-assertions.service.ts |
| 404 | `NOT_FOUND` | Caso de verificación no encontrado | Excepción explícita en src/modules/identity_assurance/services/identity-assertions.service.ts |
| 409 | `CONFLICT` | La aserción ya está revocada | Excepción explícita en src/modules/identity_assurance/services/identity-assertions.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Para derivar una señal de fraude se requieren tipo y severidad | Excepción explícita en src/modules/identity_assurance/services/identity-assertions.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/identity/assertions/{id}/revoke"
}
```

---

## 2. POST /identity/authorities

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-authorities`
- **Nombre:** Registrar una autoridad de identidad
- **Operation ID:** `IdentityAuthoritiesController_register`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityAuthoritiesController.register](../../src/modules/identity_assurance/controllers/identity-authorities.controller.ts)

### Descripción de negocio

Registrar una autoridad de identidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /identity/authorities` en `IdentityAuthoritiesController_register`. El controlador delega en `IdentityAuthoritiesService.registerAuthority`. Valida el body como `RegisterAuthorityDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthorityResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterAuthorityDto`; los campos opcionales se omiten.

```http
POST /identity/authorities HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "authorityCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "authorityTypeConceptId": "00000000-0000-4000-8000-000000000001"
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
| `tenantId` | Sí | `string` | formato `uuid` | Tenant propietario de la autoridad | `00000000-0000-4000-8000-000000000001` |
| `authorityCode` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único de la autoridad | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre legible de la autoridad | `Nombre de ejemplo` |
| `authorityTypeConceptId` | Sí | `string` | formato `uuid` | Concepto: tipo de autoridad | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Concepto: jurisdicción | `00000000-0000-4000-8000-000000000001` |
| `assuranceFrameworkConceptId` | No | `string` | formato `uuid` | Concepto: marco de aseguramiento (NIST/eIDAS) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/authorities HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "authorityCode": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "authorityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "assuranceFrameworkConceptId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuthorityResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthorityResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthorityResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthorityResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthorityResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthorityResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthorityResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthorityResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthorityResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthorityResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "authorityCode": "CODIGO_EJEMPLO",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `authorityCode` | Sí | `string` | Sin restricción adicional declarada | Valor de authority code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/identity/authorities"
}
```

---

## 3. POST /identity/authorities/{id}/endpoints

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-authorities`
- **Nombre:** Publicar un endpoint de verificación de la autoridad
- **Operation ID:** `IdentityAuthoritiesController_addEndpoint`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityAuthoritiesController.addEndpoint](../../src/modules/identity_assurance/controllers/identity-authorities.controller.ts)

### Descripción de negocio

Publicar un endpoint de verificación de la autoridad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /identity/authorities/{id}/endpoints` en `IdentityAuthoritiesController_addEndpoint`. El controlador delega en `IdentityAuthoritiesService.addEndpoint`. Valida el body como `CreateAuthorityEndpointDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuthorityEndpointResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAuthorityEndpointDto`; los campos opcionales se omiten.

```http
POST /identity/authorities/00000000-0000-4000-8000-000000000001/endpoints HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "integrationEndpointId": "00000000-0000-4000-8000-000000000001",
  "capabilityConceptId": "00000000-0000-4000-8000-000000000001"
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
| `integrationEndpointId` | Sí | `string` | formato `uuid` | Endpoint de integración subyacente | `00000000-0000-4000-8000-000000000001` |
| `capabilityConceptId` | Sí | `string` | formato `uuid` | Concepto: capacidad del endpoint | `00000000-0000-4000-8000-000000000001` |
| `assuranceLevelConceptId` | No | `string` | formato `uuid` | Concepto: nivel de aseguramiento del endpoint | `00000000-0000-4000-8000-000000000001` |
| `requestContractVersion` | No | `string` | longitud máxima 50 | Versión del contrato de request | `valor-ejemplo` |
| `responseContractVersion` | No | `string` | longitud máxima 50 | Versión del contrato de response | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/authorities/00000000-0000-4000-8000-000000000001/endpoints HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "integrationEndpointId": "00000000-0000-4000-8000-000000000001",
  "capabilityConceptId": "00000000-0000-4000-8000-000000000001",
  "assuranceLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "requestContractVersion": "valor-ejemplo",
  "responseContractVersion": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuthorityEndpointResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuthorityEndpointResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuthorityEndpointResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuthorityEndpointResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AuthorityEndpointResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuthorityEndpointResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuthorityEndpointResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuthorityEndpointResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuthorityEndpointResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuthorityEndpointResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuthorityEndpointResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "identityAuthorityId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `identityAuthorityId` | Sí | `string` | formato `uuid` | Identificador asociado a identity authority. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Autoridad de identidad no encontrada | Excepción explícita en src/modules/identity_assurance/services/identity-authorities.service.ts |
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
  "path": "/identity/authorities/{id}/endpoints"
}
```

---

## 4. POST /identity/checks/{id}/attempts

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-checks`
- **Nombre:** Ejecutar un intento contra la autoridad externa (idempotente)
- **Operation ID:** `IdentityChecksController_recordAttempt`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityChecksController.recordAttempt](../../src/modules/identity_assurance/controllers/identity-checks.controller.ts)

### Descripción de negocio

Ejecutar un intento contra la autoridad externa (idempotente). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /identity/checks/{id}/attempts` en `IdentityChecksController_recordAttempt`. El controlador delega en `IdentityChecksService.recordAttempt`. Valida el body como `IdentityAssuranceRecordAttemptDto` y consume `application/json`. El tipo de retorno estático es `Promise<AttemptResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IdentityAssuranceRecordAttemptDto`; los campos opcionales se omiten.

```http
POST /identity/checks/00000000-0000-4000-8000-000000000001/attempts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "identityAuthorityEndpointId": "00000000-0000-4000-8000-000000000001"
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
| `identityAuthorityEndpointId` | Sí | `string` | formato `uuid` | Endpoint de autoridad usado en el intento | `00000000-0000-4000-8000-000000000001` |
| `outcome` | No | `string` | valores: `SUCCESS`, `PENDING`, `FAILED` | Resultado técnico del intento | `SUCCESS` |
| `idempotencyKey` | No | `string` | longitud máxima 200 | Clave de idempotencia del intento | `valor-ejemplo` |
| `requestMessageId` | No | `string` | formato `uuid` | Mensaje saliente correlacionado | `00000000-0000-4000-8000-000000000001` |
| `responseMessageId` | No | `string` | formato `uuid` | Mensaje entrante correlacionado | `00000000-0000-4000-8000-000000000001` |
| `technicalErrorCode` | No | `string` | longitud máxima 100 | Código de error técnico | `CODIGO_EJEMPLO` |
| `retryEligible` | No | `boolean` | Sin restricción adicional declarada | ¿Es elegible para reintento? | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/checks/00000000-0000-4000-8000-000000000001/attempts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "identityAuthorityEndpointId": "00000000-0000-4000-8000-000000000001",
  "outcome": "SUCCESS",
  "idempotencyKey": "valor-ejemplo",
  "requestMessageId": "00000000-0000-4000-8000-000000000001",
  "responseMessageId": "00000000-0000-4000-8000-000000000001",
  "technicalErrorCode": "CODIGO_EJEMPLO",
  "retryEligible": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AttemptResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AttemptResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "attemptNumber": 1,
  "outcome": "00000000-0000-4000-8000-000000000001",
  "checkStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `attemptNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de attempt number mantenido por la instancia. | `1` |
| `outcome` | Sí | `string` | formato `uuid` | Valor de outcome mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `checkStatus` | Sí | `string` | formato `uuid` | Valor de check status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Check de identidad no encontrado | Excepción explícita en src/modules/identity_assurance/services/identity-checks.service.ts |
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
  "path": "/identity/checks/{id}/attempts"
}
```

---

## 5. POST /identity/checks/{id}/results

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-checks`
- **Nombre:** Registrar el resultado inmutable del check (con supersede)
- **Operation ID:** `IdentityChecksController_recordResult`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityChecksController.recordResult](../../src/modules/identity_assurance/controllers/identity-checks.controller.ts)

### Descripción de negocio

Registrar el resultado inmutable del check (con supersede). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /identity/checks/{id}/results` en `IdentityChecksController_recordResult`. El controlador delega en `IdentityChecksService.recordResult`. Valida el body como `RecordResultDto` y consume `application/json`. El tipo de retorno estático es `Promise<CheckResultResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordResultDto`; los campos opcionales se omiten.

```http
POST /identity/checks/00000000-0000-4000-8000-000000000001/results HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "result": "MATCH"
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
| `result` | Sí | `string` | valores: `MATCH`, `NO_MATCH` | Veredicto del check | `MATCH` |
| `matchScore` | No | `string` | Sin restricción adicional declarada | Puntaje de coincidencia (0..1) | `0.98` |
| `discrepancyCodes` | No | `array<string>` | Sin restricción adicional declarada | Códigos de discrepancia detectados | `["CODIGO_EJEMPLO"]` |
| `sourceResponseHash` | No | `string` | longitud máxima 200 | Hash de la respuesta fuente | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/checks/00000000-0000-4000-8000-000000000001/results HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "result": "MATCH",
  "matchScore": "0.98",
  "discrepancyCodes": [
    "CODIGO_EJEMPLO"
  ],
  "sourceResponseHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CheckResultResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "resultVersion": 1,
  "result": "00000000-0000-4000-8000-000000000001",
  "checkStatus": "00000000-0000-4000-8000-000000000001",
  "caseStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `resultVersion` | Sí | `number` | Sin restricción adicional declarada | Valor de result version mantenido por la instancia. | `1` |
| `result` | Sí | `string` | formato `uuid` | Valor de result mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `checkStatus` | Sí | `string` | formato `uuid` | Valor de check status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `caseStatus` | No | `string` | formato `uuid` | Estado del caso si este resultado lo resolvió | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Check de identidad no encontrado | Excepción explícita en src/modules/identity_assurance/services/identity-checks.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No existe un intento completado para registrar resultado | Excepción explícita en src/modules/identity_assurance/services/identity-checks.service.ts |
| 422 | `PRECONDITION_FAILED` | No se pudo determinar la autoridad que verificó el caso | Excepción explícita en src/modules/identity_assurance/services/identity-checks.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/identity/checks/{id}/results"
}
```

---

## 6. POST /identity/manual-review/{id}/decision

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-manual-review`
- **Nombre:** Resolver una revisión manual (decisión)
- **Operation ID:** `IdentityManualReviewController_decide`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityManualReviewController.decide](../../src/modules/identity_assurance/controllers/identity-manual-review.controller.ts)

### Descripción de negocio

Resolver una revisión manual (decisión). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /identity/manual-review/{id}/decision` en `IdentityManualReviewController_decide`. El controlador delega en `IdentityManualReviewService.decide`. Valida el body como `ReviewDecisionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReviewDecisionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReviewDecisionDto`; los campos opcionales se omiten.

```http
POST /identity/manual-review/00000000-0000-4000-8000-000000000001/decision HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "APPROVED"
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
| `decision` | Sí | `string` | valores: `APPROVED`, `REJECTED` | Decisión del revisor | `APPROVED` |
| `decisionReason` | No | `string` | longitud máxima 500 | Motivo de la decisión | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/manual-review/00000000-0000-4000-8000-000000000001/decision HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "APPROVED",
  "decisionReason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReviewDecisionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReviewDecisionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReviewDecisionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReviewDecisionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReviewDecisionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReviewDecisionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReviewDecisionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReviewDecisionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReviewDecisionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReviewDecisionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReviewDecisionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "caseStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `caseStatus` | Sí | `string` | formato `uuid` | Valor de case status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Revisión manual no encontrada | Excepción explícita en src/modules/identity_assurance/services/identity-manual-review.service.ts |
| 404 | `NOT_FOUND` | Caso de verificación no encontrado | Excepción explícita en src/modules/identity_assurance/services/identity-manual-review.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La revisión ya fue decidida | Excepción explícita en src/modules/identity_assurance/services/identity-manual-review.service.ts |
| 422 | `PRECONDITION_FAILED` | La revisión está asignada a otro revisor | Excepción explícita en src/modules/identity_assurance/services/identity-manual-review.service.ts |
| 422 | `PRECONDITION_FAILED` | La revisión quedó obsoleta: el caso ya no admite aprobación | Excepción explícita en src/modules/identity_assurance/services/identity-checks.service.ts |
| 422 | `PRECONDITION_FAILED` | No se pudo determinar la autoridad que verificó el caso | Excepción explícita en src/modules/identity_assurance/services/identity-checks.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/identity/manual-review/{id}/decision"
}
```

---

## 7. POST /identity/me/identity-verification

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-self-service`
- **Nombre:** Solicitar la verificación de la propia identidad (paciente)
- **Operation ID:** `IdentitySelfServiceController_requestPatientIdentity`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentitySelfServiceController.requestPatientIdentity](../../src/modules/identity_assurance/controllers/identity-self-service.controller.ts)

### Descripción de negocio

Solicitar la verificación de la propia identidad (paciente). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El paciente sube su foto con el carnet para verificar su identidad.

### Descripción del sistema

NestJS resuelve `POST /identity/me/identity-verification` en `IdentitySelfServiceController_requestPatientIdentity`. El controlador delega en `IdentitySelfServiceService.requestPatientIdentity`. Valida el body como `IdentityAssuranceRequestVerificationDto` y consume `application/json`. El tipo de retorno estático es `Promise<VerificationRequestResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IdentityAssuranceRequestVerificationDto`; los campos opcionales se omiten.

```http
POST /identity/me/identity-verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `evidenceFileId` | Sí | `string` | formato `uuid` | Archivo de evidencia ya subido a POST /common/files/upload | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/me/identity-verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VerificationRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "caseId": "00000000-0000-4000-8000-000000000001",
  "checkId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `caseId` | Sí | `string` | formato `uuid` | Identificador asociado a case. | `00000000-0000-4000-8000-000000000001` |
| `checkId` | Sí | `string` | formato `uuid` | Identificador asociado a check. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado del caso recién abierto | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya hay una verificación en curso para este sujeto | Excepción explícita en src/modules/identity_assurance/services/identity-self-service.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/identity_assurance/services/identity-self-service.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/identity/me/identity-verification"
}
```

---

## 8. POST /identity/me/practitioner/identity-verification

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-self-service`
- **Nombre:** Solicitar la verificación de la propia identidad (profesional)
- **Operation ID:** `IdentitySelfServiceController_requestPractitionerIdentity`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentitySelfServiceController.requestPractitionerIdentity](../../src/modules/identity_assurance/controllers/identity-self-service.controller.ts)

### Descripción de negocio

Solicitar la verificación de la propia identidad (profesional). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El profesional verifica su identidad.

### Descripción del sistema

NestJS resuelve `POST /identity/me/practitioner/identity-verification` en `IdentitySelfServiceController_requestPractitionerIdentity`. El controlador delega en `IdentitySelfServiceService.requestPractitionerIdentity`. Valida el body como `IdentityAssuranceRequestVerificationDto` y consume `application/json`. El tipo de retorno estático es `Promise<VerificationRequestResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IdentityAssuranceRequestVerificationDto`; los campos opcionales se omiten.

```http
POST /identity/me/practitioner/identity-verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `evidenceFileId` | Sí | `string` | formato `uuid` | Archivo de evidencia ya subido a POST /common/files/upload | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/me/practitioner/identity-verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VerificationRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "caseId": "00000000-0000-4000-8000-000000000001",
  "checkId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `caseId` | Sí | `string` | formato `uuid` | Identificador asociado a case. | `00000000-0000-4000-8000-000000000001` |
| `checkId` | Sí | `string` | formato `uuid` | Identificador asociado a check. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado del caso recién abierto | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya hay una verificación en curso para este sujeto | Excepción explícita en src/modules/identity_assurance/services/identity-self-service.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/identity_assurance/services/identity-self-service.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene un perfil profesional | Excepción explícita en src/modules/identity_assurance/services/identity-self-service.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/identity/me/practitioner/identity-verification"
}
```

---

## 9. POST /identity/me/practitioner/license-verification

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-self-service`
- **Nombre:** Solicitar la verificación de la propia matrícula
- **Operation ID:** `IdentitySelfServiceController_requestPractitionerLicense`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentitySelfServiceController.requestPractitionerLicense](../../src/modules/identity_assurance/controllers/identity-self-service.controller.ts)

### Descripción de negocio

Solicitar la verificación de la propia matrícula. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El profesional verifica su matrícula.

### Descripción del sistema

NestJS resuelve `POST /identity/me/practitioner/license-verification` en `IdentitySelfServiceController_requestPractitionerLicense`. El controlador delega en `IdentitySelfServiceService.requestPractitionerLicense`. Valida el body como `IdentityAssuranceRequestLicenseVerificationDto` y consume `application/json`. El tipo de retorno estático es `Promise<VerificationRequestResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IdentityAssuranceRequestLicenseVerificationDto`; los campos opcionales se omiten.

```http
POST /identity/me/practitioner/license-verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `evidenceFileId` | Sí | `string` | formato `uuid` | Archivo de evidencia ya subido a POST /common/files/upload | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionAuthorizationId` | No | `string` | formato `uuid` | Matrícula a verificar. Si se omite se usa la única del profesional. | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/me/practitioner/license-verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionAuthorizationId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VerificationRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "caseId": "00000000-0000-4000-8000-000000000001",
  "checkId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `caseId` | Sí | `string` | formato `uuid` | Identificador asociado a case. | `00000000-0000-4000-8000-000000000001` |
| `checkId` | Sí | `string` | formato `uuid` | Identificador asociado a check. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado del caso recién abierto | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Matrícula no encontrada | Excepción explícita en src/modules/identity_assurance/services/identity-self-service.service.ts |
| 409 | `CONFLICT` | Ya hay una verificación en curso para este sujeto | Excepción explícita en src/modules/identity_assurance/services/identity-self-service.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Indique qué matrícula quiere verificar | Excepción explícita en src/modules/identity_assurance/services/identity-self-service.service.ts |
| 422 | `PRECONDITION_FAILED` | La matrícula pertenece a otro profesional | Excepción explícita en src/modules/identity_assurance/services/identity-self-service.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene una persona vinculada | Excepción explícita en src/modules/identity_assurance/services/identity-self-service.service.ts |
| 422 | `PRECONDITION_FAILED` | La cuenta no tiene un perfil profesional | Excepción explícita en src/modules/identity_assurance/services/identity-self-service.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/identity/me/practitioner/license-verification"
}
```

---

## 10. POST /identity/me/tenants/{tenantId}/verification

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-self-service`
- **Nombre:** Solicitar la verificación de una institución propia
- **Operation ID:** `IdentitySelfServiceController_requestTenantVerification`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentitySelfServiceController.requestTenantVerification](../../src/modules/identity_assurance/controllers/identity-self-service.controller.ts)

### Descripción de negocio

Solicitar la verificación de una institución propia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El responsable de una institución pide verificarla.

### Descripción del sistema

NestJS resuelve `POST /identity/me/tenants/{tenantId}/verification` en `IdentitySelfServiceController_requestTenantVerification`. El controlador delega en `IdentitySelfServiceService.requestTenantVerification`. Valida el body como `IdentityAssuranceRequestVerificationDto` y consume `application/json`. El tipo de retorno estático es `Promise<VerificationRequestResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IdentityAssuranceRequestVerificationDto`; los campos opcionales se omiten.

```http
POST /identity/me/tenants/00000000-0000-4000-8000-000000000001/verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `tenantId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `evidenceFileId` | Sí | `string` | formato `uuid` | Archivo de evidencia ya subido a POST /common/files/upload | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/me/tenants/00000000-0000-4000-8000-000000000001/verification HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<VerificationRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VerificationRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "caseId": "00000000-0000-4000-8000-000000000001",
  "checkId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `caseId` | Sí | `string` | formato `uuid` | Identificador asociado a case. | `00000000-0000-4000-8000-000000000001` |
| `checkId` | Sí | `string` | formato `uuid` | Identificador asociado a check. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Estado del caso recién abierto | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya hay una verificación en curso para este sujeto | Excepción explícita en src/modules/identity_assurance/services/identity-self-service.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No pertenece a esa institución | Excepción explícita en src/modules/identity_assurance/services/identity-self-service.service.ts |
| 422 | `PRECONDITION_FAILED` | Sólo el titular o un administrador de la institución puede pedir su verificación | Excepción explícita en src/modules/identity_assurance/services/identity-self-service.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/identity/me/tenants/{tenantId}/verification"
}
```

---

## 11. GET /identity/me/verification-cases

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-self-service`
- **Nombre:** Listar los casos de verificación propios
- **Operation ID:** `IdentitySelfServiceController_listOwnCases`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentitySelfServiceController.listOwnCases](../../src/modules/identity_assurance/controllers/identity-self-service.controller.ts)

### Descripción de negocio

Listar los casos de verificación propios. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Lista los casos propios. Es lo que permite a la app responder "¿está verificada mi cuenta?" sin haber guardado el id del caso.

### Descripción del sistema

NestJS resuelve `GET /identity/me/verification-cases` en `IdentitySelfServiceController_listOwnCases`. El controlador delega en `IdentitySelfServiceService.listOwnCases`. No recibe body. El tipo de retorno estático es `Promise<VerificationStatusResponseDto[]>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /identity/me/verification-cases HTTP/1.1
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
GET /identity/me/verification-cases HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VerificationStatusResponseDto[]>` | No |
| 400 | Consulta completada correctamente. | `Promise<VerificationStatusResponseDto[]>` | No |
| 401 | Consulta completada correctamente. | `Promise<VerificationStatusResponseDto[]>` | No |
| 403 | Consulta completada correctamente. | `Promise<VerificationStatusResponseDto[]>` | No |
| 429 | Consulta completada correctamente. | `Promise<VerificationStatusResponseDto[]>` | No |
| 500 | Consulta completada correctamente. | `Promise<VerificationStatusResponseDto[]>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VerificationStatusResponseDto[]`. Ejemplo completo derivado de ese DTO:

```json
[
  {
    "id": "00000000-0000-4000-8000-000000000001",
    "status": "00000000-0000-4000-8000-000000000001",
    "type": "valor-ejemplo",
    "evidenceFileId": "00000000-0000-4000-8000-000000000001",
    "reasonText": "Texto descriptivo de ejemplo",
    "checks": [
      {
        "checkTypeConceptId": "00000000-0000-4000-8000-000000000001",
        "status": "00000000-0000-4000-8000-000000000001",
        "resultConceptId": "00000000-0000-4000-8000-000000000001",
        "checkedAt": "2026-07-31T12:00:00.000Z"
      }
    ],
    "openedAt": "2026-07-31T12:00:00.000Z",
    "completedAt": "2026-07-31T12:00:00.000Z"
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
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/identity/me/verification-cases"
}
```

---

## 12. GET /identity/me/verification-cases/{caseId}

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-self-service`
- **Nombre:** Consultar el estado de un caso propio
- **Operation ID:** `IdentitySelfServiceController_getOwnCaseStatus`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentitySelfServiceController.getOwnCaseStatus](../../src/modules/identity_assurance/controllers/identity-self-service.controller.ts)

### Descripción de negocio

Consultar el estado de un caso propio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /identity/me/verification-cases/{caseId}` en `IdentitySelfServiceController_getOwnCaseStatus`. El controlador delega en `IdentitySelfServiceService.getOwnCaseStatus`. No recibe body. El tipo de retorno estático es `Promise<VerificationStatusResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `caseId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /identity/me/verification-cases/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `caseId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /identity/me/verification-cases/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VerificationStatusResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<VerificationStatusResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<VerificationStatusResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<VerificationStatusResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<VerificationStatusResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<VerificationStatusResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<VerificationStatusResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VerificationStatusResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "type": "valor-ejemplo",
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo",
  "checks": [
    {
      "checkTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "status": "00000000-0000-4000-8000-000000000001",
      "resultConceptId": "00000000-0000-4000-8000-000000000001",
      "checkedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "openedAt": "2026-07-31T12:00:00.000Z",
  "completedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `type` | Sí | `string` | Sin restricción adicional declarada | Tipo de solicitud, derivado del sujeto del caso | `valor-ejemplo` |
| `evidenceFileId` | No | `string` | formato `uuid` | Archivo de evidencia aportado con la solicitud (`common.files`). Se descarga con `GET /common/files/:id/content`, que ya exige ser quien lo subió o tener un rol revisor: no hace falta un endpoint de descarga propio. | `00000000-0000-4000-8000-000000000001` |
| `reasonText` | No | `string` | Sin restricción adicional declarada | Motivo registrado por quien decidió el caso en revisión manual, cuando lo hubo. Un caso resuelto automáticamente (sin escalar) no tiene motivo de texto: el trace de `checks` es la explicación disponible en ese caso. | `Texto descriptivo de ejemplo` |
| `checks` | No | `array<CaseCheckDto>` | Sin restricción adicional declarada | Traza de los checks del caso, del planificado al más reciente. Sólo se completa en la consulta de detalle (`getOwnCaseStatus`); la lista no la trae para no pagar N+1 por fila que nadie mira. | `[{"checkTypeConceptId":"00000000-0000-4000-8000-000000000001","status":"00000000-0000-4000-8000-000000000001","resultConceptId":"00000000-0000-4000-8000-000000000001","checkedAt":"2026-07-31T12:00:00.000Z"}]` |
| `checks[].checkTypeConceptId` | No | `string` | formato `uuid` | Identificador asociado a check type concept. | `00000000-0000-4000-8000-000000000001` |
| `checks[].status` | No | `string` | formato `uuid` | Identificador asociado a status concept del check. | `00000000-0000-4000-8000-000000000001` |
| `checks[].resultConceptId` | No | `string` | formato `uuid` | Resultado del check, cuando ya corrió (`identity_check_results`). | `00000000-0000-4000-8000-000000000001` |
| `checks[].checkedAt` | No | `string` | formato `date-time` | Cuándo se registró ese resultado. | `2026-07-31T12:00:00.000Z` |
| `openedAt` | No | `string` | formato `date-time` | Valor de opened at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `completedAt` | No | `string` | formato `date-time` | Valor de completed at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso no encontrado | Excepción explícita en src/modules/identity_assurance/services/identity-self-service.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/identity/me/verification-cases/{caseId}"
}
```

---

## 13. GET /identity/me/verification-types

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-self-service`
- **Nombre:** Listar los tipos de solicitud de verificación disponibles
- **Operation ID:** `IdentitySelfServiceController_listAvailableTypes`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentitySelfServiceController.listAvailableTypes](../../src/modules/identity_assurance/controllers/identity-self-service.controller.ts)

### Descripción de negocio

Listar los tipos de solicitud de verificación disponibles. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Catálogo de "mis verificaciones" (FT-32-R09/R11): qué tipos de solicitud puede iniciar el titular y cuáles ya tienen una en curso.

### Descripción del sistema

NestJS resuelve `GET /identity/me/verification-types` en `IdentitySelfServiceController_listAvailableTypes`. El controlador delega en `IdentitySelfServiceService.listAvailableTypes`. No recibe body. El tipo de retorno estático es `Promise<VerificationTypesResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /identity/me/verification-types HTTP/1.1
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
GET /identity/me/verification-types HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VerificationTypesResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<VerificationTypesResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<VerificationTypesResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<VerificationTypesResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<VerificationTypesResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<VerificationTypesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VerificationTypesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "types": [
    {
      "code": "CODIGO_EJEMPLO",
      "label": "valor-ejemplo",
      "jurisdictionAuthorizationId": "00000000-0000-4000-8000-000000000001",
      "hasPendingRequest": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `types` | Sí | `array<VerificationTypeDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"code":"CODIGO_EJEMPLO","label":"valor-ejemplo","jurisdictionAuthorizationId":"00000000-0000-4000-8000-000000000001","hasPendingRequest":true}]` |
| `types[].code` | Sí | `string` | Sin restricción adicional declarada | Código estable del tipo, el mismo que `VerificationStatusResponseDto.type`. | `CODIGO_EJEMPLO` |
| `types[].label` | Sí | `string` | Sin restricción adicional declarada | Etiqueta legible para el selector de "nueva solicitud". | `valor-ejemplo` |
| `types[].jurisdictionAuthorizationId` | No | `string` | formato `uuid` | Matrícula concreta a la que aplica este tipo, sólo para `PRACTITIONER_LICENSE`: un profesional puede tener más de una. | `00000000-0000-4000-8000-000000000001` |
| `types[].hasPendingRequest` | Sí | `boolean` | Sin restricción adicional declarada | Ya hay una solicitud viva (abierta o en verificación) para este tipo concreto. El backend igual rechaza con 409 si se manda de todas formas: esto es lo que deja a la pantalla no ofrecer el envío desde antes. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/identity/me/verification-types"
}
```

---

## 14. GET /identity/verification-cases

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-verification-cases`
- **Nombre:** Listar los casos que esperan revisión
- **Operation ID:** `IdentityCasesController_listQueue`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityCasesController.listQueue](../../src/modules/identity_assurance/controllers/identity-cases.controller.ts)

### Descripción de negocio

Listar los casos que esperan revisión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: La cola de revisión. Es la única lectura de esta superficie: habilita UC-27-08/09 sobre casos que el revisor descubre acá, en vez de exigirle que ya conozca el id. Restringida a `SECURITY_ADMIN` como el resto del controller. El rol es el único límite real: la tabla no tiene `tenant_id` y el RLS no la alcanza (ver `IdentityCasesService.listQueue`).

### Descripción del sistema

NestJS resuelve `GET /identity/verification-cases` en `IdentityCasesController_listQueue`. El controlador delega en `IdentityCasesService.listQueue`. No recibe body. El tipo de retorno estático es `Promise<CaseQueueResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `status` | query | No | `string` | Sin restricción adicional declarada | Concepto de estado a listar; por defecto, los que esperan revisión | `ok` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Casos por página (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /identity/verification-cases HTTP/1.1
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
GET /identity/verification-cases?status=ok&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CaseQueueResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<CaseQueueResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<CaseQueueResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<CaseQueueResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<CaseQueueResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<CaseQueueResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CaseQueueResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "cases": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "status": "00000000-0000-4000-8000-000000000001",
      "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "subjectEntityId": "00000000-0000-4000-8000-000000000001",
      "identityVerificationPolicyId": "00000000-0000-4000-8000-000000000001",
      "riskScore": "valor-ejemplo",
      "openedAt": "2026-07-31T12:00:00.000Z",
      "expiresAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `cases` | Sí | `array<QueuedCaseDto>` | Sin restricción adicional declarada | Valor de cases mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","status":"00000000-0000-4000-8000-000000000001","subjectTypeConceptId":"00000000-0000-4000-8000-000000000001","subjectEntityId":"00000000-0000-4000-8000-000000000001","identityVerificationPolicyId":"00000000-0000-4000-8000-000000000001","riskScore":"valor-ejemplo","openedAt":"2026-07-31T12:00:00.000Z","expiresAt":"2026-07-31T12:00:00.000Z"}]` |
| `cases[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `cases[].status` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `cases[].subjectTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a subject type concept. | `00000000-0000-4000-8000-000000000001` |
| `cases[].subjectEntityId` | Sí | `string` | formato `uuid` | Identificador asociado a subject entity. | `00000000-0000-4000-8000-000000000001` |
| `cases[].identityVerificationPolicyId` | Sí | `string` | formato `uuid` | Identificador asociado a identity verification policy. | `00000000-0000-4000-8000-000000000001` |
| `cases[].riskScore` | No | `string` | Sin restricción adicional declarada | Valor de risk score mantenido por la instancia. | `valor-ejemplo` |
| `cases[].openedAt` | No | `string` | formato `date-time` | Valor de opened at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `cases[].expiresAt` | No | `string` | formato `date-time` | Valor de expires at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

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
  "path": "/identity/verification-cases"
}
```

---

## 15. POST /identity/verification-cases

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-verification-cases`
- **Nombre:** Iniciar un caso de verificación de identidad
- **Operation ID:** `IdentityCasesController_open`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityCasesController.open](../../src/modules/identity_assurance/controllers/identity-cases.controller.ts)

### Descripción de negocio

Iniciar un caso de verificación de identidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /identity/verification-cases` en `IdentityCasesController_open`. El controlador delega en `IdentityCasesService.openCase`. Valida el body como `OpenCaseDto` y consume `application/json`. El tipo de retorno estático es `Promise<CaseResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `OpenCaseDto`; los campos opcionales se omiten.

```http
POST /identity/verification-cases HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "identityVerificationPolicyId": "00000000-0000-4000-8000-000000000001",
  "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "subjectEntityId": "00000000-0000-4000-8000-000000000001"
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
| `identityVerificationPolicyId` | Sí | `string` | formato `uuid` | Política de verificación vigente | `00000000-0000-4000-8000-000000000001` |
| `subjectTypeConceptId` | Sí | `string` | formato `uuid` | Concepto: tipo de sujeto | `00000000-0000-4000-8000-000000000001` |
| `subjectEntityId` | Sí | `string` | formato `uuid` | Id de la entidad sujeto (paciente/profesional/representante) | `00000000-0000-4000-8000-000000000001` |
| `requestedAssuranceLevelConceptId` | No | `string` | formato `uuid` | Concepto: IAL/AAL solicitado (por defecto el de la política) | `00000000-0000-4000-8000-000000000001` |
| `correlationId` | No | `string` | formato `uuid` | Correlation id para idempotencia de apertura | `00000000-0000-4000-8000-000000000001` |
| `expiresInHours` | No | `number` | mínimo 1 | TTL del caso en horas (por defecto 72) | `72` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/verification-cases HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "identityVerificationPolicyId": "00000000-0000-4000-8000-000000000001",
  "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "subjectEntityId": "00000000-0000-4000-8000-000000000001",
  "requestedAssuranceLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "correlationId": "00000000-0000-4000-8000-000000000001",
  "expiresInHours": 72
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CaseResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CaseResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CaseResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "caseNumber": "valor-ejemplo",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "operatingRoomId": "00000000-0000-4000-8000-000000000001",
  "milestoneId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `caseNumber` | Sí | `string` | Sin restricción adicional declarada | Número del caso | `valor-ejemplo` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |
| `operatingRoomId` | Sí | `string` | formato `uuid` | Quirófano reservado | `00000000-0000-4000-8000-000000000001` |
| `milestoneId` | Sí | `string` | formato `uuid` | Hito de programación creado | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Política de verificación no encontrada | Excepción explícita en src/modules/identity_assurance/services/identity-cases.service.ts |
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
  "path": "/identity/verification-cases"
}
```

---

## 16. POST /identity/verification-cases/{id}/assertions

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-verification-cases`
- **Nombre:** Emitir una aserción de identidad con nivel de aseguramiento
- **Operation ID:** `IdentityCasesController_issueAssertion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityCasesController.issueAssertion](../../src/modules/identity_assurance/controllers/identity-cases.controller.ts)

### Descripción de negocio

Emitir una aserción de identidad con nivel de aseguramiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /identity/verification-cases/{id}/assertions` en `IdentityCasesController_issueAssertion`. El controlador delega en `IdentityCasesService.issueAssertion`. Valida el body como `IssueAssertionDto` y consume `application/json`. El tipo de retorno estático es `Promise<AssertionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IssueAssertionDto`; los campos opcionales se omiten.

```http
POST /identity/verification-cases/00000000-0000-4000-8000-000000000001/assertions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "issuerIdentityAuthorityId": "00000000-0000-4000-8000-000000000001"
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
| `issuerIdentityAuthorityId` | Sí | `string` | formato `uuid` | Autoridad emisora de la aserción | `00000000-0000-4000-8000-000000000001` |
| `assertionTypeConceptId` | No | `string` | formato `uuid` | Concepto: tipo de aserción (por defecto identidad) | `00000000-0000-4000-8000-000000000001` |
| `assuranceLevelConceptId` | No | `string` | formato `uuid` | Concepto: nivel de aseguramiento alcanzado (por defecto el solicitado del caso) | `00000000-0000-4000-8000-000000000001` |
| `expiresInHours` | No | `number` | mínimo 1 | Vigencia de la aserción en horas (por defecto 8760 = 1 año) | `8760` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/verification-cases/00000000-0000-4000-8000-000000000001/assertions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "issuerIdentityAuthorityId": "00000000-0000-4000-8000-000000000001",
  "assertionTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "assuranceLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "expiresInHours": 8760
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AssertionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AssertionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AssertionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AssertionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AssertionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AssertionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AssertionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AssertionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AssertionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AssertionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AssertionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "assertionIdentifier": "valor-ejemplo",
  "assuranceLevel": "00000000-0000-4000-8000-000000000001",
  "issuedAt": "2026-07-31T12:00:00.000Z",
  "caseStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `assertionIdentifier` | No | `string` | Sin restricción adicional declarada | Valor de assertion identifier mantenido por la instancia. | `valor-ejemplo` |
| `assuranceLevel` | Sí | `string` | formato `uuid` | Valor de assurance level mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `issuedAt` | No | `string` | formato `date-time` | Valor de issued at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `caseStatus` | Sí | `string` | formato `uuid` | Valor de case status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso de verificación no encontrado | Excepción explícita en src/modules/identity_assurance/services/identity-cases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo un caso verificado puede emitir una aserción | Excepción explícita en src/modules/identity_assurance/services/identity-cases.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay checks completados que sustenten la aserción | Excepción explícita en src/modules/identity_assurance/services/identity-cases.service.ts |
| 422 | `PRECONDITION_FAILED` | No se pudo determinar el nivel de aseguramiento | Excepción explícita en src/modules/identity_assurance/services/identity-cases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/identity/verification-cases/{id}/assertions"
}
```

---

## 17. POST /identity/verification-cases/{id}/checks:plan

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-verification-cases`
- **Nombre:** Planificar los checks requeridos del caso
- **Operation ID:** `IdentityCasesController_planChecks`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityCasesController.planChecks](../../src/modules/identity_assurance/controllers/identity-cases.controller.ts)

### Descripción de negocio

Planificar los checks requeridos del caso. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /identity/verification-cases/{id}/checks:plan` en `IdentityCasesController_planChecks`. El controlador delega en `IdentityCasesService.planChecks`. Valida el body como `PlanChecksDto` y consume `application/json`. El tipo de retorno estático es `Promise<ChecksPlannedResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PlanChecksDto`; los campos opcionales se omiten.

```http
POST /identity/verification-cases/00000000-0000-4000-8000-000000000001/checks:plan HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "checks": [
    {
      "checkTypeConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
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
| `checks` | Sí | `array<PlanCheckItemDto>` | mínimo 1 elemento(s) | Checks a planificar | `[{"checkTypeConceptId":"00000000-0000-4000-8000-000000000001","authorityId":"00000000-0000-4000-8000-000000000001","required":true}]` |
| `checks[].checkTypeConceptId` | Sí | `string` | formato `uuid` | Concepto: tipo de check | `00000000-0000-4000-8000-000000000001` |
| `checks[].authorityId` | No | `string` | formato `uuid` | Autoridad contra la que se ejecuta el check | `00000000-0000-4000-8000-000000000001` |
| `checks[].required` | No | `boolean` | Sin restricción adicional declarada | ¿El check es obligatorio? | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/verification-cases/00000000-0000-4000-8000-000000000001/checks:plan HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "checks": [
    {
      "checkTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "authorityId": "00000000-0000-4000-8000-000000000001",
      "required": true
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ChecksPlannedResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ChecksPlannedResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ChecksPlannedResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ChecksPlannedResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ChecksPlannedResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ChecksPlannedResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ChecksPlannedResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ChecksPlannedResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ChecksPlannedResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ChecksPlannedResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ChecksPlannedResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "caseId": "00000000-0000-4000-8000-000000000001",
  "checkIds": [
    "valor-ejemplo"
  ],
  "caseStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `caseId` | Sí | `string` | formato `uuid` | Identificador asociado a case. | `00000000-0000-4000-8000-000000000001` |
| `checkIds` | Sí | `array<string>` | Sin restricción adicional declarada | Valor de check ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `caseStatus` | Sí | `string` | formato `uuid` | Valor de case status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso de verificación no encontrado | Excepción explícita en src/modules/identity_assurance/services/identity-cases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo un caso abierto puede planificar checks | Excepción explícita en src/modules/identity_assurance/services/identity-cases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/identity/verification-cases/{id}/checks:plan"
}
```

---

## 18. POST /identity/verification-cases/{id}/evidence

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-verification-cases`
- **Nombre:** Aportar evidencia documental bajo consentimiento
- **Operation ID:** `IdentityCasesController_submitEvidence`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityCasesController.submitEvidence](../../src/modules/identity_assurance/controllers/identity-cases.controller.ts)

### Descripción de negocio

Aportar evidencia documental bajo consentimiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /identity/verification-cases/{id}/evidence` en `IdentityCasesController_submitEvidence`. El controlador delega en `IdentityCasesService.submitEvidence`. Valida el body como `SubmitEvidenceDto` y consume `application/json`. El tipo de retorno estático es `Promise<EvidenceResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SubmitEvidenceDto`; los campos opcionales se omiten.

```http
POST /identity/verification-cases/00000000-0000-4000-8000-000000000001/evidence HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "evidenceTypeConceptId": "00000000-0000-4000-8000-000000000001"
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
| `evidenceTypeConceptId` | Sí | `string` | formato `uuid` | Concepto: tipo de evidencia | `00000000-0000-4000-8000-000000000001` |
| `issuerAuthorityId` | No | `string` | formato `uuid` | Autoridad emisora de la evidencia | `00000000-0000-4000-8000-000000000001` |
| `evidenceIdentifierHash` | No | `string` | longitud máxima 200 | Hash del identificador de la evidencia (minimización de datos) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `evidenceFileId` | No | `string` | formato `uuid` | Archivo de evidencia (common.files) | `00000000-0000-4000-8000-000000000001` |
| `encryptedEvidenceReference` | No | `string` | Sin restricción adicional declarada | Referencia cifrada al payload (object storage) | `valor-ejemplo` |
| `evidenceQualityConceptId` | No | `string` | formato `uuid` | Concepto: calidad de la evidencia | `00000000-0000-4000-8000-000000000001` |
| `collectedUnderConsentId` | No | `string` | formato `uuid` | Consentimiento bajo el que se recolectó | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/verification-cases/00000000-0000-4000-8000-000000000001/evidence HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "evidenceTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "issuerAuthorityId": "00000000-0000-4000-8000-000000000001",
  "evidenceIdentifierHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "evidenceFileId": "00000000-0000-4000-8000-000000000001",
  "encryptedEvidenceReference": "valor-ejemplo",
  "evidenceQualityConceptId": "00000000-0000-4000-8000-000000000001",
  "collectedUnderConsentId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<EvidenceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `EvidenceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "retrievalSessionId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "citations": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `retrievalSessionId` | Sí | `string` | formato `uuid` | Identificador asociado a retrieval session. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |
| `citations` | Sí | `number` | Sin restricción adicional declarada | Citas materializadas | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso de verificación no encontrado | Excepción explícita en src/modules/identity_assurance/services/identity-cases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El caso no admite evidencia en su estado actual | Excepción explícita en src/modules/identity_assurance/services/identity-cases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/identity/verification-cases/{id}/evidence"
}
```

---

## 19. POST /identity/verification-cases/{id}/fraud-signals

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-verification-cases`
- **Nombre:** Detectar y registrar una señal de fraude
- **Operation ID:** `IdentityCasesController_raiseFraudSignal`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityCasesController.raiseFraudSignal](../../src/modules/identity_assurance/controllers/identity-cases.controller.ts)

### Descripción de negocio

Detectar y registrar una señal de fraude. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /identity/verification-cases/{id}/fraud-signals` en `IdentityCasesController_raiseFraudSignal`. El controlador delega en `IdentityCasesService.raiseFraudSignal`. Valida el body como `RaiseFraudSignalDto` y consume `application/json`. El tipo de retorno estático es `Promise<FraudSignalResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RaiseFraudSignalDto`; los campos opcionales se omiten.

```http
POST /identity/verification-cases/00000000-0000-4000-8000-000000000001/fraud-signals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "signalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001"
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
| `signalTypeConceptId` | Sí | `string` | formato `uuid` | Concepto: tipo de señal de fraude | `00000000-0000-4000-8000-000000000001` |
| `severityConceptId` | Sí | `string` | formato `uuid` | Concepto: severidad de la señal | `00000000-0000-4000-8000-000000000001` |
| `confidenceScore` | No | `string` | Sin restricción adicional declarada | Puntaje de confianza (0..1) | `0.75` |
| `sourceConceptId` | No | `string` | formato `uuid` | Concepto: fuente de la señal | `00000000-0000-4000-8000-000000000001` |
| `evidenceReference` | No | `string` | longitud máxima 200 | Referencia a la evidencia de la señal | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/verification-cases/00000000-0000-4000-8000-000000000001/fraud-signals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "signalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "confidenceScore": "0.75",
  "sourceConceptId": "00000000-0000-4000-8000-000000000001",
  "evidenceReference": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FraudSignalResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FraudSignalResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FraudSignalResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FraudSignalResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<FraudSignalResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FraudSignalResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FraudSignalResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FraudSignalResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FraudSignalResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FraudSignalResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FraudSignalResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "resolution": "00000000-0000-4000-8000-000000000001",
  "caseStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `resolution` | Sí | `string` | formato `uuid` | Valor de resolution mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `caseStatus` | Sí | `string` | formato `uuid` | Valor de case status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso de verificación no encontrado | Excepción explícita en src/modules/identity_assurance/services/identity-cases.service.ts |
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
  "path": "/identity/verification-cases/{id}/fraud-signals"
}
```

---

## 20. POST /identity/verification-cases/{id}/manual-review

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-verification-cases`
- **Nombre:** Escalar el caso a revisión manual
- **Operation ID:** `IdentityCasesController_openManualReview`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityCasesController.openManualReview](../../src/modules/identity_assurance/controllers/identity-cases.controller.ts)

### Descripción de negocio

Escalar el caso a revisión manual. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /identity/verification-cases/{id}/manual-review` en `IdentityCasesController_openManualReview`. El controlador delega en `IdentityCasesService.openManualReview`. Valida el body como `OpenManualReviewDto` y consume `application/json`. El tipo de retorno estático es `Promise<ManualReviewResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `OpenManualReviewDto`; los campos opcionales se omiten.

```http
POST /identity/verification-cases/00000000-0000-4000-8000-000000000001/manual-review HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reviewReasonConceptId": "00000000-0000-4000-8000-000000000001"
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
| `reviewReasonConceptId` | Sí | `string` | formato `uuid` | Concepto: motivo de la revisión | `00000000-0000-4000-8000-000000000001` |
| `assignedToUserId` | No | `string` | formato `uuid` | Usuario revisor asignado (por defecto el actor) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/verification-cases/00000000-0000-4000-8000-000000000001/manual-review HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reviewReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "assignedToUserId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ManualReviewResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ManualReviewResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ManualReviewResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ManualReviewResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ManualReviewResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ManualReviewResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ManualReviewResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ManualReviewResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ManualReviewResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ManualReviewResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ManualReviewResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "caseStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Valor de status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `caseStatus` | Sí | `string` | formato `uuid` | Valor de case status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Caso de verificación no encontrado | Excepción explícita en src/modules/identity_assurance/services/identity-cases.service.ts |
| 409 | `CONFLICT` | El caso ya tiene una revisión manual abierta | Excepción explícita en src/modules/identity_assurance/services/identity-cases.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El caso no es escalable a revisión manual | Excepción explícita en src/modules/identity_assurance/services/identity-cases.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/identity/verification-cases/{id}/manual-review"
}
```

---

## 21. POST /identity/verification-cases/expire-sweep

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-verification-cases`
- **Nombre:** Expirar por lote los casos vencidos (job programado)
- **Operation ID:** `IdentityCasesController_expireSweep`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityCasesController.expireSweep](../../src/modules/identity_assurance/controllers/identity-cases.controller.ts)

### Descripción de negocio

Expirar por lote los casos vencidos (job programado). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-27-12 (barrido programado). Declarado antes que las rutas con `:id`.

### Descripción del sistema

NestJS resuelve `POST /identity/verification-cases/expire-sweep` en `IdentityCasesController_expireSweep`. El controlador delega en `IdentityCasesService.expireSweep`. No recibe body. El tipo de retorno estático es `Promise<ExpireSweepResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /identity/verification-cases/expire-sweep HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /identity/verification-cases/expire-sweep HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ExpireSweepResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ExpireSweepResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ExpireSweepResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ExpireSweepResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ExpireSweepResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ExpireSweepResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ExpireSweepResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ExpireSweepResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ExpireSweepResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "expiredCount": 1,
  "caseIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expiredCount` | Sí | `number` | Sin restricción adicional declarada | Valor de expired count mantenido por la instancia. | `1` |
| `caseIds` | Sí | `array<string>` | Sin restricción adicional declarada | Valor de case ids mantenido por la instancia. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/identity/verification-cases/expire-sweep"
}
```

---

## 22. POST /identity/verification-policies

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity-policies`
- **Nombre:** Crear una política de verificación de identidad (IAL/AAL)
- **Operation ID:** `IdentityPoliciesController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityPoliciesController.create](../../src/modules/identity_assurance/controllers/identity-policies.controller.ts)

### Descripción de negocio

Crear una política de verificación de identidad (IAL/AAL). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea create.

### Descripción del sistema

NestJS resuelve `POST /identity/verification-policies` en `IdentityPoliciesController_create`. El controlador delega en `IdentityPoliciesService.createPolicy`. Valida el body como `CreatePolicyDto` y consume `application/json`. El tipo de retorno estático es `Promise<PolicyResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePolicyDto`; los campos opcionales se omiten.

```http
POST /identity/verification-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "policyCode": "CODIGO_EJEMPLO",
  "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "transactionRiskConceptId": "00000000-0000-4000-8000-000000000001",
  "requiredIdentityAssuranceLevelConceptId": "00000000-0000-4000-8000-000000000001"
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
| `policyCode` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Código único de la política | `CODIGO_EJEMPLO` |
| `subjectTypeConceptId` | Sí | `string` | formato `uuid` | Concepto: tipo de sujeto | `00000000-0000-4000-8000-000000000001` |
| `transactionRiskConceptId` | Sí | `string` | formato `uuid` | Concepto: riesgo de la transacción | `00000000-0000-4000-8000-000000000001` |
| `requiredIdentityAssuranceLevelConceptId` | Sí | `string` | formato `uuid` | Concepto: IAL requerido (NIST 800-63) | `00000000-0000-4000-8000-000000000001` |
| `requiredAuthenticatorAssuranceLevelConceptId` | No | `string` | formato `uuid` | Concepto: AAL requerido | `00000000-0000-4000-8000-000000000001` |
| `requiredFederationAssuranceLevelConceptId` | No | `string` | formato `uuid` | Concepto: FAL requerido | `00000000-0000-4000-8000-000000000001` |
| `evidenceRequirementsJson` | No | `object` | Sin restricción adicional declarada | Requisitos de evidencia (JSON) | `{}` |
| `fraudControlsJson` | No | `object` | Sin restricción adicional declarada | Controles de fraude / umbrales (JSON) | `{}` |
| `versionNumber` | No | `number` | mínimo 1 | Número de versión de la política | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /identity/verification-policies HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "policyCode": "CODIGO_EJEMPLO",
  "subjectTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "transactionRiskConceptId": "00000000-0000-4000-8000-000000000001",
  "requiredIdentityAssuranceLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "requiredAuthenticatorAssuranceLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "requiredFederationAssuranceLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "evidenceRequirementsJson": {},
  "fraudControlsJson": {},
  "versionNumber": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PolicyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PolicyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PolicyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "state": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de state mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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
  "path": "/identity/verification-policies"
}
```

---

## 23. POST /internal/identity/checks/{id}/attempts

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity_assurance`
- **Nombre:** Registrar el intento del worker contra la autoridad externa
- **Operation ID:** `IdentityWorkerController_recordAttempt`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityWorkerController.recordAttempt](../../src/modules/identity_assurance/controllers/identity-worker.controller.ts)

### Descripción de negocio

Registrar el intento del worker contra la autoridad externa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Asienta el intento de despacho contra la autoridad externa.

### Descripción del sistema

NestJS resuelve `POST /internal/identity/checks/{id}/attempts` en `IdentityWorkerController_recordAttempt`. El controlador delega en `IdentityChecksService.recordAttempt`. Valida el body como `IdentityAssuranceRecordAttemptDto` y consume `application/json`. El tipo de retorno estático es `Promise<AttemptResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `IdentityAssuranceRecordAttemptDto`; los campos opcionales se omiten.

```http
POST /internal/identity/checks/00000000-0000-4000-8000-000000000001/attempts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "identityAuthorityEndpointId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `identityAuthorityEndpointId` | Sí | `string` | formato `uuid` | Endpoint de autoridad usado en el intento | `00000000-0000-4000-8000-000000000001` |
| `outcome` | No | `string` | valores: `SUCCESS`, `PENDING`, `FAILED` | Resultado técnico del intento | `SUCCESS` |
| `idempotencyKey` | No | `string` | longitud máxima 200 | Clave de idempotencia del intento | `valor-ejemplo` |
| `requestMessageId` | No | `string` | formato `uuid` | Mensaje saliente correlacionado | `00000000-0000-4000-8000-000000000001` |
| `responseMessageId` | No | `string` | formato `uuid` | Mensaje entrante correlacionado | `00000000-0000-4000-8000-000000000001` |
| `technicalErrorCode` | No | `string` | longitud máxima 100 | Código de error técnico | `CODIGO_EJEMPLO` |
| `retryEligible` | No | `boolean` | Sin restricción adicional declarada | ¿Es elegible para reintento? | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/identity/checks/00000000-0000-4000-8000-000000000001/attempts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "identityAuthorityEndpointId": "00000000-0000-4000-8000-000000000001",
  "outcome": "SUCCESS",
  "idempotencyKey": "valor-ejemplo",
  "requestMessageId": "00000000-0000-4000-8000-000000000001",
  "responseMessageId": "00000000-0000-4000-8000-000000000001",
  "technicalErrorCode": "CODIGO_EJEMPLO",
  "retryEligible": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AttemptResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AttemptResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AttemptResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "attemptNumber": 1,
  "outcome": "00000000-0000-4000-8000-000000000001",
  "checkStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `attemptNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de attempt number mantenido por la instancia. | `1` |
| `outcome` | Sí | `string` | formato `uuid` | Valor de outcome mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `checkStatus` | Sí | `string` | formato `uuid` | Valor de check status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Check de identidad no encontrado | Excepción explícita en src/modules/identity_assurance/services/identity-checks.service.ts |
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
  "path": "/internal/identity/checks/{id}/attempts"
}
```

---

## 24. POST /internal/identity/checks/{id}/results

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity_assurance`
- **Nombre:** Registrar el veredicto que devolvió la autoridad externa
- **Operation ID:** `IdentityWorkerController_recordResult`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityWorkerController.recordResult](../../src/modules/identity_assurance/controllers/identity-worker.controller.ts)

### Descripción de negocio

Registrar el veredicto que devolvió la autoridad externa. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Asienta el veredicto de la autoridad. Es el punto que puede cerrar el caso (verificarlo y emitir su aserción, o rechazarlo).

### Descripción del sistema

NestJS resuelve `POST /internal/identity/checks/{id}/results` en `IdentityWorkerController_recordResult`. El controlador delega en `IdentityChecksService.recordResult`. Valida el body como `RecordResultDto` y consume `application/json`. El tipo de retorno estático es `Promise<CheckResultResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordResultDto`; los campos opcionales se omiten.

```http
POST /internal/identity/checks/00000000-0000-4000-8000-000000000001/results HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "result": "MATCH"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `result` | Sí | `string` | valores: `MATCH`, `NO_MATCH` | Veredicto del check | `MATCH` |
| `matchScore` | No | `string` | Sin restricción adicional declarada | Puntaje de coincidencia (0..1) | `0.98` |
| `discrepancyCodes` | No | `array<string>` | Sin restricción adicional declarada | Códigos de discrepancia detectados | `["CODIGO_EJEMPLO"]` |
| `sourceResponseHash` | No | `string` | longitud máxima 200 | Hash de la respuesta fuente | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/identity/checks/00000000-0000-4000-8000-000000000001/results HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "result": "MATCH",
  "matchScore": "0.98",
  "discrepancyCodes": [
    "CODIGO_EJEMPLO"
  ],
  "sourceResponseHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CheckResultResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CheckResultResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "resultVersion": 1,
  "result": "00000000-0000-4000-8000-000000000001",
  "checkStatus": "00000000-0000-4000-8000-000000000001",
  "caseStatus": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `resultVersion` | Sí | `number` | Sin restricción adicional declarada | Valor de result version mantenido por la instancia. | `1` |
| `result` | Sí | `string` | formato `uuid` | Valor de result mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `checkStatus` | Sí | `string` | formato `uuid` | Valor de check status mantenido por la instancia. | `00000000-0000-4000-8000-000000000001` |
| `caseStatus` | No | `string` | formato `uuid` | Estado del caso si este resultado lo resolvió | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Check de identidad no encontrado | Excepción explícita en src/modules/identity_assurance/services/identity-checks.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No existe un intento completado para registrar resultado | Excepción explícita en src/modules/identity_assurance/services/identity-checks.service.ts |
| 422 | `PRECONDITION_FAILED` | No se pudo determinar la autoridad que verificó el caso | Excepción explícita en src/modules/identity_assurance/services/identity-checks.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/identity/checks/{id}/results"
}
```

---

## 25. GET /internal/identity/checks/dispatchable

- **Módulo:** `identity_assurance`
- **Etiqueta OpenAPI:** `identity_assurance`
- **Nombre:** Listar los checks que el worker debe atender en este tick
- **Operation ID:** `IdentityWorkerController_listDispatchable`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IdentityWorkerController.listDispatchable](../../src/modules/identity_assurance/controllers/identity-worker.controller.ts)

### Descripción de negocio

Listar los checks que el worker debe atender en este tick. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Descubrimiento: qué checks hay que despachar o seguir esperando.

### Descripción del sistema

NestJS resuelve `GET /internal/identity/checks/dispatchable` en `IdentityWorkerController_listDispatchable`. El controlador delega en `IdentityChecksService.listDispatchable`. No recibe body. El tipo de retorno estático es `Promise<DispatchableChecksResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /internal/identity/checks/dispatchable?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /internal/identity/checks/dispatchable?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DispatchableChecksResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<DispatchableChecksResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<DispatchableChecksResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<DispatchableChecksResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<DispatchableChecksResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<DispatchableChecksResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DispatchableChecksResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "checks": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "identityVerificationCaseId": "00000000-0000-4000-8000-000000000001",
      "checkTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "checkTypeCode": "CODIGO_EJEMPLO",
      "identityAuthorityEndpointId": "00000000-0000-4000-8000-000000000001",
      "awaitingVerdict": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `checks` | Sí | `array<DispatchableCheckDto>` | Sin restricción adicional declarada | Valor de checks mantenido por la instancia. | `[{"id":"00000000-0000-4000-8000-000000000001","identityVerificationCaseId":"00000000-0000-4000-8000-000000000001","checkTypeConceptId":"00000000-0000-4000-8000-000000000001","checkTypeCode":"CODIGO_EJEMPLO","identityAuthorityEndpointId":"00000000-0000-4000-8000-000000000001","awaitingVerdict":true}]` |
| `checks[].id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `checks[].identityVerificationCaseId` | Sí | `string` | formato `uuid` | Identificador asociado a identity verification case. | `00000000-0000-4000-8000-000000000001` |
| `checks[].checkTypeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a check type concept. | `00000000-0000-4000-8000-000000000001` |
| `checks[].checkTypeCode` | Sí | `string` | Sin restricción adicional declarada | Código legible del tipo de comprobación, tal como lo espera la autoridad externa (`IDENTITY_CARD`, `MEDICAL_LICENSE`, `INSTITUTION_DOCUMENT`). Se resuelve aquí y no en el worker para que el worker no tenga que conocer el catálogo de conceptos: su trabajo es hablar con el proveedor, no traducir identificadores internos. | `CODIGO_EJEMPLO` |
| `checks[].identityAuthorityEndpointId` | Sí | `string` | formato `uuid` | Identificador asociado al endpoint de autoridad que atiende este check. | `00000000-0000-4000-8000-000000000001` |
| `checks[].awaitingVerdict` | Sí | `boolean` | Sin restricción adicional declarada | true si ya hay un intento en curso pendiente de veredicto | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/identity/checks/dispatchable"
}
```

---

