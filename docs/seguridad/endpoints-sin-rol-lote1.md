# Endpoints sin rol declarado — lote 1 (community, profiles, directory, insurance)

Tarea O3-3 / hallazgo H-1. Cubre las filas del Anexo A del plan de producción para los módulos
`community`, `profiles`, `directory` e `insurance` (115 endpoints), más los que el informe
`tools/alovida/coverage-report.mjs` marcaba como `ORPHAN_ENDPOINT` en esos módulos sin estar en el
Anexo y sus hermanos de controlador con la misma regla (10 rutas). Base: `origin/dev` en `78dd3646`.

## Cómo autoriza esta API

- `AuthModule` registra cuatro `APP_GUARD` en orden: `JwtAuthGuard` (toda ruta exige token salvo
  `@Public()`), `TenantScopeGuard` (resuelve el tenant; un actor ordinario sólo puede declarar un
  tenant del que es miembro), `RolesGuard` y `VerifiedIdentityGuard`.
- `RolesGuard` lee `@Roles(...)` del método o de la clase. **Sin metadato o con `@Roles()` vacío
  deja pasar a cualquier sesión autenticada**: no hay diferencia de comportamiento entre las dos
  formas. `TenantScopeGuard` y `TenantContextInterceptor` también leen `ROLES_KEY`, sólo para
  `isPlatformScopeRequest`, que devuelve `false` tanto para `undefined` como para `[]`.
- `@Roles()` vacío es la convención ya establecida para «sin rol global; autoriza el servicio»
  (`prior-auth`, `practitioner-settlement-batches`, `insurance-campaigns`; ver
  `docs/modules/insurance.md` y `docs/contracts/insurer-practitioner-settlement-batches.md`).
  No se creó ningún decorador nuevo.
- `coverage-report.mjs` sólo mira escrituras (`POST/PUT/PATCH/DELETE`), da por declarada **toda la
  clase** si el archivo contiene un `@Roles(` en cualquier parte, exime en bloque
  `modules/community/controllers/` (`AUTHN_NON_ROLE_ALLOWLIST`) y lo listado en
  `tools/alovida/exenciones.mjs`. Por eso de estos 115 sólo 8 aparecían como `ORPHAN_ENDPOINT`.

## Decisión

Ninguno de los 125 endpoints revisados estaba abierto: todos tienen la autorización en el servicio,
por titularidad del sujeto de la sesión, membresía en la organización o en la aseguradora activa, o
participación en el recurso. En ninguno corresponde un rol global:

- Las rutas `me` y las de titular las usan pacientes y profesionales que pueden no tener todavía un
  rol (el profesional que se auto-registra, el titular de un dependiente).
- Las de organización y aseguradora las usan OWNER/ADMIN de **ese** tenant, que no tienen
  `SECURITY_ADMIN`. Un rol global les cortaría el acceso, que es el problema que
  `TenantAdministrationService` resolvió.
- La comunidad la usa cualquier cuenta. Lo que se exige es actuar con un perfil propio, sin atajo
  de plataforma para escribir.

En cada endpoint se agregó `@Roles()` vacío y, en la clase, un párrafo con el mecanismo. Ninguno
quedó `@Public()`: el catálogo público del directorio y de la comunidad ya vive en
`CommunityPublicController` con su `@Public()`. Las pruebas
`src/modules/*/…/controllers/authorization-declared.spec.ts` fijan la lista: si una ruta pierde el
decorador o recibe un rol global, fallan.

### Diferencias con el Anexo A

- `POST /insurance/practitioner-requests/:id/approve` y `…/reject`: el Anexo las compone como
  `/practitioners/me/insurer-requests/…` porque toma el `@Controller` de la primera clase del
  archivo. La ruta real es la de `InsurerPractitionerRequestsController`.
- Se sumaron, por compartir controlador y mecanismo: `GET/POST own-admission` (3, dos de ellas
  `ORPHAN_ENDPOINT`), `primary-practitioner` (4, dos `ORPHAN_ENDPOINT`), `PUT
  insurance-carriers/:id/contact-channels` y `PUT insurance-plans/:planId/premium` (la prueba de
  `InsuranceBackboneController` las agrupa con `createPlan`) y `GET
  /insurance/practitioner-requests`.
- Las aserciones `toBeUndefined()` de `insurance-controllers.spec.ts` (lecturas y plan/cobertura) y
  de `admissions.controller.spec.ts` (`OwnAdmissionController`) pasan a `toEqual([])`: siguen
  diciendo «sin rol global», ahora con la declaración explícita.

## Endpoints

### community (54)

| Método | Ruta | Archivo:línea | Decisión |
| --- | --- | --- | --- |
| POST | `/community/groups` | `community/controllers/community-groups.controller.ts:91` | Protegido por `assertOrganizationMayStartForums` + perfil propio (`resolveActorProfileId`) + `assertActorBelongsToAudience` → `@Roles()` |
| POST | `/community/groups/:groupId/members` | `community/controllers/community-groups.controller.ts:108` | Protegido por `CommunityGroupAccessService.resolve` (404 a quien no ve el grupo); el perfil sale de la sesión → `@Roles()` |
| PATCH | `/community/groups/:groupId/members/:member` | `community/controllers/community-groups.controller.ts:126` | Protegido por `access.resolve` + `assertCanAdminister` (administrador del grupo) → `@Roles()` |
| DELETE | `/community/groups/:groupId/members/:member` | `community/controllers/community-groups.controller.ts:159` | Protegido por `access.resolve`; uno mismo o `assertCanAdminister` → `@Roles()` |
| POST | `/community/groups/:groupId/posts` | `community/controllers/community-groups.controller.ts:181` | Protegido por `access.resolve` + `assertCanPost` → `@Roles()` |
| GET | `/community/groups` | `community/controllers/community-groups.controller.ts:201` | Protegido por directorio filtrado: excluye secretos y audiencias no elegibles (`audience.hiddenFrom`) → `@Roles()` |
| GET | `/community/groups/:groupId` | `community/controllers/community-groups.controller.ts:225` | Protegido por `access.resolve` (grupo secreto ajeno → 404) → `@Roles()` |
| GET | `/community/groups/:groupId/members` | `community/controllers/community-groups.controller.ts:237` | Protegido por `assertAudienceVisible` + membresía del lector → `@Roles()` |
| GET | `/community/groups/:groupId/posts` | `community/controllers/community-groups.controller.ts:258` | Protegido por `access.resolve` + `assertCanRead` → `@Roles()` |
| POST | `/community/conversations` | `community/controllers/community-messaging.controller.ts:81` | Protegido por `assertActsAsProfile` sobre el perfil iniciador → `@Roles()` |
| POST | `/community/conversations/:conversationId/messages` | `community/controllers/community-messaging.controller.ts:98` | Protegido por `assertActsAsMessagingProfile` + participante activo → `@Roles()` |
| PATCH | `/community/conversations/:conversationId/messages/:messageId` | `community/controllers/community-messaging.controller.ts:116` | Protegido por `assertActsAsMessagingProfile` + participante activo + autoría/ventana → `@Roles()` |
| DELETE | `/community/conversations/:conversationId/messages/:messageId` | `community/controllers/community-messaging.controller.ts:135` | Protegido por `assertActsAsMessagingProfile` + participante activo → `@Roles()` |
| POST | `/community/conversations/:conversationId/read` | `community/controllers/community-messaging.controller.ts:159` | Protegido por `assertActsAsMessagingProfile` + participante activo → `@Roles()` |
| PATCH | `/community/conversations/:conversationId/participant` | `community/controllers/community-messaging.controller.ts:177` | Protegido por `assertActsAsMessagingProfile` + participante activo → `@Roles()` |
| POST | `/community/conversations/:conversationId/pin` | `community/controllers/community-messaging.controller.ts:197` | Protegido por `assertActsAsMessagingProfile` + participante activo → `@Roles()` |
| DELETE | `/community/conversations/:conversationId/pin` | `community/controllers/community-messaging.controller.ts:215` | Protegido por `assertActsAsMessagingProfile` + participante activo → `@Roles()` |
| POST | `/community/conversations/contacts/search` | `community/controllers/community-messaging.controller.ts:234` | Protegido por `assertOwnProfile` (titularidad estricta) → `@Roles()` |
| GET | `/community/conversations/:conversationId/attachments/:fileId/content` | `community/controllers/community-messaging.controller.ts:261` | Protegido por `assertOwnMessagingProfile` + participante activo + sin bloqueo (404 si no) → `@Roles()` |
| GET | `/community/conversations` | `community/controllers/community-messaging.controller.ts:299` | Protegido por `assertOwnMessagingProfile` → `@Roles()` |
| GET | `/community/conversations/:conversationId/messages` | `community/controllers/community-messaging.controller.ts:317` | Protegido por `assertOwnMessagingProfile` + participante activo + sin bloqueo → `@Roles()` |
| GET | `/community/conversations/:conversationId/presence` | `community/controllers/community-messaging.controller.ts:334` | Protegido por `assertOwnMessagingProfile` + participante activo → `@Roles()` |
| POST | `/community/reports` | `community/controllers/community-moderation.controller.ts:71` | Protegido por cualquier cuenta puede denunciar; denunciante = sesión, va a la cola de `SECURITY_ADMIN` → `@Roles()` |
| POST | `/community/moderation/decisions/:decisionId/appeal` | `community/controllers/community-moderation.controller.ts:106` | Protegido por `assertActsAsProfile` sobre el perfil sancionado → `@Roles()` |
| POST | `/community/posts/:postId/polls` | `community/controllers/community-polls.controller.ts:54` | Protegido por `assertActsAsProfile` (autor de la publicación) → `@Roles()` |
| POST | `/community/polls/:pollId/votes` | `community/controllers/community-polls.controller.ts:72` | Protegido por `assertActsAsProfile` (votante) → `@Roles()` |
| GET | `/community/polls/:pollId` | `community/controllers/community-polls.controller.ts:85` | Protegido por `canViewPost` con el perfil del lector → `@Roles()` |
| POST | `/community/profiles/:profileId/reviews` | `community/controllers/community-reviews.controller.ts:62` | Protegido por perfil de paciente en la sesión + `assertEligibleCare` → `@Roles()` |
| GET | `/community/profiles/:profileId/reviews` | `community/controllers/community-reviews.controller.ts:80` | Protegido por sólo vitrinas públicas (404 si no) → `@Roles()` |
| POST | `/community/profiles/:profileId/reviews/:reviewId/responses` | `community/controllers/community-reviews.controller.ts:106` | Protegido por `assertActsAsProfile` sobre la vitrina reseñada → `@Roles()` |
| PUT | `/community/profiles/me` | `community/controllers/community-social.controller.ts:137` | Protegido por el perfil sale de la sesión; archivos con `assertUsableBy` → `@Roles()` |
| POST | `/community/profiles/:profileId/posts` | `community/controllers/community-social.controller.ts:201` | Protegido por `assertActsAsProfile` (sin atajo de plataforma) → `@Roles()` |
| POST | `/community/comments` | `community/controllers/community-social.controller.ts:219` | Protegido por `assertActsAsProfile` → `@Roles()` |
| PUT | `/community/reactions` | `community/controllers/community-social.controller.ts:235` | Protegido por `assertActsAsProfile` → `@Roles()` |
| POST | `/community/bookmarks` | `community/controllers/community-social.controller.ts:254` | Protegido por `assertActsAsProfile` → `@Roles()` |
| POST | `/community/follows` | `community/controllers/community-social.controller.ts:271` | Protegido por `assertActsAsProfile` → `@Roles()` |
| POST | `/community/blocks` | `community/controllers/community-social.controller.ts:288` | Protegido por `assertActsAsProfile` → `@Roles()` |
| DELETE | `/community/follows` | `community/controllers/community-social.controller.ts:311` | Protegido por `assertActsAsProfile` → `@Roles()` |
| DELETE | `/community/bookmarks` | `community/controllers/community-social.controller.ts:327` | Protegido por `assertActsAsProfile` → `@Roles()` |
| DELETE | `/community/blocks` | `community/controllers/community-social.controller.ts:343` | Protegido por `assertActsAsProfile` → `@Roles()` |
| GET | `/community/profiles/:profileId/auto-reply` | `community/controllers/community-social.controller.ts:387` | Protegido por `assertActsAsMessagingProfile` → `@Roles()` |
| PUT | `/community/profiles/:profileId/auto-reply` | `community/controllers/community-social.controller.ts:409` | Protegido por `assertActsAsMessagingProfile` → `@Roles()` |
| GET | `/community/profiles/:profileId` | `community/controllers/community-social.controller.ts:422` | Protegido por perfil del lector + bloqueos (404) → `@Roles()` |
| GET | `/community/profiles/:profileId/posts` | `community/controllers/community-social.controller.ts:433` | Protegido por `canViewPost` por publicación → `@Roles()` |
| GET | `/community/posts/:postId` | `community/controllers/community-social.controller.ts:451` | Protegido por `canViewPost` → `@Roles()` |
| GET | `/community/posts/:postId/comments` | `community/controllers/community-social.controller.ts:463` | Protegido por `assertPostVisible` → `@Roles()` |
| GET | `/community/comments/media/:fileId/content` | `community/controllers/community-social.controller.ts:489` | Protegido por `assertPostVisible` del post del comentario → `@Roles()` |
| GET | `/community/posts/:postId/reactions` | `community/controllers/community-social.controller.ts:511` | Protegido por `assertPostVisible` → `@Roles()` |
| GET | `/community/follows` | `community/controllers/community-social.controller.ts:525` | Protegido por `assertOwnProfile` → `@Roles()` |
| GET | `/community/bookmarks` | `community/controllers/community-social.controller.ts:541` | Protegido por `assertOwnProfile` → `@Roles()` |
| GET | `/community/blocks` | `community/controllers/community-social.controller.ts:559` | Protegido por `assertOwnProfile` → `@Roles()` |
| GET | `/community/feed` | `community/controllers/community-timeline.controller.ts:38` | Protegido por `assertOwnProfile` → `@Roles()` |
| GET | `/community/notifications` | `community/controllers/community-timeline.controller.ts:54` | Protegido por `assertOwnProfile` → `@Roles()` |
| GET | `/community/topics` | `community/controllers/community-topics.controller.ts:31` | Protegido por catálogo sin datos personales; alcanza la sesión → `@Roles()` |

### profiles (34)

| Método | Ruta | Archivo:línea | Decisión |
| --- | --- | --- | --- |
| GET | `/profiles/practitioners/me/admission` | `profiles/presentation/controllers/own-admission.controller.ts:46` | Protegido por `ownLocked` (sujeto de la sesión) → `@Roles()` |
| POST | `/profiles/practitioners/me/admission/resubmit` | `profiles/presentation/controllers/own-admission.controller.ts:58` | Protegido por `ownLocked` (sujeto de la sesión) → `@Roles()` |
| POST | `/profiles/practitioners/me/admission/withdraw` | `profiles/presentation/controllers/own-admission.controller.ts:81` | Protegido por `ownLocked` (sujeto de la sesión) → `@Roles()` |
| GET | `/profiles/patients/me/addresses` | `profiles/presentation/controllers/patient-address-book.controller.ts:51` | Protegido por `resolveOwnPersonId` (persona de la sesión) → `@Roles()` |
| POST | `/profiles/patients/me/addresses` | `profiles/presentation/controllers/patient-address-book.controller.ts:63` | Protegido por `resolveOwnPersonId` → `@Roles()` |
| PATCH | `/profiles/patients/me/addresses/:id` | `profiles/presentation/controllers/patient-address-book.controller.ts:79` | Protegido por `resolveOwnPersonId` + `findOwn` (404 ajena) → `@Roles()` |
| DELETE | `/profiles/patients/me/addresses/:id` | `profiles/presentation/controllers/patient-address-book.controller.ts:98` | Protegido por `resolveOwnPersonId` + `findOwn` → `@Roles()` |
| PUT | `/profiles/patients/me/addresses/:id/preferred` | `profiles/presentation/controllers/patient-address-book.controller.ts:114` | Protegido por `resolveOwnPersonId` + `findOwn` → `@Roles()` |
| GET | `/profiles/practitioners/me/signature-assets` | `profiles/presentation/controllers/practitioner-signature-assets.controller.ts:31` | Protegido por `requireOwnPractitionerProfileId` → `@Roles()` |
| PUT | `/profiles/practitioners/me/signature-assets` | `profiles/presentation/controllers/practitioner-signature-assets.controller.ts:46` | Protegido por `requireOwnPractitionerProfileId` (ya en `exenciones.mjs`) → `@Roles()` |
| GET | `/profiles/patients/me/primary-practitioner` | `profiles/presentation/controllers/primary-practitioner.controller.ts:39` | Protegido por `resolveOwnPatientId` → `@Roles()` |
| PUT | `/profiles/patients/me/primary-practitioner` | `profiles/presentation/controllers/primary-practitioner.controller.ts:54` | Protegido por `resolveOwnPatientId` → `@Roles()` |
| DELETE | `/profiles/patients/me/primary-practitioner` | `profiles/presentation/controllers/primary-practitioner.controller.ts:74` | Protegido por `resolveOwnPatientId` → `@Roles()` |
| GET | `/profiles/practitioners/me/primary-patients` | `profiles/presentation/controllers/primary-practitioner.controller.ts:84` | Protegido por `resolveOwnPractitionerId` → `@Roles()` |
| GET | `/profiles/patients/me/summary` | `profiles/presentation/controllers/profiles-patients.controller.ts:102` | Protegido por `resolveOwnPatient` → `@Roles()` |
| DELETE | `/profiles/patients/me/photo` | `profiles/presentation/controllers/profiles-patients.controller.ts:211` | Protegido por `resolveOwnPatient` → `@Roles()` |
| POST | `/profiles/patients/me/dependents` | `profiles/presentation/controllers/profiles-patients.controller.ts:261` | Protegido por `resolveOwnPatient` (titular) → `@Roles()` |
| POST | `/profiles/patients/:profileId/related-persons` | `profiles/presentation/controllers/profiles-patients.controller.ts:544` | Protegido por `ProfileOwnershipService.assertOwnsPatientProfile` (titular o plataforma global) → `@Roles()` |
| PUT | `/profiles/practitioners/:profileId/photo` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:318` | Protegido por `assertOwnsPractitionerProfile` (titular o plataforma global) → `@Roles()` |
| DELETE | `/profiles/practitioners/:profileId/photo` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:349` | Protegido por `assertOwnsPractitionerProfile` → `@Roles()` |
| POST | `/profiles/practitioners/:profileId/jurisdiction-authorizations` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:384` | Protegido por `assertOwnsPractitionerProfile` → `@Roles()` |
| GET | `/profiles/practitioners/me/affiliations` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:454` | Protegido por `requireOwnPractitionerProfileId` → `@Roles()` |
| POST | `/profiles/practitioners/me/affiliations` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:471` | Protegido por `requireOwnPractitionerProfileId` → `@Roles()` |
| PATCH | `/profiles/practitioners/me/affiliations/:affiliationId` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:497` | Protegido por `ownOrNothing` → `requireOwnPractitionerProfileId` (404 ajena) → `@Roles()` |
| DELETE | `/profiles/practitioners/me/affiliations/:affiliationId` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:524` | Protegido por `requireOwnPractitionerProfileId` → `@Roles()` |
| POST | `/profiles/practitioners/me/credentials` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:552` | Protegido por `requireOwnPractitionerProfileId` + `assertUsableBy` → `@Roles()` |
| PATCH | `/profiles/practitioners/me/credentials/:credentialId` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:576` | Protegido por `requireOwnPractitionerProfileId` + `assertUsableBy` → `@Roles()` |
| DELETE | `/profiles/practitioners/me/credentials/:credentialId` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:614` | Protegido por `requireOwnPractitionerProfileId` → `@Roles()` |
| POST | `/profiles/practitioners/:profileId/specialties` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:666` | Protegido por `assertOwnsPractitionerProfile` → `@Roles()` |
| PATCH | `/profiles/practitioners/me/specialties/:specialtyId/primary` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:689` | Protegido por `requireOwnPractitionerProfileId` → `@Roles()` |
| PATCH | `/profiles/practitioners/me/specialties/:specialtyId` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:714` | Protegido por `requireOwnPractitionerProfileId` → `@Roles()` |
| DELETE | `/profiles/practitioners/me/specialties/:specialtyId` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:741` | Protegido por `requireOwnPractitionerProfileId` → `@Roles()` |
| PATCH | `/profiles/practitioners/me/jurisdiction-authorizations/:licenseId` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:763` | Protegido por `lockOwnEditableLicense` → `requireOwnPractitionerProfileId` → `@Roles()` |
| DELETE | `/profiles/practitioners/me/jurisdiction-authorizations/:licenseId` | `profiles/presentation/controllers/profiles-practitioners.controller.ts:786` | Protegido por `lockOwnEditableLicense` → `requireOwnPractitionerProfileId` → `@Roles()` |

### directory (19)

| Método | Ruta | Archivo:línea | Decisión |
| --- | --- | --- | --- |
| GET | `/tenants/:tenantId/logo` | `directory/controllers/organization-logo.controller.ts:34` | Protegido por `assertCanRead` → `@Roles()` |
| PUT | `/tenants/:tenantId/logo` | `directory/controllers/organization-logo.controller.ts:49` | Protegido por `assertCanAdminister` + `assertUsableBy` → `@Roles()` |
| GET | `/tenants/:tenantId/logo/content` | `directory/controllers/organization-logo.controller.ts:62` | Protegido por `get` (membresía) + `assertUsableForAuthorizedContext` → `@Roles()` |
| PATCH | `/tenants/:tenantId` | `directory/controllers/tenants.controller.ts:139` | Protegido por `TenantAdministrationService.assertCanAdminister` (OWNER/ADMIN o plataforma) → `@Roles()` |
| POST | `/tenants/:tenantId/affiliation-documents` | `directory/controllers/tenants.controller.ts:162` | Protegido por `assertAuthorized(…, administer)` (OWNER/ADMIN o plataforma) → `@Roles()` |
| GET | `/tenants/:tenantId/pharmacy-readiness` | `directory/controllers/tenants.controller.ts:183` | Protegido por `assertAuthorized(…, read)` → `@Roles()` |
| GET | `/tenants/:tenantId/laboratory-readiness` | `directory/controllers/tenants.controller.ts:199` | Protegido por `assertAuthorized(…, read)` → `@Roles()` |
| GET | `/tenants/:tenantId` | `directory/controllers/tenants.controller.ts:213` | Protegido por `TenantAdministrationService.assertCanRead` (membresía activa, no SUPPORT, o plataforma) → `@Roles()` |
| GET | `/tenants/:tenantId/child-tenants` | `directory/controllers/tenants.controller.ts:224` | Protegido por `forkForReadableTenant` → `TenantAdministrationService.assertCanRead` (membresía activa, no SUPPORT, o plataforma) → `@Roles()` |
| GET | `/tenants/:tenantId/branches` | `directory/controllers/tenants.controller.ts:243` | Protegido por `forkForReadableTenant` → `assertCanRead` → `@Roles()` |
| GET | `/tenants/:tenantId/memberships` | `directory/controllers/tenants.controller.ts:254` | Protegido por `forkForReadableTenant` → `assertCanRead` → `@Roles()` |
| GET | `/tenants/:tenantId/memberships/:membershipId/branch-assignments` | `directory/controllers/tenants.controller.ts:280` | Protegido por `forkForReadableTenant` → `assertCanRead` → `@Roles()` |
| POST | `/tenants/:tenantId/branches` | `directory/controllers/tenants.controller.ts:319` | Protegido por `TenantAdministrationService.assertCanAdminister` (OWNER/ADMIN o plataforma) → `@Roles()` |
| PATCH | `/tenants/:tenantId/branches/:branchId` | `directory/controllers/tenants.controller.ts:339` | Protegido por `assertCanAdminister` → `@Roles()` |
| POST | `/tenants/:tenantId/memberships` | `directory/controllers/tenants.controller.ts:357` | Protegido por `assertCanAdminister` (+ `assertCanChangeOwnership` para OWNER) → `@Roles()` |
| POST | `/tenants/:tenantId/memberships/:membershipId/branch-assignments` | `directory/controllers/tenants.controller.ts:375` | Protegido por `assertCanAdminister` → `@Roles()` |
| POST | `/tenants/:tenantId/memberships/:membershipId/transfer` | `directory/controllers/tenants.controller.ts:399` | Protegido por `assertCanAdminister` → `@Roles()` |
| PATCH | `/tenants/:tenantId/memberships/:membershipId/role` | `directory/controllers/tenants.controller.ts:418` | Protegido por `assertCanAdminister` (+ cambio de dueño) → `@Roles()` |
| POST | `/tenants/:tenantId/memberships/:membershipId/offboard` | `directory/controllers/tenants.controller.ts:442` | Protegido por `assertCanAdminister` (+ `assertCanChangeOwnership`, último OWNER) → `@Roles()` |

### insurance (18)

| Método | Ruta | Archivo:línea | Decisión |
| --- | --- | --- | --- |
| PUT | `/insurance-carriers/:id/contact-channels` | `insurance/presentation/controllers/insurance-backbone.controller.ts:107` | Protegido por `administrableCarrier` (OWNER/ADMIN del tenant de la aseguradora o plataforma) → `@Roles()` |
| POST | `/insurance-products/:productId/plans` | `insurance/presentation/controllers/insurance-backbone.controller.ts:160` | Protegido por `administrableCarrier` + `findProductForCarrier` → `@Roles()` |
| POST | `/insurance-plans/:planId/benefits` | `insurance/presentation/controllers/insurance-backbone.controller.ts:185` | Protegido por `administrableCarrier` + `findPlanForCarrier` → `@Roles()` |
| PUT | `/insurance-plans/:planId/benefits/:benefitId` | `insurance/presentation/controllers/insurance-backbone.controller.ts:203` | Protegido por `administrableCarrier` + `findPlanForCarrier` → `@Roles()` |
| PUT | `/insurance-plans/:planId/benefits/:benefitId/rules` | `insurance/presentation/controllers/insurance-backbone.controller.ts:221` | Protegido por `administrableCarrier` + `findPlanForCarrier` → `@Roles()` |
| PUT | `/insurance-plans/:planId/premium` | `insurance/presentation/controllers/insurance-backbone.controller.ts:244` | Protegido por `administrableCarrier` + `findPlanForCarrier` → `@Roles()` |
| GET | `/insurance-carriers` | `insurance/presentation/controllers/insurance-read.controller.ts:51` | Protegido por tenant activo resuelto por membresía (`resolveOrdinaryTenantId`, 403 sin ella) → `@Roles()` |
| GET | `/insurance-carriers/:id` | `insurance/presentation/controllers/insurance-read.controller.ts:67` | Protegido por tenant activo por membresía; id ajeno → 404 → `@Roles()` |
| GET | `/insurance-brokers` | `insurance/presentation/controllers/insurance-read.controller.ts:85` | Protegido por tenant activo por membresía → `@Roles()` |
| GET | `/insurance-brokers/:id` | `insurance/presentation/controllers/insurance-read.controller.ts:99` | Protegido por tenant activo por membresía; id ajeno → 404 → `@Roles()` |
| GET | `/insurance-brokers/:id/clients` | `insurance/presentation/controllers/insurance-read.controller.ts:118` | Protegido por tenant activo por membresía; id ajeno → 404 → `@Roles()` |
| POST | `/insurance/patients/search` | `insurance/presentation/controllers/insurer-patients.controller.ts:44` | Protegido por `resolveScope`: plataforma, o OWNER/ADMIN/`INSURANCE_OPERATOR` vigente en la aseguradora activa → `@Roles()` |
| GET | `/insurance/patients/options` | `insurance/presentation/controllers/insurer-patients.controller.ts:65` | Protegido por `resolveScope` → `@Roles()` |
| POST | `/insurance/patients/conversation` | `insurance/presentation/controllers/insurer-patients.controller.ts:85` | Protegido por `resolveScope` + revalida cobertura → `@Roles()` |
| GET | `/insurance/my-claims` | `insurance/presentation/controllers/my-claims.controller.ts:35` | Protegido por sujeto del token (perfil profesional / paciente); vista de centro exige membresía del tenant declarado → `@Roles()` |
| GET | `/insurance/practitioner-requests` | `insurance/presentation/controllers/practitioner-insurer-requests.controller.ts:134` | Protegido por `InsurerContextService.resolve` (aseguradora activa) → `@Roles()` |
| POST | `/insurance/practitioner-requests/:id/approve` | `insurance/presentation/controllers/practitioner-insurer-requests.controller.ts:157` | Protegido por `InsurerContextService.resolve` + `findForCarrier` (404 ajena) → `@Roles()` |
| POST | `/insurance/practitioner-requests/:id/reject` | `insurance/presentation/controllers/practitioner-insurer-requests.controller.ts:179` | Protegido por `InsurerContextService.resolve` + `findForCarrier` (404 ajena) → `@Roles()` |

## Informe de cobertura, antes y después

`node tools/alovida/coverage-report.mjs`, sección `ORPHAN_ENDPOINT`, filtrada a
`src/modules/{community,profiles,directory,insurance}/`.

Antes (`origin/dev` `78dd3646`, total del informe: 27):

```text
src/modules/profiles/presentation/controllers/own-admission.controller.ts:56 — @Post 'resubmit'
src/modules/profiles/presentation/controllers/own-admission.controller.ts:78 — @Post 'withdraw'
src/modules/profiles/presentation/controllers/patient-address-book.controller.ts:58 — @Post
src/modules/profiles/presentation/controllers/patient-address-book.controller.ts:73 — @Patch ':id'
src/modules/profiles/presentation/controllers/patient-address-book.controller.ts:91 — @Delete ':id'
src/modules/profiles/presentation/controllers/patient-address-book.controller.ts:106 — @Put ':id/preferred'
src/modules/profiles/presentation/controllers/primary-practitioner.controller.ts:52 — @Put 'patients/me/primary-practitioner'
src/modules/profiles/presentation/controllers/primary-practitioner.controller.ts:71 — @Delete 'patients/me/primary-practitioner'
```

Después (total del informe: 19; los 19 son de otros módulos):

```text
(ninguno)
```

Lectura estricta por método (la del Anexo: endpoint sin `@Roles(`/`@Public(` en su bloque de
decoradores ni en la clase, todos los verbos) sobre los cuatro módulos: **162 → 37** de 280.

### Los 37 que quedan sin decorador

Ninguno está en el Anexo A: cada uno tiene en el código un comentario «Sin `@Roles`» que explica
su autorización, o está en `tools/alovida/exenciones.mjs`. Este lote no los cambió.

```text
GET	src/modules/community/controllers/community-moderation.controller.ts:161	'moderation/decisions/mine'
GET	src/modules/community/controllers/community-social.controller.ts:120	'profiles/me'
GET	src/modules/community/controllers/community-social.controller.ts:159	'profiles/me/stats'
GET	src/modules/community/controllers/community-social.controller.ts:185	'profiles/organization-showcases/me'
GET	src/modules/community/controllers/community-social.controller.ts:369	'profiles/by-slug/:slug'
PUT	src/modules/community/controllers/party-ratings.controller.ts:45	
GET	src/modules/community/controllers/party-ratings.controller.ts:64	'summary'
GET	src/modules/community/controllers/party-ratings.controller.ts:77	'mine'
GET	src/modules/community/controllers/party-ratings.controller.ts:92	
GET	src/modules/directory/controllers/tenants.controller.ts:115	'me'
GET	src/modules/insurance/presentation/controllers/insurance-analytics.controller.ts:40	'loss-ratio'
POST	src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:62	'export'
GET	src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:84	'certificates/:certificateId/pdf'
GET	src/modules/insurance/presentation/controllers/insurance-portability.controller.ts:122	'certificates/:certificateId/json'
GET	src/modules/insurance/presentation/controllers/insurer-received-claims.controller.ts:67	
POST	src/modules/insurance/presentation/controllers/insurer-received-claims.controller.ts:101	':id/decision'
POST	src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:78	'patients/me/dependent-requests'
GET	src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:117	'patients/me/dependent-candidates'
GET	src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:142	'patients/me/dependent-requests/incoming'
POST	src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:164	'patients/me/dependent-requests/:id/accept'
POST	src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:191	'patients/me/dependent-requests/:id/reject'
GET	src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:126	'patients/me'
PATCH	src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:157	'patients/me'
PUT	src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:189	'patients/me/photo'
GET	src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:229	'patients/me/dependents'
GET	src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:102	'practitioners/me/summary'
GET	src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:126	'practitioners/me/onboarding'
GET	src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:153	'practitioners'
GET	src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:200	'practitioners/specialty-counts'
GET	src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:219	'practitioners/:profileId/summary'
PATCH	src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:247	'practitioners/me'
PATCH	src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:274	'practitioners/:profileId'
GET	src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:422	'practitioners/me/linkable-organizations'
GET	src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:58	':tenantId/practitioner-requests'
POST	src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:78	':tenantId/practitioner-requests/:affiliationId/approve'
POST	src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:95	':tenantId/practitioner-requests/:affiliationId/reject'
POST	src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:123	':tenantId/practitioner-requests/:affiliationId/revoke'
```
