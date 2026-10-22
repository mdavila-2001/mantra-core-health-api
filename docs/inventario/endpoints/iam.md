<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `iam`

- **Bloque:** Identidad y Seguridad (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)
- **Operaciones:** 36 (35 en el contrato, 1 sólo en el código)
- **Riesgo:** ALTO 18 · MEDIO 9 · BAJO 9
- **Tablas distintas que tocan:** 52
- **Respuestas de error y detalle contractual:** `openapi/endpoints/iam.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | DESCONOCIDO | `/iam/auth` | Entrega el par de tokens según el modo configurado. Con la cookie apagada —el default— devuelve la respuesta tal cual y el contrato no cambia en absoluto. Con la cookie encendida escribe el refresh token en una cookie httpOnly y **lo quita del cuerpo**: dejarlo en los dos sitios no protegería de nada, porque el objetivo del ejercicio es que el token deje de estar al alcance de JavaScript. | BAJO | 0 | sesión (sin roles) |
| 2 | POST | `/iam/auth/activate` | Activar la cuenta con el token de un solo uso y fijar la contraseña | ALTO | 7 | pública |
| 3 | POST | `/iam/auth/change-password` | Cambiar la contraseña de la propia cuenta | ALTO | 6 | sesión (sin roles) |
| 4 | POST | `/iam/auth/forgot-password` | Solicitar el restablecimiento de la contraseña | ALTO | 11 | pública |
| 5 | POST | `/iam/auth/login` | Iniciar sesión con email o documento de identidad y contraseña | ALTO | 23 | pública |
| 6 | POST | `/iam/auth/logout` | Cerrar la sesión actual del usuario | ALTO | 4 | sesión (sin roles) |
| 7 | POST | `/iam/auth/logout-all` | Cerrar todas las sesiones del usuario actual | ALTO | 4 | sesión (sin roles) |
| 8 | POST | `/iam/auth/register-organization` | Registrar una organización con su cuenta owner | ALTO | 36 | pública |
| 9 | POST | `/iam/auth/register-patient` | Registrarse como paciente con documento de identidad | ALTO | 21 | pública |
| 10 | POST | `/iam/auth/register-practitioner` | Registrarse como profesional de salud con su matrícula | ALTO | 45 | pública |
| 11 | POST | `/iam/auth/resend-verification` | Reenviar el enlace de verificación del correo | ALTO | 9 | pública |
| 12 | POST | `/iam/auth/reset-password` | Fijar una contraseña nueva con el token recibido por correo | ALTO | 8 | pública |
| 13 | POST | `/iam/auth/sessions/purge` | Expirar sesiones y tokens vencidos | MEDIO | 3 | SECURITY_ADMIN |
| 14 | POST | `/iam/auth/token/refresh` | Rotar el refresh token | ALTO | 15 | pública |
| 15 | POST | `/iam/auth/upload-registration-document` | Pre-cargar un PDF para un registro de organización o profesional | ALTO | 6 | pública |
| 16 | POST | `/iam/auth/upload-registration-signature-image` | Pre-cargar una imagen de firma o sello para el registro | ALTO | 6 | pública |
| 17 | POST | `/iam/auth/verify-email` | Verificar el correo con el token recibido | ALTO | 4 | pública |
| 18 | GET | `/iam/me/sessions` | Listar mis sesiones abiertas | BAJO | 1 | sesión (sin roles) |
| 19 | POST | `/iam/me/sessions/{id}/revoke` | Cerrar una de mis sesiones | ALTO | 4 | sesión (sin roles) |
| 20 | GET | `/iam/users` | Listado paginado de usuarios | BAJO | 2 | SECURITY_ADMIN |
| 21 | POST | `/iam/users` | Crear un usuario con credencial de contraseña y rol inicial | MEDIO | 6 | SECURITY_ADMIN |
| 22 | GET | `/iam/users/{id}` | Ficha de un usuario | BAJO | 1 | SECURITY_ADMIN |
| 23 | POST | `/iam/users/{id}/anonymize` | Anonimizar (DSAR) la cuenta | MEDIO | 8 | SECURITY_ADMIN |
| 24 | GET | `/iam/users/{id}/credentials` | Credenciales del usuario | BAJO | 2 | SECURITY_ADMIN |
| 25 | POST | `/iam/users/{id}/credentials/{cid}/revoke` | Revocar una credencial del usuario | MEDIO | 3 | SECURITY_ADMIN |
| 26 | POST | `/iam/users/{id}/credentials/federated` | Enlazar una credencial de identidad federada | MEDIO | 4 | SECURITY_ADMIN |
| 27 | GET | `/iam/users/{id}/devices` | Dispositivos del usuario | BAJO | 2 | SECURITY_ADMIN |
| 28 | POST | `/iam/users/{id}/devices` | Registrar un dispositivo del usuario | ALTO | 3 | sesión (sin roles) |
| 29 | GET | `/iam/users/{id}/global-roles` | Roles globales del usuario | BAJO | 2 | SECURITY_ADMIN |
| 30 | POST | `/iam/users/{id}/global-roles` | Conceder o revocar un rol global | MEDIO | 8 | SECURITY_ADMIN |
| 31 | POST | `/iam/users/{id}/lock` | Bloquear la cuenta y revocar sus sesiones | MEDIO | 7 | SECURITY_ADMIN |
| 32 | GET | `/iam/users/{id}/mfa-factors` | Factores de MFA del usuario | BAJO | 2 | SECURITY_ADMIN |
| 33 | POST | `/iam/users/{id}/mfa-factors` | Enrolar o verificar un factor MFA | ALTO | 6 | sesión (sin roles) |
| 34 | GET | `/iam/users/{id}/sessions` | Sesiones del usuario | BAJO | 2 | SECURITY_ADMIN |
| 35 | POST | `/iam/users/assisted-practitioner-registration` | Alta administrativa de un profesional (devuelve token de activación) | MEDIO | 45 | SECURITY_ADMIN |
| 36 | POST | `/iam/users/assisted-registration` | Registro asistido de un paciente (devuelve token de activación) | MEDIO | 6 | CLINICIAN, SECURITY_ADMIN |

---

## 1. DESCONOCIDO /iam/auth

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Entrega el par de tokens según el modo configurado. Con la cookie apagada —el default— devuelve la respuesta tal cual y el contrato no cambia en absoluto. Con la cookie encendida escribe el refresh token en una cookie httpOnly y **lo quita del cuerpo**: dejarlo en los dos sitios no protegería de nada, porque el objetivo del ejercicio es que el token deje de estar al alcance de JavaScript.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.deliverTokens` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:427`

### Qué es y para qué sirve (negocio)

Entrega el par de tokens según el modo configurado. Con la cookie apagada —el default— devuelve la respuesta tal cual y el contrato no cambia en absoluto. Con la cookie encendida escribe el refresh token en una cookie httpOnly y **lo quita del cuerpo**: dejarlo en los dos sitios no protegería de nada, porque el objetivo del ejercicio es que el token deje de estar al alcance de JavaScript. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`DESCONOCIDO /iam/auth` la atiende `IamAuthController.deliverTokens` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:427). Exige sesión; el controlador no declara roles. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:427` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/iam/presentation/controllers/iam-auth.controller.ts:427`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `TokenResponseDto` · DTO `TokenResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `accessToken` | `string` | Sí | — | — | JWT de acceso | `src/modules/iam/presentation/dto/token-response.dto.ts:9` |
| `refreshToken` | `string` | Sí | — | — | Refresh token en crudo; solo se entrega una vez | `src/modules/iam/presentation/dto/token-response.dto.ts:17` |
| `expiresAt` | `string` | Sí | formato date-time | — | Expiración de la sesión | `src/modules/iam/presentation/dto/token-response.dto.ts:27` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /iam/auth/activate

- **Origen:** CONTRATO
- **Nombre:** Activar la cuenta con el token de un solo uso y fijar la contraseña
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.activate` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:299`

### Qué es y para qué sirve (negocio)

Activar la cuenta con el token de un solo uso y fijar la contraseña. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/activate` la atiende `IamAuthController.activate` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:299). Es una ruta pública: no exige token. Valida el cuerpo como `ActivateAccountDto` (2 campos, 2 obligatorios). Delega en `IamAssistedRegistrationService.activateAccount`. Crea filas en iam.security_events. Actualiza iam.account_activations, iam.authentication_credentials, iam.users. Lee iam.account_activations, iam.authentication_credentials, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:299` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:299` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.account_activations` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.activate → IamAssistedRegistrationService.activateAccount | `src/modules/iam/application/services/iam-assisted-registration.service.ts:222` |
| `iam.account_activations` | LEE | LEE | DIRECTA | IamAuthController.activate → IamAssistedRegistrationService.activateAccount → AccountActivationsRepository.findByTokenHash | `src/modules/iam/infrastructure/repositories/account-activations.repository.ts:67` |
| `iam.authentication_credentials` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.activate → IamAssistedRegistrationService.activateAccount | `src/modules/iam/application/services/iam-assisted-registration.service.ts:258` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.activate → IamAssistedRegistrationService.activateAccount → CredentialsRepository.findPendingPasswordByUser | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:211` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.activate → IamAssistedRegistrationService.activateAccount → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.activate → IamAssistedRegistrationService.activateAccount | `src/modules/iam/application/services/iam-assisted-registration.service.ts:268` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.activate → IamAssistedRegistrationService.activateAccount → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Cuerpo — DTO `ActivateAccountDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `activationToken` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Token de activación de un solo uso recibido por canal seguro | `src/modules/iam/presentation/dto/activate-account.dto.ts:19` |
| `newPassword` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | Contraseña definitiva elegida por el titular (se persiste solo su hash argon2id) | `src/modules/iam/presentation/dto/activate-account.dto.ts:31` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "activationToken": "valor-ejemplo",
  "newPassword": "ClaveSegura2026!"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "activationToken": "valor-ejemplo",
  "newPassword": "ClaveSegura2026!"
}
```

</details>

### Respuesta — `Promise<ActivationResultDto>` · DTO `ActivationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | — | Id de la cuenta activada | `src/modules/iam/presentation/dto/activate-account.dto.ts:40` |
| `status` | `string` | Sí | — | — | Estado resultante de la cuenta | `src/modules/iam/presentation/dto/activate-account.dto.ts:49` |
| `activated` | `boolean` | Sí | — | — | true si la activación se aplicó | `src/modules/iam/presentation/dto/activate-account.dto.ts:55` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: Token de activación inválido; UnauthorizedException: El token de activación ya fue utilizado; UnauthorizedException: El token de activación expiró |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /iam/auth/change-password

- **Origen:** CONTRATO
- **Nombre:** Cambiar la contraseña de la propia cuenta
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAccountSecurityController.changePassword` — `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:44`

### Qué es y para qué sirve (negocio)

Cambiar la contraseña de la propia cuenta. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/change-password` la atiende `IamAccountSecurityController.changePassword` (src/modules/iam/presentation/controllers/iam-account-security.controller.ts:44). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ChangePasswordDto` (2 campos, 2 obligatorios). Delega en `IamAccountSecurityService.changePassword`. Crea filas en iam.security_events. Actualiza iam.authentication_credentials, iam.refresh_tokens, iam.sessions. Lee iam.authentication_credentials, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:44` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:44` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 5, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:44` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAccountSecurityController.changePassword → IamAccountSecurityService.changePassword | `src/modules/iam/application/services/iam-account-security.service.ts:115` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAccountSecurityController.changePassword → IamAccountSecurityService.changePassword → CredentialsRepository.findActivePasswordByUser | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:132` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAccountSecurityController.changePassword → IamAccountSecurityService.changePassword → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:96` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAccountSecurityController.changePassword → IamAccountSecurityService.changePassword → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAccountSecurityController.changePassword → IamAccountSecurityService.changePassword → SessionsRepository.revokeByIds | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:131` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAccountSecurityController.changePassword → IamAccountSecurityService.changePassword → SessionsRepository.findActiveByUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:117` |

### Cuerpo — DTO `ChangePasswordDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `currentPassword` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Contraseña actual | `src/modules/iam/presentation/dto/account-security.dto.ts:12` |
| `newPassword` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | Contraseña nueva | `src/modules/iam/presentation/dto/account-security.dto.ts:25` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "currentPassword": "ClaveSegura2026!",
  "newPassword": "ClaveSegura2026!"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "currentPassword": "ClaveSegura2026!",
  "newPassword": "ClaveSegura2026!"
}
```

</details>

### Respuesta — `Promise<ChangePasswordResultDto>` · DTO `ChangePasswordResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `revokedSessions` | `number` | Sí | — | — | Nº de las otras sesiones que se revocaron | `src/modules/iam/presentation/dto/account-security.dto.ts:34` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una contraseña que cambiar; PreconditionFailedException: La contraseña actual no coincide; PreconditionFailedException: La contraseña nueva tiene que ser distinta de la actual |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamAccountSecurityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /iam/auth/forgot-password

- **Origen:** CONTRATO
- **Nombre:** Solicitar el restablecimiento de la contraseña
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.forgotPassword` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:351`

### Qué es y para qué sirve (negocio)

Solicitar el restablecimiento de la contraseña. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/forgot-password` la atiende `IamAuthController.forgotPassword` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:351). Es una ruta pública: no exige token. Valida el cuerpo como `ForgotPasswordDto` (1 campo, 1 obligatorio). Delega en `IamPasswordResetService.requestReset`. Crea filas en iam.password_resets, iam.security_events, messaging.notification_requests. Actualiza iam.password_resets. Lee iam.authentication_credentials, iam.email_verifications, iam.users, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:351` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 5, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:351` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → CredentialsRepository.findActivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:67` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.resolveEmail → EmailVerificationsRepository.findLatestByUser | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:85` |
| `iam.password_resets` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → PasswordResetsRepository.revokeActiveForUser | `src/modules/iam/infrastructure/repositories/password-resets.repository.ts:74` |
| `iam.password_resets` | ESCRIBE | CREA | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → PasswordResetsRepository.create | `src/modules/iam/infrastructure/repositories/password-resets.repository.ts:38` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.sendResetEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.sendResetEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.sendResetEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.sendResetEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.sendResetEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |

### Cuerpo — DTO `ForgotPasswordDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `identifier` | `string` | Sí | longitud mínima 1; longitud máxima 320 | `@IsString()` `@IsNotEmpty()` `@MaxLength(320)` | Correo o documento con el que la persona inicia sesión | `src/modules/iam/presentation/dto/password-reset.dto.ts:23` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "identifier": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "identifier": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ForgotPasswordResponseDto>` · DTO `ForgotPasswordResponseDto` · HTTP `HttpStatus.ACCEPTED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `message` | `string` | Sí | — | — | Mensaje neutro, idéntico exista o no la cuenta, para no confirmar registros | `src/modules/iam/presentation/dto/password-reset.dto.ts:42` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 202 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La notificación necesita destinatario interno o dirección de destino; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:168` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /iam/auth/login

- **Origen:** CONTRATO
- **Nombre:** Iniciar sesión con email o documento de identidad y contraseña
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.login` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:318`

### Qué es y para qué sirve (negocio)

Iniciar sesión con email o documento de identidad y contraseña. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/login` la atiende `IamAuthController.login` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:318). Es una ruta pública: no exige token. Valida el cuerpo como `LoginDto` (4 campos, 1 obligatorio). Delega en `IamAuthService.login`. Crea filas en iam.account_lockouts, iam.refresh_tokens, iam.security_events, iam.sessions. Actualiza iam.account_lockouts, iam.refresh_tokens, iam.sessions, iam.users. Lee authz.roles, authz.user_role_assignments, common.contact_points, directory.tenant_memberships, directory.tenants, iam.account_lockouts, iam.authentication_credentials, iam.mfa_factors y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:318` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:318` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.mergeRoleCodes → AuthzEffectiveRolesService.scopedAssignmentsForUser | `src/modules/authz/services/authz-effective-roles.service.ts:96` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.mergeRoleCodes → AuthzEffectiveRolesService.scopedAssignmentsForUser → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `common.contact_points` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → CredentialsRepository.findActivePasswordByLoginIdentifier | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:108` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadActiveTenantIds | `src/modules/iam/application/services/iam-auth.service.ts:230` |
| `directory.tenants` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadTenantDisplay | `src/modules/iam/application/services/iam-auth.service.ts:333` |
| `iam.account_lockouts` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword | `src/modules/iam/application/services/iam-auth.service.ts:863` |
| `iam.account_lockouts` | ESCRIBE | CREA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → AccountLockoutsRepository.create | `src/modules/iam/infrastructure/repositories/account-lockouts.repository.ts:35` |
| `iam.account_lockouts` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → AccountLockoutsRepository.findActiveForUser | `src/modules/iam/infrastructure/repositories/account-lockouts.repository.ts:55` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → CredentialsRepository.findActivePasswordByLoginIdentifier | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:100` |
| `iam.mfa_factors` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.assertMfaChallenge → MfaFactorsRepository.findVerifiedByUser | `src/modules/iam/infrastructure/repositories/mfa-factors.repository.ts:54` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:96` |
| `iam.refresh_tokens` | ESCRIBE | CREA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → RefreshTokensRepository.create | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:39` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.security_events` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → SecurityEventsRepository.countFailedLoginsSince | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:66` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → SessionsRepository.revokeAllActiveForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:104` |
| `iam.sessions` | ESCRIBE | CREA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → SessionsRepository.create | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:43` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → SessionsRepository.activeSessionIdsForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:94` |
| `iam.user_global_roles` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → UserGlobalRolesRepository.findActiveForUser | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:57` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin | `src/modules/iam/application/services/iam-auth.service.ts:485` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → CredentialsRepository.findActivePasswordByLoginIdentifier | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:114` |

### Cuerpo — DTO `LoginDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `email` | `string` | No | formato email; longitud máxima 320 | `@ValidateIf((dto: LoginDto) => dto.nationalId === undefined)` `@IsEmail()` `@MaxLength(320)` | — | `src/modules/iam/presentation/dto/login.dto.ts:28` |
| `nationalId` | `string` | No | longitud máxima 40 | `@IsOptional()` `@IsString()` `@MaxLength(40)` | Documento de identidad (CI) | `src/modules/iam/presentation/dto/login.dto.ts:37` |
| `password` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/login.dto.ts:45` |
| `mfaCode` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | Código MFA de un solo uso, si el usuario lo tiene activo | `src/modules/iam/presentation/dto/login.dto.ts:56` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "password": "ClaveSegura2026!"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "email": "usuario@example.com",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "password": "ClaveSegura2026!",
  "mfaCode": "CODIGO_EJEMPLO"
}
```

</details>

### Respuesta — `Promise<TokenResponseDto>` · DTO `TokenResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `accessToken` | `string` | Sí | — | — | JWT de acceso | `src/modules/iam/presentation/dto/token-response.dto.ts:9` |
| `refreshToken` | `string` | Sí | — | — | Refresh token en crudo; solo se entrega una vez | `src/modules/iam/presentation/dto/token-response.dto.ts:17` |
| `expiresAt` | `string` | Sí | formato date-time | — | Expiración de la sesión | `src/modules/iam/presentation/dto/token-response.dto.ts:27` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: Credenciales inválidas; UnauthorizedException: {{ message: 'Se requiere el código de verificación en dos pa…}; UnauthorizedException: {{ message: 'El código de verificación no es válido', detail…} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/br14-encuentros-seguridad-clinica.int-spec.ts:64` |
| INTEGRACION | `test/integration/clinical-c14-c23-notas-e-internacion.int-spec.ts:68` |
| INTEGRACION | `test/integration/clinical-prescriptions-pdf.int-spec.ts:80` |
| INTEGRACION | `test/integration/community-realtime-chat.int-spec.ts:104` |
| INTEGRACION | `test/integration/dependent-link-requests.int-spec.ts:72` |
| INTEGRACION | `test/integration/diagnostics-release.int-spec.ts:61` |
| INTEGRACION | `test/integration/fx1-doctor-publica-agenda.int-spec.ts:51` |
| INTEGRACION | `test/integration/fx10-mostrador-atomico.int-spec.ts:142` |
| INTEGRACION | `test/integration/fx11-notas-de-evolucion-coleccion.int-spec.ts:73` |
| INTEGRACION | `test/integration/fx12-check-in-idempotente-por-cita.int-spec.ts:136` |
| INTEGRACION | `test/integration/fx13-encuentro-en-la-reserva.int-spec.ts:78` |
| INTEGRACION | `test/integration/fx15-documentos-del-expediente.int-spec.ts:77` |
| INTEGRACION | `test/integration/fx16-dependientes-y-tutor-legal.int-spec.ts:79` |
| INTEGRACION | `test/integration/fx17-sello-del-encuentro.int-spec.ts:94` |
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:73` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:114` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:96` |
| INTEGRACION | `test/integration/fx5-motivos-de-bloqueo.int-spec.ts:67` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:100` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:82` |
| INTEGRACION | `test/integration/fx9-carreras-de-la-agenda.int-spec.ts:137` |
| INTEGRACION | `test/integration/hardening/mch-001.int-spec.ts:71` |
| INTEGRACION | `test/integration/hardening/mch-004.int-spec.ts:56` |
| INTEGRACION | `test/integration/hardening/mch-005.int-spec.ts:50` |
| INTEGRACION | `test/integration/hardening/mch-034.int-spec.ts:81` |
| INTEGRACION | `test/integration/iam.int-spec.ts:80` |
| INTEGRACION | `test/integration/identity-verification-self-service.int-spec.ts:73` |
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:73` |
| INTEGRACION | `test/integration/insurance-plan-administration.int-spec.ts:63` |
| INTEGRACION | `test/integration/insurance-portability.int-spec.ts:65` |
| INTEGRACION | `test/integration/insurer-patients.int-spec.ts:66` |
| INTEGRACION | `test/integration/lab-reception-inbox.int-spec.ts:66` |
| INTEGRACION | `test/integration/observability.int-spec.ts:76` |
| INTEGRACION | `test/integration/organization-headquarters-location.int-spec.ts:111` |
| INTEGRACION | `test/integration/organization-legal-representative.int-spec.ts:96` |
| INTEGRACION | `test/integration/patient-access-revocation.int-spec.ts:50` |
| INTEGRACION | `test/integration/patient-diagnostic-orders.int-spec.ts:66` |
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:63` |
| INTEGRACION | `test/integration/practitioner-credential-registration-files.int-spec.ts:154` |
| INTEGRACION | `test/integration/practitioner-own-credential.int-spec.ts:42` |
| INTEGRACION | `test/integration/practitioner-own-profile.int-spec.ts:67` |
| INTEGRACION | `test/integration/practitioner-registration.int-spec.ts:137` |
| INTEGRACION | `test/integration/practitioner-signature-registration.int-spec.ts:72` |
| INTEGRACION | `test/integration/quitar-punto-del-mapa.int-spec.ts:91` |
| INTEGRACION | `test/integration/refresh-cookie.int-spec.ts:57` |
| INTEGRACION | `test/integration/tj1-onboarding-medico.int-spec.ts:108` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:140` |
| INTEGRACION | `test/integration/virtual-encounter-auth.int-spec.ts:50` |
| INTEGRACION | `test/integration/waitlist-cupo-liberado.int-spec.ts:121` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:75` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /iam/auth/logout

- **Origen:** CONTRATO
- **Nombre:** Cerrar la sesión actual del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.logout` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:444`

### Qué es y para qué sirve (negocio)

Cerrar la sesión actual del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/logout` la atiende `IamAuthController.logout` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:444). Exige sesión; el controlador no declara roles. Delega en `IamAuthService.logout`. Crea filas en iam.security_events. Actualiza iam.refresh_tokens, iam.sessions. Lee iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:444` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:444` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.logout → IamAuthService.logout → RefreshTokensRepository.revokeBySessionId | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:83` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.logout → IamAuthService.logout → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.logout → IamAuthService.logout → SessionsRepository.revokeById | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:82` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAuthController.logout → IamAuthService.logout → SessionsRepository.findActiveByTokenId | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:74` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LogoutResultDto>` · DTO `LogoutResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `revoked` | `boolean` | Sí | — | — | Si la sesión quedó revocada en esta llamada | `src/modules/iam/presentation/dto/operation-result.dto.ts:22` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-004.int-spec.ts:76` |
| INTEGRACION | `test/integration/refresh-cookie.int-spec.ts:151` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /iam/auth/logout-all

- **Origen:** CONTRATO
- **Nombre:** Cerrar todas las sesiones del usuario actual
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.logoutAll` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:464`

### Qué es y para qué sirve (negocio)

Cerrar todas las sesiones del usuario actual. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/logout-all` la atiende `IamAuthController.logoutAll` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:464). Exige sesión; el controlador no declara roles. Delega en `IamAuthService.logoutAll`. Crea filas en iam.security_events. Actualiza iam.refresh_tokens, iam.sessions. Lee iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:464` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:464` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.logoutAll → IamAuthService.logoutAll → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:96` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.logoutAll → IamAuthService.logoutAll → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.logoutAll → IamAuthService.logoutAll → SessionsRepository.revokeAllActiveForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:104` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAuthController.logoutAll → IamAuthService.logoutAll → SessionsRepository.activeSessionIdsForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:94` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LogoutAllResultDto>` · DTO `LogoutAllResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `revokedSessions` | `number` | Sí | — | — | Nº de sesiones revocadas | `src/modules/iam/presentation/dto/operation-result.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-004.int-spec.ts:87` |
| INTEGRACION | `test/integration/iam.int-spec.ts:177` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:95` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /iam/auth/register-organization

- **Origen:** CONTRATO
- **Nombre:** Registrar una organización con su cuenta owner
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.registerOrganization` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:133`

### Qué es y para qué sirve (negocio)

Registrar una organización con su cuenta owner. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/register-organization` la atiende `IamAuthController.registerOrganization` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:133). Es una ruta pública: no exige token. Valida el cuerpo como `RegisterOrganizationDto` (126 campos, 7 obligatorios). Delega en `IamOrganizationSelfRegistrationService.registerOrganization`. Crea filas en common.addresses, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, directory.branches, directory.tenant_affiliation_documents, directory.tenant_legal_representatives, directory.tenant_memberships y 12 más. Actualiza common.files. Lee common.file_versions, common.files, directory.tenant_affiliation_documents, directory.tenants, iam.authentication_credentials, messaging.message_channels, messaging.message_templates, messaging.notification_requests y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:133` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:133` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantTypeProfileService.materializeProfile → TenantTypeProfileService.materializePayerHeadquarters → AddressesRepository.create | `src/modules/common/repositories/addresses.repository.ts:118` |
| `common.file_versions` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantAffiliationDocumentsService.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachOne → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantAffiliationDocumentsService.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachOne → AttachableFileService.claimAnonymousUpload | `src/modules/common/services/attachable-file.service.ts:270` |
| `common.files` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantAffiliationDocumentsService.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachOne → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:182` |
| `diagnostic_units.diagnostic_study_offerings` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticStudyOfferingsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-offerings.repository.ts:119` |
| `diagnostic_units.diagnostic_unit_sites` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticUnitSitesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:72` |
| `diagnostic_units.diagnostic_units` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticUnitsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:83` |
| `directory.branches` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.createPharmacyBranches → BranchesRepository.create | `src/modules/directory/repositories/branches.repository.ts:76` |
| `directory.tenant_affiliation_documents` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantAffiliationDocumentsService.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachOne → DirectoryTenantLegalRepository.createAffiliationDocument | `src/modules/directory/repositories/directory-tenant-legal.repository.ts:108` |
| `directory.tenant_affiliation_documents` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantAffiliationDocumentsService.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachOne → DirectoryTenantLegalRepository.findAffiliationDocumentByFile | `src/modules/directory/repositories/directory-tenant-legal.repository.ts:100` |
| `directory.tenant_legal_representatives` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationRepresentativesService.register → TenantLegalRepresentativesService.attachRegistrationRepresentatives → DirectoryTenantLegalRepository.createLegalRepresentative | `src/modules/directory/repositories/directory-tenant-legal.repository.ts:140` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `directory.tenants` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantsRepository.create | `src/modules/directory/repositories/tenants.repository.ts:131` |
| `directory.tenants` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantsRepository.findByCode | `src/modules/directory/repositories/tenants.repository.ts:76` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → CredentialsRepository.createPassword | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:280` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:197` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → EmailVerificationsRepository.create | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:41` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → UserGlobalRolesRepository.create | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → UsersRepository.create | `src/modules/iam/infrastructure/repositories/users.repository.ts:49` |
| `insurance.insurance_brokers` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantTypeProfileService.materializeProfile → CatalogRepository.createBroker | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:256` |
| `insurance.insurance_carriers` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantTypeProfileService.materializeProfile → CatalogRepository.createCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:62` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantAffiliationDocumentsService.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachOne → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy.pharmacies` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization | `src/modules/iam/application/services/iam-organization-self-registration.service.ts:322` |
| `practice.practice_sites` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → PracticeSitesRepository.create | `src/modules/practice/repositories/practice-sites.repository.ts:111` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → PracticeSitesRepository.findByPracticeAndCode | `src/modules/practice/repositories/practice-sites.repository.ts:85` |
| `practice.practices` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → PracticesRepository.create | `src/modules/practice/repositories/practices.repository.ts:130` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantTypeProfileService.assertConceptsExist → CatalogConceptsRepository.findByIds | `src/modules/terminology/repositories/catalog-concepts.repository.ts:202` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantAffiliationDocumentsService.attachRegistrationDocuments → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantAffiliationDocumentsService.attachRegistrationDocuments → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantAffiliationDocumentsService.attachRegistrationDocuments → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Cuerpo — DTO `RegisterOrganizationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `organization` | `RegisterOrganizationDetailsDto` | Sí | — | `@IsNotEmptyObject()` `@ValidateNested()` `@Type(() => RegisterOrganizationDetailsDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:748` |
| `organization.code` | `string` | Sí | longitud mínima 3; longitud máxima 100; patrón runtime /^[A-Za-z0-9._-]+$/ | `@IsString()` `@MinLength(3)` `@MaxLength(100)` `@Matches(/^[A-Za-z0-9._-]+$/, { message: 'El código sólo admite letras, dígitos, punto, guion y guion bajo', })` | Código único global de la organización | `src/modules/iam/presentation/dto/register-organization.dto.ts:458` |
| `organization.legalName` | `string` | Sí | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Razón social / nombre legal | `src/modules/iam/presentation/dto/register-organization.dto.ts:467` |
| `organization.tradeName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Nombre comercial | `src/modules/iam/presentation/dto/register-organization.dto.ts:476` |
| `organization.tenantType` | `string` | Sí | valores: PROVIDER, PAYER, BROKER, UNIVERSITY, PHARMACY, HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER, HEALTH_BUSINESS, DIAGNOSTIC_CENTER | `@IsIn(TENANT_TYPE_CODES)` | Tipo de organización. Obligatorio: cada tipo exige sus propios datos. PAYER exige el bloque `payer` y BROKER el bloque `broker`. El resto —PROVIDER, UNIVERSITY, PHARMACY, DIAGNOSTIC_CENTER y las cuatro institucionales (HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER) y HEALTH_BUSINESS— exigen país y jurisdicción, que es lo que determina bajo qué regulador operan. | `src/modules/iam/presentation/dto/register-organization.dto.ts:495` |
| `organization.legalEntityType` | `string` | No | valores: UNIPERSONAL, SRL, LTDA, SA, SOCIEDAD_COLECTIVA, COMANDITA_SIMPLE, COMANDITA_ACCIONES, SUCURSAL_EXTRANJERA, BR_LTDA, BR_SA, BR_MEI, BR_EI, BR_SLU, BR_FILIAL_EST, US_LLC, US_CORP, US_SOLE_PROP, US_LLP, US_BRANCH, AR_SAS, MX_S_RL | `@IsOptional()` `@IsIn(LEGAL_ENTITY_TYPE_CODES)` | Tipo societario del diccionario internacional (BO/BR/US/AR/MX). Sin él, la organización nace con la forma legada `COMPANY`. | `src/modules/iam/presentation/dto/register-organization.dto.ts:515` |
| `organization.legalDocuments` | `RegisterOrganizationLegalDocumentsDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => RegisterOrganizationLegalDocumentsDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:531` |
| `organization.legalDocuments.constitutionFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Escritura de constitución (fileId de POST /iam/auth/upload-registration-document). Obligatoria salvo para UNIPERSONAL, que no la tiene; el servicio responde 422 nombrando el documento faltante | `src/modules/iam/presentation/dto/register-organization.dto.ts:60` |
| `organization.legalDocuments.taxIdentifierFileId` | `string` | No | formato uuid | `@IsUUID()` | Identificación tributaria (NIT en Bolivia) | `src/modules/iam/presentation/dto/register-organization.dto.ts:70` |
| `organization.legalDocuments.commerceRegistryFileId` | `string` | No | formato uuid | `@IsUUID()` | Registro mercantil (matrícula SEPREC en Bolivia) | `src/modules/iam/presentation/dto/register-organization.dto.ts:80` |
| `organization.legalDocuments.operatingLicenseFileId` | `string` | No | formato uuid | `@IsUUID()` | Licencia de funcionamiento | `src/modules/iam/presentation/dto/register-organization.dto.ts:87` |
| `organization.legalDocuments.healthAuthorityCertificateFileId` | `string` | No | formato uuid | `@IsUUID()` | Certificado de la autoridad sanitaria (SEDES en Bolivia) | `src/modules/iam/presentation/dto/register-organization.dto.ts:97` |
| `organization.legalRepresentative` | `RegisterOrganizationLegalRepresentativeDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => RegisterOrganizationLegalRepresentativeDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:551` |
| `organization.legalRepresentative.name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationLegalRepresentativeDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:240` |
| `organization.legalRepresentative.middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:249` |
| `organization.legalRepresentative.lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationLegalRepresentativeDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:262` |
| `organization.legalRepresentative.motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:271` |
| `organization.legalRepresentative.fullName` | `string` | No | longitud mínima 3; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(3)` `@MaxLength(200)` | Nombre completo del representante legal (forma anterior; preferí name/lastName) | `src/modules/iam/presentation/dto/register-organization.dto.ts:290` |
| `organization.legalRepresentative.idNumber` | `string` | No | longitud mínima 4; longitud máxima 50 | `@IsString()` `@MinLength(4)` `@MaxLength(50)` | Cédula de identidad o documento legal equivalente | `src/modules/iam/presentation/dto/register-organization.dto.ts:303` |
| `organization.legalRepresentative.email` | `string` | No | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Correo oficial para notificaciones legales | `src/modules/iam/presentation/dto/register-organization.dto.ts:316` |
| `organization.legalRepresentative.phone` | `string` | No | longitud mínima 7; longitud máxima 30 | `@IsOptional()` `@IsString()` `@MinLength(7)` `@MaxLength(30)` | Teléfono de contacto del representante | `src/modules/iam/presentation/dto/register-organization.dto.ts:331` |
| `organization.legalRepresentative.powerOfAttorneyFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del archivo del poder notariado (PDF ya pre-cargado). Obligatorio salvo para UNIPERSONAL, donde el titular actúa por sí; el servicio responde 422 si falta | `src/modules/iam/presentation/dto/register-organization.dto.ts:344` |
| `organization.executives` | `RegisterOrganizationExecutivesDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => RegisterOrganizationExecutivesDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:562` |
| `organization.executives.generalManager` | `RegisterOrganizationExecutiveContactDto` | No | — | `@IsNotEmptyObject()` `@ValidateNested()` `@Type(() => RegisterOrganizationExecutiveContactDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:364` |
| `organization.executives.generalManager.name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationExecutiveContactDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:132` |
| `organization.executives.generalManager.middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:141` |
| `organization.executives.generalManager.lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationExecutiveContactDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:154` |
| `organization.executives.generalManager.motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:163` |
| `organization.executives.generalManager.fullName` | `string` | No | longitud mínima 3; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(3)` `@MaxLength(200)` | Nombre completo del ejecutivo (forma anterior; preferí name/lastName) | `src/modules/iam/presentation/dto/register-organization.dto.ts:182` |
| `organization.executives.generalManager.phone` | `string` | No | longitud mínima 7; longitud máxima 30 | `@IsString()` `@MinLength(7)` `@MaxLength(30)` | Teléfono celular de contacto | `src/modules/iam/presentation/dto/register-organization.dto.ts:199` |
| `organization.executives.generalManager.email` | `string` | No | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Correo electrónico corporativo | `src/modules/iam/presentation/dto/register-organization.dto.ts:212` |
| `organization.executives.commercialManager` | `RegisterOrganizationExecutiveContactDto` | No | — | `@IsNotEmptyObject()` `@ValidateNested()` `@Type(() => RegisterOrganizationExecutiveContactDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:373` |
| `organization.executives.commercialManager.name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationExecutiveContactDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:132` |
| `organization.executives.commercialManager.middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:141` |
| `organization.executives.commercialManager.lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationExecutiveContactDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:154` |
| `organization.executives.commercialManager.motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:163` |
| `organization.executives.commercialManager.fullName` | `string` | No | longitud mínima 3; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(3)` `@MaxLength(200)` | Nombre completo del ejecutivo (forma anterior; preferí name/lastName) | `src/modules/iam/presentation/dto/register-organization.dto.ts:182` |
| `organization.executives.commercialManager.phone` | `string` | No | longitud mínima 7; longitud máxima 30 | `@IsString()` `@MinLength(7)` `@MaxLength(30)` | Teléfono celular de contacto | `src/modules/iam/presentation/dto/register-organization.dto.ts:199` |
| `organization.executives.commercialManager.email` | `string` | No | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Correo electrónico corporativo | `src/modules/iam/presentation/dto/register-organization.dto.ts:212` |
| `organization.executives.marketingManager` | `RegisterOrganizationExecutiveContactDto` | No | — | `@IsNotEmptyObject()` `@ValidateNested()` `@Type(() => RegisterOrganizationExecutiveContactDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:382` |
| `organization.executives.marketingManager.name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationExecutiveContactDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:132` |
| `organization.executives.marketingManager.middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:141` |
| `organization.executives.marketingManager.lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationExecutiveContactDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:154` |
| `organization.executives.marketingManager.motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:163` |
| `organization.executives.marketingManager.fullName` | `string` | No | longitud mínima 3; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(3)` `@MaxLength(200)` | Nombre completo del ejecutivo (forma anterior; preferí name/lastName) | `src/modules/iam/presentation/dto/register-organization.dto.ts:182` |
| `organization.executives.marketingManager.phone` | `string` | No | longitud mínima 7; longitud máxima 30 | `@IsString()` `@MinLength(7)` `@MaxLength(30)` | Teléfono celular de contacto | `src/modules/iam/presentation/dto/register-organization.dto.ts:199` |
| `organization.executives.marketingManager.email` | `string` | No | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Correo electrónico corporativo | `src/modules/iam/presentation/dto/register-organization.dto.ts:212` |
| `organization.payer` | `PayerProfileDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => PayerProfileDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:571` |
| `organization.payer.carrierCode` | `string` | No | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | Código de la aseguradora | `src/modules/directory/dto/tenant-type-profile.dto.ts:37` |
| `organization.payer.sigla` | `string` | No | longitud mínima 1; longitud máxima 20 | `@IsString()` `@MinLength(1)` `@MaxLength(20)` | Sigla de la aseguradora | `src/modules/directory/dto/tenant-type-profile.dto.ts:50` |
| `organization.payer.address` | `string` | No | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Dirección de la aseguradora | `src/modules/directory/dto/tenant-type-profile.dto.ts:59` |
| `organization.payer.latitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: PayerProfileDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | Latitud de la casa matriz (-90 a 90); va junto con longitude o no va | `src/modules/directory/dto/tenant-type-profile.dto.ts:85` |
| `organization.payer.longitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: PayerProfileDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | Longitud de la casa matriz (-180 a 180); va junto con latitude o no va | `src/modules/directory/dto/tenant-type-profile.dto.ts:102` |
| `organization.payer.regulatorIdentifier` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Identificador ante el regulador de seguros | `src/modules/directory/dto/tenant-type-profile.dto.ts:114` |
| `organization.payer.jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/directory/dto/tenant-type-profile.dto.ts:122` |
| `organization.broker` | `BrokerProfileDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => BrokerProfileDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:580` |
| `organization.broker.id` | `string` | No | formato uuid | — | — | sin fuente |
| `organization.broker.brokerCode` | `string` | No | — | — | — | sin fuente |
| `organization.broker.legalName` | `string` | No | — | — | — | sin fuente |
| `organization.broker.licenseNumber` | `string` | No | admite null | — | — | sin fuente |
| `organization.broker.jurisdiction` | `InsuranceConceptDto` | No | admite null | — | — | sin fuente |
| `organization.broker.jurisdiction.code` | `string` | No | — | — | — | sin fuente |
| `organization.broker.jurisdiction.display` | `string` | No | — | — | — | sin fuente |
| `organization.broker.status` | `InsuranceConceptDto` | No | — | — | — | sin fuente |
| `organization.broker.status.code` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `organization.broker.status.display` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `organization.broker.verification` | `InsuranceConceptDto` | No | — | — | — | sin fuente |
| `organization.broker.verification.code` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `organization.broker.verification.display` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `organization.broker.independent` | `boolean` | No | — | — | — | sin fuente |
| `organization.broker.currentCarrierCount` | `number` | No | — | — | — | sin fuente |
| `organization.broker.createdAt` | `string` | No | formato date-time | — | — | sin fuente |
| `organization.broker.agreements` | `array<BrokerAgreementDto>` | No | — | — | — | sin fuente |
| `organization.broker.agreements[].id` | `string` | No | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:314` |
| `organization.broker.agreements[].insuranceCarrierId` | `string` | No | formato uuid | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:318` |
| `organization.broker.agreements[].carrierLegalName` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:322` |
| `organization.broker.agreements[].agreementCode` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:326` |
| `organization.broker.agreements[].commissionModel` | `InsuranceConceptDto` | No | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:330` |
| `organization.broker.agreements[].commissionModel.code` | `string` | No | — | — | — | sin fuente |
| `organization.broker.agreements[].commissionModel.display` | `string` | No | — | — | — | sin fuente |
| `organization.broker.agreements[].effectiveFrom` | `string` | No | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:334` |
| `organization.broker.agreements[].effectiveTo` | `string` | No | admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:338` |
| `organization.broker.agreements[].status` | `InsuranceConceptDto` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:342` |
| `organization.broker.agreements[].status.code` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:14` |
| `organization.broker.agreements[].status.display` | `string` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:18` |
| `organization.broker.agreements[].current` | `boolean` | No | — | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:353` |
| `organization.broker.agreements[].contractFileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/insurance/presentation/dto/read.dto.ts:357` |
| `organization.broker.publicProfileId` | `string` | No | formato uuid; admite null | — | — | sin fuente |
| `organization.diagnosticUnit` | `DiagnosticUnitProfileDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => DiagnosticUnitProfileDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:591` |
| `organization.diagnosticUnit.code` | `string` | No | longitud mínima 3; longitud máxima 100; patrón runtime /^[A-Za-z0-9._-]+$/ | `@IsOptional()` `@IsString()` `@MinLength(3)` `@MaxLength(100)` `@Matches(/^[A-Za-z0-9._-]+$/, { message: 'El código sólo admite letras, dígitos, punto, guion y guion bajo', })` | — | `src/modules/directory/dto/tenant-type-profile.dto.ts:226` |
| `organization.diagnosticUnit.name` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/modules/directory/dto/tenant-type-profile.dto.ts:239` |
| `organization.diagnosticUnit.diagnosticUnitTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/directory/dto/tenant-type-profile.dto.ts:250` |
| `organization.diagnosticUnit.modalityConceptIds` | `array<string>` | No | formato uuid; máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayUnique()` `@ArrayMaxSize(20)` `@IsUUID(undefined, { each: true })` | — | `src/modules/directory/dto/tenant-type-profile.dto.ts:263` |
| `organization.diagnosticUnit.walkInAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/directory/dto/tenant-type-profile.dto.ts:271` |
| `organization.diagnosticUnit.homeCollectionAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/directory/dto/tenant-type-profile.dto.ts:279` |
| `organization.diagnosticUnit.primarySite` | `DiagnosticUnitPrimarySiteDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => DiagnosticUnitPrimarySiteDto)` | — | `src/modules/directory/dto/tenant-type-profile.dto.ts:289` |
| `organization.diagnosticUnit.primarySite.name` | `string` | No | longitud mínima 2; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(2)` `@MaxLength(200)` | — | `src/modules/directory/dto/tenant-type-profile.dto.ts:182` |
| `organization.diagnosticUnit.primarySite.timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/directory/dto/tenant-type-profile.dto.ts:191` |
| `organization.diagnosticUnit.primarySite.address` | `OwnSiteAddressDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => OwnSiteAddressDto)` | — | `src/modules/directory/dto/tenant-type-profile.dto.ts:200` |
| `organization.diagnosticUnit.primarySite.address.lines` | `array<string>` | No | longitud máxima 500 | `@IsArray()` `@IsString({ each: true })` `@MaxLength(500, { each: true })` | Líneas de la dirección; puede ir vacía si la sede se ubica sólo por municipio o coordenadas | `src/modules/practice/dto/create-own-site.dto.ts:44` |
| `organization.diagnosticUnit.primarySite.address.city` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/practice/dto/create-own-site.dto.ts:51` |
| `organization.diagnosticUnit.primarySite.address.municipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/practice/dto/create-own-site.dto.ts:57` |
| `organization.diagnosticUnit.primarySite.address.administrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/practice/dto/create-own-site.dto.ts:63` |
| `organization.diagnosticUnit.primarySite.address.latitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/practice/dto/create-own-site.dto.ts:84` |
| `organization.diagnosticUnit.primarySite.address.longitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/practice/dto/create-own-site.dto.ts:95` |
| `organization.countryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:599` |
| `organization.jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:607` |
| `organization.timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA | `src/modules/iam/presentation/dto/register-organization.dto.ts:620` |
| `organization.pharmacy` | `RegisterPharmacyBlockDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => RegisterPharmacyBlockDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:627` |
| `organization.pharmacy.latitude` | `number` | No | — | `@IsOptional()` `@IsLatitude()` | Latitud de la casa central | `src/modules/iam/presentation/dto/register-organization.dto.ts:425` |
| `organization.pharmacy.longitude` | `number` | No | — | `@IsOptional()` `@IsLongitude()` | Longitud de la casa central | `src/modules/iam/presentation/dto/register-organization.dto.ts:430` |
| `organization.pharmacy.branches` | `array<RegisterPharmacyBranchDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => RegisterPharmacyBranchDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:437` |
| `organization.pharmacy.branches[].name` | `string` | No | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Nombre de la sucursal | `src/modules/iam/presentation/dto/register-organization.dto.ts:391` |
| `organization.pharmacy.branches[].latitude` | `number` | No | — | `@IsOptional()` `@IsLatitude()` | Latitud | `src/modules/iam/presentation/dto/register-organization.dto.ts:396` |
| `organization.pharmacy.branches[].longitude` | `number` | No | — | `@IsOptional()` `@IsLongitude()` | Longitud | `src/modules/iam/presentation/dto/register-organization.dto.ts:401` |
| `organization.pharmacy.branches[].description` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Descripción | `src/modules/iam/presentation/dto/register-organization.dto.ts:407` |
| `organization.pharmacy.branches[].locationUrl` | `string` | No | longitud máxima 2000; patrón runtime /^https?:\/\//i | `@IsOptional()` `@IsString()` `@MaxLength(2000)` `@Matches(/^https?:\/\//i, { message: 'locationUrl debe ser http o https' })` | Enlace de ubicación (http/https) | `src/modules/iam/presentation/dto/register-organization.dto.ts:417` |
| `owner` | `RegisterOrganizationOwnerDto` | Sí | — | `@IsNotEmptyObject()` `@ValidateNested()` `@Type(() => RegisterOrganizationOwnerDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:757` |
| `owner.email` | `string` | Sí | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Correo con el que el owner iniciará sesión | `src/modules/iam/presentation/dto/register-organization.dto.ts:648` |
| `owner.password` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:657` |
| `owner.name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationOwnerDto) => dto.displayName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:672` |
| `owner.middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:681` |
| `owner.lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationOwnerDto) => dto.displayName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:693` |
| `owner.motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:702` |
| `owner.displayName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Forma anterior de declarar el nombre. Preferí name/lastName. | `src/modules/iam/presentation/dto/register-organization.dto.ts:721` |
| `owner.timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:730` |

**Payload mínimo** (sólo los obligatorios):

```json
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

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "organization": {
    "code": "CLINICA_SAN_RAFAEL",
    "legalName": "Nombre de ejemplo",
    "tradeName": "Nombre de ejemplo",
    "tenantType": "HOSPITAL",
    "legalEntityType": "SRL",
    "legalDocuments": {
      "constitutionFileId": "00000000-0000-4000-8000-000000000001",
      "taxIdentifierFileId": "00000000-0000-4000-8000-000000000001",
      "commerceRegistryFileId": "00000000-0000-4000-8000-000000000001",
      "operatingLicenseFileId": "00000000-0000-4000-8000-000000000001",
      "healthAuthorityCertificateFileId": "00000000-0000-4000-8000-000000000001"
    },
    "legalRepresentative": {
      "name": "Mariana",
      "middleName": "Elena",
      "lastName": "Siles",
      "motherLastName": "Justiniano",
      "fullName": "Mariana Siles Justiniano",
      "idNumber": "4872190 SC",
      "email": "legal@aseguradora.com",
      "phone": "+591 70012345",
      "powerOfAttorneyFileId": "00000000-0000-4000-8000-000000000001"
    },
    "executives": {
      "generalManager": {
        "name": "Carlos",
        "middleName": "Eduardo",
        "lastName": "Mendoza",
        "motherLastName": "Rivero",
        "fullName": "Carlos Mendoza Rivero",
        "phone": "+591 70012345",
        "email": "cmendoza@aseguradora.com"
      },
      "commercialManager": {
        "name": "Carlos",
        "middleName": "Eduardo",
        "lastName": "Mendoza",
        "motherLastName": "Rivero",
        "fullName": "Carlos Mendoza Rivero",
        "phone": "+591 70012345",
        "email": "cmendoza@aseguradora.com"
      },
      "marketingManager": {
        "name": "Carlos",
        "middleName": "Eduardo",
        "lastName": "Mendoza",
        "motherLastName": "Rivero",
        "fullName": "Carlos Mendoza Rivero",
        "phone": "+591 70012345",
        "email": "cmendoza@aseguradora.com"
      }
    },
    "payer": {
      "carrierCode": "CODIGO_EJEMPLO",
      "sigla": "BUPA",
      "address": "valor-ejemplo",
      "latitude": -17.7833,
      "longitude": -63.1821,
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
    "diagnosticUnit": {
      "code": "CENTRO_IMAGEN_CENTRAL",
      "name": "Centro de Diagnóstico por Imágenes",
      "diagnosticUnitTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "modalityConceptIds": [
        "00000000-0000-4000-8000-000000000001"
      ],
      "walkInAvailable": true,
      "homeCollectionAvailable": false,
      "primarySite": {
        "name": "Sede central",
        "timeZone": "America/La_Paz",
        "address": {
          "lines": [
            "valor-ejemplo"
          ],
          "city": "valor-ejemplo",
          "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
          "administrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
          "latitude": 1,
          "longitude": 1
        }
      }
    },
    "countryConceptId": "00000000-0000-4000-8000-000000000001",
    "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
    "timeZone": "America/La_Paz",
    "pharmacy": {
      "latitude": 1,
      "longitude": 1,
      "branches": [
        {
          "name": "Nombre de ejemplo",
          "latitude": -17.769,
          "longitude": -63.196,
          "description": "Texto descriptivo de ejemplo",
          "locationUrl": "valor-ejemplo"
        }
      ]
    }
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

</details>

### Respuesta — `Promise<RegisterOrganizationResponseDto>` · DTO `RegisterOrganizationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | — | Identificador del tenant creado. | `src/modules/iam/presentation/dto/register-organization.dto.ts:766` |
| `code` | `string` | Sí | — | — | Código único de la organización, tal como quedó persistido. | `src/modules/iam/presentation/dto/register-organization.dto.ts:772` |
| `ownerUserId` | `string` | Sí | formato uuid | — | Identificador de la cuenta owner creada. | `src/modules/iam/presentation/dto/register-organization.dto.ts:778` |
| `membershipId` | `string` | Sí | formato uuid | — | Identificador de la membresía OWNER que vincula cuenta y organización. | `src/modules/iam/presentation/dto/register-organization.dto.ts:784` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del tenant (pendiente de verificación) | `src/modules/iam/presentation/dto/register-organization.dto.ts:793` |
| `emailVerificationSent` | `boolean` | Sí | — | — | Si se pudo encolar el correo de verificación | `src/modules/iam/presentation/dto/register-organization.dto.ts:801` |
| `diagnosticUnitId` | `string` | No | formato uuid | — | Id de la unidad diagnóstica creada (sólo DIAGNOSTIC_CENTER) | `src/modules/iam/presentation/dto/register-organization.dto.ts:811` |
| `legalDocumentsRegistered` | `number` | No | — | — | Cuántos documentos legales quedaron registrados pendientes de | `src/modules/iam/presentation/dto/register-organization.dto.ts:822` |
| `representativesRegistered` | `number` | No | — | — | Vínculos de representación registrados (representante legal + gerencias) | `src/modules/iam/presentation/dto/register-organization.dto.ts:835` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 409 | `CONFLICT` | ConflictException: El código de organización ya existe; ConflictException: Ya existe una cuenta con ese correo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un tenant de tipo PAYER exige el bloque `payer`; PreconditionFailedException: Un tenant de tipo BROKER exige el bloque `broker`; PreconditionFailedException: Un tenant de tipo {tenantType} exige país y jurisdicción; PreconditionFailedException: El tipo societario pertenece al derecho de {entry!.countryIso} y no coincide con el país declarado; PreconditionFailedException: El bloque `payer` sólo corresponde a un tenant de tipo PAYER; PreconditionFailedException: El bloque `broker` sólo corresponde a un tenant de tipo BROKER; PreconditionFailedException: El bloque `diagnosticUnit` sólo corresponde a un tenant de tipo DIAGNOSTIC_CENTER; PreconditionFailedException: El tipo de unidad diagnóstica declarado no es válido; PreconditionFailedException: Alguna modalidad declarada no pertenece al catálogo de modalidades diagnósticas; PreconditionFailedException: Los conceptos declarados no existen en el catálogo de terminología; PreconditionFailedException: Un mismo archivo no puede respaldar dos documentos distintos; PreconditionFailedException: El documento {label} ya está vinculado a una organización; PreconditionFailedException: La notificación necesita destinatario interno o dirección de destino; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/admin-listados.int-spec.ts:55` |
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:73` |
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:99` |
| INTEGRACION | `test/integration/hardening/mch-001.int-spec.ts:54` |
| INTEGRACION | `test/integration/hardening/mch-034.int-spec.ts:39` |
| INTEGRACION | `test/integration/imaging-center-registration.int-spec.ts:53` |
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:46` |
| INTEGRACION | `test/integration/insurance-plan-administration.int-spec.ts:36` |
| INTEGRACION | `test/integration/insurer-patients.int-spec.ts:44` |
| INTEGRACION | `test/integration/lab-reception-inbox.int-spec.ts:52` |
| INTEGRACION | `test/integration/organization-headquarters-location.int-spec.ts:141` |
| INTEGRACION | `test/integration/organization-legal-documents.int-spec.ts:97` |
| INTEGRACION | `test/integration/organization-legal-entity-type.int-spec.ts:46` |
| INTEGRACION | `test/integration/organization-legal-representative.int-spec.ts:150` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:139` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /iam/auth/register-patient

- **Origen:** CONTRATO
- **Nombre:** Registrarse como paciente con documento de identidad
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.registerPatient` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:109`

### Qué es y para qué sirve (negocio)

Registrarse como paciente con documento de identidad. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/register-patient` la atiende `IamAuthController.registerPatient` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:109). Es una ruta pública: no exige token. Valida el cuerpo como `RegisterPatientDto` (35 campos, 8 obligatorios). Delega en `IamPatientSelfRegistrationService.registerPatient`. Crea filas en common.contact_points, common.identifiers, directory.tenant_memberships, iam.authentication_credentials, iam.email_verifications, iam.security_events, iam.user_global_roles, iam.users y 5 más. Lee iam.authentication_credentials, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:109` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:109` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:198` |
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:131` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → CredentialsRepository.createPassword | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:280` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:197` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → EmailVerificationsRepository.create | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:41` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → UserGlobalRolesRepository.create | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → UsersRepository.create | `src/modules/iam/infrastructure/repositories/users.repository.ts:49` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IamPatientSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IamPatientSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IamPatientSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IamPatientSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IamPatientSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.patient_profiles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → PatientProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:220` |
| `profiles.person_account_links` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → PersonAccountLinksRepository.create | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:50` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → PersonProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → PersonsRepository.create | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:119` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Cuerpo — DTO `RegisterPatientDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nationalId` | `string` | Sí | longitud mínima 4; longitud máxima 40; patrón runtime /^[A-Za-z0-9.-]+$/ | `@IsString()` `@MinLength(4)` `@MaxLength(40)` `@Matches(/^[A-Za-z0-9.-]+$/, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Documento de identidad con el que se iniciará sesión | `src/modules/iam/presentation/dto/register-patient.dto.ts:99` |
| `issuerAdministrativeAreaConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `src/modules/iam/presentation/dto/register-patient.dto.ts:117` |
| `residenceMunicipalityConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `src/modules/iam/presentation/dto/register-patient.dto.ts:140` |
| `password` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:149` |
| `name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPatientDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:165` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:177` |
| `lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPatientDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:190` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:202` |
| `displayName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Forma anterior de declarar el nombre. Preferí name/lastName. | `src/modules/iam/presentation/dto/register-patient.dto.ts:221` |
| `email` | `string` | Sí | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:245` |
| `birthDate` | `string` | Sí | formato date | `@IsISO8601()` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:256` |
| `phone` | `string` | Sí | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsString()` `@MaxLength(PHONE_MAX_LENGTH)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres | `src/modules/iam/presentation/dto/register-patient.dto.ts:277` |
| `occupationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ocupación del catálogo (VS_BO_OCCUPATION) | `src/modules/iam/presentation/dto/register-patient.dto.ts:295` |
| `occupationFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(OCCUPATION_FREE_TEXT_MAX_LENGTH)` | Ocupación en texto libre, para cuando no está en el catálogo | `src/modules/iam/presentation/dto/register-patient.dto.ts:308` |
| `workEmployerConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/iam/presentation/dto/register-patient.dto.ts:326` |
| `workEmployerFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(EMPLOYER_FREE_TEXT_MAX_LENGTH)` | Empresa en texto libre, para cuando no está en el catálogo | `src/modules/iam/presentation/dto/register-patient.dto.ts:344` |
| `gender` | `string` | No | valores: MALE, FEMALE, OTHER, UNKNOWN | `@IsOptional()` `@IsIn(ADMIN_GENDER_CODES)` | Género administrativo (HL7 AdministrativeGender) | `src/modules/iam/presentation/dto/register-patient.dto.ts:355` |
| `sexAtBirth` | `string` | Sí | valores: MALE, FEMALE, INTERSEX, UNKNOWN | `@IsIn(BIRTH_SEX_CODES)` | Sexo asignado al nacer | `src/modules/iam/presentation/dto/register-patient.dto.ts:373` |
| `administrativeGenderConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:382` |
| `sexAtBirthConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:391` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:400` |
| `homeAddressLines` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Calle y número del domicilio | `src/modules/iam/presentation/dto/register-patient.dto.ts:416` |
| `homeLatitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: RegisterPatientDto) => dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:433` |
| `homeLongitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: RegisterPatientDto) => dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:444` |
| `workMunicipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Municipio del trabajo (catálogo VS_BO_MUNICIPALITY) | `src/modules/iam/presentation/dto/register-patient.dto.ts:458` |
| `workAddressLines` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Calle y número del lugar de trabajo | `src/modules/iam/presentation/dto/register-patient.dto.ts:469` |
| `workLatitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: RegisterPatientDto) => dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:480` |
| `workLongitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: RegisterPatientDto) => dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:491` |
| `guardianName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre del tutor o persona autorizada | `src/modules/iam/presentation/dto/register-patient.dto.ts:507` |
| `guardianPhone` | `string` | No | longitud máxima 40; patrón runtime /^[+]?[0-9 ()-]{6,}$/ | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(/^[+]?[0-9 ()-]{6,}$/, { message: 'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion', })` | Teléfono del tutor, en formato E.164 o nacional | `src/modules/iam/presentation/dto/register-patient.dto.ts:525` |
| `guardianRelationshipConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Parentesco del contacto de emergencia (conjunto related-person-relationship) | `src/modules/iam/presentation/dto/register-patient.dto.ts:549` |
| `privateInsurancePlanId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Plan de la aseguradora privada declarada | `src/modules/iam/presentation/dto/register-patient.dto.ts:564` |
| `publicInsurancePlanId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Plan del seguro público declarado | `src/modules/iam/presentation/dto/register-patient.dto.ts:575` |
| `billingTaxId` | `string` | No | longitud máxima 20; patrón runtime /^[0-9]{4,20}$/ | `@IsOptional()` `@IsString()` `@Matches(/^[0-9]{4,20}$/, { message: 'El NIT sólo admite dígitos', })` | NIT para facturación (sólo el número) | `src/modules/iam/presentation/dto/register-patient.dto.ts:592` |
| `billingLegalName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200, { message: 'La razón social no puede exceder 200 caracteres', })` | Nombre o Razón Social para facturación | `src/modules/iam/presentation/dto/register-patient.dto.ts:606` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "password": "ClaveSegura2026!",
  "email": "usuario@example.com",
  "birthDate": "2026-07-31",
  "phone": "+59170000000",
  "sexAtBirth": "MALE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
  "gender": "MALE",
  "sexAtBirth": "MALE",
  "administrativeGenderConceptId": "00000000-0000-4000-8000-000000000001",
  "sexAtBirthConceptId": "00000000-0000-4000-8000-000000000001",
  "timeZone": "America/La_Paz",
  "homeAddressLines": "valor-ejemplo",
  "homeLatitude": 1,
  "homeLongitude": 1,
  "workMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "workAddressLines": "valor-ejemplo",
  "workLatitude": 1,
  "workLongitude": 1,
  "guardianName": "Nombre de ejemplo",
  "guardianPhone": "+59170000000",
  "guardianRelationshipConceptId": "00000000-0000-4000-8000-000000000001",
  "privateInsurancePlanId": "00000000-0000-4000-8000-000000000001",
  "publicInsurancePlanId": "00000000-0000-4000-8000-000000000001",
  "billingTaxId": "00000000-0000-4000-8000-000000000001",
  "billingLegalName": "Nombre de ejemplo"
}
```

</details>

### Respuesta — `Promise<RegisterPatientResponseDto>` · DTO `RegisterPatientResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/iam/presentation/dto/register-patient.dto.ts:615` |
| `personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/iam/presentation/dto/register-patient.dto.ts:621` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/iam/presentation/dto/register-patient.dto.ts:627` |
| `patientCode` | `string` | Sí | — | — | Código de paciente generado para el perfil. | `src/modules/iam/presentation/dto/register-patient.dto.ts:633` |
| `emailVerificationSent` | `boolean` | Sí | — | — | Si se encoló el correo de verificación. La cuenta es usable igual. | `src/modules/iam/presentation/dto/register-patient.dto.ts:642` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe una cuenta con ese documento de identidad |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo de departamentos no está disponible; PreconditionFailedException: El departamento no pertenece al catálogo de departamentos de Bolivia; PreconditionFailedException: La notificación necesita destinatario interno o dirección de destino; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/br14-encuentros-seguridad-clinica.int-spec.ts:72` |
| INTEGRACION | `test/integration/clinical-c14-c23-notas-e-internacion.int-spec.ts:58` |
| INTEGRACION | `test/integration/clinical-prescriptions-pdf.int-spec.ts:69` |
| INTEGRACION | `test/integration/community-realtime-chat.int-spec.ts:124` |
| INTEGRACION | `test/integration/dependent-link-requests.int-spec.ts:59` |
| INTEGRACION | `test/integration/diagnostics-release.int-spec.ts:51` |
| INTEGRACION | `test/integration/fx12-check-in-idempotente-por-cita.int-spec.ts:67` |
| INTEGRACION | `test/integration/fx13-encuentro-en-la-reserva.int-spec.ts:160` |
| INTEGRACION | `test/integration/fx16-dependientes-y-tutor-legal.int-spec.ts:68` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:122` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:103` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:83` |
| INTEGRACION | `test/integration/fx9-carreras-de-la-agenda.int-spec.ts:120` |
| INTEGRACION | `test/integration/hardening/mch-001.int-spec.ts:89` |
| INTEGRACION | `test/integration/hardening/mch-004.int-spec.ts:41` |
| INTEGRACION | `test/integration/hardening/mch-005.int-spec.ts:40` |
| INTEGRACION | `test/integration/identity-verification-self-service.int-spec.ts:61` |
| INTEGRACION | `test/integration/insurance-portability.int-spec.ts:51` |
| INTEGRACION | `test/integration/issuer-administrative-area.int-spec.ts:50` |
| INTEGRACION | `test/integration/lab-reception-inbox.int-spec.ts:135` |
| INTEGRACION | `test/integration/patient-access-revocation.int-spec.ts:40` |
| INTEGRACION | `test/integration/patient-diagnostic-orders.int-spec.ts:56` |
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:45` |
| INTEGRACION | `test/integration/quitar-punto-del-mapa.int-spec.ts:78` |
| INTEGRACION | `test/integration/tj1-onboarding-medico.int-spec.ts:237` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:130` |
| INTEGRACION | `test/integration/virtual-encounter-auth.int-spec.ts:75` |
| INTEGRACION | `test/integration/waitlist-cupo-liberado.int-spec.ts:108` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:122` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /iam/auth/register-practitioner

- **Origen:** CONTRATO
- **Nombre:** Registrarse como profesional de salud con su matrícula
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.registerPractitioner` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:233`

### Qué es y para qué sirve (negocio)

Registrarse como profesional de salud con su matrícula. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/register-practitioner` la atiende `IamAuthController.registerPractitioner` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:233). Es una ruta pública: no exige token. Valida el cuerpo como `RegisterPractitionerDto` (65 campos, 5 obligatorios). Delega en `IamPractitionerSelfRegistrationService.registerPractitioner`. Crea filas en authz.user_role_assignments, common.addresses, common.contact_points, common.file_versions, common.files, common.identifiers, directory.tenant_memberships, iam.account_activations y 18 más. Actualiza common.files, messaging.queued_jobs. Lee authz.roles, authz.user_role_assignments, common.file_versions, common.files, iam.authentication_credentials, messaging.message_channels, messaging.message_queues, messaging.message_templates y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:233` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:233` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzEffectiveRolesService.ensureRoleByCode | `src/modules/authz/services/authz-effective-roles.service.ts:139` |
| `authz.user_role_assignments` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.create | `src/modules/authz/repositories/user-role-assignments.repository.ts:123` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.findActive | `src/modules/authz/repositories/user-role-assignments.repository.ts:73` |
| `common.addresses` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → OwnSiteProvisioningService.provision → AddressesRepository.create | `src/modules/common/repositories/addresses.repository.ts:118` |
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:198` |
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → FileUploadService.uploadAnonymous → FilesService.createFile → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:142` |
| `common.file_versions` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → FileUploadService.uploadAnonymous → FilesService.createFile → FilesRepository.create | `src/modules/common/repositories/files.repository.ts:52` |
| `common.files` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AttachableFileService.claimAnonymousUpload | `src/modules/common/services/attachable-file.service.ts:270` |
| `common.files` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:182` |
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:131` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `iam.account_activations` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AccountActivationsRepository.create | `src/modules/iam/infrastructure/repositories/account-activations.repository.ts:46` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CredentialsRepository.createPendingPassword | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:262` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:197` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → EmailVerificationsRepository.create | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:41` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → UserGlobalRolesRepository.create | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → UsersRepository.create | `src/modules/iam/infrastructure/repositories/users.repository.ts:49` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:77` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:101` |
| `messaging.queued_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.reuse → StorageLifecycleCoordinator.change | `src/common/storage/storage-lifecycle-coordinator.service.ts:651` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → OwnSiteProvisioningService.provision → PracticeSitesRepository.create | `src/modules/practice/repositories/practice-sites.repository.ts:111` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → OwnSiteProvisioningService.provision → OwnSiteProvisioningService.uniqueSiteCode → PracticeSitesRepository.findByPracticeAndCode | `src/modules/practice/repositories/practice-sites.repository.ts:85` |
| `practice.practices` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → OwnSiteProvisioningService.provision → PracticesRepository.create | `src/modules/practice/repositories/practices.repository.ts:130` |
| `practice.practices` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → OwnSiteProvisioningService.provision → PracticesRepository.findOwnOffice | `src/modules/practice/repositories/practices.repository.ts:115` |
| `practice.practitioner_role_assignments` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → OwnSiteProvisioningService.provision → PractitionerRoleAssignmentsRepository.create | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:259` |
| `profiles.health_practitioner_profiles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → HealthPractitionerProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:161` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → HealthPractitionerProfilesRepository.findByCode | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:79` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → JurisdictionAuthorizationsRepository.create | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:114` |
| `profiles.person_account_links` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PersonAccountLinksRepository.create | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:50` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PersonProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PersonsRepository.create | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:119` |
| `profiles.practitioner_languages` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PractitionerLanguagesRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-languages.repository.ts:62` |
| `profiles.practitioner_specialties` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PractitionerSpecialtiesRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:61` |
| `profiles.professional_credentials` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfessionalCredentialsRepository.create | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:122` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Cuerpo — DTO `RegisterPractitionerDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `email` | `string` | Sí | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Correo de acceso del profesional | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:74` |
| `personalEmail` | `string` | No | formato email; longitud máxima 320 | `@IsOptional()` `@IsEmail()` `@MaxLength(320)` | Correo personal; no sirve para iniciar sesión | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:89` |
| `workEmail` | `string` | No | formato email; longitud máxima 320 | `@IsOptional()` `@IsEmail()` `@MaxLength(320)` | Correo de trabajo, distinto del correo de acceso | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:100` |
| `password` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:109` |
| `name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPractitionerDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:122` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:131` |
| `lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPractitionerDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:141` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:150` |
| `displayName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Forma anterior de declarar el nombre. Preferí name/lastName. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:169` |
| `licenseNumber` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Número de licencia o matrícula profesional | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:181` |
| `credentialNumber` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Número del título profesional que respalda la licencia | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:202` |
| `sedesLicenseNumber` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Número de registro del SEDES departamental | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:223` |
| `regulatoryAuthority` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Autoridad reguladora que emitió la licencia | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:235` |
| `licenseIssueDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | Fecha de inscripción de la matrícula (ISO) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:248` |
| `professionalTitle` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:257` |
| `specialtyConceptIds` | `array<string>` | No | formato uuid; máximo 4 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(4)` `@IsUUID(undefined, { each: true })` | Especialidades declaradas (una principal y hasta tres adicionales). | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:283` |
| `nationalId` | `string` | Sí | longitud máxima 40; patrón runtime /^[A-Za-z0-9.-]+$/ | `@IsString()` `@MaxLength(40)` `@Matches(/^[A-Za-z0-9.-]+$/, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Documento de identidad obligatorio; se guarda como identificador oficial | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:296` |
| `issuerAdministrativeAreaConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:318` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:339` |
| `homeAddressLines` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Calle y número del domicilio particular | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:356` |
| `homeLatitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:375` |
| `homeLongitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:386` |
| `workAddressLines` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Calle y número de la dirección laboral | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:397` |
| `workLatitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:408` |
| `workLongitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:419` |
| `phone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Forma anterior de declarar el teléfono del trabajo. Preferí workLandline o workMobilePhone. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:441` |
| `mobilePhone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Celular personal en formato E.164 o nacional | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:454` |
| `workMobilePhone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Celular de trabajo en formato E.164 o nacional | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:467` |
| `workLandline` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Teléfono fijo del lugar de trabajo | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:480` |
| `birthDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:488` |
| `gender` | `string` | No | valores: MALE, FEMALE, OTHER, UNKNOWN | `@IsOptional()` `@IsIn(ADMIN_GENDER_CODES)` | Género administrativo (HL7 AdministrativeGender) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:499` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | `@IsOptional()` `@IsIn(BIRTH_SEX_CODES)` | Sexo asignado al nacer | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:510` |
| `practitionerCategoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:519` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:527` |
| `credentialTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:535` |
| `languageConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:543` |
| `acceptsNewPatients` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:552` |
| `occupationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ocupación del catálogo (VS_BO_OCCUPATION) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:563` |
| `occupationFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(OCCUPATION_FREE_TEXT_MAX_LENGTH)` | Ocupación en texto libre, para cuando no está en el catálogo | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:576` |
| `workEmployerConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:587` |
| `workEmployerFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(EMPLOYER_FREE_TEXT_MAX_LENGTH)` | Empresa en texto libre, para cuando no está en el catálogo | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:601` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:610` |
| `profilePhotoBase64` | `string` | No | — | `@IsOptional()` `@IsString()` | Foto de perfil en formato Base64 (Data URI o base64 plano) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:620` |
| `signatureFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:626` |
| `sealFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:632` |
| `ownSite` | `CreateOwnSiteDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => CreateOwnSiteDto)` | Consultorio propio a dar de alta en la misma transacción (ALV-005/006 · P20). Mismo contrato que POST /practitioners/me/sites | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:655` |
| `ownSite.name` | `string` | No | longitud máxima 200 | — | Nombre del consultorio | sin fuente |
| `ownSite.timeZone` | `string` | No | — | — | — | sin fuente |
| `ownSite.address` | `OwnSiteAddressDto` | No | — | — | — | sin fuente |
| `ownSite.address.lines` | `array<string>` | No | longitud máxima 500 | `@IsArray()` `@IsString({ each: true })` `@MaxLength(500, { each: true })` | Líneas de la dirección; puede ir vacía si la sede se ubica sólo por municipio o coordenadas | `src/modules/practice/dto/create-own-site.dto.ts:44` |
| `ownSite.address.city` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/practice/dto/create-own-site.dto.ts:51` |
| `ownSite.address.municipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/practice/dto/create-own-site.dto.ts:57` |
| `ownSite.address.administrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/practice/dto/create-own-site.dto.ts:63` |
| `ownSite.address.latitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/practice/dto/create-own-site.dto.ts:84` |
| `ownSite.address.longitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/practice/dto/create-own-site.dto.ts:95` |
| `ownSite.contactPhone` | `string` | No | longitud máxima 40 | — | — | sin fuente |
| `credentials` | `array<RegisterPractitionerCredentialDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => RegisterPractitionerCredentialDto)` | Títulos académicos declarados en el alta; cada uno crea una fila de professional_credentials. No se combina con credentialNumber. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:682` |
| `credentials[].credentialTypeConceptId` | `string` | No | formato uuid | `@IsUUID()` | Concept id del tipo de credencial (título universitario, diplomado, maestría, doctorado o título de especialidad) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:707` |
| `credentials[].number` | `string` | No | longitud máxima 100; patrón runtime /\S/ | `@IsString()` `@Matches(/\S/, { message: 'number no puede estar vacío' })` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:722` |
| `credentials[].issuingInstitutionText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:734` |
| `credentials[].issuingCityText` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:745` |
| `credentials[].issuingCountryText` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:755` |
| `credentials[].professionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de VS_BO_PROFESSION (COB-2023) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:767` |
| `credentials[].titleText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:777` |
| `credentials[].fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | fileId del PDF subido por POST /iam/auth/upload-registration-document | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:791` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "email": "usuario@example.com",
  "password": "ClaveSegura2026!",
  "licenseNumber": "valor-ejemplo",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "email": "usuario@example.com",
  "personalEmail": "usuario@example.com",
  "workEmail": "usuario@example.com",
  "password": "ClaveSegura2026!",
  "name": "Ana",
  "middleName": "Lucía",
  "lastName": "Rojas",
  "motherLastName": "Paz",
  "displayName": "Nombre de ejemplo",
  "licenseNumber": "valor-ejemplo",
  "credentialNumber": "valor-ejemplo",
  "sedesLicenseNumber": "T.I. 538/14",
  "regulatoryAuthority": "valor-ejemplo",
  "licenseIssueDate": "2026-07-31",
  "professionalTitle": "valor-ejemplo",
  "specialtyConceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "homeAddressLines": "valor-ejemplo",
  "homeLatitude": 1,
  "homeLongitude": 1,
  "workAddressLines": "valor-ejemplo",
  "workLatitude": 1,
  "workLongitude": 1,
  "phone": "+59170000000",
  "mobilePhone": "+59170000000",
  "workMobilePhone": "+59170000000",
  "workLandline": "valor-ejemplo",
  "birthDate": "2026-07-31",
  "gender": "MALE",
  "sexAtBirth": "MALE",
  "practitionerCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "languageConceptId": "00000000-0000-4000-8000-000000000001",
  "acceptsNewPatients": false,
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
  "timeZone": "America/La_Paz",
  "profilePhotoBase64": "valor-ejemplo",
  "signatureFileId": "00000000-0000-4000-8000-000000000001",
  "sealFileId": "00000000-0000-4000-8000-000000000001",
  "ownSite": {
    "name": "Nombre de ejemplo",
    "timeZone": "America/La_Paz",
    "address": {
      "lines": [
        "valor-ejemplo"
      ],
      "city": "valor-ejemplo",
      "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
      "administrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
      "latitude": 1,
      "longitude": 1
    },
    "contactPhone": "+591 72123456"
  },
  "credentials": [
    {
      "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "number": "valor-ejemplo",
      "issuingInstitutionText": "valor-ejemplo",
      "issuingCityText": "valor-ejemplo",
      "issuingCountryText": "BO",
      "professionConceptId": "00000000-0000-4000-8000-000000000001",
      "titleText": "valor-ejemplo",
      "fileId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — `Promise<RegisterPractitionerResponseDto>` · DTO `RegisterPractitionerResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | — | Cuenta creada, con la que ya puede iniciar sesión. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:800` |
| `personId` | `string` | Sí | formato uuid | — | Persona creada para el profesional. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:806` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | Perfil profesional (comparte id con la persona). | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:812` |
| `practitionerCode` | `string` | Sí | — | — | Código interno asignado al profesional. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:818` |
| `licenseId` | `string` | Sí | formato uuid | — | Licencia registrada, pendiente de verificación por la plataforma. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:824` |
| `credentialId` | `string` | No | formato uuid | — | Credencial profesional creada, pendiente de verificación. Se devuelve porque `POST /profiles/credentials/{credentialId}/verify` —el acto que habilita al profesional a ejercer— la exige por id, y no había ninguna otra forma de obtenerla: el alta no la devolvía y `profiles` no expone ningún listado de credenciales. La verificación quedaba fuera de alcance salvo consultando la base de datos a mano. Ausente cuando el alta no declara `credentialNumber`, que dejó de ser obligatorio: sin credencial no hay id que devolver. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:839` |
| `sedesLicenseId` | `string` | No | formato uuid | — | Autorización del SEDES creada, pendiente de verificación. El equivalente de para la habilitación departamental: se devuelve para poder verificarla por id sin consultar la base. Ausente cuando el alta no declara `sedesLicenseNumber`. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:849` |
| `verificationStatus` | `string` | Sí | — | — | Estado de verificación del perfil al terminar el alta. Siempre PENDING: registrarse no habilita a ejercer. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:856` |
| `emailVerificationSent` | `boolean` | Sí | — | — | Si se pudo encolar el correo de verificación. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:862` |
| `photoFileId` | `string` | No | formato uuid | — | Identificador del archivo de foto de perfil (FK → common.files), si se subió. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:868` |
| `profilePhotoStored` | `boolean` | No | — | — | Presente sólo si el alta trajo foto: `false` cuando el almacenamiento no pudo guardarla y la cuenta se creó igual, sin foto. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:875` |
| `ownPracticeId` | `string` | No | formato uuid | — | Práctica personal creada o reutilizada para el consultorio propio. Ausente cuando el alta no declaró `ownSite`. Se devuelve por el mismo motivo que : poder referenciarla por id sin consultar la base. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:885` |
| `ownSiteId` | `string` | No | formato uuid | — | Consultorio propio creado a partir de `ownSite`. Ausente cuando el alta no lo declaró. Es el mismo id que devuelve `POST /practitioners/me/sites` y que acepta `GET /practitioners/:id/sites`. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:894` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe una cuenta con ese correo; ConflictException: El practitioner_code ya está en uso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Declare los títulos en `credentials` o el número suelto en `credentialNumber`, no los dos; PreconditionFailedException: La foto de perfil no es una imagen válida; PreconditionFailedException: No se recibió contenido en el campo "file"; PreconditionFailedException: El archivo excede el tamaño máximo permitido; PreconditionFailedException: Solo se admiten documentos PDF; PreconditionFailedException: El departamento emisor es obligatorio para el alta del profesional; PreconditionFailedException: El departamento no pertenece al catálogo de departamentos de Bolivia; PreconditionFailedException: {labels.subject} no corresponde a un archivo subido en este registro; PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso; PreconditionFailedException: La firma y el sello requieren una imagen privada de hasta 2 MB; PreconditionFailedException: Ese concepto no es un tipo de credencial profesional; PreconditionFailedException: El número del título no puede estar vacío; PreconditionFailedException: Esa profesión no está en la Clasificación de Ocupaciones de Bolivia; PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: Alguno de los roles indicados no existe o no es asignable; PreconditionFailedException: La notificación necesita destinatario interno o dirección de destino; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: FILE_NOT_LIVE; StorageLifecycleDenied: VERSION_UNKNOWN; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/br14-encuentros-seguridad-clinica.int-spec.ts:49` |
| INTEGRACION | `test/integration/clinical-c14-c23-notas-e-internacion.int-spec.ts:81` |
| INTEGRACION | `test/integration/clinical-prescriptions-pdf.int-spec.ts:93` |
| INTEGRACION | `test/integration/community-realtime-chat.int-spec.ts:92` |
| INTEGRACION | `test/integration/diagnostics-release.int-spec.ts:214` |
| INTEGRACION | `test/integration/fx1-doctor-publica-agenda.int-spec.ts:37` |
| INTEGRACION | `test/integration/fx10-mostrador-atomico.int-spec.ts:128` |
| INTEGRACION | `test/integration/fx11-notas-de-evolucion-coleccion.int-spec.ts:59` |
| INTEGRACION | `test/integration/fx12-check-in-idempotente-por-cita.int-spec.ts:122` |
| INTEGRACION | `test/integration/fx13-encuentro-en-la-reserva.int-spec.ts:64` |
| INTEGRACION | `test/integration/fx15-documentos-del-expediente.int-spec.ts:63` |
| INTEGRACION | `test/integration/fx17-sello-del-encuentro.int-spec.ts:80` |
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:152` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:100` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:82` |
| INTEGRACION | `test/integration/fx5-motivos-de-bloqueo.int-spec.ts:53` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:118` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:68` |
| INTEGRACION | `test/integration/fx9-carreras-de-la-agenda.int-spec.ts:155` |
| INTEGRACION | `test/integration/hardening/mch-034.int-spec.ts:68` |
| INTEGRACION | `test/integration/issuer-administrative-area.int-spec.ts:139` |
| INTEGRACION | `test/integration/practitioner-credential-registration-files.int-spec.ts:103` |
| INTEGRACION | `test/integration/practitioner-own-credential.int-spec.ts:26` |
| INTEGRACION | `test/integration/practitioner-own-profile.int-spec.ts:52` |
| INTEGRACION | `test/integration/practitioner-registration.int-spec.ts:115` |
| INTEGRACION | `test/integration/practitioner-signature-registration.int-spec.ts:60` |
| INTEGRACION | `test/integration/tj1-onboarding-medico.int-spec.ts:95` |
| INTEGRACION | `test/integration/virtual-encounter-auth.int-spec.ts:38` |
| INTEGRACION | `test/integration/waitlist-cupo-liberado.int-spec.ts:154` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. POST /iam/auth/resend-verification

- **Origen:** CONTRATO
- **Nombre:** Reenviar el enlace de verificación del correo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.resendVerification` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:266`

### Qué es y para qué sirve (negocio)

Reenviar el enlace de verificación del correo. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/resend-verification` la atiende `IamAuthController.resendVerification` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:266). Es una ruta pública: no exige token. Valida el cuerpo como `ResendVerificationDto` (1 campo, 1 obligatorio). Delega en `IamEmailVerificationService.resend`. Crea filas en iam.email_verifications, messaging.notification_requests. Lee iam.authentication_credentials, iam.email_verifications, iam.users, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:266` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 5, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:266` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → CredentialsRepository.findActivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:67` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → EmailVerificationsRepository.create | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:41` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → EmailVerificationsRepository.findLatestByUser | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:85` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → IamEmailVerificationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → IamEmailVerificationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → IamEmailVerificationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → IamEmailVerificationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → IamEmailVerificationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |

### Cuerpo — DTO `ResendVerificationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `identifier` | `string` | Sí | longitud mínima 3; longitud máxima 320 | `@IsString()` `@MinLength(3)` `@MaxLength(320)` | Correo o documento de identidad con el que la persona inicia sesión | `src/modules/iam/presentation/dto/resend-verification.dto.ts:24` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "identifier": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "identifier": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ResendVerificationResponseDto>` · DTO `ResendVerificationResponseDto` · HTTP `HttpStatus.ACCEPTED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `message` | `string` | Sí | — | — | Mensaje neutro, idéntico en todos los casos. | `src/modules/iam/presentation/dto/resend-verification.dto.ts:36` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 202 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La notificación necesita destinatario interno o dirección de destino; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. POST /iam/auth/reset-password

- **Origen:** CONTRATO
- **Nombre:** Fijar una contraseña nueva con el token recibido por correo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.resetPassword` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:372`

### Qué es y para qué sirve (negocio)

Fijar una contraseña nueva con el token recibido por correo. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/reset-password` la atiende `IamAuthController.resetPassword` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:372). Es una ruta pública: no exige token. Valida el cuerpo como `ResetPasswordDto` (2 campos, 2 obligatorios). Delega en `IamPasswordResetService.resetPassword`. Crea filas en iam.security_events. Actualiza iam.authentication_credentials, iam.password_resets, iam.refresh_tokens, iam.sessions. Lee iam.authentication_credentials, iam.password_resets, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:372` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:372` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.resetPassword → IamPasswordResetService.resetPassword | `src/modules/iam/application/services/iam-password-reset.service.ts:229` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.resetPassword → IamPasswordResetService.resetPassword → CredentialsRepository.findActivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:67` |
| `iam.password_resets` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.resetPassword → IamPasswordResetService.resetPassword | `src/modules/iam/application/services/iam-password-reset.service.ts:213` |
| `iam.password_resets` | LEE | LEE | DIRECTA | IamAuthController.resetPassword → IamPasswordResetService.resetPassword → PasswordResetsRepository.findByTokenHash | `src/modules/iam/infrastructure/repositories/password-resets.repository.ts:58` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.resetPassword → IamPasswordResetService.resetPassword → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:96` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.resetPassword → IamPasswordResetService.resetPassword → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.resetPassword → IamPasswordResetService.resetPassword → SessionsRepository.revokeAllActiveForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:104` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAuthController.resetPassword → IamPasswordResetService.resetPassword → SessionsRepository.activeSessionIdsForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:94` |

### Cuerpo — DTO `ResetPasswordDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `token` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@IsNotEmpty()` `@MaxLength(200)` | Token recibido por correo | `src/modules/iam/presentation/dto/password-reset.dto.ts:54` |
| `newPassword` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | Contraseña nueva | `src/modules/iam/presentation/dto/password-reset.dto.ts:67` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "token": "valor-ejemplo",
  "newPassword": "ClaveSegura2026!"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "token": "valor-ejemplo",
  "newPassword": "ClaveSegura2026!"
}
```

</details>

### Respuesta — `Promise<ResetPasswordResponseDto>` · DTO `ResetPasswordResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | — | Usuario cuya clave cambió | `src/modules/iam/presentation/dto/password-reset.dto.ts:76` |
| `revokedSessions` | `number` | Sí | — | — | Sesiones revocadas: cambiar la clave cierra todas las sesiones abiertas | `src/modules/iam/presentation/dto/password-reset.dto.ts:85` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: Token de restablecimiento inválido; UnauthorizedException: El token de restablecimiento ya fue utilizado; UnauthorizedException: El token de restablecimiento expiró |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:178` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /iam/auth/sessions/purge

- **Origen:** CONTRATO
- **Nombre:** Expirar sesiones y tokens vencidos
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.purge` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:476`

### Qué es y para qué sirve (negocio)

Expirar sesiones y tokens vencidos. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/sessions/purge` la atiende `IamAuthController.purge` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:476). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamAuthService.purgeSessions`. Crea filas en iam.security_events. Actualiza iam.refresh_tokens, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:476` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.purge → IamAuthService.purgeSessions → RefreshTokensRepository.purgeExpired | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:105` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.purge → IamAuthService.purgeSessions → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.purge → IamAuthService.purgeSessions → SessionsRepository.purgeExpired | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:140` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PurgeResultDto>` · DTO `PurgeResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expiredSessions` | `number` | Sí | — | — | Nº de sesiones expiradas | `src/modules/iam/presentation/dto/operation-result.dto.ts:31` |
| `expiredTokens` | `number` | Sí | — | — | Nº de refresh tokens expirados | `src/modules/iam/presentation/dto/operation-result.dto.ts:37` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:148` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:102` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /iam/auth/token/refresh

- **Origen:** CONTRATO
- **Nombre:** Rotar el refresh token
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.refresh` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:388`

### Qué es y para qué sirve (negocio)

Rotar el refresh token. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/token/refresh` la atiende `IamAuthController.refresh` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:388). Es una ruta pública: no exige token. Valida el cuerpo como `RefreshTokenDto` (1 campo, 0 obligatorios). Delega en `IamAuthService.refresh`. Crea filas en iam.refresh_tokens, iam.security_events. Actualiza iam.refresh_tokens, iam.sessions. Lee authz.roles, authz.user_role_assignments, directory.tenant_memberships, directory.tenants, iam.refresh_tokens, iam.sessions, iam.user_global_roles, iam.users y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:388` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 20, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:388` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.mergeRoleCodes → AuthzEffectiveRolesService.scopedAssignmentsForUser | `src/modules/authz/services/authz-effective-roles.service.ts:96` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.mergeRoleCodes → AuthzEffectiveRolesService.scopedAssignmentsForUser → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadActiveTenantIds | `src/modules/iam/application/services/iam-auth.service.ts:230` |
| `directory.tenants` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadTenantDisplay | `src/modules/iam/application/services/iam-auth.service.ts:333` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → RefreshTokensRepository.revokeBySessionId | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:83` |
| `iam.refresh_tokens` | ESCRIBE | CREA | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → RefreshTokensRepository.create | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:39` |
| `iam.refresh_tokens` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → RefreshTokensRepository.findByHashForUpdate | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:74` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → SessionsRepository.revokeById | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:82` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → SessionsRepository.findById | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:60` |
| `iam.user_global_roles` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → UserGlobalRolesRepository.findActiveForUser | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:57` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo — DTO `RefreshTokenDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `refreshToken` | `string` | No | longitud mínima 1 | `@ValidateIf(() => !loadRefreshCookieEnv().enabled)` `@IsString()` `@MinLength(1)` | Refresh token en crudo emitido previamente. Obligatorio salvo que la API entregue el token como cookie httpOnly (AUTH_REFRESH_COOKIE_ENABLED), en cuyo caso se ignora y se lee de la cookie | `src/modules/iam/presentation/dto/refresh-token.dto.ts:28` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "refreshToken": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<TokenResponseDto>` · DTO `TokenResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `accessToken` | `string` | Sí | — | — | JWT de acceso | `src/modules/iam/presentation/dto/token-response.dto.ts:9` |
| `refreshToken` | `string` | Sí | — | — | Refresh token en crudo; solo se entrega una vez | `src/modules/iam/presentation/dto/token-response.dto.ts:17` |
| `expiresAt` | `string` | Sí | formato date-time | — | Expiración de la sesión | `src/modules/iam/presentation/dto/token-response.dto.ts:27` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: No se presentó un refresh token; UnauthorizedException: Sesión no activa; UnauthorizedException: Reuso de refresh token detectado; UnauthorizedException: Refresh token expirado; UnauthorizedException: Refresh token inválido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-005.int-spec.ts:57` |
| INTEGRACION | `test/integration/iam.int-spec.ts:97` |
| INTEGRACION | `test/integration/refresh-cookie.int-spec.ts:83` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:86` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /iam/auth/upload-registration-document

- **Origen:** CONTRATO
- **Nombre:** Pre-cargar un PDF para un registro de organización o profesional
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.uploadRegistrationDocument` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:198`

### Qué es y para qué sirve (negocio)

Pre-cargar un PDF para un registro de organización o profesional. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/upload-registration-document` la atiende `IamAuthController.uploadRegistrationDocument` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:198). Es una ruta pública: no exige token. Delega en `IamRegistrationDocumentUploadService.upload`. Crea filas en common.file_versions, common.files, messaging.queued_jobs. Actualiza messaging.queued_jobs. Lee messaging.message_queues, messaging.queued_jobs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:198` |
| CUERPO | multipart/form-data (obligatorio); el tamaño del archivo lo define la ruta, no el límite global | `contrato (requestBody)` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 30, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:198` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | IamAuthController.uploadRegistrationDocument → IamRegistrationDocumentUploadService.upload → FileUploadService.uploadAnonymous → FilesService.createFile → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:142` |
| `common.files` | ESCRIBE | CREA | DIRECTA | IamAuthController.uploadRegistrationDocument → IamRegistrationDocumentUploadService.upload → FileUploadService.uploadAnonymous → FilesService.createFile → FilesRepository.create | `src/modules/common/repositories/files.repository.ts:52` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | IamAuthController.uploadRegistrationDocument → IamRegistrationDocumentUploadService.upload → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:77` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | IamAuthController.uploadRegistrationDocument → IamRegistrationDocumentUploadService.upload → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:101` |
| `messaging.queued_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.uploadRegistrationDocument → IamRegistrationDocumentUploadService.upload → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.reuse → StorageLifecycleCoordinator.change | `src/common/storage/storage-lifecycle-coordinator.service.ts:651` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IamAuthController.uploadRegistrationDocument → IamRegistrationDocumentUploadService.upload → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findJobByDedupeKey | `src/modules/messaging/repositories/queues.repository.ts:132` |

### Cuerpo — DTO (no identificado) · `multipart/form-data`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `file` | `string` | Sí | formato binary | — | — | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "file": "<contenido-binario>"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "file": "<contenido-binario>"
}
```

</details>

### Respuesta — `Promise<RegistrationDocumentUploadResponseDto>` · DTO `RegistrationDocumentUploadResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `string` | Sí | formato uuid | — | Identificador del archivo, sin dueño hasta que un alta lo reclame. | `src/modules/iam/presentation/dto/upload-registration-document.dto.ts:13` |
| `originalName` | `string` | Sí | — | — | Nombre original del PDF, tal como lo envió el cliente. | `src/modules/iam/presentation/dto/upload-registration-document.dto.ts:19` |
| `sizeBytes` | `number` | Sí | — | — | Tamaño real del archivo almacenado, en bytes. | `src/modules/iam/presentation/dto/upload-registration-document.dto.ts:25` |
| `mimeType` | `string` | Sí | — | — | Tipo MIME detectado por firma binaria (siempre `application/pdf`). | `src/modules/iam/presentation/dto/upload-registration-document.dto.ts:31` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se recibió contenido en el campo "file"; PreconditionFailedException: El archivo excede el tamaño máximo permitido; PreconditionFailedException: Solo se admiten documentos PDF |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN; StorageLifecycleDenied: REMOTE_STATE_UNKNOWN; StorageLifecycleDenied: ADAPTER_DID_NOT_CONSUME_PERMIT; StorageLifecycleDenied: PUBLICATION_RESULT_REQUIRES_RELOAD; StorageLifecycleDenied: WRITE_RESERVATION_REQUIRED; Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3; StorageLifecycleDenied: REFERENCE_OBJECT_UNPROVEN; StorageLifecycleDenied: REFERENCE_METADATA_MISMATCH |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/organization-legal-documents.int-spec.ts:37` |
| INTEGRACION | `test/integration/organization-legal-representative.int-spec.ts:41` |
| INTEGRACION | `test/integration/practitioner-credential-registration-files.int-spec.ts:25` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:152` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /iam/auth/upload-registration-signature-image

- **Origen:** CONTRATO
- **Nombre:** Pre-cargar una imagen de firma o sello para el registro
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.uploadRegistrationSignatureImage` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:153`

### Qué es y para qué sirve (negocio)

Pre-cargar una imagen de firma o sello para el registro. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/upload-registration-signature-image` la atiende `IamAuthController.uploadRegistrationSignatureImage` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:153). Es una ruta pública: no exige token. Delega en `IamRegistrationDocumentUploadService.uploadSignatureImage`. Crea filas en common.file_versions, common.files, messaging.queued_jobs. Actualiza messaging.queued_jobs. Lee messaging.message_queues, messaging.queued_jobs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:153` |
| CUERPO | multipart/form-data (obligatorio); el tamaño del archivo lo define la ruta, no el límite global | `contrato (requestBody)` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:153` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | IamAuthController.uploadRegistrationSignatureImage → IamRegistrationDocumentUploadService.uploadSignatureImage → FileUploadService.uploadAnonymous → FilesService.createFile → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:142` |
| `common.files` | ESCRIBE | CREA | DIRECTA | IamAuthController.uploadRegistrationSignatureImage → IamRegistrationDocumentUploadService.uploadSignatureImage → FileUploadService.uploadAnonymous → FilesService.createFile → FilesRepository.create | `src/modules/common/repositories/files.repository.ts:52` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | IamAuthController.uploadRegistrationSignatureImage → IamRegistrationDocumentUploadService.uploadSignatureImage → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:77` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | IamAuthController.uploadRegistrationSignatureImage → IamRegistrationDocumentUploadService.uploadSignatureImage → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:101` |
| `messaging.queued_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.uploadRegistrationSignatureImage → IamRegistrationDocumentUploadService.uploadSignatureImage → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.reuse → StorageLifecycleCoordinator.change | `src/common/storage/storage-lifecycle-coordinator.service.ts:651` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IamAuthController.uploadRegistrationSignatureImage → IamRegistrationDocumentUploadService.uploadSignatureImage → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findJobByDedupeKey | `src/modules/messaging/repositories/queues.repository.ts:132` |

### Cuerpo — DTO (no identificado) · `multipart/form-data`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `file` | `string` | Sí | formato binary | — | — | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "file": "<contenido-binario>"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "file": "<contenido-binario>"
}
```

</details>

### Respuesta — `Promise<RegistrationDocumentUploadResponseDto>` · DTO `RegistrationDocumentUploadResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `string` | Sí | formato uuid | — | Identificador del archivo, sin dueño hasta que un alta lo reclame. | `src/modules/iam/presentation/dto/upload-registration-document.dto.ts:13` |
| `originalName` | `string` | Sí | — | — | Nombre original del PDF, tal como lo envió el cliente. | `src/modules/iam/presentation/dto/upload-registration-document.dto.ts:19` |
| `sizeBytes` | `number` | Sí | — | — | Tamaño real del archivo almacenado, en bytes. | `src/modules/iam/presentation/dto/upload-registration-document.dto.ts:25` |
| `mimeType` | `string` | Sí | — | — | Tipo MIME detectado por firma binaria (siempre `application/pdf`). | `src/modules/iam/presentation/dto/upload-registration-document.dto.ts:31` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La imagen supera el límite de 2 MB; PreconditionFailedException: No se recibió contenido en el campo "file"; PreconditionFailedException: El archivo excede el tamaño máximo permitido; PreconditionFailedException: Solo se admiten documentos PDF |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN; StorageLifecycleDenied: REMOTE_STATE_UNKNOWN; StorageLifecycleDenied: ADAPTER_DID_NOT_CONSUME_PERMIT; StorageLifecycleDenied: PUBLICATION_RESULT_REQUIRES_RELOAD; StorageLifecycleDenied: WRITE_RESERVATION_REQUIRED; Error: FILE_STORAGE_S3_BUCKET es obligatorio para FILE_STORAGE_ADAPTER=s3; StorageLifecycleDenied: REFERENCE_OBJECT_UNPROVEN; StorageLifecycleDenied: REFERENCE_METADATA_MISMATCH |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practitioner-signature-registration.int-spec.ts:44` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /iam/auth/verify-email

- **Origen:** CONTRATO
- **Nombre:** Verificar el correo con el token recibido
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.verifyEmail` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:283`

### Qué es y para qué sirve (negocio)

Verificar el correo con el token recibido. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/verify-email` la atiende `IamAuthController.verifyEmail` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:283). Es una ruta pública: no exige token. Valida el cuerpo como `VerifyEmailDto` (1 campo, 1 obligatorio). Delega en `IamPatientSelfRegistrationService.verifyEmail`. Actualiza iam.email_verifications, iam.users. Lee iam.email_verifications, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:283` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:283` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.email_verifications` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.verifyEmail → IamPatientSelfRegistrationService.verifyEmail | `src/modules/iam/application/services/iam-patient-self-registration.service.ts:566` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | IamAuthController.verifyEmail → IamPatientSelfRegistrationService.verifyEmail → EmailVerificationsRepository.findByTokenHash | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:60` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.verifyEmail → IamPatientSelfRegistrationService.verifyEmail | `src/modules/iam/application/services/iam-patient-self-registration.service.ts:580` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.verifyEmail → IamPatientSelfRegistrationService.verifyEmail → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Cuerpo — DTO `VerifyEmailDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `token` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:653` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "token": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "token": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<VerifyEmailResponseDto>` · DTO `VerifyEmailResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/iam/presentation/dto/register-patient.dto.ts:662` |
| `emailVerified` | `boolean` | Sí | — | — | Valor de email verified mantenido por la instancia. | `src/modules/iam/presentation/dto/register-patient.dto.ts:668` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: Token de verificación inválido; UnauthorizedException: El token de verificación ya fue utilizado; UnauthorizedException: El token de verificación expiró |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:161` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. GET /iam/me/sessions

- **Origen:** CONTRATO
- **Nombre:** Listar mis sesiones abiertas
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAccountSecurityController.listSessions` — `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:57`

### Qué es y para qué sirve (negocio)

Listar mis sesiones abiertas. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/me/sessions` la atiende `IamAccountSecurityController.listSessions` (src/modules/iam/presentation/controllers/iam-account-security.controller.ts:57). Exige sesión; el controlador no declara roles. Delega en `IamAccountSecurityService.listSessions`. Lee iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:57` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:57` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.sessions` | LEE | LEE | DIRECTA | IamAccountSecurityController.listSessions → IamAccountSecurityService.listSessions → SessionsRepository.findActiveByUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:117` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MySessionDto[]>` · DTO `MySessionDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la sesión (el que se pasa a `revoke`). | `src/modules/iam/presentation/dto/account-security.dto.ts:43` |
| `createdAt` | `string` | Sí | formato date-time | — | Alta de la sesión. | `src/modules/iam/presentation/dto/account-security.dto.ts:49` |
| `expiresAt` | `string` | Sí | formato date-time | — | Vencimiento de la sesión. | `src/modules/iam/presentation/dto/account-security.dto.ts:55` |
| `ip` | `string` | No | — | — | Dirección IP con la que se abrió. | `src/modules/iam/presentation/dto/account-security.dto.ts:61` |
| `current` | `boolean` | Sí | — | — | Si es la sesión desde la que se hace la consulta. | `src/modules/iam/presentation/dto/account-security.dto.ts:67` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamAccountSecurityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /iam/me/sessions/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Cerrar una de mis sesiones
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAccountSecurityController.revokeSession` — `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:66`

### Qué es y para qué sirve (negocio)

Cerrar una de mis sesiones. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/me/sessions/{id}/revoke` la atiende `IamAccountSecurityController.revokeSession` (src/modules/iam/presentation/controllers/iam-account-security.controller.ts:66). Exige sesión; el controlador no declara roles. Delega en `IamAccountSecurityService.revokeSession`. Crea filas en iam.security_events. Actualiza iam.refresh_tokens, iam.sessions. Lee iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:66` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:66` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:66` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAccountSecurityController.revokeSession → IamAccountSecurityService.revokeSession → RefreshTokensRepository.revokeBySessionId | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:83` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAccountSecurityController.revokeSession → IamAccountSecurityService.revokeSession → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAccountSecurityController.revokeSession → IamAccountSecurityService.revokeSession → SessionsRepository.revokeById | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:82` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAccountSecurityController.revokeSession → IamAccountSecurityService.revokeSession → SessionsRepository.findById | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:60` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RevokeMySessionResultDto>` · DTO `RevokeMySessionResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `revoked` | `boolean` | Sí | — | — | `false` si la sesión ya no estaba activa (no es un error). | `src/modules/iam/presentation/dto/account-security.dto.ts:76` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Sesión no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamAccountSecurityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. GET /iam/users

- **Origen:** CONTRATO
- **Nombre:** Listado paginado de usuarios
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.searchUsers` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:102`

### Qué es y para qué sirve (negocio)

Listado paginado de usuarios. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users` la atiende `IamUsersController.searchUsers` (src/modules/iam/presentation/controllers/iam-users.controller.ts:102). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.searchUsers`. Lee iam.authentication_credentials, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:102` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.searchUsers → IamUsersReadService.searchUsers → CredentialsRepository.findBySubjectMatch | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:157` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.searchUsers → IamUsersReadService.searchUsers → UsersRepository.searchPage | `src/modules/iam/infrastructure/repositories/users.repository.ts:130` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | No | `string` | Texto a buscar en el nombre visible o en el correo de acceso |
| `status` | query | No | `string` | Concepto de estado al que acotar |
| `cursor` | query | No | `string` | Cursor opaco devuelto por la página anterior |
| `limit` | query | No | `number` | Tope de resultados (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SearchUsersResponseDto>` · DTO `SearchUsersResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<UserListItemDto>` | Sí | — | — | Usuarios de esta página, ordenados por nombre visible. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:70` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del usuario. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:19` |
| `items[].displayName` | `string` | Sí | — | — | Nombre visible. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:25` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado de la cuenta. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:31` |
| `items[].mfaStatusConceptId` | `string` | No | formato uuid | — | Estado del segundo factor. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:37` |
| `items[].emailVerified` | `boolean` | Sí | — | — | Si el correo consta verificado. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:43` |
| `items[].phoneVerified` | `boolean` | Sí | — | — | Si el teléfono consta verificado. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:49` |
| `items[].lastLoginAt` | `string` | No | formato date-time; admite null | — | Último ingreso registrado. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:55` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta de la cuenta. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:61` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:76` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:82` |
| `nextCursor` | `string` | No | admite null | — | Cursor opaco de continuación, o `null` si ésta es la última página. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:88` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-users.controller.spec.ts:147` |

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /iam/users

- **Origen:** CONTRATO
- **Nombre:** Crear un usuario con credencial de contraseña y rol inicial
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.createUser` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:266`

### Qué es y para qué sirve (negocio)

Crear un usuario con credencial de contraseña y rol inicial. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users` la atiende `IamUsersController.createUser` (src/modules/iam/presentation/controllers/iam-users.controller.ts:266). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateUserDto` (6 campos, 3 obligatorios). Delega en `IamUsersService.createUser`. Crea filas en common.contact_points, iam.authentication_credentials, iam.security_events, iam.user_global_roles, iam.users. Lee iam.authentication_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:266` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | IamUsersController.createUser → IamUsersService.createUser → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:198` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamUsersController.createUser → IamUsersService.createUser → CredentialsRepository.createPassword | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:280` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.createUser → IamUsersService.createUser → CredentialsRepository.findActivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:67` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.createUser → IamUsersService.createUser → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamUsersController.createUser → IamUsersService.createUser → UserGlobalRolesRepository.create | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamUsersController.createUser → IamUsersService.createUser → UsersRepository.create | `src/modules/iam/infrastructure/repositories/users.repository.ts:49` |

### Cuerpo — DTO `CreateUserDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `displayName` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre visible del usuario | `src/modules/iam/presentation/dto/create-user.dto.ts:24` |
| `email` | `string` | Sí | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Email que actúa como identidad de login | `src/modules/iam/presentation/dto/create-user.dto.ts:35` |
| `password` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | Contraseña en claro (se persiste solo su hash argon2id) | `src/modules/iam/presentation/dto/create-user.dto.ts:46` |
| `phone` | `string` | No | longitud máxima 40; patrón runtime /^[+]?[0-9 ()-]{6,}$/ | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(/^[+]?[0-9 ()-]{6,}$/, { message: 'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion', })` | Teléfono de contacto en formato E.164 o nacional | `src/modules/iam/presentation/dto/create-user.dto.ts:63` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA del usuario | `src/modules/iam/presentation/dto/create-user.dto.ts:72` |
| `initialRole` | `string` | No | valores: USER, SECURITY_ADMIN | `@IsOptional()` `@IsIn(['USER', 'SECURITY_ADMIN'])` | Rol inicial | `src/modules/iam/presentation/dto/create-user.dto.ts:83` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "displayName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "password": "ClaveSegura2026!"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "displayName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "password": "ClaveSegura2026!",
  "phone": "+59170000000",
  "timeZone": "America/La_Paz",
  "initialRole": "USER"
}
```

</details>

### Respuesta — `Promise<UserResponseDto>` · DTO `UserResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/iam/presentation/dto/user-response.dto.ts:9` |
| `displayName` | `string` | Sí | — | — | Valor de display name mantenido por la instancia. | `src/modules/iam/presentation/dto/user-response.dto.ts:15` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del usuario | `src/modules/iam/presentation/dto/user-response.dto.ts:24` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/iam/presentation/dto/user-response.dto.ts:30` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El email ya tiene una credencial de contraseña activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:41` |
| INTEGRACION | `test/integration/refresh-cookie.int-spec.ts:36` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-users.controller.spec.ts:73` |

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. GET /iam/users/{id}

- **Origen:** CONTRATO
- **Nombre:** Ficha de un usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.getUser` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:146`

### Qué es y para qué sirve (negocio)

Ficha de un usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}` la atiende `IamUsersController.getUser` (src/modules/iam/presentation/controllers/iam-users.controller.ts:146). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.getUserById`. Lee iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:146` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:146` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.getUser → IamUsersReadService.getUserById → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<UserDetailResponseDto>` · DTO `UserDetailResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `timeZone` | `string` | No | — | — | Zona horaria declarada. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:97` |
| `preferredLanguageConceptId` | `string` | No | formato uuid | — | Idioma preferido. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:103` |
| `residenceCountryConceptId` | `string` | No | formato uuid | — | País de residencia declarado. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:109` |
| `dataResidencyRegionConceptId` | `string` | No | formato uuid | — | Región de residencia del dato. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:115` |
| `legalBasisConceptId` | `string` | No | formato uuid | — | Base legal del tratamiento. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:121` |
| `privacyAcceptedAt` | `string` | No | formato date-time; admite null | — | Cuándo se aceptó la política de privacidad. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:127` |
| `privacyPolicyVersion` | `string` | No | — | — | Versión de la política aceptada. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:133` |
| `mustChangePassword` | `boolean` | Sí | — | — | Si la cuenta exige cambiar la credencial en el próximo ingreso. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:139` |
| `anonymizedAt` | `string` | No | formato date-time; admite null | — | Cuándo se anonimizó la cuenta, si se anonimizó. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:145` |
| `updatedAt` | `string` | Sí | formato date-time | — | Última modificación del registro. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:151` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /iam/users/{id}/anonymize

- **Origen:** CONTRATO
- **Nombre:** Anonimizar (DSAR) la cuenta
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.anonymize` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:356`

### Qué es y para qué sirve (negocio)

Anonimizar (DSAR) la cuenta. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/anonymize` la atiende `IamUsersController.anonymize` (src/modules/iam/presentation/controllers/iam-users.controller.ts:356). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersService.anonymize`. Crea filas en iam.security_events. Actualiza iam.authentication_credentials, iam.refresh_tokens, iam.sessions, iam.user_global_roles, iam.users. Lee iam.sessions, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:356` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:356` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → CredentialsRepository.revokeAllForUser | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:316` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:96` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → SessionsRepository.revokeAllActiveForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:104` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → SessionsRepository.activeSessionIdsForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:94` |
| `iam.user_global_roles` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → UserGlobalRolesRepository.revokeAllForUser | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:65` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.anonymize → IamUsersService.anonymize | `src/modules/iam/application/services/iam-users.service.ts:295` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/iam/presentation/dto/operation-result.dto.ts:46` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:166` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-users.controller.spec.ts:137` |

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. GET /iam/users/{id}/credentials

- **Origen:** CONTRATO
- **Nombre:** Credenciales del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.listCredentials` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:156`

### Qué es y para qué sirve (negocio)

Credenciales del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}/credentials` la atiende `IamUsersController.listCredentials` (src/modules/iam/presentation/controllers/iam-users.controller.ts:156). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.listCredentials`. Lee iam.authentication_credentials, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:156` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:156` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.listCredentials → IamUsersReadService.listCredentials → CredentialsRepository.findByUser | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:333` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.listCredentials → IamUsersReadService.listCredentials → IamUsersReadService.forkForExistingUser → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListCredentialsResponseDto>` · DTO `ListCredentialsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CredentialListItemDto>` | Sí | — | — | Credenciales, de la más reciente a la más antigua. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:352` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la credencial. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:163` |
| `items[].methodConceptId` | `string` | Sí | formato uuid | — | Método de autenticación. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:169` |
| `items[].externalSubject` | `string` | No | — | — | Sujeto con el que se autentica (correo o documento). | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:175` |
| `items[].identityProvider` | `string` | No | — | — | Proveedor de identidad, en las credenciales federadas. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:181` |
| `items[].stateConceptId` | `string` | Sí | formato uuid | — | Estado de la credencial. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:187` |
| `items[].lastUsedAt` | `string` | No | formato date-time; admite null | — | Último uso registrado. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:193` |
| `items[].expiresAt` | `string` | No | formato date-time; admite null | — | Caducidad, si la tiene. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:199` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta de la credencial. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:205` |
| `count` | `number` | Sí | — | — | Cuántas credenciales trae la respuesta. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:358` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. POST /iam/users/{id}/credentials/{cid}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar una credencial del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.revokeCredential` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:293`

### Qué es y para qué sirve (negocio)

Revocar una credencial del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/credentials/{cid}/revoke` la atiende `IamUsersController.revokeCredential` (src/modules/iam/presentation/controllers/iam-users.controller.ts:293). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamCredentialsService.revokeCredential`. Crea filas en iam.security_events. Actualiza iam.authentication_credentials. Lee iam.authentication_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:293` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, cid | `src/modules/iam/presentation/controllers/iam-users.controller.ts:293` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.revokeCredential → IamCredentialsService.revokeCredential | `src/modules/iam/application/services/iam-credentials.service.ts:127` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.revokeCredential → IamCredentialsService.revokeCredential → CredentialsRepository.findByIdAndUser | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:238` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.revokeCredential → IamCredentialsService.revokeCredential → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `cid` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/iam/presentation/dto/operation-result.dto.ts:46` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Credencial no encontrada para el usuario |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-users.controller.spec.ts:92` |

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. POST /iam/users/{id}/credentials/federated

- **Origen:** CONTRATO
- **Nombre:** Enlazar una credencial de identidad federada
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.linkFederated` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:280`

### Qué es y para qué sirve (negocio)

Enlazar una credencial de identidad federada. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/credentials/federated` la atiende `IamUsersController.linkFederated` (src/modules/iam/presentation/controllers/iam-users.controller.ts:280). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `LinkFederatedCredentialDto` (2 campos, 2 obligatorios). Delega en `IamCredentialsService.linkFederated`. Crea filas en iam.authentication_credentials, iam.security_events. Lee iam.authentication_credentials, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:280` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:280` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamUsersController.linkFederated → IamCredentialsService.linkFederated → CredentialsRepository.createFederated | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:300` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.linkFederated → IamCredentialsService.linkFederated → CredentialsRepository.findFederated | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:225` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.linkFederated → IamCredentialsService.linkFederated → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.linkFederated → IamCredentialsService.linkFederated → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `LinkFederatedCredentialDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `identityProvider` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Proveedor de identidad externo (p. ej. google, azure-ad) | `src/modules/iam/presentation/dto/link-federated-credential.dto.ts:15` |
| `externalSubject` | `string` | Sí | longitud mínima 1; longitud máxima 320 | `@IsString()` `@MinLength(1)` `@MaxLength(320)` | Identificador del sujeto en el proveedor externo | `src/modules/iam/presentation/dto/link-federated-credential.dto.ts:26` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "identityProvider": "valor-ejemplo",
  "externalSubject": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "identityProvider": "valor-ejemplo",
  "externalSubject": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<CredentialResponseDto>` · DTO `CredentialResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/iam/presentation/dto/credential-response.dto.ts:9` |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado de la credencial | sin fuente |
| `verifiedAt` | `string` | No | formato date-time | — | Valor de verified at mantenido por la instancia. | sin fuente |
| `practitionerVerified` | `boolean` | Sí | — | — | true si al verificar quedó habilitado todo el perfil profesional | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 409 | `CONFLICT` | ConflictException: La credencial federada ya existe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:132` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-users.controller.spec.ts:82` |

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. GET /iam/users/{id}/devices

- **Origen:** CONTRATO
- **Nombre:** Dispositivos del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.listDevices` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:169`

### Qué es y para qué sirve (negocio)

Dispositivos del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}/devices` la atiende `IamUsersController.listDevices` (src/modules/iam/presentation/controllers/iam-users.controller.ts:169). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.listDevices`. Lee iam.devices, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:169` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:169` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.devices` | LEE | LEE | DIRECTA | IamUsersController.listDevices → IamUsersReadService.listDevices → DevicesRepository.findByUser | `src/modules/iam/infrastructure/repositories/devices.repository.ts:54` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.listDevices → IamUsersReadService.listDevices → IamUsersReadService.forkForExistingUser → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListDevicesResponseDto>` · DTO `ListDevicesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<DeviceListItemDto>` | Sí | — | — | Dispositivos, del más reciente al más antiguo. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:367` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del dispositivo. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:214` |
| `items[].deviceFingerprint` | `string` | No | — | — | Huella con la que el dispositivo se identifica. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:220` |
| `items[].platformConceptId` | `string` | No | formato uuid | — | Plataforma del dispositivo. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:226` |
| `items[].hasPushToken` | `boolean` | Sí | — | — | Si tiene token de notificaciones registrado. Se publica la existencia, no el token. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:232` |
| `items[].lastSeenAt` | `string` | No | formato date-time; admite null | — | Última vez que se vio el dispositivo. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:238` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta del dispositivo. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:244` |
| `count` | `number` | Sí | — | — | Cuántos dispositivos trae la respuesta. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:373` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. POST /iam/users/{id}/devices

- **Origen:** CONTRATO
- **Nombre:** Registrar un dispositivo del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.registerDevice` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:318`

### Qué es y para qué sirve (negocio)

Registrar un dispositivo del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/devices` la atiende `IamUsersController.registerDevice` (src/modules/iam/presentation/controllers/iam-users.controller.ts:318). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateDeviceDto` (4 campos, 1 obligatorio). Delega en `IamDevicesService.register`. Crea filas en iam.devices, iam.security_events. Lee iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-users.controller.ts:318` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:318` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.devices` | ESCRIBE | CREA | DIRECTA | IamUsersController.registerDevice → IamDevicesService.register → DevicesRepository.create | `src/modules/iam/infrastructure/repositories/devices.repository.ts:39` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.registerDevice → IamDevicesService.register → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.registerDevice → IamDevicesService.register → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateDeviceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `deviceFingerprint` | `string` | Sí | longitud mínima 1; longitud máxima 512 | `@IsString()` `@MinLength(1)` `@MaxLength(512)` | Huella única del dispositivo | `src/modules/iam/presentation/dto/create-device.dto.ts:23` |
| `platform` | `string` | No | valores: IOS, ANDROID, WEB | `@IsOptional()` `@IsIn(['IOS', 'ANDROID', 'WEB'])` | Plataforma | `src/modules/iam/presentation/dto/create-device.dto.ts:34` |
| `name` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Nombre legible del dispositivo | `src/modules/iam/presentation/dto/create-device.dto.ts:43` |
| `trust` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marcar el dispositivo como de confianza | `src/modules/iam/presentation/dto/create-device.dto.ts:53` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "deviceFingerprint": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "deviceFingerprint": "valor-ejemplo",
  "platform": "IOS",
  "name": "Nombre de ejemplo",
  "trust": true
}
```

</details>

### Respuesta — `Promise<DeviceResponseDto>` · DTO `DeviceResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/iam/presentation/dto/device-response.dto.ts:9` |
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/iam/presentation/dto/device-response.dto.ts:15` |
| `trusted` | `boolean` | Sí | — | — | Valor de trusted mantenido por la instancia. | `src/modules/iam/presentation/dto/device-response.dto.ts:21` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:119` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-users.controller.spec.ts:110` |

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. GET /iam/users/{id}/global-roles

- **Origen:** CONTRATO
- **Nombre:** Roles globales del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.listGlobalRoles` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:208`

### Qué es y para qué sirve (negocio)

Roles globales del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}/global-roles` la atiende `IamUsersController.listGlobalRoles` (src/modules/iam/presentation/controllers/iam-users.controller.ts:208). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.listGlobalRoles`. Lee iam.user_global_roles, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:208` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:208` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.user_global_roles` | LEE | LEE | DIRECTA | IamUsersController.listGlobalRoles → IamUsersReadService.listGlobalRoles → UserGlobalRolesRepository.findByUser | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:73` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.listGlobalRoles → IamUsersReadService.listGlobalRoles → IamUsersReadService.forkForExistingUser → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListGlobalRolesResponseDto>` · DTO `ListGlobalRolesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<GlobalRoleListItemDto>` | Sí | — | — | Asignaciones, de la más reciente a la más antigua. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:412` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la asignación. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:325` |
| `items[].roleConceptId` | `string` | Sí | formato uuid | — | Rol global asignado. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:331` |
| `items[].stateConceptId` | `string` | Sí | formato uuid | — | Estado de la asignación. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:337` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se asignó. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:343` |
| `count` | `number` | Sí | — | — | Cuántas asignaciones trae la respuesta. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:418` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. POST /iam/users/{id}/global-roles

- **Origen:** CONTRATO
- **Nombre:** Conceder o revocar un rol global
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.changeGlobalRole` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:343`

### Qué es y para qué sirve (negocio)

Conceder o revocar un rol global. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/global-roles` la atiende `IamUsersController.changeGlobalRole` (src/modules/iam/presentation/controllers/iam-users.controller.ts:343). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `GlobalRoleDto` (2 campos, 2 obligatorios). Delega en `IamUsersService.changeGlobalRole`. Crea filas en iam.security_events, iam.user_global_roles. Actualiza iam.refresh_tokens, iam.sessions, iam.user_global_roles. Lee iam.sessions, iam.user_global_roles, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:343` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:343` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:96` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole → SessionsRepository.revokeAllActiveForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:104` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole → SessionsRepository.activeSessionIdsForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:94` |
| `iam.user_global_roles` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole | `src/modules/iam/application/services/iam-users.service.ts:254` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole → UserGlobalRolesRepository.create | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:27` |
| `iam.user_global_roles` | LEE | LEE | DIRECTA | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole → UserGlobalRolesRepository.findActive | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:45` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `GlobalRoleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `role` | `string` | Sí | valores: USER, SECURITY_ADMIN, SUPERADMIN, PATIENT, PRACTITIONER, CLINICIAN | `@IsIn([ 'USER', 'SECURITY_ADMIN', 'SUPERADMIN', 'PATIENT', 'PRACTITIONER', 'CLINICIAN', ])` | — | `src/modules/iam/presentation/dto/global-role.dto.ts:51` |
| `action` | `string` | Sí | valores: GRANT, REVOKE | `@IsIn(['GRANT', 'REVOKE'])` | — | `src/modules/iam/presentation/dto/global-role.dto.ts:58` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "role": "USER",
  "action": "GRANT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "role": "USER",
  "action": "GRANT"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/iam/presentation/dto/operation-result.dto.ts:46` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado; ResourceNotFoundException: El usuario no tiene ese rol activo |
| 409 | `CONFLICT` | ConflictException: El rol ya está concedido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-004.int-spec.ts:110` |
| INTEGRACION | `test/integration/iam.int-spec.ts:140` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-users.controller.spec.ts:127` |

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. POST /iam/users/{id}/lock

- **Origen:** CONTRATO
- **Nombre:** Bloquear la cuenta y revocar sus sesiones
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.lock` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:330`

### Qué es y para qué sirve (negocio)

Bloquear la cuenta y revocar sus sesiones. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/lock` la atiende `IamUsersController.lock` (src/modules/iam/presentation/controllers/iam-users.controller.ts:330). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `LockUserDto` (1 campo, 0 obligatorios). Delega en `IamUsersService.lock`. Crea filas en iam.account_lockouts, iam.security_events. Actualiza iam.refresh_tokens, iam.sessions, iam.users. Lee iam.sessions, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:330` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:330` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.account_lockouts` | ESCRIBE | CREA | DIRECTA | IamUsersController.lock → IamUsersService.lock → AccountLockoutsRepository.create | `src/modules/iam/infrastructure/repositories/account-lockouts.repository.ts:35` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.lock → IamUsersService.lock → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:96` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.lock → IamUsersService.lock → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.lock → IamUsersService.lock → SessionsRepository.revokeAllActiveForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:104` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamUsersController.lock → IamUsersService.lock → SessionsRepository.activeSessionIdsForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:94` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.lock → IamUsersService.lock | `src/modules/iam/application/services/iam-users.service.ts:174` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.lock → IamUsersService.lock → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `LockUserDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo administrativo del bloqueo | `src/modules/iam/presentation/dto/lock-user.dto.ts:13` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/iam/presentation/dto/operation-result.dto.ts:46` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-004.int-spec.ts:99` |
| INTEGRACION | `test/integration/iam.int-spec.ts:155` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-users.controller.spec.ts:116` |

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. GET /iam/users/{id}/mfa-factors

- **Origen:** CONTRATO
- **Nombre:** Factores de MFA del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.listMfaFactors` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:182`

### Qué es y para qué sirve (negocio)

Factores de MFA del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}/mfa-factors` la atiende `IamUsersController.listMfaFactors` (src/modules/iam/presentation/controllers/iam-users.controller.ts:182). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.listMfaFactors`. Lee iam.mfa_factors, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:182` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:182` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.mfa_factors` | LEE | LEE | DIRECTA | IamUsersController.listMfaFactors → IamUsersReadService.listMfaFactors → MfaFactorsRepository.findByUser | `src/modules/iam/infrastructure/repositories/mfa-factors.repository.ts:62` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.listMfaFactors → IamUsersReadService.listMfaFactors → IamUsersReadService.forkForExistingUser → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListMfaFactorsResponseDto>` · DTO `ListMfaFactorsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MfaFactorListItemDto>` | Sí | — | — | Factores, del más reciente al más antiguo. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:382` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del factor. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:253` |
| `items[].factorTypeConceptId` | `string` | Sí | formato uuid | — | Mecanismo del segundo factor. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:259` |
| `items[].stateConceptId` | `string` | Sí | formato uuid | — | Estado del factor. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:265` |
| `items[].verifiedAt` | `string` | No | formato date-time; admite null | — | Cuándo se verificó, si se verificó. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:271` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta del factor. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:277` |
| `count` | `number` | Sí | — | — | Cuántos factores trae la respuesta. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:388` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. POST /iam/users/{id}/mfa-factors

- **Origen:** CONTRATO
- **Nombre:** Enrolar o verificar un factor MFA
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.mfaFactor` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:306`

### Qué es y para qué sirve (negocio)

Enrolar o verificar un factor MFA. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/mfa-factors` la atiende `IamUsersController.mfaFactor` (src/modules/iam/presentation/controllers/iam-users.controller.ts:306). Exige sesión; el controlador no declara roles. Valida el cuerpo como `MfaFactorDto` (5 campos, 0 obligatorios). Delega en `IamMfaService.enrollOrVerify`. Crea filas en iam.mfa_factors, iam.security_events. Actualiza iam.mfa_factors, iam.users. Lee iam.mfa_factors, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-users.controller.ts:306` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:306` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.mfa_factors` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify | `src/modules/iam/application/services/iam-mfa.service.ts:146` |
| `iam.mfa_factors` | ESCRIBE | CREA | DIRECTA | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify → MfaFactorsRepository.create | `src/modules/iam/infrastructure/repositories/mfa-factors.repository.ts:31` |
| `iam.mfa_factors` | LEE | LEE | DIRECTA | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify → MfaFactorsRepository.findByIdAndUser | `src/modules/iam/infrastructure/repositories/mfa-factors.repository.ts:50` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify | `src/modules/iam/application/services/iam-mfa.service.ts:150` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `MfaFactorDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `factorType` | `string` | No | valores: TOTP, WEBAUTHN | `@IsOptional()` `@IsIn(['TOTP', 'WEBAUTHN'])` | Tipo de factor a enrolar | `src/modules/iam/presentation/dto/mfa-factor.dto.ts:31` |
| `label` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Etiqueta legible del factor | `src/modules/iam/presentation/dto/mfa-factor.dto.ts:40` |
| `verify` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si es true, verifica el factor indicado | `src/modules/iam/presentation/dto/mfa-factor.dto.ts:50` |
| `factorId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Factor a verificar | `src/modules/iam/presentation/dto/mfa-factor.dto.ts:58` |
| `code` | `string` | No | longitud mínima 6; longitud máxima 8 | `@IsOptional()` `@IsString()` `@Length(6, 8)` | Código TOTP de la app autenticadora. Obligatorio cuando verify=true. | `src/modules/iam/presentation/dto/mfa-factor.dto.ts:71` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "factorType": "TOTP",
  "label": "valor-ejemplo",
  "verify": true,
  "factorId": "00000000-0000-4000-8000-000000000001",
  "code": "123456"
}
```

</details>

### Respuesta — `Promise<MfaFactorResponseDto>` · DTO `MfaFactorResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/iam/presentation/dto/mfa-factor-response.dto.ts:9` |
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/iam/presentation/dto/mfa-factor-response.dto.ts:15` |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado del factor | `src/modules/iam/presentation/dto/mfa-factor-response.dto.ts:24` |
| `verifiedAt` | `string` | No | formato date-time | — | Valor de verified at mantenido por la instancia. | `src/modules/iam/presentation/dto/mfa-factor-response.dto.ts:30` |
| `secret` | `string` | No | — | — | Secreto TOTP en base32. Solo se devuelve al enrolar un factor TOTP; | `src/modules/iam/presentation/dto/mfa-factor-response.dto.ts:40` |
| `otpauthUri` | `string` | No | — | — | URI otpauth:// para generar el QR. Solo se devuelve al enrolar un factor TOTP. | `src/modules/iam/presentation/dto/mfa-factor-response.dto.ts:49` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No tiene acceso a los factores MFA de esta cuenta |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado; ResourceNotFoundException: Factor MFA no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: factorId es obligatorio para verificar; PreconditionFailedException: code es obligatorio para verificar; PreconditionFailedException: El factor no tiene un secreto TOTP asociado; PreconditionFailedException: Código MFA inválido; PreconditionFailedException: factorType es obligatorio para enrolar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:111` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-users.controller.spec.ts:103` |

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. GET /iam/users/{id}/sessions

- **Origen:** CONTRATO
- **Nombre:** Sesiones del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.listSessions` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:195`

### Qué es y para qué sirve (negocio)

Sesiones del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}/sessions` la atiende `IamUsersController.listSessions` (src/modules/iam/presentation/controllers/iam-users.controller.ts:195). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.listSessions`. Lee iam.sessions, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:195` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:195` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.sessions` | LEE | LEE | DIRECTA | IamUsersController.listSessions → IamUsersReadService.listSessions → SessionsRepository.findByUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:154` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.listSessions → IamUsersReadService.listSessions → IamUsersReadService.forkForExistingUser → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListSessionsResponseDto>` · DTO `ListSessionsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SessionListItemDto>` | Sí | — | — | Sesiones, de la más reciente a la más antigua. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:397` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la sesión; es lo que se usa para revocarla. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:286` |
| `items[].deviceId` | `string` | No | formato uuid; admite null | — | Dispositivo desde el que se abrió, si se registró. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:292` |
| `items[].geoLocation` | `string` | No | — | — | Ubicación aproximada registrada al abrirla. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:298` |
| `items[].stateConceptId` | `string` | Sí | formato uuid | — | Estado de la sesión. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:304` |
| `items[].expiresAt` | `string` | No | formato date-time; admite null | — | Caducidad de la sesión. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:310` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Apertura de la sesión. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:316` |
| `count` | `number` | Sí | — | — | Cuántas sesiones trae la respuesta. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:403` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 35. POST /iam/users/assisted-practitioner-registration

- **Origen:** CONTRATO
- **Nombre:** Alta administrativa de un profesional (devuelve token de activación)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.assistedPractitionerRegistration` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:248`

### Qué es y para qué sirve (negocio)

Alta administrativa de un profesional (devuelve token de activación). Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/assisted-practitioner-registration` la atiende `IamUsersController.assistedPractitionerRegistration` (src/modules/iam/presentation/controllers/iam-users.controller.ts:248). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AssistedPractitionerRegistrationDto` (66 campos, 5 obligatorios). Delega en `IamPractitionerSelfRegistrationService.assistedRegisterPractitioner`. Crea filas en authz.user_role_assignments, common.addresses, common.contact_points, common.file_versions, common.files, common.identifiers, directory.tenant_memberships, iam.account_activations y 18 más. Actualiza common.files, messaging.queued_jobs. Lee authz.roles, authz.user_role_assignments, common.file_versions, common.files, iam.authentication_credentials, messaging.message_channels, messaging.message_queues, messaging.message_templates y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:248` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzEffectiveRolesService.ensureRoleByCode | `src/modules/authz/services/authz-effective-roles.service.ts:139` |
| `authz.user_role_assignments` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.create | `src/modules/authz/repositories/user-role-assignments.repository.ts:123` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.findActive | `src/modules/authz/repositories/user-role-assignments.repository.ts:73` |
| `common.addresses` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → OwnSiteProvisioningService.provision → AddressesRepository.create | `src/modules/common/repositories/addresses.repository.ts:118` |
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:198` |
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → FileUploadService.uploadAnonymous → FilesService.createFile → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:142` |
| `common.file_versions` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → FileUploadService.uploadAnonymous → FilesService.createFile → FilesRepository.create | `src/modules/common/repositories/files.repository.ts:52` |
| `common.files` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AttachableFileService.claimAnonymousUpload | `src/modules/common/services/attachable-file.service.ts:270` |
| `common.files` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:182` |
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:131` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `iam.account_activations` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AccountActivationsRepository.create | `src/modules/iam/infrastructure/repositories/account-activations.repository.ts:46` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CredentialsRepository.createPendingPassword | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:262` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:197` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → EmailVerificationsRepository.create | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:41` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → UserGlobalRolesRepository.create | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → UsersRepository.create | `src/modules/iam/infrastructure/repositories/users.repository.ts:49` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:77` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:101` |
| `messaging.queued_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.reuse → StorageLifecycleCoordinator.change | `src/common/storage/storage-lifecycle-coordinator.service.ts:651` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → OwnSiteProvisioningService.provision → PracticeSitesRepository.create | `src/modules/practice/repositories/practice-sites.repository.ts:111` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → OwnSiteProvisioningService.provision → OwnSiteProvisioningService.uniqueSiteCode → PracticeSitesRepository.findByPracticeAndCode | `src/modules/practice/repositories/practice-sites.repository.ts:85` |
| `practice.practices` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → OwnSiteProvisioningService.provision → PracticesRepository.create | `src/modules/practice/repositories/practices.repository.ts:130` |
| `practice.practices` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → OwnSiteProvisioningService.provision → PracticesRepository.findOwnOffice | `src/modules/practice/repositories/practices.repository.ts:115` |
| `practice.practitioner_role_assignments` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → OwnSiteProvisioningService.provision → PractitionerRoleAssignmentsRepository.create | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:259` |
| `profiles.health_practitioner_profiles` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → HealthPractitionerProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:161` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → HealthPractitionerProfilesRepository.findByCode | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:79` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → JurisdictionAuthorizationsRepository.create | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:114` |
| `profiles.person_account_links` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PersonAccountLinksRepository.create | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:50` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PersonProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PersonsRepository.create | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:119` |
| `profiles.practitioner_languages` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PractitionerLanguagesRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-languages.repository.ts:62` |
| `profiles.practitioner_specialties` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PractitionerSpecialtiesRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:61` |
| `profiles.professional_credentials` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfessionalCredentialsRepository.create | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:122` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Cuerpo — DTO `AssistedPractitionerRegistrationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `email` | `string` | Sí | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Correo de acceso del profesional | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:74` |
| `personalEmail` | `string` | No | formato email; longitud máxima 320 | `@IsOptional()` `@IsEmail()` `@MaxLength(320)` | Correo personal; no sirve para iniciar sesión | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:89` |
| `workEmail` | `string` | No | formato email; longitud máxima 320 | `@IsOptional()` `@IsEmail()` `@MaxLength(320)` | Correo de trabajo, distinto del correo de acceso | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:100` |
| `name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPractitionerDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:122` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:131` |
| `lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPractitionerDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:141` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:150` |
| `displayName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Forma anterior de declarar el nombre. Preferí name/lastName. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:169` |
| `licenseNumber` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Número de licencia o matrícula profesional | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:181` |
| `credentialNumber` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Número del título profesional que respalda la licencia | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:202` |
| `sedesLicenseNumber` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Número de registro del SEDES departamental | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:223` |
| `regulatoryAuthority` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Autoridad reguladora que emitió la licencia | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:235` |
| `licenseIssueDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | Fecha de inscripción de la matrícula (ISO) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:248` |
| `professionalTitle` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:257` |
| `specialtyConceptIds` | `array<string>` | No | formato uuid; máximo 4 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(4)` `@IsUUID(undefined, { each: true })` | Especialidades declaradas (una principal y hasta tres adicionales). | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:283` |
| `nationalId` | `string` | Sí | longitud máxima 40; patrón runtime /^[A-Za-z0-9.-]+$/ | `@IsString()` `@MaxLength(40)` `@Matches(/^[A-Za-z0-9.-]+$/, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Documento de identidad obligatorio; se guarda como identificador oficial | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:296` |
| `issuerAdministrativeAreaConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:318` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:339` |
| `homeAddressLines` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Calle y número del domicilio particular | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:356` |
| `homeLatitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:375` |
| `homeLongitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:386` |
| `workAddressLines` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Calle y número de la dirección laboral | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:397` |
| `workLatitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:408` |
| `workLongitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:419` |
| `phone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Forma anterior de declarar el teléfono del trabajo. Preferí workLandline o workMobilePhone. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:441` |
| `mobilePhone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Celular personal en formato E.164 o nacional | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:454` |
| `workMobilePhone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Celular de trabajo en formato E.164 o nacional | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:467` |
| `workLandline` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Teléfono fijo del lugar de trabajo | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:480` |
| `birthDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:488` |
| `gender` | `string` | No | valores: MALE, FEMALE, OTHER, UNKNOWN | `@IsOptional()` `@IsIn(ADMIN_GENDER_CODES)` | Género administrativo (HL7 AdministrativeGender) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:499` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | `@IsOptional()` `@IsIn(BIRTH_SEX_CODES)` | Sexo asignado al nacer | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:510` |
| `practitionerCategoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:519` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:527` |
| `credentialTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:535` |
| `languageConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:543` |
| `acceptsNewPatients` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:552` |
| `occupationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ocupación del catálogo (VS_BO_OCCUPATION) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:563` |
| `occupationFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(OCCUPATION_FREE_TEXT_MAX_LENGTH)` | Ocupación en texto libre, para cuando no está en el catálogo | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:576` |
| `workEmployerConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:587` |
| `workEmployerFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(EMPLOYER_FREE_TEXT_MAX_LENGTH)` | Empresa en texto libre, para cuando no está en el catálogo | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:601` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:610` |
| `profilePhotoBase64` | `string` | No | — | `@IsOptional()` `@IsString()` | Foto de perfil en formato Base64 (Data URI o base64 plano) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:620` |
| `signatureFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:626` |
| `sealFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:632` |
| `ownSite` | `CreateOwnSiteDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => CreateOwnSiteDto)` | Consultorio propio a dar de alta en la misma transacción (ALV-005/006 · P20). Mismo contrato que POST /practitioners/me/sites | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:655` |
| `ownSite.name` | `string` | No | longitud máxima 200 | — | Nombre del consultorio | sin fuente |
| `ownSite.timeZone` | `string` | No | — | — | — | sin fuente |
| `ownSite.address` | `OwnSiteAddressDto` | No | — | — | — | sin fuente |
| `ownSite.address.lines` | `array<string>` | No | longitud máxima 500 | `@IsArray()` `@IsString({ each: true })` `@MaxLength(500, { each: true })` | Líneas de la dirección; puede ir vacía si la sede se ubica sólo por municipio o coordenadas | `src/modules/practice/dto/create-own-site.dto.ts:44` |
| `ownSite.address.city` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/modules/practice/dto/create-own-site.dto.ts:51` |
| `ownSite.address.municipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/practice/dto/create-own-site.dto.ts:57` |
| `ownSite.address.administrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/practice/dto/create-own-site.dto.ts:63` |
| `ownSite.address.latitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/practice/dto/create-own-site.dto.ts:84` |
| `ownSite.address.longitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/practice/dto/create-own-site.dto.ts:95` |
| `ownSite.contactPhone` | `string` | No | longitud máxima 40 | — | — | sin fuente |
| `credentials` | `array<RegisterPractitionerCredentialDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => RegisterPractitionerCredentialDto)` | Títulos académicos declarados en el alta; cada uno crea una fila de professional_credentials. No se combina con credentialNumber. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:682` |
| `credentials[].credentialTypeConceptId` | `string` | No | formato uuid | `@IsUUID()` | Concept id del tipo de credencial (título universitario, diplomado, maestría, doctorado o título de especialidad) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:707` |
| `credentials[].number` | `string` | No | longitud máxima 100; patrón runtime /\S/ | `@IsString()` `@Matches(/\S/, { message: 'number no puede estar vacío' })` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:722` |
| `credentials[].issuingInstitutionText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:734` |
| `credentials[].issuingCityText` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:745` |
| `credentials[].issuingCountryText` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:755` |
| `credentials[].professionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de VS_BO_PROFESSION (COB-2023) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:767` |
| `credentials[].titleText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:777` |
| `credentials[].fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | fileId del PDF subido por POST /iam/auth/upload-registration-document | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:791` |
| `reason` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | Motivo del alta administrativa (trazabilidad C-18) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:931` |
| `clinicalRoles` | `array<string>` | No | longitud máxima 100; máximo 10 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(10)` `@IsString({ each: true })` `@MaxLength(100, { each: true })` | Roles asistenciales a conceder (códigos de `GET /authz/roles`) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:958` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "email": "usuario@example.com",
  "licenseNumber": "valor-ejemplo",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "email": "usuario@example.com",
  "personalEmail": "usuario@example.com",
  "workEmail": "usuario@example.com",
  "name": "Ana",
  "middleName": "Lucía",
  "lastName": "Rojas",
  "motherLastName": "Paz",
  "displayName": "Nombre de ejemplo",
  "licenseNumber": "valor-ejemplo",
  "credentialNumber": "valor-ejemplo",
  "sedesLicenseNumber": "T.I. 538/14",
  "regulatoryAuthority": "valor-ejemplo",
  "licenseIssueDate": "2026-07-31",
  "professionalTitle": "valor-ejemplo",
  "specialtyConceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "homeAddressLines": "valor-ejemplo",
  "homeLatitude": 1,
  "homeLongitude": 1,
  "workAddressLines": "valor-ejemplo",
  "workLatitude": 1,
  "workLongitude": 1,
  "phone": "+59170000000",
  "mobilePhone": "+59170000000",
  "workMobilePhone": "+59170000000",
  "workLandline": "valor-ejemplo",
  "birthDate": "2026-07-31",
  "gender": "MALE",
  "sexAtBirth": "MALE",
  "practitionerCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "languageConceptId": "00000000-0000-4000-8000-000000000001",
  "acceptsNewPatients": false,
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
  "timeZone": "America/La_Paz",
  "profilePhotoBase64": "valor-ejemplo",
  "signatureFileId": "00000000-0000-4000-8000-000000000001",
  "sealFileId": "00000000-0000-4000-8000-000000000001",
  "ownSite": {
    "name": "Nombre de ejemplo",
    "timeZone": "America/La_Paz",
    "address": {
      "lines": [
        "valor-ejemplo"
      ],
      "city": "valor-ejemplo",
      "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
      "administrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
      "latitude": 1,
      "longitude": 1
    },
    "contactPhone": "+591 72123456"
  },
  "credentials": [
    {
      "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "number": "valor-ejemplo",
      "issuingInstitutionText": "valor-ejemplo",
      "issuingCityText": "valor-ejemplo",
      "issuingCountryText": "BO",
      "professionConceptId": "00000000-0000-4000-8000-000000000001",
      "titleText": "valor-ejemplo",
      "fileId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "reason": "Texto descriptivo de ejemplo",
  "clinicalRoles": [
    "CLINICIAN",
    "SURGEON"
  ]
}
```

</details>

### Respuesta — `Promise<AssistedPractitionerRegistrationResponseDto>` · DTO `AssistedPractitionerRegistrationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `activationToken` | `string` | Sí | — | — | Token de un solo uso a entregar al titular por canal seguro | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:975` |
| `activationExpiresAt` | `string` | Sí | formato date-time | — | Cuándo caduca el token. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:981` |
| `clinicalRoles` | `array<string>` | No | — | — | Roles asistenciales efectivamente concedidos. Se devuelven para que el administrador vea con qué quedó operativo el profesional sin tener que consultarlo aparte. Si alguno de los pedidos no existía, el alta entera falla, así que esta lista coincide siempre con lo solicitado. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:992` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe una cuenta con ese correo; ConflictException: El practitioner_code ya está en uso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Declare los títulos en `credentials` o el número suelto en `credentialNumber`, no los dos; PreconditionFailedException: La foto de perfil no es una imagen válida; PreconditionFailedException: No se recibió contenido en el campo "file"; PreconditionFailedException: El archivo excede el tamaño máximo permitido; PreconditionFailedException: Solo se admiten documentos PDF; PreconditionFailedException: El departamento emisor es obligatorio para el alta del profesional; PreconditionFailedException: El departamento no pertenece al catálogo de departamentos de Bolivia; PreconditionFailedException: {labels.subject} no corresponde a un archivo subido en este registro; PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso; PreconditionFailedException: La firma y el sello requieren una imagen privada de hasta 2 MB; PreconditionFailedException: Ese concepto no es un tipo de credencial profesional; PreconditionFailedException: El número del título no puede estar vacío; PreconditionFailedException: Esa profesión no está en la Clasificación de Ocupaciones de Bolivia; PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: Alguno de los roles indicados no existe o no es asignable; PreconditionFailedException: La notificación necesita destinatario interno o dirección de destino; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: FILE_NOT_LIVE; StorageLifecycleDenied: VERSION_UNKNOWN; StorageLifecycleDenied: PHYSICAL_IDENTITY_UNKNOWN |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practitioner-registration.int-spec.ts:270` |

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. POST /iam/users/assisted-registration

- **Origen:** CONTRATO
- **Nombre:** Registro asistido de un paciente (devuelve token de activación)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.assistedRegistration` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:222`

### Qué es y para qué sirve (negocio)

Registro asistido de un paciente (devuelve token de activación). Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/assisted-registration` la atiende `IamUsersController.assistedRegistration` (src/modules/iam/presentation/controllers/iam-users.controller.ts:222). Exige sesión con alguno de los roles CLINICIAN, SECURITY_ADMIN. Valida el cuerpo como `AssistedRegistrationDto` (10 campos, 2 obligatorios). Delega en `IamAssistedRegistrationService.assistedRegistration`. Crea filas en iam.account_activations, iam.authentication_credentials, iam.security_events, iam.user_global_roles, iam.users. Lee iam.authentication_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:222` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | no determinado (no se encontró en el código) | `src/main.ts` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:142` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.account_activations` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → AccountActivationsRepository.create | `src/modules/iam/infrastructure/repositories/account-activations.repository.ts:46` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → CredentialsRepository.createPendingPassword | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:262` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:197` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → UserGlobalRolesRepository.create | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → UsersRepository.create | `src/modules/iam/infrastructure/repositories/users.repository.ts:49` |

### Cuerpo — DTO `AssistedRegistrationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: AssistedRegistrationDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:36` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:45` |
| `lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: AssistedRegistrationDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:55` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:64` |
| `displayName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Forma anterior de declarar el nombre. Preferí name/lastName. | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:83` |
| `email` | `string` | Sí | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Identificador verificado (email) que actúa como identidad de login | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:95` |
| `reason` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Motivo del registro asistido (queda en la trazabilidad C-18) | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:107` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA del paciente | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:116` |
| `legalRepresentationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id de la representación legal formal (authz.patient_legal_representations) | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:128` |
| `legalRepresentativeUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del usuario representante legal (dato mínimo si no hay representación formal) | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:140` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "email": "usuario@example.com",
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<AssistedRegistrationResponseDto>` · DTO `AssistedRegistrationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | — | Id de la cuenta creada | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:153` |
| `activationToken` | `string` | Sí | — | — | Token de activación de un solo uso (entregar al titular por canal seguro) | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:162` |
| `activationExpiresAt` | `string` | Sí | formato date-time | — | Caducidad del token de activación | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:168` |
| `status` | `string` | Sí | — | — | Estado de la cuenta (pendiente de activación) | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:177` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una cuenta con ese identificador; prefiera invitar en lugar de crear un duplicado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

