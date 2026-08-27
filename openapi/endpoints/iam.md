<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `iam`

Referencia exhaustiva de 30 operación(es) del módulo `iam`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `iam-auth`, `iam-users`
- **Controladores:** `IamAuthController`, `IamUsersController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /iam/auth/activate](#1-post-iam-auth-activate) — Activar la cuenta con el token de un solo uso y fijar la contraseña
2. [POST /iam/auth/forgot-password](#2-post-iam-auth-forgot-password) — Solicitar el restablecimiento de la contraseña
3. [POST /iam/auth/login](#3-post-iam-auth-login) — Iniciar sesión con email o documento de identidad y contraseña
4. [POST /iam/auth/logout](#4-post-iam-auth-logout) — Cerrar la sesión actual del usuario
5. [POST /iam/auth/logout-all](#5-post-iam-auth-logout-all) — Cerrar todas las sesiones del usuario actual
6. [POST /iam/auth/register-organization](#6-post-iam-auth-register-organization) — Registrar una organización con su cuenta owner
7. [POST /iam/auth/register-patient](#7-post-iam-auth-register-patient) — Registrarse como paciente con documento de identidad
8. [POST /iam/auth/register-practitioner](#8-post-iam-auth-register-practitioner) — Registrarse como profesional de salud con su matrícula
9. [POST /iam/auth/resend-verification](#9-post-iam-auth-resend-verification) — Reenviar el enlace de verificación del correo
10. [POST /iam/auth/reset-password](#10-post-iam-auth-reset-password) — Fijar una contraseña nueva con el token recibido por correo
11. [POST /iam/auth/sessions/purge](#11-post-iam-auth-sessions-purge) — Expirar sesiones y tokens vencidos
12. [POST /iam/auth/token/refresh](#12-post-iam-auth-token-refresh) — Rotar el refresh token
13. [POST /iam/auth/verify-email](#13-post-iam-auth-verify-email) — Verificar el correo con el token recibido
14. [GET /iam/users](#14-get-iam-users) — Listado paginado de usuarios
15. [POST /iam/users](#15-post-iam-users) — Crear un usuario con credencial de contraseña y rol inicial
16. [GET /iam/users/{id}](#16-get-iam-users-id) — Ficha de un usuario
17. [POST /iam/users/{id}/anonymize](#17-post-iam-users-id-anonymize) — Anonimizar (DSAR) la cuenta
18. [GET /iam/users/{id}/credentials](#18-get-iam-users-id-credentials) — Credenciales del usuario
19. [POST /iam/users/{id}/credentials/{cid}/revoke](#19-post-iam-users-id-credentials-cid-revoke) — Revocar una credencial del usuario
20. [POST /iam/users/{id}/credentials/federated](#20-post-iam-users-id-credentials-federated) — Enlazar una credencial de identidad federada
21. [GET /iam/users/{id}/devices](#21-get-iam-users-id-devices) — Dispositivos del usuario
22. [POST /iam/users/{id}/devices](#22-post-iam-users-id-devices) — Registrar un dispositivo del usuario
23. [GET /iam/users/{id}/global-roles](#23-get-iam-users-id-global-roles) — Roles globales del usuario
24. [POST /iam/users/{id}/global-roles](#24-post-iam-users-id-global-roles) — Conceder o revocar un rol global
25. [POST /iam/users/{id}/lock](#25-post-iam-users-id-lock) — Bloquear la cuenta y revocar sus sesiones
26. [GET /iam/users/{id}/mfa-factors](#26-get-iam-users-id-mfa-factors) — Factores de MFA del usuario
27. [POST /iam/users/{id}/mfa-factors](#27-post-iam-users-id-mfa-factors) — Enrolar o verificar un factor MFA
28. [GET /iam/users/{id}/sessions](#28-get-iam-users-id-sessions) — Sesiones del usuario
29. [POST /iam/users/assisted-practitioner-registration](#29-post-iam-users-assisted-practitioner-registration) — Alta administrativa de un profesional (devuelve token de activación)
30. [POST /iam/users/assisted-registration](#30-post-iam-users-assisted-registration) — Registro asistido de un paciente (devuelve token de activación)

---

## 1. POST /iam/auth/activate

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-auth`
- **Nombre:** Activar la cuenta con el token de un solo uso y fijar la contraseña
- **Operation ID:** `IamAuthController_activate`
- **Autenticación:** Pública
- **Implementación:** [IamAuthController.activate](../../src/modules/iam/controllers/iam-auth.controller.ts)

### Descripción de negocio

Activar la cuenta con el token de un solo uso y fijar la contraseña. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: C-18: el titular consume el token de activación de un solo uso y fija su contraseña definitiva. El creador de la cuenta nunca ve esta contraseña.

### Descripción del sistema

NestJS resuelve `POST /iam/auth/activate` en `IamAuthController_activate`. El controlador delega en `IamAssistedRegistrationService.activateAccount`. Valida el body como `ActivateAccountDto` y consume `application/json`. El tipo de retorno estático es `Promise<ActivationResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ActivateAccountDto`; los campos opcionales se omiten.

```http
POST /iam/auth/activate HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "activationToken": "valor-ejemplo",
  "newPassword": "ClaveSegura2026!"
}
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 10, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `activationToken` | Sí | `string` | longitud mínima 1; longitud máxima 500 | Token de activación de un solo uso recibido por canal seguro | `valor-ejemplo` |
| `newPassword` | Sí | `string` | longitud mínima 8; longitud máxima 200 | Contraseña definitiva elegida por el titular (se persiste solo su hash argon2id) | `ClaveSegura2026!` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/auth/activate HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "activationToken": "valor-ejemplo",
  "newPassword": "ClaveSegura2026!"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ActivationResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ActivationResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ActivationResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ActivationResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ActivationResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ActivationResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ActivationResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ActivationResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "status": "ACTIVE",
  "activated": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `userId` | Sí | `string` | formato `uuid` | Id de la cuenta activada | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Estado resultante de la cuenta | `ACTIVE` |
| `activated` | Sí | `boolean` | Sin restricción adicional declarada | true si la activación se aplicó | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | Token de activación inválido | Excepción explícita en src/modules/iam/services/iam-assisted-registration.service.ts |
| 401 | `UNAUTHENTICATED` | El token de activación ya fue utilizado | Excepción explícita en src/modules/iam/services/iam-assisted-registration.service.ts |
| 401 | `UNAUTHENTICATED` | El token de activación expiró | Excepción explícita en src/modules/iam/services/iam-assisted-registration.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 10, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/auth/activate"
}
```

---

## 2. POST /iam/auth/forgot-password

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-auth`
- **Nombre:** Solicitar el restablecimiento de la contraseña
- **Operation ID:** `IamAuthController_forgotPassword`
- **Autenticación:** Pública
- **Implementación:** [IamAuthController.forgotPassword](../../src/modules/iam/controllers/iam-auth.controller.ts)

### Descripción de negocio

Solicitar el restablecimiento de la contraseña. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-01-13: pide el enlace de restablecimiento. Responde **202 y el mismo mensaje siempre**, exista o no la cuenta. Un 404 cuando el correo no está registrado convertiría este formulario, que es público, en un oráculo de qué direcciones tienen cuenta en una plataforma de salud. El límite es más estricto que el del login porque cada solicitud válida dispara un correo: sin techo, el formulario es un amplificador de spam contra la bandeja de un tercero.

### Descripción del sistema

NestJS resuelve `POST /iam/auth/forgot-password` en `IamAuthController_forgotPassword`. El controlador delega en `IamPasswordResetService.requestReset`. Valida el body como `ForgotPasswordDto` y consume `application/json`. El tipo de retorno estático es `Promise<ForgotPasswordResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ForgotPasswordDto`; los campos opcionales se omiten.

```http
POST /iam/auth/forgot-password HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "identifier": "valor-ejemplo"
}
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 5, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `identifier` | Sí | `string` | longitud mínima 1; longitud máxima 320 | Correo o documento con el que la persona inicia sesión | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/auth/forgot-password HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "identifier": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 202 | Solicitud aceptada para procesamiento asíncrono. | `Promise<ForgotPasswordResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ForgotPasswordResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ForgotPasswordResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ForgotPasswordResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ForgotPasswordResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ForgotPasswordResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ForgotPasswordResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ForgotPasswordResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "message": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `message` | Sí | `string` | Sin restricción adicional declarada | Mensaje neutro, idéntico exista o no la cuenta, para no confirmar registros | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Canal no encontrado | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La notificación necesita destinatario interno o dirección de destino | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal no está activo | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla no está publicada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla es de otro canal | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 5, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/auth/forgot-password"
}
```

---

## 3. POST /iam/auth/login

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-auth`
- **Nombre:** Iniciar sesión con email o documento de identidad y contraseña
- **Operation ID:** `IamAuthController_login`
- **Autenticación:** Pública
- **Implementación:** [IamAuthController.login](../../src/modules/iam/controllers/iam-auth.controller.ts)

### Descripción de negocio

Iniciar sesión con email o documento de identidad y contraseña. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /iam/auth/login` en `IamAuthController_login`. El controlador delega en `IamAuthService.login`. Valida el body como `LoginDto` y consume `application/json`. El tipo de retorno estático es `Promise<TokenResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LoginDto`; los campos opcionales se omiten.

```http
POST /iam/auth/login HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "password": "ClaveSegura2026!"
}
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 10, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `email` | No | `string` | formato `email`; longitud máxima 320 | Sin descripción específica en el contrato OpenAPI. | `usuario@example.com` |
| `nationalId` | No | `string` | longitud máxima 40 | Documento de identidad (CI) | `00000000-0000-4000-8000-000000000001` |
| `password` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `ClaveSegura2026!` |
| `mfaCode` | No | `string` | longitud máxima 20 | Código MFA de un solo uso, si el usuario lo tiene activo | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/auth/login HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "email": "usuario@example.com",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "password": "ClaveSegura2026!",
  "mfaCode": "CODIGO_EJEMPLO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TokenResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TokenResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TokenResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TokenResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TokenResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TokenResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TokenResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TokenResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "accessToken": "valor-ejemplo",
  "refreshToken": "valor-ejemplo",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `accessToken` | Sí | `string` | Sin restricción adicional declarada | JWT de acceso | `valor-ejemplo` |
| `refreshToken` | Sí | `string` | Sin restricción adicional declarada | Refresh token en crudo; solo se entrega una vez | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | formato `date-time` | Expiración de la sesión | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | Credenciales inválidas | Excepción explícita en src/modules/iam/services/iam-auth.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 10, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/auth/login"
}
```

---

## 4. POST /iam/auth/logout

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-auth`
- **Nombre:** Cerrar la sesión actual del usuario
- **Operation ID:** `IamAuthController_logout`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamAuthController.logout](../../src/modules/iam/controllers/iam-auth.controller.ts)

### Descripción de negocio

Cerrar la sesión actual del usuario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Cierra la sesión del token en uso. Complementa a `logout-all`, que cierra todas. Sin esta ruta, salir de la aplicación sólo limpiaba el navegador y el refresh token seguía sirviendo hasta caducar.

### Descripción del sistema

NestJS resuelve `POST /iam/auth/logout` en `IamAuthController_logout`. El controlador delega en `IamAuthService.logout`. No recibe body. El tipo de retorno estático es `Promise<LogoutResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /iam/auth/logout HTTP/1.1
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
POST /iam/auth/logout HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LogoutResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LogoutResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LogoutResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LogoutResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LogoutResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LogoutResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LogoutResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LogoutResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LogoutResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "revoked": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `revoked` | Sí | `boolean` | Sin restricción adicional declarada | Si la sesión quedó revocada en esta llamada | `true` |

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
  "path": "/iam/auth/logout"
}
```

---

## 5. POST /iam/auth/logout-all

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-auth`
- **Nombre:** Cerrar todas las sesiones del usuario actual
- **Operation ID:** `IamAuthController_logoutAll`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamAuthController.logoutAll](../../src/modules/iam/controllers/iam-auth.controller.ts)

### Descripción de negocio

Cerrar todas las sesiones del usuario actual. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /iam/auth/logout-all` en `IamAuthController_logoutAll`. El controlador delega en `IamAuthService.logoutAll`. No recibe body. El tipo de retorno estático es `Promise<LogoutAllResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /iam/auth/logout-all HTTP/1.1
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
POST /iam/auth/logout-all HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<LogoutAllResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<LogoutAllResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<LogoutAllResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<LogoutAllResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<LogoutAllResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<LogoutAllResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<LogoutAllResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<LogoutAllResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `LogoutAllResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "revokedSessions": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `revokedSessions` | Sí | `number` | Sin restricción adicional declarada | Nº de sesiones revocadas | `1` |

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
  "path": "/iam/auth/logout-all"
}
```

---

## 6. POST /iam/auth/register-organization

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-auth`
- **Nombre:** Registrar una organización con su cuenta owner
- **Operation ID:** `IamAuthController_registerOrganization`
- **Autenticación:** Pública
- **Implementación:** [IamAuthController.registerOrganization](../../src/modules/iam/controllers/iam-auth.controller.ts)

### Descripción de negocio

Registrar una organización con su cuenta owner. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Auto-registro de una organización con la cuenta de su owner. La organización queda PENDIENTE de verificación por la plataforma; el owner puede iniciar sesión de inmediato y preparar su cuenta mientras tanto.

### Descripción del sistema

NestJS resuelve `POST /iam/auth/register-organization` en `IamAuthController_registerOrganization`. El controlador delega en `IamOrganizationSelfRegistrationService.registerOrganization`. Valida el body como `RegisterOrganizationDto` y consume `application/json`. El tipo de retorno estático es `Promise<RegisterOrganizationResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterOrganizationDto`; los campos opcionales se omiten.

```http
POST /iam/auth/register-organization HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "organization": {
    "code": "CLINICA_SAN_RAFAEL",
    "legalName": "Nombre de ejemplo",
    "tenantType": "HOSPITAL"
  },
  "owner": {
    "email": "usuario@example.com",
    "password": "ClaveSegura2026!"
  }
}
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 10, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `organization` | Sí | `RegisterOrganizationDetailsDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CLINICA_SAN_RAFAEL","legalName":"Nombre de ejemplo","tradeName":"Nombre de ejemplo","tenantType":"HOSPITAL","payer":{"carrierCode":"CODIGO_EJEMPLO","sigla":"BUPA","address":"valor-ejemplo","regulatorIdentifier":"valor-ejemplo","jurisdictionConceptId":"00000000-0000-4000-8000-000000000001"},"broker":{"id":"00000000-0000-4000-8000-000000000001","brokerCode":"CODIGO_EJEMPLO","legalName":"Nombre de ejemplo","licenseNumber":"valor-ejemplo","jurisdiction":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"verification":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"independent":true,"currentCarrierCount":1,"createdAt":"2026-07-31T12:00:00.000Z","agreements":[{"id":"00000000-0000-4000-8000-000000000001","insuranceCarrierId":"00000000-0000-4000-8000-000000000001","carrierLegalName":"Nombre de ejemplo","agreementCode":"CODIGO_EJEMPLO","commissionModel":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo","status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"current":true,"contractFileId":"00000000-0000-4000-8000-000000000001"}],"publicProfileId":"00000000-0000-4000-8000-000000000001"},"countryConceptId":"00000000-0000-4000-8000-000000000001","jurisdictionConceptId":"00000000-0000-4000-8000-000000000001","timeZone":"America/La_Paz"}` |
| `organization.code` | Sí | `string` | longitud mínima 3; longitud máxima 100; patrón runtime `/^[A-Za-z0-9._-]+$/` | Código único global de la organización | `CLINICA_SAN_RAFAEL` |
| `organization.legalName` | Sí | `string` | longitud mínima 1; longitud máxima 300 | Razón social / nombre legal | `Nombre de ejemplo` |
| `organization.tradeName` | No | `string` | longitud máxima 300 | Nombre comercial | `Nombre de ejemplo` |
| `organization.tenantType` | Sí | `string` | valores: `PROVIDER`, `PAYER`, `BROKER`, `UNIVERSITY`, `PHARMACY`, `HOSPITAL`, `MEDICAL_OFFICE`, `NURSING`, `HEALTH_OTHER`, `HEALTH_BUSINESS` | Tipo de organización. Obligatorio: cada tipo exige sus propios datos. PAYER exige el bloque `payer` y BROKER el bloque `broker`. El resto —PROVIDER, UNIVERSITY, PHARMACY y las cuatro institucionales (HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER) y HEALTH_BUSINESS— exigen país y jurisdicción, que es lo que determina bajo qué regulador operan. | `HOSPITAL` |
| `organization.payer` | No | `PayerProfileDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"carrierCode":"CODIGO_EJEMPLO","sigla":"BUPA","address":"valor-ejemplo","regulatorIdentifier":"valor-ejemplo","jurisdictionConceptId":"00000000-0000-4000-8000-000000000001"}` |
| `organization.payer.carrierCode` | No | `string` | longitud mínima 1; longitud máxima 60 | Código de la aseguradora | `CODIGO_EJEMPLO` |
| `organization.payer.sigla` | No | `string` | longitud mínima 1; longitud máxima 20 | Sigla de la aseguradora | `BUPA` |
| `organization.payer.address` | No | `string` | longitud mínima 1; longitud máxima 300 | Dirección de la aseguradora | `valor-ejemplo` |
| `organization.payer.regulatorIdentifier` | No | `string` | longitud mínima 1; longitud máxima 100 | Identificador ante el regulador de seguros | `valor-ejemplo` |
| `organization.payer.jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organization.broker` | No | `BrokerProfileDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"id":"00000000-0000-4000-8000-000000000001","brokerCode":"CODIGO_EJEMPLO","legalName":"Nombre de ejemplo","licenseNumber":"valor-ejemplo","jurisdiction":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"verification":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"independent":true,"currentCarrierCount":1,"createdAt":"2026-07-31T12:00:00.000Z","agreements":[{"id":"00000000-0000-4000-8000-000000000001","insuranceCarrierId":"00000000-0000-4000-8000-000000000001","carrierLegalName":"Nombre de ejemplo","agreementCode":"CODIGO_EJEMPLO","commissionModel":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo","status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"current":true,"contractFileId":"00000000-0000-4000-8000-000000000001"}],"publicProfileId":"00000000-0000-4000-8000-000000000001"}` |
| `organization.broker.id` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organization.broker.brokerCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `organization.broker.legalName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `organization.broker.licenseNumber` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `organization.broker.jurisdiction` | No | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `organization.broker.jurisdiction.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `organization.broker.jurisdiction.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `organization.broker.status` | No | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `organization.broker.status.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `organization.broker.status.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `organization.broker.verification` | No | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `organization.broker.verification.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `organization.broker.verification.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `organization.broker.independent` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `organization.broker.currentCarrierCount` | No | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `organization.broker.createdAt` | No | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `organization.broker.agreements` | No | `array<BrokerAgreementDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","insuranceCarrierId":"00000000-0000-4000-8000-000000000001","carrierLegalName":"Nombre de ejemplo","agreementCode":"CODIGO_EJEMPLO","commissionModel":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"effectiveFrom":"valor-ejemplo","effectiveTo":"valor-ejemplo","status":{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"},"current":true,"contractFileId":"00000000-0000-4000-8000-000000000001"}]` |
| `organization.broker.agreements[].id` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organization.broker.agreements[].insuranceCarrierId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organization.broker.agreements[].carrierLegalName` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `organization.broker.agreements[].agreementCode` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `organization.broker.agreements[].commissionModel` | No | `InsuranceConceptDto` | admite null | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `organization.broker.agreements[].commissionModel.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `organization.broker.agreements[].commissionModel.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `organization.broker.agreements[].effectiveFrom` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `organization.broker.agreements[].effectiveTo` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `organization.broker.agreements[].status` | No | `InsuranceConceptDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"code":"CARRIER_ACTIVE","display":"Aseguradora activa"}` |
| `organization.broker.agreements[].status.code` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `CARRIER_ACTIVE` |
| `organization.broker.agreements[].status.display` | No | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Aseguradora activa` |
| `organization.broker.agreements[].current` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `organization.broker.agreements[].contractFileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organization.broker.publicProfileId` | No | `string` | formato `uuid`; admite null | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organization.countryConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organization.jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `organization.timeZone` | No | `string` | longitud máxima 100 | Zona horaria IANA | `America/La_Paz` |
| `owner` | Sí | `RegisterOrganizationOwnerDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"email":"usuario@example.com","password":"ClaveSegura2026!","name":"Ana","middleName":"Lucía","lastName":"Rojas","motherLastName":"Paz","displayName":"Nombre de ejemplo","timeZone":"America/La_Paz"}` |
| `owner.email` | Sí | `string` | formato `email`; longitud máxima 320 | Correo con el que el owner iniciará sesión | `usuario@example.com` |
| `owner.password` | Sí | `string` | longitud mínima 8; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `ClaveSegura2026!` |
| `owner.name` | No | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Ana` |
| `owner.middleName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Lucía` |
| `owner.lastName` | No | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Rojas` |
| `owner.motherLastName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Paz` |
| `owner.displayName` | No | `string` | longitud mínima 1; longitud máxima 200 | Forma anterior de declarar el nombre. Preferí name/lastName. | `Nombre de ejemplo` |
| `owner.timeZone` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/auth/register-organization HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "organization": {
    "code": "CLINICA_SAN_RAFAEL",
    "legalName": "Nombre de ejemplo",
    "tradeName": "Nombre de ejemplo",
    "tenantType": "HOSPITAL",
    "payer": {
      "carrierCode": "CODIGO_EJEMPLO",
      "sigla": "BUPA",
      "address": "valor-ejemplo",
      "regulatorIdentifier": "valor-ejemplo",
      "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
    },
    "broker": {
      "id": "00000000-0000-4000-8000-000000000001",
      "brokerCode": "CODIGO_EJEMPLO",
      "legalName": "Nombre de ejemplo",
      "licenseNumber": "valor-ejemplo",
      "jurisdiction": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "status": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "verification": {
        "code": "CARRIER_ACTIVE",
        "display": "Aseguradora activa"
      },
      "independent": true,
      "currentCarrierCount": 1,
      "createdAt": "2026-07-31T12:00:00.000Z",
      "agreements": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
          "carrierLegalName": "Nombre de ejemplo",
          "agreementCode": "CODIGO_EJEMPLO",
          "commissionModel": {
            "code": "CARRIER_ACTIVE",
            "display": "Aseguradora activa"
          },
          "effectiveFrom": "valor-ejemplo",
          "effectiveTo": "valor-ejemplo",
          "status": {
            "code": "CARRIER_ACTIVE",
            "display": "Aseguradora activa"
          },
          "current": true,
          "contractFileId": "00000000-0000-4000-8000-000000000001"
        }
      ],
      "publicProfileId": "00000000-0000-4000-8000-000000000001"
    },
    "countryConceptId": "00000000-0000-4000-8000-000000000001",
    "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
    "timeZone": "America/La_Paz"
  },
  "owner": {
    "email": "usuario@example.com",
    "password": "ClaveSegura2026!",
    "name": "Ana",
    "middleName": "Lucía",
    "lastName": "Rojas",
    "motherLastName": "Paz",
    "displayName": "Nombre de ejemplo",
    "timeZone": "America/La_Paz"
  }
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RegisterOrganizationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RegisterOrganizationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RegisterOrganizationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RegisterOrganizationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RegisterOrganizationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RegisterOrganizationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RegisterOrganizationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RegisterOrganizationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CLINICA_SAN_RAFAEL",
  "ownerUserId": "00000000-0000-4000-8000-000000000001",
  "membershipId": "00000000-0000-4000-8000-000000000001",
  "status": "00000000-0000-4000-8000-000000000001",
  "emailVerificationSent": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Identificador del tenant creado. | `00000000-0000-4000-8000-000000000001` |
| `code` | Sí | `string` | Sin restricción adicional declarada | Código único de la organización, tal como quedó persistido. | `CLINICA_SAN_RAFAEL` |
| `ownerUserId` | Sí | `string` | formato `uuid` | Identificador de la cuenta owner creada. | `00000000-0000-4000-8000-000000000001` |
| `membershipId` | Sí | `string` | formato `uuid` | Identificador de la membresía OWNER que vincula cuenta y organización. | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | formato `uuid` | Concepto de estado del tenant (pendiente de verificación) | `00000000-0000-4000-8000-000000000001` |
| `emailVerificationSent` | Sí | `boolean` | Sin restricción adicional declarada | Si se pudo encolar el correo de verificación | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Canal no encontrado | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 409 | `CONFLICT` | El código de organización ya existe | Excepción explícita en src/modules/iam/services/iam-organization-self-registration.service.ts |
| 409 | `CONFLICT` | Ya existe una cuenta con ese correo | Excepción explícita en src/modules/iam/services/iam-organization-self-registration.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La notificación necesita destinatario interno o dirección de destino | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal no está activo | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla no está publicada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla es de otro canal | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | Un tenant de tipo PAYER exige el bloque `payer` | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Un tenant de tipo BROKER exige el bloque `broker` | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Un tenant de tipo ${tenantType} exige país y jurisdicción | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El bloque `payer` sólo corresponde a un tenant de tipo PAYER | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | El bloque `broker` sólo corresponde a un tenant de tipo BROKER | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 422 | `PRECONDITION_FAILED` | Los conceptos declarados no existen en el catálogo de terminología | Excepción explícita en src/modules/directory/services/tenant-type-profile.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 10, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/auth/register-organization"
}
```

---

## 7. POST /iam/auth/register-patient

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-auth`
- **Nombre:** Registrarse como paciente con documento de identidad
- **Operation ID:** `IamAuthController_registerPatient`
- **Autenticación:** Pública
- **Implementación:** [IamAuthController.registerPatient](../../src/modules/iam/controllers/iam-auth.controller.ts)

### Descripción de negocio

Registrarse como paciente con documento de identidad. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Auto-registro de un paciente con su documento de identidad. El correo es opcional y no condiciona el acceso: la cuenta queda usable de inmediato.

### Descripción del sistema

NestJS resuelve `POST /iam/auth/register-patient` en `IamAuthController_registerPatient`. El controlador delega en `IamPatientSelfRegistrationService.registerPatient`. Valida el body como `RegisterPatientDto` y consume `application/json`. El tipo de retorno estático es `Promise<RegisterPatientResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterPatientDto`; los campos opcionales se omiten.

```http
POST /iam/auth/register-patient HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "password": "ClaveSegura2026!"
}
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 10, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `nationalId` | Sí | `string` | longitud mínima 4; longitud máxima 40; patrón runtime `/^[A-Za-z0-9.-]+$/` | Documento de identidad con el que se iniciará sesión | `00000000-0000-4000-8000-000000000001` |
| `issuerAdministrativeAreaConceptId` | No | `string` | formato `uuid` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `password` | Sí | `string` | longitud mínima 8; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `ClaveSegura2026!` |
| `name` | No | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Lucía` |
| `middleName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Andrea` |
| `lastName` | No | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Mamani` |
| `motherLastName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Quispe` |
| `displayName` | No | `string` | longitud mínima 1; longitud máxima 200 | Forma anterior de declarar el nombre. Preferí name/lastName. | `Nombre de ejemplo` |
| `email` | No | `string` | formato `email`; longitud máxima 320 | Sin descripción específica en el contrato OpenAPI. | `usuario@example.com` |
| `birthDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `phone` | No | `string` | longitud máxima 40; patrón runtime `/^[+]?[0-9 ()-]{6,}$/` | Teléfono de contacto en formato E.164 o nacional | `+59170000000` |
| `occupationConceptId` | No | `string` | formato `uuid` | Ocupación del catálogo (VS_SEGIP_OCCUPATION) | `00000000-0000-4000-8000-000000000001` |
| `occupationFreeText` | No | `string` | longitud máxima 200 | Ocupación en texto libre, para cuando no está en el catálogo | `valor-ejemplo` |
| `gender` | No | `string` | valores: `MALE`, `FEMALE`, `OTHER`, `UNKNOWN` | Género administrativo (HL7 AdministrativeGender) | `MALE` |
| `sexAtBirth` | No | `string` | valores: `MALE`, `FEMALE`, `INTERSEX`, `UNKNOWN` | Sexo asignado al nacer | `MALE` |
| `administrativeGenderConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `sexAtBirthConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `timeZone` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/auth/register-patient HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "password": "ClaveSegura2026!",
  "name": "Lucía",
  "middleName": "Andrea",
  "lastName": "Mamani",
  "motherLastName": "Quispe",
  "displayName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "birthDate": "2026-07-31",
  "phone": "+59170000000",
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "gender": "MALE",
  "sexAtBirth": "MALE",
  "administrativeGenderConceptId": "00000000-0000-4000-8000-000000000001",
  "sexAtBirthConceptId": "00000000-0000-4000-8000-000000000001",
  "timeZone": "America/La_Paz"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RegisterPatientResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RegisterPatientResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RegisterPatientResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RegisterPatientResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RegisterPatientResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RegisterPatientResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RegisterPatientResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RegisterPatientResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "personId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "patientCode": "CODIGO_EJEMPLO",
  "emailVerificationSent": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `userId` | Sí | `string` | formato `uuid` | Identificador asociado a user. | `00000000-0000-4000-8000-000000000001` |
| `personId` | Sí | `string` | formato `uuid` | Identificador asociado a person. | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a patient profile. | `00000000-0000-4000-8000-000000000001` |
| `patientCode` | Sí | `string` | Sin restricción adicional declarada | Código de paciente generado para el perfil. | `CODIGO_EJEMPLO` |
| `emailVerificationSent` | Sí | `boolean` | Sin restricción adicional declarada | Si se encoló el correo de verificación. La cuenta es usable igual. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Canal no encontrado | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 409 | `CONFLICT` | Ya existe una cuenta con ese documento de identidad | Excepción explícita en src/modules/iam/services/iam-patient-self-registration.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La notificación necesita destinatario interno o dirección de destino | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal no está activo | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla no está publicada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla es de otro canal | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 10, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/auth/register-patient"
}
```

---

## 8. POST /iam/auth/register-practitioner

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-auth`
- **Nombre:** Registrarse como profesional de salud con su matrícula
- **Operation ID:** `IamAuthController_registerPractitioner`
- **Autenticación:** Pública
- **Implementación:** [IamAuthController.registerPractitioner](../../src/modules/iam/controllers/iam-auth.controller.ts)

### Descripción de negocio

Registrarse como profesional de salud con su matrícula. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Auto-registro de un profesional de salud. Crea su cuenta, su persona, su perfil profesional y su licencia en una sola operación. La matrícula queda PENDIENTE de verificación: puede iniciar sesión de inmediato, pero no está habilitado para ejercer hasta que la plataforma valide la documentación.

### Descripción del sistema

NestJS resuelve `POST /iam/auth/register-practitioner` en `IamAuthController_registerPractitioner`. El controlador delega en `IamPractitionerSelfRegistrationService.registerPractitioner`. Valida el body como `RegisterPractitionerDto` y consume `application/json`. El tipo de retorno estático es `Promise<RegisterPractitionerResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RegisterPractitionerDto`; los campos opcionales se omiten.

```http
POST /iam/auth/register-practitioner HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "ClaveSegura2026!",
  "licenseNumber": "valor-ejemplo",
  "credentialNumber": "valor-ejemplo"
}
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 10, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `email` | Sí | `string` | formato `email`; longitud máxima 320 | Correo que actúa como identidad de login | `usuario@example.com` |
| `password` | Sí | `string` | longitud mínima 8; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `ClaveSegura2026!` |
| `name` | No | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Ana` |
| `middleName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Lucía` |
| `lastName` | No | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Rojas` |
| `motherLastName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Paz` |
| `displayName` | No | `string` | longitud mínima 1; longitud máxima 200 | Forma anterior de declarar el nombre. Preferí name/lastName. | `Nombre de ejemplo` |
| `licenseNumber` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Número de licencia o matrícula profesional | `valor-ejemplo` |
| `credentialNumber` | Sí | `string` | longitud mínima 1; longitud máxima 100 | Número del título profesional que respalda la licencia | `valor-ejemplo` |
| `regulatoryAuthority` | No | `string` | longitud máxima 200 | Autoridad reguladora que emitió la licencia | `valor-ejemplo` |
| `licenseIssueDate` | No | `string` | formato `date` | Fecha de inscripción de la matrícula (ISO) | `2026-07-31` |
| `professionalTitle` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `nationalId` | No | `string` | longitud máxima 40; patrón runtime `/^[A-Za-z0-9.-]+$/` | Documento de identidad (se guarda como identificador oficial) | `00000000-0000-4000-8000-000000000001` |
| `issuerAdministrativeAreaConceptId` | No | `string` | formato `uuid` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `phone` | No | `string` | longitud máxima 40; patrón runtime `/^[+]?[0-9 ()-]{6,}$/` | Teléfono de contacto en formato E.164 o nacional | `+59170000000` |
| `birthDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `gender` | No | `string` | valores: `MALE`, `FEMALE`, `OTHER`, `UNKNOWN` | Género administrativo (HL7 AdministrativeGender) | `MALE` |
| `sexAtBirth` | No | `string` | valores: `MALE`, `FEMALE`, `INTERSEX`, `UNKNOWN` | Sexo asignado al nacer | `MALE` |
| `practitionerCategoryConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentialTypeConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `languageConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `acceptsNewPatients` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `timeZone` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/auth/register-practitioner HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "ClaveSegura2026!",
  "name": "Ana",
  "middleName": "Lucía",
  "lastName": "Rojas",
  "motherLastName": "Paz",
  "displayName": "Nombre de ejemplo",
  "licenseNumber": "valor-ejemplo",
  "credentialNumber": "valor-ejemplo",
  "regulatoryAuthority": "valor-ejemplo",
  "licenseIssueDate": "2026-07-31",
  "professionalTitle": "valor-ejemplo",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "phone": "+59170000000",
  "birthDate": "2026-07-31",
  "gender": "MALE",
  "sexAtBirth": "MALE",
  "practitionerCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "languageConceptId": "00000000-0000-4000-8000-000000000001",
  "acceptsNewPatients": false,
  "timeZone": "America/La_Paz"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<RegisterPractitionerResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RegisterPractitionerResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RegisterPractitionerResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RegisterPractitionerResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RegisterPractitionerResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RegisterPractitionerResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RegisterPractitionerResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RegisterPractitionerResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "personId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "practitionerCode": "CODIGO_EJEMPLO",
  "licenseId": "00000000-0000-4000-8000-000000000001",
  "credentialId": "00000000-0000-4000-8000-000000000001",
  "verificationStatus": "PENDING",
  "emailVerificationSent": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `userId` | Sí | `string` | formato `uuid` | Cuenta creada, con la que ya puede iniciar sesión. | `00000000-0000-4000-8000-000000000001` |
| `personId` | Sí | `string` | formato `uuid` | Persona creada para el profesional. | `00000000-0000-4000-8000-000000000001` |
| `practitionerProfileId` | Sí | `string` | formato `uuid` | Perfil profesional (comparte id con la persona). | `00000000-0000-4000-8000-000000000001` |
| `practitionerCode` | Sí | `string` | Sin restricción adicional declarada | Código interno asignado al profesional. | `CODIGO_EJEMPLO` |
| `licenseId` | Sí | `string` | formato `uuid` | Licencia registrada, pendiente de verificación por la plataforma. | `00000000-0000-4000-8000-000000000001` |
| `credentialId` | Sí | `string` | formato `uuid` | Credencial profesional creada, pendiente de verificación. Se devuelve porque `POST /profiles/credentials/{credentialId}/verify` —el acto que habilita al profesional a ejercer— la exige por id, y no había ninguna otra forma de obtenerla: el alta no la devolvía y `profiles` no expone ningún listado de credenciales. La verificación quedaba fuera de alcance salvo consultando la base de datos a mano. | `00000000-0000-4000-8000-000000000001` |
| `verificationStatus` | Sí | `string` | Sin restricción adicional declarada | Estado de verificación del perfil al terminar el alta. Siempre PENDING: registrarse no habilita a ejercer. | `PENDING` |
| `emailVerificationSent` | Sí | `boolean` | Sin restricción adicional declarada | Si se pudo encolar el correo de verificación. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Canal no encontrado | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 409 | `CONFLICT` | Ya existe una cuenta con ese correo | Excepción explícita en src/modules/iam/services/iam-practitioner-self-registration.service.ts |
| 409 | `CONFLICT` | El practitioner_code ya está en uso | Excepción explícita en src/modules/iam/services/iam-practitioner-self-registration.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Alguno de los roles indicados no existe o no es asignable | Excepción explícita en src/modules/iam/services/iam-practitioner-self-registration.service.ts |
| 422 | `PRECONDITION_FAILED` | La notificación necesita destinatario interno o dirección de destino | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal no está activo | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla no está publicada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla es de otro canal | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 10, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/auth/register-practitioner"
}
```

---

## 9. POST /iam/auth/resend-verification

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-auth`
- **Nombre:** Reenviar el enlace de verificación del correo
- **Operation ID:** `IamAuthController_resendVerification`
- **Autenticación:** Pública
- **Implementación:** [IamAuthController.resendVerification](../../src/modules/iam/controllers/iam-auth.controller.ts)

### Descripción de negocio

Reenviar el enlace de verificación del correo. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Reemite el enlace de verificación de correo. Responde **202 y el mismo mensaje siempre**, exista o no la cuenta, esté o no verificada: las tres respuestas distinguibles convertirían un formulario público en un oráculo de qué direcciones tienen cuenta aquí. Mismo techo que `forgot-password`: cada solicitud válida dispara un correo, y sin límite el formulario es un amplificador de spam contra un tercero.

### Descripción del sistema

NestJS resuelve `POST /iam/auth/resend-verification` en `IamAuthController_resendVerification`. El controlador delega en `IamEmailVerificationService.resend`. Valida el body como `ResendVerificationDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResendVerificationResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ResendVerificationDto`; los campos opcionales se omiten.

```http
POST /iam/auth/resend-verification HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "identifier": "valor-ejemplo"
}
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 5, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `identifier` | Sí | `string` | longitud mínima 3; longitud máxima 320 | Correo o documento de identidad con el que la persona inicia sesión | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/auth/resend-verification HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "identifier": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 202 | Solicitud aceptada para procesamiento asíncrono. | `Promise<ResendVerificationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResendVerificationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResendVerificationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResendVerificationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResendVerificationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResendVerificationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResendVerificationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResendVerificationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "message": "Si el identificador corresponde a una cuenta con correo pendiente de verificar, enviamos un enlace nuevo."
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `message` | Sí | `string` | Sin restricción adicional declarada | Mensaje neutro, idéntico en todos los casos. | `Si el identificador corresponde a una cuenta con correo pendiente de verificar, enviamos un enlace nuevo.` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Canal no encontrado | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La notificación necesita destinatario interno o dirección de destino | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal no está activo | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla no está publicada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla es de otro canal | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 5, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/auth/resend-verification"
}
```

---

## 10. POST /iam/auth/reset-password

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-auth`
- **Nombre:** Fijar una contraseña nueva con el token recibido por correo
- **Operation ID:** `IamAuthController_resetPassword`
- **Autenticación:** Pública
- **Implementación:** [IamAuthController.resetPassword](../../src/modules/iam/controllers/iam-auth.controller.ts)

### Descripción de negocio

Fijar una contraseña nueva con el token recibido por correo. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-01-13: consume el token recibido por correo y fija la contraseña nueva. Cierra todas las sesiones abiertas del usuario: quien recupera su cuenta lo hace porque perdió el control de la clave anterior.

### Descripción del sistema

NestJS resuelve `POST /iam/auth/reset-password` en `IamAuthController_resetPassword`. El controlador delega en `IamPasswordResetService.resetPassword`. Valida el body como `ResetPasswordDto` y consume `application/json`. El tipo de retorno estático es `Promise<ResetPasswordResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ResetPasswordDto`; los campos opcionales se omiten.

```http
POST /iam/auth/reset-password HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "token": "valor-ejemplo",
  "newPassword": "ClaveSegura2026!"
}
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 10, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `token` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Token recibido por correo | `valor-ejemplo` |
| `newPassword` | Sí | `string` | longitud mínima 8; longitud máxima 200 | Contraseña nueva | `ClaveSegura2026!` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/auth/reset-password HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "token": "valor-ejemplo",
  "newPassword": "ClaveSegura2026!"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ResetPasswordResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ResetPasswordResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ResetPasswordResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ResetPasswordResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ResetPasswordResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ResetPasswordResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ResetPasswordResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ResetPasswordResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "revokedSessions": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `userId` | Sí | `string` | formato `uuid` | Usuario cuya clave cambió | `00000000-0000-4000-8000-000000000001` |
| `revokedSessions` | Sí | `number` | Sin restricción adicional declarada | Sesiones revocadas: cambiar la clave cierra todas las sesiones abiertas | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | Token de restablecimiento inválido | Excepción explícita en src/modules/iam/services/iam-password-reset.service.ts |
| 401 | `UNAUTHENTICATED` | El token de restablecimiento ya fue utilizado | Excepción explícita en src/modules/iam/services/iam-password-reset.service.ts |
| 401 | `UNAUTHENTICATED` | El token de restablecimiento expiró | Excepción explícita en src/modules/iam/services/iam-password-reset.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 10, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/auth/reset-password"
}
```

---

## 11. POST /iam/auth/sessions/purge

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-auth`
- **Nombre:** Expirar sesiones y tokens vencidos
- **Operation ID:** `IamAuthController_purge`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamAuthController.purge](../../src/modules/iam/controllers/iam-auth.controller.ts)

### Descripción de negocio

Expirar sesiones y tokens vencidos. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /iam/auth/sessions/purge` en `IamAuthController_purge`. El controlador delega en `IamAuthService.purgeSessions`. No recibe body. El tipo de retorno estático es `Promise<PurgeResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /iam/auth/sessions/purge HTTP/1.1
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
POST /iam/auth/sessions/purge HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PurgeResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PurgeResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PurgeResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PurgeResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PurgeResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PurgeResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PurgeResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PurgeResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PurgeResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "expiredSessions": 1,
  "expiredTokens": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expiredSessions` | Sí | `number` | Sin restricción adicional declarada | Nº de sesiones expiradas | `1` |
| `expiredTokens` | Sí | `number` | Sin restricción adicional declarada | Nº de refresh tokens expirados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/auth/sessions/purge"
}
```

---

## 12. POST /iam/auth/token/refresh

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-auth`
- **Nombre:** Rotar el refresh token
- **Operation ID:** `IamAuthController_refresh`
- **Autenticación:** Pública
- **Implementación:** [IamAuthController.refresh](../../src/modules/iam/controllers/iam-auth.controller.ts)

### Descripción de negocio

Rotar el refresh token. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /iam/auth/token/refresh` en `IamAuthController_refresh`. El controlador delega en `IamAuthService.refresh`. Valida el body como `RefreshTokenDto` y consume `application/json`. El tipo de retorno estático es `Promise<TokenResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RefreshTokenDto`; los campos opcionales se omiten.

```http
POST /iam/auth/token/refresh HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{}
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 20, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `refreshToken` | No | `string` | longitud mínima 1 | Refresh token en crudo emitido previamente. Obligatorio salvo que la API entregue el token como cookie httpOnly (AUTH_REFRESH_COOKIE_ENABLED), en cuyo caso se ignora y se lee de la cookie | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/auth/token/refresh HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "refreshToken": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TokenResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<TokenResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<TokenResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<TokenResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<TokenResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<TokenResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<TokenResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TokenResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "accessToken": "valor-ejemplo",
  "refreshToken": "valor-ejemplo",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `accessToken` | Sí | `string` | Sin restricción adicional declarada | JWT de acceso | `valor-ejemplo` |
| `refreshToken` | Sí | `string` | Sin restricción adicional declarada | Refresh token en crudo; solo se entrega una vez | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | formato `date-time` | Expiración de la sesión | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | Refresh token inválido | Excepción explícita en src/modules/iam/services/iam-auth.service.ts |
| 401 | `UNAUTHENTICATED` | Reuso de refresh token detectado | Excepción explícita en src/modules/iam/services/iam-auth.service.ts |
| 401 | `UNAUTHENTICATED` | Refresh token expirado | Excepción explícita en src/modules/iam/services/iam-auth.service.ts |
| 401 | `UNAUTHENTICATED` | Sesión no activa | Excepción explícita en src/modules/iam/services/iam-auth.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 20, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/auth/token/refresh"
}
```

---

## 13. POST /iam/auth/verify-email

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-auth`
- **Nombre:** Verificar el correo con el token recibido
- **Operation ID:** `IamAuthController_verifyEmail`
- **Autenticación:** Pública
- **Implementación:** [IamAuthController.verifyEmail](../../src/modules/iam/controllers/iam-auth.controller.ts)

### Descripción de negocio

Verificar el correo con el token recibido. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /iam/auth/verify-email` en `IamAuthController_verifyEmail`. El controlador delega en `IamPatientSelfRegistrationService.verifyEmail`. Valida el body como `VerifyEmailDto` y consume `application/json`. El tipo de retorno estático es `Promise<VerifyEmailResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `VerifyEmailDto`; los campos opcionales se omiten.

```http
POST /iam/auth/verify-email HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "token": "valor-ejemplo"
}
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit particular: `Throttle({ default: { limit: 10, ttl: 60_000 } })`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `token` | Sí | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/auth/verify-email HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "token": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<VerifyEmailResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<VerifyEmailResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<VerifyEmailResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<VerifyEmailResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<VerifyEmailResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<VerifyEmailResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<VerifyEmailResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VerifyEmailResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "emailVerified": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `userId` | Sí | `string` | formato `uuid` | Identificador asociado a user. | `00000000-0000-4000-8000-000000000001` |
| `emailVerified` | Sí | `boolean` | Sin restricción adicional declarada | Valor de email verified mantenido por la instancia. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | Token de verificación inválido | Excepción explícita en src/modules/iam/services/iam-patient-self-registration.service.ts |
| 401 | `UNAUTHENTICATED` | El token de verificación ya fue utilizado | Excepción explícita en src/modules/iam/services/iam-patient-self-registration.service.ts |
| 401 | `UNAUTHENTICATED` | El token de verificación expiró | Excepción explícita en src/modules/iam/services/iam-patient-self-registration.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle({ default: { limit: 10, ttl: 60_000 } }). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/auth/verify-email"
}
```

---

## 14. GET /iam/users

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Listado paginado de usuarios
- **Operation ID:** `IamUsersController_searchUsers`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.searchUsers](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Listado paginado de usuarios. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-01-01 (cara de lectura): listado paginado de usuarios. Se declara antes que las rutas con parámetro para que ninguna de ellas capture un segmento fijo.

### Descripción del sistema

NestJS resuelve `GET /iam/users` en `IamUsersController_searchUsers`. El controlador delega en `IamUsersReadService.searchUsers`. No recibe body. El tipo de retorno estático es `Promise<SearchUsersResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | No | `string` | Sin restricción adicional declarada | Texto a buscar en el nombre visible o en el correo de acceso | `valor-ejemplo` |
| `status` | query | No | `string` | Sin restricción adicional declarada | Concepto de estado al que acotar | `ok` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor opaco devuelto por la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | Sin restricción adicional declarada | Tope de resultados (por defecto 50) | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /iam/users HTTP/1.1
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
GET /iam/users?q=valor-ejemplo&status=ok&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SearchUsersResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SearchUsersResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SearchUsersResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SearchUsersResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SearchUsersResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SearchUsersResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SearchUsersResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "displayName": "Nombre de ejemplo",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "mfaStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "emailVerified": true,
      "phoneVerified": true,
      "lastLoginAt": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z"
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
| `items` | Sí | `array<UserListItemDto>` | Sin restricción adicional declarada | Usuarios de esta página, ordenados por nombre visible. | `[{"id":"00000000-0000-4000-8000-000000000001","displayName":"Nombre de ejemplo","statusConceptId":"00000000-0000-4000-8000-000000000001","mfaStatusConceptId":"00000000-0000-4000-8000-000000000001","emailVerified":true,"phoneVerified":true,"lastLoginAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del usuario. | `00000000-0000-4000-8000-000000000001` |
| `items[].displayName` | Sí | `string` | Sin restricción adicional declarada | Nombre visible. | `Nombre de ejemplo` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Estado de la cuenta. | `00000000-0000-4000-8000-000000000001` |
| `items[].mfaStatusConceptId` | No | `string` | formato `uuid` | Estado del segundo factor. | `00000000-0000-4000-8000-000000000001` |
| `items[].emailVerified` | Sí | `boolean` | Sin restricción adicional declarada | Si el correo consta verificado. | `true` |
| `items[].phoneVerified` | Sí | `boolean` | Sin restricción adicional declarada | Si el teléfono consta verificado. | `true` |
| `items[].lastLoginAt` | No | `string` | formato `date-time`; admite null | Último ingreso registrado. | `2026-07-31T12:00:00.000Z` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Alta de la cuenta. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cantidad devuelta en esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope aplicado a la consulta. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor opaco de continuación, o `null` si ésta es la última página. | `valor-ejemplo` |

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
  "path": "/iam/users"
}
```

---

## 15. POST /iam/users

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Crear un usuario con credencial de contraseña y rol inicial
- **Operation ID:** `IamUsersController_createUser`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.createUser](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Crear un usuario con credencial de contraseña y rol inicial. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /iam/users` en `IamUsersController_createUser`. El controlador delega en `IamUsersService.createUser`. Valida el body como `CreateUserDto` y consume `application/json`. El tipo de retorno estático es `Promise<UserResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateUserDto`; los campos opcionales se omiten.

```http
POST /iam/users HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "displayName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "password": "ClaveSegura2026!"
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
| `displayName` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre visible del usuario | `Nombre de ejemplo` |
| `email` | Sí | `string` | formato `email`; longitud máxima 320 | Email que actúa como identidad de login | `usuario@example.com` |
| `password` | Sí | `string` | longitud mínima 8; longitud máxima 200 | Contraseña en claro (se persiste solo su hash argon2id) | `ClaveSegura2026!` |
| `phone` | No | `string` | longitud máxima 40; patrón runtime `/^[+]?[0-9 ()-]{6,}$/` | Teléfono de contacto en formato E.164 o nacional | `+59170000000` |
| `timeZone` | No | `string` | longitud máxima 100 | Zona horaria IANA del usuario | `America/La_Paz` |
| `initialRole` | No | `string` | valores: `USER`, `SECURITY_ADMIN` | Rol inicial | `USER` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/users HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "displayName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "password": "ClaveSegura2026!",
  "phone": "+59170000000",
  "timeZone": "America/La_Paz",
  "initialRole": "USER"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<UserResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<UserResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<UserResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<UserResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<UserResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<UserResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<UserResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<UserResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<UserResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `UserResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "displayName": "Nombre de ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `displayName` | Sí | `string` | Sin restricción adicional declarada | Valor de display name mantenido por la instancia. | `Nombre de ejemplo` |
| `status` | Sí | `string` | formato `uuid` | Concept id del estado del usuario | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | El email ya tiene una credencial de contraseña activa | Excepción explícita en src/modules/iam/services/iam-users.service.ts |
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
  "path": "/iam/users"
}
```

---

## 16. GET /iam/users/{id}

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Ficha de un usuario
- **Operation ID:** `IamUsersController_getUser`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.getUser](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Ficha de un usuario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ficha de un usuario.

### Descripción del sistema

NestJS resuelve `GET /iam/users/{id}` en `IamUsersController_getUser`. El controlador delega en `IamUsersReadService.getUserById`. No recibe body. El tipo de retorno estático es `Promise<UserDetailResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /iam/users/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /iam/users/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<UserDetailResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<UserDetailResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<UserDetailResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<UserDetailResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<UserDetailResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<UserDetailResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<UserDetailResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `UserDetailResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "timeZone": "America/La_Paz",
  "preferredLanguageConceptId": "00000000-0000-4000-8000-000000000001",
  "residenceCountryConceptId": "00000000-0000-4000-8000-000000000001",
  "dataResidencyRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "legalBasisConceptId": "00000000-0000-4000-8000-000000000001",
  "privacyAcceptedAt": "2026-07-31T12:00:00.000Z",
  "privacyPolicyVersion": "valor-ejemplo",
  "mustChangePassword": true,
  "anonymizedAt": "2026-07-31T12:00:00.000Z",
  "updatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `timeZone` | No | `string` | Sin restricción adicional declarada | Zona horaria declarada. | `America/La_Paz` |
| `preferredLanguageConceptId` | No | `string` | formato `uuid` | Idioma preferido. | `00000000-0000-4000-8000-000000000001` |
| `residenceCountryConceptId` | No | `string` | formato `uuid` | País de residencia declarado. | `00000000-0000-4000-8000-000000000001` |
| `dataResidencyRegionConceptId` | No | `string` | formato `uuid` | Región de residencia del dato. | `00000000-0000-4000-8000-000000000001` |
| `legalBasisConceptId` | No | `string` | formato `uuid` | Base legal del tratamiento. | `00000000-0000-4000-8000-000000000001` |
| `privacyAcceptedAt` | No | `string` | formato `date-time`; admite null | Cuándo se aceptó la política de privacidad. | `2026-07-31T12:00:00.000Z` |
| `privacyPolicyVersion` | No | `string` | Sin restricción adicional declarada | Versión de la política aceptada. | `valor-ejemplo` |
| `mustChangePassword` | Sí | `boolean` | Sin restricción adicional declarada | Si la cuenta exige cambiar la credencial en el próximo ingreso. | `true` |
| `anonymizedAt` | No | `string` | formato `date-time`; admite null | Cuándo se anonimizó la cuenta, si se anonimizó. | `2026-07-31T12:00:00.000Z` |
| `updatedAt` | Sí | `string` | formato `date-time` | Última modificación del registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/iam/services/iam-users-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/users/{id}"
}
```

---

## 17. POST /iam/users/{id}/anonymize

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Anonimizar (DSAR) la cuenta
- **Operation ID:** `IamUsersController_anonymize`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.anonymize](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Anonimizar (DSAR) la cuenta. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /iam/users/{id}/anonymize` en `IamUsersController_anonymize`. El controlador delega en `IamUsersService.anonymize`. No recibe body. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /iam/users/00000000-0000-4000-8000-000000000001/anonymize HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /iam/users/00000000-0000-4000-8000-000000000001/anonymize HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

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
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/iam/services/iam-users.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/users/{id}/anonymize"
}
```

---

## 18. GET /iam/users/{id}/credentials

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Credenciales del usuario
- **Operation ID:** `IamUsersController_listCredentials`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.listCredentials](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Nunca devuelve el hash de la contraseña ni la clave pública.

Contexto declarado en el controlador: UC-01-02 / UC-01-11 (cara de lectura).

### Descripción del sistema

NestJS resuelve `GET /iam/users/{id}/credentials` en `IamUsersController_listCredentials`. El controlador delega en `IamUsersReadService.listCredentials`. No recibe body. El tipo de retorno estático es `Promise<ListCredentialsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /iam/users/00000000-0000-4000-8000-000000000001/credentials HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /iam/users/00000000-0000-4000-8000-000000000001/credentials HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListCredentialsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListCredentialsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListCredentialsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListCredentialsResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ListCredentialsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListCredentialsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListCredentialsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListCredentialsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "methodConceptId": "00000000-0000-4000-8000-000000000001",
      "externalSubject": "valor-ejemplo",
      "identityProvider": "valor-ejemplo",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "lastUsedAt": "2026-07-31T12:00:00.000Z",
      "expiresAt": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<CredentialListItemDto>` | Sin restricción adicional declarada | Credenciales, de la más reciente a la más antigua. | `[{"id":"00000000-0000-4000-8000-000000000001","methodConceptId":"00000000-0000-4000-8000-000000000001","externalSubject":"valor-ejemplo","identityProvider":"valor-ejemplo","stateConceptId":"00000000-0000-4000-8000-000000000001","lastUsedAt":"2026-07-31T12:00:00.000Z","expiresAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la credencial. | `00000000-0000-4000-8000-000000000001` |
| `items[].methodConceptId` | Sí | `string` | formato `uuid` | Método de autenticación. | `00000000-0000-4000-8000-000000000001` |
| `items[].externalSubject` | No | `string` | Sin restricción adicional declarada | Sujeto con el que se autentica (correo o documento). | `valor-ejemplo` |
| `items[].identityProvider` | No | `string` | Sin restricción adicional declarada | Proveedor de identidad, en las credenciales federadas. | `valor-ejemplo` |
| `items[].stateConceptId` | Sí | `string` | formato `uuid` | Estado de la credencial. | `00000000-0000-4000-8000-000000000001` |
| `items[].lastUsedAt` | No | `string` | formato `date-time`; admite null | Último uso registrado. | `2026-07-31T12:00:00.000Z` |
| `items[].expiresAt` | No | `string` | formato `date-time`; admite null | Caducidad, si la tiene. | `2026-07-31T12:00:00.000Z` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Alta de la credencial. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas credenciales trae la respuesta. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/iam/services/iam-users-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/users/{id}/credentials"
}
```

---

## 19. POST /iam/users/{id}/credentials/{cid}/revoke

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Revocar una credencial del usuario
- **Operation ID:** `IamUsersController_revokeCredential`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.revokeCredential](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Revocar una credencial del usuario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /iam/users/{id}/credentials/{cid}/revoke` en `IamUsersController_revokeCredential`. El controlador delega en `IamCredentialsService.revokeCredential`. No recibe body. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cid` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /iam/users/00000000-0000-4000-8000-000000000001/credentials/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`, `cid`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /iam/users/00000000-0000-4000-8000-000000000001/credentials/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

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
| 404 | `NOT_FOUND` | Credencial no encontrada para el usuario | Excepción explícita en src/modules/iam/services/iam-credentials.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/users/{id}/credentials/{cid}/revoke"
}
```

---

## 20. POST /iam/users/{id}/credentials/federated

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Enlazar una credencial de identidad federada
- **Operation ID:** `IamUsersController_linkFederated`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.linkFederated](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Enlazar una credencial de identidad federada. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /iam/users/{id}/credentials/federated` en `IamUsersController_linkFederated`. El controlador delega en `IamCredentialsService.linkFederated`. Valida el body como `LinkFederatedCredentialDto` y consume `application/json`. El tipo de retorno estático es `Promise<CredentialResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LinkFederatedCredentialDto`; los campos opcionales se omiten.

```http
POST /iam/users/00000000-0000-4000-8000-000000000001/credentials/federated HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "identityProvider": "valor-ejemplo",
  "externalSubject": "valor-ejemplo"
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
| `identityProvider` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Proveedor de identidad externo (p. ej. google, azure-ad) | `valor-ejemplo` |
| `externalSubject` | Sí | `string` | longitud mínima 1; longitud máxima 320 | Identificador del sujeto en el proveedor externo | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/users/00000000-0000-4000-8000-000000000001/credentials/federated HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "identityProvider": "valor-ejemplo",
  "externalSubject": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CredentialResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CredentialResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CredentialResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "state": "00000000-0000-4000-8000-000000000001",
  "verifiedAt": "2026-07-31T12:00:00.000Z",
  "practitionerVerified": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | formato `uuid` | Concept id del estado de la credencial | `00000000-0000-4000-8000-000000000001` |
| `verifiedAt` | No | `string` | formato `date-time` | Valor de verified at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `practitionerVerified` | Sí | `boolean` | Sin restricción adicional declarada | true si al verificar quedó habilitado todo el perfil profesional | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/iam/services/iam-credentials.service.ts |
| 409 | `CONFLICT` | La credencial federada ya existe | Excepción explícita en src/modules/iam/services/iam-credentials.service.ts |
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
  "path": "/iam/users/{id}/credentials/federated"
}
```

---

## 21. GET /iam/users/{id}/devices

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Dispositivos del usuario
- **Operation ID:** `IamUsersController_listDevices`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.listDevices](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Nunca devuelve el token de notificaciones.

Contexto declarado en el controlador: UC-01-05 (cara de lectura).

### Descripción del sistema

NestJS resuelve `GET /iam/users/{id}/devices` en `IamUsersController_listDevices`. El controlador delega en `IamUsersReadService.listDevices`. No recibe body. El tipo de retorno estático es `Promise<ListDevicesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /iam/users/00000000-0000-4000-8000-000000000001/devices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /iam/users/00000000-0000-4000-8000-000000000001/devices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListDevicesResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListDevicesResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListDevicesResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListDevicesResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ListDevicesResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListDevicesResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListDevicesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListDevicesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "deviceFingerprint": "valor-ejemplo",
      "platformConceptId": "00000000-0000-4000-8000-000000000001",
      "hasPushToken": true,
      "lastSeenAt": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<DeviceListItemDto>` | Sin restricción adicional declarada | Dispositivos, del más reciente al más antiguo. | `[{"id":"00000000-0000-4000-8000-000000000001","deviceFingerprint":"valor-ejemplo","platformConceptId":"00000000-0000-4000-8000-000000000001","hasPushToken":true,"lastSeenAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del dispositivo. | `00000000-0000-4000-8000-000000000001` |
| `items[].deviceFingerprint` | No | `string` | Sin restricción adicional declarada | Huella con la que el dispositivo se identifica. | `valor-ejemplo` |
| `items[].platformConceptId` | No | `string` | formato `uuid` | Plataforma del dispositivo. | `00000000-0000-4000-8000-000000000001` |
| `items[].hasPushToken` | Sí | `boolean` | Sin restricción adicional declarada | Si tiene token de notificaciones registrado. Se publica la existencia, no el token. | `true` |
| `items[].lastSeenAt` | No | `string` | formato `date-time`; admite null | Última vez que se vio el dispositivo. | `2026-07-31T12:00:00.000Z` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Alta del dispositivo. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántos dispositivos trae la respuesta. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/iam/services/iam-users-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/users/{id}/devices"
}
```

---

## 22. POST /iam/users/{id}/devices

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Registrar un dispositivo del usuario
- **Operation ID:** `IamUsersController_registerDevice`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.registerDevice](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Registrar un dispositivo del usuario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /iam/users/{id}/devices` en `IamUsersController_registerDevice`. El controlador delega en `IamDevicesService.register`. Valida el body como `CreateDeviceDto` y consume `application/json`. El tipo de retorno estático es `Promise<DeviceResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDeviceDto`; los campos opcionales se omiten.

```http
POST /iam/users/00000000-0000-4000-8000-000000000001/devices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "deviceFingerprint": "valor-ejemplo"
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
| `deviceFingerprint` | Sí | `string` | longitud mínima 1; longitud máxima 512 | Huella única del dispositivo | `valor-ejemplo` |
| `platform` | No | `string` | valores: `IOS`, `ANDROID`, `WEB` | Plataforma | `IOS` |
| `name` | No | `string` | longitud máxima 200 | Nombre legible del dispositivo | `Nombre de ejemplo` |
| `trust` | No | `boolean` | Sin restricción adicional declarada | Marcar el dispositivo como de confianza | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/users/00000000-0000-4000-8000-000000000001/devices HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "deviceFingerprint": "valor-ejemplo",
  "platform": "IOS",
  "name": "Nombre de ejemplo",
  "trust": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DeviceResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeviceResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeviceResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeviceResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DeviceResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeviceResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DeviceResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeviceResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeviceResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeviceResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeviceResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "trusted": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `userId` | Sí | `string` | formato `uuid` | Identificador asociado a user. | `00000000-0000-4000-8000-000000000001` |
| `trusted` | Sí | `boolean` | Sin restricción adicional declarada | Valor de trusted mantenido por la instancia. | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/iam/services/iam-devices.service.ts |
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
  "path": "/iam/users/{id}/devices"
}
```

---

## 23. GET /iam/users/{id}/global-roles

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Roles globales del usuario
- **Operation ID:** `IamUsersController_listGlobalRoles`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.listGlobalRoles](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Roles globales del usuario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-01-10 (cara de lectura).

### Descripción del sistema

NestJS resuelve `GET /iam/users/{id}/global-roles` en `IamUsersController_listGlobalRoles`. El controlador delega en `IamUsersReadService.listGlobalRoles`. No recibe body. El tipo de retorno estático es `Promise<ListGlobalRolesResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /iam/users/00000000-0000-4000-8000-000000000001/global-roles HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /iam/users/00000000-0000-4000-8000-000000000001/global-roles HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListGlobalRolesResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListGlobalRolesResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListGlobalRolesResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListGlobalRolesResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ListGlobalRolesResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListGlobalRolesResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListGlobalRolesResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListGlobalRolesResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "roleConceptId": "00000000-0000-4000-8000-000000000001",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<GlobalRoleListItemDto>` | Sin restricción adicional declarada | Asignaciones, de la más reciente a la más antigua. | `[{"id":"00000000-0000-4000-8000-000000000001","roleConceptId":"00000000-0000-4000-8000-000000000001","stateConceptId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la asignación. | `00000000-0000-4000-8000-000000000001` |
| `items[].roleConceptId` | Sí | `string` | formato `uuid` | Rol global asignado. | `00000000-0000-4000-8000-000000000001` |
| `items[].stateConceptId` | Sí | `string` | formato `uuid` | Estado de la asignación. | `00000000-0000-4000-8000-000000000001` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Cuándo se asignó. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas asignaciones trae la respuesta. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/iam/services/iam-users-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/users/{id}/global-roles"
}
```

---

## 24. POST /iam/users/{id}/global-roles

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Conceder o revocar un rol global
- **Operation ID:** `IamUsersController_changeGlobalRole`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.changeGlobalRole](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Conceder o revocar un rol global. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /iam/users/{id}/global-roles` en `IamUsersController_changeGlobalRole`. El controlador delega en `IamUsersService.changeGlobalRole`. Valida el body como `GlobalRoleDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `GlobalRoleDto`; los campos opcionales se omiten.

```http
POST /iam/users/00000000-0000-4000-8000-000000000001/global-roles HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "role": "USER",
  "action": "GRANT"
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
| `role` | Sí | `string` | valores: `USER`, `SECURITY_ADMIN`, `SUPERADMIN`, `PATIENT`, `PRACTITIONER`, `CLINICIAN` | Sin descripción específica en el contrato OpenAPI. | `USER` |
| `action` | Sí | `string` | valores: `GRANT`, `REVOKE` | Sin descripción específica en el contrato OpenAPI. | `GRANT` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/users/00000000-0000-4000-8000-000000000001/global-roles HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "role": "USER",
  "action": "GRANT"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

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
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/iam/services/iam-users.service.ts |
| 404 | `NOT_FOUND` | El usuario no tiene ese rol activo | Excepción explícita en src/modules/iam/services/iam-users.service.ts |
| 409 | `CONFLICT` | El rol ya está concedido | Excepción explícita en src/modules/iam/services/iam-users.service.ts |
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
  "path": "/iam/users/{id}/global-roles"
}
```

---

## 25. POST /iam/users/{id}/lock

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Bloquear la cuenta y revocar sus sesiones
- **Operation ID:** `IamUsersController_lock`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.lock](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Bloquear la cuenta y revocar sus sesiones. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /iam/users/{id}/lock` en `IamUsersController_lock`. El controlador delega en `IamUsersService.lock`. Valida el body como `LockUserDto` y consume `application/json`. El tipo de retorno estático es `Promise<StatusResultDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `LockUserDto`; los campos opcionales se omiten.

```http
POST /iam/users/00000000-0000-4000-8000-000000000001/lock HTTP/1.1
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
| `reason` | No | `string` | longitud máxima 500 | Motivo administrativo del bloqueo | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/users/00000000-0000-4000-8000-000000000001/lock HTTP/1.1
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
| 200 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 404 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<StatusResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `StatusResultDto`. Ejemplo completo derivado de ese DTO:

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
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/iam/services/iam-users.service.ts |
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
  "path": "/iam/users/{id}/lock"
}
```

---

## 26. GET /iam/users/{id}/mfa-factors

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Factores de MFA del usuario
- **Operation ID:** `IamUsersController_listMfaFactors`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.listMfaFactors](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Nunca devuelve el secreto del factor.

Contexto declarado en el controlador: UC-01-03 (cara de lectura).

### Descripción del sistema

NestJS resuelve `GET /iam/users/{id}/mfa-factors` en `IamUsersController_listMfaFactors`. El controlador delega en `IamUsersReadService.listMfaFactors`. No recibe body. El tipo de retorno estático es `Promise<ListMfaFactorsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /iam/users/00000000-0000-4000-8000-000000000001/mfa-factors HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /iam/users/00000000-0000-4000-8000-000000000001/mfa-factors HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListMfaFactorsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListMfaFactorsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListMfaFactorsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListMfaFactorsResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ListMfaFactorsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListMfaFactorsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListMfaFactorsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListMfaFactorsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "factorTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "verifiedAt": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<MfaFactorListItemDto>` | Sin restricción adicional declarada | Factores, del más reciente al más antiguo. | `[{"id":"00000000-0000-4000-8000-000000000001","factorTypeConceptId":"00000000-0000-4000-8000-000000000001","stateConceptId":"00000000-0000-4000-8000-000000000001","verifiedAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del factor. | `00000000-0000-4000-8000-000000000001` |
| `items[].factorTypeConceptId` | Sí | `string` | formato `uuid` | Mecanismo del segundo factor. | `00000000-0000-4000-8000-000000000001` |
| `items[].stateConceptId` | Sí | `string` | formato `uuid` | Estado del factor. | `00000000-0000-4000-8000-000000000001` |
| `items[].verifiedAt` | No | `string` | formato `date-time`; admite null | Cuándo se verificó, si se verificó. | `2026-07-31T12:00:00.000Z` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Alta del factor. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántos factores trae la respuesta. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/iam/services/iam-users-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/users/{id}/mfa-factors"
}
```

---

## 27. POST /iam/users/{id}/mfa-factors

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Enrolar o verificar un factor MFA
- **Operation ID:** `IamUsersController_mfaFactor`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.mfaFactor](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Enrolar o verificar un factor MFA. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /iam/users/{id}/mfa-factors` en `IamUsersController_mfaFactor`. El controlador delega en `IamMfaService.enrollOrVerify`. Valida el body como `MfaFactorDto` y consume `application/json`. El tipo de retorno estático es `Promise<MfaFactorResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `MfaFactorDto`; los campos opcionales se omiten.

```http
POST /iam/users/00000000-0000-4000-8000-000000000001/mfa-factors HTTP/1.1
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
| `factorType` | No | `string` | valores: `TOTP`, `WEBAUTHN` | Tipo de factor a enrolar | `TOTP` |
| `label` | No | `string` | longitud máxima 200 | Etiqueta legible del factor | `valor-ejemplo` |
| `verify` | No | `boolean` | Sin restricción adicional declarada | Si es true, verifica el factor indicado | `true` |
| `factorId` | No | `string` | formato `uuid` | Factor a verificar | `00000000-0000-4000-8000-000000000001` |
| `code` | No | `string` | longitud mínima 6; longitud máxima 8 | Código TOTP de la app autenticadora. Obligatorio cuando verify=true. | `123456` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/users/00000000-0000-4000-8000-000000000001/mfa-factors HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "factorType": "TOTP",
  "label": "valor-ejemplo",
  "verify": true,
  "factorId": "00000000-0000-4000-8000-000000000001",
  "code": "123456"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MfaFactorResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MfaFactorResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MfaFactorResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MfaFactorResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MfaFactorResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MfaFactorResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MfaFactorResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MfaFactorResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MfaFactorResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MfaFactorResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MfaFactorResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "state": "00000000-0000-4000-8000-000000000001",
  "verifiedAt": "2026-07-31T12:00:00.000Z",
  "secret": "valor-ejemplo",
  "otpauthUri": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `userId` | Sí | `string` | formato `uuid` | Identificador asociado a user. | `00000000-0000-4000-8000-000000000001` |
| `state` | Sí | `string` | formato `uuid` | Concept id del estado del factor | `00000000-0000-4000-8000-000000000001` |
| `verifiedAt` | No | `string` | formato `date-time` | Valor de verified at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |
| `secret` | No | `string` | Sin restricción adicional declarada | Secreto TOTP en base32. Solo se devuelve al enrolar un factor TOTP; | `valor-ejemplo` |
| `otpauthUri` | No | `string` | Sin restricción adicional declarada | URI otpauth:// para generar el QR. Solo se devuelve al enrolar un factor TOTP. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/iam/services/iam-mfa.service.ts |
| 404 | `NOT_FOUND` | Factor MFA no encontrado | Excepción explícita en src/modules/iam/services/iam-mfa.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | factorId es obligatorio para verificar | Excepción explícita en src/modules/iam/services/iam-mfa.service.ts |
| 422 | `PRECONDITION_FAILED` | code es obligatorio para verificar | Excepción explícita en src/modules/iam/services/iam-mfa.service.ts |
| 422 | `PRECONDITION_FAILED` | El factor no tiene un secreto TOTP asociado | Excepción explícita en src/modules/iam/services/iam-mfa.service.ts |
| 422 | `PRECONDITION_FAILED` | Código MFA inválido | Excepción explícita en src/modules/iam/services/iam-mfa.service.ts |
| 422 | `PRECONDITION_FAILED` | factorType es obligatorio para enrolar | Excepción explícita en src/modules/iam/services/iam-mfa.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/users/{id}/mfa-factors"
}
```

---

## 28. GET /iam/users/{id}/sessions

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Sesiones del usuario
- **Operation ID:** `IamUsersController_listSessions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.listSessions](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Nunca devuelve el identificador del token de sesión.

Contexto declarado en el controlador: UC-01-06 (cara de lectura).

### Descripción del sistema

NestJS resuelve `GET /iam/users/{id}/sessions` en `IamUsersController_listSessions`. El controlador delega en `IamUsersReadService.listSessions`. No recibe body. El tipo de retorno estático es `Promise<ListSessionsResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /iam/users/00000000-0000-4000-8000-000000000001/sessions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /iam/users/00000000-0000-4000-8000-000000000001/sessions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ListSessionsResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ListSessionsResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ListSessionsResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ListSessionsResponseDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ListSessionsResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ListSessionsResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ListSessionsResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListSessionsResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "deviceId": "00000000-0000-4000-8000-000000000001",
      "geoLocation": "valor-ejemplo",
      "stateConceptId": "00000000-0000-4000-8000-000000000001",
      "expiresAt": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<SessionListItemDto>` | Sin restricción adicional declarada | Sesiones, de la más reciente a la más antigua. | `[{"id":"00000000-0000-4000-8000-000000000001","deviceId":"00000000-0000-4000-8000-000000000001","geoLocation":"valor-ejemplo","stateConceptId":"00000000-0000-4000-8000-000000000001","expiresAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la sesión; es lo que se usa para revocarla. | `00000000-0000-4000-8000-000000000001` |
| `items[].deviceId` | No | `string` | formato `uuid`; admite null | Dispositivo desde el que se abrió, si se registró. | `00000000-0000-4000-8000-000000000001` |
| `items[].geoLocation` | No | `string` | Sin restricción adicional declarada | Ubicación aproximada registrada al abrirla. | `valor-ejemplo` |
| `items[].stateConceptId` | Sí | `string` | formato `uuid` | Estado de la sesión. | `00000000-0000-4000-8000-000000000001` |
| `items[].expiresAt` | No | `string` | formato `date-time`; admite null | Caducidad de la sesión. | `2026-07-31T12:00:00.000Z` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Apertura de la sesión. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas sesiones trae la respuesta. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Usuario no encontrado | Excepción explícita en src/modules/iam/services/iam-users-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/users/{id}/sessions"
}
```

---

## 29. POST /iam/users/assisted-practitioner-registration

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Alta administrativa de un profesional (devuelve token de activación)
- **Operation ID:** `IamUsersController_assistedPractitionerRegistration`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.assistedPractitionerRegistration](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Alta administrativa de un profesional (devuelve token de activación). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: P6: alta de un profesional **por un administrador**. El equivalente de `assisted-registration` para el otro lado del mostrador. Faltaba: el único alta de profesional era `POST /iam/auth/register-practitioner`, que es `@Public()` y está limitado a 10 peticiones por minuto porque su superficie es un formulario abierto — su propio DTO declara que «el profesional se da de alta él mismo». Construir la pantalla de administración encima habría contradicho el contrato. Devuelve el token de activación de un solo uso para entregar al titular por canal seguro — **NUNCA** una contraseña.

### Descripción del sistema

NestJS resuelve `POST /iam/users/assisted-practitioner-registration` en `IamUsersController_assistedPractitionerRegistration`. El controlador delega en `IamPractitionerSelfRegistrationService.assistedRegisterPractitioner`. Valida el body como `AssistedPractitionerRegistrationDto` y consume `application/json`. El tipo de retorno estático es `Promise<AssistedPractitionerRegistrationResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AssistedPractitionerRegistrationDto`; los campos opcionales se omiten.

```http
POST /iam/users/assisted-practitioner-registration HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "email": "usuario@example.com",
  "licenseNumber": "valor-ejemplo",
  "credentialNumber": "valor-ejemplo",
  "reason": "Texto descriptivo de ejemplo"
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
| `email` | Sí | `string` | formato `email`; longitud máxima 320 | Correo que actúa como identidad de login | `usuario@example.com` |
| `name` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Ana` |
| `middleName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Lucía` |
| `lastName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Rojas` |
| `motherLastName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Paz` |
| `displayName` | No | `string` | longitud máxima 200 | Forma anterior de declarar el nombre. Preferí name/lastName. | `Nombre de ejemplo` |
| `licenseNumber` | Sí | `string` | longitud máxima 100 | Número de licencia o matrícula profesional | `valor-ejemplo` |
| `credentialNumber` | Sí | `string` | longitud máxima 100 | Número del título profesional que respalda la licencia | `valor-ejemplo` |
| `regulatoryAuthority` | No | `string` | longitud máxima 200 | Autoridad reguladora que emitió la licencia | `valor-ejemplo` |
| `licenseIssueDate` | No | `string` | formato `date` | Fecha de inscripción de la matrícula (ISO) | `2026-07-31` |
| `professionalTitle` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `nationalId` | No | `string` | longitud máxima 40 | Documento de identidad (se guarda como identificador oficial) | `00000000-0000-4000-8000-000000000001` |
| `issuerAdministrativeAreaConceptId` | No | `string` | formato `uuid` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `00000000-0000-4000-8000-000000000001` |
| `residenceMunicipalityConceptId` | No | `string` | formato `uuid` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `00000000-0000-4000-8000-000000000001` |
| `phone` | No | `string` | longitud máxima 40 | Teléfono de contacto en formato E.164 o nacional | `+59170000000` |
| `birthDate` | No | `string` | formato `date` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31` |
| `gender` | No | `string` | valores: `MALE`, `FEMALE`, `OTHER`, `UNKNOWN` | Género administrativo (HL7 AdministrativeGender) | `MALE` |
| `sexAtBirth` | No | `string` | valores: `MALE`, `FEMALE`, `INTERSEX`, `UNKNOWN` | Sexo asignado al nacer | `MALE` |
| `practitionerCategoryConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `jurisdictionConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `credentialTypeConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `languageConceptId` | No | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `acceptsNewPatients` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `false` |
| `timeZone` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `America/La_Paz` |
| `reason` | Sí | `string` | longitud máxima 500 | Motivo del alta administrativa (trazabilidad C-18) | `Texto descriptivo de ejemplo` |
| `clinicalRoles` | No | `array<string>` | longitud máxima 100; máximo 10 elemento(s) | Roles asistenciales a conceder (códigos de `GET /authz/roles`) | `["CLINICIAN","SURGEON"]` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/users/assisted-practitioner-registration HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "email": "usuario@example.com",
  "name": "Ana",
  "middleName": "Lucía",
  "lastName": "Rojas",
  "motherLastName": "Paz",
  "displayName": "Nombre de ejemplo",
  "licenseNumber": "valor-ejemplo",
  "credentialNumber": "valor-ejemplo",
  "regulatoryAuthority": "valor-ejemplo",
  "licenseIssueDate": "2026-07-31",
  "professionalTitle": "valor-ejemplo",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "phone": "+59170000000",
  "birthDate": "2026-07-31",
  "gender": "MALE",
  "sexAtBirth": "MALE",
  "practitionerCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "languageConceptId": "00000000-0000-4000-8000-000000000001",
  "acceptsNewPatients": false,
  "timeZone": "America/La_Paz",
  "reason": "Texto descriptivo de ejemplo",
  "clinicalRoles": [
    "CLINICIAN",
    "SURGEON"
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AssistedPractitionerRegistrationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AssistedPractitionerRegistrationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AssistedPractitionerRegistrationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AssistedPractitionerRegistrationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AssistedPractitionerRegistrationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AssistedPractitionerRegistrationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AssistedPractitionerRegistrationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AssistedPractitionerRegistrationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AssistedPractitionerRegistrationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AssistedPractitionerRegistrationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "activationToken": "valor-ejemplo",
  "activationExpiresAt": "2026-07-31T12:00:00.000Z",
  "clinicalRoles": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `activationToken` | Sí | `string` | Sin restricción adicional declarada | Token de un solo uso a entregar al titular por canal seguro | `valor-ejemplo` |
| `activationExpiresAt` | Sí | `string` | formato `date-time` | Cuándo caduca el token. | `2026-07-31T12:00:00.000Z` |
| `clinicalRoles` | No | `array<string>` | Sin restricción adicional declarada | Roles asistenciales efectivamente concedidos. Se devuelven para que el administrador vea con qué quedó operativo el profesional sin tener que consultarlo aparte. Si alguno de los pedidos no existía, el alta entera falla, así que esta lista coincide siempre con lo solicitado. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Canal no encontrado | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 409 | `CONFLICT` | Ya existe una cuenta con ese correo | Excepción explícita en src/modules/iam/services/iam-practitioner-self-registration.service.ts |
| 409 | `CONFLICT` | El practitioner_code ya está en uso | Excepción explícita en src/modules/iam/services/iam-practitioner-self-registration.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Alguno de los roles indicados no existe o no es asignable | Excepción explícita en src/modules/iam/services/iam-practitioner-self-registration.service.ts |
| 422 | `PRECONDITION_FAILED` | La notificación necesita destinatario interno o dirección de destino | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal no está activo | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla no está publicada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla es de otro canal | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/iam/users/assisted-practitioner-registration"
}
```

---

## 30. POST /iam/users/assisted-registration

- **Módulo:** `iam`
- **Etiqueta OpenAPI:** `iam-users`
- **Nombre:** Registro asistido de un paciente (devuelve token de activación)
- **Operation ID:** `IamUsersController_assistedRegistration`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [IamUsersController.assistedRegistration](../../src/modules/iam/controllers/iam-users.controller.ts)

### Descripción de negocio

Registro asistido de un paciente (devuelve token de activación). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: C-18 / CAN-IDENT: registro asistido de un paciente. Devuelve el token de activación de un solo uso para entregar al titular por canal seguro — NUNCA una contraseña.

### Descripción del sistema

NestJS resuelve `POST /iam/users/assisted-registration` en `IamUsersController_assistedRegistration`. El controlador delega en `IamAssistedRegistrationService.assistedRegistration`. Valida el body como `AssistedRegistrationDto` y consume `application/json`. El tipo de retorno estático es `Promise<AssistedRegistrationResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AssistedRegistrationDto`; los campos opcionales se omiten.

```http
POST /iam/users/assisted-registration HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "email": "usuario@example.com",
  "reason": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `CLINICIAN`, `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `name` | No | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Lucía` |
| `middleName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Andrea` |
| `lastName` | No | `string` | longitud mínima 1; longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Mamani` |
| `motherLastName` | No | `string` | longitud máxima 100 | Sin descripción específica en el contrato OpenAPI. | `Quispe` |
| `displayName` | No | `string` | longitud mínima 1; longitud máxima 200 | Forma anterior de declarar el nombre. Preferí name/lastName. | `Nombre de ejemplo` |
| `email` | Sí | `string` | formato `email`; longitud máxima 320 | Identificador verificado (email) que actúa como identidad de login | `usuario@example.com` |
| `reason` | Sí | `string` | longitud mínima 1; longitud máxima 500 | Motivo del registro asistido (queda en la trazabilidad C-18) | `Texto descriptivo de ejemplo` |
| `timeZone` | No | `string` | longitud máxima 100 | Zona horaria IANA del paciente | `America/La_Paz` |
| `legalRepresentationId` | No | `string` | formato `uuid` | Id de la representación legal formal (authz.patient_legal_representations) | `00000000-0000-4000-8000-000000000001` |
| `legalRepresentativeUserId` | No | `string` | formato `uuid` | Id del usuario representante legal (dato mínimo si no hay representación formal) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /iam/users/assisted-registration HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "name": "Lucía",
  "middleName": "Andrea",
  "lastName": "Mamani",
  "motherLastName": "Quispe",
  "displayName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "reason": "Texto descriptivo de ejemplo",
  "timeZone": "America/La_Paz",
  "legalRepresentationId": "00000000-0000-4000-8000-000000000001",
  "legalRepresentativeUserId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AssistedRegistrationResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AssistedRegistrationResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AssistedRegistrationResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AssistedRegistrationResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AssistedRegistrationResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AssistedRegistrationResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AssistedRegistrationResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AssistedRegistrationResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AssistedRegistrationResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AssistedRegistrationResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "activationToken": "valor-ejemplo",
  "activationExpiresAt": "2026-07-31T12:00:00.000Z",
  "status": "PENDING_ACTIVATION"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `userId` | Sí | `string` | formato `uuid` | Id de la cuenta creada | `00000000-0000-4000-8000-000000000001` |
| `activationToken` | Sí | `string` | Sin restricción adicional declarada | Token de activación de un solo uso (entregar al titular por canal seguro) | `valor-ejemplo` |
| `activationExpiresAt` | Sí | `string` | formato `date-time` | Caducidad del token de activación | `2026-07-31T12:00:00.000Z` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Estado de la cuenta (pendiente de activación) | `PENDING_ACTIVATION` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: CLINICIAN, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una cuenta con ese identificador; prefiera invitar en lugar de crear un duplicado | Excepción explícita en src/modules/iam/services/iam-assisted-registration.service.ts |
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
  "path": "/iam/users/assisted-registration"
}
```

---

