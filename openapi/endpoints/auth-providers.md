<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `auth_providers`

Referencia exhaustiva de 12 operación(es) del módulo `auth_providers`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `auth-providers`
- **Controladores:** `AuthProvidersController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /auth-providers/account-link-requests](#1-post-auth-providers-account-link-requests) — Solicitar la vinculación de un sujeto externo
2. [POST /auth-providers/account-link-requests/complete](#2-post-auth-providers-account-link-requests-complete) — Completar la vinculación presentando el token
3. [POST /auth-providers/federated-identities/{id}/unlink](#3-post-auth-providers-federated-identities-id-unlink) — Desvincular una identidad federada
4. [POST /auth-providers/identity-providers](#4-post-auth-providers-identity-providers) — Registrar un proveedor de identidad
5. [PUT /auth-providers/identity-providers/{id}/attribute-mappings](#5-put-auth-providers-identity-providers-id-attribute-mappings) — Fijar el mapeo de atributos del proveedor
6. [POST /auth-providers/identity-providers/{id}/protocol-configs](#6-post-auth-providers-identity-providers-id-protocol-configs) — Configurar el protocolo de un entorno e importar el JWKS
7. [POST /auth-providers/identity-providers/{id}/provisioning-rules](#7-post-auth-providers-identity-providers-id-provisioning-rules) — Definir una regla de aprovisionamiento
8. [POST /auth-providers/identity-providers/{id}/signing-keys](#8-post-auth-providers-identity-providers-id-signing-keys) — Publicar una clave de firma del proveedor
9. [POST /auth-providers/identity-providers/{id}/signing-keys/rotate](#9-post-auth-providers-identity-providers-id-signing-keys-rotate) — Rotar la clave de firma
10. [POST /auth-providers/identity-providers/by-code/{code}/authorize](#10-post-auth-providers-identity-providers-by-code-code-authorize) — Iniciar el login federado
11. [POST /auth-providers/identity-providers/by-code/{code}/callback](#11-post-auth-providers-identity-providers-by-code-code-callback) — Procesar el callback del proveedor
12. [POST /auth-providers/tenant-bindings](#12-post-auth-providers-tenant-bindings) — Vincular el proveedor a un tenant

---

## 1. POST /auth-providers/account-link-requests

- **Módulo:** `auth_providers`
- **Etiqueta OpenAPI:** `auth-providers`
- **Nombre:** Solicitar la vinculación de un sujeto externo
- **Operation ID:** `AuthProvidersController_requestAccountLink`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthProvidersController.requestAccountLink](../../src/modules/auth_providers/controllers/auth-providers.controller.ts)

### Descripción de negocio

El token se devuelve una sola vez; en la tabla queda su hash.


### Descripción del sistema

NestJS resuelve `POST /auth-providers/account-link-requests` en `AuthProvidersController_requestAccountLink`. El controlador delega en `FederatedLoginService.requestAccountLink`. Valida el body como `RequestAccountLinkDto` y consume `application/json`. El tipo de retorno estático es `Promise<AccountLinkRequestResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RequestAccountLinkDto`; los campos opcionales se omiten.

```http
POST /auth-providers/account-link-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "providerId": "00000000-0000-4000-8000-000000000001",
  "externalSubject": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `IDENTITY_ADMIN`, `AUTH_SERVICE`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `providerId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `externalSubject` | Sí | `string` | longitud máxima 300 | Sujeto externo que se quiere vincular | `valor-ejemplo` |
| `expiresInMinutes` | No | `number` | mínimo 1; máximo 1440 | Minutos de validez del token | `30` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /auth-providers/account-link-requests HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "providerId": "00000000-0000-4000-8000-000000000001",
  "externalSubject": "valor-ejemplo",
  "expiresInMinutes": 30
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AccountLinkRequestResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AccountLinkRequestResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AccountLinkRequestResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AccountLinkRequestResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AccountLinkRequestResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AccountLinkRequestResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AccountLinkRequestResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AccountLinkRequestResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AccountLinkRequestResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AccountLinkRequestResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "linkToken": "valor-ejemplo",
  "expiresAt": "2026-07-31T12:00:00.000Z",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `linkToken` | Sí | `string` | Sin restricción adicional declarada | Token de vinculación. Se devuelve una sola vez; sólo se guarda su hash. | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | formato `date-time` | Valor de expires at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: IDENTITY_ADMIN, AUTH_SERVICE. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 409 | `CONFLICT` | El sujeto externo ya está vinculado | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 409 | `CONFLICT` | Ya hay una solicitud de vinculación pendiente | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El proveedor está deshabilitado | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/auth-providers/account-link-requests"
}
```

---

## 2. POST /auth-providers/account-link-requests/complete

- **Módulo:** `auth_providers`
- **Etiqueta OpenAPI:** `auth-providers`
- **Nombre:** Completar la vinculación presentando el token
- **Operation ID:** `AuthProvidersController_completeAccountLink`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthProvidersController.completeAccountLink](../../src/modules/auth_providers/controllers/auth-providers.controller.ts)

### Descripción de negocio

Completar la vinculación presentando el token. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /auth-providers/account-link-requests/complete` en `AuthProvidersController_completeAccountLink`. El controlador delega en `FederatedLoginService.completeAccountLink`. Valida el body como `CompleteAccountLinkDto` y consume `application/json`. El tipo de retorno estático es `Promise<CompleteAccountLinkResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CompleteAccountLinkDto`; los campos opcionales se omiten.

```http
POST /auth-providers/account-link-requests/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "linkToken": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `IDENTITY_ADMIN`, `AUTH_SERVICE`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `linkToken` | Sí | `string` | longitud máxima 200 | Token recibido al solicitar la vinculación | `valor-ejemplo` |
| `externalEmail` | No | `string` | longitud máxima 300 | Correo del sujeto externo | `usuario@example.com` |
| `displayName` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `claims` | No | `object` | Sin restricción adicional declarada | Claims con los que se completa la identidad | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /auth-providers/account-link-requests/complete HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "linkToken": "valor-ejemplo",
  "externalEmail": "usuario@example.com",
  "displayName": "Nombre de ejemplo",
  "claims": {}
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CompleteAccountLinkResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CompleteAccountLinkResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CompleteAccountLinkResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CompleteAccountLinkResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CompleteAccountLinkResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CompleteAccountLinkResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CompleteAccountLinkResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CompleteAccountLinkResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CompleteAccountLinkResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CompleteAccountLinkResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "requestId": "00000000-0000-4000-8000-000000000001",
  "federatedIdentityId": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `requestId` | Sí | `string` | formato `uuid` | Solicitud completada | `00000000-0000-4000-8000-000000000001` |
| `federatedIdentityId` | Sí | `string` | formato `uuid` | Identidad federada creada | `00000000-0000-4000-8000-000000000001` |
| `userId` | Sí | `string` | formato `uuid` | Identificador asociado a user. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: IDENTITY_ADMIN, AUTH_SERVICE. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud de vinculación no encontrada | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 409 | `CONFLICT` | El sujeto externo ya está vinculado | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La solicitud ya no está pendiente | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 422 | `PRECONDITION_FAILED` | La solicitud de vinculación caducó | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/auth-providers/account-link-requests/complete"
}
```

---

## 3. POST /auth-providers/federated-identities/{id}/unlink

- **Módulo:** `auth_providers`
- **Etiqueta OpenAPI:** `auth-providers`
- **Nombre:** Desvincular una identidad federada
- **Operation ID:** `AuthProvidersController_unlinkIdentity`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthProvidersController.unlinkIdentity](../../src/modules/auth_providers/controllers/auth-providers.controller.ts)

### Descripción de negocio

Se revoca, no se borra: el histórico de logins apunta a ella.


### Descripción del sistema

NestJS resuelve `POST /auth-providers/federated-identities/{id}/unlink` en `AuthProvidersController_unlinkIdentity`. El controlador delega en `FederatedLoginService.unlinkIdentity`. Valida el body como `UnlinkIdentityDto` y consume `application/json`. El tipo de retorno estático es `Promise<UnlinkIdentityResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UnlinkIdentityDto`; los campos opcionales se omiten.

```http
POST /auth-providers/federated-identities/00000000-0000-4000-8000-000000000001/unlink HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `IDENTITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | Sí | `string` | Sin restricción adicional declarada | Por qué se desvincula | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /auth-providers/federated-identities/00000000-0000-4000-8000-000000000001/unlink HTTP/1.1
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
| 200 | Operación completada correctamente. | `Promise<UnlinkIdentityResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<UnlinkIdentityResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<UnlinkIdentityResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<UnlinkIdentityResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<UnlinkIdentityResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<UnlinkIdentityResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<UnlinkIdentityResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<UnlinkIdentityResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<UnlinkIdentityResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<UnlinkIdentityResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `UnlinkIdentityResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "stateConceptId": "00000000-0000-4000-8000-000000000001",
  "attemptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |
| `attemptId` | Sí | `string` | formato `uuid` | Registro del desenlace | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: IDENTITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Identidad federada no encontrada | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La identidad ya está revocada | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/auth-providers/federated-identities/{id}/unlink"
}
```

---

## 4. POST /auth-providers/identity-providers

- **Módulo:** `auth_providers`
- **Etiqueta OpenAPI:** `auth-providers`
- **Nombre:** Registrar un proveedor de identidad
- **Operation ID:** `AuthProvidersController_createProvider`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthProvidersController.createProvider](../../src/modules/auth_providers/controllers/auth-providers.controller.ts)

### Descripción de negocio

Nace en borrador: sin protocolo configurado no puede autenticar a nadie.


### Descripción del sistema

NestJS resuelve `POST /auth-providers/identity-providers` en `AuthProvidersController_createProvider`. El controlador delega en `AuthProvidersConfigService.createProvider`. Valida el body como `CreateProviderDto` y consume `application/json`. El tipo de retorno estático es `Promise<ProviderResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateProviderDto`; los campos opcionales se omiten.

```http
POST /auth-providers/identity-providers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "protocol": "OIDC",
  "category": "ENTERPRISE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `IDENTITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Tenant dueño si no es global | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | longitud máxima 100 | Código del proveedor, único | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `protocol` | Sí | `string` | valores: `OIDC`, `SAML`, `OAUTH2` | Sin descripción específica en el contrato OpenAPI. | `OIDC` |
| `category` | Sí | `string` | valores: `ENTERPRISE`, `SOCIAL`, `GOVERNMENT` | Sin descripción específica en el contrato OpenAPI. | `ENTERPRISE` |
| `issuer` | No | `string` | longitud máxima 500 | Emisor declarado por el proveedor | `valor-ejemplo` |
| `isGlobal` | No | `boolean` | Sin restricción adicional declarada | Disponible para todos los tenants sin vínculo explícito | `false` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /auth-providers/identity-providers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "protocol": "OIDC",
  "category": "ENTERPRISE",
  "issuer": "valor-ejemplo",
  "isGlobal": false
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ProviderResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ProviderResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProviderResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "state": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Valor de code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Valor de name mantenido por la instancia. | `Nombre de ejemplo` |
| `state` | Sí | `string` | formato `uuid` | Concept id del estado | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: IDENTITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un proveedor con ese código | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Un proveedor no global necesita el tenant al que pertenece | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/auth-providers/identity-providers"
}
```

---

## 5. PUT /auth-providers/identity-providers/{id}/attribute-mappings

- **Módulo:** `auth_providers`
- **Etiqueta OpenAPI:** `auth-providers`
- **Nombre:** Fijar el mapeo de atributos del proveedor
- **Operation ID:** `AuthProvidersController_setAttributeMappings`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthProvidersController.setAttributeMappings](../../src/modules/auth_providers/controllers/auth-providers.controller.ts)

### Descripción de negocio

Reemplaza el mapeo completo y exige exactamente un claim identificador.


### Descripción del sistema

NestJS resuelve `PUT /auth-providers/identity-providers/{id}/attribute-mappings` en `AuthProvidersController_setAttributeMappings`. El controlador delega en `AuthProvidersConfigService.setAttributeMappings`. Valida el body como `SetAttributeMappingsDto` y consume `application/json`. El tipo de retorno estático es `Promise<AttributeMappingsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SetAttributeMappingsDto`; los campos opcionales se omiten.

```http
PUT /auth-providers/identity-providers/00000000-0000-4000-8000-000000000001/attribute-mappings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mappings": [
    {
      "sourceClaim": "valor-ejemplo",
      "targetAttribute": "valor-ejemplo"
    }
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `IDENTITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `mappings` | Sí | `array<AttributeMappingDto>` | mínimo 1 elemento(s) | Mapeo completo; reemplaza el anterior | `[{"sourceClaim":"valor-ejemplo","targetAttribute":"valor-ejemplo","isIdentifier":false,"required":false,"transformJson":{}}]` |
| `mappings[].sourceClaim` | Sí | `string` | longitud máxima 200 | Claim que envía el proveedor | `valor-ejemplo` |
| `mappings[].targetAttribute` | Sí | `string` | longitud máxima 200 | Atributo del modelo al que se traduce | `valor-ejemplo` |
| `mappings[].isIdentifier` | No | `boolean` | Sin restricción adicional declarada | Es el claim que identifica al sujeto; sólo puede haber uno | `false` |
| `mappings[].required` | No | `boolean` | Sin restricción adicional declarada | Sin este claim el login se rechaza | `false` |
| `mappings[].transformJson` | No | `object` | Sin restricción adicional declarada | Transformación a aplicar al valor | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /auth-providers/identity-providers/00000000-0000-4000-8000-000000000001/attribute-mappings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mappings": [
    {
      "sourceClaim": "valor-ejemplo",
      "targetAttribute": "valor-ejemplo",
      "isIdentifier": false,
      "required": false,
      "transformJson": {}
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AttributeMappingsResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AttributeMappingsResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AttributeMappingsResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AttributeMappingsResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<AttributeMappingsResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AttributeMappingsResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AttributeMappingsResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AttributeMappingsResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AttributeMappingsResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AttributeMappingsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AttributeMappingsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "providerId": "00000000-0000-4000-8000-000000000001",
  "mappingIds": [
    "valor-ejemplo"
  ],
  "removed": 1,
  "identifierClaim": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `providerId` | Sí | `string` | formato `uuid` | Identificador asociado a provider. | `00000000-0000-4000-8000-000000000001` |
| `mappingIds` | Sí | `array<string>` | formato `uuid` | Valor de mapping ids mantenido por la instancia. | `["valor-ejemplo"]` |
| `removed` | Sí | `number` | Sin restricción adicional declarada | Mapeos anteriores retirados | `1` |
| `identifierClaim` | Sí | `string` | Sin restricción adicional declarada | Claim que identifica al sujeto | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: IDENTITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El mapeo necesita exactamente un claim identificador | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 422 | `PRECONDITION_FAILED` | El claim de origen está repetido en el mapeo | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/auth-providers/identity-providers/{id}/attribute-mappings"
}
```

---

## 6. POST /auth-providers/identity-providers/{id}/protocol-configs

- **Módulo:** `auth_providers`
- **Etiqueta OpenAPI:** `auth-providers`
- **Nombre:** Configurar el protocolo de un entorno e importar el JWKS
- **Operation ID:** `AuthProvidersController_configureProtocol`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthProvidersController.configureProtocol](../../src/modules/auth_providers/controllers/auth-providers.controller.ts)

### Descripción de negocio

Reconfigurar reemplaza: sólo hay una configuración activa por entorno.


### Descripción del sistema

NestJS resuelve `POST /auth-providers/identity-providers/{id}/protocol-configs` en `AuthProvidersController_configureProtocol`. El controlador delega en `AuthProvidersConfigService.configureProtocol`. Valida el body como `ConfigureProtocolDto` y consume `application/json`. El tipo de retorno estático es `Promise<ProtocolConfigResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ConfigureProtocolDto`; los campos opcionales se omiten.

```http
POST /auth-providers/identity-providers/00000000-0000-4000-8000-000000000001/protocol-configs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "environment": "DEVELOPMENT"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `IDENTITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `environment` | Sí | `string` | valores: `DEVELOPMENT`, `STAGING`, `PRODUCTION` | Sin descripción específica en el contrato OpenAPI. | `DEVELOPMENT` |
| `clientId` | No | `string` | longitud máxima 300 | Identificador de cliente ante el proveedor | `00000000-0000-4000-8000-000000000001` |
| `clientSecretRef` | No | `string` | longitud máxima 300 | Referencia del secreto en el vault; el secreto nunca viaja aquí | `valor-ejemplo` |
| `authorizeUrl` | No | `string` | Sin restricción adicional declarada | Endpoint de autorización | `valor-ejemplo` |
| `tokenUrl` | No | `string` | Sin restricción adicional declarada | Endpoint de token | `valor-ejemplo` |
| `userinfoUrl` | No | `string` | Sin restricción adicional declarada | Endpoint de información de usuario | `valor-ejemplo` |
| `jwksUri` | No | `string` | Sin restricción adicional declarada | JWKS del proveedor | `valor-ejemplo` |
| `metadataUrl` | No | `string` | Sin restricción adicional declarada | Documento de descubrimiento | `valor-ejemplo` |
| `samlEntityId` | No | `string` | longitud máxima 500 | Entity ID SAML | `00000000-0000-4000-8000-000000000001` |
| `samlAcsUrl` | No | `string` | Sin restricción adicional declarada | Assertion Consumer Service SAML | `valor-ejemplo` |
| `scopes` | No | `string` | longitud máxima 500 | Ámbitos solicitados | `valor-ejemplo` |
| `responseType` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `tokenEndpointAuth` | No | `string` | valores: `CLIENT_SECRET_POST`, `CLIENT_SECRET_BASIC`, `PRIVATE_KEY_JWT` | Sin descripción específica en el contrato OpenAPI. | `CLIENT_SECRET_POST` |
| `pkceRequired` | No | `boolean` | Sin restricción adicional declarada | Exigir PKCE; desactivarlo abre el flujo a interceptación del código | `true` |
| `extraConfigJson` | No | `object` | Sin restricción adicional declarada | Configuración adicional del proveedor | `{}` |
| `discoveredKeys` | No | `array<DiscoveredKeyDto>` | Sin restricción adicional declarada | Claves descubiertas en el JWKS del proveedor | `[{"keyId":"00000000-0000-4000-8000-000000000001","algorithm":"valor-ejemplo","publicKey":"valor-ejemplo","certificate":"valor-ejemplo"}]` |
| `discoveredKeys[].keyId` | No | `string` | longitud máxima 200 | Identificador de la clave en el JWKS | `00000000-0000-4000-8000-000000000001` |
| `discoveredKeys[].algorithm` | No | `string` | longitud máxima 50 | Algoritmo de firma | `valor-ejemplo` |
| `discoveredKeys[].publicKey` | No | `string` | Sin restricción adicional declarada | Clave pública en formato PEM o JWK | `valor-ejemplo` |
| `discoveredKeys[].certificate` | No | `string` | Sin restricción adicional declarada | Certificado asociado | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /auth-providers/identity-providers/00000000-0000-4000-8000-000000000001/protocol-configs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "environment": "DEVELOPMENT",
  "clientId": "00000000-0000-4000-8000-000000000001",
  "clientSecretRef": "valor-ejemplo",
  "authorizeUrl": "valor-ejemplo",
  "tokenUrl": "valor-ejemplo",
  "userinfoUrl": "valor-ejemplo",
  "jwksUri": "valor-ejemplo",
  "metadataUrl": "valor-ejemplo",
  "samlEntityId": "00000000-0000-4000-8000-000000000001",
  "samlAcsUrl": "valor-ejemplo",
  "scopes": "valor-ejemplo",
  "responseType": "valor-ejemplo",
  "tokenEndpointAuth": "CLIENT_SECRET_POST",
  "pkceRequired": true,
  "extraConfigJson": {},
  "discoveredKeys": [
    {
      "keyId": "00000000-0000-4000-8000-000000000001",
      "algorithm": "valor-ejemplo",
      "publicKey": "valor-ejemplo",
      "certificate": "valor-ejemplo"
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ProtocolConfigResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ProtocolConfigResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ProtocolConfigResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ProtocolConfigResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ProtocolConfigResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ProtocolConfigResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ProtocolConfigResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ProtocolConfigResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ProtocolConfigResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ProtocolConfigResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProtocolConfigResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "providerId": "00000000-0000-4000-8000-000000000001",
  "environmentConceptId": "00000000-0000-4000-8000-000000000001",
  "replaced": true,
  "importedKeyIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `providerId` | Sí | `string` | formato `uuid` | Identificador asociado a provider. | `00000000-0000-4000-8000-000000000001` |
| `environmentConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a environment concept. | `00000000-0000-4000-8000-000000000001` |
| `replaced` | Sí | `boolean` | Sin restricción adicional declarada | true si sustituyó a una configuración existente | `true` |
| `importedKeyIds` | Sí | `array<string>` | formato `uuid` | Claves importadas del JWKS | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: IDENTITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una configuración SAML necesita entity ID y ACS URL | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 422 | `PRECONDITION_FAILED` | La configuración necesita el identificador de cliente | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 422 | `PRECONDITION_FAILED` | La configuración necesita los endpoints de autorización y token | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 422 | `PRECONDITION_FAILED` | Una configuración OIDC necesita JWKS o documento de descubrimiento | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/auth-providers/identity-providers/{id}/protocol-configs"
}
```

---

## 7. POST /auth-providers/identity-providers/{id}/provisioning-rules

- **Módulo:** `auth_providers`
- **Etiqueta OpenAPI:** `auth-providers`
- **Nombre:** Definir una regla de aprovisionamiento
- **Operation ID:** `AuthProvidersController_createProvisioningRule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthProvidersController.createProvisioningRule](../../src/modules/auth_providers/controllers/auth-providers.controller.ts)

### Descripción de negocio

La prioridad es única: decide la primera regla que case.


### Descripción del sistema

NestJS resuelve `POST /auth-providers/identity-providers/{id}/provisioning-rules` en `AuthProvidersController_createProvisioningRule`. El controlador delega en `AuthProvidersConfigService.createProvisioningRule`. Valida el body como `CreateProvisioningRuleDto` y consume `application/json`. El tipo de retorno estático es `Promise<ProvisioningRuleResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateProvisioningRuleDto`; los campos opcionales se omiten.

```http
POST /auth-providers/identity-providers/00000000-0000-4000-8000-000000000001/provisioning-rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "priority": 1,
  "effect": "ALLOW"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `IDENTITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Tenant al que aplica; si falta, a todos | `00000000-0000-4000-8000-000000000001` |
| `priority` | Sí | `number` | mínimo 1 | Prioridad; la primera regla que case decide | `1` |
| `conditionJson` | No | `object` | Sin restricción adicional declarada | Condición sobre los claims recibidos | `{}` |
| `effect` | Sí | `string` | valores: `ALLOW`, `DENY` | Sin descripción específica en el contrato OpenAPI. | `ALLOW` |
| `assignRoleConceptId` | No | `string` | formato `uuid` | Rol a asignar; sólo con efecto ALLOW | `00000000-0000-4000-8000-000000000001` |
| `assignTenantId` | No | `string` | formato `uuid` | Tenant a asignar; sólo con efecto ALLOW | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /auth-providers/identity-providers/00000000-0000-4000-8000-000000000001/provisioning-rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "priority": 1,
  "conditionJson": {},
  "effect": "ALLOW",
  "assignRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "assignTenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ProvisioningRuleResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ProvisioningRuleResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ProvisioningRuleResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ProvisioningRuleResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ProvisioningRuleResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ProvisioningRuleResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ProvisioningRuleResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ProvisioningRuleResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ProvisioningRuleResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ProvisioningRuleResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProvisioningRuleResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "priority": 1,
  "effectConceptId": "00000000-0000-4000-8000-000000000001",
  "isActive": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `priority` | Sí | `number` | Sin restricción adicional declarada | Valor de priority mantenido por la instancia. | `1` |
| `effectConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a effect concept. | `00000000-0000-4000-8000-000000000001` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is active mantenido por la instancia. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: IDENTITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 409 | `CONFLICT` | Ya existe una regla con esa prioridad | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Una regla DENY no asigna rol ni tenant | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/auth-providers/identity-providers/{id}/provisioning-rules"
}
```

---

## 8. POST /auth-providers/identity-providers/{id}/signing-keys

- **Módulo:** `auth_providers`
- **Etiqueta OpenAPI:** `auth-providers`
- **Nombre:** Publicar una clave de firma del proveedor
- **Operation ID:** `AuthProvidersController_publishSigningKey`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthProvidersController.publishSigningKey](../../src/modules/auth_providers/controllers/auth-providers.controller.ts)

### Descripción de negocio

Publicar una clave de firma del proveedor. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /auth-providers/identity-providers/{id}/signing-keys` en `AuthProvidersController_publishSigningKey`. El controlador delega en `AuthProvidersConfigService.publishSigningKey`. Valida el body como `PublishSigningKeyDto` y consume `application/json`. El tipo de retorno estático es `Promise<SigningKeyResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PublishSigningKeyDto`; los campos opcionales se omiten.

```http
POST /auth-providers/identity-providers/00000000-0000-4000-8000-000000000001/signing-keys HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "keyId": "00000000-0000-4000-8000-000000000001",
  "algorithm": "valor-ejemplo",
  "publicKey": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `IDENTITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `keyId` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `algorithm` | Sí | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `publicKey` | Sí | `string` | Sin restricción adicional declarada | Clave pública en PEM o JWK | `valor-ejemplo` |
| `certificate` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `validFrom` | No | `string` | formato `date-time` | Desde cuándo es válida | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /auth-providers/identity-providers/00000000-0000-4000-8000-000000000001/signing-keys HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "keyId": "00000000-0000-4000-8000-000000000001",
  "algorithm": "valor-ejemplo",
  "publicKey": "valor-ejemplo",
  "certificate": "valor-ejemplo",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<SigningKeyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SigningKeyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SigningKeyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SigningKeyResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<SigningKeyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SigningKeyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<SigningKeyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SigningKeyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SigningKeyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SigningKeyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SigningKeyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "keyId": "00000000-0000-4000-8000-000000000001",
  "stateConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `keyId` | Sí | `string` | Sin restricción adicional declarada | Identificador asociado a key. | `00000000-0000-4000-8000-000000000001` |
| `stateConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a state concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: IDENTITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 409 | `CONFLICT` | El proveedor ya tiene una clave con ese identificador | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La vigencia de la clave está invertida | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/auth-providers/identity-providers/{id}/signing-keys"
}
```

---

## 9. POST /auth-providers/identity-providers/{id}/signing-keys/rotate

- **Módulo:** `auth_providers`
- **Etiqueta OpenAPI:** `auth-providers`
- **Nombre:** Rotar la clave de firma
- **Operation ID:** `AuthProvidersController_rotateSigningKey`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthProvidersController.rotateSigningKey](../../src/modules/auth_providers/controllers/auth-providers.controller.ts)

### Descripción de negocio

Las salientes quedan retirándose durante el periodo de gracia: retirarlas de golpe invalidaría los tokens en vuelo.


### Descripción del sistema

NestJS resuelve `POST /auth-providers/identity-providers/{id}/signing-keys/rotate` en `AuthProvidersController_rotateSigningKey`. El controlador delega en `AuthProvidersConfigService.rotateSigningKey`. Valida el body como `RotateSigningKeyDto` y consume `application/json`. El tipo de retorno estático es `Promise<RotateKeyResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RotateSigningKeyDto`; los campos opcionales se omiten.

```http
POST /auth-providers/identity-providers/00000000-0000-4000-8000-000000000001/signing-keys/rotate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "keyId": "00000000-0000-4000-8000-000000000001",
  "algorithm": "valor-ejemplo",
  "publicKey": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `IDENTITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `keyId` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `algorithm` | Sí | `string` | longitud máxima 50 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `publicKey` | Sí | `string` | Sin restricción adicional declarada | Clave pública en PEM o JWK | `valor-ejemplo` |
| `certificate` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `validFrom` | No | `string` | formato `date-time` | Desde cuándo es válida | `2026-07-31T12:00:00.000Z` |
| `validTo` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `graceHours` | No | `number` | mínimo 0; máximo 720 | Horas que la clave saliente sigue aceptándose. Retirarla de golpe invalidaría los tokens en vuelo. | `24` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /auth-providers/identity-providers/00000000-0000-4000-8000-000000000001/signing-keys/rotate HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "keyId": "00000000-0000-4000-8000-000000000001",
  "algorithm": "valor-ejemplo",
  "publicKey": "valor-ejemplo",
  "certificate": "valor-ejemplo",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "graceHours": 24
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RotateKeyResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RotateKeyResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RotateKeyResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RotateKeyResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<RotateKeyResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RotateKeyResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RotateKeyResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RotateKeyResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RotateKeyResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RotateKeyResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RotateKeyResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "newKeyId": "00000000-0000-4000-8000-000000000001",
  "retiringCount": 1,
  "graceUntil": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `newKeyId` | Sí | `string` | formato `uuid` | Clave nueva, activa | `00000000-0000-4000-8000-000000000001` |
| `retiringCount` | Sí | `number` | Sin restricción adicional declarada | Claves que pasaron a retirándose | `1` |
| `graceUntil` | No | `string` | formato `date-time` | Hasta cuándo se aceptan las salientes | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: IDENTITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 409 | `CONFLICT` | El proveedor ya tiene una clave con ese identificador | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
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
  "path": "/auth-providers/identity-providers/{id}/signing-keys/rotate"
}
```

---

## 10. POST /auth-providers/identity-providers/by-code/{code}/authorize

- **Módulo:** `auth_providers`
- **Etiqueta OpenAPI:** `auth-providers`
- **Nombre:** Iniciar el login federado
- **Operation ID:** `AuthProvidersController_startLogin`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthProvidersController.startLogin](../../src/modules/auth_providers/controllers/auth-providers.controller.ts)

### Descripción de negocio

Registra el intento y devuelve el `state` que el callback debe presentar.


### Descripción del sistema

NestJS resuelve `POST /auth-providers/identity-providers/by-code/{code}/authorize` en `AuthProvidersController_startLogin`. El controlador delega en `FederatedLoginService.startLogin`. Valida el body como `StartLoginDto` y consume `application/json`. El tipo de retorno estático es `Promise<StartLoginResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `code` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `StartLoginDto`; los campos opcionales se omiten.

```http
POST /auth-providers/identity-providers/by-code/CODIGO_EJEMPLO/authorize HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `IDENTITY_ADMIN`, `AUTH_SERVICE`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | No | `string` | formato `uuid` | Tenant al que se quiere entrar | `00000000-0000-4000-8000-000000000001` |
| `environment` | No | `string` | valores: `DEVELOPMENT`, `STAGING`, `PRODUCTION` | Sin descripción específica en el contrato OpenAPI. | `PRODUCTION` |
| `ip` | No | `string` | longitud máxima 100 | IP de origen; se registra en el intento | `valor-ejemplo` |
| `userAgent` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /auth-providers/identity-providers/by-code/CODIGO_EJEMPLO/authorize HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "environment": "PRODUCTION",
  "ip": "valor-ejemplo",
  "userAgent": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StartLoginResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StartLoginResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StartLoginResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StartLoginResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StartLoginResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StartLoginResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<StartLoginResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StartLoginResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StartLoginResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StartLoginResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StartLoginResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "attemptId": "00000000-0000-4000-8000-000000000001",
  "state": "valor-ejemplo",
  "nonce": "valor-ejemplo",
  "authorizeUrl": "valor-ejemplo",
  "pkceRequired": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `attemptId` | Sí | `string` | formato `uuid` | Intento de login registrado | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | Sin restricción adicional declarada | Valor de `state` que el callback debe devolver | `valor-ejemplo` |
| `nonce` | Sí | `string` | Sin restricción adicional declarada | Nonce que liga la respuesta a esta petición | `valor-ejemplo` |
| `authorizeUrl` | Sí | `string` | Sin restricción adicional declarada | URL de autorización del proveedor | `valor-ejemplo` |
| `pkceRequired` | Sí | `boolean` | Sin restricción adicional declarada | true si el proveedor exige PKCE | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: IDENTITY_ADMIN, AUTH_SERVICE. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El proveedor no está activo | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 422 | `PRECONDITION_FAILED` | El proveedor no tiene configuración activa para ese entorno | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 422 | `PRECONDITION_FAILED` | La configuración no declara endpoint de autorización | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 422 | `PRECONDITION_FAILED` | El proveedor no está habilitado para ese tenant | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/auth-providers/identity-providers/by-code/{code}/authorize"
}
```

---

## 11. POST /auth-providers/identity-providers/by-code/{code}/callback

- **Módulo:** `auth_providers`
- **Etiqueta OpenAPI:** `auth-providers`
- **Nombre:** Procesar el callback del proveedor
- **Operation ID:** `AuthProvidersController_processCallback`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthProvidersController.processCallback](../../src/modules/auth_providers/controllers/auth-providers.controller.ts)

### Descripción de negocio

Todo desenlace queda registrado. Sin identidad previa devuelve un token de vinculación en lugar de crear el usuario local.


### Descripción del sistema

NestJS resuelve `POST /auth-providers/identity-providers/by-code/{code}/callback` en `AuthProvidersController_processCallback`. El controlador delega en `FederatedLoginService.processCallback`. Valida el body como `ProcessCallbackDto` y consume `application/json`. El tipo de retorno estático es `Promise<CallbackResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `code` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ProcessCallbackDto`; los campos opcionales se omiten.

```http
POST /auth-providers/identity-providers/by-code/CODIGO_EJEMPLO/callback HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "state": "valor-ejemplo",
  "externalSubject": "valor-ejemplo",
  "claims": {}
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `IDENTITY_ADMIN`, `AUTH_SERVICE`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `state` | Sí | `string` | longitud máxima 200 | El `state` devuelto por el proveedor | `valor-ejemplo` |
| `externalSubject` | Sí | `string` | longitud máxima 300 | Identificador del sujeto en el proveedor | `valor-ejemplo` |
| `claims` | Sí | `object` | Sin restricción adicional declarada | Claims recibidos del proveedor, ya verificados por quien llama | `{}` |
| `tenantId` | No | `string` | formato `uuid` | Tenant en el que se entra | `00000000-0000-4000-8000-000000000001` |
| `userId` | No | `string` | formato `uuid` | Usuario local ya resuelto por IAM. Este módulo no crea usuarios: sin él, el login sin identidad previa devuelve un token de vinculación. | `00000000-0000-4000-8000-000000000001` |
| `ip` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `userAgent` | No | `string` | longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /auth-providers/identity-providers/by-code/CODIGO_EJEMPLO/callback HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "state": "valor-ejemplo",
  "externalSubject": "valor-ejemplo",
  "claims": {},
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "ip": "valor-ejemplo",
  "userAgent": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CallbackResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CallbackResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CallbackResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CallbackResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CallbackResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CallbackResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CallbackResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CallbackResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CallbackResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CallbackResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CallbackResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "federatedIdentityId": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "outcomeConceptId": "00000000-0000-4000-8000-000000000001",
  "failureReasonConceptId": "00000000-0000-4000-8000-000000000001",
  "provisioned": true,
  "linkToken": "valor-ejemplo",
  "attemptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `federatedIdentityId` | No | `string` | formato `uuid` | Identidad federada resuelta | `00000000-0000-4000-8000-000000000001` |
| `userId` | No | `string` | formato `uuid` | Usuario local al que corresponde | `00000000-0000-4000-8000-000000000001` |
| `outcomeConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a outcome concept. | `00000000-0000-4000-8000-000000000001` |
| `failureReasonConceptId` | No | `string` | formato `uuid` | Motivo cuando el login se rechaza | `00000000-0000-4000-8000-000000000001` |
| `provisioned` | Sí | `boolean` | Sin restricción adicional declarada | true si la identidad se creó en este login | `true` |
| `linkToken` | No | `string` | Sin restricción adicional declarada | Token de vinculación cuando hace falta confirmar la cuenta | `valor-ejemplo` |
| `attemptId` | Sí | `string` | formato `uuid` | Intento registrado | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: IDENTITY_ADMIN, AUTH_SERVICE. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El `state` no corresponde a un login iniciado | Excepción explícita en src/modules/auth_providers/services/federated-login.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/auth-providers/identity-providers/by-code/{code}/callback"
}
```

---

## 12. POST /auth-providers/tenant-bindings

- **Módulo:** `auth_providers`
- **Etiqueta OpenAPI:** `auth-providers`
- **Nombre:** Vincular el proveedor a un tenant
- **Operation ID:** `AuthProvidersController_bindTenant`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuthProvidersController.bindTenant](../../src/modules/auth_providers/controllers/auth-providers.controller.ts)

### Descripción de negocio

Aprovisionar automáticamente exige declarar el rol por defecto.


### Descripción del sistema

NestJS resuelve `POST /auth-providers/tenant-bindings` en `AuthProvidersController_bindTenant`. El controlador delega en `AuthProvidersConfigService.bindTenant`. Valida el body como `BindTenantDto` y consume `application/json`. El tipo de retorno estático es `Promise<BindingResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `BindTenantDto`; los campos opcionales se omiten.

```http
POST /auth-providers/tenant-bindings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "providerId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `IDENTITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `providerId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `isEnabled` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `autoProvision` | No | `boolean` | Sin restricción adicional declarada | Crear el usuario local automáticamente al primer login | `false` |
| `justInTimeProvisioning` | No | `boolean` | Sin restricción adicional declarada | Aprovisionar en el momento del login, sin invitación previa | `false` |
| `defaultRoleConceptId` | No | `string` | formato `uuid` | Rol con el que se aprovisiona | `00000000-0000-4000-8000-000000000001` |
| `allowedEmailDomains` | No | `string` | longitud máxima 500 | Dominios de correo admitidos, separados por coma | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /auth-providers/tenant-bindings HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "providerId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "isEnabled": true,
  "autoProvision": false,
  "justInTimeProvisioning": false,
  "defaultRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "allowedEmailDomains": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<BindingResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BindingResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BindingResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BindingResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BindingResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<BindingResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BindingResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BindingResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BindingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BindingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "providerId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "isEnabled": true,
  "updated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `providerId` | Sí | `string` | formato `uuid` | Identificador asociado a provider. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Identificador asociado a tenant. | `00000000-0000-4000-8000-000000000001` |
| `isEnabled` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is enabled mantenido por la instancia. | `true` |
| `updated` | Sí | `boolean` | Sin restricción adicional declarada | true si el vínculo ya existía y se actualizó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: IDENTITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Proveedor no encontrado | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Aprovisionar automáticamente exige declarar el rol por defecto | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 422 | `PRECONDITION_FAILED` | El proveedor está deshabilitado | Excepción explícita en src/modules/auth_providers/services/auth-providers-config.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/auth-providers/tenant-bindings"
}
```

---

