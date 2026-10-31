<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/delegated_access/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver README.md de la raíz, tabla "Arquitectura y mapa").
-->

# Módulo `delegated_access`

**Fuente:** [`src/modules/delegated_access/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/delegated_access/README.md)
· 10 controllers · 18 services · 20 repositories · 13 entidades · 21 DTO

---

# Módulo 29 — Delegated Access and Scoped Infrastructure Users

Delegación scoped de acceso: usuarios de organización con alcance y vigencia, sets
de permisos delegados versionados, delegaciones de practitioner, solicitudes con
aprobación previa, grants temporales por propósito, revocación en cascada, barrido
de expiración y evaluación del actor efectivo (con step-up). Sin impersonación:
delegante y delegado quedan siempre auditados en `delegation_events`.

## Personal de apoyo (secretaria y otros roles)

Una persona de apoyo tiene un **vínculo** (`organization_user_assignments` con
`role_template_id`) con **una organización**; nadie comparte contraseña. Lo que
puede hacer sale de **permisos** (`support_scope_grants`), cada uno con un
**tipo de objetivo** y sus propias **acciones** (`support_grant_actions`).

- **Objetivos**: `PRACTITIONER`, `SERVICE`, `LOCATION`, los cruces
  `PRACTITIONER_SERVICE`, `PRACTITIONER_LOCATION`, `SERVICE_LOCATION` y «todos»
  por nivel (`ALL_PRACTITIONERS`, `ALL_SERVICES`, `ALL_LOCATIONS`, `ALL`). Varias
  filas se **suman**; una fila con dos objetivos se **cruza**.
- **Ubicación**: un permiso por piso/edificio/sede cubre una cita solo si el
  **espacio** de la cita está dentro, por la ruta materializada
  `care_spaces.location_path` (`/sede/edificio/piso/sala/`), que `createCareSpace`
  mantiene.
- **Expansión**: `DYNAMIC` sigue a la estructura; `FIXED` congela lo que cubría
  al otorgarlo (`fixed_snapshot_json = {"rows":[…]}`).
- **Acciones** (15): `schedule.view|create|reschedule|cancel|confirm|check_in|walk_in|waitlist|send_reminders|block_time|edit_hours`,
  `billing.collect|issue_receipt`, `patient.register`, `messages.reply_on_behalf`;
  paquete por defecto por plantilla (`SECRETARY`, `MEDICAL_ASSISTANT`, `NURSING`,
  `FRONT_DESK`, `BILLING_CASHIER`, `CALL_CENTER`, `ORG_MANAGEMENT`) en
  `domain/support-actions.ts`.
- **Solicitudes** (`engagement_requests`): la persona pide (o amplía) y vencen a
  los **15 días**; la organización decide **por ítem** (aprobar, ajustar, rechazar
  con motivo), así que la aprobación puede ser parcial. Los códigos/QR
  (`directory.affiliation_invitations`) sirven para doctores y para apoyo: uno
  solo uso con persona específica (afilia directo), o varios usos (el canje queda
  pendiente de aprobación, ver «Canje de códigos»).
- **Aceptación del doctor**: una vez (cláusula de personal de apoyo) por
  persona (`practitioner_delegate_assignments.accepted_at`); `may_reply_on_behalf`
  y `reply_disclosure_concept_id` gobiernan las respuestas en su nombre.
- **Recertificación** cada 6 o 12 meses; sin confirmar en 15 días el vínculo se
  **suspende**. **Fin de vínculo**: revocación inmediata en cascada (permisos,
  delegaciones, solicitudes abiertas, acceso derivado); **las citas se
  mantienen** y su gestión pasa a la recepción.
- **Clínico**: por defecto solo el motivo de consulta; más exige un acceso
  temporal por paciente que decide el **doctor** (`/access-requests/:id/decision`).
- **Búsqueda de pacientes** del personal de apoyo: EXACTA (documento, teléfono, o
  nombre completo + fecha de nacimiento) y cada búsqueda queda auditada.

### `SupportAccessPolicy`

`SupportAccessPolicy.can({ userId, tenantId, action, practitionerRoleAssignmentId?,
practitionerProfileId?, healthcareServiceId?, careSpaceId? }) → { allowed, reason, grantId? }`,
exportada por el módulo. Regla, en este orden: vínculo activo y no vencido →
aceptación del doctor → algún permiso vigente cubre la cita → el permiso incluye
la acción → registro (log estructurado con identificadores). La evaluación es la
función pura `evaluateSupportAccess` (`domain/`); el servicio solo carga datos y
verifica que doctor, servicio y espacio sean del tenant. Agenda la consulta por el
puerto `SUPPORT_AGENDA_POLICY_PORT`; mensajería, por `canReplyOnBehalf`. La tabla
derivada `effective_support_access` (NULL = cualquiera) la recalcula
`EffectiveSupportAccessService` y alimenta `access-lookup` y el equipo del doctor.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-30 sobre el árbol de trabajo. Repetir con:
  find src/modules/delegated_access -name '*.controller.ts' | wc -l
  find src/modules/delegated_access -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/delegated_access -name '*.entity.ts' | wc -l
  find src/modules/delegated_access -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

La columna _Acceso_ sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`;
`sesión` = sin `@Roles`, o sea que sólo exige sesión autenticada (guards globales
`JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`); `sesión
(sin tenant)` = `@TenantAgnostic()`, la persona actúa sobre lo suyo y la política
contrasta la organización. La autorización por recurso puede vivir además en el
servicio y no se refleja acá.

| Método y ruta                                             | Acceso                                                                      | Controller                    |
| --------------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------- |
| `POST /access-requests/:id/decision`                      | SECURITY_ADMIN, PRACTITIONER, CLINICIAN (decide el doctor de la delegación) | `access-requests`             |
| `POST /delegated-access/expiry-sweep`                     | SYSTEM, SECURITY_ADMIN                                                      | `delegated-access-authz`      |
| `POST /authz/effective-actor/evaluate`                    | SECURITY_ADMIN                                                              | `delegated-access-authz`      |
| `GET /delegated-permission-sets`                          | SECURITY_ADMIN                                                              | `delegated-permission-sets`   |
| `POST /delegated-permission-sets`                         | SECURITY_ADMIN                                                              | `delegated-permission-sets`   |
| `POST /delegated-permission-sets/:id/versions`            | SECURITY_ADMIN                                                              | `delegated-permission-sets`   |
| `POST /org/:tenantMembershipId/user-assignments`          | SECURITY_ADMIN                                                              | `org-user-assignments`        |
| `PATCH /org/user-assignments/:id`                         | SECURITY_ADMIN                                                              | `org-user-assignments`        |
| `POST /practitioner-delegates`                            | SECURITY_ADMIN                                                              | `practitioner-delegates`      |
| `POST /practitioner-delegates/:id/access-requests`        | SECURITY_ADMIN                                                              | `practitioner-delegates`      |
| `POST /practitioner-delegates/:id/grants`                 | SECURITY_ADMIN                                                              | `practitioner-delegates`      |
| `POST /practitioner-delegates/:id/revoke`                 | SECURITY_ADMIN, PRACTITIONER, CLINICIAN (el doctor solo revoca lo suyo)     | `practitioner-delegates`      |
| `GET /me/support-engagements`                             | sesión (sin tenant)                                                         | `support-engagement-requests` |
| `POST /me/support-engagements/:id/confirm`                | sesión (sin tenant)                                                         | `support-engagement-requests` |
| `GET /me/support-activity`                                | sesión (sin tenant)                                                         | `practitioner-support`        |
| `POST /support-engagement-requests`                       | sesión (sin tenant)                                                         | `support-engagement-requests` |
| `GET /org/support-engagement-requests`                    | SECURITY_ADMIN                                                              | `support-engagement-requests` |
| `POST /org/support-engagement-requests/:id/decision`      | SECURITY_ADMIN                                                              | `support-engagement-requests` |
| `GET /org/support-engagements`                            | SECURITY_ADMIN                                                              | `support-engagements`         |
| `GET /org/support-engagements/:id/grants`                 | SECURITY_ADMIN                                                              | `support-engagements`         |
| `POST /org/support-engagements/:id/grants`                | SECURITY_ADMIN                                                              | `support-engagements`         |
| `PATCH /org/support-engagements/:id/grants`               | SECURITY_ADMIN                                                              | `support-engagements`         |
| `POST /org/support-engagements/:id/recertify`             | SECURITY_ADMIN                                                              | `support-engagements`         |
| `POST /org/support-engagements/:id/end`                   | SECURITY_ADMIN                                                              | `support-engagements`         |
| `GET /org/access-lookup`                                  | SECURITY_ADMIN                                                              | `support-engagements`         |
| `GET /org/support-activity`                               | SECURITY_ADMIN                                                              | `support-engagements`         |
| `GET /org/role-templates`                                 | SECURITY_ADMIN                                                              | `support-engagements`         |
| `POST /org/role-templates`                                | SECURITY_ADMIN                                                              | `support-engagements`         |
| `PATCH /org/role-templates/:id`                           | SECURITY_ADMIN                                                              | `support-engagements`         |
| `POST /org/affiliation-invitations`                       | SECURITY_ADMIN                                                              | `affiliation-invitations`     |
| `GET /org/affiliation-invitations`                        | SECURITY_ADMIN                                                              | `affiliation-invitations`     |
| `POST /org/affiliation-invitations/:id/revoke`            | SECURITY_ADMIN                                                              | `affiliation-invitations`     |
| `GET /org/support-catalog`                                | SECURITY_ADMIN                                                              | `support-engagements`         |
| `GET /me/support-catalog`                                 | sesión (sin tenant)                                                         | `support-engagement-requests` |
| `POST /me/support-access-requests`                        | sesión (sin tenant)                                                         | `support-engagement-requests` |
| `GET /me/practitioner/support-access-requests`            | PRACTITIONER, CLINICIAN                                                     | `practitioner-support`        |
| `POST /affiliation-invitations/redeem`                    | sesión (sin tenant)                                                         | `affiliation-invitations`     |
| `GET /me/practitioner/support-team`                       | PRACTITIONER, CLINICIAN                                                     | `practitioner-support`        |
| `GET /me/practitioner/support-activity`                   | PRACTITIONER, CLINICIAN                                                     | `practitioner-support`        |
| `POST /practitioner-delegates/:id/accept`                 | PRACTITIONER, CLINICIAN                                                     | `practitioner-support`        |
| `PATCH /practitioner-delegates/:id/reply-settings`        | PRACTITIONER, CLINICIAN                                                     | `practitioner-support`        |
| `POST /me/support-patient-search`                         | sesión (sin tenant)                                                         | `practitioner-support`        |
| `POST /me/support-patients`                               | sesión (sin tenant)                                                         | `support-patients`            |
| `POST /delegated-access/support/expire-requests`          | SYSTEM                                                                      | `support-maintenance`         |
| `POST /delegated-access/support/recertification-sweep`    | SYSTEM                                                                      | `support-maintenance`         |
| `POST /delegated-access/support/refresh-effective-access` | SYSTEM                                                                      | `support-maintenance`         |

## Pacientes del personal de apoyo (búsqueda exacta y alta rápida)

`POST /me/support-patient-search` y `POST /me/support-patients` son de la persona (sin tenant
activo): la organización viaja en el cuerpo como `tenantId` **u** `org`, el documento como
`nationalId` **o** `document` (si llegan los dos de un par tienen que coincidir: 400
`SUPPORT_PATIENT_INPUT_CONFLICT`). Cada intento de quien tiene vínculo queda sellado **en la
organización indicada**; el de quien no lo tiene, en su partición propia (ver «Bitácora»).

**Tope de consultas (búsqueda y alta comparten cupo).** Un contador atómico propio
(`SupportPatientProbeCounter`, sobre el mismo Redis del rate limit) cuenta CADA intento,
**antes** de mirar el cuerpo y **fuera** de la transacción de negocio: lo rechazado (403, 422,
409), la entrada inválida y lo que acabe en excepción cuentan. La clave es la persona en todas sus
organizaciones y, además, la IP de origen (`req.ip`, que respeta `TRUST_PROXY_HOPS`). Por persona:
20/min y 200/día (`SUPPORT_PATIENT_SEARCH_PER_MINUTE` y `_PER_DAY`); por IP: 60/min y 600/día
(`SUPPORT_PATIENT_SEARCH_IP_PER_MINUTE` y `_IP_PER_DAY`). Ventana deslizante (dos ventanas fijas
ponderadas: sin doble cupo en el cambio de minuto). Al superar un tope: **429**
`SUPPORT_PATIENT_SEARCH_THROTTLED` con `details { limit: PER_MINUTE | PER_DAY, scope: PERSON | IP }`.
Al llegar al 80% del tope se registra un `warn` (`delegated_access.support_patient_probe.anomaly`,
uno por ventana). Si Redis no responde, el contador degrada a memoria del proceso (con aviso), igual
que `RedisThrottlerStorage`: el tope sigue valiendo por réplica.

**Bitácora.** Antes de sellar en una organización se verifica el vínculo vivo de la persona en
ella. Con vínculo (aunque le falte el permiso), el rechazo es de la organización y se sella en su
cadena; **sin vínculo vivo, el rechazo se sella en la partición propia de la persona (sin tenant),
nunca en la cadena de la organización del cuerpo** (con RLS, el contexto de sistema se abre solo
mientras dura ese asiento). Del tope solo el primer rechazo de una racha deja asiento
(`SUPPORT_PATIENT_*_THROTTLED`, partición propia); los siguientes solo suben el contador.

**Búsqueda.** Exacta: documento completo, teléfono completo (7–15 dígitos) o nombre completo +
fecha de nacimiento real. Lo parcial responde **422** `SUPPORT_PATIENT_SEARCH_INEXACT` con el
mensaje de cómo buscar. Devuelve `{ items, count }`; cada ítem trae `patientProfileId` y
`profileId` (mismo valor: el contrato compartido y el front usan nombres distintos),
`displayName`, `documentMasked` (`***556`), `phoneMasked` (`7******7`), `ageYears`, `isMinor` y,
en un menor, `representatives[{ id, name, relationship }]` (personas relacionadas tutor o
contacto de emergencia, más las representaciones legales vigentes **de esa organización**).
La búsqueda no se acota a la organización: la identidad de una persona es de la plataforma y
quien atiende el mostrador tiene que poder hallar a quien nunca pisó la organización; por eso
devuelve lo mínimo, la audita (un asiento por paciente devuelto) y la frena. Un paciente cuenta
como «de la organización» si tiene citas o una representación legal en ella, o si lo registró
una persona con **membresía activa y vigente** en ella (y, si es personal de apoyo, con un vínculo
vivo: activo, vigente y recertificado); una membresía antigua o terminada no vincula.

**Documento normalizado.** El documento se compara y se guarda en su forma canónica: mayúsculas,
sin puntos, guiones ni espacios y sin ceros de relleno (`profiles/domain/national-id.ts`; el SQL de
`SupportPatientsRepository` aplica la misma regla). «01.234-567», «1234567 » y «1234567» son el
mismo documento. Un documento sin contenido (solo ceros o separadores, menos de 4 caracteres
canónicos) responde 400. Dos altas simultáneas con el mismo documento se serializan con un cerrojo
por documento. El modelo v4.2.71 lo respalda con el índice único parcial funcional
`common.uq_identifiers_national_id_normalized` (documento nacional activo de un paciente, sin cierre, en la forma
canónica): la comparación por documento (`findExact`, parecidos y `IdentifiersRepository.findActiveNationalIdDuplicate`)
repite la expresión y los cuatro predicados del índice, con los tres ids como literales, para resolverse con él. Si dos altas
pasan a la vez la comprobación, el índice rechaza la segunda (`23505`) y el alta responde el mismo 409
`SUPPORT_PATIENT_DOCUMENT_REGISTERED` (el rechazo se sella en la partición de la propia persona); el alta de mostrador de
`scheduling` responde el mismo 409 de documento ya registrado.

**Alta** (`patient.register`). Responde **201 `CREATED`** (`patient`, `invitationSent`,
`identityVerified: false`, `guardian`) o **200 `POSSIBLE_DUPLICATES`** (`duplicates[]`, no se creó
nada). Parecidos: mismo documento (canónico), mismo nombre completo + nacimiento, o mismo teléfono

- apellido, buscados en toda la plataforma. Qué se muestra de cada uno:

* _Paciente de la organización_ (tiene citas aquí, una representación legal aquí o lo registró
  alguien de aquí): `profileId`/`patientProfileId`, nombre, edad, documento y teléfono tapados y,
  en un menor, sus representantes.
* _Paciente de otra organización_: **sin** perfil, nombre, edad ni documento del registro ajeno;
  solo `linkedToOrganization: false` y `matchedBy`. Lo «tapado» y la edad que salen son los de lo
  que quien registra acaba de escribir.

Con `acknowledgeDuplicates: true` crea igual, salvo que el documento canónico ya esté registrado
(409 `SUPPORT_PATIENT_DOCUMENT_REGISTERED`: un documento no se duplica, ni escrito de otra forma).

**Identidad sin verificar.** Lo que se escribe en el mostrador no está verificado: el perfil nace
sin cuenta, sin vínculo de cuenta y sin aserción de identidad (`identity_assurance`;
`identityVerified: false`), sin vincular (`LINKAGE_UNLINKED`) y con el documento como identificador
**secundario** (`common.identifiers.use`), no oficial. El registro propio del titular, que sí se
verifica, lo reclama. No hay un flujo de reclamo en este módulo.

**Menores y representantes.** Un menor de 18 años exige `guardian { name, document, phone,
relationship }` (422 `SUPPORT_PATIENT_GUARDIAN_REQUIRED`). **El mostrador no crea representaciones
legales**: el representante queda como _persona relacionada_ (familiar autorizado, contacto de
emergencia, `is_legal_guardian = false`), **pendiente de verificación**; su documento no se
guarda ni se usa para buscar su cuenta, y el asiento es
`SUPPORT_PATIENT_GUARDIAN_PENDING_VERIFICATION`. La respuesta es siempre
`guardian: { recorded: true, status: 'PENDING_VERIFICATION' }`, exista o no una cuenta con ese
documento (no hay oráculo de existencia de cuentas; el campo `guardianLink` ya no existe). La
representación legal la crea un `SECURITY_ADMIN` con `documentRef` por la ruta oficial de `authz`
(`patient-legal-representations`), o el propio representante al aceptarla desde su cuenta.

**Invitación al portal.** `inviteToPortal` publica `profiles.patient_portal_invitation.requested`
en el outbox: el payload lleva **solo ids** (`patientProfileId`, `tenantId`,
`requestedByUserId`), nunca documento, teléfono, nombre, token ni contraseña. **Quien consuma ese
evento debe tomar el destino de la invitación de la cuenta o del contacto verificado del paciente,
nunca del registro que escribió el mostrador** (el teléfono o el documento del alta son
declarados, sin verificar). La escritura reutiliza `registerPatientRecords`
(`profiles/infrastructure/adapters/patient-intake.ts`), el mismo alta del turno de mostrador.

## Endpoints (UC → ruta)

| UC       | Método y ruta                                       | Descripción                                              | Permiso                  |
| -------- | --------------------------------------------------- | -------------------------------------------------------- | ------------------------ |
| UC-29-01 | `POST /org/{tenant_membership_id}/user-assignments` | Asignar usuario de organización (scoped, vigente)        | `SECURITY_ADMIN`         |
| UC-29-02 | `POST /delegated-permission-sets`                   | Publicar set de permisos delegados (v1)                  | `SECURITY_ADMIN`         |
| UC-29-02 | `POST /delegated-permission-sets/{id}/versions`     | Versionar set (reemplazo all-or-nothing)                 | `SECURITY_ADMIN`         |
| UC-29-03 | `POST /practitioner-delegates`                      | Crear delegación de practitioner                         | `SECURITY_ADMIN`         |
| UC-29-04 | `POST /practitioner-delegates/{id}/access-requests` | Solicitar acceso delegado (aprobación previa)            | `SECURITY_ADMIN`         |
| UC-29-05 | `POST /access-requests/{id}/decision`               | Aprobar/Denegar y emitir grant scoped (decide el doctor) | `SECURITY_ADMIN`, doctor |
| UC-29-06 | `POST /practitioner-delegates/{id}/grants`          | Grant pre-autorizado por-propósito y temporal            | `SECURITY_ADMIN`         |
| UC-29-07 | `POST /practitioner-delegates/{id}/revoke`          | Revocar delegación inmediata (cascada)                   | `SECURITY_ADMIN`, doctor |
| UC-29-08 | `POST /delegated-access/expiry-sweep`               | Expirar delegaciones y grants vencidos                   | `SECURITY_ADMIN`         |
| UC-29-09 | `POST /authz/effective-actor/evaluate`              | Evaluar actor efectivo por propósito (step-up)           | `SECURITY_ADMIN`         |
| UC-29-10 | `PATCH /org/user-assignments/{id}`                  | Reasignar supervisor / suspender (cascada)               | `SECURITY_ADMIN`         |

## Entidades (esquema `delegated_access`)

`organization_user_assignments`, `delegated_permission_sets`,
`delegated_permission_set_items`, `practitioner_delegate_assignments`,
`delegated_access_approval_requests`, `delegated_access_grants`, `delegation_events`,
`role_templates`, `support_scope_grants`, `support_grant_actions`,
`engagement_requests`, `engagement_request_items`, `effective_support_access`.
Además, el módulo lee y escribe `directory.affiliation_invitations` (y sus usos),
`practice.practitioner_location_assignments` y las columnas nuevas de
`practice.care_spaces`, `scheduling.*` y `community.direct_messages`.

## Reglas de negocio

- Escrituras en `em.transactional`; las FK son columnas uuid planas, por lo que se
  hace `flush` del padre antes de los hijos.
- `may_sign_clinical_content` nunca se delega por este flujo (queda `false`).
- Grants con `valid_to` obligatorio (alcance temporal); expiran por barrido.
- Solicitud: unicidad de pendiente por (delegación, permiso, paciente/encuentro).
- `PATCH` con `expectedRowVersion` → concurrencia optimista (409 si no coincide);
  suspender cascada a las delegaciones dependientes.
- Revocación idempotente si ya está `REVOKED`; cascada a grants y solicitudes.
- La organización decide solo su tenant; el doctor, solo lo suyo; la persona, solo
  lo suyo. Cada referencia de un objetivo (doctor, servicio, espacio, sede) se
  valida contra el tenant (`SupportTargetsService`); una ajena responde igual que
  una inexistente. Los vínculos del personal de apoyo tienen `ended_reason_text`
  como motivo de fin y, mientras están suspendidos por recertificación, el
  marcador `RECERTIFICATION_LAPSED`.
- Alcance por tenant (`DelegationScopeService`): el tenant sale de `requireTenantId()` y el
  `tenantId` del cuerpo sólo se contrasta (403 `DELEGATED_TENANT_SCOPE_REQUIRED`). La delegación
  no tiene `tenant_id`: su tenant es el de su set. Crear una delegación exige que la asignación de
  organización (por su membresía), la asignación de rol del profesional (por su práctica) y el set
  sean del tenant activo; emitir un grant exige además que el encuentro sea del tenant y del
  paciente indicado. Un eslabón ajeno responde igual que uno inexistente (404, mismo mensaje y
  `reason`, sin `details`).
- `POST /authz/effective-actor/evaluate` evalúa al usuario autenticado, o al declarado en
  `effectiveUserId`; sólo el titular de la asignación del delegado (en el tenant activo) puede
  recibir `allowed: true`, cualquier otro recibe `DELEGATED_SUBJECT_MISMATCH`.

## Conceptos

Declarados en `delegated_access.concepts.ts` (`DELEGATED_ACCESS_CONCEPT_SEEDS`,
mapa `DELEG`). Los estados de agregado reutilizan `CONCEPTS.STATE_*`; el resto
(roles de asignación, scopes, tipos de delegado/grant, propósitos, eventos y
motivos) son propios del módulo.

## Logs

Pino estructurado por operación (`delegated_access.*`), con inicio, éxito y
rechazos de regla de negocio. Nunca se registran secretos ni PHI.

## Tests

- Unit: `services/*.service.spec.ts` (mockean repos/`EntityManager`) y
  `controllers/*.controller.spec.ts` (mockean servicios).
- Domain: `domain/*.spec.ts` (la regla de `SupportAccessPolicy` como tabla con los
  13 casos del hospital piloto, expansión FIXED/DYNAMIC, búsqueda exacta).
- Smoke transversal: `test/smoke/modules/delegated_access.smoke.ts`
  (`DELEGATED_ACCESS_SMOKE`) y `test/smoke/modules/support_staff.smoke.ts`
  (`SUPPORT_STAFF_SMOKE`: solicitud → aprobación parcial → aceptación del doctor →
  fin de vínculo, y códigos de afiliación).

## Endurecimiento del personal de apoyo (revisión de seguridad, 2026-10-30)

- **Búsqueda de pacientes**: exacta (documento, teléfono o nombre completo con fecha real), con tope por persona
  (`SUPPORT_PATIENT_SEARCH_PER_MINUTE`, por defecto 20, y `SUPPORT_PATIENT_SEARCH_PER_DAY`, por defecto 200;
  429 `SUPPORT_PATIENT_SEARCH_THROTTLED`), un asiento de auditoría por búsqueda y otro por cada paciente devuelto
  (`SUPPORT_PATIENT_SEARCH_MATCH`), y un `warn` de anomalía de volumen al acercarse al tope. Decisión de producto vigente:
  toda la base, sin acotar al hospital.
- **Membresía STAFF**: terminar o suspender por recertificación el último vínculo de apoyo de una persona cierra o suspende
  su membresía solo si la membresía existe únicamente por ese vínculo; `directory` no la cuenta para leer plantilla, sedes ni
  organizaciones hijas (`isSupportOnly`). Lo decide el **origen** de la membresía (`directory.tenant_memberships.origin_concept_id`,
  modelo v4.2.71; ver `directory`), que cada flujo escribe al crearla: la solicitud aprobada, la invitación de apoyo y el QR de
  apoyo abren la membresía con `MEMBERSHIP_ORIGIN_SUPPORT_ENGAGEMENT` (`ensureActiveStaffMembership`); el canje de la
  invitación o el QR de un doctor (`ensureActiveStaffMembership` / `ensurePendingStaffMembership`) la abre con
  `INVITATION_REDEEMED`. `SupportEngagementsRepository.syncSupportMembership` cierra o suspende **solo** las de origen
  `SUPPORT_ENGAGEMENT` (y no mientras quede un vínculo activo); con cualquier otro origen declarado (dueño, administrador,
  invitación de doctor) no toca la membresía. La heurística anterior —membresía anterior al primer vínculo (más de un minuto
  de diferencia), con sede principal o con asignación de sede activa— se conserva **solo** para las filas con origen `NULL`
  (anteriores a v4.2.71) o `UNKNOWN`. Un empleado STAFF normal al que se le da un vínculo de apoyo no cambia su origen y su
  membresía nunca se cierra al terminar el vínculo; en sentido contrario, si una membresía `SUPPORT_ENGAGEMENT` canjea después
  el QR de un doctor, pasa a `INVITATION_REDEEMED` y deja de ser de apoyo.
- **Canje de códigos**: un código multiuso (sin persona destino) NO afilia solo, sea de apoyo o de doctor. De apoyo deja una
  solicitud PENDIENTE (`requestId`, `pendingApproval: true`). De doctor deja la solicitud de afiliación que la organización
  ya resuelve en la pantalla «Médicos del centro»: una fila `PENDING` de `practice.practitioner_role_assignments` (rol de
  atención, sin servicio ni especialidad; práctica = la primera práctica activa de la organización por código; sede = la
  primera sede activa de esa práctica por código, o ninguna; creada por la cuenta del médico, así que figura «iniciada por el
  profesional»), más una membresía `directory.tenant_memberships.status = MEMBERSHIP_INVITED` que no cuenta para el token ni
  para las lecturas de la organización. Responde `{ kind: 'PRACTITIONER', tenantId, roleAssignmentId, pendingApproval: true }`.
  La organización la ve en `GET /practices/:practiceId/role-assignments` y la decide con
  `POST /role-assignments/:roleAssignmentId/approve|reject`; aprobar activa la membresía pendiente del médico en esa
  organización y rechazar la termina (salvo que conserve otra solicitud pendiente en la práctica). Pedir afiliarse exige un
  perfil profesional en la cuenta (412 `SUPPORT_PRACTITIONER_PROFILE_REQUIRED`) y una práctica activa en la organización (412
  `SUPPORT_AFFILIATION_PRACTICE_MISSING`, también al crear el código); en ambos casos el código no se gasta. Un segundo canje
  con otro código no apila filas: reutiliza la pendiente sin servicio de esa práctica. Quien ya es miembro activo no queda
  pendiente y recibe su `membershipId`. Un código de un solo uso atado a la persona afilia directo (decisión de
  producto vigente: un doctor se afilia automáticamente con un QR emitido por la organización para él en un solo uso; la
  persona de la cuenta sale del vínculo activo `PROF.ACCOUNT_LINK_ACTIVE`). El contador sube en SQL con `uses_count < max_uses`, la fila se
  bloquea durante el canje y un 23505 del único del modelo se informa como cualquier rechazo (422 opaco). Se revoca con
  `POST /org/affiliation-invitations/:id/revoke`.
- **Acceso clínico temporal**: lo pide la persona de apoyo (`POST /me/support-access-requests`), lo decide únicamente el
  doctor titular de la delegación (`POST /access-requests/:id/decision`), valida paciente y encuentro contra el tenant y no
  hay forma de saltarse la autorización (el alcance ya no es opcional). El doctor ve lo pendiente en
  `GET /me/practitioner/support-access-requests`. Permiso `CLINICAL_RECORD_TEMPORARY_VIEW`.
- **Política**: `loadFacts` exige membresía activa y recertificación al día (+15 días); el refresco de
  `effective_support_access` usa el mismo criterio; un doctor dado de baja o vencido deja de ser «doctor de la organización».
- **Permisos FIXED** congelan la lista real también con `ALL_*` (nunca una fila comodín); sin nada que congelar se rechaza.
- **Plantillas** se versionan (la editada se retira y nace la versión siguiente); **solicitudes**: quien pide no decide y hay
  un tope de 3 abiertas por persona y organización; el catálogo de la persona solo con vínculo activo o solicitud pendiente y
  vigente, sin perfil profesional ni sede interna del doctor.
- **Rutas sin tenant** (`@TenantAgnostic`): el sello de auditoría toma el tenant de la RESPUESTA (`@Audited({ tenantId:
'result.tenantId' })`), nunca del cuerpo; el canje y la solicitud fijan `app.current_tenant_id` (RLS) tras resolver la
  organización.
- **Mantenimiento** (`/delegated-access/support/*`): solo `SYSTEM`.
- **RLS en las lecturas `me/*`**: `me/support-activity` y `POST /me/support-engagements/:id/confirm` usan `withPersonScope`
  (el segundo lee la vista dentro de la organización del vínculo con `inTenant`; la bitácora, con `keyed`, acotada a la
  propia persona y a las organizaciones con vínculo VIVO: activo, vigente, con membresía activa y sin recertificación
  vencida). Las rutas de organización y de doctor leen con `em.fork({ keepTransactionContext: true })` para ver el
  contexto de la petición, y `SupportActivityRepository` ejecuta con `em.execute` (la lectura cruda por
  `getConnection().execute` no corre dentro de la transacción). Verificado como `mantra_app` sin BYPASSRLS en
  `test/integration/support-me-rls.int-spec.ts` (opt-in, `SUPPORT_RLS_TEST=1`). `me/support-engagements`, `me/support-catalog`, la bandeja de chat y `SupportAccessPolicy.can`/`evaluatorFor` (agenda) usan
  `withPersonScope` (`services/tenant-context.ts`): una transacción sin organización donde `ownRows` ubica filas de la propia
  persona, `inTenant` entra a UNA organización con vínculo vivo y `keyed` lee filas sin organización acotadas por llaves ya
  verificadas. Nunca se abre el contexto de sistema para todas las organizaciones. Sin RLS no cambia nada.

## Confirmación del vínculo por la persona

`POST /me/support-engagements/:id/confirm` (sin cuerpo; sesión, sin tenant activo). Es **solo una declaración** de la
persona de apoyo: «sigo trabajando aquí». El vínculo se busca por su propio `id` de persona (uno ajeno responde 404
`SUPPORT_ENGAGEMENT_NOT_FOUND`).

- **No renueva** el período, **no mueve** `next_recertification_at` y **no reactiva** nada; tampoco recalcula el
  acceso derivado. Solo deja el asiento de auditoría `SUPPORT_ENGAGEMENT_CONFIRMED_BY_PERSON`, sellado con la
  organización del vínculo (`result.tenantId`). Es idempotente: declarar de nuevo solo deja otro asiento.
- Funciona con el vínculo activo (también vencido dentro de los 15 días de gracia) y con el suspendido por
  `RECERTIFICATION_LAPSED`: en ese caso solo registra la declaración y el estado **sigue suspendido**.
- Terminado, expirado, suspendido por otra causa, con la vigencia vencida o con la membresía cerrada:
  422 `SUPPORT_ENGAGEMENT_NOT_ACTIVE`.
- Respuesta: el vínculo (`SupportEngagementViewDto`) tal cual está, más `declaredAt` (instante de la declaración) y
  `personConfirmedAt` con el mismo valor. Límite de 10 por minuto.
- **Renovar y reactivar es solo de la organización**: `POST /org/support-engagements/:id/recertify` (`SECURITY_ADMIN`
  del tenant) fija el período nuevo y, si el vínculo estaba suspendido por recertificación vencida, lo reactiva junto con
  sus delegaciones suspendidas y su membresía.
- La vista de vínculos (org y `me`) trae `personConfirmedAt` (la declaración más reciente de la persona, derivada del
  asiento, sin columna nueva) para que la organización vea quién declaró; `lastConfirmedAt`/`lastConfirmedBy` reflejan
  solo confirmaciones de la ORGANIZACIÓN (`lastConfirmedBy` siempre `ORGANIZATION`).

## Bitácora de actividad

Tres rutas, la misma forma de respuesta (`{ items, count, nextCursor }`) y los mismos filtros, y cada audiencia ve solo
lo suyo:

| Ruta                                    | Quién                       | Qué ve                                                                                          |
| --------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------- |
| `GET /org/support-activity`             | `SECURITY_ADMIN`            | Todo el personal de apoyo de la organización activa y los doctores de la organización.          |
| `GET /me/practitioner/support-activity` | `PRACTITIONER`, `CLINICIAN` | Lo que su equipo hizo sobre **su** agenda; lo hecho sobre la de otro doctor no figura.          |
| `GET /me/support-activity`              | la propia persona           | Solo lo suyo, en las organizaciones con vínculo vivo; el nombre de un doctor solo si la aceptó. |

Son asientos de la cadena de auditoría (`audit.audit_log`, WORM) cuyo autor es una persona con vínculo; no se escribe
nada nuevo. Filtros (todos opcionales): `person` (id o nombre completo, sin distinguir mayúsculas ni acentos), `userId`
(id, forma anterior), `doctor` (asignación de rol, perfil o nombre), `action` (código de la fila, p. ej.
`schedule.confirm` o `engagement.ended`, o el asiento crudo), `from`/`to` (`YYYY-MM-DD`: el día completo en hora de La
Paz, o un instante ISO), `tenantId` (solo `me/support-activity`; en las otras debe coincidir con la organización activa),
`limit` (1-200) y `cursor` (opaco, `instante|id`).

Cada fila: `id`, `tenantId`, `userId`, `personName` (= `actorName`), `action` (permiso `schedule.check_in` o evento
`engagement.ended`; un asiento no reconocido conserva el suyo), `auditAction` (el asiento tal cual), `permission`
(permiso de apoyo de las acciones de agenda), `entity`, `entityId`, `bookingId`, `appointmentId`,
`practitionerProfileId`, `practitionerRoleAssignmentId`, `practitionerName`, `summary`, `success`, `result`
(`SUCCESS`|`FAILURE`) y `createdAt` (= `occurredAt` = `recordedAt`). Nombres y doctor se resuelven en el servidor;
nunca hay datos clínicos ni el nombre de un paciente.

- El doctor de una fila sale de la reserva (agenda dueña del recurso), de la delegación o del permiso a los que apunta
  el asiento; lo que no se puede atribuir no lleva doctor. Hoy solo se atribuyen asientos de reservas/citas,
  delegaciones y permisos.
- Se recorre la bitácora por lotes de 200 hasta llenar la página (máximo 8 lotes), así que un filtro selectivo pagina
  bien; con un filtro muy selectivo una página puede venir incompleta con `nextCursor` para seguir.
- Los asientos de rutas sin tenant se sellan con la organización de la respuesta; la búsqueda de pacientes sella sus
  propios asientos con la organización verificada.
- Límite: solo figuran asientos de **autoría** de la persona de apoyo; lo que la administración hizo sobre ella
  (otorgar un permiso, terminar el vínculo) está en la cadena pero no se lista aquí.

## Formas de las vistas

- `GET /org/support-engagements`, `GET /me/support-engagements` y la respuesta de confirmar traen además `personName`,
  `organizationName`, `ownerKind`, `recertifyEveryMonths`, `lastActivityAt` (últimos 90 días), `suspendedAt` (la
  recertificación + 15 días, solo si está suspendido por eso), `lastConfirmedAt` (la recertificación vigente menos su
  período), `lastConfirmedBy` (`ORGANIZATION`) y `personConfirmedAt` (la última declaración de la persona).
- Las solicitudes traen `roleTemplateCode` (además de `roleTemplateId`), `requesterName`, `organizationName`,
  `createdAt`, `decisionReason` y, por ítem, `practitionerName`, `serviceName` y `locationName`. `status` es
  `PENDING`, `APPROVED`, `PARTIAL` (aprobada con algún ítem rechazado), `REJECTED`, `EXPIRED` o `CANCELLED`; el filtro
  `status` de `GET /org/support-engagement-requests` no acepta `PARTIAL`.
- `GET /me/practitioner/support-team`: cada integrante trae `personName`, `organizationName`, `roleTemplate` (= `roleTemplateCode`),
  `status` (`PENDING_ACCEPTANCE`, `ACTIVE` o `REVOKED`; una delegación suspendida o vencida figura `REVOKED`),
  `delegateStatus` (el de la delegación: `ACTIVE`, `SUSPENDED`, `REVOKED`, `EXPIRED`), `acceptedAt`, `mayReplyOnBehalf`,
  `replyDisclosure`, `actions`, `coverageSummary` (las primeras acciones en palabras), `lastActivityAt` y
  `pendingClinicalRequests` (`requestId`, `patientLabel` corto como «Juan P.», `reasonText`, `requestedAt`,
  `requestedHours` = 24, la vigencia que rige si el doctor no fija otra al aprobar).
