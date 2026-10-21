<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `iam`

- **Bloque:** Identidad y Seguridad (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)
- **Operaciones:** 31 (30 en el contrato, 1 sólo en el código)
- **Riesgo:** ALTO 14 · MEDIO 9 · BAJO 8
- **Tablas distintas que tocan:** 37
- **Respuestas de error y detalle contractual:** `openapi/endpoints/iam.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | DESCONOCIDO | `/iam/auth` | Entrega el par de tokens según el modo configurado. Con la cookie apagada —el default— devuelve la respuesta tal cual y el contrato no cambia en absoluto. Con la cookie encendida escribe el refresh token en una cookie httpOnly y **lo quita del cuerpo**: dejarlo en los dos sitios no protegería de nada, porque el objetivo del ejercicio es que el token deje de estar al alcance de JavaScript. | BAJO | 0 | sesión (sin roles) |
| 2 | POST | `/iam/auth/activate` | Activar la cuenta con el token de un solo uso y fijar la contraseña | ALTO | 7 | pública |
| 3 | POST | `/iam/auth/forgot-password` | Solicitar el restablecimiento de la contraseña | ALTO | 11 | pública |
| 4 | POST | `/iam/auth/login` | Iniciar sesión con email o documento de identidad y contraseña | ALTO | 21 | pública |
| 5 | POST | `/iam/auth/logout` | Cerrar la sesión actual del usuario | ALTO | 4 | sesión (sin roles) |
| 6 | POST | `/iam/auth/logout-all` | Cerrar todas las sesiones del usuario actual | ALTO | 4 | sesión (sin roles) |
| 7 | POST | `/iam/auth/register-organization` | Registrar una organización con su cuenta owner | ALTO | 17 | pública |
| 8 | POST | `/iam/auth/register-patient` | Registrarse como paciente con documento de identidad | ALTO | 18 | pública |
| 9 | POST | `/iam/auth/register-practitioner` | Registrarse como profesional de salud con su matrícula | ALTO | 30 | pública |
| 10 | POST | `/iam/auth/resend-verification` | Reenviar el enlace de verificación del correo | ALTO | 9 | pública |
| 11 | POST | `/iam/auth/reset-password` | Fijar una contraseña nueva con el token recibido por correo | ALTO | 8 | pública |
| 12 | POST | `/iam/auth/sessions/purge` | Expirar sesiones y tokens vencidos | MEDIO | 3 | SECURITY_ADMIN |
| 13 | POST | `/iam/auth/token/refresh` | Rotar el refresh token | ALTO | 15 | pública |
| 14 | POST | `/iam/auth/verify-email` | Verificar el correo con el token recibido | ALTO | 4 | pública |
| 15 | GET | `/iam/users` | Listado paginado de usuarios | BAJO | 2 | SECURITY_ADMIN |
| 16 | POST | `/iam/users` | Crear un usuario con credencial de contraseña y rol inicial | MEDIO | 6 | SECURITY_ADMIN |
| 17 | GET | `/iam/users/{id}` | Ficha de un usuario | BAJO | 1 | SECURITY_ADMIN |
| 18 | POST | `/iam/users/{id}/anonymize` | Anonimizar (DSAR) la cuenta | MEDIO | 8 | SECURITY_ADMIN |
| 19 | GET | `/iam/users/{id}/credentials` | Credenciales del usuario | BAJO | 2 | SECURITY_ADMIN |
| 20 | POST | `/iam/users/{id}/credentials/{cid}/revoke` | Revocar una credencial del usuario | MEDIO | 3 | SECURITY_ADMIN |
| 21 | POST | `/iam/users/{id}/credentials/federated` | Enlazar una credencial de identidad federada | MEDIO | 4 | SECURITY_ADMIN |
| 22 | GET | `/iam/users/{id}/devices` | Dispositivos del usuario | BAJO | 2 | SECURITY_ADMIN |
| 23 | POST | `/iam/users/{id}/devices` | Registrar un dispositivo del usuario | ALTO | 3 | sesión (sin roles) |
| 24 | GET | `/iam/users/{id}/global-roles` | Roles globales del usuario | BAJO | 2 | SECURITY_ADMIN |
| 25 | POST | `/iam/users/{id}/global-roles` | Conceder o revocar un rol global | MEDIO | 5 | SECURITY_ADMIN |
| 26 | POST | `/iam/users/{id}/lock` | Bloquear la cuenta y revocar sus sesiones | MEDIO | 7 | SECURITY_ADMIN |
| 27 | GET | `/iam/users/{id}/mfa-factors` | Factores de MFA del usuario | BAJO | 2 | SECURITY_ADMIN |
| 28 | POST | `/iam/users/{id}/mfa-factors` | Enrolar o verificar un factor MFA | ALTO | 6 | sesión (sin roles) |
| 29 | GET | `/iam/users/{id}/sessions` | Sesiones del usuario | BAJO | 2 | SECURITY_ADMIN |
| 30 | POST | `/iam/users/assisted-practitioner-registration` | Alta administrativa de un profesional (devuelve token de activación) | MEDIO | 30 | SECURITY_ADMIN |
| 31 | POST | `/iam/users/assisted-registration` | Registro asistido de un paciente (devuelve token de activación) | MEDIO | 6 | CLINICIAN, SECURITY_ADMIN |

---

## 1. DESCONOCIDO /iam/auth

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Entrega el par de tokens según el modo configurado. Con la cookie apagada —el default— devuelve la respuesta tal cual y el contrato no cambia en absoluto. Con la cookie encendida escribe el refresh token en una cookie httpOnly y **lo quita del cuerpo**: dejarlo en los dos sitios no protegería de nada, porque el objetivo del ejercicio es que el token deje de estar al alcance de JavaScript.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.deliverTokens` — `src/modules/iam/controllers/iam-auth.controller.ts:311`

### Qué es y para qué sirve (negocio)

Entrega el par de tokens según el modo configurado. Con la cookie apagada —el default— devuelve la respuesta tal cual y el contrato no cambia en absoluto. Con la cookie encendida escribe el refresh token en una cookie httpOnly y **lo quita del cuerpo**: dejarlo en los dos sitios no protegería de nada, porque el objetivo del ejercicio es que el token deje de estar al alcance de JavaScript. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`DESCONOCIDO /iam/auth` la atiende `IamAuthController.deliverTokens` (src/modules/iam/controllers/iam-auth.controller.ts:311). Exige sesión; el controlador no declara roles. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/controllers/iam-auth.controller.ts:311` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/iam/controllers/iam-auth.controller.ts:311`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `TokenResponseDto` · DTO `TokenResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `accessToken` | `string` | Sí | — | — | JWT de acceso | `src/modules/iam/dto/token-response.dto.ts:9` |
| `refreshToken` | `string` | Sí | — | — | Refresh token en crudo; solo se entrega una vez | `src/modules/iam/dto/token-response.dto.ts:17` |
| `expiresAt` | `string` | Sí | formato date-time | — | Expiración de la sesión | `src/modules/iam/dto/token-response.dto.ts:27` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 2. POST /iam/auth/activate

- **Origen:** CONTRATO
- **Nombre:** Activar la cuenta con el token de un solo uso y fijar la contraseña
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.activate` — `src/modules/iam/controllers/iam-auth.controller.ts:194`

### Qué es y para qué sirve (negocio)

Activar la cuenta con el token de un solo uso y fijar la contraseña. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/activate` la atiende `IamAuthController.activate` (src/modules/iam/controllers/iam-auth.controller.ts:194). Es una ruta pública: no exige token. Valida el cuerpo como `ActivateAccountDto` (2 campos, 2 obligatorios). Delega en `IamAssistedRegistrationService.activateAccount`. Crea filas en iam.security_events. Actualiza iam.account_activations, iam.authentication_credentials, iam.users. Lee iam.account_activations, iam.authentication_credentials, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/controllers/iam-auth.controller.ts:194` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/controllers/iam-auth.controller.ts:194` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.account_activations` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.activate → IamAssistedRegistrationService.activateAccount | `src/modules/iam/services/iam-assisted-registration.service.ts:222` |
| `iam.account_activations` | LEE | LEE | DIRECTA | IamAuthController.activate → IamAssistedRegistrationService.activateAccount → AccountActivationsRepository.findByTokenHash | `src/modules/iam/repositories/account-activations.repository.ts:67` |
| `iam.authentication_credentials` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.activate → IamAssistedRegistrationService.activateAccount | `src/modules/iam/services/iam-assisted-registration.service.ts:258` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.activate → IamAssistedRegistrationService.activateAccount → CredentialsRepository.findPendingPasswordByUser | `src/modules/iam/repositories/credentials.repository.ts:114` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.activate → IamAssistedRegistrationService.activateAccount → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.activate → IamAssistedRegistrationService.activateAccount | `src/modules/iam/services/iam-assisted-registration.service.ts:268` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.activate → IamAssistedRegistrationService.activateAccount → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |

### Cuerpo — DTO `ActivateAccountDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `activationToken` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Token de activación de un solo uso recibido por canal seguro | `src/modules/iam/dto/activate-account.dto.ts:19` |
| `newPassword` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | Contraseña definitiva elegida por el titular (se persiste solo su hash argon2id) | `src/modules/iam/dto/activate-account.dto.ts:31` |

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
| `userId` | `string` | Sí | formato uuid | — | Id de la cuenta activada | `src/modules/iam/dto/activate-account.dto.ts:40` |
| `status` | `string` | Sí | — | — | Estado resultante de la cuenta | `src/modules/iam/dto/activate-account.dto.ts:49` |
| `activated` | `boolean` | Sí | — | — | true si la activación se aplicó | `src/modules/iam/dto/activate-account.dto.ts:55` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 3. POST /iam/auth/forgot-password

- **Origen:** CONTRATO
- **Nombre:** Solicitar el restablecimiento de la contraseña
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.forgotPassword` — `src/modules/iam/controllers/iam-auth.controller.ts:240`

### Qué es y para qué sirve (negocio)

Solicitar el restablecimiento de la contraseña. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/forgot-password` la atiende `IamAuthController.forgotPassword` (src/modules/iam/controllers/iam-auth.controller.ts:240). Es una ruta pública: no exige token. Valida el cuerpo como `ForgotPasswordDto` (1 campo, 1 obligatorio). Delega en `IamPasswordResetService.requestReset`. Crea filas en iam.password_resets, iam.security_events, messaging.notification_requests. Actualiza iam.password_resets. Lee iam.authentication_credentials, iam.email_verifications, iam.users, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/controllers/iam-auth.controller.ts:240` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 5, ttl: 60_000 } }) | `src/modules/iam/controllers/iam-auth.controller.ts:240` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → CredentialsRepository.findActivePasswordBySubject | `src/modules/iam/repositories/credentials.repository.ts:59` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.resolveEmail → EmailVerificationsRepository.findLatestByUser | `src/modules/iam/repositories/email-verifications.repository.ts:85` |
| `iam.password_resets` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → PasswordResetsRepository.revokeActiveForUser | `src/modules/iam/repositories/password-resets.repository.ts:74` |
| `iam.password_resets` | ESCRIBE | CREA | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → PasswordResetsRepository.create | `src/modules/iam/repositories/password-resets.repository.ts:38` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.sendResetEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.sendResetEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.sendResetEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.sendResetEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.sendResetEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |

### Cuerpo — DTO `ForgotPasswordDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `identifier` | `string` | Sí | longitud mínima 1; longitud máxima 320 | `@IsString()` `@IsNotEmpty()` `@MaxLength(320)` | Correo o documento con el que la persona inicia sesión | `src/modules/iam/dto/password-reset.dto.ts:23` |

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
| `message` | `string` | Sí | — | — | Mensaje neutro, idéntico exista o no la cuenta, para no confirmar registros | `src/modules/iam/dto/password-reset.dto.ts:42` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/controllers/iam-auth.controller.spec.ts:150` |

### Flujos

_Se completa en la fase de flujos._

---

## 4. POST /iam/auth/login

- **Origen:** CONTRATO
- **Nombre:** Iniciar sesión con email o documento de identidad y contraseña
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.login` — `src/modules/iam/controllers/iam-auth.controller.ts:210`

### Qué es y para qué sirve (negocio)

Iniciar sesión con email o documento de identidad y contraseña. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/login` la atiende `IamAuthController.login` (src/modules/iam/controllers/iam-auth.controller.ts:210). Es una ruta pública: no exige token. Valida el cuerpo como `LoginDto` (4 campos, 1 obligatorio). Delega en `IamAuthService.login`. Crea filas en iam.account_lockouts, iam.refresh_tokens, iam.security_events, iam.sessions. Actualiza iam.account_lockouts, iam.refresh_tokens, iam.sessions, iam.users. Lee authz.roles, authz.user_role_assignments, directory.tenant_memberships, directory.tenants, iam.account_lockouts, iam.authentication_credentials, iam.security_events, iam.sessions y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/controllers/iam-auth.controller.ts:210` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/controllers/iam-auth.controller.ts:210` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.mergeRoleCodes → AuthzEffectiveRolesService.codesForUser | `src/modules/authz/services/authz-effective-roles.service.ts:58` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.mergeRoleCodes → AuthzEffectiveRolesService.codesForUser → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:81` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadActiveTenantIds | `src/modules/iam/services/iam-auth.service.ts:167` |
| `directory.tenants` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadTenantNames | `src/modules/iam/services/iam-auth.service.ts:258` |
| `iam.account_lockouts` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword | `src/modules/iam/services/iam-auth.service.ts:677` |
| `iam.account_lockouts` | ESCRIBE | CREA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → AccountLockoutsRepository.create | `src/modules/iam/repositories/account-lockouts.repository.ts:35` |
| `iam.account_lockouts` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → AccountLockoutsRepository.findActiveForUser | `src/modules/iam/repositories/account-lockouts.repository.ts:55` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → CredentialsRepository.findActivePasswordBySubject | `src/modules/iam/repositories/credentials.repository.ts:59` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/repositories/refresh-tokens.repository.ts:75` |
| `iam.refresh_tokens` | ESCRIBE | CREA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → RefreshTokensRepository.create | `src/modules/iam/repositories/refresh-tokens.repository.ts:38` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.security_events` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → SecurityEventsRepository.countFailedLoginsSince | `src/modules/iam/repositories/security-events.repository.ts:66` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → SessionsRepository.revokeAllActiveForUser | `src/modules/iam/repositories/sessions.repository.ts:104` |
| `iam.sessions` | ESCRIBE | CREA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → SessionsRepository.create | `src/modules/iam/repositories/sessions.repository.ts:43` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → SessionsRepository.activeSessionIdsForUser | `src/modules/iam/repositories/sessions.repository.ts:94` |
| `iam.user_global_roles` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → UserGlobalRolesRepository.findActiveForUser | `src/modules/iam/repositories/user-global-roles.repository.ts:57` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin | `src/modules/iam/services/iam-auth.service.ts:383` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Cuerpo — DTO `LoginDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `email` | `string` | No | formato email; longitud máxima 320 | `@ValidateIf((dto: LoginDto) => dto.nationalId === undefined)` `@IsEmail()` `@MaxLength(320)` | — | `src/modules/iam/dto/login.dto.ts:28` |
| `nationalId` | `string` | No | longitud máxima 40 | `@IsOptional()` `@IsString()` `@MaxLength(40)` | Documento de identidad (CI) | `src/modules/iam/dto/login.dto.ts:37` |
| `password` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/dto/login.dto.ts:45` |
| `mfaCode` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | Código MFA de un solo uso, si el usuario lo tiene activo | `src/modules/iam/dto/login.dto.ts:56` |

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
| `accessToken` | `string` | Sí | — | — | JWT de acceso | `src/modules/iam/dto/token-response.dto.ts:9` |
| `refreshToken` | `string` | Sí | — | — | Refresh token en crudo; solo se entrega una vez | `src/modules/iam/dto/token-response.dto.ts:17` |
| `expiresAt` | `string` | Sí | formato date-time | — | Expiración de la sesión | `src/modules/iam/dto/token-response.dto.ts:27` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-realtime-chat.int-spec.ts:92` |
| INTEGRACION | `test/integration/fx1-doctor-publica-agenda.int-spec.ts:45` |
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:68` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:102` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:84` |
| INTEGRACION | `test/integration/fx5-motivos-de-bloqueo.int-spec.ts:61` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:81` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:71` |
| INTEGRACION | `test/integration/iam.int-spec.ts:80` |
| INTEGRACION | `test/integration/identity-verification-self-service.int-spec.ts:62` |
| INTEGRACION | `test/integration/observability.int-spec.ts:76` |
| INTEGRACION | `test/integration/patient-diagnostic-orders.int-spec.ts:56` |
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:58` |
| INTEGRACION | `test/integration/refresh-cookie.int-spec.ts:57` |
| INTEGRACION | `test/integration/tj1-onboarding-medico.int-spec.ts:96` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:129` |
| CONTROLADOR | `src/modules/iam/controllers/iam-auth.controller.spec.ts:72` |

### Flujos

_Se completa en la fase de flujos._

---

## 5. POST /iam/auth/logout

- **Origen:** CONTRATO
- **Nombre:** Cerrar la sesión actual del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.logout` — `src/modules/iam/controllers/iam-auth.controller.ts:328`

### Qué es y para qué sirve (negocio)

Cerrar la sesión actual del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/logout` la atiende `IamAuthController.logout` (src/modules/iam/controllers/iam-auth.controller.ts:328). Exige sesión; el controlador no declara roles. Delega en `IamAuthService.logout`. Crea filas en iam.security_events. Actualiza iam.refresh_tokens, iam.sessions. Lee iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/controllers/iam-auth.controller.ts:328` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/controllers/iam-auth.controller.ts:328` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.logout → IamAuthService.logout → RefreshTokensRepository.revokeBySessionId | `src/modules/iam/repositories/refresh-tokens.repository.ts:62` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.logout → IamAuthService.logout → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.logout → IamAuthService.logout → SessionsRepository.revokeById | `src/modules/iam/repositories/sessions.repository.ts:82` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAuthController.logout → IamAuthService.logout → SessionsRepository.findActiveByTokenId | `src/modules/iam/repositories/sessions.repository.ts:74` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LogoutResultDto>` · DTO `LogoutResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `revoked` | `boolean` | Sí | — | — | Si la sesión quedó revocada en esta llamada | `src/modules/iam/dto/operation-result.dto.ts:22` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/refresh-cookie.int-spec.ts:151` |

### Flujos

_Se completa en la fase de flujos._

---

## 6. POST /iam/auth/logout-all

- **Origen:** CONTRATO
- **Nombre:** Cerrar todas las sesiones del usuario actual
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.logoutAll` — `src/modules/iam/controllers/iam-auth.controller.ts:348`

### Qué es y para qué sirve (negocio)

Cerrar todas las sesiones del usuario actual. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/logout-all` la atiende `IamAuthController.logoutAll` (src/modules/iam/controllers/iam-auth.controller.ts:348). Exige sesión; el controlador no declara roles. Delega en `IamAuthService.logoutAll`. Crea filas en iam.security_events. Actualiza iam.refresh_tokens, iam.sessions. Lee iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/controllers/iam-auth.controller.ts:348` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/controllers/iam-auth.controller.ts:348` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.logoutAll → IamAuthService.logoutAll → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/repositories/refresh-tokens.repository.ts:75` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.logoutAll → IamAuthService.logoutAll → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.logoutAll → IamAuthService.logoutAll → SessionsRepository.revokeAllActiveForUser | `src/modules/iam/repositories/sessions.repository.ts:104` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAuthController.logoutAll → IamAuthService.logoutAll → SessionsRepository.activeSessionIdsForUser | `src/modules/iam/repositories/sessions.repository.ts:94` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LogoutAllResultDto>` · DTO `LogoutAllResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `revokedSessions` | `number` | Sí | — | — | Nº de sesiones revocadas | `src/modules/iam/dto/operation-result.dto.ts:9` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:177` |
| CONTROLADOR | `src/modules/iam/controllers/iam-auth.controller.spec.ts:92` |

### Flujos

_Se completa en la fase de flujos._

---

## 7. POST /iam/auth/register-organization

- **Origen:** CONTRATO
- **Nombre:** Registrar una organización con su cuenta owner
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.registerOrganization` — `src/modules/iam/controllers/iam-auth.controller.ts:115`

### Qué es y para qué sirve (negocio)

Registrar una organización con su cuenta owner. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/register-organization` la atiende `IamAuthController.registerOrganization` (src/modules/iam/controllers/iam-auth.controller.ts:115). Es una ruta pública: no exige token. Valida el cuerpo como `RegisterOrganizationDto` (56 campos, 7 obligatorios). Delega en `IamOrganizationSelfRegistrationService.registerOrganization`. Crea filas en directory.tenant_memberships, directory.tenants, iam.authentication_credentials, iam.email_verifications, iam.security_events, iam.user_global_roles, iam.users, insurance.insurance_brokers y 2 más. Lee directory.tenants, iam.authentication_credentials, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences, terminology.catalog_concepts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/controllers/iam-auth.controller.ts:115` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/controllers/iam-auth.controller.ts:115` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `directory.tenants` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantsRepository.create | `src/modules/directory/repositories/tenants.repository.ts:131` |
| `directory.tenants` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantsRepository.findByCode | `src/modules/directory/repositories/tenants.repository.ts:76` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → CredentialsRepository.createPassword | `src/modules/iam/repositories/credentials.repository.ts:183` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/repositories/credentials.repository.ts:100` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → EmailVerificationsRepository.create | `src/modules/iam/repositories/email-verifications.repository.ts:41` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → UserGlobalRolesRepository.create | `src/modules/iam/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → UsersRepository.create | `src/modules/iam/repositories/users.repository.ts:49` |
| `insurance.insurance_brokers` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantTypeProfileService.materializeProfile → CatalogRepository.createBroker | `src/modules/insurance/repositories/catalog.repository.ts:213` |
| `insurance.insurance_carriers` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantTypeProfileService.materializeProfile → CatalogRepository.createCarrier | `src/modules/insurance/repositories/catalog.repository.ts:62` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → TenantTypeProfileService.assertConceptsExist → CatalogConceptsRepository.findByIds | `src/modules/terminology/repositories/catalog-concepts.repository.ts:172` |

### Cuerpo — DTO `RegisterOrganizationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `organization` | `RegisterOrganizationDetailsDto` | Sí | — | `@IsNotEmptyObject()` `@ValidateNested()` `@Type(() => RegisterOrganizationDetailsDto)` | — | `src/modules/iam/dto/register-organization.dto.ts:244` |
| `organization.code` | `string` | Sí | longitud mínima 3; longitud máxima 100; patrón runtime /^[A-Za-z0-9._-]+$/ | `@IsString()` `@MinLength(3)` `@MaxLength(100)` `@Matches(/^[A-Za-z0-9._-]+$/, { message: 'El código sólo admite letras, dígitos, punto, guion y guion bajo', })` | Código único global de la organización | `src/modules/iam/dto/register-organization.dto.ts:40` |
| `organization.legalName` | `string` | Sí | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Razón social / nombre legal | `src/modules/iam/dto/register-organization.dto.ts:49` |
| `organization.tradeName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Nombre comercial | `src/modules/iam/dto/register-organization.dto.ts:58` |
| `organization.tenantType` | `string` | Sí | valores: PROVIDER, PAYER, BROKER, UNIVERSITY, PHARMACY, HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER, HEALTH_BUSINESS | `@IsIn(TENANT_TYPE_CODES)` | Tipo de organización. Obligatorio: cada tipo exige sus propios datos. PAYER exige el bloque `payer` y BROKER el bloque `broker`. El resto —PROVIDER, UNIVERSITY, PHARMACY y las cuatro institucionales (HOSPITAL, MEDICAL_OFFICE, NURSING, HEALTH_OTHER) y HEALTH_BUSINESS— exigen país y jurisdicción, que es lo que determina bajo qué regulador operan. | `src/modules/iam/dto/register-organization.dto.ts:76` |
| `organization.payer` | `PayerProfileDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => PayerProfileDto)` | — | `src/modules/iam/dto/register-organization.dto.ts:85` |
| `organization.payer.carrierCode` | `string` | No | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | Código de la aseguradora | `src/modules/directory/dto/tenant-type-profile.dto.ts:25` |
| `organization.payer.sigla` | `string` | No | longitud mínima 1; longitud máxima 20 | `@IsString()` `@MinLength(1)` `@MaxLength(20)` | Sigla de la aseguradora | `src/modules/directory/dto/tenant-type-profile.dto.ts:38` |
| `organization.payer.address` | `string` | No | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Dirección de la aseguradora | `src/modules/directory/dto/tenant-type-profile.dto.ts:47` |
| `organization.payer.regulatorIdentifier` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Identificador ante el regulador de seguros | `src/modules/directory/dto/tenant-type-profile.dto.ts:59` |
| `organization.payer.jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/directory/dto/tenant-type-profile.dto.ts:67` |
| `organization.broker` | `BrokerProfileDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => BrokerProfileDto)` | — | `src/modules/iam/dto/register-organization.dto.ts:94` |
| `organization.broker.id` | `string` | No | formato uuid | — | — | sin fuente |
| `organization.broker.brokerCode` | `string` | No | — | — | — | sin fuente |
| `organization.broker.legalName` | `string` | No | — | — | — | sin fuente |
| `organization.broker.licenseNumber` | `string` | No | admite null | — | — | sin fuente |
| `organization.broker.jurisdiction` | `InsuranceConceptDto` | No | admite null | — | — | sin fuente |
| `organization.broker.jurisdiction.code` | `string` | No | — | — | — | sin fuente |
| `organization.broker.jurisdiction.display` | `string` | No | — | — | — | sin fuente |
| `organization.broker.status` | `InsuranceConceptDto` | No | — | — | — | sin fuente |
| `organization.broker.status.code` | `string` | No | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `organization.broker.status.display` | `string` | No | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `organization.broker.verification` | `InsuranceConceptDto` | No | — | — | — | sin fuente |
| `organization.broker.verification.code` | `string` | No | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `organization.broker.verification.display` | `string` | No | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `organization.broker.independent` | `boolean` | No | — | — | — | sin fuente |
| `organization.broker.currentCarrierCount` | `number` | No | — | — | — | sin fuente |
| `organization.broker.createdAt` | `string` | No | formato date-time | — | — | sin fuente |
| `organization.broker.agreements` | `array<BrokerAgreementDto>` | No | — | — | — | sin fuente |
| `organization.broker.agreements[].id` | `string` | No | formato uuid | — | — | `src/modules/insurance/dto/read.dto.ts:273` |
| `organization.broker.agreements[].insuranceCarrierId` | `string` | No | formato uuid | — | — | `src/modules/insurance/dto/read.dto.ts:277` |
| `organization.broker.agreements[].carrierLegalName` | `string` | No | — | — | — | `src/modules/insurance/dto/read.dto.ts:281` |
| `organization.broker.agreements[].agreementCode` | `string` | No | — | — | — | `src/modules/insurance/dto/read.dto.ts:285` |
| `organization.broker.agreements[].commissionModel` | `InsuranceConceptDto` | No | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:289` |
| `organization.broker.agreements[].commissionModel.code` | `string` | No | — | — | — | sin fuente |
| `organization.broker.agreements[].commissionModel.display` | `string` | No | — | — | — | sin fuente |
| `organization.broker.agreements[].effectiveFrom` | `string` | No | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:293` |
| `organization.broker.agreements[].effectiveTo` | `string` | No | admite null | — | — | `src/modules/insurance/dto/read.dto.ts:297` |
| `organization.broker.agreements[].status` | `InsuranceConceptDto` | No | — | — | — | `src/modules/insurance/dto/read.dto.ts:301` |
| `organization.broker.agreements[].status.code` | `string` | No | — | — | — | `src/modules/insurance/dto/read.dto.ts:14` |
| `organization.broker.agreements[].status.display` | `string` | No | — | — | — | `src/modules/insurance/dto/read.dto.ts:18` |
| `organization.broker.agreements[].current` | `boolean` | No | — | — | — | `src/modules/insurance/dto/read.dto.ts:312` |
| `organization.broker.agreements[].contractFileId` | `string` | No | formato uuid; admite null | — | — | `src/modules/insurance/dto/read.dto.ts:316` |
| `organization.broker.publicProfileId` | `string` | No | formato uuid; admite null | — | — | sin fuente |
| `organization.countryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/dto/register-organization.dto.ts:102` |
| `organization.jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/dto/register-organization.dto.ts:110` |
| `organization.timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA | `src/modules/iam/dto/register-organization.dto.ts:123` |
| `owner` | `RegisterOrganizationOwnerDto` | Sí | — | `@IsNotEmptyObject()` `@ValidateNested()` `@Type(() => RegisterOrganizationOwnerDto)` | — | `src/modules/iam/dto/register-organization.dto.ts:253` |
| `owner.email` | `string` | Sí | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Correo con el que el owner iniciará sesión | `src/modules/iam/dto/register-organization.dto.ts:144` |
| `owner.password` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | — | `src/modules/iam/dto/register-organization.dto.ts:153` |
| `owner.name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationOwnerDto) => dto.displayName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/dto/register-organization.dto.ts:168` |
| `owner.middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/dto/register-organization.dto.ts:177` |
| `owner.lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationOwnerDto) => dto.displayName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/dto/register-organization.dto.ts:189` |
| `owner.motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/dto/register-organization.dto.ts:198` |
| `owner.displayName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Forma anterior de declarar el nombre. Preferí name/lastName. | `src/modules/iam/dto/register-organization.dto.ts:217` |
| `owner.timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/dto/register-organization.dto.ts:226` |

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

</details>

### Respuesta — `Promise<RegisterOrganizationResponseDto>` · DTO `RegisterOrganizationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | — | Identificador del tenant creado. | `src/modules/iam/dto/register-organization.dto.ts:262` |
| `code` | `string` | Sí | — | — | Código único de la organización, tal como quedó persistido. | `src/modules/iam/dto/register-organization.dto.ts:268` |
| `ownerUserId` | `string` | Sí | formato uuid | — | Identificador de la cuenta owner creada. | `src/modules/iam/dto/register-organization.dto.ts:274` |
| `membershipId` | `string` | Sí | formato uuid | — | Identificador de la membresía OWNER que vincula cuenta y organización. | `src/modules/iam/dto/register-organization.dto.ts:280` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del tenant (pendiente de verificación) | `src/modules/iam/dto/register-organization.dto.ts:289` |
| `emailVerificationSent` | `boolean` | Sí | — | — | Si se pudo encolar el correo de verificación | `src/modules/iam/dto/register-organization.dto.ts:297` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:94` |
| CONTROLADOR | `src/modules/iam/controllers/iam-auth.controller.spec.ts:134` |

### Flujos

_Se completa en la fase de flujos._

---

## 8. POST /iam/auth/register-patient

- **Origen:** CONTRATO
- **Nombre:** Registrarse como paciente con documento de identidad
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.registerPatient` — `src/modules/iam/controllers/iam-auth.controller.ts:94`

### Qué es y para qué sirve (negocio)

Registrarse como paciente con documento de identidad. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/register-patient` la atiende `IamAuthController.registerPatient` (src/modules/iam/controllers/iam-auth.controller.ts:94). Es una ruta pública: no exige token. Valida el cuerpo como `RegisterPatientDto` (19 campos, 2 obligatorios). Delega en `IamPatientSelfRegistrationService.registerPatient`. Crea filas en common.contact_points, common.identifiers, directory.tenant_memberships, iam.authentication_credentials, iam.email_verifications, iam.security_events, iam.user_global_roles, iam.users y 5 más. Lee iam.authentication_credentials, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/controllers/iam-auth.controller.ts:94` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/controllers/iam-auth.controller.ts:94` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:135` |
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:90` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → CredentialsRepository.createPassword | `src/modules/iam/repositories/credentials.repository.ts:183` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/repositories/credentials.repository.ts:100` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → EmailVerificationsRepository.create | `src/modules/iam/repositories/email-verifications.repository.ts:41` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → UserGlobalRolesRepository.create | `src/modules/iam/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → UsersRepository.create | `src/modules/iam/repositories/users.repository.ts:49` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IamPatientSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IamPatientSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IamPatientSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IamPatientSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IamPatientSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.patient_profiles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → PatientProfilesRepository.create | `src/modules/profiles/repositories/patient-profiles.repository.ts:220` |
| `profiles.person_account_links` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → PersonAccountLinksRepository.create | `src/modules/profiles/repositories/person-account-links.repository.ts:50` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → PersonProfilesRepository.create | `src/modules/profiles/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → PersonsRepository.create | `src/modules/profiles/repositories/persons.repository.ts:115` |

### Cuerpo — DTO `RegisterPatientDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nationalId` | `string` | Sí | longitud mínima 4; longitud máxima 40; patrón runtime /^[A-Za-z0-9.-]+$/ | `@IsString()` `@MinLength(4)` `@MaxLength(40)` `@Matches(/^[A-Za-z0-9.-]+$/, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Documento de identidad con el que se iniciará sesión | `src/modules/iam/dto/register-patient.dto.ts:90` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `src/modules/iam/dto/register-patient.dto.ts:104` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | `@IsUUID()` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `src/modules/iam/dto/register-patient.dto.ts:127` |
| `password` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | — | `src/modules/iam/dto/register-patient.dto.ts:136` |
| `name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPatientDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/dto/register-patient.dto.ts:152` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/dto/register-patient.dto.ts:164` |
| `lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPatientDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/dto/register-patient.dto.ts:177` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/dto/register-patient.dto.ts:189` |
| `displayName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Forma anterior de declarar el nombre. Preferí name/lastName. | `src/modules/iam/dto/register-patient.dto.ts:208` |
| `email` | `string` | No | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | — | `src/modules/iam/dto/register-patient.dto.ts:232` |
| `birthDate` | `string` | No | formato date | `@IsISO8601()` | — | `src/modules/iam/dto/register-patient.dto.ts:243` |
| `phone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsString()` `@MaxLength(PHONE_MAX_LENGTH)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres | `src/modules/iam/dto/register-patient.dto.ts:264` |
| `occupationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ocupación del catálogo (VS_BO_OCCUPATION) | `src/modules/iam/dto/register-patient.dto.ts:282` |
| `occupationFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(OCCUPATION_FREE_TEXT_MAX_LENGTH)` | Ocupación en texto libre, para cuando no está en el catálogo | `src/modules/iam/dto/register-patient.dto.ts:295` |
| `gender` | `string` | No | valores: MALE, FEMALE, OTHER, UNKNOWN | `@IsOptional()` `@IsIn(ADMIN_GENDER_CODES)` | Género administrativo (HL7 AdministrativeGender) | `src/modules/iam/dto/register-patient.dto.ts:342` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | `@IsIn(BIRTH_SEX_CODES)` | Sexo asignado al nacer | `src/modules/iam/dto/register-patient.dto.ts:360` |
| `administrativeGenderConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/dto/register-patient.dto.ts:369` |
| `sexAtBirthConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/dto/register-patient.dto.ts:378` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/dto/register-patient.dto.ts:387` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "password": "ClaveSegura2026!"
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
  "gender": "MALE",
  "sexAtBirth": "MALE",
  "administrativeGenderConceptId": "00000000-0000-4000-8000-000000000001",
  "sexAtBirthConceptId": "00000000-0000-4000-8000-000000000001",
  "timeZone": "America/La_Paz"
}
```

</details>

### Respuesta — `Promise<RegisterPatientResponseDto>` · DTO `RegisterPatientResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/iam/dto/register-patient.dto.ts:564` |
| `personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/iam/dto/register-patient.dto.ts:570` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/iam/dto/register-patient.dto.ts:576` |
| `patientCode` | `string` | Sí | — | — | Código de paciente generado para el perfil. | `src/modules/iam/dto/register-patient.dto.ts:582` |
| `emailVerificationSent` | `boolean` | Sí | — | — | Si se encoló el correo de verificación. La cuenta es usable igual. | `src/modules/iam/dto/register-patient.dto.ts:591` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-realtime-chat.int-spec.ts:112` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:110` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:91` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:69` |
| INTEGRACION | `test/integration/identity-verification-self-service.int-spec.ts:51` |
| INTEGRACION | `test/integration/patient-diagnostic-orders.int-spec.ts:47` |
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:42` |
| INTEGRACION | `test/integration/tj1-onboarding-medico.int-spec.ts:198` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:120` |
| CONTROLADOR | `src/modules/iam/controllers/iam-auth.controller.spec.ts:117` |

### Flujos

_Se completa en la fase de flujos._

---

## 9. POST /iam/auth/register-practitioner

- **Origen:** CONTRATO
- **Nombre:** Registrarse como profesional de salud con su matrícula
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.registerPractitioner` — `src/modules/iam/controllers/iam-auth.controller.ts:137`

### Qué es y para qué sirve (negocio)

Registrarse como profesional de salud con su matrícula. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/register-practitioner` la atiende `IamAuthController.registerPractitioner` (src/modules/iam/controllers/iam-auth.controller.ts:137). Es una ruta pública: no exige token. Valida el cuerpo como `RegisterPractitionerDto` (25 campos, 4 obligatorios). Delega en `IamPractitionerSelfRegistrationService.registerPractitioner`. Crea filas en authz.user_role_assignments, common.contact_points, common.identifiers, directory.tenant_memberships, iam.account_activations, iam.authentication_credentials, iam.email_verifications, iam.security_events y 11 más. Lee authz.roles, authz.user_role_assignments, iam.authentication_credentials, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences, profiles.health_practitioner_profiles y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/controllers/iam-auth.controller.ts:137` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/controllers/iam-auth.controller.ts:137` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzEffectiveRolesService.ensureRoleByCode | `src/modules/authz/services/authz-effective-roles.service.ts:95` |
| `authz.user_role_assignments` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.create | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.findActive | `src/modules/authz/repositories/user-role-assignments.repository.ts:55` |
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:135` |
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:90` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `iam.account_activations` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AccountActivationsRepository.create | `src/modules/iam/repositories/account-activations.repository.ts:46` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CredentialsRepository.createPendingPassword | `src/modules/iam/repositories/credentials.repository.ts:165` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/repositories/credentials.repository.ts:100` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → EmailVerificationsRepository.create | `src/modules/iam/repositories/email-verifications.repository.ts:41` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → UserGlobalRolesRepository.create | `src/modules/iam/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → UsersRepository.create | `src/modules/iam/repositories/users.repository.ts:49` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.health_practitioner_profiles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → HealthPractitionerProfilesRepository.create | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:128` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → HealthPractitionerProfilesRepository.findByCode | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:72` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → JurisdictionAuthorizationsRepository.create | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:92` |
| `profiles.person_account_links` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PersonAccountLinksRepository.create | `src/modules/profiles/repositories/person-account-links.repository.ts:50` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PersonProfilesRepository.create | `src/modules/profiles/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PersonsRepository.create | `src/modules/profiles/repositories/persons.repository.ts:115` |
| `profiles.practitioner_languages` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PractitionerLanguagesRepository.create | `src/modules/profiles/repositories/practitioner-languages.repository.ts:62` |
| `profiles.practitioner_specialties` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PractitionerSpecialtiesRepository.create | `src/modules/profiles/repositories/practitioner-specialties.repository.ts:60` |
| `profiles.professional_credentials` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfessionalCredentialsRepository.create | `src/modules/profiles/repositories/professional-credentials.repository.ts:98` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:326` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:500` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:110` |

### Cuerpo — DTO `RegisterPractitionerDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `email` | `string` | Sí | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Correo que actúa como identidad de login | `src/modules/iam/dto/register-practitioner.dto.ts:48` |
| `password` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | — | `src/modules/iam/dto/register-practitioner.dto.ts:57` |
| `name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPractitionerDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/dto/register-practitioner.dto.ts:70` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/dto/register-practitioner.dto.ts:79` |
| `lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPractitionerDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/dto/register-practitioner.dto.ts:89` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/dto/register-practitioner.dto.ts:98` |
| `displayName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Forma anterior de declarar el nombre. Preferí name/lastName. | `src/modules/iam/dto/register-practitioner.dto.ts:117` |
| `licenseNumber` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Número de licencia o matrícula profesional | `src/modules/iam/dto/register-practitioner.dto.ts:129` |
| `credentialNumber` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Número del título profesional que respalda la licencia | `src/modules/iam/dto/register-practitioner.dto.ts:141` |
| `regulatoryAuthority` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Autoridad reguladora que emitió la licencia | `src/modules/iam/dto/register-practitioner.dto.ts:153` |
| `licenseIssueDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | Fecha de inscripción de la matrícula (ISO) | `src/modules/iam/dto/register-practitioner.dto.ts:166` |
| `professionalTitle` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/dto/register-practitioner.dto.ts:175` |
| `nationalId` | `string` | No | longitud máxima 40; patrón runtime /^[A-Za-z0-9.-]+$/ | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(/^[A-Za-z0-9.-]+$/, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Documento de identidad (se guarda como identificador oficial) | `src/modules/iam/dto/register-practitioner.dto.ts:218` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `src/modules/iam/dto/register-practitioner.dto.ts:240` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `src/modules/iam/dto/register-practitioner.dto.ts:261` |
| `phone` | `string` | No | longitud máxima 40; patrón runtime /^[+]?[0-9 ()-]{6,}$/ | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(/^[+]?[0-9 ()-]{6,}$/, { message: 'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion', })` | Teléfono de contacto en formato E.164 o nacional | `src/modules/iam/dto/register-practitioner.dto.ts:276` |
| `birthDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/iam/dto/register-practitioner.dto.ts:284` |
| `gender` | `string` | No | valores: MALE, FEMALE, OTHER, UNKNOWN | `@IsOptional()` `@IsIn(ADMIN_GENDER_CODES)` | Género administrativo (HL7 AdministrativeGender) | `src/modules/iam/dto/register-practitioner.dto.ts:295` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | `@IsOptional()` `@IsIn(BIRTH_SEX_CODES)` | Sexo asignado al nacer | `src/modules/iam/dto/register-practitioner.dto.ts:306` |
| `practitionerCategoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/dto/register-practitioner.dto.ts:315` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/dto/register-practitioner.dto.ts:323` |
| `credentialTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/dto/register-practitioner.dto.ts:331` |
| `languageConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/dto/register-practitioner.dto.ts:339` |
| `acceptsNewPatients` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/iam/dto/register-practitioner.dto.ts:348` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/dto/register-practitioner.dto.ts:357` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "email": "usuario@example.com",
  "password": "ClaveSegura2026!",
  "licenseNumber": "valor-ejemplo",
  "credentialNumber": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<RegisterPractitionerResponseDto>` · DTO `RegisterPractitionerResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | — | Cuenta creada, con la que ya puede iniciar sesión. | `src/modules/iam/dto/register-practitioner.dto.ts:366` |
| `personId` | `string` | Sí | formato uuid | — | Persona creada para el profesional. | `src/modules/iam/dto/register-practitioner.dto.ts:372` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | Perfil profesional (comparte id con la persona). | `src/modules/iam/dto/register-practitioner.dto.ts:378` |
| `practitionerCode` | `string` | Sí | — | — | Código interno asignado al profesional. | `src/modules/iam/dto/register-practitioner.dto.ts:384` |
| `licenseId` | `string` | Sí | formato uuid | — | Licencia registrada, pendiente de verificación por la plataforma. | `src/modules/iam/dto/register-practitioner.dto.ts:390` |
| `credentialId` | `string` | Sí | formato uuid | — | Credencial profesional creada, pendiente de verificación. Se devuelve porque `POST /profiles/credentials/{credentialId}/verify` —el acto que habilita al profesional a ejercer— la exige por id, y no había ninguna otra forma de obtenerla: el alta no la devolvía y `profiles` no expone ningún listado de credenciales. La verificación quedaba fuera de alcance salvo consultando la base de datos a mano. | `src/modules/iam/dto/register-practitioner.dto.ts:402` |
| `verificationStatus` | `string` | Sí | — | — | Estado de verificación del perfil al terminar el alta. Siempre PENDING: registrarse no habilita a ejercer. | `src/modules/iam/dto/register-practitioner.dto.ts:409` |
| `emailVerificationSent` | `boolean` | Sí | — | — | Si se pudo encolar el correo de verificación. | `src/modules/iam/dto/register-practitioner.dto.ts:415` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-realtime-chat.int-spec.ts:81` |
| INTEGRACION | `test/integration/fx1-doctor-publica-agenda.int-spec.ts:32` |
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:147` |
| INTEGRACION | `test/integration/fx3-agenda-respiro-y-avisos.int-spec.ts:89` |
| INTEGRACION | `test/integration/fx4-retirar-horario-publicado.int-spec.ts:71` |
| INTEGRACION | `test/integration/fx5-motivos-de-bloqueo.int-spec.ts:48` |
| INTEGRACION | `test/integration/fx7-motivo-visible-al-paciente.int-spec.ts:91` |
| INTEGRACION | `test/integration/fx8-recorrido-de-la-agenda.int-spec.ts:58` |
| INTEGRACION | `test/integration/tj1-onboarding-medico.int-spec.ts:84` |

### Flujos

_Se completa en la fase de flujos._

---

## 10. POST /iam/auth/resend-verification

- **Origen:** CONTRATO
- **Nombre:** Reenviar el enlace de verificación del correo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.resendVerification` — `src/modules/iam/controllers/iam-auth.controller.ts:167`

### Qué es y para qué sirve (negocio)

Reenviar el enlace de verificación del correo. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/resend-verification` la atiende `IamAuthController.resendVerification` (src/modules/iam/controllers/iam-auth.controller.ts:167). Es una ruta pública: no exige token. Valida el cuerpo como `ResendVerificationDto` (1 campo, 1 obligatorio). Delega en `IamEmailVerificationService.resend`. Crea filas en iam.email_verifications, messaging.notification_requests. Lee iam.authentication_credentials, iam.email_verifications, iam.users, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/controllers/iam-auth.controller.ts:167` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 5, ttl: 60_000 } }) | `src/modules/iam/controllers/iam-auth.controller.ts:167` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → CredentialsRepository.findActivePasswordBySubject | `src/modules/iam/repositories/credentials.repository.ts:59` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → EmailVerificationsRepository.create | `src/modules/iam/repositories/email-verifications.repository.ts:41` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → EmailVerificationsRepository.findLatestByUser | `src/modules/iam/repositories/email-verifications.repository.ts:85` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → IamEmailVerificationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → IamEmailVerificationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → IamEmailVerificationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → IamEmailVerificationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → IamEmailVerificationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |

### Cuerpo — DTO `ResendVerificationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `identifier` | `string` | Sí | longitud mínima 3; longitud máxima 320 | `@IsString()` `@MinLength(3)` `@MaxLength(320)` | Correo o documento de identidad con el que la persona inicia sesión | `src/modules/iam/dto/resend-verification.dto.ts:24` |

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
| `message` | `string` | Sí | — | — | Mensaje neutro, idéntico en todos los casos. | `src/modules/iam/dto/resend-verification.dto.ts:36` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 11. POST /iam/auth/reset-password

- **Origen:** CONTRATO
- **Nombre:** Fijar una contraseña nueva con el token recibido por correo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.resetPassword` — `src/modules/iam/controllers/iam-auth.controller.ts:260`

### Qué es y para qué sirve (negocio)

Fijar una contraseña nueva con el token recibido por correo. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/reset-password` la atiende `IamAuthController.resetPassword` (src/modules/iam/controllers/iam-auth.controller.ts:260). Es una ruta pública: no exige token. Valida el cuerpo como `ResetPasswordDto` (2 campos, 2 obligatorios). Delega en `IamPasswordResetService.resetPassword`. Crea filas en iam.security_events. Actualiza iam.authentication_credentials, iam.password_resets, iam.refresh_tokens, iam.sessions. Lee iam.authentication_credentials, iam.password_resets, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/controllers/iam-auth.controller.ts:260` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/controllers/iam-auth.controller.ts:260` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.resetPassword → IamPasswordResetService.resetPassword | `src/modules/iam/services/iam-password-reset.service.ts:229` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.resetPassword → IamPasswordResetService.resetPassword → CredentialsRepository.findActivePasswordBySubject | `src/modules/iam/repositories/credentials.repository.ts:59` |
| `iam.password_resets` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.resetPassword → IamPasswordResetService.resetPassword | `src/modules/iam/services/iam-password-reset.service.ts:213` |
| `iam.password_resets` | LEE | LEE | DIRECTA | IamAuthController.resetPassword → IamPasswordResetService.resetPassword → PasswordResetsRepository.findByTokenHash | `src/modules/iam/repositories/password-resets.repository.ts:58` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.resetPassword → IamPasswordResetService.resetPassword → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/repositories/refresh-tokens.repository.ts:75` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.resetPassword → IamPasswordResetService.resetPassword → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.resetPassword → IamPasswordResetService.resetPassword → SessionsRepository.revokeAllActiveForUser | `src/modules/iam/repositories/sessions.repository.ts:104` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAuthController.resetPassword → IamPasswordResetService.resetPassword → SessionsRepository.activeSessionIdsForUser | `src/modules/iam/repositories/sessions.repository.ts:94` |

### Cuerpo — DTO `ResetPasswordDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `token` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@IsNotEmpty()` `@MaxLength(200)` | Token recibido por correo | `src/modules/iam/dto/password-reset.dto.ts:54` |
| `newPassword` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | Contraseña nueva | `src/modules/iam/dto/password-reset.dto.ts:67` |

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
| `userId` | `string` | Sí | formato uuid | — | Usuario cuya clave cambió | `src/modules/iam/dto/password-reset.dto.ts:76` |
| `revokedSessions` | `number` | Sí | — | — | Sesiones revocadas: cambiar la clave cierra todas las sesiones abiertas | `src/modules/iam/dto/password-reset.dto.ts:85` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/controllers/iam-auth.controller.spec.ts:160` |

### Flujos

_Se completa en la fase de flujos._

---

## 12. POST /iam/auth/sessions/purge

- **Origen:** CONTRATO
- **Nombre:** Expirar sesiones y tokens vencidos
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.purge` — `src/modules/iam/controllers/iam-auth.controller.ts:360`

### Qué es y para qué sirve (negocio)

Expirar sesiones y tokens vencidos. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/sessions/purge` la atiende `IamAuthController.purge` (src/modules/iam/controllers/iam-auth.controller.ts:360). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamAuthService.purgeSessions`. Crea filas en iam.security_events. Actualiza iam.refresh_tokens, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/controllers/iam-auth.controller.ts:360` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.purge → IamAuthService.purgeSessions → RefreshTokensRepository.purgeExpired | `src/modules/iam/repositories/refresh-tokens.repository.ts:84` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.purge → IamAuthService.purgeSessions → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.purge → IamAuthService.purgeSessions → SessionsRepository.purgeExpired | `src/modules/iam/repositories/sessions.repository.ts:113` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PurgeResultDto>` · DTO `PurgeResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expiredSessions` | `number` | Sí | — | — | Nº de sesiones expiradas | `src/modules/iam/dto/operation-result.dto.ts:31` |
| `expiredTokens` | `number` | Sí | — | — | Nº de refresh tokens expirados | `src/modules/iam/dto/operation-result.dto.ts:37` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:148` |
| CONTROLADOR | `src/modules/iam/controllers/iam-auth.controller.spec.ts:99` |

### Flujos

_Se completa en la fase de flujos._

---

## 13. POST /iam/auth/token/refresh

- **Origen:** CONTRATO
- **Nombre:** Rotar el refresh token
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.refresh` — `src/modules/iam/controllers/iam-auth.controller.ts:275`

### Qué es y para qué sirve (negocio)

Rotar el refresh token. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/token/refresh` la atiende `IamAuthController.refresh` (src/modules/iam/controllers/iam-auth.controller.ts:275). Es una ruta pública: no exige token. Valida el cuerpo como `RefreshTokenDto` (1 campo, 0 obligatorios). Delega en `IamAuthService.refresh`. Crea filas en iam.refresh_tokens, iam.security_events. Actualiza iam.refresh_tokens, iam.sessions. Lee authz.roles, authz.user_role_assignments, directory.tenant_memberships, directory.tenants, iam.refresh_tokens, iam.sessions, iam.user_global_roles, iam.users y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/controllers/iam-auth.controller.ts:275` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 20, ttl: 60_000 } }) | `src/modules/iam/controllers/iam-auth.controller.ts:275` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.mergeRoleCodes → AuthzEffectiveRolesService.codesForUser | `src/modules/authz/services/authz-effective-roles.service.ts:58` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.mergeRoleCodes → AuthzEffectiveRolesService.codesForUser → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:81` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadActiveTenantIds | `src/modules/iam/services/iam-auth.service.ts:167` |
| `directory.tenants` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadTenantNames | `src/modules/iam/services/iam-auth.service.ts:258` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → RefreshTokensRepository.revokeBySessionId | `src/modules/iam/repositories/refresh-tokens.repository.ts:62` |
| `iam.refresh_tokens` | ESCRIBE | CREA | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → RefreshTokensRepository.create | `src/modules/iam/repositories/refresh-tokens.repository.ts:38` |
| `iam.refresh_tokens` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → RefreshTokensRepository.findByHash | `src/modules/iam/repositories/refresh-tokens.repository.ts:57` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → SessionsRepository.revokeById | `src/modules/iam/repositories/sessions.repository.ts:82` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → SessionsRepository.findById | `src/modules/iam/repositories/sessions.repository.ts:60` |
| `iam.user_global_roles` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → UserGlobalRolesRepository.findActiveForUser | `src/modules/iam/repositories/user-global-roles.repository.ts:57` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Cuerpo — DTO `RefreshTokenDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `refreshToken` | `string` | No | longitud mínima 1 | `@ValidateIf(() => !loadRefreshCookieEnv().enabled)` `@IsString()` `@MinLength(1)` | Refresh token en crudo emitido previamente. Obligatorio salvo que la API entregue el token como cookie httpOnly (AUTH_REFRESH_COOKIE_ENABLED), en cuyo caso se ignora y se lee de la cookie | `src/modules/iam/dto/refresh-token.dto.ts:28` |

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
| `accessToken` | `string` | Sí | — | — | JWT de acceso | `src/modules/iam/dto/token-response.dto.ts:9` |
| `refreshToken` | `string` | Sí | — | — | Refresh token en crudo; solo se entrega una vez | `src/modules/iam/dto/token-response.dto.ts:17` |
| `expiresAt` | `string` | Sí | formato date-time | — | Expiración de la sesión | `src/modules/iam/dto/token-response.dto.ts:27` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:97` |
| INTEGRACION | `test/integration/refresh-cookie.int-spec.ts:83` |
| CONTROLADOR | `src/modules/iam/controllers/iam-auth.controller.spec.ts:83` |

### Flujos

_Se completa en la fase de flujos._

---

## 14. POST /iam/auth/verify-email

- **Origen:** CONTRATO
- **Nombre:** Verificar el correo con el token recibido
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.verifyEmail` — `src/modules/iam/controllers/iam-auth.controller.ts:181`

### Qué es y para qué sirve (negocio)

Verificar el correo con el token recibido. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/verify-email` la atiende `IamAuthController.verifyEmail` (src/modules/iam/controllers/iam-auth.controller.ts:181). Es una ruta pública: no exige token. Valida el cuerpo como `VerifyEmailDto` (1 campo, 1 obligatorio). Delega en `IamPatientSelfRegistrationService.verifyEmail`. Actualiza iam.email_verifications, iam.users. Lee iam.email_verifications, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/controllers/iam-auth.controller.ts:181` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/controllers/iam-auth.controller.ts:181` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.email_verifications` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.verifyEmail → IamPatientSelfRegistrationService.verifyEmail | `src/modules/iam/services/iam-patient-self-registration.service.ts:540` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | IamAuthController.verifyEmail → IamPatientSelfRegistrationService.verifyEmail → EmailVerificationsRepository.findByTokenHash | `src/modules/iam/repositories/email-verifications.repository.ts:60` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.verifyEmail → IamPatientSelfRegistrationService.verifyEmail | `src/modules/iam/services/iam-patient-self-registration.service.ts:554` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.verifyEmail → IamPatientSelfRegistrationService.verifyEmail → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |

### Cuerpo — DTO `VerifyEmailDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `token` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/dto/register-patient.dto.ts:602` |

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
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/iam/dto/register-patient.dto.ts:611` |
| `emailVerified` | `boolean` | Sí | — | — | Valor de email verified mantenido por la instancia. | `src/modules/iam/dto/register-patient.dto.ts:617` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/controllers/iam-auth.controller.spec.ts:143` |

### Flujos

_Se completa en la fase de flujos._

---

## 15. GET /iam/users

- **Origen:** CONTRATO
- **Nombre:** Listado paginado de usuarios
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.searchUsers` — `src/modules/iam/controllers/iam-users.controller.ts:102`

### Qué es y para qué sirve (negocio)

Listado paginado de usuarios. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users` la atiende `IamUsersController.searchUsers` (src/modules/iam/controllers/iam-users.controller.ts:102). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.searchUsers`. Lee iam.authentication_credentials, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/controllers/iam-users.controller.ts:102` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.searchUsers → IamUsersReadService.searchUsers → CredentialsRepository.findBySubjectMatch | `src/modules/iam/repositories/credentials.repository.ts:84` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.searchUsers → IamUsersReadService.searchUsers → UsersRepository.searchPage | `src/modules/iam/repositories/users.repository.ts:130` |

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
| `items` | `array<UserListItemDto>` | Sí | — | — | Usuarios de esta página, ordenados por nombre visible. | `src/modules/iam/dto/iam-user-read.dto.ts:70` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del usuario. | `src/modules/iam/dto/iam-user-read.dto.ts:19` |
| `items[].displayName` | `string` | Sí | — | — | Nombre visible. | `src/modules/iam/dto/iam-user-read.dto.ts:25` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado de la cuenta. | `src/modules/iam/dto/iam-user-read.dto.ts:31` |
| `items[].mfaStatusConceptId` | `string` | No | formato uuid | — | Estado del segundo factor. | `src/modules/iam/dto/iam-user-read.dto.ts:37` |
| `items[].emailVerified` | `boolean` | Sí | — | — | Si el correo consta verificado. | `src/modules/iam/dto/iam-user-read.dto.ts:43` |
| `items[].phoneVerified` | `boolean` | Sí | — | — | Si el teléfono consta verificado. | `src/modules/iam/dto/iam-user-read.dto.ts:49` |
| `items[].lastLoginAt` | `string` | No | formato date-time; admite null | — | Último ingreso registrado. | `src/modules/iam/dto/iam-user-read.dto.ts:55` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta de la cuenta. | `src/modules/iam/dto/iam-user-read.dto.ts:61` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página. | `src/modules/iam/dto/iam-user-read.dto.ts:76` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/iam/dto/iam-user-read.dto.ts:82` |
| `nextCursor` | `string` | No | admite null | — | Cursor opaco de continuación, o `null` si ésta es la última página. | `src/modules/iam/dto/iam-user-read.dto.ts:88` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/controllers/iam-users.controller.spec.ts:147` |

### Flujos

_Se completa en la fase de flujos._

---

## 16. POST /iam/users

- **Origen:** CONTRATO
- **Nombre:** Crear un usuario con credencial de contraseña y rol inicial
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.createUser` — `src/modules/iam/controllers/iam-users.controller.ts:266`

### Qué es y para qué sirve (negocio)

Crear un usuario con credencial de contraseña y rol inicial. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users` la atiende `IamUsersController.createUser` (src/modules/iam/controllers/iam-users.controller.ts:266). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateUserDto` (6 campos, 3 obligatorios). Delega en `IamUsersService.createUser`. Crea filas en common.contact_points, iam.authentication_credentials, iam.security_events, iam.user_global_roles, iam.users. Lee iam.authentication_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/controllers/iam-users.controller.ts:266` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | IamUsersController.createUser → IamUsersService.createUser → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:135` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamUsersController.createUser → IamUsersService.createUser → CredentialsRepository.createPassword | `src/modules/iam/repositories/credentials.repository.ts:183` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.createUser → IamUsersService.createUser → CredentialsRepository.findActivePasswordBySubject | `src/modules/iam/repositories/credentials.repository.ts:59` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.createUser → IamUsersService.createUser → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamUsersController.createUser → IamUsersService.createUser → UserGlobalRolesRepository.create | `src/modules/iam/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamUsersController.createUser → IamUsersService.createUser → UsersRepository.create | `src/modules/iam/repositories/users.repository.ts:49` |

### Cuerpo — DTO `CreateUserDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `displayName` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre visible del usuario | `src/modules/iam/dto/create-user.dto.ts:24` |
| `email` | `string` | Sí | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Email que actúa como identidad de login | `src/modules/iam/dto/create-user.dto.ts:35` |
| `password` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | Contraseña en claro (se persiste solo su hash argon2id) | `src/modules/iam/dto/create-user.dto.ts:46` |
| `phone` | `string` | No | longitud máxima 40; patrón runtime /^[+]?[0-9 ()-]{6,}$/ | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(/^[+]?[0-9 ()-]{6,}$/, { message: 'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion', })` | Teléfono de contacto en formato E.164 o nacional | `src/modules/iam/dto/create-user.dto.ts:63` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA del usuario | `src/modules/iam/dto/create-user.dto.ts:72` |
| `initialRole` | `string` | No | valores: USER, SECURITY_ADMIN | `@IsOptional()` `@IsIn(['USER', 'SECURITY_ADMIN'])` | Rol inicial | `src/modules/iam/dto/create-user.dto.ts:83` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/iam/dto/user-response.dto.ts:9` |
| `displayName` | `string` | Sí | — | — | Valor de display name mantenido por la instancia. | `src/modules/iam/dto/user-response.dto.ts:15` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del usuario | `src/modules/iam/dto/user-response.dto.ts:24` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/iam/dto/user-response.dto.ts:30` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:41` |
| INTEGRACION | `test/integration/refresh-cookie.int-spec.ts:36` |
| CONTROLADOR | `src/modules/iam/controllers/iam-users.controller.spec.ts:73` |

### Flujos

_Se completa en la fase de flujos._

---

## 17. GET /iam/users/{id}

- **Origen:** CONTRATO
- **Nombre:** Ficha de un usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.getUser` — `src/modules/iam/controllers/iam-users.controller.ts:146`

### Qué es y para qué sirve (negocio)

Ficha de un usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}` la atiende `IamUsersController.getUser` (src/modules/iam/controllers/iam-users.controller.ts:146). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.getUserById`. Lee iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/controllers/iam-users.controller.ts:146` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/controllers/iam-users.controller.ts:146` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.getUser → IamUsersReadService.getUserById → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<UserDetailResponseDto>` · DTO `UserDetailResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `timeZone` | `string` | No | — | — | Zona horaria declarada. | `src/modules/iam/dto/iam-user-read.dto.ts:97` |
| `preferredLanguageConceptId` | `string` | No | formato uuid | — | Idioma preferido. | `src/modules/iam/dto/iam-user-read.dto.ts:103` |
| `residenceCountryConceptId` | `string` | No | formato uuid | — | País de residencia declarado. | `src/modules/iam/dto/iam-user-read.dto.ts:109` |
| `dataResidencyRegionConceptId` | `string` | No | formato uuid | — | Región de residencia del dato. | `src/modules/iam/dto/iam-user-read.dto.ts:115` |
| `legalBasisConceptId` | `string` | No | formato uuid | — | Base legal del tratamiento. | `src/modules/iam/dto/iam-user-read.dto.ts:121` |
| `privacyAcceptedAt` | `string` | No | formato date-time; admite null | — | Cuándo se aceptó la política de privacidad. | `src/modules/iam/dto/iam-user-read.dto.ts:127` |
| `privacyPolicyVersion` | `string` | No | — | — | Versión de la política aceptada. | `src/modules/iam/dto/iam-user-read.dto.ts:133` |
| `mustChangePassword` | `boolean` | Sí | — | — | Si la cuenta exige cambiar la credencial en el próximo ingreso. | `src/modules/iam/dto/iam-user-read.dto.ts:139` |
| `anonymizedAt` | `string` | No | formato date-time; admite null | — | Cuándo se anonimizó la cuenta, si se anonimizó. | `src/modules/iam/dto/iam-user-read.dto.ts:145` |
| `updatedAt` | `string` | Sí | formato date-time | — | Última modificación del registro. | `src/modules/iam/dto/iam-user-read.dto.ts:151` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 18. POST /iam/users/{id}/anonymize

- **Origen:** CONTRATO
- **Nombre:** Anonimizar (DSAR) la cuenta
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.anonymize` — `src/modules/iam/controllers/iam-users.controller.ts:356`

### Qué es y para qué sirve (negocio)

Anonimizar (DSAR) la cuenta. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/anonymize` la atiende `IamUsersController.anonymize` (src/modules/iam/controllers/iam-users.controller.ts:356). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersService.anonymize`. Crea filas en iam.security_events. Actualiza iam.authentication_credentials, iam.refresh_tokens, iam.sessions, iam.user_global_roles, iam.users. Lee iam.sessions, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/controllers/iam-users.controller.ts:356` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/controllers/iam-users.controller.ts:356` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → CredentialsRepository.revokeAllForUser | `src/modules/iam/repositories/credentials.repository.ts:219` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/repositories/refresh-tokens.repository.ts:75` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → SessionsRepository.revokeAllActiveForUser | `src/modules/iam/repositories/sessions.repository.ts:104` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → SessionsRepository.activeSessionIdsForUser | `src/modules/iam/repositories/sessions.repository.ts:94` |
| `iam.user_global_roles` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → UserGlobalRolesRepository.revokeAllForUser | `src/modules/iam/repositories/user-global-roles.repository.ts:65` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.anonymize → IamUsersService.anonymize | `src/modules/iam/services/iam-users.service.ts:285` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/iam/dto/operation-result.dto.ts:46` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:166` |
| CONTROLADOR | `src/modules/iam/controllers/iam-users.controller.spec.ts:137` |

### Flujos

_Se completa en la fase de flujos._

---

## 19. GET /iam/users/{id}/credentials

- **Origen:** CONTRATO
- **Nombre:** Credenciales del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.listCredentials` — `src/modules/iam/controllers/iam-users.controller.ts:156`

### Qué es y para qué sirve (negocio)

Credenciales del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}/credentials` la atiende `IamUsersController.listCredentials` (src/modules/iam/controllers/iam-users.controller.ts:156). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.listCredentials`. Lee iam.authentication_credentials, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/controllers/iam-users.controller.ts:156` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/controllers/iam-users.controller.ts:156` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.listCredentials → IamUsersReadService.listCredentials → CredentialsRepository.findByUser | `src/modules/iam/repositories/credentials.repository.ts:236` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.listCredentials → IamUsersReadService.listCredentials → IamUsersReadService.forkForExistingUser → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListCredentialsResponseDto>` · DTO `ListCredentialsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CredentialListItemDto>` | Sí | — | — | Credenciales, de la más reciente a la más antigua. | `src/modules/iam/dto/iam-user-read.dto.ts:352` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la credencial. | `src/modules/iam/dto/iam-user-read.dto.ts:163` |
| `items[].methodConceptId` | `string` | Sí | formato uuid | — | Método de autenticación. | `src/modules/iam/dto/iam-user-read.dto.ts:169` |
| `items[].externalSubject` | `string` | No | — | — | Sujeto con el que se autentica (correo o documento). | `src/modules/iam/dto/iam-user-read.dto.ts:175` |
| `items[].identityProvider` | `string` | No | — | — | Proveedor de identidad, en las credenciales federadas. | `src/modules/iam/dto/iam-user-read.dto.ts:181` |
| `items[].stateConceptId` | `string` | Sí | formato uuid | — | Estado de la credencial. | `src/modules/iam/dto/iam-user-read.dto.ts:187` |
| `items[].lastUsedAt` | `string` | No | formato date-time; admite null | — | Último uso registrado. | `src/modules/iam/dto/iam-user-read.dto.ts:193` |
| `items[].expiresAt` | `string` | No | formato date-time; admite null | — | Caducidad, si la tiene. | `src/modules/iam/dto/iam-user-read.dto.ts:199` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta de la credencial. | `src/modules/iam/dto/iam-user-read.dto.ts:205` |
| `count` | `number` | Sí | — | — | Cuántas credenciales trae la respuesta. | `src/modules/iam/dto/iam-user-read.dto.ts:358` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 20. POST /iam/users/{id}/credentials/{cid}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar una credencial del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.revokeCredential` — `src/modules/iam/controllers/iam-users.controller.ts:293`

### Qué es y para qué sirve (negocio)

Revocar una credencial del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/credentials/{cid}/revoke` la atiende `IamUsersController.revokeCredential` (src/modules/iam/controllers/iam-users.controller.ts:293). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamCredentialsService.revokeCredential`. Crea filas en iam.security_events. Actualiza iam.authentication_credentials. Lee iam.authentication_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/controllers/iam-users.controller.ts:293` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, cid | `src/modules/iam/controllers/iam-users.controller.ts:293` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.revokeCredential → IamCredentialsService.revokeCredential | `src/modules/iam/services/iam-credentials.service.ts:127` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.revokeCredential → IamCredentialsService.revokeCredential → CredentialsRepository.findByIdAndUser | `src/modules/iam/repositories/credentials.repository.ts:141` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.revokeCredential → IamCredentialsService.revokeCredential → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |

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
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/iam/dto/operation-result.dto.ts:46` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/controllers/iam-users.controller.spec.ts:92` |

### Flujos

_Se completa en la fase de flujos._

---

## 21. POST /iam/users/{id}/credentials/federated

- **Origen:** CONTRATO
- **Nombre:** Enlazar una credencial de identidad federada
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.linkFederated` — `src/modules/iam/controllers/iam-users.controller.ts:280`

### Qué es y para qué sirve (negocio)

Enlazar una credencial de identidad federada. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/credentials/federated` la atiende `IamUsersController.linkFederated` (src/modules/iam/controllers/iam-users.controller.ts:280). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `LinkFederatedCredentialDto` (2 campos, 2 obligatorios). Delega en `IamCredentialsService.linkFederated`. Crea filas en iam.authentication_credentials, iam.security_events. Lee iam.authentication_credentials, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/controllers/iam-users.controller.ts:280` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/controllers/iam-users.controller.ts:280` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamUsersController.linkFederated → IamCredentialsService.linkFederated → CredentialsRepository.createFederated | `src/modules/iam/repositories/credentials.repository.ts:203` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.linkFederated → IamCredentialsService.linkFederated → CredentialsRepository.findFederated | `src/modules/iam/repositories/credentials.repository.ts:128` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.linkFederated → IamCredentialsService.linkFederated → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.linkFederated → IamCredentialsService.linkFederated → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `LinkFederatedCredentialDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `identityProvider` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Proveedor de identidad externo (p. ej. google, azure-ad) | `src/modules/iam/dto/link-federated-credential.dto.ts:15` |
| `externalSubject` | `string` | Sí | longitud mínima 1; longitud máxima 320 | `@IsString()` `@MinLength(1)` `@MaxLength(320)` | Identificador del sujeto en el proveedor externo | `src/modules/iam/dto/link-federated-credential.dto.ts:26` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/iam/dto/credential-response.dto.ts:9` |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado de la credencial | sin fuente |
| `verifiedAt` | `string` | No | formato date-time | — | Valor de verified at mantenido por la instancia. | sin fuente |
| `practitionerVerified` | `boolean` | Sí | — | — | true si al verificar quedó habilitado todo el perfil profesional | sin fuente |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:132` |
| CONTROLADOR | `src/modules/iam/controllers/iam-users.controller.spec.ts:82` |

### Flujos

_Se completa en la fase de flujos._

---

## 22. GET /iam/users/{id}/devices

- **Origen:** CONTRATO
- **Nombre:** Dispositivos del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.listDevices` — `src/modules/iam/controllers/iam-users.controller.ts:169`

### Qué es y para qué sirve (negocio)

Dispositivos del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}/devices` la atiende `IamUsersController.listDevices` (src/modules/iam/controllers/iam-users.controller.ts:169). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.listDevices`. Lee iam.devices, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/controllers/iam-users.controller.ts:169` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/controllers/iam-users.controller.ts:169` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.devices` | LEE | LEE | DIRECTA | IamUsersController.listDevices → IamUsersReadService.listDevices → DevicesRepository.findByUser | `src/modules/iam/repositories/devices.repository.ts:54` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.listDevices → IamUsersReadService.listDevices → IamUsersReadService.forkForExistingUser → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListDevicesResponseDto>` · DTO `ListDevicesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<DeviceListItemDto>` | Sí | — | — | Dispositivos, del más reciente al más antiguo. | `src/modules/iam/dto/iam-user-read.dto.ts:367` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del dispositivo. | `src/modules/iam/dto/iam-user-read.dto.ts:214` |
| `items[].deviceFingerprint` | `string` | No | — | — | Huella con la que el dispositivo se identifica. | `src/modules/iam/dto/iam-user-read.dto.ts:220` |
| `items[].platformConceptId` | `string` | No | formato uuid | — | Plataforma del dispositivo. | `src/modules/iam/dto/iam-user-read.dto.ts:226` |
| `items[].hasPushToken` | `boolean` | Sí | — | — | Si tiene token de notificaciones registrado. Se publica la existencia, no el token. | `src/modules/iam/dto/iam-user-read.dto.ts:232` |
| `items[].lastSeenAt` | `string` | No | formato date-time; admite null | — | Última vez que se vio el dispositivo. | `src/modules/iam/dto/iam-user-read.dto.ts:238` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta del dispositivo. | `src/modules/iam/dto/iam-user-read.dto.ts:244` |
| `count` | `number` | Sí | — | — | Cuántos dispositivos trae la respuesta. | `src/modules/iam/dto/iam-user-read.dto.ts:373` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 23. POST /iam/users/{id}/devices

- **Origen:** CONTRATO
- **Nombre:** Registrar un dispositivo del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.registerDevice` — `src/modules/iam/controllers/iam-users.controller.ts:318`

### Qué es y para qué sirve (negocio)

Registrar un dispositivo del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/devices` la atiende `IamUsersController.registerDevice` (src/modules/iam/controllers/iam-users.controller.ts:318). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateDeviceDto` (4 campos, 1 obligatorio). Delega en `IamDevicesService.register`. Crea filas en iam.devices, iam.security_events. Lee iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/controllers/iam-users.controller.ts:318` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/controllers/iam-users.controller.ts:318` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.devices` | ESCRIBE | CREA | DIRECTA | IamUsersController.registerDevice → IamDevicesService.register → DevicesRepository.create | `src/modules/iam/repositories/devices.repository.ts:39` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.registerDevice → IamDevicesService.register → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.registerDevice → IamDevicesService.register → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateDeviceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `deviceFingerprint` | `string` | Sí | longitud mínima 1; longitud máxima 512 | `@IsString()` `@MinLength(1)` `@MaxLength(512)` | Huella única del dispositivo | `src/modules/iam/dto/create-device.dto.ts:23` |
| `platform` | `string` | No | valores: IOS, ANDROID, WEB | `@IsOptional()` `@IsIn(['IOS', 'ANDROID', 'WEB'])` | Plataforma | `src/modules/iam/dto/create-device.dto.ts:34` |
| `name` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Nombre legible del dispositivo | `src/modules/iam/dto/create-device.dto.ts:43` |
| `trust` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marcar el dispositivo como de confianza | `src/modules/iam/dto/create-device.dto.ts:53` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/iam/dto/device-response.dto.ts:9` |
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/iam/dto/device-response.dto.ts:15` |
| `trusted` | `boolean` | Sí | — | — | Valor de trusted mantenido por la instancia. | `src/modules/iam/dto/device-response.dto.ts:21` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:119` |
| CONTROLADOR | `src/modules/iam/controllers/iam-users.controller.spec.ts:110` |

### Flujos

_Se completa en la fase de flujos._

---

## 24. GET /iam/users/{id}/global-roles

- **Origen:** CONTRATO
- **Nombre:** Roles globales del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.listGlobalRoles` — `src/modules/iam/controllers/iam-users.controller.ts:208`

### Qué es y para qué sirve (negocio)

Roles globales del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}/global-roles` la atiende `IamUsersController.listGlobalRoles` (src/modules/iam/controllers/iam-users.controller.ts:208). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.listGlobalRoles`. Lee iam.user_global_roles, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/controllers/iam-users.controller.ts:208` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/controllers/iam-users.controller.ts:208` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.user_global_roles` | LEE | LEE | DIRECTA | IamUsersController.listGlobalRoles → IamUsersReadService.listGlobalRoles → UserGlobalRolesRepository.findByUser | `src/modules/iam/repositories/user-global-roles.repository.ts:73` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.listGlobalRoles → IamUsersReadService.listGlobalRoles → IamUsersReadService.forkForExistingUser → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListGlobalRolesResponseDto>` · DTO `ListGlobalRolesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<GlobalRoleListItemDto>` | Sí | — | — | Asignaciones, de la más reciente a la más antigua. | `src/modules/iam/dto/iam-user-read.dto.ts:412` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la asignación. | `src/modules/iam/dto/iam-user-read.dto.ts:325` |
| `items[].roleConceptId` | `string` | Sí | formato uuid | — | Rol global asignado. | `src/modules/iam/dto/iam-user-read.dto.ts:331` |
| `items[].stateConceptId` | `string` | Sí | formato uuid | — | Estado de la asignación. | `src/modules/iam/dto/iam-user-read.dto.ts:337` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se asignó. | `src/modules/iam/dto/iam-user-read.dto.ts:343` |
| `count` | `number` | Sí | — | — | Cuántas asignaciones trae la respuesta. | `src/modules/iam/dto/iam-user-read.dto.ts:418` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 25. POST /iam/users/{id}/global-roles

- **Origen:** CONTRATO
- **Nombre:** Conceder o revocar un rol global
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.changeGlobalRole` — `src/modules/iam/controllers/iam-users.controller.ts:343`

### Qué es y para qué sirve (negocio)

Conceder o revocar un rol global. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/global-roles` la atiende `IamUsersController.changeGlobalRole` (src/modules/iam/controllers/iam-users.controller.ts:343). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `GlobalRoleDto` (2 campos, 2 obligatorios). Delega en `IamUsersService.changeGlobalRole`. Crea filas en iam.security_events, iam.user_global_roles. Actualiza iam.user_global_roles. Lee iam.user_global_roles, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/controllers/iam-users.controller.ts:343` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/controllers/iam-users.controller.ts:343` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole | `src/modules/iam/services/iam-users.service.ts:254` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole → UserGlobalRolesRepository.create | `src/modules/iam/repositories/user-global-roles.repository.ts:27` |
| `iam.user_global_roles` | LEE | LEE | DIRECTA | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole → UserGlobalRolesRepository.findActive | `src/modules/iam/repositories/user-global-roles.repository.ts:45` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `GlobalRoleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `role` | `string` | Sí | valores: USER, SECURITY_ADMIN, SUPERADMIN, PATIENT, PRACTITIONER, CLINICIAN | `@IsIn([ 'USER', 'SECURITY_ADMIN', 'SUPERADMIN', 'PATIENT', 'PRACTITIONER', 'CLINICIAN', ])` | — | `src/modules/iam/dto/global-role.dto.ts:51` |
| `action` | `string` | Sí | valores: GRANT, REVOKE | `@IsIn(['GRANT', 'REVOKE'])` | — | `src/modules/iam/dto/global-role.dto.ts:58` |

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
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/iam/dto/operation-result.dto.ts:46` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:140` |
| CONTROLADOR | `src/modules/iam/controllers/iam-users.controller.spec.ts:127` |

### Flujos

_Se completa en la fase de flujos._

---

## 26. POST /iam/users/{id}/lock

- **Origen:** CONTRATO
- **Nombre:** Bloquear la cuenta y revocar sus sesiones
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.lock` — `src/modules/iam/controllers/iam-users.controller.ts:330`

### Qué es y para qué sirve (negocio)

Bloquear la cuenta y revocar sus sesiones. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/lock` la atiende `IamUsersController.lock` (src/modules/iam/controllers/iam-users.controller.ts:330). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `LockUserDto` (1 campo, 0 obligatorios). Delega en `IamUsersService.lock`. Crea filas en iam.account_lockouts, iam.security_events. Actualiza iam.refresh_tokens, iam.sessions, iam.users. Lee iam.sessions, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/controllers/iam-users.controller.ts:330` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/controllers/iam-users.controller.ts:330` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.account_lockouts` | ESCRIBE | CREA | DIRECTA | IamUsersController.lock → IamUsersService.lock → AccountLockoutsRepository.create | `src/modules/iam/repositories/account-lockouts.repository.ts:35` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.lock → IamUsersService.lock → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/repositories/refresh-tokens.repository.ts:75` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.lock → IamUsersService.lock → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.lock → IamUsersService.lock → SessionsRepository.revokeAllActiveForUser | `src/modules/iam/repositories/sessions.repository.ts:104` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamUsersController.lock → IamUsersService.lock → SessionsRepository.activeSessionIdsForUser | `src/modules/iam/repositories/sessions.repository.ts:94` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.lock → IamUsersService.lock | `src/modules/iam/services/iam-users.service.ts:174` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.lock → IamUsersService.lock → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `LockUserDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo administrativo del bloqueo | `src/modules/iam/dto/lock-user.dto.ts:13` |

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
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/iam/dto/operation-result.dto.ts:46` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:155` |
| CONTROLADOR | `src/modules/iam/controllers/iam-users.controller.spec.ts:116` |

### Flujos

_Se completa en la fase de flujos._

---

## 27. GET /iam/users/{id}/mfa-factors

- **Origen:** CONTRATO
- **Nombre:** Factores de MFA del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.listMfaFactors` — `src/modules/iam/controllers/iam-users.controller.ts:182`

### Qué es y para qué sirve (negocio)

Factores de MFA del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}/mfa-factors` la atiende `IamUsersController.listMfaFactors` (src/modules/iam/controllers/iam-users.controller.ts:182). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.listMfaFactors`. Lee iam.mfa_factors, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/controllers/iam-users.controller.ts:182` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/controllers/iam-users.controller.ts:182` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.mfa_factors` | LEE | LEE | DIRECTA | IamUsersController.listMfaFactors → IamUsersReadService.listMfaFactors → MfaFactorsRepository.findByUser | `src/modules/iam/repositories/mfa-factors.repository.ts:54` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.listMfaFactors → IamUsersReadService.listMfaFactors → IamUsersReadService.forkForExistingUser → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListMfaFactorsResponseDto>` · DTO `ListMfaFactorsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MfaFactorListItemDto>` | Sí | — | — | Factores, del más reciente al más antiguo. | `src/modules/iam/dto/iam-user-read.dto.ts:382` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del factor. | `src/modules/iam/dto/iam-user-read.dto.ts:253` |
| `items[].factorTypeConceptId` | `string` | Sí | formato uuid | — | Mecanismo del segundo factor. | `src/modules/iam/dto/iam-user-read.dto.ts:259` |
| `items[].stateConceptId` | `string` | Sí | formato uuid | — | Estado del factor. | `src/modules/iam/dto/iam-user-read.dto.ts:265` |
| `items[].verifiedAt` | `string` | No | formato date-time; admite null | — | Cuándo se verificó, si se verificó. | `src/modules/iam/dto/iam-user-read.dto.ts:271` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta del factor. | `src/modules/iam/dto/iam-user-read.dto.ts:277` |
| `count` | `number` | Sí | — | — | Cuántos factores trae la respuesta. | `src/modules/iam/dto/iam-user-read.dto.ts:388` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 28. POST /iam/users/{id}/mfa-factors

- **Origen:** CONTRATO
- **Nombre:** Enrolar o verificar un factor MFA
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.mfaFactor` — `src/modules/iam/controllers/iam-users.controller.ts:306`

### Qué es y para qué sirve (negocio)

Enrolar o verificar un factor MFA. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/mfa-factors` la atiende `IamUsersController.mfaFactor` (src/modules/iam/controllers/iam-users.controller.ts:306). Exige sesión; el controlador no declara roles. Valida el cuerpo como `MfaFactorDto` (5 campos, 0 obligatorios). Delega en `IamMfaService.enrollOrVerify`. Crea filas en iam.mfa_factors, iam.security_events. Actualiza iam.mfa_factors, iam.users. Lee iam.mfa_factors, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/controllers/iam-users.controller.ts:306` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/controllers/iam-users.controller.ts:306` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.mfa_factors` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify | `src/modules/iam/services/iam-mfa.service.ts:115` |
| `iam.mfa_factors` | ESCRIBE | CREA | DIRECTA | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify → MfaFactorsRepository.create | `src/modules/iam/repositories/mfa-factors.repository.ts:31` |
| `iam.mfa_factors` | LEE | LEE | DIRECTA | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify → MfaFactorsRepository.findByIdAndUser | `src/modules/iam/repositories/mfa-factors.repository.ts:50` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify | `src/modules/iam/services/iam-mfa.service.ts:119` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `MfaFactorDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `factorType` | `string` | No | valores: TOTP, WEBAUTHN | `@IsOptional()` `@IsIn(['TOTP', 'WEBAUTHN'])` | Tipo de factor a enrolar | `src/modules/iam/dto/mfa-factor.dto.ts:31` |
| `label` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Etiqueta legible del factor | `src/modules/iam/dto/mfa-factor.dto.ts:40` |
| `verify` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si es true, verifica el factor indicado | `src/modules/iam/dto/mfa-factor.dto.ts:50` |
| `factorId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Factor a verificar | `src/modules/iam/dto/mfa-factor.dto.ts:58` |
| `code` | `string` | No | longitud mínima 6; longitud máxima 8 | `@IsOptional()` `@IsString()` `@Length(6, 8)` | Código TOTP de la app autenticadora. Obligatorio cuando verify=true. | `src/modules/iam/dto/mfa-factor.dto.ts:71` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/iam/dto/mfa-factor-response.dto.ts:9` |
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/iam/dto/mfa-factor-response.dto.ts:15` |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado del factor | `src/modules/iam/dto/mfa-factor-response.dto.ts:24` |
| `verifiedAt` | `string` | No | formato date-time | — | Valor de verified at mantenido por la instancia. | `src/modules/iam/dto/mfa-factor-response.dto.ts:30` |
| `secret` | `string` | No | — | — | Secreto TOTP en base32. Solo se devuelve al enrolar un factor TOTP; | `src/modules/iam/dto/mfa-factor-response.dto.ts:40` |
| `otpauthUri` | `string` | No | — | — | URI otpauth:// para generar el QR. Solo se devuelve al enrolar un factor TOTP. | `src/modules/iam/dto/mfa-factor-response.dto.ts:49` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/iam.int-spec.ts:111` |
| CONTROLADOR | `src/modules/iam/controllers/iam-users.controller.spec.ts:103` |

### Flujos

_Se completa en la fase de flujos._

---

## 29. GET /iam/users/{id}/sessions

- **Origen:** CONTRATO
- **Nombre:** Sesiones del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.listSessions` — `src/modules/iam/controllers/iam-users.controller.ts:195`

### Qué es y para qué sirve (negocio)

Sesiones del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}/sessions` la atiende `IamUsersController.listSessions` (src/modules/iam/controllers/iam-users.controller.ts:195). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.listSessions`. Lee iam.sessions, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/controllers/iam-users.controller.ts:195` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/controllers/iam-users.controller.ts:195` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.sessions` | LEE | LEE | DIRECTA | IamUsersController.listSessions → IamUsersReadService.listSessions → SessionsRepository.findByUser | `src/modules/iam/repositories/sessions.repository.ts:127` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.listSessions → IamUsersReadService.listSessions → IamUsersReadService.forkForExistingUser → UsersRepository.findById | `src/modules/iam/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListSessionsResponseDto>` · DTO `ListSessionsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SessionListItemDto>` | Sí | — | — | Sesiones, de la más reciente a la más antigua. | `src/modules/iam/dto/iam-user-read.dto.ts:397` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la sesión; es lo que se usa para revocarla. | `src/modules/iam/dto/iam-user-read.dto.ts:286` |
| `items[].deviceId` | `string` | No | formato uuid; admite null | — | Dispositivo desde el que se abrió, si se registró. | `src/modules/iam/dto/iam-user-read.dto.ts:292` |
| `items[].geoLocation` | `string` | No | — | — | Ubicación aproximada registrada al abrirla. | `src/modules/iam/dto/iam-user-read.dto.ts:298` |
| `items[].stateConceptId` | `string` | Sí | formato uuid | — | Estado de la sesión. | `src/modules/iam/dto/iam-user-read.dto.ts:304` |
| `items[].expiresAt` | `string` | No | formato date-time; admite null | — | Caducidad de la sesión. | `src/modules/iam/dto/iam-user-read.dto.ts:310` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Apertura de la sesión. | `src/modules/iam/dto/iam-user-read.dto.ts:316` |
| `count` | `number` | Sí | — | — | Cuántas sesiones trae la respuesta. | `src/modules/iam/dto/iam-user-read.dto.ts:403` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 30. POST /iam/users/assisted-practitioner-registration

- **Origen:** CONTRATO
- **Nombre:** Alta administrativa de un profesional (devuelve token de activación)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.assistedPractitionerRegistration` — `src/modules/iam/controllers/iam-users.controller.ts:248`

### Qué es y para qué sirve (negocio)

Alta administrativa de un profesional (devuelve token de activación). Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/assisted-practitioner-registration` la atiende `IamUsersController.assistedPractitionerRegistration` (src/modules/iam/controllers/iam-users.controller.ts:248). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AssistedPractitionerRegistrationDto` (26 campos, 4 obligatorios). Delega en `IamPractitionerSelfRegistrationService.assistedRegisterPractitioner`. Crea filas en authz.user_role_assignments, common.contact_points, common.identifiers, directory.tenant_memberships, iam.account_activations, iam.authentication_credentials, iam.email_verifications, iam.security_events y 11 más. Lee authz.roles, authz.user_role_assignments, iam.authentication_credentials, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences, profiles.health_practitioner_profiles y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/controllers/iam-users.controller.ts:248` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzEffectiveRolesService.ensureRoleByCode | `src/modules/authz/services/authz-effective-roles.service.ts:95` |
| `authz.user_role_assignments` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.create | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.findActive | `src/modules/authz/repositories/user-role-assignments.repository.ts:55` |
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:135` |
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:90` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `iam.account_activations` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AccountActivationsRepository.create | `src/modules/iam/repositories/account-activations.repository.ts:46` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CredentialsRepository.createPendingPassword | `src/modules/iam/repositories/credentials.repository.ts:165` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/repositories/credentials.repository.ts:100` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → EmailVerificationsRepository.create | `src/modules/iam/repositories/email-verifications.repository.ts:41` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → UserGlobalRolesRepository.create | `src/modules/iam/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → UsersRepository.create | `src/modules/iam/repositories/users.repository.ts:49` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.health_practitioner_profiles` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → HealthPractitionerProfilesRepository.create | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:128` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → HealthPractitionerProfilesRepository.findByCode | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:72` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → JurisdictionAuthorizationsRepository.create | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:92` |
| `profiles.person_account_links` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PersonAccountLinksRepository.create | `src/modules/profiles/repositories/person-account-links.repository.ts:50` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PersonProfilesRepository.create | `src/modules/profiles/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PersonsRepository.create | `src/modules/profiles/repositories/persons.repository.ts:115` |
| `profiles.practitioner_languages` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PractitionerLanguagesRepository.create | `src/modules/profiles/repositories/practitioner-languages.repository.ts:62` |
| `profiles.practitioner_specialties` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PractitionerSpecialtiesRepository.create | `src/modules/profiles/repositories/practitioner-specialties.repository.ts:60` |
| `profiles.professional_credentials` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfessionalCredentialsRepository.create | `src/modules/profiles/repositories/professional-credentials.repository.ts:98` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:326` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:500` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:110` |

### Cuerpo — DTO `AssistedPractitionerRegistrationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `email` | `string` | Sí | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Correo que actúa como identidad de login | `src/modules/iam/dto/register-practitioner.dto.ts:48` |
| `name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPractitionerDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/dto/register-practitioner.dto.ts:70` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/dto/register-practitioner.dto.ts:79` |
| `lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPractitionerDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/dto/register-practitioner.dto.ts:89` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/dto/register-practitioner.dto.ts:98` |
| `displayName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Forma anterior de declarar el nombre. Preferí name/lastName. | `src/modules/iam/dto/register-practitioner.dto.ts:117` |
| `licenseNumber` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Número de licencia o matrícula profesional | `src/modules/iam/dto/register-practitioner.dto.ts:129` |
| `credentialNumber` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Número del título profesional que respalda la licencia | `src/modules/iam/dto/register-practitioner.dto.ts:141` |
| `regulatoryAuthority` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Autoridad reguladora que emitió la licencia | `src/modules/iam/dto/register-practitioner.dto.ts:153` |
| `licenseIssueDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | Fecha de inscripción de la matrícula (ISO) | `src/modules/iam/dto/register-practitioner.dto.ts:166` |
| `professionalTitle` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/dto/register-practitioner.dto.ts:175` |
| `nationalId` | `string` | No | longitud máxima 40; patrón runtime /^[A-Za-z0-9.-]+$/ | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(/^[A-Za-z0-9.-]+$/, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Documento de identidad (se guarda como identificador oficial) | `src/modules/iam/dto/register-practitioner.dto.ts:218` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `src/modules/iam/dto/register-practitioner.dto.ts:240` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `src/modules/iam/dto/register-practitioner.dto.ts:261` |
| `phone` | `string` | No | longitud máxima 40; patrón runtime /^[+]?[0-9 ()-]{6,}$/ | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(/^[+]?[0-9 ()-]{6,}$/, { message: 'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion', })` | Teléfono de contacto en formato E.164 o nacional | `src/modules/iam/dto/register-practitioner.dto.ts:276` |
| `birthDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/iam/dto/register-practitioner.dto.ts:284` |
| `gender` | `string` | No | valores: MALE, FEMALE, OTHER, UNKNOWN | `@IsOptional()` `@IsIn(ADMIN_GENDER_CODES)` | Género administrativo (HL7 AdministrativeGender) | `src/modules/iam/dto/register-practitioner.dto.ts:295` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | `@IsOptional()` `@IsIn(BIRTH_SEX_CODES)` | Sexo asignado al nacer | `src/modules/iam/dto/register-practitioner.dto.ts:306` |
| `practitionerCategoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/dto/register-practitioner.dto.ts:315` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/dto/register-practitioner.dto.ts:323` |
| `credentialTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/dto/register-practitioner.dto.ts:331` |
| `languageConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/dto/register-practitioner.dto.ts:339` |
| `acceptsNewPatients` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/iam/dto/register-practitioner.dto.ts:348` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/dto/register-practitioner.dto.ts:357` |
| `reason` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | Motivo del alta administrativa (trazabilidad C-18) | `src/modules/iam/dto/register-practitioner.dto.ts:452` |
| `clinicalRoles` | `array<string>` | No | longitud máxima 100; máximo 10 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(10)` `@IsString({ each: true })` `@MaxLength(100, { each: true })` | Roles asistenciales a conceder (códigos de `GET /authz/roles`) | `src/modules/iam/dto/register-practitioner.dto.ts:479` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "email": "usuario@example.com",
  "licenseNumber": "valor-ejemplo",
  "credentialNumber": "valor-ejemplo",
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<AssistedPractitionerRegistrationResponseDto>` · DTO `AssistedPractitionerRegistrationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `activationToken` | `string` | Sí | — | — | Token de un solo uso a entregar al titular por canal seguro | `src/modules/iam/dto/register-practitioner.dto.ts:496` |
| `activationExpiresAt` | `string` | Sí | formato date-time | — | Cuándo caduca el token. | `src/modules/iam/dto/register-practitioner.dto.ts:502` |
| `clinicalRoles` | `array<string>` | No | — | — | Roles asistenciales efectivamente concedidos. Se devuelven para que el administrador vea con qué quedó operativo el profesional sin tener que consultarlo aparte. Si alguno de los pedidos no existía, el alta entera falla, así que esta lista coincide siempre con lo solicitado. | `src/modules/iam/dto/register-practitioner.dto.ts:513` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 31. POST /iam/users/assisted-registration

- **Origen:** CONTRATO
- **Nombre:** Registro asistido de un paciente (devuelve token de activación)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.assistedRegistration` — `src/modules/iam/controllers/iam-users.controller.ts:222`

### Qué es y para qué sirve (negocio)

Registro asistido de un paciente (devuelve token de activación). Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/assisted-registration` la atiende `IamUsersController.assistedRegistration` (src/modules/iam/controllers/iam-users.controller.ts:222). Exige sesión con alguno de los roles CLINICIAN, SECURITY_ADMIN. Valida el cuerpo como `AssistedRegistrationDto` (10 campos, 2 obligatorios). Delega en `IamAssistedRegistrationService.assistedRegistration`. Crea filas en iam.account_activations, iam.authentication_credentials, iam.security_events, iam.user_global_roles, iam.users. Lee iam.authentication_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, SECURITY_ADMIN | `src/modules/iam/controllers/iam-users.controller.ts:222` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.account_activations` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → AccountActivationsRepository.create | `src/modules/iam/repositories/account-activations.repository.ts:46` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → CredentialsRepository.createPendingPassword | `src/modules/iam/repositories/credentials.repository.ts:165` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/repositories/credentials.repository.ts:100` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → UserGlobalRolesRepository.create | `src/modules/iam/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → UsersRepository.create | `src/modules/iam/repositories/users.repository.ts:49` |

### Cuerpo — DTO `AssistedRegistrationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: AssistedRegistrationDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/dto/assisted-registration.dto.ts:36` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/dto/assisted-registration.dto.ts:45` |
| `lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: AssistedRegistrationDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/dto/assisted-registration.dto.ts:55` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/dto/assisted-registration.dto.ts:64` |
| `displayName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Forma anterior de declarar el nombre. Preferí name/lastName. | `src/modules/iam/dto/assisted-registration.dto.ts:83` |
| `email` | `string` | Sí | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Identificador verificado (email) que actúa como identidad de login | `src/modules/iam/dto/assisted-registration.dto.ts:95` |
| `reason` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Motivo del registro asistido (queda en la trazabilidad C-18) | `src/modules/iam/dto/assisted-registration.dto.ts:107` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA del paciente | `src/modules/iam/dto/assisted-registration.dto.ts:116` |
| `legalRepresentationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id de la representación legal formal (authz.patient_legal_representations) | `src/modules/iam/dto/assisted-registration.dto.ts:128` |
| `legalRepresentativeUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del usuario representante legal (dato mínimo si no hay representación formal) | `src/modules/iam/dto/assisted-registration.dto.ts:140` |

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
| `userId` | `string` | Sí | formato uuid | — | Id de la cuenta creada | `src/modules/iam/dto/assisted-registration.dto.ts:153` |
| `activationToken` | `string` | Sí | — | — | Token de activación de un solo uso (entregar al titular por canal seguro) | `src/modules/iam/dto/assisted-registration.dto.ts:162` |
| `activationExpiresAt` | `string` | Sí | formato date-time | — | Caducidad del token de activación | `src/modules/iam/dto/assisted-registration.dto.ts:168` |
| `status` | `string` | Sí | — | — | Estado de la cuenta (pendiente de activación) | `src/modules/iam/dto/assisted-registration.dto.ts:177` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

