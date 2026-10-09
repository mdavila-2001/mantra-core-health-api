# IAM Module

Identity & Access Management for the ALOVIDA Health API: users, credentials
(password + federated), sessions and refresh-token rotation, MFA factors, devices,
global roles, account lockouts and an append-only security-event trail.

Built on the shared foundation in `src/common`: `EntityManager` (MikroORM 7,
PostgreSQL) with service-owned transactions, `CONCEPTS.*` for every `*_concept_id`
FK, `TokenService` for JWT/refresh tokens, domain exceptions, and Pino logging.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/iam -name '*.controller.ts' | wc -l
  find src/modules/iam -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/iam -name '*.entity.ts' | wc -l
  find src/modules/iam -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **3 controllers, 34 rutas HTTP, 14 entidades y 15 servicios** (incluye los ya documentados más abajo). La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso (propiedad, tenant, vínculo) puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`iam.module.ts`): `ProfilesModule`, `CommonModule`, `MessagingModule`, `DirectoryModule`, `AuthzModule`, `InsuranceModule`, `TerminologyModule`, `PracticeModule`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /iam/auth/change-password` | sesión | `iam-account-security` |
| `GET /iam/me/sessions` | sesión | `iam-account-security` |
| `POST /iam/me/sessions/:id/revoke` | sesión | `iam-account-security` |
| `POST /iam/auth/register-patient` | pública | `iam-auth` |
| `POST /iam/auth/register-organization` | pública | `iam-auth` |
| `POST /iam/auth/upload-registration-document` | pública | `iam-auth` |
| `POST /iam/auth/register-practitioner` | pública | `iam-auth` |
| `POST /iam/auth/resend-verification` | pública | `iam-auth` |
| `POST /iam/auth/verify-email` | pública | `iam-auth` |
| `POST /iam/auth/activate` | pública | `iam-auth` |
| `POST /iam/auth/login` | pública | `iam-auth` |
| `POST /iam/auth/forgot-password` | pública | `iam-auth` |
| `POST /iam/auth/reset-password` | pública | `iam-auth` |
| `POST /iam/auth/token/refresh` | pública | `iam-auth` |
| `POST /iam/auth/logout` | sesión | `iam-auth` |
| `POST /iam/auth/logout-all` | sesión | `iam-auth` |
| `POST /iam/auth/sessions/purge` | SECURITY_ADMIN | `iam-auth` |
| `GET /iam/users` | SECURITY_ADMIN | `iam-users` |
| `GET /iam/users/:id` | SECURITY_ADMIN | `iam-users` |
| `GET /iam/users/:id/credentials` | SECURITY_ADMIN | `iam-users` |
| `GET /iam/users/:id/devices` | SECURITY_ADMIN | `iam-users` |
| `GET /iam/users/:id/mfa-factors` | SECURITY_ADMIN | `iam-users` |
| `GET /iam/users/:id/sessions` | SECURITY_ADMIN | `iam-users` |
| `GET /iam/users/:id/global-roles` | SECURITY_ADMIN | `iam-users` |
| `POST /iam/users/assisted-registration` | CLINICIAN, SECURITY_ADMIN | `iam-users` |
| `POST /iam/users/assisted-practitioner-registration` | SECURITY_ADMIN | `iam-users` |
| `POST /iam/users` | SECURITY_ADMIN | `iam-users` |
| `POST /iam/users/:id/credentials/federated` | SECURITY_ADMIN | `iam-users` |
| `POST /iam/users/:id/credentials/:cid/revoke` | SECURITY_ADMIN | `iam-users` |
| `POST /iam/users/:id/mfa-factors` | sesión | `iam-users` |
| `POST /iam/users/:id/devices` | sesión | `iam-users` |
| `POST /iam/users/:id/lock` | SECURITY_ADMIN | `iam-users` |
| `POST /iam/users/:id/global-roles` | SECURITY_ADMIN | `iam-users` |
| `POST /iam/users/:id/anonymize` | SECURITY_ADMIN | `iam-users` |

## Endpoints por caso de uso (subconjunto)

Los 14 casos de uso UC-01-xx originales. **No es la lista completa**: el módulo expone más rutas (registro de paciente, profesional y organización, verificación de correo, activación, cambio de contraseña, sesiones propias, listados administrativos); están todas en [Rutas HTTP](#rutas-http-y-alcance-medido).

| # | Method + path | Use case | Auth | Code |
| --- | --- | --- | --- | --- |
| 1 | `POST /iam/users` | Create user (+ password credential + initial role) | `SECURITY_ADMIN` | 201 |
| 2 | `POST /iam/users/:id/credentials/federated` | Link federated credential | `SECURITY_ADMIN` | 201 |
| 3 | `POST /iam/users/:id/mfa-factors` | Enroll / verify MFA factor | authenticated | 201 |
| 4 | `POST /iam/auth/login` | Password login → tokens | `@Public` | 200 |
| 5 | `POST /iam/users/:id/devices` | Register device | authenticated | 201 |
| 6 | `POST /iam/auth/token/refresh` | Rotate refresh token (reuse detection) | `@Public` | 200 |
| 7 | `POST /iam/users/:id/lock` | Lock account, revoke sessions | `SECURITY_ADMIN` | 200 |
| 8 | `POST /iam/auth/logout-all` | Revoke all sessions of caller | authenticated | 200 |
| 9 | `POST /iam/users/:id/credentials/:cid/revoke` | Revoke a credential | `SECURITY_ADMIN` | 200 |
| 10 | `POST /iam/users/:id/global-roles` | Grant / revoke a global role | `SECURITY_ADMIN` | 200/201 |
| 11 | `POST /iam/auth/sessions/purge` | Expire stale sessions/tokens | `SECURITY_ADMIN` | 200 |
| 12 | `POST /iam/users/:id/anonymize` | DSAR anonymization | `SECURITY_ADMIN` | 200 |
| 13 | `POST /iam/auth/forgot-password` | Request a password-reset link | `@Public` | 202 |
| 14 | `POST /iam/auth/reset-password` | Consume the token, set a new password | `@Public` | 200 |

### Password recovery (UC-01-13)

Three properties hold the rest of it up:

- **It never reveals whether an account exists.** `forgot-password` always answers
  `202` with the same message — same body, same status — whether or not there is a
  credential behind the identifier. A `404` on an unknown address would turn a
  public form into an oracle for which emails have an account on a health
  platform.
- **The plaintext token only ever exists inside the email.** The database holds its
  SHA-256, like a refresh token, so reading `iam.password_resets` does not let
  anyone reset anybody's password. Requesting a new link revokes the outstanding
  ones.
- **Resetting closes every session.** Someone recovering an account is doing so
  because they lost control of the password; leaving the thief's session alive
  would defeat the whole exercise.

The identifier is the same one used to log in (email or national ID), resolved
through the same lookup as `login`. When it is a national ID there is no address
in it, so the destination comes from the last email the user declared; with no
address on file no token is issued at all — one nobody can receive is only useful
to whoever intercepts it. The response stays identical in that case too.

## Identity model

A user's login identity is an `authentication_credentials` row with
`method = PASSWORD` and `external_subject = email`. Uniqueness is enforced on the
active password credential's `external_subject`. Federated identities are extra
credentials (`method = FEDERATED`) keyed by `(user, identityProvider, externalSubject)`.

## Entities (schema `iam`)

14 entidades (`find src/modules/iam -name '*.entity.ts' | wc -l`): `users`,
`authentication_credentials`, `sessions`, `refresh_tokens`, `mfa_factors`, `devices`,
`user_global_roles`, `account_lockouts`, `security_events`, `account_activations`,
`email_verifications`, `password_resets`, `api_keys`, `api_key_scopes`.
`security_events` es append-only: sólo `recorded_at`, sin `row_version` ni `updated_at`.

## Key business rules

- **Uniqueness**: reject a second active password credential for the same email
  (409). Reject a duplicate federated credential (409).
- **Auto-lockout (UC-01-07 via UC-01-04)**: on repeated failed logins, once the
  count reaches `ACCOUNT_LOCK_THRESHOLD`, create an active `account_lockouts` row,
  set the user `USER_LOCKED`, and revoke active sessions.
- **Refresh-token rotation & reuse detection (UC-01-06)**: a valid token is marked
  `ROTATED` and a new one issued; presenting a non-active token revokes the whole
  session and records `TOKEN_REUSE`.
- **Anonymization (UC-01-12)**: set `USER_ANONYMIZED`, blank the display name,
  revoke credentials, sessions, refresh tokens and roles.
- Every mutating operation records a `security_events` row.

## Permissions

Admin operations require the `SECURITY_ADMIN` global role (`RolesGuard`). `login`
and `token/refresh` are `@Public`. Self-service operations (MFA, devices,
logout-all) only require authentication.

## Logging

Pino structured logs (`operation`, ids, reason) for start/success/rejection of
each operation. Secrets, password hashes, raw tokens and PHI are never logged.

## Layout

- `entities/` — MikroORM entities (pre-existing).
- `repositories/` — stateless data access (take the active `em`).
- `dto/` — request/response contracts.
- `services/` — business logic, transaction owners.
- `controllers/` — thin HTTP layer.

## Tests

Unit tests (`*.spec.ts`) mock `EntityManager` and repositories; run with
`NODE_OPTIONS=--experimental-vm-modules npx jest src/modules/iam`. Each service
covers happy path, not-found, conflict and a business rule; controllers verify
delegation.
