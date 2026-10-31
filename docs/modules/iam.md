<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/iam/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver README.md de la raíz, tabla "Arquitectura y mapa").
-->

# Módulo `iam`

**Fuente:** [`src/modules/iam/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/iam/README.md)
· 7 controllers · 22 services · 14 repositories · 15 entidades · 28 DTO

---

# IAM

Identidad y acceso de ALOVIDA: cuentas, credenciales, sesiones y refresh tokens,
MFA, dispositivos, roles globales, bloqueos y eventos de seguridad.

## Rutas HTTP y alcance (medido)

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/iam -name '*.controller.ts' | wc -l
  find src/modules/iam -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/iam -name '*.entity.ts' | wc -l
  find src/modules/iam -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **3 controllers, 34 rutas HTTP, 14 entidades y 15 servicios** (incluye los ya documentados más abajo). La columna _Acceso_ sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso (propiedad, tenant, vínculo) puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`iam.module.ts`): `ProfilesModule`, `CommonModule`, `MessagingModule`, `DirectoryModule`, `AuthzModule`, `InsuranceModule`, `TerminologyModule`, `PracticeModule`.

| Método y ruta                                              | Acceso                    | Controller             |
| ---------------------------------------------------------- | ------------------------- | ---------------------- |
| `POST /iam/auth/change-password`                           | sesión                    | `iam-account-security` |
| `GET /iam/me/sessions`                                     | sesión                    | `iam-account-security` |
| `POST /iam/me/sessions/:id/revoke`                         | sesión                    | `iam-account-security` |
| `POST /iam/me/devices/:id/confirm`                         | sesión                    | `iam-account-security` |
| `POST /iam/me/devices/:id/not-me`                          | sesión                    | `iam-account-security` |
| `GET /iam/me/mfa`                                          | sesión                    | `iam-account-security` |
| `POST /iam/me/mfa/totp`                                    | sesión                    | `iam-account-security` |
| `POST /iam/me/mfa/totp/:factorId/confirm`                  | sesión                    | `iam-account-security` |
| `GET /org/ip-access-rules`                                 | SECURITY_ADMIN            | `ip-access-rules`      |
| `PUT /org/ip-access-rules`                                 | SECURITY_ADMIN            | `ip-access-rules`      |
| `POST /iam/auth/register-patient`                          | pública                   | `iam-auth`             |
| `POST /iam/auth/register-organization`                     | pública                   | `iam-auth`             |
| `POST /iam/auth/upload-registration-document`              | pública                   | `iam-auth`             |
| `POST /iam/auth/register-practitioner`                     | pública                   | `iam-auth`             |
| `POST /iam/auth/resend-verification`                       | pública                   | `iam-auth`             |
| `POST /iam/auth/verify-email`                              | pública                   | `iam-auth`             |
| `POST /iam/auth/activate`                                  | pública                   | `iam-auth`             |
| `POST /iam/auth/login`                                     | pública                   | `iam-auth`             |
| `POST /iam/auth/forgot-password`                           | pública                   | `iam-auth`             |
| `POST /iam/auth/reset-password`                            | pública                   | `iam-auth`             |
| `POST /iam/auth/token/refresh`                             | pública                   | `iam-auth`             |
| `POST /iam/auth/logout`                                    | sesión                    | `iam-auth`             |
| `POST /iam/auth/logout-all`                                | sesión                    | `iam-auth`             |
| `POST /iam/auth/sessions/purge`                            | SECURITY_ADMIN            | `iam-auth`             |
| `GET /iam/users` (obsoleto: usar `POST /iam/users/search`) | SECURITY_ADMIN            | `iam-users`            |
| `POST /iam/users/search`                                   | SECURITY_ADMIN            | `iam-users`            |
| `GET /iam/users/:id`                                       | SECURITY_ADMIN            | `iam-users`            |
| `GET /iam/users/:id/credentials`                           | SECURITY_ADMIN            | `iam-users`            |
| `GET /iam/users/:id/devices`                               | SECURITY_ADMIN            | `iam-users`            |
| `GET /iam/users/:id/mfa-factors`                           | SECURITY_ADMIN            | `iam-users`            |
| `GET /iam/users/:id/sessions`                              | SECURITY_ADMIN            | `iam-users`            |
| `GET /iam/users/:id/global-roles`                          | SECURITY_ADMIN            | `iam-users`            |
| `POST /iam/users/assisted-registration`                    | CLINICIAN, SECURITY_ADMIN | `iam-users`            |
| `POST /iam/users/assisted-practitioner-registration`       | SECURITY_ADMIN            | `iam-users`            |
| `POST /iam/users`                                          | SECURITY_ADMIN            | `iam-users`            |
| `POST /iam/users/:id/credentials/federated`                | SECURITY_ADMIN            | `iam-users`            |
| `POST /iam/users/:id/credentials/:cid/revoke`              | SECURITY_ADMIN            | `iam-users`            |
| `POST /iam/users/:id/mfa-factors`                          | sesión                    | `iam-users`            |
| `POST /iam/users/:id/devices`                              | sesión                    | `iam-users`            |
| `POST /iam/users/:id/lock`                                 | SECURITY_ADMIN            | `iam-users`            |
| `POST /iam/users/:id/global-roles`                         | SECURITY_ADMIN            | `iam-users`            |
| `POST /iam/users/:id/anonymize`                            | SECURITY_ADMIN            | `iam-users`            |

## Endpoints por caso de uso (subconjunto)

Los 14 casos de uso UC-01-xx originales. **No es la lista completa**: el módulo expone más rutas (registro de paciente, profesional y organización, verificación de correo, activación, cambio de contraseña, sesiones propias, listados administrativos); están todas en [Rutas HTTP](#rutas-http-y-alcance-medido).

| #   | Method + path                                 | Use case                                           | Auth             | Code    |
| --- | --------------------------------------------- | -------------------------------------------------- | ---------------- | ------- |
| 1   | `POST /iam/users`                             | Create user (+ password credential + initial role) | `SECURITY_ADMIN` | 201     |
| 2   | `POST /iam/users/:id/credentials/federated`   | Link federated credential                          | `SECURITY_ADMIN` | 201     |
| 3   | `POST /iam/users/:id/mfa-factors`             | Enroll / verify MFA factor                         | authenticated    | 201     |
| 4   | `POST /iam/auth/login`                        | Password login → tokens                            | `@Public`        | 200     |
| 5   | `POST /iam/users/:id/devices`                 | Register device                                    | authenticated    | 201     |
| 6   | `POST /iam/auth/token/refresh`                | Rotate refresh token (reuse detection)             | `@Public`        | 200     |
| 7   | `POST /iam/users/:id/lock`                    | Lock account, revoke sessions                      | `SECURITY_ADMIN` | 200     |
| 8   | `POST /iam/auth/logout-all`                   | Revoke all sessions of caller                      | authenticated    | 200     |
| 9   | `POST /iam/users/:id/credentials/:cid/revoke` | Revoke a credential                                | `SECURITY_ADMIN` | 200     |
| 10  | `POST /iam/users/:id/global-roles`            | Grant / revoke a global role                       | `SECURITY_ADMIN` | 200/201 |
| 11  | `POST /iam/auth/sessions/purge`               | Expire stale sessions/tokens                       | `SECURITY_ADMIN` | 200     |
| 12  | `POST /iam/users/:id/anonymize`               | DSAR anonymization                                 | `SECURITY_ADMIN` | 200     |
| 13  | `POST /iam/auth/forgot-password`              | Request a password-reset link                      | `@Public`        | 202     |
| 14  | `POST /iam/auth/reset-password`               | Consume the token, set a new password              | `@Public`        | 200     |

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

## Controles de sesión de la organización

`iam.session_policies` (`GET|PUT /org/session-policies`) fija, por alcance (`ALL_ACCOUNTS`, `ORG_STAFF`, `ROLE`),
la inactividad, el aviso de dispositivo nuevo, el horario, las reglas de red y el segundo paso. **La política de una
organización rige solo cuando la persona actúa en ella.** Cada política se evalúa con los roles que la persona tiene
en SU organización y solo para esa organización; una organización no puede cerrarle a una persona el inicio de sesión
en las demás.

- Si una organización X niega ahora (franja horaria, red, segundo factor no cumplido), el login **no se rechaza**: X
  sale de `tenants` y de `scopedRoles` del token (y, con ella, los roles que solo regían en X), se declara en el claim
  `deniedTenants` (`{ [tenantId]: motivo }`) y la respuesta del login y del refresco trae `deniedTenants:
  [{ tenantId, reason }]`. La persona entra a sus otras organizaciones.
- Una petición con `X-Tenant-Id: X` recibe **403** con `reason` de primer nivel igual al motivo y `details: { tenantId,
  reason }` (`TenantContextInterceptor`/`TenantScopeGuard` lo resuelven con el claim, sin consultar la base).
- El refresco **no revoca** la sesión por la política de una organización cuando la persona tiene otra a la que entrar:
  solo quita X del token renovado. La política se revisa en cada refresco, así que X vuelve cuando la franja abre, la
  red coincide o la persona presenta el factor.
- Si **todas** las organizaciones de la persona niegan (el caso de quien solo pertenece a una), el rechazo es el de
  siempre: 401 con `details.reason`; el refresco revoca la sesión.
- El tope de la demora es la vida del access token: el token emitido a las 17:55 sigue valiendo en X hasta que vence,
  aunque la franja cierre a las 18:00.
- Las membresías que una organización crea con `POST /tenants/:tenantId/memberships` nacen **pendientes** de que la
  persona las acepte (ver `directory`): una pendiente no cuenta para las políticas ni para el token.

| Motivo (`reason`)         | Cuándo                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `OUTSIDE_ALLOWED_HOURS`   | Fuera de la franja `allowedHours` de esa organización (login y refresco).                                     |
| `OUTSIDE_ALLOWED_NETWORK` | `enforceIpRules` y el origen no está en las redes permitidas de esa organización (login y refresco).          |
| `IDLE_TIMEOUT`            | Refresco de una sesión inactiva más de `idleTimeoutMinutes` (más la vida del access token, ver abajo).        |
| `MFA_REQUIRED`            | Esa organización exige segundo factor, la cuenta tiene uno y esta sesión no presentó el código al entrar.     |
| `MFA_ENROLLMENT_REQUIRED` | Esa organización exige segundo factor y la cuenta aún no tiene uno confirmado (ver «Segundo paso»).          |
| `MFA_INVALID`             | Solo login (401): el código presentado no vale o ya se usó. Cuenta para el bloqueo, aunque haya otras organizaciones. |

**Validación al guardar** (`PUT /org/session-policies`, 422 con `reason`):

- `SESSION_POLICY_HOURS_EMPTY`: `from == to` (una franja vacía, no de 24 horas).
- `SESSION_POLICY_HOURS_TOO_SHORT`: la franja dura menos de 4 horas (la que cruza la medianoche suma sus dos tramos).
- `SESSION_POLICY_WOULD_LOCK_OUT_ACTOR`: la franja de una política que le aplica a quien guarda no lo incluye AHORA.
- `IP_RULES_WOULD_LOCK_OUT_ACTOR`: la política exige reglas de red y el origen de quien guarda queda fuera de las
  reglas guardadas, vigentes o futuras (la misma comprobación que `PUT /org/ip-access-rules`).

**Ruta de rescate** (solo `@Roles('SYSTEM')`): `DELETE /iam/rescue/tenants/:tenantId/ip-access-rules` y
`DELETE /iam/rescue/tenants/:tenantId/session-policies` retiran todas las reglas de red / políticas activas de un
tenant (quedan como histórico) y responden `{ retired }`. Cada una deja su propia acción de auditoría
(`IP_ACCESS_RULES_RESCUED`, `SESSION_POLICIES_RESCUED`) con el tenant de la ruta. Una organización que se encerró no
puede desbloquearse sola.

### Reglas de red (`enforceIpRules`)

Las reglas viven en `authz.ip_access_rules` y las define `PUT /org/ip-access-rules` (`{ rules: [{ type: 'ALLOW'|'DENY',
cidr, description?, validFrom?, validTo? }] }`, reemplaza el conjunto; hasta 50). Solo se evalúan las de **toda la
organización** (`scope = authz:SCOPE_TENANT`, sin sujeto); el tipo de regla son los conceptos `authz:IP_RULE_ALLOW` y
`authz:IP_RULE_DENY`.

- Una regla `DENY` que coincide niega siempre; si hay reglas `ALLOW`, el origen debe caer en alguna; **sin reglas no
  hay restricción** (encender la política antes de cargar la primera red no deja a nadie afuera, tampoco a quien debe
  corregirla). La prioridad no cambia el resultado.
- Un origen que no se puede determinar se niega cuando hay reglas.
- El origen es `req.ip` de Express: solo mira `X-Forwarded-For` hasta los saltos de `TRUST_PROXY_HOPS`; una cabecera
  inventada por el cliente no lo cambia. Una IPv4 mapeada en IPv6 se compara como IPv4.
- `PUT` no guarda un conjunto que deje fuera el origen de quien lo guarda (422 `IP_RULES_WOULD_LOCK_OUT_ACTOR`) ni un
  CIDR inválido (`IP_RULE_CIDR_INVALID`). La comprobación mira el conjunto vigente ahora **y cada inicio o fin de
  vigencia posterior**: un `ALLOW` con `validFrom` futuro que deje fuera al actor se rechaza hoy.
- Cada organización se evalúa con SUS reglas y solo rigen cuando la persona actúa en ella: la que niega sale del
  token (`deniedTenants`, motivo `OUTSIDE_ALLOWED_NETWORK`) y no cierra el login en las demás.
- Un rechazo de red deja un evento `SEC_LOGIN` con resultado fallido en `iam.security_events`; no cuenta como
  contraseña fallida, así que no acerca la cuenta al bloqueo.
- Con RLS: el login y la renovación son públicos y no tienen organización activa, así que sus lecturas de autoridad
  (membresías activas, vínculos de apoyo, asignaciones de rol, políticas de sesión, reglas de red y la práctica que
  decide el tipo de cuenta) corren con `withSystemRead` (`common/tenant/system-read-scope.ts`): el contexto de sistema
  se abre SOLO mientras dura cada lectura, que filtra por la persona que se autentica o por las organizaciones donde
  ya tiene membresía activa, y se devuelve en un `finally`. Sin `RLS_ENFORCE` no cambia nada. La prueba contra Postgres
  real como `mantra_app` es `test/integration/iam-security-rls.int-spec.ts` (`IAM_RLS_TEST=1`).
- El bloqueo de cuenta (`iam.account_lockouts`, sin `tenant_id`) lo rechaza la política RLS salvo con contexto de sistema:
  sin ello el INSERT del bloqueo tras el 5º fallo lanzaba y revertía con él el evento del fallo. Se escribe con
  `withSystemWrite` (`common/tenant/system-read-scope.ts`), el análogo estrecho de `withSystemRead` para ESA escritura:
  `AccountLockoutsRepository.lockForFailedAttempts` (login) y `lockManually` (`POST /iam/users/:id/lock`) vuelcan lo pendiente
  antes de abrir el contexto, buscan y escriben solo la fila de esa cuenta, vuelcan antes de cerrarlo y lo restauran en un
  `finally`; exige transacción, así que el bloqueo es atómico con el fallo y con la revocación de sesiones. El modelo no se
  toca: la política sigue exigiendo `tenant_id` igual al del contexto o contexto de sistema.
- `POST /iam/me/devices/:id/confirm-code` (envío del código de «Fui yo» al correo verificado) es auditable con su propia
  acción, `DEVICE_CONFIRM_CODE_REQUESTED` (entidad `device`).

### Origen y proxy (`TRUST_PROXY_HOPS`)

Las reglas se evalúan contra `req.ip`, y Express la toma de `X-Forwarded-For` contando **saltos desde la derecha**. El
valor correcto de `TRUST_PROXY_HOPS` es **exactamente el número de proxies de confianza delante de la API**:

- Con `0` detrás de un proxy, todos los clientes valen la IP del proxy: las reglas no distinguen a nadie y un `ALLOW`
  por una red ajena encierra a todos.
- Con más saltos de los reales, el elemento elegido es una cabecera que escribió el cliente y puede suplantar cualquier
  origen.
- Con el compose de referencia hay un proxy delante (`TRUST_PROXY_HOPS=0` por defecto: solo sirve para desarrollo
  local); en Coolify son 2 (Traefik y el nginx del front) y 1 si la API se publica directo por Traefik.

La API lo comprueba al arrancar (`NetworkProxyCheckService`, `domain/proxy-config.ts`): con reglas de red activas y
`TRUST_PROXY_HOPS` en `0` avisa en el log (`iam.network.proxy-check`, código `TRUST_PROXY_HOPS_ZERO_WITH_NETWORK_RULES`);
también avisa si el valor no es un entero ≥ 0 (`TRUST_PROXY_HOPS_INVALID`) o supera 3 (`TRUST_PROXY_HOPS_HIGH`). Es solo un
aviso: la API no sabe cuántos proxies tiene delante.

`GET /iam/me/network` (sesión) devuelve `{ ip, family, trustProxyHops }`: la IP que ve el servidor para esa petición.
**Mírela antes de guardar reglas**: si es la IP del proxy y no la suya, `TRUST_PROXY_HOPS` está mal.

### Dispositivo nuevo

El login reconoce el dispositivo con `IamDeviceRecognitionService` (`iam.devices`): una huella HMAC-SHA256 con clave
derivada de `JWT_SECRET` sobre persona + familia de navegador + sistema + clase de equipo (sin versiones, para que
actualizar el navegador no parezca un equipo nuevo; sin red, para que cambiar de red no lo parezca). En
`iam.devices` quedan la huella (prefijo `srv1:`) y una descripción («Chrome en Windows»); **no** se guarda el
`User-Agent` ni la IP en el dispositivo. La IP de la sesión (`iam.sessions.ip`) y de los eventos de seguridad se
guarda como ya se hacía.

- El primer dispositivo de una persona **nunca** avisa: queda de confianza como punto de partida. Con el aviso apagado
  también se registra de confianza, para que encenderlo después no trate lo conocido como nuevo.
- Un cliente **sin `User-Agent`** cuenta como desconocido: se registra sin confianza («Cliente sin identificar») y avisa en
  cada inicio de sesión (si hay dispositivos previos), aunque el dispositivo figure de confianza. Omitir la cabecera no es
  una forma de pasar inadvertido.
- **Aviso fuera de banda**: cuando hay aviso, además se manda un correo al **correo verificado** de la cuenta
  (`EMAIL_NOTICE_PORT`, el mismo canal de verificación y restablecimiento). El aviso del login lo ve quien inicia sesión,
  que puede no ser el titular. Sin correo verificado no hay canal y solo queda el aviso en pantalla; un fallo del envío
  no impide el login.
- **Cookie de dispositivo** (opcional, `AUTH_DEVICE_COOKIE_ENABLED=true`, apagada por defecto): la huella por
  `User-Agent` NO autentica a nadie. Con la cookie encendida, el login entrega `redesa_device` (firmada con HMAC que liga
  persona y dispositivo, HttpOnly, `SameSite=Strict`, `Secure` en producción, `Path=/iam/auth/login`, 400 días; nunca en el
  cuerpo). Con una cookie válida el dispositivo es el de la cookie; **sin ella**, un cliente que solo coincide por
  `User-Agent` con un equipo de confianza (habiendo otros dispositivos) se trata como nuevo: queda en un dispositivo
  «gemelo» sin confianza (uno por persona y navegador) hasta que la persona lo confirme. Requiere que front y API
  compartan sitio; con el front en otro origen sin credenciales el navegador nunca devolvería la cookie y todo login
  pasaría por nuevo, por eso es opt-in. Variables: `AUTH_DEVICE_COOKIE_ENABLED`, `AUTH_DEVICE_COOKIE_SECURE`,
  `AUTH_DEVICE_COOKIE_NAME`, `AUTH_DEVICE_COOKIE_PATH`.
- Un dispositivo desconocido, con dispositivos previos y alguna política aplicable con `newDeviceAlert`, se registra
  sin confianza y el login responde `newDevice: { deviceId, label, ip?, occurredAt }`; el aviso se repite en cada
  inicio de sesión desde él hasta que la persona lo confirma.
- `POST /iam/me/devices/:id/confirm` («Fui yo») `{ code? }`: el dispositivo queda de confianza (idempotente; evento
  `SEC_DEVICE_TRUST`) **solo** (a) desde una sesión abierta en OTRO dispositivo que ya es de confianza o (b) con `code`, el
  código de 8 dígitos de un solo uso que `POST /iam/me/devices/:id/confirm-code` manda al correo verificado (responde
  `{ sent, sentTo }` con la dirección enmascarada; vale 10-20 minutos). Sin ninguna de las dos: 422
  `DEVICE_CONFIRM_CODE_REQUIRED` (`details.canRequestCode`); código malo o gastado: 422 `DEVICE_CONFIRM_CODE_INVALID`;
  sin correo verificado: 422 `DEVICE_CONFIRM_NO_VERIFIED_EMAIL`. El código se deriva (HMAC) de la persona, el
  dispositivo y la ventana; al usarlo queda su huella —no el código— en el evento. `POST /iam/me/devices/:id/not-me` («No fui yo»): deja de ser de confianza y revoca **las demás**
  sesiones y refresh tokens de la cuenta (evento `SEC_LOGOUT_ALL` con `flow: device-not-me`). Un dispositivo ajeno es 404.
- Un fallo del reconocimiento no impide entrar: se registra y la sesión se abre sin dispositivo.
- Limitación: la huella no distingue dos equipos con el mismo navegador y sistema.

### Inactividad y claim `idleTimeoutMinutes`

El access token lleva `idleTimeoutMinutes` (5-480) con el menor plazo de las políticas aplicables (acotado; sin
política no hay claim). Es presentación para el reloj del cliente y no autoriza nada. El servidor solo ve la
inactividad al refrescar, desde el último refresco, y no ve la actividad mientras el access token vive: el plazo que
hace cumplir es `idleTimeoutMinutes` **más la vida del access token** (`JWT_ACCESS_TTL`). Sin esa holgura un plazo menor
que la vida del token (5 o 10 minutos frente a 15) cerraba la sesión de quien estuvo activo en el primer refresco.

### Segundo paso: alta de la propia cuenta

Cuando la política de una organización exige `requireMfa` y la cuenta no tiene un factor TOTP confirmado, la API lo
**impone**:

- Si todas las organizaciones de la persona (o la única) lo exigen, el login emite un token de **alcance limitado**: claim
  `mfaEnrollment: true`, sin roles ni organizaciones, y `mfaEnrollmentRequired: true` en la respuesta. Un guard global
  (`MfaEnrollmentScopeGuard`, justo tras `JwtAuthGuard`) solo deja pasar `/iam/me/mfa*`, `POST /iam/auth/logout`, el
  refresco (`/iam/auth/token/refresh`) y `GET /iam/me`; todo lo demás es 403 `MFA_ENROLLMENT_REQUIRED`. El socket tampoco
  lo acepta.
- Si tiene otras organizaciones que no lo exigen, entra completa a ellas y la que lo exige queda en `deniedTenants` con
  `MFA_ENROLLMENT_REQUIRED` (la política de X no limita a la persona en las demás).
- El refresco **conserva** el alcance mientras no haya un factor confirmado, y lo reemite completo al confirmarlo: una
  sesión que confirma un factor dentro de ella cuenta como que presentó el segundo factor.
- Con un factor confirmado, el login pide el código a las organizaciones que lo exigen: `MFA_REQUIRED` (401) si falta y la
  persona solo tiene organizaciones que lo exigen; si tiene otras, entra sin ellas (`deniedTenants` con `MFA_REQUIRED`).
  Que la sesión superó el factor lo recuerda el refresh token (prefijo `mfa.` dentro del secreto hasheado, que el cliente no
  puede añadir ni quitar sin invalidar el hash): sin él, el refresco no devuelve esas organizaciones.
- No hay plazo de gracia por organización: `iam.session_policies` no tiene el campo.

El código del login es de **un solo uso**: el último paso de tiempo TOTP aceptado de cada factor queda en
`iam.security_events` (acción `code-used`, `mfa_factors` no tiene columna para él) y un código con paso igual o menor se
rechaza (`IamTotpService`, con un cerrojo por persona para que dos peticiones simultáneas con el mismo código no pasen las
dos). Un código inválido o ya usado cuenta para el umbral de bloqueo con un **contador propio del segundo factor**
(`reason: bad-mfa` desde el último login correcto, mismo umbral que la contraseña, `ACCOUNT_LOCK_THRESHOLD`).

- `GET /iam/me/mfa` → `{ required, enrolled, enrollmentRequired, factors[] }` (sin secretos). Cuenta también las
  organizaciones que niegan por el factor y el token limitado.
- `POST /iam/me/mfa/totp` `{ label?, currentPassword? | mfaCode? }` → factor pendiente con `secret` y `otpauthUri` (solo en
  esta respuesta); retira los intentos anteriores sin confirmar. **Reautenticación obligatoria**: la contraseña actual o el
  código de un factor ya verificado; sin ninguna, 422 `MFA_REAUTH_REQUIRED`; si no valen, 422 `MFA_REAUTH_FAILED` (con
  evento de seguridad). No es 401: el cliente cierra la sesión ante un 401. Lo mismo exige
  `POST /iam/users/:id/mfa-factors` sobre la propia cuenta (el administrador sobre otra cuenta no tiene con qué reautenticar al
  titular y queda como estaba).
- `POST /iam/me/mfa/totp/:factorId/confirm` `{ code }` → `{ verified, factorId, verifiedAt }`; un código inválido es
  422 `MFA_CODE_INVALID` y deja un evento de seguridad fallido. Confirmar no pide reautenticación: el código del propio
  factor es la prueba.
- `POST /iam/me/mfa/:factorId/revoke` `{ currentPassword? | mfaCode? }` → `{ revoked, remainingVerified }`: quita un factor
  propio con la misma reautenticación; al quitar el último confirmado el segundo paso de la cuenta queda apagado. Ajeno,
  inexistente o ya retirado es 404.
- Solo operan sobre la propia cuenta (`id` del token). Delegan en `IamMfaService`, que cifra el secreto.

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

### Borradores de alta (`/iam/onboarding-drafts`)

Rutas públicas (el alta ocurre antes de tener cuenta) que guardan el avance del
formulario en la memoria del proceso (`IamOnboardingDraftsService`).

- **Acceso por secreto.** El primer `PUT` crea el borrador y devuelve una sola vez
  `draftSecret` (256 bits aleatorios; el servidor guarda su SHA-256). `GET`, `PUT` y
  `DELETE` lo exigen en la cabecera `X-Onboarding-Draft-Secret`, comparado en tiempo
  constante. Secreto ausente o erróneo, borrador inexistente, vencido o id mal formado
  responden el mismo 404.
- **Vigencia.** Un borrador nuevo vive 1 hora. Sólo una segunda escritura con el
  secreto hecha al menos 60 s después de crearlo lo confirma y extiende su vida a
  30 días. Un barrido cada 10 minutos libera los vencidos.
- **Topes.** 64 KiB por borrador; 2000 borradores en el proceso; 25 por origen (IPv4
  por dirección, IPv6 por prefijo /64) y 100 por prefijo agregado (/48 en IPv6).
  Con el almacén lleno, un origen sólo desaloja su propio borrador no confirmado más
  antiguo; nunca el de otro origen. Si no tiene ninguno, 503 con `Retry-After`.
- **Límite que no cubre el código.** El almacén es por proceso (con más de una
  instancia, el borrador sólo existe en la que lo recibió) y un atacante con muchos
  prefijos distintos (botnet) todavía puede agotar el cupo global y dejar sin alta a
  quien llegue después. La mitigación de fondo es limitar la tasa en el borde
  (gateway o WAF) y mover el almacén a Redis cuando haya más de una instancia
  (ver #875).

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

## Pruebas

Ejecutar `corepack yarn test src/modules/iam --runInBand --silent`. El 2026-10-05
pasaron 22 suites y 359 pruebas. Son principalmente unitarias con repositorios y
servicios simulados: no sustituyen pruebas HTTP contra el filtro global, PostgreSQL,
almacenamiento de objetos ni el ciclo de vida de precargas anónimas.
