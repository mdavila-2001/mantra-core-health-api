<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `iam`

- **Bloque:** Identidad y Seguridad (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)
- **Operaciones:** 55 (54 en el contrato, 1 sólo en el código)
- **Riesgo:** ALTO 25 · MEDIO 13 · BAJO 17
- **Tablas distintas que tocan:** 58
- **Respuestas de error y detalle contractual:** `openapi/endpoints/iam.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | DESCONOCIDO | `/iam/auth` | Entrega el par de tokens según el modo configurado. Con la cookie apagada —el default— devuelve la respuesta tal cual y el contrato no cambia en absoluto. Con la cookie encendida escribe el refresh token en una cookie httpOnly y **lo quita del cuerpo**: dejarlo en los dos sitios no protegería de nada, porque el objetivo del ejercicio es que el token deje de estar al alcance de JavaScript. | BAJO | 0 | sesión (sin roles) |
| 2 | POST | `/iam/auth/activate` | Activar la cuenta con el token de un solo uso y fijar la contraseña | ALTO | 7 | pública |
| 3 | POST | `/iam/auth/change-password` | Cambiar la contraseña de la propia cuenta | ALTO | 6 | sesión (sin roles) |
| 4 | POST | `/iam/auth/forgot-password` | Solicitar el restablecimiento de la contraseña | ALTO | 11 | pública |
| 5 | POST | `/iam/auth/login` | Iniciar sesión con email o documento de identidad y contraseña | ALTO | 35 | pública |
| 6 | POST | `/iam/auth/logout` | Cerrar la sesión actual del usuario | ALTO | 4 | sesión (sin roles) |
| 7 | POST | `/iam/auth/logout-all` | Cerrar todas las sesiones del usuario actual | ALTO | 4 | sesión (sin roles) |
| 8 | POST | `/iam/auth/register-organization` | Registrar una organización con su cuenta owner | ALTO | 38 | pública |
| 9 | POST | `/iam/auth/register-patient` | Registrarse como paciente con documento de identidad | ALTO | 21 | pública |
| 10 | POST | `/iam/auth/register-practitioner` | Registrarse como profesional de salud con su matrícula | ALTO | 45 | pública |
| 11 | POST | `/iam/auth/resend-verification` | Reenviar el enlace de verificación del correo | ALTO | 9 | pública |
| 12 | POST | `/iam/auth/reset-password` | Fijar una contraseña nueva con el token recibido por correo | ALTO | 8 | pública |
| 13 | POST | `/iam/auth/sessions/purge` | Expirar sesiones y tokens vencidos | MEDIO | 3 | SECURITY_ADMIN |
| 14 | POST | `/iam/auth/token/refresh` | Rotar el refresh token | ALTO | 19 | pública |
| 15 | POST | `/iam/auth/upload-registration-document` | Pre-cargar un PDF para un registro de organización o profesional | ALTO | 6 | pública |
| 16 | POST | `/iam/auth/upload-registration-logo` | Pre-cargar el logo del consultorio propio para el registro | ALTO | 6 | pública |
| 17 | POST | `/iam/auth/upload-registration-signature-image` | Pre-cargar una imagen de firma o sello para el registro | ALTO | 6 | pública |
| 18 | POST | `/iam/auth/verify-email` | Verificar el correo con el token recibido | ALTO | 4 | pública |
| 19 | POST | `/iam/me/devices/{id}/confirm` | Reconocer un dispositivo propio («Fui yo») | ALTO | 5 | sesión (sin roles) |
| 20 | POST | `/iam/me/devices/{id}/confirm-code` | Enviar al correo verificado el código para reconocer un dispositivo | ALTO | 7 | sesión (sin roles) |
| 21 | POST | `/iam/me/devices/{id}/not-me` | No reconocer un dispositivo («No fui yo») y cerrar las otras sesiones | ALTO | 6 | sesión (sin roles) |
| 22 | GET | `/iam/me/mfa` | Estado de mi verificación en dos pasos | BAJO | 2 | sesión (sin roles) |
| 23 | POST | `/iam/me/mfa/{factorId}/revoke` | Quitar uno de mis factores de segundo paso | ALTO | 7 | sesión (sin roles) |
| 24 | POST | `/iam/me/mfa/totp` | Dar de alta mi app autenticadora (devuelve el secreto una vez) | ALTO | 8 | sesión (sin roles) |
| 25 | POST | `/iam/me/mfa/totp/{factorId}/confirm` | Confirmar mi app autenticadora con un código | ALTO | 8 | sesión (sin roles) |
| 26 | GET | `/iam/me/network` | La IP con la que me ve el servidor | BAJO | 0 | sesión (sin roles) |
| 27 | GET | `/iam/me/sessions` | Listar mis sesiones abiertas | BAJO | 1 | sesión (sin roles) |
| 28 | POST | `/iam/me/sessions/{id}/revoke` | Cerrar una de mis sesiones | ALTO | 4 | sesión (sin roles) |
| 29 | DELETE | `/iam/onboarding-drafts/{formType}/{draftId}` | Elimina el borrador al completar el alta exitosamente o por descarte del usuario | BAJO | 0 | pública |
| 30 | GET | `/iam/onboarding-drafts/{formType}/{draftId}` | Recupera un borrador de alta guardado por identificador y tipo de formulario | BAJO | 0 | pública |
| 31 | PUT | `/iam/onboarding-drafts/{formType}/{draftId}` | Guarda o actualiza el avance del formulario de alta en borrador | BAJO | 0 | pública |
| 32 | DELETE | `/iam/rescue/tenants/{tenantId}/ip-access-rules` | Rescate (SYSTEM): retirar las reglas de red de una organización | MEDIO | 3 | SYSTEM |
| 33 | DELETE | `/iam/rescue/tenants/{tenantId}/session-policies` | Rescate (SYSTEM): retirar las políticas de sesión de una organización | MEDIO | 2 | SYSTEM |
| 34 | GET | `/iam/users` | Listado paginado de usuarios (obsoleto) | BAJO | 2 | SECURITY_ADMIN |
| 35 | POST | `/iam/users` | Crear un usuario con credencial de contraseña y rol inicial | MEDIO | 6 | SECURITY_ADMIN |
| 36 | GET | `/iam/users/{id}` | Ficha de un usuario | BAJO | 1 | SECURITY_ADMIN |
| 37 | POST | `/iam/users/{id}/anonymize` | Anonimizar (DSAR) la cuenta | MEDIO | 8 | SECURITY_ADMIN |
| 38 | GET | `/iam/users/{id}/credentials` | Credenciales del usuario | BAJO | 2 | SECURITY_ADMIN |
| 39 | POST | `/iam/users/{id}/credentials/{cid}/revoke` | Revocar una credencial del usuario | MEDIO | 3 | SECURITY_ADMIN |
| 40 | POST | `/iam/users/{id}/credentials/federated` | Enlazar una credencial de identidad federada | MEDIO | 4 | SECURITY_ADMIN |
| 41 | GET | `/iam/users/{id}/devices` | Dispositivos del usuario | BAJO | 2 | SECURITY_ADMIN |
| 42 | POST | `/iam/users/{id}/devices` | Registrar un dispositivo del usuario | ALTO | 3 | sesión (sin roles) |
| 43 | GET | `/iam/users/{id}/global-roles` | Roles globales del usuario | BAJO | 2 | SECURITY_ADMIN |
| 44 | POST | `/iam/users/{id}/global-roles` | Conceder o revocar un rol global | MEDIO | 8 | SECURITY_ADMIN |
| 45 | POST | `/iam/users/{id}/lock` | Bloquear la cuenta y revocar sus sesiones | MEDIO | 7 | SECURITY_ADMIN |
| 46 | GET | `/iam/users/{id}/mfa-factors` | Factores de MFA del usuario | BAJO | 2 | SECURITY_ADMIN |
| 47 | POST | `/iam/users/{id}/mfa-factors` | Enrolar o verificar un factor MFA | ALTO | 8 | sesión (sin roles) |
| 48 | GET | `/iam/users/{id}/sessions` | Sesiones del usuario | BAJO | 2 | SECURITY_ADMIN |
| 49 | POST | `/iam/users/assisted-practitioner-registration` | Alta administrativa de un profesional (devuelve token de activación) | MEDIO | 42 | SECURITY_ADMIN |
| 50 | POST | `/iam/users/assisted-registration` | Registro asistido de un paciente (devuelve token de activación) | MEDIO | 10 | CLINICIAN, SECURITY_ADMIN |
| 51 | POST | `/iam/users/search` | Listado paginado de usuarios, con los filtros en el cuerpo | BAJO | 2 | SECURITY_ADMIN |
| 52 | GET | `/org/ip-access-rules` | Reglas de red de la organización | BAJO | 1 | SECURITY_ADMIN |
| 53 | PUT | `/org/ip-access-rules` | Definir las reglas de red de la organización | MEDIO | 3 | SECURITY_ADMIN |
| 54 | GET | `/org/session-policies` | Políticas de sesión de la organización | BAJO | 1 | SECURITY_ADMIN |
| 55 | PUT | `/org/session-policies` | Definir las políticas de sesión de la organización | MEDIO | 4 | SECURITY_ADMIN |

---

## 1. DESCONOCIDO /iam/auth

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Entrega el par de tokens según el modo configurado. Con la cookie apagada —el default— devuelve la respuesta tal cual y el contrato no cambia en absoluto. Con la cookie encendida escribe el refresh token en una cookie httpOnly y **lo quita del cuerpo**: dejarlo en los dos sitios no protegería de nada, porque el objetivo del ejercicio es que el token deje de estar al alcance de JavaScript.
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.deliverTokens` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:491`

### Qué es y para qué sirve (negocio)

Entrega el par de tokens según el modo configurado. Con la cookie apagada —el default— devuelve la respuesta tal cual y el contrato no cambia en absoluto. Con la cookie encendida escribe el refresh token en una cookie httpOnly y **lo quita del cuerpo**: dejarlo en los dos sitios no protegería de nada, porque el objetivo del ejercicio es que el token deje de estar al alcance de JavaScript. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`DESCONOCIDO /iam/auth` la atiende `IamAuthController.deliverTokens` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:491). Exige sesión; el controlador no declara roles. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:491` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/iam/presentation/controllers/iam-auth.controller.ts:491`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `TokenResponseDto` · DTO `TokenResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `accessToken` | `string` | Sí | — | — | JWT de acceso | `src/modules/iam/presentation/dto/token-response.dto.ts:52` |
| `refreshToken` | `string` | Sí | — | — | Refresh token en crudo; solo se entrega una vez | `src/modules/iam/presentation/dto/token-response.dto.ts:60` |
| `expiresAt` | `string` | Sí | formato date-time | — | Expiración de la sesión | `src/modules/iam/presentation/dto/token-response.dto.ts:70` |
| `newDevice` | `NewDeviceNoticeDto` | No | — | — | Solo en el login, y solo si el dispositivo es nuevo y alguna política aplicable tiene `newDeviceAlert`. Es un aviso de presentación. | `src/modules/iam/presentation/dto/token-response.dto.ts:77` |
| `newDevice.deviceId` | `string` | No | formato uuid | — | Dispositivo, para confirmarlo con `POST /iam/me/devices/:id/confirm`. | `src/modules/iam/presentation/dto/token-response.dto.ts:7` |
| `newDevice.label` | `string` | No | — | — | Cómo se lo nombra a la persona: «Chrome en Windows». | `src/modules/iam/presentation/dto/token-response.dto.ts:11` |
| `newDevice.ip` | `string` | No | — | — | Origen del inicio de sesión, tal como lo vio el servidor. | `src/modules/iam/presentation/dto/token-response.dto.ts:15` |
| `newDevice.occurredAt` | `string` | No | formato date-time | — | Cuándo se abrió la sesión. | `src/modules/iam/presentation/dto/token-response.dto.ts:19` |
| `mfaEnrollmentRequired` | `boolean` | No | — | — | Solo en el login, y solo si una política exige el segundo paso y la cuenta no tiene un factor confirmado: la persona debe darlo de alta con `POST /iam/me/mfa/totp` y confirmarlo. | `src/modules/iam/presentation/dto/token-response.dto.ts:85` |
| `deniedTenants` | `array<DeniedTenantDto>` | No | — | — | Organizaciones a las que la persona pertenece pero en las que NO puede actuar ahora (franja horaria, red, segundo factor). No están en `tenants` del token: la política de una organización rige solo en ella y no le cierra la sesión en las demás. | `src/modules/iam/presentation/dto/token-response.dto.ts:94` |
| `deniedTenants[].tenantId` | `string` | No | formato uuid | — | Organización. | `src/modules/iam/presentation/dto/token-response.dto.ts:26` |
| `deniedTenants[].reason` | `string` | No | valores: OUTSIDE_ALLOWED_HOURS, OUTSIDE_ALLOWED_NETWORK, IDLE_TIMEOUT, MFA_REQUIRED, MFA_ENROLLMENT_REQUIRED | — | Por qué: `OUTSIDE_ALLOWED_HOURS`, `OUTSIDE_ALLOWED_NETWORK`, `IDLE_TIMEOUT`, `MFA_REQUIRED` (presentar el código al iniciar sesión) o `MFA_ENROLLMENT_REQUIRED` (dar de alta el segundo factor). Las peticiones con `X-Tenant-Id` de esa organización reciben 403 con el mismo motivo. | `src/modules/iam/presentation/dto/token-response.dto.ts:43` |
| `deviceCookie` | `string` | No | — | — | Solo en el login y solo si la cookie de dispositivo está encendida (`AUTH_DEVICE_COOKIE_ENABLED`): valor firmado que el controlador entrega como cookie HttpOnly y QUITA del cuerpo. El cliente no lo ve. | `src/modules/iam/presentation/dto/token-response.dto.ts:103` |

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
- **Implementación:** `IamAuthController.activate` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:342`

### Qué es y para qué sirve (negocio)

Activar la cuenta con el token de un solo uso y fijar la contraseña. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/activate` la atiende `IamAuthController.activate` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:342). Es una ruta pública: no exige token. Valida el cuerpo como `ActivateAccountDto` (2 campos, 2 obligatorios). Delega en `IamAssistedRegistrationService.activateAccount`. Crea filas en iam.security_events. Actualiza iam.account_activations, iam.authentication_credentials, iam.users. Lee iam.account_activations, iam.authentication_credentials, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:342` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:342` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.account_activations` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.activate → IamAssistedRegistrationService.activateAccount | `src/modules/iam/application/services/iam-assisted-registration.service.ts:284` |
| `iam.account_activations` | LEE | LEE | DIRECTA | IamAuthController.activate → IamAssistedRegistrationService.activateAccount → AccountActivationsRepository.findByTokenHash | `src/modules/iam/infrastructure/repositories/account-activations.repository.ts:67` |
| `iam.authentication_credentials` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.activate → IamAssistedRegistrationService.activateAccount | `src/modules/iam/application/services/iam-assisted-registration.service.ts:320` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.activate → IamAssistedRegistrationService.activateAccount → CredentialsRepository.findPendingPasswordByUser | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:211` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.activate → IamAssistedRegistrationService.activateAccount → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.activate → IamAssistedRegistrationService.activateAccount | `src/modules/iam/application/services/iam-assisted-registration.service.ts:330` |
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
- **Implementación:** `IamAccountSecurityController.changePassword` — `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:81`

### Qué es y para qué sirve (negocio)

Cambiar la contraseña de la propia cuenta. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/change-password` la atiende `IamAccountSecurityController.changePassword` (src/modules/iam/presentation/controllers/iam-account-security.controller.ts:81). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ChangePasswordDto` (2 campos, 2 obligatorios). Delega en `IamAccountSecurityService.changePassword`. Crea filas en iam.security_events. Actualiza iam.authentication_credentials, iam.refresh_tokens, iam.sessions. Lee iam.authentication_credentials, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:81` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:81` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 5, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:81` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAccountSecurityController.changePassword → IamAccountSecurityService.changePassword | `src/modules/iam/application/services/iam-account-security.service.ts:141` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAccountSecurityController.changePassword → IamAccountSecurityService.changePassword → CredentialsRepository.findActivePasswordByUser | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:132` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAccountSecurityController.changePassword → IamAccountSecurityService.changePassword → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:96` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAccountSecurityController.changePassword → IamAccountSecurityService.changePassword → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAccountSecurityController.changePassword → IamAccountSecurityService.changePassword → SessionsRepository.revokeByIds | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:131` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAccountSecurityController.changePassword → IamAccountSecurityService.changePassword → SessionsRepository.findActiveByUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:117` |

### Cuerpo — DTO `ChangePasswordDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `currentPassword` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Contraseña actual | `src/modules/iam/presentation/dto/account-security.dto.ts:18` |
| `newPassword` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | Contraseña nueva | `src/modules/iam/presentation/dto/account-security.dto.ts:31` |

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
| `revokedSessions` | `number` | Sí | — | — | Nº de las otras sesiones que se revocaron | `src/modules/iam/presentation/dto/account-security.dto.ts:40` |

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
- **Implementación:** `IamAuthController.forgotPassword` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:410`

### Qué es y para qué sirve (negocio)

Solicitar el restablecimiento de la contraseña. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/forgot-password` la atiende `IamAuthController.forgotPassword` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:410). Es una ruta pública: no exige token. Valida el cuerpo como `ForgotPasswordDto` (1 campo, 1 obligatorio). Delega en `IamPasswordResetService.requestReset`. Crea filas en iam.password_resets, iam.security_events, messaging.notification_requests. Actualiza iam.password_resets. Lee iam.authentication_credentials, iam.email_verifications, iam.users, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:410` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 5, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:410` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → CredentialsRepository.findActivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:67` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.resolveEmail → EmailVerificationsRepository.findLatestByUser | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:85` |
| `iam.password_resets` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → PasswordResetsRepository.revokeActiveForUser | `src/modules/iam/infrastructure/repositories/password-resets.repository.ts:74` |
| `iam.password_resets` | ESCRIBE | CREA | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → PasswordResetsRepository.create | `src/modules/iam/infrastructure/repositories/password-resets.repository.ts:38` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.sendResetEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.sendResetEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.sendResetEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.sendResetEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.forgotPassword → IamPasswordResetService.requestReset → IamPasswordResetService.sendResetEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |

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
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La notificación a una dirección externa también necesita el usuario destinatario / La notificación necesita el usuario destinatario; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:290` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /iam/auth/login

- **Origen:** CONTRATO
- **Nombre:** Iniciar sesión con email o documento de identidad y contraseña
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.login` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:361`

### Qué es y para qué sirve (negocio)

Iniciar sesión con email o documento de identidad y contraseña. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/login` la atiende `IamAuthController.login` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:361). Es una ruta pública: no exige token. Valida el cuerpo como `LoginDto` (4 campos, 1 obligatorio). Delega en `IamAuthService.login`. Crea filas en iam.account_lockouts, iam.devices, iam.refresh_tokens, iam.security_events, iam.sessions, messaging.notification_requests. Actualiza iam.account_lockouts, iam.devices, iam.refresh_tokens, iam.sessions, iam.users. Lee authz.roles, authz.user_role_assignments, common.contact_points, delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.account_lockouts, iam.authentication_credentials y 16 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:361` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:361` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadAuthority → IamAuthService.mergeRoleCodes → AuthzBusinessRolesAdapter.scopedAssignmentsForUser → AuthzEffectiveRolesService.scopedAssignmentsForUser | `src/modules/authz/services/authz-effective-roles.service.ts:96` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadAuthority → IamAuthService.mergeRoleCodes → AuthzBusinessRolesAdapter.scopedAssignmentsForUser → AuthzEffectiveRolesService.scopedAssignmentsForUser → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `common.contact_points` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → CredentialsRepository.findActivePasswordByLoginIdentifier | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:108` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadAuthority → DelegatedAccessSupportClaimsAdapter.listTenantIdsWithActiveEngagement | `src/modules/iam/infrastructure/adapters/delegated-access-support-claims.adapter.ts:30` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadAuthority → DelegatedAccessSupportClaimsAdapter.listTenantIdsWithActiveEngagement | `src/modules/iam/infrastructure/adapters/delegated-access-support-claims.adapter.ts:24` |
| `directory.tenants` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadTenantDisplay → DirectoryTenantClaimsAdapter.describeTenants | `src/modules/iam/infrastructure/adapters/directory-tenant-claims.adapter.ts:57` |
| `iam.account_lockouts` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → IamAuthService.lockAccount → AccountLockoutsRepository.lockForFailedAttempts | `src/modules/iam/infrastructure/repositories/account-lockouts.repository.ts:76` |
| `iam.account_lockouts` | ESCRIBE | CREA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → IamAuthService.lockAccount → AccountLockoutsRepository.lockForFailedAttempts → AccountLockoutsRepository.create | `src/modules/iam/infrastructure/repositories/account-lockouts.repository.ts:40` |
| `iam.account_lockouts` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → IamAuthService.lockAccount → AccountLockoutsRepository.lockForFailedAttempts → AccountLockoutsRepository.findActiveForUser | `src/modules/iam/infrastructure/repositories/account-lockouts.repository.ts:106` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → CredentialsRepository.findActivePasswordByLoginIdentifier | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:100` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamDeviceRecognitionService.recognize → IamDeviceRecognitionService.resolve | `src/modules/iam/application/services/iam-device-recognition.service.ts:198` |
| `iam.devices` | ESCRIBE | CREA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamDeviceRecognitionService.recognize → IamDeviceRecognitionService.resolve → DevicesRepository.create | `src/modules/iam/infrastructure/repositories/devices.repository.ts:41` |
| `iam.devices` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamDeviceRecognitionService.recognize → IamDeviceRecognitionService.resolve → DevicesRepository.findByIdAndUser | `src/modules/iam/infrastructure/repositories/devices.repository.ts:69` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamDeviceRecognitionService.recognize → IamDeviceRecognitionService.notifyOutOfBand → EmailVerificationsRepository.findLatestVerifiedByUser | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:107` |
| `iam.mfa_factors` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.assertMfaChallenge → MfaFactorsRepository.findVerifiedByUser | `src/modules/iam/infrastructure/repositories/mfa-factors.repository.ts:54` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → IamAuthService.lockAccount → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:96` |
| `iam.refresh_tokens` | ESCRIBE | CREA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → RefreshTokensRepository.create | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:39` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.security_events` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → SecurityEventsRepository.countFailedLoginsSince | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:66` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → IamAuthService.lockAccount → SessionsRepository.revokeAllActiveForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:104` |
| `iam.sessions` | ESCRIBE | CREA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → SessionsRepository.create | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:43` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.handleFailedPassword → IamAuthService.lockAccount → SessionsRepository.activeSessionIdsForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:94` |
| `iam.user_global_roles` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadAuthority → UserGlobalRolesRepository.findActiveForUser | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:57` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin | `src/modules/iam/application/services/iam-auth.service.ts:636` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamDeviceRecognitionService.recognize → IamDeviceRecognitionService.notifyOutOfBand → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamDeviceRecognitionService.recognize → IamDeviceRecognitionService.notifyOutOfBand → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamDeviceRecognitionService.recognize → IamDeviceRecognitionService.notifyOutOfBand → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamDeviceRecognitionService.recognize → IamDeviceRecognitionService.notifyOutOfBand → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamDeviceRecognitionService.recognize → IamDeviceRecognitionService.notifyOutOfBand → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_settings` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadTenantDisplay → DirectoryTenantClaimsAdapter.describeTenants → DirectoryTenantClaimsAdapter.accountKinds | `src/modules/iam/infrastructure/adapters/directory-tenant-claims.adapter.ts:99` |
| `practice.practices` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadTenantDisplay → DirectoryTenantClaimsAdapter.describeTenants → DirectoryTenantClaimsAdapter.accountKinds | `src/modules/iam/infrastructure/adapters/directory-tenant-claims.adapter.ts:93` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadPractitionerProfileId → ProfilesAccountProfileIdsAdapter.findPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | IamAuthController.login → IamAuthService.login → IamAuthService.performLogin → IamAuthService.loadPatientProfileId → ProfilesAccountProfileIdsAdapter.findPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
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
| `accessToken` | `string` | Sí | — | — | JWT de acceso | `src/modules/iam/presentation/dto/token-response.dto.ts:52` |
| `refreshToken` | `string` | Sí | — | — | Refresh token en crudo; solo se entrega una vez | `src/modules/iam/presentation/dto/token-response.dto.ts:60` |
| `expiresAt` | `string` | Sí | formato date-time | — | Expiración de la sesión | `src/modules/iam/presentation/dto/token-response.dto.ts:70` |
| `newDevice` | `NewDeviceNoticeDto` | No | — | — | Solo en el login, y solo si el dispositivo es nuevo y alguna política aplicable tiene `newDeviceAlert`. Es un aviso de presentación. | `src/modules/iam/presentation/dto/token-response.dto.ts:77` |
| `newDevice.deviceId` | `string` | No | formato uuid | — | Dispositivo, para confirmarlo con `POST /iam/me/devices/:id/confirm`. | `src/modules/iam/presentation/dto/token-response.dto.ts:7` |
| `newDevice.label` | `string` | No | — | — | Cómo se lo nombra a la persona: «Chrome en Windows». | `src/modules/iam/presentation/dto/token-response.dto.ts:11` |
| `newDevice.ip` | `string` | No | — | — | Origen del inicio de sesión, tal como lo vio el servidor. | `src/modules/iam/presentation/dto/token-response.dto.ts:15` |
| `newDevice.occurredAt` | `string` | No | formato date-time | — | Cuándo se abrió la sesión. | `src/modules/iam/presentation/dto/token-response.dto.ts:19` |
| `mfaEnrollmentRequired` | `boolean` | No | — | — | Solo en el login, y solo si una política exige el segundo paso y la cuenta no tiene un factor confirmado: la persona debe darlo de alta con `POST /iam/me/mfa/totp` y confirmarlo. | `src/modules/iam/presentation/dto/token-response.dto.ts:85` |
| `deniedTenants` | `array<DeniedTenantDto>` | No | — | — | Organizaciones a las que la persona pertenece pero en las que NO puede actuar ahora (franja horaria, red, segundo factor). No están en `tenants` del token: la política de una organización rige solo en ella y no le cierra la sesión en las demás. | `src/modules/iam/presentation/dto/token-response.dto.ts:94` |
| `deniedTenants[].tenantId` | `string` | No | formato uuid | — | Organización. | `src/modules/iam/presentation/dto/token-response.dto.ts:26` |
| `deniedTenants[].reason` | `string` | No | valores: OUTSIDE_ALLOWED_HOURS, OUTSIDE_ALLOWED_NETWORK, IDLE_TIMEOUT, MFA_REQUIRED, MFA_ENROLLMENT_REQUIRED | — | Por qué: `OUTSIDE_ALLOWED_HOURS`, `OUTSIDE_ALLOWED_NETWORK`, `IDLE_TIMEOUT`, `MFA_REQUIRED` (presentar el código al iniciar sesión) o `MFA_ENROLLMENT_REQUIRED` (dar de alta el segundo factor). Las peticiones con `X-Tenant-Id` de esa organización reciben 403 con el mismo motivo. | `src/modules/iam/presentation/dto/token-response.dto.ts:43` |
| `deviceCookie` | `string` | No | — | — | Solo en el login y solo si la cookie de dispositivo está encendida (`AUTH_DEVICE_COOKIE_ENABLED`): valor firmado que el controlador entrega como cookie HttpOnly y QUITA del cuerpo. El cliente no lo ve. | `src/modules/iam/presentation/dto/token-response.dto.ts:103` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: Credenciales inválidas; UnauthorizedException: {{ message: 'La política de sesión de su organización no per…}; UnauthorizedException: {{ message: 'La política de sesión de su organización solo p…}; UnauthorizedException: {{ message: 'Se requiere el código de verificación en dos pa…}; UnauthorizedException: {{ message: 'El código de verificación no es válido', detail…} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/accounting-practitioner-simple-http.int-spec.ts:74` |
| INTEGRACION | `test/integration/authz-clinical-scope.int-spec.ts:52` |
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
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:76` |
| INTEGRACION | `test/integration/insurance-plan-administration.int-spec.ts:63` |
| INTEGRACION | `test/integration/insurance-portability.int-spec.ts:65` |
| INTEGRACION | `test/integration/insurer-patients.int-spec.ts:66` |
| INTEGRACION | `test/integration/lab-reception-inbox.int-spec.ts:66` |
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:182` |
| INTEGRACION | `test/integration/observability.int-spec.ts:76` |
| INTEGRACION | `test/integration/organization-headquarters-location.int-spec.ts:111` |
| INTEGRACION | `test/integration/organization-legal-representative.int-spec.ts:96` |
| INTEGRACION | `test/integration/p23-cambiar-horario-con-citas.int-spec.ts:155` |
| INTEGRACION | `test/integration/p36-horario-flexible.int-spec.ts:86` |
| INTEGRACION | `test/integration/p39-nota-medica-filas.int-spec.ts:69` |
| INTEGRACION | `test/integration/p40-orden-basada-en-notas.int-spec.ts:89` |
| INTEGRACION | `test/integration/patient-access-revocation.int-spec.ts:50` |
| INTEGRACION | `test/integration/patient-diagnostic-orders.int-spec.ts:66` |
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:63` |
| INTEGRACION | `test/integration/patient-spending-http.int-spec.ts:76` |
| INTEGRACION | `test/integration/practice-ownership.int-spec.ts:71` |
| INTEGRACION | `test/integration/practitioner-credential-registration-files.int-spec.ts:154` |
| INTEGRACION | `test/integration/practitioner-license-registration-files.int-spec.ts:101` |
| INTEGRACION | `test/integration/practitioner-own-credential.int-spec.ts:42` |
| INTEGRACION | `test/integration/practitioner-own-profile.int-spec.ts:67` |
| INTEGRACION | `test/integration/practitioner-profile-identity-fields.int-spec.ts:53` |
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
- **Implementación:** `IamAuthController.logout` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:508`

### Qué es y para qué sirve (negocio)

Cerrar la sesión actual del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/logout` la atiende `IamAuthController.logout` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:508). Exige sesión; el controlador no declara roles. Delega en `IamAuthService.logout`. Crea filas en iam.security_events. Actualiza iam.refresh_tokens, iam.sessions. Lee iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:508` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:508` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
- **Implementación:** `IamAuthController.logoutAll` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:532`

### Qué es y para qué sirve (negocio)

Cerrar todas las sesiones del usuario actual. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/logout-all` la atiende `IamAuthController.logoutAll` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:532). Exige sesión; el controlador no declara roles. Delega en `IamAuthService.logoutAll`. Crea filas en iam.security_events. Actualiza iam.refresh_tokens, iam.sessions. Lee iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:532` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:532` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:217` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /iam/auth/register-organization

- **Origen:** CONTRATO
- **Nombre:** Registrar una organización con su cuenta owner
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.registerOrganization` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:144`

### Qué es y para qué sirve (negocio)

Registrar una organización con su cuenta owner. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/register-organization` la atiende `IamAuthController.registerOrganization` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:144). Es una ruta pública: no exige token. Valida el cuerpo como `RegisterOrganizationDto` (141 campos, 7 obligatorios). Delega en `IamOrganizationSelfRegistrationService.registerOrganization`. Crea filas en common.addresses, diagnostic_units.diagnostic_study_offerings, diagnostic_units.diagnostic_unit_sites, diagnostic_units.diagnostic_units, directory.branches, directory.tenant_affiliation_documents, directory.tenant_legal_representatives, directory.tenant_memberships y 14 más. Actualiza common.files. Lee common.file_versions, common.files, directory.tenant_affiliation_documents, directory.tenants, iam.authentication_credentials, messaging.message_channels, messaging.message_templates, messaging.notification_requests y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:144` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:144` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.materializeProfile → TenantTypeProfileService.materializeProfile → TenantTypeProfileService.materializePayerHeadquarters → AddressesRepository.create | `src/modules/common/repositories/addresses.repository.ts:154` |
| `common.file_versions` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachOne → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachOne → AttachableFileService.claimAnonymousUpload | `src/modules/common/services/attachable-file.service.ts:270` |
| `common.files` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachOne → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:182` |
| `diagnostic_units.diagnostic_study_offerings` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.materializeProfile → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticStudyOfferingsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-study-offerings.repository.ts:119` |
| `diagnostic_units.diagnostic_unit_sites` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.materializeProfile → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticUnitSitesRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-unit-sites.repository.ts:72` |
| `diagnostic_units.diagnostic_units` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.materializeProfile → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticUnitsRepository.create | `src/modules/diagnostic_units/repositories/diagnostic-units.repository.ts:83` |
| `directory.branches` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.createPharmacyBranches → DirectoryRegistrationAdapter.createBranch → BranchesRepository.create | `src/modules/directory/repositories/branches.repository.ts:76` |
| `directory.tenant_affiliation_documents` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachOne → DirectoryTenantLegalRepository.createAffiliationDocument | `src/modules/directory/repositories/directory-tenant-legal.repository.ts:108` |
| `directory.tenant_affiliation_documents` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachOne → DirectoryTenantLegalRepository.findAffiliationDocumentByFile | `src/modules/directory/repositories/directory-tenant-legal.repository.ts:100` |
| `directory.tenant_legal_representatives` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationRepresentativesService.register → DirectoryRegistrationAdapter.attachRegistrationRepresentatives → TenantLegalRepresentativesService.attachRegistrationRepresentatives → DirectoryTenantLegalRepository.createLegalRepresentative | `src/modules/directory/repositories/directory-tenant-legal.repository.ts:140` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.createTenantMembership → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:150` |
| `directory.tenants` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.createTenant → TenantsRepository.create | `src/modules/directory/repositories/tenants.repository.ts:131` |
| `directory.tenants` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.findTenantByCode → TenantsRepository.findByCode | `src/modules/directory/repositories/tenants.repository.ts:76` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → CredentialsRepository.createPassword | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:280` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:197` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → EmailVerificationsRepository.create | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:41` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → UserGlobalRolesRepository.create | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → UsersRepository.create | `src/modules/iam/infrastructure/repositories/users.repository.ts:49` |
| `insurance.insurance_brokers` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.materializeProfile → TenantTypeProfileService.materializeProfile → CatalogRepository.createBroker | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:256` |
| `insurance.insurance_carriers` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.materializeProfile → TenantTypeProfileService.materializeProfile → CatalogRepository.createCarrier | `src/modules/insurance/infrastructure/repositories/catalog.repository.ts:62` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachOne → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → IamOrganizationSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `pharmacy.pharmacies` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → PharmacyRegistrationAdapter.provision → PharmacyProvisioningService.provision → PharmaciesRepository.create | `src/modules/pharmacy/repositories/pharmacies.repository.ts:76` |
| `pharmacy.pharmacy_product_categories` | ESCRIBE | CREA | POR_SQL | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → PharmacyRegistrationAdapter.provision → PharmacyProvisioningService.provision → PharmacyCategoriesService.provisionDefaults → PharmacyCatalogRepository.insertMissingCategories | `src/modules/pharmacy/repositories/pharmacy-catalog.repository.ts:126` |
| `pharmacy.pharmacy_sites` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → PharmacyRegistrationAdapter.provision → PharmacyProvisioningService.provision → PharmacyProvisioningService.createSite → PharmacySitesRepository.create | `src/modules/pharmacy/repositories/pharmacy-sites.repository.ts:73` |
| `practice.practice_sites` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → PharmacyRegistrationAdapter.provision → PharmacyProvisioningService.provision → PharmacyProvisioningService.createSite → PracticeSitesRepository.create | `src/modules/practice/repositories/practice-sites.repository.ts:111` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.materializeProfile → TenantTypeProfileService.materializeProfile → DiagnosticUnitProvisioningService.provision → DiagnosticUnitProvisioningService.createPracticeSite → PracticeSitesRepository.findByPracticeAndCode | `src/modules/practice/repositories/practice-sites.repository.ts:85` |
| `practice.practices` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → PharmacyRegistrationAdapter.provision → PharmacyProvisioningService.provision → PracticesRepository.create | `src/modules/practice/repositories/practices.repository.ts:150` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.assertConceptsExist → TenantTypeProfileService.assertConceptsExist → CatalogConceptsRepository.findByIds | `src/modules/terminology/repositories/catalog-concepts.repository.ts:202` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachRegistrationDocuments → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachRegistrationDocuments → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | IamAuthController.registerOrganization → IamOrganizationSelfRegistrationService.registerOrganization → IamOrganizationSelfRegistrationService.performRegisterOrganization → DirectoryRegistrationAdapter.attachRegistrationDocuments → TenantAffiliationDocumentsService.attachRegistrationDocuments → AffiliationDocumentConceptsService.resolve → AffiliationDocumentConceptsService.load → AffiliationDocumentConceptsService.resolveValueSet → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Cuerpo — DTO `RegisterOrganizationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `organization` | `RegisterOrganizationDetailsDto` | Sí | — | `@IsNotEmptyObject()` `@ValidateNested()` `@Type(() => RegisterOrganizationDetailsDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:819` |
| `organization.code` | `string` | Sí | longitud mínima 3; longitud máxima 100; patrón runtime /^[A-Za-z0-9._-]+$/ | `@IsString()` `@MinLength(3)` `@MaxLength(100)` `@Matches(/^[A-Za-z0-9._-]+$/, { message: 'El código sólo admite letras, dígitos, punto, guion y guion bajo', })` | Código único global de la organización | `src/modules/iam/presentation/dto/register-organization.dto.ts:501` |
| `organization.legalName` | `string` | Sí | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Razón social / nombre legal | `src/modules/iam/presentation/dto/register-organization.dto.ts:510` |
| `organization.tradeName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Nombre comercial | `src/modules/iam/presentation/dto/register-organization.dto.ts:519` |
| `organization.tenantType` | `string` | Sí | valores: PROVIDER, PAYER, BROKER, UNIVERSITY, PHARMACY, HOSPITAL, CLINIC, MEDICAL_OFFICE, NURSING, HEALTH_OTHER, HEALTH_BUSINESS, DIAGNOSTIC_CENTER | `@IsIn(TENANT_TYPE_CODES)` | Tipo de organización. Obligatorio: cada tipo exige sus propios datos. PAYER exige el bloque `payer` y BROKER el bloque `broker`. El resto —PROVIDER, UNIVERSITY, PHARMACY, DIAGNOSTIC_CENTER y las cinco institucionales (HOSPITAL, CLINIC, MEDICAL_OFFICE, NURSING, HEALTH_OTHER) y HEALTH_BUSINESS— exigen país y jurisdicción, que es lo que determina bajo qué regulador operan. | `src/modules/iam/presentation/dto/register-organization.dto.ts:538` |
| `organization.legalEntityType` | `string` | No | valores: UNIPERSONAL, SRL, LTDA, SA, SOCIEDAD_COLECTIVA, COMANDITA_SIMPLE, COMANDITA_ACCIONES, SUCURSAL_EXTRANJERA, BR_LTDA, BR_SA, BR_MEI, BR_EI, BR_SLU, BR_FILIAL_EST, US_LLC, US_CORP, US_SOLE_PROP, US_LLP, US_BRANCH, AR_SAS, MX_S_RL, SAM, ASOCIACION_ACCIDENTAL, SOCIEDAD_CIVIL, PROFESIONAL_INDEPENDIENTE, COOPERATIVA, MUTUAL, EMPRESA_SOCIAL, ASOCIACION_CIVIL, FUNDACION, ONG, ENTIDAD_RELIGIOSA, IFD, ORGANIZACION_SOCIAL, ENTIDAD_PUBLICA, EMPRESA_ESTATAL, EMPRESA_ESTATAL_MIXTA, EMPRESA_MIXTA, EMPRESA_ESTATAL_INTERGUBERNAMENTAL, ORGANISMO_INTERNACIONAL | `@IsOptional()` `@IsIn(LEGAL_ENTITY_TYPE_CODES)` | Tipo societario del diccionario internacional (BO/BR/US/AR/MX). Sin él, la organización nace con la forma legada `COMPANY`. | `src/modules/iam/presentation/dto/register-organization.dto.ts:558` |
| `organization.taxIdentifier` | `string` | No | longitud mínima 1; longitud máxima 50 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(50)` | Identificación tributaria (NIT en Bolivia); se registra como número del documento tributario | `src/modules/iam/presentation/dto/register-organization.dto.ts:579` |
| `organization.legalDocuments` | `RegisterOrganizationLegalDocumentsDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => RegisterOrganizationLegalDocumentsDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:595` |
| `organization.legalDocuments.constitutionFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Escritura de constitución (fileId de POST /iam/auth/upload-registration-document). Obligatoria salvo para UNIPERSONAL y PROFESIONAL_INDEPENDIENTE (personas naturales), que no la tienen; el servicio responde 422 nombrando el documento faltante | `src/modules/iam/presentation/dto/register-organization.dto.ts:61` |
| `organization.legalDocuments.taxIdentifierFileId` | `string` | No | formato uuid | `@IsUUID()` | Identificación tributaria (NIT en Bolivia) | `src/modules/iam/presentation/dto/register-organization.dto.ts:71` |
| `organization.legalDocuments.commerceRegistryFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Registro mercantil (matrícula SEPREC en Bolivia). Obligatorio salvo para PROFESIONAL_INDEPENDIENTE, que ejerce con su NIT personal sin matrícula de comercio; el servicio responde 422 nombrando el documento faltante | `src/modules/iam/presentation/dto/register-organization.dto.ts:83` |
| `organization.legalDocuments.operatingLicenseFileId` | `string` | No | formato uuid | `@IsUUID()` | Licencia de funcionamiento | `src/modules/iam/presentation/dto/register-organization.dto.ts:90` |
| `organization.legalDocuments.healthAuthorityCertificateFileId` | `string` | No | formato uuid | `@IsUUID()` | Certificado de la autoridad sanitaria (SEDES en Bolivia) | `src/modules/iam/presentation/dto/register-organization.dto.ts:100` |
| `organization.legalRepresentative` | `RegisterOrganizationLegalRepresentativeDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => RegisterOrganizationLegalRepresentativeDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:615` |
| `organization.legalRepresentative.name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationLegalRepresentativeDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:243` |
| `organization.legalRepresentative.middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:252` |
| `organization.legalRepresentative.lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationLegalRepresentativeDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:265` |
| `organization.legalRepresentative.motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:274` |
| `organization.legalRepresentative.fullName` | `string` | No | longitud mínima 3; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(3)` `@MaxLength(200)` | Nombre completo del representante legal (forma anterior; preferí name/lastName) | `src/modules/iam/presentation/dto/register-organization.dto.ts:293` |
| `organization.legalRepresentative.idNumber` | `string` | No | longitud mínima 4; longitud máxima 50 | `@IsString()` `@MinLength(4)` `@MaxLength(50)` | Cédula de identidad o documento legal equivalente | `src/modules/iam/presentation/dto/register-organization.dto.ts:306` |
| `organization.legalRepresentative.email` | `string` | No | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Correo oficial para notificaciones legales | `src/modules/iam/presentation/dto/register-organization.dto.ts:319` |
| `organization.legalRepresentative.phone` | `string` | No | longitud mínima 7; longitud máxima 30 | `@IsOptional()` `@IsString()` `@MinLength(7)` `@MaxLength(30)` | Teléfono de contacto del representante | `src/modules/iam/presentation/dto/register-organization.dto.ts:334` |
| `organization.legalRepresentative.powerOfAttorneyFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del archivo del poder notariado (PDF ya pre-cargado). Obligatorio salvo para UNIPERSONAL, donde el titular actúa por sí; el servicio responde 422 si falta | `src/modules/iam/presentation/dto/register-organization.dto.ts:347` |
| `organization.executives` | `RegisterOrganizationExecutivesDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => RegisterOrganizationExecutivesDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:626` |
| `organization.executives.generalManager` | `RegisterOrganizationExecutiveContactDto` | No | — | `@IsNotEmptyObject()` `@ValidateNested()` `@Type(() => RegisterOrganizationExecutiveContactDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:367` |
| `organization.executives.generalManager.name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationExecutiveContactDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:135` |
| `organization.executives.generalManager.middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:144` |
| `organization.executives.generalManager.lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationExecutiveContactDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:157` |
| `organization.executives.generalManager.motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:166` |
| `organization.executives.generalManager.fullName` | `string` | No | longitud mínima 3; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(3)` `@MaxLength(200)` | Nombre completo del ejecutivo (forma anterior; preferí name/lastName) | `src/modules/iam/presentation/dto/register-organization.dto.ts:185` |
| `organization.executives.generalManager.phone` | `string` | No | longitud mínima 7; longitud máxima 30 | `@IsString()` `@MinLength(7)` `@MaxLength(30)` | Teléfono celular de contacto | `src/modules/iam/presentation/dto/register-organization.dto.ts:202` |
| `organization.executives.generalManager.email` | `string` | No | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Correo electrónico corporativo | `src/modules/iam/presentation/dto/register-organization.dto.ts:215` |
| `organization.executives.commercialManager` | `RegisterOrganizationExecutiveContactDto` | No | — | `@IsNotEmptyObject()` `@ValidateNested()` `@Type(() => RegisterOrganizationExecutiveContactDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:376` |
| `organization.executives.commercialManager.name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationExecutiveContactDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:135` |
| `organization.executives.commercialManager.middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:144` |
| `organization.executives.commercialManager.lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationExecutiveContactDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:157` |
| `organization.executives.commercialManager.motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:166` |
| `organization.executives.commercialManager.fullName` | `string` | No | longitud mínima 3; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(3)` `@MaxLength(200)` | Nombre completo del ejecutivo (forma anterior; preferí name/lastName) | `src/modules/iam/presentation/dto/register-organization.dto.ts:185` |
| `organization.executives.commercialManager.phone` | `string` | No | longitud mínima 7; longitud máxima 30 | `@IsString()` `@MinLength(7)` `@MaxLength(30)` | Teléfono celular de contacto | `src/modules/iam/presentation/dto/register-organization.dto.ts:202` |
| `organization.executives.commercialManager.email` | `string` | No | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Correo electrónico corporativo | `src/modules/iam/presentation/dto/register-organization.dto.ts:215` |
| `organization.executives.marketingManager` | `RegisterOrganizationExecutiveContactDto` | No | — | `@IsNotEmptyObject()` `@ValidateNested()` `@Type(() => RegisterOrganizationExecutiveContactDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:385` |
| `organization.executives.marketingManager.name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationExecutiveContactDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:135` |
| `organization.executives.marketingManager.middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:144` |
| `organization.executives.marketingManager.lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationExecutiveContactDto) => dto.fullName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:157` |
| `organization.executives.marketingManager.motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:166` |
| `organization.executives.marketingManager.fullName` | `string` | No | longitud mínima 3; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(3)` `@MaxLength(200)` | Nombre completo del ejecutivo (forma anterior; preferí name/lastName) | `src/modules/iam/presentation/dto/register-organization.dto.ts:185` |
| `organization.executives.marketingManager.phone` | `string` | No | longitud mínima 7; longitud máxima 30 | `@IsString()` `@MinLength(7)` `@MaxLength(30)` | Teléfono celular de contacto | `src/modules/iam/presentation/dto/register-organization.dto.ts:202` |
| `organization.executives.marketingManager.email` | `string` | No | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Correo electrónico corporativo | `src/modules/iam/presentation/dto/register-organization.dto.ts:215` |
| `organization.payer` | `PayerProfileDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => PayerProfileDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:635` |
| `organization.payer.carrierCode` | `string` | No | longitud mínima 1; longitud máxima 60 | `@IsString()` `@MinLength(1)` `@MaxLength(60)` | Código de la aseguradora | `src/common/dto/tenant-type-profile.dto.ts:37` |
| `organization.payer.sigla` | `string` | No | longitud mínima 1; longitud máxima 20 | `@IsString()` `@MinLength(1)` `@MaxLength(20)` | Sigla de la aseguradora | `src/common/dto/tenant-type-profile.dto.ts:50` |
| `organization.payer.address` | `string` | No | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Dirección de la aseguradora | `src/common/dto/tenant-type-profile.dto.ts:59` |
| `organization.payer.latitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: PayerProfileDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | Latitud de la casa matriz (-90 a 90); va junto con longitude o no va | `src/common/dto/tenant-type-profile.dto.ts:85` |
| `organization.payer.longitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: PayerProfileDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | Longitud de la casa matriz (-180 a 180); va junto con latitude o no va | `src/common/dto/tenant-type-profile.dto.ts:102` |
| `organization.payer.regulatorIdentifier` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Identificador ante el regulador de seguros | `src/common/dto/tenant-type-profile.dto.ts:114` |
| `organization.payer.jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/tenant-type-profile.dto.ts:122` |
| `organization.broker` | `BrokerProfileDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => BrokerProfileDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:644` |
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
| `organization.diagnosticUnit` | `DiagnosticUnitProfileDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => DiagnosticUnitProfileDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:655` |
| `organization.diagnosticUnit.code` | `string` | No | longitud mínima 3; longitud máxima 100; patrón runtime /^[A-Za-z0-9._-]+$/ | `@IsOptional()` `@IsString()` `@MinLength(3)` `@MaxLength(100)` `@Matches(/^[A-Za-z0-9._-]+$/, { message: 'El código sólo admite letras, dígitos, punto, guion y guion bajo', })` | — | `src/common/dto/tenant-type-profile.dto.ts:271` |
| `organization.diagnosticUnit.name` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | — | `src/common/dto/tenant-type-profile.dto.ts:284` |
| `organization.diagnosticUnit.diagnosticUnitTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/tenant-type-profile.dto.ts:294` |
| `organization.diagnosticUnit.modalityConceptIds` | `array<string>` | No | formato uuid; máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayUnique()` `@ArrayMaxSize(20)` `@IsUUID(undefined, { each: true })` | — | `src/common/dto/tenant-type-profile.dto.ts:307` |
| `organization.diagnosticUnit.walkInAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/common/dto/tenant-type-profile.dto.ts:315` |
| `organization.diagnosticUnit.homeCollectionAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/common/dto/tenant-type-profile.dto.ts:323` |
| `organization.diagnosticUnit.primarySite` | `DiagnosticUnitPrimarySiteDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => DiagnosticUnitPrimarySiteDto)` | — | `src/common/dto/tenant-type-profile.dto.ts:333` |
| `organization.diagnosticUnit.primarySite.name` | `string` | No | longitud mínima 2; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(2)` `@MaxLength(200)` | — | `src/common/dto/tenant-type-profile.dto.ts:182` |
| `organization.diagnosticUnit.primarySite.timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/common/dto/tenant-type-profile.dto.ts:191` |
| `organization.diagnosticUnit.primarySite.address` | `OwnSiteAddressDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => OwnSiteAddressDto)` | — | `src/common/dto/tenant-type-profile.dto.ts:200` |
| `organization.diagnosticUnit.primarySite.address.lines` | `array<string>` | No | longitud máxima 500 | `@IsArray()` `@IsString({ each: true })` `@MaxLength(500, { each: true })` | Líneas de la dirección; puede ir vacía si la sede se ubica sólo por municipio o coordenadas | `src/common/dto/create-own-site.dto.ts:44` |
| `organization.diagnosticUnit.primarySite.address.city` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/common/dto/create-own-site.dto.ts:51` |
| `organization.diagnosticUnit.primarySite.address.municipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/create-own-site.dto.ts:57` |
| `organization.diagnosticUnit.primarySite.address.district` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/common/dto/create-own-site.dto.ts:67` |
| `organization.diagnosticUnit.primarySite.address.administrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/create-own-site.dto.ts:73` |
| `organization.diagnosticUnit.primarySite.address.latitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/common/dto/create-own-site.dto.ts:94` |
| `organization.diagnosticUnit.primarySite.address.longitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/common/dto/create-own-site.dto.ts:105` |
| `organization.diagnosticUnit.branches` | `array<DiagnosticUnitBranchDto>` | No | máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => DiagnosticUnitBranchDto)` | — | `src/common/dto/tenant-type-profile.dto.ts:345` |
| `organization.diagnosticUnit.branches[].name` | `string` | No | longitud mínima 2; longitud máxima 200 | `@IsString()` `@MinLength(2)` `@MaxLength(200)` | — | `src/common/dto/tenant-type-profile.dto.ts:217` |
| `organization.diagnosticUnit.branches[].address` | `OwnSiteAddressDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => OwnSiteAddressDto)` | — | `src/common/dto/tenant-type-profile.dto.ts:224` |
| `organization.diagnosticUnit.branches[].address.lines` | `array<string>` | No | longitud máxima 500 | `@IsArray()` `@IsString({ each: true })` `@MaxLength(500, { each: true })` | Líneas de la dirección; puede ir vacía si la sede se ubica sólo por municipio o coordenadas | `src/common/dto/create-own-site.dto.ts:44` |
| `organization.diagnosticUnit.branches[].address.city` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/common/dto/create-own-site.dto.ts:51` |
| `organization.diagnosticUnit.branches[].address.municipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/create-own-site.dto.ts:57` |
| `organization.diagnosticUnit.branches[].address.district` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/common/dto/create-own-site.dto.ts:67` |
| `organization.diagnosticUnit.branches[].address.administrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/create-own-site.dto.ts:73` |
| `organization.diagnosticUnit.branches[].address.latitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/common/dto/create-own-site.dto.ts:94` |
| `organization.diagnosticUnit.branches[].address.longitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/common/dto/create-own-site.dto.ts:105` |
| `organization.diagnosticUnit.branches[].description` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/common/dto/tenant-type-profile.dto.ts:231` |
| `organization.diagnosticUnit.branches[].locationUrl` | `string` | No | longitud máxima 2000; patrón runtime /^https?:\/\//i | `@IsOptional()` `@IsString()` `@MaxLength(2000)` `@Matches(/^https?:\/\//i, { message: 'locationUrl debe ser http o https' })` | — | `src/common/dto/tenant-type-profile.dto.ts:245` |
| `organization.countryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:663` |
| `organization.jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:671` |
| `organization.timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA | `src/modules/iam/presentation/dto/register-organization.dto.ts:684` |
| `organization.pharmacy` | `RegisterPharmacyBlockDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => RegisterPharmacyBlockDto)` | Sólo para PHARMACY: dirección y punto de la casa central y sucursales | `src/modules/iam/presentation/dto/register-organization.dto.ts:698` |
| `organization.pharmacy.address` | `string` | No | longitud máxima 500 | — | Dirección escrita de la casa central (dirección legal) | sin fuente |
| `organization.pharmacy.latitude` | `number` | No | — | — | Latitud de la casa central; va junto con longitude o no va | sin fuente |
| `organization.pharmacy.longitude` | `number` | No | — | — | Longitud de la casa central; va junto con latitude o no va | sin fuente |
| `organization.pharmacy.branches` | `array<RegisterPharmacyBranchDto>` | No | máximo 50 elemento(s) | — | — | sin fuente |
| `organization.pharmacy.branches[].name` | `string` | No | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Nombre de la sucursal | `src/modules/iam/presentation/dto/register-organization.dto.ts:394` |
| `organization.pharmacy.branches[].latitude` | `number` | No | — | `@ValidateIf( (dto: RegisterPharmacyBranchDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsLatitude()` | Latitud; va junto con longitude o no va | `src/modules/iam/presentation/dto/register-organization.dto.ts:405` |
| `organization.pharmacy.branches[].longitude` | `number` | No | — | `@ValidateIf( (dto: RegisterPharmacyBranchDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsLongitude()` | Longitud; va junto con latitude o no va | `src/modules/iam/presentation/dto/register-organization.dto.ts:416` |
| `organization.pharmacy.branches[].description` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Descripción | `src/modules/iam/presentation/dto/register-organization.dto.ts:422` |
| `organization.pharmacy.branches[].locationUrl` | `string` | No | longitud máxima 2000; patrón runtime /^https?:\/\//i | `@IsOptional()` `@IsString()` `@MaxLength(2000)` `@Matches(/^https?:\/\//i, { message: 'locationUrl debe ser http o https' })` | Enlace de ubicación (http/https) | `src/modules/iam/presentation/dto/register-organization.dto.ts:432` |
| `owner` | `RegisterOrganizationOwnerDto` | Sí | — | `@IsNotEmptyObject()` `@ValidateNested()` `@Type(() => RegisterOrganizationOwnerDto)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:828` |
| `owner.email` | `string` | Sí | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Correo con el que el owner iniciará sesión | `src/modules/iam/presentation/dto/register-organization.dto.ts:719` |
| `owner.password` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:728` |
| `owner.name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationOwnerDto) => dto.displayName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:743` |
| `owner.middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:752` |
| `owner.lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf( (dto: RegisterOrganizationOwnerDto) => dto.displayName === undefined, )` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:764` |
| `owner.motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:773` |
| `owner.displayName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Forma anterior de declarar el nombre. Preferí name/lastName. | `src/modules/iam/presentation/dto/register-organization.dto.ts:792` |
| `owner.timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-organization.dto.ts:801` |

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
    "taxIdentifier": "1023456029",
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
          "district": "valor-ejemplo",
          "administrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
          "latitude": 1,
          "longitude": 1
        }
      },
      "branches": [
        {
          "name": "Sucursal Equipetrol",
          "address": {
            "lines": [
              "valor-ejemplo"
            ],
            "city": "valor-ejemplo",
            "municipalityConceptId": "00000000-0000-4000-8000-000000000001",
            "district": "valor-ejemplo",
            "administrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
            "latitude": 1,
            "longitude": 1
          },
          "description": "Frente al mercado",
          "locationUrl": "https://maps.google.com/?q=-17.78,-63.18"
        }
      ]
    },
    "countryConceptId": "00000000-0000-4000-8000-000000000001",
    "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
    "timeZone": "America/La_Paz",
    "pharmacy": {
      "address": "Av. Cristo Redentor 1234, Santa Cruz de la Sierra",
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
| `tenantId` | `string` | Sí | formato uuid | — | Identificador del tenant creado. | `src/modules/iam/presentation/dto/register-organization.dto.ts:837` |
| `code` | `string` | Sí | — | — | Código único de la organización, tal como quedó persistido. | `src/modules/iam/presentation/dto/register-organization.dto.ts:843` |
| `ownerUserId` | `string` | Sí | formato uuid | — | Identificador de la cuenta owner creada. | `src/modules/iam/presentation/dto/register-organization.dto.ts:849` |
| `membershipId` | `string` | Sí | formato uuid | — | Identificador de la membresía OWNER que vincula cuenta y organización. | `src/modules/iam/presentation/dto/register-organization.dto.ts:855` |
| `status` | `string` | Sí | formato uuid | — | Concepto de estado del tenant (pendiente de verificación) | `src/modules/iam/presentation/dto/register-organization.dto.ts:864` |
| `emailVerificationSent` | `boolean` | Sí | — | — | Si se pudo encolar el correo de verificación | `src/modules/iam/presentation/dto/register-organization.dto.ts:872` |
| `diagnosticUnitId` | `string` | No | formato uuid | — | Id de la unidad diagnóstica creada (sólo DIAGNOSTIC_CENTER) | `src/modules/iam/presentation/dto/register-organization.dto.ts:882` |
| `pharmacyId` | `string` | No | formato uuid | — | Id de la farmacia creada (sólo PHARMACY) | `src/modules/iam/presentation/dto/register-organization.dto.ts:892` |
| `legalDocumentsRegistered` | `number` | No | — | — | Cuántos documentos legales quedaron registrados pendientes de | `src/modules/iam/presentation/dto/register-organization.dto.ts:903` |
| `representativesRegistered` | `number` | No | — | — | Vínculos de representación registrados (representante legal + gerencias) | `src/modules/iam/presentation/dto/register-organization.dto.ts:916` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 409 | `CONFLICT` | ConflictException: El código de organización ya existe; ConflictException: Ya existe una cuenta con ese correo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un tenant de tipo PAYER exige el bloque `payer`; PreconditionFailedException: Un tenant de tipo BROKER exige el bloque `broker`; PreconditionFailedException: Un tenant de tipo {tenantType} exige país y jurisdicción; PreconditionFailedException: El tipo societario pertenece al derecho de {entry!.countryIso} y no coincide con el país declarado; PreconditionFailedException: El bloque `payer` sólo corresponde a un tenant de tipo PAYER; PreconditionFailedException: El bloque `broker` sólo corresponde a un tenant de tipo BROKER; PreconditionFailedException: El bloque `pharmacy` sólo corresponde a un tenant de tipo PHARMACY; PreconditionFailedException: El bloque `diagnosticUnit` sólo corresponde a un tenant de tipo DIAGNOSTIC_CENTER; PreconditionFailedException: El tipo de unidad diagnóstica declarado no es válido; PreconditionFailedException: Las sucursales sólo se declaran en una unidad de laboratorio clínico; PreconditionFailedException: Alguna modalidad declarada no pertenece al catálogo de modalidades diagnósticas; PreconditionFailedException: Los conceptos declarados no existen en el catálogo de terminología |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/accounting-practitioner-simple-http.int-spec.ts:173` |
| INTEGRACION | `test/integration/admin-listados.int-spec.ts:55` |
| INTEGRACION | `test/integration/fx14-cockpit-contable.int-spec.ts:73` |
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:99` |
| INTEGRACION | `test/integration/hardening/mch-001.int-spec.ts:54` |
| INTEGRACION | `test/integration/hardening/mch-034.int-spec.ts:39` |
| INTEGRACION | `test/integration/imaging-center-registration.int-spec.ts:53` |
| INTEGRACION | `test/integration/insurance-campaigns.int-spec.ts:49` |
| INTEGRACION | `test/integration/insurance-plan-administration.int-spec.ts:36` |
| INTEGRACION | `test/integration/insurer-patients.int-spec.ts:44` |
| INTEGRACION | `test/integration/lab-reception-inbox.int-spec.ts:52` |
| INTEGRACION | `test/integration/laboratory-registration.int-spec.ts:206` |
| INTEGRACION | `test/integration/medical-center-registration.int-spec.ts:35` |
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:129` |
| INTEGRACION | `test/integration/organization-headquarters-location.int-spec.ts:141` |
| INTEGRACION | `test/integration/organization-legal-documents.int-spec.ts:97` |
| INTEGRACION | `test/integration/organization-legal-entity-type.int-spec.ts:46` |
| INTEGRACION | `test/integration/organization-legal-representative.int-spec.ts:150` |
| INTEGRACION | `test/integration/organization-medical-types.int-spec.ts:95` |
| INTEGRACION | `test/integration/pharmacy-registration.int-spec.ts:117` |
| INTEGRACION | `test/integration/tenant-external-verification-requirements.int-spec.ts:46` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:261` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /iam/auth/register-patient

- **Origen:** CONTRATO
- **Nombre:** Registrarse como paciente con documento de identidad
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.registerPatient` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:120`

### Qué es y para qué sirve (negocio)

Registrarse como paciente con documento de identidad. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/register-patient` la atiende `IamAuthController.registerPatient` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:120). Es una ruta pública: no exige token. Valida el cuerpo como `RegisterPatientDto` (42 campos, 8 obligatorios). Delega en `IamPatientSelfRegistrationService.registerPatient`. Crea filas en common.contact_points, common.identifiers, directory.tenant_memberships, iam.authentication_credentials, iam.email_verifications, iam.security_events, iam.user_global_roles, iam.users y 5 más. Lee iam.authentication_credentials, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:120` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:120` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → CommonRecordsAdapter.createContactPoint → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:198` |
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → CommonRecordsAdapter.createIdentifier → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:174` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → DirectoryRegistrationAdapter.createTenantMembership → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:150` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → CredentialsRepository.createPassword | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:280` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:197` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → EmailVerificationsRepository.create | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:41` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → UserGlobalRolesRepository.create | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → UsersRepository.create | `src/modules/iam/infrastructure/repositories/users.repository.ts:49` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IamPatientSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IamPatientSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IamPatientSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IamPatientSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → IamPatientSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.patient_profiles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → ProfilesRegistrationAdapter.createPatientProfile → PatientProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:220` |
| `profiles.person_account_links` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → ProfilesRegistrationAdapter.createAccountLink → PersonAccountLinksRepository.create | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:50` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → ProfilesRegistrationAdapter.createPersonProfile → PersonProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → ProfilesRegistrationAdapter.createPerson → PersonsRepository.create | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:119` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → ProfilesRegistrationAdapter.assertIsAdministrativeArea → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → ProfilesRegistrationAdapter.assertIsAdministrativeArea → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | IamAuthController.registerPatient → IamPatientSelfRegistrationService.registerPatient → IamPatientSelfRegistrationService.performRegisterPatient → ProfilesRegistrationAdapter.assertIsAdministrativeArea → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Cuerpo — DTO `RegisterPatientDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nationalId` | `string` | Sí | longitud mínima 4; longitud máxima 40; patrón runtime /^[A-Za-z0-9.-]+$/ | `@IsString()` `@MinLength(4)` `@MaxLength(40)` `@Matches(/^[A-Za-z0-9.-]+$/, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Documento de identidad con el que se iniciará sesión | `src/modules/iam/presentation/dto/register-patient.dto.ts:184` |
| `issuerAdministrativeAreaConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `src/modules/iam/presentation/dto/register-patient.dto.ts:202` |
| `residenceMunicipalityConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `src/modules/iam/presentation/dto/register-patient.dto.ts:225` |
| `password` | `string` | Sí | longitud mínima 8; longitud máxima 200 | `@IsString()` `@MinLength(8)` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:234` |
| `name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPatientDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:250` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:262` |
| `lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: RegisterPatientDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:275` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:287` |
| `displayName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Forma anterior de declarar el nombre. Preferí name/lastName. | `src/modules/iam/presentation/dto/register-patient.dto.ts:306` |
| `email` | `string` | Sí | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:330` |
| `birthDate` | `string` | Sí | formato date | `@IsISO8601()` `@IsBirthDateInRange({ message: 'La fecha de nacimiento tiene que estar entre 1910 y hoy', })` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:344` |
| `phone` | `string` | Sí | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsString()` `@MaxLength(PHONE_MAX_LENGTH)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres | `src/modules/iam/presentation/dto/register-patient.dto.ts:365` |
| `additionalPhones` | `array<string>` | No | longitud máxima PHONE_MAX_LENGTH; máximo 4 elemento(s); patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(MAX_ADDITIONAL_PHONES)` `@IsString({ each: true })` `@MaxLength(PHONE_MAX_LENGTH, { each: true })` `@Matches(PHONE_PATTERN, { each: true, message: PHONE_PATTERN_MESSAGE })` | Otros teléfonos de la persona, además del principal; mismo formato que phone | `src/modules/iam/presentation/dto/register-patient.dto.ts:386` |
| `occupationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ocupación del catálogo (VS_BO_OCCUPATION) | `src/modules/iam/presentation/dto/register-patient.dto.ts:404` |
| `occupationFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(OCCUPATION_FREE_TEXT_MAX_LENGTH)` | Ocupación en texto libre, para cuando no está en el catálogo | `src/modules/iam/presentation/dto/register-patient.dto.ts:417` |
| `workEmployerConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/iam/presentation/dto/register-patient.dto.ts:435` |
| `workEmployerFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(EMPLOYER_FREE_TEXT_MAX_LENGTH)` | Empresa en texto libre, para cuando no está en el catálogo | `src/modules/iam/presentation/dto/register-patient.dto.ts:453` |
| `gender` | `string` | No | valores: MALE, FEMALE, OTHER, UNKNOWN | `@IsOptional()` `@IsIn(ADMIN_GENDER_CODES)` | Género administrativo (HL7 AdministrativeGender) | `src/modules/iam/presentation/dto/register-patient.dto.ts:464` |
| `sexAtBirth` | `string` | Sí | valores: MALE, FEMALE, INTERSEX, UNKNOWN | `@IsIn(BIRTH_SEX_CODES)` | Sexo asignado al nacer | `src/modules/iam/presentation/dto/register-patient.dto.ts:482` |
| `administrativeGenderConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:491` |
| `sexAtBirthConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:500` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:509` |
| `homeAddressLines` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Calle y número del domicilio | `src/modules/iam/presentation/dto/register-patient.dto.ts:525` |
| `homeDistrict` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Distrito o zona del domicilio | `src/modules/iam/presentation/dto/register-patient.dto.ts:538` |
| `homeLatitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: RegisterPatientDto) => dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:555` |
| `homeLongitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: RegisterPatientDto) => dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:566` |
| `workMunicipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Municipio del trabajo (catálogo VS_BO_MUNICIPALITY) | `src/modules/iam/presentation/dto/register-patient.dto.ts:580` |
| `workAddressLines` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Calle y número del lugar de trabajo | `src/modules/iam/presentation/dto/register-patient.dto.ts:591` |
| `workDistrict` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Distrito o zona del lugar de trabajo | `src/modules/iam/presentation/dto/register-patient.dto.ts:601` |
| `workLatitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: RegisterPatientDto) => dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:612` |
| `workLongitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: RegisterPatientDto) => dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:623` |
| `guardianName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre del tutor o persona autorizada | `src/modules/iam/presentation/dto/register-patient.dto.ts:639` |
| `guardianPhone` | `string` | No | longitud máxima 40; patrón runtime /^[+]?[0-9 ()-]{6,}$/ | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(/^[+]?[0-9 ()-]{6,}$/, { message: 'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion', })` | Teléfono del tutor, en formato E.164 o nacional | `src/modules/iam/presentation/dto/register-patient.dto.ts:657` |
| `guardianRelationshipConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Parentesco del contacto de emergencia (conjunto related-person-relationship) | `src/modules/iam/presentation/dto/register-patient.dto.ts:681` |
| `additionalEmergencyContacts` | `array<AdditionalEmergencyContactDto>` | No | máximo 4 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(MAX_ADDITIONAL_EMERGENCY_CONTACTS)` `@ValidateNested({ each: true })` `@Type(() => AdditionalEmergencyContactDto)` | Otros contactos de emergencia, además del primero | `src/modules/iam/presentation/dto/register-patient.dto.ts:699` |
| `additionalEmergencyContacts[].name` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre del contacto | `src/modules/iam/presentation/dto/register-patient.dto.ts:137` |
| `additionalEmergencyContacts[].phone` | `string` | No | longitud máxima 40; patrón runtime /^[+]?[0-9 ()-]{6,}$/ | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(/^[+]?[0-9 ()-]{6,}$/, { message: 'El teléfono sólo admite dígitos, espacios, paréntesis, + y guion', })` | Teléfono del contacto, en formato E.164 o nacional | `src/modules/iam/presentation/dto/register-patient.dto.ts:149` |
| `additionalEmergencyContacts[].relationshipConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Parentesco del contacto (conjunto related-person-relationship) | `src/modules/iam/presentation/dto/register-patient.dto.ts:158` |
| `privateInsurancePlanId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Plan de la aseguradora privada declarada | `src/modules/iam/presentation/dto/register-patient.dto.ts:714` |
| `publicInsurancePlanId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Plan del seguro público declarado | `src/modules/iam/presentation/dto/register-patient.dto.ts:725` |
| `billingTaxId` | `string` | No | longitud máxima 20; patrón runtime /^[0-9]{4,20}$/ | `@IsOptional()` `@IsString()` `@Matches(/^[0-9]{4,20}$/, { message: 'El NIT sólo admite dígitos', })` | NIT para facturación (sólo el número) | `src/modules/iam/presentation/dto/register-patient.dto.ts:742` |
| `billingLegalName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200, { message: 'La razón social no puede exceder 200 caracteres', })` | Nombre o Razón Social para facturación | `src/modules/iam/presentation/dto/register-patient.dto.ts:756` |

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
  "additionalPhones": [
    "+59170000000"
  ],
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
  "homeDistrict": "valor-ejemplo",
  "homeLatitude": 1,
  "homeLongitude": 1,
  "workMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "workAddressLines": "valor-ejemplo",
  "workDistrict": "valor-ejemplo",
  "workLatitude": 1,
  "workLongitude": 1,
  "guardianName": "Nombre de ejemplo",
  "guardianPhone": "+59170000000",
  "guardianRelationshipConceptId": "00000000-0000-4000-8000-000000000001",
  "additionalEmergencyContacts": [
    {
      "name": "Nombre de ejemplo",
      "phone": "+59170000000",
      "relationshipConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
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
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/iam/presentation/dto/register-patient.dto.ts:765` |
| `personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/iam/presentation/dto/register-patient.dto.ts:771` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/iam/presentation/dto/register-patient.dto.ts:777` |
| `patientCode` | `string` | Sí | — | — | Código de paciente generado para el perfil. | `src/modules/iam/presentation/dto/register-patient.dto.ts:783` |
| `emailVerificationSent` | `boolean` | Sí | — | — | Si se encoló el correo de verificación. La cuenta es usable igual. | `src/modules/iam/presentation/dto/register-patient.dto.ts:792` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 409 | `CONFLICT` | ConflictException: Ya existe una cuenta con ese documento de identidad |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El departamento no pertenece al catálogo de departamentos de Bolivia |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/accounting-practitioner-simple-http.int-spec.ts:156` |
| INTEGRACION | `test/integration/authz-clinical-scope.int-spec.ts:42` |
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
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:200` |
| INTEGRACION | `test/integration/p23-cambiar-horario-con-citas.int-spec.ts:176` |
| INTEGRACION | `test/integration/p36-horario-flexible.int-spec.ts:69` |
| INTEGRACION | `test/integration/p39-nota-medica-filas.int-spec.ts:109` |
| INTEGRACION | `test/integration/patient-access-revocation.int-spec.ts:40` |
| INTEGRACION | `test/integration/patient-diagnostic-orders.int-spec.ts:56` |
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:45` |
| INTEGRACION | `test/integration/patient-spending-http.int-spec.ts:66` |
| INTEGRACION | `test/integration/quitar-punto-del-mapa.int-spec.ts:78` |
| INTEGRACION | `test/integration/tj1-onboarding-medico.int-spec.ts:237` |
| INTEGRACION | `test/integration/tj2-reglas-cita.int-spec.ts:130` |
| INTEGRACION | `test/integration/virtual-encounter-auth.int-spec.ts:75` |
| INTEGRACION | `test/integration/waitlist-cupo-liberado.int-spec.ts:108` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:244` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /iam/auth/register-practitioner

- **Origen:** CONTRATO
- **Nombre:** Registrarse como profesional de salud con su matrícula
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.registerPractitioner` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:276`

### Qué es y para qué sirve (negocio)

Registrarse como profesional de salud con su matrícula. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/register-practitioner` la atiende `IamAuthController.registerPractitioner` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:276). Es una ruta pública: no exige token. Valida el cuerpo como `RegisterPractitionerDto` (75 campos, 5 obligatorios). Delega en `IamPractitionerSelfRegistrationService.registerPractitioner`. Crea filas en authz.user_role_assignments, common.addresses, common.contact_points, common.file_versions, common.files, common.identifiers, directory.tenant_memberships, iam.account_activations y 18 más. Actualiza common.files, messaging.queued_jobs. Lee authz.roles, authz.user_role_assignments, common.file_versions, common.files, iam.authentication_credentials, messaging.message_channels, messaging.message_queues, messaging.message_templates y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:276` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzBusinessRolesAdapter.ensureRoleByCode → AuthzEffectiveRolesService.ensureRoleByCode | `src/modules/authz/services/authz-effective-roles.service.ts:139` |
| `authz.user_role_assignments` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzBusinessRolesAdapter.ensureRoleByCode → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.create | `src/modules/authz/repositories/user-role-assignments.repository.ts:123` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzBusinessRolesAdapter.ensureRoleByCode → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.findActive | `src/modules/authz/repositories/user-role-assignments.repository.ts:73` |
| `common.addresses` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PracticeOwnSiteProvisioningAdapter.provision → OwnSiteProvisioningService.provision → AddressesRepository.create | `src/modules/common/repositories/addresses.repository.ts:154` |
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CommonRecordsAdapter.createContactPoint → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:198` |
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FilesService.createFile → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:142` |
| `common.file_versions` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CommonRegistrationFilesAdapter.claimAnonymousUpload → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FilesService.createFile → FilesRepository.create | `src/modules/common/repositories/files.repository.ts:52` |
| `common.files` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CommonRegistrationFilesAdapter.claimAnonymousUpload → AttachableFileService.claimAnonymousUpload | `src/modules/common/services/attachable-file.service.ts:270` |
| `common.files` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CommonRegistrationFilesAdapter.claimAnonymousUpload → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:182` |
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CommonRecordsAdapter.createIdentifier → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:174` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → DirectoryRegistrationAdapter.createTenantMembership → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:150` |
| `iam.account_activations` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AccountActivationsRepository.create | `src/modules/iam/infrastructure/repositories/account-activations.repository.ts:46` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CredentialsRepository.createPendingPassword | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:262` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:197` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → EmailVerificationsRepository.create | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:41` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → UserGlobalRolesRepository.create | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → UsersRepository.create | `src/modules/iam/infrastructure/repositories/users.repository.ts:49` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:77` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:101` |
| `messaging.queued_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.reuse → StorageLifecycleCoordinator.change | `src/common/storage/storage-lifecycle-coordinator.service.ts:651` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CommonRegistrationFilesAdapter.claimAnonymousUpload → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PracticeOwnSiteProvisioningAdapter.provision → OwnSiteProvisioningService.provision → PracticeSitesRepository.create | `src/modules/practice/repositories/practice-sites.repository.ts:111` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PracticeOwnSiteProvisioningAdapter.provision → OwnSiteProvisioningService.provision → OwnSiteProvisioningService.uniqueSiteCode → PracticeSitesRepository.findByPracticeAndCode | `src/modules/practice/repositories/practice-sites.repository.ts:85` |
| `practice.practices` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PracticeOwnSiteProvisioningAdapter.provision → OwnSiteProvisioningService.provision → PracticesRepository.create | `src/modules/practice/repositories/practices.repository.ts:150` |
| `practice.practices` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PracticeOwnSiteProvisioningAdapter.provision → OwnSiteProvisioningService.provision → PracticesRepository.findOwnOffice | `src/modules/practice/repositories/practices.repository.ts:135` |
| `practice.practitioner_role_assignments` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PracticeOwnSiteProvisioningAdapter.provision → OwnSiteProvisioningService.provision → PractitionerRoleAssignmentsRepository.create | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:311` |
| `profiles.health_practitioner_profiles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createPractitionerProfile → HealthPractitionerProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:161` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.findPractitionerByCode → HealthPractitionerProfilesRepository.findByCode | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:79` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createJurisdictionAuthorization → JurisdictionAuthorizationsRepository.create | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:114` |
| `profiles.person_account_links` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createAccountLink → PersonAccountLinksRepository.create | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:50` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createPersonProfile → PersonProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createPerson → PersonsRepository.create | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:119` |
| `profiles.practitioner_languages` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createPractitionerLanguage → PractitionerLanguagesRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-languages.repository.ts:62` |
| `profiles.practitioner_specialties` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createPractitionerSpecialty → PractitionerSpecialtiesRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:61` |
| `profiles.professional_credentials` | ESCRIBE | CREA | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createProfessionalCredential → ProfessionalCredentialsRepository.create | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:122` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | IamAuthController.registerPractitioner → IamPractitionerSelfRegistrationService.registerPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

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
| `licenseFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | fileId del PDF de la matrícula subido por POST /iam/auth/upload-registration-document | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:269` |
| `sedesLicenseFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | fileId del PDF del registro del SEDES subido por POST /iam/auth/upload-registration-document | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:284` |
| `sedesLicenseIssueDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | Fecha de inscripción en el SEDES (ISO) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:298` |
| `collegeLicenseNumber` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Número de registro en el colegio profesional | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:320` |
| `collegeName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Colegio profesional que emitió el registro | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:331` |
| `collegeLicenseIssueDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | Fecha de inscripción en el colegio profesional (ISO) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:340` |
| `collegeLicenseFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | fileId del PDF del registro del colegio subido por POST /iam/auth/upload-registration-document | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:353` |
| `professionalTitle` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:362` |
| `specialtyConceptIds` | `array<string>` | No | formato uuid; máximo 4 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(4)` `@IsUUID(undefined, { each: true })` | Especialidades declaradas (una principal y hasta tres adicionales). | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:388` |
| `nationalId` | `string` | Sí | longitud máxima 40; patrón runtime /^[A-Za-z0-9.-]+$/ | `@IsString()` `@MaxLength(40)` `@Matches(/^[A-Za-z0-9.-]+$/, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Documento de identidad obligatorio; se guarda como identificador oficial | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:401` |
| `issuerAdministrativeAreaConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:423` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:444` |
| `homeAddressLines` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Calle y número del domicilio particular | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:461` |
| `homeDistrict` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Distrito o zona del domicilio particular | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:474` |
| `homeLatitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:493` |
| `homeLongitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:504` |
| `workAddressLines` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Calle y número de la dirección laboral | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:515` |
| `workLatitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:526` |
| `workLongitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:537` |
| `phone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Forma anterior de declarar el teléfono del trabajo. Preferí workLandline o workMobilePhone. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:559` |
| `mobilePhone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Celular personal en formato E.164 o nacional | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:572` |
| `workMobilePhone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Celular de trabajo en formato E.164 o nacional | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:585` |
| `workLandline` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Teléfono fijo del lugar de trabajo | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:598` |
| `birthDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:606` |
| `gender` | `string` | No | valores: MALE, FEMALE, OTHER, UNKNOWN | `@IsOptional()` `@IsIn(ADMIN_GENDER_CODES)` | Género administrativo (HL7 AdministrativeGender) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:617` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | `@IsOptional()` `@IsIn(BIRTH_SEX_CODES)` | Sexo asignado al nacer | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:628` |
| `practitionerCategoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:637` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:645` |
| `credentialTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:653` |
| `languageConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:661` |
| `acceptsNewPatients` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:670` |
| `occupationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ocupación del catálogo (VS_BO_OCCUPATION) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:681` |
| `occupationFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(OCCUPATION_FREE_TEXT_MAX_LENGTH)` | Ocupación en texto libre, para cuando no está en el catálogo | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:694` |
| `workEmployerConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:705` |
| `workEmployerFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(EMPLOYER_FREE_TEXT_MAX_LENGTH)` | Empresa en texto libre, para cuando no está en el catálogo | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:719` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:728` |
| `profilePhotoBase64` | `string` | No | longitud máxima 2800000 | `@IsOptional()` `@IsString()` `@MaxLength(2_800_000)` | Foto de perfil en formato Base64 (Data URI o base64 plano) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:740` |
| `signatureFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:746` |
| `sealFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:752` |
| `ownSite` | `CreateOwnSiteDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => CreateOwnSiteDto)` | Consultorio propio a dar de alta en la misma transacción (ALV-005/006 · P20). Mismo contrato que POST /practitioners/me/sites | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:775` |
| `ownSite.name` | `string` | No | longitud máxima 200 | — | Nombre del consultorio | sin fuente |
| `ownSite.timeZone` | `string` | No | — | — | — | sin fuente |
| `ownSite.address` | `OwnSiteAddressDto` | No | — | — | — | sin fuente |
| `ownSite.address.lines` | `array<string>` | No | longitud máxima 500 | `@IsArray()` `@IsString({ each: true })` `@MaxLength(500, { each: true })` | Líneas de la dirección; puede ir vacía si la sede se ubica sólo por municipio o coordenadas | `src/common/dto/create-own-site.dto.ts:44` |
| `ownSite.address.city` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/common/dto/create-own-site.dto.ts:51` |
| `ownSite.address.municipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/create-own-site.dto.ts:57` |
| `ownSite.address.district` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/common/dto/create-own-site.dto.ts:67` |
| `ownSite.address.administrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/create-own-site.dto.ts:73` |
| `ownSite.address.latitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/common/dto/create-own-site.dto.ts:94` |
| `ownSite.address.longitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/common/dto/create-own-site.dto.ts:105` |
| `ownSite.contactPhone` | `string` | No | longitud máxima 40 | — | — | sin fuente |
| `ownSite.logoFileId` | `string` | No | formato uuid | — | — | sin fuente |
| `credentials` | `array<RegisterPractitionerCredentialDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => RegisterPractitionerCredentialDto)` | Títulos académicos declarados en el alta; cada uno crea una fila de professional_credentials. No se combina con credentialNumber. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:802` |
| `credentials[].credentialTypeConceptId` | `string` | No | formato uuid | `@IsUUID()` | Concept id del tipo de credencial (título universitario, diplomado, maestría, doctorado o título de especialidad) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:827` |
| `credentials[].number` | `string` | No | longitud máxima 100; patrón runtime /\S/ | `@IsString()` `@Matches(/\S/, { message: 'number no puede estar vacío' })` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:842` |
| `credentials[].issuingInstitutionText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:854` |
| `credentials[].issuingCityText` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:865` |
| `credentials[].issuingCountryText` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:875` |
| `credentials[].professionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de VS_BO_PROFESSION (COB-2023) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:887` |
| `credentials[].titleText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:897` |
| `credentials[].fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | fileId del PDF subido por POST /iam/auth/upload-registration-document | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:911` |

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
  "licenseFileId": "00000000-0000-4000-8000-000000000001",
  "sedesLicenseFileId": "00000000-0000-4000-8000-000000000001",
  "sedesLicenseIssueDate": "2026-07-31",
  "collegeLicenseNumber": "CMB-12345",
  "collegeName": "Colegio Médico de Bolivia",
  "collegeLicenseIssueDate": "2026-07-31",
  "collegeLicenseFileId": "00000000-0000-4000-8000-000000000001",
  "professionalTitle": "valor-ejemplo",
  "specialtyConceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "homeAddressLines": "valor-ejemplo",
  "homeDistrict": "valor-ejemplo",
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
      "district": "valor-ejemplo",
      "administrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
      "latitude": 1,
      "longitude": 1
    },
    "contactPhone": "+591 72123456",
    "logoFileId": "00000000-0000-4000-8000-000000000001"
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
| `userId` | `string` | Sí | formato uuid | — | Cuenta creada, con la que ya puede iniciar sesión. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:920` |
| `personId` | `string` | Sí | formato uuid | — | Persona creada para el profesional. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:926` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | Perfil profesional (comparte id con la persona). | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:932` |
| `practitionerCode` | `string` | Sí | — | — | Código interno asignado al profesional. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:938` |
| `licenseId` | `string` | Sí | formato uuid | — | Licencia registrada, pendiente de verificación por la plataforma. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:944` |
| `credentialId` | `string` | No | formato uuid | — | Credencial profesional creada, pendiente de verificación. Se devuelve porque `POST /profiles/credentials/{credentialId}/verify` —el acto que habilita al profesional a ejercer— la exige por id, y no había ninguna otra forma de obtenerla: el alta no la devolvía y `profiles` no expone ningún listado de credenciales. La verificación quedaba fuera de alcance salvo consultando la base de datos a mano. Ausente cuando el alta no declara `credentialNumber`, que dejó de ser obligatorio: sin credencial no hay id que devolver. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:959` |
| `sedesLicenseId` | `string` | No | formato uuid | — | Autorización del SEDES creada, pendiente de verificación. El equivalente de para la habilitación departamental: se devuelve para poder verificarla por id sin consultar la base. Ausente cuando el alta no declara `sedesLicenseNumber`. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:969` |
| `collegeLicenseId` | `string` | No | formato uuid | — | Registro del colegio profesional creado, pendiente de verificación. Ausente cuando el alta no declara `collegeLicenseNumber`. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:976` |
| `verificationStatus` | `string` | Sí | — | — | Estado de verificación del perfil al terminar el alta. Siempre PENDING: registrarse no habilita a ejercer. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:983` |
| `emailVerificationSent` | `boolean` | Sí | — | — | Si se pudo encolar el correo de verificación. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:989` |
| `photoFileId` | `string` | No | formato uuid | — | Identificador del archivo de foto de perfil (FK → common.files), si se subió. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:995` |
| `profilePhotoStored` | `boolean` | No | — | — | Presente sólo si el alta trajo foto: `false` cuando el almacenamiento no pudo guardarla y la cuenta se creó igual, sin foto. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:1002` |
| `ownPracticeId` | `string` | No | formato uuid | — | Práctica personal creada o reutilizada para el consultorio propio. Ausente cuando el alta no declaró `ownSite`. Se devuelve por el mismo motivo que : poder referenciarla por id sin consultar la base. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:1012` |
| `ownSiteId` | `string` | No | formato uuid | — | Consultorio propio creado a partir de `ownSite`. Ausente cuando el alta no lo declaró. Es el mismo id que devuelve `POST /practitioners/me/sites` y que acepta `GET /practitioners/:id/sites`. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:1021` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 409 | `CONFLICT` | ConflictException: Ya existe una cuenta con ese correo; ConflictException: El practitioner_code ya está en uso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Declare los títulos en `credentials` o el número suelto en `credentialNumber`, no los dos; PreconditionFailedException: El archivo del registro del SEDES necesita su número de registro; PreconditionFailedException: La matrícula y el registro del SEDES no pueden compartir el mismo archivo; PreconditionFailedException: La fecha del registro del SEDES necesita su número de registro; PreconditionFailedException: Los datos del registro del colegio necesitan su número de registro; PreconditionFailedException: El registro del colegio no puede compartir el archivo de otra habilitación; PreconditionFailedException: La foto de perfil no es una imagen válida; PreconditionFailedException: El departamento emisor es obligatorio para el alta del profesional; PreconditionFailedException: {labels.subject} no corresponde a un archivo subido en este registro; PreconditionFailedException: La firma y el sello requieren una imagen privada de hasta 2 MB; PreconditionFailedException: Ese concepto no es un tipo de credencial profesional; PreconditionFailedException: El número del título no puede estar vacío; PreconditionFailedException: Esa profesión no está en la Clasificación de Ocupaciones de Bolivia; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: Alguno de los roles indicados no existe o no es asignable |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/accounting-practitioner-simple-http.int-spec.ts:62` |
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
| INTEGRACION | `test/integration/medical-centers.int-spec.ts:170` |
| INTEGRACION | `test/integration/p23-cambiar-horario-con-citas.int-spec.ts:143` |
| INTEGRACION | `test/integration/p36-horario-flexible.int-spec.ts:122` |
| INTEGRACION | `test/integration/p39-nota-medica-filas.int-spec.ts:57` |
| INTEGRACION | `test/integration/p40-orden-basada-en-notas.int-spec.ts:77` |
| INTEGRACION | `test/integration/practice-ownership.int-spec.ts:57` |
| INTEGRACION | `test/integration/practitioner-credential-registration-files.int-spec.ts:103` |
| INTEGRACION | `test/integration/practitioner-license-registration-files.int-spec.ts:40` |
| INTEGRACION | `test/integration/practitioner-own-credential.int-spec.ts:26` |
| INTEGRACION | `test/integration/practitioner-own-profile.int-spec.ts:52` |
| INTEGRACION | `test/integration/practitioner-profile-identity-fields.int-spec.ts:40` |
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
- **Implementación:** `IamAuthController.resendVerification` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:309`

### Qué es y para qué sirve (negocio)

Reenviar el enlace de verificación del correo. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/resend-verification` la atiende `IamAuthController.resendVerification` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:309). Es una ruta pública: no exige token. Valida el cuerpo como `ResendVerificationDto` (1 campo, 1 obligatorio). Delega en `IamEmailVerificationService.resend`. Crea filas en iam.email_verifications, messaging.notification_requests. Lee iam.authentication_credentials, iam.email_verifications, iam.users, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:309` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 5, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:309` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → CredentialsRepository.findActivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:67` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → EmailVerificationsRepository.create | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:41` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → EmailVerificationsRepository.findLatestByUser | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:85` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → IamEmailVerificationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → IamEmailVerificationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → IamEmailVerificationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → IamEmailVerificationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAuthController.resendVerification → IamEmailVerificationService.resend → IamEmailVerificationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |

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
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La notificación a una dirección externa también necesita el usuario destinatario / La notificación necesita el usuario destinatario; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
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
- **Implementación:** `IamAuthController.resetPassword` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:431`

### Qué es y para qué sirve (negocio)

Fijar una contraseña nueva con el token recibido por correo. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/reset-password` la atiende `IamAuthController.resetPassword` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:431). Es una ruta pública: no exige token. Valida el cuerpo como `ResetPasswordDto` (2 campos, 2 obligatorios). Delega en `IamPasswordResetService.resetPassword`. Crea filas en iam.security_events. Actualiza iam.authentication_credentials, iam.password_resets, iam.refresh_tokens, iam.sessions. Lee iam.authentication_credentials, iam.password_resets, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:431` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:431` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.resetPassword → IamPasswordResetService.resetPassword | `src/modules/iam/application/services/iam-password-reset.service.ts:242` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAuthController.resetPassword → IamPasswordResetService.resetPassword → CredentialsRepository.findActivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:67` |
| `iam.password_resets` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.resetPassword → IamPasswordResetService.resetPassword | `src/modules/iam/application/services/iam-password-reset.service.ts:222` |
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
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:300` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /iam/auth/sessions/purge

- **Origen:** CONTRATO
- **Nombre:** Expirar sesiones y tokens vencidos
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.purge` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:548`

### Qué es y para qué sirve (negocio)

Expirar sesiones y tokens vencidos. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/sessions/purge` la atiende `IamAuthController.purge` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:548). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamAuthService.purgeSessions`. Crea filas en iam.security_events. Actualiza iam.refresh_tokens, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:548` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:224` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /iam/auth/token/refresh

- **Origen:** CONTRATO
- **Nombre:** Rotar el refresh token
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.refresh` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:447`

### Qué es y para qué sirve (negocio)

Rotar el refresh token. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/token/refresh` la atiende `IamAuthController.refresh` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:447). Es una ruta pública: no exige token. Valida el cuerpo como `RefreshTokenDto` (1 campo, 0 obligatorios). Delega en `IamAuthService.refresh`. Crea filas en iam.refresh_tokens, iam.security_events. Actualiza iam.refresh_tokens, iam.sessions. Lee authz.roles, authz.user_role_assignments, delegated_access.organization_user_assignments, directory.tenant_memberships, directory.tenants, iam.mfa_factors, iam.refresh_tokens, iam.sessions y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:447` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 20, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:447` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadAuthority → IamAuthService.mergeRoleCodes → AuthzBusinessRolesAdapter.scopedAssignmentsForUser → AuthzEffectiveRolesService.scopedAssignmentsForUser | `src/modules/authz/services/authz-effective-roles.service.ts:96` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadAuthority → IamAuthService.mergeRoleCodes → AuthzBusinessRolesAdapter.scopedAssignmentsForUser → AuthzEffectiveRolesService.scopedAssignmentsForUser → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `delegated_access.organization_user_assignments` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadAuthority → DelegatedAccessSupportClaimsAdapter.listTenantIdsWithActiveEngagement | `src/modules/iam/infrastructure/adapters/delegated-access-support-claims.adapter.ts:30` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadAuthority → DelegatedAccessSupportClaimsAdapter.listTenantIdsWithActiveEngagement | `src/modules/iam/infrastructure/adapters/delegated-access-support-claims.adapter.ts:24` |
| `directory.tenants` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadTenantDisplay → DirectoryTenantClaimsAdapter.describeTenants | `src/modules/iam/infrastructure/adapters/directory-tenant-claims.adapter.ts:57` |
| `iam.mfa_factors` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → MfaFactorsRepository.findVerifiedByUser | `src/modules/iam/infrastructure/repositories/mfa-factors.repository.ts:54` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → RefreshTokensRepository.revokeBySessionId | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:83` |
| `iam.refresh_tokens` | ESCRIBE | CREA | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → RefreshTokensRepository.create | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:39` |
| `iam.refresh_tokens` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → RefreshTokensRepository.findByHashForUpdate | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:74` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → SessionsRepository.revokeById | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:82` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → SessionsRepository.findById | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:60` |
| `iam.user_global_roles` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadAuthority → UserGlobalRolesRepository.findActiveForUser | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:57` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |
| `practice.practice_settings` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadTenantDisplay → DirectoryTenantClaimsAdapter.describeTenants → DirectoryTenantClaimsAdapter.accountKinds | `src/modules/iam/infrastructure/adapters/directory-tenant-claims.adapter.ts:99` |
| `practice.practices` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadTenantDisplay → DirectoryTenantClaimsAdapter.describeTenants → DirectoryTenantClaimsAdapter.accountKinds | `src/modules/iam/infrastructure/adapters/directory-tenant-claims.adapter.ts:93` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadPractitionerProfileId → ProfilesAccountProfileIdsAdapter.findPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadPatientProfileId → ProfilesAccountProfileIdsAdapter.findPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | IamAuthController.refresh → IamAuthService.refresh → IamAuthService.loadPatientProfileId → ProfilesAccountProfileIdsAdapter.findPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

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
| `accessToken` | `string` | Sí | — | — | JWT de acceso | `src/modules/iam/presentation/dto/token-response.dto.ts:52` |
| `refreshToken` | `string` | Sí | — | — | Refresh token en crudo; solo se entrega una vez | `src/modules/iam/presentation/dto/token-response.dto.ts:60` |
| `expiresAt` | `string` | Sí | formato date-time | — | Expiración de la sesión | `src/modules/iam/presentation/dto/token-response.dto.ts:70` |
| `newDevice` | `NewDeviceNoticeDto` | No | — | — | Solo en el login, y solo si el dispositivo es nuevo y alguna política aplicable tiene `newDeviceAlert`. Es un aviso de presentación. | `src/modules/iam/presentation/dto/token-response.dto.ts:77` |
| `newDevice.deviceId` | `string` | No | formato uuid | — | Dispositivo, para confirmarlo con `POST /iam/me/devices/:id/confirm`. | `src/modules/iam/presentation/dto/token-response.dto.ts:7` |
| `newDevice.label` | `string` | No | — | — | Cómo se lo nombra a la persona: «Chrome en Windows». | `src/modules/iam/presentation/dto/token-response.dto.ts:11` |
| `newDevice.ip` | `string` | No | — | — | Origen del inicio de sesión, tal como lo vio el servidor. | `src/modules/iam/presentation/dto/token-response.dto.ts:15` |
| `newDevice.occurredAt` | `string` | No | formato date-time | — | Cuándo se abrió la sesión. | `src/modules/iam/presentation/dto/token-response.dto.ts:19` |
| `mfaEnrollmentRequired` | `boolean` | No | — | — | Solo en el login, y solo si una política exige el segundo paso y la cuenta no tiene un factor confirmado: la persona debe darlo de alta con `POST /iam/me/mfa/totp` y confirmarlo. | `src/modules/iam/presentation/dto/token-response.dto.ts:85` |
| `deniedTenants` | `array<DeniedTenantDto>` | No | — | — | Organizaciones a las que la persona pertenece pero en las que NO puede actuar ahora (franja horaria, red, segundo factor). No están en `tenants` del token: la política de una organización rige solo en ella y no le cierra la sesión en las demás. | `src/modules/iam/presentation/dto/token-response.dto.ts:94` |
| `deniedTenants[].tenantId` | `string` | No | formato uuid | — | Organización. | `src/modules/iam/presentation/dto/token-response.dto.ts:26` |
| `deniedTenants[].reason` | `string` | No | valores: OUTSIDE_ALLOWED_HOURS, OUTSIDE_ALLOWED_NETWORK, IDLE_TIMEOUT, MFA_REQUIRED, MFA_ENROLLMENT_REQUIRED | — | Por qué: `OUTSIDE_ALLOWED_HOURS`, `OUTSIDE_ALLOWED_NETWORK`, `IDLE_TIMEOUT`, `MFA_REQUIRED` (presentar el código al iniciar sesión) o `MFA_ENROLLMENT_REQUIRED` (dar de alta el segundo factor). Las peticiones con `X-Tenant-Id` de esa organización reciben 403 con el mismo motivo. | `src/modules/iam/presentation/dto/token-response.dto.ts:43` |
| `deviceCookie` | `string` | No | — | — | Solo en el login y solo si la cookie de dispositivo está encendida (`AUTH_DEVICE_COOKIE_ENABLED`): valor firmado que el controlador entrega como cookie HttpOnly y QUITA del cuerpo. El cliente no lo ve. | `src/modules/iam/presentation/dto/token-response.dto.ts:103` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT); UnauthorizedException: No se presentó un refresh token; UnauthorizedException: Sesión no activa; UnauthorizedException: Reuso de refresh token detectado; UnauthorizedException: Refresh token expirado; UnauthorizedException: {{ message: 'La política de sesión de la organización cerró…}; UnauthorizedException: Refresh token inválido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-005.int-spec.ts:57` |
| INTEGRACION | `test/integration/iam.int-spec.ts:97` |
| INTEGRACION | `test/integration/refresh-cookie.int-spec.ts:83` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:206` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /iam/auth/upload-registration-document

- **Origen:** CONTRATO
- **Nombre:** Pre-cargar un PDF para un registro de organización o profesional
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.uploadRegistrationDocument` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:241`

### Qué es y para qué sirve (negocio)

Pre-cargar un PDF para un registro de organización o profesional. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/upload-registration-document` la atiende `IamAuthController.uploadRegistrationDocument` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:241). Es una ruta pública: no exige token. Delega en `IamRegistrationDocumentUploadService.upload`. Crea filas en common.file_versions, common.files, messaging.queued_jobs. Actualiza messaging.queued_jobs. Lee messaging.message_queues, messaging.queued_jobs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:241` |
| CUERPO | multipart/form-data (obligatorio); el tamaño del archivo lo define la ruta, no el límite global | `contrato (requestBody)` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 30, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:241` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | IamAuthController.uploadRegistrationDocument → IamRegistrationDocumentUploadService.upload → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FilesService.createFile → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:142` |
| `common.files` | ESCRIBE | CREA | DIRECTA | IamAuthController.uploadRegistrationDocument → IamRegistrationDocumentUploadService.upload → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FilesService.createFile → FilesRepository.create | `src/modules/common/repositories/files.repository.ts:52` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | IamAuthController.uploadRegistrationDocument → IamRegistrationDocumentUploadService.upload → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:77` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | IamAuthController.uploadRegistrationDocument → IamRegistrationDocumentUploadService.upload → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:101` |
| `messaging.queued_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.uploadRegistrationDocument → IamRegistrationDocumentUploadService.upload → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.reuse → StorageLifecycleCoordinator.change | `src/common/storage/storage-lifecycle-coordinator.service.ts:651` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IamAuthController.uploadRegistrationDocument → IamRegistrationDocumentUploadService.upload → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findJobByDedupeKey | `src/modules/messaging/repositories/queues.repository.ts:132` |

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
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: WRITE_RESERVATION_REQUIRED |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/laboratory-registration.int-spec.ts:391` |
| INTEGRACION | `test/integration/organization-legal-documents.int-spec.ts:37` |
| INTEGRACION | `test/integration/organization-legal-representative.int-spec.ts:41` |
| INTEGRACION | `test/integration/organization-medical-types.int-spec.ts:48` |
| INTEGRACION | `test/integration/pharmacy-registration.int-spec.ts:54` |
| INTEGRACION | `test/integration/practitioner-credential-registration-files.int-spec.ts:25` |
| INTEGRACION | `test/integration/practitioner-license-registration-files.int-spec.ts:32` |
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:274` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /iam/auth/upload-registration-logo

- **Origen:** CONTRATO
- **Nombre:** Pre-cargar el logo del consultorio propio para el registro
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.uploadRegistrationLogo` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:194`

### Qué es y para qué sirve (negocio)

Pre-cargar el logo del consultorio propio para el registro. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/upload-registration-logo` la atiende `IamAuthController.uploadRegistrationLogo` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:194). Es una ruta pública: no exige token. Delega en `IamRegistrationDocumentUploadService.uploadOwnSiteLogo`. Crea filas en common.file_versions, common.files, messaging.queued_jobs. Actualiza messaging.queued_jobs. Lee messaging.message_queues, messaging.queued_jobs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:194` |
| CUERPO | multipart/form-data (obligatorio); el tamaño del archivo lo define la ruta, no el límite global | `contrato (requestBody)` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:194` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | IamAuthController.uploadRegistrationLogo → IamRegistrationDocumentUploadService.uploadOwnSiteLogo → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FilesService.createFile → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:142` |
| `common.files` | ESCRIBE | CREA | DIRECTA | IamAuthController.uploadRegistrationLogo → IamRegistrationDocumentUploadService.uploadOwnSiteLogo → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FilesService.createFile → FilesRepository.create | `src/modules/common/repositories/files.repository.ts:52` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | IamAuthController.uploadRegistrationLogo → IamRegistrationDocumentUploadService.uploadOwnSiteLogo → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:77` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | IamAuthController.uploadRegistrationLogo → IamRegistrationDocumentUploadService.uploadOwnSiteLogo → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:101` |
| `messaging.queued_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.uploadRegistrationLogo → IamRegistrationDocumentUploadService.uploadOwnSiteLogo → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.reuse → StorageLifecycleCoordinator.change | `src/common/storage/storage-lifecycle-coordinator.service.ts:651` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IamAuthController.uploadRegistrationLogo → IamRegistrationDocumentUploadService.uploadOwnSiteLogo → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findJobByDedupeKey | `src/modules/messaging/repositories/queues.repository.ts:132` |

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
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El logo supera los 2 MB; PreconditionFailedException: No se recibió contenido en el campo "file"; PreconditionFailedException: El archivo excede el tamaño máximo permitido; PreconditionFailedException: Solo se admiten documentos PDF |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: WRITE_RESERVATION_REQUIRED |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /iam/auth/upload-registration-signature-image

- **Origen:** CONTRATO
- **Nombre:** Pre-cargar una imagen de firma o sello para el registro
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.uploadRegistrationSignatureImage` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:164`

### Qué es y para qué sirve (negocio)

Pre-cargar una imagen de firma o sello para el registro. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/upload-registration-signature-image` la atiende `IamAuthController.uploadRegistrationSignatureImage` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:164). Es una ruta pública: no exige token. Delega en `IamRegistrationDocumentUploadService.uploadSignatureImage`. Crea filas en common.file_versions, common.files, messaging.queued_jobs. Actualiza messaging.queued_jobs. Lee messaging.message_queues, messaging.queued_jobs.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:164` |
| CUERPO | multipart/form-data (obligatorio); el tamaño del archivo lo define la ruta, no el límite global | `contrato (requestBody)` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:164` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | IamAuthController.uploadRegistrationSignatureImage → IamRegistrationDocumentUploadService.uploadSignatureImage → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FilesService.createFile → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:142` |
| `common.files` | ESCRIBE | CREA | DIRECTA | IamAuthController.uploadRegistrationSignatureImage → IamRegistrationDocumentUploadService.uploadSignatureImage → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FilesService.createFile → FilesRepository.create | `src/modules/common/repositories/files.repository.ts:52` |
| `messaging.message_queues` | LEE | LEE | DIRECTA | IamAuthController.uploadRegistrationSignatureImage → IamRegistrationDocumentUploadService.uploadSignatureImage → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findQueueByCode | `src/modules/messaging/repositories/queues.repository.ts:77` |
| `messaging.queued_jobs` | ESCRIBE | CREA | DIRECTA | IamAuthController.uploadRegistrationSignatureImage → IamRegistrationDocumentUploadService.uploadSignatureImage → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.createJob | `src/modules/messaging/repositories/queues.repository.ts:101` |
| `messaging.queued_jobs` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.uploadRegistrationSignatureImage → IamRegistrationDocumentUploadService.uploadSignatureImage → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.reuse → StorageLifecycleCoordinator.change | `src/common/storage/storage-lifecycle-coordinator.service.ts:651` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IamAuthController.uploadRegistrationSignatureImage → IamRegistrationDocumentUploadService.uploadSignatureImage → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FileUploadService.publishUpload → StoragePublicationService.publish → StorageLifecycleCoordinator.begin → QueuesRepository.findJobByDedupeKey | `src/modules/messaging/repositories/queues.repository.ts:132` |

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
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING; StorageLifecycleDenied: WRITE_RESERVATION_REQUIRED |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practitioner-signature-registration.int-spec.ts:44` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /iam/auth/verify-email

- **Origen:** CONTRATO
- **Nombre:** Verificar el correo con el token recibido
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Ruta pública que escribe en la base
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAuthController.verifyEmail` — `src/modules/iam/presentation/controllers/iam-auth.controller.ts:326`

### Qué es y para qué sirve (negocio)

Verificar el correo con el token recibido. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/auth/verify-email` la atiende `IamAuthController.verifyEmail` (src/modules/iam/presentation/controllers/iam-auth.controller.ts:326). Es una ruta pública: no exige token. Valida el cuerpo como `VerifyEmailDto` (1 campo, 1 obligatorio). Delega en `IamPatientSelfRegistrationService.verifyEmail`. Actualiza iam.email_verifications, iam.users. Lee iam.email_verifications, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:326` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-auth.controller.ts:326` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.email_verifications` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.verifyEmail → IamPatientSelfRegistrationService.verifyEmail | `src/modules/iam/application/services/iam-patient-self-registration.service.ts:556` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | IamAuthController.verifyEmail → IamPatientSelfRegistrationService.verifyEmail → EmailVerificationsRepository.findByTokenHash | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:60` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAuthController.verifyEmail → IamPatientSelfRegistrationService.verifyEmail | `src/modules/iam/application/services/iam-patient-self-registration.service.ts:570` |
| `iam.users` | LEE | LEE | DIRECTA | IamAuthController.verifyEmail → IamPatientSelfRegistrationService.verifyEmail → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Cuerpo — DTO `VerifyEmailDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `token` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-patient.dto.ts:803` |

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
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/iam/presentation/dto/register-patient.dto.ts:812` |
| `emailVerified` | `boolean` | Sí | — | — | Valor de email verified mantenido por la instancia. | `src/modules/iam/presentation/dto/register-patient.dto.ts:818` |

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
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-auth.controller.spec.ts:283` |

### Flujos

- IAM — etapa `ctrl:IamAuthController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /iam/me/devices/{id}/confirm

- **Origen:** CONTRATO
- **Nombre:** Reconocer un dispositivo propio («Fui yo»)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAccountSecurityController.confirmDevice` — `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:123`

### Qué es y para qué sirve (negocio)

Reconocer un dispositivo propio («Fui yo»). Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/me/devices/{id}/confirm` la atiende `IamAccountSecurityController.confirmDevice` (src/modules/iam/presentation/controllers/iam-account-security.controller.ts:123). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ConfirmDeviceDto` (1 campo, 0 obligatorios). Delega en `IamAccountSecurityService.confirmDevice`. Crea filas en iam.security_events. Actualiza iam.devices. Lee iam.devices, iam.security_events, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:123` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:123` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:123` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:123` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAccountSecurityController.confirmDevice → IamAccountSecurityService.confirmDevice | `src/modules/iam/application/services/iam-account-security.service.ts:289` |
| `iam.devices` | LEE | LEE | DIRECTA | IamAccountSecurityController.confirmDevice → IamAccountSecurityService.confirmDevice → DevicesRepository.findByIdAndUser | `src/modules/iam/infrastructure/repositories/devices.repository.ts:69` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAccountSecurityController.confirmDevice → IamAccountSecurityService.confirmDevice → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.security_events` | LEE | LEE | POR_SQL | IamAccountSecurityController.confirmDevice → IamAccountSecurityService.confirmDevice → SecurityEventsRepository.deviceCodeUsed | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:129` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAccountSecurityController.confirmDevice → IamAccountSecurityService.confirmDevice → IamAccountSecurityService.sessionIsOnOtherTrustedDevice → SessionsRepository.findActiveByTokenId | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:74` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ConfirmDeviceDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | No | longitud mínima 8; longitud máxima 8 | `@IsOptional()` `@IsString()` `@Length(8, 8)` | — | `src/modules/iam/presentation/dto/account-security.dto.ts:96` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "12345678"
}
```

</details>

### Respuesta — `Promise<ConfirmDeviceResultDto>` · DTO `ConfirmDeviceResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `confirmed` | `boolean` | Sí | — | — | Siempre `true`: el dispositivo quedó de confianza (idempotente). | `src/modules/iam/presentation/dto/account-security.dto.ts:116` |
| `deviceId` | `string` | Sí | formato uuid | — | Dispositivo confirmado. | `src/modules/iam/presentation/dto/account-security.dto.ts:122` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Para confirmar este dispositivo hace falta el código enviado a su correo; PreconditionFailedException: El código no es válido o ya se usó |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamAccountSecurityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /iam/me/devices/{id}/confirm-code

- **Origen:** CONTRATO
- **Nombre:** Enviar al correo verificado el código para reconocer un dispositivo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAccountSecurityController.requestDeviceCode` — `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:153`

### Qué es y para qué sirve (negocio)

Enviar al correo verificado el código para reconocer un dispositivo. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/me/devices/{id}/confirm-code` la atiende `IamAccountSecurityController.requestDeviceCode` (src/modules/iam/presentation/controllers/iam-account-security.controller.ts:153). Exige sesión; el controlador no declara roles. Delega en `IamAccountSecurityService.requestDeviceCode`. Crea filas en messaging.notification_requests. Lee iam.devices, iam.email_verifications, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:153` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:153` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:153` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 3, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:153` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.devices` | LEE | LEE | DIRECTA | IamAccountSecurityController.requestDeviceCode → IamAccountSecurityService.requestDeviceCode → DevicesRepository.findByIdAndUser | `src/modules/iam/infrastructure/repositories/devices.repository.ts:69` |
| `iam.email_verifications` | LEE | LEE | DIRECTA | IamAccountSecurityController.requestDeviceCode → IamAccountSecurityService.requestDeviceCode → EmailVerificationsRepository.findLatestVerifiedByUser | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:107` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamAccountSecurityController.requestDeviceCode → IamAccountSecurityService.requestDeviceCode → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamAccountSecurityController.requestDeviceCode → IamAccountSecurityService.requestDeviceCode → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamAccountSecurityController.requestDeviceCode → IamAccountSecurityService.requestDeviceCode → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamAccountSecurityController.requestDeviceCode → IamAccountSecurityService.requestDeviceCode → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamAccountSecurityController.requestDeviceCode → IamAccountSecurityService.requestDeviceCode → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RequestDeviceCodeResultDto>` · DTO `RequestDeviceCodeResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sent` | `boolean` | Sí | — | — | `true` si se mandó el correo; `false` si el dispositivo ya era de confianza. | `src/modules/iam/presentation/dto/account-security.dto.ts:103` |
| `sentTo` | `string` | No | — | — | Dirección a la que se mandó, enmascarada («a***@d***.com»). | `src/modules/iam/presentation/dto/account-security.dto.ts:107` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene un correo verificado al que enviar el código; PreconditionFailedException: La notificación a una dirección externa también necesita el usuario destinatario / La notificación necesita el usuario destinatario; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamAccountSecurityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /iam/me/devices/{id}/not-me

- **Origen:** CONTRATO
- **Nombre:** No reconocer un dispositivo («No fui yo») y cerrar las otras sesiones
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAccountSecurityController.reportDeviceNotMe` — `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:173`

### Qué es y para qué sirve (negocio)

No reconocer un dispositivo («No fui yo») y cerrar las otras sesiones. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/me/devices/{id}/not-me` la atiende `IamAccountSecurityController.reportDeviceNotMe` (src/modules/iam/presentation/controllers/iam-account-security.controller.ts:173). Exige sesión; el controlador no declara roles. Delega en `IamAccountSecurityService.reportDeviceNotMe`. Crea filas en iam.security_events. Actualiza iam.devices, iam.refresh_tokens, iam.sessions. Lee iam.devices, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:173` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:173` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:173` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 5, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:173` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAccountSecurityController.reportDeviceNotMe → IamAccountSecurityService.reportDeviceNotMe | `src/modules/iam/application/services/iam-account-security.service.ts:411` |
| `iam.devices` | LEE | LEE | DIRECTA | IamAccountSecurityController.reportDeviceNotMe → IamAccountSecurityService.reportDeviceNotMe → DevicesRepository.findByIdAndUser | `src/modules/iam/infrastructure/repositories/devices.repository.ts:69` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamAccountSecurityController.reportDeviceNotMe → IamAccountSecurityService.reportDeviceNotMe → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:96` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAccountSecurityController.reportDeviceNotMe → IamAccountSecurityService.reportDeviceNotMe → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamAccountSecurityController.reportDeviceNotMe → IamAccountSecurityService.reportDeviceNotMe → SessionsRepository.revokeByIds | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:131` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamAccountSecurityController.reportDeviceNotMe → IamAccountSecurityService.reportDeviceNotMe → SessionsRepository.findActiveByUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:117` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReportDeviceNotMeResultDto>` · DTO `ReportDeviceNotMeResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `revokedSessions` | `number` | Sí | — | — | Nº de las otras sesiones que se revocaron | `src/modules/iam/presentation/dto/account-security.dto.ts:131` |
| `deviceId` | `string` | Sí | formato uuid | — | Dispositivo reportado. | `src/modules/iam/presentation/dto/account-security.dto.ts:137` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamAccountSecurityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. GET /iam/me/mfa

- **Origen:** CONTRATO
- **Nombre:** Estado de mi verificación en dos pasos
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAccountSecurityController.mfaStatus` — `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:194`

### Qué es y para qué sirve (negocio)

Estado de mi verificación en dos pasos. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/me/mfa` la atiende `IamAccountSecurityController.mfaStatus` (src/modules/iam/presentation/controllers/iam-account-security.controller.ts:194). Exige sesión; el controlador no declara roles. Delega en `IamMyMfaService.status`. Lee iam.mfa_factors, iam.session_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:194` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:194` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.mfa_factors` | LEE | LEE | DIRECTA | IamAccountSecurityController.mfaStatus → IamMyMfaService.status → MfaFactorsRepository.findByUser | `src/modules/iam/infrastructure/repositories/mfa-factors.repository.ts:62` |
| `iam.session_policies` | LEE | LEE | DIRECTA | IamAccountSecurityController.mfaStatus → IamMyMfaService.status → SessionPoliciesService.rulesFor → SessionPoliciesRepository.findByTenants | `src/modules/iam/infrastructure/repositories/session-policies.repository.ts:61` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyMfaStatusDto>` · DTO `MyMfaStatusDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `required` | `boolean` | Sí | — | — | ¿Alguna política de sus organizaciones le exige el segundo paso? | `src/modules/iam/presentation/dto/my-mfa.dto.ts:99` |
| `enrolled` | `boolean` | Sí | — | — | ¿Tiene al menos un factor confirmado? | `src/modules/iam/presentation/dto/my-mfa.dto.ts:103` |
| `enrollmentRequired` | `boolean` | Sí | — | — | `required` sin `enrolled`: debe dar de alta un factor. | `src/modules/iam/presentation/dto/my-mfa.dto.ts:107` |
| `factors` | `array<MyMfaFactorDto>` | Sí | — | — | Sus factores, de más reciente a más antiguo. | `src/modules/iam/presentation/dto/my-mfa.dto.ts:111` |
| `factors[].id` | `string` | Sí | formato uuid | — | Identificador del factor. | `src/modules/iam/presentation/dto/my-mfa.dto.ts:72` |
| `factors[].type` | `string` | Sí | valores: TOTP, WEBAUTHN, UNKNOWN | — | `TOTP` o `WEBAUTHN`. | `src/modules/iam/presentation/dto/my-mfa.dto.ts:76` |
| `factors[].state` | `string` | Sí | valores: PENDING, VERIFIED, REVOKED, UNKNOWN | — | `PENDING` (sin confirmar), `VERIFIED` o `REVOKED`. | `src/modules/iam/presentation/dto/my-mfa.dto.ts:80` |
| `factors[].label` | `string` | No | — | — | Nombre del factor. | `src/modules/iam/presentation/dto/my-mfa.dto.ts:84` |
| `factors[].verifiedAt` | `string` | No | formato date-time | — | Cuándo se confirmó. | `src/modules/iam/presentation/dto/my-mfa.dto.ts:88` |
| `factors[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se dio de alta. | `src/modules/iam/presentation/dto/my-mfa.dto.ts:92` |

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

## 23. POST /iam/me/mfa/{factorId}/revoke

- **Origen:** CONTRATO
- **Nombre:** Quitar uno de mis factores de segundo paso
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAccountSecurityController.revokeFactor` — `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:223`

### Qué es y para qué sirve (negocio)

Quitar uno de mis factores de segundo paso. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/me/mfa/{factorId}/revoke` la atiende `IamAccountSecurityController.revokeFactor` (src/modules/iam/presentation/controllers/iam-account-security.controller.ts:223). Exige sesión; el controlador no declara roles. Valida el cuerpo como `RevokeMyMfaDto` (2 campos, 0 obligatorios). Delega en `IamMyMfaService.revokeFactor`. Crea filas en iam.security_events. Actualiza iam.mfa_factors, iam.users. Lee iam.authentication_credentials, iam.mfa_factors, iam.security_events, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:223` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:223` |
| PARAMETRO_RUTA | Deben ser UUID válidos: factorId | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:223` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 5, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:223` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAccountSecurityController.revokeFactor → IamMyMfaService.revokeFactor → IamMfaService.assertReauthenticated → IamMfaService.passwordMatches → CredentialsRepository.findActivePasswordByUser | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:132` |
| `iam.mfa_factors` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAccountSecurityController.revokeFactor → IamMyMfaService.revokeFactor | `src/modules/iam/application/services/iam-my-mfa.service.ts:182` |
| `iam.mfa_factors` | LEE | LEE | DIRECTA | IamAccountSecurityController.revokeFactor → IamMyMfaService.revokeFactor → MfaFactorsRepository.findByIdAndUser | `src/modules/iam/infrastructure/repositories/mfa-factors.repository.ts:50` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAccountSecurityController.revokeFactor → IamMyMfaService.revokeFactor → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.security_events` | LEE | LEE | POR_SQL | IamAccountSecurityController.revokeFactor → IamMyMfaService.revokeFactor → IamMfaService.assertReauthenticated → IamMfaService.codeMatches → IamTotpService.consume → SecurityEventsRepository.lastMfaTimeStep | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:107` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAccountSecurityController.revokeFactor → IamMyMfaService.revokeFactor | `src/modules/iam/application/services/iam-my-mfa.service.ts:190` |
| `iam.users` | LEE | LEE | DIRECTA | IamAccountSecurityController.revokeFactor → IamMyMfaService.revokeFactor → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `factorId` | path | Sí | `string` | — |

### Cuerpo — DTO `RevokeMyMfaDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `currentPassword` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/my-mfa.dto.ts:38` |
| `mfaCode` | `string` | No | longitud mínima 6; longitud máxima 8 | `@IsOptional()` `@IsString()` `@Length(6, 8)` | — | `src/modules/iam/presentation/dto/my-mfa.dto.ts:45` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "currentPassword": "ClaveSegura2026!",
  "mfaCode": "123456"
}
```

</details>

### Respuesta — `Promise<RevokeMyMfaResultDto>` · DTO `RevokeMyMfaResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `revoked` | `boolean` | Sí | — | — | Siempre `true`. | `src/modules/iam/presentation/dto/my-mfa.dto.ts:52` |
| `remainingVerified` | `number` | Sí | — | — | ¿Le quedan factores confirmados? Sin ninguno, el segundo paso queda apagado. | `src/modules/iam/presentation/dto/my-mfa.dto.ts:56` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Factor MFA no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Para añadir o quitar un factor confirme su contraseña actual o un código de su app autenticadora; PreconditionFailedException: La contraseña o el código no coinciden |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamAccountSecurityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /iam/me/mfa/totp

- **Origen:** CONTRATO
- **Nombre:** Dar de alta mi app autenticadora (devuelve el secreto una vez)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAccountSecurityController.startTotp` — `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:201`

### Qué es y para qué sirve (negocio)

Dar de alta mi app autenticadora (devuelve el secreto una vez). Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/me/mfa/totp` la atiende `IamAccountSecurityController.startTotp` (src/modules/iam/presentation/controllers/iam-account-security.controller.ts:201). Exige sesión; el controlador no declara roles. Valida el cuerpo como `StartMyTotpDto` (3 campos, 0 obligatorios). Delega en `IamMyMfaService.startTotp`. Crea filas en iam.mfa_factors, iam.security_events. Actualiza iam.mfa_factors, iam.users. Lee iam.authentication_credentials, iam.mfa_factors, iam.security_events, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:201` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:201` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 5, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:201` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAccountSecurityController.startTotp → IamMyMfaService.startTotp → IamMfaService.assertReauthenticated → IamMfaService.passwordMatches → CredentialsRepository.findActivePasswordByUser | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:132` |
| `iam.mfa_factors` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAccountSecurityController.startTotp → IamMyMfaService.startTotp → IamMfaService.enrollOrVerify | `src/modules/iam/application/services/iam-mfa.service.ts:258` |
| `iam.mfa_factors` | ESCRIBE | CREA | DIRECTA | IamAccountSecurityController.startTotp → IamMyMfaService.startTotp → IamMfaService.enrollOrVerify → MfaFactorsRepository.create | `src/modules/iam/infrastructure/repositories/mfa-factors.repository.ts:31` |
| `iam.mfa_factors` | LEE | LEE | DIRECTA | IamAccountSecurityController.startTotp → IamMyMfaService.startTotp → MfaFactorsRepository.findByUser | `src/modules/iam/infrastructure/repositories/mfa-factors.repository.ts:62` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAccountSecurityController.startTotp → IamMyMfaService.startTotp → IamMfaService.assertReauthenticated → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.security_events` | LEE | LEE | POR_SQL | IamAccountSecurityController.startTotp → IamMyMfaService.startTotp → IamMfaService.assertReauthenticated → IamMfaService.codeMatches → IamTotpService.consume → SecurityEventsRepository.lastMfaTimeStep | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:107` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAccountSecurityController.startTotp → IamMyMfaService.startTotp → IamMfaService.enrollOrVerify | `src/modules/iam/application/services/iam-mfa.service.ts:262` |
| `iam.users` | LEE | LEE | DIRECTA | IamAccountSecurityController.startTotp → IamMyMfaService.startTotp → IamMfaService.enrollOrVerify → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Cuerpo — DTO `StartMyTotpDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `label` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/my-mfa.dto.ts:11` |
| `currentPassword` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/my-mfa.dto.ts:21` |
| `mfaCode` | `string` | No | longitud mínima 6; longitud máxima 8 | `@IsOptional()` `@IsString()` `@Length(6, 8)` | — | `src/modules/iam/presentation/dto/my-mfa.dto.ts:28` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "label": "valor-ejemplo",
  "currentPassword": "ClaveSegura2026!",
  "mfaCode": "123456"
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
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No tiene acceso a los factores MFA de esta cuenta |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado; ResourceNotFoundException: Factor MFA no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Para añadir o quitar un factor confirme su contraseña actual o un código de su app autenticadora; PreconditionFailedException: La contraseña o el código no coinciden; PreconditionFailedException: factorId es obligatorio para verificar; PreconditionFailedException: code es obligatorio para verificar; PreconditionFailedException: El factor no tiene un secreto TOTP asociado; PreconditionFailedException: Código MFA inválido; PreconditionFailedException: factorType es obligatorio para enrolar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamAccountSecurityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. POST /iam/me/mfa/totp/{factorId}/confirm

- **Origen:** CONTRATO
- **Nombre:** Confirmar mi app autenticadora con un código
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAccountSecurityController.confirmTotp` — `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:244`

### Qué es y para qué sirve (negocio)

Confirmar mi app autenticadora con un código. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/me/mfa/totp/{factorId}/confirm` la atiende `IamAccountSecurityController.confirmTotp` (src/modules/iam/presentation/controllers/iam-account-security.controller.ts:244). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ConfirmMyTotpDto` (1 campo, 1 obligatorio). Delega en `IamMyMfaService.confirmTotp`. Crea filas en iam.mfa_factors, iam.security_events. Actualiza iam.mfa_factors, iam.users. Lee iam.authentication_credentials, iam.mfa_factors, iam.security_events, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:244` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:244` |
| PARAMETRO_RUTA | Deben ser UUID válidos: factorId | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:244` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:244` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamAccountSecurityController.confirmTotp → IamMyMfaService.confirmTotp → IamMfaService.enrollOrVerify → IamMfaService.assertReauthenticated → IamMfaService.passwordMatches → CredentialsRepository.findActivePasswordByUser | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:132` |
| `iam.mfa_factors` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAccountSecurityController.confirmTotp → IamMyMfaService.confirmTotp → IamMfaService.enrollOrVerify | `src/modules/iam/application/services/iam-mfa.service.ts:258` |
| `iam.mfa_factors` | ESCRIBE | CREA | DIRECTA | IamAccountSecurityController.confirmTotp → IamMyMfaService.confirmTotp → IamMfaService.enrollOrVerify → MfaFactorsRepository.create | `src/modules/iam/infrastructure/repositories/mfa-factors.repository.ts:31` |
| `iam.mfa_factors` | LEE | LEE | DIRECTA | IamAccountSecurityController.confirmTotp → IamMyMfaService.confirmTotp → MfaFactorsRepository.findByIdAndUser | `src/modules/iam/infrastructure/repositories/mfa-factors.repository.ts:50` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamAccountSecurityController.confirmTotp → IamMyMfaService.confirmTotp → IamMfaService.enrollOrVerify → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.security_events` | LEE | LEE | POR_SQL | IamAccountSecurityController.confirmTotp → IamMyMfaService.confirmTotp → IamMfaService.enrollOrVerify → IamMfaService.assertReauthenticated → IamMfaService.codeMatches → IamTotpService.consume → SecurityEventsRepository.lastMfaTimeStep | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:107` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAccountSecurityController.confirmTotp → IamMyMfaService.confirmTotp → IamMfaService.enrollOrVerify | `src/modules/iam/application/services/iam-mfa.service.ts:262` |
| `iam.users` | LEE | LEE | DIRECTA | IamAccountSecurityController.confirmTotp → IamMyMfaService.confirmTotp → IamMfaService.enrollOrVerify → UsersRepository.findById | `src/modules/iam/infrastructure/repositories/users.repository.ts:44` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `factorId` | path | Sí | `string` | — |

### Cuerpo — DTO `ConfirmMyTotpDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 6; longitud máxima 8 | `@IsString()` `@Length(6, 8)` | — | `src/modules/iam/presentation/dto/my-mfa.dto.ts:65` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "123456"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "123456"
}
```

</details>

### Respuesta — `Promise<ConfirmMyTotpResultDto>` · DTO `ConfirmMyTotpResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `verified` | `boolean` | Sí | — | — | Siempre `true`: con un código inválido la respuesta es 422. | `src/modules/iam/presentation/dto/my-mfa.dto.ts:118` |
| `factorId` | `string` | Sí | formato uuid | — | Factor confirmado. | `src/modules/iam/presentation/dto/my-mfa.dto.ts:122` |
| `verifiedAt` | `string` | Sí | formato date-time | — | Cuándo se confirmó. | `src/modules/iam/presentation/dto/my-mfa.dto.ts:126` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No tiene acceso a los factores MFA de esta cuenta |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado; ResourceNotFoundException: Factor MFA no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El factor fue reemplazado por uno más reciente; PreconditionFailedException: Para añadir o quitar un factor confirme su contraseña actual o un código de su app autenticadora; PreconditionFailedException: La contraseña o el código no coinciden; PreconditionFailedException: factorId es obligatorio para verificar; PreconditionFailedException: code es obligatorio para verificar; PreconditionFailedException: El factor no tiene un secreto TOTP asociado; PreconditionFailedException: Código MFA inválido; PreconditionFailedException: factorType es obligatorio para enrolar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IamAccountSecurityController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. GET /iam/me/network

- **Origen:** CONTRATO
- **Nombre:** La IP con la que me ve el servidor
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAccountSecurityController.myNetwork` — `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:71`

### Qué es y para qué sirve (negocio)

La IP con la que me ve el servidor. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/me/network` la atiende `IamAccountSecurityController.myNetwork` (src/modules/iam/presentation/controllers/iam-account-security.controller.ts:71). Exige sesión; el controlador no declara roles. Delega en `IpAccessRulesService.describeOrigin`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:71` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:71` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `MyNetworkDto` · DTO `MyNetworkDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ip` | `string` | Sí | admite null | — | IP contra la que se evalúan las reglas de red; `null` si el servidor no pudo leerla. | `src/modules/iam/presentation/dto/ip-access-rules.dto.ts:78` |
| `family` | `string` | Sí | valores: ipv4, ipv6; admite null | — | Familia de la dirección. | `src/modules/iam/presentation/dto/ip-access-rules.dto.ts:82` |
| `trustProxyHops` | `number` | Sí | — | — | Saltos de proxy de confianza con los que corre el servidor (`TRUST_PROXY_HOPS`). Con `0` detrás de un proxy, la IP es la del proxy. | `src/modules/iam/presentation/dto/ip-access-rules.dto.ts:89` |

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

## 27. GET /iam/me/sessions

- **Origen:** CONTRATO
- **Nombre:** Listar mis sesiones abiertas
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAccountSecurityController.listSessions` — `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:98`

### Qué es y para qué sirve (negocio)

Listar mis sesiones abiertas. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/me/sessions` la atiende `IamAccountSecurityController.listSessions` (src/modules/iam/presentation/controllers/iam-account-security.controller.ts:98). Exige sesión; el controlador no declara roles. Delega en `IamAccountSecurityService.listSessions`. Lee iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:98` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:98` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.sessions` | LEE | LEE | DIRECTA | IamAccountSecurityController.listSessions → IamAccountSecurityService.listSessions → SessionsRepository.findActiveByUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:117` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MySessionDto[]>` · DTO `MySessionDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la sesión (el que se pasa a `revoke`). | `src/modules/iam/presentation/dto/account-security.dto.ts:49` |
| `createdAt` | `string` | Sí | formato date-time | — | Alta de la sesión. | `src/modules/iam/presentation/dto/account-security.dto.ts:55` |
| `expiresAt` | `string` | Sí | formato date-time | — | Vencimiento de la sesión. | `src/modules/iam/presentation/dto/account-security.dto.ts:61` |
| `ip` | `string` | No | — | — | Dirección IP con la que se abrió. | `src/modules/iam/presentation/dto/account-security.dto.ts:67` |
| `current` | `boolean` | Sí | — | — | Si es la sesión desde la que se hace la consulta. | `src/modules/iam/presentation/dto/account-security.dto.ts:73` |

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

## 28. POST /iam/me/sessions/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Cerrar una de mis sesiones
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAccountSecurityController.revokeSession` — `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:107`

### Qué es y para qué sirve (negocio)

Cerrar una de mis sesiones. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/me/sessions/{id}/revoke` la atiende `IamAccountSecurityController.revokeSession` (src/modules/iam/presentation/controllers/iam-account-security.controller.ts:107). Exige sesión; el controlador no declara roles. Delega en `IamAccountSecurityService.revokeSession`. Crea filas en iam.security_events. Actualiza iam.refresh_tokens, iam.sessions. Lee iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:107` |
| TENANT | Ruta declarada agnóstica de tenant (@TenantAgnostic) | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:107` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-account-security.controller.ts:107` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `revoked` | `boolean` | Sí | — | — | `false` si la sesión ya no estaba activa (no es un error). | `src/modules/iam/presentation/dto/account-security.dto.ts:82` |

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

## 29. DELETE /iam/onboarding-drafts/{formType}/{draftId}

- **Origen:** CONTRATO
- **Nombre:** Elimina el borrador al completar el alta exitosamente o por descarte del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamOnboardingDraftsController.deleteDraft` — `src/modules/iam/presentation/controllers/iam-onboarding-drafts.controller.ts:103`

### Qué es y para qué sirve (negocio)

Elimina el borrador al completar el alta exitosamente o por descarte del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`DELETE /iam/onboarding-drafts/{formType}/{draftId}` la atiende `IamOnboardingDraftsController.deleteDraft` (src/modules/iam/presentation/controllers/iam-onboarding-drafts.controller.ts:103). Es una ruta pública: no exige token. Delega en `IamOnboardingDraftsService.deleteDraft`. No toca tablas relacionales: El borrador de alta vive sólo en la memoria del proceso (un `Map` con vigencia de 30 días); no hay fila en Postgres..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-onboarding-drafts.controller.ts:103` |
| CABECERA | x-onboarding-draft-secret (opcional) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 60, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-onboarding-drafts.controller.ts:103` |

### Tablas que afecta

No toca tablas relacionales: El borrador de alta vive sólo en la memoria del proceso (un `Map` con vigencia de 30 días); no hay fila en Postgres.. _(manual, 2026-10-25; fuente: `src/modules/iam/application/services/iam-onboarding-drafts.service.ts:19`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `formType` | path | Sí | `string` | — |
| `draftId` | path | Sí | `string` | — |
| `x-onboarding-draft-secret` | header | No | `string` | Secreto del borrador, devuelto una sola vez en `draftSecret` por el PUT que lo crea. Obligatorio en GET y DELETE, y en el PUT que actualiza; sin él, el PUT sólo crea. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `{ ok: boolean }` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-onboarding-drafts.controller.spec.ts:118` |

### Flujos

- IAM — etapa `ctrl:IamOnboardingDraftsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. GET /iam/onboarding-drafts/{formType}/{draftId}

- **Origen:** CONTRATO
- **Nombre:** Recupera un borrador de alta guardado por identificador y tipo de formulario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamOnboardingDraftsController.getDraft` — `src/modules/iam/presentation/controllers/iam-onboarding-drafts.controller.ts:47`

### Qué es y para qué sirve (negocio)

Recupera un borrador de alta guardado por identificador y tipo de formulario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/onboarding-drafts/{formType}/{draftId}` la atiende `IamOnboardingDraftsController.getDraft` (src/modules/iam/presentation/controllers/iam-onboarding-drafts.controller.ts:47). Es una ruta pública: no exige token. Delega en `IamOnboardingDraftsService.getDraft`. No toca tablas relacionales: El borrador de alta vive sólo en la memoria del proceso (un `Map` con vigencia de 30 días); no hay fila en Postgres..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-onboarding-drafts.controller.ts:47` |
| CABECERA | x-onboarding-draft-secret (opcional) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 120, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-onboarding-drafts.controller.ts:47` |

### Tablas que afecta

No toca tablas relacionales: El borrador de alta vive sólo en la memoria del proceso (un `Map` con vigencia de 30 días); no hay fila en Postgres.. _(manual, 2026-10-25; fuente: `src/modules/iam/application/services/iam-onboarding-drafts.service.ts:19`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `formType` | path | Sí | `string` | — |
| `draftId` | path | Sí | `string` | — |
| `x-onboarding-draft-secret` | header | No | `string` | Secreto del borrador, devuelto una sola vez en `draftSecret` por el PUT que lo crea. Obligatorio en GET y DELETE, y en el PUT que actualiza; sin él, el PUT sólo crea. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `OnboardingDraftPayload`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-onboarding-drafts.controller.spec.ts:78` |

### Flujos

- IAM — etapa `ctrl:IamOnboardingDraftsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. PUT /iam/onboarding-drafts/{formType}/{draftId}

- **Origen:** CONTRATO
- **Nombre:** Guarda o actualiza el avance del formulario de alta en borrador
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamOnboardingDraftsController.saveDraft` — `src/modules/iam/presentation/controllers/iam-onboarding-drafts.controller.ts:66`

### Qué es y para qué sirve (negocio)

Guarda o actualiza el avance del formulario de alta en borrador. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`PUT /iam/onboarding-drafts/{formType}/{draftId}` la atiende `IamOnboardingDraftsController.saveDraft` (src/modules/iam/presentation/controllers/iam-onboarding-drafts.controller.ts:66). Es una ruta pública: no exige token. Delega en `IamOnboardingDraftsService.saveDraft`. No toca tablas relacionales: El borrador de alta vive sólo en la memoria del proceso (un `Map` con vigencia de 30 días); no hay fila en Postgres..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/iam/presentation/controllers/iam-onboarding-drafts.controller.ts:66` |
| CABECERA | x-onboarding-draft-secret (opcional) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 60, ttl: 60_000 } }) | `src/modules/iam/presentation/controllers/iam-onboarding-drafts.controller.ts:66` |

### Tablas que afecta

No toca tablas relacionales: El borrador de alta vive sólo en la memoria del proceso (un `Map` con vigencia de 30 días); no hay fila en Postgres.. _(manual, 2026-10-25; fuente: `src/modules/iam/application/services/iam-onboarding-drafts.service.ts:19`)_

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `formType` | path | Sí | `string` | — |
| `draftId` | path | Sí | `string` | — |
| `x-onboarding-draft-secret` | header | No | `string` | Secreto del borrador, devuelto una sola vez en `draftSecret` por el PUT que lo crea. Obligatorio en GET y DELETE, y en el PUT que actualiza; sin él, el PUT sólo crea. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `SaveOnboardingDraftResult` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.BAD_REQUEST}; DomainException: {HttpStatus.PAYLOAD_TOO_LARGE}; DomainException: {HttpStatus.TOO_MANY_REQUESTS}; DraftStoreFullError: {retryAfterSeconds} |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-onboarding-drafts.controller.spec.ts:61` |

### Flujos

- IAM — etapa `ctrl:IamOnboardingDraftsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. DELETE /iam/rescue/tenants/{tenantId}/ip-access-rules

- **Origen:** CONTRATO
- **Nombre:** Rescate (SYSTEM): retirar las reglas de red de una organización
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAccessRescueController.clearIpAccessRules` — `src/modules/iam/presentation/controllers/iam-access-rescue.controller.ts:41`

### Qué es y para qué sirve (negocio)

Rescate (SYSTEM): retirar las reglas de red de una organización. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`DELETE /iam/rescue/tenants/{tenantId}/ip-access-rules` la atiende `IamAccessRescueController.clearIpAccessRules` (src/modules/iam/presentation/controllers/iam-access-rescue.controller.ts:41). Exige sesión con alguno de los roles SYSTEM. Delega en `IpAccessRulesService.clearForTenant`. Crea filas en authz.ip_access_rules. Actualiza authz.ip_access_rules. Lee authz.ip_access_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/iam/presentation/controllers/iam-access-rescue.controller.ts:41` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/iam/presentation/controllers/iam-access-rescue.controller.ts:41` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.ip_access_rules` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAccessRescueController.clearIpAccessRules → IpAccessRulesService.clearForTenant → AuthzIpAccessRulesAdapter.replace | `src/modules/iam/infrastructure/adapters/authz-ip-access-rules.adapter.ts:94` |
| `authz.ip_access_rules` | ESCRIBE | CREA | DIRECTA | IamAccessRescueController.clearIpAccessRules → IpAccessRulesService.clearForTenant → AuthzIpAccessRulesAdapter.replace | `src/modules/iam/infrastructure/adapters/authz-ip-access-rules.adapter.ts:98` |
| `authz.ip_access_rules` | LEE | LEE | DIRECTA | IamAccessRescueController.clearIpAccessRules → IpAccessRulesService.clearForTenant → AuthzIpAccessRulesAdapter.listActive | `src/modules/iam/infrastructure/adapters/authz-ip-access-rules.adapter.ts:54` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AccessRescueResultDto>` · DTO `AccessRescueResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `retired` | `number` | Sí | — | — | Cuántas filas activas se retiraron (quedan como histórico). | `src/modules/iam/presentation/dto/access-rescue.dto.ts:7` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-access-rescue.controller.spec.ts:40` |

### Flujos

- IAM — etapa `ctrl:IamAccessRescueController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. DELETE /iam/rescue/tenants/{tenantId}/session-policies

- **Origen:** CONTRATO
- **Nombre:** Rescate (SYSTEM): retirar las políticas de sesión de una organización
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamAccessRescueController.clearSessionPolicies` — `src/modules/iam/presentation/controllers/iam-access-rescue.controller.ts:59`

### Qué es y para qué sirve (negocio)

Rescate (SYSTEM): retirar las políticas de sesión de una organización. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`DELETE /iam/rescue/tenants/{tenantId}/session-policies` la atiende `IamAccessRescueController.clearSessionPolicies` (src/modules/iam/presentation/controllers/iam-access-rescue.controller.ts:59). Exige sesión con alguno de los roles SYSTEM. Delega en `SessionPoliciesService.clearForTenant`. Actualiza iam.session_policies. Lee iam.session_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM | `src/modules/iam/presentation/controllers/iam-access-rescue.controller.ts:59` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/iam/presentation/controllers/iam-access-rescue.controller.ts:59` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.session_policies` | ESCRIBE | ACTUALIZA | POR_TIPO | IamAccessRescueController.clearSessionPolicies → SessionPoliciesService.clearForTenant | `src/modules/iam/application/services/session-policies.service.ts:214` |
| `iam.session_policies` | LEE | LEE | DIRECTA | IamAccessRescueController.clearSessionPolicies → SessionPoliciesService.clearForTenant → SessionPoliciesRepository.findByTenant | `src/modules/iam/infrastructure/repositories/session-policies.repository.ts:40` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AccessRescueResultDto>` · DTO `AccessRescueResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `retired` | `number` | Sí | — | — | Cuántas filas activas se retiraron (quedan como histórico). | `src/modules/iam/presentation/dto/access-rescue.dto.ts:7` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-access-rescue.controller.spec.ts:51` |

### Flujos

- IAM — etapa `ctrl:IamAccessRescueController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. GET /iam/users

- **Origen:** CONTRATO
- **Nombre:** Listado paginado de usuarios (obsoleto)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.searchUsers` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:110`

### Qué es y para qué sirve (negocio)

Listado paginado de usuarios (obsoleto). Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users` la atiende `IamUsersController.searchUsers` (src/modules/iam/presentation/controllers/iam-users.controller.ts:110). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.searchUsers`. Lee iam.authentication_credentials, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:110` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `items` | `array<UserListItemDto>` | Sí | — | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:135` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:20` |
| `items[].displayName` | `string` | Sí | — | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:26` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:32` |
| `items[].mfaStatusConceptId` | `string` | No | formato uuid | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:38` |
| `items[].emailVerified` | `boolean` | Sí | — | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:44` |
| `items[].phoneVerified` | `boolean` | Sí | — | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:50` |
| `items[].lastLoginAt` | `object` | No | admite null | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:56` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:62` |
| `count` | `number` | Sí | — | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:141` |
| `limit` | `number` | Sí | — | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:147` |
| `nextCursor` | `object` | No | admite null | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:153` |

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

## 35. POST /iam/users

- **Origen:** CONTRATO
- **Nombre:** Crear un usuario con credencial de contraseña y rol inicial
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.createUser` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:330`

### Qué es y para qué sirve (negocio)

Crear un usuario con credencial de contraseña y rol inicial. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users` la atiende `IamUsersController.createUser` (src/modules/iam/presentation/controllers/iam-users.controller.ts:330). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateUserDto` (6 campos, 3 obligatorios). Delega en `IamUsersService.createUser`. Crea filas en common.contact_points, iam.authentication_credentials, iam.security_events, iam.user_global_roles, iam.users. Lee iam.authentication_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:330` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | IamUsersController.createUser → IamUsersService.createUser → CommonRecordsAdapter.createContactPoint → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:198` |
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

## 36. GET /iam/users/{id}

- **Origen:** CONTRATO
- **Nombre:** Ficha de un usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.getUser` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:200`

### Qué es y para qué sirve (negocio)

Ficha de un usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}` la atiende `IamUsersController.getUser` (src/modules/iam/presentation/controllers/iam-users.controller.ts:200). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.getUserById`. Lee iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:200` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:200` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `timeZone` | `string` | No | — | — | Zona horaria declarada. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:162` |
| `preferredLanguageConceptId` | `string` | No | formato uuid | — | Idioma preferido. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:168` |
| `residenceCountryConceptId` | `string` | No | formato uuid | — | País de residencia declarado. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:174` |
| `dataResidencyRegionConceptId` | `string` | No | formato uuid | — | Región de residencia del dato. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:180` |
| `legalBasisConceptId` | `string` | No | formato uuid | — | Base legal del tratamiento. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:186` |
| `privacyAcceptedAt` | `string` | No | formato date-time; admite null | — | Cuándo se aceptó la política de privacidad. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:192` |
| `privacyPolicyVersion` | `string` | No | — | — | Versión de la política aceptada. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:198` |
| `mustChangePassword` | `boolean` | Sí | — | — | Si la cuenta exige cambiar la credencial en el próximo ingreso. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:204` |
| `anonymizedAt` | `string` | No | formato date-time; admite null | — | Cuándo se anonimizó la cuenta, si se anonimizó. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:210` |
| `updatedAt` | `string` | Sí | formato date-time | — | Última modificación del registro. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:216` |

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

## 37. POST /iam/users/{id}/anonymize

- **Origen:** CONTRATO
- **Nombre:** Anonimizar (DSAR) la cuenta
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.anonymize` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:455`

### Qué es y para qué sirve (negocio)

Anonimizar (DSAR) la cuenta. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/anonymize` la atiende `IamUsersController.anonymize` (src/modules/iam/presentation/controllers/iam-users.controller.ts:455). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersService.anonymize`. Crea filas en iam.security_events. Actualiza iam.authentication_credentials, iam.refresh_tokens, iam.sessions, iam.user_global_roles, iam.users. Lee iam.sessions, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:455` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:455` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → CredentialsRepository.revokeAllForUser | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:316` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:96` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → SessionsRepository.revokeAllActiveForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:104` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → SessionsRepository.activeSessionIdsForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:94` |
| `iam.user_global_roles` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.anonymize → IamUsersService.anonymize → UserGlobalRolesRepository.revokeAllForUser | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:65` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.anonymize → IamUsersService.anonymize | `src/modules/iam/application/services/iam-users.service.ts:310` |
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

## 38. GET /iam/users/{id}/credentials

- **Origen:** CONTRATO
- **Nombre:** Credenciales del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.listCredentials` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:210`

### Qué es y para qué sirve (negocio)

Credenciales del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}/credentials` la atiende `IamUsersController.listCredentials` (src/modules/iam/presentation/controllers/iam-users.controller.ts:210). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.listCredentials`. Lee iam.authentication_credentials, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:210` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:210` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `items` | `array<CredentialListItemDto>` | Sí | — | — | Credenciales, de la más reciente a la más antigua. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:417` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la credencial. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:228` |
| `items[].methodConceptId` | `string` | Sí | formato uuid | — | Método de autenticación. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:234` |
| `items[].externalSubject` | `string` | No | — | — | Sujeto con el que se autentica (correo o documento). | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:240` |
| `items[].identityProvider` | `string` | No | — | — | Proveedor de identidad, en las credenciales federadas. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:246` |
| `items[].stateConceptId` | `string` | Sí | formato uuid | — | Estado de la credencial. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:252` |
| `items[].lastUsedAt` | `string` | No | formato date-time; admite null | — | Último uso registrado. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:258` |
| `items[].expiresAt` | `string` | No | formato date-time; admite null | — | Caducidad, si la tiene. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:264` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta de la credencial. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:270` |
| `count` | `number` | Sí | — | — | Cuántas credenciales trae la respuesta. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:423` |

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

## 39. POST /iam/users/{id}/credentials/{cid}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar una credencial del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.revokeCredential` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:367`

### Qué es y para qué sirve (negocio)

Revocar una credencial del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/credentials/{cid}/revoke` la atiende `IamUsersController.revokeCredential` (src/modules/iam/presentation/controllers/iam-users.controller.ts:367). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamCredentialsService.revokeCredential`. Crea filas en iam.security_events. Actualiza iam.authentication_credentials. Lee iam.authentication_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:367` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, cid | `src/modules/iam/presentation/controllers/iam-users.controller.ts:367` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.revokeCredential → IamCredentialsService.revokeCredential | `src/modules/iam/application/services/iam-credentials.service.ts:135` |
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

## 40. POST /iam/users/{id}/credentials/federated

- **Origen:** CONTRATO
- **Nombre:** Enlazar una credencial de identidad federada
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.linkFederated` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:349`

### Qué es y para qué sirve (negocio)

Enlazar una credencial de identidad federada. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/credentials/federated` la atiende `IamUsersController.linkFederated` (src/modules/iam/presentation/controllers/iam-users.controller.ts:349). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `LinkFederatedCredentialDto` (2 campos, 2 obligatorios). Delega en `IamCredentialsService.linkFederated`. Crea filas en iam.authentication_credentials, iam.security_events. Lee iam.authentication_credentials, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:349` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:349` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

## 41. GET /iam/users/{id}/devices

- **Origen:** CONTRATO
- **Nombre:** Dispositivos del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.listDevices` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:223`

### Qué es y para qué sirve (negocio)

Dispositivos del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}/devices` la atiende `IamUsersController.listDevices` (src/modules/iam/presentation/controllers/iam-users.controller.ts:223). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.listDevices`. Lee iam.devices, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:223` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:223` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.devices` | LEE | LEE | DIRECTA | IamUsersController.listDevices → IamUsersReadService.listDevices → DevicesRepository.findByUser | `src/modules/iam/infrastructure/repositories/devices.repository.ts:79` |
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
| `items` | `array<DeviceListItemDto>` | Sí | — | — | Dispositivos, del más reciente al más antiguo. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:432` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del dispositivo. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:279` |
| `items[].deviceFingerprint` | `string` | No | — | — | Huella con la que el dispositivo se identifica. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:285` |
| `items[].platformConceptId` | `string` | No | formato uuid | — | Plataforma del dispositivo. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:291` |
| `items[].hasPushToken` | `boolean` | Sí | — | — | Si tiene token de notificaciones registrado. Se publica la existencia, no el token. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:297` |
| `items[].lastSeenAt` | `string` | No | formato date-time; admite null | — | Última vez que se vio el dispositivo. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:303` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta del dispositivo. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:309` |
| `count` | `number` | Sí | — | — | Cuántos dispositivos trae la respuesta. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:438` |

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

## 42. POST /iam/users/{id}/devices

- **Origen:** CONTRATO
- **Nombre:** Registrar un dispositivo del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.registerDevice` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:402`

### Qué es y para qué sirve (negocio)

Registrar un dispositivo del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/devices` la atiende `IamUsersController.registerDevice` (src/modules/iam/presentation/controllers/iam-users.controller.ts:402). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateDeviceDto` (4 campos, 1 obligatorio). Delega en `IamDevicesService.register`. Crea filas en iam.devices, iam.security_events. Lee iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-users.controller.ts:402` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:402` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.devices` | ESCRIBE | CREA | DIRECTA | IamUsersController.registerDevice → IamDevicesService.register → DevicesRepository.create | `src/modules/iam/infrastructure/repositories/devices.repository.ts:41` |
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
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No tiene acceso a los dispositivos de esta cuenta |
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

## 43. GET /iam/users/{id}/global-roles

- **Origen:** CONTRATO
- **Nombre:** Roles globales del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.listGlobalRoles` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:262`

### Qué es y para qué sirve (negocio)

Roles globales del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}/global-roles` la atiende `IamUsersController.listGlobalRoles` (src/modules/iam/presentation/controllers/iam-users.controller.ts:262). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.listGlobalRoles`. Lee iam.user_global_roles, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:262` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:262` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `items` | `array<GlobalRoleListItemDto>` | Sí | — | — | Asignaciones, de la más reciente a la más antigua. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:477` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la asignación. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:390` |
| `items[].roleConceptId` | `string` | Sí | formato uuid | — | Rol global asignado. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:396` |
| `items[].stateConceptId` | `string` | Sí | formato uuid | — | Estado de la asignación. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:402` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se asignó. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:408` |
| `count` | `number` | Sí | — | — | Cuántas asignaciones trae la respuesta. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:483` |

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

## 44. POST /iam/users/{id}/global-roles

- **Origen:** CONTRATO
- **Nombre:** Conceder o revocar un rol global
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.changeGlobalRole` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:437`

### Qué es y para qué sirve (negocio)

Conceder o revocar un rol global. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/global-roles` la atiende `IamUsersController.changeGlobalRole` (src/modules/iam/presentation/controllers/iam-users.controller.ts:437). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `GlobalRoleDto` (2 campos, 2 obligatorios). Delega en `IamUsersService.changeGlobalRole`. Crea filas en iam.security_events, iam.user_global_roles. Actualiza iam.refresh_tokens, iam.sessions, iam.user_global_roles. Lee iam.sessions, iam.user_global_roles, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:437` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:437` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:96` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole → SessionsRepository.revokeAllActiveForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:104` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole → SessionsRepository.activeSessionIdsForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:94` |
| `iam.user_global_roles` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.changeGlobalRole → IamUsersService.changeGlobalRole | `src/modules/iam/application/services/iam-users.service.ts:267` |
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

## 45. POST /iam/users/{id}/lock

- **Origen:** CONTRATO
- **Nombre:** Bloquear la cuenta y revocar sus sesiones
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.lock` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:419`

### Qué es y para qué sirve (negocio)

Bloquear la cuenta y revocar sus sesiones. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/lock` la atiende `IamUsersController.lock` (src/modules/iam/presentation/controllers/iam-users.controller.ts:419). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `LockUserDto` (1 campo, 0 obligatorios). Delega en `IamUsersService.lock`. Crea filas en iam.account_lockouts, iam.security_events. Actualiza iam.refresh_tokens, iam.sessions, iam.users. Lee iam.sessions, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:419` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:419` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.account_lockouts` | ESCRIBE | CREA | DIRECTA | IamUsersController.lock → IamUsersService.lock → AccountLockoutsRepository.lockManually → AccountLockoutsRepository.create | `src/modules/iam/infrastructure/repositories/account-lockouts.repository.ts:40` |
| `iam.refresh_tokens` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.lock → IamUsersService.lock → RefreshTokensRepository.revokeActiveBySessionIds | `src/modules/iam/infrastructure/repositories/refresh-tokens.repository.ts:96` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.lock → IamUsersService.lock → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.sessions` | ESCRIBE | ACTUALIZA | DIRECTA | IamUsersController.lock → IamUsersService.lock → SessionsRepository.revokeAllActiveForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:104` |
| `iam.sessions` | LEE | LEE | DIRECTA | IamUsersController.lock → IamUsersService.lock → SessionsRepository.activeSessionIdsForUser | `src/modules/iam/infrastructure/repositories/sessions.repository.ts:94` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.lock → IamUsersService.lock | `src/modules/iam/application/services/iam-users.service.ts:182` |
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

## 46. GET /iam/users/{id}/mfa-factors

- **Origen:** CONTRATO
- **Nombre:** Factores de MFA del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.listMfaFactors` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:236`

### Qué es y para qué sirve (negocio)

Factores de MFA del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}/mfa-factors` la atiende `IamUsersController.listMfaFactors` (src/modules/iam/presentation/controllers/iam-users.controller.ts:236). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.listMfaFactors`. Lee iam.mfa_factors, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:236` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:236` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `items` | `array<MfaFactorListItemDto>` | Sí | — | — | Factores, del más reciente al más antiguo. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:447` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del factor. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:318` |
| `items[].factorTypeConceptId` | `string` | Sí | formato uuid | — | Mecanismo del segundo factor. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:324` |
| `items[].stateConceptId` | `string` | Sí | formato uuid | — | Estado del factor. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:330` |
| `items[].verifiedAt` | `string` | No | formato date-time; admite null | — | Cuándo se verificó, si se verificó. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:336` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Alta del factor. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:342` |
| `count` | `number` | Sí | — | — | Cuántos factores trae la respuesta. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:453` |

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

## 47. POST /iam/users/{id}/mfa-factors

- **Origen:** CONTRATO
- **Nombre:** Enrolar o verificar un factor MFA
- **Bloque:** Identidad y Seguridad
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.mfaFactor` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:385`

### Qué es y para qué sirve (negocio)

Enrolar o verificar un factor MFA. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/{id}/mfa-factors` la atiende `IamUsersController.mfaFactor` (src/modules/iam/presentation/controllers/iam-users.controller.ts:385). Exige sesión; el controlador no declara roles. Valida el cuerpo como `MfaFactorDto` (7 campos, 0 obligatorios). Delega en `IamMfaService.enrollOrVerify`. Crea filas en iam.mfa_factors, iam.security_events. Actualiza iam.mfa_factors, iam.users. Lee iam.authentication_credentials, iam.mfa_factors, iam.security_events, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/iam/presentation/controllers/iam-users.controller.ts:385` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:385` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify → IamMfaService.assertReauthenticated → IamMfaService.passwordMatches → CredentialsRepository.findActivePasswordByUser | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:132` |
| `iam.mfa_factors` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify | `src/modules/iam/application/services/iam-mfa.service.ts:258` |
| `iam.mfa_factors` | ESCRIBE | CREA | DIRECTA | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify → MfaFactorsRepository.create | `src/modules/iam/infrastructure/repositories/mfa-factors.repository.ts:31` |
| `iam.mfa_factors` | LEE | LEE | DIRECTA | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify → MfaFactorsRepository.findByIdAndUser | `src/modules/iam/infrastructure/repositories/mfa-factors.repository.ts:50` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.security_events` | LEE | LEE | POR_SQL | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify → IamMfaService.assertReauthenticated → IamMfaService.codeMatches → IamTotpService.consume → SecurityEventsRepository.lastMfaTimeStep | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:107` |
| `iam.users` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.mfaFactor → IamMfaService.enrollOrVerify | `src/modules/iam/application/services/iam-mfa.service.ts:262` |
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
| `currentPassword` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Contraseña actual (o `mfaCode`): obligatoria para dar de alta un factor propio | `src/modules/iam/presentation/dto/mfa-factor.dto.ts:86` |
| `mfaCode` | `string` | No | longitud mínima 6; longitud máxima 8 | `@IsOptional()` `@IsString()` `@Length(6, 8)` | Código de un factor ya verificado (o `currentPassword`): reautentica el alta de un factor propio | `src/modules/iam/presentation/dto/mfa-factor.dto.ts:97` |

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
  "code": "123456",
  "currentPassword": "ClaveSegura2026!",
  "mfaCode": "123456"
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
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Para añadir o quitar un factor confirme su contraseña actual o un código de su app autenticadora; PreconditionFailedException: La contraseña o el código no coinciden; PreconditionFailedException: factorId es obligatorio para verificar; PreconditionFailedException: code es obligatorio para verificar; PreconditionFailedException: El factor no tiene un secreto TOTP asociado; PreconditionFailedException: Código MFA inválido; PreconditionFailedException: factorType es obligatorio para enrolar |
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

## 48. GET /iam/users/{id}/sessions

- **Origen:** CONTRATO
- **Nombre:** Sesiones del usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.listSessions` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:249`

### Qué es y para qué sirve (negocio)

Sesiones del usuario. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /iam/users/{id}/sessions` la atiende `IamUsersController.listSessions` (src/modules/iam/presentation/controllers/iam-users.controller.ts:249). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IamUsersReadService.listSessions`. Lee iam.sessions, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:249` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/iam/presentation/controllers/iam-users.controller.ts:249` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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
| `items` | `array<SessionListItemDto>` | Sí | — | — | Sesiones, de la más reciente a la más antigua. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:462` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la sesión; es lo que se usa para revocarla. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:351` |
| `items[].deviceId` | `string` | No | formato uuid; admite null | — | Dispositivo desde el que se abrió, si se registró. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:357` |
| `items[].geoLocation` | `string` | No | — | — | Ubicación aproximada registrada al abrirla. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:363` |
| `items[].stateConceptId` | `string` | Sí | formato uuid | — | Estado de la sesión. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:369` |
| `items[].expiresAt` | `string` | No | formato date-time; admite null | — | Caducidad de la sesión. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:375` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Apertura de la sesión. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:381` |
| `count` | `number` | Sí | — | — | Cuántas sesiones trae la respuesta. | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:468` |

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

## 49. POST /iam/users/assisted-practitioner-registration

- **Origen:** CONTRATO
- **Nombre:** Alta administrativa de un profesional (devuelve token de activación)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.assistedPractitionerRegistration` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:307`

### Qué es y para qué sirve (negocio)

Alta administrativa de un profesional (devuelve token de activación). Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/assisted-practitioner-registration` la atiende `IamUsersController.assistedPractitionerRegistration` (src/modules/iam/presentation/controllers/iam-users.controller.ts:307). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AssistedPractitionerRegistrationDto` (76 campos, 5 obligatorios). Delega en `IamPractitionerSelfRegistrationService.assistedRegisterPractitioner`. Crea filas en authz.user_role_assignments, common.addresses, common.contact_points, common.file_versions, common.files, common.identifiers, directory.tenant_memberships, iam.account_activations y 17 más. Actualiza common.files. Lee authz.roles, authz.user_role_assignments, common.file_versions, common.files, iam.authentication_credentials, messaging.message_channels, messaging.message_templates, messaging.notification_requests y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:307` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzBusinessRolesAdapter.ensureRoleByCode → AuthzEffectiveRolesService.ensureRoleByCode | `src/modules/authz/services/authz-effective-roles.service.ts:139` |
| `authz.user_role_assignments` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzBusinessRolesAdapter.ensureRoleByCode → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.create | `src/modules/authz/repositories/user-role-assignments.repository.ts:123` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AuthzBusinessRolesAdapter.ensureRoleByCode → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.findActive | `src/modules/authz/repositories/user-role-assignments.repository.ts:73` |
| `common.addresses` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PracticeOwnSiteProvisioningAdapter.provision → OwnSiteProvisioningService.provision → AddressesRepository.create | `src/modules/common/repositories/addresses.repository.ts:154` |
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CommonRecordsAdapter.createContactPoint → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:198` |
| `common.file_versions` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FilesService.createFile → FileVersionsRepository.create | `src/modules/common/repositories/file-versions.repository.ts:142` |
| `common.file_versions` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CommonRegistrationFilesAdapter.claimAnonymousUpload → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:190` |
| `common.files` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.uploadProfilePhoto → CommonRegistrationFilesAdapter.uploadAnonymous → FileUploadService.uploadAnonymous → FilesService.createFile → FilesRepository.create | `src/modules/common/repositories/files.repository.ts:52` |
| `common.files` | ESCRIBE | ACTUALIZA | POR_TIPO | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CommonRegistrationFilesAdapter.claimAnonymousUpload → AttachableFileService.claimAnonymousUpload | `src/modules/common/services/attachable-file.service.ts:270` |
| `common.files` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CommonRegistrationFilesAdapter.claimAnonymousUpload → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile | `src/common/storage/storage-publication.service.ts:182` |
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CommonRecordsAdapter.createIdentifier → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:174` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → DirectoryRegistrationAdapter.createTenantMembership → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:150` |
| `iam.account_activations` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → AccountActivationsRepository.create | `src/modules/iam/infrastructure/repositories/account-activations.repository.ts:46` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CredentialsRepository.createPendingPassword | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:262` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:197` |
| `iam.email_verifications` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → EmailVerificationsRepository.create | `src/modules/iam/infrastructure/repositories/email-verifications.repository.ts:41` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → UserGlobalRolesRepository.create | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → UsersRepository.create | `src/modules/iam/infrastructure/repositories/users.repository.ts:49` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.queued_jobs` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → CommonRegistrationFilesAdapter.claimAnonymousUpload → AttachableFileService.claimAnonymousUpload → StoragePublicationService.guardFile → StorageLifecycleCoordinator.assertNoContender → QueuesRepository.findStorageIntents | `src/modules/messaging/repositories/queues.repository.ts:62` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → IamPractitionerSelfRegistrationService.sendVerificationEmail → MessagingEmailNoticeAdapter.enqueueEmail → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PracticeOwnSiteProvisioningAdapter.provision → OwnSiteProvisioningService.provision → PracticeSitesRepository.create | `src/modules/practice/repositories/practice-sites.repository.ts:111` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PracticeOwnSiteProvisioningAdapter.provision → OwnSiteProvisioningService.provision → OwnSiteProvisioningService.uniqueSiteCode → PracticeSitesRepository.findByPracticeAndCode | `src/modules/practice/repositories/practice-sites.repository.ts:85` |
| `practice.practices` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PracticeOwnSiteProvisioningAdapter.provision → OwnSiteProvisioningService.provision → PracticesRepository.create | `src/modules/practice/repositories/practices.repository.ts:150` |
| `practice.practices` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PracticeOwnSiteProvisioningAdapter.provision → OwnSiteProvisioningService.provision → PracticesRepository.findOwnOffice | `src/modules/practice/repositories/practices.repository.ts:135` |
| `practice.practitioner_role_assignments` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → PracticeOwnSiteProvisioningAdapter.provision → OwnSiteProvisioningService.provision → PractitionerRoleAssignmentsRepository.create | `src/modules/practice/repositories/practitioner-role-assignments.repository.ts:311` |
| `profiles.health_practitioner_profiles` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createPractitionerProfile → HealthPractitionerProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:161` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.findPractitionerByCode → HealthPractitionerProfilesRepository.findByCode | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:79` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createJurisdictionAuthorization → JurisdictionAuthorizationsRepository.create | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:114` |
| `profiles.person_account_links` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createAccountLink → PersonAccountLinksRepository.create | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:50` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createPersonProfile → PersonProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createPerson → PersonsRepository.create | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:119` |
| `profiles.practitioner_languages` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createPractitionerLanguage → PractitionerLanguagesRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-languages.repository.ts:62` |
| `profiles.practitioner_specialties` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createPractitionerSpecialty → PractitionerSpecialtiesRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:61` |
| `profiles.professional_credentials` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.createProfessionalCredential → ProfessionalCredentialsRepository.create | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:122` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | IamUsersController.assistedPractitionerRegistration → IamPractitionerSelfRegistrationService.assistedRegisterPractitioner → IamPractitionerSelfRegistrationService.performRegisterPractitioner → ProfilesRegistrationAdapter.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

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
| `licenseFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | fileId del PDF de la matrícula subido por POST /iam/auth/upload-registration-document | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:269` |
| `sedesLicenseFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | fileId del PDF del registro del SEDES subido por POST /iam/auth/upload-registration-document | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:284` |
| `sedesLicenseIssueDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | Fecha de inscripción en el SEDES (ISO) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:298` |
| `collegeLicenseNumber` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Número de registro en el colegio profesional | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:320` |
| `collegeName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Colegio profesional que emitió el registro | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:331` |
| `collegeLicenseIssueDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | Fecha de inscripción en el colegio profesional (ISO) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:340` |
| `collegeLicenseFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | fileId del PDF del registro del colegio subido por POST /iam/auth/upload-registration-document | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:353` |
| `professionalTitle` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:362` |
| `specialtyConceptIds` | `array<string>` | No | formato uuid; máximo 4 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(4)` `@IsUUID(undefined, { each: true })` | Especialidades declaradas (una principal y hasta tres adicionales). | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:388` |
| `nationalId` | `string` | Sí | longitud máxima 40; patrón runtime /^[A-Za-z0-9.-]+$/ | `@IsString()` `@MaxLength(40)` `@Matches(/^[A-Za-z0-9.-]+$/, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Documento de identidad obligatorio; se guarda como identificador oficial | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:401` |
| `issuerAdministrativeAreaConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Departamento emisor del documento (catálogo VS_BO_DEPARTMENT) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:423` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:444` |
| `homeAddressLines` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Calle y número del domicilio particular | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:461` |
| `homeDistrict` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Distrito o zona del domicilio particular | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:474` |
| `homeLatitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:493` |
| `homeLongitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:504` |
| `workAddressLines` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Calle y número de la dirección laboral | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:515` |
| `workLatitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:526` |
| `workLongitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: RegisterPractitionerDto) => dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:537` |
| `phone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Forma anterior de declarar el teléfono del trabajo. Preferí workLandline o workMobilePhone. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:559` |
| `mobilePhone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Celular personal en formato E.164 o nacional | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:572` |
| `workMobilePhone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Celular de trabajo en formato E.164 o nacional | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:585` |
| `workLandline` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Teléfono fijo del lugar de trabajo | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:598` |
| `birthDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:606` |
| `gender` | `string` | No | valores: MALE, FEMALE, OTHER, UNKNOWN | `@IsOptional()` `@IsIn(ADMIN_GENDER_CODES)` | Género administrativo (HL7 AdministrativeGender) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:617` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | `@IsOptional()` `@IsIn(BIRTH_SEX_CODES)` | Sexo asignado al nacer | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:628` |
| `practitionerCategoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:637` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:645` |
| `credentialTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:653` |
| `languageConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:661` |
| `acceptsNewPatients` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:670` |
| `occupationConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Ocupación del catálogo (VS_BO_OCCUPATION) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:681` |
| `occupationFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(OCCUPATION_FREE_TEXT_MAX_LENGTH)` | Ocupación en texto libre, para cuando no está en el catálogo | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:694` |
| `workEmployerConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:705` |
| `workEmployerFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(EMPLOYER_FREE_TEXT_MAX_LENGTH)` | Empresa en texto libre, para cuando no está en el catálogo | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:719` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:728` |
| `profilePhotoBase64` | `string` | No | longitud máxima 2800000 | `@IsOptional()` `@IsString()` `@MaxLength(2_800_000)` | Foto de perfil en formato Base64 (Data URI o base64 plano) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:740` |
| `signatureFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:746` |
| `sealFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:752` |
| `ownSite` | `CreateOwnSiteDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => CreateOwnSiteDto)` | Consultorio propio a dar de alta en la misma transacción (ALV-005/006 · P20). Mismo contrato que POST /practitioners/me/sites | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:775` |
| `ownSite.name` | `string` | No | longitud máxima 200 | — | Nombre del consultorio | sin fuente |
| `ownSite.timeZone` | `string` | No | — | — | — | sin fuente |
| `ownSite.address` | `OwnSiteAddressDto` | No | — | — | — | sin fuente |
| `ownSite.address.lines` | `array<string>` | No | longitud máxima 500 | `@IsArray()` `@IsString({ each: true })` `@MaxLength(500, { each: true })` | Líneas de la dirección; puede ir vacía si la sede se ubica sólo por municipio o coordenadas | `src/common/dto/create-own-site.dto.ts:44` |
| `ownSite.address.city` | `string` | No | longitud máxima 255 | `@IsOptional()` `@IsString()` `@MaxLength(255)` | — | `src/common/dto/create-own-site.dto.ts:51` |
| `ownSite.address.municipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/create-own-site.dto.ts:57` |
| `ownSite.address.district` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/common/dto/create-own-site.dto.ts:67` |
| `ownSite.address.administrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/common/dto/create-own-site.dto.ts:73` |
| `ownSite.address.latitude` | `number` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/common/dto/create-own-site.dto.ts:94` |
| `ownSite.address.longitude` | `number` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: OwnSiteAddressDto) => dto.latitude !== undefined \|\| dto.longitude !== undefined, )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/common/dto/create-own-site.dto.ts:105` |
| `ownSite.contactPhone` | `string` | No | longitud máxima 40 | — | — | sin fuente |
| `ownSite.logoFileId` | `string` | No | formato uuid | — | — | sin fuente |
| `credentials` | `array<RegisterPractitionerCredentialDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => RegisterPractitionerCredentialDto)` | Títulos académicos declarados en el alta; cada uno crea una fila de professional_credentials. No se combina con credentialNumber. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:802` |
| `credentials[].credentialTypeConceptId` | `string` | No | formato uuid | `@IsUUID()` | Concept id del tipo de credencial (título universitario, diplomado, maestría, doctorado o título de especialidad) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:827` |
| `credentials[].number` | `string` | No | longitud máxima 100; patrón runtime /\S/ | `@IsString()` `@Matches(/\S/, { message: 'number no puede estar vacío' })` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:842` |
| `credentials[].issuingInstitutionText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:854` |
| `credentials[].issuingCityText` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:865` |
| `credentials[].issuingCountryText` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:875` |
| `credentials[].professionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de VS_BO_PROFESSION (COB-2023) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:887` |
| `credentials[].titleText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:897` |
| `credentials[].fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | fileId del PDF subido por POST /iam/auth/upload-registration-document | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:911` |
| `reason` | `string` | Sí | longitud máxima 500 | `@IsString()` `@MaxLength(500)` | Motivo del alta administrativa (trazabilidad C-18) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:1058` |
| `clinicalRoles` | `array<string>` | No | longitud máxima 100; máximo 10 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(10)` `@IsString({ each: true })` `@MaxLength(100, { each: true })` | Roles asistenciales a conceder (códigos de `GET /authz/roles`) | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:1085` |

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
  "licenseFileId": "00000000-0000-4000-8000-000000000001",
  "sedesLicenseFileId": "00000000-0000-4000-8000-000000000001",
  "sedesLicenseIssueDate": "2026-07-31",
  "collegeLicenseNumber": "CMB-12345",
  "collegeName": "Colegio Médico de Bolivia",
  "collegeLicenseIssueDate": "2026-07-31",
  "collegeLicenseFileId": "00000000-0000-4000-8000-000000000001",
  "professionalTitle": "valor-ejemplo",
  "specialtyConceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "homeAddressLines": "valor-ejemplo",
  "homeDistrict": "valor-ejemplo",
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
      "district": "valor-ejemplo",
      "administrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
      "latitude": 1,
      "longitude": 1
    },
    "contactPhone": "+591 72123456",
    "logoFileId": "00000000-0000-4000-8000-000000000001"
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
| `activationToken` | `string` | Sí | — | — | Token de un solo uso a entregar al titular por canal seguro | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:1102` |
| `activationExpiresAt` | `string` | Sí | formato date-time | — | Cuándo caduca el token. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:1108` |
| `clinicalRoles` | `array<string>` | No | — | — | Roles asistenciales efectivamente concedidos. Se devuelven para que el administrador vea con qué quedó operativo el profesional sin tener que consultarlo aparte. Si alguno de los pedidos no existía, el alta entera falla, así que esta lista coincide siempre con lo solicitado. | `src/modules/iam/presentation/dto/register-practitioner.dto.ts:1119` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una cuenta con ese correo; ConflictException: El practitioner_code ya está en uso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Declare los títulos en `credentials` o el número suelto en `credentialNumber`, no los dos; PreconditionFailedException: El archivo del registro del SEDES necesita su número de registro; PreconditionFailedException: La matrícula y el registro del SEDES no pueden compartir el mismo archivo; PreconditionFailedException: La fecha del registro del SEDES necesita su número de registro; PreconditionFailedException: Los datos del registro del colegio necesitan su número de registro; PreconditionFailedException: El registro del colegio no puede compartir el archivo de otra habilitación; PreconditionFailedException: La foto de perfil no es una imagen válida; PreconditionFailedException: El departamento emisor es obligatorio para el alta del profesional; PreconditionFailedException: {labels.subject} no corresponde a un archivo subido en este registro; PreconditionFailedException: La firma y el sello requieren una imagen privada de hasta 2 MB; PreconditionFailedException: Ese concepto no es un tipo de credencial profesional; PreconditionFailedException: El número del título no puede estar vacío; PreconditionFailedException: Esa profesión no está en la Clasificación de Ocupaciones de Bolivia; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: Alguno de los roles indicados no existe o no es asignable |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | StorageLifecycleDenied: LIFECYCLE_WIRING_MISSING |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practitioner-registration.int-spec.ts:270` |

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 50. POST /iam/users/assisted-registration

- **Origen:** CONTRATO
- **Nombre:** Registro asistido de un paciente (devuelve token de activación)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.assistedRegistration` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:276`

### Qué es y para qué sirve (negocio)

Registro asistido de un paciente (devuelve token de activación). Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/assisted-registration` la atiende `IamUsersController.assistedRegistration` (src/modules/iam/presentation/controllers/iam-users.controller.ts:276). Exige sesión con alguno de los roles CLINICIAN, SECURITY_ADMIN. Valida el cuerpo como `AssistedRegistrationDto` (10 campos, 2 obligatorios). Delega en `IamAssistedRegistrationService.assistedRegistration`. Crea filas en iam.account_activations, iam.authentication_credentials, iam.security_events, iam.user_global_roles, iam.users, profiles.patient_profiles, profiles.person_account_links, profiles.person_profiles y 1 más. Lee iam.authentication_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:276` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.account_activations` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → AccountActivationsRepository.create | `src/modules/iam/infrastructure/repositories/account-activations.repository.ts:46` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → CredentialsRepository.createPendingPassword | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:262` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → CredentialsRepository.findLivePasswordBySubject | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:197` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → UserGlobalRolesRepository.create | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → UsersRepository.create | `src/modules/iam/infrastructure/repositories/users.repository.ts:49` |
| `profiles.patient_profiles` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → ProfilesRegistrationAdapter.createPatientProfile → PatientProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:220` |
| `profiles.person_account_links` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → ProfilesRegistrationAdapter.createAccountLink → PersonAccountLinksRepository.create | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:50` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → ProfilesRegistrationAdapter.createPersonProfile → PersonProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | IamUsersController.assistedRegistration → IamAssistedRegistrationService.assistedRegistration → ProfilesRegistrationAdapter.createPerson → PersonsRepository.create | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:119` |

### Cuerpo — DTO `AssistedRegistrationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: AssistedRegistrationDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:37` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:46` |
| `lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@ValidateIf((dto: AssistedRegistrationDto) => dto.displayName === undefined)` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:56` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:65` |
| `displayName` | `string` | No | longitud mínima 1; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Forma anterior de declarar el nombre. Preferí name/lastName. | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:84` |
| `email` | `string` | Sí | formato email; longitud máxima 320 | `@IsEmail()` `@MaxLength(320)` | Identificador verificado (email) que actúa como identidad de login | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:96` |
| `reason` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Motivo del registro asistido (queda en la trazabilidad C-18) | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:108` |
| `timeZone` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Zona horaria IANA del paciente | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:117` |
| `legalRepresentationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id de la representación legal formal (authz.patient_legal_representations) | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:129` |
| `legalRepresentativeUserId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del usuario representante legal (dato mínimo si no hay representación formal) | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:141` |

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
| `userId` | `string` | Sí | formato uuid | — | Id de la cuenta creada | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:154` |
| `activationToken` | `string` | Sí | — | — | Token de activación de un solo uso (entregar al titular por canal seguro) | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:163` |
| `activationExpiresAt` | `string` | Sí | formato date-time | — | Caducidad del token de activación | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:169` |
| `status` | `string` | Sí | — | — | Estado de la cuenta (pendiente de activación) | `src/modules/iam/presentation/dto/assisted-registration.dto.ts:178` |

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

## 51. POST /iam/users/search

- **Origen:** CONTRATO
- **Nombre:** Listado paginado de usuarios, con los filtros en el cuerpo
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IamUsersController.searchUsersByBody` — `src/modules/iam/presentation/controllers/iam-users.controller.ts:171`

### Qué es y para qué sirve (negocio)

Listado paginado de usuarios, con los filtros en el cuerpo. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /iam/users/search` la atiende `IamUsersController.searchUsersByBody` (src/modules/iam/presentation/controllers/iam-users.controller.ts:171). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `SearchUsersBodyDto` (4 campos, 0 obligatorios). Delega en `IamUsersReadService.searchUsers`. Lee iam.authentication_credentials, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/iam-users.controller.ts:171` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | IamUsersController.searchUsersByBody → IamUsersReadService.searchUsers → CredentialsRepository.findBySubjectMatch | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:157` |
| `iam.users` | LEE | LEE | DIRECTA | IamUsersController.searchUsersByBody → IamUsersReadService.searchUsers → UsersRepository.searchPage | `src/modules/iam/infrastructure/repositories/users.repository.ts:130` |

### Cuerpo — DTO `SearchUsersBodyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `q` | `string` | No | — | `@IsOptional()` `@IsString()` | Texto a buscar en el nombre visible o en el correo de acceso | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:89` |
| `status` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concepto de estado al que acotar | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:100` |
| `cursor` | `string` | No | — | `@IsOptional()` `@IsString()` | Cursor opaco devuelto por la página anterior | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:110` |
| `limit` | `integer` | No | mínimo 1; máximo 500 | `@IsOptional()` `@IsInt({ message: SEARCH_USERS_LIMIT_MESSAGE })` `@Min(1, { message: SEARCH_USERS_LIMIT_MESSAGE })` `@Max(SEARCH_USERS_MAX_LIMIT, { message: SEARCH_USERS_LIMIT_MESSAGE })` | Tope de resultados (por defecto 50) | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:126` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "q": "valor-ejemplo",
  "status": "00000000-0000-4000-8000-000000000001",
  "cursor": "valor-ejemplo",
  "limit": 50
}
```

</details>

### Respuesta — `Promise<SearchUsersResponseDto>` · DTO `SearchUsersResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<UserListItemDto>` | Sí | — | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:135` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:20` |
| `items[].displayName` | `string` | Sí | — | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:26` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:32` |
| `items[].mfaStatusConceptId` | `string` | No | formato uuid | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:38` |
| `items[].emailVerified` | `boolean` | Sí | — | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:44` |
| `items[].phoneVerified` | `boolean` | Sí | — | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:50` |
| `items[].lastLoginAt` | `object` | No | admite null | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:56` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:62` |
| `count` | `number` | Sí | — | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:141` |
| `limit` | `number` | Sí | — | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:147` |
| `nextCursor` | `object` | No | admite null | — | — | `src/modules/iam/presentation/dto/iam-user-read.dto.ts:153` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/iam/presentation/controllers/iam-users.controller.spec.ts:189` |

### Flujos

- IAM — etapa `ctrl:IamUsersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 52. GET /org/ip-access-rules

- **Origen:** CONTRATO
- **Nombre:** Reglas de red de la organización
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IpAccessRulesController.get` — `src/modules/iam/presentation/controllers/ip-access-rules.controller.ts:37`

### Qué es y para qué sirve (negocio)

Reglas de red de la organización. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/ip-access-rules` la atiende `IpAccessRulesController.get` (src/modules/iam/presentation/controllers/ip-access-rules.controller.ts:37). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `IpAccessRulesService.list`. Lee authz.ip_access_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/ip-access-rules.controller.ts:37` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.ip_access_rules` | LEE | LEE | DIRECTA | IpAccessRulesController.get → IpAccessRulesService.list → AuthzIpAccessRulesAdapter.listActive | `src/modules/iam/infrastructure/adapters/authz-ip-access-rules.adapter.ts:54` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<IpAccessRulesResponseDto>` · DTO `IpAccessRulesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `rules` | `array<IpAccessRuleViewDto>` | Sí | — | — | Reglas activas, en el orden en que se guardaron. | `src/modules/iam/presentation/dto/ip-access-rules.dto.ts:71` |
| `rules[].id` | `string` | Sí | formato uuid | — | Identificador de la regla. | `src/modules/iam/presentation/dto/ip-access-rules.dto.ts:64` |

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

- IAM — etapa `ctrl:IpAccessRulesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 53. PUT /org/ip-access-rules

- **Origen:** CONTRATO
- **Nombre:** Definir las reglas de red de la organización
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `IpAccessRulesController.put` — `src/modules/iam/presentation/controllers/ip-access-rules.controller.ts:45`

### Qué es y para qué sirve (negocio)

Definir las reglas de red de la organización. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`PUT /org/ip-access-rules` la atiende `IpAccessRulesController.put` (src/modules/iam/presentation/controllers/ip-access-rules.controller.ts:45). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PutIpAccessRulesDto` (6 campos, 3 obligatorios). Delega en `IpAccessRulesService.put`. Crea filas en authz.ip_access_rules. Actualiza authz.ip_access_rules. Lee authz.ip_access_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/ip-access-rules.controller.ts:45` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.ip_access_rules` | ESCRIBE | ACTUALIZA | POR_TIPO | IpAccessRulesController.put → IpAccessRulesService.put → AuthzIpAccessRulesAdapter.replace | `src/modules/iam/infrastructure/adapters/authz-ip-access-rules.adapter.ts:94` |
| `authz.ip_access_rules` | ESCRIBE | CREA | DIRECTA | IpAccessRulesController.put → IpAccessRulesService.put → AuthzIpAccessRulesAdapter.replace | `src/modules/iam/infrastructure/adapters/authz-ip-access-rules.adapter.ts:98` |
| `authz.ip_access_rules` | LEE | LEE | DIRECTA | IpAccessRulesController.put → IpAccessRulesService.put → AuthzIpAccessRulesAdapter.replace | `src/modules/iam/infrastructure/adapters/authz-ip-access-rules.adapter.ts:87` |

### Cuerpo — DTO `PutIpAccessRulesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `rules` | `array<IpAccessRuleDto>` | Sí | máximo 50 elemento(s) | `@IsArray()` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => IpAccessRuleDto)` | — | `src/modules/iam/presentation/dto/ip-access-rules.dto.ts:57` |
| `rules[].type` | `string` | Sí | valores: ALLOW, DENY | `@IsIn(RULE_TYPES)` | — | `src/modules/iam/presentation/dto/ip-access-rules.dto.ts:21` |
| `rules[].cidr` | `string` | Sí | longitud máxima 64 | `@IsString()` `@MaxLength(64)` | — | `src/modules/iam/presentation/dto/ip-access-rules.dto.ts:27` |
| `rules[].description` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/iam/presentation/dto/ip-access-rules.dto.ts:34` |
| `rules[].validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | — | `src/modules/iam/presentation/dto/ip-access-rules.dto.ts:40` |
| `rules[].validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | — | `src/modules/iam/presentation/dto/ip-access-rules.dto.ts:46` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "rules": [
    {
      "type": "ALLOW",
      "cidr": "190.129.0.0/16"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "rules": [
    {
      "type": "ALLOW",
      "cidr": "190.129.0.0/16",
      "description": "Texto descriptivo de ejemplo",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

</details>

### Respuesta — `Promise<IpAccessRulesResponseDto>` · DTO `IpAccessRulesResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `rules` | `array<IpAccessRuleViewDto>` | Sí | — | — | Reglas activas, en el orden en que se guardaron. | `src/modules/iam/presentation/dto/ip-access-rules.dto.ts:71` |
| `rules[].id` | `string` | Sí | formato uuid | — | Identificador de la regla. | `src/modules/iam/presentation/dto/ip-access-rules.dto.ts:64` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El rango de red no es un CIDR válido (ejemplo: 190.129.0.0/16); PreconditionFailedException: La regla termina antes de empezar; PreconditionFailedException: Estas reglas dejarían fuera la red desde la que está trabajando |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:IpAccessRulesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 54. GET /org/session-policies

- **Origen:** CONTRATO
- **Nombre:** Políticas de sesión de la organización
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SessionPoliciesController.get` — `src/modules/iam/presentation/controllers/session-policies.controller.ts:36`

### Qué es y para qué sirve (negocio)

Políticas de sesión de la organización. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /org/session-policies` la atiende `SessionPoliciesController.get` (src/modules/iam/presentation/controllers/session-policies.controller.ts:36). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `SessionPoliciesService.get`. Lee iam.session_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/session-policies.controller.ts:36` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.session_policies` | LEE | LEE | DIRECTA | SessionPoliciesController.get → SessionPoliciesService.get → SessionPoliciesRepository.findByTenant | `src/modules/iam/infrastructure/repositories/session-policies.repository.ts:40` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SessionPoliciesResponseDto>` · DTO `SessionPoliciesResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `policies` | `array<SessionPolicyDto>` | Sí | — | — | Políticas vigentes. | `src/modules/iam/presentation/dto/session-policies.dto.ts:112` |
| `policies[].scope` | `string` | Sí | valores: ALL_ACCOUNTS, ORG_STAFF, ROLE | `@IsIn(SCOPES)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:58` |
| `policies[].roleCode` | `string` | No | longitud máxima 60 | `@IsOptional()` `@IsString()` `@MaxLength(60)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:65` |
| `policies[].idleTimeoutMinutes` | `number` | Sí | mínimo 5; máximo 1440 | `@IsInt()` `@Min(5)` `@Max(1440)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:72` |
| `policies[].newDeviceAlert` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:77` |
| `policies[].allowedHours` | `AllowedHoursDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => AllowedHoursDto)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:84` |
| `policies[].allowedHours.days` | `array<number>` | No | mínimo 0; máximo 6; máximo 7 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayUnique()` `@ArrayMaxSize(7)` `@IsInt({ each: true })` `@Min(0, { each: true })` `@Max(6, { each: true })` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:33` |
| `policies[].allowedHours.from` | `string` | No | patrón runtime HHMM | `@Matches(HHMM)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:38` |
| `policies[].allowedHours.to` | `string` | No | patrón runtime HHMM | `@Matches(HHMM)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:43` |
| `policies[].allowedHours.timeZone` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:50` |
| `policies[].enforceIpRules` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:89` |
| `policies[].requireMfa` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:94` |

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

- IAM — etapa `ctrl:SessionPoliciesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 55. PUT /org/session-policies

- **Origen:** CONTRATO
- **Nombre:** Definir las políticas de sesión de la organización
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `SessionPoliciesController.put` — `src/modules/iam/presentation/controllers/session-policies.controller.ts:44`

### Qué es y para qué sirve (negocio)

Definir las políticas de sesión de la organización. Dentro del módulo (descripción del modelo, en inglés): «Manages login accounts, credentials, MFA, devices and sessions.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_01_iam.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`PUT /org/session-policies` la atiende `SessionPoliciesController.put` (src/modules/iam/presentation/controllers/session-policies.controller.ts:44). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PutSessionPoliciesDto` (12 campos, 6 obligatorios). Delega en `SessionPoliciesService.put`. Crea filas en iam.session_policies. Actualiza iam.session_policies. Lee authz.ip_access_rules, iam.session_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/iam/presentation/controllers/session-policies.controller.ts:44` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.ip_access_rules` | LEE | LEE | DIRECTA | SessionPoliciesController.put → SessionPoliciesService.put → SessionPoliciesService.assertActorKeepsAccess → IpAccessRulesService.assertActorKeepsStoredRules → AuthzIpAccessRulesAdapter.listActive | `src/modules/iam/infrastructure/adapters/authz-ip-access-rules.adapter.ts:54` |
| `iam.session_policies` | ESCRIBE | ACTUALIZA | POR_TIPO | SessionPoliciesController.put → SessionPoliciesService.put | `src/modules/iam/application/services/session-policies.service.ts:114` |
| `iam.session_policies` | ESCRIBE | CREA | DIRECTA | SessionPoliciesController.put → SessionPoliciesService.put → SessionPoliciesRepository.create | `src/modules/iam/infrastructure/repositories/session-policies.repository.ts:84` |
| `iam.session_policies` | LEE | LEE | DIRECTA | SessionPoliciesController.put → SessionPoliciesService.put → SessionPoliciesRepository.findByTenant | `src/modules/iam/infrastructure/repositories/session-policies.repository.ts:40` |

### Cuerpo — DTO `PutSessionPoliciesDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `policies` | `array<SessionPolicyDto>` | Sí | máximo 20 elemento(s) | `@IsArray()` `@ArrayMaxSize(20)` `@ValidateNested({ each: true })` `@Type(() => SessionPolicyDto)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:105` |
| `policies[].scope` | `string` | Sí | valores: ALL_ACCOUNTS, ORG_STAFF, ROLE | `@IsIn(SCOPES)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:58` |
| `policies[].roleCode` | `string` | No | longitud máxima 60 | `@IsOptional()` `@IsString()` `@MaxLength(60)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:65` |
| `policies[].idleTimeoutMinutes` | `number` | Sí | mínimo 5; máximo 1440 | `@IsInt()` `@Min(5)` `@Max(1440)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:72` |
| `policies[].newDeviceAlert` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:77` |
| `policies[].allowedHours` | `AllowedHoursDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => AllowedHoursDto)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:84` |
| `policies[].allowedHours.days` | `array<number>` | No | mínimo 0; máximo 6; máximo 7 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayUnique()` `@ArrayMaxSize(7)` `@IsInt({ each: true })` `@Min(0, { each: true })` `@Max(6, { each: true })` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:33` |
| `policies[].allowedHours.from` | `string` | No | patrón runtime HHMM | `@Matches(HHMM)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:38` |
| `policies[].allowedHours.to` | `string` | No | patrón runtime HHMM | `@Matches(HHMM)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:43` |
| `policies[].allowedHours.timeZone` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:50` |
| `policies[].enforceIpRules` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:89` |
| `policies[].requireMfa` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:94` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "policies": [
    {
      "scope": "ALL_ACCOUNTS",
      "idleTimeoutMinutes": 5,
      "newDeviceAlert": true,
      "enforceIpRules": true,
      "requireMfa": true
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "policies": [
    {
      "scope": "ALL_ACCOUNTS",
      "roleCode": "CODIGO_EJEMPLO",
      "idleTimeoutMinutes": 5,
      "newDeviceAlert": true,
      "allowedHours": {
        "days": [
          1
        ],
        "from": "07:00",
        "to": "20:00",
        "timeZone": "America/La_Paz"
      },
      "enforceIpRules": true,
      "requireMfa": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<SessionPoliciesResponseDto>` · DTO `SessionPoliciesResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `policies` | `array<SessionPolicyDto>` | Sí | — | — | Políticas vigentes. | `src/modules/iam/presentation/dto/session-policies.dto.ts:112` |
| `policies[].scope` | `string` | Sí | valores: ALL_ACCOUNTS, ORG_STAFF, ROLE | `@IsIn(SCOPES)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:58` |
| `policies[].roleCode` | `string` | No | longitud máxima 60 | `@IsOptional()` `@IsString()` `@MaxLength(60)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:65` |
| `policies[].idleTimeoutMinutes` | `number` | Sí | mínimo 5; máximo 1440 | `@IsInt()` `@Min(5)` `@Max(1440)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:72` |
| `policies[].newDeviceAlert` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:77` |
| `policies[].allowedHours` | `AllowedHoursDto` | No | — | `@IsOptional()` `@ValidateNested()` `@Type(() => AllowedHoursDto)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:84` |
| `policies[].allowedHours.days` | `array<number>` | No | mínimo 0; máximo 6; máximo 7 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayUnique()` `@ArrayMaxSize(7)` `@IsInt({ each: true })` `@Min(0, { each: true })` `@Max(6, { each: true })` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:33` |
| `policies[].allowedHours.from` | `string` | No | patrón runtime HHMM | `@Matches(HHMM)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:38` |
| `policies[].allowedHours.to` | `string` | No | patrón runtime HHMM | `@Matches(HHMM)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:43` |
| `policies[].allowedHours.timeZone` | `string` | No | longitud máxima 64 | `@IsOptional()` `@IsString()` `@MaxLength(64)` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:50` |
| `policies[].enforceIpRules` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:89` |
| `policies[].requireMfa` | `boolean` | Sí | — | `@IsBoolean()` | — | `src/modules/iam/presentation/dto/session-policies.dto.ts:94` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La franja horaria no admite a nadie: la hora de inicio y la de fin son iguales; PreconditionFailedException: La franja horaria debe durar al menos 4 horas; PreconditionFailedException: Esta política dejaría fuera el horario en el que está trabajando; PreconditionFailedException: Las reglas de red de la organización dejarían fuera la red desde la que está trabajando |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.BAD_REQUEST} |

El árbol de decisión completo está en [flujos](../flujos/iam.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- IAM — etapa `ctrl:SessionPoliciesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

