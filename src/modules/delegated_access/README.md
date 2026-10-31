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

## Gobierno de accesos (v4.2.72): permisos atómicos, condiciones y gobierno de usuarios

Contrato: `CONTRATO-GOBIERNO.md`. Decisiones de arquitectura:
[ADR-0029](../../../docs/adr/ADR-0029-atomos-sobre-authz-permissions-y-alias.md) (átomos sobre `authz.permissions` y alias)
y [ADR-0030](../../../docs/adr/ADR-0030-condiciones-abac-v1.md) (condiciones ABAC v1).

### Catálogo de permisos (73 átomos, 7 categorías)

Cada permiso es una fila de `authz.permissions` con id determinista (`seed:authz-permission:<código>`), categoría
(`authz.permission_categories`) y las columnas de gobierno: sensibilidad (`BAJA`, `MEDIA`, `ALTA`, `CRÍTICA`), motivo,
paso extra, aprobación (`DOCTOR` o `SECOND_APPROVER`), propósito de uso, base legal, ¿toca datos clínicos? y ¿asignable a
apoyo? Medido sobre `domain/support-permission-catalog.ts`:

| Módulo del código | Átomos |     | Sensibilidad | Átomos |
| ----------------- | -----: | --- | ------------ | -----: |
| `agenda.*`        |     20 |     | BAJA         |     11 |
| `team.*`          |     17 |     | MEDIA        |     27 |
| `patients.*`      |     11 |     | ALTA         |     29 |
| `messages.*`      |      9 |     | CRÍTICA      |      6 |
| `billing.*`       |      7 |     |              |        |
| `audit.*`         |      5 |     |              |        |
| `reports.*`       |      4 |     |              |        |

31 piden motivo, 14 piden paso extra y 10 piden aprobación. Los 15 códigos antiguos (`schedule.*`, `billing.collect`,
`patient.register`, …) siguen siendo filas de `authz.permissions` y **se leen siempre** como alias de su lista de átomos
(`domain/support-permission-catalog.ts`, `atomsOfAction`).

**Los alias no se expanden al escribir** (decisión 26, bloque B4a; contrato §2.3 regla 5 pedía expandir). Una concesión
creada con un código antiguo conserva su alias hasta que el administrador corra `POST /org/governance/normalize-legacy`
(con `dryRun: true` primero: lista las obligaciones nuevas y lo que se estrecha; con `false` crea los átomos y marca los
alias `superseded_at`; `…/revert` deshace el lote entero, y revertir un lote ya revertido responde 409
`NORMALIZE_BATCH_ALREADY_REVERTED`). Razón: expandir al guardar cambiaría en silencio lo que una persona ya hace, porque
los átomos traen obligaciones nuevas (motivo, paso extra, aprobación), y rompería la regla de no regresión AC-1 (las
suites anteriores pasan sin editarlas). Si una misma concesión trae el alias y el átomo, gana el átomo.

**Condiciones sobre alias (SEG A-A2).** Un permiso escrito con códigos antiguos **no admite condiciones**: guardar una
`condition` o `actionConditions` sobre un permiso `ALLOW` cuya lista de acciones incluya algún alias (también si lo mezcla
con átomos) responde 422 `CONDITION_NOT_APPLICABLE_TO_ATOM`. Quien necesite condicionarlo escribe los permisos
específicos (átomos) o corre `normalize-legacy` primero. Antes se aceptaba y el motor lo ignoraba en silencio: la pantalla
decía «solo en horario y red del hospital» y el permiso valía a cualquier hora. En el motor, si por SQL directo o por datos
antiguos llega una fila alias **con** condición, ahora **se evalúa** (falla cerrado: una condición no cumplida o
indeterminada niega); el alias **sin** condición no cambia (sigue sin obligaciones nuevas y sin condiciones propias, y las
reglas `REQUIRE_CONDITION` de la organización lo alcanzan igual). Una prohibición (`DENY`) con alias sí admite condición
(el motor ya la evaluaba para cualquier origen). Ver [ADR-0029](../../../docs/adr/ADR-0029-atomos-sobre-authz-permissions-y-alias.md).

### Condiciones ABAC v1

`condition_json` (de la concesión o de un átomo) es un objeto con `schemaVersion: 1`. Claves: `time` (ventanas por día y
hora, zona), `limits` (contadores diarios, por hora o por pacientes distintos), `patients` (alcance, ventana de citas, edad,
menores, cobertura, banderas, exclusiones), `appointment` (ventana, anticipación mínima con `DENY` o `REQUIRE_APPROVAL`,
horizonte), `channels`, `fields` (máscaras `PARTIAL`, `REDACT`, `NULLIFY`), `amount` (BOB, tope por operación y por día),
`session`, `network` (`ORG_RULES` usa las reglas de `authz.ip_access_rules`), `device`, `presence` y `obligations`
(motivo, paso extra con `maxAgeMinutes`, aprobación con `by` y `ttlMinutes`); `delegationCeiling` solo en plantillas.
Se evalúan con lógica de tres valores (`T`, `F`, `I`): un dato que falta es `I` y `I` nunca permite. Orden de capas:
barandillas de plataforma → reglas de la organización (`governance_rules`: `DENY_PERMISSION`, `CEILING`,
`REQUIRE_CONDITION`, `FIELD_FLOOR`) → `DENY` explícito → `ALLOW` con sus condiciones. Los rechazos al guardar llevan códigos
`CONDITION_*` estables. Una solicitud de vínculo (`/support-engagement-requests`) acepta átomos o alias; la condición la fija
quien decide (`condition` en la decisión o en su ajuste) y pasa por el mismo guardián de escritura que `POST …/grants`.

**Dispositivo (SEG A-M5).** `device.knownOnly` solo protege con la cookie de dispositivo firmada
(`AUTH_DEVICE_COOKIE_ENABLED=true`): sin ella la huella es User-Agent + SO, no autentica a nadie y un equipo nuevo nace
«de confianza» (sin alerta de dispositivo nuevo). Por eso, con la cookie apagada, guardar `device.knownOnly: true` se
rechaza (422 `CONDITION_VALUE_INVALID`, ruta `device.knownOnly`) y el motor trata el dispositivo como no conocido
(`DEVICE_NOT_TRUSTED`, falla cerrado) si una fila así ya existía. Para que la condición proteja, además conviene activar
`new_device_alert` en la política de sesión de la organización. Limitación que sigue vigente aun con la cookie: una cookie
robada junto con la sesión es indistinguible del equipo real.

**Banderas de pacientes (SEG A-M6, D-12).** Una bandera `VIP`/`CONFIDENTIAL` solo actúa si algún permiso o regla la nombra.
Los permisos de plantilla v2 NUEVOS (`default_conditions_json`, sembrados al arrancar) traen `patients.exclude.flags:
['VIP','CONFIDENTIAL']` en `agenda.appointment.cancel` y `agenda.appointment.view.reason`; los permisos ya concedidos no
cambian. `GET/PUT /org/patients/:id/restriction-flags` ya no distingue «existe» de «no existe»: la administración de
cualquier organización recibe 404 uniforme salvo que el paciente tenga relación con ESTA organización (cita, representación,
equipo asistencial, banderas previas o registrado por su personal).

**Aislamiento de vínculos y delegaciones (SEG A-M1, modelo v4.2.73).** `organization_user_assignments` y
`practitioner_delegate_assignments` llevan `tenant_id` (FK, índice, disparador `integrity.support_tenant_consistency` y RLS
`tenant_isolation`): con el contexto de otra organización `mantra_app` ya no las ve ni las actualiza. `POST
/org/:tenantMembershipId/user-assignments` y `PATCH /org/user-assignments/:id` resuelven la membresía, cada nodo de alcance
(práctica, sede, unidad, espacio, unidad de diagnóstico, farmacia), el supervisor y la asignación **dentro de la organización del
contexto** antes de escribir: un id ajeno responde 404 uniforme (`DELEGATED_MEMBERSHIP_NOT_FOUND`,
`DELEGATED_SCOPE_NODE_NOT_FOUND`, `DELEGATED_ORG_ASSIGNMENT_NOT_FOUND`), igual que uno inexistente. `POST
/access-requests/:id/decision` ya no responde 412 «no está abierta» a una solicitud de otra organización (ahora 404). Los
INSERT de `organization_user_assignments` y `practitioner_delegate_assignments` deben mandar `tenantId` (del contexto, nunca del
cuerpo). Quedan SIN `tenant_id` (por ser de `practice` y `community`, con decenas de puntos de escritura) `care_spaces`,
`healthcare_services`, `practitioner_role_assignments` y `community.direct_messages`: su aislamiento depende de que cada consulta
filtre por tenant (los servicios de `delegated_access` las acotan por su práctica); ver el informe de la ronda 1.

**Traspaso, certificación y barridos (SEG B-B2/B-B3/B-B6/B-B9/B-B10/B-B12/A-B4).** Las reasignaciones del traspaso solo tocan una
fila que sigue siendo de la organización, de quien se fue y no está resuelta (no pisan lo que otra persona ya recibió ni reabren
una conversación resuelta). Decidir un ítem de revisión lo bloquea (`FOR UPDATE`); un ítem de vínculo se anota ANTES de ejecutar
su efecto (si falla, se deshace) y certificar una concesión solo mueve `last_certified_at` del vínculo cuando no queda ningún
ítem suyo sin decidir en la campaña. `PUT /org/patients/:id/restriction-flags` pide, para quitar una bandera o acortar su fin,
ser el doctor titular o `SECURITY_ADMIN`, `removalReason` (≥ 10 caracteres) y el paso extra (`STEP_UP_REQUIRED`); el asiento guarda
solo el largo y la huella del motivo (403 `RESTRICTION_FLAG_REMOVAL_FORBIDDEN`). `GET /org/access-reviews/campaigns/:id/export`
exige `reasonCode` (código, no texto; 422 `EXPORT_REASON_REQUIRED`) y el paso extra; las dos exportaciones llevan `@Throttle`
(5/min) y los `filters` del informe se reducen a `by`, `group`, `id` y `days` válidos. `governance-sweep` y `anomaly-scan` toman un
cerrojo de la base: un disparo simultáneo responde `counts.skippedBusy = 1` sin hacer nada. `POST /iam/me/step-up` serializa
por persona el contador de intentos y el consumo del código (ráfaga paralela).

**Explicar (SEG A-B7/B-B4).** `POST /org/access/explain`, `/me/support-access/explain` y los escenarios de `simulate`
validan `patientProfileId` contra la organización: un paciente sin relación responde 404 uniforme (igual que un doctor o
espacio ajeno), así que `unmet` ya no sirve de oráculo de edad, cobertura o banderas. El `simulationToken` va firmado con
HMAC-SHA256 (clave derivada del secreto de la API con separación de dominio) e incluye el instante de emisión (SEG B-B5).

**Bandeja de mensajes (SEG A-A3/A-A4).** Leer la bandeja pasa por la misma decisión que responder en nombre del doctor,
con el paciente de cada conversación: las condiciones del permiso (horario, red, sesión, dispositivo, topes) y la exclusión
de pacientes (VIP, confidencial, banderas, edad, cobertura) ocultan la conversación al LISTAR y responden 404 uniforme al
ABRIRLA; un desafío (motivo, paso extra, aprobación) no la oculta. Abrir una conversación sella un asiento de acceso por
paciente (`audit.data_access_log`, recurso `SUPPORT_INBOX`, sin texto). La vista previa de la lista es **solo metadatos**
(quién, cuándo, plazo, estado; `previewHidden: true`) salvo que quien escribe sea paciente de la agenda del doctor (tiene
una cita con él en la organización); aun así un texto que parezca clínico sale como «Contenido clínico oculto».
**SEG V-2 (ronda 2):** la vista previa ya NO se abre con el estado de la conversación (`TAKEN`/`RESOLVED`): lo fija la
propia persona de apoyo con una llamada, así que no es una señal. `GET /me/support-inbox/:id` aplica la MISMA señal al texto:
los mensajes de quien no es paciente de la agenda del doctor salen como «Contenido clínico oculto» (`contentHidden: true`,
metadatos intactos) salvo con acceso clínico temporal `APPROVED` (aprobado por el doctor); lo que escribió el equipo en nombre
del doctor se lee. **Decisión de producto abierta:** una marca administrativa fijada por el DOCTOR (o su derivación
explícita) que habilite la lectura de quien no es paciente de la agenda; no existe ese campo en el modelo y no se inventó.
Mientras tanto, esas conversaciones se leen solo con acceso clínico temporal aprobado. La lista de palabras clínicas
(diagnósticos, oncología, VIH, salud mental, salud sexual y reproductiva, procedimientos, medicamentos, inglés, portugués y
quechua básico) normaliza con NFKC, quita caracteres de formato (`\p{Cf}`: ancho cero, guion blando, marcas de dirección) y
marcas combinantes, pliega homoglifos cirílicos/griegos/versalitas a latín, colapsa espacios (incluidos los no separables y
los saltos de línea), mira la versión sin separadores colados (`can-cer`, `c.a.n.c.e.r`) y los tramos de letras sueltas
(`c a n c e r`), además de sustituciones tipo `c4ncer` y letras repetidas. **No es una frontera de seguridad por sí sola:**
una palabra partida por un espacio entre sílabas, otro idioma o una paráfrasis pasan; la barrera real es la señal de arriba.

**Caché de reglas L1 (SEG A-M8).** `SUPPORT_GOVERNANCE_RULES_CACHE_TTL_SEC` tiene tope de 60 s (valores mayores valen 60); si la
base falla se sirve la última lista conocida hasta 300 s y después el error sale (falla cerrado); quien escribe una regla
publica en el canal Redis `delegated_access:governance_rules:invalidate` y las demás réplicas descartan su caché. **La
invalidación sale DESPUÉS del commit real (V-4):** con `RLS_ENFORCE=true` la petición ya corre en una transacción y el
`transactional` de `GovernanceRulesService` es un savepoint, así que `afterCommit` (`governance-after-commit.ts`) espera el
commit de la transacción RAÍZ (y también su rollback: la caché pudo guardar lo no confirmado); sin transacción alrededor
invalida al instante. Sin Redis, el TTL acotado es el respaldo (peor caso: 60 s entre réplicas).

**Redis de producción: privado y autenticado (N-4).** Por Redis viajan el aviso de invalidación de reglas (quien alcance el canal
puede vaciar la caché de todas las réplicas: degradación, no baja la protección) y el sello del paso extra (`stepup:<sid>`: quien
lo escriba para una sesión cuyo `sid` conozca, p. ej. con un token robado, se salta el segundo factor). En producción Redis debe
estar en la red interna y con contraseña (`REDIS_PASSWORD`; los `docker-compose*.yml` la aplican como `requirepass` cuando está
definida y la API la lee tal cual); el compose de desarrollo solo publica el puerto en `127.0.0.1`.

**Contexto de tenant en transacciones anidadas (N-5).** `set_config(..., true)` no se revierte al liberar un savepoint: dentro de
una petición con RLS, `SupportAccessPolicy.can/evaluatorFor` (sin `em`), `inTenantTransaction` y `inTenantTransaction` de
barridos usan `withTenantContext`, que devuelve el contexto previo (también si falla). Ya no puede quedar la petición bajo el
RLS de otra organización.

**Administración delegada, campañas y cuatro ojos (SEG B-A1/B-A2/B-A3/B-M1…B-M7/B-B7/B-B8/A-A5/A-M2/A-M7).**

- *Una sola función de administración (A-A5).* `liveAdminAtoms` (dominio) decide qué átomos de administración tiene hoy una persona
  y la usan `/org/team/*` (`SupportAdminDirectory.delegatedAdminOf`), las rutas de gobierno (`GovernanceAccessGate`,
  `GovernanceAccessService`: resumen, efectivo, explicar, reportes, campañas, exportaciones) y la elegibilidad del jefe de
  servicio en cuatro ojos (`ApproverDirectoryBuilder`): exige el vínculo vivo (activo, membresía viva, recertificación al día:
  suspendido o vencido ya no lee ni aprueba), solo concesiones `ALLOW` vivas, descuenta una `DENY` explícita que se cruce y las
  reglas L1 `DENY_PERMISSION` (de la plantilla o de todas). En `team.*`, `audit.*` (decisiones, informes y, desde la ronda 2
  —N-8—, también `audit.activity.*`) y `reports.*` el validador rechaza toda condición que no sea `delegationCeiling` (solo en
  `team.*`; 422 `CONDITION_NOT_APPLICABLE_TO_ATOM`): ninguna de esas rutas las evalúa, y se aceptarán cuando exista un consumidor
  (`isUnevaluatedConditionAtom`). `actionConditions` tiene tope de claves (las del catálogo) y corta en el primer error
  (`checkActionConditionKeys`: 422 `CONDITION_TOO_LARGE` o `CONDITION_NOT_APPLICABLE_TO_ATOM`).
- *Campañas (B-A1).* Un delegado con `team.campaigns.manage` solo ve y gobierna SUS campañas (`ownerUserId`): lista, ver,
  resultados, ítems, editar, lanzar, cerrar y cancelar una ajena responden 404 `REVIEW_CAMPAIGN_NOT_FOUND`. Su cierre manual no se
  adelanta a los revisores (409 `REVIEW_CAMPAIGN_NOT_DUE` antes de `fecha + gracia`) y sus campañas piden fecha ≥ 7 días y gracia ≥ 3
  (422 `REVIEW_SCHEDULE_TOO_SHORT`; `REVIEW_DEFAULTS.delegateMin*`). **Sin `team.grants.revoke` (N-9) un delegado no obtiene
  revocación por vencimiento:** lo que no indica en `uncertifiedAction` queda en `UNCERTIFIED_ESCALATE`, pedir
  `UNCERTIFIED_REVOKE` al crear o editar es 403 `ADMIN_CEILING_EXCEEDED` (`details.breach: AUTO_REVOKE`) y un borrador que ya quedó
  en revocar no se lanza si perdió el átomo. El administrador de seguridad conserva su libertad. El ajuste
  de un revisor pasa por `validateCondition` (B-M6). Si el responsable es un delegado ya no es el revisor único: se agregan los
  `SECURITY_ADMIN`, y un delegado no certifica a otro administrador (GP-6, B-B8).
- *Editar permisos (B-A2, B-M1).* Un delegado mide alcance y techo con lo que la concesión cubrirá DESPUÉS (`FIXED` → `DYNAMIC`
  suelta la foto: 403 `ADMIN_SCOPE_EXCEEDED` si ya no cabe), no quita ni edita una prohibición `DENY` (403
  `ADMIN_CEILING_EXCEEDED`, `breach: DENY_GRANT`) y no quita ni afloja condiciones (`breach: CONDITION_LOOSENED`; solo agrega).
  Decidir una solicitud: el techo se mide sobre lo que realmente se emite (`emissionOf`, la misma función que `emitGrant`, B-A3) y un
  delegado no decide la solicitud de otro administrador (GP-6, B-B7).
- *Paso extra en todas las rutas (B-M2/A-M2).* Otorgar o ampliar pide `STEP_UP_REQUIRED` por `POST/PATCH
  /org/support-engagements/:id/grants`, `POST/PATCH /org/team/members/:id/grants` y al aprobar o ajustar una solicitud (por
  `/org/support-engagement-requests/:id/decision` o `/org/team/requests/:id/decision`). Quitar o rechazar y las prohibiciones
  (`DENY`) no lo piden: reducen acceso.
- *Cuatro ojos del servidor (B-M3, D-11; ampliado en la ronda 2: V-3, N-1, N-2).* Agregar a una persona un átomo de sensibilidad
  CRÍTICA que no tenía, **o ampliar uno que ya tenía** (alta o edición), no escribe nada: crea un `GRANT_CHANGE` (segundo
  `SECURITY_ADMIN` ≠ quien pide ≠ la persona; 7 días) y responde **202**
  `{ status: 'PENDING_APPROVAL', approvalId, expiresAt, reasons, criticalAtoms }`. Lo ya concedido se mide por (átomo, objetivo,
  vigencia), no por el nombre del átomo (`criticalApprovalNeed`, dominio; mismo `targetWithin` que la administración delegada):
  `reasons` puede traer `NEW_CRITICAL_ATOMS` (átomo nuevo), `SCOPE_WIDENED` (objetivo que ningún permiso vivo con ese átomo
  contiene: de una agenda a toda la organización, otro doctor, `FIXED` → `DYNAMIC` por `PATCH expansionMode`) y
  `VALIDITY_EXTENDED` (vigencia mayor que la de todo permiso que lo cubre, incluido quitar el fin). La cobertura y la vigencia
  deben venir del MISMO permiso; un objetivo que no se puede probar «dentro» (p. ej. `FIXED` sin foto) cuenta como ampliación.
  Reducir alcance o vigencia, o editar solo condiciones, no pide aprobación. Quien aprueba (`GET /approvals/pending`) ve
  `details` (`GrantChangeDetailsDto`): TODOS los átomos con los críticos marcados, el objetivo por nombre (doctor, servicio,
  espacio), `validFrom`/`validTo`, `expansionMode`, las condiciones en lenguaje simple y, en una edición, qué campos cambian;
  sin datos de pacientes (`GrantChangeExecutor.describe` → `SupportEngagementsService.describeGrantChanges`). Al aprobar,
  `GrantChangeExecutor` corre en la transacción de la aprobación y vuelve a validar todo (barandillas, SoD, condiciones, versión
  del vínculo y, **N-2, a quien pidió**: sigue siendo administrador de seguridad con membresía viva —o de plataforma, o
  delegado con `team.grants.assign`, su alcance, su techo y sin aflojar condiciones—; si no vale, 409
  `FOUR_EYES_PAYLOAD_INVALID` y la solicitud sigue pendiente para rechazarla). Con un solo administrador de seguridad (o si el otro es la persona afectada) no se habilitan átomos
  CRÍTICA: 422 `FOUR_EYES_NO_APPROVER` (regla D-11; el resto de la organización sigue funcionando). Una solicitud de vínculo no
  otorga átomos CRÍTICA al decidirse (422 `FOUR_EYES_REQUEST_INVALID`, `details.criticalAtoms`): se aprueba sin ellos y se
  otorgan aparte. «Sobre el techo» sigue siendo un 403 duro para un delegado (§6.4: no hay aprobación que lo salte).
- *Mover (B-M4).* Además del puntaje (> 10 puntos, átomo ALTA nuevo) pide cuatro ojos ampliar a «todos» con los mismos átomos
  (`SCOPE_WIDENED`), quitar o aflojar condiciones (`CONDITIONS_REMOVED`) o vigencia (`VALIDITY_REMOVED`) de un permiso que sigue
  existiendo y borrar una prohibición (`DENY_REMOVED`); aparecen en `fourEyesReasons`.
- *Ingreso (B-M5).* `CONFIDENTIALITY_ACK` solo lo acepta la propia persona (`POST /me/support-engagements/:id/confidentiality-ack`);
  `POST /org/lifecycle/cases/:id/checklist/CONFIDENTIALITY_ACK` responde 409 `LIFECYCLE_ITEM_AUTOMATIC`.
- *Cola de aprobaciones (B-M7, N-3).* Una persona tiene como máximo 10 solicitudes de acción pendientes **y vigentes** (409
  `FOUR_EYES_TOO_MANY_PENDING`): lo vencido —sigue `PENDING` hasta el barrido diario— y las solicitudes administrativas
  (`GRANT_CHANGE`, `REACTIVATION`…) no cuentan. «Contar y crear» es atómico: se toma antes un `pg_advisory_xact_lock` por
  organización y solicitante (`FourEyesRepository.lockRequesterQueue`). `GET /approvals/pending` pagina (`limit` 1-100, 50 por defecto; `cursor`/`nextCursor`), pide a SQL solo lo
  vigente y ajeno y arma el directorio de aprobadores una vez por agenda.
- *Plantillas propias (A-M7).* GP-2 no se relaja creando una plantilla: la propia hereda el techo de plataforma MÁS restrictivo que
  cubre sus acciones por defecto (se guarda en `ceiling_actions_json`; sin él, o sin acciones legibles, rige lo común a todas las de
  plataforma) y `SupportGrantWriteGuard` lo aplica al escribir. Aún no lo aplican `simulate`, `explain` ni el barrido de
  «sobre el techo», que siguen sin techo para plantillas propias.

### Gobierno de usuarios

- **Compuerta de ingreso** (D-03): un vínculo nuevo no opera hasta completar identidad verificada, compromiso de
  confidencialidad, dueño de cuenta y paso extra; `practice_settings['support.governance']` la enciende
  (`onboardingRequired`, `onboardingRequiredSince`). Los vínculos que existían al aplicar el parche quedan como completos.
- **Cambio de rol** (`POST /org/support-engagements/:id/move`): el conjunto nuevo es completo; si lleva `simulationToken`
  (de `POST /org/access/simulate` con `mode: 'REPLACE'`, la misma plantilla y el mismo conjunto) y lo movido no es lo
  simulado, o pasaron 10 minutos, responde 409 `SIMULATION_STALE`. La campaña `MOVER` que abre revisa cada concesión nueva:
  la de un doctor, ese doctor; el resto, el dueño de la cuenta; sin dueño, un administrador (`ReviewerResolverService`).
- **Baja con traspaso, suspensión y reactivación** (cuatro ojos): una sola suspensión para todos los caminos
  (`EngagementSuspensionService`; el barrido por inactividad delega en `suspendSystem`).
- **Cuentas sin dueño** (`GET /org/governance/ownerless`): sin dueño, o con un dueño que ya no es elegible.
- **Campañas de certificación**, SoD (11 reglas de plataforma, excepciones con cuatro ojos), reglas de la organización,
  informes y exportación (el asiento de una exportación guarda solo el código del motivo, su longitud y su huella SHA-256,
  nunca el texto) y administración delegada con techo (`/org/team/*`, `TeamAdminPolicy`; un delegado también pide
  excepciones SoD dentro de su alcance con `team.sod.exception.request`).
- **Auditoría**: `SUPPORT_GRANT_DENY_CREATED` y `SUPPORT_GRANT_CONDITIONS_UPDATED` se sellan además del asiento genérico de
  la ruta. `access_decision_log` guarda razón, concesión y aprobación de cada decisión ≥ ALTA y de todo `DENY`/`CHALLENGE`
  (también el rechazo de una regla de la organización al buscar o registrar pacientes).

### Rutas nuevas (medidas)

<!-- Medido el 2026-11-02 sobre el árbol de trabajo: 84 operaciones nuevas (29 de reglas, SoD, cuatro ojos, explicar y
catálogo; 27 de campañas, informes y barridos; 26 del ciclo de vida y la administración delegada; 2 del paso extra).
Repetir con el script de la sección anterior sobre estos controllers y `iam-step-up.controller.ts`. -->

| Método y ruta                                             | Acceso                                                 | Controller                  |
| --------------------------------------------------------- | ------------------------------------------------------ | --------------------------- |
| `GET /org/permission-catalog`                             | SECURITY_ADMIN, SUPPORT_STAFF                          | `access-catalog`            |
| `GET /org/support-engagements/:id/summary`                | SECURITY_ADMIN, SUPPORT_STAFF                          | `access-catalog`            |
| `GET /org/support-engagements/:id/effective`              | SECURITY_ADMIN, SUPPORT_STAFF                          | `access-catalog`            |
| `POST /org/access/explain`                                | SECURITY_ADMIN, SUPPORT_STAFF                          | `access-explain`            |
| `POST /org/access/simulate`                               | SECURITY_ADMIN, SUPPORT_STAFF                          | `access-explain`            |
| `POST /me/support-access/explain`                         | sesión                                                 | `access-explain`            |
| `POST /me/practitioner/support-team/explain`              | PRACTITIONER, CLINICIAN                                | `access-explain`            |
| `POST /me/support-approvals`                              | sesión                                                 | `four-eyes`                 |
| `GET /me/support-approvals`                               | sesión                                                 | `four-eyes`                 |
| `POST /me/support-approvals/:id/cancel`                   | sesión                                                 | `four-eyes`                 |
| `GET /approvals/pending`                                  | SECURITY_ADMIN, PRACTITIONER, CLINICIAN, SUPPORT_STAFF | `four-eyes`                 |
| `POST /approvals/:id/decision`                            | SECURITY_ADMIN, PRACTITIONER, CLINICIAN, SUPPORT_STAFF | `four-eyes`                 |
| `GET /org/governance/rules`                               | SECURITY_ADMIN                                         | `governance-rules`          |
| `POST /org/governance/rules`                              | SECURITY_ADMIN                                         | `governance-rules`          |
| `PATCH /org/governance/rules/:id`                         | SECURITY_ADMIN                                         | `governance-rules`          |
| `POST /org/governance/rules/:id/retire`                   | SECURITY_ADMIN                                         | `governance-rules`          |
| `GET /org/governance/settings`                            | SECURITY_ADMIN                                         | `governance-rules`          |
| `PUT /org/governance/settings`                            | SECURITY_ADMIN                                         | `governance-rules`          |
| `POST /org/governance/normalize-legacy`                   | SECURITY_ADMIN                                         | `governance-rules`          |
| `POST /org/governance/normalize-legacy/revert`            | SECURITY_ADMIN                                         | `governance-rules`          |
| `GET /org/governance/sod-rules`                           | SECURITY_ADMIN, SUPPORT_STAFF                          | `governance-sod`            |
| `POST /org/governance/sod-rules`                          | SECURITY_ADMIN                                         | `governance-sod`            |
| `PATCH /org/governance/sod-rules/:id`                     | SECURITY_ADMIN                                         | `governance-sod`            |
| `GET /org/governance/sod-findings`                        | SECURITY_ADMIN, SUPPORT_STAFF                          | `governance-sod`            |
| `GET /org/governance/sod-exceptions`                      | SECURITY_ADMIN, SUPPORT_STAFF                          | `governance-sod`            |
| `POST /org/governance/sod-exceptions`                     | SECURITY_ADMIN, SUPPORT_STAFF                          | `governance-sod`            |
| `POST /org/governance/sod-exceptions/:id/revoke`          | SECURITY_ADMIN                                         | `governance-sod`            |
| `GET /org/patients/:patientProfileId/restriction-flags`   | SECURITY_ADMIN, PRACTITIONER, CLINICIAN                | `patient-restriction-flags` |
| `PUT /org/patients/:patientProfileId/restriction-flags`   | SECURITY_ADMIN, PRACTITIONER, CLINICIAN                | `patient-restriction-flags` |
| `GET /org/access-reviews/campaigns`                       | SECURITY_ADMIN, SUPPORT_STAFF                          | `access-reviews`            |
| `POST /org/access-reviews/campaigns/preview`              | SECURITY_ADMIN, SUPPORT_STAFF                          | `access-reviews`            |
| `POST /org/access-reviews/campaigns`                      | SECURITY_ADMIN, SUPPORT_STAFF                          | `access-reviews`            |
| `GET /org/access-reviews/campaigns/:id`                   | SECURITY_ADMIN, SUPPORT_STAFF                          | `access-reviews`            |
| `PATCH /org/access-reviews/campaigns/:id`                 | SECURITY_ADMIN, SUPPORT_STAFF                          | `access-reviews`            |
| `POST /org/access-reviews/campaigns/:id/launch`           | SECURITY_ADMIN, SUPPORT_STAFF                          | `access-reviews`            |
| `POST /org/access-reviews/campaigns/:id/close`            | SECURITY_ADMIN, SUPPORT_STAFF                          | `access-reviews`            |
| `POST /org/access-reviews/campaigns/:id/cancel`           | SECURITY_ADMIN, SUPPORT_STAFF                          | `access-reviews`            |
| `GET /org/access-reviews/campaigns/:id/items`             | SECURITY_ADMIN, SUPPORT_STAFF                          | `access-reviews`            |
| `GET /org/access-reviews/campaigns/:id/results`           | SECURITY_ADMIN, SUPPORT_STAFF                          | `access-reviews`            |
| `GET /org/access-reviews/campaigns/:id/export`            | SECURITY_ADMIN                                         | `access-reviews`            |
| `GET /me/access-reviews/items`                            | SECURITY_ADMIN, PRACTITIONER, CLINICIAN, SUPPORT_STAFF | `access-reviews`            |
| `POST /me/access-reviews/items/bulk-decision`             | SECURITY_ADMIN, PRACTITIONER, CLINICIAN, SUPPORT_STAFF | `access-reviews`            |
| `GET /me/access-reviews/items/:id`                        | SECURITY_ADMIN, PRACTITIONER, CLINICIAN, SUPPORT_STAFF | `access-reviews`            |
| `POST /me/access-reviews/items/:id/decision`              | SECURITY_ADMIN, PRACTITIONER, CLINICIAN, SUPPORT_STAFF | `access-reviews`            |
| `GET /org/governance/summary`                             | SECURITY_ADMIN, SUPPORT_STAFF                          | `governance-reports`        |
| `GET /org/governance/access-matrix`                       | SECURITY_ADMIN, SUPPORT_STAFF                          | `governance-reports`        |
| `GET /org/governance/privilege-creep`                     | SECURITY_ADMIN, SUPPORT_STAFF                          | `governance-reports`        |
| `GET /org/governance/unused-access`                       | SECURITY_ADMIN, SUPPORT_STAFF                          | `governance-reports`        |
| `GET /org/governance/ownerless`                           | SECURITY_ADMIN, SUPPORT_STAFF                          | `governance-reports`        |
| `GET /org/governance/exceptions`                          | SECURITY_ADMIN, SUPPORT_STAFF                          | `governance-reports`        |
| `GET /org/governance/anomalies`                           | SECURITY_ADMIN, SUPPORT_STAFF                          | `governance-reports`        |
| `POST /org/governance/anomalies/:id/ack`                  | SECURITY_ADMIN, SUPPORT_STAFF                          | `governance-reports`        |
| `POST /org/governance/reports/:kind/export`               | SECURITY_ADMIN, SUPPORT_STAFF                          | `governance-reports`        |
| `GET /me/practitioner/governance-panel`                   | PRACTITIONER, CLINICIAN                                | `governance-reports`        |
| `POST /delegated-access/support/governance-sweep`         | SYSTEM                                                 | `governance-sweep`          |
| `POST /delegated-access/support/anomaly-scan`             | SYSTEM                                                 | `governance-sweep`          |
| `GET /org/lifecycle/cases`                                | SECURITY_ADMIN, SUPPORT_STAFF                          | `support-lifecycle`         |
| `GET /org/lifecycle/cases/:id`                            | SECURITY_ADMIN, SUPPORT_STAFF                          | `support-lifecycle`         |
| `POST /org/lifecycle/cases/:id/checklist/:code`           | SECURITY_ADMIN, SUPPORT_STAFF                          | `support-lifecycle`         |
| `POST /org/lifecycle/cases/:id/handover/assign`           | SECURITY_ADMIN, SUPPORT_STAFF                          | `support-lifecycle`         |
| `GET /org/lifecycle/cases/:id/export`                     | SECURITY_ADMIN                                         | `support-lifecycle`         |
| `POST /org/support-engagements/:id/identity-verification` | SECURITY_ADMIN                                         | `support-lifecycle`         |
| `PUT /org/support-engagements/:id/owner`                  | SECURITY_ADMIN                                         | `support-lifecycle`         |
| `POST /me/support-engagements/:id/confidentiality-ack`    | sesión                                                 | `support-lifecycle`         |
| `POST /org/support-engagements/:id/move`                  | SECURITY_ADMIN                                         | `support-lifecycle`         |
| `GET /org/support-engagements/:id/handover-preview`       | SECURITY_ADMIN                                         | `support-lifecycle`         |
| `POST /org/support-engagements/:id/offboard`              | SECURITY_ADMIN                                         | `support-lifecycle`         |
| `POST /org/support-engagements/:id/suspend`               | SECURITY_ADMIN                                         | `support-lifecycle`         |
| `POST /org/support-engagements/:id/reactivate`            | SECURITY_ADMIN                                         | `support-lifecycle`         |
| `GET /org/team/capabilities`                              | SECURITY_ADMIN, SUPPORT_STAFF                          | `team-admin`                |
| `GET /org/team/members`                                   | SECURITY_ADMIN, SUPPORT_STAFF                          | `team-admin`                |
| `GET /org/team/members/:id`                               | SECURITY_ADMIN, SUPPORT_STAFF                          | `team-admin`                |
| `POST /org/team/members/:id/grants`                       | SECURITY_ADMIN, SUPPORT_STAFF                          | `team-admin`                |
| `PATCH /org/team/members/:id/grants`                      | SECURITY_ADMIN, SUPPORT_STAFF                          | `team-admin`                |
| `POST /org/team/members/:id/recertify`                    | SECURITY_ADMIN, SUPPORT_STAFF                          | `team-admin`                |
| `POST /org/team/members/:id/suspend`                      | SECURITY_ADMIN, SUPPORT_STAFF                          | `team-admin`                |
| `POST /org/team/members/:id/reactivate`                   | SECURITY_ADMIN, SUPPORT_STAFF                          | `team-admin`                |
| `POST /org/team/members/:id/offboard`                     | SECURITY_ADMIN, SUPPORT_STAFF                          | `team-admin`                |
| `GET /org/team/members/:id/handover-preview`              | SECURITY_ADMIN, SUPPORT_STAFF                          | `team-admin`                |
| `POST /org/team/invitations`                              | SECURITY_ADMIN, SUPPORT_STAFF                          | `team-admin`                |
| `GET /org/team/requests`                                  | SECURITY_ADMIN, SUPPORT_STAFF                          | `team-admin`                |
| `POST /org/team/requests/:id/decision`                    | SECURITY_ADMIN, SUPPORT_STAFF                          | `team-admin`                |
| `POST /iam/me/step-up`                                    | sesión (sin tenant)                                    | `iam-step-up`               |
| `GET /iam/me/step-up`                                     | sesión (sin tenant)                                    | `iam-step-up`               |

Medido ese día en `src/modules/delegated_access`: 21 controllers con 128 decoradores de ruta, 25 entidades y 46 servicios.
